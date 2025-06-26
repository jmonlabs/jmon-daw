import type { MidiNote, MidiClipContent } from '../../types';
import type { PianoRollConfig, PianoRollDimensions, PianoRollNote } from './pianoRollTypes';

// Default piano roll configuration
export const DEFAULT_PIANO_CONFIG: PianoRollConfig = {
  pianoWidth: 120,
  noteRange: { min: 24, max: 108 }, // C1 to C8
  noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
};

// MIDI Conversion Utilities
export const getNoteFromPitch = (midiNumber: number, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): string => {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${config.noteNames[noteIndex]}${octave}`;
};

export const getPitchFromNote = (note: string | number, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): number => {
  if (typeof note === 'number') return note;
  
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60; // Default to C4
  
  const noteName = match[1];
  const octave = parseInt(match[2]);
  const noteIndex = config.noteNames.indexOf(noteName);
  if (noteIndex === -1) return 60;
  
  return (octave + 1) * 12 + noteIndex;
};

export const isBlackKey = (midiNumber: number): boolean => {
  const noteIndex = midiNumber % 12;
  return [1, 3, 6, 8, 10].includes(noteIndex); // C#, D#, F#, G#, A#
};

// Position Calculation Utilities
export const getNoteY = (midiNumber: number, dimensions: PianoRollDimensions, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): number => {
  return (config.noteRange.max - midiNumber) * dimensions.pitchScale - dimensions.scrollY;
};

export const getMidiFromY = (y: number, dimensions: PianoRollDimensions, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): number => {
  return Math.round(config.noteRange.max - (y + dimensions.scrollY) / dimensions.pitchScale);
};

export const getTimeFromX = (x: number, dimensions: PianoRollDimensions): number => {
  return x / dimensions.timeScale;
};

export const getXFromTime = (time: number, dimensions: PianoRollDimensions): number => {
  return time * dimensions.timeScale;
};

// Note Range Utilities
export const getTrackNoteRange = (midiContent: MidiClipContent, config: PianoRollConfig = DEFAULT_PIANO_CONFIG) => {
  if (!midiContent.notes.length) {
    return { min: 60, max: 72, range: 12 }; // Default to C4-C5
  }

  let minNote = 127;
  let maxNote = 0;

  midiContent.notes.forEach((note) => {
    const midiNumber = getPitchFromNote(note.note, config);
    minNote = Math.min(minNote, midiNumber);
    maxNote = Math.max(maxNote, midiNumber);
  });

  // Add some padding
  const padding = 3;
  minNote = Math.max(config.noteRange.min, minNote - padding);
  maxNote = Math.min(config.noteRange.max, maxNote + padding);

  return { min: minNote, max: maxNote, range: maxNote - minNote + 1 };
};

// Note Processing Utilities
export const processNotesForRendering = (
  midiContent: MidiClipContent,
  dimensions: PianoRollDimensions,
  selectedNotes: number[] = [],
  dragState?: { active: boolean; noteIndex: number; clipId: string },
  noteColors = { normal: '#4dabf7', darker: '#339af0' },
  config: PianoRollConfig = DEFAULT_PIANO_CONFIG
): PianoRollNote[] => {
  return midiContent.notes.map((note, index) => {
    const midiNumber = getPitchFromNote(note.note, config);
    const x = getXFromTime(note.time, dimensions);
    const y = getNoteY(midiNumber, dimensions, config);
    const width = Math.max(note.duration * dimensions.timeScale, 12);
    const height = Math.max(dimensions.pitchScale - 2, 8);

    const isSelected = selectedNotes.includes(index);
    const isDragging = dragState?.active && dragState.noteIndex === index;

    let color = noteColors.normal;
    let borderColor = noteColors.darker;

    if (isDragging) {
      color = '#ffd43b';
      borderColor = '#fcc419';
    } else if (isSelected) {
      color = noteColors.darker;
      borderColor = noteColors.normal;
    }

    return {
      note,
      index,
      x,
      y,
      width,
      height,
      midiNumber,
      isSelected,
      isDragging,
      color,
      borderColor
    };
  });
};

// Grid Utilities
export const generateGridLines = (
  dimensions: PianoRollDimensions,
  clipDuration: number = 4,
  config: PianoRollConfig = DEFAULT_PIANO_CONFIG
) => {
  const horizontalLines = [];
  const verticalLines = [];

  // Horizontal lines (pitch)
  for (let midiNumber = config.noteRange.min; midiNumber <= config.noteRange.max; midiNumber++) {
    const y = getNoteY(midiNumber, dimensions, config);
    const isBlack = isBlackKey(midiNumber);
    
    horizontalLines.push({
      midiNumber,
      y,
      isBlackKey: isBlack,
      noteName: getNoteFromPitch(midiNumber, config)
    });
  }

  // Vertical lines (time)
  const totalBeats = Math.ceil(clipDuration * 4); // Assuming 4/4 time
  for (let beat = 0; beat <= totalBeats; beat++) {
    const x = (beat / 4) * dimensions.timeScale;
    const isBar = beat % 4 === 0;
    
    verticalLines.push({
      beat,
      x,
      isBar,
      time: beat / 4
    });
  }

  return { horizontalLines, verticalLines };
};

// Snap Utilities
export const snapToGrid = (value: number, gridSize: number, enabled: boolean = true): number => {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
};

export const snapTimeToGrid = (time: number, gridSize: number, enabled: boolean = true): number => {
  return snapToGrid(time, gridSize, enabled);
};

export const snapPitchToSemitone = (midiNumber: number): number => {
  return Math.round(midiNumber);
};

// Validation Utilities
export const isValidMidiNumber = (midiNumber: number, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): boolean => {
  return midiNumber >= config.noteRange.min && midiNumber <= config.noteRange.max;
};

export const clampMidiNumber = (midiNumber: number, config: PianoRollConfig = DEFAULT_PIANO_CONFIG): number => {
  return Math.max(config.noteRange.min, Math.min(config.noteRange.max, midiNumber));
};

export const validateNoteDuration = (duration: number, minDuration: number = 0.1): number => {
  return Math.max(minDuration, duration);
};

export const validateNoteTime = (time: number): number => {
  return Math.max(0, time);
};