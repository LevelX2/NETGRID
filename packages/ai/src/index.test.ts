import { describe, expect, it } from "vitest";
import { applyAction, applyEffectCommands, createGameAfterSetup, getLegalActions, getPlayerView, replayEvents } from "@netrunner/engine";
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
    const state = createGameAfterSetup({ seed: "ai-contract" });
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
    const state = createGameAfterSetup({ seed: "ai-deterministic" });
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });

    const first = chooseAiAction(input);
    const second = chooseAiAction(input);

    expect(first).toEqual(second);
    expect(input.legalActions.some((action) => action.actionId === first.actionId)).toBe(true);
    expect(first.reasonCode).toBe("corp.mandatory_draw");
    expect(first.explanation).not.toContain("Simple Fracter");
  });

  it("uses deterministic fallback when no heuristic matches", () => {
    const state = createGameAfterSetup({ seed: "ai-fallback" });
    const input = buildAiDecisionInput(state, "corp");
    const fallbackOnly = { ...input, legalActions: [{ ...input.legalActions[0]!, type: "play_event" as const, actionId: "z.event" }] };

    const decision = chooseCorpAction(fallbackOnly);

    expect(decision.actionId).toBe("z.event");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
  });

  it("keeps V0.93 pending choices inside the side-safe LegalActions contract", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v093-choice" }));
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

  it("resolves V1.1.1 Discard choices deterministically from PlayerView and LegalActions", () => {
    let state = createGameAfterSetup({ seed: "ai-v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const sortedFirst = input.playerView.pendingChoice?.options.slice().sort((left, right) => left.label.localeCompare(right.label, "de") || left.id.localeCompare(right.id))[0]?.id;
    const serializedRunner = JSON.stringify(buildAiDecisionInput(state, "runner", { difficulty: "normal" }));

    expect(input.playerView.pendingChoice?.source).toBe("discard_phase");
    expect(input.legalActions.map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(decision.selectedChoices).toEqual({ choiceId: state.pendingChoice?.choiceId, selectedOptionIds: [sortedFirst] });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serializedRunner).not.toContain(input.playerView.pendingChoice?.options[0]?.label ?? "not-present");
    expect(serializedRunner).not.toContain("cardInstances");
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
      createGameAfterSetup({
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

  it("keeps V0.98 hidden-zone choices side-safe for AI inputs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v098-hidden-zone",
        runnerDeckId: "demo_runner_098",
        corpDeckId: "demo_corp_098",
        agendaPointsToWin: 7
      })
    );
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    putRunnerCardOnTopOfStack(state, "simple_decoder");
    state = apply(state, "runner", (action) => action.type === "play_event" && sourceDefinition(state, action) === "v098_stack_search_event");

    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const corpSerialized = JSON.stringify(corpInput);

    expect(runnerInput.playerView.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(runnerInput.legalActions.find((action) => action.actionId === runnerDecision.actionId)?.type).toBe("resolve_choice");
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(corpSerialized).not.toContain("Simple Decoder");
    expect(corpSerialized).not.toContain("cardInstances");
  });

  it("keeps V0.99 hosting choices side-safe and lets Corp AI choose legal Purge", () => {
    let hostingState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-hosting",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7
      })
    );
    moveRunnerCardToGrip(hostingState, "v099_host_resource");
    moveRunnerCardToGrip(hostingState, "simple_decoder");
    hostingState = apply(hostingState, "runner", (action) => action.type === "install_card" && sourceDefinition(hostingState, action) === "v099_host_resource");

    const runnerInput = buildAiDecisionInput(hostingState, "runner", { difficulty: "normal" });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(hostingState, "corp", { difficulty: "normal" });

    expect(runnerInput.playerView.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(runnerInput.legalActions.find((action) => action.actionId === runnerDecision.actionId)?.type).toBe("resolve_choice");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(JSON.stringify(corpInput)).not.toContain("Simple Decoder");

    let purgeState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-purge",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7
      })
    );
    purgeState.runner.credits = 3;
    moveRunnerCardToGrip(purgeState, "v099_virus_program");
    purgeState = apply(purgeState, "runner", (action) => action.type === "install_card" && sourceDefinition(purgeState, action) === "v099_virus_program");
    purgeState.activeSide = "corp";
    purgeState.phase = "corp_action_phase";
    purgeState.timingPoint = "corp_action.main";
    purgeState.corp.clicks = 3;

    const purgeInput = buildAiDecisionInput(purgeState, "corp", { difficulty: "normal" });
    const purgeDecision = chooseCorpAction(purgeInput);
    expect(purgeInput.legalActions.find((action) => action.actionId === purgeDecision.actionId)?.type).toBe("purge_virus_counters");
    expect(purgeDecision.reasonCode).toBe("corp.purge.visible_virus_counters");
    expect(assertAiInputIsSideSafe(purgeInput)).toBe(true);
  });
});

describe("MVP 0.3 Runner AI", () => {
  it("prioritizes accessing and stealing a visible agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-steal" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const decision = chooseRunnerAction(input);

    expect(input.legalActions.find((action) => action.actionId === decision.actionId)?.type).toBe("steal_agenda");
    expect(decision.explanation).not.toContain("corp_simple_agenda");
  });

  it("distinguishes easy and normal pressure choices", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-difficulty" }));
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

  it("uses public remote root and ICE counts before choosing run targets", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-empty-remote" }));
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const emptyRemoteRun = input.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    const rdRun = input.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "rd");
    expect(emptyRemoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!emptyRemoteRun || !rdRun) throw new Error("Missing run fixture actions");

    const emptyOnly = chooseRunnerAction({ ...input, legalActions: [emptyRemoteRun] });
    const betterTarget = chooseRunnerAction({ ...input, legalActions: [emptyRemoteRun, rdRun] });

    expect(emptyOnly.reasonCode).toBe("runner.run.empty_remote_low_value");
    expect(emptyOnly.evidence).toContain("ice_count:1");
    expect(emptyOnly.evidence).toContain("root_count:0");
    expect(betterTarget.actionId).toBe(rdRun.actionId);
  });

  it("treats multiple remote root cards as public pressure without learning identities", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-remote-counts" }));
    putCorpRootInRemote(state, "simple_agenda", 0);
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const remoteRun = input.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    expect(remoteRun).toBeDefined();
    if (!remoteRun) throw new Error("Missing remote run fixture action");

    const decision = chooseRunnerAction({ ...input, legalActions: [remoteRun] });
    const serializedDecision = JSON.stringify(decision);

    expect(decision.reasonCode).toBe("runner.run.visible_pressure");
    expect(decision.evidence).toContain("root_count:2");
    expect(serializedDecision).not.toContain("Simple Agenda");
    expect(serializedDecision).not.toContain("Simple Economy Asset");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("backs off from a visibly blocked rezzed ICE run when setup alternatives exist", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-rezzed-ice-loop" }));
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const blockedRun = input.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "rd");
    const gain = input.legalActions.find((action) => action.type === "gain_credit");
    expect(blockedRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!blockedRun || !gain) throw new Error("Missing fixture actions");

    const decision = chooseRunnerAction({ ...input, legalActions: [blockedRun, gain] });

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.economy.basic_credit");
  });

  it("prioritizes removing public tags when legal", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-remove-tag" }));
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
    let state = createGameAfterSetup({ seed: "ai-corp-score" });
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
    let state = createGameAfterSetup({ seed: "ai-long-smoke" });
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

  it("keeps V1.1.2K local O:NR release cards inside side-safe AI LegalAction smokes", () => {
    let state = createGameAfterSetup({
      seed: "ai-v112k-card-release",
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7
    });
    const initial = structuredClone(state);

    for (let step = 0; step < 50 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      expect(assertAiInputIsSideSafe(input)).toBe(true);
      expect(JSON.stringify(input)).not.toContain("cardInstances");
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
        idempotencyKey: `ai-v112k-${step}`
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

  it("runs V0.98 Identity decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v098-identity",
      runnerDeckId: "demo_runner_098",
      corpDeckId: "demo_corp_098",
      agendaPointsToWin: 7,
      maxActions: 180
    });

    expect(summary.cardPoolVersion).toBe("0.98.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
  });

  it("runs V0.99 Counter/Hosting decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v099-counter-hosting",
      runnerDeckId: "demo_runner_099",
      corpDeckId: "demo_corp_099",
      agendaPointsToWin: 7,
      maxActions: 200
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
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
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v09-hidden", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008", agendaPointsToWin: 7 }));
    const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", profileId: "runner-ai-v0.9-hard" });
    const variant = {
      ...input,
      eventTail: input.eventTail.map((event) => ({ ...event, stateHashAfter: "fnv1a:hiddenvariant" }))
    };

    expect(chooseRunnerAction(variant)).toEqual(chooseRunnerAction(input));
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("reconstructs observed facts without private decklists", () => {
    const state = createGameAfterSetup({ seed: "ai-v09-observed", runnerDeckId: "demo_runner_008", corpDeckId: "demo_corp_008", agendaPointsToWin: 7 });
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

const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v112k_runner",
  name: "AI O:NR V1.1.2K Runner",
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
    { id: "simple_economy_event", quantity: 6 }
  ]
};

const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v112k_corp",
  name: "AI O:NR V1.1.2K Corp",
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

function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
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
    createGameAfterSetup({
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
  if (next.pendingChoice?.source === "discard_phase" && next.pendingChoice.side === "corp") {
    next = applyChoice(next, "corp", [String(next.pendingChoice.options[0]?.id)]);
  }
  return next;
}

function applyChoice(state: GameState, side: Side, selectedOptionIds: string[]): GameState {
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

function ensureRemoteServer(state: GameState, serverId: `remote_${number}`): void {
  if (state.corp.servers.some((server) => server.id === serverId)) return;
  const number = serverId.replace("remote_", "");
  state.corp.servers.push({ id: serverId, kind: "remote", label: `Remote ${number}`, ice: [], root: [] });
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

function putRunnerCardOnTopOfStack(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "stack" }, faceup: true, rezzed: true };
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
