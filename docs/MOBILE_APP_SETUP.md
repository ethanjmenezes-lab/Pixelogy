> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

# Pixelogy native setup

Pixelogy keeps React/Vite and packages `dist` with Capacitor 8. Development app ID: `com.pixelogy.dev`. Replace this identifier consistently in Capacitor, Xcode and Gradle before registering a production application. The current projects are unsigned development projects.

## Commands

- `npm ci`
- `npm run dev` — browser UI; HTTPS or localhost is required for camera/location.
- `npm run dev:api` — browser UI plus the existing server-side Gemini handler.
- `npm run native:sync` — build and copy bundled assets/plugins into both projects.
- `npm run native:ios` — open the generated Xcode project (Swift Package Manager).
- `npm run native:android` — open the Android Studio project.
- `npm run typecheck && npm run lint && npm test && npm run build`
- `npm run test:e2e` — Chromium and WebKit, including production offline shell.

Install full Xcode 26+ and select its developer directory for iOS. Install Android Studio, its compatible JDK (21), and Android SDK 36 for Android. Generated settings use iOS 15+ and Android API 24+. Resolve Swift packages in Xcode; run Gradle sync in Android Studio. Then select a simulator/emulator or connected phone. Real rear-camera and GPS accuracy tests require phones.

The current machine has Xcode command-line tools only, no usable Java runtime and no Android SDK. Native projects can be generated and synchronized here, but compilation/signing/device validation remains pending.

## Backend and maps

Set `VITE_API_BASE_URL=https://your-deployed-backend.example` before building native assets. It is a public backend address, never a secret. No production address has been supplied, so native Gemini falls back to manual review until configured. Browser builds default to same-origin `/api/analyze`.

Deploy the existing `api/analyze.ts` to Vercel with server-only `GEMINI_API_KEY` and optional `GEMINI_MODEL`. Set server `ALLOWED_ORIGINS=capacitor://localhost,https://localhost` for the configured native origins. Exact origin responses support preflight; CORS does not authenticate requests or prevent server-side abuse. Add backend rate limits and operational monitoring before public distribution. No deployment was performed as part of this conversion.

Maps use MapLibre and `https://tiles.openfreemap.org/styles/liberty`; override with `VITE_MAP_STYLE_URL`. Attribution must remain visible. Tile requests reveal the viewed region to the provider. No offline tile download is implemented. Network failures show a map retry state without fabricated terrain.

## Local saves

IndexedDB version 3 adds privacy preferences without changing existing records. Browser and native WebViews have distinct storage origins, so installing the app does not import browser saves. Native app updates must preserve the app ID/origin. Android cloud backup is disabled. Uninstalling can erase saves; cloud synchronization is not implemented.

The browser service worker caches only the app shell and bundled assets, excluding API/photos/map requests. Capacitor uses bundled assets and does not register that service worker.

## Platform details

Camera uses the external/native camera, rear preference, no gallery save. Android camera permissions are not declared unnecessarily: the plugin delegates to a camera activity. iOS usage strings include the plugin-required photo-library descriptions, but production code never selects the library or writes to it.

Geolocation requests foreground use only. The iOS plugin requires both location usage-description keys even though Pixelogy never requests Always access or enables background modes. Android declares fine/coarse location, no background location. Test approximate permission separately.

`pixelogy://scan` opens the scanner. Browser `/scan` remains supported. The custom scheme is a development scheme, not verified universal/app links. Native Android Back closes dialogs, returns features to the world, then minimizes from the root.
