import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Play, X, HelpCircle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Modal, useModal, InputGroup, LoadingScreen } from '../utils/UI';
import { reportsAPI } from '../utils/api';

const DEFAULT_ACCESS_ROLES = ['base_manager', 'company_asset', 'company_finance'];

export default function ReportBuilder({ user, getCollectionHook, editingReport, onClose }) {
    const { data: forms, loading: formsLoading } = getCollectionHook('forms');
    const { data: allUsers } = getCollectionHook('allAppUsers');
    const [reportName, setReportName] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [selectedForms, setSelectedForms] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);
    const [aggregations, setAggregations] = useState([]);
    const [calculations, setCalculations] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [sortOrders, setSortOrders] = useState([]);
    const [pendingSortOrders, setPendingSortOrders] = useState(null); // 临时保存待加载的排序设置
    const [accessRoles, setAccessRoles] = useState(DEFAULT_ACCESS_ROLES);
    // For drag and drop
    const [draggedFieldId, setDraggedFieldId] = useState(null);
    const [dragOverFieldId, setDragOverFieldId] = useState(null);
    const [accessUsers, setAccessUsers] = useState([]);
    const saveModal = useModal();

    const normalizeAccessRules = (rules) => {
        const defaultRules = {
            roles: DEFAULT_ACCESS_ROLES,
            users: []
        };

        if (!rules) return defaultRules;

        let parsed = rules;
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
            } catch (error) {
                console.warn('[ReportBuilder] Failed to parse accessRules string', error);
                return defaultRules;
            }
        }

        if (typeof parsed !== 'object') return defaultRules;

        const roles = Array.isArray(parsed.roles)
            ? Array.from(new Set(parsed.roles.filter(r => r && r !== 'base_handler')))
            : [];
        const users = Array.isArray(parsed.users)
            ? Array.from(new Set(parsed.users.filter(u => !!u)))
            : [];

        // 只有在 roles 和 users 都为空时，才使用默认值（用于兼容旧数据）
        // 如果用户明确选择了空的 roles 但选择了 users，应该保留空的 roles
        if (roles.length === 0 && users.length === 0) {
            return defaultRules;
        }

        return {
            roles,
            users
        };
    };

    // 如果是编辑模式，加载报表数据
    useEffect(() => {
        if (editingReport) {
            loadReportData(editingReport);
        } else {
            // 如果不是编辑模式，重置所有状态
            setReportName('');
            setReportDescription('');
            setSelectedForms([]);
            setSelectedFields([]);
            setAggregations([]);
            setCalculations([]);
            setSortOrders([]);
            setExecutionResult(null);
            setAccessRoles(DEFAULT_ACCESS_ROLES);
            setAccessUsers([]);
        }
    }, [editingReport]);

    // 加载报表数据并回填表单
    const loadReportData = async (report) => {
        try {
            setLoadingReport(true);
            // 如果 report 已经有完整数据（包括 config），直接使用
            // 否则从 API 获取
            let reportData = report;
            if (!reportData.config && reportData.id) {
                reportData = await reportsAPI.getById(reportData.id);
            }

            // 设置基本信息
            setReportName(reportData.name || '');
            setReportDescription(reportData.description || '');

            // 解析 config（可能是 JSONB 对象或字符串）
            // 后端已经应用了 toCamelCaseObject，所以使用 camelCase 格式
            let config = reportData.config || {};
            if (typeof config === 'string') {
                try {
                    config = JSON.parse(config);
                } catch (e) {
                    console.error('Failed to parse config:', e);
                    config = {};
                }
            }

            // 回填选中的表单
            if (config.selectedForms && Array.isArray(config.selectedForms)) {
                setSelectedForms(config.selectedForms);
            }

            // 回填权限
            const normalizedRules = normalizeAccessRules(reportData.accessRules || reportData.access_rules);
            setAccessRoles(normalizedRules.roles);
            setAccessUsers(normalizedRules.users);

            // 回填选中的字段（确保有 order 字段和 decimalPlaces 字段）
            if (config.selectedFields && Array.isArray(config.selectedFields)) {
                const fieldsWithOrder = config.selectedFields.map((field, idx) => ({
                    ...field,
                    order: field.order !== undefined ? field.order : idx,
                    // 如果字段是数字类型但没有设置 decimalPlaces，设置默认值2
                    decimalPlaces: field.decimalPlaces !== undefined 
                        ? field.decimalPlaces 
                        : (field.fieldType === 'number' || field.fieldType === 'formula' ? 2 : undefined)
                })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setSelectedFields(fieldsWithOrder);
            }

            // 回填聚合函数（确保每个都有 id）
            if (config.aggregations && Array.isArray(config.aggregations)) {
                const aggsWithIds = config.aggregations.map((agg, index) => ({
                    formId: agg.formId,
                    fieldId: agg.fieldId,
                    fieldName: agg.fieldName,
                    function: agg.function || 'SUM',
                    show: agg.show !== false, // 默认显示
                    decimalPlaces: agg.decimalPlaces !== undefined ? agg.decimalPlaces : 2, // 加载小数位数设置，默认2位
                    id: agg.id || `agg_${Date.now()}_${index}`
                }));
                setAggregations(aggsWithIds);
            }

            // 回填计算字段（确保每个都有 id）
            if (config.calculations && Array.isArray(config.calculations)) {
                // 获取所有可用字段（用于解析表达式）
                const allFields = [];
                selectedForms.forEach(formId => {
                    const form = forms.find(f => f.id === formId);
                    if (form && form.fields) {
                        form.fields
                            .filter(field => field.active)
                            .forEach(field => {
                                allFields.push({
                                    formId: form.id,
                                    formName: form.name,
                                    fieldId: field.id,
                                    fieldName: field.name,
                                    fieldType: field.type
                                });
                            });
                    }
                });

                const calcsWithIds = config.calculations.map((calc, index) => {
                    // 如果已有表达式但没有parts，尝试解析表达式构建parts
                    let parts = calc.parts || [];
                    if (!parts.length && calc.expression) {
                        // 简单解析：按空格分割，识别字段ID和运算符
                        const tokens = calc.expression.split(/\s+/);
                        parts = tokens.map(token => {
                            // 检查是否是运算符（包括括号）
                            if (['+', '-', '*', '/', '(', ')'].includes(token)) {
                                return { type: 'operator', value: token };
                            }
                            // 检查是否是数字
                            if (!isNaN(token) && token !== '') {
                                return { type: 'number', value: token };
                            }
                            // 否则是字段ID，查找对应的字段名
                            const field = allFields.find(f => f.fieldId === token);
                            return { 
                                type: 'field', 
                                fieldId: token, 
                                fieldName: field?.fieldName || token 
                            };
                        });
                    } else if (parts.length > 0) {
                        // 如果parts已存在，需要更新fieldName（可能存储的是字段ID而不是字段名称）
                        parts = parts.map(part => {
                            if (part.type === 'field' && part.fieldId) {
                                // 查找字段名称
                                const field = allFields.find(f => f.fieldId === part.fieldId);
                                // 如果fieldName不存在、是字段ID、或者是空字符串，更新为正确的字段名称
                                if (field) {
                                    if (!part.fieldName || part.fieldName === part.fieldId || part.fieldName.trim() === '') {
                                        return { ...part, fieldName: field.fieldName };
                                    }
                                }
                            }
                            return part;
                        });
                    }
                    // 确保 name 字段被正确读取
                    // 支持多种可能的字段名格式（name, fieldName, calcName等）
                    const calcName = calc.name || calc.fieldName || calc.calcName || 
                                    (calc.name === '' ? '' : `计算字段${index + 1}`);
                    
                    console.log('[ReportBuilder] Loading calculation field:', {
                        index,
                        originalCalc: calc,
                        extractedName: calcName,
                        hasName: !!calc.name,
                        nameValue: calc.name,
                        updatedParts: parts
                    });
                    
                    return {
                        name: calcName,
                        expression: calc.expression || '',
                        parts: parts,
                        decimalPlaces: calc.decimalPlaces !== undefined ? calc.decimalPlaces : 2, // 加载小数位数设置，默认2位
                        id: calc.id || `calc_${Date.now()}_${index}`
                    };
                });
                setCalculations(calcsWithIds);
            }

            // 保存排序设置到临时状态，等待 availableSortColumns 准备好后再设置
            if (config.sortOrders && Array.isArray(config.sortOrders)) {
                const normalizedSorts = config.sortOrders.map((order, index) => ({
                    id: order.id || `sort_${Date.now()}_${index}`,
                    field: order.field || '',
                    direction: order.direction || 'asc'
                }));
                
                console.log('[ReportBuilder] Loading sort orders (pending):', normalizedSorts);
                setPendingSortOrders(normalizedSorts);
            } else {
                setPendingSortOrders(null);
                setSortOrders([]);
            }
        } catch (error) {
            console.error('Failed to load report data:', error);
            alert('加载报表数据失败: ' + error.message);
        } finally {
            setLoadingReport(false);
        }
    };

    // 获取所有可用字段（从选中的表单中）
    const availableFields = useMemo(() => {
        const fields = [];
        selectedForms.forEach(formId => {
            const form = forms.find(f => f.id === formId);
            if (form && form.fields) {
                form.fields
                    .filter(field => field.active)
                    .forEach(field => {
                        fields.push({
                            formId: form.id,
                            formName: form.name,
                            fieldId: field.id,
                            fieldName: field.name,
                            fieldType: field.type
                        });
                    });
            }
        });
        return fields;
    }, [selectedForms, forms]);

    const availableResultColumns = useMemo(() => {
        const columns = [];
        selectedFields.forEach(field => {
            const label = field.fieldName || field.fieldId || '字段';
            columns.push({
                key: label,
                label
            });
        });
        aggregations.forEach(agg => {
            const label = `${agg.fieldName || agg.fieldId || '字段'}_${agg.function || 'SUM'}`;
            columns.push({
                key: label,
                label
            });
        });
        calculations.forEach(calc => {
            if (calc.name) {
                columns.push({
                    key: calc.name,
                    label: calc.name
                });
            }
        });
        return columns;
    }, [selectedFields, aggregations, calculations]);

    // 获取聚合函数后缀的中文映射（放在所有使用它的 useMemo 之前，避免初始化顺序问题）
    const getAggregationSuffix = (func) => {
        const funcUpper = func?.toUpperCase();
        const suffixMap = {
            'SUM': '求和',
            'AVG': '平均值',
            'COUNT': '计数',
            'MAX': '最大值',
            'MIN': '最小值'
        };
        return suffixMap[funcUpper] || funcUpper || '';
    };

    // 聚合字段名归一化：去掉括号中的单位等，例如 "应核减价值（元）" -> "应核减价值"
    const normalizeAggFieldName = (name) => {
        if (!name) return '';
        return String(name).replace(/[（(][^）)]*[）)]/g, '');
    };

    // 预览执行结果时，基于聚合配置的 show 字段隐藏对应聚合列
    const previewVisibleKeys = useMemo(() => {
        if (!executionResult?.data || executionResult.data.length === 0) return [];
        const allKeys = Object.keys(executionResult.data[0] || {});
        if (!aggregations || aggregations.length === 0) return allKeys;

        const hiddenAggs = aggregations
            .filter(a => {
                if (!a) return false;
                const show = a.show;
                // 兼容旧数据：show 可能是 false、'false'、0、'0'
                return show === false || show === 'false' || show === 0 || show === '0';
            })
            .map(a => {
                const rawName = a.fieldName || a.fieldId || '';
                return {
                    fieldName: rawName,
                    normName: normalizeAggFieldName(rawName),
                    suffix: getAggregationSuffix(a.function || 'SUM')
                };
            });

        if (hiddenAggs.length === 0) return allKeys;

        const hiddenSet = new Set();

        hiddenAggs.forEach(agg => {
            const targetSuffix = `_${agg.suffix}`;
            allKeys.forEach(key => {
                // 1) 正常情况：列名以 _suffix 结尾（例如 "_求和"、"_平均值"）
                if (key.endsWith(targetSuffix)) {
                    const base = key.slice(0, key.length - targetSuffix.length); // 形如 "表单名_字段名（元）"
                    const normBase = normalizeAggFieldName(base);
                    if (normBase.endsWith(agg.normName)) {
                        hiddenSet.add(key);
                        return;
                    }
                }

                // 2) 兼容特殊情况：列名里没有后缀，但以 "_字段名" 结尾
                const lastUnderscore = key.lastIndexOf('_');
                if (lastUnderscore !== -1) {
                    const tail = key.slice(lastUnderscore + 1); // 字段名部分
                    const normTail = normalizeAggFieldName(tail);
                    if (normTail === agg.normName) {
                        hiddenSet.add(key);
                    }
                }
            });

            // 兜底：旧格式（无表单名前缀）
            hiddenSet.add(`${agg.fieldName}_${agg.suffix}`);
            hiddenSet.add(`${agg.normName}_${agg.suffix}`);
        });

        return allKeys.filter(k => !hiddenSet.has(k));
    }, [executionResult, aggregations]);

    // 获取所有可排序的列（包括未选中的字段）
    const availableSortColumns = useMemo(() => {
        const columns = [];

        // 1. 所有可用字段（用于分组的字段）
        availableFields.forEach(field => {
            columns.push({
                key: field.fieldName || field.fieldId,
                label: field.fieldName || field.fieldId
            });
        });

        // 2. 所有聚合函数（使用与后端一致的格式：表单名_字段名_后缀）
        aggregations.forEach(agg => {
            const form = forms.find(f => f.id === agg.formId);
            const formName = form?.name || '';
            const fieldName = agg.fieldName || agg.fieldId || '字段';
            const suffix = getAggregationSuffix(agg.function || 'SUM');
            // 使用与后端一致的格式
            const key = `${formName}_${fieldName}_${suffix}`;
            const label = `${formName}.${fieldName} (${suffix})`;
            columns.push({
                key,
                label
            });
        });

        // 3. 所有计算字段
        calculations.forEach(calc => {
            if (calc.name) {
                columns.push({
                    key: calc.name,
                    label: calc.name
                });
            }
        });

        // 去重 (以防万一)
        const uniqueColumns = [];
        const seenKeys = new Set();
        columns.forEach(col => {
            if (!seenKeys.has(col.key)) {
                seenKeys.add(col.key);
                uniqueColumns.push(col);
            }
        });

        return uniqueColumns;
    }, [availableFields, aggregations, calculations, forms]);

    useEffect(() => {
        // 如果有待加载的排序设置，且 availableSortColumns 已准备好，则恢复排序设置
        if (pendingSortOrders && availableSortColumns.length > 0 && forms.length > 0) {
            console.log('[ReportBuilder] Restoring pending sort orders:', {
                pendingSortOrders,
                availableColumns: availableSortColumns.map(col => col.key),
                formsCount: forms.length
            });
            
            const matchedSorts = pendingSortOrders.map(order => {
                if (!order.field) return null;
                
                // 1. 直接匹配
                const exactMatch = availableSortColumns.find(col => col.key === order.field);
                if (exactMatch) {
                    return order;
                }
                
                // 2. 尝试匹配旧格式（字段名_后缀）转换为新格式（表单名_字段名_后缀）
                const oldFormatMatch = aggregations.find(agg => {
                    const fieldName = agg.fieldName || agg.fieldId;
                    const suffix = getAggregationSuffix(agg.function || 'SUM');
                    const oldKey = `${fieldName}_${suffix}`;
                    return oldKey === order.field;
                });
                
                if (oldFormatMatch) {
                    const form = forms.find(f => f.id === oldFormatMatch.formId);
                    const formName = form?.name || '';
                    const fieldName = oldFormatMatch.fieldName || oldFormatMatch.fieldId;
                    const suffix = getAggregationSuffix(oldFormatMatch.function || 'SUM');
                    const newKey = `${formName}_${fieldName}_${suffix}`;
                    
                    const newFormatMatch = availableSortColumns.find(col => col.key === newKey);
                    if (newFormatMatch) {
                        console.log('[ReportBuilder] Converting sort field from old format to new:', {
                            old: order.field,
                            new: newKey
                        });
                        return { ...order, field: newKey };
                    }
                }
                
                // 3. 如果匹配不到，返回 null（将被过滤掉）
                console.warn('[ReportBuilder] Sort field not found in available columns:', order.field);
                return null;
            }).filter(order => order !== null);
            
            console.log('[ReportBuilder] Matched sort orders:', matchedSorts);
            setSortOrders(matchedSorts);
            setPendingSortOrders(null); // 清除待加载状态
            return;
        }
        
        // 当 availableSortColumns 准备好后，匹配和转换排序设置
        // 如果 availableSortColumns 为空，但 selectedForms 有值，说明数据还在加载中，不进行过滤
        if (availableSortColumns.length === 0) {
            // 如果 selectedForms 有值但 availableSortColumns 为空，说明 forms 数据可能还在加载
            // 此时不应该过滤排序设置，等待数据准备好
            if (selectedForms.length > 0) {
                console.log('[ReportBuilder] Forms data may still be loading, skipping sort order matching');
                return;
            }
            // 如果 selectedForms 也为空，说明确实没有数据，可以清空排序设置
            return;
        }
        
        setSortOrders(prev => {
            if (prev.length === 0) {
                console.log('[ReportBuilder] No sort orders to match');
                return prev;
            }
            
            console.log('[ReportBuilder] Matching sort orders:', {
                prevSortOrders: prev,
                availableColumns: availableSortColumns.map(col => col.key),
                selectedFormsCount: selectedForms.length,
                formsCount: forms.length
            });
            
            const updated = prev.map(order => {
                if (!order.field) return order;
                
                // 1. 直接匹配
                const exactMatch = availableSortColumns.find(col => col.key === order.field);
                if (exactMatch) {
                    console.log('[ReportBuilder] Exact match found for sort field:', order.field);
                    return order;
                }
                
                // 2. 尝试匹配旧格式（字段名_后缀）转换为新格式（表单名_字段名_后缀）
                // 例如：从 "数量（尾）_求和" 转换为 "期初投入登记表_数量（尾）_求和"
                const oldFormatMatch = aggregations.find(agg => {
                    const fieldName = agg.fieldName || agg.fieldId;
                    const suffix = getAggregationSuffix(agg.function || 'SUM');
                    const oldKey = `${fieldName}_${suffix}`;
                    return oldKey === order.field;
                });
                
                if (oldFormatMatch) {
                    const form = forms.find(f => f.id === oldFormatMatch.formId);
                    const formName = form?.name || '';
                    const fieldName = oldFormatMatch.fieldName || oldFormatMatch.fieldId;
                    const suffix = getAggregationSuffix(oldFormatMatch.function || 'SUM');
                    const newKey = `${formName}_${fieldName}_${suffix}`;
                    
                    // 检查新格式的key是否存在
                    const newFormatMatch = availableSortColumns.find(col => col.key === newKey);
                    if (newFormatMatch) {
                        console.log('[ReportBuilder] Converting sort field from old format to new:', {
                            old: order.field,
                            new: newKey
                        });
                        return { ...order, field: newKey };
                    }
                }
                
                // 3. 如果都匹配不到，保持原值（可能在后续加载时能匹配到）
                console.log('[ReportBuilder] No match found for sort field:', order.field);
                return order;
            });
            
            // 只过滤掉确实无法匹配的排序设置（字段为空且无法转换）
            const filtered = updated.filter(order => {
                if (!order.field) return false;
                // 检查是否能匹配到
                const canMatch = availableSortColumns.some(col => col.key === order.field);
                if (!canMatch) {
                    console.log('[ReportBuilder] Filtering out unmatched sort field:', order.field);
                }
                return canMatch;
            });
            
            console.log('[ReportBuilder] Final sort orders after matching:', filtered);
            return filtered;
        });
    }, [availableSortColumns, aggregations, forms, selectedForms, pendingSortOrders]);

    // 当availableFields变化时，更新所有计算字段的fieldName
    useEffect(() => {
        if (availableFields.length > 0 && calculations.length > 0) {
            setCalculations(prev => prev.map(calc => {
                if (calc.parts && calc.parts.length > 0) {
                    const updatedParts = calc.parts.map(part => {
                        if (part.type === 'field' && part.fieldId) {
                            // 如果fieldName不存在或者是字段ID，尝试从availableFields中查找
                            if (!part.fieldName || part.fieldName === part.fieldId) {
                                const field = availableFields.find(f => f.fieldId === part.fieldId);
                                if (field && field.fieldName) {
                                    return { ...part, fieldName: field.fieldName };
                                }
                            }
                        }
                        return part;
                    });
                    // 只有当parts有变化时才更新
                    const hasChanges = updatedParts.some((part, idx) => {
                        const originalPart = calc.parts[idx];
                        return part.type === 'field' && originalPart.type === 'field' && 
                               part.fieldName !== originalPart.fieldName;
                    });
                    if (hasChanges) {
                        return { ...calc, parts: updatedParts };
                    }
                }
                return calc;
            }));
        }
    }, [availableFields]);

    // 配置步骤完成状态
    const stepStatus = useMemo(() => {
        return {
            step1: selectedForms.length > 0,
            step2: selectedFields.length > 0 || aggregations.length > 0 || calculations.length > 0,
            step3: aggregations.length > 0 || calculations.length > 0,
            step4: calculations.length > 0,
            step5: sortOrders.length > 0
        };
    }, [selectedForms, selectedFields, aggregations, calculations, sortOrders]);

    const roleOptions = useMemo(() => ([
        { value: 'base_manager', label: '基地负责人' },
        { value: 'company_asset', label: '公司资产员' },
        { value: 'company_finance', label: '公司财务' },
    ]), []);

    const selectableUsers = useMemo(() => {
        if (!allUsers) return [];
        return allUsers.filter(u => u.role !== 'superadmin' && u.role !== 'base_handler');
    }, [allUsers]);

    // 切换表单选择
    const toggleForm = (formId) => {
        setSelectedForms(prev => {
            if (prev.includes(formId)) {
                // 取消选择时，移除相关字段和聚合
                const form = forms.find(f => f.id === formId);
                const formFieldIds = form?.fields?.map(f => f.id) || [];
                setSelectedFields(prevFields =>
                    prevFields.filter(f => f.formId !== formId)
                );
                setAggregations(prevAggs =>
                    prevAggs.filter(a => a.formId !== formId)
                );
                return prev.filter(id => id !== formId);
            } else {
                return [...prev, formId];
            }
        });
    };

    // 切换字段选择
    const toggleField = (field) => {
        setSelectedFields(prev => {
            const exists = prev.find(f => f.formId === field.formId && f.fieldId === field.fieldId);
            if (exists) {
                return prev.filter(f => !(f.formId === field.formId && f.fieldId === field.fieldId))
                    .map((f, idx) => ({ ...f, order: idx })); // 重新排序
            } else {
                const maxOrder = prev.length > 0 ? Math.max(...prev.map(f => f.order ?? 0)) : -1;
                return [...prev, { 
                    ...field, 
                    order: maxOrder + 1,
                    decimalPlaces: field.fieldType === 'number' || field.fieldType === 'formula' ? 2 : undefined
                }];
            }
        });
    };

    // 更新字段的数字格式
    const updateFieldDecimalPlaces = (formId, fieldId, decimalPlaces) => {
        setSelectedFields(prev => prev.map(f => {
            if (f.formId === formId && f.fieldId === fieldId) {
                let parsed;
                if (decimalPlaces === '') {
                    parsed = undefined;
                } else {
                    const n = parseInt(decimalPlaces, 10);
                    parsed = Number.isNaN(n) ? undefined : n; // 允许 0
                }
                return { ...f, decimalPlaces: parsed };
            }
            return f;
        }));
    };

    // 更新字段顺序
    const updateFieldOrder = (fromIndex, toIndex) => {
        setSelectedFields(prev => {
            const sortedFields = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const [moved] = sortedFields.splice(fromIndex, 1);
            sortedFields.splice(toIndex, 0, moved);
            return sortedFields.map((f, idx) => ({ ...f, order: idx }));
        });
    };

    // Drag and drop handlers for selected fields
    const handleFieldDragStart = (e, fieldKey) => {
        setDraggedFieldId(fieldKey);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleFieldDragOver = (e, fieldKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedFieldId && draggedFieldId !== fieldKey) {
            setDragOverFieldId(fieldKey);
        }
    };

    const handleFieldDragLeave = () => {
        setDragOverFieldId(null);
    };

    const handleFieldDrop = (e, targetFieldKey) => {
        e.preventDefault();
        if (!draggedFieldId || draggedFieldId === targetFieldKey) {
            setDraggedFieldId(null);
            setDragOverFieldId(null);
            return;
        }

        const sortedFields = [...selectedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const draggedIndex = sortedFields.findIndex(f => `${f.formId}_${f.fieldId}` === draggedFieldId);
        const targetIndex = sortedFields.findIndex(f => `${f.formId}_${f.fieldId}` === targetFieldKey);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedFieldId(null);
            setDragOverFieldId(null);
            return;
        }

        updateFieldOrder(draggedIndex, targetIndex);
        setDraggedFieldId(null);
        setDragOverFieldId(null);
    };

    const handleFieldDragEnd = () => {
        setDraggedFieldId(null);
        setDragOverFieldId(null);
    };

    // 添加聚合函数
    const addAggregation = () => {
        if (availableFields.length === 0) {
            alert('请先选择表单和字段');
            return;
        }
        setAggregations(prev => [...prev, {
            id: Date.now().toString(),
            formId: availableFields[0].formId,
            fieldId: availableFields[0].fieldId,
            fieldName: availableFields[0].fieldName,
            function: 'SUM', // SUM, AVG, COUNT, MAX, MIN
            show: true,
            decimalPlaces: 2 // 默认2位小数
        }]);
    };

    // 更新聚合函数
    const updateAggregation = (id, updates) => {
        setAggregations(prev => prev.map(agg =>
            agg.id === id ? { ...agg, ...updates } : agg
        ));
    };

    // 更新聚合函数的数字格式
    const updateAggregationDecimalPlaces = (id, decimalPlaces) => {
        setAggregations(prev => prev.map(agg => {
            if (agg.id === id) {
                let parsed;
                if (decimalPlaces === '') {
                    parsed = undefined;
                } else {
                    const n = parseInt(decimalPlaces, 10);
                    parsed = Number.isNaN(n) ? undefined : n; // 允许 0
                }
                return { ...agg, decimalPlaces: parsed };
            }
            return agg;
        }));
    };

    // 更新计算字段的数字格式
    const updateCalculationDecimalPlaces = (id, decimalPlaces) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === id) {
                let parsed;
                if (decimalPlaces === '') {
                    parsed = undefined;
                } else {
                    const n = parseInt(decimalPlaces, 10);
                    parsed = Number.isNaN(n) ? undefined : n; // 允许 0
                }
                return { ...calc, decimalPlaces: parsed };
            }
            return calc;
        }));
    };

    // 删除聚合函数
    const removeAggregation = (id) => {
        setAggregations(prev => prev.filter(agg => agg.id !== id));
    };

    // 添加计算字段
    const addCalculation = () => {
        setCalculations(prev => [...prev, {
            id: Date.now().toString(),
            name: `计算字段${prev.length + 1}`,
            expression: '',
            parts: [], // 存储表达式部分：[{type: 'field', fieldId: 'xxx'}, {type: 'operator', value: '+'}, ...]
            decimalPlaces: 2 // 默认2位小数
        }]);
    };

    // 添加字段到计算表达式
    const addFieldToCalculation = (calcId, field) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === calcId) {
                const newParts = [...(calc.parts || []), { type: 'field', fieldId: field.fieldId, fieldName: field.fieldName }];
                const expression = buildExpressionFromParts(newParts);
                return { ...calc, parts: newParts, expression };
            }
            return calc;
        }));
    };

    // 添加运算符到计算表达式
    const addOperatorToCalculation = (calcId, operator) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === calcId) {
                const newParts = [...(calc.parts || []), { type: 'operator', value: operator }];
                const expression = buildExpressionFromParts(newParts);
                return { ...calc, parts: newParts, expression };
            }
            return calc;
        }));
    };

    // 从表达式部分构建表达式字符串（使用字段ID）
    // 构建表达式（用于显示，使用字段名）
    const buildExpressionForDisplay = (parts) => {
        return parts.map(part => {
            if (part.type === 'field') {
                // 优先使用字段名
                let fieldName = part.fieldName;
                // 如果字段名不存在或者是字段ID，尝试从availableFields中查找
                if (!fieldName || fieldName === part.fieldId) {
                    const field = availableFields.find(f => f.fieldId === part.fieldId);
                    fieldName = field?.fieldName || part.fieldId;
                }
                return fieldName;
            } else if (part.type === 'operator') {
                return part.value;
            } else if (part.type === 'number') {
                return part.value;
            }
            return '';
        }).join(' ');
    };

    // 构建表达式（用于保存，使用字段ID）
    const buildExpressionFromParts = (parts) => {
        return parts.map(part => {
            if (part.type === 'field') {
                return part.fieldId; // 使用字段ID
            } else if (part.type === 'operator') {
                return part.value;
            } else if (part.type === 'number') {
                return part.value;
            }
            return '';
        }).join(' ');
    };

    // 添加数字到计算表达式
    const addNumberToCalculation = (calcId, number) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === calcId) {
                const newParts = [...(calc.parts || []), { type: 'number', value: number }];
                const expression = buildExpressionFromParts(newParts);
                return { ...calc, parts: newParts, expression };
            }
            return calc;
        }));
    };

    // 删除计算表达式的最后一个部分
    const removeLastPartFromCalculation = (calcId) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === calcId) {
                const newParts = (calc.parts || []).slice(0, -1);
                const expression = buildExpressionFromParts(newParts);
                return { ...calc, parts: newParts, expression };
            }
            return calc;
        }));
    };

    // 清空计算表达式
    const clearCalculationExpression = (calcId) => {
        setCalculations(prev => prev.map(calc => {
            if (calc.id === calcId) {
                return { ...calc, parts: [], expression: '' };
            }
            return calc;
        }));
    };

    // 更新计算字段
    const updateCalculation = (id, updates) => {
        setCalculations(prev => prev.map(calc =>
            calc.id === id ? { ...calc, ...updates } : calc
        ));
    };

    // 删除计算字段
    const removeCalculation = (id) => {
        setCalculations(prev => prev.filter(calc => calc.id !== id));
    };

    const addSortOrder = () => {
        if (sortOrders.length >= 3) return;
        const defaultColumn = availableResultColumns[0]?.key || '';
        setSortOrders(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                field: defaultColumn,
                direction: 'asc'
            }
        ]);
    };

    const updateSortOrder = (id, updates) => {
        setSortOrders(prev => prev.map(order =>
            order.id === id ? { ...order, ...updates } : order
        ));
    };

    const removeSortOrder = (id) => {
        setSortOrders(prev => prev.filter(order => order.id !== id));
    };

    const buildAccessRules = () => {
        // 保存时直接返回用户选择的值，不应用默认值
        return {
            roles: Array.from(new Set(accessRoles.filter(r => r && r !== 'base_handler'))),
            users: Array.from(new Set(accessUsers.filter(u => !!u)))
        };
    };

    // 保存报表
    const handleSave = async () => {
        if (!reportName.trim()) {
            alert('请输入报表名称');
            return;
        }

        if (selectedForms.length === 0) {
            alert('请至少选择一个表单');
            return;
        }

        if (accessRoles.length === 0 && accessUsers.length === 0) {
            alert('请至少选择一个允许查看的角色或用户');
            return;
        }

        setIsSaving(true);
        try {
            // 确保所有计算字段的表达式使用字段ID（用于保存）
            const calculationsForSave = calculations.map(calc => ({
                ...calc,
                expression: calc.parts && calc.parts.length > 0 
                    ? buildExpressionFromParts(calc.parts) 
                    : calc.expression
            }));

            const config = {
                selectedForms,
                selectedFields,
                aggregations,
                calculations: calculationsForSave,
                filters: {},
                sortOrders: sortOrders.map(({ field, direction, id }) => ({
                    id,
                    field,
                    direction
                }))
            };
            const accessRules = buildAccessRules();

            if (editingReport && editingReport.id) {
                // 更新现有报表
                await reportsAPI.update(editingReport.id, {
                    name: reportName,
                    description: reportDescription,
                    config,
                    accessRules
                });
            } else {
                // 创建新报表
                await reportsAPI.create({
                    name: reportName,
                    description: reportDescription,
                    config,
                    accessRules
                });
            }

            saveModal.open({
                title: '保存成功',
                description: editingReport ? '报表已更新' : '报表已保存',
                onConfirm: () => {
                    saveModal.close();
                    onClose();
                }
            });
        } catch (error) {
            alert('保存失败: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 执行报表
    const handleExecute = async () => {
        if (selectedForms.length === 0) {
            alert('请至少选择一个表单');
            return;
        }

        if (accessRoles.length === 0 && accessUsers.length === 0) {
            alert('请至少选择一个允许查看的角色或用户');
            return;
        }

        setIsExecuting(true);
        try {
            // 确保所有计算字段的表达式使用字段ID（用于执行）
            const calculationsForExecute = calculations.map(calc => ({
                ...calc,
                expression: calc.parts && calc.parts.length > 0 
                    ? buildExpressionFromParts(calc.parts) 
                    : calc.expression
            }));

            const config = {
                selectedForms,
                selectedFields,
                aggregations,
                calculations: calculationsForExecute,
                filters: {},
                sortOrders: sortOrders.map(({ field, direction, id }) => ({
                    id,
                    field,
                    direction
                }))
            };
            const accessRules = buildAccessRules();

            let reportId;
            // 如果正在编辑报表，使用现有报表ID；否则创建临时报表
            if (editingReport && editingReport.id) {
                // 先更新报表配置
                await reportsAPI.update(editingReport.id, {
                    name: reportName || editingReport.name,
                    description: reportDescription || editingReport.description,
                    config,
                    accessRules
                });
                reportId = editingReport.id;
            } else {
                // 创建临时报表
                const tempReport = await reportsAPI.create({
                    name: `临时报表_${Date.now()}`,
                    description: '临时执行报表',
                    config,
                    accessRules
                });
                reportId = tempReport.id;
            }

            // 执行报表
            const result = await reportsAPI.execute(reportId);
            setExecutionResult(result);

            // 如果是临时报表，删除它
            if (!editingReport || !editingReport.id) {
                try {
                    await reportsAPI.delete(reportId);
                } catch (deleteError) {
                    console.warn('删除临时报表失败:', deleteError);
                }
            }
        } catch (error) {
            // 尝试解析错误响应
            let errorMessage = error.message || '执行失败';
            let errorSuggestion = '';

            try {
                const errorData = error.response?.data || error.data;
                if (errorData) {
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                    if (errorData.message) {
                        errorMessage += '\n\n' + errorData.message;
                    }
                    if (errorData.suggestion) {
                        errorSuggestion = errorData.suggestion;
                    }
                }
            } catch (e) {
                // 如果解析失败，使用原始错误信息
            }

            const fullMessage = errorSuggestion
                ? `${errorMessage}\n\n${errorSuggestion}`
                : errorMessage;

            alert(fullMessage);
        } finally {
            setIsExecuting(false);
        }
    };

    if (formsLoading || loadingReport) {
        return <LoadingScreen message={loadingReport ? "加载报表数据中..." : "加载表单数据中..."} />;
    }

    return (
        <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editingReport ? '编辑统计报表' : '创建统计报表'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        按照以下步骤配置报表：选择表单 → 选择字段/聚合 → 设置排序（可选）
                    </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    <X className="w-5 h-5 mr-2" /> 关闭
                </Button>
            </div>

            {/* 快速提示卡片 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">配置提示</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li><strong>必选步骤：</strong>至少选择一个表单，并至少选择字段、聚合函数或计算字段中的一项</li>
                            <li><strong>选择字段：</strong>用于在报表中显示原始数据列（如：日期、鱼类品种等）</li>
                            <li><strong>聚合函数：</strong>用于对数据进行汇总统计（如：求和、平均值、计数等）</li>
                            <li><strong>计算字段：</strong>用于创建基于其他字段的计算列（如：结余重量 = 转入重量 - 转出重量）</li>
                            <li><strong>排序设置：</strong>可选，用于控制报表结果的显示顺序</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 基本信息 */}
            <div className="space-y-4">
                <InputGroup label="报表名称">
                    <input
                        type="text"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="例如：月度资产统计报表"
                    />
                </InputGroup>
                <InputGroup label="报表描述（可选）">
                    <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows="2"
                        placeholder="报表说明..."
                    />
                </InputGroup>
            </div>

            {/* 查看权限 */}
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-700">查看权限</h3>
                        <span className="text-xs text-gray-500">配置哪些角色/用户可以查看统计报表</span>
                    </div>
                    <span className="text-xs text-orange-600">基地经手人不可查看</span>
                </div>
                <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                    <p>至少选择一个角色或用户可查看报表，未勾选的用户将看不到该统计。</p>
                </div>
                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">允许查看的角色</div>
                    <div className="grid grid-cols-3 gap-2">
                        {roleOptions.map(role => (
                            <label key={role.value} className="flex items-center space-x-2 p-2 rounded border bg-white hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={accessRoles.includes(role.value)}
                                    onChange={() => {
                                        setAccessRoles(prev => {
                                            if (prev.includes(role.value)) {
                                                return prev.filter(r => r !== role.value);
                                            }
                                            return [...prev, role.value];
                                        });
                                    }}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{role.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700">额外指定的用户（可选）</div>
                        <span className="text-xs text-gray-400">不包含超级管理员和基地经手人</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {selectableUsers?.map(u => {
                            const checked = accessUsers.includes(u.id);
                            return (
                                <label key={u.id} className="flex items-center space-x-2 p-2 rounded border bg-white hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            setAccessUsers(prev => {
                                                if (checked) {
                                                    return prev.filter(id => id !== u.id);
                                                }
                                                return [...prev, u.id];
                                            });
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">{u.name || u.username}</span>
                                </label>
                            );
                        })}
                        {!selectableUsers?.length && (
                            <div className="text-xs text-gray-400 col-span-2">暂无可选用户</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 选择表单 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-700">1. 选择表单</h3>
                        {stepStatus.step1 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" title="步骤1已完成" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-orange-500" title="步骤1未完成" />
                        )}
                    </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                        <HelpCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                            <strong>说明：</strong>选择一个或多个要统计的表单。可以选择多个表单进行跨表单统计。
                            {selectedForms.length === 0 && (
                                <span className="text-orange-600 font-medium ml-2">⚠️ 请至少选择一个表单</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {forms.filter(f => f.isActive).map(form => (
                        <label key={form.id} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={selectedForms.includes(form.id)}
                                onChange={() => toggleForm(form.id)}
                                className="w-4 h-4"
                            />
                            <span>{form.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* 选择字段 */}
            {availableFields.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-700">2. 选择字段（可选）</h3>
                            {stepStatus.step2 ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" title="步骤2已完成" />
                            ) : null}
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                        <div className="flex items-start space-x-2">
                            <HelpCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                                <strong>说明：</strong>选择要在报表中显示的原始数据字段。这些字段会作为报表的列显示。
                                <br />
                                <strong>提示：</strong>如果只需要统计汇总数据，可以不选择字段，只使用聚合函数即可。
                            </div>
                        </div>
                    </div>
                    {/* 已选字段列表（支持拖动排序和数字格式设置） */}
                    {selectedFields.length > 0 && (
                        <div className="mb-4 space-y-2">
                            <div className="text-sm font-medium text-gray-700">已选字段（可拖动排序）：</div>
                            <div className="space-y-2">
                                {[...selectedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((field, idx) => {
                                    const fieldKey = `${field.formId}_${field.fieldId}`;
                                    const isNumeric = field.fieldType === 'number' || field.fieldType === 'formula';
                                    return (
                                        <div
                                            key={fieldKey}
                                            draggable
                                            onDragStart={(e) => handleFieldDragStart(e, fieldKey)}
                                            onDragOver={(e) => handleFieldDragOver(e, fieldKey)}
                                            onDragLeave={handleFieldDragLeave}
                                            onDrop={(e) => handleFieldDrop(e, fieldKey)}
                                            onDragEnd={handleFieldDragEnd}
                                            className={`flex items-center space-x-3 p-3 bg-white border rounded-lg cursor-move ${
                                                draggedFieldId === fieldKey ? 'opacity-50' : ''
                                            } ${
                                                dragOverFieldId === fieldKey ? 'bg-blue-50 border-2 border-blue-300' : ''
                                            }`}
                                        >
                                            <div className="flex-shrink-0 text-gray-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {idx + 1}. {field.fieldName}
                                                    </span>
                                                    <span className="text-xs text-gray-400">({field.formName})</span>
                                                </div>
                                            </div>
                                            {isNumeric && (
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-xs text-gray-600">小数位数:</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        value={field.decimalPlaces ?? ''}
                                                        onChange={(e) => updateFieldDecimalPlaces(field.formId, field.fieldId, e.target.value)}
                                                        className="w-16 px-2 py-1 text-sm border rounded"
                                                        placeholder="2"
                                                    />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => toggleField(field)}
                                                className="text-red-500 hover:text-red-700"
                                                title="移除字段"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* 可用字段选择列表 */}
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableFields.map(field => (
                            <label key={`${field.formId}_${field.fieldId}`} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selectedFields.some(f => f.formId === field.formId && f.fieldId === field.fieldId)}
                                    onChange={() => toggleField(field)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">
                                    <span className="text-gray-500">{field.formName}:</span> {field.fieldName}
                                    {field.fieldType && (
                                        <span className="ml-1 text-xs text-gray-400">({field.fieldType})</span>
                                    )}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* 聚合函数 */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-700">3. 聚合函数（可选）</h3>
                            {aggregations.length > 0 && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" title="已配置聚合函数" />
                            )}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <div className="flex items-start space-x-2">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <strong>聚合函数说明：</strong>
                                    <ul className="mt-1 space-y-1 list-disc list-inside ml-2">
                                        <li><strong>SUM（求和）：</strong>适用于数字字段，计算总和</li>
                                        <li><strong>AVG（平均值）：</strong>适用于数字字段，计算平均值</li>
                                        <li><strong>COUNT（计数）：</strong>适用于所有字段，统计记录数量</li>
                                        <li><strong>MAX（最大值）：</strong>适用于数字字段，找出最大值</li>
                                        <li><strong>MIN（最小值）：</strong>适用于数字字段，找出最小值</li>
                                    </ul>
                                    <p className="mt-2 text-orange-700">
                                        <strong>⚠️ 注意：</strong>SUM、AVG、MAX、MIN 仅适用于数字类型字段，COUNT 适用于所有类型
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={addAggregation} className="ml-4">
                        <Plus className="w-4 h-4 mr-1" /> 添加
                    </Button>
                </div>
                <div className="space-y-2">
                    {aggregations.map(agg => {
                        const isNumericFunction = ['SUM', 'AVG', 'MAX', 'MIN'].includes(agg.function);
                        return (
                            <div key={agg.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                                <select
                                    value={agg.function}
                                    onChange={(e) => updateAggregation(agg.id, { function: e.target.value })}
                                    className="px-2 py-1 border rounded text-sm"
                                >
                                    <option value="SUM">求和 (SUM)</option>
                                    <option value="AVG">平均值 (AVG)</option>
                                    <option value="COUNT">计数 (COUNT)</option>
                                    <option value="MAX">最大值 (MAX)</option>
                                    <option value="MIN">最小值 (MIN)</option>
                                </select>
                                <select
                                    value={`${agg.formId}_${agg.fieldId}`}
                                    onChange={(e) => {
                                        const [formId, fieldId] = e.target.value.split('_');
                                        const field = availableFields.find(f => f.formId === formId && f.fieldId === fieldId);
                                        if (field) {
                                            updateAggregation(agg.id, {
                                                formId: field.formId,
                                                fieldId: field.fieldId,
                                                fieldName: field.fieldName
                                            });
                                        }
                                    }}
                                    className="flex-grow px-2 py-1 border rounded text-sm"
                                >
                                    {availableFields.map(field => (
                                        <option key={`${field.formId}_${field.fieldId}`} value={`${field.formId}_${field.fieldId}`}>
                                            {field.formName}.{field.fieldName}
                                        </option>
                                    ))}
                                </select>
                                {isNumericFunction && (
                                    <div className="flex items-center space-x-1">
                                        <label className="text-xs text-gray-600 whitespace-nowrap">小数位:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={agg.decimalPlaces ?? ''}
                                            onChange={(e) => updateAggregationDecimalPlaces(agg.id, e.target.value)}
                                            className="w-16 px-2 py-1 text-sm border rounded"
                                            placeholder="2"
                                        />
                                    </div>
                                )}
                                <label className="flex items-center text-xs text-gray-600 space-x-1">
                                    <input
                                        type="checkbox"
                                        checked={agg.show !== false}
                                        onChange={(e) => updateAggregation(agg.id, { show: e.target.checked })}
                                    />
                                    <span>显示</span>
                                </label>
                                <Button size="sm" variant="danger" onClick={() => removeAggregation(agg.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 计算字段 */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-700">4. 计算字段（可选）</h3>
                            {calculations.length > 0 && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" title="已配置计算字段" />
                            )}
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                            <div className="flex items-start space-x-2">
                                <HelpCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-purple-800">
                                    <strong>计算字段说明：</strong>用于创建基于其他字段的计算列。
                                    <br />
                                    <strong>使用步骤：</strong>
                                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                                        <li>在下方选择字段下拉框中选择要参与计算的字段</li>
                                        <li>选择运算符（+、-、*、/）</li>
                                        <li>继续添加字段或数字，完成表达式</li>
                                        <li>为计算字段命名（如：结余重量）</li>
                                    </ol>
                                    <strong className="mt-2 block">示例：</strong>如果"转入重量"和"转出重量"都设置了SUM聚合，可以创建"结余重量 = 转入重量 - 转出重量"
                                    <br />
                                    <strong className="text-orange-700">⚠️ 重要提示：</strong>计算字段会自动识别聚合后的字段（如：字段名_SUM），如果字段已设置聚合函数，计算时会自动使用聚合后的值。
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={addCalculation} className="ml-4">
                        <Plus className="w-4 h-4 mr-1" /> 添加
                    </Button>
                </div>
                <div className="space-y-3">
                    {calculations.map(calc => (
                        <div key={calc.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                                <input
                                    type="text"
                                    value={calc.name || ''}
                                    onChange={(e) => updateCalculation(calc.id, { name: e.target.value })}
                                    placeholder="计算字段名称"
                                    className="w-40 px-2 py-1 border rounded text-sm"
                                />
                                <div className="flex items-center space-x-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">小数位:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={calc.decimalPlaces ?? ''}
                                        onChange={(e) => updateCalculationDecimalPlaces(calc.id, e.target.value)}
                                        className="w-16 px-2 py-1 text-sm border rounded"
                                        placeholder="2"
                                    />
                                </div>
                                <Button size="sm" variant="danger" onClick={() => removeCalculation(calc.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* 表达式显示 */}
                            <div className="mb-3 p-2 bg-white border rounded text-sm font-mono min-h-[2rem] flex items-center">
                                {calc.parts && calc.parts.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {calc.parts.map((part, idx) => {
                                            // 如果是字段类型，尝试从availableFields中查找字段名称
                                            let displayText = '';
                                            if (part.type === 'field') {
                                                // 优先使用part.fieldName，如果不存在或等于fieldId，则从availableFields查找
                                                if (part.fieldName && part.fieldName !== part.fieldId) {
                                                    displayText = part.fieldName;
                                                } else {
                                                    const field = availableFields.find(f => f.fieldId === part.fieldId);
                                                    displayText = field?.fieldName || part.fieldId;
                                                }
                                            } else if (part.type === 'operator') {
                                                displayText = part.value;
                                            } else {
                                                displayText = part.value;
                                            }
                                            return (
                                                <span key={idx} className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                                    {displayText}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">表达式为空，请添加字段和运算符</span>
                                )}
                            </div>

                            {/* 构建表达式的控件 */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const field = availableFields.find(f => `${f.formId}_${f.fieldId}` === e.target.value);
                                                if (field) {
                                                    addFieldToCalculation(calc.id, field);
                                                }
                                                e.target.value = ''; // 重置选择
                                            }
                                        }}
                                        className="flex-1 px-2 py-1 border rounded text-sm"
                                        title="选择要参与计算的字段。如果该字段已设置聚合函数，会自动使用聚合后的值。"
                                    >
                                        <option value="">选择字段...</option>
                                        {availableFields.map(field => {
                                            // 检查该字段是否已设置聚合函数
                                            const hasAggregation = aggregations.some(agg => 
                                                agg.formId === field.formId && agg.fieldId === field.fieldId
                                            );
                                            const aggLabel = hasAggregation 
                                                ? aggregations.find(agg => agg.formId === field.formId && agg.fieldId === field.fieldId)?.function || ''
                                                : '';
                                            return (
                                                <option key={`${field.formId}_${field.fieldId}`} value={`${field.formId}_${field.fieldId}`}>
                                                    {field.formName}.{field.fieldName}
                                                    {hasAggregation && ` (已聚合: ${aggLabel})`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addOperatorToCalculation(calc.id, e.target.value);
                                                e.target.value = ''; // 重置选择
                                            }
                                        }}
                                        className="px-2 py-1 border rounded text-sm"
                                    >
                                        <option value="">运算符...</option>
                                        <option value="+">+ (加)</option>
                                        <option value="-">- (减)</option>
                                        <option value="*">* (乘)</option>
                                        <option value="/">/ (除)</option>
                                        <option value="(">( (左括号)</option>
                                        <option value=")">) (右括号)</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="数字"
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.target.value) {
                                                addNumberToCalculation(calc.id, e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeLastPartFromCalculation(calc.id)}
                                        disabled={!calc.parts || calc.parts.length === 0}
                                    >
                                        删除最后一项
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => clearCalculationExpression(calc.id)}
                                        disabled={!calc.parts || calc.parts.length === 0}
                                    >
                                        清空表达式
                                    </Button>
                                    {calc.parts && calc.parts.length > 0 && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            表达式: {buildExpressionForDisplay(calc.parts)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 排序设置 */}
            {availableResultColumns.length > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-700">5. 排序设置（可选）</h3>
                            {stepStatus.step5 && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" title="已配置排序" />
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={addSortOrder}
                            disabled={sortOrders.length >= 3 || availableSortColumns.length === 0}
                        >
                            <Plus className="w-4 h-4 mr-1" /> 添加排序
                        </Button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                        <div className="flex items-start space-x-2">
                            <HelpCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                                <strong>说明：</strong>设置报表结果的排序方式。可以设置多个排序条件，按优先级依次排序。最多可设置3个排序条件。
                            </div>
                        </div>
                    </div>
                    {sortOrders.length === 0 ? (
                        <p className="text-sm text-gray-500">尚未设置排序。最多可配置三个排序优先级。</p>
                    ) : (
                        <div className="space-y-3">
                            {sortOrders.map((order, index) => (
                                <div key={order.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-600">第 {index + 1} 排序</span>
                                    <select
                                        value={order.field}
                                        onChange={(e) => updateSortOrder(order.id, { field: e.target.value })}
                                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                                    >
                                        {availableSortColumns.map(column => (
                                            <option key={column.key} value={column.key}>
                                                {column.label}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={order.direction}
                                        onChange={(e) => updateSortOrder(order.id, { direction: e.target.value })}
                                        className="px-3 py-2 border rounded-md text-sm"
                                    >
                                        <option value="asc">升序</option>
                                        <option value="desc">降序</option>
                                    </select>
                                    <Button size="sm" variant="danger" onClick={() => removeSortOrder(order.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 配置状态提示 */}
            {!stepStatus.step1 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-orange-900 mb-1">配置未完成</h4>
                            <p className="text-sm text-orange-800">
                                请至少完成以下步骤：选择一个表单，并至少选择字段、聚合函数或计算字段中的一项。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {stepStatus.step1 && !stepStatus.step2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-900 mb-1">配置未完成</h4>
                            <p className="text-sm text-yellow-800">
                                请至少选择字段、聚合函数或计算字段中的一项，才能生成报表。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {stepStatus.step1 && stepStatus.step2 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-green-900 mb-1">配置已完成</h4>
                            <p className="text-sm text-green-800">
                                基本配置已完成，可以点击"预览执行"查看报表结果，或直接"保存报表"。
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                    variant="outline" 
                    onClick={handleExecute} 
                    disabled={isExecuting || !stepStatus.step1 || !stepStatus.step2}
                    title={!stepStatus.step1 || !stepStatus.step2 ? '请先完成基本配置' : '预览报表执行结果'}
                >
                    <Play className="w-4 h-4 mr-2" />
                    {isExecuting ? '执行中...' : '预览执行'}
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={isSaving || !stepStatus.step1 || !stepStatus.step2}
                    title={!stepStatus.step1 || !stepStatus.step2 ? '请先完成基本配置' : '保存报表配置'}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? '保存中...' : '保存报表'}
                </Button>
            </div>

            {/* 执行结果 */}
            {executionResult && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold mb-2">执行结果</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    {previewVisibleKeys.map(key => (
                                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {executionResult.data.map((row, idx) => (
                                    <tr key={idx}>
                                        {previewVisibleKeys.map(key => (
                                            <td key={key} className="px-4 py-2 text-sm text-gray-900">
                                                {row[key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 保存成功模态框 */}
            {saveModal.isOpen && (
                <Modal isOpen={saveModal.isOpen} onClose={saveModal.close} title={saveModal.props.title}>
                    <p className="text-gray-600">{saveModal.props.description}</p>
                    <div className="mt-6 flex justify-end">
                        <Button variant="primary" onClick={saveModal.props.onConfirm}>确定</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
