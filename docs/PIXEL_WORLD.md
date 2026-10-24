# Tropical pixel world and AI-only discovery

Pixelogy uses actual foreground location with OpenFreeMap's OpenMapTiles-compatible vector source. The local MapLibre style in `src/world/pixelStyle.ts` draws roads, bridges, rail, landcover, parks, waterways and building footprints. It does not fetch Liberty, Google raster imagery or fictional gameplay terrain. `VITE_MAP_STYLE_URL` is retired.

Terrain renders at one backing pixel per three CSS pixels with nearest-neighbor display. Original repeating RGBA tiles are generated in code and supplied through MapLibre 6's missing-image resolver. The flat north-up camera starts at zoom 17 and allows zoom 15–19. Full-resolution DOM street labels, controls and original SVG sprites stay legible above the terrain. The crab follows accepted location history with a small visual side offset so it does not overlap the player at rest. The offset is presentation, not a separate measured location.

The palette is inspired by the supplied tropical screenshot: turquoise, mint, orange, cream and purple. Logos and third-party characters are not reproduced. The game's existing red crab, gear layers and avatar customization remain original. Vector data availability controls how much nearby detail appears; missing map features are not invented. This is a stylized game view, not turn-by-turn navigation.

Location watches stop while covered/backgrounded. Inaccurate (>50 m), stale or invalid fixes do not move the player. Location history is memory-only and does not earn rewards. Attribution stays visible and map requests disclose the viewed region to the provider. No map/photo/API network responses enter the service-worker cache. Offline map availability is not promised.

## Discovery behavior

Capture → explicit remembered consent → online Gemini analysis → safe result → crop/review → save. Categories, subtypes and safety results cannot be overridden. The crop can be adjusted, but the player must still confirm the object is safe. Unsafe or uncertain results cannot create a card. Users can reject a result by retaking.

Offline, unconfigured backend, provider failure or invalid JSON/schema responses offer retry/retake with no save action. New captures are not persisted or queued. Revocation, retake and navigation cancel/invalidate obsolete requests; original photos remain memory-only. Previously saved manual discoveries remain valid inventory: no migration or reset occurs. Cleanup remains optional and independent of discovery/battle rewards.

## Local verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then `npm run test:e2e`. Build includes the plain-Node server import smoke check. Browser tests own port 5175 and an isolated Vite dependency cache; they do not reuse the developer server on 5173. Production PWA tests use preview on 4173.

Tests use authored vector-tile fixtures and injected browser camera/GPS APIs, never production fake locations. The new style is also validated against MapLibre's official specification. Physical iPhone camera/GPS behavior, real walking performance and deployed consented Gemini success remain separate acceptance checks.
