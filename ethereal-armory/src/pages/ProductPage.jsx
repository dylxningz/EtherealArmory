import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ThemeLink as Link } from "../components/ThemeLinks";
import Seo, { SITE_URL } from "../components/Seo";
import ProductCard from "../components/ProductCard";
import PricePresentation from "../components/PricePresentation";
import JudgeMeReviews from "../components/JudgeMeReviews";
import { ErrorState } from "../components/AsyncState";
import { useCart } from "../context/useCart";
import { getProductByHandle, getProductsPage } from "../lib/shopify";
import { clampQuantity, isOptionValueAvailable, resolveVariant } from "../lib/commerce";
import { getSalePricing } from "../lib/pricing";
import { shopifyImageUrl, shopifySrcSet } from "../lib/images";
import "./ProductPage.css";

function plainText(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function QuantityControl({ value, onChange, disabled }) {
  function commit(next) {
    onChange(clampQuantity(next));
  }
  return (
    <div className="quantity-control product-quantity" aria-label="Product quantity">
      <button onClick={() => commit(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity" type="button">−</button>
      <input value={value} onChange={(event) => onChange(event.target.value)} onBlur={() => commit(value)} inputMode="numeric" aria-label="Quantity" disabled={disabled} />
      <button onClick={() => commit(Number(value) + 1)} disabled={disabled || value >= 99} aria-label="Increase quantity" type="button">+</button>
    </div>
  );
}

export default function ProductPage() {
  const { handle } = useParams();
  const { addItem, buyNow, status: cartStatus, error: cartError } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getProductByHandle(handle, { signal: controller.signal }).then((result) => {
      setProduct(result);
      if (!result) {
        setStatus("not-found");
        return;
      }
      const initialVariant = result.variants.nodes.find((variant) => variant.availableForSale) || result.variants.nodes[0];
      setSelectedOptions(Object.fromEntries((initialVariant?.selectedOptions || []).map(({ name, value }) => [name, value])));
      setSelectedImage(initialVariant?.image || result.images.nodes[0] || null);
      setQuantity(1);
      setStatus("ready");

      if (result.productType) {
        getProductsPage({ first: 5, query: `product_type:${JSON.stringify(result.productType)}`, signal: controller.signal })
          .then((connection) => setRelated(connection.nodes.filter((item) => item.id !== result.id).slice(0, 4)))
          .catch(() => setRelated([]));
      }
    }).catch((error) => {
      if (error.name !== "AbortError") setStatus("error");
    });
    return () => controller.abort();
  }, [handle, retryKey]);

  const variants = useMemo(() => product?.variants?.nodes || [], [product]);
  const selectedVariant = useMemo(() => resolveVariant(variants, selectedOptions), [selectedOptions, variants]);
  const pricing = getSalePricing(selectedVariant?.price, selectedVariant?.compareAtPrice);
  const busy = cartStatus === "adding";

  const schemas = useMemo(() => {
    if (!product || !selectedVariant) return [];
    const description = plainText(product.descriptionHtml || product.description).slice(0, 5000);
    return [
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/products` },
        { "@type": "ListItem", position: 3, name: product.title, item: `${SITE_URL}/products/${product.handle}` },
      ] },
      { "@context": "https://schema.org", "@type": "Product", name: product.title, description, image: product.images.nodes.map((image) => image.url), sku: selectedVariant.sku || undefined, brand: { "@type": "Brand", name: product.vendor || "Ethereal Armory" }, offers: { "@type": "Offer", url: `${SITE_URL}/products/${product.handle}`, priceCurrency: selectedVariant.price.currencyCode, price: selectedVariant.price.amount, availability: selectedVariant.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition" } },
    ];
  }, [product, selectedVariant]);

  async function addToCart() {
    if (!selectedVariant?.availableForSale || busy) return;
    setMessage("");
    try {
      await addItem(selectedVariant.id, quantity);
      setMessage("Added to your cart.");
    } catch {
      setMessage("This item could not be added. Please try again.");
    }
  }

  async function startCheckout() {
    if (!selectedVariant?.availableForSale || busy) return;
    setMessage("");
    try {
      await buyNow(selectedVariant.id, quantity);
    } catch {
      setMessage("Checkout could not be started. Your existing cart was preserved.");
    }
  }

  if (status === "loading" || (product && product.handle !== handle)) return <main id="main-content" className="product-page product-loading" aria-busy="true"><div className="product-loading-image" /><div className="product-loading-copy"><span /><span /><span /></div></main>;
  if (status === "error") return <main id="main-content" className="product-page section-shell"><Seo title="Product Unavailable" path={`/products/${handle}`} noIndex /><ErrorState title="This product could not be loaded" message="Shopify did not respond. Your cart has not been changed." onRetry={() => { setStatus("loading"); setRetryKey((key) => key + 1); }} /></main>;
  if (status === "not-found") return <main id="main-content" className="product-page section-shell"><Seo title="Product Not Found" path={`/products/${handle}`} noIndex /><section className="status-panel"><p className="overline">Product not found</p><h1>This artifact is no longer here.</h1><p>It may have moved to another collection or left the armory.</p><Link className="button button-primary" to="/products">Browse available pieces</Link></section></main>;

  const image = selectedImage || selectedVariant?.image || product.images.nodes[0];
  const description = product.seo?.description || plainText(product.descriptionHtml || product.description).slice(0, 160);

  return (
    <main id="main-content" className="product-page">
      <Seo title={product.seo?.title || product.title} description={description} path={`/products/${product.handle}`} image={image?.url} type="product" structuredData={schemas} />
      <nav className="breadcrumbs section-shell" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/products">Shop</Link><span aria-hidden="true">/</span><span>{product.title}</span></nav>

      <section className="product-purchase section-shell">
        <div className="product-primary-media">
          {image?.url ? <img src={shopifyImageUrl(image.url, 1200)} srcSet={shopifySrcSet(image.url, [480, 720, 960, 1200, 1600])} sizes="(max-width: 900px) 100vw, 56vw" width={image.width || 1200} height={image.height || 1200} alt={image.altText || product.title} fetchPriority="high" /> : <span className="image-placeholder" aria-hidden="true">◇</span>}
        </div>

        <div className="product-info">
          <p className="overline">{product.productType || "Collector piece"}</p>
          <h1>{product.title}</h1>
          <PricePresentation pricing={pricing} className="product-price" />
          <p className={`stock-status ${selectedVariant?.availableForSale ? "available" : "unavailable"}`}><span aria-hidden="true" />{selectedVariant ? (selectedVariant.availableForSale ? "Available to order" : "Selected option is sold out") : "This combination is unavailable"}</p>

          {product.options.filter((option) => option.name !== "Title" && !(option.values.length === 1 && option.values[0] === "Default Title")).map((option) => (
            <fieldset className="option-group" key={option.name}>
              <legend>{option.name}: <strong>{selectedOptions[option.name]}</strong></legend>
              <div className="option-values">{option.values.map((value) => {
                const available = isOptionValueAvailable(variants, selectedOptions, option.name, value);
                const selected = selectedOptions[option.name] === value;
                return <button className={selected ? "selected" : ""} aria-pressed={selected} disabled={!available} onClick={() => {
                  const nextOptions = { ...selectedOptions, [option.name]: value };
                  const nextVariant = resolveVariant(variants, nextOptions);
                  setSelectedOptions(nextOptions);
                  if (nextVariant?.image) setSelectedImage(nextVariant.image);
                }} key={value} type="button">{value}</button>;
              })}</div>
            </fieldset>
          ))}

          <div className="purchase-controls">
            <label>Quantity<QuantityControl value={quantity} onChange={setQuantity} disabled={busy || !selectedVariant?.availableForSale} /></label>
            <div className="purchase-buttons">
              <button className="button button-primary" onClick={addToCart} disabled={busy || !selectedVariant?.availableForSale} type="button">{busy ? "Updating cart…" : selectedVariant?.availableForSale ? "Add to cart" : "Unavailable"}</button>
              <button className="button button-secondary" onClick={startCheckout} disabled={busy || !selectedVariant?.availableForSale} type="button">Buy now</button>
            </div>
          </div>
          <p className="checkout-note">Buy now adds this selection to your current cart, then opens secure Shopify checkout.</p>
          <p className="purchase-message" aria-live="polite">{message || cartError}</p>

          <div className="product-assurances">
            <details><summary>Processing & shipping</summary><p>{product.processingTime?.value || "Processing time varies by piece and is confirmed in the listing or order communication."} Shipping timing and cost are calculated separately.</p><Link to="/shipping-policy">Read the shipping policy</Link></details>
            <details><summary>Returns & order support</summary><p>Return eligibility depends on the item and whether it was custom made. Contact the studio promptly if an order arrives damaged.</p><Link to="/returns-policy">Read the returns policy</Link></details>
          </div>
        </div>
      </section>

      {product.images.nodes.length > 1 && <section className="product-gallery section-shell" aria-labelledby="gallery-title"><div className="section-heading compact"><div><p className="overline">Every angle</p><h2 id="gallery-title">Product gallery</h2></div></div><div className="thumbnail-rail">{product.images.nodes.map((galleryImage, index) => <button className={galleryImage.id === image?.id ? "active" : ""} onClick={() => setSelectedImage(galleryImage)} aria-label={`View image ${index + 1} of ${product.images.nodes.length}`} aria-pressed={galleryImage.id === image?.id} key={galleryImage.id} type="button"><img src={shopifyImageUrl(galleryImage.url, 320)} alt="" width={galleryImage.width || 320} height={galleryImage.height || 320} loading="lazy" /></button>)}</div></section>}

      <section className="product-details section-shell"><header><p className="overline">The artifact</p><h2>Details & story</h2></header>{product.descriptionHtml ? <div className="rich-text" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /> : <p>{product.description}</p>}</section>

      <JudgeMeReviews productId={product.id} productTitle={product.title} />

      {related.length > 0 && <section className="related-products content-section section-shell"><header className="section-heading"><div><p className="overline">From the same realm</p><h2>Related pieces.</h2></div><Link className="text-link" to="/products">Shop all <span aria-hidden="true">→</span></Link></header><div className="product-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>}
    </main>
  );
}
