import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

export type CorpTagPunishPayoffProfileDependencies = {
  installedEconomyCreditAmount: (action: LegalAction) => number;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  actionSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  visibleCardStoredCredits: (card: VisibleCard) => number;
  visibleMeatDamagePayoff: (input: AiDecisionInput) => boolean;
  payoffProfileForDefinition: (definitionId: string) => unknown | undefined;
};

export function createCorpTagPunishPayoffProfileContext(
  dependencies: CorpTagPunishPayoffProfileDependencies,
): {
  corpInstalledEconomyActionProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  corpTagPunishPayoffFundingProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
} {
  const corpInstalledEconomyActionProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (
      input.side !== "corp" ||
      action.side !== "corp" ||
      action.type !== "activated_card_ability"
    )
      return undefined;
    const creditAmount = dependencies.installedEconomyCreditAmount(action);
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) return undefined;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (sourceDefinitionId !== "onr_v1_309_bbs-whispering-campaign")
      return undefined;
    const sourceCard = dependencies.actionSourceCard(input, action);
    const storedCredits = sourceCard
      ? dependencies.visibleCardStoredCredits(sourceCard)
      : 0;
    return {
      kind: "installed_economy",
      value: 1050 + creditAmount * 260 + Math.min(420, storedCredits * 18),
      evidence: [
        "installed_corp_economy:true",
        "installed_corp_economy_kind:pool_payout",
        `installed_corp_economy_immediate_gain:${creditAmount}`,
        `installed_corp_economy_stored_credits:${storedCredits}`,
      ],
    };
  };

  const corpTagPunishPayoffFundingProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (
      input.side !== "corp" ||
      action.side !== "corp" ||
      action.type !== "gain_credit" ||
      action.source !== "basic_action" ||
      input.playerView.opponent.tags <= 0
    )
      return undefined;
    const targetedPayoff = corpVisibleTaggedPayoffFundingTarget(
      input,
      action,
      dependencies,
    );
    if (!targetedPayoff && !dependencies.visibleMeatDamagePayoff(input)) {
      return undefined;
    }
    if (
      !targetedPayoff &&
      dependencies.visibleMeatDamagePayoff(input) &&
      input.playerView.opponent.tags < 7
    ) {
      return undefined;
    }
    return {
      kind: "funding",
      value: targetedPayoff ? 1350 : 1150,
      evidence: [
        "corp_tag_punish_payoff_funding:true",
        ...(targetedPayoff
          ? [
              "corp_tagged_payoff_targeted_funding:true",
              `target_definition:${targetedPayoff.definitionId}`,
              `payoff_cost:${targetedPayoff.cost}`,
              `credits_after_action:${targetedPayoff.creditsAfterAction}`,
            ]
          : ["corp_visible_meat_damage_payoff:true"]),
        `runner_tags:${input.playerView.opponent.tags}`,
      ],
    };
  };

  return {
    corpInstalledEconomyActionProfile,
    corpTagPunishPayoffFundingProfile,
  };
}

function corpVisibleTaggedPayoffFundingTarget(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: Pick<
    CorpTagPunishPayoffProfileDependencies,
    "payoffProfileForDefinition"
  >,
):
  | {
      definitionId: string;
      cost: number;
      creditsAfterAction: number;
    }
  | undefined {
  const currentCredits = input.playerView.own.credits;
  const creditsAfterAction =
    currentCredits +
    corpBasicCreditGain(action) -
    corpActionCreditCost(action);
  return input.playerView.own.gripOrHq
    .map((card) => {
      if (!card.known || !card.definitionId) return undefined;
      if (!dependencies.payoffProfileForDefinition(card.definitionId)) {
        return undefined;
      }
      const cost = corpVisibleCardPlayCost(card);
      if (currentCredits >= cost || creditsAfterAction < cost) return undefined;
      return {
        definitionId: card.definitionId,
        cost,
        creditsAfterAction,
      };
    })
    .filter(
      (
        target,
      ): target is {
        definitionId: string;
        cost: number;
        creditsAfterAction: number;
      } => target !== undefined,
    )
    .sort(
      (left, right) =>
        right.cost - left.cost ||
        left.definitionId.localeCompare(right.definitionId),
    )[0];
}

function corpBasicCreditGain(action: LegalAction): number {
  if (action.type !== "gain_credit") return 0;
  return Math.max(
    1,
    corpNumericPayload(action, "gainCreditsAmount"),
    corpNumericPayload(action, "gainedCredits"),
    corpNumericPayload(action, "amount"),
  );
}

function corpActionCreditCost(action: LegalAction): number {
  return action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0);
}

function corpNumericPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function corpVisibleCardPlayCost(card: VisibleCard): number {
  return (
    card.cost ??
    (card.definitionId
      ? (RUNTIME_CARDS[card.definitionId]?.numeric.cost ??
        DEMO_CARDS_BY_ID[card.definitionId]?.cost)
      : undefined) ??
    0
  );
}
