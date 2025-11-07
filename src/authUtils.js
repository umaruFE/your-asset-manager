// 模拟认证系统

// 模拟用户状态
let currentUser = null;
let authListeners = [];

// 模拟认证函数
function signInAnonymously() {
  return new Promise((resolve, reject) => {
    try {
      // 生成模拟用户ID
      const userId = 'local-user-' + Date.now().toString(36);
      currentUser = {
        uid: userId,
        isAnonymous: true,
        displayName: '本地用户',
        email: null
      };
      
      // 通知所有监听器
      authListeners.forEach(listener => {
        try {
          listener(currentUser);
        } catch (error) {
          console.error('认证监听器错误:', error);
        }
      });
      
      console.log('模拟匿名登录成功:', userId);
      resolve({ user: currentUser });
    } catch (error) {
      console.error('模拟登录失败:', error);
      reject(error);
    }
  });
}

// 监听认证状态变化
function onAuthStateChanged(callback) {
  authListeners.push(callback);
  
  // 立即调用一次当前状态
  if (currentUser) {
    setTimeout(() => callback(currentUser), 0);
  }
  
  // 返回取消监听函数
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

// 获取当前用户
function getCurrentUser() {
  return currentUser;
}

// 登出
function signOut() {
  return new Promise((resolve) => {
    const previousUser = currentUser;
    currentUser = null;
    
    // 通知所有监听器
    authListeners.forEach(listener => {
      try {
        listener(null);
      } catch (error) {
        console.error('认证监听器错误:', error);
      }
    });
    
    console.log('模拟登出成功');
    resolve();
  });
}

// 设置持久化（模拟函数，实际不执行任何操作）
function setPersistence(persistence) {
  return Promise.resolve();
}

// 模拟认证系统初始化
export const auth = {
  signInAnonymously,
  onAuthStateChanged,
  getCurrentUser,
  signOut,
  setPersistence
};

export {
  signInAnonymously,
  onAuthStateChanged,
  getCurrentUser,
  signOut,
  setPersistence
};