import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Settings, Users, BarChart3, Plus, Trash2, ChevronDown, Loader, ArrowUp, ArrowDown, GripVertical, ShieldCheck } from 'lucide-react';
import { Button, Modal, useModal, InputGroup, Dropdown, LoadingScreen } from '../utils/UI';
import { generateId } from '../utils/helpers';
import { formsAPI, permissionsAPI } from '../utils/api';
import UserManagementPanel from './UserManagementPanel';
import ReportsPanel from './ReportsPanel';

// 3a. 管理表格模板 (ManageFormsPanel)
function ManageFormsPanel({ forms, loading, error, updateForms, onEditFields, getCollectionHook }) {
    // Removed internal getCollectionHook call
    const [newFormName, setNewFormName] = useState('');
    const [actionError, setActionError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingFormId, setUpdatingFormId] = useState(null); // 正在更新的表单ID
    const confirmModal = useModal();
    const [renamingForm, setRenamingForm] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [permissionFormId, setPermissionFormId] = useState(null);

    // 直接设置数据，避免触发useAPI的更新逻辑
    const setFormsData = useCallback((newForms) => {
        // 确保所有表单都有 fields 数组（即使是空数组），这样 useAPI 会识别为重新加载的数据
        const formsWithFields = newForms.map(form => ({
            ...form,
            fields: form.fields || []
        }));
        updateForms(() => formsWithFields);
    }, [updateForms]);

    // Add new form
    const handleAddForm = async (e) => {
        e.preventDefault();
        if (!newFormName.trim()) {
            setActionError("表格名称不能为空");
            return;
        }
        setIsSubmitting(true);
        setActionError(null);

        try {
            // 调用后端API创建表单
            const createdForm = await formsAPI.create({
                name: newFormName.trim(),
                isActive: true
            });

            // 重新加载所有表单数据，确保数据同步
            const updatedForms = await formsAPI.getAll();

            // 确保所有表单都有 fields 数组
            const formsWithFields = updatedForms.map(form => ({
                ...form,
                fields: form.fields || []
            }));

            setFormsData(formsWithFields);
            setNewFormName('');

            // 验证表单是否已存在于更新后的列表中
            // 注意：由于状态更新是异步的，forms可能还没更新，所以我们检查API返回的列表
            const formExists = formsWithFields.find(f => f.id === createdForm.id);
            if (formExists) {
                // 直接打开字段编辑界面
                onEditFields(createdForm.id);
            } else {
                console.error('创建的表单未找到:', createdForm.id, '可用表单ID:', formsWithFields.map(f => f.id));
                setActionError('表单创建成功，但无法打开编辑界面，请手动点击"编辑字段"按钮');
            }
        } catch (err) {
            setActionError(err.message || "添加表格失败");
            console.error('创建表单失败:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle Active Status
    const toggleFormStatus = async (form) => {
        setUpdatingFormId(form.id);
        setActionError(null);

        try {
            const newIsActive = !form.isActive;
            // 直接调用API更新单个表单
            await formsAPI.update(form.id, {
                name: form.name,
                isActive: newIsActive
            });

            // 重新加载所有表单数据，并使用特殊标记避免重复API调用
            const updatedForms = await formsAPI.getAll();
            // 使用特殊方式更新，避免触发useAPI的批量更新逻辑
            setFormsData(updatedForms);
        } catch (err) {
            setActionError(err.message || "更新表单状态失败");
        } finally {
            setUpdatingFormId(null);
        }
    };

    // Confirm Delete
    const openDeleteConfirm = (form) => {
        confirmModal.open({
            title: `确认删除表格 "${form.name}"?`,
            description: "警告：删除表格将同时删除所有相关的资产记录和历史数据！此操作不可恢复，请谨慎操作。建议先禁用表格而不是删除。",
            onConfirm: () => handleDeleteForm(form)
        });
    };

    // Execute Delete
    // Execute Delete
    const handleDeleteForm = async (form) => {
        try {
            await formsAPI.delete(form.id);
            updateForms(prevForms => prevForms.filter(f => f.id !== form.id));
            confirmModal.close();
        } catch (err) {
            console.error("Failed to delete form:", err);
            setActionError("删除表格失败: " + (err.message || "未知错误"));
            confirmModal.close();
        }
    };

    const handleRenameForm = async () => {
        if (!renamingForm) return;
        const trimmed = renameValue.trim();
        if (!trimmed) {
            setActionError('表格名称不能为空');
            return;
        }
        if (trimmed === renamingForm.name) {
            setRenamingForm(null);
            return;
        }
        try {
            await formsAPI.update(renamingForm.id, {
                name: trimmed,
                isActive: renamingForm.isActive
            });
            const refreshed = await formsAPI.getAll();
            setFormsData(refreshed);
            setRenamingForm(null);
        } catch (err) {
            setActionError(err.message || '重命名失败');
        }
    };

    if (loading) return <LoadingScreen message="加载表格模板中..." />;
    if (error) return <div className="text-red-500">加载表格模板失败: {error}</div>;

    return (
        <div className="space-y-8">
            {actionError && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {actionError}
                </div>
            )}

            {/* 1. 添加新表格 */}
            <div className="p-6 bg-white rounded-xl shadow-lg border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">创建新表格模板</h3>
                <form onSubmit={handleAddForm} className="flex space-x-4">
                    <input
                        type="text"
                        value={newFormName}
                        onChange={(e) => setNewFormName(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="输入表格名称，例如：附表12：新增资产申请表"
                    />
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        <Plus className="w-5 h-5 mr-2" />
                        创建并编辑表格
                    </Button>
                </form>
            </div>

            {/* 2. 现有表格列表 */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">现有表格模板</h3>
                <ul className="divide-y divide-gray-200">
                    {forms.map(form => (
                        <li key={form.id} className="py-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">{form.name}</span>
                                <span className="text-sm text-gray-500">{form.fields.length} 个字段</span>
                            </div>
                            <div className="space-x-2 flex items-center">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {form.isActive ? '激活' : '禁用'}
                                </span>
                                <Button size="sm" variant="outline" onClick={() => onEditFields(form.id)}>
                                    <Settings className="w-4 h-4 mr-1" /> 编辑字段
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setPermissionFormId(form.id)}>
                                    <ShieldCheck className="w-4 h-4 mr-1" /> 权限配置
                                </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { setRenamingForm(form); setRenameValue(form.name); }}
                                    >
                                        重命名
                                    </Button>
                                <Button
                                    size="sm"
                                    variant={form.isActive ? 'outline' : 'primary'}
                                    onClick={() => toggleFormStatus(form)}
                                    disabled={updatingFormId === form.id}
                                >
                                    {updatingFormId === form.id ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                                            处理中...
                                        </>
                                    ) : (
                                        form.isActive ? '禁用' : '激活'
                                    )}
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => openDeleteConfirm(form)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 确认模态框 */}
            {confirmModal.isOpen && (
                <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.close} title={confirmModal.props.title}>
                    <p className="text-gray-600">{confirmModal.props.description}</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" onClick={confirmModal.close}>取消</Button>
                        <Button variant="danger" onClick={confirmModal.props.onConfirm}>确认删除</Button>
                    </div>
                </Modal>
            )}

            {renamingForm && (
                <Modal
                    isOpen={!!renamingForm}
                    onClose={() => setRenamingForm(null)}
                    title={`重命名表格：${renamingForm.name}`}
                >
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="输入新的表格名称"
                        />
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setRenamingForm(null)}>取消</Button>
                            <Button variant="primary" onClick={handleRenameForm}>保存</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {permissionFormId && getCollectionHook && (
                <FormPermissionManager
                    formId={permissionFormId}
                    formName={forms.find(f => f.id === permissionFormId)?.name || '未知表格'}
                    getCollectionHook={getCollectionHook}
                    onClose={() => setPermissionFormId(null)}
                />
            )}
        </div>
    );
}

// 表单权限管理组件
function FormPermissionManager({ formId, formName, getCollectionHook, onClose }) {
    const { data: users } = getCollectionHook('allAppUsers');
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPermissions();
    }, [formId]);

    const loadPermissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const perms = await permissionsAPI.getFormPermissions(formId);
            setPermissions(perms);
        } catch (err) {
            setError(err.message || '加载权限失败');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = async (userId, type) => {
        const existing = permissions.find(p => p.user_id === userId);
        const currentCanView = existing?.can_view || false;
        const currentCanSubmit = existing?.can_submit || false;

        let newCanView = currentCanView;
        let newCanSubmit = currentCanSubmit;

        if (type === 'can_view') {
            newCanView = !currentCanView;
        } else if (type === 'can_submit') {
            newCanSubmit = !currentCanSubmit;
        }

        setSaving(true);
        try {
            await permissionsAPI.setFormUserPermission(userId, formId, newCanView, newCanSubmit);
            await loadPermissions();
        } catch (err) {
            setError(err.message || '保存权限失败');
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePermission = async (userId) => {
        setSaving(true);
        try {
            await permissionsAPI.deleteFormUserPermission(userId, formId);
            await loadPermissions();
        } catch (err) {
            setError(err.message || '删除权限失败');
        } finally {
            setSaving(false);
        }
    };

    // 过滤出非超级管理员用户（超级管理员默认拥有所有权限）
    const regularUsers = users?.filter(u => u.role !== 'superadmin') || [];

    return (
        <Modal
            isOpen={!!formId}
            onClose={onClose}
            title={`权限配置：${formName}`}
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                    为表格 <strong>{formName}</strong> 配置用户权限。超级管理员默认拥有所有权限。
                </p>

                {error && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <LoadingScreen message="加载权限中..." />
                ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {regularUsers.map(user => {
                            const perm = permissions.find(p => p.user_id === user.id);
                            const canView = perm?.can_view || false;
                            const canSubmit = perm?.can_submit || false;

                            return (
                                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email || user.role}</div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={canView}
                                                onChange={() => handleTogglePermission(user.id, 'can_view')}
                                                disabled={saving}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">可查看</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={canSubmit}
                                                onChange={() => handleTogglePermission(user.id, 'can_submit')}
                                                disabled={saving}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">可提交</span>
                                        </label>
                                        {(canView || canSubmit) && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleRemovePermission(user.id)}
                                                disabled={saving}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {regularUsers.length === 0 && !loading && (
                    <p className="text-sm text-gray-500 text-center py-4">暂无其他用户</p>
                )}

                <div className="flex justify-end mt-4">
                    <Button variant="primary" onClick={onClose} disabled={saving}>
                        {saving ? '保存中...' : '完成'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

// 3b. 管理表单字段 (ManageFormFieldsPanel)
function ManageFormFieldsPanel({ form: initialForm, forms, updateForms, onClose }) {
    // Removed internal getCollectionHook call
    const [isLoadingForm, setIsLoadingForm] = useState(false);

    // 从最新的表单列表中获取当前表单（确保数据同步）
    const form = forms?.find(f => f.id === initialForm.id) || initialForm;

    // 如果表单不存在或字段数据不完整，重新获取表单详情
    React.useEffect(() => {
        const fetchFormDetails = async () => {
            if (!form || !form.fields || (form.fields.length === 0 && initialForm.id)) {
                setIsLoadingForm(true);
                try {
                    const formDetails = await formsAPI.getById(initialForm.id);
                    // 更新表单列表中的这个表单
                    const updatedForms = await formsAPI.getAll();
                    updateForms(() => updatedForms);
                } catch (err) {
                    console.error('获取表单详情失败:', err);
                } finally {
                    setIsLoadingForm(false);
                }
            }
        };
        fetchFormDetails();
    }, [initialForm.id, form, forms, updateForms]); // Added dependencies for useEffect
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldFormula, setNewFieldFormula] = useState('');
    const [newFieldPrecision, setNewFieldPrecision] = useState(2);
    const [newFieldOptionsInput, setNewFieldOptionsInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [updatingFieldId, setUpdatingFieldId] = useState(null); // 正在更新的字段ID
    const confirmModal = useModal();
    const [fieldEditor, setFieldEditor] = useState(null);

    // For drag and drop
    const [draggedFieldId, setDraggedFieldId] = useState(null);
    const [dragOverFieldId, setDragOverFieldId] = useState(null);

    // For cascading field selector
    const [selectedFormId, setSelectedFormId] = useState(null);

    // Function to update the form object in the main collection
    const updateFormFields = useCallback((newFields) => {
        // Ensure all fields have order property
        const fieldsWithOrder = newFields.map((field, idx) => ({
            ...field,
            order: field.order !== undefined ? field.order : idx
        }));
        updateForms(prevForms => prevForms.map(f =>
            f.id === form.id ? { ...f, fields: fieldsWithOrder } : f
        ));
    }, [form.id, updateForms]);

    // Initialize order for existing fields if needed
    React.useEffect(() => {
        const needsOrderInit = form.fields.some(f => f.order === undefined);
        if (needsOrderInit) {
            const fieldsWithOrder = form.fields.map((field, idx) => ({
                ...field,
                order: field.order !== undefined ? field.order : idx
            }));
            updateFormFields(fieldsWithOrder);
        }
    }, [form.fields, updateFormFields]);

    const handleAddField = async (e) => {
        e.preventDefault();
        const name = newFieldName.trim();
        if (!name) { setActionError("字段名称不能为空"); return; }

        // 检查名称冲突
        if (form.fields.some(f => f.name === name)) {
            setActionError("字段名称已存在，请更改。");
            return;
        }

        setIsSubmitting(true);
        setActionError(null);

        try {
            // Calculate the next order value (highest order + 1, or 0 if no fields)
            const maxOrder = form.fields.length > 0
                ? Math.max(...form.fields.map(f => f.order || 0))
                : -1;

            // 调用后端API创建字段
            const fieldData = {
                name: name,
                type: newFieldType,
                active: true,
                order: maxOrder + 1,
                formula: newFieldType === 'formula' ? newFieldFormula.trim() : undefined
            };

            if (newFieldType === 'number' || newFieldType === 'formula') {
                fieldData.displayPrecision = Number(newFieldPrecision);
            }
            if (newFieldType === 'select') {
                const optionsList = parseOptionsInput(newFieldOptionsInput);
                if (optionsList.length === 0) {
                    setActionError("请至少添加一个下拉选项");
                    setIsSubmitting(false);
                    return;
                }
                fieldData.options = optionsList;
            }

            await formsAPI.addField(form.id, fieldData);

            // 重新加载所有表单数据以确保同步
            const updatedForms = await formsAPI.getAll();
            updateForms(() => updatedForms);

            setNewFieldName('');
            setNewFieldType('text');
            setNewFieldFormula('');
            setNewFieldPrecision(2);
            setNewFieldOptionsInput('');

        } catch (err) {
            setActionError(err.message || "添加字段失败");
            console.error('添加字段失败:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFieldStatus = async (field) => {
        const newStatus = !field.active;
        setUpdatingFieldId(field.id);
        setActionError(null);

        try {
            // 调用API更新字段状态
            await formsAPI.updateField(form.id, field.id, {
                active: newStatus
            });

            // 重新加载所有表单数据以确保同步
            const updatedForms = await formsAPI.getAll();
            updateForms(() => updatedForms);
        } catch (err) {
            setActionError(err.message || "更新字段状态失败");
        } finally {
            setUpdatingFieldId(null);
        }
    };

    const openDeleteConfirm = (field) => {
        confirmModal.open({
            title: `确认归档字段 "${field.name}"?`,
            description: "此操作将字段设为\"已归档\"。该字段将从表单中移除，但历史数据中仍会保留，不会影响旧记录的查看。",
            onConfirm: () => handleDeleteField(field)
        });
    };

    const handleDeleteField = (field) => {
        // We use archiving instead of actual deletion for safety
        if (field.active) {
            toggleFieldStatus(field);
        }
        confirmModal.close();
    };

    // Drag and drop handlers
    const handleDragStart = (e, fieldId) => {
        setDraggedFieldId(fieldId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', fieldId);
    };

    const handleDragOver = (e, fieldId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFieldId(fieldId);
    };

    const handleDragLeave = () => {
        setDragOverFieldId(null);
    };

    const handleDrop = (e, targetFieldId) => {
        e.preventDefault();

        if (!draggedFieldId || draggedFieldId === targetFieldId) {
            setDraggedFieldId(null);
            setDragOverFieldId(null);
            return;
        }

        const sortedFields = form.fields.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        const draggedIndex = sortedFields.findIndex(f => f.id === draggedFieldId);
        const targetIndex = sortedFields.findIndex(f => f.id === targetFieldId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedFieldId(null);
            setDragOverFieldId(null);
            return;
        }

        // Remove dragged field and insert at target position
        const draggedField = sortedFields[draggedIndex];
        sortedFields.splice(draggedIndex, 1);
        sortedFields.splice(targetIndex, 0, draggedField);

        // Update order values
        sortedFields.forEach((f, idx) => {
            f.order = idx;
        });

        updateFormFields(sortedFields);
        setDraggedFieldId(null);
        setDragOverFieldId(null);
    };

    const handleDragEnd = () => {
        setDraggedFieldId(null);
        setDragOverFieldId(null);
    };

    // Get all forms for cross-form field selection
    // Use passed forms prop instead of hook
    const allForms = forms || [];

    // Get available forms for cascading selector (current form + other forms)
    const availableForms = useMemo(() => {
        return allForms.filter(f => {
            // Include current form and other forms that have active number fields
            return f.id === form.id || f.fields.some(field => field.active && field.type === 'number');
        });
    }, [allForms, form.id]);

    // Get fields for selected form
    const fieldsForSelectedForm = useMemo(() => {
        if (!selectedFormId) {
            // If no form selected, show current form fields
            return form.fields
                .filter(field => field.active && field.type === 'number')
                .map(field => ({
                    name: field.name,
                    formName: form.name,
                    formId: form.id,
                    displayName: field.name
                }));
        }

        const selectedForm = allForms.find(f => f.id === selectedFormId);
        if (!selectedForm) return [];

        return selectedForm.fields
            .filter(field => field.active && field.type === 'number')
            .map(field => ({
                name: field.name,
                formName: selectedForm.name,
                formId: selectedForm.id,
                displayName: selectedForm.id === form.id ? field.name : `${selectedForm.name}.${field.name}`
            }));
    }, [selectedFormId, allForms, form]);

    const handleFieldEditorChange = (key, value) => {
        setFieldEditor(prev => prev ? {
            ...prev,
            values: {
                ...prev.values,
                [key]: value
            }
        } : prev);
    };

    const handleFieldEditorSave = async () => {
        if (!fieldEditor) return;
        const { original, values } = fieldEditor;
        const updates = {};

        const trimmedName = values.name.trim();
        if (!trimmedName) {
            setActionError('字段名称不能为空');
            return;
        }
        if (trimmedName !== original.name) {
            updates.name = trimmedName;
        }

        if (values.type && values.type !== original.type) {
            updates.type = values.type;
        }

        if (values.type === 'formula') {
            updates.formula = values.formula.trim();
        } else if (original.type === 'formula' && values.type !== 'formula') {
            updates.formula = null;
        }

        if (values.type === 'number' || values.type === 'formula') {
            updates.displayPrecision = Number(values.displayPrecision);
        }

        if (values.type === 'select') {
            const optionList = parseOptionsInput(values.optionsText);
            if (optionList.length === 0) {
                setActionError('下拉字段至少添加一个选项');
                return;
            }
            updates.options = optionList;
        } else if (original.type === 'select' && values.type !== 'select') {
            updates.options = null;
        }

        if (Object.keys(updates).length === 0) {
            setFieldEditor(null);
            return;
        }

        setUpdatingFieldId(original.id);
        try {
            await formsAPI.updateField(form.id, original.id, updates);
            const updatedForms = await formsAPI.getAll();
            updateForms(() => updatedForms);
            setFieldEditor(null);
        } catch (err) {
            setActionError(err.message || '更新字段失败');
        } finally {
            setUpdatingFieldId(null);
        }
    };

    const parseOptionsInput = useCallback((input) => {
        if (!input) return [];
        return input
            .split(/\n|,/)
            .map(option => option.trim())
            .filter(option => option.length > 0);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                    编辑表格: {form.name}
                </h2>
                <Button variant="outline" onClick={onClose}>
                    <ChevronDown className="w-5 h-5 rotate-90 mr-2" /> 返回表格管理
                </Button>
            </div>

            {actionError && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {actionError}
                </div>
            )}

            {/* 1. 添加新字段 */}
            <div className="p-6 bg-white rounded-xl shadow-lg border border-blue-200 space-y-4">
                <h3 className="text-xl font-bold text-gray-800">添加新字段</h3>
                <form onSubmit={handleAddField} className="space-y-4">
                    <div className="flex space-x-4">
                        <InputGroup label="字段名称" className="flex-grow">
                            <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="例如: 购入数量"
                            />
                        </InputGroup>
                        <InputGroup label="字段类型" className="w-40">
                            <select
                                value={newFieldType}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewFieldType(value);
                                    setNewFieldFormula('');
                                    if (value === 'number' || value === 'formula') {
                                        setNewFieldPrecision(2);
                                    }
                                    if (value !== 'select') {
                                        setNewFieldOptionsInput('');
                                    }
                                }}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="text">文本 (Text)</option>
                                <option value="number">数字 (Number)</option>
                                <option value="date">日期 (Date)</option>
                                <option value="textarea">长文本 (Textarea)</option>
                                <option value="formula">公式计算 (Formula)</option>
                                <option value="select">下拉单选 (Select)</option>
                            </select>
                        </InputGroup>
                    </div>

                    {['number', 'formula'].includes(newFieldType) && (
                        <InputGroup label="显示小数位数 (0-3)" className="w-40">
                            <select
                                value={newFieldPrecision}
                                onChange={(e) => setNewFieldPrecision(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                {[0, 1, 2, 3].map(value => (
                                    <option key={value} value={value}>
                                        {value} 位
                                    </option>
                                ))}
                            </select>
                        </InputGroup>
                    )}

                    {newFieldType === 'select' && (
                        <InputGroup label="下拉选项 (每行一个)">
                            <textarea
                                rows={4}
                                value={newFieldOptionsInput}
                                onChange={(e) => setNewFieldOptionsInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="例如：&#10;草鱼&#10;鲫鱼&#10;罗非鱼"
                            />
                        </InputGroup>
                    )}

                    {newFieldType === 'formula' && (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700">公式定义 (Formula)</label>
                            <p className="text-xs text-gray-500 mb-2">使用 `+`, `-`, `*`, `/` 和字段名称。可以选择当前表或其他表的字段 (如：`入库数量 * 单价` 或 `其他表名.字段名`)</p>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newFieldFormula}
                                    onChange={(e) => setNewFieldFormula(e.target.value)}
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono"
                                    placeholder="例如: 字段名称A + 字段名称B 或 其他表名.字段名"
                                />
                                <div className="flex space-x-2">
                                    <select
                                        value={selectedFormId || ''}
                                        onChange={(e) => {
                                            setSelectedFormId(e.target.value || null);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                    >
                                        <option value="">当前表 ({form.name})</option>
                                        {availableForms.filter(f => f.id !== form.id).map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldsForSelectedForm.length > 0 && (
                                        <select
                                            onChange={(e) => {
                                                const selectedField = fieldsForSelectedForm.find(f => f.displayName === e.target.value);
                                                if (selectedField) {
                                                    setNewFieldFormula(prev => `${prev}${prev.slice(-1) === ' ' ? '' : ' '}${selectedField.displayName} `);
                                                }
                                                e.target.value = ''; // Reset selection
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                            defaultValue=""
                                        >
                                            <option value="">选择字段...</option>
                                            {fieldsForSelectedForm.map((field, idx) => (
                                                <option key={idx} value={field.displayName}>
                                                    {field.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-center">
                        {isSubmitting ? <Loader className="w-5 h-5" /> : <Plus className="w-5 h-5 mr-2" />}
                        添加字段
                    </Button>
                </form>
            </div>

            {/* 2. 现有字段列表 */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">现有字段 ({form.fields.length})</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">排序</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">字段名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公式/ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {form.fields
                                .slice()
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((field, index) => (
                                    <tr
                                        key={field.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, field.id)}
                                        onDragOver={(e) => handleDragOver(e, field.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, field.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`cursor-move ${draggedFieldId === field.id ? 'opacity-50' : ''} ${dragOverFieldId === field.id ? 'bg-blue-50 border-2 border-blue-300' : ''}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center justify-center">
                                                <GripVertical className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {field.type === 'formula' ? '公式 (Formula)' :
                                                field.type === 'number' ? '数字 (Number)' : field.type === 'date' ? '日期 (Date)' : '文本 (Text)'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-sm truncate font-mono text-xs">
                                            {field.type === 'formula' ? field.formula : field.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {field.active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">激活</span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">已归档</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFieldEditor({
                                                    original: field,
                                                    values: {
                                                        name: field.name,
                                                        type: field.type,
                                                        formula: field.formula || '',
                                                        displayPrecision: typeof field.displayPrecision === 'number' ? field.displayPrecision : 2,
                                                        optionsText: Array.isArray(field.options) ? field.options.join('\n') : ''
                                                    }
                                                })}
                                            >
                                                编辑属性
                                            </Button>
                                            <Button
                                                variant={field.active ? "outline" : "primary"}
                                                onClick={() => toggleFieldStatus(field)}
                                                size="sm"
                                                disabled={updatingFieldId === field.id}
                                            >
                                                {updatingFieldId === field.id ? (
                                                    <>
                                                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                                                        处理中...
                                                    </>
                                                ) : (
                                                    field.active ? "删除/归档" : "重新激活"
                                                )}
                                            </Button>
                                            {/* {field.active && (
                                        <Button
                                            variant="danger"
                                            onClick={() => openDeleteConfirm(field)}
                                            size="sm"
                                        >
                                            删除/归档
                                        </Button>
                                        )} */}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 确认模态框 */}
            {confirmModal.isOpen && (
                <Modal isOpen={confirmModal.isOpen} onClose={confirmModal.close} title={confirmModal.props.title}>
                    <p className="text-gray-600">{confirmModal.props.description}</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button variant="outline" onClick={confirmModal.close}>取消</Button>
                        <Button variant="danger" onClick={confirmModal.props.onConfirm}>确认归档</Button>
                    </div>
                </Modal>
            )}

            {fieldEditor && (
                <Modal
                    isOpen={!!fieldEditor}
                    onClose={() => setFieldEditor(null)}
                    title={`编辑字段：${fieldEditor.original.name}`}
                >
                    <div className="space-y-4">
                        <InputGroup label="字段名称">
                            <input
                                type="text"
                                value={fieldEditor.values.name}
                                onChange={(e) => handleFieldEditorChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </InputGroup>
                        <InputGroup label="字段类型">
                            <select
                                value={fieldEditor.values.type}
                                onChange={(e) => handleFieldEditorChange('type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="text">文本 (Text)</option>
                                <option value="number">数字 (Number)</option>
                                <option value="date">日期 (Date)</option>
                                <option value="textarea">长文本 (Textarea)</option>
                                <option value="formula">公式计算 (Formula)</option>
                                <option value="select">下拉单选 (Select)</option>
                            </select>
                        </InputGroup>
                        {fieldEditor.values.type === 'formula' && (
                            <InputGroup label="公式定义">
                                <textarea
                                    rows={4}
                                    value={fieldEditor.values.formula}
                                    onChange={(e) => handleFieldEditorChange('formula', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono"
                                />
                            </InputGroup>
                        )}
                        {['number', 'formula'].includes(fieldEditor.values.type) && (
                            <InputGroup label="显示小数位数 (0-3)">
                                <select
                                    value={fieldEditor.values.displayPrecision}
                                    onChange={(e) => handleFieldEditorChange('displayPrecision', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                >
                                    {[0, 1, 2, 3].map(value => (
                                        <option key={value} value={value}>
                                            {value} 位
                                        </option>
                                    ))}
                                </select>
                            </InputGroup>
                        )}
                        {fieldEditor.values.type === 'select' && (
                            <InputGroup label="下拉选项（每行一个）">
                                <textarea
                                    rows={4}
                                    value={fieldEditor.values.optionsText}
                                    onChange={(e) => handleFieldEditorChange('optionsText', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </InputGroup>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => setFieldEditor(null)}>取消</Button>
                            <Button variant="primary" onClick={handleFieldEditorSave}>保存</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// Main SuperAdminPanel component
function SuperAdminPanel({ user, getCollectionHook }) {
    const [activeTab, setActiveTab] = useState('manageForms');
    const [editingFormId, setEditingFormId] = useState(null);

    const tabs = [
        { id: 'manageForms', label: '管理表格模板', icon: Settings },
        { id: 'manageUsers', label: '管理用户', icon: Users },
        { id: 'manageReports', label: '统计报表', icon: BarChart3 },
    ];

    // Find the form being edited
    const { data: forms, loading: formsLoading, error: formsError, update: updateForms } = getCollectionHook('forms');
    const editingForm = forms?.find(f => f.id === editingFormId);

    // 如果设置了 editingFormId 但表单还在加载中，显示加载状态
    if (editingFormId && formsLoading) {
        return <LoadingScreen message="加载表单数据中..." />;
    }

    // 如果设置了 editingFormId 但找不到表单，尝试通过 API 获取
    React.useEffect(() => {
        if (editingFormId && !editingForm && !formsLoading && forms) {
            // 尝试通过 API 获取单个表单
            formsAPI.getById(editingFormId).then(form => {
                if (form) {
                    // 确保表单有 fields 数组
                    const formWithFields = {
                        ...form,
                        fields: form.fields || []
                    };
                    // 如果找到了表单，更新 forms 列表
                    const existingIndex = forms.findIndex(f => f.id === editingFormId);
                    const updatedForms = existingIndex >= 0
                        ? forms.map((f, idx) => idx === existingIndex ? formWithFields : f)
                        : [...forms, formWithFields];
                    updateForms(updatedForms);
                }
            }).catch(err => {
                console.error('获取表单失败:', err);
            });
        }
    }, [editingFormId, editingForm, formsLoading, forms, updateForms]);

    if (editingForm) {
        return (
            <ManageFormFieldsPanel
                form={editingForm}
                forms={forms}
                updateForms={updateForms}
                onClose={() => setEditingFormId(null)}
            />
        );
    }

    return (
        <div>
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="mt-6">
                {activeTab === 'manageForms' && (
                    <ManageFormsPanel
                        forms={forms}
                        loading={formsLoading}
                        error={formsError}
                        updateForms={updateForms}
                        onEditFields={setEditingFormId}
                        getCollectionHook={getCollectionHook}
                    />
                )}
                {activeTab === 'manageUsers' && <UserManagementPanel getCollectionHook={getCollectionHook} />}
                {activeTab === 'manageReports' && (
                    <ReportsPanel
                        user={user}
                        getCollectionHook={getCollectionHook}
                    />
                )}
            </div>
        </div>
    );
}

// Tabs component (moved from utils to here since it's used in this component)
function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${isActive
                                    ? 'border-blue-600 text-blue-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-md
              `}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon
                                className={`w-5 h-5 mr-2
                  ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                `}
                            />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

export default SuperAdminPanel;