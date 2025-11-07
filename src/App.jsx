import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
const LOCAL_STORAGE_KEY = 'ASSET_MANAGER_V2_DATA';
const CURRENT_USER_ID_KEY = 'ASSET_MANAGER_CURRENT_USER_ID';

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
    return {
        allAppUsers: [],
        assetFields: [],
        files: [],
        assets: [],
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

// --- App (主组件) ---
function App() {
  const { getCollectionHook, updateCollection } = useLocalStorageCollections();
  
  // Use a simple boolean flag to indicate initialization is done
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [appUser, setAppUser] = useState(null); 
  const [error, setError] = useState(null); 
  
  // Custom hook replacement for Firebase Firestore collection
  const { data: allAppUsers, loading: usersLoading, update: updateUsers } = getCollectionHook('allAppUsers');
  
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
          updateUsers={updateUsers}
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
        const mockCollections = createMockData();
        
        // 使用 updateCollection 批量更新所有集合
        updateCollection('allAppUsers', mockCollections.allAppUsers);
        updateCollection('assetFields', mockCollections.assetFields);
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

// --- 模拟数据创建 (返回一个包含所有集合的 JSON 对象) ---
function createMockData() {
    const now = Date.now();
    const mockCollections = {
        allAppUsers: [],
        assetFields: [],
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
    
    // 1. 创建模拟用户
    const superAdminId = addMockDoc('allAppUsers', { name: "超级管理员", role: "superadmin" });
    const adminId = addMockDoc('allAppUsers', { name: "管理员 (张三)", role: "admin" });
    const subAccountId1 = addMockDoc('allAppUsers', { name: "子账号一号 (李四)", role: "subaccount" });
    const subAccountId2 = addMockDoc('allAppUsers', { name: "子账号二号 (王五)", role: "subaccount" });
    const subAccountId3 = addMockDoc('allAppUsers', { name: "子账号三号", role: "subaccount" });
    const subAccountId4 = addMockDoc('allAppUsers', { name: "子账号四号", role: "subaccount" });
    const subAccountId5 = addMockDoc('allAppUsers', { name: "子账号五号", role: "subaccount" });
    
    console.log("模拟用户已添加");
    
    // 2. 创建模拟资产字段
    const fieldsData = [
        { name: "鱼苗品种", type: "text", active: true, history: [{ status: "created", timestamp: now }] },
        { name: "数量 (尾)", type: "number", active: true, history: [{ status: "created", timestamp: now }] },
        { name: "投放日期", type: "date", active: true, history: [{ status: "created", timestamp: now }] },
        { name: "鱼塘编号", type: "text", active: true, history: [{ status: "created", timestamp: now }] },
        { name: "备注", type: "textarea", active: true, history: [{ status: "created", timestamp: now }] },
        { name: "资产名称", type: "text", active: false, history: [{ status: "created", timestamp: now }, { status: "deleted", timestamp: now }] }, // 模拟旧字段
    ];
    
    const fieldDocsMap = {}; // 存储字段 id 用于资产
    fieldsData.forEach((field) => {
        const id = addMockDoc('assetFields', field);
        fieldDocsMap[field.name] = id;
    });
    console.log("模拟字段已添加");

    // 3. 创建模拟文件
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

    // 4. 创建模拟资产 (批量)
    const getFieldsSnapshot = () => fieldsData.map(f => ({ 
        id: fieldDocsMap[f.name], 
        name: f.name, 
        active: f.active 
    }));

    // 子账号一号的批量资产 (2条)
    addMockDoc('assets', {
        subAccountId: subAccountId1,
        subAccountName: "子账号一号 (李四)",
        submittedAt: now,
        fieldsSnapshot: getFieldsSnapshot(),
        batchData: [
            {
                [fieldDocsMap["鱼苗品种"]]: "鲈鱼苗",
                [fieldDocsMap["数量 (尾)"]]: 5000,
                [fieldDocsMap["投放日期"]]: "2024-10-01",
                [fieldDocsMap["鱼塘编号"]]: "A-01",
                [fieldDocsMap["备注"]]: "第一批",
            },
            {
                [fieldDocsMap["鱼苗品种"]]: "鲤鱼苗",
                [fieldDocsMap["数量 (尾)"]]: 10000,
                [fieldDocsMap["投放日期"]]: "2024-10-03",
                [fieldDocsMap["鱼塘编号"]]: "B-02",
                [fieldDocsMap["备注"]]: "长势良好",
            }
        ]
    });
    
    // 子账号二号的批量资产 (1条)
    addMockDoc('assets', {
        subAccountId: subAccountId2,
        subAccountName: "子账号二号 (王五)",
        submittedAt: now,
        fieldsSnapshot: getFieldsSnapshot(),
        batchData: [
            {
                [fieldDocsMap["鱼苗品种"]]: "草鱼苗",
                [fieldDocsMap["数量 (尾)"]]: 8000,
                [fieldDocsMap["投放日期"]]: "2024-10-05",
                [fieldDocsMap["鱼塘编号"]]: "C-01",
                [fieldDocsMap["备注"]]: "",
            }
        ]
    });
    
    // 子账号一号的 *旧* 资产 (模拟字段变更前)
    const oldFieldsData = fieldsData.filter(f => f.name === "资产名称" || f.name === "备注");
    
    addMockDoc('assets', {
        subAccountId: subAccountId1,
        subAccountName: "子账号一号 (李四)",
        submittedAt: now - 86400000 * 30, // 30天前
        fieldsSnapshot: oldFieldsData.map(f => ({ id: fieldDocsMap[f.name], name: f.name, active: f.active })),
        batchData: [
            {
                [fieldDocsMap["资产名称"]]: "旧的测试资产",
                [fieldDocsMap["备注"]]: "这是一条旧数据",
            }
        ]
    });
    
    console.log("模拟资产已添加");
    
    return mockCollections;
}


// --- 仪表盘 (主布局) ---
function Dashboard({ user, onLogout, getCollectionHook }) {
  const renderPanel = () => {
    switch (user.role) {
      case 'subaccount':
        return <SubAccountPanel user={user} getCollectionHook={getCollectionHook} />;
      case 'admin':
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

// --- 1. 子账号面板 ---
function SubAccountPanel({ user, getCollectionHook }) {
  const tabs = [
    { id: 'myAssets', label: '我的资产', icon: Box },
    { id: 'registerAsset', label: '登记新资产', icon: Plus },
    { id: 'viewFiles', label: '查看文件', icon: FileText },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'myAssets' && <ViewMyAssetsPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'registerAsset' && <RegisterAssetsPanel user={user} getCollectionHook={getCollectionHook} onAssetRegistered={() => setActiveTab('myAssets')} />}
        {activeTab === 'viewFiles' && <ViewFilesPanel user={user} getCollectionHook={getCollectionHook} />}
      </div>
    </div>
  );
}

// 1a. 查看我的资产
function ViewMyAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading, error } = getCollectionHook('assets');
  
  // 仅显示当前用户的资产
  const myAssets = useMemo(() => {
    return assets
      .filter(asset => asset.subAccountId === user.id)
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序 (数字比较)
  }, [assets, user.id]);

  const viewModal = useModal();

  if (loading) {
    return <LoadingScreen message="正在加载我的资产..." />;
  }
  if (error) {
    return <div className="text-red-500">加载资产失败: {error}</div>;
  }
  
  return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">我提交的资产记录</h2>
        {myAssets.length === 0 ? (
          <p className="text-gray-500">您尚未提交任何资产记录。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => viewModal.open(asset)}
              />
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

// 资产卡片
function AssetCard({ asset, onClick }) {
    // 转换时间戳 (number) 到日期字符串
    const submittedDate = new Date(asset.submittedAt).toLocaleDateString() || 'N/A';
    const recordCount = asset.batchData?.length || 0;
    
    // 尝试从批量数据的第一条中获取一个“标题”
    const firstRecord = asset.batchData?.[0] || {};
    // 找到第一个 active 的字段作为标题字段，以兼容旧数据
    const titleField = asset.fieldsSnapshot?.find(f => f.active) || asset.fieldsSnapshot?.[0]; 
    const firstFieldId = titleField?.id; 
    const title = firstRecord[firstFieldId] || `批量资产 #${asset.id.substring(0, 6)}`;

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
        <h3 className="text-xl font-bold text-gray-800 truncate" title={title}>
          {title}
        </h3>
        {asset.subAccountName && (
          <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
            <User className="w-4 h-4 text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">{asset.subAccountName}</span>
          </div>
        )}
      </button>
    );
}

// 查看资产详情模态框
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
    <Modal isOpen={isOpen} onClose={onClose} title="查看资产详情">
      <div className="space-y-4">
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


// 1b. 登记新资产
function RegisterAssetsPanel({ user, getCollectionHook, onAssetRegistered }) {
  const { data: allFields, loading: fieldsLoading, error: fieldsError, update: updateFields } = getCollectionHook('assetFields');
  const { data: assets, update: updateAssets } = getCollectionHook('assets');

  const [rows, setRows] = useState([{}]); // 初始化一行空数据
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 仅获取 active: true 的字段
  const activeFields = useMemo(() => {
    return allFields.filter(f => f.active);
  }, [allFields]);

  // 初始化第一行数据
  useEffect(() => {
    if (activeFields.length > 0 && Object.keys(rows[0]).length === 0) {
      const initialRow = activeFields.reduce((acc, field) => {
        acc[field.id] = ''; // 初始化为空字符串
        return acc;
      }, {});
      setRows([initialRow]);
    }
  }, [activeFields, rows]); 

  // 处理输入变化
  const handleInputChange = (e, rowIndex, fieldId) => {
    const { value, type } = e.target;
    const newRows = [...rows];
    newRows[rowIndex][fieldId] = type === 'number' ? Number(value) : value;
    setRows(newRows);
  };

  // 添加新行
  const addRow = () => {
    const newRow = activeFields.reduce((acc, field) => {
      acc[field.id] = '';
      return acc;
    }, {});
    setRows([...rows, newRow]);
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
          acc[field.id] = '';
          return acc;
        }, {});
      setRows([initialRow]);
      setError(null);
  }

  // 提交
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 过滤掉空行
    const nonEmptyRows = rows.filter(row => {
        return activeFields.some(field => row[field.id] != null && row[field.id] !== '');
    });

    if (nonEmptyRows.length === 0) {
      setError("请至少填写一行有效数据。");
      setIsSubmitting(false);
      return;
    }
    
    try {
        const newAssetBatch = {
            id: generateId(),
            subAccountId: user.id,
            subAccountName: user.name,
            submittedAt: Date.now(), // Use JavaScript timestamp (number)
            // 创建一个当前所有字段的快照
            fieldsSnapshot: allFields.map(f => ({
                id: f.id,
                name: f.name,
                active: f.active
            })),
            batchData: nonEmptyRows
        };

        // 更新 assets 集合
        updateAssets(prevAssets => [...prevAssets, newAssetBatch]);

        // 成功
        console.log("批量资产提交成功！");
        resetForm();
        onAssetRegistered(); // 通知父组件切换 Tab
        
    } catch (err) {
      console.error("提交资产失败:", err);
      setError(err.message || "提交失败，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fieldsLoading) {
    return <LoadingScreen message="正在加载资产字段..." />;
  }
  
  if (fieldsError || (activeFields.length === 0 && !fieldsLoading)) {
      return <div className="text-red-500">加载资产字段失败: {fieldsError || "未找到可用字段"}</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">登记新资产 (批量)</h2>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {activeFields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.name}
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
                    <input
                      type={field.type}
                      value={row[field.id] || ''}
                      onChange={(e) => handleInputChange(e, rowIndex, field.id)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={field.name === '数量 (尾)' ? '0' : `输入${field.name}`}
                    />
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


// 1c. 查看文件
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
    { id: 'viewAssets', label: '汇总查看资产', icon: Users },
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

// 2a. 汇总查看资产
function ViewAllAssetsPanel({ user, getCollectionHook }) {
  const { data: assets, loading: assetsLoading, error: assetsError } = getCollectionHook('assets');
  const { data: allAppUsers, loading: usersLoading, error: usersError } = getCollectionHook('allAppUsers');
  
  const [selectedSubAccountId, setSelectedSubAccountId] = useState('all');

  const subAccounts = useMemo(() => {
    return allAppUsers.filter(u => u.role === 'subaccount');
  }, [allAppUsers]);
  
  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => selectedSubAccountId === 'all' || asset.subAccountId === selectedSubAccountId)
      .sort((a, b) => b.submittedAt - a.submittedAt); // 按提交时间倒序
  }, [assets, selectedSubAccountId]);

  const viewModal = useModal();

  if (assetsLoading || usersLoading) {
    return <LoadingScreen message="正在加载所有资产数据..." />;
  }
  if (assetsError || usersError) {
    return <div className="text-red-500">加载数据失败: {assetsError || usersError}</div>;
  }
  
  return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">汇总查看资产</h2>
        
        {/* 筛选器 */}
        <div className="max-w-xs">
          <label htmlFor="subaccount-filter" className="block text-sm font-medium text-gray-700 mb-1">
            筛选子账号
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

        {/* 资产卡片网格 */}
        {filteredAssets.length === 0 ? (
          <p className="text-gray-500">
            {selectedSubAccountId === 'all' ? '系统中尚无资产记录。' : '该子账号尚无资产记录。'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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


// 2b. 管理文件
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
        setIsUploading(false);
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


// --- 3. 超级管理员面板 ---
function SuperAdminPanel({ user, getCollectionHook }) {
  const tabs = [
    { id: 'manageFields', label: '管理资产字段', icon: Settings },
    { id: 'manageUsers', label: '管理所有用户', icon: Users },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-6">
        {activeTab === 'manageFields' && <ManageAssetFieldsPanel user={user} getCollectionHook={getCollectionHook} />}
        {activeTab === 'manageUsers' && <ManageUsersPanel user={user} getCollectionHook={getCollectionHook} />}
      </div>
    </div>
  );
}

// 3a. 管理资产字段
function ManageAssetFieldsPanel({ user, getCollectionHook }) {
  const { data: allFields, loading, error, update: updateFields } = getCollectionHook('assetFields');
  
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  
  // 用于确认删除
  const confirmModal = useModal();
  
  const handleAddField = (e) => {
    e.preventDefault();
    if (!newFieldName.trim()) {
      setActionError("字段名称不能为空");
      return;
    }
    
    setIsSubmitting(true);
    setActionError(null);
    
    try {
        const newField = {
            id: generateId(),
            name: newFieldName.trim(),
            type: newFieldType,
            active: true,
            history: [{ status: "created", timestamp: Date.now() }]
        };
        
        // 更新 fields 集合
        updateFields(prevFields => [...prevFields, newField]);
        
        setNewFieldName('');
        setNewFieldType('text');
        
    } catch (err) {
      console.error("添加字段失败:", err);
      setActionError(err.message || "添加失败");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 切换字段状态 (激活/归档)
  const toggleFieldStatus = (field) => {
    
    const newStatus = !field.active;
    const historyEntry = {
      status: newStatus ? "activated" : "archived",
      timestamp: Date.now()
    };
    
    try {
        // 更新 fields 集合，通过映射更新特定字段
        updateFields(prevFields => prevFields.map(f => 
            f.id === field.id
            ? { ...f, active: newStatus, history: [...(f.history || []), historyEntry] }
            : f
        ));

    } catch (err) {
      console.error("更新字段状态失败:", err);
      setActionError(err.message || "更新失败");
    }
  };
  
  // 打开删除确认
  const openDeleteConfirm = (field) => {
      confirmModal.open({
        title: `确认归档字段 "${field.name}"?`,
        description: "此操作会将字段设为“已归档”状态。该字段将从登记表单中移除，但历史数据中仍会保留。",
        onConfirm: () => handleDeleteField(field)
      });
  };
  
  // 执行删除 (在 v1 中, 我们使用归档代替真删除)
  const handleDeleteField = (field) => {
      // 这是一个归档操作
      if (field.active) {
        toggleFieldStatus(field);
      }
      confirmModal.close();
  };
  
  const closeConfirm = () => {
      confirmModal.close();
  }

  return (
    <div className="space-y-8">
      {/* 错误提示 */}
      {actionError && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {actionError}
        </div>
      )}
      
      {/* 1. 添加新字段 */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">添加新资产字段</h2>
          <form onSubmit={handleAddField} className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-grow">
              <label htmlFor="field-name" className="block text-sm font-medium text-gray-700">
                字段名称
              </label>
              <input
                type="text"
                id="field-name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如: 鱼苗来源"
              />
            </div>
            <div className="flex-shrink-0">
              <label htmlFor="field-type" className="block text-sm font-medium text-gray-700">
                字段类型
              </label>
              <select
                id="field-type"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
              >
                <option value="text">文本 (Text)</option>
                <option value="number">数字 (Number)</option>
                <option value="date">日期 (Date)</option>
                <option value="textarea">长文本 (Textarea)</option>
              </select>
            </div>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-shrink-0 justify-center sm:w-auto w-full">
              {isSubmitting ? <Loader className="w-5 h-5" /> : <Plus className="w-5 h-5 mr-2" />}
              添加字段
            </Button>
          </form>
      </div>
      
      {/* 2. 管理现有字段 */}
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">管理现有字段</h2>
        {loading && <LoadingScreen message="加载字段中..." />}
        {error && <div className="text-red-500">加载字段失败: {error}</div>}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">字段名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allFields.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    没有找到字段
                  </td>
                </tr>
              )}
              
              {allFields.map(field => (
                <tr key={field.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        激活
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        已归档
                      </span>
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
                    {/* 我们用 "归档" 代替 "删除" */}
                    {/* { field.active && (
                      <Button
                        variant="danger"
                        onClick={() => openDeleteConfirm(field)}
                        size="sm"
                      >
                        归档
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
          <Modal isOpen={confirmModal.isOpen} onClose={closeConfirm} title={confirmModal.props.title}>
             <p className="text-gray-600">{confirmModal.props.description}</p>
             <div className="mt-6 flex justify-end space-x-3">
               <Button variant="outline" onClick={closeConfirm}>
                 取消
               </Button>
               <Button variant="danger" onClick={confirmModal.props.onConfirm}>
                 确认归档
               </Button>
             </div>
          </Modal>
      )}
    </div>
  );
}


// 3b. 管理所有用户
function ManageUsersPanel({ user, getCollectionHook }) {
  const { data: allAppUsers, loading, error } = getCollectionHook('allAppUsers');
  
  if (loading) {
    return <LoadingScreen message="正在加载所有用户..." />;
  }
  if (error) {
    return <div className="text-red-500">加载用户失败: {error}</div>;
  }
  
  // (此面板仅为演示, 不提供删除/修改功能, 仅查看)

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
      xmlns="http://www.w3.org="http://www.w3.org/2000/svg" 
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