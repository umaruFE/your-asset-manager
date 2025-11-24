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
    
    const { allForms = [], allAssets = [], currentFormId = null } = options;
    
    // Create a map of field names to their current numerical value (current form)
    const valueMap = fields.reduce((acc, field) => {
        // Use field name as key, retrieve value from rowData by field ID
        // Note: Field IDs are used in rowData keys, but names are used in the formula string.
        const value = Number(rowData[field.id]) || 0;
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

    // Regex to identify field names in the formula
    // Updated to support "表名.字段名" format
    // This regex looks for sequences that could be field names or "表名.字段名"
    const fieldNameRegex = /([a-zA-Z0-9\u4e00-\u9fa5\s\(\)\[\]\{\}]+(?:\.[a-zA-Z0-9\u4e00-\u9fa5\s\(\)\[\]\{\}]+)?)/g; 
    
    let calculationString = formula.replace(fieldNameRegex, (match) => {
        const trimmedMatch = match.trim();
        // Skip if it's an operator or number
        if (/^[\+\-\*\/\(\)\s]+$/.test(trimmedMatch) || !isNaN(trimmedMatch)) {
            return trimmedMatch;
        }
        // Replace field NAME (or "表名.字段名") with its value from valueMap
        return valueMap[trimmedMatch] !== undefined ? valueMap[trimmedMatch] : 0;
    });

    // Basic sanitization: only allow numbers and basic arithmetic operators
    // We strictly check the resulting string before calculation.
    if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(calculationString)) {
         return 'Error: Invalid characters or unmatched field names in formula';
    }
    
    // Use the Function constructor for safe dynamic calculation instead of eval()
    try {
        // Create an anonymous function that returns the result of the calculation string.
        // This is safer than direct eval as it runs in its own scope.
        const calculate = new Function('return ' + calculationString);
        const result = calculate();
        
        if (isNaN(result) || !isFinite(result)) return 'Error: Calculation failed';
        
        // Round to 2 decimal places for financial/quantity results
        return parseFloat(result.toFixed(2)); 
    } catch (e) {
        // Catch syntax or runtime errors during calculation
        return 'Error: ' + e.message;
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