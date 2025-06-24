import { createStore } from 'solid-js/store';
import type { ViewState } from '../types';

export const createViewStore = () => {
  const [view, setView] = createStore<ViewState>({
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    selectedTrackIds: [],
    selectedClipIds: [],
    viewMode: 'arrange',
    snapToGrid: true,
    gridSize: 0.25 // quarter note
  });

  const setZoom = (zoom: number) => {
    setView('zoom', Math.max(0.1, Math.min(10, zoom)));
  };

  const zoomIn = () => {
    setZoom(view.zoom * 1.2);
  };

  const zoomOut = () => {
    setZoom(view.zoom / 1.2);
  };

  const setScroll = (x: number, y: number) => {
    setView('scrollX', Math.max(0, x));
    setView('scrollY', Math.max(0, y));
  };

  const selectTrack = (trackId: string, addToSelection = false) => {
    if (addToSelection) {
      if (view.selectedTrackIds.includes(trackId)) {
        setView('selectedTrackIds', ids => ids.filter(id => id !== trackId));
      } else {
        setView('selectedTrackIds', ids => [...ids, trackId]);
      }
    } else {
      setView('selectedTrackIds', [trackId]);
    }
  };

  const selectClip = (clipId: string, addToSelection = false) => {
    if (addToSelection) {
      if (view.selectedClipIds.includes(clipId)) {
        setView('selectedClipIds', ids => ids.filter(id => id !== clipId));
      } else {
        setView('selectedClipIds', ids => [...ids, clipId]);
      }
    } else {
      setView('selectedClipIds', [clipId]);
    }
  };

  const clearSelection = () => {
    setView('selectedTrackIds', []);
    setView('selectedClipIds', []);
  };

  const setViewMode = (mode: ViewState['viewMode']) => {
    setView('viewMode', mode);
  };

  const toggleSnapToGrid = () => {
    setView('snapToGrid', !view.snapToGrid);
  };

  const setGridSize = (size: number) => {
    setView('gridSize', size);
  };

  return {
    view,
    setZoom,
    zoomIn,
    zoomOut,
    setScroll,
    selectTrack,
    selectClip,
    clearSelection,
    setViewMode,
    toggleSnapToGrid,
    setGridSize
  };
};

export type ViewStore = ReturnType<typeof createViewStore>;