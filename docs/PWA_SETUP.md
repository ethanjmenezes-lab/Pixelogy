# Pixelogy PWA release

The primary release is the existing React/Vite web application, installed from a browser. No App Store subscription, native signing or native SDK is required. Capacitor projects remain optional future distribution targets; they are not prerequisites for the PWA.

## Develop and test

```sh
npm ci
npm run dev
# Browser UI plus server-side Gemini:
npm run dev:api
# Production output and local preview:
npm run build
npm run preview
# Checks:
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Service-worker registration runs only in a production browser build. Test offline behavior at the production preview, not the Vite development server. Camera and geolocation require HTTPS, except browsers allow localhost for local development. Opening a plain LAN HTTP address on a phone does not provide an equivalent secure context.

## Deploy to Vercel

Import this existing repository into Vercel. The checked-in configuration builds with `npm run build`, serves `dist`, preserves API/static paths, and rewrites application routes to the SPA. Vercel supplies HTTPS for its deployment domains. Do not rewrite `sw.js`, manifest, icons or `/api/analyze` to HTML.

Configure `GEMINI_API_KEY` and optional `GEMINI_MODEL` as server-side Vercel environment variables. Leave `VITE_API_BASE_URL` unset for the PWA so recognition uses same-origin `/api/analyze`. Never put a Gemini secret in a `VITE_*` variable. Maps use the existing OpenFreeMap style; keep provider attribution visible.

`sw.js` has no-store/revalidation headers. The manifest uses `application/manifest+json`; hashed bundled assets have immutable cache headers. Source configuration tests cannot establish real Vercel edge behavior. Once a deployment URL exists, verify HTTPS, MIME/cache headers, deep-link reloads, camera/location prompts and a consented Gemini request on that URL.

No deployment URL has been supplied or published by this task. Hosted acceptance remains pending.

## Install on iPhone

1. Open the HTTPS deployment in **Safari**.
2. Tap **Share** (square with upward arrow); depending on Safari's layout, open the page menu first.
3. Scroll to **Add to Home Screen**.
4. Enable **Open as Web App**, if shown.
5. Tap **Add**. Launch Pixelogy using its Home Screen icon.

Installation is manual on iPhone; websites cannot trigger the Safari Share sheet installation flow automatically. Older iOS versions may omit the toggle; the manifest requests standalone display. These instructions also appear in Profile/Settings, with a link to Apple's guide: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

Android/desktop users can use their browser's Install app or Add to Home screen command when offered. Install icons include regular 192/512px PNGs, a dedicated maskable 512px PNG and a 180px Apple touch icon. All use original Pixelogy crab artwork.

## Offline and privacy boundaries

The worker precaches only the build's explicit static list: HTML shell, manifest, icons, JavaScript (including the map worker), CSS and bundled fonts. No API response, uploaded/captured photo, profile response or third-party map request is placed in Cache Storage. Query-bearing assets bypass the cache. Network navigation falls back to the shell only for known application routes.

IndexedDB remains intentional local game storage for collectibles, generated artwork, loadouts, cleanup claims, profile and consent. It is separate from service-worker caching. Existing saves are preserved. Clearing website data, removing the installed app, storage eviction or switching origins can affect saves; no cloud backup is claimed. Browser/native/install contexts may have distinct storage behavior, so verify continuity on the target iPhone.

After an initial successful online load, local inventory, equipment and CPU battles work offline. Captured photos can be reviewed manually where camera access remains available. Gemini and uncached geographic map data require connectivity. The app never invents locations when GPS or maps are unavailable.

## Updates

Cache names hash the contents of all static shell assets, including manifest and icon bytes. A new worker waits by default. An update-ready notice tells the player to finish their scan/battle and choose **Reload to update**; no automatic mid-game reload occurs. Choose Later to dismiss the notice for the current session. If another tab already activated the update, Reload to update still reloads only the tab where the user presses it.

Older shell caches remain available while older tabs may need their bundled chunks. Open tabs report their entry asset to the worker; old shell caches are removed only once all live clients report assets from the current build. Unknown/older clients conservatively defer cleanup. No runtime response is added to these caches.

## Physical-device acceptance still required

- Safari and Home Screen launch on an actual iPhone; standalone appearance, original icon, safe areas and portrait/landscape behavior.
- Camera prompts, blocked/revoked access, retake, backgrounding and stream shutdown.
- Foreground GPS, denied/approximate access, pan/recenter and real map loading.
- Existing save continuity, offline relaunch, update notice and explicit reload across tabs.
- Hosted Gemini consent, success/failure, HTTPS and production headers.

Automated WebKit is useful browser coverage, not proof of iOS installation or physical camera behavior.
