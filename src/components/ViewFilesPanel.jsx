import React, { useMemo } from 'react';
import { LoadingScreen, FileText } from '../utils/UI';

export default function ViewFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading, error } = getCollectionHook('files');

  // 仅显示允许当前用户查看的文件
  const myFiles = useMemo(() => {
    return files.filter(file => 
      file.allowedSubAccounts && file.allowedSubAccounts.includes(user.id)
    );
  }, [files, user.id]);

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
                  <span className="font-medium text-gray-800">{file.fileName}</span>
                  <span className="text-sm text-gray-400 block">
                    上传于: {new Date(file.uploadedAt).toLocaleDateString() || 'N/A'}
                  </span>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                下载
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}