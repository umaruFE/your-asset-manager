import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/helpers.js';

const router = express.Router();

// 获取用户的所有表单权限（仅超级管理员）
router.get('/users/:userId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ufp.*, f.name as form_name
             FROM user_form_permissions ufp
             JOIN forms f ON ufp.form_id = f.id
             WHERE ufp.user_id = $1
             ORDER BY f.name`,
            [req.params.userId]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 获取表单的所有用户权限（仅超级管理员）
router.get('/forms/:formId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT ufp.*, u.name as user_name, u.email as user_email, u.role as user_role
             FROM user_form_permissions ufp
             JOIN users u ON ufp.user_id = u.id
             WHERE ufp.form_id = $1
             ORDER BY u.name`,
            [req.params.formId]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 设置用户表单权限（仅超级管理员）
router.post('/users/:userId/forms/:formId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { canView = true, canSubmit = false } = req.body;

        const id = generateId();
        await pool.query(
            `INSERT INTO user_form_permissions (id, user_id, form_id, can_view, can_submit)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, form_id)
             DO UPDATE SET can_view = EXCLUDED.can_view, can_submit = EXCLUDED.can_submit`,
            [id, req.params.userId, req.params.formId, canView, canSubmit]
        );

        const result = await pool.query(
            `SELECT ufp.*, f.name as form_name
             FROM user_form_permissions ufp
             JOIN forms f ON ufp.form_id = f.id
             WHERE ufp.user_id = $1 AND ufp.form_id = $2`,
            [req.params.userId, req.params.formId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 删除用户表单权限（仅超级管理员）
router.delete('/users/:userId/forms/:formId', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM user_form_permissions WHERE user_id = $1 AND form_id = $2',
            [req.params.userId, req.params.formId]
        );
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 批量设置用户表单权限（仅超级管理员）
router.post('/users/:userId/batch', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { permissions } = req.body; // [{formId, canView, canSubmit}, ...]

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'Permissions must be an array' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 先删除所有现有权限
            await client.query(
                'DELETE FROM user_form_permissions WHERE user_id = $1',
                [req.params.userId]
            );

            // 插入新权限
            for (const perm of permissions) {
                const id = generateId();
                await client.query(
                    'INSERT INTO user_form_permissions (id, user_id, form_id, can_view, can_submit) VALUES ($1, $2, $3, $4, $5)',
                    [id, req.params.userId, perm.formId, perm.canView || false, perm.canSubmit || false]
                );
            }

            await client.query('COMMIT');

            // 返回更新后的权限列表
            const result = await pool.query(
                `SELECT ufp.*, f.name as form_name
                 FROM user_form_permissions ufp
                 JOIN forms f ON ufp.form_id = f.id
                 WHERE ufp.user_id = $1
                 ORDER BY f.name`,
                [req.params.userId]
            );

            res.json(result.rows);
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

export { router as permissionsRoutes };

