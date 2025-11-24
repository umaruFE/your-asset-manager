import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId, toCamelCaseObject } from '../utils/helpers.js';

const router = express.Router();

// 获取所有用户（仅超级管理员）
router.get('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name, 
                    u.created_at, u.updated_at 
             FROM users u 
             LEFT JOIN bases b ON u.base_id = b.id 
             ORDER BY u.role, u.name`
        );

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 获取所有基地
router.get('/bases', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM bases ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 获取当前用户基地的经手人列表（基地负责人使用）
// 或者获取所有经手人列表（公司资产员、公司财务使用）
router.get('/my-base-handlers', authenticateToken, async (req, res, next) => {
    try {
        console.log('[users.js] /my-base-handlers 请求，用户角色:', req.user.role, '用户ID:', req.user.id);
        
        // 基地负责人：获取自己基地的经手人
        if (req.user.role === 'base_manager') {
            if (!req.user.baseId) {
                console.log('[users.js] base_manager 没有 baseId，返回空数组');
                return res.json([]);
            }

            const result = await pool.query(
                `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name 
                 FROM users u 
                 LEFT JOIN bases b ON u.base_id = b.id 
                 WHERE u.role = 'base_handler' AND u.base_id = $1 
                 ORDER BY u.name`,
                [req.user.baseId]
            );

            console.log('[users.js] base_manager 返回', result.rows.length, '个经手人');
            return res.json(result.rows.map(toCamelCaseObject));
        }
        
        // 公司资产员、公司财务：获取所有经手人（用于查看所有记录时显示提交人）
        if (req.user.role === 'company_asset' || req.user.role === 'company_finance') {
            console.log('[users.js] company_asset/company_finance 获取所有经手人');
            const result = await pool.query(
                `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name 
                 FROM users u 
                 LEFT JOIN bases b ON u.base_id = b.id 
                 WHERE u.role = 'base_handler' 
                 ORDER BY u.name`
            );

            console.log('[users.js] company_asset/company_finance 返回', result.rows.length, '个经手人');
            return res.json(result.rows.map(toCamelCaseObject));
        }

        // 其他角色无权访问
        console.log('[users.js] 角色', req.user.role, '无权访问，返回 403');
        return res.status(403).json({ error: 'Access denied' });
    } catch (error) {
        console.error('[users.js] /my-base-handlers 错误:', error);
        next(error);
    }
});

// 创建基地
router.post('/bases', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Base name is required' });
        }

        const id = generateId();
        await pool.query(
            'INSERT INTO bases (id, name, description) VALUES ($1, $2, $3)',
            [id, name, description || null]
        );

        const result = await pool.query('SELECT * FROM bases WHERE id = $1', [id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name, 
                    u.created_at, u.updated_at 
             FROM users u 
             LEFT JOIN bases b ON u.base_id = b.id 
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 创建用户（仅超级管理员）
router.post('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { username, password, name, role, baseId } = req.body;

        if (!username || !password || !name || !role) {
            return res.status(400).json({ error: 'Username, password, name and role are required' });
        }

        // 验证角色
        const validRoles = ['superadmin', 'base_handler', 'base_manager', 'company_asset', 'company_finance'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // 基地经手人和基地负责人必须关联基地
        if ((role === 'base_handler' || role === 'base_manager') && !baseId) {
            return res.status(400).json({ error: 'Base ID is required for base_handler and base_manager' });
        }

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 10);

        const id = generateId();
        await pool.query(
            'INSERT INTO users (id, username, password, name, role, base_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, username, hashedPassword, name, role, baseId || null]
        );

        const result = await pool.query(
            `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name 
             FROM users u 
             LEFT JOIN bases b ON u.base_id = b.id 
             WHERE u.id = $1`,
            [id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Username already exists' });
        }
        next(error);
    }
});

// 更新用户（仅超级管理员）
router.put('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { username, password, name, role, baseId } = req.body;

        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (username !== undefined) {
            updateFields.push(`username = $${paramIndex++}`);
            updateValues.push(username);
        }
        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            updateValues.push(name);
        }
        if (role !== undefined) {
            const validRoles = ['superadmin', 'base_handler', 'base_manager', 'company_asset', 'company_finance'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            updateFields.push(`role = $${paramIndex++}`);
            updateValues.push(role);
        }
        if (baseId !== undefined) {
            updateFields.push(`base_id = $${paramIndex++}`);
            updateValues.push(baseId || null);
        }
        if (password !== undefined) {
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.default.hash(password, 10);
            updateFields.push(`password = $${paramIndex++}`);
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(req.params.id);

        await pool.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
            updateValues
        );

        const result = await pool.query(
            `SELECT u.id, u.username, u.name, u.role, u.base_id, b.name as base_name 
             FROM users u 
             LEFT JOIN bases b ON u.base_id = b.id 
             WHERE u.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 删除用户（仅超级管理员）
router.delete('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 用户表单权限管理
// 获取用户的所有表单权限
router.get('/:userId/permissions', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ufp.*, f.name as form_name 
             FROM user_form_permissions ufp 
             JOIN forms f ON ufp.form_id = f.id 
             WHERE ufp.user_id = $1`,
            [req.params.userId]
        );
        
        // 转换字段名：如果数据库使用 can_edit，则映射为 can_submit
        // 同时确保 can_submit 字段存在（即使为 false）
        const permissions = result.rows.map(perm => {
            // 确保 can_submit 字段存在
            if (perm.can_submit === undefined || perm.can_submit === null) {
                if (perm.can_edit !== undefined) {
                    perm.can_submit = perm.can_edit;
                } else {
                    perm.can_submit = false;
                }
            }
            return perm;
        });
        
        // 转换为 camelCase 格式
        res.json(toCamelCaseObject(permissions));
    } catch (error) {
        next(error);
    }
});

// 设置用户表单权限
router.post('/:userId/permissions', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { formId, canView, canSubmit } = req.body;

        if (!formId) {
            return res.status(400).json({ error: 'Form ID is required' });
        }

        const id = generateId();
        // 尝试使用 can_submit 字段，如果不存在则使用 can_edit
        try {
            await pool.query(
                `INSERT INTO user_form_permissions (id, user_id, form_id, can_view, can_submit) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (user_id, form_id) 
                 DO UPDATE SET can_view = EXCLUDED.can_view, can_submit = EXCLUDED.can_submit`,
                [id, req.params.userId, formId, canView !== false, canSubmit === true]
            );
        } catch (err) {
            // 如果 can_submit 字段不存在，使用 can_edit
            if (err.message.includes('can_submit') || err.code === '42703') {
                await pool.query(
                    `INSERT INTO user_form_permissions (id, user_id, form_id, can_view, can_edit) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (user_id, form_id) 
                     DO UPDATE SET can_view = EXCLUDED.can_view, can_edit = EXCLUDED.can_edit`,
                    [id, req.params.userId, formId, canView !== false, canSubmit === true]
                );
            } else {
                throw err;
            }
        }

        const result = await pool.query(
            `SELECT ufp.*, f.name as form_name 
             FROM user_form_permissions ufp 
             JOIN forms f ON ufp.form_id = f.id 
             WHERE ufp.user_id = $1 AND ufp.form_id = $2`,
            [req.params.userId, formId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Permission not found after creation' });
        }

        // 转换字段名：如果数据库使用 can_edit，则映射为 can_submit
        // 同时确保 can_submit 字段存在（即使为 false）
        const permission = result.rows[0];
        if (permission.can_submit === undefined || permission.can_submit === null) {
            if (permission.can_edit !== undefined) {
                permission.can_submit = permission.can_edit;
            } else {
                permission.can_submit = false;
            }
        }

        // 转换为 camelCase 格式
        res.status(201).json(toCamelCaseObject(permission));
    } catch (error) {
        next(error);
    }
});

// 删除用户表单权限
router.delete('/:userId/permissions/:permissionId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM user_form_permissions WHERE id = $1 AND user_id = $2',
            [req.params.permissionId, req.params.userId]
        );
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export { router as usersRoutes };
