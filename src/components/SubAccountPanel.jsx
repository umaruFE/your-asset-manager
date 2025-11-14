import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button, LoadingScreen, Modal, useModal, Plus, FileText, Database, Box, ChevronLeft, ChevronRight, X } from '../utils/UI';
import RegisterAssetsPanel from './RegisterAssetsPanel';
import ViewFilesPanel from './ViewFilesPanel';

const STATIC_TABS = {
    myAssets: { id: 'myAssets', label: '我的记录', icon: Box, type: 'static' },
    viewFiles: { id: 'viewFiles', label: '查看文件', icon: FileText, type: 'static' },
};

export default function SubAccountPanel({ user, getCollectionHook }) {
  const { data: forms } = getCollectionHook('forms');
  const tabsContainerRef = useRef(null); // Ref for the scrollable tab area
  
  // State for managing open tabs
  const [openTabs, setOpenTabs] = useState([STATIC_TABS.myAssets]);
  const [activeTabId, setActiveTabId] = useState('myAssets');

  // Filter and sort active forms for the side navigation
  const availableForms = useMemo(() => {
      return forms.filter(f => f.isActive).sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);
  
  // Find the currently active tab details
  const activeTabDetails = useMemo(() => openTabs.find(t => t.id === activeTabId), [openTabs, activeTabId]);

  // Function to open/switch to a tab
  const openTab = useCallback((tabDetails) => {
      const { id, type } = tabDetails;
      
      // 1. Check if the tab is already open
      const existingTab = openTabs.find(t => t.id === id);
      if (existingTab) {
          setActiveTabId(id);
          // Scroll the tab into view
          setTimeout(() => {
             const tabElement = tabsContainerRef.current?.querySelector(`[data-tab-id="${id}"]`);
             tabElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 0);
          return;
      }

      // 2. Add the new tab
      setOpenTabs(prev => [...prev, tabDetails]);
      setActiveTabId(id);
      
      // Scroll the new tab into view
      setTimeout(() => {
          tabsContainerRef.current?.scrollTo({ left: tabsContainerRef.current.scrollWidth, behavior: 'smooth' });
      }, 50);
  }, [openTabs, forms]);

  // Function to close a tab
  const closeTab = useCallback((tabId) => {
      if (openTabs.length === 1) return; // Prevent closing the last tab

      const tabIndex = openTabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = openTabs.filter(t => t.id !== tabId);
      
      // 1. Update openTabs
      setOpenTabs(newTabs);

      // 2. Set new active tab
      if (tabId === activeTabId) {
          // If closing the active tab, switch to the one before it (or the first one)
          const newActiveIndex = tabIndex === 0 ? 0 : tabIndex - 1;
          const newActiveId = newTabs[newActiveIndex].id;
          setActiveTabId(newActiveId);
          // Scroll the new active tab into view
          setTimeout(() => {
             const tabElement = tabsContainerRef.current?.querySelector(`[data-tab-id="${newActiveId}"]`);
             tabElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 0);
      }
  }, [openTabs, activeTabId]);

  // Tab scrolling logic
  const scrollTabs = useCallback((direction) => {
      if (tabsContainerRef.current) {
          const container = tabsContainerRef.current;
          const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of visible width
          const currentScroll = container.scrollLeft;
          const newScroll = currentScroll + (direction === 'left' ? -scrollAmount : scrollAmount);
          
          // Ensure we don't scroll beyond boundaries
          const maxScroll = container.scrollWidth - container.clientWidth;
          const finalScroll = Math.max(0, Math.min(newScroll, maxScroll));
          
          container.scrollTo({
              left: finalScroll,
              behavior: 'smooth'
          });
      }
  }, []);

  // Ensure an initial tab is open if none are set (e.g., after initialization)
  useEffect(() => {
      if (openTabs.length === 0) {
          setOpenTabs([STATIC_TABS.myAssets]);
          setActiveTabId('myAssets');
      }
  }, [openTabs.length]);

  // Render the current content based on the active tab's type
  const renderTabContent = (tab) => {
    if (tab.type === 'form') {
        const form = forms.find(f => f.id === tab.id);
        if (!form) return <div className="p-4 text-red-500">表格模板未找到。</div>;
        
        return <RegisterAssetsPanel 
            user={user} 
            form={form} 
            getCollectionHook={getCollectionHook} 
            onAssetRegistered={() => { 
                // Close registration tab and open My Records
                closeTab(tab.id); 
                openTab(STATIC_TABS.myAssets);
            }} 
        />;
    }
    
    switch (tab.id) {
        case 'myAssets':
            return <ViewMyAssetsPanel user={user} getCollectionHook={getCollectionHook} forms={availableForms} />;
        case 'viewFiles':
            return <ViewFilesPanel user={user} getCollectionHook={getCollectionHook} />;
        default:
            return <div className="p-4 text-gray-500">无法加载此内容。</div>;
    }
  };
  
  // Helper for opening Form tabs from the left sidebar
  const handleFormClick = (form) => {
      openTab({
          id: form.id,
          label: form.name,
          icon: Plus,
          type: 'form',
          formId: form.id
      });
  };
  
  // Helper for opening static tabs
  const handleStaticClick = (tab) => {
      openTab(tab);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[70vh]">
        {/* 左侧导航栏 (Left Sidebar) */}
        <div className="w-full lg:w-64 bg-white p-4 rounded-xl shadow-lg lg:mr-6 mb-6 lg:mb-0 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                登记表格
            </h3>
            <nav className="space-y-2 mb-6 border-b pb-4">
                {availableForms.map(form => (
                    <button
                        key={form.id}
                        onClick={() => handleFormClick(form)}
                        className={`w-full text-left p-3 rounded-lg flex items-center transition-colors duration-150
                            ${activeTabId === form.id ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                    >
                        <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{form.name}</span>
                    </button>
                ))}
            </nav>

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-gray-600" />
                数据与文件
            </h3>
            <nav className="space-y-2">
                {Object.values(STATIC_TABS).map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleStaticClick(tab)}
                            className={`w-full text-left p-3 rounded-lg flex items-center transition-colors duration-150
                                ${activeTabId === tab.id ? 'bg-green-100 text-green-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700'}
                            `}
                        >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>

        {/* 右侧内容区域 (Tabbed Content) */}
        <div className="flex-grow bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
             {/* Custom CSS to hide scrollbar */}
             <style>
                {`
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    /* Hide scrollbar for IE and Edge */
                    .hide-scrollbar {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}
             </style>
            
            <div className="relative border-b border-gray-200 flex flex-shrink-0">
                {/* Scroll Left Button */}
                <button
                    onClick={() => scrollTabs('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 bg-white/90 backdrop-blur-sm px-2 border-r border-gray-200 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none shadow-sm flex-shrink-0"
                    aria-label="向左滚动标签页"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Scrollable Tabs Container */}
                <div 
                    ref={tabsContainerRef}
                    className="overflow-x-auto whitespace-nowrap flex-shrink-0 hide-scrollbar px-12 flex-1"
                >
                    <nav className="-mb-px flex" aria-label="Tabs">
                        {openTabs.map(tab => {
                            const isActive = tab.id === activeTabId;
                            const Icon = tab.icon || FileText;
                            const isClosable = openTabs.length > 1; // Always keep at least one tab open

                            return (
                                <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group inline-flex items-center justify-between px-4 py-3 border-b-2 text-sm font-medium transition-colors duration-200 flex-shrink-0 min-w-[200px]
                        ${isActive
                            ? 'border-blue-600 text-blue-700 bg-gray-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                    `}
                >
                                    <div className="flex items-center flex-1 min-w-0">
                                        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{tab.label}</span>
                                    </div>
                                    {isClosable && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                            className={`ml-2 p-0.5 rounded-full transition-colors flex-shrink-0
                                                ${isActive ? 'text-blue-600 hover:bg-blue-200' : 'text-gray-400 hover:bg-gray-200'}
                                            `}
                                            aria-label={`关闭 ${tab.label}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                
                {/* Scroll Right Button */}
                <button
                    onClick={() => scrollTabs('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 bg-white/90 backdrop-blur-sm px-2 border-l border-gray-200 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none shadow-sm flex-shrink-0"
                    aria-label="向右滚动标签页"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-6">
                {activeTabDetails ? (
                    renderTabContent(activeTabDetails)
                ) : (
                    <div className="text-center text-gray-500 pt-20">请在左侧选择一个表格或记录进行操作。</div>
                )}
            </div>
        </div>
    </div>
  );
}

// 1a. 查看我的资产 (Updated to show all forms)
function ViewMyAssetsPanel({ user, getCollectionHook, forms }) {
  const { data: assets, loading, error } = getCollectionHook('assets');
  
  // Group assets by form for easier display
  const groupedAssets = useMemo(() => {
    const userAssets = assets
      .filter(asset => asset.subAccountId === user.id)
      .sort((a, b) => b.submittedAt - a.submittedAt);
      
    return userAssets.reduce((acc, asset) => {
        const form = forms.find(f => f.id === asset.formId) || { name: asset.formName || '未知表格', id: 'unknown' };
        if (!acc[form.id]) {
            acc[form.id] = { formName: form.name, assets: [] };
        }
        acc[form.id].assets.push(asset);
        return acc;
    }, {});
    
  }, [assets, user.id, forms]);

  const viewModal = useModal();

  if (loading) {
    return <LoadingScreen message="正在加载我的记录..." />;
  }
  if (error) {
    return <div className="text-red-500">加载记录失败: {error}</div>;
  }
  
  const formIds = Object.keys(groupedAssets);

  return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">我提交的所有记录</h2>
        {formIds.length === 0 ? (
          <p className="text-gray-500">您尚未提交任何记录。</p>
        ) : (
            <div className="space-y-8">
                {formIds.map(formId => (
                    <div key={formId}>
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                            {groupedAssets[formId].formName}
                            <span className="text-sm font-normal ml-3 text-gray-400">({groupedAssets[formId].assets.length} 条)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedAssets[formId].assets.map(asset => (
                                <AssetCard 
                                    key={asset.id} 
                                    asset={asset} 
                                    onClick={() => viewModal.open(asset)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {viewModal.isOpen && (
          <ViewAssetDetailModal
            asset={viewModal.props}
            isOpen={viewModal.isOpen}
            onClose={viewModal.close}
          />
        )}
      </div>
  );
}

// 资产卡片 (AssetCard remains the same, works with new structure)
function AssetCard({ asset, onClick }) {
    const submittedDate = new Date(asset.submittedAt).toLocaleDateString() || 'N/A';
    const recordCount = asset.batchData?.length || 0;
    
    // Find the first non-formula/non-textarea field to use as the title
    const titleField = asset.fieldsSnapshot?.find(f => f.type !== 'formula' && f.type !== 'textarea') || asset.fieldsSnapshot?.[0]; 
    const firstRecord = asset.batchData?.[0] || {};
    const firstFieldId = titleField?.id; 
    const title = firstRecord[firstFieldId] || `${asset.formName || '记录'} #${asset.id.substring(0, 6)}`;

    return (
      <button 
        onClick={onClick}
        className="block w-full text-left bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {recordCount} 条记录
          </span>
          <span className="text-sm text-gray-500">{submittedDate}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 truncate" title={title}>
          {title}
        </h3>
        {asset.formName && (
          <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">{asset.formName}</span>
          </div>
        )}
      </button>
    );
}

// 查看资产详情模态框 (ViewAssetDetailModal remains the same)
function ViewAssetDetailModal({ asset, isOpen, onClose }) {
  if (!asset) return null;

  // 转换时间戳 (number) 到日期字符串
  const submittedDate = new Date(asset.submittedAt).toLocaleString() || 'N/A';
  
  // 创建一个 字段ID -> 字段名称 的映射
  const fieldIdToName = React.useMemo(() => {
      return asset.fieldsSnapshot.reduce((acc, field) => {
        acc[field.id] = field.name;
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  // 获取所有在快照中出现过的字段 (用于表头)
  const allFieldIdsInBatch = React.useMemo(() => {
      const idSet = new Set();
      asset.batchData.forEach(row => {
        Object.keys(row).forEach(fieldId => idSet.add(fieldId));
      });
      // 保持快照中的顺序
      return asset.fieldsSnapshot
        .map(f => f.id)
        .filter(id => idSet.has(id));
  }, [asset.batchData, asset.fieldsSnapshot]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="查看记录详情">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          表格: {asset.formName || 'N/A'}
        </p>
        <p className="text-sm text-gray-500">
          提交于: {submittedDate}
        </p>
        {asset.subAccountName && (
            <p className="text-sm text-gray-500">
              提交人: {asset.subAccountName}
            </p>
        )}
        
        <div className="overflow-x-auto border border-gray-200 rounded-lg mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {allFieldIdsInBatch.map(fieldId => (
                  <th key={fieldId} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {fieldIdToName[fieldId] || '未知字段'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asset.batchData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {allFieldIdsInBatch.map(fieldId => (
                    <td key={fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {row[fieldId] || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
}