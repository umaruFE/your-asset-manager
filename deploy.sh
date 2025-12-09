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
PROJECT_DIR="/root/your-asset-manager/"
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
# 多种方式检测 PM2
# 1. 尝试加载用户的环境变量 (为了识别 NVM 安装的 PM2)
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
[ -s "$HOME/.bashrc" ] && source "$HOME/.bashrc"
[ -s "/etc/profile" ] && source "/etc/profile"

# 2. 强制刷新 Shell 命令哈希表 (防止刚安装 Node 找不到命令)
hash -r 2>/dev/null || true

# 3. 检测 PM2 函数
function check_pm2() {
    # 检测 command, which, 或者是 npm list (更稳健)
    if command -v pm2 &> /dev/null; then
        return 0
    elif [ -f "/usr/bin/pm2" ] || [ -f "/usr/local/bin/pm2" ]; then
        return 0
    else
        return 1
    fi
}

if check_pm2; then
    # 获取版本号的逻辑稍微优化，防止报错
    PM2_VERSION=$(pm2 -v 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "未知版本")
    echo "PM2 已安装 (版本: $PM2_VERSION)"
else
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    
    # 尝试安装
    npm install -g pm2
    
    # 安装完再次刷新路径，确保后续命令可用
    hash -r 2>/dev/null || true
    
    # 再次验证
    if command -v pm2 &> /dev/null; then
        echo "PM2 安装成功"
    else
        echo -e "${RED}错误: PM2 安装失败，请检查 npm 是否正确安装${NC}"
        # 如果是 NVM 环境，尝试创建软链接作为兜底
        NODE_BIN_DIR=$(npm bin -g 2>/dev/null)
        if [ -f "$NODE_BIN_DIR/pm2" ]; then
             ln -sf "$NODE_BIN_DIR/pm2" /usr/bin/pm2
             echo "已创建 PM2 软链接"
        else
             exit 1
        fi
    fi
fi

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

# echo -e "${GREEN}步骤 6: 配置数据库${NC}"
# read -p "数据库用户 (默认: asset_user): " DB_USER
# DB_USER=${DB_USER:-asset_user}

# read -sp "数据库密码: " DB_PASSWORD
# echo ""

# read -p "数据库名称 (默认: asset_manager): " DB_NAME
# DB_NAME=${DB_NAME:-asset_manager}

# # 创建数据库和用户
# sudo -u postgres psql <<EOF
# CREATE DATABASE $DB_NAME;
# CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
# GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
# \q
# EOF

# echo "数据库创建成功"

# # 导入数据库结构
# if [ -f "$PROJECT_DIR/database/schema.sql" ]; then
#     echo "导入数据库结构..."
#     sudo -u postgres psql -d $DB_NAME -f "$PROJECT_DIR/database/schema.sql"
#     echo "数据库结构导入成功"
# else
#     echo -e "${YELLOW}警告: 未找到 database/schema.sql 文件${NC}"
# fi

echo -e "${GREEN}步骤 6: 配置后端环境变量${NC}"
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

# echo -e "${GREEN}步骤 8: 初始化用户数据${NC}"
# cd "$SERVER_DIR"
# npm run init-db || echo -e "${YELLOW}警告: 用户数据初始化失败，请手动运行: npm run init-db${NC}"
echo -e "${GREEN}步骤 7: 启动后端服务${NC}"

# --- 1. 切换到后端目录 (最优先) ---
# 只有进入目录，pm2 才能正确找到 index.js 和 .env
if [ -d "$SERVER_DIR" ]; then
    echo "切换到后端目录: $SERVER_DIR"
    cd "$SERVER_DIR"
else
    echo "切换到后端目录: $PROJECT_DIR/server"
    cd "$PROJECT_DIR/server"
fi

# --- 2. 确定 PM2 启动命令 ---
# 不再去折腾系统路径，避免死循环报错。
# 逻辑：
# 1. 如果系统里直接敲 pm2 能用，就用 pm2
# 2. 如果不行，就用 npx pm2 (最稳妥，自动查找 node 环境)
# 3. 最后才尝试拼接 npm 全局路径

echo "正在选择最佳启动方式..."

if command -v pm2 &> /dev/null; then
    PM2_CMD="pm2"
    echo "使用系统命令: pm2"
elif command -v npx &> /dev/null; then
    PM2_CMD="npx pm2"
    echo "使用 npx 代理: npx pm2"
else
    # 最后的兜底
    NPM_BIN=$(npm bin -g 2>/dev/null)
    PM2_CMD="$NPM_BIN/pm2"
    echo "使用绝对路径: $PM2_CMD"
fi

# --- 3. 启动服务 ---
echo "正在执行启动..."

# 为了防止之前的死循环链接残留，尝试清理一下 (如果不是文件本身)
if [ -L "/usr/bin/pm2" ] && [ ! -e "/usr/bin/pm2" ]; then
    echo "清理无效的 pm2 软链接..."
    rm -f "/usr/bin/pm2"
fi

# 执行命令
$PM2_CMD delete asset-manager-api 2>/dev/null || true
$PM2_CMD start index.js --name asset-manager-api
$PM2_CMD save

# --- 4. 验证 ---
if $PM2_CMD list | grep -q "asset-manager-api"; then
    echo -e "${GREEN}后端服务已成功启动！${NC}"
else
    echo -e "${RED}服务启动检查未通过。${NC}"
    echo "请尝试手动进入目录启动:"
    echo "cd $SERVER_DIR"
    echo "pm2 start index.js --name asset-manager-api"
fi


echo -e "${GREEN}步骤 8: 选择部署模式${NC}"
echo ""
echo "请选择部署模式："
echo "  1) 使用 Nginx 反向代理（生产环境推荐）"
echo "  2) 直接访问后端服务（本地开发模式）"
echo ""
read -p "请选择 [1/2, 默认: 1]: " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-1}

if [ "$DEPLOY_MODE" = "2" ]; then
    # 本地开发模式：直接访问后端
    echo ""
    echo -e "${GREEN}已选择: 本地开发模式${NC}"
    echo ""
    read -p "后端服务地址 (默认: http://localhost:3001): " BACKEND_URL
    BACKEND_URL=${BACKEND_URL:-http://localhost:3001}
    
    API_BASE_URL="$BACKEND_URL/api"
    echo ""
    echo -e "${GREEN}✓ 前端 API 地址: $API_BASE_URL${NC}"
    echo "  说明: 前端将直接访问后端服务"
    echo ""
    
    USE_NGINX=false
else
    # Nginx 模式
    echo ""
    echo -e "${GREEN}已选择: Nginx 反向代理模式${NC}"
    echo ""
    # 默认使用固定 IP，回车直接采用默认
    read -p "域名或 IP 地址 (默认: 123.57.23.174): " DOMAIN
    DOMAIN=${DOMAIN:-123.57.23.174}
    
    # 判断是否使用 HTTPS（如果域名不是 IP 地址，默认使用 HTTPS）
    USE_HTTPS=false
    if [[ ! "$DOMAIN" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        read -p "是否使用 HTTPS? (Y/n, 默认: n): " USE_HTTPS_INPUT
        if [[ "$USE_HTTPS_INPUT" =~ ^[Yy]$ ]]; then
            USE_HTTPS=true
            PROTOCOL="https"
        else
            PROTOCOL="http"
        fi
    else
        PROTOCOL="http"
    fi
    
    echo ""
    echo -e "${GREEN}步骤 10: 配置前端环境变量${NC}"
    echo ""
    echo "=========================================="
    echo "前端 API 地址配置说明："
    echo "=========================================="
    echo ""
    echo "根据您的 Nginx 配置，前后端部署在同一域名下。"
    echo ""
    echo "推荐配置（直接回车即可）："
    echo "  → /api  (相对路径，自动适配当前域名)"
    echo ""
    echo "如果前后端分离部署，请输入完整 URL，例如："
    echo "  → https://api.yourdomain.com/api"
    echo "  → http://123.456.789.0:3001/api"
    echo ""
    echo "=========================================="
    echo ""
    read -p "前端 API 地址 [默认: /api]: " API_BASE_URL
    
    # 如果没有输入，使用默认的相对路径（推荐方案）
    if [ -z "$API_BASE_URL" ]; then
        API_BASE_URL="/api"
        echo ""
        echo -e "${GREEN}✓ 使用默认值: $API_BASE_URL${NC}"
        echo "  说明: 相对路径，前端会自动使用当前访问的域名"
        echo "  例如: 访问 $PROTOCOL://$DOMAIN 时，API 请求会发送到 $PROTOCOL://$DOMAIN/api"
    else
        echo ""
        echo -e "${GREEN}✓ 使用自定义值: $API_BASE_URL${NC}"
    fi
    echo ""
    
    USE_NGINX=true
fi

echo -e "${GREEN}步骤 9: 配置前端环境变量${NC}"

cat > "$PROJECT_DIR/.env.production" <<EOF
VITE_API_BASE_URL=$API_BASE_URL
EOF
echo "前端环境变量文件已创建: $PROJECT_DIR/.env.production"

echo -e "${GREEN}步骤 11: 构建前端${NC}"
cd "$PROJECT_DIR"
npm run build

echo -e "${GREEN}步骤 10: 构建并部署前端${NC}"
cd "$PROJECT_DIR"
npm run build

# 定义目标目录
TARGET_DIR="/usr/share/nginx/html"

echo "正在部署到: $TARGET_DIR"

# 1. 确保目标目录存在
if [ ! -d "$TARGET_DIR" ]; then
    mkdir -p "$TARGET_DIR"
fi

# 2. 清空旧文件 (安全检查：确保变量不为空)
if [ -n "$TARGET_DIR" ] && [ "$TARGET_DIR" != "/" ]; then
    rm -rf "$TARGET_DIR"/*
fi

# 3. 复制新文件
if [ -d "$PROJECT_DIR/dist" ]; then
    cp -rf "$PROJECT_DIR/dist/"* "$TARGET_DIR/"
    echo "文件已复制"
else
    echo -e "${RED}错误: 构建失败，dist 目录不存在${NC}"
    exit 1
fi

# 4. 修正权限 (非常重要！否则 Nginx 会报 403 Forbidden)
# 给予所有用户读取权限，目录给予执行权限
chmod -R 755 "$TARGET_DIR"

echo -e "${GREEN}=========================================="
echo "部署完成！"
echo "=========================================="
echo -e "${NC}"

if [ "$USE_NGINX" = true ]; then
    echo "访问地址: $PROTOCOL://$DOMAIN"
    echo ""
    echo "默认账号:"
    echo "  超级管理员: superadmin / password123"
    echo ""
    echo "重要提示:"
    echo "  1. 首次登录后请立即修改密码"
    if [ "$USE_HTTPS" = false ]; then
        echo "  2. 如需 HTTPS，请运行: sudo certbot --nginx -d $DOMAIN"
    fi
    echo "  3. 查看后端日志: pm2 logs asset-manager-api"
    echo "  4. 查看 Nginx 日志: tail -f /var/log/nginx/error.log"
else
    echo "本地开发模式部署完成！"
    echo ""
    echo "后端服务:"
    echo "  地址: $BACKEND_URL"
    echo "  状态: 已通过 PM2 启动"
    echo ""
    echo "前端构建:"
    echo "  目录: $PROJECT_DIR/dist"
    echo "  API 地址: $API_BASE_URL"
    echo ""
    echo "启动前端开发服务器:"
    echo "  cd $PROJECT_DIR && npm run dev"
    echo ""
    echo "或使用静态文件服务器:"
    echo "  cd $PROJECT_DIR/dist && python3 -m http.server 8080"
    echo "  然后访问: http://localhost:8080"
    echo ""
    echo "默认账号:"
    echo "  超级管理员: superadmin / password123"
    echo ""
    echo "重要提示:"
    echo "  1. 首次登录后请立即修改密码"
    echo "  2. 查看后端日志: pm2 logs asset-manager-api"
fi

echo ""
echo -e "${GREEN}部署成功！${NC}"

