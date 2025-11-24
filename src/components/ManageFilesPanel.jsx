import React, { useState, useMemo } from 'react';
import { Button, LoadingScreen, FileText, UploadCloud, Trash2 } from '../utils/UI';
import { generateId } from '../utils/helpers';

export default function ManageFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading: filesLoading, error: filesError, update: updateFiles } = getCollectionHook('files');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  
  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'base_handler');
  }, [allAppUsers]);

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedAccounts.length === subAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(subAccounts.map(acc => acc.id));
    }
  };

  // 处理复选框变化
  const handleCheckboxChange = (accountId) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };
  
  // 处理上传
  const handleUpload = (e) => {
      e.preventDefault();
      if (!fileName || !fileUrl) {
        setUploadError("文件名和文件 URL 均不能为空。");
        return;
      }
      
      // 模拟上传
      setIsUploading(true);
      setUploadError(null);
      
      try {
        const newFile = {
            id: generateId(),
            fileName: fileName,
            url: fileUrl,
            uploadedBy: user.id,
            uploadedAt: Date.now(),
            allowedSubAccounts: selectedAccounts
        };
        
        // 更新 files 集合
        updateFiles(prevFiles => [...prevFiles, newFile]);
        
        // 重置表单
        setFileName('');
        setFileUrl('');
        setSelectedAccounts([]);
        
      } catch (err) {
        console.error("上传文件失败:", err);
        setUploadError(err.message || "上传失败, 请重试");
      } finally {
        setIsUploading(false);
      }
  };
  
  // 处理删除
  const handleDelete = (fileId) => {
    // 更新 files 集合，移除该文件
    updateFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  if (usersLoading || filesLoading) {
    return <LoadingScreen message="正在加载数据..." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧: 上传表单 */}
      <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800">上传新文件</h2>
        <p className="text-sm text-gray-500">
          (模拟) 请输入文件名和文件的公开 URL。
        </p>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {uploadError}
              </div>
          )}
          
          <div>
            <label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
              文件名
            </label>
            <input
              type="text"
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如: 养殖手册.pdf"
            />
          </div>
          
          <div>
            <label htmlFor="file-url" className="block text-sm font-medium text-gray-700">
              文件 URL (模拟)
            </label>
            <input
              type="text"
              id="file-url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/file.pdf"
            />
          </div>
          
          {/* 子账号权限 */}
          {subAccounts.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">
                指定查看权限
              </h3>
              {usersError && <div className="text-red-500 text-sm">加载经手人失败: {usersError}</div>}
              
              <div className="flex items-center justify-between mb-2">
                 <label htmlFor="select-all" className="flex items-center text-sm text-gray-600">
                   <input
                     type="checkbox"
                     id="select-all"
                     checked={subAccounts.length > 0 && selectedAccounts.length === subAccounts.length}
                     onChange={toggleSelectAll}
                     className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   />
                   <span className="ml-2">全选</span>
                 </label>
                 <span className="text-sm text-gray-500">
                   已选 {selectedAccounts.length} / {subAccounts.length}
                 </span>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-2">
                {subAccounts.map(acc => (
                  <label key={acc.id} htmlFor={`cb-${acc.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      id={`cb-${acc.id}`}
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => handleCheckboxChange(acc.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-800">{acc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <Button type="submit" variant="primary" disabled={isUploading} className="w-full justify-center">
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UploadCloud className="w-5 h-5 mr-2" />
              )}
              上传文件
          </Button>
        </form>
      </div>

      {/* 右侧: 已上传文件列表 */}
      <div className="space-y-4 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800">已上传的文件</h2>
        {filesLoading && <LoadingScreen message="加载文件中..." />}
        {filesError && <div className="text-red-500 text-sm">加载文件失败: {filesError}</div>}
        
        <ul className="space-y-3">
          {files.length === 0 && <p className="text-gray-500 text-sm">尚未上传任何文件。</p>}
          
          {files.map(file => (
            <li key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
               <div className="flex items-center space-x-3 overflow-hidden">
                 <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                 <div className="overflow-hidden">
                   <a 
                     href={file.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="font-medium text-gray-800 truncate hover:underline"
                     title={file.fileName}
                   >
                     {file.fileName}
                   </a>
                   <span className="text-xs text-gray-400 block">
                     {file.allowedSubAccounts?.length || 0} 个子账号可查看
                   </span>
                 </div>
               </div>
               <Button variant="danger" size="icon" onClick={() => handleDelete(file.id)} className="flex-shrink-0 ml-2">
                 <Trash2 className="w-4 h-4" />
               </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}