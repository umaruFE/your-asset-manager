// 生成唯一ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 将下划线命名转换为驼峰命名
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// 转换对象字段名从下划线到驼峰
export function toCamelCaseObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    // 特殊处理 Date 对象，直接返回
    if (obj instanceof Date) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(toCamelCaseObject);
    }
    if (typeof obj === 'object') {
        const camelObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = toCamelCase(key);
                camelObj[camelKey] = toCamelCaseObject(obj[key]);
            }
        }
        return camelObj;
    }
    return obj;
}


