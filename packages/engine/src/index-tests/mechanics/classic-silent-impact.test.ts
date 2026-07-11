import { describe, expect, it } from "vitest";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  validateGameState,
} from "../../index";
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { addRezzedCorpRootForTest } from "../../test-fixtures/index-test-helpers";
import {
  apply,
  moveRunnerCardCopyToGrip,
  toRunnerTurnFromCorpMain,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const PROTECTED_RESOURCES = "onr_classic_053_protected-resources";
const PHONE_FREAK = "onr_classic_054_phone-freak";

const CORP_DECK: DeckDefinition = {
  id: "classic_silent_impact_corp",
  name: "Classic Silent Impact Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: PROTECTED_RESOURCES, quantity: 1 },
    { id: "simple_agenda", quantity: 8 },
    { id: "simple_barrier_ice", quantity: 4 },
    { id: "simple_economy_operation", quantity: 12 },
  ],
};

const RUNNER_DECK: DeckDefinition = {
  id: "classic_silent_impact_runner",
  name: "Classic Silent Impact Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: PHONE_FREAK, quantity: 1 },
    { id: "simple_setup_hardware", quantity: 3 },
    { id: "simple_fracter", quantity: 3 },
    { id: "simple_economy_event", quantity: 12 },
    { id: "simple_run_event", quantity: 8 },
  ],
};

function corpMainGame(seed: string): GameState {
  const state = apply(
    createGameAfterSetup({
      seed,
      corpDeck: CORP_DECK,
      runnerDeck: RUNNER_DECK,
      agendaPointsToWin: 99,
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.corp.credits = 8;
  state.corp.clicks = 3;
  return state;
}

describe("Classic Silent Impact v2.2b", () => {
  it("registers both cards as fully implemented Classic cards", () => {
    expect(
      cardImplementationForDefinitionId(PROTECTED_RESOURCES)?.abilities,
    ).toHaveLength(2);
    expect(
      cardImplementationForDefinitionId(PHONE_FREAK)
        ?.restrictedHostedCreditSource,
    ).toMatchObject({ capacity: 3, usableFor: ["increase_link"] });
    for (const cardId of [PROTECTED_RESOURCES, PHONE_FREAK]) {
      expect(cardImplementationCoverageForDefinitionId(cardId)).toMatchObject({
        cardDefinitionId: cardId,
        status: "implemented",
      });
    }
  });

  it("moves any selected affordable amount through Protected Resources", () => {
    let state = corpMainGame("classic-silent-impact-protected-resources");
    const sourceId = addRezzedCorpRootForTest(
      state,
      PROTECTED_RESOURCES,
      "remote_1",
      "protected",
    );

    const deposits = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === sourceId &&
        action.payload?.hostedCreditTransferDirection ===
          "controller_to_source",
    );
    expect(deposits.map((action) => action.payload?.xValue)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);

    state = apply(
      state,
      "corp",
      (action) =>
        action.source === sourceId &&
        action.payload?.hostedCreditTransferDirection ===
          "controller_to_source" &&
        action.payload?.xValue === 3,
    );

    expect(state.corp.credits).toBe(4);
    expect(state.cardInstances[sourceId]?.counters?.bit).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 3,
      hostedCreditsAfter: 3,
      remainingCounters: 3,
    });

    state = apply(
      state,
      "corp",
      (action) =>
        action.source === sourceId &&
        action.payload?.hostedCreditTransferDirection ===
          "source_to_controller" &&
        action.payload?.xValue === 2,
    );

    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(6);
    expect(state.cardInstances[sourceId]?.counters?.bit).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("puts three link-only recurring bits on Phone Freak when installed", () => {
    let state = toRunnerTurnFromCorpMain(
      corpMainGame("classic-silent-impact-phone-freak"),
    );
    const phoneId = moveRunnerCardCopyToGrip(state, PHONE_FREAK);
    state.runner.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === phoneId,
    );

    expect(state.runner.rig.resources).toContain(phoneId);
    expect(state.cardInstances[phoneId]?.counters?.bit).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: PHONE_FREAK,
      addedCounterAmount: 3,
      hostedCreditsAfter: 3,
      remainingCounters: 3,
    });
    expect(validateGameState(state).ok).toBe(true);
  });
});
