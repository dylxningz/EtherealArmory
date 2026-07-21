import test from "node:test";
import assert from "node:assert/strict";
import { clampQuantity, getCatalogState, isOptionValueAvailable, resolveVariant, shouldResetScroll, updateCatalogState } from "../../src/lib/commerce.js";
import {
  formatMoney,
  getPriceAnnouncement,
  getProductCardPricing,
  getSalePricing,
  parseMoneyAmount,
} from "../../src/lib/pricing.js";

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

test("rounds Shopify sale percentages from validated monetary amounts", () => {
  assert.equal(getSalePricing("66.66", "100").percentOff, 33);
  assert.equal(getSalePricing("74.6", "100").percentOff, 25);
  assert.equal(getSalePricing("0.01", "100").percentOff, 100);
});

test("equal, lower, null, empty, and zero compare-at prices are not sales", () => {
  for (const compareAtPrice of ["80", "79.99", null, "", "0", 0]) {
    const pricing = getSalePricing({ amount: "80", currencyCode: "USD" }, compareAtPrice);
    assert.equal(pricing.isOnSale, false);
    assert.equal(pricing.percentOff, 0);
  }
});

test("malformed Shopify money fails safely without invalid discounts", () => {
  for (const price of [null, "", "not-a-number", Number.NaN, Number.POSITIVE_INFINITY, -1, true]) {
    const pricing = getSalePricing(price, "100");
    assert.equal(pricing.isOnSale, false);
    assert.equal(Number.isFinite(pricing.percentOff), true);
  }
  for (const compareAtPrice of ["not-a-number", Number.NaN, Number.POSITIVE_INFINITY, -1, true]) {
    assert.equal(getSalePricing("80", compareAtPrice).isOnSale, false);
  }
  assert.equal(getSalePricing("0", "100").isOnSale, false);
  assert.equal(getSalePricing({ amount: "80", currencyCode: "USD" }, { amount: "100", currencyCode: "EUR" }).isOnSale, false);
  assert.equal(parseMoneyAmount(" "), null);
  assert.equal(formatMoney("not-a-number", "USD"), "");
});

test("card pricing uses the represented variant and omits ambiguous percentage claims", () => {
  const saleVariant = { id: "sale", availableForSale: true, price: { amount: "80", currencyCode: "USD" }, compareAtPrice: { amount: "100", currencyCode: "USD" } };
  const regularVariant = { id: "regular", availableForSale: true, price: { amount: "90", currencyCode: "USD" }, compareAtPrice: null };
  const exactSale = getProductCardPricing({ variants: { nodes: [saleVariant], pageInfo: { hasNextPage: false } } });
  const mixed = getProductCardPricing({ variants: { nodes: [saleVariant, regularVariant], pageInfo: { hasNextPage: false } } });
  const incomplete = getProductCardPricing({ variants: { nodes: [saleVariant], pageInfo: { hasNextPage: true } } });

  assert.equal(exactSale.representedVariantId, "sale");
  assert.equal(exactSale.showPercentOff, true);
  assert.equal(mixed.representedVariantId, "sale");
  assert.equal(mixed.isOnSale, true);
  assert.equal(mixed.showPercentOff, false);
  assert.equal(incomplete.showPercentOff, false);
});

test("sale-price announcements communicate current, original, and savings once", () => {
  const sale = getSalePricing({ amount: "80", currencyCode: "USD" }, { amount: "100", currencyCode: "USD" });
  assert.equal(getPriceAnnouncement(sale), "Sale price $80.00. Original price $100.00. Save 20 percent.");
  assert.equal(getPriceAnnouncement(getSalePricing({ amount: "80", currencyCode: "USD" }, null)), "Price $80.00.");
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
