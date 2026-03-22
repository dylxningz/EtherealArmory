import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addToCart,
  createCart,
  createCartAndGetCheckoutUrl,
  getProductByHandle,
} from "../lib/shopify";
import "./ProductPage.css";
import { getSalePricing, formatPrice } from "../lib/pricing";

function optionsToKey(selectedOptions) {
  return selectedOptions
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((opt) => `${opt.name}:${opt.value}`)
    .join("|");
}

function buildVariantMap(variants) {
  const map = new Map();

  variants.forEach((variant) => {
    map.set(optionsToKey(variant.selectedOptions), variant);
  });

  return map;
}

export default function ProductPage() {
  const { handle } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data = await getProductByHandle(handle);

        if (!data) {
          throw new Error("Product not found.");
        }

        if (ignore) return;

        setProduct(data);

        const initialOptions = {};
        data.options.forEach((option) => {
          initialOptions[option.name] = option.values[0];
        });

        const firstVariant = data.variants.nodes[0];

        if (firstVariant?.selectedOptions?.length) {
          firstVariant.selectedOptions.forEach((opt) => {
            initialOptions[opt.name] = opt.value;
          });
        }

        setSelectedOptions(initialOptions);

        const firstImage =
          firstVariant?.image?.url || data.images.nodes[0]?.url || null;

        setSelectedImage(firstImage);
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load product.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [handle]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;

    const variantMap = buildVariantMap(product.variants.nodes);
    const key = optionsToKey(
      Object.entries(selectedOptions).map(([name, value]) => ({ name, value }))
    );

    return variantMap.get(key) || product.variants.nodes[0] || null;
  }, [product, selectedOptions]);

  const salePricing = selectedVariant?.price?.amount
  ? getSalePricing(selectedVariant.price.amount)
  : null;

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const base = product.images.nodes.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText || product.title,
    }));

    if (
      selectedVariant?.image?.url &&
      !base.some((img) => img.url === selectedVariant.image.url)
    ) {
      return [
        {
          id: "selected-variant-image",
          url: selectedVariant.image.url,
          altText: selectedVariant.image.altText || product.title,
        },
        ...base,
      ];
    }

    return base;
  }, [product, selectedVariant]);

  useEffect(() => {
    if (selectedVariant?.image?.url) {
      setSelectedImage(selectedVariant.image.url);
    }
  }, [selectedVariant]);

  function handleOptionChange(optionName, value) {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  }

  async function handleAddToCart() {
    if (!selectedVariant?.id) return;

    try {
      setAdding(true);

      let cartId = localStorage.getItem("cartId");

      if (!cartId) {
        const newCart = await createCart();
        cartId = newCart.id;
        localStorage.setItem("cartId", cartId);
      }

      await addToCart(cartId, selectedVariant.id);

      if (window.loadCartFromStorage) {
        await window.loadCartFromStorage();
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add to cart.");
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant?.id) return;

    try {
      setBuying(true);
      const checkoutUrl = await createCartAndGetCheckoutUrl(selectedVariant.id);
      window.location.href = checkoutUrl;
    } catch (err) {
      alert(err.message || "Could not start checkout.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return <div className="product-page-status">Loading product...</div>;
  }

  if (error) {
    return <div className="product-page-status">{error}</div>;
  }

  if (!product) {
    return <div className="product-page-status">Product not found.</div>;
  }

  return (
    <div className="product-page">
      <div className="product-gallery">
        <div className="product-main-image-wrap">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt={product.title}
              className="product-main-image"
            />
          ) : (
            <div className="product-image-placeholder">No image available</div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <div className="product-thumbnails">
            {galleryImages.map((image) => (
              <button
                key={image.id}
                className={`product-thumb-btn ${
                  selectedImage === image.url ? "active" : ""
                }`}
                onClick={() => setSelectedImage(image.url)}
              >
                <img
                  src={image.url}
                  alt={image.altText}
                  className="product-thumb-image"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-info">
        <h1>{product.title}</h1>

<div className="product-price-block">
  {salePricing?.isOnSale ? (
    <>
      <div className="product-sale-row">
        <span className="product-sale-price">${formatPrice(salePricing.finalPrice)}</span>
        <span className="product-original-price">
          ${formatPrice(salePricing.originalPrice)}
        </span>
      </div>
      <div className="product-sale-badge">
        {salePricing.label}
      </div>
    </>
  ) : (
    <div className="product-price">
      ${selectedVariant?.price?.amount ? formatPrice(selectedVariant.price.amount) : "0.00"}
    </div>
  )}
</div>

        <div
          className="product-description"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />

        {product.options?.length > 0 && (
          <div className="product-options">
            {product.options.map((option) => (
              <div key={option.name} className="product-option-group">
                <label className="product-option-label">{option.name}</label>

                <div className="product-option-values">
                  {option.values.map((value) => (
                    <button
                      key={value}
                      className={`option-chip ${
                        selectedOptions[option.name] === value ? "selected" : ""
                      }`}
                      onClick={() => handleOptionChange(option.name, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="product-action-row">
          <button
            className="buy-now-btn"
            onClick={handleAddToCart}
            disabled={!selectedVariant?.availableForSale || adding}
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          <button
            className="secondary-btn"
            onClick={handleBuyNow}
            disabled={!selectedVariant?.availableForSale || buying}
          >
            {buying ? "Redirecting..." : "Buy Now"}
          </button>
        </div>
      </div>
      {showToast && (
  <div className="toast">
    Added to cart
  </div>
)}
    </div>
  );
}