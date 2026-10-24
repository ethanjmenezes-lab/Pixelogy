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
          <span className="eyebrow">BUILT FROM YOUR LITTLE DISCOVERIES</span>
          <h1>The crab workshop.</h1>
          <p>A little resourceful. A lot of personality.</p>
        </div>
        <Link className="button primary" to="/battle/practice">
          Let’s battle <ArrowUpRight size={18} />
        </Link>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="workshop-layout">
        <section className="panel crab-stage">
          <div className="panel-heading">
            <span className="eyebrow">
              YOUR CRAB / {preview ? "PREVIEW" : "EQUIPPED"}
            </span>
            <span className="pill">RED & RESOURCEFUL</span>
          </div>
          <div className="workshop-crab">
            <Crab gear={equippedBlueprints(previewLoadout, items)} />
          </div>
          <div className="slot-row">
            {slots.map((s) => (
              <button
                key={s}
                className={`slot-button ${slot === s ? "selected" : ""}`}
                aria-pressed={slot === s}
                onClick={() => {
                  setSlot(s);
                  setPreview(null);
                }}
              >
                {loadout[s] ? <Check size={19} /> : <Plus size={19} />}
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
          <p className="field-help">
            Same little crab. Fair, fixed gear bonuses. Rarity is just for
            looks.
          </p>
        </section>
        <section className="panel gear-drawer">
          <span className="eyebrow">FIND THE RIGHT FIT</span>
          <h2>{slotLabels[slot]} gear</h2>
          <p>Choose a discovery to preview its look and stats.</p>
          {available.length ? (
            <div className="gear-list">
              {available.map((item) => (
                <button
                  key={item.id}
                  className={`gear-option ${preview === item.id ? "selected" : ""}`}
                  onClick={() => setPreview(item.id)}
                >
                  <ItemArt item={item} />
                  <span>
                    <strong>{catalog[item.gearBlueprintId!].label}</strong>
                    <small>
                      {Object.entries(catalog[item.gearBlueprintId!].statBonus)
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
              <h3>A little room to grow.</h3>
              <p>
                Discover safe litter to unlock {slotLabels[slot].toLowerCase()}{" "}
                gear.
              </p>
              <Link className="button secondary" to="/scan">
                Find your first piece <ArrowUpRight size={16} />
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
          <div className="drawer-note">
            Gear is yours to keep. Swap it, remove it, try something new.
            Nothing gets used up.
          </div>
        </section>
      </div>
    </>
  );
}
function ShellIcon() {
  return <span className="big-symbol">◇</span>;
}
