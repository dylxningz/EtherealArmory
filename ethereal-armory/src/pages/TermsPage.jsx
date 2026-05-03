export default function TermsPage() {
  return (
    <main className="policy-page">
      <section className="policy-hero">
        <p className="section-eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p className="policy-intro">
          These Terms of Service govern the use of the Ethereal Armory website
          and the purchase of products or custom work.
        </p>
      </section>

      <section className="policy-content">
        <h2>General</h2>
        <p>
          By using this website, you agree to these terms. Ethereal Armory
          reserves the right to update these terms at any time.
        </p>

        <h2>Products</h2>
        <p>
          Many items are handmade or 3D printed. Minor variations, layer lines,
          slight finishing differences, or small cosmetic distinctions may be
          present and are part of the nature of the product.
        </p>

        <h2>Custom Orders</h2>
        <p>
          Custom orders may require a deposit before work begins. Details such as
          pricing, production timeline, revisions, and final approval will be
          discussed before the order moves forward.
        </p>

        <h2>Pricing</h2>
        <p>
          Prices are listed in USD and may change without notice. Shipping and
          taxes, when applicable, are calculated separately at checkout.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All website content, branding, images, and original designs belonging
          to Ethereal Armory may not be copied or used without permission.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a>.
        </p>
      </section>
    </main>
  );
}