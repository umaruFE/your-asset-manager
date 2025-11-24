import { useState, useEffect, useCallback } from 'react';
import { formsAPI, assetsAPI, filesAPI, usersAPI, authAPI } from '../utils/api';

// 自定义Hook：使用API替代localStorage
export function useAPI() {
    // 创建getCollectionHook函数（兼容现有代码）
    const getCollectionHook = useCallback((collectionName) => {
        const [data, setData] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        // 加载数据
        useEffect(() => {
            let mounted = true;

            async function loadData() {
                setLoading(true);
                let result = [];
                let error = null;

                try {
                    switch (collectionName) {
                        case 'forms':
                            result = await formsAPI.getAll();
                            break;
                        case 'assets':
                            result = await assetsAPI.getAll();
                            break;
                        case 'files':
                            result = await filesAPI.getAll();
                            break;
                        case 'allAppUsers':
                            // 根据用户角色决定获取哪些用户
                            // 先尝试获取所有用户（超级管理员），如果失败则尝试获取经手人列表
                            try {
                                console.log('[useAPI] 尝试 getAll()...');
                                result = await usersAPI.getAll();
                                console.log('[useAPI] getAll() 成功，获取到', result?.length || 0, '个用户');
                                error = null; // 成功时清除错误
                            } catch (err) {
                                console.log('[useAPI] getAll() 失败，错误:', err.message, '状态:', err.response?.status);
                                // 如果不是超级管理员，尝试获取基地经手人列表
                                // 支持的角色：base_manager（自己基地的经手人）、company_asset、company_finance（所有经手人）
                                try {
                                    console.log('[useAPI] 尝试 getMyBaseHandlers()...');
                                    result = await usersAPI.getMyBaseHandlers();
                                    console.log('[useAPI] getMyBaseHandlers() 成功，获取到', result?.length || 0, '个用户');
                                    error = null; // 成功时清除错误
                                } catch (err2) {
                                    // 如果都失败，返回空数组（不抛出错误，避免阻塞UI）
                                    console.warn('[useAPI] getMyBaseHandlers() 也失败:', {
                                        message: err2.message,
                                        status: err2.response?.status,
                                        response: err2.response,
                                        data: err2.data,
                                        fullError: err2
                                    }, '使用空数组');
                                    result = [];
                                    error = null; // 即使失败也清除错误，因为我们已经处理了（返回空数组）
                                }
                            }
                            break;
                        default:
                            result = [];
                    }
                } catch (err) {
                    // 只有未处理的错误才会到这里
                    error = err.message;
                    result = [];
                }

                if (mounted) {
                    setData(result);
                    setError(error);
                    setLoading(false);
                }
            }

            loadData();

            return () => {
                mounted = false;
            };
        }, [collectionName]);

        // 更新函数
        const update = useCallback(async (updater) => {
            try {
                let newData;
                if (typeof updater === 'function') {
                    newData = updater(data);
                } else {
                    newData = updater;
                }

                // 根据集合类型执行相应的API操作
                switch (collectionName) {
                    case 'forms':
                        // 表单更新需要特殊处理
                        if (Array.isArray(newData)) {
                            // 检查是否是重新加载的数据（通过比较数据结构和内容）
                            // 如果所有表单都有完整的字段信息（fields数组），可能是重新加载的数据
                            const isReload = newData.length > 0 && 
                                newData.every(f => Array.isArray(f.fields));
                            
                            if (isReload) {
                                // 直接更新本地状态（用于重新加载数据，避免重复API调用）
                                setData(newData);
                            } else {
                                // 批量更新表单 - 只更新变化的表单
                                const currentData = data;
                                const formsToUpdate = [];
                                const formsToCreate = [];
                                
                                for (const form of newData) {
                                    if (form.id) {
                                        const existingForm = currentData.find(f => f.id === form.id);
                                        // 只更新有变化的表单
                                        if (!existingForm || existingForm.name !== form.name || existingForm.isActive !== form.isActive) {
                                            formsToUpdate.push(form);
                                        }
                                    } else {
                                        // 创建新表单
                                        formsToCreate.push(form);
                                    }
                                }
                                
                                // 批量更新变化的表单
                                for (const form of formsToUpdate) {
                                    await formsAPI.update(form.id, {
                                        name: form.name,
                                        isActive: form.isActive
                                    });
                                }
                                
                                // 创建新表单
                                for (const form of formsToCreate) {
                                    await formsAPI.create({
                                        name: form.name,
                                        isActive: form.isActive
                                    });
                                }
                                
                                // 如果有更新或创建，重新加载
                                if (formsToUpdate.length > 0 || formsToCreate.length > 0) {
                                    const updatedForms = await formsAPI.getAll();
                                    setData(updatedForms);
                                } else {
                                    // 如果没有实际更新，直接更新本地状态（用于字段更新等）
                                    setData(newData);
                                }
                            }
                        } else if (newData && newData.id) {
                            // 单个表单更新
                            await formsAPI.update(newData.id, newData);
                            const updated = await formsAPI.getAll();
                            setData(updated);
                        } else {
                            // 直接更新本地状态（用于字段更新等不需要API调用的场景）
                            setData(newData);
                        }
                        break;
                    case 'assets':
                        if (Array.isArray(newData)) {
                            // 如果是数组，说明是批量操作
                            // 检查是否有新项需要创建
                            const newItems = newData.filter(item => !data.find(d => d.id === item.id));
                            for (const item of newItems) {
                                if (item.formId && item.batchData) {
                                    await assetsAPI.create(item);
                                }
                            }
                            // 重新加载
                            const updated = await assetsAPI.getAll();
                            setData(updated);
                        } else if (newData && newData.id) {
                            // 创建新资产
                            await assetsAPI.create(newData);
                            // 重新加载
                            const updated = await assetsAPI.getAll();
                            setData(updated);
                        }
                        break;
                    case 'files':
                        if (Array.isArray(newData)) {
                            const newItems = newData.filter(item => !data.find(d => d.id === item.id));
                            for (const item of newItems) {
                                if (item.fileName && item.url) {
                                    await filesAPI.create(item);
                                }
                            }
                            const updated = await filesAPI.getAll();
                            setData(updated);
                        } else if (newData && newData.id) {
                            // 创建新文件
                            await filesAPI.create(newData);
                            // 重新加载
                            const updated = await filesAPI.getAll();
                            setData(updated);
                        }
                        break;
                    default:
                        setData(newData);
                }
            } catch (err) {
                setError(err.message);
                throw err;
            }
        }, [collectionName, data]);

        return {
            data,
            loading,
            error,
            update
        };
    }, []);

    return {
        getCollectionHook
    };
}
