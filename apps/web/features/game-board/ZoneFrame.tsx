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
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { PlayerView, Side } from "@netgrid/shared";

const CARD_DISPLAY_BASE_MIN_WIDTH = 108;

export function zoneSideClass(side: Side): "runnerZoneSideLabel" | "corpZoneSideLabel" {
  return side === "runner" ? "runnerZoneSideLabel" : "corpZoneSideLabel";
}

export type ZoneIdentityIconKind = "hq" | "rd" | "archives" | "remote" | "rig" | "grip" | "heap" | "stack";

export function serverZoneIdentityIconKind(serverId: PlayerView["servers"][number]["id"]): ZoneIdentityIconKind {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  return "remote";
}

export function ZoneIdentityIcon({ side, kind, label, className = "" }: { side: Side; kind: ZoneIdentityIconKind; label: string; className?: string }) {
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
    <span className={`zoneIdentityIcon ${zoneSideClass(side)} ${className}`} role="img" aria-label={`${label}: Zonen-Icon`} title={`${label}: Zonen-Icon`}>
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
  children
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
    <div className={`sideZoneFrame ${side} ${hasBody ? "" : "sideZoneFrameCountOnly"} ${highlighted ? "cueHighlightSoft" : ""} ${className}`} style={style} title={title} aria-label={ariaLabel} data-testid={testId}>
      <div className="sideZoneLead">
        <div className="sideZoneLeadTop">
          <h2 className={`sideZoneTitle rigGroupSideLabel ${zoneSideClass(side)}`}>{label}</h2>
          <ZoneSideCount side={side} value={countLabel} />
        </div>
        <div className="sideZoneLeadBottom">
          {iconKind ? <ZoneIdentityIcon side={side} kind={iconKind} label={label} /> : null}
          {onToggleCollapse ? <ZoneCollapseButton side={side} label={collapseLabel ?? label} collapsed={collapsed} onToggle={onToggleCollapse} /> : null}
        </div>
      </div>
      {hasBody ? <div className="sideZoneBody">{children}</div> : null}
    </div>
  );
}

export function HandCardsRow({ className = "", style, count, children }: { className?: string; style?: CSSProperties; count: number; children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [overlapOffset, setOverlapOffset] = useState<string | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || count <= 1) {
      setOverlapOffset(null);
      return;
    }

    const syncOverlap = () => {
      const computedStyle = window.getComputedStyle(row);
      const cardWidth = Number.parseFloat(computedStyle.getPropertyValue("--cards-min-width")) || CARD_DISPLAY_BASE_MIN_WIDTH;
      const cardGap = Number.parseFloat(computedStyle.columnGap) || 0;
      const availableWidth = row.clientWidth;
      if (cardWidth <= 0 || availableWidth <= 0) {
        setOverlapOffset(null);
        return;
      }

      const defaultOverlapRatio = 0.42;
      const defaultOffset = cardWidth * defaultOverlapRatio;
      const defaultRowWidth = cardWidth * count + (cardGap - defaultOffset) * (count - 1);
      const requiredOffset = (cardWidth * count + cardGap * (count - 1) - availableWidth) / (count - 1);
      const maxOffset = Math.max(defaultOffset, cardWidth + cardGap - 10);
      const nextOffsetWidth = defaultRowWidth <= availableWidth ? defaultOffset : Math.min(Math.max(requiredOffset, defaultOffset), maxOffset);
      const nextOffset = `${Math.round(nextOffsetWidth) * -1}px`;
      setOverlapOffset((current) => (current === nextOffset ? current : nextOffset));
    };

    syncOverlap();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncOverlap);
    observer?.observe(row);
    window.addEventListener("resize", syncOverlap);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncOverlap);
    };
  }, [count, style]);

  const rowStyle = useMemo(() => {
    if (!overlapOffset) return style;
    return { ...style, "--cards-overlap-offset": overlapOffset } as CSSProperties;
  }, [overlapOffset, style]);

  return (
    <div ref={rowRef} className={`cards fixedZoneCards handCardsRow ${className}`.trim()} style={rowStyle}>
      {children}
    </div>
  );
}

export function ZoneCollapseButton({ side, label, collapsed, onToggle }: { side: Side; label: string; collapsed: boolean; onToggle: () => void }) {
  const actionLabel = `${label} ${collapsed ? "ausklappen" : "einklappen"}`;
  return (
    <button className={`zoneCollapseButton ${zoneSideClass(side)}`} type="button" onClick={onToggle} title={actionLabel} aria-label={actionLabel} aria-expanded={!collapsed}>
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
