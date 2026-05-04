import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
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
import type { CardInstanceId, ChoiceRequest, DeckDefinition, GameState, LegalAction, Side } from "@netrunner/shared";

describe("MVP 0.1 engine foundation", () => {
  it("creates deterministic games for the same seed", () => {
    const first = createGame({ seed: "deterministic" });
    const second = createGame({ seed: "deterministic" });

    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);
  });

  it("rejects stale and wrong-side player actions", () => {
    let state = createGame({ seed: "validation" });
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
    let state = toRunnerTurn(createGame({ seed: "runner-cards" }));
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
    let state = createGame({ seed: "corp-operation" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_economy_operation");
    const before = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "simple_economy_operation");
    expect(state.corp.credits).toBe(before + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "play_operation", cardDefinitionId: "simple_economy_operation", title: "Simple Economy Operation" });
    expect(state.corp.archives.map((id) => state.cardInstances[id]?.definitionId)).toContain("simple_economy_operation");
  });
});

describe("MVP 0.1 runs, access and scoring", () => {
  it("lets the Runner steal the top R&D agenda", () => {
    let state = toRunnerTurn(createGame({ seed: "steal-rd" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_agenda", title: "Simple Agenda", serverLabel: "R&D" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
    expect(getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload.actionType).toBe("steal_agenda");
  });

  it("reveals the randomly accessed HQ card in the access event", () => {
    let state = toRunnerTurn(createGame({ seed: "access-hq" }));
    const accessedId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "hq");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation", title: "Simple Economy Operation", serverLabel: "HQ" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
  });

  it("shows a card trashed from HQ in Runner-visible Archives", () => {
    let state = toRunnerTurn(createGame({ seed: "trash-hq-asset" }));
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

  it("lets the Runner break Barrier ICE and access R&D", () => {
    let state = toRunnerTurn(createGame({ seed: "break-barrier" }));
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "simple_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    state = apply(state, "runner", (action) => action.type === "break_subroutine");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_economy_operation", title: "Simple Economy Operation", serverLabel: "R&D" });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
  });

  it("ends the run on an unbroken End the Run subroutine", () => {
    let state = toRunnerTurn(createGame({ seed: "etr" }));
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

  it("lets the Corp score the third Simple Agenda and win at six agenda points", () => {
    let state = createGame({ seed: "corp-score", agendaPointsToWin: 6 });
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
    let state = toRunnerTurn(createGame({ seed: "visibility" }));
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
    let state = createGame({ seed: "replay" });
    const initial = structuredClone(state);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "gain_credit");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = apply(state, "runner", (action) => action.type === "gain_credit");

    const replay = replayEvents(initial, state.eventLog);
    expect(replay.errors, replay.errors.join("\n")).toEqual([]);
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

  it("supports meat damage through the V0.94 EffectCommand path and rejects core damage", () => {
    const state = v094DamageGame("v094-meat-effect");
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [{ type: "do_damage", damageType: "meat", amount: 2, source: "v094_test_meat" }]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.heap.length).toBe(2);
    expect(next.runner.grip.length).toBe(state.runner.grip.length - 2);
    expect(next.randomDrawRecords.slice(-2).every((record) => record.purpose.includes("damage:"))).toBe(true);
    expect(new Set(next.runner.heap).size).toBe(2);
    expect(() => applyEffectCommands(state, [{ type: "do_damage", damageType: "core", amount: 1, source: "v094_test_core" }])).toThrow("Core Damage");
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
    expect(replay.errors, replay.errors.join("\n")).toEqual([]);
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
    let state = createGame({ seed: "onr-v1-corp-operations", runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
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
      let damageState = createGame({ seed: `onr-v1-${definitionId}`, runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
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

    let scoringState = createGame({ seed: "onr-v1-tycho-score", runnerDeck: ONR_V1_RUNNER_DECK, corpDeck: ONR_V1_CORP_DECK, agendaPointsToWin: 7 });
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

describe("MVP 0.93 M1 effect, ability and choice foundation", () => {
  it("exposes pendingChoice only to the owning side and resolves it through LegalActions", () => {
    const state = toRunnerTurn(createGame({ seed: "v093-choice" }));
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
    const state = toRunnerTurn(createGame({ seed: "v093-no-visible-new-actions" }));
    const actionTypes = getLegalActions(state, "runner").map((action) => action.type);

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
  });

  it("runs basic effect commands without mutating the original state", () => {
    const state = createGame({ seed: "v093-effects" });
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
    let state = toRunnerTurn(createGame({ seed: "v093-breaker-ability", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
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
    let state = toRunnerTurn(createGame({ seed: "v093-event-classification", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
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
  it("creates V0.4 games with explicit expanded demo decks without changing legacy defaults", () => {
    const legacy = createGame({ seed: "legacy-default" });
    const expanded = createGame({
      seed: "v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7
    });

    expect(legacy.agendaPointsToWin).toBe(6);
    expect(expanded.agendaPointsToWin).toBe(7);
    expect(Object.values(expanded.cardInstances).some((card) => card.definitionId === "simple_setup_hardware")).toBe(true);
    expect(Object.values(expanded.cardInstances).some((card) => card.definitionId === "simple_tag_ice")).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_runner_004, { expectedSide: "runner", allowedDeckIds: ["demo_runner_004"] }).ok).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_004, { expectedSide: "corp", allowedDeckIds: ["demo_corp_004"], minimumAgendaPoints: 7 }).ok).toBe(true);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_004, { expectedSide: "runner" }).ok).toBe(false);
    expect(validateDeckDefinition(DEMO_DECKS.demo_corp_001, { expectedSide: "corp", minimumAgendaPoints: 7 }).ok).toBe(false);
  });

  it("plays safe batch draw cards and installs hardware for memory", () => {
    let state = toRunnerTurn(createGame({ seed: "v04-runner-safe", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
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
    let state = toRunnerTurn(createGame({ seed: "v04-upgrade", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
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
    let state = toRunnerTurn(createGame({ seed: "v04-tags", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" }));
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
    let state = createGame({ seed: "v04-punishment", runnerDeckId: "demo_runner_004", corpDeckId: "demo_corp_004" });
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
    const state = createGame({
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
    let state = toRunnerTurn(createGame({ seed: "v08-runner-events", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
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
    let state = toRunnerTurn(createGame({ seed: "v08-run-pressure", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
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
    let state = createGame({ seed: "v08-corp-economy", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" });
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
    let state = toRunnerTurn(createGame({ seed: "v08-watchdog", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008" }));
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

function v094DamageGame(seed: string): GameState {
  return createGame({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7
  });
}

function onrV1Game(seed: string): GameState {
  return createGame({
    seed,
    runnerDeck: ONR_V1_RUNNER_DECK,
    corpDeck: ONR_V1_CORP_DECK,
    agendaPointsToWin: 7
  });
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
  return next;
}

function toRunnerTurnFromCorpMain(state: GameState): GameState {
  return apply(state, "corp", (action) => action.type === "end_turn");
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

function moveCorpCardToHq(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "hq" }, faceup: false, rezzed: false };
  return id;
}

function moveCorpCardToArchives(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "archives" }, faceup: true, rezzed: true };
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
}
