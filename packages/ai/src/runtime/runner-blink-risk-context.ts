import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerRandomBreakOrDamageRiskEvidenceForAction,
  runnerRandomBreakOrDamageRunExclusion,
  type RunnerRandomBreakOrDamageRiskEvidenceDependencies,
  type RunnerRandomBreakOrDamageRunExclusionDependencies,
} from "./runner-blink-run-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerRandomBreakOrDamageRiskContext = {
  runnerRandomBreakOrDamageRiskEvidenceForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
  runnerRandomBreakOrDamageRunExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerRandomBreakOrDamageRiskContext(
  dependencies: RunnerRandomBreakOrDamageRiskEvidenceDependencies &
    Pick<RunnerRandomBreakOrDamageRunExclusionDependencies, "shouldAvoidRun">,
): RunnerRandomBreakOrDamageRiskContext {
  return {
    runnerRandomBreakOrDamageRiskEvidenceForAction: (input, action) =>
      runnerRandomBreakOrDamageRiskEvidenceForAction(
        input,
        action,
        dependencies,
      ),
    runnerRandomBreakOrDamageRunExclusion: (input, action) =>
      runnerRandomBreakOrDamageRunExclusion(input, action, dependencies),
  };
}
