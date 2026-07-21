import test from "node:test";
import assert from "node:assert/strict";
import { getPublicEtsyShopUrl } from "../../src/config/siteSettings.js";
import { addThemeToDestination, getStorefrontTheme } from "../../src/lib/theme.js";

test("fantasy is the default and cyberpunk requires the explicit URL parameter", () => {
  assert.equal(getStorefrontTheme(""), "fantasy");
  assert.equal(getStorefrontTheme("?theme=fantasy"), "fantasy");
  assert.equal(getStorefrontTheme("?theme=cyberpunk"), "cyberpunk");
});

test("cyberpunk propagates through internal destinations without touching external links", () => {
  assert.equal(addThemeToDestination("/products", "?theme=cyberpunk"), "/products?theme=cyberpunk");
  assert.equal(addThemeToDestination("/products?sort=featured#grid", "?theme=cyberpunk"), "/products?sort=featured&theme=cyberpunk#grid");
  assert.equal(addThemeToDestination("https://www.etsy.com/shop/example", "?theme=cyberpunk"), "https://www.etsy.com/shop/example");
  assert.equal(addThemeToDestination("/products", ""), "/products");
});

test("Etsy public configuration accepts only safe HTTPS Etsy URLs and degrades to empty", () => {
  assert.equal(getPublicEtsyShopUrl(""), "");
  assert.equal(getPublicEtsyShopUrl("https://example.com/shop"), "");
  assert.equal(getPublicEtsyShopUrl("http://www.etsy.com/shop/example"), "");
  assert.equal(getPublicEtsyShopUrl("https://www.etsy.com/shop/example#reviews"), "https://www.etsy.com/shop/example#reviews");
});
