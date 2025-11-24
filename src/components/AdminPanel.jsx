import React, { useState } from 'react';
import { Tabs } from '../utils/UI';
import { Users, UploadCloud, BarChart3 } from 'lucide-react';
import ViewAllAssetsPanel from './ViewAllAssetsPanel';
import ManageFilesPanel from './ManageFilesPanel';
import ReportsPanel from './ReportsPanel';

export default function AdminPanel({ user, getCollectionHook }) {
  // 根据角色显示不同的标签页
  const canCreateReports = ['base_manager', 'company_asset', 'company_finance'].includes(user.role);
  
  const tabs = [
    { id: 'viewAssets', label: '汇总查看记录', icon: Users },
    { id: 'uploadFile', label: '管理文件', icon: UploadCloud },
    ...(canCreateReports ? [{ id: 'reports', label: '统计报表', icon: BarChart3 }] : [])
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'viewAssets' && <ViewAllAssetsPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'uploadFile' && <ManageFilesPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'reports' && canCreateReports && <ReportsPanel user={user} getCollectionHook={getCollectionHook} />}
      </div>
    </div>
  );
}