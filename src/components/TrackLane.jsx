import { For, createSignal, Show, createEffect } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { midiToNoteName, noteNameToMidi, snapTimeToGrid } from '../utils/noteConversion';
import { audioEngine } from '../utils/audioEngine';

// Piano keys for background (C3 to C5)
const PIANO_KEYS = Array.from({length: 25}, (_, i) => 48 + i);

export default function TrackLane(props) {
  const store = useDawStore();
  const [draggedNote, setDraggedNote] = createSignal(null);
  const [selectedNotes, setSelectedNotes] = createSignal(new Set());
  const [contextMenu, setContextMenu] = createSignal(null);
  const [hoverNote, setHoverNote] = createSignal(null);

  let laneRef;
  let dragStartPos = { x: 0, y: 0 };
  let originalNoteData = null;

  // Track dimensions - use passed trackHeight or calculate from track data
  const minHeight = props.minHeight || 80;
  const currentHeight = () => props.trackHeight || Math.max(minHeight, props.track.height || minHeight);

  // Note dimensions - reactive to vertical zoom - REDUCED to match grid lines
  const noteHeight = () => 12 * (typeof props.verticalZoom === 'function' ? props.verticalZoom() : props.verticalZoom || 1);
  const noteSpacing = () => 4 * (typeof props.verticalZoom === 'function' ? props.verticalZoom() : props.verticalZoom || 1);

  // Convert measure position to X position  
  const measureToX = (measure) => {
    const barWidth = typeof props.barWidth === 'function' ? props.barWidth() : props.barWidth;
    return typeof measure === 'number' ? measure * barWidth : 0;
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
    
    // Use consistent spacing calculation
    const currentNoteHeight = noteHeight();
    const effectiveNoteSpacing = getGridSpacing();
    
    // Calculate Y position (same as notes)
    const yPosition = centerY - (noteOffset * effectiveNoteSpacing * 0.5) - currentNoteHeight / 2;
    
    // Debug: Log values for C4 (MIDI 60)
    if (midiNote === 60) {
      console.log('Grid C4 Debug:', {
        trackHeight,
        centerY,
        noteHeight: currentNoteHeight,
        noteSpacing: currentNoteSpacing,
        effectiveNoteSpacing,
        yPosition
      });
    }
    
    // Clamp to track bounds
    const minY = 5;
    const maxY = trackHeight - currentNoteHeight - 5;
    
    return Math.max(minY, Math.min(maxY, yPosition));
  };

  // Note positioning - adaptive based on track height
  const getNotePosition = (noteIndex, totalNotes) => {
    const trackHeight = currentHeight();
    
    if (trackHeight > 120) {
      // In expanded mode (tall tracks), use pitch-based positioning  
      const note = props.track.notes[noteIndex];
      const midiNote = typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note;
      
      const yPos = getPitchYPosition(midiNote);
      
      // Debug: Log note position for C4
      if (midiNote === 60) {
        console.log('Note C4 Debug:', {
          noteIndex,
          midiNote,
          noteName: note.note,
          yPosition: yPos,
          height: noteHeight()
        });
      }
      
      return {
        y: yPos,
        height: noteHeight()
      };
    } else {
      // In compact mode, stack notes vertically with better collision detection
      const notes = props.track.notes || [];
      const notesAtSameTime = notes.filter((n, i) => {
        if (i === noteIndex) return false;
        const currentMeasure = notes[noteIndex]?.measure || notes[noteIndex]?.time || 0;
        const otherMeasure = n.measure || n.time || 0;
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
    const snappedMeasure = store.snapEnabled ? snapTimeToGrid(measure, store.snapValue) : measure;
    
    // Default note creation
    let midiNote = 60; // Default to C4
    const trackHeight = currentHeight();
    if (trackHeight > 120) {
      // In expanded mode, use Y position to determine pitch
      // Find the closest MIDI note by checking which grid line the click is closest to
      let closestMidi = 60; // Default to C4
      let closestDistance = Infinity;
      
      for (let testMidi = 48; testMidi <= 72; testMidi++) { // Test range C3 to C5
        const testY = getPitchYPosition(testMidi);
        const distance = Math.abs(y - (testY + getGridSpacing() / 2)); // Distance to center of grid space
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMidi = testMidi;
        }
      }
      
      midiNote = Math.max(0, Math.min(127, closestMidi));
    }
    
    const newNote = {
      note: midiToNoteName(midiNote),
      measure: snappedMeasure,
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
      measure: note.measure || note.time || 0, // Support both measure and legacy time
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
    const snappedMeasure = store.snapEnabled ? snapTimeToGrid(newMeasure, store.snapValue) : newMeasure;
    
    // Calculate new pitch if in expanded mode
    let newMidiNote = originalNoteData.midiNote;
    const trackHeight = currentHeight();
    if (trackHeight > 120) {
      // Find the closest MIDI note by checking which grid line the drag position is closest to
      let closestMidi = originalNoteData.midiNote; // Default to original
      let closestDistance = Infinity;
      
      for (let testMidi = 48; testMidi <= 72; testMidi++) { // Test range C3 to C5
        const testY = getPitchYPosition(testMidi);
        const distance = Math.abs(currentY - (testY + getGridSpacing() / 2)); // Distance to center of grid space
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
      measure: snappedMeasure,
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
          transform: translateX(${-props.timelineScroll}px);
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
            const vZoom = typeof props.verticalZoom === 'function' ? props.verticalZoom() : props.verticalZoom || 1;
            
            console.log('Grid render triggered:', { trackHeight, currentNoteHeight, currentNoteSpacing, vZoom });
            
            return (
              <div class="piano-background" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1;">
                <For each={PIANO_KEYS}>
                  {(midiNote) => {
                    const noteIndex = midiNote % 12;
                    const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
                    
                    // Calculate position directly here to ensure reactivity
                    const centerMidi = 60; // C4
                    const noteOffset = midiNote - centerMidi;
                    const centerY = trackHeight / 2;
                    const effectiveNoteSpacing = getGridSpacing();
                    const yPosition = centerY - (noteOffset * effectiveNoteSpacing * 0.5) - currentNoteHeight / 2;
                    
                    // Clamp to track bounds
                    const minY = 5;
                    const maxY = trackHeight - currentNoteHeight - 5;
                    const y = Math.max(minY, Math.min(maxY, yPosition));

                    // Debug specific notes
                    if (midiNote === 60) { // C4
                      console.log('C4 Grid Line:', { 
                        midiNote, 
                        noteOffset, 
                        yPosition, 
                        clampedY: y,
                        effectiveNoteSpacing,
                        trackHeight 
                      });
                    }

                    // Render grid line
                    return (
                      <div
                        style={`
                          position: absolute;
                          top: ${y}px;
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
            const x = () => measureToX(note.measure || note.time || 0);
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