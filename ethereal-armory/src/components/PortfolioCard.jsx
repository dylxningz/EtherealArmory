import { ThemeLink as Link } from "./ThemeLinks";
import { buildMediaSrcSet, disclosureLabel, labelForPortfolioValue } from "../lib/portfolio";

export default function PortfolioCard({ project, featured = false, headingLevel = 2 }) {
  const disclosure = disclosureLabel(project);
  const srcSet = buildMediaSrcSet(project.heroMedia);
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article className={`portfolio-card${featured ? " is-featured" : ""}`}>
      <Link to={`/portfolio/${project.slug}`} aria-label={`View ${project.title} project`}>
        <figure className="portfolio-card-media">
          <img
            src={project.heroMedia.src}
            srcSet={srcSet}
            sizes={featured ? "(max-width: 900px) 92vw, 55vw" : "(max-width: 760px) 92vw, 45vw"}
            alt={project.heroMedia.alt}
            width={project.heroMedia.width}
            height={project.heroMedia.height}
            loading={featured ? "eager" : "lazy"}
          />
        </figure>
        <div className="portfolio-card-copy">
          <div className="portfolio-card-meta">
            <span>{labelForPortfolioValue(project.projectType)}</span>
            {project.yearCompleted && <span>{project.yearCompleted}</span>}
          </div>
          <Heading>{project.title}</Heading>
          <p>{project.projectSummary}</p>
          <div className="portfolio-card-footer">
            {disclosure && <span className="portfolio-disclosure">{disclosure}</span>}
            <span className="text-link">View case study <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
