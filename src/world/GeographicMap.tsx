import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
maplibregl.setWorkerUrl(workerUrl);
import "maplibre-gl/dist/maplibre-gl.css";
import type { LocationFix } from "../mobile/location";
import type { Profile } from "./profile";
import type { GearBlueprint } from "../lib/gear";
import { PlayerAvatar } from "./PlayerAvatar";
import { Crab } from "../components/Crab";
import {
  pixelWorldStyle,
  terrainPatterns,
  terrainTile,
  pixelScale,
} from "./pixelStyle";
import { companionPosition, metres } from "../mobile/location";
export function GeographicMap({
  fix,
  follow,
  recenter,
  profile,
  gear,
  onPan,
  active = true,
}: {
  fix: LocationFix;
  follow: boolean;
  recenter: number;
  profile: Profile;
  gear: GearBlueprint["id"][];
  onPan: () => void;
  active?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null);
  const player = useRef<HTMLDivElement>(null),
    crab = useRef<HTMLDivElement>(null);
  const latest = useRef({ fix, follow, onPan });
  latest.current = { fix, follow, onPan };
  const trail = useRef<LocationFix[]>([fix]);
  const [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [facing, setFacing] = useState<"up" | "down" | "left" | "right">(
    "down",
  );
  const [loading, setLoading] = useState(true);
  const [walking, setWalking] = useState(false);
  const [frame, setFrame] = useState(0);
  const [labels, setLabels] = useState<
    { text: string; x: number; y: number }[]
  >([]);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const reduced =
    profile.motion === "reduced" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!walking || reduced || !active) return;
    const timer = setInterval(() => setFrame((n) => n + 1), 180);
    return () => clearInterval(timer);
  }, [walking, reduced, active]);
  useEffect(() => () => clearTimeout(walkTimer.current), []);
  useEffect(() => {
    let m: maplibregl.Map;
    setLoading(true);
    setLabels([]);
    container.current?.removeAttribute("data-map-ready");
    try {
      m = new maplibregl.Map({
        container: container.current!,
        style: pixelWorldStyle(),
        pixelRatio: 1 / pixelScale,
        canvasContextAttributes: { antialias: false },
        minZoom: 15,
        maxZoom: 19,
        dragRotate: false,
        touchPitch: false,
        bearing: 0,
        center: [latest.current.fix.longitude, latest.current.fix.latitude],
        zoom: 17,
        pitch: 0,
        attributionControl: { compact: true },
        renderWorldCopies: false,
      });
    } catch {
      setError(true);
      setLoading(false);
      return;
    }
    map.current = m;
    m.touchZoomRotate.disableRotation();
    m.setMissingStyleImageResolver((id) => {
      if (
        terrainPatterns.includes(id as (typeof terrainPatterns)[number]) &&
        !m.hasImage(id)
      )
        m.addImage(id, terrainTile(id as (typeof terrainPatterns)[number]));
    });
    // Labels remain full-resolution DOM text over the pixel terrain.
    const updateLabels = () => {
      if (!m.isStyleLoaded()) return;
      const chosen: { text: string; x: number; y: number }[] = [];
      for (const feature of m.queryRenderedFeatures(undefined, {
        layers: ["street-label-guide"],
      })) {
        const text = feature.properties?.name;
        if (
          typeof text !== "string" ||
          !text.trim() ||
          chosen.some((l) => l.text === text)
        )
          continue;
        const geometry = feature.geometry;
        const coordinates =
          geometry.type === "LineString"
            ? geometry.coordinates
            : geometry.type === "MultiLineString"
              ? geometry.coordinates[0]
              : null;
        if (!coordinates?.length) continue;
        const middle = coordinates[Math.floor(coordinates.length / 2)];
        const { x, y } = m.project([middle[0], middle[1]]);
        if (
          x < 65 ||
          x > m.getContainer().clientWidth - 65 ||
          y < 155 ||
          y > m.getContainer().clientHeight - 180
        )
          continue;
        const current = latest.current.fix;
        const playerPoint = m.project([current.longitude, current.latitude]);
        if (Math.hypot(x - playerPoint.x, y - playerPoint.y) < 65) continue;
        if (chosen.some((l) => Math.hypot(x - l.x, y - l.y) < 100)) continue;
        chosen.push({ text, x: Math.round(x), y: Math.round(y) });
        if (chosen.length === 4) break;
      }
      setLabels(chosen);
    };
    m.on("idle", updateLabels);
    m.on("movestart", () => setLabels([]));
    const human = new maplibregl.Marker({
      element: player.current!,
      subpixelPositioning: false,
      anchor: "bottom",
    })
      .setLngLat([latest.current.fix.longitude, latest.current.fix.latitude])
      .addTo(m);
    const companion = new maplibregl.Marker({
      element: crab.current!,
      subpixelPositioning: false,
      offset: [27, 12],
      anchor: "bottom",
    })
      .setLngLat([latest.current.fix.longitude, latest.current.fix.latitude])
      .addTo(m);
    const update = () => {
      const p = latest.current.fix,
        c = companionPosition(trail.current) ?? p;
      human.setLngLat([p.longitude, p.latitude]);
      companion.setLngLat([c.longitude, c.latitude]);
    };
    m.on("render", update);
    m.on("dragstart", () => latest.current.onPan());
    m.on("zoomstart", (event) => {
      if (event.originalEvent) latest.current.onPan();
    });
    const loadTimeout = setTimeout(() => {
      setError(true);
      setLoading(false);
    }, 15000);
    let sourceFailed = false;
    m.on("error", () => {
      sourceFailed = true;
      setError(true);
      setLoading(false);
      clearTimeout(loadTimeout);
    });
    m.on("load", () => {
      clearTimeout(loadTimeout);
      setLoading(false);
      setError(sourceFailed);
      if (!sourceFailed)
        container.current?.setAttribute("data-map-ready", "true");
    });
    return () => {
      clearTimeout(loadTimeout);
      human.remove();
      companion.remove();
      m.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const previous = trail.current.at(-1)!;
    if (metres(previous, fix) > 0.5) {
      clearTimeout(walkTimer.current);
      setWalking(true);
      walkTimer.current = setTimeout(() => setWalking(false), 1000);
      const x =
          (fix.longitude - previous.longitude) *
          Math.cos((fix.latitude * Math.PI) / 180),
        y = fix.latitude - previous.latitude;
      setFacing(
        Math.abs(x) > Math.abs(y)
          ? x > 0
            ? "right"
            : "left"
          : y > 0
            ? "up"
            : "down",
      );
      trail.current = [...trail.current.slice(-99), fix];
    }
    if (follow)
      map.current?.easeTo({
        center: [fix.longitude, fix.latitude],
        duration:
          profile.motion === "reduced" ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 800,
      });
    map.current?.triggerRepaint();
  }, [fix, follow, recenter, profile.motion]);
  return (
    <>
      <div
        ref={container}
        className="geographic-map"
        aria-label="Map of your actual surroundings"
      />
      <div className="street-labels" aria-hidden="true">
        {labels.map((label) => (
          <span key={label.text} style={{ left: label.x, top: label.y }}>
            {label.text}
          </span>
        ))}
      </div>
      <div ref={player} className="gps-avatar">
        <PlayerAvatar
          profile={profile}
          facing={facing}
          walking={walking && active && !reduced}
          frame={frame}
        />
      </div>
      <div
        ref={crab}
        className={`gps-crab companion ${walking && active && !reduced ? "walking" : ""}`}
        data-gear={gear.join(",")}
      >
        <Crab gear={gear} label="Your equipped red crab companion" />
      </div>
      {loading && !error && (
        <div className="map-loading" role="status">
          Drawing your surroundings…
        </div>
      )}
      {error && (
        <div className="map-error" role="status">
          Map could not load. Your local game is still available.{" "}
          <button
            onClick={() => {
              setError(false);
              setAttempt((n) => n + 1);
            }}
          >
            Retry map
          </button>
        </div>
      )}
    </>
  );
}
