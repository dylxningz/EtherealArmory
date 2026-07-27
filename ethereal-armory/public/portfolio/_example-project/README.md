# Portfolio authoring example

This underscore-prefixed folder is authoring-only and is excluded from the live Portfolio, generated manifest, sitemap, client bundles, and final `dist` output.

Copy this entire folder when starting a new project. Never turn this original folder into a live project in place, and never remove the underscore from `_example-project`.

## Create a project

1. Copy `public/portfolio/_example-project/`.
2. Rename the copy to the real lowercase, hyphenated project slug.
3. Set the copied `project.json` `slug` to that exact folder name.
4. Rename or replace every example image with approved project media.
5. Update every `REPLACE:` value.
6. Remove optional fields and sections that do not apply.
7. Keep at least one approved AVIF, JPEG, PNG, or WebP image in `final/`.
8. Run `npm run portfolio:manifest`, `npm run test:unit`, and `npm run build`.
9. Review `/portfolio` and the new detail route locally before committing.

`working/` and `design/` are optional. Empty groups do not render.

## Publication and permissions

- Do not publish client reference artwork without confirmed permission.
- Use `permissionStatus: "confirmed"` for client media whose publication permission is documented.
- Use `permissionStatus: "not-required"` only for studio-owned or repository-owned media.
- Replace the example credits with accurate credits, or remove a credit when none is required.
- Do not invent customer names, testimonials, outcomes, dimensions, dates, or project history.

## Optional fields

- Remove `clientName` unless `clientDisclosure` is `named-with-permission`.
- `yearCompleted` accepts a four-digit year; `buildTime` is the current project-duration field. Leave unknown dates and measurements `null` rather than inventing them.
- Remove `testimonialReference` unless the provider, identifier, and publication permission are confirmed.
- Remove `externalReferences` entries that do not have a verified destination.
- Update `seo.image` to the copied project path, or remove it to use the selected hero automatically.
- `model3d` requires a safe `.glb` file or HTTPS URL, an accessible description, and a valid `modelPoster` record. Leave both fields `null` unless that complete model workflow is configured.
- Video files are not currently discovered by the folder image manifest. Do not place unsupported videos in `final/`, `working/`, `design/`, or `media`; configure video support explicitly before publishing one.

When an approved testimonial exists, replace `null` with an object containing `provider`, `id`, and `permissionConfirmed: true`. Never create testimonial text or permission records that were not supplied and confirmed.

When an optimized model is configured, replace `model3d` with an object containing a safe `.glb` `src` and descriptive `alt`, then replace `modelPoster` with a complete media record containing `src`, `alt`, `width`, and `height`.

The placeholder WebP files are neutral repository-owned instructional graphics. They exist only to demonstrate naming, ordering, dimensions, alt text, captions, credits, and permissions. Replace them in every copied project.
