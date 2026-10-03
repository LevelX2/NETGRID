import { describe, expect, it } from "vitest";
import type { RunnerCreditBankSignal } from "./credit-bank-types";
import type { RunnerRemoteContestSignal } from "../../plans/runner-tactical-plan-contracts";
import { reconcileRunnerCreditBankRunFunding } from "./credit-bank-funding-revalidation";
import { runnerCreditBankActionDispositions } from "./credit-bank-dispositions";

function bank(): RunnerCreditBankSignal {
  return {
    bankId: "bank-1",
    phase: "cash_out",
    actionIds: ["withdraw-1"],
    priorityClass: "P2",
    currentStoredCredits: 9,
    portfolioStoredCredits: 15,
    estimatedPayout: 9,
    value: 1209,
    evidenceCodes: ["bound_run_funding"],
    runFunding: {
      parentPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      needId: "run-support:remote:remote_1",
      runActionId: "runner.start_run.remote_1",
      stateVersion: 324,
      gap: 5,
      routeAssessment: {
        stateVersion: 324,
        routeId: "banks-for-remote-1",
        status: "covered_guaranteed",
        reliability: "guaranteed",
        horizon: "same_turn",
        firstStepActionId: "withdraw-1",
        totalClickCost: 2,
        projectedGap: 0,
        evidenceCodes: ["finite_bank_route"],
      },
    },
  };
}

function parent(): RunnerRemoteContestSignal {
  return {
    contestId: "remote:remote_1",
    serverId: "remote_1",
    purpose: "contest",
    knownAgendaThreat: false,
    terminalPatternThreat: true,
    reachable: false,
    marginalValue: 1400,
    evidenceCode: "bound_terminal_remote",
    supportNeedId: "run-support:remote:remote_1",
    runActionAssessments: {},
  };
}

describe("bank funding revalidation at the actual run-owner boundary", () => {
  it("preserves the exact positive parent waiting for funding without altering the prospective signal", () => {
    const original = bank();
    expect(
      reconcileRunnerCreditBankRunFunding([original], 324, {
        centralPressure: [],
        remoteContests: [parent()],
      })[0],
    ).toBe(original);
  });

  it.each([
    "missing_parent",
    "different_parent",
    "different_need",
    "no_value",
    "prepared_route",
    "expired_state",
  ] as const)(
    "withdraws the exact support proposal when its proof is %s",
    (boundary) => {
      const original = bank(),
        remote = parent();
      if (boundary === "different_parent") remote.contestId = "remote:remote_2";
      if (boundary === "different_need") remote.supportNeedId = "other-need";
      if (boundary === "no_value") remote.marginalValue = 0;
      if (boundary === "prepared_route") {
        delete remote.supportNeedId;
        remote.reachable = true;
        remote.routePreparation = "targeted_ice_trash";
        remote.preparationActionIds = ["prepare-ice"];
      }
      const [result] = reconcileRunnerCreditBankRunFunding(
        [original],
        boundary === "expired_state" ? 325 : 324,
        {
          centralPressure: [],
          remoteContests: boundary === "missing_parent" ? [] : [remote],
        },
      );
      expect(result).toMatchObject({
        phase: "hold",
        actionIds: [],
        rejectedActionIds: ["withdraw-1"],
        value: 0,
      });
      expect(result!.runFunding).toBeUndefined();
      expect(runnerCreditBankActionDispositions([result!], [])).toMatchObject([
        {
          actionId: "withdraw-1",
          ownerModuleId: "runner.credit_bank",
          disposition: "explicitly_nonproductive",
        },
      ]);
      expect(original.actionIds).toEqual(["withdraw-1"]);
      expect(original.runFunding!.stateVersion).toBe(324);
    },
  );

  it("retains a bank phase that is not funding a foreign run", () => {
    const original = bank();
    delete original.runFunding;
    original.phase = "build";
    expect(
      reconcileRunnerCreditBankRunFunding([original], 325, {
        centralPressure: [],
        remoteContests: [],
      })[0],
    ).toBe(original);
  });

  it("also requires the exact current central parent and need", () => {
    const original = bank();
    original.runFunding!.parentPlanInstanceId =
      "plan:runner.pressure_central:central%3Ahq";
    original.runFunding!.needId = "run-support:central:hq";
    const central = {
      pressureId: "central:hq",
      serverId: "hq" as const,
      purpose: "access" as const,
      strategyLineIds: [],
      priorityClass: "P4" as const,
      reachable: false,
      marginalValue: 300,
      evidenceCode: "central_funding",
      supportNeedId: "run-support:central:hq",
    };
    expect(
      reconcileRunnerCreditBankRunFunding([original], 324, {
        centralPressure: [central],
        remoteContests: [],
      })[0],
    ).toBe(original);
    central.pressureId = "central:rd";
    expect(
      reconcileRunnerCreditBankRunFunding([original], 324, {
        centralPressure: [central],
        remoteContests: [],
      })[0]!.phase,
    ).toBe("hold");
  });
});
