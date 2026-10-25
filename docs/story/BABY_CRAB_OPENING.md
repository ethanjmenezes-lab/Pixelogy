I need you to fix the Story Mode UI and rewrite the opening story flow in Pixelogy.

IMPORTANT:
- Implement the changes in the existing codebase.
- Do not just describe a plan.
- Read the current Story Mode code first.
- Preserve the existing game systems, routes, auth, GPS overworld, ShoreDex, battles, and Supabase progress.
- But fix the Story Mode screen and opening immediately.

## PART 1 — Fix the bad mobile text layout

The current Story Mode screen has a serious UI problem:
- text is hanging off the right side
- content is not wrapping properly
- typography looks broken on mobile
- the page feels too text-heavy

You must fix this.

### Requirements
- No horizontal overflow anywhere on Story Mode screens.
- All text must wrap correctly inside the mobile viewport.
- Test at 375x812, 390x844, and 430x932.
- Prevent long titles, subtitles, and buttons from overflowing.
- Ensure cards and panels use proper width constraints.
- Ensure padding is consistent.
- Ensure buttons and headings stay centered or aligned correctly.
- Reduce unnecessary text on the screen.
- Keep titles short and visually clean.
- Do not allow story descriptions to spill out of their containers.
- Remove any giant paragraph that is not necessary.

### Specific improvements
- Make "The Blacktide Conspiracy" fit cleanly on mobile.
- If necessary, split long subtitles into smaller lines.
- Reduce the amount of descriptive copy shown on the landing screen.
- Keep only:
  - title
  - short one-line hook
  - primary action button
  - optional “Watch Opening” button
- Avoid clutter.

Example preferred structure:
- Title: "The Blacktide Conspiracy"
- Short hook: "Investigate Blacktide. Save the coast."
- Button 1: "Start Story"
- Button 2: "Watch Opening"

Do not leave the current oversized paragraph layout.

## PART 2 — Rewrite the opening story premise

I want the intro story changed.

The opening story should now be:

1. Blacktide is secretly dumping trash on the beach.
2. The player notices something suspicious and goes to investigate.
3. While investigating the rubbish, the player discovers a baby red crab walking out of the trash.
4. The player and the baby crab connect immediately.
5. A Blacktide worker/security trainer catches the player snooping.
6. The worker threatens the player.
7. The baby crab steps forward and defends the player.
8. The first battle begins.

This should replace the weaker version of the opening.

## PART 3 — Use this exact opening story flow

I want the intro cinematic and text to use this story structure.

### Opening cinematic sequence

#### Scene 1 — Peaceful beach
Show a clean, beautiful beach in daylight.
Waves roll in.
A few small crabs move near the shore.
A Blacktide billboard stands nearby.

On billboard:
"BLACKTIDE"
"CLEAN COASTS. BRIGHTER FUTURES."

No long narration.

#### Scene 2 — Suspicious activity
Transition to later in the day or evening.
The player notices a Blacktide truck or dumping vehicle near a fenced-off part of the beach.
Trash is being unloaded.

Short caption:
"Something isn't right."

#### Scene 3 — Investigation
The player carefully walks toward the dumping area.
Show bags, cans, cardboard, plastic, and junk piled near the sand.

Short caption:
"So this is where it's going..."

#### Scene 4 — The baby crab appears
A pile of rubbish rustles.
A tiny red crab crawls out from the trash.
It is small, scrappy, and a little dirty, but cute and brave.
The crab pauses, looks at the player, then lifts one claw.

Use this exact dialogue:

PLAYER:
"Hey... where did you come from?"

PLAYER:
"You were hiding in there?"

PLAYER:
"You're just a little guy."

The baby crab chirps or snaps its claws.

Short caption:
"The little crab doesn't run."

#### Scene 5 — First bond
The player kneels down.
The baby crab steps closer.
The player notices that the crab picks up a small piece of trash like treasure.

Use this exact dialogue:

PLAYER:
"You want to fight this mess too?"

PLAYER:
"Then let's do it together."

#### Scene 6 — Blacktide confrontation
A Blacktide worker/security trainer appears.
They shine a flashlight or step into frame.

Use this exact dialogue:

BLACKTIDE WORKER:
"You're not supposed to be here."

BLACKTIDE WORKER:
"Drop the camera. Walk away."

PLAYER:
"This beach is covered in your trash."

BLACKTIDE WORKER:
"You didn't see anything."

The baby crab steps in front of the player.

BLACKTIDE WORKER:
"What, that little crab?"

BLACKTIDE WORKER:
"Fine. We'll crush you both."

#### Scene 7 — Battle transition
The baby crab raises its claws.
The screen transitions into the first battle.

Use this exact battle intro line:
"BABY CRAB steps forward!"

Then:
"BLACKTIDE WORKER challenges you!"

Then begin the first story battle.

## PART 4 — Writing style rules

This is important.

### DO:
- Keep dialogue short.
- Keep dialogue natural.
- Use compact story captions.
- Let animation tell the story.
- Make the crab feel cute and brave.
- Make the opening feel emotional and cool.

### DO NOT:
- Do not write long speeches.
- Do not write generic environmental lecture text.
- Do not add extra exposition paragraphs.
- Do not replace this with Codex-generated dialogue.
- Do not paraphrase the provided lines.
- Do not dump too much text on screen.

The story should feel like a real game opening cutscene, not a slideshow with paragraphs.

## PART 5 — Cinematic implementation requirements

Implement the opening as an actual animated cutscene, not static text cards.

Requirements:
- Pixel-art backgrounds
- Camera panning
- Character entrance animations
- Small crab animation
- Trash pile movement when the crab appears
- Smooth transitions between scenes
- Dialogue boxes that fit on mobile
- Skip button
- Replay button
- Save whether the cinematic has been watched

Use concise dialogue boxes with proper wrapping.
Text must never overflow outside its container.

## PART 6 — Dialogue box requirements

The dialogue UI must be fixed too.

Requirements:
- Proper padding
- Max width inside phone viewport
- Multi-line wrapping
- No clipped text
- No overflow
- Larger readable font
- Speaker name on top
- Dialogue beneath
- Touch-friendly "Next" control
- Works cleanly on mobile portrait screens

## PART 7 — Story landing page cleanup

Redesign the Story Mode landing screen so it looks like a game menu, not a text-heavy webpage.

Keep it simple:
- Main title
- Short hook
- Key art / preview image
- Start Story button
- Watch Opening button

Suggested hook:
"Investigate Blacktide. Save the coast."

Optional small secondary line:
"A coastal adventure begins with one tiny crab."

Do not keep the current long descriptive paragraph.

## PART 8 — Acceptance criteria

This task is complete only when:

1. Story Mode text does not overflow on mobile.
2. No horizontal clipping appears on the story page.
3. The opening story uses the new investigation + baby crab premise.
4. The exact dialogue above is used.
5. The player discovers the baby crab in the rubbish.
6. The Blacktide worker confronts the player after that discovery.
7. The cutscene feels animated, not like static slides.
8. The story landing page is shorter and cleaner.
9. The dialogue boxes wrap properly on mobile.
10. Build/tests pass.

Implement this now in the existing repository.
At the end, report:
- files changed
- UI fixes made
- story scenes updated
- whether the exact dialogue was used
- mobile viewport checks completed
- anything still incomplete