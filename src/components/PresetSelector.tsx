import { For } from "solid-js";
import type { Preset } from "../lib/presets";

interface Props {
  presets: Preset[];
  selected: Preset | null;
  onSelect: (preset: Preset) => void;
}

export function PresetSelector(props: Props) {
  return (
    <div class="card">
      <h2 class="card-title">Presets</h2>
      <div class="preset-grid">
        <For each={props.presets}>
          {(preset) => (
            <button
              class={`preset-card ${props.selected?.id === preset.id ? "selected" : ""}`}
              style={{ "--preset-color": preset.color }}
              onClick={() => props.onSelect(preset)}
            >
              <span class="preset-indicator" />
              <div class="preset-info">
                <strong>{preset.name}</strong>
                <small>{preset.description}</small>
              </div>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
