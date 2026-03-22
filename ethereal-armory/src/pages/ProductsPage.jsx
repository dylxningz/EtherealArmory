import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getCollections, getProducts, getCollectionProducts } from "../lib/shopify";
import "./ProductsPage.css";
import { getSalePricing, formatPrice } from "../lib/pricing";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("All");
  const [sortOption, setSortOption] = useState("featured");

  const carouselRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [productsData, collectionsData] = await Promise.all([
          getProducts(40),
          getCollections(12),
        ]);

        if (!ignore) {
          setProducts(productsData || []);
          setCollections(collectionsData || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load products.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleCollectionClick(handle) {
    try {
      setLoading(true);
      setError("");
      setSelectedCollection(handle);

      if (handle === "All") {
        const allProducts = await getProducts(40);
        setProducts(allProducts || []);
      } else {
        const collection = await getCollectionProducts(handle, 40);
        setProducts(collection?.products?.nodes || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load collection.");
    } finally {
      setLoading(false);
    }
  }

  const sortedProducts = useMemo(() => {
    const result = [...products];

    switch (sortOption) {
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price-low-high":
        result.sort(
          (a, b) =>
            Number(a.priceRange.minVariantPrice.amount) -
            Number(b.priceRange.minVariantPrice.amount)
        );
        break;
      case "price-high-low":
        result.sort(
          (a, b) =>
            Number(b.priceRange.minVariantPrice.amount) -
            Number(a.priceRange.minVariantPrice.amount)
        );
        break;
      default:
        break;
    }

    return result;
  }, [products, sortOption]);

  function scrollCarousel(direction) {
    if (!carouselRef.current) return;

    const scrollAmount = carouselRef.current.clientWidth * 0.8;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }

  if (loading) {
    return <main className="products-page-status">Loading products...</main>;
  }

  if (error) {
    return <main className="products-page-status">{error}</main>;
  }

  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="products-hero-header">
          <div>
            <p className="products-eyebrow">Shop The Armory</p>
            <h1>Products</h1>
            <p className="products-subtext">
              Browse by collection, then sort products the way you want.
            </p>
          </div>

          <div className="carousel-controls">
            <button
              className="carousel-arrow"
              onClick={() => scrollCarousel("left")}
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              className="carousel-arrow"
              onClick={() => scrollCarousel("right")}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        <div className="featured-carousel" ref={carouselRef}>
          <button
            className={`featured-card collection-card-button ${
              selectedCollection === "All" ? "selected-collection" : ""
            }`}
            onClick={() => handleCollectionClick("All")}
          >
            <div className="featured-card-image-wrap">
              <div className="featured-card-placeholder">All Products</div>
            </div>
            <div className="featured-card-body">
              <p className="featured-card-type">Collection</p>
              <h3>All Products</h3>
            </div>
          </button>

          {collections.map((collection) => (
            <button
              key={collection.id}
              className={`featured-card collection-card-button ${
                selectedCollection === collection.handle ? "selected-collection" : ""
              }`}
              onClick={() => handleCollectionClick(collection.handle)}
            >
              <div className="featured-card-image-wrap">
                {collection.image?.url ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    className="featured-card-image"
                  />
                ) : (
                  <div className="featured-card-placeholder">{collection.title}</div>
                )}
              </div>

              <div className="featured-card-body">
                <p className="featured-card-type">Collection</p>
                <h3>{collection.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="products-controls">
        <div className="filter-group">
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="title-asc">Title: A to Z</option>
            <option value="title-desc">Title: Z to A</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
          </select>
        </div>
      </section>

      <section className="products-grid-section">
        <div className="products-grid">
          {sortedProducts.map((product) => (
            <Link
              to={`/products/${product.handle}`}
              className="product-card"
              key={product.id}
            >
              <div className="product-card-image-wrap">
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    className="product-card-image"
                  />
                ) : (
                  <div className="product-card-placeholder">No image</div>
                )}
              </div>

              <div className="product-card-body">
                <p className="product-card-type">
                  {product.productType || "Product"}
                </p>
                <h3>{product.title}</h3>
                <div className="product-card-footer">
{(() => {
  const salePricing = getSalePricing(product.priceRange.minVariantPrice.amount);

  return salePricing.isOnSale ? (
    <div className="product-card-price-block">
      <span className="product-card-sale-price">
        ${formatPrice(salePricing.finalPrice)}
      </span>
      <span className="product-card-original-price">
        ${formatPrice(salePricing.originalPrice)}
      </span>
    </div>
  ) : (
    <span className="product-card-price">
      ${formatPrice(product.priceRange.minVariantPrice.amount)}
    </span>
  );
})()}
                  <span className="product-card-link">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}