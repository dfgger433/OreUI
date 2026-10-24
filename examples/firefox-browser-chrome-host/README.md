# Firefox browser.xhtml host example

This example shows the host boundary for using the Vanilla OreUI core in a privileged `browser.xhtml` document. It deliberately contains no machine-specific paths, AutoConfig, `resource://` substitution, iframe bootstrap, or Firefox profile setup.

## Host responsibilities

1. Resolve the published `oreui-web` package using the host's module loader.
2. Load `oreui-web/styles.css` using the host's CSP-approved stylesheet policy.
3. Choose an owned `Document`, `Element`, or `ShadowRoot` as the runtime root.
4. Call `runtime.init()` after the host markup exists.
5. Call `runtime.destroy()` before removing or replacing that root.

Ordinary web pages and `browser.xhtml` use the same DOM runtime. The core does not detect privileged documents, scan a global document during import, or install a global observer.

## Minimal host adapter

```js
import { createOreUIRuntime } from "oreui-web/browser";

export function mountOreUIBrowserHost({
  document,
  root = document.documentElement,
  loadStyles,
}) {
  // The host owns CSP/style loading. `loadStyles` may use a permitted link,
  // adoptedStyleSheet, or another policy-approved style sink.
  loadStyles("oreui-web/styles.css");

  const runtime = createOreUIRuntime(root, { observe: true });
  runtime.init();
  return () => runtime.destroy();
}
```

`loadStyles` is intentionally supplied by the host. OreUI does not create inline styles, bypass CSP, or prescribe a `styleSink` implementation.

## Browser-specific integration stays outside core

The following are host concerns and are not part of this example or the `oreui-web` package:

- AutoConfig files and startup preferences
- `resource://` protocol substitutions
- privileged chrome-to-content iframe setup
- iframe `type="content"`
- profile, runtime, or formal Firefox installation paths

If a host needs an iframe, it should establish and test that boundary separately, then pass the iframe's owned document or root to `createOreUIRuntime`. Do not assume the core runtime configures navigation or security boundaries for the host.

## Lifecycle notes

The default runtime option is `observe: false`; use `true` only when the host wants dynamic subtree initialization and removal cleanup. `destroy()` is safe to call more than once and disconnects the runtime observer before cleaning initialized component state.
