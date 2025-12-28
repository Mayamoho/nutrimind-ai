import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCameraIcon, PhoneIcon, MicrophoneIcon, SpeakerWaveIcon } from './icons';

interface MeetingPageProps {
  roomId: string;
}

const MeetingPage: React.FC<MeetingPageProps> = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/social');
      return;
    }

    initializeMeeting();
    return () => {
      cleanupMeeting();
    };
  }, [roomId]);

  const initializeMeeting = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate connection (in production, this would connect to signaling server)
      setTimeout(() => {
        setIsConnected(true);
        setParticipantCount(Math.floor(Math.random() * 3) + 1); // Simulate 1-3 participants
      }, 2000);

      console.log(`[MEETING] Initialized meeting for room: ${roomId}`);
    } catch (error) {
      console.error('Error initializing meeting:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const cleanupMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const leaveMeeting = () => {
    cleanupMeeting();
    navigate('/social');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <VideoCameraIcon className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-white font-semibold">In-App Meeting</h1>
            <p className="text-gray-400 text-sm">Room: {roomId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <span className="text-sm text-gray-400">Participants:</span> {participantCount}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
          }`}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
            <p className="text-white text-sm">You</p>
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoCameraIcon className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>

        {/* Remote Video (placeholder) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
            <p className="text-white text-sm">Participant {participantCount > 1 ? '1' : '(Waiting...)'}</p>
          </div>
          {!isConnected && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Waiting for participants...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-center space-x-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <VideoCameraIcon className="w-5 h-5" />
        </button>

        <button
          onClick={leaveMeeting}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors flex items-center space-x-2"
        >
          <PhoneIcon className="w-5 h-5 transform rotate-135" />
          <span>Leave Meeting</span>
        </button>
      </div>
    </div>
  );
};

export default MeetingPage;
