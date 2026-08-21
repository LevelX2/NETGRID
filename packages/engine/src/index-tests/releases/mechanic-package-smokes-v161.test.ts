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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.6.1 Mechanikpaket A", () => {
  it("adds a controlled V1.6.1 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_1_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_6_1_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|worm|search|arrange|shuffle|unique|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_023_evil-twin"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_028_force-shield"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_125_dermatech-bodyplating"],
    ).toMatchObject({
      installCost: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_229_code-corpse"]).toMatchObject({
      rezCost: 10,
      strength: 5,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_231_cortical-scrub"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_254_liche"]).toMatchObject({
      rezCost: 14,
      strength: 6,
    });
  });

  it("validates V1.6.1 smoke decks and keeps prior ONR runtime cards legal", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v161CardReleaseGame("v161-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_021_dwarf"]).toBeDefined();
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_297_overtime-incentives"],
    ).toBeDefined();
  });

  it("uses the runtime prevention window from Dermatech Bodyplating", () => {
    let meatState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v161-dermatech",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: ONR_V1_6_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    meatState.runner.credits = 20;
    moveRunnerCardToGrip(meatState, "onr_v1_125_dermatech-bodyplating");
    meatState = apply(
      meatState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(meatState, action) ===
          "onr_v1_125_dermatech-bodyplating",
    );
    meatState = apply(
      meatState,
      "runner",
      (action) => action.type === "end_turn",
    );
    meatState = apply(
      meatState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    meatState.runner.tags = 1;
    moveCorpCardToHq(meatState, "onr_v1_302_scorched-earth");
    const meatGripBefore = meatState.runner.grip.length;
    meatState = apply(
      meatState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(meatState, action) === "onr_v1_302_scorched-earth",
    );
    const meatPreventionOption = meatState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    meatState = applyChoice(
      meatState,
      "runner",
      meatPreventionOption ?? "pass",
    );
    expect(meatState.runner.grip.length).toBe(meatGripBefore - 3);
    expect(meatState.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 3,
    });
  });

  it("resolves new core-damage ICE through replayable, side-safe run paths", () => {
    const cases = [
      { ice: "onr_v1_229_code-corpse", expectedCoreDamage: 2 },
      { ice: "onr_v1_231_cortical-scrub", expectedCoreDamage: 1 },
      { ice: "onr_v1_254_liche", expectedCoreDamage: 3 },
    ] as const;

    for (const testCase of cases) {
      let state = toRunnerTurn(v161CardReleaseGame(`v161-${testCase.ice}`));
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
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
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(state.runner.coreDamage).toBe(testCase.expectedCoreDamage);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        result: "ended",
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});
