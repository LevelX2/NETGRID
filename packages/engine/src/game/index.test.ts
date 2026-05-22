// ARCH-2 game facade smoke tests: assert delegation only, not gameplay semantics.
import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame as createLegacyGame,
  createGameAfterSetup as createLegacyGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState as legacyHashState,
  replayEvents,
  validateGameState as legacyValidateGameState,
} from "../index";
import {
  applyGameAction,
  buildPlayerViewProjection,
  createGame,
  createGameAfterSetup,
  hashGameState,
  hashState,
  legalActionsFor,
  playerViewFor,
  replayGameEvents,
  validateGameState,
  validateGameStateForDebug,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  type CostQuote,
} from "./index";
import {
  describeCurrentTraceWindow,
  requireCurrentTrace,
  requireTracePhase,
  traceIsInPhase,
} from "./trace/trace-state";

describe("game facade", () => {
  it("delegates to the existing engine API", () => {
    const state = createGame({
      seed: "arch-2-game-facade",
      setupMode: "completed",
    });
    const legacyState = createLegacyGame({
      seed: "arch-2-game-facade",
      setupMode: "completed",
    });
    const mandatoryDraw = getLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    );

    expect(state).toEqual(legacyState);
    expect(legalActionsFor(state, "corp")).toEqual(getLegalActions(state, "corp"));
    expect(playerViewFor(state, "corp")).toEqual(getPlayerView(state, "corp"));
    expect(hashState(state)).toBe(legacyHashState(state));
    expect(hashGameState(state)).toBe(legacyHashState(state));
    expect(validateGameState(state)).toEqual(legacyValidateGameState(state));
    expect(validateGameStateForDebug(state)).toEqual(
      legacyValidateGameState(state),
    );
    expect(replayGameEvents(state, state.eventLog)).toEqual(
      replayEvents(state, state.eventLog),
    );

    expect(mandatoryDraw).toBeDefined();
    if (!mandatoryDraw) return;

    expect(
      applyGameAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: mandatoryDraw.actionId,
        clientKnownStateVersion: state.stateVersion,
      }),
    ).toEqual(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: mandatoryDraw.actionId,
        clientKnownStateVersion: state.stateVersion,
      }),
    );
  });

  it("keeps setup creation compatible through both entrypoints", () => {
    const state = createGame({
      seed: "arch-3-game-facade",
    });
    const legacyState = createLegacyGame({
      seed: "arch-3-game-facade",
    });
    const afterSetup = createGameAfterSetup({
      seed: "arch-3-game-facade-after-setup",
    });
    const legacyAfterSetup = createLegacyGameAfterSetup({
      seed: "arch-3-game-facade-after-setup",
    });

    expect(state).toEqual(legacyState);
    expect(afterSetup).toEqual(legacyAfterSetup);
  });

  it("builds the same player view projection when legal actions are provided", () => {
    const state = createGame({
      seed: "arch-5r-player-view-projection",
      setupMode: "completed",
    });
    const legalActions = getLegalActions(state, "corp");

    expect(buildPlayerViewProjection(state, "corp", legalActions)).toEqual(
      getPlayerView(state, "corp"),
    );
  });

  it("exports payment quote helpers with defensive LegalAction copies", () => {
    const quote: CostQuote = {
      purpose: "corp_rez",
      side: "corp",
      targetCardId: "ice-1",
      baseCredits: 4,
      finalCredits: 2,
      costs: [{ credits: 2 }],
      modifiers: [],
      canPay: true,
      publicPayload: { cardId: "ice-1", rezCostPaid: 2 },
    };

    const costs = costQuoteToLegalActionCosts(quote);
    const payload = costQuotePublicPayload(quote);
    costs[0]!.credits = 99;
    payload.rezCostPaid = 99;

    expect(quote.costs).toEqual([{ credits: 2 }]);
    expect(quote.publicPayload).toEqual({ cardId: "ice-1", rezCostPaid: 2 });
  });

  it("guards and describes the current trace window without mutating state", () => {
    const state = createGame({
      seed: "arch-12-trace-state-guards",
      setupMode: "completed",
    });

    expect(() => requireCurrentTrace(state)).toThrow("Kein aktiver Trace.");

    state.trace = {
      traceId: "arch-12.trace",
      sourceCardInstanceId: state.runner.identity,
      sourceDefinitionId: "demo_runner_identity",
      baseTraceStrength: 2,
      status: "corp_bid",
      successEffect: { type: "add_tag", amount: 1 },
    };

    expect(requireCurrentTrace(state)).toBe(state.trace);
    expect(requireTracePhase(state, "corp_bid")).toBe(state.trace);
    expect(traceIsInPhase(state, "corp_bid")).toBe(true);
    expect(traceIsInPhase(state, "runner_bid")).toBe(false);
    expect(() => requireTracePhase(state, "runner_bid")).toThrow(
      "Es ist kein Runner-Trace-Bid offen.",
    );
    expect(describeCurrentTraceWindow(state)).toMatchObject({
      traceId: "arch-12.trace",
      phase: "corp_bid",
      baseTraceStrength: 2,
      hasCorpBid: false,
      hasRunnerBid: false,
      postBidLinkSourceIds: [],
    });
  });
});
