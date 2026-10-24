import { createOreUIRuntime } from "oreui-web/browser";

/**
 * Mount the core into a host-owned browser.xhtml root.
 * The host supplies stylesheet loading so CSP policy remains explicit.
 */
export function mountOreUIBrowserHost({
  document,
  root = document.documentElement,
  loadStyles,
}) {
  loadStyles("oreui-web/styles.css");
  const runtime = createOreUIRuntime(root, { observe: true });
  runtime.init();
  return () => runtime.destroy();
}
