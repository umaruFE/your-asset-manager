import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Save, Play, X, HelpCircle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Modal, useModal, InputGroup, LoadingScreen } from '../utils/UI';
import { reportsAPI } from '../utils/api';

export default function ReportBuilder({ user, getCollectionHook, editingReport, onClose }) {
    const { data: forms, loading: formsLoading } = getCollectionHook('forms');
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
    const saveModal = useModal();

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

            // 回填选中的字段
            if (config.selectedFields && Array.isArray(config.selectedFields)) {
                setSelectedFields(config.selectedFields);
            }

            // 回填聚合函数（确保每个都有 id）
            if (config.aggregations && Array.isArray(config.aggregations)) {
                const aggsWithIds = config.aggregations.map((agg, index) => ({
                    formId: agg.formId,
                    fieldId: agg.fieldId,
                    fieldName: agg.fieldName,
                    function: agg.function || 'SUM',
                    show: agg.show !== false, // 默认显示
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
                            // 检查是否是运算符
                            if (['+', '-', '*', '/'].includes(token)) {
                                return { type: 'operator', value: token };
                            }
                            // 检查是否是数字
                            if (!isNaN(token) && token !== '') {
                                return { type: 'number', value: token };
                            }
                            // 否则是字段ID
                            const field = allFields.find(f => f.fieldId === token);
                            return { type: 'field', fieldId: token, fieldName: field?.fieldName || token };
                        });
                    } else if (parts.length > 0) {
                        // 如果parts已存在，需要更新fieldName（可能存储的是字段ID而不是字段名称）
                        parts = parts.map(part => {
                            if (part.type === 'field' && part.fieldId) {
                                // 查找字段名称
                                const field = allFields.find(f => f.fieldId === part.fieldId);
                                // 如果fieldName是字段ID（说明存储时出错了），更新为正确的字段名称
                                if (field && (part.fieldName === part.fieldId || !part.fieldName)) {
                                    return { ...part, fieldName: field.fieldName };
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
                        id: calc.id || `calc_${Date.now()}_${index}`
                    };
                });
                setCalculations(calcsWithIds);
            }

            if (config.sortOrders && Array.isArray(config.sortOrders)) {
                const normalizedSorts = config.sortOrders.map((order, index) => ({
                    id: order.id || `sort_${Date.now()}_${index}`,
                    field: order.field || '',
                    direction: order.direction || 'asc'
                }));
                setSortOrders(normalizedSorts);
            } else {
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

    // 获取所有可排序的列（包括未选中的字段）
    const availableSortColumns = useMemo(() => {
        const columns = [];

        // 1. 所有可用字段
        availableFields.forEach(field => {
            columns.push({
                key: field.fieldName || field.fieldId,
                label: field.fieldName || field.fieldId
            });
        });

        // 2. 所有聚合函数
        aggregations.forEach(agg => {
            const label = `${agg.fieldName || agg.fieldId || '字段'}_${agg.function || 'SUM'}`;
            columns.push({
                key: label,
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
    }, [availableFields, aggregations, calculations]);

    useEffect(() => {
        setSortOrders(prev => prev.filter(order => availableSortColumns.some(col => col.key === order.field)));
    }, [availableSortColumns]);

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
                return prev.filter(f => !(f.formId === field.formId && f.fieldId === field.fieldId));
            } else {
                return [...prev, field];
            }
        });
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
            show: true
        }]);
    };

    // 更新聚合函数
    const updateAggregation = (id, updates) => {
        setAggregations(prev => prev.map(agg =>
            agg.id === id ? { ...agg, ...updates } : agg
        ));
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
            parts: [] // 存储表达式部分：[{type: 'field', fieldId: 'xxx'}, {type: 'operator', value: '+'}, ...]
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

        setIsSaving(true);
        try {
            const config = {
                selectedForms,
                selectedFields,
                aggregations,
                calculations,
                filters: {},
                sortOrders: sortOrders.map(({ field, direction, id }) => ({
                    id,
                    field,
                    direction
                }))
            };

            if (editingReport && editingReport.id) {
                // 更新现有报表
                await reportsAPI.update(editingReport.id, {
                    name: reportName,
                    description: reportDescription,
                    config
                });
            } else {
                // 创建新报表
                await reportsAPI.create({
                    name: reportName,
                    description: reportDescription,
                    config
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

        setIsExecuting(true);
        try {
            const config = {
                selectedForms,
                selectedFields,
                aggregations,
                calculations,
                filters: {},
                sortOrders: sortOrders.map(({ field, direction, id }) => ({
                    id,
                    field,
                    direction
                }))
            };

            let reportId;
            // 如果正在编辑报表，使用现有报表ID；否则创建临时报表
            if (editingReport && editingReport.id) {
                // 先更新报表配置
                await reportsAPI.update(editingReport.id, {
                    name: reportName || editingReport.name,
                    description: reportDescription || editingReport.description,
                    config
                });
                reportId = editingReport.id;
            } else {
                // 创建临时报表
                const tempReport = await reportsAPI.create({
                    name: `临时报表_${Date.now()}`,
                    description: '临时执行报表',
                    config
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
                    {aggregations.map(agg => (
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
                    ))}
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
                                    {calc.expression && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            表达式: {calc.expression}
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
                                    {Object.keys(executionResult.data[0] || {}).map(key => (
                                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {executionResult.data.map((row, idx) => (
                                    <tr key={idx}>
                                        {Object.values(row).map((value, i) => (
                                            <td key={i} className="px-4 py-2 text-sm text-gray-900">
                                                {value}
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
