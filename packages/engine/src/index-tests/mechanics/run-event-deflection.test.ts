import { describe, expect, it } from "vitest";
import type { CardInstanceId, GameState } from "@netgrid/shared";
import {
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  onrV1Game,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  addCorpCardToHqForTest,
  addRezzedCorpIceForTest,
} from "../../test-fixtures/index-test-helpers";

function setup(eventDefinitionId: string, target: "hq" | "rd") {
  const state = toRunnerTurn(
    onrV1Game(`run-event-deflection-${eventDefinitionId}`),
  );
  state.runner.credits = 20;
  state.corp.credits = 20;
  const eventId = `deflection_${eventDefinitionId}` as CardInstanceId;
  state.runner.grip.push(eventId);
  state.cardInstances[eventId] = {
    instanceId: eventId,
    definitionId: eventDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const agendaId = addCorpCardToHqForTest(
    state,
    "onr_classic_003_unlisted-research-lab",
    "remote_agenda",
  );
  state.corp.hq = state.corp.hq.filter((id) => id !== agendaId);
  state.corp.servers.push({
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [agendaId],
  });
  state.cardInstances[agendaId]!.zone = {
    side: "corp",
    zone: "serverRoot",
    serverId: "remote_1",
  };
  addRezzedCorpIceForTest(
    state,
    "onr_classic_014_trapdoor",
    target,
    "deflector",
  );
  return { state, eventId, agendaId };
}

function redirect(
  state: GameState,
  eventId: CardInstanceId,
  target: "hq" | "rd",
) {
  state = apply(
    state,
    "runner",
    (a) =>
      a.type === "play_event" &&
      a.source === eventId &&
      a.payload?.serverId === target,
  );
  expect(state.run?.phase).toBe("encounter_ice");
  state = apply(state, "runner", (a) => a.type === "continue_run");
  expect(state.run).toMatchObject({
    attackedServerId: "remote_1",
    phase: "movement",
  });
  return state;
}

function assertReplay(initial: GameState, state: GameState) {
  expect(validateGameState(state)).toMatchObject({ ok: true });
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(state));
}

describe("fixed-fort run-event benefits after deflection", () => {
  it.each([
    ["onr_v1_084_edited-shipping-manifests", "hq", 1],
    ["onr_v1_105_priority-wreck", "hq", 0],
    ["onr_v1_106_private-ldl-access", "hq", 0],
    ["onr_v1_081_custodial-position", "rd", 2],
    ["onr_v1_118_weather-to-finance-pipe", "hq", 0],
  ] as const)(
    "accesses the actual fort without the %s benefit",
    (definitionId, target, playCost) => {
      const fixture = setup(definitionId, target);
      const initial = structuredClone(fixture.state);
      let state = redirect(fixture.state, fixture.eventId, target);
      expect(state.run?.successfulRunEffectTargetServerId).toBe(target);
      const runnerView = JSON.stringify(getPlayerView(state, "runner"));
      expect(runnerView).not.toContain(fixture.agendaId);
      expect(runnerView).not.toContain("onr_classic_003_unlisted-research-lab");
      state = apply(state, "runner", (a) => a.type === "continue_run");
      expect(state.pendingChoice).toBeUndefined();
      expect(state.run).toMatchObject({
        attackedServerId: "remote_1",
        successful: true,
        accessCount: 1,
        phase: "access",
      });
      expect(state.run?.successfulRunAccessReplacement).toBeUndefined();
      expect(state.run?.accessServerOverride).toBeUndefined();
      expect(state.corp.credits).toBe(20);
      expect(state.runner.credits).toBe(20 - playCost);
      expect(state.runner.tags).toBe(0);
      state = apply(state, "runner", (a) => a.type === "access_card");
      state = apply(state, "runner", (a) => a.type === "steal_agenda");
      expect(state.runner.scoreArea).toContain(fixture.agendaId);
      expect(state.run).toBeUndefined();
      expect(state.runnerTurnFlags?.lastSuccessfulRunServerId).toBe("remote_1");
      assertReplay(initial, state);
    },
  );

  it("keeps a freely chosen run's successful replacement after deflection", () => {
    const fixture = setup("onr_proteus_105_demolition-run", "hq");
    const initial = structuredClone(fixture.state);
    let state = redirect(fixture.state, fixture.eventId, "hq");
    expect(state.run?.successfulRunEffectTargetServerId).toBeUndefined();
    state = apply(state, "runner", (a) => a.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.tags).toBe(3);
    expect(state.runner.credits).toBe(16);
    expect(state.runnerTurnFlags?.lastSuccessfulRunServerId).toBe("remote_1");
    expect(state.runner.scoreArea).not.toContain(fixture.agendaId);
    assertReplay(initial, state);
  });
});
