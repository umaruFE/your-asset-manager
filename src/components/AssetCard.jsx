import React from 'react';
import { FileText } from '../utils/UI';
import { formatFieldValue } from '../utils/helpers';

// 资产卡片组件
export default function AssetCard({ asset, onClick }) {
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
    
    // 支持 batchData (camelCase) 和 batch_data (snake_case)
    const batchData = asset.batchData || asset.batch_data || [];
    const recordCount = batchData?.length || 0;
    
    // Find the first non-formula/non-textarea field to use as the title
    const titleField = asset.fieldsSnapshot?.find(f => f.type !== 'formula' && f.type !== 'textarea') || asset.fieldsSnapshot?.[0]; 
    const firstRecord = batchData?.[0] || {};
    
    const rawTitleValue = titleField ? (firstRecord[titleField.id] ?? firstRecord[titleField.name]) : null;
    const title = rawTitleValue !== undefined && rawTitleValue !== null
        ? formatFieldValue(titleField, rawTitleValue)
        : (asset.formName || '记录');

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
  const fieldIdToField = React.useMemo(() => {
      if (!asset.fieldsSnapshot || !Array.isArray(asset.fieldsSnapshot)) {
          return {};
      }
      return asset.fieldsSnapshot.reduce((acc, field) => {
        if (field && field.id && field.name) {
        acc[field.id] = field;
        }
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  const fieldNameToField = React.useMemo(() => {
      if (!asset.fieldsSnapshot || !Array.isArray(asset.fieldsSnapshot)) {
          return {};
      }
      return asset.fieldsSnapshot.reduce((acc, field) => {
        if (field && field.id && field.name) {
            acc[field.name] = field;
        }
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  // 支持 batchData (camelCase) 和 batch_data (snake_case)
  // 确保数据是数组格式
  let batchData = asset.batchData || asset.batch_data || [];
  
  // 如果batchData是字符串，尝试解析为JSON
  if (typeof batchData === 'string') {
      try {
          batchData = JSON.parse(batchData);
      } catch (e) {
          console.error('解析batchData失败:', e);
          batchData = [];
      }
  }
  
  // 确保batchData是数组
  if (!Array.isArray(batchData)) {
      console.warn('batchData不是数组格式:', batchData);
      batchData = [];
  }
  
  // 调试信息
  React.useEffect(() => {
      if (isOpen) {
          console.log('=== 记录详情调试信息 ===');
          console.log('Asset ID:', asset.id);
          console.log('Form ID:', asset.formId);
          console.log('Form Name:', asset.formName);
          console.log('batchData类型:', typeof batchData);
          console.log('batchData是否为数组:', Array.isArray(batchData));
          console.log('batchData长度:', batchData.length);
          console.log('batchData内容:', batchData);
          console.log('fieldsSnapshot长度:', asset.fieldsSnapshot?.length || 0);
          console.log('========================');
      }
  }, [isOpen, asset.id, batchData.length]);
  
  // 获取所有在快照中出现过的字段 (用于表头)
  // 支持两种格式：字段ID作为键，或字段名称作为键
  const allFieldKeysInBatch = React.useMemo(() => {
      if (!batchData || !Array.isArray(batchData) || batchData.length === 0) {
          return [];
      }
      
      const keySet = new Set();
      batchData.forEach(row => {
        if (row && typeof row === 'object') {
            Object.keys(row).forEach(key => keySet.add(key));
        }
      });
      
      // 判断batchData中的键是字段ID还是字段名称
      const firstRow = batchData[0];
      const firstKey = firstRow ? Object.keys(firstRow)[0] : null;
      const isUsingFieldNames = firstKey && fieldNameToField[firstKey]; // 如果第一个键能在名称映射中找到，说明使用的是字段名称
      
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
  }, [asset.batchData, asset.batch_data, asset.fieldsSnapshot, fieldNameToField]);

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
                  
                  {allFieldKeysInBatch.length > 0 && batchData && batchData.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 text-sm text-gray-600">
                      共 <strong className="text-blue-600">{batchData.length}</strong> 条记录
                    </div>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                              {allFieldKeysInBatch.map(fieldKey => {
                                const fieldDef = fieldIdToField[fieldKey] || fieldNameToField[fieldKey];
                                const fieldName = fieldDef?.name || fieldKey;
                                return (
                                  <th key={fieldKey} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {fieldName || '未知字段'}
                                  </th>
                                );
                              })}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {batchData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                {allFieldKeysInBatch.map(fieldKey => {
                                  const fieldDef = fieldIdToField[fieldKey] || fieldNameToField[fieldKey];
                                  const rawValue = row[fieldKey];
                                  const displayValue = rawValue !== undefined && rawValue !== null
                                      ? formatFieldValue(fieldDef, rawValue)
                                      : 'N/A';
                                  return (
                                    <td key={fieldKey} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                      {displayValue}
                                    </td>
                                  );
                                })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  ) : (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      <p>暂无数据</p>
                      {(!batchData || batchData.length === 0) && (
                        <p className="text-sm mt-2">该记录没有包含任何数据</p>
                      )}
                      {(!asset.fieldsSnapshot || asset.fieldsSnapshot.length === 0) && (
                        <p className="text-sm mt-2">该记录的字段信息缺失</p>
                      )}
                    </div>
                  )}
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