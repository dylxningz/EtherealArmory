import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPortfolioManifest } from "./lib/portfolioManifest.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portfolioRoot = path.join(repositoryRoot, "public", "portfolio");
const outputRoot = path.resolve(repositoryRoot, "dist", "portfolio");
const { issues } = buildPortfolioManifest(portfolioRoot);

for (const issue of issues) {
  const target = path.resolve(outputRoot, issue.project);
  if (!target.startsWith(`${outputRoot}${path.sep}`)) {
    throw new Error(`Refused to prune unsafe Portfolio output path for "${issue.project}".`);
  }
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

console.log(`[portfolio] Pruned ${issues.length} invalid project folder${issues.length === 1 ? "" : "s"} from the build output.`);
