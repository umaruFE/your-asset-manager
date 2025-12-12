import React, { useState } from 'react';
import { Button, Database, LogOut } from '../utils/UI';
import SubAccountPanel from './SubAccountPanel';
import AdminPanel from './AdminPanel';
import SuperAdminPanel from './SuperAdminPanel';
import { usersAPI } from '../utils/api';

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

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
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
              <span className="font-semibold text-gray-700">{displayRole}</span>
              <span className="text-sm text-gray-500 block">
                {user?.name || user?.username || ''}
              </span>
            </div>
            <Button variant="outline" onClick={() => setShowPwdModal(true)} size="sm">
              修改密码
            </Button>
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

      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">修改密码</h3>
              <button onClick={() => setShowPwdModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            {pwdError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{pwdError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">旧密码</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-200"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowPwdModal(false)}>取消</Button>
              <Button
                variant="primary"
                disabled={pwdLoading}
                onClick={async () => {
                  if (!oldPwd || !newPwd || !confirmPwd) {
                    setPwdError('请填写完整信息');
                    return;
                  }
                  if (newPwd !== confirmPwd) {
                    setPwdError('两次输入的新密码不一致');
                    return;
                  }
                  setPwdError('');
                  setPwdLoading(true);
                  try {
                    await usersAPI.changePassword(oldPwd, newPwd);
                    alert('密码修改成功，请使用新密码重新登录');
                    setShowPwdModal(false);
                    setOldPwd('');
                    setNewPwd('');
                    setConfirmPwd('');
                  } catch (err) {
                    setPwdError(err.message || '修改失败');
                  } finally {
                    setPwdLoading(false);
                  }
                }}
              >
                {pwdLoading ? '提交中...' : '确认修改'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}