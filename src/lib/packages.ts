export interface SkillPackage {
  id: string;
  name: string;
  description: string;
  category: "aec-bim" | "erp-business" | "web-dev" | "devops" | "cross-tech";
  skillCount: number;
  repo: string;
  status: "published" | "development" | "planned";
  tags: string[];
}

export const packages: SkillPackage[] = [
  // AEC/BIM
  {
    id: "blender-bonsai",
    name: "Blender-Bonsai-IfcOpenShell-Sverchok",
    description: "Blender, Bonsai BIM, IfcOpenShell API, Sverchok parametric design",
    category: "aec-bim",
    skillCount: 73,
    repo: "OpenAEC-Foundation/Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package",
    status: "published",
    tags: ["blender", "ifc", "bim", "bonsai", "sverchok"],
  },
  {
    id: "thatopen",
    name: "ThatOpen Engine",
    description: "web-ifc, Three.js BIM, That Open Engine, Lit UI components",
    category: "aec-bim",
    skillCount: 7,
    repo: "OpenAEC-Foundation/ThatOpenCompany",
    status: "development",
    tags: ["web-ifc", "threejs", "bim", "wasm"],
  },

  // ERP/Business
  {
    id: "erpnext",
    name: "ERPNext",
    description: "ERPNext/Frappe ERP development — doctypes, API, workflows",
    category: "erp-business",
    skillCount: 28,
    repo: "OpenAEC-Foundation/ERPNext_Anthropic_Claude_Development_Skill_Package",
    status: "published",
    tags: ["erpnext", "frappe", "erp", "python"],
  },
  {
    id: "nextcloud",
    name: "Nextcloud",
    description: "Nextcloud app development, API integration, Talk bots",
    category: "erp-business",
    skillCount: 24,
    repo: "OpenAEC-Foundation/Nextcloud-Claude-Skill-Package",
    status: "published",
    tags: ["nextcloud", "php", "collaboration"],
  },
  {
    id: "n8n",
    name: "n8n",
    description: "Workflow automation — custom nodes, credentials, expressions",
    category: "erp-business",
    skillCount: 21,
    repo: "OpenAEC-Foundation/n8n-Claude-Skill-Package",
    status: "published",
    tags: ["n8n", "workflow", "automation"],
  },

  // Web Development
  {
    id: "tauri-2",
    name: "Tauri 2",
    description: "Tauri 2.x desktop/mobile framework — commands, plugins, IPC",
    category: "web-dev",
    skillCount: 27,
    repo: "OpenAEC-Foundation/Tauri-2-Claude-Skill-Package",
    status: "published",
    tags: ["tauri", "rust", "desktop", "mobile"],
  },
  {
    id: "solidjs",
    name: "SolidJS",
    description: "SolidJS reactive UI — signals, stores, routing, SSR",
    category: "web-dev",
    skillCount: 24,
    repo: "OpenAEC-Foundation/SolidJS-Claude-Skill-Package",
    status: "published",
    tags: ["solidjs", "ui", "reactive", "frontend"],
  },
  {
    id: "react",
    name: "React",
    description: "React component library — hooks, patterns, testing",
    category: "web-dev",
    skillCount: 24,
    repo: "OpenAEC-Foundation/React-Claude-Skill-Package",
    status: "published",
    tags: ["react", "ui", "frontend"],
  },
  {
    id: "vite",
    name: "Vite",
    description: "Frontend build tool — config, plugins, SSR, library mode",
    category: "web-dev",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Vite-Claude-Skill-Package",
    status: "published",
    tags: ["vite", "build", "bundler"],
  },
  {
    id: "pdfjs",
    name: "PDF.js",
    description: "PDF viewer — rendering, text extraction, annotations",
    category: "web-dev",
    skillCount: 17,
    repo: "OpenAEC-Foundation/PDFjs-Claude-Skill-Package",
    status: "published",
    tags: ["pdf", "viewer", "mozilla"],
  },
  {
    id: "pdf-lib",
    name: "pdf-lib",
    description: "PDF creation/modification — forms, fonts, embedding",
    category: "web-dev",
    skillCount: 17,
    repo: "OpenAEC-Foundation/pdf-lib-Claude-Skill-Package",
    status: "published",
    tags: ["pdf", "creation", "manipulation"],
  },
  {
    id: "fluent-i18n",
    name: "Fluent i18n",
    description: "Mozilla Fluent internationalization — FTL, React/Solid bindings",
    category: "web-dev",
    skillCount: 15,
    repo: "OpenAEC-Foundation/Fluent-i18n-Claude-Skill-Package",
    status: "published",
    tags: ["i18n", "fluent", "localization"],
  },

  // DevOps
  {
    id: "docker",
    name: "Docker",
    description: "Docker containerization — Compose, multi-stage, networking",
    category: "devops",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Docker-Claude-Skill-Package",
    status: "published",
    tags: ["docker", "containers", "devops"],
  },
  {
    id: "drawio",
    name: "Draw.io",
    description: "Draw.io diagramming — mxGraph API, custom shapes, automation",
    category: "devops",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Draw.io-Claude-Skill-Package",
    status: "development",
    tags: ["drawio", "diagrams", "visualization"],
  },

  // Planned
  {
    id: "speckle",
    name: "Speckle",
    description: "Speckle data platform — connectors, viewer, GraphQL API",
    category: "aec-bim",
    skillCount: 25,
    repo: "",
    status: "planned",
    tags: ["speckle", "aec", "collaboration"],
  },
  {
    id: "qgis",
    name: "QGIS",
    description: "QGIS GIS platform — plugins, processing, PyQGIS",
    category: "aec-bim",
    skillCount: 20,
    repo: "",
    status: "planned",
    tags: ["qgis", "gis", "geospatial"],
  },
  {
    id: "threejs",
    name: "Three.js",
    description: "Three.js 3D web — scenes, materials, loaders, post-processing",
    category: "web-dev",
    skillCount: 20,
    repo: "",
    status: "planned",
    tags: ["threejs", "3d", "webgl", "visualization"],
  },
  {
    id: "cross-tech",
    name: "Cross-Tech AEC",
    description: "Cross-technology boundary rules — IPC, pipeline, sync patterns",
    category: "cross-tech",
    skillCount: 15,
    repo: "",
    status: "planned",
    tags: ["cross-tech", "integration", "boundary"],
  },
];

export const categoryLabels: Record<SkillPackage["category"], string> = {
  "aec-bim": "AEC / BIM",
  "erp-business": "ERP / Business",
  "web-dev": "Web Development",
  "devops": "DevOps / Tools",
  "cross-tech": "Cross-Tech",
};
