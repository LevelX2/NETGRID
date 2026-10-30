import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { runnerRunFundingSupport } from "../run-analysis/runner-plan-run-funding";
import { runnerTerminalRemoteContestVisibleHazardFundingGap } from "../runner/remote-contest/remote-contest-admission";
import {
  visibleRunnerTraceSupport,
  visibleTraceAvoidanceForBaseStrength,
} from "../run-analysis/visible-run-hazards";
import { runnerExactFundingRouteContract } from "./runner-exact-funding-routes";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  return JSON.parse(
    readFileSync(
      new URL("./test-fixtures/meta-570-trace-funding.json", import.meta.url),
      "utf8",
    ),
  );
}
function assess(input: ReturnType<typeof buildAiDecisionInput>) {
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq
        .filter((c) => c.known && c.definitionId)
        .map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  const targets = evaluateRunnerRunTargets({ input });
  const target = targets.find(
    (t) => t.actionId === "runner.start_run.remote_2",
  )!;
  return {
    candidates,
    target,
    funding: runnerRunFundingSupport(
      input,
      buildRunnerEconomyPosture({ input }),
      target,
      targets,
      candidates,
    ),
  };
}
it.each([3, 8, 9])(
  "uses gross cash before the Rivals reward with %i available credits",
  (available) => {
    const quote =
      original().checkpoint.input.playerView.own.runnerTraceSupportQuote;
    const support = visibleRunnerTraceSupport(quote, available, 0, {
      traceRulesProfile: "modern_open",
    });
    const result = visibleTraceAvoidanceForBaseStrength(11, support);
    expect(result.minimumSafeGeneralCreditRequirement).toBe(9);
    expect(result.cheapestSafe?.creditCost).toBe(8);
    expect(result.cheapestAffordableSafe !== undefined).toBe(available >= 9);
  },
);
it("deducts a dedicated trace pool from the monetary requirement exactly once", () => {
  const quote =
    original().checkpoint.input.playerView.own.runnerTraceSupportQuote;
  const support = visibleRunnerTraceSupport(quote, 3, 0, {
    traceRulesProfile: "modern_open",
    traceCreditPool: 3,
  });
  const result = visibleTraceAvoidanceForBaseStrength(11, support);
  expect(result.minimumSafeGeneralCreditRequirement).toBe(6);
  expect(result.cheapestSafe?.creditCost).toBe(5);
  expect(result.cheapestAffordableSafe).toBeUndefined();
});
it("retains the exact avoidance deficit but admits the cheaper complete fixed-tag line", () => {
  const saved = original();
  expect(saved.provenance.checkedStates).toBe(516);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  const input = structuredClone(saved.checkpoint.input);
  const { target, funding } = assess(input);
  expect(target.visibleIceRunHazards?.[0]).toMatchObject({
    runnerTraceCapacity: 5,
    visibleCorpMaxTraceAvoidanceCost: 8,
    visibleCorpMaxTraceFundingGap: 6,
  });
  expect(
    runnerTerminalRemoteContestVisibleHazardFundingGap(input, target),
  ).toBe(6);
  expect(funding).toBeUndefined();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    saved.checkpoint.runtime,
  );
  const unchanged = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(unchanged);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_2",
  );
  expect(decision.actionId).toBe("runner.start_run.remote_2");
});
it("does not certify the old three-credit prefix while a known trace hazard remains", () => {
  const input = original().checkpoint.input;
  const { target, candidates } = assess(input);
  const route = runnerExactFundingRouteContract(input, candidates, {
    demandId: "native-incomplete-trace-prefix",
    sourcePlanId: "plan:runner.contest_remote:remote%3Aremote_2",
    purpose: "current_run",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits: 15,
    remainingClicks: 3,
    allowStrategicExchange: false,
    requireCompleteKnownPath: true,
    paymentWindowTarget: target,
    evidence: ["native_trace_prefix_counter"],
  });
  expect(route.routeActionIds).toEqual([]);
  expect(route.routeAssessment.status).not.toBe("covered_guaranteed");
});
it("does not reconstruct a missing funding quote from trace strength or net cost", () => {
  const input = original().checkpoint.input;
  const { target } = assess(input);
  for (const hazard of target.visibleIceRunHazards ?? [])
    delete hazard.visibleCorpMaxTraceFundingGap;
  expect(
    runnerTerminalRemoteContestVisibleHazardFundingGap(input, target),
  ).toBeUndefined();
});
it.each([
  [12, false],
  [12, true],
  [17, false],
  [17, true],
] as const)(
  "closes the whole native run with %i credits and maximum Corp bid=%s",
  (credits, maximumCorpBid) => {
    const saved = original();
    // Explicit resource-bound countercase, not a second historical original.
    let state = saved.state;
    state.runner.credits = credits;
    state.runner.clicks = credits === 17 ? 2 : 4;
    const initial = state,
      heads: string[] = [];
    let forcedCorpBids = 0;
    const root = "plan:runner.contest_remote:remote%3Aremote_2";
    for (let n = 0; n < 80 && !state.winner; n++) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, {
        difficulty: "hard",
        eventTail: state.eventLog,
        ownDeckSnapshot: saved.deckSnapshots[side],
      });
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      if (n === 0) {
        const { target, funding } = assess(input);
        expect(target.recommendation).toBe(
          credits === 17 ? "run_now" : "gain_credits_first",
        );
        expect(
          runnerTerminalRemoteContestVisibleHazardFundingGap(input, target),
        ).toBe(18 - credits);
        expect(funding).toBeUndefined();
      }
      const unchanged = JSON.stringify(input),
        decision = chooseAiAction(input);
      expect(JSON.stringify(input)).toBe(unchanged);
      expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      expect(action).toBeDefined();
      if (n === 0) {
        heads.push(action.type);
        expect(
          decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
        ).toBe(root);
      }
      const choiceId = input.playerView.pendingChoice?.choiceId;
      if (
        maximumCorpBid &&
        side === "corp" &&
        choiceId?.includes(".corp.bid.")
      ) {
        expect(
          Math.max(
            ...input.playerView.pendingChoice!.options.map((option) =>
              Number(option.value),
            ),
          ),
        ).toBe(6);
        forcedCorpBids++;
      }
      const choices =
        maximumCorpBid && side === "corp" && choiceId?.includes(".corp.bid.")
          ? { choiceId, selectedOptionIds: ["bid_6"] }
          : decision.selectedChoices;
      const applied = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(choices ? { selectedChoices: choices } : {}),
      });
      if (!applied.ok) throw Error(applied.error.message);
      state = applied.state;
    }
    expect(heads).toEqual(["start_run"]);
    expect(state.winner).toBe("runner");
    expect(getPlayerView(state, "runner").own.agendaPoints).toBe(7);
    expect(getPlayerView(state, "runner").own.credits).toBe(
      credits === 17 && !maximumCorpBid ? 6 : credits - 9,
    );
    expect(getPlayerView(state, "runner").own.tags).toBe(
      credits === 17 && !maximumCorpBid ? 0 : 1,
    );
    expect(forcedCorpBids).toBe(maximumCorpBid ? 1 : 0);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    if (!replay.ok) throw Error("Replay failed");
    expect(hashState(replay.state)).toBe(hashState(state));
  },
);
