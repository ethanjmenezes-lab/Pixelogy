import { offlineShell } from "./pwa.config.ts";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// Local-only adapter for the exact same serverless handler deployed under api/.
// Activated explicitly by npm run dev:api; bare Vite remains frontend-only.
function localApi(): Plugin {
  return {
    name: "pixelogy-local-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        if (!["/analyze", "/battle", "/story"].includes(req.url ?? "")) {
          next();
          return;
        }
        const respond = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        let size = 0;
        const chunks: Buffer[] = [];
        try {
          for await (const chunk of req) {
            const data = Buffer.from(chunk);
            size += data.length;
            if (size > 2_900_000) {
              respond(413, { error: "Photo is too large." });
              return;
            }
            chunks.push(data);
          }
          let body: unknown;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
          } catch {
            respond(400, { error: "Invalid JSON." });
            return;
          }
          const { default: handler } =
            req.url === "/story"
              ? await import("./api/story.ts")
              : req.url === "/battle"
                ? await import("./api/battle.ts")
                : await import("./api/analyze.ts");
          const response = {
            setHeader: (name: string, value: string) =>
              res.setHeader(name, value),
            status: (code: number) => {
              res.statusCode = code;
              return response;
            },
            json: (value: unknown) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(value));
            },
          };
          await handler(
            { method: req.method, headers: req.headers, body },
            response,
          );
        } catch {
          if (!res.writableEnded)
            respond(500, {
              error: "Local API failed. Retry identification later.",
            });
        }
      });
    },
  };
}
export default defineConfig(({ mode }) => {
  if (mode === "api") {
    const env = loadEnv(mode, process.cwd(), [
      "GEMINI_",
      "ALLOWED_ORIGINS",
      "SUPABASE_",
      "VITE_SUPABASE_",
      "SCAN_SIGNING_SECRET",
    ]);
    for (const key of Object.keys(env))
      if (env[key]) process.env[key] = env[key];
  }
  return {
    cacheDir: mode === "e2e" ? "node_modules/.vite-e2e" : "node_modules/.vite",
    plugins: [
      react(),
      tailwindcss(),
      offlineShell(),
      ...(mode === "api" ? [localApi()] : []),
    ],
  };
});
