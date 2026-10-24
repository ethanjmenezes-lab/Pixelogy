import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Crop } from "../lib/pixel";
export function CropEditor({
  source,
  crop,
  onChange,
}: {
  source: string;
  crop: Crop;
  onChange: (c: Crop) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{
    x: number;
    y: number;
    crop: Crop;
    resize: boolean;
  } | null>(null);
  function begin(e: PointerEvent<HTMLDivElement>, resize = false) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, crop: { ...crop }, resize };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!start.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect(),
      s = start.current;
    const dx = ((e.clientX - s.x) / rect.width) * 100,
      dy = ((e.clientY - s.y) / rect.height) * 100;
    if (s.resize)
      onChange({
        ...s.crop,
        width: Math.max(5, Math.min(100 - s.crop.x, s.crop.width + dx)),
        height: Math.max(5, Math.min(100 - s.crop.y, s.crop.height + dy)),
      });
    else
      onChange({
        ...s.crop,
        x: Math.max(0, Math.min(100 - s.crop.width, s.crop.x + dx)),
        y: Math.max(0, Math.min(100 - s.crop.height, s.crop.y + dy)),
      });
  }
  function keyboard(e: KeyboardEvent<HTMLDivElement>, resize = false) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
      return;
    e.preventDefault();
    e.stopPropagation();
    const horizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
    const delta = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const key =
      resize || e.shiftKey
        ? horizontal
          ? "width"
          : "height"
        : horizontal
          ? "x"
          : "y";
    const min = key === "x" || key === "y" ? 0 : 5;
    const max =
      key === "x"
        ? 100 - crop.width
        : key === "y"
          ? 100 - crop.height
          : key === "width"
            ? 100 - crop.x
            : 100 - crop.y;
    onChange({
      ...crop,
      [key]: Math.max(min, Math.min(max, crop[key] + delta)),
    });
  }
  return (
    <>
      <div className="crop-editor" ref={ref}>
        <img
          src={source}
          alt="Your photo with adjustable object crop"
          draggable={false}
        />
        <div
          className="crop-box"
          tabIndex={0}
          role="group"
          aria-label="Object crop. Arrow keys move; Shift and arrow keys resize."
          onKeyDown={(e) => keyboard(e)}
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${crop.width}%`,
            height: `${crop.height}%`,
          }}
          onPointerDown={(e) => begin(e)}
          onPointerMove={move}
          onPointerUp={() => (start.current = null)}
          onPointerCancel={() => (start.current = null)}
          onLostPointerCapture={() => (start.current = null)}
        >
          <span>OBJECT CROP</span>
          <div
            className="crop-handle"
            tabIndex={0}
            role="button"
            aria-label="Resize crop with arrow keys"
            onKeyDown={(e) => keyboard(e, true)}
            onPointerCancel={() => (start.current = null)}
            onLostPointerCapture={() => (start.current = null)}
            onPointerDown={(e) => begin(e, true)}
            onPointerMove={move}
            onPointerUp={() => (start.current = null)}
          />
        </div>
      </div>
      <p className="field-help">
        Drag the box or its corner to adjust. With a keyboard, use arrow keys to
        move and Shift + arrows to resize. Cropping keeps some background.
      </p>
    </>
  );
}
