import test from "node:test";
import assert from "node:assert/strict";
import {
  PortfolioValidationError,
  buildInquiryHref,
  createPortfolioRegistry,
  getPortfolioProject,
  validatePortfolioProjects,
} from "../../src/lib/portfolio.js";
import { minimalPortfolioProject, validPortfolioProject } from "../fixtures/portfolio-project.js";

function copyProject(overrides = {}) {
  return structuredClone({ ...validPortfolioProject, ...overrides });
}

function expectInvalid(projects, pattern) {
  assert.throws(() => validatePortfolioProjects(projects), (error) => {
    assert.ok(error instanceof PortfolioValidationError);
    assert.match(error.message, pattern);
    return true;
  });
}

test("an empty Portfolio registry is valid", () => {
  assert.deepEqual(validatePortfolioProjects([]), []);
});

test("a complete local project validates and can be looked up without external data", () => {
  const projects = validatePortfolioProjects([validPortfolioProject]);
  assert.equal(getPortfolioProject(projects, validPortfolioProject.slug)?.title, validPortfolioProject.title);
  assert.equal(getPortfolioProject(projects, "missing-project"), null);
  assert.equal(buildInquiryHref(validPortfolioProject), "/contact?source=portfolio&project=example-commission-study&category=Original+fantasy+prop");
  assert.equal(buildInquiryHref(minimalPortfolioProject), null);
});

test("duplicate slugs identify the repeated project", () => {
  expectInvalid([validPortfolioProject, copyProject({ title: "Second fixture" })], /duplicate slug "example-commission-study"/);
});

test("malformed slugs are rejected", () => {
  expectInvalid([copyProject({ slug: "Invalid Project Slug" })], /slug: must use lowercase kebab-case/);
});

test("invalid taxonomy values are rejected", () => {
  expectInvalid([copyProject({ projectType: "shop-product" })], /projectType: "shop-product" is not an allowed value/);
  expectInvalid([copyProject({ status: "available" })], /status: "available" is not an allowed value/);
});

test("missing required narrative fields are rejected", () => {
  expectInvalid([copyProject({ contribution: "" })], /contribution: must be a non-empty string/);
  expectInvalid([copyProject({ finalOutcome: null })], /finalOutcome: must be a non-empty string/);
});

test("media requires meaningful alt text and positive dimensions", () => {
  expectInvalid([copyProject({ heroMedia: { ...validPortfolioProject.heroMedia, alt: "" } })], /heroMedia.alt: meaningful alt text is required/);
  expectInvalid([copyProject({ heroMedia: { ...validPortfolioProject.heroMedia, width: 0 } })], /heroMedia.width: must be a positive integer/);
  expectInvalid([copyProject({ gallery: [{ ...validPortfolioProject.gallery[0], height: -10 }] })], /gallery\[0\]\.height: must be a positive integer/);
  expectInvalid([copyProject({ heroMedia: { ...validPortfolioProject.heroMedia, src: "javascript:alert(1)" } })], /heroMedia.src: must be an HTTPS URL or root-relative path/);
  expectInvalid([copyProject({ heroMedia: { ...validPortfolioProject.heroMedia, permissionStatus: "pending" } })], /heroMedia.permissionStatus: "pending" is not supported/);
});

test("client names require explicit naming permission", () => {
  expectInvalid([copyProject({ clientName: "Private Customer" })], /clientName: may only be present with named-with-permission/);
  expectInvalid([copyProject({ clientDisclosure: "named-with-permission", clientName: null })], /clientName: is required with named-with-permission/);
  assert.doesNotThrow(() => validatePortfolioProjects([copyProject({ clientDisclosure: "named-with-permission", clientName: "Approved Client" })]));
});

test("testimonial references require provider identity and permission", () => {
  expectInvalid([copyProject({ testimonialReference: { provider: "judge-me", id: "", permissionConfirmed: false } })], /testimonialReference.id: is required/);
  expectInvalid([copyProject({ testimonialReference: { provider: "judge-me", id: "review-1", permissionConfirmed: false } })], /permissionConfirmed: must be true/);
});

test("a GLB requires an accessible description and poster", () => {
  expectInvalid([copyProject({ model3d: { src: "/portfolio/example/model/example.glb", alt: "Rotatable test model" } })], /modelPoster: is required when model3d is provided/);
  expectInvalid([copyProject({ model3d: { src: "/portfolio/example/model/example.stl", alt: "Test model" }, modelPoster: validPortfolioProject.heroMedia })], /model3d.src: must be a safe \.glb/);
});

test("inquiry modes and category requirements are validated", () => {
  expectInvalid([copyProject({ inquiry: { mode: "order-this-project" } })], /inquiry.mode: "order-this-project" is not an allowed value/);
  expectInvalid([copyProject({ inquiry: { mode: "category-open", category: null } })], /inquiry.category: is required when mode is category-open/);
});

test("malformed SEO metadata is rejected", () => {
  expectInvalid([copyProject({ seo: { title: "", description: "Valid description" } })], /seo.title: must be 1-70 characters/);
  expectInvalid([copyProject({ seo: { title: "Valid title", description: "" } })], /seo.description: must be 1-200 characters/);
});

test("registry creation returns a safe configuration result instead of throwing", () => {
  const registry = createPortfolioRegistry([copyProject({ slug: "Broken Slug" })]);
  assert.deepEqual(registry.projects, []);
  assert.ok(registry.error instanceof PortfolioValidationError);
});
