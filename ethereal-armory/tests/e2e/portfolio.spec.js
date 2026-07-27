import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import { minimalPortfolioProject, validPortfolioProject } from "../fixtures/portfolio-project.js";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

async function useProjects(page, projects) {
  await page.addInitScript((fixtureProjects) => {
    window.__EA_PORTFOLIO_TEST_PROJECTS__ = fixtureProjects;
  }, projects);
}

async function expectNoMaterialAxeViolations(page) {
  await expect(page.locator("main h1")).toBeVisible();
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => (await window.axe.run(document)).violations);
  const material = violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
  expect(material, material.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
}

test("zero-project Portfolio renders an intentional empty state with no fake cards and complete SEO", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Content behavior is viewport-independent.");
  await useProjects(page, []);
  let externalDataRequests = 0;
  page.on("request", (request) => {
    if (/graphql\.json|judge\.me|judgeme/i.test(request.url())) externalDataRequests += 1;
  });
  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { level: 1, name: "Selected Work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project case studies are currently being prepared." })).toBeVisible();
  await expect(page.locator(".portfolio-card")).toHaveCount(0);
  await expect(page.getByText("Celestial Staff")).toHaveCount(0);
  await expect(page).toHaveTitle("Portfolio | Ethereal Armory");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Selected custom commissions/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.etherealarmory.com/portfolio");
  await expect(page.getByRole("link", { name: "Discuss a custom build" }).first()).toBeVisible();
  expect(externalDataRequests).toBe(0);
});

test("published Celestial Staff card and detail route include complete metadata and ordered media", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Published content behavior is viewport-independent.");
  let externalDataRequests = 0;
  page.on("request", (request) => {
    if (/graphql\.json|judge\.me|judgeme/i.test(request.url())) externalDataRequests += 1;
  });

  await page.goto("/portfolio");
  const card = page.locator(".portfolio-card");
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("heading", { name: "Celestial Staff" })).toBeVisible();
  await expect(card.locator("img")).toHaveAttribute("src", /celestial-staff-full-view\.webp$/);
  await card.getByRole("link", { name: "View Celestial Staff project" }).click();

  await expect(page).toHaveURL(/\/portfolio\/celestial-staff$/);
  await expect(page.getByRole("heading", { level: 1, name: "Celestial Staff" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Design development" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Fabrication and finish details" })).toBeVisible();
  const finalSelection = page.getByLabel("Final gallery image selection");
  await expect(finalSelection.getByRole("button")).toHaveCount(6);
  const secondFinalImage = finalSelection.getByRole("button").nth(1);
  await secondFinalImage.click();
  await expect(secondFinalImage).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Open Upper section of the completed Celestial Staff/ }).click();
  const liveDialog = page.getByRole("dialog", { name: "Final gallery image viewer" });
  await expect(liveDialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(liveDialog).toContainText("3 / 6");
  await page.keyboard.press("Escape");
  await expect(liveDialog).toBeHidden();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.etherealarmory.com/portfolio/celestial-staff");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://www.etherealarmory.com/portfolio/celestial-staff/final/celestial-staff-full-view.webp");
  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(structuredData.join("\n")).toContain("Celestial Staff");
  expect(structuredData.join("\n")).toContain("BreadcrumbList");
  expect(externalDataRequests).toBe(0);
});

test("PortfolioCard and detail route render a valid local fixture without commerce or review requests", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Fixture rendering is viewport-independent.");
  let externalDataRequests = 0;
  page.on("request", (request) => {
    if (/graphql\.json|judge\.me|judgeme/i.test(request.url())) externalDataRequests += 1;
  });
  await useProjects(page, [validPortfolioProject]);
  await page.goto("/portfolio");
  const card = page.locator(".portfolio-card");
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("heading", { name: validPortfolioProject.title })).toBeVisible();
  const cardLink = card.getByRole("link", { name: `View ${validPortfolioProject.title} project` });
  await cardLink.focus();
  await expect(cardLink).toBeFocused();
  await cardLink.click();

  await expect(page).toHaveURL(/\/portfolio\/example-commission-study$/);
  await expect(page.getByRole("heading", { level: 1, name: validPortfolioProject.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the studio created" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What the project demonstrated" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Design and fabrication roles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fabrication and finish details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Design development" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Process timeline" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Discuss a custom build" })).toHaveAttribute("href", /source=portfolio.*project=example-commission-study/);
  expect(await page.locator('script[type="application/ld+json"]').evaluate((script) => script.textContent)).toContain("BreadcrumbList");
  expect(externalDataRequests).toBe(0);
});

test("project detail omits every unavailable optional section cleanly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Conditional content is viewport-independent.");
  await useProjects(page, [minimalPortfolioProject]);
  await page.goto(`/portfolio/${minimalPortfolioProject.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: minimalPortfolioProject.title })).toBeVisible();
  for (const heading of ["Design and fabrication roles", "Design goals", "Fabrication and finish details", "Design development", "Process timeline", "Challenges and solutions", "Three-dimensional model", "Lessons learned", "Have a related idea?"]) {
    await expect(page.getByRole("heading", { name: heading })).toHaveCount(0);
  }
  await expect(page.getByText("N/A", { exact: true })).toHaveCount(0);
});

test("gallery selection, announcements, keyboard focus, and lightbox controls are accessible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Interactive gallery behavior runs once.");
  await useProjects(page, [validPortfolioProject]);
  await page.goto(`/portfolio/${validPortfolioProject.slug}`);
  const second = page.getByRole("button", { name: /Show image 2 of 2/ });
  await second.focus();
  await expect(second).toBeFocused();
  await second.press("Enter");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".portfolio-gallery .sr-only").first()).toContainText("Showing image 2 of 2");
  await page.getByRole("button", { name: /Open Test-only secondary view/ }).click();
  const dialog = page.getByRole("dialog", { name: "Final gallery image viewer" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close image viewer" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(dialog).toContainText("1 / 2");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("unknown Portfolio slugs use the existing crawl-safe 404", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Unknown-route behavior is viewport-independent.");
  for (const slug of ["not-a-project", "missing-commission"]) {
    await page.goto(`/portfolio/${slug}`);
    await expect(page.getByRole("heading", { name: "This artifact cannot be found." })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  }
});

test("empty and populated Portfolio routes have no material Axe violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "390px", "Axe runs once at a representative mobile width.");
  await useProjects(page, []);
  await page.goto("/portfolio");
  await expectNoMaterialAxeViolations(page);
  await useProjects(page, [validPortfolioProject]);
  await page.goto(`/portfolio/${validPortfolioProject.slug}`);
  await expectNoMaterialAxeViolations(page);
});

test("Portfolio landing and detail pages remain within every configured viewport", async ({ page }) => {
  await useProjects(page, [validPortfolioProject]);
  for (const path of ["/portfolio", `/portfolio/${validPortfolioProject.slug}`]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(widths.scroll, `Horizontal overflow at ${path}`).toBeLessThanOrEqual(widths.client + 1);
  }
});
