-- 初始化用户数据（PostgreSQL版本）

-- 首先需要确保 bases 表中有数据
INSERT INTO bases (id, name, description) VALUES
('base_001', '基地一', '第一个基地'),
('base_002', '基地二', '第二个基地'),
('base_003', '基地三', '第三个基地'),
('base_004', '基地四', '第四个基地'),
('base_005', '基地五', '第五个基地'),
('base_006', '基地六', '第六个基地'),
('base_007', '基地七', '第七个基地')
ON CONFLICT (id) DO NOTHING;

-- 使用 bcrypt 加密后的密码（password123）
-- 注意：实际使用时需要通过后端API生成，这里只是示例
-- 默认密码: password123

-- 超级管理员
INSERT INTO users (id, username, password, name, role, base_id) VALUES
('super_admin_001', 'superadmin', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '超级管理员', 'superadmin', NULL)
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    base_id = EXCLUDED.base_id;

-- 基地负责人和经手人（七个基地）
INSERT INTO users (id, username, password, name, role, base_id) VALUES
('base_manager_001', 'manager1', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人一', 'base_manager', 'base_001'),
('base_handler_001', 'handler1', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人一', 'base_handler', 'base_001'),
('base_manager_002', 'manager2', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人二', 'base_manager', 'base_002'),
('base_handler_002', 'handler2', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人二', 'base_handler', 'base_002'),
('base_manager_003', 'manager3', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人三', 'base_manager', 'base_003'),
('base_handler_003', 'handler3', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人三', 'base_handler', 'base_003'),
('base_manager_004', 'manager4', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人四', 'base_manager', 'base_004'),
('base_handler_004', 'handler4', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人四', 'base_handler', 'base_004'),
('base_manager_005', 'manager5', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人五', 'base_manager', 'base_005'),
('base_handler_005', 'handler5', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人五', 'base_handler', 'base_005'),
('base_manager_006', 'manager6', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人六', 'base_manager', 'base_006'),
('base_handler_006', 'handler6', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人六', 'base_handler', 'base_006'),
('base_manager_007', 'manager7', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地负责人七', 'base_manager', 'base_007'),
('base_handler_007', 'handler7', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '基地经手人七', 'base_handler', 'base_007')
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    base_id = EXCLUDED.base_id;

-- 公司资产员
INSERT INTO users (id, username, password, name, role, base_id) VALUES
('company_asset_001', 'asset1', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '公司资产员', 'company_asset', NULL)
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    base_id = EXCLUDED.base_id;

-- 公司财务
INSERT INTO users (id, username, password, name, role, base_id) VALUES
('company_finance_001', 'finance1', '$2a$10$rOzJqKqKqKqKqKqKqKqKqOqKqKqKqKqKqKqKqKqKqKqKqKqKqK', '公司财务', 'company_finance', NULL)
ON CONFLICT (username) DO UPDATE SET 
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    base_id = EXCLUDED.base_id;
