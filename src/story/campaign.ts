import { cpuAction, type BattleState } from "../lib/battle.js";
import type { Stats } from "../lib/gear.js";
import type { MoveLoadout } from "../lib/moves.js";
import { defaultProfile, type Profile } from "../world/profile.js";
export const STORY_TITLE = "The Blacktide Conspiracy";
export type Stage = {
  id: string;
  region: number;
  name: string;
  trainer: Profile;
  role: string;
  crab: string;
  level: number;
  stats: Stats;
  gear: string[];
  moves: MoveLoadout;
  intro: string;
  defeat: string;
  xp: number;
  boss: boolean;
  strategy: "bold" | "guard" | "counter" | "special";
  threeStarTurns: number;
};
export const regionDefinitions = [
  {
    id: "shellshore",
    name: "Shellshore Beach",
    boss: "Foreman Sandy",
    evidence: "Night-shift manifest",
    finding:
      "Blacktide trucks unload on the same beach the company is paid to clean.",
    briefing:
      "A cheerful billboard promises a cleaner coast. Behind it, the night shift is unloading waste.",
    restored:
      "Sandy’s dumping line is shut down. Local volunteers reclaim the beach, and the manifest points to Rustport.",
  },
  {
    id: "rustport",
    name: "Rustport Harbor",
    boss: "Wrench",
    evidence: "Falsified shipping contracts",
    finding:
      "Waste shipments are disguised as restoration supplies and routed to protected shores.",
    briefing:
      "Rustport’s cranes run after midnight. Find the dispatcher, follow the cargo and confront Wrench.",
    restored:
      "The waste convoy stops. Dockworkers open the harbor, and the contracts lead to the boardwalk’s media office.",
  },
  {
    id: "neon",
    name: "Neon Boardwalk",
    boss: "Vex",
    evidence: "Unedited internal recording",
    finding: "Vex rehearses a cover story before disasters have even happened.",
    briefing:
      "Blacktide sponsors the bright lights. Behind the cameras, Vex is editing the coastline’s story.",
    restored:
      "The unedited footage reaches the public. The boardwalk removes Blacktide’s ads and opens a community repair fair.",
  },
  {
    id: "mangroves",
    name: "Whispering Mangroves",
    boss: "Director Rook",
    evidence: "Dr. Mira’s research archive",
    finding:
      "The pollution matches Blacktide shipments. The reserve was deliberately targeted.",
    briefing:
      "Scientist Dr. Mira hid her research in the reserve. Help her get past the security patrols.",
    restored:
      "Mira’s archive is safe. The reserve is protected, the pumps are stopped, and wildlife begins to return.",
  },
  {
    id: "headquarters",
    name: "Blacktide Headquarters",
    boss: "CEO Caspian Vale",
    evidence: "Tideledger access codes",
    finding:
      "Vale’s ledger orders deliberate dumping to manufacture demand for profitable cleanup contracts.",
    briefing:
      "The offshore headquarters controls every operation. Reach the broadcast terminal before Vale deletes the ledger.",
    restored:
      "The evidence is public. Blacktide’s dumping network is stopped, and coastal communities begin the long work of restoration.",
  },
] as const;
export const regions = regionDefinitions.map((r) => r.name);
// Existing Shellshore IDs deliberately remain unchanged: no clear, star or XP reset.
const roster = [
  [
    [
      "Pip",
      "Gatehouse Watch",
      "Button",
      "Security trainee",
      "No visitors after sunset. Especially visitors with cameras.",
      "I thought these were recycling deliveries. Take the shift log.",
    ],
    [
      "Nori",
      "The Shell Toll",
      "Winkle",
      "Permit inspector",
      "Your beach permit is missing the executive seal.",
      "Those truck permits all have the same forged seal. Ask at the pier.",
    ],
    [
      "Skipper",
      "Pier Pressure",
      "Clatter",
      "Night dispatcher",
      "Nothing to see on this pier. That splash was definitely a fish.",
      "Fine. The unloading schedule is in Sandy’s office.",
    ],
    [
      "Tansy",
      "Behind the Billboard",
      "Dune",
      "Site supervisor",
      "Our advertisement says pristine. Please look at the advertisement.",
      "The beach looked better before our cleanup contract. Sandy signed it.",
    ],
    [
      "Foreman Sandy",
      "The Midnight Manifest",
      "Bulwark",
      "Dumping supervisor",
      "Four employees down? This is going to ruin my productivity report.",
      "Keep the manifest. The ships come from Rustport. I just followed the invoices.",
    ],
  ],
  [
    [
      "Jett",
      "Cargo After Curfew",
      "Rivet",
      "Forklift operator",
      "These crates are full of… premium shoreline enhancement.",
      "The labels are fake. Check the weigh station.",
    ],
    [
      "Bex",
      "The False Weigh-In",
      "Gauge",
      "Scale technician",
      "Our scale says zero waste. Management calibrated it personally.",
      "Here’s the real weight log. It doesn’t match a single invoice.",
    ],
    [
      "Olin",
      "Container Shuffle",
      "Bolt",
      "Cargo auditor",
      "I move the red crates behind the blue ones. No questions.",
      "The red crates all go to protected coves. That can’t be right.",
    ],
    [
      "Cora",
      "Crane Control",
      "Gantry",
      "Crane captain",
      "Wrench said keep the convoy moving, whatever it takes.",
      "The convoy’s stopped. Wrench has the original contracts.",
    ],
    [
      "Wrench",
      "The Iron Invoice",
      "Ballast",
      "Head engineer",
      "My machines follow orders. My crab follows mine.",
      "I built transport rigs, not a disaster factory. Take the contracts.",
    ],
  ],
  [
    [
      "Fenn",
      "Sponsored Smiles",
      "Flash",
      "Brand ambassador",
      "Say ‘clean coast’ for the camera. No, not that part of the coast.",
      "The approved backdrop hides the runoff. Follow the cable.",
    ],
    [
      "Lumi",
      "The Edited Reel",
      "Flicker",
      "Video editor",
      "We remove the bad parts. From the footage, obviously.",
      "There’s an unedited copy backstage. I couldn’t bring myself to erase it.",
    ],
    [
      "Dax",
      "Prize Booth Pressure",
      "Token",
      "Event security",
      "The prize for asking questions is a battle with me.",
      "You win. The media office is behind the prize booth.",
    ],
    [
      "Suri",
      "Dead Air",
      "Echo",
      "Broadcast producer",
      "This channel only carries positive Blacktide stories.",
      "Vex recorded tomorrow’s apology yesterday. Listen for yourself.",
    ],
    [
      "Vex",
      "Smile for the Scandal",
      "Glitter",
      "Corporate spokesperson",
      "A crisis is just a branding opportunity with dramatic lighting.",
      "That recording was never meant to air. The reserve research is even worse.",
    ],
  ],
  [
    [
      "Reed",
      "Closed for Research",
      "Moss",
      "Reserve patrol",
      "The reserve is closed. Corporate science is very private.",
      "Dr. Mira never approved the closure. Find her field station.",
    ],
    [
      "Ivo",
      "Sample Lockup",
      "Silt",
      "Lab guard",
      "These water samples are classified as inconvenient.",
      "Mira hid duplicates near the roots. Don’t let them disappear.",
    ],
    [
      "Nell",
      "The Silent Pumps",
      "Root",
      "Pump operator",
      "Those pumps improve circulation. That’s what the manual says.",
      "The pipes lead out of Blacktide’s depot. Mira was right.",
    ],
    [
      "Tobin",
      "Archive Escort",
      "Bramble",
      "Records officer",
      "No documents leave this reserve without Rook’s permission.",
      "Mira’s archive is intact. Rook is blocking the last bridge.",
    ],
    [
      "Director Rook",
      "The Protected Secret",
      "Bastion",
      "Security director",
      "You have fragments. I control the exits.",
      "Mira has the proof. Vale keeps the authorization codes offshore.",
    ],
  ],
  [
    [
      "Aster",
      "Offshore Checkpoint",
      "Latch",
      "Platform guard",
      "Welcome to headquarters. Unscheduled witnesses are not welcome.",
      "The service lift leads straight to the finance floor.",
    ],
    [
      "Quinn",
      "The Profit Forecast",
      "Ledger",
      "Finance enforcer",
      "More pollution, more contracts. I mean… more opportunities to help.",
      "The forecast predates the dumping. The numbers tell the whole story.",
    ],
    [
      "Mace",
      "Delete the Evidence",
      "Cipher",
      "Data security",
      "The archive is being wiped. You’re already too late.",
      "The backup server is still online. Don’t let Vale reach it.",
    ],
    [
      "Petra",
      "Executive Access",
      "Vault",
      "Executive protector",
      "Vale wants this contained. Your crab is making that difficult.",
      "The broadcast terminal is unlocked. Finish this.",
    ],
    [
      "CEO Caspian Vale",
      "The Blacktide Conspiracy",
      "Dividend",
      "Chief executive officer",
      "We create the crisis. We sell the cleanup. You call it a scandal; I call it growth.",
      "You can’t broadcast that ledger! Those contracts were supposed to stay secret.",
    ],
  ],
];
export const stages: Stage[] = roster.flatMap((rows, r) =>
  rows.map(([nickname, name, crab, role, intro, defeat], i) => {
    const special =
      r === 2
        ? "cap_dash"
        : r === 3
          ? "bag_snare"
          : r === 4
            ? i === 4
              ? "paper_barrage"
              : "bottle_slash"
            : i === 2 || i === 4
              ? "can_counter"
              : "tidal_slam";
    const specialGear: Record<string, string[]> = {
      cap_dash: ["cap_boots"],
      bag_snare: ["bag_helm"],
      paper_barrage: ["magazine_mail", "cup_crown"],
      bottle_slash: ["bottle_blade"],
      can_counter: ["can_shield"],
      tidal_slam: [],
    };
    const index = r * 5 + i;
    return {
      id: `${regionDefinitions[r].id}-${i + 1}`,
      region: r,
      name,
      role,
      trainer: {
        ...defaultProfile,
        nickname,
        skin: index % 4,
        hair: Math.floor(index / 4) % 4,
        clothing: r % 4,
        hairStyle: i % 2 ? "long" : "short",
        hat: i === 4 || i === 0 ? "cap" : "none",
      },
      crab,
      level: r === 2 ? 5 : r > 0 ? 3 : i === 4 ? 3 : i < 2 ? 1 : 2,
      stats:
        r === 0
          ? [
              { hp: 26, atk: 3, def: 2, spd: 3 },
              { hp: 30, atk: 4, def: 3, spd: 4 },
              { hp: 32, atk: 4, def: 4, spd: 5 },
              { hp: 34, atk: 5, def: 3, spd: 4 },
              { hp: 42, atk: 5, def: 7, spd: 2 },
            ][i]
          : {
              hp: r === 2 && i === 4 ? 38 : 30 + i * 2 + (i === 4 ? 4 : 0),
              atk: r === 2 ? 2 : 3,
              def: i === 4 ? (r === 1 ? 8 : 5) : 3,
              spd: r === 2 ? 5 : r === 1 ? 2 : 4,
            },
      gear: r === 0 && i === 1 ? ["cup_crown"] : specialGear[special],
      moves: [
        r === 2 ? "double_pinch" : r > 0 ? "shell_slam" : "pinch",
        "guard",
        special,
      ] as MoveLoadout,
      intro,
      defeat,
      xp: i === 4 ? 80 : 40,
      boss: i === 4,
      strategy:
        special === "can_counter"
          ? "counter"
          : r >= 2
            ? "special"
            : i === 1
              ? "guard"
              : "bold",
      threeStarTurns: i === 4 ? 8 : 6,
    };
  }),
);
export type StoryProgress = { stage_id: string; best_stars: number };
export function regionStages(region: number) {
  return stages.filter((s) => s.region === region);
}
export function restored(region: number, progress: StoryProgress[]) {
  return progress.some(
    (p) => p.stage_id === `${regionDefinitions[region].id}-5`,
  );
}
export function regionUnlocked(region: number, progress: StoryProgress[]) {
  return region === 0 || restored(region - 1, progress);
}
export function unlocked(stage: Stage, progress: StoryProgress[]) {
  return (
    regionUnlocked(stage.region, progress) &&
    (!stage.boss ||
      regionStages(stage.region)
        .filter((s) => !s.boss)
        .every((s) => progress.some((p) => p.stage_id === s.id)))
  );
}
export const evidenceFound = (progress: StoryProgress[]) =>
  regionDefinitions.filter((_, i) => restored(i, progress));
export function stageById(id: string) {
  return stages.find((s) => s.id === id);
}
export function storyBattle(base: BattleState, stage: Stage): BattleState {
  const enemy = {
    ...base.fighters[1],
    nickname: `${stage.crab} · CPU`,
    startingStats: { ...stage.stats },
    currentHp: stage.stats.hp,
    moves: [...stage.moves] as MoveLoadout,
    level: stage.level,
    snapshotBlueprints: [...stage.gear],
    snapshotGearIds: [],
  };
  return {
    ...base,
    mode: "story",
    storyStageId: stage.id,
    fighters: [base.fighters[0], enemy],
    currentActorId:
      base.fighters[0].startingStats.spd >= enemy.startingStats.spd
        ? "player"
        : "cpu",
  };
}
export function storyStars(battle: BattleState, stage: Stage) {
  if (battle.status !== "completed" || battle.winnerId !== "player") return 0;
  const f = battle.fighters[0],
    ratio = f.currentHp / f.startingStats.hp;
  return ratio >= 0.75 && f.turnsTaken <= stage.threeStarTurns
    ? 3
    : ratio >= 0.5
      ? 2
      : 1;
}
export function storyCpu(battle: BattleState, stage: Stage) {
  const f = battle.fighters[1];
  if (
    stage.strategy === "counter" &&
    f.turnsTaken % 3 === 0 &&
    !f.cooldowns.can_counter
  )
    return "can_counter";
  if (stage.strategy === "guard" && f.turnsTaken % 3 === 1) return "guard";
  if (stage.strategy === "special" && !f.cooldowns[f.moves[2]])
    return f.moves[2];
  return cpuAction(battle);
}
