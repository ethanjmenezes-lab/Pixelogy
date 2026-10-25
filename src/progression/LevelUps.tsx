import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGame } from "../components/GameContext";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import { crabLevel, mainAtLevel, moves } from "../lib/moves";
import { playerLevel } from "./model";
import { cosmetics } from "./cosmetics";
type Celebration = {
  kind: "Player" | "Crab";
  level: number;
  unlocks: string[];
};
export function LevelUps() {
  const location = useLocation();
  const { userId, player, progression, loading, profile } = useGame();
  const previous = useRef<{ id: string | null; p: number; c: number } | null>(
    null,
  );
  const [queue, setQueue] = useState<Celebration[]>([]);
  useEffect(() => {
    setQueue([]);
  }, [location.pathname]);
  useEffect(() => {
    if (loading) return;
    const next = {
        id: userId,
        p: playerLevel(player.xp),
        c: crabLevel(progression.xp),
      },
      old = previous.current;
    previous.current = next;
    if (!old || old.id !== next.id) {
      setQueue([]);
      return;
    }
    const gained: Celebration[] = [];
    if (next.p > old.p)
      gained.push({
        kind: "Player",
        level: next.p,
        unlocks: cosmetics
          .filter((x) => x.level > old.p && x.level <= next.p)
          .map((x) => x.name),
      });
    if (next.c > old.c)
      gained.push({
        kind: "Crab",
        level: next.c,
        unlocks: mainAtLevel(next.c)
          .filter((x) => !mainAtLevel(old.c).includes(x))
          .map((x) => moves[x].name),
      });
    if (gained.length) setQueue((q) => [...q, ...gained]);
  }, [userId, player.xp, progression.xp, loading]);
  const current = queue[0];
  if (!current) return null;
  return (
    <aside
      className="level-celebration panel"
      aria-label="Level up"
      role="status"
    >
      <div className="level-sprite">
        {current.kind === "Player" ? (
          <PlayerAvatar profile={profile} />
        ) : (
          <Crab />
        )}
      </div>
      <strong>{current.kind.toUpperCase()} LEVEL UP!</strong>
      <p>
        {current.kind} Lv. {current.level}
      </p>
      {current.unlocks.length > 0 && (
        <p>
          {current.kind === "Player"
            ? "Cosmetic Unlocked!"
            : "New Attack Unlocked!"}{" "}
          {current.unlocks.join(" · ")}
        </p>
      )}
      <Link
        className="button secondary"
        to={
          current.kind === "Player"
            ? "/profile#customization"
            : "/workshop?section=moves"
        }
        onClick={() => setQueue((q) => q.slice(1))}
      >
        {current.kind === "Player" ? "Customize" : "Change Attacks"}
      </Link>
      <button
        className="button text"
        onClick={() => setQueue((q) => q.slice(1))}
      >
        {queue.length > 1 ? "Next level-up" : "Close level-up"}
      </button>
    </aside>
  );
}
