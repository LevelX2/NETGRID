import { Brain, Building2, Fingerprint, Goal } from "lucide-react";
import type { PlayerView, Side, VisibleCard } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import { CreditBadge, ScoreAreaStat, Stat } from "./ResourceStrip";
import { IdentityCounterStrip } from "./CounterStrips";

export function OpponentPanel({
  view,
  displayName,
  agendaPointsToWin,
  scoreAreaCards,
  scoreAreaOpen,
  scoreAreaHighlighted,
  onToggleScoreArea,
}: {
  view: PlayerView;
  displayName?: string;
  agendaPointsToWin: number;
  scoreAreaCards: VisibleCard[];
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const t = useTranslations("Board.status");
  const side = opponentSide(view.side);
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === side;
  const RoleIcon = side === "runner" ? Fingerprint : Building2;
  const status = sideStatusForView(view, side);
  return (
    <section
      className={`section sideStatusPanel side-${side} ${isTurn ? "turnActive" : ""}`}
    >
      <h2>
        <RoleIcon size={16} />
        {displayName
          ? `${displayName} · ${t(`side.${side}`)}`
          : t(`side.${side}`)}
      </h2>
      <div className="stats">
        <CreditBadge credits={view.opponent.credits} />
        <ScoreAreaStat
          value={`${view.opponent.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {side === "runner" ? (
          <Stat
            value={view.opponent.tags}
            icon={<Goal size={14} />}
            helpText={t("tagHelp")}
          />
        ) : null}
        {side === "runner" ? (
          <Stat
            value={view.opponent.coreDamage ?? 0}
            icon={<Brain size={14} />}
            helpText={t("coreDamageHelp")}
          />
        ) : null}
      </div>
      <IdentityCounterStrip
        displays={view.opponent.identity.counterDisplays}
        side={side}
      />
      <p className="meta statusLine">
        {status.key === "turnOtherDecides"
          ? t(status.key, { side: t(`side.${status.side}`) })
          : t(status.key)}
      </p>
    </section>
  );
}

export function PlayerPanel({
  view,
  title,
  scoreAreaCards,
  agendaPointsToWin,
  scoreAreaOpen,
  scoreAreaHighlighted,
  onToggleScoreArea,
}: {
  view: PlayerView;
  title: string;
  scoreAreaCards: VisibleCard[];
  agendaPointsToWin: number;
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const t = useTranslations("Board.status");
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === view.side;
  const RoleIcon = view.side === "runner" ? Fingerprint : Building2;
  const status = sideStatusForView(view, view.side);
  return (
    <section
      className={`section sideStatusPanel side-${view.side} ${isTurn ? "turnActive" : ""}`}
    >
      <h2>
        <RoleIcon size={16} />
        {title}
      </h2>
      <div className="stats">
        <CreditBadge credits={view.own.credits} />
        <ScoreAreaStat
          value={`${view.own.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {view.side === "runner" ? (
          <Stat
            value={view.own.tags}
            icon={<Goal size={14} />}
            helpText={t("tagHelp")}
          />
        ) : null}
        {view.side === "runner" ? (
          <Stat
            value={view.own.coreDamage ?? 0}
            icon={<Brain size={14} />}
            helpText={t("coreDamageHelp")}
          />
        ) : null}
      </div>
      <IdentityCounterStrip
        displays={view.own.identity.counterDisplays}
        side={view.side}
      />
      <p className="meta statusLine">
        {status.key === "turnOtherDecides"
          ? t(status.key, { side: t(`side.${status.side}`) })
          : t(status.key)}
      </p>
    </section>
  );
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase")
    return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run")
    return "runner";
  return null;
}

function sideStatusForView(
  view: PlayerView,
  side: Side,
):
  | { key: "deciding" | "waiting" | "turn" }
  | { key: "turnOtherDecides"; side: Side } {
  if (view.pendingChoice?.side === side) return { key: "deciding" };
  const turnSide = turnSideForView(view);
  if (turnSide !== side) return { key: "waiting" };
  const choiceOwner = view.pendingChoice?.side;
  if (choiceOwner && choiceOwner !== side)
    return { key: "turnOtherDecides", side: choiceOwner };
  return { key: "turn" };
}
