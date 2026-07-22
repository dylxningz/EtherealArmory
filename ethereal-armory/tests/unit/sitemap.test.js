import test from "node:test";
import assert from "node:assert/strict";
import handler, { portfolioEntriesForProjects } from "../../api/sitemap.js";
import { validPortfolioProject } from "../fixtures/portfolio-project.js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: null,
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
  };
}

test("sitemap paginates beyond ten Shopify pages without silently omitting URLs", async () => {
  const originalFetch = globalThis.fetch;
  process.env.VITE_SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
  process.env.VITE_SHOPIFY_STOREFRONT_TOKEN = "public-test-token";
  let productPage = 0;

  globalThis.fetch = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    if (query.includes("collections")) {
      return { ok: true, json: async () => ({ data: { collections: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } }) };
    }
    productPage += 1;
    return {
      ok: true,
      json: async () => ({ data: { products: {
        nodes: [{ handle: `product-${productPage}`, updatedAt: "2026-07-20T00:00:00Z" }],
        pageInfo: { hasNextPage: productPage < 11, endCursor: `cursor-${productPage}` },
      } } }),
    };
  };

  try {
    const response = responseRecorder();
    await handler({ method: "GET" }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["Content-Type"], "application/xml; charset=utf-8");
    assert.match(response.body, /<loc>https:\/\/www\.etherealarmory\.com\/reviews<\/loc>/);
    assert.match(response.body, /<loc>https:\/\/www\.etherealarmory\.com\/portfolio<\/loc>/);
    assert.doesNotMatch(response.body, /<loc>https:\/\/www\.etherealarmory\.com\/portfolio\/<\/loc>/);
    assert.equal((response.body.match(/\/products\/product-\d+/g) || []).length, 11);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Portfolio sitemap entries contain only validated project records", () => {
  assert.deepEqual(portfolioEntriesForProjects([]), []);
  assert.deepEqual(portfolioEntriesForProjects([validPortfolioProject]), [
    { loc: "https://www.etherealarmory.com/portfolio/example-commission-study" },
  ]);
  assert.throws(() => portfolioEntriesForProjects([{ ...validPortfolioProject, slug: "Invalid Slug" }]), /Portfolio validation failed/);
});

test("sitemap fails safely instead of looping when Shopify repeats a cursor", async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  process.env.VITE_SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
  process.env.VITE_SHOPIFY_STOREFRONT_TOKEN = "public-test-token";
  let calls = 0;
  console.error = () => {};
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    const { query } = JSON.parse(options.body);
    const field = query.includes("products") ? "products" : "collections";
    return { ok: true, json: async () => ({ data: { [field]: {
      nodes: [{ handle: "repeated", updatedAt: "2026-07-20T00:00:00Z" }],
      pageInfo: { hasNextPage: true, endCursor: "same-cursor" },
    } } }) };
  };

  try {
    const response = responseRecorder();
    await handler({ method: "GET" }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(calls, 4);
    assert.doesNotMatch(response.body, /\/products\/repeated|\/collections\/repeated/);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test("sitemap escapes dynamic URLs and rejects unsupported methods", async () => {
  const originalFetch = globalThis.fetch;
  process.env.VITE_SHOPIFY_STORE_DOMAIN = "example.myshopify.com";
  process.env.VITE_SHOPIFY_STOREFRONT_TOKEN = "public-test-token";
  globalThis.fetch = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    const field = query.includes("products") ? "products" : "collections";
    return { ok: true, json: async () => ({ data: { [field]: {
      nodes: [{ handle: "steel&shadow", updatedAt: "2026-07-20T00:00:00Z" }],
      pageInfo: { hasNextPage: false, endCursor: null },
    } } }) };
  };

  try {
    const response = responseRecorder();
    await handler({ method: "GET" }, response);
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /steel&amp;shadow/);

    const methodResponse = responseRecorder();
    await handler({ method: "POST" }, methodResponse);
    assert.equal(methodResponse.statusCode, 405);
    assert.equal(methodResponse.headers.Allow, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
