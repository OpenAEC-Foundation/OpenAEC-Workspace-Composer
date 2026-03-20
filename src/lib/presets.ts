export interface Preset {
  id: string;
  name: string;
  description: string;
  packages: string[];
  color: string;
}

export const presets: Preset[] = [
  {
    id: "open-pdf-studio",
    name: "Open PDF Studio",
    description: "Tauri + SolidJS + PDF.js + pdf-lib + Fluent i18n + Vite",
    packages: ["tauri-2", "solidjs", "pdfjs", "pdf-lib", "fluent-i18n", "vite", "cross-tech"],
    color: "#e74c3c",
  },
  {
    id: "bim-development",
    name: "BIM Development",
    description: "Blender + Bonsai + IfcOpenShell + ThatOpen + Docker",
    packages: ["blender-bonsai", "thatopen", "docker"],
    color: "#3498db",
  },
  {
    id: "erpnext-fullstack",
    name: "ERPNext Fullstack",
    description: "ERPNext + Nextcloud + Docker + n8n + React",
    packages: ["erpnext", "nextcloud", "docker", "n8n", "react"],
    color: "#2ecc71",
  },
  {
    id: "aec-gis-bim",
    name: "AEC-GIS-BIM",
    description: "Blender-Bonsai + Speckle + QGIS + Three.js",
    packages: ["blender-bonsai", "speckle", "qgis", "threejs"],
    color: "#9b59b6",
  },
  {
    id: "web-fullstack",
    name: "Web Fullstack",
    description: "React + Vite + Docker + SolidJS",
    packages: ["react", "vite", "docker", "solidjs"],
    color: "#f39c12",
  },
];
