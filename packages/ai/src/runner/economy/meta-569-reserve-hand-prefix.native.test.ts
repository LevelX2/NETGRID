import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { RunnerExactFundingRouteRequest } from "../../plans/runner-funding-service-contract";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { runnerExactFundingRouteContract } from "../../runtime/runner-exact-funding-routes";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta569-networking-reserve.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
    engineState: GameState;
    stateHash: string;
  };
}
afterEach(resetResidentPlanPortfolioMemory);

function candidatesFor(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
}

it("uses the actual draw -> Networking -> credit prefix for 11 credits and the same hand floor", () => {
  const saved = fixture();
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  expect(hashState(saved.engineState)).toBe(saved.stateHash);
  let state = structuredClone(saved.engineState);
  for (const [index, type] of [
    "draw_card",
    "play_event",
    "gain_credit",
  ].entries()) {
    const input =
      index === 0
        ? saved.input
        : buildAiDecisionInput(state, "runner", {
            ownDeckSnapshot: saved.input.ownDeckSnapshot!,
            difficulty: "hard",
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (index === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        saved.runtime,
      );
    const before = JSON.stringify(input),
      result = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    const action = input.legalActions.find(
      (entry) => entry.actionId === result.actionId,
    )!;
    expect(action.type).toBe(type);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.economy:runner-portfolio-credit-reserve",
      selectedPlan: { moduleId: "runner.economy" },
      route: { actionId: action.actionId, stateVersion: state.stateVersion },
    });
    if (index === 0) {
      const needs = residentPlanPortfolioSnapshot(input)!
        .instances.filter((entry) => entry.moduleId === "runner.economy")
        .map(
          (entry) =>
            (
              entry.moduleState as {
                need?: {
                  kind: string;
                  targetCredits: number;
                  routeAssessment: { status: string };
                };
              }
            ).need,
        );
      expect(
        needs.some(
          (need) =>
            need?.kind === "parent_plan_support" &&
            need.targetCredits === 15 &&
            need.routeAssessment.status === "uncovered",
        ),
      ).toBe(true);
    }
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(result.selectedChoices
        ? { selectedChoices: result.selectedChoices }
        : {}),
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw Error("Actual Engine rejected reserve prefix");
    state = applied.state;
    expect(
      getPlayerView(state, "runner").own.gripOrHq.length,
    ).toBeGreaterThanOrEqual(3);
  }
  const view = getPlayerView(state, "runner");
  expect([view.own.credits, view.own.clicks, view.own.gripOrHq.length]).toEqual(
    [11, 0, 3],
  );
  const replay = replayEvents(
    saved.engineState,
    state.eventLog.slice(saved.engineState.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  if (!replay.ok) throw Error("Replay rejected");
  expect(hashState(replay.state)).toBe(hashState(state));
});

function request(
  input: AiDecisionInputWithDeckCapabilities,
): RunnerExactFundingRouteRequest {
  return {
    demandId: "runner-portfolio-credit-reserve",
    sourcePlanId: "runner.economy:runner-portfolio-credit-reserve",
    purpose: "phase_reserve",
    priority: "phase_reserve",
    hardness: "soft",
    deadline: "end_of_current_turn",
    targetCredits: 23,
    remainingClicks: input.playerView.own.clicks,
    allowIncrementalProgress: true,
    requiredEndTurnHandBuffer: 3,
    reserveDevelopment: { minimumHandBuffer: 3 },
  };
}
it.each([
  "two_clicks",
  "empty_stack",
  "draw_tax",
  "stale_draw",
  "foreground_parent",
    "near_target",
    "already_funded",
] as const)("does not certify the prefix with %s", (change) => {
  const input = fixture().input,
    demand = request(input);
  const draw = input.legalActions.find(
    (action) => action.type === "draw_card",
  )!;
  if (change === "two_clicks") {
    input.playerView.own.clicks = 2;
    demand.remainingClicks = 2;
  }
  if (change === "empty_stack") input.playerView.own.stackOrRdCount = 0;
  if (change === "draw_tax") draw.costs = [{ clicks: 1, credits: 2 }];
  if (change === "stale_draw") draw.expiresAtStateVersion--;
  if (change === "foreground_parent") demand.purpose = "foreground_plan";
    if (change === "near_target") demand.targetCredits = 5;
    if (change === "already_funded") demand.targetCredits = 4;
  const route = runnerExactFundingRouteContract(
    input,
    candidatesFor(input),
    demand,
  );
  expect(route.routeAssessment.handPreparation).toBeUndefined();
  expect(route.routeActionIds).not.toContain(draw.actionId);
});

it("quotes two real draws when a larger final hand floor is required", () => {
  const input = fixture().input,
    demand = request(input);
  demand.reserveDevelopment = { minimumHandBuffer: 4 };
  const route = runnerExactFundingRouteContract(
    input,
    candidatesFor(input),
    demand,
  );
  expect(route.routeAssessment.handPreparation).toMatchObject({
    drawCount: 2,
    projectedEndCredits: 10,
    projectedEndHand: 4,
    requiredHandBuffer: 4,
  });
});
