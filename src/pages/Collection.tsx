import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shell, Check, X } from "lucide-react";
import { useGame } from "../components/GameContext";
import { ItemCard, ItemArt } from "../components/ItemCard";
import { catalog, slots, slotLabels, type Collectible } from "../lib/gear";
import { claimCleanup } from "../lib/storage";
export function Collection() {
  const { items, claims, refresh } = useGame();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Collectible | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = items.filter(
    (i) =>
      filter === "all" ||
      (filter === "gear"
        ? !!i.gearBlueprintId
        : i.gearBlueprintId && catalog[i.gearBlueprintId]?.slot === filter),
  );
  const claimed = claims.some((c) => c.collectibleId === selected?.id);
  async function claim() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const c = await claimCleanup(selected.id, crypto.randomUUID());
      setMessage(`+${c.xpAwarded} cleanup XP saved.`);
      await refresh();
    } catch {
      setMessage("Could not save the cleanup. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading page-title">
        <div>
          <span className="eyebrow">YOUR POCKET-SIZED FIELD JOURNAL</span>
          <h1>The ShoreDex.</h1>
          <p>Every little find has a place here.</p>
        </div>
        <Link className="button primary" to="/scan">
          Find something new <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="collection-toolbar">
        <div className="filter-tabs" aria-label="Collection filters">
          {[
            ["all", "All discoveries"],
            ["gear", "Gear"],
            ...slots.map((s) => [s, slotLabels[s]]),
          ].map(([id, label]) => (
            <button
              aria-pressed={filter === id}
              className={filter === id ? "active" : ""}
              key={id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="muted">{filtered.length} finds</span>
      </div>
      {filtered.length ? (
        <div className="collection-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => {
                setSelected(item);
                setMessage("");
              }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <Shell size={52} strokeWidth={1} />
          <h2>
            {items.length
              ? "No finds in this pocket yet."
              : "A blank page. A whole beach."}
          </h2>
          <p>
            Scan your first safe find to start your collection.
            <br />
            Your card and gear unlock without a disposal claim.
          </p>
          <Link className="button primary" to="/scan">
            Start discovering <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      {selected && (
        <ItemDialog onClose={() => setSelected(null)}>
          <div className="dialog-top">
            <span className={`rarity ${selected.rarity}`}>
              {selected.rarity}
            </span>
            <button
              autoFocus
              className="icon-button"
              aria-label="Close item details"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
          </div>
          <ItemArt item={selected} />
          <h2 id="item-title">
            {selected.gearBlueprintId
              ? catalog[selected.gearBlueprintId]?.label
              : selected.label}
          </h2>
          <p>
            {selected.label} · Discovered{" "}
            {new Date(selected.createdAtIso).toLocaleDateString()}
          </p>
          <p className="field-help">Cosmetic rarity never changes stats.</p>
          {selected.gearBlueprintId && (
            <>
              <p className="stat-bonuses">
                {Object.entries(catalog[selected.gearBlueprintId].statBonus)
                  .map(([stat, value]) => `${stat.toUpperCase()} +${value}`)
                  .join(" · ")}
              </p>
              <Link
                className="button primary full"
                to={`/workshop?item=${selected.id}`}
              >
                Equip on your crab <ArrowUpRight size={17} />
              </Link>
            </>
          )}
          <div className="divider" />
          {claimed ? (
            <p className="success">
              <Check size={17} /> Cleanup self-report saved
            </p>
          ) : (
            <>
              <p>
                Safely disposed of this find? Optionally record your self-report
                for cleanup XP.
              </p>
              <button
                disabled={busy}
                className="button secondary full"
                onClick={claim}
              >
                I safely disposed of this litter
              </button>
            </>
          )}
          <p role="status">{message}</p>
          <button
            className="button text full"
            onClick={() => setSelected(null)}
          >
            Back to collection
          </button>
        </ItemDialog>
      )}
    </>
  );
}

function ItemDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="item-dialog"
      aria-labelledby="item-title"
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
