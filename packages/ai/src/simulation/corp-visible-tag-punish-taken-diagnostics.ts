import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

import { corpTagPunishSkipReason } from "../runtime/corp-tag-punish-skip-reason";
import type { CorpVisibleTagPayoffCategory } from "../runtime/corp-tag-punish-types";
import { fixedTaggedDamageOperation } from "../runtime/corp-fixed-tag-damage-operation-facts";
import type { CorpVisibleTagPunishOpportunity } from "./corp-visible-tag-punish-opportunities";
import { runnerSurvivalCounterContextForInput } from "./runner-survival-counter-context";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function applyCorpVisibleTagPunishTakenWindowDiagnostics(
  diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
  input: AiDecisionInput,
  action: LegalAction,
  decision: AiDecision,
  chosenOpportunity: CorpVisibleTagPunishOpportunity,
  opportunities: CorpVisibleTagPunishOpportunity[],
): void {
  const alternatives = opportunities.filter(
    (opportunity) => opportunity.action.actionId !== action.actionId,
  );
  if (alternatives.length <= 0) return;

  diagnostics.corpVisibleTagPunishAlternativePayoffsNotChosen =
    alternatives.length;
  diagnostics.corpVisibleTagPunishChosenPayoffAmongAlternatives = true;
  if (action.type === "play_operation")
    diagnostics.corpVisibleTagPunishOperationChoiceAmongPayoffs = true;

  const legacyReference = opportunities[0];
  if (legacyReference?.action.actionId !== action.actionId) {
    diagnostics.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization = true;
    const legacySkippedReason = corpTagPunishSkipReason(action, decision);
    if (
      legacySkippedReason === "unknown_higher_priority" ||
      legacySkippedReason === "unknown"
    ) {
      diagnostics.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff = true;
      diagnostics.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken = true;
    }
  }

  const chosenLethal = visibleLethality(input, chosenOpportunity);
  const alternativeLethality = alternatives.map((opportunity) =>
    visibleLethality(input, opportunity),
  );
  const alternativeCategories = new Set(
    alternatives.map((opportunity) => opportunity.category),
  );

  if (
    chosenOpportunity.category === "damage" &&
    alternativeCategories.has("economic")
  )
    diagnostics.corpVisibleTagPunishChosenDamageOverEconomic = true;
  if (
    chosenOpportunity.category === "economic" &&
    alternativeCategories.has("damage")
  ) {
    diagnostics.corpVisibleTagPunishChosenEconomicOverDamage = true;
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage = true;
  }
  if (
    chosenOpportunity.category === "trash" &&
    alternativeCategories.has("damage")
  )
    diagnostics.corpVisibleTagPunishChosenTrashOverDamage = true;
  if (chosenLethal === true && alternativeLethality.includes(false))
    diagnostics.corpVisibleTagPunishChosenLethalOverNonLethal = true;
  if (chosenLethal === false && alternativeLethality.includes(true)) {
    diagnostics.corpVisibleTagPunishChosenNonLethalOverLethal = true;
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed = true;
  }

  const chosenImpact = corpVisibleTagPayoffImpact(chosenOpportunity);
  const alternativeImpacts = alternatives.map(corpVisibleTagPayoffImpact);
  if (
    chosenImpact === undefined ||
    alternativeImpacts.some((impact) => impact === undefined)
  ) {
    diagnostics.corpVisibleTagPunishChosenUnknownImpactOrdering = true;
  } else if (Math.max(...(alternativeImpacts as number[])) > chosenImpact) {
    diagnostics.corpVisibleTagPunishChosenLowerImpactOverHigherImpact = true;
  }
  if (
    diagnostics.corpVisibleTagPunishChosenLowerImpactOverHigherImpact ===
      true ||
    diagnostics.corpVisibleTagPunishChosenNonLethalOverLethal === true ||
    diagnostics.corpVisibleTagPunishChosenEconomicOverDamage === true ||
    diagnostics.corpVisibleTagPunishChosenTrashOverDamage === true
  )
    diagnostics.corpVisibleTagPunishPotentialPayoffOrderingIssue = true;
}

function corpVisibleTagPayoffImpact(opportunity: {
  category: CorpVisibleTagPayoffCategory;
}): number | undefined {
  switch (opportunity.category) {
    case "damage":
      return 50;
    case "economic":
      return 35;
    case "trash":
      return 30;
    case "run_lock":
      return 20;
    case "ambush":
      return 15;
    case "unknown":
      return undefined;
  }
}

function visibleLethality(
  input: AiDecisionInput,
  opportunity: CorpVisibleTagPunishOpportunity,
): boolean | undefined {
  const view = input.playerView;
  const handCount = view.opponent.handCount;
  if (!Number.isSafeInteger(handCount) || handCount < 0) return undefined;
  const quote = view.corpPunishRouteQuoteSet?.routes.find(
    (route) =>
      route.complete &&
      route.stateVersion === view.stateVersion &&
      route.timingPoint === view.timingPoint &&
      route.steps.length === 1 &&
      route.steps[0]?.currentLegalAction?.actionId ===
        opportunity.action.actionId &&
      route.damageEnvelope.runnerHandCount === handCount,
  );
  if (quote) {
    const { minimum, maximum } = quote.damageEnvelope.effectiveDamage;
    if (quote.guarantee === "guaranteed" && minimum > handCount) return true;
    if (maximum <= handCount) return false;
    return undefined;
  }
  if (
    opportunity.category === "economic" ||
    opportunity.category === "trash" ||
    opportunity.category === "run_lock"
  )
    return false;
  const fixedDamage =
    opportunity.action.type === "play_operation" && opportunity.cardId
      ? fixedTaggedDamageOperation(opportunity.cardId)?.damage
      : undefined;
  if (fixedDamage === undefined) return undefined;
  if (fixedDamage <= handCount) return false;
  const survival = runnerSurvivalCounterContextForInput(input);
  return survival.damage || survival.flatline ? undefined : true;
}
