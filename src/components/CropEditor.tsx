import { useRef, type PointerEvent } from "react";
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
        >
          <span>OBJECT CROP</span>
          <div
            className="crop-handle"
            onPointerDown={(e) => begin(e, true)}
            onPointerMove={move}
            onPointerUp={() => (start.current = null)}
          />
        </div>
      </div>
      <p className="field-help">
        Drag the box and its bottom-right corner to focus on the object. You can
        also use the sliders below. Cropping keeps some background.
      </p>
      <div className="crop-controls">
        {(["x", "y", "width", "height"] as const).map((key) => (
          <label key={key}>
            {
              {
                x: "Horizontal position",
                y: "Vertical position",
                width: "Crop width",
                height: "Crop height",
              }[key]
            }
            <input
              type="range"
              aria-label={key}
              min={key === "width" || key === "height" ? 5 : 0}
              max={
                key === "x"
                  ? 100 - crop.width
                  : key === "y"
                    ? 100 - crop.height
                    : key === "width"
                      ? 100 - crop.x
                      : 100 - crop.y
              }
              value={crop[key]}
              onChange={(e) =>
                onChange({ ...crop, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </div>
    </>
  );
}
