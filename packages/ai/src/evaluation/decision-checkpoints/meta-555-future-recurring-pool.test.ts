import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpMatureRemoteAffordableDefenseLayerCertification } from "../../corp/defense/corp-defense-layer-certification";
import { scoringWindowPostRezProtectionAssessment } from "../../runtime/corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  assessEngineCertifiedPostRezIcePath,
} from "../../visible-run-analysis";
import {
  normalizeRunnerRunPathCreditBudget,
  projectBreakerCreditPayment,
  projectGeneralCreditPayment,
} from "../../run-analysis/visible-run-credit-budget";
import type { BreakAssessment } from "../../run-analysis/visible-run-analysis-contracts";
function fixture(decision: 276 | 282) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r2-g5-d" +
          decision +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function source(rig: readonly VisibleCard[]) {
  return rig.find((c) =>
    c.counterDisplays?.some((d) => d.creditPool?.refresh),
  )!;
}
function pool(amount: number, extra: Partial<VisibleCard> = {}): VisibleCard {
  const card = structuredClone(
    source(fixture(276).input.playerView.opponent.rig!),
  );
  card.counterDisplays![0]!.amount = amount;
  return { ...card, ...extra };
}
const future = { creditPoolHorizon: "next_runner_turn" as const };
afterEach(resetResidentPlanPortfolioMemory);
it("rejects the native mature certificate which misses the one-credit start refill", () => {
  const cp = fixture(276),
    input = cp.input;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const c = candidates.find((c) =>
    input.legalActions.some(
      (a) =>
        a.actionId === c.actionId &&
        a.source?.includes("tycho-extension") &&
        a.payload?.serverId === "remote_1",
    ),
  )!;
  expect(c).toBeDefined();
  const before = JSON.stringify([input.playerView, input.legalActions]);
  expect(
    corpMatureRemoteAffordableDefenseLayerCertification(input, c, "remote_1"),
  ).toBeUndefined();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input),
    pf = result.decisionDebug!.planFirstDecision!;
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(pf.route).toMatchObject({
    actionId: result.actionId,
    stateVersion: input.playerView.stateVersion,
  });
  expect(input.legalActions.some((a) => a.actionId === result.actionId)).toBe(
    true,
  );
  expect(JSON.stringify([input.playerView, input.legalActions])).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
});
it("matches the actual next-turn public pool without borrowing it for the current path", () => {
  const current = fixture(276).input.playerView,
    actual = fixture(282).input.playerView;
  const rig = current.opponent.rig!,
    actualRig = actual.own.rig!;
  expect(source(rig).counterDisplays![0]!.amount).toBe(0);
  expect(source(actualRig).counterDisplays![0]!.amount).toBe(1);
  const now = runnerRunPathCreditBudgetWithVisiblePools(3, rig);
  const next = runnerRunPathCreditBudgetWithVisiblePools(3, rig, future);
  expect(now.nonNoisyIcebreakerCredits ?? 0).toBe(0);
  expect(next.nonNoisyIcebreakerCredits).toBe(1);
  expect(next.credits).toBe(3);
  expect(next.traceEligibleCredits).toBe(3);
  expect(next.stealthCreditsBySourceId).toEqual({
    [source(rig).instanceId]: 1,
  });
  const server = current.servers.find((s) => s.id === "remote_1")!;
  const assess = (budget: typeof next) =>
    assessEngineCertifiedPostRezIcePath(
      [...server.ice],
      server.id,
      current.stateVersion,
      new Set(server.ice.map((c) => c.instanceId)),
      [...rig],
      budget,
      [...server.root],
    );
  expect(assess(now).canReachAccess).toBe(false);
  expect(assess(next)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 4,
    creditsAfterPath: 0,
  });
  expect(next).toEqual(runnerRunPathCreditBudgetWithVisiblePools(3, actualRig));
});
it("uses the same future typed pool in scoring-window protection and keeps live pools current", () => {
  const input = fixture(276).input,
    server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  expect(
    scoringWindowPostRezProtectionAssessment(input, server, 3).evidence,
  ).toContain("remote_access:can_reach:true");
  input.playerView.activeSide = "runner";
  // Observed successful access remains an independent conservative exposure signal.
  expect(
    scoringWindowPostRezProtectionAssessment(input, server, 3).evidence,
  ).toContain("remote_access:can_reach:false");
});
it("replaces an exhausted renewable amount and does not add a second full pool", () => {
  const exhausted = runnerRunPathCreditBudgetWithVisiblePools(
    0,
    [pool(0)],
    future,
  );
  const full = runnerRunPathCreditBudgetWithVisiblePools(0, [pool(1)], future);
  expect(exhausted).toEqual(full);
  expect(full.nonNoisyIcebreakerCredits).toBe(1);
  const finite = pool(0);
  delete finite.counterDisplays![0]!.creditPool!.refresh;
  expect(
    runnerRunPathCreditBudgetWithVisiblePools(0, [finite], future)
      .nonNoisyIcebreakerCredits ?? 0,
  ).toBe(0);
  expect(
    runnerRunPathCreditBudgetWithVisiblePools(
      0,
      [pool(0, { known: false })],
      future,
    ).nonNoisyIcebreakerCredits ?? 0,
  ).toBe(0);
});
it("preserves the payment purpose and source ledger after the refill", () => {
  const budget = normalizeRunnerRunPathCreditBudget(
    runnerRunPathCreditBudgetWithVisiblePools(0, [pool(0)], future),
  );
  const breaker: BreakAssessment = {
    cost: 1,
    breakerInstanceId: "rent",
    breakerDefinitionId: "rent",
    breakerSubtypes: ["icebreaker"],
    endingStrength: 2,
    carriesStrengthAcrossIce: false,
  };
  expect(projectBreakerCreditPayment(budget, breaker).affordable).toBe(true);
  expect(
    projectBreakerCreditPayment(budget, {
      ...breaker,
      breakerSubtypes: ["icebreaker", "noisy"],
    }).affordable,
  ).toBe(false);
  expect(projectGeneralCreditPayment(budget, 1).affordable).toBe(false);
  expect(budget.traceEligibleCredits).toBe(0);
});
it("keeps future hosted credits attached to their published breaker host", () => {
  const host = pool(0);
  host.counterDisplays![0]!.creditPool!.uses = ["using_icebreaker_during_run"];
  host.counterDisplays![0]!.creditPool!.requireHostedBreakerForIcebreakerUse = true;
  const breaker = {
    ...pool(0),
    instanceId: "hosted-breaker",
    hostedOn: host.instanceId,
    counterDisplays: [],
  };
  const budget = runnerRunPathCreditBudgetWithVisiblePools(
    0,
    [host, breaker],
    future,
  );
  expect(budget.icebreakerCredits ?? 0).toBe(0);
  expect(budget.hostedIcebreakerCreditsByBreakerInstanceId).toEqual({
    "hosted-breaker": 1,
  });
});
it.each([undefined, -1, 1.5, Number.NaN])(
  "fails closed for an invalid future capacity: %s",
  (capacity) => {
    const card = pool(0);
    if (capacity === undefined)
      delete card.counterDisplays![0]!.creditPool!.capacity;
    else card.counterDisplays![0]!.creditPool!.capacity = capacity;
    expect(() =>
      runnerRunPathCreditBudgetWithVisiblePools(0, [card], future),
    ).toThrow("runner_future_run_credit_pool_invalid_refresh_quote");
  },
);

it("does not buy a public delayed breaker with restricted run credits", () => {
  const input = fixture(276).input;
  const rent = input.playerView.opponent.rig!.find((c) =>
    c.definitionId?.includes("rent-i-con"),
  )!;
  // Purpose-isolation counterfactual: six published restricted credits, no cash.
  const restricted = pool(6);
  restricted.counterDisplays![0]!.creditPool!.capacity = 6;
  const shell: VisibleCard = {
    ...restricted,
    instanceId: "test-shell-source",
    definitionId: "onr_v1_176_the-shell-traders",
    title: "The Shell Traders",
    type: "resource",
    subtypes: [],
    counterDisplays: [],
    counters: {},
  };
  input.playerView.opponent.rig = [restricted, shell];
  input.playerView.opponent.credits = 0;
  input.playerView.opponent.memoryUsed = 1;
  input.playerView.opponent.memoryLimit = 4;
  if (!input.playerView.specialZones)
    throw new Error("Native special zones missing");
  input.playerView.specialZones.setAside = [
    { ...rent, counters: { shell: 2 } },
  ];
  input.playerView.specialZones.setAsideCount = 1;
  const server = input.playerView.servers.find((s) => s.id === "remote_1")!;
  const result = scoringWindowPostRezProtectionAssessment(input, server, 0);
  expect(result.evidence).toContain("public_staged_breaker_used:false");
  expect(result.evidence).toContain("remote_access:can_reach:false");
});
