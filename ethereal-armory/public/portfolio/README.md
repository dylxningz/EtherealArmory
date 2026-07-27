# Portfolio project folders

> **Authoring template:** Copy `public/portfolio/_example-project/`; never remove the underscore from the original folder or edit it into a live project in place. Every underscore-prefixed Portfolio folder is authoring-only and is excluded before live-project validation.

Each publishable project is a self-contained directory:

```text
public/portfolio/project-slug/
  project.json
  final/
  working/  # optional
  design/   # optional
```

The build-time manifest scans these folders. A project is publishable only when:

- `project.json` exists, parses, and passes the Portfolio schema
- The folder name and `slug` match
- `final/` contains at least one readable supported image
- Configured hero, ordering, and media metadata point to discovered files

Invalid project directories are removed from deployable `dist` after the production build, so incomplete metadata and media are not published accidentally.

Underscore-prefixed authoring directories are not invalid projects and do not count as excluded live projects. They are omitted from the manifest and sitemap, cannot receive a Portfolio detail record, and are removed from the final build output even when their metadata and media are otherwise complete.

Supported images are AVIF, JPEG, PNG, and WebP. `working/` and `design/` are optional and do not render when missing or empty.

## Discovery and ordering

Images are discovered automatically; do not manually duplicate every image in a central registry. With no `imageOrder`, filenames sort alphabetically using a deterministic case-normalized comparison. File modification time is never used.

With no explicit `hero`, the first ordered `final/` image is used. `project.json` may optionally provide hero selection, group ordering, alt text, captions, credits, and a `confirmed` or `not-required` permission status.

## Naming

- Use lowercase URL-safe filenames with no spaces.
- Describe the image purpose without making unsupported claims.
- Include output width where helpful.
- Use a revision suffix when replacing an immutable public asset.

Examples:

- `hero-1600-v1.webp`
- `final-left-profile-1200-v1.avif`
- `prototype-fit-check-1200-v1.webp`
- `cad-assembly-section-1600-v1.webp`

## Image preparation

- Prefer AVIF or WebP; use JPEG or PNG where appropriate.
- Export an appropriately sized web image rather than an original camera file.
- A practical maximum long edge is 1600–2000 pixels.
- Aim near 100–250 KB for compact media and 200–500 KB for large editorial media where quality permits.
- Supply tailored alt text for visual information that matters to the story.
- Use captions for context, not as a substitute for alt text.
- Add only media whose publication rights have been confirmed.

Do not add a client-supplied reference image unless explicit publication permission exists.

Keep STL, STEP, 3MF, CAD masters, printable geometry, uncompressed source photography, confidential client files, and unapproved references outside the deployed repository.

Public files are not automatically content-hashed. Use versioned filenames before applying long-lived immutable caching.

## Copy the authoring example

1. Copy `public/portfolio/_example-project/`.
2. Rename the copy to the real lowercase, hyphenated slug.
3. Rename or replace all example media.
4. Update every `REPLACE:` value and make `project.json` `slug` match the copied folder.
5. Remove unused optional fields and sections.
6. Confirm that `final/` contains at least one approved image.
7. Leave the original `_example-project` folder and its underscore unchanged.
8. Run `npm run portfolio:manifest`, `npm run test:unit`, and `npm run build`.
9. Review `/portfolio` and the project detail route locally before committing.

The example folder's README documents permissions, optional testimonials, references, models, and the current video limitation.
