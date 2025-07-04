import { dawStore } from '../stores/dawStore';
import { audioEngine } from './audioEngine';
import { createEffect } from 'solid-js';

class KeyboardHandler {
  constructor() {
    this.store = null;
    this.isJmonEditorFocused = false;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleKeyup = this.handleKeyup.bind(this);
  }

  init(store) {
    this.store = store;
    document.addEventListener('keydown', this.boundHandleKeydown);
    document.addEventListener('keyup', this.boundHandleKeyup);
    
    // Watch for JMON editor state changes using SolidJS reactivity
    createEffect(() => {
      this.isJmonEditorFocused = this.store.jmonEditorOpen;
    });
  }

  destroy() {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    document.removeEventListener('keyup', this.boundHandleKeyup);
  }

  shouldIgnoreKeyboard() {
    // Check if user is typing in an input field
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );
    
    // Check if JMON editor is open and focused
    return isInputField || this.isJmonEditorFocused;
  }

  handleKeydown(e) {
    if (this.shouldIgnoreKeyboard()) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.handlePlayPause();
        break;
        
      case 'Enter':
        if (e.shiftKey) {
          e.preventDefault();
          this.handleStop();
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        this.handleSeekBackward(e.shiftKey);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        this.handleSeekForward(e.shiftKey);
        break;
        
      case 'ArrowUp':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleZoomIn();
        }
        break;
        
      case 'ArrowDown':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleZoomOut();
        }
        break;
        
      case 'KeyL':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleToggleLoop();
        }
        break;
        
      case 'KeyT':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleAddTrack();
        }
        break;
        
      case 'KeyS':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleToggleSnap();
        }
        break;
        
      case 'KeyJ':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleToggleJmonEditor();
        }
        break;
        
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        if (e.altKey) {
          e.preventDefault();
          this.handleSelectTrack(parseInt(e.code.slice(-1)) - 1);
        }
        break;
        
      case 'Backspace':
      case 'Delete':
        if (this.store.selectedNotes.length > 0) {
          e.preventDefault();
          this.handleDeleteSelectedNotes();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        this.handleDeselectAll();
        break;
    }
  }

  handleKeyup(e) {
    // Handle key releases if needed
  }

  async handlePlayPause() {
    if (!this.store.isPlaying) {
      await audioEngine.init();
      audioEngine.setBpm(this.store.bpm);
      
      // Schedule all tracks
      this.store.tracks.forEach(track => {
        if (track.notes && track.notes.length > 0) {
          const synthId = audioEngine.createSynth(track.synthType, track.synthOptions);
          const sequence = { notes: track.notes };
          audioEngine.scheduleSequence(sequence, synthId);
        }
      });
      
      audioEngine.play();
      this.store.setPlaying(true);
    } else {
      audioEngine.pause();
      this.store.setPlaying(false);
    }
  }

  handleStop() {
    audioEngine.stop();
    audioEngine.clearAll();
    this.store.setPlaying(false);
    this.store.setCurrentTime(0);
  }

  handleSeekBackward(largeStep = false) {
    const step = largeStep ? 1 : 0.25; // 1 bar or 1 beat
    const newTime = Math.max(0, this.store.currentTime - step);
    this.store.setCurrentTime(newTime);
    audioEngine.setPosition(`${newTime}:0:0`);
  }

  handleSeekForward(largeStep = false) {
    const step = largeStep ? 1 : 0.25; // 1 bar or 1 beat
    const newTime = this.store.currentTime + step;
    this.store.setCurrentTime(newTime);
    audioEngine.setPosition(`${newTime}:0:0`);
  }

  handleZoomIn() {
    const newZoom = Math.min(4, this.store.timelineZoom * 1.2);
    this.store.setTimelineZoom(newZoom);
  }

  handleZoomOut() {
    const newZoom = Math.max(0.25, this.store.timelineZoom / 1.2);
    this.store.setTimelineZoom(newZoom);
  }

  handleToggleLoop() {
    this.store.setLooping(!this.store.isLooping);
  }

  handleAddTrack() {
    this.store.addTrack();
  }

  handleToggleSnap() {
    this.store.setSnapEnabled(!this.store.snapEnabled);
  }

  handleToggleJmonEditor() {
    this.store.toggleJmonEditor();
  }

  handleSelectTrack(index) {
    if (index < this.store.tracks.length) {
      const track = this.store.tracks[index];
      this.store.setSelectedTrack(track.id);
    }
  }

  handleDeleteSelectedNotes() {
    // Implementation would depend on how selected notes are managed
    // For now, just clear the selection
    this.store.setSelectedNotes([]);
  }

  handleDeselectAll() {
    this.store.setSelectedNotes([]);
    this.store.setSelectedTrack(null);
  }
}

export const keyboardHandler = new KeyboardHandler();