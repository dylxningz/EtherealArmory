import Seo from "../components/Seo";
import PortfolioCard from "../components/PortfolioCard";
import { ThemeLink as Link } from "../components/ThemeLinks";
import { getPortfolioRegistry } from "../data/portfolioProjects";
import "./PortfolioPage.css";

const description = "Selected custom commissions, original concepts, prototypes, experiments, and one-of-a-kind builds from Ethereal Armory.";

export default function PortfolioPage() {
  const { projects, error } = getPortfolioRegistry();
  const featured = projects.find((project) => project.featured) || null;
  const remaining = featured ? projects.filter((project) => project.slug !== featured.slug) : projects;

  return (
    <main id="main-content" className="portfolio-page section-shell">
      <Seo title="Portfolio" description={description} path="/portfolio" />
      <header className="portfolio-landing-hero">
        <p className="overline">Design & fabrication portfolio</p>
        <h1>Selected Work</h1>
        <p>A growing archive of custom commissions, original concepts, prototypes, experiments, and one-of-a-kind builds from Ethereal Armory.</p>
      </header>

      {error ? (
        <section className="portfolio-registry-error" role="alert">
          <p className="overline">Archive configuration</p>
          <h2>The Portfolio needs attention.</h2>
          <p>A project record could not be published safely. The rest of the studio remains available while its content is reviewed.</p>
          <div className="button-row"><Link className="button button-primary" to="/contact">Discuss a custom build</Link><Link className="button button-secondary" to="/products">Explore available pieces</Link></div>
        </section>
      ) : projects.length === 0 ? (
        <section className="portfolio-empty-state" aria-labelledby="portfolio-empty-title">
          <div className="portfolio-empty-mark" aria-hidden="true"><span>EA</span><strong>Selected work</strong></div>
          <div>
            <p className="overline">The archive is taking shape</p>
            <h2 id="portfolio-empty-title">Project case studies are currently being prepared.</h2>
            <p>Each entry will document the design process, fabrication decisions, technical challenges, and finished result—without turning this archive into a second shop.</p>
            <div className="button-row"><Link className="button button-primary" to="/contact">Discuss a custom build</Link><Link className="button button-secondary" to="/products">Explore available pieces</Link></div>
          </div>
        </section>
      ) : (
        <>
          {featured && (
            <section className="portfolio-featured" aria-labelledby="featured-project-title">
              <div className="portfolio-section-heading"><p className="overline">Featured project</p><h2 id="featured-project-title">A closer look at the craft.</h2></div>
              <PortfolioCard project={featured} featured headingLevel={3} />
            </section>
          )}
          {remaining.length > 0 && (
            <section className="portfolio-work" aria-labelledby="portfolio-work-title">
              <div className="portfolio-section-heading"><p className="overline">Project archive</p><h2 id="portfolio-work-title">Creative work, documented with intent.</h2></div>
              <div className="portfolio-editorial-grid">{remaining.map((project) => <PortfolioCard project={project} headingLevel={3} key={project.slug} />)}</div>
            </section>
          )}
        </>
      )}

      <section className="portfolio-studio-cta">
        <div><p className="overline">Have an idea of your own?</p><h2>Bring a custom brief to the studio.</h2><p>Share the intended use, references, scale, finish direction, timeline, and the problem the piece needs to solve.</p></div>
        <Link className="button button-primary" to="/contact">Discuss a custom build</Link>
      </section>
    </main>
  );
}
