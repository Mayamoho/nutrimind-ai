import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';

const ApiKeyModal: React.FC = () => {
    const { setApiKey } = useApiKey();
    const [localKey, setLocalKey] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!localKey.trim()) {
            setError('API Key cannot be empty.');
            return;
        }
        setApiKey(localKey.trim());
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold">Enter Your Gemini API Key</h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        To use the AI-powered features of this app, you need a Gemini API key. 
                        This key is stored only in your browser's local storage and is not sent to any server besides Google's.
                    </p>
                    
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg">
                        <p className="text-sm font-semibold">Important for Local Development:</p>
                        <p className="text-xs mt-1">
                            If your key doesn't work on `localhost`, check its "HTTP referrer" restrictions in your Google Cloud project. You must either **remove all restrictions** or add `localhost:*` as an allowed referrer.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                        <input
                            type="password"
                            id="apiKey"
                            value={localKey}
                            onChange={(e) => {
                                setLocalKey(e.target.value);
                                if (error) setError('');
                            }}
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                            placeholder="Enter your key here"
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400">
                        You can get your key from{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                            Google AI Studio
                        </a>.
                    </p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 rounded-b-2xl">
                    <button
                        onClick={handleSave}
                        className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
                        disabled={!localKey.trim()}
                    >
                        Save and Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;