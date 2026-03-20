import { createSignal, createMemo } from "solid-js";
import { type SkillPackage, categoryLabels } from "../lib/packages";
import { getHardcodedRegistry, fetchRegistry, type RegistryPackage } from "../lib/registry";
import type { Preset } from "../lib/presets";

export type FilterId = "aec-bim" | "erp-business" | "web-dev" | "devops" | "published" | "anthropic" | "all";

export const availableFilters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "aec-bim", label: "AEC/BIM" },
  { id: "erp-business", label: "ERP" },
  { id: "web-dev", label: "Web Dev" },
  { id: "devops", label: "DevOps" },
  { id: "published", label: "Published" },
  { id: "anthropic", label: "Anthropic" },
];

// Package state
const [registryPackages, setRegistryPackages] = createSignal<RegistryPackage[]>(getHardcodedRegistry());
const [registryLoading, setRegistryLoading] = createSignal(false);
const [registryError, setRegistryError] = createSignal<string | null>(null);
const [registryLastUpdated, setRegistryLastUpdated] = createSignal<Date | null>(null);

// Selection state
const [selectedPackages, setSelectedPackages] = createSignal<string[]>([]);
const [selectedPreset, setSelectedPreset] = createSignal<Preset | null>(null);

// Search & filter state
const [searchQuery, setSearchQuery] = createSignal("");
const [activeFilters, setActiveFilters] = createSignal<FilterId[]>(["all"]);

// Derived: packages as SkillPackage[]
const packages = createMemo<SkillPackage[]>(() => registryPackages());

// Derived: filtered packages
const filteredPackages = createMemo(() => {
  let pkgs = registryPackages();
  const q = searchQuery().toLowerCase().trim();
  const filters = activeFilters();

  if (!filters.includes("all")) {
    pkgs = pkgs.filter((pkg) => {
      const categoryMatch = filters.some(
        (f) => f !== "published" && f !== "anthropic" && f === pkg.category
      );
      const publishedMatch =
        filters.includes("published") && pkg.status === "published";
      const anthropicMatch =
        filters.includes("anthropic") && pkg.publisher === "anthropic";
      const hasCategory = filters.some((f) => f !== "published" && f !== "anthropic");

      if (anthropicMatch) return true;
      if (!hasCategory) return publishedMatch;
      if (!filters.includes("published")) return categoryMatch;
      return categoryMatch && publishedMatch;
    });
  }

  if (q) {
    pkgs = pkgs.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return pkgs;
});

// Derived: grouped by category
const groupedPackages = createMemo(() => {
  const groups: Record<string, RegistryPackage[]> = {};
  for (const pkg of filteredPackages()) {
    if (!groups[pkg.category]) groups[pkg.category] = [];
    groups[pkg.category].push(pkg);
  }
  return groups;
});

// Derived: selected package objects
const selectedPackageObjects = createMemo(() =>
  registryPackages().filter((p) => selectedPackages().includes(p.id))
);

const totalSkills = createMemo(() =>
  selectedPackageObjects().reduce((sum, p) => sum + p.skillCount, 0)
);

// Actions
async function loadRegistry(forceRefresh = false) {
  setRegistryLoading(true);
  setRegistryError(null);
  try {
    const { fetchRegistryBackend } = await import("../lib/registry");
    const live = await fetchRegistryBackend(forceRefresh);
    setRegistryPackages(live);
    setRegistryLastUpdated(new Date());
  } catch (e) {
    setRegistryError(e instanceof Error ? e.message : "Failed to fetch registry");
  } finally {
    setRegistryLoading(false);
  }
}

function togglePackage(id: string) {
  setSelectedPackages((prev) =>
    prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
  );
  setSelectedPreset(null);
}

function removePackage(id: string) {
  setSelectedPackages((prev) => prev.filter((p) => p !== id));
  setSelectedPreset(null);
}

function selectPreset(preset: Preset) {
  setSelectedPreset(preset);
  if (preset.workflowType === "skill-package") {
    setSelectedPackages(preset.packages);
  }
}

function toggleFilter(id: FilterId) {
  if (id === "all") {
    setActiveFilters(["all"]);
    return;
  }
  setActiveFilters((prev) => {
    const without = prev.filter((f) => f !== "all");
    if (without.includes(id)) {
      const next = without.filter((f) => f !== id);
      return next.length === 0 ? ["all"] : next;
    }
    return [...without, id];
  });
}

function clearSelection() {
  setSelectedPackages([]);
  setSelectedPreset(null);
}

export const packagesStore = {
  // Getters
  registryPackages,
  registryLoading,
  registryError,
  registryLastUpdated,
  selectedPackages,
  selectedPreset,
  searchQuery,
  activeFilters,
  packages,
  filteredPackages,
  groupedPackages,
  selectedPackageObjects,
  totalSkills,
  // Actions
  loadRegistry,
  togglePackage,
  removePackage,
  selectPreset,
  toggleFilter,
  clearSelection,
  setSearchQuery,
  setSelectedPackages,
  setSelectedPreset,
};
