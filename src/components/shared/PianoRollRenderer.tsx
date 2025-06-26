import { Component, For, Show } from 'solid-js';
import type { Clip } from '../../types';
import type { 
  PianoRollRenderProps, 
  PianoRollNote,
  PianoRollDimensions,
  PianoRollConfig 
} from './pianoRollTypes';
import { 
  DEFAULT_PIANO_CONFIG, 
  generateGridLines, 
  getNoteFromPitch,
  isBlackKey 
} from './pianoRollUtils';

interface PianoRollRendererProps extends PianoRollRenderProps {
  class?: string;
  style?: string;
}

export const PianoRollRenderer: Component<PianoRollRendererProps> = (props) => {
  const config = () => ({ ...DEFAULT_PIANO_CONFIG, ...props.config });
  const noteStyle = () => props.style || {};
  
  const getMidiContent = () => {
    if (props.clip.content.type !== 'midi') return null;
    return props.clip.content;
  };

  const renderNote = (processedNote: PianoRollNote) => {
    const showNoteNames = noteStyle().showNoteNames !== false;
    const showResizeHandles = noteStyle().showResizeHandles !== false;
    const isCompact = noteStyle().compactMode === true;
    
    return (
      <div
        class={`piano-note ${processedNote.isSelected ? 'selected' : ''} ${processedNote.isDragging ? 'dragging' : ''}`}
        style={`
          left: ${processedNote.x}px;
          top: ${processedNote.y + 1}px;
          width: ${processedNote.width}px;
          height: ${processedNote.height}px;
          opacity: ${processedNote.note.velocity};
          background-color: ${processedNote.color};
          border-color: ${processedNote.borderColor};
        `}
        onMouseDown={(e) => props.handlers.onNoteMouseDown(e, processedNote.index, props.clip)}
        title={`${getNoteFromPitch(processedNote.midiNumber, config())} - ${processedNote.note.time.toFixed(2)}s - ${processedNote.note.duration.toFixed(2)}s - vel:${(processedNote.note.velocity * 127).toFixed(0)}`}
      >
        <Show when={showNoteNames && processedNote.isSelected && processedNote.width > 20}>
          <span class="note-text">{getNoteFromPitch(processedNote.midiNumber, config())}</span>
        </Show>
        <Show when={showResizeHandles && !isCompact && processedNote.width > 20}>
          <div class="note-resize-handle left"></div>
          <div class="note-resize-handle right"></div>
        </Show>
      </div>
    );
  };

  return (
    <div class={`piano-roll-renderer ${props.class || ''}`} style={props.style}>
      <Show when={getMidiContent()}>
        {(content) => (
          <For each={props.processedNotes()}>
            {renderNote}
          </For>
        )}
      </Show>
    </div>
  );
};

interface PianoRollGridProps {
  dimensions: PianoRollDimensions;
  config?: Partial<PianoRollConfig>;
  clipDuration?: number;
  showPianoKeys?: boolean;
  onGridClick?: (e: MouseEvent, time: number, pitch: number) => void;
  class?: string;
}

export const PianoRollGrid: Component<PianoRollGridProps> = (props) => {
  const config = () => ({ ...DEFAULT_PIANO_CONFIG, ...props.config });
  const gridData = () => generateGridLines(props.dimensions, props.clipDuration || 4, config());

  const handleGridClick = (e: MouseEvent) => {
    if (!props.onGridClick) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    const time = relativeX / props.dimensions.timeScale;
    const pitch = config().noteRange.max - (relativeY + props.dimensions.scrollY) / props.dimensions.pitchScale;
    
    props.onGridClick(e, time, Math.round(pitch));
  };

  return (
    <div 
      class={`piano-roll-grid ${props.class || ''}`}
      onClick={handleGridClick}
    >
      {/* Horizontal lines (pitch) */}
      <For each={gridData().horizontalLines}>
        {(line) => (
          <div 
            class={`piano-line ${line.isBlackKey ? 'black-key' : 'white-key'}`}
            style={`
              top: ${line.y}px;
              height: ${props.dimensions.pitchScale}px;
              width: 100%;
              position: absolute;
              border-bottom: 1px solid ${line.isBlackKey ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'};
            `}
          >
            <Show when={!line.isBlackKey && (line.midiNumber % 12 === 0) && props.showPianoKeys}>
              <span class="note-name">{line.noteName}</span>
            </Show>
          </div>
        )}
      </For>

      {/* Vertical lines (time) */}
      <For each={gridData().verticalLines}>
        {(line) => (
          <div 
            class={`grid-line vertical ${line.isBar ? 'bar' : 'beat'}`}
            style={`
              left: ${line.x}px;
              height: 100%;
              position: absolute;
              border-left: ${line.isBar ? '2px' : '1px'} solid ${line.isBar ? 'var(--text-secondary)' : 'rgba(255, 255, 255, 0.1)'};
            `}
          />
        )}
      </For>
    </div>
  );
};

interface PianoKeyboardProps {
  dimensions: PianoRollDimensions;
  config?: Partial<PianoRollConfig>;
  onKeyClick?: (midiNumber: number) => void;
  class?: string;
}

export const PianoKeyboard: Component<PianoKeyboardProps> = (props) => {
  const config = () => ({ ...DEFAULT_PIANO_CONFIG, ...props.config });

  return (
    <div class={`piano-keyboard ${props.class || ''}`}>
      <For each={Array.from({ length: config().noteRange.max - config().noteRange.min + 1 }, (_, i) => config().noteRange.max - i)}>
        {(midiNumber) => (
          <div 
            class={`piano-key ${isBlackKey(midiNumber) ? 'black' : 'white'}`}
            style={`
              height: ${props.dimensions.pitchScale}px;
              top: ${(config().noteRange.max - midiNumber) * props.dimensions.pitchScale - props.dimensions.scrollY}px;
            `}
            onClick={() => props.onKeyClick?.(midiNumber)}
          >
            <Show when={!isBlackKey(midiNumber) && (midiNumber % 12 === 0)}>
              <span class="note-label">{getNoteFromPitch(midiNumber, config())}</span>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};

// Default styles for the piano roll components
const pianoRollStyles = `
.piano-roll-renderer {
  position: relative;
  width: 100%;
  height: 100%;
}

.piano-roll-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
}

.piano-line {
  display: flex;
  align-items: center;
  padding-left: 8px;
  pointer-events: none;
}

.piano-line.black-key {
  background: rgba(0, 0, 0, 0.08);
}

.piano-line.white-key {
  background: transparent;
}

.note-name {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
  user-select: none;
  opacity: 0.7;
}

.grid-line {
  position: absolute;
  pointer-events: none;
}

.piano-note {
  position: absolute;
  background: #4dabf7;
  border: 1px solid #339af0;
  border-radius: 3px;
  cursor: grab;
  z-index: 10;
  transition: all 0.1s ease;
  min-height: 8px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  box-sizing: border-box;
}

.piano-note:hover {
  background: #74c0fc;
  border-color: #4dabf7;
  z-index: 15;
  transform: scale(1.02);
}

.piano-note.dragging {
  background: #ffd43b;
  border-color: #fcc419;
  z-index: 20;
  cursor: grabbing;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.piano-note.selected {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
  transform: scale(1.02);
}

.note-text {
  font-size: 0.7rem;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
}

.note-resize-handle {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  cursor: ew-resize;
  z-index: 15;
  border-radius: 2px;
  transition: background-color 0.1s ease;
}

.note-resize-handle.left {
  left: 0;
  border-radius: 3px 0 0 3px;
}

.note-resize-handle.right {
  right: 0;
  border-radius: 0 3px 3px 0;
}

.note-resize-handle:hover {
  background: rgba(255, 255, 255, 0.5);
}

.piano-note:hover .note-resize-handle {
  background: rgba(255, 255, 255, 0.3);
}

.piano-keyboard {
  position: relative;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  flex-shrink: 0;
}

.piano-key {
  position: absolute;
  left: 0;
  width: 100%;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.piano-key.white {
  background: #ffffff;
  color: #000000;
  z-index: 1;
}

.piano-key.black {
  background: #333333;
  color: #ffffff;
  width: 70%;
  z-index: 2;
}

.piano-key:hover {
  background: var(--accent-primary);
  color: white;
}

.note-label {
  font-size: 0.7rem;
  font-weight: 500;
  user-select: none;
}
`;

// Inject styles if not already present
if (!document.getElementById('piano-roll-renderer-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'piano-roll-renderer-styles';
  styleElement.textContent = pianoRollStyles;
  document.head.appendChild(styleElement);
}