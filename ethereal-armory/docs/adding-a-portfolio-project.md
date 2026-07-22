# Adding an Ethereal Armory Portfolio Project

The Portfolio is independent from the Shop. A project must render from verified local data even when Shopify, Etsy, Judge.me, and all optional references are unavailable.

## Add a new project

1. **Complete the intake sheet.** Copy `docs/portfolio-project-intake.md` and answer only with verified information.
2. **Confirm permissions.** Resolve client naming, media rights, testimonials, logos, confidentiality, and franchise-disclaimer language before publishing files.
3. **Prepare assets.** Export web-safe versions. Preserve source photographs, STL, STEP, CAD masters, and printable geometry outside the deployed repository.
4. **Create the asset directory.** Use `public/portfolio/project-slug/` and the documented subdirectories.
5. **Copy the project template.** Start from `docs/portfolio-project-template.js`; do not import the documentation template.
6. **Fill only verified fields.** Delete unused optional sections instead of adding empty headings or guessed content.
7. **Add the record.** Place the completed object in `src/data/portfolioProjects.js`.
8. **Run validation.** Execute `npm run test:unit`. Validation errors identify the project, field, and reason.
9. **Run all tests.** Execute `npm test` or the focused commands appropriate to the change.
10. **Preview locally.** Use `npm run dev` and inspect both `/portfolio` and `/portfolio/project-slug`.
11. **Confirm responsive behavior.** Check phone, tablet, desktop, and ultrawide sizes; confirm no horizontal overflow.
12. **Confirm accessibility.** Test keyboard navigation, focus, gallery selection, lightbox behavior, headings, alt text, and Axe results.
13. **Confirm independence.** The project must remain usable with Shopify and Judge.me requests blocked.
14. **Review SEO and sitemap.** Confirm canonical metadata, Open Graph image, JSON-LD, and the new sitemap URL.
15. **Commit on a feature branch.** Request review before merging. Never use a direct production edit as the content workflow.

## Update an existing project safely

1. Work on a feature branch.
2. Reopen the original intake record and verify the proposed change.
3. Preserve the slug unless an intentional redirect plan exists.
4. Use a versioned asset filename when replacing an immutable public asset, for example `hero-1600-v2.webp`.
5. Do not overwrite original masters in the public directory.
6. Reconfirm permissions when adding client identity, customer photography, testimonials, or logos.
7. Run validation, unit tests, build, focused Portfolio Playwright tests, and Axe.
8. Inspect the sitemap and social metadata.
9. Obtain review before merge or deployment.

## Validation behavior

The registry rejects:

- Duplicate or malformed slugs
- Missing required identity, narrative, contribution, outcome, gallery, or SEO data
- Invalid taxonomy values
- Unsafe URLs or paths
- Missing alt text or media dimensions
- Non-positive dimensions
- Client names without explicit naming permission
- Testimonials without provider ID and permission
- GLB models without accessible descriptions and posters
- Malformed inquiry data

Invalid production records are excluded from rendering and produce an intentional configuration state instead of a cryptic page crash.

## 3D models

Interactive viewing is intentionally deferred until an approved project has a model. When added later:

- Install `@google/model-viewer` deliberately on its own feature branch.
- Publish an optimized, non-printable GLB rather than the fabrication master.
- Require a poster and useful static gallery fallback.
- Load the model only after user intent.
- Provide orbit, zoom, reset, loading, error, reduced-motion, and accessible description behavior.
