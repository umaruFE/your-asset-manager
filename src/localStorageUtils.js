// localStorage 数据管理工具函数

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取应用数据存储键
function getStorageKey(collectionName, appId = 'default-asset-manager') {
  return `asset-manager-${appId}-${collectionName}`;
}

// 从localStorage读取数据
function readFromStorage(collectionName, appId) {
  try {
    const key = getStorageKey(collectionName, appId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`读取 ${collectionName} 数据失败:`, error);
    return [];
  }
}

// 写入数据到localStorage
function writeToStorage(collectionName, data, appId) {
  try {
    const key = getStorageKey(collectionName, appId);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`写入 ${collectionName} 数据失败:`, error);
    return false;
  }
}

// 添加新文档
function addDoc(collectionName, data, appId) {
  const docs = readFromStorage(collectionName, appId);
  const newDoc = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  docs.push(newDoc);
  writeToStorage(collectionName, docs, appId);
  return newDoc;
}

// 更新文档
function updateDoc(collectionName, docId, updates, appId) {
  const docs = readFromStorage(collectionName, appId);
  const docIndex = docs.findIndex(doc => doc.id === docId);
  if (docIndex !== -1) {
    docs[docIndex] = {
      ...docs[docIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeToStorage(collectionName, docs, appId);
    return docs[docIndex];
  }
  return null;
}

// 删除文档
function deleteDoc(collectionName, docId, appId) {
  const docs = readFromStorage(collectionName, appId);
  const filteredDocs = docs.filter(doc => doc.id !== docId);
  writeToStorage(collectionName, filteredDocs, appId);
  return true;
}

// 查询文档
function queryDocs(collectionName, conditions = {}, appId) {
  const docs = readFromStorage(collectionName, appId);
  return docs.filter(doc => {
    return Object.entries(conditions).every(([key, value]) => {
      return doc[key] === value;
    });
  });
}

// 获取文档
function getDoc(collectionName, docId, appId) {
  const docs = readFromStorage(collectionName, appId);
  return docs.find(doc => doc.id === docId) || null;
}

// 监听数据变化（模拟Firebase的onSnapshot）
function createStorageListener(collectionName, callback, appId) {
  const key = getStorageKey(collectionName, appId);
  
  // 存储当前数据状态
  let currentData = readFromStorage(collectionName, appId);
  
  // 立即调用一次回调
  callback(currentData);
  
  // 监听storage事件
  const handleStorageChange = (event) => {
    if (event.key === key && event.newValue !== event.oldValue) {
      const newData = event.newValue ? JSON.parse(event.newValue) : [];
      callback(newData);
      currentData = newData;
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // 返回取消监听函数
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

// 批量写入
function batchWrite(operations, appId) {
  operations.forEach(op => {
    if (op.type === 'set') {
      const docs = readFromStorage(op.collection, appId);
      const existingIndex = docs.findIndex(doc => doc.id === op.data.id);
      if (existingIndex !== -1) {
        docs[existingIndex] = { ...docs[existingIndex], ...op.data };
      } else {
        docs.push({ ...op.data, id: op.data.id || generateId() });
      }
      writeToStorage(op.collection, docs, appId);
    } else if (op.type === 'delete') {
      deleteDoc(op.collection, op.id, appId);
    }
  });
}

// 初始化模拟数据
function initializeMockData(appId) {
  // 检查是否已经初始化
  const usersKey = getStorageKey('allAppUsers', appId);
  if (localStorage.getItem(usersKey)) {
    console.log('数据已存在，跳过初始化');
    return;
  }
  
  console.log('初始化模拟数据...');
  
  // 创建模拟用户
  const mockUsers = [
    { id: 'super_admin_001', name: '超级管理员', role: 'superadmin', uid: '' },
    { id: 'admin_001', name: '管理员 (张三)', role: 'admin', uid: '' },
    { id: 'sub_account_001', name: '子账号一号 (李四)', role: 'subaccount', uid: '' },
    { id: 'sub_account_002', name: '子账号二号 (王五)', role: 'subaccount', uid: '' },
    { id: 'sub_account_003', name: '子账号三号', role: 'subaccount', uid: '' },
    { id: 'sub_account_004', name: '子账号四号', role: 'subaccount', uid: '' },
    { id: 'sub_account_005', name: '子账号五号', role: 'subaccount', uid: '' }
  ];
  
  writeToStorage('allAppUsers', mockUsers, appId);
  
  // 创建资产字段
  const mockAssetFields = [
    { id: 'field_001', name: '资产名称', type: 'text', active: true },
    { id: 'field_002', name: '资产编号', type: 'text', active: true },
    { id: 'field_003', name: '资产价值', type: 'number', active: true },
    { id: 'field_004', name: '购买日期', type: 'date', active: true }
  ];
  
  writeToStorage('assetFields', mockAssetFields, appId);
  
  // 初始化其他集合为空数组
  writeToStorage('assets', [], appId);
  writeToStorage('files', [], appId);
  
  console.log('模拟数据初始化完成');
}

export {
  generateId,
  getStorageKey,
  readFromStorage,
  writeToStorage,
  addDoc,
  updateDoc,
  deleteDoc,
  queryDocs,
  getDoc,
  createStorageListener,
  batchWrite,
  initializeMockData
};