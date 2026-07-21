import { useEffect, useRef, useState } from "react";
import { getJudgeMeRenderState } from "../lib/reviews";

const SHOP_DOMAIN = import.meta.env.VITE_JUDGEME_SHOP_DOMAIN;
const PUBLIC_TOKEN = import.meta.env.VITE_JUDGEME_PUBLIC_TOKEN;
const scriptPromises = new Map();

function getShopifyProductId(productId) {
  return productId?.split("/").pop() || "";
}

function loadJudgeMeScript(id, src) {
  if (scriptPromises.has(id)) return scriptPromises.get(id);

  const promise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);
    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript || document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.dataset.cfasync = "false";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", (error) => {
      scriptPromises.delete(id);
      script.remove();
      reject(error);
    }, { once: true });
    if (!existingScript) document.head.appendChild(script);
  });

  scriptPromises.set(id, promise);
  return promise;
}

export default function JudgeMeReviews({ productId, productTitle }) {
  const numericProductId = getShopifyProductId(productId);
  const sectionRef = useRef(null);
  const widgetRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const configured = Boolean(SHOP_DOMAIN && PUBLIC_TOKEN && numericProductId);

  useEffect(() => {
    if (!configured) return undefined;

    let mutationObserver;
    let renderTimer;
    let cancelled = false;
    const section = sectionRef.current;

    function readWidgetState() {
      if (cancelled) return;
      const state = getJudgeMeRenderState(widgetRef.current);
      if (state !== "loading") {
        window.clearTimeout(renderTimer);
        setPhase(state);
      }
    }

    function loadReviews() {
      setPhase("loading");
      const widget = widgetRef.current;
      mutationObserver = new MutationObserver(readWidgetState);
      if (widget) mutationObserver.observe(widget, { childList: true, subtree: true, characterData: true });

      window.jdgm = window.jdgm || {};
      window.jdgm.SHOP_DOMAIN = SHOP_DOMAIN;
      window.jdgm.PLATFORM = "shopify";
      window.jdgm.PUBLIC_TOKEN = PUBLIC_TOKEN;

      loadJudgeMeScript("judgeme-widget-preloader", "https://cdnwidget.judge.me/widget_preloader.js")
        .then(() => loadJudgeMeScript("judgeme-installed-assets", "https://cdnwidget.judge.me/assets/installed.js"))
        .then(() => {
          if (cancelled) return;
          window.jdgmCacheServer?.reloadAllWidgets?.();
          readWidgetState();
          renderTimer = window.setTimeout(() => setPhase((current) => current === "loading" ? "error" : current), 10000);
        })
        .catch(() => !cancelled && setPhase("error"));
    }

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        intersectionObserver.disconnect();
        loadReviews();
      }
    }, { rootMargin: "300px" });
    if (section) intersectionObserver.observe(section);

    return () => {
      cancelled = true;
      intersectionObserver.disconnect();
      mutationObserver?.disconnect();
      window.clearTimeout(renderTimer);
    };
  }, [configured, numericProductId]);

  if (!configured) return null;

  return (
    <section
      className={`judgeme-reviews-section is-${phase}`}
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
        className="jdgm-widget jdgm-review-widget jdgm-outside-widget"
        data-id={numericProductId}
        data-product-title={productTitle}
      />
      {phase === "loading" && <p className="reviews-status" aria-live="polite">Loading verified reviews…</p>}
      {phase === "empty" && <div className="reviews-empty" role="status"><strong>No reviews yet.</strong><span>Be the first collector to share an honest review of this piece.</span></div>}
      {phase === "error" && <p className="reviews-status" role="status">Reviews are temporarily unavailable.</p>}
    </section>
  );
}
