import React, { useState } from 'react';
import { Button, InputGroup } from '../utils/UI';
import { authAPI } from '../utils/api';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      if (response.user) {
        onLogin(response.user);
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          资产文件管理系统
        </h2>
        <p className="text-center text-gray-600">请输入用户名和密码登录</p>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputGroup label="用户名">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入用户名"
              required
              autoFocus
            />
          </InputGroup>

          <InputGroup label="密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入密码"
              required
            />
          </InputGroup>

            <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full justify-center py-3"
            >
            {loading ? '登录中...' : '登录'}
            </Button>
        </form>

        {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">默认账号（密码均为 password123）：</p>
          <div className="text-xs text-blue-600 space-y-1">
            <p>• 超级管理员: superadmin</p>
            <p>• 基地经手人: handler1-7（对应基地一至七）</p>
            <p>• 基地负责人: manager1-7（对应基地一至七）</p>
            <p>• 公司资产员: asset1</p>
            <p>• 公司财务: finance1</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}