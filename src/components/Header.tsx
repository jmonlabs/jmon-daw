import { Component, createSignal } from 'solid-js';
import { useProject, useTransport, useView } from '../stores/context';
import { FileBrowser } from './FileBrowser';
import { FileHandlers } from '../utils/fileHandlers';
import { ProjectExporter } from '../utils/projectExporter';
import { JmonImporter } from '../utils/jmonImporter';
import { createT } from '../utils/i18n';
import { Icon } from './Icon';
import { isJmonEditorExpanded, setIsJmonEditorExpanded } from './JmonEditor';

export const Header: Component = () => {
  const { project, addTrack, addClip, setProject } = useProject();
  const { transport, play, stop, pause, record, toggleLoop, setTempo, setCurrentTime } = useTransport();
  const { view, setZoom, zoomIn, zoomOut } = useView();
  const { t } = createT()();
  const [showMenu, setShowMenu] = createSignal(false);

  const handleFileImport = async (files: File[]) => {
    for (const file of files) {
      if (FileHandlers.validateFileType(file)) {
        try {
          const result = await FileHandlers.handleFile(file);
          if (result) {
            // Create a new track for each file
            const trackName = `${result.name} Track`;
            addTrack({
              name: trackName,
              type: result.type === 'audio' ? 'audio' : 'instrument',
              volume: 0.8,
              pan: 0,
              muted: false,
              solo: false,
              armed: false,
              color: result.type === 'audio' ? '#10b981' : '#3b82f6',
              clips: [],
              effects: []
            });
            
            // Find the newly created track and add the clip
            const newTrack = project.tracks[project.tracks.length - 1];
            if (newTrack) {
              const clipData = {
                name: result.name,
                start: 0,
                end: result.duration || 2,
                duration: result.duration || 2,
                type: result.type === 'jmon' ? 'midi' : result.type as 'audio' | 'midi',
                content: result.content,
                color: result.type === 'audio' ? '#10b981' : '#3b82f6'
              };
              
              addClip(newTrack.id, clipData);
            }
          }
        } catch (error) {
          console.error(`Failed to import ${file.name}:`, error);
        }
      }
    }
  };

  const handleSaveProject = () => {
    ProjectExporter.downloadAsJmon(project);
  };

  const handleLoadProject = async (files: File[]) => {
    for (const file of files) {
      if (file.name.endsWith('.jmon') || file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const jmonData = JSON.parse(text);
          const importedProject = await JmonImporter.importJmonObject(jmonData);
          setProject(importedProject);
          // Synchronize transport tempo with project tempo
          setTempo(importedProject.tempo);
          console.log('Loaded JMON project with tempo:', importedProject.tempo);
          setShowMenu(false);
          break; // Only load first valid file
        } catch (error) {
          console.error('Failed to load project:', error);
        }
      }
    }
  };

  const handleNewProject = () => {
    const confirmNew = confirm('Create new project? Unsaved changes will be lost.');
    if (confirmNew) {
      const newProject = {
        id: crypto.randomUUID(),
        name: 'New Project',
        tempo: 120,
        timeSignature: [4, 4],
        tracks: [],
        masterVolume: 0.8,
        masterPan: 0,
        masterEffects: []
      };
      setProject(newProject);
      // Synchronize transport tempo with project tempo
      setTempo(newProject.tempo);
    }
    setShowMenu(false);
  };

  const exportAsWav = () => {
    // TODO: Implement audio export
    alert('Audio export feature coming soon!');
    setShowMenu(false);
  };

  const openAudioSettings = () => {
    // TODO: Open audio settings modal
    alert('Audio settings panel coming soon!');
    setShowMenu(false);
  };

  const openKeyboardShortcuts = () => {
    alert('Keyboard Shortcuts:\n\nSPACE - Play/Pause\nR - Record\nL - Toggle Loop\nCtrl+S - Save Project\nCtrl+O - Open Project\nCtrl+N - New Project');
    setShowMenu(false);
  };

  const openHelp = () => {
    window.open('https://github.com/jmon-project/jmon', '_blank');
    setShowMenu(false);
  };

  const openAbout = () => {
    alert('jmonDAW v1.0\n\nA modern Digital Audio Workstation built with SolidJS and Tone.js.\nSupports JMON (JSON Music Object Notation) format.\n\nBuilt with ❤️ for the jmon project.');
    setShowMenu(false);
  };

  return (
    <header class="header">
      <div class="header-left">
        <div class="transport-controls">
          <button 
            class={`transport-btn ${isJmonEditorExpanded() ? 'active' : ''}`}
            onClick={() => setIsJmonEditorExpanded(!isJmonEditorExpanded())}
            title="Toggle JMON Source Editor"
          >
            <Icon name="file-text" size={16} color={isJmonEditorExpanded() ? 'white' : 'var(--text-primary)'} />
          </button>
          <button 
            class="transport-btn" 
            onClick={() => {
              console.log('Home button clicked, resetting to 0');
              if (window.Tone) {
                window.Tone.Transport.stop();
                window.Tone.Transport.cancel();
                window.Tone.Transport.seconds = 0;
              }
              setCurrentTime(0);
            }}
            title="Go to Beginning"
          >
            <Icon name="home" size={16} color="var(--text-primary)" />
          </button>
          <button 
            class={`transport-btn ${transport.isRecording ? 'recording' : ''}`}
            onClick={record}
            title="Record"
          >
            <Icon name="circle" size={16} color={transport.isRecording ? 'white' : 'var(--text-primary)'} />
          </button>
          <button 
            class="transport-btn" 
            onClick={stop}
            title="Stop"
          >
            <Icon name="square" size={16} color="var(--text-primary)" />
          </button>
          <button 
            class={`transport-btn ${transport.isPlaying ? 'playing' : ''}`}
            onClick={() => {
              if (transport.isPlaying) {
                pause();
              } else {
                play();
              }
            }}
            title={transport.isPlaying ? 'Pause' : 'Play'}
          >
            <Icon name={transport.isPlaying ? 'pause' : 'play'} size={16} color={transport.isPlaying ? 'white' : 'var(--text-primary)'} />
          </button>
          <button 
            class={`transport-btn ${transport.isLooping ? 'active' : ''}`}
            onClick={toggleLoop}
            title="Loop"
          >
            <Icon name="repeat" size={16} color={transport.isLooping ? 'white' : 'var(--text-primary)'} />
          </button>
        </div>
      </div>
      <div class="header-center">
        <div class="position-display">
          <span class="time-display">
            {Math.floor(transport.currentTime / 60)}:
            {Math.floor(transport.currentTime % 60).toString().padStart(2, '0')}:
            {Math.floor((transport.currentTime % 1) * 100).toString().padStart(2, '0')}
          </span>
          <span class="bar-display">
            {Math.floor(transport.currentTime / 4) + 1}.
            {Math.floor(transport.currentTime % 4) + 1}.
            {Math.floor((transport.currentTime % 1) * 4) + 1}
          </span>
        </div>
      </div>
      <div class="header-right">
        <div class="tempo-control">
          <input 
            type="number" 
            value={transport.tempo} 
            min="60" 
            max="200" 
            class="tempo-input"
            onInput={(e) => setTempo(parseInt(e.currentTarget.value))}
          />
          <span class="bpm-label">BPM</span>
        </div>
        <div class="zoom-controls">
          <button class="zoom-btn" onClick={zoomOut} title="Zoom Out">
            <Icon name="zoom-out" size={14} color="var(--text-primary)" />
          </button>
          <span class="zoom-level">{Math.round(view.zoom * 100)}%</span>
          <button class="zoom-btn" onClick={zoomIn} title="Zoom In">
            <Icon name="zoom-in" size={14} color="var(--text-primary)" />
          </button>
        </div>
        <div class="menu-container">
          <button class="menu-btn" onClick={() => setShowMenu(!showMenu())}>
            <Icon name="menu" color="var(--text-primary)" />
          </button>
        {showMenu() && (
          <div class="dropdown-menu">
            <div class="menu-section">
              <div class="menu-title">Project</div>
              <button class="menu-item" onClick={handleNewProject}>
                <Icon name="file" size={14} color="var(--text-primary)" />
                New Project
              </button>
              <FileBrowser 
                onFileSelected={handleFileImport}
                icon="file-plus"
                variant="menu"
                label="Import Media"
                class="menu-item-browser"
              />
              <FileBrowser 
                onFileSelected={handleLoadProject}
                accept=".jmon,.json"
                multiple={false}
                icon="folder-open"
                variant="menu"
                label="Open Project"
                class="menu-item-browser"
              />
              <button class="menu-item" onClick={handleSaveProject}>
                <Icon name="save" size={14} color="var(--text-primary)" />
                Save Project
              </button>
              <button class="menu-item" onClick={() => exportAsWav()}>
                <Icon name="download" size={14} color="var(--text-primary)" />
                Export Audio
              </button>
            </div>
            <div class="menu-section">
              <div class="menu-title">Settings</div>
              <button class="menu-item" onClick={() => openAudioSettings()}>
                <Icon name="settings" size={14} color="var(--text-primary)" />
                Audio Settings
              </button>
              <button class="menu-item" onClick={() => openKeyboardShortcuts()}>
                <Icon name="keyboard" size={14} color="var(--text-primary)" />
                Shortcuts
              </button>
            </div>
            <div class="menu-section">
              <div class="menu-title">Help</div>
              <button class="menu-item" onClick={() => openHelp()}>
                <Icon name="help-circle" size={14} color="var(--text-primary)" />
                Help & Docs
              </button>
              <button class="menu-item" onClick={() => openAbout()}>
                <Icon name="info" size={14} color="var(--text-primary)" />
                About jmonDAW
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

// Ableton Live-inspired CSS
const style = document.createElement('style');
style.textContent = `
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
  font-size: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-primary);
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.project-name {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}

.header-center {
  display: flex;
  gap: 16px;
  align-items: center;
}

.transport-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.transport-btn {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transport-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}

.transport-btn.playing {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: white;
}

.transport-btn.recording {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.transport-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.position-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-weight: 600;
}

.time-display {
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.bar-display {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}

.tempo-control {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 4px 6px;
  height: 36px;
}

.tempo-input {
  width: 50px;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 2px 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  outline: none;
  font-weight: 600;
  -moz-appearance: textfield; /* Remove arrows in Firefox */
}

/* Remove arrows in WebKit browsers */
.tempo-input::-webkit-outer-spin-button,
.tempo-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.tempo-input:focus {
  background: var(--bg-tertiary);
  border-radius: 1px;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.bpm-label {
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  padding: 2px 4px;
  border-radius: 2px;
}

.tempo-display, .time-signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 40px;
}

.label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 2px;
  height: 36px;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease;
}

.zoom-btn:hover {
  background: var(--bg-quaternary);
}

.zoom-level {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  min-width: 35px;
  text-align: center;
}

.menu-container {
  position: relative;
}

.menu-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 8px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  height: 36px;
  min-width: 36px;
}

.menu-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}


.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  min-width: 200px;
  z-index: 1000;
  margin-top: 4px;
}

.menu-section {
  border-bottom: 1px solid var(--border-color);
}

.menu-section:last-child {
  border-bottom: none;
}

.menu-title {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-tertiary);
}

.menu-item {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item-browser {
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
}

.menu-item-browser button {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;
}

.menu-item-browser button:hover {
  background: var(--bg-tertiary);
}

`;
document.head.appendChild(style);