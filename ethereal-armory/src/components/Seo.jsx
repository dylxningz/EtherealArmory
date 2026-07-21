import { useEffect } from "react";

export const SITE_URL = "https://www.etherealarmory.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

export default function Seo({
  title,
  description = "Hand-finished fantasy props, replicas, collectibles, and custom commissions from Ethereal Armory.",
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
  structuredData = [],
}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | Ethereal Armory` : "Ethereal Armory | Fantasy Props & Custom Collectibles";
    const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
    document.title = pageTitle;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: noIndex ? "noindex,follow" : "index,follow" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    const scriptId = "route-structured-data";
    document.getElementById(scriptId)?.remove();
    const entries = Array.isArray(structuredData) ? structuredData : [structuredData];
    if (entries.filter(Boolean).length) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      script.text = JSON.stringify(entries.filter(Boolean));
      document.head.appendChild(script);
    }
  }, [description, image, noIndex, path, structuredData, title, type]);

  return null;
}
