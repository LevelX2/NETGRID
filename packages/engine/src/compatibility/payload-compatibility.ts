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
  "shellTradersAbility",
  "acmeSavingsAndLoanAbility",
  "agendaAbility",
] as const satisfies readonly LegacyAbilityPayloadField[];

const P358_HIDDEN_REPLACEMENT_CHOICE_PREFIX = "p3_58.";
const P358_FORTRESS_RESPECIFICATION_CHOICE_PREFIX =
  "p3_58.fortress_respecification:";
const P358_SOCIAL_ENGINEERING_CHOICE_PREFIX = "p3_58.social_engineering_";
const P358_NEW_BLOOD_REORDER_CHOICE_PREFIX = "p3_58.new_blood_reorder:";

// P3.58 choices predate the current typed HiddenReplacementLongtail split, but
// their choice IDs and source prefixes are replay and stale-revalidation inputs.
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

export function isP358SocialEngineeringChoiceSource(source: string): boolean {
  return source.startsWith(P358_SOCIAL_ENGINEERING_CHOICE_PREFIX);
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
