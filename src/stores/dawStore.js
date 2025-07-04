import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { demoComposition } from '../data/demoComposition';
import { audioEngine } from '../utils/audioEngine';

// Create signals for reactive state
const [isPlaying, setIsPlaying] = createSignal(false);
const [bpm, setBpm] = createSignal(120);
const [currentTime, setCurrentTime] = createSignal(0);
const [isLooping, setIsLooping] = createSignal(false);
const [loopStart, setLoopStart] = createSignal(0);
const [loopEnd, setLoopEnd] = createSignal(16);
const [timelineZoom, setTimelineZoom] = createSignal(1);
const [verticalZoom, setVerticalZoom] = createSignal(1);
const [timelineScroll, setTimelineScroll] = createSignal(0);
const [snapEnabled, setSnapEnabled] = createSignal(true);
const [snapValue, setSnapValue] = createSignal('1/16');
const [selectedTrack, setSelectedTrack] = createSignal(null);
const [selectedNotes, setSelectedNotes] = createSignal([]);
const [leftSidebarOpen, setLeftSidebarOpen] = createSignal(false);
const [rightSidebarOpen, setRightSidebarOpen] = createSignal(true);
const [jmonEditorOpen, setJmonEditorOpen] = createSignal(false);
const [trackInfoOpen, setTrackInfoOpen] = createSignal(false);
const [masterBusOpen, setMasterBusOpen] = createSignal(false);
const [selectedEffect, setSelectedEffect] = createSignal(null);
const [effectParams, setEffectParams] = createSignal({});

// Create stores for complex objects
const [tracks, setTracks] = createStore([]);
const [jmonData, setJmonData] = createStore(JSON.parse(JSON.stringify(demoComposition)));

// Default parameters for different effect types
const getDefaultParams = (type, name) => {
  if (type === 'synth') {
    switch (name) {
      case 'AMSynth':
        return { harmonicity: 3, detune: 0, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 } };
      case 'FMSynth':
        return { harmonicity: 3, modulationIndex: 10, detune: 0, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 } };
      case 'MonoSynth':
        return { frequency: 440, detune: 0, oscillator: { type: 'sawtooth' }, filter: { Q: 6, type: 'lowpass', rolloff: -24 } };
      default:
        return { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 } };
    }
  } else {
    switch (name) {
      case 'Reverb':
        return { roomSize: 0.7, decay: 2.5, wet: 0.5 };
      case 'Delay':
        return { delayTime: 0.25, feedback: 0.3, wet: 0.5 };
      case 'Filter':
        return { frequency: 1000, Q: 1, type: 'lowpass', wet: 0.5 };
      case 'Chorus':
        return { frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.5 };
      case 'Distortion':
        return { distortion: 0.4, oversample: '4x', wet: 0.5 };
      case 'Compressor':
        return { threshold: -24, ratio: 12, attack: 0.003, release: 0.25, wet: 0.5 };
      default:
        return { wet: 0.5 };
    }
  }
};

// Create the store object with getters and actions
export const dawStore = {
  // Getters
  get isPlaying() { return isPlaying(); },
  get bpm() { return bpm(); },
  get currentTime() { return currentTime(); },
  get isLooping() { return isLooping(); },
  get loopStart() { return loopStart(); },
  get loopEnd() { return loopEnd(); },
  get timelineZoom() { return timelineZoom(); },
  get verticalZoom() { return verticalZoom(); },
  get timelineScroll() { return timelineScroll(); },
  get snapEnabled() { return snapEnabled(); },
  get snapValue() { return snapValue(); },
  get tracks() { return tracks; },
  get selectedTrack() { return selectedTrack(); },
  get selectedNotes() { return selectedNotes(); },
  get leftSidebarOpen() { return leftSidebarOpen(); },
  get rightSidebarOpen() { return rightSidebarOpen(); },
  get jmonEditorOpen() { return jmonEditorOpen(); },
  get trackInfoOpen() { return trackInfoOpen(); },
  get masterBusOpen() { return masterBusOpen(); },
  get selectedEffect() { return selectedEffect(); },
  get effectParams() { return effectParams(); },
  get jmonData() { return jmonData; },

  // Actions
  setPlaying: (playing) => {
    setIsPlaying(playing);
    if (playing) {
      audioEngine.play();
    } else {
      audioEngine.pause();
    }
  },
  setBpm: (newBpm) => {
    setBpm(newBpm);
    setJmonData('bpm', newBpm);
    if (audioEngine.isInitialized) {
      audioEngine.setBpm(newBpm);
    }
  },
  setCurrentTime: (time) => setCurrentTime(time),
  setLooping: (looping) => setIsLooping(looping),
  setLoopStart: (start) => setLoopStart(start),
  setLoopEnd: (end) => setLoopEnd(end),
  
  setTimelineZoom: (zoom) => setTimelineZoom(zoom),
  setTimelineScroll: (scroll) => setTimelineScroll(scroll),
  setSnapEnabled: (enabled) => setSnapEnabled(enabled),
  setSnapValue: (value) => setSnapValue(value),
  
  addTrack: () => {
    const newTrack = {
      id: `track_${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      notes: [],
      synthType: 'Synth',
      synthOptions: {},
      effects: []
    };
    
    const newSequence = {
      label: newTrack.name,
      notes: [],
      synth: {
        type: newTrack.synthType,
        options: newTrack.synthOptions
      }
    };
    
    setTracks(tracks.length, newTrack);
    setJmonData('sequences', sequences => [...sequences, newSequence]);
  },
  
  removeTrack: (trackId) => {
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    setTracks(tracks.filter(t => t.id !== trackId));
    setJmonData('sequences', sequences => sequences.filter((_, i) => i !== trackIndex));
  },
  
  updateTrack: (trackId, updates) => {
    const trackIndex = tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;
    
    setTracks(trackIndex, updates);
    
    // Update corresponding JMON sequence
    setJmonData('sequences', trackIndex, sequence => ({
      ...sequence,
      label: updates.name || sequence.label,
      notes: updates.notes || sequence.notes,
      synth: updates.synthType ? {
        type: updates.synthType,
        options: updates.synthOptions || {}
      } : sequence.synth
    }));
    
    // Update audio engine if volume or pan changed
    if (audioEngine.isInitialized) {
      if (updates.volume !== undefined) {
        audioEngine.updateTrackVolume(trackIndex, updates.volume);
      }
      if (updates.pan !== undefined) {
        audioEngine.updateTrackPan(trackIndex, updates.pan);
      }
    }
  },
  
  setSelectedTrack: (trackId) => setSelectedTrack(trackId),
  setSelectedNotes: (notes) => setSelectedNotes(notes),
  
  toggleLeftSidebar: () => setLeftSidebarOpen(!leftSidebarOpen()),
  toggleRightSidebar: () => setRightSidebarOpen(!rightSidebarOpen()),
  toggleJmonEditor: () => setJmonEditorOpen(!jmonEditorOpen()),
  toggleTrackInfo: () => setTrackInfoOpen(!trackInfoOpen()),
  toggleMasterBus: () => setMasterBusOpen(!masterBusOpen()),
  setSelectedEffect: (effect) => {
    setSelectedEffect(effect);
    // Initialize parameters with defaults
    if (effect) {
      const defaultParams = getDefaultParams(effect.type, effect.name);
      setEffectParams({ ...defaultParams, ...effect.options });
    }
  },
  closeEffectEditor: () => {
    setSelectedEffect(null);
    setEffectParams({});
  },
  updateEffectParam: (key, value) => {
    setEffectParams(prev => ({ ...prev, [key]: value }));
  },
  saveEffectChanges: () => {
    const effect = selectedEffect();
    if (!effect) return;
    
    if (effect.type === 'synth') {
      // Update synth parameters
      dawStore.updateTrack(effect.trackId, { 
        synthType: effect.name,
        synthOptions: effectParams()
      });
    } else if (effect.type === 'effect') {
      // Update effect parameters
      const trackIndex = tracks.findIndex(t => t.id === effect.trackId);
      if (trackIndex !== -1) {
        const updatedEffects = [...tracks[trackIndex].effects];
        updatedEffects[effect.effectIndex] = {
          type: effect.name,
          options: effectParams()
        };
        dawStore.updateTrack(effect.trackId, { effects: updatedEffects });
      }
    }
    
    dawStore.closeEffectEditor();
  },
  
  updateJmonData: (data) => {
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data);
    }
  },
  
  // Sync JMON data to DAW state
  syncFromJmon: () => {
    const syncedTracks = jmonData.sequences.map((seq, index) => ({
      id: `track_${index}`,
      name: seq.label,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      notes: seq.notes || [],
      synthType: seq.synth?.type || 'Synth',
      synthOptions: seq.synth?.options || {},
      effects: seq.effects || []
    }));
    
    setTracks(syncedTracks);
    setBpm(jmonData.bpm);
  },

  // Initialize with demo data and audio graph
  loadDemo: async () => {
    setJmonData(demoComposition);
    
    // Initialize audio engine with JMON data
    try {
      await audioEngine.init();
      audioEngine.buildAudioGraph(demoComposition);
      audioEngine.setBpm(demoComposition.bpm);
    } catch (error) {
      console.error('Audio engine initialization failed:', error);
    }
    
    const demoTracks = demoComposition.sequences.map((seq, index) => ({
      id: `track_${index}`,
      name: seq.label,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      notes: seq.notes || [],
      synthType: seq.synth?.type || 'Synth',
      synthOptions: seq.synth?.options || {},
      effects: seq.effects || [],
      height: 150
    }));
    
    setTracks(demoTracks);
    setBpm(demoComposition.bpm);
  },
  
  // Play/pause with audio engine integration
  play: async () => {
    if (!audioEngine.isInitialized) {
      await audioEngine.init();
      audioEngine.buildAudioGraph(jmonData);
    }
    
    // Schedule all sequences
    jmonData.sequences.forEach((sequence, index) => {
      audioEngine.scheduleSequence(sequence, index);
    });
    
    audioEngine.play();
    setIsPlaying(true);
  },
  
  stop: () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  },
  
  pause: () => {
    audioEngine.pause();
    setIsPlaying(false);
  },
  
  // Update JMON and rebuild audio graph
  updateJmonWithAudio: (data) => {
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data);
    }
  },
  
  // Test individual note (for UI feedback)
  testNote: async (noteName, synthType = 'Synth', synthOptions = {}) => {
    try {
      await audioEngine.previewNote(noteName, synthType, 0.3, synthOptions);
    } catch (error) {
      console.warn('Note test failed:', error);
    }
  },

  // Timeline controls
  setTimelineZoom: (zoom) => setTimelineZoom(Math.max(0.1, Math.min(5, zoom))),
  setVerticalZoom: (zoom) => setVerticalZoom(Math.max(0.5, Math.min(3, zoom))),
  setTimelineScroll: (scroll) => setTimelineScroll(Math.max(0, scroll)),
  zoomIn: () => setTimelineZoom(Math.min(5, timelineZoom() * 1.2)),
  zoomOut: () => setTimelineZoom(Math.max(0.1, timelineZoom() / 1.2)),
  verticalZoomIn: () => setVerticalZoom(Math.min(3, verticalZoom() * 1.2)),
  verticalZoomOut: () => setVerticalZoom(Math.max(0.5, verticalZoom() / 1.2))
};

// Export a hook-like function for compatibility
export const useDawStore = () => dawStore;