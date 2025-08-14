/**
 * Enhanced Audio Management System for Hands-Free Translation
 * Handles WebRTC audio capture, processing, and playback with advanced features
 */

import { AudioConfig, AudioSegment, TTSRequest, TTSResponse } from '../../types';

export interface AudioManagerConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  enableEchoCancellation: boolean;
  enableNoiseSuppression: boolean;
  enableAutoGainControl: boolean;
  vadThreshold: number; // Voice Activity Detection threshold
  silenceTimeout: number; // ms of silence before stopping
}

export interface AudioLevel {
  instant: number;
  average: number;
  peak: number;
  isVoiceDetected: boolean;
}

export interface AudioManagerEvents {
  'audio-level': (level: AudioLevel) => void;
  'voice-start': () => void;
  'voice-end': () => void;
  'recording-start': () => void;
  'recording-stop': () => void;
  'audio-data': (data: Float32Array) => void;
  'error': (error: Error) => void;
}

export class AudioManager extends EventTarget {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private isVoiceActive = false;
  private config: AudioManagerConfig;
  private vadBuffer: number[] = [];
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;

  // TTS and Playback
  private currentAudio: HTMLAudioElement | null = null;
  private audioQueue: Array<{ id: string; audio: HTMLAudioElement; priority: number }> = [];
  private isDucked = false;
  private originalVolume = 0.8;
  private duckingVolume = 0.2;

  constructor(config: Partial<AudioManagerConfig> = {}) {
    super();
    this.config = {
      sampleRate: 44100,
      channels: 1,
      bufferSize: 4096,
      enableEchoCancellation: true,
      enableNoiseSuppression: true,
      enableAutoGainControl: true,
      vadThreshold: 0.01,
      silenceTimeout: 1000,
      ...config
    };
  }

  /**
   * Initialize audio system and request microphone permissions
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: this.config.enableEchoCancellation,
          noiseSuppression: this.config.enableNoiseSuppression,
          autoGainControl: this.config.enableAutoGainControl
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create analyser for audio level monitoring
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio stream to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      // Create processor for real-time audio data
      this.processor = this.audioContext.createScriptProcessor(this.config.bufferSize, 1, 1);
      this.processor.onaudioprocess = this.handleAudioProcess.bind(this);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      throw new Error(`Audio initialization failed: ${error.message}`);
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (!this.mediaStream) {
      throw new Error('Audio system not initialized');
    }

    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.dispatchEvent(new CustomEvent('recording-stop'));
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.dispatchEvent(new CustomEvent('recording-start'));

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.isRecording = false;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Handle real-time audio processing
   */
  private handleAudioProcess(event: AudioProcessingEvent): void {
    const inputBuffer = event.inputBuffer;
    const inputData = inputBuffer.getChannelData(0);
    
    // Calculate audio level
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(sum / inputData.length);
    
    // Voice Activity Detection
    const isVoice = rms > this.config.vadThreshold;
    
    if (isVoice && !this.isVoiceActive) {
      this.isVoiceActive = true;
      this.dispatchEvent(new CustomEvent('voice-start'));
      this.clearSilenceTimer();
    } else if (!isVoice && this.isVoiceActive) {
      this.startSilenceTimer();
    }

    // Emit audio data for processing
    if (this.isRecording) {
      this.dispatchEvent(new CustomEvent('audio-data', { detail: inputData }));
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
    }

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyser) return;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Calculate levels
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255;
        sum += value;
        if (value > peak) peak = value;
      }
      const average = sum / bufferLength;
      const instant = peak;

      const audioLevel: AudioLevel = {
        instant,
        average,
        peak,
        isVoiceDetected: this.isVoiceActive
      };

      this.dispatchEvent(new CustomEvent('audio-level', { detail: audioLevel }));
    }, 50); // Update every 50ms
  }

  /**
   * Start silence timer for voice end detection
   */
  private startSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.isVoiceActive) {
        this.isVoiceActive = false;
        this.dispatchEvent(new CustomEvent('voice-end'));
      }
    }, this.config.silenceTimeout);
  }

  /**
   * Clear silence timer
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Play TTS audio with ducking support
   */
  async playTTS(request: TTSRequest): Promise<void> {
    try {
      // Generate synthetic audio (mock implementation)
      const audioData = await this.generateSyntheticAudio(request);
      const audioBlob = new Blob([audioData.audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.volume = this.isDucked ? this.duckingVolume : this.originalVolume;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        this.currentAudio = audio;
        audio.play();
      });
    } catch (error) {
      console.error('Failed to play TTS:', error);
      throw error;
    }
  }

  /**
   * Duck audio during live speech
   */
  duckAudio(): void {
    if (this.currentAudio && !this.isDucked) {
      this.isDucked = true;
      this.fadeVolume(this.currentAudio, this.originalVolume, this.duckingVolume, 200);
    }
  }

  /**
   * Resume audio after speech ends
   */
  resumeAudio(): void {
    if (this.currentAudio && this.isDucked) {
      this.isDucked = false;
      this.fadeVolume(this.currentAudio, this.duckingVolume, this.originalVolume, 300);
    }
  }

  /**
   * Fade audio volume smoothly
   */
  private fadeVolume(audio: HTMLAudioElement, fromVolume: number, toVolume: number, duration: number): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (toVolume - fromVolume) / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = fromVolume + (volumeStep * currentStep);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.volume = toVolume;
      }
    }, stepDuration);
  }

  /**
   * Generate synthetic audio (mock implementation)
   */
  private async generateSyntheticAudio(request: TTSRequest): Promise<TTSResponse> {
    // Mock implementation - in production, this would call actual TTS service
    const duration = request.text.length * 0.1; // Rough estimate
    const sampleRate = 44100;
    const samples = Math.floor(duration * sampleRate);
    const audioData = new ArrayBuffer(samples * 2); // 16-bit audio

    return {
      audioData,
      duration,
      format: 'wav'
    };
  }

  /**
   * Get current audio levels
   */
  getCurrentAudioLevel(): AudioLevel | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      sum += value;
      if (value > peak) peak = value;
    }

    return {
      instant: peak,
      average: sum / bufferLength,
      peak,
      isVoiceDetected: this.isVoiceActive
    };
  }

  /**
   * Check if microphone is available and accessible
   */
  static async checkMicrophoneAvailability(): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        return { available: false, error: 'No microphone found' };
      }

      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      return { available: true };
    } catch (error) {
      return { 
        available: false, 
        error: error.name === 'NotAllowedError' ? 'Microphone permission denied' : error.message 
      };
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Stop recording
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    // Clear timers
    this.clearSilenceTimer();
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
    }

    // Stop audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Clear references
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.processor = null;
    this.mediaRecorder = null;

    console.log('Audio manager disposed');
  }
}

