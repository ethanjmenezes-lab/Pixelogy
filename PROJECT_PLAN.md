> Baby-crab opening update (2026-10-24): the user-authorized seven-scene opening supersedes the old eight-shot opening. Compact landing, responsive captions, exact revised dialogue and first-battle transition are implemented. Full browser suite 114/114 passed; final delayed-watch tests 2/2 passed. See [current scope and verification](docs/story/BABY_CRAB_STATUS.md). Earlier opening/version statements below are historical.

> Locked-script update (2026-10-24): `src/content/story-script.json` is immutable canonical content. Recovery callback/form repaired; live Supabase allowlist and additive cinematic constraint updated. Eight opening shots, all five regions/25 battles and six-shot ending use the new reusable player. 83 unit tests and build passed; all 112 browser cases passed across the full run plus eight corrected arrival-fixture reruns. Frontend deployment, real emailed recovery/device testing and full sound design remain pending. See [implementation and verification](docs/STORY_MODE.md).

> Authentication repair (2026-10-24): dedicated auth routes and scan return are implemented; Supabase schema/catalog are applied and rollback RLS tests passed. Vercel configuration, matching receipt-signing secret, and production deployment 33b72c2 are complete. Hosted signup UI and unauthenticated API rejection passed; real email/camera/Gemini acceptance remains pending. See [release status](docs/AUTH_RELEASE.md). This status supersedes earlier unapplied-schema notes below.

> Current ShoreDex change: predefined 200-species catalog and authenticated Supabase account saves replace photo pixelization for new discoveries. See [cloud architecture and pending setup](docs/SHOREDEX_CLOUD.md). The prepared migrations are not yet applied; older local-only/crop descriptions below are historical. Existing local saves are preserved.

> Current release update: AI-only identification is required for new discoveries; manual identification and safety/category overrides are removed. Online analysis must succeed before saving. Real geography uses the authored tropical pixel-art MapLibre style; older manual-fallback and Liberty-style descriptions below are historical. Existing saves remain intact.

> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](docs/PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](docs/MOBILE_APP_SETUP.md) and [GPS/camera architecture](docs/GPS_AND_CAMERA.md) for the current contract. Native physical-device acceptance remains pending SDK/device access.

# Pixelogy v4 — product and delivery plan

**Positioning:** a beach-themed litter **discovery** and optional self-reported cleanup game with **Battle Bots**. A reviewed, safe scan unlocks pixel art **and equipment** for a customizable **red crab**; an optional cleanup confirmation grants leaderboard XP.

## 1. Product pitch and boundaries

> *Clean up the coast. Build your crab. Battle your friends.*

Players photograph safe real-world litter and transform the discoveries into pixel gear. They can also self-report safe disposal for cleanup-specific XP. A Pokédex-like **ShoreDex** records discoveries. The **Crab Workshop** turns inventory into a visibly outfitted crustacean. Turn-based fights create a reason to choose loadouts and replay. The game is environmentally positive without claiming to verify cleanups or measure real environmental impact.

**Not in scope:** AR combat, licensed Pokémon/Prodigy assets, dangerous-trash treasure hunts, monetized loot boxes, or AI-verified physical disposal.

## 2. Canonical journey

1. **World**: foreground GPS geographic map, equipped crab, HUD and crab menu.
2. **Scan**: immediately capture safe trash with the camera; opt into Gemini (or manual categorization); confirm/correct label & object selection; pixelize the isolated object.
3. **Safety gate**: hazardous or uncertain litter is not eligible for collectible gear; do not ask players to handle dangerous items. A photo does not prove disposal.
4. **Reveal/Save**: reviewed safe discovery gets one cosmetic-rarity card and deterministic gear blueprint immediately. The user can **skip cleanup confirmation** and still own/equip the collectible.
5. **Optional cleanup claim**: player affirms `I safely disposed of this litter` (now or from card detail). Once per card, grant **+10 cleanup XP**, plus **+5** for the first *confirmed cleanup* of a canonical category. Unconfirmed discovery earns **0 cleanup XP**.
6. **Inventory**: same unique discovered item appears in ShoreDex **and** as a gear candidate with predictable gear blueprint.
7. **Workshop**: start with an original **red crab**; drag/tap gear onto matched body slots. Render gear behind/in front of the crab using named anchors; show stat changes. No crafting cost or item consumption.
8. **Practice battle**: battle CPU with Pinch, Guard, Tidal Slam; visible HP, combat log, turn and result. Use real equipped stats and deterministic rules.
9. **Online if genuinely implemented**: opt into public weekly cleanup-XP ranking; use battle invite code to fight a second authenticated player (never a fake human).

## 3. Feature priorities

| Tier | Deliverable | Why |
|---|---|---|
| **MVP A — nonnegotiable** | Responsive original beach UI, camera capture, manual safety-aware category path, object-focused crop+pixel art, immediate safe-discovery card/gear, optional self-reported disposal XP, ShoreDex, persisted collectible IDs | Functional cleanup loop independently of credentials |
| **MVP B — new feature** | Deterministic trash→gear mapping, 5 crab slots, ownership-based equipment, crab layer preview, stat summary, one complete playable **CPU battle** | Demonstrates the new unique idea |
| **Core integrations** | Real Gemini vision & localization; real opt-in weekly **self-reported cleanup XP** leaderboard | Retains original vision without compromising fallback |
| **Stretch** | Real **two-player** invite-based PvP with authoritative backend, result/trophy history, battle animations, optional accessory slot | Excellent if time, but security/networking intensive |

**Scope rule:** The CPU battle is a real playable MVP, not a pretend player-to-player experience. PvP may be omitted from the shipped demo with a clear `Coming later` or no entry point.

## 4. Gear philosophy

- Slot set: `head`, `shell`, `main_claw`, `off_claw`, `feet`.
- Classify each safe item into a known **gear blueprint** using category/subtype; users may correct invalid recognition before saving. Specific examples and deterministic stat table: [`docs/GEAR_CATALOG.md`](docs/GEAR_CATALOG.md).
- Suggested recognizable conversions: plastic bag as helmet, magazine as shell armor, bottle caps as boots, aluminum can as shield, bottle as claw weapon.
- **No arbitrary AI power generation**. Classifier determines object kind only. Versioned catalog determines name, icon, slot and small combat modifiers.
- Base crab is always red; outfits should leave the face/claws/eyes visible and silhouette readable at mobile size.
- Rarity only styles the card. No rarity bonuses, grinding advantage, rare hazard rewards, or gear item consumption.
- A new duplicate object yields a separate collectible instance for different loadouts, never a free stackable stat buff.

## 5. Battle design

- 1v1 red crabs; **Practice vs CPU** first and clearly labeled.
- Base stats: **HP 40, ATK 6, DEF 4, SPD 4**. Five gear slots adjust these within versioned caps.
- Actions: **Pinch** (basic damage), **Guard** (reduce next incoming hit), **Tidal Slam** (larger damage, cooldown).
- Alternating turns, first actor by Speed (stable tie break), integer damage; server authoritative if multiplayer.
- Victory: reduce opposing HP to 0; grant **battle trophies** locally / online separate from cleanup XP. Practice wins don't rank publicly.
- PvP: user-to-user invitation or lobby, trusted identity + server atomic turns, human opponent confirmation, safe for disconnect/retry. See [`docs/BATTLE_SYSTEM.md`](docs/BATTLE_SYSTEM.md).

## 6. Figma-first UI and handoff

Figma is the **design-system source of truth** once a real design file exists. It must include components/tokens/variants and mobile+desktop adaptations, not just screenshot mockups. Build these priority screens in Figma before detailed UI coding:

1. Mobile home + navigation
2. Scan states (capture / analyzing / correction / discovery reward / optional cleanup claim)
3. ShoreDex card grid and card detail
4. Workshop: red crab center, slot highlights, item drawer and stat changes
5. Battle: two crabs, health, action buttons, combat log, result modal
6. Leaderboard / optional multiplayer challenge states

Use [`docs/FIGMA_UI_WORKFLOW.md`](docs/FIGMA_UI_WORKFLOW.md). There is **no Figma design URL supplied in the current package**. The Codex agent must inspect actual linked frames when provided or implement from this written brief if not available.

## 7. Milestones / cut plan

| Milestone | Gate |
|---|---|
| M0 — setup + Figma brief | Confirm rules; GitHub/Vercel/Supabase/Gemini project/env plan; Figma frame names and tokens |
| M1 — React/Vite shell | Mobile routes/home/components working |
| M2 — scan | Real photo selected, safe consent and manual fallback |
| M3 — identify/focus | Configured Gemini works or honest manual; user can crop |
| M4 — collectible | Subject pixel card unlocks from **safe scan**; disposal is an optional separate confirmation for XP |
| M5 — persistent inventory | ShoreDex, rarity, separate discover/cleanup records, optional fixed cleanup XP, idempotent saves |
| M6 — Crab Workshop | All 5 slots; equipment from inventory; stats visibly update |
| M7 — turn-based practice | End-to-end CPU battle & deterministic unit tests |
| M8 — live leaderboard | Actual Supabase auth, score submission, two users |
| M9 — **if time**, real PvP | Two live authenticated users, invite + turn auth + result |
| M10 — QA/demo | Mobile happy path, failures and truthfulness audited |

If constrained: stop after M7; demonstrate full scan → collectible → crab gear → CPU battle loop, with optional cleanup claim. No live-service dependency blocks the demo. Resume M8 and M9 only with proper backend authorization, never mock other users.

## 8. Truthfulness/safety/disclosure

- Camera recognition is **not** disposal verification. User self-reports. Public cleanup XP describes **self-reported** events; scans alone do not earn cleanup XP.
- Dangerous/unknown/suspected sharp glass and other hazardous litter cannot grant collectible gear. Even if a visual gear example is a bottle blade, **do not encourage handling unsafe glass**; it can be tutorial visual only.
- Consent before AI upload; remove EXIF, do not publicly store raw source photos, names or precise locations.
- Runtime APIs/credentials may be unavailable; do not simulate Gemini, rankings or human opponents as live.
- Ensure original designs, compliant assets, user authorization and event rules.

## 9. Definition of done

**Minimum judged demo:** Player captures a safe bag / cap / magazine photo → identifies or manually selects → sees focused pixel artwork → saves **discovery card and gear** without needing to claim disposal → optionally self-reports cleanup for XP → equips it on the **red crab** → attacks and wins/loses a real turn-based **CPU** battle → reload still shows collection and gear.

**Stronger demo:** Gemini makes true recognition, weekly board shows two genuine opted-in accounts. **Stretch demo:** two actual users exchange game actions through trusted online battle records.

## Native transition delivery status

The native GPS implementation is in the existing repository. Verification passed TypeScript/lint, 38 unit/API tests, 34 Chromium/WebKit checks, production build and both platform asset syncs. Real OpenFreeMap tiles were visually checked with synthetic coordinates. Native compilation is blocked by absent Xcode/Java/Android SDK; physical-device acceptance, backend deployment, signing and stores are still open. See the mobile setup and store checklist before treating this as a distributable native release.
