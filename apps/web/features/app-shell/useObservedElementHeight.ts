"use client";

import { useEffect, useRef, useState } from "react";

export function useObservedElementHeight<T extends HTMLElement>(resetKey: string) {
  const elementRef = useRef<T | null>(null);
  const [heightPx, setHeightPx] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      setHeightPx(0);
      return;
    }
    const updateHeight = () => setHeightPx(Math.ceil(element.getBoundingClientRect().height));
    updateHeight();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [resetKey]);

  return { elementRef, heightPx };
}
