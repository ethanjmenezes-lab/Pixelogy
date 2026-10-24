> Current architecture (native GPS transition): production uses real foreground location, MapLibre/OpenFreeMap geography and immediate camera capture. Joystick movement and the fictional demo coast are historical, not production behavior. Preserve local gameplay; cloud accounts/rankings/PvP remain unavailable. See [mobile setup](MOBILE_APP_SETUP.md) and GPS_AND_CAMERA.md for the current contract. Native physical-device acceptance remains pending SDK/device access.

# Demo, test matrix and handoff — v4

## 60–90 second complete product demo

1. **Beach:** introduce `Pixelogy — clean up, gear up, crab on`. Show the original red crab and `Start Cleanup`.
2. **Scan:** pick a photo of a **safe plastic bag** (or show real consented Gemini recognition). Correct crop until bag is isolated and pixelized.
3. **Discover:** immediately save a reviewed safe photo as a Common/Uncommon/Rare/Legendary **cosmetic** card with `Bag Helm • Head` gear; **do not claim disposal**. Show **0 cleanup XP** for scan-only. Optionally tap `I safely disposed of this litter` to gain **+10 cleanup XP** (+5 first confirmed cleanup category).
4. **ShoreDex:** open inventory and show persistent personalized card; tap `Equip`.
5. **Workshop:** the **red crab visibly wears the bag helmet**; optionally show magazine armor, bottle blade, cap boots from **distinct previously discovered** safe test records. Tap stats, show ownership / slot changes.
6. **Battle:** start **Practice vs CPU**, use Pinch, Guard, Tidal Slam, show HP change and eventually genuine victory/loss. Name the opponent **CPU**, not a fake player.
7. **Online only if true:** demonstrate weekly Supabase ranks from two opted-in accounts and optionally real friend challenge with a second live browser. Never fabricate standings or call an automated opponent PvP.

## Automated QA matrix

| Area | Test | Required outcome |
|---|---|---|
| Consent | Do not consent to remote photo upload | Manual mode, no Gemini request |
| Hazards | Broken/uncertain glass, medical waste or unknown dangerous item | No XP, card or gear |
| Disposal | User says `Not yet / skip` | Card and gear saved; **0 cleanup XP**, optional later claim |
| Focus | Bag on cluttered background | Cropped/masked bag sprite, not full room |
| Gemini | Missing key / invalid JSON or polygon | Explicit manual mode/crop, no imaginary AI |
| XP | First confirmed cleanup category, repeat, double claim | +15 first confirmed, +10 repeat, 1 cleanup/event UUID; scan-only 0 cleanup XP |
| Rarity | Reload or equip a legendary card | Border persists; **no stat increase** |
| Inventory | 2 copies same category | 2 IDs, only one can be used per slot |
| Slots | Bag, magazine, bottle, can, cap | Head, Shell, Main Claw, Off Claw, Feet |
| Ownership | Equip nonexistent/wrong-slot/same ID twice | Rejected, no state mutation |
| Crab art | All gear equipped at 390px width | Recognizable crab and correct layers |
| Stat calc | Full defense example in Gear Catalog | HP 40 / ATK 9 / DEF 11 / SPD 6 |
| Battle | Pinch / Guard / Tidal Slam | Exact deterministic integer damage |
| Battle | Repeat guard; special cooldown | No stacked shield; exactly 2 own turns blocked |
| Battle | KO, wrong turn, repeated action | Result frozen; illegal actions rejected |
| Practice | Offline fight to completion | Works, clearly labeled CPU, no online XP |
| Persistence | Reload after discovery/equip/optional cleanup claim | Same cards, cosmetic rarity, claim status, XP and loadout |
| Online XP | No credentials | Honest unavailable state, no fake scores |
| Online XP | Two real users and Monday boundary | Different real event totals, correct week |
| PvP | No server ready | Challenge hidden/disabled, not faux human |
| PvP | Two authenticated accounts | Real invite/turn/winner state consistent |
| PvP security | Tamper damage, ID, version, gear ownership | Rejected server-side; no double action |
| Figma handoff | No connected file | No claim Figma frames inspected |

## Manual device checks

- 390px-wide viewport: all tabs fit or intentionally scroll; battle action buttons usable without overlap; slot areas large enough for fingers.
- Desktop 1280px: visual hierarchy, crop editing, card grid and workshop composition are intentional.
- Keyboard navigation, readable labels, ARIA for sprite buttons, accessibility when colorblind or reduced motion.
- Camera permission denied, unsupported image/HEIC, 5MB cap, slow Gemini and offline states.
- Original sprites and Figma asset exports have licensing/attribution appropriate to event rules.
- No raw photos/EXIF or geolocation leaked into public online records. Server-only secrets absent from client bundle.

## Submission and engineering truth checklist

- [ ] Game runs over HTTPS from a clean device and has coherent start/end.
- [ ] Local discovery-to-gear-to-CPU vertical slice is actually demonstrable.
- [ ] Gemini integration works with current authorized key **or** its absence is labeled and manual demo used.
- [ ] Figma file/frame access is recorded only if actually connected; design handoff documented.
- [ ] Public leaderboard is only shown with actual Supabase records; otherwise unavailable state.
- [ ] PvP is called **real player-vs-player** only if tested with two actual accounts; otherwise stretch/disabled.
- [ ] Hackathon code/assets conform to current event rules and disclose AI help when required.
- [ ] README lists accurate install/deploy commands after code exists; no mock APIs described as production.
- [ ] Git changes, licenses, screenshots and tests reviewed prior to presentation.

## Suggested judge talking points

- **Problem:** Most cleanup experiences end when the litter reaches a bin.
- **Novelty:** Every safe reviewed discovery becomes a personalized pixel collectible **and a wearable piece of gear** for a lovable original red crab.
- **Engagement:** Gear builds and genuine turn-based practice battles create replay value. Real player competition is possible with proper backend safeguards.
- **Technical:** Consented Gemini detection/localization, Canvas pixel art, deterministic typed gear mapping, independent battle reducer, Figma-driven UI and optional server-authoritative public systems.
- **Safety/trust:** no incentives for hazardous pickups; disposal and public cleanup counts self-reported; discovery scanning is not evidence of cleanup; no fake online players.
