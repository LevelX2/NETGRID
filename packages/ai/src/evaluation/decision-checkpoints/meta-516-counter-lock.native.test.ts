import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildCorpIceCardFacts } from "../../runtime/corp-ice-placement/corp-ice-placement";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function native(key: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-516-counter-lock/${key}-native.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const state = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-516-counter-lock/${key}-engine-state.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as GameState;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(hashGameState(state)).toBe(cp.stateHash);
  const input = buildAiDecisionInput(state, cp.input.side, {
    difficulty: cp.input.difficulty,
    profileId: cp.input.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:${cp.input.side}`,
    actionNumber: state.stateVersion + 1,
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, state, input };
}
afterEach(resetResidentPlanPortfolioMemory);

it("corrects the native Raven fact while preserving the bound defense owner and legal Engine installation", () => {
  const { state, input } = native("g2d21");
  const raven = input.playerView.own.gripOrHq.find(
    (c) => c.definitionId === "onr_v1_236_data-raven",
  )!;
  expect(buildCorpIceCardFacts(raven)).toMatchObject({
    damage: false,
    persistentDamageCounter: false,
    tagTrace: true,
    runLock: false,
  });
  const d = chooseAiAction(input),
    pf = d.decisionDebug!.planFirstDecision!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(
    input.legalActions.some(
      (a) =>
        a.actionId === d.actionId &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    ),
  ).toBe(true);
  expect(pf.route).toMatchObject({
    actionId: d.actionId,
    stateVersion: state.stateVersion,
    stepId: pf.selectedStep!.stepId,
    planInstanceId: pf.leafExecutorInstanceId,
  });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: d.actionId!,
    clientKnownStateVersion: state.stateVersion,
    ...(d.selectedChoices ? { selectedChoices: d.selectedChoices } : {}),
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.error));
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
});

it("keeps the exact native Jack continuation and the genuine run-duration lock", () => {
  const { state, input } = native("g26d68"),
    d = chooseAiAction(input);
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  expect(d.actionId).toBe(
    "runner.continue_run.printed_subroutines_run_duration_cannot_jack_out,printed_subroutines_trace",
  );
  expect(d.decisionDebug!.planFirstDecision!.selectedStep?.planInstanceId).toBe(
    "rules.window_resolution",
  );
  expect(
    input.legalActions.some(
      (a) =>
        a.actionId === d.actionId &&
        a.expiresAtStateVersion === state.stateVersion,
    ),
  ).toBe(true);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: d.actionId!,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.error));
  expect(result.state.run?.jackOutLockedForRun).toBe(true);
  expect(
    getLegalActions(result.state, "runner").some((a) => a.type === "jack_out"),
  ).toBe(false);
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
});
