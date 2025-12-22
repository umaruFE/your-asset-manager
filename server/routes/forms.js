import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import ExcelJS from 'exceljs';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole, checkFormPermission } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();
const ARCHIVE_STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'archives');
let archiveDirReady = false;

async function ensureArchiveDir() {
    if (!archiveDirReady) {
        await fs.mkdir(ARCHIVE_STORAGE_DIR, { recursive: true });
        archiveDirReady = true;
    }
}

function sanitizeFileName(name) {
    return name.replace(/[^0-9a-zA-Z\u4e00-\u9fa5-_]/g, '_');
}

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function isPathInside(childPath, parentPath) {
    const normalizedParent = path.resolve(parentPath);
    const normalizedChild = path.resolve(childPath);
    const relativePath = path.relative(normalizedParent, normalizedChild);
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

// 获取所有表单（根据权限过滤）
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        let query = 'SELECT * FROM forms WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        const requestedArchiveStatus = req.query.archiveStatus;

        // 超级管理员和公司资产管理角色可以看到所有表单（包括禁用的和已归档的）
        // 其他角色只能看到激活且未归档的表单，并且需要通过权限表过滤
        if (req.user.role === 'superadmin' || req.user.role === 'company_asset') {
            // 超级管理员和公司资产管理角色可以看到所有表单
            if (requestedArchiveStatus) {
                query += ` AND archive_status = $${paramIndex++}`;
                params.push(requestedArchiveStatus);
            }
        } else {
            // 其他角色只能看到激活且未归档的表单
            query += ` AND is_active = true AND archive_status = $${paramIndex++}`;
            params.push('active');

            query += ` AND id IN (
                SELECT form_id FROM user_form_permissions 
                WHERE user_id = $${paramIndex++} AND can_view = true
            )`;
            params.push(req.user.id);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        // 获取当前用户的提交/查看权限映射（用于前端筛选可提交表单）
        let permissionMap = {};
        if (req.user.role !== 'superadmin') {
            try {
                const permResult = await pool.query(
                    `SELECT form_id, COALESCE(can_submit, can_edit, false) AS can_submit, COALESCE(can_view, false) AS can_view
                     FROM user_form_permissions
                     WHERE user_id = $1`,
                    [req.user.id]
                );
                permResult.rows.forEach(p => {
                    permissionMap[p.form_id] = {
                        can_submit: p.can_submit === true,
                        can_view: p.can_view === true
                    };
                });
            } catch (err) {
                console.error('Error fetching user_form_permissions:', err);
                permissionMap = {};
            }
        }

        // 获取每个表单的字段
        for (let form of result.rows) {
            // 补充权限标记：can_submit / can_view
            if (req.user.role === 'superadmin') {
                form.can_submit = true;
                form.can_view = true;
            } else {
                const perm = permissionMap[form.id];
                form.can_submit = perm ? perm.can_submit : false;
                form.can_view = perm ? perm.can_view : false;
            }

            // 超级管理员可以看到所有字段（包括已归档的），其他角色只能看到激活的字段
            const fieldsQuery = req.user.role === 'superadmin'
                ? 'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC'
                : 'SELECT * FROM form_fields WHERE form_id = $1 AND active = true ORDER BY "order" ASC';

            const fieldsResult = await pool.query(fieldsQuery, [form.id]);
            // 新 migration 后，required 为独立列，直接使用数据库返回的值
            form.fields = fieldsResult.rows;
        }

        // 转换字段名从下划线到驼峰
        const camelRows = result.rows.map(row => toCamelCaseObject(row));

        res.json(camelRows);
    } catch (error) {
        console.error('Error fetching forms:', error);
        next(error);
    }
});

// 获取单个表单
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM forms WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }

        const form = result.rows[0];

        // 权限检查：超级管理员可以查看所有表单，其他角色需要检查权限
        if (req.user.role !== 'superadmin') {
            // 检查用户是否有权限查看此表单
            const permResult = await pool.query(
                'SELECT can_view FROM user_form_permissions WHERE user_id = $1 AND form_id = $2',
                [req.user.id, form.id]
            );

            if (permResult.rows.length === 0 || !permResult.rows[0].can_view) {
                return res.status(403).json({ error: 'Access denied: No permission to view this form' });
            }

            // 非超级管理员只能查看激活且未归档的表单
            if (!form.is_active || form.archive_status !== 'active') {
                return res.status(403).json({ error: 'Access denied: Form is not available' });
            }
        }

        // 获取字段（超级管理员可以看到所有字段，其他角色只能看到激活的字段）
        const fieldsQuery = req.user.role === 'superadmin'
            ? 'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC'
            : 'SELECT * FROM form_fields WHERE form_id = $1 AND active = true ORDER BY "order" ASC';

        const fieldsResult = await pool.query(fieldsQuery, [form.id]);
        form.fields = fieldsResult.rows;

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(form));
    } catch (error) {
        next(error);
    }
});

// 创建表单（仅超级管理员）
router.post('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, isActive = true } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Form name is required' });
        }

        const id = generateId();
        await pool.query(
            'INSERT INTO forms (id, name, is_active) VALUES ($1, $2, $3)',
            [id, name, isActive]
        );

        const result = await pool.query('SELECT * FROM forms WHERE id = $1', [id]);
        result.rows[0].fields = [];

        // 转换字段名从下划线到驼峰
        res.status(201).json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 更新表单（仅超级管理员）
router.put('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, isActive, archiveStatus } = req.body;

        const existingFormResult = await pool.query('SELECT * FROM forms WHERE id = $1', [req.params.id]);
        if (existingFormResult.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        const existingForm = existingFormResult.rows[0];

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(name);
        }
        if (isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex++}`);
            updateValues.push(isActive);
        }
        if (archiveStatus !== undefined) {
            if (!['active', 'archived'].includes(archiveStatus)) {
                return res.status(400).json({ error: 'Invalid archive status' });
            }
            updateFields.push(`archive_status = $${paramIndex++}`);
            updateValues.push(archiveStatus);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.params.id);

        await pool.query(
            `UPDATE forms SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
            updateValues
        );

        const result = await pool.query('SELECT * FROM forms WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }

        const form = result.rows[0];
        const fieldsResult = await pool.query(
            'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC',
            [form.id]
        );
        form.fields = fieldsResult.rows;

        if (name && name !== existingForm.name) {
            await updateFormNameReferences(existingForm.name, name);
        }

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(form));
    } catch (error) {
        next(error);
    }
});

// 删除表单（仅超级管理员）
router.delete('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 删除相关的资产记录
        await client.query('DELETE FROM assets WHERE form_id = $1', [req.params.id]);

        // 2. 删除相关的字段定义 (虽然有级联删除，但在事务中显式删除更安全清晰)
        await client.query('DELETE FROM form_fields WHERE form_id = $1', [req.params.id]);

        // 3. 删除相关的权限记录 (虽然有级联删除，但在事务中显式删除更安全清晰)
        await client.query('DELETE FROM user_form_permissions WHERE form_id = $1', [req.params.id]);

        // 4. 删除表单本身
        await client.query('DELETE FROM forms WHERE id = $1', [req.params.id]);

        await client.query('COMMIT');
        res.json({ message: 'Form and all associated data deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

// 字段管理
// 添加字段
router.post('/:formId/fields', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, type, active = true, order, formula, displayPrecision, options } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Field name and type are required' });
        }

        if (type === 'select' && (!Array.isArray(options) || options.length === 0)) {
            return res.status(400).json({ error: '下拉字段必须至少包含一个选项' });
        }

        const id = generateId();
        const fieldKey = req.body.fieldKey || generateId();
        const resolvedOrder = order !== undefined ? order : await getMaxOrder(req.params.formId);
        const precision =
            typeof displayPrecision === 'number' && displayPrecision >= 0
                ? Math.min(displayPrecision, 6)
                : 0;
        const normalizedOptions = Array.isArray(options)
            ? options.map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt))).filter(Boolean)
            : null;

        // Insert with explicit required column (migration adds this column)
        const requiredFlag = typeof req.body.required !== 'undefined' ? !!req.body.required : false;

        await pool.query(
            'INSERT INTO form_fields (id, form_id, field_key, name, type, display_precision, active, "order", formula, options, required) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
            [id, req.params.formId, fieldKey, name, type, precision, active, resolvedOrder + 1, formula || null, normalizedOptions ? JSON.stringify(normalizedOptions) : null, requiredFlag]
        );

        // 同步更新未归档资产记录：为新字段添加空值
        if (active) {
            await syncAddFieldToAssets(req.params.formId, id, type);
        }

        const result = await pool.query('SELECT * FROM form_fields WHERE id = $1', [id]);
        const newRow = result.rows[0];
        // 转换字段名从下划线到驼峰
        res.status(201).json(toCamelCaseObject(newRow));
    } catch (error) {
        next(error);
    }
});

// 更新字段顺序（批量）- 必须在更新单个字段路由之前，否则 "order" 会被当作 fieldId
router.put('/:formId/fields/order', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    console.log('[Update Field Order] ====== START ======');
    console.log('[Update Field Order] Request received:', {
        method: req.method,
        url: req.url,
        formId: req.params.formId,
        body: req.body,
        user: req.user?.id
    });
    
    try {
        const { fieldOrders } = req.body; // [{ fieldId, order }, ...]
        const formId = req.params.formId;

        console.log('[Update Field Order] Request:', { formId, fieldOrdersCount: fieldOrders?.length });

        if (!Array.isArray(fieldOrders)) {
            return res.status(400).json({ error: 'fieldOrders must be an array' });
        }

        if (fieldOrders.length === 0) {
            return res.status(400).json({ error: 'fieldOrders array is empty' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 验证表单是否存在
            const formCheck = await client.query('SELECT id FROM forms WHERE id = $1', [formId]);
            if (formCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ 
                    error: 'Form not found',
                    message: `表单 ${formId} 不存在`
                });
            }

            // 验证所有字段是否存在
            // 统一处理字段ID：trim并过滤空值
            const fieldIds = fieldOrders
                .map(fo => fo.fieldId ? String(fo.fieldId).trim() : null)
                .filter(Boolean);
            
            if (fieldIds.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Invalid field IDs',
                    message: '所有字段ID都无效'
                });
            }

            if (fieldIds.length !== fieldOrders.length) {
                console.warn('[Update Field Order] Some field IDs are empty:', {
                    total: fieldOrders.length,
                    valid: fieldIds.length
                });
            }

            console.log('[Update Field Order] Checking fields:', { formId, fieldIds, fieldIdsCount: fieldIds.length });

            // 检查所有字段（包括已删除的字段，因为我们需要更新它们的顺序）
            let checkResult;
            try {
                checkResult = await client.query(
                    'SELECT id, name, active FROM form_fields WHERE id = ANY($1::text[]) AND form_id = $2',
                    [fieldIds, formId]
                );
            } catch (queryError) {
                await client.query('ROLLBACK');
                console.error('[Update Field Order] Query error:', queryError);
                return res.status(500).json({ 
                    error: 'Database query failed',
                    message: `查询字段时出错: ${queryError.message}`,
                    details: queryError
                });
            }

            // 统一处理：使用trim后的ID进行比较
            const existingFieldIds = new Set(checkResult.rows.map(r => String(r.id).trim()));
            const missingFieldIds = fieldIds.filter(id => !existingFieldIds.has(id));
            
            // 获取表单中的所有字段（用于调试）
            const allFormFields = await client.query(
                'SELECT id, name, active, "order" FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC',
                [formId]
            );

            console.log('[Update Field Order] Field check result:', {
                requested: fieldIds.length,
                found: existingFieldIds.size,
                missing: missingFieldIds.length,
                missingIds: missingFieldIds,
                foundFields: checkResult.rows.map(r => ({ id: r.id, name: r.name, active: r.active })),
                allFormFields: allFormFields.rows.map(r => ({ id: r.id, name: r.name, active: r.active, order: r.order }))
            });

            if (missingFieldIds.length > 0) {
                await client.query('ROLLBACK');
                const errorMsg = `以下字段不存在或不属于此表单: ${missingFieldIds.join(', ')}`;
                console.error('[Update Field Order] Missing fields:', errorMsg);
                return res.status(404).json({ 
                    error: 'Field not found',
                    message: errorMsg,
                    missingFieldIds: missingFieldIds
                });
            }

            // 更新字段顺序
            const updateResults = [];
            for (const { fieldId, order } of fieldOrders) {
                if (!fieldId || order === undefined || order === null) {
                    console.warn('[Update Field Order] Skipping invalid field order:', { fieldId, order });
                    continue;
                }

                // 确保fieldId是字符串并trim（与验证时保持一致）
                const fieldIdStr = String(fieldId).trim();
                if (!fieldIdStr) {
                    console.warn('[Update Field Order] Empty fieldId, skipping:', { fieldId, order });
                    continue;
                }

                // 确保fieldId在已验证的字段列表中（使用trim后的ID进行比较）
                if (!existingFieldIds.has(fieldIdStr)) {
                    console.error('[Update Field Order] Field not in verified list:', { 
                        fieldId: fieldIdStr,
                        existingFieldIds: Array.from(existingFieldIds),
                        requestedFieldIds: fieldIds
                    });
                    await client.query('ROLLBACK');
                    return res.status(404).json({ 
                        error: 'Field not found',
                        message: `字段 ${fieldIdStr} 未通过验证或不属于此表单`,
                        fieldId: fieldIdStr,
                        existingFieldIds: Array.from(existingFieldIds).slice(0, 5) // 只返回前5个作为示例
                    });
                }

                console.log('[Update Field Order] Updating field:', { fieldId: fieldIdStr, order, formId });

                let updateResult;
                try {
                    updateResult = await client.query(
                        'UPDATE form_fields SET "order" = $1 WHERE id = $2 AND form_id = $3',
                        [order, fieldIdStr, formId]
                    );
                } catch (updateError) {
                    await client.query('ROLLBACK');
                    console.error('[Update Field Order] Update query error:', updateError);
                    return res.status(500).json({ 
                        error: 'Update failed',
                        message: `更新字段 ${fieldIdStr} 时出错: ${updateError.message}`,
                        fieldId: fieldIdStr
                    });
                }
                
                console.log('[Update Field Order] Update result:', { 
                    fieldId: fieldIdStr, 
                    rowCount: updateResult.rowCount 
                });

                if (updateResult.rowCount === 0) {
                    console.error('[Update Field Order] Field update returned 0 rows:', { fieldId: fieldIdStr });
                    await client.query('ROLLBACK');
                    return res.status(404).json({ 
                        error: 'Field not found',
                        message: `字段 ${fieldIdStr} 不存在或不属于此表单`,
                        fieldId: fieldIdStr
                    });
                }

                updateResults.push({ fieldId: fieldIdStr, order, updated: true });
            }

            await client.query('COMMIT');
            console.log('[Update Field Order] Success:', { formId, updatedCount: updateResults.length });
            res.json({ 
                message: 'Field order updated successfully',
                updatedCount: updateResults.length
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[Update Field Order] Error:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[Update Field Order] Outer catch:', error);
        next(error);
    }
});

// 更新字段
router.put('/:formId/fields/:fieldId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const existingResult = await pool.query(
            `SELECT f.*, fm.name AS form_name 
             FROM form_fields f 
             JOIN forms fm ON fm.id = f.form_id
             WHERE f.id = $1 AND f.form_id = $2`,
            [req.params.fieldId, req.params.formId]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }

        const existingField = existingResult.rows[0];

        const { name, type, active, order, formula, displayPrecision, options, required } = req.body;

        if (type === 'select' && (!Array.isArray(options) || options.length === 0)) {
            return res.status(400).json({ error: '下拉字段必须至少包含一个选项' });
        }

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(name);
        }
        if (type !== undefined) {
            updateFields.push(`type = $${paramIndex++}`);
            updateValues.push(type);
        }
        if (active !== undefined) {
            updateFields.push(`active = $${paramIndex++}`);
            updateValues.push(active);
        }
        if (order !== undefined) {
            updateFields.push(`"order" = $${paramIndex++}`);
            updateValues.push(order);
        }
        if (formula !== undefined) {
            updateFields.push(`formula = $${paramIndex++}`);
            updateValues.push(formula);
        }
        if (displayPrecision !== undefined) {
            const precision = Math.max(0, Math.min(Number(displayPrecision), 6));
            updateFields.push(`display_precision = $${paramIndex++}`);
            updateValues.push(precision);
        }
        if (options !== undefined) {
            const normalizedOptions = Array.isArray(options)
                ? options.map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt))).filter(Boolean)
                : null;
            updateFields.push(`options = $${paramIndex++}`);
            updateValues.push(normalizedOptions ? JSON.stringify(normalizedOptions) : null);
        }
        if (typeof required !== 'undefined') {
            updateFields.push(`required = $${paramIndex++}`);
            updateValues.push(!!required);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.params.fieldId);
        updateValues.push(req.params.formId);

        await pool.query(
            `UPDATE form_fields SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND form_id = $${paramIndex}`,
            updateValues
        );

        if (name && name !== existingField.name) {
            await updateFieldNameReferences(req.params.formId, existingField.form_name, existingField.name, name);
        }

        // 同步更新未归档资产记录
        // 如果公式变更，需要重新计算（前端会处理）
        // 如果字段被删除（active=false），需要从资产记录中移除该字段
        if (active !== undefined && !active) {
            await syncRemoveFieldFromAssets(req.params.formId, req.params.fieldId);
        }

        const result = await pool.query(
            'SELECT * FROM form_fields WHERE id = $1 AND form_id = $2',
            [req.params.fieldId, req.params.formId]
        );

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 删除字段
router.delete('/:formId/fields/:fieldId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        // 先从未归档资产记录中移除该字段
        await syncRemoveFieldFromAssets(req.params.formId, req.params.fieldId);
        
        await pool.query(
            'DELETE FROM form_fields WHERE id = $1 AND form_id = $2',
            [req.params.fieldId, req.params.formId]
        );
        res.json({ message: 'Field deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 批量归档
router.post('/archive/batch', authenticateToken, requireRole('company_asset', 'superadmin'), async (req, res, next) => {
    try {
        const { formIds, autoUnlock = true } = req.body || {};
        if (!Array.isArray(formIds) || formIds.length === 0) {
            return res.status(400).json({ error: 'formIds must be a non-empty array' });
        }

        const results = [];
        for (const formId of formIds) {
            try {
                const archiveInfo = await archiveFormById(formId, req.user, { autoUnlock });
                results.push({ formId, success: true, archive: archiveInfo });
            } catch (error) {
                results.push({
                    formId,
                    success: false,
                    error: error.message || '归档失败'
                });
            }
        }

        const hasFailure = results.some((item) => !item.success);
        res.status(hasFailure ? 207 : 200).json({ results });
    } catch (error) {
        next(error);
    }
});

// 单个归档
router.post('/:id/archive', authenticateToken, requireRole('company_asset', 'superadmin'), async (req, res, next) => {
    try {
        const autoUnlock = req.body?.autoUnlock !== false;
        const archiveResult = await archiveFormById(req.params.id, req.user, { autoUnlock });
        res.json(archiveResult);
    } catch (error) {
        next(error);
    }
});

// 查看归档列表
router.get('/:id/archives', authenticateToken, async (req, res, next) => {
    try {
        // 超级管理员和资产管理员可以查看所有表单的归档列表
        if (req.user.role !== 'superadmin' && req.user.role !== 'company_asset') {
            const hasPermission = await checkFormPermission(req.user.id, req.params.id);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        }

        const result = await pool.query(
            'SELECT id, form_id, form_name, version, archived_at, archived_by, file_path, metadata FROM form_archives WHERE form_id = $1 ORDER BY archived_at DESC',
            [req.params.id]
        );
        const camelRows = result.rows.map((row) => toCamelCaseObject(row));
        res.json(camelRows);
    } catch (error) {
        next(error);
    }
});

// 下载归档文件或返回JSON
router.get('/archives/:archiveId/download', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM form_archives WHERE id = $1', [req.params.archiveId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Archive not found' });
        }

        const archive = result.rows[0];

        // 超级管理员和资产管理员可以下载所有归档文件
        if (req.user.role !== 'superadmin' && req.user.role !== 'company_asset') {
            const hasPermission = await checkFormPermission(req.user.id, archive.form_id);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        }

        const archiveData = toCamelCaseObject(archive);
        if (archive.file_path) {
            const absolutePath = path.resolve(process.cwd(), archive.file_path);
            if (isPathInside(absolutePath, ARCHIVE_STORAGE_DIR)) {
                try {
                    await fs.access(absolutePath);
                    return res.download(absolutePath, path.basename(absolutePath));
                } catch (fileError) {
                    console.warn(`Archive file missing, fallback to JSON output: ${fileError.message}`);
                }
            } else {
                console.warn('Blocked attempt to access archive outside of storage directory:', absolutePath);
            }
        }

        res.json({
            meta: archiveData.metadata,
            fields: archiveData.fieldsSnapshot,
            records: archiveData.dataSnapshot
        });
    } catch (error) {
        next(error);
    }
});

// 导出表格（未归档或指定归档版本）
router.get('/:id/export', authenticateToken, async (req, res, next) => {
    try {
        const { scope = 'active', archiveId } = req.query;
        const formResult = await pool.query('SELECT * FROM forms WHERE id = $1', [req.params.id]);
        if (formResult.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        const form = formResult.rows[0];

        // 超级管理员和资产管理员可以导出所有表单
        if (req.user.role !== 'superadmin' && req.user.role !== 'company_asset') {
            const hasPermission = await checkFormPermission(req.user.id, form.id);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        }

        const fieldsResult = await pool.query(
            'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC',
            [form.id]
        );

        if (scope === 'archive') {
            let archiveRecord;
            if (archiveId) {
                const archiveResult = await pool.query(
                    'SELECT * FROM form_archives WHERE id = $1 AND form_id = $2',
                    [archiveId, form.id]
                );
                archiveRecord = archiveResult.rows[0];
            } else {
                const latestArchive = await pool.query(
                    'SELECT * FROM form_archives WHERE form_id = $1 ORDER BY version DESC LIMIT 1',
                    [form.id]
                );
                archiveRecord = latestArchive.rows[0];
            }

            if (!archiveRecord) {
                return res.status(404).json({ error: '未找到归档版本' });
            }

            const snapshotFields = archiveRecord.fields_snapshot || fieldsResult.rows;
            const flattenedRows = flattenArchiveRecords(archiveRecord.data_snapshot || []);

            await streamFormWorkbook({
                res,
                form,
                fields: snapshotFields,
                rows: flattenedRows,
                scope: 'archive',
                meta: {
                    version: archiveRecord.version,
                    archivedAt: archiveRecord.archived_at
                }
            });
        } else {
            // 构建查询，应用与assets API相同的权限过滤
            let assetsQuery = 'SELECT id, sub_account_name, submitted_at, base_id, batch_data FROM assets WHERE form_id = $1';
            const assetsParams = [form.id];
            let assetsParamIndex = 2;

            // 权限过滤（与assets API保持一致）
            if (req.user.role === 'base_handler') {
                // 基地经手人只能看自己的记录
                assetsQuery += ` AND sub_account_id = $${assetsParamIndex++}`;
                assetsParams.push(req.user.id);
            } else if (req.user.role === 'base_manager') {
                // 基地负责人只能看自己基地的记录
                if (req.user.baseId) {
                    assetsQuery += ` AND base_id = $${assetsParamIndex++}`;
                    assetsParams.push(req.user.baseId);
                }
            } else if (req.user.role !== 'superadmin') {
                // 其他角色需要通过表单权限过滤
                // 已经在上面检查了表单权限，这里不需要再次过滤
                // 但为了安全，可以再次确认
            }

            assetsQuery += ' ORDER BY submitted_at ASC';

            const assetsResult = await pool.query(assetsQuery, assetsParams);
            const flattenedRows = flattenActiveAssets(assetsResult.rows);

            await streamFormWorkbook({
                res,
                form,
                fields: fieldsResult.rows,
                rows: flattenedRows,
                scope: 'active'
            });
        }
    } catch (error) {
        next(error);
    }
});

// 归档核心逻辑
async function archiveFormById(formId, user, options = {}) {
    const { autoUnlock = true } = options;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const formResult = await client.query(
            'SELECT * FROM forms WHERE id = $1 FOR UPDATE',
            [formId]
        );

        if (formResult.rows.length === 0) {
            throw createHttpError(404, 'Form not found');
        }

        const form = formResult.rows[0];
        if (form.archive_status !== 'active') {
            throw createHttpError(400, '该表格已处于已归档状态，不能重复归档');
        }

        const fieldsResult = await client.query(
            'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC',
            [formId]
        );
        const assetsResult = await client.query(
            'SELECT * FROM assets WHERE form_id = $1 ORDER BY submitted_at ASC',
            [formId]
        );

        const archivedAt = new Date();
        const version = Number(form.archive_version || 0) + 1;
        const archiveId = generateId();

        const records = assetsResult.rows.map((row) => ({
            assetId: row.id,
            submittedAt: row.submitted_at,
            baseId: row.base_id,
            subAccountId: row.sub_account_id,
            subAccountName: row.sub_account_name,
            batchData: row.batch_data
        }));

        const baseCount = new Set(records.map((r) => r.baseId).filter(Boolean)).size;

        const metadata = {
            formId: form.id,
            formName: form.name,
            version,
            archivedAt: archivedAt.toISOString(),
            archivedBy: user.name,
            recordCount: records.length,
            baseCount
        };

        const archivePayload = {
            meta: metadata,
            fields: fieldsResult.rows,
            records
        };

        await ensureArchiveDir();
        const timestampLabel = archivedAt.toISOString().replace(/[:.]/g, '-');
        const safeName = sanitizeFileName(form.name || 'form');
        const fileName = `${safeName}_${timestampLabel}_v${version}.json`;
        const absolutePath = path.join(ARCHIVE_STORAGE_DIR, fileName);
        await fs.writeFile(absolutePath, JSON.stringify(archivePayload, null, 2), 'utf8');
        const relativePath = path.relative(process.cwd(), absolutePath).split(path.sep).join('/');

        await client.query(
            `INSERT INTO form_archives (id, form_id, form_name, version, archived_at, archived_by, file_path, file_type, fields_snapshot, data_snapshot, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                archiveId,
                form.id,
                form.name,
                version,
                archivedAt,
                user.id,
                relativePath,
                'json',
                JSON.stringify(fieldsResult.rows),
                JSON.stringify(records),
                JSON.stringify(metadata)
            ]
        );

        await client.query('DELETE FROM assets WHERE form_id = $1', [formId]);

        // 归档后状态应改为 'archived'，无论 autoUnlock 设置如何
        // autoUnlock 参数可能用于其他用途，但不影响归档状态
        await client.query(
            'UPDATE forms SET archive_status = $1, archive_version = $2, archived_at = $3, archived_by = $4 WHERE id = $5',
            ['archived', version, archivedAt, user.id, formId]
        );

        await client.query('COMMIT');

        return {
            archiveId,
            formId: form.id,
            version,
            archivedAt: metadata.archivedAt,
            recordCount: records.length,
            filePath: relativePath
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function updateFieldNameReferences(formId, formName, oldName, newName) {
    if (!oldName || !newName || oldName === newName) {
        return;
    }

    const sameFormResult = await pool.query(
        'SELECT id, formula FROM form_fields WHERE form_id = $1 AND type = $2 AND formula IS NOT NULL',
        [formId, 'formula']
    );

    for (const field of sameFormResult.rows) {
        const updatedFormula = replaceStandaloneToken(field.formula, oldName, newName);
        if (updatedFormula !== field.formula) {
            await pool.query('UPDATE form_fields SET formula = $1 WHERE id = $2', [updatedFormula, field.id]);
        }
    }

    if (formName) {
        const crossFormResult = await pool.query(
            'SELECT id, formula FROM form_fields WHERE form_id <> $1 AND type = $2 AND formula LIKE $3',
            [formId, 'formula', `%${formName}.${oldName}%`]
        );

        for (const field of crossFormResult.rows) {
            const updatedFormula = field.formula.replaceAll(`${formName}.${oldName}`, `${formName}.${newName}`);
            if (updatedFormula !== field.formula) {
                await pool.query('UPDATE form_fields SET formula = $1 WHERE id = $2', [updatedFormula, field.id]);
            }
        }
    }
}

async function updateFormNameReferences(oldName, newName) {
    if (!oldName || !newName || oldName === newName) {
        return;
    }

    const crossFormResult = await pool.query(
        'SELECT id, formula FROM form_fields WHERE type = $1 AND formula LIKE $2',
        ['formula', `%${oldName}.%`]
    );

    for (const field of crossFormResult.rows) {
        const updatedFormula = field.formula.replaceAll(`${oldName}.`, `${newName}.`);
        if (updatedFormula !== field.formula) {
            await pool.query('UPDATE form_fields SET formula = $1 WHERE id = $2', [updatedFormula, field.id]);
        }
    }
}

// 同步添加字段到未归档资产记录
async function syncAddFieldToAssets(formId, fieldId, fieldType) {
    try {
        // 获取该表单的所有未归档资产记录
        const assetsResult = await pool.query(
            `SELECT a.id, a.batch_data, a.fields_snapshot, f.archive_status
             FROM assets a
             JOIN forms f ON f.id = a.form_id
             WHERE a.form_id = $1 AND f.archive_status = 'active'`,
            [formId]
        );

        for (const asset of assetsResult.rows) {
            let batchData = asset.batch_data || [];
            if (typeof batchData === 'string') {
                batchData = JSON.parse(batchData);
            }

            // 为每行数据添加新字段（空值）
            const updatedBatchData = batchData.map(row => {
                const newRow = { ...row };
                // 根据字段类型设置默认值
                if (fieldType === 'number' || fieldType === 'formula') {
                    newRow[fieldId] = 0;
                } else if (fieldType === 'select') {
                    newRow[fieldId] = '';
                } else {
                    newRow[fieldId] = '';
                }
                return newRow;
            });

            // 更新资产记录
            await pool.query(
                'UPDATE assets SET batch_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(updatedBatchData), asset.id]
            );
        }
    } catch (error) {
        console.error('Error syncing field to assets:', error);
        // 不抛出错误，避免影响字段创建
    }
}

// 同步从未归档资产记录中移除字段
async function syncRemoveFieldFromAssets(formId, fieldId) {
    try {
        // 获取该表单的所有未归档资产记录
        const assetsResult = await pool.query(
            `SELECT a.id, a.batch_data, f.archive_status
             FROM assets a
             JOIN forms f ON f.id = a.form_id
             WHERE a.form_id = $1 AND f.archive_status = 'active'`,
            [formId]
        );

        for (const asset of assetsResult.rows) {
            let batchData = asset.batch_data || [];
            if (typeof batchData === 'string') {
                batchData = JSON.parse(batchData);
            }

            // 从每行数据中移除该字段
            const updatedBatchData = batchData.map(row => {
                const newRow = { ...row };
                delete newRow[fieldId];
                return newRow;
            });

            // 更新资产记录
            await pool.query(
                'UPDATE assets SET batch_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(updatedBatchData), asset.id]
            );
        }
    } catch (error) {
        console.error('Error removing field from assets:', error);
        // 不抛出错误，避免影响字段删除
    }
}

function flattenActiveAssets(assets = []) {
    return assets.flatMap((asset) => {
        const batchRows = asset.batch_data || asset.batchData || [];
        return batchRows.map((row) => ({
            ...row,
            __meta: {
                subAccountName: asset.sub_account_name,
                submittedAt: asset.submitted_at,
                baseId: asset.base_id
            }
        }));
    });
}

function flattenArchiveRecords(records = []) {
    return records.flatMap((record) => {
        const batchRows = record.batchData || record.batch_data || [];
        return batchRows.map((row) => ({
            ...row,
            __meta: {
                subAccountName: record.subAccountName,
                submittedAt: record.submittedAt,
                baseId: record.baseId
            }
        }));
    });
}

async function streamFormWorkbook({ res, form, fields = [], rows = [], scope = 'active', meta = {} }) {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(scope === 'archive' ? `${form.name}-已归档` : `${form.name}-未归档`);

    const safeFields = fields.map((field) => ({
        ...field,
        display_precision: typeof field.display_precision === 'number' ? field.display_precision : 2
    }));

    const headerRow = ['提交人', '提交时间', ...safeFields.map((field) => field.name || field.field_key || '字段')];
    worksheet.addRow(headerRow);

    rows.forEach((row) => {
        const metaInfo = row.__meta || {};
        const formattedRow = [
            metaInfo.subAccountName || '',
            metaInfo.submittedAt ? new Date(metaInfo.submittedAt) : ''
        ];

        safeFields.forEach((field) => {
            const rawValue = row[field.id] ?? row[field.name] ?? '';
            formattedRow.push(normalizeFieldValue(field, rawValue));
        });

        worksheet.addRow(formattedRow);
    });

    // Apply column formats
    worksheet.getColumn(2).numFmt = 'yyyy-mm-dd hh:mm';
    safeFields.forEach((field, index) => {
        if (['number', 'formula'].includes(field.type)) {
            worksheet.getColumn(index + 3).numFmt = getExcelNumericFormat(field.display_precision);
        }
    });

    worksheet.columns.forEach((column) => {
        let maxLength = 12;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ?? '';
            const length = cellValue && cellValue.text ? cellValue.text.length : cellValue.toString().length;
            if (length > maxLength) {
                maxLength = length;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 40);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = scope === 'archive' ? `_archived_v${meta.version || 'latest'}` : '_active';
    const fileName = `${sanitizeFileName(form.name)}${suffix}_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
    await workbook.xlsx.write(res);
    res.end();
}

function normalizeFieldValue(field, rawValue) {
    if (rawValue === null || rawValue === undefined) {
        return '';
    }

    if (['number', 'formula'].includes(field.type)) {
        const numericValue = Number(rawValue);
        return Number.isFinite(numericValue) ? numericValue : 0;
    }

    return rawValue;
}

function getExcelNumericFormat(precision = 2) {
    const safePrecision = Math.max(0, Math.min(6, Number(precision) || 0));
    if (safePrecision === 0) {
        return '0';
    }
    return `0.${'0'.repeat(safePrecision)}`;
}

// 辅助函数：获取最大order值
async function getMaxOrder(formId) {
    const result = await pool.query(
        'SELECT MAX("order") as maxOrder FROM form_fields WHERE form_id = $1',
        [formId]
    );
    return result.rows[0]?.maxorder || -1;
}

function replaceStandaloneToken(formula = '', token, replacement) {
    if (!token || !replacement || !formula) return formula;
    const pattern = new RegExp(`(^|[^\\w\\u4e00-\\u9fa5\\.])(${escapeRegExp(token)})(?=$|[^\\w\\u4e00-\\u9fa5])`, 'g');
    return formula.replace(pattern, (_, prefix, captured) => `${prefix}${replacement}`);
}

function escapeRegExp(string = '') {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { router as formsRoutes };
