/**
 * Resizes an image file client-side and returns it as a data URI.
 *
 * Referenced by BrandingTab.tsx since before this tenant-admin's root `app/`
 * and `src/app/` trees were consolidated (W5) — the import target never
 * existed, which was invisible only because Next.js was silently ignoring
 * `src/app/` (and everything it imported) in favour of a stub at the same
 * route. Implemented now so the unshadowed page actually compiles.
 *
 * Downscales to fit within `maxDimension` on the longest side (logos and
 * avatars don't need to be full resolution) and re-encodes as JPEG at
 * `quality`, which is what keeps the result under the caller's byte budget
 * for images that started large.
 */
export async function resizeImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<string> {
  const { maxDimension = 512, quality = 0.85 } = options;

  const bitmap = await loadImage(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas context");
    ctx.drawImage(bitmap, 0, 0, width, height);

    // SVGs are already vector and typically tiny — re-encoding one as a
    // rasterised JPEG would both bloat it and destroy its scalability, so it
    // passes through unresized instead.
    const mime = file.type === "image/svg+xml" ? "image/svg+xml" : "image/jpeg";
    return mime === "image/svg+xml" ? readAsDataUrl(file) : canvas.toDataURL(mime, quality);
  } finally {
    bitmap.close?.();
  }
}

async function loadImage(file: File): Promise<ImageBitmap> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  // Safari < 15 and a handful of older browsers lack createImageBitmap;
  // fall back to the classic Image element + canvas path.
  const dataUrl = await readAsDataUrl(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not read that image file"));
    img.src = dataUrl;
  });
  return img as unknown as ImageBitmap;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that image file"));
    reader.readAsDataURL(file);
  });
}

function fitWithin(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
