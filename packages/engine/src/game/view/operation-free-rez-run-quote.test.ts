import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "../../index";
import {
  apply,
  moveCorpCardToHq,
  putCorpIceOnServer,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";

it.each([
  [
    109,
    82,
    0,
    0,
    "term",
    3,
  ],
  [
    107,
    82,
    1,
    0,
    "kludge",
    1,
  ],
  [
    109,
    94,
    0,
    0,
    "term",
    4,
  ],
  [
    109,
    70,
    0,
    2,
    "term",
    6,
  ],
  [
    107,
    72,
    1,
    1,
    "kludge",
    1,
  ],
] as const)(
  "quotes the actual %s free rez of %s and matches its applied Engine state",
  (operation, target, credits, routines, counter, amount) => {
    const d = catalog.decks.find(
      (d) =>
        d.standardDeckId ===
        "standard_proteus_corp_variable_ice_gauntlet_2026_05_25",
    )!;
    let state = createGameAfterSetup({
      seed: "meta568-free-rez-operation",
      corpDeck: {
        id: d.standardDeckId,
        name: d.name,
        side: "corp",
        identity: d.identityCardId,
        cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    });
    state = apply(state, "corp", (a) => a.type === "mandatory_draw");
    const source = moveCorpCardToHq(state, operation),
      ice = putCorpIceOnServer(state, "rd", target);
    state.corp.credits = credits;
    const before = hashState(state),
      action = getLegalActions(state, "corp").find(
        (a) =>
          a.type === "play_operation" &&
          a.source === source &&
          a.payload?.targetCardId === ice &&
          (counter !== "kludge" || a.payload.xValue === 1),
      )!;
    expect(action).toBeDefined();
    const quote = JSON.parse(
      action.payload?.operationFreeRezRunQuoteJson as string,
    );
    expect(quote).toMatchObject({
      operationActionId: action.actionId,
      sourceCardId: source,
      sourceDefinitionId: operation,
      counterType: counter,
      counterAmount: amount,
      stateVersion: state.stateVersion,
      postRez: { complete: true, cardId: ice, targetServerId: "rd" },
    });
    expect(quote.postRez.effectiveRunQuote.subroutines).toHaveLength(routines);
    expect(hashState(state)).toBe(before);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw Error(JSON.stringify(result.error));
    state = result.state;
    expect(state.cardInstances[ice]?.counters?.[counter]).toBe(amount);
    expect(
      getPlayerView(state, "corp")
        .servers.find((s) => s.id === "rd")
        ?.ice.find((c) => c.instanceId === ice)?.effectiveRunQuote?.subroutines,
    ).toEqual(quote.postRez.effectiveRunQuote.subroutines);
    if (target === 72) {
      expect(quote.postRez.creditGainOnRez).toMatchObject({
        creditsBefore: 0,
        creditGain: 2,
        creditsAfter: 2,
      });
      expect(state.corp.credits).toBe(2);
    }
  },
);
