import {
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type EngineRandomizedIceInstallCandidate,
  type EngineRandomizedIceInstallSelectionCommand,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyRandomizedIceInstallSelection,
  candidateFingerprint,
  createGame,
  getLegalActions,
  quoteRandomizedIceInstallSelection,
  replayGameEvents,
} from "../index";

describe("Engine-randomized ICE install near ties", () => {
  it("quotes without mutation and atomically applies exactly one fully bound draw", () => {
    const state = corpActionState();
    const candidates = hqAndRdIceCandidates(state).reverse();
    const snapshot = structuredClone(state);

    const quoted = quoteRandomizedIceInstallSelection(
      state,
      requestFor(state, candidates),
    );

    expect(quoted.ok).toBe(true);
    expect(state).toEqual(snapshot);
    if (!quoted.ok) return;
    expect(quoted.quote.candidates).toEqual(
      [...quoted.quote.candidates].sort((left, right) =>
        left.actionId.localeCompare(right.actionId),
      ),
    );
    expect(quoted.quote.visibility).toBe("private_to_actor");

    const result = applyRandomizedIceInstallSelection(state, {
      kind: "engine_randomized_ice_install_selection",
      quote: quoted.quote,
    });

    expect(result.ok).toBe(true);
    expect(state).toEqual(snapshot);
    if (!result.ok) return;
    expect(result.state.randomCounter).toBe(state.randomCounter + 1);
    expect(result.state.randomDrawRecords).toHaveLength(
      state.randomDrawRecords.length + 1,
    );
    expect(result.receipt.randomDraw.counter).toBe(state.randomCounter);
    expect(result.receipt.randomDraw.purpose).toContain(
      quoted.quote.candidateFingerprint,
    );
    expect(result.receipt.selectedCandidate).toEqual(
      expect.objectContaining({
        actionId: result.receipt.selectedLegalAction.actionId,
      }),
    );
    expect(result.state.stateVersion).toBe(state.stateVersion + 1);

    const publicEventJson = JSON.stringify(result.publicEvents.at(-1));
    expect(publicEventJson).not.toContain("candidateFingerprint");
    expect(publicEventJson).not.toContain("candidates");
    expect(publicEventJson).not.toContain("pf15.near_tie");
    expect(result.event.privatePayload?.corp?.action).toEqual({
      kind: "engine_randomized_ice_install_selection",
      quote: quoted.quote,
    });
    expect(
      result.event.privatePayload?.corp?.randomizedIceInstallSelectionReceipt,
    ).toEqual(result.receipt);
  });

  it("replays the randomized command and reaches the exact StateHash", () => {
    const initial = corpActionState();
    const quoted = quoteRandomizedIceInstallSelection(
      initial,
      requestFor(initial, hqAndRdIceCandidates(initial)),
    );
    expect(quoted.ok).toBe(true);
    if (!quoted.ok) return;

    const applied = applyRandomizedIceInstallSelection(initial, {
      kind: "engine_randomized_ice_install_selection",
      quote: quoted.quote,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const replay = replayGameEvents(initial, [applied.event]);

    expect(replay.ok).toBe(true);
    expect(replay.errors).toEqual([]);
    expect(replay.actualFinalStateHash).toBe(applied.stateHash);
    expect(replay.state.randomDrawRecords.at(-1)).toEqual(
      applied.receipt.randomDraw,
    );
  });

  it("fails closed before randomness for stale, tampered, incomplete, or invalid candidates", () => {
    const state = corpActionState();
    const quoted = quoteRandomizedIceInstallSelection(
      state,
      requestFor(state, hqAndRdIceCandidates(state)),
    );
    expect(quoted.ok).toBe(true);
    if (!quoted.ok) return;

    const commands: EngineRandomizedIceInstallSelectionCommand[] = [
      {
        kind: "engine_randomized_ice_install_selection",
        quote: {
          ...quoted.quote,
          stateVersion: quoted.quote.stateVersion - 1,
        },
      },
      {
        kind: "engine_randomized_ice_install_selection",
        quote: {
          ...quoted.quote,
          legalActions: quoted.quote.legalActions.map((action, index) =>
            index === 1
              ? { ...action, costs: [...action.costs, { credits: 999 }] }
              : action,
          ),
        },
      },
      {
        kind: "engine_randomized_ice_install_selection",
        quote: {
          ...quoted.quote,
          candidates: quoted.quote.candidates.map((candidate, index) =>
            index === 1
              ? { ...candidate, actionId: "not.a.legal.action" }
              : candidate,
          ),
        },
      },
    ];

    for (const command of commands) {
      const before = structuredClone(state);
      const result = applyRandomizedIceInstallSelection(state, command);
      expect(result.ok).toBe(false);
      expect(result.state).toEqual(before);
      expect(result.state.randomCounter).toBe(before.randomCounter);
      expect(result.state.randomDrawRecords).toEqual(before.randomDrawRecords);
    }

    const incomplete = applyRandomizedIceInstallSelection(state, {
      kind: "engine_randomized_ice_install_selection",
      quote: { ...quoted.quote, complete: false },
    } as unknown as EngineRandomizedIceInstallSelectionCommand);
    expect(incomplete.ok).toBe(false);
    expect(incomplete.state.randomCounter).toBe(state.randomCounter);

    const missingQuote = applyRandomizedIceInstallSelection(state, {
      kind: "engine_randomized_ice_install_selection",
    } as unknown as EngineRandomizedIceInstallSelectionCommand);
    expect(missingQuote.ok).toBe(false);
    expect(missingQuote.state.randomCounter).toBe(state.randomCounter);

    const randomCounterBeforeMalformedRequest = state.randomCounter;
    const malformedRequest = quoteRandomizedIceInstallSelection(state, {
      ...requestFor(state, hqAndRdIceCandidates(state)),
      candidates: [{ actionId: "", targetServerId: "hq" }],
    });
    expect(malformedRequest.ok).toBe(false);
    expect(state.randomCounter).toBe(randomCounterBeforeMalformedRequest);
  });

  it("uses collision-free canonical candidate serialization", () => {
    const left = [
      { actionId: "a:hq", targetServerId: "rd" },
      { actionId: "b", targetServerId: "hq" },
    ] satisfies EngineRandomizedIceInstallCandidate[];
    const right = [
      { actionId: "a", targetServerId: "hq" },
      { actionId: "b:rd", targetServerId: "hq" },
    ] satisfies EngineRandomizedIceInstallCandidate[];

    expect(candidateFingerprint(left)).not.toBe(candidateFingerprint(right));
    expect(candidateFingerprint(left)).toBe(
      candidateFingerprint([...left].reverse()),
    );
  });
});

function corpActionState(): GameState {
  const initial = createGame({
    seed: "near-0",
    setupMode: "completed",
  });
  const mandatoryDraw = getLegalActions(initial, "corp").find(
    (action) => action.type === "mandatory_draw",
  );
  expect(mandatoryDraw).toBeDefined();
  if (!mandatoryDraw) throw new Error("Mandatory draw action missing.");
  const result = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: mandatoryDraw.actionId,
    clientKnownStateVersion: initial.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function hqAndRdIceCandidates(
  state: GameState,
): EngineRandomizedIceInstallCandidate[] {
  const iceActions = getLegalActions(state, "corp").filter(
    (action): action is LegalAction =>
      action.type === "install_card" && action.payload?.placement === "ice",
  );
  const hq = iceActions.find((action) => action.payload?.serverId === "hq");
  const rd = iceActions.find(
    (action) =>
      action.payload?.serverId === "rd" &&
      action.payload.cardId === hq?.payload?.cardId,
  );
  expect(hq).toBeDefined();
  expect(rd).toBeDefined();
  if (!hq || !rd) throw new Error("HQ/R&D ICE candidates missing.");
  return [
    { actionId: hq.actionId, targetServerId: "hq" },
    { actionId: rd.actionId, targetServerId: "rd" },
  ];
}

function requestFor(
  state: GameState,
  candidates: EngineRandomizedIceInstallCandidate[],
) {
  return {
    schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
    matchId: state.matchId,
    side: "corp" as const,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    planStepId: "pf15.near_tie",
    candidates,
  };
}
