import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseRunnerAction } from "../index";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const CODECRACKER = "onr_v1_014_codecracker";
const INSTALLER = "onr_v1_075_zetatech-software-installer";
const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_corp_cheap_bag_tricks"
        : "standard_runner_last_call_at_rd";
    const deck = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: deck.name,
        side,
        identity: deck.identityCardId,
        cards: deck.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(() => resetResidentPlanPortfolioMemory());

function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture(fullMemory: boolean) {
  let state = createGameAfterSetup({
    seed: "native-paid-program-trash-sibling",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    traceRulesProfile: "modern_open",
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(5)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(CODECRACKER)
    .withRunnerProgramInstalled("onr_v1_045_newsgroup-filter")
    .withRunnerProgramInstalled(INSTALLER)
    .withRezzedCorpIceOnServer("rd", "onr_v1_270_sleeper")
    .withRunnerCredits(6);
  if (fullMemory) builder.withRunnerProgramInstalled("onr_v1_017_deep-thought");
  state.runner.memoryUsed = fullMemory ? 4 : 3;
  state.corp.clicks = 0;
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state.runner.clicks = 1;
  return state;
}
function input(state: GameState) {
  const deck = decks.runner!;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "runner",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}

it("keeps mandatory MU replacement executable across native recurring-credit payment variants", () => {
  const state = fixture(true);
  const before = hashState(state);
  const current = input(state);
  const installs = current.legalActions.filter(
    (a) =>
      a.type === "install_card" &&
      state.cardInstances[String(a.payload?.cardId)]?.definitionId ===
        CODECRACKER,
  );
  expect(installs.length).toBeGreaterThan(1);
  expect(
    installs.every((a) => a.payload?.runnerProgramTrashBeforeInstall === true),
  ).toBe(true);
  expect(
    installs.some(
      (a) =>
        a.actionId.includes(".runner_program_trash_before_install.") &&
        !a.actionId.endsWith(".runner_program_trash_before_install"),
    ),
  ).toBe(true);
  const decision = chooseRunnerAction(current);
  const native = installs.find((a) => a.actionId === decision.actionId);
  expect(native).toBeDefined();
  expect(
    decision.decisionDebug?.whyNot?.some((reason) =>
      reason.includes(
        "runner_program_trash_install_unneeded_direct_install_available",
      ),
    ),
  ).toBe(false);
  const origin = decision.decisionDebug!.planFirstDecision!.selectedPlan!;
  expect(origin.moduleId).toBe("runner.rig_and_coverage");
  expect(hashState(state)).toBe(before);
  const started = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: native!.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices,
  });
  if (!started.ok) throw Error(started.error.message);
  expect(started.state.pendingChoice).toBeDefined();
  const choice = chooseRunnerAction(input(started.state));
  expect(
    choice.decisionDebug?.planFirstDecision?.executionOrigin.leafPlanInstanceId,
  ).toBe(decision.decisionDebug!.planFirstDecision!.leafExecutorInstanceId);
  expect(choice.selectedChoices?.choiceId).toBe(
    started.state.pendingChoice!.choiceId,
  );
  const resolved = applyAction(started.state, {
    matchId: started.state.matchId,
    side: "runner",
    actionId: choice.actionId,
    clientKnownStateVersion: started.state.stateVersion,
    selectedChoices: choice.selectedChoices,
  });
  if (!resolved.ok) throw Error(resolved.error.message);
  expect(
    resolved.state.runner.rig.programs.some(
      (id) => resolved.state.cardInstances[id]!.definitionId === CODECRACKER,
    ),
  ).toBe(true);
  const replay = replayEvents(state, [started.event, resolved.event]);
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(resolved.state));
});

it("retains the direct native install when no MU sacrifice is required", () => {
  const state = fixture(false);
  const decision = chooseRunnerAction(input(state));
  const native = getLegalActions(state, "runner").find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(native.type).toBe("install_card");
  expect(
    state.cardInstances[String(native.payload?.cardId)]?.definitionId,
  ).toBe(CODECRACKER);
  expect(native.payload?.runnerProgramTrashBeforeInstall).not.toBe(true);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: native.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.pendingChoice).toBeUndefined();
  expect(result.state.runner.rig.programs).toHaveLength(3);
});
