/**
 * In-App Meeting Service using WebRTC
 * Real-time video/audio calls without external services
 */

class InAppMeetingService {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.roomId = null;
    this.socket = null;
    this.isHost = false;
    this.participants = new Map();
  }

  /**
   * Initialize WebRTC meeting
   */
  async initializeMeeting(roomId, isHost = false) {
    try {
      this.roomId = roomId;
      this.isHost = isHost;

      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        console.log('[IN-APP MEETING] Running in server environment - using mock implementation');
        return true;
      }

      // Get user media (only in browser)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Initialize WebSocket connection for signaling
      await this.initializeSignaling();

      console.log(`[IN-APP MEETING] Meeting initialized for room: ${roomId}`);
      return true;
    } catch (error) {
      console.error('Error initializing meeting:', error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket signaling server
   */
  async initializeSignaling() {
    // In production, this would connect to your WebSocket server
    // For now, we'll use a mock implementation
    console.log('[IN-APP MEETING] Signaling initialized');
  }

  /**
   * Create a new meeting room
   */
  async createMeetingRoom() {
    const roomId = this.generateRoomId();
    await this.initializeMeeting(roomId, true);
    
    // Check if we're in browser environment for window object
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'; // Fallback for server
    
    return {
      roomId,
      meetUrl: `${baseUrl}/meeting/${roomId}`,
      dialInPhone: '+1 555-123-4567',
      password: this.generatePassword(),
      isHost: true
    };
  }

  /**
   * Join an existing meeting room
   */
  async joinMeetingRoom(roomId) {
    await this.initializeMeeting(roomId, false);
    
    // Check if we're in browser environment for window object
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'; // Fallback for server
    
    return {
      roomId,
      meetUrl: `${baseUrl}/meeting/${roomId}`,
      isHost: false
    };
  }

  /**
   * Generate random room ID
   */
  generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate meeting password
   */
  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Start video call
   */
  async startVideoCall() {
    if (!this.localStream) {
      throw new Error('Meeting not initialized');
    }

    try {
      // Create peer connections for each participant
      for (const [participantId, participant] of this.participants) {
        await this.createPeerConnection(participantId);
      }

      console.log('[IN-APP MEETING] Video call started');
      return true;
    } catch (error) {
      console.error('Error starting video call:', error);
      throw error;
    }
  }

  /**
   * Create WebRTC peer connection
   */
  async createPeerConnection(participantId) {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote streams
      peerConnection.ontrack = (event) => {
        this.remoteStreams.set(participantId, event.streams[0]);
        this.onRemoteStreamAdded(participantId, event.streams[0]);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendIceCandidate(participantId, event.candidate);
        }
      };

      this.peerConnections.set(participantId, peerConnection);

      // Create offer if host
      if (this.isHost) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.sendOffer(participantId, offer);
      }

      console.log(`[IN-APP MEETING] Peer connection created for ${participantId}`);
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  /**
   * Handle remote stream added
   */
  onRemoteStreamAdded(participantId, stream) {
    // This will be overridden by the UI component
    console.log(`[IN-APP MEETING] Remote stream added for ${participantId}`);
  }

  /**
   * Send offer to participant
   */
  sendOffer(participantId, offer) {
    // In production, this would send via WebSocket
    console.log(`[IN-APP MEETING] Offer sent to ${participantId}`);
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(participantId, candidate) {
    // In production, this would send via WebSocket
    console.log(`[IN-APP MEETING] ICE candidate sent to ${participantId}`);
  }

  /**
   * End meeting
   */
  async endMeeting() {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Close peer connections
      for (const [participantId, peerConnection] of this.peerConnections) {
        peerConnection.close();
      }

      // Clear data
      this.remoteStreams.clear();
      this.peerConnections.clear();
      this.participants.clear();

      console.log('[IN-APP MEETING] Meeting ended');
      return true;
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return audioTracks[0].enabled;
    }
    return false;
  }

  /**
   * Toggle video
   */
  toggleVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return videoTracks[0].enabled;
    }
    return false;
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get remote stream for participant
   */
  getRemoteStream(participantId) {
    return this.remoteStreams.get(participantId);
  }

  /**
   * Get participant count
   */
  getParticipantCount() {
    return this.participants.size + 1; // +1 for local user
  }
}

module.exports = InAppMeetingService;
