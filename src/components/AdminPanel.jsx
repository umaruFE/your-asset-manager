import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Tabs } from '../utils/UI';
import { Box, UploadCloud, BarChart3, Archive, ShieldCheck, FileText, Database } from 'lucide-react';
import ViewAllAssetsPanel from './ViewAllAssetsPanel';
import ManageFilesPanel from './ManageFilesPanel';
import ReportsPanel from './ReportsPanel';
import ArchivedDocumentsPanel from './ArchivedDocumentsPanel';
import ArchiveManagerPanel from './ArchiveManagerPanel';
import ViewMyAssetsPanelReadOnly from './ViewMyAssetsPanelReadOnly';
import { ChevronDown } from 'lucide-react';

export default function AdminPanel({ user, getCollectionHook }) {
  const isCompanyAsset = user.role === 'company_asset';
  const isBaseManager = user.role === 'base_manager';
  const isCompanyFinance = user.role === 'company_finance';
  const useUnarchivedDocsView = isBaseManager || isCompanyAsset || isCompanyFinance;
  
  // 所有 hooks 必须在组件顶部无条件调用
  const { data: forms } = getCollectionHook('forms');
  const { data: assets } = getCollectionHook('assets');
  const [selectedFormId, setSelectedFormId] = useState(null);

  const tabs = useMemo(() => {
    const baseTabs = [
      { id: 'viewAssets', label: useUnarchivedDocsView ? '未归档文档' : '登记表格', icon: Box },
      { id: 'archives', label: '已归档文档', icon: Archive },
      { id: 'reports', label: '统计报表', icon: BarChart3 },
      { id: 'uploadFile', label: '管理文件', icon: UploadCloud },
    ];

    if (isCompanyAsset) {
      baseTabs.splice(3, 0, { id: 'archiveControl', label: '归档控制', icon: ShieldCheck });
    }

    return baseTabs;
  }, [isCompanyAsset, useUnarchivedDocsView]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  // 处理表格点击
  const handleFormClick = useCallback((form) => {
    if (form) {
      setSelectedFormId(form.id);
    } else {
      setSelectedFormId(null);
    }
  }, []);

  // 过滤和排序激活的表单
  const availableForms = useMemo(() => {
    return forms.filter(f => f.isActive).sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'viewAssets' && (
          useUnarchivedDocsView ? (
            <div className="flex flex-col lg:flex-row min-h-[70vh]">
              {/* 左侧导航栏 */}
              <div className="w-full lg:w-64 bg-white p-4 rounded-xl shadow-lg lg:mr-6 mb-6 lg:mb-0 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-gray-600" />
                  数据与文件
                </h3>
                <nav className="space-y-2">
                  <UnarchivedDocsTreeReadOnly
                    tab={{ id: 'myAssets', label: '未归档文档', icon: Box }}
                    forms={forms}
                    assets={assets}
                    user={user}
                    activeTabId={activeTab}
                    onFormClick={handleFormClick}
                  />
                </nav>
              </div>

              {/* 右侧内容区域 */}
              <div className="flex-1">
                <ViewMyAssetsPanelReadOnly 
                  user={user} 
                  getCollectionHook={getCollectionHook} 
                  initialFormId={selectedFormId}
                />
              </div>
            </div>
          ) : (
            <ViewAllAssetsPanel user={user} getCollectionHook={getCollectionHook} />
          )
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

// 未归档文档树形组件（只读，用于基地负责人、资产管理员、财务管理员）
function UnarchivedDocsTreeReadOnly({ tab, forms, assets, user, activeTabId, onFormClick }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = tab.icon;
  const isActive = activeTabId === tab.id;
  
  // 只显示未归档的表格（archiveStatus === 'active'）
  const unarchivedForms = useMemo(() => {
    return forms.filter(f => f.archiveStatus === 'active' && f.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);

  return (
    <div>
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isActive) {
            onFormClick(null);
          }
        }}
        className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors duration-150
          ${isActive ? 'bg-green-100 text-green-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700'}
        `}
      >
        <div className="flex items-center flex-1">
          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="truncate">{tab.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      
      {isExpanded && (
        <div className="ml-8 mt-2 space-y-1">
          {unarchivedForms.map(form => {
            // 根据用户角色，后端已经过滤了assets数据
            // 基地负责人：只能看到自己基地的数据
            // 资产管理员/财务管理员：可以看到所有有权限的数据
            const formAssets = assets.filter(a => a.formId === form.id);
            const totalRows = formAssets.reduce((sum, asset) => sum + (asset.batchData?.length || 0), 0);
            
            return (
              <button
                key={form.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onFormClick(form);
                }}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-100 text-gray-700 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate flex-1">{form.name}</span>
                <span className="text-xs text-gray-400 ml-2">
                  ({formAssets.length}/{totalRows})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
