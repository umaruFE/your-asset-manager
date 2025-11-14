import React, { useState } from 'react';
import { Tabs, Users, UploadCloud } from '../utils/UI';
import ViewAllAssetsPanel from './ViewAllAssetsPanel';
import ManageFilesPanel from './ManageFilesPanel';

export default function AdminPanel({ user, getCollectionHook }) {
  const tabs = [
    { id: 'viewAssets', label: '汇总查看记录', icon: Users },
    { id: 'uploadFile', label: '管理文件', icon: UploadCloud },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'viewAssets' && <ViewAllAssetsPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'uploadFile' && <ManageFilesPanel user={user} getCollectionHook={getCollectionHook} />}
      </div>
    </div>
  );
}