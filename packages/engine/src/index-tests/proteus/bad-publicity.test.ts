import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  eventVisibilityForAction,
  getLegalActions,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  quoteCorpRezCost,
  replayEvents,
  validateDeckDefinition,
  validateGameState,
} from "../../index";
import { collectActiveModifiers } from "../../ability-engine/active-modifiers";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import {
  cardImplementationCoverageForDefinitionId,
} from "../../card-implementations/coverage";
import {
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import { buildPublicAbilitySchemaContext } from "../../mechanics/public-payload-schema";
import { publicContextForAction } from "../../public-context";
import {
  MECHANIC_SMOKE_CARD_IDS,
  MECHANIC_SMOKE_DECKS,
  MECHANIC_SMOKE_GAMES,
  ONR_V1_0_5K_FINAL_CARD_IDS,
  ONR_V1_0_6K_FINAL_CARD_IDS,
  ONR_V1_1_2K_FINAL_CARD_IDS,
  ONR_V1_2_3_FINAL_CARD_IDS,
  ONR_V1_6_1_FINAL_CARD_IDS,
  ONR_V1_6_2_FINAL_CARD_IDS,
  ONR_V1_6_3_FINAL_CARD_IDS,
  ONR_V1_7_0_FINAL_CARD_IDS,
  ONR_V1_7_1_FINAL_CARD_IDS,
  ONR_V1_7_2_FINAL_CARD_IDS,
  ONR_V1_8_0_FINAL_CARD_IDS,
  ONR_V1_8_1_FINAL_CARD_IDS,
  ONR_V1_9_0_FINAL_CARD_IDS,
  ONR_V1_9_1_FINAL_CARD_IDS,
  ONR_V1_9_2_FINAL_CARD_IDS,
  ONR_V1_9_3_FINAL_CARD_IDS,
  ONR_V1_9_4_FINAL_CARD_IDS,
  ONR_V1_9_5_FINAL_CARD_IDS,
  ONR_V1_9_6_FINAL_CARD_IDS,
  ONR_V1_9_7_FINAL_CARD_IDS,
  ONR_V1_9_8_FINAL_CARD_IDS,
  ONR_V1_9_9_FINAL_CARD_IDS,
  ONR_V1_0_5K_RUNNER_DECK,
  ONR_V1_0_5K_CORP_DECK,
  ONR_V1_0_6K_RUNNER_DECK,
  ONR_V1_0_6K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_2_3_RUNNER_DECK,
  ONR_V1_2_3_CORP_DECK,
  ONR_V1_6_1_RUNNER_DECK,
  ONR_V1_6_1_CORP_DECK,
  ONR_V1_6_2_RUNNER_DECK,
  ONR_V1_6_2_CORP_DECK,
  ONR_V1_6_3_RUNNER_DECK,
  ONR_V1_6_3_CORP_DECK,
  ONR_V1_7_0_RUNNER_DECK,
  ONR_V1_7_0_CORP_DECK,
  ONR_V1_7_1_RUNNER_DECK,
  ONR_V1_7_1_CORP_DECK,
  ONR_V1_7_2_RUNNER_DECK,
  ONR_V1_7_2_CORP_DECK,
  ONR_V1_8_0_RUNNER_DECK,
  ONR_V1_8_0_CORP_DECK,
  ONR_V1_8_1_RUNNER_DECK,
  ONR_V1_8_1_CORP_DECK,
  ONR_V1_9_0_RUNNER_DECK,
  ONR_V1_9_0_CORP_DECK,
  ONR_V1_9_1_RUNNER_DECK,
  ONR_V1_9_1_CORP_DECK,
  ONR_V1_9_2_RUNNER_DECK,
  ONR_V1_9_2_CORP_DECK,
  ONR_V1_9_3_RUNNER_DECK,
  ONR_V1_9_3_CORP_DECK,
  ONR_V1_9_4_RUNNER_DECK,
  ONR_V1_9_4_CORP_DECK,
  ONR_V1_9_5_RUNNER_DECK,
  ONR_V1_9_5_CORP_DECK,
  ONR_V1_9_6_RUNNER_DECK,
  ONR_V1_9_6_CORP_DECK,
  ONR_V1_9_7_RUNNER_DECK,
  ONR_V1_9_7_CORP_DECK,
  ONR_V1_9_8_RUNNER_DECK,
  ONR_V1_9_8_CORP_DECK,
  ONR_V1_9_9_RUNNER_DECK,
  ONR_V1_9_9_CORP_DECK,
  ONR_V1_RUNNER_DECK,
  ONR_V1_CORP_DECK,
  V094_RUNNER_DECK,
  V094_CORP_DECK,
  V111_CORP_DECK,
  V095_RUNNER_DECK,
  V095_CORP_DECK,
  v094DamageGame,
  onrV1Game,
  v105kCardReleaseGame,
  v106kCardReleaseGame,
  v112kCardReleaseGame,
  v123CardReleaseGame,
  v161CardReleaseGame,
  v162CardReleaseGame,
  v163CardReleaseGame,
  v170CardReleaseGame,
  v171CardReleaseGame,
  v172CardReleaseGame,
  v180CardReleaseGame,
  v181CardReleaseGame,
  v190CardReleaseGame,
  v191CardReleaseGame,
  v192CardReleaseGame,
  v193CardReleaseGame,
  v194CardReleaseGame,
  v195CardReleaseGame,
  v196CardReleaseGame,
  v197CardReleaseGame,
  v198CardReleaseGame,
  v199CardReleaseGame,
  v095ResourceGame,
  v096TraceGame,
  v097RunGame,
  v098IdentityGame,
  v099CounterHostingGame,
  installedResourceCorpTurn,
  originalsetReorderCounterRunlockGame,
  encounterIce,
  breakCurrentSubroutine,
  apply,
  applyChoice,
  applyChoices,
  mustAction,
  toRunnerTurn,
  toRunnerTurnFromCorpMain,
  sourceDefinition,
  agendaPoints,
  cardCounterAmount,
  setCardCounterForTest,
  choiceRequest,
  moveRunnerCardToGrip,
  scoreRunnerAgendaForTest,
  scoreCorpAgendaForTest,
  moveRunnerCardCopyToGrip,
  putRunnerCardOnTopOfStack,
  drawRunnerCardsForTest,
  moveCorpCardToHq,
  moveCorpCardCopyToHq,
  moveCorpCardToArchives,
  keepOnlyCorpHqCard,
  keepOnlyCorpHqCards,
  keepOnlyCorpArchivesCards,
  putCorpCardOnTopOfRd,
  putCorpIceOnServer,
  putCorpIceCopyOnServer,
  putCorpRootInRemote,
  installRunnerProgramForTest,
  installRunnerHardwareForTest,
  installRunnerResourceForTest,
  installRunnerProgramCopyForTest,
  emptyRunnerGripForTest,
  scoreTwoAgendasForTest,
  findCard,
  removeEverywhere,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";

import {
  expectCurrentRulesBaseline,
  continueRunAction,
  continueRunThroughMovement,
  continueRunThroughMovementWindow,
  enterEncounterFromMovementWindow,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("Proteus Phase 2b Scored-Agenda Bad Publicity", () => {
  const CHARITY_TAKEOVER = "onr_proteus_002_charity-takeover";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;
  const internalViewMarkers = /"cardInstances"|"privatePayload"/;

  function scoreCharityTakeover(
    seed: string,
    badPublicityBefore: number,
    agendaPointsToWin: number,
  ): {
    initial: GameState;
    beforeScore: GameState;
    state: GameState;
    scoreAction: LegalAction;
  } {
    let state = createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_1_2K_CORP_DECK,
        id: `${seed}_corp`,
        cards: [
          { id: CHARITY_TAKEOVER, quantity: 1 },
          ...ONR_V1_1_2K_CORP_DECK.cards,
        ],
      },
      agendaPointsToWin,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, CHARITY_TAKEOVER);
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.corp.badPublicity = badPublicityBefore;
    const initial = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === CHARITY_TAKEOVER,
    );
    for (let i = 0; i < 4; i += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === CHARITY_TAKEOVER,
      );
    }
    const scoreAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === CHARITY_TAKEOVER,
    );
    const beforeScore = structuredClone(state);
    state = apply(state, "corp", (action) => action.actionId === scoreAction.actionId);
    return { initial, beforeScore, state, scoreAction };
  }

  it("scores Charity Takeover for credits plus generic Bad Publicity", () => {
    const { initial, beforeScore, state, scoreAction } = scoreCharityTakeover(
      "proteus-phase-2b-charity-score",
      0,
      7,
    );

    expect(state.corp.credits).toBe(beforeScore.corp.credits + 9);
    expect(state.corp.badPublicity).toBe(1);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.winner).toBeNull();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: CHARITY_TAKEOVER,
      sourceDefinitionId: CHARITY_TAKEOVER,
      gainedCredits: 9,
      corpCreditsAfter: state.corp.credits,
      badPublicityAdded: 1,
      corpBadPublicityBefore: 0,
      corpBadPublicityAfter: 1,
      sourceVisibility: "public",
    });
    expect(state.eventLog.at(-1)?.publicPayload?.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "gain_credits",
        sourceDefinitionId: CHARITY_TAKEOVER,
        amount: 9,
      }),
      expect.objectContaining({
        kind: "add_bad_publicity",
        sourceDefinitionId: CHARITY_TAKEOVER,
        amount: 1,
      }),
    ]);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    expect(
      applyAction(beforeScore, {
        matchId: beforeScore.matchId,
        side: "runner",
        actionId: scoreAction.actionId,
        clientKnownStateVersion: beforeScore.stateVersion,
        idempotencyKey: "proteus-charity-score-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(beforeScore, {
        matchId: beforeScore.matchId,
        side: "corp",
        actionId: scoreAction.actionId,
        clientKnownStateVersion: beforeScore.stateVersion - 1,
        idempotencyKey: "proteus-charity-score-stale",
      }).ok,
    ).toBe(false);

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.errors).toEqual([]);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Bad-Publicity-7 primary over simultaneous Charity Takeover Corp win", () => {
    const { initial, state } = scoreCharityTakeover(
      "proteus-phase-2b-charity-bp-priority",
      6,
      1,
    );

    expect(agendaPoints(state, "corp")).toBeGreaterThanOrEqual(1);
    expect(state.corp.badPublicity).toBe(7);
    expect(state.phase).toBe("game_over");
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(getLegalActions(state, "corp")).toHaveLength(0);
    expect(getLegalActions(state, "runner")).toHaveLength(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      gameEndReason: "bad_publicity_7",
      badPublicityThreshold: 7,
      corpBadPublicityBefore: 6,
      corpBadPublicityAfter: 7,
      sourceVisibility: "public",
      sourceDefinitionId: CHARITY_TAKEOVER,
    });

    for (const side of ["runner", "corp"] as const) {
      const view = getPlayerView(state, side);
      expect(view.winner).toBe("runner");
      expect(view.gameEndReason).toBe("bad_publicity_7");
      expect(JSON.stringify(view)).not.toMatch(internalViewMarkers);
    }

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Phase 2c Direct Runner Event BP Damage", () => {
  const FAKED_HIT = "onr_proteus_108_faked-hit";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function fakedHitGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          cards: [{ id: FAKED_HIT, quantity: 1 }, ...ONR_V1_1_2K_RUNNER_DECK.cards],
        },
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
  }

  function playFakedHit(
    seed: string,
    badPublicityBefore: number,
    emptyGripBeforePlay = false,
  ): {
    initial: GameState;
    beforePlay: GameState;
    state: GameState;
    playAction: LegalAction;
  } {
    let state = fakedHitGame(seed);
    if (emptyGripBeforePlay) emptyRunnerGripForTest(state);
    moveRunnerCardToGrip(state, FAKED_HIT);
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.corp.badPublicity = badPublicityBefore;
    const initial = structuredClone(state);
    const playAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === FAKED_HIT,
    );
    const beforePlay = structuredClone(state);
    state = apply(state, "runner", (action) => action.actionId === playAction.actionId);
    return { initial, beforePlay, state, playAction };
  }

  it("plays Faked Hit as Bad Publicity plus unpreventable core damage", () => {
    const { initial, beforePlay, state, playAction } = playFakedHit(
      "proteus-phase-2c-faked-hit",
      0,
    );

    expect(state.corp.badPublicity).toBe(1);
    expect(state.runner.coreDamage).toBe(beforePlay.runner.coreDamage + 2);
    expect(state.runner.credits).toBe(beforePlay.runner.credits - 5);
    expect(state.winner).toBeNull();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: FAKED_HIT,
      badPublicityAdded: 1,
      corpBadPublicityBefore: 0,
      corpBadPublicityAfter: 1,
      damageResolved: true,
      damageType: "core",
      damageAmount: 2,
      unpreventableDamage: true,
      preventableDamage: false,
      coreDamageAfter: state.runner.coreDamage,
    });
    expect(state.eventLog.at(-1)?.publicPayload?.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "add_bad_publicity",
        sourceDefinitionId: FAKED_HIT,
        amount: 1,
      }),
      expect.objectContaining({
        kind: "damage",
        sourceDefinitionId: FAKED_HIT,
        damageType: "core",
        amount: 2,
        preventable: false,
      }),
    ]);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    expect(
      applyAction(beforePlay, {
        matchId: beforePlay.matchId,
        side: "corp",
        actionId: playAction.actionId,
        clientKnownStateVersion: beforePlay.stateVersion,
        idempotencyKey: "proteus-faked-hit-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(beforePlay, {
        matchId: beforePlay.matchId,
        side: "runner",
        actionId: playAction.actionId,
        clientKnownStateVersion: beforePlay.stateVersion - 1,
        idempotencyKey: "proteus-faked-hit-stale",
      }).ok,
    ).toBe(false);

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.errors).toEqual([]);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Bad-Publicity-7 primary over simultaneous Faked Hit flatline", () => {
    const { initial, state } = playFakedHit(
      "proteus-phase-2c-faked-hit-bp-flatline-priority",
      6,
      true,
    );

    expect(state.corp.badPublicity).toBe(7);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      gameEndReason: "bad_publicity_7",
      badPublicityThreshold: 7,
      corpBadPublicityBefore: 6,
      corpBadPublicityAfter: 7,
      damageResolved: true,
      damageType: "core",
      damageAmount: 2,
      flatline: true,
      unpreventableDamage: true,
    });
    expect(state.phase).toBe("game_over");
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(getLegalActions(state, "corp")).toHaveLength(0);
    expect(getLegalActions(state, "runner")).toHaveLength(0);

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Phase 2d Installed-Connection Bad Publicity Cost", () => {
  const POISONED_WATER_SUPPLY = "onr_proteus_117_poisoned-water-supply";
  const CONNECTION_A = "onr_v1_159_databroker";
  const CONNECTION_B = "onr_v1_161_fall-guy";
  const CONNECTION_C = "onr_v1_185_trauma-team";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function poisonedWaterSupplyGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          cards: [
            { id: POISONED_WATER_SUPPLY, quantity: 1 },
            { id: CONNECTION_A, quantity: 1 },
            { id: CONNECTION_B, quantity: 1 },
            { id: CONNECTION_C, quantity: 1 },
            ...ONR_V1_1_2K_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
  }

  function preparePoisonedWaterSupply(
    seed: string,
    installedConnections: readonly string[],
    badPublicityBefore = 0,
  ): {
    initial: GameState;
    beforePlay: GameState;
    state: GameState;
    playAction: LegalAction;
    installedIds: CardInstanceId[];
  } {
    let state = poisonedWaterSupplyGame(seed);
    const installedIds = installedConnections.map((definitionId) =>
      installRunnerResourceForTest(state, definitionId),
    );
    moveRunnerCardToGrip(state, POISONED_WATER_SUPPLY);
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.corp.badPublicity = badPublicityBefore;
    const initial = structuredClone(state);
    const playAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === POISONED_WATER_SUPPLY,
    );
    const beforePlay = structuredClone(state);
    state = apply(state, "runner", (action) => action.actionId === playAction.actionId);
    return { initial, beforePlay, state, playAction, installedIds };
  }

  function selectedOptionIdsForCards(
    state: GameState,
    cardIds: readonly CardInstanceId[],
  ): string[] {
    const choice = state.pendingChoice;
    if (!choice) throw new Error("Missing pending choice");
    return cardIds.map((cardId) => {
      const option = choice.options.find((candidate) => candidate.value === cardId);
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
  }

  it("requires two installed Runner connections before Poisoned Water Supply is legal", () => {
    const state = poisonedWaterSupplyGame("proteus-phase-2d-poisoned-gate");
    installRunnerResourceForTest(state, CONNECTION_A);
    moveRunnerCardToGrip(state, POISONED_WATER_SUPPLY);
    state.runner.credits = 10;
    state.runner.clicks = 4;

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) === POISONED_WATER_SUPPLY,
      ),
    ).toBe(false);
  });

  it("trashes exactly two installed connections before generic Bad Publicity", () => {
    const { initial, beforePlay, playAction, installedIds } =
      preparePoisonedWaterSupply(
        "proteus-phase-2d-poisoned-water-supply",
        [CONNECTION_A, CONNECTION_B],
        0,
      );
    let state = apply(
      beforePlay,
      "runner",
      (action) => action.actionId === playAction.actionId,
    );

    expect(state.runner.credits).toBe(beforePlay.runner.credits - 4);
    expect(state.corp.badPublicity).toBe(0);
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.runner_installed_connection_trash_bad_publicity",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: POISONED_WATER_SUPPLY,
      hiddenZoneBarrier: true,
      hiddenZoneAction:
        "card_implementation_runner_installed_connection_trash_bad_publicity",
      sourceDefinitionId: POISONED_WATER_SUPPLY,
      requiredConnectionTrashCount: 2,
      eligibleConnectionCount: 2,
      installedConnectionTrashChoiceOpened: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const wrongSide = applyAction(beforePlay, {
      matchId: beforePlay.matchId,
      side: "corp",
      actionId: playAction.actionId,
      clientKnownStateVersion: beforePlay.stateVersion,
      idempotencyKey: "proteus-poisoned-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(beforePlay, {
      matchId: beforePlay.matchId,
      side: "runner",
      actionId: playAction.actionId,
      clientKnownStateVersion: beforePlay.stateVersion - 1,
      idempotencyKey: "proteus-poisoned-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = applyChoices(state, "runner", selectedOptionIdsForCards(state, installedIds));
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of installedIds) {
      expect(state.runner.heap).toContain(cardId);
      expect(state.runner.rig.resources).not.toContain(cardId);
    }
    expect(state.corp.badPublicity).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction:
        "card_implementation_runner_installed_connection_trash_bad_publicity",
      sourceDefinitionId: POISONED_WATER_SUPPLY,
      trashedCount: 2,
      installedConnectionTrashCount: 2,
      badPublicityAdded: 1,
      corpBadPublicityBefore: 0,
      corpBadPublicityAfter: 1,
      installedConnectionTrashChoiceResolved: true,
    });
    expect(state.eventLog.at(-1)?.publicPayload?.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "add_bad_publicity",
        sourceDefinitionId: POISONED_WATER_SUPPLY,
        amount: 1,
      }),
    ]);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.errors).toEqual([]);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rejects invalid or drifted connection choices during revalidation", () => {
    const { state, installedIds } = preparePoisonedWaterSupply(
      "proteus-phase-2d-poisoned-choice-revalidation",
      [CONNECTION_A, CONNECTION_B, CONNECTION_C],
      0,
    );
    const choiceAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const oneSelection = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-poisoned-one-selection",
      selectedChoices: {
        selectedOptionIds: selectedOptionIdsForCards(state, [installedIds[0]!]),
      },
    });
    expect(oneSelection.ok).toBe(false);

    const drifted = structuredClone(state);
    removeEverywhere(drifted, installedIds[1]!);
    const driftedSelection = applyAction(drifted, {
      matchId: drifted.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: drifted.stateVersion,
      idempotencyKey: "proteus-poisoned-drifted-selection",
      selectedChoices: {
        selectedOptionIds: selectedOptionIdsForCards(state, [
          installedIds[0]!,
          installedIds[1]!,
        ]),
      },
    });
    expect(driftedSelection.ok).toBe(false);
  });

  it("keeps Bad-Publicity-7 primary after Poisoned Water Supply choice resolves", () => {
    const { initial, state: opened, installedIds } = preparePoisonedWaterSupply(
      "proteus-phase-2d-poisoned-bp-priority",
      [CONNECTION_A, CONNECTION_B],
      6,
    );
    const state = applyChoices(
      opened,
      "runner",
      selectedOptionIdsForCards(opened, installedIds),
    );

    expect(state.corp.badPublicity).toBe(7);
    expect(state.phase).toBe("game_over");
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      gameEndReason: "bad_publicity_7",
      badPublicityThreshold: 7,
      corpBadPublicityBefore: 6,
      corpBadPublicityAfter: 7,
      sourceDefinitionId: POISONED_WATER_SUPPLY,
    });

    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Bad-Publicity-7+ engine harness", () => {
  function playBadPublicityHarnessOperation(seed: string, badPublicityBefore: number) {
    let state = v099CounterHostingGame(seed);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v099_bad_publicity_operation");
    keepOnlyCorpHqCards(state, state.corp.hq.slice(0, 1));
    state.corp.credits = 0;
    state.corp.badPublicity = badPublicityBefore;
    const initial = structuredClone(state);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v099_bad_publicity_operation",
    );
    return { initial, state, event: state.eventLog.at(-1) };
  }

  it("P-BP-T001/T002 gates 7+ Bad Publicity and leaves 6 below game over", () => {
    const terminal = playBadPublicityHarnessOperation("proteus-bp-t001", 6);
    expect(terminal.state.corp.badPublicity).toBe(7);
    expect(terminal.state.phase).toBe("game_over");
    expect(terminal.state.winner).toBe("runner");
    expect(terminal.state.gameEndReason).toBe("bad_publicity_7");
    expect(getLegalActions(terminal.state, "corp")).toHaveLength(0);
    expect(getLegalActions(terminal.state, "runner")).toHaveLength(0);
    expect(terminal.event?.publicPayload).toMatchObject({
      gameEndReason: "bad_publicity_7",
      badPublicityThreshold: 7,
      corpBadPublicityBefore: 6,
      corpBadPublicityAfter: 7,
      sourceVisibility: "public",
    });

    const nonTerminal = playBadPublicityHarnessOperation("proteus-bp-t002", 5);
    expect(nonTerminal.state.corp.badPublicity).toBe(6);
    expect(nonTerminal.state.winner).toBeNull();
    expect(nonTerminal.state.phase).not.toBe("game_over");
    expect(getLegalActions(nonTerminal.state, "corp").length).toBeGreaterThan(0);
  });

  it("P-BP-T003/T004 prioritizes Bad Publicity over simultaneous agenda outcomes", () => {
    const corpAgendaState = createGameAfterSetup({
      seed: "proteus-bp-t003",
      agendaPointsToWin: 1,
    });
    scoreCorpAgendaForTest(corpAgendaState, "simple_agenda");
    corpAgendaState.corp.badPublicity = 7;
    checkWinConditions(corpAgendaState);
    expect(agendaPoints(corpAgendaState, "corp")).toBeGreaterThanOrEqual(1);
    expect(corpAgendaState.winner).toBe("runner");
    expect(corpAgendaState.gameEndReason).toBe("bad_publicity_7");

    const runnerAgendaState = createGameAfterSetup({
      seed: "proteus-bp-t004",
      agendaPointsToWin: 1,
    });
    scoreRunnerAgendaForTest(runnerAgendaState, "simple_agenda");
    runnerAgendaState.corp.badPublicity = 7;
    checkWinConditions(runnerAgendaState);
    expect(agendaPoints(runnerAgendaState, "runner")).toBeGreaterThanOrEqual(1);
    expect(runnerAgendaState.winner).toBe("runner");
    expect(runnerAgendaState.gameEndReason).toBe("bad_publicity_7");
  });

  it("P-BP-T005/T006 keeps Bad Publicity primary against flatline and Corp deckout", () => {
    const flatlineState = createGameAfterSetup({ seed: "proteus-bp-t005" });
    flatlineState.winner = "corp";
    flatlineState.gameEndReason = "flatline";
    flatlineState.phase = "game_over";
    flatlineState.corp.badPublicity = 7;
    checkWinConditions(flatlineState);
    expect(flatlineState.winner).toBe("runner");
    expect(flatlineState.gameEndReason).toBe("bad_publicity_7");

    const deckoutState = createGameAfterSetup({ seed: "proteus-bp-t006" });
    deckoutState.winner = "runner";
    deckoutState.gameEndReason = "corp_deck_empty";
    deckoutState.phase = "game_over";
    deckoutState.corp.badPublicity = 7;
    checkWinConditions(deckoutState);
    expect(deckoutState.winner).toBe("runner");
    expect(deckoutState.gameEndReason).toBe("bad_publicity_7");
  });

  it("P-BP-T007/T010 keeps public payloads and PlayerViews free of hidden or Proteus-only data", () => {
    const { state, event } = playBadPublicityHarnessOperation("proteus-bp-t007-t010", 6);
    const publicPayloadJson = JSON.stringify(event?.publicPayload);
    expect(publicPayloadJson).toContain("bad_publicity_7");
    expect(publicPayloadJson).not.toContain("onr_proteus_");
    expect(publicPayloadJson).not.toContain("cardInstances");
    expect(publicPayloadJson).not.toContain("privatePayload");

    for (const side of ["runner", "corp"] as const) {
      const view = getPlayerView(state, side);
      expect(view.winner).toBe("runner");
      expect(view.gameEndReason).toBe("bad_publicity_7");
      expect(view.legalActions).toHaveLength(0);
      const corpIdentity =
        side === "runner" ? view.opponent.identity : view.own.identity;
      expect(corpIdentity.counterDisplays).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "bad_publicity",
            amount: 7,
            displayKind: "bad_publicity",
            counterType: "bad_publicity",
            label: "Bad Publicity",
          }),
        ]),
      );
      const viewJson = JSON.stringify(view);
      expect(viewJson).not.toContain("onr_proteus_");
      expect(viewJson).not.toContain("cardInstances");
      expect(viewJson).not.toContain("privatePayload");
    }
  });

  it("P-BP-T008/T009 is deterministic, replayable and StateHash-stable", () => {
    const { initial, state } = playBadPublicityHarnessOperation("proteus-bp-t008-t009", 6);
    expect(state.randomCounter).toBe(initial.randomCounter);
    expect(state.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(hashState(state)).toMatch(/^fnv1a:/);

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
    expect(replay.state.gameEndReason).toBe("bad_publicity_7");
  });
});
