import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";
import { classifyCorpScoredAgendaAbility } from "../corp-plans";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type CorpTagCreationDiagnosticsDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
};

export function createCorpTagCreationDiagnosticsContext(
  dependencies: CorpTagCreationDiagnosticsDependencies,
): {
  applyCorpTagSourceWindowDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
  ) => void;
  applyActualTagCreationDiagnostics: (
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    stateBeforeAction: GameState,
  ) => void;
} {
  function applyCorpTagSourceWindowDiagnostics(
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
  ): void {
    const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    const sourceType =
      RUNTIME_CARDS[sourceDefinitionId]?.type ??
      DEMO_CARDS_BY_ID[sourceDefinitionId]?.type;
    const scoredAgenda = classifyCorpScoredAgendaAbility(input, action);
    if (scoredAgenda?.kind === "scored_agenda_trace_tag")
      diagnostics.corpTagCreatedByScoredAgendaAction = true;
    else if (action.type === "play_operation")
      diagnostics.corpTagCreatedByOperation = true;
    else if (sourceType === "asset")
      diagnostics.corpTagCreatedByAssetOrNode = true;
    else if (sourceType === "ice" || action.type === "rez_ice")
      diagnostics.corpTagCreatedByIce = true;
    if (action.type === "trigger_ability")
      diagnostics.corpTagCreatedByPersistentEffect = true;
  }

  function applyActualTagCreationDiagnostics(
    diagnostics: Partial<AiSimulationSummary["actionSequence"][number]>,
    input: AiDecisionInput,
    action: LegalAction,
    decision: AiDecision,
    stateBeforeAction: GameState,
  ): void {
    if (input.side === "runner") {
      diagnostics.corpTagCreatedDuringRunnerTurn = true;
      if (
        stateBeforeAction.run ||
        action.type === "resolve_choice" ||
        decision.reasonCode.includes("trace")
      ) {
        diagnostics.corpTagCreatedDuringEncounter = true;
        diagnostics.corpTagCreatedByTraceSuccess = true;
      }
      if (
        action.type === "access_card" ||
        action.type === "steal_agenda" ||
        action.type === "trash_accessed_card" ||
        action.type === "decline_trash"
      )
        diagnostics.corpTagCreatedByAccessOrSteal = true;
      return;
    }
    if (input.side !== "corp") return;
    diagnostics.corpTagCreatedDuringCorpTurn = true;
    applyCorpTagSourceWindowDiagnostics(diagnostics, input, action);
  }

  return {
    applyCorpTagSourceWindowDiagnostics,
    applyActualTagCreationDiagnostics,
  };
}
