import { useEffect, useRef, useState } from "react";
import {
  SPAWN,
  movePlayer,
  followTrail,
  type Facing,
  type Point,
} from "./model";
export function usePlayerMovement(paused: boolean) {
  const input = useRef<Point>({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const state = useRef({
    player: { ...SPAWN },
    companion: { x: SPAWN.x, y: SPAWN.y + 21 },
    facing: "down" as Facing,
    moving: false,
    frame: 0,
  });
  const trail = useRef<Point[]>([
    { x: SPAWN.x, y: SPAWN.y + 21 },
    { ...SPAWN },
  ]);
  const [view, setView] = useState(state.current);
  useEffect(() => {
    const clear = () => {
      keys.current.clear();
      input.current = { x: 0, y: 0 };
    };
    const down = (e: KeyboardEvent) => {
      if (
        paused ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowleft",
          "arrowdown",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        keys.current.add(key);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    clear();
    return () => {
      clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [paused]);
  useEffect(() => {
    let raf = 0,
      last = performance.now(),
      paint = 0;
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const k = keys.current;
      const keyInput = {
        x:
          Number(k.has("d") || k.has("arrowright")) -
          Number(k.has("a") || k.has("arrowleft")),
        y:
          Number(k.has("s") || k.has("arrowdown")) -
          Number(k.has("w") || k.has("arrowup")),
      };
      const v =
        paused || document.hidden
          ? { x: 0, y: 0 }
          : Math.hypot(input.current.x, input.current.y) > 0.1
            ? input.current
            : keyInput;
      const old = state.current.player;
      const player = movePlayer(old, v, dt);
      const moving = Math.hypot(player.x - old.x, player.y - old.y) > 0.001;
      let facing = state.current.facing;
      if (v.x || v.y)
        facing =
          Math.abs(v.x) > Math.abs(v.y)
            ? v.x > 0
              ? "right"
              : "left"
            : v.y > 0
              ? "down"
              : "up";
      if (moving) {
        const end = trail.current.at(-1)!;
        if (Math.hypot(player.x - end.x, player.y - end.y) >= 1) {
          trail.current.push({ ...player });
          if (trail.current.length > 100) trail.current.shift();
        }
      }
      state.current = {
        player,
        companion: followTrail([...trail.current, player]),
        facing,
        moving,
        frame: Math.floor(now / 180) % 2,
      };
      if (now - paint > 30) {
        setView({ ...state.current });
        paint = now;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);
  return { ...view, input };
}
