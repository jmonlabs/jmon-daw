// Main widget export for AnyWidget integration
import { render, createComponent } from 'solid-js/web';
import { DAWWidget } from './DAWWidget';
import { initializeI18n } from '../utils/i18n';

// Widget interface for external consumption
export interface SolidDAWWidget {
  render: (container: HTMLElement, props?: any) => () => void;
  importJmon: (jmonData: any) => Promise<void>;
  exportJmon: () => any;
  setLanguage: (language: string) => Promise<void>;
  destroy: () => void;
}

// Global widget state
let currentWidget: any = null;
let currentDispose: (() => void) | null = null;

/**
 * Create and render the DAW widget
 */
function createDAWWidget(container: HTMLElement, props: any = {}): () => void {
  // Initialize i18n if language is specified
  if (props.language) {
    initializeI18n(props.language);
  }

  // Render the widget
  const dispose = render(() => 
    createComponent(DAWWidget, props), 
    container
  );

  currentDispose = dispose;
  return dispose;
}

/**
 * Main widget export for AnyWidget
 */
export function createSolidDAW(): SolidDAWWidget {
  return {
    render: createDAWWidget,
    
    importJmon: async (jmonData: any) => {
      if (currentWidget && currentWidget.importJmon) {
        return await currentWidget.importJmon(jmonData);
      }
      throw new Error('Widget not initialized');
    },
    
    exportJmon: () => {
      if (currentWidget && currentWidget.exportJmon) {
        return currentWidget.exportJmon();
      }
      throw new Error('Widget not initialized');
    },
    
    setLanguage: async (language: string) => {
      const { setLanguage } = await import('../utils/i18n');
      return setLanguage(language as any);
    },
    
    destroy: () => {
      if (currentDispose) {
        currentDispose();
        currentDispose = null;
        currentWidget = null;
      }
    }
  };
}

// Global export for browser environments
declare global {
  interface Window {
    SolidDAW: {
      create: () => SolidDAWWidget;
      version: string;
    };
  }
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
  window.SolidDAW = {
    create: createSolidDAW,
    version: '1.0.0'
  };
}

// ES module exports
export { DAWWidget };
export default createSolidDAW;