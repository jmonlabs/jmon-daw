export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  armed: boolean;
  color: string;
  clips: Clip[];
  instrument?: Instrument;
  effects: Effect[];
}

export interface Clip {
  id: string;
  name: string;
  start: number;
  end: number;
  duration: number;
  trackId: string;
  type: 'audio' | 'midi';
  content: AudioClipContent | MidiClipContent;
  color: string;
}

export interface AudioClipContent {
  type: 'audio';
  audioBuffer?: AudioBuffer;
  url?: string;
  waveform?: number[];
}

export interface MidiClipContent {
  type: 'midi';
  notes: MidiNote[];
  tempo?: number;
  duration?: number;
}

export interface MidiNote {
  note: string | number;
  time: number;
  duration: number;
  velocity: number;
}

export interface Instrument {
  id: string;
  name: string;
  type: 'synth' | 'sampler' | 'drum' | 'custom';
  engine: string;
  parameters: Record<string, any>;
  toneInstance?: any;
}

export interface Effect {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
  toneInstance?: any;
}

export interface Project {
  id: string;
  name: string;
  tempo: number;
  timeSignature: [number, number];
  tracks: Track[];
  masterVolume: number;
  masterPan: number;
  masterEffects: Effect[];
}

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  currentTime: number;
  loopStart: number;
  loopEnd: number;
  tempo: number;
  timeSignature: [number, number];
}

export interface ViewState {
  zoom: number;
  scrollX: number;
  scrollY: number;
  selectedTrackIds: string[];
  selectedClipIds: string[];
  viewMode: 'arrange' | 'mix' | 'edit';
  snapToGrid: boolean;
  gridSize: number;
}