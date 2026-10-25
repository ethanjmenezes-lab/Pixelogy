import { useState } from "react";
import { useGame } from "../components/GameContext";
import {
  moves,
  mainMoves,
  crabLevel,
  specialMoves,
  ownedBlueprints,
  moveValues,
  moveRequirement,
  type MoveId,
} from "../lib/moves";
import { saveMoveSelection } from "../lib/storage";
export function WorkshopMoves() {
  const { progression, items, loadout, refresh } = useGame();
  const level = crabLevel(progression.xp);
  const specials = specialMoves(ownedBlueprints(loadout, items));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function select(slot: "main" | "special", id: MoveId) {
    setBusy(true);
    setNotice("");
    try {
      await saveMoveSelection(slot, id);
      await refresh();
      setNotice(`${moves[id].name} equipped.`);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel workshop-moves" aria-label="Crab moves">
      <h2>Moves</h2>
      <p>
        <strong>Crab level {level}</strong> · {progression.xp} battle XP ·{" "}
        {100 - (progression.xp % 100)} XP to next level
      </p>
      <progress
        aria-label="Crab battle XP to next level"
        max={100}
        value={progression.xp % 100}
      />
      <details>
        <summary>Battle XP & move rules</summary>
        <p>
          Win +40 battle XP · loss +15 · exit +0. Battle XP is separate from
          cleanup XP and your explorer level. Specials require their equipped
          gear.
        </p>
      </details>
      <p role="status">{notice}</p>
      {(
        [
          {
            slot: "main",
            title: "Main Attack",
            ids: mainMoves.map((m) => m.id),
          },
          {
            slot: "defend",
            title: "Defend",
            ids: ["guard"] as MoveId[],
          },
          {
            slot: "special",
            title: "Equipment Special",
            ids: specials,
          },
        ] as const
      ).map((group) => (
        <div className="move-library" key={group.slot}>
          <h3>{group.title}</h3>
          {group.ids.map((id) => {
            const m = moves[id];
            const locked = m.level !== undefined && m.level > level;
            const selected =
              group.slot === "defend" || progression[group.slot] === id;
            return (
              <article
                className={`move-card ${selected ? "selected" : ""}`}
                key={id}
              >
                <div>
                  <h4>
                    {m.name}
                    {selected ? " · Equipped" : locked ? " · Locked" : ""}
                  </h4>
                  <details>
                    <summary>Move info</summary>
                    <p>{m.description}</p>
                  </details>
                  <p>
                    {moveValues(m)} · Cooldown:{" "}
                    {m.cooldown ? `${m.cooldown} own turns` : "none"}
                  </p>
                  <small>{moveRequirement(m)}</small>
                </div>
                {group.slot !== "defend" && (
                  <button
                    className="button secondary"
                    disabled={locked || selected || busy}
                    aria-pressed={selected}
                    onClick={() => void select(group.slot, id)}
                  >
                    {selected
                      ? `${m.name} equipped`
                      : locked
                        ? `Unlock at level ${m.level}`
                        : `Equip ${m.name}`}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}
