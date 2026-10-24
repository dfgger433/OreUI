<a name="readme-top"></a>
<div align="center">

<a href="#">
  <img src="docs/public/og-image.png" width="100%">
</a><br>

<h1>
  OreUI
</h1>

<p>
  Unofficial Ore UI framework-independent Vanilla DOM component library.
</p>

[![Pull Requests][github-pr-badge]][github-pr-link]
[![Issues][github-issue-badge]][github-issue-link]
[![License][github-license-badge]](LICENSE)
[![Build][github-build-badge]][github-build-link]
[![Release][github-release-badge]][github-release-link]

**English** · [简体中文](README.zh-CN.md)

</div>


<!-- Main Body -->

## Introduction
OreUI is an unofficial fan-made, CSS-first DOM component library that brings Minecraft's Ore UI visual language to web projects.

Its 25+ components are framework-independent DOM behavior and styling modules. They enhance semantic HTML in place; they are not Lit elements and do not require a Web Component custom-element runtime.

Read the full documentation at [katorly.dev/OreUI](https://katorly.dev/OreUI/docs).

### Features
- **Vanilla core**: Framework-independent DOM APIs for ordinary web documents and browser.xhtml hosts
- **CSS-first**: Semantic HTML receives OreUI styling and behavior; no custom-element registration is required
- **Explicit lifecycle**: Importing the root is pure; call `createOreUIRuntime(root)` and later `destroy()` when ownership ends
- **CSP-friendly**: Load `styles.css` normally, or provide an approved stylesheet sink in a host-controlled integration
- **Accessibility**: Semantic HTML, keyboard support, focus management, and ARIA

### Runtime and support policy

The supported core target is ordinary web content and privileged `browser.xhtml` documents using the same DOM API. Firefox ESR 128+ is the target baseline; the exact ESR/Firefox version matrix is pending verification. Do not infer support for a specific release until the automated browser matrix is green.

The root import is SSR-safe and observationally pure: it does not scan `document`, install observers, or mutate DOM during module evaluation. Create an explicit runtime for an owned root:

```js
import "oreui-web/styles.css";
import { createOreUIRuntime } from "oreui-web/runtime";

const runtime = createOreUIRuntime(document, { observe: true });
runtime.init();

// When the host removes or replaces this root:
runtime.destroy();
```

`root` may be a `Document`, `Element`, or `ShadowRoot`. `observe` defaults to `false`; enable it only when the host wants dynamic subtree initialization and removal cleanup. Calling `destroy()` is idempotent and disconnects the runtime observer.

For strict Content Security Policy deployments, keep CSS loading under host control. A host may load the published `styles.css` with a normal stylesheet URL or copy/adopt its approved contents through a `styleSink` owned by that host; OreUI does not create inline style tags, bypass CSP, or choose a browser-specific injection channel. The exact `styleSink` adapter is host policy, not part of the core runtime API.

The legacy `oreui-web/auto` entry is an explicit compatibility entry that opts into document-wide observation. Prefer the pure root entry plus an owned runtime for applications, SSR, tests, and browser hosts. The `browser` entry is also side-effect-free and is suitable for prebundling; it never auto-initializes.

### Migration

- Replace `import "oreui-web"` as an implicit auto-start contract with `import { createOreUIRuntime } from "oreui-web/runtime"`, then call `init()` on the root you own.
- If migrating from an older wrapper-based integration, use semantic HTML plus `oreui-web/styles.css` and the Vanilla core APIs; the published product surface is now Vanilla-only.
- If you need legacy document-wide behavior temporarily, import `oreui-web/auto` explicitly and treat its observer as application-owned global state.
- Do not copy a browser-chrome experiment into the core: AutoConfig, `resource://` substitutions, iframe `type="content"`, and Firefox-specific privileged bootstrap are excluded from this package. A browser host must provide its own integration boundary and CSP policy.

## Packages
| Package | Version | Downloads | Links |
| ------- | ------- | --------- | ----- |
| <img src="docs/public/frameworks/javascript.svg" alt="" width="16" height="16"> `oreui-web` | [![](https://img.shields.io/npm/v/oreui-web?style=flat-square)](https://www.npmjs.com/package/oreui-web) | [![](https://img.shields.io/npm/dm/oreui-web?style=flat-square)](https://www.npmjs.com/package/oreui-web) | [Docs](https://katorly.dev/OreUI/docs/getting-started/vanilla) · [Source](https://github.com/katorlys/OreUI) |


### Figma
[![oreui_web](https://img.shields.io/badge/@oreui__web-F24E1E?style=flat-square&logo=figma&logoColor=white&label=Figma)](https://www.figma.com/@oreui_web)


## Getting started
Follow the [Vanilla getting started guide](https://katorly.dev/OreUI/docs/getting-started/vanilla), or browse [all components](https://katorly.dev/OreUI/docs/overview).

## Contributing
For information on how to contribute, please refer to the [contributing guidelines](https://katorly.dev/OreUI/docs/contributing).

## Legal notice
OreUI is an **unofficial** fan-made project. It is neither a replacement for the official Ore UI, nor approved by or affiliated with Mojang or Microsoft. When using this project, you must also follow the [Minecraft EULA](https://www.minecraft.net/eula) and any other applicable terms.

This project only takes visual inspiration from the official Ore UI. Except for the fonts, the code and assets in this project were created independently and do not contain source code from the official Ore UI.

## License
OreUI is licensed under [MPL-2.0](https://github.com/katorlys/OreUI/blob/main/LICENSE). Using OreUI as a dependency, or customizing it through themes, CSS, and component properties, generally does not require you to disclose your entire project or license it under MPL-2.0. MPL-2.0 requirements mainly apply to OreUI source files that you modify and distribute. Refer to the full license text for the exact terms.

<!-- /Main Body -->


<div align="right">
  
[![BACK TO TOP][back-to-top-button]](#readme-top)

</div>

---

<div align="center">

<p>
  Copyright &copy; 2026-present <a target="_blank" href="https://github.com/katorlys">Katorly Lab</a>
</p>

[![License][github-license-badge-bottom]](LICENSE)

</div>

[back-to-top-button]: https://img.shields.io/badge/BACK_TO_TOP-151515?style=flat-square
[github-pr-badge]: https://img.shields.io/github/issues-pr/katorlys/OreUI?label=pulls&labelColor=151515&color=79E096&style=flat-square
[github-pr-link]: https://github.com/katorlys/OreUI/pulls
[github-issue-badge]: https://img.shields.io/github/issues/katorlys/OreUI?labelColor=151515&color=FFC868&style=flat-square
[github-issue-link]: https://github.com/katorlys/OreUI/issues
[github-license-badge]: https://img.shields.io/github/license/katorlys/OreUI?labelColor=151515&color=EFEFEF&style=flat-square
<!-- https://img.shields.io/badge/license-CC_BY--NC--SA_4.0-EFEFEF?labelColor=151515&style=flat-square -->
[github-license-badge-bottom]: https://img.shields.io/github/license/katorlys/OreUI?labelColor=151515&color=EFEFEF&style=for-the-badge
<!-- https://img.shields.io/badge/license-CC_BY--NC--SA_4.0-EFEFEF?labelColor=151515&style=for-the-badge -->
[github-build-badge]: https://img.shields.io/github/actions/workflow/status/katorlys/OreUI/release.yml?labelColor=151515&style=flat-square
[github-build-link]: https://github.com/katorlys/OreUI/actions/workflows/release.yml
[github-release-badge]: https://img.shields.io/github/v/release/katorlys/OreUI?include_prereleases&labelColor=151515&color=8DD1E0&style=flat-square
[github-release-link]: https://github.com/katorlys/OreUI/releases/latest
