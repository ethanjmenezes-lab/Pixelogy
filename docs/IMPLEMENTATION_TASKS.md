> Current release update: AI-only identification is required for new discoveries; manual identification and safety/category overrides are removed. Online analysis must succeed before saving. Real geography uses the authored tropical pixel-art MapLibre style; older manual-fallback and Liberty-style descriptions below are historical. Existing saves remain intact.

> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](MOBILE_APP_SETUP.md) and GPS_AND_CAMERA.md for the current contract. Native physical-device acceptance remains pending SDK/device access.

# Codex implementation tasks and acceptance gates (v4)

**Rule:** complete and test each task before checking it. Do not claim that a Figma design, API, real leaderboard or multiplayer is connected unless proven. These are future tasks, not already implemented features.

## Current release: tropical pixel world / AI-only identification

- [x] Authored geographic pixel style and original terrain textures, companion overlay, tropical UI palette.
- [x] AI-only safe-result review with no category/safety overrides; retry/retake and late-response cancellation.
- [x] Preserve saves and optional cleanup; full gameplay regression passes in Chromium and WebKit.
- [x] Typecheck, lint, 43 unit/API tests, five plain-Node smoke assertions, build and 44 browser checks.
- [x] Live tile loading at a synthetic coordinate in production preview, with no page errors.
- [ ] Hosted Gemini/deployment acceptance and physical iPhone camera/GPS/performance.

The original milestone ledger below records earlier release work; the current release section supersedes its manual-scanning requirements.

## M0 — Governance & Figma source (P0)
- [x] Check current HowdyHack rules and confirm implementation timing/user approval.
- [x] Read every core spec in `README.md` and `AGENTS.md`.
- [ ] Create GitHub repo and configure Vercel deployment/API function target, Supabase public project details and server-side Gemini secret placement; do not expose keys.
- [ ] Create or obtain Figma file with priority mobile frames; record actual file/frame links if available (none bundled).
- [x] Define semantic design tokens, named button/card/gear-slot/HP component variants and original red crab art plan; if no Figma access, document approximation from written spec.
- [ ] Establish project board and scope: MVP safe discovery + gear + CPU practice; optional cleanup XP, online features honest extras.
**Pass:** Codex can name design source, next milestone, and what doesn't yet exist.

## M1 — App and visual foundations (P0)
- [x] Scaffold React + Vite + TypeScript + Tailwind + React Router, lint/test scripts, and Vercel serverless `api/` folder.
- [x] Implement semantic palette/spacing, mobile bottom nav and responsive desktop nav using real Figma variables if provided.
- [x] Create real routes `/`, `/scan`, `/collection`, `/workshop`, `/battle/practice`, `/leaderboard`.
- [x] Create original red crab base art and transparent gear layer asset contract; don't import Pokémon/Prodigy assets.
**Pass:** routes/mobile nav render with a coherent pixel beach style; no fake interactive controls.

## M2 — Capture and safe consent (P0)
- [x] Camera-first capture, preview, retake, size/type validation, orientation correction and EXIF stripping; native device acceptance pending.
- [x] Show clear safety warning and ask separate consent before sending any photo to Gemini.
- [x] Implement safe manual category/subtype selection, including all 9 original canonical categories.
**Pass:** camera denial offers retry and local feature access; missing Gemini uses manual review after capture; unsafe objects are not rewarded.

Implementation note: M1–M7 core checks are backed by local automated tests; real-device testing is still pending. SVG provides the transparent equipment layers. M3 uses the explicit local adapter (`npm run dev:api`), not bare Vite. Polygon segmentation is intentionally omitted. M8/M9 are deferred.

## M3 — Gemini + subject focus (core integration)
- [x] Vercel serverless Gemini adapter; `npm run dev` does not serve `/api` unless a local proxy/emulator is configured. Test with `vercel dev` or explicitly configured equivalent; server-only and strict schema: label, category/subtype, `safety`, bbox, optional polygon.
- [ ] Validate bbox axes and polygons against normalized 0–1000 spec; portrait/landscape and malformed-response tests.
- [x] Implement manual draggable crop regardless of AI availability; segmented mask optional when accurate.
- [x] Never call cropping true transparent segmentation; clear manual/AI mode labels.
**Pass:** bottle on cluttered background yields a bottle-focused preview; missing credentials give honest manual path.

## M4 — Pixel discovery card + optional cleanup claim (P0)
- [x] Render cropped object as pixel art (Canvas nearest-neighbor), framed on a beach background.
- [x] Save a reviewed **safe discovery** card/gear with no disposal requirement. Hazardous/uncertain items block eligible gear/discovery; do not encourage handling.
- [x] Offer optional one-time safe-disposal self-report, now or later; only that awards cleanup XP.
- [x] Assign persisted cosmetic rarity from approved 60/27/10/3 distribution; fixed **cleanup-only** XP rules +10/+5; no XP on scan alone.
- [x] Give recognized safe items a **deterministic** gear blueprint from catalog, not AI-determined power.
**Pass:** safe scan without disposal → exactly 1 card + 1 gear candidate and **0 cleanup XP**. One cleanup confirmation → +10 or +15 XP exactly once. Unsafe scan → no gear/reward.

## M5 — ShoreDex + storage (P0)
- [x] IndexedDB stores pixel art, unique discovery cards, separately keyed cleanup events, cleanup XP, first-confirmed-cleanup category flags; no raw original photos.
- [x] Idempotent discovery save and optional cleanup claim on double taps and retry; reload keeps cards, cosmetic rarity and XP.
- [x] Show gear label, slot and art in collection; other safe litter can be card only.
**Pass:** cards survive reload, repeat scans create distinct collectible IDs, and optional cleanup of a repeated category does not earn an extra first-category bonus.

## M6 — Crab Workshop (P0)
- [x] Implement five slots: Head, Shell, Main Claw, Off Claw, Feet.
- [x] Gear catalog rules, wrong-slot rejection, ownership lookup, unique instance ID per slot, equip/swap/unequip.
- [x] Render original red crab + layered overlays aligned with anchor metadata and card photo motif (where possible).
- [x] Derive bounded HP/ATK/DEF/SPD from unique equipped blueprints; rarity cannot change stats.
- [x] Persist loadout and show before/after stat changes.
**Pass:** bag=head, magazine=shell, bottle=weapon, can=shield, cap=feet visibly equip; same ID cannot fill two slots.

## M7 — Practice Battle: **fully playable** (P0)
- [x] Pure `resolveTurn` reducer follows battle doc exactly.
- [x] Speed-first turn order and fixed HP/ATK/DEF/SPD; Pinch, Guard, Tidal Slam + cooldown.
- [x] CPU chooses valid moves and game reaches genuine win/lose; visible HP, combat log and replay.
- [x] Mobile combat layout matches Figma when available; visual damage/guard feedback has reduced-motion alternative.
- [x] No practice score as fake weekly cleanup XP or human leaderboard position.
**Pass:** user equips 1 item then finishes CPU fight; unit tests for damage, cooldown, guards and illegal actions pass.

## M8 — Real weekly leaderboard (core online target)
- [ ] Supabase guest identity, opt-in nickname, server-authoritative idempotent **self-reported cleanup** events (not mere scans), RLS and rate limits.
- [ ] Real weekly cleanup XP query with America/Chicago Monday boundary and cleanup count as tie-breaker.
- [ ] Clear `Live leaderboard unavailable` without credentials; no fake rankings.
**Pass:** two opted-in users actually submit and read separate server-backed rankings; tampered XP rejected.

## M9 — Online PvP challenge (stretch, cut if rushed)
- [ ] Two actual authenticated users, server-backed expiring invites, create/join/ready.
- [ ] Server-validated owned loadout snapshots, protected match state, atomic versioned turns.
- [ ] Idempotent move requests, no out-of-turn/unowned gear, genuine result visible to both players.
- [ ] Waiting/reconnect/forfeit/expiry states; no CPU opponent masquerading as player.
**Pass:** two separate browsers/accounts take turns to the same real winner; if not, hide PvP UI.

## M10 — QA, deploy and live demo
- [ ] Run typecheck, lint, unit tests, build and real phone smoke test; report actual outcomes.
- [ ] Check clean install, .env template, responsive views, keyboard/reduced-motion, image consent and safety.
- [ ] Test 3 complete scenarios in `DEMO_AND_TESTING.md` including battle workshop.
- [ ] Deploy HTTPS; add screenshots/media only after confirmed creation and licensing checks.
- [ ] Demo only what actually works; explicitly label manual Gemini fallback, CPU fights and unconfigured services.
**Pass:** judge sees end-to-end safe scan → discovery card → gear red crab → genuine Practice vs CPU; all public claims truthful.

## Resource triage

If the remaining time is short: **M1/M2/M4/M5/M6/M7 first**, with honest manual M3 fallback; then real M3 Gemini integration, then M8 leaderboard, then M9 PvP. Polish can be trimmed sooner than the essential interaction. Create no security-sensitive mock API presenting invented competitors.

## Native GPS transition — verified implementation status

- [x] Generate and sync Capacitor iOS/Android projects, development identifier, foreground permission descriptions and original branding placeholders.
- [x] Camera-only native adapter and browser live capture; duplicate launch protection, cancellation/retry, restored result routing and stream cleanup.
- [x] GPS validity/accuracy/smoothing and race-safe watch cleanup; no production simulated movement; actual MapLibre/OpenFreeMap integration with attribution.
- [x] Additive privacy-preference migration, remembered/revocable consent, native HTTPS endpoint configuration and explicit CORS allowlist.
- [x] Preserve local discovery/equipment/cleanup/CPU loop; pass 38 unit/API tests and 34 Chromium/WebKit browser checks.
- [x] Typecheck, lint, production build, native asset sync, permission syntax and secret-exclusion checks.
- [ ] Native compilation: full Xcode, Java and Android SDK installation required.
- [ ] Phone acceptance: camera, actual GPS accuracy, backgrounding, restored camera activity, native Back/status/splash and app upgrade saves.
- [ ] Configure/deploy native Gemini HTTPS backend and verify live phone requests.
- [ ] Production IDs, signing, privacy policy, developer accounts and store testing/submission.

## PWA-first release — verified status

- [x] Standalone manifest, aligned branding/theme and original regular/maskable/Apple icons.
- [x] Profile installation guide, manual iOS steps and truthful offline/privacy/storage limitations.
- [x] Production-only static caching with content versions and known-route offline shell.
- [x] User-triggered update, Later control, multi-tab compatibility and conservative old-cache cleanup.
- [x] Explicit API/private/query response exclusions; no runtime photo or third-party map caching.
- [x] Vercel static/API routing exclusions and declared MIME/cache headers validated in configuration tests.
- [x] Typecheck, lint, 40 unit/API/config tests, production build and 38 browser checks; final targeted PWA/offline rerun also passed.
- [ ] Verify actual Vercel HTTPS deployment, headers, deep links and consented Gemini requests after a deployment URL is supplied.
- [ ] Test installation, standalone safe areas, camera and offline relaunch on a physical iPhone.

Native builds/signing/store publication remain optional future work, not blockers for the PWA.


## Beach battle arena — verified locally

- [x] Preserve matchup preview; explicit Start Battle snapshots equipment and trainer.
- [x] Original beach arena, trainer/crab staging, HP, real move messages and accessible mobile controls.
- [x] Preserve engine and saves; background pause, exit/replay cleanup and reduced motion.
- [x] Typecheck, lint, 43 unit/API/config tests, five Node API checks, build and 52 Chromium/WebKit checks.
- [ ] Deployed PWA and physical-phone acceptance for the new arena.
