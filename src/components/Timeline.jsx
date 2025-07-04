import { For, createSignal, onMount, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { getTrackPosition } from '../utils/trackLayout';
import TrackLane from './TrackLane';

export default function Timeline() {
  const store = useDawStore();
  const [timelineRef, setTimelineRef] = createSignal();
  const [rulerRef, setRulerRef] = createSignal();

  // Timeline measurements - get time signature from JMON data
  const getTimeSignature = () => {
    const timeSignature = store.jmonData?.timeSignature || '4/4';
    const [beatsPerBar, beatValue] = timeSignature.split('/').map(Number);
    return { beatsPerBar, beatValue };
  };
  
  const beatWidth = () => 80 * store.timelineZoom; // Pixels per beat
  const barWidth = () => {
    const { beatsPerBar } = getTimeSignature();
    return beatWidth() * beatsPerBar; // Beats per bar from time signature
  };

  // Generate ruler markers with proper graduations
  const generateRulerMarkers = () => {
    const markers = [];
    const rulerWidth = timelineRef()?.clientWidth || 2000;
    const visibleBars = Math.ceil((rulerWidth + store.timelineScroll) / barWidth()) + 2;
    const startBar = Math.floor(store.timelineScroll / barWidth());
    const { beatsPerBar } = getTimeSignature();
    
    for (let bar = Math.max(0, startBar); bar < startBar + visibleBars; bar++) {
      const barX = bar * barWidth();
      
      // Bar markers (measures) - main divisions
      markers.push({
        x: barX,
        type: 'bar',
        label: `${bar + 1}`,
        height: '100%'
      });
      
      // Beat markers - based on time signature
      for (let beat = 1; beat < beatsPerBar; beat++) {
        const beatX = barX + beat * beatWidth();
        markers.push({
          x: beatX,
          type: 'beat',
          label: `${beat + 1}`,
          height: '75%'
        });
      }
      
      // Show finer subdivisions based on zoom
      if (store.timelineZoom >= 1.0) {
        // 8th note subdivisions
        for (let beat = 0; beat < 4; beat++) {
          for (let eighth = 1; eighth < 2; eighth++) {
            const eighthX = barX + beat * beatWidth() + eighth * (beatWidth() / 2);
            markers.push({
              x: eighthX,
              type: '8th',
              height: '50%'
            });
          }
        }
      }
      
      if (store.timelineZoom >= 2.0) {
        // 16th note subdivisions
        for (let beat = 0; beat < 4; beat++) {
          for (let sixteenth = 1; sixteenth < 4; sixteenth++) {
            if (sixteenth === 2) continue; // Skip 8th note position
            const sixteenthX = barX + beat * beatWidth() + sixteenth * (beatWidth() / 4);
            markers.push({
              x: sixteenthX,
              type: '16th',
              height: '33%'
            });
          }
        }
      }
    }
    
    return markers;
  };

  // Handle timeline click for playhead positioning
  const handleTimelineClick = (e) => {
    const rect = timelineRef().getBoundingClientRect();
    const x = e.clientX - rect.left + store.timelineScroll;
    const clickedTime = x / barWidth(); // Time in bars
    
    if (e.shiftKey) {
      // Set loop points with Shift+click
      if (clickedTime < store.loopStart) {
        store.setLoopStart(clickedTime);
      } else {
        store.setLoopEnd(clickedTime);
      }
    } else {
      // Set playhead position
      store.setCurrentTime(clickedTime);
    }
  };

  // Handle zoom and scroll
  const handleWheel = (e) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Zoom with Ctrl/Cmd + scroll
      const zoomDelta = -e.deltaY / 1000;
      const newZoom = Math.max(0.25, Math.min(4, store.timelineZoom + zoomDelta));
      store.setTimelineZoom(newZoom);
    } else {
      // Horizontal scroll
      const newScroll = Math.max(0, store.timelineScroll + e.deltaX);
      store.setTimelineScroll(newScroll);
    }
  };

  // Playhead position
  const playheadPosition = () => {
    return store.currentTime * barWidth() - store.timelineScroll;
  };

  // Format time as bars:beats:ticks
  const formatTime = (bars) => {
    const { beatsPerBar } = getTimeSignature();
    const totalBars = Math.floor(bars);
    const beats = Math.floor((bars - totalBars) * beatsPerBar);
    const ticks = Math.floor(((bars - totalBars) * beatsPerBar - beats) * 480);
    return `${totalBars + 1}:${beats + 1}:${ticks.toString().padStart(3, '0')}`;
  };

  return (
    <div style="height: 100%; display: flex; flex-direction: column;">
      
      {/* Timeline Ruler */}
      <div 
        ref={setRulerRef}
        class="timeline-ruler"
        style="
          height: 2.5rem; 
          background-color: #2b2b2b; 
          border-bottom: 1px solid #404040; 
          position: relative; 
          overflow: hidden;
          user-select: none;
        "
      >
        {/* Ruler Content - moves with scroll */}
        <div style={`transform: translateX(${-store.timelineScroll}px); height: 100%; position: relative;`}>
          
          {/* Ruler Markers */}
          <For each={generateRulerMarkers()}>
            {(marker) => {
              const getColor = (type) => {
                switch (type) {
                  case 'bar': return '#e5e7eb';
                  case 'beat': return '#9ca3af';
                  case '8th': return '#6b7280';
                  case '16th': return '#4b5563';
                  default: return '#9ca3af';
                }
              };

              const getOpacity = (type) => {
                switch (type) {
                  case 'bar': return '1';
                  case 'beat': return '0.7';
                  case '8th': return '0.5';
                  case '16th': return '0.3';
                  default: return '1';
                }
              };

              return (
                <div
                  style={`
                    position: absolute;
                    left: ${marker.x}px;
                    top: 0;
                    height: ${marker.height};
                    display: flex;
                    align-items: flex-end;
                    pointer-events: none;
                  `}
                >
                  {/* Ruler Tick */}
                  <div 
                    style={`
                      width: 1px;
                      height: 100%;
                      background-color: ${getColor(marker.type)};
                      opacity: ${getOpacity(marker.type)};
                    `}
                  />
                  
                  {/* Bar Numbers */}
                  {marker.type === 'bar' && (
                    <span 
                      class="has-text-light is-size-7 ml-1"
                      style={`
                        color: ${getColor(marker.type)};
                        font-family: 'Monaco', 'Menlo', monospace;
                        font-weight: 600;
                        line-height: 1;
                        padding-bottom: 2px;
                      `}
                    >
                      {marker.label}
                    </span>
                  )}
                  
                  {/* Beat Numbers */}
                  {marker.type === 'beat' && store.timelineZoom >= 1.5 && (
                    <span 
                      class="has-text-grey-light is-size-7 ml-1"
                      style={`
                        color: ${getColor(marker.type)};
                        font-family: 'Monaco', 'Menlo', monospace;
                        font-weight: 400;
                        line-height: 1;
                        padding-bottom: 2px;
                      `}
                    >
                      {marker.label}
                    </span>
                  )}
                </div>
              );
            }}
          </For>

          {/* Playhead in ruler */}
          <div
            style={`
              position: absolute;
              left: ${playheadPosition()}px;
              top: 0;
              width: 2px;
              height: 100%;
              background-color: #ff3860;
              z-index: 10;
              pointer-events: none;
            `}
          />
        </div>

        {/* Time Display - Fixed position */}
        <div 
          class="has-background-dark has-text-light px-2 py-1"
          style="
            position: absolute;
            top: 0.25rem;
            right: 0.5rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.75rem;
            border: 1px solid #404040;
            z-index: 15;
          "
        >
          {formatTime(store.currentTime)}
        </div>
      </div>

      {/* Timeline Content Area */}
      <div 
        ref={setTimelineRef}
        class="timeline-content"
        style="
          flex: 1;
          position: relative;
          overflow: auto;
          background-color: #1a1a1a;
        "
        onClick={handleTimelineClick}
        onWheel={handleWheel}
      >

        {/* Track Lanes */}
        <div class="track-lanes" style="position: relative;">
          <For each={store.tracks}>
            {(track, index) => {
              // Use centralized positioning logic
              const position = getTrackPosition(store.tracks, index());
              
              return (
                <div style={`position: absolute; top: ${position.top}px; left: 0; right: 0; height: ${position.height}px;`}>
                  <TrackLane 
                    track={track} 
                    index={index()} 
                    beatWidth={beatWidth()} 
                    barWidth={barWidth()}
                    timelineScroll={store.timelineScroll}
                    gridMarkers={generateRulerMarkers()}
                    minHeight={80}
                    trackHeight={position.height}
                  />
                </div>
              );
            }}
          </For>

          {/* Empty state */}
          {store.tracks.length === 0 && (
            <div 
              class="is-flex is-justify-content-center is-align-items-center has-text-grey-light"
              style="height: 15rem; padding: 2rem; position: relative; z-index: 10;"
            >
              <div class="has-text-centered">
                <p class="is-size-5 mb-2">No tracks yet</p>
                <p class="is-size-6 mb-3">Click the track list icon to add tracks or load the demo</p>
                <button
                  onClick={store.loadDemo}
                  class="button is-primary"
                  style="z-index: 20; position: relative;"
                >
                  <span class="icon is-small">
                    <i class="fas fa-play"></i>
                  </span>
                  <span>Load Demo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loop Region */}
        {store.isLooping && (
          <div
            class="loop-region"
            style={`
              position: absolute;
              top: 0;
              bottom: 0;
              left: ${store.loopStart * barWidth() - store.timelineScroll}px;
              width: ${(store.loopEnd - store.loopStart) * barWidth()}px;
              background-color: rgba(255, 221, 87, 0.1);
              border-left: 2px solid #ffdd57;
              border-right: 2px solid #ffdd57;
              z-index: 5;
              pointer-events: none;
            `}
          />
        )}

        {/* Playhead */}
        <div
          class="playhead-main"
          style={`
            position: absolute;
            left: ${playheadPosition()}px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: #ff3860;
            z-index: 20;
            pointer-events: none;
            box-shadow: 0 0 4px rgba(255, 56, 96, 0.5);
          `}
        />
      </div>

    </div>
  );
}