"use client";

import { useRef, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";

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
};

export function useMouseDragScroll<T extends HTMLElement>(
  options: MouseDragScrollOptions = {},
) {
  const axis = options.axis ?? "y";
  const onDragStart = options.onDragStart;
  const onDragEnd = options.onDragEnd;
  const containerRef = useRef<T | null>(null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const scrollStartTopRef = useRef(0);
  const previousUserSelectRef = useRef("");

  const finishPointerDrag = (element?: T | null) => {
    const scrollTarget = scrollTargetRef.current;

    if (
      element &&
      activePointerIdRef.current !== null &&
      element.hasPointerCapture(activePointerIdRef.current)
    ) {
      element.releasePointerCapture(activePointerIdRef.current);
    }

    activePointerIdRef.current = null;
    scrollTargetRef.current = null;
    document.body.style.userSelect = previousUserSelectRef.current;

    if (scrollTarget) {
      onDragEnd?.(scrollTarget);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<T>) => {
    didDragRef.current = false;

    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, label")) {
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
    event.currentTarget.setPointerCapture(event.pointerId);
    onDragStart?.(scrollTarget);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<T>) => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    const scrollTarget = scrollTargetRef.current;
    if (!scrollTarget) {
      finishPointerDrag(event.currentTarget);
      return;
    }

    const delta =
      axis === "x"
        ? event.clientX - dragStartXRef.current
        : event.clientY - dragStartYRef.current;
    if (Math.abs(delta) > 3) {
      didDragRef.current = true;
      event.preventDefault();
    }

    if (axis === "x") {
      scrollTarget.scrollLeft = scrollStartLeftRef.current - delta;
    } else {
      scrollTarget.scrollTop = scrollStartTopRef.current - delta;
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<T>) => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    finishPointerDrag(event.currentTarget);
  };

  const handleClickCapture = (event: ReactPointerEvent<T>) => {
    if (!didDragRef.current) {
      return;
    }

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
