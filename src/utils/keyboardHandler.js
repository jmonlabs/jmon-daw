import { dawStore } from '../stores/dawStore';
import { audioEngine } from './audioEngine';
import { createEffect } from 'solid-js';
import * as Tone from 'tone';

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
        
      case 'KeyZ':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          if (e.shiftKey) {
            this.handleRedo();
          } else {
            this.handleUndo();
          }
        }
        break;
        
      case 'KeyY':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          this.handleRedo();
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
        
      case 'Home':
        e.preventDefault();
        this.handleGoToStart();
        break;
        
      case 'End':
        e.preventDefault();
        this.handleGoToEnd();
        break;
    }
  }

  handleKeyup(e) {
    // Handle key releases if needed
  }

  async handlePlayPause() {
    console.log(`⌨️ Keyboard handler: handlePlayPause called - isPlaying=${this.store.isPlaying}`);
    if (!this.store.isPlaying) {
      // Use the store's play method which handles looping and playhead sync
      console.log(`⌨️ Keyboard handler: Calling store.play()`);
      await this.store.play();
    } else {
      // Use the store's pause method
      console.log(`⌨️ Keyboard handler: Calling store.pause()`);
      this.store.pause();
    }
  }

  handleStop() {
    console.log(`⌨️ Keyboard handler: handleStop called`);
    // Use the store's stop method for consistency
    this.store.stop();
  }

  handleSeekBackward(largeStep = false) {
    const step = largeStep ? 1 : 0.25; // 1 bar or 1 beat
    const newTime = Math.max(0, this.store.currentTime - step);
    this.store.setCurrentTime(newTime);
    if (audioEngine.isInitialized) {
      const bars = Math.floor(newTime);
      const beats = Math.floor((newTime - bars) * 4);
      const ticks = Math.floor(((newTime - bars) * 4 - beats) * 480);
      audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
    }
  }

  handleSeekForward(largeStep = false) {
    const step = largeStep ? 1 : 0.25; // 1 bar or 1 beat
    const newTime = this.store.currentTime + step;
    this.store.setCurrentTime(newTime);
    if (audioEngine.isInitialized) {
      const bars = Math.floor(newTime);
      const beats = Math.floor((newTime - bars) * 4);
      const ticks = Math.floor(((newTime - bars) * 4 - beats) * 480);
      audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
    }
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

  handleGoToStart() {
    // Go to beginning of timeline
    this.store.setCurrentTime(0);
    if (audioEngine.isInitialized) {
      audioEngine.setPosition('0:0:0');
    }
  }

  handleGoToEnd() {
    // Calculate end position based on latest note in all tracks
    let latestTime = 0;
    
    this.store.tracks.forEach(track => {
      if (track.notes && track.notes.length > 0) {
        track.notes.forEach(note => {
          const noteTime = note.measure || note.time || 0;
          // Add note duration (convert to bars)
          const noteDuration = this.getDurationInBars(note.duration || '4n');
          const noteEnd = noteTime + noteDuration;
          latestTime = Math.max(latestTime, noteEnd);
        });
      }
    });
    
    // If no notes, go to bar 16 as default
    const endTime = latestTime > 0 ? latestTime : 16;
    
    this.store.setCurrentTime(endTime);
    if (audioEngine.isInitialized) {
      const bars = Math.floor(endTime);
      const beats = Math.floor((endTime - bars) * 4);
      const ticks = Math.floor(((endTime - bars) * 4 - beats) * 480);
      audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
    }
  }

  getDurationInBars(duration) {
    // Convert note duration to bars
    const durationMap = {
      '1n': 4,     // Whole note = 4 beats = 1 bar
      '2n': 2,     // Half note = 2 beats = 0.5 bars
      '4n': 1,     // Quarter note = 1 beat = 0.25 bars
      '8n': 0.5,   // Eighth note = 0.5 beats = 0.125 bars
      '16n': 0.25, // Sixteenth note = 0.25 beats = 0.0625 bars
      '32n': 0.125 // Thirty-second note = 0.125 beats = 0.03125 bars
    };
    
    const beats = durationMap[duration] || 1;
    return beats / 4; // Convert beats to bars (4 beats = 1 bar)
  }

  handleUndo() {
    console.log('⌨️ Keyboard handler: Undo triggered');
    this.store.undo();
  }

  handleRedo() {
    console.log('⌨️ Keyboard handler: Redo triggered');
    this.store.redo();
  }
}

export const keyboardHandler = new KeyboardHandler();