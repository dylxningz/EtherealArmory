import { defineConfig } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 8000 },
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: viewports.map((viewport) => ({ name: `${viewport.width}px`, use: { viewport } })),
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1" ? undefined : {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      VITE_SHOPIFY_STORE_DOMAIN: "playwright-store.myshopify.com",
      VITE_SHOPIFY_STOREFRONT_TOKEN: "playwright-public-token",
      VITE_SHOPIFY_API_VERSION: "2025-10",
      VITE_JUDGEME_SHOP_DOMAIN: "playwright-store.myshopify.com",
      VITE_JUDGEME_PUBLIC_TOKEN: "playwright-public-token",
    },
  },
});
