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

describe("V1.0.6K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_0_6K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_0_6K_FINAL_CARD_IDS) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.implementationStatus,
        String(definitionId),
      ).toBe("playable_mvp");
    }

    expect(CARD_DEFINITIONS_BY_ID[284]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID[357]).toMatchObject({
      installCost: 1,
    });
    expect(CARD_DEFINITIONS_BY_ID[432]).toMatchObject({
      advancementRequirement: 4,
      agendaPoints: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID[456]).toMatchObject({
      rezCost: 0,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID[457]).toMatchObject({
      rezCost: 5,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID[464]).toMatchObject({
      rezCost: 4,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID[468]).toMatchObject({
      rezCost: 5,
      strength: 5,
    });
  });

  it("validates V1.0.6K smoke decks and keeps the previous V1.0.5K cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_6K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_0_6K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v106kCardReleaseGame("v106k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID[227]).toBeDefined();
    expect(CARD_DEFINITIONS_BY_ID[415]).toBeDefined();
  });

  it("plays V1.0.6K Runner economy/draw cards, installs WuTech and uses Wild Card", () => {
    let state = toRunnerTurn(v106kCardReleaseGame("v106k-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 12;
    moveRunnerCardToGrip(state, 291);
    moveRunnerCardToGrip(state, 307);
    moveRunnerCardToGrip(state, 309);
    moveRunnerCardToGrip(state, 320);
    moveRunnerCardToGrip(state, 357);
    moveRunnerCardToGrip(state, 284);

    const beforeBodyweightGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          291,
    );
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 307,
    );
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    const contactsAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 309,
    );
    expect(contactsAction?.payload).toMatchObject({ gainCreditsAmount: 3 });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 309,
    );
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 320,
    );
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 357,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 284,
    );
    expect(state.runner.memoryLimit).toBe(4);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(5);
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain(284);

    let sentryRun = toRunnerTurn(
      v106kCardReleaseGame("v106k-wild-card-sentry"),
    );
    sentryRun.runner.credits = 20;
    installRunnerProgramForTest(sentryRun, 284);
    putCorpIceOnServer(sentryRun, "rd", 601);
    putCorpCardOnTopOfRd(sentryRun, 596);
    sentryRun.corp.credits = 20;

    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryRun = apply(
      sentryRun,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryRun, action) === 601,
    );
    sentryRun = enterEncounterFromMovementWindow(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === 284,
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === 284,
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === 284,
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === 284,
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === 284,
    );
    sentryRun = continueRunThroughMovement(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: 596,
    });
  });

  it("plays V1.0.6K Corp economy, tagged and damage operations", () => {
    let state = createGameAfterSetup({
      seed: "v106k-corp-operations",
      runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
      corpDeck: ONR_V1_0_6K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.runner.tags = 1;
    state.runner.credits = 9;
    moveCorpCardToHq(state, 493);
    moveCorpCardToHq(state, 494);
    moveCorpCardToHq(state, 500);
    moveCorpCardToHq(state, 502);
    moveCorpCardToHq(state, 497);
    moveCorpCardToHq(state, 499);

    const beforeAccounts = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 493,
    );
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeReviewsHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 494,
    );
    expect(state.corp.hq.length).toBe(beforeReviewsHq + 2);

    const beforeDayShiftHq = state.corp.hq.length;
    const beforeDayShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 500,
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);
    expect(state.corp.credits).toBe(beforeDayShiftCredits + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 502,
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 499,
    );
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 497,
    );
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      [513, 2],
      [514, 4],
      [519, 5],
    ] as const) {
      let damageState = createGameAfterSetup({
        seed: `v106k-${definitionId}`,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      });
      damageState = apply(
        damageState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(
        damageState,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(damageState, action) === definitionId,
      );
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false,
      });
    }
  });

  it("rezzes V1.0.6K simple ICE and keeps unrezzed titles hidden", () => {
    for (const definitionId of [
      456,
      457,
      464,
      468,
    ] as const) {
      let state = toRunnerTurn(
        v106kCardReleaseGame(`v106k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 20;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        CARD_DEFINITIONS_BY_ID[definitionId]?.title,
      );

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
          sourceDefinition(state, action) === definitionId,
      );

      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        CARD_DEFINITIONS_BY_ID[definitionId]?.title,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
    }
  });

  it("does not offer Fire Wall rez actions below its printed 5-credit rez cost", () => {
    let state = toRunnerTurn(v106kCardReleaseGame("v106k-fire-wall-rez-cost"));
    const fireWallId = putCorpIceOnServer(state, "rd", 457);
    state.corp.credits = 4;

    expect(quoteCorpRezCost(state, fireWallId).finalCredits).toBe(5);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === 457,
      ),
    ).toBe(false);
  });
});
