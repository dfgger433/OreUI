import type { OreTagVariant } from "../tag/tag.js";

export type OreToastPosition =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end";
export type OreToastVariant = OreTagVariant;
export type OreToastElement = HTMLElement;

type ToastState = {
  attributes: Record<string, string | null>;
  duration: number;
  remaining: number;
  startedAt: number;
  styles: string;
  timer?: number;
};

type PopoverToast = OreToastElement & {
  hidePopover: () => void;
  showPopover: () => void;
};

const selector = ".ore-toast";
const states = new WeakMap<OreToastElement, ToastState>();

type OwnerWindow = Window & {
  CSS?: {
    supports: (conditionText: string) => boolean;
  };
  CustomEvent: new <T>(
    type: string,
    eventInitDict?: CustomEventInit<T>,
  ) => CustomEvent<T>;
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

function getOwnerWindow(toast: OreToastElement): Window | null {
  return toast.ownerDocument.defaultView;
}

function supportsPopover(
  toast: OreToastElement,
  ownerWindow: Window,
): toast is PopoverToast {
  return (
    supportsPopoverSelector(ownerWindow) &&
    typeof toast.showPopover === "function" &&
    typeof toast.hidePopover === "function"
  );
}

function isOpen(toast: OreToastElement, ownerWindow: Window): boolean {
  if (supportsPopover(toast, ownerWindow)) {
    try {
      return toast.matches(":popover-open");
    } catch {
      return false;
    }
  }

  return toast.hasAttribute("data-ore-fallback-open");
}

function durationFor(toast: OreToastElement): number {
  const duration = Number(toast.dataset.duration ?? 3000);
  return Number.isFinite(duration) && duration >= 0 ? duration : 3000;
}

function clearTimer(state: ToastState, ownerWindow: Window): void {
  ownerWindow.clearTimeout(state.timer);
  state.timer = undefined;
}

function startTimer(toast: OreToastElement, open?: boolean): void {
  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow) {
    return;
  }
  open ??= isOpen(toast, ownerWindow);
  const state = states.get(toast);
  if (!state || state.remaining <= 0 || !open) {
    return;
  }

  clearTimer(state, ownerWindow);
  state.startedAt = ownerWindow.performance.now();
  state.timer = ownerWindow.setTimeout(
    () => closeToast(toast),
    state.remaining,
  );
}

function pauseTimer(toast: OreToastElement): void {
  const ownerWindow = getOwnerWindow(toast);
  const state = states.get(toast);
  if (!ownerWindow || state?.timer === undefined) {
    return;
  }

  state.remaining = Math.max(
    0,
    state.remaining - (ownerWindow.performance.now() - state.startedAt),
  );
  clearTimer(state, ownerWindow);
}

function resetTimer(toast: OreToastElement, open?: boolean): void {
  const ownerWindow = getOwnerWindow(toast);
  const state = states.get(toast);
  if (!ownerWindow || !state) {
    return;
  }

  open ??= isOpen(toast, ownerWindow);
  state.duration = durationFor(toast);
  state.remaining = state.duration;
  startTimer(toast, open);
}

function dispatchOpenChange(toast: OreToastElement, open: boolean): void {
  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow) {
    return;
  }
  const CustomEventCtor = (ownerWindow as OwnerWindow).CustomEvent;
  toast.dispatchEvent(
    new CustomEventCtor<boolean>("oreui:openchange", {
      bubbles: true,
      detail: open,
    }),
  );
}

function updateOpenState(toast: OreToastElement, open: boolean): void {
  const state = states.get(toast);
  if (open) {
    resetTimer(toast, true);
  } else if (state) {
    const ownerWindow = getOwnerWindow(toast);
    if (ownerWindow) {
      clearTimer(state, ownerWindow);
    }
  }

  dispatchOpenChange(toast, open);
}

function setFallbackOpen(toast: OreToastElement, open: boolean): void {
  if (open) {
    toast.hidden = false;
    toast.setAttribute("data-ore-fallback-open", "");
  } else {
    toast.hidden = true;
    toast.removeAttribute("data-ore-fallback-open");
  }

  updateOpenState(toast, open);
}

function handleToggle(event: Event): void {
  const toast = event.currentTarget;
  if (!toast || typeof toast !== "object" || !("ownerDocument" in toast)) {
    return;
  }
  const ownerWindow = getOwnerWindow(toast as OreToastElement);
  if (!ownerWindow) {
    return;
  }

  const newState = (event as Event & { newState?: string }).newState;
  const open =
    newState === "open"
      ? true
      : newState === "closed"
        ? false
        : isOpen(toast as OreToastElement, ownerWindow);

  updateOpenState(toast as OreToastElement, open);
}

function handlePointerEnter(event: PointerEvent): void {
  pauseTimer(event.currentTarget as OreToastElement);
}

function handlePointerLeave(event: PointerEvent): void {
  startTimer(event.currentTarget as OreToastElement);
}

function handleFocusIn(event: FocusEvent): void {
  pauseTimer(event.currentTarget as OreToastElement);
}

function handleFocusOut(event: FocusEvent): void {
  const toast = event.currentTarget as OreToastElement;
  if (!toast.contains(event.relatedTarget as Node | null)) {
    startTimer(toast);
  }
}

export function showToast(toast: OreToastElement): void {
  if (!toast.isConnected) {
    return;
  }

  initToast(toast);
  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow) {
    return;
  }
  if (!isOpen(toast, ownerWindow)) {
    if (supportsPopover(toast, ownerWindow)) {
      toast.showPopover();
    } else {
      setFallbackOpen(toast, true);
    }
  } else {
    resetTimer(toast);
  }
}

export function closeToast(toast: OreToastElement): void {
  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow || !isOpen(toast, ownerWindow)) {
    return;
  }

  if (supportsPopover(toast, ownerWindow)) {
    toast.hidePopover();
  } else {
    setFallbackOpen(toast, false);
  }
}

export function destroyToast(toast: OreToastElement): void {
  const state = states.get(toast);
  if (!state) {
    return;
  }

  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow) {
    return;
  }
  clearTimer(state, ownerWindow);
  if (isOpen(toast, ownerWindow)) {
    if (supportsPopover(toast, ownerWindow)) {
      toast.hidePopover();
    } else {
      toast.hidden = true;
      toast.removeAttribute("data-ore-fallback-open");
    }
  }
  toast.removeEventListener("toggle", handleToggle);
  toast.removeEventListener("pointerenter", handlePointerEnter);
  toast.removeEventListener("pointerleave", handlePointerLeave);
  toast.removeEventListener("focusin", handleFocusIn);
  toast.removeEventListener("focusout", handleFocusOut);
  for (const [attribute, value] of Object.entries(state.attributes)) {
    if (value === null) {
      toast.removeAttribute(attribute);
    } else {
      toast.setAttribute(attribute, value);
    }
  }
  toast.style.cssText = state.styles;
  states.delete(toast);
}

export function initToast(toast: OreToastElement): void {
  if (states.has(toast)) {
    return;
  }

  const ownerWindow = getOwnerWindow(toast);
  if (!ownerWindow) {
    return;
  }

  const duration = durationFor(toast);
  const attributes = Object.fromEntries(
    [
      "popover",
      "role",
      "aria-live",
      "aria-atomic",
      "data-ore-fallback-open",
      "hidden",
      "data-ore-initialized",
    ].map((attribute) => [attribute, toast.getAttribute(attribute)]),
  );
  states.set(toast, {
    attributes,
    duration,
    remaining: duration,
    startedAt: 0,
    styles: toast.style.cssText,
  });
  toast.dataset.oreInitialized = "toast";
  toast.setAttribute("popover", "manual");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  toast.addEventListener("toggle", handleToggle);
  toast.addEventListener("pointerenter", handlePointerEnter);
  toast.addEventListener("pointerleave", handlePointerLeave);
  toast.addEventListener("focusin", handleFocusIn);
  toast.addEventListener("focusout", handleFocusOut);

  if (!supportsPopover(toast, ownerWindow)) {
    toast.hidden = true;
  }

  if (
    toast.hasAttribute("data-open") ||
    toast.hasAttribute("data-default-open")
  ) {
    showToast(toast);
  }
}

export function initToasts(root: ParentNode): void {
  if (
    typeof root === "object" &&
    root !== null &&
    "nodeType" in root &&
    (root as Node).nodeType === 1 &&
    (root as Element).matches(selector)
  ) {
    initToast(root as OreToastElement);
  }
  for (const toast of root.querySelectorAll<OreToastElement>(selector)) {
    initToast(toast);
  }
}
