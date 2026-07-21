export function getCollectionArtwork(collection) {
  if (collection?.image?.url) {
    return { image: collection.image, source: "collection", productTitle: null };
  }

  const product = collection?.products?.nodes?.find((item) => item?.featuredImage?.url);
  if (product) {
    return { image: product.featuredImage, source: "product", productTitle: product.title || null };
  }

  return { image: null, source: "branded-fallback", productTitle: null };
}

export function getCollectionArtworkAlt(collection, artwork) {
  if (!artwork?.image) return "";
  if (artwork.image.altText) return artwork.image.altText;
  if (artwork.source === "product" && artwork.productTitle) {
    return `${artwork.productTitle}, from the ${collection?.title || "featured"} collection`;
  }
  return `${collection?.title || "Ethereal Armory"} collection`;
}
