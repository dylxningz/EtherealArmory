import test from "node:test";
import assert from "node:assert/strict";
import { clampQuantity, getCatalogState, isOptionValueAvailable, resolveVariant, shouldResetScroll, updateCatalogState } from "../../src/lib/commerce.js";
import { formatMoney, getSalePricing } from "../../src/lib/pricing.js";

const variants = [
  { id: "red-small", availableForSale: true, selectedOptions: [{ name: "Color", value: "Red" }, { name: "Size", value: "Small" }] },
  { id: "red-large", availableForSale: false, selectedOptions: [{ name: "Color", value: "Red" }, { name: "Size", value: "Large" }] },
  { id: "blue-large", availableForSale: true, selectedOptions: [{ name: "Color", value: "Blue" }, { name: "Size", value: "Large" }] },
];

test("formats the currency Shopify supplies without hardcoded dollar output", () => {
  assert.match(formatMoney("19.5", "EUR", "de-DE"), /19,50/);
  assert.match(formatMoney("19.5", "JPY", "ja-JP"), /20/);
});

test("uses Shopify compare-at pricing only when it is genuinely higher", () => {
  assert.deepEqual(getSalePricing({ amount: "80", currencyCode: "USD" }, { amount: "100", currencyCode: "USD" }), {
    finalPrice: 80, originalPrice: 100, currencyCode: "USD", isOnSale: true, percentOff: 20,
  });
  assert.equal(getSalePricing({ amount: "80", currencyCode: "USD" }, null).isOnSale, false);
});

test("resolves exact variants and never falls back to the first variant", () => {
  assert.equal(resolveVariant(variants, { Color: "Blue", Size: "Large" }).id, "blue-large");
  assert.equal(resolveVariant(variants, { Color: "Blue", Size: "Small" }), null);
  assert.equal(isOptionValueAvailable(variants, { Color: "Red", Size: "Small" }, "Size", "Large"), false);
});

test("clamps cart quantities to a safe line-item range", () => {
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity("4"), 4);
  assert.equal(clampQuantity(500), 99);
});

test("round-trips collection filter and sort state through the URL", () => {
  const updated = updateCatalogState(new URLSearchParams(), { type: "Replica", availability: "available", sort: "price-low-high" });
  assert.deepEqual(getCatalogState(updated), { type: "Replica", availability: "available", sort: "price-low-high" });
  assert.equal(updateCatalogState(updated, { type: "all" }).has("type"), false);
});

test("route changes request scroll restoration", () => {
  assert.equal(shouldResetScroll("/products", "/about"), true);
  assert.equal(shouldResetScroll("/products", "/products"), false);
});
