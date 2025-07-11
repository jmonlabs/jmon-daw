import { createSignal, Show, onMount, createEffect } from 'solid-js';
import { midiToNoteName, noteNameToMidi } from '../utils/noteConversion';

export default function NoteProperties(props) {
  const { note, isOpen, onClose, onSave, trackId } = props;
  
  // Form state - only basic note properties
  const [noteValue, setNoteValue] = createSignal('');
  const [timeValue, setTimeValue] = createSignal('');
  const [durationValue, setDurationValue] = createSignal('');
  const [velocityValue, setVelocityValue] = createSignal(0.8);
  
  // Duration options
  const durationOptions = [
    { value: '1n', label: 'Whole Note (1n)' },
    { value: '2n', label: 'Half Note (2n)' },
    { value: '4n', label: 'Quarter Note (4n)' },
    { value: '8n', label: 'Eighth Note (8n)' },
    { value: '16n', label: 'Sixteenth Note (16n)' },
    { value: '32n', label: 'Thirty-second Note (32n)' },
    { value: '2n.', label: 'Dotted Half (2n.)' },
    { value: '4n.', label: 'Dotted Quarter (4n.)' },
    { value: '8n.', label: 'Dotted Eighth (8n.)' },
    { value: '2t', label: 'Half Note Triplet (2t)' },
    { value: '4t', label: 'Quarter Note Triplet (4t)' },
    { value: '8t', label: 'Eighth Note Triplet (8t)' }
  ];
  
  // Initialize form when note changes
  createEffect(() => {
    const currentNote = typeof note === 'function' ? note() : note;
    if (currentNote && isOpen()) {
      setNoteValue(currentNote.note || 'C4');
      setTimeValue(currentNote.time || '0:0:0');
      setDurationValue(currentNote.duration || '4n');
      setVelocityValue(currentNote.velocity || 0.8);
    }
  });
  
  const handleSave = () => {
    const currentNote = typeof note === 'function' ? note() : note;
    const updatedNote = {
      ...currentNote,
      note: noteValue(),
      time: timeValue(),
      duration: durationValue(),
      velocity: velocityValue()
    };
    
    onSave(updatedNote);
    onClose();
  };
  
  const handleCancel = () => {
    onClose();
  };
  
  // Convert time string to readable format
  const formatTime = (timeStr) => {
    const parts = timeStr.split(':');
    const measure = parseInt(parts[0]) + 1; // 1-based for display
    const beat = parseInt(parts[1]) + 1;    // 1-based for display  
    const subdivision = parts[2] || '0';
    return `${measure}:${beat}:${subdivision}`;
  };
  
  // Parse display time back to internal format
  const parseTime = (displayTime) => {
    const parts = displayTime.split(':');
    const measure = Math.max(0, parseInt(parts[0]) - 1); // 0-based internally
    const beat = Math.max(0, parseInt(parts[1]) - 1);    // 0-based internally
    const subdivision = parts[2] || '0';
    return `${measure}:${beat}:${subdivision}`;
  };
  
  return (
    <Show when={isOpen()}>
      <div 
        class="modal is-active"
        style="z-index: var(--z-modal);"
      >
        <div class="modal-background" onClick={handleCancel}></div>
        <div class="modal-card" style="
          background-color: var(--color-bg-modal);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-primary);
          width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        ">
          <header class="modal-card-head" style="
            background-color: var(--color-bg-secondary);
            border-bottom: 1px solid var(--color-border-primary);
          ">
            <p class="modal-card-title" style="color: var(--color-text-primary);">
              <i class="fas fa-edit mr-2"></i>
              Note Properties
            </p>
            <button 
              class="delete" 
              aria-label="close"
              onClick={handleCancel}
              style="background-color: var(--color-text-muted);"
            ></button>
          </header>
          
          <section class="modal-card-body" style="background-color: var(--color-bg-modal);">
            {/* Basic Properties */}
            <div class="field-group mb-5">
              <h4 class="title is-6" style="color: var(--color-text-primary); margin-bottom: 1rem;">
                Basic Properties
              </h4>
              
              {/* Note/Pitch */}
              <div class="field">
                <label class="label" style="color: var(--color-text-secondary);">Note</label>
                <div class="control">
                  <input 
                    class="input"
                    type="text"
                    value={noteValue()}
                    onChange={(e) => setNoteValue(e.target.value)}
                    placeholder="e.g. C4, D#3, Bb5"
                    style="
                      background-color: var(--color-bg-surface);
                      border: 1px solid var(--color-border-primary);
                      color: var(--color-text-primary);
                    "
                  />
                  <p class="help" style="color: var(--color-text-muted);">
                    Format: Note + Octave (e.g. C4, F#3, Bb2)
                  </p>
                </div>
              </div>
              
              {/* Time */}
              <div class="field">
                <label class="label" style="color: var(--color-text-secondary);">Time Position</label>
                <div class="control">
                  <input 
                    class="input"
                    type="text"
                    value={formatTime(timeValue())}
                    onChange={(e) => setTimeValue(parseTime(e.target.value))}
                    placeholder="e.g. 1:1:0, 2:3:2"
                    style="
                      background-color: var(--color-bg-surface);
                      border: 1px solid var(--color-border-primary);
                      color: var(--color-text-primary);
                    "
                  />
                  <p class="help" style="color: var(--color-text-muted);">
                    Format: Measure:Beat:Subdivision (e.g. 1:1:0 for measure 1, beat 1)
                  </p>
                </div>
              </div>
              
              {/* Duration */}
              <div class="field">
                <label class="label" style="color: var(--color-text-secondary);">Duration</label>
                <div class="control">
                  <div class="select is-fullwidth">
                    <select 
                      value={durationValue()}
                      onChange={(e) => setDurationValue(e.target.value)}
                      style="
                        background-color: var(--color-bg-surface);
                        border: 1px solid var(--color-border-primary);
                        color: var(--color-text-primary);
                      "
                    >
                      <For each={durationOptions}>
                        {(option) => (
                          <option value={option.value}>{option.label}</option>
                        )}
                      </For>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Velocity */}
              <div class="field">
                <label class="label" style="color: var(--color-text-secondary);">
                  Velocity: {Math.round(velocityValue() * 100)}%
                </label>
                <div class="control">
                  <input 
                    class="slider is-fullwidth"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={velocityValue()}
                    onChange={(e) => setVelocityValue(parseFloat(e.target.value))}
                    style="accent-color: var(--color-accent-primary);"
                  />
                  <p class="help" style="color: var(--color-text-muted);">
                    Controls the note's volume/intensity (0-100%)
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          <footer class="modal-card-foot" style="
            background-color: var(--color-bg-secondary);
            border-top: 1px solid var(--color-border-primary);
            justify-content: flex-end;
          ">
            <button 
              class="button"
              onClick={handleCancel}
              style="
                background-color: var(--color-bg-surface);
                border: 1px solid var(--color-border-primary);
                color: var(--color-text-secondary);
                margin-right: 0.75rem;
              "
            >
              Cancel
            </button>
            <button 
              class="button is-primary"
              onClick={handleSave}
              style="
                background-color: var(--color-accent-primary);
                border: none;
                color: var(--color-text-on-accent);
              "
            >
              <i class="fas fa-save mr-2"></i>
              Save Changes
            </button>
          </footer>
        </div>
      </div>
    </Show>
  );
}
