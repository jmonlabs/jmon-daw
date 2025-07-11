import * as Tone from 'tone';
import { getSampleUrls, createJmonSampleConfig } from './sampleLibrary';
import { 
  createAutomationSchedule, 
  applyAutomationToToneNode, 
  getAutomationTargets 
} from '../components/automation/automationMapping.js';
import { getAutomationValueAtTime } from '../components/automation/automationUtils.js';

class AudioEngine {
  constructor() {
    this.isInitialized = false;
    this.synths = new Map();
    this.effects = new Map();
    this.audioGraph = new Map();
    this.connections = [];
    this.currentSequences = [];
    this.previewSynths = new Map(); // For real-time note previews
    this.automationSchedule = new Map(); // Track automation schedules
    this.activeAutomationEvents = []; // Currently scheduled automation events
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await Tone.start();
      this.isInitialized = true;
      
      // Set up master destination
      Tone.Destination.volume.value = -10; // Safer default volume
      
      // Initialize master destination in audio graph
      this.audioGraph.set('master', Tone.Destination);
      
      console.log('Audio engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw new Error('Audio initialization failed. Please check your audio settings.');
    }
  }

  // Create audio graph node based on JMON spec
  createAudioNode(nodeConfig) {
    const { id, type, options = {} } = nodeConfig;
    
    let node;
    
    // Synth nodes - Check for valid Tone.js synth types first
    const validSynthTypes = ['Synth', 'PolySynth', 'MonoSynth', 'AMSynth', 'FMSynth', 'DuoSynth', 'PluckSynth', 'NoiseSynth', 'MetalSynth', 'MembraneSynth'];
    
    if (validSynthTypes.includes(type) || type.includes('Synth')) {
      // Handle known synth types
      switch (type) {
        case 'PolySynth':
          node = new Tone.PolySynth(options);
          break;
        case 'MonoSynth':
          node = new Tone.MonoSynth(options);
          break;
        case 'AMSynth':
          node = new Tone.AMSynth(options);
          break;
        case 'FMSynth':
          node = new Tone.FMSynth(options);
          break;
        case 'DuoSynth':
          node = new Tone.DuoSynth(options);
          break;
        case 'PluckSynth':
          node = new Tone.PluckSynth(options);
          break;
        case 'NoiseSynth':
          node = new Tone.NoiseSynth(options);
          break;
        case 'MetalSynth':
          node = new Tone.MetalSynth(options);
          break;
        case 'MembraneSynth':
          node = new Tone.MembraneSynth(options);
          break;
        case 'Synth':
          node = new Tone.Synth(options);
          break;
        default:
          // Unknown synth type - fall back to default Synth
          console.warn(`Unknown synth type: ${type}, falling back to default Synth`);
          node = new Tone.Synth(options);
      }
    }
    // Sampler node - simplified (no external samples for now)
    else if (type === 'Sampler') {
      // Use basic sampler without external URLs to avoid 404s
      const { instrument, ...cleanOptions } = options; // Remove 'instrument' prop
      // Create a basic oscillator-based sampler instead of file-based
      node = new Tone.PolySynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 }
      });
    }
    // Effect nodes
    else if (type === 'Reverb') {
      node = new Tone.Reverb(options);
    }
    else if (type === 'JCReverb') {
      node = new Tone.JCReverb(options);
    }
    else if (type === 'Freeverb') {
      node = new Tone.Freeverb(options);
    }
    else if (type === 'Delay') {
      node = new Tone.Delay(options.delayTime || '8n');
      if (options.feedback) node.feedback.value = options.feedback;
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'FeedbackDelay') {
      node = new Tone.FeedbackDelay(options.delayTime || '8n', options.feedback || 0.4);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'PingPongDelay') {
      node = new Tone.PingPongDelay(options.delayTime || '8n', options.feedback || 0.4);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Filter') {
      node = new Tone.Filter(options.frequency || 1000, options.type || 'lowpass');
      if (options.Q) node.Q.value = options.Q;
    }
    else if (type === 'AutoFilter') {
      node = new Tone.AutoFilter(options.frequency || 1000);
      if (options.depth) node.depth.value = options.depth;
      if (options.baseFrequency) node.baseFrequency = options.baseFrequency;
    }
    else if (type === 'Chorus') {
      node = new Tone.Chorus(options.frequency || 4, options.delayTime || 3.5, options.depth || 0.7);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Phaser') {
      node = new Tone.Phaser(options.frequency || 4, options.octaves || 3, options.baseFrequency || 350);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Tremolo') {
      node = new Tone.Tremolo(options.frequency || 4, options.depth || 0.5);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Vibrato') {
      node = new Tone.Vibrato(options.frequency || 4, options.depth || 0.1);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'AutoWah') {
      node = new Tone.AutoWah(options.baseFrequency || 100, options.octaves || 6);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Distortion') {
      node = new Tone.Distortion(options.distortion || 0.4);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Chebyshev') {
      node = new Tone.Chebyshev(options.order || 50);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'BitCrusher') {
      node = new Tone.BitCrusher(options.bits || 4);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'Compressor') {
      node = new Tone.Compressor(options.threshold || -24, options.ratio || 4);
      if (options.attack) node.attack.value = options.attack;
      if (options.release) node.release.value = options.release;
    }
    else if (type === 'Limiter') {
      node = new Tone.Limiter(options.threshold || -12);
    }
    else if (type === 'Gate') {
      node = new Tone.Gate(options.threshold || -40, options.ratio || 10);
      if (options.attack) node.attack.value = options.attack;
      if (options.release) node.release.value = options.release;
    }
    else if (type === 'FrequencyShifter') {
      node = new Tone.FrequencyShifter(options.frequency || 42);
    }
    else if (type === 'PitchShift') {
      node = new Tone.PitchShift(options.pitch || 0);
      if (options.wet) node.wet.value = options.wet;
    }
    else if (type === 'StereoWidener') {
      node = new Tone.StereoWidener(options.width || 0.5);
    }
    else if (type === 'MidSideCompressor') {
      node = new Tone.MidSideCompressor();
    }
    else if (type === 'Destination') {
      node = Tone.Destination;
    }
    else {
      console.error(`🚫 AUDIO NODE ERROR: Unknown audio node type "${type}" for id "${id}"`);
      console.error(`🚫 Available synth types: Synth, PolySynth, MonoSynth, AMSynth, FMSynth, DuoSynth, PluckSynth, NoiseSynth, MetalSynth, MembraneSynth, Sampler`);
      console.error(`🚫 Falling back to default Synth for unknown type "${type}"`);
      
      // Fall back to default Synth to prevent null returns
      if (type.includes('Synth') || type.includes('synth')) {
        node = new Tone.Synth(options);
        console.log(`🎛️ FALLBACK: Created default Synth for unknown type "${type}"`);
      } else {
        console.error(`🚫 CRITICAL: Cannot create fallback for non-synth type "${type}"`);
        return null;
      }
    }
    
    // Store in audio graph
    this.audioGraph.set(id, node);
    
    // Auto-start effects that need it
    if (node.start && ['AutoFilter', 'Chorus', 'Phaser', 'Tremolo', 'Vibrato', 'AutoWah'].includes(type)) {
      node.start();
    }
    
    return node;
  }
  
  // Legacy synth creation for backward compatibility
  createSynth(type, options = {}) {
    const synthId = `synth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const node = this.createAudioNode({ id: synthId, type, options });
    
    if (node) {
      node.toDestination();
      this.synths.set(synthId, node);
    }
    
    return synthId;
  }

  getSynth(synthId) {
    return this.synths.get(synthId);
  }

  disposeSynth(synthId) {
    const synth = this.synths.get(synthId);
    if (synth) {
      synth.dispose();
      this.synths.delete(synthId);
    }
  }

  // Enhanced sequence scheduling with better JMON support
  scheduleSequence(sequence, sequenceIndex) {
    const synth = this.getSequenceSynth(sequenceIndex);
    if (!synth || !sequence.notes) {
      console.warn(`🎵 Cannot schedule sequence ${sequenceIndex} (${sequence.label}): synth=${!!synth}, notes=${!!sequence.notes}`);
      return [];
    }

    // Check for overlapping notes and warn if using monophonic synth
    const synthType = sequence.synth?.type || 'Synth';
    this.checkForOverlappingNotes(sequence, synthType);

    console.log(`🎵 Scheduling sequence ${sequenceIndex} (${sequence.label}) with ${sequence.notes.length} notes using synth: ${synth.constructor.name}`);
    console.log(`🎵 SEQUENCE DEBUG: Notes for ${sequence.label}:`, sequence.notes.map((note, i) => `${i}: ${note.note} at ${note.time}`));
    
    const scheduledEvents = [];
    
    sequence.notes.forEach((note, noteIndex) => {
      const originalTime = note.time || note.measure || 0;
      const time = this.parseTime(originalTime);
      const duration = note.duration;
      
      const eventId = Tone.Transport.schedule((scheduledTime) => {
        try {
          // Add small offset to prevent timing conflicts
          const playTime = scheduledTime + (noteIndex * 0.001);
          
          console.log(`🎼 Playing note: ${note.note} at time ${time} (scheduled: ${scheduledTime}, actual: ${playTime}) [sequence ${sequenceIndex}]`);
          
          if (Array.isArray(note.note)) {
            // Chord
            synth.triggerAttackRelease(note.note, duration, playTime, note.velocity || 0.8);
          } else {
            // Single note
            synth.triggerAttackRelease(note.note, duration, playTime, note.velocity || 0.8);
          }
          
          // Handle note modulations (MIDI CC, pitch bend, aftertouch)
          if (note.modulations) {
            note.modulations.forEach(mod => {
              const modTime = this.parseTime(mod.time);
              Tone.Transport.schedule((modScheduledTime) => {
                this.handleModulation(synth, mod);
              }, playTime + modTime);
            });
          }
        } catch (error) {
          console.warn('Error playing note:', note, error);
        }
      }, time);
      
      scheduledEvents.push(eventId);
    });

    return scheduledEvents;
  }
  
  // Handle MIDI modulation events
  handleModulation(synth, modulation) {
    try {
      switch (modulation.type) {
        case 'cc':
          // Handle MIDI Control Change
          this.handleMidiCC(synth, modulation.controller, modulation.value);
          break;
        case 'pitchBend':
          // Handle pitch bend (-8192 to +8192 = ±2 semitones)
          const bendAmount = (modulation.value / 8192) * 2; // Convert to semitones
          if (synth.detune) {
            synth.detune.value = bendAmount * 100; // Convert to cents
          }
          break;
        case 'aftertouch':
          // Handle aftertouch (channel pressure)
          // Could map to filter cutoff, vibrato depth, etc.
          if (synth.filter && synth.filter.frequency) {
            const normalizedValue = modulation.value / 127;
            synth.filter.frequency.value = 200 + (normalizedValue * 2000);
          }
          break;
      }
    } catch (error) {
      console.warn('Modulation handling error:', error);
    }
  }
  
  // Handle MIDI Control Change messages
  handleMidiCC(synth, controller, value) {
    const normalizedValue = value / 127;
    
    switch (controller) {
      case 1: // Modulation wheel
        if (synth.vibratoAmount) {
          synth.vibratoAmount.value = normalizedValue;
        } else if (synth.filter && synth.filter.frequency) {
          // Map to filter cutoff if vibrato not available
          synth.filter.frequency.value = 200 + (normalizedValue * 1800);
        }
        break;
      case 7: // Volume
        if (synth.volume) {
          synth.volume.value = -60 + (normalizedValue * 60); // -60dB to 0dB
        }
        break;
      case 10: // Pan
        if (synth.pan) {
          synth.pan.value = (normalizedValue * 2) - 1; // -1 to 1
        }
        break;
      case 74: // Filter cutoff
        if (synth.filter && synth.filter.frequency) {
          synth.filter.frequency.value = 200 + (normalizedValue * 3800);
        }
        break;
      case 71: // Filter resonance
        if (synth.filter && synth.filter.Q) {
          synth.filter.Q.value = 1 + (normalizedValue * 29); // 1 to 30
        }
        break;
    }
  }

  parseTime(time) {
    if (typeof time === 'string') {
      // Handle Tone.js time notation like "0:0:0" or note values like "4n"
      if (time.includes(':')) return time;
      return time;
    }
    if (typeof time === 'number') {
      // Legacy: Convert beats to bars:beats:ticks format for Tone.js
      const bars = Math.floor(time / 4);
      const beats = time % 4;
      return `${bars}:${beats}:0`;
    }
    return "0:0:0";
  }

  parseDuration(duration) {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
      // Convert note values to seconds at current BPM
      const bpm = Tone.Transport.bpm.value;
      const quarterNote = 60 / bpm;
      
      switch (duration) {
        case '1n': return quarterNote * 4;
        case '2n': return quarterNote * 2;
        case '4n': return quarterNote;
        case '8n': return quarterNote / 2;
        case '16n': return quarterNote / 4;
        case '32n': return quarterNote / 8;
        default: return quarterNote;
      }
    }
    return 1;
  }

  play() {
    if (!this.isInitialized) return;
    
    console.log(`🎵 Audio Engine Play - Transport state: ${Tone.Transport.state}, Position: ${Tone.Transport.position}, BPM: ${Tone.Transport.bpm.value}`);
    
    // Check if we're starting from the beginning (position 0:0:0)
    const currentPosition = Tone.Transport.position;
    const isAtStart = currentPosition === '0:0:0' || currentPosition === '0:0:0.0';
    
    if (Tone.Transport.state === 'stopped' || isAtStart) {
      // Always use full scheduling when starting from the beginning
      this.rescheduleCurrentSequences();
      
      // Schedule DAW track automation
      if (this.currentDawTracks && this.currentDawTracks.length > 0) {
        const trackLength = Math.max(16, this.currentJmonData?.totalLength || 16);
        this.scheduleTrackAutomation(this.currentDawTracks, 0, trackLength);
      }
      
      Tone.Transport.start();
      console.log(`🎵 Transport started from ${isAtStart ? 'beginning' : 'stopped state'}`);
    } else if (Tone.Transport.state === 'paused') {
      // Resume from pause: use current transport position directly
      console.log(`🔄 Resuming from current transport position: ${Tone.Transport.position}`);
      
      // Reschedule events that haven't played yet from this position
      this.rescheduleFromCurrentPosition();
      
      // Reschedule automation from current position
      if (this.currentDawTracks && this.currentDawTracks.length > 0) {
        const currentTimeInMeasures = Tone.Time(currentPosition).toBarsBeatsSixteenths().split(':')[0];
        const remainingLength = Math.max(16, this.currentJmonData?.totalLength || 16) - parseFloat(currentTimeInMeasures);
        this.scheduleTrackAutomation(this.currentDawTracks, parseFloat(currentTimeInMeasures), remainingLength);
      }
      
      Tone.Transport.start();
      console.log(`🎵 Transport resumed from pause`);
    }
    
    // Log current transport state after operation
    setTimeout(() => {
      console.log(`🎵 Transport state after play: ${Tone.Transport.state}, Position: ${Tone.Transport.position}`);
    }, 100);
  }


  // Reschedule current sequences (only when needed)
  rescheduleCurrentSequences() {
    if (this.currentJmonData && this.currentJmonData.sequences) {
      // Clear existing scheduled events first
      Tone.Transport.cancel();
      
      // Reschedule all sequences
      this.currentJmonData.sequences.forEach((sequence, index) => {
        if (sequence.notes && sequence.notes.length > 0) {
          const synth = this.getSequenceSynth(index);
          console.log(`🔄 Rescheduling sequence ${index} with ${sequence.notes.length} notes, synth:`, synth ? 'OK' : 'MISSING');
          this.scheduleSequence(sequence, index);
        }
      });
    }
  }

  // Reschedule only events that haven't played yet (for resume from pause)
  rescheduleFromCurrentPosition() {
    if (!this.currentJmonData || !this.currentJmonData.sequences) return 0;
    
    console.log(`🔄 RESCHEDULING DEBUG: currentJmonData has ${this.currentJmonData.sequences.length} sequences:`, 
      this.currentJmonData.sequences.map((seq, i) => `${i}: ${seq.label} (${seq.notes?.length || 0} notes)`));
    
    // Use current transport position directly
    const currentPosition = Tone.Transport.position;
    const currentTransportTime = this.parseTransportPositionToMeasures(currentPosition);
    console.log(`🔄 Rescheduling from current position: ${currentPosition} (${currentTransportTime} measures)`);
    
    // Clear existing scheduled events
    Tone.Transport.cancel();
    
    let totalScheduledCount = 0;
    
    // Reschedule only notes that haven't been played yet
    this.currentJmonData.sequences.forEach((sequence, index) => {
      if (sequence.notes && sequence.notes.length > 0) {
        const synth = this.getSequenceSynth(index);
        if (!synth) return;
        
        let scheduledCount = 0;
        console.log(`🔄 SEQUENCE ${index} DEBUG: Processing ${sequence.notes.length} notes for ${sequence.label}`);
        
        sequence.notes.forEach((note, noteIndex) => {
          const originalTime = note.time || note.measure || 0;
          const noteTime = this.parseTime(originalTime);
          const noteTimeInMeasures = this.parseTimeToMeasures(noteTime);
          
          console.log(`🔄 Note ${noteIndex}: ${note.note} at ${originalTime} (${noteTimeInMeasures} measures) vs current ${currentTransportTime} measures`);
          
          // Only schedule notes that haven't been played yet
          // Use a small tolerance to avoid floating point precision issues
          if (noteTimeInMeasures >= currentTransportTime - 0.001) {
            const duration = note.duration;
            
            const eventId = Tone.Transport.schedule((scheduledTime) => {
              try {
                const playTime = scheduledTime + (noteIndex * 0.001);
                console.log(`🎼 Playing note: ${note.note} at time ${noteTime} (scheduled: ${scheduledTime}, actual: ${playTime})`);
                
                if (Array.isArray(note.note)) {
                  synth.triggerAttackRelease(note.note, duration, playTime, note.velocity || 0.8);
                } else {
                  synth.triggerAttackRelease(note.note, duration, playTime, note.velocity || 0.8);
                }
              } catch (error) {
                console.error(`Failed to play note:`, error);
              }
            }, noteTime);
            
            scheduledCount++;
            console.log(`🔄 Scheduled note ${noteIndex}: ${note.note} at ${noteTime}`);
          } else {
            console.log(`🔄 Skipped note ${noteIndex}: ${note.note} (already played)`);
          }
        });
        
        totalScheduledCount += scheduledCount;
        console.log(`🔄 Sequence ${index}: scheduled ${scheduledCount} future notes out of ${sequence.notes.length} total`);
      }
    });
    
    return totalScheduledCount;
  }

  // Convert transport position (bars:beats:ticks) to measures
  parseTransportPositionToMeasures(position) {
    if (typeof position !== 'string') return 0;
    
    const parts = position.split(':');
    if (parts.length !== 3) return 0;
    
    const bars = parseInt(parts[0] || 0, 10);
    const beats = parseInt(parts[1] || 0, 10);
    const ticks = parseInt(parts[2] || 0, 10);
    
    // Validate the values are reasonable
    if (bars < 0 || beats < 0 || beats >= 4 || ticks < 0 || ticks >= 480) {
      console.warn(`Invalid transport position: ${position}, using 0`);
      return 0;
    }
    
    return bars + (beats / 4) + (ticks / (4 * 480));
  }

  // Convert time string to measures
  parseTimeToMeasures(timeString) {
    if (typeof timeString === 'number') return timeString;
    if (typeof timeString !== 'string') return 0;
    
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    
    const bars = parseInt(parts[0] || 0, 10);
    const beats = parseInt(parts[1] || 0, 10);
    const ticks = parseInt(parts[2] || 0, 10);
    
    // Validate the values are reasonable
    if (bars < 0 || beats < 0 || beats >= 4 || ticks < 0 || ticks >= 480) {
      console.warn(`Invalid time string: ${timeString}, using 0`);
      return 0;
    }
    
    return bars + (beats / 4) + (ticks / (4 * 480));
  }

  pause() {
    console.log(`⏸️ Audio Engine Pause - Transport state: ${Tone.Transport.state}, Position: ${Tone.Transport.position}`);
    
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      console.log(`⏸️ Transport paused at position: ${Tone.Transport.position}`);
    }
  }

  stop() {
    Tone.Transport.stop();
    // Clear automation when stopping
    this.clearAutomationSchedule();
  }

  clear() {
    // Clear all scheduled events from Transport
    Tone.Transport.cancel();
    // Also clear automation
    this.clearAutomationSchedule();
  }

  setBpm(bpm) {
    Tone.Transport.bpm.value = bpm;
  }

  setPosition(position) {
    // Validate and normalize position format
    if (typeof position === 'string' && position.match(/^\d+:\d+:\d+$/)) {
      const parts = position.split(':');
      const bars = parseInt(parts[0], 10);
      let beats = parseInt(parts[1], 10);
      let ticks = parseInt(parts[2], 10);
      
      // Validate that values are within reasonable ranges
      if (bars < 0 || beats < 0 || beats >= 4 || ticks < 0 || ticks >= 480) {
        console.warn(`Invalid position values: ${position}, clamping to valid range`);
        // Clamp values to valid ranges instead of ignoring
        const clampedBars = Math.max(0, bars);
        const clampedBeats = Math.max(0, Math.min(3, beats));
        const clampedTicks = Math.max(0, Math.min(479, ticks));
        position = `${clampedBars}:${clampedBeats}:${clampedTicks}`;
      }
      
      console.log(`🔄 Setting transport position to: ${position}`);
      
      // Convert our position to total seconds and use Tone.js time format
      // Tone.js time calculation: bars * 4 beats per bar + beats + ticks/480 (total beats)
      // Then convert to seconds: total beats * (60 / BPM)
      const totalBeats = bars * 4 + beats + (ticks / 480);
      const totalSeconds = totalBeats * (60 / Tone.Transport.bpm.value);
      
      console.log(`🔄 Converting position ${position} to ${totalSeconds} seconds (totalBeats=${totalBeats})`);
      
      // Set position using seconds instead of BBT format
      Tone.Transport.position = totalSeconds;
      
      // Log the actual position after setting to verify
      const actualPosition = Tone.Transport.position;
      console.log(`🔄 Transport position after setting: ${actualPosition}`);
      
    } else {
      console.warn(`Invalid position format: ${position}, ignoring`);
    }
  }

  getPosition() {
    return Tone.Transport.position;
  }

  setLoop(start, end) {
    Tone.Transport.setLoopPoints(start, end);
    Tone.Transport.loop = true;
  }

  disableLoop() {
    Tone.Transport.loop = false;
  }

  // Build audio graph from JMON configuration
  buildAudioGraph(jmonData, dawTracks = null) {
    this.clearAudioGraph();
    
    // Store JMON data for sequence management
    this.currentJmonData = jmonData;
    this.currentDawTracks = dawTracks;
    
    console.log('🎛️ EFFECTS DEBUG: Building audio graph with DAW tracks:', dawTracks?.map(t => ({
      name: t.name,
      effects: t.effects?.length || 0,
      effectTypes: t.effects?.map(e => e.type) || []
    })));
    
    // Create all nodes
    if (jmonData.audioGraph) {
      jmonData.audioGraph.forEach(nodeConfig => {
        this.createAudioNode(nodeConfig);
      });
    }
    
    // Connect nodes according to connections array
    if (jmonData.connections) {
      jmonData.connections.forEach(([sourceId, targetId]) => {
        this.connectNodes(sourceId, targetId);
      });
    }
    
    // Create synths for sequences and connect them
    if (jmonData.sequences) {
      console.log(`🎛️ SEQUENCES DEBUG: Building synths for ${jmonData.sequences.length} sequences`);
      jmonData.sequences.forEach((sequence, index) => {
        const synthId = `sequence_synth_${index}`;
        const synthType = sequence.synth?.type || 'Unknown';
        console.log(`🎛️ SEQUENCE ${index}: Creating synth "${synthId}" for "${sequence.label}" (type: ${synthType})`);
        
        // Use sequence synth config or synthRef
        if (sequence.synthRef) {
          // Reference to existing audio graph node
          const refNode = this.audioGraph.get(sequence.synthRef);
          this.synths.set(synthId, refNode);
          console.log(`🎛️ SEQUENCE ${index}: Using synthRef "${sequence.synthRef}"`);
        } else if (sequence.synth) {
          // Create dedicated synth for this sequence
          const synthNode = this.createAudioNode({
            id: synthId,
            type: sequence.synth.type,
            options: sequence.synth.options || {}
          });
          
          if (synthNode) {
            this.synths.set(synthId, synthNode);
            console.log(`🎛️ SEQUENCE ${index}: Created synth "${synthId}" successfully (type: ${synthType})`);
          } else {
            console.error(`🎛️ SEQUENCE ${index}: Failed to create synth "${synthId}" (type: ${synthType})`);
          }
          
          // Build effect chain for this track if DAW tracks are provided
          let finalDestination = this.audioGraph.get('master') || Tone.Destination;
          
          if (dawTracks && dawTracks[index] && dawTracks[index].effects && dawTracks[index].effects.length > 0) {
            console.log(`🎛️ EFFECTS DEBUG: Building effect chain for track ${index} (${dawTracks[index].name}):`, dawTracks[index].effects);
            
            // Create effect chain for this track
            let currentNode = synthNode;
            
            dawTracks[index].effects.forEach((effectConfig, effectIndex) => {
              const effectId = `track_${index}_effect_${effectIndex}`;
              const effectNode = this.createAudioNode({
                id: effectId,
                type: effectConfig.type,
                options: effectConfig.options || {}
              });
              
              if (effectNode) {
                console.log(`🎛️ EFFECTS DEBUG: Created effect ${effectConfig.type} for track ${index}, connecting...`);
                currentNode.connect(effectNode);
                currentNode = effectNode;
              } else {
                console.error(`🎛️ EFFECTS DEBUG: Failed to create effect ${effectConfig.type} for track ${index}`);
              }
            });
            
            // Connect final effect to master
            currentNode.connect(finalDestination);
            console.log(`🎛️ EFFECTS DEBUG: Connected effect chain to master for track ${index}`);
          } else {
            // No effects, connect directly to master
            if (synthNode) {
              synthNode.connect(finalDestination);
              console.log(`🎛️ EFFECTS DEBUG: No effects for track ${index}, connecting directly to master`);
            } else {
              console.error(`🎛️ EFFECTS DEBUG: Cannot connect null synthNode for track ${index}`);
            }
          }
        } else {
          console.warn(`🎛️ SEQUENCE ${index}: No synth config found for sequence "${sequence.label}"`);
        }
      });
    }
    
    // Schedule automation events
    if (jmonData.automation) {
      this.scheduleAutomation(jmonData.automation);
    }
  }
  
  // Connect two nodes in the audio graph
  connectNodes(sourceId, targetId) {
    const source = this.audioGraph.get(sourceId);
    const target = this.audioGraph.get(targetId);
    
    if (source && target) {
      try {
        source.connect(target);
        console.log(`Connected ${sourceId} -> ${targetId}`);
      } catch (error) {
        console.warn(`Failed to connect ${sourceId} -> ${targetId}:`, error);
      }
    } else {
      console.warn(`Missing nodes for connection ${sourceId} -> ${targetId}`);
    }
  }
  
  // Preview a single note (for real-time feedback)
  async previewNote(noteName, synthType = 'Synth', duration = 0.2, synthOptions = {}) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    const previewId = `${synthType}_preview`;
    
    // Get or create preview synth
    let previewSynth = this.previewSynths.get(previewId);
    if (!previewSynth) {
      previewSynth = this.createAudioNode({
        id: previewId,
        type: synthType,
        options: synthOptions
      });
      
      if (previewSynth) {
        previewSynth.toDestination();
        this.previewSynths.set(previewId, previewSynth);
      }
    }
    
    if (previewSynth && previewSynth.triggerAttackRelease) {
      try {
        previewSynth.triggerAttackRelease(noteName, duration);
      } catch (error) {
        console.warn('Preview note failed:', error);
      }
    }
  }
  
  // Get synth for sequence (by index or ID)
  getSequenceSynth(sequenceIndex) {
    const synthId = `sequence_synth_${sequenceIndex}`;
    const synth = this.synths.get(synthId);
    console.log(`🎛️ Getting synth for sequence ${sequenceIndex}: ${synthId} -> ${synth ? synth.constructor.name : 'NOT FOUND'}`);
    return synth;
  }
  
  // Update track volume and pan controls
  updateTrackVolume(trackIndex, volume) {
    const synth = this.getSequenceSynth(trackIndex);
    if (synth && synth.volume) {
      // Convert 0-1 to dB (-60 to 0)
      const dbValue = -60 + (volume * 60);
      synth.volume.value = dbValue;
      console.log(`🔊 Track ${trackIndex} volume updated to ${volume} (${dbValue.toFixed(1)} dB)`);
    } else {
      console.warn(`⚠️ Cannot update volume for track ${trackIndex} - synth not found or has no volume control`);
    }
  }
  
  updateTrackPan(trackIndex, pan) {
    const synth = this.getSequenceSynth(trackIndex);
    if (synth) {
      // Create panner if it doesn't exist
      if (!synth._panner) {
        synth._panner = new Tone.Panner(pan);
        synth.disconnect();
        synth.connect(synth._panner);
        synth._panner.toDestination();
      } else {
        synth._panner.pan.value = pan;
      }
    }
  }
  
  updateTrackMute(trackIndex, muted) {
    const synth = this.getSequenceSynth(trackIndex);
    if (synth && synth.volume) {
      // Always store original volume if not already stored
      if (synth._originalVolume === undefined) {
        synth._originalVolume = synth.volume.value;
        console.log(`💾 Stored original volume for track ${trackIndex}: ${synth._originalVolume}`);
      }
      
      if (muted) {
        synth.volume.value = -Infinity; // Mute
        console.log(`🔇 Track ${trackIndex} muted (original: ${synth._originalVolume})`);
      } else {
        // Restore original volume
        synth.volume.value = synth._originalVolume;
        console.log(`🔊 Track ${trackIndex} unmuted, restored to: ${synth._originalVolume}`);
      }
    } else {
      console.warn(`⚠️ Could not find synth or volume for track ${trackIndex}`);
    }
  }
  
  updateTrackSolo(trackIndex, solo, allTracksState = null) {
    // Solo implementation: properly handle multiple soloed tracks
    const allSynths = [];
    for (let i = 0; i < this.currentSequences.length; i++) {
      const synth = this.getSequenceSynth(i);
      if (synth) {
        allSynths.push({ index: i, synth });
      }
    }
    
    if (solo) {
      console.log(`🎯 Track ${trackIndex} soloed`);
    } else {
      console.log(`🎯 Track ${trackIndex} unsoloed`);
    }
    
    // We need to update all tracks based on the new solo state
    // This will be called from the store with proper track state information
    this.updateAllTracksSoloState(allTracksState);
  }
  
  // Helper method to update all tracks based on solo states
  updateAllTracksSoloState(tracksState) {
    if (!tracksState) {
      console.warn(`⚠️ updateAllTracksSoloState called with null/undefined tracksState`);
      return;
    }
    
    // Check if any track is soloed
    const hasSoloedTracks = tracksState.some(track => track.solo);
    
    console.log(`🔊 Updating all tracks solo state. Has soloed tracks: ${hasSoloedTracks}, tracks count: ${tracksState.length}`);
    
    tracksState.forEach((track, index) => {
      const synth = this.getSequenceSynth(index);
      if (synth) {
        if (synth.volume) {
          // Initialize original volume if not set (use a reasonable default)
          if (synth._originalVolume === undefined) {
            // Default volume for new synths (Tone.js default is around -10 to 0 dB)
            synth._originalVolume = 0; // 0 dB
            synth.volume.value = synth._originalVolume;
            console.log(`💾 Initialized original volume for track ${index}: ${synth._originalVolume} dB`);
          }
          
          let shouldBeAudible = false;
          
          if (hasSoloedTracks) {
            // If there are soloed tracks, only non-muted soloed tracks should be audible
            shouldBeAudible = track.solo && !track.muted;
            console.log(`🔊 Track ${index} "${track.name}" (solo=${track.solo}, muted=${track.muted}): ${shouldBeAudible ? 'AUDIBLE' : 'SILENT'}`);
          } else {
            // No tracks soloed, respect only mute states
            shouldBeAudible = !track.muted;
            console.log(`🔊 Track ${index} "${track.name}" (muted=${track.muted}): ${shouldBeAudible ? 'AUDIBLE' : 'SILENT'}`);
          }
          
          if (shouldBeAudible) {
            synth.volume.value = synth._originalVolume;
            console.log(`🔊 Track ${index} volume set to: ${synth.volume.value} dB`);
          } else {
            synth.volume.value = -Infinity;
            console.log(`🔇 Track ${index} muted (volume set to -Infinity)`);
          }
        } else {
          console.warn(`⚠️ Track ${index} synth has no volume control`);
        }
      } else {
        console.warn(`⚠️ No synth found for track ${index}`);
      }
    });
  }
  
  // Update effect parameters in real-time
  updateEffectParameter(effectId, parameter, value) {
    const effect = this.audioGraph.get(effectId);
    if (!effect) {
      console.warn(`🎛️ Effect not found: ${effectId}`);
      return;
    }
    
    if (!effect[parameter]) {
      console.warn(`🎛️ Parameter not found: ${effectId}.${parameter}`);
      return;
    }
    
    try {
      if (effect[parameter].value !== undefined) {
        effect[parameter].value = value;
        console.log(`🎛️ Updated ${effectId}.${parameter} = ${value}`);
      } else {
        effect[parameter] = value;
        console.log(`🎛️ Updated ${effectId}.${parameter} = ${value}`);
      }
    } catch (error) {
      console.warn(`🎛️ Failed to update ${effectId}.${parameter}:`, error);
    }
  }
  
  // Clear all audio graph nodes
  clearAudioGraph() {
    // Dispose all nodes except master destination
    this.audioGraph.forEach((node, id) => {
      if (id !== 'master' && node !== Tone.Destination && node.dispose) {
        node.dispose();
      }
    });
    
    // Keep master destination
    const master = this.audioGraph.get('master');
    this.audioGraph.clear();
    if (master) {
      this.audioGraph.set('master', master);
    }
    
    // Also clear all synths to ensure they get recreated
    this.synths.forEach(synth => {
      if (synth && synth.dispose) {
        synth.dispose();
      }
    });
    this.synths.clear();
    
    console.log('🧹 Audio graph and synths cleared');
  }

  // === DAW TRACK AUTOMATION INTEGRATION ===

  /**
   * Schedule automation for DAW tracks (not JMON automation)
   * @param {Array} dawTracks - Array of DAW track objects with automation data
   * @param {number} startTime - Start time in measures
   * @param {number} duration - Duration to schedule automation for
   */
  scheduleTrackAutomation(dawTracks, startTime = 0, duration = 16) {
    if (!dawTracks || !Array.isArray(dawTracks)) {
      console.warn('🎛️ No DAW tracks provided for automation scheduling');
      return;
    }

    // Clear existing automation events
    this.clearAutomationSchedule();

    dawTracks.forEach((track, trackIndex) => {
      if (!track.automation || !track.automation.channels || track.automation.channels.length === 0) {
        return; // Skip tracks without automation
      }

      console.log(`🎛️ Scheduling automation for track: ${track.name || `Track ${trackIndex}`}`);

      // Create automation schedule for this track
      const schedule = createAutomationSchedule(track, startTime, duration);
      
      if (schedule.length === 0) {
        console.log(`🎛️ No automation events for track: ${track.name}`);
        return;
      }

      // Store the schedule
      this.automationSchedule.set(track.id, schedule);

      // Schedule each automation event with Tone.js Transport
      schedule.forEach(event => {
        const transportTime = `${event.time}m`; // Convert measures to Tone.js time
        
        const scheduledId = Tone.Transport.schedule((time) => {
          this.applyAutomationEvent(event, time);
        }, transportTime);

        // Keep track of scheduled events for cleanup
        this.activeAutomationEvents.push({
          id: scheduledId,
          trackId: track.id,
          time: event.time,
          type: event.type
        });
      });

      console.log(`🎛️ Scheduled ${schedule.length} automation events for track: ${track.name}`);
    });

    console.log(`🎛️ Total automation events scheduled: ${this.activeAutomationEvents.length}`);
  }

  /**
   * Apply an automation event to Tone.js parameters
   * @param {Object} event - Automation event object
   * @param {number} time - Tone.js scheduled time
   */
  applyAutomationEvent(event, time) {
    try {
      const { type, value, targets, channel } = event;
      
      if (!targets) {
        console.warn(`🎛️ No targets found for automation type: ${type}`);
        return;
      }

      // Apply automation to target(s)
      if (Array.isArray(targets)) {
        targets.forEach(target => {
          applyAutomationToToneNode(target, type, value, time);
        });
      } else {
        applyAutomationToToneNode(targets, type, value, time);
      }

      console.log(`🎛️ Applied automation: ${type} = ${value} at time ${time}`);
    } catch (error) {
      console.error(`🎛️ Error applying automation event:`, error);
    }
  }

  /**
   * Get current automation value for a track and channel type at specific time
   * @param {string} trackId - Track ID
   * @param {string} automationType - Type of automation (velocity, pitchBend, etc.)
   * @param {number} time - Current time in measures
   * @returns {number|null} Current automation value or null if not found
   */
  getCurrentAutomationValue(trackId, automationType, time) {
    const track = this.currentDawTracks?.find(t => t.id === trackId);
    if (!track || !track.automation || !track.automation.channels) {
      return null;
    }

    const channel = track.automation.channels.find(c => c.type === automationType);
    if (!channel || !channel.points) {
      return null;
    }

    return getAutomationValueAtTime(channel.points, time, channel.range);
  }

  /**
   * Clear all scheduled automation events
   */
  clearAutomationSchedule() {
    // Cancel all scheduled automation events
    this.activeAutomationEvents.forEach(event => {
      Tone.Transport.clear(event.id);
    });

    this.activeAutomationEvents = [];
    this.automationSchedule.clear();

    console.log('🎛️ Cleared all automation schedules');
  }

  /**
   * Update automation for a specific track (called when automation is edited)
   * @param {string} trackId - Track ID to update
   * @param {Object} track - Updated track object
   * @param {number} currentTime - Current playback time
   * @param {number} duration - Duration to schedule ahead
   */
  updateTrackAutomation(trackId, track, currentTime = 0, duration = 16) {
    // Clear existing automation for this track
    const existingEvents = this.activeAutomationEvents.filter(event => event.trackId === trackId);
    existingEvents.forEach(event => {
      Tone.Transport.clear(event.id);
    });

    // Remove from active events
    this.activeAutomationEvents = this.activeAutomationEvents.filter(event => event.trackId !== trackId);

    // Remove from schedule
    this.automationSchedule.delete(trackId);

    // Re-schedule automation for this track
    this.scheduleTrackAutomation([track], currentTime, duration);

    console.log(`🎛️ Updated automation for track: ${track.name}`);
  }

  /**
   * Apply real-time automation value (for immediate parameter changes)
   * @param {string} trackId - Track ID
   * @param {string} automationType - Type of automation
   * @param {number} value - Automation value to apply
   */
  applyRealtimeAutomation(trackId, automationType, value) {
    const track = this.currentDawTracks?.find(t => t.id === trackId);
    if (!track) {
      console.warn(`🎛️ Track not found for realtime automation: ${trackId}`);
      return;
    }

    // Find the synth for this track
    const synthId = `sequence_synth_${this.currentDawTracks.indexOf(track)}`;
    const synth = this.synths.get(synthId);
    
    if (!synth) {
      console.warn(`🎛️ Synth not found for track: ${trackId}`);
      return;
    }

    // Apply automation immediately
    applyAutomationToToneNode(synth, automationType, value, 'now');
    
    console.log(`🎛️ Applied realtime automation: ${automationType} = ${value} to track ${trackId}`);
  }
  
  // Schedule JMON automation events
  scheduleAutomation(automationEvents) {
    automationEvents.forEach(event => {
      const time = this.parseTime(event.time);
      
      Tone.Transport.schedule((scheduledTime) => {
        this.handleAutomationEvent(event);
      }, time);
    });
  }
  
  // Handle individual automation event
  handleAutomationEvent(event) {
    try {
      const { target, value } = event;
      const [nodeId, parameter] = target.split('.');
      
      // Handle different automation targets
      if (target.startsWith('midi.')) {
        // MIDI automation (cc, pitchBend, aftertouch)
        const midiType = target.split('.')[1];
        // Implementation would depend on MIDI integration
        console.log(`MIDI automation: ${midiType} = ${value}`);
      } else {
        // Audio node parameter automation
        const node = this.audioGraph.get(nodeId) || this.synths.get(nodeId);
        if (node && node[parameter]) {
          if (node[parameter].value !== undefined) {
            // Tone.js parameter
            node[parameter].value = value;
          } else {
            // Direct property
            node[parameter] = value;
          }
          console.log(`Automated ${target} to ${value}`);
        } else {
          console.warn(`Automation target not found: ${target}`);
        }
      }
    } catch (error) {
      console.warn('Automation event failed:', error);
    }
  }
  
  clearAll() {
    Tone.Transport.cancel();
    
    // Clear main synths
    this.synths.forEach(synth => {
      if (synth && synth.dispose) synth.dispose();
    });
    this.synths.clear();
    
    // Clear preview synths
    this.previewSynths.forEach(synth => {
      if (synth && synth.dispose) synth.dispose();
    });
    this.previewSynths.clear();
    
    // Clear effects
    this.effects.forEach(effect => {
      if (effect && effect.dispose) effect.dispose();
    });
    this.effects.clear();
    
    // Clear audio graph
    this.clearAudioGraph();
  }

  // Set master volume
  setMasterVolume(volume) {
    const masterNode = this.audioGraph.get('master');
    if (masterNode && masterNode.volume) {
      // Convert 0-1 to dB (-60 to 0)
      const dbValue = volume === 0 ? -60 : -60 + (volume * 60);
      masterNode.volume.value = dbValue;
      console.log(`🔊 Master volume set to ${volume} (${dbValue.toFixed(1)} dB)`);
    } else {
      console.warn('⚠️ Master node not found or has no volume control');
    }
  }

  // Set master effects chain
  setMasterEffects(effects) {
    console.log('🎛️ Setting master effects:', effects);
    
    // First, disconnect all existing master effects
    this.clearMasterEffects();
    
    if (!effects || effects.length === 0) {
      // No effects, set master to Tone.Destination directly
      this.audioGraph.set('master', Tone.Destination);
      console.log('🎛️ No master effects, using direct destination');
      return;
    }
    
    // Build master effects chain
    let currentNode = null;
    let firstNode = null;
    
    effects.forEach((effectConfig, index) => {
      const effectId = `master_effect_${index}`;
      const effectNode = this.createAudioNode({
        id: effectId,
        type: effectConfig.type,
        options: effectConfig.options || {}
      });
      
      if (effectNode) {
        console.log(`🎛️ Created master effect ${effectConfig.type} (${effectId})`);
        this.audioGraph.set(effectId, effectNode);
        
        if (!firstNode) {
          firstNode = effectNode;
        }
        
        if (currentNode) {
          currentNode.connect(effectNode);
        }
        
        currentNode = effectNode;
      } else {
        console.error(`🎛️ Failed to create master effect ${effectConfig.type}`);
      }
    });
    
    // Connect the last effect to Tone.Destination
    if (currentNode) {
      currentNode.connect(Tone.Destination);
      console.log('🎛️ Connected master effect chain to destination');
    }
    
    // Set the first effect node as the new master destination
    if (firstNode) {
      this.audioGraph.set('master', firstNode);
      console.log('🎛️ Set master effects chain as new master destination');
    } else {
      this.audioGraph.set('master', Tone.Destination);
    }
    
    // Rebuild audio graph to reconnect all tracks to the new master chain
    console.log('🎛️ Rebuilding audio graph to connect tracks to master effects...');
    if (window.dawStore) {
      this.buildAudioGraph(window.dawStore.jmonData, window.dawStore.tracks);
    }
  }
  
  clearMasterEffects() {
    // Dispose existing master effects
    const keysToRemove = [];
    this.audioGraph.forEach((node, id) => {
      if (id.startsWith('master_effect_') && node !== Tone.Destination && node.dispose) {
        console.log(`🎛️ Disposing master effect: ${id}`);
        node.dispose();
        keysToRemove.push(id);
      }
    });
    
    keysToRemove.forEach(key => this.audioGraph.delete(key));
  }

  // Check for overlapping notes in monophonic synths and warn user
  checkForOverlappingNotes(sequence, synthType) {
    if (!sequence.notes || sequence.notes.length === 0) return;
    
    // Only check for monophonic synths
    const monophonicSynths = ['Synth', 'MonoSynth', 'AMSynth', 'FMSynth', 'DuoSynth', 'PluckSynth', 'MetalSynth', 'MembraneSynth'];
    if (!monophonicSynths.includes(synthType)) {
      console.log(`🎵 POLYPHONY CHECK: Skipping check for polyphonic synth "${synthType}"`);
      return;
    }
    
    console.log(`🎵 POLYPHONY CHECK: Checking ${sequence.notes.length} notes for monophonic synth "${synthType}" in track "${sequence.label}"`);
    
    // Parse and sort notes by time, converting to seconds
    const notesWithTime = sequence.notes.map(note => {
      const timeStr = this.parseTime(note.time || note.measure || 0);
      const durationStr = note.duration || '4n';
      
      // Convert time strings to seconds using Tone.js
      let startTimeSeconds = 0;
      let durationSeconds = 0;
      
      try {
        // Use Tone.Time to convert to seconds
        startTimeSeconds = Tone.Time(timeStr).toSeconds();
        durationSeconds = Tone.Time(durationStr).toSeconds();
      } catch (error) {
        console.warn(`Error parsing time for note ${note.note}:`, error);
        startTimeSeconds = 0;
        durationSeconds = Tone.Time('4n').toSeconds(); // Default to quarter note
      }
      
      console.log(`🎵 POLYPHONY CHECK: Note ${note.note} - original time: ${note.time} -> parsed: ${timeStr} -> seconds: ${startTimeSeconds.toFixed(3)}, duration: ${durationSeconds.toFixed(3)}`);
      
      return {
        ...note,
        startTime: startTimeSeconds,
        endTime: startTimeSeconds + durationSeconds,
        duration: durationSeconds
      };
    }).sort((a, b) => a.startTime - b.startTime);
    
    const overlaps = [];
    const simultaneousNotes = [];
    
    // Check for overlapping notes
    for (let i = 0; i < notesWithTime.length - 1; i++) {
      const currentNote = notesWithTime[i];
      
      for (let j = i + 1; j < notesWithTime.length; j++) {
        const nextNote = notesWithTime[j];
        
        // Check if notes overlap (with small tolerance for floating point errors)
        const tolerance = 0.001; // 1ms tolerance
        
        if (nextNote.startTime < currentNote.endTime - tolerance) {
          // Check if they start at exactly the same time
          if (Math.abs(nextNote.startTime - currentNote.startTime) < tolerance) {
            // Same start time - add to simultaneous notes
            const existingGroup = simultaneousNotes.find(group => 
              group.some(note => Math.abs(note.startTime - currentNote.startTime) < tolerance)
            );
            
            if (existingGroup) {
              if (!existingGroup.some(note => note.note === nextNote.note)) {
                existingGroup.push(nextNote);
              }
            } else {
              simultaneousNotes.push([currentNote, nextNote]);
            }
          } else {
            // Different start times but overlapping - add to overlaps
            overlaps.push({
              note1: currentNote,
              note2: nextNote,
              overlapStart: nextNote.startTime,
              overlapEnd: Math.min(currentNote.endTime, nextNote.endTime)
            });
          }
        }
      }
    }
    
    console.log(`🎵 POLYPHONY CHECK: Found ${overlaps.length} overlapping notes and ${simultaneousNotes.length} groups of simultaneous notes`);
    
    // Display warnings - both in console and UI
    if (overlaps.length > 0) {
      console.warn(`⚠️ POLYPHONY WARNING: Track "${sequence.label}" using monophonic synth "${synthType}" has ${overlaps.length} overlapping notes:`);
      overlaps.forEach((overlap, i) => {
        console.warn(`  ${i + 1}. ${overlap.note1.note} (${overlap.note1.time}) overlaps with ${overlap.note2.note} (${overlap.note2.time})`);
      });
      console.warn(`💡 SUGGESTION: Consider using "PolySynth" for polyphonic playback`);
      
      // Add UI notification
      this.addPolyphonyNotification(sequence.label, synthType, overlaps, 'overlapping');
    }
    
    if (simultaneousNotes.length > 0) {
      console.warn(`⚠️ POLYPHONY WARNING: Track "${sequence.label}" using monophonic synth "${synthType}" has notes at the same time:`);
      simultaneousNotes.forEach(group => {
        const timeStr = group[0].time || group[0].measure || '0:0:0';
        const noteNames = group.map(n => n.note).join(', ');
        console.warn(`  At ${timeStr}: ${noteNames} (only the last note will be heard)`);
      });
      console.warn(`💡 SUGGESTION: Consider using "PolySynth" for polyphonic playback`);
      
      // Add UI notification
      this.addPolyphonyNotification(sequence.label, synthType, simultaneousNotes, 'simultaneous');
    }
    
    // Return true if any polyphony issues were found
    return overlaps.length > 0 || simultaneousNotes.length > 0;
  }

  // Add polyphony notification to UI
  addPolyphonyNotification(trackLabel, synthType, issues, type) {
    console.log(`🎵 POLYPHONY NOTIFICATION: Attempting to add notification for ${trackLabel} (${synthType})`);
    console.log(`🎵 POLYPHONY NOTIFICATION: window.dawStore available:`, !!window.dawStore);
    console.log(`🎵 POLYPHONY NOTIFICATION: addPolyphonyWarning available:`, !!(window.dawStore && window.dawStore.addPolyphonyWarning));
    
    // Use a global reference to avoid circular dependency
    if (window.dawStore && window.dawStore.addPolyphonyWarning) {
      let detailsMessage = '';
      if (type === 'overlapping') {
        detailsMessage = `${issues.length} overlapping notes detected. Notes will cut off previous notes.`;
      } else if (type === 'simultaneous') {
        detailsMessage = `${issues.length} groups of simultaneous notes detected. Only the last note in each group will be heard.`;
      } else if (type === 'test') {
        detailsMessage = `Test notification for polyphony system.`;
      }
      
      console.log(`🎵 POLYPHONY NOTIFICATION: Calling addPolyphonyWarning with message:`, detailsMessage);
      try {
        window.dawStore.addPolyphonyWarning(trackLabel, synthType, detailsMessage);
        console.log(`🎵 POLYPHONY NOTIFICATION: Successfully called addPolyphonyWarning`);
      } catch (error) {
        console.error(`🎵 POLYPHONY NOTIFICATION: Error calling addPolyphonyWarning:`, error);
      }
    } else {
      console.error('🎵 POLYPHONY NOTIFICATION: Store not available on window object');
      console.log('🎵 POLYPHONY NOTIFICATION: window.dawStore:', window.dawStore);
      
      // Fallback: try direct import
      import('../stores/dawStore').then(({ useDawStore }) => {
        const store = useDawStore();
        console.log(`🎵 POLYPHONY NOTIFICATION: Fallback import - store available:`, !!store);
        console.log(`🎵 POLYPHONY NOTIFICATION: Fallback import - addPolyphonyWarning available:`, !!(store && store.addPolyphonyWarning));
        
        if (store && store.addPolyphonyWarning) {
          let detailsMessage = '';
          if (type === 'overlapping') {
            detailsMessage = `${issues.length} overlapping notes detected. Notes will cut off previous notes.`;
          } else if (type === 'simultaneous') {
            detailsMessage = `${issues.length} groups of simultaneous notes detected. Only the last note in each group will be heard.`;
          } else if (type === 'test') {
            detailsMessage = `Test notification for polyphony system.`;
          }
          
          console.log(`🎵 POLYPHONY NOTIFICATION: Fallback calling addPolyphonyWarning with message:`, detailsMessage);
          try {
            store.addPolyphonyWarning(trackLabel, synthType, detailsMessage);
            console.log(`🎵 POLYPHONY NOTIFICATION: Fallback successfully called addPolyphonyWarning`);
          } catch (error) {
            console.error(`🎵 POLYPHONY NOTIFICATION: Fallback error calling addPolyphonyWarning:`, error);
          }
        }
      }).catch(error => {
        console.error('🎵 POLYPHONY NOTIFICATION: Error importing store:', error);
      });
    }
  }
  
  // Debug method to check synth types
  debugSynthTypes() {
    console.log('🔍 DEBUG: Current synth types:');
    this.synths.forEach((synth, id) => {
      console.log(`  ${id}: ${synth.constructor.name}`);
    });
    return this.synths;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;