import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { runnerRunPathCreditBudgetWithVisiblePools } from "./visible-run-credit-budget";
import { visibleIceRunHazardsForQuote } from "./visible-run-hazards";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL("../runtime/test-fixtures/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("pumps the actual Hunter encounter with Cybermodem credits under the original run owner", () => {
  const { cp, input } = fixture("meta592-g11-d168-restricted-hazard");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(input.legalActions.find((a) => a.actionId === d.actionId)?.type).toBe(
    "pump_breaker",
  );
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.convert_run_window",
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});
it.each([
  ["icebreaker", true],
  ["non_noisy", true],
  ["killer_only", false],
  ["foreign_host", false],
  ["empty", false],
] as const)(
  "prices typed %s credits without turning them into trace money",
  (kind, expected) => {
    const { input } = fixture("meta592-g11-d168-restricted-hazard"),
      v = input.playerView,
      ice = v.run!.encounteredIce!,
      rig = v.own.rig!;
    const budget = {
      credits: 0,
      traceEligibleCredits: 0,
      ...(kind === "icebreaker" ? { icebreakerCredits: 4 } : {}),
      ...(kind === "non_noisy" ? { nonNoisyIcebreakerCredits: 4 } : {}),
      ...(kind === "killer_only" ? { killerCredits: 9 } : {}),
      ...(kind === "foreign_host"
        ? { hostedIcebreakerCreditsByBreakerInstanceId: { other: 9 } }
        : {}),
    };
    const before = JSON.stringify(budget),
      h = visibleIceRunHazardsForQuote({
        quote: ice.effectiveRunQuote,
        ice,
        iceIndex: 0,
        rigCards: rig,
        creditBudget: budget,
        visibleCorpBidCapacity: 5,
        breakerStrengths: new Map(),
        additionalBreakCostPerSubroutine: 0,
        ...(v.traceRulesProfile
          ? { traceRulesProfile: v.traceRulesProfile }
          : {}),
      });
    expect(h).toHaveLength(1);
    expect(h[0]!.hazard.unavoidable).toBe(!expected);
    expect(h[0]!.hazard.runnerTraceCapacity).toBe(0);
    expect(JSON.stringify(budget)).toBe(before);
  },
);
it("spends one restricted pool only once across two trace subroutines", () => {
  const { input } = fixture("meta592-g11-d168-restricted-hazard"),
    v = input.playerView,
    original = v.run!.encounteredIce!,
    ice = { ...original, strength: 2 },
    quote = {
      ...original.effectiveRunQuote!,
      effectiveStrength: 2,
      encounterStrength: 2,
      subroutines: [0, 1].map((i) => ({
        ...original.effectiveRunQuote!.subroutines[0]!,
        id: "trace-" + i,
      })),
    };
  const h = visibleIceRunHazardsForQuote({
    quote,
    ice,
    iceIndex: 0,
    rigCards: v.own.rig!,
    creditBudget: { credits: 0, icebreakerCredits: 1 },
    visibleCorpBidCapacity: 5,
    breakerStrengths: new Map(),
    additionalBreakCostPerSubroutine: 0,
    ...(v.traceRulesProfile ? { traceRulesProfile: v.traceRulesProfile } : {}),
  });
  expect(h.map((x) => x.hazard.unavoidable)).toEqual([false, true]);
  expect(h.map((x) => x.hazard.runnerTraceCapacity)).toEqual([0, 0]);
});
it.each([0, 1, 2])(
  "compares the whole fee and break suffix with %i general credits",
  (cash) => {
    const { input } = fixture("meta592-g30-d547-fee-break"),
      v = input.playerView,
      rig = v.own.rig!,
      server = v.servers.find((s) => s.id === "remote_1")!,
      budget = runnerRunPathCreditBudgetWithVisiblePools(cash, rig, {
        liquidCredits: cash,
      }),
      before = JSON.stringify(budget);
    const path = assessKnownRezzedIcePath(
      server.ice,
      rig,
      budget,
      [],
      v.opponent.credits,
    );
    expect(path.canReachAccess).toBe(cash >= 1);
    if (cash === 1) {
      expect(path.visibleBreakCost).toBe(8);
      expect(path.creditBudgetAfterPath?.credits).toBe(0);
      expect(path.runEndTrashSourceIds).toContain(
        "runner_onr_classic_031_rent-i-con_2",
      );
    }
    if (cash === 2) {
      expect(path.visibleBreakCost).toBe(6);
      expect(path.creditBudgetAfterPath?.traceEligibleCredits).toBe(0);
    }
    expect(JSON.stringify(budget)).toBe(before);
  },
);
it("does not admit an unpayable break when the restricted pool is depleted", () => {
  const { input } = fixture("meta592-g30-d547-fee-break"),
    v = input.playerView,
    rig = v.own.rig!,
    ice = v.servers.find((s) => s.id === "remote_1")!.ice;
  expect(
    assessKnownRezzedIcePath(
      ice,
      rig,
      { credits: 1, icebreakerCredits: 2 },
      [],
      v.opponent.credits,
    ).canReachAccess,
  ).toBe(false);
});
it("does not build a lasting recurring engine from the actual end-of-turn-bounce search", () => {
  const { cp, input } = fixture("meta592-g25-d110-temporary-economy");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input),
    d = chooseAiAction(input);
  expect(input.legalActions.some((a) => a.actionId === d.actionId)).toBe(true);
  expect(d.actionId).toBe("runner.gain_credit");
  expect(
    residentPlanPortfolioSnapshot(input)!.instances.some(
      (x) =>
        x.moduleId === "runner.develop_board_and_hand" &&
        JSON.stringify(x.moduleState).includes(
          "search_recurring_breaker_economy",
        ),
    ),
  ).toBe(false);
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("binds the actual last-chance remote funding head to the one-credit break route", () => {
  const { cp, input } = fixture("meta592-g30-d547-fee-break");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const d = chooseAiAction(input);
  expect(d.actionId).toBe("runner.gain_credit");
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.economy",
  );
  const p = residentPlanPortfolioSnapshot(input)!,
    fund = p.instances.find(
      (x) =>
        x.moduleId === "runner.economy" && x.instanceId.includes("run-support"),
    );
  expect((fund!.moduleState as any).need).toMatchObject({
    gap: 1,
    targetCredits: 1,
    parentPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
  });
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
});

it("preserves the real temporary coverage search for the immediately contested remote", () => {
  const { cp, input } = fixture("meta592-g34-d159-temporary-coverage");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const d = chooseAiAction(input),
    a = input.legalActions.find((x) => x.actionId === d.actionId);
  expect(a?.type).toBe("play_event");
  expect(a?.actionId).toContain("onr_v1_110_sneak-preview");
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.rig_and_coverage",
  );
  expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
});
