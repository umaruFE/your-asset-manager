import { useState, useEffect, useRef } from 'react';
import { createStorageListener, readFromStorage } from './localStorageUtils';

// 自定义Hook：模拟Firestore的useFirestoreCollection
function useLocalStorageCollection(collectionName, appId = 'default-asset-manager') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // 立即读取当前数据
      const currentData = readFromStorage(collectionName, appId);
      setData(currentData);
      setLoading(false);

      // 设置数据变化监听
      unsubscribeRef.current = createStorageListener(
        collectionName,
        (newData) => {
          setData(newData);
          setLoading(false);
        },
        appId
      );

    } catch (err) {
      console.error(`useLocalStorageCollection 错误 (${collectionName}):`, err);
      setError(err.message || '加载数据失败');
      setLoading(false);
    }

    // 清理函数
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [collectionName, appId]);

  return { data, loading, error };
}

export default useLocalStorageCollection;