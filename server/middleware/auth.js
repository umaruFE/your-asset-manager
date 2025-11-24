import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // 从数据库获取最新的用户信息（包括baseId）
        try {
            const result = await pool.query(
                'SELECT id, username, name, role, base_id FROM users WHERE id = $1',
                [decoded.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(403).json({ error: 'User not found' });
            }
            
            const user = result.rows[0];
            req.user = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                baseId: user.base_id // 使用baseId而不是base_id
            };
            next();
        } catch (dbError) {
            console.error('Database error in auth middleware:', dbError);
            return res.status(500).json({ error: 'Database error' });
        }
    });
}

// 角色权限检查中间件
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

// 检查用户是否有权限查看指定表单
export async function checkFormPermission(userId, formId) {
    try {
        // 超级管理员有所有权限
        const userResult = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) return false;
        if (userResult.rows[0].role === 'superadmin') return true;
        
        // 所有非超级管理员角色都需要检查用户权限表
        const permResult = await pool.query(
            'SELECT can_view FROM user_form_permissions WHERE user_id = $1 AND form_id = $2',
            [userId, formId]
        );

        return permResult.rows.length > 0 && permResult.rows[0].can_view === true;
    } catch (error) {
        console.error('Permission check error:', error);
        return false;
    }
}
