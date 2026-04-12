"use client";

// Reusable hook for desktop drag-to-scroll interactions.
// It finds the right scroll target, tracks drag state, and suppresses clicks after a drag.

import {
  useCallback,
  useEffect,
  useRef,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

// Checks whether an element can actually scroll on the requested axis.
function isScrollable(element: HTMLElement, axis: "x" | "y") {
  const style = window.getComputedStyle(element);
  const overflowValue = axis === "x" ? style.overflowX : style.overflowY;
  const canScroll = /(auto|scroll|overlay)/.test(overflowValue);
  const hasOverflow =
    axis === "x"
      ? element.scrollWidth > element.clientWidth + 1
      : element.scrollHeight > element.clientHeight + 1;

  return canScroll && hasOverflow;
}

// Walks up the DOM to find the nearest usable scroll container.
function findScrollableTarget(element: HTMLElement | null, axis: "x" | "y") {
  if (element && isScrollable(element, axis)) {
    return element;
  }

  let current = element?.parentElement ?? null;

  while (current) {
    if (isScrollable(current, axis)) {
      return current;
    }

    current = current.parentElement;
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

type MouseDragScrollOptions = {
  axis?: "x" | "y";
  onDragStart?: (scrollTarget: HTMLElement) => void;
  onDragEnd?: (scrollTarget: HTMLElement) => void;
  allowInteractiveChildren?: boolean;
};

// Provides pointer handlers that turn mouse drags into scroll movement.
export function useMouseDragScroll<T extends HTMLElement>(
  options: MouseDragScrollOptions = {},
) {
  const axis = options.axis ?? "y";
  const onDragStart = options.onDragStart;
  const onDragEnd = options.onDragEnd;
  const allowInteractiveChildren = options.allowInteractiveChildren ?? false;
  const containerRef = useRef<T | null>(null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const scrollStartTopRef = useRef(0);
  const previousUserSelectRef = useRef("");

  // Clears drag state and restores any temporary selection or snapping changes.
  const finishPointerDrag = useCallback(() => {
    const scrollTarget = scrollTargetRef.current;

    activePointerIdRef.current = null;
    scrollTargetRef.current = null;
    document.body.style.userSelect = previousUserSelectRef.current;

    if (scrollTarget) {
      onDragEnd?.(scrollTarget);
    }
  }, [onDragEnd]);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current || event.pointerType !== "mouse") {
        return;
      }

      const scrollTarget = scrollTargetRef.current;
      if (!scrollTarget) {
        finishPointerDrag();
        return;
      }

      const delta =
        axis === "x"
          ? event.clientX - dragStartXRef.current
          : event.clientY - dragStartYRef.current;
      if (Math.abs(delta) > 3) {
        didDragRef.current = true;
      }

      // Move the scroll position opposite the pointer delta for direct-manipulation drag.
      if (axis === "x") {
        scrollTarget.scrollLeft = scrollStartLeftRef.current - delta;
      } else {
        scrollTarget.scrollTop = scrollStartTopRef.current - delta;
      }
    };

    const handleWindowPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current || event.pointerType !== "mouse") {
        return;
      }

      finishPointerDrag();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [axis, finishPointerDrag]);

  const handlePointerDown = (event: ReactPointerEvent<T>) => {
    didDragRef.current = false;

    // Only mouse drags opt into this behavior; touch keeps native scrolling.
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    // Interactive children keep their normal click behavior unless explicitly allowed.
    if (
      !allowInteractiveChildren &&
      target?.closest("button, a, input, select, textarea, label")
    ) {
      return;
    }

    const scrollTarget = findScrollableTarget(containerRef.current, axis);
    if (!scrollTarget) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    scrollTargetRef.current = scrollTarget;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    scrollStartLeftRef.current = scrollTarget.scrollLeft;
    scrollStartTopRef.current = scrollTarget.scrollTop;
    previousUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    onDragStart?.(scrollTarget);
  };

  const handlePointerMove = (event: ReactPointerEvent<T>) => {
    void event;
  };

  const handlePointerUp = (event: ReactPointerEvent<T>) => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    finishPointerDrag();
  };

  const handleClickCapture = (event: ReactMouseEvent<T>) => {
    if (!didDragRef.current) {
      return;
    }

    // Prevent accidental clicks after the user was actually dragging.
    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  };

  const handleDragStart = (event: ReactDragEvent<T>) => {
    event.preventDefault();
  };

  return {
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleClickCapture,
    handleDragStart,
  };
}
