/**
 * WebRTC Service for Real-Time Audio Streaming
 * Handles peer-to-peer audio connections and streaming for translation
 */

import { AudioConfig } from '../types';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  audioConstraints: MediaTrackConstraints;
  enableDataChannel: boolean;
  dataChannelConfig: RTCDataChannelInit;
}

export interface StreamingSession {
  id: string;
  peerConnection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isConnected: boolean;
  createdAt: Date;
}

export interface AudioStreamData {
  sessionId: string;
  audioData: ArrayBuffer;
  timestamp: number;
  speakerId?: string;
  metadata?: Record<string, any>;
}

export class WebRTCService extends EventTarget {
  private config: WebRTCConfig;
  private sessions = new Map<string, StreamingSession>();
  private localStream: MediaStream | null = null;

  constructor(config: Partial<WebRTCConfig> = {}) {
    super();
    
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      audioConstraints: {
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      enableDataChannel: true,
      dataChannelConfig: {
        ordered: true,
        maxRetransmits: 3
      },
      ...config
    };
  }

  /**
   * Initialize WebRTC service and get local media stream
   */
  async initialize(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audioConstraints,
        video: false
      });

      console.log('WebRTC service initialized with local stream');
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      throw new Error(`WebRTC initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a new streaming session
   */
  async createSession(sessionId: string): Promise<StreamingSession> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Create data channel for metadata
    let dataChannel: RTCDataChannel | undefined;
    if (this.config.enableDataChannel) {
      dataChannel = peerConnection.createDataChannel('audio-metadata', this.config.dataChannelConfig);
      this.setupDataChannel(dataChannel, sessionId);
    }

    // Set up peer connection event handlers
    this.setupPeerConnection(peerConnection, sessionId);

    const session: StreamingSession = {
      id: sessionId,
      peerConnection,
      dataChannel,
      localStream: this.localStream || undefined,
      isConnected: false,
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`WebRTC session created: ${sessionId}`);

    return session;
  }

  /**
   * Create offer for session
   */
  async createOffer(sessionId: string): Promise<RTCSessionDescriptionInit> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const offer = await session.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await session.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Create answer for session
   */
  async createAnswer(sessionId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.peerConnection.setRemoteDescription(offer);
      
      const answer = await session.peerConnection.createAnswer();
      await session.peerConnection.setLocalDescription(answer);
      
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(sessionId: string, description: RTCSessionDescriptionInit): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.peerConnection.setRemoteDescription(description);
    } catch (error) {
      console.error('Failed to set remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(sessionId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Send audio metadata through data channel
   */
  sendAudioMetadata(sessionId: string, metadata: Record<string, any>): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.dataChannel) {
      console.warn(`Cannot send metadata: session ${sessionId} not found or no data channel`);
      return;
    }

    if (session.dataChannel.readyState === 'open') {
      try {
        session.dataChannel.send(JSON.stringify({
          type: 'audio-metadata',
          timestamp: Date.now(),
          data: metadata
        }));
      } catch (error) {
        console.error('Failed to send audio metadata:', error);
      }
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<RTCStatsReport | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    try {
      return await session.peerConnection.getStats();
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return null;
    }
  }

  /**
   * Close session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Close data channel
    if (session.dataChannel) {
      session.dataChannel.close();
    }

    // Close peer connection
    session.peerConnection.close();

    // Remove from sessions
    this.sessions.delete(sessionId);

    console.log(`WebRTC session closed: ${sessionId}`);
    this.dispatchEvent(new CustomEvent('session-closed', { detail: { sessionId } }));
  }

  /**
   * Setup peer connection event handlers
   */
  private setupPeerConnection(peerConnection: RTCPeerConnection, sessionId: string): void {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.dispatchEvent(new CustomEvent('ice-candidate', {
          detail: { sessionId, candidate: event.candidate }
        }));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.isConnected = peerConnection.connectionState === 'connected';
        
        this.dispatchEvent(new CustomEvent('connection-state-change', {
          detail: { sessionId, state: peerConnection.connectionState }
        }));

        if (peerConnection.connectionState === 'connected') {
          console.log(`WebRTC session connected: ${sessionId}`);
        } else if (peerConnection.connectionState === 'failed' || 
                   peerConnection.connectionState === 'disconnected') {
          console.log(`WebRTC session disconnected: ${sessionId}`);
          this.closeSession(sessionId);
        }
      }
    };

    peerConnection.ontrack = (event) => {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.remoteStream = event.streams[0];
        
        this.dispatchEvent(new CustomEvent('remote-stream', {
          detail: { sessionId, stream: event.streams[0] }
        }));

        // Set up audio processing for remote stream
        this.setupRemoteAudioProcessing(sessionId, event.streams[0]);
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel, sessionId);
    };
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannel(dataChannel: RTCDataChannel, sessionId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened for session: ${sessionId}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        this.dispatchEvent(new CustomEvent('data-channel-message', {
          detail: { sessionId, message }
        }));
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for session ${sessionId}:`, error);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed for session: ${sessionId}`);
    };
  }

  /**
   * Setup audio processing for remote stream
   */
  private setupRemoteAudioProcessing(sessionId: string, stream: MediaStream): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 2048;
      source.connect(analyser);

      // Create processor for audio data
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to ArrayBuffer for transmission
        const audioData = new ArrayBuffer(inputData.length * 4);
        const view = new Float32Array(audioData);
        view.set(inputData);

        const streamData: AudioStreamData = {
          sessionId,
          audioData,
          timestamp: Date.now()
        };

        this.dispatchEvent(new CustomEvent('audio-stream-data', {
          detail: streamData
        }));
      };

      console.log(`Remote audio processing setup for session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to setup remote audio processing:', error);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): StreamingSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isConnected);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): StreamingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Check WebRTC support
   */
  static isSupported(): boolean {
    return !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Close all sessions
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    console.log('WebRTC service disposed');
  }
}

