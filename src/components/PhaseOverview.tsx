import { For } from "solid-js";
import type { WorkflowPhase } from "../lib/workflows";

interface Props {
  phases: WorkflowPhase[];
}

export function PhaseOverview(props: Props) {
  return (
    <div class="card">
      <h2 class="card-title">7-Phase Methodology</h2>
      <div class="phase-timeline">
        <For each={props.phases}>
          {(phase) => (
            <div class="phase-step">
              <div class="phase-number">{phase.number}</div>
              <div class="phase-info">
                <strong>{phase.name}</strong>
                <small>{phase.description}</small>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
