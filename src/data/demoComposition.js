// Demo JMON composition for testing
// Features: Piano, Bass, Chord Pads, and Drums with samples

export const demoComposition = {
  format: "jmonTone",
  version: "1.0",
  bpm: 120,
  keySignature: "C",
  timeSignature: "4/4",
  metadata: {
    name: "Demo Composition",
    author: "JMON DAW",
    description: "A simple demo composition to test the DAW functionality"
  },
  audioGraph: [
    { 
      id: "master", 
      type: "Destination", 
      options: {} 
    },
    {
      id: "reverb1",
      type: "Reverb",
      options: {
        wet: 0.3,
        roomSize: 0.7,
        dampening: 0.3
      }
    },
    {
      id: "drums_sampler",
      type: "Sampler",
      options: {
        instrument: "drums"
      }
    }
  ],
  connections: [
    ["reverb1", "master"],
    ["drums_sampler", "master"]
  ],
  sequences: [
    {
      label: "Piano Melody",
      synth: {
        type: "Synth",
        options: {
          oscillator: { type: "triangle" },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.5,
            release: 0.8
          }
        }
      },
      notes: [
        // Mesure 1
        { note: "C4", time: "0:0:0", duration: "4n", velocity: 0.8 },
        { note: "E4", time: "0:1:0", duration: "4n", velocity: 0.7 },
        { note: "G4", time: "0:2:0", duration: "4n", velocity: 0.9 },
        { note: "C5", time: "0:3:0", duration: "4n", velocity: 0.8 },
        // Mesure 2
        { note: "G4", time: "1:0:0", duration: "2n", velocity: 0.6 },
        { note: "E4", time: "1:2:0", duration: "4n", velocity: 0.7 },
        { note: "C4", time: "1:3:0", duration: "4n", velocity: 0.8 },
        // Mesure 3
        { note: "F4", time: "2:0:0", duration: "4n", velocity: 0.8 },
        { note: "A4", time: "2:1:0", duration: "4n", velocity: 0.7 },
        { note: "C5", time: "2:2:0", duration: "4n", velocity: 0.9 },
        { note: "F5", time: "2:3:0", duration: "4n", velocity: 0.8 },
        // Mesure 4
        { note: "E5", time: "3:0:0", duration: "2n", velocity: 0.6 },
        { note: "C5", time: "3:2:0", duration: "4n", velocity: 0.7 },
        { note: "A4", time: "3:3:0", duration: "4n", velocity: 0.8 }
      ]
    },
    {
      label: "Bass Line", 
      synth: {
        type: "MonoSynth",
        options: {
          oscillator: { type: "sawtooth" },
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.4
          },
          filter: {
            frequency: 300,
            type: "lowpass"
          }
        }
      },
      notes: [
        // Mesures 1-2
        { note: "C2", time: "0:0:0", duration: "2n", velocity: 0.9 },
        { note: "F2", time: "0:2:0", duration: "2n", velocity: 0.9 },
        { note: "G2", time: "1:0:0", duration: "2n", velocity: 0.9 },
        { note: "C2", time: "1:2:0", duration: "2n", velocity: 0.9 },
        // Mesures 3-4
        { note: "F2", time: "2:0:0", duration: "2n", velocity: 0.9 },
        { note: "A2", time: "2:2:0", duration: "2n", velocity: 0.9 },
        { note: "G2", time: "3:0:0", duration: "2n", velocity: 0.9 },
        { note: "F2", time: "3:2:0", duration: "2n", velocity: 0.9 }
      ]
    },
    {
      label: "Chord Pads",
      synth: {
        type: "PolySynth",
        options: {
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.8,
            decay: 0.5,
            sustain: 0.8,
            release: 1.2
          }
        }
      },
      notes: [
        { note: ["C3", "E3", "G3"], time: "0:0:0", duration: "1n", velocity: 0.4 },
        { note: ["F3", "A3", "C4"], time: "1:0:0", duration: "1n", velocity: 0.4 },
        { note: ["F3", "A3", "C4"], time: "2:0:0", duration: "1n", velocity: 0.4 },
        { note: ["G3", "B3", "D4"], time: "3:0:0", duration: "1n", velocity: 0.4 }
      ]
    },
    {
      label: "Drums",
      synthRef: "drums_sampler",
      notes: [
        // Mesure 1
        { note: "C2", time: "0:0:0", duration: "4n", velocity: 0.9 },    // Kick
        { note: "D2", time: "0:1:0", duration: "4n", velocity: 0.8 },    // Snare
        { note: "C2", time: "0:2:0", duration: "4n", velocity: 0.9 },    // Kick
        { note: "D2", time: "0:3:0", duration: "4n", velocity: 0.8 },    // Snare
        { note: "F#2", time: "0:0.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "0:1.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "0:2.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "0:3.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        // Mesure 2
        { note: "C2", time: "1:0:0", duration: "4n", velocity: 0.9 },    // Kick
        { note: "D2", time: "1:1:0", duration: "4n", velocity: 0.8 },    // Snare
        { note: "C2", time: "1:2:0", duration: "4n", velocity: 0.9 },    // Kick
        { note: "D2", time: "1:3:0", duration: "4n", velocity: 0.8 },    // Snare
        { note: "F#2", time: "1:0.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "1:1.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "1:2.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        { note: "F#2", time: "1:3.5:0", duration: "8n", velocity: 0.6 },  // Hi-hat
        // Mesures 3-4
        { note: "C2", time: "2:0:0", duration: "4n", velocity: 0.9 },
        { note: "D2", time: "2:1:0", duration: "4n", velocity: 0.8 },
        { note: "C2", time: "2:2:0", duration: "4n", velocity: 0.9 },
        { note: "D2", time: "2:3:0", duration: "4n", velocity: 0.8 },
        { note: "C2", time: "3:0:0", duration: "4n", velocity: 0.9 },
        { note: "D2", time: "3:1:0", duration: "4n", velocity: 0.8 },
        { note: "C2", time: "3:2:0", duration: "4n", velocity: 0.9 },
        { note: "D2", time: "3:3:0", duration: "4n", velocity: 0.8 }
      ]
    }
  ]
};