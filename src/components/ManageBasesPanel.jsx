import React, { useState } from 'react';
import { Button, Modal, useModal, InputGroup, LoadingScreen } from '../utils/UI';
import { Plus, Trash2 } from 'lucide-react';
import { basesAPI } from '../utils/api';
import { generateId } from '../utils/helpers';

export default function ManageBasesPanel({ getCollectionHook }) {
    const { data: bases, loading, error, update } = getCollectionHook('bases');
    const [newBaseName, setNewBaseName] = useState('');
    const [newBaseDescription, setNewBaseDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState(null);
    const confirmModal = useModal();

    const handleAddBase = async (e) => {
        e.preventDefault();
        if (!newBaseName.trim()) {
            setActionError("基地名称不能为空");
            return;
        }
        setIsSubmitting(true);
        setActionError(null);
        
        try {
            await basesAPI.create({
                name: newBaseName.trim(),
                description: newBaseDescription.trim() || null
            });
            setNewBaseName('');
            setNewBaseDescription('');
            // 重新加载数据
            const updated = await basesAPI.getAll();
            update(updated);
        } catch (err) {
            setActionError(err.message || "添加基地失败");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteConfirm = (base) => {
        confirmModal.open({
            title: `确认删除基地 "${base.name}"?`,
            description: "警告：删除基地将影响关联的用户和数据。建议先迁移用户到其他基地。",
            onConfirm: () => handleDeleteBase(base)
        });
    };

    const handleDeleteBase = async (base) => {
        try {
            await basesAPI.delete(base.id);
            const updated = await basesAPI.getAll();
            update(updated);
            confirmModal.close();
        } catch (err) {
            setActionError(err.message || "删除基地失败");
            confirmModal.close();
        }
    };

    if (loading) return <LoadingScreen message="加载基地数据中..." />;
    if (error) return <div className="text-red-500">加载基地数据失败: {error}</div>;

    return (
        <div className="space-y-8">
            {actionError && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {actionError}
                </div>
            )}
            
            {/* 添加新基地 */}
            <div className="p-6 bg-white rounded-xl shadow-lg border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">创建新基地</h3>
                <form onSubmit={handleAddBase} className="space-y-4">
                    <InputGroup label="基地名称">
                        <input
                            type="text"
                            value={newBaseName}
                            onChange={(e) => setNewBaseName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="例如：北京基地"
                        />
                    </InputGroup>
                    <InputGroup label="基地描述（可选）">
                        <textarea
                            value={newBaseDescription}
                            onChange={(e) => setNewBaseDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            rows="2"
                            placeholder="基地描述"
                        />
                    </InputGroup>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        <Plus className="w-5 h-5 mr-2" />
                        创建基地
                    </Button>
                </form>
            </div>
            
            {/* 现有基地列表 */}
            <div className="p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">现有基地</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">基地名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bases.map(base => (
                                <tr key={base.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{base.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{base.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button
                                            variant="danger"
                                            onClick={() => openDeleteConfirm(base)}
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> 删除
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
                        <Button variant="danger" onClick={confirmModal.props.onConfirm}>确认删除</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

