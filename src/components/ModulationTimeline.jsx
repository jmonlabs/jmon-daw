import { createSignal, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import AutomationHeader from './automation/AutomationHeader';
import AutomationChannel from './automation/AutomationChannel';
import { modulationTypes, createDefaultChannel } from './automation/automationConfig';
import { xToTime, yToValue, clamp } from './automation/automationUtils';
import { audioEngine } from '../utils/audioEngine';
import './automation/ModulationTimeline.css';

const ModulationTimeline = (props) => {
  const dawStore = useDawStore();
  const [selectedType, setSelectedType] = createSignal('velocity');
  const [dragState, setDragState] = createSignal(null);
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  // Get track data reactively
  const track = createMemo(() => 
    dawStore.tracks.find(t => t.id === props.trackId)
  );

  const automationChannels = createMemo(() => 
    track()?.automation?.channels || []
  );

  // Add automation channel
  const addAutomationChannel = (typeConfig) => {
    const channelData = createDefaultChannel(typeConfig);
    // Update default points with proper track length
    channelData.points = [
      { time: 0, value: typeConfig.defaultValue },
      { time: props.trackLength || 16, value: typeConfig.defaultValue }
    ];
    
    dawStore.addAutomationChannel(props.trackId, typeConfig.id, channelData);
    setShowTypeDropdown(false);
    
    // Notify audio engine about automation update
    updateAudioEngineAutomation();
  };

  // Remove automation channel
  const removeAutomationChannel = (channelId) => {
    dawStore.removeAutomationChannel(props.trackId, channelId);
    updateAudioEngineAutomation();
  };

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

  // Handle timeline click
  const handleTimelineClick = (event, channel) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left + (props.timelineScroll || 0);
    const y = event.clientY - rect.top;
    
    const time = xToTime(x, props.beatWidth || 80);
    const value = yToValue(y, channel.range, 60);
    
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
    
    const newTime = drag.originalPoint.time + (deltaX / ((props.beatWidth || 80) * 4));
    const newValue = drag.originalPoint.value - (deltaY / 40) * (channel.range[1] - channel.range[0]);
    
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

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowTypeDropdown(!showTypeDropdown());
  };

  // Event listeners
  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', () => setShowTypeDropdown(false));
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('click', () => setShowTypeDropdown(false));
  });

  return (
    <div class="modulation-timeline">
      {/* Header */}
      <AutomationHeader
        channelCount={automationChannels().length}
        showDropdown={showTypeDropdown()}
        onToggleDropdown={toggleDropdown}
        onAddChannel={addAutomationChannel}
      />

      {/* Automation Channels */}
      <div class="automation-channels">
        <Show 
          when={automationChannels().length > 0}
          fallback={
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-wave-square" />
              </div>
              <p class="empty-message">No automation channels yet</p>
              <p class="empty-help">Click "Add Channel" to create your first automation lane</p>
            </div>
          }
        >
          <For each={automationChannels()}>
            {(channel) => (
              <AutomationChannel
                channel={channel}
                beatWidth={props.beatWidth}
                trackLength={props.trackLength}
                timelineScroll={props.timelineScroll}
                onRemoveChannel={removeAutomationChannel}
                onTimelineClick={handleTimelineClick}
                onPointMouseDown={handlePointMouseDown}
                onPointRightClick={handlePointRightClick}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default ModulationTimeline;