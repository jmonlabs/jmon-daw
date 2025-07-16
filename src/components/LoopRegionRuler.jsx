import { createSignal } from "solid-js";
import { snapTimeToGrid } from "../utils/noteConversion";

export default function LoopRegionRuler(props) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(null); // null, 'left', 'right'
  const [dragStart, setDragStart] = createSignal({
    x: 0,
    startTime: 0,
    endTime: 0,
  });

  const beatWidth = () => 80 * props.timelineZoom;
  const barWidth = () => beatWidth() * 4;
  const loopLeft = () => props.loopStart * barWidth() - props.timelineScroll;
  const loopWidth = () => (props.loopEnd - props.loopStart) * barWidth();

  const handleMouseDown = (e, type = "drag") => {
    e.stopPropagation();
    e.preventDefault();

    if (type === "drag") {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd,
      });
    } else {
      setIsResizing(type);
      setDragStart({
        x: e.clientX,
        startTime: props.loopStart,
        endTime: props.loopEnd,
      });
    }

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStart().x;
      const deltaTime = deltaX / barWidth();

      if (isDragging()) {
        // Move entire loop region
        const duration = dragStart().endTime - dragStart().startTime;
        let newStart = Math.max(0, dragStart().startTime + deltaTime);

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newStart * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newStart = snappedBeats / 4;
        }

        props.setLoopStart(newStart);
        props.setLoopEnd(newStart + duration);
      } else if (isResizing() === "left") {
        // Resize left edge
        let newStart = Math.max(
          0,
          Math.min(
            dragStart().endTime - 0.25,
            dragStart().startTime + deltaTime,
          ),
        );

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newStart * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newStart = snappedBeats / 4;
          newStart = Math.max(
            0,
            Math.min(dragStart().endTime - 0.25, newStart),
          );
        }

        props.setLoopStart(newStart);
      } else if (isResizing() === "right") {
        // Resize right edge
        let newEnd = Math.max(
          dragStart().startTime + 0.25,
          dragStart().endTime + deltaTime,
        );

        // Apply snapping
        if (props.snapEnabled) {
          const beats = newEnd * 4;
          const snappedBeats = snapTimeToGrid(beats, props.snapValue);
          newEnd = snappedBeats / 4;
          newEnd = Math.max(dragStart().startTime + 0.25, newEnd);
        }

        props.setLoopEnd(newEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      style={`
        position: absolute;
        left: ${loopLeft()}px;
        top: 60%;
        width: ${loopWidth()}px;
        height: 35%;
        background: var(--loop-region);
        border: 2px solid var(--bulma-primary);
        border-radius: var(--radius-sm);
        z-index: 50;
        min-width: 20px;
        cursor: move;
      `}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Left resize handle */}
      <div
        style="
          position: absolute;
          left: -3px;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          background-color: #ffdd57;
          border-radius: 2px 0 0 2px;
        "
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />

      {/* Right resize handle */}
      <div
        style="
          position: absolute;
          right: -3px;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
          background-color: #ffdd57;
          border-radius: 0 2px 2px 0;
        "
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />

      {/* Loop indicator text */}
      <div
        style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #333;
          font-size: 10px;
          font-weight: 600;
          pointer-events: none;
          white-space: nowrap;
        "
      >
        LOOP
      </div>
    </div>
  );
}
