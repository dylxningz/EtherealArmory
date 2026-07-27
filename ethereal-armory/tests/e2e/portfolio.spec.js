import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import { minimalPortfolioProject, validPortfolioProject } from "../fixtures/portfolio-project.js";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const fittingMedia = [
  { src: "/test-product-portrait.svg", alt: "Test portrait gallery image", width: 600, height: 1000 },
  { src: "/test-product-landscape.svg", alt: "Test landscape gallery image", width: 1200, height: 600 },
  { src: "/test-product-square.svg", alt: "Test square gallery image", width: 800, height: 800 },
];
const fittingProject = {
  ...validPortfolioProject,
  slug: "gallery-fitting-study",
  title: "Gallery Fitting Study",
  heroMedia: fittingMedia[0],
  gallery: fittingMedia,
  seo: {
    title: "Gallery Fitting Study",
    description: "A test-only project covering portrait, landscape, and square Portfolio media.",
  },
};

async function useProjects(page, projects) {
  await page.addInitScript((fixtureProjects) => {
    window.__EA_PORTFOLIO_TEST_PROJECTS__ = fixtureProjects;
  }, projects);
}

async function mockFittingMedia(page) {
  await page.route("**/test-product-*.svg*", async (route) => {
    const url = route.request().url();
    const dimensions = url.includes("portrait")
      ? { width: 600, height: 1000, color: "#8f698f" }
      : url.includes("landscape")
        ? { width: 1200, height: 600, color: "#54778f" }
        : { width: 800, height: 800, color: "#8f7654" };
    await route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><rect width="100%" height="100%" fill="${dimensions.color}"/><path d="M0 0L${dimensions.width} ${dimensions.height}M${dimensions.width} 0L0 ${dimensions.height}" stroke="#f2dfb4" stroke-width="20"/></svg>`,
    });
  });
}

async function expectNoMaterialAxeViolations(page) {
  await expect(page.locator("main h1")).toBeVisible();
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(async () => (await window.axe.run(document)).violations);
  const material = violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
  expect(material, material.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
}

async function expectContainedMedia(frame, image) {
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  const metrics = await image.evaluate((element) => {
    const frameRect = element.parentElement.getBoundingClientRect();
    const imageRect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const scale = Math.min(frameRect.width / element.naturalWidth, frameRect.height / element.naturalHeight);
    return {
      frame: { width: frameRect.width, height: frameRect.height },
      image: { width: imageRect.width, height: imageRect.height },
      content: { width: element.naturalWidth * scale, height: element.naturalHeight * scale },
      natural: { width: element.naturalWidth, height: element.naturalHeight },
      objectFit: styles.objectFit,
      objectPosition: styles.objectPosition,
    };
  });

  expect(metrics.objectFit).toBe("contain");
  expect(metrics.objectPosition).toBe("50% 50%");
  expect(metrics.natural.width).toBeGreaterThan(0);
  expect(metrics.natural.height).toBeGreaterThan(0);
  expect(Math.abs(metrics.image.width - metrics.frame.width)).toBeLessThanOrEqual(3);
  expect(Math.abs(metrics.image.height - metrics.frame.height)).toBeLessThanOrEqual(3);
  expect(metrics.content.width).toBeLessThanOrEqual(metrics.frame.width + 1);
  expect(metrics.content.height).toBeLessThanOrEqual(metrics.frame.height + 1);
  await expect(frame).toBeVisible();
  return metrics.frame;
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
  const finalStage = page.locator(".portfolio-gallery").first().locator(".portfolio-gallery-stage");
  const finalStageImage = finalStage.locator("img");
  const stableFrame = await expectContainedMedia(finalStage, finalStageImage);
  for (let index = 0; index < 6; index += 1) {
    await finalSelection.getByRole("button").nth(index).click();
    await expect(finalStageImage).toHaveAttribute("alt", /Celestial Staff|Upper section|Lower section|finished silver blade|hanging ornament|Finished Celestial Staff components/i);
    const currentFrame = await expectContainedMedia(finalStage, finalStageImage);
    expect(Math.abs(currentFrame.width - stableFrame.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(currentFrame.height - stableFrame.height)).toBeLessThanOrEqual(1);
  }
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

test("portrait, landscape, and square media remain fully contained in stable frames", async ({ page }, testInfo) => {
  const requiredWidths = new Set(["320px", "375px", "768px", "1024px", "1440px", "2560px"]);
  test.skip(!requiredWidths.has(testInfo.project.name), "Media fitting is measured at the requested responsive widths.");
  await mockFittingMedia(page);
  await useProjects(page, [fittingProject]);

  await page.goto(`/portfolio/${fittingProject.slug}`);
  const heroFrame = page.locator(".portfolio-project-hero-media");
  await expectContainedMedia(heroFrame, heroFrame.locator("img"));

  const gallery = page.locator(".portfolio-gallery").first();
  const stage = gallery.locator(".portfolio-gallery-stage");
  const stageImage = stage.locator("img");
  const selection = page.getByLabel("Final gallery image selection");
  const initialFrame = await expectContainedMedia(stage, stageImage);

  for (const [index, media] of fittingMedia.entries()) {
    await selection.getByRole("button").nth(index).click();
    await expect(stageImage).toHaveAttribute("alt", media.alt);
    const currentFrame = await expectContainedMedia(stage, stageImage);
    expect(Math.abs(currentFrame.width - initialFrame.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(currentFrame.height - initialFrame.height)).toBeLessThanOrEqual(1);
  }

  await stage.click();
  const dialog = page.getByRole("dialog", { name: "Final gallery image viewer" });
  const lightboxFrame = dialog.locator(".portfolio-lightbox-image");
  await expect(dialog).toBeVisible();
  await expectContainedMedia(lightboxFrame, lightboxFrame.locator("img"));
  await page.keyboard.press("ArrowLeft");
  await expect(lightboxFrame.locator("img")).toHaveAttribute("alt", fittingMedia[1].alt);
  await expectContainedMedia(lightboxFrame, lightboxFrame.locator("img"));
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(stage).toBeFocused();

  const widths = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);

  await page.goto("/portfolio");
  const cardMedia = page.locator(".portfolio-card-media");
  await expectContainedMedia(cardMedia, cardMedia.locator("img"));
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
