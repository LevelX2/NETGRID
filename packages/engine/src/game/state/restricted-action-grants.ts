import type { GameState, RestrictedActionGrantState } from "@netgrid/shared";

type TurnFlags =
  | NonNullable<GameState["runnerTurnFlags"]>
  | NonNullable<GameState["corpTurnFlags"]>;

export const RESTRICTED_ACTION_GRANT_KEYS = {
  valuPakProgramInstall: "valu_pak_program_install",
  edgerunnerTempsInstall: "edgerunner_temps_install",
} as const;

export type RestrictedActionGrantKey =
  (typeof RESTRICTED_ACTION_GRANT_KEYS)[keyof typeof RESTRICTED_ACTION_GRANT_KEYS];

export function setRestrictedActionGrant(
  flags: TurnFlags,
  key: RestrictedActionGrantKey,
  grant: RestrictedActionGrantState,
): void {
  assertValidGrantAmount(grant.remainingActions, "remaining actions");
  if (grant.temporaryCredits)
    assertValidGrantAmount(grant.temporaryCredits.amount, "temporary credits");
  flags.restrictedActionGrants = {
    ...(flags.restrictedActionGrants ?? {}),
    [key]: validatedGrantCopy(grant),
  };
}

export function restrictedActionGrant(
  flags: TurnFlags | undefined,
  key: RestrictedActionGrantKey,
): RestrictedActionGrantState | undefined {
  const grant = flags?.restrictedActionGrants?.[key];
  if (!grant) return undefined;
  validateGrant(grant);
  return grant;
}

export function restrictedActionGrantRemaining(
  flags: TurnFlags | undefined,
  key: RestrictedActionGrantKey,
): number {
  return restrictedActionGrant(flags, key)?.remainingActions ?? 0;
}

export function restrictedActionGrantTemporaryCredits(
  flags: TurnFlags | undefined,
  key: RestrictedActionGrantKey,
): number {
  return restrictedActionGrant(flags, key)?.temporaryCredits?.amount ?? 0;
}

export function spendRestrictedActionGrantTemporaryCredits(
  flags: TurnFlags,
  key: RestrictedActionGrantKey,
  amount: number,
): number {
  const grant = restrictedActionGrant(flags, key);
  assertValidGrantAmount(amount, "temporary credit spend");
  if (!grant || !grant.temporaryCredits || amount === 0) return 0;
  const spent = Math.min(grant.temporaryCredits.amount, amount);
  grant.temporaryCredits.amount -= spent;
  return spent;
}

export function consumeRestrictedActionGrant(
  flags: TurnFlags,
  key: RestrictedActionGrantKey,
): number {
  const grant = restrictedActionGrant(flags, key);
  if (!grant) return 0;
  const remaining = Math.max(0, grant.remainingActions - 1);
  grant.remainingActions = remaining;
  if (remaining <= 0) {
    if (grant.temporaryCredits) grant.temporaryCredits.amount = 0;
    clearRestrictedActionGrant(flags, key);
  }
  return remaining;
}

export function clearRestrictedActionGrant(
  flags: TurnFlags,
  key: RestrictedActionGrantKey,
): void {
  if (!flags.restrictedActionGrants?.[key]) return;
  const next = { ...flags.restrictedActionGrants };
  delete next[key];
  if (Object.keys(next).length === 0) delete flags.restrictedActionGrants;
  else flags.restrictedActionGrants = next;
}

function validatedGrantCopy(
  grant: RestrictedActionGrantState,
): RestrictedActionGrantState {
  validateGrant(grant);
  return {
    ...grant,
    remainingActions: grant.remainingActions,
    ...(grant.temporaryCredits
      ? {
          temporaryCredits: {
            ...grant.temporaryCredits,
            amount: grant.temporaryCredits.amount,
          },
        }
      : {}),
  };
}

function validateGrant(grant: RestrictedActionGrantState): void {
  assertValidGrantAmount(grant.remainingActions, "remaining actions");
  if (grant.temporaryCredits)
    assertValidGrantAmount(grant.temporaryCredits.amount, "temporary credits");
}

function assertValidGrantAmount(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`runtime_invalid_restricted_action_grant_amount:${label}`);
}
