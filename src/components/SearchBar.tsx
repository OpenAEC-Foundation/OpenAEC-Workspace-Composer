import { For, Show } from "solid-js";
import { type FilterId, availableFilters } from "../stores/packages.store";

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  activeFilters: FilterId[];
  onFilterToggle: (id: FilterId) => void;
}

export function SearchBar(props: Props) {
  return (
    <>
      <div class="search-bar">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search packages by name, description, or tag..."
          value={props.query}
          onInput={(e) => props.onQueryChange(e.currentTarget.value)}
        />
        <Show when={props.query}>
          <button
            class="btn btn-ghost btn-sm"
            onClick={() => props.onQueryChange("")}
            aria-label="Clear search"
            style={{ padding: "2px 6px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </Show>
      </div>
      <div class="filter-chips">
        <For each={availableFilters}>
          {(filter) => (
            <button
              class={`filter-chip ${props.activeFilters.includes(filter.id) ? "active" : ""}`}
              onClick={() => props.onFilterToggle(filter.id)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>
    </>
  );
}
