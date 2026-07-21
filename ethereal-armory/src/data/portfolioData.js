import HeroImage from "../assets/hero.png";

const portfolioItems = [
  {
    id: 1,
    title: "Celestial Mage Staff",
    category: "Original Custom Prop",
    cover: HeroImage,
    shortDescription:
      "A fantasy staff concept built around celestial shapes, clean assembly, and a display-ready finish.",
    fullDescription:
      "This custom build focused on turning a magical weapon idea into a physical collector piece. The shape language, printable sections, finishing plan, and display presence were all considered before fabrication.",
    brief:
      "Create an original fantasy staff that feels elegant, magical, and practical to print, finish, and assemble.",
    customWork: [
      "Original silhouette and decorative detailing",
      "Printable section planning for assembly",
      "Internal structure and display presentation",
      "Lighting placement research for future versions",
    ],
    outcome:
      "A polished fantasy prop direction with a clear build plan, strong visual identity, and room for lighting upgrades.",
    tools: ["Fusion 360", "3D Printing", "Assembly Planning", "LED Planning"],
    gallery: [HeroImage],
    process: [
      "Blocked out the overall silhouette and proportions first.",
      "Split the model into printable sections for easier sanding, painting, and transport.",
      "Refined the decorative shapes to support the celestial theme.",
      "Reviewed how the final prop would sit in-hand and on display.",
    ],
    sketches: [],
  },
  {
    id: 2,
    title: "Overwatch Blaster Replica",
    category: "Game-Inspired Replica",
    cover: "/brand-mark.svg",
    shortDescription:
      "A replica-style blaster project covering modeling, print prep, paint work, and lighting integration.",
    fullDescription:
      "This project was created as a polished display prop inspired by a game weapon. It required CAD planning, print splitting, surface prep, painting, and electronics planning so the final piece could feel more premium than a basic print.",
    brief:
      "Build a recognizable display blaster with clean proportions, finished surfaces, and integrated accent lighting.",
    customWork: [
      "CAD modeling and part separation",
      "Print orientation and cleanup planning",
      "Sanding, priming, painting, and detail finish",
      "LED and controller planning for the prop body",
    ],
    outcome:
      "A display-focused replica workflow that combines fabrication, finishing, and electronics into one custom project.",
    tools: ["Fusion 360", "3D Printing", "Painting", "LEDs", "ESP32"],
    gallery: ["/brand-mark.svg"],
    process: [
      "Modeled the major body pieces around the reference silhouette.",
      "Separated the design into easier-to-print and easier-to-finish parts.",
      "Finished and painted components before final assembly.",
      "Planned lighting placement so electronics supported the design instead of distracting from it.",
    ],
    sketches: [],
  },
];

export default portfolioItems;
