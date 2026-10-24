export type OreTabButton = HTMLButtonElement;
export type OreTabButtonPalette = "default" | "toggle";

const states = new Set<OreTabButton>();
const observers = new WeakMap<OreTabButton, MutationObserver>();
const previousAttributes = new WeakMap<
  OreTabButton,
  Record<string, string | null>
>();
const tabSelector = "button.ore-tab-button";

function tabsFor(tab: OreTabButton): OreTabButton[] {
  const tablist = tab.closest('[role="tablist"]');
  if (!tablist) {
    return [tab];
  }

  return [...tablist.querySelectorAll<OreTabButton>(tabSelector)].filter(
    (item) => item.closest('[role="tablist"]') === tablist,
  );
}

function syncTab(tab: OreTabButton): void {
  const tabs = tabsFor(tab);
  const selected = tab.getAttribute("aria-selected") === "true";
  const hasSelected = tabs.some(
    (item) => item.getAttribute("aria-selected") === "true",
  );
  const ariaSelected = String(selected);

  if (tab.getAttribute("role") !== "tab") {
    tab.setAttribute("role", "tab");
  }
  if (tab.getAttribute("aria-selected") !== ariaSelected) {
    tab.setAttribute("aria-selected", ariaSelected);
  }
  tab.tabIndex = !tab.disabled && (selected || !hasSelected) ? 0 : -1;
}

function selectTab(tab: OreTabButton): void {
  if (tab.disabled || tab.getAttribute("aria-selected") === "true") {
    return;
  }

  for (const item of tabsFor(tab)) {
    const ariaSelected = String(item === tab);
    if (item.getAttribute("aria-selected") !== ariaSelected) {
      item.setAttribute("aria-selected", ariaSelected);
    }
    syncTab(item);
  }
  const EventConstructor = tab.ownerDocument.defaultView?.Event;
  if (EventConstructor) {
    tab.dispatchEvent(new EventConstructor("change", { bubbles: true }));
  }
}

function moveTab(tab: OreTabButton, offset: number): void {
  const tabs = tabsFor(tab).filter((item) => !item.disabled);
  const index = tabs.indexOf(tab);
  const next = tabs[(index + offset + tabs.length) % tabs.length];

  next?.focus();
  if (next) {
    selectTab(next);
  }
}

function selectEdge(tab: OreTabButton, edge: "first" | "last"): void {
  const tabs = tabsFor(tab).filter((item) => !item.disabled);
  const next = edge === "first" ? tabs[0] : tabs.at(-1);

  next?.focus();
  if (next) {
    selectTab(next);
  }
}

function handleClick(event: MouseEvent): void {
  selectTab(event.currentTarget as OreTabButton);
}

function handleKeydown(event: KeyboardEvent): void {
  const tab = event.currentTarget as OreTabButton;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    moveTab(tab, 1);
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    moveTab(tab, -1);
  } else if (event.key === "Home") {
    event.preventDefault();
    selectEdge(tab, "first");
  } else if (event.key === "End") {
    event.preventDefault();
    selectEdge(tab, "last");
  }
}

export function initTabButton(tab: OreTabButton): void {
  if (states.has(tab)) {
    syncTab(tab);
    return;
  }

  const ownerWindow = tab.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  states.add(tab);
  previousAttributes.set(
    tab,
    Object.fromEntries(
      ["role", "aria-selected", "tabindex", "data-ore-initialized"].map(
        (attribute) => [attribute, tab.getAttribute(attribute)],
      ),
    ),
  );
  tab.dataset.oreInitialized = "tab-button";
  tab.addEventListener("click", handleClick);
  tab.addEventListener("keydown", handleKeydown);
  const mutationObserver = new ownerWindow.MutationObserver(() => syncTab(tab));
  mutationObserver.observe(tab, {
    attributes: true,
    attributeFilter: ["aria-selected", "disabled"],
  });
  observers.set(tab, mutationObserver);
  syncTab(tab);
}

export function destroyTabButton(tab: OreTabButton): void {
  if (!states.delete(tab)) {
    return;
  }

  tab.removeEventListener("click", handleClick);
  tab.removeEventListener("keydown", handleKeydown);
  observers.get(tab)?.disconnect();
  observers.delete(tab);
  const attributes = previousAttributes.get(tab);
  if (attributes) {
    for (const [attribute, value] of Object.entries(attributes)) {
      if (value === null) {
        tab.removeAttribute(attribute);
      } else {
        tab.setAttribute(attribute, value);
      }
    }
  }
  previousAttributes.delete(tab);
}

export function initTabButtons(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "button" &&
    (root as Element).matches(tabSelector)
  ) {
    initTabButton(root as OreTabButton);
  }
  for (const tab of root.querySelectorAll<OreTabButton>(tabSelector)) {
    initTabButton(tab);
  }
}
