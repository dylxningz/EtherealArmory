export default function PortfolioModelPreview({ model, poster }) {
  if (!model || !poster) return null;
  return (
    <section className="portfolio-model-preview" aria-labelledby="portfolio-model-title">
      <div className="portfolio-section-heading"><p className="overline">Interactive study</p><h2 id="portfolio-model-title">Three-dimensional model</h2></div>
      <figure>
        <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} loading="lazy" />
        <figcaption>{poster.caption || model.alt}</figcaption>
      </figure>
      <p className="portfolio-model-note">Interactive GLB loading is intentionally deferred until a verified, optimized model is approved. The static project gallery remains the accessible fallback.</p>
    </section>
  );
}
