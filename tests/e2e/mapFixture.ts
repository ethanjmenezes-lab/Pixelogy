// Small, authored MVT fixture: real-coordinate geometry, no network or production mocks.
// Encodes only the protobuf fields needed by the Mapbox Vector Tile specification.
const varint = (value: number): number[] => {
  const bytes: number[] = [];
  do {
    const low = value % 128;
    value = Math.floor(value / 128);
    bytes.push(low + (value ? 128 : 0));
  } while (value);
  return bytes;
};
const field = (tag: number, value: number) => [
  ...varint(tag * 8),
  ...varint(value),
];
const bytes = (tag: number, value: number[]) => [
  ...varint(tag * 8 + 2),
  ...varint(value.length),
  ...value,
];
const string = (tag: number, value: string) =>
  bytes(tag, [...new TextEncoder().encode(value)]);
const zigzag = (value: number) => (value < 0 ? -2 * value - 1 : 2 * value);
type Feature = {
  type: 2 | 3;
  points: number[][];
  properties: Record<string, string>;
};
const polygon = (
  west: number,
  south: number,
  east: number,
  north: number,
  properties: Record<string, string> = {},
): Feature => ({
  type: 3,
  points: [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ],
  properties,
});
const layers: Record<string, Feature[]> = {
  park: [polygon(-96.3409, 30.6202, -96.3401, 30.6208)],
  water: [polygon(-96.3399, 30.6193, -96.3388, 30.6197)],
  building: [
    polygon(-96.3409, 30.6197, -96.3405, 30.62),
    polygon(-96.3397, 30.6202, -96.3394, 30.6205),
  ],
  transportation: [
    {
      type: 2,
      points: [
        [-96.342, 30.62005],
        [-96.338, 30.62005],
      ],
      properties: { class: "minor" },
    },
    {
      type: 2,
      points: [
        [-96.34, 30.618],
        [-96.34, 30.622],
      ],
      properties: { class: "path" },
    },
    {
      type: 2,
      points: [
        [-96.3395, 30.6192],
        [-96.3395, 30.6198],
      ],
      properties: { class: "minor", brunnel: "bridge" },
    },
  ],
  transportation_name: [
    {
      type: 2,
      points: [
        [-96.3405, 30.62005],
        [-96.34, 30.62005],
        [-96.3395, 30.62005],
      ],
      properties: { name: "Coastal Walk" },
    },
  ],
};
export function mapTile(z: number, tileX: number, tileY: number) {
  const tile: number[] = [];
  for (const [name, features] of Object.entries(layers)) {
    const keys = [
      ...new Set(features.flatMap((f) => Object.keys(f.properties))),
    ];
    const values = [
      ...new Set(features.flatMap((f) => Object.values(f.properties))),
    ];
    const layer = [...string(1, name), ...field(15, 2), ...field(5, 4096)];
    for (const feature of features) {
      let px = 0,
        py = 0;
      const geometry: number[] = [];
      feature.points.forEach(([lon, lat], index) => {
        const sin = Math.sin((lat * Math.PI) / 180);
        const x = Math.round((((lon + 180) / 360) * 2 ** z - tileX) * 4096);
        const y = Math.round(
          ((0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 2 ** z -
            tileY) *
            4096,
        );
        if (index === 0) geometry.push(9);
        else if (index === 1)
          geometry.push((feature.points.length - 1) * 8 + 2);
        geometry.push(zigzag(x - px), zigzag(y - py));
        px = x;
        py = y;
      });
      if (feature.type === 3) geometry.push(15);
      const tags = Object.entries(feature.properties).flatMap(([k, v]) => [
        keys.indexOf(k),
        values.indexOf(v),
      ]);
      layer.push(
        ...bytes(2, [
          ...field(3, feature.type),
          ...bytes(2, tags.flatMap(varint)),
          ...bytes(4, geometry.flatMap(varint)),
        ]),
      );
    }
    for (const key of keys) layer.push(...string(3, key));
    for (const value of values) layer.push(...bytes(4, string(1, value)));
    tile.push(...bytes(3, layer));
  }
  return Buffer.from(tile);
}
