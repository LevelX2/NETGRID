import type { Side, VisibleCard } from "@netgrid/shared";

import { researchAgendaDifficultyModifierLineForCard, scoredAgendaEffectLineForScoreArea } from "../../app/score-area-ui";
import type { DisplayVisibleCard } from "./card-view-model";

type ScoredAgendaStateTone = "credit" | "agenda" | "action" | "effect" | "depleted";

export type ScoredAgendaStateLine = {
  key: string;
  value: string;
  label: string;
  tone: ScoredAgendaStateTone;
};

export function ScoredAgendaStateLines({ card, side }: { card: DisplayVisibleCard; side: Side }) {
  const lines = scoredAgendaStateLines(card, side);
  if (lines.length === 0) return null;
  return (
    <div className="scoredAgendaStateList" aria-label={`${card.title ?? "Karte"} Status`}>
      {lines.map((line) => (
        <p className="scoredAgendaStateLine" key={`${card.instanceId}-${line.key}`}>
          <span className={`scoredAgendaStatePill ${line.tone}`}>{line.value}</span>
          <span>{line.label}</span>
        </p>
      ))}
    </div>
  );
}

export function scoreCardStateBadges(card: DisplayVisibleCard, corpScoreAreaCards: VisibleCard[] = []): ScoredAgendaStateLine[] {
  const badges: ScoredAgendaStateLine[] = [];
  const researchDifficultyLine = researchAgendaDifficultyModifierLineForCard(card, corpScoreAreaCards);
  if (researchDifficultyLine) badges.push(researchDifficultyLine);
  return badges;
}

export function ScoreCardStateBadges({ badges }: { badges: ScoredAgendaStateLine[] }) {
  return (
    <span className="scoreCardStateBadges" aria-hidden="true">
      {badges.map((badge) => (
        <span className={`scoreCardStateBadge ${badge.tone}`} key={badge.key}>
          {badge.value}
        </span>
      ))}
    </span>
  );
}

function scoredAgendaStateLines(card: DisplayVisibleCard, side: Side): ScoredAgendaStateLine[] {
  const lines: ScoredAgendaStateLine[] = [];
  const effectLine = scoredAgendaEffectLineForScoreArea(card, side);
  if (effectLine) lines.push(effectLine);
  return lines;
}
