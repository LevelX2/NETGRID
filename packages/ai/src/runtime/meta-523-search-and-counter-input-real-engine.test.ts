import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type {
  DeckDefinition,
  GameState,
  LegalAction,
  PlayerAction,
  Side,
} from "@netgrid/shared";
import { metaTenStandardDecks as catalog } from "../evaluation/meta-ten-standard-decks.test-support";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { runnerStackSearchResolvedThisTurn } from "../runner/hand-development/development-signals";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);
const shortCircuit = "onr_v1_177_the-short-circuit";
const armageddon = "onr_proteus_078_armageddon";
const krash = "onr_v1_039_krash";

function fixture() {
  const runner = catalog.decks.find(
    (d) => d.standardDeckId === "standard_runner_purge_window",
  )!;
  const corp = catalog.decks.find(
    (d) => d.standardDeckId === "standard_corp_tycho_ice_stack",
  )!;
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side,
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  const state = createGameAfterSetup({
    seed: "meta523-native-input-facts",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(25)
    .withRunnerClicks(4)
    .withRunnerGripSize(0)
    .withCorpHqSize(0);
  return {
    state,
    snapshot: {
      deckSnapshotId: runner.standardDeckId,
      side: "runner" as const,
      cards: runner.cards,
    },
  };
}

function take(
  state: GameState,
  side: Side,
  predicate: (a: LegalAction) => boolean,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const matches = getLegalActions(state, side).filter(predicate);
  expect(matches).toHaveLength(1);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: matches[0]!.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}

function phases() {
  const { state: initial, snapshot } = fixture();
  RealEngineFixtureBuilder.forState(initial)
    .withRunnerCardInGrip(shortCircuit)
    .withRunnerCardInGrip("onr_proteus_099_viral-pipeline")
    .withRunnerProgramInstalled("onr_v1_014_codecracker")
    .withRunnerProgramInstalled("onr_proteus_083_corrosion");
  initial.runner.memoryUsed = 2;
  let state = take(
    initial,
    "runner",
    (a) =>
      a.type === "install_card" && a.source?.includes("short-circuit") === true,
  );
  const input = () =>
    buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: snapshot,
      eventTail: state.eventLog,
    });
  const before = input();
  state = take(
    state,
    "runner",
    (a) =>
      a.type === "activated_card_ability" &&
      a.payload?.cardImplementationEffectKind === "search_stack_to_grip",
  );
  const pending = input();
  const choice = pending.playerView.pendingChoice!;
  const option = choice.options.find((o) => o.card?.definitionId === krash)!;
  expect(option).toBeDefined();
  state = take(state, "runner", (a) => a.type === "resolve_choice", {
    choiceId: choice.choiceId,
    selectedOptionIds: [option.id],
  });
  const resolved = input();
  state = take(
    state,
    "runner",
    (a) =>
      a.type === "install_card" &&
      a.source?.includes("krash") === true &&
      a.payload?.runnerProgramTrashBeforeInstall !== true,
  );
  const installed = input();
  state = take(state, "runner", (a) => a.type === "end_turn");
  state = take(state, "corp", (a) => a.type === "mandatory_draw");
  state = take(state, "corp", (a) => a.type === "end_turn");
  return { before, pending, resolved, installed, later: input() };
}

it("recognizes only the resolved Engine choice in the current turn, including after the searched card is installed", () => {
  const p = phases();
  expect(
    [p.before, p.pending, p.resolved, p.installed, p.later].map(
      runnerStackSearchResolvedThisTurn,
    ),
  ).toEqual([false, false, true, true, false]);
  expect(p.pending.playerView.pendingChoice).toBeDefined();
  expect(
    p.later.playerView.own.gripOrHq.some((c) => c.definitionId === krash),
  ).toBe(false);
  expect(p.later.playerView.own.rig!.some((c) => c.definitionId === krash)).toBe(
    true,
  );
});

it("keeps current-turn cadence distinct from a visible coverage answer and releases the later-turn development consumer", () => {
  const p = phases();
  const decision = chooseAiAction(p.later);
  expect(
    p.later.legalActions.some((a) => a.actionId === decision.actionId),
  ).toBe(true);
  const search = p.later.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.payload?.cardImplementationEffectKind === "search_stack_to_grip",
  )!;
  expect(search).toBeDefined();
  const rejection =
    decision.decisionDebug?.actionAlternatives
      ?.find((a) => a.actionId === search.actionId)
      ?.whyNot?.join("|") ?? "";
  expect(rejection).not.toContain("visible_answer_already_in_hand");
  expect(rejection).not.toContain("current_turn_search_cadence");
  expect(decision.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
    decision.actionId,
  );
});

function counterAccess() {
  const { state: initial, snapshot } = fixture();
  RealEngineFixtureBuilder.forState(initial).withRunnerCardInGrip(armageddon);
  let state = take(
    initial,
    "runner",
    (a) =>
      a.type === "install_card" && a.source?.includes("armageddon") === true,
  );
  const ready = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: snapshot,
    eventTail: state.eventLog,
  });
  const start = chooseAiAction(ready);
  expect(
    ready.legalActions.find((a) => a.actionId === start.actionId),
  ).toMatchObject({ type: "start_run", payload: { serverId: "rd" } });
  state = take(state, "runner", (a) => a.actionId === start.actionId);
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: snapshot,
    eventTail: state.eventLog,
  });
  const raw = getLegalActions(state, "runner").find(
    (a) => a.payload?.successfulRunAccessReplacement,
  )!;
  expect(raw).toBeDefined();
  return { state, input, raw };
}

it("preserves the actual Engine counter transfer through the production DTO and the existing access semantic producer", () => {
  const { input, raw } = counterAccess();
  const projected = input.legalActions.find(
    (a) => a.actionId === raw.actionId,
  )!;
  expect(projected.payload).toMatchObject({
    counterSide: "corp",
    counterType: "doom",
    counterDelta: 1,
  });
  expect(projected.actionId).toBe(raw.actionId);
  expect(projected.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  expect(candidates.find((c) => c.actionId === raw.actionId)).toMatchObject({
    semanticActionType: "runner.access_replacement_counter",
    runAccessDecisionModel: {
      serverId: "rd",
      hiddenInfoPolicy: "side_safe_visible_only",
      modifiers: expect.arrayContaining(["access_replacement"]),
    },
  });
  const decision = chooseAiAction(input);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.convert_run_window");
  expect(
    decision.decisionDebug?.actionAlternatives
      ?.find((a) => a.actionId === raw.actionId)
      ?.whyNot?.join("|"),
  ).toContain("runner_run_window_action_has_no_plan_local_assessment");
});

it("strips unrelated private payloads while retaining only the approved counter facts", () => {
  const { input, raw } = counterAccess();
  const contaminated = {
    ...raw,
    payload: {
      ...raw.payload,
      hiddenCorpHand: "secret",
      hiddenRdOrder: "secret",
      privateDiagnostic: "secret",
    },
  };
  const dto = buildAiDecisionInputDto({
    ...input,
    legalActions: [contaminated],
  });
  expect(dto.legalActions[0]!.payload).toMatchObject({
    counterSide: "corp",
    counterDelta: 1,
  });
  expect(JSON.stringify(dto.legalActions[0])).not.toContain("secret");
});
