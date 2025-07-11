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
    <div class="automation-channel">
      {/* Channel Header */}
      <div class="channel-header">
        <div class="channel-info">
          <span class="color-indicator" style={{ background: channel.color }} />
          <div class="channel-details">
            <span class="channel-name">{channel.name}</span>
            <span class="channel-range">{channel.range[0]} - {channel.range[1]}</span>
          </div>
        </div>
        <div class="channel-controls">
          <button 
            class="button is-small is-ghost"
            onClick={() => onRemoveChannel?.(channel.id)}
            title="Remove Channel"
          >
            <i class="fas fa-times" />
          </button>
        </div>
      </div>

      {/* Channel Timeline */}
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