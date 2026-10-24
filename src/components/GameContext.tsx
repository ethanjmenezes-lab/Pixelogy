import { defaultProfile, type Profile } from "../world/profile";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { readGame, readProfile, type CleanupClaim } from "../lib/storage";
import type { Collectible, Equipment } from "../lib/gear";
type Game = {
  profile: Profile;
  items: Collectible[];
  claims: CleanupClaim[];
  loadout: Equipment;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};
const Context = createContext<Game | null>(null);
export function GameProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Pick<Game, "items" | "claims" | "loadout">>({
    items: [],
    claims: [],
    loadout: {},
  });
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const next = await readGame();
      setData(next);
      setProfile(await readProfile());
      setError(
        next.repaired
          ? "Some missing equipment was removed from your loadout."
          : "",
      );
    } catch {
      setError(
        "Your ShoreDex could not be opened. Check that browser storage is available, then retry.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <Context.Provider value={{ ...data, profile, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const game = useContext(Context);
  if (!game) throw new Error("Missing game provider");
  return game;
}
