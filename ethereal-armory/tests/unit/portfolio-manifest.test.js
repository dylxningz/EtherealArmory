import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildPortfolioManifest } from "../../scripts/lib/portfolioManifest.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const projectContent = {
  slug: "folder-project",
  title: "Folder Project",
  projectType: "studio-original",
  category: "display-piece",
  creativeOrigin: "original",
  status: "completed",
  clientDisclosure: "studio-owned",
  projectSummary: "A local folder fixture for manifest validation.",
  contribution: "The fixture verifies repository-owned project packaging.",
  finalOutcome: "The project is converted into a validated generated record.",
  seo: {
    title: "Folder Project",
    description: "A test-only folder project used to validate build-time media discovery.",
  },
};

function withPortfolioRoot(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ethereal-portfolio-"));
  try {
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeProject(root, config = projectContent) {
  const projectRoot = path.join(root, config.slug);
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "project.json"), JSON.stringify(config), "utf8");
  return projectRoot;
}

test("the current Celestial Staff folder publishes its curated media with stable dimensions and ordering", () => {
  const root = path.resolve("public", "portfolio");
  const manifest = buildPortfolioManifest(root);
  assert.deepEqual(manifest.issues, []);
  assert.equal(manifest.projects.length, 1);

  const [project] = manifest.projects;
  assert.equal(project.slug, "celestial-staff");
  assert.equal(project.heroMedia.src, "/portfolio/celestial-staff/final/celestial-staff-full-view.webp");
  assert.equal(project.heroMedia.width, 1500);
  assert.equal(project.heroMedia.height, 2000);
  assert.equal(project.gallery.length, 6);
  assert.equal(project.designImages.length, 5);
  assert.equal(project.workingImages.length, 6);
  assert.deepEqual(project.gallery.map((image) => image.src), [
    "/portfolio/celestial-staff/final/celestial-staff-full-view.webp",
    "/portfolio/celestial-staff/final/celestial-staff-upper-blade.webp",
    "/portfolio/celestial-staff/final/celestial-staff-lower-grip.webp",
    "/portfolio/celestial-staff/final/celestial-staff-blade-detail.webp",
    "/portfolio/celestial-staff/final/celestial-staff-ornament-detail.webp",
    "/portfolio/celestial-staff/final/celestial-staff-components-overview.webp",
  ]);
  assert.ok([...project.gallery, ...project.designImages, ...project.workingImages]
    .every((image) => image.permissionStatus === "confirmed" && image.width > 0 && image.height > 0));
});

test("a project requires project.json and at least one supported final image", () => withPortfolioRoot((root) => {
  fs.mkdirSync(path.join(root, "missing-json", "final"), { recursive: true });
  fs.writeFileSync(path.join(root, "missing-json", "final", "image.png"), onePixelPng);
  writeProject(root);

  const manifest = buildPortfolioManifest(root);
  assert.equal(manifest.projects.length, 0);
  assert.match(manifest.issues.find((issue) => issue.project === "missing-json").message, /project\.json is required/);
  assert.match(manifest.issues.find((issue) => issue.project === "folder-project").message, /final\/ must contain at least one supported/);
}));

test("media is discovered, grouped, measured, and ordered deterministically", () => withPortfolioRoot((root) => {
  const config = {
    ...projectContent,
    hero: "final/alpha.png",
    imageOrder: { final: ["zeta.png"] },
    media: {
      "final/zeta.png": {
        alt: "Test-only tailored final view",
        caption: "A fixture caption.",
        credit: "Test fixture",
        permissionStatus: "confirmed",
      },
    },
  };
  const projectRoot = writeProject(root, config);
  fs.mkdirSync(path.join(projectRoot, "final"));
  fs.mkdirSync(path.join(projectRoot, "working"));
  for (const relativePath of ["final/zeta.png", "final/alpha.png", "working/prototype.png"]) {
    fs.writeFileSync(path.join(projectRoot, relativePath), onePixelPng);
  }

  const manifest = buildPortfolioManifest(root);
  assert.deepEqual(manifest.issues, []);
  assert.equal(manifest.projects.length, 1);
  const [project] = manifest.projects;
  assert.equal(project.heroMedia.src, "/portfolio/folder-project/final/alpha.png");
  assert.deepEqual(project.gallery.map((image) => image.src), [
    "/portfolio/folder-project/final/zeta.png",
    "/portfolio/folder-project/final/alpha.png",
  ]);
  assert.equal(project.gallery[0].alt, "Test-only tailored final view");
  assert.equal(project.gallery[1].alt, "Folder Project — final project image 2");
  assert.equal(project.gallery[0].width, 1);
  assert.equal(project.gallery[0].height, 1);
  assert.equal(project.workingImages.length, 1);
  assert.equal("designImages" in project, false);
  assert.equal(project.seo.image, "/portfolio/folder-project/final/alpha.png");
}));

test("bad ordering and unreadable images exclude only the malformed project", () => withPortfolioRoot((root) => {
  const badOrderRoot = writeProject(root, {
    ...projectContent,
    slug: "bad-order",
    imageOrder: { final: ["missing.png"] },
  });
  fs.mkdirSync(path.join(badOrderRoot, "final"));
  fs.writeFileSync(path.join(badOrderRoot, "final", "actual.png"), onePixelPng);

  const badImageRoot = writeProject(root, { ...projectContent, slug: "bad-image" });
  fs.mkdirSync(path.join(badImageRoot, "final"));
  fs.writeFileSync(path.join(badImageRoot, "final", "broken.png"), Buffer.from("not an image"));

  const manifest = buildPortfolioManifest(root);
  assert.deepEqual(manifest.projects, []);
  assert.match(manifest.issues.find((issue) => issue.project === "bad-order").message, /references missing or unsupported image/);
  assert.match(manifest.issues.find((issue) => issue.project === "bad-image").message, /could not read intrinsic dimensions/);
}));
