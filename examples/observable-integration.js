// Observable Framework integration example for SolidDAW
// This file shows how to integrate SolidDAW into Observable notebooks

// Import the widget (assuming it's been built and hosted)
import {SolidDAW} from "https://cdn.jsdelivr.net/npm/solid-daw-widget@latest/dist/solid-daw.es.js"

// Create sample JMON data
const sampleJmon = {
  format: "jmonTone",
  version: "1.0",
  name: "Observable Demo",
  tempo: 128,
  timeSignature: [4, 4],
  tracks: [
    {
      name: "Melody",
      synth: {type: "Synth"},
      notes: [
        {note: "C4", time: 0, duration: 0.25, velocity: 1},
        {note: "D4", time: 0.25, duration: 0.25, velocity: 1},
        {note: "E4", time: 0.5, duration: 0.25, velocity: 1},
        {note: "F4", time: 0.75, duration: 0.25, velocity: 1},
        {note: "G4", time: 1, duration: 0.5, velocity: 1},
        {note: "A4", time: 1.5, duration: 0.25, velocity: 1},
        {note: "B4", time: 1.75, duration: 0.25, velocity: 1},
        {note: "C5", time: 2, duration: 1, velocity: 1}
      ]
    },
    {
      name: "Bass",
      synth: {type: "FMSynth"},
      notes: [
        {note: "C2", time: 0, duration: 1, velocity: 0.8},
        {note: "F2", time: 1, duration: 1, velocity: 0.8},
        {note: "G2", time: 2, duration: 1, velocity: 0.8},
        {note: "C2", time: 3, duration: 1, velocity: 0.8}
      ]
    }
  ]
};

// Create the DAW widget
function createDAWWidget(container, jmonData = null) {
  // Clear container
  container.innerHTML = '';
  
  // Create widget instance
  const widget = SolidDAW.create();
  
  // Configure and render
  const dispose = widget.render(container, {
    jmonData: jmonData || sampleJmon,
    height: 600,
    width: "100%",
    language: "en"
  });
  
  // Return cleanup function and widget instance
  return {
    dispose,
    widget,
    exportJmon: () => widget.exportJmon(),
    importJmon: (data) => widget.importJmon(data)
  };
}

// Observable cell for the main DAW widget
export function dawWidget(jmonData) {
  const container = html`<div style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px;"></div>`;
  
  // Create widget when container is ready
  const {dispose, widget, exportJmon, importJmon} = createDAWWidget(container, jmonData);
  
  // Cleanup on invalidation
  invalidation.then(dispose);
  
  // Return container with additional methods
  container.value = () => exportJmon();
  container.load = (data) => importJmon(data);
  
  return container;
}

// Observable cell for creating custom JMON data
export function createJmonData() {
  const form = html`
    <form>
      <h3>Create JMON Data</h3>
      <label>Project Name: <input name="name" value="My Project" /></label><br>
      <label>Tempo: <input name="tempo" type="number" value="120" min="60" max="200" /></label><br>
      <label>Track Name: <input name="trackName" value="Piano" /></label><br>
      <label>Synth Type: 
        <select name="synthType">
          <option value="Synth">Synth</option>
          <option value="FMSynth">FM Synth</option>
          <option value="AMSynth">AM Synth</option>
          <option value="MembraneSynth">Membrane Synth</option>
        </select>
      </label><br>
      <button type="submit">Create JMON</button>
    </form>
  `;
  
  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const jmonData = {
      format: "jmonTone",
      version: "1.0",
      name: formData.get("name"),
      tempo: parseInt(formData.get("tempo")),
      timeSignature: [4, 4],
      tracks: [
        {
          name: formData.get("trackName"),
          synth: {type: formData.get("synthType")},
          notes: [
            {note: "C4", time: 0, duration: 0.5, velocity: 1},
            {note: "E4", time: 0.5, duration: 0.5, velocity: 1},
            {note: "G4", time: 1, duration: 0.5, velocity: 1},
            {note: "C5", time: 1.5, duration: 0.5, velocity: 1}
          ]
        }
      ]
    };
    
    form.value = jmonData;
    form.dispatchEvent(new CustomEvent("input"));
  };
  
  return form;
}

// Observable cell for displaying JMON data
export function jmonViewer(jmonData) {
  return html`
    <div>
      <h3>JMON Data</h3>
      <details>
        <summary>View JSON</summary>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; max-height: 300px;">
${JSON.stringify(jmonData, null, 2)}</pre>
      </details>
    </div>
  `;
}

// Observable cell for project statistics
export function projectStats(jmonData) {
  if (!jmonData) return html`<p>No project data</p>`;
  
  const tracks = jmonData.tracks || [];
  const totalNotes = tracks.reduce((sum, track) => sum + (track.notes || []).length, 0);
  const maxDuration = tracks.reduce((max, track) => {
    const trackMax = (track.notes || []).reduce((tMax, note) => 
      Math.max(tMax, note.time + note.duration), 0);
    return Math.max(max, trackMax);
  }, 0);
  
  return html`
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h3>Project Statistics</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Name:</strong> ${jmonData.name || 'Untitled'}</li>
        <li><strong>Tempo:</strong> ${jmonData.tempo || 120} BPM</li>
        <li><strong>Tracks:</strong> ${tracks.length}</li>
        <li><strong>Total Notes:</strong> ${totalNotes}</li>
        <li><strong>Duration:</strong> ${maxDuration.toFixed(2)} beats</li>
      </ul>
    </div>
  `;
}

// Observable cell for language selection
export function languageSelector() {
  const selector = html`
    <label>
      Language: 
      <select>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
      </select>
    </label>
  `;
  
  selector.onchange = () => {
    selector.value = selector.querySelector('select').value;
    selector.dispatchEvent(new CustomEvent("input"));
  };
  
  // Set initial value
  selector.value = "en";
  
  return selector;
}

// Example of reactive Observable notebook structure:
/*
// Cell 1: Import and setup
import {dawWidget, createJmonData, jmonViewer, projectStats, languageSelector} from "./solid-daw-integration.js"

// Cell 2: Language selection
viewof language = languageSelector()

// Cell 3: JMON data creation
viewof customJmon = createJmonData()

// Cell 4: Choose data source
jmonData = customJmon || sampleJmon

// Cell 5: Main DAW widget
viewof daw = dawWidget(jmonData)

// Cell 6: Project statistics
projectStats(jmonData)

// Cell 7: Current project data viewer
jmonViewer(daw.value())

// Cell 8: Export current project
html`<button onclick=${() => {
  const data = daw.value();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (data.name || 'project') + '.jmon';
  a.click();
  URL.revokeObjectURL(url);
}}>Export JMON</button>`
*/

// For ES modules
export {sampleJmon, createDAWWidget};