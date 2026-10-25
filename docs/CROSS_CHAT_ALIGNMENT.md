> Story Mode update (2026-10-24): **The Blacktide Conspiracy** is canonical. All five regions and 25 battles, evidence, animated opening/boss/restoration scenes and final exposure are implemented. Existing Shellshore progress is preserved. Supabase expansion applied; 104 browser tests passed. Frontend/API redeployment and physical-device acceptance remain pending. See [scope and verification](STORY_MODE.md).

> Current release update: AI-only identification is required for new discoveries; manual identification and safety/category overrides are removed. Online analysis must succeed before saving. Real geography uses the authored tropical pixel-art MapLibre style; older manual-fallback and Liberty-style descriptions below are historical. Existing saves remain intact.

> Primary release: mobile-first PWA on Vercel HTTPS. Follow [PWA setup](PWA_SETUP.md). Native projects and store submission are optional future work, not release prerequisites. Keep browser camera/GPS, existing local saves and gameplay. Do not cache private/API/photo responses.

> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](MOBILE_APP_SETUP.md) and GPS_AND_CAMERA.md for the current contract. Native physical-device acceptance remains pending SDK/device access.

# Cross-chat alignment — October 24, 2026

This page reconciles the **separate Howdy Hack planning conversation** with the earlier v3 planning ZIP. It summarizes design decisions, not a transcript. Where details were assistant recommendations rather than explicit user requirements, mark them as *working defaults* and keep them revisable.

## Confirmed user vision (preserved)

- Pixelogy is a beach-inspired, mobile-first camera game: scan litter, identify the object with AI, pixelize the **object**, save recognizable ShoreDex collectibles and compete on a real leaderboard.
- Build a customizable **original red crab** from scanned trash: plastic-bag helmet, magazine shell armor, bottle-shaped weapon, bottle-cap boots and intuitive slots; use it in Pokémon/Prodigy-*inspired* turn-based fights without copying their licensed assets.
- Incorporate **Figma** for UI design and Codex implementation handoff. Prioritize a functioning game; local CPU practice precedes complex genuine online PvP.

## Reconciled working defaults (from other chat)

| Topic | Other conversation | v3 package | **v4 resolution** |
|---|---|---|---|
| Frontend | React + Vite + TS + Tailwind; optional shadcn/ui | Next.js App Router | **React + Vite + TypeScript + Tailwind + React Router**; use Vercel serverless `api/` for secrets |
| Photo meaning | Image is discovery, **not proof** of actual pickup | Disposal required for card, gear and XP | Safe **discovery grants card + gear immediately**; optional self-reported safe disposal grants **cleanup XP only** |
| AI and data | Gemini image classification; Supabase for accounts/leaderboard; Vercel deployment | Same providers, Next server route | Retain providers; Gemini only through `api/analyze`; Supabase public keys in client, privileged keys server-only |
| Design workflow | Set up GitHub, Vercel, Supabase, Gemini, then Figma screens and Codex | Figma-first, setup lightly described | Setup/checklist and Figma design can run in parallel, then Codex implements linked frames |
| Primary design screens | Home/Beach → Scan → Discovery reveal → Collection → Leaderboard | Adds workshop and battle | Preserve five core discovery screens and extend with Crab Workshop + Practice Battle |
| Leaderboard | Real scores/competition; weekly XP | Weekly cleanup XP | Weekly **self-reported cleanup XP**, not photo scan count or battle wins |
| Battle | Red crab + trash gear + player fights | CPU MVP, optional real PvP | Retain CPU MVP; real online 1v1 still stretch until tested with two actual users |

## Explicit data distinction

- **Discovery:** player safely photographs / identifies litter and accepts a category and crop. Stores a cosmetic-rarity pixel-art card + associated deterministic equipment. It does **not** claim a cleanup happened, and awards **zero cleanup XP**.
- **Cleanup claim:** for a saved safe discovery only, player optionally clicks `I safely disposed of this litter` once now or later. Grants **+10 cleanup XP**, plus **+5** for the first *confirmed cleanup claim* in a canonical category. This is a **self-report**, not verified by Gemini.
- **Leaderboard:** only consented/opted-in and server-recorded self-reported cleanup claims count. Weekly boundaries are Monday 00:00 `America/Chicago`. Offline cards do not automatically become ranked points.
- **Battle inventory:** safe discovery gear is usable immediately in the **local CPU game**; never treat offline/unverified client state as trusted gear ownership for **online PvP**.

## Implementation and Figma truthfulness

The ZIP is a planning package only. No actual Figma file, GitHub repository, app code, deployed site, Gemini key, Supabase project or online match was created by this revision. `npm run dev` runs the Vite client, not `/api/analyze`; use `vercel dev` or a configured dev proxy for functions. Never expose server secrets through `VITE_` variables. If services are missing, keep honest manual scan, offline collection/workshop, and CPU practice.

## Change control

`AGENTS.md`, `PROJECT_PLAN.md`, `docs/TECHNICAL_SPEC.md` and the gameplay/battle specs define the active v4 implementation contract. This note records *why* v3 changed; in any conflict, prefer the clearer v4 specification and report the ambiguity instead of guessing.
