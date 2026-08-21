import {
  ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
  type CardDefinitionId,
  type EngineRandomizedTraceBidSelectionCommand,
  type GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  applyRandomizedTraceBidSelection,
  createGame,
  getLegalActions,
  quoteRandomizedTraceBidSelection,
  replayGameEvents,
} from "../index";

describe("Engine-randomized Blind Trace bid selection", () => {
  it("revalidates one bound Trace Choice, consumes the authoritative RNG, and replays exactly", () => {
    const initial = blindTraceBidState("trace-bid-replay");
    const snapshot = structuredClone(initial);
    const quoted = quote(initial);

    expect(quoted.ok).toBe(true);
    expect(initial).toEqual(snapshot);
    if (!quoted.ok) return;

    const applied = applyRandomizedTraceBidSelection(initial, {
      kind: "engine_randomized_trace_bid_selection",
      quote: quoted.quote,
    });

    expect(applied.ok).toBe(true);
    expect(initial).toEqual(snapshot);
    if (!applied.ok) return;
    expect(applied.state.randomCounter).toBe(initial.randomCounter + 1);
    expect(applied.receipt.randomDraw).toMatchObject({
      counter: initial.randomCounter,
    });
    expect(applied.receipt.selectedCandidate.bid).toBe(
      applied.state.trace?.corpBid,
    );
    expect(applied.receipt.selectedLegalAction.actionId).toBe(
      quoted.quote.actionId,
    );
    expect(applied.event.privatePayload?.corp).toMatchObject({
      action: { kind: "engine_randomized_trace_bid_selection" },
      randomizedTraceBidSelectionReceipt: {
        planStepId: "corp.apply_tag_or_trace",
      },
    });
    expect(JSON.stringify(applied.publicEvents)).not.toContain(
      "rationalTarget",
    );
    expect(JSON.stringify(applied.publicEvents)).not.toContain(
      "candidateFingerprint",
    );

    const replay = replayGameEvents(initial, [applied.event]);
    expect(replay.ok).toBe(true);
    expect(replay.errors).toEqual([]);
    expect(replay.actualFinalStateHash).toBe(applied.stateHash);
    expect(replay.state.randomDrawRecords.at(-1)).toEqual(
      applied.receipt.randomDraw,
    );
  });

  it("reproduces one bid for the same seed while different seeds can select different plausible bids", () => {
    const first = selectBid("trace-bid-same-seed");
    const second = selectBid("trace-bid-same-seed");

    expect(second).toEqual(first);

    const bids = new Set(
      Array.from(
        { length: 16 },
        (_, index) => selectBid(`trace-bid-seed-${index}`).bid,
      ),
    );
    expect([...bids].every((bid) => bid >= 0 && bid <= 3)).toBe(true);
    expect(bids.size).toBeGreaterThan(1);
  });

  it("selects the same bid for one seed across match ids", () => {
    const first = selectBid("trace-bid-match-independent", "match-left");
    const second = selectBid("trace-bid-match-independent", "match-right");

    expect(second).toEqual(first);
  });

  it("fails closed before randomness for stale or tampered quotes", () => {
    const state = blindTraceBidState("trace-bid-fail-closed");
    const quoted = quote(state);
    expect(quoted.ok).toBe(true);
    if (!quoted.ok) return;

    const commands: EngineRandomizedTraceBidSelectionCommand[] = [
      {
        kind: "engine_randomized_trace_bid_selection",
        quote: { ...quoted.quote, stateVersion: state.stateVersion - 1 },
      },
      {
        kind: "engine_randomized_trace_bid_selection",
        quote: {
          ...quoted.quote,
          candidates: quoted.quote.candidates.map((candidate, index) =>
            index === 0 ? { ...candidate, bid: 99 } : candidate,
          ),
        },
      },
      {
        kind: "engine_randomized_trace_bid_selection",
        quote: {
          ...quoted.quote,
          assessment: {
            ...quoted.quote.assessment,
            traceId: "not-the-current-trace",
          },
        },
      },
    ];

    for (const command of commands) {
      const before = structuredClone(state);
      const result = applyRandomizedTraceBidSelection(state, command);
      expect(result.ok).toBe(false);
      expect(result.state).toEqual(before);
      expect(result.state.randomCounter).toBe(before.randomCounter);
      expect(result.state.randomDrawRecords).toEqual(before.randomDrawRecords);
    }
  });
});

function selectBid(
  seed: string,
  matchId = "local-demo-match",
): { bid: number; draw: number } {
  const state = blindTraceBidState(seed, matchId);
  const quoted = quote(state);
  if (!quoted.ok) throw new Error(quoted.error.message);
  const applied = applyRandomizedTraceBidSelection(state, {
    kind: "engine_randomized_trace_bid_selection",
    quote: quoted.quote,
  });
  if (!applied.ok) throw new Error(applied.error.message);
  return {
    bid: applied.receipt.selectedCandidate.bid,
    draw: applied.receipt.randomDraw.value,
  };
}

function quote(state: GameState) {
  const action = getLegalActions(state, "corp").find(
    (candidate) => candidate.type === "resolve_choice",
  );
  if (!action || !state.pendingChoice || !state.trace) {
    throw new Error("Bound Corp Trace Choice missing.");
  }
  return quoteRandomizedTraceBidSelection(state, {
    schemaVersion: ENGINE_RANDOMIZED_TRACE_BID_SELECTION_SCHEMA_VERSION,
    matchId: state.matchId,
    side: "corp",
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    actionId: action.actionId,
    choiceId: state.pendingChoice.choiceId,
    planStepId: "corp.apply_tag_or_trace",
    assessment: {
      traceId: state.trace.traceId,
      traceRulesProfile: "classic_blind",
      printedTrace: 3,
      effectiveTraceLimit: 3,
      currentLink: 0,
      visibleOpponentBidCapacity: 5,
      rationalTarget: 1,
      rationalRange: [0, 3],
      stakes: "low",
      behavioralBias: "polarized",
      reserveTarget: 2,
      outcomeValue: 3,
    },
    candidates: [
      { optionId: "bid_0", bid: 0, weight: 3, utility: 0.4 },
      { optionId: "bid_1", bid: 1, weight: 5, utility: 1.2 },
      { optionId: "bid_2", bid: 2, weight: 2, utility: 0.8 },
      { optionId: "bid_3", bid: 3, weight: 3, utility: 0.2 },
    ],
  });
}

function blindTraceBidState(
  seed: string,
  matchId = "local-demo-match",
): GameState {
  const state = createGame({
    matchId,
    seed,
    setupMode: "completed",
    traceRulesProfile: "classic_blind",
  });
  const sourceCardInstanceId = state.corp.identity;
  const sourceDefinitionId = state.cardInstances[sourceCardInstanceId]
    ?.definitionId as CardDefinitionId | undefined;
  if (!sourceDefinitionId) throw new Error("Corp identity source missing.");
  state.corp.credits = 5;
  state.activeSide = "corp";
  state.trace = {
    traceId: "trace_rng_1",
    sourceCardInstanceId,
    sourceDefinitionId,
    traceRulesProfile: "classic_blind",
    traceLimit: 3,
    effectiveTraceLimit: 3,
    corpBidMax: 3,
    status: "corp_bid",
    bidsRevealed: false,
    successEffect: { type: "add_tag", amount: 1 },
  };
  state.pendingChoice = {
    choiceId: `trace_rng_1.corp.bid.${state.stateVersion}`,
    side: "corp",
    source: "trace:trace_rng_1",
    prompt: "Verdecktes Korp-Gebot wählen",
    kind: "bid_amount",
    options: Array.from({ length: 4 }, (_, bid) => ({
      id: `bid_${bid}`,
      label: `${bid} Credits`,
      publicLabel: "Gebot festlegen",
      value: bid,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "hidden_info_barrier",
  };
  return state;
}
