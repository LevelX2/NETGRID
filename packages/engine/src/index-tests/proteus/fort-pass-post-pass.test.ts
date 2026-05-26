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

describe("Proteus Public Fort Pass Windows", () => {
  const LESLEY = "onr_proteus_062_lesley-major";
  const RASMIN = "onr_proteus_070_rasmin-bridger";
  const AGENDA = "onr_v1_203_hostile-takeover";
  const ICE = "simple_barrier_ice";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusFortPassGame(seed: string): GameState {
    const corpOverrideIds = new Set([LESLEY, RASMIN, AGENDA, ICE]);
    return createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_6_2_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_6_2_CORP_DECK,
        id: `${seed}_corp`,
        cards: [
          { id: LESLEY, quantity: 1 },
          { id: RASMIN, quantity: 1 },
          { id: AGENDA, quantity: 1 },
          { id: ICE, quantity: 1 },
          ...ONR_V1_6_2_CORP_DECK.cards.filter(
            (card) => !corpOverrideIds.has(card.id),
          ),
        ],
      },
      agendaPointsToWin: 7,
    });
  }

  function setRezzed(state: GameState, cardId: CardInstanceId): void {
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      faceup: true,
      rezzed: true,
    };
  }

  function startRunAndPassUnrezzedIce(
    state: GameState,
  ): GameState {
    state = apply(
      toRunnerTurnFromCorpMain(state),
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    return apply(state, "corp", (action) => action.type === "decline_rez");
  }

  it("lets Lesley Major add counters after the last ICE is passed once per run", () => {
    let state = proteusFortPassGame("proteus-phase-1d-lesley");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    const lesleyId = putCorpRootInRemote(state, LESLEY);
    const agendaId = putCorpRootInRemote(state, AGENDA);
    putCorpIceOnServer(state, "remote_1", ICE);
    setRezzed(state, lesleyId);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = startRunAndPassUnrezzedIce(state);
    const lesleyAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.source === lesleyId &&
        action.payload?.targetCardId === agendaId,
    );
    expect(lesleyAction.costs).toEqual([{ credits: 5 }]);
    expect(lesleyAction.payload).toMatchObject({
      fortRunWindowAbility:
        "add_advancement_counters_after_passing_last_ice_on_this_fort",
      serverId: "remote_1",
      targetCardDefinitionId: AGENDA,
    });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: lesleyAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-lesley-wrong-side",
      }).ok,
    ).toBe(false);
    const noCredits = structuredClone(state);
    noCredits.corp.credits = 4;
    expect(
      applyAction(noCredits, {
        matchId: noCredits.matchId,
        side: "corp",
        actionId: lesleyAction.actionId,
        clientKnownStateVersion: noCredits.stateVersion,
        idempotencyKey: "proteus-lesley-cost",
      }).ok,
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === lesleyAction.actionId,
    );
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(2);
    expect(state.corp.credits).toBe(5);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.source === lesleyId,
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      sourceDefinitionId: LESLEY,
      targets: { targetCardDefinitionId: AGENDA },
      amounts: { addedCounterAmount: 2 },
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("forces Rasmin Bridger pay-or-end-run after each passed ICE", () => {
    let state = proteusFortPassGame("proteus-phase-1d-rasmin");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.credits = 2;
    state.corp.credits = 10;
    const rasminId = putCorpRootInRemote(state, RASMIN);
    putCorpIceOnServer(state, "remote_1", ICE);
    setRezzed(state, rasminId);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = startRunAndPassUnrezzedIce(state);
    expect(getLegalActions(state, "corp")).toEqual([]);
    const payAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.fortRunWindowAbility ===
          "runner_pay_or_end_run_after_passing_ice_on_this_fort" &&
        action.payload?.decision === "pay",
    );
    expect(payAction.costs).toEqual([{ credits: 1 }]);
    expect(payAction.payload).toMatchObject({
      sourceDefinitionIds: RASMIN,
      serverId: "remote_1",
      paymentAmount: 1,
    });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: payAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-rasmin-wrong-side",
      }).ok,
    ).toBe(false);

    const broke = structuredClone(state);
    broke.runner.credits = 0;
    expect(
      getLegalActions(broke, "runner").some(
        (action) => action.payload?.decision === "pay",
      ),
    ).toBe(false);
    const endAction = mustAction(
      broke,
      "runner",
      (action) => action.payload?.decision === "end_run",
    );
    const endResult = applyAction(broke, {
      matchId: broke.matchId,
      side: "runner",
      actionId: endAction.actionId,
      clientKnownStateVersion: broke.stateVersion,
      idempotencyKey: "proteus-rasmin-end",
    });
    expect(endResult.ok).toBe(true);
    expect(endResult.state.run).toBeUndefined();

    state = apply(state, "runner", (action) => action.actionId === payAction.actionId);
    expect(state.runner.credits).toBe(1);
    expect(state.run).toBeDefined();
    expect(state.run?.postPassPayOrEndRun).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: RASMIN,
      amounts: { paidCredits: 1 },
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Phase 1g Post-Pass Derez Utility", () => {
  const DISINTEGRATOR = "onr_proteus_085_disintegrator";
  const ICE = "simple_barrier_ice";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusDisintegratorGame(seed: string): GameState {
    const runnerOverrideIds = new Set([DISINTEGRATOR, "simple_fracter"]);
    const corpOverrideIds = new Set([ICE]);
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          id: `${seed}_runner`,
          cards: [
            { id: DISINTEGRATOR, quantity: 1 },
            { id: "simple_fracter", quantity: 1 },
            ...ONR_V1_6_2_RUNNER_DECK.cards.filter(
              (card) => !runnerOverrideIds.has(card.id),
            ),
          ],
        },
        corpDeck: {
          ...ONR_V1_6_2_CORP_DECK,
          id: `${seed}_corp`,
          cards: [
            { id: ICE, quantity: 1 },
            ...ONR_V1_6_2_CORP_DECK.cards.filter(
              (card) => !corpOverrideIds.has(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  function passFullyBrokenIce(state: GameState): {
    state: GameState;
    iceId: CardInstanceId;
  } {
    installRunnerProgramForTest(state, "simple_fracter");
    installRunnerProgramForTest(state, DISINTEGRATOR);
    const iceId = putCorpIceOnServer(state, "rd", ICE);
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && sourceDefinition(state, action) === ICE,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    return { state, iceId };
  }

  it("derezzes the just-passed fully-broken ICE and ends the run", () => {
    let state = proteusDisintegratorGame("proteus-phase-1g-disintegrator");
    state.runner.credits = 10;
    state.corp.credits = 10;

    const passed = passFullyBrokenIce(state);
    state = passed.state;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const disintegratorAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "derez_fully_broken_passed_ice_and_end_run",
    );
    expect(disintegratorAction.payload?.targetIceId).toBe(passed.iceId);
    expect(disintegratorAction.costs).toEqual([{ credits: 2 }]);

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: disintegratorAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-disintegrator-wrong-side",
      }).ok,
    ).toBe(false);
    const broke = structuredClone(state);
    broke.runner.credits = 1;
    expect(
      applyAction(broke, {
        matchId: broke.matchId,
        side: "runner",
        actionId: disintegratorAction.actionId,
        clientKnownStateVersion: broke.stateVersion,
        idempotencyKey: "proteus-disintegrator-cost",
      }).ok,
    ).toBe(false);
    const staleTarget = structuredClone(state);
    staleTarget.cardInstances[passed.iceId] = {
      ...staleTarget.cardInstances[passed.iceId]!,
      rezzed: false,
    };
    expect(
      applyAction(staleTarget, {
        matchId: staleTarget.matchId,
        side: "runner",
        actionId: disintegratorAction.actionId,
        clientKnownStateVersion: staleTarget.stateVersion,
        idempotencyKey: "proteus-disintegrator-stale-target",
      }).ok,
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === disintegratorAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.cardInstances[passed.iceId]?.rezzed).toBe(false);
    expect(state.runner.credits).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      runnerUtilityAbility: "derez_fully_broken_passed_ice_and_end_run",
      sourceDefinitionId: DISINTEGRATOR,
      targetCardDefinitionId: ICE,
      derezzedCount: 1,
      endedRun: true,
      paidCredits: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.errors).toEqual([]);
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not offer Disintegrator outside the fully-broken post-pass window", () => {
    let state = proteusDisintegratorGame("proteus-phase-1g-disintegrator-window");
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "simple_fracter");
    installRunnerProgramForTest(state, DISINTEGRATOR);
    putCorpIceOnServer(state, "rd", ICE);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.runnerUtilityAbility ===
          "derez_fully_broken_passed_ice_and_end_run",
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && sourceDefinition(state, action) === ICE,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.runnerUtilityAbility ===
          "derez_fully_broken_passed_ice_and_end_run",
      ),
    ).toBe(false);
  });
});
