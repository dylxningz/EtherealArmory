export default function ReturnsPolicyPage() {
  return (
    <main className="policy-page">
      <section className="policy-hero">
        <p className="section-eyebrow">Store Policy</p>
        <h1>Returns & Refund Policy</h1>
        <p className="policy-intro">
          This page explains how returns, cancellations, and refunds are handled
          for Ethereal Armory orders.
        </p>
      </section>

      <section className="policy-content">
        <h2>Returns</h2>
        <p>
          Returns may be accepted on eligible non-custom items within 14 days of
          delivery if the item is returned in its original condition.
        </p>

        <h2>Custom Orders</h2>
        <p>
          Because custom orders are made specifically for the customer, custom
          items are generally non-returnable and non-refundable once production
          has begun.
        </p>

        <h2>Cancellations</h2>
        <p>
          Orders may be canceled before production or fulfillment begins. Once a
          custom order has entered design, printing, or finishing, cancellation
          may no longer be possible.
        </p>

        <h2>Damaged or Incorrect Items</h2>
        <p>
          If your order arrives damaged or you receive the wrong item, contact
          Ethereal Armory as soon as possible with photos so the issue can be
          reviewed.
        </p>

        <h2>Refunds</h2>
        <p>
          Approved refunds are issued back to the original payment method. Timing
          may vary depending on the payment provider.
        </p>

        <h2>Contact</h2>
        <p>
          For return or refund questions, email{" "}
          <a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a>.
        </p>
      </section>
    </main>
  );
}