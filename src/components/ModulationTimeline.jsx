import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { clamp } from './automation/automationUtils';
import { audioEngine } from '../utils/audioEngine';
import AutomationChannel from './automation/AutomationChannel';
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
    const timelineX = x + (window.tracksContainer?.scrollLeft || 0);
    const time = timelineX / (props.beatWidth * 4);
    
    // Convert Y to value (inverted because SVG Y increases downward)
    const channelHeight = 80; // Fixed height per channel
    const normalizedY = 1 - (y / channelHeight); // Invert Y and normalize to 0-1
    const value = channel.range[0] + (normalizedY * (channel.range[1] - channel.range[0]));
    
    // Clamp values to range
    const clampedValue = clamp(value, channel.range[0], channel.range[1]);
    const clampedTime = clamp(time, 0, props.trackLength || 16);
    
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


  return (
    <div 
      class="modulation-timeline"
      style="
        height: 100%; 
        position: relative;
        background: var(--primary-bg);
        min-width: 5000px;
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
        {/* Automation Channels */}
        <For each={automationChannels()}>
          {(channel) => (
            <AutomationChannel
              channel={channel}
              beatWidth={props.beatWidth}
              trackLength={props.trackLength}
              timelineScroll={props.timelineScroll}
              onTimelineClick={handleTimelineClick}
              onPointMouseDown={handlePointMouseDown}
              onPointRightClick={handlePointRightClick}
              onRemoveChannel={(channelId) => dawStore.removeAutomationChannel(props.trackId, channelId)}
            />
          )}
        </For>
      </Show>
    </div>
  );
};

export default ModulationTimeline;