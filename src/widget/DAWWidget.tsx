import { Component, createSignal, onMount, createEffect } from 'solid-js';
import { DAWProvider } from '../stores/context';
import { MainLayout } from '../components/MainLayout';
import { JmonImporter } from '../utils/jmonImporter';
import { ProjectExporter } from '../utils/projectExporter';
import '../App.css';

interface DAWWidgetProps {
  /** Initial JMON data to load */
  jmonData?: any;
  /** Callback when project changes */
  onProjectChange?: (jmonData: any) => void;
  /** Widget height */
  height?: string | number;
  /** Widget width */
  width?: string | number;
  /** Language code for translations */
  language?: string;
  /** Readonly mode */
  readonly?: boolean;
}

export const DAWWidget: Component<DAWWidgetProps> = (props) => {
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      // Initialize the widget
      if (props.jmonData) {
        await JmonImporter.importJmonObject(props.jmonData);
      }
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize DAW widget');
    }
  });

  // Watch for external JMON data changes
  createEffect(() => {
    if (isInitialized() && props.jmonData) {
      JmonImporter.importJmonObject(props.jmonData).catch(err => {
        console.error('Failed to update JMON data:', err);
      });
    }
  });

  const handleProjectChange = (projectData: any) => {
    if (props.onProjectChange && !props.readonly) {
      const jmonData = ProjectExporter.toJmon(projectData);
      props.onProjectChange(jmonData);
    }
  };

  if (error()) {
    return (
      <div class="daw-widget-error">
        <h3>DAW Widget Error</h3>
        <p>{error()}</p>
      </div>
    );
  }

  if (!isInitialized()) {
    return (
      <div class="daw-widget-loading">
        <div class="loading-spinner"></div>
        <p>Initializing DAW...</p>
      </div>
    );
  }

  return (
    <div 
      class="daw-widget"
      style={{
        height: typeof props.height === 'number' ? `${props.height}px` : props.height || '600px',
        width: typeof props.width === 'number' ? `${props.width}px` : props.width || '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <DAWProvider>
        <MainLayout 
          readonly={props.readonly}
          onProjectChange={handleProjectChange}
        />
      </DAWProvider>
    </div>
  );
};

// Add widget-specific CSS
const style = document.createElement('style');
style.textContent = `
.daw-widget {
  border: 1px solid #333;
  border-radius: 8px;
  background: #1a1a1a;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.daw-widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #2d1b1b;
  color: #ff6b6b;
  text-align: center;
  padding: 20px;
}

.daw-widget-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #1a1a1a;
  color: #888;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);