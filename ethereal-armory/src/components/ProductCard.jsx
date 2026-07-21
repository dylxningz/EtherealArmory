import { ThemeLink as Link } from "./ThemeLinks";
import PricePresentation from "./PricePresentation";
import { getProductCardPricing } from "../lib/pricing";
import { shopifyImageUrl, shopifySrcSet } from "../lib/images";

export default function ProductCard({ product, eager = false }) {
  const pricing = getProductCardPricing(product);
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
          <PricePresentation pricing={pricing} className="price-row" showPercentOff={pricing.showPercentOff} />
        </div>
      </Link>
    </article>
  );
}
