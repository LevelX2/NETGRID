import standardDeckCatalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { applyAction, createGameAfterSetup, getLegalActions } from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  preparedProgramEncounterPayment,
  pureEndRunEncounterPayment,
} from "./run-window-pure-etr-economics";

function deck(id: string) {
  const entry = standardDeckCatalog.decks.find((d) => d.standardDeckId === id);
  if (!entry) throw new Error(`Missing test deck ${id}`);
  return {
    id,
    name: entry.name,
    side: entry.side as "runner" | "corp",
    identity: entry.identityCardId,
    cards: entry.cards.map((card) => ({ id: card.cardId, quantity: card.quantity })),
  };
}

function step(state: GameState, matches: (action: LegalAction) => boolean) {
  const side = state.activeSide;
  const action = getLegalActions(state, side).find(matches);
  if (!action) throw new Error(`Missing action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}

function encounter({ counters = 1, fullMemory = false } = {}) {
  const runnerDeck = deck("standard_runner_deep_market_engine");
  const corpDeck = deck("standard_corp_code_rot_bitte_eintreten_2026_07_16");
  let state = createGameAfterSetup({
    matchId: "prepared-encounter-breaker",
    seed: "prepared-encounter-breaker",
    runnerDeck,
    corpDeck,
  });
  state = step(state, (action) => action.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(4);
  state = step(state, (action) => action.type === "end_turn");
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withRunnerProgramInstalled(251)
    .withRunnerResourceInstalled(388)
    .withRunnerCardInGrip(286)
    .withRunnerCredits(8);
  fixture.withCorpIceOnServer("rd", 444);
  state.runner.memoryUsed = 1;
  if (fullMemory) state.runner.memoryLimit = 1;
  state = step(state, (action) =>
    action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
    action.payload?.targetCardDefinitionId === 286,
  );
  const worm = state.specialZones!.setAside[0]!;
  state.cardInstances[worm]!.counters = { shell: counters };
  state = step(state, (action) =>
    action.type === "start_run" && action.payload?.serverId === "rd",
  );
  state = step(state, (action) => action.type === "rez_ice");
  if (state.timingPoint === "run.jack_out_window") {
    state = step(state, (action) => action.type === "continue_run");
  }
  const ownDeckSnapshot = {
    deckSnapshotId: runnerDeck.id,
    side: "runner" as const,
    cards: runnerDeck.cards.map((card) => ({ cardId: card.id, quantity: card.quantity })),
  };
  return { state, worm, ownDeckSnapshot };
}

function quote(state: GameState, ownDeckSnapshot: ReturnType<typeof encounter>["ownDeckSnapshot"]) {
  const input = buildAiDecisionInput(state, "runner", { ownDeckSnapshot });
  const action = input.legalActions.find(
    (entry) => entry.payload?.delayedInstallAbility === "remove_shell_counter",
  );
  if (!action) throw new Error("Missing paid delayed-install offer");
  return { input, action };
}

it("prices a native paid installation and the remaining hard ETR as one cheaper encounter", () => {
  let { state, worm, ownDeckSnapshot } = encounter();
  const { input, action } = quote(state, ownDeckSnapshot);
  expect(action.payload?.delayedInstallCompletesPlainBreaker).toBe(true);
  expect(preparedProgramEncounterPayment(input, action)).toMatchObject({
    cost: 4,
    cashCost: 4,
    liquidCreditsAfterPayment: 4,
    rig: expect.arrayContaining([expect.objectContaining({ instanceId: worm })]),
  });
  const krash = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(pureEndRunEncounterPayment(input, krash)?.cost).toBe(8);

  state = step(state, (a) => a.actionId === action.actionId);
  expect(state.pendingChoice).toBeUndefined();
  expect(state.runner.rig.programs).toContain(worm);
  state = step(state, (a) => a.type === "pump_breaker" && a.source === worm);
  state = step(state, (a) => a.type === "break_subroutine" && a.source === worm);
  expect(state.runner.credits).toBe(4);
});

it.each([{ counters: 2 }, { fullMemory: true }])(
  "leaves an uncertified final install outside the encounter route (%j)",
  (options) => {
    const { state, ownDeckSnapshot } = encounter(options);
    const { input, action } = quote(state, ownDeckSnapshot);
    expect(action.payload?.delayedInstallCompletesPlainBreaker).toBeUndefined();
    expect(preparedProgramEncounterPayment(input, action)).toBeUndefined();
  },
);

it("keeps the direct route when the installed breaker already completes it more cheaply", () => {
  let { state, ownDeckSnapshot } = encounter();
  for (let i = 0; i < 3; i++) {
    state = step(state, (a) => a.type === "pump_breaker");
  }
  const { input, action } = quote(state, ownDeckSnapshot);
  expect(action.payload?.delayedInstallCompletesPlainBreaker).toBe(true);
  expect(preparedProgramEncounterPayment(input, action)).toBeUndefined();
});

it("requires an offer bound to the current native timing and state version", () => {
  const { state, ownDeckSnapshot } = encounter();
  const { input, action } = quote(state, ownDeckSnapshot);
  expect(
    preparedProgramEncounterPayment(input, {
      ...action,
      expiresAtStateVersion: action.expiresAtStateVersion - 1,
    }),
  ).toBeUndefined();
});
