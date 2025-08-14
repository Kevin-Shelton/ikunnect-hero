// Core Types for Hands-Free Translation System

export interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
  region: string;
}

export interface VoicePrint {
  id: string;
  userId: string;
  features: Float32Array;
  confidence: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SpeakerSegment {
  speakerId: string;
  startTime: number;
  endTime: number;
  confidence: number;
  text?: string;
  language?: string;
  isEmployee: boolean;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  sessionId: string;
  priority?: 'low' | 'normal' | 'high';
  context?: string;
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  alternatives?: string[];
  detectedLanguage?: string;
  metadata?: Record<string, any>;
}

export interface AudioSegment {
  id: string;
  audioData: ArrayBuffer;
  startTime: number;
  endTime: number;
  speakerId: string;
  transcription?: string;
  translation?: string;
  language: string;
}

export interface ConversationState {
  sessionId: string;
  employeeLanguage: string;
  customerLanguage: string;
  isActive: boolean;
  isEnrolling: boolean;
  isHandsFree: boolean;
  employeeVoicePrint?: VoicePrint;
  segments: SpeakerSegment[];
  currentSpeaker?: string;
  lastActivity: Date;
}

export interface QARecord {
  id: string;
  sessionId: string;
  timestamp: Date;
  audioSegment: AudioSegment;
  originalText: string;
  translatedText: string;
  confidence: number;
  speakerType: 'employee' | 'customer';
  language: string;
  metadata?: Record<string, any>;
}

export interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioData: ArrayBuffer;
  duration: number;
  format: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  bufferSize: number;
}

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  language: string;
  speakerId?: string;
  timestamp: number;
}

export interface VerbumConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  language: string;
  enableDiarization: boolean;
  enableVAD: boolean;
}

export interface HandsFreeConfig {
  enrollmentDuration: number; // 6 seconds
  silenceThreshold: number; // 600ms
  minTurnDuration: number; // 1500ms
  voicePrintThreshold: number; // 0.65
  enableTTSDucking: boolean;
  enableQARecording: boolean;
}

// Event Types
export type ConversationEvent = 
  | { type: 'ENROLLMENT_START' }
  | { type: 'ENROLLMENT_COMPLETE'; voicePrint: VoicePrint }
  | { type: 'ENROLLMENT_FAILED'; error: string }
  | { type: 'SPEECH_START'; speakerId: string }
  | { type: 'SPEECH_END'; speakerId: string }
  | { type: 'TRANSCRIPTION_RECEIVED'; segment: SpeakerSegment }
  | { type: 'TRANSLATION_RECEIVED'; original: string; translated: string }
  | { type: 'SPEAKER_CHANGE'; fromSpeaker: string; toSpeaker: string }
  | { type: 'ERROR'; error: string };

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    verbum: boolean;
    translation: boolean;
    tts: boolean;
    qa: boolean;
  };
  timestamp: Date;
}

// Utility Types
export type SpeakerRole = 'employee' | 'customer';
export type ConversationStatus = 'idle' | 'enrolling' | 'active' | 'paused' | 'ended';
export type AudioState = 'idle' | 'recording' | 'processing' | 'playing' | 'paused';
export type TranslationDirection = 'employee-to-customer' | 'customer-to-employee';

