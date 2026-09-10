import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { AiDecision, DeckDefinition, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../index";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

const PROTOCOL = "onr_v1_050_r-and-d-protocol-files";
const CONFERENCE = "onr_v1_184_top-runners-conference";

describe("R&D Interface Dig run-start choice regression", () => {
  it.each([0, 37])(
    "keeps the activated run and real ordering choice on the central-pressure origin at v%i",
    (version) => {
      const fixture = runStartFixture(version);
      const initial = structuredClone(fixture.state);
      const source = chooseAiAction(fixture.input(fixture.state, true));
      expect(
        fixture
          .input(fixture.state)
          .legalActions.find((action) => action.actionId === source.actionId),
      ).toMatchObject({
        type: "activated_card_ability",
        payload: { runServerId: "rd" },
      });
      expect(source).toMatchObject({
        fallbackUsed: false,
        decisionDebug: { planKind: "runner.pressure_central" },
      });
      let state = applyDecision(fixture.state, source);
      expect(state.pendingChoice?.source).toMatch(
        /^runner_run_start\.order:run_/,
      );
      const choice = chooseAiAction(fixture.input(state));
      expect(choice).toMatchObject({
        actionId: "runner.resolve_choice",
        fallbackUsed: false,
        decisionDebug: { planKind: "runner.pressure_central" },
      });
      for (const prefix of ["plan_first_root:", "plan_first_executor:"]) {
        const origin = source.evidence?.find((fact) => fact.startsWith(prefix));
        expect(origin).toBeDefined();
        expect(choice.evidence).toContain(origin);
      }
      expect(choice.evidence).toContain(
        "plan_scheduler:window:plan_bound_runner_run_start_order_choice:none",
      );
      state = applyDecision(state, choice);
      expect(state.pendingChoice?.source).toMatch(
        /^p3_33\.private_look:successful_run:/,
      );
      expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
      expect(state.run?.attackedServerId).toBe("rd");
      expect(
        fixture.conferenceIds.every((id) => state.runner.heap.includes(id)),
      ).toBe(true);
      const replay = replayEvents(
        initial,
        state.eventLog.slice(initial.eventLog.length),
      );
      expect(replay.ok).toBe(true);
      expect(replay.errors).toEqual([]);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("rejects an ordering choice without the selected source event in its chain", () => {
    const fixture = runStartFixture(0);
    const source = chooseAiAction(fixture.input(fixture.state, true));
    const state = applyDecision(fixture.state, source);
    const input = fixture.input(state);
    expect(() => chooseAiAction({ ...input, eventTail: [] })).toThrowError(
      PlanResolutionFailure,
    );
  });
});

function runStartFixture(version: number) {
  resetResidentPlanPortfolioMemory();
  const runnerDeck = standardDeck("standard_runner_rnd_interface_dig");
  // A two-source ordering choice is the contract under test, not a guarantee
  // that global full-game policy will install these cards before an action cap.
  runnerDeck.cards = [
    ...runnerDeck.cards.filter((card) => card.id !== CONFERENCE),
    { id: CONFERENCE, quantity: 2 },
  ];
  let state = createGameAfterSetup({
    matchId: `rd-protocol-order-${version}`,
    seed: "rd-protocol-order",
    runnerDeck,
    corpDeck: standardDeck("standard_corp_cheap_bag_tricks"),
  });
  const protocol = Object.values(state.cardInstances).find(
    (card) => card.definitionId === PROTOCOL,
  );
  if (!protocol) throw new Error("Missing R&D Protocol fixture card");
  const conferences = Object.values(state.cardInstances).filter(
    (card) => card.definitionId === CONFERENCE,
  );
  expect(conferences).toHaveLength(2);
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.stateVersion = version;
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.runner.rig.programs = [protocol.instanceId];
  state.runner.rig.resources = conferences.map((card) => card.instanceId);
  state.runner.memoryUsed = CARD_DEFINITIONS_BY_ID[PROTOCOL]!.memoryCost!;
  delete state.pendingChoice;
  for (const card of [protocol, ...conferences]) {
    state.runner.grip = state.runner.grip.filter(
      (id) => id !== card.instanceId,
    );
    state.runner.stack = state.runner.stack.filter(
      (id) => id !== card.instanceId,
    );
    card.zone = { side: "runner", zone: "rig" };
    card.faceup = true;
    card.rezzed = false;
  }
  // Let the Engine pay out the installed conferences before asking for a run.
  // Fresh, unpaid economy investments correctly defer this non-urgent run.
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 0;
  for (
    let step = 0;
    step < 5 && (state.activeSide !== "runner" || state.pendingChoice);
    step++
  ) {
    const side = state.pendingChoice?.side ?? state.activeSide;
    const actions = getLegalActions(state, side);
    const action = state.pendingChoice
      ? actions.find((candidate) => candidate.type === "resolve_choice")
      : actions.find((candidate) => candidate.type === "end_turn");
    if (!action)
      throw new Error("Missing Engine action while realizing fixture economy");
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: `conference-payout:${step}`,
      ...(state.pendingChoice
        ? {
            selectedChoices: {
              choiceId: state.pendingChoice.choiceId,
              selectedOptionIds: [state.pendingChoice.options[0]!.id],
            },
          }
        : {}),
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  expect(state.activeSide).toBe("runner");
  expect(state.pendingChoice).toBeUndefined();
  const input = (current: GameState, sourceOnly = false) => {
    const full = buildAiDecisionInput(current, "runner", {
      decisionId: `${state.matchId}:${current.stateVersion}`,
      profileId: "rd-protocol-order",
      ownDeckSnapshot: {
        side: "runner",
        deckSnapshotId: "rd-protocol-order",
        cards: runnerDeck.cards.map((card) => ({
          cardId: card.id,
          quantity: card.quantity,
        })),
      },
    });
    if (!sourceOnly) return full;
    const sourceActions = full.legalActions.filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === protocol.instanceId &&
        action.payload?.runServerId === "rd",
    );
    expect(sourceActions).toHaveLength(1);
    // Keep the basic R&D route as planning context, but require that the AI
    // actually selects the evaluated Protocol producer, not that basic action.
    const legalActions = [
      ...sourceActions,
      ...full.legalActions.filter(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    ];
    return {
      ...full,
      legalActions,
      planningStateIdentity: buildPlanningStateIdentity({
        ...full,
        legalActions,
      }),
    };
  };
  return {
    state,
    input,
    conferenceIds: conferences.map((card) => card.instanceId),
  };
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${state.matchId}:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function standardDeck(id: string): DeckDefinition {
  const deck = standardDeckCatalog.decks.find(
    (candidate) => candidate.standardDeckId === id,
  );
  if (!deck) throw new Error(`Missing standard deck ${id}`);
  return {
    id,
    name: deck.name,
    side: deck.side as "runner" | "corp",
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}
