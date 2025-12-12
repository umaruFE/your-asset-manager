import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './routes/auth.js';
import { usersRoutes } from './routes/users.js';
import { formsRoutes } from './routes/forms.js';
import { assetsRoutes } from './routes/assets.js';
import { filesRoutes } from './routes/files.js';
import { reportsRoutes } from './routes/reports.js';
import { permissionsRoutes } from './routes/permissions.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'storage', 'uploads');

// 中间件
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/permissions', permissionsRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Error stack:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err.detail || err.code
        })
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// 启动服务器前测试数据库连接
testConnection().then(connected => {
    if (!connected) {
        console.error('Failed to connect to database. Please check your database configuration.');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});


