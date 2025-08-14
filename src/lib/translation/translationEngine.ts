/**
 * Enhanced Translation Engine for Real-Time Conversations
 * Handles bidirectional translation with session management and caching
 */

import { TranslationRequest, TranslationResponse, Language, ApiResponse } from '../../types';

export interface TranslationEngineConfig {
  apiBaseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheEnabled: boolean;
  batchSize: number;
  enableMockMode: boolean;
}

export interface TranslationSession {
  id: string;
  employeeLanguage: string;
  customerLanguage: string;
  createdAt: Date;
  lastActivity: Date;
  translationCount: number;
}

export interface TranslationCache {
  key: string;
  translation: TranslationResponse;
  timestamp: Date;
  hits: number;
}

export class TranslationEngine {
  private config: TranslationEngineConfig;
  private cache = new Map<string, TranslationCache>();
  private sessions = new Map<string, TranslationSession>();
  private requestQueue: TranslationRequest[] = [];
  private isProcessingQueue = false;

  // Mock translation database for development
  private mockTranslations = new Map<string, Map<string, string>>([
    // English to Spanish
    ['en-es', new Map([
      ['hello', 'hola'],
      ['goodbye', 'adiós'],
      ['thank you', 'gracias'],
      ['please', 'por favor'],
      ['excuse me', 'disculpe'],
      ['how can i help you', 'cómo puedo ayudarte'],
      ['what is your name', 'cómo te llamas'],
      ['i need help', 'necesito ayuda'],
      ['where is the bathroom', 'dónde está el baño'],
      ['how much does it cost', 'cuánto cuesta'],
      ['i don\'t understand', 'no entiendo'],
      ['can you repeat that', 'puedes repetir eso'],
      ['speak more slowly', 'habla más despacio'],
      ['i am looking for', 'estoy buscando'],
      ['what time is it', 'qué hora es']
    ])],
    
    // Spanish to English
    ['es-en', new Map([
      ['hola', 'hello'],
      ['adiós', 'goodbye'],
      ['gracias', 'thank you'],
      ['por favor', 'please'],
      ['disculpe', 'excuse me'],
      ['cómo puedo ayudarte', 'how can i help you'],
      ['cómo te llamas', 'what is your name'],
      ['necesito ayuda', 'i need help'],
      ['dónde está el baño', 'where is the bathroom'],
      ['cuánto cuesta', 'how much does it cost'],
      ['no entiendo', 'i don\'t understand'],
      ['puedes repetir eso', 'can you repeat that'],
      ['habla más despacio', 'speak more slowly'],
      ['estoy buscando', 'i am looking for'],
      ['qué hora es', 'what time is it']
    ])],

    // English to French
    ['en-fr', new Map([
      ['hello', 'bonjour'],
      ['goodbye', 'au revoir'],
      ['thank you', 'merci'],
      ['please', 's\'il vous plaît'],
      ['excuse me', 'excusez-moi'],
      ['how can i help you', 'comment puis-je vous aider'],
      ['what is your name', 'comment vous appelez-vous'],
      ['i need help', 'j\'ai besoin d\'aide'],
      ['where is the bathroom', 'où sont les toilettes'],
      ['how much does it cost', 'combien ça coûte']
    ])],

    // French to English
    ['fr-en', new Map([
      ['bonjour', 'hello'],
      ['au revoir', 'goodbye'],
      ['merci', 'thank you'],
      ['s\'il vous plaît', 'please'],
      ['excusez-moi', 'excuse me'],
      ['comment puis-je vous aider', 'how can i help you'],
      ['comment vous appelez-vous', 'what is your name'],
      ['j\'ai besoin d\'aide', 'i need help'],
      ['où sont les toilettes', 'where is the bathroom'],
      ['combien ça coûte', 'how much does it cost']
    ])]
  ]);

  constructor(config: Partial<TranslationEngineConfig> = {}) {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://invictus-api.example.com',
      timeout: 10000,
      retryAttempts: 3,
      cacheEnabled: true,
      batchSize: 5,
      enableMockMode: import.meta.env.VITE_DEBUG === 'true',
      ...config
    };

    // Start queue processing
    this.startQueueProcessor();
  }

  /**
   * Create a new translation session
   */
  createSession(employeeLanguage: string, customerLanguage: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: TranslationSession = {
      id: sessionId,
      employeeLanguage,
      customerLanguage,
      createdAt: new Date(),
      lastActivity: new Date(),
      translationCount: 0
    };

    this.sessions.set(sessionId, session);
    console.log(`Translation session created: ${sessionId}`);
    
    return sessionId;
  }

  /**
   * Translate text with caching and session management
   */
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      if (!request.text?.trim()) {
        throw new Error('Empty text provided for translation');
      }

      if (!request.sourceLanguage || !request.targetLanguage) {
        throw new Error('Source and target languages are required');
      }

      // Skip translation if languages are the same
      if (request.sourceLanguage === request.targetLanguage) {
        return {
          translatedText: request.text,
          confidence: 1.0,
          detectedLanguage: request.sourceLanguage
        };
      }

      // Update session activity
      if (request.sessionId && this.sessions.has(request.sessionId)) {
        const session = this.sessions.get(request.sessionId)!;
        session.lastActivity = new Date();
        session.translationCount++;
      }

      // Check cache first
      if (this.config.cacheEnabled) {
        const cachedResult = this.getCachedTranslation(request);
        if (cachedResult) {
          console.log('Translation served from cache');
          return cachedResult;
        }
      }

      // Perform translation
      const result = this.config.enableMockMode 
        ? await this.mockTranslate(request)
        : await this.apiTranslate(request);

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cacheTranslation(request, result);
      }

      // Add latency information
      result.latencyMs = Date.now() - startTime;

      console.log(`Translation completed in ${result.latencyMs}ms`);
      return result;

    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    const results: TranslationResponse[] = [];
    
    // Process in batches
    for (let i = 0; i < requests.length; i += this.config.batchSize) {
      const batch = requests.slice(i, i + this.config.batchSize);
      const batchPromises = batch.map(request => this.translateText(request));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch translation failed:', error);
        // Add error responses for failed batch
        batch.forEach(() => {
          results.push({
            translatedText: 'Translation failed',
            confidence: 0,
            error: error.message
          } as TranslationResponse);
        });
      }
    }

    return results;
  }

  /**
   * Add translation to queue for background processing
   */
  queueTranslation(request: TranslationRequest): void {
    this.requestQueue.push(request);
  }

  /**
   * Mock translation for development
   */
  private async mockTranslate(request: TranslationRequest): Promise<TranslationResponse> {
    const delay = Math.random() * 500 + 200; // 200-700ms delay
    await new Promise(resolve => setTimeout(resolve, delay));

    const langPair = `${request.sourceLanguage}-${request.targetLanguage}`;
    const translations = this.mockTranslations.get(langPair);
    
    if (translations) {
      const normalizedText = request.text.toLowerCase().trim();
      const translation = translations.get(normalizedText);
      
      if (translation) {
        return {
          translatedText: translation,
          confidence: 0.95,
          detectedLanguage: request.sourceLanguage,
          alternatives: this.generateAlternatives(translation)
        };
      }
    }

    // Fallback: return formatted version of original text
    return {
      translatedText: `[${request.targetLanguage.toUpperCase()}] ${request.text}`,
      confidence: 0.7,
      detectedLanguage: request.sourceLanguage,
      alternatives: [`Translation of: ${request.text}`]
    };
  }

  /**
   * API-based translation
   */
  private async apiTranslate(request: TranslationRequest): Promise<TranslationResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': request.sessionId || ''
        },
        body: JSON.stringify({
          text: request.text,
          source: request.sourceLanguage,
          target: request.targetLanguage,
          context: request.context,
          priority: request.priority || 'normal'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as TranslationResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Translation request timed out');
      }
      
      // Fallback to mock translation on API failure
      console.warn('API translation failed, falling back to mock:', error);
      return this.mockTranslate(request);
    }
  }

  /**
   * Generate alternative translations
   */
  private generateAlternatives(baseTranslation: string): string[] {
    const alternatives = [];
    
    // Simple variations (in production, these would come from the API)
    if (baseTranslation.includes('hello')) {
      alternatives.push('hi', 'greetings');
    } else if (baseTranslation.includes('goodbye')) {
      alternatives.push('bye', 'see you later');
    } else if (baseTranslation.includes('thank you')) {
      alternatives.push('thanks', 'much appreciated');
    }

    return alternatives.slice(0, 3); // Limit to 3 alternatives
  }

  /**
   * Get cached translation
   */
  private getCachedTranslation(request: TranslationRequest): TranslationResponse | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      // Check if cache is still valid (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - cached.timestamp.getTime() < maxAge) {
        cached.hits++;
        return cached.translation;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    return null;
  }

  /**
   * Cache translation result
   */
  private cacheTranslation(request: TranslationRequest, response: TranslationResponse): void {
    const cacheKey = this.generateCacheKey(request);
    
    this.cache.set(cacheKey, {
      key: cacheKey,
      translation: response,
      timestamp: new Date(),
      hits: 0
    });

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Generate cache key for translation request
   */
  private generateCacheKey(request: TranslationRequest): string {
    const text = request.text.toLowerCase().trim();
    return `${request.sourceLanguage}-${request.targetLanguage}-${text}`;
  }

  /**
   * Start background queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.requestQueue.length > 0 && !this.isProcessingQueue) {
        this.isProcessingQueue = true;
        
        try {
          const batch = this.requestQueue.splice(0, this.config.batchSize);
          await this.translateBatch(batch);
        } catch (error) {
          console.error('Queue processing failed:', error);
        } finally {
          this.isProcessingQueue = false;
        }
      }
    }, 1000); // Process queue every second
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): TranslationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; totalHits: number } {
    let totalHits = 0;
    let totalRequests = 0;
    
    for (const cached of this.cache.values()) {
      totalHits += cached.hits;
      totalRequests += cached.hits + 1; // +1 for initial cache miss
    }
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Translation cache cleared');
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > maxAge) {
        this.sessions.delete(sessionId);
        console.log(`Expired session cleaned up: ${sessionId}`);
      }
    }
  }

  /**
   * Health check for translation service
   */
  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const testRequest: TranslationRequest = {
        text: 'hello',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        sessionId: 'health-check'
      };
      
      await this.translateText(testRequest);
      
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cache.clear();
    this.sessions.clear();
    this.requestQueue = [];
    console.log('Translation engine disposed');
  }
}

