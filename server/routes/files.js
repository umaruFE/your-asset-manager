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
        // 检查角色权限：只有基地经手人、基地负责人、资产员和财务员可以查看文件列表
        const allowedRoles = ['base_handler', 'base_manager', 'company_asset', 'company_finance'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足：您无权查看文件列表' });
        }

        let query = 'SELECT * FROM files WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // 资产管理员和财务员可以看到：
        // 1. 自己上传的所有文件
        // 2. 对方（资产管理员或财务员）上传的所有文件
        // 3. 被授权给自己的文件
        // 其他角色只能看被授权的文件
        if (req.user.role === 'company_asset' || req.user.role === 'company_finance') {
            // 获取所有资产管理员和财务员的用户ID
            const uploaderRolesResult = await pool.query(
                'SELECT id FROM users WHERE role IN ($1, $2)',
                ['company_asset', 'company_finance']
            );
            const uploaderIds = uploaderRolesResult.rows.map(row => row.id);
            
            if (uploaderIds.length > 0) {
                query += ` AND (uploaded_by = ANY($${paramIndex++}::text[]) OR allowed_sub_accounts @> $${paramIndex++}::jsonb)`;
                params.push(uploaderIds);
                params.push(JSON.stringify([req.user.id]));
            } else {
                // 如果没有找到资产管理员或财务员，只返回被授权的文件
                query += ` AND allowed_sub_accounts @> $${paramIndex++}::jsonb`;
                params.push(JSON.stringify([req.user.id]));
            }
        } else {
            // 基地经手人、基地负责人只能看被授权的文件
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
        // 检查角色权限
        const allowedRoles = ['base_handler', 'base_manager', 'company_asset', 'company_finance'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足：您无权查看文件' });
        }

        const result = await pool.query(
            'SELECT * FROM files WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];

        // 所有角色都只能看被授权的文件
        const allowedAccounts = file.allowed_sub_accounts || [];
        if (!Array.isArray(allowedAccounts) || !allowedAccounts.includes(req.user.id)) {
            return res.status(403).json({ error: '权限不足：您无权查看此文件' });
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

// 上传文件（仅资产员和财务员）
router.post('/', authenticateToken, requireRole('company_asset', 'company_finance'), upload.single('file'), async (req, res, next) => {
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

// 下载文件（基地经手人、基地负责人、资产员和财务员）
router.get('/:id/download', authenticateToken, async (req, res, next) => {
    try {
        // 检查角色权限：只有基地经手人、基地负责人、资产员和财务员可以下载
        const allowedRoles = ['base_handler', 'base_manager', 'company_asset', 'company_finance'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足：您无权下载文件' });
        }

        const result = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const file = result.rows[0];
        
        // 权限检查：与文件列表逻辑一致
        // 资产管理员和财务员可以下载：
        // 1. 自己上传的文件
        // 2. 其他资产管理员或财务员上传的文件
        // 3. 被授权给自己的文件
        // 其他角色只能下载被授权的文件
        if (req.user.role === 'company_asset' || req.user.role === 'company_finance') {
            // 检查是否是上传者本人
            const isOwner = file.uploaded_by === req.user.id;
            
            // 检查是否是其他资产管理员或财务员上传的
            let isUploadedByAssetOrFinance = false;
            if (!isOwner) {
                const uploaderResult = await pool.query(
                    'SELECT role FROM users WHERE id = $1',
                    [file.uploaded_by]
                );
                if (uploaderResult.rows.length > 0) {
                    const uploaderRole = uploaderResult.rows[0].role;
                    isUploadedByAssetOrFinance = uploaderRole === 'company_asset' || uploaderRole === 'company_finance';
                }
            }
            
            // 检查是否在授权列表中
            const allowedAccounts = file.allowed_sub_accounts || [];
            const isAuthorized = Array.isArray(allowedAccounts) && allowedAccounts.includes(req.user.id);
            
            // 如果既不是上传者，也不是其他资产/财务员上传的，也不在授权列表中，则拒绝
            if (!isOwner && !isUploadedByAssetOrFinance && !isAuthorized) {
                return res.status(403).json({ error: '权限不足：您无权下载此文件' });
            }
        } else {
            // 基地经手人、基地负责人只能下载被授权的文件
            const allowedAccounts = file.allowed_sub_accounts || [];
            if (!Array.isArray(allowedAccounts) || !allowedAccounts.includes(req.user.id)) {
                return res.status(403).json({ error: '权限不足：您无权下载此文件' });
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

// 更新文件权限
router.put('/:id/permissions', authenticateToken, requireRole('company_asset', 'company_finance'), async (req, res, next) => {
    try {
        const fileId = req.params.id;
        const { allowedSubAccounts } = req.body;

        // 验证文件是否存在
        const fileResult = await pool.query('SELECT * FROM files WHERE id = $1', [fileId]);
        if (fileResult.rows.length === 0) {
            return res.status(404).json({ error: '文件未找到' });
        }

        const file = fileResult.rows[0];
        
        // 只有上传者本人可以修改权限
        const isOwner = file.uploaded_by === req.user.id;
        
        if (!isOwner) {
            return res.status(403).json({ error: '权限不足：仅上传者本人可修改权限' });
        }

        // 更新权限
        await pool.query(
            'UPDATE files SET allowed_sub_accounts = $1 WHERE id = $2',
            [JSON.stringify(allowedSubAccounts || []), fileId]
        );

        const updatedResult = await pool.query('SELECT * FROM files WHERE id = $1', [fileId]);
        res.json(updatedResult.rows[0]);
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

        // 删除物理文件
        const url = file.url || '';
        if (url.startsWith('/uploads/')) {
            const filename = url.replace('/uploads/', '');
            const filePath = path.join(uploadsDir, filename);
            if (fs.existsSync(filePath)) {
                try {
                    await fs.promises.unlink(filePath);
                    console.log(`文件已从磁盘删除: ${filePath}`);
                } catch (fileError) {
                    console.warn(`删除物理文件失败: ${fileError.message}`);
                    // 继续删除数据库记录，即使物理文件删除失败
                }
            }
        }

        // 删除数据库记录
        await pool.query('DELETE FROM files WHERE id = $1', [fileId]);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export { router as filesRoutes };
