import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";

import {
  selectedChoicesForDecision as selectedChoicesForDecisionRuntime,
  type SelectedChoicesForDecisionDependencies,
} from "../runtime/selected-choices-for-decision";
import {
  decisionFromLegacyChoices,
} from "./decision-from-choices";
import type { LegacyBaselineChoice } from "./legacy-baseline";

export type LegacyDecisionContextDependencies =
  SelectedChoicesForDecisionDependencies & {
    scrubEvidence: (evidence: readonly string[]) => string[];
  };

export function createLegacyDecisionContext(
  dependencies: LegacyDecisionContextDependencies,
): {
  decisionFromChoices: (
    input: AiDecisionInput,
    choices: LegacyBaselineChoice[],
  ) => AiDecision;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
} {
  function selectedChoicesForDecision(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecision["selectedChoices"] | undefined {
    return selectedChoicesForDecisionRuntime(input, action, dependencies);
  }

  function decisionFromChoices(
    input: AiDecisionInput,
    choices: LegacyBaselineChoice[],
  ): AiDecision {
    return decisionFromLegacyChoices(input, choices, {
      selectedChoicesForDecision,
      scrubEvidence: dependencies.scrubEvidence,
    });
  }

  return {
    decisionFromChoices,
    selectedChoicesForDecision,
  };
}
