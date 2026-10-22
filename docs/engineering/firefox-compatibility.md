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
  reproducible Marionette run. The run covered two-axis clamp, programmatic
  scroll synchronization, real End/Home keys, pointer capture and dragging,
  destroy/native fallback, and reinitialization. Evidence remains limited to the
  cases listed under "Not verified".

## Verified mechanics in the current tree

The component is untranspiled TypeScript plus CSS under `src/components/scrollbar/`.
All statements below refer to that working tree, not to a published package.

Browser evidence is narrower than the code-reading statements below. The
first recorded execution evidence is the reproducible Marionette run documented
under "Firefox reproducible evidence (2026-10-22)" below: Firefox Developer
Edition 159.0b5 driven by direct four-element Marionette framing, with a
fixture that loaded built `dist` CSS and module artifacts. The separate
interaction run is documented under "Firefox interaction evidence" below.
Earlier attempts mentioned in this document's history were withdrawn because
they retained no artifact or numeric measurement. The first run does not cover RTL/zoom or console output. The separate Chromium regression evidence below covers the native path and
keyboard behavior, but not pixel-level visual parity.

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
  repository. The recorded Marionette runs below are targeted execution
  evidence, not full component coverage; the other statements are code reading.
- No version matrix for Firefox Developer Edition, Firefox stable, Chrome, or
  Safari. Do not publish version ranges or "supported" labels without testing.
- Unverified interaction cases: page zoom, RTL, touch dragging, nested or
  horizontal-only containers, high-contrast and reduced-motion settings,
  very large content, and drag behavior during layout changes.
- Not verified in Firefox Developer Edition: visual comparison with Chromium,
  zoom/RTL/layout-change behavior, and console output. The Chromium regression
  check below did not compare pixel-level visual parity.

## Firefox reproducible evidence (2026-10-22)

Environment and method: Firefox Developer Edition 159.0b5, headless, driven
directly over Marionette with four-element framing. The fixture was served from
`%TEMP%` and loaded built `dist` CSS and module artifacts; no repository files
were modified for the run. The retained first-run measurements record branch
`firefox` at commit `4de7c30`.

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

The first-run temporary folder (run date 2026-10-22) was
`%TEMP%\oreui-ff-evidence-final-20261022-111815\`. Its retained measurements
and screenshot supplied the normal/short-track results above. Its
`firefox.log` is a launch log only, not a raw Marionette transcript. The
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

## Firefox interaction evidence (2026-10-22)

A separate headless Marionette run against Firefox Developer Edition 159.0b5
loaded built `dist` CSS and module artifacts and exercised the controller's
interaction paths. The sanitized result and two small screenshots are kept in
[`evidence/firefox/`](evidence/firefox/); the rerun script is
[`repro.py`](evidence/firefox/repro.py). The script uses `OREUI_REPO`,
`OREUI_FIREFOX`, `OREUI_COMMIT`, and `OREUI_MARIONETTE_PORT` environment
variables for local paths and does not copy a browser profile.

- Two-axis clamp: at a 20 × 20 viewport, the vertical track/thumb measured 4 / 4
  px and the horizontal track/thumb 8 / 8 px, so neither thumb exceeded its
  track and travel did not become negative. In `clamp-20x20.png`, the 20 × 20
  control is the small region at the upper-left; the screenshot is not a
  magnified visual comparison.
- Scroll synchronization: programmatic midpoint `[160, 155]` produced
  `translateY(25px)` and `translateX(53.76px)`; the end position was `[320, 310]`
  with `translateY(50px)` and `translateX(107.52px)`, and scroll events were
  observed.
- Keyboard: real WebDriver End from `[0, 0]` reached `[0, 310]`, and Home from
  `[320, 310]` reached `[320, 0]`; both follow the source API's vertical-first
  behavior.
- Pointer drag: vertical drag reached scrollTop 248 with `translateY(40px)`;
  horizontal drag reached scrollLeft 148.15 with `translateX(49.7784px)`.
  `gotpointercapture` and captured pointer moves were observed on both thumbs.
- Lifecycle: destroy removed the initialized marker and overlay tracks while the
  native scrollbar was restored; reinit recreated the overlay.

This is execution evidence for the listed fixture cases only, not a general
Firefox support claim. The compact summary is
[`interaction-result.json`](evidence/firefox/interaction-result.json).

## Firefox component suite evidence (2026-10-22)

A separate Firefox Developer Edition 159.0b5 headless component suite recorded
14 PASS and 0 FAIL against built `dist` artifacts. The compact result is
[`component-suite/results.json`](evidence/firefox/component-suite/results.json),
the small page fixture is [`fixture.html`](evidence/firefox/component-suite/fixture.html),
and the final screenshot is [`components.png`](evidence/firefox/components.png).
The original browser profile, raw Marionette log, and absolute temporary paths
were not copied. The larger runner was also not copied; the fixture documents the
component surface but is not a standalone rerun command.

Coverage groups and methods:

1. CSS bundle, layout, and representative assets: computed CSS, layout boxes,
   and HTTP asset requests.
2. Button click and loading spinner mask: WebDriver click and computed pseudo-style.
3. Checkbox, radio, switch form participation and reset: WebDriver clicks,
   native `FormData`, and native reset.
4. Horizontal and vertical sliders: WebDriver ArrowRight and value/fill checks.
5. Native select and text inputs: WebDriver keys, native events, and validity.
6. Native details accordion disclosure: WebDriver click and native `toggle`.
7. Dropdown: open, keyboard selection, Escape, and outside dismissal through
   WebDriver click/key actions.
8. Tooltip: hover/focus open and Escape close through pointer/key actions; the
   focus path used DOM `focus()`.
9. Dialog: `showModal`, Escape cancel, and form close through WebDriver actions.
10. Toast: open/dismiss API, popover, and live-region semantics through
    Marionette `ExecuteScript`; auto-dismiss was disabled with `data-duration=0`.
11. Tabs/toggles: selection and keyboard navigation through WebDriver actions.
12. Table: sort state and ascending/descending event cycle through WebDriver click.
13. Dynamic components: post-mount `MutationObserver` initialization through
    DOM insertion via `ExecuteScript`.
14. Browser errors and assets: window error collection and HTTP request logs;
    page errors and failed requests were both zero.

This is targeted component acceptance evidence, not a claim that the full
component suite or all browser configurations are supported. It does not replace
RTL, zoom, visual-parity, accessibility-matrix, or broader cross-browser testing.

## Chromium regression evidence (2026-10-22)

A targeted Edge 155 headless run exercised the native Chromium path. Its
sanitized JSON is [`chromium-regression.json`](evidence/firefox/chromium-regression.json).
It recorded `CSS.supports("-moz-appearance", "none") === false`, zero overlay
nodes, retained native `::-webkit-scrollbar*` track/thumb rules, and automatic
native `scrollbarWidth`/`scrollbarColor`. Real keyboard End reached `top=680`
(`maxTop=680`), and Home returned `top=0`. This is a native-path and keyboard
regression check, not a pixel-level visual parity comparison.

## Documentation build verification (2026-10-22)

`pnpm docs:typecheck` and `pnpm docs:build` passed. The build generated 296/296
static pages and completed final optimization. `docs/source.config.ts` uses
`remarkImageOptions.external = false`, which disables build-time size probing
for all remote Markdown images; local images remain handled locally, and the
browser still loads each remote image URL. The build still logged retries for
OG routes and Google Fonts connection timeouts, but completed successfully.

A separate real-page smoke check sampled three documentation pages: each
returned HTTP 200, displayed, and hydrated; the dropdown interaction also opened
successfully. The Scrollbar documentation page currently triggers React #418
when the component is inserted before hydration; its root cause is under review.
This check therefore does not support a claim that the whole documentation site
is error-free.

## Migration log

Append entries; do not rewrite history. An entry is only "Verified" when the
checklist below was run on the named browser build.

| Date       | Area                         | Change                                                                                                                                                         | Verification                            | Notes                                                                                                                              |
| ---------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-22 | Scrollbar docs               | Documented the Firefox overlay gates and the native `scrollbar-color` fallback in the English and Chinese Scrollbar pages; added this engineering record.      | Docs review only                        | No source change. Changelog entry is documentation-only.                                                                           |
| 2026-10-22 | Firefox overlay source       | The existing overlay implementation is present in the working tree.                                                                                            | Code reading only                       | Browser verification remains incomplete outside the fixture cases recorded below.                                                  |
| 2026-10-22 | Scrollbar thumb sizing fix   | Clamp vertical and horizontal thumb lengths so neither exceeds its track, preventing negative travel.                                                          | Firefox automated evidence (Marionette) | Two-axis 20 × 20 case measured V 4/4 and H 8/8 track/thumb; programmatic scroll sync also reached the measured endpoints.          |
| 2026-10-22 | Firefox interaction evidence | Recorded scroll sync, vertical-first End/Home, pointer capture/drag, destroy/native fallback, and reinit behavior with a sanitized result and two screenshots. | Firefox automated evidence (Marionette) | V drag: scrollTop 248, translateY 40; H drag: scrollLeft 148.15, translateX 49.7784. Remaining browser gaps are listed above.      |
| 2026-10-22 | Firefox evidence record      | Replaced the earlier smoke-only statements with reproducible Marionette measurements and repository evidence artifacts.                                        | Evidence run + docs review              | See [`evidence/firefox/`](evidence/firefox/); no browser profile was copied.                                                       |
| 2026-10-22 | Chromium regression          | Checked the native Chromium path and vertical-first keyboard End/Home behavior in Edge 155 headless.                                                           | Chromium automated evidence             | Overlay count 0; native pseudo-element rules retained; pixel-level visual parity was not compared.                                 |
| 2026-10-22 | Documentation build          | Disabled remote Markdown image size probing with `remarkImageOptions.external = false`; retained remote image URLs in browser output.                          | `docs:typecheck` and `docs:build`       | 296/296 static pages generated; OG and Google Fonts requests retried but build completed successfully.                             |
| 2026-10-22 | Firefox component suite      | Recorded the targeted Firefox component acceptance suite with 14 PASS and 0 FAIL, plus a compact result, fixture, and screenshot.                              | Firefox automated evidence (Marionette) | Coverage and method limitations are recorded above; no profile, raw protocol log, or larger runner copied.                         |
| 2026-10-22 | Documentation page smoke     | Sampled three real documentation pages: HTTP 200, visible/hydrated output, and successful dropdown open.                                                       | Real-page browser smoke check           | Scrollbar documentation page currently triggers React #418 before hydration; root cause under review, so no site-wide clean claim. |

## Manual verification checklist

Run against a built docs/dev page containing an overflowing `.ore-scrollbar`.

Firefox Developer Edition:

- [x] With the controller imported, the native scrollbar is hidden and the
      overlay track/thumb are displayed. Verified by the 2026-10-22 evidence:
      both gates true, `scrollbar-width: none`, track visible, 12 × 496 track.
- [ ] The overlay track/thumb match the Chromium pixel layout. Visual comparison
      with Chromium was not run.
- [ ] Wheel keeps the thumb and content in sync. Programmatic scroll sync is
      verified below; real wheel input was not run.
- [x] Keyboard and pointer drag keep the thumb and content in sync. Real End /
      Home and both-axis pointer capture/drag are recorded in the interaction
      evidence.
- [x] Destroying the controller restores a native scrollbar styled by
      `scrollbar-color`, with no orphaned overlay nodes. Destroy/reinit evidence
      records native fallback and overlay recreation.
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

- [x] Native `::-webkit-scrollbar*` rules remain present and the native path
      retains automatic `scrollbarWidth`/`scrollbarColor`; pixel-level visual
      parity was not compared.
- [x] No overlay nodes are created (`CSS.supports("-moz-appearance", "none")`
      is false); Edge 155 headless measured overlay count 0.
- [x] Real keyboard End reaches `top=680`/`maxTop=680`, and Home returns
      `top=0`; broader tabindex coverage remains unverified.
