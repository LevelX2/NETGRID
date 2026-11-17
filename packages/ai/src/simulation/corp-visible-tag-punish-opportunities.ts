import type {
  AiDecisionInput,
  CorpPunishRouteQuote,
  LegalAction,
} from "@netgrid/shared";

import type {
  CorpPunishKind,
  CorpVisibleTagPayoffCategory,
} from "../runtime/corp-tag-punish-types";

export type CorpVisibleTagPunishOpportunity = {
  action: LegalAction;
  kind: CorpPunishKind;
  category: CorpVisibleTagPayoffCategory;
  cardId: number | undefined;
};

export type CorpVisibleTagPunishOpportunityContextDependencies = {
  corpPunishKindForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpPunishKind | undefined;
  corpVisibleTagPayoffCategoryForAction: (
    input: AiDecisionInput,
    action: LegalAction,
    kind: CorpPunishKind,
  ) => CorpVisibleTagPayoffCategory;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
};

export function createCorpVisibleTagPunishOpportunityContext(
  dependencies: CorpVisibleTagPunishOpportunityContextDependencies,
): {
  corpVisibleTagPunishOpportunities: (
    input: AiDecisionInput,
  ) => CorpVisibleTagPunishOpportunity[];
} {
  function corpVisibleTagPunishOpportunities(
    input: AiDecisionInput,
  ): CorpVisibleTagPunishOpportunity[] {
    if (input.side !== "corp") return [];
    return input.legalActions
      .filter((action) => action.side === "corp")
      .map((action) => {
        const kind = dependencies.corpPunishKindForAction(input, action);
        if (!kind) return undefined;
        return {
          action,
          kind,
          category: dependencies.corpVisibleTagPayoffCategoryForAction(
            input,
            action,
            kind,
          ),
          cardId:
            dependencies.sourceDefinitionIdForAction(input, action) ||
            undefined,
        };
      })
      .filter(
        (opportunity): opportunity is CorpVisibleTagPunishOpportunity =>
          opportunity !== undefined,
      );
  }

  return { corpVisibleTagPunishOpportunities };
}

export function visibleCurrentPunishDamageQuote(
  input: AiDecisionInput,
  opportunity: CorpVisibleTagPunishOpportunity,
): CorpPunishRouteQuote | undefined {
  const view = input.playerView;
  const handCount = view.opponent.handCount;
  return view.corpPunishRouteQuoteSet?.routes.find(
    (route) =>
      route.complete &&
      route.stateVersion === view.stateVersion &&
      route.timingPoint === view.timingPoint &&
      route.steps.length === 1 &&
      route.steps[0]?.currentLegalAction?.actionId ===
        opportunity.action.actionId &&
      route.damageEnvelope.runnerHandCount === handCount,
  );
}
