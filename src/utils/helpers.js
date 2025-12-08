// --- LocalStorage Setup ---
export const LOCAL_STORAGE_KEY = 'asset_manager_V2_DATA';
export const CURRENT_USER_ID_KEY = 'asset_manager_CURRENT_USER_ID';

/** Generates a simple unique ID */
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Function to safely load all data from LocalStorage
export const loadInitialCollections = () => {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
    }
    // Initial empty structure
    // NOTE: 'forms' replaces 'assetFields', 'assets' now stores data by formId
    return {
        allAppUsers: [],
        forms: [], // New collection for form templates
        files: [],
        assets: [], // Store records as { formId: "formId", subAccountId: "...", batchData: [...] }
    };
};

// --- Formula Logic ---

/**
 * Executes a calculation based on a simple formula string.
 * Supports +, -, *, /. Example: "fieldIdA + fieldIdB * 2"
 * Also supports cross-form fields: "表名.字段名"
 * Note: Only supports single operation per formula for simplicity.
 * 
 * @param {string} formula - The formula string
 * @param {object} rowData - Current row data (fieldId -> value mapping)
 * @param {array} fields - Current form fields
 * @param {object} options - Optional: { allForms, allAssets, currentFormId }
 */
export const calculateFormula = (formula, rowData, fields, options = {}) => {
    if (!formula || typeof formula !== 'string') return '';
    
    const { allForms = [], allAssets = [], currentFormId = null, targetPrecision = 2 } = options;
    
    // Create a map of field names to their current numerical value (current form)
    const valueMap = fields.reduce((acc, field) => {
        // Use field name as key, retrieve value from rowData by field ID
        // Note: Field IDs are used in rowData keys, but names are used in the formula string.
        const rawValue = rowData[field.id];
        // 处理空值、undefined、null、空字符串等情况
        let value = 0;
        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
            const numValue = Number(rawValue);
            value = isNaN(numValue) ? 0 : numValue;
        }
        acc[field.name] = value;
        return acc;
    }, {});
    
    // Add cross-form field values
    // Format: "表名.字段名"
    allForms.forEach(form => {
        if (form.id === currentFormId) return; // Skip current form (already in valueMap)
        
        form.fields
            .filter(field => field.active && field.type === 'number')
            .forEach(field => {
                const crossFormKey = `${form.name}.${field.name}`;
                
                // Try to get value from other forms' assets
                // For now, we'll get the latest value from the most recent asset batch
                let crossFormValue = 0;
                
                // Find the most recent asset batch for this form
                const formAssets = allAssets
                    .filter(asset => asset.formId === form.id)
                    .sort((a, b) => b.submittedAt - a.submittedAt);
                
                if (formAssets.length > 0) {
                    // Get the latest batch and try to find the field value
                    const latestBatch = formAssets[0];
                    if (latestBatch.batchData && latestBatch.batchData.length > 0) {
                        // Get the first row's value for this field
                        const firstRow = latestBatch.batchData[0];
                        crossFormValue = Number(firstRow[field.id]) || 0;
                    }
                }
                
                valueMap[crossFormKey] = crossFormValue;
            });
    });

    // 改进的字段名替换逻辑：按长度从长到短排序，逐个替换
    let calculationString = formula;
    
    // 按字段名长度从长到短排序，优先匹配长字段名（避免部分匹配问题）
    const sortedFieldNames = Object.keys(valueMap).sort((a, b) => b.length - a.length);
    
    // 创建字段名映射（去除空格后的版本，用于模糊匹配）
    const normalizedFieldMap = {};
    for (const fieldName of sortedFieldNames) {
        const normalized = fieldName.replace(/\s+/g, '');
        normalizedFieldMap[normalized] = { original: fieldName, value: valueMap[fieldName] };
    }
    
    // 逐个替换字段名为其值（使用简单字符串替换，因为字段名是精确匹配的）
    for (const fieldName of sortedFieldNames) {
        const fieldValue = valueMap[fieldName];
        // 转义特殊字符
        const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 直接字符串替换（字段名在公式中是精确匹配的）
        if (calculationString.includes(fieldName)) {
            calculationString = calculationString.replace(new RegExp(escapedFieldName, 'g'), fieldValue);
        }
    }
    
    // 如果还有未替换的字段名，尝试去除空格后匹配
    const remainingParts = calculationString.split(/[\+\-\*\/]/).map(p => p.trim()).filter(p => p && isNaN(p));
    for (const part of remainingParts) {
        const normalizedPart = part.replace(/\s+/g, '');
        if (normalizedFieldMap[normalizedPart]) {
            const { original, value } = normalizedFieldMap[normalizedPart];
            calculationString = calculationString.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
    }
    
    // 清理多余空格，但保留运算符周围的空格
    calculationString = calculationString.replace(/\s+/g, ' ').trim();
    
    // 调试信息：如果公式没有被替换，说明字段名不匹配
    if (calculationString === formula) {
        console.warn('[Formula] No fields replaced. Formula:', formula, '| ValueMap keys:', Object.keys(valueMap), '| ValueMap:', valueMap);
    } else {
        console.log('[Formula] Replaced:', formula, '->', calculationString, '| ValueMap:', valueMap);
    }

    // 验证计算字符串只包含数字和运算符
    // 如果验证失败，返回0而不是错误（静默处理）
    if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(calculationString)) {
        // 静默处理：返回0而不是错误信息
        const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
        return parseFloat(Number(0).toFixed(precision));
    }
    
    // Use the Function constructor for safe dynamic calculation instead of eval()
    try {
        // 如果计算字符串为空或只包含空格，返回0
        if (!calculationString || calculationString.trim() === '') {
            return 0;
        }
        
        // 检查是否包含除零操作（例如 "x / 0" 或 "x / 0.0"）
        // 使用正则表达式检查除以0的情况
        if (/\/(\s*0\s*[\)\s\+\-\*\/]|0\.0*[\)\s\+\-\*\/]|0\.0*$)/.test(calculationString)) {
            // 除零情况，返回0而不是错误
            const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
            return parseFloat(Number(0).toFixed(precision));
        }
        
        // Create an anonymous function that returns the result of the calculation string.
        // This is safer than direct eval as it runs in its own scope.
        const calculate = new Function('return ' + calculationString);
        const result = calculate();
        
        // 允许结果为0（0是有效值）
        if (result === 0) {
            const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
            return parseFloat(Number(result).toFixed(precision));
        }
        
        // 如果结果是无效值（NaN或Infinity），返回0而不是错误
        if (isNaN(result) || !isFinite(result)) {
            // 静默处理无效结果，返回0
            const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
            return parseFloat(Number(0).toFixed(precision));
        }
        
        const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
        return parseFloat(Number(result).toFixed(precision));
    } catch (e) {
        // 捕获计算错误（如除零、语法错误等），返回0而不是错误信息
        // 静默处理错误，避免显示"Error: Calculation failed"
        const precision = Math.max(0, Math.min(6, Number(targetPrecision) || 2));
        return parseFloat(Number(0).toFixed(precision));
    }
};

// 时间转换函数
export function convertTimestamp(timestamp) {
  if (!timestamp) return '未知时间';
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 模拟API延迟
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 深拷贝函数
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// 文件下载函数
export function downloadFile(file) {
  if (file.url) {
    // 如果有URL，直接下载
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (file.content) {
    // 如果有内容，创建Blob下载
    const blob = new Blob([file.content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    alert('文件不可下载');
  }
}

export function formatFieldValue(field, value) {
  if (value === null || value === undefined) return '';
  if (!field) return value;
  if (['number', 'formula'].includes(field.type)) {
    const precision = Math.max(0, Math.min(6, Number(field.displayPrecision ?? 2)));
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return value;
    }
    return numericValue.toFixed(precision);
  }
  return value;
}

export function getStepFromPrecision(precision = 0) {
  const safePrecision = Math.max(0, Math.min(6, Number(precision) || 0));
  if (safePrecision === 0) {
    return '1';
  }
  return Number(`0.${'0'.repeat(safePrecision - 1)}1`);
}

// 数据验证函数
export function validateFormData(data, requiredFields = []) {
  const errors = [];
  
  // 检查必填字段
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} 是必填字段`);
    }
  });
  
  // 检查数字字段
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== null && value !== '' && !isNaN(value) && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(`${key} 必须是有效的数字`);
      }
    }
  });
  
  return errors;
}

// 生成随机颜色
export function generateRandomColor() {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 搜索过滤函数
export function filterData(data, searchTerm, searchFields = []) {
  if (!searchTerm || searchTerm.trim() === '') return data;
  
  const term = searchTerm.toLowerCase().trim();
  
  return data.filter(item => {
    // 如果指定了搜索字段，只在指定字段中搜索
    if (searchFields.length > 0) {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    }
    
    // 否则在所有字段中搜索
    return Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(term)
    );
  });
}

// 分页函数
export function paginateData(data, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

// 排序函数
export function sortData(data, sortField, sortDirection = 'asc') {
  return [...data].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // 处理数字排序
    if (!isNaN(aVal) && !isNaN(bVal)) {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }
    
    // 处理字符串排序
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (sortDirection === 'desc') {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    } else {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }
  });
}