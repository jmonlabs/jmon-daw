import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import type { Project, Track, Clip } from '../types';

export const createProjectStore = () => {
  const [project, setProject] = createStore<Project>({
    id: 'default-project',
    name: 'New Project',
    tempo: 120,
    timeSignature: [4, 4],
    tracks: [],
    masterVolume: 0.8,
    masterPan: 0,
    masterEffects: []
  });

  const [isDirty, setIsDirty] = createSignal(false);

  const addTrack = (track: Omit<Track, 'id'>) => {
    const newTrack: Track = {
      ...track,
      id: crypto.randomUUID(),
      clips: [],
      effects: []
    };
    setProject('tracks', tracks => [...tracks, newTrack]);
    setIsDirty(true);
  };

  const removeTrack = (trackId: string) => {
    setProject('tracks', tracks => tracks.filter(t => t.id !== trackId));
    setIsDirty(true);
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    setProject('tracks', track => track.id === trackId, updates);
    setIsDirty(true);
  };

  const addClip = (trackId: string, clip: Omit<Clip, 'id' | 'trackId'>) => {
    const newClip: Clip = {
      ...clip,
      id: crypto.randomUUID(),
      trackId
    };
    setProject('tracks', track => track.id === trackId, 'clips', clips => [...clips, newClip]);
    setIsDirty(true);
  };

  const removeClip = (clipId: string) => {
    setProject('tracks', tracks => 
      tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId)
      }))
    );
    setIsDirty(true);
  };

  const updateClip = (clipId: string, updates: Partial<Clip>) => {
    setProject('tracks', tracks => 
      tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => 
          clip.id === clipId ? { ...clip, ...updates } : clip
        )
      }))
    );
    setIsDirty(true);
  };

  const setTempo = (tempo: number) => {
    setProject('tempo', tempo);
    setIsDirty(true);
  };

  const setTimeSignature = (timeSignature: [number, number]) => {
    setProject('timeSignature', timeSignature);
    setIsDirty(true);
  };

  return {
    project,
    isDirty,
    addTrack,
    removeTrack,
    updateTrack,
    addClip,
    removeClip,
    updateClip,
    setTempo,
    setTimeSignature,
    setProject,
    setIsDirty
  };
};

export type ProjectStore = ReturnType<typeof createProjectStore>;