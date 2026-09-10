import { applyAction, hashGameState } from "@netgrid/engine";
import type { AiDecision, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-mrgsg-01.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("MRGSG recurring draw-tax removal and reserve recovery", () => {
  it("keeps the run owner through trashing and opens a finite refill need afterwards", () => {
    const checkpoint = bindHistoricalRunEventCadence(
      structuredClone(cp01Json) as AiDecisionCheckpointV1,
      ["CP-MRGSG-01"],
    );
    let state = checkpoint.engine.testOnlyGameState;
    state.runner.credits = 10;
    state.runner.clicks = 3;
    // Isolate access and recovery from the opponent's optional ICE rez.
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    )!;
    for (const cardId of remote.ice.splice(0)) {
      state.corp.rd.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
    }
    checkpoint.engine.stateHash = hashGameState(state);
    state.eventLog = checkpoint.engine.eventPrefix.map((event) => ({
      ...event,
    }));
    checkpoint.expectation = {
      acceptableActions: [{ actionId: "runner.start_run.remote_1" }],
      planExecution: {
        acceptablePlanKinds: ["runner.contest_remote"],
        acceptableCapabilities: ["contest_remote"],
      },
    };
    const start = runAiDecisionCheckpoint(checkpoint);
    expect(start.ok, start.message).toBe(true);
    const rootId =
      start.decision!.decisionDebug!.planFirstDecision!.selectedPlan!
        .instanceId;
    state = applyDecision(state, start.decision!);
    for (const expectedType of [
      "access_card",
      "trash_accessed_card",
    ] as const) {
      const input = nextInput(state, checkpoint);
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (entry) => entry.actionId === decision.actionId,
      )!;
      expect(action.type).toBe(expectedType);
      expect(action.expiresAtStateVersion).toBe(state.stateVersion);
      expect(decision.fallbackUsed).toBe(false);
      const planFirst = decision.decisionDebug!.planFirstDecision!;
      expect(planFirst.selectedPlan).toMatchObject({
        moduleId: "runner.convert_run_window",
        parentInstanceId: rootId,
      });
      expect(planFirst.selectedStep).toMatchObject({
        planInstanceId: planFirst.selectedPlan!.instanceId,
        stepId: `${planFirst.selectedPlan!.instanceId}:convert`,
        parentInstanceId: rootId,
      });
      const portfolio = residentPlanPortfolioSnapshot(input)!;
      expect(portfolio.executorInstanceId).toBe(
        planFirst.selectedPlan!.instanceId,
      );
      expect(portfolio.turnPlanExecutionLease?.currentBinding.actionId).toBe(
        action.actionId,
      );
      const cursor = portfolio.turnPlanCommitment!.cursor;
      const node =
        portfolio.turnPlanCommitment!.phases[cursor.phaseIndex]!.nodes[
          cursor.nodeIndex
        ]!;
      expect(portfolio.turnPlanExecutionLease?.routeKey).toBe(
        node.invocation.routeKey,
      );
      state = applyDecision(state, decision);
    }
    expect(state.runner.credits).toBe(8);
    expect(state.runner.clicks).toBe(2);
    expect(
      state.corp.servers.find((server) => server.id === "remote_1")?.root ?? [],
    ).toEqual([]);
    expect(state.corp.archives).toContain(
      "corp_onr_v1_313_city-surveillance_1",
    );
    const recoveryInput = nextInput(state, checkpoint);
    const recoveryDecision = chooseAiAction(recoveryInput);
    expect(
      recoveryInput.legalActions.some(
        (action) => action.actionId === recoveryDecision.actionId,
      ),
    ).toBe(true);
    // A stronger run may take the foreground; the finite reserve remains
    // available instead of being lowered to the spent balance.
    const reserve = residentPlanPortfolioSnapshot(
      recoveryInput,
    )?.instances.find(
      (instance) => instance.dedupeKey === "runner-portfolio-credit-reserve",
    );
    expect(reserve).toMatchObject({
      moduleId: "runner.economy",
      viability: "ready",
      moduleState: {
        kind: "economy",
        need: {
          kind: "portfolio_reserve",
          targetCredits: 10,
          currentCreditsAtRevalidation: 8,
          gap: 2,
          routeActionIds: ["runner.gain_credit"],
        },
      },
    });
    expect(
      recoveryInput.legalActions.some(
        (action) => action.actionId === "runner.gain_credit",
      ),
    ).toBe(true);
  });
});

function nextInput(state: GameState, checkpoint: AiDecisionCheckpointV1) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: checkpoint.difficulty,
    profileId: checkpoint.profileId,
    decisionId: `${checkpoint.source.decisionScopeId ?? state.matchId}:${state.stateVersion}:runner`,
    actionNumber: state.stateVersion,
    ownDeckSnapshot: checkpoint.deckSnapshot,
    eventTail: state.eventLog,
  });
}
function applyDecision(state: GameState, decision: AiDecision): GameState {
  if (!decision.actionId)
    throw new Error("Checkpoint decision has no action ID.");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `mrgsg-trash-recovery:${state.stateVersion}`,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
