import React, { useState, useMemo } from 'react';
import { LoadingScreen } from '../utils/UI';
import AssetCard from './AssetCard';
import { ViewAssetDetailModal } from './AssetCard';
import { Grid, List } from 'lucide-react';

export default function ViewAllAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading: assetsLoading, error: assetsError } = getCollectionHook('assets');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  const { data: forms } = getCollectionHook('forms');
  
  const [selectedFormId, setSelectedFormId] = useState('all');
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'subaccount');
  }, [allAppUsers]);
  
  // 创建用户ID到用户名的映射
  const userIdToName = useMemo(() => {
    return allAppUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
  }, [allAppUsers]);
  
  // 创建表单ID到表单名的映射
  const formIdToName = useMemo(() => {
    return forms.reduce((acc, form) => {
      acc[form.id] = form.name;
      return acc;
    }, {});
  }, [forms]);
  
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => 
          (selectedSubAccountId === 'all' || asset.subAccountId === selectedSubAccountId) &&
          (selectedFormId === 'all' || asset.formId === selectedFormId)
      )
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序
  }, [assets, selectedSubAccountId, selectedFormId]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCardClick = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  if (assetsLoading || usersLoading) {
    return <LoadingScreen message="正在加载所有记录数据..." />;
  }
  if (assetsError || usersError) {
    return <div className="text-red-500">加载数据失败: {assetsError || usersError}</div>;
  }
  
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800">汇总查看记录</h2>
          {/* 视图切换按钮 */}
          <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>卡片</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              <span>表格</span>
            </button>
          </div>
        </div>
        
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

        {/* 内容区域 */}
        {filteredAssets.length === 0 ? (
          <p className="text-gray-500 mt-6">
            没有找到匹配的记录。
          </p>
        ) : viewMode === 'cards' ? (
          /* 卡片视图 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => handleCardClick(asset)}
              />
            ))}
          </div>
        ) : (
          /* 表格视图 */
          <div className="mt-6 overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交人
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    表格名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    记录数量
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map(asset => {
                  const submittedDate = new Date(asset.submittedAt).toLocaleString('zh-CN');
                  const submitterName = userIdToName[asset.subAccountId] || asset.subAccountName || '未知';
                  const formName = formIdToName[asset.formId] || asset.formName || '未知表格';
                  const recordCount = asset.batchData?.length || 0;
                  
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submittedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {submitterName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {recordCount} 条
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCardClick(asset)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 查看详情模态框 */}
        {isModalOpen && selectedAsset && (
          <ViewAssetDetailModal
            asset={selectedAsset}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}
      </div>
  );
}