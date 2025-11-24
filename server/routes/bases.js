import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateId } from '../utils/helpers.js';

const router = express.Router();

// 获取所有基地（超级管理员和管理员）
router.get('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM bases ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// 获取单个基地
router.get('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM bases WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Base not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// 创建基地（仅超级管理员）
router.post('/', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
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
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Base name already exists' });
        }
        next(error);
    }
});

// 更新基地（仅超级管理员）
router.put('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        const { name, description } = req.body;

        await pool.query(
            'UPDATE bases SET name = $1, description = $2 WHERE id = $3',
            [name, description, req.params.id]
        );

        const result = await pool.query('SELECT * FROM bases WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Base not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Base name already exists' });
        }
        next(error);
    }
});

// 删除基地（仅超级管理员）
router.delete('/:id', authenticateToken, requireRole('superadmin'), async (req, res, next) => {
    try {
        await pool.query('DELETE FROM bases WHERE id = $1', [req.params.id]);
        res.json({ message: 'Base deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export { router as basesRoutes };

