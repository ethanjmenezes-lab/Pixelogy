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
import { levelFor } from "../world/model";
export function Profile() {
  const { userId } = useGame();
  return <ProfileSession key={userId ?? "local"} />;
}
function ProfileSession() {
  const { profile, refresh, items, claims } = useGame();
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    void readConsent()
      .then(setConsent)
      .catch(() => {});
  }, []);
  const [draft, setDraft] = useState<ProfileType>(profile);
  const [loadedProfile, setLoadedProfile] = useState(profile);
  if (loadedProfile !== profile) {
    setLoadedProfile(profile);
    setDraft(profile);
  }

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const xp = claims.reduce((s, c) => s + c.xpAwarded, 0);
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
            Level {levelFor(xp).level} · {xp} cleanup XP
          </p>
        </div>
      </div>
      <section className="panel">
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
          Level is cosmetic: every 100 cleanup XP adds a level. Discoveries,
          walking and battles do not award cleanup XP or combat power.
        </p>
        <p>
          This is a local profile. No cloud account is connected. GPS is used
          only while the world is open.
        </p>
      </section>
      <InstallGuide />
    </div>
  );
}
