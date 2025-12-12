import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Play, Edit, FileText, ArrowUp, ArrowDown, Archive, Copy } from 'lucide-react';
import { Button, Modal, useModal, LoadingScreen } from '../utils/UI';
import { reportsAPI } from '../utils/api';
import ReportBuilder from './ReportBuilder';

export default function ReportsPanel({ user, getCollectionHook }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [executingReport, setExecutingReport] = useState(null);
    const [executionResult, setExecutionResult] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [hiddenColumns, setHiddenColumns] = useState([]); // 根据聚合函数 show 控制显示
    const [baseRows, setBaseRows] = useState([]); // 原始返回行
    const [groupKeys, setGroupKeys] = useState([]); // 当前分组字段（显示用）
    const [groupedRows, setGroupedRows] = useState(null); // 重分组后的行
    const [editingRowKey, setEditingRowKey] = useState(null); // 正在编辑的行备注key
    const [rowNoteText, setRowNoteText] = useState(''); // 行备注文本
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', onConfirm: null });
    const columns = useMemo(() => {
        if (!executionResult?.data || executionResult.data.length === 0) return [];
        const allKeys = Object.keys(executionResult.data[0] || {}).filter(key => !hiddenColumns.includes(key));

        // 按照报表配置中的 selectedFields 顺序排列
        const reportConfig = executionResult?.report?.config;
        if (reportConfig?.selectedFields && Array.isArray(reportConfig.selectedFields)) {
            const sortedFields = [...reportConfig.selectedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const orderedKeys = [];
            const remainingKeys = new Set(allKeys);

            // 先添加已选字段（按顺序）
            sortedFields.forEach(field => {
                const fieldName = field.fieldName || field.fieldId;
                if (remainingKeys.has(fieldName)) {
                    orderedKeys.push(fieldName);
                    remainingKeys.delete(fieldName);
                }
            });

            // 再添加其他字段（聚合字段、计算字段等）
            allKeys.forEach(key => {
                if (remainingKeys.has(key)) {
                    orderedKeys.push(key);
                }
            });

            return orderedKeys;
        }

        return allKeys;
    }, [executionResult, hiddenColumns]);
    const showRowNotes = executionResult?.report?.archiveStatus === 'archived';
    const confirmModal = useModal();
    const [reportFilter, setReportFilter] = useState('all'); // all | active | archived

    const closeConfirmDialog = () => setConfirmDialog({ open: false, title: '', description: '', onConfirm: null });
    const canManageReports = user.role === 'superadmin';

    // 加载报表列表
    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            const data = await reportsAPI.getAll();
            setReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        if (!reports) return [];
        if (reportFilter === 'active') {
            return reports.filter(r => (r.archiveStatus || r.archive_status) !== 'archived');
        }
        if (reportFilter === 'archived') {
            return reports.filter(r => (r.archiveStatus || r.archive_status) === 'archived');
        }
        return reports;
    }, [reports, reportFilter]);

    // 删除报表
    const handleDelete = async (report) => {
        try {
            await reportsAPI.delete(report.id);
            loadReports();
            confirmModal.close();
        } catch (err) {
            alert('删除失败: ' + err.message);
        }
    };

    // 处理列排序
    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                // 如果点击同一列，切换排序方向
                return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            } else {
                // 如果点击不同列，设置为升序
                return {
                    key,
                    direction: 'asc'
                };
            }
        });
    };

    // 行备注相关
    const buildRowKey = (row) => {
        const fields = executionResult?.report?.config?.selectedFields || [];
        if (fields.length > 0) {
            const parts = fields.map(f => {
                const key = f.fieldName || f.fieldId || '';
                const value = row[key] ?? '';
                return `${key}:${value}`;
            });
            return parts.join('|');
        }
        // 兜底：使用整行序列化
        try {
            return JSON.stringify(row);
        } catch {
            return String(row);
        }
    };

    const getRowNotes = (rowKey) => {
        return executionResult?.report?.rowNotes?.[rowKey] || {};
    };

    const saveRowNote = async (rowKey, text) => {
        if (!executionResult?.report) return;
        try {
            await reportsAPI.updateRowNote(executionResult.report.id, rowKey, text);
            const refreshed = await reportsAPI.getById(executionResult.report.id);
            setExecutionResult(prev => ({ ...(prev || {}), report: refreshed }));
            setEditingRowKey(null);
            setRowNoteText('');
            alert('备注保存成功');
        } catch (err) {
            alert('保存失败: ' + err.message);
        }
    };

    // 排序后的数据
    const currentRows = groupedRows || (executionResult?.data || []);

    const sortedData = useMemo(() => {
        if (!currentRows || currentRows.length === 0) {
            return [];
        }
        if (!sortConfig.key) {
            return currentRows;
        }

        const sorted = [...currentRows];
        sorted.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // 处理 null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // 尝试数字比较
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // 字符串比较
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (sortConfig.direction === 'asc') {
                return aStr.localeCompare(bStr, 'zh');
            } else {
                return bStr.localeCompare(aStr, 'zh');
            }
        });

        return sorted;
    }, [currentRows, sortConfig]);

    const getAggregationSuffix = (func) => {
        const map = {
            SUM: '求和',
            AVG: '平均值',
            COUNT: '计数',
            MAX: '最大值',
            MIN: '最小值'
        };
        return map[func?.toUpperCase?.()] || func || '';
    };

    // 可选分组字段（来自“选择字段”）
    const availableGroupKeys = useMemo(() => {
        if (!executionResult?.report?.config?.selectedFields) return [];
        return executionResult.report.config.selectedFields
            .map(f => f.fieldName || f.fieldId)
            .filter(Boolean);
    }, [executionResult]);

    // 根据分组字段重新聚合（前端汇总）
    const regroupRows = (rows, visibleGroupKeys, hidden, removedGroupKeys = []) => {
        if (!rows || rows.length === 0) return [];
        if (!visibleGroupKeys || visibleGroupKeys.length === 0) {
            // 无分组，返回单行汇总
            const agg = {};
            Object.keys(rows[0]).forEach(col => {
                if (hidden.includes(col)) return;
                if (removedGroupKeys.includes(col)) return;
                const num = parseFloat(rows[0][col]);
                if (!isNaN(num)) {
                    agg[col] = rows.reduce((sum, r) => sum + (parseFloat(r[col]) || 0), 0);
                } else {
                    agg[col] = rows[0][col] ?? '';
                }
            });
            return [agg];
        }

        const map = new Map();
        rows.forEach(row => {
            const keyParts = visibleGroupKeys.map(k => row[k] ?? '');
            const key = JSON.stringify(keyParts);
            if (!map.has(key)) {
                map.set(key, {
                    __group__: keyParts,
                    ...visibleGroupKeys.reduce((acc, k, idx) => {
                        acc[visibleGroupKeys[idx]] = keyParts[idx];
                        return acc;
                    }, {}),
                });
            }
            const bucket = map.get(key);
            Object.keys(row).forEach(col => {
                if (hidden.includes(col)) return;
                if (removedGroupKeys.includes(col)) return; // 去掉已取消的分组列
                if (visibleGroupKeys.includes(col)) return;
                const val = parseFloat(row[col]);
                if (!isNaN(val)) {
                    bucket[col] = (bucket[col] || 0) + val;
                } else {
                    if (bucket[col] === undefined) {
                        bucket[col] = row[col];
                    }
                }
            });
        });

        const result = Array.from(map.values()).map(r => {
            const copy = { ...r };
            delete copy.__group__;
            // 对于被取消的分组列，显示为空，避免随机值
            removedGroupKeys.forEach(col => {
                copy[col] = undefined;
            });
            return copy;
        });
        return result;
    };

    // 当分组或隐藏列变化时重新聚合
    useEffect(() => {
        if (!baseRows || baseRows.length === 0) return;
        const visibleGroupKeys = groupKeys.filter(k => !hiddenColumns.includes(k));
        const removedGroupKeys = availableGroupKeys.filter(k => !visibleGroupKeys.includes(k));
        const regrouped = regroupRows(baseRows, visibleGroupKeys, hiddenColumns, removedGroupKeys);
        setGroupedRows(regrouped);
    }, [baseRows, groupKeys, hiddenColumns, availableGroupKeys]);

    // 执行报表
    const handleExecute = async (report) => {
        try {
            setExecutingReport(report.id);
            // 重新获取报表信息，确保包含最新的备注信息
            const fullReport = await reportsAPI.getById(report.id);
            const result = await reportsAPI.execute(report.id);
            setExecutionResult({ report: fullReport, ...result });
            setBaseRows(result?.data || []);
            const defaultGroups = (fullReport?.config?.selectedFields || [])
                .map(f => f.fieldName || f.fieldId)
                .filter(Boolean);
            setGroupKeys(defaultGroups);
            setGroupedRows(null);
            setSortConfig({ key: null, direction: 'asc' }); // 重置排序

            // 处理隐藏列（基于聚合函数 show=false）
            // 后端聚合列名格式：formName_fieldName_suffix，需匹配实际返回列名
            const aggConfig = fullReport?.config?.aggregations || [];
            const hiddenAggs = aggConfig
                .filter(a => a?.show === false)
                .map(a => ({
                    fieldName: a.fieldName || a.fieldId,
                    suffix: getAggregationSuffix(a.function || 'SUM')
                }));

            const dataKeys = Object.keys((result?.data && result.data[0]) || {});
            const hiddenSet = new Set();

            hiddenAggs.forEach(agg => {
                const targetSuffix = `_${agg.suffix}`;
                dataKeys.forEach(key => {
                    if (key.endsWith(targetSuffix)) {
                        // 兼容：前缀可能包含表单名，匹配包含字段名即可
                        const maybeFieldName = key.slice(0, key.length - targetSuffix.length);
                        if (maybeFieldName.includes(agg.fieldName)) {
                            hiddenSet.add(key);
                        }
                    }
                });
                // 兜底：旧格式（无表单名前缀）
                hiddenSet.add(`${agg.fieldName}_${agg.suffix}`);
            });

            setHiddenColumns(Array.from(hiddenSet));
        } catch (err) {
            // 尝试解析错误响应
            let errorMessage = err.message || '执行失败';
            let errorSuggestion = '';

            try {
                const errorData = err.response?.data || err.data;
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
            setExecutingReport(null);
        }
    };

    const handleExportResult = () => {
        if (!executionResult) return;
        const headers = ['序号', ...columns];
        const rows = sortedData || [];

        if (columns.length === 0 || rows.length === 0) {
            alert('暂无可导出的数据');
            return;
        }

        const escapeCell = (value) => {
            if (value === null || value === undefined) return '""';
            const str = String(value).replace(/"/g, '""');
            return `"${str}"`;
        };

        // 获取字段格式配置
        const getFieldFormat = (fieldName) => {
            const reportConfig = executionResult?.report?.config;

            // 1. 检查 selectedFields（普通字段）
            if (reportConfig?.selectedFields && Array.isArray(reportConfig.selectedFields)) {
                const field = reportConfig.selectedFields.find(
                    f => (f.fieldName || f.fieldId) === fieldName
                );
                if (field?.decimalPlaces !== undefined) {
                    return field.decimalPlaces;
                }
            }

            // 2. 检查 aggregations（格式：表单名_字段名_后缀）
            if (reportConfig?.aggregations && Array.isArray(reportConfig.aggregations)) {
                const getSuffix = (func) => {
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

                // 尝试匹配聚合字段（列名格式：表单名_字段名_后缀）
                for (const agg of reportConfig.aggregations) {
                    const aggFieldName = agg.fieldName || agg.fieldId;
                    const suffix = getSuffix(agg.function || 'SUM');

                    // 检查列名是否匹配聚合字段格式
                    if (fieldName.includes(aggFieldName) && fieldName.endsWith(`_${suffix}`)) {
                        if (agg.decimalPlaces !== undefined) {
                            return agg.decimalPlaces;
                        }
                    }
                }
            }

            // 3. 检查 calculations（计算字段）
            if (reportConfig?.calculations && Array.isArray(reportConfig.calculations)) {
                const calc = reportConfig.calculations.find(
                    c => c.name === fieldName
                );
                if (calc?.decimalPlaces !== undefined) {
                    return calc.decimalPlaces;
                }
            }

            return undefined;
        };

        const lines = [];
        lines.push(headers.map(h => escapeCell(h)).join(','));
        rows.forEach((row, idx) => {
            const cells = ['序号', ...columns].map((key, i) => {
                if (i === 0) {
                    return escapeCell(idx + 1);
                }
                const actualKey = columns[i - 1];
                const isRemovedGroup = availableGroupKeys.includes(actualKey) && !groupKeys.includes(actualKey);
                let value = row[actualKey];

                // 应用数字格式
                if (value != null && value !== '' && !isRemovedGroup) {
                    // 尝试将值转换为数字（处理字符串类型的数字，包括科学计数法）
                    let numValue = null;
                    if (typeof value === 'number') {
                        numValue = value;
                    } else if (typeof value === 'string') {
                        // 尝试解析字符串为数字（包括处理带很多小数位的字符串）
                        const trimmed = value.trim();
                        // 检查是否是数字字符串（包括负数、小数、科学计数法）
                        if (trimmed !== '' && /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed)) {
                            numValue = parseFloat(trimmed);
                        }
                    }

                    if (numValue !== null && !isNaN(numValue) && isFinite(numValue)) {
                        const decimalPlaces = getFieldFormat(actualKey);
                        // 如果设置了格式，使用设置的格式；否则使用默认2位小数
                        const places = decimalPlaces !== undefined ? decimalPlaces : 2;
                        value = numValue.toFixed(places);
                    }
                }
                const displayValue = value ?? (isRemovedGroup ? '全部' : '');
                return escapeCell(displayValue);
            });
            lines.push(cells.join(','));
        });

        const csvContent = '\ufeff' + lines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateLabel = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `${executionResult.report?.name || 'report'}_${dateLabel}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return <LoadingScreen message="加载报表中..." />;
    }

    if (showBuilder && canManageReports) {
        return (
            <ReportBuilder
                user={user}
                getCollectionHook={getCollectionHook}
                editingReport={editingReport}
                onClose={() => {
                    setShowBuilder(false);
                    setEditingReport(null);
                    loadReports();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* 创建报表按钮 */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">统计报表</h2>
                {canManageReports && (
                    <Button variant="primary" onClick={() => setShowBuilder(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        创建报表
                    </Button>
                )}
            </div>

            {/* 过滤控件 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex space-x-2">
                    {[
                        { id: 'all', label: '全部' },
                        { id: 'active', label: '未归档' },
                        { id: 'archived', label: '已归档' }
                    ].map(opt => (
                        <Button
                            key={opt.id}
                            size="sm"
                            variant={reportFilter === opt.id ? 'primary' : 'outline'}
                            onClick={() => setReportFilter(opt.id)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 报表列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map(report => (
                    <div key={report.id} className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                            <button
                                className="text-left flex-1 group"
                                type="button"
                                onClick={() => handleExecute(report)}
                            >
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
                                    {report.name}
                                    {(report.archiveStatus === 'archived' || report.archive_status === 'archived') && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                                            已归档
                                        </span>
                                    )}
                                </h3>
                                {report.description && (
                                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                )}
                                {!canManageReports && (
                                    <p className="text-xs text-blue-500 mt-2 flex items-center space-x-1">
                                        <Play className="w-3 h-3" />
                                        <span>点击查看报表结果</span>
                                    </p>
                                )}
                            </button>
                            <FileText className="w-8 h-8 text-blue-500 ml-4 flex-shrink-0" />
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-xs text-gray-500">
                                创建时间: {(() => {
                                    try {
                                        // 支持 created_at (snake_case) 和 createdAt (camelCase)
                                        const timestamp = report.createdAt || report.created_at;
                                        if (!timestamp) return 'N/A';

                                        // 如果是数字（时间戳），直接使用
                                        // 如果是字符串，尝试解析
                                        const date = typeof timestamp === 'number'
                                            ? new Date(timestamp)
                                            : new Date(timestamp);

                                        if (!isNaN(date.getTime())) {
                                            return date.toLocaleString('zh-CN', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            });
                                        }
                                        return 'N/A';
                                    } catch (e) {
                                        return 'N/A';
                                    }
                                })()}
                            </p>
                            {report.config?.selectedForms && (
                                <p className="text-xs text-gray-500">
                                    包含表单: {report.config.selectedForms.length} 个
                                </p>
                            )}
                        </div>

                        {canManageReports && (
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleExecute(report)}
                                    disabled={executingReport === report.id}
                                >
                                    <Play className="w-4 h-4 mr-1" />
                                    {executingReport === report.id ? '执行中...' : '执行'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={report.archiveStatus === 'archived'}
                                    onClick={() => {
                                        if (report.archiveStatus === 'archived') {
                                            setConfirmDialog({
                                                open: true,
                                                title: '提示',
                                                description: '报表已归档，需先取消归档才能编辑。',
                                                onConfirm: null
                                            });
                                            return;
                                        }
                                        setEditingReport(report);
                                        setShowBuilder(true);
                                    }}
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    编辑
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            await reportsAPI.copy(report.id);
                                            loadReports();
                                        } catch (err) {
                                            alert('复制失败: ' + err.message);
                                        }
                                    }}
                                    title="复制报表"
                                >
                                    <Copy className="w-4 h-4 mr-1" />
                                    复制
                                </Button>
                                {report.archiveStatus !== 'archived' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setConfirmDialog({
                                                open: true,
                                                title: '确认归档',
                                                description: `确认归档报表 "${report.name}"？归档后无法编辑，需取消归档后才能继续修改。`,
                                                onConfirm: async () => {
                                                    try {
                                                        await reportsAPI.archive(report.id);
                                                        loadReports();
                                                    } catch (err) {
                                                        alert('归档失败: ' + err.message);
                                                    }
                                                }
                                            });
                                        }}
                                    >
                                        <Archive className="w-4 h-4 mr-1" />
                                        归档
                                    </Button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 flex items-center">
                                            <Archive className="w-3 h-3 mr-1" />
                                            已归档
                                        </span>
                                        {user.role === 'superadmin' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setConfirmDialog({
                                                        open: true,
                                                        title: '取消归档',
                                                        description: `确认取消归档报表 "${report.name}"？取消后可再次编辑。`,
                                                        onConfirm: async () => {
                                                            try {
                                                                await reportsAPI.unarchive(report.id);
                                                                loadReports();
                                                            } catch (err) {
                                                                alert('取消归档失败: ' + err.message);
                                                            }
                                                        }
                                                    });
                                                }}
                                            >
                                                取消归档
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => {
                                        confirmModal.open({
                                            title: `确认删除报表 "${report.name}"?`,
                                            description: '此操作不可恢复',
                                            onConfirm: () => handleDelete(report)
                                        });
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {reports.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>还没有创建任何报表</p>
                    {canManageReports ? (
                        <Button variant="primary" className="mt-4" onClick={() => setShowBuilder(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            创建第一个报表
                        </Button>
                    ) : (
                        <p className="text-sm text-gray-400 mt-2">请联系超级管理员分配报表</p>
                    )}
                </div>
            )}

            {/* 执行结果模态框 */}
            {executionResult && (
                <Modal
                    isOpen={!!executionResult}
                    onClose={() => setExecutionResult(null)}
                    title={`报表执行结果: ${executionResult.report.name}`}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            共 {sortedData.length} 条记录（可调整分组查看汇总）
                        </p>
                        {availableGroupKeys.length > 0 && (
                            <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
                                <div className="text-sm font-medium text-gray-700">分组字段（可取消以做汇总）</div>
                                <div className="flex flex-wrap gap-3">
                                    {availableGroupKeys.map(key => (
                                        <label key={key} className="inline-flex items-center space-x-1 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={groupKeys.includes(key)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setGroupKeys(prev => {
                                                        if (checked) {
                                                            return Array.from(new Set([...prev, key]));
                                                        }
                                                        return prev.filter(k => k !== key);
                                                    });
                                                }}
                                            />
                                            <span>{key}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="text-xs text-gray-500">
                                    取消勾选可去掉对应汇总项，按剩余字段或全部汇总。
                                </div>
                            </div>
                        )}
                        <div className="max-h-96 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        {/* 序号列 */}
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 bg-gray-100">
                                            序号
                                        </th>
                                        {columns.map(key => (
                                            <th
                                                key={key}
                                                className="px-4 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-200 select-none"
                                                onClick={() => handleSort(key)}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>{key}</span>
                                                    {sortConfig.key === key && (
                                                        sortConfig.direction === 'asc' ? (
                                                            <ArrowUp className="w-3 h-3" />
                                                        ) : (
                                                            <ArrowDown className="w-3 h-3" />
                                                        )
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        {showRowNotes && (
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                                备注
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedData.map((row, idx) => {
                                        // 获取字段格式配置
                                        const getFieldFormat = (fieldName) => {
                                            const reportConfig = executionResult?.report?.config;

                                            // 1. 检查 selectedFields（普通字段）
                                            if (reportConfig?.selectedFields && Array.isArray(reportConfig.selectedFields)) {
                                                const field = reportConfig.selectedFields.find(
                                                    f => (f.fieldName || f.fieldId) === fieldName
                                                );
                                                if (field?.decimalPlaces !== undefined) {
                                                    return field.decimalPlaces;
                                                }
                                            }

                                            // 2. 检查 aggregations（格式：表单名_字段名_后缀）
                                            if (reportConfig?.aggregations && Array.isArray(reportConfig.aggregations)) {
                                                const getSuffix = (func) => {
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

                                                // 尝试匹配聚合字段（列名格式：表单名_字段名_后缀）
                                                for (const agg of reportConfig.aggregations) {
                                                    const aggFieldName = agg.fieldName || agg.fieldId;
                                                    const suffix = getSuffix(agg.function || 'SUM');

                                                    // 检查列名是否匹配聚合字段格式
                                                    // 列名可能是：表单名_字段名_后缀 或 字段名_后缀
                                                    const expectedSuffix = `_${suffix}`;
                                                    if (fieldName.endsWith(expectedSuffix)) {
                                                        // 检查字段名是否包含在列名中
                                                        if (fieldName.includes(aggFieldName)) {
                                                            if (agg.decimalPlaces !== undefined) {
                                                                return agg.decimalPlaces;
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            // 3. 检查 calculations（计算字段）
                                            if (reportConfig?.calculations && Array.isArray(reportConfig.calculations)) {
                                                const calc = reportConfig.calculations.find(
                                                    c => c.name === fieldName
                                                );
                                                if (calc?.decimalPlaces !== undefined) {
                                                    return calc.decimalPlaces;
                                                }
                                            }

                                            return undefined;
                                        };

                                        return (
                                            <tr key={idx}>
                                                {/* 序号列 */}
                                                <td className="px-4 py-2 text-sm text-gray-900 bg-gray-50 font-medium">
                                                    {idx + 1}
                                                </td>
                                                {columns.map((key, i) => {
                                                    const isRemovedGroup = availableGroupKeys.includes(key) && !groupKeys.includes(key);
                                                    let value = row[key];

                                                    // 应用数字格式
                                                    if (value != null && value !== '' && !isRemovedGroup) {
                                                        // 尝试将值转换为数字（处理字符串类型的数字，包括科学计数法）
                                                        let numValue = null;
                                                        if (typeof value === 'number') {
                                                            numValue = value;
                                                        } else if (typeof value === 'string') {
                                                            // 尝试解析字符串为数字（包括处理带很多小数位的字符串）
                                                            const trimmed = value.trim();
                                                            // 检查是否是数字字符串（包括负数、小数、科学计数法）
                                                            if (trimmed !== '' && /^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(trimmed)) {
                                                                numValue = parseFloat(trimmed);
                                                            }
                                                        }

                                                        if (numValue !== null && !isNaN(numValue) && isFinite(numValue)) {
                                                            const decimalPlaces = getFieldFormat(key);
                                                            // 如果设置了格式，使用设置的格式；否则使用默认2位小数
                                                            const places = decimalPlaces !== undefined ? decimalPlaces : 2;
                                                            value = numValue.toFixed(places);
                                                        }
                                                    }

                                                    const displayValue = value ?? (isRemovedGroup ? '全部' : '');
                                                    return (
                                                        <td key={i} className="px-4 py-2 text-sm text-gray-900">
                                                            {displayValue}
                                                        </td>
                                                    );
                                                })}
                                                {showRowNotes && (() => {
                                                    const rowKey = buildRowKey(row);
                                                    const rowNotes = getRowNotes(rowKey);
                                                    const roleLabelMap = {
                                                        base_manager: '基地负责人',
                                                        company_asset: '公司资产员',
                                                        company_finance: '公司财务'
                                                    };
                                                    const numberToChinese = (num) => {
                                                        const map = ['零','一','二','三','四','五','六','七','八','九'];
                                                        if (num <= 10) return num === 10 ? '十' : map[num] || '';
                                                        if (num < 20) return '十' + map[num % 10];
                                                        const tens = Math.floor(num / 10);
                                                        const ones = num % 10;
                                                        return map[tens] + '十' + (ones ? map[ones] : '');
                                                    };
                                                    const formatUserLabel = (uid, roleKey) => {
                                                        // base_manager_001 => 基地负责人一
                                                        const match = uid && uid.match(/_(\d+)$/);
                                                        const num = match ? parseInt(match[1], 10) : null;
                                                        const baseLabel = roleLabelMap[roleKey] || roleKey;
                                                        if (num && !isNaN(num)) {
                                                            const suffix = numberToChinese(num);
                                                            return `${baseLabel}${suffix}`;
                                                        }
                                                        return baseLabel;
                                                    };
                                                    const normalizeRoleKey = (key) => key
                                                        ? key.replace(/([A-Z])/g, '_$1').toLowerCase()
                                                        : key;
                                                    const noteEntries = Object.entries(rowNotes).flatMap(([roleKey, users]) => {
                                                        const normalizedRole = normalizeRoleKey(roleKey);
                                                        const roleLabel = roleLabelMap[normalizedRole] || roleLabelMap[roleKey] || roleKey;
                                                        return Object.entries(users || {}).map(([uid, txt]) => ({
                                                            roleLabel,
                                                            userLabel: formatUserLabel(uid, normalizedRole),
                                                            txt
                                                        }));
                                                    });
                                                    const isEditableRole = ['base_manager', 'company_asset', 'company_finance'].includes(user.role);
                                                    const myNote = (rowNotes[user.role] || {})[user.id] || '';
                                                    const isEditing = editingRowKey === rowKey;
                                                    return (
                                                        <td className="px-4 py-2 text-sm text-gray-900 align-top">
                                                            <div className="space-y-1">
                                                                {noteEntries.length === 0 && <p className="text-gray-400 text-xs">暂无备注</p>}
                                                                {noteEntries.map((item, idx2) => (
                                                                    <div key={idx2} className="flex flex-col text-xs text-gray-700">
                                                                        <span className="text-gray-500 mb-0.5">{item.userLabel}</span>
                                                                        <span className="text-gray-800">{item.txt || <span className="text-gray-400">（空）</span>}</span>
                                                                    </div>
                                                                ))}
                                                                {isEditableRole && (
                                                                    isEditing ? (
                                                                        <div className="space-y-2">
                                                                            <textarea
                                                                                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200"
                                                                                rows={2}
                                                                                value={rowNoteText}
                                                                                onChange={(e) => setRowNoteText(e.target.value)}
                                                                                placeholder="填写本行备注..."
                                                                            />
                                                                            <div className="flex space-x-2">
                                                                                <Button size="sm" variant="primary" onClick={() => saveRowNote(rowKey, rowNoteText)}>保存</Button>
                                                                                <Button size="sm" variant="ghost" onClick={() => { setEditingRowKey(null); setRowNoteText(''); }}>取消</Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="!text-xs"
                                                                            onClick={() => { setEditingRowKey(rowKey); setRowNoteText(myNote || ''); }}
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-1" />
                                                                            {myNote ? '编辑备注' : '添加备注'}
                                                                        </Button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })()}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={handleExportResult} disabled={!sortedData.length}>
                                导出结果
                            </Button>
                            <Button variant="primary" onClick={() => {
                                setExecutionResult(null);
                                setEditingRowKey(null);
                                setRowNoteText('');
                            }}>关闭</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 通用确认/提示模态框 */}
            {confirmDialog.open && (
                <Modal isOpen={confirmDialog.open} onClose={closeConfirmDialog} title={confirmDialog.title || '确认'}>
                    <p className="text-gray-700 whitespace-pre-line">{confirmDialog.description}</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" onClick={closeConfirmDialog}>取消</Button>
                        {confirmDialog.onConfirm && (
                            <Button
                                variant="primary"
                                onClick={async () => {
                                    const fn = confirmDialog.onConfirm;
                                    closeConfirmDialog();
                                    await fn?.();
                                }}
                            >
                                确定
                            </Button>
                        )}
                        {!confirmDialog.onConfirm && (
                            <Button variant="primary" onClick={closeConfirmDialog}>知道了</Button>
                        )}
                    </div>
                </Modal>
            )}

            {/* 确认删除模态框 */}
            {confirmModal.isOpen && (
                <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.close} title={confirmModal.props.title}>
                    <p className="text-gray-600">{confirmModal.props.description}</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" onClick={confirmModal.close}>取消</Button>
                        <Button variant="danger" onClick={confirmModal.props.onConfirm}>确认删除</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

