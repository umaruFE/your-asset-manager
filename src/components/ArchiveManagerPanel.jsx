import React, { useMemo, useState } from 'react';
import { ShieldCheck, AlertCircle, Archive } from 'lucide-react';
import { Button, Modal, useModal, LoadingScreen } from '../utils/UI';
import { formsAPI } from '../utils/api';

export default function ArchiveManagerPanel({ user, getCollectionHook }) {
    const {
        data: forms,
        loading,
        error,
        update: refreshForms
    } = getCollectionHook('forms');

    const [selectedFormIds, setSelectedFormIds] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [resultLog, setResultLog] = useState([]);
    const [confirmInput, setConfirmInput] = useState('');
    const [pendingFormIds, setPendingFormIds] = useState([]);
    const confirmModal = useModal();

    // 只显示未归档的表格（archiveStatus === 'active'）
    const sortedForms = useMemo(() => {
        return (forms || [])
            .filter(form => form.archiveStatus === 'active')
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [forms]);

    const toggleSelection = (formId) => {
        setSelectedFormIds((prev) =>
            prev.includes(formId)
                ? prev.filter((id) => id !== formId)
                : [...prev, formId]
        );
    };

    const selectAll = () => {
        if (selectedFormIds.length === sortedForms.length) {
            setSelectedFormIds([]);
        } else {
            setSelectedFormIds(sortedForms.map((form) => form.id));
        }
    };

    const openConfirmModal = (formIds) => {
        if (!formIds.length) return;
        setPendingFormIds(formIds);
        setConfirmInput('');
        confirmModal.open();
    };

    const handleConfirmArchive = async () => {
        if (confirmInput.trim() !== '确认') {
            return;
        }
        confirmModal.close();
        await executeArchive(pendingFormIds);
    };

    const executeArchive = async (formIds) => {
        try {
            setProcessing(true);
            setResultLog([]);

            let responseLog = [];
            if (formIds.length === 1) {
                const archiveResult = await formsAPI.archive(formIds[0], { autoUnlock: true });
                responseLog = [{
                    formId: formIds[0],
                    success: true,
                    archive: archiveResult
                }];
            } else {
                const batchResult = await formsAPI.archiveBatch(formIds, { autoUnlock: true });
                responseLog = batchResult.results || [];
            }

            setResultLog(responseLog);
            setSelectedFormIds([]);

            // 重新加载表单数据
            const updatedForms = await formsAPI.getAll();
            refreshForms(updatedForms);
        } catch (err) {
            setResultLog([{
                formId: formIds.join(', '),
                success: false,
                error: err.message || '归档失败'
            }]);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return '未归档';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '未归档';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <LoadingScreen message="正在加载表格状态..." />;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    if (!sortedForms.length) {
        return <div className="p-6 bg-white rounded-xl shadow text-gray-500">暂无可归档的表格。</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                        <Archive className="w-6 h-6 text-blue-600" />
                        <span>归档控制台</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        一键归档将导出当前未归档数据，并清空记录以开启新周期
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        variant="outline"
                        onClick={selectAll}
                        disabled={processing}
                    >
                        {selectedFormIds.length === sortedForms.length ? '取消全选' : '全选'}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => openConfirmModal(selectedFormIds)}
                        disabled={processing || selectedFormIds.length === 0}
                    >
                        一键归档所选（{selectedFormIds.length}）
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    onChange={selectAll}
                                    checked={selectedFormIds.length === sortedForms.length}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表格名称</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上次归档</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedForms.map((form) => {
                            const isSelected = selectedFormIds.includes(form.id);
                            return (
                                <tr key={form.id} className={isSelected ? 'bg-blue-50/50' : ''}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(form.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-800">{form.name}</p>
                                        <p className="text-xs text-gray-500">ID: {form.id}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${form.archiveStatus === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {form.archiveStatus === 'active' ? '未归档' : '已归档'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {formatDate(form.archivedAt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        V{form.archiveVersion ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openConfirmModal([form.id])}
                                            disabled={processing || form.archiveStatus !== 'active'}
                                        >
                                            立即归档
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {resultLog.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">最新归档结果</h3>
                    <ul className="space-y-2">
                        {resultLog.map((log, idx) => (
                            <li key={`${log.formId}-${idx}`} className="flex items-start space-x-2 text-sm">
                                {log.success ? (
                                    <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                )}
                                <div>
                                    <p className="text-gray-800">表格 ID: {log.formId}</p>
                                    {log.success ? (
                                        <p className="text-green-600">归档成功，生成版本 V{log.archive?.version}</p>
                                    ) : (
                                        <p className="text-red-600">失败：{log.error}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Modal
                isOpen={confirmModal.isOpen}
                onClose={confirmModal.close}
                title="归档确认"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        将归档 {pendingFormIds.length} 个表格。此操作会导出文件并清空当前数据，请输入
                        <span className="font-semibold text-red-600 mx-1">确认</span>
                        以继续。
                    </p>
                    <input
                        type="text"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入“确认”"
                    />
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={confirmModal.close}>取消</Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmArchive}
                            disabled={confirmInput.trim() !== '确认' || processing}
                        >
                            我已确认
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

