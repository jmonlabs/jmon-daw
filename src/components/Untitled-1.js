
        {/* Tracks Area */}
        <div
          class="tracks-container"
          style="flex: 1; width: 100%; overflow-x: auto; overflow-y: auto; position: relative; touch-action: pan-x pan-y;"
          ref={(ref) => {
            if (ref) {
              window.tracksContainer = ref;
            }
          }}
          onWheel={(e) => {
            // Zoom DAW avec Ctrl+Wheel (Linux/Windows) ou Meta+Wheel (Mac)
            const isMac = navigator.platform.toLowerCase().includes('mac');
            if ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) {
              e.preventDefault();
              const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
              const newZoom = Math.max(0.1, Math.min(5, store.timelineZoom + zoomDelta));
              store.setTimelineZoom(newZoom);
            }
            // Scroll horizontal natif (trackpad ou barre de scroll)
            // Si Shift+Wheel, laisse le scroll natif agir
          }}
        >
          {/* Playback Progress Bar - Fixed position, covers ruler and tracks */}
          <div
            class="playback-progress-bar"
            style={`
              position: absolute;
              top: -80px;
              left: ${200 + store.currentTime * (80 * store.timelineZoom * 4) - (window.tracksContainer?.scrollLeft || 0)}px;
              width: 3px;
              height: calc(100% + 120px);
              background-color: #ff4444;
              z-index: 500;
              pointer-events: none;
              opacity: ${store.isPlaying ? 1 : 0.7};
              transition: opacity 0.2s ease;
              box-shadow: 0 0 6px rgba(255, 68, 68, 0.7);
            `}
          />

          <For each={store.tracks}>
            {(track, index) => {
              // Make zoom reactive
              const beatWidth = () => 80 * store.timelineZoom;
              const barWidth = () => 80 * store.timelineZoom * 4;

              // Generate grid markers for tracks
              const gridMarkers = () => {
                const markers = [];
                const currentBarWidth = barWidth();
                const currentBeatWidth = beatWidth();
                const totalWidth = 5000;
                const scrollLeft = window.tracksContainer?.scrollLeft || 0;
                const visibleBars =
                  Math.ceil(
                    (totalWidth + scrollLeft) / currentBarWidth,
                  ) + 10;
                const startBar = Math.floor(
                  scrollLeft / currentBarWidth,
                );

                for (
                  let bar = Math.max(0, startBar);
                  bar < startBar + visibleBars;
                  bar++
                ) {
                  const barX = bar * currentBarWidth - scrollLeft;
                  if (barX >= 0 && barX < totalWidth) {
                    markers.push({ x: barX, type: "bar" });

                    // Beat markers
                    for (let beat = 1; beat < 4; beat++) {
                      const beatX = barX + beat * currentBeatWidth;
                      if (beatX >= 0 && beatX < totalWidth) {
                        markers.push({ x: beatX, type: "beat" });
                      }
                    }
                  }
                }

                return markers;
              };

              return (
                <>
                  {/* Track Row */}
                  <div
                    style="
                    border-bottom: 2px solid var(--border-color);
                    position: relative;
                    z-index: 1;
                  "
                  >
                    <TrackRow
                      track={track}
                      index={index()}
                      beatWidth={beatWidth}
                      barWidth={barWidth}
                      timelineScroll={window.tracksContainer?.scrollLeft || 0}
                      gridMarkers={gridMarkers()}
                    />
                  </div>
                  
                  {/* Automation Section - Rendered between tracks */}
                  <Show when={track.automation?.visible}>
                    <div 
                      style="
                        height: 200px;
                        display: flex;
                        flex-shrink: 0;
                        border-bottom: 2px solid var(--border-color);
                        background-color: var(--surface-bg);
                        position: relative;
                        z-index: 2;
                      "
                    >
                      {/* Automation Info - Left column, same layout as track info */}
                      <div
                        style="
                          width: 200px;
                          background-color: var(--track-bg);
                          border-right: 2px solid var(--border-color);
                          display: flex;
                          position: relative;
                        "
                      >
                        {/* Vertical Track Title Band - Gray tone like in mockup */}
                        <div
                          style="
                          width: 24px;
                          background-color: #888888;
                          border-right: 1px solid var(--border-active);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          position: relative;
                        "
                        >
                          <div
                            style="
                            writing-mode: vertical-rl;
                            text-orientation: mixed;
                            color: white;
                            font-weight: 600;
                            font-size: 0.7rem;
                            white-space: nowrap;
                            letter-spacing: 0.05em;
                            transform: rotate(180deg);
                          "
                          >
                            {track.name || `Track ${index + 1}`} - automation
                          </div>
                        </div>

                        {/* Controls and Channel Labels Area */}
                        <div
                          style="
                          flex: 1;
                          padding: 0.5rem;
                          display: flex;
                          flex-direction: column;
                          position: relative;
                        "
                        >

                          {/* Add Channel Button - Shortened */}
                          <div style="position: relative; margin-bottom: 4px;" class="automation-dropdown">
                            <button 
                              style="
                                background: #888888; 
                                color: white; 
                                border: none; 
                                padding: 3px 8px; 
                                border-radius: 3px; 
                                font-size: 0.7rem; 
                                cursor: pointer; 
                                transition: all 0.2s ease;
                                width: 60%;
                              "
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentId = `dropdown-${track.id}`;
                                const currentDropdown = document.querySelector(`[data-dropdown="${currentId}"]`);
                                const isVisible = currentDropdown && currentDropdown.style.display !== 'none';
                                
                                document.querySelectorAll('[data-dropdown]').forEach(dd => dd.style.display = 'none');
                                
                                if (!isVisible && currentDropdown) {
                                  currentDropdown.style.display = 'block';
                                }
                              }}
                            >
                              + Add
                            </button>
                          
                          <div 
                            data-dropdown={`dropdown-${track.id}`}
                            style="
                              display: none;
                              position: absolute; 
                              top: 100%; 
                              left: 0; 
                              background: white; 
                              border: 1px solid #ddd; 
                              border-radius: 4px; 
                              box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                              z-index: 1000; 
                              min-width: 180px; 
                              margin-top: 4px;
                            "
                          >
                            <div 
                              style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f0f0f0;"
                              onClick={() => {
                                store.addAutomationChannel(track.id, 'velocity', {
                                  name: 'Velocity',
                                  range: [0, 127],
                                  color: '#666666',
                                  defaultValue: 64
                                });
                                document.querySelector(`[data-dropdown="dropdown-${track.id}"]`).style.display = 'none';
                              }}
                            >
                              <span style="width: 10px; height: 10px; border-radius: 50%; background: #666666;"></span>
                              <span style="color: #333; font-size: 0.8rem;">Velocity</span>
                            </div>
                            <div 
                              style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f0f0f0;"
                              onClick={() => {
                                store.addAutomationChannel(track.id, 'pitchBend', {
                                  name: 'Pitch Bend',
                                  range: [-8192, 8191],
                                  color: '#999999',
                                  defaultValue: 0
                                });
                                document.querySelector(`[data-dropdown="dropdown-${track.id}"]`).style.display = 'none';
                              }}
                            >
                              <span style="width: 10px; height: 10px; border-radius: 50%; background: #999999;"></span>
                              <span style="color: #333; font-size: 0.8rem;">Pitch Bend</span>
                            </div>
                            <div 
                              style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px;"
                              onClick={() => {
                                store.addAutomationChannel(track.id, 'modulation', {
                                  name: 'Modulation',
                                  range: [0, 127],
                                  color: '#777777',
                                  defaultValue: 0
                                });
                                document.querySelector(`[data-dropdown="dropdown-${track.id}"]`).style.display = 'none';
                              }}
                            >
                              <span style="width: 10px; height: 10px; border-radius: 50%; background: #777777;"></span>
                              <span style="color: #333; font-size: 0.8rem;">Modulation</span>
                            </div>
                          </div>
                        </div>

                          {/* Channel Labels - perfectly aligned with their respective automation channels */}
                          <div style="flex: 1; position: relative; display: flex; justify-content: flex-end;">
                            <div style="position: absolute; right: 0; top: -30px; display: flex; flex-direction: column;">
                              <For each={track.automation?.channels || []}>
                                {(channel, channelIndex) => {
                                  // Different gray tones for each type
                                  const getChannelColor = (name) => {
                                    switch(name) {
                                      case 'Velocity': return '#666666';
                                      case 'Pitch Bend': return '#999999';
                                      case 'Modulation': return '#777777';
                                      default: return '#888888';
                                    }
                                  };
                                  
                                  return (
                                    <div
                                      style={`
                                        height: 80px;
                                        width: 60px;
                                        background: ${getChannelColor(channel.name)};
                                        border: 1px solid var(--border-color);
                                        border-radius: 4px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        position: relative;
                                        color: white;
                                        font-weight: 600;
                                        font-size: 0.7rem;
                                        margin-bottom: 1px;
                                      `}
                                    >
                                      <div style="transform: rotate(-90deg); white-space: nowrap;">
                                        {channel.name}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          store.removeAutomationChannel(track.id, channel.id);
                                        }}
                                        style="
                                          position: absolute;
                                          top: 2px;
                                          right: 2px;
                                          width: 14px;
                                          height: 14px;
                                          background: rgba(255, 71, 87, 0.9);
                                          border: 1px solid white;
                                          border-radius: 50%;
                                          color: white;
                                          font-size: 9px;
                                          font-weight: bold;
                                          cursor: pointer;
                                          display: flex;
                                          align-items: center;
                                          justify-content: center;
                                          line-height: 1;
                                        "
                                        title="Remove Channel"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </div>

                          {/* Channel count at bottom like in mockup */}
                          <div
                            style="
                              position: absolute;
                              bottom: 4px;
                              left: 0;
                              color: var(--text-muted);
                              font-size: 0.65rem;
                              text-align: left;
                            "
                          >
                            Channels: {track.automation?.channels?.length || 0}
                          </div>
                        </div>
                      </div>


                      {/* Automation Timeline - Perfect alignment with track timeline */}
                      <div
                        style="
                          flex: 1;
                          overflow-x: auto;
                          overflow-y: hidden;
                          position: relative;
                        "
                      >
                        <ModulationTimeline 
                          trackId={track.id}
                          trackLength={Math.max(4, Math.ceil((track.notes || []).reduce((max, note) => {
                            const noteTime = typeof note.time === 'string' ? 
                              parseFloat(note.time.split(':')[0]) || 0 : 
                              note.time || 0;
                            return Math.max(max, noteTime + 1);
                          }, 4)))}
                          beatWidth={beatWidth()}
                          timelineScroll={window.tracksContainer?.scrollLeft || 0}
                        />
                      </div>

                      {/* Effects section spacer when right sidebar is open */}
                      <Show when={store.rightSidebarOpen}>
                        <div style="width: 250px; background-color: var(--surface-bg);"></div>
                      </Show>
                    </div>
                  </Show>
                </>
              );
            }}
          </For>

          {/* Empty state with Add Track button */}
          {store.tracks.length === 0 && (
            <div
              style="
                height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 1.1rem;
                gap: 1rem;
              "
            >
              <div>No tracks loaded. Add your first track to get started.</div>
              <button
                onClick={store.addTrack}
                class="button is-primary"
                style="background-color: var(--primary-accent); border: 2px solid var(--secondary-accent); color: var(--text-inverse);"
              >
                <span class="icon is-small">
                  <i class="fa-solid fa-plus"></i>
                </span>
                <span>Add Track</span>
              </button>
            </div>
          )}
        </div>
