# Adding an Ethereal Armory Portfolio project

The Portfolio is independent from the Shop. Each project is authored inside one self-contained folder and must render from verified local files even when Shopify, Etsy, Judge.me, and all optional references are unavailable.

## Folder contract

```text
public/portfolio/project-slug/
  project.json
  final/
  working/  # optional
  design/   # optional
```

`project.json` and at least one supported image in `final/` are mandatory. `working/` and `design/` may be absent or empty; their page sections are omitted automatically. AVIF, JPEG, PNG, and WebP are supported.

The build-time manifest discovers media, reads intrinsic dimensions, and creates the browser-safe project data. Do not add `heroMedia`, `gallery`, `workingImages`, or `designImages` manually.

## Add a new project

1. Complete [the intake sheet](./portfolio-project-intake.md) using verified information only.
2. Confirm client, photography, artwork, logo, testimonial, and attribution permissions.
3. Create `public/portfolio/project-slug/`, using a lowercase kebab-case slug.
4. Copy [the JSON template](./portfolio-project-template.json) to `project.json`.
5. Fill only verified content. Remove unused optional fields or leave the documented `null`/empty value.
6. Place at least one optimized, approved image in `final/`.
7. Add approved in-progress photographs to `working/` and approved sketches, CAD screenshots, or renders to `design/` only when available.
8. Add optional `media` entries only for images needing tailored alt text, captions, credits, or permission status. Images do not need to be listed to be discovered.
9. Run `npm run portfolio:manifest`. Resolve every exclusion before expecting the project to publish.
10. Run `npm run lint`, `npm run test:unit`, and `npm run build`.
11. Preview `/portfolio` and `/portfolio/project-slug`.
12. Test keyboard navigation, gallery/lightbox controls, responsive overflow, Axe, metadata, structured data, 404 behavior, and sitemap output.
13. Confirm the Portfolio still makes no Shopify or Judge.me request.
14. Commit on a feature branch and request review before merging.

## Media configuration

Without configuration, files use stable alphabetical filename order. The first image in `final/` becomes the hero.

Override the hero with a project-relative final path:

```json
{
  "hero": "final/hero-1600-v1.webp"
}
```

Override part or all of a group order with filenames. Unlisted discovered images follow alphabetically:

```json
{
  "imageOrder": {
    "final": ["hero-1600-v1.webp", "rear-view-1600-v1.webp"],
    "working": [],
    "design": []
  }
}
```

Add optional metadata by exact group/filename:

```json
{
  "media": {
    "final/hero-1600-v1.webp": {
      "alt": "Verified description of the finished project",
      "caption": "Optional verified context.",
      "credit": "Ethereal Armory",
      "permissionStatus": "confirmed"
    }
  }
}
```

If alt text is omitted, the manifest uses a conservative project-title, group, and image-number description. Custom alt text is strongly recommended. Supported permission values are `confirmed` and `not-required`.

## Fail-closed behavior

A malformed project is excluded from the manifest, landing page, detail routes, metadata, structured data, and sitemap. Its public folder is pruned from production build output. Other valid projects remain available. The generator reports the folder and reason without exposing local absolute paths.

Exclusions include:

- Missing or malformed `project.json`
- Folder/slug mismatch
- Missing supported image in `final/`
- Unreadable or invalid image dimensions
- Unsafe filenames
- Missing configured hero or ordering entries
- Media metadata referencing a missing file
- Invalid taxonomy or required narrative data
- Client disclosure, testimonial, model, inquiry, SEO, or permission errors

## Updating a project

Work on a feature branch, preserve the slug unless a redirect is planned, use revisioned filenames for replacements, and reconfirm permissions for every new public asset. Regenerate the manifest and repeat the complete validation workflow before review.

## 3D models

Interactive viewing remains deferred until approved model media exists. When added later, use an optimized non-printable GLB, require a poster and static fallback, load only after user intent, and provide orbit, zoom, reset, loading, error, reduced-motion, and accessible-description behavior.
