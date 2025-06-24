import { Component, onMount, onCleanup } from 'solid-js';
import { useTransport, useView } from '../stores/context';

export const KeyboardShortcuts: Component = () => {
  const { transport, play, pause, setCurrentTime, toggleLoop, setLoopStart, setLoopEnd } = useTransport();
  const { view } = useView();

  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (transport.isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'Home':
          e.preventDefault();
          // Reset time to zero, preserve current play state
          setCurrentTime(0);
          console.log('Home key pressed: reset to time 0, play state:', transport.isPlaying ? 'playing' : 'stopped/paused');
          break;
        case 'KeyL':
          e.preventDefault();
          // Toggle loop mode
          toggleLoop();
          console.log('L key pressed: toggle loop mode, now:', transport.isLooping ? 'off' : 'on');
          break;
        case 'BracketLeft':
          e.preventDefault();
          // Set loop start at current position with snap
          let loopStartTime = transport.currentTime;
          
          // Apply snap to grid if enabled
          if (view.snapToGrid) {
            const snapSize = view.gridSize;
            loopStartTime = Math.round(loopStartTime / snapSize) * snapSize;
          }
          
          setLoopStart(loopStartTime);
          console.log('[ key pressed: set loop start at', loopStartTime, '(snap:', view.snapToGrid ? 'on' : 'off', ')');
          break;
        case 'BracketRight':
          e.preventDefault();
          // Set loop end at current position with snap
          let loopEndTime = transport.currentTime;
          
          // Apply snap to grid if enabled
          if (view.snapToGrid) {
            const snapSize = view.gridSize;
            loopEndTime = Math.round(loopEndTime / snapSize) * snapSize;
          }
          
          setLoopEnd(loopEndTime);
          console.log('] key pressed: set loop end at', loopEndTime, '(snap:', view.snapToGrid ? 'on' : 'off', ')');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  return null; // This component doesn't render anything
};