import { useState, useEffect, useCallback } from 'react';
import { loadInitialCollections, LOCAL_STORAGE_KEY } from '../utils/helpers';

// Custom hook to manage all collections and persistence
export function useLocalStorageCollections() {
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