import { z } from "zod";
import { shoreCatalog } from "./index.js";
export const objectRecognition = z
  .object({
    objectName: z.string().min(1).max(100),
    material: z.enum([
      "plastic",
      "aluminum",
      "steel",
      "paper",
      "cardboard",
      "carton",
      "foam",
      "fabric",
      "rubber",
      "unknown",
    ]),
    category: z.string().max(60),
    attributes: z.array(z.string().max(60)).max(12),
    confidence: z.number().min(0).max(1),
    ambiguous: z.boolean(),
    safety: z.enum(["allowed", "uncertain", "hazardous"]),
  })
  .strict();
export type ObjectRecognition = z.infer<typeof objectRecognition>;
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const normalize = (s: string) => words(s).join(" ");
export function matchCatalog(result: ObjectRecognition): {
  status: "matched" | "choose" | "unknown" | "blocked";
  candidates: string[];
} {
  if (
    result.safety !== "allowed" ||
    /\b(glass|sharp|battery|batteries|needle|medical|blood|chemical|contaminated|blade|razor)\b/i.test(
      [result.objectName, ...result.attributes].join(" "),
    )
  )
    return { status: "blocked", candidates: [] };
  if (result.confidence < 0.5 || result.material === "unknown")
    return { status: "unknown", candidates: [] };
  const name = normalize(result.objectName),
    tokens = new Set(words(result.objectName));
  const ranked = shoreCatalog
    .filter((c) => c.material === result.material)
    .map((c) => {
      const exact = c.aliases.some((a) => normalize(a) === name);
      const score = Math.max(
        ...c.aliases.map(
          (a) =>
            words(a).filter(
              (w) =>
                tokens.has(w) &&
                ![
                  "empty",
                  "plastic",
                  "paper",
                  "metal",
                  "rubber",
                  "foam",
                  "fabric",
                ].includes(w),
            ).length,
        ),
      );
      return { id: c.id, exact, score };
    })
    .filter((r) => r.exact || r.score >= 2)
    .sort(
      (a, b) =>
        Number(b.exact) - Number(a.exact) ||
        b.score - a.score ||
        a.id.localeCompare(b.id),
    );
  if (!ranked.length) return { status: "unknown", candidates: [] };
  const exact = ranked.filter((r) => r.exact);
  if (exact.length === 1 && result.confidence >= 0.8 && !result.ambiguous)
    return { status: "matched", candidates: [exact[0].id] };
  const best = exact.length
    ? exact
    : ranked.filter((r) => r.score === ranked[0].score);
  return { status: "choose", candidates: best.slice(0, 3).map((r) => r.id) };
}
export const catalogAnalysisSchema = z
  .object({
    status: z.enum(["matched", "choose", "unknown", "blocked"]),
    candidates: z.array(z.string()).max(3),
    payload: z.string().optional(),
    signature: z.string().optional(),
    recognition: objectRecognition,
  })
  .strict();
