# 资产管理系统 - 后端实现指南

## 项目结构

```
your-asset-manager/
├── server/                 # 后端服务器
│   ├── config/            # 配置文件
│   │   └── database.js    # 数据库连接
│   ├── middleware/        # 中间件
│   │   └── auth.js        # 认证中间件
│   ├── routes/            # 路由
│   │   ├── auth.js        # 认证路由
│   │   ├── users.js       # 用户路由
│   │   ├── forms.js       # 表单路由
│   │   ├── assets.js     # 资产路由
│   │   └── files.js      # 文件路由
│   ├── utils/            # 工具函数
│   │   └── helpers.js    # 辅助函数
│   ├── scripts/          # 脚本
│   │   └── initDatabase.js  # 初始化数据库
│   ├── index.js           # 服务器入口
│   ├── package.json       # 依赖配置
│   └── .env.example      # 环境变量示例
├── database/              # 数据库
│   └── schema.sql        # 数据库结构
└── src/                  # 前端代码
    └── utils/
        └── api.js        # API客户端
```

## 安装步骤

### 1. 安装数据库

确保已安装 PostgreSQL 12 或更高版本。

### 2. 创建数据库

```bash
# 登录PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE asset_manager;

# 退出并连接到新数据库
\q
psql -U postgres -d asset_manager

# 执行SQL脚本
\i database/schema.sql
```

或者直接执行：
```bash
psql -U postgres -d asset_manager -f database/schema.sql
```

### 3. 安装后端依赖

```bash
cd server
npm install
```

### 4. 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，设置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=asset_manager

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:5173
```

### 5. 初始化用户数据

```bash
cd server
npm run init-db
```

这将创建所有用户，默认密码为 `password123`。

### 6. 启动后端服务器

```bash
cd server
npm start
```

开发模式（自动重启）：
```bash
npm run dev
```

### 7. 配置前端环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 默认用户账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| superadmin | password123 | 超级管理员 |
| admin | password123 | 管理员 |
| subaccount1 | password123 | 子账号 |
| subaccount2 | password123 | 子账号 |
| subaccount3 | password123 | 子账号 |
| subaccount4 | password123 | 子账号 |
| subaccount5 | password123 | 子账号 |

**重要：首次登录后请立即修改密码！**

## API端点

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/verify` - 验证token

### 用户
- `GET /api/users` - 获取所有用户（需管理员权限）
- `GET /api/users/me` - 获取当前用户信息

### 表单
- `GET /api/forms` - 获取所有表单
- `GET /api/forms/:id` - 获取单个表单
- `POST /api/forms` - 创建表单（需超级管理员）
- `PUT /api/forms/:id` - 更新表单（需超级管理员）
- `DELETE /api/forms/:id` - 删除表单（需超级管理员）

### 字段
- `POST /api/forms/:formId/fields` - 添加字段（需超级管理员）
- `PUT /api/forms/:formId/fields/:fieldId` - 更新字段（需超级管理员）
- `PUT /api/forms/:formId/fields/order` - 更新字段顺序（需超级管理员）
- `DELETE /api/forms/:formId/fields/:fieldId` - 删除字段（需超级管理员）

### 资产
- `GET /api/assets` - 获取所有资产记录
- `GET /api/assets/:id` - 获取单个资产记录
- `POST /api/assets` - 创建资产记录

### 文件
- `GET /api/files` - 获取所有文件
- `GET /api/files/:id` - 获取单个文件
- `POST /api/files` - 上传文件（需管理员权限）
- `DELETE /api/files/:id` - 删除文件（需管理员权限）

## 权限说明

- **超级管理员 (superadmin)**：所有权限
- **管理员 (admin)**：查看所有数据，管理文件和用户
- **子账号 (subaccount)**：只能查看和提交自己的数据

## 安全注意事项

1. 生产环境必须修改 `JWT_SECRET` 为强随机字符串
2. 使用 HTTPS
3. 定期更新密码
4. 限制数据库访问权限
5. 实施速率限制（Rate Limiting）
6. 添加输入验证和SQL注入防护

## 故障排除

### 数据库连接失败
- 检查 PostgreSQL 服务是否运行
- 验证 `.env` 中的数据库配置
- 确认数据库用户有足够权限
- 检查 PostgreSQL 的 `pg_hba.conf` 配置允许连接

### CORS 错误
- 检查 `CORS_ORIGIN` 配置
- 确认前端URL与配置一致

### Token 验证失败
- 检查 `JWT_SECRET` 是否一致
- 确认token未过期
- 检查请求头格式：`Authorization: Bearer <token>`

