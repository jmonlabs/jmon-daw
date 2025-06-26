import { Component, For, Show, createSignal, createEffect } from 'solid-js';
import { useProject, useView, useTransport } from '../stores/context';
import { DropZone } from './DropZone';
import { Icon } from './Icon';
import { ContextMenu } from './ContextMenu';
import { PianoRoll } from './PianoRoll';
import type { Clip, MidiNote, MidiClipContent } from '../types';

export const TrackArea: Component = () => {
  const { project, addTrack, removeTrack, removeClip, updateClip, addClip, updateTrack } = useProject();
  const { view } = useView();
  
  // Calculate zoom factor for timeline
  const timelineScale = () => view.zoom * 200; // Base 200px per beat
  
  // Convert seconds to beats for proper timeline positioning
  const secondsToBeats = (seconds: number) => {
    const bpm = transport.tempo;
    return seconds * (bpm / 60);
  };
  
  // Get grid-aligned loop positions for visual display
  // Note: transport.loopStart and transport.loopEnd are already in beats!
  const getDisplayLoopStart = () => {
    let loopStart = transport.loopStart;
    if (view.snapToGrid) {
      const snapSize = view.gridSize;
      loopStart = Math.round(loopStart / snapSize) * snapSize;
    }
    return loopStart;
  };
  
  const getDisplayLoopEnd = () => {
    let loopEnd = transport.loopEnd;
    if (view.snapToGrid) {
      const snapSize = view.gridSize;
      loopEnd = Math.round(loopEnd / snapSize) * snapSize;
    }
    return loopEnd;
  };
  const { transport, setLoopStart, setLoopEnd } = useTransport();
  const [showDropZone, setShowDropZone] = createSignal(false);
  const [contextMenu, setContextMenu] = createSignal<{
    show: boolean;
    x: number;
    y: number;
    clip: Clip | null;
    trackId: string | null;
    timePosition?: number;
  }>({ show: false, x: 0, y: 0, clip: null, trackId: null });
  const [clipboardClip, setClipboardClip] = createSignal<Clip | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = createSignal<string | null>(null);
  const [dragging, setDragging] = createSignal<{
    clip: Clip | null;
    startX: number;
    startTime: number;
  }>({ clip: null, startX: 0, startTime: 0 });
  
  const [loopDragging, setLoopDragging] = createSignal<{
    active: boolean;
    type: 'start' | 'end' | 'region' | null;
    startX: number;
    startLoopStart: number;
    startLoopEnd: number;
  }>({ active: false, type: null, startX: 0, startLoopStart: 0, startLoopEnd: 0 });

  const [noteDragging, setNoteDragging] = createSignal<{
    active: boolean;
    type: 'pitch' | 'start' | 'end' | 'position' | null;
    noteIndex: number;
    clipId: string;
    startX: number;
    startY: number;
    startTime: number;
    startDuration: number;
    startPitch: string | number;
    currentPitch?: string | number;
    mouseX?: number;
    mouseY?: number;
  }>({ 
    active: false, 
    type: null, 
    noteIndex: -1, 
    clipId: '', 
    startX: 0, 
    startY: 0, 
    startTime: 0, 
    startDuration: 0, 
    startPitch: '' 
  });

  const [pianoRollOpen, setPianoRollOpen] = createSignal<Clip | null>(null);
  const [expandedTracks, setExpandedTracks] = createSignal<Set<string>>(new Set());
  const [trackHeights, setTrackHeights] = createSignal<Map<string, number>>(new Map());
  const [selectedNote, setSelectedNote] = createSignal<{clipId: string, noteIndex: number} | null>(null);
  
  
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);

  // Helper functions for adaptive piano roll
  const getTrackColor = (track: any): {normal: string, darker: string} => {
    // Generate consistent colors based on track ID
    const colors = [
      { normal: '#4dabf7', darker: '#339af0' }, // Blue
      { normal: '#51cf66', darker: '#40c057' }, // Green  
      { normal: '#ff8cc8', darker: '#ff6bab' }, // Pink
      { normal: '#ffd43b', darker: '#fcc419' }, // Yellow
      { normal: '#ff9f43', darker: '#fd7e14' }, // Orange
      { normal: '#845ef7', darker: '#7950f2' }, // Purple
      { normal: '#20c997', darker: '#12b886' }, // Teal
      { normal: '#fa5252', darker: '#e03131' }, // Red
    ];
    
    // Use track position in project for consistent coloring
    const trackIndex = project.tracks.findIndex(t => t.id === track.id);
    return colors[trackIndex % colors.length] || colors[0];
  };
  const getTrackNoteRange = (track: any) => {
    let minNote = 127;
    let maxNote = 0;
    let hasNotes = false;

    track.clips.forEach((clip: Clip) => {
      if (clip.content.type === 'midi') {
        const midiContent = clip.content as MidiClipContent;
        midiContent.notes.forEach((note) => {
          hasNotes = true;
          const midiNumber = typeof note.note === 'string' ? getPitchFromNote(note.note) : note.note;
          minNote = Math.min(minNote, midiNumber);
          maxNote = Math.max(maxNote, midiNumber);
        });
      }
    });

    if (!hasNotes) return { min: 60, max: 72, range: 12 }; // Default to C4-C5
    
    // Add some padding
    const padding = 3;
    minNote = Math.max(24, minNote - padding);
    maxNote = Math.min(108, maxNote + padding);
    
    return { min: minNote, max: maxNote, range: maxNote - minNote + 1 };
  };

  const getAdaptiveTrackHeight = (track: any): number => {
    const noteRange = getTrackNoteRange(track);
    const isExpanded = expandedTracks().has(track.id);
    
    if (isExpanded) {
      // Expanded mode: minimum 16px per semitone for comfortable editing
      return Math.max(300, noteRange.range * 16);
    } else {
      // Compact mode: minimum 8px per semitone, minimum 120px
      return Math.max(120, noteRange.range * 8);
    }
  };

  const toggleTrackExpansion = (trackId: string) => {
    const expanded = expandedTracks();
    const newExpanded = new Set(expanded);
    
    if (expanded.has(trackId)) {
      newExpanded.delete(trackId);
    } else {
      newExpanded.add(trackId);
    }
    
    setExpandedTracks(newExpanded);
  };

  const handleAddTrack = () => {
    addTrack({
      name: `Track ${project.tracks.length + 1}`,
      type: 'instrument',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: '#3b82f6',
      clips: [],
      effects: []
    });
  };

  const handleClipRightClick = (e: MouseEvent, clip: Clip) => {
    console.log('handleClipRightClick called', clip.name, e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      clip,
      trackId: null,
      timePosition: undefined
    });
  };

  const handleTrackRightClick = (e: MouseEvent, trackId: string) => {
    console.log('handleTrackRightClick called', trackId, e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate the time position based on cursor position
    const trackElement = e.currentTarget as HTMLElement;
    const rect = trackElement.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const timePosition = relativeX / timelineScale();
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      clip: null,
      trackId,
      timePosition
    });
  };

  const handleDuplicateClip = () => {
    const clip = contextMenu().clip;
    if (clip) {
      const newClip = {
        name: `${clip.name} (Copy)`,
        start: clip.start + clip.duration,
        end: clip.start + clip.duration * 2,
        duration: clip.duration,
        type: clip.type,
        content: clip.content,
        color: clip.color
      };
      addClip(clip.trackId, newClip);
    }
  };

  const handleCopyClip = () => {
    setClipboardClip(contextMenu().clip);
  };

  const handleCutClip = () => {
    const clip = contextMenu().clip;
    if (clip) {
      setClipboardClip(clip);
      removeClip(clip.id);
    }
  };

  const handleDeleteClip = () => {
    const clip = contextMenu().clip;
    if (clip) {
      removeClip(clip.id);
    }
  };

  const handlePasteClip = () => {
    const clip = clipboardClip();
    const menu = contextMenu();
    const trackId = menu.trackId;
    if (clip && trackId) {
      const pasteTime = menu.timePosition || 0; // Use cursor position or default to 0
      
      // Apply snap to grid if enabled
      let snapPasteTime = pasteTime;
      if (view.snapToGrid) {
        const snapSize = view.gridSize;
        snapPasteTime = Math.round(pasteTime / snapSize) * snapSize;
      }
      
      const newClip = {
        name: `${clip.name} (Pasted)`,
        start: Math.max(0, snapPasteTime),
        end: Math.max(0, snapPasteTime) + clip.duration,
        duration: clip.duration,
        type: clip.type,
        content: clip.content,
        color: clip.color
      };
      addClip(trackId, newClip);
    }
  };

  const handleClipMouseDown = (e: MouseEvent, clip: Clip) => {
    if (e.button === 0) { // Left mouse button
      e.preventDefault();
      setDragging({
        clip,
        startX: e.clientX,
        startTime: clip.start
      });
      
      const handleMouseMove = (e: MouseEvent) => {
        const drag = dragging();
        if (drag.clip) {
          const deltaX = e.clientX - drag.startX;
          let deltaTime = deltaX / timelineScale(); // Scale based on zoom
          let newTime = Math.max(0, drag.startTime + deltaTime);
          
          // Apply snap to grid if enabled
          if (view.snapToGrid) {
            const snapSize = view.gridSize; // 0.25 = quarter note
            newTime = Math.round(newTime / snapSize) * snapSize;
          }
          
          updateClip(drag.clip.id, { start: newTime, end: newTime + drag.clip.duration });
        }
      };
      
      const handleMouseUp = () => {
        setDragging({ clip: null, startX: 0, startTime: 0 });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleClipDoubleClick = (e: MouseEvent, clip: Clip) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only open piano roll for MIDI clips
    if (clip.content.type === 'midi') {
      setPianoRollOpen(clip);
    }
  };

  const handleTrackLaneClick = (e: MouseEvent) => {
    // Deselect notes when clicking on empty track area
    if (e.target === e.currentTarget) {
      setSelectedNote(null);
    }
  };

  // Loop region drag handlers
  const handleLoopMouseDown = (e: MouseEvent, type: 'start' | 'end' | 'region') => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoopDragging({
      active: true,
      type,
      startX: e.clientX,
      startLoopStart: transport.loopStart,
      startLoopEnd: transport.loopEnd
    });

    const handleLoopMouseMove = (e: MouseEvent) => {
      const drag = loopDragging();
      if (!drag.active) return;

      const deltaX = e.clientX - drag.startX;
      const deltaBeats = deltaX / timelineScale();

      if (drag.type === 'start') {
        let newStart = drag.startLoopStart + deltaBeats;
        
        // Apply snap to grid if enabled
        if (view.snapToGrid) {
          const snapSize = view.gridSize;
          newStart = Math.round(newStart / snapSize) * snapSize;
          
          // Ensure constraints respect grid
          newStart = Math.max(0, newStart);
          const maxStart = transport.loopEnd - snapSize;
          if (newStart > maxStart) {
            newStart = maxStart;
          }
        } else {
          // When snap is off, use the original constraints
          newStart = Math.max(0, Math.min(newStart, transport.loopEnd - 0.25));
        }
        
        setLoopStart(newStart);
      } else if (drag.type === 'end') {
        let newEnd = drag.startLoopEnd + deltaBeats;
        
        // Apply snap to grid if enabled
        if (view.snapToGrid) {
          const snapSize = view.gridSize;
          newEnd = Math.round(newEnd / snapSize) * snapSize;
          
          // Ensure minimum distance respects grid (at least one snap unit)
          const minEnd = transport.loopStart + snapSize;
          if (newEnd < minEnd) {
            newEnd = minEnd;
          }
        } else {
          // When snap is off, use the original 0.25 minimum
          newEnd = Math.max(transport.loopStart + 0.25, newEnd);
        }
        
        setLoopEnd(newEnd);
      } else if (drag.type === 'region') {
        const regionLength = drag.startLoopEnd - drag.startLoopStart;
        let newStart = Math.max(0, drag.startLoopStart + deltaBeats);
        
        // Apply snap to grid if enabled
        if (view.snapToGrid) {
          const snapSize = view.gridSize;
          newStart = Math.round(newStart / snapSize) * snapSize;
        }
        
        setLoopStart(newStart);
        setLoopEnd(newStart + regionLength);
      }
    };

    const handleLoopMouseUp = () => {
      setLoopDragging({ active: false, type: null, startX: 0, startLoopStart: 0, startLoopEnd: 0 });
      document.removeEventListener('mousemove', handleLoopMouseMove);
      document.removeEventListener('mouseup', handleLoopMouseUp);
    };

    document.addEventListener('mousemove', handleLoopMouseMove);
    document.addEventListener('mouseup', handleLoopMouseUp);
  };

  // Note editing functions
  const getNoteFromPitch = (note: string | number): string => {
    if (typeof note === 'string') return note;
    // Convert MIDI number to note name
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteName = noteNames[note % 12];
    return `${noteName}${octave}`;
  };

  const getPitchFromNote = (note: string): number => {
    if (typeof note === 'number') return note;
    // Convert note name to MIDI number
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60; // Default to C4
    const noteName = match[1];
    const octave = parseInt(match[2]);
    const noteIndex = noteNames.indexOf(noteName);
    return (octave + 1) * 12 + noteIndex;
  };

  const handleNoteMouseDown = (e: MouseEvent, clip: Clip, noteIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (clip.content.type !== 'midi') return;
    
    // Always select the note first
    console.log(`Selecting note: clipId=${clip.id}, noteIndex=${noteIndex}`);
    setSelectedNote({clipId: clip.id, noteIndex});
    
    const midiContent = clip.content as MidiClipContent;
    const note = midiContent.notes[noteIndex];
    if (!note) return;

    console.log(`Starting drag on note: time=${note.time}, duration=${note.duration}, pitch=${note.note}`);

    // Since resize handles have their own handlers, this is always position movement
    const dragType: 'pitch' | 'start' | 'end' | 'position' = 'position';
    console.log('Note body clicked - will move note');

    let hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // Only start dragging if mouse has moved more than 3 pixels
      if (!hasMoved && (deltaX > 3 || deltaY > 3)) {
        hasMoved = true;
        console.log('Starting drag');
        setNoteDragging({
          active: true,
          type: dragType,
          noteIndex,
          clipId: clip.id,
          startX: startX,
          startY: startY,
          startTime: note.time,
          startDuration: note.duration,
          startPitch: note.note
        });
      }
      
      // Continue with existing drag logic if we've started dragging
      if (hasMoved) {
        handleNoteDrag(moveEvent);
      }
    };

    const handleMouseUp = () => {
      if (hasMoved) {
        console.log('Ending drag');
        setNoteDragging({ 
          active: false, 
          type: null, 
          noteIndex: -1, 
          clipId: '', 
          startX: 0, 
          startY: 0, 
          startTime: 0, 
          startDuration: 0, 
          startPitch: '',
          currentPitch: undefined,
          mouseX: undefined,
          mouseY: undefined
        });
      } else {
        console.log('Just a click, no drag');
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: MouseEvent, clip: Clip, noteIndex: number, dragType: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (clip.content.type !== 'midi') return;
    
    // Always select the note first
    setSelectedNote({clipId: clip.id, noteIndex});
    
    const midiContent = clip.content as MidiClipContent;
    const note = midiContent.notes[noteIndex];
    if (!note) return;

    console.log(`${dragType === 'start' ? 'Left' : 'Right'} resize handle clicked`);

    let hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // Only start dragging if mouse has moved more than 3 pixels
      if (!hasMoved && (deltaX > 3 || deltaY > 3)) {
        hasMoved = true;
        console.log(`Starting ${dragType} resize`);
        setNoteDragging({
          active: true,
          type: dragType,
          noteIndex,
          clipId: clip.id,
          startX: startX,
          startY: startY,
          startTime: note.time,
          startDuration: note.duration,
          startPitch: note.note
        });
      }
      
      // Continue with existing drag logic if we've started dragging
      if (hasMoved) {
        handleNoteDrag(moveEvent);
      }
    };

    const handleMouseUp = () => {
      if (hasMoved) {
        console.log(`Ending ${dragType} resize`);
        setNoteDragging({ 
          active: false, 
          type: null, 
          noteIndex: -1, 
          clipId: '', 
          startX: 0, 
          startY: 0, 
          startTime: 0, 
          startDuration: 0, 
          startPitch: '',
          currentPitch: undefined,
          mouseX: undefined,
          mouseY: undefined
        });
      } else {
        console.log(`Just a click on ${dragType} handle, no resize`);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleNoteDrag = (e: MouseEvent) => {
    const drag = noteDragging();
    if (!drag.active) return;

    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;
    const timeScale = timelineScale();
    const deltaTime = deltaX / timeScale;
    
    console.log(`Drag values: deltaX=${deltaX}, timeScale=${timeScale}, deltaTime=${deltaTime.toFixed(4)}, direction=${deltaX < 0 ? 'LEFT' : 'RIGHT'}`);
    
    const clip = project.tracks.find(t => t.clips.some(c => c.id === drag.clipId))?.clips.find(c => c.id === drag.clipId);
    if (!clip || clip.content.type !== 'midi') return;

    const midiContent = clip.content as MidiClipContent;
    const currentNote = midiContent.notes[drag.noteIndex];
    
    // Get track for pitch calculations
    const track = project.tracks.find(t => t.clips.some(c => c.id === drag.clipId));
    if (!track) return;
    
    const noteRange = getTrackNoteRange(track);
    const trackHeight = getAdaptiveTrackHeight(track);
    const lineHeight = trackHeight / noteRange.range;
    
    if (drag.type === 'position') {
      // Handle both time and pitch changes  
      let newTime = drag.startTime + deltaTime;
      
      // Only clamp to 0 if the result would be negative
      if (newTime < 0) {
        newTime = 0;
      }
      
      // Calculate pitch change based on vertical movement
      const pitchChange = Math.round(-deltaY / lineHeight);
      const startMidiNumber = typeof drag.startPitch === 'string' ? getPitchFromNote(drag.startPitch) : drag.startPitch;
      const newMidiNumber = Math.max(noteRange.min, Math.min(noteRange.max, startMidiNumber + pitchChange));
      const newPitch = getNoteFromPitch(newMidiNumber);
      
      console.log(`Moving note: startTime=${drag.startTime.toFixed(2)}, deltaX=${deltaX.toFixed(1)}, deltaTime=${deltaTime.toFixed(2)}, newTime=${newTime.toFixed(2)}, clamped=${newTime < drag.startTime + deltaTime ? 'YES' : 'NO'}`);
      
      if (view.snapToGrid) {
        const snapSize = view.gridSize;
        newTime = Math.round(newTime / snapSize) * snapSize;
      }

      // Update drag state for floating label
      setNoteDragging({
        ...drag,
        currentPitch: newPitch,
        mouseX: e.clientX,
        mouseY: e.clientY
      });

      const updatedNotes = [...midiContent.notes];
      updatedNotes[drag.noteIndex] = { ...currentNote, time: newTime, note: newPitch };
      
      updateClip(clip.id, {
        content: { ...midiContent, notes: updatedNotes }
      });
    } else if (drag.type === 'start') {
      let newTime = Math.max(0, drag.startTime + deltaTime);
      let newDuration = drag.startDuration - deltaTime;
      
      if (view.snapToGrid) {
        const snapSize = view.gridSize;
        newTime = Math.round(newTime / snapSize) * snapSize;
        newDuration = Math.max(snapSize, drag.startDuration - (newTime - drag.startTime));
      } else {
        newDuration = Math.max(0.25, newDuration);
      }

      const updatedNotes = [...midiContent.notes];
      updatedNotes[drag.noteIndex] = { ...currentNote, time: newTime, duration: newDuration };
      
      updateClip(clip.id, {
        content: { ...midiContent, notes: updatedNotes }
      });
    } else if (drag.type === 'end') {
      let newDuration = Math.max(0.25, drag.startDuration + deltaTime);
      
      if (view.snapToGrid) {
        const snapSize = view.gridSize;
        newDuration = Math.max(snapSize, Math.round(newDuration / snapSize) * snapSize);
      }

      const updatedNotes = [...midiContent.notes];
      updatedNotes[drag.noteIndex] = { ...currentNote, duration: newDuration };
      
      updateClip(clip.id, {
        content: { ...midiContent, notes: updatedNotes }
      });
    }
  };

  // Arrow key navigation for selected notes
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't interfere with text editing - check if focus is on input/textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.getAttribute('role') === 'textbox'
    )) {
      return; // Let the text editor handle the keys
    }
    
    const selected = selectedNote();
    if (!selected) return;
    
    const clip = project.tracks.find(t => t.clips.some(c => c.id === selected.clipId))?.clips.find(c => c.id === selected.clipId);
    if (!clip || clip.content.type !== 'midi') return;
    
    const midiContent = clip.content as MidiClipContent;
    const note = midiContent.notes[selected.noteIndex];
    if (!note) return;
    
    const track = project.tracks.find(t => t.clips.some(c => c.id === selected.clipId));
    if (!track) return;
    
    const noteRange = getTrackNoteRange(track);
    let updated = false;
    let newTime = note.time;
    let newPitch = note.note;
    
    // Calculate snap amount for horizontal movement
    const snapAmount = view.snapToGrid ? view.gridSize : 0.25; // Default to quarter note if snap is off
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newTime = Math.max(0, note.time - snapAmount);
        updated = true;
        console.log(`Arrow left: moving note from ${note.time.toFixed(2)} to ${newTime.toFixed(2)}`);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        newTime = note.time + snapAmount;
        updated = true;
        console.log(`Arrow right: moving note from ${note.time.toFixed(2)} to ${newTime.toFixed(2)}`);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const currentMidiUp = typeof note.note === 'string' ? getPitchFromNote(note.note) : note.note;
        const newMidiUp = Math.min(noteRange.max, currentMidiUp + 1);
        newPitch = getNoteFromPitch(newMidiUp);
        updated = true;
        console.log(`Arrow up: moving note from ${note.note} to ${newPitch}`);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const currentMidiDown = typeof note.note === 'string' ? getPitchFromNote(note.note) : note.note;
        const newMidiDown = Math.max(noteRange.min, currentMidiDown - 1);
        newPitch = getNoteFromPitch(newMidiDown);
        updated = true;
        console.log(`Arrow down: moving note from ${note.note} to ${newPitch}`);
        break;
    }
    
    if (updated) {
      console.log(`Arrow key updating: clipId=${clip.id}, noteIndex=${selected.noteIndex}, notesInClip=${midiContent.notes.length}`);
      const updatedNotes = [...midiContent.notes];
      updatedNotes[selected.noteIndex] = { ...note, time: newTime, note: newPitch };
      
      updateClip(clip.id, {
        content: { ...midiContent, notes: updatedNotes }
      });
    }
  };

  // Add keyboard event listener
  createEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => {
      console.log('Keyboard event fired, selectedNote:', selectedNote());
      handleKeyDown(e);
    };
    console.log('Adding keyboard event listener');
    document.addEventListener('keydown', handleKeyDownWrapper);
    
    return () => {
      console.log('Removing keyboard event listener');
      document.removeEventListener('keydown', handleKeyDownWrapper);
    };
  });

  return (
    <div class="track-area" style={`--timeline-scale: ${timelineScale()}px`}>
      <div class="timeline-header">
        <div class={`track-header-spacer ${sidebarCollapsed() ? 'collapsed' : ''}`}>
          <h3>{project.name}</h3>
          <button 
            class="sidebar-collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed())}
            title={sidebarCollapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Icon name={sidebarCollapsed() ? 'chevron-right' : 'chevron-left'} size={14} />
          </button>
        </div>
        <Show when={!sidebarCollapsed()}>
          <div class="timeline">
            <div 
              class="timeline-ruler"
              onContextMenu={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const timePosition = clickX; // Keep in pixels for context menu
                
                setContextMenu({
                  show: true,
                  x: e.clientX,
                  y: e.clientY,
                  clip: null,
                  trackId: null,
                  timePosition
                });
              }}
            >
            {/* Timeline markers with subdivisions */}
            <For each={Array.from({ length: 32 }, (_, i) => i)}>
              {(bar) => (
                <>
                  {/* Bar marker */}
                  <div class="bar-marker" style={`left: ${bar * timelineScale()}px`}>
                    {bar}
                  </div>
                  {/* Half note markers */}
                  <div class="subdivision-marker half" style={`left: ${bar * timelineScale() + timelineScale() / 2}px`}></div>
                  {/* Quarter note markers */}
                  <div class="subdivision-marker quarter" style={`left: ${bar * timelineScale() + timelineScale() / 4}px`}></div>
                  <div class="subdivision-marker quarter" style={`left: ${bar * timelineScale() + timelineScale() * 3 / 4}px`}></div>
                  {/* Eighth note markers */}
                  <div class="subdivision-marker eighth" style={`left: ${bar * timelineScale() + timelineScale() / 8}px`}></div>
                  <div class="subdivision-marker eighth" style={`left: ${bar * timelineScale() + timelineScale() * 3 / 8}px`}></div>
                  <div class="subdivision-marker eighth" style={`left: ${bar * timelineScale() + timelineScale() * 5 / 8}px`}></div>
                  <div class="subdivision-marker eighth" style={`left: ${bar * timelineScale() + timelineScale() * 7 / 8}px`}></div>
                  {/* Sixteenth note markers */}
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 3 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 5 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 7 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 9 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 11 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 13 / 16}px`}></div>
                  <div class="subdivision-marker sixteenth" style={`left: ${bar * timelineScale() + timelineScale() * 15 / 16}px`}></div>
                </>
              )}
            </For>
            {/* Loop Region */}
            <Show when={transport.isLooping}>
              <div 
                class="loop-region"
                style={`
                  left: ${getDisplayLoopStart() * timelineScale()}px; 
                  width: ${(getDisplayLoopEnd() - getDisplayLoopStart()) * timelineScale()}px;
                `}
                onMouseDown={(e) => handleLoopMouseDown(e, 'region')}
              >
                <div 
                  class="loop-start-handle" 
                  onMouseDown={(e) => handleLoopMouseDown(e, 'start')}
                ></div>
                <div 
                  class="loop-end-handle" 
                  onMouseDown={(e) => handleLoopMouseDown(e, 'end')}
                ></div>
              </div>
            </Show>
            {/* Playhead */}
            <div class="playhead" style={`left: ${secondsToBeats(transport.currentTime) * timelineScale()}px`}></div>
          </div>
        </div>
      </Show>
      </div>
      
      {/* Global Attributes Section */}
      <div class="global-attributes">
        <div class={`global-attrs-spacer ${sidebarCollapsed() ? 'collapsed' : ''}`}>
          <Show when={!sidebarCollapsed()}>
            <div class="bpm-display">
              <span class="attr-label">BPM:</span>
              <span class="attr-value">{transport.tempo}</span>
            </div>
          </Show>
        </div>
        <Show when={!sidebarCollapsed()}>
          <div class="global-attrs-timeline">
            {/* Space for tempo changes, time signature changes, etc. */}
            <div class="tempo-track">
              {/* Future: Tempo change markers will go here */}
            </div>
          </div>
        </Show>
      </div>
      
      
      <div class="main-content">
        <div class={`track-sidebar ${sidebarCollapsed() ? 'collapsed' : ''}`}>
          <div class="track-list">
            <For each={project.tracks}>
              {(track) => {
                const trackHeight = getAdaptiveTrackHeight(track);
                return (
                  <div class="track-item" style={`height: ${trackHeight}px;`}>
                    <Show when={!sidebarCollapsed()}>
                      <div class="track-item-content">
                        <div class="track-name">{track.name}</div>
                        <div class="track-controls">
                    <Show when={track.clips.some((c: Clip) => c.content.type === 'midi')}>
                      <button 
                        class={`track-btn expand ${expandedTracks().has(track.id) ? 'active' : ''}`}
                        title="Open Piano Roll"
                        onClick={() => {
                          // Find the first MIDI clip to open in piano roll
                          const midiClip = track.clips.find((c: Clip) => c.content.type === 'midi');
                          if (midiClip) {
                            setPianoRollOpen(midiClip);
                          }
                        }}
                      >
                        <Icon name="edit-3" size={12} color="var(--text-secondary)" />
                      </button>
                    </Show>
                    <button 
                      class={`track-btn volume ${showVolumeSlider() === track.id ? 'active' : ''}`} 
                      title="Volume"
                      onClick={() => {
                        setShowVolumeSlider(showVolumeSlider() === track.id ? null : track.id);
                      }}
                    >
                      <Icon name="volume-2" size={12} color={showVolumeSlider() === track.id ? 'white' : 'var(--text-secondary)'} />
                    </button>
                    <button class={`track-btn solo ${track.solo ? 'active' : ''}`} title="Solo">
                      <Icon name="headphones" size={12} color={track.solo ? 'white' : 'var(--text-secondary)'} />
                    </button>
                    <button class={`track-btn arm ${track.armed ? 'active' : ''}`} title="Arm for Recording">
                      <Icon name="circle" size={12} color={track.armed ? 'white' : 'var(--text-secondary)'} />
                    </button>
                    <div class="synth-selector-container">
                      <button 
                        class="synth-btn track-btn"
                        onClick={() => {
                          // Toggle dropdown visibility
                          const dropdown = document.querySelector(`#synth-dropdown-${track.id}`) as HTMLElement;
                          const allDropdowns = document.querySelectorAll('.synth-dropdown');
                          allDropdowns.forEach(d => d.classList.remove('show'));
                          if (dropdown) {
                            dropdown.classList.toggle('show');
                          }
                        }}
                        title={`Synth: ${track.instrument?.name || 'Synth'}`}
                      >
                        <Icon name="plug" size={12} color="var(--text-secondary)" />
                      </button>
                      <div id={`synth-dropdown-${track.id}`} class="synth-dropdown">
                        <div 
                          class="synth-dropdown-item"
                          onClick={() => {
                            updateTrack(track.id, {
                              instrument: {
                                id: `${track.id}-synth`,
                                name: 'Synth',
                                type: 'synth' as any,
                                parameters: {}
                              }
                            });
                            document.querySelector(`#synth-dropdown-${track.id}`)?.classList.remove('show');
                          }}
                        >
                          Synth
                        </div>
                        <div 
                          class="synth-dropdown-item"
                          onClick={() => {
                            updateTrack(track.id, {
                              instrument: {
                                id: `${track.id}-membraneSynth`,
                                name: 'Drum',
                                type: 'membraneSynth' as any,
                                parameters: {}
                              }
                            });
                            document.querySelector(`#synth-dropdown-${track.id}`)?.classList.remove('show');
                          }}
                        >
                          Drum
                        </div>
                        <div 
                          class="synth-dropdown-item"
                          onClick={() => {
                            updateTrack(track.id, {
                              instrument: {
                                id: `${track.id}-pluckSynth`,
                                name: 'Pluck',
                                type: 'pluckSynth' as any,
                                parameters: {}
                              }
                            });
                            document.querySelector(`#synth-dropdown-${track.id}`)?.classList.remove('show');
                          }}
                        >
                          Pluck
                        </div>
                        <div 
                          class="synth-dropdown-item"
                          onClick={() => {
                            updateTrack(track.id, {
                              instrument: {
                                id: `${track.id}-fmSynth`,
                                name: 'FM Synth',
                                type: 'fmSynth' as any,
                                parameters: {}
                              }
                            });
                            document.querySelector(`#synth-dropdown-${track.id}`)?.classList.remove('show');
                          }}
                        >
                          FM Synth
                        </div>
                        <div 
                          class="synth-dropdown-item"
                          onClick={() => {
                            updateTrack(track.id, {
                              instrument: {
                                id: `${track.id}-amSynth`,
                                name: 'AM Synth',
                                type: 'amSynth' as any,
                                parameters: {}
                              }
                            });
                            document.querySelector(`#synth-dropdown-${track.id}`)?.classList.remove('show');
                          }}
                        >
                          AM Synth
                        </div>
                      </div>
                    </div>
                    <button 
                      class="track-btn delete" 
                      title="Delete Track"
                      onClick={() => {
                        const confirmDelete = confirm(`Delete track "${track.name}"? This action cannot be undone.`);
                        if (confirmDelete) {
                          removeTrack(track.id);
                        }
                      }}
                    >
                      <Icon name="trash-2" size={10} color="var(--text-secondary)" />
                    </button>
                  </div>
                  <Show when={showVolumeSlider() === track.id}>
                    <div class="track-volume">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={track.volume}
                        class="volume-slider"
                        onInput={(e) => {
                          const newVolume = parseFloat(e.currentTarget.value);
                          updateTrack(track.id, { volume: newVolume });
                        }}
                      />
                    </div>
                  </Show>
                      </div>
                    </Show>
                    <Show when={sidebarCollapsed()}>
                      <div class="track-color-indicator" style={`background-color: ${getTrackColor(track).normal};`}></div>
                    </Show>
                  </div>
                );
              }}
            </For>
            <Show when={!sidebarCollapsed()}>
              <button class="new-track-btn" onClick={handleAddTrack}>
                <Icon name="plus" size={14} color="var(--text-secondary)" />
                <span>New Track</span>
              </button>
            </Show>
          </div>
        </div>
        <div class="tracks-container">
          {/* Playhead for tracks */}
          <div class="tracks-playhead" style={`left: ${secondsToBeats(transport.currentTime) * timelineScale()}px`}></div>
          
          
          <For each={project.tracks}>
            {(track) => {
              const trackHeight = getAdaptiveTrackHeight(track);
              const noteRange = getTrackNoteRange(track);
              const isExpanded = expandedTracks().has(track.id);
              
              return (
                <DropZone trackId={track.id}>
                  <div 
                    class={`track-lane ${isExpanded ? 'expanded' : 'compact'}`}
                    style={`height: ${trackHeight}px; position: relative;`}
                    onContextMenu={(e) => handleTrackRightClick(e, track.id)}
                    onClick={handleTrackLaneClick}
                  >
                    {/* Track Piano Roll Background */}
                    <Show when={track.clips.some((c: Clip) => c.content.type === 'midi')}>
                      <div class="track-piano-background">
                        {/* Piano roll lines */}
                        <For each={Array.from({ length: noteRange.range }, (_, i) => noteRange.max - i)}>
                          {(midiNumber) => {
                            const isBlackKey = [1, 3, 6, 8, 10].includes(midiNumber % 12);
                            const noteIndex = noteRange.max - midiNumber;
                            const lineHeight = trackHeight / noteRange.range;
                            const y = noteIndex * lineHeight;
                            
                            return (
                              <div 
                                class={`piano-line ${isBlackKey ? 'black-key' : 'white-key'}`}
                                style={`
                                  top: ${y}px;
                                  height: ${lineHeight}px;
                                  width: 100%;
                                  position: absolute;
                                  border-bottom: 1px solid ${isBlackKey ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'};
                                `}
                              >
                                <Show when={!isBlackKey && (midiNumber % 12 === 0) && isExpanded}>
                                  <span class="note-name">{getNoteFromPitch(midiNumber)}</span>
                                </Show>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </Show>

                    {/* Audio/MIDI Clips */}
                    <div class="track-clips">
                      <For each={track.clips}>
                        {(clip) => (
                          <Show 
                            when={clip.content.type === 'midi'}
                            fallback={
                              /* Audio clips */
                              <div 
                                class="audio-clip"
                                style={`
                                  left: ${clip.start * timelineScale()}px; 
                                  width: ${Math.max(clip.duration * timelineScale(), 30)}px; 
                                  background-color: ${clip.color}; 
                                  height: ${Math.min(trackHeight - 4, 68)}px;
                                  top: 2px;
                                `}
                                onContextMenu={(e) => handleClipRightClick(e, clip)}
                                onMouseDown={(e) => handleClipMouseDown(e, clip)}
                              >
                                <div class="clip-name">{clip.name}</div>
                                <Show when={(clip.content as any).waveform}>
                                  <div class="clip-waveform">
                                    <For each={(clip.content as any).waveform}>
                                      {(sample, index) => (
                                        <div 
                                          class="waveform-bar"
                                          style={`height: ${sample * 100}%; left: ${index() * 2}px`}
                                        />
                                      )}
                                    </For>
                                  </div>
                                </Show>
                              </div>
                            }
                          >
                            {/* MIDI Piano Roll Clips */}
                            <div 
                              class="midi-clip"
                              style={`
                                left: ${clip.start * timelineScale()}px; 
                                width: ${Math.max(clip.duration * timelineScale(), 30)}px; 
                                height: ${trackHeight}px;
                                top: 0;
                              `}
                              onContextMenu={(e) => handleClipRightClick(e, clip)}
                              onDoubleClick={(e) => handleClipDoubleClick(e, clip)}
                            >
                              {/* Notes rendered directly in piano roll format */}
                              {(() => {
                                // Force reactivity by accessing selectedNote outside the For loop
                                const currentSelection = selectedNote();
                                return (
                                  <For each={(clip.content as MidiClipContent).notes}>
                                    {(note, noteIndex) => {
                                      // Capture the actual index value at render time
                                      const actualIndex = noteIndex();
                                  
                                  
                                      const noteLeft = note.time * timelineScale();
                                      const noteWidth = Math.max(note.duration * timelineScale(), 12);
                                      
                                      const midiNumber = typeof note.note === 'string' ? getPitchFromNote(note.note) : note.note;
                                      
                                      // Calculate Y position using same logic as piano lines
                                      const noteIndex_pos = noteRange.max - midiNumber;
                                      const lineHeight = trackHeight / noteRange.range;
                                      const noteY = noteIndex_pos * lineHeight;
                                      const noteHeight = Math.max(lineHeight - 2, 8); // Leave 2px gap between notes
                                      
                                      const drag = noteDragging();
                                      const isBeingDragged = drag.active && drag.clipId === clip.id && drag.noteIndex === actualIndex;
                                      const isSelected = currentSelection?.clipId === clip.id && currentSelection?.noteIndex === actualIndex;
                                      
                                      // Debug selection states
                                      if (isSelected || isBeingDragged) {
                                        console.log(`Note ${actualIndex}: selected=${isSelected}, dragging=${isBeingDragged}, dragActive=${drag.active}`);
                                      }
                                  
                                  const noteName = getNoteFromPitch(midiNumber);
                                  
                                  // Note colors: white border, blue fill with velocity-based alpha
                                  const whiteBorder = '#ffffff';
                                  const blueFill = `rgba(74, 144, 226, ${Math.max(0.4, note.velocity)})`; // Blue with velocity alpha (min 0.4 for visibility)
                                  
                                  let noteColor = blueFill;
                                  let borderColor = whiteBorder;
                                  let borderWidth = '1px';
                                  
                                  if (isSelected) {
                                    noteColor = '#e0e0e0'; // Light grey when selected
                                    borderColor = '#999999';
                                    borderWidth = '2px';
                                  }
                                  
                                  // Remove yellow dragging mode - keep selected state during drag
                                  
                                  return (
                                    <div
                                      class={`piano-note ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
                                      style={`
                                        left: ${noteLeft}px;
                                        top: ${noteY + 1}px;
                                        width: ${noteWidth}px;
                                        height: ${noteHeight}px;
                                        background-color: ${noteColor};
                                        border: ${borderWidth} solid ${borderColor};
                                      `}
                                      onMouseDown={(e) => {
                                        handleNoteMouseDown(e, clip, actualIndex);
                                      }}
                                      title={`${noteName} - ${note.time.toFixed(2)}s - ${note.duration.toFixed(2)}s - vel:${(note.velocity * 127).toFixed(0)}`}
                                    >
                                      <Show when={isSelected && noteWidth > 20}>
                                        <span class="note-text">{noteName}</span>
                                      </Show>
                                      <Show when={isSelected && noteWidth > 20}>
                                        <div 
                                          class="note-resize-handle left"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleResizeMouseDown(e, clip, actualIndex, 'start');
                                          }}
                                        ></div>
                                        <div 
                                          class="note-resize-handle right"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleResizeMouseDown(e, clip, actualIndex, 'end');
                                          }}
                                        ></div>
                                      </Show>
                                      </div>
                                    );
                                  }}
                                  </For>
                                );
                              })()}
                            </div>
                          </Show>
                        )}
                      </For>
                    </div>
                  </div>
                </DropZone>
              );
            }}
          </For>
        </div>
      </div>
      
      <Show when={contextMenu().show}>
        <ContextMenu
          show={true}
          x={contextMenu().x}
          y={contextMenu().y}
          onClose={() => setContextMenu({ show: false, x: 0, y: 0, clip: null, trackId: null, timePosition: undefined })}
          onDuplicate={handleDuplicateClip}
          onCopy={handleCopyClip}
          onCut={handleCutClip}
          onPaste={handlePasteClip}
          onDelete={handleDeleteClip}
          isTrackContext={contextMenu().trackId !== null}
          hasClipboard={clipboardClip() !== null}
          timePosition={contextMenu().timePosition}
          onSetLoopStart={(time) => {
            let timeInBeats = time / timelineScale();
            
            // Apply snap to grid if enabled
            if (view.snapToGrid) {
              const snapSize = view.gridSize;
              timeInBeats = Math.round(timeInBeats / snapSize) * snapSize;
            }
            
            setLoopStart(timeInBeats);
          }}
          onSetLoopEnd={(time) => {
            let timeInBeats = time / timelineScale();
            
            // Apply snap to grid if enabled
            if (view.snapToGrid) {
              const snapSize = view.gridSize;
              timeInBeats = Math.round(timeInBeats / snapSize) * snapSize;
            }
            
            setLoopEnd(timeInBeats);
          }}
        />
      </Show>
      
      <Show when={noteDragging().active && noteDragging().type === 'pitch' && noteDragging().currentPitch}>
        <div 
          class="pitch-drag-label"
          style={`
            position: fixed;
            left: ${(noteDragging().mouseX || 0) + 10}px;
            top: ${(noteDragging().mouseY || 0) - 30}px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            border: 1px solid var(--border-color);
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          `}
        >
          {typeof noteDragging().currentPitch === 'string' 
            ? noteDragging().currentPitch 
            : getNoteFromPitch(noteDragging().currentPitch as number)
          }
        </div>
      </Show>
      
      <PianoRoll 
        clip={pianoRollOpen()}
        onClose={() => setPianoRollOpen(null)}
      />
    </div>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.track-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

.timeline-header {
  display: flex;
  height: 40px;
  border-bottom: 1px solid var(--border-color);
}

.global-attributes {
  display: flex;
  height: 30px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.global-attrs-spacer {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 6px 15px;
  box-sizing: border-box;
  transition: width 0.3s ease;
}

.global-attrs-spacer.collapsed {
  width: 50px;
  padding: 6px 8px;
}

.bpm-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.attr-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.attr-value {
  color: var(--text-primary);
  font-weight: 600;
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  min-width: 40px;
  text-align: center;
}

.global-attrs-timeline {
  flex: 1;
  background: var(--bg-secondary);
  position: relative;
}

.tempo-track {
  height: 100%;
  position: relative;
}

.track-header-spacer {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  box-sizing: border-box;
  transition: width 0.3s ease;
}

.track-header-spacer.collapsed {
  width: 50px;
  padding: 12px 8px;
}

.track-header-spacer.collapsed h3 {
  display: none;
}

.track-header-spacer h3 {
  margin: 0;
  color: var(--text-primary);
}

.main-content {
  display: flex;
  flex: 1;
}

.track-sidebar {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s ease;
}

.track-sidebar.collapsed {
  width: 50px;
}


.sidebar-collapse-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.sidebar-collapse-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tracks-container {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
  position: relative;
}


.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  height: 40px;
  box-sizing: border-box;
}

.track-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.new-track-btn {
  width: calc(100% - 30px);
  height: 40px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 8px 15px;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}

.new-track-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
  color: var(--text-primary);
}

.track-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
}

.track-item {
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  justify-content: center;
  transition: height 0.2s ease;
  position: relative;
}

.track-item-content {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  justify-content: center;
}

.track-color-indicator {
  width: 20px;
  height: 80%;
  border-radius: 3px;
  margin: auto;
}

.track-name {
  font-weight: bold;
  color: var(--text-primary);
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0;
}

.synth-selector-container {
  position: relative;
}

.synth-btn {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid var(--border-color-light);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.synth-btn:hover {
  background: var(--bg-quaternary);
}

.synth-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  min-width: 80px;
  z-index: 1000;
  margin-top: 2px;
  display: none;
}

.synth-dropdown.show {
  display: block;
}

.synth-dropdown-item {
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.1s ease;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.synth-dropdown-item:last-child {
  border-bottom: none;
}

.synth-dropdown-item:hover {
  background: var(--bg-tertiary);
}

.track-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.track-btn {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid var(--border-color-light);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.track-btn:hover {
  background: var(--bg-quaternary);
}

.track-btn.active {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.track-btn.delete {
  margin-left: 8px;
  border-color: var(--border-color);
}

.track-btn.delete:hover {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: white;
}

.volume-slider {
  width: 100%;
  height: 4px;
  background: #444;
  border-radius: 0;
  outline: none;
  -webkit-appearance: none;
  box-shadow: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: none;
}

.sequencer-area {
  display: flex;
  flex: 1;
  background: var(--bg-primary);
  overflow: hidden;
}

.timeline {
  height: 40px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  overflow-x: auto;
}

.timeline-ruler {
  height: 100%;
  position: relative;
  min-width: 6400px;
}

.bar-marker {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 2px solid var(--border-color-light);
  padding-left: 5px;
  padding-top: 5px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.subdivision-marker {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 2px solid var(--border-color);
}

.subdivision-marker.half {
  border-left-color: var(--border-color-light);
  opacity: 0.8;
  border-left-width: 2px;
}

.subdivision-marker.quarter {
  opacity: 0.6;
  border-left-width: 2px;
}

.subdivision-marker.eighth {
  opacity: 0.4;
  top: 50%;
  height: 50%;
  border-left-width: 2px;
}

.subdivision-marker.sixteenth {
  opacity: 0.3;
  top: 75%;
  height: 25%;
  border-left-color: var(--border-color);
  border-left-width: 2px;
}

.tracks-container {
  flex: 1;
  overflow: auto;
}

.empty-sequencer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.timeline {
  flex: 1;
  background: var(--bg-secondary);
  position: relative;
  overflow-x: auto;
}

.track-lane {
  border-bottom: 1px solid var(--border-color);
  position: relative;
  background: linear-gradient(90deg, transparent 0%, transparent calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) var(--timeline-scale, 200px));
  background-size: var(--timeline-scale, 200px) 100%;
  min-height: 70px;
  transition: height 0.2s ease;
}

.track-lane.compact {
  background: var(--bg-primary);
}

.track-lane.expanded {
  background: var(--bg-primary);
}

.track-clips {
  height: 100%;
  position: relative;
}

.clip {
  position: absolute;
  top: 1px;
  height: 68px;
  background: #3b82f6;
  border-radius: 2px;
  padding: 8px;
  font-size: 0.8rem;
  color: white;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: none;
  box-sizing: border-box;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--accent-primary);
  z-index: 1200;
  pointer-events: none;
}

.tracks-playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--accent-primary);
  z-index: 1200;
  pointer-events: none;
}

.loop-region {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(206, 145, 135, 0.2);
  border: 2px solid var(--accent-primary);
  border-radius: 4px;
  z-index: 800;
  cursor: grab;
}

.loop-region:active {
  cursor: grabbing;
}

.loop-start-handle, .loop-end-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  background: var(--accent-primary);
  cursor: ew-resize;
  z-index: 850;
}

.loop-start-handle {
  left: -4px;
  border-radius: 4px 0 0 4px;
}

.loop-end-handle {
  right: -4px;
  border-radius: 0 4px 4px 0;
}

.loop-start-handle:hover, .loop-end-handle:hover {
  background: var(--accent-primary-hover);
}

.clip:hover {
  filter: brightness(1.1);
}

.clip-name {
  position: absolute;
  top: 2px;
  left: 8px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 2;
  pointer-events: none;
}

.clip-waveform {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  display: flex;
  align-items: end;
  opacity: 0.6;
}

.waveform-bar {
  position: absolute;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.8);
  min-height: 1px;
}

/* Legacy CSS removed - now using adaptive piano roll */

/* Adaptive Piano Roll Styles */
.track-piano-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.piano-line {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.piano-line.black-key {
  background: rgba(0, 0, 0, 0.08);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.piano-line.white-key {
  background: transparent;
}

.note-name {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  user-select: none;
  opacity: 0.7;
}

.midi-clip {
  position: absolute;
  z-index: 5;
  pointer-events: all;
}

.audio-clip {
  position: absolute;
  z-index: 5;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  cursor: grab;
}

.audio-clip:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.clip-boundary {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  border-radius: 4px 4px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: none;
  display: flex;
  align-items: center;
  padding: 0 8px;
  opacity: 0.9;
  backdrop-filter: blur(1px);
}

.clip-boundary .clip-name {
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.piano-note {
  position: absolute;
  background: #4dabf7;
  border: 1px solid #339af0;
  border-radius: 3px;
  cursor: grab;
  z-index: 10;
  transition: all 0.1s ease;
  min-height: 8px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  box-sizing: border-box;
}

.piano-note:hover {
  background: #74c0fc;
  border-color: #4dabf7;
  z-index: 15;
  transform: scale(1.02);
}

.piano-note.dragging {
  background: #ffd43b;
  border-color: #fcc419;
  z-index: 20;
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.track-btn.expand {
  background: var(--bg-tertiary);
  border: none;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.track-btn.expand:hover {
  background: var(--bg-secondary);
}

.track-btn.expand.active {
  background: var(--accent-primary);
  color: white;
}

.note-text {
  font-size: 0.7rem;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
}

.piano-line {
  border-bottom: none !important; /* Remove duplicate border */
}

.note-resize-handle {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: ew-resize;
  z-index: 15;
  border-radius: 2px;
  transition: all 0.1s ease;
}

.note-resize-handle.left {
  left: 0;
  border-radius: 3px 0 0 3px;
}

.note-resize-handle.right {
  right: 0;
  border-radius: 0 3px 3px 0;
}

.note-resize-handle:hover {
  background: rgba(255, 255, 255, 0.4);
  width: 6px;
}

.piano-note.selected .note-resize-handle {
  background: rgba(153, 153, 153, 0.6);
  width: 8px;
  border: 1px solid #666666;
}

.piano-note.selected .note-resize-handle.left {
  left: -2px;
  border-right: 2px solid #666666;
  background: rgba(153, 153, 153, 0.8);
}

.piano-note.selected .note-resize-handle.right {
  right: -2px;
  border-left: 2px solid #666666;
  background: rgba(153, 153, 153, 0.8);
}

.piano-note.selected .note-resize-handle:hover {
  background: rgba(153, 153, 153, 1);
  width: 10px;
}

.piano-note.selected {
  position: relative;
  z-index: 20;
}

.new-track-btn {
  margin: 8px 12px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.new-track-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

/* Remove old rule since we now hide the button completely when collapsed */
`;
document.head.appendChild(style);