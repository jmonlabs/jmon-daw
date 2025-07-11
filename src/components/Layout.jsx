import {
  Show,
  onMount,
  onCleanup,
  For,
  createEffect,
  createSignal,
} from "solid-js";
import { useDawStore } from "../stores/dawStore";
import { keyboardHandler } from "../utils/keyboardHandler";
import { audioEngine } from "../utils/audioEngine";

import Transport from "./Transport";
import TrackRow from "./TrackRow";
import JmonEditor from "./JmonEditor";
import StatusBar from "./StatusBar";
import NotificationSystem from "./NotificationSystem";
import MasterBus from "./MasterBus";
import NoteProperties from "./NoteProperties";
import { snapTimeToGrid } from "../utils/noteConversion";

// Loop Region Component for ruler
function LoopRegionRuler(props) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(null); // null, 'left', 'right'
  const [dragStart, setDragStart] = createSignal({
    x: 0,
    startTime: 0,
    endTime: 0,
  });

  const beatWidth = () => 80 * props.timelineZoom;
  const barWidth = () => beatWidth() * 4;
  const loopLeft = () => props.loopStart * barWidth() - props.timelineScroll;
  const loopWidth = () => (props.loopEnd - props.loopStart) * barWidth();

  const handleMouseDown = (e, type = "drag") => {
    e.stopPropagation();
    e.preventDefault();

    if (type === "drag") {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd,
      });
    } else {
      setIsResizing(type);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd,
      });
    }

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStart().x;
      const deltaTime = deltaX / barWidth();

      if (isDragging()) {
        // Move entire loop region
        const duration = dragStart().endTime - dragStart().startTime;
        let newStart = Math.max(0, dragStart().startTime + deltaTime);

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newStart * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newStart = snappedBeats / 4;
        }

        props.setLoopStart(newStart);
        props.setLoopEnd(newStart + duration);
      } else if (isResizing() === "left") {
        // Resize left edge
        let newStart = Math.max(
          0,
          Math.min(
            dragStart().endTime - 0.25,
            dragStart().startTime + deltaTime,
          ),
        );

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newStart * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newStart = snappedBeats / 4;
          newStart = Math.max(
            0,
            Math.min(dragStart().endTime - 0.25, newStart),
          );
        }

        props.setLoopStart(newStart);
      } else if (isResizing() === "right") {
        // Resize right edge
        let newEnd = Math.max(
          dragStart().startTime + 0.25,
          dragStart().endTime + deltaTime,
        );

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newEnd * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newEnd = snappedBeats / 4;
          newEnd = Math.max(dragStart().startTime + 0.25, newEnd);
        }

        props.setLoopEnd(newEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      style={`
        position: absolute;
        left: ${loopLeft()}px;
        top: 60%;
        width: ${loopWidth()}px;
        height: 35%;
        background: var(--loop-region);
        border: 2px solid var(--bulma-primary);
        border-radius: var(--radius-sm);
        z-index: 50;
        min-width: 20px;
        cursor: move;
      `}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Left resize handle */}
      <div
        style="
          position: absolute;
          left: -3px;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          background-color: #ffdd57;
          border-radius: 2px 0 0 2px;
        "
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />

      {/* Right resize handle */}
      <div
        style="
          position: absolute;
          right: -3px;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          background-color: #ffdd57;
          border-radius: 0 2px 2px 0;
        "
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />

      {/* Loop indicator text */}
      <div
        style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #333;
          font-size: 10px;
          font-weight: 600;
          pointer-events: none;
          white-space: nowrap;
        "
      >
        LOOP
      </div>
    </div>
  );
}

export default function Layout() {
  const store = useDawStore();

  // Make store available globally for audioEngine
  window.dawStore = store;

  // Make audioEngine available globally for store
  import('../utils/audioEngine').then(({ audioEngine }) => {
    window.audioEngine = audioEngine;
  });

  onMount(() => {
    keyboardHandler.init(store);
    store.loadDemo();

    // Close context menu on click outside
    const handleClick = (e) => {
      if (store.contextMenu && !e.target.closest(".context-menu")) {
        store.setContextMenu(null);
      }
    };
    document.addEventListener("click", handleClick);

    onCleanup(() => {
      document.removeEventListener("click", handleClick);
    });
  });

  onCleanup(() => {
    keyboardHandler.destroy();
  });

  // Auto-scroll to follow playback and manual navigation
  createEffect(() => {
    const playheadX = store.currentTime * 80 * store.timelineZoom * 4;
    const viewportWidth =
      window.innerWidth - 200 - (store.rightSidebarOpen ? 250 : 48);
    const currentScroll = store.timelineScroll;

    // Auto-scroll during playback OR if playhead is completely off-screen
    const isPlayheadOffScreen =
      playheadX < currentScroll || playheadX > currentScroll + viewportWidth;

    if (store.isPlaying || isPlayheadOffScreen) {
      // Center the playhead in the viewport when scrolling
      if (
        playheadX > currentScroll + viewportWidth - 100 ||
        playheadX < currentScroll + 100
      ) {
        const newScroll = Math.max(0, playheadX - viewportWidth / 2);
        store.setTimelineScroll(newScroll);
      }
    }
  });

  return (
    <div
      class="daw-container"
      style="height: 100vh; background-color: var(--color-bg-primary); display: flex; flex-direction: column;"
    >
      {/* Header - Transport Controls */}
      <header style="height: 3rem; border-bottom: 1px solid var(--color-border-primary); background-color: var(--color-bg-surface); flex-shrink: 0;">
        <Transport />
      </header>

      {/* Main Content Area */}
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        {/* Timeline Ruler - Reduced height and better integration */}
        <div
          style="
            height: 32px;
            background-color: var(--color-bg-surface);
            border-bottom: 1px solid var(--color-border-primary);
            display: flex;
            flex-shrink: 0;
          "
        >
          {/* Header spacer for track info with Add Track button */}
          <div style="width: 200px; border-right: 1px solid var(--color-border-primary); background-color: var(--color-bg-surface); display: flex; align-items: center; justify-content: center;">
            <button
              onClick={store.addTrack}
              class="button is-small is-primary"
              style="
                background-color: var(--primary-accent);
                border: 1px solid var(--primary-accent);
                color: white;
                font-size: 0.7rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-weight: 600;
              "
              title="Add new track"
            >
              <span style="font-size: 0.8rem;">+</span>
              <span>Add Track</span>
            </button>
          </div>

          {/* Timeline ruler - fixed, with scroll compensation */}
          <div
            style="flex: 1; background-color: var(--color-bg-surface); border: none; position: relative; overflow: hidden; cursor: pointer;"
            onClick={(e) => {
              // Handle click on timeline ruler to set playback position
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left + store.timelineScroll;
              const beatWidth = 80 * store.timelineZoom;
              const barWidth = beatWidth * 4;
              const clickedBars = x / barWidth;

              // Apply snap if enabled - convert to beats like in TrackLane
              let finalTime = clickedBars;
              if (store.snapEnabled) {
                const beats = clickedBars * 4; // Convert bars to beats
                const snappedBeats = snapTimeToGrid(beats, store.snapValue);
                finalTime = snappedBeats / 4; // Convert back to bars
              }

              // Set new playback position
              store.setCurrentTime(Math.max(0, finalTime));

              // If audio engine is initialized, seek to new position
              if (audioEngine.isInitialized) {
                const bars = Math.floor(finalTime);
                const beats = Math.floor((finalTime - bars) * 4);
                const ticksRaw = ((finalTime - bars) * 4 - beats) * 480;
                const ticks = Math.min(479, Math.max(0, Math.floor(ticksRaw)));
                audioEngine.setPosition(`${bars}:${beats}:${ticks}`);
              }
            }}
          >
            {(() => {
              const beatWidth = 80 * store.timelineZoom;
              const barWidth = beatWidth * 4;
              const markers = [];
              const rulerWidth = 5000;
              const visibleBars =
                Math.ceil((rulerWidth + store.timelineScroll) / barWidth) + 10;
              const startBar = Math.floor(store.timelineScroll / barWidth);

              for (
                let bar = Math.max(0, startBar);
                bar < startBar + visibleBars;
                bar++
              ) {
                // Subtract scroll to keep ruler fixed while content scrolls
                const barX = bar * barWidth - store.timelineScroll;
                if (barX > -barWidth && barX < rulerWidth) {
                  markers.push({
                    x: barX,
                    label: `${bar + 1}`,
                    type: "bar",
                  });

                  // Beat markers
                  for (let beat = 1; beat < 4; beat++) {
                    const beatX = barX + beat * beatWidth;
                    if (beatX > -beatWidth && beatX < rulerWidth) {
                      markers.push({
                        x: beatX,
                        label: `${beat + 1}`,
                        type: "beat",
                      });
                    }
                  }
                }
              }

              return markers.map((marker, i) => (
                <div
                  key={i}
                  style={`
                  position: absolute;
                  left: ${marker.x}px;
                  top: 0;
                  bottom: 0;
                  display: flex;
                  align-items: flex-start;
                  pointer-events: none;
                `}
                >
                  <div
                    style={`
                    width: ${marker.type === "bar" ? "3px" : "2px"};
                    height: ${marker.type === "bar" ? "100%" : "75%"};
                    background-color: ${marker.type === "bar" ? "var(--text-secondary)" : "var(--text-muted)"};
                    opacity: ${marker.type === "bar" ? "0.8" : "0.6"};
                  `}
                  />
                  {marker.type === "bar" && (
                    <span
                      style="
                      color: var(--text-secondary);
                      font-family: Monaco, monospace;
                      font-size: 0.75rem;
                      font-weight: 600;
                      margin-left: 4px;
                      padding-top: 2px;
                    "
                    >
                      {marker.label}
                    </span>
                  )}
                </div>
              ));
            })()}

            {/* Loop Region */}
            <Show when={store.isLooping}>
              <LoopRegionRuler
                loopStart={store.loopStart}
                loopEnd={store.loopEnd}
                timelineZoom={store.timelineZoom}
                timelineScroll={store.timelineScroll}
                setLoopStart={store.setLoopStart}
                setLoopEnd={store.setLoopEnd}
                snapEnabled={store.snapEnabled}
                snapValue={store.snapValue}
              />
            </Show>

            {/* Playhead in ruler */}
            <div
              style={`
                position: absolute;
                left: ${store.currentTime * (80 * store.timelineZoom * 4) - store.timelineScroll}px;
                top: 0;
                width: 3px;
                height: 100%;
                background-color: var(--bulma-danger);
                z-index: 600;
                pointer-events: none;
                opacity: ${store.isPlaying ? 1 : 0.7};
                box-shadow: 0 0 6px var(--bulma-danger);
              `}
            />
          </div>

          {/* Effects toggle button */}
          <Show when={!store.rightSidebarOpen}>
            <div style="width: 48px; display: flex; align-items: center; justify-content: center; background-color: var(--color-bg-surface); border-left: 1px solid var(--color-border-primary); height: 100%;">
              <button
                onClick={store.toggleRightSidebar}
                class="btn btn-secondary"
                title="Show Effects"
                style="
                    width: 1.75rem;
                    height: 1.75rem;
                    font-size: 0.75rem;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
              >
                <i class="fa-solid fa-chevron-left"></i>
              </button>
            </div>
          </Show>

          <Show when={store.rightSidebarOpen}>
            <div style="width: 250px; display: flex; align-items: center; justify-content: flex-start; padding-left: 0.5rem; background-color: var(--color-bg-surface); border-left: 1px solid var(--color-border-primary); gap: 0.5rem; height: 100%;">
              <button
                onClick={store.toggleRightSidebar}
                class="btn btn-secondary"
                title="Hide Effects"
                style="
                  width: 1.75rem;
                  height: 1.75rem;
                  font-size: 0.75rem;
                  padding: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <i class="fa-solid fa-chevron-right"></i>
              </button>
              <button
                onClick={store.toggleMasterBus}
                class={`btn ${store.masterBusOpen ? "btn-primary" : "btn-secondary"}`}
                title="Master Bus"
                style="
                  height: 1.75rem;
                  font-size: 0.7rem;
                  padding: 0 0.5rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Master
              </button>
            </div>
          </Show>
        </div>

        {/* Tracks Area */}
        <div
          class="tracks-container"
          style="flex: 1; overflow-y: auto; position: relative;"
          ref={(ref) => {
            if (ref) {
              window.tracksContainer = ref;
            }
          }}
          onWheel={(e) => {
            if (e.shiftKey) {
              // Horizontal scroll with Shift+wheel
              e.preventDefault();
              const scrollDelta = e.deltaY;
              const newScroll = Math.max(0, store.timelineScroll + scrollDelta);
              store.setTimelineScroll(newScroll);
            } else if (e.ctrlKey || e.metaKey) {
              // Zoom with Ctrl/Cmd+wheel
              e.preventDefault();
              const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
              const newZoom = Math.max(
                0.1,
                Math.min(5, store.timelineZoom + zoomDelta),
              );
              store.setTimelineZoom(newZoom);
            }
          }}
        >
          {/* Playback Progress Bar - Fixed position, covers ruler and tracks */}
          <div
            class="playback-progress-bar"
            style={`
              position: absolute;
              top: -80px;
              left: ${200 + store.currentTime * (80 * store.timelineZoom * 4) - store.timelineScroll}px;
              width: 3px;
              height: calc(100% + 120px);
              background-color: #ff4444;
              z-index: 500;
              pointer-events: none;
              opacity: ${store.isPlaying ? 1 : 0.7};
              transition: opacity 0.2s ease;
              box-shadow: 0 0 6px rgba(255, 68, 68, 0.7);
            `}
          />

          <For each={store.tracks}>
            {(track, index) => {
              // Make zoom reactive
              const beatWidth = () => 80 * store.timelineZoom;
              const barWidth = () => 80 * store.timelineZoom * 4;

              // Generate grid markers for tracks
              const gridMarkers = () => {
                const markers = [];
                const currentBarWidth = barWidth();
                const currentBeatWidth = beatWidth();
                const totalWidth = 5000;
                const visibleBars =
                  Math.ceil(
                    (totalWidth + store.timelineScroll) / currentBarWidth,
                  ) + 10;
                const startBar = Math.floor(
                  store.timelineScroll / currentBarWidth,
                );

                for (
                  let bar = Math.max(0, startBar);
                  bar < startBar + visibleBars;
                  bar++
                ) {
                  const barX = bar * currentBarWidth;
                  if (barX >= 0 && barX < totalWidth) {
                    markers.push({ x: barX, type: "bar" });

                    // Beat markers
                    for (let beat = 1; beat < 4; beat++) {
                      const beatX = barX + beat * currentBeatWidth;
                      if (beatX >= 0 && beatX < totalWidth) {
                        markers.push({ x: beatX, type: "beat" });
                      }
                    }
                  }
                }

                return markers;
              };

              return (
                <div
                  style="
                  border-bottom: 2px solid var(--border-color);
                  position: relative;
                "
                >
                  <TrackRow
                    track={track}
                    index={index()}
                    beatWidth={beatWidth}
                    barWidth={barWidth}
                    timelineScroll={store.timelineScroll}
                    gridMarkers={gridMarkers()}
                  />
                </div>
              );
            }}
          </For>

          {/* Empty state with Add Track button */}
          {store.tracks.length === 0 && (
            <div
              style="
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 1.1rem;
                gap: 1rem;
              "
            >
              <div>No tracks loaded. Add your first track to get started.</div>
              <button
                onClick={store.addTrack}
                class="button is-primary"
                style="background-color: var(--primary-accent); border: 2px solid var(--secondary-accent); color: var(--text-inverse);"
              >
                <span class="icon is-small">
                  <i class="fa-solid fa-plus"></i>
                </span>
                <span>Add Track</span>
              </button>
            </div>
          )}
        </div>



        {/* Effect Parameter Editor - Overlay */}
        <Show when={store.selectedEffect}>
          <div
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 400px;
              min-height: 300px;
              max-height: 80vh;
              background-color: var(--color-bg-modal);
              color: var(--text-primary);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              z-index: 300;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            "
          >
            <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">
                {store.selectedEffect?.name || "Effect"} Parameters
              </span>
              <button
                onClick={store.closeEffectEditor}
                class="button is-dark is-small"
                title="Close"
                style="border: none;"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>

            <div style="flex: 1; padding: 1rem; overflow-y: auto;">
              {/* Effect Parameters Content */}
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                {/* Effect/Synth Type */}
                <div>
                  <label style="color: var(--text-primary); font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                    {store.selectedEffect?.type === "synth"
                      ? "Synth Type"
                      : "Effect Type"}
                  </label>
                  <div class="select" style="width: 100%;">
                    <select
                      style="width: 100%; background-color: var(--surface-bg); color: var(--text-primary); border-color: var(--border-color);"
                      value={store.selectedEffect?.name || ""}
                      onChange={(e) => {
                        const newEffect = {
                          ...store.selectedEffect,
                          name: e.target.value,
                        };
                        store.setSelectedEffect(newEffect);
                      }}
                    >
                      <Show when={store.selectedEffect?.type === "synth"}>
                        <option value="Synth">Basic Synth</option>
                        <option value="PolySynth">Poly Synth</option>
                        <option value="MonoSynth">Mono Synth</option>
                        <option value="AMSynth">AM Synth</option>
                        <option value="FMSynth">FM Synth</option>
                        <option value="DuoSynth">Duo Synth</option>
                        <option value="PluckSynth">Pluck Synth</option>
                        <option value="NoiseSynth">Noise Synth</option>
                        <option value="MetalSynth">Metal Synth</option>
                        <option value="MembraneSynth">Membrane Synth</option>
                        <option value="Sampler">Sampler</option>
                      </Show>
                      <Show when={store.selectedEffect?.type === "effect"}>
                        <option value="Reverb">Reverb</option>
                        <option value="Delay">Delay</option>
                        <option value="Chorus">Chorus</option>
                        <option value="Distortion">Distortion</option>
                        <option value="Filter">Filter</option>
                        <option value="Compressor">Compressor</option>
                        <option value="PitchShift">Pitch Shift</option>
                        <option value="Phaser">Phaser</option>
                        <option value="Tremolo">Tremolo</option>
                        <option value="Vibrato">Vibrato</option>
                      </Show>
                    </select>
                  </div>
                </div>

                {/* Common Parameters */}
                <Show when={store.selectedEffect?.type === "effect"}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Wet/Dry Mix
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={store.effectParams?.wet || 0.5}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "wet",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.wet || 0.5) * 100)}%
                      </span>
                    </div>
                  </div>
                </Show>

                <Show when={store.selectedEffect?.type === "synth"}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Volume
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={store.effectParams?.volume || 1}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "volume",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.volume || 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </Show>

                {/* Effect-specific parameters based on type */}
                <Show when={store.selectedEffect?.name === "Reverb"}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Room Size
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={store.effectParams?.roomSize || 0.7}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "roomSize",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round(
                          (store.effectParams?.roomSize || 0.7) * 100,
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Decay Time
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={store.effectParams?.decay || 2.5}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "decay",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {(store.effectParams?.decay || 2.5).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </Show>

                <Show when={store.selectedEffect?.name === "Delay"}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Delay Time
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0.01"
                        max="1"
                        step="0.01"
                        value={store.effectParams?.delayTime || 0.25}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "delayTime",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round(
                          (store.effectParams?.delayTime || 0.25) * 1000,
                        )}
                        ms
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Feedback
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0"
                        max="0.95"
                        step="0.01"
                        value={store.effectParams?.feedback || 0.3}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "feedback",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round(
                          (store.effectParams?.feedback || 0.3) * 100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </Show>

                <Show when={store.selectedEffect?.name === "Filter"}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Cutoff Frequency
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="20"
                        max="20000"
                        step="1"
                        value={store.effectParams?.frequency || 1000}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "frequency",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 60px;">
                        {Math.round(store.effectParams?.frequency || 1000)}Hz
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                      Resonance
                    </label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={store.effectParams?.Q || 1}
                        style="flex: 1;"
                        onInput={(e) =>
                          store.updateEffectParam(
                            "Q",
                            parseFloat(e.target.value),
                          )
                        }
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {(store.effectParams?.Q || 1).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            <div style="padding: 1rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              {/* Delete button - Only for effects */}
              <Show when={store.selectedEffect?.type === "effect"}>
                <button
                  onClick={() => {
                    const effect = store.selectedEffect;
                    if (effect && effect.trackId && effect.effectIndex !== undefined) {
                      // Find the track and remove the effect
                      const track = store.tracks.find(t => t.id === effect.trackId);
                      if (track) {
                        const updatedEffects = track.effects.filter(
                          (_, i) => i !== effect.effectIndex
                        );
                        store.updateTrack(effect.trackId, { effects: updatedEffects });
                        store.closeEffectEditor();
                      }
                    }
                  }}
                  class="button is-danger"
                  style="border: none;"
                  title="Delete Effect"
                >
                  <span class="icon">
                    <i class="fa-solid fa-trash"></i>
                  </span>
                  <span>Delete</span>
                </button>
              </Show>
              
              <div style="display: flex; gap: 0.5rem;">
                <button
                  onClick={store.closeEffectEditor}
                  class="button is-dark"
                  style="border: none;"
                >
                  Cancel
                </button>
                <button
                  onClick={store.saveEffectChanges}
                  class="button is-primary"
                  style="border: none;"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Show>

        {/* Backdrop for effect editor */}
        <Show when={store.selectedEffect}>
          <div
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 250;
            "
            onClick={store.closeEffectEditor}
          />
        </Show>

        {/* Master Bus Panel - Overlay */}
        <Show when={store.masterBusOpen}>
          <MasterBus />
        </Show>

        {/* JMON Editor Panel - Overlay */}
        <Show when={store.jmonEditorOpen}>
          <div
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 400px;
              height: 100%;
              background-color: var(--color-bg-modal);
              color: var(--text-primary);
              border-right: 1px solid var(--border-color);
              display: flex;
              flex-direction: column;
              z-index: 100;
              box-shadow: 2px 0 10px rgba(0,0,0,0.3);
            "
          >
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-primary); font-weight: 600;">JMON Editor</span>
              <button
                onClick={store.toggleJmonEditor}
                class="button is-dark is-small"
                title="Close"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>

            <div style="flex: 1; overflow: hidden;">
              <JmonEditor />
            </div>
          </div>
        </Show>

        {/* Global Context Menu */}
        <Show when={store.contextMenu && store.contextMenu.type === "note"}>
          <div
            class="context-menu dropdown-content has-background-dark"
            style={`
              position: fixed;
              left: ${store.contextMenu.x}px;
              top: ${store.contextMenu.y}px;
              z-index: 9999;
              border: 1px solid #4b5563;
              border-radius: 4px;
              min-width: 8rem;
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <a
              class="dropdown-item has-text-light"
              onClick={() => {
                // Copy note to clipboard
                const trackIndex = store.tracks.findIndex(
                  (t) => t.id === store.contextMenu.trackId,
                );
                if (trackIndex !== -1) {
                  const note =
                    store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
                  store.setClipboard({ note, operation: "copy" });
                }
                store.setContextMenu(null);
              }}
              style="cursor: pointer;"
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-copy"></i>
              </span>
              Copier
            </a>
            <a
              class="dropdown-item has-text-light"
              onClick={() => {
                // Cut note to clipboard
                const trackIndex = store.tracks.findIndex(
                  (t) => t.id === store.contextMenu.trackId,
                );
                if (trackIndex !== -1) {
                  const note =
                    store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
                  store.setClipboard({ note, operation: "cut" });
                  const updatedNotes = store.tracks[trackIndex].notes.filter(
                    (_, i) => i !== store.contextMenu.noteIndex,
                  );
                  store.updateTrack(store.contextMenu.trackId, {
                    notes: updatedNotes,
                  });
                }
                store.setContextMenu(null);
              }}
              style="cursor: pointer;"
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-cut"></i>
              </span>
              Couper
            </a>
            <a
              class="dropdown-item has-text-light"
              onClick={() => {
                // Paste note from clipboard
                if (store.clipboard && store.clipboard.note) {
                  const trackIndex = store.tracks.findIndex(
                    (t) => t.id === store.contextMenu.trackId,
                  );
                  if (trackIndex !== -1) {
                    const pastedNote = { ...store.clipboard.note };
                    const updatedNotes = [
                      ...store.tracks[trackIndex].notes,
                      pastedNote,
                    ];
                    store.updateTrack(store.contextMenu.trackId, {
                      notes: updatedNotes,
                    });
                  }
                }
                store.setContextMenu(null);
              }}
              style={`cursor: pointer; ${!store.clipboard ? "opacity: 0.5;" : ""}`}
              disabled={!store.clipboard}
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-paste"></i>
              </span>
              Coller
            </a>
            <a
              class="dropdown-item has-text-light"
              onClick={() => {
                // Duplicate note directly to the right
                const trackIndex = store.tracks.findIndex(
                  (t) => t.id === store.contextMenu.trackId,
                );
                if (trackIndex !== -1) {
                  const originalNote =
                    store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
                  const duplicatedNote = {
                    ...originalNote,
                    time: originalNote.time + originalNote.duration,
                  };
                  const updatedNotes = [
                    ...store.tracks[trackIndex].notes,
                    duplicatedNote,
                  ];
                  store.updateTrack(store.contextMenu.trackId, {
                    notes: updatedNotes,
                  });
                }
                store.setContextMenu(null);
              }}
              style="cursor: pointer;"
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-clone"></i>
              </span>
              Dupliquer
            </a>
            <hr class="dropdown-divider" />
            <a
              class="dropdown-item has-text-light"
              onClick={() => {
                // Open note properties dialog
                const trackIndex = store.tracks.findIndex(
                  (t) => t.id === store.contextMenu.trackId,
                );
                if (trackIndex !== -1) {
                  const note = store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
                  store.setEditingNote(note);
                  store.setEditingNoteIndex(store.contextMenu.noteIndex);
                  store.setEditingTrackId(store.contextMenu.trackId);
                  store.setShowNoteProperties(true);
                }
                store.setContextMenu(null);
              }}
              style="cursor: pointer;"
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-cog"></i>
              </span>
              Properties
            </a>
            <hr class="dropdown-divider" />
            <a
              class="dropdown-item has-text-danger"
              onClick={() => {
                // Delete note
                const trackIndex = store.tracks.findIndex(
                  (t) => t.id === store.contextMenu.trackId,
                );
                if (trackIndex !== -1) {
                  const updatedNotes = store.tracks[trackIndex].notes.filter(
                    (_, i) => i !== store.contextMenu.noteIndex,
                  );
                  store.updateTrack(store.contextMenu.trackId, {
                    notes: updatedNotes,
                  });
                }
                store.setContextMenu(null);
              }}
              style="cursor: pointer;"
            >
              <span class="icon is-small mr-1">
                <i class="fa-solid fa-trash"></i>
              </span>
              Supprimer
            </a>
          </div>
        </Show>
      </main>

      {/* Status Bar */}
      <StatusBar />

      {/* Notification System */}
      <NotificationSystem 
        notifications={store.notifications}
        removeNotification={store.removeNotification}
      />

      {/* Note Properties Dialog */}
      <NoteProperties
        note={() => store.editingNote}
        isOpen={() => store.showNoteProperties}
        onClose={() => store.setShowNoteProperties(false)}
        onSave={store.saveNoteProperties}
        trackId={() => store.editingTrackId}
      />
    </div>
  );
}
