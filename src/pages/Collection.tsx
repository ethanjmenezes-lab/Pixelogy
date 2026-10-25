import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shell, Check, X } from "lucide-react";
import { useGame } from "../components/GameContext";
import { ItemCard, ItemArt } from "../components/ItemCard";
import { catalog, slots, slotLabels, type Collectible } from "../lib/gear";
import { shoreCatalog, type CatalogEntry } from "../catalog";
import { moves } from "../lib/moves";
import { claimCleanup } from "../lib/storage";

export function Collection() {
  const { items, claims, refresh, userId, cloudOffline } = useGame();
  const [category, setCategory] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [slot, setSlot] = useState("all"),
    [ownership, setOwnership] = useState("all"),
    [search, setSearch] = useState("");
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState({ category, rarity, slot });
  const activeFilters = [category, rarity, slot].filter(
    (v) => v !== "all",
  ).length;
  const [selected, setSelected] = useState<CatalogEntry | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const byCatalog = new Map<string, Collectible[]>();
  for (const item of items)
    if (item.catalogId)
      byCatalog.set(item.catalogId, [
        ...(byCatalog.get(item.catalogId) ?? []),
        item,
      ]);
  const filtered = shoreCatalog.filter(
    (c) =>
      (category === "all" || c.category === category) &&
      (rarity === "all" || c.rarity === rarity) &&
      (ownership === "all" ||
        (ownership === "owned" ? byCatalog.has(c.id) : !byCatalog.has(c.id))) &&
      (slot === "all" || (c.gearId && catalog[c.gearId].slot === slot)) &&
      [c.name, ...c.aliases].some((n) =>
        n.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const discoveries = selected ? (byCatalog.get(selected.id) ?? []) : [];
  const unclaimed = discoveries.find(
    (d) => !claims.some((c) => c.collectibleId === d.id),
  );
  const gear = selected?.gearId ? catalog[selected.gearId] : null;
  const special = Object.values(moves).find((m) => m.gear === selected?.gearId);
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">YOUR COASTAL FIELD GUIDE</span>
        <h1>ShoreDex</h1>
        <p>
          <strong>
            {byCatalog.size} / {shoreCatalog.length}
          </strong>{" "}
          species discovered · {items.filter((i) => i.catalogId).length} finds
        </p>
        <Link className="button primary" to="/scan">
          Scan
        </Link>
      </div>
      {!userId && (
        <p className="notice">
          Sign in in Profile to collect across devices. Previous local
          discoveries remain below.
        </p>
      )}
      {cloudOffline && (
        <p className="notice">
          Offline account snapshot. Connect to save new discoveries or change
          equipment.
        </p>
      )}
      <div className="dex-toolbar">
        <input
          aria-label="Search ShoreDex"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ShoreDex…"
        />
        <button
          className="button secondary"
          ref={filterTrigger}
          onClick={() => {
            setDraft({ category, rarity, slot });
            setFiltersOpen(true);
          }}
        >
          Filter{activeFilters ? ` · ${activeFilters}` : ""}
        </button>
      </div>
      <div className="dex-tabs" aria-label="Discovery filters">
        {["all", "owned", "undiscovered"].map((v) => (
          <button
            key={v}
            aria-pressed={ownership === v}
            onClick={() => setOwnership(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="field-help" role="status">
        {filtered.length} entries
      </p>
      {filtersOpen && (
        <ItemDialog
          onClose={() => setFiltersOpen(false)}
          sheet
          restoreFocus={filterTrigger}
        >
          <div className="dialog-top">
            <h2 id="item-title">Filter ShoreDex</h2>
            <button
              className="icon-button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            >
              <X />
            </button>
          </div>
          {(
            [
              [
                "category",
                "Category",
                [...new Set(shoreCatalog.map((c) => c.category))],
              ],
              ["rarity", "Rarity", ["common", "uncommon", "rare", "legendary"]],
              ["slot", "Equipment Slot", slots],
            ] as const
          ).map(([key, title, values]) => (
            <fieldset className="filter-chip-group" key={key}>
              <legend>{title}</legend>
              {["all", ...values].map((v) => (
                <button
                  key={v}
                  aria-pressed={draft[key] === v}
                  onClick={() => setDraft({ ...draft, [key]: v })}
                >
                  {v === "all"
                    ? "Any"
                    : key === "slot"
                      ? slotLabels[v as keyof typeof slotLabels]
                      : v.replaceAll("_", " ")}
                </button>
              ))}
            </fieldset>
          ))}
          <div className="filter-sheet-actions">
            <button
              className="button secondary"
              onClick={() =>
                setDraft({ category: "all", rarity: "all", slot: "all" })
              }
            >
              Reset
            </button>
            <button
              className="button primary"
              onClick={() => {
                setCategory(draft.category);
                setRarity(draft.rarity);
                setSlot(draft.slot);
                setFiltersOpen(false);
              }}
            >
              Apply
            </button>
          </div>
        </ItemDialog>
      )}
      <div className="dex-grid">
        {filtered.map((c) => {
          const found = byCatalog.has(c.id);
          return (
            <button
              key={c.id}
              className={`dex-entry ${found ? "unlocked " + c.rarity : "locked"}`}
              aria-label={`#${c.number} ${found ? c.name : "Undiscovered"}`}
              onClick={() => {
                setSelected(c);
                setMessage("");
              }}
            >
              <span className="dex-number">
                #{String(c.number).padStart(3, "0")}
              </span>
              <img src={c.sprite} alt="" loading="lazy" />
              <span className="dex-name">{found ? c.name : "???"}</span>
              {found && (
                <span className="dex-count">
                  ×{byCatalog.get(c.id)!.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!filtered.length && <p role="status">No entries match these filters.</p>}
      {items.some((i) => !i.catalogId) && (
        <details className="legacy-dex">
          <summary>Previous local discoveries · preserved</summary>
          <LegacyCollection />
        </details>
      )}
      {selected && (
        <ItemDialog onClose={() => setSelected(null)}>
          <div className="dialog-top">
            <span className={`rarity ${selected.rarity}`}>
              {discoveries.length ? selected.rarity : "UNDISCOVERED"}
            </span>
            <button
              autoFocus
              className="icon-button"
              aria-label="Close item details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
          </div>
          <img
            className={`dex-detail-art ${discoveries.length ? "" : "silhouette"}`}
            src={selected.sprite}
            alt=""
          />
          <h2 id="item-title">
            #{String(selected.number).padStart(3, "0")}{" "}
            {discoveries.length ? selected.name : "A discovery waiting for you"}
          </h2>
          {discoveries.length ? (
            <>
              <p>{selected.description}</p>
              <p>
                {selected.material} · {selected.category.replaceAll("_", " ")} ·
                Owned ×{discoveries.length}
              </p>
              <p className="field-help">
                {selected.spriteStatus === "draft"
                  ? "Draft sprite · final illustration in progress."
                  : "Original finished sprite."}{" "}
                Rarity is cosmetic.
              </p>
              {gear ? (
                <>
                  <h3>
                    {gear.label} · {slotLabels[gear.slot]}
                  </h3>
                  <p>
                    {Object.entries(gear.statBonus)
                      .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                      .join(" · ")}
                  </p>
                  {special && (
                    <p>
                      Equipped special: <strong>{special.name}</strong> —{" "}
                      {special.description}
                    </p>
                  )}
                  <Link
                    className="button primary"
                    to={`/workshop?item=${discoveries[0].id}`}
                  >
                    Equip on your crab
                  </Link>
                </>
              ) : (
                <p>Collection only · no combat bonus.</p>
              )}
              <details>
                <summary>Discovery history ({discoveries.length})</summary>
                <ul>
                  {discoveries.map((d) => (
                    <li key={d.id}>
                      {new Date(d.createdAtIso).toLocaleString()} ·{" "}
                      {claims.some((c) => c.collectibleId === d.id)
                        ? "Cleanup reported"
                        : "Discovery only"}
                    </li>
                  ))}
                </ul>
              </details>
              {unclaimed ? (
                <>
                  <p>
                    Optional self-report for the earliest unclaimed find.
                    Discovery alone earns no cleanup XP.
                  </p>
                  <button
                    className="button secondary"
                    disabled={busy || cloudOffline}
                    onClick={() => {
                      setBusy(true);
                      void claimCleanup(unclaimed.id, crypto.randomUUID())
                        .then(async (c) => {
                          setMessage(`+${c.xpAwarded} cleanup XP saved.`);
                          await refresh();
                        })
                        .catch((e) => setMessage(e.message))
                        .finally(() => setBusy(false));
                    }}
                  >
                    I safely disposed of this litter
                  </button>
                </>
              ) : (
                <p>All owned finds have cleanup self-reports.</p>
              )}
            </>
          ) : (
            <p>
              Photograph safe litter to discover an approved catalog match.
              Never handle unsafe objects for rewards.
            </p>
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

function LegacyCollection() {
  const { items: allItems, claims, refresh } = useGame();
  const items = allItems.filter((i) => !i.catalogId);
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
          <h1>ShoreDex</h1>
          <p>Every little find has a place here.</p>
        </div>
        <Link className="button primary" to="/scan">
          Scan <ArrowUpRight size={18} />
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
            Scan <ArrowUpRight size={16} />
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
  sheet = false,
  restoreFocus,
}: {
  children: ReactNode;
  onClose: () => void;
  sheet?: boolean;
  restoreFocus?: RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      restoreFocus?.current?.focus();
    };
  }, [restoreFocus]);
  return (
    <dialog
      ref={ref}
      className={`item-dialog ${sheet ? "filter-sheet" : ""}`}
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
      aria-labelledby="item-title"
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
