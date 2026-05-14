import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  eventVisibilityForAction,
  getLegalActions,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  replayEvents,
  validateDeckDefinition,
  validateGameState,
} from "./index";
import {
  MVP_0_99_BASELINE,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";

describe("MVP 0.1 engine foundation", () => {
  it("creates deterministic games for the same seed", () => {
    const first = createGameAfterSetup({ seed: "deterministic" });
    const second = createGameAfterSetup({ seed: "deterministic" });

    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);
  });

  it("shuffles sorted Corp agenda blocks without preserving the editor order bias", () => {
    const corpMasterDeck: DeckDefinition = {
      id: "local_corp_master_shuffle_regression",
      name: "The Korp Master Shuffle Regression",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_193_corporate-coup", quantity: 1 },
        { id: "onr_v1_201_executive-extraction", quantity: 1 },
        { id: "onr_v1_207_netwatch-operations-office", quantity: 1 },
        { id: "onr_v1_208_on-call-solo-team", quantity: 1 },
        { id: "onr_v1_209_political-coup", quantity: 1 },
        { id: "onr_v1_211_polymer-breakthrough", quantity: 1 },
        { id: "onr_v1_212_priority-requisition", quantity: 1 },
        { id: "onr_v1_213_private-cybernet-police", quantity: 1 },
        { id: "onr_v1_214_project-babylon", quantity: 1 },
        { id: "onr_v1_215_security-net-optimization", quantity: 1 },
        { id: "onr_v1_217_strike-force-kali", quantity: 1 },
        { id: "onr_v1_219_superior-net-barriers", quantity: 1 },
        { id: "onr_v1_245_fire-wall", quantity: 1 },
        { id: "onr_v1_259_in-the-face", quantity: 1 },
        { id: "onr_v1_263_reinforced-wall", quantity: 1 },
        { id: "onr_v1_265_rock-is-strong", quantity: 1 },
        { id: "onr_v1_268_shock-r", quantity: 2 },
        { id: "onr_v1_270_sleeper", quantity: 2 },
        { id: "onr_v1_273_triggerman", quantity: 1 },
        { id: "onr_v1_275_vacuum-link", quantity: 1 },
        { id: "onr_v1_278_wall-of-ice", quantity: 1 },
        { id: "onr_v1_279_wall-of-static", quantity: 2 },
        { id: "onr_v1_281_accounts-receivable", quantity: 2 },
        { id: "onr_v1_282_annual-reviews", quantity: 2 },
        { id: "onr_v1_288_day-shift", quantity: 1 },
        { id: "onr_v1_290_efficiency-experts", quantity: 3 },
        { id: "onr_v1_295_night-shift", quantity: 2 },
        { id: "onr_v1_297_overtime-incentives", quantity: 2 },
        { id: "onr_v1_308_acme-savings-and-loan", quantity: 1 },
        { id: "onr_v1_317_data-masons", quantity: 1 },
        { id: "onr_v1_320_encoder-inc", quantity: 1 },
        { id: "onr_v1_341_skalderviken-sa-beta-test-site", quantity: 1 },
        { id: "onr_v1_350_antiquated-interface-routines", quantity: 2 },
        { id: "onr_v1_371_tokyo-chiba-infighting", quantity: 2 },
      ],
    };
    const agendaCardsInDeck = corpMasterDeck.cards.reduce(
      (sum, entry) =>
        sum +
        (DEMO_CARDS_BY_ID[entry.id]?.type === "agenda" ? entry.quantity : 0),
      0,
    );
    expect(agendaCardsInDeck).toBe(12);

    let agendaCardsInOpeningHands = 0;
    let fourPlusAgendaHands = 0;
    for (let seedIndex = 0; seedIndex < 1000; seedIndex += 1) {
      const state = createGameAfterSetup({
        seed: `shuffle-corp-master-${seedIndex}`,
        corpDeck: corpMasterDeck,
        agendaPointsToWin: 7,
      });
      const agendasInHand = state.corp.hq.filter(
        (id) =>
          DEMO_CARDS_BY_ID[state.cardInstances[id]!.definitionId]?.type ===
          "agenda",
      ).length;
      agendaCardsInOpeningHands += agendasInHand;
      if (agendasInHand >= 4) fourPlusAgendaHands += 1;
    }

    expect(agendaCardsInOpeningHands / 1000).toBeGreaterThan(0.9);
    expect(agendaCardsInOpeningHands / 1000).toBeLessThan(1.55);
    expect(fourPlusAgendaHands).toBeLessThan(25);
  });

  it("starts in explicit setup with side-safe private mulligan choices", () => {
    const state = createGame({ seed: "v110-explicit-setup" });

    expect(state.phase).toBe("setup");
    expect(state.timingPoint).toBe("setup.mulligan.runner");
    expect(state.setup).toMatchObject({
      status: "mulligan_runner",
      initialHandSize: 5,
    });
    expect(state.agendaPointsToWin).toBe(7);
    expect(getLegalActions(state, "runner")).toHaveLength(1);
    expect(getLegalActions(state, "runner")[0]?.type).toBe("resolve_choice");
    expect(getLegalActions(state, "corp")).toHaveLength(0);
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(["keep", "mulligan"]);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").agendaPointsToWin).toBe(7);
    expect(getPlayerView(state, "runner").own.identity.known).toBe(true);
    expect(getPlayerView(state, "runner").opponent.identity.known).toBe(true);
  });

  it("resolves runner and corp keep decisions into the first mandatory draw", () => {
    let state = createGame({ seed: "v110-setup-keep" });
    state = applyChoice(state, "runner", "keep");

    expect(state.phase).toBe("setup");
    expect(state.timingPoint).toBe("setup.mulligan.corp");
    expect(state.setup?.resolved.runner).toBe("keep");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(["keep", "mulligan"]);

    state = applyChoice(state, "corp", "keep");
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.setup).toMatchObject({
      status: "complete",
      resolved: { runner: "keep", corp: "keep" },
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "mandatory_draw",
      ),
    ).toBe(true);
  });

  it("mulligans deterministically without public hidden-info leaks", () => {
    let state = createGame({ seed: "v110-runner-mulligan" });
    const initialGrip = state.runner.grip.slice();
    state = applyChoice(state, "runner", "mulligan");

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.grip).not.toEqual(initialGrip);
    expect(state.setup?.resolved.runner).toBe("mulligan");
    expect(state.setup?.mulligansTaken.runner).toBe(1);
    expect(
      state.randomDrawRecords.some(
        (record) => record.purpose === "setup.shuffle.runner.mulligan",
      ),
    ).toBe(true);
    expect(
      state.randomDrawRecords.some(
        (record) => record.purpose === "setup.draw.runner.mulligan_hand",
      ),
    ).toBe(true);
    expect(
      JSON.stringify(state.eventLog.map((event) => event.publicPayload)),
    ).not.toContain("runner_simple_");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");

    const replay = replayEvents(
      createGame({ seed: "v110-runner-mulligan" }),
      state.eventLog,
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rejects stale and wrong-side player actions", () => {
    let state = createGameAfterSetup({ seed: "validation" });
    const mandatory = mustAction(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.timingPoint).toBe("corp_action.main");
  });
});

describe("MVP 0.1 turns and cards", () => {
  it("plays the Runner economy event and installs all MVP breakers", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "runner-cards" }));
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "simple_economy_event");
    moveRunnerCardToGrip(state, "simple_fracter");
    moveRunnerCardToGrip(state, "simple_decoder");
    moveRunnerCardToGrip(state, "simple_killer");

    const beforeCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "simple_economy_event",
    );
    expect(state.runner.credits).toBe(beforeCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "simple_fracter",
      title: "Simple Fracter",
    });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_decoder",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );

    expect(state.runner.memoryUsed).toBe(3);
    expect(
      state.runner.rig.programs
        .map((id) => state.cardInstances[id]?.definitionId)
        .sort(),
    ).toEqual(["simple_decoder", "simple_fracter", "simple_killer"]);
  });

  it("plays Corp economy operation", () => {
    let state = createGameAfterSetup({ seed: "corp-operation" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_economy_operation");
    const before = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "simple_economy_operation",
    );
    expect(state.corp.credits).toBe(before + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      actionCostClicks: 1,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 1,
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    const archivedOperation = state.corp.archives.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "simple_economy_operation",
    );
    expect(archivedOperation).toBeDefined();
    expect(state.cardInstances[archivedOperation!]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
  });

  it("lets the Corp create a new remote by installing ICE", () => {
    let state = createGameAfterSetup({ seed: "corp-ice-new-remote" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");

    const install = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "ice",
    );
    expect(install.label).toBe("ICE vor neuem Remote installieren");

    state = apply(
      state,
      "corp",
      (action) => action.actionId === install.actionId,
    );
    const remote = state.corp.servers.find(
      (server) => server.kind === "remote" && server.ice.includes(iceId),
    );

    expect(remote).toBeDefined();
    expect(remote?.root).toEqual([]);
    expect(state.cardInstances[iceId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverIce",
      serverId: remote?.id,
    });
  });

  it("applies escalating base install costs for the 2nd and 3rd ICE on the same server", () => {
    let state = createGameAfterSetup({ seed: "corp-ice-scaling-cost" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;

    const firstIceId = moveCorpCardToHq(state, "simple_barrier_ice");
    const secondIceId = moveCorpCardToHq(state, "simple_sentry_ice");
    const thirdIceEntry = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        card.definitionId === "simple_barrier_ice" &&
        id !== firstIceId &&
        id !== secondIceId,
    );
    expect(thirdIceEntry).toBeDefined();
    if (!thirdIceEntry) throw new Error("Missing third ICE copy");
    const thirdIceId = thirdIceEntry[0] as CardInstanceId;
    removeEverywhere(state, thirdIceId);
    state.corp.hq.unshift(thirdIceId);
    state.cardInstances[thirdIceId] = {
      ...state.cardInstances[thirdIceId]!,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };

    const firstRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === firstIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(firstRdInstall.costs[0]?.credits).toBeUndefined();
    state = apply(
      state,
      "corp",
      (action) => action.actionId === firstRdInstall.actionId,
    );

    const secondRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === secondIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(secondRdInstall.costs[0]?.credits).toBe(1);
    expect(secondRdInstall.payload?.iceInstallBaseCost).toBe(1);
    expect(secondRdInstall.payload?.iceInstallAdditionalCost).toBe(0);
    expect(secondRdInstall.payload?.iceInstallTotalCost).toBe(1);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === secondRdInstall.actionId,
    );

    const thirdRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === thirdIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(thirdRdInstall.costs[0]?.credits).toBe(2);
    expect(thirdRdInstall.payload?.iceInstallBaseCost).toBe(2);
    expect(thirdRdInstall.payload?.iceInstallAdditionalCost).toBe(0);
    expect(thirdRdInstall.payload?.iceInstallTotalCost).toBe(2);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === thirdRdInstall.actionId,
    );

    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer?.ice).toHaveLength(3);
    expect(state.corp.credits).toBe(17);
  });
});

describe("MVP 0.1 runs, access and scoring", () => {
  it("lets the Runner steal the top R&D agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "steal-rd" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
      serverLabel: "R&D",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(
      JSON.stringify(
        getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
      ),
    ).toContain("Simple Agenda");
    expect(
      JSON.stringify(
        getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
      ),
    ).not.toContain("Simple Agenda");
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
    expect(
      getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload
        .actionType,
    ).toBe("steal_agenda");
  });

  it("reveals the randomly accessed HQ card in the access event", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "access-hq" }));
    const accessedId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "HQ",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "HQ",
    });
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload
        .redactedKind,
    ).toBeUndefined();
  });

  it("shows a card trashed from HQ in Runner-visible Archives", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "trash-hq-asset" }));
    state.runner.credits = 10;
    const accessedId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    const runnerView = getPlayerView(state, "runner");
    const archives = runnerView.servers.find(
      (server) => server.id === "archives",
    );
    expect(state.corp.archives).toContain(accessedId);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(archives?.root.map((card) => card.definitionId)).toContain(
      "simple_economy_asset",
    );
    expect(
      archives?.root.find(
        (card) => card.definitionId === "simple_economy_asset",
      )?.title,
    ).toBe("Simple Economy Asset");
  });

  it("does not offer a card access when a successful remote run finds an empty root", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "empty-remote-access" }),
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const randomDrawsBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");

    const accessActions = getLegalActions(state, "runner");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(accessActions.some((action) => action.type === "access_card")).toBe(
      false,
    );
    expect(
      accessActions.find((action) => action.type === "continue_run")?.label,
    ).toBe("Zugriff abschließen");
    expect(state.randomDrawRecords).toHaveLength(randomDrawsBefore);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "cardDefinitionId",
    );
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("title");
  });

  it("still offers card access for a remote with a root card", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "non-empty-remote-access" }),
    );
    putCorpRootInRemote(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
      serverLabel: "Remote 1",
    });
  });

  it("lets the Runner break Barrier ICE and access R&D", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "break-barrier",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "efficient_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
      cardDefinitionId: "efficient_fracter",
      title: "Efficient Fracter",
    });
    state = apply(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "efficient_fracter",
      title: "Efficient Fracter",
    });
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "R&D",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
  });

  it("ends the run on an unbroken End the Run subroutine", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "etr" }));
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    expect(agendaPoints(state, "runner")).toBe(0);
    expect(
      state.corp.rd.map((id) => state.cardInstances[id]?.definitionId),
    ).toContain("simple_agenda");
  });

  it("skips the Corp rez window when a later run approaches already rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "rezzed-ice-repeat-run" }),
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "corp").map((action) => action.type),
    ).not.toContain("decline_rez");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toContain("continue_run");
  });

  it("lets the Corp score the third Simple Agenda and win at six agenda points", () => {
    let state = createGameAfterSetup({
      seed: "corp-score",
      agendaPointsToWin: 6,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 4;
    scoreTwoAgendasForTest(state);
    moveCorpCardToHq(state, "simple_agenda");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_agenda",
    );
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "score_agenda");

    expect(state.winner).toBe("corp");
    expect(agendaPoints(state, "corp")).toBe(6);
  });
});

describe("MVP 0.1 visibility, replay and state hash", () => {
  it("does not leak hidden Corp card titles into the Runner view or public events", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "visibility" }));
    moveRunnerCardToGrip(state, "simple_run_event");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToArchives(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpRootInRemote(state, "simple_economy_asset");

    const runnerView = getPlayerView(state, "runner");
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

  it("replays actions and reproduces the final StateHash", () => {
    let state = createGameAfterSetup({ seed: "replay" });
    const initial = structuredClone(state);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "gain_credit");
    state = toRunnerTurnFromCorpMain(state);
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    state = apply(state, "runner", (action) => action.type === "gain_credit");

    const replay = replayEvents(initial, state.eventLog);
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("MVP 0.94 Damage and Flatline", () => {
  it("resolves net damage from a local sentry as hidden-info barrier without public grip leaks", () => {
    let state = toRunnerTurn(v094DamageGame("v094-net-damage"));
    const beforeGripIds = state.runner.grip.slice();
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
    state.corp.credits = 10;

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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const event = state.eventLog.at(-1);
    expect(event?.visibilityClass).toBe("hidden_info_barrier");
    expect(event ? isHiddenInfoBarrierEvent(event) : false).toBe(true);
    expect(event?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageResolved: true,
      damageType: "net",
      damageAmount: 1,
      cardsTrashed: 1,
      flatline: false,
    });
    expect(JSON.stringify(event?.publicPayload)).not.toContain("runner_");
    expect(state.runner.grip.length).toBe(beforeGripIds.length - 1);
    expect(state.runner.heap.length).toBe(1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toContain("damage:");
    expect(new Set([...state.runner.grip, ...state.runner.heap]).size).toBe(
      beforeGripIds.length,
    );

    const corpView = getPlayerView(state, "corp");
    const serializedCorpView = JSON.stringify(corpView);
    for (const cardId of beforeGripIds) {
      const title =
        DEMO_CARDS_BY_ID[state.cardInstances[cardId]?.definitionId ?? ""]
          ?.title;
      if (title) expect(serializedCorpView).not.toContain(title);
    }
    expect(corpView.opponent.discardCount).toBe(1);
  });

  it("flatlines the Runner without randomly revealing grip cards when damage exceeds grip size", () => {
    let state = toRunnerTurn(v094DamageGame("v094-flatline"));
    emptyRunnerGripForTest(state);
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
    state.corp.credits = 10;
    const randomBefore = state.randomDrawRecords.length;

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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.run).toBeUndefined();
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      flatline: true,
      cardsTrashed: 0,
      gameEndReason: "flatline",
    });
    expect(getPlayerView(state, "runner").gameEndReason).toBe("flatline");
  });

  it("supports meat and core damage through the EffectCommand path", () => {
    const state = v094DamageGame("v094-meat-effect");
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [
      {
        type: "do_damage",
        damageType: "meat",
        amount: 2,
        source: "v094_test_meat",
      },
    ]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.heap.length).toBe(2);
    expect(next.runner.grip.length).toBe(state.runner.grip.length - 2);
    expect(
      next.randomDrawRecords
        .slice(-2)
        .every((record) => record.purpose.includes("damage:")),
    ).toBe(true);
    expect(new Set(next.runner.heap).size).toBe(2);

    const core = applyEffectCommands(state, [
      {
        type: "do_damage",
        damageType: "core",
        amount: 2,
        source: "v111_test_core",
      },
    ]);
    expect(core.runner.heap.length).toBe(2);
    expect(core.runner.coreDamage).toBe(2);
    expect(getPlayerView(core, "runner").own.maxHandSize).toBe(3);
    expect(getPlayerView(core, "corp").opponent.coreDamage).toBe(2);
    expect(
      core.randomDrawRecords
        .slice(-2)
        .every((record) => record.purpose.includes(":core:")),
    ).toBe(true);

    let operationState = createGameAfterSetup({
      seed: "v111-core-operation",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    moveCorpCardToHq(operationState, "v111_core_damage_operation");
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) ===
          "v111_core_damage_operation",
    );
    expect(operationState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "core",
      damageAmount: 1,
      cardsTrashed: 1,
      coreDamageAfter: 1,
      runnerMaxHandSizeAfter: 4,
    });
  });

  it("runs V1.1.1 Discard phases through private LegalActions", () => {
    let state = createGameAfterSetup({ seed: "v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.hq.length).toBe(6);

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.phase).toBe("corp_discard_phase");
    expect(state.timingPoint).toBe("corp_discard.select_cards");
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "discard_phase",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(6);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    const discarded = String(state.pendingChoice?.options[0]?.value);
    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );
    expect(state.phase).toBe("runner_action_phase");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.corp.hq).not.toContain(discarded);
    expect(state.corp.archives).toContain(discarded);
    expect(state.cardInstances[discarded]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      discardResolved: true,
      discardSide: "corp",
      discardCount: 1,
      discardZone: "archives",
    });
    expect(
      JSON.stringify(getPlayerView(state, "runner").publicEvents.at(-1)),
    ).not.toContain(String(state.cardInstances[discarded]?.definitionId));
  });

  it("revalidates Runner Discard choices and moves selected cards to the heap", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v111-runner-discard" }),
    );
    drawRunnerCardsForTest(state, 2);
    expect(state.runner.grip.length).toBe(7);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "discard_phase",
      minSelections: 2,
      maxSelections: 2,
    });

    const action = mustAction(
      state,
      "runner",
      (candidate) => candidate.type === "resolve_choice",
    );
    const oneOption = state.pendingChoice?.options[0]?.id;
    const wrongCount = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [oneOption],
      },
    });
    expect(wrongCount.ok).toBe(false);
    if (wrongCount.ok) throw new Error("Expected invalid choice");
    expect(wrongCount.error.code).toBe("ERR_INVALID_CHOICE");

    const selectedOptionIds =
      state.pendingChoice?.options.slice(0, 2).map((option) => option.id) ?? [];
    const selectedCardIds =
      state.pendingChoice?.options
        .slice(0, 2)
        .map((option) => String(option.value)) ?? [];
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.runner.grip.length).toBe(5);
    expect(selectedCardIds.every((id) => state.runner.heap.includes(id))).toBe(
      true,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      discardResolved: true,
      discardSide: "runner",
      discardCount: 2,
      discardZone: "heap",
    });
  });

  it("flatlines at the start of the Runner discard step when core damage makes handlimit negative", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v111-negative-handlimit" }),
    );
    state.runner.coreDamage = 6;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.pendingChoice).toBeUndefined();
  });

  it("replays damage and reproduces the final StateHash", () => {
    let state = toRunnerTurn(v094DamageGame("v094-replay"));
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
    state.corp.credits = 10;
    const initial = structuredClone(state);

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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not expose later mechanics while enabling Damage", () => {
    const state = toRunnerTurn(v094DamageGame("v094-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(actionTypes).not.toContain("remove_tag");
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "trace",
    );
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "resource",
    );
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "prevention",
    );
  });
});

describe("O:NR v1 Limited local private test access", () => {
  it("validates the secured O:NR harness decks against the current card registry", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = onrV1Game("onr-v1-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.94",
    );
  });

  it("plays O:NR runner draw and economy events, installs memory hardware and simple breakers", () => {
    let state = toRunnerTurn(onrV1Game("onr-v1-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 20;
    moveRunnerCardToGrip(state, "onr_v1_079_bodyweight-synthetic-blood");
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    moveRunnerCardToGrip(state, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(state, "onr_v1_108_score");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    moveRunnerCardToGrip(state, "onr_v1_040_loony-goon");
    moveRunnerCardToGrip(state, "onr_v1_073_wizards-book");

    const beforeBodyweightGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_079_bodyweight-synthetic-blood",
    );
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_095_jack-n-joe",
    );
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_097_livewires-contacts",
    );
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_108_score",
    );
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip",
    );
    expect(state.runner.memoryLimit).toBe(5);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_014_codecracker",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_040_loony-goon",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_073_wizards-book",
    );

    expect(state.runner.memoryUsed).toBe(4);
    expect(
      state.runner.rig.programs
        .map((id) => state.cardInstances[id]?.definitionId)
        .sort(),
    ).toEqual([
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_040_loony-goon",
      "onr_v1_073_wizards-book",
    ]);
  });

  it("resolves O:NR code gates, sentries and multi-damage ICE through existing run rules", () => {
    let codeGateState = toRunnerTurn(onrV1Game("onr-v1-code-gate"));
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "onr_v1_220_tycho-extension");
    codeGateState.corp.credits = 20;

    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    codeGateState = apply(
      codeGateState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(codeGateState, action) === "onr_v1_261_quandary",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    expect(
      getLegalActions(codeGateState, "runner").find(
        (action) => action.type === "continue_run",
      )?.label,
    ).toBe("ICE passieren");
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "continue_run",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_220_tycho-extension",
    });

    let sentryState = toRunnerTurn(onrV1Game("onr-v1-sentry"));
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "onr_v1_220_tycho-extension");
    sentryState.corp.credits = 20;

    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryState = apply(
      sentryState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryState, action) === "onr_v1_259_in-the-face",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "continue_run",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_220_tycho-extension",
    });

    let wallState = toRunnerTurn(onrV1Game("onr-v1-wall-of-ice"));
    putCorpIceOnServer(wallState, "rd", "onr_v1_278_wall-of-ice");
    wallState.corp.credits = 20;
    const beforeGrip = wallState.runner.grip.length;

    wallState = apply(
      wallState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    wallState = apply(
      wallState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(wallState, action) === "onr_v1_278_wall-of-ice",
    );
    const continueIntoWall = getLegalActions(wallState, "runner").find(
      (action) => action.type === "continue_run",
    );
    expect(continueIntoWall).toMatchObject({
      label: "Subroutinen auslösen (Run endet)",
      payload: {
        encounterContinue: true,
        unbrokenSubroutineCount: 4,
        encounterWillEndRun: true,
      },
    });
    wallState = apply(
      wallState,
      "runner",
      (action) => action.type === "continue_run",
    );

    expect(wallState.run).toBeUndefined();
    expect(wallState.runner.grip.length).toBe(beforeGrip - 4);
    expect(wallState.runner.heap.length).toBe(4);
    expect(wallState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageResolved: true,
      damageType: "net",
      damageAmount: 4,
      cardsTrashed: 4,
      flatline: false,
    });
  });

  it("plays O:NR tagged operations, meat damage operations and Tycho Extension scoring", () => {
    let state = createGameAfterSetup({
      seed: "onr-v1-corp-operations",
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: ONR_V1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.runner.tags = 1;
    state.runner.credits = 9;
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");
    moveCorpCardToHq(state, "onr_v1_290_efficiency-experts");
    moveCorpCardToHq(state, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(state, "onr_v1_295_night-shift");
    moveCorpCardToHq(state, "onr_v1_285_closed-accounts");
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");

    const beforeAccounts = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_281_accounts-receivable",
    );
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeDayShiftHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_290_efficiency-experts",
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeVoucherTags = state.runner.tags;
    const beforeVoucherCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_293_netwatch-credit-voucher",
    );
    expect(state.runner.tags).toBe(beforeVoucherTags + 1);
    expect(state.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftHq = state.corp.hq.length;
    const beforeNightShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_295_night-shift",
    );
    expect(state.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(state.corp.hq.length).toBe(beforeNightShiftHq);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech",
    );
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_285_closed-accounts",
    );
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5],
    ] as const) {
      let damageState = createGameAfterSetup({
        seed: `onr-v1-${definitionId}`,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      });
      damageState = apply(
        damageState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(
        damageState,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(damageState, action) === definitionId,
      );
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false,
      });
      expect(
        JSON.stringify(damageState.eventLog.at(-1)?.publicPayload),
      ).not.toContain("runner_");
    }

    let scoringState = createGameAfterSetup({
      seed: "onr-v1-tycho-score",
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: ONR_V1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    scoringState = apply(
      scoringState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    scoringState.corp.credits = 20;
    scoringState.corp.clicks = 10;
    moveCorpCardToHq(scoringState, "onr_v1_220_tycho-extension");

    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    expect(agendaPoints(scoringState, "corp")).toBe(4);
  });

  it("keeps repaired O:NR simple wall mappings playable", () => {
    for (const definitionId of [
      "onr_v1_237_data-wall",
      "onr_v1_238_data-wall-2-0",
      "onr_v1_265_rock-is-strong",
    ] as const) {
      let state = toRunnerTurn(onrV1Game(`onr-v1-repaired-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      putCorpCardOnTopOfRd(state, "onr_v1_220_tycho-extension");
      state.corp.credits = 20;

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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.run).toBeUndefined();
      expect(agendaPoints(state, "runner")).toBe(0);
      expect(
        state.corp.rd.map((id) => state.cardInstances[id]?.definitionId),
      ).toContain("onr_v1_220_tycho-extension");
    }
  });
});

describe("V1.0.5K Card Release", () => {
  it("keeps the final V1.0.5K card list small and backed by concrete definitions", () => {
    expect(ONR_V1_0_5K_FINAL_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_5K_FINAL_CARD_IDS.length).toBeLessThanOrEqual(20);
    for (const definitionId of ONR_V1_0_5K_FINAL_CARD_IDS) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_237_data-wall"]).toMatchObject({
      rezCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_238_data-wall-2-0"]).toMatchObject({
      rezCost: 2,
      strength: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_239_endless-corridor"]).toMatchObject({
      rezCost: 4,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_144_tycho-mem-chip"]).toMatchObject({
      installCost: 5,
      memoryLimitBonus: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_146_zetatech-mem-chip"]).toMatchObject({
      installCost: 3,
      memoryLimitBonus: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_203_hostile-takeover"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
  });

  it("validates the V1.0.5K smoke decks and starts on the O:NR rules baseline", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_5K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_0_5K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v105kCardReleaseGame("v105k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.94",
    );
  });

  it("installs V1.0.5K memory chips with their printed MU bonuses and gates program installs by memory", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-memory-chips"));
    state.runner.credits = 40;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_144_tycho-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_146_zetatech-mem-chip");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_144_tycho-mem-chip",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_146_zetatech-mem-chip",
    );

    expect(state.runner.memoryLimit).toBe(9);
    const runnerView = getPlayerView(state, "runner");
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_144_tycho-mem-chip",
      )?.memoryLimitBonus,
    ).toBe(3);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_146_zetatech-mem-chip",
      )?.memoryLimitBonus,
    ).toBe(2);

    let gatedState = toRunnerTurn(v105kCardReleaseGame("v105k-memory-gate"));
    gatedState.runner.credits = 40;
    gatedState.runner.clicks = 10;
    installRunnerProgramForTest(gatedState, "onr_v1_015_codeslinger");
    installRunnerProgramForTest(gatedState, "onr_v1_052_raffles");
    installRunnerProgramForTest(gatedState, "onr_v1_054_raptor");
    installRunnerProgramForTest(gatedState, "onr_v1_070_tinweasel");
    moveRunnerCardCopyToGrip(gatedState, "onr_v1_015_codeslinger");

    expect(gatedState.runner.memoryUsed).toBe(4);
    expect(
      getLegalActions(gatedState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger",
      ),
    ).toBe(false);

    moveRunnerCardToGrip(gatedState, "onr_v1_144_tycho-mem-chip");
    gatedState = apply(
      gatedState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(gatedState, action) === "onr_v1_144_tycho-mem-chip",
    );
    expect(
      getLegalActions(gatedState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger",
      ),
    ).toBe(true);
  });

  it("breaks matching V1.0.5K ICE subroutines and rejects mismatched breaker targets", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-raffles-endless"));
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_052_raffles");
    putCorpIceOnServer(state, "rd", "onr_v1_239_endless-corridor");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 20;

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
        sourceDefinition(state, action) === "onr_v1_239_endless-corridor",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_052_raffles" &&
        action.payload?.subroutineIndex === 0,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_052_raffles" &&
        action.payload?.subroutineIndex === 1,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });

    for (const [breakerId, iceId] of [
      ["onr_v1_015_codeslinger", "onr_v1_237_data-wall"],
      ["onr_v1_070_tinweasel", "onr_v1_232_crystal-wall"],
    ] as const) {
      let mismatch = toRunnerTurn(
        v105kCardReleaseGame(`v105k-mismatch-${breakerId}`),
      );
      mismatch.runner.credits = 20;
      installRunnerProgramForTest(mismatch, breakerId);
      putCorpIceOnServer(mismatch, "rd", iceId);
      mismatch.corp.credits = 20;

      mismatch = apply(
        mismatch,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      mismatch = apply(
        mismatch,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(mismatch, action) === iceId,
      );

      expect(
        getLegalActions(mismatch, "runner").some(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(mismatch, action) === breakerId,
        ),
      ).toBe(false);
    }
  });

  it("scores Hostile Takeover with its narrow on-score credit resolver and deterministic replay", () => {
    let state = createGameAfterSetup({
      seed: "v105k-hostile-takeover",
      runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
      corpDeck: ONR_V1_0_5K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    const initial = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    const beforeScoreCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );

    expect(state.corp.credits).toBe(beforeScoreCredits + 5);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      onScoreGainCredits: 5,
      corpCreditsAfter: state.corp.credits,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "corp_",
    );

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not offer a second agenda or asset into an occupied remote root", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_0_5K_CORP_DECK,
      id: "v105k_remote_root_limit_corp",
      cards: [
        ...ONR_V1_0_5K_CORP_DECK.cards,
        { id: "simple_economy_asset", quantity: 1 },
        { id: "simple_upgrade", quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "v105k-remote-root-limit",
      runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToHq(state, "simple_economy_asset");
    moveCorpCardToHq(state, "simple_upgrade");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover" &&
        action.payload?.serverId === "new_remote",
    );
    const actions = getLegalActions(state, "corp");

    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_agenda" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_economy_asset" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_upgrade" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(true);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_agenda" &&
          action.payload?.serverId === "new_remote",
      ),
    ).toBe(true);
  });

  it("keeps V1.0.5K ICE hidden in Runner views until rez", () => {
    let state = toRunnerTurn(
      v105kCardReleaseGame("v105k-visibility-data-wall-2"),
    );
    putCorpIceOnServer(state, "rd", "onr_v1_238_data-wall-2-0");
    state.corp.credits = 20;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Data Wall 2.0",
    );

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
        sourceDefinition(state, action) === "onr_v1_238_data-wall-2-0",
    );

    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Data Wall 2.0",
    );
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      cardDefinitionId: "onr_v1_238_data-wall-2-0",
      title: "Data Wall 2.0",
    });
  });
});

describe("V1.0.6K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_0_6K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_0_6K_FINAL_CARD_IDS) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_072_wild-card"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_145_wutech-mem-chip"]).toMatchObject({
      installCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_220_tycho-extension"]).toMatchObject({
      advancementRequirement: 4,
      agendaPoints: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_244_filter"]).toMatchObject({
      rezCost: 0,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_245_fire-wall"]).toMatchObject({
      rezCost: 5,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_252_keeper"]).toMatchObject({
      rezCost: 4,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_256_mazer"]).toMatchObject({
      rezCost: 5,
      strength: 5,
    });
  });

  it("validates V1.0.6K smoke decks and keeps the previous V1.0.5K cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_6K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_0_6K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v106kCardReleaseGame("v106k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_203_hostile-takeover"]).toBeDefined();
  });

  it("plays V1.0.6K Runner economy/draw cards, installs WuTech and uses Wild Card", () => {
    let state = toRunnerTurn(v106kCardReleaseGame("v106k-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 12;
    moveRunnerCardToGrip(state, "onr_v1_079_bodyweight-synthetic-blood");
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    moveRunnerCardToGrip(state, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(state, "onr_v1_108_score");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_072_wild-card");

    const beforeBodyweightGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_079_bodyweight-synthetic-blood",
    );
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_095_jack-n-joe",
    );
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_097_livewires-contacts",
    );
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_108_score",
    );
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_072_wild-card",
    );
    expect(state.runner.memoryLimit).toBe(5);
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("onr_v1_072_wild-card");

    let sentryRun = toRunnerTurn(
      v106kCardReleaseGame("v106k-wild-card-sentry"),
    );
    sentryRun.runner.credits = 20;
    installRunnerProgramForTest(sentryRun, "onr_v1_072_wild-card");
    putCorpIceOnServer(sentryRun, "rd", "simple_sentry_ice");
    putCorpCardOnTopOfRd(sentryRun, "simple_economy_operation");
    sentryRun.corp.credits = 20;

    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryRun = apply(
      sentryRun,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryRun, action) === "simple_sentry_ice",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) => action.type === "continue_run",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
  });

  it("plays V1.0.6K Corp economy, tagged and damage operations", () => {
    let state = createGameAfterSetup({
      seed: "v106k-corp-operations",
      runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
      corpDeck: ONR_V1_0_6K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.runner.tags = 1;
    state.runner.credits = 9;
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_282_annual-reviews");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");
    moveCorpCardToHq(state, "onr_v1_290_efficiency-experts");
    moveCorpCardToHq(state, "onr_v1_285_closed-accounts");
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");

    const beforeAccounts = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_281_accounts-receivable",
    );
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeReviewsHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_282_annual-reviews",
    );
    expect(state.corp.hq.length).toBe(beforeReviewsHq + 2);

    const beforeDayShiftHq = state.corp.hq.length;
    const beforeDayShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);
    expect(state.corp.credits).toBe(beforeDayShiftCredits + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_290_efficiency-experts",
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech",
    );
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_285_closed-accounts",
    );
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5],
    ] as const) {
      let damageState = createGameAfterSetup({
        seed: `v106k-${definitionId}`,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      });
      damageState = apply(
        damageState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(
        damageState,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(damageState, action) === definitionId,
      );
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false,
      });
    }
  });

  it("rezzes V1.0.6K simple ICE and keeps unrezzed titles hidden", () => {
    for (const definitionId of [
      "onr_v1_244_filter",
      "onr_v1_245_fire-wall",
      "onr_v1_252_keeper",
      "onr_v1_256_mazer",
    ] as const) {
      let state = toRunnerTurn(
        v106kCardReleaseGame(`v106k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 20;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

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
          sourceDefinition(state, action) === definitionId,
      );

      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
    }
  });
});

describe("V1.1.2K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_1_2K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_1_2K_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity/,
      );
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_006_black-dahlia"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_014_codecracker"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_016_cyfermaster"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_040_loony-goon"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_060_shaka"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_073_wizards-book"]).toMatchObject({
      installCost: 5,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_253_laser-wire"]).toMatchObject({
      rezCost: 4,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_257_nerve-labyrinth"]).toMatchObject({
      rezCost: 6,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_278_wall-of-ice"]).toMatchObject({
      rezCost: 13,
      strength: 6,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_293_netwatch-credit-voucher"],
    ).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_295_night-shift"]).toMatchObject({
      cost: 0,
    });
  });

  it("validates V1.1.2K smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_1_2K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_1_2K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v112kCardReleaseGame("v112k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_220_tycho-extension"]).toBeDefined();
  });

  it("installs V1.1.2K breakers and uses the existing code-gate and sentry break rules", () => {
    let installState = toRunnerTurn(
      v112kCardReleaseGame("v112k-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_016_cyfermaster",
      "onr_v1_040_loony-goon",
      "onr_v1_060_shaka",
      "onr_v1_073_wizards-book",
    ] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(
        installState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(installState, action) === definitionId,
      );
    }
    expect(installState.runner.memoryUsed).toBe(6);

    let codeGateState = toRunnerTurn(
      v112kCardReleaseGame("v112k-codecracker-quandary"),
    );
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "simple_economy_operation");
    codeGateState.corp.credits = 20;

    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    codeGateState = apply(
      codeGateState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(codeGateState, action) === "onr_v1_261_quandary",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "continue_run",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });

    let sentryState = toRunnerTurn(
      v112kCardReleaseGame("v112k-loony-goon-face"),
    );
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "simple_economy_operation");
    sentryState.corp.credits = 20;

    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryState = apply(
      sentryState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryState, action) === "onr_v1_259_in-the-face",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "continue_run",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
  });

  it("plays V1.1.2K Corp operations and resolves new ICE through visibility-safe replayable paths", () => {
    let operationState = createGameAfterSetup({
      seed: "v112k-corp-operations",
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    operationState.corp.credits = 20;
    operationState.corp.clicks = 8;
    operationState.runner.tags = 1;
    moveCorpCardToHq(operationState, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(operationState, "onr_v1_295_night-shift");

    const beforeVoucherTags = operationState.runner.tags;
    const beforeVoucherCredits = operationState.corp.credits;
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) ===
          "onr_v1_293_netwatch-credit-voucher",
    );
    expect(operationState.runner.tags).toBe(beforeVoucherTags + 1);
    expect(operationState.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftCards = operationState.corp.hq.length;
    const beforeNightShiftCredits = operationState.corp.credits;
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) === "onr_v1_295_night-shift",
    );
    expect(operationState.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(operationState.corp.hq.length).toBe(beforeNightShiftCards);

    for (const definitionId of [
      "onr_v1_253_laser-wire",
      "onr_v1_257_nerve-labyrinth",
      "onr_v1_262_razor-wire",
      "onr_v1_263_reinforced-wall",
      "onr_v1_265_rock-is-strong",
      "onr_v1_266_scramble",
      "onr_v1_269_shotgun-wire",
      "onr_v1_270_sleeper",
      "onr_v1_278_wall-of-ice",
      "onr_v1_279_wall-of-static",
    ] as const) {
      let state = toRunnerTurn(
        v112kCardReleaseGame(`v112k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 30;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

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
          sourceDefinition(state, action) === definitionId,
      );
      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

      const beforeContinue = structuredClone(state);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(
        replayEvents(
          beforeContinue,
          state.eventLog.slice(beforeContinue.eventLog.length),
        ).ok,
      ).toBe(true);
    }
  });
});

describe("V1.2.3 Mechanic Unlock Card Release 1", () => {
  it("adds exactly eleven human-playable O:NR cards without opening deferred mechanics", () => {
    expect(ONR_V1_2_3_FINAL_CARD_IDS).toHaveLength(11);
    for (const definitionId of ONR_V1_2_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity|format|deckbuilder|parser/,
      );
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_039_krash"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_066_snowball"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_074_worm"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_081_custodial-position"]).toMatchObject({
      cost: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_085_executive-wiretaps"]).toMatchObject({
      cost: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_101_mit-west-tier"]).toMatchObject({
      cost: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_243_fetch-4-0-1"]).toMatchObject({
      rezCost: 0,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_249_hunter"]).toMatchObject({
      rezCost: 2,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_297_overtime-incentives"]).toMatchObject({
      cost: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_306_trojan-horse"]).toMatchObject({
      cost: 2,
    });
  });

  it("validates V1.2.3 smoke decks after the V1.2.2 gate", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_2_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_2_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v123CardReleaseGame("v123-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.specialZones).toEqual({ setAside: [], removedFromGame: [] });
  });

  it("installs the four unlocked breakers and resolves wall, sentry and universal break rules", () => {
    let installState = toRunnerTurn(
      v123CardReleaseGame("v123-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_021_dwarf",
      "onr_v1_039_krash",
      "onr_v1_066_snowball",
      "onr_v1_074_worm",
    ] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(
        installState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(installState, action) === definitionId,
      );
    }
    expect(installState.runner.memoryUsed).toBe(4);

    const breakCases = [
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_237_data-wall",
        seed: "dwarf-wall",
      },
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_279_wall-of-static",
        seed: "dwarf-wall-of-static",
      },
      {
        breaker: "onr_v1_074_worm",
        ice: "onr_v1_237_data-wall",
        seed: "worm-wall",
      },
      {
        breaker: "onr_v1_066_snowball",
        ice: "onr_v1_259_in-the-face",
        seed: "snowball-sentry",
      },
      {
        breaker: "onr_v1_039_krash",
        ice: "onr_v1_261_quandary",
        seed: "krash-code-gate",
      },
    ] as const;

    for (const testCase of breakCases) {
      let state = toRunnerTurn(v123CardReleaseGame(`v123-${testCase.seed}`));
      state.runner.credits = 20;
      state.corp.credits = 20;
      installRunnerProgramForTest(state, testCase.breaker);
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");

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
          sourceDefinition(state, action) === testCase.ice,
      );
      for (
        let pumpCount = 0;
        pumpCount < 5 &&
        !getLegalActions(state, "runner").some(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
        pumpCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === testCase.breaker,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      for (
        let continueCount = 0;
        continueCount < 3 &&
        !getLegalActions(state, "runner").some(
          (action) => action.type === "access_card",
        );
        continueCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      state = apply(state, "runner", (action) => action.type === "access_card");
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "access_card",
        cardDefinitionId: "simple_economy_operation",
      });
    }
  });

  it("qualifies breaker encounter labels and keeps wall-breaker pump paths deterministic", () => {
    let state = toRunnerTurn(
      v123CardReleaseGame("v123-dwarf-krash-wall-of-static"),
    );
    state.runner.credits = 30;
    installRunnerProgramForTest(state, "onr_v1_021_dwarf");
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );

    const initialEncounterActions = getLegalActions(state, "runner");
    const initialPumpLabels = initialEncounterActions
      .filter((action) => action.type === "pump_breaker")
      .map((action) => action.label);
    expect(initialPumpLabels).toEqual(
      expect.arrayContaining(["Dwarf: Stärke +1", "Krash: Stärke +1"]),
    );
    expect(
      initialEncounterActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_021_dwarf",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dwarfBreak = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    expect(dwarfBreak.label).toBe("Dwarf: Subroutine brechen");
  });

  it("plays the unlocked R&D and HQ multiaccess events with hidden queues", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("v123-custodial-position"));
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "simple_economy_operation");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_220_tycho-extension");

    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rdState, action) === "onr_v1_081_custodial-position" &&
        action.payload?.serverId === "rd",
    );

    expect(rdState.timingPoint).toBe("access.resolve_card");
    expect(rdState.run?.breach).toMatchObject({
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(
      JSON.stringify(rdState.eventLog.at(-1)?.publicPayload),
    ).not.toContain("Tycho Extension");

    let hqState = toRunnerTurn(v123CardReleaseGame("v123-executive-wiretaps"));
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const first = moveCorpCardToHq(hqState, "simple_economy_operation");
    const second = moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover");
    const third = moveCorpCardToHq(hqState, "onr_v1_220_tycho-extension");
    keepOnlyCorpHqCards(hqState, [first, second, third]);

    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" &&
        action.payload?.serverId === "hq",
    );

    expect(hqState.run?.breach).toMatchObject({
      serverId: "hq",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(hqState, "runner"))).not.toContain(
      "Tycho Extension",
    );
    expect(getPlayerView(hqState, "runner").run?.breach?.remainingCount).toBe(
      3,
    );
  });

  it("removes MIT West Tier from the game after a deterministic hidden shuffle and draw", () => {
    let state = toRunnerTurn(v123CardReleaseGame("v123-mit-west-tier"));
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_101_mit-west-tier",
    );

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.heap).not.toContain(eventId);
    expect(state.specialZones?.removedFromGame).toEqual([eventId]);
    expect(state.cardInstances[eventId]?.zone).toMatchObject({
      side: "special",
      zone: "removed_from_game",
      visibility: "public",
    });
    expect(
      getPlayerView(state, "runner").specialZones?.removedFromGame[0],
    ).toMatchObject({
      definitionId: "onr_v1_101_mit-west-tier",
      owner: "runner",
      controller: "runner",
    });
    expect(
      getPlayerView(state, "corp").specialZones?.removedFromGame[0],
    ).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "runner_",
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("plays Overtime Incentives as a LegalAction-only Corp action gain", () => {
    let state = v123CardReleaseGame("v123-overtime");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 3;
    state.corp.credits = 5;
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");

    const before = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_297_overtime-incentives",
    );

    expect(state.corp.clicks).toBe(before + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_297_overtime-incentives",
      gainedActions: 2,
    });
    expect(
      JSON.stringify(
        getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
      ),
    ).not.toContain("corp_");
  });

  it("gates Trojan Horse on runner agenda theft in the last turn and gives 1 tag when legal", () => {
    let state = v123CardReleaseGame("v123-trojan-horse");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    state.corp.credits = 8;

    const beforeRunnerTurn = apply(
      state,
      "corp",
      (action) => action.type === "end_turn",
    );
    const beforeTheftInput = getLegalActions(beforeRunnerTurn, "corp").filter(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(beforeRunnerTurn, action) ===
          "onr_v1_306_trojan-horse",
    );
    expect(beforeTheftInput).toHaveLength(0);
    moveCorpCardToArchives(beforeRunnerTurn, "onr_v1_220_tycho-extension");

    let afterTheft = apply(
      beforeRunnerTurn,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "access_card",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "end_turn",
    );
    afterTheft = apply(
      afterTheft,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const trojanAfterTheft = moveCorpCardToHq(
      afterTheft,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(afterTheft, trojanAfterTheft);
    afterTheft.corp.credits = 8;
    const beforeTags = afterTheft.runner.tags;

    afterTheft = apply(
      afterTheft,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(afterTheft, action) === "onr_v1_306_trojan-horse",
    );

    expect(afterTheft.runner.tags).toBe(beforeTags + 1);
    expect(afterTheft.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_306_trojan-horse",
    });
  });
});

describe("V1.6.1 Mechanikpaket A", () => {
  it("adds a controlled V1.6.1 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_1_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_6_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|worm|search|arrange|shuffle|unique|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_023_evil-twin"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_028_force-shield"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_125_dermatech-bodyplating"]).toMatchObject({
      installCost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_229_code-corpse"]).toMatchObject({
      rezCost: 10,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_231_cortical-scrub"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_254_liche"]).toMatchObject({
      rezCost: 14,
      strength: 6,
    });
  });

  it("validates V1.6.1 smoke decks and keeps prior ONR runtime cards legal", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v161CardReleaseGame("v161-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_297_overtime-incentives"]).toBeDefined();
  });

  it("uses runtime prevention windows from Force Shield and Dermatech Bodyplating", () => {
    let coreState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v161-force-shield",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: V111_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    coreState.runner.credits = 20;
    moveRunnerCardToGrip(coreState, "onr_v1_028_force-shield");
    coreState = apply(
      coreState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(coreState, action) === "onr_v1_028_force-shield",
    );
    coreState = apply(
      coreState,
      "runner",
      (action) => action.type === "end_turn",
    );
    coreState = apply(
      coreState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    moveCorpCardToHq(coreState, "v111_core_damage_operation");
    const coreGripBefore = coreState.runner.grip.length;
    coreState = apply(
      coreState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(coreState, action) === "v111_core_damage_operation",
    );
    expect(coreState.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    const preventionOption = coreState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    coreState = applyChoice(coreState, "runner", preventionOption ?? "pass");
    expect(coreState.runner.coreDamage).toBe(0);
    expect(coreState.runner.grip.length).toBe(coreGripBefore);
    expect(coreState.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      finalAmount: 0,
      damageAmount: 0,
    });

    let meatState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v161-dermatech",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: ONR_V1_6_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    meatState.runner.credits = 20;
    moveRunnerCardToGrip(meatState, "onr_v1_125_dermatech-bodyplating");
    meatState = apply(
      meatState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(meatState, action) ===
          "onr_v1_125_dermatech-bodyplating",
    );
    meatState = apply(
      meatState,
      "runner",
      (action) => action.type === "end_turn",
    );
    meatState = apply(
      meatState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    meatState.runner.tags = 1;
    moveCorpCardToHq(meatState, "onr_v1_302_scorched-earth");
    const meatGripBefore = meatState.runner.grip.length;
    meatState = apply(
      meatState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(meatState, action) === "onr_v1_302_scorched-earth",
    );
    const meatPreventionOption = meatState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    meatState = applyChoice(
      meatState,
      "runner",
      meatPreventionOption ?? "pass",
    );
    expect(meatState.runner.grip.length).toBe(meatGripBefore - 3);
    expect(meatState.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 3,
    });
  });

  it("resolves new core-damage ICE through replayable, side-safe run paths", () => {
    const cases = [
      { ice: "onr_v1_229_code-corpse", expectedCoreDamage: 2 },
      { ice: "onr_v1_231_cortical-scrub", expectedCoreDamage: 1 },
      { ice: "onr_v1_254_liche", expectedCoreDamage: 3 },
    ] as const;

    for (const testCase of cases) {
      let state = toRunnerTurn(v161CardReleaseGame(`v161-${testCase.ice}`));
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
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
          sourceDefinition(state, action) === testCase.ice,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(state.runner.coreDamage).toBe(testCase.expectedCoreDamage);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        result: "ended",
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("V1.6.2 Mechanikpaket B", () => {
  it("adds a controlled V1.6.2 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|uninstall_runner_program|subtype_noisy/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_212_priority-requisition"]).toMatchObject({
      advancementRequirement: 5,
      agendaPoints: 3,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_215_security-net-optimization"],
    ).toMatchObject({ advancementRequirement: 5, agendaPoints: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_317_data-masons"]).toMatchObject({
      rezCost: 1,
      trashCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_320_encoder-inc"]).toMatchObject({
      rezCost: 0,
      trashCost: 1,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
    ).toMatchObject({ rezCost: 0, trashCost: 2 });
  });

  it("validates V1.6.2 smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v162CardReleaseGame("v162-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_254_liche"]).toBeDefined();
  });

  it("applies Data Masons rez/strength modifiers and score-based Security Net strength", () => {
    let dataMasons = v162CardReleaseGame("v162-data-masons");
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    dataMasons.corp.credits = 30;
    dataMasons.corp.maxHandSize = 100;
    putCorpRootInRemote(dataMasons, "onr_v1_317_data-masons");
    putCorpIceOnServer(dataMasons, "rd", "onr_v1_232_crystal-wall");
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_317_data-masons",
    );
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) => action.type === "end_turn",
    );
    dataMasons = apply(
      dataMasons,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const wallRez = mustAction(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_232_crystal-wall",
    );
    expect(wallRez.costs[0]?.credits).toBe(2);
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(dataMasons, "runner").run?.encounteredIce?.strength,
    ).toBe(4);

    let securityNet = v162CardReleaseGame("v162-security-net");
    securityNet = apply(
      securityNet,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    securityNet.corp.credits = 30;
    securityNet.corp.clicks = 10;
    securityNet.corp.maxHandSize = 100;
    moveCorpCardToHq(securityNet, "onr_v1_215_security-net-optimization");
    putCorpIceOnServer(securityNet, "rd", "onr_v1_232_crystal-wall");
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(securityNet, action) ===
          "onr_v1_215_security-net-optimization",
    );
    for (let index = 0; index < 5; index += 1) {
      securityNet = apply(
        securityNet,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(securityNet, action) ===
            "onr_v1_215_security-net-optimization",
      );
    }
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(securityNet, action) ===
          "onr_v1_215_security-net-optimization",
    );
    securityNet = apply(
      securityNet,
      "corp",
      (action) => action.type === "end_turn",
    );
    securityNet = apply(
      securityNet,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(securityNet, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(securityNet, "runner").run?.encounteredIce?.strength,
    ).toBe(4);
  });

  it("reduces code-gate and black-ice rez costs and resolves Priority Requisition free rez deterministically", () => {
    let encoder = v162CardReleaseGame("v162-encoder");
    encoder = apply(
      encoder,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    encoder.corp.credits = 30;
    encoder.corp.maxHandSize = 100;
    putCorpRootInRemote(encoder, "onr_v1_320_encoder-inc");
    putCorpIceOnServer(encoder, "rd", "onr_v1_230_cortical-scanner");
    encoder = apply(
      encoder,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(encoder, action) === "onr_v1_320_encoder-inc",
    );
    encoder = apply(encoder, "corp", (action) => action.type === "end_turn");
    encoder = apply(
      encoder,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const codeGateRez = mustAction(
      encoder,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(encoder, action) === "onr_v1_230_cortical-scanner",
    );
    expect(codeGateRez.costs[0]?.credits).toBe(5);

    let skalderviken = v162CardReleaseGame("v162-skalderviken");
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    skalderviken.corp.credits = 30;
    skalderviken.corp.maxHandSize = 100;
    putCorpRootInRemote(
      skalderviken,
      "onr_v1_341_skalderviken-sa-beta-test-site",
    );
    putCorpIceOnServer(skalderviken, "hq", "onr_v1_231_cortical-scrub");
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(skalderviken, action) ===
          "onr_v1_341_skalderviken-sa-beta-test-site",
    );
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) => action.type === "end_turn",
    );
    skalderviken = apply(
      skalderviken,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const blackIceRez = mustAction(
      skalderviken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(skalderviken, action) === "onr_v1_231_cortical-scrub",
    );
    expect(blackIceRez.costs[0]?.credits).toBe(5);

    let priority = v162CardReleaseGame("v162-priority-requisition");
    priority = apply(
      priority,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    priority.corp.credits = 30;
    priority.corp.clicks = 10;
    priority.corp.maxHandSize = 100;
    moveCorpCardToHq(priority, "onr_v1_212_priority-requisition");
    const highCostIceId = putCorpIceOnServer(
      priority,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    const lowerCostIceId = putCorpIceOnServer(
      priority,
      "hq",
      "onr_v1_232_crystal-wall",
    );
    priority = apply(
      priority,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(priority, action) ===
          "onr_v1_212_priority-requisition",
    );
    for (let index = 0; index < 5; index += 1) {
      priority = apply(
        priority,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(priority, action) ===
            "onr_v1_212_priority-requisition",
      );
    }
    priority = apply(
      priority,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(priority, action) ===
          "onr_v1_212_priority-requisition",
    );
    expect(priority.cardInstances[highCostIceId]?.rezzed).toBe(true);
    expect(priority.cardInstances[lowerCostIceId]?.rezzed).toBe(false);
  });
});

describe("V1.6.3 Mechanikpaket C", () => {
  it("adds a controlled V1.6.3 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_3_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|recurring_credit/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_233_d-arc-knight"]).toMatchObject({
      rezCost: 6,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_267_sentinels-prime"]).toMatchObject({
      rezCost: 8,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_273_triggerman"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_350_antiquated-interface-routines"],
    ).toMatchObject({ rezCost: 2, trashCost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_371_tokyo-chiba-infighting"]).toMatchObject(
      { rezCost: 0, trashCost: 6 },
    );
  });

  it("validates V1.6.3 smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v163CardReleaseGame("v163-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      DEMO_CARDS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
    ).toBeDefined();
  });

  it("resolves trash-program ICE subroutines deterministically and replay-safe", () => {
    const cases = [
      "onr_v1_233_d-arc-knight",
      "onr_v1_267_sentinels-prime",
      "onr_v1_273_triggerman",
    ] as const;

    for (const iceDefinitionId of cases) {
      let state = toRunnerTurn(
        v163CardReleaseGame(`v163-trash-${iceDefinitionId}`),
      );
      installRunnerProgramForTest(state, "onr_v1_014_codecracker");
      const installedProgramId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
      );
      expect(installedProgramId).toBeDefined();
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.run).toBeUndefined();
      if (installedProgramId) {
        expect(state.runner.rig.programs).not.toContain(installedProgramId);
        expect(state.runner.heap).toContain(installedProgramId);
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("applies Antiquated Interface strength and Tokyo-Chiba unsuccessful-run credit on its fort", () => {
    let strengthState = v163CardReleaseGame("v163-antiquated-strength");
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    strengthState.corp.credits = 40;
    strengthState.corp.maxHandSize = 100;
    putCorpRootInRemote(
      strengthState,
      "onr_v1_350_antiquated-interface-routines",
    );
    putCorpIceOnServer(strengthState, "remote_1", "onr_v1_232_crystal-wall");
    putCorpIceOnServer(strengthState, "rd", "onr_v1_233_d-arc-knight");
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) ===
          "onr_v1_350_antiquated-interface-routines",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "end_turn",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(4);
    strengthState = apply(
      strengthState,
      "runner",
      (action) => action.type === "continue_run",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_233_d-arc-knight",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(2);

    let tokyoState = v163CardReleaseGame("v163-tokyo-bonus");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    tokyoState.corp.credits = 40;
    tokyoState.corp.maxHandSize = 100;
    tokyoState.corp.clicks = 10;
    moveCorpCardToHq(tokyoState, "onr_v1_371_tokyo-chiba-infighting");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting",
    );
    const firstRegionId = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.find(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      );
    expect(firstRegionId).toBeDefined();
    if (firstRegionId) {
      expect(tokyoState.cardInstances[firstRegionId]?.rezzed).toBe(true);
      expect(tokyoState.cardInstances[firstRegionId]?.faceup).toBe(true);
    }
    const secondRegionId =
      Object.entries(tokyoState.cardInstances).find(
        ([id, card]) =>
          card.definitionId === "onr_v1_371_tokyo-chiba-infighting" &&
          id !== firstRegionId,
      )?.[0] ?? "";
    expect(secondRegionId).not.toBe("");
    if (secondRegionId) {
      removeEverywhere(tokyoState, secondRegionId);
      tokyoState.corp.hq.unshift(secondRegionId);
      tokyoState.cardInstances[secondRegionId] = {
        ...tokyoState.cardInstances[secondRegionId]!,
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      };
    }
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting" &&
        action.payload?.serverId === "remote_1",
    );
    if (firstRegionId) {
      expect(tokyoState.corp.archives).toContain(firstRegionId);
    }
    const regionCountInRemote = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.filter(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      ).length;
    expect(regionCountInRemote).toBe(1);
    putCorpIceOnServer(tokyoState, "remote_1", "onr_v1_233_d-arc-knight");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "end_turn",
    );
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tokyoState, action) === "onr_v1_233_d-arc-knight",
    );
    const creditsBeforeContinue = tokyoState.corp.credits;
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tokyoState.run).toBeUndefined();
    expect(tokyoState.corp.credits).toBe(creditsBeforeContinue + 2);
  });
});

describe("V1.7.0 Mechanikpaket D", () => {
  it("adds a controlled V1.7.0 core card set with subtype, hosting, recurring and unique gates", () => {
    expect(ONR_V1_7_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /search|arrange|shuffle|trace_windowing|run_lock|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_011_cloak"]).toMatchObject({
      installCost: 7,
      memoryCost: 1,
      recurringCredits: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_036_jackhammer"]).toMatchObject({
      installCost: 1,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_069_succubus"]).toMatchObject({
      installCost: 3,
      memoryCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_163_floating-runner-bbs"]).toMatchObject({
      installCost: 6,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_180_smiths-pawnshop"]?.subtypes).toContain(
      "unique",
    );
    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]?.subtypes).toContain("worm");
    expect(DEMO_CARDS_BY_ID["onr_v1_074_worm"]?.subtypes).toContain("worm");
  });

  it("validates V1.7.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v170CardReleaseGame("v170-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_371_tokyo-chiba-infighting"]).toBeDefined();
  });

  it("hosts programs on Succubus without MU cost and trashes hosted programs when the daemon is trashed", () => {
    let state = toRunnerTurn(v170CardReleaseGame("v170-succubus-hosting"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_069_succubus");
    moveRunnerCardToGrip(state, "onr_v1_036_jackhammer");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_069_succubus",
    );
    const succubusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_069_succubus",
    );
    expect(succubusId).toBeDefined();
    if (!succubusId) throw new Error("Missing installed Succubus");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_036_jackhammer" &&
        action.payload?.hostOnCardId === succubusId,
    );
    const hostedJackhammerId = String(hostedInstall.payload?.cardId ?? "");
    expect(hostedJackhammerId).not.toBe("");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    expect(state.cardInstances[hostedJackhammerId]?.hostedOn).toBe(succubusId);
    expect(state.runner.memoryUsed).toBe(1);

    putCorpIceOnServer(state, "rd", "onr_v1_233_d-arc-knight");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 40;
    state.runner.credits = 20;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

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
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    if (succubusId) {
      expect(state.runner.rig.programs).not.toContain(succubusId);
      expect(state.runner.heap).toContain(succubusId);
    }
    if (hostedJackhammerId) {
      expect(state.runner.rig.programs).not.toContain(hostedJackhammerId);
      expect(state.runner.heap).toContain(hostedJackhammerId);
    }
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses stealth recurring credits for non-noisy breakers and blocks them for noisy breakers", () => {
    let noisyState = toRunnerTurn(
      v170CardReleaseGame("v170-noisy-stealth-block"),
    );
    noisyState.runner.credits = 30;
    moveRunnerCardToGrip(noisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(noisyState, "onr_v1_036_jackhammer");
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_011_cloak",
    );
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_036_jackhammer",
    );
    const jackhammerId = noisyState.runner.rig.programs.find(
      (id) =>
        noisyState.cardInstances[id]?.definitionId === "onr_v1_036_jackhammer",
    );
    noisyState.runner.credits = 0;
    putCorpIceOnServer(noisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(noisyState, "simple_economy_operation");
    noisyState.corp.credits = 40;
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noisyState = apply(
      noisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(noisyState, action) === "onr_v1_232_crystal-wall",
    );
    const noisyPump = getLegalActions(noisyState, "runner").find(
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === jackhammerId,
    );
    expect(noisyPump).toBeUndefined();

    let nonNoisyState = toRunnerTurn(
      v170CardReleaseGame("v170-nonnoisy-stealth-allowed"),
    );
    nonNoisyState.runner.credits = 30;
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_021_dwarf");
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_011_cloak",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_021_dwarf",
    );
    const cloakId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const dwarfId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    nonNoisyState.runner.credits = 0;
    putCorpIceOnServer(nonNoisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(nonNoisyState, "simple_economy_operation");
    nonNoisyState.corp.credits = 40;
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_232_crystal-wall",
    );
    const nonNoisyPump = mustAction(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "pump_breaker" && action.payload?.breakerId === dwarfId,
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) => action.actionId === nonNoisyPump.actionId,
    );
    if (cloakId) {
      expect(
        nonNoisyState.cardInstances[cloakId]?.counters?.recurring_credit,
      ).toBe(2);
    }
  });

  it("enforces unique deck/install rules and resolves Smith's Pawnshop start-of-turn choice with Floating Runner BBS income", () => {
    const invalidUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_invalid",
      name: "O:NR V1.7.0 Unique Invalid",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 5 },
      ],
    };
    const invalidValidation = validateDeckDefinition(invalidUniqueDeck, {
      expectedSide: "runner",
    });
    expect(invalidValidation.ok).toBe(false);
    expect(invalidValidation.errors.join(" ")).toMatch(/unique card/i);

    const runtimeUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_runtime",
      name: "O:NR V1.7.0 Unique Runtime",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 6 },
      ],
    };
    let uniqueState = createGameAfterSetup({
      seed: "v170-unique-runtime",
      baseline: MVP_0_99_BASELINE,
      runnerDeck: runtimeUniqueDeck,
      corpDeck: ONR_V1_7_0_CORP_DECK,
      agendaPointsToWin: 7,
    });
    uniqueState = toRunnerTurn(uniqueState);
    uniqueState.runner.credits = 10;
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    uniqueState = apply(
      uniqueState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    const duplicateInstall = getLegalActions(uniqueState, "runner").find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    expect(duplicateInstall).toBeUndefined();

    let smithState = toRunnerTurn(v170CardReleaseGame("v170-smith-floating"));
    smithState.runner.credits = 20;
    moveRunnerCardToGrip(smithState, "onr_v1_163_floating-runner-bbs");
    moveRunnerCardToGrip(smithState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(smithState, "onr_v1_028_force-shield");
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) ===
          "onr_v1_163_floating-runner-bbs",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_180_smiths-pawnshop",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_028_force-shield",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) => action.type === "end_turn",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "end_turn",
    );
    if (
      smithState.pendingChoice?.source === "discard_phase" &&
      smithState.pendingChoice.side === "corp"
    ) {
      smithState = applyChoice(
        smithState,
        "corp",
        String(smithState.pendingChoice.options[0]?.id),
      );
    }
    expect(
      smithState.pendingChoice?.source.startsWith("v170.smiths_pawnshop"),
    ).toBe(true);
    const forceShieldOption =
      smithState.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" &&
          smithState.cardInstances[option.value]?.definitionId ===
            "onr_v1_028_force-shield",
      )?.id ?? "pass";
    smithState = applyChoice(smithState, "runner", forceShieldOption);
    expect(
      smithState.runner.heap.some(
        (id) =>
          smithState.cardInstances[id]?.definitionId ===
          "onr_v1_028_force-shield",
      ),
    ).toBe(true);
    expect(smithState.runner.credits).toBe(14);
  });
});

describe("V1.7.1 Mechanikpaket E", () => {
  it("adds a controlled V1.7.1 core card set for search, access replacement and HQ multiaccess", () => {
    expect(ONR_V1_7_1_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_114_temple-microcode-outlet"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_106_private-ldl-access"]).toMatchObject({
      cost: 0,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_118_weather-to-finance-pipe"],
    ).toMatchObject({ cost: 0 });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_084_edited-shipping-manifests"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_129_hq-interface"]).toMatchObject({
      installCost: 4,
    });
  });

  it("validates V1.7.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v171CardReleaseGame("v171-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_180_smiths-pawnshop"]).toBeDefined();
  });

  it("resolves Temple Microcode Outlet as hidden-zone stack search and deterministic shuffle", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-temple-search"));
    state.runner.credits = 20;
    const templeId = moveRunnerCardToGrip(
      state,
      "onr_v1_114_temple-microcode-outlet",
    );
    const selectedProgram = putRunnerCardOnTopOfStack(
      state,
      "onr_v1_036_jackhammer",
    );
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === templeId &&
        sourceDefinition(state, action) ===
          "onr_v1_114_temple-microcode-outlet",
    );
    expect(state.pendingChoice?.source.startsWith("v098.search_stack")).toBe(
      true,
    );

    const selectedOption =
      state.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" && option.value === selectedProgram,
      )?.id ?? "";
    expect(selectedOption).not.toBe("");
    state = applyChoice(state, "runner", selectedOption);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "search_stack",
    });
  });

  it("runs Private LDL Access on HQ and accesses R&D instead", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-private-ldl-access"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_106_private-ldl-access");
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    const hqOperationId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqOperationId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_106_private-ldl-access" &&
        action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      title: "Hostile Takeover",
      serverLabel: "R&D",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.run).toBeUndefined();
    expect(state.corp.hq).toContain(hqOperationId);
  });

  it("applies successful-run replacement effects for Weather-to-Finance Pipe and Edited Shipping Manifests", () => {
    let weatherState = toRunnerTurn(v171CardReleaseGame("v171-weather-pipe"));
    weatherState.runner.credits = 20;
    weatherState.corp.credits = 10;
    moveRunnerCardToGrip(weatherState, "onr_v1_118_weather-to-finance-pipe");
    weatherState = apply(
      weatherState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(weatherState, action) ===
          "onr_v1_118_weather-to-finance-pipe" &&
        action.payload?.serverId === "hq",
    );
    expect(weatherState.run).toBeUndefined();
    expect(weatherState.corp.credits).toBe(6);
    expect(weatherState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
    });

    let manifestsState = toRunnerTurn(
      v171CardReleaseGame("v171-edited-shipping"),
    );
    manifestsState.runner.credits = 20;
    manifestsState.corp.credits = 8;
    moveRunnerCardToGrip(
      manifestsState,
      "onr_v1_084_edited-shipping-manifests",
    );
    const corpHqBefore = manifestsState.corp.hq.length;
    const corpRdBefore = manifestsState.corp.rd.length;
    manifestsState = apply(
      manifestsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(manifestsState, action) ===
          "onr_v1_084_edited-shipping-manifests" &&
        action.payload?.serverId === "hq",
    );
    expect(manifestsState.run).toBeUndefined();
    expect(manifestsState.corp.credits).toBe(7);
    expect(manifestsState.runner.tags).toBe(1);
    expect(manifestsState.corp.hq.length).toBe(corpHqBefore + 1);
    expect(manifestsState.corp.rd.length).toBe(corpRdBefore - 1);
    expect(manifestsState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
    });
  });

  it("grants one additional HQ access per installed HQ Interface", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-hq-interface"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_129_hq-interface");
    const firstHqCard = moveCorpCardToHq(state, "simple_economy_operation");
    const secondHqCard = moveCorpCardToHq(state, "onr_v1_295_night-shift");
    keepOnlyCorpHqCards(state, [firstHqCard, secondHqCard]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_129_hq-interface",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );

    expect(state.run?.breach?.serverId).toBe("hq");
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(state.run?.accessCount).toBe(1);
  });
});

describe("V1.7.2 Mechanikpaket F", () => {
  it("adds a controlled V1.7.2 core card set for trace, tag-resource interaction and runner resource actions", () => {
    expect(ONR_V1_7_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_283_audit-of-call-records"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_284_chance-observation"]).toMatchObject({
      cost: 2,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_286_corporate-detective-agency"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_158_danshis-second-id"]).toMatchObject({
      installCost: 0,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_179_silicon-saloon-franchise"],
    ).toMatchObject({ installCost: 8 });
  });

  it("validates V1.7.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v172CardReleaseGame("v172-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_129_hq-interface"]).toBeDefined();
  });

  it("gates Chance Observation and Audit of Call Records by runner run attempts of the previous turn", () => {
    let oneAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-one-attempt-gate"),
    );
    oneAttemptState.runner.credits = 30;
    oneAttemptState.corp.credits = 30;
    moveCorpCardToHq(oneAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(oneAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(oneAttemptState, "rd", "onr_v1_232_crystal-wall");

    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(oneAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const oneAttemptOps = getLegalActions(oneAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(oneAttemptState, action));
    expect(oneAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(oneAttemptOps).not.toContain("onr_v1_283_audit-of-call-records");

    let twoAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-two-attempt-gate"),
    );
    twoAttemptState.runner.credits = 30;
    twoAttemptState.corp.credits = 30;
    moveCorpCardToHq(twoAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(twoAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(twoAttemptState, "rd", "onr_v1_232_crystal-wall");

    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(twoAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const twoAttemptOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(twoAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(twoAttemptOps).toContain("onr_v1_283_audit-of-call-records");

    twoAttemptState.corp.maxHandSize = 100;
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const resetOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(resetOps).not.toContain("onr_v1_284_chance-observation");
    expect(resetOps).not.toContain("onr_v1_283_audit-of-call-records");
  });

  it("resolves operation traces outside runs and returns deterministically to corp action context", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-operation-trace"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveCorpCardToHq(state, "onr_v1_283_audit-of-call-records");
    putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

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
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");

    const beforeTags = state.runner.tags;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_283_audit-of-call-records",
    );

    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.source.startsWith("trace:op_trace")).toBe(true);
    expect(state.trace?.returnPhase).toBe("corp_action_phase");
    expect(state.trace?.returnTimingPoint).toBe("corp_action.main");
    expect(state.trace?.returnActiveSide).toBe("corp");
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(beforeTags + 1);
    expect(state.phase).toBe("corp_action_phase");
    expect(state.timingPoint).toBe("corp_action.main");
    expect(state.activeSide).toBe("corp");
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("trashes up to two runner resources with Corporate Detective Agency when the runner is tagged", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-detective-agency"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_158_danshis-second-id");
    moveRunnerCardToGrip(state, "onr_v1_179_silicon-saloon-franchise");
    moveRunnerCardToGrip(state, "onr_v1_163_floating-runner-bbs");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_158_danshis-second-id",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_163_floating-runner-bbs",
    );
    state.runner.tags = 1;
    const resourcesBefore = state.runner.rig.resources.slice();

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "onr_v1_286_corporate-detective-agency");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_286_corporate-detective-agency",
    );

    expect(state.runner.rig.resources).toHaveLength(1);
    expect(
      state.runner.heap.filter((cardId) => resourcesBefore.includes(cardId)),
    ).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_286_corporate-detective-agency",
    });
  });

  it("executes Danshi's Second ID and Silicon Saloon Franchise as runner resource actions", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-resource-actions"));
    state.runner.credits = 30;
    state.runner.tags = 5;
    state.runner.clicks = 10;
    const danshiId = moveRunnerCardToGrip(
      state,
      "onr_v1_158_danshis-second-id",
    );
    const siliconId = moveRunnerCardToGrip(
      state,
      "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === danshiId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === siliconId,
    );

    const tagsBefore = state.runner.tags;
    const creditsBeforeDanshi = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "remove_tag" &&
        action.payload?.resourceAbility === "danshis_second_id" &&
        String(action.payload?.cardId) === danshiId &&
        action.payload?.removeTagAmount === 3,
    );
    expect(state.runner.tags).toBe(tagsBefore - 3);
    expect(state.runner.credits).toBe(creditsBeforeDanshi);
    expect(state.runner.heap).toContain(danshiId);

    const creditsBeforeSilicon = state.runner.credits;
    const gripBeforeSilicon = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.resourceAbility === "silicon_saloon_franchise" &&
        String(action.payload?.cardId) === siliconId,
    );
    expect(state.runner.credits).toBe(creditsBeforeSilicon + 1);
    expect(state.runner.grip.length).toBe(gripBeforeSilicon + 1);
  });
});

describe("V1.8.0 Mechanikpaket G", () => {
  it("adds a controlled V1.8.0 core card set for agenda difficulty, scored statics and overadvance points", () => {
    expect(ONR_V1_8_0_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_8_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /counter_system|virus|purge|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_083_desperate-competitor"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_090_hot-tip-for-wns"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_156_corporate-ally"]).toMatchObject({
      installCost: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_159_databroker"]).toMatchObject({
      installCost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_201_executive-extraction"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_214_project-babylon"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
  });

  it("validates V1.8.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v180CardReleaseGame("v180-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      DEMO_CARDS_BY_ID["onr_v1_286_corporate-detective-agency"],
    ).toBeDefined();
  });

  it("gates Desperate Competitor and Hot Tip for WNS by same-turn agenda subtype theft", () => {
    let grayState = toRunnerTurn(v180CardReleaseGame("v180-gray-ops-gate"));
    grayState.runner.credits = 30;
    const desperateCardId = moveRunnerCardToGrip(
      grayState,
      "onr_v1_083_desperate-competitor",
    );
    const hotTipCardId = moveRunnerCardToGrip(
      grayState,
      "onr_v1_090_hot-tip-for-wns",
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(false);
    putCorpCardOnTopOfRd(grayState, "onr_v1_203_hostile-takeover");
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "access_card",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(true);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(false);
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === desperateCardId,
    );
    expect(grayState.runner.scoreArea).toContain(desperateCardId);
    expect(grayState.cardInstances[desperateCardId]?.counters?.agenda).toBe(1);

    let blackState = toRunnerTurn(v180CardReleaseGame("v180-black-ops-gate"));
    blackState.runner.credits = 30;
    const hotTipBlackCardId = moveRunnerCardToGrip(
      blackState,
      "onr_v1_090_hot-tip-for-wns",
    );
    putCorpCardOnTopOfRd(blackState, "onr_v1_214_project-babylon");
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "access_card",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(blackState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipBlackCardId,
      ),
    ).toBe(true);
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === hotTipBlackCardId,
    );
    expect(blackState.runner.scoreArea).toContain(hotTipBlackCardId);
    expect(blackState.cardInstances[hotTipBlackCardId]?.counters?.agenda).toBe(
      1,
    );
  });

  it("enforces Corporate Ally install agenda-point forfeit and Databroker agenda-point-to-credit action", () => {
    let state = toRunnerTurn(
      v180CardReleaseGame("v180-corporate-ally-databroker"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      "onr_v1_156_corporate-ally",
    );
    const databrokerId = moveRunnerCardToGrip(state, "onr_v1_159_databroker");
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const stolenAgendaId = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_203_hostile-takeover",
    );
    expect(stolenAgendaId).toBeDefined();

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    expect(state.runner.rig.resources).toContain(corporateAllyId);
    if (stolenAgendaId) {
      expect(state.runner.scoreArea).not.toContain(stolenAgendaId);
      expect(state.specialZones?.removedFromGame).toContain(stolenAgendaId);
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === databrokerId,
    );
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const databrokerForfeitTarget = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_203_hostile-takeover",
    );
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.resourceAbility === "databroker" &&
        String(action.payload?.cardId) === databrokerId,
    );
    expect(state.runner.credits).toBe(creditsBefore + 10);
    expect(state.runner.heap).toContain(databrokerId);
    if (databrokerForfeitTarget) {
      expect(state.runner.scoreArea).not.toContain(databrokerForfeitTarget);
      expect(state.specialZones?.removedFromGame).toContain(
        databrokerForfeitTarget,
      );
    }
  });

  it("applies Executive Extraction difficulty reduction for gray_ops only and keeps Corporate Ally difficulty increase active", () => {
    let state = toRunnerTurn(v180CardReleaseGame("v180-difficulty-statics"));
    state.runner.credits = 30;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      "onr_v1_156_corporate-ally",
    );
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "simple_agenda");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_agenda" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "simple_agenda",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "simple_agenda",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "simple_agenda",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "simple_agenda",
      ),
    ).toBe(true);

    moveCorpCardToHq(state, "onr_v1_201_executive-extraction");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_201_executive-extraction" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_201_executive-extraction",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_201_executive-extraction",
    );

    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
      ),
    ).toBe(true);
  });

  it("awards deterministic Project Babylon bonus points on score with replay-safe statehash", () => {
    let state = v180CardReleaseGame("v180-project-babylon");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_214_project-babylon");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_214_project-babylon" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 7; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_214_project-babylon",
      );
    }

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_214_project-babylon",
    );

    const projectBabylonId = state.corp.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_214_project-babylon",
    );
    expect(projectBabylonId).toBeDefined();
    if (projectBabylonId) {
      expect(state.cardInstances[projectBabylonId]?.counters?.agenda).toBe(2);
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      agendaPoints: 1,
      agendaPointBonus: 2,
      totalAgendaPoints: 3,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.8.1 Mechanikpaket H", () => {
  it("adds a controlled V1.8.1 core card set for counter, purge and run-follow-up mechanics", () => {
    expect(ONR_V1_8_1_FINAL_CARD_IDS).toHaveLength(12);
    for (const definitionId of ONR_V1_8_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /deterministischer_wuerfel|ambush|v2/,
      );
    }
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_013_cockroach");
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_034_incubator");
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_030_grubb");
  });

  it("validates V1.8.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v181CardReleaseGame("v181-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_214_project-babylon"]).toBeDefined();
  });

  it("applies Clown encounter strength reduction to encountered ice strength", () => {
    let withoutClown = toRunnerTurn(v181CardReleaseGame("v181-clown-off"));
    withoutClown.runner.credits = 30;
    moveRunnerCardToGrip(withoutClown, "onr_v1_021_dwarf");
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withoutClown, action) === "onr_v1_021_dwarf",
    );
    putCorpIceOnServer(withoutClown, "rd", "simple_barrier_ice");
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withoutClown = apply(
      withoutClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withoutClown, action) === "simple_barrier_ice",
    );
    expect(
      getPlayerView(withoutClown, "runner").run?.encounteredIce?.strength,
    ).toBe(3);

    let withClown = toRunnerTurn(v181CardReleaseGame("v181-clown-on"));
    withClown.runner.credits = 30;
    moveRunnerCardToGrip(withClown, "onr_v1_012_clown");
    moveRunnerCardToGrip(withClown, "onr_v1_021_dwarf");
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === "onr_v1_012_clown",
    );
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === "onr_v1_021_dwarf",
    );
    putCorpIceOnServer(withClown, "rd", "simple_barrier_ice");
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withClown = apply(
      withClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withClown, action) === "simple_barrier_ice",
    );
    expect(
      getPlayerView(withClown, "runner").run?.encounteredIce?.strength,
    ).toBe(2);
  });

  it("creates Pattel/Pox run-success counters and clears card/server virus counters with purge", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-pattel-pox-purge"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_046_pattels-virus");
    moveRunnerCardToGrip(state, "onr_v1_049_pox");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_046_pattels-virus",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_049_pox",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
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
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    expect(dwarfId).toBeDefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[iceId]?.counters?.virus).toBe(1);
    expect(state.poxCountersByServer?.rd).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    expect(state.cardInstances[iceId]?.counters?.virus ?? 0).toBe(0);
    expect(state.poxCountersByServer?.rd ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "virus",
    });
  });

  it("runs Inside Job as deterministic first-ice bypass", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-inside-job"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_094_inside-job");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_094_inside-job" &&
        action.payload?.serverId === "rd",
    );
    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.bypassFirstIceRemaining).toBe(false);
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
  });

  it("keeps Restrictive action IDs server-distinct and applies Restrictive plus Pox install tax deterministically", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-restrictive-pox-tax"));
    state.runner.credits = 40;
    const restrictiveCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_173_restrictive-net-zoning",
    );
    const restrictiveInstallActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === restrictiveCardId,
    );
    expect(restrictiveInstallActions.length).toBeGreaterThan(1);
    expect(
      new Set(restrictiveInstallActions.map((action) => action.actionId)).size,
    ).toBe(restrictiveInstallActions.length);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_173_restrictive-net-zoning" &&
        action.payload?.selectedServerId === "rd",
    );
    installRunnerProgramForTest(state, "onr_v1_049_pox");

    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.poxCountersByServer?.rd).toBe(2);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "simple_barrier_ice");
    const rdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_barrier_ice" &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(rdInstall.costs[0]?.credits).toBe(2);
    expect(rdInstall.payload?.iceInstallAdditionalCost).toBe(2);
  });

  it("scores Coup agendas with deterministic start counters and spends them via legal click actions", () => {
    let state = v181CardReleaseGame("v181-coup-actions");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_193_corporate-coup");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
    );
    const corporateCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_193_corporate-coup",
    );
    expect(corporateCoupId).toBeDefined();
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.power).toBe(5);

    moveCorpCardToHq(state, "onr_v1_209_political-coup");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_209_political-coup" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_209_political-coup",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_209_political-coup",
    );
    const politicalCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_209_political-coup",
    );
    expect(politicalCoupId).toBeDefined();
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.power).toBe(12);

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "corporate_coup",
    );
    expect(state.corp.credits).toBe(creditsBefore + 1);
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.power).toBe(4);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "political_coup",
    );
    expect(state.corp.credits).toBe(creditsBefore + 4);
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.power).toBe(9);
  });

  it("resolves Ball/Canis run flags and enforces Fatal/Shock next-encounter penalties deterministically", () => {
    let ballTaxState = toRunnerTurn(v181CardReleaseGame("v181-ball-tax"));
    ballTaxState.runner.credits = 20;
    putCorpIceOnServer(ballTaxState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(ballTaxState, "rd", "onr_v1_222_ball-and-chain");
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === "onr_v1_222_ball-and-chain",
    );
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(ballTaxState.run?.encounterTaxForFutureIce).toBe(1);
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeBallTax = ballTaxState.runner.credits;
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === "simple_barrier_ice",
    );
    expect(ballTaxState.runner.credits).toBe(creditsBeforeBallTax - 1);

    let canisState = toRunnerTurn(v181CardReleaseGame("v181-canis-strength"));
    canisState.runner.credits = 20;
    moveRunnerCardToGrip(canisState, "onr_v1_014_codecracker");
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(canisState, action) === "onr_v1_014_codecracker",
    );
    putCorpIceOnServer(canisState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(canisState, "rd", "onr_v1_226_canis-minor");
    putCorpIceOnServer(canisState, "rd", "onr_v1_225_canis-major");
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "onr_v1_225_canis-major",
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(2);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "onr_v1_226_canis-minor",
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(3);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeCanisThirdEncounter = canisState.runner.credits;
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "simple_code_gate_ice",
    );
    expect(canisState.runner.credits).toBe(creditsBeforeCanisThirdEncounter);
    const codecrackerId = canisState.runner.rig.programs.find(
      (id) =>
        canisState.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
    );
    expect(
      getLegalActions(canisState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === codecrackerId,
      ),
    ).toBe(false);

    let fatalState = toRunnerTurn(v181CardReleaseGame("v181-fatal-shock"));
    fatalState.runner.credits = 20;
    putCorpIceOnServer(fatalState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(fatalState, "rd", "onr_v1_242_fatal-attractor");
    fatalState = apply(
      fatalState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === "onr_v1_242_fatal-attractor",
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === "simple_barrier_ice",
    );
    const gripBeforeFatal = fatalState.runner.grip.length;
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(fatalState.runner.grip.length).toBe(gripBeforeFatal - 3);
    expect(fatalState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 3,
    });

    let shockState = toRunnerTurn(v181CardReleaseGame("v181-shock-lock"));
    shockState.runner.credits = 20;
    moveRunnerCardToGrip(shockState, "onr_v1_014_codecracker");
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(shockState, action) === "onr_v1_014_codecracker",
    );
    putCorpIceOnServer(shockState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(shockState, "rd", "onr_v1_268_shock-r");
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === "onr_v1_268_shock-r",
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === "simple_code_gate_ice",
    );
    const shockCodecrackerId = shockState.runner.rig.programs.find(
      (id) =>
        shockState.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
    );
    const shockRunnerActions = getLegalActions(shockState, "runner");
    expect(shockState.run?.noBreakSubroutinesActive).toBe(true);
    expect(shockState.run?.jackOutLockedUntilEncounterEnds).toBe(true);
    expect(
      shockRunnerActions.some((action) => action.type === "jack_out"),
    ).toBe(false);
    expect(
      shockRunnerActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === shockCodecrackerId,
      ),
    ).toBe(false);
  });
});

describe("V1.9.0 Mechanikpaket I", () => {
  it("adds a controlled V1.9.0 core card set for deterministic die, concrete resolver and ambush foundation scope", () => {
    expect(ONR_V1_9_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_9_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).toMatch(
        /deterministic_die_roll|deterministic_random|concrete_special_resolver|ambush/,
      );
    }
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_013_cockroach");
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_034_incubator");
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_030_grubb");
  });

  it("validates V1.9.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v190CardReleaseGame("v190-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_268_shock-r"]).toBeDefined();
  });

  it("uses a deterministic shared die resolver namespace and replay-stable random records", () => {
    const playBlinkOnce = (seed: string) => {
      let state = toRunnerTurn(v190CardReleaseGame(seed));
      state.runner.credits = 30;
      moveRunnerCardToGrip(state, "onr_v1_007_blink");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_007_blink",
      );
      putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
          sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
      );
      const blinkId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === "onr_v1_007_blink",
      );
      expect(blinkId).toBeDefined();
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId,
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith("v190.die.onr_v1_007_blink.break."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
      return { state, die };
    };

    const first = playBlinkOnce("v190-die-shared");
    const second = playBlinkOnce("v190-die-shared");
    expect(first.die).toBe(second.die);
    expect(first.state.randomDrawRecords).toEqual(
      second.state.randomDrawRecords,
    );
    expect(hashState(first.state)).toBe(hashState(second.state));
  });

  it("rolls Bartmoss deterministically after encounter usage and trashes exactly on die=1", () => {
    let foundTrash = false;
    let foundSurvive = false;
    for (
      let attempt = 0;
      attempt < 180 && (!foundTrash || !foundSurvive);
      attempt += 1
    ) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-bartmoss-${attempt}`));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_005_bartmoss-memorial-icebreaker");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
          sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
      );
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      expect(bartmossId).toBeDefined();
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith(
          "v190.die.onr_v1_005_bartmoss-memorial-icebreaker.post_encounter.",
        ),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      const stillInstalled = bartmossId
        ? state.runner.rig.programs.includes(bartmossId)
        : false;
      if (die === 1) {
        expect(stillInstalled).toBe(false);
        foundTrash = true;
      } else {
        expect(stillInstalled).toBe(true);
        foundSurvive = true;
      }
    }
    expect(foundTrash).toBe(true);
    expect(foundSurvive).toBe(true);
  });

  it("resolves Blink as deterministic break-or-net-damage and enforces once-per-subroutine-per-encounter", () => {
    let foundBreak = false;
    let foundDamage = false;
    for (
      let attempt = 0;
      attempt < 180 && (!foundBreak || !foundDamage);
      attempt += 1
    ) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-blink-${attempt}`));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_007_blink");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_007_blink",
      );
      putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
          sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
      );
      const blinkId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === "onr_v1_007_blink",
      );
      expect(blinkId).toBeDefined();
      const gripBefore = state.runner.grip.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId,
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith("v190.die.onr_v1_007_blink.break."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      const repeatBlinkBreakActions = getLegalActions(state, "runner").filter(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId &&
          Number(action.payload?.subroutineIndex) === 0,
      );
      expect(repeatBlinkBreakActions).toHaveLength(0);
      if (die >= 4) {
        expect(state.run?.brokenSubroutineIndexes).toContain(0);
        expect(state.runner.grip.length).toBe(gripBefore);
        foundBreak = true;
      } else {
        expect(state.run?.brokenSubroutineIndexes).not.toContain(0);
        expect(state.runner.grip.length).toBe(gripBefore - die);
        foundDamage = true;
      }
    }
    expect(foundBreak).toBe(true);
    expect(foundDamage).toBe(true);
  });

  it("gates Terrorist Reprisal by last-turn black_ops scoring and discards up to five HQ cards deterministically", () => {
    let state = toRunnerTurn(v190CardReleaseGame("v190-terrorist-reprisal"));
    state.runner.maxHandSize = 10;
    state.runner.credits = 30;
    state.corp.maxHandSize = 100;
    const reprisalId = moveRunnerCardToGrip(
      state,
      "onr_v1_115_terrorist-reprisal",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === reprisalId,
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 60;
    state.corp.clicks = 20;
    moveCorpCardToHq(state, "onr_v1_193_corporate-coup");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
    );
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const hqIds = [
      moveCorpCardToHq(state, "simple_economy_operation"),
      moveCorpCardToHq(state, "simple_barrier_ice"),
      moveCorpCardToHq(state, "onr_v1_275_vacuum-link"),
      moveCorpCardToHq(state, "onr_v1_223_banpei"),
      moveCorpCardToHq(state, "onr_v1_279_wall-of-static"),
      moveCorpCardToHq(state, "onr_v1_203_hostile-takeover"),
    ];
    keepOnlyCorpHqCards(state, hqIds);
    const archivesBefore = state.corp.archives.length;
    const hqBefore = state.corp.hq.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === reprisalId,
    );
    expect(state.corp.hq.length).toBe(Math.max(0, hqBefore - 5));
    expect(state.corp.archives.length - archivesBefore).toBe(
      Math.min(5, hqBefore),
    );
    const discarded = state.corp.archives.slice(-Math.min(5, hqBefore));
    expect(new Set(discarded).size).toBe(discarded.length);
    const discardRecords = state.randomDrawRecords.filter((record) =>
      record.purpose.startsWith(
        "v190.random.onr_v1_115_terrorist-reprisal.hq_discard",
      ),
    );
    expect(discardRecords).toHaveLength(Math.min(5, hqBefore));
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
  });

  it("applies Banpei trash-program subroutine deterministically and keeps end-the-run independent", () => {
    let withProgram = toRunnerTurn(
      v190CardReleaseGame("v190-banpei-with-program"),
    );
    withProgram.runner.credits = 20;
    moveRunnerCardToGrip(withProgram, "onr_v1_014_codecracker");
    withProgram = apply(
      withProgram,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withProgram, action) === "onr_v1_014_codecracker",
    );
    const codecrackerId = withProgram.runner.rig.programs.find(
      (id) =>
        withProgram.cardInstances[id]?.definitionId ===
        "onr_v1_014_codecracker",
    );
    expect(codecrackerId).toBeDefined();
    putCorpIceOnServer(withProgram, "rd", "onr_v1_223_banpei");
    withProgram = apply(
      withProgram,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withProgram = apply(
      withProgram,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withProgram, action) === "onr_v1_223_banpei",
    );
    withProgram = apply(
      withProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(withProgram.runner.heap).toContain(codecrackerId);
    expect(withProgram.run).toBeUndefined();

    let withoutProgram = toRunnerTurn(
      v190CardReleaseGame("v190-banpei-without-program"),
    );
    withoutProgram.runner.credits = 20;
    putCorpIceOnServer(withoutProgram, "rd", "onr_v1_223_banpei");
    withoutProgram = apply(
      withoutProgram,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withoutProgram = apply(
      withoutProgram,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withoutProgram, action) === "onr_v1_223_banpei",
    );
    withoutProgram = apply(
      withoutProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(withoutProgram.run).toBeUndefined();
  });

  it("rewinds runs with Vacuum Link on 1..3 and preserves legal jack-out window with first-ice edge handling", () => {
    let covered = false;
    for (let attempt = 0; attempt < 220 && !covered; attempt += 1) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-vacuum-${attempt}`));
      state.runner.credits = 40;
      state.corp.credits = 20;
      moveRunnerCardToGrip(state, "onr_v1_005_bartmoss-memorial-icebreaker");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      expect(bartmossId).toBeDefined();
      putCorpIceOnServer(state, "rd", "onr_v1_275_vacuum-link");
      putCorpIceOnServer(state, "rd", "simple_barrier_ice");
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
          sourceDefinition(state, action) === "simple_barrier_ice",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "onr_v1_275_vacuum-link",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith("v190.die.onr_v1_275_vacuum-link.rewind."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      if (die < 2 || die > 3) continue;
      const run = state.run;
      expect(run?.phase).toBe("movement");
      expect(run?.position.kind).toBe("ice");
      if (!run || run.position.kind !== "ice") {
        throw new Error(
          "expected run position to be ice after vacuum-link rewind",
        );
      }
      expect(run.position.iceIndex).toBe(0);
      const movementActions = getLegalActions(state, "runner")
        .map((action) => action.type)
        .sort();
      expect(movementActions).toEqual(["continue_run", "jack_out"]);
      covered = true;
    }
    expect(covered).toBe(true);
  });

  it("executes the ambush-on-access foundation hook deterministically via harness without scope expansion", () => {
    let state = toRunnerTurn(v190CardReleaseGame("v190-ambush-foundation"));
    state.runner.credits = 20;
    state.ambushHarness = {
      enabled: true,
      triggerDefinitionId: "onr_v1_223_banpei",
    };
    putCorpCardOnTopOfRd(state, "onr_v1_223_banpei");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "ambush_on_access_foundation",
    });
    const ambushPayload = (
      state.eventLog.at(-1)?.privatePayload as
        | { runner?: { legalAction?: { payload?: unknown } } }
        | undefined
    )?.runner?.legalAction?.payload;
    expect(ambushPayload).toMatchObject({
      ambushFoundationChecked: true,
      ambushFoundationTriggered: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("V1.9.1 Mechanikpaket J", () => {
  it("adds a controlled V1.9.1 core card set for cockroach random discard, incubator transform and grubb run-remainder strength", () => {
    expect(ONR_V1_9_1_FINAL_CARD_IDS).toHaveLength(3);
    const expectedMechanics: Record<string, RegExp> = {
      onr_v1_013_cockroach: /hq_discard_randomization/,
      onr_v1_034_incubator: /counter_transform_choice/,
      onr_v1_030_grubb: /run_remainder_strength_bonus/,
    };
    for (const definitionId of ONR_V1_9_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      const expectedPattern = expectedMechanics[definitionId];
      expect(expectedPattern, definitionId).toBeDefined();
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedPattern!,
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking|deckbuilder/,
      );
    }
  });

  it("validates V1.9.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v191CardReleaseGame("v191-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_275_vacuum-link"]).toBeDefined();
  });

  it("randomizes Corp HQ discard deterministically with Cockroach threshold and keeps replay/statehash stable", () => {
    const runScenario = (seed: string): GameState => {
      let state = toRunnerTurn(v191CardReleaseGame(seed));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_013_cockroach");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_013_cockroach",
      );

      const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
      keepOnlyCorpHqCard(state, keptHqId);
      for (let index = 0; index < 2; index += 1) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "start_run" && action.payload?.serverId === "hq",
        );
        state = apply(
          state,
          "runner",
          (action) => action.type === "access_card",
        );
      }

      const cockroachId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId === "onr_v1_013_cockroach",
      );
      expect(cockroachId).toBeDefined();
      expect(
        cockroachId ? cardCounterAmount(state, cockroachId, "virus") : 0,
      ).toBeGreaterThanOrEqual(2);

      state = apply(state, "runner", (action) => action.type === "end_turn");
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      moveCorpCardToHq(state, "onr_v1_279_wall-of-static");
      moveCorpCardToHq(state, "onr_v1_238_data-wall-2-0");
      state.corp.maxHandSize = Math.max(0, state.corp.hq.length - 1);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "corp", (action) => action.type === "end_turn");
      expect(state.pendingChoice?.source).toBe("discard_phase");
      const selectedIds = (state.pendingChoice?.options ?? [])
        .slice(0, state.pendingChoice?.minSelections ?? 1)
        .map((option) => String(option.id));
      state = applyChoices(state, "corp", selectedIds);

      const randomRecords = state.randomDrawRecords.filter((record) =>
        record.purpose.startsWith(
          "v191.random.onr_v1_013_cockroach.hq_discard_phase",
        ),
      );
      expect(randomRecords).toHaveLength(1);
      const discardEvent = [...state.eventLog]
        .reverse()
        .find(
          (event) => event.publicPayload.hiddenZoneAction === "discard_phase",
        );
      expect(discardEvent?.visibilityClass).toBe("hidden_info_barrier");
      expect(discardEvent?.publicPayload).toMatchObject({
        hiddenZoneAction: "discard_phase",
      });

      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(state));
      return state;
    };

    const first = runScenario("v191-cockroach-random");
    const second = runScenario("v191-cockroach-random");
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(hashState(first)).toBe(hashState(second));
  });

  it("runs incubator start-of-turn die rolls deterministically and resolves hidden-info-safe counter transforms", () => {
    let foundState: GameState | undefined;
    for (let attempt = 0; attempt < 250; attempt += 1) {
      let state = toRunnerTurn(
        v191CardReleaseGame(`v191-incubator-${attempt}`),
      );
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_034_incubator");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_034_incubator",
      );
      const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
      keepOnlyCorpHqCard(state, keptHqId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");
      state = apply(state, "runner", (action) => action.type === "end_turn");
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state = toRunnerTurnFromCorpMain(state);

      if (state.pendingChoice?.source.startsWith("v191.incubator_transform")) {
        foundState = state;
        break;
      }
    }

    expect(foundState).toBeDefined();
    if (!foundState) return;
    let state = foundState;
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const dieRecords = state.randomDrawRecords.filter((record) =>
      record.purpose.startsWith(
        "v191.die.onr_v1_034_incubator.start_of_turn.roll.",
      ),
    );
    expect(dieRecords.length).toBeGreaterThan(0);

    const selectedOption =
      state.pendingChoice?.options.find((option) =>
        option.id.startsWith("card_"),
      ) ?? state.pendingChoice?.options[0];
    expect(selectedOption).toBeDefined();
    if (!selectedOption) return;

    const selectedValue =
      typeof selectedOption.value === "string" ? selectedOption.value : "";
    let beforeCount = 0;
    if (selectedValue.startsWith("card:")) {
      const cardId = selectedValue.slice("card:".length) as CardInstanceId;
      beforeCount = cardCounterAmount(state, cardId, "virus");
    } else if (selectedValue.startsWith("pox:")) {
      const serverId = selectedValue.slice("pox:".length) as keyof NonNullable<
        GameState["poxCountersByServer"]
      >;
      beforeCount = state.poxCountersByServer?.[serverId] ?? 0;
    }

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoice(state, "runner", String(selectedOption.id));

    if (selectedValue.startsWith("card:")) {
      const cardId = selectedValue.slice("card:".length) as CardInstanceId;
      expect(cardCounterAmount(state, cardId, "virus")).toBe(beforeCount + 1);
    } else if (selectedValue.startsWith("pox:")) {
      const serverId = selectedValue.slice("pox:".length) as keyof NonNullable<
        GameState["poxCountersByServer"]
      >;
      expect(state.poxCountersByServer?.[serverId] ?? 0).toBe(beforeCount + 1);
    }
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "incubator_transform",
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps Grubb strength bonus for the remainder of the run and resets it on the next run", () => {
    let state = toRunnerTurn(v191CardReleaseGame("v191-grubb-run-bonus"));
    state.runner.credits = 60;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_030_grubb");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_030_grubb",
    );
    const grubbId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_030_grubb",
    );
    expect(grubbId).toBeDefined();
    if (!grubbId) return;

    putCorpIceOnServer(state, "rd", "onr_v1_238_data-wall-2-0");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

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
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_238_data-wall-2-0",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(false);
  });

  it("purges Cockroach and Incubator virus counters through the existing legal purge gate", () => {
    let state = toRunnerTurn(v191CardReleaseGame("v191-purge-virus"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_013_cockroach");
    moveRunnerCardToGrip(state, "onr_v1_034_incubator");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_013_cockroach",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_034_incubator",
    );
    const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, keptHqId);

    for (let index = 0; index < 2; index += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");
    }

    const cockroachId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_013_cockroach",
    );
    const incubatorId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_034_incubator",
    );
    expect(cockroachId).toBeDefined();
    expect(incubatorId).toBeDefined();
    if (!cockroachId || !incubatorId) return;
    expect(
      cardCounterAmount(state, cockroachId, "virus"),
    ).toBeGreaterThanOrEqual(2);
    expect(
      cardCounterAmount(state, incubatorId, "virus"),
    ).toBeGreaterThanOrEqual(2);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );

    expect(cardCounterAmount(state, cockroachId, "virus")).toBe(0);
    expect(cardCounterAmount(state, incubatorId, "virus")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "virus",
    });
  });
});

describe("V1.9.2 Mechanikpaket K", () => {
  it("adds the V1.9.2 core card set with hidden-zone/access/run/recurring coverage", () => {
    expect(ONR_V1_9_2_FINAL_CARD_IDS).toHaveLength(7);
    const expectedMechanics: Record<string, RegExp> = {
      "onr_v1_076_all-nighter": /run_flow/,
      "onr_v1_096_kilroy-was-here": /access_trash_free/,
      "onr_v1_107_romp-through-hq": /access_trash_free/,
      "onr_v1_184_top-runners-conference": /start_of_turn_credit_gain/,
      "onr_v1_188_ai-chief-financial-officer": /hidden_zone_shuffle/,
      "onr_v1_211_polymer-breakthrough": /start_of_turn_credit_gain/,
      "onr_v1_235_data-naga": /trash_installed_program/,
    };
    for (const definitionId of ONR_V1_9_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedMechanics[definitionId]!,
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /trace|tag|damage_prevention|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v192CardReleaseGame("v192-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_013_cockroach"]).toBeDefined();
  });

  it("grants an All-Nighter bonus run via LegalActions without spending a click on the bonus run", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-all-nighter"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_076_all-nighter");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_076_all-nighter" &&
        action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const bonusActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(bonusActions.length).toBeGreaterThan(0);
    state.runner.clicks = 0;
    const clicksBefore = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(state.runner.clicks).toBe(clicksBefore);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.bonusRunNoClick === true,
      ),
    ).toBe(false);
  });

  it("allows Kilroy and Romp to trash accessed HQ/R&D cards at no cost", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-kilroy-romp"));
    state.runner.credits = 20;

    moveRunnerCardToGrip(state, "onr_v1_096_kilroy-was-here");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const creditsBeforeKilroy = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_096_kilroy-was-here",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.runner.credits).toBe(creditsBeforeKilroy);

    moveRunnerCardToGrip(state, "onr_v1_107_romp-through-hq");
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_107_romp-through-hq",
    );
    const creditsBeforeRompTrash = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");
    const freeTrashAction = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(freeTrashAction.costs).toEqual([]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === freeTrashAction.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeRompTrash);
  });

  it("applies Top Runners' Conference credits at start of turn and trashes it when a run starts", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-top-runners"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "onr_v1_184_top-runners-conference");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_184_top-runners-conference",
    );
    const creditsAfterInstall = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    expect(state.runner.credits).toBe(creditsAfterInstall + 3);
    const conferenceId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_184_top-runners-conference",
    );
    expect(conferenceId).toBeDefined();
    if (!conferenceId) return;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.runner.rig.resources.includes(conferenceId)).toBe(false);
    expect(state.runner.heap).toContain(conferenceId);
  });

  it("handles Polymer start-of-turn credits, AI CFO hidden-zone shuffle action and Data Naga program trash", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-polymer-cfo-data-naga"));
    state.runner.credits = 20;
    state.corp.credits = 5;

    const polymerAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_211_polymer-breakthrough",
    );
    const cfoAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_188_ai-chief-financial-officer",
    );
    removeEverywhere(state, polymerAgendaId);
    removeEverywhere(state, cfoAgendaId);
    state.corp.scoreArea.push(polymerAgendaId, cfoAgendaId);
    state.cardInstances[polymerAgendaId] = {
      ...state.cardInstances[polymerAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[cfoAgendaId] = {
      ...state.cardInstances[cfoAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    const corpCreditsBeforeRunnerEndTurn = state.corp.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(corpCreditsBeforeRunnerEndTurn + 1);
    const corpCreditsBeforeMandatory = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.credits).toBe(corpCreditsBeforeMandatory);

    moveCorpCardToHq(state, "simple_economy_operation");
    moveCorpCardToArchives(state, "onr_v1_279_wall-of-static", false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "ai_chief_financial_officer",
    );
    expect(state.corp.archives).toHaveLength(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd",
    });

    state = toRunnerTurnFromCorpMain(state);
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    expect(dwarfId).toBeDefined();
    if (!dwarfId) return;
    putCorpIceOnServer(state, "rd", "onr_v1_235_data-naga");
    state.corp.credits = 20;
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
        sourceDefinition(state, action) === "onr_v1_235_data-naga",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.rig.programs.includes(dwarfId)).toBe(false);
    expect(state.runner.heap).toContain(dwarfId);
  });
});

describe("V1.9.3 Mechanikpaket L", () => {
  it("adds the V1.9.3 core card set with trace/tag and jack-out-lock coverage", () => {
    expect(ONR_V1_9_3_FINAL_CARD_IDS).toHaveLength(4);
    const expectedMechanics: Record<string, RegExp> = {
      "onr_v1_207_netwatch-operations-office": /trace/,
      "onr_v1_213_private-cybernet-police": /trace/,
      "onr_v1_251_jack-attack": /jack_out_lock/,
      "onr_v1_271_tko-2-0": /action_economy/,
    };
    for (const definitionId of ONR_V1_9_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedMechanics[definitionId]!,
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /damage_prevention|replacement|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.3 smoke decks and keeps V1.9.2 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v193CardReleaseGame("v193-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_235_data-naga"]).toBeDefined();
  });

  it("starts V1.9.3 agenda trace actions and keeps Jack Attack jack-out lock active for the run", () => {
    let state = toRunnerTurn(v193CardReleaseGame("v193-trace-jack-lock"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const netwatchAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_207_netwatch-operations-office",
    );
    const privatePoliceAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_213_private-cybernet-police",
    );
    removeEverywhere(state, netwatchAgendaId);
    removeEverywhere(state, privatePoliceAgendaId);
    state.corp.scoreArea.push(netwatchAgendaId, privatePoliceAgendaId);
    state.cardInstances[netwatchAgendaId] = {
      ...state.cardInstances[netwatchAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[privatePoliceAgendaId] = {
      ...state.cardInstances[privatePoliceAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinition(state, action) ===
          "onr_v1_207_netwatch-operations-office" &&
        action.payload?.agendaAbility === "netwatch_operations_office",
    );
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 2,
    });
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinition(state, action) ===
          "onr_v1_213_private-cybernet-police" &&
        action.payload?.agendaAbility === "private_cybernet_police",
    );
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 5,
    });
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(2);

    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "onr_v1_251_jack-attack");
    state = toRunnerTurnFromCorpMain(state);
    state.runner.clicks = 3;
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
        sourceDefinition(state, action) === "onr_v1_251_jack-attack",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.jackOutLockedForRun).toBe(true);
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).not.toContain("jack_out");

    let tkoState = toRunnerTurn(v193CardReleaseGame("v193-tko-next-action"));
    tkoState.runner.credits = 20;
    tkoState.corp.credits = 20;
    putCorpIceOnServer(tkoState, "rd", "onr_v1_271_tko-2-0");
    tkoState = apply(
      tkoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    tkoState = apply(
      tkoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tkoState, action) === "onr_v1_271_tko-2-0",
    );
    const clicksBeforeTkoSubroutine = tkoState.runner.clicks;
    tkoState = apply(
      tkoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tkoState.run).toBeUndefined();
    expect(tkoState.runner.clicks).toBe(
      Math.max(0, clicksBeforeTkoSubroutine - 1),
    );
  });
});

describe("V1.9.4 Mechanikpaket M", () => {
  it("adds the V1.9.4 core card set with tagged meat-damage agenda actions", () => {
    expect(ONR_V1_9_4_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_4_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /runner_is_tagged/,
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/damage/);
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.4 smoke decks and keeps V1.9.3 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_4_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_4_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v194CardReleaseGame("v194-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_251_jack-attack"]).toBeDefined();
  });

  it("resolves On-Call Solo Team and Strike Force Kali damage actions only while Runner is tagged", () => {
    let state = toRunnerTurn(v194CardReleaseGame("v194-tagged-damage"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const onCallAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_208_on-call-solo-team",
    );
    const kaliAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_217_strike-force-kali",
    );
    removeEverywhere(state, onCallAgendaId);
    removeEverywhere(state, kaliAgendaId);
    state.corp.scoreArea.push(onCallAgendaId, kaliAgendaId);
    state.cardInstances[onCallAgendaId] = {
      ...state.cardInstances[onCallAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[kaliAgendaId] = {
      ...state.cardInstances[kaliAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.runner.tags = 1;

    const gripBeforeOnCall = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinition(state, action) === "onr_v1_208_on-call-solo-team" &&
        action.payload?.agendaAbility === "on_call_solo_team",
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeOnCall);

    const gripBeforeKali = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        sourceDefinition(state, action) === "onr_v1_217_strike-force-kali" &&
        action.payload?.agendaAbility === "strike_force_kali",
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeKali);

    state.runner.tags = 0;
    const actionTypes = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.payload?.agendaAbility === "on_call_solo_team" ||
          action.payload?.agendaAbility === "strike_force_kali",
      )
      .map((action) => action.type);
    expect(actionTypes).toEqual([]);
  });
});

describe("V1.9.5 Mechanikpaket N", () => {
  it("adds the V1.9.5 core card set with agenda strength and asset credit mechanics", () => {
    expect(ONR_V1_9_5_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_5_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_219_superior-net-barriers"]?.mechanics.join(" "),
    ).toMatch(/ice_strength|strength_modifier/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_219_superior-net-barriers"]?.mechanics.join(" "),
    ).toMatch(/strength/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_308_acme-savings-and-loan"]?.mechanics.join(" "),
    ).toMatch(/credit/);
  });

  it("validates V1.9.5 smoke decks", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_5_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_5_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v195CardReleaseGame("v195-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
  });

  it("applies Superior Net Barriers wall strength and ACME credits deterministically", () => {
    let state = toRunnerTurn(v195CardReleaseGame("v195-static-and-asset"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const superiorId = moveCorpCardToHq(
      state,
      "onr_v1_219_superior-net-barriers",
    );
    removeEverywhere(state, superiorId);
    state.corp.scoreArea.push(superiorId);
    state.cardInstances[superiorId] = {
      ...state.cardInstances[superiorId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const rdWall = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === wallId);
    expect(rdWall?.strength).toBe(
      (DEMO_CARDS_BY_ID["onr_v1_279_wall-of-static"]?.strength ?? 0) + 1,
    );

    moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    state.corp.credits = 10;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    expect(state.corp.credits).toBe(13);

    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 1;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(14);
  });
});

describe("V1.9.6 Mechanikpaket O", () => {
  it("adds the V1.9.6 Data Raven core card and validates smoke decks", () => {
    expect(ONR_V1_9_6_FINAL_CARD_IDS).toHaveLength(1);
    const definition = DEMO_CARDS_BY_ID["onr_v1_236_data-raven"];
    expect(definition?.implementationStatus).toBe("playable_mvp");
    expect(definition?.mechanics.join(" ")).toMatch(/trace/);
    expect(definition?.mechanics.join(" ")).toMatch(/counter/);
    expect(definition?.mechanics.join(" ")).not.toMatch(
      /v2|matchmaking|ranking/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_6_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_6_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("adds a Data Raven counter after a successful trace and applies the next Runner-start tag", () => {
    let state = toRunnerTurn(v196CardReleaseGame("v196-data-raven"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const dataRavenId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_236_data-raven",
    );

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
        sourceDefinition(state, action) === "onr_v1_236_data-raven",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpBid =
      state.pendingChoice?.options.find((option) => option.id === "bid_0") ??
      state.pendingChoice?.options[0];
    expect(corpBid).toBeDefined();
    state = applyChoice(state, "corp", String(corpBid?.id));
    const runnerBid =
      state.pendingChoice?.options.find((option) => option.id === "bid_0") ??
      state.pendingChoice?.options[0];
    expect(runnerBid).toBeDefined();
    state = applyChoice(state, "runner", String(runnerBid?.id));

    expect(cardCounterAmount(state, dataRavenId, "power")).toBe(1);
    expect(state.runner.tags).toBe(1);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.tags).toBe(2);
  });
});

describe("V1.9.7 Mechanikpaket P", () => {
  it("adds Afreet as a playable daemon host and validates smoke decks", () => {
    expect(ONR_V1_9_7_FINAL_CARD_IDS).toHaveLength(1);
    const definition = DEMO_CARDS_BY_ID["onr_v1_001_afreet"];
    expect(definition?.implementationStatus).toBe("playable_mvp");
    expect(definition?.mechanics.join(" ")).toMatch(/host/);
    expect(definition?.mechanics.join(" ")).not.toMatch(
      /v2|matchmaking|ranking/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_7_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_7_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("installs Afreet through LegalActions and consumes runner memory", () => {
    let state = toRunnerTurn(v197CardReleaseGame("v197-afreet"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_001_afreet");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId === "onr_v1_001_afreet",
      ),
    ).toBe(true);
    expect(state.runner.memoryUsed).toBeGreaterThanOrEqual(1);
  });
});

describe("V1.9.8 Mechanikpaket Q", () => {
  it("adds Dogcatcher and Dropp as playable breaker longtail cards and validates smoke decks", () => {
    expect(ONR_V1_9_8_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_8_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/break/);
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/pump/);
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      validateDeckDefinition(ONR_V1_9_8_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_8_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("installs Dogcatcher and Dropp through LegalActions without leaking hidden Corp cards", () => {
    let state = toRunnerTurn(v198CardReleaseGame("v198-breakers"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_018_dogcatcher");
    moveRunnerCardToGrip(state, "onr_v1_019_dropp");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_018_dogcatcher",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_019_dropp",
    );
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId ===
          "onr_v1_018_dogcatcher",
      ),
    ).toBe(true);
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId === "onr_v1_019_dropp",
      ),
    ).toBe(true);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Hostile Takeover",
    );
  });
});

describe("V1.9.9 Mechanikpaket R", () => {
  it("adds the four V1.9.9 upgrade cards and validates smoke decks", () => {
    expect(ONR_V1_9_9_FINAL_CARD_IDS).toHaveLength(4);
    for (const definitionId of ONR_V1_9_9_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.type, definitionId).toBe("upgrade");
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_349_aardvark"]?.mechanics.join(" "),
    ).toMatch(/worm/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_351_bizarre-encryption-scheme"]?.mechanics.join(
        " ",
      ),
    ).toMatch(/delayed_agenda_score/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_352_chester-mix"]?.mechanics.join(" "),
    ).toMatch(/ice_install_cost_mod_server/);
    expect(DEMO_CARDS_BY_ID["onr_v1_353_chimera"]?.mechanics.join(" ")).toMatch(
      /daemon_trash_choice/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_9_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_9_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("lets Aardvark intercept a Worm use through a Corp choice and blocks later Worm use on that fort", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-aardvark"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const wormId = installRunnerProgramForTest(state, "onr_v1_074_worm");
    const aardvarkId = putCorpRootInRemote(state, "onr_v1_349_aardvark");
    const wallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
    );
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const replayStart = structuredClone(state);
    const replayEventOffset = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" && action.payload?.breakerId === wormId,
    );
    expect(state.pendingChoice?.source).toContain("v199.aardvark");
    expect(state.runner.credits).toBe(17);

    state = applyChoice(state, "corp", "rez_trash_worm");
    expect(state.cardInstances[aardvarkId]?.rezzed).toBe(true);
    expect(state.runner.heap).toContain(wormId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.breakerId === wormId,
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_349_aardvark",
      title: "Aardvark",
    });

    const replay = replayEvents(
      replayStart,
      state.eventLog.slice(replayEventOffset),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("delays agenda scoring after Bizarre Encryption Scheme is accessed and resolves it at Runner turn start", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-bizarre-encryption"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpRootInRemote(state, "onr_v1_351_bizarre-encryption-scheme");
    const agendaId = putCorpRootInRemote(state, "onr_v1_203_hostile-takeover");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.runner.scoreArea).not.toContain(agendaId);
    expect(state.bizarreEncryptionDelayedAgendas).toEqual([
      { agendaId, serverId: "remote_1" },
    ]);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.bizarreEncryptionDelayedAgendas).toBeUndefined();
  });

  it("reduces ICE install costs on Chester Mix forts only", () => {
    let state = createGameAfterSetup({
      seed: "v199-chester",
      baseline: MVP_0_99_BASELINE,
      runnerDeck: ONR_V1_9_9_RUNNER_DECK,
      corpDeck: ONR_V1_9_9_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    const chesterId = putCorpRootInRemote(state, "onr_v1_352_chester-mix");
    state.cardInstances[chesterId] = {
      ...state.cardInstances[chesterId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "remote_1", "onr_v1_279_wall-of-static");
    const iceId = moveCorpCardToHq(state, "simple_code_gate_ice");

    const install = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "ice",
    );
    expect(install.payload?.iceInstallBaseCost).toBe(1);
    expect(install.payload?.iceInstallReduction).toBe(1);
    expect(install.payload?.iceInstallTotalCost).toBe(0);
  });

  it("trashes a Runner daemon when Chimera is accessed and keeps the access flow legal", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-chimera"));
    state.runner.credits = 20;
    const afreetId = installRunnerProgramForTest(state, "onr_v1_001_afreet");
    putCorpRootInRemote(state, "onr_v1_353_chimera");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice?.source).toContain("v199.chimera_daemon_trash");
    state = applyChoice(state, "runner", `card_${afreetId}`);
    expect(state.runner.heap).toContain(afreetId);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "decline_trash",
      ),
    ).toBe(true);
  });
});

describe("V1.9.11 Hidden-Zone Search/Reveal/Reorder WIP", () => {
  it("adds first scoped V1.9.11 hidden-zone event definitions without pulling in later release cards", () => {
    const implementedWipIds = [
      "onr_v1_042_mouse",
      "onr_v1_058_seeya",
      "onr_v1_059_self-modifying-code",
      "onr_v1_087_forgotten-backup-chip",
      "onr_v1_088_fortress-respecification",
      "onr_v1_089_gideons-pawnshop",
      "onr_v1_092_ice-and-datas-guide-to-the-net",
      "onr_v1_099_mantis-fixer-at-large",
      "onr_v1_110_sneak-preview",
      "onr_v1_151_aujourdoui",
      "onr_v1_169_n-e-t-o",
      "onr_v1_175_ronin-around",
      "onr_v1_177_the-short-circuit",
      "onr_v1_194_corporate-downsizing",
      "onr_v1_250_ice-pick-willie",
      "onr_v1_272_too-many-doors",
    ];
    for (const definitionId of implementedWipIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics).toContain("hidden_zone_tool");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("resolves V1.9.11 stack search through a private PendingChoice, deterministic shuffle and replay-safe StateHash", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-search"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_087_forgotten-backup-chip",
    );
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.pendingChoice?.source).toContain("v098.search_stack");
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();

    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetProgramId);
    expect(state.runner.stack).not.toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "search_stack",
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("reveals only the intended public definition id for V1.9.11 reveal events", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-reveal"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(state, "onr_v1_110_sneak-preview");
    putRunnerCardOnTopOfStack(state, "simple_decoder");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_decoder",
      title: "Simple Decoder",
    });
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Forgotten Backup Chip",
    );
  });

  it("exposes one unrezzed server card via Fortress Respecification without opening opponent choices", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-expose"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_088_fortress-respecification",
    );
    putCorpRootInRemote(state, "simple_upgrade");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId &&
        action.payload?.serverId === "remote_1",
    );
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "expose",
      cardDefinitionId: "simple_upgrade",
      title: "Simple Upgrade",
      serverLabel: "Remote 1",
    });
  });

  it("uses installed V1.9.11 Runner helpers through LegalActions without exposing private choices to the Corp", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-installed-helpers"));
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_059_self-modifying-code");
    installRunnerResourceForTest(state, "onr_v1_175_ronin-around");
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1911HiddenZoneAbility ===
          "search_stack_program_to_grip",
    );
    expect(state.pendingChoice?.source).toContain("v1911.search_stack");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "search_stack",
    });

    putRunnerCardOnTopOfStack(state, "simple_decoder");
    putRunnerCardOnTopOfStack(state, "simple_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1911HiddenZoneAbility === "arrange_stack_top2",
    );
    expect(state.pendingChoice?.source).toContain("v1911.arrange_stack_top2");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("uses scored Corporate Downsizing to reveal only the R&D top definition", () => {
    let state = apply(
      v1911HiddenZoneGame("v1911-corporate-downsizing"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.clicks = 3;
    const agendaId = moveCorpCardToHq(state, "onr_v1_194_corporate-downsizing");
    removeEverywhere(state, agendaId);
    state.corp.scoreArea.push(agendaId);
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility ===
          "v1911_corporate_downsizing_reveal_rd_top",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reveal_rd_top",
      revealKind: "reveal",
      cardDefinitionId: "simple_economy_operation",
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "simple_economy_operation_",
    );
  });

  it("resolves Ice Pick Willie as a subroutine-bound public R&D top reveal", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-ice-pick-willie"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_250_ice-pick-willie");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

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
        sourceDefinition(state, action) === "onr_v1_250_ice-pick-willie",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reveal_rd_top",
      revealKind: "reveal",
      cardDefinitionId: "simple_economy_operation",
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "simple_economy_operation_",
    );
  });

  it("opens Too Many Doors R&D reorder only to the Corp and resolves replay-safe", () => {
    let state = toRunnerTurn(v1911HiddenZoneGame("v1911-too-many-doors"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_272_too-many-doors");
    const bottomChoiceId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    const topChoiceId = putCorpCardOnTopOfRd(
      state,
      "onr_v1_203_hostile-takeover",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

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
        sourceDefinition(state, action) === "onr_v1_272_too-many-doors",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(state.pendingChoice?.source).toContain("v1911.corp_rd_arrange_top2");
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.some(
        (option) => option.value === topChoiceId,
      ),
    ).toBe(true);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoices(state, "corp", [
      `card_${bottomChoiceId}`,
      `card_${topChoiceId}`,
    ]);
    expect(state.corp.rd[0]).toBe(bottomChoiceId);
    expect(state.corp.rd[1]).toBe(topChoiceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reorder_rd_top2",
      arrangedCount: 2,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.9.19 Agenda/Overadvance WIP", () => {
  it("adds all V1.9.19 WIP runtime definitions without release-promoting the next slice", () => {
    expect(ONR_V1_9_19_WIP_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_9_19_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /scored_agenda|agenda_difficulty|overadvance|counter|generic_asset_node|generic_upgrade_root_server/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("scores V1.9.19 overadvanced agendas with server-bound difficulty modifiers and replay-stable payloads", () => {
    let state = apply(
      v1919AgendaOveradvanceGame("v1919-overadvance-score"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_189_artificial-security-directors",
    );
    const rovingId = findCard(state, "onr_v1_368_roving-submarine");
    const server = state.corp.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    expect(server).toBeDefined();
    if (!server) throw new Error("Missing remote");
    removeEverywhere(state, rovingId);
    server.root.push(rovingId);
    state.cardInstances[rovingId] = {
      ...state.cardInstances[rovingId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      faceup: true,
      rezzed: true,
    };

    const initial = structuredClone(state);
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === agendaId,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        String(action.payload?.cardId) === agendaId,
    );

    expect(state.corp.scoreArea).toContain(agendaId);
    expect(cardCounterAmount(state, agendaId, "agenda")).toBe(1);
    const scoreEvent = state.eventLog.at(-1);
    expect(scoreEvent?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      v1919AgendaDifficulty: 2,
      v1919Overadvance: 3,
      v1919BonusAgendaPoints: 1,
      totalAgendaPoints: 2,
    });
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses V1.9.19 scored agenda reveal actions without leaking hidden R&D to the Runner before reveal", () => {
    let state = apply(
      v1919AgendaOveradvanceGame("v1919-scored-reveal"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === agendaId,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        String(action.payload?.cardId) === agendaId,
    );
    putCorpCardOnTopOfRd(state, "simple_agenda");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1919_scored_agenda_reveal_rd_top",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      revealKind: "reveal",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
  });

  it("uses V1.9.19 asset counter, economy and access-ambush paths through explicit actions", () => {
    let corpState = apply(
      v1919AgendaOveradvanceGame("v1919-asset-actions"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    corpState.corp.credits = 80;
    corpState.corp.clicks = 30;
    const chicagoId = putCorpRootInRemote(
      corpState,
      "onr_v1_312_chicago-branch",
    );
    const informationId = putCorpRootInRemote(
      corpState,
      "onr_v1_328_information-laundering",
    );
    corpState.cardInstances[chicagoId] = {
      ...corpState.cardInstances[chicagoId]!,
      faceup: true,
      rezzed: true,
    };
    corpState.cardInstances[informationId] = {
      ...corpState.cardInstances[informationId]!,
      faceup: true,
      rezzed: true,
    };

    corpState = apply(
      corpState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1919AssetAbility === "add_power_counter",
    );
    expect(cardCounterAmount(corpState, chicagoId, "power")).toBe(1);
    const beforeCredits = corpState.corp.credits;
    corpState = apply(
      corpState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1919AssetAbility === "gain_credits" &&
        String(action.payload?.cardId) === informationId,
    );
    expect(corpState.corp.credits).toBe(beforeCredits + 2);

    let accessState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-asset-ambush"),
    );
    accessState.runner.credits = 20;
    const programId = installRunnerProgramForTest(
      accessState,
      "simple_decoder",
    );
    const experimentalAiId = putCorpRootInRemote(
      accessState,
      "onr_v1_323_experimental-ai",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.runner.heap).toContain(programId);
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      trashedCardDefinitionId: "simple_decoder",
    });
    expect(accessState.eventLog.at(-1)?.visibilityClass).toBe(
      "hidden_info_barrier",
    );
    expect(accessState.run?.accessedCardId).toBe(experimentalAiId);
  });

  it("uses V1.9.19 operation advance, counter and forfeit-cost paths through play-operation actions", () => {
    let state = apply(
      v1919AgendaOveradvanceGame("v1919-operation-paths"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    moveCorpCardToHq(state, "onr_v1_300_project-consultants");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_300_project-consultants",
    );
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      v1919OperationAbility: "advance_installed_agenda",
      addedAdvancementCounters: 1,
    });

    moveCorpCardToHq(state, "onr_v1_291_falsified-transactions-expert");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_291_falsified-transactions-expert",
    );
    expect(cardCounterAmount(state, agendaId, "power")).toBe(1);

    const scoredAgendaId = findCard(state, "simple_agenda");
    removeEverywhere(state, scoredAgendaId);
    state.corp.scoreArea.push(scoredAgendaId);
    state.cardInstances[scoredAgendaId] = {
      ...state.cardInstances[scoredAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    moveCorpCardToHq(state, "onr_v1_304_systematic-layoffs");
    const creditsBeforeLayoffs = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_304_systematic-layoffs",
    );
    expect(state.specialZones?.removedFromGame).toContain(scoredAgendaId);
    expect(state.corp.credits).toBe(creditsBeforeLayoffs - 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      v1919OperationAbility: "forfeit_scored_agenda",
      agendaPointCostPaid: 2,
    });
  });

  it("resolves remaining V1.9.19 access ambush damage and installed-hardware paths", () => {
    let hardwareState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-corprunner-ambush"),
    );
    hardwareState.runner.credits = 20;
    const hardwareId = installRunnerHardwareForTest(
      hardwareState,
      "simple_setup_hardware",
    );
    putCorpRootInRemote(
      hardwareState,
      "onr_v1_315_corprunners-shattered-remains",
    );
    hardwareState = apply(
      hardwareState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    hardwareState = apply(
      hardwareState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(hardwareState.runner.heap).toContain(hardwareId);
    expect(hardwareState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_315_corprunners-shattered-remains",
    });

    let coreDamageState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-vacant-soulkiller"),
    );
    coreDamageState.runner.credits = 20;
    const coreBefore = coreDamageState.runner.coreDamage;
    putCorpRootInRemote(coreDamageState, "onr_v1_346_vacant-soulkiller");
    coreDamageState = apply(
      coreDamageState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    coreDamageState = apply(
      coreDamageState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(coreDamageState.runner.coreDamage).toBe(coreBefore + 1);
    expect(coreDamageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: "onr_v1_346_vacant-soulkiller",
      damageType: "core",
      damageAmount: 1,
    });

    let netDamageState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-virus-test-site"),
    );
    netDamageState.runner.credits = 20;
    const gripBefore = netDamageState.runner.grip.length;
    putCorpRootInRemote(netDamageState, "onr_v1_348_virus-test-site");
    netDamageState = apply(
      netDamageState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    netDamageState = apply(
      netDamageState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(netDamageState.runner.grip.length).toBe(Math.max(0, gripBefore - 2));
    expect(netDamageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: "onr_v1_348_virus-test-site",
      damageType: "net",
      damageAmount: 2,
    });
  });

  it("uses V1.9.19 Runner agenda-cost paths for Fait Accompli, Arasaka Owns You and Olivia Salazar", () => {
    let faitState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-fait-accompli"),
    );
    faitState.runner.credits = 20;
    const faitId = installRunnerProgramForTest(
      faitState,
      "onr_v1_025_fait-accompli",
    );
    scoreRunnerAgendaForTest(faitState, "simple_agenda");
    faitState = apply(
      faitState,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1919RunnerProgramAbility === "add_power_counter",
    );
    expect(cardCounterAmount(faitState, faitId, "power")).toBe(1);
    expect(faitState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1919RunnerProgramAbility: "add_power_counter",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });

    let arasakaState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-arasaka-owns-you"),
    );
    arasakaState.runner.credits = 20;
    arasakaState.runner.tags = 2;
    const arasakaCostAgendaId = scoreRunnerAgendaForTest(
      arasakaState,
      "simple_agenda",
    );
    moveRunnerCardToGrip(arasakaState, "onr_v1_078_arasaka-owns-you");
    arasakaState = apply(
      arasakaState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(arasakaState, action) ===
          "onr_v1_078_arasaka-owns-you",
    );
    expect(arasakaState.runner.tags).toBe(0);
    expect(arasakaState.runner.scoreArea).not.toContain(arasakaCostAgendaId);
    expect(arasakaState.specialZones?.removedFromGame).toContain(
      arasakaCostAgendaId,
    );
    expect(arasakaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      v1919RunnerEventAbility: "forfeit_agenda_remove_tags",
      agendaPointCostPaid: 1,
      removedTags: 2,
      runnerTagsAfter: 0,
    });

    let oliviaState = toRunnerTurn(
      v1919AgendaOveradvanceGame("v1919-olivia-salazar"),
    );
    oliviaState.runner.credits = 20;
    const oliviaCostAgendaId = scoreRunnerAgendaForTest(
      oliviaState,
      "simple_agenda",
    );
    const accessedAgendaId = putCorpRootInRemote(
      oliviaState,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    const oliviaId = putCorpRootInRemote(
      oliviaState,
      "onr_v1_363_olivia-salazar",
    );
    oliviaState.cardInstances[oliviaId] = {
      ...oliviaState.cardInstances[oliviaId]!,
      faceup: true,
      rezzed: true,
    };
    oliviaState = apply(
      oliviaState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    oliviaState = apply(
      oliviaState,
      "runner",
      (action) => action.type === "access_card",
    );
    oliviaState = apply(
      oliviaState,
      "runner",
      (action) =>
        action.type === "steal_agenda" &&
        action.payload?.v1919UpgradeAbility === "olivia_salazar_steal_cost",
    );
    expect(oliviaState.runner.scoreArea).not.toContain(oliviaCostAgendaId);
    expect(oliviaState.runner.scoreArea).toContain(accessedAgendaId);
    expect(oliviaState.specialZones?.removedFromGame).toContain(
      oliviaCostAgendaId,
    );
    expect(oliviaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "steal_agenda",
      v1919UpgradeAbility: "olivia_salazar_steal_cost",
      agendaPointCostPaid: 1,
      specialZoneReason: "v1919_olivia_salazar",
    });
  });
});

describe("V1.9.20 Global Modifier/Special-State WIP", () => {
  it("adds all V1.9.20 WIP runtime definitions without release-promoting V1.9.21", () => {
    expect(ONR_V1_9_20_WIP_CARD_IDS).toHaveLength(26);
    for (const definitionId of ONR_V1_9_20_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /persistent_special_state|action_economy|modify_hand_limit|modify_memory_limit|global_static_modifier/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("installs V1.9.20 MRAM hardware through legal actions and recomputes visible MU", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-mram-memory",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_133_militech-mram-chip");
    moveRunnerCardToGrip(state, "onr_v1_134_mram-chip");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const beforeLimit = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_133_militech-mram-chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeLimit + 2);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_134_mram-chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeLimit + 3);

    const runnerView = getPlayerView(state, "runner");
    expect(runnerView.own.memoryLimit).toBe(beforeLimit + 3);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_133_militech-mram-chip",
      )?.memoryLimitBonus,
    ).toBe(2);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_134_mram-chip",
      )?.memoryLimitBonus,
    ).toBe(1);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_133_militech-mram-chip",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses rezzed V1.9.20 action-economy assets through explicit legal actions", () => {
    for (const definitionId of [
      "onr_v1_335_remote-facility",
      "onr_v1_331_nevinyrral",
      "onr_v1_334_pacifica-regional-ai",
    ]) {
      let state = apply(
        createGameAfterSetup({
          seed: `v1920-asset-actions-${definitionId}`,
          runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      state.corp.clicks = 3;
      state.corp.maxHandSize = 100;

      const assetId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[assetId] = {
        ...state.cardInstances[assetId]!,
        faceup: true,
        rezzed: true,
      };
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const clicksBefore = state.corp.clicks;
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1920AssetAbility === "gain_actions" &&
          String(action.payload?.cardId) === assetId,
      );

      expect(state.corp.clicks, definitionId).toBe(clicksBefore + 1);
      expect(state.eventLog.at(-1)?.publicPayload, definitionId).toMatchObject({
        actionType: "gain_credit",
        v1920AssetAbility: "gain_actions",
        gainedActions: 2,
        corpClicksAfter: clicksBefore + 1,
      });
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
      );
      expect(
        getPlayerView(state, "runner").opponent.handCount,
        definitionId,
      ).toBe(state.corp.hq.length);
      expect(
        JSON.stringify(getPlayerView(state, "runner").opponent),
        definitionId,
      ).not.toContain("Simple Economy Operation");
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("rejects wrong-side and stale V1.9.20 action-economy asset actions", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-asset-actions-revalidation",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    const assetId = putCorpRootInRemote(state, "onr_v1_335_remote-facility");
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1920AssetAbility === "gain_actions" &&
        String(action.payload?.cardId) === assetId,
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1920-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1920-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
  });

  it("applies rezzed V1.9.20 global ICE rez-cost modifiers from public root sources", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-global-ice-cost",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.maxHandSize = 100;
    putCorpRootInRemote(state, "onr_v1_324_fortress-architects");
    putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_324_fortress-architects",
    );
    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    const wallRez = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    expect(wallRez.costs[0]?.credits).toBe(3);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === wallRez.actionId,
    );
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("projects V1.9.20 scored-agenda handlimit modifiers through PlayerViews", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-main-office-handlimit",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 5;

    moveCorpCardToHq(state, "onr_v1_205_main-office-relocation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_205_main-office-relocation",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_205_main-office-relocation",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_205_main-office-relocation",
    );

    expect(state.corp.maxHandSize).toBe(5);
    expect(getPlayerView(state, "corp").own.maxHandSize).toBe(6);
    expect(getPlayerView(state, "runner").opponent.maxHandSize).toBe(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Economy Operation"/,
    );
    expect(getPlayerView(state, "runner").opponent.handCount).toBe(
      state.corp.hq.length,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("tracks V1.9.20 persistent recurring state on installed Loan from Chiba", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-loan-persistent",
        baseline: MVP_0_99_BASELINE,
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_168_loan-from-chiba");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_168_loan-from-chiba",
    );
    const loanId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_168_loan-from-chiba",
    );
    expect(loanId).toBeDefined();
    if (!loanId) throw new Error("Missing Loan from Chiba");
    expect(cardCounterAmount(state, loanId, "recurring_credit")).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.definitionId === "onr_v1_168_loan-from-chiba",
      )?.counters?.recurring_credit,
    ).toBe(2);

    state.cardInstances[loanId] = {
      ...state.cardInstances[loanId]!,
      counters: {
        ...state.cardInstances[loanId]!.counters,
        recurring_credit: 0,
      },
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "runner"
    ) {
      state = applyChoice(
        state,
        "runner",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    expect(cardCounterAmount(state, loanId, "recurring_credit")).toBe(2);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.9.21 Deterministic Random WIP", () => {
  it("adds all V1.9.21 WIP runtime definitions without release-promoting V1.9.22", () => {
    expect(ONR_V1_9_21_WIP_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_9_21_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "deterministic_random",
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("records Schlaghund deterministic die probes through LegalAction and replay", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1921-schlaghund-die-probe",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1921_random_probe",
          name: "O:NR V1.9.21 Random Probe Corp",
          cards: [
            { id: "onr_v1_339_schlaghund", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;

    const assetId = putCorpRootInRemote(state, "onr_v1_339_schlaghund");
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1921AssetAbility === "deterministic_die_probe" &&
        String(action.payload?.cardId) === assetId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-schlaghund-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1921-schlaghund-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );

    const randomRecord = state.randomDrawRecords.at(-1);
    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(randomRecord?.purpose).toBe(
      "v1921.die.onr_v1_339_schlaghund.asset_probe",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1921AssetAbility: "deterministic_die_probe",
      randomPurpose: "v1921.die.onr_v1_339_schlaghund.asset_probe",
      randomCounterAfter: randomBefore + 1,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    expect(getPlayerView(state, "runner").opponent.handCount).toBe(
      state.corp.hq.length,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it("records Rio de Janeiro City Grid server die probes without leaking hidden zones", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1921-rio-server-die-probe",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1921_rio_random_probe",
          name: "O:NR V1.9.21 Rio Random Probe Corp",
          cards: [
            { id: "onr_v1_367_rio-de-janeiro-city-grid", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;

    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_367_rio-de-janeiro-city-grid",
    );
    state.cardInstances[upgradeId] = {
      ...state.cardInstances[upgradeId]!,
      faceup: true,
      rezzed: true,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1921UpgradeAbility ===
          "deterministic_server_die_probe" &&
        String(action.payload?.cardId) === upgradeId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-rio-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_367_rio-de-janeiro-city-grid.server_probe",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1921UpgradeAbility: "deterministic_server_die_probe",
      randomPurpose:
        "v1921.die.onr_v1_367_rio-de-janeiro-city-grid.server_probe",
      randomCounterAfter: randomBefore + 1,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it("records V1.9.21 runner program die probes through installed program actions", () => {
    for (const definitionId of ["onr_v1_002_ai-boon", "onr_v1_008_boardwalk"]) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1921-${definitionId}-program-die-probe`,
          runnerDeck: {
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
            id: `onr_v1_runner_v1921_${definitionId}_random_probe`,
            name: "O:NR V1.9.21 Program Random Probe Runner",
            cards: [
              { id: definitionId, quantity: 1 },
              ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
            ],
          },
          corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.runner.clicks = 3;
      state.runner.memoryLimit = 20;

      const programId = installRunnerProgramForTest(state, definitionId);
      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1921RunnerProgramAbility ===
            "deterministic_die_probe" &&
          String(action.payload?.cardId) === programId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1921-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const randomBefore = state.randomDrawRecords.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === legal.actionId,
      );

      const randomPurpose = `v1921.die.${definitionId}.program_probe`;
      expect(state.randomDrawRecords, definitionId).toHaveLength(
        randomBefore + 1,
      );
      expect(state.randomDrawRecords.at(-1)?.purpose, definitionId).toBe(
        randomPurpose,
      );
      expect(state.eventLog.at(-1)?.publicPayload, definitionId).toMatchObject({
        actionType: "gain_credit",
        v1921RunnerProgramAbility: "deterministic_die_probe",
        randomPurpose,
        randomCounterAfter: randomBefore + 1,
      });
      const publicRoll = Number(
        state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
      );
      expect(Number.isInteger(publicRoll), definitionId).toBe(true);
      expect(publicRoll, definitionId).toBeGreaterThanOrEqual(1);
      expect(publicRoll, definitionId).toBeLessThanOrEqual(6);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(replay.actualFinalStateHash, definitionId).toBe(hashState(state));
      expect(replay.state.randomDrawRecords, definitionId).toEqual(
        state.randomDrawRecords,
      );
    }
  });

  it("records Playful AI event die probes through play_event replay", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1921-playful-ai-event-die-probe",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1921_playful_ai_random_probe",
          name: "O:NR V1.9.21 Playful AI Random Probe Runner",
          cards: [
            { id: "onr_v1_104_playful-ai", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;

    const eventId = moveRunnerCardToGrip(state, "onr_v1_104_playful-ai");
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-playful-ai-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.runner.heap).toContain(eventId);
    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_104_playful-ai.event_probe",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      v1921RunnerEventAbility: "deterministic_die_probe",
      randomPurpose: "v1921.die.onr_v1_104_playful-ai.event_probe",
      randomCounterAfter: randomBefore + 1,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it("records Quest for Cattekin resource die probes through installed resource actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1921-quest-for-cattekin-resource-die-probe",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1921_quest_random_probe",
          name: "O:NR V1.9.21 Quest Random Probe Runner",
          cards: [
            { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;

    const resourceId = installRunnerResourceForTest(
      state,
      "onr_v1_172_quest-for-cattekin",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1921RunnerResourceAbility ===
          "deterministic_die_probe" &&
        String(action.payload?.cardId) === resourceId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-quest-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_172_quest-for-cattekin.resource_probe",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1921RunnerResourceAbility: "deterministic_die_probe",
      randomPurpose: "v1921.die.onr_v1_172_quest-for-cattekin.resource_probe",
      randomCounterAfter: randomBefore + 1,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });
});

describe("V1.9.12 Counter/Virus/Recurring", () => {
  it("adds scoped V1.9.12 definitions without pulling in later cursor cards", () => {
    expect(ONR_V1_9_12_RELEASE_CARD_IDS).toHaveLength(11);
    for (const definitionId of ONR_V1_9_12_RELEASE_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /counter|virus|recurring|hidden_zone/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("installs V1.9.12 virus and recurring cards, purges only virus counters and refreshes recurring pools", () => {
    let state = toRunnerTurn(
      v1912CounterRecurringGame("v1912-virus-recurring"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_009_butcher-boy");
    moveRunnerCardToGrip(state, "onr_v1_174_rigged-investments");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_009_butcher-boy",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_174_rigged-investments",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const butcherId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_009_butcher-boy",
    );
    const investmentsId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_174_rigged-investments",
    );
    expect(butcherId).toBeDefined();
    expect(investmentsId).toBeDefined();
    if (butcherId) {
      expect(state.cardInstances[butcherId]?.counters?.virus).toBe(1);
      expect(state.cardInstances[butcherId]?.counters?.recurring_credit).toBe(
        1,
      );
    }
    if (investmentsId)
      expect(
        state.cardInstances[investmentsId]?.counters?.recurring_credit,
      ).toBe(2);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    if (butcherId) {
      expect(state.cardInstances[butcherId]?.counters?.virus ?? 0).toBe(0);
      expect(state.cardInstances[butcherId]?.counters?.recurring_credit).toBe(
        1,
      );
    }
    if (investmentsId) {
      expect(
        state.cardInstances[investmentsId]?.counters?.recurring_credit,
      ).toBe(2);
      state.cardInstances[investmentsId] = {
        ...state.cardInstances[investmentsId]!,
        counters: {
          ...state.cardInstances[investmentsId]!.counters,
          recurring_credit: 0,
        },
      };
    }

    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (investmentsId)
      expect(
        state.cardInstances[investmentsId]?.counters?.recurring_credit,
      ).toBe(2);
  });

  it("uses V1.9.12 Hidden-Zone event and installed helper paths without exposing choices to the Corp", () => {
    let state = toRunnerTurn(v1912CounterRecurringGame("v1912-hidden-zone"));
    state.runner.credits = 20;
    const dealId = moveRunnerCardToGrip(state, "onr_v1_082_deal-with-militech");
    const iSpyId = moveRunnerCardToGrip(state, "onr_v1_032_i-spy");
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === iSpyId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === dealId,
    );
    expect(state.pendingChoice?.source).toContain("v1912.search_stack");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetProgramId);

    putRunnerCardOnTopOfStack(state, "simple_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1912CounterAbility === "reveal_stack_top",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_fracter",
    });
  });

  it("scores V1.9.12 Corp agendas with typed counter and start-of-turn economy paths", () => {
    let state = apply(
      v1912CounterRecurringGame("v1912-corp-agendas"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_198_detroit-police-contract");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_198_detroit-police-contract" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1)
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_198_detroit-police-contract",
      );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) ===
          "onr_v1_198_detroit-police-contract",
    );
    const detroitId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_198_detroit-police-contract",
    );
    expect(detroitId).toBeDefined();
    if (detroitId)
      expect(state.cardInstances[detroitId]?.counters?.power).toBe(4);
    const beforeCredit = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1912_detroit_police_contract",
    );
    expect(state.corp.credits).toBe(beforeCredit + 1);
    if (detroitId)
      expect(state.cardInstances[detroitId]?.counters?.power).toBe(3);
  });
});

describe("V1.9.13 Damage/Prevention/Replacement Longtail", () => {
  it("adds scoped V1.9.13 runtime definitions without pulling in V1.9.15 cards", () => {
    expect(ONR_V1_9_13_RELEASE_CARD_IDS).toHaveLength(17);
    for (const definitionId of ONR_V1_9_13_RELEASE_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /damage|prevention|event_modification|flatline/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("installs V1.9.13 Runner prevention cards through legal install actions", () => {
    let state = toRunnerTurn(
      v1913DamagePreventionGame("v1913-install-prevention"),
    );
    state.runner.credits = 80;
    state.runner.clicks = 30;

    for (const definitionId of ONR_V1_9_13_RELEASE_CARD_IDS.filter(
      (id) =>
        ![
          "onr_v1_224_bolter-cluster",
          "onr_v1_234_data-darts",
          "onr_v1_258_neural-blade",
        ].includes(id),
    )) {
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
    }

    const installedDefinitions = [
      ...state.runner.rig.programs,
      ...state.runner.rig.hardware,
      ...state.runner.rig.resources,
    ].map((id) => state.cardInstances[id]?.definitionId);
    expect(installedDefinitions).toEqual(
      expect.arrayContaining(
        ONR_V1_9_13_RELEASE_CARD_IDS.filter((id) => !id.startsWith("onr_v1_2")),
      ),
    );
  });

  it("opens side-safe prevention choices for Corp ICE net damage and replays the resolved StateHash", () => {
    let state = toRunnerTurn(v1913DamagePreventionGame("v1913-ice-prevention"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_128_green-knight-surge-buffers");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_128_green-knight-surge-buffers",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_258_neural-blade");
    putCorpCardOnTopOfRd(state, "simple_agenda");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
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
        sourceDefinition(state, action) === "onr_v1_258_neural-blade",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventOptionId));
    expect(state.runner.heap.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      preventedAmount: 2,
      damageAmount: 0,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("MVP 0.95 Resources and tag interaction", () => {
  it("installs a local Resource through LegalActions and shows it publicly", () => {
    let state = toRunnerTurn(v095ResourceGame("v095-install-resource"));
    state.runner.credits = 6;
    moveRunnerCardToGrip(state, "v095_safehouse_resource");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v095_safehouse_resource",
    );

    expect(state.baseline.engineSchemaVersion).toBe("0.95.0");
    expect(state.runner.credits).toBe(4);
    expect(
      state.runner.rig.resources.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toEqual(["v095_safehouse_resource"]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource",
      zoneLabel: "Resource",
    });

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    expect(
      runnerView.own.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(
      corpView.opponent.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(JSON.stringify(corpView)).not.toContain("Simple Fracter");
  });

  it("lets the Corp trash an installed Resource only while the Runner is tagged", () => {
    let state = installedResourceCorpTurn("v095-trash-resource");
    const resourceId = state.runner.rig.resources[0]!;
    const beforeHash = hashState(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === resourceId,
    );

    expect(hashState(state)).not.toBe(beforeHash);
    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(3);
    expect(state.runner.rig.resources).toHaveLength(0);
    expect(state.runner.heap).toContain(resourceId);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trash_resource",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource",
      zoneLabel: "Resource",
    });
  });

  it("rejects Resource trash without tags, stale state or installed Resource target", () => {
    const tagged = installedResourceCorpTurn("v095-trash-revalidate");
    const trashAction = mustAction(
      tagged,
      "corp",
      (action) => action.type === "trash_resource",
    );
    const untagged = structuredClone(tagged);
    untagged.runner.tags = 0;

    expect(
      getLegalActions(untagged, "corp").some(
        (action) => action.type === "trash_resource",
      ),
    ).toBe(false);
    expect(
      applyAction(untagged, {
        matchId: untagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: untagged.stateVersion,
      }).ok,
    ).toBe(false);
    expect(
      applyAction(tagged, {
        matchId: tagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: tagged.stateVersion - 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    const missingTarget = structuredClone(tagged);
    removeEverywhere(missingTarget, String(trashAction.payload?.resourceId));
    expect(
      getLegalActions(missingTarget, "corp").some(
        (action) => action.type === "trash_resource",
      ),
    ).toBe(false);
  });

  it("replays Resource install and trash with deterministic StateHash and no new randomness", () => {
    const initial = installedResourceCorpTurn("v095-replay-resource");
    const randomBefore = initial.randomDrawRecords.length;
    let state = apply(
      initial,
      "corp",
      (action) => action.type === "trash_resource",
    );

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
  });

  it("does not expose V0.96+ mechanics while enabling Resources", () => {
    const state = toRunnerTurn(v095ResourceGame("v095-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "trace",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "prevention",
    );
  });
});

describe("MVP 0.96 Trace, Link and Bidding", () => {
  it("starts a public trace, resolves Corp and Runner bids, and applies add_tag on success", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-success"));
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

    expect(state.baseline.engineSchemaVersion).toBe("0.96.0");
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 2,
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      traceStarted: true,
      sourceDefinitionId: "v096_trace_probe_ice",
      baseTraceStrength: 2,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.corp.credits).toBe(4);
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 3,
      runnerLink: 0,
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      corpBid: 1,
      traceStrength: 3,
      runnerLink: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.credits).toBe(5);
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      runnerBid: 0,
      runnerStrength: 0,
      traceSuccessful: true,
      tagsAdded: 1,
    });
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(false);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
  });

  it("fails the trace on tie and leaves the Runner untagged", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-tie"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 6;
    state.runner.credits = 4;

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
    state = applyChoice(state, "runner", "bid_3");

    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStrength: 2,
      runnerStrength: 3,
      traceSuccessful: false,
      tagsAdded: 0,
    });
  });

  it("rejects wrong-side, stale and illegal bid choices", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-illegal"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 5;

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
    const corpChoiceAction = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_0"],
        },
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_0"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: "wrong_choice",
          selectedOptionIds: ["bid_0"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: ["bid_99"],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
  });

  it("replays Trace bids with deterministic StateHash and no new randomness", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-replay"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;
    const initial = structuredClone(state);
    const randomBefore = state.randomDrawRecords.length;

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
    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Fracter",
    );
  });

  it("does not expose V0.97+ mechanics while enabling Trace", () => {
    const state = toRunnerTurn(v096TraceGame("v096-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).toContain("trace");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "multiaccess",
    );
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain(
      "prevention",
    );
  });
});

describe("V1.9.14 Trace/Tag/Resource Longtail", () => {
  it("adds all V1.9.14 WIP runtime definitions without pulling in V1.9.15 cards", () => {
    expect(ONR_V1_9_14_WIP_CARD_IDS).toHaveLength(25);
    for (const definitionId of ONR_V1_9_14_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /trace|link|tag|resource|damage|hidden_zone|counter/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("starts an unpromoted V1.9.14 Corp ICE trace through the existing side-safe bid window", () => {
    let state = toRunnerTurn(v096TraceGame("v1914-asp-trace-wip"));
    const aspInstanceId = "v1914_asp_instance" as CardInstanceId;
    const rd = state.corp.servers.find((server) => server.id === "rd");
    expect(rd).toBeDefined();
    if (!rd) throw new Error("Missing R&D server");
    rd.ice.unshift(aspInstanceId);
    state.cardInstances[aspInstanceId] = {
      instanceId: aspInstanceId,
      definitionId: "onr_v1_221_asp",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
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
        sourceDefinition(state, action) === "onr_v1_221_asp",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(DEMO_CARDS_BY_ID["onr_v1_221_asp"]?.mechanics).toEqual(
      expect.arrayContaining(["trace", "link", "bid_amount", "add_tag"]),
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 5,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 6,
      runnerLink: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 1,
    });
  });

  it("runs each V1.9.14 Trace ICE through the side-safe bid window", () => {
    const traceIce = [
      ["onr_v1_221_asp", 5],
      ["onr_v1_228_cinderella", 6],
      ["onr_v1_240_fang", 4],
      ["onr_v1_241_fang-2-0", 5],
      ["onr_v1_248_homewrecker", 5],
      ["onr_v1_260_pocket-virtual-reality", 6],
      ["onr_v1_264_rex", 3],
    ] as const;

    for (const [definitionId, baseTraceStrength] of traceIce) {
      let state = toRunnerTurn(
        v1914TraceTagResourceGame(`v1914-trace-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 9;
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.pendingChoice?.side, definitionId).toBe("corp");
      expect(state.pendingChoice?.kind, definitionId).toBe("bid_amount");
      expect(
        getPlayerView(state, "runner").pendingChoice,
        definitionId,
      ).toBeUndefined();
      expect(state.trace, definitionId).toMatchObject({
        status: "corp_bid",
        baseTraceStrength,
      });
    }
  });

  it("installs V1.9.14 Runner cards, counts installed link, and keeps Resource trash legal-action gated", () => {
    for (const definitionId of ONR_V1_9_14_RUNNER_CARD_IDS) {
      let state = toRunnerTurn(
        v1914TraceTagResourceGame(`v1914-install-${definitionId}`),
      );
      state.runner.credits = 12;
      state.runner.memoryLimit = 8;
      state.runner.tags = 1;
      moveRunnerCardToGrip(state, definitionId);

      const definition = DEMO_CARDS_BY_ID[definitionId];
      const actionType =
        definition?.type === "event" ? "play_event" : "install_card";
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === actionType &&
          sourceDefinition(state, action) === definitionId,
      );

      const installed =
        definition?.type === "event"
          ? state.runner.heap.some(
              (cardId) =>
                state.cardInstances[cardId]?.definitionId === definitionId,
            )
          : [
              ...state.runner.rig.programs,
              ...state.runner.rig.hardware,
              ...state.runner.rig.resources,
            ].some(
              (cardId) =>
                state.cardInstances[cardId]?.definitionId === definitionId,
            );
      expect(installed, definitionId).toBe(true);
      if (definition?.type === "event")
        expect(state.runner.tags, definitionId).toBe(0);
      if (definition?.type === "program")
        expect(state.runner.memoryUsed, definitionId).toBeGreaterThan(0);
    }

    let linkState = toRunnerTurn(
      v1914TraceTagResourceGame("v1914-installed-link"),
    );
    linkState.runner.credits = 12;
    linkState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(linkState, "onr_v1_132_microtech-trode-set");
    linkState = apply(
      linkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(linkState, action) ===
          "onr_v1_132_microtech-trode-set",
    );
    putCorpIceOnServer(linkState, "rd", "onr_v1_221_asp");
    linkState.corp.credits = 9;
    linkState = apply(
      linkState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    linkState = apply(
      linkState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(linkState, action) === "onr_v1_221_asp",
    );
    linkState = apply(
      linkState,
      "runner",
      (action) => action.type === "continue_run",
    );
    linkState = applyChoice(linkState, "corp", "bid_0");
    expect(linkState.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 1,
    });

    let resourceState = toRunnerTurn(
      v1914TraceTagResourceGame("v1914-resource-trash"),
    );
    resourceState.runner.credits = 12;
    resourceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(resourceState, "onr_v1_154_broker");
    resourceState = apply(
      resourceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(resourceState, action) === "onr_v1_154_broker",
    );
    const brokerId = resourceState.runner.rig.resources.find(
      (cardId) =>
        resourceState.cardInstances[cardId]?.definitionId ===
        "onr_v1_154_broker",
    );
    expect(brokerId).toBeDefined();
    resourceState.runner.tags = 1;
    resourceState = apply(
      resourceState,
      "runner",
      (action) => action.type === "end_turn",
    );
    resourceState = apply(
      resourceState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    resourceState.corp.credits = 6;
    resourceState = apply(
      resourceState,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === brokerId,
    );
    expect(resourceState.runner.rig.resources).not.toContain(brokerId);
    expect(resourceState.runner.heap).toContain(brokerId);
  });

  it("gates Power Grid Overload on visible tags and installed Runner hardware", () => {
    let state = toRunnerTurn(
      v1914TraceTagResourceGame("v1914-power-grid-overload"),
    );
    state.runner.credits = 12;
    state.runner.memoryLimit = 8;
    moveRunnerCardToGrip(state, "onr_v1_120_armadillo-armored-road-home");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_120_armadillo-armored-road-home",
    );
    const hardwareId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_120_armadillo-armored-road-home",
    );
    expect(hardwareId).toBeDefined();
    const operationId = moveCorpCardToHq(
      state,
      "onr_v1_299_power-grid-overload",
    );

    let untagged = apply(
      state,
      "runner",
      (action) => action.type === "end_turn",
    );
    untagged = apply(
      untagged,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    untagged.corp.credits = 6;
    expect(
      getLegalActions(untagged, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          action.payload?.cardId === operationId,
      ),
    ).toBe(false);

    let tagged = structuredClone(state);
    tagged.runner.tags = 1;
    tagged = apply(tagged, "runner", (action) => action.type === "end_turn");
    tagged = apply(
      tagged,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    tagged.corp.credits = 6;
    tagged = apply(
      tagged,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(tagged, action) === "onr_v1_299_power-grid-overload",
    );
    expect(tagged.runner.rig.hardware).not.toContain(hardwareId);
    expect(tagged.runner.heap).toContain(hardwareId);
    expect(tagged.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
    });
  });
});

describe("V1.9.15 Run/Access/Multiaccess WIP", () => {
  it("adds all V1.9.15 WIP runtime definitions without pulling in V1.9.16 cards", () => {
    expect(ONR_V1_9_15_WIP_CARD_IDS).toHaveLength(14);
    for (const definitionId of ONR_V1_9_15_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /run_flow|access|multiaccess|trace|hidden_zone|counter|recurring|damage/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("routes V1.9.15 Runner events through LegalAction-only run and access paths", () => {
    const eventExpectations = [
      {
        definitionId: "onr_v1_098_lucidrine-booster-drug",
        serverId: "archives",
        accessCount: 1,
      },
      {
        definitionId: "onr_v1_105_priority-wreck",
        serverId: "rd",
        accessCount: 2,
      },
      {
        definitionId: "onr_v1_111_social-engineering",
        serverId: "hq",
        accessCount: 1,
      },
      {
        definitionId: "onr_v1_112_stumble-through-wilderspace",
        serverId: "rd",
        accessCount: 1,
      },
    ] as const;

    for (const expectation of eventExpectations) {
      let state = toRunnerTurn(
        v1915RunAccessGame(`v1915-event-${expectation.definitionId}`),
      );
      state.runner.credits = 8;
      moveRunnerCardToGrip(state, expectation.definitionId);

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) === expectation.definitionId &&
          action.payload?.serverId === expectation.serverId,
      );

      expect(state.run?.attackedServerId, expectation.definitionId).toBe(
        expectation.serverId,
      );
      expect(state.run?.accessCount, expectation.definitionId).toBe(
        expectation.accessCount,
      );
      expect(
        state.eventLog.at(-1)?.publicPayload,
        expectation.definitionId,
      ).toMatchObject({ actionType: "play_event" });
    }
  });

  it("breaches R&D with Priority Wreck multiaccess without leaking future queued cards", () => {
    let state = toRunnerTurn(
      v1915RunAccessGame("v1915-priority-wreck-rd-multiaccess"),
    );
    state.runner.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_105_priority-wreck");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_105_priority-wreck" &&
        action.payload?.serverId === "rd",
    );

    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.run?.breach).toMatchObject({
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Economy Operation",
    );

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );

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
  });

  it("applies installed V1.9.15 run and access helpers through existing breach paths", () => {
    let state = toRunnerTurn(
      v1915RunAccessGame("v1915-installed-access-helpers"),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 12;
    for (const definitionId of [
      "onr_v1_020_dupre",
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_041_microtech-ai-interface",
      "onr_v1_043_mystery-box",
      "onr_v1_062_shredder-uplink-protocol",
      "onr_v1_065_smarteye",
      "onr_v1_142_record-reconstructor",
    ] as const) {
      moveRunnerCardToGrip(state, definitionId);
      state.runner.clicks = 10;
      state.runner.credits = 20;
      const title = DEMO_CARDS_BY_ID[definitionId]?.title;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          (!title || action.label.includes(title)),
      );
    }
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpCardOnTopOfRd(state, "simple_economy_asset");

    const dupreId = state.runner.rig.programs.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === "onr_v1_020_dupre",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(dupreId ? state.cardInstances[dupreId]?.counters?.power : 0).toBe(1);
    expect(state.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1915_installed_access_reveal",
    });
  });

  it("keeps V1.9.15 ICE overlaps side-safe through trace and damage windows", () => {
    for (const [definitionId, baseTraceStrength] of [
      ["onr_v1_227_cerberus", 5],
      ["onr_v1_255_mastiff", 5],
    ] as const) {
      let state = toRunnerTurn(v1915RunAccessGame(`v1915-ice-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 12;
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.pendingChoice?.side, definitionId).toBe("corp");
      expect(state.pendingChoice?.kind, definitionId).toBe("bid_amount");
      expect(
        getPlayerView(state, "runner").pendingChoice,
        definitionId,
      ).toBeUndefined();
      expect(state.trace, definitionId).toMatchObject({
        status: "corp_bid",
        baseTraceStrength,
      });
    }
  });

  it("allows New Blood only after a visible Runner run attempt last turn", () => {
    let noRun = toRunnerTurn(v1915RunAccessGame("v1915-new-blood-no-run"));
    const noRunOperationId = moveCorpCardToHq(noRun, "onr_v1_294_new-blood");
    noRun = apply(noRun, "runner", (action) => action.type === "end_turn");
    noRun = apply(noRun, "corp", (action) => action.type === "mandatory_draw");
    noRun.corp.credits = 6;
    expect(
      getLegalActions(noRun, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          action.payload?.cardId === noRunOperationId,
      ),
    ).toBe(false);

    let state = toRunnerTurn(v1915RunAccessGame("v1915-new-blood-after-run"));
    moveCorpCardToHq(state, "onr_v1_294_new-blood");
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.run).toBeUndefined();
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 6;

    const beforeCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_294_new-blood",
    );
    expect(state.corp.credits).toBe(beforeCredits + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
    });
  });
});

describe("V1.9.16 Program Subtype/Hosting/Stealth WIP", () => {
  it("adds all V1.9.16 WIP runtime definitions without release-promoting the next slice", () => {
    expect(ONR_V1_9_16_WIP_CARD_IDS).toHaveLength(16);
    for (const definitionId of ONR_V1_9_16_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /memory|base_link|trace|stealth|hosting|trash_installed_program/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("uses installed V1.9.16 link cards in side-safe trace windows", () => {
    let state = toRunnerTurn(v1916ProgramSubtypeGame("v1916-link-trace"));
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_003_baedekers-net-map");
    moveRunnerCardToGrip(state, "onr_v1_148_access-through-alpha");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_003_baedekers-net-map",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_148_access-through-alpha",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");

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
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.side).toBe("corp");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 4,
    });

    state = applyChoice(state, "corp", "bid_1");

    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 5,
      runnerLink: 2,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").pendingChoice?.kind).toBe(
      "bid_amount",
    );
  });

  it("refreshes V1.9.16 stealth and recurring counters without accumulation", () => {
    let state = toRunnerTurn(
      v1916ProgramSubtypeGame("v1916-stealth-recurring"),
    );
    state.runner.credits = 12;
    moveRunnerCardToGrip(state, "onr_v1_035_invisibility");
    moveRunnerCardToGrip(state, "onr_v1_140_raven-microcyb-eagle");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_035_invisibility",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_140_raven-microcyb-eagle",
    );

    const invisibilityId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_035_invisibility",
    );
    const eagleId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_140_raven-microcyb-eagle",
    );
    expect(invisibilityId).toBeDefined();
    expect(eagleId).toBeDefined();
    if (!invisibilityId || !eagleId)
      throw new Error("Missing installed V1.9.16 recurring cards");
    expect(
      state.cardInstances[invisibilityId]?.counters?.recurring_credit,
    ).toBe(1);
    expect(state.cardInstances[eagleId]?.counters?.recurring_credit).toBe(1);

    state.cardInstances[invisibilityId] = {
      ...state.cardInstances[invisibilityId]!,
      counters: {
        ...state.cardInstances[invisibilityId]!.counters,
        recurring_credit: 0,
      },
    };
    state.cardInstances[eagleId] = {
      ...state.cardInstances[eagleId]!,
      counters: {
        ...state.cardInstances[eagleId]!.counters,
        recurring_credit: 0,
      },
    };
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(
      state.cardInstances[invisibilityId]?.counters?.recurring_credit,
    ).toBe(1);
    expect(state.cardInstances[eagleId]?.counters?.recurring_credit).toBe(1);
  });

  it("hosts V1.9.16 programs on Imp and keeps hosted-card trash deterministic", () => {
    let state = toRunnerTurn(
      v1916ProgramSubtypeGame("v1916-imp-hosting-lifecycle"),
    );
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_033_imp");
    moveRunnerCardToGrip(state, "onr_v1_004_bakdoor");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_033_imp",
    );
    const impId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_033_imp",
    );
    expect(impId).toBeDefined();
    if (!impId) throw new Error("Missing installed Imp host");

    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_004_bakdoor" &&
        action.payload?.hostOnCardId === impId,
    );
    const bakdoorId = String(hostedInstall.payload?.cardId ?? "");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );

    expect(state.cardInstances[bakdoorId]?.hostedOn).toBe(impId);
    expect(state.runner.memoryUsed).toBe(1);
    expect(
      getPlayerView(state, "runner").own.rig?.some(
        (card) => card.instanceId === bakdoorId && card.hostedOn === impId,
      ),
    ).toBe(true);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.instanceId === bakdoorId && card.hostedOn === impId,
      ),
    ).toBe(true);

    const dArcKnightId = "v1916_imp_host_trash_ice" as CardInstanceId;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice.unshift(dArcKnightId);
    state.cardInstances[dArcKnightId] = {
      instanceId: dArcKnightId,
      definitionId: "onr_v1_233_d-arc-knight",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const initial = structuredClone(state);

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
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.rig.programs).toContain(impId);
    expect(state.runner.rig.programs).not.toContain(bakdoorId);
    expect(state.runner.heap).toContain(bakdoorId);
    expect(state.cardInstances[bakdoorId]?.hostedOn).toBeUndefined();
    expect(state.runner.memoryUsed).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("gates Fragmentation Storm program trash and net damage on trace success", () => {
    let state = toRunnerTurn(
      v1916ProgramSubtypeGame("v1916-fragmentation-storm-success"),
    );
    state.runner.credits = 10;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_047_pile-driver");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_047_pile-driver",
    );
    const pileDriverId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_047_pile-driver",
    );
    expect(pileDriverId).toBeDefined();
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    const gripBeforeDamage = state.runner.grip.length;
    const initial = structuredClone(state);

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
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 0,
    });
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(pileDriverId && state.runner.heap.includes(pileDriverId)).toBe(true);
    expect(state.runner.grip.length).toBe(Math.max(0, gripBeforeDamage - 1));
    expect(validateGameState(state).ok).toBe(true);
    const successReplay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(successReplay.ok).toBe(true);
    expect(successReplay.actualFinalStateHash).toBe(hashState(state));

    let failed = initial;
    failed.runner.credits = 10;
    failed = apply(
      failed,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    failed = apply(
      failed,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(failed, action) === "onr_v1_246_fragmentation-storm",
    );
    failed = apply(
      failed,
      "runner",
      (action) => action.type === "continue_run",
    );
    failed = applyChoice(failed, "corp", "bid_0");
    failed = applyChoice(failed, "runner", "bid_4");
    failed = apply(
      failed,
      "runner",
      (action) => action.type === "continue_run",
    );

    expect(
      pileDriverId && failed.runner.rig.programs.includes(pileDriverId),
    ).toBe(true);
    expect(failed.runner.grip.length).toBe(gripBeforeDamage);
    expect(validateGameState(failed).ok).toBe(true);
    const failedReplay = replayEvents(
      initial,
      failed.eventLog.slice(initial.eventLog.length),
    );
    expect(failedReplay.ok).toBe(true);
    expect(failedReplay.actualFinalStateHash).toBe(hashState(failed));
  });
});

describe("V1.9.17 Generic Asset/Node WIP", () => {
  it("adds all V1.9.17 WIP runtime definitions without release-promoting the next slice", () => {
    expect(ONR_V1_9_17_WIP_CARD_IDS).toHaveLength(18);
    for (const definitionId of ONR_V1_9_17_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("corp");
      expect(definition?.type, definitionId).toBe("asset");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /generic_asset_node|access_ambush|trace|hosting|recurring|damage|hidden_zone/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("keeps generic V1.9.17 asset install, rez, access and trash side-safe", () => {
    let state = v1917GenericAssetGame("v1917-generic-asset-install-rez-access");
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const assetId = moveCorpCardToHq(state, "onr_v1_321_esa-contract");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === assetId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_321_esa-contract",
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(assetId),
    );
    expect(remote?.id).toBe("remote_1");
    expect(state.cardInstances[assetId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === assetId)?.definitionId,
    ).toBe("onr_v1_321_esa-contract");

    const creditsBeforeAbility = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1917AssetAbility === "gain_credits" &&
        action.payload?.cardId === assetId,
    );
    expect(state.corp.credits).toBe(creditsBeforeAbility + 2);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: "onr_v1_321_esa-contract",
      amount: 2,
    });

    let accessState = toRunnerTurn(
      v1917GenericAssetGame("v1917-generic-asset-access-trash"),
    );
    accessState.runner.credits = 10;
    const accessedAssetId = putCorpRootInRemote(
      accessState,
      "onr_v1_321_esa-contract",
    );
    accessState.cardInstances[accessedAssetId] = {
      ...accessState.cardInstances[accessedAssetId]!,
      faceup: true,
      rezzed: true,
    };
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_321_esa-contract",
    });
    expect(
      JSON.stringify(accessState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);

    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(accessState.corp.archives).toContain(accessedAssetId);
    expect(
      getPlayerView(accessState, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === accessedAssetId)
        ?.definitionId,
    ).toBe("onr_v1_321_esa-contract");
    expect(validateGameState(accessState).ok).toBe(true);
  });

  it("applies rezzed V1.9.17 recurring campaign credits at Corp turn start", () => {
    let state = v1917GenericAssetGame("v1917-recurring-campaign-start-turn");
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const campaignId = moveCorpCardToHq(state, "onr_v1_326_holovid-campaign");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === campaignId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_326_holovid-campaign",
    );
    const creditsBeforeNextCorpTurn = state.corp.credits;

    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.activeSide).toBe("corp");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.corp.credits).toBe(creditsBeforeNextCorpTurn + 1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("offers the public V1.9.17 economy asset action for every scoped economy asset", () => {
    const economyAssets = [
      "onr_v1_309_bbs-whispering-campaign",
      "onr_v1_311_braindance-campaign",
      "onr_v1_314_corporate-negotiating-center",
      "onr_v1_321_esa-contract",
      "onr_v1_326_holovid-campaign",
      "onr_v1_329_investment-firm",
      "onr_v1_337_rockerboy-promotion",
      "onr_v1_344_spinn-public-relations",
    ] as const;
    for (const definitionId of economyAssets) {
      let state = v1917GenericAssetGame(`v1917-economy-asset-${definitionId}`);
      state.corp.credits = 10;
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      const assetId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === assetId &&
          action.payload?.serverId === "new_remote",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      const creditsBefore = state.corp.credits;

      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1917AssetAbility === "gain_credits" &&
          action.payload?.cardId === assetId,
      );

      expect(state.corp.credits, definitionId).toBe(creditsBefore + 2);
      expect(state.eventLog.at(-1)?.publicPayload, definitionId).toMatchObject({
        actionType: "gain_credit",
        cardDefinitionId: definitionId,
        amount: 2,
      });
      expect(validateGameState(state).ok, definitionId).toBe(true);
    }
  });

  it("refreshes all scoped V1.9.17 recurring assets together without hidden payloads", () => {
    const recurringAssets = [
      "onr_v1_311_braindance-campaign",
      "onr_v1_314_corporate-negotiating-center",
      "onr_v1_326_holovid-campaign",
      "onr_v1_329_investment-firm",
      "onr_v1_344_spinn-public-relations",
    ] as const;
    let state = toRunnerTurn(
      v1917GenericAssetGame("v1917-recurring-all-assets"),
    );
    for (const definitionId of recurringAssets) {
      const assetId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[assetId] = {
        ...state.cardInstances[assetId]!,
        faceup: true,
        rezzed: true,
      };
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.corp.credits).toBe(creditsBefore + recurringAssets.length);
    expect(validateGameState(state).ok).toBe(true);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("cascades hosted V1.9.17 Corp cards to Archives when the host is trashed on access", () => {
    let state = toRunnerTurn(
      v1917GenericAssetGame("v1917-hosted-corp-asset-trash"),
    );
    state.runner.credits = 10;
    const hostId = putCorpRootInRemote(
      state,
      "onr_v1_309_bbs-whispering-campaign",
    );
    const hostedId = putCorpRootInRemote(
      state,
      "onr_v1_318_department-of-truth-enhancement",
    );
    state.cardInstances[hostId] = {
      ...state.cardInstances[hostId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[hostedId] = {
      ...state.cardInstances[hostedId]!,
      faceup: true,
      rezzed: true,
      hostedOn: hostId,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBe(hostId);
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    expect(state.corp.archives).toEqual(
      expect.arrayContaining([hostId, hostedId]),
    );
    expect(state.cardInstances[hostId]?.hostedOn).toBeUndefined();
    expect(state.cardInstances[hostedId]?.hostedOn).toBeUndefined();
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.some((card) => card.instanceId === hostedId),
    ).toBe(true);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("starts V1.9.17 trace asset abilities through the side-safe trace window", () => {
    const traceAssets = [
      ["onr_v1_310_blood-cat", 5],
      ["onr_v1_330_krumz", 3],
    ] as const;
    for (const [definitionId, baseTraceStrength] of traceAssets) {
      let state = v1917GenericAssetGame(
        `v1917-trace-asset-window-${definitionId}`,
      );
      state.corp.credits = 10;
      state.runner.credits = 5;
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      const assetId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === assetId &&
          action.payload?.serverId === "new_remote" &&
          action.payload?.placement === "root",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1917AssetAbility === "trace_3_tag" &&
          action.payload?.cardId === assetId,
      );

      expect(state.trace).toMatchObject({
        status: "corp_bid",
        baseTraceStrength,
        sourceDefinitionId: definitionId,
      });
      expect(state.pendingChoice?.side).toBe("corp");
      expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
      expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "gain_credit",
        traceStarted: true,
        sourceDefinitionId: definitionId,
      });
      expect(validateGameState(state).ok).toBe(true);
    }
  });

  it("keeps V1.9.17 Corp hidden-zone asset choices side-private and replay-safe", () => {
    let revealState = v1917GenericAssetGame("v1917-hidden-zone-reveal");
    revealState.corp.credits = 10;
    revealState = apply(
      revealState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const negotiatingCenterId = moveCorpCardToHq(
      revealState,
      "onr_v1_314_corporate-negotiating-center",
    );
    revealState = apply(
      revealState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === negotiatingCenterId &&
        action.payload?.serverId === "new_remote",
    );
    revealState = apply(
      revealState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(revealState, action) ===
          "onr_v1_314_corporate-negotiating-center",
    );
    putCorpCardOnTopOfRd(revealState, "simple_economy_operation");

    revealState = apply(
      revealState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1917AssetAbility === "reveal_rd_top",
    );
    expect(revealState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_corp_reveal_rd_top",
      revealKind: "reveal",
      cardDefinitionId: "simple_economy_operation",
    });
    expect(JSON.stringify(getPlayerView(revealState, "runner"))).not.toContain(
      "simple_economy_operation_",
    );

    let reorderState = v1917GenericAssetGame("v1917-hidden-zone-reorder");
    reorderState.corp.credits = 10;
    reorderState = apply(
      reorderState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const reschedulerId = moveCorpCardToHq(
      reorderState,
      "onr_v1_336_rescheduler",
    );
    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === reschedulerId &&
        action.payload?.serverId === "new_remote",
    );
    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(reorderState, action) === "onr_v1_336_rescheduler",
    );
    const secondId = putCorpCardOnTopOfRd(
      reorderState,
      "simple_economy_operation",
    );
    const firstId = putCorpCardOnTopOfRd(reorderState, "simple_agenda");
    const initial = structuredClone(reorderState);
    const replayStart = reorderState.eventLog.length;

    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1917AssetAbility === "reorder_rd_top2",
    );
    expect(reorderState.pendingChoice?.source).toContain(
      "v1917.corp_rd_arrange_top2",
    );
    expect(
      getPlayerView(reorderState, "corp").pendingChoice?.options.some(
        (option) => option.value === firstId,
      ),
    ).toBe(true);
    expect(getPlayerView(reorderState, "runner").pendingChoice).toBeUndefined();
    reorderState = applyChoices(reorderState, "corp", [
      `card_${secondId}`,
      `card_${firstId}`,
    ]);

    expect(reorderState.corp.rd[0]).toBe(secondId);
    expect(reorderState.corp.rd[1]).toBe(firstId);
    expect(reorderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_corp_reorder_rd_top2",
      arrangedCount: 2,
    });
    const replay = replayEvents(
      initial,
      reorderState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(reorderState));
  });

  it("resolves V1.9.17 Solo Squad damage through a typed rezzed asset LegalAction", () => {
    let state = v1917GenericAssetGame("v1917-solo-squad-damage");
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const soloSquadId = moveCorpCardToHq(state, "onr_v1_342_solo-squad");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === soloSquadId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_342_solo-squad",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1917AssetAbility === "meat_damage_1",
    );

    expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Cowboy Sysop and Disinfectant, Inc. through visible installed-card targets", () => {
    let cowboyState = v1917GenericAssetGame("v1917-cowboy-installed-target");
    cowboyState.corp.credits = 10;
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const runnerProgramId = installRunnerProgramForTest(
      cowboyState,
      "simple_decoder",
    );
    const cowboyId = moveCorpCardToHq(cowboyState, "onr_v1_316_cowboy-sysop");
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === cowboyId &&
        action.payload?.serverId === "new_remote",
    );
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(cowboyState, action) === "onr_v1_316_cowboy-sysop",
    );
    const cowboyInitial = structuredClone(cowboyState);
    const cowboyReplayStart = cowboyState.eventLog.length;

    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.payload?.v1917AssetAbility === "trash_installed_runner_card" &&
        action.payload?.targetCardId === runnerProgramId,
    );

    expect(cowboyState.runner.heap).toContain(runnerProgramId);
    expect(cowboyState.runner.rig.programs).not.toContain(runnerProgramId);
    expect(cowboyState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_trash_installed_runner_card",
      trashedCardDefinitionId: "simple_decoder",
    });
    expect(
      JSON.stringify(cowboyState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
    const cowboyReplay = replayEvents(
      cowboyInitial,
      cowboyState.eventLog.slice(cowboyReplayStart),
    );
    expect(cowboyReplay.ok).toBe(true);
    expect(hashState(cowboyReplay.state)).toBe(hashState(cowboyState));

    let disinfectantState = v1917GenericAssetGame(
      "v1917-disinfectant-virus-counter",
    );
    disinfectantState.corp.credits = 10;
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const virusTargetId = installRunnerProgramForTest(
      disinfectantState,
      "simple_decoder",
    );
    disinfectantState.cardInstances[virusTargetId] = {
      ...disinfectantState.cardInstances[virusTargetId]!,
      counters: { virus: 2 },
    };
    const disinfectantId = moveCorpCardToHq(
      disinfectantState,
      "onr_v1_319_disinfectant-inc",
    );
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === disinfectantId &&
        action.payload?.serverId === "new_remote",
    );
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(disinfectantState, action) ===
          "onr_v1_319_disinfectant-inc",
    );
    const disinfectantInitial = structuredClone(disinfectantState);
    const disinfectantReplayStart = disinfectantState.eventLog.length;

    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) =>
        action.payload?.v1917AssetAbility === "remove_virus_counter" &&
        action.payload?.targetCardId === virusTargetId,
    );

    expect(
      disinfectantState.cardInstances[virusTargetId]?.counters?.virus,
    ).toBe(1);
    expect(disinfectantState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_remove_virus_counter",
      removedCounterAmount: 1,
      remainingCounters: 1,
      targetCardDefinitionId: "simple_decoder",
    });
    expect(
      JSON.stringify(disinfectantState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
    const disinfectantReplay = replayEvents(
      disinfectantInitial,
      disinfectantState.eventLog.slice(disinfectantReplayStart),
    );
    expect(disinfectantReplay.ok).toBe(true);
    expect(hashState(disinfectantReplay.state)).toBe(
      hashState(disinfectantState),
    );
  });

  it("triggers Setup! and TRAP! only from legal access windows without leaking hidden payloads", () => {
    const ambushes = [
      { definitionId: "onr_v1_340_setup", expectedTagsAdded: 0 },
      { definitionId: "onr_v1_345_trap", expectedTagsAdded: 1 },
    ] as const;
    for (const { definitionId, expectedTagsAdded } of ambushes) {
      let state = toRunnerTurn(
        v1917GenericAssetGame(`v1917-access-ambush-${definitionId}`),
      );
      state.runner.credits = 10;
      const ambushId = putCorpRootInRemote(state, definitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const tagsBefore = state.runner.tags;
      const gripBefore = state.runner.grip.length;

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");

      expect(state.run?.accessedCardId).toBe(ambushId);
      expect(state.runner.tags).toBe(tagsBefore + expectedTagsAdded);
      expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1917_access_ambush",
        ambushDefinitionId: definitionId,
        damageResolved: true,
        damageType: "net",
        damageAmount: 1,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("V1.9.22 Per-card Longtail WIP", () => {
  it("adds the first V1.9.22 runner hardware runtime definitions without catalog release promotion", () => {
    const runnerHardwareIds = [
      "onr_v1_119_arasaka-portable-prototype",
      "onr_v1_122_artemis-2020",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_124_corolla-speed-chip",
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_136_pandoras-deck",
      "onr_v1_137_parraline-5750",
      "onr_v1_138_pk-6089a",
      "onr_v1_147_zz22-speed-chip",
    ] as const;
    expect(ONR_V1_9_22_WIP_CARD_IDS).toHaveLength(47);
    for (const definitionId of runnerHardwareIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("runner");
      expect(definition?.type, definitionId).toBe("hardware");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "per_card_longtail",
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("installs all V1.9.22 runner hardware through LegalActions with replay, visibility and revalidation", () => {
    const runnerHardwareIds = [
      "onr_v1_119_arasaka-portable-prototype",
      "onr_v1_122_artemis-2020",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_124_corolla-speed-chip",
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_136_pandoras-deck",
      "onr_v1_137_parraline-5750",
      "onr_v1_138_pk-6089a",
      "onr_v1_147_zz22-speed-chip",
    ] as const;

    for (const definitionId of runnerHardwareIds) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-hardware-install`,
          runnerDeck: {
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
            id: `onr_v1_runner_v1922_${definitionId}_hardware_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
            ],
          },
          corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      moveRunnerCardToGrip(state, definitionId);

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(
        state.runner.rig.hardware.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        definitionId,
      ).toContain(definitionId);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("adds V1.9.22 runner event runtime definitions without broad play_event support", () => {
    const runnerEventIds = [
      "onr_v1_077_anonymous-tip",
      "onr_v1_080_core-command-jettison-ice",
      "onr_v1_086_forged-activation-orders",
      "onr_v1_093_if-you-want-it-done-right",
      "onr_v1_100_misc-for-sale",
      "onr_v1_102_open-ended-mileage-program",
      "onr_v1_103_organ-donor",
      "onr_v1_109_security-code-worm-chip",
      "onr_v1_113_synchronized-attack-on-hq",
      "onr_v1_117_valu-pak-software-bundle",
    ] as const;
    for (const definitionId of runnerEventIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("runner");
      expect(definition?.type, definitionId).toBe("event");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "per_card_longtail",
      );
    }
  });

  it("plays If You Want It Done Right as a private stack top-five choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-if-you-want-it-done-right",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_if_you_want_it_done_right",
          name: "O:NR V1.9.22 If You Want It Done Right",
          cards: [
            { id: "onr_v1_093_if-you-want-it-done-right", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_093_if-you-want-it-done-right");
    const topFive = state.runner.stack.slice(0, 5);
    expect(topFive).toHaveLength(5);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_093_if-you-want-it-done-right",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-if-you-want-it-done-right-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-if-you-want-it-done-right-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_093_if-you-want-it-done-right",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.runner_stack_top5_choose_one_arrange_rest",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_093_if-you-want-it-done-right",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing If You Want It Done Right choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const chosenCardId = String(
      pendingChoice.options.find((option) => option.id === selectedOptionIds[0])
        ?.value,
    );
    const expectedStackTop = selectedOptionIds
      .slice(1)
      .map((optionId) =>
        String(
          pendingChoice.options.find((option) => option.id === optionId)?.value,
        ),
      );
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(chosenCardId);
    expect(state.runner.stack.slice(0, expectedStackTop.length)).toEqual(
      expectedStackTop,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
      selectedCount: 1,
      arrangedCount: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Organ Donor as a private grip-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-organ-donor",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_organ_donor",
          name: "O:NR V1.9.22 Organ Donor",
          cards: [
            { id: "onr_v1_103_organ-donor", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_103_organ-donor");
    const trashCandidates = state.runner.stack.slice(0, 2);
    expect(trashCandidates).toHaveLength(2);
    for (const cardId of trashCandidates) {
      removeEverywhere(state, cardId);
      state.runner.grip.unshift(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "runner", zone: "grip" },
        faceup: true,
        rezzed: true,
      };
    }

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_103_organ-donor",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-organ-donor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-organ-donor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_103_organ-donor",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.runner_grip_trash_gain_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_103_organ-donor",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Organ Donor choice");
    const selectedOptionIds = trashCandidates.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of trashCandidates) {
      expect(state.runner.heap).toContain(cardId);
      expect(state.runner.grip).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + trashCandidates.length * 2,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
      trashedCount: 2,
      gainedCredits: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays misc.for-sale as a private installed-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-misc-for-sale",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_misc_for_sale",
          name: "O:NR V1.9.22 misc.for-sale",
          cards: [
            { id: "onr_v1_100_misc-for-sale", quantity: 1 },
            { id: "onr_v1_119_arasaka-portable-prototype", quantity: 1 },
            { id: "onr_v1_122_artemis-2020", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_119_arasaka-portable-prototype");
    moveRunnerCardToGrip(state, "onr_v1_122_artemis-2020");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_119_arasaka-portable-prototype",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_122_artemis-2020",
    );
    const installedTargets = state.runner.rig.hardware.slice(0, 2);
    expect(installedTargets).toHaveLength(2);
    moveRunnerCardToGrip(state, "onr_v1_100_misc-for-sale");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_100_misc-for-sale",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-misc-for-sale-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-misc-for-sale-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_100_misc-for-sale",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.runner_installed_trash_gain_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_100_misc-for-sale",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing misc.for-sale choice");
    const selectedOptionIds = installedTargets.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of installedTargets) {
      expect(state.runner.heap).toContain(cardId);
      expect([
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ]).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + installedTargets.length * 3,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
      trashedCount: 2,
      gainedCredits: 6,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Open-Ended Mileage Program as tag removal with optional return", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-open-ended-mileage-program",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_open_ended_mileage_program",
          name: "O:NR V1.9.22 Open-Ended Mileage Program",
          cards: [
            { id: "onr_v1_102_open-ended-mileage-program", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.runner.tags = 1;
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_102_open-ended-mileage-program",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_102_open-ended-mileage-program",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-open-ended-mileage-program-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-open-ended-mileage-program-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_102_open-ended-mileage-program",
    );
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice?.source).toContain(
      "v1922.open_ended_mileage_return",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.runner.heap).toContain(eventCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_102_open-ended-mileage-program",
      v1922RunnerEventAbility: "remove_tag_optional_return",
      removedTags: 1,
      runnerTagsAfter: 0,
    });

    state = applyChoice(state, "runner", "pay_1_return_to_grip");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(eventCardId);
    expect(state.runner.heap).not.toContain(eventCardId);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "remove_tag_optional_return",
      returnedToGrip: true,
      paidCredits: 1,
      runnerCreditsAfter: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Anonymous Tip as a public black-ice derez choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-anonymous-tip",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip",
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.runner.clicks = 4;
    const blackIceId = "v1922_anonymous_tip_black_ice" as CardInstanceId;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice.unshift(blackIceId);
    state.cardInstances[blackIceId] = {
      instanceId: blackIceId,
      definitionId: "onr_v1_231_cortical-scrub",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const anonymousTipId = "v1922_anonymous_tip" as CardInstanceId;
    state.runner.grip.unshift(anonymousTipId);
    state.cardInstances[anonymousTipId] = {
      instanceId: anonymousTipId,
      definitionId: "onr_v1_077_anonymous-tip",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_077_anonymous-tip",
    );
    expect(legal.costs[0]?.credits).toBe(3);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-anonymous-tip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-anonymous-tip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_077_anonymous-tip",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.anonymous_tip_derez_black_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.runner.credits).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_077_anonymous-tip",
      v1922RunnerEventAbility: "derez_black_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Anonymous Tip choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === blackIceId,
    );
    expect(selectedOption).toBeDefined();
    state = applyChoice(state, "runner", selectedOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[blackIceId]?.rezzed).toBe(false);
    expect(state.cardInstances[blackIceId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "derez_black_ice",
      derezzedCount: 1,
      targetCardDefinitionId: "onr_v1_231_cortical-scrub",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Forged Activation Orders as a public ICE target and Corp rez-or-trash choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.corp.credits = 5;
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    moveRunnerCardToGrip(state, "onr_v1_086_forged-activation-orders");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-forged-activation-orders-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-forged-activation-orders-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    expect(state.runner.credits).toBe(1);
    expect(state.pendingChoice?.source).toContain(
      "v1922.forged_activation_orders_target",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(
      JSON.stringify(getPlayerView(state, "runner").pendingChoice),
    ).not.toContain("simple_barrier_ice");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_086_forged-activation-orders",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"|"simple_barrier_ice"/,
    );

    const targetChoice = state.pendingChoice;
    expect(targetChoice).toBeDefined();
    if (!targetChoice)
      throw new Error("Missing Forged Activation Orders target choice");
    const targetOption = targetChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice?.source).toContain(
      "v1922.forged_activation_orders_corp",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"simple_barrier_ice"/,
    );

    const corpCreditsBefore = state.corp.credits;
    state = applyChoice(state, "corp", "rez_ice");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[targetIceId]?.rezzed).toBe(true);
    expect(state.cardInstances[targetIceId]?.faceup).toBe(true);
    expect(state.corp.credits).toBeLessThan(corpCreditsBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "rez_ice",
      targetCardDefinitionId: "simple_barrier_ice",
      targetServerLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let trashState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders-trash",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    trashState.runner.credits = 2;
    trashState.corp.credits = 0;
    const trashTargetId = putCorpIceOnServer(
      trashState,
      "hq",
      "simple_barrier_ice",
    );
    moveRunnerCardToGrip(trashState, "onr_v1_086_forged-activation-orders");
    trashState = apply(
      trashState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(trashState, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    const trashTargetChoice = trashState.pendingChoice;
    if (!trashTargetChoice)
      throw new Error("Missing Forged Activation Orders trash target choice");
    const trashTargetOption = trashTargetChoice.options.find(
      (option) => option.value === trashTargetId,
    );
    trashState = applyChoice(trashState, "runner", trashTargetOption?.id ?? "");
    expect(
      trashState.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["trash_ice"]);
    trashState = applyChoice(trashState, "corp", "trash_ice");
    expect(trashState.corp.archives).toContain(trashTargetId);
    expect(trashState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "trash_ice",
      trashedCount: 1,
      targetCardDefinitionId: "simple_barrier_ice",
    });
  });

  it("plays Core Command Jettison Ice after a successful HQ run to pay rez cost and trash rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-core-command-jettison-ice",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_core_command_jettison_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice",
          cards: [
            { id: "onr_v1_080_core-command-jettison-ice", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_core_command_jettison_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[targetIceId] = {
      ...state.cardInstances[targetIceId]!,
      faceup: true,
      rezzed: true,
    };
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_080_core-command-jettison-ice",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_080_core-command-jettison-ice",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_080_core-command-jettison-ice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-core-command-jettison-ice-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-core-command-jettison-ice-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_080_core-command-jettison-ice",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.core_command_jettison_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Core Command choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.runner.credits).toBeLessThan(creditsBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility:
        "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      trashedCount: 1,
      targetCardDefinitionId: "simple_barrier_ice",
      targetServerLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Security Code WORM Chip after a successful HQ run to trash unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-security-code-worm-chip",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_security_code_worm_chip",
          name: "O:NR V1.9.22 Security Code WORM Chip",
          cards: [
            { id: "onr_v1_109_security-code-worm-chip", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_security_code_worm_chip",
          name: "O:NR V1.9.22 Security Code WORM Chip Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_109_security-code-worm-chip",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_109_security-code-worm-chip",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_109_security-code-worm-chip",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-security-code-worm-chip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-security-code-worm-chip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_109_security-code-worm-chip",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.security_code_worm_chip",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(
      JSON.stringify(getPlayerView(state, "runner").pendingChoice),
    ).not.toContain("simple_barrier_ice");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_109_security-code-worm-chip",
      v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Security Code WORM Chip choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
      trashedCount: 1,
      targetCardDefinitionId: "simple_barrier_ice",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Synchronized Attack on HQ after a successful HQ run as a private Corp retain choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-synchronized-attack-on-hq",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_synchronized_attack_on_hq",
          name: "O:NR V1.9.22 Synchronized Attack on HQ",
          cards: [
            { id: "onr_v1_113_synchronized-attack-on-hq", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    state.runner.clicks = 4;
    state.corp.credits = 4;
    const hqCards = [
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
    ];
    keepOnlyCorpHqCards(state, hqCards);
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_113_synchronized-attack-on-hq",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_113_synchronized-attack-on-hq",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_113_synchronized-attack-on-hq",
    );
    expect(legal.costs[0]?.credits).toBe(4);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-synchronized-attack-on-hq-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-synchronized-attack-on-hq-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_113_synchronized-attack-on-hq",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.synchronized_attack_on_hq",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_113_synchronized-attack-on-hq",
      v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Synchronized Attack on HQ choice");
    const retainedIds = hqCards.slice(0, 2);
    const selectedOptionIds = retainedIds.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of retainedIds) expect(state.corp.hq).toContain(cardId);
    expect(state.corp.archives).toContain(hqCards[2]);
    expect(state.corp.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
      retainedCount: 2,
      discardedCount: 1,
      paidCredits: 4,
      corpCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Valu-Pak Software Bundle as a consecutive program-install action bundle", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-valu-pak-software-bundle",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_valu_pak_software_bundle",
          name: "O:NR V1.9.22 Valu-Pak Software Bundle",
          cards: [
            { id: "onr_v1_117_valu-pak-software-bundle", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_117_valu-pak-software-bundle");
    const programId = moveRunnerCardToGrip(state, "simple_decoder");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_117_valu-pak-software-bundle",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-valu-pak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-valu-pak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_117_valu-pak-software-bundle",
    );
    expect(state.runner.clicks).toBe(8);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      5,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      1,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_117_valu-pak-software-bundle",
      v1922RunnerEventAbility: "program_install_action_bundle",
      gainedActions: 5,
      temporaryProgramInstallCredits: 1,
      valuPakProgramInstallActionsRemaining: 5,
      runnerClicksAfter: 8,
    });

    const bundleActions = getLegalActions(state, "runner");
    expect(
      bundleActions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_decoder",
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "start_run" ||
          action.type === "play_event",
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_decoder",
    );
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.runner.credits).toBe(0);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      4,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      0,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "simple_decoder",
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakInstallActionSpent: true,
      valuPakProgramInstallActionsRemaining: 4,
      valuPakTemporaryProgramInstallCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Japanese Water Torture, breaks Wall subroutines and carries future action debt without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-japanese-water-torture-wall-debt",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_japanese_water_torture",
          name: "O:NR V1.9.22 Japanese Water Torture",
          cards: [
            { id: "onr_v1_037_japanese-water-torture", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_japanese_water_torture_wall",
          name: "O:NR V1.9.22 Japanese Water Torture Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    state.corp.maxHandSize = 99;
    moveRunnerCardToGrip(state, "onr_v1_037_japanese-water-torture");
    const iceId = putCorpIceOnServer(
      state,
      "archives",
      "onr_v1_232_crystal-wall",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_037_japanese-water-torture",
    );
    expect(state.runner.credits).toBe(13);
    expect(state.runner.memoryUsed).toBe(1);
    const tortureId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_037_japanese-water-torture",
    );
    expect(tortureId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      ),
    ).toBe(false);

    for (let pump = 0; pump < 3; pump += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      );
    }
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
      cardDefinitionId: "onr_v1_037_japanese-water-torture",
      v1922RunnerProgramAbility: "japanese_water_torture_future_action_debt",
      futureActionDebtAdded: 1,
      futureActionDebtPending: 3,
      breakerStrengthAfter: 5,
    });

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) ===
          "onr_v1_037_japanese-water-torture" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-japanese-water-torture-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-japanese-water-torture-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_037_japanese-water-torture",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    for (let step = 0; step < 4 && state.run; step += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" ||
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
    }
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(0);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(0);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Hammer and applies ordered Stealth loss after breaking Wall subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-hammer-wall-breaker",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_hammer",
          name: "O:NR V1.9.22 Hammer",
          cards: [
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_hammer_wall",
          name: "O:NR V1.9.22 Hammer Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_011_cloak");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_011_cloak",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(cloakId).toBeDefined();
    expect(hammerId).toBeDefined();
    if (!cloakId || !hammerId)
      throw new Error("Missing installed Hammer or Cloak");
    expect(state.runner.memoryUsed).toBe(2);
    expect(cardCounterAmount(state, cloakId, "recurring_credit")).toBe(3);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-hammer-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-hammer-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(cardCounterAmount(state, cloakId, "recurring_credit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Flak and breaks AP ICE subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-flak-ap-breaker",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_flak",
          name: "O:NR V1.9.22 Flak",
          cards: [
            { id: "onr_v1_027_flak", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_flak_ap",
          name: "O:NR V1.9.22 Flak AP ICE Corp",
          cards: [
            { id: "onr_v1_280_zombie", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_027_flak");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_280_zombie");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );
    expect(state.runner.credits).toBe(16);
    expect(state.runner.memoryUsed).toBe(1);
    const flakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_027_flak",
    );
    expect(flakId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_027_flak",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_027_flak" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-flak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-flak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_027_flak",
      title: "Flak",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(1);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Reflector and only breaks tagged stun or knockout subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-reflector-tagged-breaker",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_reflector",
          name: "O:NR V1.9.22 Reflector",
          cards: [
            { id: "onr_v1_055_reflector", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_reflector",
          name: "O:NR V1.9.22 Reflector Tagged ICE Corp",
          cards: [
            { id: "onr_v1_271_tko-2-0", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_055_reflector");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_271_tko-2-0");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_055_reflector",
    );
    expect(state.runner.credits).toBe(8);
    expect(state.runner.memoryUsed).toBe(1);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_055_reflector",
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0]);
    expect(breakActions[0]?.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-reflector-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-reflector-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakActions[0]?.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_055_reflector",
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_055_reflector",
      title: "Reflector",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs V1.9.22 install-only runner programs while keeping their abilities gated", () => {
    const installOnlyPrograms = [
      {
        definitionId: "onr_v1_026_false-echo",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_044_netspace-inverter",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_048_poltergeist",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_051_rabbit",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_057_scatter-shot",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_067_speed-trap",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_068_startup-immolator",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_075_zetatech-software-installer",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
    ] as const;

    for (const {
      definitionId,
      expectedCreditsAfter,
      expectedMemoryUsed,
    } of installOnlyPrograms) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-install-only`,
          runnerDeck: {
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
            id: `onr_v1_runner_v1922_${definitionId}_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
            ],
          },
          corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 10;
      state.runner.memoryLimit = 4;
      moveRunnerCardToGrip(state, definitionId);

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(state.runner.credits, definitionId).toBe(expectedCreditsAfter);
      expect(state.runner.memoryUsed, definitionId).toBe(expectedMemoryUsed);
      expect(
        state.runner.rig.programs.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        definitionId,
      ).toContain(definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) => sourceDefinition(state, action) === definitionId,
        ),
        definitionId,
      ).toBe(false);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("installs Newsgroup Filter and uses its side-safe credit action", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-newsgroup-filter-credit-action",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_newsgroup_filter",
          name: "O:NR V1.9.22 Newsgroup Filter",
          cards: [
            { id: "onr_v1_045_newsgroup-filter", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    moveRunnerCardToGrip(state, "onr_v1_045_newsgroup-filter");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_045_newsgroup-filter",
    );
    expect(state.runner.credits).toBe(5);
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.memoryUsed).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_045_newsgroup-filter",
      ),
    ).toBe(true);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1922RunnerProgramAbility === "newsgroup_filter_gain_2",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-newsgroup-filter-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-newsgroup-filter-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1922RunnerProgramAbility === "newsgroup_filter_gain_2",
    );

    expect(state.runner.credits).toBe(7);
    expect(state.runner.clicks).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      amount: 2,
      v1922RunnerProgramAbility: "newsgroup_filter_gain_2",
      gainedCredits: 2,
      runnerCreditsAfter: 7,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Shield and uses side-safe per-turn net damage prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-shield-prevention",
        baseline: MVP_0_99_BASELINE,
        runnerDeck: {
          ...ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
          id: "onr_v1_runner_v1922_shield_prevention",
          name: "O:NR V1.9.22 Shield Prevention",
          cards: [
            { id: "onr_v1_061_shield", quantity: 1 },
            ...ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_061_shield");

    const installLegal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_061_shield",
    );
    const wrongSideInstall = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: installLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-shield-install-wrong-side",
    });
    expect(wrongSideInstall.ok).toBe(false);
    if (!wrongSideInstall.ok)
      expect(wrongSideInstall.error.code).toBe("ERR_WRONG_SIDE");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_061_shield",
    );
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("onr_v1_061_shield");
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_061_shield",
      ),
    ).toBe(true);

    putCorpIceOnServer(state, "rd", "onr_v1_258_neural-blade");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
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
        sourceDefinition(state, action) === "onr_v1_258_neural-blade",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventionOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventionOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventionOptionId));
    expect(state.runner.heap.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      preventedAmount: 2,
      damageAmount: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Corporate Retreat until Corp installs or rezzes another card", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_corporate_retreat",
      name: "O:NR V1.9.22 Corporate Retreat",
      cards: [
        { id: "onr_v1_195_corporate-retreat", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 2 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-retreat",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_195_corporate-retreat");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_195_corporate-retreat" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_195_corporate-retreat",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_195_corporate-retreat",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_corporate_retreat",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-retreat-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-retreat-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_corporate_retreat",
    );
    expect(state.corp.credits).toBe(creditsBeforeAbility + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: "onr_v1_195_corporate-retreat",
      agendaAbility: "v1922_corporate_retreat",
      gainedCredits: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    moveCorpCardToHq(state, "simple_barrier_ice");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.agendaAbility === "v1922_corporate_retreat",
      ),
    ).toBe(false);

    let rezState = createGameAfterSetup({
      seed: "v1922-corporate-retreat-rez-lock",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    rezState = apply(
      rezState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rezState.corp.credits = 40;
    rezState.corp.clicks = 40;
    rezState.corp.maxHandSize = 100;
    moveCorpCardToHq(rezState, "onr_v1_195_corporate-retreat");
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      rezState = apply(
        rezState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat",
      );
    }
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat",
    );
    const rezRetreatId = rezState.corp.scoreArea.find(
      (cardId) =>
        rezState.cardInstances[cardId]?.definitionId ===
        "onr_v1_195_corporate-retreat",
    );
    expect(rezRetreatId).toBeDefined();
    putCorpIceOnServer(rezState, "rd", "simple_barrier_ice");
    rezState = apply(rezState, "corp", (action) => action.type === "end_turn");
    rezState = apply(
      rezState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(rezState, action) === "simple_barrier_ice",
    );
    if (rezRetreatId)
      expect(
        rezState.cardInstances[rezRetreatId]?.counters?.mark,
      ).toBeUndefined();
  });

  it("scores Corporate War through a deterministic on-score credit threshold resolver", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_corporate_war",
      name: "O:NR V1.9.22 Corporate War",
      cards: [
        { id: "onr_v1_196_corporate-war", quantity: 2 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_196_corporate-war");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_196_corporate-war",
      );
    }

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-war-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-war-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeScore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war",
    );
    expect(state.corp.credits).toBe(creditsBeforeScore + 12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_196_corporate-war",
      corporateWarThresholdMet: true,
      onScoreGainCredits: 12,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let missState = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold-miss",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    missState = apply(
      missState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    missState.corp.credits = 5;
    missState.corp.clicks = 20;
    moveCorpCardToHq(missState, "onr_v1_196_corporate-war");
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
    );
    for (let index = 0; index < 3; index += 1) {
      missState = apply(
        missState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
      );
    }
    expect(missState.corp.credits).toBeLessThan(12);
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
    );
    expect(missState.corp.credits).toBe(0);
    expect(missState.eventLog.at(-1)?.publicPayload).toMatchObject({
      corporateWarThresholdMet: false,
      onScoreLostAllCredits: true,
    });
  });

  it("uses Political Overthrow as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_political_overthrow",
      name: "O:NR V1.9.22 Political Overthrow",
      cards: [
        { id: "onr_v1_210_political-overthrow", quantity: 1 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-political-overthrow",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_210_political-overthrow");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 9; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_political_overthrow",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-political-overthrow-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-political-overthrow-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_political_overthrow",
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: "onr_v1_210_political-overthrow",
      agendaAbility: "v1922_political_overthrow",
      gainedCredits: 3,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Marine Arcology as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_marine_arcology",
      name: "O:NR V1.9.22 Marine Arcology",
      cards: [
        { id: "onr_v1_206_marine-arcology", quantity: 1 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-marine-arcology",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_206_marine-arcology");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_marine_arcology",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-marine-arcology-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-marine-arcology-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_marine_arcology",
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: "onr_v1_206_marine-arcology",
      agendaAbility: "v1922_marine_arcology",
      gainedCredits: 3,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Off-Site Backups as a private Archives-to-HQ choice", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_off_site_backups",
      name: "O:NR V1.9.22 Off-Site Backups",
      cards: [
        { id: "onr_v1_296_off-site-backups", quantity: 1 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-off-site-backups",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_296_off-site-backups");
    const faceupArchiveId = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownArchiveId = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_296_off-site-backups",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-off-site-backups-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-off-site-backups-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_296_off-site-backups",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_296_off-site-backups",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Off-Site Backups choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === facedownArchiveId,
    );
    expect(selectedOption).toBeDefined();
    if (!selectedOption) throw new Error("Missing facedown archive option");
    state = applyChoices(state, "corp", [selectedOption.id]);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.hq[0]).toBe(facedownArchiveId);
    expect(state.corp.archives).toContain(faceupArchiveId);
    expect(state.corp.archives).not.toContain(facedownArchiveId);
    expect(state.corp.archives).toHaveLength(2);
    expect(state.cardInstances[facedownArchiveId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Planning Consultants as a private R&D top-five reorder choice", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_planning_consultants",
      name: "O:NR V1.9.22 Planning Consultants",
      cards: [
        { id: "onr_v1_298_planning-consultants", quantity: 1 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-planning-consultants",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_298_planning-consultants");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(state, "onr_v1_205_main-office-relocation");
    putCorpCardOnTopOfRd(state, "onr_v1_324_fortress-architects");

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_298_planning-consultants",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-planning-consultants-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-planning-consultants-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_298_planning-consultants",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_298_planning-consultants",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Planning Consultants choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const expectedTop = selectedOptionIds.map((optionId) =>
      String(
        pendingChoice.options.find((option) => option.id === optionId)?.value,
      ),
    );
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.rd.slice(0, expectedTop.length)).toEqual(expectedTop);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Edgerunner, Inc., Temps as a consecutive Corp install-only action bundle", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
      id: "onr_v1_corp_v1922_edgerunner_temps",
      name: "O:NR V1.9.22 Edgerunner Temps",
      cards: [
        { id: "onr_v1_289_edgerunner-inc-temps", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 2 },
        ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-edgerunner-temps",
      runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_289_edgerunner-inc-temps");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_289_edgerunner-inc-temps",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-edgerunner-temps-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-edgerunner-temps-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_289_edgerunner-inc-temps",
    );
    expect(state.corp.clicks).toBe(12);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_289_edgerunner-inc-temps",
      v1922CorpOperationAbility: "install_action_bundle",
      gainedActions: 3,
      edgerunnerTempsInstallActionsRemaining: 3,
      corpClicksAfter: 12,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const bundleActions = getLegalActions(state, "corp");
    expect(
      bundleActions.some(
        (action) => action.type === "install_card" && action.source === iceId,
      ),
    ).toBe(true);
    expect(
      bundleActions.every(
        (action) =>
          action.type === "install_card" || action.type === "end_turn",
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "play_operation" ||
          action.type === "advance_card",
      ),
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.placement === "ice",
    );
    expect(
      state.corp.servers.some((server) => server.ice.includes(iceId)),
    ).toBe(true);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      v1922CorpOperationAbility: "install_action_bundle",
      edgerunnerTempsInstallActionSpent: true,
      edgerunnerTempsInstallActionsRemaining: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Zombie as core-damage ICE with replay-stable public run resolution", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zombie",
        runnerDeck: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_zombie",
          name: "O:NR V1.9.22 Zombie Corp",
          cards: [
            { id: "onr_v1_280_zombie", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 20;
    state.runner.credits = 5;
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_280_zombie");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezLegal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_280_zombie",
    );
    expect(rezLegal.costs[0]?.credits).toBe(9);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zombie-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zombie-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Tutor and adds a breakable end-the-run subroutine to later ice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-tutor-future-etr",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_tutor_hammer",
          name: "O:NR V1.9.22 Tutor Hammer Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_tutor",
          name: "O:NR V1.9.22 Tutor Corp",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.futureEncounterEndTheRunSourceIceId).toBe(tutorId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      v1922CorpIceAbility: "tutor_future_end_the_run_subroutine",
      sourceDefinitionId: "onr_v1_274_tutor",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    expect(breakActions.map((action) => action.payload?.subroutineIndex)).toEqual(
      [0, 1],
    );
    const tutorEtr = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 1,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-tutor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-tutor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === tutorEtr.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Virizz and applies a rest-of-run break-cost modifier without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-virizz-break-cost-modifier",
        runnerDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
          id: "onr_v1_runner_v1922_virizz_hammer",
          name: "O:NR V1.9.22 Virizz Hammer Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
          id: "onr_v1_corp_v1922_virizz",
          name: "O:NR V1.9.22 Virizz Corp",
          cards: [
            { id: "onr_v1_277_virizz", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === virizzId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.breakSubroutineAdditionalCost).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      v1922CorpIceAbility: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      sourceDefinitionId: "onr_v1_277_virizz",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === innerWallId,
    );
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(2);
    expect(legal.payload).toMatchObject({
      breakSubroutineBaseCost: 1,
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
      v1922CorpIceAbility: "virizz_break_cost_modifier",
    });
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-virizz-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-virizz-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.runner.credits).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
      v1922CorpIceAbility: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps unresolved V1.9.22 Corp longtail cards out of playable runtime until concrete resolvers exist", () => {
    const corpLongtailIds = [
      "onr_v1_197_data-fort-reclamation",
      "onr_v1_216_security-purge",
      "onr_v1_247_haunting-inquisition",
      "onr_v1_276_viral-15",
    ] as const;

    for (const definitionId of corpLongtailIds) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).not.toBe("playable_mvp");
    }
    for (const definitionId of [
      "onr_v1_195_corporate-retreat",
      "onr_v1_196_corporate-war",
      "onr_v1_206_marine-arcology",
      "onr_v1_210_political-overthrow",
      "onr_v1_280_zombie",
      "onr_v1_274_tutor",
      "onr_v1_277_virizz",
      "onr_v1_289_edgerunner-inc-temps",
      "onr_v1_296_off-site-backups",
      "onr_v1_298_planning-consultants",
    ] as const) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.rulesText,
        definitionId,
      ).not.toContain("WIP");
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.mechanics.join(" "),
        definitionId,
      ).toContain("per_card_longtail");
    }
  });
});

describe("V1.9.18 Generic Upgrade/Root/Server WIP", () => {
  it("adds all V1.9.18 WIP runtime definitions without release-promoting the next slice", () => {
    expect(ONR_V1_9_18_WIP_CARD_IDS).toHaveLength(15);
    for (const definitionId of ONR_V1_9_18_WIP_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("corp");
      expect(definition?.type, definitionId).toBe("upgrade");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /generic_upgrade_root_server|access_ambush|trace|city_grid|run_flow|tag|counter|hidden_zone|stealth/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_197_data-fort-reclamation"]
        ?.implementationStatus,
    ).not.toBe("playable_mvp");
  });

  it("keeps generic V1.9.18 upgrade install, rez, access and trash side-safe", () => {
    let state = v1917GenericAssetGame(
      "v1918-generic-upgrade-install-rez-access",
    );
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const upgradeId = moveCorpCardToHq(state, "onr_v1_354_crybaby");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_354_crybaby",
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(upgradeId),
    );
    expect(remote?.id).toBe("remote_1");
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === upgradeId)?.definitionId,
    ).toBe("onr_v1_354_crybaby");

    let accessState = toRunnerTurn(
      v1917GenericAssetGame("v1918-generic-upgrade-access-trash"),
    );
    accessState.runner.credits = 10;
    const accessedUpgradeId = putCorpRootInRemote(
      accessState,
      "onr_v1_354_crybaby",
    );
    accessState.cardInstances[accessedUpgradeId] = {
      ...accessState.cardInstances[accessedUpgradeId]!,
      faceup: true,
      rezzed: true,
    };
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_354_crybaby",
    });
    expect(
      JSON.stringify(accessState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);

    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(accessState.corp.archives).toContain(accessedUpgradeId);
    expect(
      getPlayerView(accessState, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === accessedUpgradeId)
        ?.definitionId,
    ).toBe("onr_v1_354_crybaby");
    expect(validateGameState(accessState).ok).toBe(true);
  });

  it("resolves V1.9.18 upgrade access ambush damage without public hidden-info leaks", () => {
    const cases = [
      {
        definitionId: "onr_v1_356_dedicated-response-team",
        damageType: "meat",
        expectedTagsAdded: 1,
      },
      {
        definitionId: "onr_v1_357_dieter-esslin",
        damageType: "net",
        expectedTagsAdded: 0,
      },
    ] as const;

    for (const { definitionId, damageType, expectedTagsAdded } of cases) {
      let state = toRunnerTurn(
        v1917GenericAssetGame(`v1918-upgrade-access-ambush-${definitionId}`),
      );
      state.runner.credits = 10;
      const upgradeId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
      const gripBefore = state.runner.grip.length;
      const tagsBefore = state.runner.tags;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");

      expect(state.run?.accessedCardId).toBe(upgradeId);
      expect(state.runner.tags).toBe(tagsBefore + expectedTagsAdded);
      expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1918_upgrade_access_ambush",
        ambushDefinitionId: definitionId,
        damageResolved: true,
        damageType,
        damageAmount: 1,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"/,
      );
      expect(validateGameState(state).ok).toBe(true);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("starts Turbeau Delacroix through the side-safe access trace window", () => {
    let state = toRunnerTurn(
      v1917GenericAssetGame("v1918-turbeau-access-trace"),
    );
    state.corp.credits = 5;
    state.runner.credits = 5;
    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_372_turbeau-delacroix",
    );
    state.cardInstances[upgradeId] = {
      ...state.cardInstances[upgradeId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 10,
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
    });
    expect(state.pendingChoice?.side).toBe("corp");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      traceStarted: true,
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: "onr_v1_372_turbeau-delacroix",
    });

    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Red Herrings as a server-bound agenda steal tax", () => {
    let state = toRunnerTurn(
      v1917GenericAssetGame("v1918-red-herrings-steal-tax"),
    );
    state.runner.credits = 7;
    const redHerringsId = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");

    const stealAction = getLegalActions(state, "runner").find(
      (action) => action.type === "steal_agenda",
    );
    expect(stealAction?.costs).toEqual([{ credits: 5 }]);
    expect(stealAction?.payload).toMatchObject({
      v1918UpgradeAbility: "red_herrings_steal_tax",
      redHerringsCardId: redHerringsId,
      stealAdditionalCost: 5,
    });

    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.credits).toBe(2);
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "steal_agenda",
      v1918UpgradeAbility: "red_herrings_steal_tax",
      stealAdditionalCost: 5,
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps V1.9.18 city-grid region replacement server-bound and visible", () => {
    let state = v1917GenericAssetGame("v1918-city-grid-region-install");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstGridId = moveCorpCardToHq(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === firstGridId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );

    const secondGridId = moveCorpCardToHq(state, "onr_v1_365_paris-city-grid");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );

    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(remote?.root).toContain(secondGridId);
    expect(remote?.root).not.toContain(firstGridId);
    expect(state.corp.archives).toContain(firstGridId);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === firstGridId)?.definitionId,
    ).toBe("onr_v1_355_crystal-palace-station-grid");
    expect(validateGameState(state).ok).toBe(true);
  });

  it("covers V1.9.18 counter, tag-condition and hidden-zone upgrade actions", () => {
    let state = v1917GenericAssetGame("v1918-counter-tag-hidden-actions");
    state.corp.credits = 10;
    state.runner.tags = 1;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    const omniId = putCorpRootInRemote(state, "onr_v1_364_omni-kismet-ph-d");
    const galvestonId = putCorpRootInRemote(
      state,
      "onr_v1_362_new-galveston-city-grid",
    );
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    for (const upgradeId of [crystalId, omniId, galvestonId]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1918UpgradeAbility === "add_power_counter",
    );
    expect(cardCounterAmount(state, crystalId, "power")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1918UpgradeAbility: "add_power_counter",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1918UpgradeAbility === "tag_condition_credit",
    );
    expect(state.corp.credits).toBe(11);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1918UpgradeAbility: "tag_condition_credit",
      runnerTagsAfter: 1,
    });

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1918UpgradeAbility === "reveal_rd_top",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_city_grid_reveal_rd_top",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"/,
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("covers V1.9.18 city-grid trace and run-start stealth tax paths", () => {
    let traceState = v1917GenericAssetGame("v1918-paris-city-grid-trace");
    traceState.corp.credits = 5;
    traceState.runner.credits = 5;
    traceState = apply(
      traceState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const parisId = putCorpRootInRemote(
      traceState,
      "onr_v1_365_paris-city-grid",
    );
    traceState.cardInstances[parisId] = {
      ...traceState.cardInstances[parisId]!,
      faceup: true,
      rezzed: true,
    };
    const traceInitial = structuredClone(traceState);
    const traceReplayStart = traceState.eventLog.length;

    traceState = apply(
      traceState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1918UpgradeAbility === "trace_2_tag",
    );
    expect(traceState.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 2,
      sourceDefinitionId: "onr_v1_365_paris-city-grid",
    });
    traceState = applyChoice(traceState, "corp", "bid_0");
    traceState = applyChoice(traceState, "runner", "bid_0");
    expect(traceState.runner.tags).toBe(1);
    expect(validateGameState(traceState).ok).toBe(true);
    const traceReplay = replayEvents(
      traceInitial,
      traceState.eventLog.slice(traceReplayStart),
    );
    expect(traceReplay.ok).toBe(true);
    expect(hashState(traceReplay.state)).toBe(hashState(traceState));

    let runState = toRunnerTurn(v1917GenericAssetGame("v1918-stealth-run-tax"));
    runState.runner.credits = 0;
    const surveillanceId = putCorpRootInRemote(
      runState,
      "onr_v1_373_twenty-four-hour-surveillance",
    );
    runState.cardInstances[surveillanceId] = {
      ...runState.cardInstances[surveillanceId]!,
      faceup: true,
      rezzed: true,
    };
    const stealthId = installRunnerProgramForTest(
      runState,
      "onr_v1_035_invisibility",
    );
    runState.cardInstances[stealthId] = {
      ...runState.cardInstances[stealthId]!,
      counters: { recurring_credit: 1 },
    };
    const runInitial = structuredClone(runState);
    const runReplayStart = runState.eventLog.length;

    const runAction = getLegalActions(runState, "runner").find(
      (action) =>
        action.type === "start_run" &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.v1918UpgradeAbility === "run_start_tax",
    );
    expect(runAction?.costs).toEqual([{ clicks: 1, credits: 1 }]);
    runState = apply(
      runState,
      "runner",
      (action) => action.actionId === runAction?.actionId,
    );

    expect(cardCounterAmount(runState, stealthId, "recurring_credit")).toBe(0);
    expect(runState.runner.credits).toBe(0);
    expect(runState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      v1918UpgradeAbility: "run_start_tax",
      runStartTaxPaid: 1,
    });
    expect(validateGameState(runState).ok).toBe(true);
    const runReplay = replayEvents(
      runInitial,
      runState.eventLog.slice(runReplayStart),
    );
    expect(runReplay.ok).toBe(true);
    expect(hashState(runReplay.state)).toBe(hashState(runState));
  });
});

describe("MVP 0.97 Run, Jack-out, Breach and Multiaccess", () => {
  it("creates V0.97 games with explicit demo decks and keeps old run behavior gated", () => {
    const state = createGameAfterSetup({
      seed: "v097-baseline",
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
    });
    const legacy = toRunnerTurn(
      createGameAfterSetup({ seed: "v097-legacy-gate" }),
    );

    expect(state.baseline.engineSchemaVersion).toBe("0.97.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.97",
    );
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.97");
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v097_deep_dive_event",
      ),
    ).toBe(true);

    let oldRun = legacy;
    oldRun = apply(
      oldRun,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(oldRun.timingPoint).toBe("access.resolve_card");
    expect(oldRun.run?.breach).toBeUndefined();
    expect(
      getLegalActions(oldRun, "runner").map((action) => action.type),
    ).not.toContain("jack_out");
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

describe("V1.1.2 Full Archives Access", () => {
  it("builds a deterministic mixed Archives queue without revealing facedown entries before access", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-queue"));
    const faceupOperation = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownAsset = moveCorpCardToArchives(
      state,
      "simple_economy_asset",
      false,
    );
    const facedownAgenda = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );
    keepOnlyCorpArchivesCards(state, [
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);

    const runnerBefore = getPlayerView(state, "runner");
    const corpBefore = getPlayerView(state, "corp");

    expect(runnerBefore.opponent.discardCount).toBe(3);
    expect(JSON.stringify(runnerBefore)).toContain("Simple Economy Operation");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Agenda");
    expect(JSON.stringify(corpBefore)).toContain("Simple Economy Asset");
    expect(JSON.stringify(corpBefore)).toContain("Simple Agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(
      state.run?.breach?.queue.map((entry) => entry.cardInstanceId),
    ).toEqual([faceupOperation, facedownAsset, facedownAgenda]);
    expect(state.run?.breach?.queue.map((entry) => entry.hiddenInfo)).toEqual([
      false,
      true,
      true,
    ]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Economy Asset",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
  });

  it("reveals only the current Archives card, preserves queue progress, and replays deterministically", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-access"));
    state.runner.credits = 10;
    const faceupOperation = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownAsset = moveCorpCardToArchives(
      state,
      "simple_economy_asset",
      false,
    );
    const facedownAgenda = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );
    keepOnlyCorpArchivesCards(state, [
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "Archives",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Economy Asset",
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.breach?.accessedSummaries).toEqual([
      {
        entryId: `${state.run?.runId}.breach.0`,
        status: "accessed",
        cardDefinitionId: "simple_economy_operation",
      },
    ]);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[facedownAsset]?.faceup).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_asset",
      title: "Simple Economy Asset",
      serverLabel: "Archives",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );

    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(
      state.corp.archives.filter((id) => id === facedownAsset),
    ).toHaveLength(1);
    expect(state.corp.archives).toEqual([
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);
    expect(state.run?.breach?.currentIndex).toBe(2);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[facedownAgenda]?.faceup).toBe(true);
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.scoreArea).toContain(facedownAgenda);
    expect(state.run).toBeUndefined();
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("MVP 0.98a Identity and modifiers", () => {
  it("creates deterministic V0.98 games with setup and static identity modifiers", () => {
    const first = v098IdentityGame("v098-identity-setup");
    const second = v098IdentityGame("v098-identity-setup");
    const legacy = createGameAfterSetup({ seed: "v098-legacy-identity" });

    expect(first.baseline.engineSchemaVersion).toBe("0.98.0");
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.98",
    );
    expect(first.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.98");
    expect(first.runner.credits).toBe(6);
    expect(first.corp.credits).toBe(6);
    expect(first.runner.memoryLimit).toBe(5);
    expect(first.identityAbilityUsage?.corp?.setupAbilities).toEqual([
      "v098_corp_identity_setup_credit",
    ]);
    expect(first.identityAbilityUsage?.runner?.setupAbilities).toEqual([
      "v098_runner_identity_setup_credit",
    ]);
    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);

    expect(legacy.baseline.engineSchemaVersion).toBe("0.1.0");
    expect(legacy.runner.credits).toBe(5);
    expect(legacy.corp.credits).toBe(5);
    expect(legacy.runner.memoryLimit).toBe(4);
    expect(legacy.identityAbilityUsage).toBeUndefined();
  });

  it("uses V0.98 runner base link during Trace bidding", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-link-trace"));
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

    expect(state.trace?.runnerLink).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      runnerLink: 1,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
  });

  it("applies static memory before installs and validates replay-safe state hashes", () => {
    const state = v098IdentityGame("v098-memory-static");
    const initialHash = hashState(state);

    installRunnerProgramCopyForTest(state, "simple_fracter");
    installRunnerProgramCopyForTest(state, "simple_fracter");
    installRunnerProgramCopyForTest(state, "simple_decoder");
    installRunnerProgramCopyForTest(state, "simple_killer");
    installRunnerProgramCopyForTest(state, "simple_killer");

    expect(state.runner.memoryLimit).toBe(5);
    expect(state.runner.memoryUsed).toBe(5);
    expect(validateGameState(state).ok).toBe(true);
    expect(hashState(v098IdentityGame("v098-memory-static"))).toBe(initialHash);
  });

  it("does not expose V0.99+ mechanics while enabling identity modifiers", () => {
    const state = toRunnerTurn(v098IdentityGame("v098-no-future-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).toContain(
      "identity_ability",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "purge",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "prevention",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "replacement",
    );
  });

  it("searches the Runner stack through a private Choice and deterministic shuffle", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-search-stack"));
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    const selectedProgram = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_search_event",
    );

    expect(state.pendingChoice?.kind).toBe("select_cards");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Decoder",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: "corp.resolve_choice.game_rule",
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${selectedProgram}`],
      },
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const invalidChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(
        state,
        "runner",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["card_not_in_choice"],
      },
    });
    expect(invalidChoice.ok).toBe(false);
    if (!invalidChoice.ok)
      expect(invalidChoice.error.code).toBe("ERR_INVALID_CHOICE");

    state = applyChoice(state, "runner", `card_${selectedProgram}`);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Decoder",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("arranges top stack cards privately without exposing order to the Corp", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-arrange-stack"));
    moveRunnerCardToGrip(state, "v098_stack_arrange_event");
    const first = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const second = putRunnerCardOnTopOfStack(state, "simple_run_event");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_arrange_event",
    );

    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.label,
      ),
    ).toEqual(["Simple Run Event", "Simple Economy Event"]);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Run Event",
    );

    state = applyChoices(state, "runner", [`card_${first}`, `card_${second}`]);

    expect(state.runner.stack.slice(0, 2)).toEqual([first, second]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Run Event",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("reveals and exposes only deliberate public card information", () => {
    let revealState = toRunnerTurn(v098IdentityGame("v098-reveal-top"));
    moveRunnerCardToGrip(revealState, "v098_reveal_top_event");
    putRunnerCardOnTopOfStack(revealState, "simple_decoder");

    revealState = apply(
      revealState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(revealState, action) === "v098_reveal_top_event",
    );

    expect(revealState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(revealState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_decoder",
      title: "Simple Decoder",
    });

    let exposeState = toRunnerTurn(v098IdentityGame("v098-expose"));
    moveRunnerCardToGrip(exposeState, "v098_expose_event");
    const exposed = putCorpRootInRemote(exposeState, "simple_economy_asset");

    exposeState = apply(
      exposeState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(exposeState, action) === "v098_expose_event" &&
        action.payload?.serverId === "remote_1",
    );

    expect(exposeState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "expose",
      cardDefinitionId: "simple_economy_asset",
      title: "Simple Economy Asset",
    });
    expect(exposeState.cardInstances[exposed]?.rezzed).toBe(false);
    expect(
      getPlayerView(exposeState, "runner").servers.find(
        (server) => server.id === "remote_1",
      )?.root[0]?.known,
    ).toBe(false);
  });

  it("swaps Corp hidden zones without unrecorded randomness or public title leaks", () => {
    let state = v098IdentityGame("v098-swap-hq-rd");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v098_hq_rd_swap_operation");
    const hqCard = moveCorpCardToHq(state, "simple_economy_asset");
    const rdCard = putCorpCardOnTopOfRd(state, "simple_agenda");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v098_hq_rd_swap_operation",
    );

    expect(state.corp.hq).toContain(rdCard);
    expect(state.corp.rd[0]).toBe(hqCard);
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });
});

describe("MVP 0.99 Hosting, Viren, Purge und Counter-Familien", () => {
  it("creates deterministic V0.99 games with additive counter and hosting contracts", () => {
    const first = v099CounterHostingGame("v099-baseline");
    const second = v099CounterHostingGame("v099-baseline");

    expect(first.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.99",
    );
    expect(first.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.99");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v099_virus_program?.mechanics).toContain("virus");
    expect(DEMO_CARDS_BY_ID.v099_recurring_chip?.recurringCredits).toBe(1);
    expect(hashState(first)).toBe(hashState(second));
    expect(validateGameState(first).ok).toBe(true);
  });

  it("installs a virus program and lets the Corp purge only virus counters", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-virus-purge"));
    state.runner.credits = 3;
    moveRunnerCardToGrip(state, "v099_virus_program");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v099_virus_program",
    );
    const virusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "v099_virus_program",
    );
    expect(virusId).toBeDefined();
    if (!virusId) throw new Error("Missing virus program");
    state.cardInstances[virusId] = {
      ...state.cardInstances[virusId]!,
      counters: { ...state.cardInstances[virusId]!.counters, power: 2 },
    };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    const initial = structuredClone(state);

    const purge = mustAction(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );

    expect(state.corp.clicks).toBe(0);
    expect(state.cardInstances[virusId]?.counters?.virus).toBeUndefined();
    expect(state.cardInstances[virusId]?.counters?.power).toBe(2);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionCostClicks: 3,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 3,
      purgedCounterType: "virus",
      purgedVirusCounters: 1,
    });
    expect(state.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
    expect(
      getLegalActions(state, "corp").map((action) => action.type),
    ).not.toContain("purge_virus_counters");
  });

  it("hosts a Runner program through a private choice and trashes hosted cards with the host", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-hosting"));
    state.runner.credits = 2;
    const hostCandidate = moveRunnerCardToGrip(state, "v099_host_resource");
    const hostedCandidate = moveRunnerCardToGrip(state, "simple_decoder");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.source === hostCandidate,
    );

    expect(state.pendingChoice?.source).toContain("v099.host_program");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Decoder",
    );

    state = applyChoice(state, "runner", `card_${hostedCandidate}`);

    expect(state.cardInstances[hostedCandidate]?.hostedOn).toBe(hostCandidate);
    expect(state.runner.rig.programs).toContain(hostedCandidate);
    expect(validateGameState(state).ok).toBe(true);
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === hostCandidate,
    );

    expect(state.runner.heap).toContain(hostCandidate);
    expect(state.runner.heap).toContain(hostedCandidate);
    expect(state.cardInstances[hostedCandidate]?.hostedOn).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(hostedCandidate);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("uses recurring credits for program installs and refreshes without accumulation", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-recurring"));
    state.runner.credits = 0;
    const chip = moveRunnerCardToGrip(state, "v099_recurring_chip");
    const virus = moveRunnerCardToGrip(state, "v099_virus_program");

    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.source === chip,
    );
    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "install_card" && action.source === virus,
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.source === virus,
    );
    expect(state.runner.credits).toBe(0);
    expect(
      state.cardInstances[chip]?.counters?.recurring_credit,
    ).toBeUndefined();
    expect(state.cardInstances[virus]?.counters?.virus).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );

    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("creates and spends Bad Publicity credits during a run only", () => {
    let state = v099CounterHostingGame("v099-bad-publicity");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v099_bad_publicity_operation");
    keepOnlyCorpHqCards(state, state.corp.hq.slice(0, 1));
    state.corp.credits = 0;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v099_bad_publicity_operation",
    );
    expect(state.corp.badPublicity).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      badPublicityAfter: 1,
    });

    state = apply(state, "corp", (action) => action.type === "end_turn");
    installRunnerProgramForTest(state, "simple_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.runner.credits = 0;
    state.corp.credits = 10;
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.run?.badPublicityCredits).toBe(1);
    expect(getPlayerView(state, "runner").run?.badPublicityCredits).toBe(1);
    const laterBadPublicityChange = structuredClone(state);
    laterBadPublicityChange.corp.badPublicity = 2;
    expect(laterBadPublicityChange.run?.badPublicityCredits).toBe(1);
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker");

    expect(state.run?.badPublicityCredits).toBe(0);
    expect(state.runner.credits).toBe(0);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("does not expose M11+ mechanics while enabling V0.99 harness cards", () => {
    const state = toRunnerTurn(v099CounterHostingGame("v099-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain(
      "prevention",
    );
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain(
      "replacement",
    );
    expect(DEMO_CARDS_BY_ID.v099_virus_program?.mechanics).not.toContain(
      "set_aside",
    );
    expect(
      DEMO_CARDS_BY_ID.v099_bad_publicity_operation?.mechanics,
    ).not.toContain("remove_from_game");
  });
});

describe("MVP 0.93 M1 effect, ability and choice foundation", () => {
  it("exposes pendingChoice only to the owning side and resolves it through LegalActions", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "v093-choice" }));
    state.pendingChoice = choiceRequest(state, "runner");

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const runnerActions = getLegalActions(state, "runner");

    expect(runnerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(runnerView.pendingChoice?.options[0]?.label).toBe(
      "Keep private option",
    );
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Keep private option");
    expect(runnerActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(
      runnerActions.some((action) => action.type === "trigger_ability"),
    ).toBe(false);

    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["illegal"],
      },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("ERR_INVALID_CHOICE");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["keep"],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.pendingChoice).toBeUndefined();
    expect(result.event.visibilityClass).toBe("private_to_side");
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "Keep private option",
    );
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "private prompt",
    );
    expect(replayEvents(state, [result.event]).ok).toBe(true);
  });

  it("keeps normal games free of generic V0.93 action types", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "v093-no-visible-new-actions" }),
    );
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
  });

  it("runs basic effect commands without mutating the original state", () => {
    const state = createGameAfterSetup({ seed: "v093-effects" });
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [
      { type: "gain_credits", side: "runner", amount: 3 },
      { type: "spend_credits", side: "runner", amount: 1 },
      { type: "add_tag", amount: 2 },
      { type: "remove_tag", amount: 1 },
    ]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.credits).toBe(state.runner.credits + 2);
    expect(next.runner.tags).toBe(1);
    expect(validateGameState(next).ok).toBe(true);
  });

  it("keeps breaker pump and break public action types while adding ability metadata", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v093-breaker-ability",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    state.corp.credits = 10;

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
        sourceDefinition(state, action) === "v08_wall_ice",
    );
    const pump = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );

    expect(pump.abilityRef).toMatchObject({
      sourceCardInstanceId: pump.source,
    });
    expect(pump.effectRef).toMatch(/^effect\./);
    expect(
      pump.targetRequirements.some(
        (target) =>
          target.id === "encounteredIce" && target.visibility === "public",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === pump.actionId,
    );
    const breaker = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );

    expect(breaker.abilityRef).toMatchObject({
      sourceCardInstanceId: breaker.source,
    });
    expect(breaker.effectRef).toMatch(/^effect\./);
    expect(breaker.type).toBe("break_subroutine");
  });

  it("classifies access as a hidden-info barrier event", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v093-event-classification",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    putCorpCardOnTopOfRd(state, "v08_project_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const access = mustAction(
      state,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(eventVisibilityForAction(access)).toBe("hidden_info_barrier");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === access.actionId,
    );
    const event = state.eventLog.at(-1);
    expect(event).toBeDefined();
    if (!event) throw new Error("Missing access event");
    expect(event.visibilityClass).toBe("hidden_info_barrier");
    expect(isHiddenInfoBarrierEvent(event)).toBe(true);
  });
});

describe("MVP 0.4 controlled card pool and tags", () => {
  it("creates V0.4 games with explicit expanded demo decks on the V1.1.0 agenda target", () => {
    const legacy = createGameAfterSetup({ seed: "legacy-default" });
    const expanded = createGameAfterSetup({
      seed: "v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
    });

    expect(legacy.agendaPointsToWin).toBe(7);
    expect(expanded.agendaPointsToWin).toBe(7);
    expect(
      Object.values(expanded.cardInstances).some(
        (card) => card.definitionId === "simple_setup_hardware",
      ),
    ).toBe(true);
    expect(
      Object.values(expanded.cardInstances).some(
        (card) => card.definitionId === "simple_tag_ice",
      ),
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_runner_004, {
        expectedSide: "runner",
        allowedDeckIds: ["demo_runner_004"],
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_004, {
        expectedSide: "corp",
        allowedDeckIds: ["demo_corp_004"],
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_004, {
        expectedSide: "runner",
      }).ok,
    ).toBe(false);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_001, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(false);
  });

  it("plays safe batch draw cards and installs hardware for memory", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-runner-safe",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "simple_draw_event");
    moveRunnerCardToGrip(state, "simple_setup_hardware");

    const beforeGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "simple_draw_event",
    );
    expect(state.runner.grip.length).toBe(beforeGrip + 1);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_setup_hardware",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
    expect(
      state.runner.rig.hardware.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("simple_setup_hardware");
  });

  it("rezzes and trashes a simple upgrade without leaking its title before access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-upgrade",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    putCorpRootInRemote(state, "simple_upgrade");

    let runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Upgrade");

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_upgrade",
    );
    runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).toContain("Simple Upgrade");

    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(
      state.corp.archives.map((id) => state.cardInstances[id]?.definitionId),
    ).toContain("simple_upgrade");
  });

  it("applies tags from ICE and lets Runner remove one tag", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-tags",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    putCorpIceOnServer(state, "rd", "simple_tag_ice");
    state.corp.credits = 5;
    state.runner.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.tags).toBe(1);
    expect(getPlayerView(state, "corp").opponent.tags).toBe(1);

    state.runner.clicks = 1;
    state.runner.credits = 2;
    state = apply(state, "runner", (action) => action.type === "remove_tag");
    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(0);
  });

  it("gates tag punishment operation on runner tags", () => {
    let state = createGameAfterSetup({
      seed: "v04-punishment",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_tag_punishment_operation");

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          sourceDefinition(state, action) === "simple_tag_punishment_operation",
      ),
    ).toBe(false);
    state.runner.tags = 1;
    state.runner.credits = 5;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "simple_tag_punishment_operation",
    );
    expect(state.runner.credits).toBe(3);
  });
});

describe("MVP 0.8 playable starter slice", () => {
  it("creates V0.8 games with explicit starter decks and baseline", () => {
    const state = createGameAfterSetup({
      seed: "v08-starter",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
    });

    expect(state.baseline.engineSchemaVersion).toBe("0.8.0");
    expect(state.baseline.cardImplementationVersion).toBe("0.8.0");
    expect(state.agendaPointsToWin).toBe(7);
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.8",
    );
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.8");
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v08_burst_credit_event",
      ),
    ).toBe(true);
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v08_watchdog_ice",
      ),
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_runner_008, {
        expectedSide: "runner",
        allowedDeckIds: ["demo_runner_008"],
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_008, {
        expectedSide: "corp",
        allowedDeckIds: ["demo_corp_008"],
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("resolves V0.8 runner event and install resolvers", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-runner-events",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_burst_credit_event");
    moveRunnerCardToGrip(state, "v08_deep_draw_event");
    moveRunnerCardToGrip(state, "v08_memory_chip");

    const beforeCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_burst_credit_event",
    );
    expect(state.runner.credits).toBe(beforeCredits + 5);

    const beforeGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_deep_draw_event",
    );
    expect(state.runner.grip.length).toBe(beforeGrip + 2);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_memory_chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
  });

  it("uses V0.8 run events and breaker definitions through LegalActions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-run-pressure",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_overclock_run_event");
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    putCorpCardOnTopOfRd(state, "v08_credit_surge_operation");
    state.corp.credits = 10;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_overclock_run_event" &&
        action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "v08_wall_ice",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const beforeAccessCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.credits).toBe(beforeAccessCredits + 3);
    expect(state.run).toBeUndefined();
  });

  it("resolves V0.8 corp operations, asset rez and agenda scoring", () => {
    let state = createGameAfterSetup({
      seed: "v08-corp-economy",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 8;
    moveCorpCardToHq(state, "v08_credit_surge_operation");
    moveCorpCardToHq(state, "v08_archive_planning_operation");
    moveCorpCardToHq(state, "v08_cashout_asset");
    moveCorpCardToHq(state, "v08_project_agenda");

    const beforeCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v08_credit_surge_operation",
    );
    expect(state.corp.credits).toBe(beforeCredits + 6);

    const beforeHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v08_archive_planning_operation",
    );
    expect(state.corp.hq.length).toBe(beforeHq + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_cashout_asset",
    );
    const beforeRezCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "v08_cashout_asset",
    );
    expect(state.corp.credits).toBe(beforeRezCredits + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );

    expect(agendaPoints(state, "corp")).toBe(2);
  });

  it("keeps V0.8 hidden ICE redacted until rez and applies tag subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-watchdog",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    putCorpIceOnServer(state, "rd", "v08_watchdog_ice");
    state.corp.credits = 10;
    state.runner.credits = 5;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Watchdog ICE",
    );

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
        sourceDefinition(state, action) === "v08_watchdog_ice",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Watchdog ICE",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.tags).toBe(1);
    expect(getPlayerView(state, "corp").opponent.tags).toBe(1);
    expect(state.run).toBeUndefined();
  });
});

describe("V1.2.0 Event Modification Foundation", () => {
  it("opens a side-private Damage Prevention window before damage randomness", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-window",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    expect(state.imminentEvent).toMatchObject({
      eventType: "damage",
      affectedSide: "runner",
    });
    expect(state.eventModificationWindow).toMatchObject({
      kind: "prevent",
      side: "runner",
    });
    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.runner.coreDamage).toBe(0);
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toContain("pass");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Test-only Damage Prevention",
    );
  });

  it("applies full Damage Prevention without creating RandomDrawRecords", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-full",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const preventOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(preventOption).toBeDefined();
    state = applyChoice(state, "runner", String(preventOption));

    const finalEvent = state.eventLog.at(-1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.imminentEvent).toBeUndefined();
    expect(state.runner.coreDamage).toBe(0);
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(finalEvent?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      damageAmount: 0,
      preventedAmount: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("passes Damage Prevention and resolves the original damage path", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-pass",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "pass",
      eventModificationOutcome: "original_resolved",
      damageAmount: 1,
      coreDamageAfter: 1,
    });
  });

  it("supports partial Damage Prevention and stable StateHash divergence", () => {
    let prevented = onrV1Game("v120-partial-prevent");
    prevented.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 2 },
    };
    prevented = apply(
      prevented,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    prevented.runner.tags = 1;
    moveCorpCardToHq(prevented, "onr_v1_302_scorched-earth");
    prevented = apply(
      prevented,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(prevented, action) === "onr_v1_302_scorched-earth",
    );
    const preventOption = prevented.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    prevented = applyChoice(prevented, "runner", String(preventOption));

    let passed = onrV1Game("v120-partial-prevent");
    passed.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 2 },
    };
    passed = apply(
      passed,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    passed.runner.tags = 1;
    moveCorpCardToHq(passed, "onr_v1_302_scorched-earth");
    passed = apply(
      passed,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(passed, action) === "onr_v1_302_scorched-earth",
    );
    passed = applyChoice(passed, "runner", "pass");

    expect(prevented.eventLog.at(-1)?.publicPayload).toMatchObject({
      originalAmount: 4,
      preventedAmount: 2,
      finalAmount: 2,
      cardsTrashed: 2,
    });
    expect(passed.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageAmount: 4,
      cardsTrashed: 4,
    });
    expect(hashState(prevented)).not.toBe(hashState(passed));
  });

  it("revalidates Event Modification choices through applyAction", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-revalidate",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["pass"],
      },
    });
    const badChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["not-a-candidate"],
      },
    });

    expect(wrongSide.ok).toBe(false);
    expect(badChoice.ok).toBe(false);
    if (!badChoice.ok)
      expect(badChoice.error.message).not.toContain(
        "Test-only Damage Prevention",
      );
  });
});

describe("V1.2.1 Replacement Effects", () => {
  it("opens a separate Damage Replacement window with original event context", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-window",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    expect(state.replacementWindow).toMatchObject({
      eventType: "damage",
      originalEventId: state.imminentEvent?.eventId,
    });
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementWindowOpened: true,
      originalEventType: "damage",
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("replaces Damage with a test-only Tag event without applying the original damage", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-apply",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const replaceOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    state = applyChoice(state, "runner", String(replaceOption));

    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.tags).toBe(1);
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      originalEventType: "damage",
      replacementEventType: "add_tag",
      tagsAdded: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("passes optional Damage Replacement and resolves the original damage", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-pass",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.runner.tags).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      damageAmount: 1,
    });
  });

  it("blocks ambiguous Replacement conflicts visibly instead of choosing silently", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-conflict",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
      damageReplacementConflict: true,
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const action = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Replacement-Konflikt");
      expect(result.error.message).not.toContain(
        "Test-only Damage Replacement",
      );
    }
  });
});

describe("V1.2.2 Special Zones, Ownership and Control", () => {
  it("moves a card to side-private Set Aside atomically without public identity leaks and replays deterministically", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-set-aside" }));
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      setAside: {
        visibility: "side_private",
        visibilitySide: "runner",
        reason: "v122_side_private_set_aside",
        allowReturn: true,
      },
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "move_to_set_aside" &&
        action.payload?.cardId === cardId,
    );

    expect(validateGameState(state).ok).toBe(true);
    expect(state.runner.grip).not.toContain(cardId);
    expect(state.specialZones?.setAside).toEqual([cardId]);
    expect(state.cardInstances[cardId]?.zone).toMatchObject({
      side: "special",
      zone: "set_aside",
      visibility: "side_private",
      visibilitySide: "runner",
    });
    expect(
      getPlayerView(state, "runner").specialZones?.setAside[0],
    ).toMatchObject({
      definitionId: "simple_economy_event",
      owner: "runner",
      controller: "runner",
    });
    expect(
      getPlayerView(state, "corp").specialZones?.setAside[0],
    ).toMatchObject({ known: false });
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Economy Event",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "move_to_set_aside",
      specialZone: "set_aside",
      redactedKind: "special_zone",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Economy Event",
    );
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("supports test-only return from Set Aside without enabling Removed from Game return", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v122-return-terminal" }),
    );
    const setAsideId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: setAsideId,
      setAside: {
        visibility: "public",
        reason: "v122_public_set_aside",
        allowReturn: true,
        returnZone: { side: "runner", zone: "grip" },
      },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "return_from_set_aside",
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) => action.type === "return_from_set_aside",
    );
    expect(state.runner.grip).toContain(setAsideId);
    expect(state.specialZones?.setAside).toEqual([]);

    const removedId = moveRunnerCardToGrip(state, "simple_run_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: removedId,
      removedFromGame: {
        visibility: "hidden",
        reason: "v122_terminal_removed",
      },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_removed_from_game",
    );
    expect(state.specialZones?.removedFromGame).toEqual([removedId]);
    expect(state.cardInstances[removedId]?.zone).toMatchObject({
      side: "special",
      zone: "removed_from_game",
      visibility: "hidden",
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "return_from_set_aside",
      ),
    ).toBe(false);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Run Event",
    );
  });

  it("changes controller deterministically without changing owner and rejects wrong-side or stale actions", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-control" }));
    const cardId = installRunnerProgramForTest(state, "simple_fracter");
    const beforeHash = hashState(state);
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: {
        newController: "corp",
        visibility: "public",
        reason: "v122_limited_control_change",
      },
    };
    const action = mustAction(
      state,
      "runner",
      (candidate) => candidate.type === "change_card_control",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(wrongSide.ok).toBe(false);
    expect(stale.ok).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (candidate) => candidate.actionId === action.actionId,
    );

    expect(state.cardInstances[cardId]?.owner).toBe("runner");
    expect(state.cardInstances[cardId]?.controller).toBe("corp");
    expect(hashState(state)).not.toBe(beforeHash);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "change_card_control",
      oldController: "runner",
      newController: "corp",
      ownershipChanged: false,
    });
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === cardId,
      )?.controller,
    ).toBe("corp");
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps hosted card invariants when a controlled host is trashed", () => {
    let state = installedResourceCorpTurn("v122-host-control-trash");
    const resourceId = state.runner.rig.resources[0]!;
    const hostedId = installRunnerProgramForTest(state, "simple_decoder");
    state.cardInstances[hostedId] = {
      ...state.cardInstances[hostedId]!,
      hostedOn: resourceId,
    };
    state.specialZoneHarness = {
      actor: "corp",
      cardInstanceId: resourceId,
      controlChange: {
        newController: "corp",
        visibility: "public",
        reason: "v122_controlled_host",
      },
    };
    state = apply(
      state,
      "corp",
      (action) => action.type === "change_card_control",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === resourceId,
    );

    expect(validateGameState(state).ok).toBe(true);
    expect(state.runner.heap).toContain(resourceId);
    expect(state.runner.heap).toContain(hostedId);
    expect(state.cardInstances[resourceId]?.owner).toBe("runner");
    expect(state.cardInstances[resourceId]?.controller).toBe("corp");
    expect(state.cardInstances[hostedId]?.owner).toBe("runner");
    expect(state.cardInstances[hostedId]?.controller).toBe("runner");
    expect(state.cardInstances[hostedId]?.hostedOn).toBeUndefined();
  });
});

const ONR_V1_0_5K_FINAL_CARD_IDS = [
  "onr_v1_015_codeslinger",
  "onr_v1_052_raffles",
  "onr_v1_054_raptor",
  "onr_v1_070_tinweasel",
  "onr_v1_144_tycho-mem-chip",
  "onr_v1_146_zetatech-mem-chip",
  "onr_v1_203_hostile-takeover",
  "onr_v1_230_cortical-scanner",
  "onr_v1_232_crystal-wall",
  "onr_v1_237_data-wall",
  "onr_v1_238_data-wall-2-0",
  "onr_v1_239_endless-corridor",
] as const;

const ONR_V1_0_6K_FINAL_CARD_IDS = [
  "onr_v1_079_bodyweight-synthetic-blood",
  "onr_v1_095_jack-n-joe",
  "onr_v1_097_livewires-contacts",
  "onr_v1_108_score",
  "onr_v1_072_wild-card",
  "onr_v1_145_wutech-mem-chip",
  "onr_v1_220_tycho-extension",
  "onr_v1_281_accounts-receivable",
  "onr_v1_282_annual-reviews",
  "onr_v1_285_closed-accounts",
  "onr_v1_287_datapool-by-zetatech",
  "onr_v1_288_day-shift",
  "onr_v1_290_efficiency-experts",
  "onr_v1_301_punitive-counterstrike",
  "onr_v1_302_scorched-earth",
  "onr_v1_307_urban-renewal",
  "onr_v1_244_filter",
  "onr_v1_245_fire-wall",
  "onr_v1_252_keeper",
  "onr_v1_256_mazer",
] as const;

const ONR_V1_1_2K_FINAL_CARD_IDS = [
  "onr_v1_006_black-dahlia",
  "onr_v1_014_codecracker",
  "onr_v1_016_cyfermaster",
  "onr_v1_040_loony-goon",
  "onr_v1_060_shaka",
  "onr_v1_073_wizards-book",
  "onr_v1_253_laser-wire",
  "onr_v1_257_nerve-labyrinth",
  "onr_v1_259_in-the-face",
  "onr_v1_261_quandary",
  "onr_v1_262_razor-wire",
  "onr_v1_263_reinforced-wall",
  "onr_v1_265_rock-is-strong",
  "onr_v1_266_scramble",
  "onr_v1_269_shotgun-wire",
  "onr_v1_270_sleeper",
  "onr_v1_278_wall-of-ice",
  "onr_v1_279_wall-of-static",
  "onr_v1_293_netwatch-credit-voucher",
  "onr_v1_295_night-shift",
] as const;

const ONR_V1_2_3_FINAL_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_249_hunter",
  "onr_v1_297_overtime-incentives",
  "onr_v1_306_trojan-horse",
] as const;

const ONR_V1_6_1_FINAL_CARD_IDS = [
  "onr_v1_023_evil-twin",
  "onr_v1_028_force-shield",
  "onr_v1_125_dermatech-bodyplating",
  "onr_v1_229_code-corpse",
  "onr_v1_231_cortical-scrub",
  "onr_v1_254_liche",
] as const;

const ONR_V1_6_2_FINAL_CARD_IDS = [
  "onr_v1_212_priority-requisition",
  "onr_v1_215_security-net-optimization",
  "onr_v1_317_data-masons",
  "onr_v1_320_encoder-inc",
  "onr_v1_341_skalderviken-sa-beta-test-site",
] as const;

const ONR_V1_6_3_FINAL_CARD_IDS = [
  "onr_v1_233_d-arc-knight",
  "onr_v1_267_sentinels-prime",
  "onr_v1_273_triggerman",
  "onr_v1_350_antiquated-interface-routines",
  "onr_v1_371_tokyo-chiba-infighting",
] as const;

const ONR_V1_7_0_FINAL_CARD_IDS = [
  "onr_v1_011_cloak",
  "onr_v1_036_jackhammer",
  "onr_v1_069_succubus",
  "onr_v1_163_floating-runner-bbs",
  "onr_v1_180_smiths-pawnshop",
] as const;

const ONR_V1_7_1_FINAL_CARD_IDS = [
  "onr_v1_114_temple-microcode-outlet",
  "onr_v1_106_private-ldl-access",
  "onr_v1_118_weather-to-finance-pipe",
  "onr_v1_084_edited-shipping-manifests",
  "onr_v1_129_hq-interface",
] as const;

const ONR_V1_7_2_FINAL_CARD_IDS = [
  "onr_v1_283_audit-of-call-records",
  "onr_v1_284_chance-observation",
  "onr_v1_286_corporate-detective-agency",
  "onr_v1_158_danshis-second-id",
  "onr_v1_179_silicon-saloon-franchise",
] as const;

const ONR_V1_8_0_FINAL_CARD_IDS = [
  "onr_v1_083_desperate-competitor",
  "onr_v1_090_hot-tip-for-wns",
  "onr_v1_156_corporate-ally",
  "onr_v1_159_databroker",
  "onr_v1_201_executive-extraction",
  "onr_v1_214_project-babylon",
] as const;

const ONR_V1_8_1_FINAL_CARD_IDS = [
  "onr_v1_012_clown",
  "onr_v1_046_pattels-virus",
  "onr_v1_049_pox",
  "onr_v1_094_inside-job",
  "onr_v1_173_restrictive-net-zoning",
  "onr_v1_193_corporate-coup",
  "onr_v1_209_political-coup",
  "onr_v1_222_ball-and-chain",
  "onr_v1_225_canis-major",
  "onr_v1_226_canis-minor",
  "onr_v1_242_fatal-attractor",
  "onr_v1_268_shock-r",
] as const;

const ONR_V1_9_0_FINAL_CARD_IDS = [
  "onr_v1_005_bartmoss-memorial-icebreaker",
  "onr_v1_007_blink",
  "onr_v1_115_terrorist-reprisal",
  "onr_v1_223_banpei",
  "onr_v1_275_vacuum-link",
] as const;

const ONR_V1_9_1_FINAL_CARD_IDS = [
  "onr_v1_013_cockroach",
  "onr_v1_034_incubator",
  "onr_v1_030_grubb",
] as const;

const ONR_V1_9_2_FINAL_CARD_IDS = [
  "onr_v1_076_all-nighter",
  "onr_v1_096_kilroy-was-here",
  "onr_v1_107_romp-through-hq",
  "onr_v1_184_top-runners-conference",
  "onr_v1_188_ai-chief-financial-officer",
  "onr_v1_211_polymer-breakthrough",
  "onr_v1_235_data-naga",
] as const;

const ONR_V1_9_3_FINAL_CARD_IDS = [
  "onr_v1_207_netwatch-operations-office",
  "onr_v1_213_private-cybernet-police",
  "onr_v1_251_jack-attack",
  "onr_v1_271_tko-2-0",
] as const;

const ONR_V1_9_4_FINAL_CARD_IDS = [
  "onr_v1_208_on-call-solo-team",
  "onr_v1_217_strike-force-kali",
] as const;
const ONR_V1_9_5_FINAL_CARD_IDS = [
  "onr_v1_219_superior-net-barriers",
  "onr_v1_308_acme-savings-and-loan",
] as const;
const ONR_V1_9_6_FINAL_CARD_IDS = ["onr_v1_236_data-raven"] as const;
const ONR_V1_9_7_FINAL_CARD_IDS = ["onr_v1_001_afreet"] as const;
const ONR_V1_9_8_FINAL_CARD_IDS = [
  "onr_v1_018_dogcatcher",
  "onr_v1_019_dropp",
] as const;
const ONR_V1_9_9_FINAL_CARD_IDS = [
  "onr_v1_349_aardvark",
  "onr_v1_351_bizarre-encryption-scheme",
  "onr_v1_352_chester-mix",
  "onr_v1_353_chimera",
] as const;
const ONR_V1_9_12_RELEASE_CARD_IDS = [
  "onr_v1_009_butcher-boy",
  "onr_v1_010_cascade",
  "onr_v1_017_deep-thought",
  "onr_v1_032_i-spy",
  "onr_v1_064_skivviss",
  "onr_v1_082_deal-with-militech",
  "onr_v1_091_hunt-club-bbs",
  "onr_v1_174_rigged-investments",
  "onr_v1_176_the-shell-traders",
  "onr_v1_198_detroit-police-contract",
  "onr_v1_199_employee-empowerment",
] as const;
const ONR_V1_9_13_RELEASE_CARD_IDS = [
  "onr_v1_038_joan-of-arc",
  "onr_v1_121_armored-fridge",
  "onr_v1_127_full-body-conversion",
  "onr_v1_128_green-knight-surge-buffers",
  "onr_v1_130_lifesaver-nanosurgeons",
  "onr_v1_135_nasuko-cycle",
  "onr_v1_139_r-and-d-interface",
  "onr_v1_143_techtronica-utility-suit",
  "onr_v1_155_code-viral-cache",
  "onr_v1_161_fall-guy",
  "onr_v1_170_nomad-allies",
  "onr_v1_185_trauma-team",
  "onr_v1_186_umbrella-policy",
  "onr_v1_187_wilson-weeflerunner-apprentice",
  "onr_v1_224_bolter-cluster",
  "onr_v1_234_data-darts",
  "onr_v1_258_neural-blade",
] as const;
const ONR_V1_9_14_WIP_CARD_IDS = [
  "onr_v1_053_ramming-piston",
  "onr_v1_056_replicator",
  "onr_v1_063_signpost",
  "onr_v1_116_total-genetic-retrofit",
  "onr_v1_120_armadillo-armored-road-home",
  "onr_v1_126_drifter-mobile-environment",
  "onr_v1_132_microtech-trode-set",
  "onr_v1_154_broker",
  "onr_v1_157_crash-everett-inventive-fixer",
  "onr_v1_162_field-reporter-for-ice-and-data",
  "onr_v1_164_hells-run",
  "onr_v1_165_junkyard-bbs",
  "onr_v1_166_karl-de-veres-corporate-stooge",
  "onr_v1_167_leland-corporate-bodyguard",
  "onr_v1_178_short-term-contract",
  "onr_v1_181_the-springboard",
  "onr_v1_183_technician-lover",
  "onr_v1_221_asp",
  "onr_v1_228_cinderella",
  "onr_v1_240_fang",
  "onr_v1_241_fang-2-0",
  "onr_v1_248_homewrecker",
  "onr_v1_260_pocket-virtual-reality",
  "onr_v1_264_rex",
  "onr_v1_299_power-grid-overload",
] as const;

const ONR_V1_9_14_RUNNER_CARD_IDS = ONR_V1_9_14_WIP_CARD_IDS.filter(
  (cardId) => DEMO_CARDS_BY_ID[cardId]?.side === "runner",
);

const ONR_V1_9_15_WIP_CARD_IDS = [
  "onr_v1_020_dupre",
  "onr_v1_024_expert-schedule-analyzer",
  "onr_v1_041_microtech-ai-interface",
  "onr_v1_043_mystery-box",
  "onr_v1_062_shredder-uplink-protocol",
  "onr_v1_065_smarteye",
  "onr_v1_098_lucidrine-booster-drug",
  "onr_v1_105_priority-wreck",
  "onr_v1_111_social-engineering",
  "onr_v1_112_stumble-through-wilderspace",
  "onr_v1_142_record-reconstructor",
  "onr_v1_227_cerberus",
  "onr_v1_255_mastiff",
  "onr_v1_294_new-blood",
] as const;

const ONR_V1_9_16_WIP_CARD_IDS = [
  "onr_v1_003_baedekers-net-map",
  "onr_v1_004_bakdoor",
  "onr_v1_033_imp",
  "onr_v1_035_invisibility",
  "onr_v1_047_pile-driver",
  "onr_v1_050_r-and-d-protocol-files",
  "onr_v1_071_vewy-vewy-quiet",
  "onr_v1_140_raven-microcyb-eagle",
  "onr_v1_141_raven-microcyb-owl",
  "onr_v1_148_access-through-alpha",
  "onr_v1_149_access-to-arasaka",
  "onr_v1_150_access-to-kiribati",
  "onr_v1_152_back-door-to-hilliard",
  "onr_v1_153_back-door-to-orbital-air",
  "onr_v1_182_submarine-uplink",
  "onr_v1_246_fragmentation-storm",
] as const;

const ONR_V1_9_17_WIP_CARD_IDS = [
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_310_blood-cat",
  "onr_v1_311_braindance-campaign",
  "onr_v1_314_corporate-negotiating-center",
  "onr_v1_316_cowboy-sysop",
  "onr_v1_318_department-of-truth-enhancement",
  "onr_v1_319_disinfectant-inc",
  "onr_v1_321_esa-contract",
  "onr_v1_326_holovid-campaign",
  "onr_v1_329_investment-firm",
  "onr_v1_330_krumz",
  "onr_v1_333_omniscience-foundation",
  "onr_v1_336_rescheduler",
  "onr_v1_337_rockerboy-promotion",
  "onr_v1_340_setup",
  "onr_v1_342_solo-squad",
  "onr_v1_344_spinn-public-relations",
  "onr_v1_345_trap",
] as const;

const ONR_V1_9_18_WIP_CARD_IDS = [
  "onr_v1_354_crybaby",
  "onr_v1_355_crystal-palace-station-grid",
  "onr_v1_356_dedicated-response-team",
  "onr_v1_357_dieter-esslin",
  "onr_v1_358_dr-dreff",
  "onr_v1_359_jenny-jett",
  "onr_v1_361_namatoki-plaza",
  "onr_v1_362_new-galveston-city-grid",
  "onr_v1_364_omni-kismet-ph-d",
  "onr_v1_365_paris-city-grid",
  "onr_v1_366_red-herrings",
  "onr_v1_369_singapore-city-grid",
  "onr_v1_370_tesseract-fort-construction",
  "onr_v1_372_turbeau-delacroix",
  "onr_v1_373_twenty-four-hour-surveillance",
] as const;

const ONR_V1_9_19_WIP_CARD_IDS = [
  "onr_v1_025_fait-accompli",
  "onr_v1_078_arasaka-owns-you",
  "onr_v1_189_artificial-security-directors",
  "onr_v1_202_genetics-visionary-acquisition",
  "onr_v1_291_falsified-transactions-expert",
  "onr_v1_292_management-shake-up",
  "onr_v1_300_project-consultants",
  "onr_v1_303_silver-lining-recovery-protocol",
  "onr_v1_304_systematic-layoffs",
  "onr_v1_305_team-restructuring",
  "onr_v1_312_chicago-branch",
  "onr_v1_315_corprunners-shattered-remains",
  "onr_v1_323_experimental-ai",
  "onr_v1_328_information-laundering",
  "onr_v1_346_vacant-soulkiller",
  "onr_v1_347_vapor-ops",
  "onr_v1_348_virus-test-site",
  "onr_v1_363_olivia-salazar",
  "onr_v1_368_roving-submarine",
  "onr_v1_374_washington-d-c-city-grid",
] as const;

const ONR_V1_9_20_WIP_CARD_IDS = [
  "onr_v1_022_emergency-self-construct",
  "onr_v1_029_gremlins",
  "onr_v1_133_militech-mram-chip",
  "onr_v1_134_mram-chip",
  "onr_v1_160_diplomatic-immunity",
  "onr_v1_168_loan-from-chiba",
  "onr_v1_171_preying-mantis",
  "onr_v1_190_bioweapons-engineering",
  "onr_v1_191_black-ice-quality-assurance",
  "onr_v1_192_corporate-boon",
  "onr_v1_200_encryption-breakthrough",
  "onr_v1_204_ice-transmutation",
  "onr_v1_205_main-office-relocation",
  "onr_v1_218_subsidiary-branch",
  "onr_v1_313_city-surveillance",
  "onr_v1_322_euromarket-consortium",
  "onr_v1_324_fortress-architects",
  "onr_v1_325_hacker-tracker-central",
  "onr_v1_327_i-got-a-rock",
  "onr_v1_331_nevinyrral",
  "onr_v1_332_newsgroup-taunting",
  "onr_v1_334_pacifica-regional-ai",
  "onr_v1_335_remote-facility",
  "onr_v1_338_rustbelt-hq-branch",
  "onr_v1_343_south-african-mining-corp",
  "onr_v1_360_jerusalem-city-grid",
] as const;

const ONR_V1_9_21_WIP_CARD_IDS = [
  "onr_v1_002_ai-boon",
  "onr_v1_008_boardwalk",
  "onr_v1_104_playful-ai",
  "onr_v1_172_quest-for-cattekin",
  "onr_v1_339_schlaghund",
  "onr_v1_367_rio-de-janeiro-city-grid",
] as const;

const ONR_V1_9_22_WIP_CARD_IDS = [
  "onr_v1_026_false-echo",
  "onr_v1_027_flak",
  "onr_v1_031_hammer",
  "onr_v1_037_japanese-water-torture",
  "onr_v1_044_netspace-inverter",
  "onr_v1_045_newsgroup-filter",
  "onr_v1_048_poltergeist",
  "onr_v1_051_rabbit",
  "onr_v1_055_reflector",
  "onr_v1_057_scatter-shot",
  "onr_v1_061_shield",
  "onr_v1_067_speed-trap",
  "onr_v1_068_startup-immolator",
  "onr_v1_075_zetatech-software-installer",
  "onr_v1_077_anonymous-tip",
  "onr_v1_080_core-command-jettison-ice",
  "onr_v1_086_forged-activation-orders",
  "onr_v1_093_if-you-want-it-done-right",
  "onr_v1_100_misc-for-sale",
  "onr_v1_102_open-ended-mileage-program",
  "onr_v1_103_organ-donor",
  "onr_v1_109_security-code-worm-chip",
  "onr_v1_113_synchronized-attack-on-hq",
  "onr_v1_117_valu-pak-software-bundle",
  "onr_v1_119_arasaka-portable-prototype",
  "onr_v1_122_artemis-2020",
  "onr_v1_123_bodyweight-data-creche",
  "onr_v1_124_corolla-speed-chip",
  "onr_v1_131_microtech-backup-drive",
  "onr_v1_136_pandoras-deck",
  "onr_v1_137_parraline-5750",
  "onr_v1_138_pk-6089a",
  "onr_v1_147_zz22-speed-chip",
  "onr_v1_195_corporate-retreat",
  "onr_v1_196_corporate-war",
  "onr_v1_197_data-fort-reclamation",
  "onr_v1_206_marine-arcology",
  "onr_v1_210_political-overthrow",
  "onr_v1_216_security-purge",
  "onr_v1_247_haunting-inquisition",
  "onr_v1_274_tutor",
  "onr_v1_276_viral-15",
  "onr_v1_277_virizz",
  "onr_v1_280_zombie",
  "onr_v1_289_edgerunner-inc-temps",
  "onr_v1_296_off-site-backups",
  "onr_v1_298_planning-consultants",
] as const;

const ONR_V1_0_5K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v105k_smoke_094",
  name: "O:NR V1.0.5K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_015_codeslinger", quantity: 2 },
    { id: "onr_v1_052_raffles", quantity: 2 },
    { id: "onr_v1_054_raptor", quantity: 2 },
    { id: "onr_v1_070_tinweasel", quantity: 2 },
    { id: "onr_v1_144_tycho-mem-chip", quantity: 1 },
    { id: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
    { id: "simple_economy_event", quantity: 2 },
  ],
};

const ONR_V1_0_5K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v105k_smoke_094",
  name: "O:NR V1.0.5K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_230_cortical-scanner", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "onr_v1_239_endless-corridor", quantity: 2 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

const ONR_V1_0_6K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v106k_smoke_094",
  name: "O:NR V1.0.6K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_079_bodyweight-synthetic-blood", quantity: 2 },
    { id: "onr_v1_095_jack-n-joe", quantity: 2 },
    { id: "onr_v1_097_livewires-contacts", quantity: 2 },
    { id: "onr_v1_108_score", quantity: 2 },
    { id: "onr_v1_072_wild-card", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "onr_v1_015_codeslinger", quantity: 1 },
    { id: "onr_v1_070_tinweasel", quantity: 1 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_0_6K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v106k_smoke_094",
  name: "O:NR V1.0.6K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_281_accounts-receivable", quantity: 1 },
    { id: "onr_v1_282_annual-reviews", quantity: 1 },
    { id: "onr_v1_285_closed-accounts", quantity: 1 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
    { id: "onr_v1_288_day-shift", quantity: 1 },
    { id: "onr_v1_290_efficiency-experts", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
    { id: "onr_v1_307_urban-renewal", quantity: 1 },
    { id: "onr_v1_244_filter", quantity: 1 },
    { id: "onr_v1_245_fire-wall", quantity: 1 },
    { id: "onr_v1_252_keeper", quantity: 1 },
    { id: "onr_v1_256_mazer", quantity: 1 },
    { id: "onr_v1_230_cortical-scanner", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "simple_sentry_ice", quantity: 1 },
    { id: "simple_economy_operation", quantity: 1 },
  ],
};

const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v112k_smoke_094",
  name: "O:NR V1.1.2K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v112k_smoke_094",
  name: "O:NR V1.1.2K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v123_smoke_094",
  name: "O:NR V1.2.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_039_krash", quantity: 2 },
    { id: "onr_v1_066_snowball", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "onr_v1_081_custodial-position", quantity: 1 },
    { id: "onr_v1_085_executive-wiretaps", quantity: 1 },
    { id: "onr_v1_101_mit-west-tier", quantity: 2 },
  ],
};

const ONR_V1_2_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v123_smoke_094",
  name: "O:NR V1.2.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_243_fetch-4-0-1", quantity: 2 },
    { id: "onr_v1_249_hunter", quantity: 2 },
    { id: "onr_v1_297_overtime-incentives", quantity: 3 },
    { id: "onr_v1_306_trojan-horse", quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_261_quandary", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_259_in-the-face", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_6_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v161_smoke_094",
  name: "O:NR V1.6.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "onr_v1_125_dermatech-bodyplating", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_6_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v161_smoke_094",
  name: "O:NR V1.6.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_229_code-corpse", quantity: 1 },
    { id: "onr_v1_231_cortical-scrub", quantity: 1 },
    { id: "onr_v1_254_liche", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "onr_v1_302_scorched-earth", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_6_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v162_smoke_094",
  name: "O:NR V1.6.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "onr_v1_125_dermatech-bodyplating", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_6_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v162_smoke_094",
  name: "O:NR V1.6.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_212_priority-requisition", quantity: 1 },
    { id: "onr_v1_215_security-net-optimization", quantity: 1 },
    { id: "onr_v1_317_data-masons", quantity: 2 },
    { id: "onr_v1_320_encoder-inc", quantity: 2 },
    { id: "onr_v1_341_skalderviken-sa-beta-test-site", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_230_cortical-scanner", quantity: 2 },
    { id: "onr_v1_231_cortical-scrub", quantity: 2 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

const ONR_V1_6_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v163_smoke_094",
  name: "O:NR V1.6.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_6_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v163_smoke_094",
  name: "O:NR V1.6.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 1 },
    { id: "onr_v1_267_sentinels-prime", quantity: 1 },
    { id: "onr_v1_273_triggerman", quantity: 1 },
    { id: "onr_v1_350_antiquated-interface-routines", quantity: 2 },
    { id: "onr_v1_371_tokyo-chiba-infighting", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_7_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v170_smoke_094",
  name: "O:NR V1.7.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_011_cloak", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "onr_v1_069_succubus", quantity: 2 },
    { id: "onr_v1_163_floating-runner-bbs", quantity: 2 },
    { id: "onr_v1_180_smiths-pawnshop", quantity: 1 },
    { id: "onr_v1_021_dwarf", quantity: 1 },
    { id: "onr_v1_028_force-shield", quantity: 1 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 3 },
  ],
};

const ONR_V1_7_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v170_smoke_094",
  name: "O:NR V1.7.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_7_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v171_smoke_094",
  name: "O:NR V1.7.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_114_temple-microcode-outlet", quantity: 2 },
    { id: "onr_v1_106_private-ldl-access", quantity: 2 },
    { id: "onr_v1_118_weather-to-finance-pipe", quantity: 2 },
    { id: "onr_v1_084_edited-shipping-manifests", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_7_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v171_smoke_094",
  name: "O:NR V1.7.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

const ONR_V1_7_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v172_smoke_094",
  name: "O:NR V1.7.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_158_danshis-second-id", quantity: 2 },
    { id: "onr_v1_179_silicon-saloon-franchise", quantity: 2 },
    { id: "onr_v1_163_floating-runner-bbs", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_7_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v172_smoke_094",
  name: "O:NR V1.7.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_283_audit-of-call-records", quantity: 2 },
    { id: "onr_v1_284_chance-observation", quantity: 2 },
    { id: "onr_v1_286_corporate-detective-agency", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

const ONR_V1_8_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v180_smoke_094",
  name: "O:NR V1.8.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_083_desperate-competitor", quantity: 2 },
    { id: "onr_v1_090_hot-tip-for-wns", quantity: 2 },
    { id: "onr_v1_156_corporate-ally", quantity: 1 },
    { id: "onr_v1_159_databroker", quantity: 1 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_8_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v180_smoke_094",
  name: "O:NR V1.8.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_201_executive-extraction", quantity: 2 },
    { id: "onr_v1_214_project-babylon", quantity: 2 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_8_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v181_smoke_094",
  name: "O:NR V1.8.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_012_clown", quantity: 2 },
    { id: "onr_v1_046_pattels-virus", quantity: 2 },
    { id: "onr_v1_049_pox", quantity: 2 },
    { id: "onr_v1_094_inside-job", quantity: 2 },
    { id: "onr_v1_173_restrictive-net-zoning", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_8_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v181_smoke_094",
  name: "O:NR V1.8.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_193_corporate-coup", quantity: 2 },
    { id: "onr_v1_209_political-coup", quantity: 2 },
    { id: "onr_v1_222_ball-and-chain", quantity: 2 },
    { id: "onr_v1_225_canis-major", quantity: 2 },
    { id: "onr_v1_226_canis-minor", quantity: 2 },
    { id: "onr_v1_242_fatal-attractor", quantity: 2 },
    { id: "onr_v1_268_shock-r", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v190_smoke_094",
  name: "O:NR V1.9.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_005_bartmoss-memorial-icebreaker", quantity: 2 },
    { id: "onr_v1_007_blink", quantity: 2 },
    { id: "onr_v1_115_terrorist-reprisal", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_9_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v190_smoke_094",
  name: "O:NR V1.9.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_193_corporate-coup", quantity: 2 },
    { id: "onr_v1_209_political-coup", quantity: 2 },
    { id: "onr_v1_223_banpei", quantity: 2 },
    { id: "onr_v1_275_vacuum-link", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v191_smoke_094",
  name: "O:NR V1.9.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_013_cockroach", quantity: 2 },
    { id: "onr_v1_034_incubator", quantity: 2 },
    { id: "onr_v1_030_grubb", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v191_smoke_094",
  name: "O:NR V1.9.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 3 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v192_smoke_094",
  name: "O:NR V1.9.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_076_all-nighter", quantity: 2 },
    { id: "onr_v1_096_kilroy-was-here", quantity: 2 },
    { id: "onr_v1_107_romp-through-hq", quantity: 2 },
    { id: "onr_v1_184_top-runners-conference", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

const ONR_V1_9_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v192_smoke_094",
  name: "O:NR V1.9.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_188_ai-chief-financial-officer", quantity: 2 },
    { id: "onr_v1_211_polymer-breakthrough", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_235_data-naga", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v193_smoke_094",
  name: "O:NR V1.9.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v193_smoke_094",
  name: "O:NR V1.9.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_207_netwatch-operations-office", quantity: 2 },
    { id: "onr_v1_213_private-cybernet-police", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_251_jack-attack", quantity: 2 },
    { id: "onr_v1_271_tko-2-0", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_4_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v194_smoke_094",
  name: "O:NR V1.9.4 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_4_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v194_smoke_094",
  name: "O:NR V1.9.4 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_208_on-call-solo-team", quantity: 2 },
    { id: "onr_v1_217_strike-force-kali", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "onr_v1_302_scorched-earth", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_5_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v195_smoke_094",
  name: "O:NR V1.9.5 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_5_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v195_smoke_094",
  name: "O:NR V1.9.5 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_219_superior-net-barriers", quantity: 2 },
    { id: "onr_v1_308_acme-savings-and-loan", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_6_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v196_smoke_094",
  name: "O:NR V1.9.6 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_6_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v196_smoke_094",
  name: "O:NR V1.9.6 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_236_data-raven", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_7_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v197_smoke_094",
  name: "O:NR V1.9.7 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_001_afreet", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_7_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v197_smoke_094",
  name: "O:NR V1.9.7 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_8_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v198_smoke_094",
  name: "O:NR V1.9.8 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_018_dogcatcher", quantity: 2 },
    { id: "onr_v1_019_dropp", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_8_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v198_smoke_094",
  name: "O:NR V1.9.8 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_9_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v199_smoke_094",
  name: "O:NR V1.9.9 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_001_afreet", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_9_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v199_smoke_094",
  name: "O:NR V1.9.9 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_349_aardvark", quantity: 2 },
    { id: "onr_v1_351_bizarre-encryption-scheme", quantity: 2 },
    { id: "onr_v1_352_chester-mix", quantity: 2 },
    { id: "onr_v1_353_chimera", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

const ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_042_mouse", quantity: 1 },
    { id: "onr_v1_058_seeya", quantity: 1 },
    { id: "onr_v1_059_self-modifying-code", quantity: 1 },
    { id: "onr_v1_087_forgotten-backup-chip", quantity: 1 },
    { id: "onr_v1_088_fortress-respecification", quantity: 1 },
    { id: "onr_v1_089_gideons-pawnshop", quantity: 1 },
    { id: "onr_v1_092_ice-and-datas-guide-to-the-net", quantity: 1 },
    { id: "onr_v1_099_mantis-fixer-at-large", quantity: 1 },
    { id: "onr_v1_110_sneak-preview", quantity: 1 },
    { id: "onr_v1_151_aujourdoui", quantity: 1 },
    { id: "onr_v1_169_n-e-t-o", quantity: 1 },
    { id: "onr_v1_175_ronin-around", quantity: 1 },
    { id: "onr_v1_177_the-short-circuit", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_194_corporate-downsizing", quantity: 1 },
    { id: "onr_v1_250_ice-pick-willie", quantity: 1 },
    { id: "onr_v1_272_too-many-doors", quantity: 1 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_upgrade", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_009_butcher-boy", quantity: 1 },
    { id: "onr_v1_010_cascade", quantity: 1 },
    { id: "onr_v1_017_deep-thought", quantity: 1 },
    { id: "onr_v1_032_i-spy", quantity: 1 },
    { id: "onr_v1_064_skivviss", quantity: 1 },
    { id: "onr_v1_082_deal-with-militech", quantity: 1 },
    { id: "onr_v1_091_hunt-club-bbs", quantity: 1 },
    { id: "onr_v1_174_rigged-investments", quantity: 1 },
    { id: "onr_v1_176_the-shell-traders", quantity: 1 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_198_detroit-police-contract", quantity: 2 },
    { id: "onr_v1_199_employee-empowerment", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_038_joan-of-arc", quantity: 1 },
    { id: "onr_v1_121_armored-fridge", quantity: 1 },
    { id: "onr_v1_127_full-body-conversion", quantity: 1 },
    { id: "onr_v1_128_green-knight-surge-buffers", quantity: 1 },
    { id: "onr_v1_130_lifesaver-nanosurgeons", quantity: 1 },
    { id: "onr_v1_135_nasuko-cycle", quantity: 1 },
    { id: "onr_v1_139_r-and-d-interface", quantity: 1 },
    { id: "onr_v1_143_techtronica-utility-suit", quantity: 1 },
    { id: "onr_v1_155_code-viral-cache", quantity: 1 },
    { id: "onr_v1_161_fall-guy", quantity: 1 },
    { id: "onr_v1_170_nomad-allies", quantity: 1 },
    { id: "onr_v1_185_trauma-team", quantity: 1 },
    { id: "onr_v1_186_umbrella-policy", quantity: 1 },
    { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_224_bolter-cluster", quantity: 2 },
    { id: "onr_v1_234_data-darts", quantity: 2 },
    { id: "onr_v1_258_neural-blade", quantity: 2 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 6 },
  ],
};

const ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_053_ramming-piston", quantity: 1 },
    { id: "onr_v1_056_replicator", quantity: 1 },
    { id: "onr_v1_063_signpost", quantity: 1 },
    { id: "onr_v1_116_total-genetic-retrofit", quantity: 1 },
    { id: "onr_v1_120_armadillo-armored-road-home", quantity: 1 },
    { id: "onr_v1_126_drifter-mobile-environment", quantity: 1 },
    { id: "onr_v1_132_microtech-trode-set", quantity: 1 },
    { id: "onr_v1_154_broker", quantity: 1 },
    { id: "onr_v1_157_crash-everett-inventive-fixer", quantity: 1 },
    { id: "onr_v1_162_field-reporter-for-ice-and-data", quantity: 1 },
    { id: "onr_v1_164_hells-run", quantity: 1 },
    { id: "onr_v1_165_junkyard-bbs", quantity: 1 },
    { id: "onr_v1_166_karl-de-veres-corporate-stooge", quantity: 1 },
    { id: "onr_v1_167_leland-corporate-bodyguard", quantity: 1 },
    { id: "onr_v1_178_short-term-contract", quantity: 1 },
    { id: "onr_v1_181_the-springboard", quantity: 1 },
    { id: "onr_v1_183_technician-lover", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_221_asp", quantity: 2 },
    { id: "onr_v1_228_cinderella", quantity: 2 },
    { id: "onr_v1_240_fang", quantity: 2 },
    { id: "onr_v1_241_fang-2-0", quantity: 2 },
    { id: "onr_v1_248_homewrecker", quantity: 2 },
    { id: "onr_v1_260_pocket-virtual-reality", quantity: 2 },
    { id: "onr_v1_264_rex", quantity: 2 },
    { id: "onr_v1_299_power-grid-overload", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_020_dupre", quantity: 1 },
    { id: "onr_v1_024_expert-schedule-analyzer", quantity: 1 },
    { id: "onr_v1_041_microtech-ai-interface", quantity: 1 },
    { id: "onr_v1_043_mystery-box", quantity: 1 },
    { id: "onr_v1_062_shredder-uplink-protocol", quantity: 1 },
    { id: "onr_v1_065_smarteye", quantity: 1 },
    { id: "onr_v1_098_lucidrine-booster-drug", quantity: 1 },
    { id: "onr_v1_105_priority-wreck", quantity: 2 },
    { id: "onr_v1_111_social-engineering", quantity: 1 },
    { id: "onr_v1_112_stumble-through-wilderspace", quantity: 1 },
    { id: "onr_v1_142_record-reconstructor", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_15_RUN_ACCESS_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_227_cerberus", quantity: 2 },
    { id: "onr_v1_255_mastiff", quantity: 2 },
    { id: "onr_v1_294_new-blood", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

const ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_003_baedekers-net-map", quantity: 1 },
    { id: "onr_v1_004_bakdoor", quantity: 1 },
    { id: "onr_v1_033_imp", quantity: 1 },
    { id: "onr_v1_035_invisibility", quantity: 1 },
    { id: "onr_v1_047_pile-driver", quantity: 1 },
    { id: "onr_v1_050_r-and-d-protocol-files", quantity: 1 },
    { id: "onr_v1_071_vewy-vewy-quiet", quantity: 1 },
    { id: "onr_v1_140_raven-microcyb-eagle", quantity: 1 },
    { id: "onr_v1_141_raven-microcyb-owl", quantity: 1 },
    { id: "onr_v1_148_access-through-alpha", quantity: 1 },
    { id: "onr_v1_149_access-to-arasaka", quantity: 1 },
    { id: "onr_v1_150_access-to-kiribati", quantity: 1 },
    { id: "onr_v1_152_back-door-to-hilliard", quantity: 1 },
    { id: "onr_v1_153_back-door-to-orbital-air", quantity: 1 },
    { id: "onr_v1_182_submarine-uplink", quantity: 1 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_246_fragmentation-storm", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

const ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "onr_v1_035_invisibility", quantity: 1 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_17_GENERIC_ASSET_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
    { id: "onr_v1_310_blood-cat", quantity: 1 },
    { id: "onr_v1_311_braindance-campaign", quantity: 1 },
    { id: "onr_v1_314_corporate-negotiating-center", quantity: 1 },
    { id: "onr_v1_316_cowboy-sysop", quantity: 1 },
    { id: "onr_v1_318_department-of-truth-enhancement", quantity: 1 },
    { id: "onr_v1_319_disinfectant-inc", quantity: 1 },
    { id: "onr_v1_321_esa-contract", quantity: 1 },
    { id: "onr_v1_326_holovid-campaign", quantity: 1 },
    { id: "onr_v1_329_investment-firm", quantity: 1 },
    { id: "onr_v1_330_krumz", quantity: 1 },
    { id: "onr_v1_333_omniscience-foundation", quantity: 1 },
    { id: "onr_v1_336_rescheduler", quantity: 1 },
    { id: "onr_v1_337_rockerboy-promotion", quantity: 1 },
    { id: "onr_v1_340_setup", quantity: 1 },
    { id: "onr_v1_342_solo-squad", quantity: 1 },
    { id: "onr_v1_344_spinn-public-relations", quantity: 1 },
    { id: "onr_v1_345_trap", quantity: 1 },
    { id: "onr_v1_354_crybaby", quantity: 1 },
    { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
    { id: "onr_v1_356_dedicated-response-team", quantity: 1 },
    { id: "onr_v1_357_dieter-esslin", quantity: 1 },
    { id: "onr_v1_358_dr-dreff", quantity: 1 },
    { id: "onr_v1_359_jenny-jett", quantity: 1 },
    { id: "onr_v1_361_namatoki-plaza", quantity: 1 },
    { id: "onr_v1_362_new-galveston-city-grid", quantity: 1 },
    { id: "onr_v1_364_omni-kismet-ph-d", quantity: 1 },
    { id: "onr_v1_365_paris-city-grid", quantity: 1 },
    { id: "onr_v1_366_red-herrings", quantity: 1 },
    { id: "onr_v1_369_singapore-city-grid", quantity: 1 },
    { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
    { id: "onr_v1_372_turbeau-delacroix", quantity: 1 },
    { id: "onr_v1_373_twenty-four-hour-surveillance", quantity: 1 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_025_fait-accompli", quantity: 1 },
    { id: "onr_v1_078_arasaka-owns-you", quantity: 1 },
    { id: "simple_setup_hardware", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_189_artificial-security-directors", quantity: 1 },
    { id: "onr_v1_202_genetics-visionary-acquisition", quantity: 1 },
    { id: "onr_v1_291_falsified-transactions-expert", quantity: 1 },
    { id: "onr_v1_292_management-shake-up", quantity: 1 },
    { id: "onr_v1_300_project-consultants", quantity: 1 },
    { id: "onr_v1_303_silver-lining-recovery-protocol", quantity: 1 },
    { id: "onr_v1_304_systematic-layoffs", quantity: 1 },
    { id: "onr_v1_305_team-restructuring", quantity: 1 },
    { id: "onr_v1_312_chicago-branch", quantity: 1 },
    { id: "onr_v1_315_corprunners-shattered-remains", quantity: 1 },
    { id: "onr_v1_323_experimental-ai", quantity: 1 },
    { id: "onr_v1_328_information-laundering", quantity: 1 },
    { id: "onr_v1_346_vacant-soulkiller", quantity: 1 },
    { id: "onr_v1_347_vapor-ops", quantity: 1 },
    { id: "onr_v1_348_virus-test-site", quantity: 1 },
    { id: "onr_v1_363_olivia-salazar", quantity: 1 },
    { id: "onr_v1_368_roving-submarine", quantity: 1 },
    { id: "onr_v1_374_washington-d-c-city-grid", quantity: 1 },
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_022_emergency-self-construct", quantity: 1 },
    { id: "onr_v1_029_gremlins", quantity: 1 },
    { id: "onr_v1_133_militech-mram-chip", quantity: 1 },
    { id: "onr_v1_134_mram-chip", quantity: 1 },
    { id: "onr_v1_160_diplomatic-immunity", quantity: 1 },
    { id: "onr_v1_168_loan-from-chiba", quantity: 1 },
    { id: "onr_v1_171_preying-mantis", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_190_bioweapons-engineering", quantity: 1 },
    { id: "onr_v1_191_black-ice-quality-assurance", quantity: 1 },
    { id: "onr_v1_192_corporate-boon", quantity: 1 },
    { id: "onr_v1_200_encryption-breakthrough", quantity: 1 },
    { id: "onr_v1_204_ice-transmutation", quantity: 1 },
    { id: "onr_v1_205_main-office-relocation", quantity: 1 },
    { id: "onr_v1_218_subsidiary-branch", quantity: 1 },
    { id: "onr_v1_313_city-surveillance", quantity: 1 },
    { id: "onr_v1_322_euromarket-consortium", quantity: 1 },
    { id: "onr_v1_324_fortress-architects", quantity: 1 },
    { id: "onr_v1_325_hacker-tracker-central", quantity: 1 },
    { id: "onr_v1_327_i-got-a-rock", quantity: 1 },
    { id: "onr_v1_331_nevinyrral", quantity: 1 },
    { id: "onr_v1_332_newsgroup-taunting", quantity: 1 },
    { id: "onr_v1_334_pacifica-regional-ai", quantity: 1 },
    { id: "onr_v1_335_remote-facility", quantity: 1 },
    { id: "onr_v1_338_rustbelt-hq-branch", quantity: 1 },
    { id: "onr_v1_343_south-african-mining-corp", quantity: 1 },
    { id: "onr_v1_360_jerusalem-city-grid", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

const ONR_V1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_test_harness_094",
  name: "O:NR v1 Limited Runner Test Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_079_bodyweight-synthetic-blood", quantity: 2 },
    { id: "onr_v1_095_jack-n-joe", quantity: 2 },
    { id: "onr_v1_097_livewires-contacts", quantity: 2 },
    { id: "onr_v1_108_score", quantity: 2 },
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_072_wild-card", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
  ],
};

const ONR_V1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_test_harness_094",
  name: "O:NR v1 Limited Corp Test Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_281_accounts-receivable", quantity: 1 },
    { id: "onr_v1_282_annual-reviews", quantity: 1 },
    { id: "onr_v1_285_closed-accounts", quantity: 1 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
    { id: "onr_v1_288_day-shift", quantity: 1 },
    { id: "onr_v1_290_efficiency-experts", quantity: 1 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
    { id: "onr_v1_307_urban-renewal", quantity: 1 },
    { id: "onr_v1_230_cortical-scanner", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 1 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 1 },
    { id: "onr_v1_239_endless-corridor", quantity: 1 },
    { id: "onr_v1_244_filter", quantity: 1 },
    { id: "onr_v1_245_fire-wall", quantity: 1 },
    { id: "onr_v1_252_keeper", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_256_mazer", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
  ],
};

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
  ],
};

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - Core Damage Harness",
  cards: [
    ...V094_CORP_DECK.cards,
    { id: "v111_core_damage_operation", quantity: 2 },
  ],
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 },
  ],
};

const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
  ],
};

function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function onrV1Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_RUNNER_DECK,
    corpDeck: ONR_V1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v105kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
    corpDeck: ONR_V1_0_5K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v106kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
    corpDeck: ONR_V1_0_6K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v112kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
    corpDeck: ONR_V1_1_2K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v123CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_2_3_RUNNER_DECK,
    corpDeck: ONR_V1_2_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v161CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_1_RUNNER_DECK,
    corpDeck: ONR_V1_6_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v162CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_2_RUNNER_DECK,
    corpDeck: ONR_V1_6_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v163CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_3_RUNNER_DECK,
    corpDeck: ONR_V1_6_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v170CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_0_RUNNER_DECK,
    corpDeck: ONR_V1_7_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v171CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_1_RUNNER_DECK,
    corpDeck: ONR_V1_7_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v172CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_2_RUNNER_DECK,
    corpDeck: ONR_V1_7_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v180CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_8_0_RUNNER_DECK,
    corpDeck: ONR_V1_8_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v181CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_8_1_RUNNER_DECK,
    corpDeck: ONR_V1_8_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v190CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_0_RUNNER_DECK,
    corpDeck: ONR_V1_9_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v191CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_1_RUNNER_DECK,
    corpDeck: ONR_V1_9_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v192CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_2_RUNNER_DECK,
    corpDeck: ONR_V1_9_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v193CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_3_RUNNER_DECK,
    corpDeck: ONR_V1_9_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v194CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_4_RUNNER_DECK,
    corpDeck: ONR_V1_9_4_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v195CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_5_RUNNER_DECK,
    corpDeck: ONR_V1_9_5_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v196CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_6_RUNNER_DECK,
    corpDeck: ONR_V1_9_6_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v197CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_7_RUNNER_DECK,
    corpDeck: ONR_V1_9_7_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v198CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_8_RUNNER_DECK,
    corpDeck: ONR_V1_9_8_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v199CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_9_RUNNER_DECK,
    corpDeck: ONR_V1_9_9_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1911HiddenZoneGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1912CounterRecurringGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1913DamagePreventionGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1914TraceTagResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1915RunAccessGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK,
    corpDeck: ONR_V1_9_15_RUN_ACCESS_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1916ProgramSubtypeGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK,
    corpDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1917GenericAssetGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK,
    corpDeck: ONR_V1_9_17_GENERIC_ASSET_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v1919AgendaOveradvanceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v095ResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v096TraceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_096",
    corpDeckId: "demo_corp_096",
    agendaPointsToWin: 7,
  });
}

function v097RunGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_097",
    corpDeckId: "demo_corp_097",
    agendaPointsToWin: 7,
  });
}

function v098IdentityGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_098",
    corpDeckId: "demo_corp_098",
    agendaPointsToWin: 7,
  });
}

function v099CounterHostingGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_099",
    corpDeckId: "demo_corp_099",
    agendaPointsToWin: 7,
  });
}

function installedResourceCorpTurn(seed: string): GameState {
  let state = toRunnerTurn(v095ResourceGame(seed));
  state.runner.credits = 6;
  moveRunnerCardToGrip(state, "v095_safehouse_resource");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "v095_safehouse_resource",
  );
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.runner.tags = 1;
  return state;
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionId: string,
): GameState {
  return applyChoices(state, side, [selectedOptionId]);
}

function applyChoices(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = mustAction(
    state,
    side,
    (action) => action.type === "resolve_choice",
  );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function mustAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  expect(
    selected,
    `Missing action for ${side}. Legal: ${legalActions.map((action) => `${action.type}:${action.label}`).join(", ")}`,
  ).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

function toRunnerTurnFromCorpMain(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

function sourceDefinition(
  state: GameState,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  return ids.reduce(
    (sum, id) =>
      sum +
      (DEMO_CARDS_BY_ID[state.cardInstances[id]?.definitionId ?? ""]
        ?.agendaPoints ?? 0),
    0,
  );
}

function cardCounterAmount(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return state.cardInstances[cardId]?.counters?.[counterType] ?? 0;
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "v093_test_choice",
    prompt: "private prompt",
    kind: "select_option",
    options: [
      { id: "keep", label: "Keep private option" },
      { id: "ship", label: "Ship private option" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side",
  };
}

function moveRunnerCardToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function scoreRunnerAgendaForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.scoreArea.includes(id) &&
      !state.corp.scoreArea.includes(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing unscored ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerCardCopyToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id) &&
      !state.runner.rig.hardware.includes(id) &&
      !state.runner.rig.resources.includes(id) &&
      !state.runner.scoreArea.includes(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function putRunnerCardOnTopOfStack(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function drawRunnerCardsForTest(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) {
    const id = state.runner.stack.shift();
    expect(id).toBeDefined();
    if (!id) throw new Error("Missing runner stack card");
    state.runner.grip.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
    };
  }
}

function moveCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveCorpCardCopyToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId && !state.corp.hq.includes(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing HQ copy ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveCorpCardToArchives(
  state: GameState,
  definitionId: string,
  faceup = true,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  const movedToRd = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.hq = [id];
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function keepOnlyCorpHqCards(state: GameState, ids: CardInstanceId[]): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.hq.filter((cardId) => !keep.has(cardId));
  state.corp.hq = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function keepOnlyCorpArchivesCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function putCorpCardOnTopOfRd(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpRootInRemote(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function installRunnerProgramForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function installRunnerHardwareForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.hardware.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function installRunnerResourceForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.resources.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function installRunnerProgramCopyForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
}

function scoreTwoAgendasForTest(state: GameState): void {
  for (let index = 0; index < 2; index += 1) {
    const entry = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        card.definitionId === "simple_agenda" &&
        !state.corp.scoreArea.includes(id),
    );
    expect(entry).toBeDefined();
    if (!entry) throw new Error("Missing agenda");
    const id = entry[0];
    removeEverywhere(state, id);
    state.corp.scoreArea.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
  }
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entries = Object.entries(state.cardInstances).filter(
    ([, card]) => card.definitionId === definitionId,
  );
  const entry =
    entries.find(
      ([id]) =>
        !state.corp.scoreArea.includes(id) &&
        !state.runner.scoreArea.includes(id),
    ) ?? entries[0];
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (cardId) => cardId !== id,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
