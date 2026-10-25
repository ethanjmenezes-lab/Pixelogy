import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGame } from "../components/GameContext";
import { cloud, authHeaders, rpc } from "../cloud/client";
import { analyzeUrl } from "../mobile/platform";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import { BattleArenaScreen } from "../battle/BattleScreens";
import type { BattleState, BattleAction } from "../lib/battle";
import type { Profile } from "../world/profile";
import {
  crabLevel,
  normalizeProgression,
  ownedBlueprints,
  moves,
} from "../lib/moves";
import {
  stageById,
  regionDefinitions,
  regionStages,
  regionUnlocked,
  restored,
  evidenceFound,
  STORY_TITLE,
  unlocked,
  type StoryProgress,
} from "./campaign";
import { Cutscene, OPENING, cinematicIds, type Cinematic } from "./Cutscene";
import { IslandArt, RegionScenery, CorporateTrainer } from "./StoryArt";
import "./story.css";
type Save = { progress: StoryProgress[]; watched: string[] };
export function Story() {
  const { userId } = useGame();
  const [params] = useSearchParams();
  return (
    <StorySession
      key={`${userId ?? "guest"}:${params.get("stage") ?? params.get("region") ?? "map"}`}
    />
  );
}
function StorySession() {
  const { userId, profile, items, loadout, progression, refresh } = useGame();
  const [params, setParams] = useSearchParams();
  const stage = stageById(params.get("stage") ?? "");
  const requestedScene = useRef(params.get("scene"));
  const regionIndex = Math.max(
    0,
    regionDefinitions.findIndex((r) => r.id === params.get("region")),
  );
  const region = regionDefinitions[regionIndex];
  const [save, setSave] = useState<Save | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [cinematic, setCinematic] = useState<Cinematic | null>(null),
    [session, setSession] = useState<{
      battle: BattleState;
      trainer: Profile;
    } | null>(null);
  const [visible, setVisible] = useState(!document.hidden);
  const mounted = useRef(true),
    lock = useRef(false),
    startId = useRef(crypto.randomUUID()),
    afterCinema = useRef<(() => void) | null>(null);
  const load = useCallback(async () => {
    if (!cloud || !userId) return null;
    const [p, w] = await Promise.all([
      cloud
        .from("story_progress")
        .select("stage_id,best_stars")
        .eq("user_id", userId),
      cloud
        .from("story_cinematics")
        .select("cinematic_id")
        .eq("user_id", userId),
    ]);
    if (p.error || w.error)
      throw new Error(
        "Story saves are unavailable. Check your connection and retry.",
      );
    const next = {
      progress: p.data,
      watched: w.data.map((r) => r.cinematic_id as string),
    };
    if (mounted.current) setSave(next);
    return next;
  }, [userId]);
  useEffect(() => {
    mounted.current = true;
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    void load()
      .then((s) => {
        if (s && mounted.current) {
          if (!s.watched.includes(OPENING)) setCinematic(OPENING);
          else if (
            requestedScene.current &&
            cinematicIds.includes(requestedScene.current)
          ) {
            const scene = requestedScene.current;
            const r = regionDefinitions.findIndex((r) =>
              scene.startsWith(r.id + "-"),
            );
            if (
              (scene === "conspiracy-ending" && restored(4, s.progress)) ||
              (r >= 0 && scene.endsWith("-restored") && restored(r, s.progress))
            )
              setCinematic(scene);
          }
        }
      })
      .catch((e) => {
        if (mounted.current) setError(e.message);
      });
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [load]);
  const finishCinema = useCallback(() => {
    if (!cinematic) return;
    const id = cinematic;
    setCinematic(null);
    if (id.endsWith("-restored") || id === "conspiracy-ending")
      setParams({ region: region.id }, { replace: true });
    if (userId)
      void rpc("watch_story", { cinematic: id })
        .then(() => load())
        .catch(() => {
          if (mounted.current)
            setError(
              "Cinematic preference could not be saved. It may replay next visit.",
            );
        });
    const next = afterCinema.current;
    afterCinema.current = null;
    next?.();
  }, [cinematic, load, userId, setParams, region.id]);
  async function request(body: object) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(analyzeUrl().replace(/analyze$/, "story"), {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Story battle unavailable. Retry when connected.",
        );
      return data as BattleState;
    } finally {
      clearTimeout(timer);
    }
  }
  async function start() {
    if (lock.current || !stage || !save || !unlocked(stage, save.progress))
      return;
    lock.current = true;
    setBusy(true);
    try {
      const battle = await request({
        action: "start",
        requestId: startId.current,
        stageId: stage.id,
      });
      if (mounted.current) {
        setError("");
        setSession({ battle, trainer: { ...profile } });
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function action(action: "turn" | "quit", move?: BattleAction) {
    if (lock.current || !session || document.hidden) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const battle = await request({
        action,
        matchId: session.battle.id,
        version: session.battle.version,
        move,
      });
      if (!mounted.current) return;
      setSession((current) =>
        current?.battle.id === battle.id ? { ...current, battle } : current,
      );
      if (battle.status === "completed") await Promise.all([load(), refresh()]);
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const gear = ownedBlueprints(loadout, items),
    selected = normalizeProgression(progression, gear);
  function leaveBattle() {
    const win = session?.battle.winnerId === "player";
    const current = stageById(session?.battle.storyStageId ?? "");
    setSession(null);
    startId.current = crypto.randomUUID();
    const r = current?.region ?? 0,
      region = regionDefinitions[r];
    setParams(
      win && current?.boss
        ? {
            region: region.id,
            scene: r === 4 ? "conspiracy-ending" : `${region.id}-restored`,
          }
        : { region: region.id },
    );
  }

  if (!userId)
    return (
      <section className="story-screen">
        <h1>{STORY_TITLE}</h1>
        <div className="story-map-art">
          <IslandArt />
        </div>
        <p>
          A five-region adventure against Blacktide Industries. Sign in for
          permanent progress, stars and battle XP.
        </p>
        <Link className="button primary" to="/auth/login?next=%2Fstory">
          Sign in to begin
        </Link>
        <button
          className="button secondary"
          onClick={() => setCinematic(OPENING)}
        >
          Watch the opening
        </button>
        {cinematic && (
          <Cutscene id={cinematic} profile={profile} done={finishCinema} />
        )}
      </section>
    );
  if (cinematic)
    return <Cutscene id={cinematic} profile={profile} done={finishCinema} />;
  if (!save)
    return (
      <section className="story-screen">
        <h1>{STORY_TITLE}</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Opening your adventure…"}
        </p>
        {error && (
          <button
            className="button primary"
            onClick={() => {
              setError("");
              void load().catch((e) => setError(e.message));
            }}
          >
            Retry story saves
          </button>
        )}
      </section>
    );
  if (session) {
    const s = stageById(session.battle.storyStageId!)!;
    return (
      <>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <BattleArenaScreen
          key={session.battle.id}
          {...session}
          gear={session.battle.fighters[0].snapshotBlueprints}
          opponent={{ ...s.trainer, motion: profile.motion }}
          storyTitle={s.name}
          opponentRole={s.role}
          scenery={
            <RegionScenery
              region={s.region}
              clean={restored(s.region, save.progress)}
            />
          }
          visible={visible}
          requestPending={busy}
          act={(move) => void action("turn", move)}
          quit={() => void action("quit")}
          replay={() => {
            setSession(null);
            startId.current = crypto.randomUUID();
          }}
          intro={leaveBattle}
          rewardReady={!busy}
          rewardFailed={false}
          retryReward={() => {}}
          currentLevel={crabLevel(progression.xp)}
          rewardText={
            session.battle.winnerId === "player"
              ? `${s.defeat} Victory saved. Best stars: ${save.progress.find((p) => p.stage_id === s.id)?.best_stars ?? "…"}/3. First-clear reward +${s.xp} battle XP; repeats +0.`
              : "No story XP for defeat or exit. Try another approach."
          }
        />
      </>
    );
  }
  if (stage) {
    const available = unlocked(stage, save.progress);
    return (
      <section className="story-screen story-preview">
        <span className="eyebrow">
          {regionDefinitions[stage.region].name.toUpperCase()} · STAGE{" "}
          {regionStages(stage.region).indexOf(stage) + 1}
          {stage.boss ? " · BOSS" : ""}
        </span>
        <h1>{stage.name}</h1>
        <div className="story-matchup">
          {[
            {
              trainer: profile,
              gear,
              name: "Your crab",
              level: crabLevel(selected.xp),
            },
            {
              trainer: stage.trainer,
              gear: stage.gear,
              name: stage.crab,
              level: stage.level,
            },
          ].map((f, i) => (
            <div key={i}>
              {i ? (
                <CorporateTrainer profile={f.trainer} />
              ) : (
                <PlayerAvatar profile={f.trainer} facing="right" />
              )}
              <Crab gear={f.gear} label={f.name} />
              <strong>
                {f.trainer.nickname}
                {i ? " · CPU" : ""}
              </strong>
              <small>
                {f.name} · Lv. {f.level}
              </small>
            </div>
          ))}
        </div>
        <blockquote>{stage.intro}</blockquote>
        <div className="story-moves">
          {[selected.main, "guard", selected.special].map((id) => (
            <span key={id}>{moves[id as BattleAction].name}</span>
          ))}
        </div>
        <p>First clear +{stage.xp} battle XP · Replays +0</p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {available ? (
          <button
            className="button primary"
            disabled={busy}
            onClick={() => {
              if (
                stage.boss &&
                !save.watched.includes(
                  `${regionDefinitions[stage.region].id}-boss`,
                )
              ) {
                afterCinema.current = () => void start();
                setCinematic(`${regionDefinitions[stage.region].id}-boss`);
              } else void start();
            }}
          >
            {busy ? "Preparing…" : "Start Battle"}
          </button>
        ) : (
          <p role="status">
            {regionUnlocked(stage.region, save.progress)
              ? `Defeat all four trainers to unlock ${regionDefinitions[stage.region].boss}.`
              : "Clear the previous region to enter this stage."}
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
        <button
          className="button text"
          onClick={() =>
            setParams({ region: regionDefinitions[stage.region].id })
          }
        >
          Island map
        </button>
      </section>
    );
  }
  const currentStages = regionStages(regionIndex),
    cleared = currentStages.filter((s) =>
      save.progress.some((p) => p.stage_id === s.id),
    ).length,
    clean = restored(regionIndex, save.progress),
    evidence = evidenceFound(save.progress);
  return (
    <section className="story-screen">
      <span className="eyebrow">A PIXELOGY ADVENTURE</span>
      <h1>{STORY_TITLE}</h1>
      <div className="story-map-art">
        <IslandArt
          clean={regionDefinitions.map((_, i) => restored(i, save.progress))}
        />
        {regionDefinitions.map((r, i) => (
          <button
            type="button"
            key={r.id}
            className={`region-label region-${i}`}
            disabled={!regionUnlocked(i, save.progress)}
            aria-pressed={i === regionIndex}
            onClick={() => setParams({ region: r.id })}
          >
            <strong>
              {i + 1}. {r.name}
            </strong>
            <small>
              {restored(i, save.progress)
                ? "Restored · evidence secured"
                : regionUnlocked(i, save.progress)
                  ? "Open investigation"
                  : "Locked"}
            </small>
          </button>
        ))}
      </div>
      <h2>{region.name}</h2>
      <p className="story-progress">
        {cleared}/5 wins ·{" "}
        {save.progress
          .filter((p) => currentStages.some((s) => s.id === p.stage_id))
          .reduce((n, p) => n + p.best_stars, 0)}
        /15 stars · {evidence.length}/5 evidence files
      </p>
      <p className="region-condition" role="status">
        {clean
          ? "Restored: dumping stopped, wildlife returning."
          : "Investigation active: Blacktide operations continue."}
      </p>
      <div className="story-stage-path" aria-label={`${region.name} stages`}>
        <RegionScenery region={regionIndex} clean={clean} map />
        {currentStages.map((s, i) => {
          const canPlay = unlocked(s, save.progress),
            stars =
              save.progress.find((p) => p.stage_id === s.id)?.best_stars ?? 0;
          return (
            <button
              className={`story-node ${s.boss ? "boss" : ""}`}
              key={s.id}
              disabled={!canPlay}
              onClick={() => {
                startId.current = crypto.randomUUID();
                setError("");
                setParams({ stage: s.id });
              }}
              aria-label={`${i + 1}. ${s.name}${s.boss ? ", boss" : ""}, ${stars} stars${!canPlay ? ", locked" : ""}`}
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
      {restored(0, save.progress) && (
        <div className="story-reward">
          <Crab gear={gear} label="Your crab with the Shellshore sunburst" />
          <span aria-hidden="true">✺</span>
          <strong>Shellshore Sunburst unlocked</strong>
          <small>Story portrait cosmetic · no stats or equipment granted</small>
        </div>
      )}
      <section
        className="evidence-case"
        aria-label="Evidence against Blacktide"
      >
        <h2>Case file</h2>
        {evidence.length ? (
          evidence.map((r) => (
            <article key={r.id}>
              <strong>▤ {r.evidence}</strong>
              <p>{r.finding}</p>
            </article>
          ))
        ) : (
          <p>Defeat Foreman Sandy to recover the night-shift manifest.</p>
        )}
        {restored(4, save.progress) && (
          <strong>Case exposed · coastline restoration underway</strong>
        )}
      </section>
      <details>
        <summary>Cutscenes & star challenges</summary>
        <p>
          Win for one star; finish with 50% HP for two; 75% HP within six own
          turns (eight for bosses) for three. Stars never block progress.
        </p>
        <button
          className="button secondary"
          onClick={() => setCinematic(OPENING)}
        >
          Replay opening
        </button>
        {regionUnlocked(regionIndex, save.progress) && (
          <>
            <button
              className="button secondary"
              onClick={() => setCinematic(`${region.id}-briefing`)}
            >
              Region briefing
            </button>
            <button
              className="button secondary"
              onClick={() => setCinematic(`${region.id}-boss`)}
            >
              {region.boss} introduction
            </button>
          </>
        )}
        {clean && (
          <button
            className="button secondary"
            onClick={() => setCinematic(`${region.id}-restored`)}
          >
            Replay restoration
          </button>
        )}
        {restored(4, save.progress) && (
          <button
            className="button secondary"
            onClick={() => setCinematic("conspiracy-ending")}
          >
            Replay ending
          </button>
        )}
      </details>
      {error && <p role="alert">{error}</p>}
      <small>
        Fictional island · account progress · online battles. Story restoration
        is fictional and awards no cleanup XP. Safe discoveries can equip your
        crab; no hazardous pickup is required.
      </small>
    </section>
  );
}
