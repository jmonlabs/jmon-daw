import type { Project, Track, Clip, Instrument, MidiClipContent } from '../types';

export class ProjectExporter {
  /**
   * Convert internal project format to JMON object
   */
  static toJmon(project: Project): any {
    const jmonData: any = {
      format: 'jmonTone',
      version: '1.0',
      id: project.id,
      name: project.name,
      tempo: project.tempo,
      timeSignature: project.timeSignature,
      masterVolume: project.masterVolume,
      masterPan: project.masterPan,
      created: new Date().toISOString(),
      tracks: project.tracks.map(track => this.trackToJmon(track))
    };

    // Add master effects if any
    if (project.masterEffects && project.masterEffects.length > 0) {
      jmonData.masterEffects = project.masterEffects.map(effect => this.effectToJmon(effect));
    }

    return jmonData;
  }

  /**
   * Convert track to JMON format
   */
  private static trackToJmon(track: Track): any {
    const jmonTrack: any = {
      id: track.id,
      name: track.name,
      type: track.type,
      volume: track.volume,
      pan: track.pan,
      muted: track.muted,
      solo: track.solo,
      color: track.color
    };

    // Add instrument/synth information
    if (track.instrument) {
      jmonTrack.synth = this.instrumentToJmon(track.instrument);
    }

    // Add effects
    if (track.effects && track.effects.length > 0) {
      jmonTrack.effects = track.effects.map(effect => this.effectToJmon(effect));
    }

    // Convert clips to JMON sequences/notes
    if (track.clips && track.clips.length > 0) {
      if (track.clips.length === 1) {
        // Single clip - add notes directly to track
        const clip = track.clips[0];
        if (clip.content.type === 'midi') {
          jmonTrack.notes = this.midiClipToJmonNotes(clip.content);
          jmonTrack.start = clip.start;
          jmonTrack.duration = clip.duration;
        }
      } else {
        // Multiple clips - create sequences
        jmonTrack.sequences = track.clips.map(clip => this.clipToJmon(clip));
      }
    }

    return jmonTrack;
  }

  /**
   * Convert clip to JMON format
   */
  private static clipToJmon(clip: Clip): any {
    const jmonClip: any = {
      id: clip.id,
      name: clip.name,
      start: clip.start,
      duration: clip.duration,
      type: clip.type
    };

    if (clip.content.type === 'midi') {
      jmonClip.notes = this.midiClipToJmonNotes(clip.content);
      if (clip.content.tempo) {
        jmonClip.tempo = clip.content.tempo;
      }
    } else if (clip.content.type === 'audio') {
      jmonClip.audio = {
        url: clip.content.url,
        buffer: clip.content.audioBuffer ? 'AudioBuffer' : undefined
      };
    }

    return jmonClip;
  }

  /**
   * Convert MIDI clip content to JMON notes format
   */
  private static midiClipToJmonNotes(content: MidiClipContent): any[] {
    return content.notes.map(note => ({
      note: note.note,
      time: note.time,
      duration: note.duration,
      velocity: note.velocity
    }));
  }

  /**
   * Convert instrument to JMON synth format
   */
  private static instrumentToJmon(instrument: Instrument): any {
    const jmonSynth: any = {
      id: instrument.id,
      name: instrument.name,
      type: instrument.engine,
      parameters: { ...instrument.parameters }
    };

    // Add type-specific properties
    if (instrument.type === 'sampler') {
      jmonSynth.samples = instrument.parameters.samples || {};
      jmonSynth.baseUrl = instrument.parameters.baseUrl || '';
    }

    return jmonSynth;
  }

  /**
   * Convert effect to JMON format
   */
  private static effectToJmon(effect: any): any {
    return {
      id: effect.id,
      name: effect.name,
      type: effect.type,
      enabled: effect.enabled,
      parameters: { ...effect.parameters }
    };
  }

  /**
   * Export project as JMON file (download)
   */
  static downloadAsJmon(project: Project, filename?: string): void {
    const jmonData = this.toJmon(project);
    const jsonString = JSON.stringify(jmonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jmon`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export project as JSON string
   */
  static toJsonString(project: Project, pretty: boolean = true): string {
    const jmonData = this.toJmon(project);
    return JSON.stringify(jmonData, null, pretty ? 2 : 0);
  }

  /**
   * Export project metadata only
   */
  static getProjectMetadata(project: Project): any {
    return {
      id: project.id,
      name: project.name,
      tempo: project.tempo,
      timeSignature: project.timeSignature,
      trackCount: project.tracks.length,
      totalClips: project.tracks.reduce((sum, track) => sum + track.clips.length, 0),
      created: new Date().toISOString(),
      format: 'jmonTone',
      version: '1.0'
    };
  }

  /**
   * Export compatible with original jmon-tone.js format
   */
  static toOriginalJmonFormat(project: Project): any {
    const sequences: { [key: string]: any } = {};
    
    project.tracks.forEach((track, index) => {
      if (track.clips.length > 0) {
        const clip = track.clips[0]; // Use first clip for simplicity
        if (clip.content.type === 'midi') {
          sequences[track.name || `track${index}`] = {
            notes: this.midiClipToJmonNotes(clip.content),
            synth: track.instrument ? this.instrumentToJmon(track.instrument) : undefined,
            volume: track.volume,
            pan: track.pan
          };
        }
      }
    });

    return {
      tempo: project.tempo,
      timeSignature: project.timeSignature,
      sequences: sequences,
      title: project.name
    };
  }

  /**
   * Validate export data
   */
  static validateExport(jmonData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jmonData || typeof jmonData !== 'object') {
      errors.push('Export data must be an object');
      return { valid: false, errors };
    }

    // Check required fields
    if (!jmonData.name && !jmonData.title) {
      errors.push('Export must have a name or title');
    }

    if (!jmonData.tempo || typeof jmonData.tempo !== 'number') {
      errors.push('Export must have a valid tempo');
    }

    if (!jmonData.tracks && !jmonData.sequences) {
      errors.push('Export must have tracks or sequences');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create minimal JMON for testing
   */
  static createMinimalJmon(name: string = 'Test Project'): any {
    return {
      format: 'jmonTone',
      version: '1.0',
      name: name,
      tempo: 120,
      timeSignature: [4, 4],
      tracks: [
        {
          name: 'Piano',
          synth: { type: 'Synth' },
          notes: [
            { note: 'C4', time: 0, duration: 0.5, velocity: 1 },
            { note: 'E4', time: 0.5, duration: 0.5, velocity: 1 },
            { note: 'G4', time: 1, duration: 0.5, velocity: 1 }
          ]
        }
      ]
    };
  }
}