import { Outlet } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import AnnouncementBanner from "./AnnouncementBanner";
import ScrollToTop from "./ScrollToTop";

export default function SiteLayout() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AnnouncementBanner />
      <Header />
      <Outlet />
      <Footer />
      <CartDrawer />
      <ScrollToTop />
      <Analytics />
    </div>
  );
}
