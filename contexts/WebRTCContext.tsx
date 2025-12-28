import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface WebRTCState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  error: string | null;
  roomId: string;
  participants: string[];
}

export type WebRTCAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOCAL_STREAM'; payload: MediaStream | null }
  | { type: 'ADD_REMOTE_STREAM'; payload: { id: string; stream: MediaStream } }
  | { type: 'REMOVE_REMOTE_STREAM'; payload: string }
  | { type: 'SET_AUDIO_MUTED'; payload: boolean }
  | { type: 'SET_VIDEO_MUTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOM_ID'; payload: string }
  | { type: 'SET_PARTICIPANTS'; payload: string[] }
  | { type: 'RESET' };

const initialState: WebRTCState = {
  isConnected: false,
  isConnecting: false,
  localStream: null,
  remoteStreams: new Map(),
  isAudioMuted: false,
  isVideoMuted: false,
  error: null,
  roomId: '',
  participants: [],
};

function webRTCReducer(state: WebRTCState, action: WebRTCAction): WebRTCState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        isConnecting: false,
      };

    case 'SET_LOCAL_STREAM':
      return {
        ...state,
        localStream: action.payload,
      };

    case 'ADD_REMOTE_STREAM': {
      const newRemoteStreams = new Map(state.remoteStreams);
      newRemoteStreams.set(action.payload.id, action.payload.stream);
      return {
        ...state,
        remoteStreams: newRemoteStreams,
      };
    }

    case 'REMOVE_REMOTE_STREAM': {
      const newRemoteStreams = new Map(state.remoteStreams);
      newRemoteStreams.delete(action.payload);
      return {
        ...state,
        remoteStreams: newRemoteStreams,
      };
    }

    case 'SET_AUDIO_MUTED':
      return {
        ...state,
        isAudioMuted: action.payload,
      };

    case 'SET_VIDEO_MUTED':
      return {
        ...state,
        isVideoMuted: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isConnecting: false,
        isConnected: false,
      };

    case 'SET_ROOM_ID':
      return {
        ...state,
        roomId: action.payload,
      };

    case 'SET_PARTICIPANTS':
      return {
        ...state,
        participants: action.payload,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface WebRTCContextType {
  state: WebRTCState;
  dispatch: React.Dispatch<WebRTCAction>;
  // Convenience methods
  setConnecting: (connecting: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (id: string, stream: MediaStream) => void;
  removeRemoteStream: (id: string) => void;
  setAudioMuted: (muted: boolean) => void;
  setVideoMuted: (muted: boolean) => void;
  setError: (error: string | null) => void;
  setRoomId: (roomId: string) => void;
  setParticipants: (participants: string[]) => void;
  reset: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

interface WebRTCProviderProps {
  children: ReactNode;
}

export function WebRTCProvider({ children }: WebRTCProviderProps) {
  const [state, dispatch] = useReducer(webRTCReducer, initialState);

  const contextValue: WebRTCContextType = {
    state,
    dispatch,
    setConnecting: (connecting: boolean) => dispatch({ type: 'SET_CONNECTING', payload: connecting }),
    setConnected: (connected: boolean) => dispatch({ type: 'SET_CONNECTED', payload: connected }),
    setLocalStream: (stream: MediaStream | null) => dispatch({ type: 'SET_LOCAL_STREAM', payload: stream }),
    addRemoteStream: (id: string, stream: MediaStream) => 
      dispatch({ type: 'ADD_REMOTE_STREAM', payload: { id, stream } }),
    removeRemoteStream: (id: string) => dispatch({ type: 'REMOVE_REMOTE_STREAM', payload: id }),
    setAudioMuted: (muted: boolean) => dispatch({ type: 'SET_AUDIO_MUTED', payload: muted }),
    setVideoMuted: (muted: boolean) => dispatch({ type: 'SET_VIDEO_MUTED', payload: muted }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setRoomId: (roomId: string) => dispatch({ type: 'SET_ROOM_ID', payload: roomId }),
    setParticipants: (participants: string[]) => dispatch({ type: 'SET_PARTICIPANTS', payload: participants }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTCContext(): WebRTCContextType {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
}
