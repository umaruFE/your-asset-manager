import React from 'react';
import { FileText } from '../utils/UI';

// 资产卡片组件
export default function AssetCard({ asset, onClick }) {
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

// 查看资产详情模态框组件
export function ViewAssetDetailModal({ asset, isOpen, onClose }) {
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
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 背景遮罩 */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* 模态框内容 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  查看记录详情
                </h3>
                
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
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}