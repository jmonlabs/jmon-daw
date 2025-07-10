import { Show, createSignal } from "solid-js";
import { useDawStore } from "../stores/dawStore";

export default function AppMenu() {
  const store = useDawStore();
  const [isOpen, setIsOpen] = createSignal(false);
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  // Check if menu should show collapsed items
  const checkCollapse = () => {
    const width = window.innerWidth;
    setIsCollapsed(width < 1024);
  };

  window.addEventListener('resize', checkCollapse);
  checkCollapse();

  const handleNewProject = () => {
    if (
      confirm("Create a new project? This will clear the current composition.")
    ) {
      store.updateJmonData({
        format: "jmonTone",
        version: "1.0",
        bpm: 120,
        audioGraph: [{ id: "master", type: "Destination", options: {} }],
        connections: [],
        sequences: [],
      });
      store.syncFromJmon();
    }
    setIsOpen(false);
  };

  const handleLoadDemo = () => {
    store.loadDemo();
    setIsOpen(false);
  };

  const handleExportJMON = () => {
    try {
      const dataStr = JSON.stringify(store.jmonData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${store.jmonData.metadata?.name || "composition"}.jmon`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export Error: ${err.message}`);
    }
    setIsOpen(false);
  };

  const handleImportJMON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jmon,.json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          store.updateJmonData(importedData);
          store.syncFromJmon();
        } catch (err) {
          alert(`Import Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setIsOpen(false);
  };

  return (
    <div style="position: relative; z-index: 1000;">
      <button
        onClick={() => setIsOpen(!isOpen())}
        class="button is-small app-menu-button"
        title="Menu"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-bars"></i>
        </span>
      </button>

      {isOpen() && (
        <div
          style="
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--elevated-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            min-width: 150px;
            box-shadow: var(--shadow-lg);
            z-index: 1001;
          "
        >
          <button
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              padding: 8px 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--hover-overlay)")
            }
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
            onClick={handleNewProject}
          >
            <i class="fa-solid fa-file"></i>
            <span>New Project</span>
          </button>

          <button
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              padding: 8px 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--hover-overlay)")
            }
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
            onClick={handleLoadDemo}
          >
            <i class="fa-solid fa-play"></i>
            <span>Load Demo</span>
          </button>

          <div style="height: 1px; background: var(--border-color); margin: 4px 0;"></div>

          <button
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              padding: 8px 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--hover-overlay)")
            }
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
            onClick={handleImportJMON}
          >
            <i class="fa-solid fa-upload"></i>
            <span>Import JMON</span>
          </button>

          <button
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              padding: 8px 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--hover-overlay)")
            }
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
            onClick={handleExportJMON}
          >
            <i class="fa-solid fa-download"></i>
            <span>Export JMON</span>
          </button>

          <div style="height: 1px; background: var(--border-color); margin: 4px 0;"></div>

          {/* Collapsed items for small screens */}
          <Show when={isCollapsed()}>
            <button
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
              "
              onMouseEnter={(e) =>
                (e.target.style.background = "var(--hover-overlay)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
              onClick={() => {
                store.setLooping(!store.isLooping);
                setIsOpen(false);
              }}
            >
              <i class="fa-solid fa-infinity"></i>
              <span>{store.isLooping ? "Disable" : "Enable"} Loop</span>
            </button>

            <button
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
              "
              onMouseEnter={(e) =>
                (e.target.style.background = "var(--hover-overlay)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
              onClick={() => {
                store.setSnapEnabled(!store.snapEnabled);
                setIsOpen(false);
              }}
            >
              <i class="fa-solid fa-magnet"></i>
              <span>{store.snapEnabled ? "Disable" : "Enable"} Snap</span>
            </button>

            <button
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 8px 12px;
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                font-size: 14px;
              "
              onMouseEnter={(e) =>
                (e.target.style.background = "var(--hover-overlay)")
              }
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
              onClick={() => {
                store.autoZoomTimeline();
                setIsOpen(false);
              }}
            >
              <i class="fa-solid fa-magnifying-glass"></i>
              <span>Auto Zoom</span>
            </button>

            <div style="height: 1px; background: var(--border-color); margin: 4px 0;"></div>
          </Show>

          <button
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              padding: 8px 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              font-size: 14px;
            "
            onMouseEnter={(e) =>
              (e.target.style.background = "var(--hover-overlay)")
            }
            onMouseLeave={(e) => (e.target.style.background = "transparent")}
            onClick={() => {
              store.toggleJmonEditor();
              setIsOpen(false);
            }}
          >
            <i class="fa-solid fa-code"></i>
            <span>JMON Editor</span>
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen() && (
        <div
          style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; background: transparent;"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
