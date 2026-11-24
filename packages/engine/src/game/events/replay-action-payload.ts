import type {
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedTurnPlanSelectionCommand,
  EngineRandomizedTraceBidSelectionCommand,
  PlayerAction,
  ReplayableEngineAction,
} from "@netgrid/shared";
import { ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";

export function replayActionFromPayload(
  value: unknown,
): ReplayableEngineAction | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  if (!("kind" in value))
    return isStoredPlayerAction(value) ? value : undefined;
  switch (value.kind) {
    case "engine_randomized_ice_install_selection":
      return isReplayRandomizedIceInstallSelectionCommand(value)
        ? value
        : undefined;
    case "engine_randomized_turn_plan_selection":
      return isReplayRandomizedTurnPlanSelectionCommand(value)
        ? value
        : undefined;
    case "engine_randomized_trace_bid_selection":
      return isReplayRandomizedTraceBidSelectionCommand(value)
        ? value
        : undefined;
    default:
      return undefined;
  }
}

// Replay stores the original PlayerAction payload. This structural guard is
// intentionally narrow and must remain independent of newer action subtypes.
function isStoredPlayerAction(value: unknown): value is PlayerAction {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PlayerAction>;
  return (
    typeof record.matchId === "string" &&
    (record.side === "corp" || record.side === "runner") &&
    typeof record.actionId === "string" &&
    typeof record.clientKnownStateVersion === "number"
  );
}

function isReplayRandomizedIceInstallSelectionCommand(
  value: unknown,
): value is EngineRandomizedIceInstallSelectionCommand {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<EngineRandomizedIceInstallSelectionCommand>;
  if (
    record.kind !== "engine_randomized_ice_install_selection" ||
    !record.quote ||
    typeof record.quote !== "object"
  ) {
    return false;
  }
  const quote = record.quote;
  return (
    quote.schemaVersion ===
      ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION &&
    quote.visibility === "private_to_actor" &&
    quote.complete === true &&
    typeof quote.matchId === "string" &&
    quote.side === "corp" &&
    typeof quote.stateVersion === "number" &&
    typeof quote.timingPoint === "string" &&
    typeof quote.planStepId === "string" &&
    typeof quote.candidateFingerprint === "string" &&
    Array.isArray(quote.candidates) &&
    Array.isArray(quote.legalActions)
  );
}

function isReplayRandomizedTurnPlanSelectionCommand(
  value: unknown,
): value is EngineRandomizedTurnPlanSelectionCommand {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<EngineRandomizedTurnPlanSelectionCommand>;
  const quote = record.quote;
  return (
    record.kind === "engine_randomized_turn_plan_selection" &&
    Boolean(quote && typeof quote === "object") &&
    quote?.schemaVersion ===
      ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION &&
    quote.visibility === "private_to_actor" &&
    quote.complete === true &&
    typeof quote.matchId === "string" &&
    typeof quote.side === "string" &&
    typeof quote.stateVersion === "number" &&
    typeof quote.timingPoint === "string" &&
    typeof quote.opportunityKey === "string" &&
    typeof quote.candidateFingerprint === "string" &&
    Array.isArray(quote.candidates) &&
    Array.isArray(quote.legalActions)
  );
}

function isReplayRandomizedTraceBidSelectionCommand(
  value: unknown,
): value is EngineRandomizedTraceBidSelectionCommand {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<EngineRandomizedTraceBidSelectionCommand>;
  const quote = record.quote;
  return (
    record.kind === "engine_randomized_trace_bid_selection" &&
    Boolean(quote && typeof quote === "object") &&
    quote?.schemaVersion ===
      ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION &&
    quote.visibility === "private_to_actor" &&
    quote.complete === true &&
    typeof quote.matchId === "string" &&
    typeof quote.side === "string" &&
    typeof quote.stateVersion === "number" &&
    typeof quote.timingPoint === "string" &&
    typeof quote.actionId === "string" &&
    typeof quote.choiceId === "string" &&
    typeof quote.planStepId === "string" &&
    typeof quote.candidateFingerprint === "string" &&
    Array.isArray(quote.candidates) &&
    Boolean(quote.legalAction)
  );
}
