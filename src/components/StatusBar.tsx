import { Component, createSignal, Show } from 'solid-js';
import { useProject, useTransport, useView } from '../stores/context';
import { Icon } from './Icon';

export const StatusBar: Component = () => {
  const { project } = useProject();
  const { transport } = useTransport();
  const { view, toggleSnapToGrid, setGridSize } = useView();
  const [showSnapMenu, setShowSnapMenu] = createSignal(false);
  const [snapMenuPosition, setSnapMenuPosition] = createSignal({ top: '100%', left: '0', transform: '' });
  
  let snapButtonRef: HTMLButtonElement;
  
  // Calculate optimal menu position to avoid going off screen
  const calculateMenuPosition = () => {
    if (!snapButtonRef) return;
    
    const rect = snapButtonRef.getBoundingClientRect();
    const menuHeight = 200; // Estimated menu height
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Default position below button
    let top = '100%';
    let left = '0';
    let transform = '';
    
    // Check if menu would go below viewport
    if (rect.bottom + menuHeight > viewportHeight) {
      // Position above button instead
      top = 'auto';
      const bottomOffset = '100%';
      transform = 'translateY(-100%)';
      setSnapMenuPosition({ top: 'auto', left, transform: `translateY(-100%)` });
    } else {
      setSnapMenuPosition({ top, left, transform });
    }
  };
  
  const snapResolutions = [
    { label: '1/1', value: 1 },
    { label: '1/2', value: 0.5 },
    { label: '1/4', value: 0.25 },
    { label: '1/8', value: 0.125 },
    { label: '1/16', value: 0.0625 },
    { label: '1/32', value: 0.03125 }
  ];
  
  const currentSnapLabel = () => {
    const snap = snapResolutions.find(s => s.value === view.gridSize);
    return snap ? snap.label : '1/4';
  };

  return (
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">
          Tracks: {project.tracks.length}
        </span>
        <span class="status-item">
          {transport.isPlaying ? 'Playing' : transport.isRecording ? 'Recording' : 'Stopped'}
        </span>
        <div class="snap-control">
          <button 
            class={`snap-toggle ${view.snapToGrid ? 'active' : ''}`}
            onClick={toggleSnapToGrid}
            title="Toggle Snap"
          >
            <Icon name="magnet" size={12} color={view.snapToGrid ? 'white' : 'var(--text-secondary)'} />
            <span>Snap</span>
          </button>
          <div style="position: relative; display: inline-block;">
            <button 
              ref={snapButtonRef}
              class="snap-resolution"
              onClick={() => {
                if (!showSnapMenu()) {
                  calculateMenuPosition();
                }
                setShowSnapMenu(!showSnapMenu());
              }}
              title="Snap Resolution"
            >
              {currentSnapLabel()}
              <Icon name="chevron-down" size={10} color="var(--text-secondary)" />
            </button>
            <Show when={showSnapMenu()}>
              <div 
                class="snap-menu"
                style={`top: ${snapMenuPosition().top}; left: ${snapMenuPosition().left}; transform: ${snapMenuPosition().transform};`}
              >
              {snapResolutions.map(resolution => (
                <div 
                  class={`snap-menu-item ${view.gridSize === resolution.value ? 'active' : ''}`}
                  onClick={() => {
                    setGridSize(resolution.value);
                    setShowSnapMenu(false);
                  }}
                >
                  {resolution.label}
                </div>
              ))}
            </div>
          </Show>
          </div>
        </div>
      </div>
      
      <div class="status-center">
        <span class="status-item">
          {project.name}
        </span>
      </div>
      
      <div class="status-right">
        <span class="status-item">
          CPU: 12%
        </span>
        <span class="status-item">
          RAM: 2.1GB
        </span>
      </div>
    </div>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.status-bar {
  height: 30px;
  background: #2d2d2d;
  border-top: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 0.8rem;
  color: #ccc;
}

.status-left, .status-center, .status-right {
  display: flex;
  gap: 20px;
}

.status-item {
  white-space: nowrap;
}

.status-center {
  flex: 1;
  justify-content: center;
}

.snap-control {
  display: flex;
  gap: 2px;
  position: relative;
}

.snap-toggle, .snap-resolution {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.snap-toggle:hover, .snap-resolution:hover {
  background: var(--bg-tertiary);
}

.snap-toggle.active {
  background: var(--accent-primary);
  color: white;
}

.snap-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  z-index: 1000;
  min-width: 60px;
}

.snap-menu-item {
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.snap-menu-item:hover {
  background: var(--bg-tertiary);
}

.snap-menu-item.active {
  background: var(--accent-primary);
  color: white;
}
`;
document.head.appendChild(style);