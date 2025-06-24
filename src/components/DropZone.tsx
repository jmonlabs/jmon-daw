import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { FileHandlers } from '../utils/fileHandlers';
import { useProject } from '../stores/context';

interface DropZoneProps {
  onFileDrop?: (files: File[]) => void;
  trackId?: string;
  dropPosition?: number;
  children?: any;
}

export const DropZone: Component<DropZoneProps> = (props) => {
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [dragCounter, setDragCounter] = createSignal(0);
  const { addClip } = useProject();
  let dropZoneRef: HTMLDivElement | undefined;

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => c + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(c => c - 1);
    
    if (dragCounter() === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer?.files || []);
    
    if (files.length === 0) return;

    if (props.onFileDrop) {
      props.onFileDrop(files);
      return;
    }

    // Process files and create clips
    for (const file of files) {
      if (FileHandlers.validateFileType(file)) {
        try {
          const result = await FileHandlers.handleFile(file);
          if (result && props.trackId) {
            const clipData = {
              name: result.name,
              start: props.dropPosition || 0,
              end: (props.dropPosition || 0) + (result.duration || 2),
              duration: result.duration || 2,
              type: result.type === 'jmon' ? 'midi' : result.type as 'audio' | 'midi',
              content: result.content,
              color: result.type === 'audio' ? '#10b981' : '#3b82f6'
            };
            
            addClip(props.trackId, clipData);
          }
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
        }
      } else {
        console.warn(`Unsupported file type: ${file.name}`);
      }
    }
  };

  onMount(() => {
    if (dropZoneRef) {
      dropZoneRef.addEventListener('dragenter', handleDragEnter);
      dropZoneRef.addEventListener('dragleave', handleDragLeave);
      dropZoneRef.addEventListener('dragover', handleDragOver);
      dropZoneRef.addEventListener('drop', handleDrop);
    }
  });

  onCleanup(() => {
    if (dropZoneRef) {
      dropZoneRef.removeEventListener('dragenter', handleDragEnter);
      dropZoneRef.removeEventListener('dragleave', handleDragLeave);
      dropZoneRef.removeEventListener('dragover', handleDragOver);
      dropZoneRef.removeEventListener('drop', handleDrop);
    }
  });

  return (
    <div
      ref={dropZoneRef}
      class={`drop-zone ${isDragOver() ? 'drag-over' : ''}`}
      data-drag-over={isDragOver()}
    >
      {props.children ? (
        props.children
      ) : (
        <div class="drop-zone-content">
          <div class="drop-zone-icon">📁</div>
          <div class="drop-zone-text">
            {isDragOver() ? 'Drop files here' : 'Drag audio/MIDI/JMON files here'}
          </div>
          <div class="drop-zone-subtext">
            Supports: WAV, MP3, OGG, FLAC, MIDI, JMON
          </div>
        </div>
      )}
    </div>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.drop-zone {
  position: relative;
  border: 2px dashed #555;
  border-radius: 8px;
  background: rgba(45, 45, 45, 0.5);
  transition: all 0.3s ease;
  min-height: 60px;
}

/* When drop zone has children (track lanes), remove centering layout */
.drop-zone:has(.track-lane) {
  display: block;
  border: none;
  background: transparent;
  margin: 0;
  border-radius: 0;
  min-height: auto;
}

/* Empty drop zone uses flex centering */
.drop-zone:not(:has(.track-lane)) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  min-height: 120px;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  transform: scale(1.02);
}

.drop-zone-content {
  text-align: center;
  color: #888;
  pointer-events: none;
}

.drop-zone-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.drop-zone-text {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.drop-zone.drag-over .drop-zone-text {
  color: #3b82f6;
}

.drop-zone-subtext {
  font-size: 0.8rem;
  color: #666;
}

/* Track-specific drop zones */
.track-lane {
  position: relative;
}

.track-lane::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.track-lane[data-drag-over="true"]::after {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}
`;
document.head.appendChild(style);