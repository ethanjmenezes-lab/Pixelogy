export const skins = ["#f2c49b", "#d59b71", "#ab704e", "#754b39"];
export const hairColors = ["#493b36", "#8b553a", "#d9b46b", "#394556"];
export const clothes = [
  "#e97859",
  "#4b98a3",
  "#8a86b4",
  "#69935e",
  "#25C6B2",
  "#F58A08",
];
export type Profile = {
  nickname: string;
  skin: number;
  hair: number;
  hairStyle: "short" | "long" | "bun";
  outfit?: "plain" | "beach" | "explorer";
  accessory?: "none" | "sunglasses";
  clothing: number;
  hat: "none" | "cap";
  motion: "system" | "reduced";
};
export const defaultProfile: Profile = {
  nickname: "Shore explorer",
  skin: 1,
  hair: 0,
  hairStyle: "short",
  clothing: 0,
  hat: "none",
  motion: "system",
};
export function validProfile(p: Profile) {
  return (
    typeof p.nickname === "string" &&
    p.nickname.trim().length > 0 &&
    p.nickname.length <= 24 &&
    [p.skin, p.hair].every((v) => Number.isInteger(v) && v >= 0 && v < 4) &&
    Number.isInteger(p.clothing) &&
    p.clothing >= 0 &&
    p.clothing < clothes.length &&
    ["plain", "beach", "explorer"].includes(p.outfit ?? "plain") &&
    ["none", "sunglasses"].includes(p.accessory ?? "none") &&
    ["short", "long", "bun"].includes(p.hairStyle) &&
    ["none", "cap"].includes(p.hat) &&
    ["system", "reduced"].includes(p.motion)
  );
}
