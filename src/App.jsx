import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Firebase 导入 ---
// 我们将使用 Firebase v11.6.1
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore'; // 用于调试

// --- 图标导入 (来自 lucide-react) ---
const File = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const Users = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const Database = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
const Settings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 .54 1.85v.1a2 2 0 0 1-1.73 1l-.25.43a2 2 0 0 1 0 2l.08.15a2 2 0 0 0 .73 2.73l.38.22a2 2 0 0 0 2.73-.73l.1-.15a2 2 0 0 1 1.85-.54h.1a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-.54-1.85v-.1a2 2 0 0 1 1.73-1l-.25-.43a2 2 0 0 1 0 2l-.08-.15a2 2 0 0 0-.73-2.73l-.38-.22a2 2 0 0 0-2.73.73l.1.15a2 2 0 0 1-1.85.54h-.1a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const Trash = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const Plus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Eye = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const Archive = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>;
const LogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const Loader = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// --- Firebase 配置 ---
// [MODIFIED] 修改为从 Vite 环境变量 (import.meta.env) 或全局变量 (__..._config) 中读取
let firebaseConfig, appId;
try {
  const fbConfig = typeof __firebase_config !== 'undefined' 
    ? __firebase_config 
    : import.meta.env.VITE___firebase_config;
    
  firebaseConfig = JSON.parse(fbConfig || '{}');
  
  appId = typeof __app_id !== 'undefined' 
    ? __app_id 
    : import.meta.env.VITE___app_id;

  if (!appId) {
    appId = 'default-asset-manager';
  }
  
} catch (e) {
  console.error("无法解析 Firebase 配置:", e);
  firebaseConfig = {};
  appId = 'default-asset-manager';
}

// --- Firebase 初始化 ---
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setLogLevel('debug'); 
  setPersistence(auth, browserSessionPersistence); 
} catch (e) {
  console.error("Firebase 初始化失败:", e);
}

// --- 预定义用户账户 ---
const PREDEFINED_USERS = [
  { id: 'super_admin_001', username: '超级管理员', role: 'super_admin' },
  { id: 'admin_001', username: '管理员', role: 'admin' },
  { id: 'sub_account_001', username: '子账号一号', role: 'sub_account' },
  { id: 'sub_account_002', username: '子账号二号', role: 'sub_account' },
  { id: 'sub_account_003', username: '子账号三号', role: 'sub_account' },
  { id: 'sub_account_004', username: '子账号四号', role: 'sub_account' },
  { id: 'sub_account_005', username: '子账号五号', role: 'sub_account' },
];

// --- 数据库路径 ---
const USERS_COLLECTION = `/artifacts/${appId}/public/data/users`;
const ASSET_FIELDS_COLLECTION = `/artifacts/${appId}/public/data/asset_fields`;
const ASSETS_COLLECTION = `/artifacts/${appId}/public/data/assets`;
const FILES_COLLECTION = `/artifacts/${appId}/public/data/files`;

// --- 自定义 Hooks ---
function useFirestoreCollection(collectionPath) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setError("Firestore 未初始化");
      setLoading(false);
      return;
    }
    
    if (!collectionPath) {
      setData([]);
      setLoading(false);
      return;
    }
    
    const collectionRef = collection(db, collectionPath);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
      setLoading(false);
    }, (err) => {
      console.error("onSnapshot 错误:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionPath]);

  return { data, loading, error };
}

function useFirestoreQuery(queryRef) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !queryRef) {
      setData([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(queryRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
      setLoading(false);
    }, (err) => {
      console.error("onSnapshot 查询错误:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [queryRef]); 

  return { data, loading, error };
}


// --- 实用工具组件 ---

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-light"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

const Button = ({ onClick, children, className = '', variant = 'primary', disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      break;
    case 'secondary':
      variantStyle = 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500';
      break;
    case 'danger':
      variantStyle = 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500';
      break;
    case 'outline':
      variantStyle = 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500';
      break;
    default:
      variantStyle = 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
};

function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center
              `}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">
        {ActiveComponent}
      </div>
    </div>
  );
}

// 登录界面 (选择模拟用户)
function LoginScreen({ onLogin, isAuthReady }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 检查并初始化用户
  useEffect(() => {
    if (!db || !isAuthReady) {
      return;
    }

    const checkAndInitMockData = async () => {
      try {
        const usersRef = collection(db, USERS_COLLECTION);
        const snapshot = await getDocs(usersRef);
        
        if (snapshot.empty) {
          console.log("数据库为空，正在初始化所有模拟数据...");
          
          const batch = writeBatch(db);
          
          // 1. 添加模拟用户
          PREDEFINED_USERS.forEach(user => {
            const docRef = doc(db, USERS_COLLECTION, user.id);
            batch.set(docRef, user);
          });

          // 2. 添加模拟资产字段 (使用预定义ID)
          const MOCK_FIELD_SPECIES_ID = "mock_field_species";
          const MOCK_FIELD_QUANTITY_ID = "mock_field_quantity";
          const MOCK_FIELD_DATE_ID = "mock_field_date";
          const MOCK_FIELD_POND_ID = "mock_field_pond";
          const MOCK_FIELD_NOTES_ID = "mock_field_notes";
          const MOCK_FIELD_ARCHIVED_ID = "mock_field_archived_batch";

          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_SPECIES_ID), { 
            label: "鱼苗品种", 
            type: "text", 
            isActive: true, 
            createdAt: serverTimestamp() 
          });
          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_QUANTITY_ID), { 
            label: "数量 (尾)", 
            type: "number", 
            isActive: true, 
            createdAt: serverTimestamp() 
          });
          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_DATE_ID), { 
            label: "投放日期", 
            type: "date", 
            isActive: true, 
            createdAt: serverTimestamp() 
          });
          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_POND_ID), { 
            label: "鱼塘编号", 
            type: "text", 
            isActive: true, 
            createdAt: serverTimestamp() 
          });
          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_NOTES_ID), { 
            label: "备注", 
            type: "textarea", 
            isActive: true, 
            createdAt: serverTimestamp() 
          });
          batch.set(doc(db, ASSET_FIELDS_COLLECTION, MOCK_FIELD_ARCHIVED_ID), { 
            label: "旧批次号", 
            type: "text", 
            isActive: false, // 这是一个已归档字段
            createdAt: serverTimestamp() 
          });

          // 3. 添加模拟文件
          batch.set(doc(collection(db, FILES_COLLECTION)), {
            fileName: "2025年度财务报告.pdf",
            uploaderId: "admin_001",
            createdAt: serverTimestamp(),
            allowedUserIds: ['sub_account_001', 'sub_account_003'],
          });
          batch.set(doc(collection(db, FILES_COLLECTION)), {
            fileName: "员工手册V3.doc",
            uploaderId: "admin_001",
            createdAt: serverTimestamp(),
            allowedUserIds: ['sub_account_001', 'sub_account_002', 'sub_account_003', 'sub_account_004', 'sub_account_005'],
          });

          // 4. 添加模拟批量资产
          batch.set(doc(collection(db, ASSETS_COLLECTION)), {
            ownerId: "sub_account_001",
            createdAt: serverTimestamp(),
            // 这是一个批量数据
            batchData: [
              {
                [MOCK_FIELD_SPECIES_ID]: "鲈鱼苗",
                [MOCK_FIELD_QUANTITY_ID]: 5000,
                [MOCK_FIELD_DATE_ID]: "2024-10-01",
                [MOCK_FIELD_POND_ID]: "A-01",
                [MOCK_FIELD_NOTES_ID]: "长势良好"
              },
              {
                [MOCK_FIELD_SPECIES_ID]: "鲤鱼苗 (旧)",
                [MOCK_FIELD_QUANTITY_ID]: 2000,
                [MOCK_FIELD_DATE_ID]: "2023-05-10",
                [MOCK_FIELD_POND_ID]: "C-01",
                [MOCK_FIELD_ARCHIVED_ID]: "BATCH-2023-OLD-001" // 包含一个已归档字段的值
              }
            ]
          });
          batch.set(doc(collection(db, ASSETS_COLLECTION)), {
            ownerId: "sub_account_002",
            createdAt: serverTimestamp(),
            // 这是单个数据的批量提交
            batchData: [
              {
                [MOCK_FIELD_SPECIES_ID]: "草鱼苗",
                [MOCK_FIELD_QUANTITY_ID]: 10000,
                [MOCK_FIELD_DATE_ID]: "2024-10-05",
                [MOCK_FIELD_POND_ID]: "B-03",
                [MOCK_FIELD_NOTES_ID]: ""
              }
            ]
          });

          await batch.commit();
          console.log("所有模拟数据初始化完毕。");
          setUsers(PREDEFINED_USERS);
        } else {
          console.log("已找到用户数据，跳过初始化。");
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("检查/初始化模拟数据失败:", err);
      }
      setLoading(false);
    };

    checkAndInitMockData(); 
  }, [isAuthReady]); 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-lg text-gray-600">正在检查用户数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          登录系统
        </h2>
        <p className="text-center text-gray-600 mb-8">请选择一个模拟身份登录</p>
        <div className="space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full text-left p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 hover:shadow-md transition-all flex items-center"
            >
              <span className={`flex items-center justify-center h-10 w-10 rounded-full mr-4 text-white ${
                user.role === 'super_admin' ? 'bg-red-600' :
                user.role === 'admin' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                {user.role === 'super_admin' ? <Settings /> :
                 user.role === 'admin' ? <File /> : <Users />}
              </span>
              <div>
                <div className="font-semibold text-lg text-gray-900">{user.username}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 主仪表盘
function Dashboard({ appUser, onLogout, allUsers }) {
  let PanelComponent;
  let title = "仪表盘";

  switch (appUser.role) {
    case 'super_admin':
      PanelComponent = <SuperAdminPanel />;
      title = "超级管理员面板";
      break;
    case 'admin':
      PanelComponent = <AdminPanel adminId={appUser.id} allUsers={allUsers} />;
      title = "管理员面板";
      break;
    case 'sub_account':
      PanelComponent = <SubAccountPanel subAccountId={appUser.id} />;
      title = "子账号面板";
      break;
    default:
      PanelComponent = <p>未知的用户角色</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">资产文件管理系统</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                已登录为: <span className="font-semibold">{appUser.username}</span> ({appUser.role})
              </span>
              <Button onClick={onLogout} variant="outline" className="text-sm">
                <LogOut /> <span className="ml-2">退出登录</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">{title}</h2>
          {PanelComponent}
        </div>
      </main>
    </div>
  );
}

// --- Panel Components ---

// --- SubAccountPanel ---
function SubAccountPanel({ subAccountId }) {
  const tabs = [
    { id: 'my-assets', label: '我的资产', component: <MyAssetsPanel subAccountId={subAccountId} />, icon: Database },
    { id: 'add-assets', label: '登记新资产', component: <AddAssetsPanel subAccountId={subAccountId} />, icon: Plus },
    { id: 'view-files', label: '查看文件', component: <ViewFilesPanel subAccountId={subAccountId} />, icon: File },
  ];
  return <Tabs tabs={tabs} />;
}

// SubAccountPanel: Tab 1 - My Assets
function MyAssetsPanel({ subAccountId }) {
  const { data: allFields, loading: fieldsLoading } = useFirestoreCollection(ASSET_FIELDS_COLLECTION);
  
  const assetsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, ASSETS_COLLECTION), where("ownerId", "==", subAccountId));
  }, [subAccountId]);
  const { data: myAssets, loading: assetsLoading } = useFirestoreQuery(assetsQuery);

  const [viewingAsset, setViewingAsset] = useState(null);

  const fieldMap = useMemo(() => {
    if (!allFields) return new Map();
    return new Map(allFields.map(field => [field.id, field]));
  }, [allFields]);
  
  const activeFields = useMemo(() => {
    return allFields.filter(f => f.isActive);
  }, [allFields]);

  if (fieldsLoading || assetsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader />
        <span className="ml-3 text-gray-600">正在加载资产数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">我提交的资产记录</h3>
      {myAssets.length === 0 ? (
        <p className="text-gray-500">您尚未提交任何资产记录。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAssets.map(asset => {
            const batchSize = asset.batchData ? asset.batchData.length : 0;
            const firstRow = batchSize > 0 ? asset.batchData[0] : null;
            // 尝试找到第一个活动字段来显示
            let summaryField = null;
            if (firstRow) {
              for (const fieldId of Object.keys(firstRow)) {
                const field = fieldMap.get(fieldId);
                if (field && field.isActive) {
                  summaryField = { label: field.label, value: firstRow[fieldId] };
                  break;
                }
              }
            }

            return (
              <div
                key={asset.id}
                onClick={() => setViewingAsset(asset)}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-500 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    提交于: {asset.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                    共 {batchSize} 条记录
                  </span>
                </div>
                {summaryField ? (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">{summaryField.label}: </span>
                    <span className="text-gray-800 truncate">{String(summaryField.value)}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">批次详情...</div>
                )}
                {batchSize > 1 && (
                  <div className="text-sm text-gray-400 italic mt-1">... 等 {batchSize - 1} 条</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Asset Modal */}
      <Modal
        isOpen={!!viewingAsset}
        onClose={() => setViewingAsset(null)}
        title="批量资产详情 (只读)"
      >
        {viewingAsset && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              <strong>资产ID:</strong> {viewingAsset.id}
            </div>
            <div className="text-sm text-gray-500">
              <strong>提交日期:</strong> {viewingAsset.createdAt?.toDate().toLocaleString() || 'N/A'}
            </div>
            <hr className="my-2"/>
            <h4 className="font-semibold text-lg text-gray-700 mb-2">
              包含的 {viewingAsset.batchData?.length || 0} 条记录:
            </h4>
            <div className="overflow-x-auto shadow border-b border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* 动态显示所有遇到的字段 */}
                    {activeFields.map(field => (
                      <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viewingAsset.batchData?.map((row, index) => (
                    <tr key={index}>
                      {activeFields.map(field => (
                        <td key={field.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {row[field.id] || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// SubAccountPanel: Tab 2 - Add Assets
function AddAssetsPanel({ subAccountId }) {
  const { data: allFields, loading: fieldsLoading } = useFirestoreCollection(ASSET_FIELDS_COLLECTION);
  const [rows, setRows] = useState([{}]); // Start with one empty row
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const activeFields = useMemo(() => {
    return allFields.filter(f => f.isActive);
  }, [allFields]);

  const handleAddField = () => {
    setRows([...rows, {}]);
  };

  const handleRemoveField = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleInputChange = (index, fieldId, value) => {
    const newRows = [...rows];
    newRows[index][fieldId] = value;
    setRows(newRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const validRows = rows.filter(row => 
      Object.values(row).some(val => val !== null && val !== undefined && val !== '')
    );

    if (validRows.length === 0) {
      setError("请至少填写一行有效数据。");
      setIsSubmitting(false);
      return;
    }

    try {
      // 创建一个新的批量资产
      const newBatchAsset = {
        ownerId: subAccountId,
        createdAt: serverTimestamp(),
        batchData: validRows // 将所有行保存在一个数组中
      };
      
      await addDoc(collection(db, ASSETS_COLLECTION), newBatchAsset);

      setSuccess(`成功提交一个包含 ${validRows.length} 条记录的批次！`);
      setRows([{}]); // Reset form
    } catch (err) {
      console.error("批量提交失败:", err);
      setError("提交失败: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (fieldsLoading) {
    return <div className="flex justify-center items-center p-8"><Loader /> <span className="ml-3 text-gray-600">加载资产字段...</span></div>;
  }

  if (activeFields.length === 0) {
    return <p className="text-gray-500">当前没有可用的资产字段。请联系超级管理员添加。</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">批量登记新资产</h3>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              {activeFields.map(field => (
                <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={index}>
                {activeFields.map(field => (
                  <td key={field.id} className="px-4 py-2 whitespace-nowrap">
                    <input
                      type={field.type}
                      value={row[field.id] || ''}
                      onChange={(e) => handleInputChange(index, field.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={field.label}
                    />
                  </td>
                ))}
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddField}
        >
          <Plus className="mr-2 h-5 w-5" />
          添加一行
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader /> : <Database className="mr-2 h-5 w-5" />}
          {isSubmitting ? '提交中...' : '提交此批次'}
        </Button>
      </div>
    </form>
  );
}

// SubAccountPanel: Tab 3 - View Files
function ViewFilesPanel({ subAccountId }) {
  const filesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, FILES_COLLECTION), where("allowedUserIds", "array-contains", subAccountId));
  }, [subAccountId]);
  
  const { data: files, loading, error } = useFirestoreQuery(filesQuery);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /> <span className="ml-3 text-gray-600">正在加载可查看的文件...</span></div>;
  }

  if (error) {
    return <div className="p-3 bg-red-100 text-red-700 rounded-md">加载文件失败: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">管理员分享的文件</h3>
      {files.length === 0 ? (
        <p className="text-gray-500">目前没有分享给您的文件。</p>
      ) : (
        <ul className="bg-white shadow border rounded-md divide-y divide-gray-200">
          {files.map(file => (
            <li key={file.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <File className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-800">{file.fileName}</div>
                  <div className="text-sm text-gray-500">
                    上传于: {file.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  </div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => alert(`假装正在下载: ${file.fileName}`)}>
                下载
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// --- AdminPanel ---
function AdminPanel({ adminId, allUsers }) {
  const subAccounts = useMemo(() => {
    return allUsers.filter(u => u.role === 'sub_account');
  }, [allUsers]);

  const tabs = [
    { id: 'view-assets', label: '汇总查看资产', component: <ViewAllAssetsPanel allUsers={allUsers} />, icon: Database },
    { id: 'upload-files', label: '文件管理', component: <UploadFilesPanel adminId={adminId} subAccounts={subAccounts} />, icon: File },
  ];
  return <Tabs tabs={tabs} />;
}

// AdminPanel: Tab 1 - View All Assets
// [CHANGED] 修改此组件以使用卡片视图
function ViewAllAssetsPanel({ allUsers }) {
  const { data: allFields, loading: fieldsLoading } = useFirestoreCollection(ASSET_FIELDS_COLLECTION);
  const { data: allAssets, loading: assetsLoading } = useFirestoreCollection(ASSETS_COLLECTION);

  const [selectedUser, setSelectedUser] = useState('all'); // 'all' or user.id
  const [viewingAsset, setViewingAsset] = useState(null); // 用于模态框

  const userMap = useMemo(() => {
    return new Map(allUsers.map(user => [user.id, user.username]));
  }, [allUsers]);

  const fieldMap = useMemo(() => {
    if (!allFields) return new Map();
    return new Map(allFields.map(field => [field.id, field]));
  }, [allFields]);
  
  const activeFields = useMemo(() => {
    return allFields.filter(f => f.isActive);
  }, [allFields]);

  const filteredAssets = useMemo(() => {
    if (selectedUser === 'all') {
      return allAssets;
    }
    return allAssets.filter(asset => asset.ownerId === selectedUser);
  }, [allAssets, selectedUser]);

  if (fieldsLoading || assetsLoading) {
    return <div className="flex justify-center items-center p-8"><Loader /> <span className="ml-3 text-gray-600">正在加载所有资产数据...</span></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">所有子账号资产汇总</h3>
      
      <div className="mb-4">
        <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">
          按子账号筛选:
        </label>
        <select
          id="userFilter"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">所有子账号</option>
          {allUsers.filter(u => u.role === 'sub_account').map(user => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
      </div>

      {/* [NEW] 卡片网格视图 */}
      {filteredAssets.length === 0 ? (
        <p className="text-gray-500">没有找到资产记录。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            const batchSize = asset.batchData ? asset.batchData.length : 0;
            const firstRow = batchSize > 0 ? asset.batchData[0] : null;
            const ownerName = userMap.get(asset.ownerId) || '未知用户';
            
            // 尝试找到第一个活动字段来显示
            let summaryField = null;
            if (firstRow) {
              for (const fieldId of Object.keys(firstRow)) {
                const field = fieldMap.get(fieldId);
                if (field && field.isActive) {
                  summaryField = { label: field.label, value: firstRow[fieldId] };
                  break;
                }
              }
            }

            return (
              <div
                key={asset.id}
                onClick={() => setViewingAsset(asset)}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-500 transition-all"
              >
                {/* [NEW] 显示子账号名称 */}
                <div className="mb-2 pb-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-green-700">{ownerName}</span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    提交于: {asset.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                    共 {batchSize} 条记录
                  </span>
                </div>
                
                {summaryField ? (
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">{summaryField.label}: </span>
                    <span className="text-gray-800 truncate">{String(summaryField.value)}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">批次详情...</div>
                )}
                {batchSize > 1 && (
                  <div className="text-sm text-gray-400 italic mt-1">... 等 {batchSize - 1} 条</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* [NEW] 查看资产模态框 (从 MyAssetsPanel 复制而来) */}
      <Modal
        isOpen={!!viewingAsset}
        onClose={() => setViewingAsset(null)}
        title="批量资产详情 (只读)"
      >
        {viewingAsset && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              <strong>资产ID:</strong> {viewingAsset.id}
            </div>
            <div className="text-sm text-gray-500">
              <strong>提交者:</strong> {userMap.get(viewingAsset.ownerId) || '未知'}
            </div>
            <div className="text-sm text-gray-500">
              <strong>提交日期:</strong> {viewingAsset.createdAt?.toDate().toLocaleString() || 'N/A'}
            </div>
            <hr className="my-2"/>
            <h4 className="font-semibold text-lg text-gray-700 mb-2">
              包含的 {viewingAsset.batchData?.length || 0} 条记录:
            </h4>
            <div className="overflow-x-auto shadow border-b border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* 动态显示所有遇到的字段 */}
                    {activeFields.map(field => (
                      <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viewingAsset.batchData?.map((row, index) => (
                    <tr key={index}>
                      {activeFields.map(field => (
                        <td key={field.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {row[field.id] || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// AdminPanel: Tab 2 - Upload Files
function UploadFilesPanel({ adminId, subAccounts }) {
  const { data: files, loading, error } = useFirestoreCollection(FILES_COLLECTION);
  const [isUploading, setIsUploading] = useState(false);
  
  const [editingFile, setEditingFile] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  // 自定义确认模态框状态
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };

  const handleUpload = async () => {
    const fileName = prompt("请输入要模拟上传的文件名 (例如: '季报.pdf'):");
    if (!fileName) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, FILES_COLLECTION), {
        fileName: fileName,
        uploaderId: adminId,
        createdAt: serverTimestamp(),
        allowedUserIds: [], 
      });
    } catch (err) {
      console.error("上传失败:", err);
    }
    setIsUploading(false);
  };
  
  const handleDelete = (fileId) => {
    showConfirm(
      "删除文件",
      "确定要删除这个文件吗？此操作无法撤销。",
      async () => {
        try {
          await deleteDoc(doc(db, FILES_COLLECTION, fileId));
        } catch (err) {
          console.error("删除失败:", err);
        }
        closeConfirm();
      }
    );
  };

  const openPermissionsModal = (file) => {
    setEditingFile(file);
    setSelectedUserIds(new Set(file.allowedUserIds || []));
  };
  
  const closePermissionsModal = () => {
    setEditingFile(null);
    setSelectedUserIds(new Set());
  };

  const handlePermissionToggle = (userId) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };
  
  const savePermissions = async () => {
    if (!editingFile) return;
    
    try {
      await updateDoc(doc(db, FILES_COLLECTION, editingFile.id), {
        allowedUserIds: Array.from(selectedUserIds)
      });
      closePermissionsModal();
    } catch (err) {
      console.error("更新权限失败:", err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /> <span className="ml-3 text-gray-600">加载文件列表...</span></div>;
  }
  
  if (error) {
    return <div className="p-3 bg-red-100 text-red-700 rounded-md">加载文件失败: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">文件管理</h3>
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? <Loader /> : <Plus />}
          <span className="ml-2">模拟上传新文件</span>
        </Button>
      </div>

      <ul className="bg-white shadow border rounded-md divide-y divide-gray-200">
        {files.length === 0 ? (
          <li className="p-4 text-center text-gray-500">尚未上传任何文件。</li>
        ) : (
          files.map(file => (
            <li key={file.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <File className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <div className="font-medium text-gray-800">{file.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {file.allowedUserIds?.length || 0} 个子账号可查看
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => openPermissionsModal(file)}>
                  <Users className="h-4 w-4 mr-2" />
                  管理权限
                </Button>
                <Button variant="danger" onClick={() => handleDelete(file.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
      
      <Modal
        isOpen={!!editingFile}
        onClose={closePermissionsModal}
        title={`管理文件权限: ${editingFile?.fileName}`}
      >
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {subAccounts.map(user => (
            <label key={user.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedUserIds.has(user.id)}
                onChange={() => handlePermissionToggle(user.id)}
              />
              <span className="ml-3 text-sm text-gray-700">{user.username}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={closePermissionsModal}>
            取消
          </Button>
          <Button variant="primary" onClick={savePermissions}>
            保存权限
          </Button>
        </div>
      </Modal>
      
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        title={confirmModal.title}
      >
        <div>
          <p className="text-gray-600">{confirmModal.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={closeConfirm}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmModal.onConfirm}>
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// --- SuperAdminPanel ---
function SuperAdminPanel() {
  const { data: allFields, loading, error } = useFirestoreCollection(ASSET_FIELDS_COLLECTION);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    
    try {
      await addDoc(collection(db, ASSET_FIELDS_COLLECTION), {
        label: newFieldName,
        type: newFieldType,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewFieldName('');
      setNewFieldType('text');
    } catch (err) {
      console.error("添加字段失败:", err);
    }
  };

  const toggleFieldStatus = (field) => {
    const newStatus = !field.isActive;
    const action = newStatus ? "激活" : "归档";
    const message = newStatus
      ? `确定要重新激活 "${field.label}" 字段吗？`
      : `确定要归档 "${field.label}" 字段吗？归档后，子账号将无法在新资产中填写此字段，但历史数据会保留。`;
    
    showConfirm(
      `${action}字段`,
      message,
      async () => {
        try {
          await updateDoc(doc(db, ASSET_FIELDS_COLLECTION, field.id), {
            isActive: newStatus
          });
        } catch (err) {
          console.error(`${action}失败:`, err);
        }
        closeConfirm();
      }
    );
  };
  
  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /> <span className="ml-3 text-gray-600">加载资产字段...</span></div>;
  }
  
  if (error) {
    return <div className="p-3 bg-red-100 text-red-700 rounded-md">加载字段失败: {error.message}</div>;
  }
  
  const activeFields = allFields.filter(f => f.isActive);
  const archivedFields = allFields.filter(f => !f.isActive);

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-800 mb-3">添加新资产字段</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="新字段名称 (例如: 备注)"
            className="flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value)}
            className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="text">文本 (短)</option>
            <option value="textarea">文本 (长)</option>
            <option value="number">数字</option>
            <option value="date">日期</option>
          </select>
          <Button type="submit" variant="primary">
            <Plus className="mr-2 h-5 w-5" />
            添加字段
          </Button>
        </div>
      </form>

      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-800 mb-3">当前可用字段</h3>
        <ul className="divide-y divide-gray-200">
          {activeFields.length === 0 && <li className="py-3 text-center text-gray-500">没有可用的字段。</li>}
          {activeFields.map(field => (
            <li key={field.id} className="py-3 flex justify-between items-center">
              <div>
                <span className="text-gray-900 font-medium">{field.label}</span>
                <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{field.type}</span>
              </div>
              <Button variant="secondary" onClick={() => toggleFieldStatus(field)}>
                <Archive className="h-4 w-4 mr-2" />
                归档
              </Button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-medium text-gray-800 mb-3">已归档字段 (历史记录)</h3>
        <ul className="divide-y divide-gray-200">
          {archivedFields.length === 0 && <li className="py-3 text-center text-gray-500">没有已归档的字段。</li>}
          {archivedFields.map(field => (
            <li key={field.id} className="py-3 flex justify-between items-center">
              <div>
                <span className="text-gray-500 font-medium italic line-through">{field.label}</span>
                <span className="ml-3 text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{field.type}</span>
              </div>
              <Button variant="secondary" onClick={() => toggleFieldStatus(field)}>
                重新激活
              </Button>
            </li>
          ))}
        </ul>
      </div>
      
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        title={confirmModal.title}
      >
        <div>
          <p className="text-gray-600">{confirmModal.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={closeConfirm}>
              取消
            </Button>
            <Button variant="primary" onClick={confirmModal.onConfirm}>
              确认
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// --- App (主组件) ---
function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null); 
  const [appUser, setAppUser] = useState(null); 
  
  const usersCollectionPath = isAuthReady ? USERS_COLLECTION : null;
  const { data: allAppUsers, loading: usersLoading, error: usersError } = useFirestoreCollection(usersCollectionPath);

  const [error, setError] = useState(null);
  
  // 1. 处理 Firebase 认证
  useEffect(() => {
    if (!auth) {
      setError("Firebase Auth 未初始化");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Firebase Auth 状态变更，用户已登录:", user.uid);
        setFirebaseUser(user);
        setIsAuthReady(true);
      } else {
        console.log("Firebase Auth 状态变更，用户未登录。尝试登录...");
        
        const signIn = async () => {
          try {
            // [MODIFIED] 移除 __initial_auth_token 检查，因为 Netlify 环境没有这个
            // 始终使用匿名登录作为演示
            console.log("使用匿名方式登录...");
            await signInAnonymously(auth);
            
          } catch (err) {
            console.error("Firebase 登录失败:", err);
            setError("Firebase 登录失败: " + err.message);
            setIsAuthReady(true); 
          }
        };
        
        // 在非 Canvas 环境中 (如 Netlify)，我们需要一种登录方式。
        // 对于这个模拟应用，匿名登录是最好的选择。
        if (!firebaseConfig.apiKey) {
           setError("Firebase 配置未找到。请检查 Netlify 环境变量。");
           setIsAuthReady(true);
        } else {
           signIn();
        }
      }
    });

    return () => unsubscribe();
  }, []); 
  
  // 1b. 处理来自 useFirestoreCollection 的数据加载错误
  useEffect(() => {
    if (usersError) {
      console.error("Firestore (allAppUsers) 加载错误:", usersError);
      setError("无法加载用户数据: " + usersError.message);
    }
  }, [usersError]); 

  // 2. 渲染逻辑
  if (error) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">系统错误</h2>
          <p>{error}</p>
          <p className="mt-4 text-sm">请检查您的 Firebase 配置或网络连接，然后刷新页面。</p>
        </div>
      </div>
    );
  }

  if (!isAuthReady || (isAuthReady && usersLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader />
          <p className="mt-2 text-lg text-gray-600">
            {!isAuthReady ? '连接到 Firebase...' : '加载用户数据...'}
          </p>
        </div>
      </div>
    );
  }

  if (!appUser) {
    return <LoginScreen onLogin={setAppUser} isAuthReady={isAuthReady} />;
  }

  return (
    <Dashboard 
      appUser={appUser} 
      onLogout={() => setAppUser(null)} 
      allUsers={allAppUsers} 
    />
  );
}

export default App;