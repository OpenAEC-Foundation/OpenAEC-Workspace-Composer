import type { WorkflowTypeId } from "./workflows";

export interface Preset {
  id: string;
  name: string;
  description: string;
  packages: string[];
  color: string;
  workflowType: WorkflowTypeId;
  sourceVersion?: string;
  targetVersion?: string;
}

export const presets: Preset[] = [
  // ── Skill Package Presets ── core only, gebruiker voegt zelf extra toe

  // AEC / Construction
  {
    id: "bim-core",
    name: "BIM Core",
    description: "3D modeling + IFC bestandsbeheer met Blender en Bonsai BIM plugin",
    packages: ["blender-bonsai"],
    color: "#3498db",
    workflowType: "skill-package",
  },
  {
    id: "bim-web",
    name: "BIM Web",
    description: "BIM modellen bekijken in de browser. IFC laden, navigeren en inspecteren",
    packages: ["thatopen", "threejs"],
    color: "#1abc9c",
    workflowType: "skill-package",
  },
  {
    id: "aec-gis",
    name: "AEC + GIS",
    description: "Combineer 3D bouwmodellen met geografische data en kaarten",
    packages: ["blender-bonsai", "qgis"],
    color: "#9b59b6",
    workflowType: "skill-package",
  },
  {
    id: "speckle-collab",
    name: "Speckle Collaboration",
    description: "Deel BIM data tussen teams. Connectors voor Revit, Rhino, Blender, AutoCAD",
    packages: ["speckle", "cross-tech-aec"],
    color: "#8e44ad",
    workflowType: "skill-package",
  },

  // Business / ERP
  {
    id: "frappe-core",
    name: "Frappe / ERPNext",
    description: "ERP systeem bouwen. Doctypes, API's, workflows, rapportages",
    packages: ["frappe"],
    color: "#2ecc71",
    workflowType: "skill-package",
  },
  {
    id: "nextcloud-core",
    name: "Nextcloud",
    description: "Apps bouwen voor Nextcloud. PHP backend, Vue.js frontend, WebDAV API",
    packages: ["nextcloud"],
    color: "#0082C9",
    workflowType: "skill-package",
  },
  {
    id: "automation",
    name: "Automation",
    description: "Workflows automatiseren. Triggers, nodes, API koppelingen, credentials",
    packages: ["n8n"],
    color: "#e67e22",
    workflowType: "skill-package",
  },

  // Web / Desktop
  {
    id: "tauri-app",
    name: "Tauri Desktop",
    description: "Native desktop app voor Windows/Mac/Linux. Rust backend, web frontend",
    packages: ["tauri-2", "solidjs"],
    color: "#FFC131",
    workflowType: "skill-package",
  },
  {
    id: "react-app",
    name: "React App",
    description: "React componenten, hooks, Server Components, testing en performance",
    packages: ["react", "vite"],
    color: "#61DAFB",
    workflowType: "skill-package",
  },
  {
    id: "pdf-tools",
    name: "PDF Tools",
    description: "PDF bestanden renderen, bewerken en genereren. Formulieren, annotaties, fonts",
    packages: ["pdfjs", "pdf-lib"],
    color: "#e74c3c",
    workflowType: "skill-package",
  },
  {
    id: "3d-web",
    name: "3D Web",
    description: "Interactieve 3D scenes in de browser. WebGL, materialen, loaders, shaders",
    packages: ["threejs"],
    color: "#2980b9",
    workflowType: "skill-package",
  },

  // DevOps
  {
    id: "docker-core",
    name: "Docker",
    description: "Containers bouwen en orchestreren. Dockerfile, Compose, multi-stage builds",
    packages: ["docker"],
    color: "#0db7ed",
    workflowType: "skill-package",
  },
  {
    id: "diagrams",
    name: "Diagrams",
    description: "Automatisch architectuur- en flowdiagrammen genereren met Draw.io/mxGraph",
    packages: ["drawio"],
    color: "#F08705",
    workflowType: "skill-package",
  },

  // ── Version Upgrade Presets ──

  {
    id: "tauri-1-to-2",
    name: "Tauri 1 → 2",
    description: "Plugin system, IPC, capabilities migratie",
    packages: [],
    color: "#FFC131",
    workflowType: "version-upgrade",
    sourceVersion: "1.x",
    targetVersion: "2.x",
  },
  {
    id: "react-18-to-19",
    name: "React 18 → 19",
    description: "Compiler, actions, nieuwe hooks",
    packages: [],
    color: "#61DAFB",
    workflowType: "version-upgrade",
    sourceVersion: "18",
    targetVersion: "19",
  },
  {
    id: "erpnext-14-to-15",
    name: "ERPNext 14 → 15",
    description: "UI framework, API changes",
    packages: [],
    color: "#0089FF",
    workflowType: "version-upgrade",
    sourceVersion: "14",
    targetVersion: "15",
  },
  {
    id: "custom-upgrade",
    name: "Custom Upgrade",
    description: "Upgrade workspace voor elk framework",
    packages: [],
    color: "#95a5a6",
    workflowType: "version-upgrade",
  },
];
