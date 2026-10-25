import { useEffect, useRef, useState } from "react";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import type { Profile } from "../world/profile";
import { STORY_TITLE, regionDefinitions, regionStages } from "./campaign";
import { CorporateTrainer, RegionScenery, IslandArt } from "./StoryArt";
export const OPENING = "conspiracy-opening";
export type Cinematic = string;
export const cinematicIds = [
  OPENING,
  "conspiracy-ending",
  ...regionDefinitions.flatMap((r) => [
    `${r.id}-briefing`,
    `${r.id}-boss`,
    `${r.id}-restored`,
  ]),
];
const openingLines = [
  "Blacktide Industries: ‘Clean coasts. Brighter futures.’ CEO Caspian Vale smiles from every billboard.",
  "After midnight, the company’s trucks deliver something very different. You watch waste tumble onto the beach.",
  "‘No filming. This is company business.’ A security trainer blocks your way.",
  "A little red crab climbs out of the discarded packaging. It stands between you and the guard.",
  "The things Blacktide throws away can become your crab’s strength. First, get past the night watch.",
];
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
  const opening = id === OPENING,
    ending = id === "conspiracy-ending";
  const r = Math.max(
      0,
      regionDefinitions.findIndex((r) => id.startsWith(r.id + "-")),
    ),
    region = regionDefinitions[r],
    boss = regionStages(r)[4];
  const restored = id.endsWith("-restored"),
    briefing = id.endsWith("-briefing");
  const count = opening ? 5 : ending ? 3 : 2;
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
  const caption = opening
    ? openingLines[frame]
    : ending
      ? [
          "The Tideledger is on every screen: Vale ordered the dumping, then billed communities for the cleanup.",
          "The evidence reaches the public and investigators. Blacktide’s dumping network is shut down.",
          "Workers, scientists and neighbors restore the coastline together. Your little crab has one request: a quieter beach.",
        ][frame]
      : briefing
        ? [
            region.briefing,
            r === 3
              ? "Dr. Mira: ‘I kept the samples and the original data. Help me get them out.’"
              : "Collect evidence, challenge the four trainers, then confront their boss. Your real equipment and moves come with you.",
          ][frame]
        : restored
          ? [
              `${boss.defeat} Evidence secured: ${region.evidence}.`,
              region.restored,
            ][frame]
          : [
              boss.intro,
              `${boss.crab} takes its position. Your crab raises its claws.`,
            ][frame];
  const title = opening
    ? STORY_TITLE
    : ending
      ? "The coast belongs to everyone"
      : restored
        ? `${region.name} restored`
        : briefing
          ? region.name
          : region.boss;
  return (
    <section
      className={`story-cinema conspiracy-cinema ${opening ? `opening-${frame}` : ""}`}
      aria-label="Story cinematic"
      data-cinematic={id}
    >
      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>
      <div className="cinema-frame" key={`${id}-${frame}`}>
        {opening ? (
          <>
            <svg
              className="cinema-land"
              viewBox="0 0 240 250"
              preserveAspectRatio="xMidYMid slice"
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <rect
                width="240"
                height="250"
                fill={frame === 0 ? "#bfeee0" : "#282044"}
              />
              <rect x="185" y="18" width="20" height="20" fill="#fff8df" />
              <path
                fill={frame === 0 ? "#25c6b2" : "#286a83"}
                d="M0 95h240v155H0z"
              />
              <path fill="#fff8df" d="M0 155h60v-8h60v8h120v95H0z" />
              <path fill="#f5cc83" d="M0 166h90v-8h55v8h95v84H0z" />
              <path
                className="story-ripples"
                d="M10 120h35m60-15h30m40 25h50"
                stroke="#a9ddab"
                strokeWidth="3"
              />
              {frame === 0 ? (
                <g>
                  <path
                    d="M30 80v75m130-75v75"
                    stroke="#594793"
                    strokeWidth="5"
                  />
                  <rect
                    x="15"
                    y="35"
                    width="160"
                    height="65"
                    fill="#fff8df"
                    stroke="#594793"
                    strokeWidth="4"
                  />
                  <path d="M25 45h18v18H25z" fill="#25c6b2" />
                  <text x="50" y="58" fontSize="13" fill="#282044">
                    BLACKTIDE
                  </text>
                  <text x="25" y="82" fontSize="10" fill="#594793">
                    CLEAN COASTS. BRIGHTER FUTURES.
                  </text>
                </g>
              ) : (
                <>
                  <g className="dump-truck">
                    <path
                      d="M80 120h90v33H80zm90 11h30v22h-30z"
                      fill="#594793"
                    />
                    <path d="M82 120h85v-25H82z" fill="#9eabc0" />
                    <path d="M176 135h16v12h-16z" fill="#a9ddab" />
                    <path
                      d="M94 150h16v12H94zm80 0h16v12h-16z"
                      fill="#282044"
                    />
                    <text x="110" y="145" fill="#fff8df" fontSize="12">
                      B
                    </text>
                  </g>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <path
                      key={n}
                      className={frame === 1 ? "dumped-package" : ""}
                      d={`M${60 + n * 9} ${180 + (n % 2) * 8}h12v7h-12z`}
                      fill={n % 2 ? "#b1b9bf" : "#fff8df"}
                      style={{ animationDelay: `${n * 0.15}s` }}
                    />
                  ))}
                  <path
                    className="night-searchlight"
                    d="M200 140L235 190h-55z"
                    fill="#fff8df"
                    opacity=".25"
                  />
                </>
              )}
            </svg>
            {frame >= 2 && (
              <div className="cinema-human">
                <PlayerAvatar profile={profile} facing="right" />
              </div>
            )}
            {frame >= 3 && (
              <div className="cinema-crab">
                <Crab gear={[]} label="Your brave crab" />
              </div>
            )}
            {frame >= 2 && (
              <div className="cinema-rival">
                <CorporateTrainer profile={regionStages(0)[0].trainer} />
              </div>
            )}
          </>
        ) : ending && frame === 2 ? (
          <IslandArt clean={[true, true, true, true, true]} />
        ) : (
          <>
            <RegionScenery
              region={ending ? 4 : r}
              clean={(restored && frame === 1) || (ending && frame > 0)}
            />
            <div className="cinema-human">
              <PlayerAvatar
                profile={
                  r === 3 && briefing
                    ? {
                        ...profile,
                        nickname: "Dr. Mira",
                        clothing: 1,
                        hair: 3,
                        hat: "none",
                      }
                    : profile
                }
                facing="right"
              />
            </div>
            <div className="cinema-crab">
              <Crab gear={[]} label="Your crab" />
            </div>
            {!restored && !ending && (
              <div className="cinema-rival">
                <CorporateTrainer profile={boss.trainer} />
              </div>
            )}
            {(restored || ending) && (
              <div
                className="evidence-document"
                aria-label={
                  ending ? "Public evidence broadcast" : region.evidence
                }
              >
                <b>{ending ? "PUBLIC RECORD" : "EVIDENCE"}</b>
                <span>▤</span>
                <small>
                  {ending ? "Blacktide’s scheme exposed" : region.evidence}
                </small>
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
