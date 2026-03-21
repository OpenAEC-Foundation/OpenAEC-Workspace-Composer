import { Transition } from "solid-transition-group";
import type { ParentProps } from "solid-js";

export function PageTransition(props: ParentProps) {
  return (
    <Transition
      mode="outin"
      onEnter={(el, done) => {
        el.animate(
          [
            { opacity: 0, transform: "translateY(6px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 180, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
        ).finished.then(done);
      }}
      onExit={(el, done) => {
        el.animate(
          [
            { opacity: 1 },
            { opacity: 0 },
          ],
          { duration: 120, easing: "ease-out" }
        ).finished.then(done);
      }}
    >
      {props.children}
    </Transition>
  );
}
