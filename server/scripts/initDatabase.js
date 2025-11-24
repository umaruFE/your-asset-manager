import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
    try {
        console.log('Initializing database...');

        // 默认密码
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 先创建基地（如果不存在）
        const bases = [
            { id: 'base_001', name: '基地一', description: '第一个基地' },
            { id: 'base_002', name: '基地二', description: '第二个基地' },
            { id: 'base_003', name: '基地三', description: '第三个基地' },
            { id: 'base_004', name: '基地四', description: '第四个基地' },
            { id: 'base_005', name: '基地五', description: '第五个基地' },
            { id: 'base_006', name: '基地六', description: '第六个基地' },
            { id: 'base_007', name: '基地七', description: '第七个基地' }
        ];

        for (const base of bases) {
            await pool.query(
                `INSERT INTO bases (id, name, description) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (id) DO NOTHING`,
                [base.id, base.name, base.description]
            );
            console.log(`Base ${base.name} initialized`);
        }

        // 初始化用户
        const users = [
            // 超级管理员
            { id: 'super_admin_001', username: 'superadmin', name: '超级管理员', role: 'superadmin', baseId: null },
            
            // 公司资产员和财务
            { id: 'company_asset_001', username: 'asset1', name: '公司资产员', role: 'company_asset', baseId: null },
            { id: 'company_finance_001', username: 'finance1', name: '公司财务', role: 'company_finance', baseId: null },
            
            // 七个基地的负责人和经手人
            { id: 'base_manager_001', username: 'manager1', name: '基地负责人一', role: 'base_manager', baseId: 'base_001' },
            { id: 'base_handler_001', username: 'handler1', name: '基地经手人一', role: 'base_handler', baseId: 'base_001' },
            
            { id: 'base_manager_002', username: 'manager2', name: '基地负责人二', role: 'base_manager', baseId: 'base_002' },
            { id: 'base_handler_002', username: 'handler2', name: '基地经手人二', role: 'base_handler', baseId: 'base_002' },
            
            { id: 'base_manager_003', username: 'manager3', name: '基地负责人三', role: 'base_manager', baseId: 'base_003' },
            { id: 'base_handler_003', username: 'handler3', name: '基地经手人三', role: 'base_handler', baseId: 'base_003' },
            
            { id: 'base_manager_004', username: 'manager4', name: '基地负责人四', role: 'base_manager', baseId: 'base_004' },
            { id: 'base_handler_004', username: 'handler4', name: '基地经手人四', role: 'base_handler', baseId: 'base_004' },
            
            { id: 'base_manager_005', username: 'manager5', name: '基地负责人五', role: 'base_manager', baseId: 'base_005' },
            { id: 'base_handler_005', username: 'handler5', name: '基地经手人五', role: 'base_handler', baseId: 'base_005' },
            
            { id: 'base_manager_006', username: 'manager6', name: '基地负责人六', role: 'base_manager', baseId: 'base_006' },
            { id: 'base_handler_006', username: 'handler6', name: '基地经手人六', role: 'base_handler', baseId: 'base_006' },
            
            { id: 'base_manager_007', username: 'manager7', name: '基地负责人七', role: 'base_manager', baseId: 'base_007' },
            { id: 'base_handler_007', username: 'handler7', name: '基地经手人七', role: 'base_handler', baseId: 'base_007' }
        ];

        for (const user of users) {
            await pool.query(
                `INSERT INTO users (id, username, password, name, role, base_id) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 ON CONFLICT (username) DO UPDATE SET 
                    password = EXCLUDED.password, 
                    name = EXCLUDED.name, 
                    role = EXCLUDED.role, 
                    base_id = EXCLUDED.base_id`,
                [user.id, user.username, hashedPassword, user.name, user.role, user.baseId]
            );
            console.log(`User ${user.username} (${user.name}) initialized with password: ${defaultPassword}`);
        }

        console.log('Database initialization completed!');
        console.log(`Default password for all users: ${defaultPassword}`);
        console.log('Please change passwords after first login!');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        await pool.end();
        process.exit(1);
    }
}

initDatabase();
