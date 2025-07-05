import { Show, createEffect, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { audioEngine } from '../utils/audioEngine';
import * as Tone from 'tone';
import AppMenu from './AppMenu';

export default function Transport() {
  const store = useDawStore();

  // Update playhead position in real-time - simplified to avoid oscillation
  createEffect(() => {
    let animationFrame;
    let lastUpdateTime = performance.now();
    let basePosition = store.currentTime;
    let baseTime = performance.now();
    
    const updatePosition = (currentTime) => {
      if (store.isPlaying) {
        const deltaTime = (currentTime - baseTime) / 1000; // Convert to seconds
        
        // Calculate position based on BPM and elapsed time (smooth interpolation)
        const beatsPerSecond = store.bpm / 60;
        const beatsPerBar = 4;
        const barsPerSecond = beatsPerSecond / beatsPerBar;
        
        // Simple time-based progression without audio engine sync to avoid oscillation
        const newPosition = basePosition + (barsPerSecond * deltaTime);
        store.setCurrentTime(newPosition);
      }
      
      if (store.isPlaying) {
        animationFrame = requestAnimationFrame(updatePosition);
      }
    };
    
    if (store.isPlaying) {
      // Reset base when starting playback
      basePosition = store.currentTime;
      baseTime = performance.now();
      animationFrame = requestAnimationFrame(updatePosition);
    }
    
    onCleanup(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    });
  });

  const handlePlay = async () => {
    if (!store.isPlaying) {
      try {
        // Initialize audio engine if needed
        if (!audioEngine.isInitialized) {
          await audioEngine.init();
          audioEngine.buildAudioGraph(store.jmonData);
          audioEngine.setBpm(store.bpm);
        }
        
        // Always clear and reschedule to ensure all notes play from current position
        audioEngine.clear();
        
        // Set playback position
        const bars = Math.floor(store.currentTime);
        const beats = Math.floor((store.currentTime - bars) * 4);
        const ticks = Math.floor(((store.currentTime - bars) * 4 - beats) * 480);
        audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
        
        // Re-schedule all sequences from current position
        store.jmonData.sequences.forEach((sequence, index) => {
          audioEngine.scheduleSequence(sequence, index);
        });
        
        // Set up loop if enabled
        if (store.isLooping) {
          audioEngine.setLoop(`${store.loopStart}:0:0`, `${store.loopEnd}:0:0`);
        } else {
          audioEngine.disableLoop();
        }
        
        // Start playback
        audioEngine.play();
        store.setPlaying(true);
      } catch (error) {
        console.error('Failed to start playback:', error);
        alert('Failed to start audio playback. Please check your audio settings and try again.');
      }
    } else {
      // Pause but don't clear sequences - just stop the transport
      audioEngine.pause();
      store.setPlaying(false);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    audioEngine.clear(); // Clear scheduled events
    store.setPlaying(false);
    store.setCurrentTime(0);
  };

  const handleBpmChange = (e) => {
    const bpm = parseInt(e.target.value);
    if (bpm >= 20 && bpm <= 400) {
      store.setBpm(bpm); // This now automatically updates audio engine
    }
  };

  const formatTime = (bars) => {
    const totalBars = Math.floor(bars);
    const beats = Math.floor((bars - totalBars) * 4);
    const ticks = Math.floor(((bars - totalBars) * 4 - beats) * 480);
    return `${totalBars + 1}:${beats + 1}:${ticks.toString().padStart(3, '0')}`;
  };

  return (
    <nav class="level is-mobile p-3" style="height: 4rem;">
      {/* Left - Transport Controls */}
      <div class="level-left">
        {/* JMON Editor Button */}
        <div class="level-item">
          <button
            onClick={store.toggleJmonEditor}
            class="button is-primary is-small"
            title="JMON Editor"
          >
            <span class="icon is-small">
              <i class="fas fa-code"></i>
            </span>
          </button>
        </div>

        <div class="level-item">
          <div class="buttons has-addons">
            <button
              onClick={handlePlay}
              class="button is-small is-primary"
              title={store.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              style="border: none;"
            >
              <span class="icon is-small">
                <i class={store.isPlaying ? 'fas fa-pause' : 'fas fa-play'}></i>
              </span>
            </button>
            
            <button
              onClick={handleStop}
              class="button is-small is-dark"
              title="Stop (Shift+Enter)"
              style="border: none;"
            >
              <span class="icon is-small">
                <i class="fas fa-stop"></i>
              </span>
            </button>
          </div>
        </div>

        {/* Loop Control */}
        <div class="level-item">
          <button
            onClick={() => store.setLooping(!store.isLooping)}
            class={`button is-small ${store.isLooping ? 'is-warning' : 'is-dark'}`}
            title="Toggle Loop (Cmd+L)"
            style="border: none;"
          >
            <span class="icon is-small">
              <i class="fas fa-redo"></i>
            </span>
            <span>Loop</span>
          </button>
        </div>
      </div>

      {/* Center - Chronomètre & Position */}
      <div class="level-item">
        <div class="field is-grouped">
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-dark">Position</span>
              <span class="tag is-primary is-family-monospace">
                {formatTime(store.currentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right - BPM, Snap, Menu */}
      <div class="level-right">
        {/* BPM Input */}
        <div class="level-item">
          <div class="field has-addons">
            <div class="control">
              <span class="button is-static is-small">BPM</span>
            </div>
            <div class="control">
              <input
                type="number"
                value={store.bpm}
                onChange={handleBpmChange}
                min="20"
                max="400"
                class="input is-small has-text-centered"
                style="width: 4rem;"
              />
            </div>
          </div>
        </div>

        {/* Snap Controls */}
        <div class="level-item">
          <div class="field has-addons">
            <div class="control">
              <button
                onClick={() => store.setSnapEnabled(!store.snapEnabled)}
                class={`button is-small ${store.snapEnabled ? 'is-info' : 'is-dark'}`}
                title="Toggle Snap"
                style="border: none;"
              >
                <span class="icon is-small">
                  <i class="fas fa-magnet"></i>
                </span>
                <span>Snap</span>
              </button>
            </div>
            {/* Always show snap selector */}
            <div class="control">
              <div class="select is-small">
                <select
                  value={store.snapValue}
                  onChange={(e) => store.setSnapValue(e.target.value)}
                  style={store.snapEnabled ? "" : "opacity: 0.5;"}
                  title="Snap Grid Value"
                >
                  <option value="1">1</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="1/8">1/8</option>
                  <option value="1/16">1/16</option>
                  <option value="1/32">1/32</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div class="level-item">
          <div class="field has-addons">
            <div class="control">
              <span class="button is-static is-small">H-Zoom</span>
            </div>
            <div class="control">
              <button
                onClick={() => store.setTimelineZoom(Math.max(0.25, store.timelineZoom - 0.25))}
                class="button is-small is-dark"
                style="border: none;"
              >
                <span class="icon is-small">
                  <i class="fas fa-minus"></i>
                </span>
              </button>
            </div>
            <div class="control">
              <button
                onClick={() => store.setTimelineZoom(Math.min(4, store.timelineZoom + 0.25))}
                class="button is-small is-dark"
                style="border: none;"
              >
                <span class="icon is-small">
                  <i class="fas fa-plus"></i>
                </span>
              </button>
            </div>
          </div>
        </div>


        {/* Menu Hamburger */}
        <div class="level-item">
          <AppMenu />
        </div>
      </div>
    </nav>
  );
}