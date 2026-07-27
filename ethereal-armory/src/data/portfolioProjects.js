import { createPortfolioRegistry } from "../lib/portfolio.js";
import { portfolioProjects as generatedPortfolioProjects } from "./portfolioManifest.generated.js";

// Production content is generated from public/portfolio/*/project.json and media folders.
export const portfolioProjects = generatedPortfolioProjects;
export const portfolioRegistry = createPortfolioRegistry(portfolioProjects);

export function getPortfolioRegistry() {
  const canUseTestFixture = import.meta.env?.DEV
    && typeof window !== "undefined"
    && ["127.0.0.1", "localhost"].includes(window.location.hostname)
    && Array.isArray(window.__EA_PORTFOLIO_TEST_PROJECTS__);

  return canUseTestFixture
    ? createPortfolioRegistry(window.__EA_PORTFOLIO_TEST_PROJECTS__)
    : portfolioRegistry;
}
