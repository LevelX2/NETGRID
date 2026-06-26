import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import type {
  CorpPunishKind,
  CorpVisibleTagPayoffCategory,
} from "../runtime/corp-tag-punish-types";

export type CorpVisibleTagPunishOpportunity = {
  action: LegalAction;
  kind: CorpPunishKind;
  category: CorpVisibleTagPayoffCategory;
  cardId: string | undefined;
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
  ) => string;
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
        (
          opportunity,
        ): opportunity is CorpVisibleTagPunishOpportunity =>
          opportunity !== undefined,
      );
  }

  return { corpVisibleTagPunishOpportunities };
}
