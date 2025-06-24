# SolidDAW - Modern Digital Audio Workstation

A modern, feature-rich Digital Audio Workstation built with SolidJS and Tone.js, evolved from the original tone-daw project.

## Features

### ✅ Fully Implemented
- **Modern UI Framework**: Built with SolidJS for reactive performance
- **Audio Engine**: Powered by Tone.js for synthesis and sample playback
- **File Support**: Drag & drop or browse for audio and MIDI files
  - Audio formats: WAV, MP3, OGG, FLAC
  - MIDI files: .mid, .midi
  - JMON files: Custom JSON music notation
- **Track Management**: Add, remove, and configure tracks
- **Transport Controls**: Play, stop, record, and loop functionality
- **Visual Feedback**: Waveform display for audio clips
- **Real-time Updates**: Reactive UI with live transport position
- **Widget Integration**: AnyWidget support for Marimo and Observable
- **JMON Import/Export**: Full project save/load in JMON format
- **Multi-language Support**: English, French, Spanish translations
- **Synthesizer Controls**: Multiple synth types and parameter controls
- **Sample Playback**: Advanced audio sample management
- **Audio Effects**: Built-in effects and routing capabilities

## Quick Start

### Standalone Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Widget Integration

#### Marimo Notebooks
```python
from solid_daw_widget import create_daw_widget

# Create sample JMON data
jmon_data = {
    "name": "My Project", 
    "tempo": 120,
    "tracks": [{"name": "Piano", "notes": [...]}]
}

# Create widget
widget = create_daw_widget(jmon_data=jmon_data, height=600)
widget
```

#### Observable Framework
```javascript
import {SolidDAW} from "https://cdn.jsdelivr.net/npm/solid-daw-widget@latest"

dawWidget = {
  const widget = SolidDAW.create();
  const container = html`<div style="height: 600px;"></div>`;
  widget.render(container, {jmonData, height: 600});
  return container;
}
```

See [WIDGET_INTEGRATION.md](WIDGET_INTEGRATION.md) for complete integration guide.

## Project Structure

```
src/
├── components/          # UI components
│   ├── Header.tsx      # Top navigation and project info
│   ├── TransportBar.tsx # Transport controls
│   ├── TrackArea.tsx   # Track management and sequencer
│   ├── DropZone.tsx    # File drag & drop handling
│   └── FileBrowser.tsx # File browser dialog
├── stores/             # State management
│   ├── projectStore.ts # Project and track data
│   ├── transportStore.ts # Playback transport
│   ├── viewStore.ts    # UI view state
│   └── context.tsx     # Store providers
├── lib/                # Audio libraries
│   ├── audioEngine.ts  # Tone.js wrapper
│   ├── Tone.js         # Tone.js library
│   ├── jmon-tone.js    # JMON format support
│   └── ToneDAW.js      # Original DAW logic
├── utils/              # Utilities
│   └── fileHandlers.ts # File processing
└── types/              # TypeScript definitions
    └── index.ts        # Core types
```

## Usage

### Adding Tracks
1. Click the "+" button in the track sidebar
2. Or drag audio/MIDI files onto the empty area

### Importing Files
1. **Drag & Drop**: Drag files from your file system onto tracks or empty areas
2. **File Browser**: Click "📁 Browse Files" in the header

### Transport Controls
- **Play/Pause**: Start or pause playback
- **Stop**: Stop playback and return to start
- **Record**: Enable recording mode
- **Loop**: Toggle loop mode between loop points

### Track Controls
- **M**: Mute track
- **S**: Solo track
- **R**: Arm track for recording
- **Volume**: Adjust track volume with slider

## File Format Support

### Audio Files
- **WAV**: Uncompressed audio
- **MP3**: Compressed audio
- **OGG**: Open source compressed audio
- **FLAC**: Lossless compressed audio

### MIDI Files
- **MID/MIDI**: Standard MIDI format
- Automatic conversion to internal note format

### JMON Files
- **JSON Music Object Notation**: Custom format from the jmon project
- Supports complex musical structures and synthesizer definitions

## Technical Architecture

### State Management
- **SolidJS Stores**: Reactive state management
- **Project Store**: Tracks, clips, and project settings
- **Transport Store**: Playback state and timing
- **View Store**: UI state and selection

### Audio Engine
- **Tone.js Integration**: Professional audio synthesis
- **Real-time Processing**: Low-latency audio playback
- **Format Support**: Multiple audio and MIDI formats
- **Effects Chain**: Modular effects processing

### Build System
- **Vite**: Fast development and building
- **TypeScript**: Type-safe development
- **Hot Reload**: Instant development feedback

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build standalone application
- `npm run build:widget`: Build widget for external integration  
- `npm run build:all`: Build both application and widget
- `npm run preview`: Preview production build
- `npm run typecheck`: Check TypeScript types

## Evolution from Original

This SolidDAW represents a complete evolution of the original tone-daw project:

### Improvements
- **Modern Framework**: SolidJS instead of vanilla JavaScript
- **Better Architecture**: Modular, reactive design
- **Enhanced UX**: Drag & drop, visual feedback
- **Type Safety**: Full TypeScript support
- **Performance**: Optimized rendering and state updates

### Maintained Compatibility
- **Tone.js Core**: Same audio engine foundation
- **JMON Support**: Compatible with jmon format
- **API Compatibility**: Can process original project files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built on the foundation of the original tone-daw project
- Powered by Tone.js for audio processing
- Uses jmon-tone.js for JMON format support
- UI framework provided by SolidJS