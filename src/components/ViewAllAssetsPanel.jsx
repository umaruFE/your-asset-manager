import React, { useState, useMemo } from 'react';
import { LoadingScreen, Button } from '../utils/UI';
import AssetCard from './AssetCard';
import { ViewAssetDetailModal } from './AssetCard';
import { Grid, List, Download } from 'lucide-react';
import { formsAPI } from '../utils/api';

export default function ViewAllAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading: assetsLoading, error: assetsError } = getCollectionHook('assets');
  const { data: allAppUsers = [], loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  const { data: forms = [], loading: formsLoading, error: formsError } = getCollectionHook('forms');

  const [selectedFormId, setSelectedFormId] = useState('all');
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [downloadingFormId, setDownloadingFormId] = useState(null);

  const subAccounts = useMemo(() => {
    if (!allAppUsers || !Array.isArray(allAppUsers)) return [];
    return allAppUsers.filter(u => u.role === 'base_handler');
  }, [allAppUsers]);

  // 创建用户ID到用户名的映射
  const userIdToName = useMemo(() => {
    if (!allAppUsers || !Array.isArray(allAppUsers)) return {};
    return allAppUsers.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
  }, [allAppUsers]);

  // 创建表单ID到表单名的映射
  const formIdToName = useMemo(() => {
    if (!forms || !Array.isArray(forms)) return {};
    return forms.reduce((acc, form) => {
      acc[form.id] = form.name;
      return acc;
    }, {});
  }, [forms]);

  // 获取可用的激活表单列表
  const activeForms = useMemo(() => {
    if (!forms || !Array.isArray(forms)) return [];
    return forms.filter(f => f.isActive);
  }, [forms]);

  const filteredAssets = useMemo(() => {
    const filtered = assets
      .filter(asset =>
        (selectedSubAccountId === 'all' || asset.subAccountId === selectedSubAccountId) &&
        (selectedFormId === 'all' || asset.formId === selectedFormId)
      )
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序
    
    // 调试信息：当选择了具体表格时，输出该表格的所有asset记录
    if (selectedFormId !== 'all') {
      const formAssets = filtered.filter(a => a.formId === selectedFormId);
      console.log(`表格 ${formIdToName[selectedFormId]} 的Asset记录数:`, formAssets.length);
      formAssets.forEach((asset, idx) => {
        const batchCount = (asset.batchData || asset.batch_data || []).length;
        console.log(`  Asset ${idx + 1}: ID=${asset.id}, batchData条数=${batchCount}`);
      });
    }
    
    return filtered;
  }, [assets, selectedSubAccountId, selectedFormId, formIdToName]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportError, setExportError] = useState(null);

  React.useEffect(() => {
    setExportError(null);
  }, [selectedFormId]);

  const handleCardClick = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const handleExportExcel = async () => {
    if (selectedFormId === 'all') {
      setExportError('请先选择一个具体的表格再导出。');
      return;
    }
    try {
      setExportError(null);
      setDownloadingFormId(selectedFormId);
      const blob = await formsAPI.exportData(selectedFormId, { scope: 'active' });
      const formName = formIdToName[selectedFormId] || '表格';
      const fileName = `${formName}_未归档.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || '导出失败，请重试');
    } finally {
      setDownloadingFormId(null);
    }
  };

  if (assetsLoading || usersLoading || formsLoading) {
    return <LoadingScreen message="正在加载所有记录数据..." />;
  }
  if (assetsError || usersError || formsError) {
    return <div className="text-red-500">加载数据失败: {assetsError || usersError || formsError}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">汇总查看记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            在左侧<strong className="text-blue-600">"选择要导出的表格"</strong>下拉菜单中选择一个具体表格后，即可导出该表格的未归档Excel。
          </p>
        </div>
        {/* 视图切换按钮 */}
        <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${viewMode === 'cards'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Grid className="w-4 h-4" />
            <span>卡片</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${viewMode === 'table'
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
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="max-w-xs w-full">
            <label htmlFor="form-filter" className="block text-sm font-medium text-gray-700 mb-1">
              <span>选择要导出的表格</span>
              {selectedFormId === 'all' && (
                <span className="ml-2 text-xs text-red-500 font-normal">*必选</span>
              )}
            </label>
            <select
              id="form-filter"
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${
                selectedFormId === 'all' ? 'border-red-300 bg-red-50' : ''
              }`}
            >
              <option value="all">-- 请选择表格（导出必选）--</option>
              {activeForms.map(form => (
                <option key={form.id} value={form.id}>{form.name}</option>
              ))}
            </select>
            {selectedFormId === 'all' && (
              <p className="mt-1 text-xs text-red-500">请从上方下拉菜单选择一个具体的表格才能导出</p>
            )}
          </div>
          {subAccounts.length > 0 && (
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
                <option value="all">所有经手人</option>
                {subAccounts.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {exportError && (
            <span className="text-sm text-red-500">{exportError}</span>
          )}
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={selectedFormId === 'all' || downloadingFormId === selectedFormId || !forms || forms.length === 0}
            title={selectedFormId === 'all' ? '请先从左侧"选择要导出的表格"下拉菜单中选择一个具体的表格（不能选择"所有表格"）' : '点击导出当前选择的表格数据'}
            className={selectedFormId === 'all' ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadingFormId === selectedFormId ? '导出中...' : '导出未归档Excel'}
          </Button>
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
                          minute: '2-digit'
                        });
                      }
                    }
                  } catch (e) {
                    console.error('日期解析错误:', e, asset.submittedAt);
                  }
                }

                const submitterName = userIdToName[asset.subAccountId] || asset.subAccountName || '未知';
                const formName = formIdToName[asset.formId] || asset.formName || '未知表格';
                // 支持 batchData (camelCase) 和 batch_data (snake_case)
                const recordCount = (asset.batchData || asset.batch_data || [])?.length || 0;

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