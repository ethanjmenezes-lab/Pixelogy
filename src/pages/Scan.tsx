import { CleanupButton } from "../cleanup/CleanupButton";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CameraCapture } from "../mobile/CameraCapture";
import { analyzeUrl } from "../mobile/platform";
import { normalizePhoto } from "../lib/pixel";
import { readConsent, saveConsent } from "../lib/storage";
import { useGame } from "../components/GameContext";
import { authHeaders, rpc } from "../cloud/client";
import { catalogById } from "../catalog";
import { catalogAnalysisSchema } from "../catalog/matching";
import { catalog as gear } from "../lib/gear";
import { moves } from "../lib/moves";
type Analysis = ReturnType<typeof catalogAnalysisSchema.parse>;
export function Scan() {
  const { userId, loading } = useGame();
  if (loading) return <p role="status">Checking your session…</p>;
  if (!userId) return <Navigate to="/auth/login?next=%2Fscan" replace />;
  return <ScanSession key={userId} />;
}
function ScanSession() {
  const { refresh } = useGame();
  const [consent, setConsent] = useState(false),
    [ready, setReady] = useState(false),
    [source, setSource] = useState(""),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [selected, setSelected] = useState(""),
    [mode, setMode] = useState("capture"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [saved, setSaved] = useState<{
      id: string;
      catalogId: string;
      isNew: boolean;
    } | null>(null);
  const generation = useRef(0),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(true),
    lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    void readConsent()
      .then((value) => {
        if (mounted.current) setConsent(value);
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "Could not read your privacy preference. Enable scanning below to retry, or return to the world.",
          );
      })
      .finally(() => {
        if (mounted.current) setReady(true);
      });
    return () => {
      mounted.current = false;
      generation.current++;
      controller.current?.abort();
    };
  }, []);
  function reset() {
    generation.current++;
    controller.current?.abort();
    setAnalysis(null);
    setSelected("");
    setReviewed(false);
    setSaved(null);
    setError("");

    lock.current = false;
    setBusy(false);
  }
  async function analyze(image: string, justConsented = false) {
    if ((!consent && !justConsented) || lock.current) return;
    reset();
    const version = generation.current;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 30000);
    lock.current = true;
    setBusy(true);
    setMode("analyzing");
    try {
      if (!navigator.onLine)
        throw new Error(
          "You’re offline. New discoveries need an internet connection.",
        );
      const response = await fetch(analyzeUrl(), {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({ consent: true, image }),
        signal: abort.signal,
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The identification server returned an unreadable response. Please retry shortly.",
        );
      }
      if (!response.ok) throw new Error(data.error || "Gemini is unavailable.");
      const parsed = catalogAnalysisSchema.safeParse(data);
      if (!parsed.success)
        throw new Error("Gemini returned an invalid result. Please retry.");
      const result = parsed.data;
      if (
        result.candidates.some((id) => !catalogById[id]) ||
        (result.candidates.length && (!result.payload || !result.signature))
      )
        throw new Error("Invalid catalog response.");
      if (!mounted.current || generation.current !== version) return;
      if (!(await readConsent()))
        throw new Error("Photo analysis consent was revoked.");
      if (!mounted.current || generation.current !== version) return;
      setAnalysis(result);
      setSelected(result.status === "matched" ? result.candidates[0] : "");
      setMode(
        result.status === "matched" || result.status === "choose"
          ? "review"
          : result.status,
      );
    } catch (e) {
      if (mounted.current && generation.current === version) {
        setMode("error");
        setError(
          abort.signal.aborted
            ? "Photo identification took too long. Retry this photo or retake it."
            : (e as Error).message ||
                "Photo identification could not complete. Please retry.",
        );
      }
    } finally {
      clearTimeout(timeout);
      if (mounted.current && generation.current === version) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  async function capture(file?: File) {
    if (!file) return;
    reset();
    const version = generation.current;
    try {
      const image = await normalizePhoto(file);
      if (!mounted.current || version !== generation.current) return;
      setSource(image);
      void analyze(image);
    } catch (e) {
      if (mounted.current && version === generation.current)
        setError((e as Error).message);
    }
  }
  async function save() {
    if (!selected || !analysis || !reviewed || !consent || lock.current) return;
    lock.current = true;
    setBusy(true);
    const version = generation.current;
    try {
      if (!(await readConsent()))
        throw new Error(
          "Photo analysis consent was revoked. Retake after enabling it again.",
        );
      const result = await rpc<{
        id: string;
        catalogId: string;
        isNew: boolean;
      }>("award_discovery", {
        payload: analysis.payload,
        signature: analysis.signature,
        catalog_id: selected,
      });
      if (!mounted.current || version !== generation.current) return;
      setSaved(result);
      setSource("");
      setMode("saved");
      await refresh();
    } catch (e) {
      if (mounted.current && version === generation.current)
        setError(`Could not save discovery: ${(e as Error).message}`);
    } finally {
      if (mounted.current && version === generation.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  const entry = catalogById[saved?.catalogId ?? selected];
  const special = entry?.gearId
    ? Object.values(moves).find((m) => m.gear === entry.gearId)
    : null;
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">FIND YOUR NEXT SHOReDEX ENTRY</span>
        <h1>Scan</h1>
        <p>A real-world find. An original pixel collectible.</p>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {saved && entry ? (
        <section className={`panel discovery-result ${entry.rarity}`}>
          <span className="eyebrow">
            {saved.isNew
              ? "NEW DISCOVERY"
              : "DUPLICATE DISCOVERY · QUANTITY +1"}
          </span>
          <h2>A little treasure, all yours.</h2>
          <img className="catalog-reveal" src={entry.sprite} alt={entry.name} />
          <h3>
            #{String(entry.number).padStart(3, "0")} {entry.name}
          </h3>
          <span className={`rarity ${entry.rarity}`}>{entry.rarity}</span>
          <p>
            {entry.spriteStatus === "draft"
              ? "Sprite draft · final artwork in progress."
              : ""}
          </p>
          <p>
            {entry.gearId
              ? `${gear[entry.gearId].label}${special ? ` · unlocks ${special.name} when equipped` : ""}`
              : "Collection-only find"}
          </p>
          <p>Saved to your account. Discovery grants no cleanup XP.</p>
          <div className="button-row">
            <Link className="button primary" to="/collection">
              Open ShoreDex
            </Link>
            {entry.gearId && (
              <Link
                className="button secondary"
                to={`/workshop?item=${saved.id}`}
              >
                Equip on your crab
              </Link>
            )}
            <Link className="button secondary" to="/">
              Continue
            </Link>
            <button
              className="button text"
              onClick={() => {
                reset();
                setSource("");
                setMode("capture");
              }}
            >
              Scan again
            </button>
          </div>
          <p>Optional self-report: did you safely dispose of this litter?</p>
          <CleanupButton id={saved.id} />
        </section>
      ) : (
        <section className="scan-flow panel" data-scan-state={mode}>
          {ready && !source && <CameraCapture onPhoto={capture} />}
          {source && (
            <img
              className="scan-source"
              src={source}
              alt="Private captured photo"
            />
          )}
          {!ready ? (
            <p>Getting your camera ready…</p>
          ) : !consent ? (
            <>
              <h2>Snap. Discover. Collect.</h2>
              <p>
                Resized photos are sent to Google Gemini to identify a safe
                catalog match. Raw photos are not stored. Only the catalog
                discovery is saved, not the photo.
              </p>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void saveConsent(true)
                    .then(() => {
                      setConsent(true);
                      if (source) return analyze(source, true);
                    })
                    .catch((e) => setError(e.message))
                    .finally(() => setBusy(false));
                }}
              >
                Enable automatic scanning
              </button>
              <Link className="button text" to="/">
                Not now / back to world
              </Link>
            </>
          ) : (
            <>
              {mode === "analyzing" && (
                <p role="status">
                  Identifying your find and matching the ShoreDex…
                </p>
              )}
              {mode === "blocked" && (
                <p role="alert">
                  This may be unsafe or uncertain. Do not pick it up for
                  rewards. No collectible can be awarded.
                </p>
              )}
              {mode === "unknown" && (
                <p role="status">
                  Unknown Discovery. No appropriate catalog match was found.
                  Nothing was awarded.
                </p>
              )}
              {mode === "review" && analysis && (
                <>
                  <h2>
                    {analysis.status === "choose"
                      ? "Which of these matches your photo?"
                      : "Identified automatically · review your find"}
                  </h2>
                  <div className="candidate-list">
                    {analysis.candidates.map((id) => {
                      const c = catalogById[id];
                      return (
                        <button
                          className={`catalog-candidate ${selected === id ? "selected" : ""}`}
                          aria-pressed={selected === id}
                          key={id}
                          onClick={() => {
                            setSelected(id);
                            setReviewed(false);
                          }}
                        >
                          <img src={c.sprite} alt="" />
                          <span>
                            #{c.number} {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p>
                    Confirm only if the suggested object matches. You cannot
                    change safety or choose an unrelated entry.
                  </p>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(e) => setReviewed(e.target.checked)}
                    />
                    I reviewed the object. This catalog match is correct and the
                    litter is safe.
                  </label>
                  <button
                    className="button primary"
                    disabled={busy || !selected || !reviewed}
                    onClick={() => void save()}
                  >
                    {busy ? "Saving…" : "Save discovery"}
                  </button>
                </>
              )}
              {mode === "error" && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => void analyze(source)}
                >
                  Retry identification
                </button>
              )}
              {source && (
                <button
                  className="button text"
                  disabled={busy && mode !== "analyzing"}
                  onClick={() => {
                    reset();
                    setSource("");
                    setMode("capture");
                  }}
                >
                  Retake photo
                </button>
              )}
              <Link className="button text" to="/">
                Return to world
              </Link>
              <Link className="button text" to="/profile">
                Automatic photo analysis is on · Privacy settings
              </Link>
            </>
          )}
        </section>
      )}
    </>
  );
}
