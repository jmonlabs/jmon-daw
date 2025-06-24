import { Component, For, Show, createSignal, createEffect } from 'solid-js';
import { useProject, useView, useTransport } from '../stores/context';
import { DropZone } from './DropZone';
import { Icon } from './Icon';
import { ContextMenu } from './ContextMenu';
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
    
    const midiContent = clip.content as MidiClipContent;
    const note = midiContent.notes[noteIndex];
    if (!note) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const elementRect = (e.currentTarget as HTMLElement).closest('.clip')?.getBoundingClientRect();
    if (!elementRect) return;

    const relativeX = e.clientX - elementRect.left;
    const relativeY = e.clientY - elementRect.top;
    
    // Determine drag type based on mouse position within note
    let dragType: 'pitch' | 'start' | 'end' | 'position' = 'position';
    const noteWidth = rect.width;
    
    if (relativeX < 4) {
      dragType = 'start';
    } else if (relativeX > noteWidth - 4) {
      dragType = 'end';
    } else {
      dragType = 'pitch';
    }

    setNoteDragging({
      active: true,
      type: dragType,
      noteIndex,
      clipId: clip.id,
      startX: e.clientX,
      startY: e.clientY,
      startTime: note.time,
      startDuration: note.duration,
      startPitch: note.note
    });

    const handleNoteMouseMove = (e: MouseEvent) => {
      const drag = noteDragging();
      if (!drag.active) return;

      const deltaX = e.clientX - drag.startX;
      const deltaY = e.clientY - drag.startY;
      const deltaTime = deltaX / timelineScale();
      
      const clip = project.tracks.find(t => t.clips.some(c => c.id === drag.clipId))?.clips.find(c => c.id === drag.clipId);
      if (!clip || clip.content.type !== 'midi') return;

      const midiContent = clip.content as MidiClipContent;
      const currentNote = midiContent.notes[drag.noteIndex];
      
      if (drag.type === 'pitch') {
        // Convert Y delta to pitch change (each 4px = 1 semitone)
        const semitoneChange = Math.round(-deltaY / 4);
        let newPitch: string | number;
        
        if (typeof drag.startPitch === 'string') {
          const midiNumber = getPitchFromNote(drag.startPitch);
          const newMidiNumber = Math.max(0, Math.min(127, midiNumber + semitoneChange));
          newPitch = getNoteFromPitch(newMidiNumber);
        } else {
          newPitch = Math.max(0, Math.min(127, drag.startPitch + semitoneChange));
        }

        // Update drag state with current pitch and mouse position for floating label
        setNoteDragging({
          ...drag,
          currentPitch: newPitch,
          mouseX: e.clientX,
          mouseY: e.clientY
        });

        const updatedNotes = [...midiContent.notes];
        updatedNotes[drag.noteIndex] = { ...currentNote, note: newPitch };
        
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
      } else if (drag.type === 'position') {
        let newTime = Math.max(0, drag.startTime + deltaTime);
        
        if (view.snapToGrid) {
          const snapSize = view.gridSize;
          newTime = Math.round(newTime / snapSize) * snapSize;
        }

        const updatedNotes = [...midiContent.notes];
        updatedNotes[drag.noteIndex] = { ...currentNote, time: newTime };
        
        updateClip(clip.id, {
          content: { ...midiContent, notes: updatedNotes }
        });
      }
    };

    const handleNoteMouseUp = () => {
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
      document.removeEventListener('mousemove', handleNoteMouseMove);
      document.removeEventListener('mouseup', handleNoteMouseUp);
    };

    document.addEventListener('mousemove', handleNoteMouseMove);
    document.addEventListener('mouseup', handleNoteMouseUp);
  };

  return (
    <div class="track-area" style={`--timeline-scale: ${timelineScale()}px`}>
      <div class="timeline-header">
        <div class="track-header-spacer">
          <h3>{project.name}</h3>
        </div>
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
      </div>
      
      <div class="main-content">
        <div class="track-sidebar">
          <div class="track-list">
            <Show when={project.tracks.length === 0}>
              <div class="empty-state">
                <p>No tracks yet</p>
                <button onClick={handleAddTrack}>Add First Track</button>
              </div>
            </Show>
            <For each={project.tracks}>
              {(track) => (
                <div class="track-item">
                  <div class="track-name">{track.name}</div>
                  <div class="track-controls">
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
              )}
            </For>
            <button class="new-track-btn" onClick={handleAddTrack}>
              <Icon name="plus" size={14} color="var(--text-secondary)" />
              <span>New Track</span>
            </button>
          </div>
        </div>
        <div class="tracks-container">
          {/* Playhead for tracks */}
          <div class="tracks-playhead" style={`left: ${secondsToBeats(transport.currentTime) * timelineScale()}px`}></div>
          <Show when={project.tracks.length === 0}>
            <div class="empty-sequencer">
              <DropZone onFileDrop={(files) => {
                // Auto-create track when files are dropped on empty area
                files.forEach((file, index) => {
                  const trackName = `Track ${project.tracks.length + index + 1}`;
                  addTrack({
                    name: trackName,
                    type: file.type.startsWith('audio/') ? 'audio' : 'instrument',
                    volume: 0.8,
                    pan: 0,
                    muted: false,
                    solo: false,
                    armed: false,
                    color: '#3b82f6',
                    clips: [],
                    effects: []
                  });
                });
              }} />
            </div>
          </Show>
          <For each={project.tracks}>
            {(track) => (
              <DropZone trackId={track.id}>
                <div class="track-lane" onContextMenu={(e) => handleTrackRightClick(e, track.id)}>
                  <div class="track-clips">
                    <For each={track.clips}>
                      {(clip) => (
                        <div 
                          class="clip"
                          style={`left: ${clip.start * timelineScale()}px; width: ${Math.max(clip.duration * timelineScale(), 30)}px; background-color: ${clip.color}; top: 1px; height: 68px; z-index: 10; border: 1px solid white; cursor: ${dragging().clip?.id === clip.id ? 'grabbing' : 'grab'};`}
                          onContextMenu={(e) => handleClipRightClick(e, clip)}
                          onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        >
                          <div class="clip-name">{clip.name}</div>
                          <Show when={clip.content.type === 'audio' && (clip.content as any).waveform}>
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
                          <Show when={clip.content.type === 'midi'}>
                            <div class="clip-notes">
                              <For each={(clip.content as MidiClipContent).notes}>
                                {(note, noteIndex) => {
                                  const noteLeft = note.time * timelineScale();
                                  const noteWidth = Math.max(note.duration * timelineScale(), 8);
                                  
                                  // Convert pitch to visual position (higher pitch = higher on screen)
                                  let pitchNumber: number;
                                  if (typeof note.note === 'string') {
                                    pitchNumber = getPitchFromNote(note.note);
                                  } else {
                                    pitchNumber = note.note;
                                  }
                                  
                                  // Map MIDI notes 0-127 to clip height (60px usable height, leaving space for clip name)
                                  const noteHeight = 4;
                                  const clipUsableHeight = 50; // 68px total - 18px for clip name
                                  const noteTop = 18 + (clipUsableHeight - ((pitchNumber - 48) / 32) * clipUsableHeight) - noteHeight / 2;
                                  
                                  const drag = noteDragging();
                                  const isBeingDragged = drag.active && drag.clipId === clip.id && drag.noteIndex === noteIndex();
                                  
                                  return (
                                    <div
                                      class={`clip-note ${isBeingDragged ? 'dragging' : ''}`}
                                      style={`
                                        left: ${noteLeft}px;
                                        top: ${Math.max(18, Math.min(noteTop, 64))}px;
                                        width: ${noteWidth}px;
                                        height: ${noteHeight}px;
                                        background-color: ${isBeingDragged ? '#ff6b6b' : '#4dabf7'};
                                        border: 1px solid ${isBeingDragged ? '#ff5252' : '#339af0'};
                                        cursor: ${isBeingDragged ? 'grabbing' : 'grab'};
                                        opacity: ${note.velocity};
                                      `}
                                      onMouseDown={(e) => handleNoteMouseDown(e, clip, noteIndex())}
                                      title={`${typeof note.note === 'string' ? note.note : getNoteFromPitch(note.note)} - Time: ${note.time.toFixed(2)} - Duration: ${note.duration.toFixed(2)} - Velocity: ${note.velocity.toFixed(2)}`}
                                    >
                                      <div class="note-start-handle"></div>
                                      <div class="note-end-handle"></div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </DropZone>
            )}
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

.track-header-spacer {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  box-sizing: border-box;
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
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 70px;
  box-sizing: border-box;
  justify-content: center;
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
  height: 70px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  background: linear-gradient(90deg, transparent 0%, transparent calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) var(--timeline-scale, 200px));
  background-size: var(--timeline-scale, 200px) 100%;
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
  z-index: 1000;
  pointer-events: none;
}

.tracks-playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--accent-primary);
  z-index: 1000;
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

/* Note editing styles */
.clip-notes {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.clip-note {
  position: absolute;
  background: #4dabf7;
  border: 1px solid #339af0;
  border-radius: 2px;
  pointer-events: all;
  min-width: 8px;
  box-sizing: border-box;
  z-index: 20;
  transition: background-color 0.1s ease;
}

.clip-note:hover {
  background-color: #74c0fc !important;
  border-color: #4dabf7 !important;
}

.clip-note.dragging {
  background-color: #ff6b6b !important;
  border-color: #ff5252 !important;
  z-index: 30;
}

.note-start-handle, .note-end-handle {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  cursor: ew-resize;
  z-index: 25;
  transition: background-color 0.1s ease;
}

.note-start-handle {
  left: 0;
  border-radius: 2px 0 0 2px;
}

.note-end-handle {
  right: 0;
  border-radius: 0 2px 2px 0;
}

.note-start-handle:hover, .note-end-handle:hover {
  background: rgba(255, 255, 255, 0.5) !important;
}

.clip-note:hover .note-start-handle,
.clip-note:hover .note-end-handle {
  background: rgba(255, 255, 255, 0.3);
}

.clip-note.dragging .note-start-handle,
.clip-note.dragging .note-end-handle {
  background: rgba(255, 255, 255, 0.6);
}
`;
document.head.appendChild(style);