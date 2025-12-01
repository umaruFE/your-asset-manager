import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();

// 获取所有资产记录（根据角色和权限过滤）
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const { formId, subAccountId } = req.query;

        let query = 'SELECT * FROM assets WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // 权限过滤
        if (req.user.role === 'base_handler') {
            // 基地经手人只能看自己的记录
            query += ` AND sub_account_id = $${paramIndex++}`;
            params.push(req.user.id);
        } else if (req.user.role === 'base_manager') {
            // 基地负责人只能看自己基地的记录
            if (req.user.baseId) {
                query += ` AND base_id = $${paramIndex++}`;
                params.push(req.user.baseId);
            }
        } else if (req.user.role !== 'superadmin') {
            // 其他角色（公司资产员、公司财务）可以看所有数据，但需要通过表单权限过滤
            // 获取用户有权限查看的表单
            const permResult = await pool.query(
                'SELECT form_id FROM user_form_permissions WHERE user_id = $1 AND can_view = true',
                [req.user.id]
            );
            const allowedFormIds = permResult.rows.map(r => r.form_id);
            
            if (allowedFormIds.length > 0) {
                query += ` AND form_id = ANY($${paramIndex++}::text[])`;
                params.push(allowedFormIds);
            } else {
                // 如果没有权限，返回空结果
                query += ` AND 1=0`;
            }
        }

        if (formId && formId !== 'all') {
            query += ` AND form_id = $${paramIndex++}`;
            params.push(formId);
        }

        if (subAccountId && subAccountId !== 'all') {
            query += ` AND sub_account_id = $${paramIndex++}`;
            params.push(subAccountId);
        }

        query += ' ORDER BY submitted_at DESC';

        const result = await pool.query(query, params);
        
        // 转换字段名从下划线到驼峰
        // 注意：PostgreSQL的JSONB字段会自动解析为JavaScript对象/数组
        const camelRows = result.rows.map(row => {
            const camelRow = toCamelCaseObject(row);
            // 确保batch_data/batchData是数组格式
            if (camelRow.batchData && typeof camelRow.batchData === 'string') {
                try {
                    camelRow.batchData = JSON.parse(camelRow.batchData);
                } catch (e) {
                    console.error('解析batchData失败:', e);
                }
            }
            return camelRow;
        });
        
        res.json(camelRows);
    } catch (error) {
        next(error);
    }
});

// 获取单个资产记录
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM assets WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const asset = result.rows[0];

        // 权限检查
        if (req.user.role === 'base_handler' && asset.sub_account_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.user.role === 'base_manager' && asset.base_id !== req.user.baseId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (req.user.role !== 'superadmin' && req.user.role !== 'base_handler' && req.user.role !== 'base_manager') {
            // 检查表单权限
            const permResult = await pool.query(
                'SELECT can_view FROM user_form_permissions WHERE user_id = $1 AND form_id = $2',
                [req.user.id, asset.form_id]
            );
            if (permResult.rows.length === 0 || !permResult.rows[0].can_view) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        // 转换字段名从下划线到驼峰
        res.json(toCamelCaseObject(asset));
    } catch (error) {
        next(error);
    }
});

// 创建资产记录（提交）
router.post('/', authenticateToken, async (req, res, next) => {
    try {
        const { formId, formName, batchData, fieldsSnapshot } = req.body;

        if (!formId || !formName || !batchData || !Array.isArray(batchData)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        // 检查表单状态
        const formResult = await pool.query(
            'SELECT name, archive_status FROM forms WHERE id = $1',
            [formId]
        );
        if (formResult.rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        const formRecord = formResult.rows[0];
        if (formRecord.archive_status !== 'active') {
            return res.status(400).json({ error: '当前表格已归档，无法继续录入数据' });
        }

        // 检查提交权限
        if (req.user.role === 'base_handler') {
            // 基地经手人可以提交
        } else if (req.user.role === 'superadmin') {
            // 超级管理员可以提交
        } else {
            // 其他角色需要检查表单权限
            const permResult = await pool.query(
                'SELECT can_submit FROM user_form_permissions WHERE user_id = $1 AND form_id = $2',
                [req.user.id, formId]
            );
            if (permResult.rows.length === 0 || !permResult.rows[0].can_submit) {
                return res.status(403).json({ error: 'No permission to submit this form' });
            }
        }

        const id = generateId();
        const submittedAt = Date.now();
        
        // 基地经手人提交时记录基地ID
        const baseId = req.user.role === 'base_handler' ? req.user.baseId : null;

        await pool.query(
            'INSERT INTO assets (id, form_id, form_name, sub_account_id, sub_account_name, base_id, submitted_at, fields_snapshot, batch_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
                id,
                formId,
                formRecord.name || formName,
                req.user.id,
                req.user.name,
                baseId,
                submittedAt,
                JSON.stringify(fieldsSnapshot || []),
                JSON.stringify(batchData)
            ]
        );

        const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

export { router as assetsRoutes };
