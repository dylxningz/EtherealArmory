import { useId, useState } from "react";
import { getCollectionArtwork, getCollectionArtworkAlt, getCollectionFallbackVariant } from "../lib/collectionArtwork";
import { shopifyImageUrl, shopifySrcSet } from "../lib/images";

function BrandedCollectionFallback({ collection, compact }) {
  const gradientId = useId().replaceAll(":", "");
  const title = collection?.title || "The armory";
  const variant = getCollectionFallbackVariant(collection);

  return (
    <span className={`collection-artwork-fallback is-variant-${variant}${compact ? " is-compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 320 240" focusable="false">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="42%" r="58%">
            <stop offset="0" stopColor="var(--fallback-glow)" stopOpacity=".42" />
            <stop offset=".48" stopColor="var(--fallback-glow-deep)" stopOpacity=".2" />
            <stop offset="1" stopColor="var(--night)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="240" fill={`url(#${gradientId})`} />
        <g className="fallback-sigil-geometry">
          <circle cx="160" cy="112" r="70" fill="none" stroke="var(--fallback-metal)" strokeOpacity=".26" />
          <circle cx="160" cy="112" r={variant % 2 ? "56" : "50"} fill="none" stroke="var(--fallback-metal)" strokeOpacity=".18" strokeDasharray={variant === 2 ? "14 5" : "3 9"} />
          <path d={variant === 3 ? "M160 38 198 112 160 186 122 112Z" : "M160 43 190 95 160 181 130 95Z"} fill="var(--fallback-surface)" stroke="var(--fallback-metal-bright)" strokeOpacity=".78" />
          <path d="m160 43 9 52-9 86-9-86Z" fill="var(--fallback-glow)" fillOpacity=".42" />
          <path d="m130 95 30 16 30-16M160 111v70" fill="none" stroke="var(--fallback-metal-bright)" strokeOpacity=".38" />
          <path d="M89 112h27M204 112h27M160 16v18M160 190v18" stroke="var(--fallback-metal)" strokeOpacity=".46" />
        </g>
      </svg>
      {!compact && <span>{title}</span>}
    </span>
  );
}

export default function CollectionArtwork({ collection, artwork: selectedArtwork, compact = false, sizes = "(max-width: 768px) 92vw, 31vw", eager = false }) {
  const artwork = selectedArtwork || getCollectionArtwork(collection);
  const [failedUrl, setFailedUrl] = useState("");
  const image = artwork.image;

  return (
    <span className={`collection-artwork-frame${compact ? " is-compact" : ""}`}>
      {!image || failedUrl === image.url
        ? <BrandedCollectionFallback collection={collection} compact={compact} />
        : <img
            className="collection-artwork-image"
            src={shopifyImageUrl(image.url, compact ? 320 : 800)}
            srcSet={shopifySrcSet(image.url, compact ? [180, 320, 480] : [480, 800, 1200])}
            sizes={sizes}
            alt={getCollectionArtworkAlt(collection, artwork)}
            width={image.width || (compact ? 320 : 800)}
            height={image.height || (compact ? 240 : 640)}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onError={() => setFailedUrl(image.url)}
          />}
    </span>
  );
}
