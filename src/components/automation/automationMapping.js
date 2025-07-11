import * as Tone from 'tone';
import { generateAutomationEvents } from './automationUtils.js';

/**
 * Maps automation channel types to Tone.js parameter paths and value transformations
 */
export const AUTOMATION_PARAMETER_MAP = {
  velocity: {
    description: 'Note velocity (affects amplitude)',
    toneParam: null, // Applied during note triggering
    valueTransform: (value) => value / 127, // Convert 0-127 to 0-1
    units: 'amplitude'
  },
  
  pitchBend: {
    description: 'Pitch bend (detune)',
    toneParam: 'detune',
    valueTransform: (value) => (value / 8191) * 1200, // Convert to cents (-1200 to +1200)
    units: 'cents'
  },
  
  modulation: {
    description: 'Modulation wheel (CC1) - affects vibrato/tremolo',
    toneParam: 'modulationDepth',
    valueTransform: (value) => value / 127, // Convert 0-127 to 0-1
    units: 'normalized'
  },
  
  expression: {
    description: 'Expression (CC11) - affects overall volume',
    toneParam: 'volume',
    valueTransform: (value) => {
      // Convert 0-127 to dB range (-60 to 0)
      if (value === 0) return -Infinity;
      return (value / 127) * 60 - 60;
    },
    units: 'decibels'
  },
  
  sustain: {
    description: 'Sustain pedal (CC64)',
    toneParam: 'sustain',
    valueTransform: (value) => value >= 64 ? 1 : 0, // Binary on/off
    units: 'boolean'
  },
  
  filterCutoff: {
    description: 'Filter cutoff frequency (CC74)',
    toneParam: 'filter.frequency',
    valueTransform: (value) => {
      // Convert 0-127 to frequency range (100Hz to 20kHz)
      const minFreq = 100;
      const maxFreq = 20000;
      const normalized = value / 127;
      // Use exponential scaling for more musical response
      return minFreq * Math.pow(maxFreq / minFreq, normalized);
    },
    units: 'frequency'
  },
  
  customCC: {
    description: 'Custom MIDI CC',
    toneParam: null, // Can be mapped to any parameter
    valueTransform: (value) => value / 127,
    units: 'normalized'
  }
};

/**
 * Apply automation value to a Tone.js synthesizer or effect
 * @param {Object} toneNode - Tone.js node (synth, effect, etc.)
 * @param {string} automationType - Type of automation (velocity, pitchBend, etc.)
 * @param {number} value - Automation value
 * @param {string} time - Tone.js time string (e.g., "+0.1")
 */
export const applyAutomationToToneNode = (toneNode, automationType, value, time = 'now') => {
  const mapping = AUTOMATION_PARAMETER_MAP[automationType];
  if (!mapping || !toneNode) return;
  
  const transformedValue = mapping.valueTransform(value);
  
  try {
    if (mapping.toneParam) {
      // Handle nested parameter paths (e.g., "filter.frequency")
      const paramPath = mapping.toneParam.split('.');
      let target = toneNode;
      
      // Navigate to the target parameter
      for (let i = 0; i < paramPath.length - 1; i++) {
        if (target[paramPath[i]]) {
          target = target[paramPath[i]];
        } else {
          console.warn(`Parameter path ${mapping.toneParam} not found on Tone node`);
          return;
        }
      }
      
      const finalParam = paramPath[paramPath.length - 1];
      
      // Apply the value with proper scheduling
      if (target[finalParam] && typeof target[finalParam].setValueAtTime === 'function') {
        // It's an AudioParam - use setValueAtTime
        target[finalParam].setValueAtTime(transformedValue, Tone.now() + Tone.Time(time).toSeconds());
      } else if (target[finalParam] && typeof target[finalParam].rampTo === 'function') {
        // It's a Tone Signal - use rampTo for smooth transitions
        target[finalParam].rampTo(transformedValue, 0.05, time);
      } else {
        // Direct property assignment
        target[finalParam] = transformedValue;
      }
      
      console.log(`🎛️ Applied ${automationType}: ${value} → ${transformedValue} to ${mapping.toneParam}`);
    }
  } catch (error) {
    console.error(`Error applying automation ${automationType}:`, error);
  }
};

/**
 * Apply automation to multiple Tone.js nodes (for polyphonic synths)
 * @param {Array} toneNodes - Array of Tone.js nodes
 * @param {string} automationType - Type of automation
 * @param {number} value - Automation value
 * @param {string} time - Tone.js time string
 */
export const applyAutomationToMultipleNodes = (toneNodes, automationType, value, time = 'now') => {
  if (!Array.isArray(toneNodes)) {
    applyAutomationToToneNode(toneNodes, automationType, value, time);
    return;
  }
  
  toneNodes.forEach(node => {
    applyAutomationToToneNode(node, automationType, value, time);
  });
};

/**
 * Get the appropriate Tone.js nodes for a track based on automation type
 * @param {Object} track - DAW track object
 * @param {string} automationType - Type of automation
 * @returns {Array|Object} Tone.js nodes to apply automation to
 */
export const getAutomationTargets = (track, automationType) => {
  if (!track || !track.toneObjects) return null;
  
  const targets = [];
  
  switch (automationType) {
    case 'velocity':
    case 'pitchBend':
    case 'modulation':
      // Apply to main synthesizer
      if (track.toneObjects.synth) {
        targets.push(track.toneObjects.synth);
      }
      break;
      
    case 'expression':
      // Apply to track volume (could be a Gain node)
      if (track.toneObjects.volume) {
        targets.push(track.toneObjects.volume);
      } else if (track.toneObjects.synth) {
        targets.push(track.toneObjects.synth);
      }
      break;
      
    case 'filterCutoff':
      // Apply to filter (synth filter or dedicated filter effect)
      if (track.toneObjects.filter) {
        targets.push(track.toneObjects.filter);
      } else if (track.toneObjects.synth && track.toneObjects.synth.filter) {
        targets.push(track.toneObjects.synth);
      }
      break;
      
    case 'sustain':
      // Apply to synthesizer for sustain pedal behavior
      if (track.toneObjects.synth) {
        targets.push(track.toneObjects.synth);
      }
      break;
      
    case 'customCC':
      // Apply to any available target (user-configurable)
      if (track.toneObjects.synth) {
        targets.push(track.toneObjects.synth);
      }
      break;
      
    default:
      console.warn(`Unknown automation type: ${automationType}`);
      return null;
  }
  
  return targets.length === 1 ? targets[0] : targets;
};

/**
 * Create automation schedule for a track's automation channels
 * @param {Object} track - DAW track object
 * @param {number} startTime - Start time in measures
 * @param {number} duration - Duration in measures
 * @returns {Array} Array of scheduled automation events
 */
export const createAutomationSchedule = (track, startTime = 0, duration = 16) => {
  if (!track || !track.automation || !track.automation.channels) {
    return [];
  }
  
  const schedule = [];
  
  track.automation.channels.forEach(channel => {
    if (!channel.points || channel.points.length === 0) return;
    
    // Generate automation events for this channel
    const events = generateAutomationEvents(
      channel.points, 
      channel.range, 
      startTime, 
      duration, 
      0.05 // High resolution for smooth automation
    );
    
    // Get the target Tone.js nodes for this automation type
    const targets = getAutomationTargets(track, channel.type);
    if (!targets) return;
    
    // Create scheduled events
    events.forEach(event => {
      schedule.push({
        time: event.time,
        type: channel.type,
        value: event.value,
        targets: targets,
        channel: channel
      });
    });
  });
  
  // Sort by time
  return schedule.sort((a, b) => a.time - b.time);
};