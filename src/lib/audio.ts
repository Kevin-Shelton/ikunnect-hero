// Audio Management for iKunnect - Complete Implementation
// Handles TTS playback 
// ducking, and audio control during live conversations

interface AudioState {
  currentAudio: HTMLAudioElement | null;
  originalVolume: number;
  isDucked: boolean;
  isPlaying: boolean;
  queue: AudioQueueItem[];
  settings: AudioSettings;
}

interface AudioQueueItem {
  id: string;
  url: string;
  priority: 'low' | 'normal' | 'high';
  language?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface AudioSettings {
  masterVolume: number;
  duckingVolume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  resumeDelay: number;
  enableSpatialAudio: boolean;
}

// Global audio state
let audioState: AudioState = {
  currentAudio: null,
  originalVolume: 0.9,
  isDucked: false,
  isPlaying: false,
  queue: [],
  settings: {
    masterVolume: 0.9,
    duckingVolume: 0.2,
    fadeInDuration: 200,
    fadeOutDuration: 150,
    resumeDelay: 600,
    enableSpatialAudio: false
  }
};

// Resume timeout reference
let resumeTimeout: NodeJS.Timeout | null = null;

// Audio context for advanced features
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;

// Initialize audio context for advanced features
export function initializeAudioContext(): void {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = audioState.settings.masterVolume;
    }
  } catch (error) {
    console.warn('AudioContext not supported:', error);
  }
}

// Main play function with enhanced features
export async function play(url: string, options: Partial<AudioQueueItem> = {}): Promise<void> {
  try {
    console.log('Playing audio:', url, options);

    // Stop any currently playing audio
    await stop();

    // Create new audio element
    const audio = new Audio(url);
    audioState.currentAudio = audio;
    audioState.isPlaying = true;

    // Configure audio properties
    audio.volume = audioState.isDucked ? audioState.settings.duckingVolume : audioState.settings.masterVolume;
    audio.preload = 'auto';

    // Add comprehensive event listeners
    setupAudioEventListeners(audio, options);

    // Apply spatial audio if enabled
    if (audioState.settings.enableSpatialAudio && audioContext && gainNode) {
      const source = audioContext.createMediaElementSource(audio);
      source.connect(gainNode);
    }

    // Fade in effect
    if (audioState.settings.fadeInDuration > 0) {
      await fadeIn(audio, audioState.settings.fadeInDuration);
    }

    // Start playback
    await audio.play();
    console.log('Audio playback started successfully');

  } catch (error) {
    console.error('Failed to play audio:', error);
    audioState.currentAudio = null;
    audioState.isPlaying = false;
    
    if (options.onError) {
      options.onError(error as Error);
    }
    
    throw error;
  }
}

// Setup comprehensive event listeners for audio element
function setupAudioEventListeners(audio: HTMLAudioElement, options: Partial<AudioQueueItem>): void {
  // Playback ended
  audio.addEventListener('ended', () => {
    console.log('Audio playback ended');
    cleanup();
    
    if (options.onComplete) {
      options.onComplete();
    }
    
    // Process next item in queue
    processQueue();
  });

  // Playback error
  audio.addEventListener('error', (e) => {
    console.error('Audio playback error:', e);
    const error = new Error(`Audio playback failed: ${audio.error?.message || 'Unknown error'}`);
    cleanup();
    
    if (options.onError) {
      options.onError(error);
    }
  });

  // Loading events
  audio.addEventListener('loadstart', () => {
    console.log('Audio loading started');
  });

  audio.addEventListener('canplaythrough', () => {
    console.log('Audio can play through');
  });

  // Playback events
  audio.addEventListener('play', () => {
    console.log('Audio play event fired');
  });

  audio.addEventListener('pause', () => {
    console.log('Audio pause event fired');
  });

  // Volume change
  audio.addEventListener('volumechange', () => {
    console.log('Audio volume changed to:', audio.volume);
  });
}

// Duck audio volume during speech
export function duck(): void {
  if (audioState.currentAudio && !audioState.isDucked) {
    console.log('Ducking audio volume');
    audioState.originalVolume = audioState.currentAudio.volume;
    
    // Smooth volume transition
    fadeToVolume(audioState.currentAudio, audioState.settings.duckingVolume, audioState.settings.fadeOutDuration);
    audioState.isDucked = true;

    // Clear any pending resume
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }
  }
}

// Resume audio volume after speech ends
export function resumeAfter(ms: number): void {
  if (audioState.currentAudio && audioState.isDucked) {
    console.log(`Scheduling audio volume resume after ${ms}ms`);
    
    // Clear any existing resume timeout
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
    }

    resumeTimeout = setTimeout(() => {
      if (audioState.currentAudio && audioState.isDucked) {
        console.log('Resuming audio volume');
        
        // Smooth volume transition back
        fadeToVolume(audioState.currentAudio, audioState.originalVolume, audioState.settings.fadeInDuration);
        audioState.isDucked = false;
        
        // If audio was paused during ducking, resume playback
        if (audioState.currentAudio.paused && audioState.isPlaying) {
          audioState.currentAudio.play().catch((error) => {
            console.error('Failed to resume audio playback:', error);
          });
        }
      }
      resumeTimeout = null;
    }, ms);
  }
}

// Immediate resume (for manual control)
export function resume(): void {
  if (resumeTimeout) {
    clearTimeout(resumeTimeout);
    resumeTimeout = null;
  }
  
  if (audioState.currentAudio && audioState.isDucked) {
    console.log('Immediately resuming audio volume');
    fadeToVolume(audioState.currentAudio, audioState.originalVolume, audioState.settings.fadeInDuration);
    audioState.isDucked = false;
  }
}

// Stop current audio playback
export function stop(): Promise<void> {
  return new Promise((resolve) => {
    if (audioState.currentAudio) {
      console.log('Stopping audio playback');
      
      const audio = audioState.currentAudio;
      
      // Fade out before stopping
      if (audioState.settings.fadeOutDuration > 0 && !audio.paused) {
        fadeToVolume(audio, 0, audioState.settings.fadeOutDuration).then(() => {
          finishStop(audio);
          resolve();
        });
      } else {
        finishStop(audio);
        resolve();
      }
    } else {
      resolve();
    }
  });
}

// Complete the stop operation
function finishStop(audio: HTMLAudioElement): void {
  audio.pause();
  audio.currentTime = 0;
  
  // Clean up object URL if it was created
  if (audio.src.startsWith('blob:')) {
    URL.revokeObjectURL(audio.src);
  }
  
  cleanup();
}

// Pause current audio
export function pause(): void {
  if (audioState.currentAudio && !audioState.currentAudio.paused) {
    console.log('Pausing audio playback');
    audioState.currentAudio.pause();
  }
}

// Resume paused audio
export function unpause(): void {
  if (audioState.currentAudio && audioState.currentAudio.paused && audioState.isPlaying) {
    console.log('Unpausing audio playback');
    audioState.currentAudio.play().catch((error) => {
      console.error('Failed to unpause audio:', error);
    });
  }
}

// Set master volume
export function setVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  audioState.settings.masterVolume = clampedVolume;
  
  if (audioState.currentAudio && !audioState.isDucked) {
    audioState.currentAudio.volume = clampedVolume;
  }
  
  if (gainNode) {
    gainNode.gain.value = clampedVolume;
  }
  
  console.log('Master volume set to:', clampedVolume);
}

// Get current volume
export function getVolume(): number {
  return audioState.settings.masterVolume;
}

// Check if audio is currently playing
export function isPlaying(): boolean {
  return audioState.isPlaying && audioState.currentAudio && !audioState.currentAudio.paused;
}

// Get current audio volume (actual, not master)
export function getCurrentVolume(): number {
  return audioState.currentAudio ? audioState.currentAudio.volume : 0;
}

// Get current playback position
export function getCurrentTime(): number {
  return audioState.currentAudio ? audioState.currentAudio.currentTime : 0;
}

// Get audio duration
export function getDuration(): number {
  return audioState.currentAudio ? audioState.currentAudio.duration : 0;
}

// Seek to specific time
export function seekTo(time: number): void {
  if (audioState.currentAudio) {
    audioState.currentAudio.currentTime = Math.max(0, Math.min(time, audioState.currentAudio.duration));
  }
}

// Queue management
export function addToQueue(item: AudioQueueItem): void {
  console.log('Adding to audio queue:', item.id);
  audioState.queue.push(item);
  
  // Sort by priority
  audioState.queue.sort((a, b) => {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  // If nothing is playing, start processing queue
  if (!audioState.isPlaying) {
    processQueue();
  }
}

// Process audio queue
function processQueue(): void {
  if (audioState.queue.length > 0 && !audioState.isPlaying) {
    const nextItem = audioState.queue.shift();
    if (nextItem) {
      console.log('Processing queued audio:', nextItem.id);
      play(nextItem.url, nextItem).catch((error) => {
        console.error('Failed to play queued audio:', error);
        processQueue(); // Try next item
      });
    }
  }
}

// Clear audio queue
export function clearQueue(): void {
  console.log('Clearing audio queue');
  audioState.queue = [];
}

// Fade audio to specific volume
function fadeToVolume(audio: HTMLAudioElement, targetVolume: number, duration: number): Promise<void> {
  return new Promise((resolve) => {
    if (duration <= 0) {
      audio.volume = targetVolume;
      resolve();
      return;
    }

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = Math.max(10, duration / 10); // At least 10 steps
    const stepSize = volumeDiff / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = startVolume + (stepSize * currentStep);
      
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
        resolve();
      } else {
        audio.volume = Math.max(0, Math.min(1, newVolume));
      }
    }, stepDuration);
  });
}

// Fade in effect
function fadeIn(audio: HTMLAudioElement, duration: number): Promise<void> {
  const targetVolume = audio.volume;
  audio.volume = 0;
  return fadeToVolume(audio, targetVolume, duration);
}

// Update audio settings
export function updateSettings(newSettings: Partial<AudioSettings>): void {
  audioState.settings = { ...audioState.settings, ...newSettings };
  console.log('Audio settings updated:', audioState.settings);
  
  // Apply master volume change immediately
  if (newSettings.masterVolume !== undefined) {
    setVolume(newSettings.masterVolume);
  }
}

// Get current audio settings
export function getSettings(): AudioSettings {
  return { ...audioState.settings };
}

// Clean up audio state
function cleanup(): void {
  audioState.currentAudio = null;
  audioState.isPlaying = false;
  audioState.isDucked = false;
  
  if (resumeTimeout) {
    clearTimeout(resumeTimeout);
    resumeTimeout = null;
  }
}

// Complete cleanup for component unmount
export function cleanupAll(): void {
  console.log('Performing complete audio cleanup');
  
  stop();
  clearQueue();
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    gainNode = null;
  }
  
  // Reset state
  audioState = {
    currentAudio: null,
    originalVolume: 0.9,
    isDucked: false,
    isPlaying: false,
    queue: [],
    settings: {
      masterVolume: 0.9,
      duckingVolume: 0.2,
      fadeInDuration: 200,
      fadeOutDuration: 150,
      resumeDelay: 600,
      enableSpatialAudio: false
    }
  };
}

// Legacy cleanup function for backward compatibility
export function cleanup(): void {
  cleanupAll();
}

// Audio utilities
export const AudioUtils = {
  // Convert blob to audio URL
  createAudioUrl: (blob: Blob): string => {
    return URL.createObjectURL(blob);
  },
  
  // Revoke audio URL
  revokeAudioUrl: (url: string): void => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  },
  
  // Check audio format support
  canPlayType: (mimeType: string): boolean => {
    const audio = new Audio();
    return audio.canPlayType(mimeType) !== '';
  },
  
  // Get supported audio formats
  getSupportedFormats: (): string[] => {
    const audio = new Audio();
    const formats = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/aac'
    ];
    
    return formats.filter(format => audio.canPlayType(format) !== '');
  }
};

// Export default object with all functions
export default {
  play,
  duck,
  resume,
  resumeAfter,
  stop,
  pause,
  unpause,
  setVolume,
  getVolume,
  isPlaying,
  getCurrentVolume,
  getCurrentTime,
  getDuration,
  seekTo,
  addToQueue,
  clearQueue,
  updateSettings,
  getSettings,
  initializeAudioContext,
  cleanup: cleanupAll,
  AudioUtils
};

