"use client";

import { useEffect, useRef, useState } from "react";

type CursorPosition = {
  x: number;
  y: number;
};

export function TapCursor() {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = document.getElementById("app-viewport");
    if (!viewport) {
      return;
    }

    const updatePosition = (event: MouseEvent) => {
      const rect = viewport.getBoundingClientRect();
      const viewportWidth = viewport.clientWidth || 1;
      const viewportHeight = viewport.clientHeight || 1;
      const scaleX = rect.width / viewportWidth;
      const scaleY = rect.height / viewportHeight;
      const next = {
        x: (event.clientX - rect.left) / (scaleX || 1),
        y: (event.clientY - rect.top) / (scaleY || 1),
      };
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => setPosition(next));
    };

    const handleEnter = (event: MouseEvent) => {
      setIsVisible(true);
      updatePosition(event);
    };

    const handleMove = (event: MouseEvent) => {
      setIsVisible(true);
      updatePosition(event);
    };

    const handleLeave = () => {
      setIsVisible(false);
    };

    const handleDown = (event: MouseEvent) => {
      setIsVisible(true);
      updatePosition(event);
      setIsPressed(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsPressed(false);
      }, 180);
    };

    viewport.addEventListener("mouseenter", handleEnter);
    viewport.addEventListener("mousemove", handleMove);
    viewport.addEventListener("mouseleave", handleLeave);
    viewport.addEventListener("mousedown", handleDown);

    return () => {
      viewport.removeEventListener("mouseenter", handleEnter);
      viewport.removeEventListener("mousemove", handleMove);
      viewport.removeEventListener("mouseleave", handleLeave);
      viewport.removeEventListener("mousedown", handleDown);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[10000]">
      <div
        className={`tap-cursor ${isVisible ? "tap-cursor--visible" : ""} ${
          isPressed ? "tap-cursor--pressed" : ""
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />
    </div>
  );
}
