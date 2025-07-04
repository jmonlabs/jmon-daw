import { For, Show, createSignal } from 'solid-js';
import { useDawStore } from '../stores/dawStore';
import { getAvailableInstruments, getCategories } from '../utils/sampleLibrary';

export default function TrackPanel() {
  const store = useDawStore();
  const [showInstrumentPicker, setShowInstrumentPicker] = createSignal(null);
  
  const availableInstruments = getAvailableInstruments();
  const categories = getCategories();

  const handleTrackSelect = (trackId) => {
    store.setSelectedTrack(trackId);
  };

  const handleMute = (trackId) => {
    const track = store.tracks.find(t => t.id === trackId);
    if (track) {
      store.updateTrack(trackId, { muted: !track.muted });
    }
  };

  const handleSolo = (trackId) => {
    const track = store.tracks.find(t => t.id === trackId);
    if (track) {
      store.updateTrack(trackId, { solo: !track.solo });
    }
  };

  const handleNameChange = (trackId, name) => {
    store.updateTrack(trackId, { name });
  };

  const handleSynthTypeChange = (trackId, synthType) => {
    store.updateTrack(trackId, { synthType });
  };
  
  const handleInstrumentSelect = (trackId, instrumentId) => {
    // Update track to use Sampler with selected instrument
    store.updateTrack(trackId, { 
      synthType: 'Sampler',
      synthOptions: { instrument: instrumentId },
      instrumentName: availableInstruments.find(i => i.id === instrumentId)?.name || instrumentId
    });
    setShowInstrumentPicker(null);
  };
  
  const testTrackSound = async (track) => {
    try {
      // Test note based on track type
      let testNote = 'C4';
      if (track.synthType === 'Sampler' && track.synthOptions?.instrument === 'drums') {
        testNote = 'C2'; // Kick drum
      }
      await store.testNote(testNote, track.synthType, track.synthOptions);
    } catch (error) {
      console.warn('Test note failed:', error);
    }
  };

  return (
    <div class="p-3">
      <div class="level is-mobile mb-4">
        <div class="level-left">
          <h3 class="title is-5 has-text-light">Tracks</h3>
        </div>
        <div class="level-right">
          <button
            onClick={store.addTrack}
            class="button is-primary is-small"
          >
            <span class="icon is-small">
              <i class="fas fa-plus"></i>
            </span>
            <span>Add Track</span>
          </button>
        </div>
      </div>

      <div class="content">
        <For each={store.tracks}>
          {(track) => (
            <div
              class={`box p-3 mb-3 ${
                store.selectedTrack === track.id
                  ? 'has-background-primary-dark'
                  : 'has-background-grey-darker'
              }`}
              style="cursor: pointer; border: 1px solid #404040;"
              onClick={() => handleTrackSelect(track.id)}
            >
              {/* Track Name */}
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => handleNameChange(track.id, e.target.value)}
                    class="input is-small has-background-dark has-text-light"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Mute/Solo/Delete Controls */}
              <div class="field is-grouped mb-3">
                <div class="control">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMute(track.id);
                    }}
                    class={`button is-small ${
                      track.muted ? 'is-danger' : 'is-dark'
                    }`}
                  >
                    M
                  </button>
                </div>
                <div class="control">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSolo(track.id);
                    }}
                    class={`button is-small ${
                      track.solo ? 'is-warning' : 'is-dark'
                    }`}
                  >
                    S
                  </button>
                </div>
                <div class="control ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeTrack(track.id);
                    }}
                    class="button is-small is-danger is-outlined"
                    title="Delete Track"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-times"></i>
                    </span>
                  </button>
                </div>
              </div>

              {/* Synth Type Selector */}
              <div class="field">
                <label class="label is-small has-text-grey-light">Synthesizer</label>
                <div class="control">
                  <div class="select is-small is-fullwidth">
                    <select
                      value={track.synthType}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSynthTypeChange(track.id, e.target.value);
                      }}
                      class="has-background-dark has-text-light"
                    >
                      <option value="Synth">Synth</option>
                      <option value="PolySynth">PolySynth</option>
                      <option value="MonoSynth">MonoSynth</option>
                      <option value="AMSynth">AMSynth</option>
                      <option value="FMSynth">FMSynth</option>
                      <option value="DuoSynth">DuoSynth</option>
                      <option value="PluckSynth">PluckSynth</option>
                      <option value="NoiseSynth">NoiseSynth</option>
                      <option value="Sampler">Sampler</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Instrument Selector for Samplers */}
              <Show when={track.synthType === 'Sampler'}>
                <div class="field">
                  <label class="label is-small has-text-grey-light">Instrument</label>
                  <div class="control">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInstrumentPicker(showInstrumentPicker() === track.id ? null : track.id);
                      }}
                      class="button is-small is-fullwidth has-background-dark has-text-light"
                    >
                      {track.instrumentName || track.synthOptions?.instrument || 'Select Instrument...'}
                      <span class="icon is-small ml-auto">
                        <i class="fas fa-chevron-down"></i>
                      </span>
                    </button>
                    
                    <Show when={showInstrumentPicker() === track.id}>
                      <div class="dropdown-content has-background-dark" style="position: absolute; z-index: 50; margin-top: 4px; border: 1px solid #4b5563; border-radius: 4px; max-height: 200px; overflow-y: auto; min-width: 100%;">
                        <For each={categories}>
                          {(category) => (
                            <div>
                              <div class="dropdown-item has-background-grey-dark has-text-grey-lighter is-size-7 has-text-weight-semibold" style="text-transform: capitalize;">
                                {category}
                              </div>
                              <For each={availableInstruments.filter(i => i.category === category)}>
                                {(instrument) => (
                                  <a
                                    class="dropdown-item has-text-light"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInstrumentSelect(track.id, instrument.id);
                                    }}
                                  >
                                    {instrument.name}
                                  </a>
                                )}
                              </For>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
              
              {/* Test Sound Button */}
              <div class="field">
                <div class="control">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      testTrackSound(track);
                    }}
                    class="button is-small is-success is-fullwidth"
                    title="Test track sound"
                  >
                    <span class="icon is-small">
                      <i class="fas fa-play"></i>
                    </span>
                    <span>Test Sound</span>
                  </button>
                </div>
              </div>

              {/* Track Stats */}
              <div class="content is-small has-text-grey-light">
                <p class="mb-1">Notes: {track.notes?.length || 0}</p>
                <Show when={track.synthType === 'Sampler' && track.synthOptions?.instrument}>
                  <p class="has-text-info is-size-7">Instrument: {track.instrumentName || track.synthOptions.instrument}</p>
                </Show>
              </div>
            </div>
          )}
        </For>

        <Show when={store.tracks.length === 0}>
          <div class="has-text-centered has-text-grey-light py-6">
            <p class="mb-2">No tracks yet</p>
            <p class="is-size-7 mb-3">Click "Add Track" to get started</p>
            <button
              onClick={store.loadDemo}
              class="button is-dark is-small"
            >
              <span class="icon is-small">
                <i class="fas fa-play"></i>
              </span>
              <span>Load Demo</span>
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}