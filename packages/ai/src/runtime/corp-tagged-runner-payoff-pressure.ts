import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

export type CorpTaggedRunnerPayoffPressureDependencies = {
  immediateTagSourceVisiblePayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  installedEconomyActionProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  tagPunishPayoffFundingProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  taggedRunnerPayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
};

export function createCorpTaggedRunnerPayoffPressureContext(
  dependencies: CorpTaggedRunnerPayoffPressureDependencies,
): {
  corpTaggedRunnerPayoffPressure: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
} {
  const corpTaggedRunnerPayoffPressure = (
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined => {
    const immediateTagSource =
      dependencies.immediateTagSourceVisiblePayoffProfile(input, action);
    if (immediateTagSource) {
      return {
        key: "corp_tag_source_visible_payoff_pressure",
        label: "Sofortiger Tag-Source",
        value: immediateTagSource.value,
        reason: immediateTagSource.evidence.join("|"),
      };
    }
    const installedEconomy = dependencies.installedEconomyActionProfile(
      input,
      action,
    );
    if (installedEconomy) {
      return {
        key: "corp_card_action_economy_gain",
        label: "Installierte Corp-Economy",
        value: installedEconomy.value,
        reason: installedEconomy.evidence.join("|"),
      };
    }
    const funding = dependencies.tagPunishPayoffFundingProfile(input, action);
    if (funding) {
      return {
        key: "corp_tag_punish_payoff_funding",
        label: "Tag-Punish-Funding",
        value: funding.value,
        reason: funding.evidence.join("|"),
      };
    }
    const profile = dependencies.taggedRunnerPayoffProfile(input, action);
    if (!profile) return undefined;
    return {
      key:
        profile.kind === "damage"
          ? "corp_tagged_meat_damage_payoff_pressure"
          : "corp_tagged_runner_payoff_pressure",
      label: "Tagged-Runner-Payoff",
      value: profile.value,
      reason: [
        "corp_tagged_runner_payoff:true",
        "corp_tagged_payoff_followup_plan:active",
        ...profile.evidence,
      ].join("|"),
    };
  };

  return { corpTaggedRunnerPayoffPressure };
}
