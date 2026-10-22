import { onCleanup, onMount, splitProps, type JSX } from "solid-js";
import {
  destroyScrollbar,
  initScrollbar,
} from "oreui-web/scrollbar-controller";

export type ScrollbarProps = JSX.HTMLAttributes<HTMLDivElement>;

export function Scrollbar(props: ScrollbarProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "ref"]);
  let element: HTMLDivElement | undefined;
  const captureElement = (value: HTMLDivElement) => {
    element = value;
    if (typeof local.ref === "function") {
      local.ref(value);
    }
  };

  onMount(() => {
    if (element) {
      initScrollbar(element);
    }
  });
  onCleanup(() => {
    if (element) {
      destroyScrollbar(element);
    }
  });

  return (
    <div
      {...rest}
      class={`ore-scrollbar ${local.class ?? ""}`}
      ref={captureElement}
    />
  );
}
