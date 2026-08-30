import {
  Building2,
  Cable,
  ChevronDown,
  ChevronUp,
  Clipboard,
  CopyPlus,
  FlaskConical,
  Layers3,
  Shield,
  Trash2,
} from "lucide-react";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { PlayerView, Side } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import {
  HAND_CARD_MINIMUM_VISIBLE_STEP_PX,
  handCardRowLayout,
} from "./hand-card-layout";

const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export function zoneSideClass(
  side: Side,
): "runnerZoneSideLabel" | "corpZoneSideLabel" {
  return side === "runner" ? "runnerZoneSideLabel" : "corpZoneSideLabel";
}

export type ZoneIdentityIconKind =
  | "hq"
  | "rd"
  | "archives"
  | "remote"
  | "rig"
  | "grip"
  | "heap"
  | "stack";

export function serverZoneIdentityIconKind(
  serverId: string,
): ZoneIdentityIconKind {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  return "remote";
}

export function ZoneIdentityIcon({
  side,
  kind,
  label,
  className = "",
}: {
  side: Side;
  kind: ZoneIdentityIconKind;
  label: string;
  className?: string;
}) {
  const t = useTranslations("Board.zone");
  let Icon: typeof Building2;
  switch (kind) {
    case "hq":
      Icon = Building2;
      break;
    case "rd":
      Icon = FlaskConical;
      break;
    case "archives":
      Icon = Clipboard;
      break;
    case "remote":
      Icon = Shield;
      break;
    case "rig":
      Icon = Cable;
      break;
    case "heap":
      Icon = Trash2;
      break;
    case "stack":
      Icon = Layers3;
      break;
    case "grip":
    default:
      Icon = CopyPlus;
      break;
  }
  return (
    <span
      className={`zoneIdentityIcon ${zoneSideClass(side)} ${className}`}
      role="img"
      aria-label={t("icon", { label })}
      title={t("icon", { label })}
    >
      <Icon size={14} strokeWidth={2.2} />
    </span>
  );
}

export function SideZoneFrame({
  side,
  label,
  countLabel,
  iconKind,
  highlighted = false,
  className = "",
  style,
  title,
  ariaLabel,
  testId,
  collapsed = false,
  onToggleCollapse,
  collapseLabel,
  children,
}: {
  side: Side;
  label: string;
  countLabel: string;
  iconKind?: ZoneIdentityIconKind;
  highlighted?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  ariaLabel?: string;
  testId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapseLabel?: string;
  children?: ReactNode;
}) {
  const hasBody = children !== undefined && children !== null && !collapsed;
  return (
    <div
      className={`sideZoneFrame ${side} ${hasBody ? "" : "sideZoneFrameCountOnly"} ${highlighted ? "cueHighlightSoft" : ""} ${className}`}
      style={style}
      title={title}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      <div className="sideZoneLead">
        <div className="sideZoneLeadTop">
          <h2
            className={`sideZoneTitle rigGroupSideLabel ${zoneSideClass(side)}`}
          >
            {label}
          </h2>
          <ZoneSideCount side={side} value={countLabel} />
        </div>
        <div className="sideZoneLeadBottom">
          {iconKind ? (
            <ZoneIdentityIcon side={side} kind={iconKind} label={label} />
          ) : null}
          {onToggleCollapse ? (
            <ZoneCollapseButton
              side={side}
              label={collapseLabel ?? label}
              collapsed={collapsed}
              onToggle={onToggleCollapse}
            />
          ) : null}
        </div>
      </div>
      {hasBody ? <div className="sideZoneBody">{children}</div> : null}
    </div>
  );
}

export function HandCardsRow({
  className = "",
  style,
  count,
  maxRows = 1,
  minimumVisibleStep = HAND_CARD_MINIMUM_VISIBLE_STEP_PX,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  count: number;
  maxRows?: number;
  minimumVisibleStep?: number;
  children: ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [overlapOffset, setOverlapOffset] = useState<string | null>(null);
  const [cardsPerRow, setCardsPerRow] = useState(Math.max(1, count));

  useEffect(() => {
    const row = rowRef.current;
    if (!row || count <= 1) {
      setOverlapOffset(null);
      setCardsPerRow(Math.max(1, count));
      return;
    }

    const syncOverlap = () => {
      const computedStyle = window.getComputedStyle(row);
      const cardWidth =
        Number.parseFloat(
          computedStyle.getPropertyValue("--cards-min-width"),
        ) || CARD_DISPLAY_BASE_MIN_WIDTH;
      const cardRow = row.querySelector<HTMLElement>(".handCardsSubrow") ?? row;
      const cardGap =
        Number.parseFloat(window.getComputedStyle(cardRow).columnGap) || 0;
      const sizingContainer = maxRows > 1 ? (row.parentElement ?? row) : row;
      const sizingStyle = window.getComputedStyle(sizingContainer);
      const availableWidth =
        sizingContainer.clientWidth -
        (Number.parseFloat(sizingStyle.paddingLeft) || 0) -
        (Number.parseFloat(sizingStyle.paddingRight) || 0);
      if (cardWidth <= 0 || availableWidth <= 0) {
        setOverlapOffset(null);
        setCardsPerRow(Math.max(1, count));
        return;
      }

      const layout = handCardRowLayout({
        availableWidth,
        cardWidth,
        cardGap,
        count,
        maxRows,
        minimumVisibleStep,
      });
      const nextOffset =
        layout.overlapOffsetPx === null ? null : `${layout.overlapOffsetPx}px`;
      setOverlapOffset((current) =>
        current === nextOffset ? current : nextOffset,
      );
      setCardsPerRow((current) =>
        current === layout.cardsPerRow ? current : layout.cardsPerRow,
      );
    };

    syncOverlap();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncOverlap);
    observer?.observe(maxRows > 1 ? (row.parentElement ?? row) : row);
    window.addEventListener("resize", syncOverlap);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncOverlap);
    };
  }, [count, maxRows, minimumVisibleStep, style]);

  const rowStyle = useMemo(() => {
    if (!overlapOffset) return style;
    return {
      ...style,
      "--cards-overlap-offset": overlapOffset,
    } as CSSProperties;
  }, [overlapOffset, style]);
  const cardChildren = Children.toArray(children);
  const wrapped = cardsPerRow < cardChildren.length;
  const rows = wrapped
    ? Array.from(
        { length: Math.ceil(cardChildren.length / cardsPerRow) },
        (_, index) =>
          cardChildren.slice(index * cardsPerRow, (index + 1) * cardsPerRow),
      )
    : [];

  return (
    <div
      ref={rowRef}
      className={`cards fixedZoneCards handCardsRow ${wrapped ? "handCardsRowWrapped" : ""} ${className}`.trim()}
      style={rowStyle}
    >
      {wrapped
        ? rows.map((rowChildren, index) => (
            <div className="handCardsSubrow" key={`hand-row-${index + 1}`}>
              {rowChildren}
            </div>
          ))
        : children}
    </div>
  );
}

export function ZoneCollapseButton({
  side,
  label,
  collapsed,
  onToggle,
}: {
  side: Side;
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Board.zone");
  const actionLabel = t(collapsed ? "expand" : "collapse", { label });
  return (
    <button
      className={`zoneCollapseButton ${zoneSideClass(side)}`}
      type="button"
      onClick={onToggle}
      title={actionLabel}
      aria-label={actionLabel}
      aria-expanded={!collapsed}
    >
      {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
    </button>
  );
}

function ZoneSideCount({ side, value }: { side: Side; value: string }) {
  return (
    <span className={`sideZoneCount ${zoneSideClass(side)}`} aria-label={value}>
      {value}
    </span>
  );
}
