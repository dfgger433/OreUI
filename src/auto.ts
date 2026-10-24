import { createOreUIRuntime } from "./runtime/runtime.js";

export { createOreUIRuntime } from "./runtime/runtime.js";

const root = typeof document !== "undefined" ? document : null;

export const oreUIRuntime = root
  ? createOreUIRuntime(root, { observe: true })
  : null;

oreUIRuntime?.init();
