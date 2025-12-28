import React from 'react';
import { Friend, FriendRequest } from '../types';
import { UserIcon } from './icons';

interface FriendListProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onMessage?: (friendEmail: string) => void;
  onRemoveFriend?: (friendEmail: string) => void;
  onAcceptRequest?: (requesterEmail: string) => void;
  onDeclineRequest?: (requesterEmail: string) => void;
}

const FriendList: React.FC<FriendListProps> = ({ 
  friends, 
  pendingRequests = [],
  onMessage,
  onRemoveFriend,
  onAcceptRequest,
  onDeclineRequest
}) => {
  return (
    <div className="space-y-6">
      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.requester_email} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{request.last_name}</p>
                    <p className="text-sm text-gray-500">{request.requester_email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptRequest?.(request.requester_email)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                    title="Accept"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeclineRequest?.(request.requester_email)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                    title="Decline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <p className="mt-2">No friends yet</p>
            <p className="text-sm">Add friends to see their activity here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.friend_email} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{friend.last_name}</p>
                    <p className="text-sm text-gray-500">
                      {friend.country} • Friends since {new Date(friend.friends_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onMessage?.(friend.friend_email)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {onRemoveFriend && (
                    <button
                      onClick={() => onRemoveFriend(friend.friend_email)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                      title="Remove Friend"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendList;
