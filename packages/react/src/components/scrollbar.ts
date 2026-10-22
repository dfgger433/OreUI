import React, { useCallback, useEffect, useRef } from "react";
import {
  destroyScrollbar,
  initScrollbar,
} from "oreui-web/scrollbar-controller";

export type ScrollbarProps = React.HTMLAttributes<HTMLDivElement>;

export const Scrollbar = React.forwardRef<HTMLDivElement, ScrollbarProps>(
  function Scrollbar(props, ref) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const setRef = useCallback(
      (element: HTMLDivElement | null) => {
        elementRef.current = element;

        if (typeof ref === "function") {
          return ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref],
    );

    useEffect(() => {
      const element = elementRef.current;

      if (!element) {
        return;
      }

      initScrollbar(element);
      return () => destroyScrollbar(element);
    }, [ref]);

    return React.createElement("div", {
      ...props,
      ref: setRef,
      className: props.className
        ? `ore-scrollbar ${props.className}`
        : "ore-scrollbar",
    });
  },
);
