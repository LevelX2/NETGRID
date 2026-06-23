import { Brain, Building2, Fingerprint, Goal } from "lucide-react";
import type { PlayerView, Side, VisibleCard } from "@netgrid/shared";

import { CreditBadge, ScoreAreaStat, Stat } from "./ResourceStrip";
import { IdentityCounterStrip } from "./CounterStrips";

export function OpponentPanel({
  view,
  displayName,
  agendaPointsToWin,
  scoreAreaCards,
  scoreAreaOpen,
  scoreAreaHighlighted,
  onToggleScoreArea
}: {
  view: PlayerView;
  displayName?: string;
  agendaPointsToWin: number;
  scoreAreaCards: VisibleCard[];
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const side = opponentSide(view.side);
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === side;
  const RoleIcon = side === "runner" ? Fingerprint : Building2;
  return (
    <section className={`section sideStatusPanel side-${side} ${isTurn ? "turnActive" : ""}`}>
      <h2><RoleIcon size={16} />{displayName ? `${displayName} · ${sideLabel(side)}` : sideLabel(side)}</h2>
      <div className="stats">
        <CreditBadge credits={view.opponent.credits} />
        <ScoreAreaStat
          value={`${view.opponent.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {side === "runner" ? <Stat value={view.opponent.tags} icon={<Goal size={14} />} helpText="Tags markieren den Runner. Viele Tags erlauben der Korp stärkere Folgeaktionen gegen den Runner oder seine Ressourcen." /> : null}
        {side === "runner" ? <Stat value={view.opponent.coreDamage ?? 0} icon={<Brain size={14} />} helpText="Core Damage ist dauerhafter Schaden am Runner. Er senkt die maximale Handkartenzahl und entsteht durch Effekte, die ausdrücklich Core Damage verursachen." /> : null}
      </div>
      <IdentityCounterStrip displays={view.opponent.identity.counterDisplays} side={side} />
      <p className="meta statusLine">{sideStatusLineForView(view, side)}</p>
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
  onToggleScoreArea
}: {
  view: PlayerView;
  title: string;
  scoreAreaCards: VisibleCard[];
  agendaPointsToWin: number;
  scoreAreaOpen: boolean;
  scoreAreaHighlighted: boolean;
  onToggleScoreArea(): void;
}) {
  const turnSide = turnSideForView(view);
  const isTurn = turnSide === view.side;
  const RoleIcon = view.side === "runner" ? Fingerprint : Building2;
  return (
    <section className={`section sideStatusPanel side-${view.side} ${isTurn ? "turnActive" : ""}`}>
      <h2><RoleIcon size={16} />{title}</h2>
      <div className="stats">
        <CreditBadge credits={view.own.credits} />
        <ScoreAreaStat
          value={`${view.own.agendaPoints} / ${agendaPointsToWin}`}
          open={scoreAreaOpen}
          highlighted={scoreAreaHighlighted}
          interactive={scoreAreaCards.length > 0}
          onToggle={onToggleScoreArea}
        />
        {view.side === "runner" ? <Stat value={view.own.tags} icon={<Goal size={14} />} helpText="Tags markieren den Runner. Viele Tags erlauben der Korp stärkere Folgeaktionen gegen den Runner oder seine Ressourcen." /> : null}
        {view.side === "runner" ? <Stat value={view.own.coreDamage ?? 0} icon={<Brain size={14} />} helpText="Core Damage ist dauerhafter Schaden am Runner. Er senkt die maximale Handkartenzahl und entsteht durch Effekte, die ausdrücklich Core Damage verursachen." /> : null}
      </div>
      <IdentityCounterStrip displays={view.own.identity.counterDisplays} side={view.side} />
      <p className="meta statusLine">{sideStatusLineForView(view, view.side)}</p>
    </section>
  );
}

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

function turnSideForView(view: PlayerView): Side | null {
  if (view.phase === "corp_draw_phase" || view.phase === "corp_action_phase") return "corp";
  if (view.phase === "runner_action_phase" || view.phase === "run") return "runner";
  return null;
}

function sideStatusLineForView(view: PlayerView, side: Side): string {
  if (view.pendingChoice?.side === side) return "Entscheidet";
  const turnSide = turnSideForView(view);
  if (turnSide !== side) return "Wartet";
  const choiceOwner = view.pendingChoice?.side;
  if (choiceOwner && choiceOwner !== side) return `Am Zug · ${sideLabel(choiceOwner)} entscheidet`;
  return "Am Zug";
}
