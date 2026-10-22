# Firefox compatibility

Status: initial record with reproducible Firefox evidence. This document
describes only mechanics present in the current working tree and the
measurements recorded below. It is not a general Firefox support statement and
does not replace manual browser verification.

Last updated: 2026-10-22

## Scope and priority

- Primary target: Firefox Developer Edition.
- Secondary constraint: preserve existing Chrome/Chromium rendering and behavior.
- The scrollbar thumb-size clamp is implemented in the current source tree and
  was exercised in Firefox Developer Edition 159.0b5 on 2026-10-22 with a
  reproducible Marionette run. The run measured a normal overlay and a short
  host, and all six recorded assertions passed. Evidence remains limited to the
  cases listed under "Not verified".

## Verified mechanics in the current tree

The component is untranspiled TypeScript plus CSS under `src/components/scrollbar/`.
All statements below refer to that working tree, not to a published package.

Browser evidence is narrower than the code-reading statements below. The only
execution evidence in this record is the reproducible Marionette run documented
under "Firefox reproducible evidence (2026-10-22)" below: Firefox Developer
Edition 159.0b5 driven by direct four-element Marionette framing, with a
fixture that loaded the checked-in `dist` CSS and module. Earlier attempts
mentioned in this document's history were withdrawn because they retained no
artifact or numeric measurement. The run does not cover pointer drag, keyboard,
native-fallback restoration, RTL/zoom, Chromium visual regression, or console
output.

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

- No automated cross-browser test suite for this component exists in the
  repository. The 2026-10-22 Marionette run below is the only execution evidence
  recorded here; the other statements are code reading, not execution results.
- No version matrix for Firefox Developer Edition, Firefox stable, Chrome, or
  Safari. Do not publish version ranges or "supported" labels without testing.
- Unverified interaction cases: page zoom, RTL, touch dragging, nested or
  horizontal-only containers, high-contrast and reduced-motion settings,
  very large content, and drag behavior during layout changes.
- Not verified in Firefox Developer Edition: native-scrollbar restoration after
  removing the controller, pointer dragging, keyboard scrolling, wheel-driven
  synchronization, visual comparison with Chromium, zoom/RTL/layout-change
  behavior, and the Chromium regression pass. Console output was not examined.

## Firefox reproducible evidence (2026-10-22)

Environment and method: Firefox Developer Edition 159.0b5, headless, driven
directly over Marionette with four-element framing. The fixture was served from
`%TEMP%` and loaded the checked-in `dist` CSS and module; no repository files
were modified for the run. `results.json` records branch `firefox` at commit
`4de7c30`.

Measurements for the vertical overlay:

| Case   | Host / client height | scrollHeight | Vertical track | Vertical thumb        |
| ------ | -------------------- | ------------ | -------------- | --------------------- |
| normal | 500 / 496            | 1808         | 12 × 496       | 12 × 136.0667, top 59 |
| short  | 18 / 14              | 1808         | 12 × 14        | 12 × 14, top 59       |

After setting `scrollTop = scrollHeight`:

| Case   | scrollTop | maxScrollTop | Thumb bottom | Track bottom |
| ------ | --------- | ------------ | ------------ | ------------ |
| normal | 1312      | 1312         | 555.000015   | 555          |
| short  | 1794      | 1794         | 73           | 73           |

All six recorded assertions passed: `firefoxGateActive`,
`normalThumbWithinTrack`, `shortTrackBelowConfiguredMinimum`,
`shortThumbClampedToTrack`, `normalProgrammaticScrollReachedMax`, and
`shortProgrammaticScrollReachedMax`. In particular, the short track is 14 px,
below the configured 24 px minimum, and its thumb is still clamped to the
12 × 14 track. The gate assertion covers the CSS and JavaScript
`-moz-appearance` checks, `scrollbar-width: none`, and a displayed, non-hidden
track.

### Evidence folder and rerun

Stable evidence folder (run date 2026-10-22):
`%TEMP%\oreui-ff-evidence-final-20261022-111815\`. It contains `results.json`,
the raw Marionette run log `firefox.log`, the screenshot
`firefox-short-host.png`, and the rerun script `run-firefox-test.mjs`. The
screenshot SHA-256 is
`d9268910ff0bde05d870331fc086acd2e928fdf70d357283d3a77888c539746b`.

The folder is under `%TEMP%` only. It is not a repository artifact, and none of
its files are committed. To reproduce, build `dist`, then run:

```sh
node "%TEMP%\oreui-ff-evidence-final-20261022-111815\run-firefox-test.mjs"
```

The script hard-codes the repository, Firefox executable, and profile paths
recorded in `results.json`, starts its own fixture server on a free loopback
port, and fails when any assertion is false.

## Migration log

Append entries; do not rewrite history. An entry is only "Verified" when the
checklist below was run on the named browser build.

| Date       | Area                       | Change                                                                                                                                                    | Verification                            | Notes                                                                                                                                                                                                                                      |
| ---------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-22 | Scrollbar docs             | Documented the Firefox overlay gates and the native `scrollbar-color` fallback in the English and Chinese Scrollbar pages; added this engineering record. | Docs review only                        | No source change. Changelog entry is documentation-only.                                                                                                                                                                                   |
| 2026-10-22 | Firefox overlay source     | The existing overlay implementation is present in the working tree.                                                                                       | Code reading only                       | Browser verification remains incomplete.                                                                                                                                                                                                   |
| 2026-10-22 | Scrollbar thumb sizing fix | Clamp vertical and horizontal thumb lengths so neither exceeds its track, preventing negative travel.                                                     | Firefox automated evidence (Marionette) | Short track is 12 × 14, below the configured 24 px minimum, and the thumb clamps to 12 × 14. Normal and short programmatic scroll both reached max with the thumb at the track end. Pointer drag, keyboard, and console remain unverified. |
| 2026-10-22 | Firefox evidence record    | Replaced the earlier smoke-only statements with the reproducible Marionette measurements, screenshots, and assertions.                                    | Evidence run + docs review              | Evidence folder `%TEMP%\oreui-ff-evidence-final-20261022-111815\` (not a repo artifact); screenshot SHA-256 `d9268910ff0bde05d870331fc086acd2e928fdf70d357283d3a77888c539746b`.                                                            |

## Manual verification checklist

Run against a built docs/dev page containing an overflowing `.ore-scrollbar`.

Firefox Developer Edition:

- [x] With the controller imported, the native scrollbar is hidden and the
      overlay track/thumb are displayed. Verified by the 2026-10-22 evidence:
      both gates true, `scrollbar-width: none`, track visible, 12 × 496 track.
- [ ] The overlay track/thumb match the Chromium pixel layout. Visual comparison
      with Chromium was not run.
- [ ] Wheel, keyboard, and pointer drag keep the thumb and content in sync.
- [ ] Removing the controller import restores a native scrollbar styled by
      `scrollbar-color`, with no orphaned overlay nodes.
- [ ] Vertical and horizontal overflow, both together, and neither.
- [x] Short-track clamp: after the host is resized to a short track, the thumb
      length never exceeds the track. Verified: 12 × 14 track, below the
      configured 24 px minimum; 12 × 14 thumb, clamped to the track.
- [x] Programmatic `scrollTop = scrollHeight` reaches max and leaves the thumb
      at the track end. Verified: normal 1312/1312 with thumb bottom 555.000015
      and track bottom 555; short 1794/1794 with thumb bottom 73 and track
      bottom 73.
- [ ] RTL, zoom, and a container resized after initialization.

Chrome/Chromium (regression):

- [ ] `::-webkit-scrollbar*` rendering is unchanged from the pre-task build.
- [ ] No overlay nodes are created (`CSS.supports("-moz-appearance", "none")`
      is false).
- [ ] Keyboard and tabindex behavior is unchanged.
