export type Role = 'employee' | 'customer' | 'unknown';

export interface Chunk {
  ts: number; 
  partial?: string; 
  final?: string;
  diarization?: { 
    speakerId?: string; 
    confidence?: number; 
  };
  voiceprintScore?: number; 
  vad?: { 
    isSpeech: boolean; 
  };
}

export class SpeakerRouter {
  private map: Record<string, Role> = {};
  private latched: Role | null = null;
  private lastEnd = 0;

  constructor(
    private cfg: {
      minTurn: number;    // minimum turn duration in ms
      silence: number;    // silence threshold in ms
      vp: number;         // voiceprint threshold
    },
    private route: (role: Role, text: string) => void,
    private onStatus: (status: string) => void
  ) {}

  label(chunk: Chunk): Role {
    const speakerId = chunk.diarization?.speakerId;
    const confidence = chunk.diarization?.confidence ?? 0;
    const voiceprintScore = chunk.voiceprintScore ?? 0;

    // High voiceprint score indicates employee
    if (voiceprintScore >= this.cfg.vp) {
      return 'employee';
    }

    // Check if we already know this speaker
    if (speakerId && this.map[speakerId]) {
      return this.map[speakerId];
    }

    // New speaker with good diarization confidence
    if (speakerId && confidence >= 0.7) {
      // Assign role based on voiceprint score
      const role = (voiceprintScore >= this.cfg.vp - 0.05) ? 'employee' : 'customer';
      this.map[speakerId] = role;
      console.log(`Mapped speaker ${speakerId} to ${role} (confidence: ${confidence}, voiceprint: ${voiceprintScore})`);
      return role;
    }

    return 'unknown';
  }

  push(chunk: Chunk) {
    const role = this.label(chunk);
    const now = chunk.ts;
    const text = chunk.final ?? chunk.partial ?? '';

    // Update latched speaker if silence threshold exceeded or no current speaker
    if (!this.latched || (now - this.lastEnd) > this.cfg.silence) {
      if (role !== 'unknown') {
        this.latched = role;
      }
      
      const statusMessage = this.latched 
        ? `Listening: ${this.latched}` 
        : 'Listening';
      this.onStatus(statusMessage);
    }

    // Route text to appropriate handler
    if (text && text.trim()) {
      console.log(`Routing text to ${role}: "${text}"`);
      
      if (role === 'employee') {
        this.route('employee', text);
      } else if (role === 'customer') {
        this.route('customer', text);
      } else {
        // For unknown speakers, use the latched role if available
        if (this.latched && this.latched !== 'unknown') {
          this.route(this.latched, text);
        }
      }
    }

    // Update last speech end time
    if (chunk.vad && !chunk.vad.isSpeech) {
      this.lastEnd = now;
    }
  }

  // Reset the router state
  reset() {
    this.map = {};
    this.latched = null;
    this.lastEnd = 0;
    this.onStatus('Ready');
  }

  // Get current speaker mapping for debugging
  getMapping() {
    return { ...this.map };
  }

  // Get current latched speaker
  getCurrentSpeaker() {
    return this.latched;
  }
}

