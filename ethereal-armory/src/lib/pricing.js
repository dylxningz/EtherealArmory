const DEFAULT_LOCALE = "en-US";

function currencyCodeFor(price, compareAtPrice) {
  const code = price?.currencyCode || compareAtPrice?.currencyCode || "USD";
  return typeof code === "string" && /^[a-z]{3}$/i.test(code) ? code.toUpperCase() : "USD";
}

export function parseMoneyAmount(value) {
  const amount = value && typeof value === "object" ? value.amount : value;
  if (amount === null || amount === undefined || typeof amount === "boolean") return null;
  if (typeof amount === "string" && !amount.trim()) return null;

  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) && numericAmount >= 0 ? numericAmount : null;
}

export function formatMoney(amount, currencyCode = "USD", locale = DEFAULT_LOCALE) {
  const numericAmount = parseMoneyAmount(amount);

  if (numericAmount === null) return "";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCodeFor({ currencyCode }),
      currencyDisplay: "narrowSymbol",
    }).format(numericAmount);
  } catch {
    return "";
  }
}

export function getSalePricing(price, compareAtPrice) {
  const finalPrice = parseMoneyAmount(price);
  const comparedPrice = parseMoneyAmount(compareAtPrice);
  const currencyCode = currencyCodeFor(price, compareAtPrice);
  const priceCurrency = price?.currencyCode?.toUpperCase?.();
  const compareCurrency = compareAtPrice?.currencyCode?.toUpperCase?.();
  const currenciesMatch = !priceCurrency || !compareCurrency || priceCurrency === compareCurrency;
  const validComparison = finalPrice !== null
    && comparedPrice !== null
    && finalPrice > 0
    && comparedPrice > 0
    && comparedPrice > finalPrice
    && currenciesMatch;
  const calculatedPercent = validComparison
    ? Math.round(((comparedPrice - finalPrice) / comparedPrice) * 100)
    : 0;
  const isOnSale = validComparison
    && Number.isFinite(calculatedPercent)
    && calculatedPercent > 0
    && calculatedPercent <= 100;

  return {
    finalPrice,
    originalPrice: isOnSale ? comparedPrice : finalPrice,
    currencyCode,
    isOnSale,
    percentOff: isOnSale ? calculatedPercent : 0,
  };
}

export function getPriceAnnouncement(pricing) {
  const current = formatMoney(pricing?.finalPrice, pricing?.currencyCode);
  if (!current) return "Price unavailable.";
  if (!pricing?.isOnSale) return `Price ${current}.`;

  const original = formatMoney(pricing.originalPrice, pricing.currencyCode);
  return `Sale price ${current}. Original price ${original}. Save ${pricing.percentOff} percent.`;
}

export function getProductCardPricing(product = {}) {
  const variants = product.variants?.nodes || [];
  const purchasableVariants = variants.filter((variant) => variant.availableForSale);
  const representedVariants = purchasableVariants.length ? purchasableVariants : variants;
  const representedVariant = representedVariants[0] || null;
  const pricing = representedVariant
    ? getSalePricing(representedVariant.price, representedVariant.compareAtPrice)
    : getSalePricing(product.priceRange?.minVariantPrice, product.compareAtPriceRange?.minVariantPrice);
  const saleSignatures = new Set(representedVariants.map((variant) => {
    const variantPricing = getSalePricing(variant.price, variant.compareAtPrice);
    return variantPricing.isOnSale
      ? `${variantPricing.currencyCode}:${variantPricing.percentOff}`
      : "regular";
  }));
  const allVariantsInspected = product.variants?.pageInfo?.hasNextPage === false;

  return {
    ...pricing,
    representedVariantId: representedVariant?.id || null,
    showPercentOff: pricing.isOnSale
      && representedVariants.length > 0
      && saleSignatures.size === 1
      && allVariantsInspected,
  };
}

// Kept for compatibility with any older portfolio content that imports it.
export function formatPrice(amount, currencyCode = "USD") {
  return formatMoney(amount, currencyCode);
}
