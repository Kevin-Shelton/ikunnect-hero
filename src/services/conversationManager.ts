/**
 * Conversation Manager - Central State Management for Translation Sessions
 * Handles conversation lifecycle, state persistence, and event coordination
 */

import { ConversationState, ConversationEvent, VoicePrint, SpeakerSegment, TranslationRequest, TranslationResponse } from '../types';
import { VoiceEnrollmentService } from '../lib/speech/voiceEnrollment';
import { SpeakerDiarizationEngine } from '../lib/speech/speakerDiarization';
import { RealTimeRouter } from '../lib/translation/realTimeRouter';
import { TranslationEngine } from '../lib/translation/translationEngine';
import { AudioManager } from '../lib/audio/audioManager';

export interface ConversationConfig {
  enablePersistence: boolean;
  autoSaveInterval: number; // ms
  maxSessionDuration: number; // ms
  enableAnalytics: boolean;
  enableRecording: boolean;
}

export interface ConversationAnalytics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  speakerChanges: number;
  translationsCount: number;
  averageTranslationTime: number;
  employeeSpeakingTime: number;
  customerSpeakingTime: number;
  languages: string[];
  qualityScore: number;
}

export interface SessionSnapshot {
  state: ConversationState;
  analytics: ConversationAnalytics;
  timestamp: Date;
}

export class ConversationManager extends EventTarget {
  private config: ConversationConfig;
  private currentState: ConversationState | null = null;
  private sessionHistory = new Map<string, SessionSnapshot>();
  private analytics: ConversationAnalytics | null = null;
  
  // Service instances
  private voiceEnrollment: VoiceEnrollmentService;
  private diarizationEngine: SpeakerDiarizationEngine;
  private translationEngine: TranslationEngine;
  private realTimeRouter: RealTimeRouter;
  private audioManager: AudioManager;
  
  // Timers and intervals
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private analyticsTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ConversationConfig> = {}) {
    super();
    
    this.config = {
      enablePersistence: true,
      autoSaveInterval: 30000, // 30 seconds
      maxSessionDuration: 3600000, // 1 hour
      enableAnalytics: true,
      enableRecording: true,
      ...config
    };

    // Initialize services
    this.voiceEnrollment = new VoiceEnrollmentService();
    this.diarizationEngine = new SpeakerDiarizationEngine();
    this.translationEngine = new TranslationEngine();
    this.audioManager = new AudioManager();
    this.realTimeRouter = new RealTimeRouter({}, this.translationEngine, this.diarizationEngine);

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for all services
   */
  private setupEventListeners(): void {
    // Voice enrollment events
    this.voiceEnrollment.addEventListener('enrollment-complete', (event: any) => {
      this.handleEnrollmentComplete(event.detail);
    });

    this.voiceEnrollment.addEventListener('enrollment-progress', (event: any) => {
      this.dispatchEvent(new CustomEvent('enrollment-progress', { detail: event.detail }));
    });

    // Diarization events
    this.diarizationEngine.addEventListener('speaker-segment', (event: any) => {
      this.handleSpeakerSegment(event.detail);
    });

    this.diarizationEngine.addEventListener('speaker-change', (event: any) => {
      this.handleSpeakerChange(event.detail);
    });

    // Router events
    this.realTimeRouter.addEventListener('translation-routed', (event: any) => {
      this.handleTranslationRouted(event.detail);
    });

    this.realTimeRouter.addEventListener('conversation-event', (event: any) => {
      this.handleConversationEvent(event.detail);
    });

    // Audio manager events
    this.audioManager.addEventListener('voice-start', () => {
      this.handleVoiceStart();
    });

    this.audioManager.addEventListener('voice-end', () => {
      this.handleVoiceEnd();
    });
  }

  /**
   * Create new conversation session
   */
  async createSession(employeeLanguage: string, customerLanguage: string): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create conversation state
      this.currentState = {
        sessionId,
        employeeLanguage,
        customerLanguage,
        isActive: false,
        isEnrolling: false,
        isHandsFree: false,
        segments: [],
        lastActivity: new Date()
      };

      // Initialize analytics
      if (this.config.enableAnalytics) {
        this.analytics = {
          sessionId,
          startTime: new Date(),
          totalDuration: 0,
          speakerChanges: 0,
          translationsCount: 0,
          averageTranslationTime: 0,
          employeeSpeakingTime: 0,
          customerSpeakingTime: 0,
          languages: [employeeLanguage, customerLanguage],
          qualityScore: 0
        };
      }

      // Initialize services
      await this.audioManager.initialize();
      await this.diarizationEngine.initialize();
      
      // Create translation session
      this.translationEngine.createSession(employeeLanguage, customerLanguage);
      
      // Initialize router
      this.realTimeRouter.initialize(this.currentState);

      // Start auto-save if enabled
      if (this.config.enablePersistence) {
        this.startAutoSave();
      }

      // Start session timer
      this.startSessionTimer();

      // Start analytics collection
      if (this.config.enableAnalytics) {
        this.startAnalyticsCollection();
      }

      console.log('Conversation session created:', sessionId);
      
      // Emit session created event
      this.dispatchEvent(new CustomEvent('session-created', {
        detail: { sessionId, employeeLanguage, customerLanguage }
      }));

      return sessionId;

    } catch (error) {
      console.error('Failed to create conversation session:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  /**
   * Start voice enrollment process
   */
  async startEnrollment(): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active session');
    }

    try {
      this.currentState.isEnrolling = true;
      this.currentState.lastActivity = new Date();

      // Emit enrollment start event
      const event: ConversationEvent = { type: 'ENROLLMENT_START' };
      this.handleConversationEvent(event);

      // Start enrollment
      const result = await this.voiceEnrollment.startEnrollment('employee');
      
      if (!result.success) {
        throw new Error(result.error || 'Enrollment failed');
      }

    } catch (error) {
      this.currentState.isEnrolling = false;
      
      const event: ConversationEvent = {
        type: 'ENROLLMENT_FAILED',
        error: error.message
      };
      
      this.handleConversationEvent(event);
      throw error;
    }
  }

  /**
   * Start hands-free mode
   */
  async startHandsFreeMode(): Promise<void> {
    if (!this.currentState || !this.currentState.employeeVoicePrint) {
      throw new Error('Voice enrollment required before starting hands-free mode');
    }

    try {
      this.currentState.isHandsFree = true;
      this.currentState.isActive = true;
      this.currentState.lastActivity = new Date();

      // Add employee voice print to diarization engine
      this.diarizationEngine.addVoicePrint(this.currentState.employeeVoicePrint);

      // Start audio recording
      await this.audioManager.startRecording();

      // Setup audio data processing
      this.audioManager.addEventListener('audio-data', (event: any) => {
        const audioData = event.detail as Float32Array;
        this.diarizationEngine.processAudioData(audioData, Date.now());
      });

      console.log('Hands-free mode started');
      
      this.dispatchEvent(new CustomEvent('handsfree-started', {
        detail: { sessionId: this.currentState.sessionId }
      }));

    } catch (error) {
      console.error('Failed to start hands-free mode:', error);
      throw error;
    }
  }

  /**
   * Stop hands-free mode
   */
  async stopHandsFreeMode(): Promise<void> {
    if (!this.currentState) {
      return;
    }

    try {
      this.currentState.isHandsFree = false;
      this.currentState.isActive = false;
      this.currentState.lastActivity = new Date();

      // Stop audio recording
      await this.audioManager.stopRecording();

      // Reset diarization engine
      this.diarizationEngine.reset();

      console.log('Hands-free mode stopped');
      
      this.dispatchEvent(new CustomEvent('handsfree-stopped', {
        detail: { sessionId: this.currentState.sessionId }
      }));

    } catch (error) {
      console.error('Failed to stop hands-free mode:', error);
      throw error;
    }
  }

  /**
   * End conversation session
   */
  async endSession(): Promise<SessionSnapshot | null> {
    if (!this.currentState) {
      return null;
    }

    try {
      // Stop hands-free mode if active
      if (this.currentState.isHandsFree) {
        await this.stopHandsFreeMode();
      }

      // Finalize analytics
      if (this.analytics) {
        this.analytics.endTime = new Date();
        this.analytics.totalDuration = this.analytics.endTime.getTime() - this.analytics.startTime.getTime();
      }

      // Create session snapshot
      const snapshot: SessionSnapshot = {
        state: { ...this.currentState },
        analytics: this.analytics ? { ...this.analytics } : {} as ConversationAnalytics,
        timestamp: new Date()
      };

      // Save to history
      this.sessionHistory.set(this.currentState.sessionId, snapshot);

      // Clear timers
      this.clearTimers();

      // Dispose services
      this.audioManager.dispose();
      this.diarizationEngine.dispose();
      this.realTimeRouter.dispose();

      const sessionId = this.currentState.sessionId;
      this.currentState = null;
      this.analytics = null;

      console.log('Conversation session ended:', sessionId);
      
      this.dispatchEvent(new CustomEvent('session-ended', {
        detail: { sessionId, snapshot }
      }));

      return snapshot;

    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Handle enrollment completion
   */
  private handleEnrollmentComplete(result: { voicePrint: VoicePrint; qualityScore: number }): void {
    if (!this.currentState) return;

    this.currentState.isEnrolling = false;
    this.currentState.employeeVoicePrint = result.voicePrint;
    this.currentState.lastActivity = new Date();

    const event: ConversationEvent = {
      type: 'ENROLLMENT_COMPLETE',
      voicePrint: result.voicePrint
    };

    this.handleConversationEvent(event);
  }

  /**
   * Handle speaker segment
   */
  private handleSpeakerSegment(segment: SpeakerSegment): void {
    if (!this.currentState) return;

    // Add segment to conversation state
    this.currentState.segments.push(segment);
    this.currentState.lastActivity = new Date();

    // Update analytics
    if (this.analytics) {
      const duration = segment.endTime - segment.startTime;
      if (segment.isEmployee) {
        this.analytics.employeeSpeakingTime += duration;
      } else {
        this.analytics.customerSpeakingTime += duration;
      }
    }

    const event: ConversationEvent = {
      type: 'TRANSCRIPTION_RECEIVED',
      segment
    };

    this.handleConversationEvent(event);
  }

  /**
   * Handle speaker change
   */
  private handleSpeakerChange(change: any): void {
    if (!this.currentState) return;

    this.currentState.currentSpeaker = change.toSpeaker;
    this.currentState.lastActivity = new Date();

    // Update analytics
    if (this.analytics) {
      this.analytics.speakerChanges++;
    }

    const event: ConversationEvent = {
      type: 'SPEAKER_CHANGE',
      fromSpeaker: change.fromSpeaker,
      toSpeaker: change.toSpeaker
    };

    this.handleConversationEvent(event);
  }

  /**
   * Handle translation routed
   */
  private handleTranslationRouted(detail: any): void {
    if (!this.analytics) return;

    this.analytics.translationsCount++;
    
    if (detail.processingTime) {
      // Update average translation time
      const totalTime = this.analytics.averageTranslationTime * (this.analytics.translationsCount - 1) + detail.processingTime;
      this.analytics.averageTranslationTime = totalTime / this.analytics.translationsCount;
    }

    const event: ConversationEvent = {
      type: 'TRANSLATION_RECEIVED',
      original: detail.pipeline.sourceText,
      translated: detail.result.translatedText
    };

    this.handleConversationEvent(event);
  }

  /**
   * Handle conversation events
   */
  private handleConversationEvent(event: ConversationEvent): void {
    // Emit to external listeners
    this.dispatchEvent(new CustomEvent('conversation-event', { detail: event }));

    // Log important events
    console.log('Conversation event:', event.type, event);
  }

  /**
   * Handle voice start
   */
  private handleVoiceStart(): void {
    if (!this.currentState) return;

    const event: ConversationEvent = { type: 'SPEECH_START', speakerId: this.currentState.currentSpeaker || 'unknown' };
    this.handleConversationEvent(event);
  }

  /**
   * Handle voice end
   */
  private handleVoiceEnd(): void {
    if (!this.currentState) return;

    const event: ConversationEvent = { type: 'SPEECH_END', speakerId: this.currentState.currentSpeaker || 'unknown' };
    this.handleConversationEvent(event);
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveSessionSnapshot();
    }, this.config.autoSaveInterval);
  }

  /**
   * Start session timer
   */
  private startSessionTimer(): void {
    this.sessionTimer = setTimeout(() => {
      console.log('Session timeout reached, ending session');
      this.endSession();
    }, this.config.maxSessionDuration);
  }

  /**
   * Start analytics collection
   */
  private startAnalyticsCollection(): void {
    this.analyticsTimer = setInterval(() => {
      this.updateAnalytics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update analytics
   */
  private updateAnalytics(): void {
    if (!this.analytics || !this.currentState) return;

    // Update total duration
    this.analytics.totalDuration = Date.now() - this.analytics.startTime.getTime();

    // Calculate quality score based on various factors
    let qualityScore = 0;
    
    if (this.currentState.employeeVoicePrint) {
      qualityScore += this.currentState.employeeVoicePrint.confidence * 0.3;
    }
    
    if (this.analytics.translationsCount > 0) {
      // Lower average translation time = higher quality
      const avgTime = this.analytics.averageTranslationTime;
      const timeScore = Math.max(0, 1 - (avgTime / 5000)); // 5 seconds = 0 score
      qualityScore += timeScore * 0.4;
    }
    
    // Speaker balance (more balanced = higher quality)
    const totalSpeaking = this.analytics.employeeSpeakingTime + this.analytics.customerSpeakingTime;
    if (totalSpeaking > 0) {
      const balance = Math.min(this.analytics.employeeSpeakingTime, this.analytics.customerSpeakingTime) / totalSpeaking;
      qualityScore += balance * 0.3;
    }

    this.analytics.qualityScore = Math.min(1, qualityScore);
  }

  /**
   * Save session snapshot
   */
  private saveSessionSnapshot(): void {
    if (!this.currentState) return;

    const snapshot: SessionSnapshot = {
      state: { ...this.currentState },
      analytics: this.analytics ? { ...this.analytics } : {} as ConversationAnalytics,
      timestamp: new Date()
    };

    this.sessionHistory.set(this.currentState.sessionId, snapshot);
    console.log('Session snapshot saved');
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer);
      this.analyticsTimer = null;
    }
  }

  /**
   * Get current conversation state
   */
  getCurrentState(): ConversationState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Get current analytics
   */
  getCurrentAnalytics(): ConversationAnalytics | null {
    return this.analytics ? { ...this.analytics } : null;
  }

  /**
   * Get session history
   */
  getSessionHistory(): SessionSnapshot[] {
    return Array.from(this.sessionHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionSnapshot | null {
    return this.sessionHistory.get(sessionId) || null;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConversationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Conversation manager config updated:', this.config);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // End current session if active
    if (this.currentState) {
      this.endSession();
    }

    // Clear timers
    this.clearTimers();

    // Clear history
    this.sessionHistory.clear();

    console.log('Conversation manager disposed');
  }
}

