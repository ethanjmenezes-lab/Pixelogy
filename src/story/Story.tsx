import {
  readGuestStory,
  watchGuestStory,
  guestStoryRequest,
} from "../guest/story";
import { script } from "./script";
import {
  StoryStagePreview,
  StoryRegionMap,
  StoryProgress as StoryProgressView,
  ScriptDialogue,
} from "./StoryPresentation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGame } from "../components/GameContext";
import { cloud, authHeaders, rpc } from "../cloud/client";
import { analyzeUrl } from "../mobile/platform";
import { Crab } from "../components/Crab";
import { BattleArenaScreen } from "../battle/BattleScreens";
import type { BattleState, BattleAction } from "../lib/battle";
import type { Profile } from "../world/profile";
import { crabLevel, normalizeProgression, ownedBlueprints } from "../lib/moves";
import {
  stageById,
  regionDefinitions,
  regionUnlocked,
  restored,
  evidenceFound,
  STORY_TITLE,
  unlocked,
  type StoryProgress,
} from "./campaign";
import {
  Cutscene,
  OPENING,
  cinematicIds,
  sceneImplemented,
  type Cinematic,
} from "./Cutscene";
import { IslandArt, RegionScenery } from "./StoryArt";
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
  const startRequested = params.get("start") === "1";
  const landing = !params.get("stage") && !params.get("region");
  const launchAfterOpening = useRef(false);
  const autoStarted = useRef(false);
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
    startId = useRef(crypto.randomUUID());
  const load = useCallback(async () => {
    if (!userId) {
      const next = await readGuestStory();
      if (mounted.current) setSave(next);
      return next;
    }
    if (!cloud) throw new Error("Cloud unavailable");
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
          if (
            !landing &&
            !startRequested &&
            !autoStarted.current &&
            !s.watched.includes(OPENING)
          )
            setCinematic(OPENING);
          else if (
            requestedScene.current &&
            cinematicIds.includes(requestedScene.current) &&
            sceneImplemented(requestedScene.current) &&
            (script.regions.some(
              (r, i) =>
                r.outro_scene.id === requestedScene.current &&
                restored(i, s.progress),
            ) ||
              (requestedScene.current === script.ending.id &&
                restored(4, s.progress)))
          )
            setCinematic(requestedScene.current);
          else if (
            !landing &&
            !stage &&
            regionUnlocked(regionIndex, s.progress) &&
            !s.watched.includes(script.regions[regionIndex].intro_scene.id) &&
            sceneImplemented(script.regions[regionIndex].intro_scene.id)
          )
            setCinematic(script.regions[regionIndex].intro_scene.id);
        }
      })
      .catch((e) => {
        if (mounted.current) setError(e.message);
      });
    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [load, stage, regionIndex, landing, startRequested]);
  const finishCinema = useCallback(() => {
    if (!cinematic) return;
    const id = cinematic;
    setCinematic(null);
    if (id.endsWith(".outro"))
      setParams({ region: region.id }, { replace: true });
    if (id === OPENING && launchAfterOpening.current) {
      launchAfterOpening.current = false;
      setParams({ stage: "shellshore.01", start: "1" });
    }
    if (id === script.regions[4].outro_scene.id) setCinematic(script.ending.id);
    void (userId ? rpc("watch_story", { cinematic: id }) : watchGuestStory(id))
      .then(() => load())
      .catch(() => {
        if (mounted.current)
          setError(
            "Cinematic preference could not be saved. It may replay next visit.",
          );
      });
  }, [cinematic, load, userId, setParams, region.id, save?.watched]);

  async function request(body: Parameters<typeof guestStoryRequest>[0]) {
    if (!userId) return guestStoryRequest(body);
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
  useEffect(() => {
    if (
      params.get("start") === "1" &&
      stage &&
      save &&
      !cinematic &&
      !autoStarted.current
    ) {
      autoStarted.current = true;
      setParams({ stage: stage.contentId }, { replace: true });
      void start();
    }
  });
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
      win && current?.boss && sceneImplemented(script.regions[r].outro_scene.id)
        ? {
            region: region.id,
            scene: script.regions[r].outro_scene.id,
          }
        : { region: region.id },
    );
  }

  if (cinematic)
    return (
      <Cutscene
        id={cinematic}
        profile={profile}
        gear={gear}
        done={finishCinema}
      />
    );
  if (landing)
    return (
      <section className="story-screen story-landing">
        <h1>{STORY_TITLE}</h1>
        <p>Investigate Blacktide. Save the coast.</p>
        <div
          className="story-key-art"
          aria-label="A tiny red crab on the coast"
        >
          <IslandArt />
          <Crab gear={[]} label="Baby red crab" />
        </div>
        {
          <button
            className="button primary"
            disabled={!save}
            onClick={() => {
              if (save?.progress.length) setParams({ region: "shellshore" });
              else {
                launchAfterOpening.current = true;
                setCinematic(OPENING);
              }
            }}
          >
            Start Story
          </button>
        }
        <button
          className="button secondary"
          onClick={() => {
            launchAfterOpening.current = false;
            setCinematic(OPENING);
          }}
        >
          Watch Opening
        </button>
        {error && <p role="alert">{error}</p>}
      </section>
    );
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
          storyDialogue={<ScriptDialogue lines={s.defeatLines} />}
          rewardText={
            session.battle.winnerId === "player"
              ? `Victory saved. Best stars: ${save.progress.find((p) => p.stage_id === s.id)?.best_stars ?? "…"}/3. First-clear reward +${s.xp} Crab XP; repeats +0.`
              : "No story XP for defeat or exit. Try another approach."
          }
        />
      </>
    );
  }
  if (stage)
    return (
      <StoryStagePreview
        stage={stage}
        profile={profile}
        gear={gear}
        level={crabLevel(selected.xp)}
        selected={[selected.main, "guard", selected.special]}
        available={unlocked(stage, save.progress)}
        busy={busy}
        error={error}
        start={() => void start()}
        map={() => setParams({ region: regionDefinitions[stage.region].id })}
      />
    );
  const clean = restored(regionIndex, save.progress),
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
      <StoryProgressView progress={save.progress} region={regionIndex} />
      <p className="region-condition" role="status">
        {clean ? "Restoration underway" : "Investigation active"}
      </p>
      <StoryRegionMap
        region={regionIndex}
        progress={save.progress}
        select={(s) => {
          startId.current = crypto.randomUUID();
          setError("");
          setParams({ stage: s.contentId });
        }}
      />
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
            </article>
          ))
        ) : (
          <p>0/5 evidence files</p>
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
        {regionUnlocked(regionIndex, save.progress) &&
          sceneImplemented(script.regions[regionIndex].intro_scene.id) && (
            <button
              className="button secondary"
              onClick={() =>
                setCinematic(script.regions[regionIndex].intro_scene.id)
              }
            >
              Region briefing
            </button>
          )}
        {clean &&
          sceneImplemented(script.regions[regionIndex].outro_scene.id) && (
            <button
              className="button secondary"
              onClick={() =>
                setCinematic(script.regions[regionIndex].outro_scene.id)
              }
            >
              Replay restoration
            </button>
          )}
        {restored(4, save.progress) && (
          <button
            className="button secondary"
            onClick={() => setCinematic(script.ending.id)}
          >
            Replay ending
          </button>
        )}
      </details>
      {error && <p role="alert">{error}</p>}
      <small>
        Fictional island · saved adventure. Story restoration is fictional and
        awards no cleanup XP. Safe discoveries can equip your crab; no hazardous
        pickup is required.
      </small>
    </section>
  );
}
