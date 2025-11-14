import React from 'react';
import { Button, Database, LogOut } from '../utils/UI';
import SubAccountPanel from './SubAccountPanel';
import AdminPanel from './AdminPanel';
import SuperAdminPanel from './SuperAdminPanel';

export default function Dashboard({ user, onLogout, getCollectionHook }) {
  const renderPanel = () => {
    switch (user.role) {
      case 'subaccount':
        return <SubAccountPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'admin':
        // 管理员只保留汇总查看和文件管理
        return <AdminPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'superadmin':
        return <SuperAdminPanel user={user} getCollectionHook={getCollectionHook} />;
      default:
        return <div className="p-4">未知的用户角色</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
               <Database className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">
                资产文件管理系统
              </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="font-semibold text-gray-700">{user.name}</span>
              <span className="text-sm text-gray-500 block">
                {
                  user.role === 'superadmin' ? '超级管理员' :
                  user.role === 'admin' ? '管理员' : '子账号'
                }
              </span>
            </div>
            <Button variant="outline" onClick={onLogout} size="icon">
              <LogOut className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPanel()}
      </main>
      
        <footer className="py-4 text-center text-gray-500 text-sm">
          © 2024 资产管理系统
        </footer>
    </div>
  );
}