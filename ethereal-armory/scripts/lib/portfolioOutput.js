import fs from "node:fs";
import path from "node:path";

export function prunePortfolioOutput(outputRoot, { issues = [], authoringFolders = [] }) {
  const resolvedOutputRoot = path.resolve(outputRoot);
  const folderNames = [
    ...authoringFolders,
    ...issues.map((issue) => issue.project),
  ];
  const removed = [];

  for (const folderName of folderNames) {
    const target = path.resolve(resolvedOutputRoot, folderName);
    if (!target.startsWith(`${resolvedOutputRoot}${path.sep}`)) {
      throw new Error(`Refused to prune unsafe Portfolio output path for "${folderName}".`);
    }
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      removed.push(folderName);
    }
  }

  return removed;
}
