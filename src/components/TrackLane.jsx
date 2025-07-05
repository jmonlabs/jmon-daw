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
  const [contextMenu, setContextMenu] = createSignal(null);
  const [hoverNote, setHoverNote] = createSignal(null);

  let laneRef;
  let dragStartPos = { x: 0, y: 0 };
  let originalNoteData = null;

  // Analyze note range for auto-zoom
  const analyzeNoteRange = () => {
    const notes = props.track.notes || [];
    if (notes.length === 0) return { min: 60, max: 60, range: 0 };
    
    const midiNotes = notes.map(note => 
      typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note
    );
    
    const min = Math.min(...midiNotes);
    const max = Math.max(...midiNotes);
    const range = max - min;
    
    return { min, max, range };
  };

  // Calculate optimal zoom for note range
  const calculateOptimalZoom = () => {
    const { min, max, range } = analyzeNoteRange();
    const trackHeight = currentHeight();
    
    if (range === 0) return 1.0; // Conservative default for single note
    
    // Calculate what zoom would be needed to fit the actual note range in the track
    const centerMidi = 60; // C4
    const margin = 40;
    const availableHeight = trackHeight - margin;
    
    // Find the note that would be positioned furthest from center
    const maxDistanceFromCenter = Math.max(
      Math.abs(min - centerMidi),
      Math.abs(max - centerMidi)
    );
    
    // Calculate base spacing (no zoom)
    const minMidi = 24;
    const maxMidi = 84;
    const midiRange = maxMidi - minMidi;
    const baseSpacing = availableHeight / midiRange;
    
    // Calculate maximum zoom that keeps all notes within bounds
    // The furthest note should not exceed half the available height
    const maxAllowedSpacing = (availableHeight / 2) / maxDistanceFromCenter;
    const maxSafeZoom = maxAllowedSpacing / baseSpacing;
    
    // Use a conservative zoom that's 80% of the maximum safe zoom
    const optimalZoom = Math.min(Math.max(maxSafeZoom * 0.8, 0.5), 2.0);
    
    console.log(`🔍 Safe zoom calculation:`, {
      min, max, range,
      maxDistanceFromCenter,
      baseSpacing: baseSpacing.toFixed(3),
      maxAllowedSpacing: maxAllowedSpacing.toFixed(3),
      maxSafeZoom: maxSafeZoom.toFixed(3),
      optimalZoom: optimalZoom.toFixed(3)
    });
    
    return optimalZoom;
  };

  // Track dimensions - use passed trackHeight or calculate from track data
  const minHeight = props.minHeight || 80;
  const currentHeight = () => props.trackHeight || Math.max(minHeight, props.track.height || minHeight);

  // Grid spacing calculation - the space between each piano key/grid line
  const getGridSpacing = () => {
    const trackHeight = currentHeight();
    const vZoom = props.track.verticalZoom || 2.5;
    
    // Calculate spacing to fit our MIDI range within track height
    // Use a wider range to accommodate bass notes: C1 to C6 = 60 semitones
    const minMidi = 24; // C1  
    const maxMidi = 84; // C6
    const midiRange = maxMidi - minMidi; // 60 semitones
    const margin = 20; // Smaller margins
    const availableHeight = trackHeight - margin;
    const baseSpacing = availableHeight / midiRange;
    // Apply zoom directly - auto-zoom calculation ensures safe bounds
    const finalSpacing = baseSpacing * vZoom;
    
    // DEBUGGING: Log spacing calculation
    console.log(`📏 Grid spacing for track ${props.track.name}:`, {
      trackHeight,
      vZoom,
      baseSpacing: baseSpacing.toFixed(3),
      finalSpacing: finalSpacing.toFixed(3)
    });
    
    return finalSpacing;
  };
  
  // Note dimensions - reactive to vertical zoom - MATCHED to grid lines
  const noteHeight = () => {
    const gridSpacing = getGridSpacing();
    return gridSpacing * 0.8; // 80% of grid spacing to leave some visual padding
  };
  const noteSpacing = () => {
    const gridSpacing = getGridSpacing();
    return gridSpacing * 0.1; // 10% of grid spacing for padding between notes
  };

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

  // Convert duration to width
  const durationToWidth = (duration) => {
    const beatWidth = typeof props.beatWidth === 'function' ? props.beatWidth() : props.beatWidth;
    if (typeof duration === 'number') return duration * beatWidth * 4;
    
    const durationMap = {
      '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25, '32n': 0.125
    };
    
    return Math.max(20, (durationMap[duration] || 1) * beatWidth);
  };

  // Calculate pitch-based Y position for any MIDI note
  const getPitchYPosition = (midiNote) => {
    const trackHeight = currentHeight();
    const centerMidi = 60; // C4
    const noteOffset = midiNote - centerMidi;
    const centerY = trackHeight / 2;
    const spacing = getGridSpacing();
    
    // Calculate Y position: higher notes (positive offset) go up (smaller Y)
    const yPosition = centerY - (noteOffset * spacing) - noteHeight() / 2;
    
    // Clamp to track bounds
    const minY = 5;
    const maxY = trackHeight - noteHeight() - 5;
    const finalY = Math.max(minY, Math.min(maxY, yPosition));
    
    // DEBUGGING: Log every note position calculation (disabled)
    // console.log(`🎵 Note MIDI ${midiNote} (${midiToNoteName(midiNote)}):`, {
    //   trackHeight,
    //   centerMidi,
    //   noteOffset,
    //   centerY,
    //   spacing,
    //   noteHeight: noteHeight(),
    //   yPosition,
    //   finalY,
    //   trackVerticalZoom: props.track.verticalZoom
    // });
    
    return finalY;
  };

  // Note positioning - adaptive based on track height
  const getNotePosition = (noteIndex, totalNotes) => {
    const trackHeight = currentHeight();
    
    if (trackHeight > 120) {
      // In expanded mode (tall tracks), use pitch-based positioning  
      const note = props.track.notes[noteIndex];
      const midiNote = typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note;
      
      // DEBUGGING: Log note data before positioning (disabled)
      // console.log(`🎼 Processing note ${noteIndex} in track ${props.track.name}:`, {
      //   originalNote: note.note,
      //   convertedMidi: midiNote,
      //   time: note.time,
      //   duration: note.duration
      // });
      
      const yPos = getPitchYPosition(midiNote);
      
      // Debug: Log note position for C4 - disabled
      // if (midiNote === 60) {
      //   console.log('C4 Note Render:', {
      //     noteIndex,
      //     midiNote,
      //     noteName: note.note,
      //     yPosition: yPos,
      //     height: noteHeight()
      //   });
      // }
      
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
    if (draggedNote() || contextMenu()) return;
    
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
    const ticks = Math.round((remainingBeats - beatsPart) * 480);
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
        // Calculate the center Y position for this MIDI note
        const centerMidi = 60;
        const noteOffset = testMidi - centerMidi;
        const centerY = trackHeight / 2;
        const spacing = getGridSpacing();
        const pitchCenterY = centerY - (noteOffset * spacing);
        
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
      velocity: 0.8,
      id: `note_${Date.now()}_${Math.random()}`
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
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      note,
      noteIndex,
      type: 'note'
    });
  };

  const handleDeleteNote = (noteIndex) => {
    const toDelete = selectedNotes().size > 0 ? selectedNotes() : new Set([noteIndex]);
    const updatedNotes = props.track.notes.filter((_, index) => !toDelete.has(index));
    store.updateTrack(props.track.id, { notes: updatedNotes });
    setSelectedNotes(new Set());
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!draggedNote()) return;
    
    const rect = laneRef.getBoundingClientRect();
    const currentX = e.clientX - rect.left + props.timelineScroll;
    const currentY = e.clientY - rect.top;
    
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
    const ticks = Math.round((remainingBeats - beatsPart) * 480);
    const newTimeString = `${bars}:${beatsPart}:${ticks}`;
    
    // Calculate new pitch if in expanded mode
    let newMidiNote = originalNoteData.midiNote;
    const trackHeight = currentHeight();
    if (trackHeight > 120) {
      // Find the closest MIDI note by checking which grid line the drag position is closest to
      let closestMidi = originalNoteData.midiNote; // Default to original
      let closestDistance = Infinity;
      
      for (let testMidi = 48; testMidi <= 72; testMidi++) { // Test range C3 to C5
        // Calculate the center Y position for this MIDI note
        const centerMidi = 60;
        const noteOffset = testMidi - centerMidi;
        const centerY = trackHeight / 2;
        const spacing = getGridSpacing();
        const pitchCenterY = centerY - (noteOffset * spacing);
        
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
  };

  // Handle mouse up to end dragging
  const handleMouseUp = (e) => {
    if (draggedNote()) {
      setDraggedNote(null);
      originalNoteData = null;
    }
  };

  // Add global mouse event listeners
  createEffect(() => {
    if (draggedNote()) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  // Auto-zoom effect: adjust zoom when notes change or track height changes
  createEffect(() => {
    const notes = props.track.notes || [];
    const trackHeight = currentHeight();
    
    // Only auto-zoom if track is expanded and has notes
    if (trackHeight > 120 && notes.length > 0) {
      const optimalZoom = calculateOptimalZoom();
      
      // Always apply auto-zoom when track is first loaded or when explicitly requested
      // Check if this is the initial load or if auto-zoom was explicitly requested
      const currentZoom = props.track.verticalZoom;
      const isInitialLoad = currentZoom === undefined;
      const isAutoZoomRequested = currentZoom === 2.5; // Reset to default triggers auto-zoom
      
      if (isInitialLoad || isAutoZoomRequested) {
        console.log(`🔍 Auto-zoom triggered for track ${props.track.name}:`, {
          currentZoom,
          optimalZoom,
          noteCount: notes.length,
          trackHeight,
          noteRange: analyzeNoteRange()
        });
        
        // Use setTimeout to ensure the update happens after the current render cycle
        setTimeout(() => {
          store.updateTrack(props.track.id, { 
            verticalZoom: optimalZoom,
            verticalScroll: 0 // Reset scroll when auto-zooming
          });
        }, 0);
      }
    }
  });

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
        {/* Grid Background - inside notes area */}
        <div 
          class="track-grid"
          style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
          "
        >
          {/* Grid lines will be generated here */}
          <For each={props.gridMarkers || []}>
            {(marker) => {
              const getGridOpacity = (type) => {
                switch (type) {
                  case 'bar': return '0.3';
                  case 'beat': return '0.2';
                  case '8th': return '0.1';
                  case '16th': return '0.05';
                  default: return '0.15';
                }
              };
              
              const getGridColor = (type) => {
                switch (type) {
                  case 'bar': return '#9ca3af';
                  case 'beat': return '#6b7280';
                  case '8th': return '#4b5563';
                  case '16th': return '#374151';
                  default: return '#6b7280';
                }
              };

              return (
                <div
                  style={`
                    position: absolute;
                    left: ${marker.x}px;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    background-color: ${getGridColor(marker.type)};
                    opacity: ${getGridOpacity(marker.type)};
                  `}
                />
              );
            }}
          </For>
        </div>
        {/* Piano Roll Background - Only in expanded mode */}
        <Show when={currentHeight() > 120}>
          {(() => {
            // Force reactivity by creating a reactive computation
            const trackHeight = currentHeight();
            const currentNoteHeight = noteHeight();
            const currentNoteSpacing = noteSpacing();
            const currentGridSpacing = getGridSpacing();
            const vZoom = props.track.verticalZoom || 2.5;
            const vScroll = props.track.verticalScroll || 0;
            
            // Ensure grid reacts to track zoom changes
            const spacing = currentGridSpacing;
            
            // console.log('Piano roll render triggered:', { trackHeight, currentNoteHeight, currentNoteSpacing, currentGridSpacing, vZoom });
            
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
                    
                    // DEBUGGING: Log grid line positions for key notes (disabled)
                    // if ([48, 60, 72].includes(midiNote)) {
                    //   console.log(`🎹 Grid MIDI ${midiNote} (${midiToNoteName(midiNote)}):`, {
                    //     trackHeight,
                    //     centerY,
                    //     noteOffset,
                    //     spacing,
                    //     gridCenterY: y,
                    //     renderTop: y - currentNoteHeight/2
                    //   });
                    // }


                    // Render grid line
                    return (
                      <div
                        style={`
                          position: absolute;
                          top: ${y - currentNoteHeight/2}px;
                          height: ${currentNoteHeight}px;
                          left: 0;
                          right: 0;
                          background-color: ${isBlackKey ? '#333333' : '#404040'};
                          opacity: 0.7;
                          border-bottom: 1px solid #666666;
                          z-index: 1;
                        `}
                      />
                    );
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
                onMouseEnter={() => setHoverNote(index())}
                onMouseLeave={() => setHoverNote(null)}
                onContextMenu={(e) => e.preventDefault()}
                title={`${note.note} - Vel: ${Math.round((note.velocity || 0.8) * 127)} - Dur: ${note.duration}`}
              >
                <span style="color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {typeof note.note === 'string' ? note.note : midiToNoteName(note.note)}
                </span>
              </div>
            );
          }}
        </For>
      </div>

      {/* Context Menu */}
      <Show when={contextMenu() && contextMenu().type === 'note'}>
        <div 
          class="context-menu dropdown-content has-background-dark"
          style={`
            position: fixed;
            left: ${contextMenu().x}px;
            top: ${contextMenu().y}px;
            z-index: 50;
            border: 1px solid #4b5563;
            border-radius: 4px;
            min-width: 8rem;
          `}
        >
          <a 
            class="dropdown-item has-text-light"
            onClick={() => { setContextMenu(null); }}
            style="cursor: pointer;"
          >
            <span class="icon is-small mr-1">
              <i class="fas fa-copy"></i>
            </span>
            Copy
          </a>
          <a 
            class="dropdown-item has-text-light"
            onClick={() => { setContextMenu(null); }}
            style="cursor: pointer;"
          >
            <span class="icon is-small mr-1">
              <i class="fas fa-clone"></i>
            </span>
            Duplicate
          </a>
          <hr class="dropdown-divider" />
          <a 
            class="dropdown-item has-text-danger"
            onClick={() => { handleDeleteNote(contextMenu().noteIndex); setContextMenu(null); }}
            style="cursor: pointer;"
          >
            <span class="icon is-small mr-1">
              <i class="fas fa-trash"></i>
            </span>
            Delete
          </a>
        </div>
      </Show>

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