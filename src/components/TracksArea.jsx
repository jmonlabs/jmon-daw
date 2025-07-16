import { For, Show, createSignal, onMount } from "solid-js";
import TrackRow from "./TrackRow.jsx";
import ModulationTimeline from "./ModulationTimeline.jsx";
import AutomationChannelControls from "./automation/AutomationChannelControls.jsx";
import AutomationControls from "./automation/AutomationControls.jsx";

export default function TracksArea({ store }) {
  const [scrollLeft, setScrollLeft] = createSignal(0);
  
  return (
    <div
      class="tracks-container"
      style="flex: 1; overflow-y: auto; position: relative;"
      ref={(ref) => {
        if (ref) {
          window.tracksContainer = ref;
          // Update scroll signal when scroll changes
          ref.addEventListener('scroll', (e) => {
            setScrollLeft(ref.scrollLeft);
          });
        }
      }}
      onWheel={(e) => {
        if (e.shiftKey) {
          // Horizontal scroll with Shift+wheel
          e.preventDefault();
          const scrollDelta = e.deltaY;
          const newScroll = Math.max(0, window.tracksContainer.scrollLeft + scrollDelta);
          window.tracksContainer.scrollLeft = newScroll;
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
            <>
              {/* Track Row */}
              <div
                style="
                border-bottom: 2px solid var(--border-color);
                position: relative;
                z-index: 1;
              "
              >
                <TrackRow
                  track={track}
                  index={index()}
                  beatWidth={beatWidth}
                  barWidth={barWidth}
                  timelineScroll={scrollLeft()}
                  gridMarkers={gridMarkers()}
                />
              </div>
              
              {/* Automation Lane - Only show if enabled for this track */}
              <Show when={track.automation?.visible}>
                <div 
                  style="
                    background: #f8f9fa; 
                    border-bottom: 2px solid var(--border-color);
                    display: flex;
                    flex-direction: row;
                    position: relative;
                  "
                >
                  {/* Left column - Automation controls (fixed, no scroll) */}
                  <div
                    style="
                      width: 200px;
                      background: #f8f9fa;
                      border-right: 1px solid var(--border-color);
                      flex-shrink: 0;
                    "
                  >
                    <AutomationControls 
                      track={track}
                      store={store}
                    />
                  </div>
                  
                  {/* Automation timeline (scrollable) */}
                  <div 
                    class="automation-timeline-container" 
                    style="
                      flex: 1;
                      overflow-x: auto;
                      overflow-y: hidden;
                      position: relative;
                    "
                    onScroll={(e) => {
                      if (window._syncingTrackScroll) return;
                      window._syncingTrackScroll = true;
                      const scrollLeft = e.target.scrollLeft;
                      // Sync all track lane sections
                      document.querySelectorAll('.track-lane-section').forEach((el) => {
                        if (Math.abs(el.scrollLeft - scrollLeft) > 1) {
                          el.scrollLeft = scrollLeft;
                        }
                      });
                      // Sync all automation timeline containers
                      document.querySelectorAll('.automation-timeline-container').forEach((el) => {
                        if (el !== e.target && Math.abs(el.scrollLeft - scrollLeft) > 1) {
                          el.scrollLeft = scrollLeft;
                        }
                      });
                      window._syncingTrackScroll = false;
                    }}
                  >
                    <ModulationTimeline
                      trackId={track.id}
                      beatWidth={beatWidth()}
                      trackLength={track.length || 16}
                      timelineScroll={scrollLeft()}
                    />
                  </div>
                  
                  {/* Right column - Automation controls (fixed) */}
                  <div
                    style="
                      width: 250px;
                      background: #f8f9fa;
                      border-left: 1px solid var(--border-color);
                      flex-shrink: 0;
                    "
                  >
                    <AutomationChannelControls 
                      track={track}
                      store={store}
                    />
                  </div>
                </div>
              </Show>
            </>
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
  );
}
