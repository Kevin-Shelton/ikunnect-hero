/**
 * Voice Enrollment System for Employee Voice Print Creation
 * Handles 6-second enrollment process and voice print generation
 */

import { VoicePrint, AudioConfig } from '../../types';

export interface EnrollmentConfig {
  duration: number; // 6 seconds
  sampleRate: number;
  minAudioLevel: number;
  maxRetries: number;
  qualityThreshold: number;
}

export interface EnrollmentProgress {
  currentTime: number;
  totalTime: number;
  progress: number; // 0-1
  audioLevel: number;
  isRecording: boolean;
  qualityScore: number;
  message: string;
}

export interface EnrollmentResult {
  success: boolean;
  voicePrint?: VoicePrint;
  error?: string;
  qualityScore: number;
  duration: number;
}

export class VoiceEnrollmentService extends EventTarget {
  private config: EnrollmentConfig;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isEnrolling = false;
  private enrollmentData: Float32Array[] = [];
  private startTime = 0;
  private progressInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<EnrollmentConfig> = {}) {
    super();
    
    this.config = {
      duration: 6000, // 6 seconds
      sampleRate: 44100,
      minAudioLevel: 0.01,
      maxRetries: 3,
      qualityThreshold: 0.7,
      ...config
    };
  }

  /**
   * Start voice enrollment process
   */
  async startEnrollment(userId: string): Promise<EnrollmentResult> {
    if (this.isEnrolling) {
      throw new Error('Enrollment already in progress');
    }

    try {
      this.isEnrolling = true;
      this.enrollmentData = [];
      this.startTime = Date.now();

      // Initialize audio system
      await this.initializeAudio();

      // Start enrollment process
      return await this.performEnrollment(userId);

    } catch (error) {
      console.error('Enrollment failed:', error);
      this.cleanup();
      return {
        success: false,
        error: error.message,
        qualityScore: 0,
        duration: Date.now() - this.startTime
      };
    }
  }

  /**
   * Stop enrollment process
   */
  stopEnrollment(): void {
    if (!this.isEnrolling) {
      return;
    }

    this.isEnrolling = false;
    this.cleanup();
    
    this.dispatchEvent(new CustomEvent('enrollment-stopped'));
  }

  /**
   * Initialize audio system for enrollment
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // We want natural voice characteristics
          autoGainControl: false
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create analyser for audio level monitoring
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3;

      // Create source and connect to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      // Create processor for audio data capture
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = this.handleAudioData.bind(this);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('Audio system initialized for enrollment');
    } catch (error) {
      throw new Error(`Failed to initialize audio: ${error.message}`);
    }
  }

  /**
   * Perform the actual enrollment process
   */
  private async performEnrollment(userId: string): Promise<EnrollmentResult> {
    return new Promise((resolve) => {
      const checkProgress = () => {
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.config.duration, 1);
        
        const audioLevel = this.getCurrentAudioLevel();
        const qualityScore = this.calculateQualityScore();
        
        const progressData: EnrollmentProgress = {
          currentTime: elapsed,
          totalTime: this.config.duration,
          progress,
          audioLevel,
          isRecording: this.isEnrolling,
          qualityScore,
          message: this.getProgressMessage(progress, audioLevel, qualityScore)
        };

        this.dispatchEvent(new CustomEvent('enrollment-progress', { detail: progressData }));

        if (elapsed >= this.config.duration) {
          // Enrollment complete
          this.completeEnrollment(userId, resolve);
        } else if (this.isEnrolling) {
          // Continue monitoring
          setTimeout(checkProgress, 100);
        }
      };

      // Start progress monitoring
      checkProgress();
    });
  }

  /**
   * Handle incoming audio data during enrollment
   */
  private handleAudioData(event: AudioProcessingEvent): void {
    if (!this.isEnrolling) return;

    const inputBuffer = event.inputBuffer;
    const inputData = inputBuffer.getChannelData(0);
    
    // Store audio data for voice print generation
    const audioChunk = new Float32Array(inputData.length);
    audioChunk.set(inputData);
    this.enrollmentData.push(audioChunk);

    // Limit stored data to prevent memory issues
    if (this.enrollmentData.length > 1000) {
      this.enrollmentData.shift();
    }
  }

  /**
   * Get current audio level
   */
  private getCurrentAudioLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return (sum / bufferLength) / 255;
  }

  /**
   * Calculate enrollment quality score
   */
  private calculateQualityScore(): number {
    if (this.enrollmentData.length === 0) return 0;

    let totalEnergy = 0;
    let voiceSegments = 0;
    let consistencyScore = 0;

    // Analyze recent audio data
    const recentChunks = this.enrollmentData.slice(-10); // Last 10 chunks
    
    for (const chunk of recentChunks) {
      let chunkEnergy = 0;
      for (let i = 0; i < chunk.length; i++) {
        chunkEnergy += chunk[i] * chunk[i];
      }
      
      const rms = Math.sqrt(chunkEnergy / chunk.length);
      totalEnergy += rms;
      
      if (rms > this.config.minAudioLevel) {
        voiceSegments++;
      }
    }

    const avgEnergy = totalEnergy / recentChunks.length;
    const voiceRatio = voiceSegments / recentChunks.length;
    
    // Calculate consistency (less variation = better quality)
    let variance = 0;
    for (const chunk of recentChunks) {
      let chunkEnergy = 0;
      for (let i = 0; i < chunk.length; i++) {
        chunkEnergy += chunk[i] * chunk[i];
      }
      const rms = Math.sqrt(chunkEnergy / chunk.length);
      variance += Math.pow(rms - avgEnergy, 2);
    }
    
    consistencyScore = 1 - Math.min(variance / recentChunks.length, 1);

    // Combined quality score
    const energyScore = Math.min(avgEnergy * 10, 1); // Scale energy
    const qualityScore = (energyScore * 0.4) + (voiceRatio * 0.4) + (consistencyScore * 0.2);
    
    return Math.max(0, Math.min(1, qualityScore));
  }

  /**
   * Get progress message based on current state
   */
  private getProgressMessage(progress: number, audioLevel: number, qualityScore: number): string {
    if (progress < 0.1) {
      return "Starting enrollment... Please speak clearly";
    } else if (audioLevel < this.config.minAudioLevel) {
      return "Speak louder - we need to hear your voice";
    } else if (qualityScore < 0.3) {
      return "Keep speaking clearly and consistently";
    } else if (progress < 0.5) {
      return "Good! Continue speaking naturally";
    } else if (progress < 0.9) {
      return "Almost done! Keep talking";
    } else {
      return "Finishing enrollment...";
    }
  }

  /**
   * Complete enrollment and generate voice print
   */
  private completeEnrollment(userId: string, resolve: (result: EnrollmentResult) => void): void {
    try {
      const qualityScore = this.calculateQualityScore();
      
      if (qualityScore < this.config.qualityThreshold) {
        resolve({
          success: false,
          error: `Enrollment quality too low (${qualityScore.toFixed(2)}). Please try again in a quieter environment.`,
          qualityScore,
          duration: Date.now() - this.startTime
        });
        return;
      }

      // Generate voice print from collected audio data
      const voicePrint = this.generateVoicePrint(userId);
      
      this.cleanup();
      
      resolve({
        success: true,
        voicePrint,
        qualityScore,
        duration: Date.now() - this.startTime
      });

      this.dispatchEvent(new CustomEvent('enrollment-complete', { detail: { voicePrint, qualityScore } }));

    } catch (error) {
      resolve({
        success: false,
        error: `Failed to generate voice print: ${error.message}`,
        qualityScore: 0,
        duration: Date.now() - this.startTime
      });
    }
  }

  /**
   * Generate voice print from enrollment data
   */
  private generateVoicePrint(userId: string): VoicePrint {
    // Combine all audio data
    const totalSamples = this.enrollmentData.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Float32Array(totalSamples);
    
    let offset = 0;
    for (const chunk of this.enrollmentData) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // Extract voice features (simplified implementation)
    const features = this.extractVoiceFeatures(combinedAudio);
    
    const voicePrint: VoicePrint = {
      id: `vp_${userId}_${Date.now()}`,
      userId,
      features,
      confidence: this.calculateQualityScore(),
      createdAt: new Date(),
      metadata: {
        sampleRate: this.config.sampleRate,
        duration: this.config.duration,
        samplesCount: totalSamples,
        enrollmentVersion: '1.0'
      }
    };

    console.log(`Voice print generated for user ${userId}:`, {
      id: voicePrint.id,
      confidence: voicePrint.confidence,
      featuresLength: features.length
    });

    return voicePrint;
  }

  /**
   * Extract voice features from audio data
   * Simplified implementation - in production, use advanced feature extraction
   */
  private extractVoiceFeatures(audioData: Float32Array): Float32Array {
    const featureSize = 128; // Number of features to extract
    const features = new Float32Array(featureSize);
    
    // Divide audio into segments for feature extraction
    const segmentSize = Math.floor(audioData.length / featureSize);
    
    for (let i = 0; i < featureSize; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, audioData.length);
      
      // Calculate RMS energy for this segment
      let energy = 0;
      for (let j = start; j < end; j++) {
        energy += audioData[j] * audioData[j];
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
   * Validate enrollment environment
   */
  async validateEnvironment(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Test audio levels
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      // Monitor for 2 seconds
      const testDuration = 2000;
      const samples: number[] = [];
      
      const sampleAudio = () => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        samples.push((sum / bufferLength) / 255);
      };

      const interval = setInterval(sampleAudio, 100);
      
      await new Promise(resolve => setTimeout(resolve, testDuration));
      clearInterval(interval);

      // Cleanup test resources
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();

      // Analyze samples
      const avgLevel = samples.reduce((sum, level) => sum + level, 0) / samples.length;
      const maxLevel = Math.max(...samples);

      if (avgLevel < 0.005) {
        issues.push('Microphone level too low - check microphone settings');
      }

      if (maxLevel < 0.01) {
        issues.push('No audio detected - ensure microphone is working');
      }

      // Check for excessive noise
      const variance = samples.reduce((sum, level) => sum + Math.pow(level - avgLevel, 2), 0) / samples.length;
      if (variance > 0.01) {
        issues.push('High background noise detected - find a quieter location');
      }

    } catch (error) {
      issues.push(`Microphone access failed: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.isEnrolling = false;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.enrollmentData = [];
  }

  /**
   * Get enrollment configuration
   */
  getConfig(): EnrollmentConfig {
    return { ...this.config };
  }

  /**
   * Update enrollment configuration
   */
  updateConfig(newConfig: Partial<EnrollmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

