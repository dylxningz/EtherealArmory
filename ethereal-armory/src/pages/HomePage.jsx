import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo, { SITE_URL } from "../components/Seo";
import ProductCard from "../components/ProductCard";
import CollectionArtwork from "../components/CollectionArtwork";
import { ErrorState, LoadingGrid } from "../components/AsyncState";
import { getCollectionsPage, getProductsPage } from "../lib/shopify";

const ArcaneArtifact = lazy(() => import("../components/ArcaneArtifact"));

function ArtifactFallback() {
  return <div className="artifact-stage artifact-static" role="img" aria-label="A voidglass reliquary surrounded by arcane rings"><span className="artifact-static-relic" aria-hidden="true" /></div>;
}

const trustSignals = [
  ["Made with intent", "Thoughtful print preparation, assembly, and finish direction."],
  ["Collector focused", "Pieces planned for display presence, photography, and event use."],
  ["Secure checkout", "Inventory, cart, taxes, and payment are handled through Shopify."],
];

const commissionSteps = [
  ["01", "Share the brief", "Send references, scale, finish goals, deadline, and how the piece will be used."],
  ["02", "Plan the build", "Scope, fabrication approach, presentation details, timing, and price are agreed before work begins."],
  ["03", "Craft and refine", "The piece moves through modeling, printing, assembly, surface preparation, paint, and detail work."],
  ["04", "Review and deliver", "Final presentation is documented and the completed piece is packed for its journey."],
];

export default function HomePage() {
  const [data, setData] = useState({ collections: [], products: [] });
  const [status, setStatus] = useState("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getCollectionsPage({ first: 6, signal: controller.signal }),
      getProductsPage({ first: 6, sortKey: "BEST_SELLING", signal: controller.signal }),
    ]).then(([collections, products]) => {
      setData({ collections: collections.nodes, products: products.nodes });
      setStatus("ready");
    }).catch((error) => {
      if (error.name !== "AbortError") setStatus("error");
    });
    return () => controller.abort();
  }, [retryKey]);

  const retry = useCallback(() => {
    setStatus("loading");
    setRetryKey((key) => key + 1);
  }, []);
  const schemas = useMemo(() => [
    { "@context": "https://schema.org", "@type": "Organization", name: "Ethereal Armory", url: SITE_URL, logo: `${SITE_URL}/brand-mark.svg`, email: "dylangreene@etherealarmory.com" },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Ethereal Armory", url: SITE_URL },
  ], []);

  return (
    <main id="main-content">
      <Seo structuredData={schemas} />
      <section className="hero-section section-shell">
        <div className="hero-copy">
          <p className="overline">Premium custom props & collectibles</p>
          <h1>Fantasy made tangible.</h1>
          <p className="hero-lede">Hand-finished weapons, replicas, and original commissions crafted for collectors, cosplay, and unforgettable display.</p>
          <div className="button-row">
            <Link className="button button-primary" to="/products">Shop available pieces</Link>
            <Link className="button button-secondary" to="/contact">Request a custom build</Link>
          </div>
          <p className="hero-note">Independent craft studio · Secure Shopify checkout</p>
        </div>
        <div className="hero-art">
          <Suspense fallback={<ArtifactFallback />}><ArcaneArtifact /></Suspense>
          <p><span>Original artifact</span><strong>Voidglass reliquary</strong></p>
        </div>
      </section>

      <section className="trust-strip section-shell" aria-label="Why collectors choose Ethereal Armory">
        {trustSignals.map(([title, text]) => <article key={title}><span aria-hidden="true">◇</span><div><h2>{title}</h2><p>{text}</p></div></article>)}
      </section>

      <section className="content-section section-shell">
        <header className="section-heading"><div><p className="overline">Choose your path</p><h2>Enter the armory.</h2></div><Link className="text-link" to="/products">View every product <span aria-hidden="true">→</span></Link></header>
        {status === "error" ? <ErrorState title="The collections are out of reach" message="Shopify did not respond, but the rest of the studio remains available." onRetry={retry} /> : (
          <div className="collection-grid" aria-busy={status === "loading"}>
            {status === "loading" ? Array.from({ length: 3 }, (_, index) => <div className="collection-card skeleton-card" key={index}><span className="skeleton-media" /></div>) : data.collections.slice(0, 3).map((collection) => (
              <Link className="collection-card" to={`/collections/${collection.handle}`} key={collection.id}>
                <div className="collection-card-media">
                  <CollectionArtwork collection={collection} sizes="(max-width: 768px) 92vw, 31vw" />
                </div>
                <div><p className="overline">Collection</p><h3>{collection.title}</h3><span className="text-link">Explore collection <span aria-hidden="true">→</span></span></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="content-section section-shell">
        <header className="section-heading"><div><p className="overline">From the shop</p><h2>Available artifacts.</h2></div><Link className="text-link" to="/products">Shop all <span aria-hidden="true">→</span></Link></header>
        {status === "loading" ? <LoadingGrid count={4} /> : status === "ready" && data.products.length ? <div className="product-grid">{data.products.slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} eager={index < 2} />)}</div> : status === "ready" ? <p className="quiet-message">New pieces are being prepared. Custom commission inquiries remain open.</p> : null}
      </section>

      <section className="commission-section section-shell">
        <header className="section-heading"><div><p className="overline">Custom commissions</p><h2>From reference to relic.</h2></div><p>Every custom project starts with a clear brief and an honest conversation about scope.</p></header>
        <ol className="commission-steps">{commissionSteps.map(([number, title, text]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
      </section>

      <section className="final-cta section-shell"><div><p className="overline">Your idea, made physical</p><h2>Commission something worthy of legend.</h2><p>Bring a character weapon, display concept, or original fantasy design to the studio.</p></div><div className="button-row"><Link className="button button-primary" to="/contact">Begin an inquiry</Link><Link className="button button-secondary" to="/portfolio">View custom work</Link></div></section>
    </main>
  );
}
