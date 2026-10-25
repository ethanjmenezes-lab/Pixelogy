import { Link } from "react-router-dom";
import { PlayerAvatar } from "../world/PlayerAvatar";
import type { Profile } from "../world/profile";
import { Crab } from "../components/Crab";
import { type BattleAction } from "../lib/battle";
import { moves } from "../lib/moves";
import { RegionScenery, CorporateTrainer } from "./StoryArt";
import {
  regionStages,
  unlocked,
  type Stage,
  type StoryProgress as ProgressRecord,
} from "./campaign";
import { ui, type Dialogue } from "./script";
export function ScriptDialogue({ lines }: { lines: Dialogue[] }) {
  // Encounter scripts currently contain one line; keep each exact line intact.
  return (
    <div className="script-dialogue">
      {lines.map((line, i) => (
        <div key={i}>
          <b>{line.speaker}</b>
          <p>{line.text}</p>
        </div>
      ))}
    </div>
  );
}
export function StoryStagePreview({
  stage,
  profile,
  gear,
  level,
  selected,
  available,
  busy,
  error,
  start,
  map,
}: {
  stage: Stage;
  profile: Profile;
  gear: string[];
  level: number;
  selected: BattleAction[];
  available: boolean;
  busy: boolean;
  error: string;
  start: () => void;
  map: () => void;
}) {
  return (
    <section
      className="story-screen story-preview story-stage-preview"
      data-encounter={stage.contentId}
    >
      <span className="eyebrow">
        {stage.boss ? ui.boss : "STAGE " + stage.contentId.split(".")[1]}
      </span>
      <h1>{stage.name}</h1>
      <div className="story-matchup">
        <div>
          <PlayerAvatar profile={profile} facing="right" />
          <Crab gear={gear} label="Your crab" />
          <strong>{profile.nickname}</strong>
          <small>Lv. {level}</small>
        </div>
        <div>
          <CorporateTrainer profile={stage.trainer} />
          <Crab gear={stage.gear} label={stage.crab} />
          <strong>{stage.trainer.nickname} · CPU</strong>
          <small>{stage.role}</small>
        </div>
      </div>
      <ScriptDialogue lines={stage.introLines} />
      <div className="story-moves">
        {selected.map((id) => (
          <span key={id}>{moves[id].name}</span>
        ))}
      </div>
      <p>First clear +{stage.xp} Crab XP · Replays +0</p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {available ? (
        <button className="button primary" disabled={busy} onClick={start}>
          {busy ? "Preparing…" : ui.start}
        </button>
      ) : (
        <p role="status">
          {ui.locked} · Clear the previous region and four trainers.
        </p>
      )}
      <div className="button-row">
        <Link
          className="button secondary"
          to={`/workshop?section=moves&from=story&stage=${stage.id}`}
        >
          Change Attacks
        </Link>
        <Link
          className="button secondary"
          to={`/workshop?section=gear&from=story&stage=${stage.id}`}
        >
          Change Gear
        </Link>
      </div>
      <button className="button text" onClick={map}>
        Island map
      </button>
    </section>
  );
}
export function StoryRegionMap({
  region,
  progress,
  select,
}: {
  region: number;
  progress: ProgressRecord[];
  select: (stage: Stage) => void;
}) {
  const stages = regionStages(region),
    clean = progress.some((p) => p.stage_id === stages[4].id);
  return (
    <div className="story-stage-path" aria-label="Region stages">
      <RegionScenery region={region} clean={clean} map />
      {stages.map((s, i) => {
        const stars =
            progress.find((p) => p.stage_id === s.id)?.best_stars ?? 0,
          available = unlocked(s, progress);
        return (
          <button
            className={`story-node ${s.boss ? "boss" : ""}`}
            key={s.id}
            disabled={!available}
            onClick={() => select(s)}
            aria-label={`${i + 1}. ${s.name}${s.boss ? ", boss" : ""}, ${stars} stars${!available ? ", locked" : ""}`}
          >
            <b>{s.boss ? "♜" : i + 1}</b>
            <span>{s.trainer.nickname}</span>
            <small aria-hidden="true">
              {"★".repeat(stars)}
              {"☆".repeat(3 - stars)}
            </small>
          </button>
        );
      })}
    </div>
  );
}
export function StoryProgress({
  progress,
  region,
}: {
  progress: ProgressRecord[];
  region: number;
}) {
  const stages = regionStages(region),
    own = progress.filter((p) => stages.some((s) => s.id === p.stage_id));
  return (
    <p className="story-progress">
      {own.length}/5 wins · {own.reduce((n, p) => n + p.best_stars, 0)}/15 stars
      · {progress.filter((p) => p.stage_id.endsWith("-5")).length}/5 evidence
      files
    </p>
  );
}
