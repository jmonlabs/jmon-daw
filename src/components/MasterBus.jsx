import { Show, For, createSignal } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import EffectControls from './EffectControls';

export default function MasterBus() {
  const store = useDawStore();
  const [draggedEffect, setDraggedEffect] = createSignal(null);
  const [dragOverIndex, setDragOverIndex] = createSignal(null);

  const effectTypes = [
    'Reverb', 'Delay', 'Chorus', 'Phaser', 'Filter', 'Distortion', 
    'Compressor', 'Tremolo', 'BitCrusher', 'JCReverb', 'Freeverb'
  ];

  const getDefaultEffectOptions = (type) => {
    switch (type) {
      case 'Reverb': return { wet: 0.3, roomSize: 0.7, dampening: 0.3 };
      case 'JCReverb': return { wet: 0.3, roomSize: 0.7 };
      case 'Freeverb': return { wet: 0.3, roomSize: 0.7, dampening: 0.3 };
      case 'Delay': return { wet: 0.3, delayTime: '8n', feedback: 0.4 };
      case 'Chorus': return { wet: 0.5, depth: 0.5, rate: '4n' };
      case 'Filter': return { frequency: 1000, Q: 1, type: 'lowpass' };
      case 'Distortion': return { wet: 0.5, distortion: 0.4 };
      case 'Compressor': return { threshold: -24, ratio: 4, attack: 0.003, release: 0.1 };
      case 'Tremolo': return { wet: 1, frequency: 4, depth: 0.5 };
      case 'BitCrusher': return { wet: 0.5, bits: 4 };
      default: return {};
    }
  };

  const addMasterEffect = (effectType = 'Reverb') => {
    const newEffect = {
      id: `master_effect_${Date.now()}`,
      type: effectType,
      options: getDefaultEffectOptions(effectType)
    };
    
    // Add to master bus effects in store
    const currentMasterEffects = store.masterBusEffects || [];
    store.setMasterBusEffects([...currentMasterEffects, newEffect]);
  };

  const removeMasterEffect = (effectId) => {
    const currentMasterEffects = store.masterBusEffects || [];
    const updatedEffects = currentMasterEffects.filter(e => e.id !== effectId);
    store.setMasterBusEffects(updatedEffects);
  };

  const updateMasterEffect = (effectId, updates) => {
    const currentMasterEffects = store.masterBusEffects || [];
    const updatedEffects = currentMasterEffects.map(e => 
      e.id === effectId ? { ...e, ...updates } : e
    );
    store.setMasterBusEffects(updatedEffects);
  };

  const handleDragStart = (e, effect, index) => {
    setDraggedEffect({ effect, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedEffect(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragged = draggedEffect();
    if (!dragged) return;

    const currentMasterEffects = store.masterBusEffects || [];
    const newEffects = [...currentMasterEffects];
    const draggedItem = newEffects.splice(dragged.index, 1)[0];
    newEffects.splice(dropIndex, 0, draggedItem);
    
    store.setMasterBusEffects(newEffects);
    setDraggedEffect(null);
    setDragOverIndex(null);
  };

  const masterEffects = store.masterBusEffects || [];

  return (
    <div 
      class="master-bus-panel"
      style="
        position: fixed;
        top: 3rem;
        right: 0;
        width: 300px;
        height: calc(100vh - 3rem);
        background-color: var(--color-bg-elevated);
        border-left: 1px solid var(--color-border-primary);
        display: flex;
        flex-direction: column;
        z-index: var(--z-dialog);
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      "
    >
      {/* Header */}
      <div 
        style="
          height: 3rem;
          padding: 0 1rem;
          background-color: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border-primary);
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--color-text-primary);">
          <i class="fa-solid fa-sliders" style="margin-right: 0.5rem; color: var(--color-accent-primary);"></i>
          Master Bus
        </h3>
        <button
          onClick={store.toggleMasterBus}
          class="btn btn-secondary"
          style="
            width: 1.5rem;
            height: 1.5rem;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
          "
          title="Close Master Bus"
        >
          <i class="fa-solid fa-times"></i>
        </button>
      </div>

      {/* Master Volume */}
      <div 
        style="
          padding: 1rem;
          border-bottom: 1px solid var(--color-border-primary);
          background-color: var(--color-bg-surface);
        "
      >
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <i class="fa-solid fa-volume-high" style="color: var(--color-accent-primary);"></i>
          <span style="font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary);">Master Volume</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={store.masterVolume || 0.8}
            onChange={(e) => store.setMasterVolume(parseFloat(e.target.value))}
            style="flex: 1; accent-color: var(--color-accent-primary);"
          />
          <span style="
            font-size: 0.75rem; 
            color: var(--color-text-secondary);
            min-width: 2.5rem;
            text-align: right;
            font-family: monospace;
          ">
            {Math.round((store.masterVolume || 0.8) * 100)}%
          </span>
        </div>
      </div>

      {/* Effects Stack */}
      <div style="
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        background-color: var(--color-bg-primary);
      ">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
          <i class="fa-solid fa-magic" style="color: var(--color-accent-primary);"></i>
          <span style="font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary);">Effects Stack</span>
        </div>

        {/* Add Effect Button */}
        <div style="margin-bottom: 1rem;">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addMasterEffect(e.target.value);
                e.target.value = '';
              }
            }}
            style="
              width: 100%;
              padding: 0.5rem;
              border: 1px solid var(--color-border-primary);
              border-radius: var(--radius-sm);
              background-color: var(--color-bg-surface);
              color: var(--color-text-primary);
              font-size: 0.875rem;
            "
          >
            <option value="">+ Add Effect</option>
            <For each={effectTypes}>
              {(effectType) => (
                <option value={effectType}>{effectType}</option>
              )}
            </For>
          </select>
        </div>

        {/* Effects List */}
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <For each={masterEffects}>
            {(effect, index) => (
              <div
                draggable={true}
                onDragStart={(e) => handleDragStart(e, effect, index())}
                onDragOver={(e) => handleDragOver(e, index())}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index())}
                style={`
                  background-color: var(--color-bg-surface);
                  border: 1px solid var(--color-border-primary);
                  border-radius: var(--radius-sm);
                  padding: 0.75rem;
                  cursor: move;
                  transition: all 0.2s ease;
                  ${dragOverIndex() === index() ? 'transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);' : ''}
                `}
              >
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-grip-vertical" style="color: var(--color-text-muted); font-size: 0.75rem;"></i>
                    <span style="font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary);">
                      {effect.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMasterEffect(effect.id)}
                    style="
                      width: 1.5rem;
                      height: 1.5rem;
                      padding: 0;
                      border: none;
                      background-color: var(--color-bg-secondary);
                      color: var(--color-text-muted);
                      border-radius: var(--radius-sm);
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 0.75rem;
                    "
                    title="Remove Effect"
                  >
                    <i class="fa-solid fa-times"></i>
                  </button>
                </div>
                <EffectControls
                  effect={effect}
                  trackId="master"
                  updateEffect={updateMasterEffect}
                />
              </div>
            )}
          </For>
        </div>

        <Show when={masterEffects.length === 0}>
          <div style="
            text-align: center;
            padding: 2rem 1rem;
            color: var(--color-text-muted);
            font-size: 0.875rem;
          ">
            <i class="fa-solid fa-magic" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
            <p>No effects added yet</p>
            <p style="font-size: 0.75rem;">Add effects to shape your master sound</p>
          </div>
        </Show>
      </div>
    </div>
  );
}
