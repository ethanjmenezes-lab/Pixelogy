import process from "node:process";
import { mkdirSync, writeFileSync } from "node:fs";
// Stable, authored species list. Brands and random colors never create species.
const groups = [
  [
    "bottles",
    "plastic",
    "plastic_bottle",
    "bottle_blade",
    "Water bottle|Soda bottle|Sports drink bottle|Juice bottle|Iced tea bottle|Sparkling water bottle|Smoothie bottle|Kefir bottle|Drinkable yogurt bottle|Coffee drink bottle",
  ],
  [
    "jugs",
    "plastic",
    "other_litter",
    null,
    "Milk jug|Water jug|Juice jug|Empty dish soap bottle|Empty shampoo bottle|Empty conditioner bottle|Empty hand soap bottle|Empty laundry detergent jug|Empty body wash bottle|Empty lotion bottle",
  ],
  [
    "caps",
    "plastic",
    "bottle_cap",
    "cap_boots",
    "Water bottle cap|Sports spout cap|Milk jug cap|Juice bottle cap|Flip top drink cap|Wide mouth jar cap|Soda bottle cap|Coffee bottle cap|Smoothie bottle cap|Dispensing pump cap",
  ],
  [
    "cups",
    "plastic",
    "disposable_cup",
    "cup_crown",
    "Clear drink cup|Cold coffee cup|Smoothie cup|Bubble tea cup|Slush cup|Water cooler cup|Sample cup|Ice cream cup|Dessert cup|Fruit cup",
  ],
  [
    "tubs",
    "plastic",
    "other_litter",
    null,
    "Yogurt tub|Margarine tub|Hummus tub|Cream cheese tub|Dip tub|Ice cream tub|Deli salad tub|Soup tub|Nut butter tub|Sour cream tub",
  ],
  [
    "trays",
    "plastic",
    "other_litter",
    null,
    "Berry punnet|Salad clamshell|Sandwich clamshell|Cookie tray|Cake slice tray|Sushi tray|Biscuit insert tray|Produce tray|Chocolate insert tray|Pastry clamshell",
  ],
  [
    "bags",
    "plastic",
    "plastic_bag",
    "bag_helm",
    "Grocery bag|Produce bag|Bread bag|Bagel bag|Sandwich bag|Freezer bag|Cereal liner bag|Rice bag|Pasta bag|Ice bag",
  ],
  [
    "films",
    "plastic",
    "food_wrapper",
    "wrapper_vest",
    "Cling film|Shrink wrap sleeve|Bottle multipack wrap|Magazine mailing wrap|Stretch packing film|Cup sealing film|Cheese film|Snack pack film|Bakery window film|Protective shipping sleeve",
  ],
  [
    "wrappers",
    "plastic",
    "food_wrapper",
    "wrapper_vest",
    "Crisp packet|Candy wrapper|Chocolate wrapper|Granola bar wrapper|Biscuit wrapper|Cracker wrapper|Instant noodle packet|Fruit snack pouch|Trail mix pouch|Coffee sachet",
  ],
  [
    "cans",
    "aluminum",
    "aluminum_can",
    "can_shield",
    "Soda can|Sparkling water can|Energy drink can|Iced tea can|Juice can|Coffee can|Sports drink can|Lemonade can|Coconut water can|Mini beverage can",
  ],
  [
    "metal_packaging",
    "steel",
    "other_litter",
    null,
    "Rounded mint tin|Rounded tea tin|Biscuit tin|Chocolate tin|Candy tin|Coffee storage tin|Spice tin|Gift tin|Metal balm tin|Rounded pencil tin",
  ],
  [
    "paper",
    "paper",
    "paper_cardboard",
    "cardboard_shell",
    "Newspaper sheet|Receipt|Paper flyer|Notebook sheet|Envelope|Paper ticket|Paper napkin|Paper shopping bag|Paper sleeve|Paper straw wrapper",
  ],
  [
    "magazines",
    "paper",
    "paper_cardboard",
    "magazine_mail",
    "Magazine|Brochure|Travel brochure|Product booklet|Event program|Coupon booklet|Store catalog|Recipe booklet|Community newsletter|Folded leaflet",
  ],
  [
    "cardboard",
    "cardboard",
    "paper_cardboard",
    "cardboard_shell",
    "Shipping box|Cereal box|Shoe box|Tissue box|Toothpaste box|Cracker box|Cardboard tube|Egg carton|Pizza box|Cardboard cup carrier",
  ],
  [
    "cartons",
    "carton",
    "paper_cardboard",
    "cardboard_shell",
    "Milk carton|Juice carton|Small juice box|Cream carton|Oat drink carton|Soy drink carton|Coconut drink carton|Soup carton|Broth carton|Water carton",
  ],
  [
    "straws",
    "plastic",
    "straw",
    "straw_spear",
    "Straight straw|Bendy straw|Wide smoothie straw|Bubble tea straw|Short drink straw|Juice box straw|Spiral straw|Spoon straw|Reusable plastic straw|Coffee stirrer straw",
  ],
  [
    "utensils",
    "plastic",
    "other_litter",
    null,
    "Plastic fork|Plastic spoon|Plastic spork|Plastic chopstick|Coffee stirrer|Ice cream spoon|Tasting spoon|Salad server|Measuring scoop|Rounded spreader",
  ],
  [
    "foam",
    "foam",
    "other_litter",
    null,
    "Foam cup|Foam clamshell|Foam tray|Foam bowl|Foam packing peanut|Foam packing corner|Foam sheet|Foam fruit sleeve|Foam drink holder|Foam packing ring",
  ],
  [
    "textiles",
    "fabric",
    "other_litter",
    null,
    "Cotton fabric scrap|Denim scrap|Felt scrap|Ribbon scrap|Loose shoelace|Fabric label|Elastic fabric band|Canvas scrap|Thread spool|Yarn offcut",
  ],
  [
    "rubber",
    "rubber",
    "other_litter",
    null,
    "Rubber band|Wide rubber band|Rubber washer|Rubber jar ring|Rubber eraser|Rubber shoe sole scrap|Rubber grip sleeve|Rubber furniture foot|Rubber stopper|Rubber mat scrap",
  ],
];
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const colors = [
  "#25c6b2",
  "#f58a08",
  "#a9ddab",
  "#9984cc",
  "#72b8dd",
  "#edb976",
  "#e87972",
  "#f0db8c",
  "#8badc8",
  "#b6d18b",
];
// Twenty original pixel silhouettes. Finished art: first two authored variants per family.
function art(family, v) {
  const c = colors[v],
    dark = "#282044",
    cream = "#fff8df";
  const rect = (x, y, w, h, fill = c) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
  let body = "";
  if (["bottles", "jugs"].includes(family))
    body =
      rect(13, 3, 6, 4, dark) +
      rect(14, 4, 4, 3) +
      rect(12, 7, 8, 4, dark) +
      rect(9, 11, 14, 18, dark) +
      rect(10, 12, 12, 16) +
      rect(11, 17, 10, 7, cream) +
      rect(11, 12, 2, 4, "#ffffff99") +
      (family === "jugs"
        ? rect(21, 10, 6, 12, dark) + rect(23, 12, 2, 8, cream)
        : "");
  else if (["caps", "rubber"].includes(family))
    body =
      rect(7, 8, 18, 17, dark) +
      rect(5, 11, 22, 11, dark) +
      rect(8, 9, 16, 15) +
      rect(6, 12, 20, 9) +
      rect(11, 12, 10, 9, family === "rubber" ? cream : dark) +
      rect(12, 13, 8, 7, family === "rubber" ? cream : c) +
      rect(7, 23, 18, 3, dark);
  else if (["cups", "foam"].includes(family))
    body =
      `<path d="M5 8h22v5h-2v8h-2v7H9v-7H7v-8H5z" fill="${dark}"/><path d="M7 10h18v3h-2v8h-2v5H11v-5H9v-8H7z" fill="${c}"/>` +
      rect(10, 15, 12, 6, cream) +
      rect(4, 7, 24, 3, dark) +
      rect(6, 8, 20, 1, cream);
  else if (["tubs", "metal_packaging"].includes(family))
    body =
      rect(5, 10, 22, 17, dark) +
      rect(6, 11, 20, 15) +
      rect(4, 8, 24, 4, dark) +
      rect(6, 9, 20, 2, cream) +
      rect(9, 16, 14, 6, cream) +
      rect(10, 17, 6, 2, c);
  else if (family === "trays")
    body =
      rect(3, 8, 26, 20, dark) +
      rect(4, 9, 24, 18) +
      rect(6, 11, 20, 14, cream) +
      rect(7, 12, 18, 12, c) +
      rect(7, 12, 6, 2, "#ffffff99");
  else if (family === "bags")
    body =
      `<path d="M7 3h6v8h6V3h6v9h3v17H4V12h3z" fill="${dark}"/><path d="M8 4h4v9h8V4h4v9h3v15H5V13h3z" fill="${c}"/>` +
      rect(9, 17, 14, 6, cream);
  else if (["films", "wrappers"].includes(family))
    body =
      `<path d="M4 7h4V5h20v4h-2v4h2v12h-4v3H4v-5h2V11H4z" fill="${dark}"/><path d="M6 8h3V7h17v3h-2v4h2v9h-3v3H6v-3h2V10H6z" fill="${c}"/>` +
      rect(9, 13, 14, 9, cream) +
      rect(11, 15, 10, 2, c) +
      rect(11, 19, 6, 1, dark);
  else if (family === "cans")
    body =
      rect(9, 4, 14, 25, dark) +
      rect(10, 5, 12, 23) +
      rect(10, 5, 12, 3, cream) +
      rect(10, 25, 12, 3, cream) +
      rect(12, 6, 5, 1, dark) +
      rect(11, 13, 10, 8, cream) +
      rect(13, 15, 6, 4, c);
  else if (["paper", "magazines"].includes(family))
    body =
      rect(6, 4, 21, 25, dark) +
      rect(7, 5, 19, 23, cream) +
      rect(5, 7, 2, 21, c) +
      rect(9, 7, 15, 7, family === "paper" ? "#d9d3c5" : c) +
      rect(9, 16, 15, 1, dark) +
      rect(9, 19, 15, 1, dark) +
      rect(9, 22, 7, 1, dark) +
      rect(18, 22, 6, 4, c);
  else if (family === "cardboard")
    body =
      `<path d="M5 9h22v19H5zM5 9l5-5h13l4 5z" fill="${dark}"/>` +
      rect(6, 10, 20, 17, "#c99860") +
      rect(14, 10, 4, 17, cream) +
      rect(10, 5, 13, 3, "#edbd83") +
      rect(8, 21, 5, 3, dark);
  else if (family === "cartons")
    body =
      `<path d="M9 4h13l4 7v18H6V11z" fill="${dark}"/><path d="M10 6h11l3 6v15H8V12z" fill="${c}"/>` +
      rect(9, 15, 14, 9, cream) +
      rect(10, 4, 11, 2, cream);
  else if (family === "straws")
    body =
      rect(8, 3, 5, 7, dark) +
      rect(10, 8, 5, 5, dark) +
      rect(13, 11, 5, 18, dark) +
      rect(9, 4, 3, 5) +
      rect(11, 9, 3, 3) +
      rect(14, 12, 3, 16);
  else if (family === "utensils")
    body =
      rect(13, 13, 5, 17, dark) +
      rect(14, 14, 3, 15) +
      rect(8, 4, 15, 11, dark) +
      rect(9, 5, 13, 9) +
      (v % 2 === 0
        ? rect(11, 3, 2, 7, cream) + rect(17, 3, 2, 7, cream)
        : rect(11, 6, 9, 5, cream));
  else if (family === "textiles")
    body =
      `<path d="M4 9h5V5h14v4h5v17h-5v3H8v-4H4z" fill="${dark}"/>` +
      rect(6, 10, 20, 14) +
      rect(10, 6, 12, 21) +
      rect(8, 12, 16, 1, cream) +
      rect(8, 18, 16, 1, cream) +
      rect(11, 9, 1, 15, cream) +
      rect(19, 9, 1, 15, cream);
  if (family === "foam" && v > 0)
    body =
      rect(4, 8, 24, 20, dark) +
      rect(5, 9, 22, 18, cream) +
      rect(7, 11, 18, 6, "#e4dbc5") +
      rect(5, 18, 22, 2, dark) +
      rect(7, 21, 18, 4, "#e4dbc5") +
      rect(13, 20, 6, 2, c);
  if (family === "metal_packaging")
    body =
      rect(5, 7, 22, 21, dark) +
      rect(6, 8, 20, 19, c) +
      rect(7, 9, 18, 17, cream) +
      rect(9, 11, 14, 13, c) +
      rect(6, 7, 20, 3, "#b9b4c9") +
      rect(10, 15, 12, 5, cream);
  if (family === "films")
    body =
      `<path d="M5 5h20v4h3v16h-5v3H6v-4H3V8h2z" fill="${dark}"/><path d="M6 6h18v4h3v14h-5v3H7v-4H4V9h2z" fill="#c5eee4"/>` +
      rect(6, 7, 4, 17, c) +
      rect(20, 10, 3, 12, c) +
      rect(11, 9, 2, 13, cream);
  // Finished starter variants have recognizable construction details.
  if (family === "paper" && v === 1)
    body =
      rect(11, 3, 11, 26, dark) +
      rect(12, 4, 9, 24, cream) +
      rect(13, 7, 7, 1, dark) +
      rect(13, 10, 7, 1, dark) +
      rect(13, 13, 5, 1, dark) +
      rect(13, 20, 7, 2, dark);
  if (family === "cardboard" && v === 1)
    body =
      rect(9, 3, 15, 26, dark) +
      rect(10, 4, 13, 24, c) +
      rect(11, 7, 11, 7, cream) +
      rect(11, 17, 11, 8, cream) +
      rect(13, 18, 7, 6, "#d6ad73");
  if (family === "straws" && v === 0)
    body =
      rect(13, 3, 5, 26, dark) +
      rect(14, 4, 3, 24, c) +
      rect(14, 5, 1, 22, cream);
  if (family === "bags" && v === 1)
    body =
      rect(7, 5, 19, 24, dark) +
      rect(8, 6, 17, 22, c) +
      rect(9, 7, 15, 2, cream) +
      rect(9, 11, 1, 15, cream) +
      rect(22, 11, 1, 15, cream);
  if (family === "caps" && v === 1)
    body =
      rect(6, 17, 21, 11, dark) +
      rect(7, 18, 19, 9, c) +
      rect(12, 9, 10, 9, dark) +
      rect(13, 10, 8, 8, cream) +
      rect(14, 4, 6, 6, dark) +
      rect(15, 5, 4, 5, c);
  if (family === "magazines" && v === 1)
    body += rect(15, 5, 1, 23, dark) + rect(17, 7, 7, 6, c);
  if (family === "foam" && v === 0) body = body.replaceAll(c, cream);
  if (family === "textiles" && v === 1) body = body.replaceAll(c, "#5790b8");
  // Variant-specific original pixel markings. Draft families remain explicitly flagged.
  body += rect(14, 19, 2 + (v % 3), 2, dark) + rect(18, 21, 1, 1, c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${body}</svg>`;
}
mkdirSync("public/shoredex", { recursive: true });
mkdirSync("src/catalog", { recursive: true });
const records = [];
for (const [family, material, gearCategory, gearId, names] of groups)
  names.split("|").forEach((name, v) => {
    const id = normalize(name),
      number = records.length + 1;
    const aliases = [name.toLowerCase()];
    if (id === "water-bottle")
      aliases.push("plastic water bottle", "pet water bottle");
    if (id === "grocery-bag")
      aliases.push("plastic bag", "shopping bag", "carrier bag");
    if (id === "soda-can")
      aliases.push("aluminum beverage can", "soft drink can");
    if (id === "magazine") aliases.push("glossy magazine");
    const row = {
      id,
      number,
      name,
      category: family,
      subtype: id,
      material,
      aliases,
      rarity: v === 9 ? "rare" : v >= 6 ? "uncommon" : "common",
      description: `A recognizable ${name.toLowerCase()}. Only empty, clean, intact nonhazardous litter is eligible. Never handle unsafe waste for a reward.`,
      gearCategory,
      gearId,
      sprite: `/shoredex/${id}.svg`,
      spriteStatus: v < 2 ? "finished" : "draft",
    };
    records.push(row);
    writeFileSync(`public/shoredex/${id}.svg`, art(family, v));
  });
writeFileSync(
  "src/catalog/catalog.json",
  JSON.stringify(records, null, 2) + "\n",
);
process.stdout.write(
  `${records.length} catalog entries; ${records.filter((r) => r.spriteStatus === "finished").length} finished sprites, ${records.filter((r) => r.spriteStatus === "draft").length} explicitly draft sprites.`,
);
