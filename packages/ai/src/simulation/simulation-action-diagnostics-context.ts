import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { createCorpEconomyBeforeScoreDiagnosticsForSimulationAction } from "./corp-economy-before-score-diagnostics";
import { createCorpFutureRunIceDiagnosticsForSimulationAction } from "./corp-future-run-ice-diagnostics";
import {
  createCorpScoreTerminalChosenFamily,
  createCorpScoreTerminalDiagnosticsForSimulationAction,
} from "./corp-score-terminal-diagnostics";
import { createCentralRunEventGoodForTarget } from "./no-fresh-central";
import {
  createDefinitionForSimulationAction,
  createSourceDefinitionIdForSimulationAction,
} from "./simulation-action-source-definition";

export type SimulationActionDiagnosticsContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
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
  const corpScoreTerminalChosenFamily =
    createCorpScoreTerminalChosenFamily(dependencies.rolesForAction);
  const corpScoreTerminalDiagnosticsForSimulationAction =
    createCorpScoreTerminalDiagnosticsForSimulationAction(
      corpScoreTerminalChosenFamily,
    );
  const corpEconomyBeforeScoreDiagnosticsForSimulationAction =
    createCorpEconomyBeforeScoreDiagnosticsForSimulationAction(
      corpScoreTerminalChosenFamily,
    );
  const definitionForSimulationAction = createDefinitionForSimulationAction(
    sourceDefinitionIdForSimulationAction,
  );
  const centralRunEventGoodForTarget = createCentralRunEventGoodForTarget({
    sourceDefinitionIdForAction: sourceDefinitionIdForSimulationAction,
  });

  return {
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    corpScoreTerminalDiagnosticsForSimulationAction,
    corpEconomyBeforeScoreDiagnosticsForSimulationAction,
    definitionForSimulationAction,
    centralRunEventGoodForTarget,
  };
}
