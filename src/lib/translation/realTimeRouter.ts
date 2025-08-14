/**
 * Real-Time Speech Routing System
 * Handles routing of speech between employee and customer with translation
 */

import { SpeakerSegment, TranslationRequest, TranslationResponse, ConversationState, ConversationEvent } from '../../types';
import { TranslationEngine } from './translationEngine';
import { SpeakerDiarizationEngine } from '../speech/speakerDiarization';

export interface RoutingConfig {
  enableAutoRouting: boolean;
  routingDelay: number; // ms delay before routing
  minSegmentLength: number; // minimum segment length to route
  enableTranslationCaching: boolean;
  maxConcurrentTranslations: number;
  enableBidirectional: boolean;
}

export interface RoutingRule {
  id: string;
  fromSpeaker: string;
  toLanguage: string;
  priority: number;
  enabled: boolean;
  conditions?: Record<string, any>;
}

export interface TranslationPipeline {
  id: string;
  sessionId: string;
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  speakerType: 'employee' | 'customer';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  result?: TranslationResponse;
  error?: string;
}

export class RealTimeRouter extends EventTarget {
  private config: RoutingConfig;
  private translationEngine: TranslationEngine;
  private diarizationEngine: SpeakerDiarizationEngine;
  private conversationState: ConversationState | null = null;
  private routingRules: Map<string, RoutingRule> = new Map();
  private translationPipelines: Map<string, TranslationPipeline> = new Map();
  private routingQueue: SpeakerSegment[] = [];
  private isProcessingQueue = false;
  private routingTimer: NodeJS.Timeout | null = null;

  constructor(
    config: Partial<RoutingConfig> = {},
    translationEngine: TranslationEngine,
    diarizationEngine: SpeakerDiarizationEngine
  ) {
    super();
    
    this.config = {
      enableAutoRouting: true,
      routingDelay: 500, // 500ms delay
      minSegmentLength: 1000, // 1 second minimum
      enableTranslationCaching: true,
      maxConcurrentTranslations: 3,
      enableBidirectional: true,
      ...config
    };

    this.translationEngine = translationEngine;
    this.diarizationEngine = diarizationEngine;

    this.setupEventListeners();
  }

  /**
   * Initialize routing system with conversation state
   */
  initialize(conversationState: ConversationState): void {
    this.conversationState = conversationState;
    
    // Set up default routing rules
    this.setupDefaultRoutingRules();
    
    // Start queue processing
    this.startQueueProcessing();
    
    console.log('Real-time router initialized for session:', conversationState.sessionId);
  }

  /**
   * Setup event listeners for diarization engine
   */
  private setupEventListeners(): void {
    this.diarizationEngine.addEventListener('speaker-segment', (event: any) => {
      const segment = event.detail as SpeakerSegment;
      this.handleSpeakerSegment(segment);
    });

    this.diarizationEngine.addEventListener('speaker-change', (event: any) => {
      const change = event.detail;
      this.handleSpeakerChange(change);
    });
  }

  /**
   * Handle new speaker segment
   */
  private handleSpeakerSegment(segment: SpeakerSegment): void {
    if (!this.conversationState || !this.config.enableAutoRouting) {
      return;
    }

    // Check if segment meets minimum length requirement
    const segmentLength = segment.endTime - segment.startTime;
    if (segmentLength < this.config.minSegmentLength) {
      console.log('Segment too short for routing:', segmentLength);
      return;
    }

    // Add to routing queue
    this.routingQueue.push(segment);
    
    // Process with delay to allow for corrections
    if (this.routingTimer) {
      clearTimeout(this.routingTimer);
    }
    
    this.routingTimer = setTimeout(() => {
      this.processRoutingQueue();
    }, this.config.routingDelay);

    console.log('Speaker segment queued for routing:', segment);
  }

  /**
   * Handle speaker change events
   */
  private handleSpeakerChange(change: any): void {
    if (!this.conversationState) return;

    // Update conversation state
    this.conversationState.currentSpeaker = change.toSpeaker;
    this.conversationState.lastActivity = new Date();

    // Emit conversation event
    const event: ConversationEvent = {
      type: 'SPEAKER_CHANGE',
      fromSpeaker: change.fromSpeaker,
      toSpeaker: change.toSpeaker
    };

    this.dispatchEvent(new CustomEvent('conversation-event', { detail: event }));
  }

  /**
   * Process routing queue
   */
  private async processRoutingQueue(): Promise<void> {
    if (this.isProcessingQueue || this.routingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process all segments in queue
      const segments = [...this.routingQueue];
      this.routingQueue = [];

      for (const segment of segments) {
        await this.routeSegment(segment);
      }
    } catch (error) {
      console.error('Error processing routing queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Route a speaker segment for translation
   */
  private async routeSegment(segment: SpeakerSegment): Promise<void> {
    if (!this.conversationState || !segment.text) {
      return;
    }

    try {
      // Determine routing based on speaker
      const routingInfo = this.determineRouting(segment);
      
      if (!routingInfo) {
        console.log('No routing rule found for segment:', segment);
        return;
      }

      // Create translation pipeline
      const pipeline = this.createTranslationPipeline(segment, routingInfo);
      
      // Execute translation
      await this.executeTranslation(pipeline);

    } catch (error) {
      console.error('Failed to route segment:', error);
      
      const event: ConversationEvent = {
        type: 'ERROR',
        error: `Routing failed: ${error.message}`
      };
      
      this.dispatchEvent(new CustomEvent('conversation-event', { detail: event }));
    }
  }

  /**
   * Determine routing for a segment
   */
  private determineRouting(segment: SpeakerSegment): { targetLanguage: string; speakerType: 'employee' | 'customer' } | null {
    if (!this.conversationState) return null;

    // Determine speaker type and target language
    if (segment.isEmployee) {
      // Employee speaking -> translate to customer language
      return {
        targetLanguage: this.conversationState.customerLanguage,
        speakerType: 'employee'
      };
    } else {
      // Customer speaking -> translate to employee language
      return {
        targetLanguage: this.conversationState.employeeLanguage,
        speakerType: 'customer'
      };
    }
  }

  /**
   * Create translation pipeline
   */
  private createTranslationPipeline(segment: SpeakerSegment, routingInfo: { targetLanguage: string; speakerType: 'employee' | 'customer' }): TranslationPipeline {
    const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sourceLanguage = segment.isEmployee 
      ? this.conversationState!.employeeLanguage
      : this.conversationState!.customerLanguage;

    const pipeline: TranslationPipeline = {
      id: pipelineId,
      sessionId: this.conversationState!.sessionId,
      sourceText: segment.text!,
      sourceLanguage,
      targetLanguage: routingInfo.targetLanguage,
      speakerType: routingInfo.speakerType,
      status: 'pending',
      startTime: Date.now()
    };

    this.translationPipelines.set(pipelineId, pipeline);
    return pipeline;
  }

  /**
   * Execute translation pipeline
   */
  private async executeTranslation(pipeline: TranslationPipeline): Promise<void> {
    try {
      pipeline.status = 'processing';
      
      // Check concurrent translation limit
      const activePipelines = Array.from(this.translationPipelines.values())
        .filter(p => p.status === 'processing');
      
      if (activePipelines.length >= this.config.maxConcurrentTranslations) {
        console.log('Translation queue full, waiting...');
        await this.waitForAvailableSlot();
      }

      // Create translation request
      const request: TranslationRequest = {
        text: pipeline.sourceText,
        sourceLanguage: pipeline.sourceLanguage,
        targetLanguage: pipeline.targetLanguage,
        sessionId: pipeline.sessionId,
        priority: 'high', // Real-time translations have high priority
        context: `${pipeline.speakerType}_speech`
      };

      // Execute translation
      const result = await this.translationEngine.translateText(request);
      
      // Update pipeline
      pipeline.status = 'completed';
      pipeline.endTime = Date.now();
      pipeline.result = result;

      // Emit translation event
      const event: ConversationEvent = {
        type: 'TRANSLATION_RECEIVED',
        original: pipeline.sourceText,
        translated: result.translatedText
      };

      this.dispatchEvent(new CustomEvent('conversation-event', { detail: event }));
      
      // Emit specific routing event
      this.dispatchEvent(new CustomEvent('translation-routed', {
        detail: {
          pipeline,
          result,
          speakerType: pipeline.speakerType,
          processingTime: pipeline.endTime - pipeline.startTime
        }
      }));

      console.log('Translation completed:', {
        pipeline: pipeline.id,
        processingTime: pipeline.endTime - pipeline.startTime,
        confidence: result.confidence
      });

    } catch (error) {
      pipeline.status = 'failed';
      pipeline.endTime = Date.now();
      pipeline.error = error.message;

      console.error('Translation pipeline failed:', error);
      
      const event: ConversationEvent = {
        type: 'ERROR',
        error: `Translation failed: ${error.message}`
      };
      
      this.dispatchEvent(new CustomEvent('conversation-event', { detail: event }));
    }
  }

  /**
   * Wait for available translation slot
   */
  private async waitForAvailableSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        const activePipelines = Array.from(this.translationPipelines.values())
          .filter(p => p.status === 'processing');
        
        if (activePipelines.length < this.config.maxConcurrentTranslations) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      
      checkSlot();
    });
  }

  /**
   * Setup default routing rules
   */
  private setupDefaultRoutingRules(): void {
    if (!this.conversationState) return;

    // Employee to Customer rule
    const employeeRule: RoutingRule = {
      id: 'employee_to_customer',
      fromSpeaker: 'employee',
      toLanguage: this.conversationState.customerLanguage,
      priority: 1,
      enabled: true
    };

    // Customer to Employee rule
    const customerRule: RoutingRule = {
      id: 'customer_to_employee',
      fromSpeaker: 'customer',
      toLanguage: this.conversationState.employeeLanguage,
      priority: 1,
      enabled: true
    };

    this.routingRules.set(employeeRule.id, employeeRule);
    this.routingRules.set(customerRule.id, customerRule);

    console.log('Default routing rules setup:', {
      employeeToCustomer: `${this.conversationState.employeeLanguage} -> ${this.conversationState.customerLanguage}`,
      customerToEmployee: `${this.conversationState.customerLanguage} -> ${this.conversationState.employeeLanguage}`
    });
  }

  /**
   * Add custom routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.set(rule.id, rule);
    console.log('Routing rule added:', rule);
  }

  /**
   * Remove routing rule
   */
  removeRoutingRule(ruleId: string): boolean {
    const removed = this.routingRules.delete(ruleId);
    if (removed) {
      console.log('Routing rule removed:', ruleId);
    }
    return removed;
  }

  /**
   * Enable/disable routing rule
   */
  toggleRoutingRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.routingRules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      console.log(`Routing rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Start queue processing
   */
  private startQueueProcessing(): void {
    // Process queue every 100ms
    setInterval(() => {
      if (!this.isProcessingQueue && this.routingQueue.length > 0) {
        this.processRoutingQueue();
      }
    }, 100);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalPipelines: number;
    activePipelines: number;
    completedPipelines: number;
    failedPipelines: number;
    averageProcessingTime: number;
    queueSize: number;
  } {
    const pipelines = Array.from(this.translationPipelines.values());
    const completed = pipelines.filter(p => p.status === 'completed');
    const failed = pipelines.filter(p => p.status === 'failed');
    const active = pipelines.filter(p => p.status === 'processing');

    const avgProcessingTime = completed.length > 0
      ? completed.reduce((sum, p) => sum + (p.endTime! - p.startTime), 0) / completed.length
      : 0;

    return {
      totalPipelines: pipelines.length,
      activePipelines: active.length,
      completedPipelines: completed.length,
      failedPipelines: failed.length,
      averageProcessingTime: avgProcessingTime,
      queueSize: this.routingQueue.length
    };
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(pipelineId: string): TranslationPipeline | null {
    return this.translationPipelines.get(pipelineId) || null;
  }

  /**
   * Get recent pipelines
   */
  getRecentPipelines(limit: number = 10): TranslationPipeline[] {
    const pipelines = Array.from(this.translationPipelines.values());
    return pipelines
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Clear completed pipelines (cleanup)
   */
  clearCompletedPipelines(): number {
    const completed = Array.from(this.translationPipelines.entries())
      .filter(([_, pipeline]) => pipeline.status === 'completed' || pipeline.status === 'failed');
    
    for (const [id] of completed) {
      this.translationPipelines.delete(id);
    }

    console.log(`Cleared ${completed.length} completed pipelines`);
    return completed.length;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Routing config updated:', this.config);
  }

  /**
   * Pause routing
   */
  pauseRouting(): void {
    this.config.enableAutoRouting = false;
    console.log('Routing paused');
  }

  /**
   * Resume routing
   */
  resumeRouting(): void {
    this.config.enableAutoRouting = true;
    console.log('Routing resumed');
  }

  /**
   * Reset routing system
   */
  reset(): void {
    // Clear queue and timers
    this.routingQueue = [];
    if (this.routingTimer) {
      clearTimeout(this.routingTimer);
      this.routingTimer = null;
    }

    // Clear pipelines
    this.translationPipelines.clear();
    
    // Reset state
    this.isProcessingQueue = false;
    
    console.log('Routing system reset');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.reset();
    this.routingRules.clear();
    this.conversationState = null;
    console.log('Real-time router disposed');
  }
}

