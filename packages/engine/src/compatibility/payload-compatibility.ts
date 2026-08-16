import type {
  AbilityPayloadDiscriminatorField,
  EngineRandomizedIceInstallSelectionCommand,
  EngineRandomizedTurnPlanSelectionCommand,
  EngineRandomizedTraceBidSelectionCommand,
  PlayerAction,
} from "@netgrid/shared";
import { ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";

// Only current execution discriminators that contribute to Action IDs belong
// here. The order is deterministic because replay and stale-action validation
// compare generated IDs inside the current build.
export const ACTION_ID_ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS = [
  "v1911HiddenZoneAbility",
  "v1917AssetAbility",
  "v1918UpgradeAbility",
  "v1919OperationAbility",
  "v1919RunnerProgramAbility",
  "v1919RunnerEventAbility",
  "v1920AssetAbility",
  "v1921AssetAbility",
  "v1921UpgradeAbility",
  "v1921RunnerProgramAbility",
  "v1921RunnerResourceAbility",
  "resourceAbility",
  "runnerAbility",
  "delayedInstallAbility",
  "obligationDebtAbility",
  "agendaAbility",
] as const satisfies readonly AbilityPayloadDiscriminatorField[];

const P358_HIDDEN_REPLACEMENT_CHOICE_PREFIX = "hidden_zone.";
const P358_SUCCESSFUL_RUN_FORT_ICE_REORDER_CHOICE_PREFIX =
  "hidden_zone.successful_run_fort_ice_reorder:";
const SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX =
  "hidden_zone.secret_spend_guess_then_targeted_bypass_run.";
const P358_CONCEAL_AND_REORDER_INSTALLED_ICE_CHOICE_PREFIX =
  "hidden_zone.conceal_and_reorder_installed_ice:";

// Hidden replacement choices use functional source prefixes; card files may
// name cards, but runtime replay/stale guards should describe the reusable path.
export function isP358HiddenReplacementCompatibilityChoiceSource(
  source: string,
): boolean {
  return source.startsWith(P358_HIDDEN_REPLACEMENT_CHOICE_PREFIX);
}

export function isP358SuccessfulRunFortIceReorderChoiceSource(
  source: string,
): boolean {
  return source.startsWith(P358_SUCCESSFUL_RUN_FORT_ICE_REORDER_CHOICE_PREFIX);
}

export function isSecretSpendGuessTargetedBypassRunChoiceSource(
  source: string,
): boolean {
  return source.startsWith(
    SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX,
  );
}

export function isP358ConcealAndReorderInstalledIceChoiceSource(
  source: string,
): boolean {
  return source.startsWith(
    P358_CONCEAL_AND_REORDER_INSTALLED_ICE_CHOICE_PREFIX,
  );
}

// Replay stores the original PlayerAction payload. This structural guard is
// intentionally narrow and must remain independent of newer action subtypes.
export function isReplayCompatibilityActionPayload(
  value: unknown,
): value is PlayerAction {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PlayerAction>;
  return (
    typeof record.matchId === "string" &&
    typeof record.side === "string" &&
    typeof record.actionId === "string" &&
    typeof record.clientKnownStateVersion === "number"
  );
}

export function isReplayRandomizedIceInstallSelectionCommand(
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

export function isReplayRandomizedTurnPlanSelectionCommand(
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

export function isReplayRandomizedTraceBidSelectionCommand(
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
