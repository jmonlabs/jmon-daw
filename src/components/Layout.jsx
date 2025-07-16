import NoteContextMenu from "./NoteContextMenu.jsx";
import {
  Show,
  onMount,
  onCleanup,
  For,
  createEffect,
  createSignal,
} from "solid-js";
import { useDawStore } from "../stores/dawStore";
import { keyboardHandler } from "../utils/keyboardHandler";
import { audioEngine } from "../utils/audioEngine";

import Transport from "./Transport";
import TracksArea from "./TracksArea";
import JmonEditor from "./JmonEditor";
import StatusBar from "./StatusBar";
import NotificationSystem from "./NotificationSystem";
import MasterBus from "./MasterBus";
import NoteProperties from "./NoteProperties";
import { snapTimeToGrid } from "../utils/noteConversion";
import LoopRegionRuler from "./LoopRegionRuler.jsx";
import EffectEditor from "./EffectEditor.jsx";
import TimelineRuler from "./TimelineRuler.jsx";


export default function Layout() {
  const store = useDawStore();

  // Make store available globally for audioEngine
  window.dawStore = store;

  // Make audioEngine available globally for store
  import('../utils/audioEngine').then(({ audioEngine }) => {
    window.audioEngine = audioEngine;
  });

  onMount(() => {
    keyboardHandler.init(store);
    store.loadDemo();

    // Close context menu on click outside
    const handleClick = (e) => {
      if (store.contextMenu && !e.target.closest(".context-menu")) {
        store.setContextMenu(null);
      }
    };
    document.addEventListener("click", handleClick);

    onCleanup(() => {
      document.removeEventListener("click", handleClick);
    });
  });

  onCleanup(() => {
    keyboardHandler.destroy();
  });

  // Auto-scroll to follow playback and manual navigation
  createEffect(() => {
    const playheadX = store.currentTime * 80 * store.timelineZoom * 4;
    const viewportWidth =
      window.innerWidth - 200 - (store.rightSidebarOpen ? 250 : 48);
    const currentScroll = store.timelineScroll;

    // Auto-scroll during playback OR if playhead is completely off-screen
    const isPlayheadOffScreen =
      playheadX < currentScroll || playheadX > currentScroll + viewportWidth;

    if (store.isPlaying || isPlayheadOffScreen) {
      // Center the playhead in the viewport when scrolling
      if (
        playheadX > currentScroll + viewportWidth - 100 ||
        playheadX < currentScroll + 100
      ) {
        const newScroll = Math.max(0, playheadX - viewportWidth / 2);
        store.setTimelineScroll(newScroll);
      }
    }
  });

  return (
    <div
      class="daw-container"
      style="height: 100vh; background-color: var(--color-bg-primary); display: flex; flex-direction: column;"
    >
      {/* Header - Transport Controls */}
      <header style="height: 3rem; border-bottom: 1px solid var(--color-border-primary); background-color: var(--color-bg-surface); flex-shrink: 0;">
        <Transport />
      </header>

      {/* Main Content Area */}
      <main style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        {/* Timeline Ruler - Modularized */}
        <TimelineRuler store={store} />

        {/* Tracks Area */}
        <TracksArea store={store} />

        {/* Effect Parameter Editor - Overlay */}
        <EffectEditor store={store} />

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
          <MasterBus />
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
              background-color: var(--color-bg-modal);
              color: var(--text-primary);
              border-right: 1px solid var(--border-color);
              display: flex;
              flex-direction: column;
              z-index: 100;
              box-shadow: 2px 0 10px rgba(0,0,0,0.3);
            "
          >
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-primary); font-weight: 600;">JMON Editor</span>
              <button
                onClick={store.toggleJmonEditor}
                class="button is-dark is-small"
                title="Close"
              >
                <i class="fa-solid fa-times"></i>
              </button>
            </div>

            <div style="flex: 1; overflow: hidden;">
              <JmonEditor />
            </div>
          </div>
        </Show>

        {/* Global Context Menu */}
        <NoteContextMenu store={store} />
      </main>

      {/* Status Bar */}
      <StatusBar />

      {/* Notification System */}
      <NotificationSystem 
        notifications={store.notifications}
        removeNotification={store.removeNotification}
      />

      {/* Note Properties Dialog */}
      <NoteProperties
        note={() => store.editingNote}
        isOpen={() => store.showNoteProperties}
        onClose={() => store.setShowNoteProperties(false)}
        onSave={store.saveNoteProperties}
        trackId={() => store.editingTrackId}
      />
    </div>
  );
}
