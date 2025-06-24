/**
 * Sample Path Manager for jmonDAW
 * Handles sample file paths, URLs, and fallbacks for cross-platform compatibility
 */

export interface SampleConfig {
  id: string;
  name: string;
  originalPath?: string;
  relativePath?: string;
  url?: string;
  blob?: Blob;
  audioBuffer?: AudioBuffer;
  baseUrl?: string;
  fallbacks?: string[];
  metadata?: {
    duration?: number;
    sampleRate?: number;
    channels?: number;
    size?: number;
    format?: string;
  };
}

export class SamplePathManager {
  private static samples: Map<string, SampleConfig> = new Map();
  private static baseUrls: string[] = [
    './samples/',
    './audio/',
    '/samples/',
    '/audio/',
    '../samples/',
    '../audio/'
  ];

  /**
   * Register a sample with various path options
   */
  static registerSample(config: SampleConfig): void {
    this.samples.set(config.id, config);
  }

  /**
   * Resolve a sample path to a usable URL
   */
  static async resolveSamplePath(sampleId: string): Promise<string | null> {
    const sample = this.samples.get(sampleId);
    if (!sample) {
      console.warn(`Sample not found: ${sampleId}`);
      return null;
    }

    // 1. Try blob URL first (uploaded files)
    if (sample.blob) {
      return URL.createObjectURL(sample.blob);
    }

    // 2. Try direct URL
    if (sample.url) {
      if (await this.checkUrlExists(sample.url)) {
        return sample.url;
      }
    }

    // 3. Try relative path with base URLs
    if (sample.relativePath) {
      for (const baseUrl of this.baseUrls) {
        const fullUrl = baseUrl + sample.relativePath;
        if (await this.checkUrlExists(fullUrl)) {
          return fullUrl;
        }
      }
    }

    // 4. Try original path (if it's a URL)
    if (sample.originalPath && this.isUrl(sample.originalPath)) {
      if (await this.checkUrlExists(sample.originalPath)) {
        return sample.originalPath;
      }
    }

    // 5. Try fallback paths
    if (sample.fallbacks) {
      for (const fallback of sample.fallbacks) {
        if (await this.checkUrlExists(fallback)) {
          return fallback;
        }
      }
    }

    console.warn(`Could not resolve sample path for: ${sampleId}`);
    return null;
  }

  /**
   * Import sample from file input
   */
  static async importSampleFile(file: File): Promise<SampleConfig> {
    const id = crypto.randomUUID();
    const audioBuffer = await this.fileToAudioBuffer(file);
    
    const config: SampleConfig = {
      id,
      name: file.name,
      originalPath: file.name,
      blob: file,
      audioBuffer,
      metadata: {
        duration: audioBuffer?.duration,
        sampleRate: audioBuffer?.sampleRate,
        channels: audioBuffer?.numberOfChannels,
        size: file.size,
        format: file.type
      }
    };

    this.registerSample(config);
    return config;
  }

  /**
   * Import sample from URL
   */
  static async importSampleUrl(url: string, name?: string): Promise<SampleConfig> {
    const id = crypto.randomUUID();
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const audioBuffer = await this.blobToAudioBuffer(blob);
      
      const config: SampleConfig = {
        id,
        name: name || this.extractFilenameFromUrl(url),
        originalPath: url,
        url,
        blob,
        audioBuffer,
        metadata: {
          duration: audioBuffer?.duration,
          sampleRate: audioBuffer?.sampleRate,
          channels: audioBuffer?.numberOfChannels,
          size: blob.size,
          format: blob.type
        }
      };

      this.registerSample(config);
      return config;
    } catch (error) {
      throw new Error(`Failed to import sample from URL: ${url}`);
    }
  }

  /**
   * Export sample configuration for JMON
   */
  static exportSampleForJmon(sampleId: string): any {
    const sample = this.samples.get(sampleId);
    if (!sample) return null;

    return {
      id: sample.id,
      name: sample.name,
      url: sample.relativePath || sample.originalPath || sample.url,
      baseUrl: sample.baseUrl,
      fallbacks: sample.fallbacks,
      metadata: sample.metadata
    };
  }

  /**
   * Import sample configuration from JMON
   */
  static async importSampleFromJmon(jmonSample: any): Promise<SampleConfig | null> {
    try {
      const config: SampleConfig = {
        id: jmonSample.id || crypto.randomUUID(),
        name: jmonSample.name,
        originalPath: jmonSample.url,
        relativePath: jmonSample.url,
        baseUrl: jmonSample.baseUrl,
        fallbacks: jmonSample.fallbacks,
        metadata: jmonSample.metadata
      };

      // Try to resolve and load the sample
      const resolvedUrl = await this.resolveSamplePath(config.id);
      if (resolvedUrl) {
        config.url = resolvedUrl;
        
        // Load audio buffer if possible
        try {
          const response = await fetch(resolvedUrl);
          const blob = await response.blob();
          config.blob = blob;
          config.audioBuffer = await this.blobToAudioBuffer(blob);
        } catch (error) {
          console.warn(`Could not load audio buffer for sample: ${config.name}`);
        }
      }

      this.registerSample(config);
      return config;
    } catch (error) {
      console.error('Failed to import sample from JMON:', error);
      return null;
    }
  }

  /**
   * Get all registered samples
   */
  static getAllSamples(): SampleConfig[] {
    return Array.from(this.samples.values());
  }

  /**
   * Clear all samples
   */
  static clearSamples(): void {
    // Revoke object URLs to prevent memory leaks
    this.samples.forEach(sample => {
      if (sample.url && sample.url.startsWith('blob:')) {
        URL.revokeObjectURL(sample.url);
      }
    });
    this.samples.clear();
  }

  /**
   * Add base URL for sample resolution
   */
  static addBaseUrl(baseUrl: string): void {
    if (!this.baseUrls.includes(baseUrl)) {
      this.baseUrls.unshift(baseUrl);
    }
  }

  /**
   * Set fallback paths for a sample
   */
  static setSampleFallbacks(sampleId: string, fallbacks: string[]): void {
    const sample = this.samples.get(sampleId);
    if (sample) {
      sample.fallbacks = fallbacks;
    }
  }

  // Helper methods

  private static async checkUrlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private static isUrl(path: string): boolean {
    try {
      new URL(path);
      return true;
    } catch {
      return false;
    }
  }

  private static extractFilenameFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() || 'sample';
    } catch {
      return 'sample';
    }
  }

  private static async fileToAudioBuffer(file: File): Promise<AudioBuffer | undefined> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Could not decode audio file:', error);
      return undefined;
    }
  }

  private static async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer | undefined> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.warn('Could not decode audio blob:', error);
      return undefined;
    }
  }

  /**
   * Create a sample pack configuration
   */
  static createSamplePack(name: string, baseUrl: string, samples: string[]): void {
    samples.forEach(samplePath => {
      const id = crypto.randomUUID();
      const fileName = samplePath.split('/').pop() || samplePath;
      
      const config: SampleConfig = {
        id,
        name: fileName,
        relativePath: samplePath,
        baseUrl,
        url: baseUrl + samplePath
      };

      this.registerSample(config);
    });
  }

  /**
   * Handle drag and drop sample files
   */
  static async handleDroppedFiles(files: FileList): Promise<SampleConfig[]> {
    const configs: SampleConfig[] = [];
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/')) {
        try {
          const config = await this.importSampleFile(file);
          configs.push(config);
        } catch (error) {
          console.error(`Failed to import ${file.name}:`, error);
        }
      }
    }
    
    return configs;
  }
}