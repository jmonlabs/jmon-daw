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
      style="margin-bottom: 8px; border: 1px solid #e0e0e0; border-radius: 6px; background: white; overflow: hidden;"
    >
      {/* Channel Header */}
      <div 
        class="channel-header"
        style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0;"
      >
        <div class="channel-info" style="display: flex; align-items: center; gap: 8px;">
          <span 
            class="color-indicator" 
            style={`width: 12px; height: 12px; border-radius: 50%; background: ${channel.color}; border: 2px solid white; box-shadow: 0 0 0 1px #ddd;`}
          />
          <div class="channel-details">
            <span class="channel-name" style="font-size: 0.85rem; font-weight: 600; color: #333;">{channel.name}</span>
            <span class="channel-range" style="font-size: 0.7rem; color: #666; margin-left: 8px;">
              {channel.range[0]} - {channel.range[1]}
            </span>
          </div>
        </div>
        <div class="channel-controls">
          <button 
            style="background: none; border: none; color: #999; font-size: 14px; cursor: pointer; padding: 4px; border-radius: 3px; transition: all 0.2s ease;"
            onClick={() => onRemoveChannel?.(channel.id)}
            title="Remove Channel"
            onMouseEnter={(e) => {
              e.target.style.background = '#ff4757';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#999';
            }}
          >
            ×
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