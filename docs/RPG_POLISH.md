# Coastal RPG polish

The ShoreDex uses a search box, ownership tabs and an accessible native-dialog bottom sheet with custom chips. Category, rarity and slot changes are staged until Apply; Reset clears the staged filters. Escape, Close and backdrop dismissal discard uncommitted changes. The catalog grid has five columns at phone widths. Locked entries retain silhouettes and hidden names.

Eight existing canonical IDs now have Legendary rarity: spiral-straw, thread-spool, egg-carton, cardboard-cup-carrier, dispensing-pump-cap, bubble-tea-cup, biscuit-tin and rounded-pencil-tin. All have original finished SVGs and unique descriptions. The remaining catalog IDs, gear stats and discovery/cleanup transactions are unchanged. Legendary presentation is cosmetic. The generator imports scripts/legendary-art.mjs so rebuilding preserves these assignments. The additive legendary_catalog migration was applied to Supabase; a readback returned 118 Common, 57 Uncommon, 17 Rare and 8 Legendary entries. No inventory rows were deleted or rewritten.

Workshop slots display owned artwork, with compact selectable equipment cards and existing stat previews. Main unlock levels, permanent Defend and equipment-special eligibility are unchanged. Longer move descriptions remain under Move info.

Combat uses two states: the authoritative resolver/account result and a display snapshot. presentation.ts replays the authoritative action log through the existing deterministic resolver, one turn at a time. useCombatPresentation advances windup (800 ms), impact (800 ms), and transition (800 ms). Display HP, Guard, counters and cooldowns update together at impact. Combined player/CPU API responses are presented separately. Input remains disabled through the sequence. The display snapshot is never submitted for account rewards or persistence. CPU-first matches use the same sequence. Hidden documents pause timers; unmount/exit cleans them up. Reduced motion suppresses transformations while retaining timing and messages.

Coral is Pebble’s explicitly labeled CPU trainer, composed from the original avatar renderer with a fixed distinct appearance. Both trainers react to attacks and outcomes. Original SVG gear remains attached to each crab.

Validation results are recorded in REVISION_NOTES.md. Browser automation uses mocked camera/GPS/Gemini/account responses. It is not physical-phone or live Gemini acceptance.

The catalog seed generator now writes supabase/catalog-seed.generated.sql (or an explicit output path) instead of overwriting an already-applied migration. New catalog changes must be captured in a new migration.

## Verified results

Final checks: typecheck, lint, production build, 70 unit tests, five plain-Node API smoke checks and 86 Chromium/WebKit browser tests passed. Screenshots cover 375×812, 390×844, 430×932 and landscape. No physical-device or new hosted deployment acceptance was performed. The existing large-bundle warning remains.

## Changed files

- [README.md](../README.md)
- [docs/REVISION_NOTES.md](../docs/REVISION_NOTES.md)
- [docs/RPG_POLISH.md](../docs/RPG_POLISH.md)
- [public/shoredex/biscuit-tin.svg](../public/shoredex/biscuit-tin.svg)
- [public/shoredex/bubble-tea-cup.svg](../public/shoredex/bubble-tea-cup.svg)
- [public/shoredex/cardboard-cup-carrier.svg](../public/shoredex/cardboard-cup-carrier.svg)
- [public/shoredex/dispensing-pump-cap.svg](../public/shoredex/dispensing-pump-cap.svg)
- [public/shoredex/egg-carton.svg](../public/shoredex/egg-carton.svg)
- [public/shoredex/rounded-pencil-tin.svg](../public/shoredex/rounded-pencil-tin.svg)
- [public/shoredex/spiral-straw.svg](../public/shoredex/spiral-straw.svg)
- [public/shoredex/thread-spool.svg](../public/shoredex/thread-spool.svg)
- [scripts/build-catalog.mjs](../scripts/build-catalog.mjs)
- [scripts/legendary-art.mjs](../scripts/legendary-art.mjs)
- [scripts/seed-catalog.ts](../scripts/seed-catalog.ts)
- [src/battle/BattleScreens.tsx](../src/battle/BattleScreens.tsx)
- [src/battle/WorkshopMoves.tsx](../src/battle/WorkshopMoves.tsx)
- [src/battle/battle.css](../src/battle/battle.css)
- [src/battle/presentation.ts](../src/battle/presentation.ts)
- [src/battle/useCombatPresentation.ts](../src/battle/useCombatPresentation.ts)
- [src/catalog/catalog.json](../src/catalog/catalog.json)
- [src/components/Crab.tsx](../src/components/Crab.tsx)
- [src/pages/Battle.tsx](../src/pages/Battle.tsx)
- [src/pages/Collection.tsx](../src/pages/Collection.tsx)
- [src/pages/Scan.tsx](../src/pages/Scan.tsx)
- [src/pages/Workshop.tsx](../src/pages/Workshop.tsx)
- [src/tropical.css](../src/tropical.css)
- [src/world/GameMenu.tsx](../src/world/GameMenu.tsx)
- [supabase/migrations/20261025002132_legendary_catalog.sql](../supabase/migrations/20261025002132_legendary_catalog.sql)
- [tests/catalog.test.ts](../tests/catalog.test.ts)
- [tests/e2e/battle.spec.ts](../tests/e2e/battle.spec.ts)
- [tests/e2e/cloudFixture.ts](../tests/e2e/cloudFixture.ts)
- [tests/e2e/game.spec.ts](../tests/e2e/game.spec.ts)
- [tests/e2e/moves.spec.ts](../tests/e2e/moves.spec.ts)
- [tests/e2e/polish.spec.ts](../tests/e2e/polish.spec.ts)
- [tests/e2e/preparation.spec.ts](../tests/e2e/preparation.spec.ts)
- [tests/e2e/world.spec.ts](../tests/e2e/world.spec.ts)
- [tests/presentation.test.ts](../tests/presentation.test.ts)
