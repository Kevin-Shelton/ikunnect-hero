export type Lang = string;

export interface DiarizationEvt { 
  speakerId?: string; 
  confidence?: number; 
}

export interface VadEvt { 
  isSpeech: boolean; 
}

export interface StreamChunk {
  ts: number;               // ms timestamp
  partial?: string;
  final?: string;
  diarization?: DiarizationEvt;
  voiceprintScore?: number;  // similarity to employee (0..1)
  vad?: VadEvt;
}

export interface VerbumHandle {
  enrollEmployeeVoice(samplePcm: Float32Array): Promise<{ embedding: number[] }>;
  startStream(opts: { diarization: true; vad: true; echoCancellation: true },
              onChunk: (c: StreamChunk)=>void): Promise<void>;
  stopStream(): Promise<void>;
  synthesize(text: string, lang: Lang): Promise<string>; // returns blob URL
  dispose(): void;
}

// POC stub — wire to real Verbum later
export async function createVerbumHandle(): Promise<VerbumHandle> {
  let isStreaming = false;
  let streamInterval: NodeJS.Timeout | null = null;
  let chunkCallback: ((c: StreamChunk) => void) | null = null;

  return {
    async enrollEmployeeVoice(_samplePcm: Float32Array) { 
      console.log('Employee voice enrolled (POC stub)');
      return { embedding: [0.1, 0.2, 0.3] }; 
    },
    
    async startStream(opts, onChunk) {
      console.log('Starting Verbum stream with options:', opts);
      isStreaming = true;
      chunkCallback = onChunk;
      
      // Simulate streaming chunks for demo
      let counter = 0;
      streamInterval = setInterval(() => {
        if (!isStreaming || !chunkCallback) return;
        
        counter++;
        const isEmployee = Math.random() > 0.6; // 40% employee, 60% customer
        const isSpeech = Math.random() > 0.3; // 70% speech activity
        
        if (isSpeech) {
          const sampleTexts = isEmployee 
            ? ['Hello, how can I help you?', 'What seems to be the problem?', 'I understand your concern.']
            : ['Hola, necesito ayuda.', 'No entiendo muy bien.', 'Gracias por su ayuda.'];
          
          const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
          
          // Send partial chunk first
          chunkCallback({
            ts: Date.now(),
            partial: text.substring(0, Math.floor(text.length * 0.7)),
            diarization: {
              speakerId: isEmployee ? 'speaker_1' : 'speaker_2',
              confidence: 0.8 + Math.random() * 0.2
            },
            voiceprintScore: isEmployee ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.4,
            vad: { isSpeech: true }
          });
          
          // Send final chunk after delay
          setTimeout(() => {
            if (chunkCallback) {
              chunkCallback({
                ts: Date.now(),
                final: text,
                diarization: {
                  speakerId: isEmployee ? 'speaker_1' : 'speaker_2',
                  confidence: 0.8 + Math.random() * 0.2
                },
                voiceprintScore: isEmployee ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.4,
                vad: { isSpeech: false }
              });
            }
          }, 1000 + Math.random() * 2000);
        }
      }, 3000 + Math.random() * 4000); // Random intervals between 3-7 seconds
    },
    
    async stopStream() {
      console.log('Stopping Verbum stream');
      isStreaming = false;
      if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
      }
      chunkCallback = null;
    },
    
    async synthesize(text: string, _lang: Lang) {
      console.log('Synthesizing text:', text);
      // Create a simple audio blob for demo (silent audio)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
      
      // Convert to blob URL
      const blob = new Blob([new TextEncoder().encode(text)], { type: 'application/octet-stream' });
      return URL.createObjectURL(blob);
    },
    
    dispose() {
      console.log('Disposing Verbum handle');
      isStreaming = false;
      if (streamInterval) {
        clearInterval(streamInterval);
      }
      chunkCallback = null;
    }
  };
}

