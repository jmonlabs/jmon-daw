import * as Tone from 'tone';
import { getSampleUrls, createJmonSampleConfig } from './sampleLibrary';

class AudioEngine {
  constructor() {
    this.isInitialized = false;
    this.synths = new Map();
    this.effects = new Map();
    this.audioGraph = new Map();
    this.connections = [];
    this.currentSequences = [];
    this.previewSynths = new Map(); // For real-time note previews
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
    
    // Synth nodes
    if (['Synth', 'PolySynth', 'MonoSynth', 'AMSynth', 'FMSynth', 'DuoSynth', 'PluckSynth', 'NoiseSynth'].includes(type)) {
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
        default:
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
      console.warn(`Unknown audio node type: ${type}`);
      return null;
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
      return [];
    }

    const scheduledEvents = [];
    
    sequence.notes.forEach((note, noteIndex) => {
      const originalTime = note.time || note.measure || 0;
      const time = this.parseTime(originalTime);
      const duration = note.duration;
      
      const eventId = Tone.Transport.schedule((scheduledTime) => {
        try {
          // Add small offset to prevent timing conflicts
          const playTime = scheduledTime + (noteIndex * 0.001);
          
          console.log(`🎼 Playing note: ${note.note} at time ${time} (scheduled: ${scheduledTime}, actual: ${playTime})`);
          
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
    
    // Simply start or resume the transport - don't reschedule on every play
    if (Tone.Transport.state === 'stopped') {
      // Only reschedule if transport was completely stopped
      this.rescheduleCurrentSequences();
      Tone.Transport.start();
      console.log(`🎵 Transport started from stopped state`);
    } else if (Tone.Transport.state === 'paused') {
      // Resume from pause: use current transport position directly
      // No need to restore position - it should already be where we want it
      console.log(`🔄 Resuming from current transport position: ${Tone.Transport.position}`);
      
      // Reschedule events that haven't played yet from this position
      this.rescheduleFromCurrentPosition();
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
        sequence.notes.forEach((note, noteIndex) => {
          const originalTime = note.time || note.measure || 0;
          const noteTime = this.parseTime(originalTime);
          const noteTimeInMeasures = this.parseTimeToMeasures(noteTime);
          
          // Only schedule notes that haven't been played yet
          if (noteTimeInMeasures >= currentTransportTime) {
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
  }

  clear() {
    // Clear all scheduled events from Transport
    Tone.Transport.cancel();
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
      jmonData.sequences.forEach((sequence, index) => {
        const synthId = `sequence_synth_${index}`;
        
        // Use sequence synth config or synthRef
        if (sequence.synthRef) {
          // Reference to existing audio graph node
          const refNode = this.audioGraph.get(sequence.synthRef);
          this.synths.set(synthId, refNode);
        } else if (sequence.synth) {
          // Create dedicated synth for this sequence
          const synthNode = this.createAudioNode({
            id: synthId,
            type: sequence.synth.type,
            options: sequence.synth.options || {}
          });
          
          this.synths.set(synthId, synthNode);
          
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
              }
            });
            
            // Connect final effect to master
            currentNode.connect(finalDestination);
            console.log(`🎛️ EFFECTS DEBUG: Connected effect chain to master for track ${index}`);
          } else {
            // No effects, connect directly to master
            synthNode.connect(finalDestination);
            console.log(`🎛️ EFFECTS DEBUG: No effects for track ${index}, connecting directly to master`);
          }
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
    return this.synths.get(synthId);
  }
  
  // Update track volume and pan controls
  updateTrackVolume(trackIndex, volume) {
    const synth = this.getSequenceSynth(trackIndex);
    if (synth && synth.volume) {
      // Convert 0-1 to dB (-60 to 0)
      synth.volume.value = -60 + (volume * 60);
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
  
  // Update effect parameters in real-time
  updateEffectParameter(effectId, parameter, value) {
    const effect = this.audioGraph.get(effectId);
    if (effect && effect[parameter]) {
      try {
        if (effect[parameter].value !== undefined) {
          effect[parameter].value = value;
        } else {
          effect[parameter] = value;
        }
      } catch (error) {
        console.warn(`Failed to update ${effectId}.${parameter}:`, error);
      }
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
}

export const audioEngine = new AudioEngine();
export default audioEngine;