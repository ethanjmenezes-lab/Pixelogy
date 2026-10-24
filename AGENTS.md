> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](docs/PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](docs/MOBILE_APP_SETUP.md) and [GPS/camera architecture](docs/GPS_AND_CAMERA.md) for the current contract. Native physical-device acceptance remains pending SDK/device access.

# AGENTS.md — instructions for Codex

You are implementing **Pixelogy v4**, an original mobile-first beach-cleanup / crab-gear / turn-based-battle game. Treat this file and the linked specs as the project contract.

## Do first

1. Read `README.md`, `PROJECT_PLAN.md`, `docs/CROSS_CHAT_ALIGNMENT.md`, `docs/FIGMA_UI_WORKFLOW.md`, `docs/GEAR_CATALOG.md`, `docs/BATTLE_SYSTEM.md`, `docs/TECHNICAL_SPEC.md`, `docs/IMPLEMENTATION_TASKS.md`.
2. Confirm hackathon eligibility/originality rules and user authorization before writing code/assets. **Planning documents are not an existing implementation.**
3. Check whether a real Figma file/frame is connected. If so, use the actual frames, variables, and components via Figma MCP. If not, work from the written UI specification and report the missing design source; **never fabricate Figma inspection or links**.
4. Deliver small, end-to-end milestones. Run typecheck/lint/tests/build when configured; record actual results and incomplete integrations.

## Unalterable game requirements

- Two connected loops: **safe trash discovery → saved item → equip original red crab → battle**, plus an **optional self-reported cleanup → cleanup XP → weekly leaderboard** loop. Every equipped item is backed by a unique saved, safe ShoreDex collectible, not an arbitrary granted item (except explicitly labeled tutorial mock gear, which must not enter persistence).
- Immediate camera capture → **Gemini-first** consent-based object identification/localization, **manual fallback** → editable object-centered crop → pixel art. Do not pixelate the entire scene and call that isolation.
- **Do not gate ShoreDex cards or gear on disposal.** After a safe scan is reviewed, save its card/gear; ask for **optional** `I safely disposed of this litter` confirmation now or later. Only a unique confirmed cleanup grants cleanup XP. Never claim AI verifies disposal.
- Store rarity (Common/Uncommon/Rare/Legendary) once; rarity affects only presentation, **not attack, defense, speed, cleanup XP or matchmaking**.
- Collectibles have deterministic **gear blueprint** based on safe category/subtype. Render an original **red crab base** plus layered, slot-anchored gear. Standardized stats prevent unknown/hazardous items from giving advantages.
- Core equipment slots: **HEAD, SHELL, MAIN_CLAW, OFF_CLAW, FEET**. One item ID per slot; one item cannot fill two slots at once; changing gear doesn't delete the collectible. Default gear for unfilled slots is visual-only and gives no item buffs.
- A complete **Practice vs CPU** match with clearly labeled turns, HP, Pinch/Guard/Tidal Slam, win/lose/replay, deterministic damage and unit-tested resolver.
- **PvP is a real-player stretch target**, not a mock: only show online challenge UI when a secure two-account invite/turn system functions. A simulated opponent must NEVER be labeled a human. The online cleanup leaderboard is similarly real or explicitly unavailable.
- Preserve v2 weekly cleanup-XP leaderboard: opt-in, Monday 00:00 America/Chicago weekly boundary, public nicknames, no fake live scores. Battle wins/trophies do **not** inflate cleanup XP.

## UI/Figma rules

- Design source: accessible Figma frames if connected; otherwise `docs/FIGMA_UI_WORKFLOW.md` and `docs/UX_AND_GAMEPLAY.md`.
- Primary views: GPS overworld, Scan (all states), ShoreDex, Crab Workshop (empty/full gear), Practice Battle (idle/turn/damage/result), Leaderboard, optional PvP challenge/invite/wait/results.
- Prefer Figma Auto Layout, named components, variants and design variables. Mirror semantic tokens in Tailwind/CSS. Maintain 44px or larger touch targets, readable labels, reduced-motion alternatives, contrast and responsive mobile layouts.
- Sprite composition: red crab base with fixed anchors; equipment as transparent layers behind/in front as defined in catalog. Never rely on Figma screenshot images as the whole clickable UI; implement semantic interactive components.
- Original art and battle mechanics. **Inspired by** Pokémon/Prodigy, **not replicas** of proprietary sprites, names, moves or screens.

## Technical and security rules

- React + Vite + TypeScript + Tailwind + React Router; Vercel serverless `api/` handlers for privileged calls; modular pure domain packages for `gear`, `battle`, `pixel`, `rewards`.
- Backend Gemini endpoint uses validated structured output: allowlisted category/subtype, unsafe flag, normalized bounding box, optional polygon; honor documented coordinate axis order. Secrets server-only, consent required, uploads resized and bounded.
- IndexedDB stores generated pixel collectible, owned gear metadata, loadout, battle practice settings, and distinct idempotent **discovery** and optional **cleanup** records; no raw photo, GPS or EXIF persisted to public databases.
- Discovery/collectible UUID and cleanup event UUID are distinct; cleanup confirmation is once per collectible, and local/server awards are idempotent. **Never trust client-reported XP, user IDs, damage, victory, gear modifiers or turn changes** for online competition.
- For online services use anonymous authenticated Supabase sessions with RLS, server-side validation, transactional cleanup awards and PvP state mutations (atomic turn versioning, authorization, invite limits). Credentials/costs require explicit setup/approval.
- No reward incentives for broken/unknown glass, needles, blades, chemicals, batteries, medical waste, contaminated litter or other unsafe pickups. The example **Bottle Blade** is just stylized gear from a safely handled approved bottle or a noncollectible demo illustration; do not tell users to pick up hazardous glass.

## Build / cut order

`GitHub/Vercel/Supabase/Gemini setup + Figma blueprint` → `React/Vite app shell` → `photo & recognition` → `safe discovery card & ShoreDex` → `optional self-reported cleanup XP` → `equipment mapping & crab workshop` → **`local Practice vs CPU`** → `real weekly XP board` → `real online PvP if time` → polish and demo.

If schedule is tight, **cut** online PvP first, then elaborate animations/extra battle moves, then optional Figma polish. **Keep** the end-to-end scan → crab gear → CPU battle loop and the truthfulness of all integrations. Do not silently replace unfinished multiplayer with bot-vs-bot screens.

## Report after each milestone

Briefly state changed paths, what ran, which acceptance criteria passed, which services are live versus unconfigured, and next action. Update `docs/REVISION_NOTES.md` with major architectural or scope changes. Do not tick unchecked tasks or claim a Figma file, Gemini output, real rankings or real human opponents without evidence.
