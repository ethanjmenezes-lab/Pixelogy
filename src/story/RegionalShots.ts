// Original Pixelogy scene props and environmental animation; no downloaded assets.
export function drawRegionalShot(
  ctx: CanvasRenderingContext2D,
  id: string,
  t: number,
) {
  const r = id.startsWith("end") ? (id === "end.01" ? 5 : 1) : Number(id[1]);
  const out = id[2] === "o",
    n = Number(id.slice(-2)),
    end = id.startsWith("end");
  const e = (v: number) => Math.max(0, Math.min(1, v));
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const box = (x: number, y: number, w: number, h: number, c: string) => {
    rect(x - 3, y - 3, w + 6, h + 6, "#282044");
    rect(x, y, w, h, c);
  };
  const text = (
    s: string,
    x: number,
    y: number,
    size = 10,
    color = "#282044",
  ) => {
    ctx.fillStyle = color;
    ctx.font = "bold " + size + "px monospace";
    ctx.fillText(s, x, y);
  };
  const line = (
    x: number,
    y: number,
    a: number,
    b: number,
    c: string,
    w = 3,
  ) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(a, b);
    ctx.stroke();
  };
  const palette =
    r === 2
      ? ["#9bbac9", "#308b99", "#a68b77"]
      : r === 3
        ? ["#282044", "#594793", "#6e5c8e"]
        : r === 4
          ? ["#4e7480", "#34756b", "#83a77a"]
          : r === 5
            ? ["#484d6d", "#286681", "#9ca9b6"]
            : ["#bfeadd", "#25c6b2", "#edc58a"];
  rect(0, 0, 480, 320, palette[0]);
  rect(0, 92, 480, 228, palette[1]);
  rect(0, 225, 480, 95, palette[2]);
  for (let i = 0; i < 10; i++) {
    const x = ((i * 69 + t * (r === 5 ? 18 : 7)) % 530) - 30;
    rect(x, 122 + (i % 4) * 22, 25, 3, "#b0e5d4");
    rect(x + 8, 126 + (i % 4) * 22, 16, 3, "#78b9af");
  }
  for (let i = 0; i < 5; i++) {
    const x = i * 110 + ((t * 3) % 100);
    rect(
      x,
      26 + (i % 2) * 14,
      47,
      7,
      palette[0] === "#282044" ? "#443c69" : "#ccd5cb",
    );
  }
  const billboard = (x: number, y: number, w = 110, h = 65, news = false) => {
    rect(x + 8, y + h, 5, 28, "#594793");
    rect(x + w - 13, y + h, 5, 28, "#594793");
    box(x, y, w, h, news ? "#fff8df" : "#594793");
    if (news) {
      rect(x + 7, y + 9, w - 14, 5, "#d44d43");
      for (let i = 0; i < 4; i++)
        rect(x + 7, y + 24 + i * 8, w - 23 - (i % 2) * 12, 3, "#594793");
    } else {
      rect(x + 7, y + 9, w - 14, h - 18, "#25c6b2");
      rect(x + 7, y + h - 20, w - 14, 11, "#fff8df");
      rect(x + w * 0.6, y + 17, 13, 13, "#282044");
      rect(x + w * 0.6 - 4, y + 30, 23, 20, "#282044");
    }
  };
  const terminal = (x: number, y: number) => {
    box(x, y, 110, 73, "#282044");
    box(x + 5, y + 5, 100, 57, "#b5d7be");
    rect(x + 44, y + 73, 20, 12, "#594793");
    rect(x + 22, y + 83, 66, 5, "#594793");
    for (let i = 0; i < 4; i++) {
      rect(x + 13, y + 13 + i * 11, 64, 3, "#594793");
      rect(
        x + 82,
        y + 12 + i * 11,
        9,
        6,
        i < Math.floor(t) ? "#f58a08" : "#fff8df",
      );
    }
  };
  const report = (x: number, y: number, altered = false) => {
    box(x, y, 78, 94, "#fff8df");
    rect(x + 8, y + 10, 55, 4, "#594793");
    for (let i = 0; i < 5; i++)
      rect(
        x + 8,
        y + 24 + i * 10,
        40 + (i % 2) * 17,
        3,
        altered ? "#25a694" : "#be5058",
      );
    if (altered) text("APPROVED", x + 8, y + 86, 10, "#1e665f");
  };
  const caseProp = (x: number, y: number) => {
    box(x, y, 94, 46, "#594793");
    rect(x + 30, y - 9, 30, 6, "#594793");
    rect(x + 5, y + 4, 84, 38, "#9387ad");
    rect(x + 40, y + 15, 14, 8, "#fff8df");
    if (t > 1) {
      rect(x + 3, y + 5, 88, 8, "#282044");
      report(x + 12, y - 40 * e((t - 1) / 2));
    }
  };
  const map = (x = 110, y = 132) => {
    box(x, y, 240, 135, "#fff8df");
    rect(x + 8, y + 8, 224, 119, "#25b9aa");
    for (let i = 0; i < 5; i++) {
      box(x + 18 + i * 39, y + 91 - i * 17, 26, 22, "#edc58a");
      if (i < t * 1.5) rect(x + 27 + i * 39, y + 98 - i * 17, 8, 8, "#f58a08");
    }
    line(x + 31, y + 102, x + 190, y + 31, "#fff8df", 4);
    rect(x + 183, y + 24, 11, 11, "#ce4b46");
  };
  const crate = (x: number, y: number) => {
    box(x, y, 45, 30, "#b08d62");
    rect(x + 20, y, 4, 30, "#e6c698");
  };
  const conveyor = (y: number, stop = false) => {
    rect(30, y, 400, 12, "#282044");
    for (let i = 0; i < 8; i++) rect(35 + i * 50, y + 12, 7, 9, "#594793");
    for (let i = 0; i < 5; i++) {
      const x = 30 + ((i * 83 + (stop ? 0 : t * 24)) % 365);
      crate(x, y - 30);
    }
  };
  if (r === 2) {
    // Harbor cranes, stacked containers and reflected ripples.
    for (let i = 0; i < 2; i++) {
      rect(75 + i * 270, 30, 8, 175, "#dc9a54");
      rect(38 + i * 250, 30, 138, 8, "#dc9a54");
      line(42 + i * 250, 38, 42 + i * 250, 115 + Math.sin(t) * 7, "#282044");
    }
    for (let i = 0; i < 6; i++) {
      box(
        170 + (i % 3) * 55,
        165 - Math.floor(i / 3) * 32,
        52,
        28,
        i % 2 ? "#594793" : "#bd784e",
      );
    }
    billboard(340, 65, 110, 65);
    if (!out && n === 2) {
      crate(96, 202);
      crate(298, 202);
      box(68, 126, 145, 60, "#fff8df");
      box(262, 126, 160, 60, "#fff8df");
      text("DISPOSAL", 80, 149);
      text("EMERGENCY CLEANUP", 269, 149, 9);
      text("#401", 112, 174, 14);
      text("#401", 318, 174, 14);
    }
    if (out && n === 1) {
      terminal(205, 116);
      rect(336, 182 + e(t / 1.5) * 62, 7, 24, "#d1d5db");
      rect(330, 180 + e(t / 1.5) * 62, 19, 6, "#d1d5db");
    }
    if (out && n === 2) {
      terminal(205, 116);
      box(173, 216, 23, 34, "#fff8df");
      rect(178, 224, 13, e(t / 4) * 20, "#25c6b2");
      const x = 90 + t * 57;
      rect(x, 70, 28, 8, "#282044");
      rect(x + 8, 76, 12, 10, "#f58a08");
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fff8df";
      ctx.beginPath();
      ctx.moveTo(x + 14, 82);
      ctx.lineTo(x - 55, 282);
      ctx.lineTo(x + 80, 282);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (out && n === 3) {
      billboard(150, 68, 200, 122);
      rect(240, 99, 24, 24, "#f6c1a2");
      rect(226, 124, 54, 47, "#ed8cce");
      for (let i = 0; i < 5; i++)
        rect(
          158,
          77 + i * 23,
          184,
          2,
          Math.floor(t * 4) % 2 ? "#bd91d5" : "#a9ddab",
        );
    }
  }
  if (r === 3) {
    for (let i = 0; i < 4; i++) {
      box(i * 126 + 8, 68, 105, 96, "#3a3058");
      rect(
        i * 126 + 8,
        66,
        105,
        5,
        ["#f58a08", "#25c6b2", "#ed8acb"][Math.floor(t + i) % 3],
      );
      rect(i * 126 + 20, 100, 76, 55, "#594793");
    }
    for (let i = 0; i < 8; i++)
      line(0, 231 + i * 12, 480, 231 + i * 12, "#8c74a5", 2);
    billboard(180, 28, 150, 97);
    for (let i = 0; i < 7; i++)
      rect((60 * i + t * 7) % 480, 180 + (i % 2) * 11, 10, 5, "#9a9a98");
    if (!out && n === 2) {
      box(40, 90, 185, 118, "#25c6b2");
      box(255, 90, 185, 118, "#25c6b2");
      rect(43, 181, 179, 24, "#fff8df");
      rect(258, 181, 179, 24, "#b6a48f");
      for (let i = 0; i < 6; i++) rect(266 + i * 26, 181, 12, 9, "#594793");
      rect(233, 85, 8, 130, "#fff8df");
    }
    if (out && n === 1) {
      terminal(40, 175);
      billboard(170, 65, 230, 125, true);
      rect(182, 89, 205, 77, "#282044");
      crate(214, 112);
      rect(278, 112, 60, 26, "#594793");
      if (t < 1.5)
        for (let i = 0; i < 8; i++)
          rect(177, 70 + i * 14, 215, 5, i % 2 ? "#25c6b2" : "#fff8df");
    }
    if (out && n === 2) {
      for (let i = 0; i < 4; i++) {
        box(60 + i * 93, 210, 18, 27, "#282044");
        rect(63 + i * 93, 214, 12, 16, "#25c6b2");
      }
    }
    if (out && n === 3) {
      box(165, 93, 143, 167, "#282044");
      rect(173, 102, 127, 148, "#fff8df");
      rect(182, 111, 109, 55, "#75b3a0");
      rect(234, 128, 9, 12, "#d44d43");
      report(196, 179);
    }
  }
  if (r === 4) {
    for (let i = 0; i < 7; i++) {
      const x = i * 75;
      rect(x, 80, 6, 159, "#596447");
      line(x + 3, 218, x - 20, 249, "#596447", 7);
      line(x + 3, 218, x + 20, 249, "#596447", 7);
      box(x - 20, 38, 60, 66, "#3c675c");
    }
    rect(0, 243, 480, 20, "#a58c6b");
    for (let i = 0; i < 16; i++) rect(i * 31, 243, 2, 20, "#594793");
    box(306, 112, 108, 103, "#b8c8ac");
    rect(300, 103, 120, 9, "#594793");
    rect(330, 137, 40, 31, t > 1 ? "#fff8df" : "#594793");
    for (let i = 0; i < 15; i++) {
      rect(i * 37, 275, 3, 31, "#467a65");
      if (Math.floor(t * 2 + i) % 3 === 0) rect(i * 37, 271, 3, 4, "#a6e6b0");
    }
    if (!out && n === 2) {
      report(123, 144);
      report(260, 144, true);
    }
    if (!out && n === 3) {
      caseProp(206, 199);
      for (let i = 0; i < 3; i++) {
        rect(410 - i * 25 - t * 25, 272, 13, 8, "#282044");
        rect(418 - i * 25 - t * 25, 258, 10, 15, "#594793");
      }
    }
    if (out && n === 1) caseProp(202, 208);
    if (out && n === 2) {
      rect(28, 234, 120 * e(t / 4), 7, "#fff8df");
      for (let i = 0; i < 3; i++) {
        rect(95 + i * 68, 278, 16, 4, "#877962");
        rect(100 + i * 68, 264, 5, 14, "#a9ddab");
      }
      box(340, 220, 30, 26, "#fff8df");
    }
    if (out && n === 3) {
      map();
      box(293, 250, 50, 20, "#fff8df");
      for (let i = 0; i < 5; i++) rect(300 + i * 7, 255, 3, 10, "#594793");
    }
  }
  if (r === 5) {
    rect(55, 214, 390, 20, "#594793");
    rect(65, 234, 12, 86, "#4b5372");
    rect(417, 234, 12, 86, "#4b5372");
    box(130, 66, 250, 149, "#c2c6d3");
    box(170, 28, 170, 38, "#9b9fb6");
    for (let i = 0; i < 12; i++)
      rect(145 + (i % 6) * 38, 83 + Math.floor(i / 6) * 39, 23, 23, "#594793");
    billboard(220, 26, 103, 55, end);
    conveyor(199, end && t > 1);
    if (!out && n === 2) {
      text("WASTE", 75, 155, 12);
      text("EMERGENCY CONTRACT", 220, 155, 12);
    }
    if (!out && n === 3) {
      rect(186, 125, 100, 105, "#282044");
      rect(186 - 42 * e(t / 3), 125, 50, 105, "#9387ad");
      rect(236 + 42 * e(t / 3), 125, 50, 105, "#9387ad");
    }
    if (out && n === 1) {
      report(204, 150);
      for (let i = 0; i < 3; i++)
        box(45 + i * 140, 59, 85, 56, t > 1 + i * 0.6 ? "#fff8df" : "#594793");
      line(240, 205, 400, 85, "#f58a08", 3);
    }
    if (out && n === 2) {
      for (let i = 0; i < 4; i++)
        billboard(14 + i * 119, 87, 101, 77, t > i * 0.6);
      conveyor(243, t > 1.5);
    }
    if (out && n === 3) {
      const x = 120 + t * 22;
      box(x, 231, 160, 34, "#fff8df");
      box(x + 36, 207, 57, 24, "#594793");
      rect(x + 50, 211, 23, 12, "#25c6b2");
      conveyor(199, true);
    }
    if (end) {
      for (let i = 0; i < 4; i++) {
        rect(25 + i * 116, 104, 15, 80, t > i * 0.8 ? "#594793" : "#f58a08");
        billboard(20 + i * 115, 190, 92, 60, true);
      }
    }
  }
  if (end && n > 1) {
    // Human-led recovery: sorting stations, retained damage, dune plantings.
    for (let i = 0; i < 3; i++) {
      box(330 + i * 34, 252, 25, 38, ["#25c6b2", "#f58a08", "#594793"][i]);
    }
    for (let i = 0; i < 8; i++)
      rect(
        30 + i * 33,
        284 + (i % 2) * 5,
        9,
        5,
        i > t + 2 ? "#8e8a88" : palette[2],
      );
    if (n === 2) {
      box(20, 195, 73, 40, "#594793");
      rect(25, 200, 63, 28, "#f58a08");
      line(20, 195, 93, 235, "#fff8df");
    }
    if (n === 3) {
      billboard(83, 82, 160, 95);
      rect(88, 86, 150 * e(t / 2), 84, "#fff8df");
      rect(96, 119, 133 * e(t / 2), 36, "#25c6b2");
      rect(146, 124, 19, 17, "#e9654c");
      rect(130, 104, 10, 32, "#594793");
      rect(350, 208, 100, 8, "#a58c6b");
      box(356, 236, 12, 20, "#bce6d5");
    }
    if (n === 5) {
      rect(383, 26, 35, 35, "#f5b14a");
      for (let i = 0; i < 6; i++)
        rect(190 + i * 35, 285 - i * 12, 43, 45 + i * 12, "#e5b071");
    }
    if (n === 6) {
      map(110, 120);
      for (let i = 0; i < 5; i++)
        text("★", 137 + i * 39, 213 - i * 17, 13, "#fff8df");
    }
  }
}
