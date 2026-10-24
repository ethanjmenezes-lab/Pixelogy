import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Crab } from "../components/Crab";
import { useGame } from "../components/GameContext";
import { equippedBlueprints } from "../lib/storage";
import { levelFor } from "./model";
import { useDeviceLocation } from "../mobile/useLocation";
const GeographicMap = lazy(() =>
  import("./GeographicMap").then((m) => ({ default: m.GeographicMap })),
);

import { PlayerAvatar } from "./PlayerAvatar";

import { GameMenu, PixelIcon } from "./GameMenu";
export function OverworldScreen({ covered }: { covered: boolean }) {
  const { items, loadout, claims, profile } = useGame();
  const [, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  function closeMenu() {
    setMenu(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  }
  const [requested, setRequested] = useState(false);
  const [detached, setDetached] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const gps = useDeviceLocation(requested && !covered && !menu);
  const xp = claims.reduce((sum, c) => sum + c.xpAwarded, 0),
    level = levelFor(xp);
  const gear = equippedBlueprints(loadout, items);
  return (
    <section
      className={`overworld ${profile.motion === "reduced" ? "reduced-motion" : ""}`}
      aria-label="Pixelogy GPS overworld"
      inert={covered}
      data-camera-mode={detached ? "detached" : "follow"}
    >
      {gps.fix ? (
        <Suspense fallback={<div className="location-backdrop" />}>
          <GeographicMap
            fix={gps.fix}
            follow={!detached}
            recenter={recenter}
            profile={profile}
            gear={gear}
            onPan={() => setDetached(true)}
          />
        </Suspense>
      ) : (
        <div className="location-backdrop" />
      )}
      {!gps.fix || gps.status !== "ready" ? (
        <section className="location-message panel" aria-live="polite">
          <span className="eyebrow">YOUR REAL-WORLD ADVENTURE</span>
          <h1>
            {!requested
              ? "Find your place."
              : gps.status === "loading"
                ? "Finding your location…"
                : gps.status === "denied"
                  ? "Location permission is off"
                  : gps.status === "inaccurate"
                    ? "Waiting for a clearer location"
                    : "Location unavailable"}
          </h1>
          <p>
            {!requested
              ? "Pixelogy uses your location while the world is open to place you and your crab on a real map. Map requests share the viewed region with OpenFreeMap. Your location is not saved."
              : gps.status === "denied"
                ? "Enable location for Pixelogy in your device or browser settings, then retry."
                : "Try again where your device can get a clear signal. ShoreDex, scanning and battles are still available."}
          </p>
          <button
            className="button primary"
            onClick={() => {
              setRequested(true);
              gps.retry();
            }}
          >
            {requested ? "Retry location" : "Enable location"}
          </button>
        </section>
      ) : null}
      <header className="game-hud">
        <Link
          to="/profile"
          className="player-hud"
          aria-label="Open explorer profile"
        >
          <div className="portrait">
            <PlayerAvatar profile={profile} />
            <span>{level.level}</span>
          </div>
          <div className="hud-info">
            <strong>{profile.nickname}</strong>
            <span>
              LEVEL {level.level} <i>·</i> SHORE EXPLORER
            </span>
            <div
              className="xp-track"
              role="progressbar"
              aria-label="Cleanup XP toward next level"
              aria-valuenow={level.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${level.progress}%` }} />
            </div>
            <small>
              {xp} cleanup XP <span>{level.progress}/100</span>
            </small>
          </div>
        </Link>
        <Link
          to="/collection"
          className="discovery-counter"
          aria-label={`${items.length} ShoreDex discoveries`}
        >
          <PixelIcon kind="dex" />
          <b>{items.length}</b>
        </Link>
      </header>
      <div className="location-tag">
        <span />
        <strong>YOUR SURROUNDINGS</strong>
        <small>
          {gps.accuracy === null ? "GPS" : `±${Math.round(gps.accuracy)} m`}
        </small>
      </div>
      {!covered && !menu && (
        <>
          <div id="world-controls" className="world-controls">
            <div aria-hidden="true" />
            <div className="crab-menu-wrap">
              <button
                ref={menuButton}
                className="crab-menu-button"
                aria-label="Open crab menu"
                aria-haspopup="dialog"
                onClick={() => setMenu(true)}
              >
                <span className="menu-orbit" />
                <Crab label="Crab menu" />
                <span className="menu-dot">•••</span>
              </button>
              <span className="control-caption">EXPLORE</span>
            </div>
            <div className="right-controls">
              <Link
                to="/scan"
                className="world-round camera-shortcut"
                aria-label="Scan a discovery"
              >
                <PixelIcon kind="scan" />
              </Link>
              <button
                className={`world-round recenter ${detached ? "detached" : ""}`}
                aria-label="Recenter map"
                onClick={() => {
                  setDetached(false);
                  setRecenter((n) => n + 1);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2v4m0 12v4M2 12h4m12 0h4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </button>
              <span className="control-caption">RECENTER</span>
            </div>
          </div>
          <div className="world-hint">
            Stay aware of your surroundings. Movement earns no XP.
          </div>
        </>
      )}
      {menu && <GameMenu onClose={closeMenu} />}
    </section>
  );
}
