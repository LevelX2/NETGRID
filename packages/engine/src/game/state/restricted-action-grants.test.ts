import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  clearRestrictedActionGrant,
  consumeRestrictedActionGrant,
  restrictedActionGrantRemaining,
  restrictedActionGrantTemporaryCredits,
  setRestrictedActionGrant,
  spendRestrictedActionGrantTemporaryCredits,
} from "./restricted-action-grants";

function runnerFlags(): NonNullable<GameState["runnerTurnFlags"]> {
  return {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
  } as NonNullable<GameState["runnerTurnFlags"]>;
}

describe("restricted-action-grants", () => {
  it("tracks remaining actions and temporary credits through consume and clear", () => {
    const flags = runnerFlags();
    setRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      {
        side: "runner",
        sourceCardInstanceId: "valu_pak" as CardInstanceId,
        sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
        actionType: "install_card",
        remainingActions: 5,
        costProfile: "temporary_credit_bundle",
        temporaryCredits: {
          amount: 1,
          usableFor: "runner_program_install",
        },
        cleanupTiming: "side_turn_end",
      },
    );

    expect(
      restrictedActionGrantRemaining(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      ),
    ).toBe(5);
    expect(
      spendRestrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        1,
      ),
    ).toBe(1);
    expect(
      restrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      ),
    ).toBe(0);
    expect(
      consumeRestrictedActionGrant(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      ),
    ).toBe(4);

    clearRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    expect(flags.restrictedActionGrants).toBeUndefined();
  });

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid persisted remaining actions %s without mutation",
    (invalidAmount) => {
      const flags = runnerFlags();
      flags.restrictedActionGrants = {
        [RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall]: {
          side: "runner",
          sourceCardInstanceId: "valu_pak" as CardInstanceId,
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          actionType: "install_card",
          remainingActions: invalidAmount,
          costProfile: "temporary_credit_bundle",
          cleanupTiming: "side_turn_end",
        },
      };
      const before = structuredClone(flags);

      expect(() =>
        restrictedActionGrantRemaining(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        ),
      ).toThrow("runtime_invalid_restricted_action_grant_amount");
      expect(() =>
        consumeRestrictedActionGrant(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        ),
      ).toThrow("runtime_invalid_restricted_action_grant_amount");
      expect(flags).toEqual(before);
    },
  );

  it.each([NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid temporary-credit state %s and spend amounts without mutation",
    (invalidAmount) => {
      const flags = runnerFlags();
      setRestrictedActionGrant(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        {
          side: "runner",
          sourceCardInstanceId: "valu_pak" as CardInstanceId,
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          actionType: "install_card",
          remainingActions: 1,
          costProfile: "temporary_credit_bundle",
          temporaryCredits: {
            amount: 1,
            usableFor: "runner_program_install",
          },
          cleanupTiming: "side_turn_end",
        },
      );
      const grant =
        flags.restrictedActionGrants![
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall
        ]!;
      grant.temporaryCredits!.amount = invalidAmount;
      const beforeCorruptRead = structuredClone(flags);

      expect(() =>
        restrictedActionGrantTemporaryCredits(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        ),
      ).toThrow("runtime_invalid_restricted_action_grant_amount");
      expect(flags).toEqual(beforeCorruptRead);

      grant.temporaryCredits!.amount = 1;
      const beforeInvalidSpend = structuredClone(flags);
      expect(() =>
        spendRestrictedActionGrantTemporaryCredits(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
          invalidAmount,
        ),
      ).toThrow("runtime_invalid_restricted_action_grant_amount");
      expect(flags).toEqual(beforeInvalidSpend);
    },
  );
});
