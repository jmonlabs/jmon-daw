import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { modulationTypes, createDefaultChannel } from './automation/automationConfig';
import { xToTime, yToValue, clamp } from './automation/automationUtils';
import { audioEngine } from '../utils/audioEngine';
import './automation/ModulationTimeline.css';

const ModulationTimeline = (props) => {
  const dawStore = useDawStore();
  const [dragState, setDragState] = createSignal(null);

  // Get track data reactively
  const track = createMemo(() => 
    dawStore.tracks.find(t => t.id === props.trackId)
  );

  const automationChannels = createMemo(() => 
    track()?.automation?.channels || []
  );

  // Add automation point
  const addAutomationPoint = (channelId, time, value) => {
    dawStore.addAutomationPoint(props.trackId, channelId, time, value);
    updateAudioEngineAutomation();
  };

  // Remove automation point
  const removeAutomationPoint = (channelId, pointIndex) => {
    dawStore.removeAutomationPoint(props.trackId, channelId, pointIndex);
    updateAudioEngineAutomation();
  };

  // Update audio engine automation when changes are made
  const updateAudioEngineAutomation = () => {
    if (audioEngine.isInitialized && track()) {
      const currentTime = audioEngine.getCurrentTime ? audioEngine.getCurrentTime() : 0;
      const duration = props.trackLength || 16;
      audioEngine.updateTrackAutomation(props.trackId, track(), currentTime, duration);
    }
  };

  // Handle timeline click to add automation point
  const handleTimelineClick = (event, channel) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click position to time, accounting for scroll
    const timelineX = x + (props.timelineScroll || 0);
    const time = timelineX / (props.beatWidth * 4);
    
    // Convert Y to value (inverted because SVG Y increases downward)
    const channelHeight = 80; // Fixed height per channel
    const normalizedY = 1 - (y / channelHeight); // Invert Y and normalize to 0-1
    const value = channel.range[0] + (normalizedY * (channel.range[1] - channel.range[0]));
    
    // Clamp values to range
    const clampedValue = clamp(value, channel.range[0], channel.range[1]);
    const clampedTime = clamp(time, 0, props.trackLength || 16);
    
    console.log(`🎛️ Adding automation point: time=${clampedTime.toFixed(2)}, value=${clampedValue.toFixed(0)}, beatWidth=${props.beatWidth}`);
    
    addAutomationPoint(channel.id, clampedTime, clampedValue);
  };

  // Handle point drag
  const handlePointMouseDown = (event, channel, pointIndex) => {
    event.preventDefault();
    event.stopPropagation();
    
    setDragState({
      channelId: channel.id,
      pointIndex,
      startX: event.clientX,
      startY: event.clientY,
      originalPoint: { ...channel.points[pointIndex] }
    });
  };

  const handleMouseMove = (event) => {
    const drag = dragState();
    if (!drag) return;
    
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    
    const channel = automationChannels().find(c => c.id === drag.channelId);
    if (!channel) return;
    
    const newTime = drag.originalPoint.time + (deltaX / (props.beatWidth * 4));
    const channelHeight = 80;
    const newValue = drag.originalPoint.value - (deltaY / channelHeight) * (channel.range[1] - channel.range[0]);
    
    // Clamp values
    const clampedTime = clamp(newTime, 0, props.trackLength || 16);
    const clampedValue = clamp(newValue, channel.range[0], channel.range[1]);
    
    // Update point
    const updatedPoints = [...channel.points];
    updatedPoints[drag.pointIndex] = { time: clampedTime, value: clampedValue };
    
    // Update store
    dawStore.updateAutomationChannel(props.trackId, drag.channelId, {
      ...channel,
      points: updatedPoints
    });
    
    // Update audio engine during drag for real-time feedback
    updateAudioEngineAutomation();
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Handle right-click to remove point
  const handlePointRightClick = (event, channel, pointIndex) => {
    event.preventDefault();
    if (channel.points.length > 2) { // Keep minimum 2 points
      removeAutomationPoint(channel.id, pointIndex);
    }
  };

  // Event listeners
  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  // Calculate timeline width based on track length and beat width
  const timelineWidth = () => Math.max(800, (props.trackLength || 16) * props.beatWidth * 4);

  return (
    <div 
      class="modulation-timeline"
      style="
        height: 100%; 
        position: relative;
        background: var(--primary-bg);
        display: flex;
        flex-direction: column;
      "
    >
      <Show 
        when={automationChannels().length > 0}
        fallback={
          <div 
            class="empty-state"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: var(--text-muted);
            "
          >
            <div style="text-align: center;">
              <div style="font-size: 1.2rem; margin-bottom: 8px; opacity: 0.5;">
                <i class="fas fa-wave-square" />
              </div>
              <p style="font-size: 0.8rem; margin: 0;">No automation channels</p>
            </div>
          </div>
        }
      >
        {/* Automation Channels - Stacked vertically like in mockup */}
        <For each={automationChannels()}>
          {(channel) => {
            const channelHeight = 80; // Fixed height per channel like in mockup
            
            return (
              <div 
                style={`
                  height: ${channelHeight}px;
                  position: relative;
                  border-bottom: 1px solid var(--border-color);
                  background: #f8f9fa;
                  overflow: hidden;
                `}
              >
                {/* Timeline scroll container */}
                <div 
                  style={`
                    transform: translateX(-${props.timelineScroll || 0}px);
                    height: 100%;
                    width: ${timelineWidth()}px;
                    position: absolute;
                    top: 0;
                    left: 0;
                  `}
                >
                  {/* SVG Timeline */}
                  <svg
                    width={timelineWidth()}
                    height={channelHeight}
                    style="cursor: crosshair; display: block;"
                    onClick={(e) => handleTimelineClick(e, channel)}
                  >
                    {/* Grid background */}
                    <defs>
                      <pattern 
                        id={`automation-grid-${channel.id}`} 
                        width={props.beatWidth * 4} 
                        height={channelHeight} 
                        patternUnits="userSpaceOnUse"
                      >
                        <line 
                          x1={props.beatWidth * 4} 
                          y1="0" 
                          x2={props.beatWidth * 4} 
                          y2={channelHeight}
                          stroke="#e0e0e0" 
                          stroke-width="1"
                        />
                        <line 
                          x1="0" 
                          y1={channelHeight / 2} 
                          x2={props.beatWidth * 4} 
                          y2={channelHeight / 2}
                          stroke="#e0e0e0" 
                          stroke-width="1"
                          opacity="0.5"
                        />
                      </pattern>
                    </defs>
                    
                    <rect width="100%" height="100%" fill="#f8f9fa" />
                    <rect width="100%" height="100%" fill={`url(#automation-grid-${channel.id})`} />
                    
                    {/* Zero line for parameters that can be negative */}
                    <Show when={channel.range[0] < 0}>
                      <line
                        x1="0"
                        y1={channelHeight - ((0 - channel.range[0]) / (channel.range[1] - channel.range[0])) * channelHeight}
                        x2="100%"
                        y2={channelHeight - ((0 - channel.range[0]) / (channel.range[1] - channel.range[0])) * channelHeight}
                        stroke="#666"
                        stroke-width="1"
                        stroke-dasharray="3,3"
                        opacity="0.6"
                      />
                    </Show>
                    
                    {/* Automation curve */}
                    <Show when={channel.points && channel.points.length > 1}>
                      <path
                        d={(() => {
                          const points = channel.points || [];
                          if (points.length < 2) return "";
                          
                          // Sort points by time
                          const sortedPoints = [...points].sort((a, b) => a.time - b.time);
                          
                          let path = "";
                          for (let i = 0; i < sortedPoints.length; i++) {
                            const point = sortedPoints[i];
                            const x = point.time * props.beatWidth * 4;
                            const y = channelHeight - ((point.value - channel.range[0]) / (channel.range[1] - channel.range[0])) * channelHeight;
                            
                            if (i === 0) {
                              path += `M ${x} ${y}`;
                            } else {
                              path += ` L ${x} ${y}`;
                            }
                          }
                          return path;
                        })()}
                        fill="none"
                        stroke={channel.color}
                        stroke-width="3"
                        opacity="0.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </Show>
                    
                    {/* Control points */}
                    <For each={channel.points || []}>
                      {(point, index) => {
                        const x = point.time * props.beatWidth * 4;
                        const y = channelHeight - ((point.value - channel.range[0]) / (channel.range[1] - channel.range[0])) * channelHeight;
                        
                        return (
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill={channel.color}
                            stroke="white"
                            stroke-width="2"
                            style="cursor: move; transition: all 0.1s ease;"
                            onMouseDown={(e) => handlePointMouseDown(e, channel, index())}
                            onContextMenu={(e) => handlePointRightClick(e, channel, index())}
                            onMouseEnter={(e) => {
                              e.target.setAttribute('r', '7');
                              e.target.style.filter = 'brightness(1.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.setAttribute('r', '5');
                              e.target.style.filter = 'brightness(1)';
                            }}
                          />
                        );
                      }}
                    </For>
                  </svg>
                </div>
              </div>
            );
          }}
        </For>
      </Show>
    </div>
  );
};

export default ModulationTimeline;