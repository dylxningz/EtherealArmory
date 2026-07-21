import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function AboutPage() {
  return (
    <main id="main-content" className="editorial-page section-shell">
      <Seo title="About" description="Meet Ethereal Armory, an independent studio creating hand-finished fantasy props, replicas, and custom collector pieces." path="/about" />
      <header className="page-hero"><p className="overline">About the studio</p><h1>Where craft, fantasy, and fandom meet.</h1><p>Ethereal Armory turns digital concepts and beloved references into tactile props made for collectors, cosplay, and display.</p></header>
      <section className="editorial-grid">
        <div><p className="overline">The work</p><h2>Designed for presence.</h2><p>The process combines 3D design, print preparation, assembly, surface finishing, paint, and presentation. The aim is a piece that reads clearly in hand, in photographs, and in the place it will live.</p><p>Available shop items share the same design-minded approach as custom builds. Product details identify what is ready to purchase, while commissions begin with a separate scope and quote.</p></div>
        <div className="brand-panel"><img src="/brand-mark.svg" alt="Ethereal Armory crest" width="480" height="480" /></div>
      </section>
      <section className="values-grid"><article><span>01</span><h2>Atmosphere</h2><p>Fantasy direction that feels dramatic and considered, never noisy for its own sake.</p></article><article><span>02</span><h2>Craft</h2><p>Practical planning for fabrication, finishing, assembly, transport, and display.</p></article><article><span>03</span><h2>Clarity</h2><p>Honest scope, intentional options, and Shopify-backed commerce from cart through checkout.</p></article></section>
      <section className="final-cta"><div><p className="overline">Work with the studio</p><h2>Have a custom concept?</h2><p>Share the references, scale, intended use, finish direction, and deadline.</p></div><Link className="button button-primary" to="/contact">Start a custom request</Link></section>
    </main>
  );
}
