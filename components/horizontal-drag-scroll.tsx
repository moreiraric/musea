"use client";

// Horizontal drag-scroll wrapper used by rows, carousels, and chip lists.
// It reuses the shared mouse-drag hook and can temporarily disable snapping while dragging.

import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import { useMouseDragScroll } from "@/components/use-mouse-drag-scroll";

type HorizontalDragScrollProps = HTMLAttributes<HTMLDivElement> & {
  disableSnapWhileDragging?: boolean;
};

// Renders a drag-scrollable div while forwarding the underlying DOM ref.
export const HorizontalDragScroll = forwardRef<HTMLDivElement, HorizontalDragScrollProps>(
  function HorizontalDragScroll(
    { className, disableSnapWhileDragging = false, children, ...props },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLDivElement | null>(null);
    const previousSnapTypeRef = useRef("");
    const previousScrollBehaviorRef = useRef("");
    const {
      containerRef,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleClickCapture,
      handleDragStart,
    } = useMouseDragScroll<HTMLDivElement>({
      axis: "x",
      allowInteractiveChildren: true,
      onDragStart: disableSnapWhileDragging
        ? (scrollTarget) => {
            // Snap and smooth scrolling are restored after drag end.
            previousSnapTypeRef.current = scrollTarget.style.scrollSnapType;
            previousScrollBehaviorRef.current = scrollTarget.style.scrollBehavior;
            scrollTarget.style.scrollSnapType = "none";
            scrollTarget.style.scrollBehavior = "auto";
          }
        : undefined,
      onDragEnd: disableSnapWhileDragging
        ? (scrollTarget) => {
            scrollTarget.style.scrollSnapType = previousSnapTypeRef.current;
            scrollTarget.style.scrollBehavior = previousScrollBehaviorRef.current;
          }
        : undefined,
    });

    // Supports both callback refs and mutable refs from parent components.
    const assignRef = (ref: Ref<HTMLDivElement> | undefined, node: HTMLDivElement | null) => {
      if (!ref) {
        return;
      }

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      ref.current = node;
    };

    // Keeps the hook ref and forwarded ref pointed at the same element.
    const setRef = (node: HTMLDivElement | null) => {
      localRef.current = node;
      containerRef.current = node;
      assignRef(forwardedRef, node);
    };

    return (
      <div
        {...props}
        ref={setRef}
        className={["cursor-grab active:cursor-grabbing", className].filter(Boolean).join(" ")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onDragStart={handleDragStart}
      >
        {children}
      </div>
    );
  },
);
