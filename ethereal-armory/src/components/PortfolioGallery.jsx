import { useCallback, useId, useRef, useState } from "react";
import { buildMediaSrcSet } from "../lib/portfolio";
import { useModalDialog } from "../hooks/useModalDialog";

function GalleryImage({ media, eager = false, sizes = "(max-width: 900px) 92vw, 70vw" }) {
  return (
    <img
      src={media.src}
      srcSet={buildMediaSrcSet(media)}
      sizes={sizes}
      alt={media.alt}
      width={media.width}
      height={media.height}
      loading={eager ? "eager" : "lazy"}
    />
  );
}

export default function PortfolioGallery({ media = [], title = "Final gallery", overline = "Final result", eager = false }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dialogRef = useRef(null);
  const headingId = useId();
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  useModalDialog({
    open: lightboxOpen,
    containerRef: dialogRef,
    onClose: closeLightbox,
    inertSelector: "header, main, footer, .announcement-banner",
  });

  if (!media.length) return null;
  const activeIndex = selectedIndex < media.length ? selectedIndex : 0;
  const selected = media[activeIndex];
  const selectRelative = (offset) => setSelectedIndex((current) => (current + offset + media.length) % media.length);

  function handleDialogKeyDown(event) {
    if (event.key === "ArrowLeft") selectRelative(-1);
    if (event.key === "ArrowRight") selectRelative(1);
  }

  return (
    <section className="portfolio-gallery" aria-labelledby={headingId}>
      <div className="portfolio-section-heading">
        <p className="overline">{overline}</p>
        <h2 id={headingId}>{title}</h2>
      </div>
      <button className="portfolio-gallery-stage" onClick={() => setLightboxOpen(true)} type="button" aria-label={`Open ${selected.alt} in image viewer`}>
        <GalleryImage media={selected} eager={eager} />
        <span className="portfolio-gallery-expand" aria-hidden="true">Expand image</span>
      </button>
      {selected.caption && <p className="portfolio-media-caption">{selected.caption}{selected.credit ? ` — ${selected.credit}` : ""}</p>}
      <p className="sr-only" aria-live="polite">Showing image {activeIndex + 1} of {media.length}: {selected.alt}</p>
      {media.length > 1 && (
        <div className="portfolio-gallery-thumbnails" aria-label={`${title} image selection`}>
          {media.map((item, index) => (
            <button
              className={index === activeIndex ? "is-selected" : ""}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1} of ${media.length}: ${item.alt}`}
              aria-pressed={index === activeIndex}
              type="button"
              key={`${item.src}-${index}`}
            >
              <GalleryImage media={item} sizes="96px" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="portfolio-lightbox-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeLightbox()}>
          <div className="portfolio-lightbox" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${title} image viewer`} tabIndex="-1" onKeyDown={handleDialogKeyDown}>
            <button className="portfolio-lightbox-close icon-button" onClick={closeLightbox} aria-label="Close image viewer" type="button">×</button>
            <div className="portfolio-lightbox-image"><GalleryImage media={selected} eager /></div>
            <p>{selected.caption || selected.alt}</p>
            {media.length > 1 && (
              <div className="portfolio-lightbox-actions">
                <button className="button button-secondary" onClick={() => selectRelative(-1)} type="button">Previous image</button>
                <span aria-live="polite">{activeIndex + 1} / {media.length}</span>
                <button className="button button-secondary" onClick={() => selectRelative(1)} type="button">Next image</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
