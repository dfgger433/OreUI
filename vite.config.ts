import { resolve } from "node:path";

import { defineConfig } from "vite";

import { getComponents } from "./scripts/components.js";

const root = import.meta.dirname;
const components = Object.fromEntries(
  getComponents(root).map((name) => [
    `components/${name}/${name}`,
    resolve(root, `src/components/${name}/${name}.ts`),
  ]),
);

export default defineConfig({
  root: "demo",
  resolve: {
    alias: [
      {
        find: /^oreui-web\/(.+)$/,
        replacement: `${root}/src/components/$1/$1.ts`,
      },
      {
        find: "oreui-web",
        replacement: `${root}/src/index.ts`,
      },
    ],
  },
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(root, "src/index.ts"),
        runtime: resolve(root, "src/runtime/runtime.ts"),
        "runtime/runtime": resolve(root, "src/runtime/runtime.ts"),
        auto: resolve(root, "src/auto.ts"),
        browser: resolve(root, "src/browser.ts"),
        ...components,
      },
      formats: ["es"],
    },
    rolldownOptions: {
      external: [/^lit(?:\/|$)/],
    },
  },
});
