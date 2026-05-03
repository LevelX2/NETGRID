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
import type { CardInstanceId, ChoiceRequest, GameState, LegalAction, Side } from "@netrunner/shared";

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
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
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
