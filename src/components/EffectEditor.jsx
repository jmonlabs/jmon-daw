import { Show } from "solid-js";

export default function EffectEditor({ store }) {
  return (
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
          background-color: var(--color-bg-modal);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          z-index: 300;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        "
      >
        <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem;">
            {store.selectedEffect?.name || "Effect"} Parameters
          </span>
          <button
            onClick={store.closeEffectEditor}
            class="button is-dark is-small"
            title="Close"
            style="border: none;"
          >
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div style="flex: 1; padding: 1rem; overflow-y: auto;">
          {/* Effect Parameters Content */}
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            {/* Effect/Synth Type */}
            <div>
              <label style="color: var(--text-primary); font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                {store.selectedEffect?.type === "synth"
                  ? "Synth Type"
                  : "Effect Type"}
              </label>
              <div class="select" style="width: 100%;">
                <select
                  style="width: 100%; background-color: var(--surface-bg); color: var(--text-primary); border-color: var(--border-color);"
                  value={store.selectedEffect?.name || ""}
                  onChange={(e) => {
                    const newEffect = {
                      ...store.selectedEffect,
                      name: e.target.value,
                    };
                    store.setSelectedEffect(newEffect);
                  }}
                >
                  <Show when={store.selectedEffect?.type === "synth"}>
                    <option value="Synth">Basic Synth</option>
                    <option value="PolySynth">Poly Synth</option>
                    <option value="MonoSynth">Mono Synth</option>
                    <option value="AMSynth">AM Synth</option>
                    <option value="FMSynth">FM Synth</option>
                    <option value="DuoSynth">Duo Synth</option>
                    <option value="PluckSynth">Pluck Synth</option>
                    <option value="NoiseSynth">Noise Synth</option>
                    <option value="MetalSynth">Metal Synth</option>
                    <option value="MembraneSynth">Membrane Synth</option>
                    <option value="Sampler">Sampler</option>
                  </Show>
                  <Show when={store.selectedEffect?.type === "effect"}>
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
            <Show when={store.selectedEffect?.type === "effect"}>
              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Wet/Dry Mix
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={store.effectParams?.wet || 0.5}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "wet",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {Math.round((store.effectParams?.wet || 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </Show>

            <Show when={store.selectedEffect?.type === "synth"}>
              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Volume
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={store.effectParams?.volume || 1}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "volume",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {Math.round((store.effectParams?.volume || 1) * 100)}%
                  </span>
                </div>
              </div>
            </Show>

            {/* Effect-specific parameters based on type */}
            <Show when={store.selectedEffect?.name === "Reverb"}>
              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Room Size
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={store.effectParams?.roomSize || 0.7}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "roomSize",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {Math.round(
                      (store.effectParams?.roomSize || 0.7) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>

              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Decay Time
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={store.effectParams?.decay || 2.5}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "decay",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {(store.effectParams?.decay || 2.5).toFixed(1)}s
                  </span>
                </div>
              </div>
            </Show>

            <Show when={store.selectedEffect?.name === "Delay"}>
              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Delay Time
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={store.effectParams?.delayTime || 0.25}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "delayTime",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {Math.round(
                      (store.effectParams?.delayTime || 0.25) * 1000,
                    )}
                    ms
                  </span>
                </div>
              </div>

              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Feedback
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0"
                    max="0.95"
                    step="0.01"
                    value={store.effectParams?.feedback || 0.3}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "feedback",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {Math.round(
                      (store.effectParams?.feedback || 0.3) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>
            </Show>

            <Show when={store.selectedEffect?.name === "Filter"}>
              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Cutoff Frequency
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="20"
                    max="20000"
                    step="1"
                    value={store.effectParams?.frequency || 1000}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "frequency",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 60px;">
                    {Math.round(store.effectParams?.frequency || 1000)}Hz
                  </span>
                </div>
              </div>

              <div>
                <label style="color: #f5f5f5; font-size: 0.9rem; margin-bottom: 0.5rem; display: block;">
                  Resonance
                </label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={store.effectParams?.Q || 1}
                    style="flex: 1;"
                    onInput={(e) =>
                      store.updateEffectParam(
                        "Q",
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <span style="color: #999; font-size: 0.8rem; min-width: 40px;">
                    {(store.effectParams?.Q || 1).toFixed(1)}
                  </span>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div style="padding: 1rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          {/* Delete button - Only for effects */}
          <Show when={store.selectedEffect?.type === "effect"}>
            <button
              onClick={() => {
                const effect = store.selectedEffect;
                if (effect && effect.trackId && effect.effectIndex !== undefined) {
                  // Find the track and remove the effect
                  const track = store.tracks.find(t => t.id === effect.trackId);
                  if (track) {
                    const updatedEffects = track.effects.filter(
                      (_, i) => i !== effect.effectIndex
                    );
                    store.updateTrack(effect.trackId, { effects: updatedEffects });
                    store.closeEffectEditor();
                  }
                }
              }}
              class="button is-danger"
              style="border: none;"
              title="Delete Effect"
            >
              <span class="icon">
                <i class="fa-solid fa-trash"></i>
              </span>
              <span>Delete</span>
            </button>
          </Show>
          
          <div style="display: flex; gap: 0.5rem;">
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
      </div>
    </Show>
  );
}
