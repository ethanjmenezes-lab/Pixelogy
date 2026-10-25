import { useEffect, useRef } from "react";
import { PlayerAvatar } from "../world/PlayerAvatar";
import { defaultProfile, type Profile } from "../world/profile";
import { Crab } from "../components/Crab";
import type { Shot } from "./script";
const ease = (n: number) => {
  const t = Math.max(0, Math.min(1, n));
  return t * t * (3 - 2 * t);
};
const worker: Profile = {
  ...defaultProfile,
  nickname: "Blacktide worker",
  clothing: 3,
  hat: "cap",
};
export function BabyOpeningStage({
  shot,
  seconds,
  reduced,
  profile,
}: {
  shot: Shot;
  seconds: number;
  reduced: boolean;
  profile: Profile;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const n = Number(shot.id.slice(-2)),
    t = seconds;
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    const box = (x: number, y: number, w: number, h: number, color: string) => {
      c.fillStyle = color;
      c.fillRect(Math.round(x), Math.round(y), w, h);
    };
    box(0, 0, 480, 320, n === 1 ? "#b8ecdd" : "#565276");
    box(0, 92, 480, 135, n === 1 ? "#25c6b2" : "#287e93");
    box(0, 208, 480, 112, "#f2cc91");
    for (let i = 0; i < 12; i++) {
      const x = ((i * 53 + t * 6) % 500) - 20;
      box(x, 130 + (i % 4) * 22, 20, 3, "#8ce2d1");
    }
    for (let i = 0; i < 16; i++)
      box(
        i * 32,
        204 + Math.round(Math.sin(t * 1.5 + i) * 3),
        36,
        7,
        "#fff8df",
      );
    for (let i = 0; i < 9; i++) {
      box(i * 59 + 6, 296, 3, 12, "#57957d");
      box(i * 59 + 10, 291, 3, 12, "#72b296");
    }
    box(35, 60, 6, 150, "#594793");
    box(130, 60, 6, 150, "#594793");
    box(26, 40, 120, 58, "#282044");
    box(31, 45, 110, 48, "#fff8df");
    box(36, 73, 100, 14, "#25c6b2");
    c.fillStyle = "#282044";
    c.font = "bold 11px monospace";
    c.fillText("BLACKTIDE", 40, 63);
    if (n === 1)
      for (let i = 0; i < 3; i++) {
        const x = 200 + i * 65 + Math.sin(t + i) * 14;
        box(x, 244 + i * 11, 10, 6, "#ce4944");
        box(x - 4, 241 + i * 11, 4, 5, "#ce4944");
        box(x + 10, 241 + i * 11, 4, 5, "#ce4944");
      }
    if (n >= 2) {
      for (let i = 0; i < 8; i++) box(240 + i * 30, 170, 4, 50, "#847684");
      box(240, 182, 230, 4, "#847684");
      const tx = n === 2 ? 355 - 60 * ease(t / 2) : 295;
      box(tx, 140, 120, 44, "#594793");
      box(tx + 93, 151, 32, 33, "#f58a08");
      box(tx + 101, 154, 19, 13, "#9ed9d5");
      box(tx + 12, 180, 19, 19, "#282044");
      box(tx + 94, 180, 19, 19, "#282044");
      for (let i = 0; i < 15; i++) {
        const shake = n === 4 && t < 2 ? Math.sin(t * 22 + i) * 3 : 0;
        const fall = n === 2 ? ease((t - i * 0.12) / 1.5) : 1;
        box(
          250 + (i % 5) * 22 + shake,
          175 + fall * (57 + Math.floor(i / 5) * 14),
          18,
          12,
          ["#9c8ca3", "#fff8df", "#b48860", "#8bc9bb"][i % 4],
        );
      }
      if (n === 4 && t < 2) {
        box(275, 220 - Math.sin(t * 18) * 3, 4, 4, "#fff8df");
        box(301, 217, 4, 4, "#fff8df");
      }
    }
    if (n >= 6) {
      c.globalAlpha = 0.28;
      c.fillStyle = "#fff8df";
      c.beginPath();
      c.moveTo(390, 175);
      c.lineTo(125 + Math.sin(t) * 12, 298);
      c.lineTo(270, 298);
      c.fill();
      c.globalAlpha = 1;
    }
  }, [n, t]);
  const camera =
    n === 1
      ? `translateX(${-2 + ease(t / 4) * 4}%) scale(1.06)`
      : n === 4
        ? `scale(${1.08 + ease(t / 3) * 0.12})`
        : n === 5
          ? `scale(${1.08 + ease(t / 4) * 0.08})`
          : `translateX(${2 - ease(t / 4) * 4}%) scale(1.06)`;
  const babyX =
    n === 4
      ? 62 - ease(t / 2) * 10
      : n === 5
        ? 52 - ease(t / 2) * 9
        : n >= 6
          ? 44 + ease(t / 2) * 7
          : 52;
  return (
    <div
      className="shot-stage baby-opening"
      data-animation={shot.id}
      role="img"
      aria-label={shot.visual_action}
    >
      <div
        className="shot-camera"
        style={{ transform: reduced ? "none" : camera }}
      >
        <canvas ref={canvas} width={480} height={320} aria-hidden="true" />
        {n >= 2 && (
          <div
            className="shot-actor"
            data-actor="player"
            style={{
              left: (n === 3 ? 20 + ease(t / 3) * 12 : 32) + "%",
              top: "73%",
              transform: `translate(-50%,-50%) scaleY(${n === 5 ? 0.78 : 1}) translateY(${n === 5 ? 10 : 0}px)`,
            }}
          >
            <PlayerAvatar
              profile={profile}
              facing="right"
              walking={!reduced && n === 3 && t < 3}
              frame={Math.floor(t * 6)}
            />
          </div>
        )}
        {n >= 4 && (
          <div
            className="shot-crab baby-companion"
            data-actor="companion"
            data-gear=""
            style={{
              left: babyX + "%",
              top: (n === 4 ? 78 - ease(t / 2) * 2 : 78) + "%",
              opacity: n === 4 ? ease(t / 0.7) : 1,
              transform: `translateY(${reduced ? 0 : Math.sin(t * 7) * 1.5}px)`,
            }}
          >
            <Crab gear={[]} label="Baby red crab" />
            {n === 5 && (
              <span className="baby-treasure" aria-label="Small trash prop" />
            )}
          </div>
        )}
        {n >= 6 && (
          <div
            className="shot-actor"
            data-actor="worker"
            style={{ left: 92 - ease(t / 1.5) * 17 + "%", top: "65%" }}
          >
            <PlayerAvatar
              profile={worker}
              facing="left"
              walking={!reduced && t < 1.5}
              frame={Math.floor(t * 6)}
            />
          </div>
        )}
      </div>
      {n === 7 && (
        <div
          className="baby-battle-iris"
          style={{
            boxShadow: `inset 0 0 0 ${Math.round(ease(t / 4) * 14)}px #282044`,
          }}
        />
      )}
    </div>
  );
}
