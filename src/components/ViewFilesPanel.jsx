import React, { useMemo, useState } from 'react';
import { LoadingScreen, FileText, Download } from '../utils/UI';
import { filesAPI } from '../utils/api';

export default function ViewFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading, error } = getCollectionHook('files');
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // 所有角色都只能看到被授权的文件
  const myFiles = useMemo(() => {
    return files.filter(file => {
      const allowedAccounts = file.allowed_sub_accounts || file.allowedSubAccounts || [];
      return Array.isArray(allowedAccounts) && allowedAccounts.includes(user.id);
    });
  }, [files, user.id]);

  const handleDownload = async (file) => {
    setDownloadingFileId(file.id);
    try {
      const blob = await filesAPI.download(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name || file.fileName || 'file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('下载失败: ' + (err.message || ''));
    } finally {
      setDownloadingFileId(null);
    }
  };

  if (loading) {
    return <LoadingScreen message="正在加载可用文件..." />;
  }
  if (error) {
    return <div className="text-red-500">加载文件失败: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">可查看的文件</h2>
      {myFiles.length === 0 ? (
        <p className="text-gray-500">目前没有分配给您的文件。</p>
      ) : (
        <ul className="space-y-4">
          {myFiles.map(file => (
            <li key={file.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <span className="font-medium text-gray-800">{file.file_name || file.fileName}</span>
                  <span className="text-sm text-gray-400 block">
                    上传于: {(() => {
                      try {
                        // 支持 uploaded_at (snake_case) 和 uploadedAt (camelCase)
                        const timestamp = file.uploaded_at || file.uploadedAt;
                        if (!timestamp) return 'N/A';

                        // 统一转换为数字时间戳（支持字符串格式的数字）
                        let numericTimestamp;
                        if (typeof timestamp === 'number') {
                          numericTimestamp = timestamp;
                        } else if (typeof timestamp === 'string') {
                          // 尝试解析为数字
                          numericTimestamp = parseInt(timestamp, 10);
                          if (isNaN(numericTimestamp)) {
                            // 如果不是纯数字字符串，尝试直接解析为日期
                            const date = new Date(timestamp);
                            if (!isNaN(date.getTime())) {
                              return date.toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            }
                            return 'N/A';
                          }
                        } else {
                          return 'N/A';
                        }

                        // 使用数字时间戳创建日期对象
                        const date = new Date(numericTimestamp);
                        if (!isNaN(date.getTime()) && numericTimestamp > 0) {
                          return date.toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        }
                        return 'N/A';
                      } catch (e) {
                        console.error('日期解析错误:', e, file.uploaded_at || file.uploadedAt);
                        return 'N/A';
                      }
                    })()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDownload(file)}
                disabled={downloadingFileId === file.id}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingFileId === file.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}