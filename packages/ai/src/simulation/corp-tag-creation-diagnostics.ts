import type {
  AiDecisionInput,
  GameState,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";

import { RUNTIME_CARDS } from "../ai-hints";
import { classifyTagSourceFromOntology } from "../tag-punish-ontology-consumer";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type CorpTagCreationDiagnosticsDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
};

export function createCorpTagCreationDiagnosticsContext(
  dependencies: CorpTagCreationDiagnosticsDependencies,
): {
  applyActualTagCreationDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    stateBeforeAction: GameState,
    result: PublicGameEvent["publicPayload"],
  ) => void;
} {
  function classifySource(
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    action: LegalAction,
    sourceDefinitionId: number | undefined,
  ): void {
    const sourceType = sourceDefinitionId === undefined
      ? undefined
      : RUNTIME_CARDS[sourceDefinitionId]?.type ?? planningCardFactsByDefinitionId(sourceDefinitionId)?.type;
    const tagSourceProfile = classifyTagSourceFromOntology(sourceDefinitionId);
    if (sourceType === "agenda" && tagSourceProfile?.traceTagSource)
      diagnostics.corpTagCreatedByScoredAgendaAction = true;
    else if (sourceType === "operation" || action.type === "play_operation")
      diagnostics.corpTagCreatedByOperation = true;
    else if (sourceType === "asset")
      diagnostics.corpTagCreatedByAssetOrNode = true;
    else if (sourceType === "ice" || action.type === "rez_ice")
      diagnostics.corpTagCreatedByIce = true;
    if (
      action.type === "trigger_ability" ||
      action.type === "activated_card_ability"
    )
      diagnostics.corpTagCreatedByPersistentEffect = true;
  }

  function applyActualTagCreationDiagnostics(
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    stateBeforeAction: GameState,
    result: PublicGameEvent["publicPayload"],
  ): void {
    const phase =
      stateBeforeAction.trace?.returnPhase ?? stateBeforeAction.phase;
    const duringRun = stateBeforeAction.run !== undefined || phase === "run";
    if (duringRun || phase.startsWith("runner_")) {
      diagnostics.corpTagCreatedDuringRunnerTurn = true;
    } else if (phase.startsWith("corp_")) {
      diagnostics.corpTagCreatedDuringCorpTurn = true;
    }
    if (stateBeforeAction.run?.encounteredIceId !== undefined)
      diagnostics.corpTagCreatedDuringEncounter = true;

    const traceSucceeded =
      result.traceSuccessful === true && result.traceEffectCanceled !== true;
    if (traceSucceeded) {
      diagnostics.corpTagCreatedByTraceSuccess = true;
      if (duringRun) diagnostics.runnerTaggedAfterTraceDuringRun = true;
    }
    if (
      action.type === "access_card" ||
      action.type === "steal_agenda" ||
      action.type === "trash_accessed_card" ||
      action.type === "decline_trash" ||
      stateBeforeAction.pendingAddTagContinuation?.kind === "access_effect"
    ) {
      diagnostics.corpTagCreatedByAccessOrSteal = true;
    }
    const sourceDefinitionId =
      typeof result.sourceDefinitionId === "number"
        ? result.sourceDefinitionId
        : dependencies.sourceDefinitionIdForAction(input, action);
    classifySource(diagnostics, action, sourceDefinitionId);
  }

  return { applyActualTagCreationDiagnostics };
}
