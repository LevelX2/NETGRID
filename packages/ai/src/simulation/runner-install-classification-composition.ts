import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { createRunnerInstallClassificationContext } from "./runner-install-classification";

export type RunnerInstallClassificationCompositionDependencies = {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  rolesForCardId: (definitionId: string | undefined) => string[];
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  isSearchChoice: (
    choice: NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>,
  ) => boolean;
};

export function createRunnerInstallClassificationComposition(
  dependencies: RunnerInstallClassificationCompositionDependencies,
) {
  return createRunnerInstallClassificationContext({
    rolesForAction: dependencies.rolesForAction,
    rolesForCardId: dependencies.rolesForCardId,
    sourceDefinitionIdForAction:
      dependencies.sourceDefinitionIdForSimulationAction,
    isSearchChoice: dependencies.isSearchChoice,
  });
}
