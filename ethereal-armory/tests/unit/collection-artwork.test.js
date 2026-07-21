import test from "node:test";
import assert from "node:assert/strict";
import { getCollectionArtwork, getCollectionArtworkAlt } from "../../src/lib/collectionArtwork.js";

const collectionImage = { url: "https://cdn.example/collection.jpg", altText: "Collection crest", width: 1200, height: 900 };
const productImage = { url: "https://cdn.example/product.jpg", altText: null, width: 900, height: 1200 };

test("collection artwork prioritizes a future collection image over product media", () => {
  const artwork = getCollectionArtwork({ image: collectionImage, products: { nodes: [{ title: "Relic", featuredImage: productImage }] } });
  assert.equal(artwork.source, "collection");
  assert.equal(artwork.image, collectionImage);
});

test("collection artwork falls back to the first product with suitable media", () => {
  const collection = { title: "Arcane Relics", image: null, products: { nodes: [{ title: "Empty", featuredImage: null }, { title: "Moonblade", featuredImage: productImage }] } };
  const artwork = getCollectionArtwork(collection);
  assert.equal(artwork.source, "product");
  assert.equal(artwork.image, productImage);
  assert.equal(getCollectionArtworkAlt(collection, artwork), "Moonblade, from the Arcane Relics collection");
});

test("empty collections use the branded fallback without inventing media", () => {
  assert.deepEqual(getCollectionArtwork({ title: "Awaiting Relics", image: null, products: { nodes: [] } }), {
    image: null, source: "branded-fallback", productTitle: null,
  });
});
