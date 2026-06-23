"use client";

import { Award, Brain, Goal, PanelTopClose, PanelTopOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import type { PlayerView, Side } from "@netgrid/shared";
import { actionSlotDisplay } from "../../app/action-board-ui";

const AgendaIcon = Award;
const TagIcon = Goal;
const CoreDamageIcon = Brain;

export function ActiveMatchResourceStrip({
  view,
  agendaPointsToWin,
  actionCapacities,
  topOffsetPx,
  ariaHidden
}: {
  view: PlayerView;
  agendaPointsToWin: number;
  actionCapacities: Record<Side, number>;
  topOffsetPx: number;
  ariaHidden: boolean;
}) {
  const opponent = opponentSide(view.side);
  const turnSide = turnSideForView(view) ?? view.activeSide;
  const turnClicks = turnSide === view.side ? view.own.clicks : view.opponent.clicks;
  const turnCapacity = actionCapacities[turnSide];
  const turnDisplay = actionSlotDisplay(turnSide, turnClicks, turnCapacity, true);
  const stripStyle = { "--resource-strip-top": `${topOffsetPx}px` } as CSSProperties;
  return (
    <section className="matchResourceStrip" style={stripStyle} aria-hidden={ariaHidden} data-testid="match-resource-strip">
      <CompactResourceSide
        label="Gegner"
        side={opponent}
        credits={view.opponent.credits}
        agendaPoints={view.opponent.agendaPoints}
        agendaPointsToWin={agendaPointsToWin}
        tags={opponent === "runner" ? view.opponent.tags : 0}
        coreDamage={opponent === "runner" ? view.opponent.coreDamage ?? 0 : 0}
      />
      <div className={`resourceStripTurn side-${turnSide}`} aria-label={`${sideLabel(turnSide)} am Zug, ${turnDisplay.label}`}>
        <span className="resourceStripTurnLabel">{sideLabel(turnSide)}</span>
        <strong>{turnDisplay.available}</strong>
        <span>Aktionen</span>
        <ActionSlotMeter side={turnSide} currentClicks={turnClicks} displayCapacity={turnCapacity} active compact slotsOnly />
      </div>
      <CompactResourceSide
        label="Du"
        side={view.side}
        credits={view.own.credits}
        agendaPoints={view.own.agendaPoints}
        agendaPointsToWin={agendaPointsToWin}
        tags={view.side === "runner" ? view.own.tags : 0}
        coreDamage={view.side === "runner" ? view.own.coreDamage ?? 0 : 0}
      />
    </section>
  );
}

function CompactResourceSide({
  label,
  side,
  credits,
  agendaPoints,
  agendaPointsToWin,
  tags,
  coreDamage
}: {
  label: string;
  side: Side;
  credits: number;
  agendaPoints: number;
  agendaPointsToWin: number;
  tags: number;
  coreDamage: number;
}) {
  return (
    <div className={`resourceStripSide side-${side}`} aria-label={`${label} ${sideLabel(side)}: ${credits} Credits, ${agendaPoints} von ${agendaPointsToWin} Agenda-Punkte`}>
      <span className="resourceStripSideLabel">{label} · {sideLabel(side)}</span>
      <span className="resourceStripMetric">
        <span className="creditCoin" aria-hidden="true" />
        <strong>{credits}</strong>
      </span>
      <span className="resourceStripMetric">
        <AgendaIcon size={13} />
        <strong>{agendaPoints}/{agendaPointsToWin}</strong>
      </span>
      {tags > 0 ? (
        <span className="resourceStripMetric quiet">
          <TagIcon size={13} />
          <strong>{tags}</strong>
        </span>
      ) : null}
      {coreDamage > 0 ? (
        <span className="resourceStripMetric quiet">
          <CoreDamageIcon size={13} />
          <strong>{coreDamage}</strong>
        </span>
      ) : null}
    </div>
  );
}

export function ActionSlotMeter({
  side,
  currentClicks,
  displayCapacity,
  active,
  compact = false,
  slotsOnly = false
}: {
  side: Side;
  currentClicks: number;
  displayCapacity: number;
  active: boolean;
  compact?: boolean;
  slotsOnly?: boolean;
}) {
  const display = actionSlotDisplay(side, currentClicks, displayCapacity, active);
  if (slotsOnly) {
    return (
      <div className={`actionSlotsInline ${compact ? "compact" : ""}`} aria-label={`${display.label}${active ? " verfügbar" : " aktuell"}`} data-testid="action-slots">
        <span className="srOnly">{display.label}</span>
        <div className="actionSlots" aria-hidden="true">
          {display.slots.map((slot) => (
            <span className={`actionSlot ${slot.state} ${slot.bonus ? "bonus" : ""}`} key={slot.index} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`actionResource ${active ? "active" : "inactive"} ${compact ? "compact" : ""}`} aria-label={`${display.label}${active ? " verfügbar" : " aktuell"}`} data-testid="action-slots">
      <div className="resourceStatTop">
        <strong>{display.available}</strong>
        <span className="statLabel">Aktionen</span>
      </div>
      <div className="actionSlots" aria-hidden="true">
        {display.slots.map((slot) => (
          <span className={`actionSlot ${slot.state} ${slot.bonus ? "bonus" : ""}`} key={slot.index} />
        ))}
      </div>
    </div>
  );
}

export function CreditBadge({ credits }: { credits: number }) {
  return (
    <Stat value={credits} icon={<span className="creditCoin" aria-hidden="true" />} helpText="Credits sind die verfügbare Währung für Karten, Runs, Rezzes und andere Kosten." testId="credit-badge" />
  );
}

export function Stat({ label, value, unit, icon, helpText, testId }: { label?: string; value: number | string; unit?: string; icon?: ReactNode; helpText?: string; testId?: string }) {
  const [helpPinned, setHelpPinned] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const statRef = useRef<HTMLDivElement | null>(null);
  const showHelp = Boolean(helpText && (helpPinned || helpVisible));
  const updateTooltipPosition = () => {
    const rect = statRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(260, window.innerWidth - 28);
    const left = Math.min(Math.max(14, rect.right - width), window.innerWidth - width - 14);
    const belowTop = rect.bottom + 8;
    const top = belowTop + 96 < window.innerHeight ? belowTop : Math.max(14, rect.top - 108);
    setTooltipStyle({ left, top, width });
  };
  useEffect(() => {
    if (!showHelp) return;
    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition, true);
    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition, true);
    };
  }, [showHelp]);
  return (
    <div
      ref={statRef}
      className={`stat ${helpText ? "hasStatHelp" : ""} ${helpPinned ? "helpPinned" : ""}`}
      tabIndex={helpText ? 0 : undefined}
      aria-label={helpText ? `${label ? `${label}: ` : ""}${value}${unit ? ` ${unit}` : ""}. ${helpText}` : undefined}
      data-testid={testId}
      onMouseEnter={() => {
        if (!helpText) return;
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onMouseLeave={() => {
        if (!helpPinned) setHelpVisible(false);
      }}
      onFocus={() => {
        if (!helpText) return;
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onDoubleClick={(event) => {
        if (!helpText) return;
        event.preventDefault();
        updateTooltipPosition();
        setHelpPinned((current) => !current);
      }}
      onBlur={() => {
        setHelpPinned(false);
        setHelpVisible(false);
      }}
    >
      <strong>
        {icon ? <span className="statIcon">{icon}</span> : null}
        <span className="statValue">{value}</span>
        {unit ? <span className="statUnit">{unit}</span> : null}
      </strong>
      {label ? <span className="statLabel">{label}</span> : null}
      {helpText && showHelp ? createPortal(<span className="statHelpTooltip statHelpTooltipFloating" style={tooltipStyle}>{helpText}</span>, document.body) : null}
    </div>
  );
}

export function ScoreAreaStat({
  value,
  open,
  highlighted,
  interactive,
  onToggle
}: {
  value: string;
  open: boolean;
  highlighted: boolean;
  interactive: boolean;
  onToggle(): void;
}) {
  const toggleLabel = open ? "Agendas ausblenden" : "Agendas anzeigen";
  const agendaHelpText = "Agenda-Punkte entscheiden das Spiel: Die Korp punktet erzielte Agendas, der Runner gestohlene Agendas.";
  const valueStat = <Stat value={value} icon={<AgendaIcon size={14} />} helpText={agendaHelpText} />;

  if (!interactive) {
    return valueStat;
  }

  return (
    <>
      {valueStat}
      <ScoreAreaToggleButton
        open={open}
        highlighted={highlighted}
        label={`${toggleLabel}. ${agendaHelpText}`}
        helpText={agendaHelpText}
        onToggle={onToggle}
      />
    </>
  );
}

function ScoreAreaToggleButton({
  open,
  highlighted,
  label,
  helpText,
  onToggle
}: {
  open: boolean;
  highlighted: boolean;
  label: string;
  helpText: string;
  onToggle(): void;
}) {
  const [helpPinned, setHelpPinned] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const showHelp = helpPinned || helpVisible;
  const updateTooltipPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(260, window.innerWidth - 28);
    const left = Math.min(Math.max(14, rect.right - width), window.innerWidth - width - 14);
    const belowTop = rect.bottom + 8;
    const top = belowTop + 96 < window.innerHeight ? belowTop : Math.max(14, rect.top - 108);
    setTooltipStyle({ left, top, width });
  };
  useEffect(() => {
    if (!showHelp) return;
    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition, true);
    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition, true);
    };
  }, [showHelp]);
  return (
    <button
      ref={buttonRef}
      className={`stat scoreAreaStatCell scoreAreaStatButton hasStatHelp ${open ? "is-open" : ""} ${highlighted ? "cueHighlightSoft" : ""}`}
      type="button"
      onClick={onToggle}
      onMouseEnter={() => {
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onMouseLeave={() => {
        if (!helpPinned) setHelpVisible(false);
      }}
      onFocus={() => {
        updateTooltipPosition();
        setHelpVisible(true);
      }}
      onBlur={() => {
        setHelpPinned(false);
        setHelpVisible(false);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        updateTooltipPosition();
        setHelpPinned((current) => !current);
      }}
      aria-expanded={open}
      aria-label={label}
    >
      <strong className="scoreAreaToggleGlyphs">
        <span className="statIcon"><AgendaIcon size={14} /></span>
        <span className="scoreAreaOpenButtonIcon" aria-hidden="true">
          {open ? <PanelTopClose size={12} /> : <PanelTopOpen size={12} />}
        </span>
      </strong>
      {showHelp ? createPortal(<span className="statHelpTooltip statHelpTooltipFloating" style={tooltipStyle}>{helpText}</span>, document.body) : null}
    </button>
  );
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.winner) return null;
  return view.activeSide;
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "runner" ? "Runner" : "Korp";
}
