import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isLoading: boolean;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('nutrimind_token');
            const storedUser = localStorage.getItem('nutrimind_user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('nutrimind_user');
            localStorage.removeItem('nutrimind_token');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (loggedInUser: User, authToken: string) => {
        setUser(loggedInUser);
        setToken(authToken);
        localStorage.setItem('nutrimind_user', JSON.stringify(loggedInUser));
        localStorage.setItem('nutrimind_token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('nutrimind_user');
        localStorage.removeItem('nutrimind_token');
    };

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('nutrimind_user', JSON.stringify(updatedUser));
    }, []);


    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};