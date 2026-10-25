import type { Profile } from "../world/profile";
import { PlayerAvatar } from "../world/PlayerAvatar";
export function CorporateTrainer({
  profile,
  facing = "left",
}: {
  profile: Profile;
  facing?: "left" | "right";
}) {
  return (
    <div className="corporate-avatar">
      <PlayerAvatar profile={profile} facing={facing} />
      <span className="corporate-badge" aria-hidden="true">
        B
      </span>
    </div>
  );
}
export const palettes = [
  { sky: "#bfeee0", water: "#25c6b2", land: "#f5cc83", accent: "#594793" },
  { sky: "#b9d1d7", water: "#379eaa", land: "#ab8f78", accent: "#e8913e" },
  { sky: "#282044", water: "#594793", land: "#575383", accent: "#ef8ad5" },
  { sky: "#8bd7bb", water: "#388e7b", land: "#8fb777", accent: "#374e52" },
  { sky: "#4d547d", water: "#286a83", land: "#9eabc0", accent: "#f5ad48" },
];
/** Original scenery; purely fictional. Never receives coordinates or tile data. */
export function RegionScenery({
  region = 0,
  clean = false,
  map = false,
}: {
  region?: number;
  clean?: boolean;
  map?: boolean;
}) {
  const p = palettes[region];
  return (
    <svg
      className={map ? "shellshore-art" : "beach-backdrop"}
      viewBox="0 0 320 340"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      data-region-art={region}
      data-restored={clean}
    >
      <rect width="320" height="340" fill={p.sky} />
      <rect y="100" width="320" height="240" fill={p.water} />
      <path d="M0 150h40v-8h60v8h90v-8h50v8h80v190H0z" fill="#fff8df" />
      <path d="M0 162h40v-8h60v8h90v-8h50v8h80v178H0z" fill={p.land} />
      {map && (
        <path
          d="M0 0h250v45h-15v55h20v50h-30v55h20v60h-25v75H0z"
          fill={p.land}
          stroke="#fff8df"
          strokeWidth="5"
        />
      )}
      {region === 0 && (
        <>
          <path d="M15 237h34v25H15zM175 5h35v25h-35z" fill="#fff8df" />
          <path d="M10 230h44v8H10zm160-230h45v8h-45z" fill={p.accent} />
          <path d="M280 68v35M18 95v35" stroke="#9f725a" strokeWidth="6" />
          <path
            d="M264 62h32v7h-32zm5-7h20v7h-20zM2 92h32v7H2zM8 85h20v7H8z"
            fill="#629f85"
          />
        </>
      )}
      {region === 1 && (
        <>
          <path
            d="M15 40h85v15H15zm70 0h12v95H85zM200 30h90v15h-90zm75 0h12v105h-12z"
            fill={p.accent}
          />
          <path d="M30 55v40m185-50v50" stroke="#594793" strokeWidth="3" />
          <path
            d="M8 260h40v30H8zm240-45h65v32h-65zM160 30h35v30h-35z"
            fill="#594793"
          />
          <path d="M12 265h30m202-42h60" stroke="#fff8df" strokeWidth="3" />
        </>
      )}
      {region === 2 && (
        <>
          <path
            d="M0 170h320m-320 30h320m-320 30h320m-320 30h320m-320 30h320"
            stroke="#9587b5"
            strokeWidth="3"
          />
          <circle
            cx="270"
            cy="65"
            r="35"
            stroke="#ef8ad5"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M270 30v70m-35-35h70M270 65l-22 67m22-67 22 67"
            stroke="#fff8df"
            strokeWidth="3"
          />
          <path
            d="M12 10h70v34H12zM240 260h60v35h-60z"
            fill="#282044"
            stroke="#25c6b2"
            strokeWidth="4"
          />
        </>
      )}
      {region === 3 && (
        <>
          {[20, 110, 235, 290].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} ${i % 2 ? 70 : 40}v80m0-10-13 24m13-24 13 24`}
                stroke="#594d3b"
                strokeWidth="7"
              />
              <path
                d={`M${x - 18} ${i % 2 ? 50 : 20}h36v35h-36z`}
                fill={clean ? "#83d39b" : "#566c68"}
              />
            </g>
          ))}
          <path d="M25 240h35v42H25zm218 28h40v30h-40z" fill="#b2c8a8" />
          <path d="M255 130h65v12h-65z" fill="#fff8df" />
        </>
      )}
      {region === 4 && (
        <>
          <path
            d="M175 35h105v100H175zM195 15h65v20h-65zM155 135h145v10H155z"
            fill="#d6dce2"
            stroke="#594793"
            strokeWidth="4"
          />
          <path
            d="M185 48h20v15h-20zm35 0h20v15h-20zm35 0h15v15h-15zm-70 30h20v15h-20zm35 0h20v15h-20z"
            fill={clean ? "#25c6b2" : "#594793"}
          />
          <path d="M8 220h35v70H8zM280 260h30v60h-30z" fill="#594793" />
          <path d="M14 230h22v5H14zm0 12h22v5H14z" fill="#25c6b2" />
        </>
      )}
      <path
        d="M240 215h70v15h-70zM252 210v35m20-35v35m20-35v35"
        fill="#9f725a"
        stroke="#594793"
        strokeWidth="3"
      />
      {!clean ? (
        <g className="story-litter">
          <path
            d="M15 190h13v8H15zm260-34h18v9h-18zm-40 134h20v9h-20zM80 300h12v8H80z"
            fill="#716e83"
          />
          <path d="M280 140h32v7h-32zM55 180h15v6H55z" fill="#687769" />
        </g>
      ) : (
        <g className="restored-wildlife">
          <path
            d="M15 200l5-5 5 5m240-70 5-5 5 5m-45 150 5-5 5 5"
            fill="none"
            stroke="#fff8df"
            strokeWidth="3"
          />
          <path d="M10 280h6v6h-6zm190-100h6v6h-6z" fill="#f58a08" />
        </g>
      )}
      <path
        className="story-ripples"
        d="M280 120h22m-28 155h30m-30-250h20"
        stroke="#fff8df"
        strokeWidth="3"
      />
      {map && (
        <path
          d="M65 42L205 85 65 155 205 220 120 300"
          stroke="#594793"
          strokeWidth="3"
          strokeDasharray="3 7"
          fill="none"
        />
      )}
    </svg>
  );
}
export function IslandArt({ clean = [] }: { clean?: boolean[] }) {
  return (
    <svg
      className="story-island-art"
      viewBox="0 0 240 300"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="240" height="300" fill="#25c6b2" />
      <path
        d="M15 45h34m110-20h28m-90 130h24m80 100h35M8 270h30"
        stroke="#fff8df"
        strokeWidth="3"
        className="story-ripples"
      />
      <path
        d="M45 230L85 180 155 150 100 95 172 50"
        stroke="#fff8df"
        strokeWidth="2"
        strokeDasharray="3 7"
        fill="none"
      />
      {[
        [15, 205, 70, 50],
        [60, 155, 55, 42],
        [130, 123, 80, 44],
        [55, 65, 70, 52],
        [140, 20, 65, 45],
      ].map(([x, y, w, h], i) => (
        <g key={i} data-island-clean={!!clean[i]}>
          <path
            d={`M${x} ${y + 8}h8v-8h${w - 16}v8h8v${h - 16}h-8v8h-${w - 16}v-8h-8z`}
            fill={clean[i] ? palettes[i].land : "#817d87"}
            stroke="#fff8df"
            strokeWidth="3"
          />
          <path
            d={`M${x + 15} ${y + 15}h12v12h-12z`}
            fill={clean[i] ? "#a9ddab" : "#594793"}
          />
        </g>
      ))}
      <path d="M155 18V4h35v14m-40 0h45v5h-45z" fill="#d6dce2" />
    </svg>
  );
}
