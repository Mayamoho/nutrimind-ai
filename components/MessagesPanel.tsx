import React, { useState, useEffect, useRef } from 'react';
import socialApi from '../services/socialService';

interface MessagesPanelProps {
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

const MessagesPanel: React.FC<MessagesPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{email: string, last_name: string}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

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
      setNewMessage('');
      loadMessages(); // Refresh conversation
    } catch (error) {
      console.error('Failed to send message:', error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Messages</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Search - At top */}
        <div className="mb-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {showUserDropdown && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.email}
                      onClick={() => handleUserSelect(user)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{user.last_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-center py-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>
                {selectedFriend ? 'No messages yet' : 'Select a friend to start messaging'}
              </p>
              <p className="text-sm">
                {selectedFriend ? 'Send your first message!' : 'Search for a user above'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-lg p-4 ${message.is_read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{message.sender_name}</span>
                      {!message.is_read && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">New</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{message.message}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input - At bottom */}
        <div className="border-t pt-4">
          {selectedFriend && (
            <div className="mb-2 text-sm text-gray-600">
              Messaging: <span className="font-medium">{searchQuery}</span>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedFriend ? "Type your message..." : "Select a friend first..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
              disabled={!selectedFriend}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={!selectedFriend}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesPanel;
