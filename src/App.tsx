import { Recovery, RecoveryRedirect } from "./pages/Recovery";
import { PwaUpdate } from "./pwa/PwaUpdate";
import { NativeLifecycle } from "./mobile/NativeLifecycle";
import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { GameProvider, useGame } from "./components/GameContext";
import { OverworldScreen } from "./world/OverworldScreen";
import { Scan } from "./pages/Scan";
import { Collection } from "./pages/Collection";
import { Workshop } from "./pages/Workshop";
import { Battle } from "./pages/Battle";
import { Leaderboard } from "./pages/Leaderboard";
import { Auth } from "./pages/Auth";
import { Profile } from "./pages/Profile";
import { Story } from "./story/Story";
const titles: Record<string, string> = {
  "/auth/confirm": "Password recovery",
  "/reset-password": "Set New Password",
  "/auth/login": "Log In",
  "/auth/signup": "Sign Up",
  "/auth/reset": "Password reset",
  "/auth/callback": "Confirm account",
  "/auth/update-password": "New password",
  "/story": "The Blacktide Conspiracy",
  "/scan": "Field scanner",
  "/collection": "ShoreDex",
  "/workshop": "My crab",
  "/battle/practice": "Training grounds",
  "/leaderboard": "Cleanup champions",
  "/profile": "Your explorer",
};
function Layout() {
  const { loading, error, refresh, profile } = useGame();
  const location = useLocation();
  const authRoute =
    location.pathname.startsWith("/auth/") ||
    location.pathname === "/reset-password";
  const covered = location.pathname !== "/";
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (covered) {
      panel.current?.scrollTo(0, 0);
      panel.current?.focus();
    }
  }, [location.pathname, covered]);
  return (
    <div
      className={`game-device ${profile.motion === "reduced" ? "reduced-motion" : ""}`}
    >
      <RecoveryRedirect />
      <NativeLifecycle />
      <PwaUpdate />
      <a
        tabIndex={0}
        className="skip-link"
        href={covered ? "#feature-content" : "#world-controls"}
      >
        Skip to controls
      </a>
      {loading && !authRoute ? (
        <div className="game-loading">Opening Pixelogy…</div>
      ) : (
        <>
          <OverworldScreen covered={covered} />
          {covered && (
            <section
              className="feature-overlay"
              aria-label={titles[location.pathname] ?? "Game screen"}
            >
              <header className="feature-header">
                <Link to="/" className="back-world" aria-label="Back to world">
                  ‹ <span>WORLD</span>
                </Link>
                <strong>{titles[location.pathname] ?? "Pixelogy"}</strong>
                <span className="header-pixel">✦</span>
              </header>
              <div
                ref={panel}
                tabIndex={-1}
                id="feature-content"
                className="feature-content"
              >
                <Routes>
                  <Route path="/auth/confirm" element={<Recovery />} />
                  <Route path="/reset-password" element={<Recovery />} />
                  <Route path="/auth/update-password" element={<Recovery />} />
                  <Route path="/auth/*" element={<Auth />} />
                  <Route path="/story" element={<Story />} />
                  <Route path="/scan" element={<Scan />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/workshop" element={<Workshop />} />
                  <Route path="/battle/practice" element={<Battle />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="*"
                    element={
                      <div className="empty-state">
                        <h1>Off the trail?</h1>
                        <Link to="/" className="button primary">
                          Back to the coast
                        </Link>
                      </div>
                    }
                  />
                </Routes>
              </div>
            </section>
          )}
        </>
      )}
      {error && (
        <div className="storage-banner" role="alert">
          {error}
          <button onClick={() => void refresh()}>Retry</button>
        </div>
      )}
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Layout />
      </GameProvider>
    </BrowserRouter>
  );
}
