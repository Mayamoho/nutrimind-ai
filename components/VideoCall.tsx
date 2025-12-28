import React, { useEffect, useRef, useState } from 'react';
import { useWebRTCContext } from '../contexts/WebRTCContext';
import { useWebRTC } from '../services/webrtc';
import { VideoCameraIcon, MicrophoneIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/outline';

interface VideoCallProps {
  roomId?: string;
  socketUrl?: string;
  className?: string;
}

export function VideoCall({ 
  roomId = 'default-room', 
  socketUrl = 'http://localhost:3001',
  className = ''
}: VideoCallProps) {
  const { 
    state, 
    setConnecting, 
    setConnected, 
    setLocalStream, 
    addRemoteStream, 
    removeRemoteStream,
    setAudioMuted,
    setVideoMuted,
    setError,
    setRoomId 
  } = useWebRTCContext();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const webrtc = useWebRTC({
    socketUrl,
    roomId,
    onStream: (stream) => {
      addRemoteStream(`remote-${Date.now()}`, stream);
    },
    onConnect: () => {
      setConnected(true);
      setConnecting(false);
    },
    onDisconnect: () => {
      setConnected(false);
    },
    onError: (error) => {
      setError(error.message);
      setConnecting(false);
    },
  });

  useEffect(() => {
    if (!isInitialized && !state.isConnected) {
      initializeCall();
    }
  }, [isInitialized, state.isConnected]);

  useEffect(() => {
    // Set local video stream
    if (localVideoRef.current && state.localStream) {
      localVideoRef.current.srcObject = state.localStream;
    }
  }, [state.localStream]);

  useEffect(() => {
    // Set remote video streams
    state.remoteStreams.forEach((stream, id) => {
      const videoElement = remoteVideoRefs.current.get(id);
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });
  }, [state.remoteStreams]);

  const initializeCall = async () => {
    try {
      setConnecting(true);
      setRoomId(roomId);
      await webrtc.initialize();
      
      const localStream = webrtc.getLocalStream();
      if (localStream) {
        setLocalStream(localStream);
      }
      
      setIsInitialized(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize call');
      setConnecting(false);
    }
  };

  const toggleAudio = () => {
    const newMutedState = !state.isAudioMuted;
    setAudioMuted(newMutedState);
    webrtc.muteAudio(newMutedState);
  };

  const toggleVideo = () => {
    const newMutedState = !state.isVideoMuted;
    setVideoMuted(newMutedState);
    webrtc.muteVideo(newMutedState);
  };

  const endCall = () => {
    webrtc.disconnect();
    setConnected(false);
    setLocalStream(null);
    state.remoteStreams.forEach((_, id) => removeRemoteStream(id));
    setIsInitialized(false);
  };

  const setRemoteVideoRef = (id: string, element: HTMLVideoElement | null) => {
    if (element) {
      remoteVideoRefs.current.set(id, element);
      const stream = state.remoteStreams.get(id);
      if (stream) {
        element.srcObject = stream;
      }
    } else {
      remoteVideoRefs.current.delete(id);
    }
  };

  if (state.error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 font-medium">Connection Error</p>
          <p className="text-red-500 text-sm mt-1">{state.error}</p>
          <button
            onClick={initializeCall}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-[400px]">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {state.isVideoMuted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoCameraSlashIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
            You
            {state.isAudioMuted && (
              <MicrophoneIcon className="inline w-4 h-4 ml-1 text-red-400" />
            )}
          </div>
        </div>

        {/* Remote Videos */}
        {Array.from(state.remoteStreams.entries()).map(([id, stream]) => (
          <div key={id} className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={(el) => setRemoteVideoRef(id, el)}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
              Remote User
            </div>
          </div>
        ))}

        {/* Empty State for Remote Video */}
        {state.remoteStreams.size === 0 && state.isConnected && (
          <div className="flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center">
              <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Waiting for others to join...</p>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {state.isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white">Connecting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${
            state.isAudioMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          disabled={!state.isConnected && !state.isConnecting}
        >
          <MicrophoneIcon className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            state.isVideoMuted 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          disabled={!state.isConnected && !state.isConnecting}
        >
          {state.isVideoMuted ? (
            <VideoCameraSlashIcon className="w-6 h-6 text-white" />
          ) : (
            <VideoCameraIcon className="w-6 h-6 text-white" />
          )}
        </button>

        <button
          onClick={endCall}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          disabled={!state.isConnected && !state.isConnecting}
        >
          <PhoneIcon className="w-6 h-6 text-white transform rotate-135" />
        </button>
      </div>

      {/* Room Info */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <p className="text-gray-400 text-sm text-center">
          Room: {roomId} | Status: {state.isConnecting ? 'Connecting...' : state.isConnected ? 'Connected' : 'Disconnected'}
        </p>
      </div>
    </div>
  );
}
