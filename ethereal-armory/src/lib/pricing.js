const DEFAULT_LOCALE = "en-US";

export function formatMoney(amount, currencyCode = "USD", locale = DEFAULT_LOCALE) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode || "USD",
    currencyDisplay: "narrowSymbol",
  }).format(numericAmount);
}

export function getSalePricing(price, compareAtPrice) {
  const finalPrice = Number(price?.amount ?? price ?? 0);
  const originalPrice = Number(compareAtPrice?.amount ?? compareAtPrice ?? 0);
  const currencyCode = price?.currencyCode || compareAtPrice?.currencyCode || "USD";
  const isOnSale = originalPrice > finalPrice && finalPrice >= 0;

  return {
    finalPrice,
    originalPrice: isOnSale ? originalPrice : finalPrice,
    currencyCode,
    isOnSale,
    percentOff: isOnSale
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0,
  };
}

// Kept for compatibility with any older portfolio content that imports it.
export function formatPrice(amount, currencyCode = "USD") {
  return formatMoney(amount, currencyCode);
}
