import fs from "node:fs";
import path from "node:path";
import { isPortfolioAuthoringFolder, validatePortfolioProjects } from "../../src/lib/portfolio.js";

export const PORTFOLIO_IMAGE_EXTENSIONS = Object.freeze([".avif", ".jpeg", ".jpg", ".png", ".webp"]);
export const PORTFOLIO_MEDIA_GROUPS = Object.freeze(["final", "working", "design"]);
export const PORTFOLIO_PERMISSION_STATUSES = Object.freeze(["confirmed", "not-required"]);

const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9._-]*$/;
export const PORTFOLIO_PROJECT_JSON_FIELDS = Object.freeze([
  "slug", "title", "projectType", "category", "creativeOrigin", "status", "clientDisclosure",
  "projectSummary", "contribution", "finalOutcome", "seo", "subtitle", "featured", "yearCompleted",
  "developmentStage", "commercialHistory", "clientType", "clientName", "clientBrief", "inspiration",
  "originalConcept", "projectOverview", "designRole", "fabricationRole", "designGoals",
  "designConstraints", "creativeDecisions", "challenges", "solutions", "software", "materials",
  "printers", "tools", "printMethods", "fabricationMethods", "finishingMethods", "electronics",
  "dimensions", "buildTime", "processStages", "lessonsLearned", "disclosureStatement", "model3d",
  "modelPoster", "testimonialReference", "inquiry", "externalReferences", "tags", "credits",
  "contentWarnings", "hero", "imageOrder", "media",
]);
const PROJECT_JSON_FIELDS = new Set(PORTFOLIO_PROJECT_JSON_FIELDS);

function stableFileSort(left, right) {
  const normalizedLeft = left.toLowerCase();
  const normalizedRight = right.toLowerCase();
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

export function readImageDimensions(buffer, extension) {
  const normalizedExtension = extension.toLowerCase();

  if (normalizedExtension === ".png" && buffer.length >= 24 && buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if ([".jpg", ".jpeg"].includes(normalizedExtension) && buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 8 < buffer.length) {
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if (startOfFrameMarkers.has(marker)) {
        return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3) };
      }
      offset += length;
    }
  }

  if (normalizedExtension === ".webp" && buffer.length >= 30 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") return { width: readUInt24LE(buffer, 24) + 1, height: readUInt24LE(buffer, 27) + 1 };
    if (chunk === "VP8 " && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L" && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  if (normalizedExtension === ".avif") {
    const marker = Buffer.from("ispe");
    const index = buffer.indexOf(marker);
    if (index >= 4 && index + 16 <= buffer.length) {
      return { width: buffer.readUInt32BE(index + 8), height: buffer.readUInt32BE(index + 12) };
    }
  }

  throw new Error(`could not read intrinsic dimensions from a supported ${normalizedExtension} image`);
}

function discoverImageNames(groupPath) {
  if (!fs.existsSync(groupPath)) return [];
  if (!fs.statSync(groupPath).isDirectory()) throw new Error("must be a directory");
  return fs.readdirSync(groupPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && PORTFOLIO_IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort(stableFileSort);
}

function orderedImageNames(names, configuredOrder, group) {
  if (configuredOrder == null) return names;
  if (!Array.isArray(configuredOrder)) throw new Error(`imageOrder.${group} must be an array when provided`);

  const seen = new Set();
  for (const name of configuredOrder) {
    if (typeof name !== "string" || !name.trim()) throw new Error(`imageOrder.${group} entries must be non-empty filenames`);
    if (!names.includes(name)) throw new Error(`imageOrder.${group} references missing or unsupported image "${name}"`);
    if (seen.has(name)) throw new Error(`imageOrder.${group} contains duplicate image "${name}"`);
    seen.add(name);
  }
  return [...configuredOrder, ...names.filter((name) => !seen.has(name))];
}

function defaultAlt(title, group, index) {
  const groupLabel = group === "final" ? "final project" : group === "working" ? "working process" : "design development";
  return `${title} — ${groupLabel} image ${index + 1}`;
}

function buildMediaRecord({ projectRoot, slug, title, group, name, index, metadata }) {
  if (!SAFE_FILE_NAME.test(name)) throw new Error(`${group}/${name}: filename must use lowercase URL-safe characters without spaces`);
  if (metadata != null && (!metadata || typeof metadata !== "object" || Array.isArray(metadata))) {
    throw new Error(`${group}/${name}: media metadata must be an object`);
  }

  const alt = metadata?.alt ?? defaultAlt(title, group, index);
  if (typeof alt !== "string" || !alt.trim()) throw new Error(`${group}/${name}.alt must be a non-empty string when provided`);
  for (const field of ["caption", "credit"]) {
    if (metadata?.[field] != null && (typeof metadata[field] !== "string" || !metadata[field].trim())) {
      throw new Error(`${group}/${name}.${field} must be a non-empty string when provided`);
    }
  }
  if (metadata?.permissionStatus != null && !PORTFOLIO_PERMISSION_STATUSES.includes(metadata.permissionStatus)) {
    throw new Error(`${group}/${name}.permissionStatus must be "confirmed" or "not-required"`);
  }

  const extension = path.extname(name).toLowerCase();
  const dimensions = readImageDimensions(fs.readFileSync(path.join(projectRoot, group, name)), extension);
  if (!dimensions.width || !dimensions.height) throw new Error(`${group}/${name}: image dimensions must be positive`);

  return {
    src: `/portfolio/${slug}/${group}/${name}`,
    alt: alt.trim(),
    width: dimensions.width,
    height: dimensions.height,
    type: group === "working" ? "process" : "image",
    ...(metadata?.caption ? { caption: metadata.caption.trim() } : {}),
    ...(metadata?.credit ? { credit: metadata.credit.trim() } : {}),
    ...(metadata?.permissionStatus ? { permissionStatus: metadata.permissionStatus } : {}),
  };
}

function readProject(projectRoot, folderName) {
  const jsonPath = path.join(projectRoot, "project.json");
  if (!fs.existsSync(jsonPath)) throw new Error("project.json is required");

  let config;
  try {
    config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (error) {
    throw new Error(`project.json is malformed: ${error.message}`);
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("project.json must contain one project object");
  const unknownFields = Object.keys(config).filter((field) => !PROJECT_JSON_FIELDS.has(field));
  if (unknownFields.length) throw new Error(`project.json contains unsupported field${unknownFields.length === 1 ? "" : "s"}: ${unknownFields.join(", ")}`);
  if (config.slug !== folderName) throw new Error(`project.json slug "${config.slug ?? ""}" must match folder "${folderName}"`);
  if (config.heroMedia != null || config.gallery != null) throw new Error("heroMedia and gallery are generated from project folders and must not be listed manually");
  if (config.imageOrder != null && (!config.imageOrder || typeof config.imageOrder !== "object" || Array.isArray(config.imageOrder))) {
    throw new Error("imageOrder must be an object keyed by final, working, or design");
  }
  const unknownOrderGroups = Object.keys(config.imageOrder || {}).filter((group) => !PORTFOLIO_MEDIA_GROUPS.includes(group));
  if (unknownOrderGroups.length) throw new Error(`imageOrder contains unsupported group${unknownOrderGroups.length === 1 ? "" : "s"}: ${unknownOrderGroups.join(", ")}`);
  if (config.media != null && (!config.media || typeof config.media !== "object" || Array.isArray(config.media))) {
    throw new Error("media must be an object keyed by folder/filename");
  }

  const groups = {};
  for (const group of PORTFOLIO_MEDIA_GROUPS) {
    const names = discoverImageNames(path.join(projectRoot, group));
    if (group === "final" && names.length === 0) throw new Error("final/ must contain at least one supported AVIF, JPEG, PNG, or WebP image");
    groups[group] = orderedImageNames(names, config.imageOrder?.[group], group).map((name, index) => {
      const key = `${group}/${name}`;
      return buildMediaRecord({ projectRoot, slug: config.slug, title: config.title, group, name, index, metadata: config.media?.[key] });
    });
  }

  const discoveredPaths = new Set(PORTFOLIO_MEDIA_GROUPS.flatMap((group) => groups[group].map((item) => item.src.replace(`/portfolio/${config.slug}/`, ""))));
  for (const key of Object.keys(config.media || {})) {
    if (!discoveredPaths.has(key)) throw new Error(`media metadata references missing or unsupported image "${key}"`);
  }

  const heroPath = config.hero ?? groups.final[0].src.replace(`/portfolio/${config.slug}/`, "");
  if (typeof heroPath !== "string" || !heroPath.startsWith("final/")) throw new Error("hero must reference an image inside final/");
  const heroMedia = groups.final.find((item) => item.src === `/portfolio/${config.slug}/${heroPath}`);
  if (!heroMedia) throw new Error(`hero references missing or unsupported image "${heroPath}"`);

  const content = { ...config };
  delete content.hero;
  delete content.imageOrder;
  delete content.media;
  const project = {
    ...content,
    heroMedia,
    gallery: groups.final,
    ...(groups.working.length ? { workingImages: groups.working } : {}),
    ...(groups.design.length ? { designImages: groups.design } : {}),
    seo: {
      ...config.seo,
      image: config.seo?.image || heroMedia.src,
    },
  };
  validatePortfolioProjects([project]);
  return project;
}

export function buildPortfolioManifest(portfolioRoot) {
  if (!fs.existsSync(portfolioRoot)) return { projects: [], issues: [], authoringFolders: [] };
  const allFolders = fs.readdirSync(portfolioRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(stableFileSort);
  const authoringFolders = allFolders.filter(isPortfolioAuthoringFolder);
  const projectFolders = allFolders.filter((folderName) => !isPortfolioAuthoringFolder(folderName));
  const projects = [];
  const issues = [];

  for (const folderName of projectFolders) {
    try {
      projects.push(readProject(path.join(portfolioRoot, folderName), folderName));
    } catch (error) {
      issues.push({ project: folderName, message: error.message });
    }
  }

  validatePortfolioProjects(projects);
  return { projects, issues, authoringFolders };
}
