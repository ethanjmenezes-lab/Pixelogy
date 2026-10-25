import { it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { shoreCatalog, validateCatalog } from "../src/catalog";
import { matchCatalog, type ObjectRecognition } from "../src/catalog/matching";
import { receipt } from "../server/cloud";
import { createHmac } from "node:crypto";
const identify = (
  objectName: string,
  material: ObjectRecognition["material"] = "plastic",
  extra: Partial<ObjectRecognition> = {},
) =>
  matchCatalog({
    objectName,
    material,
    category: "litter",
    attributes: [],
    confidence: 0.98,
    ambiguous: false,
    safety: "allowed",
    ...extra,
  });
it("has 200 stable distinct entries with real SVG assets and explicit art status", () => {
  expect(() => validateCatalog()).not.toThrow();
  expect(shoreCatalog).toHaveLength(200);
  for (const c of shoreCatalog) {
    expect(existsSync("public" + c.sprite)).toBe(true);
    expect(readFileSync("public" + c.sprite, "utf8")).toContain("<svg");
  }
  expect(
    shoreCatalog.filter((c) => c.spriteStatus === "finished"),
  ).toHaveLength(48);
  expect(
    new Set(shoreCatalog.map((c) => readFileSync("public" + c.sprite, "utf8")))
      .size,
  ).toBe(200);
});
it("matches canonical names and aliases without inventing species", () => {
  for (const c of shoreCatalog)
    expect(
      identify(c.name, c.material as ObjectRecognition["material"]),
    ).toEqual({ status: "matched", candidates: [c.id] });
  expect(identify("plastic bag").candidates).toEqual(["grocery-bag"]);
  expect(identify("a strange shiny thing", "unknown")).toEqual({
    status: "unknown",
    candidates: [],
  });
  expect(identify("space toaster", "steel").status).toBe("unknown");
});
it("uncertain identity only offers catalog candidates; unsafe objects never reward", () => {
  expect(identify("grocery bag", "plastic", { ambiguous: true }).status).toBe(
    "choose",
  );
  expect(identify("grocery bag", "plastic", { confidence: 0.3 }).status).toBe(
    "unknown",
  );
  for (const safety of ["uncertain", "hazardous"] as const)
    expect(identify("grocery bag", "plastic", { safety }).candidates).toEqual(
      [],
    );
  expect(
    identify("water bottle", "plastic", { attributes: ["chemical residue"] }),
  ).toEqual({ status: "blocked", candidates: [] });
});
it("signs the exact user, candidate and expiry payload; edits invalidate signature", () => {
  const old = process.env.SCAN_SIGNING_SECRET;
  process.env.SCAN_SIGNING_SECRET = "unit-test-secret";
  try {
    const signed = receipt({
      purpose: "discovery",
      userId: "owner",
      candidates: ["grocery-bag"],
    });
    expect(JSON.parse(signed.payload).expires).toBeGreaterThan(
      Date.now() / 1000,
    );
    expect(
      createHmac("sha256", "unit-test-secret")
        .update(signed.payload)
        .digest("hex"),
    ).toBe(signed.signature);
    expect(
      createHmac("sha256", "unit-test-secret")
        .update(signed.payload.replace("owner", "other"))
        .digest("hex"),
    ).not.toBe(signed.signature);
  } finally {
    if (old === undefined) delete process.env.SCAN_SIGNING_SECRET;
    else process.env.SCAN_SIGNING_SECRET = old;
  }
});

it("contains eight finished canonical Legendaries with distinct safe identities", () => {
  const legendary = shoreCatalog.filter((c) => c.rarity === "legendary");
  expect(legendary).toHaveLength(8);
  expect(
    new Set(legendary.map((c) => readFileSync("public" + c.sprite, "utf8")))
      .size,
  ).toBe(8);
  for (const c of legendary) {
    expect(c.spriteStatus).toBe("finished");
    expect(
      identify(c.name, c.material as ObjectRecognition["material"]).candidates,
    ).toEqual([c.id]);
    expect(c.name).not.toMatch(/glass|battery|chemical|blade/i);
  }
});
