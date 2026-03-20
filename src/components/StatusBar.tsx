interface Props {
  selectedCount: number;
}

export function StatusBar(props: Props) {
  return (
    <div class="statusbar">
      <div class="statusbar-left">
        <span class="statusbar-item">
          <span class="statusbar-dot" />
          Ready
        </span>
      </div>
      <div class="statusbar-right">
        <span class="statusbar-item">
          {props.selectedCount} package{props.selectedCount !== 1 ? "s" : ""} selected
        </span>
        <span class="statusbar-item" style={{ opacity: "0.7" }}>
          OpenAEC Foundation v1.0.0
        </span>
      </div>
    </div>
  );
}
