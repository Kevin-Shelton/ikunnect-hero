/**
 * QA Recording System for Translation Quality Monitoring
 * Records conversations, tracks quality metrics, and provides analytics
 */

import { QARecord, AudioSegment, ConversationState, TranslationResponse } from '../../types';

export interface QAConfig {
  enableRecording: boolean;
  enableAnalytics: boolean;
  recordingFormat: 'webm' | 'wav' | 'mp3';
  maxRecordingSize: number; // bytes
  retentionPeriod: number; // days
  qualityThresholds: {
    confidence: number;
    latency: number; // ms
    accuracy: number;
  };
  enableAutoReview: boolean;
  samplingRate: number; // 0-1, percentage of conversations to record
}

export interface QAMetrics {
  sessionId: string;
  totalTranslations: number;
  averageConfidence: number;
  averageLatency: number;
  qualityScore: number;
  errorRate: number;
  speakerAccuracy: number;
  languageDetectionAccuracy: number;
  timestamp: Date;
}

export interface QAAlert {
  id: string;
  sessionId: string;
  type: 'low_confidence' | 'high_latency' | 'speaker_error' | 'translation_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface QADashboard {
  totalSessions: number;
  totalTranslations: number;
  averageQualityScore: number;
  activeAlerts: number;
  topIssues: Array<{ type: string; count: number }>;
  performanceTrends: Array<{ date: Date; score: number }>;
}

export class QARecordingSystem extends EventTarget {
  private config: QAConfig;
  private records = new Map<string, QARecord>();
  private metrics = new Map<string, QAMetrics>();
  private alerts = new Map<string, QAAlert>();
  private audioRecordings = new Map<string, Blob>();
  private isRecording = false;
  private currentSessionId: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];

  constructor(config: Partial<QAConfig> = {}) {
    super();
    
    this.config = {
      enableRecording: true,
      enableAnalytics: true,
      recordingFormat: 'webm',
      maxRecordingSize: 100 * 1024 * 1024, // 100MB
      retentionPeriod: 30, // 30 days
      qualityThresholds: {
        confidence: 0.7,
        latency: 3000, // 3 seconds
        accuracy: 0.8
      },
      enableAutoReview: true,
      samplingRate: 1.0, // Record all conversations
      ...config
    };
  }

  /**
   * Start QA recording for a session
   */
  async startRecording(sessionId: string, mediaStream: MediaStream): Promise<void> {
    if (!this.config.enableRecording) {
      console.log('QA recording disabled');
      return;
    }

    // Check sampling rate
    if (Math.random() > this.config.samplingRate) {
      console.log('Session not selected for QA recording (sampling)');
      return;
    }

    try {
      this.currentSessionId = sessionId;
      this.recordingChunks = [];

      // Create media recorder
      const options = {
        mimeType: `audio/${this.config.recordingFormat}`,
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(mediaStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
          
          // Check size limit
          const totalSize = this.recordingChunks.reduce((sum, chunk) => sum + chunk.size, 0);
          if (totalSize > this.config.maxRecordingSize) {
            console.warn('Recording size limit reached, stopping recording');
            this.stopRecording();
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('QA recording error:', error);
        this.createAlert(sessionId, 'translation_error', 'medium', `Recording error: ${error}`);
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log(`QA recording started for session: ${sessionId}`);
      
      this.dispatchEvent(new CustomEvent('recording-started', {
        detail: { sessionId }
      }));

    } catch (error) {
      console.error('Failed to start QA recording:', error);
      throw error;
    }
  }

  /**
   * Stop QA recording
   */
  stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.isRecording = false;

      console.log(`QA recording stopped for session: ${this.currentSessionId}`);
      
      this.dispatchEvent(new CustomEvent('recording-stopped', {
        detail: { sessionId: this.currentSessionId }
      }));

    } catch (error) {
      console.error('Failed to stop QA recording:', error);
    }
  }

  /**
   * Save recording to storage
   */
  private saveRecording(): void {
    if (!this.currentSessionId || this.recordingChunks.length === 0) {
      return;
    }

    try {
      const recordingBlob = new Blob(this.recordingChunks, {
        type: `audio/${this.config.recordingFormat}`
      });

      this.audioRecordings.set(this.currentSessionId, recordingBlob);
      
      console.log(`QA recording saved for session: ${this.currentSessionId}, size: ${recordingBlob.size} bytes`);
      
      // Clean up
      this.recordingChunks = [];
      this.currentSessionId = null;

    } catch (error) {
      console.error('Failed to save QA recording:', error);
    }
  }

  /**
   * Record translation for QA analysis
   */
  recordTranslation(
    sessionId: string,
    originalText: string,
    translatedText: string,
    translationResponse: TranslationResponse,
    speakerType: 'employee' | 'customer',
    language: string,
    audioSegment?: AudioSegment
  ): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    try {
      const recordId = `qa_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const qaRecord: QARecord = {
        id: recordId,
        sessionId,
        timestamp: new Date(),
        audioSegment: audioSegment || {
          id: `audio_${recordId}`,
          audioData: new ArrayBuffer(0),
          startTime: Date.now(),
          endTime: Date.now(),
          speakerId: speakerType,
          transcription: originalText,
          translation: translatedText,
          language
        },
        originalText,
        translatedText,
        confidence: translationResponse.confidence || 0,
        speakerType,
        language,
        metadata: {
          latency: translationResponse.latencyMs || 0,
          detectedLanguage: translationResponse.detectedLanguage,
          alternatives: translationResponse.alternatives,
          model: translationResponse.metadata?.model,
          version: translationResponse.metadata?.version
        }
      };

      this.records.set(recordId, qaRecord);
      
      // Update session metrics
      this.updateSessionMetrics(sessionId, qaRecord);
      
      // Check for quality issues
      this.checkQualityThresholds(qaRecord);
      
      console.log(`QA record created: ${recordId}`);

    } catch (error) {
      console.error('Failed to record translation for QA:', error);
    }
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(sessionId: string, record: QARecord): void {
    let metrics = this.metrics.get(sessionId);
    
    if (!metrics) {
      metrics = {
        sessionId,
        totalTranslations: 0,
        averageConfidence: 0,
        averageLatency: 0,
        qualityScore: 0,
        errorRate: 0,
        speakerAccuracy: 1.0, // Assume perfect for now
        languageDetectionAccuracy: 1.0, // Assume perfect for now
        timestamp: new Date()
      };
    }

    // Update metrics
    const previousTotal = metrics.totalTranslations;
    metrics.totalTranslations++;
    
    // Update averages
    const latency = record.metadata?.latency || 0;
    metrics.averageLatency = (metrics.averageLatency * previousTotal + latency) / metrics.totalTranslations;
    metrics.averageConfidence = (metrics.averageConfidence * previousTotal + record.confidence) / metrics.totalTranslations;
    
    // Calculate quality score
    metrics.qualityScore = this.calculateQualityScore(metrics);
    
    // Update error rate (simplified)
    if (record.confidence < this.config.qualityThresholds.confidence) {
      metrics.errorRate = (metrics.errorRate * previousTotal + 1) / metrics.totalTranslations;
    } else {
      metrics.errorRate = (metrics.errorRate * previousTotal) / metrics.totalTranslations;
    }
    
    metrics.timestamp = new Date();
    this.metrics.set(sessionId, metrics);
  }

  /**
   * Calculate quality score based on various factors
   */
  private calculateQualityScore(metrics: QAMetrics): number {
    let score = 0;
    
    // Confidence score (40% weight)
    const confidenceScore = Math.min(metrics.averageConfidence / this.config.qualityThresholds.confidence, 1);
    score += confidenceScore * 0.4;
    
    // Latency score (30% weight) - lower is better
    const latencyScore = Math.max(0, 1 - (metrics.averageLatency / this.config.qualityThresholds.latency));
    score += latencyScore * 0.3;
    
    // Error rate score (20% weight) - lower is better
    const errorScore = Math.max(0, 1 - metrics.errorRate);
    score += errorScore * 0.2;
    
    // Speaker accuracy (10% weight)
    score += metrics.speakerAccuracy * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check quality thresholds and create alerts
   */
  private checkQualityThresholds(record: QARecord): void {
    if (!this.config.enableAutoReview) {
      return;
    }

    // Low confidence alert
    if (record.confidence < this.config.qualityThresholds.confidence) {
      this.createAlert(
        record.sessionId,
        'low_confidence',
        record.confidence < 0.5 ? 'high' : 'medium',
        `Translation confidence below threshold: ${record.confidence.toFixed(2)}`,
        { recordId: record.id, confidence: record.confidence }
      );
    }

    // High latency alert
    const latency = record.metadata?.latency || 0;
    if (latency > this.config.qualityThresholds.latency) {
      this.createAlert(
        record.sessionId,
        'high_latency',
        latency > 5000 ? 'high' : 'medium',
        `Translation latency above threshold: ${latency}ms`,
        { recordId: record.id, latency }
      );
    }
  }

  /**
   * Create QA alert
   */
  private createAlert(
    sessionId: string,
    type: QAAlert['type'],
    severity: QAAlert['severity'],
    message: string,
    metadata?: Record<string, any>
  ): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: QAAlert = {
      id: alertId,
      sessionId,
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.set(alertId, alert);
    
    console.log(`QA alert created: ${type} (${severity}) - ${message}`);
    
    this.dispatchEvent(new CustomEvent('qa-alert', {
      detail: alert
    }));
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`QA alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(sessionId: string): QAMetrics | null {
    return this.metrics.get(sessionId) || null;
  }

  /**
   * Get all session metrics
   */
  getAllMetrics(): QAMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): QAAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get QA dashboard data
   */
  getDashboard(): QADashboard {
    const allMetrics = this.getAllMetrics();
    const activeAlerts = this.getActiveAlerts();
    
    // Calculate totals
    const totalSessions = allMetrics.length;
    const totalTranslations = allMetrics.reduce((sum, m) => sum + m.totalTranslations, 0);
    const averageQualityScore = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / allMetrics.length
      : 0;

    // Top issues
    const issueCount = new Map<string, number>();
    for (const alert of Array.from(this.alerts.values())) {
      issueCount.set(alert.type, (issueCount.get(alert.type) || 0) + 1);
    }
    
    const topIssues = Array.from(issueCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Performance trends (last 7 days)
    const trends: Array<{ date: Date; score: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayMetrics = allMetrics.filter(m => {
        const metricDate = new Date(m.timestamp);
        metricDate.setHours(0, 0, 0, 0);
        return metricDate.getTime() === date.getTime();
      });
      
      const avgScore = dayMetrics.length > 0
        ? dayMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / dayMetrics.length
        : 0;
      
      trends.push({ date, score: avgScore });
    }

    return {
      totalSessions,
      totalTranslations,
      averageQualityScore,
      activeAlerts: activeAlerts.length,
      topIssues,
      performanceTrends: trends
    };
  }

  /**
   * Export QA data for analysis
   */
  exportQAData(sessionId?: string): {
    records: QARecord[];
    metrics: QAMetrics[];
    alerts: QAAlert[];
  } {
    const records = Array.from(this.records.values())
      .filter(r => !sessionId || r.sessionId === sessionId);
    
    const metrics = Array.from(this.metrics.values())
      .filter(m => !sessionId || m.sessionId === sessionId);
    
    const alerts = Array.from(this.alerts.values())
      .filter(a => !sessionId || a.sessionId === sessionId);

    return { records, metrics, alerts };
  }

  /**
   * Get recording for session
   */
  getRecording(sessionId: string): Blob | null {
    return this.audioRecordings.get(sessionId) || null;
  }

  /**
   * Clean up old data based on retention period
   */
  cleanup(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

    let cleanedRecords = 0;
    let cleanedMetrics = 0;
    let cleanedRecordings = 0;

    // Clean records
    for (const [id, record] of this.records.entries()) {
      if (record.timestamp < cutoffDate) {
        this.records.delete(id);
        cleanedRecords++;
      }
    }

    // Clean metrics
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffDate) {
        this.metrics.delete(id);
        cleanedMetrics++;
      }
    }

    // Clean recordings
    for (const [sessionId] of this.audioRecordings.entries()) {
      // Check if session has any recent records
      const hasRecentRecords = Array.from(this.records.values())
        .some(r => r.sessionId === sessionId && r.timestamp >= cutoffDate);
      
      if (!hasRecentRecords) {
        this.audioRecordings.delete(sessionId);
        cleanedRecordings++;
      }
    }

    console.log(`QA cleanup completed: ${cleanedRecords} records, ${cleanedMetrics} metrics, ${cleanedRecordings} recordings removed`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QAConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('QA recording system config updated:', this.config);
  }

  /**
   * Get system statistics
   */
  getSystemStats(): {
    totalRecords: number;
    totalMetrics: number;
    totalAlerts: number;
    totalRecordings: number;
    storageUsed: number;
    isRecording: boolean;
  } {
    const storageUsed = Array.from(this.audioRecordings.values())
      .reduce((sum, blob) => sum + blob.size, 0);

    return {
      totalRecords: this.records.size,
      totalMetrics: this.metrics.size,
      totalAlerts: this.alerts.size,
      totalRecordings: this.audioRecordings.size,
      storageUsed,
      isRecording: this.isRecording
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clear all data
    this.records.clear();
    this.metrics.clear();
    this.alerts.clear();
    this.audioRecordings.clear();

    console.log('QA recording system disposed');
  }
}

