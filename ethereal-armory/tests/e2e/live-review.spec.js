import { expect, test } from "@playwright/test";

const liveRoutes = [
  ["home", "/", "Fantasy made tangible.", ".product-card:not(.skeleton-card)"],
  ["catalog", "/products", "Shop All", ".product-card:not(.skeleton-card)"],
  ["product", "/products/luna-snow-emblem-keychain-marvel-rivals", "Luna Snow Emblem Keychain - Marvel Rivals", ".product-details"],
];

test.skip(process.env.RUN_LIVE_STOREFRONT !== "1", "Live metrics require the local Shopify environment.");

for (const [name, path, heading, readySelector] of liveRoutes) {
  test(`reports live ${name} transfer and rendering metrics`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "390px", "Live metrics run once at the representative mobile viewport.");
    const shopifyImages = [];
    page.on("response", async (response) => {
      if (
        response.request().resourceType() !== "image"
        || !(response.url().includes("cdn.shopify.com") || response.url().includes("/cdn/shop/"))
      ) return;
      const headers = await response.allHeaders();
      shopifyImages.push({ url: response.url(), bytes: Number(headers["content-length"] || 0) });
    });
    await page.addInitScript(() => {
      window.__reviewMetrics = { cls: 0, lcp: 0, shifts: [] };
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
          window.__reviewMetrics.cls = Math.max(window.__reviewMetrics.cls, sessionValue);
          window.__reviewMetrics.shifts.push({
            value: entry.value,
            sources: entry.sources.map(({ node }) => {
              if (!node) return "unknown";
              const name = node.tagName?.toLowerCase() || "node";
              const id = node.id ? `#${node.id}` : "";
              const classes = typeof node.className === "string" && node.className
                ? `.${node.className.trim().split(/\s+/).join(".")}`
                : "";
              return `${name}${id}${classes}`;
            }),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__reviewMetrics.lcp = entries[entries.length - 1]?.startTime || 0;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });

    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    const retry = page.getByRole("button", { name: "Try again" });
    if (await retry.isVisible()) await retry.click();
    await expect(page.locator(readySelector).first()).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState("networkidle");
    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource");
      return {
        cls: window.__reviewMetrics.cls,
        lcpMs: window.__reviewMetrics.lcp,
        resourceCount: resources.length,
        totalTransferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        sameOriginTransferBytes: resources
          .filter((entry) => new URL(entry.name).origin === location.origin)
          .reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        shifts: window.__reviewMetrics.shifts.sort((a, b) => b.value - a.value).slice(0, 5),
      };
    });
    console.log(`[live-performance:${name}] ${JSON.stringify({
      ...metrics,
      shopifyImageRequests: shopifyImages.length,
      shopifyImageBytesWithHeader: shopifyImages.reduce((sum, item) => sum + item.bytes, 0),
    })}`);
  });
}
