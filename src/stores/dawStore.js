import { createStore } from "solid-js/store";
import { createSignal } from "solid-js";
import { demo01BasicSynth } from "../data/demo-01-basic-synth";
import { audioEngine } from "../utils/audioEngine";

// Time parsing utilities
const parseTimeToMeasures = (time) => {
  if (typeof time === "number") return time;
  if (typeof time === "string") {
    if (time.includes(":")) {
      const [bars, beats, ticks] = time.split(":").map(parseFloat);
      return bars + beats / 4 + ticks / (4 * 480);
    }
    return 0;
  }
  return 0;
};

const parseDurationToMeasures = (duration) => {
  if (typeof duration === "number") return duration;
  if (typeof duration === "string" && /^\d+\.?\d*$/.test(duration)) {
    return parseFloat(duration);
  }
  const durationMap = {
    "1n": 1,
    "2n": 0.5,
    "4n": 0.25,
    "8n": 0.125,
    "16n": 0.0625,
    "32n": 0.03125,
  };
  return durationMap[duration] || 1;
};

// Create signals for reactive state
const [isPlaying, setIsPlaying] = createSignal(false);
let playheadSyncInterval = null;
const [bpm, setBpm] = createSignal(120);
const [currentTime, setCurrentTime] = createSignal(0);
const [isLooping, setIsLooping] = createSignal(false);
const [loopStart, setLoopStart] = createSignal(0);
const [loopEnd, setLoopEnd] = createSignal(16);
// Remember last loop position when loop is disabled
const [lastLoopStart, setLastLoopStart] = createSignal(null);
const [lastLoopEnd, setLastLoopEnd] = createSignal(null);
const [hasLoopBeenUsed, setHasLoopBeenUsed] = createSignal(false);
const [timelineZoom, setTimelineZoom] = createSignal(1);
const [timelineScroll, setTimelineScroll] = createSignal(0);
const [snapEnabled, setSnapEnabled] = createSignal(true);
const [snapValue, setSnapValue] = createSignal("1/16");
const [selectedTrack, setSelectedTrack] = createSignal(null);
const [selectedNotes, setSelectedNotes] = createSignal([]);
const [leftSidebarOpen, setLeftSidebarOpen] = createSignal(false);
const [rightSidebarOpen, setRightSidebarOpen] = createSignal(true);
const [jmonEditorOpen, setJmonEditorOpen] = createSignal(false);
const [trackInfoOpen, setTrackInfoOpen] = createSignal(false);
const [masterBusOpen, setMasterBusOpen] = createSignal(false);
const [masterVolume, setMasterVolume] = createSignal(0.8);
const [masterBusEffects, setMasterBusEffects] = createSignal([]);
const [selectedEffect, setSelectedEffect] = createSignal(null);
const [effectParams, setEffectParams] = createSignal({});
const [contextMenu, setContextMenu] = createSignal(null);
const [clipboard, setClipboard] = createSignal(null);
const [showNoteProperties, setShowNoteProperties] = createSignal(false);
const [editingNote, setEditingNote] = createSignal(null);
const [editingNoteIndex, setEditingNoteIndex] = createSignal(-1);
const [editingTrackId, setEditingTrackId] = createSignal(null);

// Undo/Redo system
const [undoStack, setUndoStack] = createSignal([]);
const [redoStack, setRedoStack] = createSignal([]);
const [isUndoRedoAction, setIsUndoRedoAction] = createSignal(false);

// Undo/Redo utility functions
const captureCurrentState = () => {
  return {
    tracks: JSON.parse(JSON.stringify(tracks)),
    jmonData: JSON.parse(JSON.stringify(jmonData)),
    bpm: bpm(),
    loopStart: loopStart(),
    loopEnd: loopEnd(),
    isLooping: isLooping(),
    timelineZoom: timelineZoom(),
    timelineScroll: timelineScroll(),
    timestamp: Date.now(),
  };
};

const restoreState = (state) => {
  setIsUndoRedoAction(true);

  // Restore tracks
  setTracks(JSON.parse(JSON.stringify(state.tracks)));

  // Restore JMON data
  setJmonData(JSON.parse(JSON.stringify(state.jmonData)));

  // Restore other state
  setBpm(state.bpm);
  setLoopStart(state.loopStart);
  setLoopEnd(state.loopEnd);
  setIsLooping(state.isLooping);
  setTimelineZoom(state.timelineZoom);
  setTimelineScroll(state.timelineScroll);

  // Rebuild audio graph if initialized
  if (audioEngine.isInitialized) {
    audioEngine.buildAudioGraph(jmonData, tracks);
    audioEngine.setBpm(state.bpm);
  }

  setIsUndoRedoAction(false);
  console.log("🔄 State restored from undo/redo");
};

const pushToUndoStack = (description = "Unknown action") => {
  if (isUndoRedoAction()) return; // Don't record undo/redo actions themselves

  const currentState = captureCurrentState();
  const stack = undoStack();

  // Limit undo stack size to prevent memory issues
  const maxStackSize = 50;
  const newStack = [...stack, { ...currentState, description }];

  if (newStack.length > maxStackSize) {
    newStack.shift(); // Remove oldest entry
  }

  setUndoStack(newStack);
  setRedoStack([]); // Clear redo stack when new action is performed

  console.log(
    `📝 Action recorded: ${description} (undo stack size: ${newStack.length})`,
  );
};

// Create stores for complex objects
const [tracks, setTracks] = createStore([]);
const [jmonData, setJmonData] = createStore(
  JSON.parse(JSON.stringify(demo01BasicSynth)),
);

// Default parameters for different effect types
const getDefaultParams = (type, name) => {
  if (type === "synth") {
    switch (name) {
      case "AMSynth":
        return {
          harmonicity: 3,
          detune: 0,
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 },
        };
      case "FMSynth":
        return {
          harmonicity: 3,
          modulationIndex: 10,
          detune: 0,
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 },
        };
      case "MonoSynth":
        return {
          frequency: 440,
          detune: 0,
          oscillator: { type: "sawtooth" },
          filter: { Q: 6, type: "lowpass", rolloff: -24 },
        };
      default:
        return {
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 1 },
        };
    }
  } else {
    switch (name) {
      case "Reverb":
        return { roomSize: 0.7, decay: 2.5, wet: 0.3 };
      case "Delay":
        return { delayTime: 0.25, feedback: 0.3, wet: 0.4 };
      case "Filter":
        return { frequency: 1000, Q: 1, type: "lowpass", wet: 1.0 };
      case "Chorus":
        return { frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.5 };
      case "Distortion":
        return { distortion: 0.4, oversample: "4x", wet: 0.6 };
      case "Compressor":
        return {
          threshold: -24,
          ratio: 12,
          attack: 0.003,
          release: 0.25,
          wet: 1.0,
        };
      default:
        return { wet: 0.5 };
    }
  }
};

// Auto-zoom utility function for tracks
const calculateOptimalZoomForTrack = (track) => {
  const notes = track.notes || [];
  if (notes.length === 0) {
    return { verticalZoom: 1.0, verticalScroll: 0 };
  }

  // Convert note names to MIDI numbers
  const noteNameToMidi = (noteName) => {
    if (typeof noteName === "number") return noteName;

    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    // Parse note name like "C2", "F#3", etc.
    const match = noteName.match(/^([A-G]#?)([0-9])$/);
    if (!match) return null;

    const [, note, octaveStr] = match;
    const noteIndex = noteNames.indexOf(note);
    const octave = parseInt(octaveStr);

    if (noteIndex === -1 || isNaN(octave)) return null;

    // MIDI formula: C4 = 60, so MIDI = noteIndex + octave * 12 + 12
    const midi = noteIndex + octave * 12 + 12;
    return midi;
  };

  const midiNotes = notes
    .map((note) => noteNameToMidi(note.note))
    .filter((midi) => midi !== null);

  if (midiNotes.length === 0) {
    return { verticalZoom: 1.0, verticalScroll: 0 };
  }

  const minMidi = Math.min(...midiNotes);
  const maxMidi = Math.max(...midiNotes);
  const noteRange = maxMidi - minMidi;

  // Calculate zoom level to fit all notes with some padding
  const padding = Math.max(2, noteRange * 0.2); // 20% padding, min 2 semitones
  const requiredSemitones = noteRange + padding;
  const optimalZoom = Math.max(0.25, Math.min(4.0, 12 / requiredSemitones));

  // Calculate vertical scroll to center the notes
  const trackHeight = track.height || 150; // Default track height
  const centerMidi = (minMidi + maxMidi) / 2;

  // Using the same positioning logic as in TrackLane.jsx
  const referenceMidi = 66; // F#4
  const referenceY = trackHeight / 2;
  const spacing = (trackHeight - 40) / (12 / optimalZoom); // Grid spacing based on zoom

  // Calculate the Y position where the center note would appear
  const noteOffset = centerMidi - referenceMidi;
  const centerNoteY = referenceY - noteOffset * spacing;

  // Calculate needed scroll to center the notes
  const targetY = trackHeight / 2;
  const neededScroll = Math.max(0, centerNoteY - targetY);

  return {
    verticalZoom: optimalZoom,
    verticalScroll: neededScroll,
  };
};

// Auto-zoom utility function for timeline (horizontal zoom based on longest track)
const calculateOptimalTimelineZoom = (tracksList) => {
  if (!tracksList || tracksList.length === 0) {
    return { timelineZoom: 1.0, timelineScroll: 0 };
  }

  let maxEndTime = 0;
  let minStartTime = Infinity;

  tracksList.forEach((track) => {
    if (track.notes && track.notes.length > 0) {
      track.notes.forEach((note) => {
        const startTime = parseTimeToMeasures(note.time || 0);
        const duration = parseDurationToMeasures(note.duration || "4n");
        const endTime = startTime + duration;

        minStartTime = Math.min(minStartTime, startTime);
        maxEndTime = Math.max(maxEndTime, endTime);
      });
    }
  });

  if (minStartTime === Infinity || maxEndTime === 0) {
    return { timelineZoom: 1.0, timelineScroll: 0 };
  }

  const totalDuration = maxEndTime - minStartTime;

  // Calculate optimal zoom - aim to show all content with some padding
  // Assume a viewport width of about 1200px, with 80px per beat at zoom 1.0
  const viewportWidth = 1200;
  const baseWidthPerMeasure = 80 * 4; // 80px per beat, 4 beats per measure
  const padding = Math.max(2, totalDuration * 0.2); // 20% padding, min 2 measures
  const requiredWidth = (totalDuration + padding) * baseWidthPerMeasure;
  const optimalZoom = Math.max(
    0.25,
    Math.min(4.0, viewportWidth / requiredWidth),
  );

  // Calculate optimal scroll to center the content
  const contentStart = Math.max(0, minStartTime - padding / 2);
  const optimalScroll = contentStart * baseWidthPerMeasure * optimalZoom;

  console.log(
    `🔍 Timeline auto-zoom: duration=${totalDuration.toFixed(2)} measures, zoom=${optimalZoom.toFixed(2)}, scroll=${optimalScroll.toFixed(1)}`,
  );

  return {
    timelineZoom: optimalZoom,
    timelineScroll: optimalScroll,
  };
};

// Notification system
const [notifications, setNotifications] = createSignal([]);
let notificationId = 0;

// Keep track of active polyphony warnings to avoid duplicates
const activePolyphonyWarnings = new Set();

// Notification types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  POLYPHONY: 'polyphony'
};

// Add notification function
const addNotification = (type, title, message, duration = 5000, actions = null) => {
  const id = ++notificationId;
  const notification = {
    id,
    type,
    title,
    message,
    timestamp: Date.now(),
    actions
  };
  
  console.log(`🎯 STORE: addNotification called with:`, { type, title, message, duration, actions });
  console.log(`🎯 STORE: Adding notification with ID:`, id);
  console.log(`🎯 STORE: Current notifications before adding:`, notifications());
  
  setNotifications(prev => [...prev, notification]);
  
  console.log(`🎯 STORE: Current notifications after adding:`, notifications());
  
  // Auto-remove notification after duration (unless it's an error or has actions)
  if (duration > 0 && type !== NOTIFICATION_TYPES.ERROR && !actions) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }
  
  return id;
};

// Remove notification function
const removeNotification = (id) => {
  console.log(`🎯 STORE: removeNotification called with ID:`, id);
  
  // Find the notification to remove
  const currentNotifications = notifications();
  const notificationToRemove = currentNotifications.find(n => n.id === id);
  
  // If it's a polyphony warning, remove it from active warnings
  if (notificationToRemove && notificationToRemove.type === NOTIFICATION_TYPES.POLYPHONY) {
    const warningKey = `${notificationToRemove.title}`;
    activePolyphonyWarnings.delete(warningKey);
    console.log(`🎯 STORE: Removed polyphony warning from active set:`, warningKey);
  }
  
  setNotifications(prev => prev.filter(n => n.id !== id));
  console.log(`🎯 STORE: Notification ${id} removed, current count:`, notifications().length);
};

// Clear all notifications
const clearNotifications = () => {
  console.log(`🎯 STORE: clearNotifications called`);
  setNotifications([]);
  activePolyphonyWarnings.clear();
  console.log(`🎯 STORE: All notifications cleared`);
};

// Function to synchronize DAW tracks with JMON data after changes
const syncTracksWithJmon = (updatedJmonData) => {
  console.log(`🔄 SYNC: Synchronizing DAW tracks with updated JMON data`);
  
  if (!updatedJmonData || !updatedJmonData.sequences) {
    console.warn(`🔄 SYNC: No sequences in JMON data to sync`);
    return;
  }
  
  const currentTracks = tracks;
  const updatedTracks = [...currentTracks];
  
  // Update each track based on corresponding JMON sequence
  updatedJmonData.sequences.forEach((sequence, index) => {
    if (index < updatedTracks.length) {
      const oldSynthType = updatedTracks[index].synthType;
      const newSynthType = sequence.synth?.type || 'Synth';
      
      // Update the track properties from JMON
      updatedTracks[index] = {
        ...updatedTracks[index],
        synthType: newSynthType,
        synthOptions: sequence.synth?.options || {},
        effects: sequence.effects || [],
        notes: sequence.notes || []
      };
      
      if (oldSynthType !== newSynthType) {
        console.log(`🔄 SYNC: Updated track ${index} (${sequence.label}) synth type: ${oldSynthType} → ${newSynthType}`);
      }
    }
  });
  
  // Update the tracks store
  setTracks(updatedTracks);
  
  console.log(`🔄 SYNC: Synchronized ${updatedTracks.length} DAW tracks with JMON data`);
  return updatedTracks;
};

// Create the store object with getters and actions
export const dawStore = {
  // Getters
  get isPlaying() {
    return isPlaying();
  },
  get bpm() {
    return bpm();
  },
  get currentTime() {
    return currentTime();
  },
  get isLooping() {
    return isLooping();
  },
  get loopStart() {
    return loopStart();
  },
  get loopEnd() {
    return loopEnd();
  },
  get timelineZoom() {
    return timelineZoom();
  },
  get timelineScroll() {
    return timelineScroll();
  },
  get snapEnabled() {
    return snapEnabled();
  },
  get snapValue() {
    return snapValue();
  },
  get tracks() {
    return tracks;
  },
  get selectedTrack() {
    return selectedTrack();
  },
  get selectedNotes() {
    return selectedNotes();
  },
  get leftSidebarOpen() {
    return leftSidebarOpen();
  },
  get rightSidebarOpen() {
    return rightSidebarOpen();
  },
  get jmonEditorOpen() {
    return jmonEditorOpen();
  },
  get trackInfoOpen() {
    return trackInfoOpen();
  },
  get masterBusOpen() {
    return masterBusOpen();
  },
  get masterVolume() {
    return masterVolume();
  },
  get masterBusEffects() {
    return masterBusEffects();
  },
  get selectedEffect() {
    return selectedEffect();
  },
  get effectParams() {
    return effectParams();
  },
  get contextMenu() {
    return contextMenu();
  },
  get clipboard() {
    return clipboard();
  },
  get showNoteProperties() {
    return showNoteProperties();
  },
  get editingNote() {
    return editingNote();
  },
  get editingNoteIndex() {
    return editingNoteIndex();
  },
  get editingTrackId() {
    return editingTrackId();
  },
  get jmonData() {
    return jmonData;
  },
  get notifications() {
    return notifications;
  },

  // Undo/Redo getters
  get canUndo() {
    return undoStack().length > 0;
  },
  get canRedo() {
    return redoStack().length > 0;
  },
  get undoDescription() {
    const stack = undoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  },
  get redoDescription() {
    const stack = redoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  },

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
    setJmonData("bpm", newBpm);
    if (audioEngine.isInitialized) {
      audioEngine.setBpm(newBpm);
    }
    console.log(`🎵 BPM updated to ${newBpm} and synced to JMON`);
  },
  setCurrentTime: (time) => setCurrentTime(time),
  setLooping: (looping) => {
    if (looping) {
      // When enabling loop, restore last position if it exists and is valid
      if (
        hasLoopBeenUsed() &&
        lastLoopStart() !== null &&
        lastLoopEnd() !== null &&
        lastLoopEnd() > lastLoopStart()
      ) {
        setLoopStart(lastLoopStart());
        setLoopEnd(lastLoopEnd());
        console.log(
          `🔄 Restored loop region: ${lastLoopStart().toFixed(2)} to ${lastLoopEnd().toFixed(2)} measures`,
        );
      } else if (tracks.length > 0) {
        // Auto-set loop to cover all track content when enabling loop for the first time
        let minTime = Infinity;
        let maxTime = 0;

        tracks.forEach((track) => {
          if (track.notes && track.notes.length > 0) {
            console.log(
              `🔍 Analyzing track "${track.name}" with ${track.notes.length} notes:`,
            );
            track.notes.forEach((note, index) => {
              const startTime = parseTimeToMeasures(note.time || 0);
              const duration = parseDurationToMeasures(note.duration || "4n");
              const endTime = startTime + duration;

              console.log(
                `🔍   Note ${index}: time="${note.time}" (${startTime.toFixed(3)} measures), duration="${note.duration}" (${duration.toFixed(3)} measures), end=${endTime.toFixed(3)}`,
              );

              minTime = Math.min(minTime, startTime);
              maxTime = Math.max(maxTime, endTime);
            });
          }
        });

        console.log(
          `🔍 Loop calculation: minTime=${minTime.toFixed(3)}, maxTime=${maxTime.toFixed(3)}`,
        );

        if (minTime !== Infinity && maxTime > minTime) {
          // Add some padding
          const padding = Math.max(0.5, (maxTime - minTime) * 0.1);
          setLoopStart(Math.max(0, minTime - padding));
          setLoopEnd(maxTime + padding);
          // Mark as used and save the auto-calculated position
          setLastLoopStart(loopStart());
          setLastLoopEnd(loopEnd());
          setHasLoopBeenUsed(true);
          console.log(
            `🔄 Auto-set loop region: ${loopStart().toFixed(2)} to ${loopEnd().toFixed(2)} measures`,
          );
        } else {
          // Fallback to default if no notes found
          setLoopStart(0);
          setLoopEnd(4);
          // Mark as used and save the default position
          setLastLoopStart(0);
          setLastLoopEnd(4);
          setHasLoopBeenUsed(true);
          console.log(
            "🔄 No notes found, using default loop region: 0 to 4 measures",
          );
        }
      }
    } else {
      // When disabling loop, save current position for later restoration
      setLastLoopStart(loopStart());
      setLastLoopEnd(loopEnd());
      setHasLoopBeenUsed(true);
      console.log(
        `🔄 Saved loop region for later: ${loopStart().toFixed(2)} to ${loopEnd().toFixed(2)} measures`,
      );
    }

    setIsLooping(looping);

    // Update audio engine loop if currently playing
    if (audioEngine.isInitialized && isPlaying()) {
      if (looping) {
        // Convert decimal measures to bars:beats:ticks format
        const convertMeasuresToTimeString = (measures) => {
          const bars = Math.floor(measures);
          const remainingBeats = (measures - bars) * 4;
          const beats = Math.floor(remainingBeats);
          const ticksRaw = (remainingBeats - beats) * 480;
          const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
          return `${bars}:${beats}:${ticks}`;
        };

        const startTime = convertMeasuresToTimeString(loopStart());
        const endTime = convertMeasuresToTimeString(loopEnd());
        audioEngine.setLoop(startTime, endTime);
        console.log(
          `🔄 Audio engine loop enabled during playback: ${startTime} to ${endTime}`,
        );
      } else {
        audioEngine.disableLoop();
        console.log(`🔄 Audio engine loop disabled during playback`);
      }
    }
  },
  setLoopStart: (start) => {
    setLoopStart(start);
    // Also update the saved position so it's remembered when loop is disabled/enabled
    setLastLoopStart(start);
    setHasLoopBeenUsed(true);
    // Update audio engine loop if currently looping and playing
    if (isLooping() && audioEngine.isInitialized) {
      // Convert decimal measures to bars:beats:ticks format
      const convertMeasuresToTimeString = (measures) => {
        const bars = Math.floor(measures);
        const remainingBeats = (measures - bars) * 4;
        const beats = Math.floor(remainingBeats);
        const ticksRaw = (remainingBeats - beats) * 480;
        const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
        return `${bars}:${beats}:${ticks}`;
      };

      const startTime = convertMeasuresToTimeString(start);
      const endTime = convertMeasuresToTimeString(loopEnd());
      audioEngine.setLoop(startTime, endTime);
      console.log(`🔄 Loop start updated: ${startTime} to ${endTime}`);
    }
  },
  setLoopEnd: (end) => {
    setLoopEnd(end);
    // Also update the saved position so it's remembered when loop is disabled/enabled
    setLastLoopEnd(end);
    setHasLoopBeenUsed(true);
    // Update audio engine loop if currently looping and playing
    if (isLooping() && audioEngine.isInitialized) {
      // Convert decimal measures to bars:beats:ticks format
      const convertMeasuresToTimeString = (measures) => {
        const bars = Math.floor(measures);
        const remainingBeats = (measures - bars) * 4;
        const beats = Math.floor(remainingBeats);
        const ticksRaw = (remainingBeats - beats) * 480;
        const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
        return `${bars}:${beats}:${ticks}`;
      };

      const startTime = convertMeasuresToTimeString(loopStart());
      const endTime = convertMeasuresToTimeString(end);
      audioEngine.setLoop(startTime, endTime);
      console.log(`🔄 Loop end updated: ${startTime} to ${endTime}`);
    }
  },

  setTimelineZoom: (zoom) => setTimelineZoom(zoom),
  setTimelineScroll: (scroll) => setTimelineScroll(scroll),
  setSnapEnabled: (enabled) => setSnapEnabled(enabled),
  setSnapValue: (value) => setSnapValue(value),

  // Helper function to validate and fix synth types
  validateAndFixSynthTypes: () => {
    const validSynthTypes = ['Synth', 'PolySynth', 'MonoSynth', 'AMSynth', 'FMSynth', 'DuoSynth', 'PluckSynth', 'NoiseSynth', 'MetalSynth', 'MembraneSynth', 'Sampler'];
    
    let hasInvalidSynths = false;
    
    // Check and fix tracks
    const fixedTracks = tracks.map(track => {
      if (!validSynthTypes.includes(track.synthType)) {
        console.warn(`🔧 SYNTH FIX: Track "${track.name}" has invalid synth type "${track.synthType}", changing to "Synth"`);
        hasInvalidSynths = true;
        return { ...track, synthType: 'Synth' };
      }
      return track;
    });
    
    // Check and fix sequences
    const fixedSequences = (jmonData.sequences || []).map(sequence => {
      if (sequence.synth && !validSynthTypes.includes(sequence.synth.type)) {
        console.warn(`🔧 SYNTH FIX: Sequence "${sequence.label}" has invalid synth type "${sequence.synth.type}", changing to "Synth"`);
        hasInvalidSynths = true;
        return {
          ...sequence,
          synth: { ...sequence.synth, type: 'Synth' }
        };
      }
      return sequence;
    });
    
    // Apply fixes if needed
    if (hasInvalidSynths) {
      console.log('🔧 SYNTH FIX: Applying fixes to invalid synth types...');
      setTracks(fixedTracks);
      setJmonData('sequences', fixedSequences);
      
      // Rebuild audio graph with fixed data
      if (audioEngine.isInitialized) {
        audioEngine.buildAudioGraph({ ...jmonData, sequences: fixedSequences }, fixedTracks);
        console.log('🔧 SYNTH FIX: Audio graph rebuilt with fixed synth types');
      }
    } else {
      console.log('✅ SYNTH FIX: All synth types are valid');
    }
  },

  addTrack: () => {
    // Record state before action
    pushToUndoStack("Add track");

    const newTrack = {
      id: `track_${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      muted: false,
      solo: false,
      volume: 0.8,
      pan: 0,
      notes: [],
      synthType: "PolySynth", // Changed from "Synth" to "PolySynth" for polyphonic support
      synthOptions: {},
      effects: [],
      verticalZoom: 4.0,
      verticalScroll: 0,
      automation: {
        channels: [],
        enabled: true,
        visible: false
      },
    };

    const newSequence = {
      label: newTrack.name,
      notes: [],
      synth: {
        type: newTrack.synthType,
        options: newTrack.synthOptions,
      },
    };

    // Add track and sequence atomically to avoid duplication
    const updatedTracks = [...tracks, newTrack];
    const currentSequences = jmonData.sequences || [];
    const updatedSequences = [...currentSequences, newSequence];
    const updatedJmonData = { ...jmonData, sequences: updatedSequences };
    
    // Debug: log state before rebuild
    console.log(`🎵 ADD TRACK DEBUG: Before update - current sequences=${currentSequences.length}, will become=${updatedSequences.length}`);
    console.log(`🎵 ADD TRACK DEBUG: Current sequences:`, currentSequences.map((seq, i) => `${i}: ${seq.label} (${seq.notes?.length || 0} notes)`));
    console.log(`🎵 ADD TRACK DEBUG: Will add sequence:`, `${newSequence.label} (${newSequence.notes?.length || 0} notes)`);
    
    // Update store state
    setTracks(tracks.length, newTrack);
    setJmonData("sequences", updatedSequences);
    
    console.log(`🎵 ADD TRACK DEBUG: After update - jmonData.sequences.length=${jmonData.sequences.length}, tracks.length=${tracks.length}`);
    console.log(`🎵 ADD TRACK DEBUG: Passing to buildAudioGraph - sequences.length=${updatedSequences.length}, tracks.length=${updatedTracks.length}`);
    
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(updatedJmonData, updatedTracks);
      console.log(`🎵 Audio graph rebuilt for new track: ${newTrack.name}`);
    }
    
    // Add a success notification for new track
    addNotification(NOTIFICATION_TYPES.SUCCESS, 'Track Added', 
      `New track "${newTrack.name}" has been added with PolySynth for polyphonic playback.`, 3000);
  },

  removeTrack: (trackId) => {
    // Record state before action
    pushToUndoStack("Remove track");

    const trackIndex = tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    console.log(`🗑️ Removing track ${trackIndex} (${tracks[trackIndex].name})`);

    // Remove track and corresponding sequence
    const updatedTracks = tracks.filter((t) => t.id !== trackId);
    const updatedSequences = jmonData.sequences.filter((_, i) => i !== trackIndex);
    const updatedJmonData = { ...jmonData, sequences: updatedSequences };

    // Update store state
    setTracks(updatedTracks);
    setJmonData("sequences", updatedSequences);

    console.log(`🗑️ After removal: ${updatedTracks.length} tracks, ${updatedSequences.length} sequences`);

    // Rebuild audio graph to remove deleted tracks
    if (audioEngine.isInitialized) {
      audioEngine.clear(); // Clear any scheduled events from deleted tracks
      audioEngine.buildAudioGraph(updatedJmonData, updatedTracks);
      console.log(`🗑️ Audio graph rebuilt after track removal`);
    }
  },

  updateTrack: (trackId, updates) => {
    const trackIndex = tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    // Record state for significant changes (not for UI state like zoom/scroll)
    const significantChanges = [
      "notes",
      "name",
      "synthType",
      "synthOptions",
      "effects",
    ];
    if (Object.keys(updates).some((key) => significantChanges.includes(key))) {
      const changeTypes = Object.keys(updates).filter((key) =>
        significantChanges.includes(key),
      );
      pushToUndoStack(`Update track: ${changeTypes.join(", ")}`);
    }

    // Log the updates for debugging
    if (
      Object.keys(updates).some((key) =>
        [
          "muted",
          "solo",
          "volume",
          "pan",
          "name",
          "synthType",
          "effects",
        ].includes(key),
      )
    ) {
      console.log(
        `🔄 Track ${trackIndex} (${tracks[trackIndex].name}) updated:`,
        updates,
      );
    }

    setTracks(trackIndex, updates);

    // Update corresponding JMON sequence with ONLY musical properties (following JMON schema)
    setJmonData("sequences", trackIndex, (sequence) => {
      const updatedSequence = { ...sequence };

      // Only update JMON-valid properties
      if (updates.name !== undefined) updatedSequence.label = updates.name;
      if (updates.notes !== undefined) updatedSequence.notes = updates.notes;
      if (updates.synthType) {
        updatedSequence.synth = {
          type: updates.synthType,
          options: updates.synthOptions || {},
        };
      }
      if (updates.effects !== undefined)
        updatedSequence.effects = updates.effects;

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
      // Handle mute/solo changes - always update all tracks together for consistency
      if (updates.muted !== undefined || updates.solo !== undefined) {
        console.log(`🔄 Track ${trackIndex} mute/solo state changed`);
        // Update all tracks to handle mute/solo interactions correctly
        setTimeout(() => {
          audioEngine.updateAllTracksSoloState(tracks);
        }, 10); // Small delay to ensure store state is updated
      }

      // Rebuild audio graph if effects changed
      if (updates.effects !== undefined) {
        console.log(
          "🎛️ EFFECTS DEBUG: Effects changed, rebuilding audio graph",
        );
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
  setMasterVolume: (volume) => {
    setMasterVolume(volume);
    // Update audio engine master volume
    if (audioEngine.isInitialized) {
      audioEngine.setMasterVolume(volume);
    }
  },
  setMasterBusEffects: (effects) => {
    setMasterBusEffects(effects);
    // Update audio engine master effects
    if (audioEngine.isInitialized) {
      audioEngine.setMasterEffects(effects);
    }
  },
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
  
  // Note Properties Dialog
  get showNoteProperties() {
    return showNoteProperties();
  },
  get editingNote() {
    return editingNote();
  },
  get editingNoteIndex() {
    return editingNoteIndex();
  },
  get editingTrackId() {
    return editingTrackId();
  },
  setShowNoteProperties: (show) => setShowNoteProperties(show),
  setEditingNote: (note) => setEditingNote(note),
  setEditingNoteIndex: (index) => setEditingNoteIndex(index),
  setEditingTrackId: (trackId) => setEditingTrackId(trackId),
  saveNoteProperties: (updatedNote) => {
    const trackIndex = tracks.findIndex((t) => t.id === editingTrackId());
    const noteIndex = editingNoteIndex();
    if (trackIndex !== -1 && noteIndex >= 0) {
      const updatedNotes = [...tracks[trackIndex].notes];
      updatedNotes[noteIndex] = updatedNote;
      dawStore.updateTrack(editingTrackId(), { notes: updatedNotes });
    }
  },
  updateEffectParam: (key, value) => {
    setEffectParams((prev) => ({ ...prev, [key]: value }));
  },
  saveEffectChanges: () => {
    const effect = selectedEffect();
    if (!effect) return;

    if (effect.type === "synth") {
      // Update synth parameters
      dawStore.updateTrack(effect.trackId, {
        synthType: effect.name,
        synthOptions: effectParams(),
      });
      console.log(
        `🎛️ Synth updated: ${effect.name} with options`,
        effectParams(),
      );
    } else if (effect.type === "effect") {
      // Update effect parameters
      const trackIndex = tracks.findIndex((t) => t.id === effect.trackId);
      if (trackIndex !== -1) {
        const updatedEffects = [...tracks[trackIndex].effects];
        updatedEffects[effect.effectIndex] = {
          type: effect.name,
          options: effectParams(),
        };
        dawStore.updateTrack(effect.trackId, { effects: updatedEffects });
        console.log(
          `🎛️ Effect updated: ${effect.name} with options`,
          effectParams(),
        );

        // Rebuild audio graph to apply effect changes
        if (audioEngine.isInitialized) {
          audioEngine.buildAudioGraph(jmonData, tracks);
        }
      }
    }

    dawStore.closeEffectEditor();
  },

  updateJmonData: (data) => {
    console.log("📝 Updating JMON data:", data);
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data, tracks);
    }
    
    // Trigger polyphony check after data update
    setTimeout(() => {
      console.log("🔄 Triggering polyphony check after JMON data update");
      dawStore.recheckPolyphony();
    }, 100);
  },

  // Get clean JMON data for export/display (removes DAW-specific properties)
  getCleanJmonData: () => {
    const cleanData = { ...jmonData };

    // Clean sequences - remove DAW-only properties
    if (cleanData.sequences) {
      cleanData.sequences = cleanData.sequences.map((seq) => {
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
          cleanSeq.notes = cleanSeq.notes.map((note) => {
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

      const baseTrack = {
        id: existingTrack?.id || `track_${index}`,
        name: seq.label,
        // Musical properties from JMON
        notes: seq.notes || [],
        synthType: seq.synth?.type || "Synth",
        synthOptions: seq.synth?.options || {},
        effects: seq.effects || [],
        // DAW properties - preserve existing state or use defaults
        muted: existingTrack?.muted !== undefined ? existingTrack.muted : false,
        solo: existingTrack?.solo !== undefined ? existingTrack.solo : false,
        volume:
          existingTrack?.volume !== undefined ? existingTrack.volume : 0.8,
        pan: existingTrack?.pan !== undefined ? existingTrack.pan : 0,
        // UI state - preserve existing state or use defaults, but apply auto-zoom if no existing track
        verticalZoom:
          existingTrack?.verticalZoom !== undefined
            ? existingTrack.verticalZoom
            : 4.0,
        verticalScroll:
          existingTrack?.verticalScroll !== undefined
            ? existingTrack.verticalScroll
            : 0,
        height:
          existingTrack?.height !== undefined ? existingTrack.height : 150,
      };

      // Apply auto-zoom for new tracks (when no existing track state)
      if (!existingTrack && baseTrack.notes.length > 0) {
        const optimalZoom = calculateOptimalZoomForTrack(baseTrack);
        baseTrack.verticalZoom = optimalZoom.verticalZoom;
        baseTrack.verticalScroll = optimalZoom.verticalScroll;
        console.log(
          `🎯 Auto-zoom applied to new track "${baseTrack.name}": zoom=${optimalZoom.verticalZoom.toFixed(2)}, scroll=${optimalZoom.verticalScroll.toFixed(1)}`,
        );
      }

      return baseTrack;
    });

    setTracks(syncedTracks);
    setBpm(jmonData.bpm);

    console.log(
      "🔄 Synced tracks from JMON (preserved DAW state):",
      syncedTracks.map((t) => ({
        name: t.name,
        notes: t.notes.length,
        synthType: t.synthType,
      })),
    );
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
      console.error("Audio engine initialization failed:", error);
    }

    // Create DAW tracks from JMON sequences with proper defaults for DAW-only properties
    const demoTracks = demo01BasicSynth.sequences.map((seq, index) => {
      const baseTrack = {
        id: `track_${index}`,
        name: seq.label,
        // Musical properties from JMON
        notes: seq.notes || [],
        synthType: seq.synth?.type || "Synth",
        synthOptions: seq.synth?.options || {},
        effects: seq.effects || [],
        // DAW-only properties (not stored in JMON)
        muted: false,
        solo: false,
        volume: 0.8,
        pan: 0,
        // UI state properties (not stored in JMON) - defaults before auto-zoom
        verticalZoom: 4.0,
        verticalScroll: 0,
        height: 150,
        // Automation properties
        automation: {
          channels: [],
          enabled: true,
          visible: false
        },
      };

      // Apply auto-zoom for tracks with notes
      if (baseTrack.notes.length > 0) {
        const optimalZoom = calculateOptimalZoomForTrack(baseTrack);
        baseTrack.verticalZoom = optimalZoom.verticalZoom;
        baseTrack.verticalScroll = optimalZoom.verticalScroll;
        console.log(
          `🎯 Auto-zoom applied to demo track "${baseTrack.name}": zoom=${optimalZoom.verticalZoom.toFixed(2)}, scroll=${optimalZoom.verticalScroll.toFixed(1)}`,
        );
      }

      return baseTrack;
    });

    setTracks(demoTracks);
    setBpm(demo01BasicSynth.bpm);

    // Ensure all tracks have automation property (migration for existing data)
    dawStore.migrateTracksForAutomation();

    // Validate and fix any invalid synth types after loading demo
    dawStore.validateAndFixSynthTypes();

    // Rebuild audio graph now that tracks are created (for effect chains)
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(demo01BasicSynth, demoTracks);
    }
  },

  // Sync playhead with audio transport (for looping)
  syncPlayhead: () => {
    if (audioEngine.isInitialized && isPlaying()) {
      const transportPosition = audioEngine.getPosition();
      if (transportPosition && typeof transportPosition === "string") {
        const parts = transportPosition.split(":");
        if (parts.length === 3) {
          const bars = parseInt(parts[0], 10);
          const beats = parseInt(parts[1], 10);
          const ticks = parseFloat(parts[2]);
          const measures = bars + beats / 4 + ticks / (4 * 480);
          setCurrentTime(measures);
        }
      }
    }
  },

  // Play/pause with audio engine integration
  play: async () => {
    if (!audioEngine.isInitialized) {
      await audioEngine.init();
      audioEngine.setBpm(bpm());
    }

    // Validate and fix any invalid synth types before building audio graph
    dawStore.validateAndFixSynthTypes();

    // Always rebuild audio graph to ensure current state is used
    audioEngine.buildAudioGraph(jmonData, tracks);

    // Always clear and re-schedule all sequences to ensure audio works after pause
    audioEngine.clear();

    // Set playback position - only start at loop start if we're at position 0 or outside loop bounds
    let startTime = currentTime();
    console.log(
      `🔍 DEBUG: isLooping()=${isLooping()}, loopStart()=${loopStart()}, currentTime()=${currentTime()}`,
    );
    if (isLooping()) {
      // Only reset to loop start if we're at the very beginning (0) or outside the loop bounds
      if (
        currentTime() === 0 ||
        currentTime() < loopStart() ||
        currentTime() >= loopEnd()
      ) {
        startTime = loopStart();
        setCurrentTime(startTime); // Update UI playhead too
        console.log(`🔄 Starting playback at loop start: ${startTime}`);
      } else {
        // Resume from current position within the loop
        startTime = currentTime();
        console.log(
          `🔄 Resuming playback from current position within loop: ${startTime}`,
        );
      }
    }

    const bars = Math.floor(startTime);
    const beats = Math.floor((startTime - bars) * 4);
    const ticksRaw = ((startTime - bars) * 4 - beats) * 480;
    const ticks = Math.min(479, Math.max(0, Math.floor(ticksRaw)));
    audioEngine.setPosition(`${bars}:${beats}:${ticks}`);

    console.log(
      "🎵 Scheduling sequences for playback from position:",
      `${bars}:${beats}:${ticks}`,
    );
    if (isLooping()) {
      console.log(
        `🔄 Loop enabled: ${loopStart().toFixed(3)} to ${loopEnd().toFixed(3)} measures`,
      );
    }

    console.log(`🎵 DEBUG: About to schedule ${jmonData.sequences.length} sequences:`, jmonData.sequences.map((seq, i) => `${i}: ${seq.label} (${seq.notes?.length || 0} notes)`));
    console.log(`🎵 DEBUG: Current tracks state: ${tracks.length} tracks:`, tracks.map((t, i) => `${i}: ${t.name} (${t.notes?.length || 0} notes)`));

    jmonData.sequences.forEach((sequence, index) => {
      audioEngine.scheduleSequence(sequence, index);
      console.log(
        `🎵 Scheduled sequence ${index}: ${sequence.label} with ${sequence.notes?.length || 0} notes`,
      );
    });

    // Configure audio engine loop if looping is enabled
    if (isLooping()) {
      // Convert decimal measures to bars:beats:ticks format
      const convertMeasuresToTimeString = (measures) => {
        const bars = Math.floor(measures);
        const remainingBeats = (measures - bars) * 4;
        const beats = Math.floor(remainingBeats);
        const ticksRaw = (remainingBeats - beats) * 480;
        const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
        return `${bars}:${beats}:${ticks}`;
      };

      const loopStartTime = convertMeasuresToTimeString(loopStart());
      const loopEndTime = convertMeasuresToTimeString(loopEnd());

      audioEngine.setLoop(loopStartTime, loopEndTime);
      console.log(
        `🔄 Audio engine loop configured: ${loopStartTime} to ${loopEndTime} (measures: ${loopStart().toFixed(3)} to ${loopEnd().toFixed(3)})`,
      );
    } else {
      audioEngine.disableLoop();
      console.log(`🔄 Audio engine loop disabled`);
    }

    audioEngine.play();
    setIsPlaying(true);

    // Ensure all tracks have correct solo/mute state after starting playback
    if (audioEngine.isInitialized) {
      audioEngine.updateAllTracksSoloState(tracks);
    }

    // Playhead sync is now handled by Transport.jsx with requestAnimationFrame for smooth movement
    // The Transport component includes loop-aware positioning
    console.log(
      `🔄 Playhead sync handled by Transport.jsx requestAnimationFrame`,
    );

    // Keep the sync interval for backup/verification but make it less frequent
    if (playheadSyncInterval) clearInterval(playheadSyncInterval);
    playheadSyncInterval = setInterval(() => {
      // Occasionally sync with audio transport to prevent drift
      if (audioEngine.isInitialized && isPlaying()) {
        const transportPosition = audioEngine.getPosition();
        if (transportPosition && typeof transportPosition === "string") {
          const parts = transportPosition.split(":");
          if (parts.length === 3) {
            const bars = parseInt(parts[0], 10);
            const beats = parseInt(parts[1], 10);
            const ticks = parseFloat(parts[2]);
            const measures = bars + beats / 4 + ticks / (4 * 480);
            const currentUiTime = currentTime();

            // Only log significant drift (>0.5 measures) to avoid false positives
            // The Transport.jsx handles smooth playhead updates via requestAnimationFrame
            const drift = Math.abs(measures - currentUiTime);
            if (drift > 0.5) {
              console.log(
                `🔄 Significant drift detected: transport=${transportPosition} (${measures.toFixed(3)}) vs UI=${currentUiTime.toFixed(3)} (drift=${drift.toFixed(3)})`,
              );
              // Only sync if drift is very large (>1 measure) to avoid interference
              if (drift > 1.0) {
                console.log(`🔄 Correcting large drift by syncing to transport position`);
                setCurrentTime(measures);
              }
            }
          }
        }
      }
    }, 2000); // Check for drift every 2000ms (less frequent)
  },

  stop: () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);

    // Clear playhead sync interval
    if (playheadSyncInterval) {
      clearInterval(playheadSyncInterval);
      playheadSyncInterval = null;
    }
  },

  pause: () => {
    audioEngine.pause();

    // Sync store.currentTime with actual transport position after pause
    if (audioEngine.isInitialized) {
      const transportPosition = audioEngine.getPosition();
      console.log(`⏸️ Raw transport position: ${transportPosition}`);
      if (transportPosition && typeof transportPosition === "string") {
        const parts = transportPosition.split(":");
        if (parts.length === 3) {
          const bars = parseInt(parts[0], 10);
          const beats = parseInt(parts[1], 10);
          const ticks = parseFloat(parts[2]); // Use parseFloat to handle decimals
          // Convert to measures (store.currentTime format)
          const measures = bars + beats / 4 + ticks / (4 * 480);
          setCurrentTime(measures);
          console.log(
            `⏸️ Synced currentTime to ${measures} from transport position ${transportPosition} (bars=${bars}, beats=${beats}, ticks=${ticks})`,
          );
        }
      }
    }

    setIsPlaying(false);

    // Clear playhead sync interval
    if (playheadSyncInterval) {
      clearInterval(playheadSyncInterval);
      playheadSyncInterval = null;
    }
  },

  // Update JMON and rebuild audio graph
  updateJmonWithAudio: (data) => {
    setJmonData(data);
    if (audioEngine.isInitialized) {
      audioEngine.buildAudioGraph(data, tracks);
    }
  },

  // Test individual note (for UI feedback)
  testNote: async (noteName, synthType = "Synth", synthOptions = {}) => {
    try {
      await audioEngine.previewNote(noteName, synthType, 0.3, synthOptions);
    } catch (error) {
      console.warn("Note test failed:", error);
    }
  },

  // Timeline controls
  setTimelineZoom: (zoom) => setTimelineZoom(Math.max(0.1, Math.min(5, zoom))),
  setTimelineScroll: (scroll) => setTimelineScroll(Math.max(0, scroll)),
  zoomIn: () => setTimelineZoom(Math.min(5, timelineZoom() * 1.2)),
  zoomOut: () => setTimelineZoom(Math.max(0.1, timelineZoom() / 1.2)),

  // Auto-zoom timeline to fit all tracks
  autoZoomTimeline: () => {
    console.log(`🎯 Timeline auto-zoom triggered for ${tracks.length} tracks`);
    const optimalSettings = calculateOptimalTimelineZoom(tracks);
    setTimelineZoom(optimalSettings.timelineZoom);
    setTimelineScroll(optimalSettings.timelineScroll);
    console.log(
      `🎯 Timeline auto-zoom applied: zoom=${optimalSettings.timelineZoom.toFixed(2)}, scroll=${optimalSettings.timelineScroll.toFixed(1)}`,
    );
  },

  // Undo/Redo actions
  undo: () => {
    const stack = undoStack();
    if (stack.length === 0) {
      console.log("⚠️ Nothing to undo");
      return;
    }

    // Save current state to redo stack before undoing
    const currentState = captureCurrentState();
    const redoList = redoStack();
    setRedoStack([
      ...redoList,
      { ...currentState, description: "Redo action" },
    ]);

    // Remove and restore the last state from undo stack
    const stateToRestore = stack[stack.length - 1];
    setUndoStack(stack.slice(0, -1));

    restoreState(stateToRestore);
    console.log(`↶ Undo: ${stateToRestore.description}`);
  },

  redo: () => {
    const stack = redoStack();
    if (stack.length === 0) {
      console.log("⚠️ Nothing to redo");
      return;
    }

    // Save current state to undo stack before redoing
    const currentState = captureCurrentState();
    const undoList = undoStack();
    setUndoStack([
      ...undoList,
      { ...currentState, description: "Undo action" },
    ]);

    // Remove and restore the last state from redo stack
    const stateToRestore = stack[stack.length - 1];
    setRedoStack(stack.slice(0, -1));

    restoreState(stateToRestore);
    console.log(`↷ Redo: ${stateToRestore.description}`);
  },

  // Record action in undo history
  recordAction: (description) => {
    pushToUndoStack(description);
  },

  // Notification system methods
  notifications: notifications,
  addNotification: addNotification,
  removeNotification: removeNotification,
  clearNotifications: clearNotifications,
  addPolyphonyWarning: (trackLabel, synthType, details) => {
    console.log(`🎯 STORE: addPolyphonyWarning called with:`, { trackLabel, synthType, details });
    
    const title = `Polyphony Warning - ${trackLabel}`;
    const message = `Track "${trackLabel}" using "${synthType}" has overlapping notes. Only the last note will be heard.`;
    
    // Check if we already have an active warning for this track
    const warningKey = title;
    if (activePolyphonyWarnings.has(warningKey)) {
      console.log(`🎯 STORE: Skipping duplicate polyphony warning for:`, warningKey);
      return null;
    }
    
    console.log(`🎯 STORE: Creating new polyphony notification with title: "${title}", message: "${message}"`);
    
    // Add to active warnings set
    activePolyphonyWarnings.add(warningKey);
    
    // Create notification first to get the ID
    const id = addNotification(NOTIFICATION_TYPES.POLYPHONY, title, message, 0, null);
    console.log(`🎯 STORE: addNotification returned ID:`, id);
    
    // Now create actions with the correct ID
    const actions = [
      {
        label: 'Switch to PolySynth',
        action: () => {
          console.log(`🔧 SWITCH: Attempting to switch "${trackLabel}" to PolySynth`);
          
          // Find the sequence in JMON data and update its synth type
          const currentJmonData = jmonData;
          if (currentJmonData && currentJmonData.sequences) {
            const sequenceIndex = currentJmonData.sequences.findIndex(seq => seq.label === trackLabel);
            
            if (sequenceIndex !== -1) {
              console.log(`🔧 SWITCH: Found sequence at index ${sequenceIndex}`);
              
              // Create updated JMON data with PolySynth
              const updatedSequences = [...currentJmonData.sequences];
              updatedSequences[sequenceIndex] = {
                ...updatedSequences[sequenceIndex],
                synth: {
                  ...updatedSequences[sequenceIndex].synth,
                  type: 'PolySynth'
                }
              };
              
              const updatedJmonData = {
                ...currentJmonData,
                sequences: updatedSequences
              };
              
              console.log(`🔧 SWITCH: Updating JMON data for sequence "${trackLabel}"`);
              console.log(`🔧 SWITCH: Old synth type in JMON:`, jmonData.sequences[sequenceIndex].synth?.type);
              console.log(`🔧 SWITCH: New synth type in updated data:`, updatedJmonData.sequences[sequenceIndex].synth?.type);
              
              // Update the JMON data
              setJmonData(updatedJmonData);
              
              // Sync the DAW tracks with the updated JMON data
              const syncedTracks = syncTracksWithJmon(updatedJmonData);
              
              // Verify the data was actually updated
              setTimeout(() => {
                console.log(`🔧 SWITCH: Verifying JMON data update...`);
                const currentJmonData = jmonData; // Get current JMON data
                const currentSynthType = currentJmonData.sequences[sequenceIndex].synth?.type;
                console.log(`🔧 SWITCH: Current synth type in store:`, currentSynthType);
                
                if (currentSynthType === 'PolySynth') {
                  console.log(`✅ SWITCH: JMON data updated successfully`);
                  
                  // Force complete rebuild of audio graph with synced tracks
                  if (audioEngine.isInitialized) {
                    console.log(`🔧 SWITCH: Rebuilding audio graph with synced tracks`);
                    audioEngine.buildAudioGraph(currentJmonData, syncedTracks);
                    
                    // Additional verification after rebuild
                    setTimeout(() => {
                      console.log(`🔧 SWITCH: Verifying synth change after rebuild`);
                      
                      // Debug: verify the new synth type
                      const newSynth = audioEngine.getSequenceSynth(sequenceIndex);
                      if (newSynth) {
                        console.log(`🔧 SWITCH: New synth created: ${newSynth.constructor.name}`);
                        
                        // Additional verification
                        if (newSynth.constructor.name === 'PolySynth') {
                          console.log(`✅ SWITCH: Successfully switched to PolySynth`);
                        } else {
                          console.error(`❌ SWITCH: Expected PolySynth but got ${newSynth.constructor.name}`);
                        }
                      } else {
                        console.error(`❌ SWITCH: Failed to create new synth`);
                      }
                      
                      // Debug: show all synth types
                      if (audioEngine.debugSynthTypes) {
                        audioEngine.debugSynthTypes();
                      }
                    }, 100);
                  }
                } else {
                  console.error(`❌ SWITCH: JMON data not updated. Current type: ${currentSynthType}`);
                }
              }, 50); // Small delay to ensure state update
              
              // Trigger polyphony check after data update
              setTimeout(() => {
                console.log("🔄 Triggering polyphony check after synth switch");
                // Use the synced tracks for polyphony check
                if (window.dawStore && window.dawStore.recheckPolyphony) {
                  window.dawStore.recheckPolyphony();
                }
              }, 150);
              
              // Remove this notification
              removeNotification(id);
              
              // Add success notification
              addNotification(NOTIFICATION_TYPES.SUCCESS, 'Synth Updated', 
                `Track "${trackLabel}" now uses PolySynth for polyphonic playback.`, 3000);
                
              console.log(`🔧 SWITCH: Successfully switched "${trackLabel}" to PolySynth`);
            } else {
              console.error(`🔧 SWITCH: Could not find sequence "${trackLabel}" in JMON data`);
              addNotification(NOTIFICATION_TYPES.ERROR, 'Switch Failed', 
                `Could not find track "${trackLabel}" to update.`, 5000);
            }
          } else {
            console.error(`🔧 SWITCH: No JMON data available`);
            addNotification(NOTIFICATION_TYPES.ERROR, 'Switch Failed', 
              `No composition data available.`, 5000);
          }
        }
      },
      {
        label: 'Dismiss',
        action: () => removeNotification(id)
      }
    ];
    
    // Update the notification with actions
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, actions } : n));
    
    console.log(`🎯 STORE: Updated notification ${id} with actions`);
    return id;
  },
  NOTIFICATION_TYPES: NOTIFICATION_TYPES,

  // Force polyphony check for all tracks (useful after data changes)
  recheckPolyphony: () => {
    console.log(`🔄 STORE: recheckPolyphony called`);
    
    if (!jmonData || !jmonData.sequences) {
      console.log(`🔄 STORE: No sequences to check`);
      return;
    }
    
    console.log(`🔄 STORE: Checking polyphony for ${jmonData.sequences.length} sequences`);
    
    // Clear existing polyphony warnings
    const nonPolyphonyNotifications = notifications().filter(n => n.type !== NOTIFICATION_TYPES.POLYPHONY);
    setNotifications(nonPolyphonyNotifications);
    activePolyphonyWarnings.clear();
    
    // Check each sequence
    jmonData.sequences.forEach((sequence, index) => {
      if (sequence.notes && sequence.notes.length > 0) {
        const synthType = sequence.synth?.type || 'Synth';
        console.log(`🔄 STORE: Checking sequence "${sequence.label}" with ${sequence.notes.length} notes (${synthType})`);
        
        // Use the audio engine's polyphony check
        if (window.audioEngine) {
          window.audioEngine.checkForOverlappingNotes(sequence, synthType);
        }
      }
    });
  },

  // Automation-related actions
  addAutomationChannel: (trackId, channelType, channelData) => {
    // Record state before action
    pushToUndoStack("Add automation channel");

    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    const newChannel = {
      id: `${channelType}_${Date.now()}`,
      type: channelType,
      name: channelData.name || channelType,
      range: channelData.range || [0, 127],
      color: channelData.color || '#6c757d',
      points: channelData.points || [
        { time: 0, value: channelData.defaultValue || 0 },
        { time: 4, value: channelData.defaultValue || 0 }
      ],
      visible: true,
      customCC: channelData.customCC || null
    };

    setTracks(trackIndex, 'automation', 'channels', prev => [...prev, newChannel]);
    
    console.log(`🎛️ Added automation channel ${newChannel.name} to track ${trackId}`);
  },

  removeAutomationChannel: (trackId, channelId) => {
    // Record state before action
    pushToUndoStack("Remove automation channel");

    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    setTracks(trackIndex, 'automation', 'channels', prev => 
      prev.filter(channel => channel.id !== channelId)
    );
    
    console.log(`🎛️ Removed automation channel ${channelId} from track ${trackId}`);
  },

  updateAutomationChannel: (trackId, channelId, updates) => {
    // Record state before action
    pushToUndoStack("Update automation channel");

    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    const channelIndex = tracks[trackIndex].automation.channels.findIndex(
      channel => channel.id === channelId
    );
    if (channelIndex === -1) return;

    setTracks(trackIndex, 'automation', 'channels', channelIndex, updates);
    
    console.log(`🎛️ Updated automation channel ${channelId} on track ${trackId}`);
  },

  addAutomationPoint: (trackId, channelId, time, value) => {
    // Record state before action
    pushToUndoStack("Add automation point");

    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    const channelIndex = tracks[trackIndex].automation.channels.findIndex(
      channel => channel.id === channelId
    );
    if (channelIndex === -1) return;

    const channel = tracks[trackIndex].automation.channels[channelIndex];
    const newPoints = [...channel.points];
    const existingPointIndex = newPoints.findIndex(p => Math.abs(p.time - time) < 0.1);
    
    if (existingPointIndex >= 0) {
      // Update existing point
      newPoints[existingPointIndex] = { time, value };
    } else {
      // Add new point
      newPoints.push({ time, value });
      newPoints.sort((a, b) => a.time - b.time);
    }

    setTracks(trackIndex, 'automation', 'channels', channelIndex, 'points', newPoints);
    
    console.log(`🎛️ Added/updated automation point at time ${time} with value ${value}`);
  },

  removeAutomationPoint: (trackId, channelId, pointIndex) => {
    // Record state before action
    pushToUndoStack("Remove automation point");

    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    const channelIndex = tracks[trackIndex].automation.channels.findIndex(
      channel => channel.id === channelId
    );
    if (channelIndex === -1) return;

    const channel = tracks[trackIndex].automation.channels[channelIndex];
    if (channel.points.length <= 2) return; // Keep at least 2 points

    const newPoints = channel.points.filter((_, index) => index !== pointIndex);
    setTracks(trackIndex, 'automation', 'channels', channelIndex, 'points', newPoints);
    
    console.log(`🎛️ Removed automation point at index ${pointIndex}`);
  },

  getAutomationValue: (trackId, channelId, time) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return null;

    const channel = track.automation.channels.find(c => c.id === channelId);
    if (!channel || channel.points.length === 0) return null;

    // Find the two points to interpolate between
    const points = channel.points.sort((a, b) => a.time - b.time);
    
    // If time is before first point, return first point value
    if (time <= points[0].time) return points[0].value;
    
    // If time is after last point, return last point value
    if (time >= points[points.length - 1].time) return points[points.length - 1].value;
    
    // Find the two points to interpolate between
    for (let i = 0; i < points.length - 1; i++) {
      if (time >= points[i].time && time <= points[i + 1].time) {
        const t1 = points[i].time;
        const t2 = points[i + 1].time;
        const v1 = points[i].value;
        const v2 = points[i + 1].value;
        
        // Linear interpolation
        const factor = (time - t1) / (t2 - t1);
        return v1 + (v2 - v1) * factor;
      }
    }
    
    return null;
  },

  setAutomationEnabled: (trackId, enabled) => {
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    setTracks(trackIndex, 'automation', 'enabled', enabled);
    
    console.log(`🎛️ Set automation enabled: ${enabled} for track ${trackId}`);
  },

  toggleAutomationVisible: (trackId) => {
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    // Ensure automation property exists
    if (!tracks[trackIndex].automation) {
      setTracks(trackIndex, 'automation', {
        channels: [],
        enabled: true,
        visible: false
      });
    }

    const currentVisibility = tracks[trackIndex].automation?.visible || false;
    setTracks(trackIndex, 'automation', 'visible', !currentVisibility);
    
    console.log(`🎛️ Toggled automation visibility: ${!currentVisibility} for track ${trackId}`);
  },

  setAutomationVisible: (trackId, visible) => {
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex === -1) return;

    // Ensure automation property exists
    if (!tracks[trackIndex].automation) {
      setTracks(trackIndex, 'automation', {
        channels: [],
        enabled: true,
        visible: false
      });
    }

    setTracks(trackIndex, 'automation', 'visible', visible);
    
    console.log(`🎛️ Set automation visible: ${visible} for track ${trackId}`);
  },

  // Migration function to ensure all tracks have automation property
  migrateTracksForAutomation: () => {
    tracks.forEach((track, index) => {
      if (!track.automation) {
        setTracks(index, 'automation', {
          channels: [],
          enabled: true,
          visible: false
        });
        console.log(`🔄 Migrated automation structure for track ${track.id}`);
      }
    });
  },
};


// Export a hook-like function for compatibility
export const useDawStore = () => dawStore;

