import { For, Show } from "solid-js";
import { modulationTypes } from "./automationConfig";

export default function AutomationControls({ track, store }) {
  // Add channel handler
  const addChannel = (type) => {
    store.addAutomationChannel(track.id, type.id, type);
    store.toggleAutomationChannelDropdown(track.id);
  };

  return (
    <div
      class="automation-controls"
      style="width: 200px; background: #f8f9fa; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; padding: 0.5rem; gap: 0.5rem;"
    >
      <div style="font-weight: 600; font-size: 0.85rem; color: #333; margin-bottom: 0.25rem;">Automation</div>
      
      <button
        style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        "
        title="Add Channel"
        onClick={() => store.toggleAutomationChannelDropdown(track.id)}
      >
        <span style="font-size: 1rem;">+</span> <span>Add channel</span>
      </button>
      
      <Show when={track.automation?.showDropdown}>
        <div style="background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 4px; min-width: 180px;">
          <For each={modulationTypes}>
            {(type) => (
              <div
                style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f0f0f0;"
                onClick={() => addChannel(type)}
              >
                <span style={`width: 10px; height: 10px; border-radius: 50%; background: ${type.color};`}></span>
                <span style="color: #333; font-size: 0.8rem;">{type.name}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
      
    </div>
  );
}
