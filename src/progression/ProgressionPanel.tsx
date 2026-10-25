import { Link } from "react-router-dom";
import { useGame } from "../components/GameContext";
import { crabLevel, mainAtLevel, moves } from "../lib/moves";
import { cosmetics } from "./cosmetics";
import { playerLevel, rules } from "./model";
export function ProgressionPanel() {
  const { player, progression, claims, userId } = useGame();
  const level = playerLevel(player.xp),
    crab = crabLevel(progression.xp);
  return (
    <section
      className="panel progression-details"
      aria-label="Progression details"
    >
      <h2>Player Lv. {level}</h2>
      <p>
        {player.xp} Player XP · {(player.distanceMm / 1000).toFixed(0)} m
        eligible walking
      </p>
      <progress
        aria-label="Player XP"
        value={player.xp % rules.xpPerLevel}
        max={rules.xpPerLevel}
      />
      <p>
        {player.xp % rules.xpPerLevel}/{rules.xpPerLevel} to next level
      </p>
      <p>
        {cosmetics.filter((c) => c.level <= level).length}/{cosmetics.length}{" "}
        catalog cosmetics unlocked
      </p>
      <a className="button secondary" href="#customization">
        Customize
      </a>
      <h2 id="crab-progression">Crab Lv. {crab}</h2>
      <p>{progression.xp} Crab XP</p>
      <progress aria-label="Crab XP" value={progression.xp % 100} max={100} />
      <p>
        Main attacks:{" "}
        {mainAtLevel(crab)
          .map((id) => moves[id].name)
          .join(" · ")}
      </p>
      <p>Selected: {moves[progression.main].name}</p>
      <Link className="button secondary" to="/workshop?section=moves">
        Change Attacks
      </Link>
      <p>
        {claims.reduce((n, c) => n + c.xpAwarded, 0)} cleanup XP · self-reported
      </p>
      <details>
        <summary>Walking rewards & privacy</summary>
        <p>
          Walk to earn Player and Crab XP. Every {rules.milestoneMm / 1000}{" "}
          eligible metres grants +{rules.playerXp} Player XP and +{rules.crabXp}{" "}
          Crab XP. {rules.dailyCapMm / 1000000} km daily cap resets at 00:00
          UTC. Partial distance carries forward.
        </p>
        <p>
          Only foreground GPS on the world screen counts. Poor signals, drift,
          fast travel and gaps are rejected. Location spoofing and every mode of
          travel cannot be reliably detected. Coordinates remain in memory; only
          distance, elapsed time and reward records sync.
        </p>
        <p>
          {userId
            ? "Pending distance stays on this device until sync. Keep the app open to finish syncing."
            : "Guest progress is saved on this device. Save Your Progress in Profile for cloud backup."}{" "}
          Put your safety first; you do not need to watch each reward.
        </p>
      </details>
    </section>
  );
}
