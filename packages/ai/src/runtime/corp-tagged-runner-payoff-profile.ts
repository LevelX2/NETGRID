import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import type { StructuredTagPunishPayoffKind } from "../tag-punish-ontology-consumer";
import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

type CorpTagPunishPayoffAssessment = {
  isPunishPayoff: boolean;
  payoffKind: StructuredTagPunishPayoffKind;
  evidence: string[];
};

export type CorpTaggedRunnerPayoffProfileDependencies = {
  runnerRigTrashTarget: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  visibleCardStoredCredits: (card: VisibleCard) => number;
  runnerResourceTrashEvidence: (
    input: AiDecisionInput,
    target: VisibleCard,
  ) => { valueBonus: number; evidence: string[] };
  tagPunishAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTagPunishPayoffAssessment | undefined;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  actionCreditCost: (action: LegalAction) => number;
  runnerDamagePreventionEvidence: (input: AiDecisionInput) => string[];
  runnerHardwareTrashTarget: (input: AiDecisionInput) => VisibleCard | undefined;
  runnerHardwarePayoffEvidence: (target: VisibleCard) => string[];
};

export function createCorpTaggedRunnerPayoffProfileContext(
  dependencies: CorpTaggedRunnerPayoffProfileDependencies,
): {
  corpTaggedRunnerPayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
} {
  const corpTaggedRunnerPayoffProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (input.side !== "corp" || action.side !== "corp") return undefined;
    const runnerTags = input.playerView.opponent.tags;
    if (runnerTags <= 0) return undefined;
    if (action.type === "trash_resource") {
      const target = dependencies.runnerRigTrashTarget(input, action);
      if (!target?.definitionId) return undefined;
      const storedCredits = dependencies.visibleCardStoredCredits(target);
      const specialEvidence = dependencies.runnerResourceTrashEvidence(
        input,
        target,
      );
      return {
        kind: "resource_trash",
        value:
          1350 +
          Math.min(500, runnerTags * 85) +
          Math.min(420, storedCredits * 60) +
          specialEvidence.valueBonus,
        evidence: [
          "tagged_payoff_kind:resource_trash",
          `runner_tags:${runnerTags}`,
          `target_definition:${target.definitionId}`,
          `stored_credits:${storedCredits}`,
          ...(storedCredits > 0
            ? ["runner_resource_credit_bank_visible:true"]
            : []),
          ...specialEvidence.evidence,
        ],
      };
    }
    const assessment = dependencies.tagPunishAssessmentForAction(input, action);
    if (!assessment?.isPunishPayoff) return undefined;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    const affordabilityPressure =
      input.playerView.own.credits >= dependencies.actionCreditCost(action)
        ? 0
        : -400;
    if (
      assessment.payoffKind === "damage" ||
      assessment.payoffKind === "scored_agenda_damage_like"
    ) {
      return {
        kind: "damage",
        value: 2550 + Math.min(700, runnerTags * 90) + affordabilityPressure,
        evidence: [
          "tagged_payoff_kind:damage",
          "corp_tagged_meat_damage_payoff:true",
          `runner_tags:${runnerTags}`,
          `source_definition:${sourceDefinitionId || "unknown"}`,
          ...dependencies.runnerDamagePreventionEvidence(input),
          ...assessment.evidence,
        ],
      };
    }
    if (assessment.payoffKind === "economic") {
      const runnerCreditPressure =
        input.playerView.opponent.credits <= 2
          ? 300
          : input.playerView.opponent.credits <= 5
            ? 150
            : 0;
      return {
        kind: "economic",
        value:
          1850 +
          Math.min(420, runnerTags * 70) +
          runnerCreditPressure +
          affordabilityPressure,
        evidence: [
          "tagged_payoff_kind:economic",
          `runner_tags:${runnerTags}`,
          `runner_credits:${input.playerView.opponent.credits}`,
          `source_definition:${sourceDefinitionId || "unknown"}`,
          ...assessment.evidence,
        ],
      };
    }
    if (assessment.payoffKind === "hardware_trash") {
      const visibleHardwareTarget =
        dependencies.runnerHardwareTrashTarget(input);
      return {
        kind: "hardware_trash",
        value: 1800 + Math.min(420, runnerTags * 70) + affordabilityPressure,
        evidence: [
          "tagged_payoff_kind:hardware_trash",
          `runner_tags:${runnerTags}`,
          `source_definition:${sourceDefinitionId || "unknown"}`,
          ...assessment.evidence,
          ...(visibleHardwareTarget
            ? dependencies.runnerHardwarePayoffEvidence(visibleHardwareTarget)
            : []),
        ],
      };
    }
    if (assessment.payoffKind === "resource_trash") {
      const target = dependencies.runnerRigTrashTarget(input, action);
      return {
        kind: "resource_trash",
        value: 1500 + Math.min(420, runnerTags * 70) + affordabilityPressure,
        evidence: [
          "tagged_payoff_kind:resource_trash",
          `runner_tags:${runnerTags}`,
          `source_definition:${sourceDefinitionId || "unknown"}`,
          ...assessment.evidence,
          ...(target?.definitionId
            ? [`target_definition:${target.definitionId}`]
            : []),
        ],
      };
    }
    return {
      kind: "unknown",
      value: 1150 + Math.min(300, runnerTags * 60) + affordabilityPressure,
      evidence: [
        "tagged_payoff_kind:unknown",
        `runner_tags:${runnerTags}`,
        `source_definition:${sourceDefinitionId || "unknown"}`,
        ...assessment.evidence,
      ],
    };
  };

  return { corpTaggedRunnerPayoffProfile };
}
