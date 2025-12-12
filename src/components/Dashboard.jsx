import React from 'react';
import { Button, Database, LogOut } from '../utils/UI';
import SubAccountPanel from './SubAccountPanel';
import AdminPanel from './AdminPanel';
import SuperAdminPanel from './SuperAdminPanel';

export default function Dashboard({ user, onLogout, getCollectionHook }) {
  const roleLabels = {
    superadmin: '超级管理员',
    base_handler: '基地经手人',
    base_manager: '基地负责人',
    company_asset: '公司资产员',
    company_finance: '公司财务'
  };

  const numberToChinese = (num) => {
    const map = ['零','一','二','三','四','五','六','七','八','九'];
    if (num <= 10) {
      return num === 10 ? '十' : map[num] || '';
    }
    if (num < 20) return '十' + map[num % 10];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return map[tens] + '十' + (ones ? map[ones] : '');
  };

  const getDisplayName = () => {
    // 优先用已有 name
    if (user?.role === 'base_manager') {
      const source = user?.name || user?.username || '';
      const match = source.match(/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        const suffix = numberToChinese(n);
        return `基地负责人${suffix ? suffix : ''}`;
      }
      return '基地负责人';
    }
    return user?.name || user?.username || '';
  };

  const displayRole = roleLabels[user.role] || user.role;
  const renderPanel = () => {
    switch (user.role) {
      case 'base_handler':
        return <SubAccountPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'base_manager':
      case 'company_asset':
      case 'company_finance':
        // 这些角色可以查看数据和创建报表
        return <AdminPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'superadmin':
        return <SuperAdminPanel user={user} getCollectionHook={getCollectionHook} />;
      default:
        return <div className="p-4">未知的用户角色: {user.role}</div>;
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
              <span className="font-semibold text-gray-700">{getDisplayName()}</span>
              <span className="text-sm text-gray-500 block">
                {displayRole}
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
          © 2025 鱼苗资产管理系统
        </footer>
    </div>
  );
}