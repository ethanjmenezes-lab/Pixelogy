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
import { companionPosition, metres } from "../mobile/location";
export function GeographicMap({
  fix,
  follow,
  recenter,
  profile,
  gear,
  onPan,
}: {
  fix: LocationFix;
  follow: boolean;
  recenter: number;
  profile: Profile;
  gear: GearBlueprint["id"][];
  onPan: () => void;
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
  useEffect(() => {
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: container.current!,
        style:
          import.meta.env.VITE_MAP_STYLE_URL ||
          "https://tiles.openfreemap.org/styles/liberty",
        center: [latest.current.fix.longitude, latest.current.fix.latitude],
        zoom: 17,
        pitch: 0,
        attributionControl: { compact: true },
        renderWorldCopies: false,
      });
    } catch {
      setError(true);
      return;
    }
    map.current = m;
    const human = new maplibregl.Marker({
      element: player.current!,
      anchor: "bottom",
    })
      .setLngLat([latest.current.fix.longitude, latest.current.fix.latitude])
      .addTo(m);
    const companion = new maplibregl.Marker({
      element: crab.current!,
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
    m.on("error", () => setError(true));
    m.on("load", () => {
      setError(false);
      const layers = m.getStyle().layers;
      for (const layer of layers) {
        if (layer.type === "background")
          m.setPaintProperty(layer.id, "background-color", "#f4ecd8");
        if (layer.type === "fill" && /water/.test(layer.id))
          m.setPaintProperty(layer.id, "fill-color", "#8bc9cb");
        if (layer.type === "fill" && /park|grass|wood/.test(layer.id))
          m.setPaintProperty(layer.id, "fill-color", "#a9c99a");
      }
    });
    return () => {
      human.remove();
      companion.remove();
      m.remove();
      map.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const previous = trail.current.at(-1)!;
    if (metres(previous, fix) > 0.5) {
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
      <div ref={player} className="gps-avatar">
        <PlayerAvatar profile={profile} facing={facing} />
      </div>
      <div ref={crab} className="gps-crab companion" data-gear={gear.join(",")}>
        <Crab gear={gear} label="Your equipped red crab companion" />
      </div>
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
