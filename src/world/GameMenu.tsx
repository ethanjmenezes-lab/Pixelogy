import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
export const menuItems = [
  { to: "/scan", label: "Scan", caption: "Camera", icon: "scan" },
  {
    to: "/collection",
    label: "ShoreDex",
    caption: "Collection",
    icon: "dex",
  },
  {
    to: "/workshop",
    label: "My Crab",
    caption: "Equipment",
    icon: "crab",
  },
  {
    to: "/battle/practice",
    label: "Battle",
    caption: "Practice vs CPU",
    icon: "battle",
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    caption: "Online · coming later",
    icon: "trophy",
  },
  {
    to: "/story",
    label: "Story Mode",
    caption: "Adventure",
    icon: "story",
  },
];
export function PixelIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    scan: "M5 7h4V4h6v3h4v13H5zM9 11h6v6H9zM18 4h3v4h-3z",
    dex: "M4 4h7v17H4zM13 4h7v17h-7zM6 7h3v2H6zM15 7h3v2h-3z",
    crab: "M7 9h10v9H7zM3 5h4v7H3zM17 5h4v7h-4zM5 16h3v5H5zM16 16h3v5h-3zM8 5h2v4H8zM14 5h2v4h-2z",
    battle: "M4 3h4l12 14-3 3L5 7zM17 3h4L7 20l-3-3z",
    trophy: "M7 3h10v11h-3v4h4v3H6v-3h4v-4H7zM3 5h3v7H3zM18 5h3v7h-3z",
    story: "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM8 6h2v10H8zM14 8h2v10h-2z",
    profile: "M8 3h8v8H8zM5 14h14v7H5z",
  };
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">
      <path d={paths[kind]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
export function GameMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="game-menu"
      aria-labelledby="menu-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="menu-handle" />
      <div className="menu-title">
        <div>
          <h2 id="menu-title">Adventure</h2>
        </div>
        <button
          className="pixel-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>
      <div className="game-menu-grid">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={`menu-tile ${item.icon}`}
          >
            <span className="menu-icon">
              <PixelIcon kind={item.icon} />
            </span>
            <strong>{item.label}</strong>
            <small>{item.caption}</small>
          </Link>
        ))}
      </div>
    </dialog>
  );
}
