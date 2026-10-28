import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta566-broker-admitted-run-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it("pays out a mature bank for the admitted HQ funding parent instead of three basic credits", () => {
  const { input, runtime, validation } = fixture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const selected = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  );
  expect(selected).toMatchObject({
    type: "activated_card_ability",
    source: "runner_onr_v1_154_broker_1",
    payload: { cardImplementationAbilityKey: "withdraw_credits" },
  });
  expect(result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.credit_bank",
  );
  const bank = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.moduleId === "runner.credit_bank",
  )!;
  expect(bank.moduleState).toMatchObject({
    phase: "cash_out",
    signal: {
      priorityClass: "P4",
      estimatedPayout: 9,
      runFunding: {
        parentPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
        needId: "run-support:central:hq",
        runActionId: "runner.start_run.hq",
        stateVersion: 121,
        gap: 3,
        routeAssessment: {
          totalClickCost: 1,
          status: "covered_guaranteed",
          firstStepActionId: result.actionId,
        },
      },
    },
  });
});

import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterGuaranteedBankCashouts,
} from "../../runner-run-target-evaluation";
import { assessRunnerRunFundingAdmission } from "../../runtime/runner-run-funding-admission";
import { runnerRunRequiredPostRunReserve } from "../../run-analysis/runner-plan-run-funding";
import { creditBankReplacesBasicRunFunding } from "./credit-bank-basic-run-funding";
function fundingParams() {
  const { input } = fixture(),
    candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }),
    economy = buildRunnerEconomyPosture({ input }),
    targets = evaluateRunnerRunTargets({
      input,
      deckCapabilities: input.ownDeckCapabilities!,
    }),
    target = targets.find((t) => t.actionId === "runner.start_run.hq")!,
    cash = candidates.find(
      (c) =>
        c.planOwnerBinding?.owner === "runner.credit_bank" &&
        c.economyProjection?.payoutMode === "all_available",
    )!;
  const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
    input,
    candidates,
    economy,
    target,
  );
  const admission = assessRunnerRunFundingAdmission({
    input,
    target,
    runTargets: targets,
    economy,
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
  });
  expect(admission).toMatchObject({
    admitted: true,
    concreteFundingGap: 3,
    urgentScoreThreat: false,
  });
  return {
    input,
    candidates,
    economy,
    target,
    admission,
    cashOutActionIds: [cash.actionId],
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
    quoteAfterCashouts: (t: typeof target, ids: readonly string[]) =>
      quoteRunnerRunAfterGuaranteedBankCashouts({
        input,
        deckCapabilities: input.ownDeckCapabilities!,
        fundingCandidates: ids.map(
          (id) => candidates.find((c) => c.actionId === id)!,
        ),
        runActionId: t.actionId,
        targetServerId: t.targetServerId,
      }),
  };
}
it("retains the original admission and saves two funding actions with a fresh same-action quote", () => {
  const p = fundingParams(),
    before = JSON.stringify(p.input),
    route = creditBankReplacesBasicRunFunding(p);
  expect(JSON.stringify(p.input)).toBe(before);
  expect(route).toMatchObject({
    priorityClass: "P4",
    runFunding: { gap: 3, routeAssessment: { totalClickCost: 1 } },
  });
  expect(route?.evidenceCodes).toContain(
    "runner_credit_bank_replaced_basic_clicks:3",
  );
});
it("does not invent a parent when shared run admission rejects the target", () => {
  const p = fundingParams();
  p.admission.admitted = false;
  expect(creditBankReplacesBasicRunFunding(p)).toBeUndefined();
});
it("keeps the whole existing basic funding prefix and the run inside the remaining actions", () => {
  const p = fundingParams();
  p.input.playerView.own.clicks = 3;
  expect(creditBankReplacesBasicRunFunding(p)).toBeUndefined();
});
it("rejects a stale payout action at the current funding quote", () => {
  const p = fundingParams();
  p.input.legalActions.find((a) => a.actionId === p.cashOutActionIds[0])!
    .expiresAtStateVersion--;
  expect(creditBankReplacesBasicRunFunding(p)).toBeUndefined();
});
it("rejects a quote for another run instead of transferring the funding certificate", () => {
  const p = fundingParams(),
    quote = p.quoteAfterCashouts;
  p.quoteAfterCashouts = (t, ids) => {
    const z = quote(t, ids);
    return z ? { ...z, actionId: "runner.start_run.rd" } : undefined;
  };
  expect(creditBankReplacesBasicRunFunding(p)).toBeUndefined();
});
it("does not replace a one-action guaranteed income alternative with the bank", () => {
  const p = fundingParams(),
    basic = p.candidates.find((c) => c.actionType === "gain_credit")!;
  p.candidates.push({
    ...basic,
    actionId: "current-income-route",
    actionType: "play_event",
    economyProjection: {
      ...basic.economyProjection!,
      grossLiquidCreditGain: 3,
      netLiquidCreditGain: 3,
    },
  });
  expect(creditBankReplacesBasicRunFunding(p)).toBeUndefined();
});
