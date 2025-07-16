import { Show } from "solid-js";
import LoopRegionRuler from "./LoopRegionRuler.jsx";
import { snapTimeToGrid } from "../utils/noteConversion";
import { audioEngine } from "../utils/audioEngine";

export default function TimelineRuler({ store }) {
  return (
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
  );
}
