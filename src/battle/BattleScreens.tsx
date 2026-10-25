import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import type { Profile } from "../world/profile";
import { type Stats } from "../lib/gear";
import { catalog } from "../lib/gear";
import type { BattleAction, BattleState, FighterState } from "../lib/battle";
import { moves, moveValues, type MoveLoadout } from "../lib/moves";
import { useCombatPresentation } from "./useCombatPresentation";
import type { CombatPhase } from "./presentation";
import { cpuSetup } from "../lib/battle";
export function BattleIntroScreen({
  stats,
  gear,
  level,
  selectedMoves,
  offline = false,
  start,
}: {
  stats: Stats;
  gear: string[];
  level: number;
  selectedMoves: MoveLoadout;
  offline?: boolean;
  start: () => void;
}) {
  const cpu = cpuSetup(level);
  return (
    <div className="battle-intro prep-screen">
      <header className="prep-title">
        <span className="eyebrow">TIDAL TRAINING GROUNDS</span>
        <h1>Practice vs CPU.</h1>
      </header>
      <section className="prep-matchup" aria-label="Crab matchup">
        <BattleBackground />
        <span className="prep-versus" aria-hidden="true">
          VS
        </span>
        {[
          { name: "Your crab", stats, gear, level },
          {
            name: "Pebble · CPU",
            stats: cpu.stats,
            gear: ["can_shield"],
            level: cpu.level,
          },
        ].map((fighter, i) => (
          <div
            className={`prep-fighter ${i ? "rival" : "ally"}`}
            key={fighter.name}
          >
            <div className="prep-name">
              <strong>{fighter.name}</strong>
              <span>
                Crab Lv. {fighter.level} · {fighter.stats.hp} HP
              </span>
            </div>
            <div className="prep-sprite" data-gear={fighter.gear.join(",")}>
              <Crab gear={fighter.gear} label={fighter.name} />
            </div>
            <small>
              ATK {fighter.stats.atk} · DEF {fighter.stats.def} · SPD{" "}
              {fighter.stats.spd}
            </small>
          </div>
        ))}
      </section>
      <section className="prep-moves" aria-label="Equipped attacks">
        {selectedMoves.map((id, i) => (
          <article className={`prep-move slot-${i}`} key={id} data-move={id}>
            <span className="prep-move-icon" aria-hidden="true">
              {["✦", "◇", "≈"][i]}
            </span>
            <small>{["MAIN ATTACK", "PERMANENT", "GEAR SPECIAL"][i]}</small>
            <strong>{moves[id].name}</strong>
            <span>
              {id === "guard"
                ? "Halves next hit"
                : moves[id].effect === "counter"
                  ? `Block + ${moves[id].effectValue} counter`
                  : `Power ${moves[id].power}${moves[id].hits > 1 ? ` × ${moves[id].hits}` : ""}`}
            </span>
            <small>
              {moves[id].cooldown
                ? `${moves[id].cooldown}-turn cooldown`
                : "Always ready"}
            </small>
          </article>
        ))}
      </section>
      {offline ? (
        <div className="prep-rewards">Offline practice · No battle XP</div>
      ) : (
        <div className="prep-rewards" aria-label="Battle rewards">
          <span>
            ✦ <strong>Victory +40</strong> Battle XP
          </span>
          <span>
            ◇ <strong>Defeat +15</strong> Battle XP
          </span>
        </div>
      )}
      <details className="prep-help">
        <summary>Battle tips & equipped gear</summary>
        <p>
          Faster crab goes first; ties go to you. Pebble trains stronger main
          attacks as you level up. Exiting grants 0 XP. Battle rewards never
          grant cleanup XP.
        </p>
        <p className="preview-loadout">
          Your loadout:{" "}
          {gear.length
            ? gear.map((id) => catalog[id]?.label ?? id).join(" · ")
            : "Red crab · no equipped gear"}
        </p>
      </details>
      <nav className="prep-actions" aria-label="Prepare for battle">
        <button className="button primary" onClick={start}>
          Start Battle
        </button>
        <Link
          className="button secondary"
          to="/workshop?section=moves&from=battle"
        >
          Change Attacks
        </Link>
        <Link
          className="button secondary"
          to="/workshop?section=gear&from=battle"
        >
          Change Gear
        </Link>
      </nav>
    </div>
  );
}
export function BattleBackground() {
  return (
    <svg
      className="beach-backdrop"
      viewBox="0 0 240 240"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="#bfeee0" d="M0 0h240v240H0z" />
      <path
        fill="#fff8df"
        d="M180 18h24v24h-24zM12 35h35v6H12zM20 29h18v6H20zM110 52h40v6h-40z"
      />
      <path fill="#25c6b2" d="M0 78h240v162H0z" />
      <path
        fill="#176c79"
        opacity=".25"
        d="M0 88h50v3H0zm90 9h60v3H90zm90-14h60v3h-60z"
      />
      <path fill="#a9ddab" d="M0 115h38v7h40v7h55v-6h55v-8h52v125H0z" />
      <path fill="#fff8df" d="M0 122h38v7h40v7h55v-6h55v-8h52v118H0z" />
      <path fill="#f5cc83" d="M0 135h38v7h40v7h55v-6h55v-8h52v105H0z" />
      <path
        fill="#f58a08"
        opacity=".3"
        d="M14 174h8v3h-8zm171-17h6v3h-6zm-50 51h10v3h-10zm76 18h10v3h-10zM35 228h8v3h-8z"
      />
      <path
        fill="#fff8df"
        d="M12 98h18v2H12zm56-12h12v2H68zm94 20h24v2h-24zm40-12h19v2h-19z"
      />
    </svg>
  );
}
function HealthBar({ fighter }: { fighter: FighterState }) {
  return (
    <div className="battle-health">
      <strong>{fighter.nickname}</strong>
      <small>Crab Lv. {fighter.level}</small>
      <div
        className="hp-track"
        role="meter"
        aria-label={`${fighter.nickname} health`}
        aria-valuemin={0}
        aria-valuemax={fighter.startingStats.hp}
        aria-valuenow={fighter.currentHp}
      >
        <span
          style={{
            width: `${(100 * fighter.currentHp) / fighter.startingStats.hp}%`,
          }}
        />
      </div>
      <span>
        {fighter.currentHp} / {fighter.startingStats.hp} HP
      </span>
      {fighter.guarding && (
        <small>
          Defend · next hit halved
          {fighter.counterDamage ? " · counter ready" : ""}
        </small>
      )}
      {fighter.weakenedTurns > 0 && (
        <small>
          ATK −{fighter.attackReduction} · {fighter.weakenedTurns} turns
        </small>
      )}
    </div>
  );
}
function BattleMessageBox({
  battle,
  phase,
  action,
}: {
  battle: BattleState;
  phase: CombatPhase;
  action?: BattleState["log"][number];
}) {
  const latest = battle.log.at(-1);
  return (
    <div className="battle-message">
      <div role="status">
        <p>
          {phase === "windup" && action
            ? `${moves[action.action].name}!`
            : latest
              ? `${latest.damage ? `${latest.damage} Damage!` : "Defend ready!"}${latest.counterDamage ? ` Counter ${latest.counterDamage}!` : ""}`
              : "Ready!"}
        </p>
        <strong className="turn-banner">
          {phase === "windup" && action
            ? action.actorId === "cpu"
              ? `${battle.fighters[1].nickname.replace(" · CPU", "")}’s Turn!`
              : "Your move!"
            : battle.status !== "active"
              ? battle.status === "forfeited"
                ? battle.mode === "story"
                  ? "Stage abandoned"
                  : "Practice abandoned"
                : battle.winnerId === "player"
                  ? "Victory!"
                  : `${battle.fighters[1].nickname} wins!`
              : battle.currentActorId === "player"
                ? "Your Turn!"
                : `${battle.fighters[1].nickname.replace(" · CPU", "")}’s Turn!`}
        </strong>
      </div>
      <details className="battle-history">
        <summary>Battle log · {battle.version} moves</summary>
        <div className="combat-log">
          {battle.log.length ? (
            battle.log.map((entry) => (
              <p key={entry.turn}>
                {entry.turn}. {describe(entry, battle.fighters[1].nickname)}
              </p>
            ))
          ) : (
            <p>The faster crab goes first; ties go to you.</p>
          )}
        </div>
      </details>
    </div>
  );
}
function describe(entry: BattleState["log"][number], enemy: string) {
  return `${entry.actorId === "player" ? "You" : enemy} used ${moves[entry.action].name}${entry.damage ? ` · ${entry.damage} damage${entry.hits > 1 ? ` (${entry.hits} hits)` : ""}` : ""}${entry.effect ? ` · ${entry.effect}` : ""}${entry.counterDamage ? ` · counter dealt ${entry.counterDamage} damage` : ""}.`;
}
function BattleActionMenu({
  battle,
  act,
  quit,
  disabled,
}: {
  disabled: boolean;
  battle: BattleState;
  act: (action: BattleAction) => void;
  quit: () => void;
}) {
  return (
    <div className="arena-actions">
      <div className="arena-moves">
        {battle.fighters[0].moves.map((action, index) => (
          <button
            key={action}
            className={`arena-move ${index === 1 ? "guard" : index === 2 ? "tidal_slam" : "pinch"}`}
            onClick={() => act(action)}
            disabled={
              disabled ||
              battle.currentActorId !== "player" ||
              (battle.fighters[0].cooldowns[action] ?? 0) > 0
            }
          >
            <strong>{moves[action].name}</strong>
            <small>
              {(battle.fighters[0].cooldowns[action] ?? 0) > 0
                ? `${battle.fighters[0].cooldowns[action]} own turns remaining`
                : moveValues(moves[action])}
            </small>
          </button>
        ))}
      </div>
      <button className="arena-exit" onClick={quit}>
        {battle.mode === "story" ? "Exit Stage" : "Exit Practice"}
      </button>
    </div>
  );
}
export function BattleArenaScreen({
  battle: authoritative,
  gear,
  trainer,
  visible = true,
  requestPending = false,
  act,
  quit,
  replay,
  intro,
  rewardText,
  rewardReady,
  rewardFailed,
  retryReward,
  currentLevel,
  opponent,
  storyTitle,
  scenery,
  opponentRole,
}: {
  battle: BattleState;
  visible?: boolean;
  requestPending?: boolean;
  gear: string[];
  trainer: Profile;
  act: (action: BattleAction) => void;
  quit: () => void;
  replay: () => void;
  intro: () => void;
  rewardText: string;
  rewardReady: boolean;
  rewardFailed: boolean;
  retryReward: () => void;
  currentLevel: number;
  opponent?: Profile;
  storyTitle?: string;
  scenery?: ReactNode;
  opponentRole?: string;
}) {
  const { battle, phase, action, resolving } = useCombatPresentation(
    authoritative,
    visible,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const ended = battle.status !== "active" && !resolving;
  useEffect(() => {
    heading.current?.focus();
  }, [battle.id, ended]);
  return (
    <div
      data-phase={phase}
      className="battle-scene"
      data-battle-id={battle.id}
      data-version={battle.version}
    >
      <h1 className="battle-scene-title" ref={heading} tabIndex={-1}>
        {ended
          ? battle.status === "forfeited"
            ? storyTitle
              ? "Stage ended."
              : "Practice ended."
            : storyTitle
              ? "Stage complete."
              : "Practice complete."
          : (storyTitle ?? "Beach battle")}
      </h1>
      <div className="battle-stage">
        {scenery ?? <BattleBackground />}
        <div className="battle-hud">
          {battle.fighters.map((f) => (
            <HealthBar key={f.userId} fighter={f} />
          ))}
        </div>
        <div
          className={`battle-trainer ${ended ? (battle.winnerId === "player" ? "trainer-victory" : "trainer-defeat") : phase === "windup" && action?.actorId === "player" ? "trainer-cheer" : ""}`}
        >
          <PlayerAvatar profile={trainer} facing="right" />
        </div>
        <div
          className={`battle-trainer cpu-trainer ${ended ? (battle.winnerId === "cpu" ? "trainer-victory" : "trainer-defeat") : phase === "windup" && action?.actorId === "cpu" ? "trainer-cheer" : ""}`}
          aria-label={
            opponent
              ? `${opponent.nickname}, CPU trainer`
              : "Coral, Pebble’s CPU trainer"
          }
        >
          <PlayerAvatar
            profile={
              opponent ?? {
                nickname: "Coral",
                skin: 2,
                hair: 2,
                hairStyle: "long",
                clothing: 1,
                hat: "cap",
                motion: trainer.motion,
              }
            }
            facing="left"
          />
          <span title={opponentRole}>{opponentRole ? "B · CPU" : "CPU"}</span>
        </div>
        {battle.fighters.map((f, i) => (
          <div
            key={f.userId}
            className={`arena-crab ${i === 0 ? "ally" : "enemy"} ${f.currentHp === 0 ? "knocked-out" : ""}`}
            data-gear={
              i === 0 ? gear.join(",") : f.snapshotBlueprints.join(",")
            }
          >
            <div
              key={`${battle.id}-${action?.turn}-${phase}`}
              data-action={
                action?.actorId === f.userId ? action.action : undefined
              }
              className={
                phase === "windup" && action?.actorId === f.userId
                  ? `combat-windup ${moves[action.action].animation}`
                  : phase === "impact" &&
                      action &&
                      ((action.actorId !== f.userId && action.damage) ||
                        (action.actorId === f.userId && action.counterDamage))
                    ? "hit-reaction"
                    : ""
              }
            >
              {phase === "windup" && action?.actorId === f.userId && (
                <span
                  aria-hidden="true"
                  className={`move-fx fx-${action.action}`}
                >
                  {moves[action.action].effect === "guard" ||
                  moves[action.action].effect === "counter"
                    ? "◇"
                    : action.action === "tidal_slam"
                      ? "▪ ▪ ▪"
                      : action.action === "bag_snare"
                        ? "▦"
                        : action.action === "paper_barrage"
                          ? "▱ ▱"
                          : action.action === "cap_dash"
                            ? "≋"
                            : "✦"}
                </span>
              )}
              {phase === "impact" &&
                action &&
                action.actorId !== f.userId &&
                action.damage > 0 && (
                  <span className="landed-impact" aria-hidden="true">
                    ✦
                  </span>
                )}
              <Crab
                gear={i === 0 ? gear : f.snapshotBlueprints}
                label={f.nickname}
              />
            </div>
          </div>
        ))}
      </div>
      <BattleMessageBox battle={battle} phase={phase} action={action} />
      {ended ? (
        <div className="arena-results">
          <p role="status">
            {rewardText} Crab level {currentLevel}. No cleanup XP awarded.
          </p>
          {currentLevel > battle.fighters[0].level && (
            <p>
              Level up! Visit Workshop → Moves to choose newly unlocked attacks.
            </p>
          )}
          {rewardFailed && (
            <button className="button secondary" onClick={retryReward}>
              Retry XP save
            </button>
          )}
          <div className="button-row">
            <button
              className="button primary"
              disabled={!rewardReady}
              onClick={replay}
            >
              Play again
            </button>
            <button className="button secondary" onClick={intro}>
              {storyTitle ? "Continue story" : "Return to Matchup"}
            </button>
            <Link className="button secondary" to="/workshop">
              Change Gear
            </Link>
          </div>
        </div>
      ) : (
        <BattleActionMenu
          battle={battle}
          act={(move) => {
            if (
              !resolving &&
              !requestPending &&
              visible &&
              battle.status === "active"
            )
              act(move);
          }}
          quit={quit}
          disabled={
            resolving ||
            requestPending ||
            !visible ||
            battle.status !== "active"
          }
        />
      )}
    </div>
  );
}
