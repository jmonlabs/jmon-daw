import { useDawStore } from '../stores/dawStore';

export default function StatusBar() {
  const store = useDawStore();

  const getTotalNotes = () => {
    return store.tracks.reduce((total, track) => total + (track.notes?.length || 0), 0);
  };

  const getActiveEffects = () => {
    return store.tracks.reduce((total, track) => total + (track.effects?.length || 0), 0);
  };

  return (
    <div class="is-flex is-justify-content-space-between is-align-items-center px-4 has-text-grey-light is-size-7" style="height: 1.5rem; border-top: 1px solid #404040; background-color: #2b2b2b;">
      <div class="is-flex is-align-items-center">
        <span class="mr-4">Tracks: {store.tracks.length}</span>
        <span class="mr-4">Notes: {getTotalNotes()}</span>
        <span class="mr-4">Effects: {getActiveEffects()}</span>
        <span>BPM: {store.bpm}</span>
      </div>
      
      <div class="is-flex is-align-items-center">
        {store.isLooping && (
          <span class="has-text-warning mr-4">
            Loop: {store.loopStart.toFixed(1)} - {store.loopEnd.toFixed(1)}
          </span>
        )}
        <span class="mr-4">Ctrl+Scroll: Zoom • Shift+Click: Set Loop Points • Space: Play/Pause</span>
        <span class="has-text-primary">JMON DAW v1.0</span>
      </div>
    </div>
  );
}