import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cloud, cloudConfigurationError } from "../cloud/client";
import {
  clearRecovery,
  hasRecovery,
  recoveryError,
  recoveryLanding,
} from "../cloud/recovery";

export function RecoveryRedirect() {
  const navigate = useNavigate();
  const handled = useRef(false);
  useEffect(() => {
    // Also rescue old emails that Supabase redirected to the Site URL.
    if (
      !handled.current &&
      (recoveryLanding || (recoveryError && window.location.pathname === "/"))
    ) {
      handled.current = true;
      void cloud?.auth
        .getSession()
        .then(() => navigate("/auth/confirm", { replace: true }));
    }
  }, [navigate]);
  return null;
}
export function Recovery() {
  const location = useLocation(),
    navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "error" | "saved">(
    "checking",
  );
  const [error, setError] = useState("");
  const [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const ready = () => {
      if (!active) return;
      setState("ready");
      if (location.pathname !== "/reset-password")
        navigate("/reset-password", { replace: true });
    };
    const listener = cloud?.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session && !recoveryError) ready();
    });
    async function verify() {
      if (!cloud) throw new Error(cloudConfigurationError);
      if (recoveryError) {
        clearRecovery();
        throw new Error(
          "This reset link is invalid, expired or already used. Request another link and open only the newest email.",
        );
      }
      const { data, error } = await cloud.auth.getSession();
      if (
        !error &&
        data.session &&
        recoveryLanding &&
        !hasRecovery(data.session)
      )
        return; // SDK dispatches PASSWORD_RECOVERY after initialization.
      if (error || !hasRecovery(data.session))
        throw new Error(
          "This reset link is missing, expired or already used. Request another link.",
        );
      ready();
    }
    void verify().catch((e) => {
      if (active) {
        setState("error");
        setError(e.message);
      }
    });
    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);
  async function submit() {
    if (lock.current || state !== "ready" || !cloud) return;
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== repeat) {
      setError("The passwords do not match.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { data } = await cloud.auth.getSession();
      if (!hasRecovery(data.session))
        throw new Error("Your recovery session expired. Request another link.");
      const result = await cloud.auth.updateUser({ password });
      if (result.error) throw result.error;
      clearRecovery();
      setPassword("");
      setRepeat("");
      setState("saved");
      // End this recovery session so the user can verify the new password.
      await cloud.auth.signOut({ scope: "local" });
    } catch {
      setError(
        "The password could not be updated. Check your connection and password requirements, or request another link.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="panel auth-panel" aria-labelledby="recovery-title">
      <span className="eyebrow">YOUR PIXELOGY ACCOUNT</span>
      <h1 id="recovery-title">Set New Password</h1>
      {state === "checking" && (
        <p role="status">Verifying your recovery link…</p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {state === "ready" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <p>Use a new password with at least 8 characters.</p>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
          </label>
          <button className="button primary full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      {state === "saved" && (
        <>
          <p role="status">Password updated. Log in with your new password.</p>
          <Link className="button primary" to="/auth/login">
            Log In
          </Link>
        </>
      )}
      {state !== "saved" && (
        <Link className="button secondary" to="/auth/reset">
          Request Another Link
        </Link>
      )}
    </section>
  );
}
