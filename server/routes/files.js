import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/helpers.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

const uploadsDir = path.join(process.cwd(), 'server', 'storage', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const upload = multer({ storage });

// 上传文件（基地负责人/资产员/财务/超级管理员）
router.post('/', authenticateToken, requireRole('base_manager', 'company_asset', 'company_finance', 'superadmin'), upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '文件不能为空' });
        }
        const allowedSubAccountsRaw = req.body.allowedSubAccounts;
        let allowedSubAccounts = [];
        if (allowedSubAccountsRaw) {
            try {
                allowedSubAccounts = JSON.parse(allowedSubAccountsRaw);
            } catch {
                allowedSubAccounts = [];
            }
        }
        const fileName = req.body.fileName || req.file.originalname;
        const urlPath = `/uploads/${req.file.filename}`;

        const id = generateId();
        const uploadedAt = Date.now();

        await pool.query(
            'INSERT INTO files (id, file_name, url, uploaded_by, uploaded_at, allowed_sub_accounts) VALUES ($1, $2, $3, $4, $5, $6)',
            [
                id,
                fileName,
                urlPath,
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

// 下载文件
router.get('/:id/download', authenticateToken, async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const file = result.rows[0];
        // 权限检查
        if (req.user.role === 'subaccount') {
            const allowedAccounts = file.allowed_sub_accounts || [];
            if (!Array.isArray(allowedAccounts) || !allowedAccounts.includes(req.user.id)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const url = file.url || '';
        if (!url.startsWith('/uploads/')) {
            return res.status(400).json({ error: 'File not stored locally' });
        }
        const filename = url.replace('/uploads/', '');
        const filePath = path.join(uploadsDir, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        res.download(filePath, file.file_name || filename);
    } catch (error) {
        next(error);
    }
});

// 删除文件（上传者本人或超级管理员）
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        const fileId = req.params.id;
        const result = await pool.query('SELECT * FROM files WHERE id = $1', [fileId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const file = result.rows[0];
        const isOwner = file.uploaded_by === req.user.id;
        const isSuper = req.user.role === 'superadmin';

        if (!isOwner && !isSuper) {
            return res.status(403).json({ error: '权限不足：仅上传者本人可删除' });
        }

        await pool.query('DELETE FROM files WHERE id = $1', [fileId]);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export { router as filesRoutes };
