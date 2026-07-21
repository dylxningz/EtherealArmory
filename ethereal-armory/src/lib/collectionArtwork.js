function normalizePathname(pathname) {
  return pathname.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|master|\d+x\d*|x\d+)(?=\.[a-z\d]{2,5}$)/i, "");
}

export function normalizeShopifyImageUrl(value = "") {
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("//") ? `https:${value}` : value);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    url.pathname = normalizePathname(url.pathname);
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0].toLowerCase();
  }
}

export function getImageIdentityKeys(image) {
  if (!image?.url) return [];
  const keys = [`url:${normalizeShopifyImageUrl(image.url)}`];
  if (image.id) keys.unshift(`id:${image.id}`);
  return keys;
}

function getProductCandidates(collection) {
  const candidates = [];
  const localKeys = new Set();
  for (const product of collection?.products?.nodes || []) {
    const images = [product?.featuredImage, ...(product?.images?.nodes || [])];
    for (const image of images) {
      const keys = getImageIdentityKeys(image);
      if (!keys.length || keys.some((key) => localKeys.has(key))) continue;
      keys.forEach((key) => localKeys.add(key));
      candidates.push({ image, source: "product", productTitle: product.title || null, productId: product.id || null });
    }
  }
  return candidates;
}

function claimArtwork(artwork, claimed) {
  getImageIdentityKeys(artwork?.image).forEach((key) => claimed.add(key));
  return artwork;
}

export function selectCollectionArtworks(collections = []) {
  const selected = new Map();
  const claimed = new Set();

  for (const collection of collections) {
    if (!collection?.image?.url) continue;
    selected.set(collection.id, claimArtwork({ image: collection.image, source: "collection", productTitle: null, productId: null }, claimed));
  }

  for (const collection of collections) {
    if (selected.has(collection.id)) continue;
    const candidates = getProductCandidates(collection);
    const unique = candidates.find((candidate) => getImageIdentityKeys(candidate.image).every((key) => !claimed.has(key)));
    const artwork = unique || candidates[0] || { image: null, source: "branded-fallback", productTitle: null, productId: null };
    selected.set(collection.id, claimArtwork(artwork, claimed));
  }

  return selected;
}

export function getCollectionArtwork(collection) {
  return selectCollectionArtworks([collection]).get(collection?.id) || { image: null, source: "branded-fallback", productTitle: null, productId: null };
}

export function getCollectionFallbackVariant(collection) {
  const source = collection?.handle || collection?.title || "ethereal-armory";
  let hash = 2166136261;
  for (const character of source) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 4;
}

export function getCollectionArtworkAlt(collection, artwork) {
  if (!artwork?.image) return "";
  if (artwork.image.altText) return artwork.image.altText;
  if (artwork.source === "product" && artwork.productTitle) {
    const title = collection?.title || "featured";
    return `${artwork.productTitle}, from the ${title}${/collection$/i.test(title) ? "" : " collection"}`;
  }
  return `${collection?.title || "Ethereal Armory"} collection`;
}
