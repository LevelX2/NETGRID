"use client";

import type { CSSProperties, ReactNode } from "react";

export function matchViewportTop(): number {
  return Math.max(0, window.visualViewport?.offsetTop ?? 0);
}

export function observeMatchViewport(update: () => void) {
  const viewport = window.visualViewport;
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  viewport?.addEventListener("scroll", update);
  viewport?.addEventListener("resize", update);
  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
    viewport?.removeEventListener("scroll", update);
    viewport?.removeEventListener("resize", update);
  };
}

function pinToVisibleViewport(element: HTMLDivElement | null) {
  if (!element) return;
  return observeMatchViewport(() => {
    const top = `${matchViewportTop()}px`;
    if (element.style.getPropertyValue("--match-viewport-top") !== top)
      element.style.setProperty("--match-viewport-top", top);
  });
}

export function ActiveMatchChrome({
  topbarHeight,
  children,
}: {
  topbarHeight: number;
  children: ReactNode;
}) {
  return (
    <div
      className="activeMatchChrome"
      ref={pinToVisibleViewport}
      style={{ "--match-topbar-height": `${topbarHeight}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
