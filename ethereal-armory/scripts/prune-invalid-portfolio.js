import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPortfolioManifest } from "./lib/portfolioManifest.js";
import { prunePortfolioOutput } from "./lib/portfolioOutput.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portfolioRoot = path.join(repositoryRoot, "public", "portfolio");
const outputRoot = path.resolve(repositoryRoot, "dist", "portfolio");
const { issues, authoringFolders } = buildPortfolioManifest(portfolioRoot);

prunePortfolioOutput(outputRoot, { issues, authoringFolders });

console.log(
  `[portfolio] Pruned ${authoringFolders.length} authoring-only and ${issues.length} invalid project folder${authoringFolders.length + issues.length === 1 ? "" : "s"} from the build output.`,
);
