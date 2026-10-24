import { CameraCapture } from "../mobile/CameraCapture";
import { analyzeUrl } from "../mobile/platform";
import { readConsent, saveConsent } from "../lib/storage";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { categoryLabels, gearFor, type Collectible } from "../lib/gear";
import { normalizePhoto, pixelate, boxToCrop, type Crop } from "../lib/pixel";
import { recognitionSchema } from "../lib/recognition";
import { saveDiscovery, claimCleanup } from "../lib/storage";
import { useGame } from "../components/GameContext";
import { CropEditor } from "../components/CropEditor";
import { ItemArt } from "../components/ItemCard";
export function Scan() {
  const { refresh } = useGame();
  const [source, setSource] = useState("");
  type Recognition = ReturnType<typeof recognitionSchema.parse>;
  const [result, setResult] = useState<Recognition | null>(null);
  const category = result?.category ?? "plastic_bag";
  const subtype = result?.subtype ?? null;
  const safety = result?.safety ?? "uncertain";
  const [crop, setCrop] = useState<Crop>({
    x: 15,
    y: 15,
    width: 70,
    height: 70,
  });
  const [mode, setMode] = useState<
    | "capture"
    | "consent"
    | "analyzing"
    | "review"
    | "blocked"
    | "error"
    | "saved"
  >("capture");
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      request.current?.abort();
    };
  }, []);
  const [consent, setConsent] = useState(false);
  const [safe, setSafe] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Collectible | null>(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [preview, setPreview] = useState("");
  const id = useRef(crypto.randomUUID());
  const lock = useRef(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void readConsent()
      .then((value) => {
        if (active) setConsent(value);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setConsentLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const analyzed = useRef("");
  useEffect(() => {
    if (
      source &&
      consentLoaded &&
      !consentSaving &&
      consent &&
      analyzed.current !== source
    ) {
      analyzed.current = source;
      void analyze(source);
    }
  }, [source, consentLoaded, consent, consentSaving]);
  useEffect(() => {
    if (!source) return;
    let active = true;
    let url = "";
    void pixelate(source, crop)
      .then((blob) => {
        if (active) {
          url = URL.createObjectURL(blob);
          setPreview(url);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [source, crop]);
  function invalidate() {
    generation.current++;
    request.current?.abort();
    request.current = null;
    lock.current = false;
    setBusy(false);
    setResult(null);
    setSafe(false);
  }
  function retake() {
    invalidate();
    analyzed.current = "";
    setSource("");
    setPreview("");
    setSaved(null);
    setError("");
    setMode("capture");
  }
  async function selectPhoto(file?: File) {
    if (!file) return;
    invalidate();
    const version = generation.current;
    setError("");
    setBusy(true);
    try {
      const normalized = await normalizePhoto(file);
      if (!mounted.current || version !== generation.current) return;
      analyzed.current = "";
      id.current = crypto.randomUUID();
      setSource(normalized);
      setSaved(null);
      setMode("consent");
      setCrop({ x: 15, y: 15, width: 70, height: 70 });
      setClaimMessage("");
    } catch (e) {
      if (mounted.current && version === generation.current)
        setError((e as Error).message);
    } finally {
      if (mounted.current && version === generation.current) setBusy(false);
    }
  }
  async function analyze(image = source) {
    if (!image || !consent || consentSaving || lock.current) return;
    invalidate();
    const version = generation.current;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    lock.current = true;
    setBusy(true);
    setMode("analyzing");
    setError("");
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const response = await fetch(analyzeUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, image }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Analysis unavailable");
      const recognition = recognitionSchema.parse(await response.json());
      if (!mounted.current || version !== generation.current) return;
      setResult(recognition);
      setCrop(boxToCrop(recognition.bbox));
      setMode(recognition.safety === "allowed" ? "review" : "blocked");
      if (recognition.safety !== "allowed")
        setError(
          "This may be dangerous or uncertain. Do not pick it up for points. Retake a different safe object.",
        );
    } catch {
      if (!mounted.current || version !== generation.current) return;
      setMode("error");
      setResult(null);
      setError(
        navigator.onLine
          ? "Gemini is unavailable or returned an invalid result. Retry identification or retake the photo. Nothing has been saved."
          : "You’re offline. New discoveries need an internet connection and Gemini identification. Reconnect and retry; nothing has been saved.",
      );
    } finally {
      clearTimeout(timeout);
      if (mounted.current && version === generation.current) {
        setBusy(false);
        lock.current = false;
        request.current = null;
      }
    }
  }
  async function save() {
    if (
      lock.current ||
      !consent ||
      !result ||
      mode !== "review" ||
      !safe ||
      safety !== "allowed"
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const version = generation.current;
      const art = await pixelate(source, crop);
      if (!mounted.current || version !== generation.current) return;
      const item = await saveDiscovery({
        id: id.current,
        category,
        subtype,
        label: subtype === "magazine" ? "Magazine" : categoryLabels[category],
        safety,
        art,
      });
      setSaved(item);
      setMode("saved");
      await refresh();
    } catch {
      setError(
        "Could not save this discovery. Check your browser storage and try again.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function claim() {
    if (!saved || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await claimCleanup(saved.id, crypto.randomUUID());
      setClaimMessage(
        `+${result.xpAwarded} cleanup XP saved. Thank you for caring for the shore!`,
      );
      await refresh();
    } catch {
      setError("Cleanup was not saved. Please try again.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const gear = gearFor(category, subtype);
  return (
    <>
      <div className="section-heading page-title">
        <div>
          <span className="eyebrow">A LITTLE FIND. A NEW ADVENTURE.</span>
          <h1>Discover something good.</h1>
          <p>Give a safe shore find a second life in pixels.</p>
        </div>
        <span className="pill">
          <Camera size={15} /> FIELD NOTES / 01
        </span>
      </div>
      <div className="scan-steps">
        <span className={!source ? "active" : ""}>
          01 <b>Find</b>
        </span>
        <i />
        <span className={source && !saved ? "active" : ""}>
          02 <b>Focus</b>
        </span>
        <i />
        <span className={saved ? "active" : ""}>
          03 <b>Collect</b>
        </span>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {saved ? (
        <section className="panel discovery-result">
          <span className="eyebrow">A NEW PAGE IN YOUR SHOReDEX</span>
          <h2>A little treasure, all yours.</h2>
          <div className={`reveal-art ${saved.rarity}`}>
            <ItemArt item={saved} />
          </div>
          <span className={`rarity ${saved.rarity}`}>{saved.rarity}</span>
          <h3>{saved.gearBlueprintId ? gear?.label : saved.label}</h3>
          <p>
            Your card{saved.gearBlueprintId ? " and gear are" : " is"} saved.
            Discovery alone earns 0 cleanup XP.
          </p>
          <div className="cleanup-box">
            <SproutIcon />
            <h3>Left the shore a little better?</h3>
            <p>
              Disposal is optional and self-reported. You can also confirm later
              from your ShoreDex.
            </p>
            {claimMessage ? (
              <p className="success" role="status">
                {claimMessage}
              </p>
            ) : (
              <button
                className="button secondary"
                disabled={busy}
                onClick={claim}
              >
                <Check size={17} /> I safely disposed of this litter
              </button>
            )}
          </div>
          <div className="button-row">
            <Link
              className="button primary"
              to={
                saved.gearBlueprintId
                  ? `/workshop?item=${saved.id}`
                  : "/collection"
              }
            >
              {saved.gearBlueprintId ? "Equip on your crab" : "Open ShoreDex"}
              <ArrowRight size={17} />
            </Link>
            <button className="button text" onClick={retake}>
              Scan again
            </button>
            <Link className="button text" to="/collection">
              Not yet / view collection
            </Link>
          </div>
        </section>
      ) : (
        <div className="scan-layout">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {source ? "Focus on your find" : "Every find has a story."}
              </h2>
              {source && (
                <button
                  className="icon-button"
                  aria-label="Retake photo"
                  disabled={busy && mode !== "analyzing"}
                  onClick={retake}
                >
                  <RotateCcw size={18} />
                </button>
              )}
            </div>
            {source ? (
              <CropEditor
                source={source}
                crop={crop}
                onChange={(value) => {
                  setCrop(value);
                  setSafe(false);
                }}
              />
            ) : (
              <CameraCapture onPhoto={(file) => void selectPhoto(file)} />
            )}
            <div className="safety-note">
              <ShieldCheck size={21} />
              <p>
                <strong>Curiosity, with care.</strong> Avoid glass, sharps,
                batteries, chemicals and unknown waste. Never handle anything
                unsafe for a reward.
              </p>
            </div>
          </section>
          <aside className="scan-sidebar panel" data-scan-state={mode}>
            <span className="eyebrow">YOUR DISCOVERY KIT</span>
            <h2>{source ? "Make it yours." : "From shore to ShoreDex."}</h2>
            {!source ? (
              <>
                <div className="empty-preview">
                  <Sparkles size={40} />
                </div>
                <p>
                  Take a photo, identify the safe object and adjust the crop.
                  We’ll turn your find into a one-of-a-kind pixel card.
                </p>
                <p className="field-help">
                  Photos stay on this device unless you choose to send one to
                  Gemini. Only the processed pixel art is saved.
                </p>
              </>
            ) : (
              <>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      const value = e.target.checked;
                      if (!value) {
                        invalidate();
                        setMode("consent");
                      }
                      analyzed.current = "";
                      setConsent(value);
                      setConsentSaving(true);
                      void saveConsent(value)
                        .catch(() => {
                          setConsent(false);
                          invalidate();
                          setMode("consent");
                          setError(
                            "Consent could not be remembered on this device. Please retry.",
                          );
                        })
                        .finally(() => setConsentSaving(false));
                    }}
                    disabled={consentSaving || (busy && mode !== "analyzing")}
                  />{" "}
                  I agree to send resized photos to Google Gemini for
                  identification. Remember my choice; revoke it in Profile.
                </label>
                <button
                  className="button secondary full"
                  onClick={() => void analyze()}
                  disabled={!consent || busy || consentSaving}
                >
                  <Sparkles size={17} />
                  {mode === "analyzing"
                    ? "Identifying…"
                    : mode === "error"
                      ? "Retry identification"
                      : "Identify with Gemini"}
                </button>
                {!consent && (
                  <p className="field-help">
                    Identification requires your permission. You can return to
                    the world without sending a photo.
                  </p>
                )}
                <p className="field-help">
                  New discoveries require online AI identification. If the
                  result is wrong, retake your photo.
                </p>
                {(mode === "review" || mode === "blocked") && result && (
                  <>
                    <div className="divider" />
                    <span className="mode-badge">
                      Gemini identification · review required
                    </span>
                    <h3>
                      {result.subtype === "magazine"
                        ? "Magazine"
                        : categoryLabels[result.category]}
                    </h3>
                    <p>{result.label}</p>
                    <div className="gear-preview">
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview of your cropped pixel collectible"
                        />
                      )}
                      <div>
                        <small>{gear ? "TURNS INTO" : "SHOREDEX ONLY"}</small>
                        <strong>{gear?.label ?? "A pixel collectible"}</strong>
                        <span>
                          {gear
                            ? gear.slot.replaceAll("_", " ")
                            : "No equipment bonus"}
                        </span>
                      </div>
                    </div>
                    <p className="field-help">
                      Safety result: <strong>{safety}</strong>. This result
                      cannot be overridden.
                    </p>
                    {safety !== "allowed" && (
                      <p className="field-help">
                        Uncertain or hazardous objects cannot unlock cards, gear
                        or XP.
                      </p>
                    )}
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={safe}
                        disabled={safety !== "allowed" || busy}
                        onChange={(e) => setSafe(e.target.checked)}
                      />{" "}
                      I reviewed the object and crop. It is safe litter, not
                      glass or hazardous waste.
                    </label>
                    <button
                      className="button primary full"
                      onClick={save}
                      disabled={!safe || safety !== "allowed" || busy}
                    >
                      Save discovery <ArrowRight size={17} />
                    </button>
                    <small className="field-help">
                      No disposal claim required. Rarity is cosmetic.
                    </small>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
function SproutIcon() {
  return <span className="xp-icon">✦</span>;
}
