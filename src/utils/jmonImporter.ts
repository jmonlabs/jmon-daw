import type { Project, Track, Clip, Instrument, MidiClipContent } from '../types';
import { audioEngine } from '../lib/audioEngine';

export class JmonImporter {
  /**
   * Import a JMON object and convert it to our internal project format
   */
  static async importJmonObject(jmonData: any): Promise<Project> {
    try {
      // Validate JMON structure
      if (!jmonData || typeof jmonData !== 'object') {
        throw new Error('Invalid JMON data: must be an object');
      }

      console.log('Raw JMON data keys:', Object.keys(jmonData));
      console.log('Full JMON object:', JSON.stringify(jmonData, null, 2));
      console.log('JMON data.bpm:', jmonData.bpm, 'type:', typeof jmonData.bpm);
      console.log('JMON data.tempo:', jmonData.tempo, 'type:', typeof jmonData.tempo);
      
      const detectedTempo = jmonData.tempo || jmonData.bpm || 120;
      console.log('JMON import - detected tempo:', detectedTempo, 'from jmonData.tempo:', jmonData.tempo, 'jmonData.bpm:', jmonData.bpm);
      
      const project: Project = {
        id: jmonData.id || crypto.randomUUID(),
        name: jmonData.metadata?.name || jmonData.name || jmonData.title || 'JMON Project',
        tempo: detectedTempo,
        timeSignature: jmonData.timeSignature || jmonData.time_signature || [4, 4],
        tracks: [],
        masterVolume: jmonData.masterVolume || 0.8,
        masterPan: jmonData.masterPan || 0,
        masterEffects: []
      };

      // Process tracks from JMON data
      if (jmonData.tracks && Array.isArray(jmonData.tracks)) {
        project.tracks = await Promise.all(
          jmonData.tracks.map((trackData: any, index: number) => 
            this.convertJmonTrack(trackData, index, detectedTempo)
          )
        );
      } else if (jmonData.sequences || jmonData.patterns) {
        // Handle JMON with sequences/patterns structure
        project.tracks = await this.convertJmonSequences(jmonData, detectedTempo);
      } else if (jmonData.notes || jmonData.events) {
        // Handle single track JMON
        const singleTrack = await this.convertJmonTrack({
          name: project.name,
          notes: jmonData.notes || jmonData.events,
          synth: jmonData.synth || jmonData.instrument
        }, 0, detectedTempo);
        project.tracks = [singleTrack];
      }

      return project;
    } catch (error) {
      console.error('JMON import error:', error);
      throw new Error(`Failed to import JMON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert a single JMON track to our internal format
   */
  private static async convertJmonTrack(trackData: any, index: number, projectBPM: number = 120): Promise<Track> {
    const trackId = crypto.randomUUID();
    
    const track: Track = {
      id: trackId,
      name: trackData.name || trackData.label || `Track ${index + 1}`,
      type: this.inferTrackType(trackData),
      volume: trackData.volume || trackData.gain || 0.8,
      pan: trackData.pan || 0,
      muted: trackData.muted || trackData.mute || false,
      solo: trackData.solo || false,
      armed: false,
      color: trackData.color || this.getTrackColor(index),
      clips: [],
      effects: [],
      instrument: trackData.synth || trackData.instrument ? 
        this.convertJmonInstrument(trackData.synth || trackData.instrument) : {
          id: `${trackId}-synth`,
          name: 'Synth',
          type: 'synth',
          engine: 'synth',
          parameters: {}
        }
    };

    // Convert notes/events to individual clips (note tiles)
    if (trackData.notes || trackData.events || trackData.sequence) {
      const notes = trackData.notes || trackData.events || trackData.sequence;
      track.clips = await this.convertNotesToClips(notes, trackId, track.color, projectBPM);
    }

    return track;
  }

  /**
   * Convert JMON sequences/patterns structure
   */
  private static async convertJmonSequences(jmonData: any, projectBPM: number = 120): Promise<Track[]> {
    const tracks: Track[] = [];
    const sequences = jmonData.sequences || jmonData.patterns || [];

    // Handle array of sequences (jmonTone format)
    if (Array.isArray(sequences)) {
      for (let i = 0; i < sequences.length; i++) {
        const sequence = sequences[i];
        if (sequence && typeof sequence === 'object') {
          const track = await this.convertJmonTrack({
            name: sequence.label || sequence.name || `Sequence ${i + 1}`,
            notes: sequence.notes || sequence.events,
            synthRef: sequence.synthRef,
            synth: sequence.synth,
            ...sequence
          }, i, projectBPM);
          tracks.push(track);
        }
      }
    } else {
      // Handle object of sequences
      for (const [seqName, seqData] of Object.entries(sequences)) {
        if (typeof seqData === 'object' && seqData !== null) {
          const track = await this.convertJmonTrack({
            name: seqName,
            ...seqData
          }, tracks.length, projectBPM);
          tracks.push(track);
        }
      }
    }

    return tracks;
  }

  /**
   * Convert notes to individual clips (note tiles)
   */
  private static async convertNotesToClips(notes: any, trackId: string, trackColor: string, projectBPM: number = 120): Promise<Clip[]> {
    const clips: Clip[] = [];
    
    console.log('Converting notes to clips:', notes);
    
    if (Array.isArray(notes)) {
      for (let i = 0; i < notes.length; i++) {
        console.log('Processing note', i, ':', notes[i]);
        const note = this.convertJmonNote(notes[i], undefined, projectBPM);
        
        // Ensure minimum duration for visibility (at least 25px at 200px per beat)
        const minDuration = 0.125;
        const duration = Math.max(note.duration, minDuration);
        
        // Create a note with zero offset since the clip position handles the timing
        const clipNote = {
          ...note,
          time: 0  // Note starts at the beginning of the clip
        };
        
        const clip: Clip = {
          id: crypto.randomUUID(),
          name: `${note.note}`,
          start: note.time,  // Clip positioned at the note's original time
          end: note.time + duration,
          duration: duration,
          trackId: trackId,
          type: 'midi',
          content: {
            type: 'midi',
            notes: [clipNote],  // Note starts at time 0 within the clip
            tempo: projectBPM
          },
          color: this.getNoteColor(note.note, i)
        };
        
        clips.push(clip);
      }
    }
    
    return clips;
  }

  /**
   * Get color for individual note tiles
   */
  private static getNoteColor(noteName: string, index: number): string {
    // Create colors based on note pitch or index
    const colors = [
      '#ce9187', // coral pink (primary accent)
      '#7db881', // green
      '#8db4d6', // blue  
      '#d6c176', // yellow
      '#d67676', // red
      '#b19cd9', // purple
      '#87ceaa', // teal
      '#d9a599'  // light coral
    ];
    return colors[index % colors.length];
  }

  /**
   * Convert JMON notes to our clip content format
   */
  private static async convertJmonNotes(notes: any, trackData: any, projectBPM: number): Promise<MidiClipContent> {
    const processedNotes = [];
    let maxTime = 0;

    if (Array.isArray(notes)) {
      for (const note of notes) {
        const processedNote = this.convertJmonNote(note);
        processedNotes.push(processedNote);
        maxTime = Math.max(maxTime, processedNote.time + processedNote.duration);
      }
    } else if (typeof notes === 'object') {
      // Handle object-based note format
      for (const [time, noteData] of Object.entries(notes)) {
        const noteTime = parseFloat(time);
        const processedNote = this.convertJmonNote(noteData, noteTime);
        processedNotes.push(processedNote);
        maxTime = Math.max(maxTime, processedNote.time + processedNote.duration);
      }
    }

    return {
      type: 'midi',
      notes: processedNotes,
      tempo: trackData.tempo || projectBPM,
      duration: maxTime
    };
  }

  /**
   * Convert a single JMON note
   */
  private static convertJmonNote(note: any, timeOverride?: number, projectBPM: number = 120): any {
    console.log('convertJmonNote called with:', note, 'timeOverride:', timeOverride);
    
    if (typeof note === 'string' || typeof note === 'number') {
      return {
        note: note,
        time: timeOverride || 0,
        duration: 0.5,
        velocity: 1
      };
    }

    // Convert time from JMON format (e.g., "0:1:0" or "1:2:3") to beats
    let timeInBeats = 0;
    console.log('Processing note time:', note.time, 'type:', typeof note.time);
    
    if (note.time && typeof note.time === 'string') {
      const timeParts = note.time.split(':');
      if (timeParts.length >= 2) {
        const bars = parseInt(timeParts[0]) || 0;
        const beats = parseInt(timeParts[1]) || 0;
        const sixteenths = parseInt(timeParts[2]) || 0;
        // Convert to total beats (assuming 4/4 time signature)
        // bars * 4 (beats per bar) + beats + sixteenths / 4 (sixteenths to beats)
        timeInBeats = bars * 4 + beats + sixteenths / 4;
        console.log('JMON time conversion:', note.time, '-> bars:', bars, 'beats:', beats, 'sixteenths:', sixteenths, '= total beats:', timeInBeats);
      }
    } else if (typeof note.time === 'number') {
      // Handle numeric time - in JMON this is already in BEATS
      timeInBeats = note.time;
      console.log('Note has numeric time in BEATS:', timeInBeats);
    }

    // Convert duration from JMON format (e.g., "4n", "2n", "8n") to beats
    let durationInBeats = 0.5; // default quarter note
    if (note.duration && typeof note.duration === 'string') {
      const durationStr = note.duration;
      if (durationStr.includes('n')) {
        const noteValue = parseInt(durationStr.replace('n', ''));
        durationInBeats = 4 / noteValue; // whole note = 4 beats
      }
    } else if (typeof note.duration === 'number') {
      // Numeric duration in JMON is also in BEATS
      durationInBeats = note.duration;
      console.log('Note has numeric duration in BEATS:', durationInBeats);
    }

    const result = {
      note: Array.isArray(note.note) ? note.note[0] : (note.note || note.pitch || note.frequency || 'C4'),
      time: timeOverride !== undefined ? timeOverride : timeInBeats,
      duration: durationInBeats,
      velocity: note.velocity || note.volume || note.amp || 1
    };
    
    console.log('convertJmonNote result:', result);
    return result;
  }

  /**
   * Convert JMON instrument/synth definition
   */
  private static convertJmonInstrument(synthData: any): Instrument {
    if (typeof synthData === 'string') {
      // Map common JMON synth names to our synth types
      const synthType = this.mapJmonSynthType(synthData);
      return {
        id: crypto.randomUUID(),
        name: synthData,
        type: synthType,
        engine: synthType,
        parameters: {}
      };
    }

    const synthType = this.mapJmonSynthType(synthData.type || synthData.name || 'synth');
    console.log('Converting JMON instrument:', synthData.type || synthData.name, '-> internal type:', synthType);
    
    return {
      id: crypto.randomUUID(),
      name: synthData.name || synthData.type || 'Synth',
      type: synthType,
      engine: synthType,
      parameters: {
        ...synthData.options,
        ...synthData.params,
        ...synthData.parameters
      }
    };
  }

  /**
   * Map JMON synth types to our internal synth types
   */
  private static mapJmonSynthType(synthName: string): 'synth' | 'membraneSynth' | 'pluckSynth' | 'fmSynth' | 'amSynth' {
    const name = synthName.toLowerCase();
    
    if (name.includes('drum') || name.includes('membrane') || name.includes('kick') || name.includes('percussion')) {
      return 'membraneSynth';
    }
    if (name.includes('pluck') || name.includes('string') || name.includes('guitar')) {
      return 'pluckSynth';
    }
    if (name.includes('fm') || name.includes('frequency modulation')) {
      return 'fmSynth';
    }
    if (name.includes('am') || name.includes('amplitude modulation')) {
      return 'amSynth';
    }
    
    // Default to basic synth
    return 'synth';
  }

  /**
   * Infer track type from JMON data
   */
  private static inferTrackType(trackData: any): 'audio' | 'midi' | 'instrument' {
    if (trackData.audio || trackData.sample || trackData.buffer) {
      return 'audio';
    }
    if (trackData.notes || trackData.events || trackData.sequence) {
      return trackData.synth || trackData.instrument ? 'instrument' : 'midi';
    }
    return 'instrument';
  }

  /**
   * Infer instrument type from synth data
   */
  private static inferInstrumentType(synthData: any): 'synth' | 'sampler' | 'drum' | 'custom' {
    const type = (synthData.type || '').toLowerCase();
    
    if (type.includes('sampler') || synthData.samples) return 'sampler';
    if (type.includes('drum') || type.includes('percussion')) return 'drum';
    if (type.includes('custom')) return 'custom';
    return 'synth';
  }

  /**
   * Get default track color based on index
   */
  private static getTrackColor(index: number): string {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    return colors[index % colors.length];
  }

  /**
   * Import JMON from URL or fetch request
   */
  static async importFromUrl(url: string): Promise<Project> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const jmonData = await response.json();
      return await this.importJmonObject(jmonData);
    } catch (error) {
      throw new Error(`Failed to fetch JMON from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate JMON structure
   */
  static validateJmon(jmonData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jmonData || typeof jmonData !== 'object') {
      errors.push('JMON must be an object');
      return { valid: false, errors };
    }

    // Check for required fields or common structures
    const hasValidStructure = 
      jmonData.tracks || 
      jmonData.sequences || 
      jmonData.patterns || 
      jmonData.notes || 
      jmonData.events;

    if (!hasValidStructure) {
      errors.push('JMON must contain tracks, sequences, patterns, notes, or events');
    }

    // Validate tempo if present
    if (jmonData.tempo && (typeof jmonData.tempo !== 'number' || jmonData.tempo <= 0)) {
      errors.push('Tempo must be a positive number');
    }

    return { valid: errors.length === 0, errors };
  }
}