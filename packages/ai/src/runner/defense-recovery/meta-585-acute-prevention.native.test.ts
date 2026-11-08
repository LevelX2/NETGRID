import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerHandDevelopment } from "../hand-development/hand-development-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { applyAction, createGameAfterSetup, getLegalActions, hashGameState, replayEvents } from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type GameState, type LegalAction } from "@netgrid/shared";
import { moveRunnerCardToGrip, putCorpRootInRemote, removeEverywhere, toRunnerTurn } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { runnerDamageThreatAssessment } from "../../runner-damage-threat-assessment";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(`../../runtime/test-fixtures/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
}

function preventionInput() {
  const cp = checkpoint("meta585-g5-d54-prevention");
  return {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
}

function fridgeEvaluation(input: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerHandDevelopment({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        input.playerView.own.gripOrHq.map((card) => [
          card.instanceId,
          card.definitionId!,
        ]),
      ),
    }),
  }).find((value) => value.definitionId === "onr_v1_121_armored-fridge");
}

it("removes only the generic cash floor from the recognized acute compatible shield", () => {
  const { input } = activePreventionFixture();
  expect(fridgeEvaluation(input)).toMatchObject({
    availability: "legal_now",
    developmentRole: "defense_support",
    currentNeed: "acute",
    deferReason: "none",
    persistentInstallEvaluation: {
      creditsAfterInstall: 0,
      reservePenalty: 0,
      evidence: expect.arrayContaining([
        "persistent_install_acute_damage_prevention_reserve_spend",
      ]),
    },
  });
  expect(fridgeEvaluation(input)?.fundingNeed).toBeUndefined();
});

it("does not manufacture an affordable install with insufficient current cash", () => {
  const input = preventionInput();
  input.playerView.own.credits = 2;
  input.legalActions = input.legalActions.filter(
    (action) => !action.costs.some((cost) => (cost.credits ?? 0) > 2),
  );
  expect(fridgeEvaluation(input)).toMatchObject({
    availability: "missing_credits",
    deferReason: "missing_credits",
  });
});

it("does not spend the reserve on an unrelated Meat shield without a public compatible threat", () => {
  const input = preventionInput();
  input.eventTail = [];
  input.playerView.publicEvents = [];
  input.playerView.servers = [];
  input.playerView.own.rig = [];
  expect(fridgeEvaluation(input)?.currentNeed).toBe("none");
  expect(
    fridgeEvaluation(input)?.persistentInstallEvaluation?.evidence,
  ).not.toContain("persistent_install_acute_damage_prevention_reserve_spend");
});

it("preserves the native ordinary Wilson setup reserve and the original run head", () => {
  const cp = checkpoint("meta585-g3-d62-wilson");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.hq");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.pressure_central");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("does not certify acute demand merely from a fully bound historical checkpoint", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta585-g5-d54-prevention.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(action?.type).toBe("install_card");
  expect(action?.payload?.cardId).toMatch(/broker/);
  expect(fridgeEvaluation(input)).toMatchObject({
    currentNeed: "setup", deferReason: "preserve_credit_floor",
  });
  expect(fridgeEvaluation(input)?.persistentInstallEvaluation?.evidence)
    .not.toContain("persistent_install_acute_damage_prevention_reserve_spend");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});

it("chooses the active Meat shield and survives the native three-damage line where Broker flatlines", () => {
  const { state, input, soloId } = activePreventionFixture();
  const decision = chooseAiAction(input);
  const action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(state.cardInstances[action.source!]?.definitionId).toBe(FRIDGE);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.defense_and_recovery");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  const broker = input.legalActions.find((a) => a.type === "install_card" &&
    state.cardInstances[a.source!]?.definitionId === BROKER)!;
  expect(broker).toBeDefined();
  const protectedState = executeDamageLine(state, action, soloId);
  const unprotectedState = executeDamageLine(state, broker, soloId);
  expect(protectedState.winner).toBeNull();
  expect(protectedState.runner.grip).toHaveLength(1);
  expect(protectedState.cardInstances[action.source!]!.counters?.ablative).toBe(4);
  expect(unprotectedState.winner).toBe("corp");
  expect(unprotectedState.gameEndReason).toBe("flatline");
});

const FRIDGE = "onr_v1_121_armored-fridge";
const BROKER = "onr_v1_154_broker";
const SOLO = "onr_v1_342_solo-squad";

function activePreventionFixture() {
  const runnerDeck = { ...ORIGINALSET_DEFAULT_DECKS.runner, cards: [
    ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter((c) => c.id !== FRIDGE && c.id !== BROKER),
    { id: FRIDGE, quantity: 1 }, { id: BROKER, quantity: 1 },
  ] };
  const corpDeck = { ...ORIGINALSET_DEFAULT_DECKS.corp, cards: [
    ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter((c) => c.id !== SOLO),
    { id: SOLO, quantity: 1 },
  ] };
  const state = toRunnerTurn(createGameAfterSetup({ seed: "genuine-acute-fridge", runnerDeck, corpDeck }));
  moveRunnerCardToGrip(state, FRIDGE);
  moveRunnerCardToGrip(state, BROKER);
  for (const id of [...state.runner.grip, ...state.runner.stack]) {
    if (state.runner.grip.includes(id) && [FRIDGE, BROKER].includes(state.cardInstances[id]!.definitionId)) continue;
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  const soloId = putCorpRootInRemote(state, SOLO);
  Object.assign(state.cardInstances[soloId]!, { rezzed: true, faceup: true });
  Object.assign(state.runner, { credits: 3, clicks: 1, tags: 2 });
  const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", ownDeckSnapshot: {
    deckSnapshotId: "genuine-active-fridge", side: "runner",
    cards: runnerDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
  } });
  expect(runnerDamageThreatAssessment(input).flatlineRisk).toMatchObject({
    level: "critical", activeDamageSourceCount: 1, activeDamagePayoffCount: 1,
  });
  return { state, input, soloId };
}

function executeDamageLine(initial: GameState, install: LegalAction, soloId: string) {
  let state = structuredClone(initial);
  const act = (action: LegalAction | undefined, optionId?: string) => {
    if (!action) throw new Error("Missing required native prevention action");
    const result = applyAction(state, {
      matchId: state.matchId, side: action.side, actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(optionId ? { selectedChoices: { choiceId: state.pendingChoice!.choiceId, selectedOptionIds: [optionId] } } : {}),
      idempotencyKey: `acute-proof:${state.stateVersion}`,
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  act(install);
  act(getLegalActions(state, "runner").find((a) => a.type === "end_turn"));
  act(getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw"));
  for (let n = 0; n < 3 && !state.winner; n++) {
    act(getLegalActions(state, "corp").find((a) => a.type === "activated_card_ability" && a.source === soloId));
    if (state.pendingChoice) {
      const prevent = state.pendingChoice.options.find((o) => o.metadata?.optionKind === "prevent_damage");
      if (!prevent) throw new Error("Missing explicit native prevention option");
      act(getLegalActions(state, "runner").find((a) => a.type === "resolve_choice"), prevent.id);
    }
  }
  const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
  return state;
}
