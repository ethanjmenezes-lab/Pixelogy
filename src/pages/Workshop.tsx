import { WorkshopMoves } from "../battle/WorkshopMoves";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Plus, Check } from "lucide-react";
import { useGame } from "../components/GameContext";
import { Crab } from "../components/Crab";
import { ItemArt } from "../components/ItemCard";
import {
  slots,
  slotLabels,
  catalog,
  equip,
  statsFor,
  type GearSlot,
  type Stats,
} from "../lib/gear";
import { saveEquipment, equippedBlueprints } from "../lib/storage";
export function Workshop() {
  const { items, loadout, refresh } = useGame();
  const [params] = useSearchParams();
  const movesOnly = params.get("section") === "moves";
  const returnTo =
    params.get("from") === "story"
      ? "/story?stage=" + encodeURIComponent(params.get("stage") ?? "")
      : "/battle/practice";
  const fromBattle = ["battle", "story"].includes(params.get("from") ?? "");
  const initial = items.find((i) => i.id === params.get("item"));
  const [slot, setSlot] = useState<GearSlot>(
    initial?.gearBlueprintId ? catalog[initial.gearBlueprintId].slot : "head",
  );
  const [preview, setPreview] = useState<string | null>(initial?.id ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = statsFor(loadout, items);
  const previewLoadout = preview
    ? equip(loadout, items, slot, preview)
    : loadout;
  const stats = statsFor(previewLoadout, items);
  const available = items.filter(
    (i) => i.gearBlueprintId && catalog[i.gearBlueprintId]?.slot === slot,
  );
  async function update(id: string | null) {
    setBusy(true);
    setError("");
    try {
      await saveEquipment(slot, id);
      await refresh();
      setPreview(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading page-title">
        <div>
          <h1>{movesOnly ? "Moves" : "Crab Workshop"}</h1>
        </div>
        <Link className="button primary" to={returnTo}>
          {fromBattle ? "Return to Matchup" : "Let’s battle"}{" "}
          <ArrowUpRight size={18} />
        </Link>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!movesOnly && (
        <div className="workshop-layout">
          <section className="panel crab-stage">
            <div className="panel-heading">
              <span className="eyebrow">
                YOUR CRAB / {preview ? "PREVIEW" : "EQUIPPED"}
              </span>
            </div>
            <div className="workshop-crab">
              <Crab gear={equippedBlueprints(previewLoadout, items)} />
            </div>
            <div className="slot-row">
              {slots.map((s) => (
                <button
                  key={s}
                  className={`slot-button ${slot === s ? "selected" : ""}`}
                  aria-label={slotLabels[s]}
                  aria-pressed={slot === s}
                  onClick={() => {
                    setSlot(s);
                    setPreview(null);
                  }}
                >
                  {items.find((i) => i.id === loadout[s]) ? (
                    <ItemArt item={items.find((i) => i.id === loadout[s])!} />
                  ) : (
                    <svg
                      aria-hidden="true"
                      width="24"
                      height="24"
                      viewBox="0 0 16 16"
                      shapeRendering="crispEdges"
                      fill="currentColor"
                    >
                      <path
                        d={
                          [
                            "M3 3h10v3h2v3H1V6h2z",
                            "M4 2h8v2h2v8h-2v2H4v-2H2V4h2z",
                            "M7 1h2v10h3v2H9v2H7v-2H4v-2h3z",
                            "M2 2h12v8h-2v2h-2v2H6v-2H4v-2H2z",
                            "M2 2h4v8h3v4H1V8h1zM10 2h4v8h2v4h-6z",
                          ][slots.indexOf(s)]
                        }
                      />
                    </svg>
                  )}
                  <span>{slotLabels[s]}</span>
                </button>
              ))}
            </div>
            <div className="stat-grid">
              {(Object.keys(stats) as (keyof Stats)[]).map((k) => (
                <div key={k}>
                  <span>
                    {
                      {
                        hp: "Health",
                        atk: "Attack",
                        def: "Defense",
                        spd: "Speed",
                      }[k]
                    }
                  </span>
                  <strong>
                    {stats[k]}
                    {stats[k] !== current[k] && (
                      <small>
                        {" "}
                        {stats[k] - current[k] > 0 ? "+" : ""}
                        {stats[k] - current[k]}
                      </small>
                    )}
                  </strong>
                  <div className="stat-track">
                    <i
                      style={{
                        width: `${(stats[k] / (k === "hp" ? 60 : 15)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel gear-drawer">
            <h2>{slotLabels[slot]} gear</h2>

            {available.length ? (
              <div className="gear-list">
                {available.map((item) => (
                  <button
                    key={item.id}
                    className={`gear-option ${preview === item.id ? "selected" : ""}`}
                    aria-pressed={preview === item.id}
                    aria-label={`${catalog[item.gearBlueprintId!].label} · ${Object.entries(
                      catalog[item.gearBlueprintId!].statBonus,
                    )
                      .map(([s, v]) => `${s} +${v}`)
                      .join(" · ")}`}
                    onClick={() => setPreview(item.id)}
                  >
                    <ItemArt item={item} />
                    <span>
                      <strong>{catalog[item.gearBlueprintId!].label}</strong>
                      <small>
                        {Object.entries(
                          catalog[item.gearBlueprintId!].statBonus,
                        )
                          .map(([s, v]) => `${s.toUpperCase()} +${v}`)
                          .join(" · ")}
                      </small>
                    </span>
                    {loadout[slot] === item.id ? (
                      <Check size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="drawer-empty">
                <ShellIcon />
                <h3>No Gear</h3>
                <Link className="button secondary" to="/scan">
                  Scan <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
            {preview && (
              <button
                className="button primary full"
                disabled={busy}
                onClick={() => update(preview)}
              >
                Equip this find <Check size={17} />
              </button>
            )}
            {loadout[slot] && (
              <button
                className="button text full"
                disabled={busy}
                onClick={() => update(null)}
              >
                Unequip {slotLabels[slot].toLowerCase()}
              </button>
            )}
          </section>
        </div>
      )}
      <WorkshopMoves />
      {fromBattle && (
        <Link className="button primary full" to={returnTo}>
          Done · Return to Matchup
        </Link>
      )}
    </>
  );
}
function ShellIcon() {
  return <span className="big-symbol">◇</span>;
}
