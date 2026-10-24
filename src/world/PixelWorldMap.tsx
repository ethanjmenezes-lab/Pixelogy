import { useEffect, useRef, type PointerEvent } from "react";
import {
  houses,
  trees,
  terrain,
  TILE,
  WORLD_SIZE,
  WORLD_SCALE,
  type Point,
} from "./model";
const scale = WORLD_SCALE;
export function buildWorld() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = WORLD_SIZE * TILE;
  const c = canvas.getContext("2d")!;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  for (let y = 0; y < WORLD_SIZE; y++)
    for (let x = 0; x < WORLD_SIZE; x++) {
      const kind = terrain(x, y),
        px = x * 16,
        py = y * 16,
        n = (x * 17 + y * 31) % 19;
      rect(
        px,
        py,
        16,
        16,
        kind === "grass"
          ? n % 3
            ? "#a9c778"
            : "#accb7d"
          : kind === "path"
            ? "#e7ce94"
            : kind === "sand"
              ? "#f0d99b"
              : kind === "pier"
                ? "#bd9366"
                : "#72b7b2",
      );
      if (kind === "grass") {
        rect(px + (n % 12), py + (n % 11), 2, 1, "#92b467");
        if (n < 6) {
          rect(px + 9, py + 10, 1, 3, "#7ea760");
          rect(px + 7, py + 9, 1, 2, "#91b566");
        }
      }
      if (kind === "path" || kind === "sand") {
        rect(
          px + (n % 13),
          py + ((n * 3) % 14),
          2,
          1,
          kind === "sand" ? "#d9bd7d" : "#d3b884",
        );
        if (kind === "path" && terrain(x - 1, y) === "grass")
          rect(px, py, 1, 16, "#bdc47d");
        if (kind === "path" && terrain(x, y - 1) === "grass")
          rect(px, py, 16, 1, "#bdc47d");
      }
      if (kind === "water") {
        if (terrain(x, y - 1) === "sand") {
          rect(px, py, 16, 3, "#d9edce");
          rect(px, py + 3, 16, 3, "#9ed2c2");
        }
        rect(px + (n % 7), py + 8, 6, 1, "#a1d5c9");
        rect(px + (n % 7) + 2, py + 9, 3, 1, "#87c9c1");
      }
      if (kind === "pier") {
        rect(px, py + 1, 16, 1, "#e1b887");
        rect(px, py + 7, 16, 1, "#8f745b");
        rect(px, py + 15, 16, 1, "#8f745b");
        if (x === 23 || x === 25) {
          rect(px + (x === 23 ? 0 : 13), py, 3, 16, "#826e56");
          rect(px + (x === 23 ? 0 : 13), py, 3, 3, "#dbbc8c");
        }
      }
    }
  // Plaza paving, flower beds and original little coastal details.
  for (let y = 23; y < 26; y++)
    for (let x = 23; x < 26; x++) {
      rect(x * 16 + 1, y * 16 + 1, 14, 14, "#ddc998");
      rect(x * 16 + 2, y * 16 + 2, 13, 1, "#f5e3b6");
    }
  const flower = (x: number, y: number, color: string) => {
    rect(x + 1, y + 2, 1, 3, "#6f9b58");
    rect(x, y, 3, 3, color);
    rect(x + 1, y + 1, 1, 1, "#fff0b6");
  };
  for (let i = 0; i < 65; i++) {
    const x = 5 + ((i * 17) % 38),
      y = 5 + ((i * 23) % 28);
    if (
      terrain(x, y) === "grass" &&
      !houses.some(
        (h) => x >= h.x - 1 && x <= h.x + h.w && y >= h.y - 1 && y <= h.y + h.h,
      )
    )
      flower(x * 16 + 5, y * 16 + 9, i % 3 ? "#f5e7b1" : "#e48e7b");
  }
  for (const h of houses) {
    const x = h.x * 16,
      y = h.y * 16,
      w = h.w * 16,
      hh = h.h * 16;
    const roof =
      h.color === "blue"
        ? "#668e9d"
        : h.color === "gold"
          ? "#bf965a"
          : "#c87560";
    const dark =
      h.color === "blue"
        ? "#466878"
        : h.color === "gold"
          ? "#967446"
          : "#9e534d";
    rect(x + 5, y + hh - 4, w + 5, 10, "#77965d55");
    rect(x + 4, y + 24, w - 8, hh - 25, "#f4e5bd");
    rect(x + 4, y + hh - 8, w - 8, 8, "#c3b18b");
    rect(x + 6, y + 28, w - 12, 2, "#d8c99e");
    rect(x, y + 10, w, 25, dark);
    rect(x + 4, y + 5, w - 8, 26, roof);
    rect(x + 10, y, w - 20, 6, roof);
    for (let row = 0; row < 4; row++) {
      rect(x + 5, y + 7 + row * 6, w - 10, 1, dark);
      for (let i = 0; i < Math.floor(w / 12); i++)
        rect(
          x + 8 + i * 12 + (row % 2) * 5,
          y + 8 + row * 6,
          1,
          4,
          "#ffffff18",
        );
    }
    rect(x + w - 19, y - 3, 8, 16, dark);
    rect(x + w - 21, y - 5, 12, 4, "#e3c4a0");
    for (const wx of [x + 13, x + w - 26]) {
      rect(wx - 2, y + 40, 16, 17, "#ac9775");
      rect(wx, y + 41, 12, 12, "#6faaa9");
      rect(wx + 1, y + 42, 4, 4, "#bde0cb");
      rect(wx + 5, y + 41, 2, 12, "#e9d6a5");
      rect(wx, y + 46, 12, 2, "#e9d6a5");
      rect(wx - 3, y + 56, 18, 3, dark);
      flower(wx + 2, y + 53, "#f4ad89");
    }
    rect(x + w / 2 - 8, y + hh - 24, 16, 24, "#8f785b");
    rect(x + w / 2 - 6, y + hh - 22, 12, 21, "#b49a71");
    rect(x + w / 2 + 3, y + hh - 13, 2, 2, "#f4df9d");
    rect(x + w / 2 - 10, y + hh, 20, 3, "#c7c39c");
  }
  const tree = (x: number, y: number) => {
    rect(x - 8, y + 7, 27, 10, "#76995f55");
    rect(x + 4, y + 6, 6, 17, "#927653");
    rect(x + 4, y + 6, 2, 14, "#b29361");
    rect(x - 6, y - 15, 25, 24, "#4f805d");
    rect(x - 10, y - 9, 33, 14, "#4f805d");
    rect(x - 3, y - 20, 19, 7, "#619568");
    rect(x - 6, y - 12, 25, 16, "#70a170");
    rect(x - 9, y - 7, 8, 9, "#659768");
    rect(x - 3, y - 16, 19, 8, "#7aaa74");
    rect(x + 2, y - 18, 9, 3, "#9cbd79");
    rect(x + 11, y - 8, 9, 11, "#5c9265");
    rect(x - 3, y + 4, 18, 4, "#406e54");
    rect(x - 5, y - 6, 5, 2, "#96b97a");
  };
  for (const t of trees) tree(t.x * 16 + 7, t.y * 16 + 2);
  // Fence around a garden, benches, postbox and signpost.
  for (let x = 29; x <= 35; x++) {
    rect(x * 16, 26 * 16 + 3, 16, 2, "#dbcc9d");
    rect(x * 16, 26 * 16 + 8, 16, 2, "#dbcc9d");
    rect(x * 16 + 2, 26 * 16, 3, 13, "#f3e4b9");
  }
  for (const [x, y] of [
    [21, 22],
    [27, 25],
  ]) {
    rect(x * 16, y * 16, 19, 5, "#b18a5f");
    rect(x * 16, y * 16 + 6, 19, 4, "#d0aa77");
    rect(x * 16 + 2, y * 16 + 10, 2, 4, "#786b52");
    rect(x * 16 + 15, y * 16 + 10, 2, 4, "#786b52");
  }
  rect(22 * 16, 20 * 16, 3, 23, "#90714e");
  rect(22 * 16 - 8, 20 * 16, 22, 10, "#e7d3a0");
  rect(22 * 16 - 6, 20 * 16 + 2, 18, 1, "#f8e8ba");
  c.fillStyle = "#685c49";
  c.font = "5px monospace";
  c.fillText("COAST", 22 * 16 - 6, 20 * 16 + 7);
  rect(28 * 16, 23 * 16, 3, 15, "#74684f");
  rect(28 * 16 - 3, 23 * 16 - 2, 10, 9, "#c4735c");
  rect(28 * 16 - 2, 23 * 16, 8, 2, "#e5ad84");
  for (const [x, y] of [
    [17, 35],
    [31, 36],
    [12, 37],
  ]) {
    rect(x * 16, y * 16, 7, 3, "#d3a98a");
    rect(x * 16 + 2, y * 16 - 2, 3, 2, "#f8e7b4");
  }
  // A small dinghy beyond the pier, decorative only.
  rect(28 * 16, 41 * 16, 12, 28, "#9b7756");
  rect(28 * 16 + 2, 41 * 16 + 3, 8, 21, "#edd6a2");
  rect(28 * 16 + 2, 41 * 16 + 11, 8, 3, "#bc9669");
  return canvas;
}
export function PixelWorldMap({
  camera,
  onPan,
  onSize,
}: {
  camera: Point;
  onPan: (dx: number, dy: number) => void;
  onSize: (size: Point) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    map = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<Point | null>(null);
  useEffect(() => {
    map.current = buildWorld();
    const canvas = ref.current!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.ceil(r.width / scale);
      canvas.height = Math.ceil(r.height / scale);
      onSize({ x: r.width, y: r.height });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => observer.disconnect();
  }, [onSize]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !map.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#a9c778";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      map.current,
      Math.round(canvas.width / 2 - camera.x),
      Math.round(canvas.height / 2 - camera.y),
    );
  }, [camera]);
  function pointer(e: PointerEvent<HTMLCanvasElement>) {
    if (last.current) {
      onPan(
        (last.current.x - e.clientX) / scale,
        (last.current.y - e.clientY) / scale,
      );
      last.current = { x: e.clientX, y: e.clientY };
    }
  }
  return (
    <canvas
      ref={ref}
      className="world-map"
      aria-label="Demo coastal town with paths, cottages, trees, beach and water. Drag to explore."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={pointer}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
      onLostPointerCapture={() => (last.current = null)}
    />
  );
}
