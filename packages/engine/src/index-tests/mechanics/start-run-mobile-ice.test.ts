import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  getLegalActions,
  applyAction,
  getPlayerView,
  validateGameState,
} from "../../index";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { removeEverywhere } from "../../test-fixtures/mechanic-smoke-fixtures";

function fixture(outer: boolean, rezzedSource = true) {
  const state = createGameAfterSetup({
    seed: "mobile-start-window",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        { id: "onr_v1_039_krash", quantity: 3 },
        { id: "onr_v1_108_score", quantity: 8 },
      ],
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_classic_011_glacier", quantity: 2 },
        { id: "onr_classic_004_theorem-proof", quantity: 3 },
        { id: "onr_classic_014_trapdoor", quantity: 3 },
        { id: "onr_v1_283_audit-of-call-records", quantity: 4 },
        { id: "onr_classic_025_strategic-planning-group", quantity: 2 },
      ],
    },
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.credits = 22;
  state.runner.clicks = 4;
  state.corp.credits = 3;
  const glacier = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_classic_011_glacier",
  )!;
  removeEverywhere(state, glacier.instanceId);
  glacier.zone = { side: "corp", zone: "serverIce", serverId: "remote_1" };
  glacier.rezzed = rezzedSource;
  glacier.faceup = rezzedSource;
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [glacier.instanceId],
    root: [],
  });
  if (outer) {
    const trap = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_classic_014_trapdoor",
    )!;
    removeEverywhere(state, trap.instanceId);
    trap.zone = { side: "corp", zone: "serverIce", serverId: "hq" };
    trap.rezzed = true;
    trap.faceup = true;
    state.corp.servers.find((s) => s.id === "hq")!.ice.push(trap.instanceId);
  }
  return { state, glacier };
}
function execute(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `mobile:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  Object.assign(state, result.state);
  expect(validateGameState(state)).toEqual({ ok: true, errors: [] });
}
function start(state: GameState) {
  execute(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
}
function move(state: GameState) {
  return getLegalActions(state, "corp").find(
    (a) =>
      a.payload?.fortRunWindowAbility ===
        "move_self_to_outermost_position_on_other_fort" &&
      a.payload?.targetServerId === "hq",
  )!;
}

describe("current Engine start-run ICE movement", () => {
  it.each([true, false])(
    "opens priority before access or an already-rezzed first ICE: outer %s",
    (outer) => {
      const { state, glacier } = fixture(outer);
      start(state);
      expect(state.activeSide).toBe("corp");
      expect(state.timingPoint).toBe("run.approach_ice");
      const action = move(state);
      expect(action).toBeDefined();
      execute(state, action);
      expect(state.run?.approachedIceId).toBe(glacier.instanceId);
      expect(state.run?.position).toMatchObject({
        kind: "ice",
        serverId: "hq",
        iceIndex: outer ? 1 : 0,
      });
      expect(state.corp.credits).toBe(2);
      expect(state.corp.servers.find((s) => s.id === "remote_1")!.ice).toEqual(
        [],
      );
      expect(
        getPlayerView(state, "runner")
          .servers.find((s) => s.id === "hq")!
          .ice.at(-1)?.definitionId,
      ).toBe("onr_classic_011_glacier");
    },
  );
  it("reveals an unrezzed source when moving to an initially empty fort", () => {
    const { state, glacier } = fixture(false, false);
    start(state);
    execute(state, move(state));
    expect(state.cardInstances[glacier.instanceId]?.faceup).toBe(true);
    expect(state.cardInstances[glacier.instanceId]?.rezzed).toBe(false);
  });
  it("closes the empty-fort start window without granting a later movement", () => {
    const { state } = fixture(false);
    start(state);
    execute(
      state,
      getLegalActions(state, "corp").find((a) => a.type === "decline_rez")!,
    );
    expect(state.run?.startOfRunIceRepositionOpen).toBeUndefined();
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "corp").some(
        (a) =>
          a.payload?.fortRunWindowAbility ===
          "move_self_to_outermost_position_on_other_fort",
      ),
    ).toBe(false);
  });
  it("does not invent a start action when movement cannot be paid", () => {
    const { state } = fixture(false);
    state.corp.credits = 0;
    start(state);
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "corp").some((a) => a.type === "trigger_ability"),
    ).toBe(false);
  });
  it("closes an empty-fort start window after a root rez consumes the movement budget", () => {
    const { state } = fixture(false);
    state.corp.credits = 2;
    const root = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_classic_025_strategic-planning-group",
    )!;
    removeEverywhere(state, root.instanceId);
    root.zone = { side: "corp", zone: "serverRoot", serverId: "remote_1" };
    state.corp.servers
      .find((s) => s.id === "remote_1")!
      .root.push(root.instanceId);
    start(state);
    execute(
      state,
      getLegalActions(state, "corp").find(
        (a) => a.type === "rez_card" && a.source === root.instanceId,
      )!,
    );
    expect(state.corp.credits).toBe(0);
    expect(root.instanceId).toBeDefined();
    expect(state.run?.startOfRunIceRepositionOpen).toBeUndefined();
    expect(state.activeSide).toBe("runner");
    expect(state.timingPoint).toBe("run.jack_out_window");
  });
});
