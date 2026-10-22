# Firefox compatibility

Status: initial record. This document describes only mechanics present in the
current working tree. It is not a general Firefox support statement and does not
replace manual browser verification.

Last updated: 2026-10-22

## Scope and priority

- Primary target: Firefox Developer Edition.
- Secondary constraint: preserve existing Chrome/Chromium rendering and behavior.
- The scrollbar thumb-size clamp is implemented in the current source tree.
  Browser evidence is limited to the in-memory visual smoke observation
  recorded below: no screenshot was retained and no numeric sizes were
  measured, so this record does not claim Firefox compatibility is verified.

## Verified mechanics in the current tree

The component is untranspiled TypeScript plus CSS under `src/components/scrollbar/`.
All statements below refer to that working tree, not to a published package.

Browser evidence is narrower than the code-reading statements below. Two
automation paths were attempted on 2026-10-22 and both proved unstable: a
Marionette DOM evaluation and a Playwright persistent launch that timed out
after 180 s; the headless fallback produced no screenshot. The fixture was
served at `http://127.0.0.1:8765/index.html` from a temporary directory under
`%TEMP%`, loading the real `dist` CSS and module; the server has since been shut
down. What remains confirmable is only the in-memory observation in Firefox
Developer Edition: the CSS and JavaScript `-moz-appearance` gates both evaluate
true, the controller initializes the scrollbar overlay, and the custom track is
displayed. No screenshot artifact was retained, and no numeric measurement,
short-track bound, scroll synchronization, drag, keyboard, or console result is
verified. An earlier version of this record carried a numeric track/thumb table;
those numbers are withdrawn here because no artifact retained for this session
supports them.

| Area                   | Verified behavior                                                                                                                                                                                                                                                                                                                                               | Source                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native container       | `.ore-scrollbar` is a real overflow container (`overflow: auto`); wheel, touch, and scroll position stay on it.                                                                                                                                                                                                                                                 | [`scrollbar.css`](../../src/components/scrollbar/scrollbar.css#L19-L21)                                                                          |
| Chromium/Safari path   | `::-webkit-scrollbar*` rules style the native scrollbar with the layered track/thumb gradients outside any Firefox-only feature query.                                                                                                                                                                                                                          | [`scrollbar.css`](../../src/components/scrollbar/scrollbar.css#L124-L209)                                                                        |
| Firefox gate (CSS)     | Overlay rules are inside `@supports (scrollbar-color: red blue) and (-moz-appearance: none)`. Engines without `-moz-appearance` do not enter the block, so the Chromium/Safari fallback path is untouched.                                                                                                                                                      | [`scrollbar.css`](../../src/components/scrollbar/scrollbar.css#L23-L122)                                                                         |
| Firefox gate (JS)      | The controller creates an overlay only when `CSS.supports("-moz-appearance", "none")` returns true.                                                                                                                                                                                                                                                             | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L25-L27)                                                                            |
| Native fallback        | Without the controller, the initialized-state rules are absent, so Firefox keeps a native scrollbar with `scrollbar-color` mapped to `--ore-scrollbar-thumb-background` and `--ore-scrollbar-track`.                                                                                                                                                            | [`scrollbar.css`](../../src/components/scrollbar/scrollbar.css#L23-L28)                                                                          |
| Overlay DOM            | Two tracks are inserted (`vertical` prepended, `horizontal` appended), each containing an absolutely positioned thumb; tracks and thumbs are `aria-hidden`.                                                                                                                                                                                                     | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L29-L62)                                                                            |
| Overlay layout         | On initialization the container becomes `position: relative`, native colors become transparent, `scrollbar-width: none` hides the native bar, tracks use `position: sticky` and `pointer-events: none`, thumbs use `pointer-events: auto`.                                                                                                                      | [`scrollbar.css`](../../src/components/scrollbar/scrollbar.css#L30-L121)                                                                         |
| Sizing                 | Track sizes come from `clientHeight`/`clientWidth` plus the CSS variables, and exclude the perpendicular track when overflow exists; thumbs use a minimum size and proportional length, clamped to the track length to prevent negative travel. Track sizes are published as `--ore-scrollbar-vertical-track-size` and `--ore-scrollbar-horizontal-track-size`. | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L75-L139)                                                                           |
| Position sync          | Passive `scroll`, `ResizeObserver`, and `MutationObserver` update thumb transforms; an initial microtask sync covers first paint.                                                                                                                                                                                                                               | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L311-L355)                                                                          |
| Pointer dragging       | Pointer down/move/up/cancel on the thumb use `setPointerCapture`, `preventDefault`, and direct `scrollTop`/`scrollLeft` updates.                                                                                                                                                                                                                                | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L183-L266)                                                                          |
| Keyboard and tabindex  | Overflowing regions receive `tabindex="0"`, non-overflowing regions `tabindex="-1"`, authored `tabindex` is preserved, and Arrow/Page/Home/End handling applies only when the region itself has focus.                                                                                                                                                          | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L137-L155), [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L268-L309) |
| Teardown and auto-init | Track nodes, style properties, listeners, and observers are removed on destroy; module import initializes existing and later-added `.ore-scrollbar` elements.                                                                                                                                                                                                   | [`scrollbar.ts`](../../src/components/scrollbar/scrollbar.ts#L357-L419)                                                                          |

## Not verified

- No automated cross-browser tests for this component were found in the
  repository. Apart from the 2026-10-22 visual smoke observation below, the
  statements above are code reading, not execution results.
- No version matrix for Firefox Developer Edition, Firefox stable, Chrome, or
  Safari. Do not publish version ranges or "supported" labels without testing.
- Unverified interaction cases: page zoom, RTL, touch dragging, nested or
  horizontal-only containers, high-contrast and reduced-motion settings,
  very large content, and drag behavior during layout changes.
- Not verified in Firefox Developer Edition: native-scrollbar restoration after
  removing the controller, pointer dragging, keyboard scrolling, normal
  scroll-position synchronization, visual comparison with Chromium,
  zoom/RTL/layout-change behavior, and the Chromium regression pass. The visual
  smoke observation below did not exercise any of these.

## Firefox visual smoke observation (2026-10-22)

Environment: Firefox Developer Edition 159.0b5. Fixture: temporary page under
`%TEMP%` served at `http://127.0.0.1:8765/index.html`, loading the real `dist`
CSS and module; it was not added to the repository, no repository files were
modified, and the local server has since been shut down.

Observed in memory only:

- `CSS.supports("scrollbar-color: red blue")` and
  `CSS.supports("-moz-appearance", "none")` both returned true.
- The controller initialized the overlay on `.ore-scrollbar`.
- The custom track and thumb elements were displayed.

Not observed or not retained:

- No screenshot artifact was kept and no numeric track/thumb sizes were
  recorded; the short-track clamp bound is not verified.
- Scroll-position synchronization, pointer dragging, keyboard scrolling, and
  console output were not checked.
- Native-fallback restoration, visual/pixel comparison with Chromium, zoom/RTL
  behavior, and the Chromium regression pass remain pending.

## Migration log

Append entries; do not rewrite history. An entry is only "Verified" when the
checklist below was run on the named browser build.

| Date       | Area                       | Change                                                                                                                                                    | Verification                                      | Notes                                                                                                                      |
| ---------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-22 | Scrollbar docs             | Documented the Firefox overlay gates and the native `scrollbar-color` fallback in the English and Chinese Scrollbar pages; added this engineering record. | Docs review only                                  | No source change. Changelog entry is documentation-only.                                                                   |
| 2026-10-22 | Firefox overlay source     | The existing overlay implementation is present in the working tree.                                                                                       | Code reading only                                 | Browser verification remains incomplete.                                                                                   |
| 2026-10-22 | Scrollbar thumb sizing fix | Clamp vertical and horizontal thumb lengths so neither exceeds its track, preventing negative travel.                                                     | Firefox visual smoke (in-memory observation only) | No screenshot artifact retained and no numeric size evidence. Scroll sync, drag, keyboard, and console results unverified. |

## Manual verification checklist

Run against a built docs/dev page containing an overflowing `.ore-scrollbar`.

Firefox Developer Edition:

- [ ] With the controller imported, the native scrollbar is hidden and the
      overlay track/thumb match the Chromium pixel layout.
- [ ] Wheel, keyboard, and pointer drag keep the thumb and content in sync.
- [ ] Removing the controller import restores a native scrollbar styled by
      `scrollbar-color`, with no orphaned overlay nodes.
- [ ] Vertical and horizontal overflow, both together, and neither.
- [ ] Short-track clamp: after the host is resized to a short track, the thumb
      length never exceeds the track. Pending numeric size check; no size
      evidence is recorded in this document.
- [ ] RTL, zoom, and a container resized after initialization.

Chrome/Chromium (regression):

- [ ] `::-webkit-scrollbar*` rendering is unchanged from the pre-task build.
- [ ] No overlay nodes are created (`CSS.supports("-moz-appearance", "none")`
      is false).
- [ ] Keyboard and tabindex behavior is unchanged.
