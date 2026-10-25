import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../components/GameContext";
import { states, stateStats } from "./states";
export function CleanupMap() {
  const { claims, items } = useGame(),
    [selected, setSelected] = useState(""),
    [search, setSearch] = useState("");
  const colored = states.filter(
      (s) => stateStats(s.code, claims, items).pickups > 0,
    ),
    s = states.find((s) => s.code === selected)!,
    stats = stateStats(selected, claims, items);
  const total = new Set(claims.map((c) => c.collectibleId)).size;
  return (
    <section className="cleanup-map">
      <Link className="button text" to="/collection">
        ‹ Collection
      </Link>
      <h1>U.S. Map</h1>
      <div className="map-statistics">
        <strong>States Cleaned: {colored.length} / 50</strong>
        <span>Total Pickups: {total}</span>
      </div>
      <progress aria-label="States cleaned" max={50} value={colored.length} />
      <svg
        viewBox="0 0 975 610"
        aria-label="United States cleanup map"
        className="state-map"
      >
        {states.map((s) => (
          <path
            key={s.code}
            d={s.path ?? ""}
            tabIndex={0}
            role="button"
            aria-label={s.name}
            aria-pressed={selected === s.code}
            data-state={s.code}
            className={`${colored.some((c) => c.code === s.code) ? "cleaned" : ""} ${selected === s.code ? "selected" : ""}`}
            onClick={() => setSelected(s.code)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(s.code);
              }
            }}
          >
            <title>{s.name}</title>
          </path>
        ))}
      </svg>
      <small>
        Mint: cleanup reported · Orange: selected · Muted: no cleanups
      </small>
      <section className="panel state-detail" aria-live="polite">
        <h2>{s?.name ?? "Choose a state"}</h2>
        {stats.pickups ? (
          <>
            <strong>
              {stats.pickups} Pickups · {stats.types} Trash Types
            </strong>
            <p>First Cleanup: {new Date(stats.first!).toLocaleDateString()}</p>
          </>
        ) : (
          <p>
            {s ? "No cleanups yet." : "Tap the map or choose from the list."}
          </p>
        )}
      </section>
      <label>
        Find a state
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or abbreviation"
        />
      </label>
      <div className="state-list" aria-label="Choose a state">
        {states
          .filter((s) =>
            (s.name + " " + s.code)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((s) => (
            <button
              key={s.code}
              aria-pressed={selected === s.code}
              onClick={() => setSelected(s.code)}
            >
              {s.name}
              <span>{stateStats(s.code, claims, items).pickups}</span>
            </button>
          ))}
      </div>
      <footer className="map-privacy">
        <p className="field-help">
          Private, self-reported cleanups. Unassigned pickups count in your
          total, but color no state.
        </p>
        <small>
          Boundaries:{" "}
          <a href="https://github.com/topojson/us-atlas">
            U.S. Census / us-atlas (ISC)
          </a>
          . Alaska and Hawaii shown as insets.
        </small>
      </footer>
    </section>
  );
}
