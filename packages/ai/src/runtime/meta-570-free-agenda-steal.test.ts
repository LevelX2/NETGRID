import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildAiDecisionInput } from "./ai-decision-input";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { runnerFreeAgendaStealForCurrentAccess } from "../runner/run-window/run-window-action-facts";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  const { checkpoint, state, provenance } = JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-free-agenda-steal.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(
    Object.values(checkpoint.validation).every((value) => value === true),
  ).toBe(true);
  expect(provenance).toMatchObject({
    checkedPrefixStates: 327,
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
function chooseAndApply(input: AiDecisionInput, state: GameState) {
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  const action = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("steal_agenda");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.convert_run_window");
  expect(
    getLegalActions(state, "runner").some(
      (entry) => entry.actionId === action.actionId,
    ),
  ).toBe(true);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(result.state));
  return { decision, action, state: result.state };
}

it("converts the original free winning access without trashing and running Archives again", () => {
  const { input, state } = original();
  expect(input.playerView.own.agendaPoints).toBe(6);
  expect(input.legalActions.map((action) => action.type)).toEqual([
    "trash_accessed_card",
    "steal_agenda",
  ]);
  const after = chooseAndApply(input, state);
  expect(after.action.costs).toEqual([]);
  expect(
    after.decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
  ).toBe("plan:runner.pressure_central:central%3Ahq");
  expect(getPlayerView(after.state, "runner")).toMatchObject({
    winner: "runner",
    own: { agendaPoints: 8 },
  });
});

it.each([
  "onr_v1_207_netwatch-operations-office",
  "onr_v1_205_main-office-relocation",
])(
  "keeps the free agenda gain over virus trash without a terminal or card-name bonus: %s",
  (definitionId) => {
    const { input: previous, state } = original();
    resetResidentPlanPortfolioMemory();
    const cardId = state.run!.accessedCardId!;
    state.cardInstances[cardId]!.definitionId = definitionId;
    state.agendaPointsToWin = 20;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: previous.ownDeckSnapshot!,
      eventTail: state.eventLog,
    });
    expect(
      input.legalActions.some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(true);
    const after = chooseAndApply(input, state);
    expect(
      getPlayerView(after.state, "runner").own.agendaPoints,
    ).toBeGreaterThan(previous.playerView.own.agendaPoints);
    expect(getPlayerView(after.state, "runner").winner).toBeNull();
  },
);

it.each([
  "paid",
  "replacement",
  "stale",
  "source",
  "choice",
  "unknown",
  "zero_points",
])(
  "does not certify free ordinary agenda dominance with %s facts",
  (boundary) => {
    const { input } = original();
    const steal = input.legalActions.find(
      (action) => action.type === "steal_agenda",
    )!;
    if (boundary === "paid") steal.costs = [{ credits: 2 }];
    if (boundary === "replacement")
      steal.payload = { agendaAccessReplacement: "install_as_runner_program" };
    if (boundary === "stale") steal.expiresAtStateVersion--;
    if (boundary === "source") steal.source = "another_agenda";
    if (boundary === "choice")
      steal.choiceRequirements = [
        {
          choiceId: "different_choice",
          optionIds: ["a", "b"],
          minSelections: 1,
          maxSelections: 1,
        },
      ];
    if (boundary === "unknown")
      input.playerView.run!.accessedCard!.known = false;
    if (boundary === "zero_points")
      input.playerView.run!.accessedCard!.agendaPoints = 0;
    expect(runnerFreeAgendaStealForCurrentAccess(input)).toBeUndefined();
  },
);
