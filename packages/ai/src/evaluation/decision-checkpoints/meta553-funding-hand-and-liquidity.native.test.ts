import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  CURRENT_RULES_BASELINE,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import type { GameState, PlayerAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { runnerExactFundingRouteContract } from "../../runtime/runner-exact-funding-routes";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
type RecordedAction = {
  side: "runner" | "corp";
  actionId: string;
  selectedChoices?: PlayerAction["selectedChoices"];
};
type Native = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
  stateHash: string;
};
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta553-funding-hand-and-finite-liquidity.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    states: Record<string, Native>;
    game4: {
      matchId: string;
      seed: string;
      runnerDeckSnapshot: DeckSnapshot;
      corpDeckSnapshot: DeckSnapshot;
      prefixActions: RecordedAction[];
      originalContinuation: RecordedAction[];
    };
  };
}
function capture(key: string) {
  const f = fixture().states[key]!;
  expect(Object.keys(f.validation)).toHaveLength(9);
  expect(Object.values(f.validation).every(Boolean)).toBe(true);
  return { ...f, input: { ...f.input, ...buildAiDecisionInputDto(f.input) } };
}
function fingerprint(input: AiDecisionInputWithDeckCapabilities) {
  return createHash("sha256")
    .update(
      JSON.stringify([input.playerView, input.legalActions, input.eventTail]),
    )
    .digest("hex");
}
function decide(f: ReturnType<typeof capture>) {
  restoreAiRuntimeCheckpoint(
    f.input,
    f.input.ownDeckSnapshot!.deckSnapshotId,
    f.runtime,
  );
  const before = fingerprint(f.input),
    decision = chooseAiAction(f.input),
    action = f.input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(f.input.playerView.stateVersion);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: f.input.playerView.stateVersion,
    planInstanceId: plan.leafExecutorInstanceId,
  });
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(fingerprint(f.input)).toBe(before);
  return { decision, action, plan };
}
function candidates(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
}
function advance(state: GameState, action: RecordedAction) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "meta553:" + state.stateVersion,
    ...(action.selectedChoices
      ? { selectedChoices: action.selectedChoices }
      : {}),
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
describe("native equivalent funding and independent finite liquidity", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it("uses the equal-credit draw event inside the same exact RD funding parent", () => {
    const f = capture("cruising"),
      { action, plan } = decide(f);
    expect(action.type).toBe("play_event");
    expect(action.actionId).toContain("cruising-for-netwatch");
    expect(plan.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ard",
    );
    expect(plan.leafExecutorInstanceId).toBe(
      "plan:runner.economy:run-support%3Acentral%3Ard",
    );
  });
  it.each(["wait33", "wait33late", "wait34"])(
    "retains independently positive liquidity instead of circular deck-race waiting: %s",
    (key) => {
      const { action, plan } = decide(capture(key));
      expect(action.type).toBe("gain_credit");
      expect(plan.selectedPlan?.moduleId).toBe("runner.economy");
      expect(plan.leafExecutorInstanceId).toContain(
        "economy-liquidity-development",
      );
    },
  );
  it("keeps an immediately secured public empty-RD terminal wait ahead of P6 liquidity", () => {
    const f = capture("secureWin");
    expect(f.input.playerView.opponent.deckCount).toBe(0);
    const { action, plan } = decide(f);
    expect(action.type).toBe("end_turn");
    expect(plan.selectedPlan?.moduleId).toBe("runner.secure_terminal_win");
  });
  it("keeps Basic Credit available in a two-step route and rejects the one-click short route", () => {
    const f = capture("cruising"),
      cs = candidates(f.input),
      request = {
        demandId: "native:two-credit-run-gap",
        sourcePlanId: "plan:runner.pressure_central:central%3Ard",
        purpose: "current_run" as const,
        priority: "current_foreground_plan" as const,
        hardness: "hard" as const,
        deadline: "end_of_current_turn" as const,
        targetCredits: 4,
        remainingClicks: 2,
        requiredEndTurnHandBuffer: 3,
        paymentWindowTarget: evaluateRunnerRunTargets({ input: f.input }).find(
          (t) => t.actionId === "runner.start_run.rd",
        )!,
      };
    const positive = runnerExactFundingRouteContract(f.input, cs, request);
    expect(positive.routeAssessment.status).toBe("covered_guaranteed");
    expect(positive.routeAssessment.totalClickCost).toBe(2);
    expect(positive.routeActionIds[0]).toContain("cruising-for-netwatch");
    const negative = runnerExactFundingRouteContract(f.input, cs, {
      ...request,
      remainingClicks: 1,
    });
    expect(negative.routeActionIds).toEqual([]);
    expect(negative.routeAssessment.status).toBe("uncovered");
  });
  it("uses the exact native engine prefix and survives the same subsequently revealed Net4", () => {
    const f = fixture(),
      g = f.game4,
      n = capture("cruising"),
      controllers = {
        runner: {
          controllerId: "runner-ai",
          side: "runner" as const,
          type: "ai" as const,
          displayName: "Runner KI",
          difficulty: "hard" as const,
          profileId: "runner-ai-v0.9-hard",
        },
        corp: {
          controllerId: "corp-ai",
          side: "corp" as const,
          type: "ai" as const,
          displayName: "Korp KI",
          difficulty: "hard" as const,
          profileId: "corp-ai-v0.9-hard",
        },
      };
    let state = createGame({
      matchId: g.matchId,
      seed: g.seed,
      baseline: CURRENT_RULES_BASELINE,
      agendaPointsToWin: 7,
      traceRulesProfile: "modern_open",
      controllers,
      runnerDeck: buildEngineDeck(g.runnerDeckSnapshot),
      corpDeck: buildEngineDeck(g.corpDeckSnapshot),
      runnerDeckMetadata: g.runnerDeckSnapshot.publicMetadata!,
      corpDeckMetadata: g.corpDeckSnapshot.publicMetadata!,
    });
    for (const a of g.prefixActions) state = advance(state, a);
    expect(hashState(state)).toBe(n.stateHash);
    const original = structuredClone(state),
      { action } = decide(n);
    state = advance(state, { side: "runner", actionId: action.actionId });
    expect(state.runner.credits).toBe(3);
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.grip).toHaveLength(4);
    for (const a of g.originalContinuation) state = advance(state, a);
    expect(state.winner).toBeNull();
    expect(state.runner.grip).toHaveLength(0);
    const replay = replayEvents(
      original,
      state.eventLog.slice(original.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    if (replay.ok) expect(hashState(replay.state)).toBe(hashState(state));
  });
});
