export type OreTooltipElement = HTMLElement;
export type OreTooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipState {
  attributes: Record<string, string | null>;
  content: HTMLElement;
  contentStyles: string;
  triggerAttributes: Record<string, string | null>;
  handleFocusIn: () => void;
  handleFocusOut: (event: FocusEvent) => void;
  handleKeydown: (event: KeyboardEvent) => void;
  handlePointerEnter: () => void;
  handlePointerLeave: () => void;
  handleToggle: (event: Event) => void;
  mutationObserver: MutationObserver;
  position: () => void;
  timer: number | undefined;
  trigger: HTMLElement;
  hostInitialized: string | null;
}

const tooltipSelector = ".ore-tooltip";
const states = new WeakMap<OreTooltipElement, TooltipState>();
let tooltipId = 0;

type OwnerWindow = Window & {
  CSS?: {
    supports: (conditionText: string) => boolean;
  };
};

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

type PopoverTooltipContent = HTMLElement & {
  hidePopover: () => void;
  showPopover: () => void;
};

function supportsPopover(
  content: HTMLElement,
  ownerWindow: Window,
): content is PopoverTooltipContent {
  return (
    supportsPopoverSelector(ownerWindow) &&
    typeof content.showPopover === "function" &&
    typeof content.hidePopover === "function"
  );
}

function isOpen(content: HTMLElement, ownerWindow: Window): boolean {
  if (supportsPopover(content, ownerWindow)) {
    try {
      return content.matches(":popover-open");
    } catch {
      return false;
    }
  }

  return content.hasAttribute("data-ore-fallback-open");
}

function setFallbackOpen(content: HTMLElement, open: boolean): void {
  content.hidden = !open;
  if (open) {
    content.setAttribute("data-ore-fallback-open", "");
  } else {
    content.removeAttribute("data-ore-fallback-open");
  }
}

function getSide(tooltip: OreTooltipElement): OreTooltipSide {
  const side = tooltip.dataset.side;
  return side === "right" || side === "bottom" || side === "left"
    ? side
    : "top";
}

function getDelay(tooltip: OreTooltipElement): number {
  const delay = Number(tooltip.dataset.delay);
  return Number.isFinite(delay) && delay >= 0 ? delay : 500;
}

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    typeof (value as Node).nodeType === "number"
  );
}

export function initTooltip(tooltip: OreTooltipElement): void {
  if (states.has(tooltip)) {
    return;
  }

  const trigger = tooltip.querySelector<HTMLElement>(
    ":scope > .ore-tooltip-trigger",
  );
  const content = tooltip.querySelector<HTMLElement>(
    ":scope > .ore-tooltip-content",
  );

  if (!trigger || !content) {
    return;
  }

  const ownerWindow = tooltip.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  const hadContentId = content.id;
  const hostInitialized = tooltip.getAttribute("data-ore-initialized");
  const attributes = Object.fromEntries(
    ["id", "role", "popover", "data-ore-fallback-open", "hidden"].map(
      (attribute) => [attribute, content.getAttribute(attribute)],
    ),
  );
  const triggerAttributes = Object.fromEntries(
    ["aria-describedby"].map((attribute) => [
      attribute,
      trigger.getAttribute(attribute),
    ]),
  );

  if (!hadContentId) {
    content.id = `ore-tooltip-${++tooltipId}`;
  }
  trigger.setAttribute("aria-describedby", content.id);
  content.setAttribute("role", "tooltip");
  if (supportsPopover(content, ownerWindow)) {
    content.setAttribute("popover", "manual");
  } else {
    setFallbackOpen(content, content.hasAttribute("data-ore-fallback-open"));
  }

  const position = (): void => {
    if (!isOpen(content, ownerWindow)) {
      return;
    }

    const side = getSide(tooltip);
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const arrow = content.querySelector<HTMLElement>(".ore-tooltip-arrow");
    const arrowRect = arrow?.getBoundingClientRect();
    const arrowSize =
      side === "top" || side === "bottom"
        ? (arrowRect?.height ?? 0)
        : (arrowRect?.width ?? 0);
    const arrowOffset = arrowSize * 0.75;
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    let left = triggerCenterX - contentRect.width / 2;
    let top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;

    if (side === "top") {
      top = triggerRect.top - contentRect.height - arrowSize;
    } else if (side === "right") {
      left = triggerRect.right + arrowOffset + (arrowSize * 3) / 4;
    } else if (side === "bottom") {
      top = triggerRect.bottom + arrowSize;
    } else {
      left =
        triggerRect.left -
        contentRect.width -
        arrowOffset -
        (arrowSize * 3) / 4;
    }

    const inset = arrowSize;
    left = Math.min(
      Math.max(left, inset),
      ownerWindow.innerWidth - contentRect.width - inset,
    );
    top = Math.min(
      Math.max(top, inset),
      ownerWindow.innerHeight - contentRect.height - inset,
    );
    content.style.setProperty(
      "--ore-tooltip-arrow-y",
      `${Math.min(Math.max(triggerCenterY - top, arrowSize), contentRect.height - arrowSize)}px`,
    );
    content.style.left = `${left}px`;
    content.style.top = `${top}px`;
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

  const close = (controlled = false): void => {
    ownerWindow.clearTimeout(state.timer);
    if (!controlled && tooltip.hasAttribute("data-open")) {
      return;
    }
    if (isOpen(content, ownerWindow)) {
      if (supportsPopover(content, ownerWindow)) {
        content.hidePopover();
      } else {
        setFallbackOpen(content, false);
        handleToggle(new ownerWindow.Event("toggle"));
      }
    }
  };

  const open = (controlled = false): void => {
    if (!controlled && tooltip.hasAttribute("data-open")) {
      return;
    }
    if (isOpen(content, ownerWindow)) {
      return;
    }

    if (supportsPopover(content, ownerWindow)) {
      content.showPopover();
    } else {
      setFallbackOpen(content, true);
      handleToggle(new ownerWindow.Event("toggle"));
    }
    startPositioning();
  };

  const scheduleOpen = (): void => {
    ownerWindow.clearTimeout(state.timer);
    state.timer = ownerWindow.setTimeout(open, getDelay(tooltip));
  };

  const handlePointerLeave = (): void => {
    if (!tooltip.contains(ownerWindow.document.activeElement)) {
      close();
    }
  };
  const handleFocusOut = (event: FocusEvent): void => {
    if (
      !isNode(event.relatedTarget) ||
      (!tooltip.contains(event.relatedTarget) && !tooltip.matches(":hover"))
    ) {
      close();
    }
  };
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };
  const handleToggle = (event: Event): void => {
    const newState = (event as Event & { newState?: string }).newState;
    const open =
      newState === "open"
        ? true
        : newState === "closed"
          ? false
          : isOpen(content, ownerWindow);
    if (open) {
      startPositioning();
    } else {
      stopPositioning();
    }
    tooltip.dispatchEvent(
      new ownerWindow.CustomEvent<boolean>("oreui:openchange", {
        bubbles: true,
        detail: open,
      }),
    );
  };

  const state: TooltipState = {
    attributes,
    content,
    contentStyles: content.style.cssText,
    triggerAttributes,
    handleFocusIn: scheduleOpen,
    handleFocusOut,
    handleKeydown,
    handlePointerEnter: scheduleOpen,
    handlePointerLeave,
    handleToggle,
    mutationObserver: new ownerWindow.MutationObserver((records) => {
      const openChanged = records.some(
        (record) =>
          record.target === tooltip && record.attributeName === "data-open",
      );

      if (openChanged) {
        const shouldOpen = tooltip.dataset.open === "true";

        if (shouldOpen !== isOpen(content, ownerWindow)) {
          if (shouldOpen) {
            open(true);
          } else {
            close(true);
          }
          return;
        }
      }

      if (isOpen(content, ownerWindow)) {
        position();
      }
    }),
    position,
    timer: undefined,
    trigger,
    hostInitialized,
  };

  states.set(tooltip, state);
  tooltip.dataset.oreInitialized = "tooltip";
  tooltip.addEventListener("pointerenter", state.handlePointerEnter);
  tooltip.addEventListener("pointerleave", state.handlePointerLeave);
  tooltip.addEventListener("focusin", state.handleFocusIn);
  tooltip.addEventListener("focusout", state.handleFocusOut);
  tooltip.addEventListener("keydown", state.handleKeydown);
  content.addEventListener("toggle", state.handleToggle);
  state.mutationObserver.observe(tooltip, {
    attributes: true,
    attributeFilter: ["data-side", "data-delay", "data-open"],
    childList: true,
    subtree: true,
  });

  if (
    tooltip.dataset.open === "true" ||
    tooltip.hasAttribute("data-default-open")
  ) {
    open(tooltip.hasAttribute("data-open"));
  }
}

export function destroyTooltip(tooltip: OreTooltipElement): void {
  const state = states.get(tooltip);
  if (!state) {
    return;
  }

  const ownerWindow = tooltip.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  ownerWindow.clearTimeout(state.timer);
  tooltip.removeEventListener("pointerenter", state.handlePointerEnter);
  tooltip.removeEventListener("pointerleave", state.handlePointerLeave);
  tooltip.removeEventListener("focusin", state.handleFocusIn);
  tooltip.removeEventListener("focusout", state.handleFocusOut);
  tooltip.removeEventListener("keydown", state.handleKeydown);
  state.content.removeEventListener("toggle", state.handleToggle);
  state.mutationObserver.disconnect();
  ownerWindow.removeEventListener("resize", state.position);
  ownerWindow.removeEventListener("scroll", state.position, true);
  if (isOpen(state.content, ownerWindow)) {
    if (supportsPopover(state.content, ownerWindow)) {
      state.content.hidePopover();
    } else {
      setFallbackOpen(state.content, false);
    }
  }
  for (const [attribute, value] of Object.entries(state.attributes)) {
    if (value === null) {
      state.content.removeAttribute(attribute);
    } else {
      state.content.setAttribute(attribute, value);
    }
  }
  for (const [attribute, value] of Object.entries(state.triggerAttributes)) {
    if (value === null) {
      state.trigger.removeAttribute(attribute);
    } else {
      state.trigger.setAttribute(attribute, value);
    }
  }
  state.content.style.cssText = state.contentStyles;
  if (state.hostInitialized === null) {
    delete tooltip.dataset.oreInitialized;
  } else {
    tooltip.setAttribute("data-ore-initialized", state.hostInitialized);
  }
  states.delete(tooltip);
}

export function initTooltips(root: ParentNode): void {
  if (
    isNode(root) &&
    root.nodeType === 1 &&
    (root as Element).matches(tooltipSelector)
  ) {
    initTooltip(root as OreTooltipElement);
  }

  for (const tooltip of root.querySelectorAll<OreTooltipElement>(
    tooltipSelector,
  )) {
    initTooltip(tooltip);
  }
}
