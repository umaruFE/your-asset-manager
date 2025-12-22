import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, LoadingScreen, Plus, Trash2, Check, Download } from '../utils/UI';
import { generateId, calculateFormula, formatFieldValue, getStepFromPrecision, validateFormData } from '../utils/helpers';
import { formsAPI } from '../utils/api';
import AssetCard, { ViewAssetDetailModal } from './AssetCard';

export default function RegisterAssetsPanel({ user, form, getCollectionHook, onAssetRegistered }) {
  const { data: allForms } = getCollectionHook('forms'); // Need all forms to reference fields by name
  const { data: allAssets } = getCollectionHook('assets'); // Need all assets for cross-form field calculation
  const { update: updateAssets } = getCollectionHook('assets');

  const [rows, setRows] = useState([{}]); // 初始化一行空数据
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [detailAsset, setDetailAsset] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // 确保使用当前表单的最新字段定义，并只取 active 字段
  const activeFields = useMemo(() => {
    return form.fields.filter(f => f.active);
  }, [form.fields]);

  const existingAssets = useMemo(() => {
    if (!Array.isArray(allAssets)) return [];
    return allAssets
      .filter(asset => asset.formId === form.id)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }, [allAssets, form.id]);

  const buildInitialRow = useCallback(() => {
    return activeFields.reduce((acc, field) => {
      // 自动填充所属基地字段：仅当当前用户为基地经手人或基地负责人时自动填充
      const isBaseField = /基地/.test(String(field.name || ''));
      const shouldAutoFillBase = user?.role === 'base_handler' || user?.role === 'base_manager';
      if (isBaseField && shouldAutoFillBase) {
        // 优先使用用户的 base_name 或 baseName，再回退到选项第一个
        const baseCandidate = user?.base_name || user?.baseName || '';
        if (field.type === 'select') {
          const options = Array.isArray(field.options) ? field.options : [];
          if (baseCandidate && options.includes(baseCandidate)) {
            acc[field.id] = baseCandidate;
            return acc;
          }
          acc[field.id] = options.length > 0 ? options[0] : (baseCandidate || '');
          return acc;
        } else {
          acc[field.id] = baseCandidate || '';
          return acc;
        }
      }

      if (field.type === 'number' || field.type === 'formula') {
        acc[field.id] = 0;
      } else if (field.type === 'select') {
        acc[field.id] = Array.isArray(field.options) && field.options.length > 0 ? field.options[0] : '';
      } else {
        acc[field.id] = '';
      }
      return acc;
    }, {});
  }, [activeFields, user]);

  // 辅助函数：根据当前行数据计算所有公式字段的值
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

  // 初始化第一行数据
  useEffect(() => {
    if (activeFields.length > 0) {
      const baseRow = buildInitialRow();
      const calculatedInitialRow = calculateRow(baseRow);
      setRows([calculatedInitialRow]);
    }
  }, [activeFields, calculateRow, buildInitialRow]);

  // 处理输入变化 (更新单行数据并重新计算公式)
  const handleFieldChange = (field, rowIndex, rawValue) => {
    const newRows = [...rows];
    let updatedRow = { ...newRows[rowIndex] };

    if (field.type === 'number') {
        updatedRow[field.id] = rawValue === '' ? '' : Number(rawValue);
    } else {
        updatedRow[field.id] = rawValue;
    }

    updatedRow = calculateRow(updatedRow);

    newRows[rowIndex] = updatedRow;
    setRows(newRows);
  };

  const handleExportActive = async () => {
    try {
        setExportError(null);
        setIsExporting(true);
        const blob = await formsAPI.exportData(form.id, { scope: 'active' });
        const fileName = `${form.name || '表格'}_未归档_${new Date().toISOString().slice(0,10)}.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        setExportError(err.message || '导出失败，请稍后再试');
    } finally {
        setIsExporting(false);
    }
  };
  
  // 添加新行
  const addRow = () => {
    const newRow = calculateRow(buildInitialRow());
    setRows(prev => [...prev, newRow]);
  };

  // 删除行
  const removeRow = (rowIndex) => {
    if (rows.length <= 1) return; // 至少保留一行
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
  };
  
  // 清空表单
  const resetForm = () => {
      const initialRow = calculateRow(buildInitialRow());
      setRows([initialRow]);
      setError(null);
  }

  // 提交
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const nonEmptyRows = rows.filter(row => {
        // 排除公式字段，只检查用户可输入字段
        return activeFields.filter(f => f.type !== 'formula').some(field => row[field.id] != null && row[field.id] !== '');
    });

    if (nonEmptyRows.length === 0) {
      setError("请至少填写一行有效数据。");
      setIsSubmitting(false);
      return;
    }
    
    // 校验必填字段（传入 id + name，以便错误消息显示字段名称）
    const requiredFields = activeFields.filter(f => f.required).map(f => ({ id: f.id, name: f.name }));
    if (requiredFields.length > 0) {
      for (const r of nonEmptyRows) {
        const errors = validateFormData(r, requiredFields);
        if (errors && errors.length > 0) {
          setError(errors[0]);
          setIsSubmitting(false);
          return;
        }
      }
    }
    try {
        const newAssetBatch = {
            id: generateId(),
            formId: form.id, // Link to the form template ID
            formName: form.name,
            subAccountId: user.id,
            subAccountName: user.name,
            submittedAt: Date.now(), 
            // 存储该表单当前版本的字段快照
            fieldsSnapshot: form.fields,
            batchData: nonEmptyRows
        };

        // 更新 assets 集合
        updateAssets(prevAssets => [...prevAssets, newAssetBatch]);

        console.log(`批量记录提交成功! Form ID: ${form.id}`);
        resetForm();
        onAssetRegistered(); // 通知父组件关闭标签页并打开"我的记录"
        
    } catch (err) {
      console.error("提交记录失败:", err);
      setError(err.message || "提交失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field, rowIndex, row) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const currentValue = row[field.id] ?? (field.type === 'number' ? 0 : '');
    const isBaseField = /基地/.test(String(field.name || ''));
    const userBaseValue = user?.base_name || user?.baseName || '';

    if (field.type === 'formula') {
        // 如果计算结果是错误字符串，显示0
        const safeValue = typeof currentValue === 'string' && currentValue.startsWith('Error:') ? 0 : currentValue;
        const displayValue = formatFieldValue(field, safeValue);
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
                onChange={(e) => handleFieldChange(field, rowIndex, e.target.value)}
                className={`${baseClass} resize-none`}
                placeholder={`请输入${field.name}`}
            />
        );
    }

    if (field.type === 'select') {
        const options = Array.isArray(field.options) ? field.options : [];
        if (options.length === 0) {
            return <div className="text-xs text-red-500">请先在字段设置中为该下拉字段配置选项</div>;
        }
        // 基地字段：仅当用户为基地经手人或基地负责人时自动填充并禁用选择，避免误录入
        const shouldAutoFillBase = user?.role === 'base_handler' || user?.role === 'base_manager';
        if (isBaseField && shouldAutoFillBase) {
            const valueToShow = currentValue || (options.includes(userBaseValue) ? userBaseValue : (options[0] || userBaseValue));
            return (
                <input
                    type="text"
                    value={valueToShow}
                    readOnly
                    className={`${baseClass} bg-gray-50 cursor-not-allowed`}
                />
            );
        }
        return (
            <select
                value={currentValue}
                onChange={(e) => handleFieldChange(field, rowIndex, e.target.value)}
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
                onChange={(e) => handleFieldChange(field, rowIndex, e.target.value)}
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
                onChange={(e) => handleFieldChange(field, rowIndex, e.target.value === '' ? '' : Number(e.target.value))}
                className={baseClass}
                placeholder={`请输入${field.name}`}
            />
        );
    }

    return (
        isBaseField ? (
            <input
                type="text"
                value={currentValue || userBaseValue || ''}
                readOnly
                className={`${baseClass} bg-gray-50 cursor-not-allowed`}
            />
        ) : (
            <input
                type="text"
                value={currentValue}
                onChange={(e) => handleFieldChange(field, rowIndex, e.target.value)}
                className={baseClass}
                placeholder={`请输入${field.name}`}
            />
        )
    );
  };

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h3 className="text-2xl font-bold text-gray-800">批量登记</h3>
                <p className="text-sm text-gray-500 mt-1">填写当前表格的未归档数据，保存后立即生效。</p>
            </div>
            <div className="flex gap-3 flex-wrap">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleExportActive}
                    disabled={isExporting}
                >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? '导出中...' : '导出未归档 Excel'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                    重置本表单
                </Button>
                <Button type="button" variant="outline" onClick={addRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加一行
                </Button>
            </div>
        </div>

        {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
            </div>
        )}
        {exportError && (
            <div className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg">
                {exportError}
            </div>
        )}

        <div className="space-y-6">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-gray-800">第 {rowIndex + 1} 行</p>
                            <p className="text-xs text-gray-500">填写下列字段后系统会自动保存并计算公式字段</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => removeRow(rowIndex)}
                                disabled={rows.length <= 1}
                                className={rows.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                删除
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {activeFields.map(field => (
                            <div key={`${field.id}-${rowIndex}`} className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">
                                        {field.name}
                                        {field.type === 'formula' && (
                                            <span className="ml-1 text-xs text-blue-500">(自动计算)</span>
                                        )}
                                    </label>
                                    {['number', 'formula'].includes(field.type) && (
                                        <span className="text-xs text-gray-400">
                                            保留 {typeof field.displayPrecision === 'number' ? field.displayPrecision : 2} 位小数
                                        </span>
                                    )}
                                </div>
                                {renderFieldInput(field, rowIndex, row)}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
            >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <Check className="w-5 h-5 mr-2" />
                )}
                全部提交
            </Button>
        </div>
      </form>

      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <div>
                <h4 className="text-xl font-semibold text-gray-800">未归档记录预览</h4>
                <p className="text-sm text-gray-500">提交后即可在此处查看最新记录，归档后会移动到“已归档文档”</p>
            </div>
            <span className="text-sm text-gray-500">共 {existingAssets.length} 条记录</span>
        </div>

        {existingAssets.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center text-gray-500">
                暂无记录。提交后即可实时查看。
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {existingAssets.slice(0, 6).map(asset => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => setDetailAsset(asset)} />
                ))}
            </div>
        )}
        {existingAssets.length > 6 && (
            <p className="text-xs text-gray-400 mt-2">
                仅显示最近 6 条记录，更多内容请前往"未归档文档"查看。
            </p>
        )}
      </section>

      {detailAsset && (
        <ViewAssetDetailModal
            asset={detailAsset}
            isOpen={!!detailAsset}
            onClose={() => setDetailAsset(null)}
        />
      )}
    </div>
  );
}