import { createSignal, createEffect } from 'solid-js';
import { useDawStore } from '../stores/dawStore';

export default function JmonEditor() {
  const store = useDawStore();
  const [jsonText, setJsonText] = createSignal('');
  const [error, setError] = createSignal('');

  // Initialize editor with current JMON data
  createEffect(() => {
    if (store.jmonEditorOpen) {
      setJsonText(JSON.stringify(store.jmonData, null, 2));
      setError('');
    }
  });

  const handleJsonChange = (e) => {
    setJsonText(e.target.value);
    setError('');
  };

  const handleApply = () => {
    try {
      const parsedData = JSON.parse(jsonText());
      
      // Basic validation
      if (!parsedData.format || parsedData.format !== 'jmonTone') {
        throw new Error('Invalid JMON format');
      }
      
      if (!parsedData.version || !parsedData.bpm) {
        throw new Error('Missing required fields (version, bpm)');
      }
      
      if (!Array.isArray(parsedData.audioGraph) || !Array.isArray(parsedData.connections) || !Array.isArray(parsedData.sequences)) {
        throw new Error('Invalid audioGraph, connections, or sequences structure');
      }

      // Update store with parsed data
      store.updateJmonData(parsedData);
      
      // Sync DAW state from JMON
      store.syncFromJmon();
      
      setError('');
      store.toggleJmonEditor(); // Close editor on successful apply
    } catch (err) {
      setError(`JSON Error: ${err.message}`);
    }
  };

  const handleCancel = () => {
    store.toggleJmonEditor();
  };

  const handleExport = () => {
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
      setError(`Export Error: ${err.message}`);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        setJsonText(JSON.stringify(importedData, null, 2));
        setError('');
      } catch (err) {
        setError(`Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style="height: 100%; display: flex; flex-direction: column; background-color: #2b2b2b;">
      
      {/* Action Buttons */}
      <div style="padding: 0.75rem; border-bottom: 1px solid #404040;">
        <div class="buttons is-small">
          <input
            type="file"
            accept=".jmon,.json"
            onChange={handleImport}
            class="is-hidden"
            id="import-file"
          />
          <label
            for="import-file"
            class="button is-small is-dark"
          >
            <span class="icon is-small">
              <i class="fas fa-upload"></i>
            </span>
            <span>Import</span>
          </label>
          <button
            onClick={handleExport}
            class="button is-small is-dark"
          >
            <span class="icon is-small">
              <i class="fas fa-download"></i>
            </span>
            <span>Export</span>
          </button>
          <button
            onClick={handleApply}
            class="button is-small is-primary"
          >
            <span class="icon is-small">
              <i class="fas fa-check"></i>
            </span>
            <span>Apply</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error() && (
        <div class="notification is-danger is-light mx-3 mt-3">
          <button class="delete" onClick={() => setError('')}></button>
          <div class="content">
            <p><strong>Error:</strong></p>
            <pre style="white-space: pre-wrap; font-size: 0.75rem;">{error()}</pre>
          </div>
        </div>
      )}

      {/* JSON Editor */}
      <div style="flex: 1; padding: 0.75rem; display: flex; flex-direction: column;">
        <textarea
          value={jsonText()}
          onInput={handleJsonChange}
          class="textarea has-background-dark has-text-light is-family-monospace"
          style="
            height: 100%; 
            resize: none; 
            font-size: 0.75rem;
            line-height: 1.4;
            border: 1px solid #404040;
          "
          placeholder="JMON data will appear here..."
          spellcheck={false}
        />
      </div>

      {/* Info Panel */}
      <div class="mx-3 mb-3">
        <div class="box has-background-dark has-text-grey-light is-small" style="border: 1px solid #404040;">
          <p class="has-text-weight-semibold mb-2 is-size-7">
            <span class="icon is-small">
              <i class="fas fa-info-circle"></i>
            </span>
            JMON Format:
          </p>
          <div style="font-size: 0.625rem; line-height: 1.3;">
            <div><code>format</code>: "jmonTone" | <code>bpm</code>: 20-400</div>
            <div><code>audioGraph</code>: nodes | <code>sequences</code>: tracks</div>
          </div>
        </div>
      </div>
    </div>
  );
}