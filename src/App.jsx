import React, { useState, useEffect } from 'react';

// 导入拆分出来的组件
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { LoadingScreen } from './utils/UI';
import { useAPI } from './hooks/useAPI';

// --- Main App Component ---
function App() {
    const { getCollectionHook } = useAPI();
    const [currentUser, setCurrentUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // 检查token并验证用户
    useEffect(() => {
        async function checkAuth() {
            try {
                const { getToken } = await import('./utils/api');
                const token = getToken();
                if (token) {
                    const { authAPI } = await import('./utils/api');
                    const response = await authAPI.verify();
                    if (response.valid && response.user) {
                        setCurrentUser(response.user);
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
        setCurrentUser(user);
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
        <Dashboard 
            user={currentUser} 
            onLogout={handleLogout} 
            getCollectionHook={getCollectionHook}
        />
    );
}

export default App;
