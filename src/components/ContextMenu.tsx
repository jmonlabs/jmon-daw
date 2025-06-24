import { Component, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { Icon } from './Icon';

interface ContextMenuProps {
  show: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  isTrackContext?: boolean;
  hasClipboard?: boolean;
  timePosition?: number;
  onSetLoopStart?: (time: number) => void;
  onSetLoopEnd?: (time: number) => void;
}

export const ContextMenu: Component<ContextMenuProps> = (props) => {
  let menuRef: HTMLDivElement | undefined;
  
  console.log('ContextMenu render:', props.show, props.x, props.y);

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      props.onClose();
    }
  };

  onMount(() => {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);
  });

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('contextmenu', handleClickOutside);
  });

  return (
    <Show when={props.show}>
      <div 
        ref={menuRef}
        class="context-menu"
        style={`left: ${props.x}px; top: ${props.y}px;`}
      >
        <Show when={!props.isTrackContext}>
          <div class="context-menu-item" onClick={() => { props.onDuplicate?.(); props.onClose(); }}>
            <Icon name="copy" size={14} color="var(--text-primary)" />
            <span>Duplicate</span>
          </div>
          <div class="context-menu-item" onClick={() => { props.onCopy?.(); props.onClose(); }}>
            <Icon name="copy" size={14} color="var(--text-primary)" />
            <span>Copy</span>
          </div>
          <div class="context-menu-item" onClick={() => { props.onCut?.(); props.onClose(); }}>
            <Icon name="scissors" size={14} color="var(--text-primary)" />
            <span>Cut</span>
          </div>
        </Show>
        
        <Show when={props.isTrackContext}>
          <div class="context-menu-item disabled">
            <Icon name="copy" size={14} color="var(--text-muted)" />
            <span>Duplicate</span>
          </div>
          <div class="context-menu-item disabled">
            <Icon name="copy" size={14} color="var(--text-muted)" />
            <span>Copy</span>
          </div>
          <div class="context-menu-item disabled">
            <Icon name="scissors" size={14} color="var(--text-muted)" />
            <span>Cut</span>
          </div>
        </Show>
        
        <div 
          class={`context-menu-item ${!props.hasClipboard ? 'disabled' : ''}`} 
          onClick={() => { 
            if (props.hasClipboard) {
              props.onPaste?.(); 
              props.onClose(); 
            }
          }}
        >
          <Icon name="clipboard" size={14} color={props.hasClipboard ? "var(--text-primary)" : "var(--text-muted)"} />
          <span>Paste</span>
        </div>
        
        <Show when={props.timePosition !== undefined}>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item" onClick={() => { 
            props.onSetLoopStart?.(props.timePosition!); 
            props.onClose(); 
          }}>
            <Icon name="skip-back" size={14} color="var(--text-primary)" />
            <span>Set Loop Start Here</span>
          </div>
          <div class="context-menu-item" onClick={() => { 
            props.onSetLoopEnd?.(props.timePosition!); 
            props.onClose(); 
          }}>
            <Icon name="skip-forward" size={14} color="var(--text-primary)" />
            <span>Set Loop End Here</span>
          </div>
        </Show>
        
        <Show when={!props.isTrackContext}>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item danger" onClick={() => { props.onDelete?.(); props.onClose(); }}>
            <Icon name="trash-2" size={14} color="var(--accent-red)" />
            <span>Delete</span>
          </div>
        </Show>
      </div>
    </Show>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.context-menu {
  position: fixed;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  z-index: 2000;
  min-width: 150px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
  transition: background 0.1s ease;
}

.context-menu-item:hover {
  background: var(--bg-tertiary);
}

.context-menu-item.danger {
  color: var(--accent-red);
}

.context-menu-item.danger:hover {
  background: rgba(214, 118, 118, 0.1);
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.disabled:hover {
  background: transparent;
}

.context-menu-separator {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}
`;
document.head.appendChild(style);