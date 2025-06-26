import { createSignal, createEffect } from 'solid-js';
import { useView } from '../stores/context';
import type { Clip, MidiClipContent, MidiNote } from '../types';
import type { 
  NoteDragState, 
  PianoRollDimensions, 
  PianoRollConfig,
  PianoRollNote 
} from '../components/shared/pianoRollTypes';
import {
  DEFAULT_PIANO_CONFIG,
  getPitchFromNote,
  getNoteFromPitch,
  processNotesForRendering,
  snapTimeToGrid,
  clampMidiNumber,
  validateNoteDuration,
  validateNoteTime,
  isValidMidiNumber
} from '../components/shared/pianoRollUtils';

export interface UsePianoRollOptions {
  /** Initial dimensions */
  initialDimensions?: Partial<PianoRollDimensions>;
  /** Piano roll configuration */
  config?: Partial<PianoRollConfig>;
  /** Note colors */
  noteColors?: { normal: string; darker: string };
  /** Update callback when notes change */
  onNotesChange?: (notes: MidiNote[]) => void;
}

export const usePianoRoll = (clip: Clip | null, options: UsePianoRollOptions = {}) => {
  const { view } = useView();
  
  // Merge config with defaults
  const config = { ...DEFAULT_PIANO_CONFIG, ...options.config };
  const noteColors = options.noteColors || { normal: '#4dabf7', darker: '#339af0' };

  // State
  const [selectedNotes, setSelectedNotes] = createSignal<number[]>([]);
  const [dimensions, setDimensions] = createSignal<PianoRollDimensions>({
    timeScale: 400, // pixels per beat
    pitchScale: 20, // pixels per semitone
    totalHeight: (config.noteRange.max - config.noteRange.min + 1) * 20,
    scrollY: 0,
    ...options.initialDimensions
  });
  
  const [dragState, setDragState] = createSignal<NoteDragState>({
    active: false,
    type: 'move',
    noteIndex: -1,
    clipId: '',
    startX: 0,
    startY: 0,
    startTime: 0,
    startDuration: 0,
    startPitch: 60
  });

  // Computed values
  const getMidiContent = (): MidiClipContent | null => {
    if (!clip || clip.content.type !== 'midi') return null;
    return clip.content as MidiClipContent;
  };

  const processedNotes = (): PianoRollNote[] => {
    const content = getMidiContent();
    if (!content) return [];
    
    return processNotesForRendering(
      content,
      dimensions(),
      selectedNotes(),
      dragState(),
      noteColors,
      config
    );
  };

  // Note manipulation functions
  const updateNote = (noteIndex: number, updates: Partial<MidiNote>) => {
    const content = getMidiContent();
    if (!content || noteIndex < 0 || noteIndex >= content.notes.length) return;

    const updatedNotes = [...content.notes];
    updatedNotes[noteIndex] = { ...updatedNotes[noteIndex], ...updates };
    
    options.onNotesChange?.(updatedNotes);
  };

  const addNote = (time: number, pitch: number, duration: number = view.gridSize || 0.25) => {
    const content = getMidiContent();
    if (!content) return;

    const validTime = validateNoteTime(snapTimeToGrid(time, view.gridSize, view.snapToGrid));
    const validPitch = clampMidiNumber(pitch, config);
    const validDuration = validateNoteDuration(duration);

    if (!isValidMidiNumber(validPitch, config)) return;

    const newNote: MidiNote = {
      note: getNoteFromPitch(validPitch, config),
      time: validTime,
      duration: validDuration,
      velocity: 0.8
    };

    const updatedNotes = [...content.notes, newNote];
    options.onNotesChange?.(updatedNotes);
  };

  const deleteNote = (noteIndex: number) => {
    const content = getMidiContent();
    if (!content || noteIndex < 0 || noteIndex >= content.notes.length) return;

    const updatedNotes = content.notes.filter((_, index) => index !== noteIndex);
    options.onNotesChange?.(updatedNotes);
    
    // Update selected notes
    setSelectedNotes(selected => 
      selected.filter(index => index !== noteIndex)
              .map(index => index > noteIndex ? index - 1 : index)
    );
  };

  const deleteSelectedNotes = () => {
    const selected = selectedNotes().sort((a, b) => b - a); // Sort descending
    selected.forEach(noteIndex => deleteNote(noteIndex));
  };

  // Selection functions
  const selectNote = (noteIndex: number, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedNotes(selected => 
        selected.includes(noteIndex) 
          ? selected.filter(i => i !== noteIndex)
          : [...selected, noteIndex]
      );
    } else {
      setSelectedNotes([noteIndex]);
    }
  };

  const selectNotesInRegion = (startTime: number, endTime: number, startPitch: number, endPitch: number) => {
    const content = getMidiContent();
    if (!content) return;

    const selectedIndices: number[] = [];
    
    content.notes.forEach((note, index) => {
      const pitch = getPitchFromNote(note.note, config);
      const noteEndTime = note.time + note.duration;
      
      const timeOverlaps = note.time <= endTime && noteEndTime >= startTime;
      const pitchInRange = pitch >= Math.min(startPitch, endPitch) && 
                          pitch <= Math.max(startPitch, endPitch);
      
      if (timeOverlaps && pitchInRange) {
        selectedIndices.push(index);
      }
    });

    setSelectedNotes(selectedIndices);
  };

  const clearSelection = () => setSelectedNotes([]);

  // Drag handling
  const startNoteDrag = (
    noteIndex: number, 
    type: NoteDragState['type'], 
    startX: number, 
    startY: number
  ) => {
    const content = getMidiContent();
    if (!content || !clip) return;

    const note = content.notes[noteIndex];
    if (!note) return;

    setDragState({
      active: true,
      type,
      noteIndex,
      clipId: clip.id,
      startX,
      startY,
      startTime: note.time,
      startDuration: note.duration,
      startPitch: note.note
    });
  };

  const updateNoteDrag = (currentX: number, currentY: number) => {
    const drag = dragState();
    if (!drag.active) return;

    const content = getMidiContent();
    if (!content) return;

    const deltaX = currentX - drag.startX;
    const deltaY = currentY - drag.startY;
    const deltaTime = deltaX / dimensions().timeScale;
    const deltaPitch = Math.round(-deltaY / dimensions().pitchScale);

    const note = content.notes[drag.noteIndex];
    if (!note) return;

    let updates: Partial<MidiNote> = {};

    if (drag.type === 'move' || drag.type === 'position') {
      const newTime = validateNoteTime(drag.startTime + deltaTime);
      const startPitch = getPitchFromNote(drag.startPitch, config);
      const newPitch = clampMidiNumber(startPitch + deltaPitch, config);
      
      updates.time = snapTimeToGrid(newTime, view.gridSize, view.snapToGrid);
      updates.note = getNoteFromPitch(newPitch, config);
      
      setDragState({
        ...drag,
        currentPitch: updates.note,
        mouseX: currentX,
        mouseY: currentY
      });
    } else if (drag.type === 'resize-start') {
      const newTime = validateNoteTime(drag.startTime + deltaTime);
      const newDuration = validateNoteDuration(drag.startDuration - deltaTime);
      
      updates.time = snapTimeToGrid(newTime, view.gridSize, view.snapToGrid);
      updates.duration = newDuration;
    } else if (drag.type === 'resize-end') {
      const newDuration = validateNoteDuration(drag.startDuration + deltaTime);
      updates.duration = view.snapToGrid 
        ? Math.max(view.gridSize, snapTimeToGrid(newDuration, view.gridSize, true))
        : newDuration;
    }

    updateNote(drag.noteIndex, updates);
  };

  const endNoteDrag = () => {
    setDragState({
      active: false,
      type: 'move',
      noteIndex: -1,
      clipId: '',
      startX: 0,
      startY: 0,
      startTime: 0,
      startDuration: 0,
      startPitch: 60,
      currentPitch: undefined,
      mouseX: undefined,
      mouseY: undefined
    });
  };

  // Dimension controls
  const setTimeScale = (scale: number) => {
    setDimensions(prev => ({ ...prev, timeScale: Math.max(50, Math.min(1000, scale)) }));
  };

  const setPitchScale = (scale: number) => {
    const newScale = Math.max(8, Math.min(40, scale));
    setDimensions(prev => ({ 
      ...prev, 
      pitchScale: newScale,
      totalHeight: (config.noteRange.max - config.noteRange.min + 1) * newScale
    }));
  };

  const setScrollY = (scrollY: number) => {
    setDimensions(prev => ({ ...prev, scrollY: Math.max(0, scrollY) }));
  };

  // Zoom functions
  const zoomIn = () => {
    setTimeScale(dimensions().timeScale * 1.2);
    setPitchScale(dimensions().pitchScale * 1.1);
  };

  const zoomOut = () => {
    setTimeScale(dimensions().timeScale / 1.2);
    setPitchScale(dimensions().pitchScale / 1.1);
  };

  const zoomToFitNotes = () => {
    const content = getMidiContent();
    if (!content || !content.notes.length) return;

    // Find time range
    let minTime = Infinity;
    let maxTime = -Infinity;
    content.notes.forEach(note => {
      minTime = Math.min(minTime, note.time);
      maxTime = Math.max(maxTime, note.time + note.duration);
    });

    // Set time scale to fit notes with some padding
    const timeRange = maxTime - minTime;
    if (timeRange > 0) {
      const availableWidth = window.innerWidth - config.pianoWidth - 100; // Account for piano and padding
      const newTimeScale = availableWidth / (timeRange * 1.2); // 20% padding
      setTimeScale(newTimeScale);
    }
  };

  return {
    // State
    selectedNotes,
    dimensions,
    dragState,
    config,
    processedNotes,
    
    // Note operations
    addNote,
    updateNote,
    deleteNote,
    deleteSelectedNotes,
    
    // Selection
    selectNote,
    selectNotesInRegion,
    clearSelection,
    
    // Drag operations
    startNoteDrag,
    updateNoteDrag,
    endNoteDrag,
    
    // View controls
    setTimeScale,
    setPitchScale,
    setScrollY,
    zoomIn,
    zoomOut,
    zoomToFitNotes,
    
    // Utilities
    getMidiContent
  };
};