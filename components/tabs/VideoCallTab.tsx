import React, { useState } from 'react';
import { VideoCall } from '../VideoCall';
import { VideoCameraIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function VideoCallTab() {
  const [roomId, setRoomId] = useState('');
  const [showCall, setShowCall] = useState(false);

  const handleStartCall = () => {
    if (roomId.trim()) {
      setShowCall(true);
    }
  };

  const handleEndCall = () => {
    setShowCall(false);
  };

  if (showCall) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Video Call</h2>
          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Leave Call
          </button>
        </div>
        <VideoCall roomId={roomId} className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Video Calls</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Start or join a video call with other users
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID or create one"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleStartCall}
              disabled={!roomId.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <VideoCameraIcon className="w-5 h-5 mr-2" />
              Start Video Call
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            How to use Video Calls
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">1.</span>
              <span>Enter a room ID to create a new room or join an existing one</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">2.</span>
              <span>Share the room ID with others you want to call</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">3.</span>
              <span>Grant camera and microphone permissions when prompted</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">4.</span>
              <span>Use the controls to mute/unmute audio and video</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
