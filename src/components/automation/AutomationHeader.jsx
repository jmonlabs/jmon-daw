import { For } from 'solid-js';
import { modulationTypes } from './automationConfig';

const AutomationHeader = (props) => {
  const { 
    channelCount = 0,
    showDropdown = false,
    onToggleDropdown,
    onAddChannel
  } = props;

  return (
    <div 
      class="modulation-header"
      style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #2c3e50; color: white; border-radius: 6px 6px 0 0; margin-bottom: 8px;"
    >
      <div class="header-left">
        <h4 class="automation-title" style="margin: 0; font-size: 1rem; font-weight: 600;">Automation</h4>
        <span class="automation-subtitle" style="font-size: 0.75rem; color: #bdc3c7; margin-left: 8px;">
          {channelCount} channel{channelCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div style="position: relative;">
        <button 
          style="background: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDropdown?.();
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#2980b9';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#3498db';
          }}
        >
          <span style="font-size: 12px;">+</span>
          <span>Add Channel</span>
        </button>
        
        {showDropdown && (
          <div 
            style="position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px; margin-top: 4px;"
          >
            <For each={modulationTypes}>
              {(type) => (
                <div 
                  style="padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f0f0f0; transition: background 0.2s ease;"
                  onClick={() => onAddChannel?.(type)}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                  }}
                >
                  <span 
                    style={`width: 10px; height: 10px; border-radius: 50%; background: ${type.color};`}
                  />
                  <span style="color: #333; font-size: 0.85rem;">{type.name}</span>
                </div>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationHeader;