"""
SolidDAW Widget for Marimo and Jupyter environments
"""
import json
from typing import Any, Dict, Optional, Union
from pathlib import Path

try:
    import anywidget
    import traitlets
    HAS_ANYWIDGET = True
except ImportError:
    HAS_ANYWIDGET = False
    # Fallback for environments without anywidget
    class anywidget:
        class AnyWidget:
            pass
    class traitlets:
        @staticmethod
        def Unicode(*args, **kwargs):
            return ""
        @staticmethod
        def Dict(*args, **kwargs):
            return {}
        @staticmethod
        def Int(*args, **kwargs):
            return 0
        @staticmethod
        def Bool(*args, **kwargs):
            return False

# Get the widget files path
WIDGET_DIR = Path(__file__).parent.parent / "dist"

class SolidDAWWidget(anywidget.AnyWidget):
    """
    SolidDAW widget for interactive music creation and JMON editing
    
    Usage:
        # Basic usage
        widget = SolidDAWWidget()
        
        # With JMON data
        jmon_data = {
            "tempo": 120,
            "tracks": [
                {
                    "name": "Piano",
                    "notes": [
                        {"note": "C4", "time": 0, "duration": 0.5},
                        {"note": "E4", "time": 0.5, "duration": 0.5}
                    ]
                }
            ]
        }
        widget = SolidDAWWidget(jmon_data=jmon_data)
        
        # Get project data
        current_jmon = widget.jmon_data
        
        # Save project
        widget.save_jmon("my_project.jmon")
    """
    
    # Widget traits
    jmon_data = traitlets.Dict({}).tag(sync=True)
    language = traitlets.Unicode("en").tag(sync=True)
    height = traitlets.Int(600).tag(sync=True)
    width = traitlets.Unicode("100%").tag(sync=True)
    readonly = traitlets.Bool(False).tag(sync=True)
    
    def __init__(self, 
                 jmon_data: Optional[Dict[str, Any]] = None,
                 language: str = "en",
                 height: int = 600,
                 width: Union[str, int] = "100%",
                 readonly: bool = False,
                 **kwargs):
        """
        Initialize SolidDAW widget
        
        Args:
            jmon_data: Initial JMON data to load
            language: Interface language ('en', 'fr', 'es')
            height: Widget height in pixels
            width: Widget width (pixels or percentage string)
            readonly: Whether the widget is read-only
        """
        super().__init__(**kwargs)
        
        if jmon_data:
            self.jmon_data = jmon_data
        self.language = language
        self.height = height
        self.width = str(width)
        self.readonly = readonly
    
    def load_jmon(self, data: Union[Dict, str, Path]) -> None:
        """
        Load JMON data into the widget
        
        Args:
            data: JMON data as dict, JSON string, or file path
        """
        if isinstance(data, (str, Path)):
            path = Path(data)
            if path.exists():
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                # Assume it's a JSON string
                data = json.loads(str(data))
        
        self.jmon_data = data
    
    def save_jmon(self, path: Union[str, Path]) -> None:
        """
        Save current JMON data to file
        
        Args:
            path: File path to save to
        """
        path = Path(path)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.jmon_data, f, indent=2, ensure_ascii=False)
    
    def get_project_info(self) -> Dict[str, Any]:
        """Get basic project information"""
        if not self.jmon_data:
            return {}
        
        return {
            "name": self.jmon_data.get("name", "Untitled"),
            "tempo": self.jmon_data.get("tempo", 120),
            "track_count": len(self.jmon_data.get("tracks", [])),
            "duration": self._calculate_duration()
        }
    
    def _calculate_duration(self) -> float:
        """Calculate total project duration"""
        max_time = 0.0
        tracks = self.jmon_data.get("tracks", [])
        
        for track in tracks:
            notes = track.get("notes", [])
            for note in notes:
                note_end = note.get("time", 0) + note.get("duration", 0)
                max_time = max(max_time, note_end)
        
        return max_time
    
    def set_language(self, language: str) -> None:
        """
        Set widget language
        
        Args:
            language: Language code ('en', 'fr', 'es')
        """
        if language in ['en', 'fr', 'es']:
            self.language = language
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    @property
    def _esm(self) -> Union[str, Path]:
        """Path to the ESM widget bundle"""
        if HAS_ANYWIDGET:
            esm_path = WIDGET_DIR / "solid-daw.es.js"
            if esm_path.exists():
                return esm_path
        
        # Fallback to CDN or embedded version
        return """
        export function render(view) {
            const div = document.createElement('div');
            div.innerHTML = '<p>SolidDAW widget not available - build the widget first</p>';
            div.style.cssText = 'padding: 20px; border: 1px solid #ccc; background: #f9f9f9;';
            return div;
        }
        """
    
    @property
    def _css(self) -> str:
        """Widget CSS styles"""
        css_path = WIDGET_DIR / "style.css"
        if css_path.exists():
            return css_path.read_text()
        
        return """
        .solid-daw-widget {
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
            background: #1a1a1a;
            color: white;
            font-family: 'Segoe UI', sans-serif;
        }
        """

# Convenience functions for Marimo/Jupyter
def create_daw_widget(jmon_data: Optional[Dict] = None, **kwargs) -> SolidDAWWidget:
    """
    Create a new SolidDAW widget
    
    Args:
        jmon_data: Initial JMON data
        **kwargs: Additional widget options
    
    Returns:
        SolidDAWWidget instance
    """
    return SolidDAWWidget(jmon_data=jmon_data, **kwargs)

def load_jmon_file(path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load JMON data from file
    
    Args:
        path: Path to JMON file
    
    Returns:
        JMON data as dictionary
    """
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_sample_jmon() -> Dict[str, Any]:
    """
    Create a sample JMON object for testing
    
    Returns:
        Sample JMON data
    """
    return {
        "format": "jmonTone",
        "version": "1.0",
        "name": "Sample Project",
        "tempo": 120,
        "timeSignature": [4, 4],
        "tracks": [
            {
                "name": "Piano",
                "synth": {"type": "Synth"},
                "notes": [
                    {"note": "C4", "time": 0, "duration": 0.5, "velocity": 1},
                    {"note": "E4", "time": 0.5, "duration": 0.5, "velocity": 1},
                    {"note": "G4", "time": 1, "duration": 0.5, "velocity": 1},
                    {"note": "C5", "time": 1.5, "duration": 0.5, "velocity": 1}
                ]
            },
            {
                "name": "Bass",
                "synth": {"type": "FMSynth"},
                "notes": [
                    {"note": "C2", "time": 0, "duration": 1, "velocity": 0.8},
                    {"note": "G2", "time": 1, "duration": 1, "velocity": 0.8}
                ]
            }
        ]
    }

# For Marimo integration
def mo_solid_daw(jmon_data: Optional[Dict] = None, **kwargs):
    """
    Marimo-specific widget creation function
    
    Usage in Marimo:
        import solid_daw_widget as sdw
        widget = sdw.mo_solid_daw(jmon_data=my_jmon_data)
    """
    return create_daw_widget(jmon_data=jmon_data, **kwargs)

# Export main classes and functions
__all__ = [
    'SolidDAWWidget',
    'create_daw_widget', 
    'load_jmon_file',
    'create_sample_jmon',
    'mo_solid_daw'
]