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
    description: "73 deterministic Claude AI skills for Blender, Bonsai, IfcOpenShell & Sverchok — AEC Python development",
    category: "aec-bim",
    skillCount: 73,
    repo: "OpenAEC-Foundation/Blender-Bonsai-ifcOpenshell-Sverchok-Claude-Skill-Package",
    status: "published",
    tags: ["blender", "ifc", "bim", "bonsai", "sverchok", "python"],
  },
  {
    id: "thatopen",
    name: "ThatOpen Engine",
    description: "Production-ready Claude Code skills for ThatOpen Engine 3.3.x — 18 skills for building web-based BIM applications",
    category: "aec-bim",
    skillCount: 18,
    repo: "OpenAEC-Foundation/ThatOpen-Claude-Skill-Package",
    status: "published",
    tags: ["thatopen", "web-ifc", "threejs", "bim", "ifc"],
  },
  {
    id: "speckle",
    name: "Speckle",
    description: "25 deterministic Claude AI skills for Speckle Data Platform — object model, GraphQL API, Python/C# SDKs, connectors",
    category: "aec-bim",
    skillCount: 25,
    repo: "OpenAEC-Foundation/Speckle-Claude-Skill-Package",
    status: "published",
    tags: ["speckle", "aec", "bim", "graphql", "connectors"],
  },
  {
    id: "qgis",
    name: "QGIS",
    description: "19 deterministic Claude Code skills for QGIS/PyQGIS spatial analysis, map creation, geoprocessing, and plugin development",
    category: "aec-bim",
    skillCount: 19,
    repo: "OpenAEC-Foundation/QGIS-Claude-Skill-Package",
    status: "published",
    tags: ["qgis", "gis", "pyqgis", "spatial", "geospatial"],
  },
  {
    id: "threejs",
    name: "Three.js",
    description: "24 deterministic Claude AI skills for Three.js 3D/WebGL/WebGPU development",
    category: "aec-bim",
    skillCount: 24,
    repo: "OpenAEC-Foundation/Three.js-Claude-Skill-Package",
    status: "published",
    tags: ["threejs", "3d", "webgl", "webgpu", "visualization"],
  },

  // ERP/Business
  {
    id: "frappe",
    name: "Frappe Framework",
    description: "60 deterministic Claude AI skills for Frappe Framework & ERPNext v14-v16 development and operations",
    category: "erp-business",
    skillCount: 60,
    repo: "OpenAEC-Foundation/Frappe_Claude_Skill_Package",
    status: "published",
    tags: ["frappe", "erpnext", "erp", "python", "javascript"],
  },
  {
    id: "nextcloud",
    name: "Nextcloud",
    description: "24 deterministic Claude AI skills for Nextcloud 28+ development — PHP, TypeScript, Vue.js, OCS API, WebDAV",
    category: "erp-business",
    skillCount: 24,
    repo: "OpenAEC-Foundation/Nextcloud-Claude-Skill-Package",
    status: "published",
    tags: ["nextcloud", "php", "vue", "collaboration", "self-hosted"],
  },
  {
    id: "n8n",
    name: "n8n",
    description: "21 deterministic Claude AI skills for n8n v1.x workflow automation",
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
    description: "27 deterministic Claude AI skills for Tauri 2 desktop app development — Rust + TypeScript full-stack",
    category: "web-dev",
    skillCount: 27,
    repo: "OpenAEC-Foundation/Tauri-2-Claude-Skill-Package",
    status: "published",
    tags: ["tauri", "rust", "desktop", "typescript", "webview"],
  },
  {
    id: "react",
    name: "React",
    description: "24 deterministic Claude skills for React 18 & 19 development — hooks, components, Server Components, testing",
    category: "web-dev",
    skillCount: 24,
    repo: "OpenAEC-Foundation/React-Claude-Skill-Package",
    status: "published",
    tags: ["react", "ui", "frontend", "hooks", "typescript"],
  },
  {
    id: "vite",
    name: "Vite",
    description: "22 deterministic Claude AI skills for Vite 6, 7 & 8 — config, plugin API, HMR, SSR, library mode",
    category: "web-dev",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Vite-Claude-Skill-Package",
    status: "published",
    tags: ["vite", "build", "frontend", "ssr"],
  },
  {
    id: "solidjs",
    name: "SolidJS",
    description: "16 deterministic Claude AI skills for SolidJS reactive framework development",
    category: "web-dev",
    skillCount: 16,
    repo: "OpenAEC-Foundation/SolidJS-Claude-Skill-Package",
    status: "published",
    tags: ["solidjs", "ui", "reactive", "frontend"],
  },
  {
    id: "pdfjs",
    name: "PDF.js",
    description: "15 deterministic Claude AI skills for PDF.js (pdfjs-dist 5.x) — rendering, viewer development, error handling",
    category: "web-dev",
    skillCount: 15,
    repo: "OpenAEC-Foundation/PDFjs-Claude-Skill-Package",
    status: "published",
    tags: ["pdf", "pdfjs", "viewer", "typescript"],
  },
  {
    id: "pdf-lib",
    name: "pdf-lib",
    description: "17 deterministic skills that teach Claude to write correct pdf-lib code for PDF document generation",
    category: "web-dev",
    skillCount: 17,
    repo: "OpenAEC-Foundation/pdf-lib-Claude-Skill-Package",
    status: "published",
    tags: ["pdf", "pdf-lib", "document-generation", "typescript"],
  },
  {
    id: "fluent-i18n",
    name: "Fluent i18n",
    description: "16 deterministic Claude AI skills for Project Fluent (Mozilla i18n) — FTL syntax + TypeScript integration",
    category: "web-dev",
    skillCount: 16,
    repo: "OpenAEC-Foundation/Fluent-i18n-Claude-Skill-Package",
    status: "published",
    tags: ["i18n", "fluent", "localization", "mozilla"],
  },
  {
    id: "open-pdf-studio",
    name: "Open PDF Studio",
    description: "6 deterministic Claude skills for open-pdf-studio technology boundaries — PDF.js, pdf-lib, SolidJS, Tauri 2",
    category: "cross-tech",
    skillCount: 6,
    repo: "OpenAEC-Foundation/Open-PDF-Studio-Claude-Skill-Package",
    status: "published",
    tags: ["pdf", "solidjs", "tauri", "cross-tech"],
  },

  // DevOps
  {
    id: "docker",
    name: "Docker",
    description: "Docker & Docker Compose skill package — Dockerfile best practices, multi-stage builds, Compose orchestration, container security",
    category: "devops",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Docker-Claude-Skill-Package",
    status: "published",
    tags: ["docker", "containers", "devops", "compose"],
  },
  {
    id: "drawio",
    name: "Draw.io",
    description: "22 deterministic Claude skills for Draw.io diagram generation",
    category: "devops",
    skillCount: 22,
    repo: "OpenAEC-Foundation/Draw.io-Claude-Skill-Package",
    status: "published",
    tags: ["drawio", "diagrams", "mxgraph", "visualization"],
  },

  // Cross-Tech
  {
    id: "cross-tech-aec",
    name: "Cross-Tech AEC",
    description: "15 deterministic Claude skills for cross-technology AEC integration — bridging IFC, ERPNext, FreeCAD, Speckle, QGIS, Three.js, n8n, Docker",
    category: "cross-tech",
    skillCount: 15,
    repo: "OpenAEC-Foundation/Cross-Tech-AEC-Claude-Skill-Package",
    status: "published",
    tags: ["cross-tech", "aec", "ifc", "integration", "speckle", "qgis", "threejs"],
  },
];

export const categoryLabels: Record<SkillPackage["category"], string> = {
  "aec-bim": "AEC / BIM",
  "erp-business": "ERP / Business",
  "web-dev": "Web Development",
  "devops": "DevOps / Tools",
  "cross-tech": "Cross-Tech",
};
