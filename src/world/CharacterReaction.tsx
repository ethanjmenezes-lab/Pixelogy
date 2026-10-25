import { useRef, useState, type ReactNode } from "react";
/** Animate inside the marker so MapLibre retains sole ownership of its transform. */
export function CharacterReaction({
  kind,
  active,
  children,
}: {
  kind: "player" | "crab";
  active: boolean;
  children: ReactNode;
}) {
  const [burst, setBurst] = useState(0);
  const down = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  return (
    <button
      type="button"
      className={`character-tap ${kind}-tap`}
      disabled={!active}
      aria-label={
        kind === "player"
          ? "Celebrate with your explorer"
          : "Play with your crab"
      }
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
        dragged.current = false;
      }}
      onPointerMove={(e) => {
        if (
          down.current &&
          Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 8
        )
          dragged.current = true;
      }}
      onPointerCancel={() => {
        dragged.current = true;
        down.current = null;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.detail === 0 || !dragged.current) setBurst((n) => n + 1);
        down.current = null;
      }}
    >
      <span
        key={burst}
        className={`character-reaction ${burst ? "reacting" : ""}`}
        data-reaction={burst}
      >
        {children}
        <span className="reaction-spark" aria-hidden="true">
          ✦
        </span>
      </span>
    </button>
  );
}
