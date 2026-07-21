export function getPublicEtsyShopUrl(value = "") {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "etsy.com" || host === "www.etsy.com" || host.endsWith(".etsy.com")) ? url.toString() : "";
  } catch {
    return "";
  }
}

const publicEnv = import.meta.env || globalThis.process?.env || {};

export const siteSettings = {
  announcement: {
    enabled: true,
    message: "Eligible offers are applied by Shopify and reflected in your cart or at checkout.",
    storageKey: "ea-announcement-2026-07",
  },
  supportEmail: "dylangreene@etherealarmory.com",
  etsyShopUrl: getPublicEtsyShopUrl(publicEnv.VITE_ETSY_SHOP_URL),
};
