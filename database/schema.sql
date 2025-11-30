-- 资产管理系统数据库设计
-- 数据库: PostgreSQL

-- 创建数据库（需要在PostgreSQL中手动执行）
-- CREATE DATABASE asset_manager;
-- \c asset_manager;

-- 创建扩展（如果需要JSON支持）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 基地表（没有依赖，最先创建）
CREATE TABLE IF NOT EXISTS bases (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE bases IS '基地表';

-- 2. 用户表（依赖 bases）
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'base_manager', 'company_asset', 'company_finance', 'base_handler')),
    base_id VARCHAR(50), -- 基地ID（基地经手人和基地负责人需要）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_base_id ON users(base_id);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.username IS '登录用户名';
COMMENT ON COLUMN users.password IS '密码（加密后）';
COMMENT ON COLUMN users.name IS '显示名称';
COMMENT ON COLUMN users.role IS '角色：superadmin-超级管理员, base_handler-基地经手人, base_manager-基地负责人, company_asset-公司资产员, company_finance-公司财务';
COMMENT ON COLUMN users.base_id IS '基地ID（基地经手人和基地负责人需要）';

-- 3. 表单模板表（没有依赖，但被其他表引用，需要先创建）
CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    archive_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (archive_status IN ('active', 'archived')),
    archive_version INTEGER NOT NULL DEFAULT 0,
    archived_at TIMESTAMP,
    archived_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);

COMMENT ON TABLE forms IS '表单模板表';
COMMENT ON COLUMN forms.name IS '表单名称';
COMMENT ON COLUMN forms.is_active IS '是否激活';
COMMENT ON COLUMN forms.archive_status IS '当前状态：active(未归档)/archived(已归档)';
COMMENT ON COLUMN forms.archive_version IS '归档版本计数';
COMMENT ON COLUMN forms.archived_at IS '最近一次归档时间';
COMMENT ON COLUMN forms.archived_by IS '最近一次归档人';

-- 4. 用户表单权限表（依赖 users 和 forms）
CREATE TABLE IF NOT EXISTS user_form_permissions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    form_id VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE(user_id, form_id)
);

CREATE INDEX IF NOT EXISTS idx_user_form_permissions_user_id ON user_form_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_form_permissions_form_id ON user_form_permissions(form_id);

COMMENT ON TABLE user_form_permissions IS '用户表单权限表';

-- 5. 表单字段表（依赖 forms）
CREATE TABLE IF NOT EXISTS form_fields (
    id VARCHAR(50) PRIMARY KEY,
    form_id VARCHAR(50) NOT NULL,
    field_key VARCHAR(100) NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'number', 'date', 'textarea', 'formula', 'select')),
    display_precision SMALLINT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    formula TEXT,
    options JSONB,
    history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE(form_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_active ON form_fields(active);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields("order");
CREATE INDEX IF NOT EXISTS idx_form_fields_field_key ON form_fields(field_key);

COMMENT ON TABLE form_fields IS '表单字段表';
COMMENT ON COLUMN form_fields.form_id IS '所属表单ID';
COMMENT ON COLUMN form_fields.field_key IS '字段的稳定标识，用于引用公式';
COMMENT ON COLUMN form_fields.name IS '字段名称';
COMMENT ON COLUMN form_fields.type IS '字段类型';
COMMENT ON COLUMN form_fields.display_precision IS '数字字段默认展示小数位数';
COMMENT ON COLUMN form_fields.options IS '选项列表（用于下拉单选等）';
COMMENT ON COLUMN form_fields.active IS '是否激活';
COMMENT ON COLUMN form_fields."order" IS '排序顺序';
COMMENT ON COLUMN form_fields.formula IS '公式（仅formula类型）';
COMMENT ON COLUMN form_fields.history IS '历史记录';

-- 6. 归档记录表（依赖 forms, users）
CREATE TABLE IF NOT EXISTS form_archives (
    id VARCHAR(50) PRIMARY KEY,
    form_id VARCHAR(50) NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    version INTEGER NOT NULL,
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_by VARCHAR(50),
    file_path VARCHAR(500),
    file_type VARCHAR(20) DEFAULT 'json',
    fields_snapshot JSONB NOT NULL,
    data_snapshot JSONB NOT NULL,
    metadata JSONB,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(form_id, version)
);

COMMENT ON TABLE form_archives IS '表单归档记录表';
COMMENT ON COLUMN form_archives.version IS '归档版本号，从1递增';
COMMENT ON COLUMN form_archives.fields_snapshot IS '归档时的字段定义快照';
COMMENT ON COLUMN form_archives.data_snapshot IS '归档时的数据快照（JSON）';
COMMENT ON COLUMN form_archives.file_path IS '归档生成的文件路径';
COMMENT ON COLUMN form_archives.metadata IS '归档统计信息';

CREATE INDEX IF NOT EXISTS idx_form_archives_form_id ON form_archives(form_id);
CREATE INDEX IF NOT EXISTS idx_form_archives_archived_at ON form_archives(archived_at);

-- 7. 资产记录表（依赖 forms, users, bases）
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(50) PRIMARY KEY,
    form_id VARCHAR(50) NOT NULL,
    form_name VARCHAR(200) NOT NULL,
    sub_account_id VARCHAR(50) NOT NULL,
    sub_account_name VARCHAR(100) NOT NULL,
    base_id VARCHAR(50), -- 基地ID（基地经手人提交时记录）
    submitted_at BIGINT NOT NULL,
    fields_snapshot JSONB,
    batch_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE RESTRICT,
    FOREIGN KEY (sub_account_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_form_id ON assets(form_id);
CREATE INDEX IF NOT EXISTS idx_assets_sub_account_id ON assets(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_assets_base_id ON assets(base_id);
CREATE INDEX IF NOT EXISTS idx_assets_submitted_at ON assets(submitted_at);

COMMENT ON TABLE assets IS '资产记录表';
COMMENT ON COLUMN assets.form_id IS '表单ID';
COMMENT ON COLUMN assets.form_name IS '表单名称（快照）';
COMMENT ON COLUMN assets.sub_account_id IS '提交用户ID';
COMMENT ON COLUMN assets.sub_account_name IS '提交用户名（快照）';
COMMENT ON COLUMN assets.base_id IS '基地ID';
COMMENT ON COLUMN assets.submitted_at IS '提交时间戳';
COMMENT ON COLUMN assets.fields_snapshot IS '字段快照';
COMMENT ON COLUMN assets.batch_data IS '批量数据';

-- 7. 文件表（依赖 users）
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(50) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at BIGINT NOT NULL,
    allowed_sub_accounts JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

COMMENT ON TABLE files IS '文件表';
COMMENT ON COLUMN files.file_name IS '文件名';
COMMENT ON COLUMN files.url IS '文件URL';
COMMENT ON COLUMN files.uploaded_by IS '上传用户ID';
COMMENT ON COLUMN files.uploaded_at IS '上传时间戳';
COMMENT ON COLUMN files.allowed_sub_accounts IS '允许访问的子账号ID列表';

-- 8. 统计报表表（依赖 users）
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_by VARCHAR(50) NOT NULL,
    config JSONB NOT NULL, -- 报表配置：选择的表、字段、聚合函数等
    access_rules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

COMMENT ON TABLE reports IS '统计报表表';
COMMENT ON COLUMN reports.name IS '报表名称';
COMMENT ON COLUMN reports.description IS '报表描述';
COMMENT ON COLUMN reports.created_by IS '创建者ID';
COMMENT ON COLUMN reports.config IS '报表配置JSON';
COMMENT ON COLUMN reports.access_rules IS '访问控制: roles/users';

-- 创建更新updated_at的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加updated_at触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
