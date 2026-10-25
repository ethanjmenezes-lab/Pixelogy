import { ProgressionPanel } from "../progression/ProgressionPanel";
import { cosmetics, appearanceUnlocked } from "../progression/cosmetics";
import { playerLevel } from "../progression/model";
import { AccountPanel } from "../cloud/AccountPanel";
import { InstallGuide } from "../pwa/InstallGuide";
import { readConsent, saveConsent } from "../lib/storage";
import { useEffect, useState } from "react";
import { useGame } from "../components/GameContext";
import { saveProfile } from "../lib/storage";
import {
  skins,
  hairColors,
  clothes,
  type Profile as ProfileType,
} from "../world/profile";
import { PlayerAvatar } from "../world/PlayerAvatar";

export function Profile() {
  const { userId } = useGame();
  return <ProfileSession key={userId ?? "local"} />;
}
function ProfileSession() {
  const { profile, refresh, items, claims, userId, player } = useGame();
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    void readConsent()
      .then(setConsent)
      .catch(() => {});
  }, []);
  const [draft, setDraft] = useState<ProfileType>(profile);
  const [loadedProfile, setLoadedProfile] = useState(JSON.stringify(profile));
  if (loadedProfile !== JSON.stringify(profile)) {
    setLoadedProfile(JSON.stringify(profile));
    setDraft(profile);
  }

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const level = playerLevel(player.xp);
  async function save() {
    setBusy(true);
    try {
      await saveProfile(draft);
      await refresh();
      setMessage("Explorer saved. See you on the coast!");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-page">
      <AccountPanel />
      <div className="profile-preview">
        <PlayerAvatar profile={draft} />
        <div>
          <span className="eyebrow">YOUR COASTAL ALTER EGO</span>
          <h1>Hey, explorer.</h1>
          <p>
            Player Lv. {level} · {player.xp} Player XP
          </p>
        </div>
      </div>
      <ProgressionPanel />
      <section
        className="panel"
        id="customization"
        aria-label="Player customization"
      >
        <h2>Customize player</h2>
        <label className="field-label">
          Explorer name
          <input
            maxLength={24}
            value={draft.nickname}
            onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
          />
        </label>
        {(
          [
            { key: "skin", label: "Skin tone", colors: skins },
            { key: "hair", label: "Hair color", colors: hairColors },
            { key: "clothing", label: "Outfit color", colors: clothes },
          ] as const
        ).map((group) => (
          <fieldset className="palette-group" key={group.key}>
            <legend>{group.label}</legend>
            <div>
              {group.colors.map((color, i) => (
                <button
                  key={color}
                  disabled={
                    !appearanceUnlocked({ ...draft, [group.key]: i }, level)
                  }
                  title={
                    group.key === "clothing" && i >= 4
                      ? "Player Lv. 2"
                      : undefined
                  }
                  aria-label={`${group.label} ${i + 1}`}
                  aria-pressed={draft[group.key] === i}
                  style={{ backgroundColor: color }}
                  onClick={() => setDraft({ ...draft, [group.key]: i })}
                >
                  {draft[group.key] === i ? "✓" : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="profile-options">
          <label className="field-label">
            Hair style
            <select
              value={draft.hairStyle}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hairStyle: e.target.value as ProfileType["hairStyle"],
                })
              }
            >
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="bun" disabled={level < 3}>
                Coastal bun · Lv. 3
              </option>
            </select>
          </label>
          <label className="field-label">
            Headwear
            <select
              value={draft.hat}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hat: e.target.value as ProfileType["hat"],
                })
              }
            >
              <option value="none">No hat</option>
              <option value="cap">Coastal cap</option>
            </select>
          </label>
        </div>
        <div className="cosmetic-grid">
          {cosmetics.map((c) => (
            <button
              key={c.id}
              className="button secondary"
              disabled={level < c.level}
              aria-pressed={Object.entries(c.patch).every(
                ([k, v]) => draft[k as keyof ProfileType] === v,
              )}
              onClick={() => setDraft({ ...draft, ...c.patch })}
            >
              <PlayerAvatar profile={{ ...draft, ...c.patch }} />
              {c.name}
              <small>
                {level < c.level
                  ? `Locked · Player Lv. ${c.level}`
                  : "Unlocked"}
              </small>
            </button>
          ))}
        </div>
        <button
          className="button text"
          onClick={() =>
            setDraft({ ...draft, outfit: "plain", accessory: "none" })
          }
        >
          Remove outfit & accessories
        </button>
        <label className="check-label">
          <input
            type="checkbox"
            checked={draft.motion === "reduced"}
            onChange={(e) =>
              setDraft({
                ...draft,
                motion: e.target.checked ? "reduced" : "system",
              })
            }
          />{" "}
          Reduce animation (system preference is also respected)
        </label>
        <button
          className="button primary full"
          disabled={busy || !draft.nickname.trim()}
          onClick={save}
        >
          Save explorer
        </button>
        <p role="status">{message}</p>
      </section>
      <section className="panel">
        <h2>Photo privacy</h2>
        <label className="check-label">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              const value = e.target.checked;
              setConsent(value);
              void saveConsent(value)
                .then(() => setMessage("Privacy preference saved."))
                .catch(() => {
                  setConsent(!value);
                  setMessage("Could not save your privacy preference.");
                });
            }}
          />{" "}
          Automatically send resized captures to Google Gemini for
          identification
        </label>
        <p>
          Original photos and location trails are not saved. Map requests share
          the viewed region with OpenFreeMap. Camera files may temporarily
          remain in the operating system cache.
        </p>
      </section>
      <section className="panel profile-stats">
        <h2>Your field notes</h2>
        <p>
          {items.length} discoveries · {claims.length} self-reported cleanups
        </p>
        <p>
          Player XP unlocks cosmetics. Crab XP unlocks main attacks. Cleanup XP
          stays separate.
        </p>
        <p>
          {userId
            ? "Your account profile and progress sync with Supabase."
            : "Your guest profile is stored on this browser."}{" "}
          GPS is used only while the world is open.
        </p>
      </section>
      <InstallGuide />
    </div>
  );
}
