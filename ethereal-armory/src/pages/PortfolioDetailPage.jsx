import { useParams } from "react-router-dom";
import Seo, { SITE_URL } from "../components/Seo";
import PortfolioCard from "../components/PortfolioCard";
import PortfolioGallery from "../components/PortfolioGallery";
import PortfolioModelPreview from "../components/PortfolioModelPreview";
import { ChallengeSolutionList, MediaSection, NarrativeLists, ProcessTimeline, ProjectFacts, ProjectOverview, ProjectRoles } from "../components/PortfolioStory";
import { ThemeLink as Link } from "../components/ThemeLinks";
import { getPortfolioRegistry } from "../data/portfolioProjects";
import { buildInquiryHref, disclosureLabel, getPortfolioProject, isPortfolioAuthoringFolder, labelForPortfolioValue } from "../lib/portfolio";
import NotFoundPage from "./NotFoundPage";
import "./PortfolioPage.css";

function absoluteUrl(path) {
  return /^https:\/\//i.test(path) ? path : `${SITE_URL}${path}`;
}

function ExternalReferences({ references }) {
  if (!references) return null;
  const entries = Object.entries(references).flatMap(([key, reference]) => {
    if (!reference) return [];
    const href = reference.url || (key === "shopifyProduct" && reference.handle ? `/products/${reference.handle}` : null);
    if (!href) return [];
    return [{ key, href, label: reference.label || "View related archive" }];
  });
  if (!entries.length) return null;
  return <section className="portfolio-external-references" aria-labelledby="portfolio-references-title"><h2 id="portfolio-references-title">Related references</h2><ul>{entries.map((entry) => <li key={entry.key}>{entry.href.startsWith("/") ? <Link className="text-link" to={entry.href}>{entry.label}</Link> : <a className="text-link" href={entry.href} target="_blank" rel="noopener noreferrer">{entry.label}</a>}</li>)}</ul></section>;
}

export default function PortfolioDetailPage() {
  const { slug } = useParams();
  const { projects, error } = getPortfolioRegistry();
  const project = getPortfolioProject(projects, slug);

  const structuredData = project ? (() => {
    const canonical = `${SITE_URL}/portfolio/${project.slug}`;
    return [
      {
        "@context": "https://schema.org",
        "@type": project.category === "digital-concept" ? "CreativeWork" : "VisualArtwork",
        name: project.title,
        description: project.projectSummary,
        url: canonical,
        image: absoluteUrl(project.seo.image || project.heroMedia.src),
        creator: { "@type": "Organization", name: "Ethereal Armory", url: SITE_URL },
        ...(project.yearCompleted ? { dateCreated: String(project.yearCompleted) } : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Portfolio", item: `${SITE_URL}/portfolio` },
          { "@type": "ListItem", position: 2, name: project.title, item: canonical },
        ],
      },
    ];
  })() : [];

  if (!error && !project) return <NotFoundPage omitShareMetadata={isPortfolioAuthoringFolder(slug)} />;
  if (error) {
    return (
      <main id="main-content" className="portfolio-page section-shell">
        <Seo title="Portfolio Unavailable" description="This Portfolio project is being reviewed." path={`/portfolio/${slug}`} noIndex />
        <section className="portfolio-registry-error" role="alert"><p className="overline">Archive configuration</p><h1>This project cannot be displayed safely.</h1><p>The project record needs attention before it can be published.</p><Link className="button button-secondary" to="/portfolio">Return to Portfolio</Link></section>
      </main>
    );
  }

  const disclosure = disclosureLabel(project);
  const inquiryHref = buildInquiryHref(project);
  const related = projects.filter((candidate) => candidate.slug !== project.slug && candidate.category === project.category).slice(0, 3);

  return (
    <main id="main-content" className="portfolio-detail-page section-shell">
      <Seo
        title={project.seo.title}
        description={project.seo.description}
        path={`/portfolio/${project.slug}`}
        image={absoluteUrl(project.seo.image || project.heroMedia.src)}
        type="article"
        structuredData={structuredData}
      />
      <nav className="portfolio-breadcrumb" aria-label="Breadcrumb"><ol><li><Link to="/portfolio">Portfolio</Link></li><li aria-current="page">{project.title}</li></ol></nav>
      <header className="portfolio-project-hero">
        <div className="portfolio-project-hero-media"><img src={project.heroMedia.src} alt={project.heroMedia.alt} width={project.heroMedia.width} height={project.heroMedia.height} loading="eager" /></div>
        <div className="portfolio-project-hero-copy">
          <div className="portfolio-project-meta"><span>{labelForPortfolioValue(project.projectType)}</span>{project.yearCompleted && <span>{project.yearCompleted}</span>}</div>
          <h1>{project.title}</h1>
          {project.subtitle && <p className="portfolio-project-subtitle">{project.subtitle}</p>}
          <p>{project.projectSummary}</p>
          {disclosure && <span className="portfolio-disclosure">{disclosure}</span>}
        </div>
      </header>

      <section className="portfolio-contribution" aria-labelledby="portfolio-contribution-title"><p className="overline">Ethereal Armory contribution</p><h2 id="portfolio-contribution-title">What the studio created</h2><p>{project.contribution}</p></section>
      <PortfolioGallery media={project.gallery} eager />
      <ProjectOverview project={project} />
      <ProjectRoles project={project} />
      <NarrativeLists project={project} />
      <MediaSection title="Design development" overline="Design work" media={project.designImages} />
      <MediaSection title="Fabrication and finish details" overline="Working views" media={project.workingImages} />
      <MediaSection title="Concept development" overline="Early direction" media={project.conceptArt} />
      <MediaSection title="CAD and modeling" overline="Digital development" media={project.cadImages} />
      <MediaSection title="Renders" overline="Visualization" media={project.renders} />
      <ProcessTimeline stages={project.processStages} />
      <ProjectFacts project={project} />
      <ChallengeSolutionList challenges={project.challenges} solutions={project.solutions} />
      <PortfolioModelPreview model={project.model3d} poster={project.modelPoster} />

      <section className="portfolio-final-outcome" aria-labelledby="portfolio-outcome-title"><p className="overline">Final outcome</p><h2 id="portfolio-outcome-title">What the project demonstrated</h2><p>{project.finalOutcome}</p></section>
      {project.disclosureStatement && <section className="portfolio-lessons" aria-labelledby="portfolio-disclosure-title"><p className="overline">Project disclosure</p><h2 id="portfolio-disclosure-title">Creative attribution</h2><p>{project.disclosureStatement}</p></section>}
      {project.lessonsLearned && <section className="portfolio-lessons" aria-labelledby="portfolio-lessons-title"><p className="overline">Reflection</p><h2 id="portfolio-lessons-title">Lessons learned</h2><p>{project.lessonsLearned}</p></section>}
      <ExternalReferences references={project.externalReferences} />

      {inquiryHref && (
        <section className="portfolio-inquiry-cta"><div><p className="overline">Custom work</p><h2>Have a related idea?</h2><p>{project.inquiry.note || "The studio can discuss a new custom brief without implying that this project can be reproduced exactly."}</p></div><Link className="button button-primary" to={inquiryHref}>Discuss a custom build</Link></section>
      )}

      {related.length > 0 && (
        <section className="portfolio-related" aria-labelledby="portfolio-related-title"><div className="portfolio-section-heading"><p className="overline">Continue exploring</p><h2 id="portfolio-related-title">Related creative work</h2></div><div className="portfolio-editorial-grid">{related.map((candidate) => <PortfolioCard project={candidate} headingLevel={3} key={candidate.slug} />)}</div></section>
      )}
    </main>
  );
}
