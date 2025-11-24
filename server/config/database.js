import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// 创建PostgreSQL连接池
export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_manager',
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 测试数据库连接
export async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected successfully');
        console.log('Database time:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// 处理连接错误
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
