> Current audit (2026-10-24): auth confirmation uses the canonical production origin; email requests have a persistent cooldown; Scan opens the camera before Gemini consent without uploading until opt-in; online account loading tolerates offline-cache failure. All 120 browser tests passed. Live Supabase RLS/reward tests and production HTTPS/API rejection checks passed. **Custom SMTP, real email/Gemini/device acceptance and deployment of these audit changes remain pending.** See [complete audit and limits](docs/audit/RELEASE_AUDIT.md) and [SMTP setup](docs/audit/SMTP_SETUP.md). This supersedes historical status notes below.

> Baby-crab opening update (2026-10-24): the user-authorized seven-scene opening supersedes the old eight-shot opening. Compact landing, responsive captions, exact revised dialogue and first-battle transition are implemented. Full browser suite 114/114 passed; final delayed-watch tests 2/2 passed. See [current scope and verification](docs/story/BABY_CRAB_STATUS.md). Earlier opening/version statements below are historical.

> Locked-script update (2026-10-24): `src/content/story-script.json` is immutable canonical content. Recovery callback/form repaired; live Supabase allowlist and additive cinematic constraint updated. Eight opening shots, all five regions/25 battles and six-shot ending use the new reusable player. 83 unit tests and build passed; all 112 browser cases passed across the full run plus eight corrected arrival-fixture reruns. Frontend deployment, real emailed recovery/device testing and full sound design remain pending. See [implementation and verification](docs/STORY_MODE.md).

> Authentication repair (2026-10-24): dedicated auth routes and scan return are implemented; Supabase schema/catalog are applied and rollback RLS tests passed. Vercel configuration, matching receipt-signing secret, and production deployment 33b72c2 are complete. Hosted signup UI and unauthenticated API rejection passed; real email/camera/Gemini acceptance remains pending. See [release status](docs/AUTH_RELEASE.md). This status supersedes earlier unapplied-schema notes below.

> Current ShoreDex change: predefined 200-species catalog and authenticated Supabase account saves replace photo pixelization for new discoveries. See [cloud architecture and pending setup](docs/SHOREDEX_CLOUD.md). The migrations are applied; older local-only/crop descriptions below are historical. Existing local saves are preserved.

# Pixelogy

A mobile-first Progressive Web App with an original tropical pixel-art map of real geography, original human explorer and equipped red crab. Install the React/Vite app from your browser; no App Store download or native SDK is required. Capacitor projects remain optional future work.

Sign in to your Pixelogy account, then tap Scan to open the browser camera. Your first photo stays on-device until you enable automatic scanning to consent to sending resized photos to Gemini. Once enabled, captures are analyzed automatically. A successful safe Gemini result is required; review the matched predefined catalog sprite before saving. Manual identification and safety overrides are unavailable. Save safe pixel collectibles, equip five crab slots, play deterministic Practice vs CPU, and optionally self-report cleanup for XP. Explorer level remains cosmetic; crab battle level unlocks main attacks. Movement earns nothing.

See [the three-slot attack rules](docs/ATTACK_SYSTEM.md) for unlocks, balance values, status windows and persistence.

## Beach battle

Open Battle from the crab menu to preview the matchup and current gear, then tap **Start Battle**. The beach arena shows your customized trainer, equipped crab, CPU opponent, HP and three moves. Legacy local battles work offline. Signed-in battles resolve on the server and award separate battle XP (40 win / 15 loss / 0 exit), never cleanup XP. Offline account practice grants no XP. Workshop → Moves selects a level-unlocked main attack and a special from currently equipped gear; Defend always occupies the middle slot. Exit ends the practice; reload returns to the preview while preserving local inventory and gear.

## Run

```sh
npm ci
npm run dev
# Or local server-side Gemini adapter:
npm run dev:api
```

## Install on iPhone

Open the HTTPS website in **Safari → Share → Add to Home Screen → enable Open as Web App → Add**. Installation is manual on iPhone; the full guide is also in Profile/Settings.

See [PWA setup and Vercel deployment](docs/PWA_SETUP.md) and [pixel-world architecture](docs/PIXEL_WORLD.md). Native project instructions remain in [optional mobile setup](docs/MOBILE_APP_SETUP.md).

## Integration status

- PWA manifest, original install icons, standalone presentation and iPhone installation instructions are implemented. Optional Capacitor projects remain in the repository.
- Real device coordinates only in production. OpenFreeMap/MapLibre geographic data requires network access. No joystick, fake location or fictional coast fallback.
- Optional native Gemini requires a configured deployed HTTPS `VITE_API_BASE_URL`. None has been supplied. Browser server integration requires server-only `GEMINI_API_KEY`, `SCAN_SIGNING_SECRET` and the Supabase setup described in [cloud architecture](docs/SHOREDEX_CLOUD.md); no secret is embedded in client builds.
- IndexedDB v4 preserves existing saves and revocable analysis consent, adding crab move selections and idempotent battle rewards. Browser saves do not automatically transfer into a native install.
- Existing inventory, equipment and CPU battles work offline; new discoveries and new map tiles require connectivity. Browser PWA caching excludes API/photos and third-party map requests. Content-versioned updates wait for the player to choose Reload to update.
- Supabase account saves, versioned schema/seed and RLS are applied. Live rollback tests verify account isolation and signed reward handling; actual authenticated camera/Gemini acceptance remains pending. Public rankings and PvP remain unavailable. No precise locations or trails are persisted.
- PWA release does not require Xcode, Java, native signing or store accounts. The canonical deployment is https://pixelogy-three.vercel.app. HTTPS routes and API rejection checks passed; this audit’s commits have not been deployed, and physical iPhone installation/camera checks remain pending.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests use explicit synthetic camera/location fixtures; they do not establish native hardware behavior. See revision notes for actual latest results. No connected Figma file was used; original code/art follows the written design specification.

Current catalog: **200 entries, 48 finished sprites (including 8 canonical Legendaries), 152 explicitly marked draft sprites**. Tests cover all canonical names and representative aliases, blocked/unknown recognition, server-derived battles, account UI, duplicate quantities and legacy gameplay. See [cloud architecture and setup](docs/SHOREDEX_CLOUD.md) and [revision notes](docs/REVISION_NOTES.md) for verification and the outstanding cloud activation requirements.

Coastal RPG UI and battle presentation: [implementation notes](docs/RPG_POLISH.md).
