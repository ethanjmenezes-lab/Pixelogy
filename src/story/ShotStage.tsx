import { drawRegionalShot } from "./RegionalShots";
import { scenes } from "./script";
import { useEffect, useRef } from "react";
import type { Shot } from "./script";
import { PlayerAvatar } from "../world/PlayerAvatar";
import { defaultProfile, type Profile } from "../world/profile";
import { Crab } from "../components/Crab";
import { BabyOpeningStage } from "./BabyOpeningStage";
export const implementedShots = new Set(
  scenes.flatMap((scene) => scene.shots.map((shot) => shot.id)),
);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const nia: Profile = {
  ...defaultProfile,
  nickname: "Nia",
  skin: 2,
  hair: 1,
  hairStyle: "long",
  clothing: 2,
  hat: "none",
};
const roan: Profile = {
  ...defaultProfile,
  nickname: "Roan",
  clothing: 3,
  skin: 1,
  hat: "cap",
};
const sandy: Profile = { ...roan, nickname: "Foreman Sandy", skin: 3, hair: 2 };

function scenery(ctx: CanvasRenderingContext2D, id: string, t: number) {
  if (!id.startsWith("open.") && !id.startsWith("r1")) {
    drawRegionalShot(ctx, id, t);
    return;
  }
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const path = (points: number[][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) =>
      i
        ? ctx.lineTo(Math.round(x), Math.round(y))
        : ctx.moveTo(Math.round(x), Math.round(y)),
    );
    ctx.closePath();
    ctx.fill();
  };
  const box = (x: number, y: number, w: number, h: number, c: string) => {
    rect(x - 2, y - 2, w + 4, h + 4, "#282044");
    rect(x, y, w, h, c);
  };
  const night = id.startsWith("open.") && Number(id.slice(-2)) >= 3;
  rect(0, 0, 480, 320, night ? "#252343" : "#b7e4db");
  rect(0, 100, 480, 160, night ? "#286483" : "#25b9b0");
  rect(0, 210, 480, 110, "#ebbd7c");
  path(
    [
      [0, 184],
      [80, 184],
      [80, 192],
      [170, 192],
      [170, 204],
      [270, 204],
      [270, 198],
      [365, 198],
      [365, 180],
      [480, 180],
      [480, 240],
      [0, 240],
    ],
    "#fff8df",
  );
  path(
    [
      [0, 198],
      [80, 198],
      [80, 206],
      [170, 206],
      [170, 218],
      [270, 218],
      [270, 212],
      [365, 212],
      [365, 194],
      [480, 194],
      [480, 320],
      [0, 320],
    ],
    "#f0c88c",
  );
  // Independently moving cloud, surf and foreground layers provide parallax.
  for (let i = 0; i < 6; i++) {
    const x = ((i * 98 + t * 5) % 600) - 60;
    rect(x, 24 + (i % 3) * 14, 44, 6, night ? "#464263" : "#f6f6dc");
    rect(x + 8, 18 + (i % 3) * 14, 24, 6, night ? "#464263" : "#f6f6dc");
    const ripple = ((i * 91 + t * 11) % 550) - 25;
    rect(ripple, 128 + (i % 3) * 22, 34, 3, night ? "#5992a7" : "#b4f0d7");
    rect(ripple + 8, 131 + (i % 3) * 22, 18, 3, night ? "#427c96" : "#8ddfc9");
  }
  const wave = Math.floor(Math.sin(t * 1.5) * 3) * 2;
  for (let i = 0; i < 12; i++)
    rect(i * 44, 196 + wave + (i % 3) * 4, 28, 4, "#fff8df");
  rect(382, 24, 24, 24, "#fff3cb");
  for (let i = 0; i < 8; i++) {
    const x = i * 67;
    rect(x, 288 + (i % 2) * 15, 3, 17, "#5e977b");
    path(
      [
        [x - 7, 291],
        [x, 304],
        [x + 3, 300],
      ],
      "#75af84",
    );
    path(
      [
        [x + 3, 300],
        [x + 12, 287],
        [x + 8, 304],
      ],
      "#75af84",
    );
  }
  for (let i = 0; i < 7; i++) {
    rect(32 + i * 15, 244 + (i % 2) * 8, 5, 3, "#ce9a66");
  }
  // Dunes, boardwalk, lifeguard stand, cottages and abandoned sandcastle.
  path(
    [
      [0, 264],
      [0, 240],
      [24, 240],
      [24, 232],
      [56, 232],
      [56, 240],
      [92, 240],
      [92, 268],
    ],
    "#e1ab70",
  );
  box(400, 104, 40, 44, "#fff8df");
  rect(394, 98, 52, 8, "#594793");
  rect(409, 116, 10, 10, "#43aeaa");
  rect(426, 126, 10, 22, "#594793");
  rect(17, 140, 30, 8, "#fff8df");
  rect(21, 148, 4, 44, "#594793");
  rect(39, 148, 4, 44, "#594793");
  rect(23, 123, 18, 18, "#f58a08");
  rect(348, 262, 52, 12, "#d59f67");
  rect(354, 250, 8, 12, "#d59f67");
  rect(374, 246, 8, 16, "#d59f67");
  rect(390, 250, 8, 12, "#d59f67");
  rect(370, 265, 10, 9, "#997451");
  if (id === "open.01") {
    const x = 310 + ease(t / 3) * 62;
    rect(x, 262, 14, 8, "#e7583d");
    rect(x - 4, 258, 4, 6, "#ef7350");
    rect(x + 14, 258, 4, 6, "#ef7350");
    // Crab disappears behind the castle rather than simply fading out.
    if (t > 2) rect(366, 258, 22, 16, "#d59f67");
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 85 + t * 8;
      rect(x, 58 + i * 7, 6, 3, "#fff8df");
      rect(x + 8, 55 + i * 7, 6, 3, "#fff8df");
    }
  }
  function truck(x: number, y: number, brand = true) {
    box(x, y, 66, 30, "#66558d");
    box(x + 66, y + 10, 25, 20, "#66558d");
    rect(x + 70, y + 12, 15, 9, "#b7e4db");
    rect(x + 9, y + 27, 13, 13, "#282044");
    rect(x + 69, y + 27, 13, 13, "#282044");
    rect(x + 12, y + 30, 7, 6, "#9688a8");
    rect(x + 72, y + 30, 7, 6, "#9688a8");
    for (let j = 0; j < 4; j++) rect(x + 7 + j * 13, y + 4, 2, 20, "#887aa1");
    if (brand) {
      rect(x + 27, y + 6, 14, 18, "#fff8df");
      rect(x + 30, y + 9, 6, 3, "#594793");
      rect(x + 30, y + 15, 7, 3, "#594793");
    }
  }
  function billboard() {
    rect(120, 96, 6, 83, "#594793");
    rect(248, 96, 6, 83, "#594793");
    box(100, 45, 174, 80, "#594793");
    box(107, 52, 160, 66, "#fff8df");
    rect(112, 85, 150, 28, "#25c6b2");
    rect(112, 103, 150, 10, "#fff8df");
    // Smiling executive silhouette and clean coastline footage.
    rect(210, 61, 18, 18, "#282044");
    rect(202, 79, 34, 30, "#282044");
    rect(214, 72, 10, 2, "#fff8df");
    rect(118, 61, 22, 20, "#594793");
    rect(123, 65, 12, 4, "#fff8df");
    rect(123, 73, 12, 4, "#fff8df");
    if (Math.floor(t * 8) % 11 === 0) rect(108, 78, 158, 3, "#a9ddab");
  }
  if (id === "open.02") {
    billboard();
    truck(-110 + t * 115, 174);
  }
  if (id === "open.03") {
    for (let i = 0; i < 3; i++)
      truck(-110 - i * 112 + ease(t / 3) * 430, 178 + i * 13, false);
    for (let i = 0; i < 3; i++) {
      rect(65 + i * 155, 96, 4, 93, "#594793");
      rect(57 + i * 155, 94, 20, 5, t < i * 0.5 ? "#fff8df" : "#4a4263");
    }
  }
  const dumping = [
    "open.04",
    "open.05",
    "open.06",
    "open.07",
    "open.08",
  ].includes(id);
  if (dumping) {
    truck(320, 157);
    rect(320, 55, 8, 111, "#c5965b");
    rect(184, 55, 144, 8, "#c5965b");
    rect(190, 59, 3, 42, "#282044");
    ctx.save();
    ctx.translate(208, 132);
    ctx.rotate(id === "open.04" ? -0.35 * ease(t / 2) : -0.35);
    box(-42, -26, 84, 32, "#82779c");
    rect(-12, -20, 18, 18, "#fff8df");
    rect(-8, -16, 10, 3, "#594793");
    rect(-8, -10, 10, 3, "#594793");
    ctx.restore();
    if (id === "open.04") {
      const off = ease(t / 2);
      path(
        [
          [160 + off * 65, 100 - off * 65],
          [242 + off * 85, 100 - off * 35],
          [228 + off * 80, 133 - off * 55],
          [155 + off * 60, 129 - off * 55],
        ],
        "#446f7b",
      );
    }
    for (let n = 0; n < 10; n++) {
      const fall = id === "open.04" ? ease((t - 0.3 - n * 0.1) / 1.7) : 1;
      const x = 168 - (n % 4) * 10 - fall * 25,
        y = 133 + fall * (95 + (n % 3) * 8);
      box(x, y, 12, 10, n % 2 ? "#a5ada7" : "#ded5bc");
      rect(x + 4, y - 3, 4, 3, "#594793");
    }
  }
  if (id === "open.05") {
    ctx.globalAlpha = 0.28;
    path(
      [
        [400, 142],
        [160 - 50 * ease(t), 320],
        [265 + 20 * ease(t), 320],
      ],
      "#fff8df",
    );
    ctx.globalAlpha = 1;
  }
  if (id === "open.06") {
    const lift = ease((t - 0.5) / 2);
    box(180 + lift * 62, 262 - lift * 32, 16, 12, "#74c9c4");
    rect(180 + lift * 62, 258 - lift * 32, 16, 4, "#fff8df");
  }
  if (id === "open.08") {
    for (let n = 0; n < 5; n++) {
      const d = (t * 28 + n * 22) % 130;
      ctx.globalAlpha = 1 - d / 140;
      rect(240 - d, 222 - d / 2, 18, 4, "#fff8df");
      rect(240 + d, 222 - d / 2, 18, 4, "#fff8df");
    }
    ctx.globalAlpha = 1;
  }
  const arrival = id.startsWith("r1i"),
    outro = id.startsWith("r1o");
  if (arrival || outro) {
    truck(296, 151 + Math.sin(t * 10), true);
    box(362, 125, 80, 72, "#887a9b");
    rect(376, 142, 48, 55, "#594793");
    for (let n = 0; n < 4; n++) {
      box(100 + (n % 2) * 27, 196 + Math.floor(n / 2) * 23, 24, 21, "#ac8c6a");
      rect(104 + (n % 2) * 27, 200 + Math.floor(n / 2) * 23, 16, 2, "#fff8df");
    }
    if (id === "r1i.01") {
      const pull = ease(t / 2);
      path(
        [
          [96 + pull * 60, 192],
          [152 + pull * 70, 192 - pull * 20],
          [155 + pull * 65, 237 - pull * 30],
          [94 + pull * 60, 237 - pull * 30],
        ],
        "#5696a0",
      );
    }
    if (id === "r1i.02") {
      for (let i = 0; i < 5; i++)
        rect(200 + i * 30, 251 - i * 12, 8, 4, "#fff8df");
    }
    if (id === "r1o.01") {
      const fall = ease(t / 1.2);
      box(266, 154 + fall * 72, 24, 30, "#a77955");
      rect(269, 160 + fall * 72, 18, 21, "#fff8df");
      if (t > 1.4) {
        box(163, 194, 85, 58, "#fff8df");
        path(
          [
            [170, 237],
            [193, 219],
            [227, 224],
          ],
          "#4bafa3",
        );
        rect(222, 218, 8, 8, "#cf514e");
        rect(180, 205, 36, 3, "#594793");
      }
    }
    if (id === "r1o.02") {
      box(360, 242, 22, 32, "#594793");
      box(391, 242, 22, 32, "#25c6b2");
      // Only some litter disappears when carried to bins; the beach stays imperfect.
      for (let n = 0; n < 5; n++)
        if (n > 1 || t < 1 + n * 0.4)
          box(110 + n * 28, 270 + (n % 2) * 6, 10, 8, "#c6bbae");
    }
    if (id === "r1o.03") {
      box(100, 132, 250, 150, "#fff8df");
      path(
        [
          [123, 248],
          [156, 216],
          [185, 224],
          [205, 200],
          [242, 208],
          [270, 177],
          [310, 169],
        ],
        "#25c6b2",
      );
      for (let i = 0; i < 6; i++)
        rect(
          140 + i * 26,
          244 - i * 13,
          8,
          4,
          i < t * 2 ? "#f58a08" : "#594793",
        );
      rect(294, 161, 12, 12, "#d54b4c");
    }
  }
}
export function ShotStage(props: {
  shot: Shot;
  seconds: number;
  reduced: boolean;
  profile: Profile;
  gear: string[];
}) {
  return props.shot.id.startsWith("baby.") ? (
    <BabyOpeningStage {...props} />
  ) : (
    <OriginalShotStage {...props} />
  );
}
function OriginalShotStage({
  shot,
  seconds,
  reduced,
  profile,
  gear,
}: {
  shot: Shot;
  seconds: number;
  reduced: boolean;
  profile: Profile;
  gear: string[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    id = shot.id,
    t = seconds;
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      scenery(ctx, id, t);
    }
  }, [id, t]);
  const opening = id.startsWith("open."),
    n = Number(id.slice(-2));
  let scale = 1.12,
    x = -2,
    y = -1;
  if (id === "open.01") x = -5 + t * 1.5;
  if (id === "open.02") {
    scale = 1 + ease(t / 4) * 0.35;
    x = 3;
    y = 7;
  }
  if (id === "open.03") y = 5 - ease(t / 3) * 8;
  if (id === "open.04") {
    scale = 1.2;
    x = -8 + ease(t / 5) * 8;
    y = -6;
  }
  if (id === "open.05") {
    scale = 1.05 + 0.2 * (1 - ease(t));
    x = -3;
  }
  if (id === "open.06") {
    scale = 1.45 - ease(t / 4) * 0.3;
    y = -12;
  }
  if (id === "open.07") {
    scale = 1.15;
    x = t < 2.5 ? 5 : -7;
  }
  if (id === "open.08") {
    scale = 1.4 - ease(t / 2) * 0.4;
  }
  if (id === "r1i.01") x = 8 - ease(t / 4) * 12;
  if (id === "r1i.02") x = 4 - ease(t / 4) * 10;
  if (id === "r1o.01") {
    scale = 1 + ease(t / 4) * 0.45;
    y = -8;
  }
  if (id === "r1o.02") scale = 1.3 - ease(t / 4) * 0.3;
  if (id === "r1o.03") {
    scale = 1 + ease(t / 3) * 0.35;
    x = -5;
  }
  if (id.startsWith("r2")) {
    scale = 1.12 + ease(t / 5) * 0.12;
    x = id.endsWith("02") ? -6 + ease(t / 5) * 12 : 0;
    y = id === "r2i.01" ? 9 - ease(t / 4) * 15 : -3;
  }
  if (id.startsWith("r3")) {
    scale = 1.08 + ease(t / 4) * 0.12;
    x = -5 + ease(t / 4) * 10;
    if (id === "r3o.03") {
      scale = 1.1 + ease(t / 4) * 0.4;
      y = -5;
    }
  }
  if (id.startsWith("r4")) {
    scale = 1.05 + ease(t / 5) * 0.2;
    y = -3;
    x = id === "r4o.02" ? -5 + ease(t / 5) * 10 : 0;
  }
  if (id.startsWith("r5")) {
    scale = id.endsWith("03")
      ? 1.2 - ease(t / 4) * 0.15
      : 1.05 + ease(t / 5) * 0.15;
    y = id === "r5i.01" ? 8 - ease(t / 4) * 14 : 0;
    x = id === "r5i.02" ? -7 + ease(t / 5) * 14 : 0;
  }
  if (id.startsWith("end")) {
    scale =
      id === "end.04" ? 1.35 : id === "end.01" ? 1.3 - ease(t / 4) * 0.3 : 1.1;
    x = id === "end.03" ? 8 - ease(t / 5) * 16 : 0;
    y = id === "end.05" ? 5 - ease(t / 5) * 10 : 0;
  }
  const actor = (
    key: string,
    p: Profile,
    left: number,
    top: number,
    extra = "",
    face: "left" | "right" = "right",
  ) => (
    <div
      key={key}
      className={"shot-actor " + extra}
      data-actor={key}
      style={{ left: left + "%", top: top + "%" }}
    >
      <PlayerAvatar
        profile={p}
        facing={face}
        walking={!reduced && t < 2}
        frame={Math.floor(t * 6)}
      />
    </div>
  );
  return (
    <div
      className="shot-stage"
      data-animation={id}
      role="img"
      aria-label={shot.visual_action}
    >
      <div
        className="shot-camera"
        style={{
          transform: reduced
            ? "none"
            : `translate(${x}%,${y}%) scale(${scale})`,
        }}
      >
        <canvas ref={canvas} width={480} height={320} aria-hidden="true" />
        {opening &&
          n >= 4 &&
          actor(
            "player",
            profile,
            n === 7 ? 26 - ease(t) * 3 : 26,
            67,
            "player-recording",
          )}
        {opening &&
          n >= 5 &&
          actor(
            "roan",
            roan,
            78 - ease(t / 1.5) * 12,
            57,
            "security-entry",
            "left",
          )}
        {opening && n >= 6 && (
          <div
            className="shot-crab"
            data-actor="companion"
            data-gear=""
            style={{
              left: (n === 6 ? 37 + ease(t / 3) * 13 : 48) + "%",
              top: (n === 6 ? 73 - ease(t) * 5 : 68) + "%",
              transform: `translateY(${reduced ? 0 : Math.sin(t * 8) * 2}px)`,
            }}
          >
            <Crab gear={[]} label="Companion crab" />
            {n === 6 && (
              <span className="cap-prop" aria-label="Cinematic cap prop" />
            )}
          </div>
        )}
        {opening && n >= 7 && (
          <div
            className="shot-crab enemy-entry"
            data-actor="security-crab"
            style={{ left: 86 - ease(t / 1.5) * 17 + "%", top: "62%" }}
          >
            <Crab gear={["can_shield", "cup_crown"]} label="Security crab" />
          </div>
        )}
        {id === "open.05" && (
          <span
            className="recording-phone"
            style={{ left: "33%", top: 64 - ease(t) * 6 + "%" }}
            aria-hidden="true"
          />
        )}
        {id.startsWith("r1") && actor("player", profile, 21, 68)}
        {id.startsWith("r1") &&
          actor(
            "nia",
            nia,
            id === "r1i.01" ? 36 : 41,
            63,
            id === "r1i.02" ? "pointing" : "",
          )}
        {id.startsWith("r1") && (
          <div
            className="shot-crab"
            data-actor="companion"
            data-gear={gear.join(",")}
            style={{
              left: "31%",
              top: "77%",
              transform: `translateY(${reduced ? 0 : Math.sin(t * 5) * 2}px)`,
            }}
          >
            <Crab gear={gear} label="Your equipped crab" />
          </div>
        )}
        {id === "r1o.01" && actor("sandy", sandy, 65, 51, "defeated", "left")}
        {id === "r1o.02" && (
          <>
            {actor(
              "retreating-guard",
              roan,
              70 + ease(t / 4) * 35,
              54,
              "",
              "left",
            )}
            {[0, 1, 2].map((i) =>
              actor(
                "volunteer-" + i,
                { ...nia, skin: i, clothing: i },
                48 + i * 11 + ease((t - i * 0.3) / 4) * 12,
                72 + (i % 2) * 9,
                "volunteer",
              ),
            )}
          </>
        )}
        {id === "r1o.03" && (
          <span
            className="map-pin-hand"
            style={{ left: 42 + ease(t / 2) * 21 + "%", top: "56%" }}
            aria-hidden="true"
          >
            ◆
          </span>
        )}
        {!opening && !id.startsWith("r1") && (
          <>
            {actor("player", profile, id === "end.05" ? 29 : 25, 69)}
            {actor("nia", nia, 42, 62)}
            {(id.startsWith("r4") ||
              ["r3o.03", "r5o.03", "end.03"].includes(id)) &&
              actor(
                "mara",
                { ...nia, nickname: "Dr. Mara", clothing: 1, hair: 3 },
                63,
                60,
              )}
            <div
              className="shot-crab"
              data-actor="companion"
              data-gear={gear.join(",")}
              style={{
                left: (id === "end.05" ? 42 + ease(t / 5) * 28 : 34) + "%",
                top: (id === "end.05" ? 82 - ease(t / 5) * 21 : 79) + "%",
              }}
            >
              <Crab gear={gear} label="Your equipped crab" />
              {id === "end.05" && (
                <span className="cap-prop" aria-label="Cinematic cap prop" />
              )}
            </div>
            {["r2o.01", "r3o.01", "r5o.01"].includes(id) &&
              actor(
                "boss",
                { ...roan, clothing: id === "r3o.01" ? 2 : 3 },
                77,
                60,
                "defeated",
                "left",
              )}
            {["r3o.02", "r4o.02", "end.02"].includes(id) &&
              [0, 1, 2].map((i) =>
                actor(
                  "community-" + i,
                  { ...nia, skin: i, clothing: i },
                  49 + i * 13 + ease(t / 5) * 7,
                  78 + (i % 2) * 6,
                  "volunteer",
                ),
              )}
            {id === "end.02" &&
              actor(
                "professional",
                { ...roan, clothing: 2 },
                15,
                65,
                "professional",
              )}
          </>
        )}
      </div>
      {id === "open.08" && t > 2 && (
        <div
          className="iris-map"
          style={{ clipPath: `circle(${ease((t - 2) / 2) * 80}% at 50% 55%)` }}
          aria-hidden="true"
        >
          <div className="first-node">1</div>
        </div>
      )}
    </div>
  );
}
