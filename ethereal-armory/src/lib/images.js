export function shopifyImageUrl(url, width) {
  if (!url || !width) return url || "";

  try {
    const imageUrl = new URL(url);
    imageUrl.searchParams.set("width", String(width));
    return imageUrl.toString();
  } catch {
    return url;
  }
}

export function shopifySrcSet(url, widths = [320, 480, 640, 900, 1200]) {
  if (!url) return undefined;
  return widths.map((width) => `${shopifyImageUrl(url, width)} ${width}w`).join(", ");
}
