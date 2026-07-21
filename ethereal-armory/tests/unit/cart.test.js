import test from "node:test";
import assert from "node:assert/strict";

process.env.VITE_SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
process.env.VITE_SHOPIFY_STOREFRONT_TOKEN = "public-test-token";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};

const shopify = await import("../../src/lib/shopify.js");

function response(data) {
  return { ok: true, json: async () => ({ data }) };
}

function cart(id = "cart-1", quantity = 1) {
  return { id, checkoutUrl: "https://checkout.example", totalQuantity: quantity, lines: { nodes: [] }, cost: { subtotalAmount: { amount: "10", currencyCode: "USD" } } };
}

test("updates quantities and removes cart lines through Shopify mutations", async () => {
  const bodies = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    bodies.push(body);
    if (body.query.includes("cartLinesUpdate")) return response({ cartLinesUpdate: { cart: cart("cart-1", 3), userErrors: [] } });
    return response({ cartLinesRemove: { cart: cart("cart-1", 0), userErrors: [] } });
  };

  assert.equal((await shopify.updateCartLines("cart-1", [{ id: "line-1", quantity: 3 }])).totalQuantity, 3);
  assert.equal((await shopify.removeCartLines("cart-1", ["line-1"])).totalQuantity, 0);
  assert.deepEqual(bodies[0].variables.lines, [{ id: "line-1", quantity: 3 }]);
  assert.deepEqual(bodies[1].variables.lineIds, ["line-1"]);
});

test("recovers an expired saved cart before adding an item", async () => {
  storage.set(shopify.CART_STORAGE_KEY, "expired-cart");
  let call = 0;
  globalThis.fetch = async (_url, options) => {
    call += 1;
    const query = JSON.parse(options.body).query;
    if (call === 1) return { ok: true, json: async () => ({ errors: [{ message: "Cart not found" }] }) };
    if (query.includes("cartCreate")) return response({ cartCreate: { cart: cart("fresh-cart", 0), userErrors: [] } });
    return response({ cartLinesAdd: { cart: cart("fresh-cart", 2), userErrors: [] } });
  };

  const result = await shopify.addToCartWithRecovery("variant-1", 2);
  assert.equal(result.recovered, false);
  assert.equal(result.cart.id, "fresh-cart");
  assert.equal(storage.get(shopify.CART_STORAGE_KEY), "fresh-cart");
});

test("preserves a saved cart during temporary network failure", async () => {
  storage.set(shopify.CART_STORAGE_KEY, "saved-cart");
  globalThis.fetch = async () => { throw new TypeError("temporary network failure"); };
  await assert.rejects(() => shopify.addToCartWithRecovery("variant-1"), /temporary network failure/);
  assert.equal(storage.get(shopify.CART_STORAGE_KEY), "saved-cart");
});
