> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](MOBILE_APP_SETUP.md) and GPS_AND_CAMERA.md for the current contract. Native physical-device acceptance remains pending SDK/device access.

# UX, game feel, screens and battle presentation

## Design personality

**Coastal retro arcade**: cheerful seafoam, warm sand, colorful pixel artifacts, original crab cast. It's a *game*, not an environmental guilt dashboard. The player should understand `Scan → Collect → Equip → Battle` in under 10 seconds. Subtle animations support reduced-motion. Never duplicate Pokémon/Prodigy icons, creature designs or trademarked UI.

Figma frames, component naming, tokens, layering and handoff are in [`FIGMA_UI_WORKFLOW.md`](FIGMA_UI_WORKFLOW.md).

## Primary navigation

Mobile bottom nav: **Beach**, **Scan**, **ShoreDex**, **Crab**, **Battle**. Leaderboard is a link from Beach/Crab, not a sixth tiny nav icon. On desktop use a header/side navigation. At 390px width, no sideways scrolling; controls are large and label-rich.

## Screen specifications

### 1. Beach (`/`)

- Original pixel beach hero with friendly **red crab** dressed in available gear (or bare starting crab).
- Headline: `Clean up. Gear up. Crab on.`
- Primary **Scan Trash** CTA; secondary **Customize Crab** and **Practice Battle**.
- Show separate summary counters: `Self-reported cleanups`, `ShoreDex discoveries`, `Cleanup XP`, optional `Practice wins`.
- How-to: `Scan safe litter → Collect pixel gear → Battle`; optional `Safely dispose → Earn cleanup XP`.
- Small safety link: avoid sharps/glass/unknown waste; no points from unsafe objects.

### 2. Scan (`/scan`)

1. `Capture`: photo picker / phone camera, preview and retake.
2. `Identify`: ask consent for Gemini; offer `Choose item manually` with no remote upload. Label AI suggestion rather than claiming certainty.
3. `Focus`: adjustable crop with handles; use valid segmentation mask if available; select safe category/subtype, with gear preview chip `Turns into: Bag Helm • Head`.
4. `Save Discovery`: reviewed, safely categorized scan becomes one pixel-art card and gear candidate **regardless of disposal**; show rarity and `Gear unlocked: Bag Helm`. Never suggest the photo alone verifies cleanup.
5. `Optional Cleanup`: ask `Did you safely dispose of this litter?` with `Yes — claim cleanup XP` and `Not yet / skip`. If yes, award `+10 Cleanup XP` and optional first-confirmed-category `+5`. If skipped, keep the item/gear but give **0 cleanup XP**. Player can self-report once later from card detail.
6. `Next`: `Equip now` (link to workshop selecting the new item), `ShoreDex`, `Scan again`.

Unsafe classification shows `This may be dangerous. Don't pick it up for points.` and **no reward**. A manually corrected category still requires safe-item review. No hazardous discovery earns gear; no AI output is proof of disposal.

### 3. ShoreDex (`/collection`)

- Collections grid with pixelized found objects, rarity border, category, date and gear tag.
- Modes: **All**, **Discoveries**, and **Gear**; gear filter by Head/Shell/Main Claw/Off Claw/Feet.
- Item detail: focus sprite, object label, identified type and cosmetic rarity, slot, small standardized stats, `Equip on Crab` where eligible; optionally `Mark safely disposed` for an unclaimed safe item.
- Duplicates appear separately. `Discovered 2 bag helmets` means 2 distinct instance IDs; cannot equip same ID twice.
- `Other safe litter` is collectible even if no gear blueprint is available.

### 4. Crab Workshop (`/workshop`)

- Centerpiece: expressive **red crab** on a beach stand, not generic robot. Both claws and walking legs still readable.
- Slot hotspots: Head (top), Shell (torso), Main Claw (attacking claw), Off Claw (other claw), Feet (bottom); tap a slot to filter owned items.
- Inventory drawer: cards with thumbnail, item name, target slot, stat bonus and selected state.
- `Equip`, `Swap`, `Unequip` controls; prevent wrong slot use; show actual selected card's original pixel art in detail view.
- Layered equipment example: bag helmet above eyes, glossy magazine cover on shell, plastic bottle sword held in main claw, can shield held in off claw, matching cap-boot graphics at legs.
- Original sprite art must make these look like *wearable game equipment*, not pasted photo rectangles; use photo pixel texture or recognizable mini motif inside authored transparent overlays.
- Stat bars **HP/Attack/Defense/Speed** update with every change. Tooltips explain they're fair, small bonuses independent of rarity.
- CTA **Battle with this Crab** takes current loadout to practice (or optional real challenger). Empty inventory → a naked starting red crab can still practice.

### 5. Practice Battle (`/battle/practice`)

- Title must say **Practice vs CPU**.
- Two battle platforms; player red crab on left, distinctive CPU crab on right (also red base, different authored cosmetic markings), both with attached visible gear.
- Each actor has HP meter and numeric HP; active turn banner (e.g. `Your turn`); visible move buttons **Pinch**, **Guard**, **Tidal Slam** including cooldown countdown.
- Selecting move shows one bite-sized text combat log entry; short hit shake/damage number; reduced-motion option simply updates UI.
- Result: `Victory!` or `Practice complete`, turn recap, replay, `Change Gear` CTA. Do not grant cleanup XP here. Practice trophy counter separate.
- The CPU may choose sensible actions; label it honestly, not a multiplayer opponent.

### 6. Leaderboard (`/leaderboard`)

- Header: `Weekly Cleanup Champions` and current Monday–Sunday range in America/Chicago.
- Opt-in nickname/notice `Scores reflect self-reported cleanups, not independently verified disposals. Discovery scans alone do not score.`
- Display **weekly cleanup XP**, weekly cleanup count second. Battle trophies/wins only if clearly separate and not mixed into ranking.
- Missing cloud backend → `Live ranking is not connected` without made-up users.

### 7. Optional real PvP (`/battle/challenge`, `/battle/[id]`)

Only if actually built: `Create challenge` gives expiring invite code; `Join challenge` from a different user; show two public nicknames, real ready/waiting/turn/results. If not ready, leave out of demo/navigation or mark clearly disabled. Never disguise CPU as online opponent.

## Important edge states

- Camera unavailable: normal file picker.
- Gemini down/key absent: **Manual mode** and editable crop, no fake provider result.
- Segmentation uncertain: bbox/manual crop, no false background-removal statement.
- Unsafe: stop before discovery gear/reward and recommend professional guidance instead of pickup.
- Storage full: retry, no fake success.
- Wrong-slot owned gear: friendly message `That gear belongs on your crab's shell`, no mutation.
- No equipment: a bare red crab still fights CPU.
- Long online wait: honest waiting/reconnect/forfeit; no generated fake human actions.

## Accessibility and visual QA

- Minimum 44px interactive regions, keyboard focus, semantic buttons/dialogs, alt text/aria for sprites, contrast, noncolor labels for rarity and HP.
- Use CSS `image-rendering: pixelated` for low-res sprites, but body text remains smoothly rendered and accessible.
- Reduced-motion media query controls all shaking/flip effects. Never flash rapidly.
- At phone widths, crab preview and slot selection should not obscure the inventory drawer or action buttons.
- Device test with fingers, not only desktop mouse.
