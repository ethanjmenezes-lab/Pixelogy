import {
  emailWait,
  beginEmailWait,
  authErrorMessage,
} from "../cloud/emailCooldown";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  cloud,
  cloudConfigurationError,
  authCallbackError,
} from "../cloud/client";
import {
  authDestination,
  authLink,
  confirmationUrl,
  recoveryUrl,
} from "../cloud/authNavigation";
import { useGame } from "../components/GameContext";
export function Auth() {
  const location = useLocation();
  return <AuthScreen key={location.pathname} />;
}
function AuthScreen() {
  const { userId, refresh } = useGame();
  const location = useLocation(),
    navigate = useNavigate();
  const mode = location.pathname.split("/").at(-1);
  const next = authDestination(
    new URLSearchParams(location.search).get("next"),
  );
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(authCallbackError),
    [message, setMessage] = useState("");
  const [wait, setWait] = useState(() => emailWait());
  useEffect(() => {
    const update = () => setWait(emailWait());
    const timer = setInterval(update, 1000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", update);
    };
  }, []);
  function reserveEmail() {
    if (emailWait())
      throw new Error(
        `Please wait ${emailWait()} seconds before requesting another email.`,
      );
    beginEmailWait();
    setWait(emailWait());
  }
  const lock = useRef(false);
  const updating = mode === "update-password",
    reset = mode === "reset",
    signup = mode === "signup",
    callback = mode === "callback";
  useEffect(() => {
    if (userId && !updating && !reset && !error)
      navigate(next, { replace: true });
  }, [userId, updating, reset, error, navigate, next]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    if (!cloud) {
      setError(cloudConfigurationError);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function submit() {
    await run(async () => {
      if (reset) {
        reserveEmail();
        const { error } = await cloud!.auth.resetPasswordForEmail(email, {
          redirectTo: recoveryUrl(window.location.origin),
        });
        if (error) throw error;
        setMessage(
          "If an account exists for this email, a password-reset link has been sent. Check your inbox and spam folder.",
        );
      } else if (signup) {
        reserveEmail();
        const { data, error } = await cloud!.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: confirmationUrl(window.location.origin, next),
          },
        });
        if (error) throw error;
        setPassword("");
        if (!data.session) {
          setPending(true);
          setMessage(
            "Check your email to confirm your account. Open the confirmation link to return to Pixelogy and continue scanning.",
          );
        } else await refresh();
      } else {
        const { error } = await cloud!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword("");
        await refresh();
      }
    });
  }
  const title = updating
    ? "Choose a new password."
    : reset
      ? "Reset your password."
      : pending
        ? "Check your inbox."
        : signup
          ? "Join the coast."
          : callback
            ? "Finishing sign in…"
            : "Welcome back.";
  return (
    <section className="panel auth-panel" aria-labelledby="auth-title">
      <span className="eyebrow">YOUR PIXELOGY ACCOUNT</span>
      <h1 id="auth-title">{title}</h1>
      <p>
        {updating
          ? "Use a new password with at least 8 characters."
          : reset
            ? "We’ll email you a secure reset link."
            : signup
              ? "Save your discoveries and crab progress across devices."
              : "Log in to continue your next discovery."}
      </p>
      {!cloud && (
        <div role="alert">
          <p>Account services are unavailable on this deployment.</p>
          <p className="field-help">{cloudConfigurationError}</p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Retry account connection
          </button>
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {callback ? (
        <>
          <p>
            Your confirmation link must open this app on an allowed Supabase
            redirect URL. If the link expired, request a new one from Sign Up.
          </p>
          <Link className="button primary" to={authLink("login", next)}>
            Go to Log In
          </Link>
          <Link className="button secondary" to={authLink("signup", next)}>
            Go to Sign Up
          </Link>
        </>
      ) : pending ? (
        <>
          <p>
            Confirmation is required before you can sign in. Pixelogy does not
            bypass email verification.
          </p>
          <button
            className="button secondary"
            disabled={!cloud || busy || wait > 0}
            onClick={() =>
              void run(async () => {
                reserveEmail();
                const { error } = await cloud!.auth.resend({
                  type: "signup",
                  email,
                  options: {
                    emailRedirectTo: confirmationUrl(
                      window.location.origin,
                      next,
                    ),
                  },
                });
                if (error) throw error;
                setMessage(
                  "Confirmation email requested. Check your inbox and spam folder.",
                );
              })
            }
          >
            {wait ? `Resend in ${wait}s` : "Resend confirmation email"}
          </button>
          <Link className="button primary" to={authLink("login", next)}>
            I’ve confirmed — Log In
          </Link>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {(reset || signup) && wait > 0 && (
            <p role="status">You can request another email in {wait}s.</p>
          )}
          {!updating && (
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {!reset && (
            <label>
              {updating ? "New password" : "Password"}
              <input
                type="password"
                autoComplete={
                  signup || updating ? "new-password" : "current-password"
                }
                minLength={signup || updating ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {updating && (
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
          )}
          <button
            className="button primary full"
            disabled={
              !cloud ||
              busy ||
              ((reset || signup) && wait > 0) ||
              (updating && !userId)
            }
          >
            {busy
              ? "Please wait…"
              : updating
                ? "Update password"
                : reset
                  ? "Send reset link"
                  : signup
                    ? "Create account"
                    : "Log In"}
          </button>
          {updating && !userId && (
            <p role="status">
              Your reset link is missing or expired. Request a new link below.
            </p>
          )}
        </form>
      )}
      <nav className="auth-links" aria-label="Account navigation">
        {!signup && (
          <Link to={authLink("signup", next)}>Create an account</Link>
        )}
        {(signup || reset || updating) && (
          <Link to={authLink("login", next)}>
            Already have an account? Log In
          </Link>
        )}
        {!reset && !pending && (
          <Link to={authLink("reset", next)}>Forgot password?</Link>
        )}
        {updating && userId && (
          <Link className="button primary" to={next}>
            Continue to scanner
          </Link>
        )}
        <Link to="/">Explore as a guest</Link>
      </nav>
    </section>
  );
}
