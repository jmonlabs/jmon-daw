import { Component, onMount } from 'solid-js';
import { Header } from './Header';
import { TrackArea } from './TrackArea';
import { StatusBar } from './StatusBar';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { JmonEditor, isJmonEditorExpanded } from './JmonEditor';
import { initializeI18n } from '../utils/i18n';

interface MainLayoutProps {
  readonly?: boolean;
  onProjectChange?: (projectData: any) => void;
}

export const MainLayout: Component<MainLayoutProps> = (props) => {
  onMount(async () => {
    // Initialize internationalization
    await initializeI18n();
  });
  return (
    <div class={`main-layout ${isJmonEditorExpanded() ? 'jmon-expanded' : ''}`}>
      <KeyboardShortcuts />
      <JmonEditor />
      <Header />
      <div class="content-area">
        <TrackArea />
      </div>
      <StatusBar />
    </div>
  );
};

// Add CSS for the layout
const style = document.createElement('style');
style.textContent = `
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  transition: margin-left 0.3s ease;
}

.main-layout.jmon-expanded {
  margin-left: 400px;
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #1e1e1e;
}
`;
document.head.appendChild(style);