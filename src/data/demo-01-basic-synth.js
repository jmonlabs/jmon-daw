// Simple demo composition for testing vertical zoom
export const demo01BasicSynth = {
  format: "jmonTone",
  version: "1.0",
  bpm: 120,
  keySignature: "C",
  timeSignature: "4/4",
  metadata: {
    name: "Demo 01 - Basic Synth",
    author: "JMON DAW",
    description: "A simple piano melody for testing vertical zoom"
  },
  audioGraph: [
    { 
      id: "master", 
      type: "Destination", 
      options: {} 
    }
  ],
  connections: [],
  sequences: [
    {
      label: "Piano Test",
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
        { note: "C4", time: "0:0:0", duration: "4n", velocity: 0.8 },
        { note: "D4", time: "0:1:0", duration: "4n", velocity: 0.7 },
        { note: "E4", time: "0:2:0", duration: "4n", velocity: 0.9 },
        { note: "F4", time: "0:3:0", duration: "4n", velocity: 0.8 },
        { note: "G4", time: "1:0:0", duration: "4n", velocity: 0.6 },
        { note: "A4", time: "1:1:0", duration: "4n", velocity: 0.7 },
        { note: "B4", time: "1:2:0", duration: "4n", velocity: 0.8 },
        { note: "C5", time: "1:3:0", duration: "4n", velocity: 0.9 }
      ]
    }
  ]
};