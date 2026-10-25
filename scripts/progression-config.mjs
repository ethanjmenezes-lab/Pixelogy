import { URL } from "node:url";
import console from "node:console";
// Emit an additive settings migration after editing the central configuration.
// Apply the output through the normal migration review workflow.
import { readFileSync } from "node:fs";
const rules = JSON.parse(
  readFileSync(
    new URL("../src/progression/config.json", import.meta.url),
    "utf8",
  ),
);
for (const value of Object.values(rules))
  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Progression rules must be positive finite numbers");
console.log(
  `update private.progression_rules set config='${JSON.stringify(rules)}'::jsonb where id=true;`,
);
