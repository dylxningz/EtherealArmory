import { ThemeLink as Link } from "../components/ThemeLinks";
import Seo from "../components/Seo";

export default function NotFoundPage({ omitShareMetadata = false }) {
  return (
    <main id="main-content" className="not-found section-shell">
      <Seo
        title="Page Not Found"
        description="This route does not exist in the Ethereal Armory storefront."
        path={window.location.pathname}
        noIndex
        omitCanonical={omitShareMetadata}
        omitSocial={omitShareMetadata}
      />
      <p className="error-code" aria-hidden="true">404</p>
      <p className="overline">Lost beyond the armory</p>
      <h1>This artifact cannot be found.</h1>
      <p>The link may be outdated, or the piece may have moved to another collection.</p>
      <div className="button-row"><Link className="button button-primary" to="/products">Browse the shop</Link><Link className="button button-secondary" to="/">Return home</Link></div>
    </main>
  );
}
