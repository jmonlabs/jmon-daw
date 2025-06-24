import { Component, createSignal, createEffect } from 'solid-js';
import { useProject } from '../stores/context';
import { Icon } from './Icon';

// Global state for editor expansion
export const [isJmonEditorExpanded, setIsJmonEditorExpanded] = createSignal(false);

export const JmonEditor: Component = () => {
  const { project, setProject } = useProject();
  const [jmonText, setJmonText] = createSignal('');
  const [hasError, setHasError] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal('');

  // Update JMON text when project changes
  createEffect(() => {
    // Create a cleaner JMON representation without duplication
    const jmonData = {
      name: project.name,
      version: "1.0",
      tempo: project.tempo,
      timeSignature: project.timeSignature,
      tracks: project.tracks.map(track => {
        // Consolidate all notes from all clips into a single notes array per track
        const allNotes = track.clips.flatMap(clip => 
          clip.content.notes?.map(note => ({
            note: note.note,
            time: clip.start + note.time, // Absolute time from start of track
            duration: note.duration,
            velocity: note.velocity || 0.8
          })) || []
        );

        return {
          name: track.name,
          instrument: track.instrument?.type || 'synth',
          instrumentParams: track.instrument?.parameters || {},
          volume: track.volume,
          notes: allNotes
        };
      })
    };
    setJmonText(JSON.stringify(jmonData, null, 2));
  });

  const handleApplyChanges = () => {
    try {
      const parsedData = JSON.parse(jmonText());
      
      // Basic validation
      if (!parsedData.tracks || !Array.isArray(parsedData.tracks)) {
        throw new Error('Invalid JMON format: missing or invalid tracks array');
      }

      // Update existing tracks while preserving clip structure
      const updatedTracks = project.tracks.map((existingTrack, trackIndex) => {
        const jmonTrack = parsedData.tracks[trackIndex];
        if (!jmonTrack) return existingTrack; // Keep existing track if no JMON data

        // Update track properties
        const updatedTrack = {
          ...existingTrack,
          name: jmonTrack.name || existingTrack.name,
          volume: typeof jmonTrack.volume === 'number' ? jmonTrack.volume : existingTrack.volume,
          instrument: {
            ...existingTrack.instrument,
            type: jmonTrack.instrument || existingTrack.instrument?.type || 'synth',
            parameters: jmonTrack.instrumentParams || existingTrack.instrument?.parameters || {}
          }
        };

        // Update notes in existing clips and adjust clip boundaries
        if (jmonTrack.notes && jmonTrack.notes.length > 0) {
          const updatedClips = existingTrack.clips.map(clip => {
            // Find notes that belong to this clip (within clip's time range)
            const clipNotes = jmonTrack.notes.filter((note: any) => 
              note.time >= clip.start && note.time < clip.start + clip.duration
            ).map((note: any) => ({
              note: note.note,
              time: note.time - clip.start, // Convert back to relative time within clip
              duration: note.duration || 0.25,
              velocity: note.velocity || 0.8
            }));

            // Calculate new clip duration based on the longest note
            let newDuration = clip.duration;
            if (clipNotes.length > 0) {
              const longestNoteEnd = Math.max(...clipNotes.map(note => note.time + note.duration));
              newDuration = Math.max(longestNoteEnd, 0.25); // Minimum duration of 0.25
            }

            return {
              ...clip,
              duration: newDuration,
              end: clip.start + newDuration,
              content: {
                ...clip.content,
                notes: clipNotes
              }
            };
          });

          updatedTrack.clips = updatedClips;
        }

        return updatedTrack;
      });

      // Add new tracks if JMON has more tracks than current project
      const newTracks = parsedData.tracks.slice(project.tracks.length).map((trackData: any) => ({
        id: crypto.randomUUID(),
        name: trackData.name || 'New Track',
        type: 'instrument',
        volume: typeof trackData.volume === 'number' ? trackData.volume : 0.8,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
        color: '#3b82f6',
        instrument: {
          id: crypto.randomUUID(),
          name: trackData.instrument || 'synth',
          type: trackData.instrument || 'synth',
          parameters: trackData.instrumentParams || {}
        },
        effects: [],
        clips: trackData.notes && trackData.notes.length > 0 ? [{
          id: crypto.randomUUID(),
          name: `${trackData.name} Clip`,
          start: 0,
          end: Math.max(...trackData.notes.map((n: any) => n.time + n.duration), 1),
          duration: Math.max(...trackData.notes.map((n: any) => n.time + n.duration), 1),
          type: 'midi',
          content: {
            type: 'midi',
            notes: trackData.notes.map((note: any) => ({
              note: note.note,
              time: note.time,
              duration: note.duration || 0.25,
              velocity: note.velocity || 0.8
            }))
          },
          color: '#3b82f6',
          trackId: crypto.randomUUID()
        }] : []
      }));

      setProject({
        ...project,
        name: parsedData.name || project.name,
        tempo: parsedData.tempo || project.tempo,
        timeSignature: parsedData.timeSignature || project.timeSignature,
        tracks: [...updatedTracks, ...newTracks]
      });

      setHasError(false);
      setErrorMessage('');
      console.log('JMON changes applied successfully');
    } catch (error) {
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Invalid JSON format');
      console.error('Error applying JMON changes:', error);
    }
  };

  const handleReset = () => {
    // Reset to current project state using clean format
    const jmonData = {
      name: project.name,
      version: "1.0",
      tempo: project.tempo,
      timeSignature: project.timeSignature,
      tracks: project.tracks.map(track => {
        // Consolidate all notes from all clips
        const allNotes = track.clips.flatMap(clip => 
          clip.content.notes?.map(note => ({
            note: note.note,
            time: clip.start + note.time,
            duration: note.duration,
            velocity: note.velocity || 0.8
          })) || []
        );

        return {
          name: track.name,
          instrument: track.instrument?.type || 'synth',
          instrumentParams: track.instrument?.parameters || {},
          volume: track.volume,
          notes: allNotes
        };
      })
    };
    setJmonText(JSON.stringify(jmonData, null, 2));
    setHasError(false);
    setErrorMessage('');
  };

  return (
    <div class={`jmon-editor ${isJmonEditorExpanded() ? 'expanded' : 'collapsed'}`}>
      <div class="jmon-editor-content">
        <div class="jmon-editor-header">
          <h3>JMON Editor</h3>
          <div class="jmon-editor-actions">
            <button class="editor-btn" onClick={handleReset} title="Reset to current project">
              <Icon name="refresh-cw" size={14} color="var(--text-secondary)" />
            </button>
            <button class="editor-btn primary" onClick={handleApplyChanges} title="Apply changes">
              <Icon name="check" size={14} color="white" />
            </button>
          </div>
        </div>
        
        <div class="jmon-editor-body">
          <textarea
            class={`jmon-textarea ${hasError() ? 'error' : ''}`}
            value={jmonText()}
            onInput={(e) => {
              setJmonText(e.currentTarget.value);
              setHasError(false);
              setErrorMessage('');
            }}
            placeholder="JMON data will appear here..."
            spellcheck={false}
          />
          
          {hasError() && (
            <div class="jmon-error">
              <Icon name="alert-circle" size={16} color="var(--accent-red)" />
              <span>{errorMessage()}</span>
            </div>
          )}
          
          <div class="jmon-editor-footer">
            <small>Edit JMON data directly. Click Apply to update the project.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.jmon-editor {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  z-index: 1000;
  display: flex;
  transition: transform 0.3s ease;
}

.jmon-editor.collapsed {
  transform: translateX(-400px);
}

.jmon-editor.expanded {
  transform: translateX(0);
}

.jmon-editor-content {
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-quaternary);
}

.jmon-editor-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
}

.jmon-editor-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 600;
}

.jmon-editor-actions {
  display: flex;
  gap: 8px;
}

.editor-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.editor-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}

.editor-btn.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

.editor-btn.primary:hover {
  background: var(--accent-primary-hover);
}

.jmon-editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.jmon-textarea {
  flex: 1;
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  color: var(--text-primary);
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  resize: none;
  outline: none;
  overflow-y: auto;
}

.jmon-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.jmon-textarea.error {
  border-color: var(--accent-red);
  box-shadow: 0 0 0 1px var(--accent-red);
}

.jmon-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(214, 118, 118, 0.1);
  border: 1px solid var(--accent-red);
  border-radius: 4px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--accent-red);
}

.jmon-editor-footer {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-align: center;
}

`;
document.head.appendChild(style);