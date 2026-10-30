import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { runnerRunTargetCanConvertNow } from "../run-analysis/runner-plan-run-funding";
import {
  runnerCentralPressureCadence,
  runnerCentralPressureHasMaterialMarginalValue,
} from "../runner/central-pressure/central-pressure-signals";
import { runnerSameTurnBreakerPreparation } from "../runner/rig-coverage/coverage-same-turn-breaker-preparation";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  const { checkpoint, state, provenance } = JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-central-breaker-preparation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(checkpoint.validation).every((v) => v === true)).toBe(
    true,
  );
  expect(provenance).toMatchObject({
    checkedPrefixStates: 222,
    eachPrefixHashMatches: true,
    checkpointHashMatches: true,
  });
  expect(hashState(state)).toBe(checkpoint.stateHash);
  const input = {
    ...checkpoint.input,
    ...buildAiDecisionInputDto(checkpoint.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime,
  );
  return { input, state: state as GameState };
}
it("installs the held cheaper decoder before the same central run under its exact parent", () => {
  const { input, state } = original();
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("install_card");
  expect(action.source).toContain("codecracker");
  expect(action.payload?.runnerProgramTrashBeforeInstall).not.toBe(true);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
  expect(plan.selectedPlan?.parentInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route?.actionId).toBe(action.actionId);
  expect(plan.route?.stateVersion).toBe(input.playerView.stateVersion);
  const installed = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!installed.ok) throw Error(installed.error.message);
  expect(getPlayerView(installed.state, "runner").own).toMatchObject({
    credits: 13,
    clicks: 1,
    memoryUsed: 4,
  });
  const next = buildAiDecisionInput(installed.state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: input.ownDeckSnapshot!,
    eventTail: installed.state.eventLog,
  });
  const run = chooseAiAction(next);
  expect(run.actionId).toBe("runner.start_run.hq");
  expect(run.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    plan.rootPlanInstanceId,
  );
  const started = applyAction(installed.state, {
    matchId: state.matchId,
    side: "runner",
    actionId: run.actionId!,
    clientKnownStateVersion: installed.state.stateVersion,
  });
  if (!started.ok) throw Error(started.error.message);
  const replay = replayEvents(
    state,
    started.state.eventLog.slice(state.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(started.state));
});

it.each([
  "last_click",
  "full_memory",
  "missing_install",
  "short_cash",
  "no_savings",
  "hand_floor",
  "cadence",
  "no_material",
])("rejects incomplete or unadmitted central preparation: %s", (boundary) => {
  const { input } = original();
  if (boundary === "last_click") input.playerView.own.clicks = 1;
  if (boundary === "full_memory")
    input.playerView.own.memoryUsed = input.playerView.own.memoryLimit!;
  if (boundary === "missing_install")
    input.legalActions = input.legalActions.filter(
      (a) => a.type !== "install_card",
    );
  if (boundary === "short_cash") input.playerView.own.credits = 10;
  if (boundary === "no_savings")
    for (const a of input.legalActions)
      if (a.type === "install_card") a.costs = [{ credits: 10, clicks: 1 }];
  if (boundary === "hand_floor")
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter(
      (c) =>
        c.definitionId?.includes("codecracker") ||
        c.definitionId?.includes("live-news-feed"),
    );
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  const prep = runnerSameTurnBreakerPreparation(
    input,
    buildActionSemanticCandidates({ legalActions: input.legalActions }),
    target,
    input.ownDeckCapabilities!,
    {
      runnerRunTargetCanConvertNow,
      runnerCentralPressureCadence:
        boundary === "cadence"
          ? () => ({ routeAvailable: false, evidenceCode: "consumed" })
          : runnerCentralPressureCadence,
      runnerCentralPressureHasMaterialMarginalValue:
        boundary === "no_material"
          ? () => false
          : runnerCentralPressureHasMaterialMarginalValue,
    },
  );
  expect(prep).toBeUndefined();
});

it("quotes known savings without treating the opaque outer ICE as guaranteed access", () => {
  const { input } = original();
  const hidden = input.playerView.servers
    .find((s) => s.id === "hq")!
    .ice.find((c) => !c.known)!;
  expect(hidden.definitionId).toBeUndefined();
  hidden.instanceId = "another_opaque_ice";
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.hq",
  )!;
  const prep = runnerSameTurnBreakerPreparation(
    input,
    buildActionSemanticCandidates({ legalActions: input.legalActions }),
    target,
    input.ownDeckCapabilities!,
    {
      runnerRunTargetCanConvertNow,
      runnerCentralPressureCadence,
      runnerCentralPressureHasMaterialMarginalValue,
    },
  )!;
  expect(prep.visibleAnswer?.definitionId).toBe("onr_v1_014_codecracker");
  expect(prep.totalRecoveryCost).toBe(6);
  expect(prep.sameTurnRunConversion).toBeUndefined();
  expect(prep.evidenceCodes).toContain(
    "same_turn_breaker_preparation_unknown_ice:1",
  );
});
