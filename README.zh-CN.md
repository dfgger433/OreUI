<a name="readme-top"></a>
<div align="center">

<a href="#">
  <img src="docs/public/og-image.png" width="100%">
</a><br>

<h1>
  OreUI
</h1>

<p>
  非官方 Ore UI Vanilla DOM 组件库，将 Ore UI 设计系统应用到您的项目中。
</p>

[![Pull Requests][github-pr-badge]][github-pr-link]
[![Issues][github-issue-badge]][github-issue-link]
[![License][github-license-badge]](LICENSE)
[![Build][github-build-badge]][github-build-link]
[![Release][github-release-badge]][github-release-link]

[English](README.md) · **简体中文**

</div>


<!-- Main Body -->

## 介绍
OreUI 是一个非官方粉丝向的组件库，将 Minecraft 的 Ore UI 设计系统应用到您的 Web 项目中。

包含超过 25 个组件，为语义化 HTML 提供与框架无关的 DOM 行为和样式。

完整文档请访问 [katorly.dev/OreUI](https://katorly.dev/OreUI/docs)。

### 特性
- **Vanilla 核心**：为普通 Web 文档和 Firefox 浏览器宿主提供与框架无关的 DOM API
- **CSS 优先**：为语义化 HTML 提供 OreUI 样式和行为
- **生命周期明确**：按宿主生命周期创建并销毁受管理的运行时
- **自定义程度高**：使用 CSS 变量、TailwindCSS、PandaCSS 和 Props 进行自定义
- **无障碍**：支持语义化 HTML、键盘操作、焦点管理和 ARIA

## 软件包
| 软件包 | 版本 | 下载量 | 链接 |
| ------ | ---- | ------ | ---- |
| <img src="docs/public/frameworks/javascript.svg" alt="" width="16" height="16"> `oreui-web` | [![](https://img.shields.io/npm/v/oreui-web?style=flat-square)](https://www.npmjs.com/package/oreui-web) | [![](https://img.shields.io/npm/dm/oreui-web?style=flat-square)](https://www.npmjs.com/package/oreui-web) | [文档](https://katorly.dev/OreUI/docs/getting-started/vanilla) · [源码](https://github.com/katorlys/OreUI) |


### Figma
[![oreui_web](https://img.shields.io/badge/@oreui__web-F24E1E?style=flat-square&logo=figma&logoColor=white&label=Figma)](https://www.figma.com/@oreui_web)

### 迁移说明

- 将隐式自动启动的 `import "oreui-web"` 替换为 `import { createOreUIRuntime } from "oreui-web/runtime"`，然后在宿主拥有的根节点上调用 `init()`。
- 如果从旧版包装器集成迁移，请改用语义化 HTML、`oreui-web/styles.css` 和 Vanilla 核心 API；当前发布的产品表面仅支持 Vanilla。
- 如需暂时保留旧的全局文档行为，请显式导入 `oreui-web/auto`，并将其 observer 视为应用拥有的全局状态。

## 开始使用
请参阅 [Vanilla 快速开始指南](https://katorly.dev/OreUI/zh-CN/docs/getting-started/vanilla)，或浏览[所有组件](https://katorly.dev/OreUI/docs/overview)。

## 参与贡献
向 OreUI 贡献代码，请访问[贡献指南](https://katorly.dev/OreUI/docs/contributing)。

## 法律声明
OreUI 是一个**非官方**的爱好者项目，不是官方 Ore UI 的替代产品，也未经 Mojang 或 Microsoft 批准或关联。使用本项目时，请同时遵守 [Minecraft EULA](https://www.minecraft.net/eula) 及其他适用条款。

本项目只参考官方 Ore UI 的视觉风格。除字体外，项目中的代码和资源均为独立制作，不包含官方 Ore UI 的源代码。

## 许可证
OreUI 使用 [MPL-2.0 许可证](https://github.com/katorlys/OreUI/blob/main/LICENSE)。仅将 OreUI 作为项目依赖，或通过主题、CSS 和组件属性进行自定义，一般不需要公开您的整个项目，也不要求您的项目使用 MPL-2.0。MPL-2.0 的要求主要适用于您修改并分发的 OreUI 源文件。具体情况请以完整的许可证文本为准。

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
