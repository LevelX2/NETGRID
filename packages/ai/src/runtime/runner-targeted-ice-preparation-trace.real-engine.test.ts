import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
  type TraceRulesProfile,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { runnerTargetedBypassPlanCommitment } from "../runner/run-window/runner-targeted-bypass-plan";
import { reconstructBeliefState } from "../belief-state";
import { evaluateKnownCentralAccessPayoff } from "../known-central-access-payoff";
import { runnerVisibleSearchCoverageNeed } from "../runner/rig-coverage/runner-search-coverage-need";
import { buildAiDecisionInput } from "./ai-decision-input";
import { scoringWindowPostRezProtectionAssessment } from "./corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure";
import { runnerTargetedIceTrashPlanCommitment } from "./runner-targeted-ice-trash-plan";

const wall = 491;
const rex = 476;
const socialEngineering = 323;
const jettisonIce = 292;

function addCards(deck: DeckDefinition, ...ids: number[]): DeckDefinition {
  return {
    ...deck,
    cards: [
      ...deck.cards,
      ...ids
        .filter((id) => !deck.cards.some((card) => card.id === id))
        .map((id) => ({ id, quantity: 1 })),
    ],
  };
}

function take(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  if (!action)
    throw new Error("Expected a legal action at " + state.timingPoint);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: state.stateVersion + ":" + action.actionId,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function setup(traceRulesProfile: TraceRulesProfile) {
  const runnerDeck = addCards(
    DEMO_DECKS.demo_runner_001,
    socialEngineering,
    jettisonIce,
  );
  const corpDeck = addCards(DEMO_DECKS.demo_corp_001, rex, wall);
  let state = createGameAfterSetup({
    seed: "review8",
    traceRulesProfile,
    corpDeck,
    runnerDeck,
  });
  state = take(state, "corp", (action) => action.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
  state = take(state, "corp", (action) => action.type === "end_turn");
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(socialEngineering)
    .withRunnerCardInGrip(jettisonIce)
    .withCorpCredits(3)
    .withRunnerCredits(12)
    .withRezzedCorpIceOnServer("rd", wall)
    .withRezzedCorpIceOnServer("rd", rex);
  state = take(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  const runnerRunActions = [
    "continue_run",
    "access_card",
    "decline_trash",
    "steal_agenda",
    "pass_priority",
  ];
  for (let step = 0; step < 12 && state.run; step++) {
    const runnerActions = getLegalActions(state, "runner");
    const next = runnerRunActions.find((type) =>
      runnerActions.some((action) => action.type === type),
    );
    state = next
      ? take(state, "runner", (action) => action.type === next)
      : take(state, "corp", (action) =>
          ["pass_priority", "no_rez", "continue_run"].includes(action.type),
        );
  }
  expect(state.run).toBeFalsy();
  expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.flatMap(({ instanceId, definitionId }) =>
        definitionId ? [[instanceId, definitionId]] : [],
      ),
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const bypass = candidates.find(
    (c) => c.sourceDefinitionId === socialEngineering,
  );
  const trash = candidates.find((c) => c.sourceDefinitionId === jettisonIce);
  const wallId = input.playerView.servers
    .find(({ id }) => id === "rd")
    ?.ice.find(({ definitionId }) => definitionId === wall)?.instanceId;
  if (!bypass || !trash || !wallId)
    throw new Error("Expected both offers and Wall of Static");
  const planTargets = [
    {
      ownerModuleId: "runner.pressure_central" as const,
      ownerDedupeKey: "central:rd",
      serverId: "rd",
      payoffValue: 250,
    },
  ];
  return { input, bypass, trash, wallId, planTargets, state, corpDeck };
}

describe("trace-aware Runner ICE preparation", () => {
  it("rejects both commitments when the remaining Rex can stop access under Classic", () => {
    const { input, bypass, trash, planTargets } = setup("classic_blind");
    expect(
      runnerTargetedBypassPlanCommitment({
        input,
        candidate: bypass,
        planTargets,
      }),
    ).toBeUndefined();
    expect(
      runnerTargetedIceTrashPlanCommitment({
        input,
        candidate: trash,
        planTargets,
      }),
    ).toBeUndefined();
  });

  it("keeps the authored preparations and exact target under Modern", () => {
    const { input, bypass, trash, wallId, planTargets } = setup("modern_open");
    expect(
      runnerTargetedBypassPlanCommitment({
        input,
        candidate: bypass,
        planTargets,
      }),
    ).toMatchObject({
      sourceActionId: bypass.actionId,
      ownerModuleId: "runner.pressure_central",
      serverId: "rd",
      visibleIceInstanceId: wallId,
    });
    expect(
      runnerTargetedIceTrashPlanCommitment({
        input,
        candidate: trash,
        planTargets,
      }),
    ).toMatchObject({
      sourceActionId: trash.actionId,
      ownerModuleId: "runner.pressure_central",
      serverId: "rd",
      targetIceInstanceId: wallId,
    });
  });

  it("reports a missing rules binding on the visible Trace path", () => {
    const { input, bypass, trash, planTargets } = setup("classic_blind");
    delete input.playerView.traceRulesProfile;
    expect(() =>
      runnerTargetedBypassPlanCommitment({
        input,
        candidate: bypass,
        planTargets,
      }),
    ).toThrow(
      expect.objectContaining({ code: "invalid_player_view_card_projection" }),
    );
    expect(() =>
      runnerTargetedIceTrashPlanCommitment({
        input,
        candidate: trash,
        planTargets,
      }),
    ).toThrow(
      expect.objectContaining({ code: "invalid_player_view_card_projection" }),
    );
  });
});

describe("trace rules shared by Runner and Corp quotes", () => {
  it("requires a rules binding from the Runner Coverage and known-payoff producers", () => {
    const { input } = setup("classic_blind");
    const belief = reconstructBeliefState(input);
    const model = belief.runnerOpponentModel;
    if (!model) throw new Error("Expected Runner opponent model");
    model.rndTopFreshness = {
      ...model.rndTopFreshness,
      freshness: "stale_known_same_top",
      knownTopDefinitionId: wall,
    };

    expect(() => runnerVisibleSearchCoverageNeed(input)).not.toThrow();
    expect(
      evaluateKnownCentralAccessPayoff(input, "rd", belief).evidence,
    ).toContain("rnd_freshness:stale_known_same_top");

    delete input.playerView.traceRulesProfile;
    for (const quote of [
      () => runnerVisibleSearchCoverageNeed(input),
      () => evaluateKnownCentralAccessPayoff(input, "rd", belief),
    ]) {
      expect(quote).toThrow(
        expect.objectContaining({
          code: "invalid_player_view_card_projection",
        }),
      );
    }
  });

  it.each([
    ["classic_blind", false],
    ["modern_open", true],
  ] as const)(
    "uses %s and the Corp's post-rez bid budget",
    (profile, canAccess) => {
      const { state, corpDeck } = setup(profile);
      RealEngineFixtureBuilder.forState(state)
        .withCorpCredits(7)
        .withCorpIceOnServer("r1", rex);
      const input = buildAiDecisionInput(state, "corp", {
        ownDeckSnapshot: {
          deckSnapshotId: corpDeck.id,
          side: "corp",
          cards: corpDeck.cards.map(({ id, quantity }) => ({
            cardId: id,
            quantity,
          })),
        },
      });
      const remote = input.playerView.servers.find(
        ({ id }) => id === "r1",
      );
      const ice = remote?.ice.find(({ definitionId }) => definitionId === rex);
      expect(ice?.effectivePostRezRunQuote?.complete).toBe(true);
      expect(
        scoringWindowPostRezProtectionAssessment(input, remote),
      ).toMatchObject({
        runnerCanReachAccessNow: canAccess,
        evidence: expect.arrayContaining([
          "corp_post_rez_budget:financed:" + ice?.instanceId,
          "corp_post_rez_budget:remaining:3",
        ]),
      });
      if (profile === "classic_blind") {
        expect(
          scoringWindowPostRezProtectionAssessment(input, remote, 0, 7, 3),
        ).toMatchObject({ runnerCanReachAccessNow: true });
        delete input.playerView.traceRulesProfile;
        expect(() =>
          scoringWindowPostRezProtectionAssessment(input, remote),
        ).toThrow(
          expect.objectContaining({
            code: "invalid_player_view_card_projection",
          }),
        );
      }
    },
  );
});
