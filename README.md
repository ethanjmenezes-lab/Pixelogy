# Pixelogy

A mobile-first Progressive Web App with an original tropical pixel-art map of real geography, original human explorer and equipped red crab. Install the React/Vite app from your browser; no App Store download or native SDK is required. Capacitor projects remain optional future work.

Tap Scan to open the browser live camera. After explicit remembered consent, resized photos can be analyzed by server-side Gemini. A successful safe Gemini result is required; review the crop before saving. Manual identification and safety overrides are unavailable. Save safe pixel collectibles, equip five crab slots, play deterministic Practice vs CPU, and optionally self-report cleanup for XP. Level is cosmetic; movement earns nothing.

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
- Optional native Gemini requires a configured deployed HTTPS `VITE_API_BASE_URL`. None has been supplied. Browser server integration remains available with server-only `GEMINI_API_KEY`; no secret is embedded in client builds.
- IndexedDB v3 preserves existing saves and adds revocable analysis consent. Browser saves do not automatically transfer into a native install.
- Existing inventory, equipment and CPU battles work offline; new discoveries and new map tiles require connectivity. Browser PWA caching excludes API/photos and third-party map requests. Content-versioned updates wait for the player to choose Reload to update.
- Supabase authentication/cloud saves, public rankings and PvP are not implemented. No precise locations or trails are persisted by the app.
- PWA release does not require Xcode, Java, native signing or store accounts. No deployment URL has been provided; Vercel-hosted acceptance and physical iPhone installation/camera checks remain pending.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests use explicit synthetic camera/location fixtures; they do not establish native hardware behavior. See revision notes for actual latest results. No connected Figma file was used; original code/art follows the written design specification.

Latest verified results: **43 unit/API/configuration tests and 44 Chromium/WebKit browser checks passed**, with TypeScript, lint, five plain-Node API smoke assertions and production build. Live OpenFreeMap tiles loaded in production preview at a synthetic test coordinate with no page errors. Real Vercel deployment and physical iPhone installation/camera acceptance remain pending. No deployment URL was supplied.
