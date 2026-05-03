export default function ShippingPolicyPage() {
  return (
    <main className="policy-page">
      <section className="policy-hero">
        <p className="section-eyebrow">Store Policy</p>
        <h1>Shipping Policy</h1>
        <p className="policy-intro">
          This page explains how Ethereal Armory handles processing and shipping.
        </p>
      </section>

      <section className="policy-content">
        <h2>Processing Times</h2>
        <p>
          Ready-made items typically ship within the processing time listed on
          the product page. Custom orders and made-to-order items may require
          additional production time.
        </p>

        <h2>Shipping Estimates</h2>
        <p>
          Delivery estimates may vary based on carrier delays, destination, item
          size, and seasonal demand.
        </p>

        <h2>Tracking</h2>
        <p>
          Tracking information is provided when available after the order ships.
        </p>

        <h2>Incorrect Addresses</h2>
        <p>
          Buyers are responsible for providing an accurate shipping address. If
          an incorrect address is entered, contact Ethereal Armory as soon as
          possible.
        </p>

        <h2>Damaged Packages</h2>
        <p>
          If an item arrives damaged, contact Ethereal Armory with photos of the
          packaging and item so the issue can be reviewed.
        </p>

        <h2>Questions</h2>
        <p>
          Shipping questions can be sent to{" "}
          <a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a>.
        </p>
      </section>
    </main>
  );
}