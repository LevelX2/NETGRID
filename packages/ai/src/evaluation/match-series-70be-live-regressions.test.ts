import {
  applyAction,
  applyRandomizedIceInstallSelection,
  applyRandomizedTurnPlanSelection,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type AiDecision,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseCorpAction, chooseRunnerAction } from "../index";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { resetRunnerRunPlanMemory } from "../runtime/runner-run-plan-memory";
import { resetStrategicIntentMemory } from "../strategic-intent-memory";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { RealEngineFixtureBuilder } from "./real-engine-fixture-builder";

const CORPORATE_WAR = "onr_v1_196_corporate-war";
const SYSTEMATIC_LAYOFFS = "onr_v1_304_systematic-layoffs";
const CITY_SURVEILLANCE = "onr_v1_313_city-surveillance";
const BROKER = "onr_v1_154_broker";
const RUSH_HOUR = "onr_proteus_122_rush-hour";
const PILE_DRIVER = "onr_v1_047_pile-driver";

describe("match series 70BE real Engine regressions", () => {
  beforeEach(() => {
    resetResidentPlanPortfolioMemory();
    resetRunnerRunPlanMemory();
    resetStrategicIntentMemory();
  });

  it("keeps the full Corporate War same-turn score sequence executable", () => {
    let state = corpMainState("series-70be-corp-score-sequence");
    RealEngineFixtureBuilder.forState(state)
      .withCorpHqSize(0)
      .withCorpCardInHq(CORPORATE_WAR)
      .withCorpCardInHq(SYSTEMATIC_LAYOFFS)
      .withCorpCredits(6);

    const selectedTypes: string[] = [];
    for (let step = 0; step < 5; step += 1) {
      const input = decisionInput(state, "corp", CORP_DECK);
      const decision = chooseCorpAction(input, {
        corpTurnPlannerMode: "legacy_compare",
      });
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      if (!action) throw new Error("Corp AI returned a non-legal action");
      selectedTypes.push(action.type);
      state = applyDecision(state, "corp", decision);
    }

    expect(selectedTypes).toEqual([
      "install_card",
      "play_operation",
      "resolve_choice",
      "advance_card",
      "score_agenda",
    ]);
    expect(
      state.corp.scoreArea.some(
        (cardId) => state.cardInstances[cardId]?.definitionId === CORPORATE_WAR,
      ),
    ).toBe(true);
  });

  it("preserves Engine-produced Broker semantics while productive central pressure wins", () => {
    const state = runnerTurnState("series-70be-broker-live-input");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerResourceInstalled(BROKER)
      .withRunnerCredits(6);
    const input = decisionInput(state, "runner", RUNNER_DECK);
    const build = input.legalActions.find(
      (action) => action.payload?.cardImplementationAddsHostedCredits === true,
    );

    expect(build?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
    });
    const decision = chooseRunnerAction(input);
    expect(decision.actionId).not.toBe(build?.actionId);
    expect(
      input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      ),
    ).toMatchObject({
      type: "start_run",
      payload: { serverId: "rd" },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.pressure_central",
        "plan_step_capability:pressure_rd_access",
      ]),
    );
  });

  it("draws first and then pays the affordable City Surveillance choice", () => {
    let state = runnerTurnState("series-70be-draw-tax-live-input");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(1)
      .withRunnerCredits(3)
      .withCorpRemoteRoot("remote_1", CITY_SURVEILLANCE, 0, {
        faceup: true,
        rezzed: true,
      });
    const drawActions = decisionInput(
      state,
      "runner",
      RUNNER_DECK,
    ).legalActions.filter((action) => action.type === "draw_card");

    expect(drawActions).toHaveLength(1);
    state = applyByPredicate(
      state,
      "runner",
      (action) => action.type === "draw_card",
    );
    const choiceInput = decisionInput(state, "runner", RUNNER_DECK);
    const decision = chooseRunnerAction(choiceInput);

    expect(choiceInput.playerView.pendingChoice?.source).toContain(
      "runner_draw.draw_tax",
    );
    expect(decision.actionId).toBe(choiceInput.legalActions[0]?.actionId);
    expect(decision.selectedChoices).toEqual({
      choiceId: choiceInput.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["pay_credit"],
    });
    state = applyDecision(state, "runner", decision);
    expect(state.runner.credits).toBe(2);
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("rezes City Surveillance through the Corp pre-draw choice", () => {
    let state = runnerTurnState("series-70be-pre-draw-rez-live-input");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(1)
      .withRunnerCredits(3)
      .withCorpCredits(1)
      .withCorpRemoteRoot("remote_1", CITY_SURVEILLANCE, 0, {
        faceup: false,
        rezzed: false,
      });
    state = applyByPredicate(
      state,
      "runner",
      (action) => action.type === "draw_card",
    );
    const choiceInput = decisionInput(state, "corp", CORP_DECK);
    const decision = chooseCorpAction(choiceInput, {
      corpTurnPlannerMode: "legacy_compare",
    });

    expect(choiceInput.playerView.pendingChoice?.source).toContain(
      "runner_draw.draw_tax_rez",
    );
    expect(decision.actionId).toBe(choiceInput.legalActions[0]?.actionId);
    expect(decision.selectedChoices?.selectedOptionIds).toEqual([
      expect.stringMatching(/^rez_/),
    ]);
    state = applyDecision(state, "corp", decision);

    expect(state.corp.credits).toBe(0);
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.pendingChoice?.source).toContain("runner_draw.draw_tax");
  });

  it("quotes Rush Hour after its Engine-produced event cost", () => {
    const state = runnerTurnState("series-70be-rush-hour-post-cost");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(RUSH_HOUR)
      .withRunnerProgramInstalled(PILE_DRIVER)
      .withRunnerCredits(3)
      .withRezzedCorpIceOnServer("rd", "simple_barrier_ice");
    const input = decisionInput(state, "runner", RUNNER_DECK);
    const rushHour = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        input.playerView.own.gripOrHq.some(
          (card) =>
            card.instanceId === action.payload?.cardId &&
            card.definitionId === RUSH_HOUR,
        ),
    );
    const evaluation = evaluateRunnerRunTargets({ input }).find(
      (entry) => entry.actionId === rushHour?.actionId,
    );
    const decision = chooseRunnerAction(input);

    expect(rushHour?.costs).toEqual(
      expect.arrayContaining([expect.objectContaining({ credits: 3 })]),
    );
    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_credit_cost:3",
        "credits_after_run_action:0",
      ]),
    );
    expect(decision.actionId).not.toBe(rushHour?.actionId);
  });

  it("keeps a safe productive central run above a non-acute one-card hand buffer", () => {
    const state = runnerTurnState("series-70be-hand-buffer-live-input");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(1)
      .withRunnerCredits(5);
    const input = decisionInput(state, "runner", RUNNER_DECK);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected).toMatchObject({
      type: "start_run",
      payload: { serverId: "rd" },
    });
    expect(decision.evidence).toContain("plan_module:runner.pressure_central");
  });

  it("keeps a visible immediate remote score threat as a hand-buffer override", () => {
    const state = runnerTurnState("series-70be-hand-buffer-score-threat");
    RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(1)
      .withRunnerCredits(10)
      .withCorpRemoteAgenda("remote_1", 2);
    const input = decisionInput(state, "runner", RUNNER_DECK);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected).toMatchObject({
      type: "start_run",
      payload: { serverId: "remote_1" },
    });
  });
});

const CORP_DECK = deck(DEMO_DECKS.demo_corp_001, "series-70be-corp-deck", [
  CORPORATE_WAR,
  SYSTEMATIC_LAYOFFS,
  CITY_SURVEILLANCE,
]);
const RUNNER_DECK = deck(
  DEMO_DECKS.demo_runner_001,
  "series-70be-runner-deck",
  [BROKER, RUSH_HOUR, PILE_DRIVER],
);

function corpMainState(seed: string): GameState {
  return applyByPredicate(
    createGameAfterSetup({
      seed,
      agendaPointsToWin: 7,
      corpDeck: CORP_DECK,
      runnerDeck: RUNNER_DECK,
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
}

function runnerTurnState(seed: string): GameState {
  let state = corpMainState(seed);
  state = applyByPredicate(
    state,
    "corp",
    (action) => action.type === "end_turn",
  );
  while (state.pendingChoice?.side === "corp") {
    state = applyByPredicate(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
  }
  return state;
}

function decisionInput(state: GameState, side: Side, ownDeck: DeckDefinition) {
  return buildAiDecisionInput(state, side, {
    decisionId: `series-70be:${state.matchId}:${state.stateVersion}:${side}`,
    profileId: `series-70be-${side}`,
    ownDeckSnapshot: snapshot(ownDeck),
  });
}

function applyDecision(
  state: GameState,
  side: Side,
  decision: AiDecision,
): GameState {
  const idempotencyKey = `series-70be:${side}:${state.stateVersion}`;
  const result =
    decision.selectionKind === "engine_randomized_ice_install_selection"
      ? applyRandomizedIceInstallSelection(state, {
          ...decision.engineCommand,
          idempotencyKey,
        })
      : decision.selectionKind === "engine_randomized_turn_plan_selection"
        ? applyRandomizedTurnPlanSelection(state, {
            ...decision.engineCommand,
            idempotencyKey,
          })
        : applyAction(state, {
            matchId: state.matchId,
            side,
            actionId: decision.actionId,
            clientKnownStateVersion: state.stateVersion,
            ...(decision.selectedChoices
              ? { selectedChoices: decision.selectedChoices }
              : {}),
            idempotencyKey,
          });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyByPredicate(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error(`Missing ${side} fixture action`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(action.type === "resolve_choice" && state.pendingChoice
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice.choiceId,
            selectedOptionIds: [String(state.pendingChoice.options[0]?.id)],
          },
        }
      : {}),
    idempotencyKey: `series-70be-fixture:${side}:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function deck(
  base: DeckDefinition,
  id: string,
  additions: string[],
): DeckDefinition {
  return {
    ...base,
    id,
    name: id,
    cards: [
      ...base.cards,
      ...additions.map((cardId) => ({ id: cardId, quantity: 1 })),
    ],
  };
}

function snapshot(deckDefinition: DeckDefinition): AiDeckStrategyDeckSnapshot {
  return {
    deckSnapshotId: `${deckDefinition.id}-snapshot`,
    side: deckDefinition.side,
    cards: deckDefinition.cards.map((card) => ({
      cardId: card.id,
      quantity: card.quantity,
    })),
  };
}
