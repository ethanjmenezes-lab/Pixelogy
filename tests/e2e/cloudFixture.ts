// Network fixtures only: never compiled into the application.
import { type Page } from "@playwright/test";
import {
  createBattle,
  resolveTurn,
  cpuAction,
  type BattleState,
} from "../../src/lib/battle";
import { statsFor, type Equipment, type Collectible } from "../../src/lib/gear";
import { defaultProfile } from "../../src/world/profile";
export async function mockAccount(
  page: Page,
  catalogId = "grocery-bag",
  signedIn = true,
) {
  const userId = "11111111-1111-4111-8111-111111111111",
    discoveryId = "22222222-2222-4222-8222-222222222222";
  const user = {
    id: userId,
    email: "fixture@example.test",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = [
    "eyJhbGciOiJIUzI1NiJ9",
    Buffer.from(JSON.stringify({ sub: userId, exp: 4102444800 })).toString(
      "base64url",
    ),
    "fixture",
  ].join(".");
  if (signedIn)
    await page.addInitScript(
      ({ user, token }) =>
        localStorage.setItem(
          "sb-rsdgbxpqpdewqpmeuwvp-auth-token",
          JSON.stringify({
            access_token: token,
            refresh_token: "fixture-refresh",
            expires_at: 4102444800,
            expires_in: 999999,
            token_type: "bearer",
            user,
          }),
        ),
      { user, token },
    );
  const state: {
    discoveries: Array<Record<string, unknown>>;
    equipment: Array<Record<string, unknown>>;
    claims: Array<Record<string, unknown>>;
    xp: number;
    playerXp: number;
    walkingMm: number;
    special: string;
    appearance: typeof defaultProfile;
  } = {
    discoveries: [],
    equipment: [],
    claims: [],
    xp: 0,
    playerXp: 0,
    walkingMm: 0,
    special: "tidal_slam",
    appearance: defaultProfile,
  };
  const receipts = new Map<string, string>();
  const walked = new Set<string>();
  await page.route(
    "https://rsdgbxpqpdewqpmeuwvp.supabase.co/**",
    async (route) => {
      const url = new URL(route.request().url()),
        path = url.pathname,
        body = route.request().postDataJSON();
      if (path.endsWith("/token"))
        return route.fulfill({
          json: {
            access_token: token,
            refresh_token: "fixture-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user,
          },
        });
      if (path.endsWith("/logout")) return route.fulfill({ json: {} });
      if (path.startsWith("/auth/")) return route.fulfill({ json: user });
      if (path.includes("/rpc/")) {
        const fn = path.split("/").pop();
        if (fn === "credit_walk") {
          if (walked.has(body.event_id))
            return route.fulfill({ json: { playerXp: 0, crabXp: 0 } });
          walked.add(body.event_id);
          const before = Math.floor(state.walkingMm / 100000);
          state.walkingMm += body.distance_mm;
          const count = Math.floor(state.walkingMm / 100000) - before;
          state.playerXp += count * 8;
          state.xp += count * 5;
          return route.fulfill({
            json: { playerXp: count * 8, crabXp: count * 5 },
          });
        }
        if (fn === "award_discovery") {
          if (body.catalog_id !== catalogId)
            return route.fulfill({
              status: 400,
              json: { message: "Not a validated candidate" },
            });
          const isNew = !state.discoveries.length;
          let id = receipts.get(body.payload);
          if (!id) {
            id = state.discoveries.length ? crypto.randomUUID() : discoveryId;
            receipts.set(body.payload, id);
            state.discoveries.push({
              id,
              user_id: userId,
              catalog_id: catalogId,
              discovered_at: new Date().toISOString(),
            });
          }
          return route.fulfill({
            json: { id, catalogId, isNew },
          });
        }
        if (fn === "equip_discovery") {
          state.equipment = body.discovery
            ? [{ slot: body.slot_name, discovery_id: body.discovery }]
            : [];
          state.special = body.discovery ? "bag_snare" : "tidal_slam";
        }
        if (fn === "save_appearance") state.appearance = body.appearance;
        if (fn === "claim_cleanup" || fn === "claim_cleanup_state") {
          if (!state.claims.length)
            state.claims.push({
              state_code: body.state_code ?? null,
              id: crypto.randomUUID(),
              discovery_id: discoveryId,
              user_id: userId,
              category: "plastic_bag",
              xp: 15,
              claimed_at: new Date().toISOString(),
            });
          return route.fulfill({ json: state.claims[0] });
        }
        return route.fulfill({ json: null });
      }
      const table = path.split("/").pop();
      const values: Record<string, unknown> = {
        player_discoveries: state.discoveries,
        crab_equipment: state.equipment,
        cleanup_claims: state.claims,
        player_progression: [
          {
            battle_xp: state.xp,
            player_xp: state.playerXp,
            walking_mm: state.walkingMm,
          },
        ],
        selected_moves: [{ main: "pinch", special: state.special }],
        player_profiles: [{ appearance: state.appearance }],
      };
      return route.fulfill({ json: values[table!] ?? [] });
    },
  );
  let battle: BattleState | null = null;
  await page.route("**/api/battle", (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "start") {
      const gear = state.equipment.length ? ["bag_helm"] : [],
        items = gear.length
          ? [{ id: discoveryId, gearBlueprintId: "bag_helm" } as Collectible]
          : [],
        loadout: Equipment = gear.length ? { head: discoveryId } : {};
      battle = createBattle(statsFor(loadout, items), Object.values(loadout), {
        level: 1,
        blueprints: gear,
        moves: ["pinch", "guard", gear.length ? "bag_snare" : "tidal_slam"],
      });
    } else if (battle && body.version === battle.version) {
      battle =
        body.action === "quit"
          ? {
              ...battle,
              status: "forfeited",
              currentActorId: null,
              version: battle.version + 1,
            }
          : resolveTurn(battle, "player", body.move);
      if (battle.status === "active" && battle.currentActorId === "cpu")
        battle = resolveTurn(battle, "cpu", cpuAction(battle));
      if (battle.status === "completed")
        state.xp += battle.winnerId === "player" ? 40 : 15;
    }
    return route.fulfill({ json: battle });
  });
  return state;
}
