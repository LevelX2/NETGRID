import type { AiDecisionDebug } from "@netgrid/shared";
import { scrubEvidence } from "../runtime/semantic-runtime-score-components";

export function semanticRuntimeDecisionDebugTopLevelWhyNot(
  actionAlternatives: NonNullable<AiDecisionDebug["actionAlternatives"]>,
): string[] {
  return unique(
    scrubEvidence(
      actionAlternatives
        .filter((alternative) => !alternative.selected)
        .flatMap((alternative) =>
          (alternative.whyNot ?? []).map(
            (fact) => `alternative:${alternative.actionType}:${fact}`,
          ),
        ),
    ),
  ).slice(0, 12);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
