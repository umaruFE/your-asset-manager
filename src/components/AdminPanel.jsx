import React, { useMemo, useState } from 'react';
import { Tabs } from '../utils/UI';
import { ClipboardList, UploadCloud, BarChart3, Archive, ShieldCheck } from 'lucide-react';
import ViewAllAssetsPanel from './ViewAllAssetsPanel';
import ManageFilesPanel from './ManageFilesPanel';
import ReportsPanel from './ReportsPanel';
import ArchivedDocumentsPanel from './ArchivedDocumentsPanel';
import ArchiveManagerPanel from './ArchiveManagerPanel';

export default function AdminPanel({ user, getCollectionHook }) {
  const isCompanyAsset = user.role === 'company_asset';

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'viewAssets', label: '登记表格', icon: ClipboardList },
      { id: 'reports', label: '统计报表', icon: BarChart3 },
      { id: 'archives', label: '已归档文档', icon: Archive },
      { id: 'uploadFile', label: '管理文件', icon: UploadCloud },
    ];

    if (isCompanyAsset) {
      baseTabs.splice(3, 0, { id: 'archiveControl', label: '归档控制', icon: ShieldCheck });
    }

    return baseTabs;
  }, [isCompanyAsset]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'viewAssets' && (
          <ViewAllAssetsPanel user={user} getCollectionHook={getCollectionHook} />
        )}

        {activeTab === 'reports' && (
          <ReportsPanel user={user} getCollectionHook={getCollectionHook} />
        )}

        {activeTab === 'archives' && (
          <ArchivedDocumentsPanel user={user} getCollectionHook={getCollectionHook} />
        )}

        {activeTab === 'uploadFile' && (
          <ManageFilesPanel user={user} getCollectionHook={getCollectionHook} />
        )}

        {activeTab === 'archiveControl' && isCompanyAsset && (
          <ArchiveManagerPanel user={user} getCollectionHook={getCollectionHook} />
        )}
      </div>
    </div>
  );
}