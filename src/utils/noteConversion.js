// Utility functions for note conversion and music theory

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midiNumber) {
  if (typeof midiNumber !== 'number' || midiNumber < 0 || midiNumber > 127) {
    return 'C4'; // Default fallback
  }
  
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function noteNameToMidi(noteName) {
  if (typeof noteName !== 'string') return 60; // Default to C4
  
  const match = noteName.match(/^([A-G])(#|b)?(-?\d+)$/);
  if (!match) return 60;
  
  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr);
  
  let noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 60;
  
  if (accidental === '#') {
    noteIndex = (noteIndex + 1) % 12;
  } else if (accidental === 'b') {
    noteIndex = (noteIndex - 1 + 12) % 12;
  }
  
  return (octave + 1) * 12 + noteIndex;
}

export function snapTimeToGrid(time, snapValue) {
  if (typeof time !== 'number') return 0;
  
  let subdivision;
  switch (snapValue) {
    case '1': subdivision = 4; break;      // Whole note
    case '1/2': subdivision = 2; break;    // Half note
    case '1/4': subdivision = 1; break;    // Quarter note
    case '1/8': subdivision = 0.5; break;  // Eighth note
    case '1/16': subdivision = 0.25; break; // Sixteenth note
    case '1/32': subdivision = 0.125; break; // Thirty-second note
    default: subdivision = 1; break;
  }
  
  return Math.round(time / subdivision) * subdivision;
}

export function timeToBeats(time, bpm = 120) {
  // Convert seconds to beats
  return (time * bpm) / 60;
}

export function beatsToTime(beats, bpm = 120) {
  // Convert beats to seconds
  return (beats * 60) / bpm;
}

export function formatTimeDisplay(bars, beats = 0, ticks = 0) {
  const barNum = Math.floor(bars) + 1;
  const beatNum = Math.floor(beats) + 1;
  const tickNum = Math.floor(ticks);
  
  return `${barNum}:${beatNum}:${tickNum.toString().padStart(3, '0')}`;
}

export function parseTimeDisplay(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return { bars: 0, beats: 0, ticks: 0 };
  
  return {
    bars: Math.max(0, parseInt(parts[0]) - 1),
    beats: Math.max(0, parseInt(parts[1]) - 1),
    ticks: Math.max(0, parseInt(parts[2]))
  };
}

export function getNotesInScale(key, mode = 'major') {
  const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  
  const rootNote = key.replace(/[#b]/, '').toUpperCase();
  const rootIndex = NOTE_NAMES.indexOf(rootNote);
  if (rootIndex === -1) return [];
  
  const intervals = scales[mode] || scales.major;
  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTE_NAMES[noteIndex];
  });
}