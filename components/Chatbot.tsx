/**
 * RAG-based Chatbot Component
 * Floating chat widget for health-related conversations
 * Uses Retrieval-Augmented Generation with user data and curated knowledge
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// RAG-based message handling
class RAGMessageCommand {
  constructor(
    private message: string
  ) {}

  async execute(): Promise<string> {
    const response = await api.sendChatMessage(this.message);
    return response.response;
  }
}

// Quick suggestion buttons
const QUICK_SUGGESTIONS = [
  { icon: '🍎', text: 'What should I eat today?' },
  { icon: '💪', text: 'Suggest a workout' },
  { icon: '📊', text: 'How am I doing?' },
  { icon: '💧', text: 'How much water should I drink?' },
];

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const dataContext = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen]);

  // Clear chat messages
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'bot',
        content: `Hi ${user?.lastName || 'there'}! 👋 I'm NutriBot, your personal health assistant. Ask me anything about nutrition, exercise, or your health goals!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, user?.lastName]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const command = new RAGMessageCommand(text.trim());
      const response = await command.execute();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: error.message || 'Sorry, I had trouble with that. Please try again! 😅',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickSuggestion = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isOpen 
            ? 'bg-slate-600 hover:bg-slate-700' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <span className="text-2xl">🤖</span>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-white">NutriBot RAG</h3>
                <p className="text-xs text-white/70">Powered by your data</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => handleQuickSuggestion(suggestion.text)}
                    className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                  >
                    <span>{suggestion.icon}</span>
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
