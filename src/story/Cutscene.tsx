import type { Profile } from "../world/profile";
import { sceneById, script } from "./script";
import { StoryCutscenePlayer } from "./StoryCutscenePlayer";
import { implementedShots } from "./ShotStage";
export const OPENING = script.opening.id;
export type Cinematic = string;
export const cinematicIds = [
  OPENING,
  ...script.regions.flatMap((r) => [r.intro_scene.id, r.outro_scene.id]),
  script.ending.id,
];
export function sceneImplemented(id: string) {
  return !!sceneById(id)?.shots.every((shot) => implementedShots.has(shot.id));
}
export function Cutscene({
  id,
  profile,
  gear = [],
  done,
}: {
  id: Cinematic;
  profile: Profile;
  gear?: string[];
  done: () => void;
}) {
  const scene = sceneById(id);
  if (!scene) return null;
  return (
    <StoryCutscenePlayer
      key={id}
      scene={scene}
      profile={profile}
      gear={gear}
      done={done}
    />
  );
}
