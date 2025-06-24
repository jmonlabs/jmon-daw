"""
Marimo notebook example for SolidDAW integration

Run this with: marimo edit marimo-example.py
"""

import marimo as mo
import json
from pathlib import Path

# Import the SolidDAW widget (assuming it's installed)
try:
    from solid_daw_widget import SolidDAWWidget, create_sample_jmon, create_daw_widget
    HAS_WIDGET = True
except ImportError:
    HAS_WIDGET = False
    mo.md("⚠️ SolidDAW widget not installed. Install with `pip install solid-daw-widget`")

def create_sample_project():
    """Create a sample JMON project for demonstration"""
    return {
        "format": "jmonTone",
        "version": "1.0", 
        "name": "Marimo Demo Project",
        "tempo": 120,
        "timeSignature": [4, 4],
        "tracks": [
            {
                "name": "Lead Synth",
                "synth": {"type": "Synth"},
                "notes": [
                    {"note": "C4", "time": 0, "duration": 0.5, "velocity": 1},
                    {"note": "E4", "time": 0.5, "duration": 0.5, "velocity": 0.8},
                    {"note": "G4", "time": 1, "duration": 0.5, "velocity": 0.9},
                    {"note": "C5", "time": 1.5, "duration": 1, "velocity": 1},
                    {"note": "B4", "time": 2.5, "duration": 0.25, "velocity": 0.7},
                    {"note": "A4", "time": 2.75, "duration": 0.25, "velocity": 0.7},
                    {"note": "G4", "time": 3, "duration": 1, "velocity": 0.8}
                ]
            },
            {
                "name": "Bass",
                "synth": {"type": "FMSynth"},
                "notes": [
                    {"note": "C2", "time": 0, "duration": 2, "velocity": 0.8},
                    {"note": "F2", "time": 2, "duration": 2, "velocity": 0.8}
                ]
            },
            {
                "name": "Pad",
                "synth": {"type": "AMSynth"},
                "notes": [
                    {"note": "C3", "time": 0, "duration": 4, "velocity": 0.4},
                    {"note": "E3", "time": 0, "duration": 4, "velocity": 0.4},
                    {"note": "G3", "time": 0, "duration": 4, "velocity": 0.4}
                ]
            }
        ]
    }

# Cell 1: Introduction
mo.md("""
# SolidDAW in Marimo

This notebook demonstrates how to use SolidDAW as an interactive widget in Marimo for music creation and JMON editing.

## Features
- Interactive DAW interface
- JMON import/export
- Real-time audio synthesis
- Multi-language support
""")

# Cell 2: Project selection
project_choice = mo.ui.dropdown(
    options={
        "sample": "Sample Project", 
        "empty": "Empty Project",
        "upload": "Upload JMON File"
    },
    value="sample",
    label="Choose project type:"
)
project_choice

# Cell 3: File upload (conditional)
file_upload = mo.ui.file(
    kind="text",
    multiple=False,
    filetypes=[".jmon", ".json"],
    label="Upload JMON file"
) if project_choice.value == "upload" else None

file_upload if file_upload else mo.md("*Select 'Upload JMON File' to see upload option*")

# Cell 4: Create project data
def get_project_data():
    if project_choice.value == "sample":
        return create_sample_project()
    elif project_choice.value == "upload" and file_upload and file_upload.content:
        try:
            content = file_upload.content[0].decode('utf-8')
            return json.loads(content)
        except Exception as e:
            mo.md(f"❌ Error loading file: {e}")
            return create_sample_project()
    else:
        return {
            "format": "jmonTone",
            "version": "1.0",
            "name": "New Project",
            "tempo": 120,
            "timeSignature": [4, 4],
            "tracks": []
        }

project_data = get_project_data()

# Cell 5: Project information
def show_project_info(data):
    tracks = data.get("tracks", [])
    total_notes = sum(len(track.get("notes", [])) for track in tracks)
    
    return mo.md(f"""
    ### Project Info
    - **Name:** {data.get('name', 'Untitled')}
    - **Tempo:** {data.get('tempo', 120)} BPM
    - **Time Signature:** {'/'.join(map(str, data.get('timeSignature', [4, 4])))}
    - **Tracks:** {len(tracks)}
    - **Total Notes:** {total_notes}
    """)

show_project_info(project_data)

# Cell 6: Language selection
language = mo.ui.dropdown(
    options={"en": "English", "fr": "Français", "es": "Español"},
    value="en",
    label="Interface Language:"
)
language

# Cell 7: Main DAW Widget
if HAS_WIDGET:
    daw_widget = create_daw_widget(
        jmon_data=project_data,
        language=language.value,
        height=600,
        width="100%"
    )
    daw_widget
else:
    mo.md("⚠️ Install `solid-daw-widget` to see the interactive DAW")

# Cell 8: Project export
export_button = mo.ui.button(
    label="📁 Export Current Project",
    kind="success"
)
export_button

# Cell 9: Export handling
if export_button.value and HAS_WIDGET:
    current_data = daw_widget.jmon_data
    filename = f"{current_data.get('name', 'project').replace(' ', '_')}.jmon"
    
    # Create download
    json_str = json.dumps(current_data, indent=2)
    mo.download(
        data=json_str.encode(),
        filename=filename,
        media_type="application/json"
    )
    
    mo.md(f"✅ Project exported as `{filename}`")

# Cell 10: JMON Data Viewer
show_json = mo.ui.checkbox(label="Show JMON Data")
show_json

# Cell 11: JSON display (conditional)
if show_json.value:
    current_jmon = daw_widget.jmon_data if HAS_WIDGET else project_data
    mo.tree(current_jmon)

# Cell 12: Advanced features
mo.md("""
## Advanced Features

### Python Integration
```python
# Access current project data
project = daw_widget.jmon_data

# Modify project programmatically
project['tempo'] = 140
daw_widget.load_jmon(project)

# Save to file
daw_widget.save_jmon('my_project.jmon')

# Get project statistics
info = daw_widget.get_project_info()
print(f"Project has {info['track_count']} tracks")
```

### JMON Processing
```python
# Load external JMON
from solid_daw_widget import load_jmon_file
external_project = load_jmon_file('path/to/project.jmon')

# Create sample data
sample_jmon = create_sample_jmon()

# Validate JMON
from solid_daw_widget import JmonImporter
validation = JmonImporter.validateJmon(my_data)
if validation['valid']:
    print("Valid JMON!")
else:
    print("Errors:", validation['errors'])
```
""")

# Cell 13: Code generation
generate_code = mo.ui.button(label="Generate Python Code", kind="neutral")
generate_code

# Cell 14: Generated code display
if generate_code.value and HAS_WIDGET:
    current_jmon = daw_widget.jmon_data
    code = f'''# Generated Python code for current project
import json
from solid_daw_widget import create_daw_widget

# Project data
project_data = {json.dumps(current_jmon, indent=2)}

# Create widget
widget = create_daw_widget(
    jmon_data=project_data,
    language="{language.value}",
    height=600
)

# Display in notebook
widget
'''
    mo.code(code, language="python")

# Cell 15: Tips and tricks
mo.md("""
## Tips & Tricks

1. **File Formats**: SolidDAW supports WAV, MP3, MIDI, and JMON files
2. **Drag & Drop**: Drag audio files directly onto tracks
3. **Keyboard Shortcuts**: Use spacebar to play/pause
4. **JMON Compatibility**: Works with files from the jmon project
5. **Real-time Updates**: Changes in the widget update the Python data automatically

## Next Steps
- Explore the [SolidDAW documentation](https://github.com/your-repo/solid-daw)
- Try the [Observable integration](https://observablehq.com/@your-user/solid-daw)
- Check out the [JMON specification](https://github.com/jmon-project/jmon)
""")

# Cell 16: Footer
mo.md("---\n*Created with [Marimo](https://marimo.io) and [SolidDAW](https://github.com/your-repo/solid-daw)*")