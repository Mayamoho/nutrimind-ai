import React from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-2">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            NutriMind <span className="text-emerald-500">AI</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">{user.email}</span>
                        <button 
                            onClick={logout} 
                            className="flex items-center gap-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500 transition-colors"
                            aria-label="Logout"
                        >
                            <LogoutIcon />
                            <span className="text-sm font-semibold">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
