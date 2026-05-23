import { describe, expect, it } from "vitest";
import {
  createGameAfterSetup,
  DEMO_DECKS,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  moveCorpCardCopyToHq,
  moveCorpCardToArchives,
  moveCorpCardToHq,
  moveRunnerCardToGrip,
  putCorpIceOnServer,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardInstanceId } from "@netgrid/shared";

describe("PlayerView projection", () => {
  it("does not leak hidden Corp card titles into the Runner view or public events", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "visibility" }));
    moveRunnerCardToGrip(state, "simple_run_event");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToArchives(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpRootInRemote(state, "simple_economy_asset");
    const advancedAgendaId = putCorpRootInRemote(state, "simple_agenda");
    if (!state.cardInstances[advancedAgendaId])
      throw new Error("Missing advanced hidden agenda fixture");
    state.cardInstances[advancedAgendaId].advancementCounters = 5;

    const stateHashBeforeViews = hashState(state);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const serialized = JSON.stringify(runnerView);
    const knownRunnerCard = runnerView.own.gripOrHq.find(
      (card) => card.definitionId === "simple_run_event",
    );

    expect(knownRunnerCard?.rulesText).toBe(
      "Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.",
    );
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Barrier ICE");
    expect(serialized).not.toContain("Simple Economy Asset");
    expect(serialized).not.toContain("Keine zusätzliche Fähigkeit.");
    expect(serialized).not.toContain("End the run.");
    expect(serialized).not.toContain(
      "Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.",
    );
    const runnerHiddenAdvancedRoot = runnerView.servers
      .flatMap((server) => server.root)
      .find((card) => card.advancementCounters === 5);
    expect(runnerHiddenAdvancedRoot).toMatchObject({
      known: false,
      rezzed: false,
      advancementCounters: 5,
      counterDisplays: [
        {
          id: "advancement",
          amount: 5,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "5 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
      ],
    });
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("title");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("definitionId");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("type");
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty(
      "advancementRequirement",
    );
    expect(runnerHiddenAdvancedRoot).not.toHaveProperty("agendaPoints");
    const corpAdvancedRoot = corpView.servers
        .flatMap((server) => server.root)
        .find((card) => card.instanceId === advancedAgendaId);
    expect(corpAdvancedRoot).toMatchObject({
      known: true,
      title: "Simple Agenda",
      advancementCounters: 5,
      advancementRequirement: 3,
      agendaPoints: 2,
      counterDisplays: [
        {
          id: "advancement",
          amount: 5,
          displayKind: "advancement",
          label: "Entwicklung",
          ariaLabel: "5 öffentliche Advancement-Counter",
          usageHint: "score_modifier",
        },
      ],
    });
    expect(hashState(state)).toBe(stateHashBeforeViews);
    expect(runnerView.opponent.handCount).toBe(state.corp.hq.length);
    expect(runnerView.opponent.deckCount).toBe(state.corp.rd.length);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(
      runnerView.servers.some((server) =>
        server.ice.some((card) => !card.known),
      ),
    ).toBe(true);
    expect(JSON.stringify(runnerView.publicEvents)).not.toContain(
      "Simple Agenda",
    );
  });

  it("keeps mixed remote root order accessible without leaking hidden root types before access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "remote-root-hidden-order",
        runnerDeck: DEMO_DECKS.demo_runner_004,
        corpDeck: DEMO_DECKS.demo_corp_004,
      }),
    );
    state.runner.credits = 20;
    const firstUpgradeId = moveCorpCardToHq(state, "simple_upgrade");
    const secondUpgradeId = moveCorpCardCopyToHq(state, "simple_upgrade");
    const rezzedNodeId = moveCorpCardToHq(state, "simple_economy_asset");
    let remote = state.corp.servers.find((server) => server.id === "remote_1");
    if (!remote) {
      remote = {
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      };
      state.corp.servers.push(remote);
    }
    const remoteServer = remote;
    const installRoot = (cardId: CardInstanceId, rezzed: boolean) => {
      removeEverywhere(state, cardId);
      remoteServer.root.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
        faceup: rezzed,
        rezzed,
      };
    };
    installRoot(firstUpgradeId, false);
    installRoot(rezzedNodeId, true);
    installRoot(secondUpgradeId, false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    const runnerRemoteBefore = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(runnerRemoteBefore?.root).toHaveLength(3);
    expect(runnerRemoteBefore?.root[0]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(runnerRemoteBefore?.root[0]).not.toHaveProperty("definitionId");
    expect(runnerRemoteBefore?.root[0]).not.toHaveProperty("type");
    expect(runnerRemoteBefore?.root[1]).toMatchObject({
      known: true,
      definitionId: "simple_economy_asset",
      type: "asset",
      rezzed: true,
    });
    expect(runnerRemoteBefore?.root[2]).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(runnerRemoteBefore?.root[2]).not.toHaveProperty("definitionId");
    expect(runnerRemoteBefore?.root[2]).not.toHaveProperty("type");
    expect(JSON.stringify(getPlayerView(state, "runner").publicEvents)).not.toContain(
      "simple_upgrade",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(state.run?.breach?.queue.map((entry) => entry.cardInstanceId)).toEqual([
      firstUpgradeId,
      rezzedNodeId,
      secondUpgradeId,
    ]);
    expect(JSON.stringify(getPlayerView(state, "runner").publicEvents)).not.toContain(
      "simple_upgrade",
    );

    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");

    expect(state.run).toBeUndefined();
    const accessEvents = state.eventLog
      .slice(replayStart)
      .filter((event) => event.publicPayload.actionType === "access_card");
    expect(
      accessEvents.map((event) => event.publicPayload.cardDefinitionId),
    ).toEqual(["simple_upgrade", "simple_economy_asset", "simple_upgrade"]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(validateGameState(state).ok).toBe(true);
  });

});
