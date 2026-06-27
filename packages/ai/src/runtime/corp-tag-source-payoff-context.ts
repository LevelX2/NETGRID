import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type { CorpTaggedRunnerPayoffActionProfile } from "./corp-scoring-assessment-types";

type CorpTagPunishAssessment = {
  isPunishPayoff: boolean;
  isTagSource?: boolean;
};

export type CorpTagSourcePayoffContextDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  visibleMeatDamagePayoff: (input: AiDecisionInput) => boolean;
  tagPunishAssessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTagPunishAssessment | undefined;
  tagSourceProfileForDefinition: (
    definitionId: string | undefined,
  ) => unknown | undefined;
  payoffProfileForDefinition: (definitionId: string) => unknown | undefined;
};

export function createCorpTagSourcePayoffContext(
  dependencies: CorpTagSourcePayoffContextDependencies,
): {
  corpImmediateTagSourceVisiblePayoffProfile: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpTaggedRunnerPayoffActionProfile | undefined;
  corpImmediateTagSourceAvailable: (
    input: AiDecisionInput,
    excludedAction?: LegalAction,
  ) => boolean;
  corpImmediateTagSourceAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpUnprotectedPersistentTagAssetSetup: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpVisibleTagPunishPayoffKind: (
    input: AiDecisionInput,
  ) => "damage" | "economic" | "trash" | undefined;
  corpOntologyPayoffAvailableForTagSource: (
    input: AiDecisionInput,
    sourceAction: LegalAction,
  ) => boolean;
} {
  const corpImmediateTagSourceAction = (
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean => {
    if (
      input.side !== "corp" ||
      action.side !== "corp" ||
      action.type !== "play_operation"
    )
      return false;
    return (
      dependencies.tagPunishAssessmentForAction(input, action)
        ?.isTagSource === true
    );
  };

  const corpVisibleTagPunishPayoffKind = (
    input: AiDecisionInput,
  ): "damage" | "economic" | "trash" | undefined => {
    if (dependencies.visibleMeatDamagePayoff(input)) return "damage";
    if (
      input.playerView.own.gripOrHq.some(
        (card) =>
          card.known &&
          card.definitionId &&
          dependencies.payoffProfileForDefinition(card.definitionId),
      )
    )
      return "economic";
    return undefined;
  };

  const corpImmediateTagSourceVisiblePayoffProfile = (
    input: AiDecisionInput,
    action: LegalAction,
  ): CorpTaggedRunnerPayoffActionProfile | undefined => {
    if (!corpImmediateTagSourceAction(input, action)) return undefined;
    const payoffKind = corpVisibleTagPunishPayoffKind(input);
    if (!payoffKind) return undefined;
    return {
      kind: "tag_source",
      value: payoffKind === "damage" ? 2350 : 1750,
      evidence: [
        "corp_tag_source_visible_payoff_pressure:true",
        `corp_visible_tag_punish_payoff_kind:${payoffKind}`,
        "immediate_operation_tag_source_available:true",
      ],
    };
  };

  const corpImmediateTagSourceAvailable = (
    input: AiDecisionInput,
    excludedAction?: LegalAction,
  ): boolean =>
    input.legalActions.some(
      (action) =>
        action.actionId !== excludedAction?.actionId &&
        corpImmediateTagSourceAction(input, action),
    );

  const corpUnprotectedPersistentTagAssetSetup = (
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean => {
    if (action.type !== "install_card" && action.type !== "rez_ice")
      return false;
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    return Boolean(
      dependencies.tagSourceProfileForDefinition(sourceDefinitionId),
    );
  };

  const corpOntologyPayoffAvailableForTagSource = (
    input: AiDecisionInput,
    sourceAction: LegalAction,
  ): boolean => {
    if (input.side !== "corp") return false;
    if (
      input.legalActions.some((action) => {
        if (action.actionId === sourceAction.actionId) return false;
        return dependencies.tagPunishAssessmentForAction(input, action)
          ?.isPunishPayoff;
      })
    )
      return true;
    return [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.scoreArea,
      ...input.playerView.servers.flatMap((server) => [
        ...server.ice,
        ...server.root,
      ]),
    ].some((card) =>
      Boolean(
        card.known &&
          card.definitionId &&
          dependencies.payoffProfileForDefinition(card.definitionId),
      ),
    );
  };

  return {
    corpImmediateTagSourceVisiblePayoffProfile,
    corpImmediateTagSourceAvailable,
    corpImmediateTagSourceAction,
    corpUnprotectedPersistentTagAssetSetup,
    corpVisibleTagPunishPayoffKind,
    corpOntologyPayoffAvailableForTagSource,
  };
}
