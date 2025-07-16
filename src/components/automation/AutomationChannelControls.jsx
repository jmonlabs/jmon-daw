import { For } from "solid-js";

export default function AutomationChannelControls({ track, store }) {
  return (
    <div
      class="automation-channel-controls"
      style="
        width: 250px;
        background: #f8f9fa;
        border-left: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      "
    >
      {/* Channel Controls - aligned with each automation lane */}
      <div style="display: flex; flex-direction: column;">
        <For each={track.automation?.channels || []}>
          {(channel) => (
            <div style="
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0.5rem;
              border-bottom: 1px solid var(--border-color);
              background: #f8f9fa;
            ">
              {/* Channel info */}
              <div style="flex: 1; text-align: left;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #333; margin-bottom: 0.25rem;">
                  {channel.name}
                </div>
                <div style="font-size: 0.7rem; color: #666;">
                  {channel.range[0]} - {channel.range[1]}
                </div>
              </div>
              
              {/* Controls */}
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                {/* Delete button */}
                <button
                  style="
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                  "
                  title="Delete Channel"
                  onClick={() => store.removeAutomationChannel(track.id, channel.id)}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ff4757';
                    e.target.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ff6b6b';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  ×
                </button>
                
                {/* Mute button */}
                <button
                  style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    transition: all 0.2s ease;
                  "
                  title="Mute Channel"
                  onClick={() => {
                    // TODO: Implement mute functionality
                    console.log('Mute channel:', channel.id);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#5a6268';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6c757d';
                  }}
                >
                  M
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}