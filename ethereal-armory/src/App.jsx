import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCart } from "./lib/shopify";
import ProductPage from "./pages/ProductPage";
import ProductsPage from "./pages/ProductsPage";
import "./index.css";

function SiteLayout() {
  const [cart, setCart] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function loadCart() {
      try {
        const cartId = localStorage.getItem("cartId");
        if (!cartId) return;

        const cartData = await getCart(cartId);
        setCart(cartData);
      } catch (err) {
        console.error("Failed to load cart:", err);
      }
    }

    loadCart();

    window.loadCartFromStorage = async function () {
      try {
        const cartId = localStorage.getItem("cartId");

        if (!cartId) {
          setCart(null);
          return;
        }

        const cartData = await getCart(cartId);
        setCart(cartData);
      } catch (err) {
        console.error("Failed to refresh cart:", err);
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="logo">Ethereal Armory</Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/portfolio">Portfolio</Link>
        </nav>

        <button className="cart-nav-btn" onClick={() => setIsCartOpen(true)}>
          Cart {cart?.totalQuantity ? `(${cart.totalQuantity})` : "(0)"}
        </button>
      </header>

      <Outlet />

      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h2>Your Cart</h2>
              <button
                className="cart-close-btn"
                onClick={() => setIsCartOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="cart-drawer-body">
              {!cart || !cart.lines?.nodes?.length ? (
                <p className="cart-empty-text">Your cart is empty.</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.lines.nodes.map((line) => (
                      <div className="cart-item" key={line.id}>
                        <div className="cart-item-image-wrap">
                          {line.merchandise?.image?.url ? (
                            <img
                              src={line.merchandise.image.url}
                              alt={
                                line.merchandise.image.altText ||
                                line.merchandise.product.title
                              }
                              className="cart-item-image"
                            />
                          ) : (
                            <div className="cart-item-placeholder">No image</div>
                          )}
                        </div>

                        <div className="cart-item-info">
                          <h3>{line.merchandise?.product?.title}</h3>
                          <p>{line.merchandise?.title}</p>
                          <span>
                            Qty: {line.quantity} · $
                            {Number(line.merchandise?.price?.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary">
                    <p>
                      Subtotal: $
                      {Number(cart.cost?.subtotalAmount?.amount || 0).toFixed(2)}
                    </p>

                    <button
                      className="buy-now-btn"
                      onClick={() => {
                        if (cart.checkoutUrl) {
                          window.location.href = cart.checkoutUrl;
                        }
                      }}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Fantasy-Inspired 3D Creations</p>
          <h1>Crafted for collectors, cosplay, and display.</h1>
          <p className="hero-text">
            Custom 3D printed weapons, props, and magical designs made to
            stand out with an ethereal fantasy feel.
          </p>

          <div className="hero-buttons">
            <Link to="/products">
              <button className="primary-btn">Shop Now</button>
            </Link>

            <Link to="/portfolio">
              <button className="secondary-btn">View Portfolio</button>
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-square-glow"></div>
          <div className="hero-square">
            <span className="hero-square-text">Ethereal Armory</span>
          </div>
        </div>
      </section>

      <section className="featured-home">
        <div className="section-header-row">
          <div>
            <p className="section-eyebrow">Browse by Collection</p>
            <h2>Featured Collections</h2>
          </div>

          <Link to="/products" className="section-link">
            View All Products →
          </Link>
        </div>

        <div className="home-collection-grid">
          <Link to="/products" className="home-collection-card">
            <div className="home-collection-image placeholder-purple"></div>
            <div className="home-collection-body">
              <p className="home-collection-type">Collection</p>
              <h3>Marvel Rivals</h3>
            </div>
          </Link>

          <Link to="/products" className="home-collection-card">
            <div className="home-collection-image placeholder-purple"></div>
            <div className="home-collection-body">
              <p className="home-collection-type">Collection</p>
              <h3>Knives</h3>
            </div>
          </Link>

          <Link to="/products" className="home-collection-card">
            <div className="home-collection-image placeholder-purple"></div>
            <div className="home-collection-body">
              <p className="home-collection-type">Collection</p>
              <h3>Guns</h3>
            </div>
          </Link>
        </div>
      </section>

      <section className="custom-design-section">
        <div className="custom-design-box">
          <div className="custom-design-text">
            <p className="section-eyebrow">Made for Your Vision</p>
            <h2>Looking for a custom design?</h2>
            <p>
              Want something unique for cosplay, display, or a themed gift?
              Ethereal Armory also offers custom-designed pieces tailored to
              your idea and style.
            </p>
          </div>

          <div className="custom-design-actions">
            <Link to="/contact">
              <button className="primary-btn">Request a Custom Design</button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="section-eyebrow">About Ethereal Armory</p>
        <h1>Fantasy-inspired creations made for collectors, cosplay, and display.</h1>
        <p className="about-hero-text">
          Ethereal Armory is built around the idea that props and collectibles
          should feel magical, memorable, and worthy of display. From fantasy
          weapons to stylized collectible pieces, every design is created with
          a focus on atmosphere, detail, and visual impact.
        </p>
      </section>

      <section className="about-story">
        <div className="about-story-grid">
          <div className="about-story-text">
            <p className="section-eyebrow">The Brand</p>
            <h2>Where creativity, design, and fandom meet.</h2>
            <p>
              Ethereal Armory blends fantasy aesthetics with modern 3D printing
              to create props and collectibles that feel like they came out of
              another world. The goal is not just to make replicas, but to make
              pieces that feel elevated, artistic, and display-worthy.
            </p>
            <p>
              Whether inspired by games, magical themes, or custom concepts,
              each piece is designed to stand out with a strong visual identity
              and a premium fantasy feel.
            </p>
          </div>

          <div className="about-visual-card">
            <div className="about-visual-placeholder">
              <span>Ethereal Armory</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <p className="section-eyebrow">What Defines The Work</p>
        <h2>Built around detail, atmosphere, and originality.</h2>

        <div className="about-values-grid">
          <div className="about-value-card">
            <h3>Fantasy First</h3>
            <p>
              Designs are made to feel immersive, dramatic, and inspired by the
              worlds that collectors and fans love most.
            </p>
          </div>

          <div className="about-value-card">
            <h3>Display Worthy</h3>
            <p>
              Pieces are created with presentation in mind, so they feel just as
              strong on a shelf or desk as they do in hand.
            </p>
          </div>

          <div className="about-value-card">
            <h3>Custom Friendly</h3>
            <p>
              Alongside shop items, Ethereal Armory is also built for custom
              ideas, themed requests, and one-of-a-kind concepts.
            </p>
          </div>
        </div>
      </section>

      <section className="about-process">
        <div className="about-process-box">
          <div className="about-process-text">
            <p className="section-eyebrow">Process</p>
            <h2>From concept to finished collectible.</h2>
            <p>
              Each design begins with the look and feeling it should create.
              From there, the process moves through modeling, refinement,
              printing, finishing, and presentation, with each step focused on
              making the final result feel polished and intentional.
            </p>
          </div>

          <div className="about-process-list">
            <div className="process-step">01. Design & concept</div>
            <div className="process-step">02. 3D modeling & refinement</div>
            <div className="process-step">03. Printing & finishing</div>
            <div className="process-step">04. Display-ready final piece</div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-cta-box">
          <div>
            <p className="section-eyebrow">Work With Ethereal Armory</p>
            <h2>Looking for something custom?</h2>
            <p>
              If you have a concept for a prop, collectible, or themed design,
              the custom order process is open for unique pieces and special
              requests.
            </p>
          </div>

          <Link to="/contact">
            <button className="primary-btn">Start a Custom Request</button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-hero">
        <p className="section-eyebrow">Contact Ethereal Armory</p>
        <h1>Let’s bring your idea to life.</h1>
        <p className="contact-hero-text">
          Whether you’re interested in a custom design, have a question about a
          product, or want to discuss a special request, this is the place to
          reach out.
        </p>
      </section>

      <section className="contact-content">
        <div className="contact-form-card">
          <p className="section-eyebrow">Send a Message</p>
          <h2>Start your request</h2>

          <form className="contact-form">
            <div className="contact-field-row">
              <div className="contact-field">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Your name" />
              </div>

              <div className="contact-field">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Your email" />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                placeholder="Custom order, question, collaboration..."
              />
            </div>

            <div className="contact-field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                rows="7"
                placeholder="Tell me about your idea, product question, inspiration, size, colors, deadline, or anything else helpful."
              ></textarea>
            </div>

            <button type="submit" className="primary-btn contact-submit-btn">
              Send Inquiry
            </button>
          </form>
        </div>

        <div className="contact-info-column">
          <div className="contact-info-card">
            <p className="section-eyebrow">Custom Orders</p>
            <h3>What to include</h3>
            <ul className="contact-info-list">
              <li>What type of piece you want</li>
              <li>Theme, fandom, or inspiration</li>
              <li>Preferred size or display use</li>
              <li>Any colors, materials, or details</li>
              <li>Your timeline, if you have one</li>
            </ul>
          </div>

          <div className="contact-info-card">
            <p className="section-eyebrow">Good to Know</p>
            <h3>Before you reach out</h3>
            <p>
              The more detail you provide, the easier it is to understand your
              vision and give you a better response. If you already have
              references, concepts, or inspiration images, those can be helpful
              too.
            </p>
          </div>

          <div className="contact-info-card">
            <p className="section-eyebrow">Ethereal Armory</p>
            <h3>Questions, ideas, and collaborations welcome.</h3>
            <p>
              Whether you’re ordering something custom or just asking about an
              existing piece, feel free to reach out and start the conversation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PortfolioPage() {
  return (
    <main className="basic-page">
      <div className="wip-box">
        <p className="section-eyebrow">Portfolio</p>
        <h1>Work in Progress</h1>
        <p>
          This section is currently being built and will soon showcase finished
          props, custom pieces, and featured projects from Ethereal Armory.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:handle" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}