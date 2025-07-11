import { For, Show } from 'solid-js';
import { timeToX, valueToY, generateSplinePath } from './automationUtils';
import { AUTOMATION_CONSTANTS } from './automationConfig';

const AutomationTimeline = (props) => {
  const { 
    channel, 
    beatWidth = 80, 
    trackLength = 16, 
    timelineScroll = 0,
    onTimelineClick,
    onPointMouseDown,
    onPointRightClick
  } = props;

  const timelineWidth = Math.max(800, trackLength * beatWidth * 4);

  return (
    <div class="channel-timeline">
      <div 
        class="timeline-scroll-container"
        style={`transform: translateX(-${timelineScroll}px)`}
      >
        <svg
          width={timelineWidth}
          height={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT}
          class="timeline-svg"
          onClick={(e) => onTimelineClick?.(e, channel)}
        >
          {/* Clean grid background */}
          <defs>
            <pattern 
              id={`grid-${channel.id}`} 
              width={beatWidth * 4} 
              height={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT} 
              patternUnits="userSpaceOnUse"
            >
              {/* Vertical grid lines */}
              <line 
                x1={beatWidth * 4} 
                y1="0" 
                x2={beatWidth * 4} 
                y2={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT}
                stroke="#f1f3f4" 
                stroke-width="1"
              />
              {/* Horizontal center line */}
              <line 
                x1="0" 
                y1={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT / 2} 
                x2={beatWidth * 4} 
                y2={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT / 2}
                stroke="#f8f9fa" 
                stroke-width="1"
              />
            </pattern>
          </defs>
          
          {/* Grid background */}
          <rect width="100%" height="100%" fill="#fafbfc" />
          <rect width="100%" height="100%" fill={`url(#grid-${channel.id})`} />
          
          {/* Zero line (for parameters that can be negative) */}
          <Show when={channel.range[0] < 0}>
            <line
              x1="0"
              y1={valueToY(0, channel.range, AUTOMATION_CONSTANTS.CHANNEL_HEIGHT)}
              x2="100%"
              y2={valueToY(0, channel.range, AUTOMATION_CONSTANTS.CHANNEL_HEIGHT)}
              stroke="#6c757d"
              stroke-width="1"
              stroke-dasharray="3,3"
              opacity="0.6"
            />
          </Show>
          
          {/* Automation curve - clean blue style */}
          <path
            d={generateSplinePath(
              channel.points, 
              channel.range, 
              beatWidth, 
              AUTOMATION_CONSTANTS.CHANNEL_HEIGHT
            )}
            fill="none"
            stroke={channel.color}
            stroke-width={AUTOMATION_CONSTANTS.CURVE_STROKE_WIDTH}
            opacity="0.9"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          {/* Clean control points */}
          <For each={channel.points}>
            {(point, index) => (
              <circle
                cx={timeToX(point.time, beatWidth)}
                cy={valueToY(point.value, channel.range, AUTOMATION_CONSTANTS.CHANNEL_HEIGHT)}
                r={AUTOMATION_CONSTANTS.CONTROL_POINT_RADIUS}
                class="control-point"
                onMouseDown={(e) => onPointMouseDown?.(e, channel, index())}
                onContextMenu={(e) => onPointRightClick?.(e, channel, index())}
              />
            )}
          </For>
        </svg>
      </div>
    </div>
  );
};

export default AutomationTimeline;