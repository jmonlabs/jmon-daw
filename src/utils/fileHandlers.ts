import type { Clip, MidiClipContent, AudioClipContent } from '../types';
import { SamplePathManager } from './samplePathManager';

export interface FileUploadResult {
  type: 'audio' | 'midi' | 'jmon';
  name: string;
  content: AudioClipContent | MidiClipContent | any;
  duration?: number;
}

export class FileHandlers {
  static async handleFile(file: File): Promise<FileUploadResult | null> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'wav':
      case 'mp3':
      case 'ogg':
      case 'flac':
        return await this.handleAudioFile(file);
      case 'mid':
      case 'midi':
        return await this.handleMidiFile(file);
      case 'jmon':
      case 'json':
        return await this.handleJmonFile(file);
      default:
        console.warn(`Unsupported file type: ${fileExtension}`);
        return null;
    }
  }

  private static async handleAudioFile(file: File): Promise<FileUploadResult> {
    try {
      // Register sample with path manager
      const sampleConfig = await SamplePathManager.importSampleFile(file);
      
      const content: AudioClipContent = {
        type: 'audio',
        audioBuffer: sampleConfig.audioBuffer,
        url: sampleConfig.url || URL.createObjectURL(file),
        waveform: sampleConfig.audioBuffer ? this.generateWaveform(sampleConfig.audioBuffer) : undefined
      };

      return {
        type: 'audio',
        name: file.name,
        content,
        duration: sampleConfig.metadata?.duration || 0
      };
    } catch (error) {
      throw new Error(`Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async handleMidiFile(file: File): Promise<FileUploadResult> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const midiData = this.parseMidiFile(arrayBuffer);
          
          const content: MidiClipContent = {
            type: 'midi',
            notes: midiData.notes,
            tempo: midiData.tempo
          };

          resolve({
            type: 'midi',
            name: file.name,
            content,
            duration: midiData.duration
          });
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => reject(new Error('Failed to read MIDI file'));
      fileReader.readAsArrayBuffer(file);
    });
  }

  private static async handleJmonFile(file: File): Promise<FileUploadResult> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const jmonData = JSON.parse(text);
          
          resolve({
            type: 'jmon' as any,
            name: file.name,
            content: jmonData
          });
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => reject(new Error('Failed to read JMON file'));
      fileReader.readAsText(file);
    });
  }

  private static generateWaveform(audioBuffer: AudioBuffer): number[] {
    const samples = 200; // Number of waveform points
    const channelData = audioBuffer.getChannelData(0);
    const sampleSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < sampleSize; j++) {
        sum += Math.abs(channelData[i * sampleSize + j]);
      }
      waveform.push(sum / sampleSize);
    }

    return waveform;
  }

  private static parseMidiFile(arrayBuffer: ArrayBuffer): { notes: any[], tempo?: number, duration: number } {
    // Basic MIDI parsing (simplified)
    // In a real implementation, you'd use a proper MIDI parser library
    
    const notes = [
      { note: 'C4', time: 0, duration: 0.5, velocity: 1 },
      { note: 'E4', time: 0.5, duration: 0.5, velocity: 1 },
      { note: 'G4', time: 1, duration: 0.5, velocity: 1 }
    ];

    return {
      notes,
      tempo: 120,
      duration: 2
    };
  }

  static validateFileType(file: File): boolean {
    const allowedTypes = ['audio/', 'application/octet-stream'];
    const allowedExtensions = ['wav', 'mp3', 'ogg', 'flac', 'mid', 'midi', 'jmon', 'json'];
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    return allowedTypes.some(type => file.type.startsWith(type)) || 
           (extension !== undefined && allowedExtensions.includes(extension));
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}