import React from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { BellIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, dismissNotification, dismissAll, fetchNotifications } = useNotifications();
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

    if (!user) {
        return null;
    }

    // Get initials for avatar (using lastName and email)
    const initials = user.lastName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

    return (
        <>
            <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                                    NutriMind <span className="text-emerald-500">AI</span>
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                                    Your Personal Nutrition Coach
                                </p>
                            </div>
                        </div>

                        {/* User Section */}
                        <div className="flex items-center gap-3">
                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-full pl-1 pr-4 py-1">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {initials}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {user.lastName}
                                </span>
                            </div>

                            {/* Mobile Avatar */}
                            <div className="sm:hidden w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                {initials}
                            </div>

                            {/* Notification Bell */}
                            <button 
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all"
                                aria-label="Notifications"
                            >
                                <BellIcon className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Logout Button */}
                            <button 
                                onClick={logout} 
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all"
                                aria-label="Logout"
                            >
                                <LogoutIcon />
                                <span className="text-sm font-semibold hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-20 z-[9998]"
                        onClick={() => setIsNotificationOpen(false)}
                    />
                    
                    {/* Notification Panel */}
                    <div className="absolute top-20 right-4 w-96 max-h-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                                        ({unreadCount} unread)
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={() => setIsNotificationOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                            >
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto max-h-80">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <>
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                                                notification.status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {notification.status === 'pending' && (
                                                    <button
                                                        onClick={() => dismissNotification(notification.id)}
                                                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                        title="Dismiss"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                                            <button
                                                onClick={dismissAll}
                                                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                            >
                                                Dismiss All
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Header;
