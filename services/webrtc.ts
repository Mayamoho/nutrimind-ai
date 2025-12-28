import { useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

export interface WebRTCServiceOptions {
  socketUrl?: string;
  roomId?: string;
  onStream?: (stream: MediaStream) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private options: WebRTCServiceOptions;
  private isInitiator: boolean = false;

  constructor(options: WebRTCServiceOptions = {}) {
    this.options = {
      socketUrl: 'http://localhost:3000',
      roomId: 'default-room',
      ...options,
    };
  }

  async initialize(): Promise<void> {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Initialize socket connection
      this.socket = io(this.options.socketUrl!, {
        transports: ['websocket'],
      });

      this.setupSocketListeners();
      this.connectToRoom();
    } catch (error) {
      this.options.onError?.(error as Error);
      throw error;
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('room-users', (users: string[]) => {
      console.log('Users in room:', users);
      this.handleRoomUsers(users);
    });

    this.socket.on('signal', (data: { from: string; signal: any }) => {
      this.handleSignal(data.from, data.signal);
    });

    this.socket.on('user-disconnected', (userId: string) => {
      this.handleUserDisconnected(userId);
    });

    this.socket.on('connect_error', (error) => {
      this.options.onError?.(new Error(`Socket connection error: ${error.message}`));
    });
  }

  private connectToRoom(): void {
    if (!this.socket) return;
    this.socket.emit('join-room', this.options.roomId);
  }

  private handleRoomUsers(users: string[]): void {
    if (!this.socket) return;

    users.forEach(userId => {
      if (!this.peers.has(userId)) {
        this.createPeer(userId, users.length === 1);
      }
    });
  }

  private createPeer(userId: string, initiator: boolean): void {
    if (!this.localStream) return;

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: this.localStream,
    });

    peer.on('signal', (signal) => {
      if (this.socket) {
        this.socket.emit('signal', { to: userId, signal });
      }
    });

    peer.on('connect', () => {
      console.log('Connected to peer:', userId);
      this.peers.set(userId, peer);
      this.options.onConnect?.();
    });

    peer.on('stream', (stream) => {
      console.log('Received stream from:', userId);
      this.options.onStream?.(stream);
    });

    peer.on('close', () => {
      this.peers.delete(userId);
      this.options.onDisconnect?.();
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.options.onError?.(error);
    });

    this.peers.set(userId, peer);
  }

  private handleSignal(from: string, signal: any): void {
    const peer = this.peers.get(from);
    
    if (peer) {
      peer.signal(signal);
    } else {
      // Create peer if it doesn't exist (for incoming connections)
      this.createPeer(from, false);
      // Retry signaling after peer creation
      setTimeout(() => {
        const newPeer = this.peers.get(from);
        if (newPeer) {
          newPeer.signal(signal);
        }
      }, 100);
    }
  }

  private handleUserDisconnected(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getPeers(): Map<string, SimplePeer.Instance> {
    return this.peers;
  }

  muteAudio(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  muteVideo(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  disconnect(): void {
    // Destroy all peers
    this.peers.forEach(peer => peer.destroy());
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// React hook for WebRTC
export function useWebRTC(options: WebRTCServiceOptions) {
  const serviceRef = useRef<WebRTCService | null>(null);
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());

  useEffect(() => {
    const service = new WebRTCService({
      ...options,
      onStream: (stream) => {
        // Store remote streams
        streamsRef.current.set('remote', stream);
        options.onStream?.(stream);
      },
    });

    serviceRef.current = service;

    return () => {
      service.disconnect();
    };
  }, []);

  const initialize = async () => {
    if (serviceRef.current) {
      await serviceRef.current.initialize();
    }
  };

  const getLocalStream = () => serviceRef.current?.getLocalStream() || null;
  const getRemoteStreams = () => Array.from(streamsRef.current.values());
  const muteAudio = (muted: boolean) => serviceRef.current?.muteAudio(muted);
  const muteVideo = (muted: boolean) => serviceRef.current?.muteVideo(muted);
  const disconnect = () => serviceRef.current?.disconnect();

  return {
    initialize,
    getLocalStream,
    getRemoteStreams,
    muteAudio,
    muteVideo,
    disconnect,
  };
}
