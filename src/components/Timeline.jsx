import { For, Show, createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { getTrackPosition } from '../utils/trackLayout';
import TrackLane from './TrackLane';

// Loop Region Component for draggable/resizable loop bounds
function LoopRegion(props) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(null); // null, 'left', 'right'
  const [dragStart, setDragStart] = createSignal({ x: 0, startTime: 0, endTime: 0 });
  
  const loopLeft = () => {
    const left = props.loopStart * props.barWidth() - props.timelineScroll;
    console.log(`🔄 Loop Left: start=${props.loopStart}, barWidth=${props.barWidth()}, scroll=${props.timelineScroll}, left=${left}px`);
    return left;
  };
  
  const loopWidth = () => {
    const width = (props.loopEnd - props.loopStart) * props.barWidth();
    console.log(`🔄 Loop Width: start=${props.loopStart}, end=${props.loopEnd}, barWidth=${props.barWidth()}, width=${width}px`);
    return width;
  };
  
  const handleMouseDown = (e, type = 'drag') => {
    e.stopPropagation();
    e.preventDefault();
    
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd
      });
    } else {
      setIsResizing(type);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd
      });
    }
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStart().x;
      const deltaTime = deltaX / props.barWidth();
      
      if (isDragging()) {
        // Move entire loop region
        const duration = dragStart().endTime - dragStart().startTime;
        const newStart = Math.max(0, dragStart().startTime + deltaTime);
        props.setLoopStart(newStart);
        props.setLoopEnd(newStart + duration);
      } else if (isResizing() === 'left') {
        // Resize left edge
        const newStart = Math.max(0, Math.min(dragStart().endTime - 0.25, dragStart().startTime + deltaTime));
        props.setLoopStart(newStart);
      } else if (isResizing() === 'right') {
        // Resize right edge
        const newEnd = Math.max(dragStart().startTime + 0.25, dragStart().endTime + deltaTime);
        props.setLoopEnd(newEnd);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  console.log(`🔄 Rendering LoopRegion: start=${props.loopStart}, end=${props.loopEnd}, isLooping=true`);
  
  return (
    <div
      class="loop-region"
      style={`
        position: absolute;
        left: ${loopLeft()}px;
        top: 60%;
        width: ${loopWidth()}px;
        height: 35%;
        background: rgba(255, 0, 0, 0.8);
        border: 3px solid #ff0000;
        border-radius: 4px;
        cursor: move;
        z-index: 50;
        box-shadow: 0 2px 8px rgba(255, 221, 87, 0.3);
        min-width: 20px;
      `}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
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
          background-color: var(--primary-accent);
          border-radius: 2px 0 0 2px;
        "
        onMouseDown={(e) => handleMouseDown(e, 'left')}
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
          background-color: var(--primary-accent);
          border-radius: 0 2px 2px 0;
        "
        onMouseDown={(e) => handleMouseDown(e, 'right')}
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

export default function Timeline() {
  const store = useDawStore();
  const [timelineRef, setTimelineRef] = createSignal();
  const [rulerRef, setRulerRef] = createSignal();
  
  // Force reactivity tracking for loop state - test multiple approaches
  createEffect(() => {
    // Test all store properties to see which ones are reactive
    console.log(`🔄 Timeline Effect: bpm=${store.bpm}, isPlaying=${store.isPlaying}, isLooping=${store.isLooping}`);
    console.log(`🔄 Timeline Effect: loopStart=${store.loopStart}, loopEnd=${store.loopEnd}`);
    console.log(`🔄 Timeline Effect: tracks.length=${store.tracks.length}`);
  });

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
          background-color: var(--surface-bg); 
          border-bottom: 1px solid var(--border-color); 
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
                      width: ${marker.type === 'bar' ? '2px' : marker.type === 'beat' ? '1.5px' : '1px'};
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

          {/* Loop Region in Ruler - Debug Test */}
          {(() => {
            // Direct debug to see what's happening
            console.log(`🔄 Timeline DEBUG: isLooping=${store.isLooping}, typeof=${typeof store.isLooping}`);
            
            // Try both approaches
            if (store.isLooping) {
              console.log(`🔄 Timeline: Should render loop region`);
              return (
                <div 
                  style="position: absolute; left: 0px; top: 0; width: 200px; height: 20px; background: red; z-index: 100; border: 3px solid yellow;"
                >
                  TEST LOOP REGION
                </div>
              );
            } else {
              console.log(`🔄 Timeline: Not rendering loop region`);
              return null;
            }
          })()}

          {/* Playhead in ruler */}
          <div
            style={`
              position: absolute;
              left: ${playheadPosition()}px;
              top: 0;
              width: 2px;
              height: 100%;
              background-color: var(--danger-accent);
              z-index: 15;
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
            border: 1px solid var(--border-color);
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
          background-color: var(--primary-bg);
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


        {/* Playhead */}
        <div
          class="playhead-main"
          style={`
            position: absolute;
            left: ${playheadPosition()}px;
            top: 0;
            bottom: 0;
            width: 2px;
            background-color: var(--danger-accent);
            z-index: 20;
            pointer-events: none;
            box-shadow: 0 0 4px rgba(255, 56, 96, 0.5);
          `}
        />
      </div>

    </div>
  );
}