import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
  createGameAfterSetup,
  CARD_DEFINITIONS_BY_ID,
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

describe("V1.2.3 Mechanic Unlock Card Release 1", () => {
  it("adds exactly eleven human-playable O:NR cards without opening deferred mechanics", () => {
    expect(ONR_V1_2_3_FINAL_CARD_IDS).toHaveLength(11);
    for (const definitionId of ONR_V1_2_3_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity|format|deckbuilder|parser/,
      );
    }

    expect(CARD_DEFINITIONS_BY_ID["onr_v1_021_dwarf"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_039_krash"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_066_snowball"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_074_worm"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_081_custodial-position"],
    ).toMatchObject({
      cost: 2,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_085_executive-wiretaps"],
    ).toMatchObject({
      cost: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_101_mit-west-tier"]).toMatchObject({
      cost: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_243_fetch-4-0-1"]).toMatchObject({
      rezCost: 0,
      strength: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_249_hunter"]).toMatchObject({
      rezCost: 2,
      strength: 5,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_297_overtime-incentives"],
    ).toMatchObject({
      cost: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_306_trojan-horse"]).toMatchObject({
      cost: 2,
    });
  });

  it("validates V1.2.3 smoke decks after the V1.2.2 gate", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_2_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_2_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v123CardReleaseGame("v123-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.specialZones).toEqual({ setAside: [], removedFromGame: [] });
  });

  it("installs the four unlocked breakers and resolves wall, sentry and universal break rules", () => {
    let installState = toRunnerTurn(
      v123CardReleaseGame("v123-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_021_dwarf",
      "onr_v1_039_krash",
      "onr_v1_066_snowball",
      "onr_v1_074_worm",
    ] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(
        installState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(installState, action) === definitionId,
      );
    }
    expect(installState.runner.memoryUsed).toBe(4);

    const breakCases = [
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_237_data-wall",
        seed: "dwarf-wall",
      },
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_279_wall-of-static",
        seed: "dwarf-wall-of-static",
      },
      {
        breaker: "onr_v1_074_worm",
        ice: "onr_v1_237_data-wall",
        seed: "worm-wall",
      },
      {
        breaker: "onr_v1_066_snowball",
        ice: "onr_v1_259_in-the-face",
        seed: "snowball-sentry",
      },
      {
        breaker: "onr_v1_039_krash",
        ice: "onr_v1_261_quandary",
        seed: "krash-code-gate",
      },
    ] as const;

    for (const testCase of breakCases) {
      let state = toRunnerTurn(v123CardReleaseGame(`v123-${testCase.seed}`));
      state.runner.credits = 20;
      state.corp.credits = 20;
      installRunnerProgramForTest(state, testCase.breaker);
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === testCase.ice,
      );
      for (
        let pumpCount = 0;
        pumpCount < 5 &&
        !getLegalActions(state, "runner").some(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
        pumpCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === testCase.breaker,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      for (
        let continueCount = 0;
        continueCount < 3 &&
        !getLegalActions(state, "runner").some(
          (action) => action.type === "access_card",
        );
        continueCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "access_card",
        cardDefinitionId: "simple_economy_operation",
      });
    }
  });

  it("qualifies breaker encounter labels and keeps wall-breaker pump paths deterministic", () => {
    let state = toRunnerTurn(
      v123CardReleaseGame("v123-dwarf-krash-wall-of-static"),
    );
    state.runner.credits = 30;
    installRunnerProgramForTest(state, "onr_v1_021_dwarf");
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );

    const initialEncounterActions = getLegalActions(state, "runner");
    const initialPumpLabels = initialEncounterActions
      .filter((action) => action.type === "pump_breaker")
      .map((action) => action.label);
    expect(initialPumpLabels).toEqual(
      expect.arrayContaining(["Dwarf: Stärke +1", "Krash: Stärke +1"]),
    );
    expect(
      initialEncounterActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_021_dwarf",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dwarfBreak = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    expect(dwarfBreak.label).toBe("Dwarf: Subroutine brechen");
  });

  it("resets Krash strength pumps between ICE encounters", () => {
    const runnerDeck: DeckDefinition = {
      ...ONR_V1_RUNNER_DECK,
      id: "v123_krash_encounter_pump_runner",
      name: "V1.2.3 Krash Encounter Pump Runner",
      cards: [
        { id: "onr_v1_039_krash", quantity: 1 },
        ...ONR_V1_RUNNER_DECK.cards.filter(
          (card) => card.id !== "onr_v1_039_krash",
        ),
      ],
    };
    const corpDeck: DeckDefinition = {
      ...ONR_V1_CORP_DECK,
      id: "v123_krash_encounter_pump_corp",
      name: "V1.2.3 Krash Encounter Pump Corp",
      cards: [
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 2 },
        { id: "simple_economy_operation", quantity: 1 },
        ...ONR_V1_CORP_DECK.cards.filter(
          (card) =>
            card.id !== "simple_barrier_ice" &&
            card.id !== "simple_code_gate_ice" &&
            card.id !== "simple_economy_operation",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v123-krash-encounter-pump-duration",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    const krashId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_039_krash",
    );
    expect(krashId).toBeDefined();
    if (!krashId) return;

    putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(3);
    expect(
      collectActiveModifiers(state).some(
        (modifier) =>
          modifier.kind === "breaker_strength" &&
          modifier.target?.id === krashId,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 0,
    );
    state = continueRunThroughMovement(state);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_code_gate_ice",
    );
    state = enterEncounterFromMovementWindow(state);

    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === krashId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(2);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === krashId,
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 0,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 1,
    );
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(0);
    expect(
      collectActiveModifiers(state).some(
        (modifier) =>
          modifier.kind === "breaker_strength" &&
          modifier.target?.id === krashId,
      ),
    ).toBe(false);
  });

  function p344MoveRunnerCardToGrip(
    state: GameState,
    definitionId: CardDefinitionId,
  ): CardInstanceId {
    if (
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === definitionId,
      )
    )
      return moveRunnerCardToGrip(state, definitionId);
    const instanceId =
      `p344_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
    state.cardInstances[instanceId] = {
      instanceId,
      definitionId,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.runner.grip.unshift(instanceId);
    return instanceId;
  }

  function p344PutCorpIceOnServer(
    state: GameState,
    serverId: "hq" | "rd" | "archives" | `remote_${number}`,
    definitionId: CardDefinitionId,
  ): CardInstanceId {
    if (
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === definitionId,
      )
    )
      return putCorpIceOnServer(state, serverId, definitionId);
    const server = state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) throw new Error("Missing server");
    const instanceId =
      `p344_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
    server.ice.push(instanceId);
    state.cardInstances[instanceId] = {
      instanceId,
      definitionId,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    return instanceId;
  }

  function p344EncounterState(
    seed: string,
    breakerDefinitionId: CardDefinitionId,
    iceDefinitionId: CardDefinitionId,
  ): { state: GameState; breakerId: CardInstanceId } {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 80;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 20;
    state.corp.credits = 80;
    p344MoveRunnerCardToGrip(state, breakerDefinitionId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === breakerDefinitionId,
    );
    const breakerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
    );
    if (!breakerId) throw new Error(`Missing breaker ${breakerDefinitionId}`);
    p344PutCorpIceOnServer(state, "rd", iceDefinitionId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === iceDefinitionId,
    );
    return { state, breakerId };
  }

  function p344PumpUntilBreak(
    state: GameState,
    breakerId: CardInstanceId,
  ): GameState {
    let current = state;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const breakAction = getLegalActions(current, "runner").find(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === 0,
      );
      if (breakAction) return current;
      const pumpAction = getLegalActions(current, "runner").find(
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === breakerId,
      );
      if (!pumpAction) return current;
      current = apply(
        current,
        "runner",
        (action) => action.actionId === pumpAction.actionId,
      );
    }
    return current;
  }

  it("runs P3.44 simple icebreaker break and pump matchers without duplicate actions", () => {
    const specs = [
      ["Krash", "onr_v1_039_krash", "simple_code_gate_ice", 2, true],
      [
        "Codecracker",
        "onr_v1_014_codecracker",
        "simple_code_gate_ice",
        0,
        true,
      ],
      [
        "Cyfermaster",
        "onr_v1_016_cyfermaster",
        "simple_code_gate_ice",
        2,
        true,
      ],
      ["Raffles", "onr_v1_052_raffles", "simple_code_gate_ice", 1, true],
      ["Tinweasel", "onr_v1_070_tinweasel", "simple_code_gate_ice", 0, false],
      [
        "Wizard's Book",
        "onr_v1_073_wizards-book",
        "simple_code_gate_ice",
        0,
        true,
      ],
      ["Dwarf", "onr_v1_021_dwarf", "onr_v1_237_data-wall", 1, true],
      ["Worm", "onr_v1_074_worm", "onr_v1_237_data-wall", 0, true],
      ["Black Dahlia", "onr_v1_006_black-dahlia", "simple_sentry_ice", 2, true],
      ["Codeslinger", "onr_v1_015_codeslinger", "simple_sentry_ice", 1, false],
      ["Loony Goon", "onr_v1_040_loony-goon", "simple_sentry_ice", 1, true],
      ["Raptor", "onr_v1_054_raptor", "simple_sentry_ice", 2, true],
      ["Shaka", "onr_v1_060_shaka", "simple_sentry_ice", 1, true],
      ["Wild Card", "onr_v1_072_wild-card", "simple_sentry_ice", 0, true],
      ["Flak", "onr_v1_027_flak", "onr_v1_280_zombie", 1, true],
      [
        "Dogcatcher",
        "onr_v1_018_dogcatcher",
        "onr_v1_243_fetch-4-0-1",
        1,
        true,
      ],
      ["Reflector", "onr_v1_055_reflector", "onr_v1_271_tko-2-0", 0, false],
      ["Replicator", "onr_v1_056_replicator", "onr_v1_221_asp", 0, true],
    ] as const;

    for (const [
      label,
      breakerDefinitionId,
      iceDefinitionId,
      expectedCost,
      hasPump,
    ] of specs) {
      const { state: initialEncounter, breakerId } = p344EncounterState(
        `p344-${label}`,
        breakerDefinitionId,
        iceDefinitionId,
      );
      let state = p344PumpUntilBreak(initialEncounter, breakerId);
      expect(
        getLegalActions(initialEncounter, "runner").some(
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === breakerId,
        ),
        label,
      ).toBe(hasPump);
      const breakActions = getLegalActions(state, "runner").filter(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === 0,
      );
      expect(breakActions, label).toHaveLength(1);
      expect(breakActions[0]?.costs[0]?.credits, label).toBe(expectedCost);
      const beforeBreak = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === breakActions[0]?.actionId,
      );
      expect(state.run?.brokenSubroutineIndexes, label).toContain(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        label,
      ).not.toMatch(/"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/);
      const replay = replayEvents(
        beforeBreak,
        state.eventLog.slice(replayStart),
      );
      expect(replay.ok, label).toBe(true);
      expect(hashState(replay.state), label).toBe(hashState(state));
    }
  });

  it("keeps P3.44 negative matchers and killer restricted credits scoped", () => {
    let dogcatcher = p344EncounterState(
      "p344-dogcatcher-negative",
      "onr_v1_018_dogcatcher",
      "simple_sentry_ice",
    ).state;
    dogcatcher = p344PumpUntilBreak(
      dogcatcher,
      dogcatcher.runner.rig.programs.find(
        (id) =>
          dogcatcher.cardInstances[id]?.definitionId ===
          "onr_v1_018_dogcatcher",
      )!,
    );
    expect(
      getLegalActions(dogcatcher, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(dogcatcher, action) === "onr_v1_018_dogcatcher",
      ),
    ).toBe(false);

    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p344-killer-restricted-credits",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    state.runner.clicks = 10;
    state.runner.memoryLimit = 10;
    state.corp.credits = 20;
    p344MoveRunnerCardToGrip(state, "onr_v1_147_zz22-speed-chip");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_147_zz22-speed-chip",
    );
    const zz22Id = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_147_zz22-speed-chip",
    );
    expect(zz22Id).toBeDefined();
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    state.runner.credits = 0;
    p344PutCorpIceOnServer(state, "rd", "simple_sentry_ice");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_sentry_ice",
    );
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    expect(breakAction.costs[0]?.credits).toBe(2);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakAction.actionId,
    );
    expect(zz22Id && cardCounterAmount(state, zz22Id, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
  });

  it("runs P3.45 Dropp, Japanese Water Torture and Snowball specials from CardImplementation", () => {
    let droppPump = p344EncounterState(
      "p345-dropp-pump",
      "onr_v1_019_dropp",
      "simple_code_gate_ice",
    ).state;
    const droppPumpAction = mustAction(
      droppPump,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(droppPump, action) === "onr_v1_019_dropp",
    );
    droppPump = apply(
      droppPump,
      "runner",
      (action) => action.actionId === droppPumpAction.actionId,
    );
    expect(droppPump.run?.phase).toBe("encounter_ice");
    expect(droppPump.timingPoint).toBe("run.encounter_ice");

    let japanese = p344EncounterState(
      "p345-japanese-variable-pump",
      "onr_v1_037_japanese-water-torture",
      "onr_v1_237_data-wall",
    ).state;
    japanese.runner.credits = 3;
    const japanesePump = mustAction(
      japanese,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(japanese, action) ===
          "onr_v1_037_japanese-water-torture" &&
        action.costs[0]?.credits === 3,
    );
    const japaneseId = String(japanesePump.payload?.breakerId);
    japanese = apply(
      japanese,
      "runner",
      (action) => action.actionId === japanesePump.actionId,
    );
    expect(japanese.cardInstances[japaneseId]?.strengthModifier).toBe(3);
    expect(japanese.runnerTurnFlags?.forgoNextActionsPending).toBe(3);

    let snowball = p344EncounterState(
      "p345-snowball-run-strength",
      "onr_v1_066_snowball",
      "simple_sentry_ice",
    ).state;
    const snowballId = snowball.runner.rig.programs.find(
      (id) =>
        snowball.cardInstances[id]?.definitionId === "onr_v1_066_snowball",
    );
    expect(snowballId).toBeDefined();
    snowball = p344PumpUntilBreak(snowball, snowballId!);
    const snowballBreak = mustAction(
      snowball,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === snowballId,
    );
    snowball = apply(
      snowball,
      "runner",
      (action) => action.actionId === snowballBreak.actionId,
    );
    expect(
      snowball.run?.breakerState?.brokenSubroutineCountByBreakerInstanceId[
        snowballId!
      ],
    ).toBe(1);
    expect(
      snowball.run?.breakerState?.strengthModifiersByBreakerInstanceId[
        snowballId!
      ],
    ).toEqual([
      { amount: 1, duration: "current_run", source: "successful_break" },
    ]);
  });

  it("applies Crash Everett draw replacement with private trash or stack-top choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-crash-draw",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_crash_runner",
          name: "P3.61 Crash Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_157_crash-everett-inventive-fixer", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    const crashId = moveRunnerCardToGrip(
      state,
      "onr_v1_157_crash-everett-inventive-fixer",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === crashId,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const drawActionId = mustAction(
      state,
      "runner",
      (action) => action.type === "draw_card",
    ).actionId;

    state = apply(state, "runner", (action) => action.type === "draw_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "draw_card",
      drawnCount: 2,
      crashEverettChoiceOpened: true,
      drawReplacementExtraDrawn: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"stack"|"cardInstances"|"privatePayload"|simple_/,
    );
    expect(state.pendingChoice?.side).toBe("runner");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.pendingChoice?.options).toHaveLength(4);
    expect(state.pendingChoice?.continuation).toMatchObject({
      family: "runner_hidden_draw_keep_or_top_replacement",
      originActionId: drawActionId,
      sourceCardInstanceId: crashId,
      sourceCardDefinitionId: "onr_v1_157_crash-everett-inventive-fixer",
      createdAtStateVersion: state.stateVersion,
    });
    const privateChoice = getPlayerView(state, "runner").pendingChoice;
    expect(privateChoice?.options).toHaveLength(4);
    expect(
      privateChoice?.options.every(
        (option) => option.card?.known && option.card.definitionId,
      ),
    ).toBe(true);

    const topOption = state.pendingChoice?.options.find((option) =>
      option.id.startsWith("top_"),
    );
    const topCardId = String(topOption?.value ?? "").split(":")[0];
    state = applyChoice(state, "runner", topOption?.id ?? "");
    expect(state.runner.stack[0]).toBe(topCardId);
    expect(state.runner.grip).not.toContain(topCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      crashEverettDisposition: "top",
      returnedToStackTop: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let trashState = structuredClone(initial);
    trashState = apply(
      trashState,
      "runner",
      (action) => action.type === "draw_card",
    );
    const trashOption = trashState.pendingChoice?.options.find((option) =>
      option.id.startsWith("trash_"),
    );
    const trashCardId = String(trashOption?.value ?? "").split(":")[0];
    trashState = applyChoice(trashState, "runner", trashOption?.id ?? "");
    expect(trashState.runner.heap).toContain(trashCardId);
    expect(trashState.runner.grip).not.toContain(trashCardId);
  });

  it("grants Wilson's run-only action and marks the resulting run spending cap", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-wilson-run-action",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_wilson_runner",
          name: "P3.61 Wilson Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 1;
    const wilsonId = moveRunnerCardToGrip(
      state,
      "onr_v1_187_wilson-weeflerunner-apprentice",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === wilsonId,
    );
    expect(state.runner.clicks).toBe(0);
    const actionsAfterInstall = getLegalActions(state, "runner");
    expect(
      actionsAfterInstall.some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerAbility === "gain_run_only_action",
      ),
    ).toBe(false);
    expect(
      actionsAfterInstall.some((action) => action.type === "end_turn"),
    ).toBe(true);
    const rdRunOnlyAction = actionsAfterInstall.find(
      (action) =>
        action.type === "start_run" &&
        action.payload?.runOnlyAction === true &&
        action.payload?.serverId === "rd",
    );
    expect(rdRunOnlyAction?.label).toBe(
      "Wilson, Weeflerunner Apprentice: Run auf R&D",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.runOnlyAction === true &&
        action.payload?.serverId === "rd",
    );
    expect(state.runner.clicks).toBe(0);
    expect(state.runnerTurnFlags?.runOnlyActionUsedSourceIdsThisTurn).toContain(
      wilsonId,
    );
    expect(state.run?.runActionSpendingCap).toMatchObject({
      limit: 3,
      spent: 0,
    });
  });

  it("offers Wilson after all normal Runner actions have been spent with Wilson unused", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-wilson-after-fourth-normal-action",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_wilson_saved_action_runner",
          name: "P3.61 Wilson Saved Action Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    installRunnerResourceForTest(
      state,
      "onr_v1_187_wilson-weeflerunner-apprentice",
    );
    state.runner.clicks = 4;

    for (let spentClick = 0; spentClick < 4; spentClick += 1) {
      state = apply(state, "runner", (action) => action.type === "gain_credit");
    }

    expect(state.runner.clicks).toBe(0);
    const actionsAfterNormalClicks = getLegalActions(state, "runner");
    expect(
      actionsAfterNormalClicks.some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerAbility === "gain_run_only_action",
      ),
    ).toBe(false);
    expect(
      actionsAfterNormalClicks.some((action) => action.type === "gain_credit"),
    ).toBe(false);
    expect(
      actionsAfterNormalClicks.some((action) => action.type === "end_turn"),
    ).toBe(true);
    expect(
      actionsAfterNormalClicks.some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.runOnlyAction === true &&
          action.payload?.serverId === "hq",
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.runOnlyAction === true &&
        action.payload?.serverId === "hq",
    );
    expect(state.runner.clicks).toBe(0);
    expect(state.run?.runActionSpendingCap).toMatchObject({
      limit: 3,
      spent: 0,
    });
  });

  it("starts Wilson's chosen run immediately without spending a normal Runner action", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-wilson-immediate-run",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_wilson_immediate_runner",
          name: "P3.61 Wilson Immediate Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    const wilsonId = installRunnerResourceForTest(
      state,
      "onr_v1_187_wilson-weeflerunner-apprentice",
    );
    state.runner.clicks = 4;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.runOnlyAction === true &&
        action.payload?.serverId === "hq",
    );

    expect(state.runner.clicks).toBe(4);
    expect(state.runnerTurnFlags?.runOnlyActionUsedSourceIdsThisTurn).toContain(
      wilsonId,
    );
    expect(state.run?.runActionSpendingCap).toMatchObject({
      limit: 3,
      spent: 0,
    });
  });

  it("resolves P3.60 Karl de Veres successful-run credits and Nevinyrral start-turn actions from CardImplementation", () => {
    let karlState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p360-karl-run-credit",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p360_karl_runner",
          name: "P3.60 Karl Runner",
          cards: [
            { id: "onr_v1_166_karl-de-veres-corporate-stooge", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "onr_v1_166_karl-de-veres-corporate-stooge",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    karlState.runner.credits = 10;
    installRunnerResourceForTest(
      karlState,
      "onr_v1_166_karl-de-veres-corporate-stooge",
    );
    const creditsBeforeRun = karlState.runner.credits;
    karlState = apply(
      karlState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(karlState.runner.credits).toBe(creditsBeforeRun);
    karlState = apply(
      karlState,
      "runner",
      (action) => action.type === "access_card",
    );
    if (
      getLegalActions(karlState, "runner").some(
        (action) => action.type === "decline_trash",
      )
    )
      karlState = apply(
        karlState,
        "runner",
        (action) => action.type === "decline_trash",
      );
    while (
      karlState.run &&
      getLegalActions(karlState, "runner").some(
        (action) => action.type === "continue_run",
      )
    )
      karlState = apply(
        karlState,
        "runner",
        (action) => action.type === "continue_run",
      );
    expect(karlState.run).toBeUndefined();
    expect(karlState.runner.credits).toBe(creditsBeforeRun + 1);
    expect(karlState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerCreditsAfter: karlState.runner.credits,
    });

    let nevinyrralState = apply(
      createGameAfterSetup({
        seed: "p360-nevinyrral-start-action",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const nevinyrralId = putCorpRootInRemote(
      nevinyrralState,
      "onr_v1_331_nevinyrral",
    );
    nevinyrralState.cardInstances[nevinyrralId] = {
      ...nevinyrralState.cardInstances[nevinyrralId]!,
      faceup: true,
      rezzed: true,
    };
    nevinyrralState = toRunnerTurnFromCorpMain(nevinyrralState);
    nevinyrralState = apply(
      nevinyrralState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(nevinyrralState.corp.clicks).toBeGreaterThanOrEqual(4);
  });

  it("resolves P3.59 Field Reporter and Preying Mantis runner-turn windows", () => {
    const p359FieldPreyingRunnerCards =
      MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
        (card) =>
          card.id !== "onr_v1_162_field-reporter-for-ice-and-data" &&
          card.id !== "onr_v1_171_preying-mantis",
      );
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-field-preying",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p359_field_preying_runner",
          name: "P3.59 Field/Preying Runner",
          cards: [
            { id: "onr_v1_162_field-reporter-for-ice-and-data", quantity: 1 },
            { id: "onr_v1_171_preying-mantis", quantity: 2 },
            ...p359FieldPreyingRunnerCards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          id: "p359_i_spy_corp",
          name: "P3.59 I Spy Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerResourceForTest(
      state,
      "onr_v1_162_field-reporter-for-ice-and-data",
    );
    const mantisId = installRunnerResourceForTest(
      state,
      "onr_v1_171_preying-mantis",
    );
    const secondMantisId = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        id !== mantisId && card.definitionId === "onr_v1_171_preying-mantis",
    )?.[0] as CardInstanceId | undefined;
    if (!secondMantisId) throw new Error("Second Preying Mantis missing");
    removeEverywhere(state, secondMantisId);
    state.runner.rig.resources.push(secondMantisId);
    state.cardInstances[secondMantisId] = {
      ...state.cardInstances[secondMantisId]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    const clicksBefore = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "optional_extra_action_with_delayed_damage" &&
        action.payload?.cardId === mantisId,
    );
    expect(state.runner.clicks).toBe(clicksBefore + 1);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "optional_extra_action_with_delayed_damage" &&
        action.payload?.cardId === secondMantisId,
    );
    expect(state.runner.clicks).toBe(clicksBefore + 2);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("runner_action.main");

    const creditsBeforeEnd = state.runner.credits;
    const coreBeforeEnd = state.runner.coreDamage;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(creditsBeforeEnd + 1);
    expect(state.runner.coreDamage).toBe(coreBeforeEnd + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 1,
      corpRezzedIceThisTurnCount: 1,
      damageType: "core",
      damageAmount: 2,
    });
    expect(
      state.eventLog
        .at(-1)
        ?.publicPayload.resolvedEffects?.filter(
          (effect) =>
            effect.kind === "damage" && effect.reason === "end_of_turn",
        ),
    ).toHaveLength(2);
  });

  it("resolves P3.59 I Spy fort counters and Corp removal", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-i-spy",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.runner,
          id: "p359_i_spy_runner",
          name: "P3.59 I Spy Runner",
          cards: [
            { id: "onr_v1_032_i-spy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
              (card) => card.id !== "onr_v1_032_i-spy",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          id: "p359_i_spy_corp",
          name: "P3.59 I Spy Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
              (card) => card.id !== "simple_barrier_ice",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    const iSpyId = installRunnerProgramForTest(state, "onr_v1_032_i-spy");
    const rootId = putCorpRootInRemote(state, "simple_economy_asset");
    const iceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");

    state.phase = "run";
    state.timingPoint = "access.resolve_card";
    state.activeSide = "runner";
    state.run = {
      runId: "p359_i_spy_run",
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "successful_run_fort_counter_expose" &&
        action.payload?.cardId === iSpyId,
    );
    expect(state.spyCountersByServer?.remote_1).toBe(1);
    expect(state.runner.heap).toContain(iSpyId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 1,
      counterType: "spy",
    });
    const runnerSpyServerView = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(runnerSpyServerView?.counterDisplays).toContainEqual({
      id: "spy",
      amount: 1,
      displayKind: "generic_counter",
      label: "Spy-Counter",
      ariaLabel: "1 Spy-Counter auf diesem Server",
      counterType: "spy",
      usageHint: "status_marker",
    });
    expect(
      runnerSpyServerView?.ice.find((card) => card.instanceId === iceId),
    ).toMatchObject({
      known: true,
      rezzed: false,
      title: "Simple Barrier ICE",
    });
    expect(
      runnerSpyServerView?.root.find((card) => card.instanceId === rootId),
    ).toMatchObject({
      known: true,
      rezzed: false,
      title: "Simple Economy Asset",
    });

    delete state.run;
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.activeSide = "corp";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.corpAbility === "remove_spy_counter" &&
        action.payload?.serverId === "remote_1",
    );
    expect(state.spyCountersByServer?.remote_1).toBe(0);
    const runnerAfterRemovalServerView = getPlayerView(
      state,
      "runner",
    ).servers.find((server) => server.id === "remote_1");
    expect(runnerAfterRemovalServerView?.counterDisplays).toBeUndefined();
    expect(
      runnerAfterRemovalServerView?.ice.find(
        (card) => card.instanceId !== undefined,
      ),
    ).toMatchObject({
      known: false,
      rezzed: false,
    });
    expect(
      runnerAfterRemovalServerView?.root.find(
        (card) => card.instanceId !== undefined,
      ),
    ).toMatchObject({
      known: false,
      rezzed: false,
    });
  });

  it("rolls Quest for Cattekin at Runner start through replay-safe random", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-quest-start-turn",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p359_quest_runner",
          name: "P3.59 Quest Runner",
          cards: [
            { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "onr_v1_172_quest-for-cattekin",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    installRunnerResourceForTest(state, "onr_v1_172_quest-for-cattekin");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = toRunnerTurn(state);

    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(
      state.randomDrawRecords.some((record) =>
        record.purpose.includes("start_turn_random_effect_table."),
      ),
    ).toBe(true);
    expect(
      state.eventLog
        .slice(replayStart)
        .flatMap((event) => event.publicPayload.resolvedEffects ?? [])
        .some(
          (effect) =>
            (effect as { sourceDefinitionId?: string }).sourceDefinitionId ===
            "onr_v1_172_quest-for-cattekin",
        ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("records Quest for Cattekin start-turn outcomes for no-op, damage and permanent action rolls", () => {
    function resolveQuestStartForRoll(targetRoll: number | number[]): {
      state: GameState;
      effect: Record<string, unknown>;
      questId: CardInstanceId;
      randomBefore: number;
    } {
      const targetRolls = Array.isArray(targetRoll) ? targetRoll : [targetRoll];
      for (let seedIndex = 0; seedIndex < 120; seedIndex += 1) {
        let state = toRunnerTurn(
          createGameAfterSetup({
            seed: `p359-quest-outcome-${targetRoll}-${seedIndex}`,
            baseline: CURRENT_RULES_BASELINE,
            runnerDeck: {
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
              id: `p359_quest_runner_${targetRoll}_${seedIndex}`,
              name: "P3.59 Quest Runner",
              cards: [
                { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
                ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                  (card) => card.id !== "onr_v1_172_quest-for-cattekin",
                ),
              ],
            },
            corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            agendaPointsToWin: 7,
          }),
        );
        const questId = installRunnerResourceForTest(
          state,
          "onr_v1_172_quest-for-cattekin",
        );
        state.randomCounter = seedIndex;
        const randomBefore = state.randomDrawRecords.length;
        const replayStart = state.eventLog.length;
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = toRunnerTurn(state);
        const effect = state.eventLog
          .slice(replayStart)
          .flatMap((event) => event.publicPayload.resolvedEffects ?? [])
          .find(
            (candidate) =>
              (candidate as { effectId?: string }).effectId?.startsWith(
                "runner.start.random_effect_table.",
              ) === true,
          ) as Record<string, unknown> | undefined;
        if (effect && targetRolls.includes(Number(effect.dieRoll)))
          return { state, effect, questId, randomBefore };
      }
      throw new Error(
        `No Quest for Cattekin seed produced roll ${targetRolls.join(", ")}`,
      );
    }

    const noOp = resolveQuestStartForRoll([3, 4, 5]);
    expect(noOp.state.randomDrawRecords.length).toBe(noOp.randomBefore + 1);
    expect(noOp.effect.randomEffectOutcome).toBe("no_effect");
    expect(noOp.state.runner.rig.resources).toContain(noOp.questId);
    expect(noOp.state.runner.clicks).toBe(4);

    const coreDamage = resolveQuestStartForRoll(1);
    expect(coreDamage.effect.randomEffectOutcome).toBe("core_damage");
    expect(coreDamage.effect.damageCannotBePrevented).toBe(true);
    expect(coreDamage.effect.damageType).toBe("core");
    expect(coreDamage.effect.coreDamageAfter).toBeGreaterThanOrEqual(1);

    const netDamage = resolveQuestStartForRoll(2);
    expect(netDamage.effect.randomEffectOutcome).toBe("net_damage");
    expect(netDamage.effect.damageCannotBePrevented).toBe(true);
    expect(netDamage.effect.damageType).toBe("net");
    expect(netDamage.effect.cardsTrashed).toBeGreaterThanOrEqual(1);

    const permanentAction = resolveQuestStartForRoll(6);
    expect(permanentAction.effect.randomEffectOutcome).toBe("permanent_action");
    expect(permanentAction.effect.sourceTrashed).toBe(true);
    expect(permanentAction.state.runner.rig.resources).not.toContain(
      permanentAction.questId,
    );
    expect(permanentAction.state.runner.heap).toContain(
      permanentAction.questId,
    );
    expect(permanentAction.state.runner.clicks).toBe(5);
    expect(
      permanentAction.state.runnerTurnFlags?.persistentModifiers,
    ).toContainEqual({
      sourceCardInstanceId: permanentAction.questId,
      sourceDefinitionId: "onr_v1_172_quest-for-cattekin",
      kind: "runner_extra_actions_per_turn",
      amount: 1,
    });
    const randomAfterFirstQuest =
      permanentAction.state.randomDrawRecords.length;
    let nextTurn = apply(
      permanentAction.state,
      "runner",
      (action) => action.type === "end_turn",
    );
    nextTurn = toRunnerTurn(nextTurn);
    expect(nextTurn.runner.clicks).toBe(5);
    expect(nextTurn.randomDrawRecords.length).toBe(randomAfterFirstQuest);
  });

  it("resolves Social Engineering secret guess, rez window and one encounter auto-pass", () => {
    const socialRunnerDeck = MECHANIC_SMOKE_DECKS.runAccess.runner;
    const socialCorpDeck = {
      ...MECHANIC_SMOKE_DECKS.runAccess.corp,
      id: "p358_social_engineering_corp",
      name: "P3.58 Social Engineering Corp",
      cards: [
        { id: "simple_barrier_ice", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
          (card) => card.id !== "simple_barrier_ice",
        ),
      ],
    };
    let correct = toRunnerTurn(
      createGameAfterSetup({
        seed: "p358-social-correct",
        runnerDeck: socialRunnerDeck,
        corpDeck: socialCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    correct.runner.credits = 5;
    const correctEventId = moveRunnerCardToGrip(
      correct,
      "onr_v1_111_social-engineering",
    );
    correct.runner.credits = 2;
    expect(
      getLegalActions(correct, "runner").some(
        (action) =>
          action.type === "play_event" &&
          action.payload?.cardId === correctEventId,
      ),
    ).toBe(false);
    correct.runner.credits = 3;
    const exactThresholdAction = getLegalActions(correct, "runner").find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === correctEventId,
    );
    expect(exactThresholdAction).toBeDefined();
    const exactThresholdResult = applyAction(structuredClone(correct), {
      matchId: correct.matchId,
      side: "runner",
      actionId: exactThresholdAction?.actionId ?? "",
      clientKnownStateVersion: correct.stateVersion,
      idempotencyKey: "p358-social-exact-threshold",
    });
    expect(exactThresholdResult.ok).toBe(true);
    if (exactThresholdResult.ok) {
      expect(exactThresholdResult.state.runner.credits).toBe(2);
      expect(exactThresholdResult.state.pendingChoice?.source).toContain(
        "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide",
      );
    }
    correct.runner.credits = 5;
    correct = apply(
      correct,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === correctEventId,
    );
    expect(correct.pendingChoice?.source).toContain(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide",
    );
    expect(getPlayerView(correct, "corp").pendingChoice).toBeUndefined();
    correct = applyChoice(correct, "runner", "hide_3");
    expect(correct.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_111_social-engineering",
      hiddenZoneBarrier: true,
    });
    expect(correct.pendingChoice?.source).toContain(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess",
    );
    correct = applyChoice(correct, "corp", "guess_3");
    expect(correct.runner.credits).toBe(1);
    expect(correct.pendingChoice).toBeUndefined();
    expect(correct.activeSide).toBe("runner");
    expect(
      getLegalActions(correct, "runner").some(
        (action) => action.type === "end_turn",
      ),
    ).toBe(true);
    expect(getLegalActions(correct, "corp")).toHaveLength(0);
    expect(correct.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_111_social-engineering",
      hiddenZoneBarrier: true,
      amounts: expect.objectContaining({
        secretHiddenAmountRevealed: 3,
        secretGuessAmount: 3,
      }),
      targets: expect.objectContaining({
        secretSpendGuessRunGuessCorrect: true,
      }),
    });

    let wrong = toRunnerTurn(
      createGameAfterSetup({
        seed: "p358-social-wrong",
        runnerDeck: socialRunnerDeck,
        corpDeck: socialCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    wrong.runner.credits = 5;
    const wrongEventId = moveRunnerCardToGrip(
      wrong,
      "onr_v1_111_social-engineering",
    );
    const iceId = putCorpIceOnServer(wrong, "rd", "simple_barrier_ice");
    wrong.cardInstances[iceId] = {
      ...wrong.cardInstances[iceId]!,
      faceup: false,
      rezzed: false,
    };
    wrong = apply(
      wrong,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === wrongEventId,
    );
    wrong = applyChoice(wrong, "runner", "hide_3");
    wrong = applyChoice(wrong, "corp", "guess_2");
    expect(wrong.pendingChoice?.source).toContain(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target",
    );
    expect(getPlayerView(wrong, "corp").pendingChoice).toBeUndefined();
    wrong = applyChoice(wrong, "runner", `ice_${iceId}`);
    expect(wrong.timingPoint).toBe("run.approach_ice");
    expect(wrong.activeSide).toBe("corp");
    expect(wrong.run).toMatchObject({
      phase: "approach_ice",
      approachedIceId: iceId,
      secretSpendGuessRunAutoPassIceId: iceId,
    });
    expect(getPlayerView(wrong, "runner").run?.pendingAutoPassIceId).toBe(
      iceId,
    );
    expect(
      getPlayerView(wrong, "corp").run?.pendingAutoPassIceId,
    ).toBeUndefined();
    expect(
      getLegalActions(wrong, "corp").some(
        (action) => action.type === "rez_ice" && action.source === iceId,
      ),
    ).toBe(true);
    expect(wrong.run?.position).toMatchObject({
      kind: "ice",
      serverId: "rd",
    });
    expect(wrong.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_111_social-engineering",
      secretSpendGuessRun: true,
      hiddenZoneBarrier: true,
      targets: expect.objectContaining({
        secretSpendGuessRunGuessCorrect: false,
        autoPassChosenIce: true,
      }),
    });
    expect(JSON.stringify(wrong.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_barrier_ice",
    );
    wrong = apply(
      wrong,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(wrong.cardInstances[iceId]?.rezzed).toBe(true);
    expect(wrong.run?.secretSpendGuessRunAutoPassIceId).toBeUndefined();
    expect(wrong.run?.position).toMatchObject({
      kind: "server",
      serverId: "rd",
    });
    expect(wrong.eventLog.at(-1)?.publicPayload).toMatchObject({
      targetCardDefinitionId: "simple_barrier_ice",
    });
  });

  it("loads Pocket Virtual Reality temporary encounter trace credits for its printed traces", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("p356-pocket-vr-temp-credits"),
    );
    state.runner.credits = 0;
    state.corp.credits = 7;
    putCorpIceOnServer(state, "rd", "onr_v1_260_pocket-virtual-reality");

    state = encounterIce(state, "rd", "onr_v1_260_pocket-virtual-reality");
    state.corp.credits = 0;
    const pocketVirtualReality = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find(
        (card) => card.definitionId === "onr_v1_260_pocket-virtual-reality",
      );
    expect(pocketVirtualReality?.effectiveRunQuote).toMatchObject({
      encounterTemporaryTraceCredits: 4,
    });
    expect(state.run?.encounterTemporaryTraceCredits).toMatchObject({
      sourceDefinitionId: "onr_v1_260_pocket-virtual-reality",
      remaining: 4,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace?.corpBidMax).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStarted: true,
      temporaryTraceCreditsAvailable: 4,
      temporaryTraceCreditsSourceDefinitionId:
        "onr_v1_260_pocket-virtual-reality",
    });

    state = applyChoice(state, "corp", "bid_4");
    expect(state.corp.credits).toBe(0);
    expect(state.run?.encounterTemporaryTraceCredits?.remaining).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      temporaryTraceCreditsSpent: 4,
      temporaryTraceCreditsRemaining: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace?.corpBidMax).toBe(0);
  });

  it("uses P3.51 Silver Lining advancement history and Omniscience/Disinfectant hooks", () => {
    let silver = apply(
      createGameAfterSetup({
        seed: "p351-silver-lining-formula",
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          id: "p351_silver_corp",
          name: "P3.51 Silver Corp",
          cards: [
            { id: "onr_v1_303_silver-lining-recovery-protocol", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                card.id !== "onr_v1_303_silver-lining-recovery-protocol",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    silver.corp.credits = 5;
    moveCorpCardToHq(silver, "onr_v1_303_silver-lining-recovery-protocol");
    silver.runnerTurnFlags = {
      ...(silver.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: true,
      stolenAgendaAdvancementCountersLastTurn: 4,
    };
    silver = apply(
      silver,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(silver, action) ===
          "onr_v1_303_silver-lining-recovery-protocol",
    );
    expect(silver.corp.credits).toBe(17);
    expect(silver.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 12,
    });

    let omni = apply(
      createGameAfterSetup({
        seed: "p351-omniscience-extra-tag",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
          id: "p351_omni_fall_guy_runner",
          cards: [
            { id: "onr_v1_161_fall-guy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          id: "p351_omni_corp",
          name: "P3.51 Omni Corp",
          cards: [
            { id: "onr_v1_333_omniscience-foundation", quantity: 1 },
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                card.id !== "onr_v1_333_omniscience-foundation" &&
                card.id !== "onr_v1_306_trojan-horse",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    omni.corp.credits = 10;
    omni.runner.tags = 0;
    const omniId = moveCorpCardToHq(omni, "onr_v1_333_omniscience-foundation");
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === omniId &&
        action.payload?.serverId === "new_remote",
    );
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === omniId,
    );
    moveCorpCardToHq(omni, "onr_v1_306_trojan-horse");
    omni.runnerTurnFlags = {
      ...(omni.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: true,
    };
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(omni, action) === "onr_v1_306_trojan-horse",
    );
    expect(omni.runner.tags).toBe(1);
    const omniFallGuyId = installRunnerResourceForTest(
      omni,
      "onr_v1_161_fall-guy",
    );
    const omniInitial = structuredClone(omni);
    const omniReplayStart = omni.eventLog.length;
    omni = apply(omni, "corp", (action) => action.type === "end_turn");
    expect(omni.runner.tags).toBe(1);
    expect(omni.pendingAddTagContinuation).toMatchObject({
      kind: "end_turn_tag",
      side: "corp",
    });

    const omniPassState = applyChoice(structuredClone(omni), "runner", "pass");
    expect(omniPassState.runner.tags).toBe(2);
    expect(omniPassState.runner.rig.resources).toContain(omniFallGuyId);
    expect(omniPassState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerTagsAfter: 2,
    });

    const omniFallGuyOption = omni.pendingChoice?.options.find((option) =>
      option.id.includes(String(omniFallGuyId)),
    )?.id;
    const omniAvoidState = applyChoice(
      omni,
      "runner",
      String(omniFallGuyOption),
    );
    expect(omniAvoidState.runner.tags).toBe(1);
    expect(omniAvoidState.runner.heap).toContain(omniFallGuyId);
    expect(omniAvoidState.pendingAddTagContinuation).toBeUndefined();

    for (const branch of [omniPassState, omniAvoidState]) {
      const replay = replayEvents(
        omniInitial,
        branch.eventLog.slice(omniReplayStart),
      );
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }

    let disinfectant = toRunnerTurn(
      createGameAfterSetup({
        seed: "p351-disinfectant-avoid-virus",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.counterRecurring.runner,
          id: "p351_disinfectant_runner",
          name: "P3.51 Disinfectant Runner",
          cards: [
            { id: "onr_v1_009_butcher-boy", quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.counterRecurring.runner.cards.filter(
              (card) => card.id !== "onr_v1_009_butcher-boy",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.counterRecurring.corp,
          id: "p351_disinfectant_corp",
          name: "P3.51 Disinfectant Corp",
          cards: [
            { id: "onr_v1_319_disinfectant-inc", quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.counterRecurring.corp.cards.filter(
              (card) => card.id !== "onr_v1_319_disinfectant-inc",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    disinfectant.corp.credits = 3;
    const disinfectantIds = [
      addRezzedCorpRootForTest(
        disinfectant,
        "onr_v1_319_disinfectant-inc",
        "remote_1",
        "disinfectant_first",
      ),
      addRezzedCorpRootForTest(
        disinfectant,
        "onr_v1_319_disinfectant-inc",
        "remote_2",
        "disinfectant_second",
      ),
    ];
    const butcherId = installRunnerProgramForTest(
      disinfectant,
      "onr_v1_009_butcher-boy",
    );
    const secondButcherId = installRunnerProgramCopyForTest(
      disinfectant,
      "onr_v1_009_butcher-boy",
    );
    for (const cardId of disinfectant.corp.hq.slice()) {
      removeEverywhere(disinfectant, cardId);
      disinfectant.corp.archives.push(cardId);
      disinfectant.cardInstances[cardId] = {
        ...disinfectant.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }
    moveCorpCardToHq(disinfectant, "simple_economy_operation");

    let noCredit = structuredClone(disinfectant);
    noCredit.corp.credits = 0;
    noCredit = apply(
      noCredit,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    noCredit = apply(
      noCredit,
      "runner",
      (action) =>
        action.type === "access_card" ||
        action.type === "steal_agenda" ||
        action.type === "decline_trash",
    );
    expect(noCredit.pendingChoice).toBeUndefined();
    expect(
      noCredit.purgeableRunnerVirusCounters?.corp
        ?.successful_hq_run_pair_credit,
    ).toBe(2);

    disinfectant = apply(
      disinfectant,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    disinfectant = apply(
      disinfectant,
      "runner",
      (action) =>
        action.type === "access_card" ||
        action.type === "steal_agenda" ||
        action.type === "decline_trash",
    );
    expect(disinfectant.pendingChoice).toMatchObject({
      side: "corp",
      source: "card_implementation.counter_prevention_replacement",
    });
    expect(cardCounterAmount(disinfectant, butcherId, "virus")).toBe(0);
    expect(cardCounterAmount(disinfectant, secondButcherId, "virus")).toBe(0);
    expect(disinfectant.corp.credits).toBe(3);
    expect(
      disinfectant.pendingVirusCounterPrevention?.targets.map((target) =>
        target.kind === "corp_pool" ? target.counterType : target.kind,
      ),
    ).toEqual([
      "successful_hq_run_pair_credit",
      "successful_hq_run_pair_credit",
    ]);

    let declined = structuredClone(disinfectant);
    declined = applyChoice(declined, "corp", "pass");
    expect(declined.pendingChoice?.source).toBe(
      "card_implementation.counter_prevention_replacement",
    );
    declined = applyChoice(declined, "corp", "pass");
    expect(
      declined.purgeableRunnerVirusCounters?.corp
        ?.successful_hq_run_pair_credit,
    ).toBe(2);
    expect(declined.corp.credits).toBe(3);

    const firstPreventionOption = disinfectant.pendingChoice?.options.find(
      (option) => option.value === disinfectantIds[1],
    );
    expect(firstPreventionOption).toBeDefined();
    disinfectant = applyChoice(
      disinfectant,
      "corp",
      firstPreventionOption?.id ?? "",
    );
    expect(
      disinfectant.pendingChoice?.options.some(
        (option) => option.value === disinfectantIds[1],
      ),
    ).toBe(false);
    const secondPreventionOption = disinfectant.pendingChoice?.options.find(
      (option) => option.value === disinfectantIds[0],
    );
    disinfectant = applyChoice(
      disinfectant,
      "corp",
      secondPreventionOption?.id ?? "",
    );
    expect(cardCounterAmount(disinfectant, butcherId, "virus")).toBe(0);
    expect(cardCounterAmount(disinfectant, secondButcherId, "virus")).toBe(0);
    expect(
      disinfectant.purgeableRunnerVirusCounters?.corp
        ?.successful_hq_run_pair_credit ?? 0,
    ).toBe(0);
    expect(disinfectant.corp.credits).toBe(1);
    expect(disinfectant.pendingChoice).toBeUndefined();
  });

  it("starts Stumble through Wilderspace runs with a temporary trace-link bonus from CardImplementation", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p348-stumble-run-trace-link-bonus",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p348_stumble_runner",
          name: "P3.48 Stumble Runner",
          cards: [
            { id: "onr_v1_112_stumble-through-wilderspace", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "onr_v1_112_stumble-through-wilderspace");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_112_stumble-through-wilderspace" &&
        action.payload?.serverId === "rd",
    );

    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.runTraceLinkBonus).toBe(9);
    expect(state.run?.runTraceLinkBonusSourceDefinitionId).toBe(
      "onr_v1_112_stumble-through-wilderspace",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_112_stumble-through-wilderspace",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
  });

  it("hosts P3.46 programs on Daemons, applies hosted strength penalties and revalidates host capacity", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p346-daemon-hosting",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 80;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 2;
    p344MoveRunnerCardToGrip(state, "onr_v1_001_afreet");
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    p344MoveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    p344MoveRunnerCardToGrip(state, "onr_v1_016_cyfermaster");
    p344MoveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    p344MoveRunnerCardToGrip(state, "onr_v1_069_succubus");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_001_afreet",
    );
    expect(afreetId).toBeDefined();
    if (!afreetId) throw new Error("Missing Afreet");
    expect(state.runner.memoryUsed).toBe(1);

    const staleHostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia" &&
        action.payload?.hostOnCardId === afreetId,
    );
    const staleHostState = structuredClone(state);
    removeEverywhere(staleHostState, afreetId);
    expect(
      applyAction(staleHostState, {
        matchId: staleHostState.matchId,
        side: "runner",
        actionId: staleHostedInstall.actionId,
        clientKnownStateVersion: staleHostState.stateVersion,
        idempotencyKey: "p346-stale-host-install",
      }).ok,
    ).toBe(false);

    const hostedDefinitionIds = [
      "onr_v1_006_black-dahlia",
      "onr_v1_015_codeslinger",
      "onr_v1_016_cyfermaster",
    ] as const;
    const hostedIds: CardInstanceId[] = [];
    for (const definitionId of hostedDefinitionIds) {
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId &&
          action.payload?.hostOnCardId === afreetId,
      );
      hostedIds.push(String(install.payload?.cardId ?? "") as CardInstanceId);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
    }
    expect(state.runner.memoryUsed).toBe(1);
    for (const hostedId of hostedIds)
      expect(state.cardInstances[hostedId]?.hostedOn).toBe(afreetId);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === hostedIds[0],
      )?.strength,
    ).toBe(4);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_014_codecracker" &&
          action.payload?.hostOnCardId === afreetId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_069_succubus",
    );
    const succubusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_069_succubus",
    );
    expect(succubusId).toBeDefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_014_codecracker" &&
          action.payload?.hostOnCardId === succubusId,
      ),
    ).toBe(true);
  });

  it("resolves P3.46 Chimera through CardImplementation and trashes hosted Daemon programs", () => {
    let state = toRunnerTurn(
      v199CardReleaseGame("p346-chimera-card-implementation"),
    );
    state.runner.credits = 60;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 2;
    p344MoveRunnerCardToGrip(state, "onr_v1_001_afreet");
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_001_afreet",
    );
    if (!afreetId) throw new Error("Missing Afreet");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia" &&
        action.payload?.hostOnCardId === afreetId,
    );
    const hostedId = String(
      hostedInstall.payload?.cardId ?? "",
    ) as CardInstanceId;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    const chimeraId = putCorpRootInRemote(state, "onr_v1_353_chimera");
    state.cardInstances[chimeraId] = {
      ...state.cardInstances[chimeraId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toContain(afreetId);
    expect(state.runner.heap).toContain(hostedId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      trashedCardDefinitionId: "onr_v1_001_afreet",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays the unlocked R&D and HQ multiaccess events with hidden queues", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("v123-custodial-position"));
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "simple_economy_operation");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_220_tycho-extension");

    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rdState, action) === "onr_v1_081_custodial-position" &&
        action.payload?.serverId === "rd",
    );

    expect(rdState.timingPoint).toBe("access.resolve_card");
    expect(rdState.run?.breach).toMatchObject({
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(
      JSON.stringify(rdState.eventLog.at(-1)?.publicPayload),
    ).not.toContain("Tycho Extension");

    let hqState = toRunnerTurn(v123CardReleaseGame("v123-executive-wiretaps"));
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const first = moveCorpCardToHq(hqState, "simple_economy_operation");
    const second = moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover");
    const third = moveCorpCardToHq(hqState, "onr_v1_220_tycho-extension");
    keepOnlyCorpHqCards(hqState, [first, second, third]);

    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" &&
        action.payload?.serverId === "hq",
    );

    expect(hqState.run?.breach).toMatchObject({
      serverId: "hq",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(hqState, "runner"))).not.toContain(
      "Tycho Extension",
    );
    expect(getPlayerView(hqState, "runner").run?.breach?.remainingCount).toBe(
      3,
    );
  });

  it("removes MIT West Tier from the game after a deterministic hidden shuffle and draw", () => {
    let state = toRunnerTurn(v123CardReleaseGame("v123-mit-west-tier"));
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_101_mit-west-tier",
    );

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.heap).not.toContain(eventId);
    expect(state.specialZones?.removedFromGame).toEqual([eventId]);
    expect(state.cardInstances[eventId]?.zone).toMatchObject({
      side: "special",
      zone: "removed_from_game",
      visibility: "public",
    });
    expect(
      getPlayerView(state, "runner").specialZones?.removedFromGame[0],
    ).toMatchObject({
      definitionId: "onr_v1_101_mit-west-tier",
      owner: "runner",
      controller: "runner",
    });
    expect(
      getPlayerView(state, "corp").specialZones?.removedFromGame[0],
    ).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "runner_",
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("plays Overtime Incentives as a LegalAction-only Corp action gain", () => {
    let state = v123CardReleaseGame("v123-overtime");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 3;
    state.corp.credits = 5;
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");

    const before = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_297_overtime-incentives",
    );

    expect(state.corp.clicks).toBe(before + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_297_overtime-incentives",
      gainedActions: 2,
    });
    expect(
      JSON.stringify(
        getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
      ),
    ).not.toContain("corp_");
  });

  it("gates Trojan Horse on runner agenda theft in the last turn and gives 1 tag when legal", () => {
    let state = v123CardReleaseGame("v123-trojan-horse");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    state.corp.credits = 8;

    const beforeRunnerTurn = apply(
      state,
      "corp",
      (action) => action.type === "end_turn",
    );
    const beforeTheftInput = getLegalActions(beforeRunnerTurn, "corp").filter(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(beforeRunnerTurn, action) ===
          "onr_v1_306_trojan-horse",
    );
    expect(beforeTheftInput).toHaveLength(0);
    moveCorpCardToArchives(beforeRunnerTurn, "onr_v1_220_tycho-extension");

    let afterTheft = apply(
      beforeRunnerTurn,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "access_card",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "end_turn",
    );
    afterTheft = apply(
      afterTheft,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const trojanAfterTheft = moveCorpCardToHq(
      afterTheft,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(afterTheft, trojanAfterTheft);
    afterTheft.corp.credits = 8;
    const beforeTags = afterTheft.runner.tags;

    afterTheft = apply(
      afterTheft,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(afterTheft, action) === "onr_v1_306_trojan-horse",
    );

    expect(afterTheft.runner.tags).toBe(beforeTags + 1);
    expect(afterTheft.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_306_trojan-horse",
    });
  });

  it("uses CardImplementation tag avoidance for Fall Guy and Total Genetic Retrofit", () => {
    let fallGuyState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p342-fall-guy",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p342_fall_guy_runner",
          cards: [
            { id: "onr_v1_161_fall-guy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p342_fall_guy_corp",
          cards: [
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    fallGuyState.runner.credits = 8;
    fallGuyState.runner.clicks = 4;
    const fallGuyId = moveRunnerCardToGrip(fallGuyState, "onr_v1_161_fall-guy");
    fallGuyState = apply(
      fallGuyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === fallGuyId,
    );
    fallGuyState.runnerTurnFlags = {
      ...(fallGuyState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn:
        fallGuyState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    fallGuyState = apply(
      fallGuyState,
      "runner",
      (action) => action.type === "end_turn",
    );
    fallGuyState = apply(
      fallGuyState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    fallGuyState.runnerTurnFlags = {
      ...(fallGuyState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn:
        fallGuyState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    const trojanId = moveCorpCardToHq(fallGuyState, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(fallGuyState, trojanId);
    fallGuyState.corp.credits = 8;
    const fallGuyBefore = structuredClone(fallGuyState);
    const fallGuyReplayStart = fallGuyState.eventLog.length;
    fallGuyState = apply(
      fallGuyState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(fallGuyState, action) === "onr_v1_306_trojan-horse",
    );
    expect(fallGuyState.pendingChoice?.source).toContain("event_modification");
    expect(fallGuyState.runner.tags).toBe(0);
    const fallGuyOption = fallGuyState.pendingChoice?.options.find((option) =>
      option.id.includes("avoid_tag"),
    )?.id;
    expect(fallGuyOption).toBeDefined();
    if (!fallGuyOption) throw new Error("Missing Fall Guy tag-avoid option");
    const fallGuyPassState = applyChoice(
      structuredClone(fallGuyState),
      "runner",
      "pass",
    );
    expect(fallGuyPassState.runner.tags).toBe(1);
    expect(fallGuyPassState.runner.rig.resources).toContain(fallGuyId);
    const passReplay = replayEvents(
      fallGuyBefore,
      fallGuyPassState.eventLog.slice(fallGuyReplayStart),
    );
    expect(passReplay.ok).toBe(true);
    expect(hashState(passReplay.state)).toBe(hashState(fallGuyPassState));

    fallGuyState = applyChoice(fallGuyState, "runner", fallGuyOption);
    expect(fallGuyState.runner.tags).toBe(0);
    expect(fallGuyState.runner.heap).toContain(fallGuyId);
    expect(fallGuyState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_161_fall-guy",
    });
    const avoidReplay = replayEvents(
      fallGuyBefore,
      fallGuyState.eventLog.slice(fallGuyReplayStart),
    );
    expect(avoidReplay.ok).toBe(true);
    expect(hashState(avoidReplay.state)).toBe(hashState(fallGuyState));

    let retrofitState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p342-total-genetic-retrofit",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p342_total_genetic_retrofit_runner",
          cards: [
            { id: "onr_v1_116_total-genetic-retrofit", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p342_total_genetic_retrofit_corp",
          cards: [
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    retrofitState.runner.credits = 8;
    retrofitState.runner.clicks = 4;
    retrofitState.runner.tags = 2;
    const retrofitId = moveRunnerCardToGrip(
      retrofitState,
      "onr_v1_116_total-genetic-retrofit",
    );
    retrofitState = apply(
      retrofitState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === retrofitId,
    );
    expect(retrofitState.runner.tags).toBe(0);
    expect(retrofitState.runnerTagAvoidanceCredits).toBe(1);
    retrofitState.runnerTurnFlags = {
      ...(retrofitState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn:
        retrofitState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    retrofitState = apply(
      retrofitState,
      "runner",
      (action) => action.type === "end_turn",
    );
    retrofitState = apply(
      retrofitState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    retrofitState.runnerTurnFlags = {
      ...(retrofitState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn:
        retrofitState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    const retrofitTrojanId = moveCorpCardToHq(
      retrofitState,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(retrofitState, retrofitTrojanId);
    retrofitState.corp.credits = 8;
    retrofitState = apply(
      retrofitState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(retrofitState, action) === "onr_v1_306_trojan-horse",
    );
    expect(retrofitState.runner.tags).toBe(0);
    expect(retrofitState.runnerTagAvoidanceCredits).toBe(0);
    expect(retrofitState.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 0,
      runnerTagsAfter: 0,
    });
  });
});
