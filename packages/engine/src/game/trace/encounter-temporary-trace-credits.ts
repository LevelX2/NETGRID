import type { GameState } from "@netgrid/shared";

type EncounterTemporaryTraceCreditGrant = NonNullable<
  NonNullable<GameState["run"]>["encounterTemporaryTraceCredits"]
>;

export function validatedEncounterTemporaryTraceCreditRemainder(
  grant: EncounterTemporaryTraceCreditGrant,
): number {
  if (!Number.isSafeInteger(grant.remaining) || grant.remaining < 0)
    throw new Error(
      "runtime_invalid_encounter_temporary_trace_credit_remainder",
    );
  return grant.remaining;
}
