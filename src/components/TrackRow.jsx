import { Show, For } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import TrackLane from './TrackLane';

export default function TrackRow(props) {
  const store = useDawStore();
  
  const { track, index, beatWidth, barWidth, timelineScroll, verticalZoom, gridMarkers } = props;

  return (
    <div 
      class="track-row"
      style={`
        display: flex;
        height: ${track.height || 80}px;
        border-bottom: 1px solid #404040;
        background-color: ${store.selectedTrack === track.id ? '#1a472a' : '#1a1a1a'};
        position: relative;
      `}
    >
      {/* Track Info Section - Fixed Width */}
      <div 
        class="track-info-section"
        style="
          width: 200px;
          background-color: #2b2b2b;
          border-right: 1px solid #404040;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
        "
        onClick={() => store.setSelectedTrack(track.id)}
      >
        {/* Track Name */}
        <div style="color: #3db5dc; font-weight: 600; font-size: 0.875rem; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          {track.name || `Track ${index + 1}`}
        </div>
        
        {/* Controls Row */}
        <div style="display: flex; justify-content: center; align-items: center; gap: 0.25rem; margin-bottom: 0.5rem;">
          <div class="buttons has-addons is-small">
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.updateTrack(track.id, { muted: !track.muted });
              }}
              class={`button is-small ${track.muted ? 'is-danger' : 'is-dark'}`}
              style="padding: 0 0.3rem; font-size: 0.6rem; height: 1.4rem; min-width: 1.6rem;"
            >
              M
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.updateTrack(track.id, { solo: !track.solo });
              }}
              class={`button is-small ${track.solo ? 'is-warning' : 'is-dark'}`}
              style="padding: 0 0.3rem; font-size: 0.6rem; height: 1.4rem; min-width: 1.6rem;"
            >
              S
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Delete track
              }}
              class="button is-small is-dark"
              style="padding: 0 0.3rem; font-size: 0.6rem; height: 1.4rem; min-width: 1.6rem;"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Note Count */}
        <div class="has-text-grey-light is-size-7">
          Notes: {track.notes?.length || 0}
        </div>
      </div>

      {/* Track Lane Section - Flexible Width */}
      <div 
        class="track-lane-section"
        style="
          flex: 1;
          position: relative;
          background-color: #1a1a1a;
          overflow-x: auto;
          overflow-y: hidden;
          z-index: 1;
        "
        onScroll={(e) => {
          // Sync horizontal scroll with store
          const scrollLeft = e.target.scrollLeft;
          store.setTimelineScroll(scrollLeft);
        }}
        ref={(ref) => {
          // Sync scroll position from store
          if (ref && ref.scrollLeft !== timelineScroll) {
            ref.scrollLeft = timelineScroll;
          }
        }}
      >
        <TrackLane 
          track={track} 
          index={index} 
          beatWidth={beatWidth} 
          barWidth={barWidth}
          timelineScroll={timelineScroll}
          verticalZoom={verticalZoom}
          gridMarkers={gridMarkers}
          minHeight={80}
          trackHeight={track.height || 80}
        />
      </div>

      {/* Resize Handle - Bottom Edge */}
      <div
        class="track-resize-handle"
        style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          cursor: ns-resize;
          background-color: transparent;
          z-index: 50;
          pointer-events: auto;
        "
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const startY = e.clientY;
          const startHeight = track.height || 80;
          
          const handleMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(80, startHeight + deltaY);
            store.updateTrack(track.id, { height: newHeight });
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 122, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
      />

      {/* Effects Section - Fixed Width (when visible) */}
      <Show when={store.rightSidebarOpen}>
        <div 
          class="track-effects-section"
          style="
            width: 250px;
            background-color: #2b2b2b;
            border-left: 1px solid #404040;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          "
        >
          {/* Volume Knob */}
          <div style="display: flex; flex-direction: column; align-items: center; width: 2.5rem;">
            <div class="has-text-grey-light is-size-7 mb-1">VOL</div>
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                background: #404040;
                border: 2px solid #666;
                position: relative;
                cursor: pointer;
              "
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startValue = track.volume || 0.8;
                
                const handleMouseMove = (moveEvent) => {
                  const deltaY = startY - moveEvent.clientY;
                  const sensitivity = 0.005;
                  const newValue = Math.max(0, Math.min(1, startValue + (deltaY * sensitivity)));
                  store.updateTrack(track.id, { volume: newValue });
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}>
                <div style={`
                  position: absolute;
                  top: 2px;
                  left: 50%;
                  width: 2px;
                  height: 8px;
                  background: #00d1b2;
                  border-radius: 1px;
                  transform-origin: 50% 10px;
                  transform: translateX(-50%) rotate(${(track.volume || 0.8) * 270 - 135}deg);
                `} />
              </div>
            </div>
            <div class="has-text-grey-light is-size-7 mt-1" style="font-size: 0.5rem;">
              {Math.round((track.volume || 0.8) * 100)}
            </div>
          </div>
          
          {/* Pan Knob */}
          <div style="display: flex; flex-direction: column; align-items: center; width: 2.5rem;">
            <div class="has-text-grey-light is-size-7 mb-1">PAN</div>
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                background: #404040;
                border: 2px solid #666;
                position: relative;
                cursor: pointer;
              "
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startValue = track.pan || 0;
                
                const handleMouseMove = (moveEvent) => {
                  const deltaY = startY - moveEvent.clientY;
                  const sensitivity = 0.005;
                  const newValue = Math.max(-1, Math.min(1, startValue + (deltaY * sensitivity)));
                  store.updateTrack(track.id, { pan: newValue });
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}>
                <div style={`
                  position: absolute;
                  top: 2px;
                  left: 50%;
                  width: 2px;
                  height: 8px;
                  background: #ffdd57;
                  border-radius: 1px;
                  transform-origin: 50% 10px;
                  transform: translateX(-50%) rotate(${(track.pan || 0) * 135}deg);
                `} />
              </div>
            </div>
            <div class="has-text-grey-light is-size-7 mt-1" style="font-size: 0.5rem;">
              {Math.abs(track.pan || 0) < 0.1 ? 'C' : (track.pan || 0) > 0 ? 'R' : 'L'}
            </div>
          </div>
          
          {/* Audio Chain - Vertical Boxes like mockup with scroll */}
          <div 
            class="effects-chain-scroll"
            style="
              flex: 1; 
              display: flex; 
              align-items: center; 
              gap: 0.375rem; 
              overflow-x: auto; 
              overflow-y: hidden;
              padding: 0.25rem;
              scrollbar-width: thin;
              scrollbar-color: #666 #2b2b2b;
            "
          >
            
            {/* Synth/Source - Tall vertical box with rotated text */}
            <div style="
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
              width: 28px; 
              height: 60px; 
              background-color: #00d1b2; 
              border-radius: 6px; 
              color: white; 
              font-size: 0.6rem; 
              font-weight: 600;
              text-align: center;
              line-height: 1.1;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              flex-shrink: 0;
              cursor: pointer;
            "
            onClick={(e) => {
              e.stopPropagation();
              store.setSelectedEffect({ 
                trackId: track.id, 
                type: 'synth', 
                name: track.synthType || 'Synth',
                options: track.synthOptions || {}
              });
            }}
            >
              <span style="
                transform: rotate(-90deg); 
                white-space: nowrap;
                transform-origin: center;
              ">
                {(track.synthType || 'Synth').substring(0, 8)}
              </span>
            </div>
            
            {/* Effects Chain - Vertical boxes with rotated text */}
            <For each={track.effects || []}>
              {(effect, index) => (
                <div style="
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: center;
                  width: 28px; 
                  height: 60px; 
                  background-color: #3273dc; 
                  border-radius: 6px; 
                  color: white; 
                  font-size: 0.6rem; 
                  font-weight: 600;
                  text-align: center;
                  line-height: 1.1;
                  position: relative;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  cursor: pointer;
                  flex-shrink: 0;
                "
                onClick={(e) => {
                  e.stopPropagation();
                  store.setSelectedEffect({ 
                    trackId: track.id, 
                    type: 'effect', 
                    effectIndex: index(),
                    name: effect.type || 'Effect',
                    options: effect.options || {}
                  });
                }}
                >
                  <span style="
                    transform: rotate(-90deg); 
                    white-space: nowrap;
                    transform-origin: center;
                  ">
                    {(effect.type || 'Effect').substring(0, 8)}
                  </span>
                  <button
                    style="position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; border-radius: 50%; background: #ef4444; color: white; border: none; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"
                    title="Remove Effect"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedEffects = track.effects.filter((_, i) => i !== index());
                      store.updateTrack(track.id, { effects: updatedEffects });
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
            
            {/* Add Effect Button - Fixed round plus */}
            <button
              style="
                min-width: 30px; 
                width: 30px;
                min-height: 30px;
                height: 30px; 
                border-radius: 15px; 
                background-color: #666; 
                color: white; 
                border: none; 
                font-size: 16px; 
                font-weight: bold;
                line-height: 1;
                display: flex; 
                align-items: center; 
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: background-color 0.2s;
                flex-shrink: 0;
                padding: 0;
                margin: 0;
              "
              title="Add Effect"
              onMouseEnter={(e) => e.target.style.backgroundColor = '#888'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#666'}
              onClick={(e) => {
                e.stopPropagation();
                const effectTypes = ['Reverb', 'Delay', 'Chorus', 'Distortion', 'Filter', 'Compressor'];
                const randomType = effectTypes[Math.floor(Math.random() * effectTypes.length)];
                const newEffect = { type: randomType, options: {} };
                const updatedEffects = [...(track.effects || []), newEffect];
                store.updateTrack(track.id, { effects: updatedEffects });
              }}
            >
              <span style="transform: translateY(-1px);">+</span>
            </button>
            
            {/* Master - Tall vertical box with rotated text */}
            <div style="
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center;
              width: 28px; 
              height: 60px; 
              background-color: #23d160; 
              border-radius: 6px; 
              color: white; 
              font-size: 0.6rem; 
              font-weight: 600;
              text-align: center;
              line-height: 1.1;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              flex-shrink: 0;
              cursor: pointer;
            "
            onClick={(e) => {
              e.stopPropagation();
              store.toggleMasterBus();
            }}
            >
              <span style="
                transform: rotate(-90deg); 
                white-space: nowrap;
                transform-origin: center;
              ">
                Master
              </span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}