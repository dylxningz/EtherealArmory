import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Seo, { SITE_URL } from "../components/Seo";
import ProductCard from "../components/ProductCard";
import CollectionArtwork from "../components/CollectionArtwork";
import { EmptyState, ErrorState, LoadingGrid } from "../components/AsyncState";
import { getCollectionProductsPage, getCollectionsPage, getProductsPage } from "../lib/shopify";
import { getCatalogState, sortProducts, updateCatalogState } from "../lib/commerce";
import "./ProductsPage.css";

const sortOptions = {
  featured: { general: "BEST_SELLING", collection: "COLLECTION_DEFAULT", reverse: false },
  "title-asc": { general: "TITLE", collection: "TITLE", reverse: false },
  "title-desc": { general: "TITLE", collection: "TITLE", reverse: true },
  "price-low-high": { general: "PRICE", collection: "PRICE", reverse: false },
  "price-high-low": { general: "PRICE", collection: "PRICE", reverse: true },
};

export default function ProductsPage() {
  const { handle } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const catalogState = getCatalogState(searchParams);
  const [collections, setCollections] = useState([]);
  const [catalog, setCatalog] = useState({ products: [], pageInfo: {}, collection: null, routeHandle: undefined });
  const [status, setStatus] = useState("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getCollectionsPage({ first: 20, signal: controller.signal }).then((result) => setCollections(result.nodes)).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const selectedSort = sortOptions[catalogState.sort] || sortOptions.featured;
    const request = handle
      ? getCollectionProductsPage(handle, { first: 24, sortKey: selectedSort.collection, reverse: selectedSort.reverse, signal: controller.signal })
      : getProductsPage({ first: 24, sortKey: selectedSort.general, reverse: selectedSort.reverse, signal: controller.signal });

    request.then((result) => {
      if (handle) {
        setCatalog({ products: result?.products?.nodes || [], pageInfo: result?.products?.pageInfo || {}, collection: result || null, routeHandle: handle });
      } else {
        setCatalog({ products: result.nodes, pageInfo: result.pageInfo, collection: null, routeHandle: null });
      }
      setStatus("ready");
    }).catch((error) => {
      if (error.name !== "AbortError") setStatus("error");
    });
    return () => controller.abort();
  }, [catalogState.sort, handle, retryKey]);

  const productTypes = useMemo(() => [...new Set(catalog.products.map((product) => product.productType).filter(Boolean))].sort(), [catalog.products]);
  const filteredProducts = useMemo(() => {
    const filtered = catalog.products.filter((product) => {
      if (catalogState.type !== "all" && product.productType !== catalogState.type) return false;
      if (catalogState.availability === "available" && !product.availableForSale) return false;
      if (catalogState.availability === "sold-out" && product.availableForSale) return false;
      return true;
    });
    return sortProducts(filtered, catalogState.sort);
  }, [catalog.products, catalogState.availability, catalogState.sort, catalogState.type]);

  const setFilter = useCallback((changes) => {
    if (changes.sort) setStatus("loading");
    setSearchParams(updateCatalogState(searchParams, changes), { replace: false });
  }, [searchParams, setSearchParams]);

  async function loadMore() {
    if (!catalog.pageInfo?.hasNextPage || loadingMore) return;
    const selectedSort = sortOptions[catalogState.sort] || sortOptions.featured;
    setLoadingMore(true);
    try {
      const result = handle
        ? await getCollectionProductsPage(handle, { first: 24, after: catalog.pageInfo.endCursor, sortKey: selectedSort.collection, reverse: selectedSort.reverse })
        : await getProductsPage({ first: 24, after: catalog.pageInfo.endCursor, sortKey: selectedSort.general, reverse: selectedSort.reverse });
      const connection = handle ? result.products : result;
      setCatalog((current) => ({ ...current, products: [...current.products, ...connection.nodes], pageInfo: connection.pageInfo }));
    } catch {
      setStatus("load-more-error");
    } finally {
      setLoadingMore(false);
    }
  }

  const title = catalog.collection?.title || "Shop All";
  const description = catalog.collection?.seo?.description || catalog.collection?.description || "Browse available fantasy props, replicas, collectibles, and display-ready pieces from Ethereal Armory.";
  const path = handle ? `/collections/${handle}` : "/products";
  const schema = useMemo(() => ({
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: handle ? title : "Shop", item: `${SITE_URL}${path}` },
    ],
  }), [handle, path, title]);

  if (status === "ready" && handle && !catalog.collection) {
    return <main id="main-content" className="catalog-page section-shell"><Seo title="Collection Not Found" path={path} noIndex /><EmptyState title="This collection cannot be found" message="It may have been renamed or removed." action={<Link className="button button-primary" to="/products">Shop all products</Link>} /></main>;
  }

  return (
    <main id="main-content" className="catalog-page">
      <Seo title={catalog.collection?.seo?.title || title} path={path} description={description} structuredData={schema} />
      <section className="catalog-hero section-shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
        <p className="overline">{handle ? "Curated collection" : "Shop the armory"}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>

      <section className="collection-rail-wrap section-shell" aria-label="Shop by collection">
        <div className="collection-rail-heading"><h2>Collections</h2><div><button className="icon-button" onClick={() => carouselRef.current?.scrollBy({ left: -360, behavior: "smooth" })} aria-label="Previous collections" type="button">←</button><button className="icon-button" onClick={() => carouselRef.current?.scrollBy({ left: 360, behavior: "smooth" })} aria-label="Next collections" type="button">→</button></div></div>
        <div className="collection-rail" ref={carouselRef}>
          <Link className={!handle ? "active" : ""} to="/products"><span className="rail-image collection-artwork-fallback is-compact" aria-hidden="true"><img src="/brand-mark.svg" alt="" width="96" height="96" /></span><strong>All products</strong></Link>
          {collections.map((collection) => <Link className={handle === collection.handle ? "active" : ""} to={`/collections/${collection.handle}`} key={collection.id}><CollectionArtwork collection={collection} compact sizes="(max-width: 650px) 132px, 168px" /><strong>{collection.title}</strong></Link>)}
        </div>
      </section>

      <section className="catalog-results section-shell">
        <details className="catalog-filters" open>
          <summary><span>Filter & sort</span><span>{filteredProducts.length}{catalog.pageInfo?.hasNextPage ? "+" : ""} results</span></summary>
          <div className="filter-fields">
            <label>Product type<select value={catalogState.type} onChange={(event) => setFilter({ type: event.target.value })}><option value="all">All types</option>{productTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label>Availability<select value={catalogState.availability} onChange={(event) => setFilter({ availability: event.target.value })}><option value="all">Any availability</option><option value="available">Available</option><option value="sold-out">Sold out</option></select></label>
            <label>Sort by<select value={catalogState.sort} onChange={(event) => setFilter({ sort: event.target.value })}><option value="featured">Featured</option><option value="title-asc">Title: A–Z</option><option value="title-desc">Title: Z–A</option><option value="price-low-high">Price: low to high</option><option value="price-high-low">Price: high to low</option></select></label>
            {(catalogState.type !== "all" || catalogState.availability !== "all" || catalogState.sort !== "featured") && <button className="text-button clear-filters" onClick={() => setSearchParams(new URLSearchParams())} type="button">Clear filters</button>}
          </div>
        </details>

        {status === "error"
          ? <ErrorState title="The catalog could not be loaded" message="Shopify did not respond. No cart or account data has been changed." onRetry={() => { setStatus("loading"); setRetryKey((key) => key + 1); }} />
          : status === "loading" || catalog.routeHandle !== (handle || null)
            ? <LoadingGrid />
            : filteredProducts.length
              ? <div className="product-grid">{filteredProducts.map((product, index) => <ProductCard product={product} eager={index < 4} key={product.id} />)}</div>
              : <EmptyState title="No products match these filters" message="Clear one or more filters, or explore another collection." action={<button className="button button-secondary" onClick={() => setSearchParams(new URLSearchParams())} type="button">Clear filters</button>} />}

        {catalog.pageInfo?.hasNextPage && status !== "loading" && <div className="load-more"><p>Showing {catalog.products.length}+ products</p><button className="button button-secondary" onClick={loadMore} disabled={loadingMore} type="button">{loadingMore ? "Loading more…" : "Load more products"}</button></div>}
        {status === "load-more-error" && <div className="inline-error" role="alert"><p>More products could not be loaded. The products above are still available.</p><button className="text-button" onClick={loadMore} type="button">Try again</button></div>}
      </section>

      <section className="catalog-cta section-shell"><div><p className="overline">One of one</p><h2>Need a piece that is not in the shop?</h2><p>Start a custom brief for a replica, original prop, or display-focused build.</p></div><Link className="button button-primary" to="/contact">Request a custom build</Link></section>
    </main>
  );
}
