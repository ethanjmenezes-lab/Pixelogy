import { z } from "zod";
import { categories } from "./gear.js";
import { boxToCrop } from "./pixel.js";
export const recognitionSchema = z
  .object({
    label: z.string().min(1).max(80),
    category: z.enum(categories),
    subtype: z.enum(["magazine"]).nullable(),
    safety: z.enum(["allowed", "hazardous", "uncertain"]),
    bbox: z.tuple([
      z.number().min(0).max(1000),
      z.number().min(0).max(1000),
      z.number().min(0).max(1000),
      z.number().min(0).max(1000),
    ]),
  })
  .strict()
  .superRefine((v, ctx) => {
    try {
      boxToCrop(v.bbox);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid bounding box" });
    }
    if (v.subtype && v.category !== "paper_cardboard")
      ctx.addIssue({ code: "custom", message: "Invalid subtype" });
  });
export const analyzeRequest = z
  .object({
    consent: z.literal(true),
    image: z
      .string()
      .max(2_800_000)
      .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/),
  })
  .strict();
