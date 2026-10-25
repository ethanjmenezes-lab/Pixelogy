import content from "../content/story-script.json" with { type: "json" };
export type Dialogue = { speaker: string; text: string };
export type Shot = {
  id: string;
  duration_seconds: number;
  visual_action: string;
  camera: string;
  dialogue_exact?: Dialogue[];
  overlay_exact?: string;
  sound_design?: string;
};
export type StoryScene = { id: string; title: string; shots: Shot[] };
export const script = content;
export const ui = script.battle_ui_text_exact;
export const scenes: StoryScene[] = [
  script.opening,
  ...script.regions.flatMap((r) => [r.intro_scene, r.outro_scene]),
  script.ending,
];
export const sceneById = (id: string) => scenes.find((s) => s.id === id);
// Stable saved IDs are retained. Content IDs and names remain exactly as supplied.
export const savedRegionIds = [
  "shellshore",
  "rustport",
  "neon",
  "mangroves",
  "headquarters",
];
export const saveIdFor = (region: number, number: number) =>
  savedRegionIds[region] + "-" + number;
export function narrativeStrings(
  value: unknown,
  path = "",
): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) =>
      key.endsWith("_exact")
        ? [[path + key, child]]
        : Object.entries(narrativeStrings(child, path + key + ".")),
    ),
  );
}
