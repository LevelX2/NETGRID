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
  validateGameState
} from "./index";
import { MVP_0_99_BASELINE, type CardInstanceId, type ChoiceRequest, type DeckDefinition, type GameState, type LegalAction, type Side } from "@netgrid/shared";

describe("MVP 0.1 engine foundation", () => {
  it("creates deterministic games for the same seed", () => {
    const first = createGameAfterSetup({ seed: "deterministic" });
    const second = createGameAfterSetup({ seed: "deterministic" });

    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);
  });

  it("starts in explicit setup with side-safe private mulligan choices", () => {
    const state = createGame({ seed: "v110-explicit-setup" });

    expect(state.phase).toBe("setup");
    expect(state.timingPoint).toBe("setup.mulligan.runner");
    expect(state.setup).toMatchObject({ status: "mulligan_runner", initialHandSize: 5 });
    expect(state.agendaPointsToWin).toBe(7);
    expect(getLegalActions(state, "runner")).toHaveLength(1);
    expect(getLegalActions(state, "runner")[0]?.type).toBe("resolve_choice");
    expect(getLegalActions(state, "corp")).toHaveLength(0);
    expect(getPlayerView(state, "runner").pendingChoice?.options.map((option) => option.id)).toEqual(["keep", "mulligan"]);
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
    expect(getPlayerView(state, "corp").pendingChoice?.options.map((option) => option.id)).toEqual(["keep", "mulligan"]);

    state = applyChoice(state, "corp", "keep");
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.setup).toMatchObject({ status: "complete", resolved: { runner: "keep", corp: "keep" } });
    expect(getLegalActions(state, "corp").some((action) => action.type === "mandatory_draw")).toBe(true);
  });

  it("mulligans deterministically without public hidden-info leaks", () => {
    let state = createGame({ seed: "v110-runner-mulligan" });
    const initialGrip = state.runner.grip.slice();
    state = applyChoice(state, "runner", "mulligan");

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.grip).not.toEqual(initialGrip);
    expect(state.setup?.resolved.runner).toBe("mulligan");
    expect(state.setup?.mulligansTaken.runner).toBe(1);
    expect(state.randomDrawRecords.some((record) => record.purpose === "setup.shuffle.runner.mulligan")).toBe(true);
    expect(state.randomDrawRecords.some((record) => record.purpose === "setup.draw.runner.mulligan_hand")).toBe(true);
    expect(JSON.stringify(state.eventLog.map((event) => event.publicPayload))).not.toContain("runner_simple_");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");

    const replay = replayEvents(createGame({ seed: "v110-runner-mulligan" }), state.eventLog);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rejects stale and wrong-side player actions", () => {
    let state = createGameAfterSetup({ seed: "validation" });
    const mandatory = mustAction(state, "corp", (action) => action.type === "mandatory_draw");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion - 1
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion
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
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "simple_economy_event");
    expect(state.runner.credits).toBe(beforeCredits + 4);

    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_fracter");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "install_card", cardDefinitionId: "simple_fracter", title: "Simple Fracter" });
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_decoder");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_killer");

    expect(state.runner.memoryUsed).toBe(3);
    expect(state.runner.rig.programs.map((id) => state.cardInstances[id]?.definitionId).sort()).toEqual([
      "simple_decoder",
      "simple_fracter",
      "simple_killer"
    ]);
  });

  it("plays Corp economy operation", () => {
    let state = createGameAfterSetup({ seed: "corp-operation" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_economy_operation");
    const before = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "simple_economy_operation");
    expect(state.corp.credits).toBe(before + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      actionCostClicks: 1,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 1,
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    const archivedOperation = state.corp.archives.find((id) => state.cardInstances[id]?.definitionId === "simple_economy_operation");
    expect(archivedOperation).toBeDefined();
    expect(state.cardInstances[archivedOperation!]).toMatchObject({ faceup: true, rezzed: true });
  });

  it("lets the Corp create a new remote by installing ICE", () => {
    let state = createGameAfterSetup({ seed: "corp-ice-new-remote" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");

    const install = mustAction(
      state,
      "corp",
      (action) => action.type === "install_card" && action.source === iceId && action.payload?.serverId === "new_remote" && action.payload?.placement === "ice"
    );
    expect(install.label).toBe("ICE vor neuem Remote installieren");

    state = apply(state, "corp", (action) => action.actionId === install.actionId);
    const remote = state.corp.servers.find((server) => server.kind === "remote" && server.ice.includes(iceId));

    expect(remote).toBeDefined();
    expect(remote?.root).toEqual([]);
    expect(state.cardInstances[iceId]?.zone).toMatchObject({ side: "corp", zone: "serverIce", serverId: remote?.id });
  });
});

describe("MVP 0.1 runs, access and scoring", () => {
  it("lets the Runner steal the top R&D agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "steal-rd" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_agenda", title: "Simple Agenda", serverLabel: "R&D" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload)).toContain("Simple Agenda");
    expect(JSON.stringify(getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload)).not.toContain("Simple Agenda");
    expect(getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", serverLabel: "R&D", redactedKind: "accessed_card" });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
    expect(getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload.actionType).toBe("steal_agenda");
  });

  it("reveals the randomly accessed HQ card in the access event", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "access-hq" }));
    const accessedId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "hq");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation", title: "Simple Economy Operation", serverLabel: "HQ" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "HQ"
    });
    expect(getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload.redactedKind).toBeUndefined();
  });

  it("shows a card trashed from HQ in Runner-visible Archives", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "trash-hq-asset" }));
    state.runner.credits = 10;
    const accessedId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "hq");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "trash_accessed_card");

    const runnerView = getPlayerView(state, "runner");
    const archives = runnerView.servers.find((server) => server.id === "archives");
    expect(state.corp.archives).toContain(accessedId);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(archives?.root.map((card) => card.definitionId)).toContain("simple_economy_asset");
    expect(archives?.root.find((card) => card.definitionId === "simple_economy_asset")?.title).toBe("Simple Economy Asset");
  });

  it("does not offer a card access when a successful remote run finds an empty root", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "empty-remote-access" }));
    state.corp.servers.push({ id: "remote_1", kind: "remote", label: "Remote 1", ice: [], root: [] });
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const randomDrawsBefore = state.randomDrawRecords.length;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    state = apply(state, "corp", (action) => action.type === "decline_rez");

    const accessActions = getLegalActions(state, "runner");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(accessActions.some((action) => action.type === "access_card")).toBe(false);
    expect(accessActions.find((action) => action.type === "continue_run")?.label).toBe("Zugriff abschließen");
    expect(state.randomDrawRecords).toHaveLength(randomDrawsBefore);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "continue_run", result: "ended" });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("cardDefinitionId");
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("title");
  });

  it("still offers card access for a remote with a root card", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "non-empty-remote-access" }));
    putCorpRootInRemote(state, "simple_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");

    expect(getLegalActions(state, "runner").some((action) => action.type === "access_card")).toBe(true);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_agenda", title: "Simple Agenda", serverLabel: "Remote 1" });
  });


  it("lets the Runner break Barrier ICE and access R&D", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "break-barrier", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "efficient_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "pump_breaker", cardDefinitionId: "efficient_fracter", title: "Efficient Fracter" });
    state = apply(state, "runner", (action) => action.type === "break_subroutine");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "break_subroutine", cardDefinitionId: "efficient_fracter", title: "Efficient Fracter" });
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation", title: "Simple Economy Operation", serverLabel: "R&D" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
  });

  it("ends the run on an unbroken End the Run subroutine", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "etr" }));
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    expect(agendaPoints(state, "runner")).toBe(0);
    expect(state.corp.rd.map((id) => state.cardInstances[id]?.definitionId)).toContain("simple_agenda");
  });

  it("skips the Corp rez window when a later run approaches already rezzed ICE", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "rezzed-ice-repeat-run" }));
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");

    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(getLegalActions(state, "corp").map((action) => action.type)).not.toContain("decline_rez");
    expect(getLegalActions(state, "runner").map((action) => action.type)).toContain("continue_run");
  });

  it("lets the Corp score the third Simple Agenda and win at six agenda points", () => {
    let state = createGameAfterSetup({ seed: "corp-score", agendaPointsToWin: 6 });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 4;
    scoreTwoAgendasForTest(state);
    moveCorpCardToHq(state, "simple_agenda");

    state = apply(state, "corp", (action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_agenda");
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
    const knownRunnerCard = runnerView.own.gripOrHq.find((card) => card.definitionId === "simple_run_event");

    expect(knownRunnerCard?.rulesText).toBe("Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.");
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Barrier ICE");
    expect(serialized).not.toContain("Simple Economy Asset");
    expect(serialized).not.toContain("Keine zusätzliche Fähigkeit.");
    expect(serialized).not.toContain("End the run.");
    expect(serialized).not.toContain("Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.");
    expect(runnerView.opponent.handCount).toBe(state.corp.hq.length);
    expect(runnerView.opponent.deckCount).toBe(state.corp.rd.length);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(runnerView.servers.some((server) => server.ice.some((card) => !card.known))).toBe(true);
    expect(JSON.stringify(runnerView.publicEvents)).not.toContain("Simple Agenda");
  });

  it("replays actions and reproduces the final StateHash", () => {
    let state = createGameAfterSetup({ seed: "replay" });
    const initial = structuredClone(state);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "gain_credit");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase") state = applyChoice(state, "corp", String(state.pendingChoice.options[0]?.id));
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

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v094_neural_sentry_ice");
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
      flatline: false
    });
    expect(JSON.stringify(event?.publicPayload)).not.toContain("runner_");
    expect(state.runner.grip.length).toBe(beforeGripIds.length - 1);
    expect(state.runner.heap.length).toBe(1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toContain("damage:");
    expect(new Set([...state.runner.grip, ...state.runner.heap]).size).toBe(beforeGripIds.length);

    const corpView = getPlayerView(state, "corp");
    const serializedCorpView = JSON.stringify(corpView);
    for (const cardId of beforeGripIds) {
      const title = DEMO_CARDS_BY_ID[state.cardInstances[cardId]?.definitionId ?? ""]?.title;
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

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v094_neural_sentry_ice");
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
      gameEndReason: "flatline"
    });
    expect(getPlayerView(state, "runner").gameEndReason).toBe("flatline");
  });

  it("supports meat and core damage through the EffectCommand path", () => {
    const state = v094DamageGame("v094-meat-effect");
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [{ type: "do_damage", damageType: "meat", amount: 2, source: "v094_test_meat" }]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.heap.length).toBe(2);
    expect(next.runner.grip.length).toBe(state.runner.grip.length - 2);
    expect(next.randomDrawRecords.slice(-2).every((record) => record.purpose.includes("damage:"))).toBe(true);
    expect(new Set(next.runner.heap).size).toBe(2);

    const core = applyEffectCommands(state, [{ type: "do_damage", damageType: "core", amount: 2, source: "v111_test_core" }]);
    expect(core.runner.heap.length).toBe(2);
    expect(core.runner.coreDamage).toBe(2);
    expect(getPlayerView(core, "runner").own.maxHandSize).toBe(3);
    expect(getPlayerView(core, "corp").opponent.coreDamage).toBe(2);
    expect(core.randomDrawRecords.slice(-2).every((record) => record.purpose.includes(":core:"))).toBe(true);

    let operationState = createGameAfterSetup({ seed: "v111-core-operation", runnerDeck: V094_RUNNER_DECK, corpDeck: V111_CORP_DECK, agendaPointsToWin: 7 });
    operationState = apply(operationState, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(operationState, "v111_core_damage_operation");
    operationState = apply(operationState, "corp", (action) => action.type === "play_operation" && sourceDefinition(operationState, action) === "v111_core_damage_operation");
    expect(operationState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "core",
      damageAmount: 1,
      cardsTrashed: 1,
      coreDamageAfter: 1,
      runnerMaxHandSizeAfter: 4
    });
  });

  it("runs V1.1.1 Discard phases through private LegalActions", () => {
    let state = createGameAfterSetup({ seed: "v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.hq.length).toBe(6);

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.phase).toBe("corp_discard_phase");
    expect(state.timingPoint).toBe("corp_discard.select_cards");
    expect(state.pendingChoice).toMatchObject({ side: "corp", source: "discard_phase", minSelections: 1, maxSelections: 1 });
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(6);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    const discarded = String(state.pendingChoice?.options[0]?.value);
    state = applyChoice(state, "corp", String(state.pendingChoice?.options[0]?.id));
    expect(state.phase).toBe("runner_action_phase");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.corp.hq).not.toContain(discarded);
    expect(state.corp.archives).toContain(discarded);
    expect(state.cardInstances[discarded]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ discardResolved: true, discardSide: "corp", discardCount: 1, discardZone: "archives" });
    expect(JSON.stringify(getPlayerView(state, "runner").publicEvents.at(-1))).not.toContain(String(state.cardInstances[discarded]?.definitionId));
  });

  it("revalidates Runner Discard choices and moves selected cards to the heap", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v111-runner-discard" }));
    drawRunnerCardsForTest(state, 2);
    expect(state.runner.grip.length).toBe(7);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.pendingChoice).toMatchObject({ side: "runner", source: "discard_phase", minSelections: 2, maxSelections: 2 });

    const action = mustAction(state, "runner", (candidate) => candidate.type === "resolve_choice");
    const oneOption = state.pendingChoice?.options[0]?.id;
    const wrongCount = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: [oneOption] }
    });
    expect(wrongCount.ok).toBe(false);
    if (wrongCount.ok) throw new Error("Expected invalid choice");
    expect(wrongCount.error.code).toBe("ERR_INVALID_CHOICE");

    const selectedOptionIds = state.pendingChoice?.options.slice(0, 2).map((option) => option.id) ?? [];
    const selectedCardIds = state.pendingChoice?.options.slice(0, 2).map((option) => String(option.value)) ?? [];
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.runner.grip.length).toBe(5);
    expect(selectedCardIds.every((id) => state.runner.heap.includes(id))).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ discardResolved: true, discardSide: "runner", discardCount: 2, discardZone: "heap" });
  });

  it("flatlines at the start of the Runner discard step when core damage makes handlimit negative", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v111-negative-handlimit" }));
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

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v094_neural_sentry_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not expose later mechanics while enabling Damage", () => {
    const state = toRunnerTurn(v094DamageGame("v094-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(actionTypes).not.toContain("remove_tag");
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain("trace");
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain("resource");
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain("prevention");
  });
});

describe("O:NR v1 Limited local private test access", () => {
  it("validates the secured O:NR harness decks against the current card registry", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
    const state = onrV1Game("onr-v1-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.94");
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
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_079_bodyweight-synthetic-blood");
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_095_jack-n-joe");
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_097_livewires-contacts");
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_108_score");
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip");
    expect(state.runner.memoryLimit).toBe(5);
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_006_black-dahlia");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_014_codecracker");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_040_loony-goon");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_073_wizards-book");

    expect(state.runner.memoryUsed).toBe(4);
    expect(state.runner.rig.programs.map((id) => state.cardInstances[id]?.definitionId).sort()).toEqual([
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_040_loony-goon",
      "onr_v1_073_wizards-book"
    ]);
  });

  it("resolves O:NR code gates, sentries and multi-damage ICE through existing run rules", () => {
    let codeGateState = toRunnerTurn(onrV1Game("onr-v1-code-gate"));
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "onr_v1_220_tycho-extension");
    codeGateState.corp.credits = 20;

    codeGateState = apply(codeGateState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    codeGateState = apply(codeGateState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(codeGateState, action) === "onr_v1_261_quandary");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "break_subroutine");
    expect(getLegalActions(codeGateState, "runner").find((action) => action.type === "continue_run")?.label).toBe("ICE passieren");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "continue_run");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "access_card");
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "onr_v1_220_tycho-extension" });

    let sentryState = toRunnerTurn(onrV1Game("onr-v1-sentry"));
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "onr_v1_220_tycho-extension");
    sentryState.corp.credits = 20;

    sentryState = apply(sentryState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    sentryState = apply(sentryState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(sentryState, action) === "onr_v1_259_in-the-face");
    sentryState = apply(sentryState, "runner", (action) => action.type === "break_subroutine");
    sentryState = apply(sentryState, "runner", (action) => action.type === "continue_run");
    sentryState = apply(sentryState, "runner", (action) => action.type === "access_card");
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "onr_v1_220_tycho-extension" });

    let wallState = toRunnerTurn(onrV1Game("onr-v1-wall-of-ice"));
    putCorpIceOnServer(wallState, "rd", "onr_v1_278_wall-of-ice");
    wallState.corp.credits = 20;
    const beforeGrip = wallState.runner.grip.length;

    wallState = apply(wallState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    wallState = apply(wallState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(wallState, action) === "onr_v1_278_wall-of-ice");
    const continueIntoWall = getLegalActions(wallState, "runner").find((action) => action.type === "continue_run");
    expect(continueIntoWall).toMatchObject({
      label: "Subroutinen auslösen (Run endet)",
      payload: {
        encounterContinue: true,
        unbrokenSubroutineCount: 4,
        encounterWillEndRun: true
      }
    });
    wallState = apply(wallState, "runner", (action) => action.type === "continue_run");

    expect(wallState.run).toBeUndefined();
    expect(wallState.runner.grip.length).toBe(beforeGrip - 4);
    expect(wallState.runner.heap.length).toBe(4);
    expect(wallState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageResolved: true,
      damageType: "net",
      damageAmount: 4,
      cardsTrashed: 4,
      flatline: false
    });
  });

  it("plays O:NR tagged operations, meat damage operations and Tycho Extension scoring", () => {
    let state = createGameAfterSetup({ seed: "onr-v1-corp-operations", runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
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
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_281_accounts-receivable");
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeDayShiftHq = state.corp.hq.length;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_288_day-shift");
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_290_efficiency-experts");
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeVoucherTags = state.runner.tags;
    const beforeVoucherCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_293_netwatch-credit-voucher");
    expect(state.runner.tags).toBe(beforeVoucherTags + 1);
    expect(state.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftHq = state.corp.hq.length;
    const beforeNightShiftCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_295_night-shift");
    expect(state.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(state.corp.hq.length).toBe(beforeNightShiftHq);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech");
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_285_closed-accounts");
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5]
    ] as const) {
      let damageState = createGameAfterSetup({ seed: `onr-v1-${definitionId}`, runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
      damageState = apply(damageState, "corp", (action) => action.type === "mandatory_draw");
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(damageState, "corp", (action) => action.type === "play_operation" && sourceDefinition(damageState, action) === definitionId);
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false
      });
      expect(JSON.stringify(damageState.eventLog.at(-1)?.publicPayload)).not.toContain("runner_");
    }

    let scoringState = createGameAfterSetup({ seed: "onr-v1-tycho-score", runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
    scoringState = apply(scoringState, "corp", (action) => action.type === "mandatory_draw");
    scoringState.corp.credits = 20;
    scoringState.corp.clicks = 10;
    moveCorpCardToHq(scoringState, "onr_v1_220_tycho-extension");

    scoringState = apply(scoringState, "corp", (action) => action.type === "install_card" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    scoringState = apply(scoringState, "corp", (action) => action.type === "advance_card" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    scoringState = apply(scoringState, "corp", (action) => action.type === "advance_card" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    scoringState = apply(scoringState, "corp", (action) => action.type === "advance_card" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    scoringState = apply(scoringState, "corp", (action) => action.type === "advance_card" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    scoringState = apply(scoringState, "corp", (action) => action.type === "score_agenda" && sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension");
    expect(agendaPoints(scoringState, "corp")).toBe(4);
  });

  it("keeps repaired O:NR simple wall mappings playable", () => {
    for (const definitionId of ["onr_v1_237_data-wall", "onr_v1_238_data-wall-2-0", "onr_v1_265_rock-is-strong"] as const) {
      let state = toRunnerTurn(onrV1Game(`onr-v1-repaired-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      putCorpCardOnTopOfRd(state, "onr_v1_220_tycho-extension");
      state.corp.credits = 20;

      state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === definitionId);
      state = apply(state, "runner", (action) => action.type === "continue_run");

      expect(state.run).toBeUndefined();
      expect(agendaPoints(state, "runner")).toBe(0);
      expect(state.corp.rd.map((id) => state.cardInstances[id]?.definitionId)).toContain("onr_v1_220_tycho-extension");
    }
  });
});

describe("V1.0.5K Card Release", () => {
  it("keeps the final V1.0.5K card list small and backed by concrete definitions", () => {
    expect(ONR_V1_0_5K_FINAL_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_5K_FINAL_CARD_IDS.length).toBeLessThanOrEqual(20);
    for (const definitionId of ONR_V1_0_5K_FINAL_CARD_IDS) {
      expect(DEMO_CARDS_BY_ID[definitionId]?.implementationStatus, definitionId).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_237_data-wall"]).toMatchObject({ rezCost: 1, strength: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_238_data-wall-2-0"]).toMatchObject({ rezCost: 2, strength: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_239_endless-corridor"]).toMatchObject({ rezCost: 4, strength: 2 });
    expect(DEMO_CARDS_BY_ID["onr_v1_144_tycho-mem-chip"]).toMatchObject({ installCost: 5, memoryLimitBonus: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_146_zetatech-mem-chip"]).toMatchObject({ installCost: 3, memoryLimitBonus: 2 });
    expect(DEMO_CARDS_BY_ID["onr_v1_203_hostile-takeover"]).toMatchObject({ advancementRequirement: 3, agendaPoints: 1 });
  });

  it("validates the V1.0.5K smoke decks and starts on the O:NR rules baseline", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_5K_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_0_5K_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
    const state = v105kCardReleaseGame("v105k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.94");
  });

  it("installs V1.0.5K memory chips with their printed MU bonuses and gates program installs by memory", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-memory-chips"));
    state.runner.credits = 40;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_144_tycho-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_146_zetatech-mem-chip");

    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_144_tycho-mem-chip");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_146_zetatech-mem-chip");

    expect(state.runner.memoryLimit).toBe(9);
    const runnerView = getPlayerView(state, "runner");
    expect(runnerView.own.rig?.find((card) => card.definitionId === "onr_v1_144_tycho-mem-chip")?.memoryLimitBonus).toBe(3);
    expect(runnerView.own.rig?.find((card) => card.definitionId === "onr_v1_146_zetatech-mem-chip")?.memoryLimitBonus).toBe(2);

    let gatedState = toRunnerTurn(v105kCardReleaseGame("v105k-memory-gate"));
    gatedState.runner.credits = 40;
    gatedState.runner.clicks = 10;
    installRunnerProgramForTest(gatedState, "onr_v1_015_codeslinger");
    installRunnerProgramForTest(gatedState, "onr_v1_052_raffles");
    installRunnerProgramForTest(gatedState, "onr_v1_054_raptor");
    installRunnerProgramForTest(gatedState, "onr_v1_070_tinweasel");
    moveRunnerCardCopyToGrip(gatedState, "onr_v1_015_codeslinger");

    expect(gatedState.runner.memoryUsed).toBe(4);
    expect(getLegalActions(gatedState, "runner").some((action) => action.type === "install_card" && sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger")).toBe(false);

    moveRunnerCardToGrip(gatedState, "onr_v1_144_tycho-mem-chip");
    gatedState = apply(gatedState, "runner", (action) => action.type === "install_card" && sourceDefinition(gatedState, action) === "onr_v1_144_tycho-mem-chip");
    expect(getLegalActions(gatedState, "runner").some((action) => action.type === "install_card" && sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger")).toBe(true);
  });

  it("breaks matching V1.0.5K ICE subroutines and rejects mismatched breaker targets", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-raffles-endless"));
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_052_raffles");
    putCorpIceOnServer(state, "rd", "onr_v1_239_endless-corridor");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 20;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_239_endless-corridor");
    state = apply(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "onr_v1_052_raffles" && action.payload?.subroutineIndex === 0);
    state = apply(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "onr_v1_052_raffles" && action.payload?.subroutineIndex === 1);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation" });

    for (const [breakerId, iceId] of [
      ["onr_v1_015_codeslinger", "onr_v1_237_data-wall"],
      ["onr_v1_070_tinweasel", "onr_v1_232_crystal-wall"]
    ] as const) {
      let mismatch = toRunnerTurn(v105kCardReleaseGame(`v105k-mismatch-${breakerId}`));
      mismatch.runner.credits = 20;
      installRunnerProgramForTest(mismatch, breakerId);
      putCorpIceOnServer(mismatch, "rd", iceId);
      mismatch.corp.credits = 20;

      mismatch = apply(mismatch, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      mismatch = apply(mismatch, "corp", (action) => action.type === "rez_ice" && sourceDefinition(mismatch, action) === iceId);

      expect(getLegalActions(mismatch, "runner").some((action) => action.type === "break_subroutine" && sourceDefinition(mismatch, action) === breakerId)).toBe(false);
    }
  });

  it("scores Hostile Takeover with its narrow on-score credit resolver and deterministic replay", () => {
    let state = createGameAfterSetup({ seed: "v105k-hostile-takeover", runnerDeck: ONR_V1_0_5K_RUNNER_DECK, corpDeck: ONR_V1_0_5K_CORP_DECK, agendaPointsToWin: 7 });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    const initial = structuredClone(state);

    state = apply(state, "corp", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover");
    const beforeScoreCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "score_agenda" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover");

    expect(state.corp.credits).toBe(beforeScoreCredits + 5);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      onScoreGainCredits: 5,
      corpCreditsAfter: state.corp.credits
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("corp_");

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not offer a second agenda or asset into an occupied remote root", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_0_5K_CORP_DECK,
      id: "v105k_remote_root_limit_corp",
      cards: [...ONR_V1_0_5K_CORP_DECK.cards, { id: "simple_economy_asset", quantity: 1 }, { id: "simple_upgrade", quantity: 1 }]
    };
    let state = createGameAfterSetup({ seed: "v105k-remote-root-limit", runnerDeck: ONR_V1_0_5K_RUNNER_DECK, corpDeck, agendaPointsToWin: 7 });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToHq(state, "simple_economy_asset");
    moveCorpCardToHq(state, "simple_upgrade");

    state = apply(state, "corp", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_203_hostile-takeover" && action.payload?.serverId === "new_remote");
    const actions = getLegalActions(state, "corp");

    expect(actions.some((action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_agenda" && action.payload?.serverId === "remote_1")).toBe(false);
    expect(actions.some((action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_economy_asset" && action.payload?.serverId === "remote_1")).toBe(false);
    expect(actions.some((action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_upgrade" && action.payload?.serverId === "remote_1")).toBe(true);
    expect(actions.some((action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_agenda" && action.payload?.serverId === "new_remote")).toBe(true);
  });

  it("keeps V1.0.5K ICE hidden in Runner views until rez", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-visibility-data-wall-2"));
    putCorpIceOnServer(state, "rd", "onr_v1_238_data-wall-2-0");
    state.corp.credits = 20;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Data Wall 2.0");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_238_data-wall-2-0");

    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain("Data Wall 2.0");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "rez_ice", cardDefinitionId: "onr_v1_238_data-wall-2-0", title: "Data Wall 2.0" });
  });
});

describe("V1.0.6K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_0_6K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_0_6K_FINAL_CARD_IDS) {
      expect(DEMO_CARDS_BY_ID[definitionId]?.implementationStatus, definitionId).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_072_wild-card"]).toMatchObject({ installCost: 0, memoryCost: 1, strength: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_145_wutech-mem-chip"]).toMatchObject({ installCost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_220_tycho-extension"]).toMatchObject({ advancementRequirement: 4, agendaPoints: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_244_filter"]).toMatchObject({ rezCost: 0, strength: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_245_fire-wall"]).toMatchObject({ rezCost: 5, strength: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_252_keeper"]).toMatchObject({ rezCost: 4, strength: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_256_mazer"]).toMatchObject({ rezCost: 5, strength: 5 });
  });

  it("validates V1.0.6K smoke decks and keeps the previous V1.0.5K cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_6K_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_0_6K_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
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
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_079_bodyweight-synthetic-blood");
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_095_jack-n-joe");
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_097_livewires-contacts");
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_108_score");
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_072_wild-card");
    expect(state.runner.memoryLimit).toBe(5);
    expect(state.runner.rig.programs.map((id) => state.cardInstances[id]?.definitionId)).toContain("onr_v1_072_wild-card");

    let sentryRun = toRunnerTurn(v106kCardReleaseGame("v106k-wild-card-sentry"));
    sentryRun.runner.credits = 20;
    installRunnerProgramForTest(sentryRun, "onr_v1_072_wild-card");
    putCorpIceOnServer(sentryRun, "rd", "simple_sentry_ice");
    putCorpCardOnTopOfRd(sentryRun, "simple_economy_operation");
    sentryRun.corp.credits = 20;

    sentryRun = apply(sentryRun, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    sentryRun = apply(sentryRun, "corp", (action) => action.type === "rez_ice" && sourceDefinition(sentryRun, action) === "simple_sentry_ice");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "continue_run");
    sentryRun = apply(sentryRun, "runner", (action) => action.type === "access_card");
    expect(sentryRun.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation" });
  });

  it("plays V1.0.6K Corp economy, tagged and damage operations", () => {
    let state = createGameAfterSetup({ seed: "v106k-corp-operations", runnerDeck: ONR_V1_0_6K_RUNNER_DECK, corpDeck: ONR_V1_0_6K_CORP_DECK, agendaPointsToWin: 7 });
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
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_281_accounts-receivable");
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeReviewsHq = state.corp.hq.length;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_282_annual-reviews");
    expect(state.corp.hq.length).toBe(beforeReviewsHq + 2);

    const beforeDayShiftHq = state.corp.hq.length;
    const beforeDayShiftCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_288_day-shift");
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);
    expect(state.corp.credits).toBe(beforeDayShiftCredits + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_290_efficiency-experts");
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech");
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_285_closed-accounts");
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5]
    ] as const) {
      let damageState = createGameAfterSetup({ seed: `v106k-${definitionId}`, runnerDeck: ONR_V1_0_6K_RUNNER_DECK, corpDeck: ONR_V1_0_6K_CORP_DECK, agendaPointsToWin: 7 });
      damageState = apply(damageState, "corp", (action) => action.type === "mandatory_draw");
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(damageState, "corp", (action) => action.type === "play_operation" && sourceDefinition(damageState, action) === definitionId);
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false
      });
    }
  });

  it("rezzes V1.0.6K simple ICE and keeps unrezzed titles hidden", () => {
    for (const definitionId of ["onr_v1_244_filter", "onr_v1_245_fire-wall", "onr_v1_252_keeper", "onr_v1_256_mazer"] as const) {
      let state = toRunnerTurn(v106kCardReleaseGame(`v106k-ice-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 20;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(DEMO_CARDS_BY_ID[definitionId]?.title);

      state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === definitionId);

      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(DEMO_CARDS_BY_ID[definitionId]?.title);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.run).toBeUndefined();
    }
  });
});

describe("V1.1.2K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_1_2K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_1_2K_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe("playable_mvp");
      expect(definition?.mechanics.join(" ")).not.toMatch(/prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity/);
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_006_black-dahlia"]).toMatchObject({ installCost: 5, memoryCost: 1, strength: 10 });
    expect(DEMO_CARDS_BY_ID["onr_v1_014_codecracker"]).toMatchObject({ installCost: 0, memoryCost: 1, strength: 2 });
    expect(DEMO_CARDS_BY_ID["onr_v1_016_cyfermaster"]).toMatchObject({ installCost: 5, memoryCost: 1, strength: 2 });
    expect(DEMO_CARDS_BY_ID["onr_v1_040_loony-goon"]).toMatchObject({ installCost: 0, memoryCost: 1, strength: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_060_shaka"]).toMatchObject({ installCost: 2, memoryCost: 1, strength: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_073_wizards-book"]).toMatchObject({ installCost: 2, memoryCost: 1, strength: 5 });
    expect(DEMO_CARDS_BY_ID["onr_v1_253_laser-wire"]).toMatchObject({ rezCost: 4, strength: 2 });
    expect(DEMO_CARDS_BY_ID["onr_v1_257_nerve-labyrinth"]).toMatchObject({ rezCost: 6, strength: 4 });
    expect(DEMO_CARDS_BY_ID["onr_v1_278_wall-of-ice"]).toMatchObject({ rezCost: 13, strength: 6 });
    expect(DEMO_CARDS_BY_ID["onr_v1_293_netwatch-credit-voucher"]).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_295_night-shift"]).toMatchObject({ cost: 0 });
  });

  it("validates V1.1.2K smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_1_2K_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_1_2K_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
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
    let installState = toRunnerTurn(v112kCardReleaseGame("v112k-runner-breakers"));
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of ["onr_v1_006_black-dahlia", "onr_v1_014_codecracker", "onr_v1_016_cyfermaster", "onr_v1_040_loony-goon", "onr_v1_060_shaka", "onr_v1_073_wizards-book"] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(installState, "runner", (action) => action.type === "install_card" && sourceDefinition(installState, action) === definitionId);
    }
    expect(installState.runner.memoryUsed).toBe(6);

    let codeGateState = toRunnerTurn(v112kCardReleaseGame("v112k-codecracker-quandary"));
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "simple_economy_operation");
    codeGateState.corp.credits = 20;

    codeGateState = apply(codeGateState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    codeGateState = apply(codeGateState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(codeGateState, action) === "onr_v1_261_quandary");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "continue_run");
    codeGateState = apply(codeGateState, "runner", (action) => action.type === "access_card");
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation" });

    let sentryState = toRunnerTurn(v112kCardReleaseGame("v112k-loony-goon-face"));
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "simple_economy_operation");
    sentryState.corp.credits = 20;

    sentryState = apply(sentryState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    sentryState = apply(sentryState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(sentryState, action) === "onr_v1_259_in-the-face");
    sentryState = apply(sentryState, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon");
    sentryState = apply(sentryState, "runner", (action) => action.type === "continue_run");
    sentryState = apply(sentryState, "runner", (action) => action.type === "access_card");
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation" });
  });

  it("plays V1.1.2K Corp operations and resolves new ICE through visibility-safe replayable paths", () => {
    let operationState = createGameAfterSetup({ seed: "v112k-corp-operations", runnerDeck: ONR_V1_1_2K_RUNNER_DECK, corpDeck: ONR_V1_1_2K_CORP_DECK, agendaPointsToWin: 7 });
    operationState = apply(operationState, "corp", (action) => action.type === "mandatory_draw");
    operationState.corp.credits = 20;
    operationState.corp.clicks = 8;
    operationState.runner.tags = 1;
    moveCorpCardToHq(operationState, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(operationState, "onr_v1_295_night-shift");

    const beforeVoucherTags = operationState.runner.tags;
    const beforeVoucherCredits = operationState.corp.credits;
    operationState = apply(operationState, "corp", (action) => action.type === "play_operation" && sourceDefinition(operationState, action) === "onr_v1_293_netwatch-credit-voucher");
    expect(operationState.runner.tags).toBe(beforeVoucherTags + 1);
    expect(operationState.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftCards = operationState.corp.hq.length;
    const beforeNightShiftCredits = operationState.corp.credits;
    operationState = apply(operationState, "corp", (action) => action.type === "play_operation" && sourceDefinition(operationState, action) === "onr_v1_295_night-shift");
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
      "onr_v1_279_wall-of-static"
    ] as const) {
      let state = toRunnerTurn(v112kCardReleaseGame(`v112k-ice-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 30;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(DEMO_CARDS_BY_ID[definitionId]?.title);

      state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === definitionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(DEMO_CARDS_BY_ID[definitionId]?.title);

      const beforeContinue = structuredClone(state);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.run).toBeUndefined();
      expect(replayEvents(beforeContinue, state.eventLog.slice(beforeContinue.eventLog.length)).ok).toBe(true);
    }
  });
});

describe("V1.2.3 Mechanic Unlock Card Release 1", () => {
  it("adds exactly eleven human-playable O:NR cards without opening deferred mechanics", () => {
    expect(ONR_V1_2_3_FINAL_CARD_IDS).toHaveLength(11);
    for (const definitionId of ONR_V1_2_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe("playable_mvp");
      expect(definition?.mechanics.join(" ")).not.toMatch(/prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity|format|deckbuilder|parser/);
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]).toMatchObject({ installCost: 3, memoryCost: 1, strength: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_039_krash"]).toMatchObject({ installCost: 3, memoryCost: 1, strength: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_066_snowball"]).toMatchObject({ installCost: 3, memoryCost: 1, strength: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_074_worm"]).toMatchObject({ installCost: 2, memoryCost: 1, strength: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_081_custodial-position"]).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_085_executive-wiretaps"]).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_101_mit-west-tier"]).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_243_fetch-4-0-1"]).toMatchObject({ rezCost: 0, strength: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_249_hunter"]).toMatchObject({ rezCost: 2, strength: 5 });
    expect(DEMO_CARDS_BY_ID["onr_v1_297_overtime-incentives"]).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_306_trojan-horse"]).toMatchObject({ cost: 2 });
  });

  it("validates V1.2.3 smoke decks after the V1.2.2 gate", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_2_3_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_2_3_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
    const state = v123CardReleaseGame("v123-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.specialZones).toEqual({ setAside: [], removedFromGame: [] });
    expect(DEMO_CARDS_BY_ID["onr_v1_018_dogcatcher"]).toBeUndefined();
  });

  it("installs the four unlocked breakers and resolves wall, sentry and universal break rules", () => {
    let installState = toRunnerTurn(v123CardReleaseGame("v123-runner-breakers"));
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of ["onr_v1_021_dwarf", "onr_v1_039_krash", "onr_v1_066_snowball", "onr_v1_074_worm"] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(installState, "runner", (action) => action.type === "install_card" && sourceDefinition(installState, action) === definitionId);
    }
    expect(installState.runner.memoryUsed).toBe(4);

    const breakCases = [
      { breaker: "onr_v1_021_dwarf", ice: "onr_v1_237_data-wall", seed: "dwarf-wall" },
      { breaker: "onr_v1_074_worm", ice: "onr_v1_237_data-wall", seed: "worm-wall" },
      { breaker: "onr_v1_066_snowball", ice: "onr_v1_259_in-the-face", seed: "snowball-sentry" },
      { breaker: "onr_v1_039_krash", ice: "onr_v1_261_quandary", seed: "krash-code-gate" }
    ] as const;

    for (const testCase of breakCases) {
      let state = toRunnerTurn(v123CardReleaseGame(`v123-${testCase.seed}`));
      state.runner.credits = 20;
      state.corp.credits = 20;
      installRunnerProgramForTest(state, testCase.breaker);
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");

      state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === testCase.ice);
      for (let pumpCount = 0; pumpCount < 5 && !getLegalActions(state, "runner").some((action) => action.type === "break_subroutine" && sourceDefinition(state, action) === testCase.breaker); pumpCount += 1) {
        state = apply(state, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(state, action) === testCase.breaker);
      }
      state = apply(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === testCase.breaker);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      for (let continueCount = 0; continueCount < 3 && !getLegalActions(state, "runner").some((action) => action.type === "access_card"); continueCount += 1) {
        state = apply(state, "runner", (action) => action.type === "continue_run");
      }
      state = apply(state, "runner", (action) => action.type === "access_card");
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation" });
    }
  });

  it("plays the unlocked R&D and HQ multiaccess events with hidden queues", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("v123-custodial-position"));
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "simple_economy_operation");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_220_tycho-extension");

    rdState = apply(rdState, "runner", (action) => action.type === "play_event" && sourceDefinition(rdState, action) === "onr_v1_081_custodial-position" && action.payload?.serverId === "rd");

    expect(rdState.timingPoint).toBe("access.resolve_card");
    expect(rdState.run?.breach).toMatchObject({ serverId: "rd", accessMode: "multi", currentIndex: 0 });
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(rdState.eventLog.at(-1)?.publicPayload)).not.toContain("Tycho Extension");

    let hqState = toRunnerTurn(v123CardReleaseGame("v123-executive-wiretaps"));
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const first = moveCorpCardToHq(hqState, "simple_economy_operation");
    const second = moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover");
    const third = moveCorpCardToHq(hqState, "onr_v1_220_tycho-extension");
    keepOnlyCorpHqCards(hqState, [first, second, third]);

    hqState = apply(hqState, "runner", (action) => action.type === "play_event" && sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" && action.payload?.serverId === "hq");

    expect(hqState.run?.breach).toMatchObject({ serverId: "hq", accessMode: "multi", currentIndex: 0 });
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(hqState, "runner"))).not.toContain("Tycho Extension");
    expect(getPlayerView(hqState, "runner").run?.breach?.remainingCount).toBe(3);
  });

  it("removes MIT West Tier from the game after a deterministic hidden shuffle and draw", () => {
    let state = toRunnerTurn(v123CardReleaseGame("v123-mit-west-tier"));
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_101_mit-west-tier");

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.heap).not.toContain(eventId);
    expect(state.specialZones?.removedFromGame).toEqual([eventId]);
    expect(state.cardInstances[eventId]?.zone).toMatchObject({ side: "special", zone: "removed_from_game", visibility: "public" });
    expect(getPlayerView(state, "runner").specialZones?.removedFromGame[0]).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier", owner: "runner", controller: "runner" });
    expect(getPlayerView(state, "corp").specialZones?.removedFromGame[0]).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("runner_");

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
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "onr_v1_297_overtime-incentives");

    expect(state.corp.clicks).toBe(before + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "play_operation", cardDefinitionId: "onr_v1_297_overtime-incentives", gainedActions: 2 });
    expect(JSON.stringify(getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload)).not.toContain("corp_");
  });

  it("gates Trojan Horse on runner agenda theft in the last turn and gives 1 tag when legal", () => {
    let state = v123CardReleaseGame("v123-trojan-horse");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    state.corp.credits = 8;

    const beforeRunnerTurn = apply(state, "corp", (action) => action.type === "end_turn");
    const beforeTheftInput = getLegalActions(beforeRunnerTurn, "corp").filter(
      (action) => action.type === "play_operation" && sourceDefinition(beforeRunnerTurn, action) === "onr_v1_306_trojan-horse"
    );
    expect(beforeTheftInput).toHaveLength(0);
    moveCorpCardToArchives(beforeRunnerTurn, "onr_v1_220_tycho-extension");

    let afterTheft = apply(beforeRunnerTurn, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "archives");
    afterTheft = apply(afterTheft, "runner", (action) => action.type === "access_card");
    afterTheft = apply(afterTheft, "runner", (action) => action.type === "steal_agenda");
    afterTheft = apply(afterTheft, "runner", (action) => action.type === "end_turn");
    afterTheft = apply(afterTheft, "corp", (action) => action.type === "mandatory_draw");
    const trojanAfterTheft = moveCorpCardToHq(afterTheft, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(afterTheft, trojanAfterTheft);
    afterTheft.corp.credits = 8;
    const beforeTags = afterTheft.runner.tags;

    afterTheft = apply(afterTheft, "corp", (action) => action.type === "play_operation" && sourceDefinition(afterTheft, action) === "onr_v1_306_trojan-horse");

    expect(afterTheft.runner.tags).toBe(beforeTags + 1);
    expect(afterTheft.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_306_trojan-horse"
    });
  });
});

describe("V1.6.1 Mechanikpaket A", () => {
  it("adds a controlled V1.6.1 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_1_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_6_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe("playable_mvp");
      expect(definition?.mechanics.join(" ")).not.toMatch(/hosting|daemon|stealth|worm|search|arrange|shuffle|unique|counter_system|deterministischer_wuerfel/);
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_023_evil-twin"]).toMatchObject({ installCost: 6, memoryCost: 1, strength: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_028_force-shield"]).toMatchObject({ installCost: 2, memoryCost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_125_dermatech-bodyplating"]).toMatchObject({ installCost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_229_code-corpse"]).toMatchObject({ rezCost: 10, strength: 5 });
    expect(DEMO_CARDS_BY_ID["onr_v1_231_cortical-scrub"]).toMatchObject({ rezCost: 7, strength: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_254_liche"]).toMatchObject({ rezCost: 14, strength: 6 });
  });

  it("validates V1.6.1 smoke decks and keeps prior ONR runtime cards legal", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_1_RUNNER_DECK, { expectedSide: "runner" });
    const corpValidation = validateDeckDefinition(ONR_V1_6_1_CORP_DECK, { expectedSide: "corp", minimumAgendaPoints: 7 });
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
    let coreState = toRunnerTurn(createGameAfterSetup({
      seed: "v161-force-shield",
      runnerDeck: ONR_V1_6_1_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    }));
    coreState.runner.credits = 20;
    moveRunnerCardToGrip(coreState, "onr_v1_028_force-shield");
    coreState = apply(coreState, "runner", (action) => action.type === "install_card" && sourceDefinition(coreState, action) === "onr_v1_028_force-shield");
    coreState = apply(coreState, "runner", (action) => action.type === "end_turn");
    coreState = apply(coreState, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(coreState, "v111_core_damage_operation");
    const coreGripBefore = coreState.runner.grip.length;
    coreState = apply(coreState, "corp", (action) => action.type === "play_operation" && sourceDefinition(coreState, action) === "v111_core_damage_operation");
    expect(coreState.pendingChoice?.source).toBe("v120.event_modification.prevent");
    const preventionOption = coreState.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    coreState = applyChoice(coreState, "runner", preventionOption ?? "pass");
    expect(coreState.runner.coreDamage).toBe(0);
    expect(coreState.runner.grip.length).toBe(coreGripBefore);
    expect(coreState.eventLog.at(-1)?.publicPayload).toMatchObject({ eventModificationDecision: "apply", finalAmount: 0, damageAmount: 0 });

    let meatState = toRunnerTurn(createGameAfterSetup({
      seed: "v161-dermatech",
      runnerDeck: ONR_V1_6_1_RUNNER_DECK,
      corpDeck: ONR_V1_6_1_CORP_DECK,
      agendaPointsToWin: 7
    }));
    meatState.runner.credits = 20;
    moveRunnerCardToGrip(meatState, "onr_v1_125_dermatech-bodyplating");
    meatState = apply(meatState, "runner", (action) => action.type === "install_card" && sourceDefinition(meatState, action) === "onr_v1_125_dermatech-bodyplating");
    meatState = apply(meatState, "runner", (action) => action.type === "end_turn");
    meatState = apply(meatState, "corp", (action) => action.type === "mandatory_draw");
    meatState.runner.tags = 1;
    moveCorpCardToHq(meatState, "onr_v1_302_scorched-earth");
    const meatGripBefore = meatState.runner.grip.length;
    meatState = apply(meatState, "corp", (action) => action.type === "play_operation" && sourceDefinition(meatState, action) === "onr_v1_302_scorched-earth");
    const meatPreventionOption = meatState.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    meatState = applyChoice(meatState, "runner", meatPreventionOption ?? "pass");
    expect(meatState.runner.grip.length).toBe(meatGripBefore - 3);
    expect(meatState.eventLog.at(-1)?.publicPayload).toMatchObject({ eventModificationDecision: "apply", preventedAmount: 1, damageAmount: 3 });
  });

  it("resolves new core-damage ICE through replayable, side-safe run paths", () => {
    const cases = [
      { ice: "onr_v1_229_code-corpse", expectedCoreDamage: 2 },
      { ice: "onr_v1_231_cortical-scrub", expectedCoreDamage: 1 },
      { ice: "onr_v1_254_liche", expectedCoreDamage: 3 }
    ] as const;

    for (const testCase of cases) {
      let state = toRunnerTurn(v161CardReleaseGame(`v161-${testCase.ice}`));
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === testCase.ice);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.run).toBeUndefined();
      expect(state.runner.coreDamage).toBe(testCase.expectedCoreDamage);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "continue_run", result: "ended" });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("MVP 0.95 Resources and tag interaction", () => {
  it("installs a local Resource through LegalActions and shows it publicly", () => {
    let state = toRunnerTurn(v095ResourceGame("v095-install-resource"));
    state.runner.credits = 6;
    moveRunnerCardToGrip(state, "v095_safehouse_resource");

    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v095_safehouse_resource");

    expect(state.baseline.engineSchemaVersion).toBe("0.95.0");
    expect(state.runner.credits).toBe(4);
    expect(state.runner.rig.resources.map((id) => state.cardInstances[id]?.definitionId)).toEqual(["v095_safehouse_resource"]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource",
      zoneLabel: "Resource"
    });

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    expect(runnerView.own.rig?.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(corpView.opponent.rig?.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(JSON.stringify(corpView)).not.toContain("Simple Fracter");
  });

  it("lets the Corp trash an installed Resource only while the Runner is tagged", () => {
    let state = installedResourceCorpTurn("v095-trash-resource");
    const resourceId = state.runner.rig.resources[0]!;
    const beforeHash = hashState(state);

    state = apply(state, "corp", (action) => action.type === "trash_resource" && action.payload?.resourceId === resourceId);

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
      zoneLabel: "Resource"
    });
  });

  it("rejects Resource trash without tags, stale state or installed Resource target", () => {
    const tagged = installedResourceCorpTurn("v095-trash-revalidate");
    const trashAction = mustAction(tagged, "corp", (action) => action.type === "trash_resource");
    const untagged = structuredClone(tagged);
    untagged.runner.tags = 0;

    expect(getLegalActions(untagged, "corp").some((action) => action.type === "trash_resource")).toBe(false);
    expect(
      applyAction(untagged, {
        matchId: untagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: untagged.stateVersion
      }).ok
    ).toBe(false);
    expect(
      applyAction(tagged, {
        matchId: tagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: tagged.stateVersion - 1
      })
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    const missingTarget = structuredClone(tagged);
    removeEverywhere(missingTarget, String(trashAction.payload?.resourceId));
    expect(getLegalActions(missingTarget, "corp").some((action) => action.type === "trash_resource")).toBe(false);
  });

  it("replays Resource install and trash with deterministic StateHash and no new randomness", () => {
    const initial = installedResourceCorpTurn("v095-replay-resource");
    const randomBefore = initial.randomDrawRecords.length;
    let state = apply(initial, "corp", (action) => action.type === "trash_resource");

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
  });

  it("does not expose V0.96+ mechanics while enabling Resources", () => {
    const state = toRunnerTurn(v095ResourceGame("v095-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain("trace");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain("virus");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain("prevention");
  });
});

describe("MVP 0.96 Trace, Link and Bidding", () => {
  it("starts a public trace, resolves Corp and Runner bids, and applies add_tag on success", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-success"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.baseline.engineSchemaVersion).toBe("0.96.0");
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({ status: "corp_bid", baseTraceStrength: 2 });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      traceStarted: true,
      sourceDefinitionId: "v096_trace_probe_ice",
      baseTraceStrength: 2
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(state.pendingChoice?.choiceId);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.corp.credits).toBe(4);
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.trace).toMatchObject({ status: "runner_bid", corpBid: 1, traceStrength: 3, runnerLink: 0 });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      corpBid: 1,
      traceStrength: 3,
      runnerLink: 0
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
      tagsAdded: 1
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

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_2");

    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStrength: 2,
      runnerStrength: 2,
      traceSuccessful: false,
      tagsAdded: 0
    });
  });

  it("rejects wrong-side, stale and illegal bid choices", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-illegal"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpChoiceAction = mustAction(state, "corp", (action) => action.type === "resolve_choice");

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["bid_0"] }
      }).ok
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["bid_0"] }
      })
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: { choiceId: "wrong_choice", selectedOptionIds: ["bid_0"] }
      })
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: corpChoiceAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["bid_99"] }
      })
    ).toMatchObject({ ok: false, error: { code: "ERR_INVALID_CHOICE" } });
  });

  it("replays Trace bids with deterministic StateHash and no new randomness", () => {
    let state = toRunnerTurn(v096TraceGame("v096-trace-replay"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;
    const initial = structuredClone(state);
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Fracter");
  });

  it("does not expose V0.97+ mechanics while enabling Trace", () => {
    const state = toRunnerTurn(v096TraceGame("v096-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).toContain("trace");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain("multiaccess");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain("virus");
    expect(DEMO_CARDS_BY_ID.v096_trace_probe_ice?.mechanics).not.toContain("prevention");
  });
});

describe("MVP 0.97 Run, Jack-out, Breach and Multiaccess", () => {
  it("creates V0.97 games with explicit demo decks and keeps old run behavior gated", () => {
    const state = createGameAfterSetup({
      seed: "v097-baseline",
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097"
    });
    const legacy = toRunnerTurn(createGameAfterSetup({ seed: "v097-legacy-gate" }));

    expect(state.baseline.engineSchemaVersion).toBe("0.97.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.97");
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.97");
    expect(Object.values(state.cardInstances).some((card) => card.definitionId === "v097_deep_dive_event")).toBe(true);

    let oldRun = legacy;
    oldRun = apply(oldRun, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    expect(oldRun.timingPoint).toBe("access.resolve_card");
    expect(oldRun.run?.breach).toBeUndefined();
    expect(getLegalActions(oldRun, "runner").map((action) => action.type)).not.toContain("jack_out");
  });

  it("offers a public jack-out window after passing ICE", () => {
    let state = toRunnerTurn(v097RunGame("v097-jack-out"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_2");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.phase).toBe("movement");
    expect(getLegalActions(state, "runner").map((action) => action.type).sort()).toEqual(["continue_run", "jack_out"]);

    state = apply(state, "runner", (action) => action.type === "jack_out");

    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "jack_out" });
  });

  it("breaches R&D with Deep Dive and does not reveal future queued accesses", () => {
    let state = toRunnerTurn(v097RunGame("v097-rd-multiaccess"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v097_deep_dive_event" && action.payload?.serverId === "rd");

    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.run?.breach).toMatchObject({ serverId: "rd", accessMode: "multi", currentIndex: 0 });
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Economy Operation");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Agenda");

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Agenda");
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.accessedCardId).toBeUndefined();

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ cardDefinitionId: "simple_agenda", title: "Simple Agenda" });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
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

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v097_deep_dive_event" && action.payload?.serverId === "hq");

    const queueIds = state.run?.breach?.queue.map((entry) => entry.cardInstanceId) ?? [];
    expect(queueIds).toHaveLength(2);
    expect(new Set(queueIds)).toEqual(new Set([operationId, agendaId]));
    expect(state.randomDrawRecords.slice(randomBefore).map((record) => record.purpose)).toEqual([
      `${state.run?.runId}:selection:0`.replace(/^/, "hq_multiaccess:"),
      `${state.run?.runId}:selection:1`.replace(/^/, "hq_multiaccess:")
    ]);

    const runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Agenda");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Economy Operation");
    expect(runnerView.run?.breach?.remainingCount).toBe(2);
  });

  it("does not expose post-V0.97 mechanics while enabling Breach and Multiaccess", () => {
    const state = toRunnerTurn(v097RunGame("v097-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).toContain("multiaccess");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain("virus");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain("prevention");
    expect(DEMO_CARDS_BY_ID.v097_deep_dive_event?.mechanics).not.toContain("replacement");
  });
});

describe("V1.1.2 Full Archives Access", () => {
  it("builds a deterministic mixed Archives queue without revealing facedown entries before access", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-queue"));
    const faceupOperation = moveCorpCardToArchives(state, "simple_economy_operation", true);
    const facedownAsset = moveCorpCardToArchives(state, "simple_economy_asset", false);
    const facedownAgenda = moveCorpCardToArchives(state, "simple_agenda", false);
    keepOnlyCorpArchivesCards(state, [faceupOperation, facedownAsset, facedownAgenda]);

    const runnerBefore = getPlayerView(state, "runner");
    const corpBefore = getPlayerView(state, "corp");

    expect(runnerBefore.opponent.discardCount).toBe(3);
    expect(JSON.stringify(runnerBefore)).toContain("Simple Economy Operation");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Agenda");
    expect(JSON.stringify(corpBefore)).toContain("Simple Economy Asset");
    expect(JSON.stringify(corpBefore)).toContain("Simple Agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "archives");

    expect(state.run?.breach?.queue.map((entry) => entry.cardInstanceId)).toEqual([faceupOperation, facedownAsset, facedownAgenda]);
    expect(state.run?.breach?.queue.map((entry) => entry.hiddenInfo)).toEqual([false, true, true]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Simple Agenda");
  });

  it("reveals only the current Archives card, preserves queue progress, and replays deterministically", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-access"));
    state.runner.credits = 10;
    const faceupOperation = moveCorpCardToArchives(state, "simple_economy_operation", true);
    const facedownAsset = moveCorpCardToArchives(state, "simple_economy_asset", false);
    const facedownAgenda = moveCorpCardToArchives(state, "simple_agenda", false);
    keepOnlyCorpArchivesCards(state, [faceupOperation, facedownAsset, facedownAgenda]);
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "archives");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "Archives"
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Agenda");
    expect(state.run?.breach?.currentIndex).toBe(1);
    expect(state.run?.breach?.accessedSummaries).toEqual([
      { entryId: `${state.run?.runId}.breach.0`, status: "accessed", cardDefinitionId: "simple_economy_operation" }
    ]);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[facedownAsset]?.faceup).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_asset",
      title: "Simple Economy Asset",
      serverLabel: "Archives"
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Agenda");

    state = apply(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(state.corp.archives.filter((id) => id === facedownAsset)).toHaveLength(1);
    expect(state.corp.archives).toEqual([faceupOperation, facedownAsset, facedownAgenda]);
    expect(state.run?.breach?.currentIndex).toBe(2);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[facedownAgenda]?.faceup).toBe(true);
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.scoreArea).toContain(facedownAgenda);
    expect(state.run).toBeUndefined();
    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
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
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.98");
    expect(first.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.98");
    expect(first.runner.credits).toBe(6);
    expect(first.corp.credits).toBe(6);
    expect(first.runner.memoryLimit).toBe(5);
    expect(first.identityAbilityUsage?.corp?.setupAbilities).toEqual(["v098_corp_identity_setup_credit"]);
    expect(first.identityAbilityUsage?.runner?.setupAbilities).toEqual(["v098_runner_identity_setup_credit"]);
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

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");

    expect(state.trace?.runnerLink).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      runnerLink: 1
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Simple Agenda");
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
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).toContain("identity_ability");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain("virus");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain("purge");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain("prevention");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain("replacement");
  });

  it("searches the Runner stack through a private Choice and deterministic shuffle", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-search-stack"));
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    const selectedProgram = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v098_stack_search_event");

    expect(state.pendingChoice?.kind).toBe("select_cards");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "runner").pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Decoder");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: "corp.resolve_choice.game_rule",
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: [`card_${selectedProgram}`] }
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const invalidChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(state, "runner", (action) => action.type === "resolve_choice").actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["card_not_in_choice"] }
    });
    expect(invalidChoice.ok).toBe(false);
    if (!invalidChoice.ok) expect(invalidChoice.error.code).toBe("ERR_INVALID_CHOICE");

    state = applyChoice(state, "runner", `card_${selectedProgram}`);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Decoder");
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok).toBe(true);
  });

  it("arranges top stack cards privately without exposing order to the Corp", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-arrange-stack"));
    moveRunnerCardToGrip(state, "v098_stack_arrange_event");
    const first = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const second = putRunnerCardOnTopOfStack(state, "simple_run_event");
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v098_stack_arrange_event");

    expect(getPlayerView(state, "runner").pendingChoice?.options.map((option) => option.label)).toEqual(["Simple Run Event", "Simple Economy Event"]);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Run Event");

    state = applyChoices(state, "runner", [`card_${first}`, `card_${second}`]);

    expect(state.runner.stack.slice(0, 2)).toEqual([first, second]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Run Event");
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok).toBe(true);
  });

  it("reveals and exposes only deliberate public card information", () => {
    let revealState = toRunnerTurn(v098IdentityGame("v098-reveal-top"));
    moveRunnerCardToGrip(revealState, "v098_reveal_top_event");
    putRunnerCardOnTopOfStack(revealState, "simple_decoder");

    revealState = apply(revealState, "runner", (action) => action.type === "play_event" && sourceDefinition(revealState, action) === "v098_reveal_top_event");

    expect(revealState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(revealState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_decoder",
      title: "Simple Decoder"
    });

    let exposeState = toRunnerTurn(v098IdentityGame("v098-expose"));
    moveRunnerCardToGrip(exposeState, "v098_expose_event");
    const exposed = putCorpRootInRemote(exposeState, "simple_economy_asset");

    exposeState = apply(
      exposeState,
      "runner",
      (action) => action.type === "play_event" && sourceDefinition(exposeState, action) === "v098_expose_event" && action.payload?.serverId === "remote_1"
    );

    expect(exposeState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "expose",
      cardDefinitionId: "simple_economy_asset",
      title: "Simple Economy Asset"
    });
    expect(exposeState.cardInstances[exposed]?.rezzed).toBe(false);
    expect(getPlayerView(exposeState, "runner").servers.find((server) => server.id === "remote_1")?.root[0]?.known).toBe(false);
  });

  it("swaps Corp hidden zones without unrecorded randomness or public title leaks", () => {
    let state = v098IdentityGame("v098-swap-hq-rd");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v098_hq_rd_swap_operation");
    const hqCard = moveCorpCardToHq(state, "simple_economy_asset");
    const rdCard = putCorpCardOnTopOfRd(state, "simple_agenda");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v098_hq_rd_swap_operation");

    expect(state.corp.hq).toContain(rdCard);
    expect(state.corp.rd[0]).toBe(hqCard);
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Simple Agenda");
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok).toBe(true);
  });
});

describe("MVP 0.99 Hosting, Viren, Purge und Counter-Familien", () => {
  it("creates deterministic V0.99 games with additive counter and hosting contracts", () => {
    const first = v099CounterHostingGame("v099-baseline");
    const second = v099CounterHostingGame("v099-baseline");

    expect(first.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.99");
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
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v099_virus_program");
    const virusId = state.runner.rig.programs.find((id) => state.cardInstances[id]?.definitionId === "v099_virus_program");
    expect(virusId).toBeDefined();
    if (!virusId) throw new Error("Missing virus program");
    state.cardInstances[virusId] = { ...state.cardInstances[virusId]!, counters: { ...state.cardInstances[virusId]!.counters, power: 2 } };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    const initial = structuredClone(state);

    const purge = mustAction(state, "corp", (action) => action.type === "purge_virus_counters");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion - 1
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(state, "corp", (action) => action.type === "purge_virus_counters");

    expect(state.corp.clicks).toBe(0);
    expect(state.cardInstances[virusId]?.counters?.virus).toBeUndefined();
    expect(state.cardInstances[virusId]?.counters?.power).toBe(2);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionCostClicks: 3,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 3,
      purgedCounterType: "virus",
      purgedVirusCounters: 1
    });
    expect(state.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).actualFinalStateHash).toBe(hashState(state));
    expect(getLegalActions(state, "corp").map((action) => action.type)).not.toContain("purge_virus_counters");
  });

  it("hosts a Runner program through a private choice and trashes hosted cards with the host", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-hosting"));
    state.runner.credits = 2;
    const hostCandidate = moveRunnerCardToGrip(state, "v099_host_resource");
    const hostedCandidate = moveRunnerCardToGrip(state, "simple_decoder");
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "install_card" && action.source === hostCandidate);

    expect(state.pendingChoice?.source).toContain("v099.host_program");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "runner").pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Decoder");

    state = applyChoice(state, "runner", `card_${hostedCandidate}`);

    expect(state.cardInstances[hostedCandidate]?.hostedOn).toBe(hostCandidate);
    expect(state.runner.rig.programs).toContain(hostedCandidate);
    expect(validateGameState(state).ok).toBe(true);
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok).toBe(true);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;
    state = apply(state, "corp", (action) => action.type === "trash_resource" && action.payload?.resourceId === hostCandidate);

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

    state = apply(state, "runner", (action) => action.type === "install_card" && action.source === chip);
    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(getLegalActions(state, "runner").some((action) => action.type === "install_card" && action.source === virus)).toBe(true);

    state = apply(state, "runner", (action) => action.type === "install_card" && action.source === virus);
    expect(state.runner.credits).toBe(0);
    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBeUndefined();
    expect(state.cardInstances[virus]?.counters?.virus).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase") state = applyChoice(state, "corp", String(state.pendingChoice.options[0]?.id));

    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("creates and spends Bad Publicity credits during a run only", () => {
    let state = v099CounterHostingGame("v099-bad-publicity");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v099_bad_publicity_operation");
    keepOnlyCorpHqCards(state, state.corp.hq.slice(0, 1));
    state.corp.credits = 0;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v099_bad_publicity_operation");
    expect(state.corp.badPublicity).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ badPublicityAfter: 1 });

    state = apply(state, "corp", (action) => action.type === "end_turn");
    installRunnerProgramForTest(state, "simple_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.runner.credits = 0;
    state.corp.credits = 10;
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
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
    expect(replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok).toBe(true);
  });

  it("does not expose M11+ mechanics while enabling V0.99 harness cards", () => {
    const state = toRunnerTurn(v099CounterHostingGame("v099-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain("prevention");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain("replacement");
    expect(DEMO_CARDS_BY_ID.v099_virus_program?.mechanics).not.toContain("set_aside");
    expect(DEMO_CARDS_BY_ID.v099_bad_publicity_operation?.mechanics).not.toContain("remove_from_game");
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
    expect(runnerView.pendingChoice?.options[0]?.label).toBe("Keep private option");
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Keep private option");
    expect(runnerActions.map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(runnerActions.some((action) => action.type === "trigger_ability")).toBe(false);

    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: "choice_v093_runner", selectedOptionIds: ["illegal"] }
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("ERR_INVALID_CHOICE");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: "choice_v093_runner", selectedOptionIds: ["keep"] }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.pendingChoice).toBeUndefined();
    expect(result.event.visibilityClass).toBe("private_to_side");
    expect(JSON.stringify(result.event.publicPayload)).not.toContain("Keep private option");
    expect(JSON.stringify(result.event.publicPayload)).not.toContain("private prompt");
    expect(replayEvents(state, [result.event]).ok).toBe(true);
  });

  it("keeps normal games free of generic V0.93 action types", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "v093-no-visible-new-actions" }));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

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
      { type: "remove_tag", amount: 1 }
    ]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.credits).toBe(state.runner.credits + 2);
    expect(next.runner.tags).toBe(1);
    expect(validateGameState(next).ok).toBe(true);
  });

  it("keeps breaker pump and break public action types while adding ability metadata", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v093-breaker-ability", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    state.corp.credits = 10;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v08_wall_ice");
    const pump = mustAction(state, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(state, action) === "v08_steady_fracter");

    expect(pump.abilityRef).toMatchObject({ sourceCardInstanceId: pump.source });
    expect(pump.effectRef).toMatch(/^effect\./);
    expect(pump.targetRequirements.some((target) => target.id === "encounteredIce" && target.visibility === "public")).toBe(true);

    state = apply(state, "runner", (action) => action.actionId === pump.actionId);
    const breaker = mustAction(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "v08_steady_fracter");

    expect(breaker.abilityRef).toMatchObject({ sourceCardInstanceId: breaker.source });
    expect(breaker.effectRef).toMatch(/^effect\./);
    expect(breaker.type).toBe("break_subroutine");
  });

  it("classifies access as a hidden-info barrier event", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v093-event-classification", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
    putCorpCardOnTopOfRd(state, "v08_project_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    const access = mustAction(state, "runner", (action) => action.type === "access_card");
    expect(eventVisibilityForAction(access)).toBe("hidden_info_barrier");

    state = apply(state, "runner", (action) => action.actionId === access.actionId);
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
      agendaPointsToWin: 7
    });

    expect(legacy.agendaPointsToWin).toBe(7);
    expect(expanded.agendaPointsToWin).toBe(7);
    expect(Object.values(expanded.cardInstances).some((card) => card.definitionId === "simple_setup_hardware")).toBe(true);
    expect(Object.values(expanded.cardInstances).some((card) => card.definitionId === "simple_tag_ice")).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_runner_004, { expectedSide: "runner", allowedDeckIds: ["demo_runner_004"] }).ok).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_004, { expectedSide: "corp", allowedDeckIds: ["demo_corp_004"], minimumAgendaPoints: 7 }).ok).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_004, { expectedSide: "runner" }).ok).toBe(false);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_001, { expectedSide: "corp", minimumAgendaPoints: 7 }).ok).toBe(false);
  });

  it("plays safe batch draw cards and installs hardware for memory", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v04-runner-safe", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "simple_draw_event");
    moveRunnerCardToGrip(state, "simple_setup_hardware");

    const beforeGrip = state.runner.grip.length;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "simple_draw_event");
    expect(state.runner.grip.length).toBe(beforeGrip + 1);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "simple_setup_hardware");
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
    expect(state.runner.rig.hardware.map((id) => state.cardInstances[id]?.definitionId)).toContain("simple_setup_hardware");
  });

  it("rezzes and trashes a simple upgrade without leaking its title before access", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v04-upgrade", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
    state.runner.credits = 10;
    putCorpRootInRemote(state, "simple_upgrade");

    let runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Upgrade");

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "simple_upgrade");
    runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).toContain("Simple Upgrade");

    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(state.corp.archives.map((id) => state.cardInstances[id]?.definitionId)).toContain("simple_upgrade");
  });

  it("applies tags from ICE and lets Runner remove one tag", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v04-tags", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
    putCorpIceOnServer(state, "rd", "simple_tag_ice");
    state.corp.credits = 5;
    state.runner.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
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
    let state = createGameAfterSetup({ seed: "v04-punishment", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_tag_punishment_operation");

    expect(getLegalActions(state, "corp").some((action) => sourceDefinition(state, action) === "simple_tag_punishment_operation")).toBe(false);
    state.runner.tags = 1;
    state.runner.credits = 5;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "simple_tag_punishment_operation");
    expect(state.runner.credits).toBe(3);
  });
});

describe("MVP 0.8 playable starter slice", () => {
  it("creates V0.8 games with explicit starter decks and baseline", () => {
    const state = createGameAfterSetup({
      seed: "v08-starter",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008"
    });

    expect(state.baseline.engineSchemaVersion).toBe("0.8.0");
    expect(state.baseline.cardImplementationVersion).toBe("0.8.0");
    expect(state.agendaPointsToWin).toBe(7);
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe("card-snapshot-0.8");
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.8");
    expect(Object.values(state.cardInstances).some((card) => card.definitionId === "v08_burst_credit_event")).toBe(true);
    expect(Object.values(state.cardInstances).some((card) => card.definitionId === "v08_watchdog_ice")).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_runner_008, { expectedSide: "runner", allowedDeckIds: ["demo_runner_008"] }).ok).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_008, { expectedSide: "corp", allowedDeckIds: ["demo_corp_008"], minimumAgendaPoints: 7 }).ok).toBe(true);
  });

  it("resolves V0.8 runner event and install resolvers", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v08-runner-events", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_burst_credit_event");
    moveRunnerCardToGrip(state, "v08_deep_draw_event");
    moveRunnerCardToGrip(state, "v08_memory_chip");

    const beforeCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v08_burst_credit_event");
    expect(state.runner.credits).toBe(beforeCredits + 5);

    const beforeGrip = state.runner.grip.length;
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v08_deep_draw_event");
    expect(state.runner.grip.length).toBe(beforeGrip + 2);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v08_memory_chip");
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
  });

  it("uses V0.8 run events and breaker definitions through LegalActions", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v08-run-pressure", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_overclock_run_event");
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    putCorpCardOnTopOfRd(state, "v08_credit_surge_operation");
    state.corp.credits = 10;

    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v08_overclock_run_event" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v08_wall_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(state, action) === "v08_steady_fracter");
    state = apply(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "v08_steady_fracter");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const beforeAccessCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.credits).toBe(beforeAccessCredits + 3);
    expect(state.run).toBeUndefined();
  });

  it("resolves V0.8 corp operations, asset rez and agenda scoring", () => {
    let state = createGameAfterSetup({ seed: "v08-corp-economy", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 8;
    moveCorpCardToHq(state, "v08_credit_surge_operation");
    moveCorpCardToHq(state, "v08_archive_planning_operation");
    moveCorpCardToHq(state, "v08_cashout_asset");
    moveCorpCardToHq(state, "v08_project_agenda");

    const beforeCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v08_credit_surge_operation");
    expect(state.corp.credits).toBe(beforeCredits + 6);

    const beforeHq = state.corp.hq.length;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v08_archive_planning_operation");
    expect(state.corp.hq.length).toBe(beforeHq + 2);

    state = apply(state, "corp", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v08_cashout_asset");
    const beforeRezCredits = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v08_cashout_asset");
    expect(state.corp.credits).toBe(beforeRezCredits + 2);

    state = apply(state, "corp", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v08_project_agenda");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "v08_project_agenda");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "v08_project_agenda");
    state = apply(state, "corp", (action) => action.type === "advance_card" && sourceDefinition(state, action) === "v08_project_agenda");
    state = apply(state, "corp", (action) => action.type === "score_agenda" && sourceDefinition(state, action) === "v08_project_agenda");

    expect(agendaPoints(state, "corp")).toBe(2);
  });

  it("keeps V0.8 hidden ICE redacted until rez and applies tag subroutines", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v08-watchdog", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
    putCorpIceOnServer(state, "rd", "v08_watchdog_ice");
    state.corp.credits = 10;
    state.runner.credits = 5;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Watchdog ICE");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v08_watchdog_ice");
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain("Watchdog ICE");
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
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");

    expect(state.imminentEvent).toMatchObject({ eventType: "damage", affectedSide: "runner" });
    expect(state.eventModificationWindow).toMatchObject({ kind: "prevent", side: "runner" });
    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.runner.coreDamage).toBe(0);
    expect(getPlayerView(state, "runner").pendingChoice?.options.map((option) => option.id)).toContain("pass");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Test-only Damage Prevention");
  });

  it("applies full Damage Prevention without creating RandomDrawRecords", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-full",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");
    const preventOption = state.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
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
      preventedAmount: 1
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
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "pass",
      eventModificationOutcome: "original_resolved",
      damageAmount: 1,
      coreDamageAfter: 1
    });
  });

  it("supports partial Damage Prevention and stable StateHash divergence", () => {
    let prevented = onrV1Game("v120-partial-prevent");
    prevented.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 2 } };
    prevented = apply(prevented, "corp", (action) => action.type === "mandatory_draw");
    prevented.runner.tags = 1;
    moveCorpCardToHq(prevented, "onr_v1_302_scorched-earth");
    prevented = apply(prevented, "corp", (action) => action.type === "play_operation" && sourceDefinition(prevented, action) === "onr_v1_302_scorched-earth");
    const preventOption = prevented.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    prevented = applyChoice(prevented, "runner", String(preventOption));

    let passed = onrV1Game("v120-partial-prevent");
    passed.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 2 } };
    passed = apply(passed, "corp", (action) => action.type === "mandatory_draw");
    passed.runner.tags = 1;
    moveCorpCardToHq(passed, "onr_v1_302_scorched-earth");
    passed = apply(passed, "corp", (action) => action.type === "play_operation" && sourceDefinition(passed, action) === "onr_v1_302_scorched-earth");
    passed = applyChoice(passed, "runner", "pass");

    expect(prevented.eventLog.at(-1)?.publicPayload).toMatchObject({ originalAmount: 4, preventedAmount: 2, finalAmount: 2, cardsTrashed: 2 });
    expect(passed.eventLog.at(-1)?.publicPayload).toMatchObject({ damageAmount: 4, cardsTrashed: 4 });
    expect(hashState(prevented)).not.toBe(hashState(passed));
  });

  it("revalidates Event Modification choices through applyAction", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-revalidate",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");
    const legal = mustAction(state, "runner", (action) => action.type === "resolve_choice");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["pass"] }
    });
    const badChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["not-a-candidate"] }
    });

    expect(wrongSide.ok).toBe(false);
    expect(badChoice.ok).toBe(false);
    if (!badChoice.ok) expect(badChoice.error.message).not.toContain("Test-only Damage Prevention");
  });
});

describe("V1.2.1 Replacement Effects", () => {
  it("opens a separate Damage Replacement window with original event context", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-window",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");

    expect(state.replacementWindow).toMatchObject({ eventType: "damage", originalEventId: state.imminentEvent?.eventId });
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ replacementWindowOpened: true, originalEventType: "damage" });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("replaces Damage with a test-only Tag event without applying the original damage", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-apply",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");
    const replaceOption = state.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    state = applyChoice(state, "runner", String(replaceOption));

    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.tags).toBe(1);
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      originalEventType: "damage",
      replacementEventType: "add_tag",
      tagsAdded: 1
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
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.runner.tags).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      damageAmount: 1
    });
  });

  it("blocks ambiguous Replacement conflicts visibly instead of choosing silently", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-conflict",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 }, damageReplacementConflict: true };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const action = mustAction(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Replacement-Konflikt");
      expect(result.error.message).not.toContain("Test-only Damage Replacement");
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
      setAside: { visibility: "side_private", visibilitySide: "runner", reason: "v122_side_private_set_aside", allowReturn: true }
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "move_to_set_aside" && action.payload?.cardId === cardId);

    expect(validateGameState(state).ok).toBe(true);
    expect(state.runner.grip).not.toContain(cardId);
    expect(state.specialZones?.setAside).toEqual([cardId]);
    expect(state.cardInstances[cardId]?.zone).toMatchObject({ side: "special", zone: "set_aside", visibility: "side_private", visibilitySide: "runner" });
    expect(getPlayerView(state, "runner").specialZones?.setAside[0]).toMatchObject({ definitionId: "simple_economy_event", owner: "runner", controller: "runner" });
    expect(getPlayerView(state, "corp").specialZones?.setAside[0]).toMatchObject({ known: false });
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Economy Event");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "move_to_set_aside", specialZone: "set_aside", redactedKind: "special_zone" });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain("Simple Economy Event");
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("supports test-only return from Set Aside without enabling Removed from Game return", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-return-terminal" }));
    const setAsideId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: setAsideId,
      setAside: { visibility: "public", reason: "v122_public_set_aside", allowReturn: true, returnZone: { side: "runner", zone: "grip" } }
    };
    state = apply(state, "runner", (action) => action.type === "move_to_set_aside");
    expect(getLegalActions(state, "runner").some((action) => action.type === "return_from_set_aside")).toBe(true);
    state = apply(state, "runner", (action) => action.type === "return_from_set_aside");
    expect(state.runner.grip).toContain(setAsideId);
    expect(state.specialZones?.setAside).toEqual([]);

    const removedId = moveRunnerCardToGrip(state, "simple_run_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: removedId,
      removedFromGame: { visibility: "hidden", reason: "v122_terminal_removed" }
    };
    state = apply(state, "runner", (action) => action.type === "move_to_removed_from_game");
    expect(state.specialZones?.removedFromGame).toEqual([removedId]);
    expect(state.cardInstances[removedId]?.zone).toMatchObject({ side: "special", zone: "removed_from_game", visibility: "hidden" });
    expect(getLegalActions(state, "runner").some((action) => action.type === "return_from_set_aside")).toBe(false);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Simple Run Event");
  });

  it("changes controller deterministically without changing owner and rejects wrong-side or stale actions", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-control" }));
    const cardId = installRunnerProgramForTest(state, "simple_fracter");
    const beforeHash = hashState(state);
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: { newController: "corp", visibility: "public", reason: "v122_limited_control_change" }
    };
    const action = mustAction(state, "runner", (candidate) => candidate.type === "change_card_control");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion - 1
    });
    expect(wrongSide.ok).toBe(false);
    expect(stale.ok).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (candidate) => candidate.actionId === action.actionId);

    expect(state.cardInstances[cardId]?.owner).toBe("runner");
    expect(state.cardInstances[cardId]?.controller).toBe("corp");
    expect(hashState(state)).not.toBe(beforeHash);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "change_card_control", oldController: "runner", newController: "corp", ownershipChanged: false });
    expect(getPlayerView(state, "runner").own.rig?.find((card) => card.instanceId === cardId)?.controller).toBe("corp");
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps hosted card invariants when a controlled host is trashed", () => {
    let state = installedResourceCorpTurn("v122-host-control-trash");
    const resourceId = state.runner.rig.resources[0]!;
    const hostedId = installRunnerProgramForTest(state, "simple_decoder");
    state.cardInstances[hostedId] = { ...state.cardInstances[hostedId]!, hostedOn: resourceId };
    state.specialZoneHarness = {
      actor: "corp",
      cardInstanceId: resourceId,
      controlChange: { newController: "corp", visibility: "public", reason: "v122_controlled_host" }
    };
    state = apply(state, "corp", (action) => action.type === "change_card_control");
    state = apply(state, "corp", (action) => action.type === "trash_resource" && action.payload?.resourceId === resourceId);

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
  "onr_v1_239_endless-corridor"
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
  "onr_v1_256_mazer"
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
  "onr_v1_295_night-shift"
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
  "onr_v1_306_trojan-horse"
] as const;

const ONR_V1_6_1_FINAL_CARD_IDS = [
  "onr_v1_023_evil-twin",
  "onr_v1_028_force-shield",
  "onr_v1_125_dermatech-bodyplating",
  "onr_v1_229_code-corpse",
  "onr_v1_231_cortical-scrub",
  "onr_v1_254_liche"
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
    { id: "simple_economy_event", quantity: 2 }
  ]
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
    { id: "simple_economy_operation", quantity: 2 }
  ]
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
    { id: "simple_economy_event", quantity: 8 }
  ]
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
    { id: "simple_economy_operation", quantity: 1 }
  ]
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
    { id: "simple_economy_event", quantity: 8 }
  ]
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
    { id: "simple_economy_operation", quantity: 2 }
  ]
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
    { id: "onr_v1_101_mit-west-tier", quantity: 2 }
  ]
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
    { id: "simple_economy_operation", quantity: 3 }
  ]
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
    { id: "simple_economy_event", quantity: 8 }
  ]
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
    { id: "simple_economy_operation", quantity: 3 }
  ]
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
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 }
  ]
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
    { id: "onr_v1_279_wall-of-static", quantity: 1 }
  ]
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
    { id: "simple_killer", quantity: 2 }
  ]
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
    { id: "simple_code_gate_ice", quantity: 2 }
  ]
};

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - Core Damage Harness",
  cards: [...V094_CORP_DECK.cards, { id: "v111_core_damage_operation", quantity: 2 }]
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
    { id: "v095_safehouse_resource", quantity: 2 }
  ]
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
    { id: "simple_code_gate_ice", quantity: 2 }
  ]
};

function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function onrV1Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_RUNNER_DECK,
    corpDeck: ONR_V1_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v105kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
    corpDeck: ONR_V1_0_5K_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v106kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
    corpDeck: ONR_V1_0_6K_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v112kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
    corpDeck: ONR_V1_1_2K_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v123CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_2_3_RUNNER_DECK,
    corpDeck: ONR_V1_2_3_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v161CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_1_RUNNER_DECK,
    corpDeck: ONR_V1_6_1_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v095ResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function v096TraceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_096",
    corpDeckId: "demo_corp_096",
    agendaPointsToWin: 7
  });
}

function v097RunGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_097",
    corpDeckId: "demo_corp_097",
    agendaPointsToWin: 7
  });
}

function v098IdentityGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_098",
    corpDeckId: "demo_corp_098",
    agendaPointsToWin: 7
  });
}

function v099CounterHostingGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_099",
    corpDeckId: "demo_corp_099",
    agendaPointsToWin: 7
  });
}

function installedResourceCorpTurn(seed: string): GameState {
  let state = toRunnerTurn(v095ResourceGame(seed));
  state.runner.credits = 6;
  moveRunnerCardToGrip(state, "v095_safehouse_resource");
  state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "v095_safehouse_resource");
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.runner.tags = 1;
  return state;
}

function apply(state: GameState, side: Side, predicate: (action: LegalAction) => boolean): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyChoice(state: GameState, side: Side, selectedOptionId: string): GameState {
  return applyChoices(state, side, [selectedOptionId]);
}

function applyChoices(state: GameState, side: Side, selectedOptionIds: string[]): GameState {
  const selected = mustAction(state, side, (action) => action.type === "resolve_choice");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function mustAction(state: GameState, side: Side, predicate: (action: LegalAction) => boolean): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  expect(selected, `Missing action for ${side}. Legal: ${legalActions.map((action) => `${action.type}:${action.label}`).join(", ")}`).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (next.pendingChoice?.source === "discard_phase" && next.pendingChoice.side === "corp") {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

function toRunnerTurnFromCorpMain(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "end_turn");
  if (next.pendingChoice?.source === "discard_phase" && next.pendingChoice.side === "corp") {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

function sourceDefinition(state: GameState, action: LegalAction): string | undefined {
  if (typeof action.source !== "string" || action.source === "basic_action" || action.source === "game_rule") return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  return ids.reduce((sum, id) => sum + (DEMO_CARDS_BY_ID[state.cardInstances[id]?.definitionId ?? ""]?.agendaPoints ?? 0), 0);
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
      { id: "ship", label: "Ship private option" }
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side"
  };
}

function moveRunnerCardToGrip(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  return id;
}

function moveRunnerCardCopyToGrip(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id) &&
      !state.runner.rig.hardware.includes(id) &&
      !state.runner.rig.resources.includes(id) &&
      !state.runner.scoreArea.includes(id)
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  return id;
}

function putRunnerCardOnTopOfStack(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "stack" }, faceup: true, rezzed: true };
  return id;
}

function drawRunnerCardsForTest(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) {
    const id = state.runner.stack.shift();
    expect(id).toBeDefined();
    if (!id) throw new Error("Missing runner stack card");
    state.runner.grip.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  }
}

function moveCorpCardToHq(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "hq" }, faceup: false, rezzed: false };
  return id;
}

function moveCorpCardToArchives(state: GameState, definitionId: string, faceup = true): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "archives" }, faceup, rezzed: faceup };
  return id;
}

function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  const movedToRd = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.hq = [id];
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = { ...state.cardInstances[cardId]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  }
}

function keepOnlyCorpHqCards(state: GameState, ids: CardInstanceId[]): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.hq.filter((cardId) => !keep.has(cardId));
  state.corp.hq = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = { ...state.cardInstances[cardId]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  }
}

function keepOnlyCorpArchivesCards(state: GameState, ids: CardInstanceId[]): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = { ...state.cardInstances[cardId]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  }
}

function putCorpCardOnTopOfRd(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  return id;
}

function putCorpIceOnServer(state: GameState, serverId: "hq" | "rd" | "archives" | `remote_${number}`, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "serverIce", serverId }, faceup: false, rezzed: false };
  return id;
}

function putCorpRootInRemote(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find((candidate) => candidate.id === "remote_1");
  if (!server) {
    server = { id: "remote_1", kind: "remote", label: "Remote 1", ice: [], root: [] };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" }, faceup: false, rezzed: false };
  return id;
}

function installRunnerProgramForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "rig" }, faceup: true, rezzed: true };
  return id;
}

function installRunnerProgramCopyForTest(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) => card.definitionId === definitionId && !state.runner.rig.programs.includes(id)
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "rig" }, faceup: true, rezzed: true };
  return id;
}

function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "heap" }, faceup: true, rezzed: true };
  }
}

function scoreTwoAgendasForTest(state: GameState): void {
  for (let index = 0; index < 2; index += 1) {
    const entry = Object.entries(state.cardInstances).find(([id, card]) => card.definitionId === "simple_agenda" && !state.corp.scoreArea.includes(id));
    expect(entry).toBeDefined();
    if (!entry) throw new Error("Missing agenda");
    const id = entry[0];
    removeEverywhere(state, id);
    state.corp.scoreArea.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "scoreArea" }, faceup: true, rezzed: true };
  }
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entries = Object.entries(state.cardInstances).filter(([, card]) => card.definitionId === definitionId);
  const entry =
    entries.find(([id]) => !state.corp.scoreArea.includes(id) && !state.runner.scoreArea.includes(id)) ??
    entries[0];
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
  state.runner.scoreArea = state.runner.scoreArea.filter((cardId) => cardId !== id);
  state.runner.rig.programs = state.runner.rig.programs.filter((cardId) => cardId !== id);
  state.runner.rig.hardware = state.runner.rig.hardware.filter((cardId) => cardId !== id);
  state.runner.rig.resources = state.runner.rig.resources.filter((cardId) => cardId !== id);
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter((cardId) => cardId !== id);
    state.specialZones.removedFromGame = state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
