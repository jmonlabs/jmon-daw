import { For, createSignal, Show, createEffect, createMemo } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { midiToNoteName, noteNameToMidi, snapTimeToGrid } from '../utils/noteConversion';
import { audioEngine } from '../utils/audioEngine';
import { generateTemporalGrid } from '../utils/gridUtils';


// Piano keys for background - Extended to cover full MIDI range 0-127
// Show only octaves and important notes to avoid grid overcrowding
const PIANO_KEYS = [
  // C notes (C0 to C10)
  12, 24, 36, 48, 60, 72, 84, 96, 108, 120,
  // E notes (E0 to E9)
  16, 28, 40, 52, 64, 76, 88, 100, 112, 124,
  // G notes (G0 to G9)
  19, 31, 43, 55, 67, 79, 91, 103, 115, 127,
  // Additional reference notes for better grid density
  // A notes (A0 to A9)
  21, 33, 45, 57, 69, 81, 93, 105, 117,
  // D notes (D0 to D9)
  14, 26, 38, 50, 62, 74, 86, 98, 110, 122
]; // Extended range for full MIDI coverage

export default function TrackLane(props) {
  const store = useDawStore();
  const [draggedNote, setDraggedNote] = createSignal(null);
  const [selectedNotes, setSelectedNotes] = createSignal(new Set());
  const [hoverNote, setHoverNote] = createSignal(null);
  const [hoverHandle, setHoverHandle] = createSignal(null); // { noteIndex, handle: 'left'|'right' }
  const [resizingNote, setResizingNote] = createSignal(null); // { noteIndex, edge: 'left'|'right' }
  const [tempNoteUpdates, setTempNoteUpdates] = createSignal(null); // Temporary updates during drag

  // FORCE CODE RELOAD CHECK - VERSION 2.0
  console.log("🚀🚀🚀 TrackLane.jsx RELOADED - EFFECTS DEBUG VERSION 🚀🚀🚀");

  // Removed track property debug logging

  let laneRef;
  let dragStartPos = { x: 0, y: 0 };
  let originalNoteData = null;

  // Get notes with temporary updates applied during drag
  const getDisplayNotes = () => {
    const baseNotes = props.track.notes || [];
    const updates = tempNoteUpdates();
    
    if (!updates) return baseNotes;
    
    const result = [...baseNotes];
    result[updates.noteIndex] = updates.updatedNote;
    return result;
  };

  // REMOVED: Auto-zoom functions no longer needed

  // Track dimensions - use passed trackHeight or calculate from track data
  const minHeight = props.minHeight || 80;
  const currentHeight = () => props.trackHeight || Math.max(minHeight, props.track.height || minHeight);

  // Grid spacing calculation - Improved stability for different track heights
  const getGridSpacing = createMemo(() => {
    const trackHeight = currentHeight();
    const zoom = props.track.verticalZoom || 1.0;
    
    // Base spacing calculation - more stable approach
    // Each semitone should have consistent spacing regardless of track height
    const baseSpacing = 12; // Base spacing in pixels per semitone
    const zoomedSpacing = baseSpacing * zoom;
    
    // Ensure minimum spacing for usability
    const minSpacing = 4;
    const maxSpacing = trackHeight / 12; // Don't exceed track height divided by octave
    
    const spacing = Math.max(minSpacing, Math.min(maxSpacing, zoomedSpacing));
    
    return spacing;
  });
  
  // Note dimensions - Memoized to prevent excessive re-calculations
  const noteHeight = createMemo(() => {
    const spacing = getGridSpacing();
    // Note height should be 80% of grid spacing, but at least 8px for visibility
    const result = Math.max(8, spacing * 0.8);
    
    
    return result;
  });
  const noteSpacing = createMemo(() => {
    const gridSpacing = getGridSpacing();
    return gridSpacing * 0.1; // 10% of grid spacing for padding between notes
  });

  // Convert bars:beats:ticks to measure position (number)
  const parseTimeToMeasures = (time) => {
    if (typeof time === 'number') return time; // Legacy support
    if (typeof time === 'string') {
      if (time.includes(':')) {
        // Parse "bars:beats:ticks" format
        const [bars, beats, ticks] = time.split(':').map(parseFloat);
        return bars + (beats / 4) + (ticks / (4 * 480)); // 480 ticks per beat
      }
      // Handle note values like "4n" - these are relative, return 0 for position
      return 0;
    }
    return 0;
  };

  // Convert measure position to X position  
  const measureToX = (measure) => {
    const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
    const measurePos = parseTimeToMeasures(measure);
    return measurePos * barWidth;
  };

  // Convert X position to measure
  const xToMeasure = (x) => {
    const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
    return x / barWidth;
  };

  // Convert duration string to measures
  const parseDurationToMeasures = (duration) => {
    if (typeof duration === 'number') return duration;
    
    // Check if it's a precise decimal string (new format) - must be pure number string
    if (typeof duration === 'string' && /^\d+\.?\d*$/.test(duration)) {
      return parseFloat(duration);
    }
    
    // Legacy note value mapping
    const durationMap = {
      '1n': 1, '2n': 0.5, '4n': 0.25, '8n': 0.125, '16n': 0.0625, '32n': 0.03125
    };
    
    return durationMap[duration] || 1;
  };

  // Convert measures to duration string - Use precise decimal format for better resolution
  const measuresToDuration = (measures) => {
    // For precise control during resize, store the exact measure value as a number
    // This bypasses the coarse note value quantization
    return measures.toString();
  };

  // Convert duration to width
  const durationToWidth = (duration) => {
    const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
    
    if (typeof duration === 'number') {
      return Math.max(20, duration * barWidth);
    }
    
    // Check if it's a precise decimal string (new format) - must be pure number string
    if (typeof duration === 'string' && /^\d+\.?\d*$/.test(duration)) {
      const measures = parseFloat(duration);
      return Math.max(20, measures * barWidth);
    }
    
    // Legacy note value mapping - convert to measures first
    const durationMap = {
      '1n': 1, '2n': 0.5, '4n': 0.25, '8n': 0.125, '16n': 0.0625, '32n': 0.03125
    };
    
    const measures = durationMap[duration] || 1;
    return Math.max(20, measures * barWidth);
  };


  // Calculate pitch-based Y position for any MIDI note - NO CLAMPING
  const getPitchYPosition = (midiNote) => {
    const trackHeight = currentHeight();
    const spacing = getGridSpacing();
    const currentNoteHeight = noteHeight();
    
    // Use fixed C4 (MIDI 60) as reference instead of dynamic center
    // This ensures consistent positioning regardless of note distribution
    const referenceMidi = 60; // C4
    const referenceY = trackHeight / 2; // Center of track
    
    const noteOffset = midiNote - referenceMidi;
    // Higher notes go up (smaller Y), lower notes go down (larger Y)
    const noteCenterY = referenceY - (noteOffset * spacing);
    const yPosition = noteCenterY - currentNoteHeight / 2;
    
    // NO CLAMPING - let notes go out of bounds naturally
    // This way notes disappear when zoomed in, which is the expected behavior
    
    return yPosition;
  };

  // Note positioning - adaptive based on track height
  const getNotePosition = (noteIndex, totalNotes) => {
    const trackHeight = currentHeight();
    
    if (trackHeight > 120) {
      // In expanded mode (tall tracks), use pitch-based positioning  
      const note = props.track.notes[noteIndex];
      
      // Check if this note has temporary updates (during drag)
      const tempUpdates = tempNoteUpdates();
      const effectiveNote = (tempUpdates && tempUpdates.noteIndex === noteIndex) ? tempUpdates.updatedNote : note;
      
      const midiNote = typeof effectiveNote.note === 'string' ? noteNameToMidi(effectiveNote.note) : effectiveNote.note;
      
      const yPos = getPitchYPosition(midiNote);
      
      return {
        y: yPos,
        height: noteHeight()
      };
    } else {
      // In compact mode, stack notes vertically with better collision detection
      const notes = getDisplayNotes(); // Use display notes to include temporary updates
      const currentNote = notes[noteIndex];
      
      // Find notes at the same time position
      const notesAtSameTime = notes.filter((n, i) => {
        if (i === noteIndex) return false;
        const currentMeasure = parseTimeToMeasures(currentNote?.time || 0);
        const otherMeasure = parseTimeToMeasures(n.time || 0);
        return Math.abs(currentMeasure - otherMeasure) < 0.1; // Same time position
      });
      
      const stackPosition = notesAtSameTime.length;
      const baseY = 30;
      const yStep = noteHeight() + noteSpacing();
      
      return {
        y: baseY + stackPosition * yStep,
        height: noteHeight()
      };
    }
  };

  // Handle track lane click
  const handleLaneClick = (e) => {
    if (draggedNote() || store.contextMenu) return;
    
    // Clear selection if clicking on empty space (not holding Ctrl/Cmd)
    if (!e.ctrlKey && !e.metaKey) {
      setSelectedNotes(new Set());
    }
    
    // Record state before adding new note for undo/redo
    store.recordAction('Add note');
    
    const rect = laneRef.getBoundingClientRect();
    const x = e.clientX - rect.left + props.timelineScroll;
    // Important: Add vertical scroll offset to get correct Y position
    const y = e.clientY - rect.top + (props.track.verticalScroll || 0);
    
    const measure = Math.max(0, xToMeasure(x));
    // Convert measure to beats for snapping (1 measure = 4 beats)
    const beats = measure * 4;
    const snappedBeats = store.snapEnabled ? snapTimeToGrid(beats, store.snapValue) : beats;
    const snappedMeasure = snappedBeats / 4;
    
    // Convert to bars:beats:ticks format
    const bars = Math.floor(snappedMeasure);
    const remainingBeats = (snappedMeasure - bars) * 4;
    const beatsPart = Math.floor(remainingBeats);
    const ticksRaw = (remainingBeats - beatsPart) * 480;
    const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
    const timeString = `${bars}:${beatsPart}:${ticks}`;
    
    // Default note creation
    let midiNote = 60; // Default to C4
    const trackHeight = currentHeight();
    if (trackHeight > 120) {
      // In expanded mode, use Y position to determine pitch
      // Find the closest MIDI note by checking which grid line the click is closest to
      let closestMidi = 60; // Default to C4
      let closestDistance = Infinity;
      
      // Expand the test range to allow notes below C3 and above C5
      for (let testMidi = 0; testMidi <= 127; testMidi++) { // Test full MIDI range
        // Use the SAME positioning logic as getPitchYPosition
        const spacing = getGridSpacing();
        const referenceMidi = 60; // Use fixed C4 instead of dynamic center
        const referenceY = trackHeight / 2; // Center of track
        const noteOffset = testMidi - referenceMidi;
        const pitchCenterY = referenceY - (noteOffset * spacing);
        
        const distance = Math.abs(y - pitchCenterY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMidi = testMidi;
        }
      }
      
      midiNote = Math.max(0, Math.min(127, closestMidi));
    }
    
    const newNote = {
      note: midiToNoteName(midiNote),
      time: timeString,
      duration: '4n',
      velocity: 0.8
      // Removed 'id' - not part of JMON schema
    };

    // Preview note sound
    previewNote(newNote.note, 0.3);

    const updatedNotes = [...(props.track.notes || []), newNote];
    store.updateTrack(props.track.id, { notes: updatedNotes });
    setSelectedNotes(new Set());
  };

  // Audio preview
  const previewNote = async (noteName, duration = 0.2) => {
    try {
      await audioEngine.previewNote(noteName, props.track.synthType, duration, props.track.synthOptions);
    } catch (error) {
      console.warn('Could not preview note:', error);
    }
  };

  // Note interaction handlers
  const handleNoteMouseDown = (note, noteIndex, e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    
    if (e.button === 2) {
      handleNoteContextMenu(note, noteIndex, e);
      return;
    }
    
    // Record state before starting drag for undo/redo
    store.recordAction('Move note');
    
    // Handle selection
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection with Ctrl/Cmd
      const newSelection = new Set(selectedNotes());
      if (newSelection.has(noteIndex)) {
        newSelection.delete(noteIndex);
      } else {
        newSelection.add(noteIndex);
      }
      setSelectedNotes(newSelection);
    } else {
      // Single selection without modifier
      if (!selectedNotes().has(noteIndex)) {
        setSelectedNotes(new Set([noteIndex]));
      }
      // If the note is already selected, keep the selection (for dragging)
    }
    
    // Calculate relative position within the note for more precise dragging
    const rect = laneRef.getBoundingClientRect();
    const notePosition = getNotePosition(noteIndex, (props.track.notes || []).length);
    const noteX = measureToX(note.time || 0);
    const relativeX = (e.clientX - rect.left + props.timelineScroll) - noteX;
    const relativeY = (e.clientY - rect.top + (props.track.verticalScroll || 0)) - notePosition.y;
    
    // Store drag data with relative offset
    dragStartPos = { 
      x: e.clientX, 
      y: e.clientY,
      relativeX: relativeX,
      relativeY: relativeY
    };
    originalNoteData = {
      note: { ...note },
      index: noteIndex,
      measure: parseTimeToMeasures(note.time || 0), // Convert to numeric measure
      duration: note.duration,
      midiNote: typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note
    };
    
    setDraggedNote({ note, index: noteIndex });
    previewNote(note.note, 0.15);
  };

  const handleNoteContextMenu = (note, noteIndex, e) => {
    e.preventDefault();
    store.setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note,
      noteIndex,
      type: 'note',
      trackId: props.track.id
    });
  };

  const handleDeleteNote = (noteIndex) => {
    // Record state before deleting for undo/redo
    store.recordAction('Delete note');
    
    const toDelete = selectedNotes().size > 0 ? selectedNotes() : new Set([noteIndex]);
    const updatedNotes = props.track.notes.filter((_, index) => !toDelete.has(index));
    store.updateTrack(props.track.id, { notes: updatedNotes });
    setSelectedNotes(new Set());
  };

  // Handle note resize start
  const handleNoteResizeStart = (noteIndex, edge, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Record state before starting resize for undo/redo
    store.recordAction('Resize note');
    
    const note = props.track.notes[noteIndex];
    dragStartPos = { x: e.clientX, y: e.clientY };
    const measureTime = parseTimeToMeasures(note.time || 0);
    const measureDuration = parseDurationToMeasures(note.duration);
    
    originalNoteData = {
      note: { ...note },
      index: noteIndex,
      measure: measureTime,
      duration: note.duration,
      measureDuration: measureDuration,
      midiNote: typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note
    };
    
    
    setResizingNote({ noteIndex, edge });
  };

  // Handle mouse move for dragging and resizing
  const handleMouseMove = (e) => {
    if (!draggedNote() && !resizingNote()) return;
    
    const rect = laneRef.getBoundingClientRect();
    const currentX = e.clientX - rect.left + props.timelineScroll;
    // Important: Add vertical scroll offset to get correct Y position
    const currentY = e.clientY - rect.top + (props.track.verticalScroll || 0);
    
    if (resizingNote()) {
      // Handle note resizing - USE RELATIVE MOUSE MOVEMENT
      const resize = resizingNote();
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      // Convert mouse delta to measure delta
      const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
      const deltaMeasures = deltaX / barWidth;
      
      
      const updatedNotes = [...props.track.notes];
      const originalNote = originalNoteData.note;
      const originalMeasure = originalNoteData.measure;
      const originalDuration = originalNoteData.measureDuration; // Use pre-calculated value
      
      if (resize.edge === 'left') {
        // Resize from left edge - move start time, keep end time fixed
        const originalEndMeasure = originalMeasure + originalDuration;
        const newStartMeasure = Math.max(0, originalMeasure + deltaMeasures);
        let finalStartMeasure = newStartMeasure;
        
        // Apply snapping to the new start time if enabled
        if (store.snapEnabled) {
          const newBeats = newStartMeasure * 4;
          const snappedBeats = snapTimeToGrid(newBeats, store.snapValue);
          finalStartMeasure = snappedBeats / 4;
        }
        
        // Calculate final duration - ensure minimum duration
        const finalDuration = Math.max(0.125, originalEndMeasure - finalStartMeasure); // Minimum 32nd note
        
        // Convert final start to bars:beats:ticks format
        const bars = Math.floor(finalStartMeasure);
        const remainingBeats = (finalStartMeasure - bars) * 4;
        const beatsPart = Math.floor(remainingBeats);
        const ticksRaw = (remainingBeats - beatsPart) * 480;
        const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
        const newTimeString = `${bars}:${beatsPart}:${ticks}`;
        
        // Store temporary update (don't call updateTrack yet)
        const updatedNote = {
          ...originalNote,
          time: newTimeString,
          duration: measuresToDuration(finalDuration)
        };
        
        setTempNoteUpdates({
          type: 'resize-left',
          noteIndex: resize.noteIndex,
          updatedNote
        });
      } else if (resize.edge === 'right') {
        // Resize from right edge - keep start time, change end time
        const newDuration = Math.max(0.125, originalDuration + deltaMeasures); // Minimum 32nd note
        let finalDuration = newDuration;
        
        // Apply snapping to the end time if enabled
        if (store.snapEnabled) {
          const newEndMeasure = originalMeasure + newDuration;
          const newBeats = newEndMeasure * 4;
          const snappedBeats = snapTimeToGrid(newBeats, store.snapValue);
          const snappedEndMeasure = snappedBeats / 4;
          finalDuration = Math.max(0.125, snappedEndMeasure - originalMeasure);
        }
        
        
        // Store temporary update (don't call updateTrack yet)
        const updatedNote = {
          ...originalNote,
          duration: measuresToDuration(finalDuration)
        };
        
        setTempNoteUpdates({
          type: 'resize',
          noteIndex: resize.noteIndex,
          updatedNote
        });
      }
    } else if (draggedNote()) {
      // Handle note dragging with relative offset compensation
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      // Calculate mouse position relative to note center, not note edge
      const adjustedX = currentX - (dragStartPos.relativeX || 0);
      const adjustedY = currentY - (dragStartPos.relativeY || 0);
      
      // Calculate new position
      const newMeasure = Math.max(0, xToMeasure(adjustedX));
      // Convert measure to beats for snapping (1 measure = 4 beats)
      const newBeats = newMeasure * 4;
      const snappedBeats = store.snapEnabled ? snapTimeToGrid(newBeats, store.snapValue) : newBeats;
      const snappedMeasure = snappedBeats / 4;
      
      // Convert to bars:beats:ticks format
      const bars = Math.floor(snappedMeasure);
      const remainingBeats = (snappedMeasure - bars) * 4;
      const beatsPart = Math.floor(remainingBeats);
      const ticksRaw = (remainingBeats - beatsPart) * 480;
      const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
      const newTimeString = `${bars}:${beatsPart}:${ticks}`;
      
      // Calculate new pitch if in expanded mode
      let newMidiNote = originalNoteData.midiNote;
      const trackHeight = currentHeight();
      if (trackHeight > 120) {
        // Find the closest MIDI note by checking which grid line the drag position is closest to
        let closestMidi = originalNoteData.midiNote; // Default to original
        let closestDistance = Infinity;
        
        // Expand the test range to allow full MIDI range
        for (let testMidi = 0; testMidi <= 127; testMidi++) { // Test full MIDI range
          // Use the SAME positioning logic as getPitchYPosition
          const spacing = getGridSpacing();
          const referenceMidi = 60; // Use fixed C4 instead of dynamic center
          const referenceY = trackHeight / 2; // Center of track
          const noteOffset = testMidi - referenceMidi;
          const pitchCenterY = referenceY - (noteOffset * spacing);
          
          const distance = Math.abs(adjustedY - pitchCenterY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMidi = testMidi;
          }
        }
        
        newMidiNote = Math.max(0, Math.min(127, closestMidi));
      }
      
      // Store temporary update (don't call updateTrack yet)
      const updatedNote = {
        ...originalNoteData.note,
        time: newTimeString,
        note: midiToNoteName(newMidiNote)
      };
      
      setTempNoteUpdates({
        type: 'move',
        noteIndex: draggedNote().index,
        updatedNote
      });
    }
  };

  // Handle mouse up to end dragging and resizing
  const handleMouseUp = (e) => {
    // Apply temporary changes to store if any
    if (tempNoteUpdates()) {
      const updates = tempNoteUpdates();
      const updatedNotes = [...props.track.notes];
      updatedNotes[updates.noteIndex] = updates.updatedNote;
      
      // Now save to store (this will trigger the undo/redo system properly)
      store.updateTrack(props.track.id, { notes: updatedNotes });
      
      setTempNoteUpdates(null);
    }
    
    // Clear drag states - this ensures drop shadow is properly reset
    const wasDragging = draggedNote() !== null;
    const wasResizing = resizingNote() !== null;
    
    if (wasDragging) {
      setDraggedNote(null);
      originalNoteData = null;
    }
    if (wasResizing) {
      setResizingNote(null);
      originalNoteData = null;
    }
    
    // Force a re-render to ensure UI state is properly updated
    if (wasDragging || wasResizing) {
      // Small delay to ensure the note UI is properly updated
      setTimeout(() => {
        // This will trigger a re-render to ensure all visual states are correct
        setHoverNote(null);
        setHoverHandle(null);
      }, 10);
    }
  };

  // Helper function to calculate optimal scroll position for MIDI range
  const calculateOptimalScroll = (targetMidiNote = 60) => {
    const trackHeight = currentHeight();
    const spacing = getGridSpacing();
    
    // Calculate where the target note should be positioned (center of track)
    const referenceMidi = 60; // C4
    const referenceY = trackHeight / 2;
    const noteOffset = targetMidiNote - referenceMidi;
    const targetNoteY = referenceY - (noteOffset * spacing);
    
    // Calculate scroll needed to center the target note
    const desiredCenterY = trackHeight / 2;
    const neededScroll = targetNoteY - desiredCenterY;
    
    return -neededScroll; // Negative because scroll moves content up
  };

  // Add global mouse event listeners
  createEffect(() => {
    if (draggedNote() || resizingNote()) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Add keyboard shortcuts for selection
  createEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keys when this track is selected
      if (store.selectedTrack !== props.track.id) return;
      
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        // Select all notes
        e.preventDefault();
        const allIndices = new Set();
        for (let i = 0; i < (props.track.notes || []).length; i++) {
          allIndices.add(i);
        }
        setSelectedNotes(allIndices);
      } else if (e.key === 'Escape') {
        // Deselect all
        e.preventDefault();
        setSelectedNotes(new Set());
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected notes
        if (selectedNotes().size > 0) {
          e.preventDefault();
          const updatedNotes = props.track.notes.filter((_, index) => !selectedNotes().has(index));
          store.updateTrack(props.track.id, { notes: updatedNotes });
          setSelectedNotes(new Set());
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  // DISABLED: Auto-zoom effect was interfering with manual zoom controls
  // createEffect(() => {
  //   // Auto-zoom disabled to allow proper manual zoom control
  // });

  // Select this track
  const selectTrack = () => {
    store.setSelectedTrack(props.track.id);
  };

  // Calculate the center MIDI note of the track for better zoom reference
  const getTrackCenterMidi = () => {
    const notes = props.track.notes || [];
    if (notes.length === 0) {
      return 66; // Default to F#4 if no notes
    }

    // Convert note names to MIDI numbers
    const midiNotes = notes
      .map((note) => noteNameToMidi(note.note))
      .filter((midi) => midi !== null);

    if (midiNotes.length === 0) {
      return 66; // Default to F#4 if no valid notes
    }

    const minMidi = Math.min(...midiNotes);
    const maxMidi = Math.max(...midiNotes);
    return (minMidi + maxMidi) / 2;
  };

  return (
    <div
      ref={laneRef}
      class={`track-lane ${store.selectedTrack === props.track.id ? 'is-selected' : ''}`}
      style={`
        height: ${currentHeight()}px;
        position: relative;
        border-bottom: 1px solid var(--track-border);
        background-color: ${store.selectedTrack === props.track.id ? 'var(--track-bg-selected)' : 'var(--track-bg)'};
        cursor: crosshair;
        user-select: none;
        transition: height 0.2s ease;
      `}
      onClick={handleLaneClick}
      onWheel={(e) => {
        // Only handle vertical scroll for piano roll when not holding modifier keys
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && currentHeight() > 120) {
          e.preventDefault();
          const currentScroll = props.track.verticalScroll || 0;
          const scrollDelta = e.deltaY * 0.5; // Adjust sensitivity
          // Remove minimum restriction to allow negative scroll for high notes
          const newScroll = currentScroll + scrollDelta;
          store.updateTrack(props.track.id, { verticalScroll: newScroll });
        }
      }}
    >
      {/* Temporal Grid - Fixed position behind notes */}
      <div
        class="temporal-grid"
        style={`
          position: absolute;
          top: 0;
          left: 0;
          width: 5000px;
          height: 100%;
          transform: translateX(${-props.timelineScroll}px);
          z-index: 0;
        `}
      >
        <svg width="5000" height={currentHeight()} style="position: absolute; top: 0; left: 0;">
          <For each={generateTemporalGrid(
            typeof props.beatWidth === 'function' ? props.beatWidth() : props.beatWidth,
            5000,
            props.timelineScroll
          )}>
            {(line) => (
              <line
                x1={line.x}
                y1={0}
                x2={line.x}
                y2={currentHeight()}
                stroke="#ddd"
                stroke-width={line.strokeWidth}
                opacity={line.opacity}
              />
            )}
          </For>
        </svg>
      </div>

      {/* Notes Area - Full Width */}
      <div 
        class="notes-area"
        style={`
          position: absolute;
          top: 0;
          left: 0;
          width: 5000px;
          height: 100%;
          transform: translateX(${-props.timelineScroll}px) translateY(${-(props.track.verticalScroll || 0)}px);
          z-index: 1;
        `}
      >
        {/* Piano Roll Background - Only in extended mode */}
        <Show when={currentHeight() > 120}>
          {(() => {
            // Force reactivity by creating a reactive computation
            const trackHeight = currentHeight();
            const currentNoteHeight = noteHeight();
            const currentNoteSpacing = noteSpacing();
            const currentGridSpacing = getGridSpacing();
            const vZoom = props.track.verticalZoom || 4.0;
            const vScroll = props.track.verticalScroll || 0;
            
            // Ensure grid reacts to track zoom changes
            const spacing = currentGridSpacing;
            
            
            // Filter visible keys for performance
            const visibleKeys = () => {
              const vScroll = props.track.verticalScroll || 0;
              const visibleTop = -vScroll - 50; // Add some buffer
              const visibleBottom = trackHeight - vScroll + 50;
              
              return PIANO_KEYS.filter(midiNote => {
                const referenceMidi = 60; // C4
                const noteOffset = midiNote - referenceMidi;
                const centerY = trackHeight / 2;
                const spacing = currentGridSpacing;
                const gridCenterY = centerY - (noteOffset * spacing);
                
                return gridCenterY >= visibleTop && gridCenterY <= visibleBottom;
              });
            };

            return (
              <div class="piano-background" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1;">
                <For each={visibleKeys()}>
                  {(midiNote) => {
                    const noteIndex = midiNote % 12;
                    const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
                    
                    // Calculate position using same logic as notes
                    const centerMidi = 60; // C4
                    const noteOffset = midiNote - centerMidi;
                    const centerY = trackHeight / 2;
                    const spacing = currentGridSpacing;
                    
                    // Calculate center Y position for this MIDI note
                    const gridCenterY = centerY - (noteOffset * spacing);
                    
                    // Grid line should be centered on this position
                    const y = gridCenterY;
                    


                    // Piano roll horizontal grid lines removed
                    return null;
                  }}
                </For>
              </div>
            );
          })()}
        </Show>

        {/* Notes */}
        <For each={getDisplayNotes()}>
          {(note, index) => {
            // Check if this note has temporary updates (during drag)
            const tempUpdates = tempNoteUpdates();
            const effectiveNote = (tempUpdates && tempUpdates.noteIndex === index()) ? tempUpdates.updatedNote : note;
            
            // Make these reactive to zoom changes
            const x = () => measureToX(effectiveNote.time || 0);
            const width = () => durationToWidth(effectiveNote.duration);
            const position = () => getNotePosition(index(), getDisplayNotes().length);
            const isSelected = selectedNotes().has(index());
            const isHovered = hoverNote() === index();
            const leftHandleHovered = hoverHandle()?.noteIndex === index() && hoverHandle()?.handle === 'left';
            const rightHandleHovered = hoverHandle()?.noteIndex === index() && hoverHandle()?.handle === 'right';
            const isDragging = draggedNote()?.index === index();
            const isResizing = resizingNote()?.noteIndex === index();

            return (
              <div
                class="note"
                style={`
                  position: absolute;
                  left: ${x()}px;
                  top: ${position().y}px;
                  width: ${width()}px;
                  height: ${position().height}px;
                  background-color: ${isHovered ? 'var(--note-bg-hover)' : 'var(--note-bg)'};
                  border: 2px solid ${isSelected ? 'var(--note-border-selected)' : 'var(--note-border)'};
                  border-radius: var(--radius-sm);
                  color: var(--note-text);
                  z-index: ${isSelected ? '20' : '15'};
                  cursor: move;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                  box-shadow: ${isDragging || isResizing ? 'var(--shadow-lg)' : isSelected ? '0 0 8px var(--focus-ring)' : 'var(--shadow-sm)'};
                  font-size: 0.625rem;
                  font-weight: 500;
                  transition: ${isDragging || isResizing ? 'none' : 'var(--transition-fast)'};
                  overflow: hidden;
                  transform: ${isDragging ? 'scale(1.02)' : 'scale(1)'};
                `}
                onMouseMove={(e) => {
                  // Dynamic cursor based on mouse position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relativeX = e.clientX - rect.left;
                  const noteWidth = rect.width;
                  
                  if (relativeX <= 16) {
                    e.currentTarget.style.cursor = 'ew-resize';
                  } else if (relativeX >= noteWidth - 16) {
                    e.currentTarget.style.cursor = 'ew-resize';
                  } else {
                    e.currentTarget.style.cursor = 'move';
                  }
                }}
                onMouseDown={(e) => {
                  // Check if we're in a resize handle area first
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relativeX = e.clientX - rect.left;
                  const noteWidth = rect.width;
                  
                  // If we're in the handle zones, let the handles take precedence
                  if (relativeX <= 16 || relativeX >= noteWidth - 16) {
                    return; // Let the handles handle this
                  }
                  
                  handleNoteMouseDown(note, index(), e);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onMouseEnter={() => setHoverNote(index())}
                onMouseLeave={() => setHoverNote(null)}
                onContextMenu={(e) => e.preventDefault()}
                title={`${effectiveNote.note} - Vel: ${Math.round((effectiveNote.velocity || 0.8) * 127)} - Dur: ${effectiveNote.duration}`}
              >
                {/* Left resize handle - Made more prominent and wider */}
                <div
                  style={`
                    position: absolute;
                    left: 0px;
                    top: 0;
                    width: 16px;
                    height: 100%;
                    cursor: ew-resize;
                    background: ${leftHandleHovered || isSelected ? 'var(--primary-accent)' : 'rgba(0, 122, 255, 0.3)'};
                    z-index: 30;
                    opacity: ${leftHandleHovered ? '1' : (isSelected ? '0.9' : (isHovered ? '0.7' : '0.3'))};
                    transition: var(--transition-fast);
                    border-left: 3px solid ${leftHandleHovered || isSelected ? 'var(--primary-accent)' : 'rgba(0, 122, 255, 0.6)'};
                    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  `}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleNoteResizeStart(index(), 'left', e);
                  }}
                  onMouseEnter={() => setHoverHandle({ noteIndex: index(), handle: 'left' })}
                  onMouseLeave={() => setHoverHandle(null)}
                  title="Resize start time"
                >
                  <div style={`
                    width: 2px; 
                    height: 60%; 
                    background: white; 
                    border-radius: 1px; 
                    opacity: ${leftHandleHovered ? '1' : '0.8'};
                    transform: scale(${leftHandleHovered ? '1.2' : '1'});
                    transition: var(--transition-fast);
                  `}></div>
                </div>

                {/* Note content - Centered text */}
                <span style="
                  color: var(--note-text); 
                  white-space: nowrap; 
                  overflow: hidden; 
                  text-overflow: ellipsis; 
                  flex: 1;
                  text-align: center;
                  padding: 0 20px;
                  font-weight: 600;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                ">
                  {typeof effectiveNote.note === 'string' ? effectiveNote.note : midiToNoteName(effectiveNote.note)}
                </span>

                {/* Right resize handle - Made more prominent and wider */}
                <div
                  style={`
                    position: absolute;
                    right: 0px;
                    top: 0;
                    width: 16px;
                    height: 100%;
                    cursor: ew-resize;
                    background: ${rightHandleHovered || isSelected ? 'var(--primary-accent)' : 'rgba(0, 122, 255, 0.3)'};
                    z-index: 30;
                    opacity: ${rightHandleHovered ? '1' : (isSelected ? '0.9' : (isHovered ? '0.7' : '0.3'))};
                    transition: var(--transition-fast);
                    border-right: 3px solid ${rightHandleHovered || isSelected ? 'var(--primary-accent)' : 'rgba(0, 122, 255, 0.6)'};
                    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  `}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleNoteResizeStart(index(), 'right', e);
                  }}
                  onMouseEnter={() => setHoverHandle({ noteIndex: index(), handle: 'right' })}
                  onMouseLeave={() => setHoverHandle(null)}
                  title="Resize duration"
                >
                  <div style={`
                    width: 2px; 
                    height: 60%; 
                    background: white; 
                    border-radius: 1px; 
                    opacity: ${rightHandleHovered ? '1' : '0.8'};
                    transform: scale(${rightHandleHovered ? '1.2' : '1'});
                    transition: var(--transition-fast);
                  `}></div>
                </div>
              </div>
            );
          }}
        </For>
      </div>




      {/* Selection Indicator */}
      <Show when={store.selectedTrack === props.track.id}>
        <div 
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: var(--primary-accent);
            z-index: 25;
          " 
        />
      </Show>

    </div>
  );
}

export { midiToNoteName, noteNameToMidi };

