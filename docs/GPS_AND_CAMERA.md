> Current progression (2026-10-25): eligible foreground GPS walking awards **both Player XP and Crab XP**. Player Level unlocks cosmetics; Crab Level unlocks main attacks; cleanup XP remains separate. See [progression rules and migration](PROGRESSION.md). This supersedes older movement/no-XP and cleanup-derived explorer-level statements.

# GPS and camera architecture

## GPS

`src/mobile/location.ts` defines LocationFix, LocationProvider, validity checks, accuracy-aware smoothing, geographic companion following and race-safe watch lifecycle. `useDeviceLocation` owns foreground/visibility state. The Capacitor adapter gets an initial fix and starts a high-accuracy watch. Production has no mocked coordinates, joystick or keyboard locomotion.

A location rationale precedes the OS request. Invalid/out-of-range fixes, fixes older than 30 seconds, future timestamps and accuracy above 50 metres do not move the avatar. Jitter within a fraction of the reported accuracy is suppressed; accepted movement is interpolated according to elapsed time and accuracy. Missing updates show an unavailable state. GPS remains an estimate, not verified travel or disposal.

Location watches stop while feature overlays or the menu cover the world and while backgrounded. Late watch creation is immediately cleared after cleanup; late callbacks are ignored. Resuming requests a fresh fix. Positions and the last 100 accepted trail samples stay in memory only. The crab trails by four metres on that accepted path. No movement reward exists.

MapLibre projects accepted coordinates. Dragging detaches the camera; recenter restores follow. The existing human appearance and equipment layers are reused. Maps are actual OpenStreetMap-derived geography through OpenFreeMap, with a simplified coastal palette. No fictional streets or litter markers are shown. If WebGL/tiles fail, retry and local feature navigation remain accessible.

## Camera

Each scanner entry mounts one capture controller. Capacitor calls Camera.getPhoto with CameraSource.Camera, CameraDirection.Rear, URI results and saveToGallery false. A shared pending promise prevents duplicate launches under React Strict Mode. Cancellation stays in a retry state, never loops into another launch. Android restored camera activity results feed the same normalization pipeline.

Browser capture uses getUserMedia with environment-facing preference and a live video shutter. Tracks stop on capture, unmount, visibility loss and native inactivity. Retake explicitly creates a new capture session. No photo-file chooser is the primary interface.

Captures pass through existing bounded JPEG normalization (Canvas redraw strips EXIF), editable crop, recognition validation, safety review and pixel-art generation. The app does not persist original photos; native camera temporary files may exist in OS cache. Only processed PNG artwork and collectible metadata are persisted.

Before the first capture, “Enable automatic scanning” explains and requests consent for automatic Google Gemini transmission. Opt-in is stored in IndexedDB; all subsequent captures analyze automatically without a separate analysis button. The live camera enables capture only after its first decoded video frame. Profile can revoke future uploads. Offline, missing endpoint and malformed/server errors block new saves and offer retry/retake. Categories, subtypes and safety are read-only Gemini results. Hazardous/uncertain results cannot be overridden. Revoking consent or retaking aborts and invalidates pending analysis. Consent is not proof of disposal; cleanup awards remain separate and idempotent.

## Test boundaries

Automated fixtures replace browser camera/location APIs in test files only. They prove UI/data-flow and lifecycle behavior, not actual satellite accuracy or native camera behavior. Physical tests must cover indoors/outdoors, denied/approximate location, permission revocation, camera cancellation, Android process restoration, interruptions, app switching and restart persistence.
