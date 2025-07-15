import { Show, For, createEffect, createSignal, onCleanup } from "solid-js";
import { useDawStore } from "../stores/dawStore";
import TrackLane from "./TrackLane";

// Auto-zoom utility function
const calculateOptimalZoom = (track) => {
  const notes = track.notes || [];
  if (notes.length === 0) {
    return { verticalZoom: 1.0, verticalScroll: 0 };
  }

  // Convert note names to MIDI numbers
  const noteNameToMidi = (noteName) => {
    if (typeof noteName === "number") return noteName;

    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    // Parse note name like "C2", "F#3", etc.
    const match = noteName.match(/^([A-G]#?)([0-9])$/);
    if (!match) return null;

    const [, note, octaveStr] = match;
    const noteIndex = noteNames.indexOf(note);
    const octave = parseInt(octaveStr);

    if (noteIndex === -1 || isNaN(octave)) return null;

    // MIDI formula: C4 = 60, so MIDI = noteIndex + octave * 12 + 12
    const midi = noteIndex + octave * 12 + 12;
    return midi;
  };

  const midiNotes = notes
    .map((note) => noteNameToMidi(note.note))
    .filter((midi) => midi !== null);

  if (midiNotes.length === 0) {
    return { verticalZoom: 1.0, verticalScroll: 0 };
  }

  const minMidi = Math.min(...midiNotes);
  const maxMidi = Math.max(...midiNotes);
  const noteRange = maxMidi - minMidi;

  // Calculate zoom level to fit all notes with some padding
  const padding = Math.max(2, noteRange * 0.2); // 20% padding, min 2 semitones
  const requiredSemitones = noteRange + padding;
  const optimalZoom = Math.max(0.25, Math.min(4.0, 12 / requiredSemitones));

  // Calculate vertical scroll to center the notes using fixed C4 reference
  const trackHeight = track.height || 150; // Default track height
  const centerMidi = (minMidi + maxMidi) / 2;

  // Use fixed C4 (MIDI 60) as reference to match TrackLane logic
  const referenceMidi = 60; // C4 - must match TrackLane.jsx
  const referenceY = trackHeight / 2;
  const spacing = (trackHeight - 40) / (12 / optimalZoom); // Grid spacing based on zoom

  // Calculate where the center of the notes should be positioned
  const noteOffset = centerMidi - referenceMidi;
  const centerNoteY = referenceY - (noteOffset * spacing);

  // Calculate needed scroll to center the notes in the visible area
  const targetY = trackHeight / 2;
  const neededScroll = centerNoteY - targetY;

  console.log(
    `🔍 Auto-zoom for "${track.name}": range=${minMidi}-${maxMidi} (${noteRange} semitones), zoom=${optimalZoom.toFixed(2)}, scroll=${neededScroll.toFixed(1)}`,
  );

  return {
    verticalZoom: optimalZoom,
    verticalScroll: neededScroll,
  };
};

export default function TrackRow(props) {
  const store = useDawStore();

  const { track, index, beatWidth, barWidth, timelineScroll, gridMarkers } =
    props;

  let trackLaneSectionRef;
  
  // Force synchronization of scroll when store.timelineScroll changes
  createEffect(() => {
    const currentScroll = store.timelineScroll;
    if (
      trackLaneSectionRef &&
      Math.abs(trackLaneSectionRef.scrollLeft - currentScroll) > 1
    ) {
      trackLaneSectionRef.scrollLeft = currentScroll;
    }
  });

  return (
    <div
      class={`track-row ${store.selectedTrack === track.id ? "selected" : ""}`}
      style={`
        display: flex;
        flex-direction: column;
        height: ${track.height || 80}px;
        position: relative;
      `}
    >
      {/* Main Track Content - Piano Roll and Controls */}
      <div
        style="
          display: flex;
          flex: 1;
          height: 100%;
          position: relative;
        "
      >
      {/* Track Info Section - Redesigned with vertical title band */}
      <div
        class="track-info-section"
        style="
          width: 200px;
          display: flex;
          cursor: pointer;
          background-color: var(--track-bg);
          border-right: 2px solid var(--border-color);
          position: relative;
        "
        onClick={() => store.setSelectedTrack(track.id)}
      >
        {/* Vertical Track Title Band */}
        <div
          style="
          width: 24px;
          background-color: var(--primary-accent);
          border-right: 1px solid var(--border-active);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        "
        >
          <div
            style="
            writing-mode: vertical-rl;
            text-orientation: mixed;
            color: white;
            font-weight: 600;
            font-size: 0.75rem;
            white-space: nowrap;
            letter-spacing: 0.05em;
            transform: rotate(180deg);
          "
          >
            {track.name || `Track ${index + 1}`}
          </div>
        </div>

        {/* Controls Area */}
        <div
          style="
          flex: 1;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        "
        >
          {/* Scroll Up Button - Top Right */}
          <Show when={track.height > 120}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentScroll = track.verticalScroll || 0;
                const scrollStep = 12 * (track.verticalZoom || 2.5); // Scroll by one octave
                // Remove the Math.max(0, ...) limitation to allow negative scroll for high notes
                const newScroll = currentScroll - scrollStep;
                store.updateTrack(track.id, { verticalScroll: newScroll });
              }}
              style="
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: var(--radius-sm);
                background-color: var(--button-bg);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                z-index: 10;
              "
              title="Scroll Up (Piano Roll)"
            >
              <i class="fa-solid fa-chevron-up"></i>
            </button>
          </Show>

          {/* Scroll Down Button - Bottom Right */}
          <Show when={track.height > 120}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentScroll = track.verticalScroll || 0;
                const scrollStep = 12 * (track.verticalZoom || 2.5); // Scroll by one octave
                // Allow unlimited scroll down for low notes
                const newScroll = currentScroll + scrollStep;
                store.updateTrack(track.id, { verticalScroll: newScroll });
              }}
              style="
                position: absolute;
                bottom: 0.5rem;
                right: 0.5rem;
                width: 1.5rem;
                height: 1.5rem;
                border-radius: var(--radius-sm);
                background-color: var(--button-bg);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                z-index: 10;
              "
              title="Scroll Down (Piano Roll)"
            >
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          </Show>

          {/* M, S, X Buttons - Grouped with button-group styling */}
          <div class="btn-group" style="margin-bottom: 0.5rem;">
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.updateTrack(track.id, { muted: !track.muted });
              }}
              style={`
                background-color: ${track.muted ? 'var(--primary-accent)' : 'var(--color-bg-secondary)'};
                color: ${track.muted ? 'white' : 'var(--text-primary)'};
                border: 1px solid var(--color-border-primary);
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 4px 0 0 4px;
                cursor: pointer;
                transition: all 0.2s ease;
              `}
              title={track.muted ? "Désactiver le mute" : "Activer le mute"}
            >
              M
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.updateTrack(track.id, { solo: !track.solo });
              }}
              style={`
                background-color: ${track.solo ? 'var(--primary-accent)' : 'var(--color-bg-secondary)'};
                color: ${track.solo ? 'white' : 'var(--text-primary)'};
                border: 1px solid var(--color-border-primary);
                border-left: none;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 0;
                cursor: pointer;
                transition: all 0.2s ease;
              `}
              title={track.solo ? "Désactiver le solo" : "Activer le solo"}
            >
              S
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.toggleAutomationVisible(track.id);
              }}
              style={`
                background-color: ${track.automation?.visible ? 'var(--primary-accent)' : 'var(--color-bg-secondary)'};
                color: ${track.automation?.visible ? 'white' : 'var(--text-primary)'};
                border: 1px solid var(--color-border-primary);
                border-left: none;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 0;
                cursor: pointer;
                transition: all 0.2s ease;
              `}
              title={track.automation?.visible ? "Masquer automation" : "Afficher automation"}
            >
              A
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `Êtes-vous sûr de vouloir supprimer la track "${track.name || `Track ${index + 1}`}" ?`,
                  )
                ) {
                  store.removeTrack(track.id);
                }
              }}
              style="
                background-color: var(--color-bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--color-border-primary);
                border-left: none;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                font-weight: 600;
                border-radius: 0 4px 4px 0;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              title="Supprimer la track"
            >
              <i class="fa-solid fa-trash" style="font-size: 0.7rem;"></i>
            </button>
          </div>

          {/* V-Zoom Section - Grouped buttons */}
          <Show when={track.height > 120}>
            <div class="btn-group" style="margin-bottom: 0.75rem;">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newZoom = Math.max(
                    0.5,
                    (track.verticalZoom || 2.5) - 0.25,
                  );
                  store.updateTrack(track.id, { verticalZoom: newZoom });
                }}
                class="btn btn-secondary btn-sm"
                title="Zoom Out Vertical"
              >
                <i
                  class="fa-solid fa-magnifying-glass-minus"
                  style="font-size: 0.7rem;"
                ></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    `🎯 Manual auto-zoom triggered for track ${track.name}`,
                  );

                  const zoomSettings = calculateOptimalZoom(track);
                  store.updateTrack(track.id, zoomSettings);
                }}
                class="btn btn-primary btn-sm"
                title="Auto-zoom to fit notes"
              >
                <span style="font-weight: var(--font-weight-semibold);">A</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newZoom = Math.min(
                    5,
                    (track.verticalZoom || 2.5) + 0.25,
                  );
                  store.updateTrack(track.id, { verticalZoom: newZoom });
                }}
                class="btn btn-secondary btn-sm"
                title="Zoom In Vertical"
              >
                <i
                  class="fa-solid fa-magnifying-glass-plus"
                  style="font-size: 0.7rem;"
                ></i>
              </button>
            </div>
          </Show>

          {/* Note Count - Style discret - Hide when track is small */}
          <Show when={track.height > 120}>
            <div
              style="
            color: var(--text-muted);
            font-size: 0.65rem;
            margin-top: auto;
            margin-bottom: 0.25rem;
          "
            >
              Notes: {track.notes?.length || 0}
            </div>
          </Show>

          {/* Flèche de pliage/dépliage removed - replaced by scroll buttons in track lane */}
        </div>
      </div>

      {/* Track Lane Section - Individual scroll synchronized with global store */}
      <div
        class="track-lane-section"
        style="
          flex: 1;
          position: relative;
          background-color: var(--surface-bg);
          overflow-x: auto;
          overflow-y: hidden;
          z-index: 1;
        "
        onScroll={(e) => {
          // Sync horizontal scroll with store - but avoid infinite loops
          const scrollLeft = e.target.scrollLeft;
          if (Math.abs(scrollLeft - store.timelineScroll) > 1) {
            store.setTimelineScroll(scrollLeft);
          }
        }}
        ref={(ref) => {
          trackLaneSectionRef = ref;
        }}
      >
        <TrackLane
          track={track}
          index={index}
          beatWidth={beatWidth}
          barWidth={barWidth}
          timelineScroll={timelineScroll}
          gridMarkers={gridMarkers}
          minHeight={80}
          trackHeight={track.height || 80}
        />
      </div>

      {/* Resize Handle - Bottom Edge */}
      <div
        class="track-resize-handle"
        style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          cursor: ns-resize;
          background-color: transparent;
          z-index: 50;
          pointer-events: auto;
        "
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const startY = e.clientY;
          const startHeight = track.height || 80;

          const handleMouseMove = (moveEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(80, startHeight + deltaY);
            store.updateTrack(track.id, { height: newHeight });
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "rgba(0, 122, 255, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "transparent";
        }}
      />

      {/* Effects Section - Fixed Width (when visible) */}
      <Show when={store.rightSidebarOpen}>
        <div
          class="track-effects-section"
          style="
            width: 250px;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-left: 2px solid var(--border-color);
            background-color: var(--surface-bg);
          "
        >
          {/* Volume Knob */}
          <div style="display: flex; flex-direction: column; align-items: center; width: 2.5rem;">
            <div style="color: var(--text-secondary); font-size: 0.7rem; font-weight: 600; margin-bottom: 0.25rem;">
              VOL
            </div>
            <div style="position: relative; width: 28px; height: 28px;">
              <div
                style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: var(--button-bg);
                border: 2px solid var(--border-color);
                position: relative;
                cursor: pointer;
              "
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startValue = track.volume || 0.8;

                  const handleMouseMove = (moveEvent) => {
                    const deltaY = startY - moveEvent.clientY;
                    const sensitivity = 0.005;
                    const newValue = Math.max(
                      0,
                      Math.min(1, startValue + deltaY * sensitivity),
                    );
                    store.updateTrack(track.id, { volume: newValue });
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              >
                {/* Tick marks */}
                <div
                  style="
                  position: absolute;
                  top: 2px;
                  left: 50%;
                  width: 1px;
                  height: 4px;
                  background: var(--text-muted);
                  transform: translateX(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  bottom: 2px;
                  left: 50%;
                  width: 1px;
                  height: 4px;
                  background: var(--text-muted);
                  transform: translateX(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  left: 2px;
                  top: 50%;
                  width: 4px;
                  height: 1px;
                  background: var(--text-muted);
                  transform: translateY(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  right: 2px;
                  top: 50%;
                  width: 4px;
                  height: 1px;
                  background: var(--text-muted);
                  transform: translateY(-50%);
                "
                ></div>

                {/* Pointer */}
                <div
                  style={`
                  position: absolute;
                  top: 3px;
                  left: 50%;
                  width: 3px;
                  height: 10px;
                  background: var(--primary-accent);
                  border-radius: 1.5px;
                  transform-origin: 50% 11px;
                  transform: translateX(-50%) rotate(${(track.volume || 0.8) * 270 - 135}deg);
                `}
                />
              </div>
            </div>
            <div style="color: var(--text-muted); font-size: 0.6rem; font-weight: 600; margin-top: 0.25rem;">
              {Math.round((track.volume || 0.8) * 100)}
            </div>
          </div>

          {/* Pan Knob */}
          <div style="display: flex; flex-direction: column; align-items: center; width: 2.5rem;">
            <div style="color: var(--text-secondary); font-size: 0.7rem; font-weight: 600; margin-bottom: 0.25rem;">
              PAN
            </div>
            <div style="position: relative; width: 28px; height: 28px;">
              <div
                style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: var(--button-bg);
                border: 2px solid var(--border-color);
                position: relative;
                cursor: pointer;
              "
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startValue = track.pan || 0;

                  const handleMouseMove = (moveEvent) => {
                    const deltaY = startY - moveEvent.clientY;
                    const sensitivity = 0.005;
                    const newValue = Math.max(
                      -1,
                      Math.min(1, startValue + deltaY * sensitivity),
                    );
                    store.updateTrack(track.id, { pan: newValue });
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              >
                {/* Tick marks */}
                <div
                  style="
                  position: absolute;
                  top: 2px;
                  left: 50%;
                  width: 1px;
                  height: 4px;
                  background: var(--text-muted);
                  transform: translateX(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  bottom: 2px;
                  left: 50%;
                  width: 1px;
                  height: 4px;
                  background: var(--text-muted);
                  transform: translateX(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  left: 2px;
                  top: 50%;
                  width: 4px;
                  height: 1px;
                  background: var(--text-muted);
                  transform: translateY(-50%);
                "
                ></div>
                <div
                  style="
                  position: absolute;
                  right: 2px;
                  top: 50%;
                  width: 4px;
                  height: 1px;
                  background: var(--text-muted);
                  transform: translateY(-50%);
                "
                ></div>

                {/* Pointer */}
                <div
                  style={`
                  position: absolute;
                  top: 3px;
                  left: 50%;
                  width: 3px;
                  height: 10px;
                  background: var(--secondary-accent);
                  border-radius: 1.5px;
                  transform-origin: 50% 11px;
                  transform: translateX(-50%) rotate(${(track.pan || 0) * 135}deg);
                `}
                />
              </div>
            </div>
            <div style="color: var(--text-muted); font-size: 0.6rem; font-weight: 600; margin-top: 0.25rem;">
              {Math.abs(track.pan || 0) < 0.1
                ? "C"
                : (track.pan || 0) > 0
                  ? "R"
                  : "L"}
            </div>
          </div>

          {/* Audio Chain - Horizontal stacking exactly like mockup */}
          <div
            class="effects-chain-scroll"
            style="
              flex: 1;
              display: flex;
              align-items: center;
              gap: 0;
              overflow-x: auto;
              overflow-y: hidden;
              padding: 0.25rem 0.125rem;
              scrollbar-width: thin;
              scrollbar-color: var(--text-muted) var(--surface-bg);
            "
          >
            {/* Synth/Source - First element */}
            <div
              style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 60px;
              background-color: var(--ternary-accent);
              border: 1px solid var(--border-color);
              border-radius: 6px 0 0 6px;
              color: var(--text);
              font-size: 0.6rem;
              font-weight: 600;
              text-align: center;
              line-height: 1.1;
              flex-shrink: 0;
              cursor: pointer;
              position: relative;
              z-index: 1;
            "
              onClick={(e) => {
                e.stopPropagation();
                store.setSelectedEffect({
                  trackId: track.id,
                  type: "synth",
                  name: track.synthType || "Synth",
                  options: track.synthOptions || {},
                });
              }}
            >
              <span
                style="
                transform: rotate(-90deg);
                white-space: nowrap;
                transform-origin: center;
              "
              >
                {(track.synthType || "Synth").substring(0, 8)}
              </span>
            </div>

            {/* Effects Chain - Connected to synth */}
            <For each={track.effects || []}>
              {(effect, index) => (
                <div
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", JSON.stringify({
                      trackId: track.id,
                      effectIndex: index(),
                      effect: effect
                    }));
                    e.dataTransfer.effectAllowed = "move";
                    e.target.style.opacity = "0.5";
                  }}
                  onDragEnd={(e) => {
                    e.target.style.opacity = "1";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
                      const dropIndex = index();
                      const dragIndex = dragData.effectIndex;
                      
                      if (dragData.trackId === track.id && dragIndex !== dropIndex) {
                        // Reorder effects within the same track
                        const effects = [...track.effects];
                        const [draggedEffect] = effects.splice(dragIndex, 1);
                        effects.splice(dropIndex, 0, draggedEffect);
                        store.updateTrack(track.id, { effects });
                      }
                    } catch (error) {
                      console.error("Error handling drop:", error);
                    }
                  }}
                  style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 60px;
                    background-color: var(--info-color);
                    border: 1px solid var(--border-color);
                    border-left: none;
                    border-radius: 0;
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-align: center;
                    line-height: 1.1;
                    position: relative;
                    cursor: move;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                    z-index: 1;
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedEffect({
                      trackId: track.id,
                      type: "effect",
                      effectIndex: index(),
                      name: effect.type || "Effect",
                      options: effect.options || {},
                    });
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "var(--info-hover)";
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "var(--info-color)";
                    e.target.style.transform = "scale(1)";
                    e.target.style.zIndex = "1";
                  }}
                >
                  <span
                    style="
                      transform: rotate(-90deg);
                      white-space: nowrap;
                      transform-origin: center;
                      pointer-events: none;
                    "
                  >
                    {(effect.type || "Effect").substring(0, 8)}
                  </span>
                </div>
              )}
            </For>

            {/* Add Effect Button - Thin and connected */}
            <button
              style="
                width: 16px;
                height: 60px;
                background-color: var(--button-bg);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                border-left: none;
                border-radius: 0;
                font-size: 14px;
                font-weight: bold;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all var(--transition-fast);
                flex-shrink: 0;
                padding: 0;
                margin: 0;
                z-index: 1;
              "
              title="Add Effect"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--button-hover)";
                e.target.style.transform = "scale(1.05)";
                e.target.style.zIndex = "10";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--button-bg)";
                e.target.style.transform = "scale(1)";
                e.target.style.zIndex = "1";
              }}
              onClick={(e) => {
                e.stopPropagation();
                const effectTypes = [
                  "Reverb",
                  "Delay",
                  "Chorus",
                  "Distortion",
                  "Filter",
                  "Compressor",
                ];
                const randomType =
                  effectTypes[Math.floor(Math.random() * effectTypes.length)];
                const newEffect = { type: randomType, options: {} };
                const updatedEffects = [...(track.effects || []), newEffect];
                store.updateTrack(track.id, { effects: updatedEffects });
              }}
            >
              <span style="transform: translateY(-1px);">+</span>
            </button>

            {/* Master - Connected to the chain */}
            <div
              style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 60px;
              background-color: var(--ternary-accent);
              border: 1px solid var(--border-color);
              border-left: none;
              border-radius: 0 6px 6px 0;
              color: var(--text);
              font-size: 0.6rem;
              font-weight: 600;
              text-align: center;
              line-height: 1.1;
              flex-shrink: 0;
              cursor: pointer;
              z-index: 1;
            "
              onClick={(e) => {
                e.stopPropagation();
                store.toggleMasterBus();
              }}
            >
              <span
                style="
                transform: rotate(-90deg);
                white-space: nowrap;
                transform-origin: center;
              "
              >
                Master
              </span>
            </div>
          </div>
        </div>
      </Show>
      </div>

    </div>
  );
}
