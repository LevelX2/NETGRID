import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

export type CorpTaggedPayoffWindowDependencies = {
  immediateTagSourceAvailable: (
    input: AiDecisionInput,
    excludedAction?: LegalAction,
  ) => boolean;
  unprotectedPersistentTagAssetSetup: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  taggedRunnerPayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  visibleMeatDamagePayoff: (input: AiDecisionInput) => boolean;
};

export function createCorpTaggedPayoffWindowContext(
  dependencies: CorpTaggedPayoffWindowDependencies,
): {
  corpTaggedPayoffWindowPassiveActionPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpBestTaggedRunnerPayoffProfile: (
    input: AiDecisionInput,
    excludedActionId?: string,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
} {
  const corpBestTaggedRunnerPayoffProfile = (
    input: AiDecisionInput,
    excludedActionId?: string,
  ): CorpTaggedRunnerPayoffActionProfile | undefined =>
    input.legalActions
      .filter((action) => action.actionId !== excludedActionId)
      .map((action) => dependencies.taggedRunnerPayoffProfile(input, action))
      .filter(
        (profile): profile is CorpTaggedRunnerPayoffActionProfile =>
          profile !== undefined,
      )
      .sort((left, right) => right.value - left.value)[0];

  const corpTaggedPayoffWindowPassiveActionPenalty = (
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined => {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    const tagSourceAvailable = dependencies.immediateTagSourceAvailable(
      input,
      action,
    );
    if (
      tagSourceAvailable &&
      dependencies.unprotectedPersistentTagAssetSetup(input, action)
    ) {
      return {
        key: "corp_unprotected_tag_asset_setup_penalty",
        label: "Ungeschuetzter Tag-Asset-Aufbau",
        value: -1800,
        reason: [
          "immediate_operation_tag_source_available:true",
          "unprotected_tag_asset_setup:true",
        ].join("|"),
      };
    }
    if (
      tagSourceAvailable &&
      dependencies.visibleMeatDamagePayoff(input) &&
      action.type === "activated_card_ability" &&
      activatedCardCreditGain(action) > 0
    ) {
      return {
        key: "corp_immediate_tag_source_economy_penalty",
        label: "Sofortigen Tag-Source nicht für Economy verzögern",
        value: -1300,
        reason: [
          "immediate_operation_tag_source_available:true",
          "corp_visible_tag_punish_payoff_kind:damage",
          "passive_kind:card_economy",
        ].join("|"),
      };
    }
    if (input.playerView.opponent.tags <= 0) return undefined;
    if (dependencies.taggedRunnerPayoffProfile(input, action)) return undefined;
    if (
      action.type === "score_agenda" ||
      dependencies.advanceCompletesScore(input, action)
    )
      return undefined;
    const availablePayoff = corpBestTaggedRunnerPayoffProfile(
      input,
      action.actionId,
    );
    if (!availablePayoff) return undefined;
    const availablePayoffEvidenceSet = new Set(availablePayoff.evidence);
    const availableDamagePayoff =
      availablePayoff.kind === "damage" ||
      availablePayoffEvidenceSet.has("corp_tagged_meat_damage_payoff:true");
    let passiveKind: string | undefined;
    let value = 0;
    let key = "corp_tagged_payoff_window_passive_penalty";
    if (action.type === "gain_credit") {
      passiveKind = "basic_economy";
      value = -1100;
    } else if (
      action.type === "activated_card_ability" &&
      activatedCardCreditGain(action) > 0
    ) {
      passiveKind = "card_economy";
      value = -1050;
    } else if (action.type === "draw_card") {
      passiveKind = "draw";
      value = -900;
    } else if (action.type === "install_card") {
      if (dependencies.actionIsScoreLine(input, action)) return undefined;
      passiveKind = "install_setup";
      value = input.playerView.opponent.tags >= 7 ? -1800 : -800;
      key =
        input.playerView.opponent.tags >= 7 || availableDamagePayoff
          ? "corp_tag_punish_endgame_slow_setup_penalty"
          : key;
    } else if (action.type === "rez_ice") {
      passiveKind = "rez_setup";
      value = tagSourceAvailable ? -1800 : -650;
      key = tagSourceAvailable
        ? "corp_unprotected_tag_asset_setup_penalty"
        : key;
    } else if (action.type === "end_turn") {
      passiveKind = "end_turn";
      value = -1200;
    }
    if (!passiveKind || value >= 0) return undefined;
    return {
      key,
      label: "Tagged-Payoff-Fenster nicht verpassen",
      value,
      reason: [
        `passive_kind:${passiveKind}`,
        `runner_tags:${input.playerView.opponent.tags}`,
        ...(availablePayoff
          ? [
              `available_tagged_payoff_kind:${availablePayoff.kind}`,
              ...availablePayoff.evidence,
            ]
          : []),
        ...(tagSourceAvailable
          ? ["immediate_operation_tag_source_available:true"]
          : []),
      ].join("|"),
    };
  };

  return {
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpBestTaggedRunnerPayoffProfile,
  };
}

function activatedCardCreditGain(action: LegalAction): number {
  if (action.type !== "activated_card_ability") return 0;
  return Math.max(
    0,
    numericPayload(action, "cardImplementationCreditAmount"),
    numericPayload(action, "gainCreditsAmount"),
    numericPayload(action, "gainedCredits"),
    numericPayload(action, "amount"),
  );
}

function numericPayload(action: LegalAction, key: string): number {
  const value = action.payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
