export type OreTableElement = HTMLTableElement;
export type OreTableVariant = "plain" | "striped";
export type OreTableSortDirection = "none" | "ascending" | "descending";

export interface OreTableSortDetail {
  column: string;
  direction: OreTableSortDirection;
}

const tableSelector = ".ore-table > table";
interface TableState {
  handleClick: (event: MouseEvent) => void;
  initialized: string | null;
  sortAttributes: Map<HTMLTableCellElement, string | null>;
}
const states = new WeakMap<OreTableElement, TableState>();

function initTable(table: OreTableElement): void {
  if (states.has(table)) {
    return;
  }

  const handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!target || (target as Node).nodeType !== 1) {
      return;
    }

    const button = (target as Element).closest<HTMLButtonElement>(
      ".ore-table-sort",
    );
    const header = button?.closest<HTMLTableCellElement>("th");

    if (!button || !header || button.disabled || !table.contains(button)) {
      return;
    }

    const current = header.getAttribute("aria-sort") ?? "none";
    const direction: OreTableSortDirection =
      current === "none"
        ? "ascending"
        : current === "ascending"
          ? "descending"
          : "none";

    for (const sortable of table.querySelectorAll("th[aria-sort]")) {
      sortable.setAttribute("aria-sort", "none");
    }
    header.setAttribute("aria-sort", direction);

    const CustomEventConstructor = table.ownerDocument.defaultView?.CustomEvent;
    if (CustomEventConstructor) {
      table.dispatchEvent(
        new CustomEventConstructor<OreTableSortDetail>("sort", {
          bubbles: true,
          detail: { column: button.value, direction },
        }),
      );
    }
  };

  states.set(table, {
    handleClick,
    initialized: table.getAttribute("data-ore-initialized"),
    sortAttributes: new Map(
      [...table.querySelectorAll<HTMLTableCellElement>("th")].map((cell) => [
        cell,
        cell.getAttribute("aria-sort"),
      ]),
    ),
  });
  table.dataset.oreInitialized = "table";
  table.addEventListener("click", handleClick);
}

export function destroyTable(table: OreTableElement): void {
  const state = states.get(table);
  if (!state) {
    return;
  }

  table.removeEventListener("click", state.handleClick);
  for (const [cell, value] of state.sortAttributes) {
    if (value === null) {
      cell.removeAttribute("aria-sort");
    } else {
      cell.setAttribute("aria-sort", value);
    }
  }
  if (state.initialized === null) {
    table.removeAttribute("data-ore-initialized");
  } else {
    table.setAttribute("data-ore-initialized", state.initialized);
  }
  states.delete(table);
}

export { initTable };

export function destroyTables(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "table" &&
    (root as Element).matches(tableSelector)
  ) {
    destroyTable(root as OreTableElement);
  }

  for (const table of root.querySelectorAll<OreTableElement>(tableSelector)) {
    destroyTable(table);
  }
}

export function initTables(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "table" &&
    (root as Element).matches(tableSelector)
  ) {
    initTable(root as OreTableElement);
  }

  for (const table of root.querySelectorAll<OreTableElement>(tableSelector)) {
    initTable(table);
  }
}
