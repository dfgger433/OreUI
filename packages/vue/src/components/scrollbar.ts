import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type ComponentPublicInstance,
} from "vue";
import {
  destroyScrollbar,
  initScrollbar,
} from "oreui-web/scrollbar-controller";

export const Scrollbar = defineComponent({
  name: "Scrollbar",
  inheritAttrs: false,
  setup(_, { attrs, expose, slots }) {
    let element: HTMLDivElement | undefined;

    expose({
      get element() {
        return element;
      },
    });

    onMounted(() => {
      if (element) {
        initScrollbar(element);
      }
    });
    onBeforeUnmount(() => {
      if (element) {
        destroyScrollbar(element);
      }
    });

    return () =>
      h(
        "div",
        {
          ...attrs,
          ref: (value: Element | ComponentPublicInstance | null) => {
            element = value instanceof HTMLDivElement ? value : undefined;
          },
          class: ["ore-scrollbar", attrs.class],
        },
        slots.default?.(),
      );
  },
});
