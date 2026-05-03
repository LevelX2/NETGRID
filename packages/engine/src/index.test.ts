import { describe, expect, it } from "vitest";
import {
  applyAction,
  checkWinConditions,
  createGame,
  DEMO_DECKS,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateDeckDefinition,
  validateGameState
} from "./index";
import type { CardInstanceId, GameState, LegalAction, Side } from "@netrunner/shared";

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
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
    expect(getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload.actionType).toBe("steal_agenda");
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
  return ids.reduce((sum, id) => sum + (state.cardInstances[id]?.definitionId === "simple_agenda" ? 2 : 0), 0);
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
