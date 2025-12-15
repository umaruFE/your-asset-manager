// API客户端工具
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 获取token
function getToken() {
    return localStorage.getItem('auth_token');
}

// 设置token
function setToken(token) {
    localStorage.setItem('auth_token', token);
}

// 移除token
function removeToken() {
    localStorage.removeItem('auth_token');
}

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const isFormData = options.body instanceof FormData;
    const responseType = options.responseType;

    const config = {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        // Blob/stream
        if (responseType === 'blob') {
            const blob = await response.blob();
            if (!response.ok) {
                const error = new Error(`Request failed with status ${response.status}`);
                error.response = { status: response.status };
                throw error;
            }
            return blob;
        }

        // 检查响应是否有内容
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // 如果JSON解析失败，返回空对象
                    data = {};
                }
            } else {
                data = {};
            }
        } else {
            // 非JSON响应，返回空对象
            data = {};
        }

        if (!response.ok) {
            // 如果是401错误，且不是登录接口，清除token并跳转到登录页
            // 登录接口的401错误应该正常显示错误信息，不跳转
            if (response.status === 401 && !endpoint.includes('/auth/login')) {
                removeToken();
                window.location.href = '/';
            }
            // 创建一个包含完整错误信息的错误对象
            const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
            // 将完整的错误数据附加到错误对象上，以便前端可以访问
            error.response = { data, status: response.status };
            error.data = data;
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// 认证API
export const authAPI = {
    login: async (username, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (data.token) {
            setToken(data.token);
        }
        return data;
    },

    verify: async () => {
        return await apiRequest('/auth/verify');
    },

    logout: () => {
        removeToken();
    },
};

// 用户API
export const usersAPI = {
    getAll: async () => {
        return await apiRequest('/users');
    },

    changePassword: async (oldPassword, newPassword) => {
        return await apiRequest('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword }),
        });
    },

    getMe: async () => {
        return await apiRequest('/users/me');
    },

    // 获取当前用户基地的经手人列表（基地负责人使用）
    getMyBaseHandlers: async () => {
        return await apiRequest('/users/my-base-handlers');
    },

    create: async (userData) => {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    update: async (id, userData) => {
        return await apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/users/${id}`, {
            method: 'DELETE',
        });
    },
};

// 表单API
export const formsAPI = {
    getAll: async () => {
        return await apiRequest('/forms');
    },

    getById: async (id) => {
        return await apiRequest(`/forms/${id}`);
    },

    create: async (formData) => {
        return await apiRequest('/forms', {
            method: 'POST',
            body: JSON.stringify(formData),
        });
    },

    update: async (id, formData) => {
        return await apiRequest(`/forms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formData),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/forms/${id}`, {
            method: 'DELETE',
        });
    },

    archive: async (id, options = {}) => {
        return await apiRequest(`/forms/${id}/archive`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
    },

    archiveBatch: async (formIds, options = {}) => {
        return await apiRequest('/forms/archive/batch', {
            method: 'POST',
            body: JSON.stringify({ formIds, ...options }),
        });
    },

    getArchives: async (id) => {
        return await apiRequest(`/forms/${id}/archives`);
    },

    // 字段管理
    addField: async (formId, fieldData) => {
        return await apiRequest(`/forms/${formId}/fields`, {
            method: 'POST',
            body: JSON.stringify(fieldData),
        });
    },

    updateField: async (formId, fieldId, fieldData) => {
        return await apiRequest(`/forms/${formId}/fields/${fieldId}`, {
            method: 'PUT',
            body: JSON.stringify(fieldData),
        });
    },

    updateFieldOrder: async (formId, fieldOrders) => {
        return await apiRequest(`/forms/${formId}/fields/order`, {
            method: 'PUT',
            body: JSON.stringify({ fieldOrders }),
        });
    },

    deleteField: async (formId, fieldId) => {
        return await apiRequest(`/forms/${formId}/fields/${fieldId}`, {
            method: 'DELETE',
        });
    },

    exportData: async (formId, params = {}) => {
        const token = getToken();
        const query = new URLSearchParams();
        if (params.scope) query.append('scope', params.scope);
        if (params.archiveId) query.append('archiveId', params.archiveId);
        const response = await fetch(`${API_BASE_URL}/forms/${formId}/export${query.toString() ? `?${query}` : ''}`, {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });
        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || '导出失败');
        }
        return await response.blob();
    },
};

// 资产API
export const assetsAPI = {
    getAll: async (filters = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.formId) queryParams.append('formId', filters.formId);
        if (filters.subAccountId) queryParams.append('subAccountId', filters.subAccountId);
        const query = queryParams.toString();
        return await apiRequest(`/assets${query ? `?${query}` : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/assets/${id}`);
    },

    create: async (assetData) => {
        return await apiRequest('/assets', {
            method: 'POST',
            body: JSON.stringify(assetData),
        });
    },

    update: async (id, assetData) => {
        return await apiRequest(`/assets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(assetData),
        });
    },
};

// 文件API
export const filesAPI = {
    getAll: async () => {
        return await apiRequest('/files');
    },

    getById: async (id) => {
        return await apiRequest(`/files/${id}`);
    },

    create: async ({ file, fileName, allowedSubAccounts }) => {
        const form = new FormData();
        if (file) form.append('file', file);
        if (fileName) form.append('fileName', fileName);
        if (allowedSubAccounts) form.append('allowedSubAccounts', JSON.stringify(allowedSubAccounts));
        return await apiRequest('/files', {
            method: 'POST',
            body: form,
        });
    },

    download: async (id) => {
        return await apiRequest(`/files/${id}/download`, {
            method: 'GET',
            responseType: 'blob',
        });
    },

    delete: async (id) => {
        return await apiRequest(`/files/${id}`, {
            method: 'DELETE',
        });
    },

    updatePermissions: async (id, allowedSubAccounts) => {
        return await apiRequest(`/files/${id}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ allowedSubAccounts }),
        });
    },
};

// 报表API
export const reportsAPI = {
    getAll: async () => {
        return await apiRequest('/reports');
    },

    getById: async (id) => {
        return await apiRequest(`/reports/${id}`);
    },

    create: async (reportData) => {
        return await apiRequest('/reports', {
            method: 'POST',
            body: JSON.stringify(reportData),
        });
    },

    update: async (id, reportData) => {
        return await apiRequest(`/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reportData),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/reports/${id}`, {
            method: 'DELETE',
        });
    },

    copy: async (id) => {
        return await apiRequest(`/reports/${id}/copy`, {
            method: 'POST',
        });
    },

    execute: async (id) => {
        return await apiRequest(`/reports/${id}/execute`, {
            method: 'POST',
        });
    },

    archive: async (id) => {
        return await apiRequest(`/reports/${id}/archive`, {
            method: 'POST',
        });
    },

    unarchive: async (id) => {
        return await apiRequest(`/reports/${id}/unarchive`, {
            method: 'POST',
        });
    },

    updateNote: async (id, note) => {
        return await apiRequest(`/reports/${id}/note`, {
            method: 'PUT',
            body: JSON.stringify({ note }),
        });
    },

    updateRowNote: async (id, rowKey, note) => {
        return await apiRequest(`/reports/${id}/row-note`, {
            method: 'PUT',
            body: JSON.stringify({ rowKey, note }),
        });
    },
};

// 基地API（通过users路由）
export const basesAPI = {
    getAll: async () => {
        return await apiRequest('/users/bases');
    },

    create: async (baseData) => {
        return await apiRequest('/users/bases', {
            method: 'POST',
            body: JSON.stringify(baseData),
        });
    },
};

// 用户权限API
export const permissionsAPI = {
    getUserPermissions: async (userId) => {
        return await apiRequest(`/users/${userId}/permissions`);
    },

    getFormPermissions: async (formId) => {
        return await apiRequest(`/permissions/forms/${formId}`);
    },

    setPermission: async (userId, permissionData) => {
        return await apiRequest(`/users/${userId}/permissions`, {
            method: 'POST',
            body: JSON.stringify(permissionData),
        });
    },

    setFormUserPermission: async (userId, formId, canView, canSubmit) => {
        return await apiRequest(`/permissions/users/${userId}/forms/${formId}`, {
            method: 'POST',
            body: JSON.stringify({ canView, canSubmit }),
        });
    },

    deleteFormUserPermission: async (userId, formId) => {
        return await apiRequest(`/permissions/users/${userId}/forms/${formId}`, {
            method: 'DELETE',
        });
    },

    deletePermission: async (userId, permissionId) => {
        return await apiRequest(`/users/${userId}/permissions/${permissionId}`, {
            method: 'DELETE',
        });
    },
};

// 导出工具函数
export { getToken, setToken, removeToken, API_BASE_URL };


