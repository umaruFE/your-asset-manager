import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/helpers.js';

const router = express.Router();

// 获取所有文件
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        let query = 'SELECT * FROM files WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // 子账号只能看被授权的文件
        if (req.user.role === 'subaccount') {
            query += ` AND allowed_sub_accounts @> $${paramIndex++}::jsonb`;
            params.push(JSON.stringify([req.user.id]));
        }

        query += ' ORDER BY uploaded_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 获取单个文件
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM files WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];

        // 子账号只能看被授权的文件
        if (req.user.role === 'subaccount') {
            const allowedAccounts = file.allowed_sub_accounts || [];
            if (!Array.isArray(allowedAccounts) || !allowedAccounts.includes(req.user.id)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(file);
    } catch (error) {
        next(error);
    }
});

// 上传文件（管理员和超级管理员）
router.post('/', authenticateToken, requireRole('admin', 'superadmin'), async (req, res, next) => {
    try {
        const { fileName, url, allowedSubAccounts = [] } = req.body;

        if (!fileName || !url) {
            return res.status(400).json({ error: 'File name and URL are required' });
        }

        const id = generateId();
        const uploadedAt = Date.now();

        await pool.query(
            'INSERT INTO files (id, file_name, url, uploaded_by, uploaded_at, allowed_sub_accounts) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                id,
                fileName,
                url,
                req.user.id,
                uploadedAt,
                JSON.stringify(allowedSubAccounts)
            ]
        );

        const result = await pool.query('SELECT * FROM files WHERE id = $1', [id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 删除文件（管理员和超级管理员）
router.delete('/:id', authenticateToken, requireRole('admin', 'superadmin'), async (req, res, next) => {
    try {
        await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export { router as filesRoutes };
