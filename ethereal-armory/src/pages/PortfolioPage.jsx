import { useState } from "react";
import portfolioItems from "../data/portfoliodata";

function PortfolioPage() {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <main className="portfolio-page">
      <section className="portfolio-hero">
        <p className="section-eyebrow">Portfolio</p>
        <h1>Featured Work</h1>
        <p className="portfolio-intro">
          A collection of finished props, custom projects, and design work from
          Ethereal Armory.
        </p>
      </section>

      <section className="portfolio-grid-section">
        <div className="portfolio-grid">
          {portfolioItems.map((item) => (
            <article
              key={item.id}
              className="portfolio-card"
              onClick={() => setSelectedItem(item)}
            >
              <div className="portfolio-card-image-wrap">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="portfolio-card-image"
                />
              </div>

              <div className="portfolio-card-content">
                <p className="portfolio-card-category">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>

                <div className="portfolio-card-tools">
                  {item.tools.map((tool) => (
                    <span key={tool} className="portfolio-tag">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedItem && (
        <section
          className="portfolio-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="portfolio-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="portfolio-close-btn"
              onClick={() => setSelectedItem(null)}
            >
              ×
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
                <h2>{selectedItem.title}</h2>
                <p>{selectedItem.fullDescription}</p>

                <div className="portfolio-card-tools">
                  {selectedItem.tools.map((tool) => (
                    <span key={tool} className="portfolio-tag">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selectedItem.gallery?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>Gallery</h3>
                <div className="portfolio-gallery">
                  {selectedItem.gallery.map((image, index) => (
                    <img
                      key={index}
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
                <ul className="portfolio-process-list">
                  {selectedItem.process.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedItem.sketches?.length > 0 && (
              <div className="portfolio-section-block">
                <h3>Sketches / Development</h3>
                <div className="portfolio-gallery">
                  {selectedItem.sketches.map((image, index) => (
                    <img
                      key={index}
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