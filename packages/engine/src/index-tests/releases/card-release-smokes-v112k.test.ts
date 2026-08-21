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

describe("V1.1.2K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_1_2K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_1_2K_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity/,
      );
    }

    expect(CARD_DEFINITIONS_BY_ID["onr_v1_006_black-dahlia"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 5,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_014_codecracker"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_016_cyfermaster"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 5,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_040_loony-goon"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_060_shaka"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_073_wizards-book"]).toMatchObject({
      installCost: 5,
      memoryCost: 1,
      strength: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_253_laser-wire"]).toMatchObject({
      rezCost: 4,
      strength: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_257_nerve-labyrinth"]).toMatchObject({
      rezCost: 6,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_278_wall-of-ice"]).toMatchObject({
      rezCost: 13,
      strength: 6,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_293_netwatch-credit-voucher"],
    ).toMatchObject({ cost: 0 });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_295_night-shift"]).toMatchObject({
      cost: 0,
    });
  });

  it("validates V1.1.2K smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_1_2K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_1_2K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v112kCardReleaseGame("v112k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_220_tycho-extension"]).toBeDefined();
  });

  it("installs V1.1.2K breakers and uses the existing code-gate and sentry break rules", () => {
    let installState = toRunnerTurn(
      v112kCardReleaseGame("v112k-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_016_cyfermaster",
      "onr_v1_040_loony-goon",
      "onr_v1_060_shaka",
      "onr_v1_073_wizards-book",
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
    expect(installState.runner.memoryUsed).toBe(6);

    let codeGateState = toRunnerTurn(
      v112kCardReleaseGame("v112k-codecracker-quandary"),
    );
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "simple_economy_operation");
    codeGateState.corp.credits = 20;

    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    codeGateState = apply(
      codeGateState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(codeGateState, action) === "onr_v1_261_quandary",
    );
    codeGateState = enterEncounterFromMovementWindow(codeGateState);
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = continueRunThroughMovement(codeGateState);
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });

    let sentryState = toRunnerTurn(
      v112kCardReleaseGame("v112k-loony-goon-face"),
    );
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "simple_economy_operation");
    sentryState.corp.credits = 20;

    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryState = apply(
      sentryState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryState, action) === "onr_v1_259_in-the-face",
    );
    sentryState = enterEncounterFromMovementWindow(sentryState);
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = apply(
      sentryState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = continueRunThroughMovement(sentryState);
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
  });

  it("plays V1.1.2K Corp operations and resolves new ICE through visibility-safe replayable paths", () => {
    let operationState = createGameAfterSetup({
      seed: "v112k-corp-operations",
      runnerDeck: {
        ...ONR_V1_1_2K_RUNNER_DECK,
        id: "v112k_corp_operations_fall_guy_runner",
        cards: [
          { id: "onr_v1_161_fall-guy", quantity: 1 },
          ...ONR_V1_1_2K_RUNNER_DECK.cards,
        ],
      },
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    operationState.corp.credits = 20;
    operationState.corp.clicks = 8;
    operationState.runner.tags = 1;
    moveCorpCardToHq(operationState, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(operationState, "onr_v1_295_night-shift");
    const fallGuyId = installRunnerResourceForTest(
      operationState,
      "onr_v1_161_fall-guy",
    );

    const beforeVoucherTags = operationState.runner.tags;
    const beforeVoucherCredits = operationState.corp.credits;
    const beforeVoucher = structuredClone(operationState);
    const voucherReplayStart = operationState.eventLog.length;
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) ===
          "onr_v1_293_netwatch-credit-voucher",
    );
    expect(operationState.runner.tags).toBe(beforeVoucherTags);
    expect(operationState.corp.credits).toBe(beforeVoucherCredits);
    expect(operationState.pendingChoice?.source).toContain(
      "event_modification",
    );

    const voucherPassState = applyChoice(
      structuredClone(operationState),
      "runner",
      "pass",
    );
    expect(voucherPassState.runner.tags).toBe(beforeVoucherTags + 1);
    expect(voucherPassState.corp.credits).toBe(beforeVoucherCredits + 1);
    expect(voucherPassState.runner.rig.resources).toContain(fallGuyId);
    expect(voucherPassState.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 1,
      gainedCredits: 1,
      resolvedEffects: [
        expect.objectContaining({ kind: "add_tags", amount: 1 }),
        expect.objectContaining({ kind: "gain_credits", amount: 1 }),
      ],
    });

    const fallGuyOption = operationState.pendingChoice?.options.find((option) =>
      option.id.includes(String(fallGuyId)),
    )?.id;
    expect(fallGuyOption).toBeDefined();
    operationState = applyChoice(
      operationState,
      "runner",
      String(fallGuyOption),
    );
    expect(operationState.runner.tags).toBe(beforeVoucherTags);
    expect(operationState.corp.credits).toBe(beforeVoucherCredits + 1);
    expect(operationState.runner.heap).toContain(fallGuyId);
    expect(operationState.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 0,
      gainedCredits: 1,
      resolvedEffects: [
        expect.objectContaining({ kind: "add_tags", amount: 0 }),
        expect.objectContaining({ kind: "gain_credits", amount: 1 }),
      ],
    });
    for (const branch of [voucherPassState, operationState]) {
      const replay = replayEvents(
        beforeVoucher,
        branch.eventLog.slice(voucherReplayStart),
      );
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }

    const beforeNightShiftCards = operationState.corp.hq.length;
    const beforeNightShiftCredits = operationState.corp.credits;
    const nightShiftAction = getLegalActions(operationState, "corp").find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) === "onr_v1_295_night-shift",
    );
    expect(nightShiftAction?.payload).toMatchObject({
      gainCreditsAmount: 2,
      drawCardsAmount: 1,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) === "onr_v1_295_night-shift",
    );
    expect(operationState.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(operationState.corp.hq.length).toBe(beforeNightShiftCards);

    for (const definitionId of [
      "onr_v1_253_laser-wire",
      "onr_v1_257_nerve-labyrinth",
      "onr_v1_262_razor-wire",
      "onr_v1_263_reinforced-wall",
      "onr_v1_265_rock-is-strong",
      "onr_v1_266_scramble",
      "onr_v1_269_shotgun-wire",
      "onr_v1_270_sleeper",
      "onr_v1_278_wall-of-ice",
      "onr_v1_279_wall-of-static",
    ] as const) {
      let state = toRunnerTurn(
        v112kCardReleaseGame(`v112k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 30;

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

      const beforeContinue = structuredClone(state);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(
        replayEvents(
          beforeContinue,
          state.eventLog.slice(beforeContinue.eventLog.length),
        ).ok,
      ).toBe(true);
    }
  });
});
