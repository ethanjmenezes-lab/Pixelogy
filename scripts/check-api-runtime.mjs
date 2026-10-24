import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const script = fileURLToPath(import.meta.url);
const root = dirname(dirname(script));

async function modules(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await modules(path)));
    else if (entry.name.endsWith(".js")) result.push(path);
  }
  return result;
}

if (process.argv[2] === "--smoke") {
  // A fresh Node process loads only emitted JavaScript, without Vite/Vitest
  // transforms or Node's TypeScript stripping. Never call the live provider.
  const output = process.argv[3];
  const entries = await modules(join(output, "api"));
  assert.ok(entries.length, "No compiled API entries found");
  for (const entry of entries) {
    await import(pathToFileURL(entry).href);
    process.stdout.write(`Loaded ${relative(output, entry)} in plain Node\n`);
  }
  const { default: handler } = await import(
    pathToFileURL(join(output, "api/analyze.js")).href
  );
  for (const [method, headers, body, expected] of [
    ["GET", {}, {}, 405],
    ["POST", {}, {}, 415],
    ["POST", { "content-type": "application/json" }, { consent: false }, 400],
    [
      "POST",
      { "content-type": "application/json" },
      { consent: true, image: "invalid" },
      400,
    ],
    [
      "POST",
      { "content-type": "application/json" },
      { consent: true, image: "data:image/jpeg;base64,YQ==" },
      503,
    ],
  ]) {
    let status;
    let payload;
    const responseHeaders = new Map();
    const response = {
      setHeader: (key, value) => responseHeaders.set(key, value),
      status: (code) => {
        status = code;
        return response;
      },
      json: (value) => {
        payload = value;
      },
    };
    await handler({ method, headers, body }, response);
    assert.equal(status, expected);
    assert.equal(responseHeaders.get("Cache-Control"), "no-store");
    assert.equal(typeof payload.error, "string");
  }
  process.stdout.write(
    "API runtime smoke: 5 rejection/fallback checks passed\n",
  );
} else {
  const output = await mkdtemp(join(tmpdir(), "pixelogy-api-runtime-"));
  try {
    execFileSync(
      process.execPath,
      [
        join(root, "node_modules/typescript/bin/tsc"),
        "-p",
        join(root, "tsconfig.server.json"),
        "--noEmit",
        "false",
        "--outDir",
        output,
      ],
      { cwd: root, stdio: "inherit" },
    );
    await writeFile(
      join(output, "package.json"),
      JSON.stringify({ type: "module" }),
    );
    await symlink(
      join(root, "node_modules"),
      join(output, "node_modules"),
      "junction",
    );
    execFileSync(
      process.execPath,
      ["--no-experimental-strip-types", script, "--smoke", output],
      {
        cwd: output,
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_OPTIONS: "",
          GEMINI_API_KEY: "",
          ALLOWED_ORIGINS: "",
        },
      },
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}
