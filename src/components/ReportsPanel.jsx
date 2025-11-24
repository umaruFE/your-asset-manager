import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Edit, FileText } from 'lucide-react';
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
    const confirmModal = useModal();

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

    // 执行报表
    const handleExecute = async (report) => {
        try {
            setExecutingReport(report.id);
            const result = await reportsAPI.execute(report.id);
            setExecutionResult({ report, ...result });
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

    if (loading) {
        return <LoadingScreen message="加载报表中..." />;
    }

    if (showBuilder) {
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
                <Button variant="primary" onClick={() => setShowBuilder(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    创建报表
                </Button>
            </div>

            {/* 报表列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map(report => (
                    <div key={report.id} className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{report.name}</h3>
                                {report.description && (
                                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                )}
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
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
                                onClick={() => {
                                    setEditingReport(report);
                                    setShowBuilder(true);
                                }}
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                编辑
                            </Button>
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
                    </div>
                ))}
            </div>

            {reports.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>还没有创建任何报表</p>
                    <Button variant="primary" className="mt-4" onClick={() => setShowBuilder(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        创建第一个报表
                    </Button>
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
                            共 {executionResult.total} 条记录
                        </p>
                        <div className="max-h-96 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0">
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
                        <div className="flex justify-end">
                            <Button variant="primary" onClick={() => setExecutionResult(null)}>关闭</Button>
                        </div>
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

