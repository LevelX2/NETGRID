"use client";

import { Move, PanelTopClose, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";

import {
  clampOverlayPosition,
  type OverlayPositionPreference,
} from "../../lib/overlay-position";

export function FloatingActionPanelOverlay({
  position,
  onPosition,
  onDock,
  children
}: {
  position: OverlayPositionPreference;
  onPosition(position: OverlayPositionPreference): void;
  onDock(): void;
  children: ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (position.kind !== "custom") return;
    const clampToViewport = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const next = clampOverlayPosition(position.xPercent, position.yPercent, window.innerWidth, window.innerHeight, rect.width, rect.height);
      if (next.kind !== "custom" || next.xPercent !== position.xPercent || next.yPercent !== position.yPercent) onPosition(next);
    };
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [position, onPosition]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragOverlay = (event: ReactPointerEvent<HTMLDivElement>) => {
    const overlay = overlayRef.current;
    const offset = dragOffsetRef.current;
    if (!overlay || !offset) return;
    const rect = overlay.getBoundingClientRect();
    onPosition(
      clampOverlayPosition(
        ((event.clientX - offset.x) / window.innerWidth) * 100,
        ((event.clientY - offset.y) / window.innerHeight) * 100,
        window.innerWidth,
        window.innerHeight,
        rect.width,
        rect.height
      )
    );
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const positionStyle: CSSProperties = position.kind === "custom" ? { left: `${position.xPercent}%`, top: `${position.yPercent}%`, transform: "none" } : {};

  const overlay = (
    <div ref={overlayRef} className={`actionPanelFloatingOverlay ${position.kind === "custom" ? "custom" : ""}`} style={positionStyle} data-testid="floating-legal-actions">
      <section className="actionPanelFloatingWindow" aria-label="Mögliche Aktionen">
        <div
          className="actionPanelFloatingHead actionPanelFloatingDragHandle"
          onPointerDown={startDrag}
          onPointerMove={dragOverlay}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          title="Aktionsfenster verschieben"
          aria-label="Aktionsfenster verschieben"
        >
          <div className="actionPanelFloatingTitle">
            <Zap size={16} aria-hidden="true" />
            <strong>Mögliche Aktionen</strong>
          </div>
          <div className="actionPanelFloatingControls">
            <Move size={14} aria-hidden="true" />
            <button
              className="button iconOnly"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onDock}
              aria-label="Aktionsfenster andocken"
              title="Aktionsfenster andocken"
            >
              <PanelTopClose size={14} />
            </button>
          </div>
        </div>
        <div className="actionPanelFloatingBody">{children}</div>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
