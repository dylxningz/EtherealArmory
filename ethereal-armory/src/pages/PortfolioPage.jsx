import Seo from "../components/Seo";
import { ThemeLink as Link } from "../components/ThemeLinks";

export default function PortfolioPage() {
  return (
    <main id="main-content" className="construction-page section-shell">
      <Seo title="Portfolio Under Construction" description="A new Ethereal Armory gallery of finished artifacts, custom commissions, painted pieces, and studio craftsmanship is being prepared." path="/portfolio" />
      <section className="construction-panel" aria-labelledby="portfolio-construction-title">
        <div className="construction-visual" aria-hidden="true">
          <span className="construction-ring is-outer" />
          <span className="construction-ring is-inner" />
          <span className="construction-shard" />
          <span className="construction-mark">EA / ARCHIVE</span>
        </div>
        <div className="construction-copy">
          <p className="overline">The archive is being forged</p>
          <h1 id="portfolio-construction-title">Portfolio Under Construction</h1>
          <p>We’re preparing a new gallery of finished artifacts, custom commissions, painted pieces, and behind-the-scenes craftsmanship.</p>
          <p>Check back soon to explore the armory.</p>
          <div className="button-row">
            <Link className="button button-primary" to="/products">Shop available pieces</Link>
            <Link className="button button-secondary" to="/contact">Discuss a commission</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
