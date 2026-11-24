import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS } from "../settings/settings-model";

type PointerPosition = Pick<PointerEvent, "clientX" | "clientY">;
type HoverSession = {
  position: PointerPosition;
  close(): void;
};

let activeHover: HoverSession | undefined;

function moved(position: PointerPosition, event: PointerPosition): boolean {
  return (
    position.clientX !== event.clientX || position.clientY !== event.clientY
  );
}

export function useCardTooltipHover(
  triggerRef: RefObject<HTMLElement | null>,
  tooltipRef: RefObject<HTMLElement | null>,
  openDelay: number,
) {
  const [visible, setVisible] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendingPosition = useRef<PointerPosition | undefined>(undefined);
  const session = useRef<HoverSession | undefined>(undefined);

  const clearTimers = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    openTimer.current = undefined;
    closeTimer.current = undefined;
    pendingPosition.current = undefined;
  };

  const close = () => {
    clearTimers();
    if (session.current && activeHover === session.current)
      activeHover = undefined;
    session.current = undefined;
    setVisible(false);
  };

  const open = (event: ReactPointerEvent, immediately = false) => {
    if (event.pointerType === "touch") return;
    if (
      activeHover &&
      activeHover !== session.current &&
      !moved(activeHover.position, event)
    )
      return;
    clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
    if (visible) return;
    pendingPosition.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    if (openTimer.current !== undefined) return;
    const show = () => {
      openTimer.current = undefined;
      const position = pendingPosition.current;
      pendingPosition.current = undefined;
      if (!position) return;
      if (activeHover && !moved(activeHover.position, position)) return;
      activeHover?.close();
      session.current = { position, close };
      activeHover = session.current;
      setVisible(true);
    };
    if (immediately) show();
    else openTimer.current = setTimeout(show, openDelay);
  };

  const leave = (event: ReactPointerEvent) => {
    if (event.pointerType === "touch") return;
    clearTimeout(openTimer.current);
    openTimer.current = undefined;
    pendingPosition.current = undefined;
    // A layout update can send a boundary event even with a stationary pointer.
    // Once open, only the coordinate changes tracked below dismiss the hover.
  };

  useEffect(() => {
    if (!visible) return;
    const onPointerMove = (event: PointerEvent) => {
      const current = session.current;
      if (
        !current ||
        event.pointerType === "touch" ||
        !moved(current.position, event)
      )
        return;
      const target = event.target;
      if (
        target instanceof Node &&
        (triggerRef.current?.contains(target) ||
          tooltipRef.current?.contains(target))
      ) {
        clearTimeout(closeTimer.current);
        closeTimer.current = undefined;
        current.position = { clientX: event.clientX, clientY: event.clientY };
        return;
      }
      closeTimer.current ??= setTimeout(
        close,
        CARD_TOOLTIP_HOVER_CLOSE_DELAY_MS,
      );
    };
    const onViewportLeave = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && !event.relatedTarget) close();
    };
    window.addEventListener("pointermove", onPointerMove, true);
    document.documentElement.addEventListener("pointerleave", onViewportLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove, true);
      document.documentElement.removeEventListener(
        "pointerleave",
        onViewportLeave,
      );
    };
  }, [visible, triggerRef, tooltipRef]);

  useEffect(
    () => () => {
      clearTimers();
      if (session.current && activeHover === session.current)
        activeHover = undefined;
      session.current = undefined;
    },
    [],
  );

  return { visible, open, leave, close };
}
