import {
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
} from "react";
import { normalizeInput, type Point } from "./model";
export function VirtualJoystick({ input }: { input: MutableRefObject<Point> }) {
  const [stick, setStick] = useState<Point>({ x: 0, y: 0 });
  const pointer = useRef<number | null>(null);
  function update(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = normalizeInput({
      x: (e.clientX - rect.left - rect.width / 2) / 32,
      y: (e.clientY - rect.top - rect.height / 2) / 32,
    });
    input.current = v;
    setStick(v);
  }
  function stop() {
    pointer.current = null;
    input.current = { x: 0, y: 0 };
    setStick({ x: 0, y: 0 });
  }
  return (
    <div className="joystick-wrap">
      <div
        className="joystick"
        aria-label="Movement joystick"
        onPointerDown={(e) => {
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (pointer.current === e.pointerId) update(e);
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <span className="joystick-cross" />
        <span
          className="joystick-knob"
          style={{
            transform: `translate(${stick.x * 25}px,${stick.y * 25}px)`,
          }}
        />
      </div>
      <span className="control-caption">DRAG TO WALK</span>
    </div>
  );
}
