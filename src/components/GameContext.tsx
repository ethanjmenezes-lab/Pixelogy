import { backupGuest } from "../guest/backup";
import { emptyPlayer, type PlayerProgress } from "../progression/model";
import { cloud, cloudSession } from "../cloud/client";
import { fetchCloudGame } from "../cloud/game";
import { initialProgression, type BattleProgression } from "../lib/moves";
import { defaultProfile, type Profile } from "../world/profile";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { readGame, readProfile, type CleanupClaim } from "../lib/storage";
import type { Collectible, Equipment } from "../lib/gear";
type Game = {
  player: PlayerProgress;
  userId: string | null;
  cloudOffline: boolean;
  progression: BattleProgression;
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
  const [data, setData] = useState<
    Pick<Game, "items" | "claims" | "loadout" | "progression" | "player">
  >({
    progression: initialProgression(),
    player: emptyPlayer(),
    items: [],
    claims: [],
    loadout: {},
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [cloudOffline, setCloudOffline] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0),
    identity = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      const session = await cloudSession();
      if (version !== generation.current) return;
      const id = session?.user.id ?? null;
      if (identity.current !== id) {
        identity.current = id;
        setData({
          items: [],
          claims: [],
          loadout: {},
          progression: initialProgression(),
          player: emptyPlayer(),
        });
        setProfile(defaultProfile);
        setLoading(true);
      }
      setUserId(id);
      if (session)
        await backupGuest().catch((e) => {
          throw new Error(
            "Guest backup needs a retry. Your device save is intact. " +
              (e as Error).message,
          );
        });
      const remote = session ? await fetchCloudGame() : null;
      const next = remote ?? (await readGame());
      const appearance = remote?.profile ?? (await readProfile());
      if (version !== generation.current) return;
      setCloudOffline(remote?.offline ?? false);
      setData(next);
      setProfile(appearance);
      setError(
        next.repaired
          ? "Some missing equipment was removed from your loadout."
          : "",
      );
    } catch (error) {
      if (version === generation.current)
        setError(
          identity.current
            ? "Your account save could not be loaded. Check connectivity and Supabase setup. " +
                (error instanceof Error ? error.message : "")
            : "Your ShoreDex could not be opened. Check browser storage, then retry.",
        );
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const listener = cloud?.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (identity.current !== id) {
        generation.current++;
        identity.current = id;
        setUserId(id);
        setData({
          items: [],
          claims: [],
          loadout: {},
          progression: initialProgression(),
          player: emptyPlayer(),
        });
        setProfile(defaultProfile);
        setLoading(true);
      }
      setTimeout(() => void refresh(), 0);
    });
    return () => listener?.data.subscription.unsubscribe();
  }, [refresh]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <Context.Provider
      value={{
        ...data,
        userId,
        cloudOffline,
        profile,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const game = useContext(Context);
  if (!game) throw new Error("Missing game provider");
  return game;
}
