import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

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
      input.playerView.opponent.tags < 7
    )
      return undefined;
    if (!dependencies.visibleMeatDamagePayoff(input)) return undefined;
    return {
      kind: "funding",
      value: input.playerView.opponent.tags >= 7 ? 1150 : 550,
      evidence: [
        "corp_tag_punish_payoff_funding:true",
        "corp_visible_meat_damage_payoff:true",
        `runner_tags:${input.playerView.opponent.tags}`,
      ],
    };
  };

  return {
    corpInstalledEconomyActionProfile,
    corpTagPunishPayoffFundingProfile,
  };
}
