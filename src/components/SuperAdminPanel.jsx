import React, { useState, useCallback, useMemo } from 'react';
import { Settings, Users, Plus, Trash2, ChevronDown, Loader } from 'lucide-react';
import { Button, Modal, useModal, InputGroup, Dropdown, LoadingScreen } from '../utils/UI';
import { generateId } from '../utils/helpers';

// 3a. 管理表格模板 (ManageFormsPanel)
function ManageFormsPanel({ getCollectionHook, onEditFields }) {
    const { data: forms, loading, error, update: updateForms } = getCollectionHook('forms');
    const [newFormName, setNewFormName] = useState('');
    const [actionError, setActionError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const confirmModal = useModal();
    
    // Add new form
    const handleAddForm = (e) => {
        e.preventDefault();
        if (!newFormName.trim()) {
            setActionError("表格名称不能为空");
            return;
        }
        setIsSubmitting(true);
        setActionError(null);
        
        try {
            const newForm = {
                id: generateId(),
                name: newFormName.trim(),
                isActive: true,
                fields: [], // Start with no fields
            };
            
            updateForms(prevForms => [...prevForms, newForm]);
            setNewFormName('');
            onEditFields(newForm.id); // Automatically open field management for the new form
        } catch (err) {
            setActionError(err.message || "添加表格失败");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Toggle Active Status
    const toggleFormStatus = (form) => {
        updateForms(prevForms => prevForms.map(f => 
            f.id === form.id
            ? { ...f, isActive: !f.isActive }
            : f
        ));
    };

    // Confirm Delete
    const openDeleteConfirm = (form) => {
        confirmModal.open({
            title: `确认删除表格 "${form.name}"?`,
            description: "警告：删除表格模板将不会删除已提交的记录，但会阻止员工提交新记录。建议先禁用。",
            onConfirm: () => handleDeleteForm(form)
        });
    };
    
    // Execute Delete
    const handleDeleteForm = (form) => {
        updateForms(prevForms => prevForms.filter(f => f.id !== form.id));
        confirmModal.close();
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
                        创建并编辑字段
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
                                <Button size="sm" variant={form.isActive ? 'outline' : 'primary'} onClick={() => toggleFormStatus(form)}>
                                    {form.isActive ? '禁用' : '激活'}
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
        </div>
    );
}

// 3b. 管理表单字段 (ManageFormFieldsPanel)
function ManageFormFieldsPanel({ form, getCollectionHook, onClose }) {
    const { update: updateForms } = getCollectionHook('forms');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldFormula, setNewFieldFormula] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState(null);
    const confirmModal = useModal();
    
    // Function to update the form object in the main collection
    const updateFormFields = useCallback((newFields) => {
        updateForms(prevForms => prevForms.map(f =>
            f.id === form.id ? { ...f, fields: newFields } : f
        ));
    }, [form.id, updateForms]);

    const handleAddField = (e) => {
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
            const newField = {
                id: generateId(),
                name: name,
                type: newFieldType,
                active: true,
                formula: newFieldType === 'formula' ? newFieldFormula.trim() : undefined,
                history: [{ status: "created", timestamp: Date.now() }]
            };
            
            updateFormFields([...form.fields, newField]);
            
            setNewFieldName('');
            setNewFieldType('text');
            setNewFieldFormula('');
            
        } catch (err) {
            setActionError(err.message || "添加字段失败");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const toggleFieldStatus = (field) => {
        const newStatus = !field.active;
        const newFields = form.fields.map(f => 
            f.id === field.id
            ? { ...f, active: newStatus, history: [...(f.history || []), { status: newStatus ? "activated" : "archived", timestamp: Date.now() }] }
            : f
        );
        updateFormFields(newFields);
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

    // Only allow active, non-formula number fields for use in formulas
    const availableFieldNames = useMemo(() => 
        form.fields.filter(f => f.active && f.type === 'number').map(f => f.name)
    , [form.fields]);

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
                                onChange={(e) => { setNewFieldType(e.target.value); setNewFieldFormula(''); }}
                                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="text">文本 (Text)</option>
                                <option value="number">数字 (Number)</option>
                                <option value="date">日期 (Date)</option>
                                <option value="textarea">长文本 (Textarea)</option>
                                <option value="formula">公式计算 (Formula)</option>
                            </select>
                        </InputGroup>
                    </div>
                    
                    {newFieldType === 'formula' && (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700">公式定义 (Formula)</label>
                            <p className="text-xs text-gray-500 mb-2">使用 `+`, `-`, `*`, `/` 和字段名称 (如：`入库数量 * 单价`)</p>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newFieldFormula}
                                    onChange={(e) => setNewFieldFormula(e.target.value)}
                                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono"
                                    placeholder="例如: 字段名称A + 字段名称B"
                                />
                                <Dropdown 
                                    label="插入字段" 
                                    options={availableFieldNames} 
                                    onSelect={(fieldName) => setNewFieldFormula(prev => `${prev}${prev.slice(-1) === ' ' ? '' : ' '}${fieldName} `)}
                                />
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">字段名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公式/ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {form.fields.map(field => (
                                <tr key={field.id}>
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
                                            variant={field.active ? "outline" : "primary"}
                                            onClick={() => toggleFieldStatus(field)}
                                            size="sm"
                                        >
                                            {field.active ? "归档" : "重新激活"}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => openDeleteConfirm(field)}
                                            size="sm"
                                            disabled={!field.active}
                                        >
                                            删除/归档
                                        </Button>
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
        </div>
    );
}

// 3c. 管理所有用户 (ManageUsersPanel)
function ManageUsersPanel({ user, getCollectionHook }) {
  const { data: allAppUsers, loading, error } = getCollectionHook('allAppUsers');
  
  if (loading) {
    return <LoadingScreen message="正在加载所有用户..." />;
  }
  if (error) {
    return <div className="text-red-500">加载用户失败: {error}</div>;
  }
  
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">系统所有用户</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户 ID (id)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allAppUsers.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{u.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  ];

  // Find the form being edited
  const { data: forms } = getCollectionHook('forms');
  const editingForm = forms?.find(f => f.id === editingFormId);

  if (editingForm) {
      return (
          <ManageFormFieldsPanel 
              form={editingForm} 
              getCollectionHook={getCollectionHook} 
              onClose={() => setEditingFormId(null)} 
          />
      );
  }

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'manageForms' && <ManageFormsPanel user={user} getCollectionHook={getCollectionHook} onEditFields={setEditingFormId} />}
        {activeTab === 'manageUsers' && <ManageUsersPanel user={user} getCollectionHook={getCollectionHook} />}
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
                ${
                  isActive
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