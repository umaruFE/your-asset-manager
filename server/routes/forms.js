import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();

// 获取所有表单（根据权限过滤）
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        let query = 'SELECT * FROM forms WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // 超级管理员可以看到所有表单（包括禁用的）
        // 其他角色只能看到激活的表单，并且需要通过权限表过滤
        if (req.user.role !== 'superadmin') {
            query += ' AND is_active = true';

            // 所有非超级管理员角色都需要通过权限表过滤
            query += ` AND id IN (
                SELECT form_id FROM user_form_permissions 
                WHERE user_id = $${paramIndex++} AND can_view = true
            )`;
            params.push(req.user.id);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        // 获取每个表单的字段
        for (let form of result.rows) {
            // 超级管理员可以看到所有字段（包括已归档的），其他角色只能看到激活的字段
            const fieldsQuery = req.user.role === 'superadmin'
                ? 'SELECT * FROM form_fields WHERE form_id = $1 ORDER BY "order" ASC'
                : 'SELECT * FROM form_fields WHERE form_id = $1 AND active = true ORDER BY "order" ASC';

            const fieldsResult = await pool.query(fieldsQuery, [form.id]);
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

            // 非超级管理员只能查看激活的表单
            if (!form.is_active) {
                return res.status(403).json({ error: 'Access denied: Form is not active' });
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
        const { name, isActive } = req.body;

        await pool.query(
            'UPDATE forms SET name = $1, is_active = $2 WHERE id = $3',
            [name, isActive, req.params.id]
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
        const { name, type, active = true, order, formula } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Field name and type are required' });
        }

        const id = generateId();
        const maxOrder = order !== undefined ? order : await getMaxOrder(req.params.formId);

        await pool.query(
            'INSERT INTO form_fields (id, form_id, name, type, active, "order", formula) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, req.params.formId, name, type, active, maxOrder + 1, formula || null]
        );

        const result = await pool.query('SELECT * FROM form_fields WHERE id = $1', [id]);
        // 转换字段名从下划线到驼峰
        res.status(201).json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 更新字段
router.put('/:formId/fields/:fieldId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, type, active, order, formula } = req.body;

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

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.params.fieldId);
        updateValues.push(req.params.formId);

        await pool.query(
            `UPDATE form_fields SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND form_id = $${paramIndex}`,
            updateValues
        );

        const result = await pool.query(
            'SELECT * FROM form_fields WHERE id = $1 AND form_id = $2',
            [req.params.fieldId, req.params.formId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(result.rows[0]));
    } catch (error) {
        next(error);
    }
});

// 更新字段顺序（批量）
router.put('/:formId/fields/order', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { fieldOrders } = req.body; // [{ fieldId, order }, ...]

        if (!Array.isArray(fieldOrders)) {
            return res.status(400).json({ error: 'fieldOrders must be an array' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const { fieldId, order } of fieldOrders) {
                await client.query(
                    'UPDATE form_fields SET "order" = $1 WHERE id = $2 AND form_id = $3',
                    [order, fieldId, req.params.formId]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Field order updated successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        next(error);
    }
});

// 删除字段
router.delete('/:formId/fields/:fieldId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM form_fields WHERE id = $1 AND form_id = $2',
            [req.params.fieldId, req.params.formId]
        );
        res.json({ message: 'Field deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 辅助函数：获取最大order值
async function getMaxOrder(formId) {
    const result = await pool.query(
        'SELECT MAX("order") as maxOrder FROM form_fields WHERE form_id = $1',
        [formId]
    );
    return result.rows[0]?.maxorder || -1;
}

export { router as formsRoutes };
