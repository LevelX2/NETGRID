import { describe, expect, it } from "vitest";
import { applyAction } from "@netgrid/engine";
import type { AiDecision, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { encounterRunRemainderEffectAssessment } from "../../runtime/runner-run-remainder-effect-assessment";
import { currentEncounterUnbrokenSubroutineIndexes } from "../../runtime/current-encounter";

import harmfulNonEtrBreakJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-5285-140-harmful-non-etr-break.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 5285 runner harmful non-ETR break decision checkpoint", () => {
  it("keeps terminal remote contest ownership with a payable full-break continuation", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(harmfulNonEtrBreakJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedStep: {
        planInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      },
    });
  });

  it("executes the quoted ten-credit route and preserves the hand and run owner through access", () => {
    const checkpoint = structuredClone(
      harmfulNonEtrBreakJson,
    ) as AiDecisionCheckpointV1;
    const start = runAiDecisionCheckpoint(checkpoint);
    expect(start.ok, start.message).toBe(true);
    let state = checkpoint.engine.testOnlyGameState;
    state.eventLog = structuredClone(checkpoint.engine.eventPrefix);
    const rootId =
      start.decision!.decisionDebug!.planFirstDecision!.selectedPlan!
        .instanceId;
    const originalGrip = [...state.runner.grip];
    state = applyDecision(state, start.decision!);
    const breaks: Array<{ iceId: unknown; index: unknown }> = [];
    let creditsSpent = 0;
    let reachedAccess = false;
    for (let index = 0; index < 20; index += 1) {
      const input = nextInput(state, checkpoint);
      if (breaks.length === 1) {
        expect([...currentEncounterUnbrokenSubroutineIndexes(input)]).toEqual([
          1,
        ]);
        const incomplete = structuredClone(input);
        for (const action of incomplete.legalActions) {
          if (action.payload?.encounterContinue === true)
            delete action.payload.encounterSubroutineIds;
        }
        expect(() =>
          currentEncounterUnbrokenSubroutineIndexes(incomplete),
        ).toThrow("missing_action_semantics");
      }
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      )!;
      expect(action).toBeDefined();
      expect(action.expiresAtStateVersion).toBe(state.stateVersion);
      expect(decision.fallbackUsed).toBe(false);
      if (input.legalActions.length > 1) {
        const selected = decision.decisionDebug!.planFirstDecision!;
        expect(selected.selectedPlan).toMatchObject({
          moduleId: "runner.convert_run_window",
          parentInstanceId: rootId,
        });
        expect(selected.selectedStep).toMatchObject({
          planInstanceId: selected.selectedPlan!.instanceId,
          parentInstanceId: rootId,
        });
        const portfolio = residentPlanPortfolioSnapshot(input)!;
        expect(portfolio.executorInstanceId).toBe(
          selected.selectedPlan!.instanceId,
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
      }
      if (action.type === "access_card") {
        reachedAccess = true;
        break;
      }
      creditsSpent += action.costs.reduce(
        (sum, cost) => sum + (cost.credits ?? 0),
        0,
      );
      if (action.type === "break_subroutine")
        breaks.push({
          iceId: action.payload?.iceId,
          index: action.payload?.subroutineIndex,
        });
      state = applyDecision(state, decision);
      expect(state.runner.grip).toEqual(originalGrip);
      expect(state.winner).toBeNull();
    }
    expect(reachedAccess).toBe(true);
    expect(creditsSpent).toBe(10);
    expect(state.runner.credits).toBe(14);
    expect(breaks).toEqual([
      { iceId: "corp_onr_v1_234_data-darts_1", index: 0 },
      { iceId: "corp_onr_v1_234_data-darts_1", index: 1 },
    ]);
  });

  it.each([
    "known",
    "unknown",
    "missing_quote",
    "unaffordable",
    "source_cheaper",
    "breaking_prohibited",
  ])("revalidates the complete live continuation: %s", (kind) => {
    const checkpoint = structuredClone(
      harmfulNonEtrBreakJson,
    ) as AiDecisionCheckpointV1;
    const start = runAiDecisionCheckpoint(checkpoint);
    const state = applyDecision(
      checkpoint.engine.testOnlyGameState,
      start.decision!,
    );
    const input = nextInput(state, checkpoint);
    const next = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.ice[0]!;
    if (kind === "unknown") {
      next.known = false;
      next.rezzed = false;
      delete next.definitionId;
      delete next.effectiveRunQuote;
    }
    if (kind === "missing_quote") delete next.effectiveRunQuote;
    if (kind === "unaffordable") {
      input.playerView.own.credits = 0;
      input.playerView.own.rig = [];
    }
    if (kind === "source_cheaper")
      next.effectiveRunQuote!.subroutines.push(
        ...Array.from({ length: 20 }, (_, index) => ({
          id: `harmless-${index}`,
          type: "corp_gain_credit" as const,
          amount: 1,
        })),
      );
    if (kind === "breaking_prohibited")
      input.playerView.run!.nextEncounterNoBreakSubroutines = true;
    if (kind === "missing_quote") {
      expect(() => encounterRunRemainderEffectAssessment(input)).toThrow(
        "missing its authoritative effective run quote",
      );
      return;
    }
    const assessment = encounterRunRemainderEffectAssessment(input);
    expect(assessment.deferredFullBreakSubroutineIndexes).toEqual(
      kind === "known" ? [0] : [],
    );
    if (kind === "known") expect(assessment.mustBreak).toBe(false);
    if (kind === "source_cheaper") expect(assessment.mustBreak).toBe(true);
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
    idempotencyKey: `checkpoint-5285:${state.stateVersion}`,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
