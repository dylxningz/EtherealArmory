import { createRequire } from "node:module";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const image = { id: "image-1", url: "http://127.0.0.1:5173/og-image.png", altText: "Celestial staff", width: 800, height: 800 };
const product = {
  id: "gid://shopify/Product/1", handle: "celestial-staff", title: "Celestial Staff", description: "A display-ready fantasy staff.", descriptionHtml: "<p>A display-ready fantasy staff.</p>",
  productType: "Props", vendor: "Ethereal Armory", tags: [], availableForSale: true, onlineStoreUrl: null, seo: { title: "Celestial Staff", description: "A display-ready fantasy staff." }, processingTime: null,
  featuredImage: image, images: { nodes: [image] }, options: [{ name: "Finish", values: ["Arcane", "Ancient"] }],
  priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } }, compareAtPriceRange: { minVariantPrice: { amount: "150.00", currencyCode: "USD" } },
  variants: { nodes: [
    { id: "variant-1", title: "Arcane", availableForSale: true, sku: "EA-1", selectedOptions: [{ name: "Finish", value: "Arcane" }], price: { amount: "120.00", currencyCode: "USD" }, compareAtPrice: { amount: "150.00", currencyCode: "USD" }, image },
    { id: "variant-2", title: "Ancient", availableForSale: false, sku: "EA-2", selectedOptions: [{ name: "Finish", value: "Ancient" }], price: { amount: "120.00", currencyCode: "USD" }, compareAtPrice: null, image },
  ] },
};
const collection = { id: "gid://shopify/Collection/1", handle: "featured", title: "Featured Relics", description: "Collector favorites.", seo: { title: "Featured Relics", description: "Collector favorites." }, image, products: { nodes: [product] } };
const productBackedCollection = { id: "gid://shopify/Collection/2", handle: "product-backed", title: "Product-backed Relics", description: "Product artwork fallback.", image: null, products: { nodes: [product] } };
const emptyCollection = { id: "gid://shopify/Collection/3", handle: "empty", title: "Awaiting Relics", description: "An empty collection.", image: null, products: { nodes: [] } };
const brokenCollection = { id: "gid://shopify/Collection/4", handle: "broken", title: "Shattered Archive", description: "Broken media fallback.", image: { ...image, url: "http://127.0.0.1:5173/missing-collection-art.jpg" }, products: { nodes: [] } };

async function mockShopify(page) {
  let cartQuantity = 0;
  const cart = () => ({
    id: "cart-1",
    checkoutUrl: "https://checkout.example/cart-1",
    totalQuantity: cartQuantity,
    lines: { nodes: cartQuantity ? [{
      id: "line-1",
      quantity: cartQuantity,
      merchandise: {
        ...product.variants.nodes[0],
        product: { title: product.title, handle: product.handle },
      },
    }] : [] },
    cost: { subtotalAmount: { amount: String(108 * cartQuantity), currencyCode: "USD" } },
  });

  await page.route("**/graphql.json", async (route) => {
    const body = route.request().postDataJSON();
    const query = body.query;
    if (query.includes("ProductByHandle")) return route.fulfill({ json: { data: { product } } });
    if (query.includes("CollectionProducts")) return route.fulfill({ json: { data: { collection: { ...collection, products: { nodes: [product], pageInfo: { hasNextPage: false, endCursor: null } } } } } });
    if (query.includes("CollectionsList")) return route.fulfill({ json: { data: { collections: { nodes: [collection, productBackedCollection, emptyCollection, brokenCollection], pageInfo: { hasNextPage: false, endCursor: null } } } } });
    if (query.includes("ProductsList")) return route.fulfill({ json: { data: { products: { nodes: [product], pageInfo: { hasNextPage: false, endCursor: null } } } } });
    if (query.includes("CartCreate")) return route.fulfill({ json: { data: { cartCreate: { cart: cart(), userErrors: [] } } } });
    if (query.includes("AddToCart")) {
      cartQuantity += body.variables.lines[0].quantity;
      return route.fulfill({ json: { data: { cartLinesAdd: { cart: cart(), userErrors: [] } } } });
    }
    if (query.includes("UpdateCart")) {
      cartQuantity = body.variables.lines[0].quantity;
      return route.fulfill({ json: { data: { cartLinesUpdate: { cart: cart(), userErrors: [] } } } });
    }
    if (query.includes("RemoveCartLines")) {
      cartQuantity = 0;
      return route.fulfill({ json: { data: { cartLinesRemove: { cart: cart(), userErrors: [] } } } });
    }
    if (query.includes("GetCart")) return route.fulfill({ json: { data: { cart: null } } });
    return route.fulfill({ json: { data: {} } });
  });
}

async function expectNoMaterialAxeViolations(page) {
  await expect(page.locator("main h1")).toBeVisible();
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(async () => window.axe.run(document, { resultTypes: ["violations"] }));
  const material = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
  const moderate = results.violations.filter((violation) => violation.impact === "moderate");
  if (moderate.length) {
    console.log(`[axe:${new URL(page.url()).pathname}] ${moderate.map((violation) => `${violation.id}: ${violation.help}`).join("; ")}`);
  }
  expect(material, material.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  return results.violations;
}

test.beforeEach(async ({ page }) => {
  await mockShopify(page);
});

test("homepage has no horizontal overflow and exposes primary content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fantasy made tangible." })).toBeVisible();
  const sizes = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth + 1);
  if (process.env.REVIEW_SCREENSHOT_DIR) {
    const viewport = page.viewportSize();
    await page.screenshot({ path: join(process.env.REVIEW_SCREENSHOT_DIR, `predeployment-home-${viewport.width}x${viewport.height}.png`) });
  }

  if (page.viewportSize().width <= 768) {
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.click();
    const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await expect(page.locator("main")).toHaveJSProperty("inert", true);
    await expect(page.locator(".site-header")).toHaveJSProperty("inert", true);
    const overlay = page.locator(".mobile-nav-overlay");
    const bounds = await overlay.boundingBox();
    expect(bounds.x).toBeLessThanOrEqual(0);
    expect(bounds.y).toBeLessThanOrEqual(0);
    expect(bounds.width).toBeGreaterThanOrEqual(page.viewportSize().width);
    expect(Number(await overlay.evaluate((element) => getComputedStyle(element).zIndex))).toBeGreaterThan(100);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
  }
});

test("collection artwork follows the source priority and survives empty or broken media", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Artwork source behavior is viewport-independent.");
  await page.goto("/");
  const collectionImage = page.getByRole("link", { name: /Featured Relics/ }).locator("img");
  await expect(collectionImage).toHaveAttribute("src", /og-image\.png/);
  await expect(collectionImage).toHaveAttribute("alt", "Celestial staff");
  const productImage = page.getByRole("link", { name: /Product-backed Relics/ }).locator("img");
  await expect(productImage).toHaveAttribute("src", /og-image\.png/);
  await expect(productImage).toHaveAttribute("alt", "Celestial staff");
  await expect(page.getByRole("link", { name: /Awaiting Relics/ }).locator(".collection-artwork-fallback")).toBeVisible();

  await page.goto("/products");
  await expect(page.getByRole("link", { name: /Shattered Archive/ }).locator(".collection-artwork-fallback")).toBeVisible();
});

test("Shop collection artwork stays in bounded landscape cards", async ({ page }) => {
  await page.goto("/products");
  const rail = page.locator(".collection-rail");
  const cards = rail.locator(":scope > a");
  await expect(cards).toHaveCount(5);
  await expect(page.getByRole("link", { name: /Product-backed Relics/ }).locator(".collection-artwork-image")).toBeVisible();
  await expect(page.getByRole("link", { name: /Awaiting Relics/ }).locator(".collection-artwork-fallback")).toBeVisible();

  const metrics = await rail.evaluate((element) => ({
    documentWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    cards: [...element.querySelectorAll(":scope > a")].map((card) => {
      const frame = card.querySelector(".collection-artwork-frame");
      const image = card.querySelector(".collection-artwork-image");
      const fallback = card.querySelector(".collection-artwork-fallback");
      const frameBox = frame.getBoundingClientRect();
      return {
        cardHeight: card.getBoundingClientRect().height,
        frameWidth: frameBox.width,
        frameHeight: frameBox.height,
        hasFallback: Boolean(fallback),
        imageHeight: image?.getBoundingClientRect().height || null,
        objectFit: image ? getComputedStyle(image).objectFit : null,
        objectPosition: image ? getComputedStyle(image).objectPosition : null,
      };
    }),
    visibleCards: [...element.querySelectorAll(":scope > a")].filter((card) => {
      const box = card.getBoundingClientRect();
      return box.left >= 0 && box.right <= window.innerWidth;
    }).length,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  for (const card of metrics.cards) {
    expect(card.frameWidth / card.frameHeight).toBeCloseTo(4 / 3, 1);
    expect(card.frameHeight).toBeLessThan(180);
    expect(card.cardHeight).toBeLessThan(260);
    if (card.imageHeight !== null) {
      expect(card.imageHeight).toBeCloseTo(card.frameHeight, 0);
      expect(card.objectFit).toBe("cover");
      expect(card.objectPosition).toBe("50% 50%");
    }
  }

  const fallbackHeights = metrics.cards.filter((card) => card.hasFallback).map((card) => card.frameHeight);
  expect(Math.max(...fallbackHeights) - Math.min(...fallbackHeights)).toBeLessThan(1);
  if (page.viewportSize().width >= 1024) expect(metrics.visibleCards).toBeGreaterThanOrEqual(4);
});

test("mobile navigation closes on route changes and contains keyboard focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Keyboard behavior is viewport-independent.");
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: /Custom builds/ })).toBeFocused();
  await dialog.getByRole("link", { name: /Shop/ }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(dialog).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("the animated artifact respects reduced motion and does not require WebGL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Motion behavior is viewport-independent.");
  await page.addInitScript(() => {
    if (window.HTMLCanvasElement) window.HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const artifact = page.getByRole("img", { name: /voidglass reliquary/i });
  await expect(artifact).toBeVisible();
  const motion = await page.locator(".artifact-assembly").evaluate((element) => ({
    duration: Number.parseFloat(getComputedStyle(element).animationDuration),
    iterations: getComputedStyle(element).animationIterationCount,
  }));
  expect(motion.duration).toBeLessThan(0.1);
  expect(motion.iterations).toBe("1");
  await expect(page.locator(".hero-image-frame")).toHaveCount(0);
});

test("Judge.me failure leaves the product usable and reports unavailability honestly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Third-party failure behavior is viewport-independent.");
  await page.route("https://cdnwidget.judge.me/**", (route) => route.abort("failed"));
  await page.goto("/products/celestial-staff");
  const reviews = page.getByRole("region", { name: "Celestial Staff reviews" });
  await reviews.scrollIntoViewIfNeeded();
  await expect(reviews.getByText("Reviews are temporarily unavailable.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeEnabled();
});

test("Judge.me empty responses never invent reviews or ratings", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Third-party empty-state behavior is viewport-independent.");
  await page.route("https://cdnwidget.judge.me/widget_preloader.js", (route) => route.fulfill({ contentType: "application/javascript", body: "window.jdgm = window.jdgm || {};" }));
  await page.route("https://cdnwidget.judge.me/assets/installed.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.jdgmCacheServer = { reloadAllWidgets() {
      const widget = document.getElementById("judgeme_product_reviews");
      if (widget) widget.innerHTML = '<div class="jdgm-rev-widg"><div class="jdgm-rev-widg__reviews"></div><p>No reviews yet</p></div>';
    } };`,
  }));
  await page.goto("/products/celestial-staff");
  const reviews = page.getByRole("region", { name: "Celestial Staff reviews" });
  await reviews.scrollIntoViewIfNeeded();
  await expect(reviews.getByText("No reviews yet.", { exact: true })).toBeVisible();
  await expect(reviews.getByText(/first collector to share an honest review/i)).toBeVisible();
  await expect(reviews.locator(".jdgm-rev")).toHaveCount(0);
  await expectNoMaterialAxeViolations(page);
});

test("collection state is addressable in the URL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "URL-state behavior is viewport-independent.");
  await page.goto("/collections/featured");
  await expect(page.getByRole("heading", { name: "Featured Relics" })).toBeVisible();
  await page.getByLabel("Sort by").selectOption("price-low-high");
  await expect(page).toHaveURL(/sort=price-low-high/);
  await page.getByLabel("Availability").selectOption("available");
  await expect(page).toHaveURL(/availability=available/);
  await page.goBack();
  await expect(page.getByLabel("Availability")).toHaveValue("all");
  await expect(page.getByLabel("Sort by")).toHaveValue("price-low-high");
  await page.goForward();
  await expect(page.getByLabel("Availability")).toHaveValue("available");
});

test("product purchase information is available early on mobile", async ({ page }) => {
  await page.goto("/products/celestial-staff");
  const heading = page.getByRole("heading", { name: "Celestial Staff" });
  await expect(heading).toBeVisible();
  if (page.viewportSize().width <= 430) {
    const box = await heading.boundingBox();
    expect(box.y).toBeLessThan(900);
  }
  await expect(page.getByRole("button", { name: "Ancient" })).toBeDisabled();
});

test("catalog API failures preserve navigation context and offer retry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Failure-state behavior is viewport-independent.");
  await page.unroute("**/graphql.json");
  await page.route("**/graphql.json", (route) => route.abort("failed"));
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Shop All" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The catalog could not be loaded" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Shop by collection" })).toBeVisible();
});

test("catalog rendering stays within the good CLS threshold with deterministic Shopify data", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Rendering metrics run once at the representative mobile width.");
  await page.addInitScript(() => {
    window.__cls = 0;
    let sessionValue = 0;
    let sessionStart = 0;
    let previousShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        if (sessionValue > 0 && entry.startTime - previousShift < 1000 && entry.startTime - sessionStart < 5000) {
          sessionValue += entry.value;
        } else {
          sessionValue = entry.value;
          sessionStart = entry.startTime;
        }
        previousShift = entry.startTime;
        window.__cls = Math.max(window.__cls, sessionValue);
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/products");
  await expect(page.locator(".product-card:not(.skeleton-card)")).toBeVisible();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__cls)).toBeLessThanOrEqual(0.1);
});

test("unknown routes render a crawl-safe 404 experience", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Route behavior is viewport-independent.");
  await page.goto("/not-a-real-route");
  await expect(page.getByRole("heading", { name: "This artifact cannot be found." })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
});

test("cart drawer traps focus, closes with Escape, and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Dialog behavior is viewport-independent.");
  await page.goto("/");
  const cartButton = page.getByRole("button", { name: "Open cart with 0 items" });
  await cartButton.click();
  const dialog = page.getByRole("dialog", { name: "Your cart (0)" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close cart" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(cartButton).toBeFocused();
});

test("client-side route changes restore the top of the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Scroll behavior is viewport-independent.");
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.getByRole("link", { name: "Shop available pieces" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("home has no serious or critical automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Axe is run once; responsive structure is covered separately.");
  await page.goto("/");
  await expectNoMaterialAxeViolations(page);
});

test("contact form reports a successful Formspree response and resets fields", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Form behavior is viewport-independent.");
  await page.route("https://formspree.io/**", (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Preview Reviewer");
  await page.getByLabel("Email").fill("preview@example.com");
  await page.getByLabel("Project details").fill("Testing the preview inquiry flow.");
  await page.getByRole("button", { name: "Send commission inquiry" }).click();
  await expect(page.getByText("Your inquiry has been sent.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("");
});

test("portfolio dialog makes its page background inert", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Dialog behavior is viewport-independent.");
  await page.goto("/portfolio");
  await page.getByRole("button", { name: /Celestial Mage Staff/ }).click();
  await expect(page.getByRole("dialog", { name: "Celestial Mage Staff" })).toBeVisible();
  await expect(page.locator(".portfolio-hero")).toHaveJSProperty("inert", true);
  await expect(page.locator(".portfolio-grid-section")).toHaveJSProperty("inert", true);
});

test("portfolio calls to action retain accessible touch targets", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Touch-target styling is viewport-independent.");
  await page.goto("/portfolio");
  const primary = page.getByRole("link", { name: "Start a Custom Build" });
  await expect(primary).toBeVisible();
  const box = await primary.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  if (process.env.REVIEW_SCREENSHOT_DIR) {
    const viewport = page.viewportSize();
    await page.screenshot({ path: join(process.env.REVIEW_SCREENSHOT_DIR, `predeployment-portfolio-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }
});

test("cart quantity updates preserve keyboard focus and explain Shopify discounts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Cart mutation behavior is viewport-independent.");
  await page.goto("/products/celestial-staff");
  await page.getByRole("button", { name: "Add to cart" }).click();
  const dialog = page.getByRole("dialog", { name: "Your cart (1)" });
  await expect(dialog).toBeVisible();
  const increase = dialog.getByRole("button", { name: "Increase quantity" });
  await increase.click();
  const updatedDialog = page.getByRole("dialog", { name: "Your cart (2)" });
  await expect(updatedDialog).toBeVisible();
  await expect(updatedDialog.getByRole("button", { name: "Increase quantity" })).toBeFocused();
  await expect(updatedDialog.getByText("Eligible Shopify discounts are reflected in the subtotal.", { exact: false })).toBeVisible();
});

test("keyboard users can reach the Shopify checkout action", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Keyboard flow is viewport-independent.");
  await page.goto("/products/celestial-staff");
  const addButton = page.getByRole("button", { name: "Add to cart" });
  await addButton.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Your cart (1)" });
  await expect(dialog).toBeVisible();
  const checkout = dialog.getByRole("button", { name: "Continue to secure checkout" });
  for (let index = 0; index < 10 && !(await checkout.evaluate((element) => element === document.activeElement)); index += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(checkout).toBeFocused();
});

const axeStates = [
  ["catalog", "/products"],
  ["collection", "/collections/featured"],
  ["product", "/products/celestial-staff"],
  ["contact", "/contact"],
  ["404", "/not-a-real-route"],
];

for (const [name, path] of axeStates) {
  test(`${name} route has no serious or critical automated accessibility violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "390px", "Axe route checks run once at the representative mobile width.");
    await page.goto(path);
    await expectNoMaterialAxeViolations(page);
  });
}

test("open cart has no serious or critical automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Axe state checks run once at the representative mobile width.");
  await page.goto("/");
  await page.getByRole("button", { name: "Open cart with 0 items" }).click();
  await expectNoMaterialAxeViolations(page);
});

test("open mobile menu has no serious or critical automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Axe state checks run once at the representative mobile width.");
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expectNoMaterialAxeViolations(page);
});

const responsiveRoutes = [
  "/",
  "/products",
  "/collections/featured",
  "/products/celestial-staff",
  "/contact",
  "/shipping-policy",
  "/portfolio",
  "/not-a-real-route",
];

test("key routes and the cart drawer stay within every required viewport", async ({ page }) => {
  for (const path of responsiveRoutes) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    const sizes = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(sizes.scrollWidth, `Horizontal overflow at ${path}`).toBeLessThanOrEqual(sizes.clientWidth + 1);
  }

  await page.goto("/");
  const cartButton = page.getByRole("button", { name: "Open cart with 0 items" });
  await cartButton.click();
  const dialog = page.getByRole("dialog", { name: "Your cart (0)" });
  await expect(dialog).toBeVisible();
  const dialogBounds = await dialog.boundingBox();
  expect(dialogBounds.x).toBeGreaterThanOrEqual(-1);
  expect(dialogBounds.x + dialogBounds.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
});
