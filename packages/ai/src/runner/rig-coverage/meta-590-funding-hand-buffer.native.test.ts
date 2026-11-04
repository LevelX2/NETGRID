import { readFileSync } from "node:fs";
import { applyAction, hashState } from "@netgrid/engine";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { runnerExactFundingRouteContract } from "../../runtime/runner-exact-funding-routes";
import { runnerCoverageFundingActionIds } from "./coverage-support";
import type { RunnerCoverageServices } from "./coverage-services";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-coverage-funding-hand-buffer.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

afterEach(resetResidentPlanPortfolioMemory);

it("resolves the actual failed attempt through Coverage search and retains the separate draw-before-income reserve", () => {
  const cp = fixture();
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  expect(hashState(cp.engineState)).toBe(cp.stateHash);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const before = JSON.stringify(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const action = input.legalActions.find(
    (a: { actionId: string }) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("activated_card_ability");
  expect(action.actionId).toContain("the-short-circuit");
  const root = "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate";
  const debug = decision.decisionDebug!.planFirstDecision!;
  expect(debug).toMatchObject({
    rootPlanInstanceId: root,
    selectedPlan: {
      moduleId: "runner.rig_and_coverage",
      phase: "search_answer",
    },
    selectedStep: { stepId: `${root}:find:breaker_code_gate` },
    route: { actionId: action.actionId, stateVersion: 67 },
    turnPlanning: {
      coverage: { status: "pass", coveragePercent: 100, missingActionCount: 0 },
    },
  });
  const score = input.legalActions.find(
    (a: { type: string }) => a.type === "play_event",
  )!;
  expect(debug.dispositions).toContainEqual(
    expect.objectContaining({
      actionId: score.actionId,
      ownerModuleId: "runner.economy",
      disposition: "explicitly_nonproductive",
    }),
  );
  const reserve = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) =>
      p.instanceId === "plan:runner.economy:runner-portfolio-credit-reserve",
  )!;
  expect(reserve.moduleState).toMatchObject({
    need: {
      routeActionIds: ["runner.draw_card"],
      routeAssessment: {
        handPreparation: {
          drawCount: 1,
          requiredHandBuffer: 3,
          projectedEndHand: 3,
          projectedEndCredits: 11,
        },
      },
    },
  });
  expect(JSON.stringify(input)).toBe(before);
  const applied = applyAction(cp.engineState, {
    matchId: cp.engineState.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: 67,
  });
  expect(applied.ok).toBe(true);
  if (!applied.ok) throw Error("Native search action rejected");
  expect(applied.state.stateVersion).toBe(68);
});

it.each([false, true])(
  "admits hand-consuming funding only after a real preparatory draw: %s",
  (drawFirst) => {
    const cp = fixture();
    let state = cp.engineState;
    if (drawFirst) {
      const draw = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: "runner.draw_card",
        clientKnownStateVersion: state.stateVersion,
      });
      expect(draw.ok).toBe(true);
      if (!draw.ok) throw Error("Native draw rejected");
      state = draw.state;
    }
    const input = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: cp.input.ownDeckSnapshot,
      difficulty: "hard",
    });
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const score = input.legalActions.find(
      (a) => a.type === "play_event" && a.actionId.includes("108_score"),
    )!;
    expect(score).toBeDefined();
    const services = {
      runnerExactFundingRouteContract,
    } as RunnerCoverageServices;
    const routes = runnerCoverageFundingActionIds(
      input,
      candidates,
      "coverage:breaker_code_gate",
      10,
      5,
      true,
      1,
      services,
      3,
    );
    expect(routes.includes(score.actionId)).toBe(drawFirst);
    // The explicit caller contract remains optional for server-bound parents.
    const parentRoutes = runnerCoverageFundingActionIds(
      input,
      candidates,
      "bound-run-test",
      10,
      5,
      true,
      1,
      services,
    );
    expect(parentRoutes).toContain(score.actionId);
  },
);
