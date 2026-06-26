import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

import { corpTagPunishSkipReason } from "../runtime/corp-tag-punish-skip-reason";
import type {
  CorpPunishKind,
  CorpVisibleTagPayoffCategory,
} from "../runtime/corp-tag-punish-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type CorpVisibleTagPunishOpportunity = {
  action: LegalAction;
  kind: CorpPunishKind;
  category: CorpVisibleTagPayoffCategory;
  cardId: string | undefined;
};

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

  const chosenLethal = corpPayoffOpportunityIsLethalOrNearLethal(
    input,
    chosenOpportunity,
  );
  const alternativeCategories = new Set(
    alternatives.map((opportunity) => opportunity.category),
  );
  const alternativeLethal = alternatives.some((opportunity) =>
    corpPayoffOpportunityIsLethalOrNearLethal(input, opportunity),
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
  if (
    chosenLethal &&
    alternatives.some((opportunity) => opportunity.category !== "damage")
  )
    diagnostics.corpVisibleTagPunishChosenLethalOverNonLethal = true;
  if (!chosenLethal && alternativeLethal) {
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

function corpPayoffOpportunityIsLethalOrNearLethal(
  input: AiDecisionInput,
  opportunity: { category: CorpVisibleTagPayoffCategory },
): boolean {
  return (
    opportunity.category === "damage" &&
    input.playerView.opponent.handCount <= 3
  );
}
