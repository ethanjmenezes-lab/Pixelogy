# Baby-crab opening and mobile Story UI — 2026-10-24

The user explicitly superseded the prior opening with `BABY_CRAB_OPENING.md`. Runtime content is now `locked-dialogue-2.0-baby-crab`; all seven scenes use the supplied lines and punctuation exactly. The old root source files remain historical inputs. Regions, encounters, ending and battle UI text are unchanged and tested against that original source.

## Changes

- `/story` is a compact landing menu: title, “Investigate Blacktide. Save the coast.”, original key art, Start Story and Watch Opening. Campaign maps/progress are separate from the landing. Returning players retain their campaign; guests sign in through the existing route.
- Seven new animated scenes: daylight beach/billboard; suspicious evening unloading; player investigation; rustling rubbish and baby-crab discovery; kneeling/bond/treasure prop; worker/flashlight confrontation; claw readiness and exact challenge lines into the first battle.
- New original Canvas/SVG renderer animates waves, small shore crabs, vehicle/unloading, rubbish, player movement, crab entrance/bob/claws, worker entrance, camera pans/zooms and transitions. Reduced motion retains the full narrative. The trash remains a visual prop, never inventory.
- First-time Start Story plays the opening and starts one authoritative first-stage battle. Watch Opening is replay-only. Skip works, watched state uses the existing Supabase RPC, and refresh does not auto-start a second match. A delayed watch-save cannot reopen the cinematic over the first battle.
- Scoped min-width/width constraints, normal whitespace, wrapping, responsive heading sizes, flexible button/move groups and readable captions prevent intrinsic-width overflow. Header text wraps. Next/Skip remain touch-sized. Paused transitions do not leave the art dimmed.

## Changed implementation files

- `src/content/story-script.json`
- `src/story/BabyOpeningStage.tsx`
- `src/story/ShotStage.tsx`
- `src/story/Story.tsx`
- `src/story/StoryCutscenePlayer.tsx`
- `src/story/cinematic.css`
- `tests/story-content.test.ts`, its narrative snapshots, and `tests/e2e/story.spec.ts`
- Story reference/status documents and revision notes.

No auth, GPS, scan, ShoreDex, battle resolver, API, database schema or reward changes were required. Existing saved stage IDs, progress and cinematic flags remain valid.

## Verification

- Typecheck, ESLint, 83 unit tests, nine plain-Node API checks and production build passed. Existing large-bundle warning remains.
- Full Chromium/WebKit suite: **114/114 passed**. After adding the final slow-watch guard, both targeted opening tests passed again with delayed watch persistence and battle-refresh assertions.
- Exact dialogue is exercised line-by-line at **375×812, 390×844 and 430×932** in both browsers. Tests check caption/container horizontal overflow, actor order, replay, saved flags, no extra rewards and one first-match start. Existing story/arena tests include landscape, reduced motion, keyboard focus, all five Shellshore battles, later bosses, gates and persistent reload.
- Inspected 375px landing/confrontation screenshots. Full gameplay, auth recovery, camera/GPS, offline loading and PWA cache regressions passed with deterministic service fixtures.

## Remaining acceptance

Not deployed in this task. Physical iPhone/Android performance, actual device screenshots and live Supabase Story interaction after deployment remain unverified. Audio remains the existing basic opt-in synthesized motif; no new voice performance or full cinematic sound mix is claimed.
