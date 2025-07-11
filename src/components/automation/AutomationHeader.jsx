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
    <div class="modulation-header">
      <div class="header-content">
        <div class="header-left">
          <h4 class="automation-title">Automation</h4>
          <span class="automation-subtitle">
            {channelCount} channel{channelCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="dropdown" classList={{ 'is-active': showDropdown }}>
          <div class="dropdown-trigger">
            <button 
              class="button is-small is-primary"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDropdown?.();
              }}
            >
              <span class="icon is-small">
                <i class="fas fa-plus" />
              </span>
              <span>Add Channel</span>
            </button>
          </div>
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <For each={modulationTypes}>
                {(type) => (
                  <a 
                    class="dropdown-item automation-type-item"
                    onClick={() => onAddChannel?.(type)}
                  >
                    <span class="color-indicator" style={{ background: type.color }} />
                    {type.name}
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationHeader;