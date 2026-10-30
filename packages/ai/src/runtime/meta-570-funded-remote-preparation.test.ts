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
import {
  runnerRunFundingSupport,
  runnerRunTargetCanConvertNow,
} from "../run-analysis/runner-plan-run-funding";
import {
  runnerCentralPressureCadence,
  runnerCentralPressureHasMaterialMarginalValue,
} from "../runner/central-pressure/central-pressure-signals";
import { runnerSameTurnBreakerPreparation } from "../runner/rig-coverage/coverage-same-turn-breaker-preparation";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  const saved = JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-funded-remote-preparation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(saved.provenance.checkedPrefixStates).toBe(598);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  const input = {
    ...saved.checkpoint.input,
    ...buildAiDecisionInputDto(saved.checkpoint.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    saved.checkpoint.runtime,
  );
  return {
    input,
    state: saved.state as GameState,
    deckSnapshots: saved.deckSnapshots,
  };
}
const services = {
  runnerRunFundingSupport,
  runnerRunTargetCanConvertNow,
  runnerCentralPressureCadence,
  runnerCentralPressureHasMaterialMarginalValue,
};
function preparation(input: AiDecisionInputWithDeckCapabilities) {
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_2",
  )!;
  return runnerSameTurnBreakerPreparation(
    input,
    buildActionSemanticCandidates({ legalActions: input.legalActions }),
    target,
    input.ownDeckCapabilities!,
    services,
  );
}

it("funds, installs the held decoder and wins the original remote contest in the same turn", () => {
  const { input, state: initial, deckSnapshots } = original();
  let state = initial;
  const heads: string[] = [];
  for (let step = 0; step < 80 && !state.winner; step++) {
    const side = state.activeSide;
    const current =
      step === 0
        ? input
        : buildAiDecisionInput(state, side, {
            difficulty: "hard",
            eventTail: state.eventLog,
            ownDeckSnapshot: deckSnapshots[side],
          });
    current.planningStateIdentity = buildPlanningStateIdentity(current);
    const before = JSON.stringify(current);
    const decision = chooseAiAction(current);
    expect(JSON.stringify(current)).toBe(before);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const action = current.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    if (step < 4) {
      heads.push(action.type);
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("plan:runner.contest_remote:remote%3Aremote_2");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe(step < 3 ? "runner.rig_and_coverage" : "runner.contest_remote");
    }
    const applied = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!applied.ok) throw Error(applied.error.message);
    state = applied.state;
  }
  expect(heads).toEqual([
    "gain_credit",
    "gain_credit",
    "install_card",
    "start_run",
  ]);
  expect(state.winner).toBe("runner");
  expect(getPlayerView(state, "runner").own).toMatchObject({
    agendaPoints: 8,
    credits: 6,
  });
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});

it.each([
  "short_turn",
  "short_cash",
  "full_memory",
  "missing_install",
  "hand_buffer",
])("does not admit an incomplete preparation: %s", (boundary) => {
  const { input } = original();
  if (boundary === "short_turn") input.playerView.own.clicks = 3;
  if (boundary === "short_cash") input.playerView.own.credits = 20;
  if (boundary === "full_memory")
    input.playerView.own.memoryUsed = input.playerView.own.memoryLimit!;
  if (boundary === "missing_install")
    input.legalActions = input.legalActions.filter(
      (a) => a.type !== "install_card",
    );
  if (boundary === "hand_buffer")
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter((c) =>
      c.definitionId?.includes("codecracker"),
    );
  expect(preparation(input)).toBeUndefined();
});

it("retains unknown-route risk and quotes the existing complete funding route", () => {
  const { input } = original();
  const hidden = input.playerView.servers
    .find((s) => s.id === "remote_2")!
    .ice.find((c) => !c.known)!;
  expect(hidden.definitionId).toBeUndefined();
  hidden.instanceId = "another_opaque_inner_ice";
  const result = preparation(input)!;
  expect(result.sameTurnRunConversion).toMatchObject({
    requiredCredits: 23,
    requiredClicksAfterFunding: 2,
    projectedKnownPathCost: 15,
    postRunCreditFloor: 7,
  });
  expect(result.evidenceCodes).toContain(
    "same_turn_breaker_preparation_unknown_ice:1",
  );
});
