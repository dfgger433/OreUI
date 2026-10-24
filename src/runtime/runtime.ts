import {
  destroyDropdown,
  initDropdowns,
} from "../components/dropdown/dropdown.js";
import { destroyModals, initModals } from "../components/modal/modal.js";
import {
  destroyScrollbar,
  initScrollbars,
} from "../components/scrollbar/scrollbar.js";
import { destroySlider, initSliders } from "../components/slider/slider.js";
import { destroyTable, initTables } from "../components/table/table.js";
import {
  destroyTabButton,
  initTabButtons,
} from "../components/tab-button/tab-button.js";
import { destroyToast, initToasts } from "../components/toast/toast.js";
import {
  destroyToggles,
  initTogglesList,
} from "../components/toggles/toggles.js";
import { destroyTooltip, initTooltips } from "../components/tooltip/tooltip.js";

export type OreUIRoot = Document | Element | ShadowRoot;

export interface OreUIRuntimeOptions {
  observe?: boolean;
}

export interface OreUIRuntime {
  readonly root: OreUIRoot;
  readonly observe: boolean;
  init(): void;
  destroy(): void;
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

type RuntimeWindow = Window & {
  MutationObserver?: new (callback: MutationCallback) => MutationObserver;
};

function ownerWindow(root: OreUIRoot): Window | null {
  const ownerDocument =
    root.nodeType === 9 ? (root as Document) : root.ownerDocument;
  return ownerDocument?.defaultView ?? null;
}

function initRoot(root: OreUIRoot): void {
  initTables(root);
  initDropdowns(root);
  initModals(root);
  initSliders(root);
  initScrollbars(root);
  initTabButtons(root);
  initToasts(root);
  initTogglesList(root);
  initTooltips(root);
}

function destroyNode(node: Node): void {
  if (!isElement(node)) {
    return;
  }

  destroyModals(node);

  if (node.matches(".ore-dropdown")) {
    destroyDropdown(node as Parameters<typeof destroyDropdown>[0]);
  }
  if (node.matches("input.ore-slider")) {
    destroySlider(node as Parameters<typeof destroySlider>[0]);
  }
  if (node.matches(".ore-scrollbar")) {
    destroyScrollbar(node as Parameters<typeof destroyScrollbar>[0]);
  }
  if (node.matches(".ore-table > table")) {
    destroyTable(node as Parameters<typeof destroyTable>[0]);
  }
  if (node.matches("button.ore-tab-button")) {
    destroyTabButton(node as Parameters<typeof destroyTabButton>[0]);
  }
  if (node.matches(".ore-toast")) {
    destroyToast(node as Parameters<typeof destroyToast>[0]);
  }
  if (node.matches(".ore-toggles")) {
    destroyToggles(node as Parameters<typeof destroyToggles>[0]);
  }
  if (node.matches(".ore-tooltip")) {
    destroyTooltip(node as Parameters<typeof destroyTooltip>[0]);
  }

  for (const child of node.children) {
    destroyNode(child);
  }
}

function destroyRoot(root: OreUIRoot): void {
  destroyModals(root);

  if (root.nodeType === 1) {
    destroyNode(root);
    return;
  }

  for (const child of root.children) {
    destroyNode(child);
  }
}

function observeRoot(
  root: OreUIRoot,
  callback: MutationCallback,
): MutationObserver | undefined {
  const Observer = (ownerWindow(root) as RuntimeWindow | null)
    ?.MutationObserver;
  if (!Observer) {
    return undefined;
  }
  const observer = new Observer(callback);
  const target =
    root.nodeType === 9 ? (root as Document).documentElement : root;
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
  }
  return observer;
}

export function createOreUIRuntime(
  root: OreUIRoot,
  options: OreUIRuntimeOptions = {},
): OreUIRuntime {
  const shouldObserve = options.observe === true;
  let observer: MutationObserver | undefined;
  let destroyed = false;

  const runtime: OreUIRuntime = {
    root,
    observe: shouldObserve,
    init() {
      if (destroyed) {
        return;
      }
      initRoot(root);
      if (shouldObserve && !observer) {
        observer = observeRoot(root, (records) => {
          if (destroyed) {
            return;
          }
          for (const record of records) {
            for (const node of record.removedNodes) {
              destroyNode(node);
            }
            for (const node of record.addedNodes) {
              if (isElement(node)) {
                initRoot(node);
              }
            }
          }
        });
      }
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      observer?.disconnect();
      observer = undefined;
      destroyRoot(root);
    },
  };

  return runtime;
}
