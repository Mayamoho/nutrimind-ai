import React, { useState, useEffect, useRef } from 'react';
import socialApi from '../services/socialService';
import { useToast } from '../contexts/ToastContext';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  message: string;
  sender_name: string;
  sender_email: string;
  created_at: string;
  is_read: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{email: string, last_name: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      loadAllUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    loadMessages();
  }, [selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAllUsers = async () => {
    try {
      const users = await socialApi.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedFriend) {
      setMessages([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await socialApi.getConversation(selectedFriend);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend.trim()) return;

    try {
      await socialApi.sendEncouragement(selectedFriend, newMessage.trim());
      showToast('Message sent successfully!', 'success');
      setNewMessage('');
      loadMessages(); // Refresh conversation
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message', 'error');
    }
  };

  const handleUserSelect = (user: {email: string, last_name: string}) => {
    setSelectedFriend(user.email);
    setSearchQuery(`${user.last_name} (${user.email})`);
    setShowUserDropdown(false);
  };

  const filteredUsers = allUsers.filter(user => 
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Messages</h3>
              <p className="text-sm text-white/80">Connect with your friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Friend Search - Moved to top */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="Search users by name or email..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                
                {showUserDropdown && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.email}
                          onClick={() => handleUserSelect(user)}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{user.last_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedFriend ? 'No messages yet' : 'Select a friend to start messaging'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    {selectedFriend ? 'Send your first message!' : 'Search for a user above'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">{message.sender_name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!message.is_read && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">New</span>
                          )}
                        </div>
                        <div className={`p-3 rounded-lg ${message.is_read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
                          <p className="text-gray-700 dark:text-gray-300">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input - At bottom */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              {selectedFriend ? (
                <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  Messaging: <span className="font-medium">{searchQuery}</span>
                </div>
              ) : (
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Select a friend to start messaging
                </div>
              )}
              <form onSubmit={sendMessage} className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedFriend ? "Type your message..." : "Select a friend first..."}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={!selectedFriend}
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedFriend}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
