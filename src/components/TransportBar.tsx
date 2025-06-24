import { Component } from 'solid-js';
import { useTransport } from '../stores/context';
import { Icon } from './Icon';
import { isJmonEditorExpanded, setIsJmonEditorExpanded } from './JmonEditor';

export const TransportBar: Component = () => {
  const { transport, play, stop, pause, record, toggleLoop, setTempo, setCurrentTime } = useTransport();

  return (
    <div class="transport-bar">
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
            // Force stop and reset everything
            if (window.Tone) {
              window.Tone.Transport.stop();
              window.Tone.Transport.cancel();
              window.Tone.Transport.seconds = 0;
              console.log('Transport forced to 0, state:', window.Tone.Transport.state, 'time:', window.Tone.Transport.seconds);
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
            console.log('Play/Pause button clicked, isPlaying:', transport.isPlaying);
            if (transport.isPlaying) {
              console.log('Calling pause function');
              pause();
            } else {
              console.log('Calling play function');
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

      <div class="transport-info">
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
      </div>
    </div>
  );
};

// Ableton Live-inspired CSS
const style = document.createElement('style');
style.textContent = `
.transport-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
}

.transport-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.transport-btn {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
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

.transport-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.tempo-control {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 4px 6px;
}

.tempo-input {
  width: 50px;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 2px 4px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  outline: none;
}

.tempo-input:focus {
  background: var(--bg-tertiary);
  border-radius: 1px;
}

.tempo-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.bpm-label {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
`;
document.head.appendChild(style);