import type { WorkflowTypeId } from "./workflows";

export interface Preset {
  id: string;
  name: string;
  description: string;
  packages: string[];
  color: string;
  workflowType: WorkflowTypeId;
  // Version upgrade specific
  sourceVersion?: string;
  targetVersion?: string;
}

export const presets: Preset[] = [
  // ── Skill Package Presets ────────────────────────────────────────

  // AEC / Construction
  {
    id: "bim-development",
    name: "BIM Development",
    description: "Full BIM pipeline — Blender Bonsai + IFC + ThatOpen web viewer + Docker",
    packages: ["blender-bonsai", "thatopen", "docker", "cross-tech-aec"],
    color: "#3498db",
    workflowType: "skill-package",
  },
  {
    id: "aec-gis-bim",
    name: "AEC-GIS-BIM Platform",
    description: "Complete AEC data platform — BIM + GIS + Speckle collaboration + 3D web",
    packages: ["blender-bonsai", "speckle", "qgis", "threejs", "thatopen", "cross-tech-aec"],
    color: "#9b59b6",
    workflowType: "skill-package",
  },
  {
    id: "bim-web-viewer",
    name: "BIM Web Viewer",
    description: "Browser-based IFC/BIM viewer — ThatOpen Engine + Three.js + React + Vite",
    packages: ["thatopen", "threejs", "react", "vite"],
    color: "#1abc9c",
    workflowType: "skill-package",
  },
  {
    id: "aec-data-pipeline",
    name: "AEC Data Pipeline",
    description: "Automated BIM-to-web pipeline — Blender + Speckle + Docker + n8n orchestration",
    packages: ["blender-bonsai", "speckle", "docker", "n8n", "cross-tech-aec"],
    color: "#8e44ad",
    workflowType: "skill-package",
  },

  // Business / ERP
  {
    id: "erpnext-fullstack",
    name: "ERPNext Fullstack",
    description: "Complete ERP ecosystem — ERPNext + Nextcloud + Docker + n8n automation + React",
    packages: ["frappe", "nextcloud", "docker", "n8n", "react"],
    color: "#2ecc71",
    workflowType: "skill-package",
  },
  {
    id: "business-automation",
    name: "Business Automation",
    description: "Workflow automation stack — n8n + ERPNext + Nextcloud + Docker",
    packages: ["n8n", "frappe", "nextcloud", "docker"],
    color: "#e67e22",
    workflowType: "skill-package",
  },
  {
    id: "document-management",
    name: "Document Management",
    description: "PDF processing + cloud storage — PDF.js viewer + pdf-lib creation + Nextcloud + i18n",
    packages: ["pdfjs", "pdf-lib", "nextcloud", "fluent-i18n", "vite"],
    color: "#c0392b",
    workflowType: "skill-package",
  },

  // Desktop / Web Apps
  {
    id: "open-pdf-studio",
    name: "Open PDF Studio",
    description: "Desktop PDF app — Tauri + SolidJS + PDF.js + pdf-lib + Fluent i18n + Vite",
    packages: ["tauri-2", "solidjs", "pdfjs", "pdf-lib", "fluent-i18n", "vite", "open-pdf-studio"],
    color: "#e74c3c",
    workflowType: "skill-package",
  },
  {
    id: "tauri-desktop-app",
    name: "Tauri Desktop App",
    description: "Cross-platform desktop app — Tauri 2 + SolidJS + Vite build system",
    packages: ["tauri-2", "solidjs", "vite"],
    color: "#FFC131",
    workflowType: "skill-package",
  },
  {
    id: "web-fullstack",
    name: "Web Fullstack",
    description: "Modern web development stack — React + Vite + Docker + SolidJS",
    packages: ["react", "vite", "docker", "solidjs"],
    color: "#f39c12",
    workflowType: "skill-package",
  },
  {
    id: "3d-web-experience",
    name: "3D Web Experience",
    description: "Interactive 3D web — Three.js + React + Vite + Docker deployment",
    packages: ["threejs", "react", "vite", "docker"],
    color: "#2980b9",
    workflowType: "skill-package",
  },
  {
    id: "i18n-web-app",
    name: "Internationalized Web App",
    description: "Multi-language web app — React + Fluent i18n + Vite + Docker",
    packages: ["react", "fluent-i18n", "vite", "docker"],
    color: "#27ae60",
    workflowType: "skill-package",
  },

  // DevOps & Infrastructure
  {
    id: "devops-documentation",
    name: "DevOps & Documentation",
    description: "Infrastructure + visual docs — Docker containers + Draw.io diagrams",
    packages: ["docker", "drawio"],
    color: "#34495e",
    workflowType: "skill-package",
  },
  {
    id: "minimal-starter",
    name: "Minimal Starter",
    description: "Lightweight starting point — just Vite + Docker for any project",
    packages: ["vite", "docker"],
    color: "#95a5a6",
    workflowType: "skill-package",
  },

  // ── Version Upgrade Presets ──────────────────────────────────────

  {
    id: "tauri-1-to-2",
    name: "Tauri 1.x to 2.x",
    description: "Migrate from Tauri 1 to Tauri 2 — new plugin system, IPC, capabilities",
    packages: [],
    color: "#FFC131",
    workflowType: "version-upgrade",
    sourceVersion: "1.x",
    targetVersion: "2.x",
  },
  {
    id: "react-18-to-19",
    name: "React 18 to 19",
    description: "Migrate from React 18 to 19 — compiler, actions, new hooks",
    packages: [],
    color: "#61DAFB",
    workflowType: "version-upgrade",
    sourceVersion: "18",
    targetVersion: "19",
  },
  {
    id: "erpnext-14-to-15",
    name: "ERPNext 14 to 15",
    description: "Migrate ERPNext — new UI framework, API changes, deprecations",
    packages: [],
    color: "#0089FF",
    workflowType: "version-upgrade",
    sourceVersion: "14",
    targetVersion: "15",
  },
  {
    id: "nextcloud-28-to-30",
    name: "Nextcloud 28 to 30",
    description: "Migrate Nextcloud apps — new APIs, Vue 3 components, navigation",
    packages: [],
    color: "#0082C9",
    workflowType: "version-upgrade",
    sourceVersion: "28",
    targetVersion: "30",
  },
  {
    id: "custom-upgrade",
    name: "Custom Upgrade",
    description: "Bootstrap a version upgrade workspace for any framework or library",
    packages: [],
    color: "#95a5a6",
    workflowType: "version-upgrade",
  },
];
