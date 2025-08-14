/**
 * Text-to-Speech Engine for Synthetic Audio Generation
 * Handles TTS synthesis, voice selection, and audio playback
 */

import { TTSRequest, TTSResponse } from '../../types';

export interface TTSConfig {
  defaultVoice: string;
  defaultSpeed: number;
  defaultPitch: number;
  enableSSML: boolean;
  cacheEnabled: boolean;
  maxCacheSize: number;
  apiEndpoint?: string;
  apiKey?: string;
  fallbackToWebAPI: boolean;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'premium' | 'neural';
  provider: 'web' | 'api' | 'local';
}

export interface TTSCache {
  key: string;
  audioData: ArrayBuffer;
  timestamp: Date;
  hits: number;
  size: number;
}

export interface SpeechSynthesisOptions {
  voice?: Voice;
  speed?: number;
  pitch?: number;
  volume?: number;
  enableSSML?: boolean;
  language?: string;
}

export class TTSEngine extends EventTarget {
  private config: TTSConfig;
  private cache = new Map<string, TTSCache>();
  private availableVoices: Voice[] = [];
  private isInitialized = false;
  private currentSynthesis: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;

  constructor(config: Partial<TTSConfig> = {}) {
    super();
    
    this.config = {
      defaultVoice: 'en-US-Standard-A',
      defaultSpeed: 1.0,
      defaultPitch: 1.0,
      enableSSML: false,
      cacheEnabled: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      fallbackToWebAPI: true,
      ...config
    };
  }

  /**
   * Initialize TTS engine
   */
  async initialize(): Promise<void> {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load available voices
      await this.loadAvailableVoices();
      
      this.isInitialized = true;
      console.log('TTS engine initialized with', this.availableVoices.length, 'voices');
      
      this.dispatchEvent(new CustomEvent('tts-initialized', {
        detail: { voiceCount: this.availableVoices.length }
      }));

    } catch (error) {
      console.error('Failed to initialize TTS engine:', error);
      throw error;
    }
  }

  /**
   * Load available voices from different sources
   */
  private async loadAvailableVoices(): Promise<void> {
    this.availableVoices = [];

    // Load Web Speech API voices
    if ('speechSynthesis' in window) {
      const webVoices = speechSynthesis.getVoices();
      
      for (const voice of webVoices) {
        this.availableVoices.push({
          id: voice.name,
          name: voice.name,
          language: voice.lang,
          gender: this.inferGender(voice.name),
          quality: 'standard',
          provider: 'web'
        });
      }

      // Handle voices loading asynchronously
      if (webVoices.length === 0) {
        await new Promise<void>((resolve) => {
          const checkVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              for (const voice of voices) {
                this.availableVoices.push({
                  id: voice.name,
                  name: voice.name,
                  language: voice.lang,
                  gender: this.inferGender(voice.name),
                  quality: 'standard',
                  provider: 'web'
                });
              }
              resolve();
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }
    }

    // Add premium API voices if configured
    if (this.config.apiEndpoint && this.config.apiKey) {
      await this.loadAPIVoices();
    }

    console.log(`Loaded ${this.availableVoices.length} TTS voices`);
  }

  /**
   * Load voices from API provider
   */
  private async loadAPIVoices(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        for (const voice of data.voices || []) {
          this.availableVoices.push({
            id: voice.id,
            name: voice.name,
            language: voice.language,
            gender: voice.gender || 'neutral',
            quality: voice.quality || 'premium',
            provider: 'api'
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load API voices:', error);
    }
  }

  /**
   * Infer gender from voice name (heuristic)
   */
  private inferGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();
    
    if (name.includes('female') || name.includes('woman') || 
        name.includes('alice') || name.includes('emma') || 
        name.includes('sarah') || name.includes('anna')) {
      return 'female';
    } else if (name.includes('male') || name.includes('man') || 
               name.includes('john') || name.includes('david') || 
               name.includes('michael') || name.includes('alex')) {
      return 'male';
    }
    
    return 'neutral';
  }

  /**
   * Synthesize speech from text
   */
  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getCachedAudio(request);
        if (cached) {
          console.log('TTS served from cache');
          return {
            audioData: cached.audioData,
            duration: this.estimateDuration(request.text, request.speed || this.config.defaultSpeed),
            format: 'wav'
          };
        }
      }

      // Synthesize audio
      const result = await this.performSynthesis(request);
      
      // Cache result
      if (this.config.cacheEnabled) {
        this.cacheAudio(request, result);
      }

      return result;

    } catch (error) {
      console.error('TTS synthesis failed:', error);
      throw new Error(`TTS synthesis failed: ${error.message}`);
    }
  }

  /**
   * Perform actual speech synthesis
   */
  private async performSynthesis(request: TTSRequest): Promise<TTSResponse> {
    // Try API synthesis first if available
    if (this.config.apiEndpoint && this.config.apiKey) {
      try {
        return await this.apiSynthesize(request);
      } catch (error) {
        console.warn('API synthesis failed, falling back to web API:', error);
      }
    }

    // Fallback to Web Speech API
    if (this.config.fallbackToWebAPI && 'speechSynthesis' in window) {
      return await this.webSynthesize(request);
    }

    throw new Error('No TTS synthesis method available');
  }

  /**
   * API-based synthesis
   */
  private async apiSynthesize(request: TTSRequest): Promise<TTSResponse> {
    const response = await fetch(`${this.config.apiEndpoint}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: request.text,
        voice: request.voice || this.config.defaultVoice,
        speed: request.speed || this.config.defaultSpeed,
        pitch: request.pitch || this.config.defaultPitch,
        language: request.language,
        format: 'wav'
      })
    });

    if (!response.ok) {
      throw new Error(`API synthesis failed: ${response.status} ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();
    const duration = this.estimateDuration(request.text, request.speed || this.config.defaultSpeed);

    return {
      audioData,
      duration,
      format: 'wav'
    };
  }

  /**
   * Web Speech API synthesis
   */
  private async webSynthesize(request: TTSRequest): Promise<TTSResponse> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(request.text);
        
        // Configure utterance
        utterance.rate = request.speed || this.config.defaultSpeed;
        utterance.pitch = request.pitch || this.config.defaultPitch;
        utterance.volume = 1.0;
        
        // Find and set voice
        if (request.voice) {
          const voice = this.availableVoices.find(v => v.id === request.voice);
          if (voice && voice.provider === 'web') {
            const webVoice = speechSynthesis.getVoices().find(v => v.name === voice.name);
            if (webVoice) {
              utterance.voice = webVoice;
            }
          }
        }

        // Set language
        if (request.language) {
          utterance.lang = request.language;
        }

        // Handle events
        utterance.onend = () => {
          // For Web Speech API, we can't get actual audio data
          // Return a mock response
          const duration = this.estimateDuration(request.text, utterance.rate);
          resolve({
            audioData: new ArrayBuffer(0), // Empty buffer for web synthesis
            duration,
            format: 'web'
          });
        };

        utterance.onerror = (event) => {
          reject(new Error(`Web synthesis failed: ${event.error}`));
        };

        this.currentSynthesis = utterance;
        speechSynthesis.speak(utterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Play synthesized audio
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      
      // Create audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      // Play audio
      return new Promise((resolve, reject) => {
        source.onended = () => resolve();
        source.onerror = (error) => reject(error);
        source.start();
      });

    } catch (error) {
      console.error('Failed to play TTS audio:', error);
      throw error;
    }
  }

  /**
   * Stop current synthesis
   */
  stopSynthesis(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    this.currentSynthesis = null;
  }

  /**
   * Get cached audio
   */
  private getCachedAudio(request: TTSRequest): TTSCache | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      // Check if cache is still valid (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - cached.timestamp.getTime() < maxAge) {
        cached.hits++;
        return cached;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Cache audio data
   */
  private cacheAudio(request: TTSRequest, response: TTSResponse): void {
    const cacheKey = this.generateCacheKey(request);
    
    const cached: TTSCache = {
      key: cacheKey,
      audioData: response.audioData,
      timestamp: new Date(),
      hits: 0,
      size: response.audioData.byteLength
    };

    this.cache.set(cacheKey, cached);
    
    // Check cache size limit
    this.enforceCacheLimit();
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: TTSRequest): string {
    const parts = [
      request.text,
      request.voice || this.config.defaultVoice,
      request.speed || this.config.defaultSpeed,
      request.pitch || this.config.defaultPitch,
      request.language || 'en'
    ];
    
    return parts.join('|');
  }

  /**
   * Enforce cache size limit
   */
  private enforceCacheLimit(): void {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, cached) => sum + cached.size, 0);
    
    if (totalSize > this.config.maxCacheSize) {
      // Remove least recently used items
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.hits - b.hits || a.timestamp.getTime() - b.timestamp.getTime());
      
      let removedSize = 0;
      const targetSize = this.config.maxCacheSize * 0.8; // Remove to 80% of limit
      
      for (const [key, cached] of sortedEntries) {
        this.cache.delete(key);
        removedSize += cached.size;
        
        if (totalSize - removedSize <= targetSize) {
          break;
        }
      }
      
      console.log(`TTS cache cleanup: removed ${removedSize} bytes`);
    }
  }

  /**
   * Estimate audio duration
   */
  private estimateDuration(text: string, speed: number): number {
    // Rough estimation: average speaking rate is ~150 words per minute
    const words = text.split(/\s+/).length;
    const baseMinutes = words / 150;
    const adjustedMinutes = baseMinutes / speed;
    return adjustedMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): Voice[] {
    return [...this.availableVoices];
  }

  /**
   * Get voices by language
   */
  getVoicesByLanguage(language: string): Voice[] {
    return this.availableVoices.filter(voice => 
      voice.language.startsWith(language) || voice.language === language
    );
  }

  /**
   * Find best voice for language and gender
   */
  findBestVoice(language: string, gender?: 'male' | 'female' | 'neutral'): Voice | null {
    let candidates = this.getVoicesByLanguage(language);
    
    if (gender) {
      const genderMatches = candidates.filter(v => v.gender === gender);
      if (genderMatches.length > 0) {
        candidates = genderMatches;
      }
    }
    
    // Prefer premium/neural voices
    const premium = candidates.filter(v => v.quality === 'neural' || v.quality === 'premium');
    if (premium.length > 0) {
      return premium[0];
    }
    
    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    count: number;
    hitRate: number;
    totalSize: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, cached) => sum + cached.hits, 0);
    const totalRequests = entries.reduce((sum, cached) => sum + cached.hits + 1, 0);
    const totalSize = entries.reduce((sum, cached) => sum + cached.size, 0);
    
    return {
      size: this.cache.size,
      count: entries.length,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalSize
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('TTS cache cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('TTS engine config updated:', this.config);
  }

  /**
   * Check if TTS is supported
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window || 
           (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Stop any current synthesis
    this.stopSynthesis();
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear cache
    this.cache.clear();
    
    // Clear voices
    this.availableVoices = [];
    
    this.isInitialized = false;
    console.log('TTS engine disposed');
  }
}

