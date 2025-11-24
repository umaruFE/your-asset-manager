-- 重置所有用户密码为 password123
-- 注意：此SQL文件中的密码哈希值是占位符，不能直接使用
-- 请使用 server/scripts/initDatabase.js 脚本来重置密码

-- 如果必须使用SQL，请先运行以下命令生成正确的密码哈希：
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(hash => console.log(hash));"
-- 然后将生成的哈希值替换下面的占位符

-- 更新所有用户的密码为 password123
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'superadmin';
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'handler1';
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'handler2';
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'manager1';
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'asset1';
-- UPDATE users SET password = '生成的bcrypt哈希值' WHERE username = 'finance1';

-- 推荐方法：使用 Node.js 脚本重置密码
-- cd server && node scripts/initDatabase.js

