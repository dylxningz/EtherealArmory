import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import SiteLayout from "./components/SiteLayout";
import "./index.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ShippingPolicyPage = lazy(() => import("./pages/ShippingPolicyPage"));
const ReturnsPolicyPage = lazy(() => import("./pages/ReturnsPolicyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RouteFallback() {
  return <main id="main-content" className="route-loading" aria-busy="true"><span className="loading-mark" aria-hidden="true">◇</span><p>Opening the armory…</p></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="collections/:handle" element={<ProductsPage />} />
              <Route path="products/:handle" element={<ProductPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms-of-service" element={<TermsPage />} />
              <Route path="shipping-policy" element={<ShippingPolicyPage />} />
              <Route path="returns-policy" element={<ReturnsPolicyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  );
}
