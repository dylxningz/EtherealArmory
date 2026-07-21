import { formatMoney, getPriceAnnouncement } from "../lib/pricing";

export default function PricePresentation({ pricing, className = "", showPercentOff = true }) {
  const currentPrice = formatMoney(pricing?.finalPrice, pricing?.currencyCode);
  if (!currentPrice) return null;

  const originalPrice = pricing.isOnSale
    ? formatMoney(pricing.originalPrice, pricing.currencyCode)
    : "";

  return (
    <div
      className={`price-presentation ${pricing.isOnSale ? "is-on-sale" : ""} ${className}`.trim()}
      role="group"
      aria-label={getPriceAnnouncement(pricing)}
    >
      {pricing.isOnSale && <del className="price-original" aria-hidden="true">{originalPrice}</del>}
      <strong className="price-current" aria-hidden="true">{currentPrice}</strong>
      {pricing.isOnSale && showPercentOff && (
        <span className="discount-badge" aria-hidden="true">{pricing.percentOff}% OFF</span>
      )}
    </div>
  );
}
