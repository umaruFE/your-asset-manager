import React, { useState, useEffect } from 'react';

// 导入拆分出来的组件
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { LoadingScreen, ToastProvider } from './utils/UI';
import { useAPI } from './hooks/useAPI';

// --- Main App Component ---
function App() {
    const { getCollectionHook } = useAPI();
    const [currentUser, setCurrentUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // 检查token并验证用户（并获取完整用户信息）
    useEffect(() => {
        async function checkAuth() {
            try {
                const { getToken } = await import('./utils/api');
                const token = getToken();
                if (token) {
                    const { authAPI, usersAPI } = await import('./utils/api');
                    const response = await authAPI.verify();
                    if (response.valid) {
                        // 尝试获取更完整的用户信息（包含 base）
                        try {
                            const me = await usersAPI.getMe();
                            setCurrentUser(me);
                        } catch (err) {
                            // 回退到 verify 返回的简短用户信息
                            if (response.user) setCurrentUser(response.user);
                        }
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                const { removeToken } = await import('./utils/api');
                removeToken();
            } finally {
                setIsInitialized(true);
            }
        }
        checkAuth();
    }, []);

    // Handle login
    const handleLogin = async (user) => {
        // 登录后 authAPI.login 已设置 token，立即请求完整用户信息
        try {
            const { usersAPI } = await import('./utils/api');
            const me = await usersAPI.getMe();
            setCurrentUser(me);
        } catch (err) {
            // 回退到传入的简短 user 信息
            setCurrentUser(user);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        const { authAPI } = await import('./utils/api');
        authAPI.logout();
        setCurrentUser(null);
    };

    // Show loading screen while initializing
    if (!isInitialized) {
        return <LoadingScreen message="正在初始化系统..." />;
    }

    // Show login screen if no user is logged in
    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Show dashboard for logged in user
    return (
        <ToastProvider>
            <Dashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                getCollectionHook={getCollectionHook}
            />
        </ToastProvider>
    );
}

export default App;
