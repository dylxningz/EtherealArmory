import { Link } from "react-router-dom";
import { formatMoney, getSalePricing } from "../lib/pricing";
import { shopifyImageUrl, shopifySrcSet } from "../lib/images";

export default function ProductCard({ product, eager = false }) {
  const pricing = getSalePricing(product.priceRange?.minVariantPrice, product.compareAtPriceRange?.minVariantPrice);
  const image = product.featuredImage;

  return (
    <article className="product-card">
      <Link to={`/products/${product.handle}`} className="product-card-link-wrap">
        <div className="product-card-media">
          {image?.url ? (
            <img
              src={shopifyImageUrl(image.url, 640)}
              srcSet={shopifySrcSet(image.url, [320, 480, 640, 900])}
              sizes="(max-width: 560px) 88vw, (max-width: 900px) 44vw, 24vw"
              width={image.width || 800}
              height={image.height || 800}
              alt={image.altText || product.title}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
            />
          ) : (
            <span className="image-placeholder" aria-hidden="true">EA</span>
          )}
          <span className={`availability-badge ${product.availableForSale ? "" : "sold-out"}`}>
            {product.availableForSale ? "Available" : "Sold out"}
          </span>
        </div>
        <div className="product-card-copy">
          <p className="overline">{product.productType || "Collector piece"}</p>
          <h3>{product.title}</h3>
          <div className="price-row" aria-label={pricing.isOnSale ? `Sale price ${formatMoney(pricing.finalPrice, pricing.currencyCode)}, originally ${formatMoney(pricing.originalPrice, pricing.currencyCode)}` : undefined}>
            <span className={pricing.isOnSale ? "sale-price" : "price"}>{formatMoney(pricing.finalPrice, pricing.currencyCode)}</span>
            {pricing.isOnSale && <del>{formatMoney(pricing.originalPrice, pricing.currencyCode)}</del>}
          </div>
        </div>
      </Link>
    </article>
  );
}
