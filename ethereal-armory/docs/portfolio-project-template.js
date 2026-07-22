// Documentation template only. Copy the object into src/data/portfolioProjects.js,
// replace every placeholder with verified content, and delete unused optional fields.
const portfolioProjectTemplate = {
  // Required: lowercase kebab-case and unique.
  slug: "project-slug",
  title: "Verified project title",
  projectType: "client-commission",
  category: "handheld-prop",
  creativeOrigin: "original",
  status: "completed",
  clientDisclosure: "anonymous-with-permission",
  projectSummary: "Concise verified summary of the creative work.",
  contribution: "Clear statement of what Ethereal Armory designed or fabricated.",
  finalOutcome: "Verified result and what the work demonstrated.",
  heroMedia: {
    src: "/portfolio/project-slug/final/hero-1600-v1.webp",
    alt: "Meaningful description of the approved hero image",
    width: 1600,
    height: 1200,
    type: "image",
    caption: null,
    credit: "Ethereal Armory",
    sources: null,
  },
  gallery: [
    {
      src: "/portfolio/project-slug/final/final-view-1600-v1.webp",
      alt: "Meaningful description of an approved final image",
      width: 1600,
      height: 1200,
      type: "image",
      caption: null,
      credit: "Ethereal Armory",
      sources: null,
    },
  ],
  seo: {
    title: "Verified project SEO title",
    description: "Verified project description for search and social sharing.",
    image: "/portfolio/project-slug/final/hero-1600-v1.webp",
  },

  // Recommended. Delete values that cannot be verified.
  subtitle: null,
  featured: false,
  yearCompleted: null,
  developmentStage: "final",
  commercialHistory: "not-applicable",
  projectOverview: null,
  designRole: [],
  fabricationRole: [],
  designGoals: [],
  designConstraints: [],
  creativeDecisions: [],
  challenges: [],
  solutions: [],
  software: [],
  materials: [],
  tools: [],
  tags: [],
  credits: [],

  // Client fields are optional. clientName is allowed only with
  // named-with-permission disclosure.
  clientType: null,
  clientName: null,
  clientBrief: null,
  inspiration: null,
  originalConcept: null,

  // Fabrication and process fields are optional.
  printers: [],
  printMethods: [],
  fabricationMethods: [],
  finishingMethods: [],
  electronics: null,
  dimensions: null,
  buildTime: null,
  lessonsLearned: null,
  processStages: [],

  // Optional media sections. Omit sections with no approved media.
  conceptArt: [],
  cadImages: [],
  renders: [],
  videos: [],

  // Optional future model. modelPoster is required when model3d is present.
  model3d: null,
  modelPoster: null,

  // Optional exact-project testimonial reference. Never attach a visually
  // similar product review. Permission must be confirmed.
  testimonialReference: null,
  // Example shape:
  // testimonialReference: {
  //   provider: "judge-me",
  //   id: "stable-provider-id",
  //   permissionConfirmed: true,
  // },

  // Inquiry defaults to none. Enabling it does not imply exact reproduction.
  inquiry: {
    mode: "none",
    category: null,
    note: null,
  },

  // All commerce and archive relationships remain optional.
  externalReferences: {
    shopifyProduct: null,
    etsyArchive: null,
  },
  contentWarnings: null,
};

export default portfolioProjectTemplate;
