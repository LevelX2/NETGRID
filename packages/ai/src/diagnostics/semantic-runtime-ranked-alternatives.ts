import type { AiDecisionDebug } from "@netgrid/shared";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import { scrubEvidence } from "../runtime/semantic-runtime-score-components";
import { semanticRuntimeDebugRankedAlternatives } from "./semantic-runtime-debug";

export function buildSemanticRuntimeRankedAlternatives(params: {
  rankedChoices: readonly SemanticRuntimeChoice[];
  selectedActionId: string;
  scoreBreakdownForChoice: (
    choice: SemanticRuntimeChoice,
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
}): NonNullable<AiDecisionDebug["rankedAlternatives"]> {
  return semanticRuntimeDebugRankedAlternatives({
    rankedChoices: params.rankedChoices,
    selectedActionId: params.selectedActionId,
    scoreBreakdownForChoice: params.scoreBreakdownForChoice,
    scrubEvidence,
  });
}
