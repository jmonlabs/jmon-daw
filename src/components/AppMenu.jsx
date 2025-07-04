import { Show, createSignal } from 'solid-js';
import { useDawStore } from '../stores/dawStore';

export default function AppMenu() {
  const store = useDawStore();
  const [isOpen, setIsOpen] = createSignal(false);

  const handleNewProject = () => {
    if (confirm('Create a new project? This will clear the current composition.')) {
      store.updateJmonData({
        format: 'jmonTone',
        version: '1.0',
        bpm: 120,
        audioGraph: [{ id: 'master', type: 'Destination', options: {} }],
        connections: [],
        sequences: []
      });
      store.syncFromJmon();
    }
    setIsOpen(false);
  };

  const handleLoadDemo = () => {
    store.loadDemo();
    setIsOpen(false);
  };

  const handleExportJMON = () => {
    try {
      const dataStr = JSON.stringify(store.jmonData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${store.jmonData.metadata?.name || 'composition'}.jmon`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export Error: ${err.message}`);
    }
    setIsOpen(false);
  };

  const handleImportJMON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jmon,.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          store.updateJmonData(importedData);
          store.syncFromJmon();
        } catch (err) {
          alert(`Import Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setIsOpen(false);
  };

  return (
    <div style="position: relative; z-index: 1000;">
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="button is-dark is-small"
        title="Menu"
      >
        <span class="icon is-small">
          <i class="fas fa-bars"></i>
        </span>
      </button>

      {isOpen() && (
        <div 
          style="
            position: absolute; 
            top: 100%; 
            right: 0; 
            background: #2b2b2b; 
            border: 1px solid #404040; 
            border-radius: 4px; 
            min-width: 150px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1001;
          "
        >
          <button 
            style="
              display: flex; 
              align-items: center; 
              gap: 8px; 
              width: 100%; 
              padding: 8px 12px; 
              border: none; 
              background: transparent; 
              color: #f5f5f5; 
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) => e.target.style.background = '#404040'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={handleNewProject}
          >
            <i class="fas fa-file"></i>
            <span>New Project</span>
          </button>
          
          <button 
            style="
              display: flex; 
              align-items: center; 
              gap: 8px; 
              width: 100%; 
              padding: 8px 12px; 
              border: none; 
              background: transparent; 
              color: #f5f5f5; 
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) => e.target.style.background = '#404040'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={handleLoadDemo}
          >
            <i class="fas fa-play"></i>
            <span>Load Demo</span>
          </button>
          
          <div style="height: 1px; background: #404040; margin: 4px 0;"></div>
          
          <button 
            style="
              display: flex; 
              align-items: center; 
              gap: 8px; 
              width: 100%; 
              padding: 8px 12px; 
              border: none; 
              background: transparent; 
              color: #f5f5f5; 
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) => e.target.style.background = '#404040'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={handleImportJMON}
          >
            <i class="fas fa-upload"></i>
            <span>Import JMON</span>
          </button>
          
          <button 
            style="
              display: flex; 
              align-items: center; 
              gap: 8px; 
              width: 100%; 
              padding: 8px 12px; 
              border: none; 
              background: transparent; 
              color: #f5f5f5; 
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) => e.target.style.background = '#404040'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={handleExportJMON}
          >
            <i class="fas fa-download"></i>
            <span>Export JMON</span>
          </button>
          
          <div style="height: 1px; background: #404040; margin: 4px 0;"></div>
          
          <button 
            style="
              display: flex; 
              align-items: center; 
              gap: 8px; 
              width: 100%; 
              padding: 8px 12px; 
              border: none; 
              background: transparent; 
              color: #f5f5f5; 
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) => e.target.style.background = '#404040'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => {
              store.toggleJmonEditor();
              setIsOpen(false);
            }}
          >
            <i class="fas fa-code"></i>
            <span>JMON Editor</span>
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen() && (
        <div
          style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; background: transparent;"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}