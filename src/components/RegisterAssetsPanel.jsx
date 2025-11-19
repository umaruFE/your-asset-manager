import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, LoadingScreen, Plus, Trash2, Check } from '../utils/UI';
import { generateId, calculateFormula } from '../utils/helpers';

export default function RegisterAssetsPanel({ user, form, getCollectionHook, onAssetRegistered }) {
  const { data: allForms } = getCollectionHook('forms'); // Need all forms to reference fields by name
  const { data: allAssets } = getCollectionHook('assets'); // Need all assets for cross-form field calculation
  const { update: updateAssets } = getCollectionHook('assets');

  const [rows, setRows] = useState([{}]); // 初始化一行空数据
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 确保使用当前表单的最新字段定义，并只取 active 字段
  const activeFields = useMemo(() => {
    return form.fields.filter(f => f.active);
  }, [form.fields]);

  // 辅助函数：根据当前行数据计算所有公式字段的值
  const calculateRow = useCallback((currentRow) => {
    let newRow = { ...currentRow };
    
    // 1. Calculate formulas
    form.fields.filter(f => f.type === 'formula' && f.active).forEach(field => {
        if (field.formula) {
            // Formula calculation uses field names (e.g., "入库数量 * 单价" or "其他表名.字段名")
            const calculatedValue = calculateFormula(
                field.formula, 
                newRow, 
                form.fields,
                { allForms, allAssets, currentFormId: form.id }
            );
            
            // Update ID-based result
            newRow[field.id] = calculatedValue;
        }
    });

    return newRow;
  }, [form.fields, allForms, allAssets, form.id]);

  // 初始化第一行数据
  useEffect(() => {
    // Check if initialization is needed OR if the form changed
    if (activeFields.length > 0 && (rows.length === 0 || rows.some(row => Object.keys(row).length === 0))) {
      const initialRow = activeFields.reduce((acc, field) => {
        // Initialize non-formula fields to empty string or 0
        acc[field.id] = field.type === 'number' ? 0 : '';
        return acc;
      }, {});
      
      // Calculate initial formulas based on the empty/zero initial data
      const calculatedInitialRow = calculateRow(initialRow);

      setRows([calculatedInitialRow]);
    }
  }, [activeFields, calculateRow]);

  // 处理输入变化 (更新单行数据并重新计算公式)
  const handleInputChange = (e, rowIndex, fieldId) => {
    const { value, type } = e.target;
    const newRows = [...rows];
    let updatedRow = { ...newRows[rowIndex] };
    
    // 1. Update the input field value
    updatedRow[fieldId] = type === 'number' ? Number(value) : value;

    // 2. Re-calculate all formulas in this row
    updatedRow = calculateRow(updatedRow);

    newRows[rowIndex] = updatedRow;
    setRows(newRows);
  };
  
  // 添加新行
  const addRow = () => {
    const newRow = activeFields.reduce((acc, field) => {
      acc[field.id] = field.type === 'number' ? 0 : '';
      return acc;
    }, {});
    
    // Calculate initial formulas for the new row
    const calculatedNewRow = calculateRow(newRow);
    setRows([...rows, calculatedNewRow]);
  };

  // 删除行
  const removeRow = (rowIndex) => {
    if (rows.length <= 1) return; // 至少保留一行
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
  };
  
  // 清空表单
  const resetForm = () => {
      const initialRow = activeFields.reduce((acc, field) => {
          acc[field.id] = field.type === 'number' ? 0 : '';
          return acc;
        }, {});
        
      const calculatedInitialRow = calculateRow(initialRow);
      setRows([calculatedInitialRow]);
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

        const { update: updateAssets } = getCollectionHook('assets');

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">批量登记</h3>
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto bg-gray-50 rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {activeFields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {field.name}
                  {field.type === 'formula' && <span className="text-xs text-blue-500 ml-1">(自动计算)</span>}
                </th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {activeFields.map(field => (
                  <td key={field.id} className="px-2 py-2 whitespace-nowrap">
                    {field.type === 'formula' ? (
                      // Formula Field (Read-only)
                      <div className="mt-1 block w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-md shadow-sm sm:text-sm font-bold text-blue-700">
                        {row[field.id] || '0.00'}
                      </div>
                    ) : (
                      // Regular Input Fields
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={row[field.id] === 0 ? 0 : row[field.id] || ''} // Handle display of 0 for number inputs
                        onChange={(e) => handleInputChange(e, rowIndex, field.id)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={`输入${field.name}`}
                        step={field.type === 'number' ? '0.01' : undefined}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-2 whitespace-nowrap text-right">
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => removeRow(rowIndex)}
                    disabled={rows.length <= 1}
                    className={rows.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加一行
        </Button>
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
  );
}