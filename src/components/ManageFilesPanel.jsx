import React, { useState, useMemo, useRef } from 'react';
import { Button, LoadingScreen, FileText, UploadCloud, Trash2, Download } from '../utils/UI';
import { filesAPI } from '../utils/api';

export default function ManageFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading: filesLoading, error: filesError, update: updateFiles } = getCollectionHook('files');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const fileInputRef = useRef(null);
  
  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'base_handler');
  }, [allAppUsers]);

  const handleDownload = async (file) => {
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
    }
  };

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
  const handleUpload = async (e) => {
      e.preventDefault();
      if (!selectedFile) {
        setUploadError("请选择要上传的文件。");
        return;
      }
      
      setIsUploading(true);
      setUploadError(null);
      
      try {
        const res = await filesAPI.create({
          file: selectedFile,
          fileName: fileName || selectedFile.name,
          allowedSubAccounts: selectedAccounts
        });
        
        // 更新 files 集合
        updateFiles(prevFiles => [res, ...(prevFiles || [])]);
        
        // 重置表单
        setFileName('');
        setSelectedFile(null);
        setSelectedAccounts([]);
        
      } catch (err) {
        console.error("上传文件失败:", err);
        setUploadError(err.message || "上传失败, 请重试");
      } finally {
        setIsUploading(false);
      }
  };
  
  // 处理删除
  const handleDelete = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      updateFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    } catch (err) {
      alert('删除失败: ' + (err.message || ''));
    }
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
          选择本地文件上传到服务器，并设置可查看的子账号。
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
            <label className="block text-sm font-medium text-gray-700">文件</label>
            <div className="mt-2 flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>选择文件</span>
              </Button>
              <span className="text-sm text-gray-600 truncate">
                {selectedFile ? selectedFile.name : '未选择文件'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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
                   <p className="font-medium text-gray-800 truncate" title={file.file_name || file.fileName}>
                     {file.file_name || file.fileName}
                   </p>
                   <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                     <button
                       type="button"
                       onClick={() => handleDownload(file)}
                       className="text-blue-600 hover:underline flex items-center space-x-1"
                     >
                       <Download className="w-4 h-4" />
                       <span>下载</span>
                     </button>
                     <span>可查看：{(file.allowed_sub_accounts || file.allowedSubAccounts || []).length} 个子账号</span>
                   </div>
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