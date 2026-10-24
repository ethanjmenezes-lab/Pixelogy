import { CameraCapture } from "../mobile/CameraCapture";
import { analyzeUrl } from "../mobile/platform";
import { readConsent, saveConsent } from "../lib/storage";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
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
  const [adjusting, setAdjusting] = useState(false);
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
    setAdjusting(false);
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
  async function enableAutoScan() {
    if (consentSaving) return;
    setConsentSaving(true);
    setError("");
    try {
      await saveConsent(true);
      if (mounted.current) setConsent(true);
    } catch {
      if (mounted.current)
        setError("Your preference could not be saved. Please try again.");
    } finally {
      if (mounted.current) setConsentSaving(false);
    }
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
      </div>
      <div className="scan-steps">
        <span className={!source ? "active" : ""}>
          01 <b>Find</b>
        </span>
        <i />
        <span className={source && !saved ? "active" : ""}>
          02 <b>Identify</b>
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
        <section className="scan-flow panel" data-scan-state={mode}>
          {!consentLoaded ? (
            <p role="status">Getting your camera ready…</p>
          ) : !consent ? (
            <div className="scan-welcome">
              <span className="scan-sun" aria-hidden="true">
                <Sparkles size={32} />
              </span>
              <h2>Snap. Discover. Collect.</h2>
              <p>
                Each photo will be resized and sent to Google Gemini
                automatically to identify your find. Only the finished pixel art
                is saved here.
              </p>
              <button
                className="button primary full"
                disabled={consentSaving}
                onClick={() => void enableAutoScan()}
              >
                {consentSaving
                  ? "Saving your choice…"
                  : "Enable automatic scanning"}
              </button>
              <p className="field-help">
                One-time permission, remembered on this device. Turn it off
                anytime in Profile → Privacy.
              </p>
              <Link className="button text full" to="/">
                Not now / back to world
              </Link>
            </div>
          ) : (
            <>
              <div className="panel-heading">
                <h2>
                  {!source
                    ? "Find a little treasure."
                    : mode === "analyzing"
                      ? "Discovering your find…"
                      : mode === "review"
                        ? "Look what you found!"
                        : "Your shore find"}
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
              {!source ? (
                <>
                  <CameraCapture onPhoto={(file) => void selectPhoto(file)} />
                  <p className="field-help">
                    Take a photo. We’ll identify and frame your find
                    automatically.
                  </p>
                </>
              ) : (
                <>
                  {adjusting && mode === "review" ? (
                    <CropEditor
                      source={source}
                      crop={crop}
                      onChange={(value) => {
                        setCrop(value);
                        setSafe(false);
                      }}
                    />
                  ) : (
                    <img
                      className="scan-photo"
                      src={source}
                      alt="Your captured shore find"
                    />
                  )}
                  {mode === "analyzing" && (
                    <div className="scan-progress" role="status">
                      <Sparkles size={22} />
                      <div>
                        <strong>Finding the treasure in your photo</strong>
                        <p>Identifying the object and choosing its crop…</p>
                      </div>
                    </div>
                  )}
                  {mode === "error" && (
                    <button
                      className="button secondary full"
                      onClick={() => void analyze()}
                      disabled={busy}
                    >
                      Retry identification
                    </button>
                  )}
                  {mode === "blocked" && (
                    <p className="field-help">
                      This find cannot be collected. Retake a different safe
                      object.
                    </p>
                  )}
                  {mode === "review" && result && (
                    <div className="scan-review">
                      <span className="mode-badge">
                        Identified automatically · review your find
                      </span>
                      <h3>
                        {result.subtype === "magazine"
                          ? "Magazine"
                          : categoryLabels[result.category]}
                      </h3>
                      <div className="gear-preview">
                        {preview && (
                          <img
                            src={preview}
                            alt="Preview of your cropped pixel collectible"
                          />
                        )}
                        <div>
                          <small>
                            {gear ? "YOUR NEW GEAR" : "SHOREDEX FIND"}
                          </small>
                          <strong>
                            {gear?.label ?? "A pixel collectible"}
                          </strong>
                          <span>{result.label}</span>
                        </div>
                      </div>
                      <button
                        className="button text"
                        aria-expanded={adjusting}
                        onClick={() => setAdjusting((value) => !value)}
                      >
                        {adjusting ? "Done adjusting" : "Adjust crop"}
                      </button>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={safe}
                          disabled={busy}
                          onChange={(e) => setSafe(e.target.checked)}
                        />{" "}
                        I reviewed the object and crop. It is safe litter, not
                        glass or hazardous waste.
                      </label>
                      <button
                        className="button primary full"
                        onClick={save}
                        disabled={!safe || busy}
                      >
                        Save discovery <ArrowRight size={17} />
                      </button>
                      <small className="field-help">
                        No disposal claim required. Rarity is cosmetic.
                      </small>
                    </div>
                  )}
                </>
              )}
              <div className="safety-note">
                <ShieldCheck size={21} />
                <p>
                  <strong>Curiosity, with care.</strong> Avoid glass, sharps,
                  batteries, chemicals and unknown waste.
                </p>
              </div>
              <Link className="scan-privacy" to="/profile">
                Automatic photo analysis is on · Privacy settings
              </Link>
            </>
          )}
        </section>
      )}
    </>
  );
}
function SproutIcon() {
  return <span className="xp-icon">✦</span>;
}
