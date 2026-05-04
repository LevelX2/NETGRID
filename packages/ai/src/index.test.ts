import { describe, expect, it } from "vitest";
import { applyAction, applyEffectCommands, createGame, getLegalActions, getPlayerView, replayEvents } from "@netrunner/engine";
import {
  assertAiInputIsSideSafe,
  buildObservedFacts,
  buildAiDecisionInput,
  chooseAiAction,
  chooseCorpAction,
  chooseRunnerAction,
  simulateAiGame,
  simulateAiSoak
} from "./index";
import type { CardInstanceId, ChoiceRequest, DeckDefinition, GameState, LegalAction, Side } from "@netrunner/shared";

describe("MVP 0.3 AI controller contract", () => {
  it("builds side-neutral AI inputs without FullState or forbidden transport fields", () => {
    const state = createGame({ seed: "ai-contract" });
    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "normal" });

    expect(corpInput.side).toBe("corp");
    expect(runnerInput.side).toBe("runner");
    expect(corpInput.legalActions).toEqual(getLegalActions(state, "corp"));
    expect(runnerInput.playerView).toEqual(getPlayerView(state, "runner"));
    expect(JSON.stringify(corpInput)).not.toContain("cardInstances");
    expect(JSON.stringify(corpInput)).not.toContain("sessionToken");
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("keeps decisions deterministic and always chooses legal action ids", () => {
    const state = createGame({ seed: "ai-deterministic" });
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });

    const first = chooseAiAction(input);
    const second = chooseAiAction(input);

    expect(first).toEqual(second);
    expect(input.legalActions.some((action) => action.actionId === first.actionId)).toBe(true);
    expect(first.reasonCode).toBe("corp.mandatory_draw");
    expect(first.explanation).not.toContain("Simple Fracter");
  });

  it("uses deterministic fallback when no heuristic matches", () => {
    const state = createGame({ seed: "ai-fallback" });
    const input = buildAiDecisionInput(state, "corp");
    const fallbackOnly = { ...input, legalActions: [{ ...input.legalActions[0]!, type: "play_event" as const, actionId: "z.event" }] };

    const decision = chooseCorpAction(fallbackOnly);

    expect(decision.actionId).toBe("z.event");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
  });

  it("keeps V0.93 pending choices inside the side-safe LegalActions contract", () => {
    const state = toRunnerTurn(createGame({ seed: "ai-v093-choice" }));
    state.pendingChoice = choiceRequest(state, "runner");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(input.legalActions.map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(decision.actionId).toBe(input.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({ choiceId: "choice_v093_runner", selectedOptionIds: ["keep"] });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("cardInstances");
  });

  it("keeps V0.94 Damage board states side-safe for AI input", () => {
    const state = applyEffectCommands(v094DamageGame("ai-v094-damage"), [{ type: "do_damage", damageType: "meat", amount: 2, source: "ai_v094_smoke" }]);
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const serialized = JSON.stringify(input);

    expect(input.playerView.opponent.discardCount).toBe(2);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("keeps V0.95 Resource trash decisions LegalActions-only and side-safe", () => {
    const state = installedResourceCorpTurn("ai-v095-resource");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const selected = input.legalActions.find((action) => action.actionId === decision.actionId);
    const serialized = JSON.stringify(input);

    expect(input.legalActions.some((action) => action.type === "trash_resource")).toBe(true);
    expect(selected?.type).toBe("trash_resource");
    expect(decision.reasonCode).toBe("corp.tag.trash_visible_resource");
    expect(input.playerView.opponent.rig?.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("chooses V0.96 Trace bids from side-safe PlayerView choices", () => {
    let state = traceCorpBidState("ai-v096-trace");
    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const corpDecision = chooseCorpAction(corpInput);

    expect(corpDecision.actionId).toBe(corpInput.legalActions[0]?.actionId);
    expect(corpDecision.reasonCode).toBe("corp.trace.bid_visible_amount");
    expect(corpDecision.selectedChoices).toEqual({ choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);

    const corpResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: corpDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(corpDecision.selectedChoices ? { selectedChoices: corpDecision.selectedChoices } : {})
    });
    expect(corpResult.ok).toBe(true);
    if (!corpResult.ok) throw new Error(corpResult.error.message);
    state = corpResult.state;

    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "hard" });
    const runnerDecision = chooseRunnerAction(runnerInput);
    expect(runnerDecision.reasonCode).toBe("runner.trace.bid_visible_amount");
    expect(runnerDecision.selectedChoices).toEqual({ choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["bid_3"] });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toContain("cardInstances");
    expect(JSON.stringify(runnerInput)).not.toContain("Simple Agenda");
  });

  it("keeps V0.97 breach queues hidden and chooses access from LegalActions", () => {
    let state = toRunnerTurn(
      createGame({
        seed: "ai-v097-breach",
        runnerDeckId: "demo_runner_097",
        corpDeckId: "demo_corp_097",
        agendaPointsToWin: 7
      })
    );
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v097_deep_dive_event" && action.payload?.serverId === "rd");

    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const decision = chooseRunnerAction(input);
    const serialized = JSON.stringify(input);

    expect(input.playerView.run?.breach?.remainingCount).toBe(2);
    expect(input.legalActions.find((action) => action.actionId === decision.actionId)?.type).toBe("access_card");
    expect(decision.reasonCode).toBe("runner.access.open_card");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Economy Operation");
  });
});

describe("MVP 0.3 Runner AI", () => {
  it("prioritizes accessing and stealing a visible agenda", () => {
    let state = toRunnerTurn(createGame({ seed: "ai-runner-steal" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const decision = chooseRunnerAction(input);

    expect(input.legalActions.find((action) => action.actionId === decision.actionId)?.type).toBe("steal_agenda");
    expect(decision.explanation).not.toContain("corp_simple_agenda");
  });

  it("distinguishes easy and normal pressure choices", () => {
    const state = toRunnerTurn(createGame({ seed: "ai-runner-difficulty" }));
    const input = buildAiDecisionInput(state, "runner", { difficulty: "easy" });
    const gain = input.legalActions.find((action) => action.type === "gain_credit");
    const run = input.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "rd");
    expect(gain).toBeDefined();
    expect(run).toBeDefined();
    if (!gain || !run) throw new Error("Missing fixture actions");

    const easy = chooseRunnerAction({ ...input, difficulty: "easy", legalActions: [gain, run] });
    const normal = chooseRunnerAction({ ...input, difficulty: "normal", legalActions: [gain, run] });

    expect(easy.actionId).toBe(gain.actionId);
    expect(normal.actionId).toBe(run.actionId);
  });

  it("prioritizes removing public tags when legal", () => {
    const state = toRunnerTurn(createGame({ seed: "ai-remove-tag" }));
    state.runner.tags = 1;
    state.runner.credits = 2;
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });

    const decision = chooseRunnerAction(input);

    expect(input.legalActions.find((action) => action.actionId === decision.actionId)?.type).toBe("remove_tag");
    expect(decision.explanation).not.toContain("Simple Tag Punishment Operation");
  });
});

describe("MVP 0.3 Corp AI v2", () => {
  it("prioritizes scoring an advanced remote agenda", () => {
    let state = createGame({ seed: "ai-corp-score" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 3;
    putCorpRootInRemote(state, "simple_agenda", 3);

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);

    expect(input.legalActions.find((action) => action.actionId === decision.actionId)?.type).toBe("score_agenda");
    expect(decision.reasonCode).toBe("corp.score_available_agenda");
  });
});

describe("MVP 0.3 AI simulation harness", () => {
  it("runs deterministic AI-vs-AI simulations and replays the event log", () => {
    const first = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });
    const second = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });

    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);
    expect(first.errors).toEqual([]);
    expect(first.replayOk).toBe(true);
    expect(first.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(first)).not.toContain("cardInstances");
    expect(JSON.stringify(first)).not.toContain("sessionToken");
  });

  it("keeps a replayable long smoke run through public AI actions", () => {
    let state = createGame({ seed: "ai-long-smoke" });
    const initial = structuredClone(state);
    for (let step = 0; step < 60 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      const decision = chooseAiAction(input);
      const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId);
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
        idempotencyKey: `ai-smoke-${step}`
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }
    expect(replayEvents(initial, state.eventLog).ok).toBe(true);
  });

  it("runs V0.4 expanded decks through the simulation harness", () => {
    const summary = simulateAiGame({
      seed: "ai-v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
      maxActions: 140
    });

    expect(summary.cardPoolVersion).toBe("0.4.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("runs V0.8 starter decks through side-safe AI smokes", () => {
    const summaries = ["ai-v08-starter-a", "ai-v08-starter-b", "ai-v08-starter-c"].map((seed) =>
      simulateAiGame({
        seed,
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
        agendaPointsToWin: 7,
        maxActions: 180
      })
    );

    for (const summary of summaries) {
      expect(summary.cardPoolVersion).toBe("0.8.0");
      expect(summary.errors).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(summary.finalStateHash).toMatch(/^fnv1a:/);
      expect(summary.actionSequence.every((entry) => entry.reasonCode.length > 0)).toBe(true);
      expect(JSON.stringify(summary)).not.toContain("cardInstances");
      expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
    }
  });

  it("runs V0.97 Run/Breach decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v097-run-breach",
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
      agendaPointsToWin: 7,
      maxActions: 180
    });

    expect(summary.cardPoolVersion).toBe("0.97.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
  });
});

describe("MVP 0.9 stronger AI", () => {
  it("adds side-safe evidence and quality metrics to V0.8 simulations", () => {
    const summary = simulateAiGame({
      seed: "ai-v09-metrics",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
      runnerDifficulty: "hard",
      corpDifficulty: "hard",
      maxActions: 160
    });

    expect(summary.cardPoolVersion).toBe("0.8.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.metrics.timeoutRate).toBe(0);
    expect(summary.metrics.reasonCodeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(summary.metrics.actionTypeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(summary.actionSequence.every((entry) => entry.confidence >= 0 && entry.evidence.length > 0)).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
    expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
  });

  it("keeps hidden-state variants from changing visible decisions", () => {
    const state = toRunnerTurn(createGame({ seed: "ai-v09-hidden", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008", agendaPointsToWin: 7 }));
    const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", profileId: "runner-ai-v0.9-hard" });
    const variant = {
      ...input,
      eventTail: input.eventTail.map((event) => ({ ...event, stateHashAfter: "fnv1a:hiddenvariant" }))
    };

    expect(chooseRunnerAction(variant)).toEqual(chooseRunnerAction(input));
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("reconstructs observed facts without private decklists", () => {
    const state = createGame({ seed: "ai-v09-observed", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008", agendaPointsToWin: 7 });
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal", profileId: "corp-ai-v0.9-normal" });
    const facts = buildObservedFacts(input);

    expect(facts.publicServers).toContain("rd");
    expect(facts.agendaPoints.own).toBe(0);
    expect(JSON.stringify(facts)).not.toContain("cardInstances");
    expect(JSON.stringify(facts)).not.toContain("v08_burst_credit_event");
  });

  it("runs the V0.9 soak matrix with holdout accounting", () => {
    const soak = simulateAiSoak({ maxActions: 60 });

    expect(soak.aggregate.seeds).toBe(27);
    expect(soak.aggregate.illegalActions).toBe(0);
    expect(soak.aggregate.replayFailures).toBe(0);
    expect(soak.aggregate.timeoutRate).toBe(0);
    expect(soak.aggregate.reasonCodeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(soak.aggregate.holdoutSeeds).toEqual(["ai-v09-holdout-001", "ai-v09-holdout-002", "ai-v09-holdout-003"]);
    expect(JSON.stringify(soak)).not.toContain("cardInstances");
  });
});

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - AI Damage Harness",
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
  name: "Corp Demo Deck 0.94 - AI Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 }
  ]
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - AI Resource Harness",
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
  name: "Corp Demo Deck 0.95 - AI Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 }
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

function v095ResourceGame(seed: string): GameState {
  return createGame({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
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

function traceCorpBidState(seed: string): GameState {
  let state = toRunnerTurn(
    createGame({
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7
    })
  );
  putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
  state.corp.credits = 8;
  state.runner.credits = 5;
  state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
  state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "v096_trace_probe_ice");
  return apply(state, "runner", (action) => action.type === "continue_run");
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
  expect(selected, `Legal: ${legalActions.map((action) => `${action.type}:${action.label}`).join(", ")}`).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  return next;
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

function moveRunnerCardToGrip(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  return id;
}

function sourceDefinition(state: GameState, action: LegalAction): string | undefined {
  if (typeof action.source !== "string" || action.source === "basic_action" || action.source === "game_rule") return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "ai_v093_choice",
    prompt: "AI private choice",
    kind: "select_option",
    options: [{ id: "keep", label: "Keep option" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side"
  };
}

function putCorpRootInRemote(state: GameState, definitionId: string, advancementCounters: number): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find((candidate) => candidate.id === "remote_1");
  if (!server) {
    server = { id: "remote_1", kind: "remote", label: "Remote 1", ice: [], root: [] };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
    advancementCounters
  };
  return id;
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(([, card]) => card.definitionId === definitionId);
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
}
