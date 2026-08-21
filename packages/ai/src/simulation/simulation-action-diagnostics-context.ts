import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { createCorpFutureRunIceDiagnosticsForSimulationAction } from "./corp-future-run-ice-diagnostics";
import {
  createDefinitionForSimulationAction,
  createSourceDefinitionIdForSimulationAction,
} from "./simulation-action-source-definition";

export type SimulationActionDiagnosticsContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
};

export function createSimulationActionDiagnosticsContext(
  dependencies: SimulationActionDiagnosticsContextDependencies,
) {
  const sourceDefinitionIdForSimulationAction =
    createSourceDefinitionIdForSimulationAction(dependencies.findVisibleCard);
  const corpFutureRunIceDiagnosticsForSimulationAction =
    createCorpFutureRunIceDiagnosticsForSimulationAction(
      sourceDefinitionIdForSimulationAction,
    );
  const definitionForSimulationAction = createDefinitionForSimulationAction(
    sourceDefinitionIdForSimulationAction,
  );

  return {
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    definitionForSimulationAction,
  };
}
