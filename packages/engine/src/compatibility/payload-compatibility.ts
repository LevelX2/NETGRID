import type {
  LegacyAbilityPayloadField,
  PlayerAction,
} from "@netgrid/shared";

// These payload keys are part of historic LegalAction IDs. Keep the field names
// stable until PublicPayload, chronicle, replay, and action-board consumers have
// a coordinated migration path.
export const ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS = [
  "v1911HiddenZoneAbility",
  "v1917AssetAbility",
  "v1918UpgradeAbility",
  "v1919AssetAbility",
  "v1919OperationAbility",
  "v1919UpgradeAbility",
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
] as const satisfies readonly LegacyAbilityPayloadField[];

const P358_HIDDEN_REPLACEMENT_CHOICE_PREFIX = "hidden_zone.";
const P358_FORTRESS_RESPECIFICATION_CHOICE_PREFIX =
  "hidden_zone.successful_run_fort_ice_reorder:";
const SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX =
  "hidden_zone.secret_spend_guess_then_targeted_bypass_run.";
const P358_NEW_BLOOD_REORDER_CHOICE_PREFIX = "hidden_zone.conceal_and_reorder_installed_ice:";

// Hidden replacement choices use functional source prefixes; card files may
// name cards, but runtime replay/stale guards should describe the reusable path.
export function isP358HiddenReplacementCompatibilityChoiceSource(
  source: string,
): boolean {
  return source.startsWith(P358_HIDDEN_REPLACEMENT_CHOICE_PREFIX);
}

export function isP358FortressRespecificationChoiceSource(
  source: string,
): boolean {
  return source.startsWith(P358_FORTRESS_RESPECIFICATION_CHOICE_PREFIX);
}

export function isSecretSpendGuessTargetedBypassRunChoiceSource(source: string): boolean {
  return source.startsWith(SECRET_SPEND_GUESS_TARGETED_BYPASS_RUN_CHOICE_PREFIX);
}

export function isP358NewBloodReorderChoiceSource(source: string): boolean {
  return source.startsWith(P358_NEW_BLOOD_REORDER_CHOICE_PREFIX);
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
