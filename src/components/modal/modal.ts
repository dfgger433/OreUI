export type OreModalElement = HTMLDialogElement;

const modalSelector = "dialog.ore-modal";

interface ModalState {
  handleCancel: (event: Event) => void;
  handleClick: (event: MouseEvent) => void;
  initialized: string | null;
  wasOpen: boolean;
}

interface ModalRootState {
  handleClick: (event: MouseEvent) => void;
}

const states = new WeakMap<HTMLDialogElement, ModalState>();
const rootStates = new WeakMap<ParentNode, ModalRootState>();

function isElementNode(value: unknown): value is Element {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    (value as Node).nodeType === 1 &&
    typeof (value as Element).matches === "function"
  );
}

function getOwnerDocument(root: ParentNode): Document | null {
  const node = root as Node & { ownerDocument?: Document | null };
  return node.nodeType === 9
    ? (node as Document)
    : (node.ownerDocument ?? null);
}

function getOwnerWindow(root: ParentNode): Window | null {
  return getOwnerDocument(root)?.defaultView ?? null;
}

function isModalElement(
  value: unknown,
  ownerWindow: Window | null,
): value is HTMLDialogElement {
  if (!isElementNode(value) || !value.matches(modalSelector)) {
    return false;
  }

  const Dialog = (
    ownerWindow as
      | (Window & {
          HTMLDialogElement?: typeof HTMLDialogElement;
        })
      | null
  )?.HTMLDialogElement;
  return !Dialog || value instanceof Dialog;
}

function isWithinRoot(root: ParentNode, node: Node): boolean {
  const rootNode = root as Node;
  return (
    rootNode === node ||
    (typeof rootNode.contains === "function" && rootNode.contains(node))
  );
}

function closestElement(
  target: EventTarget | null,
  selector: string,
): Element | null {
  const node = target as (Node & { parentElement?: Element | null }) | null;
  if (!node || typeof node !== "object") {
    return null;
  }

  const element =
    node.nodeType === 1 ? (node as Element) : (node.parentElement ?? null);
  return element?.closest?.(selector) ?? null;
}

function findModal(
  root: ParentNode,
  targetId: string,
  ownerDocument: Document | null,
  ownerWindow: Window | null,
): HTMLDialogElement | null {
  const rootElement = isElementNode(root) ? root : null;
  if (
    rootElement?.id === targetId &&
    isModalElement(rootElement, ownerWindow)
  ) {
    return rootElement;
  }

  const documentModal = ownerDocument?.getElementById(targetId);
  if (
    documentModal &&
    isWithinRoot(root, documentModal) &&
    isModalElement(documentModal, ownerWindow)
  ) {
    return documentModal;
  }

  for (const modal of root.querySelectorAll<HTMLDialogElement>(modalSelector)) {
    if (modal.id === targetId && isModalElement(modal, ownerWindow)) {
      return modal;
    }
  }

  return null;
}

function initModal(modal: HTMLDialogElement): void {
  if (states.has(modal)) {
    return;
  }

  const handleCancel = (): void => {
    modal.returnValue = "escape";
  };
  const handleClick = (event: MouseEvent): void => {
    const closeButton = closestElement(event.target, "[data-modal-close]");

    if (closeButton && modal.contains(closeButton)) {
      const closeValue = closeButton.getAttribute("data-modal-close");
      modal.close(closeValue === null ? undefined : closeValue);
      return;
    }

    if (event.target === modal) {
      modal.close("backdrop");
    }
  };

  states.set(modal, {
    handleCancel,
    handleClick,
    initialized: modal.getAttribute("data-ore-initialized"),
    wasOpen: modal.open,
  });
  modal.dataset.oreInitialized = "modal";
  modal.addEventListener("cancel", handleCancel);
  modal.addEventListener("click", handleClick);
}

function initModalDelegation(root: ParentNode): void {
  if (rootStates.has(root)) {
    return;
  }

  const eventTarget = root as ParentNode & EventTarget;
  if (typeof eventTarget.addEventListener !== "function") {
    return;
  }

  const ownerDocument = getOwnerDocument(root);
  const ownerWindow = getOwnerWindow(root);
  const handleClick = (event: MouseEvent): void => {
    const trigger = closestElement(event.target, "[data-modal-target]");
    if (!trigger || !isWithinRoot(root, trigger)) {
      return;
    }

    const targetId = trigger.getAttribute("data-modal-target");
    if (!targetId) {
      return;
    }

    const modal = findModal(root, targetId, ownerDocument, ownerWindow);
    if (!modal || modal.open) {
      return;
    }

    modal.showModal();
  };

  rootStates.set(root, { handleClick });
  eventTarget.addEventListener("click", handleClick as EventListener);
}

function destroyModalDelegation(root: ParentNode): void {
  const state = rootStates.get(root);
  if (!state) {
    return;
  }

  const eventTarget = root as ParentNode & EventTarget;
  eventTarget.removeEventListener("click", state.handleClick as EventListener);
  rootStates.delete(root);
}

export function destroyModal(modal: HTMLDialogElement): void {
  const state = states.get(modal);
  if (!state) {
    return;
  }

  modal.removeEventListener("cancel", state.handleCancel);
  modal.removeEventListener("click", state.handleClick);
  if (modal.open) {
    modal.close();
  }
  if (state.wasOpen && modal.isConnected) {
    modal.showModal();
  }
  if (state.initialized === null) {
    modal.removeAttribute("data-ore-initialized");
  } else {
    modal.setAttribute("data-ore-initialized", state.initialized);
  }
  states.delete(modal);
}

export function destroyModals(root: ParentNode): void {
  destroyModalDelegation(root);

  if (isModalElement(root, getOwnerWindow(root))) {
    destroyModal(root);
  }

  for (const modal of root.querySelectorAll<HTMLDialogElement>(modalSelector)) {
    destroyModal(modal);
  }
}

export function initModals(root: ParentNode): void {
  const ownerWindow = getOwnerWindow(root);
  if (isModalElement(root, ownerWindow)) {
    initModal(root);
  }

  for (const modal of root.querySelectorAll<HTMLDialogElement>(modalSelector)) {
    initModal(modal);
  }

  initModalDelegation(root);
}
