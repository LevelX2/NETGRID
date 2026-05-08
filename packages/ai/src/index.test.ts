import { describe, expect, it } from "vitest";
import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.0.1.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import { createRuntimeCardsById } from "@netgrid/catalog";
import { applyAction, applyEffectCommands, createGameAfterSetup, getLegalActions, getPlayerView, replayEvents } from "@netgrid/engine";
import {
  assertAiInputIsSideSafe,
  buildObservedFacts,
  buildAiDecisionInput,
  chooseAiAction,
  chooseCorpBaselineAction,
  chooseCorpAction,
  chooseCorpPlanDecision,
  chooseRunnerBaselineAction,
  corpPlanUsesOnlyAiSupportedCards,
  chooseRunnerPlanDecision,
  estimateRunCost,
  evaluateAgendaRisk,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateScoringWindow,
  evaluateServerThreat,
  evaluateCorpScoringThreat,
  evaluateRemoteThreat,
  evaluateRunnerRig,
  evaluateServerAccessValue,
  generateCorpPlanCandidates,
  generateRunnerPlanCandidates,
  runnerPlanUsesOnlyAiSupportedCards,
  chooseRunnerAction,
  simulateAiGame,
  simulateAiSoak
} from "./index";
import type { CardInstanceId, ChoiceRequest, DeckDefinition, GameState, LegalAction, PublicGameEvent, Side } from "@netgrid/shared";
import { MVP_0_99_BASELINE } from "@netgrid/shared";

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

    expect(emptyOnly.reasonCode).toBe("runner.plan.safe_probe_run");
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

    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
    expect(decision.decisionDebug).toMatchObject({ aiLevel: 2, planKind: "contest_remote" });
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
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
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
    expect(decision.reasonCode).toBe("corp.plan.score_now");
    expect(decision.decisionDebug).toMatchObject({ aiLevel: 2, planKind: "score_now", fallbackUsed: false });
  });
});

describe("V1.4.0 plan-based Corp AI", () => {
  it("generates only current LegalAction-backed Corp plans", () => {
    let state = createGameAfterSetup({ seed: "ai-v140-generator" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 8;
    state.corp.clicks = 3;
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToHq(state, "simple_barrier_ice");
    moveCorpCardToHq(state, "simple_economy_operation");
    moveCorpCardToHq(state, "simple_economy_asset");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const candidates = generateCorpPlanCandidates(input);
    const legalIds = new Set(input.legalActions.map((action) => action.actionId));

    expect(candidates.map((candidate) => candidate.kind)).toEqual(expect.arrayContaining(["score_next_turn", "build_scoring_remote", "protect_hq", "protect_rnd", "recover_economy", "bait_runner"]));
    for (const candidate of candidates) {
      expect(candidate.legalActionIds.every((actionId) => legalIds.has(actionId))).toBe(true);
      expect(corpPlanUsesOnlyAiSupportedCards(input, candidate)).toBe(true);
    }
  });

  it("scores plan evaluators from visible PlayerView and public event data", () => {
    let state = createGameAfterSetup({ seed: "ai-v140-evaluators" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 2;
    state.corp.clicks = 3;
    moveCorpCardToHq(state, "simple_barrier_ice");
    moveCorpCardToHq(state, "simple_economy_operation");
    const input = withPublicServerEventTail(buildAiDecisionInput(state, "corp", { difficulty: "normal" }), ["hq", "rd", "remote_1"]);
    const candidates = generateCorpPlanCandidates(input);
    const economy = candidates.find((candidate) => candidate.kind === "recover_economy");
    const hq = candidates.find((candidate) => candidate.kind === "protect_hq");

    expect(economy).toBeDefined();
    expect(hq).toBeDefined();
    if (!economy || !hq) throw new Error("Missing V1.4.0 evaluator fixtures");
    expect(evaluateEconomyReserve(input, economy).score).toBeGreaterThan(150);
    expect(evaluateServerThreat(input, hq).evidence).toContain("hq_runs:1");
    expect(evaluateIceRez(input, hq).reasons).toContain("ice_roles_available");
    expect(evaluateRemoteIntentMemory(input).remoteInstallSignals).toBe(1);
    expect(JSON.stringify(evaluateAgendaRisk(input, economy))).not.toContain("cardInstances");
    expect(JSON.stringify(evaluateScoringWindow(input, economy))).not.toContain("privatePayload");
  });

  it("selects score-next-turn, remote-build and economy-recovery plans in focused Corp fixtures", () => {
    const scoreNextInput = corpActionPhaseInput("ai-v140-score-next", (state) => {
      state.corp.credits = 6;
      putCorpRootInRemote(state, "simple_agenda", 2);
    });
    const remoteBuildInput = corpActionPhaseInput("ai-v140-remote-build", (state) => {
      state.corp.credits = 7;
      moveCorpCardToHq(state, "simple_agenda");
    });
    const economyInput = corpActionPhaseInput("ai-v140-economy", (state) => {
      state.corp.credits = 1;
      moveCorpCardToHq(state, "simple_economy_operation");
    });

    expect(chooseCorpPlanDecision(scoreNextInput).debug.planKind).toBe("score_next_turn");
    expect(generateCorpPlanCandidates(remoteBuildInput).some((candidate) => candidate.kind === "build_scoring_remote")).toBe(true);
    expect(chooseCorpPlanDecision(economyInput).debug.planKind).toBe("recover_economy");
  });

  it("keeps DecisionDebug side-safe and falls back legally under zero budget", () => {
    const input = corpActionPhaseInput("ai-v140-debug", (state) => {
      state.corp.credits = 8;
      putCorpRootInRemote(state, "simple_agenda", 3);
    });
    const decision = chooseCorpAction(input);
    const fallback = chooseCorpPlanDecision(input, { timeBudgetMs: 0 });
    const serializedDebug = JSON.stringify(decision.decisionDebug);

    expect(decision.reasonCode).toBe("corp.plan.score_now");
    expect(decision.decisionDebug).toMatchObject({ aiLevel: 2, planKind: "score_now", fallbackUsed: false, timeoutUsed: false });
    expect(serializedDebug).not.toContain("cardInstances");
    expect(serializedDebug).not.toContain("privatePayload");
    expect(serializedDebug).not.toContain("Simple Fracter");
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.debug.timeoutUsed).toBe(true);
    expect(input.legalActions.some((action) => action.actionId === fallback.selectedActionId)).toBe(true);
  });

  it("kept Runner AI on the pre-V1.4.1 heuristic path before the Runner gate", () => {
    const input = buildAiDecisionInput(toRunnerTurn(createGameAfterSetup({ seed: "ai-v140-runner-regression" })), "runner", { difficulty: "normal" });
    const decision = chooseRunnerAction(input);

    expect(decision.reasonCode.startsWith("runner.")).toBe(true);
    expect(decision.decisionDebug).toMatchObject({ aiLevel: 2 });
  });

  it("keeps human-only cards out of Corp strategic plan roles", () => {
    let state = createGameAfterSetup({
      seed: "ai-v140-unsupported-card",
      baseline: MVP_0_99_BASELINE,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: ONR_V1_2_3_CORP_DECK,
      agendaPointsToWin: 7
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const unsupportedId = moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const unsupportedAction = input.legalActions.find((action) => action.source === unsupportedId);

    expect(unsupportedAction).toBeDefined();
    expect(generateCorpPlanCandidates(input).every((candidate) => !candidate.legalActionIds.includes(unsupportedAction?.actionId ?? ""))).toBe(true);
  });

  it("keeps plan-based Corp AI playable in Human-vs-Corp-KI and KI-vs-KI smokes", () => {
    const hvAi = runCorpAiOnlySmoke("ai-v140-human-corp-smoke", 24);
    const aiVsAi = simulateAiGame({ seed: "ai-v140-ai-vs-ai-smoke", maxActions: 40, corpProfileId: "corp-ai-v1.4.0-normal" });

    expect(hvAi.errors).toEqual([]);
    expect(hvAi.actions).toBeGreaterThan(8);
    expect(aiVsAi.errors).toEqual([]);
    expect(aiVsAi.replayOk).toBe(true);
    expect(JSON.stringify(aiVsAi)).not.toContain("cardInstances");
    expect(aiVsAi.actionSequence.some((entry) => entry.reasonCode.startsWith("corp.plan."))).toBe(true);
  });

  it("benchmarks plan decisions against the old Corp heuristic baseline", () => {
    const scoreInput = corpActionPhaseInput("ai-v140-benchmark-score", (state) => {
      state.corp.credits = 8;
      putCorpRootInRemote(state, "simple_agenda", 3);
    });
    const economyInput = corpActionPhaseInput("ai-v140-benchmark-economy", (state) => {
      state.corp.credits = 1;
      moveCorpCardToHq(state, "simple_economy_operation");
    });
    const planScore = chooseCorpAction(scoreInput);
    const baselineScore = chooseCorpBaselineAction(scoreInput);
    const planEconomy = chooseCorpAction(economyInput);
    const baselineEconomy = chooseCorpBaselineAction(economyInput);

    expect(planScore.actionId).toBe(baselineScore.actionId);
    expect(planScore.reasonCode).toBe("corp.plan.score_now");
    expect(baselineScore.reasonCode).toBe("corp.score_available_agenda");
    expect(planEconomy.reasonCode).toBe("corp.plan.recover_economy");
    expect(baselineEconomy.reasonCode.startsWith("corp.plan.")).toBe(false);
    expect(economyInput.legalActions.some((action) => action.actionId === baselineEconomy.actionId)).toBe(true);
  });
});

describe("V1.4.1 plan-based Runner AI", () => {
  it("generates only current LegalAction-backed Runner plans", () => {
    const input = runnerActionPhaseInput("ai-v141-generator", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 1);
      moveRunnerCardToGrip(state, "simple_fracter");
      moveRunnerCardToGrip(state, "simple_economy_event");
    });
    const candidates = generateRunnerPlanCandidates(input);
    const legalIds = new Set(input.legalActions.map((action) => action.actionId));

    expect(candidates.map((candidate) => candidate.kind)).toEqual(expect.arrayContaining(["pressure_rnd", "pressure_hq", "contest_remote", "build_rig", "recover_economy", "draw_for_answers", "safe_probe_run"]));
    for (const candidate of candidates) {
      expect(candidate.legalActionIds.every((actionId) => legalIds.has(actionId))).toBe(true);
      expect(runnerPlanUsesOnlyAiSupportedCards(input, candidate)).toBe(true);
    }
  });

  it("scores Runner evaluators from visible board, public events and uncertainty", () => {
    const input = runnerActionPhaseInput("ai-v141-evaluators", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 2);
      moveRunnerCardToGrip(state, "simple_fracter");
    });
    const remoteInput = withPublicServerEventTail(input, ["rd", "hq", "remote_1"]);
    const candidates = generateRunnerPlanCandidates(remoteInput);
    const remote = candidates.find((candidate) => candidate.kind === "contest_remote");
    const build = candidates.find((candidate) => candidate.kind === "build_rig");

    expect(remote).toBeDefined();
    expect(build).toBeDefined();
    if (!remote || !build) throw new Error("Missing V1.4.1 evaluator fixtures");
    expect(evaluateRunnerRig(remoteInput, build).score).toBeGreaterThan(150);
    expect(estimateRunCost(remoteInput, remote).evidence).toContain("target:remote_1");
    expect(evaluateServerAccessValue(remoteInput, remote).evidence).toContain("root_count:1");
    expect(evaluateRemoteThreat(remoteInput, remote).score).toBeGreaterThan(100);
    expect(evaluateCorpScoringThreat(remoteInput, remote).evidence).toContain("corp_agenda:0");
  });

  it("selects pressure, remote contest, rig, economy and safe probe plans in focused fixtures", () => {
    const pressureInput = runnerActionPhaseInput("ai-v141-pressure", () => undefined);
    const remoteInput = runnerActionPhaseInput("ai-v141-contest", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 2);
    });
    const buildInput = runnerActionPhaseInput("ai-v141-build", (state) => {
      moveRunnerCardToGrip(state, "simple_fracter");
    });
    const economyInput = runnerActionPhaseInput("ai-v141-economy", (state) => {
      state.runner.credits = 1;
      moveRunnerCardToGrip(state, "simple_economy_event");
    });
    const safeProbeInput = runnerActionPhaseInput("ai-v141-safe-probe", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    });
    const pressureRun = pressureInput.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "rd");
    const pressureGain = pressureInput.legalActions.find((action) => action.type === "gain_credit");
    const remoteRun = remoteInput.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    const economyAction = economyInput.legalActions.find((action) => action.type === "play_event" && sourceDefinitionFromInput(economyInput, action) === "simple_economy_event") ?? economyInput.legalActions.find((action) => action.type === "gain_credit");
    const safeProbeRun = safeProbeInput.legalActions.find((action) => action.type === "start_run" && action.payload?.serverId === "remote_1");

    expect(pressureRun).toBeDefined();
    expect(pressureGain).toBeDefined();
    expect(remoteRun).toBeDefined();
    expect(economyAction).toBeDefined();
    if (!pressureRun || !pressureGain || !remoteRun || !economyAction) throw new Error("Missing V1.4.1 focused fixture actions");
    expect(chooseRunnerPlanDecision({ ...pressureInput, legalActions: [pressureRun, pressureGain] }).debug.planKind).toBe("pressure_rnd");
    expect(chooseRunnerPlanDecision({ ...remoteInput, legalActions: [remoteRun] }).debug.planKind).toBe("contest_remote");
    expect(chooseRunnerPlanDecision(buildInput).debug.planKind).toBe("build_rig");
    expect(chooseRunnerPlanDecision({ ...economyInput, legalActions: [economyAction] }).debug.planKind).toBe("recover_economy");
    expect(safeProbeRun).toBeDefined();
    if (!safeProbeRun) throw new Error("Missing safe probe run");
    expect(chooseRunnerPlanDecision({ ...safeProbeInput, legalActions: [safeProbeRun] }).debug.planKind).toBe("safe_probe_run");
  });

  it("handles access trash, jack-out and legal fallback without hidden-info claims", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v141-trash-jackout" }));
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, assetId);
    state.runner.credits = 6;
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "hq");
    state = apply(state, "runner", (action) => action.type === "access_card");
    const trashInput = buildAiDecisionInput(state, "runner", { difficulty: "normal", profileId: "runner-ai-v1.4.1-normal" });
    const trashDecision = chooseRunnerAction(trashInput);
    const fallback = chooseRunnerPlanDecision(trashInput, { timeBudgetMs: 0 });
    const serializedDebug = JSON.stringify(trashDecision.decisionDebug);

    expect(trashInput.legalActions.find((action) => action.actionId === trashDecision.actionId)?.type).toBe("trash_accessed_card");
    expect(trashDecision.reasonCode).toBe("runner.plan.trash_asset");
    expect(serializedDebug).toContain("hidden_corp_information_not_used");
    expect(serializedDebug).not.toContain("cardInstances");
    expect(serializedDebug).not.toContain("corp_simple_agenda");
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.debug.timeoutUsed).toBe(true);
    expect(trashInput.legalActions.some((action) => action.actionId === fallback.selectedActionId)).toBe(true);

    const jackInput = runnerJackOutInput("ai-v141-jackout");
    const jack =
      jackInput.legalActions.find((action) => action.type === "jack_out") ??
      ({
        ...jackInput.legalActions[0]!,
        actionId: "runner.jack_out.synthetic_v141",
        type: "jack_out" as const,
        source: "game_rule" as const,
        label: "Jack out",
        timingPoint: "run.jack_out_window" as const,
        costs: [],
        payload: {}
      } satisfies LegalAction);
    expect(jack).toBeDefined();
    expect(chooseRunnerPlanDecision({ ...jackInput, legalActions: [jack] }).debug.planKind).toBe("safe_probe_run");
  });

  it("keeps hidden-state invariance for equal Runner-visible projections", () => {
    const stateA = toRunnerTurn(createGameAfterSetup({ seed: "ai-v141-invariance" }));
    const stateB = structuredClone(stateA);
    const hiddenId = stateA.corp.rd[0];
    expect(hiddenId).toBeDefined();
    if (!hiddenId) throw new Error("Missing hidden R&D card");
    stateA.cardInstances[hiddenId] = { ...stateA.cardInstances[hiddenId]!, definitionId: "simple_agenda", faceup: false, rezzed: false };
    stateB.cardInstances[hiddenId] = { ...stateB.cardInstances[hiddenId]!, definitionId: "simple_economy_asset", faceup: false, rezzed: false };
    const inputA = buildAiDecisionInput(stateA, "runner", { difficulty: "normal", profileId: "runner-ai-v1.4.1-normal" });
    const inputB = buildAiDecisionInput(stateB, "runner", { difficulty: "normal", profileId: "runner-ai-v1.4.1-normal" });
    const decisionA = chooseRunnerAction(inputA);
    const decisionB = chooseRunnerAction(inputB);

    expect(JSON.stringify(inputA.playerView)).toBe(JSON.stringify(inputB.playerView));
    expect(inputA.legalActions.map((action) => action.type)).toEqual(inputB.legalActions.map((action) => action.type));
    expect(decisionA.reasonCode).toBe(decisionB.reasonCode);
    expect(decisionA.decisionDebug?.planKind).toBe(decisionB.decisionDebug?.planKind);
    expect(inputA.legalActions.find((action) => action.actionId === decisionA.actionId)?.type).toBe(inputB.legalActions.find((action) => action.actionId === decisionB.actionId)?.type);
  });

  it("keeps V1.4.0 Corp plan regression green while Runner plans run against basic and planned Corp", () => {
    const scoreInput = corpActionPhaseInput("ai-v141-corp-regression", (state) => {
      state.corp.credits = 8;
      putCorpRootInRemote(state, "simple_agenda", 3);
    });
    const basicCorp = runRunnerAiSmoke("ai-v141-basic-corp-smoke", 34, "baseline");
    const plannedCorp = simulateAiGame({ seed: "ai-v141-planned-corp-smoke", maxActions: 50, runnerProfileId: "runner-ai-v1.4.1-normal", corpProfileId: "corp-ai-v1.4.0-normal" });

    expect(chooseCorpAction(scoreInput).reasonCode).toBe("corp.plan.score_now");
    expect(basicCorp.errors).toEqual([]);
    expect(basicCorp.runnerPlanDecisions).toBeGreaterThan(0);
    expect(plannedCorp.errors).toEqual([]);
    expect(plannedCorp.replayOk).toBe(true);
    expect(plannedCorp.actionSequence.some((entry) => entry.reasonCode.startsWith("runner.plan."))).toBe(true);
    expect(plannedCorp.actionSequence.some((entry) => entry.reasonCode.startsWith("corp.plan."))).toBe(true);
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

  it("passes V1.2.0 Event Modification windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v120-event-modification",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");

    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(runnerDecision.selectedChoices).toEqual({ choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["pass"] });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Prevention");
    expect(JSON.stringify(corpInput)).not.toContain("v120_damage_prevent");
  });

  it("passes V1.2.1 Replacement windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v121-replacement",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7
    });
    state.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 } };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(state, "corp", (action) => action.type === "play_operation" && sourceDefinition(state, action) === "v111_core_damage_operation");

    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(runnerDecision.selectedChoices).toEqual({ choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["pass"] });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Replacement");
    expect(JSON.stringify(corpInput)).not.toContain("v121_damage_replace");
  });

  it("keeps V1.2.2 hidden Special Zones out of AI input", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v122-special-zone" }));
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      setAside: { visibility: "hidden", reason: "ai_v122_hidden_set_aside" }
    };
    state = apply(state, "runner", (action) => action.type === "move_to_set_aside");

    const corpInput = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const runnerInput = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const corpSerialized = JSON.stringify(corpInput);

    expect(corpInput.playerView.specialZones?.setAside[0]).toMatchObject({ known: false });
    expect(corpSerialized).not.toContain("Simple Economy Event");
    expect(corpSerialized).not.toContain("simple_economy_event");
    expect(corpSerialized).not.toContain(cardId);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("uses LegalActions-only fallback for V1.2.2 control-change windows", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v122-control-fallback" }));
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: { newController: "corp", visibility: "private_to_side", reason: "ai_v122_control_change" }
    };
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const specialOnly = {
      ...input,
      legalActions: input.legalActions.filter((action) => action.type === "change_card_control")
    };
    const decision = chooseRunnerAction(specialOnly);

    expect(specialOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(specialOnly.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
    expect(JSON.stringify(decision)).not.toContain("Simple Economy Event");
    expect(assertAiInputIsSideSafe(specialOnly)).toBe(true);
  });

  it("keeps V1.2.3 human-playable cards out of the AI deck pool", () => {
    const serializedPool = JSON.stringify(aiDeckPoolData);
    const snapshots = snapshotsData08.snapshots as Array<{ deckSnapshotId: string; cards: Array<{ cardId: string }> }>;
    const runtimeCardsById = createRuntimeCardsById();

    expect(serializedPool).not.toContain("demo_runner_123_snapshot_v1_2_3");
    expect(serializedPool).not.toContain("demo_corp_123_snapshot_v1_2_3");
    for (const cardId of ONR_V1_2_3_CARD_IDS) {
      expect(serializedPool).not.toContain(cardId);
      expect(runtimeCardsById[cardId]?.statuses.ai_supported).toBe(false);
    }
    for (const entry of aiDeckPoolData.entries) {
      const snapshot = snapshots.find((candidate) => candidate.deckSnapshotId === entry.snapshotId);
      expect(snapshot, entry.snapshotId).toBeDefined();
      for (const card of snapshot?.cards ?? []) {
        expect(runtimeCardsById[card.cardId]?.statuses.ai_supported, card.cardId).toBe(true);
      }
    }
  });

  it("uses only generic LegalActions for V1.2.3 human-only card actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v123-human-only-mit",
        baseline: MVP_0_99_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7
      })
    );
    moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const input = buildAiDecisionInput(state, "runner", { difficulty: "normal" });
    const mitOnly = {
      ...input,
      legalActions: input.legalActions.filter((action) => action.type === "play_event" && sourceDefinition(state, action) === "onr_v1_101_mit-west-tier").slice(0, 1)
    };
    const decision = chooseRunnerAction(mitOnly);

    expect(mitOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(mitOnly.legalActions[0]?.actionId);
    expect(decision.reasonCode).toBe("runner.economy.event");
    expect(assertAiInputIsSideSafe(mitOnly)).toBe(true);
    expect(JSON.stringify(decision)).not.toContain("Dwarf");
    expect(JSON.stringify(decision)).not.toContain("MIT West Tier");
    expect(JSON.stringify(mitOnly)).not.toContain("cardInstances");
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

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - AI Core Damage Harness",
  cards: [...V094_CORP_DECK.cards, { id: "v111_core_damage_operation", quantity: 2 }]
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

const ONR_V1_2_3_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_297_overtime-incentives"
] as const;

const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v123_runner",
  name: "AI O:NR V1.2.3 Runner",
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
  id: "ai_onr_v123_corp",
  name: "AI O:NR V1.2.3 Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_297_overtime-incentives", quantity: 3 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_261_quandary", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_259_in-the-face", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 1 }
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

function corpActionPhaseInput(seed: string, mutate: (state: GameState) => void) {
  let state = createGameAfterSetup({ seed });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  return buildAiDecisionInput(state, "corp", { difficulty: "normal", profileId: "corp-ai-v1.4.0-normal" });
}

function runnerActionPhaseInput(seed: string, mutate: (state: GameState) => void) {
  const state = toRunnerTurn(createGameAfterSetup({ seed }));
  mutate(state);
  return buildAiDecisionInput(state, "runner", { difficulty: "normal", profileId: "runner-ai-v1.4.1-normal" });
}

function runnerJackOutInput(seed: string) {
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
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = applyChoice(state, "corp", ["bid_0"]);
  state = applyChoice(state, "runner", ["bid_2"]);
  state = apply(state, "runner", (action) => action.type === "continue_run");
  return buildAiDecisionInput(state, "runner", { difficulty: "normal", profileId: "runner-ai-v1.4.1-normal" });
}

function withPublicServerEventTail(input: ReturnType<typeof buildAiDecisionInput>, servers: string[]) {
  const eventTail: PublicGameEvent[] = servers.map((serverId, index) => ({
    eventId: `v140-visible-event-${index}`,
    type: serverId.startsWith("remote_") ? "install_remote_card" : "run_started",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `fnv1a:v140${index}`,
    visibilityClass: "public",
    publicPayload: { serverId }
  }));
  return { ...input, eventTail };
}

function runCorpAiOnlySmoke(seed: string, maxActions: number): { actions: number; errors: string[] } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId: side === "corp" ? "corp-ai-v1.4.0-normal" : "runner-ai-v0.9-normal"
    });
    const decision = side === "corp" ? chooseCorpAction(input) : chooseRunnerAction(input);
    const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId);
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors };
}

function runRunnerAiSmoke(seed: string, maxActions: number, corpMode: "baseline" | "planned"): { actions: number; errors: string[]; runnerPlanDecisions: number } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  let runnerPlanDecisions = 0;
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId: side === "runner" ? "runner-ai-v1.4.1-normal" : "corp-ai-v1.4.0-normal"
    });
    const decision = side === "runner" ? chooseRunnerAction(input) : corpMode === "baseline" ? chooseCorpBaselineAction(input) : chooseCorpAction(input);
    if (decision.reasonCode.startsWith("runner.plan.")) runnerPlanDecisions += 1;
    const action = input.legalActions.find((candidate) => candidate.actionId === decision.actionId);
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices ? { selectedChoices: decision.selectedChoices } : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors, runnerPlanDecisions };
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

function moveCorpCardToHq(state: GameState, definitionId: string): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "hq" }, faceup: false, rezzed: false };
  return id;
}

function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  for (const cardId of state.corp.hq.filter((candidate) => candidate !== id)) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = { ...state.cardInstances[cardId]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  }
  state.corp.hq = [id];
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

function sourceDefinitionFromInput(input: ReturnType<typeof buildAiDecisionInput>, action: LegalAction): string | undefined {
  if (typeof action.source !== "string" || action.source === "basic_action" || action.source === "game_rule") return undefined;
  const visible = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root])
  ]
    .flat()
    .find((card) => card.instanceId === action.source && card.known);
  return visible?.definitionId;
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
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter((cardId) => cardId !== id);
    state.specialZones.removedFromGame = state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
