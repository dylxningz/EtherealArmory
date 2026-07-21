import Seo from "../components/Seo";
import { ThemeLink as Link } from "../components/ThemeLinks";
import { siteSettings } from "../config/siteSettings";

export default function ReviewsPage() {
  const etsyUrl = siteSettings.etsyShopUrl;

  return (
    <main id="main-content" className="construction-page section-shell">
      <Seo title="Reviews Page Under Construction" description="The Ethereal Armory storefront review gallery is being prepared. Customer reviews remain available through the studio’s Etsy shop when configured." path="/reviews" />
      <section className="construction-panel is-reviews" aria-labelledby="reviews-construction-title">
        <div className="construction-visual" aria-hidden="true">
          <span className="construction-ring is-outer" />
          <span className="construction-ring is-inner" />
          <span className="construction-shard" />
          <span className="construction-mark">EA / TESTIMONIALS</span>
        </div>
        <div className="construction-copy">
          <p className="overline">Collector dispatches</p>
          <h1 id="reviews-construction-title">Reviews Page Under Construction</h1>
          <p>Our storefront review gallery is still being prepared. In the meantime, customer reviews are available on our Etsy shop.</p>
          <div className="button-row">
            {etsyUrl
              ? <a className="button button-primary" href={etsyUrl} target="_blank" rel="noopener noreferrer">View Reviews on Etsy <span className="external-link-mark" aria-hidden="true">↗</span><span className="visually-hidden"> (opens in a new tab)</span></a>
              : <span className="button button-primary is-disabled" aria-disabled="true">Etsy reviews link coming soon</span>}
            <Link className="button button-secondary" to="/products">Return to Shop</Link>
          </div>
          {!etsyUrl && <p className="configuration-note" role="status">The official Etsy shop link has not been configured yet.</p>}
        </div>
      </section>
    </main>
  );
}
