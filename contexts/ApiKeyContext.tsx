import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
    isApiKeySet: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = 'nutrimind_gemini_api_key';

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [apiKey, setApiKeyState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for pre-configured key from AI Studio environment first
        const envKey = process.env.API_KEY;
        if (envKey) {
            setApiKeyState(envKey);
            setIsLoading(false);
            return;
        }

        // Otherwise, check localStorage for a user-provided key
        try {
            const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
            if (storedKey) {
                setApiKeyState(storedKey);
            } else {
                // As a fallback for local development, use the provided key.
                const defaultKey = "AIzaSyAf6Phwh4EsdbSnRrMQSDwvybYH7i-guAA";
                setApiKeyState(defaultKey);
                localStorage.setItem(API_KEY_STORAGE_KEY, defaultKey);
            }
        } catch (error) {
            console.error("Failed to access API key from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setApiKey = (key: string | null) => {
        setApiKeyState(key);
        if (key) {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
        } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    };

    const isApiKeySet = !!apiKey;

    return (
        <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeySet }}>
            {!isLoading && children}
        </ApiKeyContext.Provider>
    );
};

export const useApiKey = (): ApiKeyContextType => {
    const context = useContext(ApiKeyContext);
    if (!context) {
        throw new Error('useApiKey must be used within an ApiKeyProvider');
    }
    return context;
};