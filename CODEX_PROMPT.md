# Codex task — Fix password reset and implement the locked Blacktide story

You are editing the existing Pixelogy repository. Do not recreate the app. Start with the broken password reset, and then replace the weak Story Mode cutscenes and dialogue with the canonical Blacktide script included with this task.

Read `AGENTS.md`, `PROJECT_PLAN.md`, and the actual authentication, router, Story Mode and battle engine code before modifying anything. Preserve the live GPS overworld, camera scanner, Supabase auth and collection data, ShoreDex, Workshop, three-move combat system, and existing user progress.

## Task A — Fix the broken password-reset link (do this FIRST)

CURRENT BUG: The password-reset email link does not take the user to a functional Pixelogy new-password form. This is a production-blocking account-recovery defect.

Canonical production origin: `https://pixelogy-three.vercel.app` (verify against actual Vercel project settings, and favor a stable production domain over a rotating Vercel preview URL).

**Correct experience:** Profile/Settings → Forgot/Reset Password → request email → open most recent email (even on another device/browser) → verified recovery link → a real `Set New Password` form → submit new/confirm password → success → login with new password. The user must not be redirected to the overworld or login page before setting their new password.

Implementation requirements:

1. Inspect current `resetPasswordForEmail()` call, email template, Supabase URL Configuration, React auth provider, redirect guards, routes, and `vercel.json` SPA rewrite. Diagnose the actual issue rather than assuming it.
2. Add or repair a dedicated public recovery callback route (`/auth/confirm` or the repository's equivalent) and a ` /reset-password` route (without the leading space). A recovery callback must validate the recovery token, establish a session, and only then open the change-password form. Ensure route guards allow both routes to run before redirecting unauthenticated users.
3. **Preferred robust cross-device option:** use a token-hash recovery email link, such as `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a>`, and handle `verifyOtp({ token_hash, type: 'recovery' })` in the callback, then navigate to `/reset-password`. Adapt to the current client-side auth architecture. If the repo already uses a different valid recovery approach, ensure it also works across browsers/devices; avoid mixing conflicting implicit and PKCE callback flows.
4. If using the default Supabase `{{ .ConfirmationURL }}` flow instead, ensure that `redirectTo` points to an allowed HTTPS recovery route, the SDK recovers the session, and the app detects `PASSWORD_RECOVERY`. Do not simply send the user back to `/`.
5. Set and verify **Supabase Authentication → URL Configuration**: stable production Site URL `https://pixelogy-three.vercel.app`; allow-listed callback and reset routes, localhost development routes, and narrowly scoped preview destinations if truly needed. Verify that the email template points to a confirmation/recovery link rather than directly to an unverified `{{ .RedirectTo }}` URL.
6. Implement new-password and confirm-password fields, validation, submit/error/loading/success states, `supabase.auth.updateUser({ password })`, and accessible UI. Handle expired, consumed and invalid one-time tokens gracefully with **Request Another Link**.
7. Avoid password recovery links or token_hash logging; don't place auth secrets in frontend code or commits. Don't disable password/email security in order to pass tests.
8. Add tests for: email link destination, callback session establishment, valid reset, invalid/expired link, auth route guard, browser refresh, deployment SPA rewrite, and clicking the reset email in a *different browser/device* than the requesting browser. Test only the newest recovery email; older one-time links may be invalidated.
9. If a Supabase dashboard setting or email template change cannot be applied from the repo, enumerate the exact manual changes and clearly mark live recovery as **not verified** until tested end-to-end.
10. Preserve account recovery outside of installed PWAs; HTTPS links opened in mobile Safari/Chrome must still work.

See `docs/story/PASSWORD_RESET_GUIDE.md` for the expected configuration and testing procedure.

## Task B — Replace the Story Mode writing and cinematics with THIS exact script

The attached source-of-truth is `src/content/story-script.json`. Its human-readable counterpart is `docs/story/STORY_SCRIPT.md`.

**NON-NEGOTIABLE: The dialogue and on-screen overlays in `story-script.json` are LOCKED.** Use every `dialogue_exact[].text` and `overlay_exact` **verbatim**. Do not paraphrase, improve, embellish, or replace them. Do not author any additional narrative dialogue. Do not call Gemini to generate story text. Do not change punctuation or names. If a scene is not implemented yet, report it as not implemented instead of fabricating text.

Story: Blacktide Industries, an evil waste-management megacorporation, dumps trash on beaches and profits from contracts to clean it up. The player and their red crab expose the scheme across five regions: Shellshore Beach, Rustport Harbor, Neon Boardwalk, Whispering Mangroves, and Blacktide Headquarters. Evidence recovered from bosses advances the story and the coastal restoration occurs through real people taking action, not magic.

### Opening cinematic quality requirements

The opening contains **eight explicitly timed shots** with action and camera directions in `story-script.json`. It should feel like a short animated game scene (roughly 34 seconds), NOT a slideshow of flat colored backgrounds and paragraphs.

- Actual animated pixel-art coastline and character actors; dramatic day-to-night transition, corporate advertisement, nighttime dumping, spotlight confrontation, crab entrance, opposing security crab, title and transition into Region 1.
- Support camera pans, zooms, layered parallax, wave and light effects; use the repo's existing pixel-art asset style, plus original scene-specific assets. Preserve crisp nearest-neighbor scaling.
- Dialogue must appear as compact, readable, one-speaker-at-a-time caption/speech bubble **only when its corresponding visual action happens**. Do not display all lines at once. Use a comfortable read duration or tap-to-advance; never auto-close a line too quickly.
- Use light SFX and music only when compatible with user gesture/autoplay restrictions; include mute and skip controls. Respect `prefers-reduced-motion` without dropping story information.
- The opening cap held by the crab is a **cutscene prop**, not a fabricated discovered inventory item. For post-intro scenes render the crab's currently equipped player gear, if available.
- The first completed view should end on the Region 1 path with Stage 1 ready to select. Intro can be replayed later, but isn't automatically replayed after first watch.

### Region and battle content

1. Use the five region `intro_scene` and `outro_scene` arrays as defined; each has its own action/camera direction and exact lines.
2. Implement the **25 distinct trainer stages** in `encounters`, keeping their ID, NPC name, stage name, pre-battle and post-win dialogue exact. The fifth stage in every region is the boss. Four defeated trainers unlock the region boss; boss victory unlocks next region.
3. Preserve the existing battle engine and three attacks: level-unlocked Slot 1 main attack; permanent Slot 2 Defend; equipped-trash Slot 3 special attack. Add story NPC trainers opposite player trainer during battle.
4. Give each region a visibly different battlefield and map setting. For boss victory, animate evidence retrieval and a gradual transition from corporate occupation to the start of cleanup/restoration. Don't mark genuine beach cleanup verified because the player won a fictional battle.
5. Keep boss evidence records intact and persist completed stages, stars, region unlocking, cutscene watch flags and first-clear rewards in the existing Supabase architecture where feasible. Do not allow duplicate first-clear rewards; maintain reasonable offline fallback labels if required.
6. Final win plays `cinematic.ending`. Follow the exact six shots and dialogue. Provide optional replay. Don't rewrite the ending.
7. Keep native GPS map separate from fictional story region maps. The user does not need to physically travel to complete the fantasy adventure.

### Presentation overhaul

- Use short game labels as defined in `battle_ui_text_exact` and no huge explanation paragraphs.
- Pixel-art dialog boxes, trainer entrance animation, dialogue skip/continue, boss-specific reaction, coherent game typography and restrained visual effects.
- No generic "And so our hero..." narration, no repeated cardboard story cards, no copy-pasted identical boss speeches.
- Mobile-first portrait viewport; test at 375x812, 390x844 and 430x932, including touch targets, safe areas and text-wrap.

### Code architecture

- Treat `src/content/story-script.json` as immutable content and type it with TypeScript.
- Build a reusable `StoryCutscenePlayer` that renders shot action, timing, overlays, dialogue, audio, and transitions using shot IDs; don't build five separate hardcoded story scripts inside UI components.
- Build `StoryRegionMap`, `StoryStagePreview`, and `StoryProgress` on top of existing RPG and battle systems.
- Put original art assets in version control with clear licensing. Missing art or animation must be reported; don't claim a shot is animated if it's just a text slide.
- Write an automated content-integrity test that loads `story-script.json`, snapshots all narrative strings, and asserts that the runtime content matches exactly. Assert 5 regions, 25 encounters, 8 opening shots, 6 ending shots, unique IDs and 5 bosses. The script can be re-versioned only by explicit user approval.

## Priority and delivery

**Do not spend hours on cinematics while password reset remains broken.** Ship and verify recovery first, then implement the reusable cutscene player and the full Region 1 flow; populate all other exact-script data and expand only after Region 1 is genuinely playable.

Run typecheck, lint, unit tests, relevant browser E2E tests and production build. Where real dashboard config, deployment or mail access is missing, clearly state what was and wasn't verified.

Final report must cover:
- Password reset root cause and the exact files/config changes.
- Live recovery test result including a separate-device browser test.
- Which opening shots are actually animated.
- Which story regions, unique battles and boss/outro cutscenes are implemented.
- Exact narrative string integrity test result.
- Supabase story persistence and remaining blockers.
- Tests and production build results.

**Begin implementing Task A now.**
