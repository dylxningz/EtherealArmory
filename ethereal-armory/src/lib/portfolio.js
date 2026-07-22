export const PROJECT_TYPES = Object.freeze([
  "client-commission",
  "personal-project",
  "studio-original",
  "research-and-development",
  "production-archive",
]);

export const PROJECT_CATEGORIES = Object.freeze([
  "handheld-prop",
  "display-piece",
  "wearable-cosplay",
  "miniature",
  "sculpture",
  "illuminated-electronics",
  "accessory",
  "environmental-display",
  "digital-concept",
  "other",
]);

export const CREATIVE_ORIGINS = Object.freeze([
  "original",
  "fan-inspired",
  "client-supplied-concept",
  "reinterpretation",
]);

export const DEVELOPMENT_STAGES = Object.freeze(["concept", "prototype", "final", "experimental"]);
export const PROJECT_STATUSES = Object.freeze(["completed", "in-development", "paused", "archived", "retired"]);
export const COMMERCIAL_HISTORIES = Object.freeze([
  "not-applicable",
  "never-sold",
  "one-off-client-work",
  "formerly-sold",
  "discontinued",
  "unreleased",
]);
export const CLIENT_DISCLOSURES = Object.freeze([
  "studio-owned",
  "named-with-permission",
  "anonymous-with-permission",
  "partial-disclosure",
  "not-applicable",
]);
export const INQUIRY_MODES = Object.freeze([
  "none",
  "general-custom-work",
  "related-custom-work",
  "category-open",
]);

const MEDIA_TYPES = Object.freeze(["image", "render", "cad", "process", "video", "model-poster"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_PATTERN = /^https:\/\//i;
const LOCAL_PATH_PATTERN = /^\/(?!\/)[a-z0-9][a-z0-9/_.-]*$/i;

const LABELS = Object.freeze({
  "client-commission": "Client commission",
  "personal-project": "Personal project",
  "studio-original": "Studio original",
  "research-and-development": "Research & development",
  "production-archive": "Production archive",
  "handheld-prop": "Handheld prop",
  "display-piece": "Display piece",
  "wearable-cosplay": "Wearable / cosplay",
  miniature: "Miniature",
  sculpture: "Sculpture",
  "illuminated-electronics": "Illuminated / electronics",
  accessory: "Accessory",
  "environmental-display": "Environmental display",
  "digital-concept": "Digital concept",
  other: "Other",
  concept: "Concept",
  prototype: "Prototype",
  final: "Final build",
  experimental: "Experimental",
  completed: "Completed",
  "in-development": "In development",
  paused: "Paused",
  archived: "Archived work",
  retired: "Retired work",
  "anonymous-with-permission": "Private client commission",
  "partial-disclosure": "Limited client disclosure",
  "studio-owned": "Original study",
});

export class PortfolioValidationError extends Error {
  constructor(messages) {
    super(`Portfolio validation failed:\n${messages.map((message) => `- ${message}`).join("\n")}`);
    this.name = "PortfolioValidationError";
    this.messages = messages;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function projectName(project, index) {
  return project?.slug || project?.title || `project at index ${index}`;
}

function addRequiredString(errors, project, index, field) {
  if (typeof project?.[field] !== "string" || !project[field].trim()) {
    errors.push(`${projectName(project, index)}.${field}: must be a non-empty string.`);
  }
}

function addOptionalString(errors, project, index, field) {
  const value = project?.[field];
  if (value != null && (typeof value !== "string" || !value.trim())) {
    errors.push(`${projectName(project, index)}.${field}: must be a non-empty string when provided.`);
  }
}

function addTaxonomy(errors, project, index, field, values, required = false) {
  const value = project?.[field];
  if (value == null && !required) return;
  if (!values.includes(value)) {
    errors.push(`${projectName(project, index)}.${field}: "${value}" is not an allowed value.`);
  }
}

export function isSafePortfolioPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (URL_PATTERN.test(value)) {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }
  return LOCAL_PATH_PATTERN.test(value) && !value.includes("..") && !value.includes("\\");
}

function validateSources(sources, field, errors) {
  if (sources == null) return;
  if (!Array.isArray(sources) || !sources.length) {
    errors.push(`${field}.sources: must be a non-empty array when provided.`);
    return;
  }
  const widths = new Set();
  sources.forEach((source, index) => {
    const sourceField = `${field}.sources[${index}]`;
    if (!isObject(source) || !isSafePortfolioPath(source.src)) errors.push(`${sourceField}.src: must be an HTTPS URL or root-relative path.`);
    if (!Number.isInteger(source.width) || source.width <= 0) errors.push(`${sourceField}.width: must be a positive integer.`);
    if (widths.has(source.width)) errors.push(`${sourceField}.width: duplicate responsive width ${source.width}.`);
    widths.add(source.width);
  });
}

export function validateMediaRecord(media, field = "media") {
  const errors = [];
  if (!isObject(media)) return [`${field}: must be an object.`];
  if (!isSafePortfolioPath(media.src)) errors.push(`${field}.src: must be an HTTPS URL or root-relative path.`);
  if (typeof media.alt !== "string" || !media.alt.trim()) errors.push(`${field}.alt: meaningful alt text is required.`);
  if (!Number.isInteger(media.width) || media.width <= 0) errors.push(`${field}.width: must be a positive integer.`);
  if (!Number.isInteger(media.height) || media.height <= 0) errors.push(`${field}.height: must be a positive integer.`);
  if (media.type != null && !MEDIA_TYPES.includes(media.type)) errors.push(`${field}.type: "${media.type}" is not supported.`);
  for (const key of ["caption", "credit"]) {
    if (media[key] != null && (typeof media[key] !== "string" || !media[key].trim())) errors.push(`${field}.${key}: must be a non-empty string when provided.`);
  }
  validateSources(media.sources, field, errors);
  return errors;
}

function validateStringArray(value, field, errors) {
  if (value == null) return;
  if (!Array.isArray(value)) {
    errors.push(`${field}: must be an array.`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) errors.push(`${field}[${index}]: must be a non-empty string.`);
  });
}

function validateMediaArray(value, field, errors, required = false) {
  if (!Array.isArray(value) || (required && !value.length)) {
    errors.push(`${field}: must contain at least one media record.`);
    return;
  }
  value.forEach((media, index) => errors.push(...validateMediaRecord(media, `${field}[${index}]`)));
}

function validateProcessStages(value, field, errors) {
  if (value == null) return;
  if (!Array.isArray(value)) {
    errors.push(`${field}: must be an array.`);
    return;
  }
  value.forEach((stage, index) => {
    const stageField = `${field}[${index}]`;
    if (!isObject(stage)) {
      errors.push(`${stageField}: must be an object.`);
      return;
    }
    if (typeof stage.title !== "string" || !stage.title.trim()) errors.push(`${stageField}.title: is required.`);
    if (typeof stage.description !== "string" || !stage.description.trim()) errors.push(`${stageField}.description: is required.`);
    if (stage.media != null) validateMediaArray(stage.media, `${stageField}.media`, errors);
  });
}

function validateInquiry(value, project, index, errors) {
  if (value == null) return;
  const field = `${projectName(project, index)}.inquiry`;
  if (!isObject(value)) {
    errors.push(`${field}: must be an object.`);
    return;
  }
  if (!INQUIRY_MODES.includes(value.mode)) errors.push(`${field}.mode: "${value.mode}" is not an allowed value.`);
  if (value.category != null && (typeof value.category !== "string" || !value.category.trim())) errors.push(`${field}.category: must be a non-empty string or null.`);
  if (value.note != null && (typeof value.note !== "string" || !value.note.trim())) errors.push(`${field}.note: must be a non-empty string or null.`);
  if (value.mode === "category-open" && !value.category?.trim()) errors.push(`${field}.category: is required when mode is category-open.`);
}

function validateTestimonial(value, project, index, errors) {
  if (value == null) return;
  const field = `${projectName(project, index)}.testimonialReference`;
  if (!isObject(value)) {
    errors.push(`${field}: must be an object.`);
    return;
  }
  if (typeof value.provider !== "string" || !value.provider.trim()) errors.push(`${field}.provider: is required.`);
  if (typeof value.id !== "string" || !value.id.trim()) errors.push(`${field}.id: is required.`);
  if (value.permissionConfirmed !== true) errors.push(`${field}.permissionConfirmed: must be true before publication.`);
}

function validateModel(project, index, errors) {
  const name = projectName(project, index);
  if (project.modelPoster != null && project.model3d == null) errors.push(`${name}.modelPoster: cannot be provided without model3d.`);
  if (project.model3d == null) return;
  if (!isObject(project.model3d)) {
    errors.push(`${name}.model3d: must be an object.`);
    return;
  }
  if (!isSafePortfolioPath(project.model3d.src) || !/\.glb(?:$|\?)/i.test(project.model3d.src)) errors.push(`${name}.model3d.src: must be a safe .glb path or HTTPS URL.`);
  if (typeof project.model3d.alt !== "string" || !project.model3d.alt.trim()) errors.push(`${name}.model3d.alt: an accessible description is required.`);
  if (project.modelPoster == null) errors.push(`${name}.modelPoster: is required when model3d is provided.`);
  else errors.push(...validateMediaRecord(project.modelPoster, `${name}.modelPoster`));
}

function validateSeo(project, index, errors) {
  const field = `${projectName(project, index)}.seo`;
  if (!isObject(project.seo)) {
    errors.push(`${field}: must be an object.`);
    return;
  }
  if (typeof project.seo.title !== "string" || !project.seo.title.trim() || project.seo.title.length > 70) errors.push(`${field}.title: must be 1-70 characters.`);
  if (typeof project.seo.description !== "string" || !project.seo.description.trim() || project.seo.description.length > 200) errors.push(`${field}.description: must be 1-200 characters.`);
  if (project.seo.image != null && !isSafePortfolioPath(project.seo.image)) errors.push(`${field}.image: must be an HTTPS URL or root-relative path.`);
}

function validateExternalReferences(value, project, index, errors) {
  if (value == null) return;
  const field = `${projectName(project, index)}.externalReferences`;
  if (!isObject(value)) {
    errors.push(`${field}: must be an object.`);
    return;
  }
  for (const [key, reference] of Object.entries(value)) {
    if (reference == null) continue;
    if (!isObject(reference)) {
      errors.push(`${field}.${key}: must be an object or null.`);
      continue;
    }
    if (reference.url != null && !isSafePortfolioPath(reference.url)) errors.push(`${field}.${key}.url: must be an HTTPS URL or root-relative path.`);
    if (reference.handle != null && (typeof reference.handle !== "string" || !SLUG_PATTERN.test(reference.handle))) errors.push(`${field}.${key}.handle: must be a lowercase kebab-case handle.`);
  }
}

export function validatePortfolioProjects(projects) {
  if (!Array.isArray(projects)) throw new PortfolioValidationError(["registry: must be an array."]);
  const errors = [];
  const slugs = new Set();

  projects.forEach((project, index) => {
    const name = projectName(project, index);
    if (!isObject(project)) {
      errors.push(`${name}: must be an object.`);
      return;
    }
    for (const field of ["slug", "title", "projectSummary", "contribution", "finalOutcome"]) addRequiredString(errors, project, index, field);
    for (const field of ["subtitle", "clientType", "clientName", "clientBrief", "inspiration", "originalConcept", "projectOverview", "electronics", "dimensions", "buildTime", "lessonsLearned", "contentWarnings"]) addOptionalString(errors, project, index, field);

    if (typeof project.slug === "string") {
      if (!SLUG_PATTERN.test(project.slug)) errors.push(`${name}.slug: must use lowercase kebab-case.`);
      if (slugs.has(project.slug)) errors.push(`${name}.slug: duplicate slug "${project.slug}".`);
      slugs.add(project.slug);
    }

    addTaxonomy(errors, project, index, "projectType", PROJECT_TYPES, true);
    addTaxonomy(errors, project, index, "category", PROJECT_CATEGORIES, true);
    addTaxonomy(errors, project, index, "creativeOrigin", CREATIVE_ORIGINS, true);
    addTaxonomy(errors, project, index, "status", PROJECT_STATUSES, true);
    addTaxonomy(errors, project, index, "clientDisclosure", CLIENT_DISCLOSURES, true);
    addTaxonomy(errors, project, index, "developmentStage", DEVELOPMENT_STAGES);
    addTaxonomy(errors, project, index, "commercialHistory", COMMERCIAL_HISTORIES);

    if (project.yearCompleted != null && (!Number.isInteger(project.yearCompleted) || project.yearCompleted < 1900 || project.yearCompleted > 2100)) errors.push(`${name}.yearCompleted: must be a four-digit year between 1900 and 2100.`);
    if (project.featured != null && typeof project.featured !== "boolean") errors.push(`${name}.featured: must be a boolean.`);
    if (project.clientName && project.clientDisclosure !== "named-with-permission") errors.push(`${name}.clientName: may only be present with named-with-permission disclosure.`);
    if (project.clientDisclosure === "named-with-permission" && !project.clientName?.trim()) errors.push(`${name}.clientName: is required with named-with-permission disclosure.`);

    errors.push(...validateMediaRecord(project.heroMedia, `${name}.heroMedia`));
    validateMediaArray(project.gallery, `${name}.gallery`, errors, true);
    for (const field of ["conceptArt", "cadImages", "renders", "videos"]) {
      if (project[field] != null) validateMediaArray(project[field], `${name}.${field}`, errors);
    }
    for (const field of ["designRole", "fabricationRole", "designGoals", "designConstraints", "creativeDecisions", "challenges", "solutions", "software", "materials", "printers", "tools", "printMethods", "fabricationMethods", "finishingMethods", "tags", "credits"]) {
      validateStringArray(project[field], `${name}.${field}`, errors);
    }
    validateProcessStages(project.processStages, `${name}.processStages`, errors);
    validateInquiry(project.inquiry, project, index, errors);
    validateTestimonial(project.testimonialReference, project, index, errors);
    validateExternalReferences(project.externalReferences, project, index, errors);
    validateModel(project, index, errors);
    validateSeo(project, index, errors);
  });

  if (errors.length) throw new PortfolioValidationError(errors);
  return projects;
}

export function createPortfolioRegistry(projects) {
  try {
    return { projects: validatePortfolioProjects(projects), error: null };
  } catch (error) {
    if (!(error instanceof PortfolioValidationError)) throw error;
    return { projects: [], error };
  }
}

export function getPortfolioProject(projects, slug) {
  return projects.find((project) => project.slug === slug) || null;
}

export function labelForPortfolioValue(value) {
  return LABELS[value] || String(value || "").replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function disclosureLabel(project) {
  if (project.clientDisclosure === "anonymous-with-permission") return "Private client commission";
  if (project.clientDisclosure === "partial-disclosure") return "Limited client disclosure";
  if (project.developmentStage === "prototype") return "Prototype";
  if (["archived", "retired"].includes(project.status)) return labelForPortfolioValue(project.status);
  if (project.projectType === "studio-original" || project.clientDisclosure === "studio-owned") return "Original study";
  return null;
}

export function buildMediaSrcSet(media) {
  if (!media?.sources?.length) return undefined;
  return [...media.sources].sort((left, right) => left.width - right.width).map((source) => `${source.src} ${source.width}w`).join(", ");
}

export function buildInquiryHref(project) {
  if (!project?.inquiry || project.inquiry.mode === "none") return null;
  const params = new URLSearchParams({ source: "portfolio", project: project.slug });
  if (project.inquiry.category) params.set("category", project.inquiry.category);
  return `/contact?${params.toString()}`;
}
