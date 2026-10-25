// Original grid-based art. Gear shares a 64×64 coordinate system and fixed slot anchors.
export function Crab({
  gear = [],
  className = "",
  label = "Your red crab",
}: {
  gear?: string[];
  className?: string;
  label?: string;
}) {
  const has = (id: string) => gear.includes(id);
  return (
    <svg
      className={`crab ${className}`}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <ellipse cx="32" cy="57" rx="25" ry="4" fill="#173e3c" opacity=".12" />
      <g fill="#aa3932">
        <path d="M15 40h7v5h-9v5H8v-6h7zm34 0h-7v5h9v5h5v-6h-7zM20 46h7v6h-6v5h-6v-6h5zm24 0h-7v6h6v5h6v-6h-5z" />
      </g>
      {has("cap_boots") && (
        <g fill="#4a9aa1" stroke="#245e67" strokeWidth="1">
          <path d="M7 48h11v6H6v-4h1zm40 0h11v6H46v-4h1zM14 54h12v5H13v-3h1zm25 0h12v5H38v-3h1z" />
        </g>
      )}
      <path d="M17 29h5v-6h20v6h5v18h-5v5H22v-5h-5z" fill="#a93732" />
      <path d="M20 29h4v-5h16v5h5v15h-5v5H24v-5h-4z" fill="#e9654c" />
      <path d="M24 27h15v4H24zm-2 4h5v8h-5z" fill="#ff9471" />
      <g fill="#dd513e">
        <path d="M10 31h9v8H9v-4H4V21h6v-7h7v12h-5v-5h-3v10zm35 0h9V21h-3v5h-5V14h7v7h7v14h-5v4H45z" />
      </g>
      <g fill="#ff8b61">
        <path d="M5 23h4v9H5zm9-7h3v8h-3zm33 0h3v8h-3zm8 7h4v9h-4z" />
      </g>
      <g className="snap-jaws" fill="#dd513e" aria-hidden="true">
        <path d="M9 19h6v5H9zM49 19h6v5h-6z" />
      </g>
      {has("magazine_mail") && (
        <g className="gear-paper">
          <path d="M22 34h20v14H22z" fill="#709d8c" />
          <path d="M24 35h6v11h-6z" fill="#e8e7af" />
          <path d="M32 36h8v3h-8zm0 5h7v2h-7z" fill="#244d53" />
          <path d="M22 47h20v3H22" fill="#376e63" />
        </g>
      )}
      {has("cardboard_shell") && (
        <g>
          <path d="M21 34h22v15H21z" fill="#c1965d" />
          <path d="M30 34h4v15h-4" fill="#e8cd8d" />
        </g>
      )}
      {has("wrapper_vest") && (
        <g>
          <path d="M23 33h18v17H23z" fill="#e4b94f" />
          <path d="M25 36h14v3H25zm3 5h8v5h-8" fill="#bb5d5b" />
        </g>
      )}
      {has("bottle_blade") && (
        <g className="gear-bottle" transform="rotate(-25 10 31)">
          <path
            d="M7 15h6v19H7zM8 9h4v7H8z"
            fill="#a8d8c7"
            stroke="#427b76"
            strokeWidth="1"
          />
          <path d="M8 7h4v3H8zM5 32h10v3H5z" fill="#4e9fa4" />
          <path d="M8 35h4v6H8z" fill="#6f5c40" />
          <path d="M8 21h4v7H8z" fill="#f4e4af" />
        </g>
      )}
      {has("straw_spear") && (
        <path d="M8 8h3v33H8zM8 8h10v3H8z" fill="#e9cb6b" />
      )}
      {has("can_shield") && (
        <g className="gear-shield">
          <path d="M47 27h12v3h3v15h-3v4H47v-4h-3V30h3z" fill="#729899" />
          <path d="M48 29h10v16H48z" fill="#b1d1c4" />
          <path d="M50 33h6v8h-6z" fill="#e0b85c" />
          <path d="M48 30h10v2H48z" fill="#e4f0dc" />
        </g>
      )}
      <path d="M24 18h5v10h-5zm12 0h5v10h-5" fill="#a93732" />
      {has("bag_helm") && (
        <g className="gear-bag">
          <path d="M21 12h4V7h5v7h5V7h5v6h4v10H21z" fill="#dbe4bd" />
          <path d="M23 18h19v6H23z" fill="#a9c19e" />
          <path d="M27 15h10v3H27z" fill="#f4efcf" />
        </g>
      )}
      {has("cup_crown") && (
        <g>
          <path d="M23 10h18l-3 14H26z" fill="#f0d49c" />
          <path d="M22 9h20v3H22zM26 17h12v3H26z" fill="#599c97" />
        </g>
      )}
      <g fill="#fff4d4">
        <path d="M23 22h7v8h-7zm12 0h7v8h-7" />
      </g>
      <g fill="#223e3c">
        <path d="M26 24h3v4h-3zm10 0h3v4h-3zM28 34h3v2h-3zm3 2h5v2h-5zm5-2h2v2h-2" />
      </g>
    </svg>
  );
}
export function BeachArt() {
  return (
    <svg
      className="beach-art"
      viewBox="0 0 900 360"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <defs>
        <pattern id="sea" width="110" height="35" patternUnits="userSpaceOnUse">
          <path d="M8 17h22v3H8zm65 9h14v3H73" fill="#c3eee0" opacity=".5" />
        </pattern>
      </defs>
      <path fill="#d5ece1" d="M0 0h900v360H0z" />
      <path fill="#92c8bc" d="M0 140h900v180H0z" />
      <path fill="url(#sea)" d="M0 140h900v180H0z" />
      <path
        fill="#e8f2d7"
        d="M0 254h90v-8h80v15h120v-9h90v11h125v-11h130v9h100v-12h165v111H0z"
      />
      <path
        fill="#eddbab"
        d="M0 277h90v-8h80v15h120v-9h90v11h125v-11h130v9h100v-12h165v88H0z"
      />
      <path
        fill="#d9c48e"
        d="M31 323h12v4H31zm100-27h8v4h-8zm89 42h16v4h-16zm203-28h14v4h-14zm291 19h12v4h-12zm95-33h9v4h-9"
      />
      <path
        fill="#f9f7df"
        d="M90 55h15V44h55v11h19v12H90zm418 37h12V81h50v11h18v11h-80z"
      />
      <path fill="#edcd79" d="M716 42h40v40h-40z" />
      <g fill="#518b70">
        <path d="M798 121h12v153h-12z" fill="#99734c" />
        <path d="M800 122h-20v-8h-32v-13h42v8h13v-9h37v12h-26v12h29v12h-33v-7h-14v15h-26v-12h26z" />
      </g>
      <path d="M616 270h40v10h-40zm8-8h25v9h-25" fill="#77958a" />
      <path d="M60 280h4v-19h6v25H52v-7h8" fill="#82a17e" />
    </svg>
  );
}
