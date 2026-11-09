import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyRandomizedIceInstallSelection,
  createGame,
  getLegalActions,
  hashState,
  quoteRandomizedIceInstallSelection,
} from "@netgrid/engine";
import { ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";
import { probeHistoricalEngineState } from "./maintenance-engine-probe";

function checkpoint() {
  const initial = createGame({ seed: "near-0", setupMode: "completed" });
  const draw = getLegalActions(initial, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const drawn = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: initial.stateVersion,
  });
  if (!drawn.ok) throw new Error(drawn.error.message);
  const state = drawn.state;
  const installs = getLegalActions(state, "corp").filter(
    (a) => a.type === "install_card" && a.payload?.placement === "ice",
  );
  const hq = installs.find((a) => a.payload?.serverId === "hq")!;
  const rd = installs.find(
    (a) =>
      a.payload?.serverId === "rd" && a.payload.cardId === hq.payload?.cardId,
  )!;
  expect(hq).toBeDefined();
  expect(rd).toBeDefined();
  const request = {
    schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
    matchId: state.matchId,
    side: "corp" as const,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    planStepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
    candidates: [
      { actionId: hq.actionId, targetServerId: "hq" as const },
      { actionId: rd.actionId, targetServerId: "rd" as const },
    ],
  };
  return { state, request };
}

describe("historical randomized ICE selection probes", () => {
  it("uses the real Engine quote and draw on an unchanged private clone", () => {
    const { state, request } = checkpoint();
    const original = structuredClone(state);
    const quote = quoteRandomizedIceInstallSelection(state, request);
    if (!quote.ok) throw new Error(quote.error.message);
    const applied = applyRandomizedIceInstallSelection(state, {
      kind: "engine_randomized_ice_install_selection",
      quote: quote.quote,
    });
    if (!applied.ok) throw new Error(applied.error.message);
    const params = {
      state,
      expectedStateHash: hashState(state),
      actor: "corp" as const,
      actions: [{ randomizedIceInstallSelection: request }],
    };
    const result = probeHistoricalEngineState(params);
    expect(result.status).toBe("completed");
    expect(result.steps).toHaveLength(1);
    expect(result.steps![0]).toMatchObject({
      actionId: applied.receipt.selectedCandidate.actionId,
      stateHash: applied.stateHash,
      randomCounter: state.randomCounter + 1,
      randomizedIceInstallSelection: {
        quote: quote.quote,
        selectedCandidate: applied.receipt.selectedCandidate,
        randomDrawCounter: applied.receipt.randomDraw.counter,
        randomDrawPurpose: applied.receipt.randomDraw.purpose,
      },
    });
    expect(result.nextLegalActions).toEqual(
      getLegalActions(applied.state, "corp"),
    );
    expect(probeHistoricalEngineState(params)).toEqual(result);
    expect(state).toEqual(original);
    const serialized = JSON.stringify(result);
    for (const id of state.runner.grip) expect(serialized).not.toContain(id);
    for (const field of [
      "cardInstances",
      "gameState",
      "randomDrawRecords",
      '"seed"',
      '"value"',
    ])
      expect(serialized).not.toContain(field);
  });

  it("keeps the same actor for a following ordinary action", () => {
    const { state, request } = checkpoint();
    const result = probeHistoricalEngineState({
      state,
      expectedStateHash: hashState(state),
      actor: "corp",
      actions: [
        { randomizedIceInstallSelection: request },
        { actionId: "corp.gain_credit" },
      ],
    });
    expect(result.status).toBe("completed");
    expect(result.steps).toHaveLength(2);
    expect(result.steps![1]!.randomCounter).toBe(state.randomCounter + 1);
    expect(result.steps![1]!.own.clicks).toBe(state.corp.clicks - 2);
  });

  it("rejects a foreign actor, ambiguous invocation or invalid current quote", () => {
    const { state, request } = checkpoint();
    const before = hashState(state);
    const probe = (actions: unknown, actor: "corp" | "runner" = "corp") =>
      probeHistoricalEngineState({
        state,
        expectedStateHash: before,
        actor,
        actions,
      });
    expect(
      probe([{ randomizedIceInstallSelection: request }], "runner"),
    ).toMatchObject({
      status: "rejected",
      reason: "engine_selection_wrong_actor",
      rejectedStep: 1,
    });
    expect(
      probe([
        {
          randomizedIceInstallSelection: request,
          actionId: "corp.gain_credit",
        },
      ]),
    ).toMatchObject({
      status: "rejected",
      reason: "invalid_probe_actions",
    });
    for (const invalid of [
      { ...request, stateVersion: request.stateVersion + 1 },
      { ...request, matchId: "foreign-match" },
      {
        ...request,
        candidates: [
          { ...request.candidates[0]!, actionId: "corp.gain_credit" },
          request.candidates[1]!,
        ],
      },
    ]) {
      expect(probe([{ randomizedIceInstallSelection: invalid }])).toMatchObject(
        {
          status: "rejected",
          reason: "engine_selection_quote_rejected",
          rejectedStep: 1,
        },
      );
      expect(hashState(state)).toBe(before);
    }
  });
});
