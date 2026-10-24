import { useState } from "react";
import { cloud } from "./client";
import { useGame } from "../components/GameContext";
export function AccountPanel() {
  const { userId, refresh } = useGame();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(signup: boolean) {
    if (!cloud) return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = signup
        ? await cloud.auth.signUp({ email, password })
        : await cloud.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setPassword("");
      setMessage(
        data.session
          ? "Signed in. Loading your account ShoreDex…"
          : "Check your email to confirm your account, then sign in.",
      );
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-panel">
      <h2>Your Pixelogy account</h2>
      <p>
        Sign in with the same email on another device to restore your ShoreDex,
        equipment and crab progression. Existing device-only saves remain
        separate.
      </p>
      {!cloud ? (
        <p>Supabase is not configured for this deployment.</p>
      ) : userId ? (
        <>
          <p>Signed in · cloud collection</p>
          <button
            className="button secondary"
            onClick={() => void cloud!.auth.signOut().then(() => refresh())}
          >
            Sign out
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
        >
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="button-row">
            <button className="button primary" disabled={busy}>
              Sign in
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={busy || !email || password.length < 8}
              onClick={() => void submit(true)}
            >
              Create account
            </button>
          </div>
        </form>
      )}
      {message && (
        <p role="status" aria-label="Account status">
          {message}
        </p>
      )}
    </section>
  );
}
