import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createGame,
  applyAction,
  getLegalActions,
  hashState,
  replayEvents,
  CURRENT_RULES_BASELINE,
} from "@netgrid/engine";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import type { GameState, PlayerAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
type RecordedAction = {
  side: "runner" | "corp";
  actionId: string;
  selectedChoices?: PlayerAction["selectedChoices"];
};
type Native = {
  input: AiDecisionInputWithDeckCapabilities & { ownDeckSnapshot: DeckSnapshot };
  runtime: AiRuntimeCheckpointV1;
  stateHash: string;
  validation: Record<string, boolean>;
};
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta553-pre-rez-information.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    corpDeckSnapshot: DeckSnapshot;
    states: Record<
      string,
      {
        native: Native;
        matchId: string;
        seed: string;
        prefixActions: RecordedAction[];
      }
    >;
  };
}
function advance(state: GameState, a: RecordedAction) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side: a.side,
    actionId: a.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "meta553-information:" + state.stateVersion,
    ...(a.selectedChoices ? { selectedChoices: a.selectedChoices } : {}),
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function original(key: string) {
  const f = fixture(),
    p = f.states[key]!,
    runner = p.native.input.ownDeckSnapshot!,
    corp = f.corpDeckSnapshot;
  expect(Object.keys(p.native.validation)).toHaveLength(9);
  expect(Object.values(p.native.validation).every(Boolean)).toBe(true);
  const controllers = {
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
    matchId: p.matchId,
    seed: p.seed,
    baseline: CURRENT_RULES_BASELINE,
    agendaPointsToWin: 7,
    traceRulesProfile: "modern_open",
    controllers,
    runnerDeck: buildEngineDeck(runner),
    corpDeck: buildEngineDeck(corp),
    runnerDeckMetadata: runner.publicMetadata!,
    corpDeckMetadata: corp.publicMetadata!,
  });
  for (const a of p.prefixActions) state = advance(state, a);
  expect(hashState(state)).toBe(p.native.stateHash);
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: runner,
    difficulty: "hard",
  });
  restoreAiRuntimeCheckpoint(input, runner.deckSnapshotId, p.native.runtime);
  return { state, input, p };
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
function normal(input: AiDecisionInputWithDeckCapabilities) {
  const before = JSON.stringify([
      input.playerView,
      input.legalActions,
      input.eventTail,
    ]),
    d = chooseAiAction(input),
    a = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).toBe(false);
  expect(a).toBeDefined();
  const p = d.decisionDebug!.planFirstDecision!;
  expect(p.route).toMatchObject({
    actionId: a.actionId,
    stateVersion: input.playerView.stateVersion,
    planInstanceId: p.leafExecutorInstanceId,
  });
  expect(p.selectedStep?.planInstanceId).toBe(p.leafExecutorInstanceId);
  expect(
    JSON.stringify([input.playerView, input.legalActions, input.eventTail]),
  ).toBe(before);
  return { a, p };
}
describe("native pre-rez approach information", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each([
    ["g10", "hq"],
    ["g21", "hq"],
    ["g15", "rd"],
  ])(
    "retains the Engine fact and selects the actual information route within its existing parent: %s",
    (key, server) => {
      const { state, input, p } = original(key!);
      const engine = getLegalActions(state, "runner").find(
        (a) =>
          a.actionId.includes("decoy-signal") && a.payload?.serverId === server,
      )!;
      expect(engine.payload?.eventApproachIceExposeBeforeRez).toBe(true);
      expect(
        p.native.input.legalActions.find((a) => a.actionId === engine.actionId)
          ?.payload?.eventApproachIceExposeBeforeRez,
      ).toBeUndefined();
      const dto = buildAiDecisionInputDto(input);
      expect(
        dto.legalActions.find((a) => a.actionId === engine.actionId)?.payload
          ?.eventApproachIceExposeBeforeRez,
      ).toBe(true);
      const { a, p: plan } = normal(input);
      expect(a.actionId).toBe(engine.actionId);
      expect(plan.rootPlanInstanceId).toBe(
        "plan:runner.pressure_central:central%3A" + server,
      );
      expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
      expect(
        advance(state, { side: "runner", actionId: a.actionId }).stateVersion,
      ).toBe(state.stateVersion + 1);
    },
  );
  it("rejects information value on known ICE and an empty fort", () => {
    const { input } = original("g15"),
      cs = candidates(input),
      ts = evaluateRunnerRunTargets({ input, actionCandidates: cs });
    for (const server of ["archives", "remote_1"]) {
      const c = cs.find(
        (c) =>
          c.sourceDefinitionId === "onr_proteus_104_decoy-signal" &&
          input.legalActions.find((a) => a.actionId === c.actionId)?.payload
            ?.serverId === server,
      )!;
      expect(c).toBeDefined();
      expect(
        runnerCardRunHasVisibleDifferentialPayoff(input, c, server, ts),
      ).toBe(false);
    }
    const rd = cs.find(
      (c) =>
        c.sourceDefinitionId === "onr_proteus_104_decoy-signal" &&
        input.legalActions.find((a) => a.actionId === c.actionId)?.payload
          ?.serverId === "rd",
    )!;
    expect(runnerCardRunHasVisibleDifferentialPayoff(input, rd, "rd", ts)).toBe(
      true,
    );
    expect(runnerCardRunHasVisibleDifferentialPayoff(input, rd, "rd", [])).toBe(
      false,
    );
  });
  it("keeps the directly reachable unprotected remote ahead of optional central information", () => {
    const { input } = original("hold"),
      { a, p } = normal(input);
    expect(a.actionId).toBe("runner.start_run.remote_1");
    expect(p.selectedPlan?.moduleId).toBe("runner.contest_remote");
  });
  it("continues through the actual expose owner before any Corp rez decision", () => {
    let { state, input } = original("g15");
    const originalState = structuredClone(state),
      { a } = normal(input);
    expect(a.actionId).toContain("decoy-signal");
    state = advance(state, { side: "runner", actionId: a.actionId });
    const next = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: input.ownDeckSnapshot!,
      difficulty: "hard",
    });
    expect(
      next.legalActions.some(
        (a) => a.payload?.approachIceExposeDecision === "expose",
      ),
    ).toBe(true);
    const exposed = normal(next);
    expect(exposed.a.payload?.approachIceExposeDecision).toBe("expose");
    state = advance(state, { side: "runner", actionId: exposed.a.actionId });
    const view = buildAiDecisionInput(state, "runner", {
      ownDeckSnapshot: input.ownDeckSnapshot!,
      difficulty: "hard",
    });
    expect(
      view.legalActions.some(
        (a) => a.payload?.approachIceExposeViewDecision === "finish",
      ),
    ).toBe(true);
    const checkpoint = exportAiRuntimeCheckpoint(
      next,
      input.ownDeckSnapshot!.deckSnapshotId,
    );
    for (const invalidate of [
      "missing_event_source",
      "missing_event_run_flag",
    ]) {
      const bad = structuredClone(view);
      if (invalidate === "missing_event_source")
        bad.playerView.own.heapOrArchives =
          bad.playerView.own.heapOrArchives.filter(
            (c) => c.instanceId !== a.payload?.cardId,
          );
      else delete bad.playerView.run!.eventApproachIceExposeBeforeRez;
      restoreAiRuntimeCheckpoint(
        bad,
        input.ownDeckSnapshot!.deckSnapshotId,
        checkpoint,
      );
      let rejected = false;
      try {
        chooseAiAction(bad);
      } catch (error) {
        if (!(error instanceof PlanResolutionFailure)) throw error;
        expect(error.code).toBe("window_origin_missing");
        expect(error.context.owner).toBe("continuation");
        rejected = true;
      }
      expect(rejected).toBe(true);
    }
    restoreAiRuntimeCheckpoint(
      view,
      input.ownDeckSnapshot!.deckSnapshotId,
      checkpoint,
    );
    const continuation = normal(view);
    expect(continuation.p.rootPlanInstanceId).toBe(
      "plan:runner.pressure_central:central%3Ard",
    );
    expect(continuation.a.payload?.cardId).toBe(a.payload?.cardId);
    expect(
      continuation.a.payload?.approachIceExposeViewDecision === "finish" ||
        continuation.a.payload?.approachIceExposeJackOut === true,
    ).toBe(true);
    state = advance(state, {
      side: "runner",
      actionId: continuation.a.actionId,
    });
    const replay = replayEvents(
      originalState,
      state.eventLog.slice(originalState.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    if (replay.ok) expect(hashState(replay.state)).toBe(hashState(state));
  });
});
