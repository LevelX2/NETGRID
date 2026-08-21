import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { isBasicCreditAction } from "../actions/action-effect-classification";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

export type CorpTagPunishPayoffProfileDependencies = {
  installedEconomyCreditAmount: (action: LegalAction) => number;
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
    const sourceCard = dependencies.actionSourceCard(input, action);
    if (
      !sourceCard ||
      !sourceCard.known ||
      sourceCard.owner !== "corp" ||
      sourceCard.controller !== "corp"
    ) {
      return undefined;
    }
    const storedCredits = dependencies.visibleCardStoredCredits(sourceCard);
    if (!Number.isFinite(storedCredits) || storedCredits <= 0) return undefined;
    const immediateGain = Math.min(creditAmount, storedCredits);
    if (immediateGain <= 0) return undefined;
    return {
      kind: "installed_economy",
      value: 1050 + immediateGain * 260 + Math.min(420, storedCredits * 18),
      evidence: [
        "installed_corp_economy:true",
        "installed_corp_economy_kind:pool_payout",
        `installed_corp_economy_immediate_gain:${immediateGain}`,
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
      !isBasicCreditAction(action) ||
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
    currentCredits + corpBasicCreditGain(action) - corpActionCreditCost(action);
  return input.playerView.own.gripOrHq
    .map((card) => {
      if (!card.known || !card.definitionId) return undefined;
      if (!dependencies.payoffProfileForDefinition(card.definitionId)) {
        return undefined;
      }
      const cost = corpVisibleCardPlayCost(card);
      if (cost === undefined) return undefined;
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

export function corpVisibleCardPlayCost(
  card: VisibleCard,
): number | undefined {
  const playCost = card.playCost;
  if (playCost === undefined) return undefined;
  if (playCost.kind === "fixed") {
    return Number.isInteger(playCost.credits) && playCost.credits >= 0
      ? playCost.credits
      : undefined;
  }
  if (
    playCost.kind !== "variable_x" ||
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 0 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1 ||
    playCost.maximumX?.kind !== "context"
  ) {
    return undefined;
  }
  return playCost.minimumX * playCost.creditsPerX;
}
