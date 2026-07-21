import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import portfolioItems from "../data/portfolioData";
import Seo from "../components/Seo";
import { useModalDialog } from "../hooks/useModalDialog";

function PortfolioPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const modalRef = useRef(null);
  const closeModal = useCallback(() => setSelectedItem(null), []);
  useModalDialog({
    open: Boolean(selectedItem),
    containerRef: modalRef,
    onClose: closeModal,
    inertSelector: "header, footer, .announcement-banner, .portfolio-page > :not(.portfolio-modal-overlay)",
  });

  return (
    <main id="main-content" className="portfolio-page">
      <Seo title="Portfolio" description="Explore custom fantasy props, replica projects, fabrication, finishing, and presentation work by Ethereal Armory." path="/portfolio" />
      <section className="portfolio-hero">
        <p className="section-eyebrow">Commission Portfolio</p>
        <h1>Custom projects, built from concept to display.</h1>
        <p className="portfolio-intro">
          A closer look at original builds, replica-style projects, and the
          hands-on work behind each piece: design planning, modeling, printing,
          finishing, electronics, and presentation.
        </p>
        <div className="portfolio-hero-actions">
          <Link to="/contact" className="primary-link-btn">
            Start a Custom Build
          </Link>
          <a href="#portfolio-work" className="secondary-link-btn">
            View Projects
          </a>
        </div>
      </section>

      <section className="portfolio-overview" aria-label="Portfolio strengths">
        <div>
          <span>01</span>
          <strong>Custom Briefs</strong>
          <p>
            Each project starts with the character, display goal, scale, and
            finish direction.
          </p>
        </div>
        <div>
          <span>02</span>
          <strong>Hands-On Fabrication</strong>
          <p>
            Work can include CAD, print prep, sanding, paint, assembly, and
            lighting plans.
          </p>
        </div>
        <div>
          <span>03</span>
          <strong>Display-Ready Results</strong>
          <p>
            The final goal is a prop that reads clearly in photos, on a shelf,
            or at an event.
          </p>
        </div>
      </section>

      <section className="portfolio-grid-section" id="portfolio-work">
        <div className="section-header-row portfolio-section-heading">
          <div>
            <p className="section-eyebrow">Selected Work</p>
            <h2>Projects with clear custom scope and process.</h2>
          </div>
          <Link to="/contact" className="section-link">
            Request Similar Work
          </Link>
        </div>

        <div className="portfolio-grid">
          {portfolioItems.map((item) => (
            <button
              key={item.id}
              className="portfolio-card"
              onClick={() => setSelectedItem(item)}
              type="button"
            >
              <div className="portfolio-card-image-wrap">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="portfolio-card-image"
                  width="720"
                  height="720"
                  loading="lazy"
                />
              </div>

              <div className="portfolio-card-content">
                <p className="portfolio-card-category">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>

                <div className="portfolio-card-brief">
                  <strong>Custom brief</strong>
                  <span>{item.brief}</span>
                </div>

                <div className="portfolio-card-proof">
                  {item.customWork.slice(0, 3).map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </div>

                <div className="portfolio-card-tools">
                  {item.tools.map((tool) => (
                    <span key={tool} className="portfolio-tag">
                      {tool}
                    </span>
                  ))}
                </div>

                <span className="portfolio-card-cta">View project details</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedItem && (
        <section
          className="portfolio-modal-overlay"
          onMouseDown={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="portfolio-modal" role="dialog" aria-modal="true" aria-labelledby="portfolio-modal-title" ref={modalRef} tabIndex="-1">
            <button
              className="portfolio-close-btn"
              onClick={closeModal}
              aria-label="Close project details"
              type="button"
            >
              x
            </button>

            <div className="portfolio-modal-header">
              <img
                src={selectedItem.cover}
                alt={selectedItem.title}
                className="portfolio-modal-cover"
              />

              <div>
                <p className="portfolio-card-category">
                  {selectedItem.category}
                </p>
                <h2 id="portfolio-modal-title">{selectedItem.title}</h2>
                <p>{selectedItem.fullDescription}</p>
                <Link
                  to="/contact"
                  className="primary-link-btn portfolio-inquiry-link"
                >
                  Request a Similar Build
                </Link>

                <div className="portfolio-card-tools">
                  {selectedItem.tools.map((tool) => (
                    <span key={tool} className="portfolio-tag">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="portfolio-detail-grid">
              <div>
                <h3>Custom Brief</h3>
                <p>{selectedItem.brief}</p>
              </div>
              <div>
                <h3>Outcome</h3>
                <p>{selectedItem.outcome}</p>
              </div>
            </div>

            {selectedItem.customWork?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>What I Worked On</h3>
                <div className="portfolio-work-list">
                  {selectedItem.customWork.map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.gallery?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>Gallery</h3>
                <div className="portfolio-gallery">
                  {selectedItem.gallery.map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${selectedItem.title} gallery ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedItem.process?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>Design Process</h3>
                <ol className="portfolio-process-list">
                  {selectedItem.process.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedItem.sketches?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>Sketches / Development</h3>
                <div className="portfolio-gallery">
                  {selectedItem.sketches.map((image, index) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${selectedItem.title} sketch ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default PortfolioPage;
