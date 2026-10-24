import type {
  StyleSpecification,
  LayerSpecification,
  ExpressionSpecification,
} from "maplibre-gl";

export const coast = {
  turquoise: "#25c6b2",
  mint: "#a9ddab",
  orange: "#f58a08",
  cream: "#fff8df",
  purple: "#594793",
  ink: "#282044",
};
export const pixelScale = 3;
export const terrainPatterns = ["grass", "water", "roof", "path"] as const;
export type TerrainPattern = (typeof terrainPatterns)[number];

// Original, repeating 16×16 pixel tiles. No downloaded artwork or image service.
export function terrainTile(kind: TerrainPattern) {
  const colors = {
    grass: [coast.mint, "#83c794", "#c9e8b1"],
    water: [coast.turquoise, "#75dfc7", "#169e9c"],
    roof: [coast.cream, "#ead5ad", "#c5abcf"],
    path: [coast.cream, "#f9dda2", "#eeb66b"],
  }[kind];
  const data = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const accent =
        kind === "water"
          ? (y === 4 && x >= 2 && x <= 6) || (y === 11 && x >= 10 && x <= 14)
          : kind === "roof"
            ? y % 8 === 0 || (x + (y < 8 ? 0 : 8)) % 16 === 0
            : (x === 3 && (y === 5 || y === 6)) || (x === 11 && y === 12);
      const color = colors[accent ? 1 : x === 12 && y === 3 ? 2 : 0].slice(1);
      const i = (y * 16 + x) * 4;
      data[i] = parseInt(color.slice(0, 2), 16);
      data[i + 1] = parseInt(color.slice(2, 4), 16);
      data[i + 2] = parseInt(color.slice(4, 6), 16);
      data[i + 3] = 255;
    }
  return { width: 16, height: 16, data };
}
const roadWidth: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  15,
  [
    "match",
    ["get", "class"],
    ["motorway", "trunk", "primary"],
    8,
    ["path", "track", "pedestrian"],
    3,
    5,
  ],
  19,
  [
    "match",
    ["get", "class"],
    ["motorway", "trunk", "primary"],
    32,
    ["path", "track", "pedestrian"],
    12,
    22,
  ],
];
function roads(bridge: boolean): LayerSpecification[] {
  const filter: ExpressionSpecification = [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["!=", ["get", "class"], "rail"],
    [bridge ? "==" : "!=", ["get", "brunnel"], "bridge"],
  ];
  return [
    {
      id: bridge ? "bridge-edge" : "path-edge",
      type: "line",
      source: "world",
      "source-layer": "transportation",
      filter,
      layout: { "line-cap": "square", "line-join": "bevel" },
      paint: {
        "line-color": bridge ? coast.purple : coast.orange,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          ["+", roadWidth[4], 4],
          19,
          ["+", roadWidth[6], 4],
        ] as ExpressionSpecification,
      },
    },
    {
      id: bridge ? "bridge-path" : "pixel-path",
      type: "line",
      source: "world",
      "source-layer": "transportation",
      filter,
      layout: { "line-cap": "square", "line-join": "bevel" },
      paint: { "line-pattern": "path", "line-width": roadWidth },
    },
  ];
}
export function pixelWorldStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Pixelogy • Tropical pixel world",
    sources: {
      world: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution:
          '<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "ground",
        type: "background",
        paint: { "background-color": "#d4e8b8" },
      },
      {
        id: "pixel-grass",
        type: "fill",
        source: "world",
        "source-layer": "landcover",
        paint: { "fill-pattern": "grass", "fill-antialias": false },
      },
      {
        id: "pixel-parks",
        type: "fill",
        source: "world",
        "source-layer": "park",
        paint: { "fill-pattern": "grass", "fill-antialias": false },
      },
      {
        id: "pixel-landuse",
        type: "fill",
        source: "world",
        "source-layer": "landuse",
        filter: [
          "in",
          "class",
          "grass",
          "recreation_ground",
          "village_green",
          "forest",
          "cemetery",
        ],
        paint: { "fill-pattern": "grass", "fill-antialias": false },
      },
      {
        id: "shoreline",
        type: "line",
        source: "world",
        "source-layer": "water",
        paint: { "line-color": coast.cream, "line-width": 6 },
      },
      {
        id: "pixel-water",
        type: "fill",
        source: "world",
        "source-layer": "water",
        paint: { "fill-pattern": "water", "fill-antialias": false },
      },
      {
        id: "streams",
        type: "line",
        source: "world",
        "source-layer": "waterway",
        paint: { "line-color": coast.turquoise, "line-width": 4 },
      },
      ...roads(false),
      {
        id: "rail",
        type: "line",
        source: "world",
        "source-layer": "transportation",
        filter: ["==", "class", "rail"],
        paint: {
          "line-color": coast.purple,
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      },
      ...roads(true),
      {
        id: "building-shadow",
        type: "fill",
        source: "world",
        "source-layer": "building",
        paint: {
          "fill-color": coast.purple,
          "fill-translate": [4, 5],
          "fill-antialias": false,
        },
      },
      {
        id: "pixel-buildings",
        type: "fill",
        source: "world",
        "source-layer": "building",
        paint: { "fill-pattern": "roof", "fill-antialias": false },
      },
      {
        id: "building-outline",
        type: "line",
        source: "world",
        "source-layer": "building",
        paint: { "line-color": coast.purple, "line-width": 2 },
      },
      {
        id: "street-label-guide",
        type: "line",
        source: "world",
        "source-layer": "transportation_name",
        paint: { "line-opacity": 0 },
      },
    ],
  };
}
