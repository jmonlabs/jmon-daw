import { For, createSignal, Show, createEffect, createMemo } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { midiToNoteName, noteNameToMidi, snapTimeToGrid } from '../utils/noteConversion';
import { audioEngine } from '../utils/audioEngine';


// Piano keys for background - reduced density for better readability
// Show only octaves and important notes to avoid grid overcrowding
const PIANO_KEYS = [
  24, 36, 48, 60, 72, 84, // C notes (C1, C2, C3, C4, C5, C6)
  28, 40, 52, 64, 76,     // E notes (E1, E2, E3, E4, E5)
  31, 43, 55, 67, 79,     // G notes (G1, G2, G3, G4, G5)
  35, 47, 59, 71, 83      // B notes (B1, B2, B3, B4, B5)
]; // Only show key reference notes to avoid overcrowding

export default function TrackLane(props) {
  const store = useDawStore();
  const [draggedNote, setDraggedNote] = createSignal(null);
  const [selectedNotes, setSelectedNotes] = createSignal(new Set());
  const [hoverNote, setHoverNote] = createSignal(null);
  const [resizingNote, setResizingNote] = createSignal(null); // { noteIndex, edge: 'left'|'right' }

  // FORCE CODE RELOAD CHECK - VERSION 2.0
  console.log("🚀🚀🚀 TrackLane.jsx RELOADED - EFFECTS DEBUG VERSION 🚀🚀🚀");

  // Removed track property debug logging

  let laneRef;
  let dragStartPos = { x: 0, y: 0 };
  let originalNoteData = null;

  // REMOVED: Auto-zoom functions no longer needed

  // Track dimensions - use passed trackHeight or calculate from track data
  const minHeight = props.minHeight || 80;
  const currentHeight = () => props.trackHeight || Math.max(minHeight, props.track.height || minHeight);

  // Grid spacing calculation - Simple approach based on track height and zoom
  const getGridSpacing = createMemo(() => {
    const trackHeight = currentHeight();
    const zoom = props.track.verticalZoom || 1.0;
    
    // Simple calculation: divide track height by a reasonable number of visible semitones
    // At zoom=1, show about 12-16 semitones (1-1.5 octaves)
    const visibleSemitones = 12 / zoom; // More zoom = fewer visible semitones
    const spacing = (trackHeight - 40) / visibleSemitones; // 20px margin top/bottom
    
    
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
    
    // Simple approach: map MIDI notes directly to Y positions
    // Use a reference point that makes sense for the visible range
    const referenceMidi = 66; // F#4 - middle of the visible range
    const referenceY = trackHeight / 2; // Center of track
    
    const noteOffset = midiNote - referenceMidi;
    // Higher notes go up (smaller Y), lower notes go down (larger Y)
    const noteCenterY = referenceY - (noteOffset * spacing);
    const yPosition = noteCenterY - currentNoteHeight / 2;
    
    // NO CLAMPING - let notes go out of bounds naturally
    // This way notes disappear when zoomed in, which is the expected behavior
    
    // Removed debug logging - notes position as expected
    
    return yPosition;
  };

  // Note positioning - adaptive based on track height
  const getNotePosition = (noteIndex, totalNotes) => {
    const trackHeight = currentHeight();
    
    if (trackHeight > 120) {
      // In expanded mode (tall tracks), use pitch-based positioning  
      const note = props.track.notes[noteIndex];
      const midiNote = typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note;
      
      const yPos = getPitchYPosition(midiNote);
      
      return {
        y: yPos,
        height: noteHeight()
      };
    } else {
      // In compact mode, stack notes vertically with better collision detection
      const notes = props.track.notes || [];
      const notesAtSameTime = notes.filter((n, i) => {
        if (i === noteIndex) return false;
        const currentMeasure = parseTimeToMeasures(notes[noteIndex]?.time || 0);
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
    
    const rect = laneRef.getBoundingClientRect();
    const x = e.clientX - rect.left + props.timelineScroll;
    const y = e.clientY - rect.top;
    
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
      
      for (let testMidi = 48; testMidi <= 72; testMidi++) { // Test range C3 to C5
        // Use the SAME positioning logic as getPitchYPosition
        const spacing = getGridSpacing();
        const referenceMidi = 66; // F#4 - same as in getPitchYPosition
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
    
    // Handle selection
    if (!e.ctrlKey && !e.metaKey) {
      if (!selectedNotes().has(noteIndex)) {
        setSelectedNotes(new Set([noteIndex]));
      }
    } else {
      const newSelection = new Set(selectedNotes());
      if (newSelection.has(noteIndex)) {
        newSelection.delete(noteIndex);
      } else {
        newSelection.add(noteIndex);
      }
      setSelectedNotes(newSelection);
    }
    
    // Store drag data
    dragStartPos = { x: e.clientX, y: e.clientY };
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
    const toDelete = selectedNotes().size > 0 ? selectedNotes() : new Set([noteIndex]);
    const updatedNotes = props.track.notes.filter((_, index) => !toDelete.has(index));
    store.updateTrack(props.track.id, { notes: updatedNotes });
    setSelectedNotes(new Set());
  };

  // Handle note resize start
  const handleNoteResizeStart = (noteIndex, edge, e) => {
    e.stopPropagation();
    e.preventDefault();
    
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
    
    console.log(`🎯 RESIZE START [${edge}] ${note.note}:`);
    console.log(`   📍 Original: time=${note.time}, duration=${note.duration}`);
    console.log(`   📏 Measures: start=${measureTime.toFixed(3)}, duration=${measureDuration.toFixed(3)}, end=${(measureTime + measureDuration).toFixed(3)}`);
    console.log(`   🖱️ Mouse start: x=${dragStartPos.x}, y=${dragStartPos.y}`);
    
    setResizingNote({ noteIndex, edge });
  };

  // Handle mouse move for dragging and resizing
  const handleMouseMove = (e) => {
    if (!draggedNote() && !resizingNote()) return;
    
    const rect = laneRef.getBoundingClientRect();
    const currentX = e.clientX - rect.left + props.timelineScroll;
    const currentY = e.clientY - rect.top;
    
    if (resizingNote()) {
      // Handle note resizing - USE RELATIVE MOUSE MOVEMENT
      const resize = resizingNote();
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      // Convert mouse delta to measure delta
      const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
      const deltaMeasures = deltaX / barWidth;
      
      console.log(`🔧 RESIZE MOVE [${resize.edge}]:`);
      console.log(`   🖱️ Mouse: deltaX=${deltaX}px, deltaY=${deltaY}px`);
      console.log(`   📏 Conversion: barWidth=${barWidth}, deltaMeasures=${deltaMeasures.toFixed(3)}`);
      
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
        // NOTE: Disabled during resize for fluid control
        // if (store.snapEnabled) {
        //   const newBeats = newStartMeasure * 4;
        //   const snappedBeats = snapTimeToGrid(newBeats, store.snapValue);
        //   finalStartMeasure = snappedBeats / 4;
        // }
        
        // Calculate final duration - ensure minimum duration
        const finalDuration = Math.max(0.125, originalEndMeasure - finalStartMeasure); // Minimum 32nd note
        
        // Convert final start to bars:beats:ticks format
        const bars = Math.floor(finalStartMeasure);
        const remainingBeats = (finalStartMeasure - bars) * 4;
        const beatsPart = Math.floor(remainingBeats);
        const ticksRaw = (remainingBeats - beatsPart) * 480;
        const ticks = Math.min(479, Math.max(0, Math.round(ticksRaw)));
        const newTimeString = `${bars}:${beatsPart}:${ticks}`;
        
        console.log(`🔧 LEFT RESULT:`);
        console.log(`   📏 Original: start=${originalMeasure.toFixed(3)}, duration=${originalDuration.toFixed(3)}, end=${originalEndMeasure.toFixed(3)}`);
        console.log(`   📏 Raw calculation: newStart=${newStartMeasure.toFixed(3)}, snappedStart=${finalStartMeasure.toFixed(3)}`);
        console.log(`   📏 Final: start=${finalStartMeasure.toFixed(3)}, duration=${finalDuration.toFixed(3)}, end=${originalEndMeasure.toFixed(3)}`);
        console.log(`   📄 Time string: ${newTimeString}, duration: ${measuresToDuration(finalDuration)}`);
        
        updatedNotes[resize.noteIndex] = {
          ...originalNote,
          time: newTimeString,
          duration: measuresToDuration(finalDuration)
        };
      } else if (resize.edge === 'right') {
        // Resize from right edge - keep start time, change end time
        const newDuration = Math.max(0.125, originalDuration + deltaMeasures); // Minimum 32nd note
        let finalDuration = newDuration;
        
        // Apply snapping to the end time if enabled
        // NOTE: Disabled during resize for fluid control
        // if (store.snapEnabled) {
        //   const newEndMeasure = originalMeasure + newDuration;
        //   const newBeats = newEndMeasure * 4;
        //   const snappedBeats = snapTimeToGrid(newBeats, store.snapValue);
        //   const snappedEndMeasure = snappedBeats / 4;
        //   finalDuration = Math.max(0.125, snappedEndMeasure - originalMeasure);
        // }
        
        console.log(`🔧 RIGHT RESULT:`);
        console.log(`   📏 Original: start=${originalMeasure.toFixed(3)}, duration=${originalDuration.toFixed(3)}, end=${(originalMeasure + originalDuration).toFixed(3)}`);
        console.log(`   📏 Raw calculation: newDuration=${newDuration.toFixed(3)}, newEnd=${(originalMeasure + newDuration).toFixed(3)}`);
        console.log(`   📏 Final: start=${originalMeasure.toFixed(3)}, duration=${finalDuration.toFixed(3)}, end=${(originalMeasure + finalDuration).toFixed(3)}`);
        console.log(`   📄 Duration string: ${measuresToDuration(finalDuration)}`);
        
        updatedNotes[resize.noteIndex] = {
          ...originalNote,
          duration: measuresToDuration(finalDuration)
        };
      }
      
      store.updateTrack(props.track.id, { notes: updatedNotes });
    } else if (draggedNote()) {
      // Handle note dragging (existing code)
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      // Calculate new position
      const newMeasure = Math.max(0, xToMeasure(currentX));
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
        
        for (let testMidi = 48; testMidi <= 72; testMidi++) { // Test range C3 to C5
          // Use the SAME positioning logic as getPitchYPosition
          const spacing = getGridSpacing();
          const referenceMidi = 66; // F#4 - same as in getPitchYPosition
          const referenceY = trackHeight / 2; // Center of track
          const noteOffset = testMidi - referenceMidi;
          const pitchCenterY = referenceY - (noteOffset * spacing);
          
          const distance = Math.abs(currentY - pitchCenterY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMidi = testMidi;
          }
        }
        
        newMidiNote = Math.max(0, Math.min(127, closestMidi));
      }
      
      // Update note position
      const updatedNotes = [...props.track.notes];
      updatedNotes[draggedNote().index] = {
        ...originalNoteData.note,
        time: newTimeString,
        note: midiToNoteName(newMidiNote)
      };
      
      store.updateTrack(props.track.id, { notes: updatedNotes });
    }
  };

  // Handle mouse up to end dragging and resizing
  const handleMouseUp = (e) => {
    if (draggedNote()) {
      setDraggedNote(null);
      originalNoteData = null;
    }
    if (resizingNote()) {
      setResizingNote(null);
      originalNoteData = null;
    }
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

  // DISABLED: Auto-zoom effect was interfering with manual zoom controls
  // createEffect(() => {
  //   // Auto-zoom disabled to allow proper manual zoom control
  // });

  // Select this track
  const selectTrack = () => {
    store.setSelectedTrack(props.track.id);
  };

  return (
    <div
      ref={laneRef}
      class={`track-lane ${store.selectedTrack === props.track.id ? 'is-selected' : ''}`}
      style={`
        height: ${currentHeight()}px;
        position: relative;
        border-bottom: 1px solid #404040;
        background-color: ${store.selectedTrack === props.track.id ? '#2a2a2a' : '#1a1a1a'};
        cursor: crosshair;
        user-select: none;
        transition: height 0.2s ease;
      `}
      onClick={handleLaneClick}
    >
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
        `}
      >
        {/* Piano Roll Background - Only in expanded mode */}
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
                const centerMidi = 60;
                const noteOffset = midiNote - centerMidi;
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
        <For each={props.track.notes || []}>
          {(note, index) => {
            // Make these reactive to zoom changes
            const x = () => measureToX(note.time || 0);
            const width = () => durationToWidth(note.duration);
            const position = () => getNotePosition(index(), props.track.notes.length);
            const isSelected = selectedNotes().has(index());
            const isHovered = hoverNote() === index();

            return (
              <div
                class="note"
                style={`
                  position: absolute;
                  left: ${x()}px;
                  top: ${position().y}px;
                  width: ${width()}px;
                  height: ${position().height}px;
                  background: linear-gradient(135deg, #007aff 0%, #0056cc 100%);
                  border: 2px solid ${isSelected ? '#ffffff' : isHovered ? '#4a90e2' : '#007aff'};
                  border-radius: 3px;
                  color: white;
                  z-index: ${isSelected ? '20' : '15'};
                  cursor: move;
                  display: flex;
                  align-items: center;
                  padding: 0 4px;
                  box-shadow: ${isSelected ? '0 0 8px rgba(0, 122, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.3)'};
                  font-size: 0.625rem;
                  font-weight: 500;
                  transition: all 0.1s ease;
                `}
                onMouseDown={(e) => handleNoteMouseDown(note, index(), e)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onMouseEnter={() => setHoverNote(index())}
                onMouseLeave={() => setHoverNote(null)}
                onContextMenu={(e) => e.preventDefault()}
                title={`${note.note} - Vel: ${Math.round((note.velocity || 0.8) * 127)} - Dur: ${note.duration}`}
              >
                {/* Left resize handle */}
                <div
                  style={`
                    position: absolute;
                    left: 0px;
                    top: 0;
                    width: 12px;
                    height: 100%;
                    cursor: ew-resize;
                    background: ${isHovered || isSelected ? 'rgba(255,255,255,0.1)' : 'transparent'};
                    z-index: 25;
                    opacity: 1;
                    transition: opacity 0.1s ease;
                    border-left: 2px solid ${isHovered || isSelected ? 'rgba(255,255,255,0.8)' : 'transparent'};
                  `}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleNoteResizeStart(index(), 'left', e);
                  }}
                  title="Resize start time"
                >
                </div>

                {/* Note content */}
                <span style="color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                  {typeof note.note === 'string' ? note.note : midiToNoteName(note.note)}
                </span>

                {/* Right resize handle */}
                <div
                  style={`
                    position: absolute;
                    right: 0px;
                    top: 0;
                    width: 12px;
                    height: 100%;
                    cursor: ew-resize;
                    background: ${isHovered || isSelected ? 'rgba(255,255,255,0.1)' : 'transparent'};
                    z-index: 25;
                    opacity: 1;
                    transition: opacity 0.1s ease;
                    border-right: 2px solid ${isHovered || isSelected ? 'rgba(255,255,255,0.8)' : 'transparent'};
                  `}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleNoteResizeStart(index(), 'right', e);
                  }}
                  title="Resize duration"
                >
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
            background-color: #007aff;
            z-index: 25;
          " 
        />
      </Show>

    </div>
  );
}

export { midiToNoteName, noteNameToMidi };

