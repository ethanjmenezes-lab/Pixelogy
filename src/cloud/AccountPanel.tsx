import { useState } from "react";
import { Link } from "react-router-dom";
import { cloud } from "./client";
import { useGame } from "../components/GameContext";
export function AccountPanel() {
  const { userId, refresh } = useGame();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function logout() {
    if (!cloud || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await cloud.auth.signOut();
      if (error) throw error;
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-panel">
      <h2>Save Your Progress</h2>
      <p>
        {userId
          ? "Signed in. Existing guest saves are transferred when cloud backup is available; failed transfers remain on this device. Account equipment and appearance take precedence."
          : "Sign in to scan and collect trash, and play across devices. Battles and exploration remain available as a guest. Guest progress stays on this device and can be lost if browser data is cleared."}
      </p>
      {userId ? (
        <>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? "Signing out…" : "Log out"}
          </button>
          <button className="button secondary" onClick={() => void refresh()}>
            Retry guest backup
          </button>
          <Link className="button text" to="/auth/reset?next=%2Fprofile">
            Reset password
          </Link>
        </>
      ) : (
        <div className="button-row">
          <Link className="button primary" to="/auth/login?next=%2Fprofile">
            Log In
          </Link>
          <Link className="button secondary" to="/auth/signup?next=%2Fprofile">
            Sign Up
          </Link>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
