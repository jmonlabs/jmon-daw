# jmonDAW Functionality Guide

## 📁 Import vs Open - Clear Differences

### **Import Media** (file-plus icon)
- **Purpose**: Add individual audio/MIDI files to the current project
- **File Types**: WAV, MP3, OGG, FLAC, MIDI files
- **Behavior**: 
  - Creates new tracks automatically
  - Adds clips to the timeline
  - **Preserves existing project** and adds new content
  - Each file becomes a new track with audio/MIDI clips
- **Use Case**: Adding drums, samples, melodies to existing song

### **Open Project** (folder-open icon)
- **Purpose**: Load a complete JMON project file
- **File Types**: .jmon, .json files with JMON format
- **Behavior**:
  - **Replaces entire current project**
  - Loads all tracks, settings, tempo, effects
  - Restores complete session state
- **Use Case**: Opening saved compositions/songs

## 🍔 Hamburger Menu Features

The hamburger menu (☰) provides comprehensive DAW functionality:

### **Project Section**
- **New Project**: Create fresh project (with confirmation)
- **Save Project**: Download current project as .jmon file
- **Export Audio**: Render project to WAV (coming soon)

### **Settings Section**
- **Audio Settings**: Configure audio device, buffer size, sample rate
- **Shortcuts**: View keyboard shortcuts help

### **Help Section**
- **Help & Docs**: Links to JMON project documentation
- **About jmonDAW**: Version info and credits

## 🎵 jmonDAW Branding

**Renamed from SolidDAW to jmonDAW** to emphasize:
- **JMON format specialization**: First-class support for JSON Music Object Notation
- **jmon project integration**: Native compatibility with jmon ecosystem
- **Clear identity**: Focused on JMON workflow and format

### Updated Branding
- **Application Name**: jmonDAW
- **Window Title**: "jmonDAW - Digital Audio Workstation for JMON"
- **Package Name**: `jmon-daw`
- **About Dialog**: References jmon project heritage

## 🔊 Sample Path Handling System

### **Comprehensive Sample Management**

jmonDAW implements a sophisticated sample path resolution system:

#### **1. Sample Registration**
```javascript
// Each sample gets registered with multiple path options
{
  id: "unique-id",
  name: "kick.wav",
  originalPath: "/user/samples/kick.wav",
  relativePath: "drums/kick.wav", 
  url: "blob:http://localhost/abc123",
  blob: File,
  audioBuffer: AudioBuffer,
  baseUrl: "./samples/",
  fallbacks: ["./audio/kick.wav", "./drums/kick.wav"]
}
```

#### **2. Path Resolution Priority**
1. **Blob URLs** (uploaded files) - highest priority
2. **Direct URLs** (if accessible)
3. **Relative paths** + base URLs combination
4. **Original file paths** (if URLs)
5. **Fallback paths** (user-defined alternatives)

#### **3. Smart Sample Discovery**
```javascript
// Auto-tries multiple base paths
const baseUrls = [
  './samples/',
  './audio/', 
  '/samples/',
  '/audio/',
  '../samples/',
  '../audio/'
];
```

#### **4. Cross-Platform Compatibility**
- **Web**: Blob URLs for uploaded files
- **Local**: Relative paths with configurable base URLs
- **CDN**: Direct URLs with fallbacks
- **Widget**: Embedded samples or URL references

#### **5. JMON Integration**
```json
{
  "tracks": [
    {
      "name": "Drums",
      "samples": {
        "kick": {
          "url": "drums/kick.wav",
          "baseUrl": "./samples/",
          "fallbacks": ["./audio/kick.wav"]
        }
      }
    }
  ]
}
```

### **Sample Import Methods**

#### **File Upload**
- Drag & drop audio files
- File browser selection
- Automatic sample registration
- Blob URL generation for immediate playback

#### **URL Import**
- Remote sample loading
- CDN integration
- Automatic download and caching

#### **JMON Import**
- Reads sample paths from JMON files
- Attempts resolution with fallbacks
- Maintains compatibility with existing projects

### **Benefits**

✅ **Portable Projects**: JMON files work across different environments  
✅ **Flexible Paths**: Multiple resolution strategies  
✅ **Memory Efficient**: Smart caching and cleanup  
✅ **Error Resilient**: Graceful fallbacks when samples missing  
✅ **Cross-Platform**: Works in browsers, widgets, and local installs  

### **Usage Examples**

#### **Sample Pack Integration**
```javascript
SamplePathManager.createSamplePack(
  "Drum Pack", 
  "./samples/drums/", 
  ["kick.wav", "snare.wav", "hihat.wav"]
);
```

#### **Custom Base URLs**
```javascript
// Add project-specific sample directories
SamplePathManager.addBaseUrl("./my-project/audio/");
```

#### **Fallback Configuration**
```javascript
// Set multiple fallback paths for critical samples
SamplePathManager.setSampleFallbacks("main-kick", [
  "./backup/kick.wav",
  "https://cdn.example.com/samples/kick.wav"
]);
```

This comprehensive system ensures jmonDAW can handle samples reliably across different deployment scenarios while maintaining project portability and JMON format compatibility.