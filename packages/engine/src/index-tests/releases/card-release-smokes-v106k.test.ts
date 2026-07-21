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

describe("V1.0.6K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_0_6K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_0_6K_FINAL_CARD_IDS) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(CARD_DEFINITIONS_BY_ID["onr_v1_072_wild-card"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_145_wutech-mem-chip"]).toMatchObject({
      installCost: 1,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_220_tycho-extension"]).toMatchObject({
      advancementRequirement: 4,
      agendaPoints: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_244_filter"]).toMatchObject({
      rezCost: 0,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_245_fire-wall"]).toMatchObject({
      rezCost: 5,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_252_keeper"]).toMatchObject({
      rezCost: 4,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_256_mazer"]).toMatchObject({
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
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_203_hostile-takeover"]).toBeDefined();
  });

  it("plays V1.0.6K Runner economy/draw cards, installs WuTech and uses Wild Card", () => {
    let state = toRunnerTurn(v106kCardReleaseGame("v106k-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 12;
    moveRunnerCardToGrip(state, "onr_v1_079_bodyweight-synthetic-blood");
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    moveRunnerCardToGrip(state, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(state, "onr_v1_108_score");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_072_wild-card");

    const beforeBodyweightGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_079_bodyweight-synthetic-blood",
    );
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_095_jack-n-joe",
    );
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    const contactsAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_097_livewires-contacts",
    );
    expect(contactsAction?.payload).toMatchObject({ gainCreditsAmount: 3 });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_097_livewires-contacts",
    );
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_108_score",
    );
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_072_wild-card",
    );
    expect(state.runner.memoryLimit).toBe(4);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(5);
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("onr_v1_072_wild-card");

    let sentryRun = toRunnerTurn(
      v106kCardReleaseGame("v106k-wild-card-sentry"),
    );
    sentryRun.runner.credits = 20;
    installRunnerProgramForTest(sentryRun, "onr_v1_072_wild-card");
    putCorpIceOnServer(sentryRun, "rd", "simple_sentry_ice");
    putCorpCardOnTopOfRd(sentryRun, "simple_economy_operation");
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
        sourceDefinition(sentryRun, action) === "simple_sentry_ice",
    );
    sentryRun = enterEncounterFromMovementWindow(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = continueRunThroughMovement(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
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
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_282_annual-reviews");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");
    moveCorpCardToHq(state, "onr_v1_290_efficiency-experts");
    moveCorpCardToHq(state, "onr_v1_285_closed-accounts");
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");

    const beforeAccounts = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_281_accounts-receivable",
    );
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeReviewsHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_282_annual-reviews",
    );
    expect(state.corp.hq.length).toBe(beforeReviewsHq + 2);

    const beforeDayShiftHq = state.corp.hq.length;
    const beforeDayShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);
    expect(state.corp.credits).toBe(beforeDayShiftCredits + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_290_efficiency-experts",
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech",
    );
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_285_closed-accounts",
    );
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5],
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
      "onr_v1_244_filter",
      "onr_v1_245_fire-wall",
      "onr_v1_252_keeper",
      "onr_v1_256_mazer",
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
    const fireWallId = putCorpIceOnServer(state, "rd", "onr_v1_245_fire-wall");
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
          sourceDefinition(state, action) === "onr_v1_245_fire-wall",
      ),
    ).toBe(false);
  });
});
