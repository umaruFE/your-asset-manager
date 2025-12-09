import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Button, LoadingScreen, Modal, useModal, Plus, FileText, Database, Box, ChevronLeft, ChevronRight, X, Archive, Edit, Trash2, Check } from '../utils/UI';
import { ChevronDown, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import RegisterAssetsPanel from './RegisterAssetsPanel';
import ViewFilesPanel from './ViewFilesPanel';
import ArchivedDocumentsPanel from './ArchivedDocumentsPanel';
import EditAssetPanel from './EditAssetPanel';
import { calculateFormula, formatFieldValue, getStepFromPrecision } from '../utils/helpers';
import { assetsAPI } from '../utils/api';

const STATIC_TABS = {
    myAssets: { id: 'myAssets', label: '未归档文档', icon: Box, type: 'static' },
    archivedDocs: { id: 'archivedDocs', label: '已归档文档', icon: Archive, type: 'static' },
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
          // 如果标签页已打开，更新其属性（如selectedFormId）
          if (tabDetails.selectedFormId !== undefined) {
              setOpenTabs(prev => prev.map(t => 
                  t.id === id ? { ...t, selectedFormId: tabDetails.selectedFormId } : t
              ));
          }
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
                // Close registration tab and open Unarchived Documents
                closeTab(tab.id); 
                openTab(STATIC_TABS.myAssets);
            }} 
        />;
    }
    
    switch (tab.id) {
        case 'myAssets':
            return <ViewMyAssetsPanel user={user} getCollectionHook={getCollectionHook} forms={availableForms} initialFormId={tab.selectedFormId} />;
        case 'viewFiles':
            return <ViewFilesPanel user={user} getCollectionHook={getCollectionHook} />;
        case 'archivedDocs':
            return <ArchivedDocumentsPanel user={user} getCollectionHook={getCollectionHook} />;
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
  const handleStaticClick = (tab, selectedFormId = null) => {
      const tabWithForm = selectedFormId ? { ...tab, selectedFormId } : tab;
      openTab(tabWithForm);
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
                    const isUnarchivedDocs = tab.id === 'myAssets';
                    
                    if (isUnarchivedDocs) {
                        // 未归档文档作为可展开的父节点
                        return (
                            <UnarchivedDocsTree
                                key={tab.id}
                                tab={tab}
                                forms={forms}
                                assets={getCollectionHook('assets').data}
                                user={user}
                                activeTabId={activeTabId}
                                onFormClick={(form) => {
                                    handleStaticClick(tab, form ? form.id : null);
                                }}
                            />
                        );
                    }
                    
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
                                <div
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group inline-flex items-center justify-between px-4 py-3 border-b-2 text-sm font-medium transition-colors duration-200 flex-shrink-0 min-w-[200px] cursor-pointer
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
                                </div>
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

// 未归档文档树形组件
function UnarchivedDocsTree({ tab, forms, assets, user, activeTabId, onFormClick }) {
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
            const formAssets = assets.filter(a => a.formId === form.id && a.subAccountId === user.id);
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

// 1a. 查看未归档文档 (显示未归档表格列表，点击表格显示合并数据)
function ViewMyAssetsPanel({ user, getCollectionHook, forms, initialFormId = null }) {
  const { data: assets, loading, error, update: updateAssets } = getCollectionHook('assets');
  const [selectedFormId, setSelectedFormId] = useState(initialFormId);

  // 只显示未归档的表格（archiveStatus === 'active'）
  const unarchivedForms = useMemo(() => {
    return forms.filter(f => f.archiveStatus === 'active' && f.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);

  // 获取选中表格的所有未归档数据（合并所有记录）
  const mergedData = useMemo(() => {
    if (!selectedFormId) return { form: null, rows: [] };
    
    const form = forms.find(f => f.id === selectedFormId);
    if (!form) return { form: null, rows: [] };

    // 获取该表格的所有未归档资产记录
    const formAssets = assets
      .filter(asset => asset.formId === selectedFormId && asset.subAccountId === user.id)
      .sort((a, b) => a.submittedAt - b.submittedAt);

    // 合并所有记录的batchData
    const allRows = [];
    formAssets.forEach(asset => {
      if (asset.batchData && Array.isArray(asset.batchData)) {
        asset.batchData.forEach((row, rowIndex) => {
          allRows.push({
            ...row,
            __assetId: asset.id,
            __rowIndex: rowIndex,
            __submittedAt: asset.submittedAt,
            __subAccountName: asset.subAccountName
          });
        });
      }
    });

    return { form, rows: allRows, assets: formAssets };
  }, [selectedFormId, assets, user.id, forms]);

  // 根据传入的initialFormId设置选中的表格
  useEffect(() => {
    if (initialFormId !== null && initialFormId !== undefined) {
      setSelectedFormId(initialFormId);
    } else if (unarchivedForms.length > 0 && !selectedFormId) {
      setSelectedFormId(unarchivedForms[0].id);
    }
  }, [initialFormId]);

  if (loading) {
    return <LoadingScreen message="正在加载未归档文档..." />;
  }
  if (error) {
    return <div className="text-red-500">加载记录失败: {error}</div>;
  }
  
  if (unarchivedForms.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">未归档文档</h2>
        <p className="text-gray-500">暂无未归档的表格。</p>
      </div>
    );
  }

  return (
      <div>
      {selectedFormId && mergedData.form ? (
        <UnarchivedFormDataView
          form={mergedData.form}
          rows={mergedData.rows}
          assets={mergedData.assets}
          user={user}
          getCollectionHook={getCollectionHook}
          onDataUpdated={() => updateAssets(prev => [...prev])}
        />
      ) : (
        <div className="text-center text-gray-500 pt-20">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">未归档文档</h2>
          <p>请从左侧导航栏选择一个表格查看数据</p>
        </div>
      )}
    </div>
  );
}

// 未归档表格数据视图组件（只读模式，通过模态窗编辑）
function UnarchivedFormDataView({ form, rows, assets, user, getCollectionHook, onDataUpdated }) {
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // 获取所有表单和资产数据（用于公式计算）
  const { data: allForms } = getCollectionHook('forms');
  const { data: allAssets } = getCollectionHook('assets');

  // 确保使用当前表单的最新字段定义，并只取 active 字段
  const activeFields = useMemo(() => {
    if (!form.fields || !Array.isArray(form.fields)) return [];
    return form.fields.filter(f => f.active).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [form.fields]);

  // 辅助函数：根据当前行数据计算所有公式字段的值（用于显示）
  const calculateRowForDisplay = useCallback((currentRow) => {
    if (!form.fields || !Array.isArray(form.fields)) return currentRow;
    
    let newRow = { ...currentRow };
    
    form.fields.filter(f => f.type === 'formula' && f.active).forEach(field => {
        if (field.formula) {
            const precision = typeof field.displayPrecision === 'number' ? field.displayPrecision : 2;
            const calculatedValue = calculateFormula(
                field.formula, 
                newRow, 
                form.fields,
                { allForms: allForms || [], allAssets: allAssets || [], currentFormId: form.id, targetPrecision: precision }
            );
            newRow[field.id] = calculatedValue;
        }
    });

    return newRow;
  }, [form.fields, form.id, allForms, allAssets]);

  // 计算显示用的行数据（补充缺失字段并计算公式）
  const displayRows = useMemo(() => {
    if (rows.length === 0) return [];
    
    let processedRows = rows.map(row => {
      const newRow = { ...row };
      activeFields.forEach(field => {
        if (newRow[field.id] === undefined || newRow[field.id] === null) {
          if (field.type === 'number' || field.type === 'formula') {
            newRow[field.id] = 0;
          } else if (field.type === 'select') {
            newRow[field.id] = Array.isArray(field.options) && field.options.length > 0 ? field.options[0] : '';
          } else {
            newRow[field.id] = '';
          }
        }
      });
      // 计算公式字段
      return calculateRowForDisplay(newRow);
    });

    // 排序
    if (sortField) {
      processedRows = [...processedRows].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        // 处理数字类型
        const field = activeFields.find(f => f.id === sortField);
        if (field && (field.type === 'number' || field.type === 'formula')) {
          const aNum = Number(aValue) || 0;
          const bNum = Number(bValue) || 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // 处理日期类型
        if (field && field.type === 'date') {
          const aDate = aValue ? new Date(aValue).getTime() : 0;
          const bDate = bValue ? new Date(bValue).getTime() : 0;
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        // 处理文本类型
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return processedRows;
  }, [rows, activeFields, calculateRowForDisplay, sortField, sortDirection]);

  // 处理排序
  const handleSort = useCallback((fieldId) => {
    if (sortField === fieldId) {
      // 如果点击的是当前排序列，切换排序方向
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新列，设置为升序
      setSortField(fieldId);
      setSortDirection('asc');
    }
  }, [sortField]);

  // 处理查看
  const handleView = useCallback((row) => {
    setViewModal(row);
  }, []);

  // 处理编辑
  const handleEdit = useCallback((row) => {
    setEditModal(row);
  }, []);

  // 处理删除
  const handleDelete = useCallback((row) => {
    setDeleteModal(row);
  }, []);

  // 确认删除
  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return;
    
    try {
      const assetId = deleteModal.__assetId;
      if (assetId) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
          // 从资产的batchData中移除该行
          const updatedBatchData = asset.batchData.filter((_, index) => index !== deleteModal.__rowIndex);
          
          if (updatedBatchData.length === 0) {
            // 如果删除后没有数据了，将batchData设为空数组
            await assetsAPI.update(assetId, {
              batchData: [],
              fieldsSnapshot: form.fields
            });
          } else {
            await assetsAPI.update(assetId, {
              batchData: updatedBatchData,
              fieldsSnapshot: form.fields
            });
          }
        }
      }
      
      setDeleteModal(null);
      onDataUpdated();
    } catch (err) {
      console.error("删除失败:", err);
      alert(err.message || "删除失败，请重试。");
    }
  }, [deleteModal, assets, form, onDataUpdated]);

  // 渲染字段显示值（只读）
  const renderFieldValue = useCallback((field, row) => {
    const currentValue = row[field.id] ?? (field.type === 'number' ? 0 : '');

    if (field.type === 'formula') {
      const displayValue = formatFieldValue(field, currentValue);
                                return (
        <span className="text-blue-700 font-semibold">
          {displayValue || '0'}
        </span>
      );
    }

    if (field.type === 'number') {
      const displayValue = formatFieldValue(field, currentValue);
      return displayValue || '0';
    }

    if (field.type === 'date') {
      return currentValue || '-';
    }

    if (field.type === 'textarea') {
      return (
        <div className="max-w-xs truncate" title={currentValue}>
          {currentValue || '-'}
        </div>
      );
    }

    return currentValue || '-';
  }, []);

  if (displayRows.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">{form.name}</h3>
        <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
          暂无数据。请先登记数据。
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{form.name}</h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ maxWidth: '100%' }}>
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '800px' }}>
          <thead className="bg-gray-50">
            <tr>
              {activeFields.map(field => (
                <th 
                  key={field.id} 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort(field.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{field.name}</span>
                    {field.type === 'formula' && (
                      <span className="text-blue-500 text-xs">(自动计算)</span>
                    )}
                    {sortField === field.id && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 inline" />
                        ) : (
                          <ArrowDown className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24 sticky right-0 bg-gray-50">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {activeFields.map(field => (
                  <td key={field.id} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {renderFieldValue(field, row)}
                  </td>
                ))}
                <td className="px-3 py-2 sticky right-0 bg-white">
                  <div className="flex items-center gap-2">
                                            <button
                      onClick={() => handleView(row)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(row)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="编辑"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 查看模态窗 */}
      {viewModal && (
        <ViewRowModal
          row={viewModal}
          form={form}
          activeFields={activeFields}
          onClose={() => setViewModal(null)}
        />
      )}

      {/* 编辑模态窗 */}
      {editModal && (
        <EditRowModal
          row={editModal}
          form={form}
          assets={assets}
          user={user}
          getCollectionHook={getCollectionHook}
          onSave={() => {
            setEditModal(null);
            onDataUpdated();
          }}
          onCancel={() => setEditModal(null)}
        />
      )}

      {/* 删除确认模态窗 */}
      {deleteModal && (
        <Modal isOpen={true} onClose={() => setDeleteModal(null)} title="确认删除">
          <div className="space-y-4">
            <p className="text-gray-700">确定要删除这条记录吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>
                取消
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                确认删除
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 查看行数据模态窗
function ViewRowModal({ row, form, activeFields, onClose }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="查看记录详情">
      <div className="space-y-4">
        {activeFields.map(field => {
          const value = row[field.id] ?? (field.type === 'number' ? 0 : '');
          let displayValue = value;
          
          if (field.type === 'formula' || field.type === 'number') {
            displayValue = formatFieldValue(field, value);
          } else if (field.type === 'date') {
            displayValue = value || '-';
          } else if (field.type === 'textarea') {
            displayValue = value || '-';
          } else {
            displayValue = value || '-';
          }
          
          return (
            <div key={field.id} className="flex items-start">
              <label className="w-32 text-sm font-medium text-gray-700 flex-shrink-0">
                {field.name}
                {field.type === 'formula' && (
                  <span className="ml-1 text-blue-500 text-xs">(自动计算)</span>
                )}
              </label>
              <div className="flex-1">
                {field.type === 'textarea' ? (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 whitespace-pre-wrap">
                    {displayValue}
                  </div>
                ) : field.type === 'formula' ? (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 font-semibold">
                    {displayValue || '0'}
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                    {displayValue}
                  </div>
                )}
              </div>
                                    </div>
                                );
                            })}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
                        </div>
                    </div>
    </Modal>
  );
}

// 编辑行数据模态窗
function EditRowModal({ row, form, assets, user, getCollectionHook, onSave, onCancel }) {
  const { data: allForms } = getCollectionHook('forms');
  const { data: allAssets } = getCollectionHook('assets');
  const { update: updateAssets } = getCollectionHook('assets');
  
  const [editingRow, setEditingRow] = useState({ ...row });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const activeFields = useMemo(() => {
    return form.fields.filter(f => f.active).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [form.fields]);

  // 计算公式字段
  const calculateRow = useCallback((currentRow) => {
    let newRow = { ...currentRow };
    
    form.fields.filter(f => f.type === 'formula' && f.active).forEach(field => {
        if (field.formula) {
            const precision = typeof field.displayPrecision === 'number' ? field.displayPrecision : 2;
            const calculatedValue = calculateFormula(
                field.formula, 
                newRow, 
                form.fields,
                { allForms, allAssets, currentFormId: form.id, targetPrecision: precision }
            );
            newRow[field.id] = calculatedValue;
        }
    });

    return newRow;
  }, [form.fields, allForms, allAssets, form.id]);

  // 初始化时计算公式字段
  useEffect(() => {
    const calculated = calculateRow(editingRow);
    setEditingRow(calculated);
  }, []);

  // 处理字段值变化
  const handleFieldChange = useCallback((field, value) => {
    const updatedRow = { ...editingRow };
    
    if (field.type === 'number') {
      updatedRow[field.id] = value === '' ? '' : Number(value);
    } else {
      updatedRow[field.id] = value;
    }

    // 重新计算公式字段
    const calculatedRow = calculateRow(updatedRow);
    setEditingRow(calculatedRow);
  }, [editingRow, calculateRow]);

  // 保存
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const assetId = row.__assetId;
      if (assetId) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) {
          // 更新该行数据
          const updatedBatchData = [...asset.batchData];
          updatedBatchData[row.__rowIndex] = (() => {
            const clean = { ...editingRow };
            delete clean.__assetId;
            delete clean.__rowIndex;
            delete clean.__submittedAt;
            delete clean.__subAccountName;
            return clean;
          })();

          await assetsAPI.update(assetId, {
            batchData: updatedBatchData,
            fieldsSnapshot: form.fields
          });
        }
      }

      onSave();
    } catch (err) {
      console.error("保存失败:", err);
      setError(err.message || "保存失败，请重试。");
    } finally {
      setIsSaving(false);
    }
  }, [editingRow, row, assets, form, onSave]);

  const renderFieldInput = (field) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const currentValue = editingRow[field.id] ?? (field.type === 'number' ? 0 : '');

    if (field.type === 'formula') {
      const displayValue = formatFieldValue(field, currentValue);
      return (
        <div className="mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold">
          {displayValue || '0'}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          rows={3}
          value={currentValue}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={`${baseClass} resize-none`}
          placeholder={`请输入${field.name}`}
        />
      );
    }

    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <select
          value={currentValue}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={baseClass}
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'date') {
      return (
        <input
          type="date"
          value={currentValue || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={baseClass}
        />
      );
    }

    if (field.type === 'number') {
      const safeValue = currentValue === '' ? '' : currentValue;
      const step = getStepFromPrecision(field.displayPrecision);
      return (
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={safeValue}
          onChange={(e) => handleFieldChange(field, e.target.value === '' ? '' : Number(e.target.value))}
          className={baseClass}
          placeholder={`请输入${field.name}`}
        />
      );
    }

    return (
      <input
        type="text"
        value={currentValue}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        className={baseClass}
        placeholder={`请输入${field.name}`}
      />
    );
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={`编辑记录 - ${form.name}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
            </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {activeFields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name}
                {field.type === 'formula' && (
                  <span className="ml-1 text-xs text-blue-500">(自动计算)</span>
        )}
                {['number', 'formula'].includes(field.type) && (
                  <span className="ml-1 text-xs text-gray-400">
                    保留 {typeof field.displayPrecision === 'number' ? field.displayPrecision : 2} 位小数
                  </span>
                )}
              </label>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Check className="w-4 h-4 mr-2" />
        )}
            {isSaving ? '保存中...' : '保存'}
          </Button>
      </div>
      </form>
    </Modal>
  );
}

// 资产卡片 (AssetCard remains the same, works with new structure)
function AssetCard({ asset, onClick }) {
    // 处理时间戳：支持毫秒时间戳和日期字符串
    let submittedDate = 'N/A';
    if (asset.submittedAt) {
        try {
            // 如果是数字（时间戳），直接使用
            // 如果是字符串，尝试解析
            const timestamp = typeof asset.submittedAt === 'number' 
                ? asset.submittedAt 
                : parseInt(asset.submittedAt);
            
            if (!isNaN(timestamp) && timestamp > 0) {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    submittedDate = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        } catch (e) {
            console.error('日期解析错误:', e, asset.submittedAt);
        }
    }
    
    const recordCount = asset.batchData?.length || 0;
    
    // Find the first non-formula/non-textarea field to use as the title
    const titleField = asset.fieldsSnapshot?.find(f => f.type !== 'formula' && f.type !== 'textarea') || asset.fieldsSnapshot?.[0]; 
    const firstRecord = asset.batchData?.[0] || {};
    const firstFieldId = titleField?.id; 
    // 移除ID显示，只显示表单名称或第一个字段的值
    const title = firstRecord[firstFieldId] || asset.formName || '记录';

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

  // 处理时间戳：支持毫秒时间戳和日期字符串
  let submittedDate = 'N/A';
  if (asset.submittedAt) {
      try {
          const timestamp = typeof asset.submittedAt === 'number' 
              ? asset.submittedAt 
              : parseInt(asset.submittedAt);
          
          if (!isNaN(timestamp) && timestamp > 0) {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                  submittedDate = date.toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                  });
              }
          }
      } catch (e) {
          console.error('日期解析错误:', e, asset.submittedAt);
      }
  }
  
  // 创建一个 字段ID -> 字段名称 的映射，以及 字段名称 -> 字段ID 的映射
  const fieldIdToName = React.useMemo(() => {
      if (!asset.fieldsSnapshot || !Array.isArray(asset.fieldsSnapshot)) {
          return {};
      }
      return asset.fieldsSnapshot.reduce((acc, field) => {
        if (field && field.id && field.name) {
            acc[field.id] = field.name;
        }
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  const fieldNameToId = React.useMemo(() => {
      if (!asset.fieldsSnapshot || !Array.isArray(asset.fieldsSnapshot)) {
          return {};
      }
      return asset.fieldsSnapshot.reduce((acc, field) => {
        if (field && field.id && field.name) {
            acc[field.name] = field.id;
        }
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  // 获取所有在快照中出现过的字段 (用于表头)
  // 支持两种格式：字段ID作为键，或字段名称作为键
  const allFieldKeysInBatch = React.useMemo(() => {
      if (!asset.batchData || !Array.isArray(asset.batchData) || asset.batchData.length === 0) {
          return [];
      }
      
      const keySet = new Set();
      asset.batchData.forEach(row => {
        if (row && typeof row === 'object') {
            Object.keys(row).forEach(key => keySet.add(key));
        }
      });
      
      // 判断batchData中的键是字段ID还是字段名称
      const firstRow = asset.batchData[0];
      const firstKey = firstRow ? Object.keys(firstRow)[0] : null;
      const isUsingFieldNames = firstKey && fieldNameToId[firstKey]; // 如果第一个键能在名称映射中找到，说明使用的是字段名称
      
      // 保持快照中的顺序
      if (asset.fieldsSnapshot && Array.isArray(asset.fieldsSnapshot)) {
          if (isUsingFieldNames) {
              // 如果使用字段名称，返回字段名称列表
              return asset.fieldsSnapshot
                .map(f => f?.name)
                .filter(name => name && keySet.has(name));
          } else {
              // 如果使用字段ID，返回字段ID列表
              return asset.fieldsSnapshot
                .map(f => f?.id)
                .filter(id => id && keySet.has(id));
          }
      }
      
      // 如果没有快照，返回所有在数据中出现的键
      return Array.from(keySet);
  }, [asset.batchData, asset.fieldsSnapshot, fieldNameToId]);

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
        
        {allFieldKeysInBatch.length > 0 && asset.batchData && asset.batchData.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {allFieldKeysInBatch.map(fieldKey => {
                    // fieldKey可能是字段ID或字段名称
                    const fieldName = fieldIdToName[fieldKey] || fieldKey; // 如果是ID，转换为名称；如果是名称，直接使用
                    return (
                      <th key={fieldKey} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {fieldName || '未知字段'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asset.batchData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {allFieldKeysInBatch.map(fieldKey => (
                      <td key={fieldKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {row[fieldKey] !== undefined && row[fieldKey] !== null ? String(row[fieldKey]) : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            <p>暂无数据</p>
            {(!asset.batchData || asset.batchData.length === 0) && (
              <p className="text-sm mt-2">该记录没有包含任何数据</p>
            )}
            {(!asset.fieldsSnapshot || asset.fieldsSnapshot.length === 0) && (
              <p className="text-sm mt-2">该记录的字段信息缺失</p>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
}