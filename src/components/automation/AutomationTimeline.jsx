import { For, Show } from 'solid-js';
import { timeToX, valueToY, generateSplinePath } from './automationUtils';
import { AUTOMATION_CONSTANTS } from './automationConfig';
import { generateTemporalGrid } from '../../utils/gridUtils';

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
    <div 
      class="channel-timeline"
      style="height: 80px; position: relative; background: #f8f9fa; overflow: hidden; width: 100%;"
    >
      <div 
        class="timeline-scroll-container"
        style={`transform: translateX(-${timelineScroll}px); height: 100%; width: ${timelineWidth}px; position: absolute; top: 0; left: 0;`}
      >
        <svg
          width={timelineWidth}
          height={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT}
          class="timeline-svg"
          style="cursor: crosshair; display: block;"
          onClick={(e) => onTimelineClick?.(e, channel)}
        >
          {/* Background */}
          <rect width="100%" height="100%" fill="#fafbfc" />
          
          {/* Temporal Grid - synchronized with piano roll */}
          <For each={generateTemporalGrid(beatWidth, timelineWidth, timelineScroll)}>
            {(line) => (
              <line
                x1={line.x}
                y1={0}
                x2={line.x}
                y2={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT}
                stroke="#ddd"
                stroke-width={line.strokeWidth}
                opacity={line.opacity}
              />
            )}
          </For>
          
          {/* Horizontal center line */}
          <line 
            x1="0" 
            y1={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT / 2} 
            x2={timelineWidth} 
            y2={AUTOMATION_CONSTANTS.CHANNEL_HEIGHT / 2}
            stroke="#e0e0e0" 
            stroke-width="1"
            opacity="0.5"
          />
          
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
                fill="gray"
                stroke="white"
                stroke-width="2"
                class="control-point"
                style="cursor: move; transition: all 0.1s ease;"
                onMouseDown={(e) => onPointMouseDown?.(e, channel, index())}
                onContextMenu={(e) => onPointRightClick?.(e, channel, index())}
                onMouseEnter={(e) => {
                  e.target.setAttribute('r', '6');
                  e.target.style.filter = 'brightness(1.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.setAttribute('r', '4');
                  e.target.style.filter = 'brightness(1)';
                }}
              />
            )}
          </For>
        </svg>
      </div>
    </div>
  );
};

export default AutomationTimeline;