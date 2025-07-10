import { For, createSignal } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import EffectControls from './EffectControls';

export default function Mixer() {
  const store = useDawStore();
  const [draggedEffect, setDraggedEffect] = createSignal(null);

  const effectTypes = [
    'Reverb', 'Delay', 'Chorus', 'Phaser', 'Filter', 'Distortion', 
    'Compressor', 'Tremolo', 'BitCrusher'
  ];

  const handleVolumeChange = (trackId, volume) => {
    store.updateTrack(trackId, { volume: parseFloat(volume) });
  };

  const addEffect = (trackId, effectType = 'Reverb') => {
    const track = store.tracks.find(t => t.id === trackId);
    if (track) {
      const defaultOptions = getDefaultEffectOptions(effectType);
      const newEffect = {
        id: `effect_${Date.now()}`,
        type: effectType,
        options: defaultOptions
      };
      const updatedEffects = [...(track.effects || []), newEffect];
      store.updateTrack(trackId, { effects: updatedEffects });
    }
  };

  const getDefaultEffectOptions = (type) => {
    switch (type) {
      case 'Reverb': return { wet: 0.3, roomSize: 0.7, dampening: 0.3 };
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

  const removeEffect = (trackId, effectId) => {
    const track = store.tracks.find(t => t.id === trackId);
    if (track) {
      const updatedEffects = track.effects.filter(e => e.id !== effectId);
      store.updateTrack(trackId, { effects: updatedEffects });
    }
  };

  const updateEffect = (trackId, effectId, updates) => {
    const track = store.tracks.find(t => t.id === trackId);
    if (track) {
      const updatedEffects = track.effects.map(e => 
        e.id === effectId ? { ...e, ...updates } : e
      );
      store.updateTrack(trackId, { effects: updatedEffects });
    }
  };

  return (
    <div class="is-flex is-flex-direction-column" style="height: 100%;">
      <div class="p-4 has-border-bottom-dark">
        <h3 class="title is-5 has-text-light mb-2">Mixer</h3>
      </div>

      <div class="is-flex-grow-1 is-overflow-auto p-4">
        <For each={store.tracks}>
          {(track) => (
            <div class="box has-background-grey-darker p-4 mb-4" style="border: 1px solid var(--border-color);">
              {/* Track Header */}
              <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <h4 class="has-text-weight-medium has-text-light is-size-6">{track.name}</h4>
                <div class="buttons has-addons">
                  <button
                    class={`button is-small ${
                      track.muted ? 'is-danger' : 'is-ghost'
                    }`}
                  >
                    M
                  </button>
                  <button
                    class={`button is-small ${
                      track.solo ? 'is-warning' : 'is-ghost'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Volume Control */}
              <div class="field mb-4">
                <label class="label is-small has-text-grey-light">Volume</label>
                <div class="is-flex is-align-items-center">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => handleVolumeChange(track.id, e.target.value)}
                    class="slider is-fullwidth mr-2"
                    style="accent-color: #007aff;"
                  />
                  <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">
                    {Math.round(track.volume * 100)}
                  </span>
                </div>
              </div>

              {/* Synth Info */}
              <div class="field mb-4">
                <label class="label is-small has-text-grey-light">Synthesizer</label>
                <div class="tag is-secondary is-fullwidth" style="background-color: var(--elevated-bg); color: var(--text-primary); border: 1px solid var(--border-color);">
                  {track.synthType}
                </div>
              </div>

              {/* Effects Chain */}
              <div class="field">
                <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                  <label class="label is-small has-text-grey-light">Effects</label>
                  <div class="control">
                    <div class="select is-small">
                      <select
                        onChange={(e) => addEffect(track.id, e.target.value)}
                        class="has-background-secondary has-text-white"
                        style="border: 1px solid var(--border-active); border-radius: var(--radius-sm);"
                        value=""
                      >
                        <option value="" disabled>+ Add Effect</option>
                        <For each={effectTypes}>
                          {(effectType) => (
                            <option value={effectType}>{effectType}</option>
                          )}
                        </For>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <For each={track.effects || []}>
                    {(effect) => (
                      <div class="box has-background-dark p-2 mb-2">
                        <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                          <span class="has-text-light has-text-weight-medium is-size-7">{effect.type}</span>
                          <button
                            onClick={() => removeEffect(track.id, effect.id)}
                            class="delete is-small"
                            title="Remove Effect"
                          />
                        </div>

                        {/* Effect Controls */}
                        <EffectControls 
                          effect={effect} 
                          trackId={track.id} 
                          updateEffect={updateEffect} 
                        />
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </For>

        {store.tracks.length === 0 && (
          <div class="has-text-centered has-text-grey-light py-6">
            <p>No tracks to mix</p>
            <p class="is-size-7 mt-1">Add tracks to see mixer controls</p>
          </div>
        )}
      </div>
    </div>
  );
}