import { catalogById } from "../catalog";
import { useEffect, useState } from "react";
import { catalog, categoryLabels, type Collectible } from "../lib/gear";
import { readArtwork } from "../lib/storage";
export function ItemArt({ item }: { item: Collectible }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (item.catalogId) return;
    let active = true;
    let objectUrl = "";
    void readArtwork(item.sprite.thumbnailBlobKey)
      .then((blob) => {
        if (blob && active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.sprite.thumbnailBlobKey, item.catalogId]);
  if (item.catalogId && catalogById[item.catalogId])
    return (
      <img
        className="item-art"
        src={catalogById[item.catalogId].sprite}
        alt={item.label}
      />
    );
  if (item.legacyArt?.startsWith("data:image/png;base64,"))
    return <img className="item-art" src={item.legacyArt} alt={item.label} />;
  return url ? (
    <img className="item-art" src={url} alt={`Pixel art of ${item.label}`} />
  ) : (
    <div className="item-art placeholder">◇</div>
  );
}
export function ItemCard({
  item,
  onClick,
}: {
  item: Collectible;
  onClick: () => void;
}) {
  const gear = item.gearBlueprintId ? catalog[item.gearBlueprintId] : null;
  return (
    <button className={`item-card ${item.rarity}`} onClick={onClick}>
      <div className="item-image">
        <ItemArt item={item} />
        <span className={`rarity ${item.rarity}`}>{item.rarity}</span>
      </div>
      <div className="item-copy">
        <small>{categoryLabels[item.category]}</small>
        <h3>{gear?.label ?? item.label}</h3>
        <span>
          {gear ? gear.slot.replaceAll("_", " ") : "ShoreDex collectible"}{" "}
          <span aria-hidden="true">↗</span>
        </span>
      </div>
    </button>
  );
}
