import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { classifyCorpScoredAgendaAbility } from "./corp-plans";
import type { AiFeatures } from "../runtime/ai-features";

type CorpScoredAgendaAbilityAssessment = NonNullable<
  ReturnType<typeof classifyCorpScoredAgendaAbility>
>;

export function scoreCorpScoredAgendaAbility(
  assessment: CorpScoredAgendaAbilityAssessment,
  features: AiFeatures,
): number {
  const lowCredits = features.credits < 5;
  switch (assessment.kind) {
    case "scored_agenda_economy":
    case "scored_agenda_counter_economy":
      return (
        610 +
        Math.max(0, assessment.netCredits - assessment.clickCost) * 55 +
        (lowCredits ? 80 : 25) -
        Math.max(0, assessment.clickCost - 1) * 70
      );
    case "scored_agenda_draw":
      return 600 + Math.max(0, assessment.drawAmount - 1) * 55;
    case "scored_agenda_shuffle_draw":
      return 640 + Math.max(0, assessment.drawAmount - 2) * 35;
    case "scored_agenda_extra_action":
      return 720 + assessment.gainedActions * 45;
    case "scored_agenda_trace_tag":
      return features.opponentTags > 0 ? 520 : 560 + assessment.tacticalValue;
    case "scored_agenda_damage_punish":
      return features.opponentTags > 0 ? 790 + assessment.tacticalValue : 180;
    case "scored_agenda_utility":
      return 330 + assessment.tacticalValue;
    case "unknown_scored_agenda_ability":
      return 240;
  }
}

export function corpScoredAgendaAbilityReasonCode(
  kind: CorpScoredAgendaAbilityAssessment["kind"],
): string {
  switch (kind) {
    case "scored_agenda_economy":
      return "corp.scored_agenda.economy";
    case "scored_agenda_counter_economy":
      return "corp.scored_agenda.counter_economy";
    case "scored_agenda_draw":
    case "scored_agenda_shuffle_draw":
      return "corp.scored_agenda.draw";
    case "scored_agenda_extra_action":
      return "corp.scored_agenda.extra_action";
    case "scored_agenda_trace_tag":
      return "corp.scored_agenda.trace_tag";
    case "scored_agenda_damage_punish":
      return "corp.scored_agenda.damage_punish";
    default:
      return "corp.scored_agenda.utility";
  }
}

export function betterScoredAgendaEconomyAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda &&
        (scoredAgenda.kind === "scored_agenda_economy" ||
          scoredAgenda.kind === "scored_agenda_counter_economy") &&
        scoredAgenda.netCredits > Math.max(1, scoredAgenda.clickCost),
    );
  });
}

export function betterScoredAgendaDrawAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda &&
        (scoredAgenda.kind === "scored_agenda_draw" ||
          scoredAgenda.kind === "scored_agenda_shuffle_draw") &&
        scoredAgenda.drawAmount > Math.max(1, scoredAgenda.clickCost),
    );
  });
}

export function politicalOverthrowEconomyAvailable(
  input: AiDecisionInput,
  selectedAction: LegalAction,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === selectedAction.actionId) return false;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    return Boolean(
      scoredAgenda?.sourceDefinitionId === "onr_v1_210_political-overthrow" &&
        scoredAgenda.kind === "scored_agenda_economy" &&
        scoredAgenda.netCredits > Math.max(1, scoredAgenda.clickCost),
    );
  });
}
