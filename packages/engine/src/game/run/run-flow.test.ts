import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  applyChoice,
  agendaPoints,
  findCard,
  keepOnlyCorpHqCards,
  moveCorpCardToHq,
  moveRunnerCardToGrip,
  putCorpCardOnTopOfRd,
  putCorpIceOnServer,
  removeEverywhere,
  sourceDefinition,
  toRunnerTurn,
  v097RunGame,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { CURRENT_RULES_BASELINE, type GameState } from "@netgrid/shared";

function expectCurrentRulesBaseline(state: Pick<GameState, "baseline">): void {
  expect(state.baseline).toStrictEqual(CURRENT_RULES_BASELINE);
  expect(state.baseline.engineSchemaVersion).toBe(
    CURRENT_RULES_BASELINE.engineSchemaVersion,
  );
}

describe("MVP 0.97 Run, Jack-out, Breach and Multiaccess", () => {
  it("creates V0.97 games with explicit demo decks on the current baseline and keeps default runs on the current baseline", () => {
    const state = createGameAfterSetup({
      seed: "v097-baseline",
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
    });
    const defaultRun = toRunnerTurn(
      createGameAfterSetup({ seed: "v097-current-default-gate" }),
    );

    expectCurrentRulesBaseline(state);
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.97",
    );
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.97");
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v097_deep_dive_event",
      ),
    ).toBe(true);

    expectCurrentRulesBaseline(defaultRun);
    let currentRun = defaultRun;
    currentRun = apply(
      currentRun,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(getLegalActions(currentRun, "runner").map((action) => action.type)).toContain("access_card");
    expect(currentRun.timingPoint).toBe("access.resolve_card");
  });

  it("offers a public jack-out window after passing ICE", () => {
    let state = toRunnerTurn(v097RunGame("v097-jack-out"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_2");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.phase).toBe("movement");
    expect(
      getLegalActions(state, "runner")
        .map((action) => action.type)
        .sort(),
    ).toEqual(["continue_run", "jack_out"]);

    state = apply(state, "runner", (action) => action.type === "jack_out");

    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "jack_out",
    });
  });

  it("breaches R&D with Deep Dive and does not reveal future queued accesses", () => {
    let state = toRunnerTurn(v097RunGame("v097-rd-multiaccess"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v097_deep_dive_event" &&
        action.payload?.serverId === "rd",
    );

    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.run?.breach).toMatchObject({
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Economy Operation",
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.accessedCardId).toBeUndefined();

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
  });

  it("uses seeded HQ multiaccess without replacement and keeps the queue hidden before access", () => {
    let state = toRunnerTurn(v097RunGame("v097-hq-multiaccess"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    const operationId = moveCorpCardToHq(state, "simple_economy_operation");
    const agendaId = moveCorpCardToHq(state, "simple_agenda");
    keepOnlyCorpHqCards(state, [operationId, agendaId]);
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v097_deep_dive_event" &&
        action.payload?.serverId === "hq",
    );

    const queueIds =
      state.run?.breach?.queue.map((entry) => entry.cardInstanceId) ?? [];
    expect(queueIds).toHaveLength(2);
    expect(new Set(queueIds)).toEqual(new Set([operationId, agendaId]));
    expect(
      state.randomDrawRecords
        .slice(randomBefore)
        .map((record) => record.purpose),
    ).toEqual([
      `${state.run?.runId}:selection:0`.replace(/^/, "hq_multiaccess:"),
      `${state.run?.runId}:selection:1`.replace(/^/, "hq_multiaccess:"),
    ]);

    const runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Agenda");
    expect(JSON.stringify(runnerView)).not.toContain(
      "Simple Economy Operation",
    );
    expect(runnerView.run?.breach?.remainingCount).toBe(2);
  });

  it("includes HQ root upgrades with the random HQ hand access without leaking unaccessed HQ cards", () => {
    let state = toRunnerTurn(v097RunGame("v097-hq-root-upgrade-access"));
    state.runner.credits = 10;
    const operationId = moveCorpCardToHq(state, "simple_economy_operation");
    const agendaId = moveCorpCardToHq(state, "simple_agenda");
    keepOnlyCorpHqCards(state, [operationId, agendaId]);
    const upgradeId = findCard(state, "simple_upgrade");
    const hqServer = state.corp.servers.find((server) => server.id === "hq");
    if (!hqServer) throw new Error("Missing HQ server.");
    removeEverywhere(state, upgradeId);
    hqServer.root.push(upgradeId);
    state.cardInstances[upgradeId] = {
      ...state.cardInstances[upgradeId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "hq" },
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );

    const queue = state.run?.breach?.queue ?? [];
    expect(queue).toHaveLength(2);
    expect(queue[0]?.cardInstanceId).toBe(upgradeId);
    expect(queue.map((entry) => entry.zone)).toEqual(["remote_root", "hq"]);
    const accessedHqId = queue.find((entry) => entry.zone === "hq")?.cardInstanceId;
    const unaccessedHqId = [operationId, agendaId].find(
      (cardId) => cardId !== accessedHqId,
    );
    if (!accessedHqId || !unaccessedHqId)
      throw new Error("Missing HQ access selection.");
    const accessedHqDefinition =
      state.cardInstances[accessedHqId]?.definitionId;
    const unaccessedHqTitle = DEMO_CARDS_BY_ID[
      state.cardInstances[unaccessedHqId]?.definitionId ?? ""
    ]?.title;
    expect(unaccessedHqTitle).toBeDefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      unaccessedHqTitle,
    );

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_upgrade",
      serverLabel: "HQ",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      unaccessedHqTitle,
    );
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    expect(state.corp.archives).toContain(upgradeId);
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.accessedCardId).toBeUndefined();

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: accessedHqDefinition,
      serverLabel: "HQ",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      unaccessedHqTitle,
    );
    if (accessedHqDefinition === "simple_agenda") {
      state = apply(state, "runner", (action) => action.type === "steal_agenda");
    }
    expect(state.run).toBeUndefined();
    const accessEvents = state.eventLog
      .slice(replayStart)
      .filter((event) => event.publicPayload.actionType === "access_card");
    expect(
      accessEvents.map((event) => event.publicPayload.cardDefinitionId),
    ).toEqual(["simple_upgrade", accessedHqDefinition]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(validateGameState(state).ok).toBe(true);
  });

  it("does not expose post-V0.97 mechanics while enabling Breach and Multiaccess", () => {
    const state = toRunnerTurn(v097RunGame("v097-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).toContain(
      "multiaccess",
    );
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain(
      "prevention",
    );
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain(
      "replacement",
    );
  });
});
