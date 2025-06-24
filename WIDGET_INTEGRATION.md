# SolidDAW Widget Integration Guide

SolidDAW can be integrated as an interactive widget in Marimo, Observable, Jupyter notebooks, and other environments. This guide covers all integration methods and JMON functionality.

## Features

✅ **AnyWidget Integration** - Works in Marimo and Jupyter  
✅ **Observable Framework** - Native integration for Observable notebooks  
✅ **Dynamic JMON Import** - Load JMON objects from Python dicts or JavaScript objects  
✅ **JMON Project Save/Load** - Full project persistence in JMON format  
✅ **Multi-language Support** - English, French, Spanish translations  
✅ **Real-time Updates** - Bidirectional data synchronization  

## Quick Start

### Marimo Integration

```python
import marimo as mo
from solid_daw_widget import create_daw_widget, create_sample_jmon

# Create sample JMON data
jmon_data = {
    "name": "My Project",
    "tempo": 120,
    "tracks": [
        {
            "name": "Piano",
            "synth": {"type": "Synth"},
            "notes": [
                {"note": "C4", "time": 0, "duration": 0.5, "velocity": 1},
                {"note": "E4", "time": 0.5, "duration": 0.5, "velocity": 1}
            ]
        }
    ]
}

# Create widget
widget = create_daw_widget(
    jmon_data=jmon_data,
    language="en",
    height=600
)

# Display in Marimo
widget
```

### Observable Integration

```javascript
// Import the widget
import {SolidDAW} from "https://cdn.jsdelivr.net/npm/solid-daw-widget@latest"

// Create JMON data
jmonData = {
  name: "Observable Project",
  tempo: 128,
  tracks: [
    {
      name: "Synth",
      synth: {type: "Synth"},
      notes: [
        {note: "C4", time: 0, duration: 0.5, velocity: 1}
      ]
    }
  ]
}

// Create widget
dawWidget = {
  const container = html`<div style="height: 600px;"></div>`;
  const widget = SolidDAW.create();
  widget.render(container, {jmonData, height: 600});
  return container;
}
```

## JMON Format Support

### Python Integration

```python
from solid_daw_widget import SolidDAWWidget, load_jmon_file

# Load from file
project = load_jmon_file("my_project.jmon")

# Create widget with project
widget = SolidDAWWidget(jmon_data=project)

# Get current project data
current_data = widget.jmon_data

# Save project
widget.save_jmon("updated_project.jmon")

# Import new JMON data dynamically
new_data = {
    "tempo": 140,
    "tracks": [...]
}
widget.load_jmon(new_data)
```

### JavaScript Integration

```javascript
// Create widget instance
const widget = SolidDAW.create();

// Import JMON object
await widget.importJmon({
  name: "Dynamic Project",
  tempo: 120,
  tracks: [
    {
      name: "Lead",
      notes: [{note: "C4", time: 0, duration: 1}]
    }
  ]
});

// Export current project
const currentJmon = widget.exportJmon();

// Save as file
const blob = new Blob([JSON.stringify(currentJmon, null, 2)], 
  {type: 'application/json'});
const url = URL.createObjectURL(blob);
// ... trigger download
```

## JMON Specification

SolidDAW supports the complete JMON (JSON Music Object Notation) format:

```json
{
  "format": "jmonTone",
  "version": "1.0",
  "name": "Project Name",
  "tempo": 120,
  "timeSignature": [4, 4],
  "tracks": [
    {
      "name": "Track Name",
      "synth": {
        "type": "Synth",
        "parameters": {...}
      },
      "notes": [
        {
          "note": "C4",
          "time": 0,
          "duration": 0.5,
          "velocity": 1
        }
      ],
      "volume": 0.8,
      "pan": 0,
      "muted": false
    }
  ]
}
```

### Supported Synth Types

- `Synth` - Basic synthesizer
- `FMSynth` - FM synthesis
- `AMSynth` - AM synthesis
- `MembraneSynth` - Drum/percussion sounds
- `Sampler` - Sample-based instruments

### Note Format

```json
{
  "note": "C4",           // Note name or MIDI number
  "time": 0,              // Start time in beats
  "duration": 0.5,        // Duration in beats
  "velocity": 1           // Volume (0-1)
}
```

## Multi-language Support

### Available Languages

- `en` - English (default)
- `fr` - Français 
- `es` - Español

### Usage

```python
# Python
widget = SolidDAWWidget(language="fr")
widget.set_language("es")
```

```javascript
// JavaScript
widget.setLanguage("fr");
```

### Custom Translations

Add translations to the `src/translations/` folder:

```json
// src/translations/de.json
{
  "app": {
    "title": "SolidDAW",
    "subtitle": "Moderne Digital Audio Workstation"
  },
  "transport": {
    "play": "Abspielen",
    "stop": "Stoppen"
  }
}
```

## Installation

### For Marimo/Jupyter

```bash
# Install the Python widget
pip install solid-daw-widget

# Or install from source
cd solid-daw
pip install -e python/
```

### For Observable

```javascript
// Use CDN (recommended)
import {SolidDAW} from "https://cdn.jsdelivr.net/npm/solid-daw-widget@latest"

// Or npm install
npm install solid-daw-widget
```

### Building from Source

```bash
# Clone repository
git clone https://github.com/your-repo/solid-daw
cd solid-daw

# Install dependencies
npm install

# Build widget
npm run build:widget

# Widget files will be in dist/
```

## API Reference

### Python API

```python
class SolidDAWWidget:
    def __init__(self, jmon_data=None, language="en", height=600, 
                 width="100%", readonly=False)
    
    def load_jmon(self, data: Union[Dict, str, Path]) -> None
    def save_jmon(self, path: Union[str, Path]) -> None
    def get_project_info(self) -> Dict[str, Any]
    def set_language(self, language: str) -> None
    
    # Properties
    jmon_data: Dict  # Current project data
    language: str    # Current language
```

### JavaScript API

```javascript
interface SolidDAWWidget {
  render(container: HTMLElement, props?: any): () => void;
  importJmon(jmonData: any): Promise<void>;
  exportJmon(): any;
  setLanguage(language: string): Promise<void>;
  destroy(): void;
}
```

## Examples

### Complete Marimo Example

See [`examples/marimo-example.py`](examples/marimo-example.py) for a full interactive notebook.

### Complete Observable Example  

See [`examples/observable-integration.js`](examples/observable-integration.js) for Observable Framework integration.

### Python Data Processing

```python
import json
from solid_daw_widget import create_sample_jmon, SolidDAWWidget

# Generate sample data
jmon = create_sample_jmon()

# Modify tempo programmatically
jmon['tempo'] = 140

# Add a new track
jmon['tracks'].append({
    "name": "Bass",
    "synth": {"type": "FMSynth"},
    "notes": [
        {"note": "C2", "time": 0, "duration": 2, "velocity": 0.8}
    ]
})

# Create widget with modified data
widget = SolidDAWWidget(jmon_data=jmon)

# Process audio in Python
def analyze_project(jmon_data):
    tracks = jmon_data.get('tracks', [])
    analysis = {
        'total_tracks': len(tracks),
        'total_notes': sum(len(t.get('notes', [])) for t in tracks),
        'avg_velocity': 0,
        'note_range': {'min': None, 'max': None}
    }
    
    all_velocities = []
    all_notes = []
    
    for track in tracks:
        for note in track.get('notes', []):
            all_velocities.append(note.get('velocity', 1))
            note_name = note.get('note', 'C4')
            if isinstance(note_name, str):
                all_notes.append(note_name)
    
    if all_velocities:
        analysis['avg_velocity'] = sum(all_velocities) / len(all_velocities)
    
    if all_notes:
        analysis['note_range']['min'] = min(all_notes)
        analysis['note_range']['max'] = max(all_notes)
    
    return analysis

# Analyze current project
stats = analyze_project(widget.jmon_data)
print(f"Project has {stats['total_notes']} notes across {stats['total_tracks']} tracks")
```

## Deployment

### Self-hosted Widget

```bash
# Build the widget
npm run build:widget

# Serve the files
python -m http.server 8000

# Use in Observable
import {SolidDAW} from "http://localhost:8000/dist/solid-daw.es.js"
```

### CDN Deployment

Upload the built widget files to a CDN and reference them:

```javascript
import {SolidDAW} from "https://your-cdn.com/solid-daw.es.js"
```

## Troubleshooting

### Common Issues

1. **Widget not displaying**: Check browser console for errors
2. **Audio not working**: Ensure user interaction before audio starts
3. **JMON import errors**: Validate JMON format
4. **Python widget errors**: Install `anywidget` dependency

### Debug Mode

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

widget = SolidDAWWidget(jmon_data=data)
```

```javascript
// Enable debug mode
window.SOLID_DAW_DEBUG = true;
```

## Contributing

1. Fork the repository
2. Make changes to widget code in `src/widget/`
3. Add translations in `src/translations/`
4. Update examples
5. Build and test: `npm run build:widget`
6. Submit pull request

## License

MIT License - see LICENSE file for details.