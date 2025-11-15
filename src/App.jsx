import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, User, LogOut, FileText, Folder, Plus, ChevronDown, ChevronRight, Trash2, Download, Upload, Eye, Settings, Users, X, Loader as Spinner, Database, Box, RefreshCw, AlertTriangle, Check } from 'lucide-react';

// 导入拆分出来的组件
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { LoadingScreen } from './utils/UI';
import { generateId, loadInitialCollections } from './utils/helpers';
import { createMockDataWithForms } from './data/mockData';

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

// --- Mock Data Setup ---
// 使用 src/data/mockData.js 中的函数，它包含大量测试数据

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