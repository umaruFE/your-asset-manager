import React, { useState } from 'react';
import { LoadingScreen, Button, AlertTriangle, Database, RefreshCw } from '../utils/UI';
import { CURRENT_USER_ID_KEY, LOCAL_STORAGE_KEY } from '../utils/helpers';

export default function LoginScreen({ onLogin, getCollectionHook }) {
  const { data: allAppUsers } = getCollectionHook('allAppUsers');
  
  // 正常登录界面
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          资产文件管理系统
        </h2>
        <div className="space-y-4">
          <p className="text-center text-gray-600">请选择一个模拟身份登录：</p>
          {allAppUsers.sort((a, b) => a.name.localeCompare(b.name)).map((user) => (
            <Button
              key={user.id}
              variant={
                user.role === 'superadmin' ? 'danger' :
                user.role === 'admin' ? 'primary' : 'outline'
              }
              onClick={() => onLogin(user.id)}
              className="w-full justify-center py-3 text-lg"
            >
              {user.role === 'superadmin' ? '👑' : user.role === 'admin' ? '👨‍💼' : '🧑‍💻'}
              <span className="ml-3">{user.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}