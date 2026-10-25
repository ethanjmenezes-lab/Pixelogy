import { useEffect, useRef, useState } from "react";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import type { Profile } from "../world/profile";
import { stages } from "./campaign";
export type Cinematic =
  "opening" | "shellshore-entry" | "sandy-intro" | "shellshore-clear";
const lines = [
  "Five Tide Shards. One bright island. A thousand tiny adventures.",
  "The Blacktide Crew stole the light to awaken their Tidebreaker.",
  "One explorer. One small crab. A spark that refuses to fade.",
  "‘Out of our way, little claw!’ Your crab has other plans.",
  "Every shore has a story. Every hero starts small.",
];
export function IslandArt() {
  return (
    <svg
      className="story-island-art"
      viewBox="0 0 240 300"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="240" height="300" fill="#25c6b2" />
      <path
        d="M15 45h34m110-20h28m-90 130h24m80 100h35M8 270h30"
        stroke="#fff8df"
        strokeWidth="3"
        className="story-ripples"
      />
      <path
        d="M45 230L85 180 155 150 100 95 172 50"
        stroke="#fff8df"
        strokeWidth="2"
        strokeDasharray="3 7"
        fill="none"
      />
      {[
        [15, 205, 70, 50, "#f5cc83"],
        [60, 155, 55, 42, "#b99279"],
        [130, 123, 80, 44, "#594793"],
        [55, 65, 70, 52, "#629f85"],
        [140, 20, 65, 45, "#443766"],
      ].map(([x, y, w, h, c], i) => (
        <g key={i}>
          <path
            d={`M${x} ${Number(y) + 8}h8v-8h${Number(w) - 16}v8h8v${Number(h) - 16}h-8v8h-${Number(w) - 16}v-8h-8z`}
            fill={String(c)}
            stroke="#fff8df"
            strokeWidth="3"
          />
          <path
            d={`M${Number(x) + 15} ${Number(y) + 15}h12v12h-12z`}
            fill="#a9ddab"
          />
        </g>
      ))}
      <path d="M165 20v-15h8v15m-12 0h16v5h-16z" fill="#fff8df" />
    </svg>
  );
}
export function Cutscene({
  id,
  profile,
  done,
}: {
  id: Cinematic;
  profile: Profile;
  done: () => void;
}) {
  const [frame, setFrame] = useState(0),
    heading = useRef<HTMLHeadingElement>(null);
  const count = id === "opening" ? 5 : 2;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest(".feature-content")?.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      clearTimeout(timer);
      if (!document.hidden)
        timer = setTimeout(
          () => (frame + 1 < count ? setFrame(frame + 1) : done()),
          6000,
        );
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", run);
    };
  }, [frame, count, done]);
  const scene =
    id === "opening"
      ? frame
      : id === "shellshore-clear"
        ? frame
          ? 4
          : 2
        : frame
          ? 3
          : 0;
  const caption =
    id === "opening"
      ? lines[frame]
      : id === "sandy-intro"
        ? [
            stages[4].intro,
            "Your crab clicks its claws. The Tide Shard glows inside Sandy’s lantern.",
          ][frame]
        : id === "shellshore-clear"
          ? [
              stages[4].defeat,
              "The first Tide Shard is home. Shellshore blooms again. Rustport waits beyond the horizon.",
            ][frame]
          : [
              "Shellshore Beach. The crew has commandeered every pier and sandcastle.",
              "Four rookies stand between you and Captain Sandy. Let’s bring back the color.",
            ][frame];
  return (
    <section
      className={`story-cinema scene-${scene}`}
      aria-label="Story cinematic"
    >
      <h1 ref={heading} tabIndex={-1}>
        {scene === 4
          ? "The Shattered Tide"
          : id === "shellshore-clear"
            ? "A light returns"
            : "The Shattered Tide"}
      </h1>
      <div className="cinema-frame" key={`${id}-${frame}`}>
        {scene === 4 ? (
          <IslandArt />
        ) : (
          <>
            <svg
              viewBox="0 0 240 250"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
              shapeRendering="crispEdges"
              className="cinema-land"
            >
              <rect
                width="240"
                height="250"
                fill={scene === 1 ? "#282044" : "#f6b677"}
              />
              <rect x="150" y="20" width="32" height="32" fill="#fff8df" />
              <path fill="#25c6b2" d="M0 95h240v155H0z" />
              <path fill="#fff8df" d="M0 160h40v-8h55v8h70v-8h75v100H0z" />
              <path fill="#f5cc83" d="M0 173h80v-8h40v8h120v77H0z" />
              <g className="lighthouse">
                <path d="M175 135V57h16v78z" fill="#fff8df" />
                <path d="M175 77h16v12h-16zm0 30h16v12h-16z" fill="#e76948" />
                <path d="M171 55h24v8h-24zM175 43h16v12h-16z" fill="#594793" />
                <path d="M179 47h8v8h-8z" fill="#ffe889" />
              </g>
              <path
                className="lighthouse-glow"
                d="M183 51L100 25v55z"
                fill="#fff8df"
                opacity=".35"
              />
              <path fill="#a9ddab" d="M10 140h35v20H10zm45-8h30v28H55z" />
              <path fill="#594793" d="M6 132h43v8H6zm45-8h38v8H51z" />
              {scene === 1 && (
                <>
                  <g className="story-airship">
                    <path d="M10 25h65v8h10v18H10v-8H0V33h10z" fill="#594793" />
                    <path d="M25 51h35v12H25zM36 32h12v12H36z" fill="#f58a08" />
                  </g>
                  <path
                    className="story-lightning"
                    d="M120 0l-12 40h15l-20 35"
                    stroke="#fff8df"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    className="story-shockwave"
                    cx="183"
                    cy="60"
                    r="30"
                    fill="none"
                    stroke="#aaa3ba"
                    strokeWidth="15"
                  />
                  {[0, 1, 2, 3, 4].map((n) => (
                    <rect
                      className="stolen-shard"
                      key={n}
                      x={178 + n * 3}
                      y={55 + n * 4}
                      width="4"
                      height="7"
                      fill="#fff8df"
                      style={{ animationDelay: `${n * 0.16}s` }}
                    />
                  ))}
                </>
              )}
            </svg>
            {scene !== 1 && (
              <>
                <div className="cinema-human">
                  <PlayerAvatar profile={profile} facing="right" />
                </div>
                <div className="cinema-crab">
                  <Crab gear={[]} label="Your brave crab" />
                  {scene === 2 && (
                    <span
                      className="cinema-cap"
                      aria-label="Story-only bottle-cap helmet"
                    />
                  )}
                </div>
              </>
            )}
            {scene === 3 && (
              <div className="cinema-rival">
                <PlayerAvatar profile={stages[4].trainer} facing="left" />
              </div>
            )}
          </>
        )}
      </div>
      <p className="story-caption" aria-live="polite">
        {caption}
      </p>
      <div className="button-row">
        <button className="button secondary" onClick={done}>
          Skip cinematic
        </button>
        <button
          className="button primary"
          onClick={() => (frame + 1 < count ? setFrame(frame + 1) : done())}
        >
          {frame + 1 === count ? "Continue" : "Next scene"}
        </button>
      </div>
      <small>
        {frame + 1} / {count} · Fictional Story Mode
      </small>
    </section>
  );
}

export function ShellshoreArt() {
  return (
    <svg
      className="shellshore-art"
      viewBox="0 0 320 340"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="320" height="340" fill="#25c6b2" />
      <path
        d="M0 0h260v45h-15v55h20v50h-35v55h25v60h-25v75H0z"
        fill="#fff8df"
      />
      <path
        d="M0 0h248v45h-15v55h20v50h-35v55h25v60h-25v75H0z"
        fill="#f5cc83"
      />
      <path
        d="M65 42L205 85 65 155 205 220 120 300"
        fill="none"
        stroke="#594793"
        strokeWidth="3"
        strokeDasharray="3 7"
      />
      <path
        d="M240 220h70v15h-70zM252 210v40m20-40v40m20-40v40"
        fill="#9f725a"
        stroke="#594793"
        strokeWidth="3"
      />
      <path d="M15 235h30v22H15zM175 5h35v25h-35z" fill="#fff8df" />
      <path d="M10 230h40v8H10zm160-230h45v8h-45z" fill="#594793" />
      <path d="M280 65v35m5 54v35M18 95v35" stroke="#9f725a" strokeWidth="6" />
      <path
        d="M264 62h32v7h-32zm5-7h20v7h-20zm0 92h32v7h-32zM2 92h32v7H2zM8 85h20v7H8z"
        fill="#629f85"
      />
      <path
        d="M280 120h22m-28 155h30m-30-250h20"
        stroke="#fff8df"
        strokeWidth="3"
      />
    </svg>
  );
}
