import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, User, LogOut, FileText, Folder, Plus, ChevronDown, ChevronRight, Trash2, Download, Upload, Eye, Settings, Users, X, Loader as Spinner, Database, Box, RefreshCw, AlertTriangle, Check } from 'lucide-react';

// 导入拆分出来的组件
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { LoadingScreen } from './utils/UI';
import { generateId, loadInitialCollections } from './utils/helpers';

// --- LocalStorage Setup ---
const LOCAL_STORAGE_KEY = 'ASSET_MANAGER_V2_DATA';
const CURRENT_USER_ID_KEY = 'ASSET_MANAGER_CURRENT_USER_ID';

// Custom hook to manage all collections and persistence
function useLocalStorageCollections() {
    const [collections, setCollections] = useState(loadInitialCollections());

    // Effect to persist changes to LocalStorage whenever collections state updates
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collections));
            // console.log("Data persisted to LocalStorage.");
        } catch (error) {
            console.error("Error saving data to localStorage:", error);
        }
    }, [collections]);

    // Function to update a specific collection
    const updateCollection = useCallback((collectionName, updater) => {
        setCollections(prev => {
            const newCollection = typeof updater === 'function' 
                ? updater(prev[collectionName] || []) 
                : updater;
            
            return {
                ...prev,
                [collectionName]: newCollection
            };
        });
    }, []);

    // Helper to get collection data (to mimic the old hook structure)
    const getCollectionHook = useCallback((collectionName) => {
        return {
            data: collections[collectionName] || [],
            loading: false, // LocalStorage is always fast
            error: null,
            // Pass the collection updater function directly
            update: (updater) => updateCollection(collectionName, updater) 
        };
    }, [collections, updateCollection]);

    return { getCollectionHook, updateCollection, collections };
}

// --- Mock Data Setup (Keep this for initialization) ---
const createMockDataWithForms = () => {
    const mockUsers = [
        { id: 'user1', name: '子账户1', role: 'subaccount' },
        { id: 'user2', name: '子账户2', role: 'subaccount' },
        { id: 'user3', name: '子账户3', role: 'subaccount' },
        { id: 'user4', name: '子账户4', role: 'subaccount' },
        { id: 'user5', name: '子账户5', role: 'subaccount' },
        { id: 'admin', name: '管理员', role: 'admin' },
        { id: 'superadmin', name: '超级管理员', role: 'superadmin' },
    ];

    const mockForms = [
        {
            id: 'form1',
            name: '附表1：存货入出库管理台账',
            isActive: true,
            fields: [
                { id: 'field1', name: '日期', type: 'date', active: true },
                { id: 'field2', name: '存货名称', type: 'text', active: true },
                { id: 'field3', name: '规格型号', type: 'text', active: true },
                { id: 'field4', name: '入库数量', type: 'number', active: true },
                { id: 'field5', name: '出库数量', type: 'number', active: true },
                { id: 'field6', name: '结余数量', type: 'formula', active: true, formula: '期初结余 + 入库数量 - 出库数量' },
                { id: 'field7', name: '单价', type: 'number', active: true },
                { id: 'field8', name: '金额', type: 'formula', active: true, formula: '结余数量 * 单价' },
            ]
        },
        {
            id: 'form2',
            name: '附表2：存货盘底表',
            isActive: true,
            fields: [
                { id: 'field9', name: '盘点日期', type: 'date', active: true },
                { id: 'field10', name: '存货名称', type: 'text', active: true },
                { id: 'field11', name: '账面数量', type: 'number', active: true },
                { id: 'field12', name: '实际数量', type: 'number', active: true },
                { id: 'field13', name: '盘盈数量', type: 'formula', active: true, formula: '实际数量 - 账面数量' },
                { id: 'field14', name: '盘亏数量', type: 'formula', active: true, formula: '账面数量 - 实际数量' },
                { id: 'field15', name: '备注', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form3',
            name: '附表3：固定资产使用情况登记表',
            isActive: true,
            fields: [
                { id: 'field16', name: '资产编号', type: 'text', active: true },
                { id: 'field17', name: '资产名称', type: 'text', active: true },
                { id: 'field18', name: '使用部门', type: 'text', active: true },
                { id: 'field19', name: '使用人', type: 'text', active: true },
                { id: 'field20', name: '使用日期', type: 'date', active: true },
                { id: 'field21', name: '使用状态', type: 'select', active: true, options: ['在用', '闲置', '维修中', '报废'] },
                { id: 'field22', name: '备注', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form4',
            name: '附表4：固定资产盘底表',
            isActive: true,
            fields: [
                { id: 'field23', name: '盘点日期', type: 'date', active: true },
                { id: 'field24', name: '资产编号', type: 'text', active: true },
                { id: 'field25', name: '资产名称', type: 'text', active: true },
                { id: 'field26', name: '账面数量', type: 'number', active: true },
                { id: 'field27', name: '实际数量', type: 'number', active: true },
                { id: 'field28', name: '盘盈数量', type: 'formula', active: true, formula: '实际数量 - 账面数量' },
                { id: 'field29', name: '盘亏数量', type: 'formula', active: true, formula: '账面数量 - 实际数量' },
                { id: 'field30', name: '处理意见', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form5',
            name: '附表5：固定资产处置表',
            isActive: true,
            fields: [
                { id: 'field31', name: '资产编号', type: 'text', active: true },
                { id: 'field32', name: '资产名称', type: 'text', active: true },
                { id: 'field33', name: '原值', type: 'number', active: true },
                { id: 'field34', name: '已提折旧', type: 'number', active: true },
                { id: 'field35', name: '净值', type: 'formula', active: true, formula: '原值 - 已提折旧' },
                { id: 'field36', name: '处置原因', type: 'select', active: true, options: ['报废', '出售', '捐赠', '其他'] },
                { id: 'field37', name: '处置日期', type: 'date', active: true },
                { id: 'field38', name: '处置收入', type: 'number', active: true },
                { id: 'field39', name: '备注', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form6',
            name: '附表6：低值易耗品管理台账',
            isActive: true,
            fields: [
                { id: 'field40', name: '日期', type: 'date', active: true },
                { id: 'field41', name: '物品名称', type: 'text', active: true },
                { id: 'field42', name: '规格型号', type: 'text', active: true },
                { id: 'field43', name: '单位', type: 'text', active: true },
                { id: 'field44', name: '入库数量', type: 'number', active: true },
                { id: 'field45', name: '领用数量', type: 'number', active: true },
                { id: 'field46', name: '结余数量', type: 'formula', active: true, formula: '期初结余 + 入库数量 - 领用数量' },
                { id: 'field47', name: '单价', type: 'number', active: true },
                { id: 'field48', name: '金额', type: 'formula', active: true, formula: '结余数量 * 单价' },
                { id: 'field49', name: '领用人', type: 'text', active: true },
            ]
        },
        {
            id: 'form7',
            name: '附表7：低值易耗品盘底表',
            isActive: true,
            fields: [
                { id: 'field50', name: '盘点日期', type: 'date', active: true },
                { id: 'field51', name: '物品名称', type: 'text', active: true },
                { id: 'field52', name: '账面数量', type: 'number', active: true },
                { id: 'field53', name: '实际数量', type: 'number', active: true },
                { id: 'field54', name: '盘盈数量', type: 'formula', active: true, formula: '实际数量 - 账面数量' },
                { id: 'field55', name: '盘亏数量', type: 'formula', active: true, formula: '账面数量 - 实际数量' },
                { id: 'field56', name: '备注', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form8',
            name: '附表8：生物资产管理台账',
            isActive: true,
            fields: [
                { id: 'field57', name: '日期', type: 'date', active: true },
                { id: 'field58', name: '生物资产名称', type: 'text', active: true },
                { id: 'field59', name: '品种', type: 'text', active: true },
                { id: 'field60', name: '数量', type: 'number', active: true },
                { id: 'field61', name: '单位', type: 'text', active: true },
                { id: 'field62', name: '重量/体积', type: 'number', active: true },
                { id: 'field63', name: '单价', type: 'number', active: true },
                { id: 'field64', name: '金额', type: 'formula', active: true, formula: '数量 * 单价' },
                { id: 'field65', name: '生长阶段', type: 'select', active: true, options: ['幼苗期', '生长期', '成熟期', '收获期'] },
                { id: 'field66', name: '备注', type: 'textarea', active: true },
            ]
        },
        {
            id: 'form9',
            name: '附表9：生物资产盘点审核统计表',
            isActive: true,
            fields: [
                { id: 'field67', name: '盘点日期', type: 'date', active: true },
                { id: 'field68', name: '生物资产名称', type: 'text', active: true },
                { id: 'field69', name: '品种', type: 'text', active: true },
                { id: 'field70', name: '账面数量', type: 'number', active: true },
                { id: 'field71', name: '实际数量', type: 'number', active: true },
                { id: 'field72', name: '盘盈数量', type: 'formula', active: true, formula: '实际数量 - 账面数量' },
                { id: 'field73', name: '盘亏数量', type: 'formula', active: true, formula: '账面数量 - 实际数量' },
                { id: 'field74', name: '审核人', type: 'text', active: true },
                { id: 'field75', name: '审核日期', type: 'date', active: true },
                { id: 'field76', name: '审核意见', type: 'textarea', active: true },
            ]
        }
    ];

    const mockFiles = [
        { id: 'file1', name: '资产管理规定.pdf', url: '#', uploadedBy: 'admin', allowedUsers: ['user1', 'user2', 'user3', 'user4', 'user5'] },
        { id: 'file2', name: '申请表模板.xlsx', url: '#', uploadedBy: 'admin', allowedUsers: ['user1', 'user2', 'user3', 'user4', 'user5'] },
    ];

    return {
        allAppUsers: mockUsers,
        forms: mockForms,
        files: mockFiles,
        assets: [], // Start with empty assets
    };
};

// --- Main App Component ---
function App() {
    const { getCollectionHook, updateCollection, collections } = useLocalStorageCollections();
    const [currentUserId, setCurrentUserId] = useState(() => {
        return localStorage.getItem(CURRENT_USER_ID_KEY) || null;
    });
    const [isInitialized, setIsInitialized] = useState(false);

    // Get current user object
    const currentUser = useMemo(() => {
        if (!currentUserId) return null;
        const allUsers = collections.allAppUsers || [];
        return allUsers.find(u => u.id === currentUserId) || null;
    }, [currentUserId, collections.allAppUsers]);

    // Initialize mock data if collections are empty
    useEffect(() => {
        const hasData = collections.allAppUsers?.length > 0 || 
                       collections.forms?.length > 0 || 
                       collections.files?.length > 0;
        
        if (!hasData && !isInitialized) {
            console.log("Initializing mock data...");
            const mockData = createMockDataWithForms();
            updateCollection('allAppUsers', mockData.allAppUsers);
            updateCollection('forms', mockData.forms);
            updateCollection('files', mockData.files);
            updateCollection('assets', mockData.assets);
            setIsInitialized(true);
        }
    }, [collections, updateCollection, isInitialized]);

    // Handle login
    const handleLogin = (userId) => {
        setCurrentUserId(userId);
        localStorage.setItem(CURRENT_USER_ID_KEY, userId);
    };

    // Handle logout
    const handleLogout = () => {
        setCurrentUserId(null);
        localStorage.removeItem(CURRENT_USER_ID_KEY);
    };

    // Show loading screen while initializing
    if (!isInitialized && collections.allAppUsers?.length === 0) {
        return <LoadingScreen message="正在初始化系统..." />;
    }

    // Show login screen if no user is logged in
    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} getCollectionHook={getCollectionHook} />;
    }

    // Show dashboard for logged in user
    return (
        <Dashboard 
            user={currentUser} 
            onLogout={handleLogout} 
            getCollectionHook={getCollectionHook}
        />
    );
}

export default App;