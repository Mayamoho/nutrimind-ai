import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CloseIcon } from './icons/CloseIcon';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match this with transition duration
    };

    return (
        <div 
            className={`fixed top-5 right-5 z-50 flex items-center w-full max-w-xs p-4 text-slate-500 bg-white dark:bg-slate-800 rounded-lg shadow-lg transition-all duration-300 transform ${isFadingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
            role="alert"
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <CheckCircleIcon />
            </div>
            <div className="ml-3 text-sm font-normal text-slate-700 dark:text-slate-300">{message}</div>
            <button 
                type="button" 
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex h-8 w-8 dark:text-slate-500 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700" 
                aria-label="Close"
                onClick={handleClose}
            >
                <span className="sr-only">Close</span>
                <CloseIcon />
            </button>
        </div>
    );
};

export default Toast;