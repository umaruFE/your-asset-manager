import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, X } from 'lucide-react';
import { Button, Modal, useModal, InputGroup, LoadingScreen } from '../utils/UI';
import { usersAPI, basesAPI, permissionsAPI } from '../utils/api';

export default function UserManagementPanel({ getCollectionHook }) {
    const { data: users, loading: usersLoading, update: updateUsers } = getCollectionHook('allAppUsers');
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [editError, setEditError] = useState('');
    const [showPermissionForm, setShowPermissionForm] = useState(false);
    const [userPermissions, setUserPermissions] = useState([]);
    
    const confirmModal = useModal();
    const { data: forms } = getCollectionHook('forms');

    // 角色选项
    const roleOptions = [
        { value: 'superadmin', label: '超级管理员' },
        { value: 'base_handler', label: '基地经手人' },
        { value: 'base_manager', label: '基地负责人' },
        { value: 'company_asset', label: '公司资产员' },
        { value: 'company_finance', label: '公司财务' }
    ];

    // 加载基地列表
    useEffect(() => {
        async function loadBases() {
            try {
                const basesData = await basesAPI.getAll();
                setBases(basesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadBases();
    }, []);

    // 创建用户表单状态
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        role: 'base_handler',
        baseId: ''
    });

    // 创建用户
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await usersAPI.create(newUser);
            setNewUser({ username: '', password: '', name: '', role: 'base_handler', baseId: '' });
            setShowUserForm(false);
            // 重新加载用户列表
            window.location.reload(); // 简单方式，可以优化为更新状态
        } catch (err) {
            alert('创建用户失败: ' + err.message);
        }
    };

    // 删除用户
    const handleDeleteUser = async (user) => {
        try {
            await usersAPI.delete(user.id);
            window.location.reload();
        } catch (err) {
            alert('删除用户失败: ' + err.message);
        }
    };

    // 打开编辑用户弹窗
    const handleOpenEditUser = (user) => {
        setEditError('');
        setEditingUser(user);
        setEditForm({
            username: user.username || '',
            password: '',
            confirmPassword: ''
        });
    };

    // 保存编辑
    const handleSaveEditUser = async () => {
        if (!editForm.username) {
            setEditError('用户名不能为空');
            return;
        }
        if (editForm.password && editForm.password.length < 6) {
            setEditError('密码长度不能少于6位');
            return;
        }
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            setEditError('两次输入的密码不一致');
            return;
        }

        try {
            const payload = { username: editForm.username };
            if (editForm.password) {
                payload.password = editForm.password;
            }
            await usersAPI.update(editingUser.id, payload);
            setEditingUser(null);
            window.location.reload();
        } catch (err) {
            setEditError(err.message || '保存失败');
        }
    };

    // 打开权限管理
    const handleManagePermissions = async (user) => {
        setSelectedUser(user);
        setError(null);
        try {
            const perms = await permissionsAPI.getUserPermissions(user.id);
            console.log('加载的权限:', perms);
            // 确保所有权限都有 can_submit 字段，并统一字段名格式
            const normalizedPerms = perms.map(perm => {
                // 统一使用 snake_case 格式，同时保留 camelCase 以便查找
                const formId = perm.form_id || perm.formId;
                const canView = perm.can_view !== undefined ? Boolean(perm.can_view) : (perm.canView !== undefined ? Boolean(perm.canView) : false);
                const canSubmit = perm.can_submit !== undefined ? Boolean(perm.can_submit) : 
                                 (perm.canSubmit !== undefined ? Boolean(perm.canSubmit) : 
                                 (perm.can_edit !== undefined ? Boolean(perm.can_edit) : false));
                
                return {
                    form_id: formId,
                    formId: formId, // 同时保留两种格式以便查找
                    can_view: canView,
                    canView: canView,
                    can_submit: canSubmit,
                    canSubmit: canSubmit,
                    form_name: perm.form_name || perm.formName || ''
                };
            });
            console.log('规范化后的权限:', normalizedPerms);
            setUserPermissions(normalizedPerms);
            setShowPermissionForm(true);
        } catch (err) {
            console.error('加载权限失败:', err);
            setError('加载权限失败: ' + err.message);
        }
    };

    // 设置权限
    const handleSetPermission = async (formId, canView, canSubmit) => {
        if (!selectedUser) {
            setError('请先选择用户');
            return;
        }
        
        console.log('设置权限:', { formId, canView, canSubmit, userId: selectedUser.id });
        setError(null);
        
        // 乐观更新：立即更新本地状态
        const previousPermissions = [...userPermissions];
        setUserPermissions(prev => {
            const existing = prev.find(p => (p.form_id === formId) || (p.formId === formId));
            if (existing) {
                return prev.map(p => {
                    const isMatch = (p.form_id === formId) || (p.formId === formId);
                    if (isMatch) {
                        return { 
                            ...p, 
                            form_id: formId,
                            formId: formId,
                            can_view: canView,
                            canView: canView,
                            can_submit: canSubmit,
                            canSubmit: canSubmit
                        };
                    }
                    return p;
                });
            } else {
                const form = forms.find(f => f.id === formId);
                return [...prev, {
                    form_id: formId,
                    formId: formId,
                    can_view: canView,
                    canView: canView,
                    can_submit: canSubmit,
                    canSubmit: canSubmit,
                    form_name: form?.name || ''
                }];
            }
        });
        
        try {
            const result = await permissionsAPI.setPermission(selectedUser.id, {
                formId,
                canView,
                canSubmit
            });
            
            console.log('权限设置成功:', result);
            
            // 确保状态与服务器同步，使用服务器返回的数据
            const resultFormId = result.formId || result.form_id;
            const resultCanView = result.canView !== undefined ? result.canView : result.can_view;
            const resultCanSubmit = result.canSubmit !== undefined ? result.canSubmit : 
                                   (result.can_submit !== undefined ? result.can_submit : false);
            
            setUserPermissions(prev => {
                const existing = prev.find(p => (p.form_id === resultFormId) || (p.formId === resultFormId));
                if (existing) {
                    return prev.map(p => {
                        const isMatch = (p.form_id === resultFormId) || (p.formId === resultFormId);
                        if (isMatch) {
                            return { 
                                ...p, 
                                form_id: resultFormId,
                                formId: resultFormId,
                                can_view: resultCanView,
                                canView: resultCanView,
                                can_submit: resultCanSubmit,
                                canSubmit: resultCanSubmit,
                                form_name: result.formName || result.form_name || existing.form_name
                            };
                        }
                        return p;
                    });
                } else {
                    return [...prev, {
                        form_id: resultFormId,
                        formId: resultFormId,
                        can_view: resultCanView,
                        canView: resultCanView,
                        can_submit: resultCanSubmit,
                        canSubmit: resultCanSubmit,
                        form_name: result.formName || result.form_name || ''
                    }];
                }
            });
        } catch (err) {
            console.error('设置权限失败:', err);
            setError('设置权限失败: ' + (err.message || '未知错误'));
            // 恢复之前的状态
            setUserPermissions(previousPermissions);
        }
    };

    if (usersLoading || loading) {
        return <LoadingScreen message="加载用户数据中..." />;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* 创建用户 */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">用户管理</h3>
                    <Button variant="primary" onClick={() => setShowUserForm(!showUserForm)}>
                        <Plus className="w-5 h-5 mr-2" />
                        {showUserForm ? '取消' : '创建用户'}
                    </Button>
                </div>

                {showUserForm && (
                    <form onSubmit={handleCreateUser} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="用户名">
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </InputGroup>
                            <InputGroup label="密码">
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </InputGroup>
                            <InputGroup label="显示名称">
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </InputGroup>
                            <InputGroup label="角色">
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value, baseId: '' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    {roleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </InputGroup>
                            {(newUser.role === 'base_handler' || newUser.role === 'base_manager') && (
                                <InputGroup label="所属基地">
                                    <select
                                        value={newUser.baseId}
                                        onChange={(e) => setNewUser({ ...newUser, baseId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">请选择基地</option>
                                        {bases.map(base => (
                                            <option key={base.id} value={base.id}>{base.name}</option>
                                        ))}
                                    </select>
                                </InputGroup>
                            )}
                        </div>
                        <Button type="submit" variant="primary">创建用户</Button>
                    </form>
                )}
            </div>

            {/* 用户列表 */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">所有用户</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">显示名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">基地</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {roleOptions.find(r => r.value === u.role)?.label || u.role}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.base_name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenEditUser(u)}
                                        >
                                            编辑
                                        </Button>
                                        {/* <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleManagePermissions(u)}
                                        >
                                            <Settings className="w-4 h-4 mr-1" />
                                            权限
                                        </Button> */}
                                        {u.role !== 'superadmin' && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => {
                                                    confirmModal.open({
                                                        title: `确认删除用户 "${u.name}"?`,
                                                        description: '此操作不可恢复',
                                                        onConfirm: () => handleDeleteUser(u)
                                                    });
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 权限管理模态框 */}
            {showPermissionForm && selectedUser && (
                <Modal isOpen={showPermissionForm} onClose={() => setShowPermissionForm(false)} title={`管理用户权限: ${selectedUser.name}`}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            为 <strong>{selectedUser.name}</strong> 设置可以查看和提交的表单
                        </p>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {forms.filter(f => f.isActive).map(form => {
                                // 支持两种字段名格式：form_id (snake_case) 和 formId (camelCase)
                                const perm = userPermissions.find(p => 
                                    (p.form_id === form.id) || (p.formId === form.id)
                                );
                                
                                // 获取权限值，支持多种字段名格式
                                const canView = perm?.canView !== undefined ? perm.canView : 
                                               (perm?.can_view !== undefined ? perm.can_view : false);
                                const canSubmit = perm?.canSubmit !== undefined ? perm.canSubmit : 
                                                 (perm?.can_submit !== undefined ? perm.can_submit : false);
                                
                                console.log(`表单 ${form.name} (${form.id}) 的权限:`, { perm, canView, canSubmit });
                                
                                return (
                                    <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <span className="font-medium">{form.name}</span>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={canView}
                                                    onChange={(e) => handleSetPermission(form.id, e.target.checked, canSubmit)}
                                                />
                                                <span className="text-sm">可查看</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={canSubmit}
                                                    onChange={(e) => handleSetPermission(form.id, canView, e.target.checked)}
                                                />
                                                <span className="text-sm">可提交</span>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="primary" onClick={() => setShowPermissionForm(false)}>完成</Button>
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

            {/* 编辑用户模态框 */}
            {editingUser && (
                <Modal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    title={`修改用户：${editingUser.name || editingUser.username}`}
                >
                    <div className="space-y-4">
                        {editError && (
                            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                                {editError}
                            </div>
                        )}
                        <InputGroup label="用户名">
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </InputGroup>
                        <InputGroup label="新密码（可选，留空则不修改）">
                            <input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="至少6位"
                            />
                        </InputGroup>
                        <InputGroup label="确认新密码">
                            <input
                                type="password"
                                value={editForm.confirmPassword}
                                onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="再次输入新密码"
                            />
                        </InputGroup>
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setEditingUser(null)}>取消</Button>
                            <Button variant="primary" onClick={handleSaveEditUser}>保存</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

