import PortfolioGallery from "./PortfolioGallery";
import { labelForPortfolioValue } from "../lib/portfolio";

export function ProjectOverview({ project }) {
  if (!project.projectOverview && !project.clientBrief && !project.originalConcept) return null;
  return (
    <section className="portfolio-story-grid" aria-label="Project context">
      {project.projectOverview && <div><p className="overline">Project overview</p><h2>The work</h2><p>{project.projectOverview}</p></div>}
      {project.clientBrief && <div><p className="overline">Client brief</p><h2>What was requested</h2><p>{project.clientBrief}</p></div>}
      {project.originalConcept && <div><p className="overline">Original concept</p><h2>What was imagined</h2><p>{project.originalConcept}</p></div>}
    </section>
  );
}

export function ProjectRoles({ project }) {
  if (!project.designRole?.length && !project.fabricationRole?.length) return null;
  return (
    <section className="portfolio-roles" aria-labelledby="project-roles-title">
      <div className="portfolio-section-heading"><p className="overline">Studio contribution</p><h2 id="project-roles-title">Design and fabrication roles</h2></div>
      <div className="portfolio-role-grid">
        {project.designRole?.length > 0 && <div><h3>Design</h3><ul>{project.designRole.map((role) => <li key={role}>{role}</li>)}</ul></div>}
        {project.fabricationRole?.length > 0 && <div><h3>Fabrication</h3><ul>{project.fabricationRole.map((role) => <li key={role}>{role}</li>)}</ul></div>}
      </div>
    </section>
  );
}

export function ProjectFacts({ project }) {
  const facts = [
    ["Development", project.developmentStage && labelForPortfolioValue(project.developmentStage)],
    ["Software", project.software?.join(", ")],
    ["Materials", project.materials?.join(", ")],
    ["Tools", project.tools?.join(", ")],
    ["Print methods", project.printMethods?.join(", ")],
    ["Fabrication", project.fabricationMethods?.join(", ")],
    ["Finishing", project.finishingMethods?.join(", ")],
    ["Electronics", project.electronics],
    ["Dimensions", project.dimensions],
    ["Build time", project.buildTime],
  ].filter(([, value]) => value);
  if (!facts.length) return null;
  return (
    <section className="portfolio-facts" aria-labelledby="project-facts-title">
      <div className="portfolio-section-heading"><p className="overline">Build facts</p><h2 id="project-facts-title">Tools and methods</h2></div>
      <dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  );
}

export function NarrativeLists({ project }) {
  const lists = [
    ["Design goals", project.designGoals],
    ["Constraints", project.designConstraints],
    ["Creative decisions", project.creativeDecisions],
  ].filter(([, values]) => values?.length);
  if (!lists.length) return null;
  return <section className="portfolio-narrative-lists" aria-label="Design direction">{lists.map(([title, values]) => <div key={title}><h2>{title}</h2><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>)}</section>;
}

export function ProcessTimeline({ stages }) {
  if (!stages?.length) return null;
  return (
    <section className="portfolio-process" aria-labelledby="portfolio-process-title">
      <div className="portfolio-section-heading"><p className="overline">Evolution</p><h2 id="portfolio-process-title">Process timeline</h2></div>
      <ol>{stages.map((stage, index) => <li key={`${stage.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{stage.title}</h3><p>{stage.description}</p>{stage.media?.length > 0 && <PortfolioGallery media={stage.media} title={`${stage.title} media`} overline="Process media" />}</div></li>)}</ol>
    </section>
  );
}

export function ChallengeSolutionList({ challenges, solutions }) {
  if (!challenges?.length && !solutions?.length) return null;
  const length = Math.max(challenges?.length || 0, solutions?.length || 0);
  return (
    <section className="portfolio-challenges" aria-labelledby="portfolio-challenges-title">
      <div className="portfolio-section-heading"><p className="overline">Problem solving</p><h2 id="portfolio-challenges-title">Challenges and solutions</h2></div>
      <div>{Array.from({ length }, (_, index) => <article key={index}>{challenges?.[index] && <div><h3>Challenge</h3><p>{challenges[index]}</p></div>}{solutions?.[index] && <div><h3>Solution</h3><p>{solutions[index]}</p></div>}</article>)}</div>
    </section>
  );
}

export function MediaSection({ title, overline, media }) {
  if (!media?.length) return null;
  return <div className="portfolio-media-section"><PortfolioGallery media={media} title={title} overline={overline} /></div>;
}
