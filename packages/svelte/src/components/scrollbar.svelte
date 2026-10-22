<script lang="ts">
  import { onMount } from "svelte";
  import { destroyScrollbar, initScrollbar } from "oreui-web/scrollbar-controller";
  import type { OreComponentProps } from "../types.js";

  export type ScrollbarProps = OreComponentProps<HTMLDivElement>;

  let { children, class: className, ...props }: ScrollbarProps = $props();
  let element: HTMLDivElement;

  export function getElement(): HTMLDivElement {
    return element;
  }

  onMount(() => {
    initScrollbar(element);
    return () => destroyScrollbar(element);
  });
</script>

<div bind:this={element} class={`ore-scrollbar ${className ?? ""}`} {...props}>
  {@render children?.()}
</div>