import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, FileArchive } from 'lucide-react';
import { Button, LoadingScreen } from '../utils/UI';
import { formsAPI, API_BASE_URL, getToken } from '../utils/api';

export default function ArchivedDocumentsPanel({ user, getCollectionHook }) {
    const { data: forms, loading: formsLoading, error: formsError } = getCollectionHook('forms');
    const [selectedFormId, setSelectedFormId] = useState('');
    const [archives, setArchives] = useState([]);
    const [loadingArchives, setLoadingArchives] = useState(false);
    const [error, setError] = useState(null);
    const [downloadingSnapshotId, setDownloadingSnapshotId] = useState(null);
    const [downloadingExcelKey, setDownloadingExcelKey] = useState(null);

    const accessibleForms = useMemo(() => {
        return (forms || []).sort((a, b) => a.name.localeCompare(b.name));
    }, [forms]);

    const currentForm = useMemo(() => {
        return accessibleForms.find(form => form.id === selectedFormId);
    }, [accessibleForms, selectedFormId]);

    useEffect(() => {
        if (!formsLoading && accessibleForms.length > 0 && !selectedFormId) {
            setSelectedFormId(accessibleForms[0].id);
        }
    }, [formsLoading, accessibleForms, selectedFormId]);

    useEffect(() => {
        if (!selectedFormId) return;
        loadArchives(selectedFormId);
    }, [selectedFormId]);

    const loadArchives = async (formId) => {
        try {
            setLoadingArchives(true);
            setError(null);
            const data = await formsAPI.getArchives(formId);
            setArchives(data);
        } catch (err) {
            setError(err.message || '加载归档记录失败');
        } finally {
            setLoadingArchives(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownloadSnapshot = async (archive) => {
        try {
            setDownloadingSnapshotId(archive.id);
            setError(null);
            const token = getToken();
            const response = await fetch(
                `${API_BASE_URL}/forms/archives/${archive.id}/download`,
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`下载失败 (${response.status})`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const jsonData = await response.json();
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                triggerBlobDownload(blob, `${archive.formName || 'archive'}_v${archive.version || ''}.json`);
            } else {
                const blob = await response.blob();
                const fileName = getFileNameFromDisposition(response.headers.get('content-disposition')) ||
                    `${archive.formName || 'archive'}_v${archive.version || ''}.json`;
                triggerBlobDownload(blob, fileName);
            }
        } catch (err) {
            setError(err.message || '下载失败，请重试');
        } finally {
            setDownloadingSnapshotId(null);
        }
    };

    const handleExportExcel = async ({ formId, scope = 'active', archive }) => {
        if (!formId) return;
        try {
            const key = `${formId}_${scope}_${archive?.id || 'latest'}`;
            setDownloadingExcelKey(key);
            setError(null);
            const blob = await formsAPI.exportData(formId, scope === 'archive' ? { scope: 'archive', archiveId: archive?.id } : { scope: 'active' });
            const fileLabel = `${accessibleForms.find(f => f.id === formId)?.name || '表格'}_${scope === 'archive' ? `归档版_v${archive?.version || 'latest'}` : '未归档'}.xlsx`;
            triggerBlobDownload(blob, fileLabel);
        } catch (err) {
            setError(err.message || '导出失败，请重试');
        } finally {
            setDownloadingExcelKey(null);
        }
    };

    const triggerBlobDownload = (blob, fileName) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const getFileNameFromDisposition = (disposition) => {
        if (!disposition) return null;
        const match = disposition.match(/filename="?([^"]+)"?/);
        return match ? decodeURIComponent(match[1]) : null;
    };

    if (formsLoading) {
        return <LoadingScreen message="正在加载表格..." />;
    }

    if (formsError) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{formsError}</div>;
    }

    if (!accessibleForms.length) {
        return <div className="p-6 text-gray-500 bg-white rounded-xl shadow">暂无可查看的表格。</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择表格</label>
                    <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {accessibleForms.map((form) => (
                            <option key={form.id} value={form.id}>
                                {form.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => loadArchives(selectedFormId)} disabled={loadingArchives}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        刷新
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => handleExportExcel({ formId: selectedFormId, scope: 'active' })}
                        disabled={!selectedFormId || downloadingExcelKey === `${selectedFormId}_active_latest`}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        导出未归档Excel
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {loadingArchives ? (
                <LoadingScreen message="正在加载归档文档..." />
            ) : archives.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow border border-dashed border-gray-300">
                    <FileArchive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂未找到归档文档</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archives.map((archive) => (
                        <div key={archive.id} className="p-5 bg-white rounded-xl shadow border border-gray-200 flex flex-col space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">版本</p>
                                    <p className="text-xl font-semibold text-gray-800">V{archive.version}</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                    {archive.metadata?.recordCount ?? 0} 条记录
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>归档时间：{formatDate(archive.archivedAt)}</p>
                                <p>归档人：{archive.metadata?.archivedBy || '系统'}</p>
                            </div>
                            <div className="flex justify-end gap-2 flex-wrap">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleExportExcel({ formId: archive.formId || selectedFormId, scope: 'archive', archive })}
                                    disabled={downloadingExcelKey === `${archive.formId || selectedFormId}_archive_${archive.id}`}
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    {downloadingExcelKey === `${archive.formId || selectedFormId}_archive_${archive.id}` ? '导出中...' : '导出Excel'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadSnapshot(archive)}
                                    disabled={downloadingSnapshotId === archive.id}
                                >
                                    {downloadingSnapshotId === archive.id ? '下载中...' : '原始文件'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

