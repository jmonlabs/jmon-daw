// Tonejs-instruments sample library integration
// Based on the GitHub repository: https://github.com/nbrosowsky/tonejs-instruments

// Base URL for tonejs-instruments samples
const TONEJS_INSTRUMENTS_BASE_URL = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples';

// Available instrument categories and their sample mappings
export const SAMPLE_LIBRARY = {
  piano: {
    name: 'Piano',
    category: 'keyboard',
    samples: {
      'C1': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C1.mp3`,
      'C2': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C2.mp3`,
      'C3': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C3.mp3`,
      'C4': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C4.mp3`,
      'C5': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C5.mp3`,
      'C6': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C6.mp3`,
      'C7': `${TONEJS_INSTRUMENTS_BASE_URL}/piano/C7.mp3`,
    }
  },
  
  guitar: {
    name: 'Acoustic Guitar',
    category: 'strings',
    samples: {
      'E2': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/E2.mp3`,
      'A2': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/A2.mp3`,
      'D3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/D3.mp3`,
      'G3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/G3.mp3`,
      'B3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/B3.mp3`,
      'E4': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-acoustic/E4.mp3`,
    }
  },
  
  electricGuitar: {
    name: 'Electric Guitar',
    category: 'strings',
    samples: {
      'E2': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/E2.mp3`,
      'A2': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/A2.mp3`,
      'D3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/D3.mp3`,
      'G3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/G3.mp3`,
      'B3': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/B3.mp3`,
      'E4': `${TONEJS_INSTRUMENTS_BASE_URL}/guitar-electric/E4.mp3`,
    }
  },
  
  bass: {
    name: 'Bass Guitar',
    category: 'bass',
    samples: {
      'A0': `${TONEJS_INSTRUMENTS_BASE_URL}/bass/A0.mp3`,
      'A1': `${TONEJS_INSTRUMENTS_BASE_URL}/bass/A1.mp3`,
      'A2': `${TONEJS_INSTRUMENTS_BASE_URL}/bass/A2.mp3`,
      'A3': `${TONEJS_INSTRUMENTS_BASE_URL}/bass/A3.mp3`,
    }
  },
  
  drums: {
    name: 'Drum Kit',
    category: 'percussion',
    samples: {
      'C2': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/kick.mp3`,      // Kick
      'D2': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/snare.mp3`,    // Snare
      'F#2': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/hihat.mp3`,   // Hi-hat
      'A2': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/openhat.mp3`,  // Open hi-hat
      'C3': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/crash.mp3`,    // Crash
      'E3': `${TONEJS_INSTRUMENTS_BASE_URL}/drum/ride.mp3`,     // Ride
    }
  },
  
  strings: {
    name: 'String Section',
    category: 'strings',
    samples: {
      'C3': `${TONEJS_INSTRUMENTS_BASE_URL}/strings/C3.mp3`,
      'C4': `${TONEJS_INSTRUMENTS_BASE_URL}/strings/C4.mp3`,
      'C5': `${TONEJS_INSTRUMENTS_BASE_URL}/strings/C5.mp3`,
      'C6': `${TONEJS_INSTRUMENTS_BASE_URL}/strings/C6.mp3`,
    }
  },
  
  flute: {
    name: 'Flute',
    category: 'woodwinds',
    samples: {
      'C4': `${TONEJS_INSTRUMENTS_BASE_URL}/flute/C4.mp3`,
      'C5': `${TONEJS_INSTRUMENTS_BASE_URL}/flute/C5.mp3`,
      'C6': `${TONEJS_INSTRUMENTS_BASE_URL}/flute/C6.mp3`,
    }
  },
  
  trumpet: {
    name: 'Trumpet',
    category: 'brass',
    samples: {
      'C3': `${TONEJS_INSTRUMENTS_BASE_URL}/trumpet/C3.mp3`,
      'C4': `${TONEJS_INSTRUMENTS_BASE_URL}/trumpet/C4.mp3`,
      'C5': `${TONEJS_INSTRUMENTS_BASE_URL}/trumpet/C5.mp3`,
    }
  },
  
  saxophone: {
    name: 'Saxophone',
    category: 'woodwinds',
    samples: {
      'Bb3': `${TONEJS_INSTRUMENTS_BASE_URL}/saxophone/Bb3.mp3`,
      'Bb4': `${TONEJS_INSTRUMENTS_BASE_URL}/saxophone/Bb4.mp3`,
      'Bb5': `${TONEJS_INSTRUMENTS_BASE_URL}/saxophone/Bb5.mp3`,
    }
  }
};

// Get all available instruments
export const getAvailableInstruments = () => {
  return Object.keys(SAMPLE_LIBRARY).map(key => ({
    id: key,
    ...SAMPLE_LIBRARY[key]
  }));
};

// Get instruments by category
export const getInstrumentsByCategory = (category) => {
  return Object.keys(SAMPLE_LIBRARY)
    .filter(key => SAMPLE_LIBRARY[key].category === category)
    .map(key => ({
      id: key,
      ...SAMPLE_LIBRARY[key]
    }));
};

// Get all categories
export const getCategories = () => {
  const categories = new Set();
  Object.values(SAMPLE_LIBRARY).forEach(instrument => {
    categories.add(instrument.category);
  });
  return Array.from(categories);
};

// Get sample URLs for a specific instrument
export const getSampleUrls = (instrumentId) => {
  return SAMPLE_LIBRARY[instrumentId]?.samples || {};
};

// Create JMON-compatible sample configuration
export const createJmonSampleConfig = (instrumentId) => {
  const instrument = SAMPLE_LIBRARY[instrumentId];
  if (!instrument) return null;
  
  return {
    type: 'Sampler',
    options: {
      urls: instrument.samples,
      envelope: {
        enabled: true,
        attack: 0.02,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3
      }
    }
  };
};

// Preload samples for better performance
export const preloadInstrument = async (instrumentId) => {
  const urls = getSampleUrls(instrumentId);
  if (!urls) return false;
  
  try {
    const promises = Object.values(urls).map(url => {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.onloadeddata = () => resolve(url);
        audio.onerror = () => reject(new Error(`Failed to load ${url}`));
        audio.src = url;
      });
    });
    
    await Promise.all(promises);
    console.log(`Preloaded samples for ${instrumentId}`);
    return true;
  } catch (error) {
    console.warn(`Failed to preload ${instrumentId}:`, error);
    return false;
  }
};

// Get drum mapping for easier drum programming
export const getDrumMapping = () => {
  return {
    'Kick': 'C2',
    'Snare': 'D2', 
    'Hi-hat': 'F#2',
    'Open Hat': 'A2',
    'Crash': 'C3',
    'Ride': 'E3'
  };
};

// Convert note name to appropriate sample note for instrument
export const mapNoteToSample = (noteName, instrumentId) => {
  const instrument = SAMPLE_LIBRARY[instrumentId];
  if (!instrument) return noteName;
  
  const availableNotes = Object.keys(instrument.samples);
  
  // If exact note exists, use it
  if (availableNotes.includes(noteName)) {
    return noteName;
  }
  
  // Find closest available note
  const noteNumber = noteNameToMidi(noteName);
  let closestNote = availableNotes[0];
  let closestDistance = Math.abs(noteNameToMidi(closestNote) - noteNumber);
  
  for (const availableNote of availableNotes) {
    const distance = Math.abs(noteNameToMidi(availableNote) - noteNumber);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestNote = availableNote;
    }
  }
  
  return closestNote;
};

// Helper function to convert note name to MIDI number
function noteNameToMidi(noteName) {
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return 60; // Default to C4
  
  const [, note, octave] = match;
  return (parseInt(octave) + 1) * 12 + noteMap[note];
}

export default SAMPLE_LIBRARY;