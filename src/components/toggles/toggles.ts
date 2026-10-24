export type OreToggles = HTMLDivElement;

const states = new Set<OreToggles>();
const previousRoles = new WeakMap<OreToggles, string | null>();
const previousInitializedMarkers = new WeakMap<OreToggles, string | null>();
const previousPalettes = new WeakMap<
  OreToggles,
  Map<HTMLButtonElement, string | null>
>();
const observers = new WeakMap<OreToggles, MutationObserver>();

function syncTabs(toggles: OreToggles): void {
  const palettes = previousPalettes.get(toggles);
  for (const tab of toggles.querySelectorAll<HTMLButtonElement>(
    ":scope > .ore-tab-button",
  )) {
    if (palettes && !palettes.has(tab)) {
      palettes.set(tab, tab.getAttribute("data-palette"));
    }
    tab.dataset.palette = "toggle";
  }
}

export function initToggles(toggles: OreToggles): void {
  if (states.has(toggles)) {
    syncTabs(toggles);
    return;
  }

  const ownerWindow = toggles.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  states.add(toggles);
  previousRoles.set(toggles, toggles.getAttribute("role"));
  previousInitializedMarkers.set(
    toggles,
    toggles.getAttribute("data-ore-initialized"),
  );
  previousPalettes.set(
    toggles,
    new Map(
      [
        ...toggles.querySelectorAll<HTMLButtonElement>(
          ":scope > .ore-tab-button",
        ),
      ].map((tab) => [tab, tab.getAttribute("data-palette")]),
    ),
  );
  toggles.dataset.oreInitialized = "toggles";
  toggles.setAttribute("role", "tablist");
  const mutationObserver = new ownerWindow.MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "childList") {
        initToggles(toggles);
      }
    }
    syncTabs(toggles);
  });
  mutationObserver.observe(toggles, { childList: true, subtree: true });
  observers.set(toggles, mutationObserver);
  syncTabs(toggles);
}

export function destroyToggles(toggles: OreToggles): void {
  if (!states.delete(toggles)) {
    return;
  }

  observers.get(toggles)?.disconnect();
  observers.delete(toggles);
  const previousRole = previousRoles.get(toggles);
  if (previousRole === null) {
    toggles.removeAttribute("role");
  } else if (previousRole !== undefined) {
    toggles.setAttribute("role", previousRole);
  }
  const palettes = previousPalettes.get(toggles);
  if (palettes) {
    for (const [tab, previousPalette] of palettes) {
      if (previousPalette === null) {
        tab.removeAttribute("data-palette");
      } else if (tab.getAttribute("data-palette") === "toggle") {
        tab.setAttribute("data-palette", previousPalette);
      }
    }
  }
  previousRoles.delete(toggles);
  previousPalettes.delete(toggles);
  const previousInitialized = previousInitializedMarkers.get(toggles);
  if (previousInitialized === null) {
    toggles.removeAttribute("data-ore-initialized");
  } else if (previousInitialized !== undefined) {
    toggles.setAttribute("data-ore-initialized", previousInitialized);
  }
  previousInitializedMarkers.delete(toggles);
}

export function initTogglesList(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "div" &&
    (root as Element).matches(".ore-toggles")
  ) {
    initToggles(root as OreToggles);
  }
  for (const toggles of root.querySelectorAll<OreToggles>(".ore-toggles")) {
    initToggles(toggles);
  }
}
