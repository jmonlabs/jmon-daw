import type { Clip, MidiNote, MidiClipContent } from '../../types';

// Shared types for piano roll functionality
export interface PianoRollConfig {
  /** Width of the piano keyboard in pixels */
  pianoWidth: number;
  /** MIDI note range */
  noteRange: { min: number; max: number };
  /** Default note names for MIDI conversion */
  noteNames: string[];
}

export interface PianoRollDimensions {
  /** Horizontal scale - pixels per beat */
  timeScale: number;
  /** Vertical scale - pixels per semitone */
  pitchScale: number;
  /** Total height of the piano roll area */
  totalHeight: number;
  /** Vertical scroll offset */
  scrollY: number;
}

export interface PianoRollViewport {
  /** Visible time range */
  timeStart: number;
  timeEnd: number;
  /** Visible pitch range */
  pitchStart: number;
  pitchEnd: number;
}

export interface NoteDragState {
  active: boolean;
  type: 'move' | 'resize-start' | 'resize-end' | 'pitch' | 'position';
  noteIndex: number;
  clipId: string;
  startX: number;
  startY: number;
  startTime: number;
  startDuration: number;
  startPitch: string | number;
  currentPitch?: string | number;
  mouseX?: number;
  mouseY?: number;
}

export interface PianoRollNote {
  /** Original MIDI note data */
  note: MidiNote;
  /** Index in the notes array */
  index: number;
  /** Calculated position and size */
  x: number;
  y: number;
  width: number;
  height: number;
  /** MIDI number for this note */
  midiNumber: number;
  /** Display properties */
  isSelected: boolean;
  isDragging: boolean;
  color: string;
  borderColor: string;
}

export interface PianoRollInteractionHandlers {
  onNoteMouseDown: (e: MouseEvent, noteIndex: number, clip: Clip) => void;
  onNoteGridClick?: (e: MouseEvent, time: number, pitch: number) => void;
  onNoteDelete?: (noteIndex: number) => void;
  onNoteSelect?: (noteIndex: number, multiSelect?: boolean) => void;
}

export interface PianoRollRenderProps {
  /** The clip containing MIDI data to render */
  clip: Clip;
  /** Rendering dimensions and scales */
  dimensions: PianoRollDimensions;
  /** Current viewport */
  viewport?: PianoRollViewport;
  /** Selected note indices */
  selectedNotes?: number[];
  /** Currently dragging note info */
  dragState?: NoteDragState;
  /** Interaction handlers */
  handlers: PianoRollInteractionHandlers;
  /** Display configuration */
  config?: Partial<PianoRollConfig>;
  /** Additional styling options */
  style?: {
    noteColors?: {
      normal: string;
      darker: string;
    };
    showNoteNames?: boolean;
    showResizeHandles?: boolean;
    compactMode?: boolean;
  };
}

export interface GridRenderProps {
  dimensions: PianoRollDimensions;
  config: PianoRollConfig;
  viewport?: PianoRollViewport;
  showPianoKeys?: boolean;
  clipDuration?: number;
}