import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// --- 图标 (Icons remain the same) ---
const Check = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
const ChevronDown = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const ChevronLeft = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);
const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);
const UploadCloud = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
    <path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path>
  </svg>
);
const FileText = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line>
    <line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line>
  </svg>
);
const User = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const Users = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const Settings = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 .54 1.74l-.01 2.19a2 2 0 0 1-.54 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-.54-1.74l.01-2.19a2 2 0 0 1 .54-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const Trash2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
    <path d="M10 11v6"></path><path d="M14 11v6"></path>
    <path d="M5 6l1.39 1.39a2 2 0 0 0 1.41 0.59h6.4a2 2 0 0 0 1.41-0.59L19 6"></path>
  </svg>
);
const Plus = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const X = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const LogOut = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);
const AlertTriangle = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line>
  </svg>
);
const Database = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5v14a9 3 0 0 0 18 0V5"></path><path d="M3 12a9 3 0 0 0 18 0"></path>
  </svg>
);
const Box = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" x2="12" y1="22.08" y2="12"></line>
  </svg>
);
const RefreshCw = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12A9 9 0 0 1 9 3v1a6 6 0 0 0-6 6H0"></path>
    <path d="M21 12A9 9 0 0 1 15 21v-1a6 6 0 0 0 6-6h0"></path>
    <path d="M3 21v-1a6 6 0 0 0 6-6H3"></path>
    <path d="M21 3v1a6 6 0 0 0-6 6h6"></path>
  </svg>
);

// --- LocalStorage Setup ---
const LOCAL_STORAGE_KEY = 'asset_manager_V2_DATA';
const CURRENT_USER_ID_KEY = 'asset_manager_CURRENT_USER_ID';

/** Generates a simple unique ID */
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Function to safely load all data from LocalStorage
const loadInitialCollections = () => {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
    }
    // Initial empty structure
    // NOTE: 'forms' replaces 'assetFields', 'assets' now stores data by formId
    return {
        allAppUsers: [],
        forms: [], // New collection for form templates
        files: [],
        assets: [], // Store records as { formId: "formId", subAccountId: "...", batchData: [...] }
    };
};

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

// --- Formula Logic ---

/**
 * Executes a calculation based on a simple formula string.
 * Supports +, -, *, /. Example: "fieldIdA + fieldIdB * 2"
 * Note: Only supports single operation per formula for simplicity.
 */
const calculateFormula = (formula, rowData, fields) => {
    if (!formula || typeof formula !== 'string') return '';
    
    // Create a map of field names to their current numerical value
    const valueMap = fields.reduce((acc, field) => {
        // Use field name as key, retrieve value from rowData by field ID
        // Note: Field IDs are used in rowData keys, but names are used in the formula string.
        const value = Number(rowData[field.id]) || 0;
        acc[field.name] = value;
        return acc;
    }, {});

    // Regex to identify field names in the formula (must match names used in valueMap)
    // This regex looks for sequences of Chinese characters, English letters, numbers, spaces, and parentheses.
    // The key is to map the user-friendly field names in the formula to the numerical values.
    const fieldNameRegex = /([a-zA-Z0-9\u4e00-\u9fa5\s\(\)\[\]\{\}]+)/g; 
    
    let calculationString = formula.replace(fieldNameRegex, (match) => {
        const trimmedMatch = match.trim();
        // Replace field NAME with its value from valueMap
        return valueMap[trimmedMatch] !== undefined ? valueMap[trimmedMatch] : 0;
    });

    // Basic sanitization: only allow numbers and basic arithmetic operators
    // We strictly check the resulting string before calculation.
    if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(calculationString)) {
         return 'Error: Invalid characters or unmatched field names in formula';
    }
    
    // Use the Function constructor for safe dynamic calculation instead of eval()
    try {
        // Create an anonymous function that returns the result of the calculation string.
        // This is safer than direct eval as it runs in its own scope.
        const calculate = new Function('return ' + calculationString);
        const result = calculate();
        
        if (isNaN(result) || !isFinite(result)) return 'Error: Calculation failed';
        
        // Round to 2 decimal places for financial/quantity results
        return parseFloat(result.toFixed(2)); 
    } catch (e) {
        // Catch syntax or runtime errors during calculation
        return 'Error: Invalid formula structure';
    }
};

// --- App (主组件) ---
function App() {
  const { getCollectionHook, updateCollection } = useLocalStorageCollections();
  
  // Use a simple boolean flag to indicate initialization is done
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [appUser, setAppUser] = useState(null); 
  const [error, setError] = useState(null); 
  
  // Custom hook replacement for Firebase Firestore collection
  const { data: allAppUsers, loading: usersLoading } = getCollectionHook('allAppUsers');
  
  // 1. Initial Load and Auth Simulation
  useEffect(() => {
    // 模拟 Auth 状态检查
    const storedUserId = localStorage.getItem(CURRENT_USER_ID_KEY);
    
    if (storedUserId) {
        // 尝试从加载的用户数据中找到当前登录的用户
        const foundUser = allAppUsers.find(u => u.id === storedUserId);
        if (foundUser) {
            setAppUser(foundUser);
        } else {
            // 用户ID存在但用户数据不存在 (可能被删除了)
            localStorage.removeItem(CURRENT_USER_ID_KEY);
        }
    }
    setIsDataLoaded(true);
  }, [allAppUsers]); // 依赖 allAppUsers 以便在数据更新时重新检查登录状态

  // 模拟登录函数
  const handleLogin = useCallback((user) => {
      localStorage.setItem(CURRENT_USER_ID_KEY, user.id);
      setAppUser(user);
  }, []);

  // 模拟登出函数
  const handleLogout = useCallback(() => {
      localStorage.removeItem(CURRENT_USER_ID_KEY);
      setAppUser(null);
  }, []);


  // 2. 渲染逻辑
  if (!isDataLoaded || usersLoading) {
    return <LoadingScreen message={'正在加载本地数据...'} />;
  }
  
  // 检查是否需要初始化
  const needsInitialization = allAppUsers.length === 0;

  // 渲染登录或仪表盘
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {appUser ? (
        <Dashboard user={appUser} onLogout={handleLogout} getCollectionHook={getCollectionHook} />
      ) : (
        <LoginScreen 
          needsInitialization={needsInitialization}
          allAppUsers={allAppUsers} 
          onLogin={handleLogin}
          updateCollection={updateCollection}
        />
      )}
    </div>
  );
}

// --- 加载界面 ---
function LoadingScreen({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Loader className="w-12 h-12 text-blue-600" />
      <p className="mt-4 text-lg text-gray-600">{message}</p>
    </div>
  );
}

// --- 登录界面 (选择模拟用户) ---
function LoginScreen({ needsInitialization, allAppUsers, onLogin, updateCollection }) {
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  
  // 手动初始化数据
  const handleInitData = async () => {
    setLoading(true);
    setError(null);
    try {
        console.log("LoginScreen: 手动创建模拟数据...");
        // Clear local storage first to ensure a clean start
        localStorage.removeItem(CURRENT_USER_ID_KEY);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        
        const mockCollections = createMockDataWithForms(); 
        
        // Use updateCollection batch update (this will trigger a single save to localStorage)
        updateCollection('allAppUsers', mockCollections.allAppUsers);
        updateCollection('forms', mockCollections.forms); 
        updateCollection('files', mockCollections.files);
        updateCollection('assets', mockCollections.assets);

        console.log("LoginScreen: 模拟数据创建成功。");
    } catch (err) {
        console.error("LoginScreen: 创建模拟数据失败:", err);
        setError(err.message || "创建模拟数据失败");
    } finally {
        setLoading(false);
    }
  };

  // 渲染
  if (loading) {
    return <LoadingScreen message="正在操作..." />;
  }
  
  if (error) {
       return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
         <div className="p-8 bg-white shadow-lg rounded-lg text-center max-w-md">
           <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
           <h2 className="mt-4 text-2xl font-bold text-gray-800">操作失败</h2>
           <p className="mt-2 text-gray-600 break-all">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()} className="mt-6">
              刷新页面
            </Button>
         </div>
       </div>
     );
  }

  // 如果需要初始化, 显示初始化按钮
  if (needsInitialization) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
         <div className="p-8 bg-white shadow-lg rounded-lg text-center max-w-md">
           <Database className="w-16 h-16 text-blue-500 mx-auto" />
           <h2 className="mt-4 text-2xl font-bold text-gray-800">欢迎使用</h2>
           <p className="mt-2 text-gray-600">
             系统检测到本地存储为空。请先初始化模拟数据。
           </p>
            <Button variant="primary" onClick={handleInitData} className="mt-6 w-full justify-center text-lg py-3">
              <RefreshCw className="w-5 h-5 mr-2" />
              初始化模拟数据
            </Button>
         </div>
       </div>
    );
  }

  // 正常登录界面
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          资产文件管理系统
        </h2>
        <div className="space-y-4">
          <p className="text-center text-gray-600">请选择一个模拟身份登录：</p>
          {allAppUsers.sort((a, b) => a.name.localeCompare(b.name)).map((user) => (
            <Button
              key={user.id}
              variant={
                user.role === 'superadmin' ? 'danger' :
                user.role === 'admin' ? 'primary' : 'outline'
              }
              onClick={() => onLogin(user)}
              className="w-full justify-center py-3 text-lg"
            >
              {user.role === 'superadmin' ? '👑' : user.role === 'admin' ? '👨‍💼' : '🧑‍💻'}
              <span className="ml-3">{user.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 模拟数据创建 (更新为 Form 结构, 增加更多表格) ---
function createMockDataWithForms() {
    const now = Date.now();
    const mockCollections = {
        allAppUsers: [],
        forms: [], 
        files: [],
        assets: [], 
    };
    
    // Helper to add data to a collection and return the ID
    const addMockDoc = (collectionName, data) => {
        const id = generateId();
        const doc = { id, ...data };
        mockCollections[collectionName].push(doc);
        return id;
    };
    
    // 1. 创建模拟用户 (User creation remains the same)
    const superAdminId = addMockDoc('allAppUsers', { name: "超级管理员", role: "superadmin" });
    const adminId = addMockDoc('allAppUsers', { name: "管理员 (张三)", role: "admin" });
    const subAccountId1 = addMockDoc('allAppUsers', { name: "子账号一号 (李四)", role: "subaccount" });
    const subAccountId2 = addMockDoc('allAppUsers', { name: "子账号二号 (王五)", role: "subaccount" });
    const subAccountId3 = addMockDoc('allAppUsers', { name: "子账号三号", role: "subaccount" });
    const subAccountId4 = addMockDoc('allAppUsers', { name: "子账号四号", role: "subaccount" });
    const subAccountId5 = addMockDoc('allAppUsers', { name: "子账号五号", role: "subaccount" });
    
    console.log("模拟用户已添加");
    
    // --- 2. 创建表单模板和字段 (Based on CSV file names) ---
    const formsData = [];

    // Form 1: 附表1：存货入出库管理台账
    const f1Fields = [
        { id: generateId(), name: "日期", type: "date", active: true },
        { id: generateId(), name: "摘要", type: "text", active: true },
        { id: generateId(), name: "入库数量", type: "number", active: true },
        { id: generateId(), name: "出库数量", type: "number", active: true },
        { id: generateId(), name: "单价", type: "number", active: true },
        // Formula: 入库金额 = 入库数量 * 单价
        { id: generateId(), name: "入库金额", type: "formula", active: true, formula: "入库数量 * 单价" },
        { id: generateId(), name: "结存数量", type: "number", active: true },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表1：存货入出库管理台账", isActive: true, fields: f1Fields });

    // Form 2: 附表2：存货盘底表 (已存在)
    const f2Fields = [
        { id: generateId(), name: "存货名称", type: "text", active: true },
        { id: generateId(), name: "规格型号", type: "text", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "金额", type: "number", active: true },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表2：存货盘底表", isActive: true, fields: f2Fields });
    
    // --- NEW Form 3: 附表3 固定资产使用情况登记表 ---
    const f3Fields = [
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "品牌型号", type: "text", active: true },
        { id: generateId(), name: "购置时间", type: "date", active: true },
        { id: generateId(), name: "计量单位", type: "text", active: true },
        { id: generateId(), name: "增加数量", type: "number", active: true },
        { id: generateId(), name: "增加金额", type: "number", active: true },
        { id: generateId(), name: "使用人", type: "text", active: true },
        { id: generateId(), name: "减少日期", type: "date", active: true },
        { id: generateId(), name: "减少数量", type: "number", active: true },
        { id: generateId(), name: "减少金额", type: "number", active: true },
        { id: generateId(), name: "减少原因", type: "textarea", active: true },
        // Formula: 基地现存数量 = 增加数量 - 减少数量
        { id: generateId(), name: "基地现存数量", type: "formula", active: true, formula: "增加数量 - 减少数量" },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表3：固定资产使用情况登记表", isActive: true, fields: f3Fields });

    // --- NEW Form 4: 附表4 固定资产盘底表 ---
    const f4Fields = [
        { id: generateId(), name: "资产编号", type: "text", active: true },
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "品牌型号", type: "text", active: true },
        { id: generateId(), name: "单位", type: "text", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "原值", type: "number", active: true },
        { id: generateId(), name: "使用人", type: "text", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表4：固定资产盘底表", isActive: true, fields: f4Fields });

    // Form 5: 附表5：固定资产处置表 (已存在)
    const f5Fields = [
        { id: generateId(), name: "资产编号", type: "text", active: true },
        { id: generateId(), name: "资产名称", type: "text", active: true },
        { id: generateId(), name: "数量", type: "number", active: true },
        { id: generateId(), name: "原值", type: "number", active: true },
        { id: generateId(), name: "净值", type: "number", active: true },
        { id: generateId(), name: "处置情况说明", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表5：固定资产处置表", isActive: true, fields: f5Fields });

    // Form 6: 附表6：低值易耗品管理台账 (已存在)
    const f6Fields = [
        { id: generateId(), name: "购置金额", type: "number", active: true },
        { id: generateId(), name: "减少金额", type: "number", active: true },
        { id: generateId(), name: "现存数量", type: "number", active: true },
        // Formula: 现存价值 = 购置金额 - 减少金额
        { id: generateId(), name: "现存价值", type: "formula", active: true, formula: "购置金额 - 减少金额" }, 
        { id: generateId(), name: "原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表6：低值易耗品管理台账", isActive: true, fields: f6Fields });

    // --- NEW Form 7: 附表7 低值易耗品盘底表 ---
    const f7Fields = [
        { id: generateId(), name: "低值易耗品名称", type: "text", active: true },
        { id: generateId(), name: "规格型号", type: "text", active: true },
        { id: generateId(), name: "单位", type: "text", active: true },
        { id: generateId(), name: "金额", type: "number", active: true },
        { id: generateId(), name: "账存数量", type: "number", active: true },
        { id: generateId(), name: "盘存数量", type: "number", active: true },
        // Formula: 差异 = 盘存数量 - 账存数量
        { id: generateId(), name: "差异", type: "formula", active: true, formula: "盘存数量 - 账存数量" },
        { id: generateId(), name: "差异原因", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表7：低值易耗品盘底表", isActive: true, fields: f7Fields });

    // Form 8: 附表8：生物资产管理台账 (已存在)
    const f8Fields = [
        { id: generateId(), name: "投放日期", type: "date", active: true },
        { id: generateId(), name: "鱼类品种", type: "text", active: true },
        { id: generateId(), name: "转入重量 (kg)", type: "number", active: true },
        { id: generateId(), name: "转出重量 (kg)", type: "number", active: true },
        { id: generateId(), name: "期末盘点重量 (kg)", type: "number", active: true },
        // Formula: 结存净重 (kg) = 转入重量 (kg) - 转出重量 (kg) + 期末盘点重量 (kg)
        { id: generateId(), name: "结存净重 (kg)", type: "formula", active: true, formula: "转入重量 (kg) - 转出重量 (kg) + 期末盘点重量 (kg)" }, 
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表8：生物资产管理台账", isActive: true, fields: f8Fields });

    // Form 9: 附表9：生物资产盘点审核统计表 (已存在)
    const f9Fields = [
        { id: generateId(), name: "投放池塘编号", type: "text", active: true },
        { id: generateId(), name: "鱼类品种", type: "text", active: true },
        { id: generateId(), name: "规格", type: "text", active: true },
        { id: generateId(), name: "数量", type: "number", active: true },
        { id: generateId(), name: "单价 (元/公斤)", type: "number", active: true },
        // Formula: 总价值 = 数量 * 单价 (元/公斤) / 1000 
        { id: generateId(), name: "总价值", type: "formula", active: true, formula: "数量 * 单价 (元/公斤) / 1000" }, 
        { id: generateId(), name: "盘点日期", type: "date", active: true },
        { id: generateId(), name: "备注", type: "textarea", active: true },
    ];
    formsData.push({ name: "附表9：生物资产盘点审核统计表", isActive: true, fields: f9Fields });
    
    
    // Save Form Templates
    const formMap = {};
    formsData.forEach(formData => {
        const id = addMockDoc('forms', formData);
        formMap[formData.name] = { id, fields: formData.fields };
    });
    console.log("模拟表单已添加");

    // --- 3. 创建模拟文件 (Files remain the same) ---
    // 简化: 直接使用已声明的ID变量
    addMockDoc('files', {
        fileName: "鱼苗养殖标准手册.pdf",
        url: "https://example.com/manual.pdf",
        uploadedBy: adminId,
        uploadedAt: now,
        allowedSubAccounts: [subAccountId1, subAccountId2, subAccountId3]
    });
    
    addMockDoc('files', {
        fileName: "水质检测报告-2024-Q4.docx",
        url: "https://example.com/report.docx",
        uploadedBy: adminId,
        uploadedAt: now,
        allowedSubAccounts: [subAccountId1, subAccountId4]
    });
    console.log("模拟文件已添加");

    // --- 4. 创建模拟资产记录 (Assets now link to formId) ---
    
    // Record 1: Inventory Ledger data (Form 1) - SubAccount 1 (2 records)
    const invForm = formMap["附表1：存货入出库管理台账"];
    const invFieldMap = invForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: invForm.id, 
        formName: invForm.name,
        subAccountId: subAccountId1,
        subAccountName: "子账号一号 (李四)",
        submittedAt: now,
        fieldsSnapshot: invForm.fields, 
        batchData: [
            {
                [invFieldMap["日期"]]: "2024-10-01",
                [invFieldMap["摘要"]]: "购入饲料",
                [invFieldMap["入库数量"]]: 100,
                [invFieldMap["出库数量"]]: 0,
                [invFieldMap["单价"]]: 50,
                [invFieldMap["结存数量"]]: 100,
                [invFieldMap["备注"]]: "饲料A",
            },
            {
                [invFieldMap["日期"]]: "2024-10-05",
                [invFieldMap["摘要"]]: "领用饲料",
                [invFieldMap["入库数量"]]: 0,
                [invFieldMap["出库数量"]]: 20,
                [invFieldMap["单价"]]: 50,
                [invFieldMap["结存数量"]]: 80,
                [invFieldMap["备注"]]: "池塘A-01",
            }
        ]
    });
    
    // Record 2: Biological Asset data (Form 8) - SubAccount 2
    const bioForm = formMap["附表8：生物资产管理台账"];
    const bioFieldMap = bioForm.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: bioForm.id, 
        formName: bioForm.name,
        subAccountId: subAccountId2,
        subAccountName: "子账号二号 (王五)",
        submittedAt: now - 86400000,
        fieldsSnapshot: bioForm.fields,
        batchData: [
            {
                [bioFieldMap["投放日期"]]: "2024-09-01",
                [bioFieldMap["鱼类品种"]]: "草鱼苗",
                [bioFieldMap["转入重量 (kg)"]]: 100,
                [bioFieldMap["转出重量 (kg)"]]: 10,
                [bioFieldMap["期末盘点重量 (kg)"]]: 50,
                [bioFieldMap["备注"]]: "C塘",
            }
        ]
    });

    // Record 3: Form 3 (固定资产使用情况登记表) - SubAccount 3
    const f3Form = formMap["附表3：固定资产使用情况登记表"];
    const f3FieldMap = f3Form.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: f3Form.id, 
        formName: f3Form.name,
        subAccountId: subAccountId3,
        subAccountName: "子账号三号",
        submittedAt: now - 86400000 * 2,
        fieldsSnapshot: f3Form.fields, 
        batchData: [
            {
                [f3FieldMap["资产名称"]]: "高精度水质监测仪",
                [f3FieldMap["品牌型号"]]: "Aqua-Sense 5000",
                [f3FieldMap["购置时间"]]: "2024-05-01",
                [f3FieldMap["计量单位"]]: "台",
                [f3FieldMap["增加数量"]]: 2,
                [f3FieldMap["增加金额"]]: 12000,
                [f3FieldMap["使用人"]]: "李四",
                [f3FieldMap["减少日期"]]: "",
                [f3FieldMap["减少数量"]]: 0,
                [f3FieldMap["减少金额"]]: 0,
                [f3FieldMap["备注"]]: "设备运行良好",
            }
        ]
    });

    // Record 4: Form 4 (固定资产盘底表) - SubAccount 4
    const f4Form = formMap["附表4：固定资产盘底表"];
    const f4FieldMap = f4Form.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: f4Form.id, 
        formName: f4Form.name,
        subAccountId: subAccountId4,
        subAccountName: "子账号四号",
        submittedAt: now - 86400000 * 5,
        fieldsSnapshot: f4Form.fields, 
        batchData: [
            {
                [f4FieldMap["资产编号"]]: "FAD-2024-001",
                [f4FieldMap["资产名称"]]: "大型投饵机",
                [f4FieldMap["品牌型号"]]: "Feeder Pro X",
                [f4FieldMap["单位"]]: "台",
                [f4FieldMap["账存数量"]]: 5,
                [f4FieldMap["原值"]]: 35000,
                [f4FieldMap["使用人"]]: "王五",
                [f4FieldMap["盘存数量"]]: 4,
                [f4FieldMap["差异原因"]]: "1台已报废等待处置",
            }
        ]
    });

    // Record 5: Form 7 (低值易耗品盘底表) - SubAccount 1 (2 records)
    const f7Form = formMap["附表7：低值易耗品盘底表"];
    const f7FieldMap = f7Form.fields.reduce((acc, f) => { acc[f.name] = f.id; return acc; }, {});
    addMockDoc('assets', {
        formId: f7Form.id, 
        formName: f7Form.name,
        subAccountId: subAccountId1,
        subAccountName: "子账号一号 (李四)",
        submittedAt: now - 86400000 * 7,
        fieldsSnapshot: f7Form.fields, 
        batchData: [
            {
                [f7FieldMap["低值易耗品名称"]]: "pH 试剂盒",
                [f7FieldMap["规格型号"]]: "0-14",
                [f7FieldMap["单位"]]: "盒",
                [f7FieldMap["金额"]]: 50,
                [f7FieldMap["账存数量"]]: 10,
                [f7FieldMap["盘存数量"]]: 12,
                [f7FieldMap["差异原因"]]: "盘点盈余",
            },
            {
                [f7FieldMap["低值易耗品名称"]]: "渔网修补材料",
                [f7FieldMap["规格型号"]]: "尼龙线 2mm",
                [f7FieldMap["单位"]]: "卷",
                [f7FieldMap["金额"]]: 80,
                [f7FieldMap["账存数量"]]: 5,
                [f7FieldMap["盘存数量"]]: 3,
                [f7FieldMap["差异原因"]]: "已领用未登记",
            }
        ]
    });
    
    console.log("模拟资产记录已添加");
    
    return mockCollections;
}


// --- 仪表盘 (主布局) ---
function Dashboard({ user, onLogout, getCollectionHook }) {
  const renderPanel = () => {
    switch (user.role) {
      case 'subaccount':
        return <SubAccountPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'admin':
        // 管理员只保留汇总查看和文件管理
        return <AdminPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'superadmin':
        return <SuperAdminPanel user={user} getCollectionHook={getCollectionHook} />;
      default:
        return <div className="p-4">未知的用户角色</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
               <Database className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 hidden sm:block">
                资产文件管理系统
              </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="font-semibold text-gray-700">{user.name}</span>
              <span className="text-sm text-gray-500 block">
                {
                  user.role === 'superadmin' ? '超级管理员' :
                  user.role === 'admin' ? '管理员' : '子账号'
                }
              </span>
            </div>
            <Button variant="outline" onClick={onLogout} size="icon">
              <LogOut className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPanel()}
      </main>
      
        <footer className="py-4 text-center text-gray-500 text-sm">
          © 2024 资产管理系统
        </footer>
    </div>
  );
}

// --- 1. 子账号面板 (SubAccountPanel - Refactored for Tabs) ---
const STATIC_TABS = {
    myAssets: { id: 'myAssets', label: '我的记录', icon: Box, type: 'static' },
    viewFiles: { id: 'viewFiles', label: '查看文件', icon: FileText, type: 'static' },
};

function SubAccountPanel({ user, getCollectionHook }) {
  const { data: forms } = getCollectionHook('forms');
  const tabsContainerRef = useRef(null); // Ref for the scrollable tab area
  
  // State for managing open tabs
  const [openTabs, setOpenTabs] = useState([STATIC_TABS.myAssets]);
  const [activeTabId, setActiveTabId] = useState('myAssets');

  // Filter and sort active forms for the side navigation
  const availableForms = useMemo(() => {
      return forms.filter(f => f.isActive).sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);
  
  // Find the currently active tab details
  const activeTabDetails = useMemo(() => openTabs.find(t => t.id === activeTabId), [openTabs, activeTabId]);

  // Function to open/switch to a tab
  const openTab = useCallback((tabDetails) => {
      const { id, type } = tabDetails;
      
      // 1. Check if the tab is already open
      const existingTab = openTabs.find(t => t.id === id);
      if (existingTab) {
          setActiveTabId(id);
          // Scroll the tab into view
          setTimeout(() => {
             const tabElement = tabsContainerRef.current?.querySelector(`[data-tab-id="${id}"]`);
             tabElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 0);
          return;
      }

      // 2. Add the new tab
      setOpenTabs(prev => [...prev, tabDetails]);
      setActiveTabId(id);
      
      // Scroll the new tab into view
      setTimeout(() => {
          tabsContainerRef.current?.scrollTo({ left: tabsContainerRef.current.scrollWidth, behavior: 'smooth' });
      }, 50);
  }, [openTabs, forms]);

  // Function to close a tab
  const closeTab = useCallback((tabId) => {
      if (openTabs.length === 1) return; // Prevent closing the last tab

      const tabIndex = openTabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return;

      const newTabs = openTabs.filter(t => t.id !== tabId);
      
      // 1. Update openTabs
      setOpenTabs(newTabs);

      // 2. Set new active tab
      if (tabId === activeTabId) {
          // If closing the active tab, switch to the one before it (or the first one)
          const newActiveIndex = tabIndex === 0 ? 0 : tabIndex - 1;
          const newActiveId = newTabs[newActiveIndex].id;
          setActiveTabId(newActiveId);
          // Scroll the new active tab into view
          setTimeout(() => {
             const tabElement = tabsContainerRef.current?.querySelector(`[data-tab-id="${newActiveId}"]`);
             tabElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }, 0);
      }
  }, [openTabs, activeTabId]);

  // Tab scrolling logic
  const scrollTabs = (direction) => {
      if (tabsContainerRef.current) {
          const scrollAmount = 200; // Pixels to scroll
          const currentScroll = tabsContainerRef.current.scrollLeft;
          const newScroll = currentScroll + (direction === 'left' ? -scrollAmount : scrollAmount);
          tabsContainerRef.current.scrollTo({
              left: newScroll,
              behavior: 'smooth'
          });
      }
  };


  // Ensure an initial tab is open if none are set (e.g., after initialization)
  useEffect(() => {
      if (openTabs.length === 0) {
          setOpenTabs([STATIC_TABS.myAssets]);
          setActiveTabId('myAssets');
      }
  }, [openTabs.length]);

  // Render the current content based on the active tab's type
  const renderTabContent = (tab) => {
    if (tab.type === 'form') {
        const form = forms.find(f => f.id === tab.id);
        if (!form) return <div className="p-4 text-red-500">表格模板未找到。</div>;
        
        return <RegisterAssetsPanel 
            user={user} 
            form={form} 
            getCollectionHook={getCollectionHook} 
            onAssetRegistered={() => { 
                // Close registration tab and open My Records
                closeTab(tab.id); 
                openTab(STATIC_TABS.myAssets);
            }} 
        />;
    }
    
    switch (tab.id) {
        case 'myAssets':
            return <ViewMyAssetsPanel user={user} getCollectionHook={getCollectionHook} forms={availableForms} />;
        case 'viewFiles':
            return <ViewFilesPanel user={user} getCollectionHook={getCollectionHook} />;
        default:
            return <div className="p-4 text-gray-500">无法加载此内容。</div>;
    }
  };
  
  // Helper for opening Form tabs from the left sidebar
  const handleFormClick = (form) => {
      openTab({
          id: form.id,
          label: form.name,
          icon: Plus,
          type: 'form',
          formId: form.id
      });
  };
  
  // Helper for opening static tabs
  const handleStaticClick = (tab) => {
      openTab(tab);
  };


  return (
    <div className="flex flex-col lg:flex-row min-h-[70vh]">
        {/* 左侧导航栏 (Left Sidebar) */}
        <div className="w-full lg:w-64 bg-white p-4 rounded-xl shadow-lg lg:mr-6 mb-6 lg:mb-0 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                登记表格
            </h3>
            <nav className="space-y-2 mb-6 border-b pb-4">
                {availableForms.map(form => (
                    <button
                        key={form.id}
                        onClick={() => handleFormClick(form)}
                        className={`w-full text-left p-3 rounded-lg flex items-center transition-colors duration-150
                            ${activeTabId === form.id ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                    >
                        <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="truncate">{form.name}</span>
                    </button>
                ))}
            </nav>

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-gray-600" />
                数据与文件
            </h3>
            <nav className="space-y-2">
                {Object.values(STATIC_TABS).map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleStaticClick(tab)}
                            className={`w-full text-left p-3 rounded-lg flex items-center transition-colors duration-150
                                ${activeTabId === tab.id ? 'bg-green-100 text-green-700 font-semibold shadow-sm' : 'hover:bg-gray-50 text-gray-700'}
                            `}
                        >
                            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>

        {/* 右侧内容区域 (Tabbed Content) */}
        <div className="flex-grow bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
             {/* Custom CSS to hide scrollbar */}
             <style>
                {`
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    /* Hide scrollbar for IE and Edge */
                    .hide-scrollbar {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}
             </style>
            
            <div className="relative border-b border-gray-200 flex flex-shrink-0">
                {/* Scroll Left Button */}
                <button
                    onClick={() => scrollTabs('left')}
                    className="absolute left-0 top-0 bottom-0 z-10 bg-white/70 backdrop-blur-sm px-2 border-r border-gray-200 text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                    aria-label="向左滚动标签页"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Scrollable Tabs Container */}
                <div 
                    ref={tabsContainerRef}
                    className="overflow-x-auto whitespace-nowrap flex-shrink-0 hide-scrollbar px-10"
                >
                    <nav className="-mb-px flex" aria-label="Tabs">
                        {openTabs.map(tab => {
                            const isActive = tab.id === activeTabId;
                            const Icon = tab.icon || FileText;
                            const isClosable = openTabs.length > 1; // Always keep at least one tab open

                            return (
                                <button
                                    key={tab.id}
                                    data-tab-id={tab.id}
                                    onClick={() => setActiveTabId(tab.id)}
                                    className={`group inline-flex items-center px-4 py-3 border-b-2 text-sm font-medium transition-colors duration-200 flex-shrink-0
                                        ${isActive
                                            ? 'border-blue-600 text-blue-700 bg-gray-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                                    `}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    <span className="truncate max-w-[150px]">{tab.label}</span>
                                    {isClosable && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                            className={`ml-2 p-0.5 rounded-full transition-colors 
                                                ${isActive ? 'text-blue-600 hover:bg-blue-200' : 'text-gray-400 hover:bg-gray-200'}
                                            `}
                                            aria-label={`关闭 ${tab.label}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                
                {/* Scroll Right Button */}
                <button
                    onClick={() => scrollTabs('right')}
                    className="absolute right-0 top-0 bottom-0 z-10 bg-white/70 backdrop-blur-sm px-2 border-l border-gray-200 text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                    aria-label="向右滚动标签页"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-6">
                {activeTabDetails ? (
                    renderTabContent(activeTabDetails)
                ) : (
                    <div className="text-center text-gray-500 pt-20">请在左侧选择一个表格或记录进行操作。</div>
                )}
            </div>
        </div>
    </div>
  );
}


// 1a. 查看我的资产 (Updated to show all forms)
function ViewMyAssetsPanel({ user, getCollectionHook, forms }) {
  const { data: assets, loading, error } = getCollectionHook('assets');
  
  // Group assets by form for easier display
  const groupedAssets = useMemo(() => {
    const userAssets = assets
      .filter(asset => asset.subAccountId === user.id)
      .sort((a, b) => b.submittedAt - a.submittedAt);
      
    return userAssets.reduce((acc, asset) => {
        const form = forms.find(f => f.id === asset.formId) || { name: asset.formName || '未知表格', id: 'unknown' };
        if (!acc[form.id]) {
            acc[form.id] = { formName: form.name, assets: [] };
        }
        acc[form.id].assets.push(asset);
        return acc;
    }, {});
    
  }, [assets, user.id, forms]);

  const viewModal = useModal();

  if (loading) {
    return <LoadingScreen message="正在加载我的记录..." />;
  }
  if (error) {
    return <div className="text-red-500">加载记录失败: {error}</div>;
  }
  
  const formIds = Object.keys(groupedAssets);

  return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">我提交的所有记录</h2>
        {formIds.length === 0 ? (
          <p className="text-gray-500">您尚未提交任何记录。</p>
        ) : (
            <div className="space-y-8">
                {formIds.map(formId => (
                    <div key={formId}>
                        <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">
                            {groupedAssets[formId].formName}
                            <span className="text-sm font-normal ml-3 text-gray-400">({groupedAssets[formId].assets.length} 条)</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedAssets[formId].assets.map(asset => (
                                <AssetCard 
                                    key={asset.id} 
                                    asset={asset} 
                                    onClick={() => viewModal.open(asset)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {viewModal.isOpen && (
          <ViewAssetDetailModal
            asset={viewModal.props}
            isOpen={viewModal.isOpen}
            onClose={viewModal.close}
          />
        )}
      </div>
  );
}

// 资产卡片 (AssetCard remains the same, works with new structure)
function AssetCard({ asset, onClick }) {
    const submittedDate = new Date(asset.submittedAt).toLocaleDateString() || 'N/A';
    const recordCount = asset.batchData?.length || 0;
    
    // Find the first non-formula/non-textarea field to use as the title
    const titleField = asset.fieldsSnapshot?.find(f => f.type !== 'formula' && f.type !== 'textarea') || asset.fieldsSnapshot?.[0]; 
    const firstRecord = asset.batchData?.[0] || {};
    const firstFieldId = titleField?.id; 
    const title = firstRecord[firstFieldId] || `${asset.formName || '记录'} #${asset.id.substring(0, 6)}`;

    return (
      <button 
        onClick={onClick}
        className="block w-full text-left bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {recordCount} 条记录
          </span>
          <span className="text-sm text-gray-500">{submittedDate}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 truncate" title={title}>
          {title}
        </h3>
        {asset.formName && (
          <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">{asset.formName}</span>
          </div>
        )}
      </button>
    );
}

// 查看资产详情模态框 (ViewAssetDetailModal remains the same)
function ViewAssetDetailModal({ asset, isOpen, onClose }) {
  if (!asset) return null;

  // 转换时间戳 (number) 到日期字符串
  const submittedDate = new Date(asset.submittedAt).toLocaleString() || 'N/A';
  
  // 创建一个 字段ID -> 字段名称 的映射
  const fieldIdToName = useMemo(() => {
      return asset.fieldsSnapshot.reduce((acc, field) => {
        acc[field.id] = field.name;
        return acc;
      }, {});
  }, [asset.fieldsSnapshot]);
  
  // 获取所有在快照中出现过的字段 (用于表头)
  const allFieldIdsInBatch = useMemo(() => {
      const idSet = new Set();
      asset.batchData.forEach(row => {
        Object.keys(row).forEach(fieldId => idSet.add(fieldId));
      });
      // 保持快照中的顺序
      return asset.fieldsSnapshot
        .map(f => f.id)
        .filter(id => idSet.has(id));
  }, [asset.batchData, asset.fieldsSnapshot]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="查看记录详情">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          表格: {asset.formName || 'N/A'}
        </p>
        <p className="text-sm text-gray-500">
          提交于: {submittedDate}
        </p>
        {asset.subAccountName && (
            <p className="text-sm text-gray-500">
              提交人: {asset.subAccountName}
            </p>
        )}
        
        <div className="overflow-x-auto border border-gray-200 rounded-lg mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {allFieldIdsInBatch.map(fieldId => (
                  <th key={fieldId} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {fieldIdToName[fieldId] || '未知字段'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asset.batchData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {allFieldIdsInBatch.map(fieldId => (
                    <td key={fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {row[fieldId] || 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
}


// 1b. 登记新资产 (Updated to use form structure and handle formulas)
function RegisterAssetsPanel({ user, form, getCollectionHook, onAssetRegistered }) {
  const { data: allForms } = getCollectionHook('forms'); // Need all forms to reference fields by name
  const { update: updateAssets } = getCollectionHook('assets');

  const [rows, setRows] = useState([{}]); // 初始化一行空数据
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 确保使用当前表单的最新字段定义，并只取 active 字段
  const activeFields = useMemo(() => {
    return form.fields.filter(f => f.active);
  }, [form.fields]);

  // 辅助函数：根据当前行数据计算所有公式字段的值
  const calculateRow = useCallback((currentRow) => {
    let newRow = { ...currentRow };
    
    // 1. Calculate formulas
    form.fields.filter(f => f.type === 'formula' && f.active).forEach(field => {
        if (field.formula) {
            // Formula calculation uses field names (e.g., "入库数量 * 单价")
            const calculatedValue = calculateFormula(field.formula, newRow, form.fields);
            
            // Update ID-based result
            newRow[field.id] = calculatedValue;
        }
    });

    return newRow;
  }, [form.fields]);

  // 初始化第一行数据
  useEffect(() => {
    // Check if initialization is needed OR if the form changed
    if (activeFields.length > 0 && (rows.length === 0 || rows.some(row => Object.keys(row).length === 0))) {
      const initialRow = activeFields.reduce((acc, field) => {
        // Initialize non-formula fields to empty string or 0
        acc[field.id] = field.type === 'number' ? 0 : '';
        return acc;
      }, {});
      
      // Calculate initial formulas based on the empty/zero initial data
      const calculatedInitialRow = calculateRow(initialRow);

      setRows([calculatedInitialRow]);
    }
  }, [activeFields, calculateRow]);

  // 处理输入变化 (更新单行数据并重新计算公式)
  const handleInputChange = (e, rowIndex, fieldId) => {
    const { value, type } = e.target;
    const newRows = [...rows];
    let updatedRow = { ...newRows[rowIndex] };
    
    // 1. Update the input field value
    updatedRow[fieldId] = type === 'number' ? Number(value) : value;

    // 2. Re-calculate all formulas in this row
    updatedRow = calculateRow(updatedRow);

    newRows[rowIndex] = updatedRow;
    setRows(newRows);
  };
  
  // 添加新行
  const addRow = () => {
    const newRow = activeFields.reduce((acc, field) => {
      acc[field.id] = field.type === 'number' ? 0 : '';
      return acc;
    }, {});
    
    // Calculate initial formulas for the new row
    const calculatedNewRow = calculateRow(newRow);
    setRows([...rows, calculatedNewRow]);
  };

  // 删除行
  const removeRow = (rowIndex) => {
    if (rows.length <= 1) return; // 至少保留一行
    const newRows = rows.filter((_, index) => index !== rowIndex);
    setRows(newRows);
  };
  
  // 清空表单
  const resetForm = () => {
      const initialRow = activeFields.reduce((acc, field) => {
          acc[field.id] = field.type === 'number' ? 0 : '';
          return acc;
        }, {});
        
      const calculatedInitialRow = calculateRow(initialRow);
      setRows([calculatedInitialRow]);
      setError(null);
  }

  // 提交
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const nonEmptyRows = rows.filter(row => {
        // 排除公式字段，只检查用户可输入字段
        return activeFields.filter(f => f.type !== 'formula').some(field => row[field.id] != null && row[field.id] !== '');
    });

    if (nonEmptyRows.length === 0) {
      setError("请至少填写一行有效数据。");
      setIsSubmitting(false);
      return;
    }
    
    try {
        const newAssetBatch = {
            id: generateId(),
            formId: form.id, // Link to the form template ID
            formName: form.name,
            subAccountId: user.id,
            subAccountName: user.name,
            submittedAt: Date.now(), 
            // 存储该表单当前版本的字段快照
            fieldsSnapshot: form.fields,
            batchData: nonEmptyRows
        };

        const { update: updateAssets } = getCollectionHook('assets');

        // 更新 assets 集合
        updateAssets(prevAssets => [...prevAssets, newAssetBatch]);

        console.log(`批量记录提交成功! Form ID: ${form.id}`);
        resetForm();
        onAssetRegistered(); // 通知父组件关闭标签页并打开“我的记录”
        
    } catch (err) {
      console.error("提交记录失败:", err);
      setError(err.message || "提交失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">批量登记</h3>
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto bg-gray-50 rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {activeFields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {field.name}
                  {field.type === 'formula' && <span className="text-xs text-blue-500 ml-1">(自动计算)</span>}
                </th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {activeFields.map(field => (
                  <td key={field.id} className="px-2 py-2 whitespace-nowrap">
                    {field.type === 'formula' ? (
                      // Formula Field (Read-only)
                      <div className="mt-1 block w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-md shadow-sm sm:text-sm font-bold text-blue-700">
                        {row[field.id] || '0.00'}
                      </div>
                    ) : (
                      // Regular Input Fields
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={row[field.id] === 0 ? 0 : row[field.id] || ''} // Handle display of 0 for number inputs
                        onChange={(e) => handleInputChange(e, rowIndex, field.id)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={`输入${field.name}`}
                        step={field.type === 'number' ? '0.01' : undefined}
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-2 whitespace-nowrap text-right">
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => removeRow(rowIndex)}
                    disabled={rows.length <= 1}
                    className={rows.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加一行
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <Loader className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5 mr-2" />
          )}
          全部提交
        </Button>
      </div>
    </form>
  );
}


// 1c. 查看文件 (ViewFilesPanel remains the same)
function ViewFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading, error } = getCollectionHook('files');

  // 仅显示允许当前用户查看的文件
  const myFiles = useMemo(() => {
    return files.filter(file => 
      file.allowedSubAccounts && file.allowedSubAccounts.includes(user.id)
    );
  }, [files, user.id]);

  if (loading) {
    return <LoadingScreen message="正在加载可用文件..." />;
  }
  if (error) {
    return <div className="text-red-500">加载文件失败: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">可查看的文件</h2>
      {myFiles.length === 0 ? (
        <p className="text-gray-500">目前没有分配给您的文件。</p>
      ) : (
        <ul className="space-y-4">
          {myFiles.map(file => (
            <li key={file.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <span className="font-medium text-gray-800">{file.fileName}</span>
                  <span className="text-sm text-gray-400 block">
                    上传于: {new Date(file.uploadedAt).toLocaleDateString() || 'N/A'}
                  </span>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                下载
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- 2. 管理员面板 ---
function AdminPanel({ user, getCollectionHook }) {
  const tabs = [
    { id: 'viewAssets', label: '汇总查看记录', icon: Users },
    { id: 'uploadFile', label: '管理文件', icon: UploadCloud },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'viewAssets' && <ViewAllAssetsPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'uploadFile' && <ManageFilesPanel user={user} getCollectionHook={getCollectionHook} />}
      </div>
    </div>
  );
}

// 2a. 汇总查看资产 (ViewAllAssetsPanel updated to reference forms)
function ViewAllAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading: assetsLoading, error: assetsError } = getCollectionHook('assets');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  const { data: forms } = getCollectionHook('forms');
  
  const [selectedFormId, setSelectedFormId] = useState('all');
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('all');

  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'subaccount');
  }, [allAppUsers]);
  
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => 
          (selectedSubAccountId === 'all' || asset.subAccountId === selectedSubAccountId) &&
          (selectedFormId === 'all' || asset.formId === selectedFormId)
      )
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序
  }, [assets, selectedSubAccountId, selectedFormId]);

  const viewModal = useModal();

  if (assetsLoading || usersLoading) {
    return <LoadingScreen message="正在加载所有记录数据..." />;
  }
  if (assetsError || usersError) {
    return <div className="text-red-500">加载数据失败: {assetsError || usersError}</div>;
  }
  
  return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">汇总查看记录</h2>
        
        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="max-w-xs w-full">
               <label htmlFor="form-filter" className="block text-sm font-medium text-gray-700 mb-1">
                 筛选表格
               </label>
               <select
                 id="form-filter"
                 value={selectedFormId}
                 onChange={(e) => setSelectedFormId(e.target.value)}
                 className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
               >
                 <option value="all">所有表格</option>
                 {forms.filter(f => f.isActive).map(form => (
                   <option key={form.id} value={form.id}>{form.name}</option>
                 ))}
               </select>
             </div>
            <div className="max-w-xs w-full">
               <label htmlFor="subaccount-filter" className="block text-sm font-medium text-gray-700 mb-1">
                 筛选提交人
               </label>
               <select
                 id="subaccount-filter"
                 value={selectedSubAccountId}
                 onChange={(e) => setSelectedSubAccountId(e.target.value)}
                 className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
               >
                 <option value="all">所有子账号</option>
                 {subAccounts.map(sub => (
                   <option key={sub.id} value={sub.id}>{sub.name}</option>
                 ))}
               </select>
             </div>
        </div>

        {/* 资产卡片网格 */}
        {filteredAssets.length === 0 ? (
          <p className="text-gray-500 mt-6">
            没有找到匹配的记录。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => viewModal.open(asset)}
              />
            ))}
          </div>
        )}
        
        {/* 查看详情模态框 */}
        {viewModal.isOpen && (
          <ViewAssetDetailModal
            asset={viewModal.props}
            isOpen={viewModal.isOpen}
            onClose={viewModal.close}
          />
        )}
      </div>
  );
}


// 2b. 管理文件 (ManageFilesPanel remains the same)
function ManageFilesPanel({ user, getCollectionHook }) {
  const { data: files, loading: filesLoading, error: filesError, update: updateFiles } = getCollectionHook('files');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  
  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'subaccount');
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
        setIsSubmitting(false);
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
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">
              指定查看权限
            </h3>
            {usersError && <div className="text-red-500 text-sm">加载子账号失败: {usersError}</div>}
            
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
              {subAccounts.length === 0 && <p className="text-gray-500 text-sm">没有可用的子账号。</p>}
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
          
          <Button type="submit" variant="primary" disabled={isUploading} className="w-full justify-center">
              {isUploading ? (
                <Loader className="w-5 h-5" />
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


// --- 3. 超级管理员面板 (SuperAdminPanel updated) ---
function SuperAdminPanel({ user, getCollectionHook }) {
  const tabs = [
    { id: 'manageForms', label: '管理表格模板', icon: FileText }, // New
    { id: 'manageUsers', label: '管理所有用户', icon: Users },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [editingFormId, setEditingFormId] = useState(null); // New state to drill down into field management

  const { data: forms } = getCollectionHook('forms');
  const editingForm = forms.find(f => f.id === editingFormId);

  // If we are editing a form's fields, render that specific panel
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

// 3a. 管理表格模板 (ManageFormsPanel - New)
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

// 3b. 管理表单字段 (ManageFormFieldsPanel - New)
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
            description: "此操作将字段设为“已归档”。该字段将从表单中移除，但历史数据中仍会保留，不会影响旧记录的查看。",
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

// 3c. 管理所有用户 (ManageUsersPanel remains the same)
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


// --- 通用 UI 组件 ---

// InputGroup helper
const InputGroup = ({ label, children, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {children}
    </div>
);

// Dropdown for Formula Field Helper
const Dropdown = ({ label, options, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block text-left">
            <Button type="button" variant="outline" onClick={() => setIsOpen(!isOpen)} className="justify-center">
                {label} <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {options.length === 0 ? (
                            <div className="block px-4 py-2 text-sm text-gray-500">无数字字段</div>
                        ) : (
                            options.map(option => (
                                <button
                                    key={option}
                                    onClick={() => { onSelect(option); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    {option}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 1. Tabs
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

// 2. Button
function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const baseStyle = "inline-flex items-center border font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-md",
    icon: "p-2 text-sm rounded-md",
  };

  const combinedClassName = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}

// 3. Modal
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* 模态框内容 */}
      <div className="relative bg-white w-full max-w-2xl p-6 rounded-2xl shadow-xl m-4 transition-all transform scale-100 opacity-100">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <Button variant="outline" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="mt-5 max-h-[70vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// 4. Loader
function Loader({ className = 'w-5 h-5 text-white' }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

// 5. useModal
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState(null);

  const open = (modalProps = null) => {
    setProps(modalProps);
    setIsOpen(true);
  };
  
  const close = () => {
    setIsOpen(false);
    setProps(null);
  };

  return { isOpen, open, close, props };
}

export default App;