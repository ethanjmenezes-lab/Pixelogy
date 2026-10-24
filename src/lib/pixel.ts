export type Crop = { x: number; y: number; width: number; height: number };
export function boxToCrop(box: number[]): Crop {
  if (
    box.length !== 4 ||
    box.some((v) => !Number.isFinite(v) || v < 0 || v > 1000)
  )
    throw new Error("Invalid object bounds.");
  const [y1, x1, y2, x2] = box;
  if (x2 <= x1 || y2 <= y1) throw new Error("Empty object bounds.");
  return {
    x: x1 / 10,
    y: y1 / 10,
    width: (x2 - x1) / 10,
    height: (y2 - y1) / 10,
  };
}
export function validCrop(c: Crop) {
  return (
    Object.values(c).every(Number.isFinite) &&
    c.x >= 0 &&
    c.y >= 0 &&
    c.width >= 1 &&
    c.height >= 1 &&
    c.x + c.width <= 100.01 &&
    c.y + c.height <= 100.01
  );
}
export async function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
export async function normalizePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Choose a JPG, PNG or WebP photo. Convert HEIC to JPG first.",
    );
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Please choose a photo smaller than 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (
      !image.width ||
      !image.height ||
      image.width * image.height > 40_000_000
    )
      throw new Error("Please choose a smaller image (up to 40 megapixels).");
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function pixelate(source: string, crop: Crop): Promise<Blob> {
  if (!validCrop(crop)) throw new Error("Choose a valid crop.");
  const image = await loadImage(source);
  const tiny = document.createElement("canvas");
  tiny.width = 40;
  tiny.height = 40;
  const ctx = tiny.getContext("2d")!;
  ctx.fillStyle = "#e5eee0";
  ctx.fillRect(0, 0, 40, 40);
  const sw = (image.width * crop.width) / 100,
    sh = (image.height * crop.height) / 100;
  const scale = Math.min(36 / sw, 36 / sh);
  ctx.drawImage(
    image,
    (image.width * crop.x) / 100,
    (image.height * crop.y) / 100,
    sw,
    sh,
    (40 - sw * scale) / 2,
    (40 - sh * scale) / 2,
    sw * scale,
    sh * scale,
  );
  const output = document.createElement("canvas");
  output.width = 256;
  output.height = 256;
  const o = output.getContext("2d")!;
  o.imageSmoothingEnabled = false;
  o.drawImage(tiny, 0, 0, 256, 256);
  return new Promise((resolve, reject) =>
    output.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not render the card."))),
      "image/png",
    ),
  );
}
