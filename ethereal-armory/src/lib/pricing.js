import { siteSettings } from "../config/siteSettings";

export function getSalePricing(basePrice) {
  const numericPrice = Number(basePrice || 0);
  const sale = siteSettings.sitewideSale;

  if (!sale.enabled) {
    return {
      originalPrice: numericPrice,
      finalPrice: numericPrice,
      isOnSale: false,
      percentOff: 0,
      label: "",
    };
  }

  const discountAmount = numericPrice * (sale.percentOff / 100);
  const finalPrice = numericPrice - discountAmount;

  return {
    originalPrice: numericPrice,
    finalPrice,
    isOnSale: true,
    percentOff: sale.percentOff,
    label: sale.label,
  };
}

export function formatPrice(amount) {
  return Number(amount || 0).toFixed(2);
}