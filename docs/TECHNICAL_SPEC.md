> Current release update: AI-only identification is required for new discoveries; manual identification and safety/category overrides are removed. Online analysis must succeed before saving. Real geography uses the authored tropical pixel-art MapLibre style; older manual-fallback and Liberty-style descriptions below are historical. Existing saves remain intact.

> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](MOBILE_APP_SETUP.md) and GPS_AND_CAMERA.md for the current contract. Native physical-device acceptance remains pending SDK/device access.

# Technical specification v4 — Pixelogy + Battle Bots

## 0. Architecture overview

```text
Browser (React + Vite + React Router + Tailwind)
  ├─ Figma-derived design tokens + accessible UI components
  ├─ Scan Wizard → Canvas subject crop/mask → pixel collectible
  ├─ IndexedDB: scan discoveries, optional cleanup claims, pixel sprites, equipment, local XP
  ├─ Crab Workshop → sprite layers + anchor renderer + gear stat calculator
  ├─ Practice Battle → pure local TypeScript battle reducer + CPU policy
  └─ Online opt-in (if configured)
        ├─ /api/analyze → Gemini vision (server only, consented photo)
        ├─ /api/collect → one-time optional self-reported cleanup XP (Supabase)
        ├─ weekly leaderboard query from actual cleanup events
        └─ PvP invite/join/turn → Supabase auth + trusted transaction/RPC
```

**Stack:** React + Vite + TypeScript strict mode + Tailwind CSS + React Router + optional shadcn/ui primitives, Canvas 2D, IndexedDB (e.g. `idb`), Zod schemas, Vitest for pure domain modules, Playwright for e2e if feasible. Deploy the SPA to Vercel with same-origin serverless functions under root `api/` and an appropriate SPA rewrite that excludes `/api/*`. Configure local `vercel dev` for functions (or an explicit Vite proxy); `npm run dev` by itself only runs the frontend. Server Gemini adapter with `@google/genai` **after verifying current SDK/model**. Supabase Postgres + Auth (anonymous guests) for public ranking and real player fights only.

Figma is the design source of truth once actual accessible frames exist; no Figma file is included here. See [`FIGMA_UI_WORKFLOW.md`](FIGMA_UI_WORKFLOW.md).

## 1. Suggested code layout (after implementation is authorized)

```text
src/
  main.tsx
  App.tsx                               # React Router routes
  pages/{Home,Scan,ShoreDex,Workshop,PracticeBattle,Leaderboard}.tsx
  pages/{PvPChallenge,PvPMatch}.tsx      # stretch, genuine PvP only
  components/ui/*
  components/scan/*
  components/shore-dex/*
  components/crab/CrabCanvas.tsx
  components/crab/GearSlot.tsx
  components/battle/BattleArena.tsx
  lib/categories.ts
  lib/pixel/{crop,mask,pixelate}.ts
  lib/gear/{catalog,equip,stats,sprites}.ts
  lib/battle/{types,resolver,cpu}.ts
  lib/discoveries/{save,rarity}.ts
  lib/cleanups/{claim,rewards,idempotency}.ts
  lib/storage/db.ts
  lib/figma/tokens.css
  lib/supabase/client.ts                # public publishable credentials only
  tests/{gear,battle,rewards,scan}/*
api/                                      # Vercel serverless handlers, not bundled by Vite
  analyze.ts                              # consented Gemini; GEMINI_API_KEY server-only
  collect.ts                              # optional online self-report, server-validated
  battle/*                                # stretch, authenticated action handlers
```

`docs/*.md` are specs, not source files; do not claim any paths above exist until implemented.

### Vite/Vercel integration notes

- The `VITE_` prefix is **public** in the bundled browser JavaScript. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for intentionally public values only. **Never** use `VITE_GEMINI_API_KEY` or any `VITE_*` service-role secret.
- Serverless `api/analyze.ts` reads `process.env.GEMINI_API_KEY` only in the Vercel server runtime, validates content type/size, and responds with safe structured results; no browser-side Gemini SDK with a private key.
- `vercel dev` is the integrated local function path; if Codex chooses a different dev proxy, document and test it. `npm run dev` alone must default to explicit **Manual mode** when `/api/analyze` is unreachable.
- Deploy routing must preserve `/api/*` and direct SPA URL refreshes. Verify `/scan`, `/workshop`, and `/battle/practice` deep links on the real deployment; do not use a catch-all rewrite that swallows APIs.
- Supabase browser auth must use RLS and a public publishable key; server-only elevated actions use server secrets in functions. For PvP, **never trust client-local discoveries as proof of online gear ownership**: require a server-recorded inventory claim or mark PvP loadouts as separately constrained/unavailable.

## 2. Canonical domain types

```ts
type CleanupCategory =
  | 'plastic_bottle' | 'aluminum_can' | 'food_wrapper'
  | 'disposable_cup' | 'plastic_bag' | 'bottle_cap'
  | 'paper_cardboard' | 'straw' | 'other_litter';
type ItemSubtype = 'magazine' | 'intact_bottle' | null; // expand only via allowlist
type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
type GearSlot = 'head' | 'shell' | 'main_claw' | 'off_claw' | 'feet';
type Safety = 'allowed' | 'hazardous' | 'uncertain';
type SpriteReference = { thumbnailBlobKey: string; width: number; height: number };
type Collectible = {
  id: string; // idempotency UUID
  createdAtIso: string;
  category: CleanupCategory;
  subtype: ItemSubtype;
  cleanupClaimedAtIso?: string | null; // self-report; not proof of actual disposal
  label: string;
  rarity: Rarity;
  gearBlueprintId: string | null;
  gearRulesVersion: 1;
  sprite: SpriteReference;
};
type CleanupClaim = {
  eventId: string;
  collectibleId: string; // one claim max per saved safe discovery
  confirmedAtIso: string;
  xpAwarded: 10 | 15; // derived, never trusted from client online
  selfReported: true;
};
type Equipment = Partial<Record<GearSlot, string>>; // collectible ID
```

Discovery ID is distinct from the optional cleanup claim event UUID. All IDs owned by this app; don't use an AI-generated item name as a primary key. For a unique local **first confirmed cleanup** bonus, count first claimed `category` only (not subtype, blueprint or rarity). Original v2 has nine cleanup categories; keep them stable in v3. `magazine` is a subtype of `paper_cardboard`; an approved intact bottle example is a subtype of `other_litter` and may require safety gating. See [`GEAR_CATALOG.md`](GEAR_CATALOG.md).

## 3. Scan and recognition pipeline

1. User chooses browser capture/photo picker (mobile `capture="environment"` hint, desktop file upload). Validate MIME, file size ~5 MB and dimensions; handle HEIC compatibility honestly.
2. Keep photo in-memory; normalize orientation, resize to bounded pixels, strip EXIF. Show privacy notice; transmit to Gemini **only after explicit consent**. Local manual path requires no network.
3. Server route validates request size; invoke a currently supported Gemini image model with structured JSON output. Do not hardcode nonexistent SDK methods; check actual docs/model/price before implementation.
4. Parse allowlisted `{ category, subtype, label, safety, bbox, polygon? }`; use strict schema and safe fallback. Wrong/unknown categories or dubious safety trigger manual review or block collection. A Gemini determination of “safe” is not a substitute for user judgment.
5. Bbox in official image-understanding examples uses **normalized 0..1000** coords `[yMin, xMin, yMax, xMax]`; polygon points are `[x, y]` on compatible outputs. Normalize to pixel dimensions carefully, clamp bounds, reject empty/invalid polygon, and test portrait+landscape.
6. Primary result = transparent polygon mask **if valid and reliable**; otherwise tight bounding crop; otherwise manual crop. Never call a bounding crop “background removed.”
7. Downscale the cropped/masked object to small grid (~24–64px), nearest-neighbor upscale, matte on pixel-beach backdrop, combine card UI. A standardized gear overlay sprite is independent of the per-photo pixel card. This yields readable battle sprites even for awkward photos.
8. After a safe review, persist exactly one **discovery** card, cosmetic rarity, pixel art and gear blueprint, regardless of disposal status. Then ask *optionally* `I safely disposed of this litter` now or on card detail later. This creates at most one **cleanup claim** per collectible and alone awards cleanup XP; repeated taps/retries cannot double-award. Never confuse a scanned photo with verified cleanup.

**Unsafe list:** sharps, needles, broken/uncertain glass, chemicals, medical/biological waste, electrical hazards, batteries, unknown dangerous items. These get educational warning/no collect. Do not promise true physical verification.

## 4. Discovery, optional cleanup XP & rarity

- **Safe discovery:** one saved card and gear candidate; **0 cleanup XP** for scanning alone.
- **Optional self-reported disposal claim:** `10` cleanup XP per uniquely claimed safe collectible, plus `5` once per canonical category on its *first confirmed cleanup claim*, never merely first scan.
- Rarity odds for card display only: Common 60%, Uncommon 27%, Rare 10%, Legendary 3%; assign **once** using secure or seeded selection and persist. No reroll on refresh or gear equip; no effect on stats.
- Idempotent `saveDiscovery(discoveryUUID)`: persist one safe collectible and card rarity, regardless of claim status. Separately, `claimCleanup(collectibleId, eventUUID)`: persist a one-time cleanup event (unique `collectibleId`) and derived XP + first-category-claim flag atomically. Failed writes must not show a phantom XP award.
- Battle practice trophies **separate** from cleanup XP; public cleanup leaderboard is never inflated by battle outcomes.

## 5. Crab renderer and gear state

- `BASE_STATS={hp:40,atk:6,def:4,spd:4}`; stats derived from equipped owned collectible IDs and frozen versioned blueprint table, capped as in battle spec.
- Equipment constraints: safe discovery card exists + matched slot + blueprint resolvable, unique item across slots. A wrong slot returns typed error, no partial changes.
- Store equipment as owned collectible **IDs**. Reload reconciles missing cards by unequipping them and reporting repair.
- Crab sprites are original red base plus transparent front/back equipment layers. Each blueprint maps to an `assetKey` and slot anchor (coordinate metadata). Render with CSS `image-rendering: pixelated` or Canvas `imageSmoothingEnabled=false`.
- Maintain exact same stats logic for practice and PvP; server PvP independently recomputes loadout from authenticated server-owned inventory, **never accepts client-supplied stats**.

## 6. Battle engine

Implement a **pure** immutable reducer `resolveTurn(state,actorId,action)` with derived legality/errors, move powers, guard and cooldown, HP clamps, turn order, log and winner. See **canonical exact rules** in [`BATTLE_SYSTEM.md`](BATTLE_SYSTEM.md) (takes precedence over informal UI copy).

- Never use React component state as authoritative combat logic. Component dispatches typed actions and renders resolver output.
- `practice`: CPU decisions via tested deterministic rule policy; keep mode labeled `Practice vs CPU` even when offline.
- `pvp`: route hosted on server + authenticated matches + idempotent `requestId` and expected version. Resolve server transaction, broadcast/sync via Realtime or polling, never rely on a client's local combat resolution to award wins.

## 7. IndexedDB local schema (suggested)

| Store | Key | Data |
|---|---|---|
| `discoveryEvents` | `collectibleId` | scan time, safe category, rarity/card reference (no cleanup XP) |
| `cleanupEvents` | `eventId`, unique `collectibleId` | optional self-reported disposal time, category, first-confirmed-category bonus, cleanup XP |
| `collectibles` | `id` | label, rarity, subtype, gear blueprint, sprite ref |
| `artBlobs` | `blobKey` | only processed pixel art/thumbnail, not source photo |
| `profiles` | `localProfileId` | anonymous local stats/selected crab base |
| `loadouts` | `localProfileId` | five slot→collectible ID assignments |
| `practiceMatches` | `id` | recent local match snapshot (optional) |

Local discovery, optional self-reported cleanup XP, and gear should work with no cloud. Do not overwrite old cards during migrations: explicit database version step, backups optional, maintain prior 9 taxonomy keys from v2.

## 8. Online design (only if built/tested)

### Identity and verified-enough accounting

- Supabase **anonymous auth** yields per-player uid. Public nickname is chosen, moderated/validated, not an email/name. If session/browser data is cleared, guest identity may be lost; disclose.
- `cleanup_events`: uuid `id` unique per user, `user_id`, `collectible_id` unique per user, `category`, `created_at` UTC, `xp_awarded` **server computed**, self-reported-disposal assertion; optionally validated gear catalog version if used for PvP. Discovery scans without cleanup confirmation must not appear in this table. Ensure uniqueness/idempotency.
- `public_profiles`: user id, nickname, opt-in flags; no precise location or original photos.
- `weekly_scores`: server query/view **sum self-reported cleanup XP** by server-defined **Monday 00:00 America/Chicago** window and count; rank weekly XP, cleanup count tie-breaker. Use appropriate Postgres timezone conversion and DST tests; never accept `earnedXp` client field.
- Only **self-reported** cleanup events **created after opt-in** enter public competition; discovery scans never directly enter the ranking. Local offline history does not silently backfill. If offering online PvP, participants need server-verifiable owned gear. Local-only scanned cards are not trusted as online PvP inventory without a secure server-recorded ownership step; a cleanup claim is self-reported and not physical proof.
- `POST /api/collect`: authenticated, consent/opt-in, validated allowed category, collectible/event IDs, explicit **self-report disposal=true**, uniqueness per collectible, anti-spam/captcha consideration, server-computed bonus transaction. Do not treat submitted photos as disposal proof. Honest disclosure that confirmation is self-reported and cannot prove pickup occurred.

### PvP tables / actions (stretch only)

- `pvp_matches`: `id`, host uid, guest uid nullable, status, invite hash/code expiry, turn uid, version, rulesVersion, fighter snapshots, winner uid, created timestamps.
- `pvp_actions`: `match_id`, `request_id`, `turn_number`, actor uid, action, result/state version. Unique request id per match and monotonic turn numbers.
- **RLS** enforces members-only reads and denies direct writes to authoritative state; server RPC/route validates member identity, signed auth, invite joining, gear ownership, legal turn, cooldown, match version and action idempotency before transaction.
- Server snapshots verified immutable loadouts on match start; cosmetics/rarity never modify computed damage. Match results and battle trophies separate from cleanup board.
- Invites short-lived, rate-limited and unguessable; joining one's own invite blocked; waiting/disconnect states explicit. Show PvP only once two-guest integration test passes.

## 9. Privacy & costs

- Never store original photos publicly; strip EXIF and location metadata. Consent to AI upload explicitly; explain the third-party call.
- Gemini and service-role keys server-only; public Supabase publishable/anon keys are designed for browser but still require secure RLS; never confuse the two.
- Basic abuse controls: file/request size cap, rate limiting, login protections, per-user action checks, idempotency, escaped nicknames. Public competition is self-reported and potentially subject to abuse.
- No paid plans or external purchases without user approval. Error states should be truthful: `manual`, `online unavailable`, `practice vs CPU`.

## 10. Test contract

- Safe photo → valid focused crop → 1 collectible card/gear **without cleanup claim** → reload persistence, 0 cleanup XP. Optional one-time disposal self-report → 10 or 15 cleanup XP, saved separately.
- Dangerous/uncertain object: no eligible card or gear or XP. Safe scan marked `Not disposed`: retains card/gear but earns **0 cleanup XP**.
- Every catalog category/subtype maps to the declared correct slot; unknown item never invents gear.
- Equipping unknown/duplicate/wrong-slot gear rejected without mutation; stats bounded and computed correctly.
- Red crab renders with front/back layers without face being obscured; visually verify 390px width.
- Combat turn reducer: deterministic formula, action legality, guard, cooldown, speed tie, KO, repeated input protection.
- Gemini malformed bbox/polygon handled safely and manual remains available.
- Weekly board real two opted-in accounts and DST boundary if online; missing Supabase shows no fake records.
- PvP two separate accounts both see same actual state; invalid owner/out-of-turn/duplicate request blocked; missing integration never exposes faux human opponent.

**References:** [Vite env variable security](https://vite.dev/guide/env-and-mode), [Vercel Functions](https://vercel.com/docs/functions), [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding), [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [Supabase anonymous auth](https://supabase.com/docs/guides/auth/auth-anonymous), [Figma MCP](https://developers.figma.com/docs/figma-mcp-server/).

## Native GPS implementation

Capacitor 8 packages the existing `dist` output for iOS and Android using development ID `com.pixelogy.dev`. MapLibre's worker is explicitly bundled by Vite. `src/mobile/` contains platform camera/location adapters, lifecycle management and privacy preferences. `GeographicMap` replaces authored terrain in the production world, while `levelFor` and all combat/equipment rules stay independent.

IndexedDB v3 adds the versioned `preferences` store. Stored collections, profiles, loadouts, artwork and cleanup records are preserved. GPS fixes contain latitude/longitude/accuracy/timestamp and remain memory-only. Native recognition uses configured HTTPS `VITE_API_BASE_URL`; browser recognition defaults to same-origin. No production endpoint has been supplied.

Production input has no simulated locomotion. Legacy demo renderer/movement modules are unused references and are not reachable from production UI. Automated tests inject fixtures into browser APIs only. Full hardware acceptance is pending; see the mobile setup and store checklist.

## PWA-first release architecture

The browser release is now primary. `src/pwa/` owns installation guidance and production service-worker registration/update UX. Build-time static cache generation hashes emitted HTML/JS/CSS plus public manifest/icon bytes, runs after HTML emission and fails if the shell is missing. The worker caches no runtime/private/API/photo/map responses. Existing IndexedDB remains the intentional local gameplay store.

A waiting worker activates only after explicit Reload to update (or normal browser lifecycle once old clients close). Old client entry assets are tracked in worker memory so static cache cleanup waits until live clients use the current build; pending newer caches are preserved. No profile or gameplay data is involved in this cache bookkeeping. Vercel supplies HTTPS after deployment; repository configuration alone is not hosted acceptance evidence.
