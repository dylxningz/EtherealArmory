import { useEffect, useRef, useState } from "react";

const SHOP_DOMAIN = import.meta.env.VITE_JUDGEME_SHOP_DOMAIN;
const PUBLIC_TOKEN = import.meta.env.VITE_JUDGEME_PUBLIC_TOKEN;

function getShopifyProductId(productId) {
  return productId?.split("/").pop() || "";
}

function loadJudgeMeScript(id, src) {
  const existingScript = document.getElementById(id);

  if (existingScript) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.dataset.cfasync = "false";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

export default function JudgeMeReviews({ productId, productTitle }) {
  const numericProductId = getShopifyProductId(productId);
  const sectionRef = useRef(null);
  const widgetRef = useRef(null);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (!SHOP_DOMAIN || !PUBLIC_TOKEN || !numericProductId) return;

    let mutationObserver;
    const section = sectionRef.current;

    function loadReviews() {
      setPhase("loading");
      const widget = widgetRef.current;
      mutationObserver = new MutationObserver(() => {
        if (widget?.children.length) setPhase("loaded");
      });
      if (widget) mutationObserver.observe(widget, { childList: true, subtree: true });

      window.jdgm = window.jdgm || {};
      window.jdgm.SHOP_DOMAIN = SHOP_DOMAIN;
      window.jdgm.PLATFORM = "shopify";
      window.jdgm.PUBLIC_TOKEN = PUBLIC_TOKEN;

      loadJudgeMeScript(
        "judgeme-widget-preloader",
        "https://cdnwidget.judge.me/widget_preloader.js"
      )
      .then(() =>
        loadJudgeMeScript(
        "judgeme-installed-assets",
          "https://cdnwidget.judge.me/assets/installed.js"
        )
      )
      .then(() => {
        window.jdgmCacheServer?.reloadAllWidgets?.();
      })
      .catch(() => setPhase("error"));
    }

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        intersectionObserver.disconnect();
        loadReviews();
      }
    }, { rootMargin: "300px" });
    if (section) intersectionObserver.observe(section);

    return () => {
      intersectionObserver.disconnect();
      mutationObserver?.disconnect();
    };
  }, [numericProductId]);

  if (!PUBLIC_TOKEN || !numericProductId) return null;

  return (
    <section
      className={`judgeme-reviews-section ${phase === "loaded" ? "is-loaded" : ""}`}
      aria-label={`${productTitle} reviews`}
      ref={sectionRef}
    >
      <div className="judgeme-reviews-heading">
        <p className="section-eyebrow">Customer Reviews</p>
        <h2>What collectors are saying.</h2>
      </div>

      <div
        ref={widgetRef}
        id="judgeme_product_reviews"
        className="jdgm-widget jdgm-review-widget"
        data-id={numericProductId}
        data-product-title={productTitle}
      />
      {phase === "loading" && <p className="reviews-status" aria-live="polite">Loading verified reviews…</p>}
      {phase === "error" && <p className="reviews-status" role="status">Reviews are temporarily unavailable.</p>}
    </section>
  );
}
