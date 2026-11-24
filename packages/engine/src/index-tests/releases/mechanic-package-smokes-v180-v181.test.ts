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
import { quoteCorpIceInstallCost } from "../../game/payment/corp-rez-cost";
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

describe("V1.8.0 Mechanikpaket G", () => {
  it("adds a controlled V1.8.0 core card set for agenda difficulty, scored statics and overadvance points", () => {
    expect(ONR_V1_8_0_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_8_0_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /counter_system|virus|purge|deterministischer_wuerfel/,
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID[295],
    ).toMatchObject({
      cost: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID[302]).toMatchObject({
      cost: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID[368]).toMatchObject({
      installCost: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID[371]).toMatchObject({
      installCost: 0,
    });
    expect(
      CARD_DEFINITIONS_BY_ID[413],
    ).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
    expect(CARD_DEFINITIONS_BY_ID[426]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
  });

  it("validates V1.8.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v180CardReleaseGame("v180-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      CARD_DEFINITIONS_BY_ID[498],
    ).toBeDefined();
  });

  it("gates Desperate Competitor and Hot Tip for WNS by same-turn agenda subtype theft", () => {
    let grayState = toRunnerTurn(v180CardReleaseGame("v180-gray-ops-gate"));
    grayState.runner.credits = 30;
    const desperateCardId = moveRunnerCardToGrip(
      grayState,
      295,
    );
    const hotTipCardId = moveRunnerCardToGrip(
      grayState,
      302,
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(true);
    const hotTipNoBlackOps = apply(
      structuredClone(grayState),
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === hotTipCardId,
    );
    expect(hotTipNoBlackOps.runner.scoreArea).not.toContain(hotTipCardId);
    expect(hotTipNoBlackOps.runner.heap).toContain(hotTipCardId);
    putCorpCardOnTopOfRd(grayState, 415);
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "access_card",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(true);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(true);
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === desperateCardId,
    );
    expect(grayState.runner.scoreArea).toContain(desperateCardId);
    expect(grayState.cardInstances[desperateCardId]?.counters?.agenda).toBe(1);

    let blackState = toRunnerTurn(v180CardReleaseGame("v180-black-ops-gate"));
    blackState.runner.credits = 30;
    const hotTipBlackCardId = moveRunnerCardToGrip(
      blackState,
      302,
    );
    putCorpCardOnTopOfRd(blackState, 426);
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "access_card",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(blackState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipBlackCardId,
      ),
    ).toBe(true);
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === hotTipBlackCardId,
    );
    expect(blackState.runner.scoreArea).toContain(hotTipBlackCardId);
    expect(blackState.cardInstances[hotTipBlackCardId]?.counters?.agenda).toBe(
      1,
    );
  });

  it("enforces Corporate Ally install agenda-point spend and Databroker agenda-point-to-credit action", () => {
    let state = toRunnerTurn(
      v180CardReleaseGame("v180-corporate-ally-databroker"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      368,
    );
    const databrokerId = moveRunnerCardToGrip(state, 371);
    putCorpCardOnTopOfRd(state, 415);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const stolenAgendaId = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        415,
    );
    expect(stolenAgendaId).toBeDefined();

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    expect(state.runner.rig.resources).toContain(corporateAllyId);
    if (stolenAgendaId) {
      expect(state.runner.scoreArea).toContain(stolenAgendaId);
      expect(state.specialZones?.removedFromGame ?? []).not.toContain(
        stolenAgendaId,
      );
      expect(state.cardInstances[stolenAgendaId]?.agendaPointsSpent).toBe(1);
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === databrokerId,
    );
    putCorpCardOnTopOfRd(state, 415);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const databrokerSpendTarget = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        415,
    );
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.resourceAbility === "databroker" &&
        String(action.payload?.cardId) === databrokerId,
    );
    expect(state.runner.credits).toBe(creditsBefore + 10);
    expect(state.runner.heap).toContain(databrokerId);
    if (databrokerSpendTarget) {
      expect(state.runner.scoreArea).toContain(databrokerSpendTarget);
      expect(state.specialZones?.removedFromGame ?? []).not.toContain(
        databrokerSpendTarget,
      );
      expect(
        state.cardInstances[databrokerSpendTarget]?.agendaPointsSpent,
      ).toBe(1);
    }
  });

  it("applies Executive Extraction difficulty reduction for gray_ops only and keeps Corporate Ally difficulty increase active", () => {
    let state = toRunnerTurn(v180CardReleaseGame("v180-difficulty-statics"));
    state.runner.credits = 30;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      368,
    );
    putCorpCardOnTopOfRd(state, 415);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 588);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 588 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 588,
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === 588,
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === 588,
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === 588,
      ),
    ).toBe(true);

    moveCorpCardToHq(state, 413);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 413 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 413,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 413,
    );

    moveCorpCardToHq(state, 415);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 415 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 415,
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === 415,
      ),
    ).toBe(true);
  });

  it("awards deterministic Project Babylon bonus points on score with replay-safe statehash", () => {
    let state = v180CardReleaseGame("v180-project-babylon");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 426);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 426 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 7; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 426,
      );
    }

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 426,
    );

    const projectBabylonId = state.corp.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        426,
    );
    expect(projectBabylonId).toBeDefined();
    if (projectBabylonId) {
      expect(state.cardInstances[projectBabylonId]?.counters?.agenda).toBe(2);
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      agendaPoints: 1,
      agendaPointBonus: 2,
      totalAgendaPoints: 3,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.8.1 Mechanikpaket H", () => {
  it("adds a controlled V1.8.1 core card set for counter, purge and run-follow-up mechanics", () => {
    expect(ONR_V1_8_1_FINAL_CARD_IDS).toHaveLength(12);
    for (const definitionId of ONR_V1_8_1_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /deterministischer_wuerfel|ambush|v2/,
      );
    }
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain(225);
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain(246);
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain(242);
  });

  it("validates V1.8.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v181CardReleaseGame("v181-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID[426]).toBeDefined();
  });

  it("applies Clown encounter strength reduction to encountered ice strength", () => {
    let withoutClown = toRunnerTurn(v181CardReleaseGame("v181-clown-off"));
    withoutClown.runner.credits = 30;
    moveRunnerCardToGrip(withoutClown, 233);
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withoutClown, action) === 233,
    );
    putCorpIceOnServer(withoutClown, "rd", 589);
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withoutClown = apply(
      withoutClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withoutClown, action) === 589,
    );
    expect(
      getPlayerView(withoutClown, "runner").run?.encounteredIce?.strength,
    ).toBe(3);

    let withClown = toRunnerTurn(v181CardReleaseGame("v181-clown-on"));
    withClown.runner.credits = 30;
    moveRunnerCardToGrip(withClown, 224);
    moveRunnerCardToGrip(withClown, 233);
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === 224,
    );
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === 233,
    );
    putCorpIceOnServer(withClown, "rd", 589);
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withClown = apply(
      withClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withClown, action) === 589,
    );
    expect(
      getPlayerView(withClown, "runner").run?.encounteredIce?.strength,
    ).toBe(2);
  });

  it("stacks Clown with CardImplementation ICE-strength increases for break revalidation", () => {
    let state = toRunnerTurn(v181CardReleaseGame("p362-clown-stack"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, 224);
    moveRunnerCardToGrip(state, 233);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 224,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 233,
    );
    const dataMasonsId = addCorpCardToHqForTest(
      state,
      529,
      "clown_stack_data_masons",
    );
    let remote = state.corp.servers.find((server) => server.id === "r1");
    if (!remote) {
      remote = {
        id: "r1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      };
      state.corp.servers.push(remote);
    }
    removeEverywhere(state, dataMasonsId);
    remote.root.push(dataMasonsId);
    state.cardInstances[dataMasonsId] = {
      ...state.cardInstances[dataMasonsId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "r1" },
      rezzed: true,
    };
    const wallId = addCorpCardToHqForTest(
      state,
      444,
      "clown_stack_wall",
    );
    removeEverywhere(state, wallId);
    const rd = state.corp.servers.find((server) => server.id === "rd");
    if (!rd) throw new Error("Missing R&D");
    rd.ice.push(wallId);
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    };
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
        sourceDefinition(state, action) === 444,
    );
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(
      3,
    );
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 233,
    );
    const removedClown = structuredClone(state);
    const clownId = removedClown.runner.rig.programs.find(
      (cardId) =>
        removedClown.cardInstances[cardId]?.definitionId === 224,
    );
    if (!clownId) throw new Error("Missing Clown");
    removeEverywhere(removedClown, clownId);
    const stale = applyAction(removedClown, {
      matchId: removedClown.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: removedClown.stateVersion,
      idempotencyKey: "p362-clown-break-stale",
    });
    expect(stale.ok).toBe(false);
  });

  it("creates Pattel/Pox run-success counters and clears card/server virus counters with purge", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-pattel-pox-purge"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, 258);
    moveRunnerCardToGrip(state, 261);
    moveRunnerCardToGrip(state, 233);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 258,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 261,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 233,
    );
    const iceId = putCorpIceOnServer(state, "rd", 491);
    putCorpCardOnTopOfRd(state, 596);
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
        sourceDefinition(state, action) === 491,
    );
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 233,
    );
    expect(dwarfId).toBeDefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = continueRunThroughMovementWindow(state);
    const strengthBeforePattelCounter = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === iceId)?.strength;
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[iceId]?.counters?.pattel).toBe(1);
    expect(state.cardInstances[iceId]?.counters?.virus).toBeUndefined();
    expect(state.poxCountersByServer?.rd).toBe(1);
    const visibleIce = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === iceId);
    expect(visibleIce?.counterDisplays).toContainEqual({
      id: "pattel",
      amount: 1,
      displayKind: "virus",
      label: "Pattel-Counter",
      ariaLabel: "1 Pattel-Counter",
      counterType: "pattel",
      usageHint: "status_marker",
    });
    expect(visibleIce?.strength).toBe(
      Math.max(0, (strengthBeforePattelCounter ?? 0) - 1),
    );

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    expect(state.cardInstances[iceId]?.counters?.pattel ?? 0).toBe(0);
    expect(state.poxCountersByServer?.rd ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "virus",
    });
  });

  it("lets Pattel's Virus choose which fully broken ICE receives its counter", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-pattel-choice"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, 258);
    moveRunnerCardToGrip(state, 233);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 258,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 233,
    );
    const wallIds = Object.entries(state.cardInstances)
      .filter(([, card]) => card.definitionId === 491)
      .map(([id]) => id as CardInstanceId);
    expect(wallIds.length).toBeGreaterThanOrEqual(2);
    const innerIceId = wallIds[0]!;
    const outerIceId = wallIds[1]!;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    for (const iceId of [innerIceId, outerIceId]) {
      removeEverywhere(state, iceId);
      rdServer.ice.push(iceId);
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      };
    }
    for (const iceId of [innerIceId, outerIceId]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        rezzed: true,
        faceup: true,
      };
    }
    putCorpCardOnTopOfRd(state, 596);
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 233,
    );
    expect(dwarfId).toBeDefined();
    const runnerHasDwarfBreak = (): boolean =>
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === dwarfId,
      );
    const runnerHasAccess = (): boolean =>
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      );
    const continueUntilBreakOrAccess = (): void => {
      for (let index = 0; index < 8; index += 1) {
        if (runnerHasDwarfBreak() || runnerHasAccess()) return;
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
    };
    const pumpUntilDwarfCanBreak = (): void => {
      for (let index = 0; index < 8; index += 1) {
        if (runnerHasDwarfBreak()) return;
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === dwarfId,
        );
      }
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    continueUntilBreakOrAccess();
    pumpUntilDwarfCanBreak();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    continueUntilBreakOrAccess();
    pumpUntilDwarfCanBreak();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    continueUntilBreakOrAccess();
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.pendingChoice?.source).toContain("broken_ice.virus_counter");
    expect(state.pendingChoice?.options).toHaveLength(2);
    const innerIceOptionId = state.pendingChoice?.options.find(
      (option) => option.metadata?.targetCardInstanceId === innerIceId,
    )?.id;
    if (!innerIceOptionId) throw new Error("Missing inner ICE Pattel option");
    state = applyChoice(state, "runner", innerIceOptionId);

    expect(state.cardInstances[innerIceId]?.counters?.pattel).toBe(1);
    expect(state.cardInstances[innerIceId]?.counters?.virus).toBeUndefined();
    expect(state.cardInstances[outerIceId]?.counters?.pattel ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "broken_ice_virus_counter",
      brokenIceVirusCounterAdded: 1,
      targetCardDefinitionId: 491,
    });
  });

  it("preserves Inside Job past unrezzed ICE and bypasses the first encountered ICE", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-inside-job"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, 306);
    const innerIceId = putCorpIceOnServer(state, "rd", 590);
    const outerIceId = putCorpIceOnServer(state, "rd", 589);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 306 &&
        action.payload?.serverId === "rd",
    );
    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.approachedIceId).toBe(outerIceId);
    expect(state.run?.bypassFirstIceRemaining).toBe(true);
    expect(state.timingPoint).toBe("run.approach_ice");
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.run?.bypassFirstIceRemaining).toBe(true);
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.approachedIceId).toBe(innerIceId);
    expect(state.run?.bypassFirstIceRemaining).toBe(true);
    expect(state.timingPoint).toBe("run.approach_ice");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === innerIceId,
    );
    expect(state.run?.bypassFirstIceRemaining).toBe(false);
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      runStartBypassAutoPassedIce: true,
      runStartBypassPassedIceDefinitionId: 590,
      passedIcePosition: 1,
      serverLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      innerIceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps Restrictive action IDs server-distinct and applies Restrictive plus Pox install tax deterministically", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-restrictive-pox-tax"));
    state.runner.credits = 40;
    if (!state.corp.servers.some((server) => server.id === "r1")) {
      state.corp.servers.push({
        id: "r1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      });
    }
    const restrictiveCardId = moveRunnerCardToGrip(
      state,
      385,
    );
    const restrictiveInstallActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === restrictiveCardId,
    );
    expect(restrictiveInstallActions.length).toBeGreaterThan(1);
    expect(
      new Set(restrictiveInstallActions.map((action) => action.actionId)).size,
    ).toBe(restrictiveInstallActions.length);
    expect(
      restrictiveInstallActions.map((action) => [
        action.payload?.selectedServerId,
        action.label,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ["hq", "Restrictive Net Zoning auf HQ ausrichten"],
        ["rd", "Restrictive Net Zoning auf R&D ausrichten"],
        ["archives", "Restrictive Net Zoning auf Archives ausrichten"],
        ["r1", "Restrictive Net Zoning auf Remote 1 ausrichten"],
      ]),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          385 &&
        action.payload?.selectedServerId === "rd",
    );
    expect(state.cardInstances[restrictiveCardId]?.selectedServerId).toBe("rd");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === restrictiveCardId,
      ),
    ).toMatchObject({ selectedServerId: "rd", selectedServerLabel: "R&D" });
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.instanceId === restrictiveCardId,
      ),
    ).toMatchObject({ selectedServerId: "rd", selectedServerLabel: "R&D" });
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "rd",
      )?.statuses,
    ).toEqual([
      expect.objectContaining({
        kind: "cost_modifier",
        costKind: "corp_ice_install",
        operation: "increase",
        amount: 2,
        targetServerId: "rd",
        sourceCardInstanceId: restrictiveCardId,
        sourceTitle: "Restrictive Net Zoning",
        sourceSide: "runner",
      }),
    ]);
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "rd")
        ?.statuses,
    ).toEqual([
      expect.objectContaining({
        kind: "cost_modifier",
        costKind: "corp_ice_install",
        operation: "increase",
        amount: 2,
        targetServerId: "rd",
        sourceCardInstanceId: restrictiveCardId,
        sourceTitle: "Restrictive Net Zoning",
        sourceSide: "runner",
      }),
    ]);
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "hq",
      )?.statuses,
    ).toBeUndefined();
    state.cardInstances[restrictiveCardId]!.faceup = false;
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "rd")
        ?.statuses,
    ).toBeUndefined();
    state.cardInstances[restrictiveCardId]!.faceup = true;
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    installRunnerProgramForTest(state, 261);

    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.poxCountersByServer?.rd).toBe(2);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, 589);
    const rdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 589 &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(rdInstall.costs[0]?.credits).toBe(3);
    expect(rdInstall.payload?.iceInstallAdditionalCost).toBe(3);
    expect(rdInstall.payload?.iceInstallReduction).toBe(0);
    expect(rdInstall.payload?.iceInstallIncreaseSourceDefinitionIds).toBe(
      String(385),
    );
  });

  it("applies Restrictive Net Zoning as a +2 ICE install tax only on the chosen fort", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v181-restrictive-tax",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_8_1_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_8_1_CORP_DECK,
          id: "v181_restrictive_tax_corp",
          name: "V1.8.1 Restrictive Tax Corp",
          cards: [
            ...ONR_V1_8_1_CORP_DECK.cards,
            { id: 606, quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    const restrictiveCardId = moveRunnerCardToGrip(
      state,
      385,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === restrictiveCardId &&
        action.payload?.selectedServerId === "rd",
    );
    expect(state.cardInstances[restrictiveCardId]?.selectedServerId).toBe("rd");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 3;

    const sameFortIceId = moveCorpCardToHq(state, 589);
    const sameFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === sameFortIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(sameFortInstall.costs[0]).toMatchObject({ clicks: 1, credits: 2 });
    expect(sameFortInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 2,
      iceInstallReduction: 0,
      iceInstallIncreaseSourceDefinitionIds:
        String(385),
      iceInstallTotalCost: 2,
    });
    expect(
      sameFortInstall.payload?.iceInstallReductionSourceDefinitionIds,
    ).toBeUndefined();
    const quote = quoteCorpIceInstallCost(
      state,
      sameFortIceId,
      state.corp.servers.find((server) => server.id === "rd")!,
    );
    expect(quote.modifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: restrictiveCardId,
        sourceDefinitionId: 385,
        amount: 2,
        kind: "increase",
      }),
    ]);
    expect(quote.publicPayload.iceInstallReduction).toBe(0);
    expect(quote.finalCredits).toBe(sameFortInstall.costs[0]?.credits);

    const stale = structuredClone(state);
    stale.runner.rig.resources = stale.runner.rig.resources.filter(
      (cardId) => cardId !== restrictiveCardId,
    );
    stale.cardInstances[restrictiveCardId] = {
      ...stale.cardInstances[restrictiveCardId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const staleCredits = stale.corp.credits;
    const staleResult = applyAction(stale, {
      matchId: stale.matchId,
      side: "corp",
      actionId: sameFortInstall.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "v181-restrictive-tax-stale",
    });
    expect(staleResult.ok).toBe(false);
    expect(stale.corp.credits).toBe(staleCredits);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === sameFortInstall.actionId,
    );
    expect(state.corp.credits).toBe(18);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      iceInstallAdditionalCost: 2,
      iceInstallTotalCost: 2,
    });

    const otherFortIceId = moveCorpCardToHq(state, 590);
    const otherFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === otherFortIceId &&
        action.payload?.serverId === "hq" &&
        action.payload?.placement === "ice",
    );
    expect(otherFortInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 0,
      iceInstallTotalCost: 0,
    });
    expect(otherFortInstall.costs[0]).toEqual({ clicks: 1 });

    const upgradeId = moveCorpCardToHq(state, 606);
    const nonIceInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === upgradeId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "root",
    );
    expect(nonIceInstall.payload?.iceInstallAdditionalCost).toBeUndefined();
    expect(nonIceInstall.costs[0]).toEqual({ clicks: 1 });
  });

  it("scores Coup agendas with deterministic start counters and spends them via legal click actions", () => {
    let state = v181CardReleaseGame("v181-coup-actions");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 405);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 405 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 405,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 405,
    );
    const corporateCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 405,
    );
    expect(corporateCoupId).toBeDefined();
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.bit).toBe(15);

    moveCorpCardToHq(state, 421);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 421 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 421,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 421,
    );
    const politicalCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 421,
    );
    expect(politicalCoupId).toBeDefined();
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.bit).toBe(12);

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 405,
    );
    expect(state.corp.credits).toBe(creditsBefore + 3);
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.bit).toBe(12);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 421,
    );
    expect(state.corp.credits).toBe(creditsBefore + 6);
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.bit).toBe(9);
  });

  it("resolves Ball/Canis run flags and enforces Fatal/Shock next-encounter penalties deterministically", () => {
    let ballTaxState = toRunnerTurn(v181CardReleaseGame("v181-ball-tax"));
    ballTaxState.runner.credits = 20;
    putCorpIceOnServer(ballTaxState, "rd", 589);
    putCorpIceOnServer(ballTaxState, "rd", 434);
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === 434,
    );
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(ballTaxState.run?.encounterTaxForFutureIce).toBe(2);
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeBallTax = ballTaxState.runner.credits;
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === 589,
    );
    expect(ballTaxState.runner.credits).toBe(creditsBeforeBallTax - 2);

    let canisState = toRunnerTurn(v181CardReleaseGame("v181-canis-strength"));
    canisState.runner.credits = 20;
    moveRunnerCardToGrip(canisState, 226);
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(canisState, action) === 226,
    );
    putCorpIceOnServer(canisState, "rd", 590);
    putCorpIceOnServer(canisState, "rd", 438);
    putCorpIceOnServer(canisState, "rd", 437);
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === 437,
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(2);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === 438,
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(3);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeCanisThirdEncounter = canisState.runner.credits;
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === 590,
    );
    expect(canisState.runner.credits).toBe(creditsBeforeCanisThirdEncounter);
    const codecrackerId = canisState.runner.rig.programs.find(
      (id) =>
        canisState.cardInstances[id]?.definitionId === 226,
    );
    expect(
      getLegalActions(canisState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === codecrackerId,
      ),
    ).toBe(false);

    let fatalState = toRunnerTurn(v181CardReleaseGame("v181-fatal-shock"));
    fatalState.runner.credits = 20;
    putCorpIceOnServer(fatalState, "rd", 589);
    putCorpIceOnServer(fatalState, "rd", 454);
    fatalState = apply(
      fatalState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === 454,
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === 589,
    );
    const gripBeforeFatal = fatalState.runner.grip.length;
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(fatalState.runner.grip.length).toBe(gripBeforeFatal - 3);
    expect(fatalState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 3,
    });

    let shockState = toRunnerTurn(v181CardReleaseGame("v181-shock-lock"));
    shockState.runner.credits = 20;
    moveRunnerCardToGrip(shockState, 226);
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(shockState, action) === 226,
    );
    putCorpIceOnServer(shockState, "rd", 590);
    putCorpIceOnServer(shockState, "rd", 480);
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === 480,
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === 590,
    );
    const shockCodecrackerId = shockState.runner.rig.programs.find(
      (id) =>
        shockState.cardInstances[id]?.definitionId === 226,
    );
    const shockRunnerActions = getLegalActions(shockState, "runner");
    expect(shockState.run?.noBreakSubroutinesActive).toBe(true);
    expect(shockState.run?.jackOutLockedUntilEncounterEnds).toBe(true);
    expect(
      shockRunnerActions.some((action) => action.type === "jack_out"),
    ).toBe(false);
    expect(
      shockRunnerActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === shockCodecrackerId,
      ),
    ).toBe(false);
  });
});
