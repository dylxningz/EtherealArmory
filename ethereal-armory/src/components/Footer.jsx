import { Link } from "react-router-dom";

const shopLinks = [["/products", "Shop all"], ["/portfolio", "Portfolio"], ["/contact", "Custom builds"]];
const policyLinks = [["/shipping-policy", "Shipping"], ["/returns-policy", "Returns"], ["/privacy-policy", "Privacy"], ["/terms-of-service", "Terms"]];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <Link className="brand" to="/" aria-label="Ethereal Armory home">
            <img src="/brand-mark.svg" alt="" width="48" height="48" />
            <span className="brand-name"><strong>Ethereal</strong> Armory</span>
          </Link>
          <p>Premium fantasy props, replicas, and display pieces crafted with a collector’s eye.</p>
        </div>
        <nav aria-label="Shop and studio"><h2>Explore</h2>{shopLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>
        <nav aria-label="Store policies"><h2>Policies</h2>{policyLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>
        <div className="footer-contact"><h2>Questions</h2><a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a><p>Response times vary with active commission work.</p></div>
      </div>
      <div className="footer-base"><span>© {new Date().getFullYear()} Ethereal Armory</span><span>Secure checkout powered by Shopify</span></div>
    </footer>
  );
}
