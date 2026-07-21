import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useModalDialog } from "../hooks/useModalDialog";

const links = [
  ["/", "Home"],
  ["/products", "Shop"],
  ["/portfolio", "Portfolio"],
  ["/about", "About"],
  ["/contact", "Custom builds"],
];

function MenuIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  );
}

function BagIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { cart, openCart } = useCart();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useModalDialog({
    open: menuOpen,
    containerRef: menuRef,
    onClose: closeMenu,
    inertSelector: ".site-header, main, footer, .announcement-banner, .cart-layer",
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    const handleChange = (event) => event.matches && closeMenu();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [closeMenu]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Ethereal Armory home">
          <img src="/brand-mark.svg" alt="" width="52" height="52" />
          <span className="brand-name"><strong>Ethereal</strong> Armory</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button className="header-button menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mobile-navigation" type="button">
            <MenuIcon open={menuOpen} />
            <span>Menu</span>
          </button>
          <button className="header-button cart-button" onClick={openCart} aria-label={`Open cart with ${cart?.totalQuantity || 0} items`} type="button">
            <BagIcon />
            <span>Cart</span>
            <span className="cart-count" aria-hidden="true">{cart?.totalQuantity || 0}</span>
          </button>
        </div>
      </div>

      {menuOpen && createPortal(
        <div className="mobile-nav-overlay" onMouseDown={(event) => event.target === event.currentTarget && closeMenu()}>
          <nav id="mobile-navigation" className="mobile-nav-panel" aria-label="Mobile navigation" aria-modal="true" role="dialog" ref={menuRef} tabIndex="-1">
            <div className="mobile-nav-heading">
              <p className="overline">Navigate the armory</p>
              <button className="icon-button" onClick={closeMenu} aria-label="Close navigation" type="button"><span aria-hidden="true">×</span></button>
            </div>
            {links.map(([to, label], index) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={closeMenu}>
                <span aria-hidden="true">0{index + 1}</span>{label}
              </NavLink>
            ))}
            <p className="mobile-nav-note">Hand-finished fantasy props and custom commissions.</p>
          </nav>
        </div>,
        document.body
      )}
    </header>
  );
}
