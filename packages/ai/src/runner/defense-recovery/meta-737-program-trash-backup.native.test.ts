import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { GameState, LegalAction, PlayerAction } from "@netgrid/shared";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseRunnerAction } from "../../index";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const BACKUP = "onr_v1_131_microtech-backup-drive";
const PROGRAM = "onr_v1_014_codecracker";
const ICE = "onr_v1_233_d-arc-knight";

function deck(id: string, side: "runner" | "corp") {
  const entry = catalog.decks.find((deck) => deck.standardDeckId === id);
  if (!entry || entry.side !== side) throw new Error("Missing test deck " + id);
  return {
    id,
    name: entry.name,
    side,
    identity: entry.identityCardId,
    cards: entry.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}
const runnerDeck = deck("standard_runner_stealth_interface_starter", "runner");
const corpDeck = deck("standard_corp_mph465dv", "corp");

afterEach(resetResidentPlanPortfolioMemory);

function apply(
  state: GameState,
  side: "runner" | "corp",
  matches: (action: LegalAction) => boolean,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const legal = getLegalActions(state, side);
  const action = legal.find(matches);
  if (!action)
    throw new Error(
      "Missing native action for " +
        side +
        " at " +
        state.stateVersion +
        " offers " +
        legal.map((entry) => entry.type).join(","),
    );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function fixture() {
  let state = createGameAfterSetup({
    seed: "meta-737-native-program-backup",
    corpDeck,
    runnerDeck,
    traceRulesProfile: "modern_open",
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(5)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(BACKUP)
    .withRunnerProgramInstalled(PROGRAM)
    .withCorpIceOnServer("rd", ICE)
    .withCorpCredits(10)
    .withRunnerCredits(6);
  state.runner.memoryUsed = 1;
  state.corp.clicks = 0;
  state = apply(state, "corp", (action) => action.type === "end_turn");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      state.cardInstances[String(action.payload?.cardId)]?.definitionId ===
        BACKUP,
  );
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = apply(state, "corp", (action) => action.type === "rez_ice");
  state = apply(state, "runner", (action) => action.type === "continue_run");
  const target = state.runner.rig.programs.find(
    (id) => state.cardInstances[id]?.definitionId === PROGRAM,
  );
  if (!target || !state.pendingChoice)
    throw new Error("Missing installed program trash target");
  state = apply(state, "corp", (action) => action.type === "resolve_choice", {
    choiceId: state.pendingChoice.choiceId,
    selectedOptionIds: ["card_" + target],
  });
  return { state, target };
}

function input(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

it("binds both native backup choices to defense and preserves the program for retrieval", () => {
  const { state, target } = fixture();
  expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  const offer = chooseRunnerAction(input(state));
  expect(offer.actionId).toBe("runner.resolve_choice");
  expect(offer.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "runner.defense_and_recovery",
  );
  expect(offer.selectedChoices).toEqual({
    choiceId: state.pendingChoice!.choiceId,
    selectedOptionIds: [
      state.pendingChoice!.options.find(
        (option) => option.metadata?.optionKind === "backup_trashed_programs",
      )!.id,
    ],
  });
  const targets = apply(
    state,
    "runner",
    (a) => a.actionId === offer.actionId,
    offer.selectedChoices,
  );
  const decision = chooseRunnerAction(input(targets));
  expect(decision.actionId).toBe("runner.resolve_choice");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.defense_and_recovery");
  expect(decision.selectedChoices).toEqual({
    choiceId: targets.pendingChoice!.choiceId,
    selectedOptionIds: [target],
  });
  const resolved = apply(
    targets,
    "runner",
    (a) => a.actionId === decision.actionId,
    decision.selectedChoices,
  );
  const drive = resolved.runner.rig.hardware.find(
    (id) => resolved.cardInstances[id]?.definitionId === BACKUP,
  );
  expect(drive).toBeDefined();
  expect(resolved.cardInstances[target]?.hostedOn).toBe(drive);
  expect(resolved.specialZones?.setAside).toContain(target);
  expect(resolved.runner.rig.programs).not.toContain(target);
  expect(resolved.runner.heap).not.toContain(target);
});

it("rejects a backup offer with an unbound source or stale Engine choice", () => {
  const { state } = fixture();
  const current = input(state);
  const backup = current.playerView.pendingChoice?.options.find(
    (option) => option.metadata?.optionKind === "backup_trashed_programs",
  );
  expect(backup).toBeDefined();
  backup!.metadata!.sourceCardInstanceId = "foreign_source";
  expect(() => chooseRunnerAction(current)).toThrow();
  const stale = input(state);
  stale.playerView.pendingChoice!.stateVersion--;
  expect(() => chooseRunnerAction(stale)).toThrow();
});
