import React, { useState, useMemo } from 'react';
import { LoadingScreen } from '../utils/UI';
import AssetCard from './AssetCard';
import ViewAssetDetailModal from './AssetCard';

export default function ViewAllAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading: assetsLoading, error: assetsError } = getCollectionHook('assets');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  const { data: forms } = getCollectionHook('forms');
  
  const [selectedFormId, setSelectedFormId] = useState('all');
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('all');

  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'subaccount');
  }, [allAppUsers]);
  
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => 
          (selectedSubAccountId === 'all' || asset.subAccountId === selectedSubAccountId) &&
          (selectedFormId === 'all' || asset.formId === selectedFormId)
      )
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序
  }, [assets, selectedSubAccountId, selectedFormId]);

  const viewModal = React.useMemo(() => ({
    isOpen: false,
    props: null,
    open: function(asset) {
      this.isOpen = true;
      this.props = asset;
      // Force re-render
      this.forceUpdate?.();
    },
    close: function() {
      this.isOpen = false;
      this.props = null;
      // Force re-render
      this.forceUpdate?.();
    },
    forceUpdate: null
  }), []);

  // Add forceUpdate method to viewModal
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  viewModal.forceUpdate = forceUpdate;

  if (assetsLoading || usersLoading) {
    return <LoadingScreen message="正在加载所有记录数据..." />;
  }
  if (assetsError || usersError) {
    return <div className="text-red-500">加载数据失败: {assetsError || usersError}</div>;
  }
  
  return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">汇总查看记录</h2>
        
        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="max-w-xs w-full">
               <label htmlFor="form-filter" className="block text-sm font-medium text-gray-700 mb-1">
                 筛选表格
               </label>
               <select
                 id="form-filter"
                 value={selectedFormId}
                 onChange={(e) => setSelectedFormId(e.target.value)}
                 className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
               >
                 <option value="all">所有表格</option>
                 {forms.filter(f => f.isActive).map(form => (
                   <option key={form.id} value={form.id}>{form.name}</option>
                 ))}
               </select>
             </div>
            <div className="max-w-xs w-full">
               <label htmlFor="subaccount-filter" className="block text-sm font-medium text-gray-700 mb-1">
                 筛选提交人
               </label>
               <select
                 id="subaccount-filter"
                 value={selectedSubAccountId}
                 onChange={(e) => setSelectedSubAccountId(e.target.value)}
                 className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
               >
                 <option value="all">所有子账号</option>
                 {subAccounts.map(sub => (
                   <option key={sub.id} value={sub.id}>{sub.name}</option>
                 ))}
               </select>
             </div>
        </div>

        {/* 资产卡片网格 */}
        {filteredAssets.length === 0 ? (
          <p className="text-gray-500 mt-6">
            没有找到匹配的记录。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => viewModal.open(asset)}
              />
            ))}
          </div>
        )}
        
        {/* 查看详情模态框 */}
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