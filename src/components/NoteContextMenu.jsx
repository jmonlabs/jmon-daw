export default function NoteContextMenu({ store }) {
  if (!(store.contextMenu && store.contextMenu.type === "note")) return null;
  return (
    <div
      class="context-menu dropdown-content has-background-dark"
      style={`
        position: fixed;
        left: ${store.contextMenu.x}px;
        top: ${store.contextMenu.y}px;
        z-index: 9999;
        border: 1px solid #4b5563;
        border-radius: 4px;
        min-width: 8rem;
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <a
        class="dropdown-item has-text-light"
        onClick={() => {
          // Copy note to clipboard
          const trackIndex = store.tracks.findIndex(
            (t) => t.id === store.contextMenu.trackId,
          );
          if (trackIndex !== -1) {
            const note =
              store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
            store.setClipboard({ note, operation: "copy" });
          }
          store.setContextMenu(null);
        }}
        style="cursor: pointer;"
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-copy"></i>
        </span>
        Copier
      </a>
      <a
        class="dropdown-item has-text-light"
        onClick={() => {
          // Cut note to clipboard
          const trackIndex = store.tracks.findIndex(
            (t) => t.id === store.contextMenu.trackId,
          );
          if (trackIndex !== -1) {
            const note =
              store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
            store.setClipboard({ note, operation: "cut" });
            const updatedNotes = store.tracks[trackIndex].notes.filter(
              (_, i) => i !== store.contextMenu.noteIndex,
            );
            store.updateTrack(store.contextMenu.trackId, {
              notes: updatedNotes,
            });
          }
          store.setContextMenu(null);
        }}
        style="cursor: pointer;"
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-cut"></i>
        </span>
        Couper
      </a>
      <a
        class="dropdown-item has-text-light"
        onClick={() => {
          // Paste note from clipboard
          if (store.clipboard && store.clipboard.note) {
            const trackIndex = store.tracks.findIndex(
              (t) => t.id === store.contextMenu.trackId,
            );
            if (trackIndex !== -1) {
              const pastedNote = { ...store.clipboard.note };
              const updatedNotes = [
                ...store.tracks[trackIndex].notes,
                pastedNote,
              ];
              store.updateTrack(store.contextMenu.trackId, {
                notes: updatedNotes,
              });
            }
          }
          store.setContextMenu(null);
        }}
        style={`cursor: pointer; ${!store.clipboard ? "opacity: 0.5;" : ""}`}
        disabled={!store.clipboard}
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-paste"></i>
        </span>
        Coller
      </a>
      <a
        class="dropdown-item has-text-light"
        onClick={() => {
          // Duplicate note directly to the right
          const trackIndex = store.tracks.findIndex(
            (t) => t.id === store.contextMenu.trackId,
          );
          if (trackIndex !== -1) {
            const originalNote =
              store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
            const duplicatedNote = {
              ...originalNote,
              time: originalNote.time + originalNote.duration,
            };
            const updatedNotes = [
              ...store.tracks[trackIndex].notes,
              duplicatedNote,
            ];
            store.updateTrack(store.contextMenu.trackId, {
              notes: updatedNotes,
            });
          }
          store.setContextMenu(null);
        }}
        style="cursor: pointer;"
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-clone"></i>
        </span>
        Dupliquer
      </a>
      <hr class="dropdown-divider" />
      <a
        class="dropdown-item has-text-light"
        onClick={() => {
          // Open note properties dialog
          const trackIndex = store.tracks.findIndex(
            (t) => t.id === store.contextMenu.trackId,
          );
          if (trackIndex !== -1) {
            const note = store.tracks[trackIndex].notes[store.contextMenu.noteIndex];
            store.setEditingNote(note);
            store.setEditingNoteIndex(store.contextMenu.noteIndex);
            store.setEditingTrackId(store.contextMenu.trackId);
            store.setShowNoteProperties(true);
          }
          store.setContextMenu(null);
        }}
        style="cursor: pointer;"
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-cog"></i>
        </span>
        Properties
      </a>
      <hr class="dropdown-divider" />
      <a
        class="dropdown-item has-text-danger"
        onClick={() => {
          // Delete note
          const trackIndex = store.tracks.findIndex(
            (t) => t.id === store.contextMenu.trackId,
          );
          if (trackIndex !== -1) {
            const updatedNotes = store.tracks[trackIndex].notes.filter(
              (_, i) => i !== store.contextMenu.noteIndex,
            );
            store.updateTrack(store.contextMenu.trackId, {
              notes: updatedNotes,
            });
          }
          store.setContextMenu(null);
        }}
        style="cursor: pointer;"
      >
        <span class="icon is-small mr-1">
          <i class="fa-solid fa-trash"></i>
        </span>
        Supprimer
      </a>
    </div>
  );
}
