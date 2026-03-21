// Map package IDs to their logo file paths
// Only includes packages with verified official logos

import blenderLogo from "../assets/logos/blender.svg";
import reactLogo from "../assets/logos/react.svg";
import dockerLogo from "../assets/logos/docker.svg";
import viteLogo from "../assets/logos/vite.svg";
import solidjsLogo from "../assets/logos/solidjs.svg";
import nextcloudLogo from "../assets/logos/nextcloud.svg";
import threejsLogo from "../assets/logos/threejs.svg";
import qgisLogo from "../assets/logos/qgis.svg";
import tauriLogo from "../assets/logos/tauri.svg";
import thatopenLogo from "../assets/logos/thatopen.png";
import speckleLogo from "../assets/logos/speckle.png";
import frappeLogo from "../assets/logos/frappe.png";
import n8nLogo from "../assets/logos/n8n.png";
import drawioLogo from "../assets/logos/drawio.svg";
import fluentLogo from "../assets/logos/fluent-i18n.png";
import crossTechLogo from "../assets/openaec-symbol.svg";
import openPdfStudioLogo from "../assets/logos/open-pdf-studio.png";
import pdfjsLogo from "../assets/logos/pdfjs.svg";
import openPdfStudioIconLogo from "../assets/logos/open-pdf-studio-icon.png";
import anthropicLogo from "../assets/logos/anthropic.png";

const logoMap: Record<string, string> = {
  "blender-bonsai": blenderLogo,
  "react": reactLogo,
  "docker": dockerLogo,
  "vite": viteLogo,
  "solidjs": solidjsLogo,
  "nextcloud": nextcloudLogo,
  "threejs": threejsLogo,
  "three.js": threejsLogo,
  "qgis": qgisLogo,
  "tauri-2": tauriLogo,
  "thatopen": thatopenLogo,
  "speckle": speckleLogo,
  "frappe": frappeLogo,
  "n8n": n8nLogo,
  "drawio": drawioLogo,
  "draw.io": drawioLogo,
  "fluent-i18n": fluentLogo,
  "cross-tech-aec": crossTechLogo,
  "open-pdf-studio": openPdfStudioIconLogo,
  "pdfjs": pdfjsLogo,
  "pdf-lib": openPdfStudioIconLogo,
};

export function getPackageLogo(packageId: string): string | null {
  // Anthropic skill packages all start with "anthropic-"
  if (packageId.startsWith("anthropic-")) {
    return anthropicLogo;
  }
  return logoMap[packageId] ?? null;
}
