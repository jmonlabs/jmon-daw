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
    
    // Also update the audio engine effect parameters directly
    if (window.audioEngine && window.audioEngine.isInitialized) {
      const effectIndex = currentMasterEffects.findIndex(e => e.id === effectId);
      if (effectIndex !== -1) {
        const audioEffectId = `master_effect_${effectIndex}`;
        
        // Update each parameter in the effect's options
        if (updates.options) {
          Object.entries(updates.options).forEach(([param, value]) => {
            console.log(`🎛️ Updating master effect parameter: ${audioEffectId}.${param} = ${value}`);
            window.audioEngine.updateEffectParameter(audioEffectId, param, value);
          });
        }
      }
    }
  };

  // Wrapper for EffectControls compatibility (expects trackId, effectId, updates)
  const updateMasterEffectWrapper = (trackId, effectId, updates) => {
    updateMasterEffect(effectId, updates);
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

  const masterEffects = () => store.masterBusEffects || [];

  return (
    <div 
      style="
        position: fixed;
        top: 3rem;
        right: 0;
        width: 250px;
        height: calc(100vh - 3rem);
        background-color: var(--color-bg-surface);
        border-left: 1px solid var(--color-border-primary);
        display: flex;
        flex-direction: column;
        z-index: var(--z-dialog);
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      "
    >
      {/* Compact Header */}
      <div 
        style="
          height: 2.5rem;
          padding: 0 0.75rem;
          background-color: var(--color-accent-primary);
          color: var(--color-text-on-accent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 600;
        "
      >
        <span>MASTER</span>
        <button
          onClick={store.toggleMasterBus}
          style="
            width: 1.25rem;
            height: 1.25rem;
            padding: 0;
            border: none;
            background: rgba(255, 255, 255, 0.2);
            color: var(--color-text-on-accent);
            border-radius: var(--radius-sm);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
          "
          title="Close Master"
        >
          ×
        </button>
      </div>

      {/* Master Level Control */}
      <div 
        style="
          padding: 0.75rem;
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border-primary);
        "
      >
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="
            width: 2rem;
            height: 1.5rem;
            background-color: var(--color-bg-surface);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 600;
            color: var(--color-text-secondary);
          ">
            LVL
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={store.masterVolume || 0.8}
            onChange={(e) => store.setMasterVolume(parseFloat(e.target.value))}
            style="
              flex: 1;
              height: 1.5rem;
              accent-color: var(--color-accent-primary);
            "
          />
          <div style="
            min-width: 2rem;
            text-align: right;
            font-size: 0.7rem;
            color: var(--color-text-secondary);
            font-family: monospace;
          ">
            {Math.round((store.masterVolume || 0.8) * 100)}
          </div>
        </div>
      </div>

      {/* Effects Stack - Compact Design */}
      <div style="flex: 1; overflow-y: auto;">
        {/* Add Effect Control */}
        <div style="
          padding: 0.75rem;
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border-primary);
        ">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addMasterEffect(e.target.value);
                e.target.value = '';
              }
            }}
            style="
              width: 100%;
              height: 1.75rem;
              padding: 0 0.5rem;
              border: 1px solid var(--color-border-primary);
              border-radius: var(--radius-sm);
              background-color: var(--color-bg-surface);
              color: var(--color-text-primary);
              font-size: 0.75rem;
            "
          >
            <option value="">+ Add FX</option>
            <For each={effectTypes}>
              {(effectType) => (
                <option value={effectType}>{effectType}</option>
              )}
            </For>
          </select>
        </div>

        {/* Effects List - Compact Stack Style */}
        <div style="padding: 0.5rem;">
          <For each={masterEffects()}>
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
                  margin-bottom: 0.5rem;
                  cursor: move;
                  transition: all 0.15s ease;
                  ${dragOverIndex() === index() ? 'transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);' : ''}
                `}
              >
                {/* Effect Header - Compact */}
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 0.5rem 0.75rem;
                  background-color: var(--color-bg-secondary);
                  border-bottom: 1px solid var(--color-border-primary);
                ">
                  <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <div style="
                      width: 4px;
                      height: 12px;
                      background: repeating-linear-gradient(
                        to bottom,
                        var(--color-text-muted) 0px,
                        var(--color-text-muted) 1px,
                        transparent 1px,
                        transparent 3px
                      );
                    "></div>
                    <span style="
                      font-size: 0.75rem;
                      font-weight: 500;
                      color: var(--color-text-primary);
                    ">
                      {effect.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMasterEffect(effect.id)}
                    style="
                      width: 1.25rem;
                      height: 1.25rem;
                      padding: 0;
                      border: none;
                      background-color: transparent;
                      color: var(--color-text-muted);
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 0.7rem;
                      border-radius: var(--radius-sm);
                    "
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-primary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
                
                {/* Effect Controls - Compact */}
                <div style="padding: 0.75rem;">
                  <EffectControls
                    effect={effect}
                    trackId="master"
                    updateEffect={updateMasterEffectWrapper}
                  />
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Empty State - Compact */}
        <Show when={masterEffects().length === 0}>
          <div style="
            text-align: center;
            padding: 2rem 1rem;
            color: var(--color-text-muted);
            font-size: 0.8rem;
          ">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.3;">🎛️</div>
            <div>No effects</div>
          </div>
        </Show>
      </div>
    </div>
  );
}
