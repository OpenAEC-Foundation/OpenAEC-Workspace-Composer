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
  // Skill Package Presets
  {
    id: "open-pdf-studio",
    name: "Open PDF Studio",
    description: "Tauri + SolidJS + PDF.js + pdf-lib + Fluent i18n + Vite",
    packages: ["tauri-2", "solidjs", "pdfjs", "pdf-lib", "fluent-i18n", "vite", "cross-tech"],
    color: "#e74c3c",
    workflowType: "skill-package",
  },
  {
    id: "bim-development",
    name: "BIM Development",
    description: "Blender + Bonsai + IfcOpenShell + ThatOpen + Docker",
    packages: ["blender-bonsai", "thatopen", "docker"],
    color: "#3498db",
    workflowType: "skill-package",
  },
  {
    id: "erpnext-fullstack",
    name: "ERPNext Fullstack",
    description: "ERPNext + Nextcloud + Docker + n8n + React",
    packages: ["erpnext", "nextcloud", "docker", "n8n", "react"],
    color: "#2ecc71",
    workflowType: "skill-package",
  },
  {
    id: "aec-gis-bim",
    name: "AEC-GIS-BIM",
    description: "Blender-Bonsai + Speckle + QGIS + Three.js",
    packages: ["blender-bonsai", "speckle", "qgis", "threejs"],
    color: "#9b59b6",
    workflowType: "skill-package",
  },
  {
    id: "web-fullstack",
    name: "Web Fullstack",
    description: "React + Vite + Docker + SolidJS",
    packages: ["react", "vite", "docker", "solidjs"],
    color: "#f39c12",
    workflowType: "skill-package",
  },

  // Version Upgrade Presets
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
    id: "custom-upgrade",
    name: "Custom Upgrade",
    description: "Bootstrap a version upgrade workspace for any framework or library",
    packages: [],
    color: "#95a5a6",
    workflowType: "version-upgrade",
  },
];
