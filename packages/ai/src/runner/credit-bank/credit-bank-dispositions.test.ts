import { describe, expect, it } from "vitest";
import { runnerCreditBankActionDispositions } from "./credit-bank-dispositions";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

describe("credit-bank dispositions", () => {
  it("rejects only the bound bank alternatives and preserves active routes of other economy owners", () => {
    const bank = signal({
      actionIds: ["load:broker-1"],
      rejectedActionIds: ["cashout:broker-1", "shared-lifecycle-action"],
    });
    expect(
      runnerCreditBankActionDispositions([bank], ["shared-lifecycle-action"]),
    ).toEqual([
      {
        actionId: "cashout:broker-1",
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.credit_bank",
        evidenceCode: "runner_credit_bank_first_load",
      },
    ]);
    expect(bank.actionIds).toEqual(["load:broker-1"]);
  });

  it("does not turn a resident hold without rejected actions into an action disposition", () => {
    expect(
      runnerCreditBankActionDispositions(
        [
          signal({
            phase: "hold",
            actionIds: [],
          }),
        ],
        [],
      ),
    ).toEqual([]);
  });

  it("keeps separate copies' rejected action IDs and explanations", () => {
    expect(
      runnerCreditBankActionDispositions(
        [
          signal({ rejectedActionIds: ["cashout:broker-1"] }),
          signal({
            bankId: "broker-2",
            phase: "hold",
            actionIds: [],
            rejectedActionIds: ["load:broker-2"],
            evidenceCodes: ["runner_credit_bank_hold_instance_built_this_turn"],
          }),
        ],
        [],
      ).map(({ actionId, evidenceCode }) => ({ actionId, evidenceCode })),
    ).toEqual([
      {
        actionId: "cashout:broker-1",
        evidenceCode: "runner_credit_bank_first_load",
      },
      {
        actionId: "load:broker-2",
        evidenceCode: "runner_credit_bank_hold_instance_built_this_turn",
      },
    ]);
  });
});

function signal(
  overrides: Partial<RunnerCreditBankSignal>,
): RunnerCreditBankSignal {
  return {
    bankId: "broker-1",
    phase: "build",
    actionIds: [],
    priorityClass: "P4",
    currentStoredCredits: 0,
    portfolioStoredCredits: 0,
    estimatedPayout: 0,
    value: 72,
    evidenceCodes: ["runner_credit_bank_first_load"],
    ...overrides,
  };
}
