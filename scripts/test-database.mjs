import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import process from "node:process";
const db = new PGlite({ extensions: { pgcrypto } });
try {
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create schema extensions;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    process.stdout.write("Applied locally: " + file + "\n");
  }
  for (const file of [
    "rls.sql",
    "conspiracy.sql",
    "walking.sql",
    "guest.sql",
  ]) {
    await db.exec(readFileSync("supabase/tests/" + file, "utf8"));
    process.stdout.write("Passed locally: " + file + "\n");
  }
} catch (error) {
  process.stderr.write(String(error) + "\n");
  process.exitCode = 1;
} finally {
  await db.close();
}
