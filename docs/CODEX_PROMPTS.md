# Copy/paste Codex prompts — v4

Use these in order. Each assumes Codex has read `AGENTS.md` and linked specs. Confirm actual Figma access, rules and permission before generating hackathon code.

## 0. Read and plan, do not claim implementation

> Read `AGENTS.md`, `README.md`, `PROJECT_PLAN.md`, and all `docs/*.md`. Summarize (a) safe discovery → ShoreDex → red-crab gear → CPU battle, plus optional cleanup claim vertical slice, (b) real service integrations vs fallbacks, (c) Figma frames actually connected vs specified only, and (d) current checkboxes. Do not write code until the event rules and my authorization allow it. Do not claim Figma, Gemini or PvP exists without verifying.

## 1. Figma frame inspection and UI kit

> Use the **real** connected Figma Pixelogy design file and inspect `Screen/Home/Mobile`, `Screen/Workshop/Equipped`, `Screen/Battle/Practice/YourTurn`, and their components/variables. Extract precise tokens, dimensions and exportable original crab/gear assets. Implement semantic reusable React/Tailwind components; no flattened screenshot as UI. If no Figma file is connected, say so and build a draft from `docs/FIGMA_UI_WORKFLOW.md` only. Report deviations and which Figma frames were actually read.

## 2. App + original crab visual shell

> Build React + Vite + TypeScript + Tailwind + React Router scaffold and all MVP routes. Put privileged Gemini and other server-only handlers in Vercel `api/` functions; Vite dev alone does not serve them. Implement a beach-pixel design system, accessible mobile navigation, readable type and original red crab base artwork with standardized equipment anchor layers. Follow design components/tokens. Provide local run/test commands and run configured checks.

## 3. Safe scanner and Gemini

> Build a real camera/file selection → preview/retake → consent → Gemini/server-only structured recognition and localization → manual fallback pipeline. Require a strict safety/category allowlist. Validate 0..1000 bbox `[yMin,xMin,yMax,xMax]`, optional polygon `[x,y]`, and portrait/landscape. Add manual crop and don't claim unsupported model output. Keep images local until remote consent. Test invalid files, malformed responses, outages.

## 4. Pixel collectible and ShoreDex

> From the safe, focused crop generate a pixelated object card. Immediately save reviewed **safe** discovery card/rarity and resolved `gearBlueprintId` to IndexedDB, even if disposal is not confirmed. Offer optional one-time `I safely disposed of this litter` action now or later; that action alone awards +10 cleanup XP plus first **confirmed cleanup** canonical category +5 and never scale bonuses by rarity. Idempotent duplicate submits. Build responsive ShoreDex view; prove refresh persistence and failure/no-consent cases.

## 5. Gear mapping and Workshop

> Implement `docs/GEAR_CATALOG.md` exactly: 5 slots, standardized modifiers, subtype precedence, collectible-ID ownership, no rarity power, no item consumption. Build a **red crab** rendered by layered transparent sprite assets; bag helmet, magazine shell armor, bottle weapon, can shield, bottle-cap boots must look intuitive. Add slot hotspots, inventory drawer, equip/swap/unequip, before/after stats, wrong-slot errors and loadout persistence. Add unit tests for duplicate ID/wrong slot and stat calculations.

## 6. Genuine local Battle Bots practice

> Implement deterministic `resolveTurn` from `docs/BATTLE_SYSTEM.md` and a real playable **Practice vs CPU** battle screen. Use stored equipped gear and original red crab sprites. Controls: Pinch, Guard and Tidal Slam with two-own-turn cooldown. Update legal active turn, integer damage, Guard, HP, winner, combat log; add a CPU action policy and replay. Do not present CPU as another person or add practice wins to cleanup XP ranking. Test all mechanics and report results.

## 7. Real Supabase cleanup leaderboard

> Connect anonymous Supabase profiles, opt-in nicknames, idempotent server-validated **self-reported disposal** events; scans without disposal do not score and weekly **cleanup XP** rankings. Preserve Monday 00:00 America/Chicago rollover and stats separation from Battle Bots. Implement RLS, anti-abuse and two separate user-session tests. If integration cannot be configured, show truthful unavailable state and keep the local game intact.

## 8. **Optional** real player-to-player battles

> If and only if time permits, implement genuine authenticated 1v1 invitation-based PvP from `docs/BATTLE_SYSTEM.md`. Use server-side verified gear ownership, immutable match-start stats, row-locked atomic reducer turns, player authorization, request-ID idempotency, match version checks, expiry/forfeit and synced match UI. Run a test with **two real separate accounts**. Do **not** invent human opponents or surface this as working until that test passes.

## 9. Final QA and deploy

> Execute `docs/DEMO_AND_TESTING.md` with a mobile viewport and real device if available. Run typecheck, lint, tests, build, and smoke flow: safe photo → manual/real Gemini → subject pixel art → ShoreDex/gear without disposal → optional cleanup XP → equip crab → finish a CPU battle → reload. Confirm which online systems truly work. Deploy only when authorized and report exact URLs and pass/fail logs; no fabricated success claims.

## Recommended first working slice

If we must ship quickly: **complete scanner/manual fallback + save discovery without disposal + optional cleanup confirm + gear mapping + one red crab equipment view + local battle first**. Add real Gemini as soon as configured, then real leaderboard; PvP is stretch. Figma design can evolve in parallel but cannot block a legible, functional mobile demo if frames aren't ready.
