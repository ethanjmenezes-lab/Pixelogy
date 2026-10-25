import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoPath } from "d3-geo";
const codes =
  "01 AL 02 AK 04 AZ 05 AR 06 CA 08 CO 09 CT 10 DE 12 FL 13 GA 15 HI 16 ID 17 IL 18 IN 19 IA 20 KS 21 KY 22 LA 23 ME 24 MD 25 MA 26 MI 27 MN 28 MS 29 MO 30 MT 31 NE 32 NV 33 NH 34 NJ 35 NM 36 NY 37 NC 38 ND 39 OH 40 OK 41 OR 42 PA 44 RI 45 SC 46 SD 47 TN 48 TX 49 UT 50 VT 51 VA 53 WA 54 WV 55 WI 56 WY".split(
    " ",
  );
const byId = Object.fromEntries(
  Array.from({ length: codes.length / 2 }, (_, i) => [
    codes[i * 2],
    codes[i * 2 + 1],
  ]),
);
const raw = JSON.parse(readFileSync("node_modules/us-atlas/states-10m.json"));
const projected = JSON.parse(
  readFileSync("node_modules/us-atlas/states-albers-10m.json"),
);
const paths = feature(projected, projected.objects.states).features;
const states = feature(raw, raw.objects.states)
  .features.filter((s) => byId[s.id])
  .map((s) => ({
    code: byId[s.id],
    name: s.properties.name,
    geometry: s.geometry,
    path: geoPath()(paths.find((p) => p.id === s.id)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
writeFileSync("src/cleanup/states.json", JSON.stringify(states));
writeFileSync(
  "src/cleanup/LICENSE-US-ATLAS.txt",
  readFileSync("node_modules/us-atlas/LICENSE"),
);
