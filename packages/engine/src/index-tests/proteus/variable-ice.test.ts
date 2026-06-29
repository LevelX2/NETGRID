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
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
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

describe("Proteus Phase 3a Variable ICE Foundation", () => {
  const DIGICONDA = "onr_proteus_020_digiconda";
  const FOOD_FIGHT = "onr_proteus_022_food-fight";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusVariableIceGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          name: "Proteus Variable ICE Harness Runner",
          cards: [
            { id: "simple_killer", quantity: 1 },
            ...ONR_V1_1_2K_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: `${seed}_corp`,
          name: "Proteus Variable ICE Harness Corp",
          cards: [
            { id: DIGICONDA, quantity: 1 },
            { id: FOOD_FIGHT, quantity: 1 },
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  it("offers Digiconda X rez variants, persists strength and rejects manipulated values", () => {
    for (const x of [0, 3, 6]) {
      let state = proteusVariableIceGame(`proteus-variable-digiconda-${x}`);
      state.corp.credits = 12;
      const iceId = putCorpIceOnServer(state, "rd", DIGICONDA);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rezActions = getLegalActions(state, "corp").filter(
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.variableRezKind === "x_strength",
      );
      expect(
        rezActions.map((action) => action.payload?.variableRezValue),
      ).toEqual([0, 1, 2, 3, 4, 5, 6]);
      const rezAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.variableRezValue === x,
      );
      expect(rezAction.costs).toEqual([{ credits: 6 + x }]);
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: rezAction.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(wrongSide.ok).toBe(false);
      if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
      const fakeX7 = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: rezAction.actionId.replace(
          `.x_strength.${x}.${x}`,
          ".x_strength.7.7",
        ),
        clientKnownStateVersion: state.stateVersion,
      });
      expect(fakeX7.ok).toBe(false);
      const lowCredits = structuredClone(state);
      lowCredits.corp.credits = 5 + x;
      const lowCreditResult = applyAction(lowCredits, {
        matchId: lowCredits.matchId,
        side: "corp",
        actionId: rezAction.actionId,
        clientKnownStateVersion: lowCredits.stateVersion,
      });
      expect(lowCreditResult.ok).toBe(false);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (action) => action.actionId === rezAction.actionId,
      );
      expect(state.cardInstances[iceId]?.variableIceState).toEqual({
        family: "x_strength",
        additionalCostPaid: x,
        value: x,
        cap: 6,
        strength: x,
      });
      expect(getPlayerView(state, "runner").run?.encounteredIce).toMatchObject({
        definitionId: DIGICONDA,
        title: "Digiconda",
        rezzed: true,
        strength: x,
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "rez_ice",
        cardDefinitionId: DIGICONDA,
        title: "Digiconda",
        baseRezCost: 6,
        variableRezAdditionalCost: x,
        variableRezValue: x,
        variableRezCap: 6,
        rezCostPaid: 6 + x,
        effectiveStrengthAfterRez: x,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("persists Food Fight paid ETR subroutines for views, breaking and replay", () => {
    for (const [additionalCost, subroutineCount] of [
      [0, 0],
      [2, 1],
      [6, 3],
    ] as const) {
      let state = proteusVariableIceGame(
        `proteus-variable-food-fight-${additionalCost}`,
      );
      state.corp.credits = 12;
      const killerId =
        subroutineCount > 0
          ? installRunnerProgramForTest(state, "simple_killer")
          : undefined;
      if (killerId) state.runner.credits = 10;
      const iceId = putCorpIceOnServer(state, "rd", FOOD_FIGHT);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        "variable_paid_etr_subroutines",
      );
      const rezAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.variableRezAdditionalCost === additionalCost,
      );
      const oddFake = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: rezAction.actionId.replace(
          `.paid_end_the_run_subroutines.${additionalCost}.${subroutineCount}`,
          `.paid_end_the_run_subroutines.${additionalCost + 1}.${subroutineCount}`,
        ),
        clientKnownStateVersion: state.stateVersion,
      });
      expect(oddFake.ok).toBe(false);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (action) => action.actionId === rezAction.actionId,
      );
      expect(state.cardInstances[iceId]?.variableIceState).toEqual({
        family: "paid_end_the_run_subroutines",
        additionalCostPaid: additionalCost,
        value: subroutineCount,
        subroutineCount,
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "rez_ice",
        cardDefinitionId: FOOD_FIGHT,
        title: "Food Fight",
        baseRezCost: 4,
        variableRezAdditionalCost: additionalCost,
        variableRezValue: subroutineCount,
        rezCostPaid: 4 + additionalCost,
        effectiveSubroutineCountAfterRez: subroutineCount,
      });
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DIGICONDA,
      );
      if (subroutineCount > 0) {
        while (
          getPlayerView(state, "runner").own.rig?.find(
            (card) => card.instanceId === killerId,
          )?.strength !== 3
        ) {
          state = apply(
            state,
            "runner",
            (action) =>
              action.type === "pump_breaker" &&
              action.payload?.breakerId === killerId,
          );
        }
        const breakAction = mustAction(
          state,
          "runner",
          (action) =>
            action.type === "break_subroutine" &&
            action.payload?.iceId === iceId &&
            action.payload?.subroutineIndex === subroutineCount - 1,
        );
        state = apply(
          state,
          "runner",
          (action) => action.actionId === breakAction.actionId,
        );
        expect(state.run?.brokenSubroutineIndexes).toContain(
          subroutineCount - 1,
        );
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          actionType: "break_subroutine",
          targetIceDefinitionId: FOOD_FIGHT,
          subroutineIndex: subroutineCount - 1,
        });
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("Proteus Phase 3b Variable Cost/Strength/Subtype ICE", () => {
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;
  const phase3bCards = [
    "onr_proteus_013_caryatid",
    "onr_proteus_017_credit-blocks",
    "onr_proteus_023_galatea",
    "onr_proteus_024_gatekeeper",
    "onr_proteus_025_homing-missile",
    "onr_proteus_028_lesser-arcana",
    "onr_proteus_036_sandstorm",
    "onr_proteus_039_sphinx-2006",
    "onr_proteus_040_sumo-2008",
  ];

  function proteusPhase3bGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          name: "Proteus Phase 3b Runner",
          cards: [
            { id: "simple_decoder", quantity: 1 },
            { id: "simple_killer", quantity: 1 },
            { id: "onr_v1_021_dwarf", quantity: 1 },
            ...ONR_V1_1_2K_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: `${seed}_corp`,
          name: "Proteus Phase 3b Corp",
          cards: [
            ...phase3bCards.map((id) => ({ id, quantity: 1 })),
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  function pumpUntilBreakerCanBreak(
    state: GameState,
    breakerId: CardInstanceId,
  ): GameState {
    while (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          action.payload?.breakerId === breakerId,
      ) &&
      !getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === breakerId,
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          action.payload?.breakerId === breakerId,
      );
    }
    return state;
  }

  it("stores alternate subtype rez choices and uses them for views and break projection", () => {
    const cases = [
      ["onr_proteus_013_caryatid", "code_gate", "simple_decoder", 1],
      ["onr_proteus_017_credit-blocks", "wall", "onr_v1_021_dwarf", 1],
      ["onr_proteus_023_galatea", "code_gate", "simple_decoder", 1],
      ["onr_proteus_028_lesser-arcana", "wall", "onr_v1_021_dwarf", 1],
      ["onr_proteus_039_sphinx-2006", "sentry", "simple_killer", 4],
      ["onr_proteus_040_sumo-2008", "wall", "onr_v1_021_dwarf", 1],
    ] as const;

    for (const [
      iceDefinitionId,
      selectedSubtype,
      breakerDefinitionId,
      extraCost,
    ] of cases) {
      let state = proteusPhase3bGame(
        `proteus-phase-3b-subtype-${iceDefinitionId}`,
      );
      state.corp.credits = 20;
      state.runner.credits = 20;
      const breakerId = installRunnerProgramForTest(state, breakerDefinitionId);
      const iceId = putCorpIceOnServer(state, "rd", iceDefinitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rezActions = getLegalActions(state, "corp").filter(
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.variableRezKind === "alternate_subtype",
      );
      expect(
        rezActions.map((action) => action.payload?.selectedSubtypesAfterRez),
      ).toContain(selectedSubtype);
      const rezAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.selectedSubtypesAfterRez === selectedSubtype,
      );
      expect(rezAction.payload?.variableRezAdditionalCost).toBe(extraCost);
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: rezAction.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      expect(wrongSide.ok).toBe(false);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (action) => action.actionId === rezAction.actionId,
      );
      expect(state.cardInstances[iceId]?.variableIceState).toMatchObject({
        family: "alternate_subtype",
        additionalCostPaid: extraCost,
        value: 1,
        selectedSubtypes: [selectedSubtype],
      });
      expect(
        getPlayerView(state, "runner").run?.encounteredIce?.subtypes,
      ).toEqual([selectedSubtype]);
      state = pumpUntilBreakerCanBreak(state, breakerId);
      const breakAction = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === breakerId &&
          action.payload?.iceId === iceId,
      );
      expect(breakAction.payload?.targetIceDefinitionId).toBe(iceDefinitionId);
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("reuses paid ETR variable rez for Gatekeeper and Sandstorm", () => {
    for (const iceDefinitionId of [
      "onr_proteus_024_gatekeeper",
      "onr_proteus_036_sandstorm",
    ] as const) {
      let state = proteusPhase3bGame(
        `proteus-phase-3b-paid-etr-${iceDefinitionId}`,
      );
      state.corp.credits = 12;
      const iceId = putCorpIceOnServer(state, "rd", iceDefinitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rezAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.source === iceId &&
          action.payload?.variableRezAdditionalCost === 4,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (action) => action.actionId === rezAction.actionId,
      );
      expect(state.cardInstances[iceId]?.variableIceState).toMatchObject({
        family: "paid_end_the_run_subroutines",
        additionalCostPaid: 4,
        value: 2,
        subroutineCount: 2,
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        variableRezKind: "paid_end_the_run_subroutines",
        variableRezAdditionalCost: 4,
        effectiveSubroutineCountAfterRez: 2,
      });
      const runnerIceView = getPlayerView(state, "runner")
        .servers.flatMap((server) => server.ice)
        .find((card) => card.instanceId === iceId);
      const variableSubroutineDisplay = runnerIceView?.counterDisplays?.find(
        (display) => display.id === "variable_paid_etr_subroutines",
      );
      expect(variableSubroutineDisplay).toMatchObject({
        id: "variable_paid_etr_subroutines",
        amount: 2,
        displayKind: "generic_counter",
        label: "End-the-run-Subroutinen",
        usageHint: "status_marker",
      });
      expect(variableSubroutineDisplay?.ariaLabel).toContain(
        "2 End-the-run-Subroutinen",
      );
      expect(variableSubroutineDisplay?.ariaLabel).toContain(
        "4 zusätzliche Credits beim Rezzen",
      );
      expect(variableSubroutineDisplay?.ariaLabel).toContain(
        iceDefinitionId === "onr_proteus_024_gatekeeper"
          ? "7 Credits insgesamt"
          : "8 Credits insgesamt",
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("stores Homing Missile X as strength, trace base and trace bid limit", () => {
    let state = proteusPhase3bGame("proteus-phase-3b-homing-missile");
    state.corp.credits = 20;
    const iceId = putCorpIceOnServer(
      state,
      "rd",
      "onr_proteus_025_homing-missile",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.source === iceId &&
        action.payload?.variableRezKind === "x_strength" &&
        action.payload?.variableRezValue === 5,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === rezAction.actionId,
    );
    expect(state.cardInstances[iceId]?.variableIceState).toMatchObject({
      family: "x_strength",
      value: 5,
      strength: 5,
      traceBidLimit: 5,
    });
    expect(getPlayerView(state, "runner").run?.encounteredIce).toMatchObject({
      definitionId: "onr_proteus_025_homing-missile",
      strength: 5,
    });
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace).toMatchObject({
      sourceCardInstanceId: iceId,
      baseTraceStrength: 5,
      traceBidLimit: 5,
      corpBidMax: 5,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStarted: true,
      baseTraceStrength: 5,
      traceBidLimit: 5,
      corpBidMax: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Phase 3c Relative Board-Count ICE", () => {
  const BUG_ZAPPER = "onr_proteus_012_bug-zapper";
  const DOG_PILE = "onr_proteus_021_dog-pile";
  const HUNTING_PACK = "onr_proteus_026_hunting-pack";
  const MASTERMIND = "onr_proteus_030_mastermind";
  const OUTER_BLANK_ICE_A = "onr_proteus_024_gatekeeper";
  const OUTER_BLANK_ICE_B = "onr_proteus_036_sandstorm";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusPhase3cGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          name: "Proteus Phase 3c Runner",
        },
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: `${seed}_corp`,
          name: "Proteus Phase 3c Corp",
          cards: [
            { id: BUG_ZAPPER, quantity: 1 },
            { id: DOG_PILE, quantity: 1 },
            { id: HUNTING_PACK, quantity: 1 },
            { id: MASTERMIND, quantity: 1 },
            { id: OUTER_BLANK_ICE_A, quantity: 1 },
            { id: OUTER_BLANK_ICE_B, quantity: 1 },
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  function setRezzedForRelativeTest(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      faceup: true,
      rezzed: true,
    };
  }

  function encounterInnerRelativeIce(
    state: GameState,
    targetDefinitionId: string,
  ): { state: GameState; targetId: CardInstanceId } {
    const targetId = putCorpIceOnServer(state, "rd", targetDefinitionId);
    const outerOne = putCorpIceOnServer(state, "rd", OUTER_BLANK_ICE_A);
    const outerTwo = putCorpIceOnServer(state, "rd", OUTER_BLANK_ICE_B);
    for (const cardId of [targetId, outerOne, outerTwo]) {
      setRezzedForRelativeTest(state, cardId);
    }
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    while (state.run?.encounteredIceId !== targetId) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    return { state, targetId };
  }

  function resolveOpenTraceWithDefaultChoices(state: GameState): GameState {
    while (state.trace) {
      const option =
        state.pendingChoice?.options.find(
          (candidate) => candidate.id === "bid_0",
        ) ??
        state.pendingChoice?.options.find(
          (candidate) => candidate.id === "pass",
        ) ??
        state.pendingChoice?.options[0];
      if (!option) throw new Error("Trace choice option missing.");
      state = applyChoice(state, state.activeSide, option.id);
    }
    return state;
  }

  it("keeps relative ICE base values aligned with the Proteus catalog", () => {
    expect(DEMO_CARDS_BY_ID[BUG_ZAPPER]).toMatchObject({
      rezCost: 6,
      strength: 2,
      subtypes: expect.arrayContaining(["ap", "hellbolt", "sentry"]),
    });
    expect(DEMO_CARDS_BY_ID[DOG_PILE]).toMatchObject({
      rezCost: 5,
      strength: 0,
      subtypes: expect.arrayContaining(["ap", "sentry"]),
    });
    expect(DEMO_CARDS_BY_ID[HUNTING_PACK]).toMatchObject({
      rezCost: 1,
      strength: 4,
      subtypes: expect.arrayContaining(["bloodhound", "sentry"]),
    });
    expect(DEMO_CARDS_BY_ID[MASTERMIND]).toMatchObject({
      rezCost: 7,
      strength: 0,
      subtypes: expect.arrayContaining(["ap", "black_ice", "sentry", "zombie"]),
    });
  });

  it("counts only rezzed ICE outside the current ICE for strength and damage", () => {
    for (const definitionId of [BUG_ZAPPER, DOG_PILE, MASTERMIND] as const) {
      let state = proteusPhase3cGame(`proteus-phase-3c-${definitionId}`);
      const setup = encounterInnerRelativeIce(state, definitionId);
      state = setup.state;
      const beforeGrip = state.runner.grip.length;
      const beforeCoreDamage = state.runner.coreDamage;
      const encounteredIce = getPlayerView(state, "runner").run?.encounteredIce;
      if (definitionId === BUG_ZAPPER) {
        expect(encounteredIce?.strength).toBe(2);
        expect(encounteredIce?.strengthModifier ?? 0).toBe(0);
      } else if (definitionId === DOG_PILE || definitionId === MASTERMIND) {
        expect(encounteredIce?.strength).toBe(2);
        expect(encounteredIce?.strengthModifier).toBe(2);
      }
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      if (definitionId === BUG_ZAPPER) {
        expect(beforeGrip - state.runner.grip.length).toBe(4);
      } else if (definitionId === DOG_PILE) {
        expect(beforeGrip - state.runner.grip.length).toBe(2);
      } else {
        expect(state.runner.coreDamage - beforeCoreDamage).toBe(2);
      }
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("does not emit damage or prevention payloads when Dog Pile has no outside ICE", () => {
    let state = proteusPhase3cGame("proteus-phase-3c-dog-pile-zero-outside");
    const dogPileId = putCorpIceOnServer(state, "rd", DOG_PILE);
    setRezzedForRelativeTest(state, dogPileId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const encounteredIce = getPlayerView(state, "runner").run?.encounteredIce;
    expect(encounteredIce).toMatchObject({
      definitionId: DOG_PILE,
      strength: 0,
    });
    expect(encounteredIce?.strengthModifier ?? 0).toBe(0);
    const beforeGrip = state.runner.grip.length;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.grip).toHaveLength(beforeGrip);
    expect(state.run).toBeUndefined();
    const payload = state.eventLog.at(-1)?.publicPayload ?? {};
    expect(payload.damageResolved).toBeUndefined();
    expect(payload.damageAmount).toBeUndefined();
    expect(payload.preventedAmount).toBeUndefined();
    expect(payload.eventModificationOutcome).toBeUndefined();
    expect(payload.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: DOG_PILE,
        subroutineIndex: 1,
        subroutineType: "end_the_run",
        endedRun: true,
      }),
    ]);
    expect(JSON.stringify(payload)).not.toMatch(hiddenPayloadMarkers);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("creates one public Hunting Pack trace subroutine per rezzed outside ICE", () => {
    let state = proteusPhase3cGame("proteus-phase-3c-hunting-pack");
    const setup = encounterInnerRelativeIce(state, HUNTING_PACK);
    state = setup.state;
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 1,
      encounterWillEndRun: false,
    });
    expect(String(continueAction.payload?.encounterSubroutineIds)).toContain(
      "relative_ice_outside_onr_proteus_026_hunting-pack.trace.1",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.trace).toMatchObject({
      sourceCardInstanceId: setup.targetId,
      baseTraceStrength: 5,
    });
    state = resolveOpenTraceWithDefaultChoices(state);
    const secondTraceAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(secondTraceAction.payload?.encounterSubroutineIds).toBe(
      "relative_ice_outside_onr_proteus_026_hunting-pack.trace.2",
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Phase 3e ICE Repositioning", () => {
  const MOBILE_BARRICADE = "onr_proteus_033_mobile-barricade";
  const WALKING_WALL = "onr_proteus_044_walking-wall";
  const INNER_ICE = "onr_proteus_024_gatekeeper";
  const MIDDLE_ICE = "onr_proteus_036_sandstorm";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusPhase3eGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: `${seed}_runner`,
          name: "Proteus Phase 3e Runner",
        },
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: `${seed}_corp`,
          name: "Proteus Phase 3e Corp",
          cards: [
            { id: MOBILE_BARRICADE, quantity: 1 },
            { id: WALKING_WALL, quantity: 1 },
            { id: INNER_ICE, quantity: 1 },
            { id: MIDDLE_ICE, quantity: 1 },
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  it("moves unrezzed Mobile Barricade within the attacked fort and reveals only that source", () => {
    let state = proteusPhase3eGame("proteus-phase-3e-mobile-barricade");
    state.corp.credits = 5;
    const innerId = putCorpIceOnServer(state, "rd", INNER_ICE);
    const middleId = putCorpIceOnServer(state, "rd", MIDDLE_ICE);
    const mobileId = putCorpIceOnServer(state, "rd", MOBILE_BARRICADE);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const reposition = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.fortRunWindowAbility ===
          "move_self_to_different_position_on_same_fort" &&
        action.payload?.cardId === mobileId &&
        action.payload?.targetIceIndex === 0,
    );
    expect(reposition.costs).toEqual([{ credits: 1 }]);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: reposition.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-phase-3e-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: reposition.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "proteus-phase-3e-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const cannotPay = structuredClone(state);
    cannotPay.corp.credits = 0;
    expect(
      applyAction(cannotPay, {
        matchId: cannotPay.matchId,
        side: "corp",
        actionId: reposition.actionId,
        clientKnownStateVersion: cannotPay.stateVersion,
        idempotencyKey: "proteus-phase-3e-cannot-pay",
      }).ok,
    ).toBe(false);

    const drifted = structuredClone(state);
    const server = drifted.corp.servers.find(
      (candidate) => candidate.id === "rd",
    );
    if (!server) throw new Error("Missing R&D server");
    server.ice = [innerId, middleId];
    drifted.corp.hq.push(mobileId);
    drifted.cardInstances[mobileId] = {
      ...drifted.cardInstances[mobileId]!,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(drifted, {
        matchId: drifted.matchId,
        side: "corp",
        actionId: reposition.actionId,
        clientKnownStateVersion: drifted.stateVersion,
        idempotencyKey: "proteus-phase-3e-position-drift",
      }).ok,
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === reposition.actionId,
    );
    const rd = state.corp.servers.find((candidate) => candidate.id === "rd");
    expect(rd?.ice).toEqual([mobileId, innerId, middleId]);
    expect(state.cardInstances[mobileId]).toMatchObject({
      faceup: true,
      rezzed: false,
    });
    expect(state.cardInstances[innerId]?.faceup).toBe(false);
    expect(state.cardInstances[middleId]?.faceup).toBe(false);
    expect(state.run).toMatchObject({
      phase: "approach_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 2 },
      approachedIceId: middleId,
    });
    const runnerRd = getPlayerView(state, "runner").servers.find(
      (candidate) => candidate.id === "rd",
    );
    expect(runnerRd?.ice[0]).toMatchObject({
      known: true,
      definitionId: MOBILE_BARRICADE,
      title: "Mobile Barricade",
      rezzed: false,
    });
    expect(runnerRd?.ice[1]?.known).toBe(false);
    expect(runnerRd?.ice[2]?.known).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      cardDefinitionId: MOBILE_BARRICADE,
      title: "Mobile Barricade",
      sourceDefinitionId: MOBILE_BARRICADE,
      amounts: expect.objectContaining({
        movedIceCount: 1,
        sourceIceIndex: 2,
        targetIceIndex: 0,
        newApproachIceIndex: 2,
      }),
      targets: expect.objectContaining({
        revealedSource: true,
        newApproachIceRevealed: false,
      }),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      INNER_ICE,
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      MIDDLE_ICE,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("moves rezzed Walking Wall once per run without creating a hidden reveal", () => {
    let state = proteusPhase3eGame("proteus-phase-3e-walking-wall");
    state.corp.credits = 5;
    const walkingId = putCorpIceOnServer(state, "rd", WALKING_WALL);
    const middleId = putCorpIceOnServer(state, "rd", MIDDLE_ICE);
    const outerId = putCorpIceOnServer(state, "rd", INNER_ICE);
    state.cardInstances[walkingId] = {
      ...state.cardInstances[walkingId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const reposition = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.cardId === walkingId &&
        action.payload?.targetIceIndex === 2,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === reposition.actionId,
    );
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toEqual([middleId, outerId, walkingId]);
    expect(state.run?.approachedIceId).toBe(walkingId);
    expect(state.cardInstances[walkingId]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      sourceDefinitionId: WALKING_WALL,
      amounts: expect.objectContaining({
        movedIceCount: 1,
      }),
      targets: expect.objectContaining({
        revealedSource: false,
        newApproachIceRevealed: true,
      }),
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.fortRunWindowAbility ===
            "move_self_to_different_position_on_same_fort" &&
          action.payload?.cardId === walkingId,
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus Dynamic Public ETR ICE", () => {
  const MINOTAUR = "onr_proteus_031_minotaur";
  const RIDDLER = "onr_proteus_034_riddler";
  const TOUGHONIUM = "onr_proteus_041_toughoniumtm-wall";
  const CODE_GATE = "onr_v1_230_cortical-scanner";
  const WALL = "onr_v1_232_crystal-wall";
  const SENTRY = "onr_v1_231_cortical-scrub";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusDynamicIceGame(seed: string): GameState {
    const corpOverrideIds = new Set([
      MINOTAUR,
      RIDDLER,
      TOUGHONIUM,
      CODE_GATE,
      WALL,
      SENTRY,
    ]);
    return createGameAfterSetup({
      seed,
      runnerDeck: {
        ...ONR_V1_6_2_RUNNER_DECK,
        id: `${seed}_runner`,
        cards: [
          { id: "simple_killer", quantity: 1 },
          ...ONR_V1_6_2_RUNNER_DECK.cards.filter(
            (card) => card.id !== "simple_killer",
          ),
        ],
      },
      corpDeck: {
        ...ONR_V1_6_2_CORP_DECK,
        id: `${seed}_corp`,
        cards: [
          { id: MINOTAUR, quantity: 1 },
          { id: RIDDLER, quantity: 2 },
          { id: TOUGHONIUM, quantity: 1 },
          { id: CODE_GATE, quantity: 1 },
          { id: WALL, quantity: 2 },
          { id: SENTRY, quantity: 1 },
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

  function effectiveSubroutineIds(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    iceId: CardInstanceId,
  ): string[] {
    const ice = getPlayerView(state, "runner")
      .servers.find((server) => server.id === serverId)
      ?.ice.find((card) => card.instanceId === iceId) as
      | { effectiveRunQuote?: { subroutines: Array<{ id: string }> } }
      | undefined;
    return (
      ice?.effectiveRunQuote?.subroutines.map((subroutine) => subroutine.id) ??
      []
    );
  }

  function startEncounterWithRezzedIce(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): GameState {
    return enterEncounterFromMovementWindow(
      apply(
        toRunnerTurnFromCorpMain(state),
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === serverId,
      ),
    );
  }

  it("counts only other rezzed installed code gates and walls for Minotaur", () => {
    let state = proteusDynamicIceGame("proteus-phase-1b-minotaur");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 20;
    const minotaurId = putCorpIceOnServer(state, "rd", MINOTAUR);
    const codeGateId = putCorpIceOnServer(state, "hq", CODE_GATE);
    const wallId = putCorpIceOnServer(state, "archives", WALL);
    const sentryId = putCorpIceOnServer(state, "archives", SENTRY);
    for (const cardId of [minotaurId, codeGateId, wallId, sentryId]) {
      setRezzed(state, cardId);
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = startEncounterWithRezzedIce(state, "rd");
    const subroutineIds = effectiveSubroutineIds(state, "rd", minotaurId);
    expect(subroutineIds).toEqual([
      `card_implementation.${MINOTAUR}.additional_subroutine.1.repeat.1.end_the_run`,
      `card_implementation.${MINOTAUR}.additional_subroutine.2.repeat.2.end_the_run`,
    ]);
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterWillEndRun: true,
    });
    expect(JSON.stringify(continueAction.payload)).not.toContain(minotaurId);
    expect(JSON.stringify(continueAction.payload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const stale = structuredClone(state);
    stale.cardInstances[wallId] = {
      ...stale.cardInstances[wallId]!,
      faceup: false,
      rezzed: false,
    };
    const staleContinue = applyAction(stale, {
      matchId: stale.matchId,
      side: "runner",
      actionId: continueAction.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "proteus-minotaur-stale-continue",
    });
    expect(staleContinue.ok).toBe(false);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: MINOTAUR,
        subroutineIndex: 0,
        cardDefinitionId: MINOTAUR,
        cardTitle: "Minotaur",
        endedRun: true,
      }),
    ]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("lets Riddler add repeatable current-encounter ETR subroutines for [2]", () => {
    let state = proteusDynamicIceGame("proteus-phase-1b-riddler");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.runner.credits = 10;
    const riddlerId = putCorpIceOnServer(state, "rd", RIDDLER);
    setRezzed(state, riddlerId);
    state = startEncounterWithRezzedIce(state, "rd");

    const addAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" && action.source === riddlerId,
    );
    expect(addAction.costs).toEqual([{ credits: 2 }]);
    expect(addAction.payload).toMatchObject({
      cardImplementationAbility: "activated",
      cardImplementationAbilityTiming: "corp_encounter",
    });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: addAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-riddler-wrong-side",
      }).ok,
    ).toBe(false);
    const lowCredits = structuredClone(state);
    lowCredits.corp.credits = 1;
    expect(
      applyAction(lowCredits, {
        matchId: lowCredits.matchId,
        side: "corp",
        actionId: addAction.actionId,
        clientKnownStateVersion: lowCredits.stateVersion,
        idempotencyKey: "proteus-riddler-cost",
      }).ok,
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === addAction.actionId,
    );
    expect(state.corp.credits).toBe(8);
    expect(effectiveSubroutineIds(state, "rd", riddlerId)).toEqual([
      `card_implementation.${RIDDLER}.current_encounter_additional_subroutine.1.end_the_run`,
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: RIDDLER,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const staleAfterOne = structuredClone(state);
    const staleContinue = mustAction(
      staleAfterOne,
      "runner",
      (action) => action.type === "continue_run",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" && action.source === riddlerId,
    );
    expect(state.corp.credits).toBe(6);
    expect(effectiveSubroutineIds(state, "rd", riddlerId)).toHaveLength(2);
    staleAfterOne.run!.encounterAdditionalSubroutines = [
      ...(staleAfterOne.run!.encounterAdditionalSubroutines ?? []),
      {
        sourceCardInstanceId: riddlerId,
        sourceDefinitionId: RIDDLER,
        sourceTitle: "Riddler",
        subroutineKind: "end_the_run",
      },
    ];
    const staleResult = applyAction(staleAfterOne, {
      matchId: staleAfterOne.matchId,
      side: "runner",
      actionId: staleContinue.actionId,
      clientKnownStateVersion: staleAfterOne.stateVersion,
      idempotencyKey: "proteus-riddler-stale-continue",
    });
    expect(staleResult.ok).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.unbrokenSubroutineCount === 2,
    );
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: RIDDLER,
        subroutineIndex: 0,
        cardDefinitionId: RIDDLER,
        cardTitle: "Riddler",
        endedRun: true,
      }),
    ]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Proteus PRO006 Simple Corp ICE Resolver", () => {
  const BRAIN_WASH = "onr_proteus_011_brain-wash";
  const CHIHUAHUA = "onr_proteus_014_chihuahua";
  const COLONEL_FAILURE = "onr_proteus_015_colonel-failure";
  const COYOTE = "onr_proteus_016_coyote";
  const DATACOMB = "onr_proteus_018_datacomb";
  const DEATH_YO_YO = "onr_proteus_019_death-yo-yo";
  const ICEBERG = "onr_proteus_027_iceberg";
  const MARIONETTE = "onr_proteus_029_marionette";
  const SCAFFOLDING = "onr_proteus_037_scaffolding";
  const MISLEADING_ACCESS_MENUS = "onr_proteus_032_misleading-access-menus";
  const SNOWBANK = "onr_proteus_038_snowbank";
  const TUMBLERS = "onr_proteus_042_tumblers";
  const TWISTY_PASSAGES = "onr_proteus_043_twisty-passages";
  const WASHED_UP_SOLO_CONSTRUCT = "onr_proteus_045_washed-up-solo-construct";
  const RASMIN_BRIDGER = "onr_proteus_070_rasmin-bridger";
  const SOCIAL_ENGINEERING = "onr_v1_111_social-engineering";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  function proteusSimpleCorpIceGame(seed: string): GameState {
    const corpOverrideIds = new Set([
      BRAIN_WASH,
      CHIHUAHUA,
      COLONEL_FAILURE,
      COYOTE,
      DATACOMB,
      DEATH_YO_YO,
      ICEBERG,
      MARIONETTE,
      MISLEADING_ACCESS_MENUS,
      SCAFFOLDING,
      SNOWBANK,
      TUMBLERS,
      TWISTY_PASSAGES,
      WASHED_UP_SOLO_CONSTRUCT,
      RASMIN_BRIDGER,
    ]);
    const runnerOverrideIds = new Set([
      "simple_decoder",
      "simple_fracter",
      "simple_killer",
    ]);
    return createGameAfterSetup({
      seed,
      runnerDeck: {
        ...ONR_V1_6_2_RUNNER_DECK,
        id: `${seed}_runner`,
        cards: [
          { id: "simple_decoder", quantity: 2 },
          { id: "simple_fracter", quantity: 2 },
          { id: "simple_killer", quantity: 2 },
          ...ONR_V1_6_2_RUNNER_DECK.cards.filter(
            (card) => !runnerOverrideIds.has(card.id),
          ),
        ],
      },
      corpDeck: {
        ...ONR_V1_6_2_CORP_DECK,
        id: `${seed}_corp`,
        cards: [
          { id: BRAIN_WASH, quantity: 1 },
          { id: CHIHUAHUA, quantity: 1 },
          { id: COLONEL_FAILURE, quantity: 1 },
          { id: COYOTE, quantity: 1 },
          { id: DATACOMB, quantity: 1 },
          { id: DEATH_YO_YO, quantity: 1 },
          { id: ICEBERG, quantity: 1 },
          { id: MARIONETTE, quantity: 1 },
          { id: MISLEADING_ACCESS_MENUS, quantity: 1 },
          { id: SCAFFOLDING, quantity: 1 },
          { id: SNOWBANK, quantity: 1 },
          { id: TUMBLERS, quantity: 1 },
          { id: TWISTY_PASSAGES, quantity: 1 },
          { id: WASHED_UP_SOLO_CONSTRUCT, quantity: 1 },
          { id: RASMIN_BRIDGER, quantity: 1 },
          ...ONR_V1_6_2_CORP_DECK.cards.filter(
            (card) => !corpOverrideIds.has(card.id),
          ),
        ],
      },
      agendaPointsToWin: 7,
    });
  }

  function proteusSocialEngineeringTwistyGame(seed: string): GameState {
    return toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          id: `${seed}_runner`,
          cards: [
            { id: SOCIAL_ENGINEERING, quantity: 1 },
            ...ONR_V1_6_2_RUNNER_DECK.cards,
          ],
        },
        corpDeck: {
          ...ONR_V1_6_2_CORP_DECK,
          id: `${seed}_corp`,
          cards: [
            { id: TWISTY_PASSAGES, quantity: 1 },
            ...ONR_V1_6_2_CORP_DECK.cards.filter(
              (card) => card.id !== TWISTY_PASSAGES,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
  }

  function setRezzed(state: GameState, cardId: CardInstanceId): void {
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      faceup: true,
      rezzed: true,
    };
  }

  function startEncounterWithRezzedIce(
    state: GameState,
    definitionId: string,
  ): { state: GameState; iceId: CardInstanceId } {
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 20;
    const iceId = putCorpIceOnServer(state, "rd", definitionId);
    setRezzed(state, iceId);
    state = enterEncounterFromMovementWindow(
      apply(
        toRunnerTurnFromCorpMain(state),
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    );
    return { state, iceId };
  }

  function startEncounterAndRezIce(
    state: GameState,
    definitionId: string,
  ): { state: GameState; iceId: CardInstanceId; rezCreditsBefore: number } {
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 20;
    const iceId = putCorpIceOnServer(state, "rd", definitionId);
    state = apply(
      toRunnerTurnFromCorpMain(state),
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezCreditsBefore = state.corp.credits;
    state = enterEncounterFromMovementWindow(
      apply(
        state,
        "corp",
        (action) => action.type === "rez_ice" && action.source === iceId,
      ),
    );
    return { state, iceId, rezCreditsBefore };
  }

  function resolveOpenTraceWithDefaultChoices(state: GameState): GameState {
    while (state.trace) {
      const option =
        state.pendingChoice?.options.find(
          (candidate) => candidate.id === "bid_0",
        ) ??
        state.pendingChoice?.options.find(
          (candidate) => candidate.id === "pass",
        ) ??
        state.pendingChoice?.options[0];
      if (!option) throw new Error("Trace choice option missing.");
      state = applyChoice(state, state.activeSide, option.id);
    }
    return state;
  }

  function chooseSocialEngineeringAutoPassTarget(
    state: GameState,
    iceId: CardInstanceId,
  ): GameState {
    state.runner.credits = 5;
    const socialEngineeringId = moveRunnerCardToGrip(state, SOCIAL_ENGINEERING);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === socialEngineeringId,
    );
    state = applyChoice(state, "runner", "hide_3");
    state = applyChoice(state, "corp", "guess_2");
    return applyChoice(state, "runner", `ice_${iceId}`);
  }

  it("resolves Brain Wash brain damage with stale, side, actionId, and ICE revalidation", () => {
    const setup = startEncounterWithRezzedIce(
      proteusSimpleCorpIceGame("proteus-pro006-brain-wash"),
      BRAIN_WASH,
    );
    let { state } = setup;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 1,
      encounterSubroutineIds: `card_implementation.${BRAIN_WASH}.printed_subroutine.1.brain_damage`,
    });

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: continueAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-pro006-brain-wrong-side",
      }).ok,
    ).toBe(false);
    const staleState = structuredClone(state);
    expect(
      applyAction(staleState, {
        matchId: staleState.matchId,
        side: "runner",
        actionId: continueAction.actionId,
        clientKnownStateVersion: staleState.stateVersion - 1,
        idempotencyKey: "proteus-pro006-brain-stale",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: `${continueAction.actionId}.missing`,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-pro006-brain-action",
      }).ok,
    ).toBe(false);
    const wrongIce = structuredClone(state);
    delete wrongIce.run!.encounteredIceId;
    expect(
      applyAction(wrongIce, {
        matchId: wrongIce.matchId,
        side: "runner",
        actionId: continueAction.actionId,
        clientKnownStateVersion: wrongIce.stateVersion,
        idempotencyKey: "proteus-pro006-brain-no-current-ice",
      }).ok,
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageType: "core",
      damageAmount: 1,
      resolvedEffects: [
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: BRAIN_WASH,
          subroutineType: "do_damage",
          amount: 1,
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves Colonel Failure as three program trash subroutines followed by two ETR subroutines", () => {
    const setup = startEncounterWithRezzedIce(
      proteusSimpleCorpIceGame("proteus-pro006-colonel-failure"),
      COLONEL_FAILURE,
    );
    let { state } = setup;
    installRunnerProgramForTest(state, "simple_decoder");
    installRunnerProgramForTest(state, "simple_fracter");
    installRunnerProgramForTest(state, "simple_killer");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 5,
      encounterWillEndRun: true,
    });
    expect(continueAction.payload?.encounterSubroutineIds).toBe(
      [
        `card_implementation.${COLONEL_FAILURE}.printed_subroutine.1.trash_program`,
        `card_implementation.${COLONEL_FAILURE}.printed_subroutine.2.trash_program`,
        `card_implementation.${COLONEL_FAILURE}.printed_subroutine.3.trash_program`,
        `card_implementation.${COLONEL_FAILURE}.printed_subroutine.4.end_the_run`,
        `card_implementation.${COLONEL_FAILURE}.printed_subroutine.5.end_the_run`,
      ].join(","),
    );
    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runner.rig.programs).toHaveLength(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
      expect.objectContaining({
        subroutineIndex: 0,
        subroutineType: "trash_installed_program",
        cardsTrashed: 1,
      }),
      expect.objectContaining({
        subroutineIndex: 1,
        subroutineType: "trash_installed_program",
        cardsTrashed: 1,
      }),
      expect.objectContaining({
        subroutineIndex: 2,
        subroutineType: "trash_installed_program",
        cardsTrashed: 1,
      }),
      expect.objectContaining({
        subroutineIndex: 3,
        subroutineType: "end_the_run",
        endedRun: true,
      }),
    ]);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it.each([
    { seed: "proteus-pro006-colonel-failure-one-program", programCount: 1 },
    { seed: "proteus-pro006-colonel-failure-zero-programs", programCount: 0 },
  ] as const)(
    "resolves Colonel Failure without duplicate trash targets with $programCount installed Runner programs",
    ({ seed, programCount }) => {
      const setup = startEncounterWithRezzedIce(
        proteusSimpleCorpIceGame(seed),
        COLONEL_FAILURE,
      );
      let { state } = setup;
      const installedProgramIds = [
        "simple_decoder",
        "simple_fracter",
        "simple_killer",
      ]
        .slice(0, programCount)
        .map((definitionId) =>
          installRunnerProgramForTest(state, definitionId),
        );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const continueAction = mustAction(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      state = apply(
        state,
        "runner",
        (action) => action.actionId === continueAction.actionId,
      );

      expect(state.run).toBeUndefined();
      const trashedInstalledPrograms = state.runner.heap.filter((cardId) =>
        installedProgramIds.includes(cardId),
      );
      expect(trashedInstalledPrograms).toHaveLength(programCount);
      expect(new Set(trashedInstalledPrograms).size).toBe(programCount);
      expect(state.runner.rig.programs).toHaveLength(0);
      expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
        expect.objectContaining({
          subroutineIndex: 0,
          subroutineType: "trash_installed_program",
          cardsTrashed: programCount > 0 ? 1 : 0,
        }),
        expect.objectContaining({
          subroutineIndex: 1,
          subroutineType: "trash_installed_program",
          cardsTrashed: 0,
        }),
        expect.objectContaining({
          subroutineIndex: 2,
          subroutineType: "trash_installed_program",
          cardsTrashed: 0,
        }),
        expect.objectContaining({
          subroutineIndex: 3,
          subroutineType: "end_the_run",
          endedRun: true,
        }),
      ]);
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it.each([
    [MISLEADING_ACCESS_MENUS, "Misleading Access Menus"],
    [SNOWBANK, "Snowbank"],
  ] as const)(
    "gains 3 credits on rez once and resolves paid/unpaid pay-or-end-run for %s",
    (definitionId, _title) => {
      const setup = startEncounterAndRezIce(
        proteusSimpleCorpIceGame(`proteus-pro006-${definitionId}`),
        definitionId,
      );
      let { state } = setup;
      expect(state.corp.credits).toBe(setup.rezCreditsBefore + 3);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "rez_ice",
        sourceDefinitionId: definitionId,
        gainedCredits: 3,
        corpCreditsAfter: state.corp.credits,
        resolvedEffects: [
          expect.objectContaining({
            kind: "gain_credits",
            side: "corp",
            amount: 3,
            sourceDefinitionId: definitionId,
          }),
        ],
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );

      const reRez = getLegalActions(state, "corp").filter(
        (action) => action.type === "rez_ice" && action.source === setup.iceId,
      );
      expect(reRez).toHaveLength(0);
      const paidContinue = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" &&
          action.costs[0]?.credits === 1 &&
          action.payload?.encounterWillEndRun === false,
      );
      expect(paidContinue.payload).toMatchObject({
        payOrEndRunSubroutineIndexes: "0",
        payOrEndRunSubroutinePayment: 1,
      });
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === paidContinue.actionId,
      );
      const paidPayload = state.eventLog.at(-1)?.publicPayload;
      state = enterEncounterFromMovementWindow(state);
      expect(state.run?.phase).toBe("access");
      expect(state.runner.credits).toBe(initial.runner.credits - 1);
      expect(paidPayload?.resolvedEffects).toEqual([
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: definitionId,
          subroutineType: "end_the_run_unless_runner_pays",
          paidCredits: 1,
        }),
      ]);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));

      const refusing = startEncounterAndRezIce(
        proteusSimpleCorpIceGame(`proteus-pro006-${definitionId}-refuse`),
        definitionId,
      ).state;
      const refuseContinue = mustAction(
        refusing,
        "runner",
        (action) =>
          action.type === "continue_run" &&
          action.costs.length === 0 &&
          action.payload?.encounterWillEndRun === true,
      );
      const refused = apply(
        refusing,
        "runner",
        (action) => action.actionId === refuseContinue.actionId,
      );
      expect(refused.run).toBeUndefined();
      expect(refused.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: definitionId,
          subroutineType: "end_the_run_unless_runner_pays",
          paidCredits: 0,
          endedRun: true,
        }),
      ]);
      expect(
        JSON.stringify(refused.eventLog.at(-1)?.publicPayload),
      ).not.toMatch(hiddenPayloadMarkers);
    },
  );

  it("PRO010 resolves Chihuahua trace Net damage without leaking hidden grip data", () => {
    const setup = startEncounterAndRezIce(
      proteusSimpleCorpIceGame("proteus-pro010-chihuahua-trace"),
      CHIHUAHUA,
    );
    let { state } = setup;
    expect(state.corp.credits).toBe(setup.rezCreditsBefore + 2);
    const beforeGrip = state.runner.grip.length;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace).toMatchObject({
      sourceDefinitionId: CHIHUAHUA,
      baseTraceStrength: 1,
      successEffect: { type: "net_damage", amount: 1 },
    });
    state = resolveOpenTraceWithDefaultChoices(state);

    expect(beforeGrip - state.runner.grip.length).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      damageType: "net",
      damageAmount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("PRO010 lets Runner pay while passing Coyote to cancel future ICE strength", () => {
    let state = startEncounterAndRezIce(
      proteusSimpleCorpIceGame("proteus-pro010-coyote-cancel"),
      COYOTE,
    ).state;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "continue_run");
    const pay = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.postPassFutureStrengthAbility ===
          "cancel_future_ice_strength_bonus" &&
        action.payload?.decision === "pay",
    );
    expect(pay.costs).toEqual([{ credits: 2 }]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === pay.actionId,
    );
    expect(state.run?.futureEncounterIceStrengthBonus).toBe(0);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("PRO010 resolves Washed-Up Solo Construct pay-or-trash program branches", () => {
    let state = startEncounterAndRezIce(
      proteusSimpleCorpIceGame("proteus-pro010-washed-up-paid"),
      WASHED_UP_SOLO_CONSTRUCT,
    ).state;
    const programId = installRunnerProgramForTest(state, "simple_decoder");
    const paid = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.payOrTrashProgramSubroutineIndexes === "0",
    );
    expect(paid.costs).toEqual([{ credits: 1 }]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === paid.actionId,
    );
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
      expect.objectContaining({
        sourceDefinitionId: WASHED_UP_SOLO_CONSTRUCT,
        subroutineType: "trash_installed_program_unless_runner_pays",
        paidCredits: 1,
        cardsTrashed: 0,
      }),
    ]);

    let refusing = startEncounterAndRezIce(
      proteusSimpleCorpIceGame("proteus-pro010-washed-up-trash"),
      WASHED_UP_SOLO_CONSTRUCT,
    ).state;
    const trashedProgramId = installRunnerProgramForTest(
      refusing,
      "simple_decoder",
    );
    refusing = apply(
      refusing,
      "runner",
      (action) => action.type === "continue_run" && action.costs.length === 0,
    );
    expect(refusing.runner.heap).toContain(trashedProgramId);
    expect(JSON.stringify(refusing.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
  });

  it("PRO010 supports Washed-Up Solo Construct paid branch then reaching a second ICE and runner ending the run", () => {
    let state = proteusSimpleCorpIceGame(
      "proteus-pro010-washed-up-then-snowbank",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 20;
    const secondIceId = putCorpIceOnServer(state, "rd", SNOWBANK);
    const washedUpId = putCorpIceOnServer(
      state,
      "rd",
      WASHED_UP_SOLO_CONSTRUCT,
    );
    setRezzed(state, washedUpId);
    setRezzed(state, secondIceId);
    state = enterEncounterFromMovementWindow(
      apply(
        toRunnerTurnFromCorpMain(state),
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    );
    expect(state.run?.encounteredIceId).toBe(washedUpId);

    const programId = installRunnerProgramForTest(state, "simple_decoder");
    const heapBefore = state.runner.heap.length;
    const creditsBefore = state.runner.credits;
    const payWashed = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.payOrTrashProgramSubroutineIndexes === "0",
    );
    expect(payWashed.costs).toEqual([{ credits: 1 }]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === payWashed.actionId,
    );
    expect(state.runner.credits).toBe(creditsBefore - 1);
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.runner.heap).toHaveLength(heapBefore);

    for (let index = 0; index < 4; index += 1) {
      if (!state.run || state.run?.phase !== "encounter_ice") break;
      if (state.run.encounteredIceId !== washedUpId) break;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    expect(state.run?.phase).toBe("movement");
    expect(state.run?.approachedIceId).toBe(secondIceId);

    state = enterEncounterFromMovementWindow(state);
    expect(state.run?.encounteredIceId).toBe(secondIceId);

    const refuseSecond = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterWillEndRun === true &&
        action.payload?.payOrEndRunSubroutineIndexes === undefined,
    );
    state = apply(
      state,
      "runner",
      (action) => action.actionId === refuseSecond.actionId,
    );

    expect(state.run).toBeUndefined();
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.runner.heap).toHaveLength(heapBefore);
  });

  it("PRO010 adds Iceberg paid encounter ETR subroutines through the generic corp encounter window", () => {
    let state = startEncounterWithRezzedIce(
      proteusSimpleCorpIceGame("proteus-pro010-iceberg"),
      ICEBERG,
    ).state;
    const addSubroutine = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === state.run?.encounteredIceId &&
        action.costs[0]?.credits === 2,
    );
    expect(addSubroutine.costs).toEqual([{ credits: 2 }]);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === addSubroutine.actionId,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        String(action.payload?.encounterSubroutineIds ?? "").includes(
          `card_implementation.${ICEBERG}.current_encounter_additional_subroutine.1.end_the_run`,
        ),
    );
    expect(continueAction.payload?.unbrokenSubroutineCount).toBe(2);
  });

  it.each([
    [DATACOMB, "required_pay_or_return"],
    [MARIONETTE, "required_pay_or_return"],
    [TWISTY_PASSAGES, "required_pay_or_return"],
    [DEATH_YO_YO, "optional_return_gain"],
    [SCAFFOLDING, "optional_return_gain"],
    [TUMBLERS, "optional_return_gain"],
  ] as const)(
    "PRO010 opens deterministic corp post-pass ICE lifecycle window for %s",
    (definitionId, mode) => {
      const setup = startEncounterWithRezzedIce(
        proteusSimpleCorpIceGame(`proteus-pro010-lifecycle-${definitionId}`),
        definitionId,
      );
      let { state, iceId } = setup;
      const subroutineCount =
        cardImplementationForDefinitionId(definitionId)?.printedSubroutines
          ?.length ?? 0;
      state.run!.brokenSubroutineIndexes = Array.from(
        { length: subroutineCount },
        (_, index) => index,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      const corpActions = getLegalActions(state, "corp").filter(
        (action) =>
          action.type === "continue_run" &&
          action.payload?.corpPostPassIceAbility === "return_passed_ice_to_hq",
      );
      expect(
        corpActions.map((action) => action.payload?.decision).sort(),
      ).toEqual(
        mode === "required_pay_or_return"
          ? ["pay", "return_to_hq"]
          : ["decline", "return_to_hq"],
      );
      const returnAction = corpActions.find(
        (action) => action.payload?.decision === "return_to_hq",
      );
      if (!returnAction) throw new Error("Return action missing.");
      state = apply(
        state,
        "corp",
        (action) => action.actionId === returnAction.actionId,
      );
      expect(state.corp.hq).toContain(iceId);
      expect(state.cardInstances[iceId]?.zone).toEqual({
        side: "corp",
        zone: "hq",
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("PRO010 gives Social Engineering a rez window and blocks unrezzed Twisty lifecycle", () => {
    let state = proteusSocialEngineeringTwistyGame(
      "proteus-pro010-social-unrezzed-twisty",
    );
    state.corp.credits = 30;
    const iceId = putCorpIceOnServer(state, "rd", TWISTY_PASSAGES);
    const hqBefore = state.corp.hq.length;

    state = chooseSocialEngineeringAutoPassTarget(state, iceId);

    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("corp");
    expect(state.run).toMatchObject({
      phase: "approach_ice",
      approachedIceId: iceId,
      secretSpendGuessRunAutoPassIceId: iceId,
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "rez_ice" && action.source === iceId,
      ),
    ).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: SOCIAL_ENGINEERING,
      secretSpendGuessRun: true,
      hiddenZoneBarrier: true,
      targets: expect.objectContaining({
        secretSpendGuessRunGuessCorrect: false,
        autoPassChosenIce: true,
      }),
    });

    state = apply(state, "corp", (action) => action.type === "decline_rez");

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.activeSide).toBe("runner");
    expect(state.run?.position).toEqual({ kind: "server", serverId: "rd" });
    expect(state.run?.corpPostPassIceReturnToHq).toBeUndefined();
    expect(state.corp.hq).toHaveLength(hqBefore);
    expect(state.cardInstances[iceId]).toMatchObject({
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      rezzed: false,
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.corpPostPassIceAbility === "return_passed_ice_to_hq",
      ),
    ).toBe(false);
  });

  it("PRO010 lets rezzed Twisty resolve after Social Engineering auto-pass", () => {
    let state = proteusSocialEngineeringTwistyGame(
      "proteus-pro010-social-rezzed-twisty",
    );
    state.corp.credits = 30;
    const iceId = putCorpIceOnServer(state, "rd", TWISTY_PASSAGES);

    state = chooseSocialEngineeringAutoPassTarget(state, iceId);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(state.cardInstances[iceId]?.rezzed).toBe(true);

    expect(state.run?.corpPostPassIceReturnToHq).toMatchObject({
      sourceCardInstanceId: iceId,
      sourceDefinitionId: TWISTY_PASSAGES,
      passedIceId: iceId,
      serverId: "rd",
      mode: "required_pay_or_return",
      paymentAmount: 1,
    });
    const corpActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.corpPostPassIceAbility === "return_passed_ice_to_hq",
    );
    expect(
      corpActions.map((action) => action.payload?.decision).sort(),
    ).toEqual(["pay", "return_to_hq"]);

    const returnAction = corpActions.find(
      (action) => action.payload?.decision === "return_to_hq",
    );
    if (!returnAction) throw new Error("Twisty return action missing.");
    state = apply(
      state,
      "corp",
      (action) => action.actionId === returnAction.actionId,
    );

    expect(state.corp.hq).toContain(iceId);
    expect(state.cardInstances[iceId]?.zone).toEqual({
      side: "corp",
      zone: "hq",
    });
    const returnEvent = state.eventLog.at(-1);
    expect(returnEvent?.visibilityClass).toBe("public");
    expect(returnEvent?.publicPayload).toMatchObject({
      corpPostPassIceAbility: "return_passed_ice_to_hq",
      decision: "return_to_hq",
      returnedToHq: true,
      sourceDefinitionId: TWISTY_PASSAGES,
      passedIceDefinitionId: TWISTY_PASSAGES,
      returnedCardDefinitionId: TWISTY_PASSAGES,
      serverLabel: "R&D",
    });
    const serializedReturnPayload = JSON.stringify(returnEvent?.publicPayload);
    expect(serializedReturnPayload).not.toMatch(hiddenPayloadMarkers);
    expect(serializedReturnPayload).not.toContain(iceId);
  });

  it("PRO010 prioritizes corp lifecycle over Rasmin Bridger post-pass Fort payment", () => {
    let state = proteusSimpleCorpIceGame("proteus-pro010-rasmin-priority");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 20;
    const rasminId = putCorpRootInRemote(state, RASMIN_BRIDGER);
    const iceId = putCorpIceOnServer(state, "remote_1", DATACOMB);
    setRezzed(state, rasminId);
    setRezzed(state, iceId);
    state = enterEncounterFromMovementWindow(
      apply(
        toRunnerTurnFromCorpMain(state),
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      ),
    );
    state.run!.brokenSubroutineIndexes = [0];
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.corpPostPassIceReturnToHq).toBeDefined();
    expect(state.run?.postPassPayOrEndRun).toBeDefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.fortRunWindowAbility ===
          "runner_pay_or_end_run_after_passing_ice_on_this_fort",
      ),
    ).toBe(false);
    const corpPay = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.corpPostPassIceAbility === "return_passed_ice_to_hq" &&
        action.payload?.decision === "pay",
    );
    expect(corpPay.costs).toEqual([{ credits: 1 }]);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: corpPay.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "proteus-pro010-rasmin-corp-window-wrong-side",
      }).ok,
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === corpPay.actionId,
    );
    expect(state.run?.corpPostPassIceReturnToHq).toBeUndefined();
    expect(state.run?.postPassPayOrEndRun).toBeDefined();

    const runnerPay = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.fortRunWindowAbility ===
          "runner_pay_or_end_run_after_passing_ice_on_this_fort" &&
        action.payload?.decision === "pay",
    );
    expect(runnerPay.costs).toEqual([{ credits: 1 }]);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerPay.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "proteus-pro010-rasmin-stale-runner-pay",
    });
    expect(stale.ok).toBe(false);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === runnerPay.actionId,
    );
    expect(state.run?.postPassPayOrEndRun).toBeUndefined();
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
