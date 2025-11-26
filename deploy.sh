#!/bin/bash

# 资产管理系统快速部署脚本
# 使用方法: bash deploy.sh

set -e

echo "=========================================="
echo "资产管理系统 - 快速部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 项目目录
PROJECT_DIR="/var/www/asset-manager"
SERVER_DIR="$PROJECT_DIR/server"

echo -e "${GREEN}步骤 1: 检查 Node.js 和 npm${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js 未安装，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

echo -e "${GREEN}步骤 2: 检查 PostgreSQL${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL 未安装，正在安装...${NC}"
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi
echo "PostgreSQL 已安装"

echo -e "${GREEN}步骤 3: 检查 PM2${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi
echo "PM2 已安装"

echo -e "${GREEN}步骤 4: 检查项目目录${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误: 项目目录不存在: $PROJECT_DIR${NC}"
    echo "请先将项目文件上传到服务器，或使用 Git 克隆项目"
    exit 1
fi
echo "项目目录存在: $PROJECT_DIR"

echo -e "${GREEN}步骤 5: 安装依赖${NC}"
cd "$PROJECT_DIR/server"
echo "安装后端依赖..."
npm install --production

cd "$PROJECT_DIR"
echo "安装前端依赖..."
npm install

echo -e "${GREEN}步骤 6: 配置数据库${NC}"
read -p "数据库用户 (默认: asset_user): " DB_USER
DB_USER=${DB_USER:-asset_user}

read -sp "数据库密码: " DB_PASSWORD
echo ""

read -p "数据库名称 (默认: asset_manager): " DB_NAME
DB_NAME=${DB_NAME:-asset_manager}

# 创建数据库和用户
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "数据库创建成功"

# 导入数据库结构
if [ -f "$PROJECT_DIR/database/schema.sql" ]; then
    echo "导入数据库结构..."
    sudo -u postgres psql -d $DB_NAME -f "$PROJECT_DIR/database/schema.sql"
    echo "数据库结构导入成功"
else
    echo -e "${YELLOW}警告: 未找到 database/schema.sql 文件${NC}"
fi

echo -e "${GREEN}步骤 7: 配置后端环境变量${NC}"
if [ ! -f "$SERVER_DIR/.env" ]; then
    read -p "JWT Secret (留空自动生成): " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    fi
    
    read -p "后端端口 (默认: 3001): " PORT
    PORT=${PORT:-3001}
    
    read -p "前端域名 (例如: https://yourdomain.com): " CORS_ORIGIN
    
    cat > "$SERVER_DIR/.env" <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

PORT=$PORT
NODE_ENV=production

CORS_ORIGIN=$CORS_ORIGIN
EOF
    echo "环境变量文件已创建: $SERVER_DIR/.env"
else
    echo "环境变量文件已存在，跳过创建"
fi

echo -e "${GREEN}步骤 8: 初始化用户数据${NC}"
cd "$SERVER_DIR"
npm run init-db || echo -e "${YELLOW}警告: 用户数据初始化失败，请手动运行: npm run init-db${NC}"

echo -e "${GREEN}步骤 9: 启动后端服务${NC}"
pm2 delete asset-manager-api 2>/dev/null || true
pm2 start index.js --name asset-manager-api
pm2 save

echo -e "${GREEN}步骤 10: 配置前端环境变量${NC}"
read -p "前端 API 地址 (例如: https://yourdomain.com/api 或 /api): " API_BASE_URL
API_BASE_URL=${API_BASE_URL:-/api}

cat > "$PROJECT_DIR/.env.production" <<EOF
VITE_API_BASE_URL=$API_BASE_URL
EOF
echo "前端环境变量文件已创建"

echo -e "${GREEN}步骤 11: 构建前端${NC}"
cd "$PROJECT_DIR"
npm run build

echo -e "${GREEN}步骤 12: 配置 Nginx${NC}"
read -p "域名或 IP 地址: " DOMAIN

NGINX_CONF="/etc/nginx/sites-available/asset-manager"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $PROJECT_DIR/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "=========================================="
echo -e "${NC}"
echo "访问地址: http://$DOMAIN"
echo ""
echo "默认账号:"
echo "  超级管理员: superadmin / password123"
echo ""
echo "重要提示:"
echo "  1. 首次登录后请立即修改密码"
echo "  2. 如需 HTTPS，请运行: sudo certbot --nginx -d $DOMAIN"
echo "  3. 查看后端日志: pm2 logs asset-manager-api"
echo "  4. 查看 Nginx 日志: tail -f /var/log/nginx/error.log"
echo ""
echo -e "${GREEN}部署成功！${NC}"

