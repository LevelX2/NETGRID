import { serializedDefinitionReferences } from "../../test-fixtures/serialized-definition-references";
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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.2 Mechanikpaket K", () => {
  it("adds the V1.9.2 core card set with hidden-zone/access/run/recurring coverage", () => {
    expect(ONR_V1_9_2_FINAL_CARD_IDS).toHaveLength(7);
    for (const definitionId of ONR_V1_9_2_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(cardImplementationForDefinitionId(definitionId)).toBeDefined();
      expect(definition?.mechanics.join(" "), String(definitionId)).not.toMatch(
        /trace|tag|damage_prevention|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v192CardReleaseGame("v192-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID[225]).toBeDefined();
  });

  it("grants an All-Nighter bonus run via LegalActions without spending a click on the bonus run", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-all-nighter"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, 288);
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 288 &&
        action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const bonusActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(bonusActions.length).toBeGreaterThan(0);
    state.runner.clicks = 0;
    const clicksBefore = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(state.runner.clicks).toBe(clicksBefore);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.bonusRunNoClick === true,
      ),
    ).toBe(false);

    let hqState = toRunnerTurn(v192CardReleaseGame("v192-all-nighter-hq"));
    hqState.runner.credits = 30;
    moveRunnerCardToGrip(hqState, 288);
    const hqCard = moveCorpCardToHq(hqState, 596);
    keepOnlyCorpHqCard(hqState, hqCard);
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === 288 &&
        action.payload?.serverId === "hq",
    );
    hqState = apply(
      hqState,
      "runner",
      (action) => action.type === "access_card",
    );

    const hqBonusActions = getLegalActions(hqState, "runner").filter(
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(hqBonusActions.length).toBeGreaterThan(0);
  });

  it("allows Kilroy and Romp to trash accessed HQ/R&D cards at no cost", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-kilroy-romp"));
    state.runner.credits = 20;

    moveRunnerCardToGrip(state, 308);
    const kilroyAgendaId = putCorpCardOnTopOfRd(state, 588);
    const creditsBeforeKilroy = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 308,
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toEqual(expect.arrayContaining(["steal_agenda", "trash_accessed_card"]));
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.runner.credits).toBe(creditsBeforeKilroy);
    expect(state.corp.archives).toContain(kilroyAgendaId);
    expect(state.runner.scoreArea).not.toContain(kilroyAgendaId);

    moveRunnerCardToGrip(state, 319);
    const rompAgendaId = moveCorpCardToHq(state, 588);
    keepOnlyCorpHqCard(state, rompAgendaId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 319,
    );
    const creditsBeforeRompTrash = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toEqual(expect.arrayContaining(["steal_agenda", "trash_accessed_card"]));
    const freeTrashAction = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(freeTrashAction.costs).toEqual([]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === freeTrashAction.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeRompTrash);
    expect(state.corp.archives).toContain(rompAgendaId);
    expect(state.runner.scoreArea).not.toContain(rompAgendaId);
  });

  it("applies Top Runners' Conference credits at start of turn and trashes it when a run starts", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-top-runners"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, 396);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 396,
    );
    const creditsAfterInstall = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 2,
          reason: "start_of_turn",
          sourceDefinitionId: 396,
          sourceTitle: "Top Runners' Conference",
          visibility: "public",
        }),
      ]),
    );
    expect(state.runner.credits).toBe(creditsAfterInstall + 2);
    const conferenceId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        396,
    );
    expect(conferenceId).toBeDefined();
    if (!conferenceId) return;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.runner.rig.resources.includes(conferenceId)).toBe(false);
    expect(state.runner.heap).toContain(conferenceId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "trash_source",
        reason: "run_start",
        sourceDefinitionId: 396,
      }),
    );
  });

  it("handles Polymer start-of-turn credits, HQ/Archives-Shuffle-Draw hidden-zone shuffle action and Data Naga program trash", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-polymer-cfo-data-naga"));
    state.runner.credits = 20;
    state.corp.credits = 5;

    const polymerAgendaId = moveCorpCardToHq(
      state,
      423,
    );
    const cfoAgendaId = moveCorpCardToHq(
      state,
      400,
    );
    removeEverywhere(state, polymerAgendaId);
    removeEverywhere(state, cfoAgendaId);
    state.corp.scoreArea.push(polymerAgendaId, cfoAgendaId);
    state.cardInstances[polymerAgendaId] = {
      ...state.cardInstances[polymerAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[cfoAgendaId] = {
      ...state.cardInstances[cfoAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    const corpCreditsBeforeRunnerEndTurn = state.corp.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(corpCreditsBeforeRunnerEndTurn + 1);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: 423,
          sourceTitle: "Polymer Breakthrough",
          visibility: "public",
        }),
      ]),
    );
    const corpCreditsBeforeMandatory = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.credits).toBe(corpCreditsBeforeMandatory);

    moveCorpCardToHq(state, 596);
    moveCorpCardToArchives(state, 491, false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "hq_archives_shuffle_draw",
    );
    expect(state.corp.archives).toHaveLength(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "hq_archives_shuffle_into_rd",
    });

    state = toRunnerTurnFromCorpMain(state);
    moveRunnerCardToGrip(state, 233);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 233,
    );
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 233,
    );
    expect(dwarfId).toBeDefined();
    if (!dwarfId) return;
    putCorpIceOnServer(state, "rd", 447);
    state.corp.credits = 20;
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
        sourceDefinition(state, action) === 447,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", `card_${dwarfId}`);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.rig.programs.includes(dwarfId)).toBe(false);
    expect(state.runner.heap).toContain(dwarfId);
  });
});

describe("V1.9.3 Mechanikpaket L", () => {
  it("adds the V1.9.3 core card set with trace/tag and jack-out-lock coverage", () => {
    expect(ONR_V1_9_3_FINAL_CARD_IDS).toHaveLength(4);
    for (const definitionId of ONR_V1_9_3_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(cardImplementationForDefinitionId(definitionId)).toBeDefined();
      expect(definition?.mechanics.join(" "), String(definitionId)).not.toMatch(
        /damage_prevention|replacement|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.3 smoke decks and keeps V1.9.2 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v193CardReleaseGame("v193-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID[447]).toBeDefined();
  });

  it("starts V1.9.3 agenda trace actions and keeps Jack Attack jack-out lock active for the run", () => {
    let state = toRunnerTurn(v193CardReleaseGame("v193-trace-jack-lock"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const netwatchAgendaId = moveCorpCardToHq(
      state,
      419,
    );
    const privatePoliceAgendaId = moveCorpCardToHq(
      state,
      425,
    );
    removeEverywhere(state, netwatchAgendaId);
    removeEverywhere(state, privatePoliceAgendaId);
    state.corp.scoreArea.push(netwatchAgendaId, privatePoliceAgendaId);
    state.cardInstances[netwatchAgendaId] = {
      ...state.cardInstances[netwatchAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[privatePoliceAgendaId] = {
      ...state.cardInstances[privatePoliceAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;

    const netwatchAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          419,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: netwatchAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v193-netwatch-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: netwatchAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v193-netwatch-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    state = apply(
      state,
      "corp",
      (action) => action.actionId === netwatchAction.actionId,
    );
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      traceLimit: 2,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 419,
      traceStarted: true,
      traceLimit: 2,
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("amount");
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          425,
    );
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      traceLimit: 5,
    });
    state = applyChoice(state, "corp", "bid_5");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(2);

    putCorpCardOnTopOfRd(state, 596);
    putCorpIceOnServer(state, "rd", 463);
    state = toRunnerTurnFromCorpMain(state);
    state.runner.clicks = 3;
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
        sourceDefinition(state, action) === 463,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.jackOutLockedForRun).toBe(true);
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).not.toContain("jack_out");

    let tkoState = toRunnerTurn(v193CardReleaseGame("v193-tko-next-action"));
    tkoState.runner.credits = 20;
    tkoState.corp.credits = 20;
    putCorpIceOnServer(tkoState, "rd", 483);
    tkoState = apply(
      tkoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    tkoState = apply(
      tkoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tkoState, action) === 483,
    );
    const clicksBeforeTkoSubroutine = tkoState.runner.clicks;
    tkoState = apply(
      tkoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tkoState.run).toBeUndefined();
    expect(tkoState.runner.clicks).toBe(
      Math.max(0, clicksBeforeTkoSubroutine - 1),
    );
    expect(
      getPlayerView(tkoState, "corp")
        .publicEvents.at(-1)
        ?.publicPayload.resolvedEffects?.find(
          (effect) =>
            effect.subroutineType ===
            "end_the_run_and_runner_forgoes_next_action",
        ),
    ).toEqual(
      expect.objectContaining({
        sourceDefinitionId: 483,
        runnerForgoneActionOrdinal: 2,
      }),
    );
  });
});

describe("V1.9.4 Mechanikpaket M", () => {
  it("adds the V1.9.4 core card set with tagged meat-damage agenda actions", () => {
    expect(ONR_V1_9_4_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_4_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), String(definitionId)).toMatch(
        /runner_is_tagged/,
      );
      expect(definition?.mechanics.join(" "), String(definitionId)).toMatch(/damage/);
      expect(definition?.mechanics.join(" "), String(definitionId)).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.4 smoke decks and keeps V1.9.3 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_4_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_4_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v194CardReleaseGame("v194-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID[463]).toBeDefined();
  });

  it("resolves On-Call Solo Team and Strike Force Kali damage actions only while Runner is tagged", () => {
    let state = toRunnerTurn(v194CardReleaseGame("v194-tagged-damage"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const onCallAgendaId = moveCorpCardToHq(
      state,
      420,
    );
    const kaliAgendaId = moveCorpCardToHq(
      state,
      429,
    );
    removeEverywhere(state, onCallAgendaId);
    removeEverywhere(state, kaliAgendaId);
    state.corp.scoreArea.push(onCallAgendaId, kaliAgendaId);
    state.cardInstances[onCallAgendaId] = {
      ...state.cardInstances[onCallAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[kaliAgendaId] = {
      ...state.cardInstances[kaliAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.runner.tags = 1;

    const gripBeforeOnCall = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 420 &&
        action.payload?.cardId === onCallAgendaId,
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeOnCall);

    const gripBeforeKali = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 429 &&
        action.payload?.cardId === kaliAgendaId,
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeKali);

    state.runner.tags = 0;
    const actionTypes = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "activated_card_ability" &&
          (action.payload?.cardId === onCallAgendaId ||
            action.payload?.cardId === kaliAgendaId),
      )
      .map((action) => action.type);
    expect(actionTypes).toEqual([]);
  });
});

describe("V1.9.5 Mechanikpaket N", () => {
  it("adds the V1.9.5 core card set with agenda strength and asset credit mechanics", () => {
    expect(ONR_V1_9_5_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_5_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), String(definitionId)).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID[
        431
      ]?.mechanics.join(" "),
    ).toMatch(/ice_strength|strength_modifier/);
    expect(
      CARD_DEFINITIONS_BY_ID[
        431
      ]?.mechanics.join(" "),
    ).toMatch(/strength/);
    expect(
      cardImplementationForDefinitionId(520)
        ?.remainingReplacementLongtail?.kind,
    ).toBe("obligation_debt");
  });

  it("validates V1.9.5 smoke decks", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_5_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_5_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v195CardReleaseGame("v195-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
  });

  it("applies Superior Net Barriers wall strength and ACME credits deterministically", () => {
    let state = toRunnerTurn(v195CardReleaseGame("v195-static-and-asset"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const superiorId = moveCorpCardToHq(
      state,
      431,
    );
    removeEverywhere(state, superiorId);
    state.corp.scoreArea.push(superiorId);
    state.cardInstances[superiorId] = {
      ...state.cardInstances[superiorId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    const wallId = putCorpIceOnServer(state, "rd", 491);
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const rdWall = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === wallId);
    expect(rdWall?.strength).toBe(
      (CARD_DEFINITIONS_BY_ID[491]?.strength ?? 0) + 1,
    );

    const scoredAgendaId = scoreCorpAgendaForTest(
      state,
      415,
    );
    const acmeId = moveCorpCardToHq(state, 520);
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );
    state.corp.credits = 10;
    const beforeAcmeRez = structuredClone(state);
    const acmeRezReplayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 520,
    );
    expect(state.corp.credits).toBe(22);
    expect(state.corp.scoreArea).toContain(scoredAgendaId);
    expect(state.specialZones?.removedFromGame ?? []).not.toContain(
      scoredAgendaId,
    );
    expect(state.cardInstances[scoredAgendaId]?.agendaPointsSpent).toBe(1);
    expect(state.corp.archives).toContain(acmeId);
    expect(state.activeObligationDebtCount).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_card",
      cardDefinitionId: 520,
      agendaPointCost: 1,
      spentAgendaDefinitionIds: String(415),
      gainedCredits: 12,
      selfTrashed: true,
      obligationDebtCountAfter: 1,
    });
    const acmeRezReplay = replayEvents(
      beforeAcmeRez,
      state.eventLog.slice(acmeRezReplayStart),
    );
    expect(acmeRezReplay.ok).toBe(true);
    expect(acmeRezReplay.actualFinalStateHash).toBe(hashState(state));

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(21);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      abilityId: "end_of_turn_payment",
      obligationDebtPaymentPaid: 1,
      corpCreditsAfter: 21,
    });
  });

  it("spends exactly one agenda point from Tycho Extension when rezzing ACME", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v195-acme-tycho-spend",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_9_5_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_9_5_CORP_DECK,
          id: "onr_v1_9_5_corp_acme_tycho_spend",
          cards: [
            ...ONR_V1_9_5_CORP_DECK.cards,
            { id: 432, quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    const tychoId = scoreCorpAgendaForTest(state, 432);
    const acmeId = moveCorpCardToHq(state, 520);
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 10;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );
    state.corp.credits = 0;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 520,
    );

    expect(state.corp.scoreArea).toContain(tychoId);
    expect(state.specialZones?.removedFromGame ?? []).not.toContain(tychoId);
    expect(state.cardInstances[tychoId]?.agendaPointsSpent).toBe(1);
    expect(agendaPoints(state, "corp")).toBe(3);
    expect(state.corp.archives).toContain(acmeId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_card",
      cardDefinitionId: 520,
      agendaPointCost: 1,
      agendaPointCostPaid: 1,
      spentAgendaDefinitionIds: String(432),
      gainedCredits: 12,
    });
  });

  it("lets Superior Net Barriers reveal any number of walls and count rezzed walls", () => {
    let state = createGameAfterSetup({
      seed: "v195-superior-net-barriers-reveal-choice",
      runnerDeck: ONR_V1_9_5_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_5_CORP_DECK,
        cards: [
          ...ONR_V1_9_5_CORP_DECK.cards,
          { id: 444, quantity: 1 },
          { id: 449, quantity: 1 },
          { id: 71, quantity: 1 },
          { id: 98, quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 431);
    state.corp.servers.push({
      id: "r1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    const firstHiddenWallId = putCorpIceOnServer(
      state,
      "rd",
      491,
    );
    const secondHiddenWallId = putCorpIceOnServer(
      state,
      "hq",
      444,
    );
    const rezzedWallId = putCorpIceOnServer(
      state,
      "r1",
      449,
    );
    const codeGateId = putCorpIceOnServer(
      state,
      "r1",
      590,
    );
    const printedWallAsCodeGateId = putCorpIceOnServer(
      state,
      "r1",
      71,
    );
    const printedSentryAsWallId = putCorpIceOnServer(
      state,
      "r1",
      98,
    );
    state.cardInstances[rezzedWallId] = {
      ...state.cardInstances[rezzedWallId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[printedWallAsCodeGateId] = {
      ...state.cardInstances[printedWallAsCodeGateId]!,
      faceup: true,
      rezzed: true,
      variableIceState: {
        family: "alternate_subtype",
        additionalCostPaid: 1,
        value: 1,
        selectedSubtypes: ["code_gate"],
      },
    };
    state.cardInstances[printedSentryAsWallId] = {
      ...state.cardInstances[printedSentryAsWallId]!,
      faceup: true,
      rezzed: true,
      variableIceState: {
        family: "alternate_subtype",
        additionalCostPaid: 1,
        value: 1,
        selectedSubtypes: ["wall"],
      },
    };

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 431,
    );
    for (let index = 0; index < 6; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            431,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 431,
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 2,
    });
    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    expect(corpChoice?.options.map((option) => option.label)).toEqual([
      "Crystal Wall",
      "Wall of Static",
    ]);
    expect(corpChoice?.options.map((option) => option.publicLabel)).toEqual([
      "Installierte Wall",
      "Installierte Wall",
    ]);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    const rezzedWallView = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "r1")
      ?.ice.find((ice) => ice.instanceId === rezzedWallId);
    expect(rezzedWallView?.strength).toBe(
      (CARD_DEFINITIONS_BY_ID[449]?.strength ?? 0) + 1,
    );
    const remoteIce = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "r1",
    )?.ice;
    expect(
      remoteIce?.find((ice) => ice.instanceId === printedWallAsCodeGateId)
        ?.strength,
    ).toBe(CARD_DEFINITIONS_BY_ID[71]?.strength);
    expect(
      remoteIce?.find((ice) => ice.instanceId === printedSentryAsWallId)
        ?.strength,
    ).toBe(
      (CARD_DEFINITIONS_BY_ID[98]?.strength ?? 0) + 1,
    );

    const beforeChoiceCredits = state.corp.credits;
    const skipped = applyChoices(structuredClone(state), "corp", []);
    expect(skipped.corp.credits).toBe(beforeChoiceCredits + 2);
    expect(skipped.cardInstances[firstHiddenWallId]?.faceup).toBe(false);
    expect(skipped.cardInstances[secondHiddenWallId]?.faceup).toBe(false);
    expect(skipped.cardInstances[codeGateId]?.faceup).toBe(false);
    expect(skipped.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "scored_subtype_reveal_walls",
      revealedCount: 0,
      rezzedMatchingIceCount: 2,
      countedMatchingIceCount: 2,
      gainedCredits: 2,
    });

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoices(state, "corp", [
      `card_${firstHiddenWallId}`,
      `card_${secondHiddenWallId}`,
    ]);

    expect(state.cardInstances[firstHiddenWallId]?.faceup).toBe(true);
    expect(state.cardInstances[firstHiddenWallId]?.rezzed).toBe(false);
    expect(state.cardInstances[secondHiddenWallId]?.faceup).toBe(true);
    expect(state.cardInstances[secondHiddenWallId]?.rezzed).toBe(false);
    expect(state.cardInstances[codeGateId]?.faceup).toBe(false);
    expect(state.corp.credits).toBe(beforeChoiceCredits + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "scored_subtype_reveal_walls",
      abilityId: "scored_subtype_reveal",
      revealedCount: 2,
      rezzedMatchingIceCount: 2,
      countedMatchingIceCount: 4,
      gainedCredits: 4,
    });
    expect(
      String(state.eventLog.at(-1)?.publicPayload.publicRevealDefinitionIds),
    ).toContain(491);
    expect(serializedDefinitionReferences(JSON.stringify(state.eventLog.at(-1)?.publicPayload))).not.toContain(
      590,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("requires 1 agenda point to rez ACME Savings and Loan", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-rez-cost-no-agenda"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    moveCorpCardToHq(state, 520);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_card" &&
          sourceDefinition(state, action) ===
            520,
      ),
    ).toBe(false);
  });

  it("does not offer ACME root rez during a run when its agenda point cost cannot be paid", () => {
    let state = toRunnerTurn(
      v195CardReleaseGame("v195-acme-run-root-rez-no-agenda"),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const acmeId = putCorpRootInRemote(
      state,
      520,
    );
    const iceId = putCorpIceOnServer(
      state,
      "r1",
      491,
    );
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );

    expect(state).toMatchObject({
      activeSide: "runner",
      phase: "run",
      timingPoint: "run.encounter_ice",
    });
    const corpActions = getLegalActions(state, "corp");
    expect(
      corpActions.some(
        (action) =>
          action.type === "rez_card" && action.payload?.cardId === acmeId,
      ),
    ).toBe(false);
    expect(corpActions.some((action) => action.type === "decline_rez")).toBe(
      false,
    );
  });

  it("makes the Corp lose at end of turn when an ACME obligation cannot be paid", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-unpaid-loss"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, 415);
    moveCorpCardToHq(state, 520);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 520,
    );

    state.corp.credits = 0;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("obligation_debt_unpaid");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      abilityId: "end_of_turn_payment",
      obligationDebtPaymentFailed: true,
      gameEndReason: "obligation_debt_unpaid",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
  });

  it("lets the Corp pay 12 credits to remove an ACME obligation and score 1 agenda point", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-remove-obligation"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, 415);
    moveCorpCardToHq(state, 520);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 520,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.obligationDebtAbility === "remove_obligation",
    );

    expect(state.corp.credits).toBe(creditsBefore - 12);
    expect(state.activeObligationDebtCount).toBe(0);
    expect(state.corpBonusAgendaPoints).toBe(1);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      abilityId: "remove_obligation",
      obligationDebtPaymentPaid: 12,
      gainedAgendaPoints: 1,
      obligationDebtCountAfter: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("revalidates ACME removal actions for side, stale state and active obligation", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-removal-revalidation"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, 415);
    moveCorpCardToHq(state, 520);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 520,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 520,
    );
    const removeAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.obligationDebtAbility === "remove_obligation",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: removeAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v195-acme-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: removeAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v195-acme-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const noObligation = structuredClone(state);
    noObligation.activeObligationDebtCount = 0;
    const missingObligation = applyAction(noObligation, {
      matchId: noObligation.matchId,
      side: "corp",
      actionId: removeAction.actionId,
      clientKnownStateVersion: noObligation.stateVersion,
      idempotencyKey: "v195-acme-no-obligation",
    });
    expect(missingObligation.ok).toBe(false);
    if (!missingObligation.ok)
      expect(missingObligation.error.code).toBe("ERR_UNKNOWN_ACTION");
  });
});

describe("V1.9.6 Mechanikpaket O", () => {
  it("adds the V1.9.6 Data Raven core card and validates smoke decks", () => {
    expect(ONR_V1_9_6_FINAL_CARD_IDS).toHaveLength(1);
    const definition = CARD_DEFINITIONS_BY_ID[448];
    expect(definition?.implementationStatus).toBe("playable_mvp");
    expect(definition?.mechanics.join(" ")).toMatch(/trace/);
    expect(definition?.mechanics.join(" ")).toMatch(/counter/);
    expect(definition?.mechanics.join(" ")).not.toMatch(
      /v2|matchmaking|ranking/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_6_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_6_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("adds a Data Raven counter after a successful trace and applies the next Runner-start tag", () => {
    let state = toRunnerTurn(v196CardReleaseGame("v196-data-raven"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", 448);

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
        sourceDefinition(state, action) === 448,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpBid = state.pendingChoice?.options
      .filter((option) => /^bid_\d+$/.test(option.id))
      .sort(
        (left, right) => Number(right.id.slice(4)) - Number(left.id.slice(4)),
      )[0];
    expect(corpBid).toBeDefined();
    state = applyChoice(state, "corp", String(corpBid?.id));
    const runnerBid =
      state.pendingChoice?.options.find((option) => option.id === "bid_0") ??
      state.pendingChoice?.options[0];
    expect(runnerBid).toBeDefined();
    state = applyChoice(state, "runner", String(runnerBid?.id));

    expect(
      cardCounterAmount(state, state.runner.identity, "trace_tag_counter"),
    ).toBe(1);
    expect(state.runner.tags).toBe(1);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.tags).toBe(2);
    expect(
      cardCounterAmount(state, state.runner.identity, "trace_tag_counter"),
    ).toBe(1);
  });

  it("adds the Data Raven tag before its counter when tag prevention suspends", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v196-data-raven-tag-before-counter",
        runnerDeck: {
          ...ONR_V1_9_6_RUNNER_DECK,
          id: "v196_data_raven_tag_before_counter_runner",
          cards: [
            { id: 373, quantity: 1 },
            ...ONR_V1_9_6_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_6_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    installRunnerResourceForTest(state, 373);
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", 448);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpBid = state.pendingChoice?.options.at(-1);
    if (!corpBid) throw new Error("Data-Raven-Corp-Bid fehlt.");
    state = applyChoice(state, "corp", corpBid.id);
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(0);
    expect(
      cardCounterAmount(state, state.runner.identity, "trace_tag_counter"),
    ).toBe(0);
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "trace_add_counter",
      sourceDefinitionId: 448,
      counterType: "trace_tag_counter",
      counterAmount: 1,
    });
    state = applyChoice(state, "runner", "pass");
    expect(state.runner.tags).toBe(1);
    expect(
      cardCounterAmount(state, state.runner.identity, "trace_tag_counter"),
    ).toBe(1);
    expect(state.pendingAddTagContinuation).toBeUndefined();
  });

  it("suspends the Data Raven Runner-start tag and resumes once after avoid or pass", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v196-data-raven-start-tag-continuation",
        runnerDeck: {
          ...ONR_V1_9_6_RUNNER_DECK,
          id: "v196_data_raven_fall_guy_runner",
          cards: [
            { id: 373, quantity: 1 },
            ...ONR_V1_9_6_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_9_6_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    const fallGuyId = installRunnerResourceForTest(
      state,
      373,
    );
    setCardCounterForTest(state, state.runner.identity, "trace_tag_counter", 1);
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.activeSide).toBe("runner");
    expect(state.runner.tags).toBe(0);
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "runner_start_turn",
      sourceDefinitionId: 448,
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "pendingAddTagContinuation",
    );

    const resolve = getLegalActions(state, "runner").find(
      (action) => action.type === "resolve_choice",
    );
    if (!resolve || !state.pendingChoice)
      throw new Error("Missing Data Raven tag-avoid choice");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice.choiceId,
        selectedOptionIds: ["pass"],
      },
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice.choiceId,
        selectedOptionIds: ["pass"],
      },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const passState = applyChoice(structuredClone(state), "runner", "pass");
    expect(passState.runner.tags).toBe(1);
    expect(passState.runner.rig.resources).toContain(fallGuyId);
    expect(passState.pendingAddTagContinuation).toBeUndefined();

    const fallGuyOption = state.pendingChoice.options.find((option) =>
      option.id.includes(String(fallGuyId)),
    )?.id;
    const avoidState = applyChoice(state, "runner", String(fallGuyOption));
    expect(avoidState.runner.tags).toBe(0);
    expect(avoidState.runner.heap).toContain(fallGuyId);
    expect(avoidState.pendingAddTagContinuation).toBeUndefined();

    for (const branch of [passState, avoidState]) {
      const replay = replayEvents(initial, branch.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }
  });
});
