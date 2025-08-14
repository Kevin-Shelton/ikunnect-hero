/**
 * Voice Print Matching System
 * Handles voice print comparison, storage, and matching algorithms
 */

import { VoicePrint } from '../../types';

export interface MatchResult {
  userId: string;
  confidence: number;
  voicePrint: VoicePrint;
  matchTime: number;
}

export interface MatchingConfig {
  confidenceThreshold: number;
  maxCandidates: number;
  enableFuzzyMatching: boolean;
  cacheResults: boolean;
  matchingAlgorithm: 'cosine' | 'euclidean' | 'hybrid';
}

export interface VoicePrintDatabase {
  voicePrints: Map<string, VoicePrint>;
  index: Map<string, string[]>; // Feature index for fast lookup
  lastUpdated: Date;
}

export class VoicePrintMatcher {
  private config: MatchingConfig;
  private database: VoicePrintDatabase;
  private matchCache = new Map<string, MatchResult>();
  private featureWeights: Float32Array;

  constructor(config: Partial<MatchingConfig> = {}) {
    this.config = {
      confidenceThreshold: 0.65,
      maxCandidates: 5,
      enableFuzzyMatching: true,
      cacheResults: true,
      matchingAlgorithm: 'hybrid',
      ...config
    };

    this.database = {
      voicePrints: new Map(),
      index: new Map(),
      lastUpdated: new Date()
    };

    // Initialize feature weights for hybrid matching
    this.featureWeights = this.initializeFeatureWeights();
  }

  /**
   * Add voice print to database
   */
  addVoicePrint(voicePrint: VoicePrint): void {
    this.database.voicePrints.set(voicePrint.userId, voicePrint);
    this.updateFeatureIndex(voicePrint);
    this.database.lastUpdated = new Date();
    
    // Clear cache when database changes
    if (this.config.cacheResults) {
      this.matchCache.clear();
    }

    console.log(`Voice print added to database: ${voicePrint.userId}`);
  }

  /**
   * Remove voice print from database
   */
  removeVoicePrint(userId: string): boolean {
    const removed = this.database.voicePrints.delete(userId);
    
    if (removed) {
      this.removeFromFeatureIndex(userId);
      this.database.lastUpdated = new Date();
      
      // Clear cache
      if (this.config.cacheResults) {
        this.matchCache.clear();
      }
      
      console.log(`Voice print removed from database: ${userId}`);
    }
    
    return removed;
  }

  /**
   * Find best matching voice print
   */
  findBestMatch(features: Float32Array): MatchResult | null {
    const startTime = Date.now();
    
    // Check cache first
    if (this.config.cacheResults) {
      const cacheKey = this.generateCacheKey(features);
      const cached = this.matchCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get candidate voice prints
    const candidates = this.getCandidates(features);
    
    if (candidates.length === 0) {
      return null;
    }

    // Find best match among candidates
    let bestMatch: MatchResult | null = null;
    
    for (const voicePrint of candidates) {
      const confidence = this.calculateConfidence(features, voicePrint.features);
      
      if (confidence >= this.config.confidenceThreshold && 
          (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          userId: voicePrint.userId,
          confidence,
          voicePrint,
          matchTime: Date.now() - startTime
        };
      }
    }

    // Cache result
    if (bestMatch && this.config.cacheResults) {
      const cacheKey = this.generateCacheKey(features);
      this.matchCache.set(cacheKey, bestMatch);
      
      // Limit cache size
      if (this.matchCache.size > 100) {
        const oldestKey = this.matchCache.keys().next().value;
        this.matchCache.delete(oldestKey);
      }
    }

    return bestMatch;
  }

  /**
   * Find multiple matching candidates
   */
  findMatches(features: Float32Array, maxResults: number = this.config.maxCandidates): MatchResult[] {
    const startTime = Date.now();
    const candidates = this.getCandidates(features);
    const matches: MatchResult[] = [];

    for (const voicePrint of candidates) {
      const confidence = this.calculateConfidence(features, voicePrint.features);
      
      if (confidence >= this.config.confidenceThreshold) {
        matches.push({
          userId: voicePrint.userId,
          confidence,
          voicePrint,
          matchTime: Date.now() - startTime
        });
      }
    }

    // Sort by confidence (descending) and limit results
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, maxResults);
  }

  /**
   * Calculate confidence score between two feature vectors
   */
  private calculateConfidence(features1: Float32Array, features2: Float32Array): number {
    switch (this.config.matchingAlgorithm) {
      case 'cosine':
        return this.cosineSimilarity(features1, features2);
      case 'euclidean':
        return this.euclideanSimilarity(features1, features2);
      case 'hybrid':
        return this.hybridSimilarity(features1, features2);
      default:
        return this.cosineSimilarity(features1, features2);
    }
  }

  /**
   * Cosine similarity calculation
   */
  private cosineSimilarity(features1: Float32Array, features2: Float32Array): number {
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

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Euclidean similarity calculation (inverted distance)
   */
  private euclideanSimilarity(features1: Float32Array, features2: Float32Array): number {
    if (features1.length !== features2.length) {
      return 0;
    }

    let sumSquaredDiff = 0;
    for (let i = 0; i < features1.length; i++) {
      const diff = features1[i] - features2[i];
      sumSquaredDiff += diff * diff;
    }

    const distance = Math.sqrt(sumSquaredDiff);
    // Convert distance to similarity (0-1 range)
    return 1 / (1 + distance);
  }

  /**
   * Hybrid similarity using weighted combination
   */
  private hybridSimilarity(features1: Float32Array, features2: Float32Array): number {
    const cosine = this.cosineSimilarity(features1, features2);
    const euclidean = this.euclideanSimilarity(features1, features2);
    
    // Weighted combination with feature-specific weights
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < Math.min(features1.length, this.featureWeights.length); i++) {
      const weight = this.featureWeights[i];
      const localSimilarity = 1 - Math.abs(features1[i] - features2[i]);
      weightedSum += weight * localSimilarity;
      totalWeight += weight;
    }
    
    const weightedSimilarity = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Combine all three measures
    return (cosine * 0.4) + (euclidean * 0.3) + (weightedSimilarity * 0.3);
  }

  /**
   * Get candidate voice prints for matching
   */
  private getCandidates(features: Float32Array): VoicePrint[] {
    // For now, return all voice prints
    // In production, use feature indexing for faster candidate selection
    return Array.from(this.database.voicePrints.values());
  }

  /**
   * Update feature index for fast lookup
   */
  private updateFeatureIndex(voicePrint: VoicePrint): void {
    // Simplified indexing - in production, use more sophisticated indexing
    const featureHash = this.hashFeatures(voicePrint.features);
    
    if (!this.database.index.has(featureHash)) {
      this.database.index.set(featureHash, []);
    }
    
    this.database.index.get(featureHash)!.push(voicePrint.userId);
  }

  /**
   * Remove from feature index
   */
  private removeFromFeatureIndex(userId: string): void {
    for (const [hash, userIds] of this.database.index.entries()) {
      const index = userIds.indexOf(userId);
      if (index !== -1) {
        userIds.splice(index, 1);
        if (userIds.length === 0) {
          this.database.index.delete(hash);
        }
        break;
      }
    }
  }

  /**
   * Generate hash for features (simplified)
   */
  private hashFeatures(features: Float32Array): string {
    // Simple hash based on first few features
    const hashFeatures = features.slice(0, 8);
    return Array.from(hashFeatures)
      .map(f => Math.round(f * 100))
      .join(',');
  }

  /**
   * Generate cache key for features
   */
  private generateCacheKey(features: Float32Array): string {
    // Use a subset of features for cache key to allow some variation
    const keyFeatures = features.slice(0, 16);
    return Array.from(keyFeatures)
      .map(f => Math.round(f * 10))
      .join(',');
  }

  /**
   * Initialize feature weights for hybrid matching
   */
  private initializeFeatureWeights(): Float32Array {
    const weights = new Float32Array(128); // Assuming 128 features
    
    // Initialize with equal weights, but emphasize certain frequency ranges
    for (let i = 0; i < weights.length; i++) {
      if (i < 32) {
        // Lower frequencies - important for speaker identification
        weights[i] = 1.2;
      } else if (i < 64) {
        // Mid frequencies - most important
        weights[i] = 1.5;
      } else if (i < 96) {
        // Higher frequencies - less important but still useful
        weights[i] = 1.0;
      } else {
        // Very high frequencies - least important
        weights[i] = 0.8;
      }
    }
    
    return weights;
  }

  /**
   * Update feature weights based on matching performance
   */
  updateFeatureWeights(weights: Float32Array): void {
    if (weights.length === this.featureWeights.length) {
      this.featureWeights = new Float32Array(weights);
      console.log('Feature weights updated');
    }
  }

  /**
   * Validate voice print quality
   */
  validateVoicePrint(voicePrint: VoicePrint): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check feature vector length
    if (voicePrint.features.length === 0) {
      issues.push('Empty feature vector');
    } else if (voicePrint.features.length < 64) {
      issues.push('Feature vector too short');
    }

    // Check for NaN or infinite values
    for (let i = 0; i < voicePrint.features.length; i++) {
      if (!isFinite(voicePrint.features[i])) {
        issues.push('Invalid feature values detected');
        break;
      }
    }

    // Check confidence score
    if (voicePrint.confidence < 0.3) {
      issues.push('Voice print confidence too low');
    }

    // Check for zero variance (all features the same)
    const firstValue = voicePrint.features[0];
    const hasVariance = voicePrint.features.some(f => Math.abs(f - firstValue) > 0.001);
    if (!hasVariance) {
      issues.push('No variance in feature vector');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get database statistics
   */
  getDatabaseStats(): {
    totalVoicePrints: number;
    indexSize: number;
    cacheSize: number;
    lastUpdated: Date;
    averageConfidence: number;
  } {
    const voicePrints = Array.from(this.database.voicePrints.values());
    const averageConfidence = voicePrints.length > 0 
      ? voicePrints.reduce((sum, vp) => sum + vp.confidence, 0) / voicePrints.length
      : 0;

    return {
      totalVoicePrints: this.database.voicePrints.size,
      indexSize: this.database.index.size,
      cacheSize: this.matchCache.size,
      lastUpdated: this.database.lastUpdated,
      averageConfidence
    };
  }

  /**
   * Export voice prints for backup
   */
  exportVoicePrints(): VoicePrint[] {
    return Array.from(this.database.voicePrints.values());
  }

  /**
   * Import voice prints from backup
   */
  importVoicePrints(voicePrints: VoicePrint[]): { imported: number; errors: number } {
    let imported = 0;
    let errors = 0;

    for (const voicePrint of voicePrints) {
      try {
        const validation = this.validateVoicePrint(voicePrint);
        if (validation.valid) {
          this.addVoicePrint(voicePrint);
          imported++;
        } else {
          console.warn(`Invalid voice print for ${voicePrint.userId}:`, validation.issues);
          errors++;
        }
      } catch (error) {
        console.error(`Failed to import voice print for ${voicePrint.userId}:`, error);
        errors++;
      }
    }

    console.log(`Voice print import complete: ${imported} imported, ${errors} errors`);
    return { imported, errors };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.database.voicePrints.clear();
    this.database.index.clear();
    this.matchCache.clear();
    this.database.lastUpdated = new Date();
    console.log('Voice print database cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MatchingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Clear cache if caching was disabled
    if (!this.config.cacheResults) {
      this.matchCache.clear();
    }
    
    console.log('Voice print matcher config updated:', this.config);
  }
}

