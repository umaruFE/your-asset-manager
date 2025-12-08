import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, LoadingScreen, Modal } from '../utils/UI';
import { Eye, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { calculateFormula, formatFieldValue } from '../utils/helpers';
import { formsAPI } from '../utils/api';

// 查看未归档文档（只读模式，基地负责人使用）
export default function ViewMyAssetsPanelReadOnly({ user, getCollectionHook, initialFormId = null }) {
  const { data: assets, loading, error, update: updateAssets } = getCollectionHook('assets');
  const { data: forms } = getCollectionHook('forms');
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

    // 根据用户角色，后端已经过滤了assets数据
    // 基地负责人：只能看到自己基地的数据
    // 资产管理员/财务管理员：可以看到所有有权限的数据
    const formAssets = assets
      .filter(asset => asset.formId === selectedFormId)
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
  }, [selectedFormId, assets, forms]);

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
        <UnarchivedFormDataViewReadOnly
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

// 未归档表格数据视图组件（只读模式，只有查看功能）
function UnarchivedFormDataViewReadOnly({ form, rows, assets, user, getCollectionHook, onDataUpdated }) {
  const [viewModal, setViewModal] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

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

  // 处理导出
  const handleExportExcel = useCallback(async () => {
    if (!form || !form.id) {
      setExportError('无法导出：表格信息不完整');
      return;
    }
    try {
      setExportError(null);
      setIsExporting(true);
      const blob = await formsAPI.exportData(form.id, { scope: 'active' });
      const fileName = `${form.name || '表格'}_未归档_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      setIsExporting(false);
    }
  }, [form]);

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">{form.name}</h3>
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? '导出中...' : '导出Excel'}
          </Button>
        </div>
        
        {exportError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {exportError}
          </div>
        )}
        
        <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
          暂无数据。请先登记数据。
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{form.name}</h3>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? '导出中...' : '导出Excel'}
        </Button>
      </div>
      
      {exportError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {exportError}
        </div>
      )}

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

