import test from "node:test";
import assert from "node:assert/strict";
import { getCollectionArtwork, getCollectionArtworkAlt, getCollectionFallbackVariant, normalizeShopifyImageUrl, selectCollectionArtworks } from "../../src/lib/collectionArtwork.js";

const image = (id, url = `https://cdn.shopify.com/s/files/1/0001/${id}.jpg?v=1`) => ({ id, url, altText: null, width: 900, height: 1200 });
const product = (id, images) => ({ id: `product-${id}`, title: `Relic ${id}`, featuredImage: images[0] || null, images: { nodes: images } });
const collection = (id, products = [], collectionImage = null) => ({ id: `collection-${id}`, handle: id, title: `${id} collection`, image: collectionImage, products: { nodes: products } });

test("collection artwork prioritizes an explicit collection image", () => {
  const ownImage = image("collection-art");
  const artwork = getCollectionArtwork(collection("arcane", [product("one", [image("product-art")])], ownImage));
  assert.equal(artwork.source, "collection");
  assert.equal(artwork.image, ownImage);
});

test("page-level selection chooses unique in-collection candidates deterministically", () => {
  const shared = image("shared");
  const unique = image("unique");
  const collections = [collection("first", [product("first", [shared])]), collection("second", [product("second", [shared, unique])])];
  const first = selectCollectionArtworks(collections);
  const second = selectCollectionArtworks(collections);
  assert.equal(first.get("collection-first").image.id, "shared");
  assert.equal(first.get("collection-second").image.id, "unique");
  assert.equal(second.get("collection-second").image.id, "unique");
});

test("Shopify CDN transforms normalize to one source identity", () => {
  assert.equal(
    normalizeShopifyImageUrl("https://CDN.SHOPIFY.COM/s/files/relic_400x.jpg?v=123&width=400"),
    normalizeShopifyImageUrl("https://cdn.shopify.com/s/files/relic.jpg?width=1200"),
  );
  const transformed = image(null, "https://cdn.shopify.com/s/files/relic_400x.jpg?width=400");
  const original = image(null, "https://cdn.shopify.com/s/files/relic.jpg?width=1200");
  const unique = image("other");
  const selected = selectCollectionArtworks([collection("one", [product("one", [transformed])]), collection("two", [product("two", [original, unique])])]);
  assert.equal(selected.get("collection-two").image.id, "other");
});

test("selection never reaches into another collection to force uniqueness", () => {
  const firstOnly = image("first-only");
  const secondOnly = image("second-only");
  const selected = selectCollectionArtworks([collection("first", [product("one", [firstOnly])]), collection("second", [product("two", [secondOnly])])]);
  assert.equal(selected.get("collection-second").image, secondOnly);
});

test("a duplicate is permitted only when the collection has no unique valid candidate", () => {
  const shared = image("shared");
  const selected = selectCollectionArtworks([collection("first", [product("one", [shared])]), collection("second", [product("two", [shared])])]);
  assert.equal(selected.get("collection-first").image, shared);
  assert.equal(selected.get("collection-second").image, shared);
});

test("empty collections use a deterministic branded fallback", () => {
  const empty = collection("awaiting-relics");
  assert.deepEqual(getCollectionArtwork(empty), { image: null, source: "branded-fallback", productTitle: null, productId: null });
  assert.equal(getCollectionFallbackVariant(empty), getCollectionFallbackVariant({ ...empty }));
  assert.match(String(getCollectionFallbackVariant(empty)), /^[0-3]$/);
});

test("product fallback alt text keeps the product and collection context", () => {
  const entry = collection("arcane-relics", [product("moonblade", [image("moonblade")])]);
  const artwork = getCollectionArtwork(entry);
  assert.equal(getCollectionArtworkAlt(entry, artwork), "Relic moonblade, from the arcane-relics collection");
});
