import { createRequire } from "node:module";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const image = { id: "image-1", url: "http://127.0.0.1:5173/og-image.png", altText: "Celestial staff", width: 800, height: 800 };
const portraitImage = { id: "image-portrait", url: "http://127.0.0.1:5173/test-product-portrait.svg", altText: "Portrait view of the celestial staff", width: 600, height: 1000 };
const landscapeImage = { id: "image-landscape", url: "http://127.0.0.1:5173/test-product-landscape.svg", altText: "Landscape view of the celestial staff", width: 1200, height: 600 };
const squareImage = { id: "image-square", url: "http://127.0.0.1:5173/test-product-square.svg", altText: "Square view of the celestial staff", width: 800, height: 800 };
const product = {
  id: "gid://shopify/Product/1", handle: "celestial-staff", title: "Celestial Staff", description: "A display-ready fantasy staff.", descriptionHtml: "<p>A display-ready fantasy staff.</p>",
  productType: "Props", vendor: "Ethereal Armory", tags: [], availableForSale: true, onlineStoreUrl: null, seo: { title: "Celestial Staff", description: "A display-ready fantasy staff." }, processingTime: null,
  featuredImage: image, images: { nodes: [portraitImage, landscapeImage, squareImage] }, options: [{ name: "Finish", values: ["Arcane", "Ancient", "Mundane"] }],
  priceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } }, compareAtPriceRange: { minVariantPrice: { amount: "150.00", currencyCode: "USD" } },
  variants: { nodes: [
    { id: "variant-1", title: "Arcane", availableForSale: true, sku: "EA-1", selectedOptions: [{ name: "Finish", value: "Arcane" }], price: { amount: "120.00", currencyCode: "USD" }, compareAtPrice: { amount: "150.00", currencyCode: "USD" }, image: portraitImage },
    { id: "variant-2", title: "Ancient", availableForSale: false, sku: "EA-2", selectedOptions: [{ name: "Finish", value: "Ancient" }], price: { amount: "120.00", currencyCode: "USD" }, compareAtPrice: null, image: portraitImage },
    { id: "variant-3", title: "Mundane", availableForSale: true, sku: "EA-3", selectedOptions: [{ name: "Finish", value: "Mundane" }], price: { amount: "135.00", currencyCode: "USD" }, compareAtPrice: null, image: portraitImage },
  ], pageInfo: { hasNextPage: false } },
};
const singleSaleProduct = {
  ...product,
  id: "gid://shopify/Product/2",
  handle: "moonlit-dagger",
  title: "Moonlit Dagger",
  options: [{ name: "Title", values: ["Default Title"] }],
  priceRange: { minVariantPrice: { amount: "90.00", currencyCode: "USD" } },
  compareAtPriceRange: { minVariantPrice: { amount: "120.00", currencyCode: "USD" } },
  variants: { nodes: [{ id: "variant-sale-only", title: "Default Title", availableForSale: true, selectedOptions: [{ name: "Title", value: "Default Title" }], price: { amount: "90.00", currencyCode: "USD" }, compareAtPrice: { amount: "120.00", currencyCode: "USD" }, image }], pageInfo: { hasNextPage: false } },
};
const regularProduct = {
  ...singleSaleProduct,
  id: "gid://shopify/Product/3",
  handle: "iron-sigil",
  title: "Iron Sigil",
  priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
  compareAtPriceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" } },
  variants: { nodes: [{ id: "variant-regular", title: "Default Title", availableForSale: true, selectedOptions: [{ name: "Title", value: "Default Title" }], price: { amount: "75.00", currencyCode: "USD" }, compareAtPrice: null, image }], pageInfo: { hasNextPage: false } },
};
const collection = { id: "gid://shopify/Collection/1", handle: "featured", title: "Featured Relics", description: "Collector favorites.", seo: { title: "Featured Relics", description: "Collector favorites." }, image, products: { nodes: [product] } };
const productBackedCollection = { id: "gid://shopify/Collection/2", handle: "product-backed", title: "Product-backed Relics", description: "Product artwork fallback.", image: null, products: { nodes: [product] } };
const emptyCollection = { id: "gid://shopify/Collection/3", handle: "empty", title: "Awaiting Relics", description: "An empty collection.", image: null, products: { nodes: [] } };
const brokenCollection = { id: "gid://shopify/Collection/4", handle: "broken", title: "Shattered Archive", description: "Broken media fallback.", image: { ...image, url: "http://127.0.0.1:5173/missing-collection-art.jpg" }, products: { nodes: [] } };
let lastAddedMerchandiseId = null;

async function mockShopify(page) {
  let cartQuantity = 0;
  let cartVariant = product.variants.nodes[0];
  lastAddedMerchandiseId = null;
  await page.route("**/test-product-*.svg*", async (route) => {
    const url = route.request().url();
    const dimensions = url.includes("portrait")
      ? { width: 600, height: 1000, color: "#8f698f" }
      : url.includes("landscape")
        ? { width: 1200, height: 600, color: "#54778f" }
        : { width: 800, height: 800, color: "#8f7654" };
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><rect width="100%" height="100%" fill="${dimensions.color}"/><path d="M0 0L${dimensions.width} ${dimensions.height}M${dimensions.width} 0L0 ${dimensions.height}" stroke="#f2dfb4" stroke-width="20"/></svg>`,
    });
  });
  const cart = () => ({
    id: "cart-1",
    checkoutUrl: "https://checkout.example/cart-1",
    totalQuantity: cartQuantity,
    lines: { nodes: cartQuantity ? [{
      id: "line-1",
      quantity: cartQuantity,
      merchandise: {
        ...cartVariant,
        product: { title: product.title, handle: product.handle },
      },
    }] : [] },
    cost: { subtotalAmount: { amount: String(108 * cartQuantity), currencyCode: "USD" } },
  });

  await page.route("**/graphql.json", async (route) => {
    const body = route.request().postDataJSON();
    const query = body.query;
    if (query.includes("ProductByHandle")) return route.fulfill({ json: { data: { product } } });
    if (query.includes("CollectionProducts")) return route.fulfill({ json: { data: { collection: { ...collection, products: { nodes: [product, singleSaleProduct, regularProduct], pageInfo: { hasNextPage: false, endCursor: null } } } } } });
    if (query.includes("CollectionsList")) return route.fulfill({ json: { data: { collections: { nodes: [collection, productBackedCollection, emptyCollection, brokenCollection], pageInfo: { hasNextPage: false, endCursor: null } } } } });
    if (query.includes("ProductsList")) return route.fulfill({ json: { data: { products: { nodes: [product, singleSaleProduct, regularProduct], pageInfo: { hasNextPage: false, endCursor: null } } } } });
    if (query.includes("CartCreate")) return route.fulfill({ json: { data: { cartCreate: { cart: cart(), userErrors: [] } } } });
    if (query.includes("AddToCart")) {
      lastAddedMerchandiseId = body.variables.lines[0].merchandiseId;
      cartVariant = product.variants.nodes.find((variant) => variant.id === lastAddedMerchandiseId) || cartVariant;
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

async function getPrimaryMediaMetrics(page) {
  return page.evaluate(() => {
    const frame = document.querySelector(".product-primary-media");
    const image = frame?.querySelector("img");
    if (!frame || !image) return null;

    const frameBox = frame.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const styles = getComputedStyle(image);
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const containedWidth = Math.min(imageBox.width, imageBox.height * naturalRatio);
    const containedHeight = containedWidth / naturalRatio;

    return {
      frame: { x: frameBox.x + window.scrollX, y: frameBox.y + window.scrollY, width: frameBox.width, height: frameBox.height },
      image: { x: imageBox.x, y: imageBox.y, width: imageBox.width, height: imageBox.height },
      natural: { width: image.naturalWidth, height: image.naturalHeight, ratio: naturalRatio },
      contained: {
        width: containedWidth,
        height: containedHeight,
        horizontalSpace: imageBox.width - containedWidth,
        verticalSpace: imageBox.height - containedHeight,
      },
      objectFit: styles.objectFit,
      objectPosition: styles.objectPosition,
      position: styles.position,
      currentSrc: image.currentSrc,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
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

test("the dimensional artifact lazy-loads while preserving an immediate fallback", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Lazy-load behavior is viewport-independent.");
  await page.route("**/src/components/ArcaneArtifact.jsx*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".artifact-static")).toBeVisible();
  await expect(page.locator(".artifact-advanced")).toBeVisible();
  await expect(page.locator(".artifact-crystal-face")).toHaveCount(4);
  await expect(page.locator(".artifact-ring")).toHaveCount(5);
});

test("artifact import failure keeps the hero and its CTA usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Failure behavior is viewport-independent.");
  await page.route("**/src/components/ArcaneArtifact.jsx*", (route) => route.abort("failed"));
  await page.goto("/");
  await expect(page.locator(".artifact-static")).toBeVisible();
  await page.getByRole("link", { name: "Shop available pieces" }).click();
  await expect(page).toHaveURL(/\/products$/);
});

test("artifact pauses while hidden and removes its visibility listener on unmount", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Lifecycle behavior is viewport-independent.");
  await page.addInitScript(() => {
    window.__artifactListeners = { adds: 0, removes: 0 };
    const add = Document.prototype.addEventListener;
    const remove = Document.prototype.removeEventListener;
    Document.prototype.addEventListener = function patchedAdd(type, ...args) {
      if (type === "visibilitychange") window.__artifactListeners.adds += 1;
      return add.call(this, type, ...args);
    };
    Document.prototype.removeEventListener = function patchedRemove(type, ...args) {
      if (type === "visibilitychange") window.__artifactListeners.removes += 1;
      return remove.call(this, type, ...args);
    };
  });
  await page.goto("/");
  const artifact = page.locator(".artifact-advanced");
  await expect(artifact).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(artifact).toHaveAttribute("data-paused", "true");
  await page.getByRole("link", { name: "Shop available pieces" }).click();
  await expect.poll(() => page.evaluate(() => window.__artifactListeners)).toEqual(expect.objectContaining({ adds: 2, removes: 2 }));
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

test("primary product media contains and centers portrait, landscape, and square gallery images", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Gallery image geometry is exercised once at the representative mobile viewport.");
  await page.goto("/products/celestial-staff");

  const primaryImage = page.locator(".product-primary-media img");
  const portraitButton = page.getByRole("button", { name: "View image 1 of 3" });
  const landscapeButton = page.getByRole("button", { name: "View image 2 of 3" });
  const squareButton = page.getByRole("button", { name: "View image 3 of 3" });
  await expect(primaryImage).toBeVisible();
  const initialFrame = (await getPrimaryMediaMetrics(page)).frame;

  await expect(portraitButton).toHaveAttribute("aria-pressed", "true");
  const portrait = await getPrimaryMediaMetrics(page);
  expect(portrait.currentSrc).toContain("test-product-portrait.svg");
  expect(portrait.natural.ratio).toBeCloseTo(0.6, 2);

  await landscapeButton.focus();
  await expect(landscapeButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(landscapeButton).toHaveAttribute("aria-pressed", "true");
  await expect(primaryImage).toHaveAttribute("alt", landscapeImage.altText);
  const landscape = await getPrimaryMediaMetrics(page);
  expect(landscape.currentSrc).toContain("test-product-landscape.svg");
  expect(landscape.natural.ratio).toBeCloseTo(2, 2);

  await squareButton.click();
  await expect(squareButton).toHaveAttribute("aria-pressed", "true");
  await expect(primaryImage).toHaveAttribute("alt", squareImage.altText);
  const square = await getPrimaryMediaMetrics(page);
  expect(square.currentSrc).toContain("test-product-square.svg");
  expect(square.natural.ratio).toBeCloseTo(1, 2);

  for (const metrics of [portrait, landscape, square]) {
    expect(metrics.objectFit).toBe("contain");
    expect(metrics.objectPosition).toBe("50% 50%");
    expect(metrics.position).toBe("absolute");
    expect(metrics.image.width).toBeLessThanOrEqual(metrics.frame.width);
    expect(metrics.image.height).toBeLessThanOrEqual(metrics.frame.height);
    expect(metrics.contained.width).toBeLessThanOrEqual(metrics.image.width + 0.5);
    expect(metrics.contained.height).toBeLessThanOrEqual(metrics.image.height + 0.5);
    expect(Math.max(metrics.contained.horizontalSpace, metrics.contained.verticalSpace)).toBeGreaterThanOrEqual(0);
    expect(metrics.frame.x).toBeCloseTo(initialFrame.x, 1);
    expect(metrics.frame.y).toBeCloseTo(initialFrame.y, 1);
    expect(metrics.frame.width).toBeCloseTo(initialFrame.width, 1);
    expect(metrics.frame.height).toBeCloseTo(initialFrame.height, 1);
  }

  await portraitButton.click();
  await expect(portraitButton).toHaveAttribute("aria-pressed", "true");
  await expect(primaryImage).toHaveAttribute("alt", portraitImage.altText);
});

test("primary product media stays bounded without horizontal overflow", async ({ page }) => {
  await page.goto("/products/celestial-staff");
  await expect(page.locator(".product-primary-media img")).toBeVisible();
  const metrics = await getPrimaryMediaMetrics(page);
  const viewport = page.viewportSize();

  expect(metrics).not.toBeNull();
  expect(metrics.objectFit).toBe("contain");
  expect(metrics.frame.width / metrics.frame.height).toBeCloseTo(4 / 3, 1);
  expect(metrics.frame.height).toBeLessThanOrEqual(Math.min(680, viewport.height));
  expect(metrics.image.width).toBeLessThanOrEqual(metrics.frame.width);
  expect(metrics.image.height).toBeLessThanOrEqual(metrics.frame.height);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  await expect(page.locator(".product-price")).toHaveAttribute("aria-label", "Sale price $120.00. Original price $150.00. Save 20 percent.");
});

test("sale pricing follows the selected variant and sends its Shopify ID to cart", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Variant pricing behavior is viewport-independent.");
  await page.goto("/products/celestial-staff");

  const price = page.locator(".product-price");
  await expect(price).toHaveAttribute("aria-label", "Sale price $120.00. Original price $150.00. Save 20 percent.");
  await expect(price.locator(".price-original")).toHaveText("$150.00");
  await expect(price.locator(".price-current")).toHaveText("$120.00");
  await expect(price.locator(".discount-badge")).toHaveText("20% OFF");
  const salePriceHeight = (await price.boundingBox())?.height;

  await page.getByRole("button", { name: "Mundane" }).click();
  await expect(price).toHaveAttribute("aria-label", "Price $135.00.");
  await expect(price.locator(".price-current")).toHaveText("$135.00");
  await expect(price.locator(".price-original")).toHaveCount(0);
  await expect(price.locator(".discount-badge")).toHaveCount(0);
  const regularPriceHeight = (await price.boundingBox())?.height;
  expect(regularPriceHeight).toBe(salePriceHeight);

  await page.getByRole("button", { name: "Arcane" }).click();
  await expect(price.locator(".discount-badge")).toHaveText("20% OFF");
  await page.getByRole("button", { name: "Mundane" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: "Your cart (1)" })).toContainText("Mundane");
  expect(lastAddedMerchandiseId).toBe("variant-3");
});

test("product cards show exact sales without misleading mixed-variant badges", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Card pricing behavior is viewport-independent.");
  await page.goto("/products");

  const mixedCard = page.getByRole("link", { name: /Celestial Staff/ }).locator(".price-row");
  await expect(mixedCard.locator(".price-original")).toHaveText("$150.00");
  await expect(mixedCard.locator(".price-current")).toHaveText("$120.00");
  await expect(mixedCard.locator(".discount-badge")).toHaveCount(0);

  const exactSaleCard = page.getByRole("link", { name: /Moonlit Dagger/ }).locator(".price-row");
  await expect(exactSaleCard).toHaveAttribute("aria-label", "Sale price $90.00. Original price $120.00. Save 25 percent.");
  await expect(exactSaleCard.locator(".discount-badge")).toHaveText("25% OFF");

  const regularCard = page.getByRole("link", { name: /Iron Sigil/ }).locator(".price-row");
  await expect(regularCard).toHaveAttribute("aria-label", "Price $75.00.");
  await expect(regularCard.locator(".price-original, .discount-badge")).toHaveCount(0);
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

test("portfolio replaces the old project gallery with an accessible construction experience", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Content behavior is viewport-independent.");
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Portfolio Under Construction" })).toBeVisible();
  await expect(page.getByText(/Celestial Mage Staff/)).toHaveCount(0);
  const primary = page.getByRole("link", { name: "Shop available pieces" });
  await expect(primary).toBeVisible();
  const box = await primary.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  if (process.env.REVIEW_SCREENSHOT_DIR) {
    const viewport = page.viewportSize();
    await page.screenshot({ path: join(process.env.REVIEW_SCREENSHOT_DIR, `predeployment-portfolio-${viewport.width}x${viewport.height}.png`), fullPage: true });
  }
});

test("reviews construction page handles configured and unconfigured Etsy destinations safely", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "External-link behavior is viewport-independent.");
  await page.goto("/reviews");
  await expect(page.getByRole("heading", { name: "Reviews Page Under Construction" })).toBeVisible();
  await expect(page.getByText(/customer reviews are available on our Etsy shop/i)).toBeVisible();
  const etsy = page.getByRole("link", { name: /View Reviews on Etsy/ });
  if (await etsy.count()) {
    await expect(etsy).toHaveAttribute("href", /^https:\/\/([a-z0-9-]+\.)?etsy\.com\//i);
    await expect(etsy).toHaveAttribute("target", "_blank");
    await expect(etsy).toHaveAttribute("rel", "noopener noreferrer");
  } else {
    await expect(page.getByText("Etsy reviews link coming soon")).toBeVisible();
    await expect(page.getByText("The official Etsy shop link has not been configured yet.")).toBeVisible();
  }
  await expect(page.locator(".jdgm-widget")).toHaveCount(0);
});

test("fantasy remains default and cyberpunk persists through internal navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Theme URL behavior is viewport-independent.");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-storefront-theme", "fantasy");
  await page.goto("/?theme=cyberpunk");
  await expect(page.locator("html")).toHaveAttribute("data-storefront-theme", "cyberpunk");
  await page.getByRole("link", { name: "Shop available pieces" }).click();
  await expect(page).toHaveURL(/\/products\?theme=cyberpunk$/);
  await expect(page.locator("html")).toHaveAttribute("data-storefront-theme", "cyberpunk");
});

test("commerce routes render in both storefront themes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Cross-theme route coverage runs once.");
  for (const theme of ["fantasy", "cyberpunk"]) {
    const suffix = theme === "cyberpunk" ? "?theme=cyberpunk" : "";
    for (const path of ["/", "/products", "/collections/featured", "/products/celestial-staff"]) {
      await page.goto(`${path}${suffix}`);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-storefront-theme", theme);
    }
  }
});

test("cart and mobile menu behavior remain intact in both themes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Interactive theme coverage runs once.");
  for (const suffix of ["", "?theme=cyberpunk"]) {
    await page.goto(`/${suffix}`);
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open cart with 0 items" }).click();
    await expect(page.getByRole("dialog", { name: "Your cart (0)" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("both themes have no serious or critical homepage Axe violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Theme Axe checks run once.");
  for (const suffix of ["", "?theme=cyberpunk"]) {
    await page.goto(`/${suffix}`);
    await expectNoMaterialAxeViolations(page);
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
  ["portfolio", "/portfolio"],
  ["reviews", "/reviews"],
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
  "/reviews",
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

  for (const path of ["/", "/products", "/portfolio", "/reviews"]) {
    await page.goto(`${path}?theme=cyberpunk`);
    await expect(page.locator("main h1")).toBeVisible();
    const sizes = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(sizes.scrollWidth, `Cyberpunk horizontal overflow at ${path}`).toBeLessThanOrEqual(sizes.clientWidth + 1);
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
