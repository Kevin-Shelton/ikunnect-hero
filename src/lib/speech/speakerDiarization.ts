/**
 * Speaker Diarization Engine for Real-Time Speaker Identification
 * Handles speaker segmentation and identification using voice prints
 */

import { VoicePrint, SpeakerSegment, AudioSegment } from '../../types';

export interface DiarizationConfig {
  minSegmentDuration: number; // 1500ms minimum
  silenceThreshold: number; // 600ms silence threshold
  voicePrintThreshold: number; // 0.65 confidence threshold
  maxSpeakers: number;
  enableVAD: boolean; // Voice Activity Detection
  windowSize: number; // Analysis window size in ms
  hopSize: number; // Hop size for sliding window
}

export interface SpeakerChange {
  timestamp: number;
  fromSpeaker: string | null;
  toSpeaker: string;
  confidence: number;
}

export interface DiarizationResult {
  segments: SpeakerSegment[];
  speakerChanges: SpeakerChange[];
  confidence: number;
  processingTime: number;
}

export interface VoiceActivity {
  isActive: boolean;
  level: number;
  timestamp: number;
  duration: number;
}

export class SpeakerDiarizationEngine extends EventTarget {
  private config: DiarizationConfig;
  private voicePrints = new Map<string, VoicePrint>();
  private currentSegment: Partial<SpeakerSegment> | null = null;
  private audioBuffer: Float32Array[] = [];
  private lastVoiceActivity = 0;
  private lastSpeakerChange = 0;
  private currentSpeaker: string | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Audio analysis
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadBuffer: number[] = [];

  constructor(config: Partial<DiarizationConfig> = {}) {
    super();
    
    this.config = {
      minSegmentDuration: 1500, // 1.5 seconds
      silenceThreshold: 600, // 600ms
      voicePrintThreshold: 0.65,
      maxSpeakers: 10,
      enableVAD: true,
      windowSize: 1000, // 1 second windows
      hopSize: 250, // 250ms hop
      ...config
    };
  }

  /**
   * Initialize the diarization engine
   */
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100
      });

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      console.log('Speaker diarization engine initialized');
    } catch (error) {
      console.error('Failed to initialize diarization engine:', error);
      throw error;
    }
  }

  /**
   * Add voice print for speaker identification
   */
  addVoicePrint(voicePrint: VoicePrint): void {
    this.voicePrints.set(voicePrint.userId, voicePrint);
    console.log(`Voice print added for speaker: ${voicePrint.userId}`);
  }

  /**
   * Remove voice print
   */
  removeVoicePrint(userId: string): void {
    this.voicePrints.delete(userId);
    console.log(`Voice print removed for speaker: ${userId}`);
  }

  /**
   * Process real-time audio data for speaker diarization
   */
  processAudioData(audioData: Float32Array, timestamp: number): void {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;

      // Add to buffer
      this.audioBuffer.push(new Float32Array(audioData));
      
      // Limit buffer size
      if (this.audioBuffer.length > 100) {
        this.audioBuffer.shift();
      }

      // Voice Activity Detection
      const voiceActivity = this.detectVoiceActivity(audioData, timestamp);
      
      if (voiceActivity.isActive) {
        this.handleVoiceActivity(voiceActivity, timestamp);
      } else {
        this.handleSilence(timestamp);
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Detect voice activity in audio data
   */
  private detectVoiceActivity(audioData: Float32Array, timestamp: number): VoiceActivity {
    // Calculate RMS energy
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(energy / audioData.length);

    // Simple VAD threshold
    const vadThreshold = 0.01;
    const isActive = rms > vadThreshold;

    // Update VAD buffer for smoothing
    this.vadBuffer.push(isActive ? 1 : 0);
    if (this.vadBuffer.length > 10) {
      this.vadBuffer.shift();
    }

    // Smooth VAD decision
    const vadSum = this.vadBuffer.reduce((sum, val) => sum + val, 0);
    const smoothedVAD = vadSum / this.vadBuffer.length > 0.3;

    return {
      isActive: smoothedVAD,
      level: rms,
      timestamp,
      duration: audioData.length / 44100 * 1000 // Convert to ms
    };
  }

  /**
   * Handle voice activity
   */
  private handleVoiceActivity(voiceActivity: VoiceActivity, timestamp: number): void {
    this.lastVoiceActivity = timestamp;
    
    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // If no current segment, start a new one
    if (!this.currentSegment) {
      this.startNewSegment(timestamp);
    }

    // Perform speaker identification if we have enough audio data
    if (this.audioBuffer.length >= 5) { // ~1 second of audio
      this.identifySpeaker(timestamp);
    }

    // Emit voice activity event
    this.dispatchEvent(new CustomEvent('voice-activity', {
      detail: voiceActivity
    }));
  }

  /**
   * Handle silence periods
   */
  private handleSilence(timestamp: number): void {
    if (!this.silenceTimer && this.currentSegment) {
      // Start silence timer
      this.silenceTimer = setTimeout(() => {
        this.endCurrentSegment(timestamp);
      }, this.config.silenceThreshold);
    }
  }

  /**
   * Start a new speaker segment
   */
  private startNewSegment(timestamp: number): void {
    this.currentSegment = {
      speakerId: 'unknown',
      startTime: timestamp,
      confidence: 0,
      isEmployee: false
    };

    console.log('Started new speaker segment at', timestamp);
  }

  /**
   * End current speaker segment
   */
  private endCurrentSegment(timestamp: number): void {
    if (!this.currentSegment) return;

    const duration = timestamp - this.currentSegment.startTime!;
    
    // Only create segment if it meets minimum duration
    if (duration >= this.config.minSegmentDuration) {
      const segment: SpeakerSegment = {
        speakerId: this.currentSegment.speakerId!,
        startTime: this.currentSegment.startTime!,
        endTime: timestamp,
        confidence: this.currentSegment.confidence!,
        isEmployee: this.currentSegment.isEmployee!
      };

      this.dispatchEvent(new CustomEvent('speaker-segment', {
        detail: segment
      }));

      console.log('Speaker segment completed:', segment);
    }

    this.currentSegment = null;
    this.audioBuffer = []; // Clear buffer for next segment
  }

  /**
   * Identify speaker from current audio buffer
   */
  private identifySpeaker(timestamp: number): void {
    if (!this.currentSegment || this.voicePrints.size === 0) {
      return;
    }

    try {
      // Extract features from current audio buffer
      const features = this.extractFeaturesFromBuffer();
      
      // Compare with known voice prints
      let bestMatch: { userId: string; confidence: number } | null = null;
      
      for (const [userId, voicePrint] of this.voicePrints.entries()) {
        const confidence = this.compareVoiceFeatures(features, voicePrint.features);
        
        if (confidence > this.config.voicePrintThreshold && 
            (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { userId, confidence };
        }
      }

      // Update current segment if we have a good match
      if (bestMatch && bestMatch.userId !== this.currentSegment.speakerId) {
        const previousSpeaker = this.currentSegment.speakerId;
        
        this.currentSegment.speakerId = bestMatch.userId;
        this.currentSegment.confidence = bestMatch.confidence;
        this.currentSegment.isEmployee = this.isEmployeeSpeaker(bestMatch.userId);

        // Emit speaker change event
        if (previousSpeaker !== 'unknown') {
          const speakerChange: SpeakerChange = {
            timestamp,
            fromSpeaker: previousSpeaker,
            toSpeaker: bestMatch.userId,
            confidence: bestMatch.confidence
          };

          this.dispatchEvent(new CustomEvent('speaker-change', {
            detail: speakerChange
          }));

          console.log('Speaker change detected:', speakerChange);
        }

        this.currentSpeaker = bestMatch.userId;
        this.lastSpeakerChange = timestamp;
      }

    } catch (error) {
      console.error('Speaker identification failed:', error);
    }
  }

  /**
   * Extract features from audio buffer
   */
  private extractFeaturesFromBuffer(): Float32Array {
    if (this.audioBuffer.length === 0) {
      return new Float32Array(128);
    }

    // Combine recent audio data
    const totalSamples = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Float32Array(totalSamples);
    
    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Extract features (simplified - same as enrollment)
    const featureSize = 128;
    const features = new Float32Array(featureSize);
    const segmentSize = Math.floor(combinedAudio.length / featureSize);
    
    for (let i = 0; i < featureSize; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, combinedAudio.length);
      
      let energy = 0;
      for (let j = start; j < end; j++) {
        energy += combinedAudio[j] * combinedAudio[j];
      }
      
      features[i] = Math.sqrt(energy / (end - start));
    }

    // Normalize features
    const maxFeature = Math.max(...features);
    if (maxFeature > 0) {
      for (let i = 0; i < features.length; i++) {
        features[i] /= maxFeature;
      }
    }

    return features;
  }

  /**
   * Compare voice features using cosine similarity
   */
  private compareVoiceFeatures(features1: Float32Array, features2: Float32Array): number {
    if (features1.length !== features2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
  }

  /**
   * Check if speaker is employee based on voice print
   */
  private isEmployeeSpeaker(userId: string): boolean {
    const voicePrint = this.voicePrints.get(userId);
    return voicePrint?.metadata?.role === 'employee' || userId.startsWith('employee_');
  }

  /**
   * Get current speaker information
   */
  getCurrentSpeaker(): { speakerId: string | null; confidence: number; isEmployee: boolean } {
    if (!this.currentSegment) {
      return { speakerId: null, confidence: 0, isEmployee: false };
    }

    return {
      speakerId: this.currentSegment.speakerId || null,
      confidence: this.currentSegment.confidence || 0,
      isEmployee: this.currentSegment.isEmployee || false
    };
  }

  /**
   * Force speaker change (for manual override)
   */
  forceSpeakerChange(newSpeakerId: string, timestamp: number): void {
    if (this.currentSegment) {
      const previousSpeaker = this.currentSegment.speakerId;
      
      this.currentSegment.speakerId = newSpeakerId;
      this.currentSegment.isEmployee = this.isEmployeeSpeaker(newSpeakerId);
      this.currentSegment.confidence = 1.0; // Manual override has full confidence

      const speakerChange: SpeakerChange = {
        timestamp,
        fromSpeaker: previousSpeaker || null,
        toSpeaker: newSpeakerId,
        confidence: 1.0
      };

      this.dispatchEvent(new CustomEvent('speaker-change', {
        detail: speakerChange
      }));

      console.log('Manual speaker change:', speakerChange);
    }
  }

  /**
   * Get diarization statistics
   */
  getStatistics(): {
    totalVoicePrints: number;
    currentSpeaker: string | null;
    lastSpeakerChange: number;
    bufferSize: number;
    isProcessing: boolean;
  } {
    return {
      totalVoicePrints: this.voicePrints.size,
      currentSpeaker: this.currentSpeaker,
      lastSpeakerChange: this.lastSpeakerChange,
      bufferSize: this.audioBuffer.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DiarizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Diarization config updated:', this.config);
  }

  /**
   * Reset diarization state
   */
  reset(): void {
    // End current segment if exists
    if (this.currentSegment) {
      this.endCurrentSegment(Date.now());
    }

    // Clear state
    this.currentSpeaker = null;
    this.audioBuffer = [];
    this.vadBuffer = [];
    this.lastVoiceActivity = 0;
    this.lastSpeakerChange = 0;

    // Clear timers
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    console.log('Diarization engine reset');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.reset();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.voicePrints.clear();
    console.log('Speaker diarization engine disposed');
  }
}

