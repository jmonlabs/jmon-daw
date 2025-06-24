import { Component, createSignal } from 'solid-js';
import { FileHandlers } from '../utils/fileHandlers';
import { Icon } from './Icon';

interface FileBrowserProps {
  onFileSelected?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'menu';
  class?: string;
}

export const FileBrowser: Component<FileBrowserProps> = (props) => {
  let fileInputRef: HTMLInputElement | undefined;
  const [isLoading, setIsLoading] = createSignal(false);

  const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    if (files.length === 0) return;

    setIsLoading(true);
    
    try {
      if (props.onFileSelected) {
        props.onFileSelected(files);
      }
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef) {
        fileInputRef.value = '';
      }
    }
  };

  const openFileBrowser = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  return (
    <div class={`file-browser ${props.class || ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={props.multiple !== false}
        accept={props.accept || '.wav,.mp3,.ogg,.flac,.mid,.midi,.jmon,.json'}
        onChange={handleFileSelect}
        style="display: none"
      />
      <button 
        class={`file-browser-btn ${props.variant || 'primary'}`}
        onClick={openFileBrowser}
        disabled={isLoading()}
        title={props.label || 'Browse Files'}
      >
        {isLoading() ? (
          <Icon name="loader-2" class="animate-spin" color="var(--text-primary)" />
        ) : (
          <Icon name={props.icon || 'folder-open'} size={props.variant === 'menu' ? 14 : 16} color="var(--text-primary)" />
        )}
        {props.label && <span>{props.label}</span>}
      </button>
    </div>
  );
};

// Add CSS
const style = document.createElement('style');
style.textContent = `
.file-browser-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-height: 32px;
}

.file-browser-btn.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary-hover);
  color: white;
}

.file-browser-btn.primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary);
}

.file-browser-btn.secondary {
  background: var(--bg-tertiary);
  border-color: var(--border-color-light);
}

.file-browser-btn.secondary:hover:not(:disabled) {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}

.file-browser-btn.ghost {
  background: transparent;
  border-color: transparent;
  padding: 6px 8px;
}

.file-browser-btn.ghost:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.file-browser-btn.menu {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  justify-content: flex-start;
  transition: background 0.1s ease;
}

.file-browser-btn.menu:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.file-browser-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);