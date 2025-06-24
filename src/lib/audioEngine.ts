// Audio Engine that wraps Tone.js functionality
import type { Instrument, Effect, Track, Clip } from '../types';

declare global {
  interface Window {
    Tone: any;
    jmonTone: any;
    ToneDAW: any;
  }
}

export class AudioEngine {
  private static instance: AudioEngine;
  private toneContext: any;
  private masterGain: any;
  private instruments: Map<string, any> = new Map();
  private effects: Map<string, any> = new Map();
  private sequences: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeAudio();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private async initializeAudio() {
    try {
      // Initialize Tone.js
      if (typeof window !== 'undefined' && window.Tone) {
        await window.Tone.start();
        this.toneContext = window.Tone.getContext();
        this.masterGain = new window.Tone.Gain(0.8).toDestination();
        
        // Ensure transport is stopped and reset on initialization
        window.Tone.Transport.stop();
        window.Tone.Transport.cancel();
        window.Tone.Transport.seconds = 0;
        
        this.isInitialized = true;
        console.log('Audio engine initialized successfully, transport reset to 0');
      } else {
        console.warn('Tone.js not found. Audio features will be limited.');
      }
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }
  }

  public createInstrument(instrument: Instrument): any {
    if (!this.isInitialized) {
      console.warn('Audio engine not initialized');
      return null;
    }

    try {
      let toneInstrument;
      
      switch (instrument.type) {
        case 'synth':
          toneInstrument = new window.Tone.Synth(instrument.parameters).connect(this.masterGain);
          break;
        case 'sampler':
          toneInstrument = new window.Tone.Sampler(instrument.parameters).connect(this.masterGain);
          break;
        case 'drum':
          toneInstrument = new window.Tone.MembraneSynth(instrument.parameters).connect(this.masterGain);
          break;
        default:
          toneInstrument = new window.Tone.Synth().connect(this.masterGain);
      }

      this.instruments.set(instrument.id, toneInstrument);
      return toneInstrument;
    } catch (error) {
      console.error('Failed to create instrument:', error);
      return null;
    }
  }

  public createEffect(effect: Effect): any {
    if (!this.isInitialized) {
      console.warn('Audio engine not initialized');
      return null;
    }

    try {
      let toneEffect;
      
      switch (effect.type) {
        case 'reverb':
          toneEffect = new window.Tone.Reverb(effect.parameters);
          break;
        case 'delay':
          toneEffect = new window.Tone.Delay(effect.parameters);
          break;
        case 'filter':
          toneEffect = new window.Tone.Filter(effect.parameters);
          break;
        case 'distortion':
          toneEffect = new window.Tone.Distortion(effect.parameters);
          break;
        default:
          toneEffect = new window.Tone.Gain();
      }

      this.effects.set(effect.id, toneEffect);
      return toneEffect;
    } catch (error) {
      console.error('Failed to create effect:', error);
      return null;
    }
  }

  public playNote(instrumentId: string, note: string | number, duration: number = 0.5): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      instrument.triggerAttackRelease(note, duration);
    }
  }

  public scheduleClip(clip: Clip, track: Track): void {
    if (!this.isInitialized) return;

    try {
      console.log('Scheduling clip:', clip.name, 'start:', clip.start, 'with', clip.content.notes?.length, 'notes');
      console.log('Current transport time when scheduling:', window.Tone?.Transport?.seconds, 'Transport state:', window.Tone?.Transport?.state);
      
      if (clip.content.type === 'midi') {
        const instrumentId = track.instrument?.id || `${track.id}-synth`;
        let instrument = this.instruments.get(instrumentId);
        
        // Create instrument if not exists
        if (!instrument) {
          const synthType = track.instrument?.type || 'synth';
          const volume = (track.volume || 0.8) * 0.7;
          
          switch (synthType) {
            case 'membraneSynth':
              instrument = new window.Tone.MembraneSynth({ volume }).connect(this.masterGain);
              break;
            case 'pluckSynth':
              const pluckParams = {
                volume,
                attackNoise: track.instrument?.parameters?.attackNoise || 1,
                dampening: track.instrument?.parameters?.dampening || 4000,
                resonance: track.instrument?.parameters?.resonance || 0.9,
                ...track.instrument?.parameters
              };
              instrument = new window.Tone.PluckSynth(pluckParams).connect(this.masterGain);
              break;
            case 'fmSynth':
              instrument = new window.Tone.FMSynth({ volume }).connect(this.masterGain);
              break;
            case 'amSynth':
              instrument = new window.Tone.AMSynth({ volume }).connect(this.masterGain);
              break;
            default:
              instrument = new window.Tone.Synth({ volume }).connect(this.masterGain);
          }
          
          this.instruments.set(instrumentId, instrument);
          console.log('Created', synthType, 'for track:', track.name, 'volume:', track.volume);
        }
        
        if (instrument && clip.content.notes) {
          // Schedule each note individually at the correct time
          clip.content.notes.forEach((note, index) => {
            // Calculate the absolute time: clip start time + note offset time
            const absoluteTimeInBeats = clip.start + note.time;
            
            console.log('Clip:', clip.name, 'starts at beat:', clip.start, 'Note:', note.note, 'offset:', note.time, 'absolute time:', absoluteTimeInBeats);
            
            console.log('Scheduling note:', note.note, 'at absolute beat:', absoluteTimeInBeats, 'transport position:', window.Tone.Transport.seconds);
            
            // Use Tone.js built-in beat notation for proper scheduling
            // Format: "bars:beats:sixteenths" - we'll convert our decimal beats
            const bars = Math.floor(absoluteTimeInBeats / 4); // 4 beats per bar
            const beats = Math.floor(absoluteTimeInBeats % 4);
            const sixteenths = Math.round((absoluteTimeInBeats % 1) * 4); // Convert decimal to sixteenths
            const toneTimeNotation = `${bars}:${beats}:${sixteenths}`;
            
            console.log('Converted beat', absoluteTimeInBeats, 'to Tone notation:', toneTimeNotation);
            
            // Schedule using Tone's time notation
            window.Tone.Transport.schedule((time: number) => {
              console.log('Playing note:', note.note, 'at transport time:', time, 'seconds (scheduled at:', toneTimeNotation, ')');
              try {
                // Use note duration in seconds based on current BPM
                const currentBPM = window.Tone.Transport.bpm.value;
                const durationInSeconds = note.duration * (60 / currentBPM);
                instrument.triggerAttackRelease(note.note, durationInSeconds, time, note.velocity || 0.8);
              } catch (error) {
                console.warn('Failed to trigger note:', note.note, error);
              }
            }, toneTimeNotation);
          });
        }
      } else if (clip.content.type === 'audio') {
        // Handle audio clips
        if (clip.content.audioBuffer) {
          const player = new window.Tone.Player(clip.content.audioBuffer).connect(this.masterGain);
          const startTime = window.Tone.Time(clip.start, 'n').toSeconds();
          window.Tone.Transport.schedule((time: number) => {
            player.start(time);
          }, startTime);
          this.sequences.set(clip.id, player);
        }
      }
    } catch (error) {
      console.error('Failed to schedule clip:', error);
    }
  }

  public startTransport(): void {
    if (this.isInitialized && window.Tone) {
      window.Tone.Transport.start();
    }
  }

  public stopTransport(): void {
    if (this.isInitialized && window.Tone) {
      // Force complete transport reset with multiple approaches
      window.Tone.Transport.stop();
      window.Tone.Transport.cancel(); // Cancel all scheduled events
      
      // Try multiple reset methods to ensure it works
      try {
        window.Tone.Transport.position = "0:0:0";
        window.Tone.Transport.seconds = 0;
        window.Tone.Transport.ticks = 0;
      } catch (e) {
        console.warn('Some transport reset methods failed:', e);
      }
      
      // Clear any existing loop state to prevent scheduling conflicts
      window.Tone.Transport.loop = false;
      window.Tone.Transport.loopStart = 0;
      window.Tone.Transport.loopEnd = 1;
      
      console.log('Transport stopped and reset to 0, actual position:', window.Tone.Transport.seconds);
    }
  }

  public pauseTransport(): void {
    if (this.isInitialized && window.Tone) {
      console.log('Pausing transport at:', window.Tone.Transport.seconds);
      window.Tone.Transport.pause();
    }
  }

  public setTempo(bpm: number): void {
    if (this.isInitialized && window.Tone) {
      window.Tone.Transport.bpm.value = bpm;
    }
  }

  public setPosition(time: number): void {
    if (this.isInitialized && window.Tone) {
      window.Tone.Transport.seconds = time;
    }
  }

  public getCurrentTime(): number {
    if (this.isInitialized && window.Tone) {
      return window.Tone.Transport.seconds;
    }
    return 0;
  }

  public processJmonFile(jmonData: any): any {
    if (typeof window !== 'undefined' && window.jmonTone) {
      try {
        return window.jmonTone.processJmonData(jmonData);
      } catch (error) {
        console.error('Failed to process JMON file:', error);
        return null;
      }
    }
    return null;
  }

  public dispose(): void {
    // Clean up all resources
    this.instruments.forEach(instrument => {
      if (instrument.dispose) {
        instrument.dispose();
      }
    });
    
    this.effects.forEach(effect => {
      if (effect.dispose) {
        effect.dispose();
      }
    });
    
    this.sequences.forEach(sequence => {
      if (sequence.dispose) {
        sequence.dispose();
      }
    });

    this.instruments.clear();
    this.effects.clear();
    this.sequences.clear();
  }
}

// Export singleton instance
export const audioEngine = AudioEngine.getInstance();