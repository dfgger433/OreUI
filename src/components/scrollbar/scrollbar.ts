import {
  destroyScrollbar,
  initScrollbars,
  type OreScrollbarElement,
} from "../scrollbar-controller/scrollbar-controller.js";

export {
  destroyScrollbar,
  initScrollbar,
  initScrollbars,
  type OreScrollbarElement,
} from "../scrollbar-controller/scrollbar-controller.js";

const scrollbarSelector = ".ore-scrollbar";

if (typeof document !== "undefined") {
  initScrollbars();

  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) {
          initScrollbars(node);
        }
      }

      for (const node of record.removedNodes) {
        if (node instanceof HTMLElement && node.matches(scrollbarSelector)) {
          destroyScrollbar(node);
        }

        if (node instanceof HTMLElement) {
          for (const scrollbar of node.querySelectorAll<OreScrollbarElement>(
            scrollbarSelector,
          )) {
            destroyScrollbar(scrollbar);
          }
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}
