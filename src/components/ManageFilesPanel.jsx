import React, { useState, useMemo, useRef } from 'react';
import { Button, LoadingScreen, FileText, UploadCloud, Trash2, Download, Modal, useModal } from '../utils/UI';
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
  
  // 权限设置模态框状态
  const [editingFile, setEditingFile] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  
  // 可设置权限的用户列表：除超级管理员、自身外的所有账号
  const availableUsers = useMemo(() => {
    return allAppUsers.filter(u => 
      u.role !== 'superadmin' && u.id !== user.id
    );
  }, [allAppUsers, user.id]);
  
  // 上传时使用的用户列表（与权限设置列表相同）
  const subAccounts = availableUsers;

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
  
  // 处理删除（增加确认步骤）
  const handleDelete = async (file) => {
    if (!window.confirm(`是否确认删除文件 “${file.file_name || file.fileName}”？该操作不可恢复。`)) {
      return;
    }
    try {
      await filesAPI.delete(file.id);
      updateFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
    } catch (err) {
      alert('删除失败: ' + (err.message || ''));
    }
  };

  // 打开权限编辑模态框
  const handleEditPermissions = (file) => {
    const allowedAccounts = file.allowed_sub_accounts || file.allowedSubAccounts || [];
    setEditingFile(file);
    setEditingPermissions([...allowedAccounts]);
  };

  // 关闭权限编辑模态框
  const handleClosePermissions = () => {
    setEditingFile(null);
    setEditingPermissions([]);
  };

  // 权限编辑：全选/取消全选
  const toggleSelectAllPermissions = () => {
    if (editingPermissions.length === availableUsers.length) {
      setEditingPermissions([]);
    } else {
      setEditingPermissions(availableUsers.map(u => u.id));
    }
  };

  // 权限编辑：处理复选框变化
  const handlePermissionCheckboxChange = (userId) => {
    setEditingPermissions(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 保存权限
  const handleSavePermissions = async () => {
    if (!editingFile) return;
    
    setIsSavingPermissions(true);
    try {
      const updatedFile = await filesAPI.updatePermissions(editingFile.id, editingPermissions);
      updateFiles(prevFiles => prevFiles.map(f => f.id === editingFile.id ? updatedFile : f));
      handleClosePermissions();
    } catch (err) {
      alert('保存权限失败: ' + (err.message || ''));
    } finally {
      setIsSavingPermissions(false);
    }
  };

  if (usersLoading || filesLoading) {
    return <LoadingScreen message="正在加载数据..." />;
  }

  const canUpload = user.role === 'company_asset' || user.role === 'company_finance';
  const canEditPermissions = canUpload;

  return (
    <div className={`grid grid-cols-1 ${canUpload ? 'lg:grid-cols-2' : ''} gap-8`}>
      {/* 左侧: 上传表单（仅资产员和财务员可见） */}
      {canUpload && (
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
          
          {/* 权限设置 */}
          {subAccounts.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">
              指定查看权限
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              可选择基地负责人、资产员、财务员、基地经手人等角色
            </p>
              {usersError && <div className="text-red-500 text-sm">加载用户列表失败: {usersError}</div>}
            
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
                  <span className="ml-3 text-sm font-medium text-gray-800">
                    {acc.name} ({acc.role === 'base_handler' ? '基地经手人' : 
                                 acc.role === 'base_manager' ? '基地负责人' :
                                 acc.role === 'company_asset' ? '资产员' :
                                 acc.role === 'company_finance' ? '财务员' : acc.role})
                  </span>
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
      )}

      {/* 右侧: 已上传文件列表（所有角色可见） */}
      <div className="space-y-4 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800">
          {canUpload ? '已上传的文件' : '可下载的文件'}
        </h2>
        {filesLoading && <LoadingScreen message="加载文件中..." />}
        {filesError && <div className="text-red-500 text-sm">加载文件失败: {filesError}</div>}
        
        {!canUpload && (
          <p className="text-sm text-gray-600 mb-4">
            以下是您有权限查看和下载的文件列表。
          </p>
        )}
        
        <ul className="space-y-3">
          {files.length === 0 && (
            <p className="text-gray-500 text-sm">
              {canUpload ? '尚未上传任何文件。' : '目前没有分配给您的文件。'}
            </p>
          )}
          
          {files.map(file => {
            const allowedAccounts = file.allowed_sub_accounts || file.allowedSubAccounts || [];
            // 只有上传者本人才能修改权限
            const canEditThisFilePermissions = canEditPermissions && file.uploaded_by === user.id;
            
            return (
              <li key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3 overflow-hidden flex-1">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="overflow-hidden flex-1">
                    <p className="font-medium text-gray-800 truncate" title={file.file_name || file.fileName}>
                      {file.file_name || file.fileName}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>下载</span>
                      </button>
                      {canUpload && (
                        <>
                          <span>可查看：{allowedAccounts.length} 个用户</span>
                          {canEditThisFilePermissions && (
                            <button
                              type="button"
                              onClick={() => handleEditPermissions(file)}
                              className="text-green-600 hover:text-green-800 hover:underline"
                            >
                              修改权限
                            </button>
                          )}
                        </>
                      )}
                      {(() => {
                        try {
                          const timestamp = file.uploaded_at || file.uploadedAt;
                          if (!timestamp) return null;

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
                                return (
                                  <span className="text-gray-400">
                                    上传于: {date.toLocaleString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                );
                              }
                              return null;
                            }
                          } else {
                            return null;
                          }

                          // 使用数字时间戳创建日期对象
                          const date = new Date(numericTimestamp);
                          if (!isNaN(date.getTime()) && numericTimestamp > 0) {
                            return (
                              <span className="text-gray-400">
                                上传于: {date.toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            );
                          }
                        } catch (e) {
                          console.error('日期解析错误:', e, file.uploaded_at || file.uploadedAt);
                          return null;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
                {canUpload && file.uploaded_by === user.id && (
                  <Button variant="danger" size="icon" onClick={() => handleDelete(file)} className="flex-shrink-0 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 权限编辑模态框 */}
      {editingFile && (
        <Modal
          isOpen={!!editingFile}
          onClose={handleClosePermissions}
          title={`修改权限：${editingFile.file_name || editingFile.fileName}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              选择可以查看和下载此文件的用户
            </p>

            <div className="flex items-center justify-between mb-2">
              <label htmlFor="select-all-permissions" className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="select-all-permissions"
                  checked={availableUsers.length > 0 && editingPermissions.length === availableUsers.length}
                  onChange={toggleSelectAllPermissions}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2">全选</span>
              </label>
              <span className="text-sm text-gray-500">
                已选 {editingPermissions.length} / {availableUsers.length}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-2">
              {availableUsers.map(u => (
                <label key={u.id} htmlFor={`perm-${u.id}`} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    id={`perm-${u.id}`}
                    checked={editingPermissions.includes(u.id)}
                    onChange={() => handlePermissionCheckboxChange(u.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-800">
                    {u.name} ({u.role === 'base_handler' ? '基地经手人' : 
                              u.role === 'base_manager' ? '基地负责人' :
                              u.role === 'company_asset' ? '资产员' :
                              u.role === 'company_finance' ? '财务员' : u.role})
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClosePermissions} disabled={isSavingPermissions}>
                取消
              </Button>
              <Button variant="primary" onClick={handleSavePermissions} disabled={isSavingPermissions}>
                {isSavingPermissions ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}