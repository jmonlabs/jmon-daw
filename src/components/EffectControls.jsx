import { Show } from 'solid-js';

export default function EffectControls(props) {
  const { effect, trackId, updateEffect } = props;

  const handleParamChange = (param, value) => {
    updateEffect(trackId, effect.id, {
      options: { ...effect.options, [param]: parseFloat(value) }
    });
  };

  const renderControls = () => {
    switch (effect.type) {
      case 'Reverb':
        return (
          <>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="is-size-7" style="color: var(--text-muted);">Wet</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.options.wet || 0.3}
                onChange={(e) => handleParamChange('wet', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="is-size-7" style="min-width: 2rem; text-align: right; color: var(--text-primary);">{Math.round((effect.options.wet || 0.3) * 100)}</span>
            </div>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="is-size-7" style="color: var(--text-muted);">Room</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.options.roomSize || 0.7}
                onChange={(e) => handleParamChange('roomSize', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="is-size-7" style="min-width: 2rem; text-align: right; color: var(--text-primary);">{Math.round((effect.options.roomSize || 0.7) * 100)}</span>
            </div>
          </>
        );

      case 'Delay':
        return (
          <>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Wet</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.options.wet || 0.3}
                onChange={(e) => handleParamChange('wet', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{Math.round((effect.options.wet || 0.3) * 100)}</span>
            </div>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Feedback</span>
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.05"
                value={effect.options.feedback || 0.4}
                onChange={(e) => handleParamChange('feedback', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{Math.round((effect.options.feedback || 0.4) * 100)}</span>
            </div>
          </>
        );

      case 'Filter':
        return (
          <>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Freq</span>
              <input
                type="range"
                min="20"
                max="20000"
                step="100"
                value={effect.options.frequency || 1000}
                onChange={(e) => handleParamChange('frequency', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{Math.round(effect.options.frequency || 1000)}</span>
            </div>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Q</span>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={effect.options.Q || 1}
                onChange={(e) => handleParamChange('Q', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{(effect.options.Q || 1).toFixed(1)}</span>
            </div>
          </>
        );

      case 'Distortion':
        return (
          <>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Wet</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.options.wet || 0.5}
                onChange={(e) => handleParamChange('wet', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{Math.round((effect.options.wet || 0.5) * 100)}</span>
            </div>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="has-text-grey-light is-size-7">Drive</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={effect.options.distortion || 0.4}
                onChange={(e) => handleParamChange('distortion', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="has-text-light is-size-7" style="min-width: 2rem; text-align: right;">{Math.round((effect.options.distortion || 0.4) * 100)}</span>
            </div>
          </>
        );

      case 'Compressor':
        return (
          <>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="is-size-7" style="color: var(--text-muted);">Thresh</span>
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={effect.options.threshold || -24}
                onChange={(e) => handleParamChange('threshold', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="is-size-7" style="min-width: 2rem; text-align: right; color: var(--text-primary);">{effect.options.threshold || -24}</span>
            </div>
            <div class="is-flex is-justify-content-space-between is-align-items-center">
              <span class="is-size-7" style="color: var(--text-muted);">Ratio</span>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={effect.options.ratio || 4}
                onChange={(e) => handleParamChange('ratio', e.target.value)}
                class="slider mr-2"
                style="width: 4rem; accent-color: var(--primary-accent);"
              />
              <span class="is-size-7" style="min-width: 2rem; text-align: right; color: var(--text-primary);">{effect.options.ratio || 4}</span>
            </div>
          </>
        );

      default:
        return (
          <div class="is-flex is-justify-content-space-between is-align-items-center">
            <span class="is-size-7" style="color: var(--text-muted);">Wet</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={effect.options.wet || 0.5}
              onChange={(e) => handleParamChange('wet', e.target.value)}
              class="slider mr-2"
              style="width: 4rem; accent-color: var(--primary-accent);"
            />
            <span class="is-size-7" style="min-width: 2rem; text-align: right; color: var(--text-primary);">{Math.round((effect.options.wet || 0.5) * 100)}</span>
          </div>
        );
    }
  };

  return (
    <div>
      {renderControls()}
    </div>
  );
}