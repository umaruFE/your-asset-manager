import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Modal, Plus, Trash2, Check, X } from '../utils/UI';
import { generateId, calculateFormula, formatFieldValue, getStepFromPrecision, validateFormData } from '../utils/helpers';
import { assetsAPI } from '../utils/api';

export default function EditAssetPanel({ user, asset, form, getCollectionHook, onSave, onCancel }) {
  const { data: allForms } = getCollectionHook('forms');
  const { data: allAssets } = getCollectionHook('assets');
  const { update: updateAssets } = getCollectionHook('assets');

  // 初始化行数据（从asset的batchData加载）
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 确保使用当前表单的最新字段定义，并只取 active 字段
  const activeFields = useMemo(() => {
    return form.fields.filter(f => f.active);
  }, [form.fields]);

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

  // 初始化数据：从asset加载现有数据
  useEffect(() => {
    if (asset && asset.batchData && Array.isArray(asset.batchData) && !isInitialized) {
      // 使用asset的batchData作为初始数据
      const initialRows = asset.batchData.map(row => {
        // 确保所有字段都有值
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
        return calculateRow(newRow);
      });
      setRows(initialRows);
      setIsInitialized(true);
    }
  }, [asset, activeFields, isInitialized, calculateRow]);

  const buildInitialRow = useCallback(() => {
    return activeFields.reduce((acc, field) => {
      const isBaseField = /基地/.test(String(field.name || ''));
      const shouldAutoFillBase = user?.role === 'base_handler' || user?.role === 'base_manager';
      const userBaseValue = user?.base_name || user?.baseName || '';
      if (isBaseField && shouldAutoFillBase) {
        if (field.type === 'select') {
          const options = Array.isArray(field.options) ? field.options : [];
          if (userBaseValue && options.includes(userBaseValue)) {
            acc[field.id] = userBaseValue;
          } else {
            acc[field.id] = options.length > 0 ? options[0] : (userBaseValue || '');
          }
        } else {
          acc[field.id] = userBaseValue || '';
        }
        return acc;
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
  }, [activeFields]);

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

  // 保存修改
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const nonEmptyRows = rows.filter(row => {
        // 排除公式字段，只检查用户可输入字段
        return activeFields.filter(f => f.type !== 'formula').some(field => row[field.id] != null && row[field.id] !== '');
    });

    if (nonEmptyRows.length === 0) {
      setError("请至少填写一行有效数据。");
      setIsSaving(false);
      return;
    }
  
  // 校验必填字段（传入 id + name，以便错误消息显示字段名称）
  const requiredFields = activeFields.filter(f => f.required).map(f => ({ id: f.id, name: f.name }));
  if (requiredFields.length > 0) {
    for (const r of nonEmptyRows) {
      const errors = validateFormData(r, requiredFields);
      if (errors && errors.length > 0) {
        setError(errors[0]);
        setIsSaving(false);
        return;
      }
    }
  }
    
    try {
        // 使用当前表单的最新字段快照
        await assetsAPI.update(asset.id, {
            batchData: nonEmptyRows,
            fieldsSnapshot: form.fields
        });

        // 更新本地状态
        updateAssets(prevAssets => {
            return prevAssets.map(a => 
                a.id === asset.id 
                    ? { ...a, batchData: nonEmptyRows, fieldsSnapshot: form.fields }
                    : a
            );
        });

        onSave();
    } catch (err) {
      console.error("更新记录失败:", err);
      setError(err.message || "更新失败，请重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldInput = (field, rowIndex, row) => {
    const baseClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const currentValue = row[field.id] ?? (field.type === 'number' ? 0 : '');
    const isBaseField = /基地/.test(String(field.name || ''));
    const shouldAutoFillBase = user?.role === 'base_handler' || user?.role === 'base_manager';
    const userBaseValue = user?.base_name || user?.baseName || '';

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
        isBaseField && shouldAutoFillBase ? (
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

  if (!isInitialized) {
    return (
      <Modal isOpen={true} onClose={onCancel} title="编辑记录">
        <div className="p-4">正在加载记录数据...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onCancel} title={`编辑记录 - ${form.name}`}>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h3 className="text-xl font-bold text-gray-800">修改记录数据</h3>
                <p className="text-sm text-gray-500 mt-1">修改后点击保存即可更新记录。</p>
            </div>
            <div className="flex gap-3 flex-wrap">
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

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-gray-800">第 {rowIndex + 1} 行</p>
                            <p className="text-xs text-gray-500">修改字段后系统会自动计算公式字段</p>
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

        <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
            >
                <X className="w-4 h-4 mr-2" />
                取消
            </Button>
            <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <Check className="w-5 h-5 mr-2" />
                )}
                {isSaving ? '保存中...' : '保存修改'}
            </Button>
        </div>
      </form>
    </Modal>
  );
}
