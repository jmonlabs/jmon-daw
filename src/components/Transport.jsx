import { Show, createEffect, onCleanup, createSignal } from "solid-js";
import { useDawStore } from "../stores/dawStore";
import { audioEngine } from "../utils/audioEngine";
import * as Tone from "tone";
import AppMenu from "./AppMenu";
import ThemeToggle from "./ThemeToggle";

export default function Transport() {
  const store = useDawStore();
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  // Check if header elements should be collapsed based on screen size
  const checkCollapse = () => {
    const width = window.innerWidth;
    setIsCollapsed(width < 1024); // Collapse on tablets and mobile
  };

  // Add event listener for window resize
  window.addEventListener('resize', checkCollapse);
  checkCollapse(); // Initial check

  // Update playhead position in real-time with loop awareness
  let animationFrame;
  let isAnimationActive = false;

  const startAnimation = () => {
    if (isAnimationActive) return;
    isAnimationActive = true;

    let basePosition = store.currentTime;
    let baseTime = performance.now();
    let lastUpdateTime = 0;
    let isAnimating = false;

    const updatePosition = (currentTime) => {
      if (!store.isPlaying || !isAnimationActive) {
        isAnimationActive = false;
        return;
      }

      if (isAnimating) {
        animationFrame = requestAnimationFrame(updatePosition);
        return;
      }
      isAnimating = true;

      try {
        // Throttle updates to ~60fps to prevent excessive updates
        if (currentTime - lastUpdateTime < 16) {
          animationFrame = requestAnimationFrame(updatePosition);
          return;
        }
        lastUpdateTime = currentTime;

        const deltaTime = (currentTime - baseTime) / 1000; // Convert to seconds

        // Calculate position based on BPM and elapsed time (smooth interpolation)
        const beatsPerSecond = store.bpm / 60;
        const beatsPerBar = 4;
        const barsPerSecond = beatsPerSecond / beatsPerBar;

        // Calculate new position
        let newPosition = basePosition + barsPerSecond * deltaTime;

        // Safety check: prevent runaway playhead (max 10 measures/second)
        if (barsPerSecond > 10) {
          console.warn(`🚨 Transport.jsx: Runaway playhead detected! barsPerSecond=${barsPerSecond.toFixed(3)} (BPM=${store.bpm})`);
          return;
        }

        // Handle loop boundaries if looping is enabled
        if (store.isLooping) {
          const loopStart = store.loopStart;
          const loopEnd = store.loopEnd;

          if (newPosition >= loopEnd) {
            // Loop back to start and adjust base time
            const loopDuration = loopEnd - loopStart;
            const overshoot = newPosition - loopEnd;
            newPosition = loopStart + (overshoot % loopDuration);

            // Reset base to prevent drift
            basePosition = newPosition;
            baseTime = currentTime;
          }
        }

        // Only update if position has changed significantly (prevent micro-updates)
        if (Math.abs(newPosition - store.currentTime) > 0.001) {
          store.setCurrentTime(newPosition);
        }

        if (store.isPlaying && isAnimationActive) {
          animationFrame = requestAnimationFrame(updatePosition);
        }
      } finally {
        isAnimating = false;
      }
    };

    console.log(`🎬 Transport.jsx: Starting animation from position ${basePosition.toFixed(3)}`);
    animationFrame = requestAnimationFrame(updatePosition);
  };

  const stopAnimation = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    isAnimationActive = false;
    console.log(`🎬 Transport.jsx: Animation stopped`);
  };

  // Watch for play state changes only
  createEffect(() => {
    if (store.isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    stopAnimation();
  });

  const handlePlay = async () => {
    console.log(
      `🎵 Transport.jsx: handlePlay called - isPlaying=${store.isPlaying}`,
    );
    if (!store.isPlaying) {
      // Use the store's play method which handles looping and playhead sync
      console.log(`🎵 Transport.jsx: Calling store.play()`);
      await store.play();
    } else {
      // Use the store's pause method
      console.log(`🎵 Transport.jsx: Calling store.pause()`);
      store.pause();
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
    return `${totalBars + 1}:${beats + 1}:${ticks.toString().padStart(3, "0")}`;
  };

  return (
    <nav
      style="
      height: 3rem;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--surface-bg);
      border-bottom: 1px solid var(--border-color);
      gap: 1rem;
    "
    >      {/* Left - Transport Controls */}
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        {/* JMON Editor Button */}
        <Show when={!isCollapsed()}>
          <button
            onClick={() => store.toggleJmonEditor()}
            class="btn btn-secondary"
            title="JMON Editor"
          >
            <i class="fa-solid fa-code" style="font-size: 0.75rem;"></i>
          </button>
        </Show>

        {/* Play/Stop - Merged */}
        <div class="btn-group">
          <button
            onClick={handlePlay}
            class={`btn ${store.isPlaying ? "btn-toggle active" : "btn-primary"}`}
            title={store.isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            <i
              class={store.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}
              style="font-size: 0.75rem;"
            ></i>
          </button>
          <button
            onClick={handleStop}
            class="btn btn-secondary"
            title="Stop (Shift+Enter)"
          >
            <i class="fa-solid fa-stop" style="font-size: 0.75rem;"></i>
          </button>
        </div>

        {/* Loop Control */}
        <Show when={!isCollapsed()}>
          <button
            onClick={() => store.setLooping(!store.isLooping)}
            class={`btn btn-toggle ${store.isLooping ? "active" : ""}`}
            title="Toggle Loop (Cmd+L)"
          >
            <i class="fa-solid fa-infinity" style="font-size: 0.75rem;"></i>
          </button>
        </Show>

        {/* Undo/Redo - Merged */}
        <Show when={!isCollapsed()}>
          <div class="btn-group">
            <button
              onClick={() => store.undo()}
              disabled={!store.canUndo}
              class="btn btn-secondary"
              title={
                store.canUndo
                  ? `Undo: ${store.undoDescription} (Ctrl+Z)`
                  : "Nothing to undo"
              }
            >
              <i class="fa-solid fa-undo" style="font-size: 0.75rem;"></i>
            </button>
            <button
              onClick={() => store.redo()}
              disabled={!store.canRedo}
              class="btn btn-secondary"
              title={
                store.canRedo
                  ? `Redo: ${store.redoDescription} (Ctrl+Y)`
                  : "Nothing to redo"
              }
            >
              <i class="fa-solid fa-redo" style="font-size: 0.75rem;"></i>
            </button>
          </div>
        </Show>
      </div>

      {/* Center - Position & Time - Merged */}
      <div class="btn-group">
        <div
          style="
          height: 2.25rem;
          padding: 0 0.75rem;
          background-color: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          border: none;
        "
        >
          <i class="fa-solid fa-stopwatch" style="font-size: 0.75rem;"></i>
          Position
        </div>
        <div
          style="
          height: 2.25rem;
          padding: 0 0.75rem;
          background-color: var(--color-accent-primary);
          color: var(--color-text-on-accent);
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          font-family: var(--font-mono);
          border: none;
          min-width: 6rem;
        "
        >
          {formatTime(store.currentTime)}
        </div>
      </div>

      {/* Right - Controls */}
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        {/* BPM - Merged */}
        <div class="btn-group">
          <Show when={!isCollapsed()}>
            <div
              style="
              height: 2.25rem;
              padding: 0 0.75rem;
              background-color: var(--color-bg-secondary);
              color: var(--color-text-secondary);
              display: flex;
              align-items: center;
              font-size: var(--font-size-xs);
              font-weight: var(--font-weight-medium);
              border: none;
            "
            >
              BPM
            </div>
          </Show>
          <input
            type="number"
            value={store.bpm}
            onChange={handleBpmChange}
            min="20"
            max="400"
            class="input"
            style="
              height: 2.25rem;
              width: 4rem;
              border: none;
              border-radius: 0;
              text-align: center;
              font-weight: var(--font-weight-semibold);
            "
          />
        </div>

        {/* Snap - Icon Only */}
        <Show when={!isCollapsed()}>
          <div class="btn-group">
            <button
              onClick={() => store.setSnapEnabled(!store.snapEnabled)}
              class={`btn btn-toggle ${store.snapEnabled ? "active" : ""}`}
              title="Toggle Snap"
            >
              <i class="fa-solid fa-magnet" style="font-size: 0.75rem;"></i>
            </button>
            <select
              value={store.snapValue}
              onChange={(e) => store.setSnapValue(e.target.value)}
              class="input"
              style={`
                height: 2.25rem;
                border: none;
                border-radius: 0;
                font-size: var(--font-size-sm);
                opacity: ${store.snapEnabled ? "1" : "0.5"};
              `}
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
        </Show>

        {/* H-Zoom - Merged */}
        <Show when={!isCollapsed()}>
          <div class="btn-group">
            <button
              onClick={() =>
                store.setTimelineZoom(Math.max(0.25, store.timelineZoom - 0.25))
              }
              class="btn btn-secondary"
              title="Zoom Out"
            >
              <i
                class="fa-solid fa-magnifying-glass-minus"
                style="font-size: 0.75rem;"
              ></i>
            </button>
            <button
              onClick={() => store.autoZoomTimeline()}
              class="btn btn-primary"
              title="Auto-zoom to fit all tracks"
            >
              <span style="font-weight: var(--font-weight-semibold);">A</span>
            </button>
            <button
              onClick={() =>
                store.setTimelineZoom(Math.min(4, store.timelineZoom + 0.25))
              }
              class="btn btn-secondary"
              title="Zoom In"
            >
              <i
                class="fa-solid fa-magnifying-glass-plus"
                style="font-size: 0.75rem;"
              ></i>
            </button>
          </div>
        </Show>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Menu */}
        <AppMenu />
      </div>
    </nav>
  );
}
