import { Show, onMount, onCleanup, For } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { keyboardHandler } from '../utils/keyboardHandler';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-solid';
import Transport from './Transport';
import TrackRow from './TrackRow';
import JmonEditor from './JmonEditor';
import StatusBar from './StatusBar';

export default function Layout() {
  const store = useDawStore();

  onMount(() => {
    keyboardHandler.init(store);
    store.loadDemo();
  });

  onCleanup(() => {
    keyboardHandler.destroy();
  });

  return (
    <div class="daw-container" style="height: 100vh; background-color: #1a1a1a; display: flex; flex-direction: column;">
      
      {/* Header - Transport Controls */}
      <header style="height: 4rem; border-bottom: 1px solid #404040; background-color: #2b2b2b; flex-shrink: 0;">
        <Transport />
      </header>

      {/* Main Content Area */}
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        
        {/* Header Area - Timeline Ruler */}
        <div 
          style="
            height: 40px;
            background-color: #2b2b2b;
            border-bottom: 1px solid #404040;
            display: flex;
          "
        >
          {/* Header spacer for track info */}
          <div style="width: 200px; border-right: 1px solid #404040;"></div>
          
          {/* Timeline ruler */}
          <div style="flex: 1; background-color: #2b2b2b; position: relative; overflow: hidden;">
            {(() => {
              const beatWidth = 80 * store.timelineZoom;
              const barWidth = beatWidth * 4;
              const markers = [];
              const rulerWidth = 5000; // Much wider to support longer compositions
              const visibleBars = Math.ceil((rulerWidth + store.timelineScroll) / barWidth) + 10;
              const startBar = Math.floor(store.timelineScroll / barWidth);
              
              for (let bar = Math.max(0, startBar); bar < startBar + visibleBars; bar++) {
                const barX = bar * barWidth - store.timelineScroll;
                if (barX > -barWidth && barX < rulerWidth) {
                  markers.push({
                    x: barX,
                    label: `${bar + 1}`,
                    type: 'bar'
                  });
                  
                  // Beat markers
                  for (let beat = 1; beat < 4; beat++) {
                    const beatX = barX + beat * beatWidth;
                    if (beatX > -beatWidth && beatX < rulerWidth) {
                      markers.push({
                        x: beatX,
                        label: `${beat + 1}`,
                        type: 'beat'
                      });
                    }
                  }
                }
              }
              
              return markers.map((marker, i) => (
                <div key={i} style={`
                  position: absolute;
                  left: ${marker.x}px;
                  top: 0;
                  bottom: 0;
                  display: flex;
                  align-items: flex-end;
                  pointer-events: none;
                `}>
                  <div style={`
                    width: 1px;
                    height: ${marker.type === 'bar' ? '100%' : '75%'};
                    background-color: ${marker.type === 'bar' ? '#9ca3af' : '#6b7280'};
                    opacity: ${marker.type === 'bar' ? '0.3' : '0.2'};
                  `} />
                  {marker.type === 'bar' && (
                    <span style="
                      color: #9ca3af;
                      font-family: Monaco, monospace;
                      font-size: 0.75rem;
                      font-weight: 600;
                      margin-left: 4px;
                      padding-bottom: 2px;
                    ">
                      {marker.label}
                    </span>
                  )}
                </div>
              ));
            })()}
          </div>
          
          {/* Effects toggle button */}
          <Show when={!store.rightSidebarOpen}>
            <div style="width: 48px; display: flex; align-items: center; justify-content: center; background-color: #2b2b2b; border-left: 1px solid #404040;">
              <button
                onClick={store.toggleRightSidebar}
                class="button is-dark is-small"
                title="Show Effects"
                style="width: 2rem; height: 2rem; border: none;"
              >
                <PanelLeftOpen size={16} color="white" />
              </button>
            </div>
          </Show>
          
          <Show when={store.rightSidebarOpen}>
            <div style="width: 250px; display: flex; align-items: center; justify-content: flex-start; padding-left: 0.5rem; background-color: #2b2b2b; border-left: 1px solid #404040; gap: 0.5rem;">
              <button
                onClick={store.toggleRightSidebar}
                class="button is-dark is-small"
                title="Hide Effects"
                style="width: 2rem; height: 2rem; border: none;"
              >
                <PanelLeftClose size={16} color="white" />
              </button>
              <button
                onClick={store.toggleMasterBus}
                class={`button is-small ${store.masterBusOpen ? 'is-primary' : 'is-dark'}`}
                title="Master Bus"
                style="height: 2rem; border: none; font-size: 0.7rem;"
              >
                Master
              </button>
            </div>
          </Show>
        </div>

        {/* Tracks Area */}
        <div 
          style="flex: 1; overflow-y: auto;"
          onWheel={(e) => {
            if (e.shiftKey) {
              // Horizontal scroll with Shift+wheel
              e.preventDefault();
              const scrollDelta = e.deltaY;
              const newScroll = Math.max(0, store.timelineScroll + scrollDelta);
              store.setTimelineScroll(newScroll);
            } else if (e.ctrlKey || e.metaKey) {
              // Zoom with Ctrl/Cmd+wheel
              e.preventDefault();
              const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
              const newZoom = Math.max(0.1, Math.min(5, store.timelineZoom + zoomDelta));
              store.setTimelineZoom(newZoom);
            }
          }}
        >
          <For each={store.tracks}>
            {(track, index) => {
              // Make zoom reactive
              const beatWidth = () => 80 * store.timelineZoom;
              const barWidth = () => 80 * store.timelineZoom * 4;
              const verticalZoom = () => store.verticalZoom;
              
              // Generate grid markers for tracks
              const gridMarkers = () => {
                const markers = [];
                const currentBarWidth = barWidth();
                const currentBeatWidth = beatWidth();
                const totalWidth = 5000;
                const visibleBars = Math.ceil((totalWidth + store.timelineScroll) / currentBarWidth) + 10;
                const startBar = Math.floor(store.timelineScroll / currentBarWidth);
                
                for (let bar = Math.max(0, startBar); bar < startBar + visibleBars; bar++) {
                  const barX = bar * currentBarWidth;
                  if (barX >= 0 && barX < totalWidth) {
                    markers.push({ x: barX, type: 'bar' });
                    
                    // Beat markers
                    for (let beat = 1; beat < 4; beat++) {
                      const beatX = barX + beat * currentBeatWidth;
                      if (beatX >= 0 && beatX < totalWidth) {
                        markers.push({ x: beatX, type: 'beat' });
                      }
                    }
                  }
                }
                
                return markers;
              };
              
              return (
                <TrackRow 
                  track={track}
                  index={index()}
                  beatWidth={beatWidth}
                  barWidth={barWidth}
                  timelineScroll={store.timelineScroll}
                  verticalZoom={verticalZoom}
                  gridMarkers={gridMarkers()}
                />
              );
            }}
          </For>

          {/* Empty state */}
          {store.tracks.length === 0 && (
            <div 
              style="
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 1.1rem;
              "
            >
              No tracks loaded. Use Menu → Load Demo to get started.
            </div>
          )}
        </div>

        {/* Effect Parameter Editor - Overlay */}
        <Show when={store.selectedEffect}>
          <div 
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 400px; 
              min-height: 300px;
              max-height: 80vh;
              background-color: #2b2b2b; 
              border: 1px solid #404040;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              z-index: 300;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            "
          >
            <div style="padding: 1rem; border-bottom: 1px solid #404040; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #f5f5f5; font-weight: 600; font-size: 1.1rem;">
                {store.selectedEffect?.name || 'Effect'} Parameters
              </span>
              <button
                onClick={store.closeEffectEditor}
                class="button is-dark is-small"
                title="Close"
                style="border: none;"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div style="flex: 1; padding: 1rem; overflow-y: auto;">
              {/* Effect Parameters Content */}
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                
                {/* Effect/Synth Type */}
                <div>
                  <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                    {store.selectedEffect?.type === 'synth' ? 'Synth Type' : 'Effect Type'}
                  </label>
                  <div class="select" style="width: 100%;">
                    <select 
                      style="width: 100%; background-color: #1a1a1a; color: white; border-color: #404040;"
                      value={store.selectedEffect?.name || ''}
                      onChange={(e) => {
                        const newEffect = { ...store.selectedEffect, name: e.target.value };
                        store.setSelectedEffect(newEffect);
                      }}
                    >
                      <Show when={store.selectedEffect?.type === 'synth'}>
                        <option value="Synth">Basic Synth</option>
                        <option value="AMSynth">AM Synth</option>
                        <option value="FMSynth">FM Synth</option>
                        <option value="Sampler">Sampler</option>
                        <option value="MembraneSynth">Membrane Synth</option>
                        <option value="MetalSynth">Metal Synth</option>
                        <option value="MonoSynth">Mono Synth</option>
                        <option value="DuoSynth">Duo Synth</option>
                      </Show>
                      <Show when={store.selectedEffect?.type === 'effect'}>
                        <option value="Reverb">Reverb</option>
                        <option value="Delay">Delay</option>
                        <option value="Chorus">Chorus</option>
                        <option value="Distortion">Distortion</option>
                        <option value="Filter">Filter</option>
                        <option value="Compressor">Compressor</option>
                        <option value="PitchShift">Pitch Shift</option>
                        <option value="Phaser">Phaser</option>
                        <option value="Tremolo">Tremolo</option>
                        <option value="Vibrato">Vibrato</option>
                      </Show>
                    </select>
                  </div>
                </div>
                
                {/* Common Parameters */}
                <Show when={store.selectedEffect?.type === 'effect'}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Wet/Dry Mix</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={store.effectParams?.wet || 0.5} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('wet', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.wet || 0.5) * 100)}%
                      </span>
                    </div>
                  </div>
                </Show>
                
                <Show when={store.selectedEffect?.type === 'synth'}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Volume</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="0.01" 
                        value={store.effectParams?.volume || 1} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('volume', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.volume || 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </Show>
                
                {/* Effect-specific parameters based on type */}
                <Show when={store.selectedEffect?.name === 'Reverb'}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Room Size</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={store.effectParams?.roomSize || 0.7} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('roomSize', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.roomSize || 0.7) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Decay Time</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0.1" 
                        max="10" 
                        step="0.1" 
                        value={store.effectParams?.decay || 2.5} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('decay', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {(store.effectParams?.decay || 2.5).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </Show>
                
                <Show when={store.selectedEffect?.name === 'Delay'}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Delay Time</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0.01" 
                        max="1" 
                        step="0.01" 
                        value={store.effectParams?.delayTime || 0.25} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('delayTime', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.delayTime || 0.25) * 1000)}ms
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Feedback</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0" 
                        max="0.95" 
                        step="0.01" 
                        value={store.effectParams?.feedback || 0.3} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('feedback', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {Math.round((store.effectParams?.feedback || 0.3) * 100)}%
                      </span>
                    </div>
                  </div>
                </Show>
                
                <Show when={store.selectedEffect?.name === 'Filter'}>
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Cutoff Frequency</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="20" 
                        max="20000" 
                        step="1" 
                        value={store.effectParams?.frequency || 1000} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('frequency', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 60px;">
                        {Math.round(store.effectParams?.frequency || 1000)}Hz
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">Resonance</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <input 
                        type="range" 
                        min="0.5" 
                        max="10" 
                        step="0.1" 
                        value={store.effectParams?.Q || 1} 
                        style="flex: 1;" 
                        onInput={(e) => store.updateEffectParam('Q', parseFloat(e.target.value))}
                      />
                      <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                        {(store.effectParams?.Q || 1).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid #404040; display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button
                onClick={store.closeEffectEditor}
                class="button is-dark"
                style="border: none;"
              >
                Cancel
              </button>
              <button
                onClick={store.saveEffectChanges}
                class="button is-primary"
                style="border: none;"
              >
                Apply
              </button>
            </div>
          </div>
        </Show>

        {/* Backdrop for effect editor */}
        <Show when={store.selectedEffect}>
          <div 
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 250;
            "
            onClick={store.closeEffectEditor}
          />
        </Show>

        {/* Master Bus Panel - Overlay */}
        <Show when={store.masterBusOpen}>
          <div 
            style="
              position: absolute;
              top: 0;
              right: 0;
              width: 300px; 
              height: 100%; 
              background-color: #2b2b2b; 
              border-left: 1px solid #404040;
              display: flex;
              flex-direction: column;
              z-index: 1100;
              box-shadow: -2px 0 10px rgba(0,0,0,0.3);
            "
          >
            <div style="padding: 0.75rem; border-bottom: 1px solid #404040; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #f5f5f5; font-weight: 600;">Master Bus</span>
              <button
                onClick={store.toggleMasterBus}
                class="button is-dark is-small"
                title="Close"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div style="flex: 1; padding: 1rem; overflow-y: auto;">
              {/* Master Bus Content */}
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                
                {/* Master Volume */}
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: #f5f5f5; min-width: 60px; font-size: 0.8rem;">Volume</span>
                  <input type="range" min="0" max="1" step="0.01" value="0.8" style="flex: 1;" />
                  <span style="color: #999; font-size: 0.7rem; min-width: 30px;">80%</span>
                </div>
                
                {/* Master Effects Chain */}
                <div style="border-top: 1px solid #404040; padding-top: 0.5rem;">
                  <h4 style="color: #f5f5f5; font-size: 0.8rem; margin-bottom: 0.5rem;">Effects Chain</h4>
                  
                  <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <div class="tag is-success is-small" style="font-size: 0.7rem; width: 100%; justify-content: center;">
                      High-Pass Filter
                    </div>
                    <div class="tag is-success is-small" style="font-size: 0.7rem; width: 100%; justify-content: center;">
                      EQ (4-Band)
                    </div>
                    <div class="tag is-success is-small" style="font-size: 0.7rem; width: 100%; justify-content: center;">
                      Compressor
                    </div>
                    <div class="tag is-success is-small" style="font-size: 0.7rem; width: 100%; justify-content: center;">
                      Limiter
                    </div>
                  </div>
                  
                  <button
                    class="button is-dark is-small"
                    style="width: 100%; height: 1.5rem; padding: 0; font-size: 0.7rem; margin-top: 0.5rem;"
                    title="Add Master Effect"
                  >
                    <i class="fas fa-plus"></i> Add Effect
                  </button>
                </div>
                
                {/* Master Meters */}
                <div style="border-top: 1px solid #404040; padding-top: 0.5rem;">
                  <h4 style="color: #f5f5f5; font-size: 0.8rem; margin-bottom: 0.5rem;">Output Meters</h4>
                  <div style="display: flex; gap: 0.5rem;">
                    <div style="flex: 1; height: 100px; background-color: #1a1a1a; border: 1px solid #404040; position: relative;">
                      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, #22c55e 0%, #eab308 70%, #ef4444 100%);"></div>
                      <span style="position: absolute; bottom: 2px; left: 2px; font-size: 0.6rem; color: white;">L</span>
                    </div>
                    <div style="flex: 1; height: 100px; background-color: #1a1a1a; border: 1px solid #404040; position: relative;">
                      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 65%; background: linear-gradient(to top, #22c55e 0%, #eab308 70%, #ef4444 100%);"></div>
                      <span style="position: absolute; bottom: 2px; left: 2px; font-size: 0.6rem; color: white;">R</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* JMON Editor Panel - Overlay */}
        <Show when={store.jmonEditorOpen}>
          <div 
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 400px; 
              height: 100%; 
              background-color: #2b2b2b; 
              border-right: 1px solid #404040;
              display: flex;
              flex-direction: column;
              z-index: 100;
              box-shadow: 2px 0 10px rgba(0,0,0,0.3);
            "
          >
            <div style="padding: 0.75rem; border-bottom: 1px solid #404040; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #f5f5f5; font-weight: 600;">JMON Editor</span>
              <button
                onClick={store.toggleJmonEditor}
                class="button is-dark is-small"
                title="Close"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div style="flex: 1; overflow: hidden;">
              <JmonEditor />
            </div>
          </div>
        </Show>

      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}