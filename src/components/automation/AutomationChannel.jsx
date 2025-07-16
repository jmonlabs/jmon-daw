import AutomationTimeline from './AutomationTimeline';

const AutomationChannel = (props) => {
  const { 
    channel, 
    beatWidth, 
    trackLength, 
    timelineScroll,
    onRemoveChannel,
    onTimelineClick,
    onPointMouseDown,
    onPointRightClick
  } = props;

  return (
    <div 
      class="automation-channel"
      style="height: 80px; border-bottom: 1px solid var(--border-color); background: #f8f9fa; overflow: hidden;"
    >
      {/* Channel Timeline only - labels are handled by AutomationControls */}
      <AutomationTimeline
        channel={channel}
        beatWidth={beatWidth}
        trackLength={trackLength}
        timelineScroll={timelineScroll}
        onTimelineClick={onTimelineClick}
        onPointMouseDown={onPointMouseDown}
        onPointRightClick={onPointRightClick}
      />
    </div>
  );
};

export default AutomationChannel;