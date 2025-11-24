import React, { useState, useEffect } from 'react';
import { Button, LoadingScreen, InputGroup } from '../utils/UI';
import { Save, Check, X } from 'lucide-react';
import { permissionsAPI, formsAPI, usersAPI } from '../utils/api';

export default function ManageUserPermissionsPanel({ userId, getCollectionHook, onClose }) {
    const { data: forms } = getCollectionHook('forms');
    const { data: users } = getCollectionHook('allAppUsers');
    const [selectedUser, setSelectedUser] = useState(userId || null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // 加载用户权限
    useEffect(() => {
        if (selectedUser) {
            loadPermissions();
        }
    }, [selectedUser]);

    const loadPermissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const perms = await permissionsAPI.getUserPermissions(selectedUser);
            setPermissions(perms);
        } catch (err) {
            setError(err.message || '加载权限失败');
        } finally {
            setLoading(false);
        }
    };

    // 切换权限
    const togglePermission = (formId, type) => {
        setPermissions(prev => {
            const existing = prev.find(p => p.form_id === formId);
            if (existing) {
                return prev.map(p => 
                    p.form_id === formId 
                        ? { ...p, [type]: !p[type] }
                        : p
                );
            } else {
                return [...prev, {
                    form_id: formId,
                    can_view: type === 'can_view' ? true : false,
                    can_submit: type === 'can_submit' ? true : false
                }];
            }
        });
    };

    // 保存权限
    const handleSave = async () => {
        if (!selectedUser) {
            setError('请先选择用户');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await permissionsAPI.batchSetUserPermissions(selectedUser, permissions);
            onClose();
        } catch (err) {
            setError(err.message || '保存权限失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen message="加载权限中..." />;

    const user = users.find(u => u.id === selectedUser);

    return (
        <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">管理用户表单权限</h2>
                <Button variant="outline" onClick={onClose}>
                    <X className="w-5 h-5 mr-2" /> 关闭
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* 选择用户 */}
            <InputGroup label="选择用户">
                <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="">请选择用户...</option>
                    {users
                        .filter(u => u.role !== 'superadmin' && (u.role === 'company_asset' || u.role === 'company_finance'))
                        .map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name} ({u.role === 'company_asset' ? '公司资产员' : u.role === 'company_finance' ? '公司财务' : u.role})
                            </option>
                        ))}
                </select>
            </InputGroup>

            {selectedUser && (
                <>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            正在为 <strong>{user?.name}</strong> 设置表单权限
                        </p>
                    </div>

                    {/* 权限表格 */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">表单名称</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">可查看</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">可提交</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forms.filter(f => f.isActive).map(form => {
                                    const perm = permissions.find(p => p.form_id === form.id);
                                    return (
                                        <tr key={form.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {form.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => togglePermission(form.id, 'can_view')}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                                        perm?.can_view
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {perm?.can_view && <Check className="w-4 h-4 text-white" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => togglePermission(form.id, 'can_submit')}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                                        perm?.can_submit
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {perm?.can_submit && <Check className="w-4 h-4 text-white" />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="primary" onClick={handleSave} disabled={saving}>
                            <Save className="w-5 h-5 mr-2" /> 保存权限
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

