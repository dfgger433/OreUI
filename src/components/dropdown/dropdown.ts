import {
  destroyScrollbar,
  initScrollbar,
} from "../scrollbar-controller/scrollbar-controller.js";

export type OreDropdownElement = HTMLElement;
export type OreDropdownVariant = "bordered" | "borderless";

export interface OreDropdownChangeDetail {
  item: HTMLButtonElement;
  value: string;
}

interface DropdownState {
  attributes: Record<string, string | null>;
  handleClick: (event: MouseEvent) => void;
  handleDocumentPointerDown: (event: PointerEvent) => void;
  handleKeydown: (event: KeyboardEvent) => void;
  handleToggle: (event: Event) => void;
  menu: HTMLElement;
  menuClassName: string;
  menuStyles: string;
  mutationObserver: MutationObserver;
  position: () => void;
  trigger: HTMLButtonElement;
  triggerAttributes: Record<string, string | null>;
  hostInitialized: string | null;
}

function supportsPopoverSelector(ownerWindow: Window): boolean {
  try {
    const CSS = (ownerWindow as OwnerWindow).CSS;
    return (
      typeof CSS?.supports === "function" &&
      CSS.supports("selector(:popover-open)")
    );
  } catch {
    return false;
  }
}

function supportsPopover(
  menu: HTMLElement,
  ownerWindow: Window,
): menu is HTMLElement & {
  hidePopover: () => void;
  showPopover: () => void;
} {
  return (
    supportsPopoverSelector(ownerWindow) &&
    typeof menu.showPopover === "function" &&
    typeof menu.hidePopover === "function"
  );
}

function isOpen(menu: HTMLElement, ownerWindow: Window): boolean {
  if (supportsPopover(menu, ownerWindow)) {
    try {
      return menu.matches(":popover-open");
    } catch {
      return false;
    }
  }

  return menu.hasAttribute("data-ore-fallback-open");
}

function setFallbackOpen(menu: HTMLElement, open: boolean): void {
  menu.hidden = !open;
  if (open) {
    menu.setAttribute("data-ore-fallback-open", "");
  } else {
    menu.removeAttribute("data-ore-fallback-open");
  }
}

function openStateFromEvent(event: Event): boolean | undefined {
  const newState = (event as Event & { newState?: string }).newState;
  return newState === "open" ? true : newState === "closed" ? false : undefined;
}

function getOwnerWindow(node: Node): Window | null {
  return (
    (node.nodeType === 9 ? (node as Document) : node.ownerDocument)
      ?.defaultView ?? null
  );
}

function isElementNode(value: unknown): value is Element {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    (value as Node).nodeType === 1 &&
    typeof (value as Element).closest === "function"
  );
}

const dropdownSelector = ".ore-dropdown";
const states = new WeakMap<OreDropdownElement, DropdownState>();
let openState: DropdownState | null = null;
let dropdownId = 0;

type OwnerWindow = Window & {
  CSS?: {
    supports: (conditionText: string) => boolean;
  };
};

function getItems(dropdown: OreDropdownElement): HTMLButtonElement[] {
  return [
    ...dropdown.querySelectorAll<HTMLButtonElement>(
      ":scope > .ore-dropdown-menu > .ore-dropdown-item",
    ),
  ];
}

function syncSelection(dropdown: OreDropdownElement): void {
  const value = dropdown.dataset.value ?? "";
  let selectedItem: HTMLButtonElement | undefined;

  for (const item of getItems(dropdown)) {
    const selected = item.dataset.value === value;
    item.setAttribute("aria-checked", String(selected));
    item.setAttribute("role", "menuitemradio");
    item.tabIndex = -1;

    if (selected) {
      selectedItem = item;
    }
  }

  const label = selectedItem?.textContent?.trim();
  const labelElement = states
    .get(dropdown)
    ?.trigger.querySelector<HTMLElement>(
      ":scope > .ore-dropdown-trigger-label",
    );

  if (label && labelElement && labelElement.textContent !== label) {
    labelElement.textContent = label;
  }
}

function enabledItems(dropdown: OreDropdownElement): HTMLButtonElement[] {
  return getItems(dropdown).filter((item) => !item.disabled);
}

function focusItem(dropdown: OreDropdownElement, index: number): void {
  const items = enabledItems(dropdown);
  const item = items[(index + items.length) % items.length];

  item?.focus();
  item?.scrollIntoView({ block: "nearest" });
}

export function initDropdown(dropdown: OreDropdownElement): void {
  if (states.has(dropdown)) {
    syncSelection(dropdown);
    return;
  }

  const trigger = dropdown.querySelector<HTMLButtonElement>(
    ":scope > .ore-dropdown-trigger",
  );
  const menu = dropdown.querySelector<HTMLElement>(
    ":scope > .ore-dropdown-menu",
  );

  if (!trigger || !menu) {
    return;
  }

  const ownerDocument = dropdown.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  const hostInitialized = dropdown.getAttribute("data-ore-initialized");
  const attributes = Object.fromEntries(
    ["id", "popover", "role", "data-ore-fallback-open", "hidden"].map(
      (attribute) => [attribute, menu.getAttribute(attribute)],
    ),
  );
  const triggerAttributes = Object.fromEntries(
    ["aria-haspopup", "aria-controls", "aria-expanded", "popovertarget"].map(
      (attribute) => [attribute, trigger.getAttribute(attribute)],
    ),
  );
  const menuClassName = menu.className;
  const menuStyles = menu.style.cssText;

  if (!menu.id) {
    menu.id = `ore-dropdown-${++dropdownId}`;
  }

  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-controls", menu.id);
  trigger.setAttribute("aria-expanded", "false");
  trigger.removeAttribute("popovertarget");
  if (supportsPopover(menu, ownerWindow)) {
    menu.setAttribute("popover", "manual");
  } else {
    menu.hidden = !menu.hasAttribute("data-ore-fallback-open");
  }
  menu.setAttribute("role", "menu");
  menu.classList.add("ore-scrollbar");
  initScrollbar(menu);

  const position = (): void => {
    if (!isOpen(menu, ownerWindow)) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    menu.style.width = `${triggerRect.width}px`;
    const scrollbarWidth = menu.offsetWidth - menu.clientWidth;
    menu.style.setProperty(
      "--ore-dropdown-scrollbar-width",
      `${scrollbarWidth}px`,
    );
    const menuRect = menu.getBoundingClientRect();
    const inset = 2;
    const left = Math.min(
      Math.max(triggerRect.left, inset),
      ownerWindow.innerWidth - menuRect.width - inset,
    );
    const below =
      triggerRect.bottom + menuRect.height <= ownerWindow.innerHeight - inset;

    menu.style.left = `${left}px`;
    menu.style.top = `${below ? triggerRect.bottom : triggerRect.top - menuRect.height}px`;
  };

  const startPositioning = (): void => {
    position();
    ownerWindow.requestAnimationFrame(position);
    ownerWindow.addEventListener("resize", position);
    ownerWindow.addEventListener("scroll", position, true);
  };

  const stopPositioning = (): void => {
    ownerWindow.removeEventListener("resize", position);
    ownerWindow.removeEventListener("scroll", position, true);
  };

  const handleToggle = (event: Event): void => {
    const open = openStateFromEvent(event) ?? isOpen(menu, ownerWindow);
    trigger.setAttribute("aria-expanded", String(open));

    if (open) {
      openState = states.get(dropdown) ?? null;
      startPositioning();
    } else {
      if (openState?.menu === menu) {
        openState = null;
      }
      stopPositioning();
    }
  };

  const close = (): void => {
    if (!isOpen(menu, ownerWindow)) {
      return;
    }
    if (supportsPopover(menu, ownerWindow)) {
      menu.hidePopover();
    } else {
      setFallbackOpen(menu, false);
      handleToggle(new ownerWindow.Event("toggle"));
    }
  };

  const open = (): void => {
    if (isOpen(menu, ownerWindow)) {
      return;
    }

    if (openState && openState.menu !== menu) {
      const openStateWindow = getOwnerWindow(openState.menu);
      if (openStateWindow && supportsPopover(openState.menu, openStateWindow)) {
        openState.menu.hidePopover();
      } else {
        setFallbackOpen(openState.menu, false);
        openState.handleToggle(new ownerWindow.Event("toggle"));
      }
    }

    if (supportsPopover(menu, ownerWindow)) {
      menu.showPopover();
    } else {
      setFallbackOpen(menu, true);
      handleToggle(new ownerWindow.Event("toggle"));
    }
  };

  const select = (item: HTMLButtonElement): void => {
    const value = item.dataset.value;

    if (value === undefined || item.disabled) {
      return;
    }

    dropdown.dataset.value = value;
    syncSelection(dropdown);
    close();
    trigger.focus();
    dropdown.dispatchEvent(
      new ownerWindow.CustomEvent<OreDropdownChangeDetail>("change", {
        bubbles: true,
        detail: { item, value },
      }),
    );
  };

  const handleClick = (event: MouseEvent): void => {
    const target = event.target;
    const item = isElementNode(target)
      ? target.closest<HTMLButtonElement>(".ore-dropdown-item")
      : null;

    if (item && dropdown.contains(item)) {
      select(item);
    } else if (
      isElementNode(target) &&
      target.closest(".ore-dropdown-trigger") === trigger
    ) {
      if (isOpen(menu, ownerWindow)) {
        close();
      } else {
        open();
      }
    }
  };

  const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (isOpen(menu, ownerWindow) && !event.composedPath().includes(dropdown)) {
      close();
    }
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.target === trigger) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen(menu, ownerWindow)) {
          open();
        }
        ownerWindow.requestAnimationFrame(() =>
          focusItem(dropdown, event.key === "ArrowUp" ? -1 : 0),
        );
      } else if (event.key === "Escape" && isOpen(menu, ownerWindow)) {
        event.preventDefault();
        close();
      }
      return;
    }

    if (!isElementNode(event.target)) {
      return;
    }

    const items = enabledItems(dropdown);
    const index = items.indexOf(event.target as HTMLButtonElement);

    if (index < 0) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(dropdown, index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusItem(dropdown, event.key === "Home" ? 0 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(event.target as HTMLButtonElement);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      trigger.focus();
    } else if (event.key === "Tab") {
      close();
    }
  };

  const mutationObserver = new ownerWindow.MutationObserver(() =>
    syncSelection(dropdown),
  );
  states.set(dropdown, {
    attributes,
    handleClick,
    handleDocumentPointerDown,
    handleKeydown,
    handleToggle,
    menu,
    menuClassName,
    menuStyles,
    mutationObserver,
    position,
    trigger,
    triggerAttributes,
    hostInitialized,
  });
  dropdown.dataset.oreInitialized = "dropdown";
  dropdown.addEventListener("click", handleClick);
  dropdown.addEventListener("keydown", handleKeydown);
  ownerDocument.addEventListener(
    "pointerdown",
    handleDocumentPointerDown,
    true,
  );
  menu.addEventListener("toggle", handleToggle);
  mutationObserver.observe(dropdown, {
    attributeFilter: ["data-value", "disabled"],
    attributes: true,
    childList: true,
    subtree: true,
  });
  syncSelection(dropdown);
}

export function destroyDropdown(dropdown: OreDropdownElement): void {
  const state = states.get(dropdown);

  if (!state) {
    return;
  }

  dropdown.removeEventListener("click", state.handleClick);
  dropdown.removeEventListener("keydown", state.handleKeydown);
  const ownerDocument = dropdown.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  ownerDocument.removeEventListener(
    "pointerdown",
    state.handleDocumentPointerDown,
    true,
  );
  state.menu.removeEventListener("toggle", state.handleToggle);
  state.mutationObserver.disconnect();
  if (ownerWindow && isOpen(state.menu, ownerWindow)) {
    if (supportsPopover(state.menu, ownerWindow)) {
      state.menu.hidePopover();
    } else {
      setFallbackOpen(state.menu, false);
    }
  }
  destroyScrollbar(state.menu);
  ownerWindow?.removeEventListener("resize", state.position);
  ownerWindow?.removeEventListener("scroll", state.position, true);
  if (openState === state) {
    openState = null;
  }
  state.menu.className = state.menuClassName;
  state.menu.style.cssText = state.menuStyles;
  for (const [attribute, value] of Object.entries(state.attributes)) {
    if (value === null) {
      state.menu.removeAttribute(attribute);
    } else {
      state.menu.setAttribute(attribute, value);
    }
  }
  for (const [attribute, value] of Object.entries(state.triggerAttributes)) {
    if (value === null) {
      state.trigger.removeAttribute(attribute);
    } else {
      state.trigger.setAttribute(attribute, value);
    }
  }
  if (state.hostInitialized === null) {
    delete dropdown.dataset.oreInitialized;
  } else {
    dropdown.setAttribute("data-ore-initialized", state.hostInitialized);
  }
  states.delete(dropdown);
}

export function initDropdowns(root: ParentNode): void {
  if (isElementNode(root) && root.matches(dropdownSelector)) {
    initDropdown(root as OreDropdownElement);
  }

  for (const dropdown of root.querySelectorAll<OreDropdownElement>(
    dropdownSelector,
  )) {
    initDropdown(dropdown);
  }
}
