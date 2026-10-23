import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import {
  normalizeRunnerRunPathCreditBudget,
  runnerRunPathCreditBudgetWithVisiblePools,
  spendBreakerCredits,
  spendGeneralCredits,
  spendTraceEligibleCredits,
  fundRunnerRunPathPayment,
} from "../../run-analysis/visible-run-credit-budget";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capture(key: "start" | "bid") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta552-trace-eligible-run-credits.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).states[key] as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}

describe("native trace eligibility of run-only money", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("agrees with the actual Engine trace-payment options", () => {
    const f = capture("bid");
    expect(Object.keys(f.validation)).toHaveLength(9);
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    expect(f.input.playerView.own.credits).toBe(4);
    expect(f.input.playerView.pendingChoice?.options.map((o) => o.id)).toEqual([
      "bid_0",
      "bid_1",
      "bid_2",
      "bid_3",
      "bid_4",
    ]);
    const start = capture("start");
    const event = evaluateRunnerRunTargets({ input: start.input }).find(
      (e) =>
        e.runActionProjection.temporaryRunCredits === 9 &&
        e.targetServerId === "hq",
    )!;
    expect(event.visibleIceRunHazards?.[0]).toMatchObject({
      runnerTraceCapacity: 4,
      baseTraceCovered: false,
      visibleCorpMaxTraceCovered: false,
      unavoidable: true,
    });
    expect(event.recommendation).toBe("setup_first");
  });
  it("chooses the current legal setup owner instead of the fatal Lucidrine run", () => {
    const f = capture("start");
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    const hash = () =>
      createHash("sha256").update(JSON.stringify(f.input)).digest("hex");
    const before = hash();
    restoreAiRuntimeCheckpoint(
      f.input,
      f.input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    const d = chooseAiAction(f.input);
    expect(d.actionId).toBe("runner.draw_card");
    expect(d.fallbackUsed).toBe(false);
    expect(d.timeoutUsed).toBe(false);
    expect(f.input.legalActions.some((a) => a.actionId === d.actionId)).toBe(
      true,
    );
    const p = d.decisionDebug?.planFirstDecision;
    expect(p?.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
    expect(p?.route).toMatchObject({
      actionId: d.actionId,
      stateVersion: f.input.playerView.stateVersion,
    });
    expect(p?.route?.planInstanceId).toBe(p?.leafExecutorInstanceId);
    expect(p?.selectedStep?.planInstanceId).toBe(p?.leafExecutorInstanceId);
    expect(hash()).toBe(before);
  });
  it("retains general money while paying an actual run expense from the run-only pool", () => {
    const b = normalizeRunnerRunPathCreditBudget(
      runnerRunPathCreditBudgetWithVisiblePools(13, [], { liquidCredits: 4 }),
    );
    spendGeneralCredits(b, 3);
    expect(b).toMatchObject({ credits: 10, traceEligibleCredits: 4 });
    spendTraceEligibleCredits(b, 4);
    expect(b).toMatchObject({ credits: 6, traceEligibleCredits: 0 });
    expect(() => spendTraceEligibleCredits(b, 1)).toThrow(
      "trace_payment_exceeds_eligible_credits",
    );
  });
  it("continues to pay breakers with run-only money and accounts for the cash remainder", () => {
    const b = normalizeRunnerRunPathCreditBudget({
      credits: 13,
      traceEligibleCredits: 4,
    });
    spendBreakerCredits(b, {
      cost: 11,
      breakerInstanceId: "b",
      breakerDefinitionId: "b",
      breakerSubtypes: ["icebreaker"],
      endingStrength: 1,
      carriesStrengthAcrossIce: false,
    });
    expect(b).toMatchObject({ credits: 2, traceEligibleCredits: 2 });
  });
  it("makes a real one-shot general-credit payout trace eligible", () => {
    const b = normalizeRunnerRunPathCreditBudget({
      credits: 10,
      traceEligibleCredits: 1,
      paymentSupportLiquidCredits: 1,
      paymentSupportSources: [
        {
          cardInstanceId: "s",
          sourceAbilityId: "cash",
          creditCost: 1,
          gainCredits: 4,
        },
      ],
    });
    fundRunnerRunPathPayment(b, 2);
    spendTraceEligibleCredits(b, 4);
    expect(b).toMatchObject({
      credits: 9,
      traceEligibleCredits: 0,
      paymentSupportCreditsGained: 3,
    });
  });
  it("does not spend one general-credit subset twice across consecutive traces", () => {
    const f = capture("start"),
      ice = f.input.playerView.servers.find((s) => s.id === "hq")!.ice;
    const path = assessKnownRezzedIcePath(
      [ice[0]!, ice[0]!],
      [],
      { credits: 13, traceEligibleCredits: 6 },
      [],
      0,
    );
    expect(
      path.visibleIceRunHazards?.map((h) => ({
        capacity: h.runnerTraceCapacity,
        unavoidable: h.unavoidable,
      })),
    ).toEqual([
      { capacity: 6, unavoidable: false },
      { capacity: 0, unavoidable: true },
    ]);
    expect(path.creditBudgetAfterPath).toMatchObject({
      credits: 7,
      traceEligibleCredits: 0,
    });
  });
  it("retains dedicated Engine trace-credit sources", () => {
    const f = capture("start"),
      ice = f.input.playerView.servers.find((s) => s.id === "hq")!.ice;
    const path = assessKnownRezzedIcePath(
      ice,
      [],
      { credits: 9, traceEligibleCredits: 0 },
      [],
      0,
      {
        runnerTraceSupportQuote: {
          traceCreditPool: 6,
          traceCreditSources: [
            {
              sourceCardInstanceId: "trace-source",
              sourceDefinitionId: "trace-source",
              amount: 6,
              isStealth: false,
            },
          ],
          baseLinkOptions: [
            { baseLink: 0, activationCost: 0, safeForAccess: true },
          ],
          postBidLinkOptions: [],
          traceSuccessCancelOptions: [],
        },
      },
    );
    expect(path.visibleIceRunHazards?.[0]).toMatchObject({
      runnerTraceCapacity: 6,
      unavoidable: false,
    });
    expect(path.creditBudgetAfterPath).toMatchObject({
      credits: 9,
      traceEligibleCredits: 0,
    });
  });
  it.each([-1, 14, 1.5, Number.NaN])(
    "fails closed on an invalid explicit general-credit subset %s",
    (eligible) => {
      expect(() =>
        normalizeRunnerRunPathCreditBudget({
          credits: 13,
          traceEligibleCredits: eligible,
        }),
      ).toThrow("invalid_trace_eligible_credit_subset");
    },
  );
});
