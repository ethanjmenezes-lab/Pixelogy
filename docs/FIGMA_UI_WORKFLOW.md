# Figma → Codex UI workflow

## What exists versus what doesn't

**This package does not include a `.fig` file, existing Figma URL, components on a Figma canvas, screenshots exported from Figma, or Figma plugin access.** It defines *what to design* and how to transfer it to Codex. Never state that a Figma design exists until actually created/connected.

## Recommended Figma structure

Create one Figma Design file: `Pixelogy | HowdyHack | UI v4`. Suggested pages:

1. `00 — Foundation`: color variables, typography, spacing, radii, shadows, icon sizes, pixels-grid art scale, accessibility states.
2. `01 — Components`: app header, bottom nav, primary/secondary buttons, badge, rarity border, item card, gear chip, slot highlight, meter/HP bar, battle command button, dialog/toast.
3. `02 — Mobile screens`: 390×844 reference, full user states, including loading/error/empty/disabled.
4. `03 — Desktop screens`: 1280×800 adaptation; no gigantic scaled-up phone layout.
5. `04 — Prototypes`: click-through `Home → Scan → Discover → ShoreDex → Workshop → Practice battle; optional separate self-reported cleanup claim` and optional invite flow.
6. `05 — Original pixel assets`: **red crab idle and hit sprites**; separate transparent helmet/shell/claw/feet sprites, front/back layers, anchors.
7. `06 — Handoff`: annotated states, asset export registry and implementation notes.

### Frame and component naming

Use consistent names Codex can search and implement:

```text
Screen/Home/Mobile
Screen/Scan/Capture
Screen/Scan/Analyzing
Screen/Scan/CorrectAndCrop
Screen/Scan/OptionalCleanupClaim
Screen/Scan/Reward
Screen/ShoreDex/Grid
Screen/ShoreDex/CardDetail
Screen/Workshop/NoGear
Screen/Workshop/Equipped
Screen/Battle/Practice/YourTurn
Screen/Battle/Practice/EnemyTurn
Screen/Battle/Practice/Result
Screen/Leaderboard/Online
Screen/Leaderboard/Unavailable
Screen/Battle/PvP/Invite (stretch)
Component/GearSlot/{Head,Shell,MainClaw,OffClaw,Feet}
Component/Crab/BaseRed
Component/Crab/GearOverlay/{Head,Shell,MainClaw,OffClaw,Feet}
```

Use Auto Layout and constraints; keep text editable; create component variants for states; avoid flattening the whole screen into a single image.

## Design variables / token starter spec

These are **proposed implementation tokens**. Replace with values from real Figma variables once linked.

| Token | Suggested value | Usage |
|---|---|---|
| `color.ocean.900` | `#123447` | Header, dark contrast |
| `color.ocean.600` | `#147E88` | Interactive primary |
| `color.seafoam.100` | `#D9F6ED` | Light surfaces |
| `color.sand.50` | `#FFF6E5` | Page background |
| `color.coral.500` | `#E56555` | Red-crab accents |
| `color.gold.400` | `#F8C85C` | XP & highlights |
| `color.ink` | `#1C3441` | Text |
| `space.unit` | `4px` | Layout increments |
| `radius.card` | `16px` | Panels; not sprite pixels |
| `control.minTouch` | `44px` | Minimum tap area |
| `sprite.logicalGrid` | `64×64` | Crab/item pixel-space sprite |

Rarity card treatments: **Common** seafoam, **Uncommon** turquoise, **Rare** violet, **Legendary** warm gold. Use text labels as well as color. A pixel-style accent typeface may be used for headings only; body copy is a readable sans-serif. Respect system reduced-motion preferences.

## Crab builder visual specification

- Red crab is a layered character, not generated fresh from arbitrary raw photos every render.
- Sprite coordinate reference: 64×64 logical pixels; use nearest-neighbor scale. Anchor slots in an original sprite document (proposed: head `(32,11)`, shell `(32,32)`, main claw `(12,27)`, off claw `(51,27)`, feet `(32,55)`). Adjust after actual art; the anchor data and sprite content must share a version.
- Draw order (back to front): feet/back attachments → red crab base → shell/body overlay → claw equipment → helmet/front accent → eyes/face highlight. If a sword should sit *in* the claw, ensure crab claw can visibly grip it.
- Gear overlays use approved blueprint sprite/shape with optional photo-pixel texture clipped into the region. Don't paste full rectangle photos on crab body parts.
- In Figma, design **empty, eligible, equipped, selected, disabled** states for each gear slot; show owned item chip & stat delta while previewing.
- Mark cosmetic rarity via card border only, not combat glow/strength.

## Screen interaction inventory

| Screen | Figma states that must exist | Key tap |
|---|---|---|
| Home | new player, has stats | Start Cleanup / Workshop / Battle |
| Scan | empty, review, AI, manual, crop edit, unsafe, saved discovery, optional cleanup claim, reward, error | Save safe discovery card/gear; optionally claim cleanup XP |
| ShoreDex | empty, cards, detail, filter inventory by slot | Open item / Equip |
| Workshop | empty slots, gear drawer, equipped, wrong-slot message, stat delta | Equip, swap, remove |
| Practice Battle | your turn, resolving, enemy turn, Guard status, result | Pinch, Guard, Tidal Slam |
| Leaderboard | not opted-in, authentic online, unavailable | Join or return |
| PvP | optional create/join code, waiting, your turn, result | True two-player flow only |

## Actual Codex–Figma connection

Recommended official connection:

- **Codex app:** Plugins → Figma → Install/Allow. This is an explicit user-managed connection.
- **Codex CLI:** `codex mcp add figma --url https://mcp.figma.com/mcp`, then sign in and authorize.
- Give Codex **the specific Figma file and selected frame URLs**, not vague references to a filename.
- In Codex, ask it to read design context, components, variables, exports and interactions for the selected frame, map to existing `src/components`, and implement accessible React/Tailwind. Validate visually in browser against frame.
- Where tools/permissions do not exist, use exported frames/assets plus this written spec; document design approximation. Do not fabricate design measurements.
- Writing back into Figma may require additional permissions/seat and is **not** required to use designs for handoff.

**Official references:** [Codex & Figma setup](https://help.figma.com/hc/en-us/articles/39888629089175-Codex-and-Figma-Set-up-the-MCP-server), [Figma MCP overview](https://developers.figma.com/docs/figma-mcp-server/), [MCP tools/design context](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/).

## Asset handoff checklist

- [ ] Working Figma file URL and named priority frames captured in a project note (no secret tokens).
- [ ] Color/type/spacing variables mapped to `tokens.css` / Tailwind semantic classes.
- [ ] Screens include interaction, loading, error, empty and mobile states.
- [ ] Original 64×64 red crab base + transparent per-slot gear overlays exported, with anchor metadata.
- [ ] Assets carry transparent backgrounds, defined dimensions, versioned names, permissible license/ownership.
- [ ] Screenshot comparison on 390px mobile and ~1280px desktop; fixes feed back to Figma.
