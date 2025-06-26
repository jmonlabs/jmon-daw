import { Component, For, Show, createSignal, createEffect } from 'solid-js';
import { useProject, useView, useTransport } from '../stores/context';
import type { Clip, MidiNote, MidiClipContent } from '../types';

interface PianoRollProps {
  clip: Clip | null;
  onClose: () => void;
}

export const PianoRoll: Component<PianoRollProps> = (props) => {
  const { project, updateClip } = useProject();
  const { view } = useView();
  const { transport } = useTransport();

  return (
    <Show when={props.clip}>
      <div class="piano-roll-container">
        <div class="piano-roll-header">
          <h3>Piano Roll - {props.clip?.name}</h3>
          <button class="close-btn" onClick={props.onClose}>×</button>
        </div>
        
        <div class="piano-roll-content">
          <div class="piano-roll-placeholder">
            <p>Piano Roll editor will be implemented here</p>
            <p>Clip: {props.clip?.name}</p>
            <Show when={props.clip?.content.type === 'midi'}>
              <p>MIDI notes: {(props.clip?.content as MidiClipContent).notes.length}</p>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Piano Roll CSS Styles
const pianoRollStyle = document.createElement('style');
pianoRollStyle.textContent = `
.piano-roll-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.piano-roll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  height: 50px;
  box-sizing: border-box;
}

.piano-roll-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.zoom-btn, .fit-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  min-width: 28px;
  transition: background-color 0.2s ease;
}

.zoom-btn:hover, .fit-btn:hover {
  background: var(--bg-quaternary);
}

.piano-roll-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.piano-roll-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.piano-roll-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--bg-primary);
}

.piano-keyboard {
  width: 120px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  position: relative;
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

.note-grid {
  flex: 1;
  position: relative;
  overflow: auto;
  background: var(--bg-primary);
  cursor: crosshair;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  pointer-events: none;
}

.grid-line.horizontal {
  width: 100%;
  border-bottom: 1px solid var(--border-color);
}

.grid-line.horizontal.black-key {
  background: rgba(0, 0, 0, 0.05);
}

.grid-line.vertical {
  height: 100%;
  border-left: 1px solid var(--border-color);
}

.grid-line.vertical.bar {
  border-left-color: var(--text-secondary);
  border-left-width: 2px;
}

.grid-line.vertical.beat {
  border-left-color: rgba(255, 255, 255, 0.1);
}

.piano-note {
  position: absolute;
  background: #4dabf7;
  border: 1px solid #339af0;
  border-radius: 3px;
  cursor: grab;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: background-color 0.1s ease, border-color 0.1s ease;
  z-index: 10;
}

.piano-note:hover {
  background: #74c0fc;
  border-color: #4dabf7;
  z-index: 15;
}

.piano-note.selected {
  background: #ff6b6b;
  border-color: #ff5252;
  z-index: 20;
}

.piano-note.editing {
  background: #ffd43b;
  border-color: #fcc419;
  z-index: 25;
  cursor: grabbing;
}

.note-resize-handle {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  background: transparent;
  cursor: ew-resize;
  z-index: 30;
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

.piano-note:hover .note-resize-handle {
  background: rgba(255, 255, 255, 0.2);
}

.note-resize-handle:hover {
  background: rgba(255, 255, 255, 0.4) !important;
}
`;
document.head.appendChild(pianoRollStyle);