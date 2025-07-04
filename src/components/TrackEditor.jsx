import { For, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { midiToNoteName, noteNameToMidi, snapTimeToGrid } from '../utils/noteConversion';
import { audioEngine } from '../utils/audioEngine';

export default function TrackEditor(props) {
  const store = useDawStore();
  const [trackHeight, setTrackHeight] = createSignal(120); // Start with compact height
  const [isResizing, setIsResizing] = createSignal(false);
  const [draggedNote, setDraggedNote] = createSignal(null);
  const [selectedNotes, setSelectedNotes] = createSignal(new Set());
  const [contextMenu, setContextMenu] = createSignal(null);
  const [hoverNote, setHoverNote] = createSignal(null);
  const [expanded, setExpanded] = createSignal(false);
  
  let trackRef;
  let dragStartPos = { x: 0, y: 0 };
  let originalNoteData = null;

  const noteHeight = 16; // Smaller note height for compact view
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Expandable track heights
  const compactHeight = 120;
  const expandedHeight = 300;

  // Toggle track expansion
  const toggleExpanded = () => {
    const newExpanded = !expanded();
    setExpanded(newExpanded);
    setTrackHeight(newExpanded ? expandedHeight : compactHeight);
  };

  // Convert MIDI note to Y position (piano roll style)
  const noteToY = (midiNote) => {
    const C4_MIDI = 60; // Middle C
    const noteOffset = midiNote - C4_MIDI;
    const centerY = trackHeight() / 2;
    return centerY - (noteOffset * noteHeight * 0.5) - noteHeight / 2;
  };

  // Convert Y position to MIDI note
  const yToNote = (y) => {
    const C4_MIDI = 60;
    const centerY = trackHeight() / 2;
    const noteOffset = Math.round((centerY - y - noteHeight / 2) / (noteHeight * 0.5));
    return Math.max(0, Math.min(127, C4_MIDI + noteOffset));
  };

  // Convert time to X position
  const timeToX = (time) => {
    return typeof time === 'number' ? time * props.beatWidth * 4 : 0;
  };

  // Convert X position to time
  const xToTime = (x) => {
    return x / (props.beatWidth * 4);
  };

  // Convert duration to width
  const durationToWidth = (duration) => {
    if (typeof duration === 'number') return duration * props.beatWidth * 4;
    
    const durationMap = {
      '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25, '32n': 0.125
    };
    
    return (durationMap[duration] || 1) * props.beatWidth;
  };

  // Generate piano keys background
  const generatePianoKeys = () => {
    if (!expanded()) return []; // No piano keys in compact mode
    
    const keys = [];
    const centerMidi = 60; // C4
    const visibleRange = Math.ceil(trackHeight() / (noteHeight * 0.5)) + 4;
    const startNote = Math.max(0, centerMidi - Math.floor(visibleRange / 2));
    const endNote = Math.min(127, centerMidi + Math.floor(visibleRange / 2));
    
    for (let midiNote = startNote; midiNote <= endNote; midiNote++) {
      const noteIndex = midiNote % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(noteIndex);
      const isC = noteIndex === 0;
      const y = noteToY(midiNote);
      
      if (y >= -noteHeight && y <= trackHeight() + noteHeight) {
        keys.push({
          y,
          note: midiToNoteName(midiNote),
          isBlackKey,
          isC,
          midiNote
        });
      }
    }
    
    return keys;
  };

  // Track click handling for note creation
  const handleTrackClick = (e) => {
    if (draggedNote() || isResizing() || contextMenu()) return;
    
    const rect = trackRef.getBoundingClientRect();
    const x = e.clientX - rect.left + props.timelineScroll;
    const y = e.clientY - rect.top;
    
    const time = Math.max(0, xToTime(x));
    const midiNote = yToNote(y);
    
    const snappedTime = store.snapEnabled ? 
      snapTimeToGrid(time, store.snapValue) : time;
    
    const newNote = {
      note: midiToNoteName(midiNote),
      time: snappedTime,
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

  // Note interaction
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
      time: note.time,
      duration: note.duration,
      midiNote: typeof note.note === 'string' ? noteNameToMidi(note.note) : note.note
    };
    
    setDraggedNote({ note, index: noteIndex });
    previewNote(note.note, 0.15);
  };
  
  // Context menu
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

  // Note deletion
  const handleDeleteNote = (noteIndex) => {
    const toDelete = selectedNotes().size > 0 ? selectedNotes() : new Set([noteIndex]);
    const updatedNotes = props.track.notes.filter((_, index) => !toDelete.has(index));
    store.updateTrack(props.track.id, { notes: updatedNotes });
    setSelectedNotes(new Set());
  };

  // Mouse move handling
  const handleMouseMove = (e) => {
    const dragged = draggedNote();
    if (!dragged || !originalNoteData) return;
    
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    const updatedNotes = [...(props.track.notes || [])];
    const noteIndex = dragged.index;
    
    if (!updatedNotes[noteIndex]) return;
    
    // Move note
    const timeDelta = xToTime(deltaX);
    const newTime = Math.max(0, originalNoteData.time + timeDelta);
    const snappedTime = store.snapEnabled ? snapTimeToGrid(newTime, store.snapValue) : newTime;
    
    const noteDelta = Math.round(-deltaY / (noteHeight * 0.5));
    const newMidiNote = Math.max(0, Math.min(127, originalNoteData.midiNote + noteDelta));
    
    updatedNotes[noteIndex] = {
      ...updatedNotes[noteIndex],
      time: snappedTime,
      note: midiToNoteName(newMidiNote)
    };
    
    store.updateTrack(props.track.id, { notes: updatedNotes });
  };

  // Mouse up
  const handleMouseUp = () => {
    setDraggedNote(null);
    originalNoteData = null;
    dragStartPos = { x: 0, y: 0 };
  };
  
  // Close context menu
  const handleDocumentClick = (e) => {
    if (contextMenu() && !e.target.closest('.context-menu')) {
      setContextMenu(null);
    }
  };
  
  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
  });
  
  onCleanup(() => {
    document.removeEventListener('click', handleDocumentClick);
  });

  return (
    <div
      ref={trackRef}
      class={`track-editor ${store.selectedTrack === props.track.id ? 'is-selected' : ''}`}
      style={`
        height: ${trackHeight()}px;
        min-height: ${compactHeight}px;
        position: relative;
        border-bottom: 1px solid #404040;
        background-color: ${store.selectedTrack === props.track.id ? '#2b2b2b' : '#1a1a1a'};
        cursor: crosshair;
        user-select: none;
        transition: height 0.2s ease;
        transform: translateX(${-props.timelineScroll}px);
      `}
      onClick={handleTrackClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Track Header - Always visible */}
      <div 
        class="track-header is-absolute has-background-dark"
        style={`
          top: 0; 
          left: ${props.timelineScroll}px; 
          width: 200px; 
          height: 2rem; 
          padding: 0.25rem 0.5rem;
          border-right: 1px solid #404040;
          border-bottom: 1px solid #404040;
          z-index: 15;
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <div class="is-flex is-align-items-center">
          <span class="has-text-light has-text-weight-medium is-size-7 mr-2">
            {props.track.name}
          </span>
          <span class="has-text-grey-light is-size-7">
            ({props.track.synthType})
          </span>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
          class="button is-small is-dark"
          title={expanded() ? "Collapse track" : "Expand track"}
        >
          <span class="icon is-small">
            <i class={`fas fa-chevron-${expanded() ? 'up' : 'down'}`}></i>
          </span>
        </button>
      </div>

      {/* Piano Keys Background - Only in expanded mode */}
      <Show when={expanded()}>
        <div class="piano-keys is-absolute" style="top: 2rem; left: 0; right: 0; bottom: 0; pointer-events: none;">
          <For each={generatePianoKeys()}>
            {(key) => (
              <div
                class={`piano-key ${key.isBlackKey ? 'black-key' : 'white-key'}`}
                style={`
                  position: absolute;
                  top: ${key.y}px;
                  height: ${noteHeight}px;
                  left: 0;
                  right: 0;
                  background-color: ${key.isBlackKey ? '#2a2a2a' : '#353535'};
                  opacity: ${key.isBlackKey ? '0.6' : '0.3'};
                  border-bottom: 1px solid #404040;
                `}
              >
                <span 
                  class="note-name has-text-grey-light"
                  style={`
                    position: absolute;
                    left: 8px;
                    top: 2px;
                    font-size: 0.625rem;
                    font-family: 'Monaco', 'Menlo', monospace;
                    color: ${key.isC ? '#007aff' : '#a0a0a0'};
                    font-weight: ${key.isC ? 'bold' : 'normal'};
                  `}
                >
                  {key.note}
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Notes */}
      <div class="notes-container" style="position: absolute; top: 2rem; left: 0; right: 0; bottom: 0;">
        <For each={props.track.notes || []}>
          {(note, index) => {
            const x = timeToX(note.time);
            const width = Math.max(20, durationToWidth(note.duration));
            const midiNote = typeof note.note === 'string' ? 
              noteNameToMidi(note.note) : note.note;
            const y = noteToY(midiNote) - 32; // Offset for header
            const isSelected = selectedNotes().has(index());
            const isHovered = hoverNote() === index();

            return (
              <div
                class="note is-absolute"
                style={`
                  left: ${x}px;
                  top: ${Math.max(0, y)}px;
                  width: ${width}px;
                  height: ${noteHeight}px;
                  background: linear-gradient(135deg, #007aff 0%, #0056cc 100%);
                  border: 2px solid ${isSelected ? '#ffffff' : isHovered ? '#4a90e2' : '#007aff'};
                  border-radius: 3px;
                  color: white;
                  z-index: ${isSelected ? '20' : '10'};
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

      {/* Compact Mode Note Indicators */}
      <Show when={!expanded() && props.track.notes?.length > 0}>
        <div 
          class="compact-notes has-background-dark"
          style={`
            position: absolute;
            top: 2rem;
            left: ${props.timelineScroll}px;
            right: 0;
            height: 1rem;
            border-bottom: 1px solid #404040;
            z-index: 8;
          `}
        >
          <For each={props.track.notes}>
            {(note) => (
              <div
                style={`
                  position: absolute;
                  left: ${timeToX(note.time)}px;
                  top: 2px;
                  width: ${Math.max(4, durationToWidth(note.duration))}px;
                  height: 8px;
                  background-color: #007aff;
                  border-radius: 1px;
                `}
              />
            )}
          </For>
        </div>
      </Show>

      {/* Track Stats */}
      <div 
        class="track-stats is-absolute has-background-dark has-text-grey-light"
        style={`
          bottom: 0;
          left: ${props.timelineScroll}px;
          padding: 0.25rem 0.5rem;
          border-right: 1px solid #404040;
          font-size: 0.625rem;
          z-index: 15;
        `}
      >
        <div class="is-flex is-align-items-center">
          <span class="mr-2">Notes: {props.track.notes?.length || 0}</span>
          {props.track.muted && (
            <span class="tag is-small is-danger mr-1">M</span>
          )}
          {props.track.solo && (
            <span class="tag is-small is-warning mr-1">S</span>
          )}
          {selectedNotes().size > 0 && (
            <span class="tag is-small is-info">
              {selectedNotes().size} selected
            </span>
          )}
        </div>
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
        <div class="is-absolute has-background-primary" style="top: 0; left: 0; width: 4px; height: 100%;" />
      </Show>
    </div>
  );
}

export { midiToNoteName, noteNameToMidi };