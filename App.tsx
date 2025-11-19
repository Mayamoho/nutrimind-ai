import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

const AppContent: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <Auth />
            </div>
        );
    }

    return (
        <DataProvider isAuthenticated={!!user}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
                <Header />
                <main className="container mx-auto p-4 md:p-6 lg:p-8">
                    <Dashboard />
                </main>
            </div>
        </DataProvider>
    );
};


const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
