import { programTrashCoverageLosses } from "../../corp/defense/program-trash-coverage";
import { afterEach, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  applyAction,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  putCorpIceOnServer,
  installRunnerProgramForTest,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput, chooseCorpAction } from "../../index";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { selectedCorpProgramTrashChoiceOptionIds } from "../../runtime/corp-program-trash-choice";

afterEach(resetResidentPlanPortfolioMemory);

it("destroys the sole affordable Wall response and applies the exact Defense choice deterministically", () => {
  const initial = choiceState();
  const input = corpInput(initial);
  const decision = chooseCorpAction(input);
  expect(selectedTarget(input, decision)).toContain("worm");
  expect(decision.actionId).toBe(input.legalActions[0]!.actionId);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    lane: "plan",
    route: { actionId: decision.actionId },
    selectedStep: {
      planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    },
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
  });
  if (!decision.actionId || !decision.selectedChoices)
    throw new Error("Expected a bound legal action");
  const result = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: decision.actionId,
    clientKnownStateVersion: initial.stateVersion,
    idempotencyKey: "trash-target",
    selectedChoices: decision.selectedChoices,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(
    result.state.runner.rig.programs.some((id) => id.includes("worm")),
  ).toBe(false);
  const replay = replayEvents(
    initial,
    result.state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
});

it("preserves redundant Wall coverage and instead removes the unique affordable decoder", () => {
  const input = corpInput(choiceState({ dwarf: true, gate: true }));
  expect(selectedTarget(input, chooseCorpAction(input))).toContain(
    "cyfermaster",
  );
});

it("recognizes universal replacement cost but prioritizes its unique Sentry coverage", () => {
  const input = corpInput(choiceState({ krash: true }));
  const programs = input.playerView.opponent.rig!;
  const losses = programTrashCoverageLosses(input, programs);
  const worm = programs.find((p) => p.definitionId === "onr_v1_074_worm")!;
  const krash = programs.find((p) => p.definitionId === "onr_v1_039_krash")!;
  expect(losses.get(worm.instanceId)).toEqual({
    lostAffordableIce: 0,
    additionalCredits: 4,
  });
  expect(losses.get(krash.instanceId)?.lostAffordableIce).toBe(1);
  expect(selectedTarget(input, chooseCorpAction(input))).toContain("krash");
});

it("does not award coverage loss for unrezzed ICE", () => {
  const input = corpInput(choiceState({ unrezzedWall: true }));
  expect(selectedTarget(input, chooseCorpAction(input))).toContain(
    "cyfermaster",
  );
});

it("does not award coverage loss for a path already unaffordable before the trash", () => {
  const input = corpInput(choiceState({ gate: true, credits: 1 }));
  expect(selectedTarget(input, chooseCorpAction(input))).toContain("worm");
});

it("keeps the target unchanged when the public Runner hand count changes", () => {
  const input = corpInput(choiceState());
  const first = selectedTarget(input, chooseCorpAction(input));
  resetResidentPlanPortfolioMemory();
  input.playerView.opponent.handCount = 20;
  expect(selectedTarget(input, chooseCorpAction(input))).toBe(first);
});

it("requires current Engine quotes for known rezzed ICE", () => {
  const input = corpInput(choiceState());
  delete input.playerView.servers.find((s) => s.id === "rd")!.ice[0]!
    .effectiveRunQuote;
  expect(() => chooseCorpAction(input)).toThrow("missing_action_semantics");
});

it("requires the selected Defense executor instead of ranking targets again in the resolver", () => {
  const input = corpInput(choiceState());
  const action = input.legalActions[0]!;
  const choice = input.playerView.pendingChoice!;
  expect(() =>
    selectedCorpProgramTrashChoiceOptionIds(
      input,
      action,
      choice,
      choice.options,
    ),
  ).toThrow("window_origin_missing");
  chooseCorpAction(input);
  expect(
    selectedCorpProgramTrashChoiceOptionIds(
      input,
      action,
      choice,
      choice.options,
    ),
  ).toHaveLength(1);
  choice.stateVersion--;
  expect(() =>
    selectedCorpProgramTrashChoiceOptionIds(
      input,
      action,
      choice,
      choice.options,
    ),
  ).toThrow("window_origin_missing");
});

function selectedTarget(
  input: ReturnType<typeof corpInput>,
  decision: ReturnType<typeof chooseCorpAction>,
): string {
  const ids = decision.selectedChoices?.selectedOptionIds;
  if (!Array.isArray(ids) || ids.length !== 1)
    throw new Error("Expected one bound target");
  const id = ids[0];
  return String(
    input.playerView.pendingChoice!.options.find((o) => o.id === id)!.value,
  );
}

function corpInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    eventTail: state.eventLog,
    ownDeckSnapshot: {
      deckSnapshotId: "program-trash-coverage-test",
      side: "corp",
      cards: Object.values(state.cardInstances)
        .filter((c) => c.owner === "corp")
        .map((c) => ({ cardId: c.definitionId, quantity: 1 })),
    },
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    actionNumber: state.stateVersion,
  });
}

function choiceState(
  options: {
    dwarf?: boolean;
    gate?: boolean;
    krash?: boolean;
    unrezzedWall?: boolean;
    credits?: number;
  } = {},
): GameState {
  const corp = [
    "onr_proteus_029_marionette",
    "onr_v1_238_data-wall-2-0",
    "onr_v1_247_haunting-inquisition",
  ];
  const runner = [
    "onr_v1_074_worm",
    "onr_v1_016_cyfermaster",
    "onr_v1_021_dwarf",
    "onr_v1_039_krash",
  ];
  let state = createGameAfterSetup({
    seed: "program-trash-coverage",
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...corp.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => !corp.includes(c.id),
        ),
      ],
    },
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        ...runner.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (c) => !runner.includes(c.id),
        ),
      ],
    },
  });
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  const marionette = putCorpIceOnServer(state, "hq", corp[0]!);
  const wall = putCorpIceOnServer(state, "rd", corp[1]!);
  state.cardInstances[wall]!.rezzed = !options.unrezzedWall;
  state.cardInstances[wall]!.faceup = !options.unrezzedWall;
  if (options.gate) {
    const gate = putCorpIceOnServer(state, "archives", corp[2]!);
    state.cardInstances[gate]!.rezzed = true;
    state.cardInstances[gate]!.faceup = true;
  }
  installRunnerProgramForTest(state, runner[0]!);
  installRunnerProgramForTest(state, runner[1]!);
  if (options.dwarf) installRunnerProgramForTest(state, runner[2]!);
  if (options.krash) installRunnerProgramForTest(state, runner[3]!);
  state.runner.credits = options.credits ?? 6;
  state.corp.credits = 20;
  state.corp.clicks = 0;
  state = applyMatching(state, (a) => a.type === "end_turn");
  state = applyMatching(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "hq",
  );
  state = applyMatching(
    state,
    (a) => a.type === "rez_ice" && a.source === marionette,
  );
  for (let i = 0; !state.pendingChoice && i < 5; i++)
    state = applyMatching(
      state,
      (a) => a.type === "decline_rez" || a.type === "continue_run",
    );
  expect(state.pendingChoice?.source).toContain("trash_installed_program");
  return state;
}

function applyMatching(
  state: GameState,
  matches: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action) throw new Error(`No action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `fixture:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
