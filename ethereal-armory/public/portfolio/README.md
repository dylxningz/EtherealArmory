# Portfolio media

Create one lowercase kebab-case directory per verified project:

```text
public/portfolio/project-slug/
  final/
  process/
  cad/
  renders/
  model/
  video/
```

Do not add placeholder media.

## Naming

- Lowercase kebab-case
- No spaces
- Describe the image's purpose
- Include output width where useful
- Add a revision suffix when replacing immutable assets

Examples:

- `hero-1600-v1.webp`
- `final-left-profile-1200-v1.avif`
- `process-primer-stage-1200-v1.webp`
- `cad-assembly-section-1600-v1.webp`
- `model-poster-1600-v1.webp`

## Images

- Prefer AVIF or WebP and keep a tested fallback where necessary.
- Export responsive sizes rather than serving the original photograph everywhere.
- A practical starting set is 640, 960, 1280, and 1600 pixels wide.
- Record intrinsic width and height in the project registry to prevent layout shift.
- Write alt text for the visual information that matters to the project story.
- Use captions for process context, not as a substitute for alt text.
- Keep final images near 100-250 KB on mobile and 200-500 KB at larger sizes where quality permits.

## Video and GLB

- Add captions or transcripts for meaningful spoken content.
- Do not autoplay process or turntable video.
- GLBs must be optimized, non-printable presentation meshes with hidden/internal geometry removed.
- Keep STL, STEP, 3MF, CAD masters, uncompressed source photography, and client-confidential files outside the deployed repository.
- Require a model poster and static image fallback.
- Target 2-3 MB per GLB and treat 5 MB as an upper budget, subject to real-device testing.

Public files are not automatically content-hashed. Use revisioned filenames before applying long-lived immutable caching.
