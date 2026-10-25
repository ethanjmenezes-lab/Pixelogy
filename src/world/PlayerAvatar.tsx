import { skins, hairColors, clothes, type Profile } from "./profile";
import type { Facing } from "./model";
export function PlayerAvatar({
  profile,
  facing = "down",
  walking = false,
  frame = 0,
}: {
  profile: Profile;
  facing?: Facing;
  walking?: boolean;
  frame?: number;
}) {
  const side = facing === "left" || facing === "right",
    back = facing === "up",
    step = walking && frame % 2 === 1;
  return (
    <svg
      viewBox="0 0 20 28"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${profile.nickname}, facing ${facing}`}
      className="player-avatar"
    >
      <g
        transform={
          facing === "left" ? "translate(20 0) scale(-1 1)" : undefined
        }
      >
        <ellipse cx="10" cy="26" rx="7" ry="2" fill="#274f4938" />
        <path
          d={
            step
              ? "M6 20h4v7H5v-3h1zm5 0h4v5h-4z"
              : "M6 20h4v6H5v-3h1zm5 0h4v7h-4z"
          }
          fill="#354a5a"
        />
        <path d="M5 12h10v10H5z" fill={clothes[profile.clothing]} />
        <path d="M5 13h3v7H5z" fill="#ffffff33" />
        {profile.outfit === "beach" && (
          <path
            d="M5 16h3v1h4v-1h3v2h-3v1H8v-1H5zM5 20h10v1H5z"
            fill="#fff8df"
          />
        )}
        {profile.outfit === "explorer" && (
          <>
            <path d="M5 13h4v9H5zm7 0h3v9h-3z" fill="#f6cc75" />
            <path d="M6 17h2v3H6zm7 0h1v3h-1z" fill="#594793" />
          </>
        )}
        {profile.hairStyle === "bun" && (
          <path d="M7 0h6v4H7z" fill={hairColors[profile.hair]} />
        )}
        <path
          d={step ? "M3 14h3v7H3zm12-2h3v6h-3z" : "M3 13h3v7H3zm12 1h3v7h-3z"}
          fill={skins[profile.skin]}
        />
        <path d="M5 4h11v9H5zM7 13h6v2H7z" fill={skins[profile.skin]} />
        <path
          d={
            profile.hairStyle === "long"
              ? "M4 3h12v4H4zM4 6h3v10H4zM14 6h3v10h-3z"
              : "M4 3h12v4H4zM4 6h3v4H4z"
          }
          fill={hairColors[profile.hair]}
        />
        {back ? (
          <path d="M5 5h11v8H5z" fill={hairColors[profile.hair]} />
        ) : (
          <g fill="#283f43">
            <path d={side ? "M14 8h2v2h-2z" : "M7 8h2v2H7zm6 0h2v2h-2z"} />
            <path d="M10 12h2v1h-2z" />
          </g>
        )}
        {profile.accessory === "sunglasses" && !back && (
          <path d="M6 8h4v3H6zm5 0h5v3h-5zM10 9h1v1h-1z" fill="#282044" />
        )}
        {profile.hat === "cap" && (
          <>
            <path d="M4 3h12v4H4zM6 1h8v2H6z" fill="#e6ce82" />
            <path d={back ? "M5 6h10v2H5z" : "M4 6h14v2H4z"} fill="#ad7f46" />
          </>
        )}
      </g>
    </svg>
  );
}
