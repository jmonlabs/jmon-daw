import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { demo01BasicSynth } from '../data/demo-01-basic-synth';
import { audioEngine } from '../utils/audioEngine';

// Create signals for reactive state
const [isPlaying, setIsPlaying] = createSignal(false);
const [bpm, setBpm] = createSignal(120);
const [currentTime, setCurrentTime] = createSignal(0);
const [isLooping, setIsLooping] = createSignal(false);
const [loopStart, setLoopStart] = createSignal(0);
const [loopEnd, setLoopEnd] = createSignal(16);
const [timelineZoom, setTimelineZoom] = createSignal(1);
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
const [contextMenu, setContextMenu] = createSignal(null);
const [clipboard, setClipboard] = createSignal(null);

// Create stores for complex objects
const [tracks, setTracks] = createStore([]);
const [jmonData, setJmonData] = createStore(JSON.parse(JSON.stringify(demo01BasicSynth)));

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
        return { roomSize: 0.7, decay: 2.5, wet: 0.3 };
      case 'Delay':
        return { delayTime: 0.25, feedback: 0.3, wet: 0.4 };
      case 'Filter':
        return { frequency: 1000, Q: 1, type: 'lowpass', wet: 1.0 };
      case 'Chorus':
        return { frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.5 };
      case 'Distortion':
        return { distortion: 0.4, oversample: '4x', wet: 0.6 };
      case 'Compressor':
        return { threshold: -24, ratio: 12, attack: 0.003, release: 0.25, wet: 1.0 };
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
  get contextMenu() { return contextMenu(); },
  get clipboard() { return clipboard(); },
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
    console.log(`🎵 BPM updated to ${newBpm} and synced to JMON`);
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
      effects: [],
      verticalZoom: 4.0,
      verticalScroll: 0
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
    
    // Log the updates for debugging
    if (Object.keys(updates).some(key => ['muted', 'solo', 'volume', 'pan', 'name', 'synthType', 'effects'].includes(key))) {
      console.log(`🔄 Track ${trackIndex} (${tracks[trackIndex].name}) updated:`, updates);
    }
    
    setTracks(trackIndex, updates);
    
    // Update corresponding JMON sequence with ONLY musical properties (following JMON schema)
    setJmonData('sequences', trackIndex, sequence => {
      const updatedSequence = { ...sequence };
      
      // Only update JMON-valid properties
      if (updates.name !== undefined) updatedSequence.label = updates.name;
      if (updates.notes !== undefined) updatedSequence.notes = updates.notes;
      if (updates.synthType) {
        updatedSequence.synth = {
          type: updates.synthType,
          options: updates.synthOptions || {}
        };
      }
      if (updates.effects !== undefined) updatedSequence.effects = updates.effects;
      
      // Do NOT save DAW UI state (muted, solo, volume, pan, verticalZoom, etc.) to JMON
      // These will be managed separately in the DAW state
      
      return updatedSequence;
    });
    
    // Update audio engine if volume, pan, mute or solo changed
    if (audioEngine.isInitialized) {
      if (updates.volume !== undefined) {
        audioEngine.updateTrackVolume(trackIndex, updates.volume);
      }
      if (updates.pan !== undefined) {
        audioEngine.updateTrackPan(trackIndex, updates.pan);
      }
      if (updates.muted !== undefined) {
        audioEngine.updateTrackMute(trackIndex, updates.muted);
      }
      if (updates.solo !== undefined) {
        audioEngine.updateTrackSolo(trackIndex, updates.solo);
      }
      
      // Rebuild audio graph if effects changed
      if (updates.effects !== undefined) {
        console.log('🎛️ EFFECTS DEBUG: Effects changed, rebuilding audio graph');
        audioEngine.buildAudioGraph(jmonData, tracks);
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
  setContextMenu: (menu) => setContextMenu(menu),
  setClipboard: (data) => setClipboard(data),
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
      console.log(`🎛️ Synth updated: ${effect.name} with options`, effectParams());
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
        console.log(`🎛️ Effect updated: ${effect.name} with options`, effectParams());
        
        // Rebuild audio graph to apply effect changes
        if (audioEngine.isInitialized) {
          audioEngine.buildAudioGraph(jmonData, tracks);
        }
      }
    }
    
    dawStore.closeEffectEditor();
  },
  
  updateJmonData: (data) => {
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data, tracks);
    }
  },
  
  // Get clean JMON data for export/display (removes DAW-specific properties)
  getCleanJmonData: () => {
    const cleanData = { ...jmonData };
    
    // Clean sequences - remove DAW-only properties
    if (cleanData.sequences) {
      cleanData.sequences = cleanData.sequences.map(seq => {
        const cleanSeq = { ...seq };
        
        // Remove DAW-specific properties that shouldn't be in JMON
        delete cleanSeq.id;
        delete cleanSeq.muted;
        delete cleanSeq.solo;
        delete cleanSeq.volume;
        delete cleanSeq.pan;
        delete cleanSeq.verticalZoom;
        delete cleanSeq.verticalScroll;
        delete cleanSeq.height;
        
        // Clean notes - remove DAW-specific properties
        if (cleanSeq.notes) {
          cleanSeq.notes = cleanSeq.notes.map(note => {
            const cleanNote = { ...note };
            delete cleanNote.id; // Remove note IDs - not part of JMON schema
            return cleanNote;
          });
        }
        
        return cleanSeq;
      });
    }
    
    return cleanData;
  },
  
  // Sync JMON data to DAW state - preserve existing DAW state for non-musical properties
  syncFromJmon: () => {
    const syncedTracks = jmonData.sequences.map((seq, index) => {
      // Keep existing DAW state if track exists, otherwise use defaults
      const existingTrack = tracks[index];
      
      return {
        id: existingTrack?.id || `track_${index}`,
        name: seq.label,
        // Musical properties from JMON
        notes: seq.notes || [],
        synthType: seq.synth?.type || 'Synth',
        synthOptions: seq.synth?.options || {},
        effects: seq.effects || [],
        // DAW properties - preserve existing state or use defaults
        muted: existingTrack?.muted !== undefined ? existingTrack.muted : false,
        solo: existingTrack?.solo !== undefined ? existingTrack.solo : false,
        volume: existingTrack?.volume !== undefined ? existingTrack.volume : 0.8,
        pan: existingTrack?.pan !== undefined ? existingTrack.pan : 0,
        // UI state - preserve existing state or use defaults
        verticalZoom: existingTrack?.verticalZoom !== undefined ? existingTrack.verticalZoom : 4.0,
        verticalScroll: existingTrack?.verticalScroll !== undefined ? existingTrack.verticalScroll : 0,
        height: existingTrack?.height !== undefined ? existingTrack.height : 150
      };
    });
    
    setTracks(syncedTracks);
    setBpm(jmonData.bpm);
    
    console.log('🔄 Synced tracks from JMON (preserved DAW state):', syncedTracks.map(t => ({
      name: t.name,
      notes: t.notes.length,
      synthType: t.synthType
    })));
  },

  // Initialize with demo data and audio graph
  loadDemo: async () => {
    setJmonData(demo01BasicSynth);
    
    // Initialize audio engine with JMON data
    try {
      await audioEngine.init();
      // Pass empty tracks array initially since tracks will be created after this
      audioEngine.buildAudioGraph(demo01BasicSynth, []);
      audioEngine.setBpm(demo01BasicSynth.bpm);
    } catch (error) {
      console.error('Audio engine initialization failed:', error);
    }
    
    // Create DAW tracks from JMON sequences with proper defaults for DAW-only properties
    const demoTracks = demo01BasicSynth.sequences.map((seq, index) => ({
      id: `track_${index}`,
      name: seq.label,
      // Musical properties from JMON
      notes: seq.notes || [],
      synthType: seq.synth?.type || 'Synth',
      synthOptions: seq.synth?.options || {},
      effects: seq.effects || [],
      // DAW-only properties (not stored in JMON)
      muted: false,
      solo: false, 
      volume: 0.8,
      pan: 0,
      // UI state properties (not stored in JMON)
      verticalZoom: 4.0,
      verticalScroll: 0,
      height: 150
    }));
    
    setTracks(demoTracks);
    setBpm(demo01BasicSynth.bpm);
    
    // Rebuild audio graph now that tracks are created (for effect chains)
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(demo01BasicSynth, demoTracks);
    }
  },
  
  // Play/pause with audio engine integration
  play: async () => {
    if (!audioEngine.isInitialized) {
      await audioEngine.init();
      audioEngine.buildAudioGraph(jmonData, tracks);
      audioEngine.setBpm(bpm());
    }
    
    // Always clear and re-schedule all sequences to ensure audio works after pause
    audioEngine.clear();
    
    // Set playback position from current time
    const currentTimeValue = currentTime();
    const bars = Math.floor(currentTimeValue);
    const beats = Math.floor((currentTimeValue - bars) * 4);
    const ticksRaw = ((currentTimeValue - bars) * 4 - beats) * 480;
    const ticks = Math.min(479, Math.max(0, Math.floor(ticksRaw)));
    audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
    
    console.log('🎵 Scheduling sequences for playback from position:', `${bars}:${beats}:${ticks}`);
    jmonData.sequences.forEach((sequence, index) => {
      audioEngine.scheduleSequence(sequence, index);
      console.log(`🎵 Scheduled sequence ${index}: ${sequence.label} with ${sequence.notes?.length || 0} notes`);
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
    
    // Sync store.currentTime with actual transport position after pause
    if (audioEngine.isInitialized) {
      const transportPosition = audioEngine.getPosition();
      console.log(`⏸️ Raw transport position: ${transportPosition}`);
      if (transportPosition && typeof transportPosition === 'string') {
        const parts = transportPosition.split(':');
        if (parts.length === 3) {
          const bars = parseInt(parts[0], 10);
          const beats = parseInt(parts[1], 10);
          const ticks = parseFloat(parts[2]); // Use parseFloat to handle decimals
          // Convert to measures (store.currentTime format)
          const measures = bars + (beats / 4) + (ticks / (4 * 480));
          setCurrentTime(measures);
          console.log(`⏸️ Synced currentTime to ${measures} from transport position ${transportPosition} (bars=${bars}, beats=${beats}, ticks=${ticks})`);
        }
      }
    }
    
    setIsPlaying(false);
  },
  
  // Update JMON and rebuild audio graph
  updateJmonWithAudio: (data) => {
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data, tracks);
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
  setTimelineScroll: (scroll) => setTimelineScroll(Math.max(0, scroll)),
  zoomIn: () => setTimelineZoom(Math.min(5, timelineZoom() * 1.2)),
  zoomOut: () => setTimelineZoom(Math.max(0.1, timelineZoom() / 1.2))
};

// Export a hook-like function for compatibility
export const useDawStore = () => dawStore;