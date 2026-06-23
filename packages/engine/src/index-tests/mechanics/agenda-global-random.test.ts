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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.19 Agenda/Overadvance WIP", () => {
  it("adds all V1.9.19 WIP runtime definitions without release-promoting the next slice", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.agendaScoring).toHaveLength(20);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.agendaScoring) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /scored_agenda|agenda_difficulty|overadvance|counter|generic_asset_node|generic_upgrade_root_server/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]?.implementationStatus).toBe(
      "playable_mvp",
    );
  });

  it("scores V1.9.19 overadvanced agendas with server-bound difficulty modifiers and replay-stable payloads", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-overadvance-score"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_189_artificial-security-directors",
    );
    const rovingId = findCard(state, "onr_v1_368_roving-submarine");
    const server = state.corp.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    expect(server).toBeDefined();
    if (!server) throw new Error("Missing remote");
    removeEverywhere(state, rovingId);
    server.root.push(rovingId);
    state.cardInstances[rovingId] = {
      ...state.cardInstances[rovingId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      faceup: true,
      rezzed: true,
    };

    const initial = structuredClone(state);
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === agendaId,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        String(action.payload?.cardId) === agendaId,
    );

    expect(state.corp.scoreArea).toContain(agendaId);
    expect(cardCounterAmount(state, agendaId, "agenda")).toBe(1);
    const scoreEvent = state.eventLog.at(-1);
    expect(scoreEvent?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      v1919AgendaDifficulty: 2,
      v1919Overadvance: 3,
      v1919BonusAgendaPoints: 1,
      totalAgendaPoints: 2,
    });
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses V1.9.19 scored agenda reveal actions without leaking hidden R&D to the Runner before reveal", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-scored-reveal"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === agendaId,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        String(action.payload?.cardId) === agendaId,
    );
    putCorpCardOnTopOfRd(state, "simple_agenda");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1919_scored_agenda_reveal_rd_top",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      agendaAbility: "v1919_scored_agenda_reveal_rd_top",
      revealKind: "reveal",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
    });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
  });

  it("uses V1.9.19 asset counter, economy and access-ambush paths through explicit actions", () => {
    let corpState = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-asset-actions"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    corpState.corp.credits = 80;
    corpState.corp.clicks = 30;
    const chicagoId = putCorpRootInRemote(
      corpState,
      "onr_v1_312_chicago-branch",
    );
    const informationId = putCorpRootInRemote(
      corpState,
      "onr_v1_328_information-laundering",
    );
    corpState.cardInstances[chicagoId] = {
      ...corpState.cardInstances[chicagoId]!,
      faceup: true,
      rezzed: true,
    };
    corpState.cardInstances[informationId] = {
      ...corpState.cardInstances[informationId]!,
      faceup: true,
      rezzed: true,
      advancementCounters: 2,
    };
    const targetAgendaId = putCorpRootInRemote(corpState, "simple_agenda");

    corpState = apply(
      corpState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === chicagoId,
    );
    const chicagoPlacement = corpState.pendingChoice?.options.find(
      (option) => String(option.value) === `${targetAgendaId}:2`,
    );
    expect(chicagoPlacement).toBeDefined();
    corpState = applyChoices(corpState, "corp", [chicagoPlacement?.id ?? ""]);
    expect(corpState.cardInstances[targetAgendaId]?.advancementCounters).toBe(
      2,
    );
    const beforeCredits = corpState.corp.credits;
    corpState = apply(
      corpState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        String(action.payload?.cardId) === informationId,
    );
    expect(corpState.corp.credits).toBe(beforeCredits + 8);
    expect(corpState.corp.archives).toContain(informationId);
    expect(corpState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_328_information-laundering",
      advancementCounterCount: 2,
      gainedCredits: 8,
      sourceTrashed: true,
    });

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-bug-out-bag-access-ambush"),
    );
    accessState.runner.credits = 20;
    const programId = installRunnerProgramForTest(
      accessState,
      "simple_decoder",
    );
    const experimentalAiId = putCorpRootInRemote(
      accessState,
      "onr_v1_323_experimental-ai",
    );
    accessState.cardInstances[experimentalAiId] = {
      ...accessState.cardInstances[experimentalAiId]!,
      advancementCounters: 1,
    };
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = passRootRezWindowBeforeAccessIfOpen(accessState);
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.runner.heap).toContain(programId);
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      trashedCardDefinitionId: "simple_decoder",
    });
    expect(accessState.eventLog.at(-1)?.visibilityClass).toBe(
      "hidden_info_barrier",
    );
    expect(accessState.run?.accessedCardId).toBe(experimentalAiId);
  });

  it("uses V1.9.19 operation advance, counter and forfeit-cost paths through play-operation actions", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-operation-paths"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    const agendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    moveCorpCardToHq(state, "onr_v1_300_project-consultants");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_300_project-consultants",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_34.distribute_advancement",
    );
    const projectOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${agendaId}:4`,
    );
    expect(projectOption).toBeDefined();
    state = applyChoices(state, "corp", [projectOption?.id ?? ""]);
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_300_project-consultants",
      addedAdvancementCounters: 4,
    });

    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      advancementCounters: 4,
    };
    const secondAgendaId = putCorpRootInRemote(state, "simple_agenda");
    moveCorpCardToHq(state, "onr_v1_291_falsified-transactions-expert");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_291_falsified-transactions-expert",
    );
    const falsifiedOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${agendaId}|${secondAgendaId}|3`,
    );
    expect(falsifiedOption).toBeDefined();
    state = applyChoices(state, "corp", [falsifiedOption?.id ?? ""]);
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(1);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(3);

    moveCorpCardToHq(state, "onr_v1_304_systematic-layoffs");
    const creditsBeforeLayoffs = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_304_systematic-layoffs",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_34.distribute_advancement",
    );
    const singleTargetOption = state.pendingChoice?.options.find(
      (option) => option.value === `${agendaId}:2`,
    );
    expect(singleTargetOption).toBeDefined();
    state = applyChoices(state, "corp", [singleTargetOption?.id ?? ""]);
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(3);
    expect(state.corp.credits).toBe(creditsBeforeLayoffs - 5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_304_systematic-layoffs",
      targetCardId: agendaId,
      targetCardDefinitionId: "onr_v1_202_genetics-visionary-acquisition",
      targetCardDefinitionIds: "onr_v1_202_genetics-visionary-acquisition",
      addedAdvancementCounters: 2,
      targetCount: 1,
      advancementCountersAfter: 3,
    });

    moveCorpCardToHq(state, "onr_v1_292_management-shake-up");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_292_management-shake-up",
    );
    const managementOption = state.pendingChoice?.options.find(
      (option) => option.value === `${secondAgendaId}:3`,
    );
    expect(managementOption).toBeDefined();
    state = applyChoices(state, "corp", [managementOption?.id ?? ""]);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_292_management-shake-up",
      addedAdvancementCounters: 3,
      targetCardDefinitionId: "simple_agenda",
    });
  });

  it("offers Systematic Layoffs advancement placements for installed advanceable cards", () => {
    let state = MECHANIC_SMOKE_GAMES.agendaScoring(
      "v1919-systematic-layoffs-choice",
    );
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 5;
    const firstAgendaId = putCorpRootInRemote(state, "simple_agenda");
    const secondAgendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    moveCorpCardToHq(state, "onr_v1_304_systematic-layoffs");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const layoffActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_304_systematic-layoffs",
    );

    expect(layoffActions).toHaveLength(1);
    expect(layoffActions[0]?.payload?.targetCardId).toBeUndefined();
    expect(layoffActions[0]?.payload?.secondTargetCardId).toBeUndefined();
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_304_systematic-layoffs",
    );
    const placementOptions = state.pendingChoice?.options ?? [];
    expect(placementOptions).toHaveLength(3);
    expect(
      placementOptions.some((option) => option.value === `${firstAgendaId}:2`),
    ).toBe(true);
    expect(
      placementOptions.some((option) => {
        const selectedIds = new Set(
          String(option.value)
            .split("|")
            .map((entry) => entry.split(":")[0]),
        );
        return (
          selectedIds.has(firstAgendaId) && selectedIds.has(secondAgendaId)
        );
      }),
    ).toBe(true);
    expect(
      placementOptions.some((option) => option.value === `${secondAgendaId}:2`),
    ).toBe(true);

    const splitOption = placementOptions.find((option) => {
      const selectedIds = new Set(
        String(option.value)
          .split("|")
          .map((entry) => entry.split(":")[0]),
      );
      return selectedIds.has(firstAgendaId) && selectedIds.has(secondAgendaId);
    });
    state = applyChoices(state, "corp", [splitOption?.id ?? ""]);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[firstAgendaId]?.advancementCounters).toBe(1);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_304_systematic-layoffs",
      addedAdvancementCounters: 2,
      targetCount: 2,
    });
    expect(
      String(state.eventLog.at(-1)?.publicPayload.targetCardDefinitionIds)
        .split(",")
        .sort(),
    ).toEqual(["onr_v1_202_genetics-visionary-acquisition", "simple_agenda"]);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("opens one Systematic Layoffs placement option for a single Corporate War", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.agendaScoring.corp,
      id: "onr_v1_corp_systematic_layoffs_corporate_war",
      name: "O:NR V1.9.19 Systematic Layoffs Corporate War",
      cards: [
        { id: "onr_v1_196_corporate-war", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.agendaScoring.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1919-systematic-layoffs-corporate-war",
      runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 5;
    const corporateWarId = putCorpRootInRemote(
      state,
      "onr_v1_196_corporate-war",
    );
    moveCorpCardToHq(state, "onr_v1_304_systematic-layoffs");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_304_systematic-layoffs",
    );

    expect(state.pendingChoice?.options).toHaveLength(1);
    expect(state.pendingChoice?.options[0]).toMatchObject({
      value: `${corporateWarId}:2`,
    });
    state = applyChoices(state, "corp", [
      state.pendingChoice?.options[0]?.id ?? "",
    ]);

    expect(state.cardInstances[corporateWarId]?.advancementCounters).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_304_systematic-layoffs",
      addedAdvancementCounters: 2,
      targetCount: 1,
      targetCardDefinitionId: "onr_v1_196_corporate-war",
      targetCardDefinitionIds: "onr_v1_196_corporate-war",
    });
  });

  it("resolves remaining V1.9.19 access ambush damage and installed-hardware paths", () => {
    let hardwareState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-corprunner-ambush"),
    );
    hardwareState.runner.credits = 20;
    const hardwareId = installRunnerHardwareForTest(
      hardwareState,
      "simple_setup_hardware",
    );
    putCorpRootInRemote(
      hardwareState,
      "onr_v1_315_corprunners-shattered-remains",
    );
    const shatteredId = hardwareState.corp.servers
      .flatMap((server) => server.root)
      .find(
        (id) =>
          hardwareState.cardInstances[id]?.definitionId ===
          "onr_v1_315_corprunners-shattered-remains",
      );
    expect(shatteredId).toBeDefined();
    if (shatteredId)
      hardwareState.cardInstances[shatteredId] = {
        ...hardwareState.cardInstances[shatteredId]!,
        advancementCounters: 1,
      };
    hardwareState = apply(
      hardwareState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    hardwareState = passRootRezWindowBeforeAccessIfOpen(hardwareState);
    hardwareState = apply(
      hardwareState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(hardwareState.runner.heap).toContain(hardwareId);
    expect(hardwareState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_315_corprunners-shattered-remains",
    });

    let coreDamageState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-vacant-soulkiller"),
    );
    coreDamageState.runner.credits = 20;
    const coreBefore = coreDamageState.runner.coreDamage;
    const vacantSoulkillerId = putCorpRootInRemote(
      coreDamageState,
      "onr_v1_346_vacant-soulkiller",
    );
    coreDamageState.cardInstances[vacantSoulkillerId] = {
      ...coreDamageState.cardInstances[vacantSoulkillerId]!,
      advancementCounters: 1,
    };
    coreDamageState = apply(
      coreDamageState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    coreDamageState = passRootRezWindowBeforeAccessIfOpen(coreDamageState);
    coreDamageState = apply(
      coreDamageState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(coreDamageState.runner.coreDamage).toBe(coreBefore + 1);
    expect(coreDamageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: "onr_v1_346_vacant-soulkiller",
      damageType: "core",
      damageAmount: 1,
    });

    let netDamageState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-virus-test-site"),
    );
    netDamageState.runner.credits = 20;
    const gripBefore = netDamageState.runner.grip.length;
    putCorpRootInRemote(netDamageState, "onr_v1_348_virus-test-site");
    netDamageState = apply(
      netDamageState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    netDamageState = passRootRezWindowBeforeAccessIfOpen(netDamageState);
    netDamageState = apply(
      netDamageState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(netDamageState.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
    expect(netDamageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: "onr_v1_348_virus-test-site",
      damageType: "net",
      damageAmount: 1,
    });
  });

  it("uses V1.9.19 Runner agenda-cost paths for Fait Accompli and Arasaka Owns You", () => {
    let faitState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-fait-accompli"),
    );
    faitState.runner.credits = 20;
    const faitId = installRunnerProgramForTest(
      faitState,
      "onr_v1_025_fait-accompli",
    );
    scoreRunnerAgendaForTest(faitState, "simple_agenda");
    faitState = apply(
      faitState,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1919RunnerProgramAbility === "add_power_counter",
    );
    expect(cardCounterAmount(faitState, faitId, "power")).toBe(1);
    expect(faitState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1919RunnerProgramAbility: "add_power_counter",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });

    let arasakaState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-arasaka-owns-you"),
    );
    arasakaState.runner.credits = 20;
    arasakaState.corp.credits = 20;
    arasakaState.runner.tags = 2;
    arasakaState.runner.coreDamage = 1;
    const arasakaId = moveRunnerCardToGrip(
      arasakaState,
      "onr_v1_078_arasaka-owns-you",
    );
    for (const cardId of arasakaState.runner.grip.slice()) {
      if (cardId === arasakaId) continue;
      removeEverywhere(arasakaState, cardId);
      arasakaState.runner.stack.push(cardId);
      arasakaState.cardInstances[cardId] = {
        ...arasakaState.cardInstances[cardId]!,
        zone: { side: "runner", zone: "stack" },
      };
    }
    moveCorpCardToHq(arasakaState, "onr_v1_302_scorched-earth");
    arasakaState = apply(
      arasakaState,
      "runner",
      (action) => action.type === "end_turn",
    );
    arasakaState = apply(
      arasakaState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    arasakaState = apply(
      arasakaState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(arasakaState, action) === "onr_v1_302_scorched-earth",
    );
    expect(arasakaState.pendingChoice?.source).toContain("replacement");
    const arasakaOption = arasakaState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    arasakaState = applyChoice(arasakaState, "runner", String(arasakaOption));
    expect(arasakaState.winner).toBeNull();
    expect(arasakaState.runner.tags).toBe(0);
    expect(arasakaState.runner.coreDamage).toBe(0);
    expect(arasakaState.runner.credits).toBe(30);
    expect(arasakaState.runnerAgendaPointsToForfeit).toBe(3);
    expect(arasakaState.runnerTurnFlags?.forgoNextActionsPending).toBe(4);
    expect(arasakaState.runner.heap).toContain(arasakaId);
    expect(arasakaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      replacementDecision: "apply",
      v1919RunnerEventAbility: "arasaka_owns_you_flatline_replacement",
      preventedAmount: 4,
      removedTags: 2,
      coreDamageRemoved: 1,
      futureAgendaPointForfeitPending: 3,
    });
  });

  it("offers Olivia Salazar half-cost ICE rez actions and derezzes that ICE at run end", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1919-olivia-rez-cost",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.corp,
          id: "onr_v1_corp_v1919_olivia_rez_cost",
          cards: [
            ...MECHANIC_SMOKE_DECKS.agendaScoring.corp.cards,
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 2;
    state.corp.maxHandSize = 100;
    const oliviaId = putCorpRootInRemote(state, "onr_v1_363_olivia-salazar");
    state.cardInstances[oliviaId] = {
      ...state.cardInstances[oliviaId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const actions = getLegalActions(state, "corp").filter(
      (action) => action.type === "rez_ice",
    );
    expect(actions).toHaveLength(1);
    const oliviaRez = actions[0]!;
    expect(oliviaRez.label).toContain("Olivia Salazar");
    expect(oliviaRez.label).toContain("2 Credits");
    expect(oliviaRez.costs[0]?.credits).toBe(2);
    expect(oliviaRez.payload).toMatchObject({
      cardId: iceId,
      oliviaSalazarRezSourceCardId: oliviaId,
      oliviaSalazarRezSourceDefinitionId: "onr_v1_363_olivia-salazar",
      oliviaSalazarRezCostBase: 4,
      oliviaSalazarTemporaryDerez: true,
      rezCostPaid: 2,
      rezCostReductionAmount: 2,
    });

    const manipulatedSourceResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: oliviaRez.actionId.replace(oliviaId, "fake_olivia_source"),
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "olivia-manipulated-source",
    });
    expect(manipulatedSourceResult.ok).toBe(false);

    const alreadyUsedThisRun = structuredClone(state);
    alreadyUsedThisRun.run = {
      ...alreadyUsedThisRun.run!,
      oliviaSalazarUsedSourceIdsThisRun: [oliviaId],
    };
    expect(
      getLegalActions(alreadyUsedThisRun, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.oliviaSalazarRezSourceCardId === oliviaId,
      ),
    ).toBe(false);

    const sourceDrift = structuredClone(state);
    sourceDrift.cardInstances[oliviaId] = {
      ...sourceDrift.cardInstances[oliviaId]!,
      rezzed: false,
    };
    const driftResult = applyAction(sourceDrift, {
      matchId: sourceDrift.matchId,
      side: "corp",
      actionId: oliviaRez.actionId,
      clientKnownStateVersion: sourceDrift.stateVersion,
      idempotencyKey: "olivia-source-drift",
    });
    expect(driftResult.ok).toBe(false);
    const staleCredits = structuredClone(state);
    staleCredits.corp.credits = 1;
    const staleCreditResult = applyAction(staleCredits, {
      matchId: staleCredits.matchId,
      side: "corp",
      actionId: oliviaRez.actionId,
      clientKnownStateVersion: staleCredits.stateVersion,
      idempotencyKey: "olivia-stale-cost",
    });
    expect(staleCreditResult.ok).toBe(false);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === oliviaRez.actionId,
    );
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.run?.oliviaSalazarUsedSourceIdsThisRun).toEqual([oliviaId]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      cardDefinitionId: "onr_v1_232_crystal-wall",
      oliviaSalazarRezSourceDefinitionId: "onr_v1_363_olivia-salazar",
      oliviaSalazarRezCostBase: 4,
      oliviaSalazarTemporaryDerez: true,
      rezCostPaid: 2,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.cardInstances[iceId]?.rezzed).toBe(false);
    expect(state.cardInstances[iceId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      oliviaSalazarRunEndDerez: true,
      derezzedCount: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("shows Black Ice Quality Assurance strength bonus on Olivia-rezzed Cinderella", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1919-olivia-black-ice-quality-cinderella-badge",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.corp,
          id: "onr_v1_corp_v1919_olivia_black_ice_quality_cinderella",
          cards: [
            ...MECHANIC_SMOKE_DECKS.agendaScoring.corp.cards,
            { id: "onr_v1_191_black-ice-quality-assurance", quantity: 1 },
            { id: "onr_v1_228_cinderella", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 4;
    state.corp.maxHandSize = 100;
    scoreCorpAgendaForTest(state, "onr_v1_191_black-ice-quality-assurance");
    const oliviaId = putCorpRootInRemote(state, "onr_v1_363_olivia-salazar");
    state.cardInstances[oliviaId] = {
      ...state.cardInstances[oliviaId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_228_cinderella",
    );

    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const oliviaRez = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === iceId &&
        action.payload?.oliviaSalazarRezSourceCardId === oliviaId,
    );

    state = apply(
      state,
      "corp",
      (action) => action.actionId === oliviaRez.actionId,
    );
    const visibleIce = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "remote_1")
      ?.ice.find((ice) => ice.instanceId === iceId);
    expect(visibleIce?.strength).toBe(8);
    expect(visibleIce?.strengthModifier).toBe(2);
  });

  it("keeps Olivia Salazar normal ICE rez actions when regular rez cost is payable", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1919-olivia-normal-rez-still-payable",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.corp,
          id: "onr_v1_corp_v1919_olivia_normal_rez",
          cards: [
            ...MECHANIC_SMOKE_DECKS.agendaScoring.corp.cards,
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.maxHandSize = 100;
    const oliviaId = putCorpRootInRemote(state, "onr_v1_363_olivia-salazar");
    state.cardInstances[oliviaId] = {
      ...state.cardInstances[oliviaId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );

    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const actions = getLegalActions(state, "corp").filter(
      (action) => action.type === "rez_ice" && action.payload?.cardId === iceId,
    );
    const normalRez = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === iceId &&
        !action.payload?.oliviaSalazarRezSourceCardId,
    );
    const oliviaRez = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === iceId &&
        action.payload?.oliviaSalazarRezSourceCardId === oliviaId,
    );
    expect(actions).toHaveLength(2);
    expect(normalRez.costs[0]?.credits).toBe(4);
    expect(normalRez.payload?.rezCostPaid).toBeUndefined();
    expect(oliviaRez.costs[0]?.credits).toBe(2);
    expect(oliviaRez.payload).toMatchObject({
      oliviaSalazarRezSourceCardId: oliviaId,
      oliviaSalazarRezCostBase: 4,
      rezCostPaid: 2,
    });
  });

  it("quotes Olivia Salazar ICE rez costs without mutating state", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1919-olivia-quote-no-mutation",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.corp,
          id: "onr_v1_corp_v1919_olivia_quote_no_mutation",
          cards: [
            ...MECHANIC_SMOKE_DECKS.agendaScoring.corp.cards,
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.maxHandSize = 100;
    const oliviaId = putCorpRootInRemote(state, "onr_v1_363_olivia-salazar");
    state.cardInstances[oliviaId] = {
      ...state.cardInstances[oliviaId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );
    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    const beforeHash = hashState(state);
    const beforeState = structuredClone(state);
    const normalQuote = quoteCorpRezCost(state, iceId);
    const oliviaQuote = quoteCorpRezCost(state, iceId, {
      discountedRezSourceCardId: oliviaId,
    });

    expect(hashState(state)).toBe(beforeHash);
    expect(state).toEqual(beforeState);
    expect(normalQuote.finalCredits).toBe(4);
    expect(normalQuote.costs).toEqual([{ credits: 4 }]);
    expect(normalQuote.publicPayload).toEqual({ cardId: iceId });
    expect(oliviaQuote.finalCredits).toBe(2);
    expect(oliviaQuote.costs).toEqual([{ credits: 2 }]);
    expect(oliviaQuote.publicPayload).toMatchObject({
      cardId: iceId,
      oliviaSalazarRezSourceCardId: oliviaId,
      oliviaSalazarRezSourceDefinitionId: "onr_v1_363_olivia-salazar",
      oliviaSalazarRezCostBase: 4,
      oliviaSalazarTemporaryDerez: true,
      rezCostPaid: 2,
      rezCostReductionAmount: 2,
    });
  });

  it("binds Fait Accompli counters to the successful remote fort and raises only that agenda difficulty", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v1919-fait-remote-counter"),
    );
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_025_fait-accompli");
    putCorpRootInRemote(state, "onr_v1_363_olivia-salazar");
    const remoteOne = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remoteOne) throw new Error("remote_1 missing");

    const makeSuccessfulRemoteRun = (input: GameState): GameState => {
      let next = apply(
        input,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      next = passRootRezWindowBeforeAccessIfOpen(next);
      next = apply(next, "runner", (action) => action.type === "access_card");
      if (
        getLegalActions(next, "runner").some(
          (action) => action.type === "decline_trash",
        )
      )
        next = apply(
          next,
          "runner",
          (action) => action.type === "decline_trash",
        );
      return next;
    };

    state = makeSuccessfulRemoteRun(state);
    state = makeSuccessfulRemoteRun(state);
    expect(state.faitAccompliCountersByServer?.remote_1).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "decline_trash",
    });

    const agendaId = findCard(state, "simple_agenda");
    removeEverywhere(state, agendaId);
    remoteOne.root.push(agendaId);
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      advancementCounters: 3,
      faceup: false,
      rezzed: false,
    };
    if (state.run) {
      delete state.run;
    }

    expect(state.cardInstances[agendaId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverRoot",
      serverId: "remote_1",
    });
  });
});

describe("V1.9.20 Global Modifier/Special-State WIP", () => {
  it("adds all V1.9.20 WIP runtime definitions without release-promoting V1.9.21", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.globalModifiers).toHaveLength(26);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.globalModifiers) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /persistent_special_state|action_economy|modify_hand_limit|modify_memory_limit|global_static_modifier|meat_damage|tag_condition/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]?.implementationStatus).toBe(
      "playable_mvp",
    );
  });

  it("scores Encryption Breakthrough with code-gate reveal credits and a scored code-gate strength modifier", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-encryption-breakthrough-code-gates",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1920_encryption_breakthrough_code_gate",
          cards: [
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
            { id: "onr_v1_230_cortical-scanner", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 30;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 99;
    moveCorpCardToHq(state, "onr_v1_200_encryption-breakthrough");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_200_encryption-breakthrough",
    );
    const codeGateId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_200_encryption-breakthrough",
      );
    }
    const creditsBeforeScore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) ===
          "onr_v1_200_encryption-breakthrough",
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 1,
    });
    state = applyChoices(state, "corp", [`card_${codeGateId}`]);
    expect(state.corp.credits).toBe(creditsBeforeScore + 1);
    expect(state.cardInstances[codeGateId]?.faceup).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      agendaAbility: "encryption_breakthrough",
      hiddenZoneAction: "encryption_breakthrough_reveal_code_gates",
      revealedCount: 1,
      gainedCredits: 1,
    });
  });

  it("uses I Got a Rock only against a double-tagged Runner with agenda-point costs", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-i-got-a-rock-tagged-finisher",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.runner.tags = 2;
    drawRunnerCardsForTest(state, 5);
    const scoredAgendaId = scoreCorpAgendaForTest(
      state,
      "onr_v1_204_ice-transmutation",
    );
    const rockId = putCorpRootInRemote(state, "onr_v1_327_i-got-a-rock");
    state.cardInstances[rockId] = {
      ...state.cardInstances[rockId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1920AssetAbility === "tagged_meat_damage",
    );

    expect(state.specialZones?.removedFromGame).toContain(scoredAgendaId);
    expect(state.winner).toBe("corp");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1920AssetAbility: "tagged_meat_damage",
      agendaPointCost: 3,
      damageResolved: true,
      damageType: "meat",
      damageAmount: 15,
      flatline: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|cardInstances|privatePayload/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Emergency Self-Construct as a flatline replacement without leaking grip cards", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-emergency-self-construct-flatline",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1920_emergency_self_construct_flatline",
          cards: [
            { id: "onr_v1_302_scorched-earth", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    state.runner.tags = 1;
    state.runner.coreDamage = 1;
    const emergencyId = installRunnerProgramForTest(
      state,
      "onr_v1_022_emergency-self-construct",
    );
    emptyRunnerGripForTest(state);
    drawRunnerCardsForTest(state, 2);
    const gripCardsLost = state.runner.grip.slice();
    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_302_scorched-earth",
    );
    expect(state.pendingChoice?.source).toContain("replacement");
    const replacementOption = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(replacementOption).toBeDefined();

    state = applyChoice(state, "runner", String(replacementOption));

    expect(state.winner).toBeNull();
    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.maxHandSize).toBe(4);
    expect(state.runnerActionsPerTurnOverride).toBe(3);
    expect(state.runnerPermanentMeatDamagePrevention).toBe(true);
    expect(state.runner.heap).toContain(emergencyId);
    for (const gripCardId of gripCardsLost) {
      expect(state.runner.heap).toContain(gripCardId);
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      v1920RunnerProgramAbility:
        "emergency_self_construct_flatline_replacement",
      sourceDefinitionId: "onr_v1_022_emergency-self-construct",
      preventedAmount: 4,
      coreDamageRemoved: 1,
      gripCardsLost: 2,
      runnerMaxHandSizeAfter: 4,
      runnerActionsPerTurnOverride: 3,
      permanentMeatDamagePrevention: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"|"stack"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Emergency Self-Construct as side-safe meat-damage prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-emergency-self-construct-prevention",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1920_emergency_self_construct_prevention",
          cards: [
            { id: "onr_v1_302_scorched-earth", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    state.runner.tags = 1;
    installRunnerProgramForTest(state, "onr_v1_022_emergency-self-construct");
    emptyRunnerGripForTest(state);
    drawRunnerCardsForTest(state, 5);
    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_302_scorched-earth",
    );
    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventionOption = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventionOption).toBeDefined();

    state = applyChoice(state, "runner", String(preventionOption));

    expect(state.winner).toBeNull();
    expect(state.runner.grip).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      eventModificationOutcome: "partially_prevented",
      sourceDefinitionId: "onr_v1_022_emergency-self-construct",
      originalAmount: 4,
      preventedAmount: 1,
      finalAmount: 3,
      damageResolved: true,
      damageType: "meat",
      damageAmount: 3,
      flatline: false,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"|"stack"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("scores Ice Transmutation and persists a public rezzed-ICE modifier", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-ice-transmutation-target",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    const agendaId = putCorpRootInRemote(state, "onr_v1_204_ice-transmutation");
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      advancementCounters: 5,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
    );

    expect(state.pendingChoice?.source).toContain(
      "card_implementation_primitive.select_rezzed_ice_mark_modifier",
    );
    expect(getPlayerView(state, "corp").pendingChoice?.options[0]?.value).toBe(
      iceId,
    );
    state = applyChoices(state, "corp", [`card_${iceId}`]);

    expect(cardCounterAmount(state, iceId, "mark")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      agendaAbility: "v1920_ice_transmutation",
      targetIceDefinitionId: "onr_v1_232_crystal-wall",
      strengthBonus: 1,
      duplicatedSubroutineCount: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs V1.9.20 MRAM hardware through legal actions and recomputes visible hand size", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-mram-memory",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_133_militech-mram-chip");
    moveRunnerCardToGrip(state, "onr_v1_134_mram-chip");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const beforeMemoryLimit = state.runner.memoryLimit;
    const beforeMaxHandSize = getPlayerView(state, "runner").own.maxHandSize;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_133_militech-mram-chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit);
    expect(getPlayerView(state, "runner").own.maxHandSize).toBe(
      beforeMaxHandSize + 3,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_134_mram-chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit);

    const runnerView = getPlayerView(state, "runner");
    expect(runnerView.own.memoryLimit).toBe(beforeMemoryLimit);
    expect(runnerView.own.maxHandSize).toBe(beforeMaxHandSize + 5);
    const modifiers = collectActiveModifiers(state).filter(
      (modifier) => modifier.kind === "max_hand_size",
    );
    expect(modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceDefinitionId: "onr_v1_133_militech-mram-chip",
          kind: "max_hand_size",
          side: "runner",
          amount: 3,
          duration: "while_installed",
          target: { kind: "side", id: "runner" },
          visibility: "public",
        }),
        expect.objectContaining({
          sourceDefinitionId: "onr_v1_134_mram-chip",
          kind: "max_hand_size",
          side: "runner",
          amount: 2,
          duration: "while_installed",
          target: { kind: "side", id: "runner" },
          visibility: "public",
        }),
      ]),
    );
    expect(modifiers.reduce((sum, modifier) => sum + modifier.amount, 0)).toBe(
      5,
    );
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_133_militech-mram-chip",
      )?.maxHandSizeBonus,
    ).toBe(3);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_134_mram-chip",
      )?.maxHandSizeBonus,
    ).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_133_militech-mram-chip",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses rezzed V1.9.20 action-economy assets through explicit legal actions", () => {
    for (const definitionId of ["onr_v1_334_pacifica-regional-ai"]) {
      let state = apply(
        createGameAfterSetup({
          seed: `v1920-asset-actions-${definitionId}`,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      state.corp.clicks = 3;
      state.corp.maxHandSize = 100;

      const assetId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[assetId] = {
        ...state.cardInstances[assetId]!,
        faceup: true,
        rezzed: true,
        advancementCounters: 1,
      };
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const clicksBefore = state.corp.clicks;
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "activated_card_ability" &&
          String(action.payload?.cardId) === assetId,
      );

      expect(state.corp.clicks, definitionId).toBe(clicksBefore + 1);
      expect(state.eventLog.at(-1)?.publicPayload, definitionId).toMatchObject({
        actionType: "activated_card_ability",
        gainedActions: 1,
        corpClicksAfter: clicksBefore + 1,
      });
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
      );
      expect(
        getPlayerView(state, "runner").opponent.handCount,
        definitionId,
      ).toBe(state.corp.hq.length);
      expect(
        JSON.stringify(getPlayerView(state, "runner").opponent),
        definitionId,
      ).not.toContain("Simple Economy Operation");
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("applies Newsgroup Taunting as a rezzed start-of-run tax", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-newsgroup-taunting-run-tax",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 1;
    state.runner.clicks = 4;
    state.corp.credits = 10;
    const newsgroupId = putCorpRootInRemote(
      state,
      "onr_v1_332_newsgroup-taunting",
    );
    state.cardInstances[newsgroupId] = {
      ...state.cardInstances[newsgroupId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(legal.costs[0]?.credits).toBe(1);
    expect(legal.payload).toMatchObject({
      runStartTaxCredits: 1,
      runStartTaxSourceDefinitionIds: "onr_v1_332_newsgroup-taunting",
    });
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      runStartTaxCredits: 1,
      runStartTaxSourceDefinitionIds: "onr_v1_332_newsgroup-taunting",
      runnerCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let poorRunner = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-newsgroup-taunting-run-tax-insufficient",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    poorRunner.runner.credits = 0;
    poorRunner.runner.clicks = 4;
    const poorNewsgroupId = putCorpRootInRemote(
      poorRunner,
      "onr_v1_332_newsgroup-taunting",
    );
    poorRunner.cardInstances[poorNewsgroupId] = {
      ...poorRunner.cardInstances[poorNewsgroupId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(poorRunner, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);
  });

  it("rejects wrong-side and stale V1.9.20 action-economy asset actions", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-asset-actions-revalidation",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    const assetId = putCorpRootInRemote(
      state,
      "onr_v1_334_pacifica-regional-ai",
    );
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
      advancementCounters: 1,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === assetId,
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1920-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1920-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
  });

  it("applies Fortress Architects as a Corp ICE install-cost modifier", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      cards: [
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 1 },
      ],
    };
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-fortress-install-cost",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.maxHandSize = 100;
    const fortressId = putCorpRootInRemote(
      state,
      "onr_v1_324_fortress-architects",
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_324_fortress-architects",
    );
    const iceId = moveCorpCardToHq(state, "onr_v1_232_crystal-wall");
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "rd",
    );
    expect(legal.costs[0]?.credits).toBe(1);
    expect(legal.payload).toMatchObject({
      iceInstallBaseCost: 2,
      iceInstallAdditionalCost: 0,
      iceInstallReduction: 1,
      iceInstallTotalCost: 1,
      iceInstallReductionSourceDefinitionIds: "onr_v1_324_fortress-architects",
    });

    const stale = structuredClone(state);
    stale.cardInstances[fortressId] = {
      ...stale.cardInstances[fortressId]!,
      rezzed: false,
    };
    const rejected = applyAction(stale, {
      matchId: stale.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "v1920-fortress-install-cost-stale",
    });
    expect(rejected.ok).toBe(false);

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.corp.credits).toBe(creditsBefore - 1);
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toContain(iceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      iceInstallBaseCost: 2,
      iceInstallReduction: 1,
      iceInstallTotalCost: 1,
      iceInstallReductionSourceDefinitionIds: "onr_v1_324_fortress-architects",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not apply Fortress Architects install-cost modifier when inactive or for non-ICE installs", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      cards: [
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 1 },
      ],
    };
    let unrezzed = apply(
      createGameAfterSetup({
        seed: "v1920-fortress-install-cost-unrezzed",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    unrezzed.corp.credits = 20;
    putCorpRootInRemote(unrezzed, "onr_v1_324_fortress-architects");
    putCorpIceOnServer(unrezzed, "rd", "simple_barrier_ice");
    putCorpIceOnServer(unrezzed, "rd", "simple_code_gate_ice");
    const unrezzedIceId = moveCorpCardToHq(unrezzed, "onr_v1_232_crystal-wall");
    const unrezzedInstall = mustAction(
      unrezzed,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === unrezzedIceId &&
        action.payload?.serverId === "rd",
    );
    expect(unrezzedInstall.costs[0]?.credits).toBe(2);
    expect(unrezzedInstall.payload?.iceInstallReduction).toBe(0);
    expect(
      unrezzedInstall.payload?.iceInstallReductionSourceDefinitionIds,
    ).toBeUndefined();

    let nonIce = apply(
      createGameAfterSetup({
        seed: "v1920-fortress-install-cost-non-ice",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    nonIce.corp.credits = 20;
    putCorpRootInRemote(nonIce, "onr_v1_324_fortress-architects");
    nonIce = apply(
      nonIce,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nonIce, action) === "onr_v1_324_fortress-architects",
    );
    const regionId = moveCorpCardToHq(nonIce, "onr_v1_360_jerusalem-city-grid");
    const regionInstall = mustAction(
      nonIce,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === regionId &&
        action.payload?.serverId === "remote_1",
    );
    expect(regionInstall.costs[0]?.credits).toBe(2);
    expect(regionInstall.payload?.iceInstallReduction).toBeUndefined();
  });

  it("does not apply Fortress Architects install-cost modifier to Runner installs", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-fortress-install-cost-runner-install",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.runner.credits = 20;
    putCorpRootInRemote(state, "onr_v1_324_fortress-architects");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_324_fortress-architects",
    );
    state = toRunnerTurnFromCorpMain(state);
    const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "install_card" && action.source === decoderId,
    );
    expect(legal.costs[0]).toMatchObject({ clicks: 1, credits: 3 });
    expect(legal.payload?.iceInstallReduction).toBeUndefined();
    expect(
      legal.payload?.iceInstallReductionSourceDefinitionIds,
    ).toBeUndefined();
    expect(legal.payload?.iceInstallTotalCost).toBeUndefined();

    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.runner.credits).toBe(creditsBefore - 3);
    expect(state.runner.rig.programs).toContain(decoderId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "simple_decoder",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "iceInstallReduction",
    );
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "iceInstallReductionSourceDefinitionIds",
    );
  });

  it("projects V1.9.20 scored-agenda handlimit modifiers through PlayerViews", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-main-office-handlimit",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 5;

    moveCorpCardToHq(state, "onr_v1_205_main-office-relocation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_205_main-office-relocation",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_205_main-office-relocation",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_205_main-office-relocation",
    );

    expect(state.corp.maxHandSize).toBe(5);
    expect(getPlayerView(state, "corp").own.maxHandSize).toBe(7);
    expect(getPlayerView(state, "runner").opponent.maxHandSize).toBe(7);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Economy Operation"/,
    );
    expect(getPlayerView(state, "runner").opponent.handCount).toBe(
      state.corp.hq.length,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Bioweapons Engineering to meat-damage sources before resolution", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1920_bioweapons_meat_damage",
      name: "O:NR V1.9.20 Bioweapons Meat Damage",
      cards: [
        { id: "onr_v1_302_scorched-earth", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = apply(
      createGameAfterSetup({
        seed: "v1920-bioweapons-meat-damage",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    state.runner.tags = 1;
    drawRunnerCardsForTest(state, 3);

    moveCorpCardToHq(state, "onr_v1_190_bioweapons-engineering");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_190_bioweapons-engineering" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_190_bioweapons-engineering",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_190_bioweapons-engineering",
    );
    expect(
      state.corp.scoreArea.map((id) => state.cardInstances[id]?.definitionId),
    ).toContain("onr_v1_190_bioweapons-engineering");

    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_302_scorched-earth",
    );

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_302_scorched-earth",
      damageResolved: true,
      damageType: "meat",
      baseDamageAmount: 4,
      bioweaponsEngineeringModifier: 1,
      damageAmount: 5,
      cardsTrashed: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"|"grip"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Loan from Chiba as a 12-credit gain without recurring counters", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1920-loan-install-credit",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_168_loan-from-chiba");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_168_loan-from-chiba",
    );
    const loanId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_168_loan-from-chiba",
    );
    expect(loanId).toBeDefined();
    if (!loanId) throw new Error("Missing Loan from Chiba");
    expect(state.runner.credits).toBe(32);
    expect(cardCounterAmount(state, loanId, "recurring_credit")).toBe(0);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.definitionId === "onr_v1_168_loan-from-chiba",
      )?.counters?.recurring_credit,
    ).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_168_loan-from-chiba",
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 12,
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          reason: "card_resolver",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves Loan from Chiba start-of-turn loss from CardImplementation only while installed", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p324-loan-start-runner-turn",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.maxHandSize = 100;
    moveRunnerCardToGrip(state, "onr_v1_168_loan-from-chiba");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_168_loan-from-chiba",
    );
    expect(state.runner.credits).toBe(32);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "end_turn" &&
        action.payload?.cardImplementationLifecycleAction !==
          "end_of_runner_turn",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(31);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      resolvedEffects: expect.arrayContaining([
        expect.objectContaining({
          kind: "lose_credits",
          side: "runner",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
        }),
      ]),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state.runner.credits = 0;
    state.corp.maxHandSize = 100;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "end_turn" &&
        action.payload?.cardImplementationLifecycleAction !==
          "end_of_runner_turn",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(0);
  });

  it("lets the Runner trash Loan from Chiba at end of turn and pays the leave-play penalty once", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p324-loan-end-turn-trash-pay",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_168_loan-from-chiba");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_168_loan-from-chiba",
    );
    const loanId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_168_loan-from-chiba",
    );
    expect(loanId).toBeDefined();
    if (!loanId) throw new Error("Missing Loan from Chiba");
    const trashAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "end_turn" &&
        action.payload?.cardImplementationLifecycleAction ===
          "end_of_runner_turn" &&
        action.payload?.cardId === loanId,
    );
    const removed = structuredClone(state);
    removeEverywhere(removed, loanId);
    expect(
      applyAction(removed, {
        matchId: removed.matchId,
        side: "runner",
        actionId: trashAction.actionId,
        clientKnownStateVersion: removed.stateVersion,
        idempotencyKey: "p324-loan-stale-removed",
      }).ok,
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === trashAction.actionId,
    );
    expect(state.runner.heap).toContain(loanId);
    expect(state.runner.rig.resources).not.toContain(loanId);
    expect(state.runner.credits).toBe(22);
    expect(state.winner).toBeNull();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      sourceDefinitionId: "onr_v1_168_loan-from-chiba",
      sourceTrashed: true,
      resolvedEffects: [
        expect.objectContaining({
          kind: "pay_credits_or_lose_game",
          side: "runner",
          amount: 10,
          paidCredits: 10,
          gameLost: false,
          reason: "source_left_play",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
        }),
        expect.objectContaining({
          kind: "trash_source",
          reason: "end_of_turn",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
        }),
      ],
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(22);
    expect(
      JSON.stringify(state.eventLog.at(-1)?.publicPayload ?? {}),
    ).not.toContain("onr_v1_168_loan-from-chiba");
  });

  it("makes the Runner lose the game if Loan from Chiba leaves play without 10 credits", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p324-loan-end-turn-trash-lose",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    moveRunnerCardToGrip(state, "onr_v1_168_loan-from-chiba");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_168_loan-from-chiba",
    );
    state.runner.credits = 9;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "end_turn" &&
        action.payload?.cardImplementationLifecycleAction ===
          "end_of_runner_turn",
    );
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("unknown");
    expect(state.phase).toBe("game_over");
    expect(state.runner.credits).toBe(9);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      gameEndReason: "unknown",
      resolvedEffects: expect.arrayContaining([
        expect.objectContaining({
          kind: "pay_credits_or_lose_game",
          paidCredits: 0,
          gameLost: true,
          winner: "corp",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
        }),
      ]),
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Rabbit only to Corp ICE trace bid limits", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "spotcheck_rabbit_trace_runner",
      name: "Spotcheck Rabbit Trace Runner",
      cards: [
        { id: "onr_v1_051_rabbit", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards,
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-rabbit-trace",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    installRunnerProgramForTest(state, "onr_v1_051_rabbit");
    putCorpIceOnServer(state, "rd", "onr_v1_221_asp");
    state.corp.credits = 20;
    state.runner.credits = 4;

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
        sourceDefinition(state, action) === "onr_v1_221_asp",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.side).toBe("corp");
    const expectedCorpBidMax = state.corp.credits - 1;
    expect(
      state.pendingChoice?.options.some(
        (option) => option.id === `bid_${expectedCorpBidMax}`,
      ),
    ).toBe(true);
    expect(
      state.pendingChoice?.options.some(
        (option) => option.id === `bid_${state.corp.credits}`,
      ),
    ).toBe(false);
    expect(state.trace).toMatchObject({
      sourceDefinitionId: "onr_v1_221_asp",
      corpBidMax: expectedCorpBidMax,
      rabbitTraceLimitReduction: 1,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStarted: true,
      corpBidMax: expectedCorpBidMax,
      rabbitTraceLimitReduction: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("loads Artemis MU and recurring icebreaker credits while replacing older decks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-artemis-recurring",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_artemis_runner",
          name: "Spotcheck Artemis Runner",
          cards: [
            { id: "onr_v1_136_pandoras-deck", quantity: 1 },
            { id: "onr_v1_122_artemis-2020", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_136_pandoras-deck");
    moveRunnerCardToGrip(state, "onr_v1_122_artemis-2020");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_136_pandoras-deck",
    );
    const oldDeckId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_136_pandoras-deck",
    );
    const memoryBefore = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_122_artemis-2020",
    );
    const artemisId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_122_artemis-2020",
    );
    expect(artemisId).toBeDefined();
    if (!artemisId) throw new Error("Missing Artemis");
    expect(state.runner.memoryLimit).toBe(memoryBefore);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 2,
    );
    expect(cardCounterAmount(state, artemisId, "bit")).toBe(2);
    if (oldDeckId) expect(state.runner.heap).toContain(oldDeckId);
  });

  it("resolves South African Mining Corp as a 3-action CardImplementation economy ability", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-south-african-mining",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 5;
    state.corp.clicks = 3;
    const assetId = putCorpRootInRemote(
      state,
      "onr_v1_343_south-african-mining-corp",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) ===
            "onr_v1_343_south-african-mining-corp",
      ),
    ).toBe(false);
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_343_south-african-mining-corp",
    );
    expect(legal.costs).toEqual([{ clicks: 3 }]);
    expect(legal.label).toBe("6 Credits nehmen");
    for (const remainingClicks of [0, 1, 2]) {
      const lowClickLegalState = structuredClone(state);
      lowClickLegalState.corp.clicks = remainingClicks;
      expect(
        getLegalActions(lowClickLegalState, "corp").some(
          (action) =>
            action.type === "activated_card_ability" &&
            sourceDefinition(lowClickLegalState, action) ===
              "onr_v1_343_south-african-mining-corp",
        ),
      ).toBe(false);
    }
    const unrezzed = structuredClone(state);
    unrezzed.cardInstances[assetId] = {
      ...unrezzed.cardInstances[assetId]!,
      rezzed: false,
    };
    const rejected = applyAction(unrezzed, {
      matchId: unrezzed.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: unrezzed.stateVersion,
      idempotencyKey: "south-african-unrezzed-source",
    });
    expect(rejected.ok).toBe(false);
    const lowClicks = structuredClone(state);
    lowClicks.corp.clicks = 2;
    const clickRejected = applyAction(lowClicks, {
      matchId: lowClicks.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: lowClicks.stateVersion,
      idempotencyKey: "south-african-low-clicks",
    });
    expect(clickRejected.ok).toBe(false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.corp.credits).toBe(11);
    expect(state.corp.clicks).toBe(0);
    expect(state.corp.archives).not.toContain(assetId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_343_south-african-mining-corp",
      cardImplementationAbility: "activated",
      gainedCredits: 6,
      corpCreditsAfter: 11,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 6,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_343_south-african-mining-corp",
          sourceTitle: "South African Mining Corp",
        }),
      ],
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Jerusalem City Grid wall modifiers server-bound", () => {
    const approachIce = (
      seed: string,
      iceServerId: "rd" | "remote_1",
      iceDefinitionId = "onr_v1_232_crystal-wall",
    ): GameState => {
      let state = apply(
        createGameAfterSetup({
          seed,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            cards: [
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
              { id: "simple_code_gate_ice", quantity: 1 },
            ],
          },
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      const gridId = putCorpRootInRemote(
        state,
        "onr_v1_360_jerusalem-city-grid",
      );
      state.cardInstances[gridId] = {
        ...state.cardInstances[gridId]!,
        faceup: true,
        rezzed: true,
      };
      putCorpIceOnServer(state, iceServerId, iceDefinitionId);
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      state.runner.clicks = 4;
      return apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === iceServerId,
      );
    };
    const ownServerState = approachIce(
      "spotcheck-jerusalem-city-grid-own",
      "remote_1",
    );
    const otherServerState = approachIce(
      "spotcheck-jerusalem-city-grid-other",
      "rd",
    );
    const sameServerNonWallState = approachIce(
      "spotcheck-jerusalem-city-grid-non-wall",
      "remote_1",
      "simple_code_gate_ice",
    );
    const ownServerRez = mustAction(
      ownServerState,
      "corp",
      (action) => action.type === "rez_ice",
    );
    const otherServerRez = mustAction(
      otherServerState,
      "corp",
      (action) => action.type === "rez_ice",
    );
    const sameServerNonWallRez = mustAction(
      sameServerNonWallState,
      "corp",
      (action) => action.type === "rez_ice",
    );
    expect(ownServerRez.costs[0]?.credits).toBe(2);
    expect(ownServerRez.payload).toMatchObject({
      rezCostPaid: 2,
      rezCostReductionAmount: 2,
    });
    expect(ownServerRez.payload?.rezCostReductionSourceDefinitionIds).toContain(
      "onr_v1_360_jerusalem-city-grid",
    );
    expect(otherServerRez.costs[0]?.credits).toBe(4);
    expect(
      otherServerRez.payload?.rezCostReductionSourceDefinitionIds,
    ).toBeUndefined();
    const ownServerAfterRez = apply(
      ownServerState,
      "corp",
      (action) => action.actionId === ownServerRez.actionId,
    );
    expect(
      getPlayerView(ownServerAfterRez, "runner").run?.encounteredIce?.strength,
    ).toBe((DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength ?? 0) + 1);
    const otherServerAfterRez = apply(
      otherServerState,
      "corp",
      (action) => action.actionId === otherServerRez.actionId,
    );
    expect(
      getPlayerView(otherServerAfterRez, "runner").run?.encounteredIce
        ?.strength,
    ).toBe(DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength);
    const sameServerNonWallAfterRez = apply(
      sameServerNonWallState,
      "corp",
      (action) => action.actionId === sameServerNonWallRez.actionId,
    );
    expect(
      getPlayerView(sameServerNonWallAfterRez, "runner").run?.encounteredIce
        ?.strength,
    ).toBe(DEMO_CARDS_BY_ID.simple_code_gate_ice?.strength);
    const unrezzedGrid = approachIce(
      "spotcheck-jerusalem-city-grid-unrezzed",
      "remote_1",
    );
    const gridId = unrezzedGrid.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.find(
        (cardId) =>
          unrezzedGrid.cardInstances[cardId]?.definitionId ===
          "onr_v1_360_jerusalem-city-grid",
      );
    if (gridId) {
      unrezzedGrid.cardInstances[gridId] = {
        ...unrezzedGrid.cardInstances[gridId]!,
        rezzed: false,
      };
    }
    const unrezzedGridRez = mustAction(
      unrezzedGrid,
      "corp",
      (action) => action.type === "rez_ice",
    );
    const unrezzedGridAfterRez = passCorpApproachRezWindowIfOpen(
      apply(
        unrezzedGrid,
        "corp",
        (action) => action.actionId === unrezzedGridRez.actionId,
      ),
    );
    expect(
      getPlayerView(unrezzedGridAfterRez, "runner").run?.encounteredIce
        ?.strength,
    ).toBe(DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength);
    expect(
      cardImplementationCoverageForDefinitionId(
        "onr_v1_360_jerusalem-city-grid",
      )?.status,
    ).toBe("implemented");
  });

  it("applies City Surveillance draw tax only from rezzed public assets", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-city-surveillance-draw-tax",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    const cityId = putCorpRootInRemote(state, "onr_v1_313_city-surveillance");
    state.runner.credits = 1;
    state.runner.tags = 0;
    state.runner.clicks = 4;
    const unrezzed = apply(
      state,
      "runner",
      (action) => action.type === "draw_card",
    );
    expect(unrezzed.runner.credits).toBe(1);
    expect(unrezzed.runner.tags).toBe(0);

    state = unrezzed;
    state.cardInstances[cityId] = {
      ...state.cardInstances[cityId]!,
      faceup: true,
      rezzed: true,
    };
    const drawActions = getLegalActions(state, "runner").filter(
      (action) => action.type === "draw_card",
    );
    expect(drawActions).toHaveLength(2);
    expect(
      drawActions.find(
        (action) => action.payload?.drawTaxDecision === "pay",
      ),
    ).toMatchObject({
      costs: [{ clicks: 1, credits: 1 }],
      payload: {
        drawTaxSourceCount: 1,
        drawTaxProjectedCreditsPaid: 1,
        drawTaxProjectedTagsAdded: 0,
      },
    });
    expect(
      drawActions.find(
        (action) => action.payload?.drawTaxDecision === "tag",
      ),
    ).toMatchObject({
      costs: [{ clicks: 1 }],
      payload: {
        drawTaxSourceCount: 1,
        drawTaxProjectedCreditsPaid: 0,
        drawTaxProjectedTagsAdded: 1,
      },
    });
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "draw_card" &&
        action.payload?.drawTaxDecision === "pay",
    );
    expect(state.runner.credits).toBe(0);
    expect(state.runner.tags).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      drawnCount: 1,
      drawTaxSourceCount: 1,
      drawTaxDecision: "pay",
      drawTaxCreditsPaid: 1,
      drawTaxTagsAdded: 0,
      runnerCreditsAfter: 0,
    });
    const tagOnlyDrawActions = getLegalActions(state, "runner").filter(
      (action) => action.type === "draw_card",
    );
    expect(tagOnlyDrawActions).toHaveLength(1);
    expect(tagOnlyDrawActions[0]?.payload).toMatchObject({
      drawTaxDecision: "tag",
      drawTaxProjectedTagsAdded: 1,
    });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "draw_card" &&
        action.payload?.drawTaxDecision === "tag",
    );
    expect(state.runner.tags).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      drawTaxSourceCount: 1,
      drawTaxDecision: "tag",
      drawTaxCreditsPaid: 0,
      drawTaxTagsAdded: 1,
      runnerTagsAfter: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.9.21 Deterministic Random WIP", () => {
  it("adds all V1.9.21 WIP runtime definitions without release-promoting V1.9.22", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.randomEffects).toHaveLength(6);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.randomEffects) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "deterministic_random",
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]?.implementationStatus).toBe(
      "playable_mvp",
    );
  });

  it("resolves Schlaghund as a tag-threshold die roll with meat damage and self-trash", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1921-schlaghund-tag-damage",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1921_random_probe",
          name: "O:NR V1.9.21 Schlaghund Corp",
          cards: [
            { id: "onr_v1_339_schlaghund", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    state.runner.tags = 6;

    const assetId = putCorpRootInRemote(state, "onr_v1_339_schlaghund");
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1921AssetAbility === "schlaghund_tag_damage" &&
        String(action.payload?.cardId) === assetId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-schlaghund-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1921-schlaghund-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );

    const randomRecord = state.randomDrawRecords.at(-1);
    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(randomRecord?.purpose).toBe(
      "v1921.die.onr_v1_339_schlaghund.tag_damage",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1921AssetAbility: "schlaghund_tag_damage",
      randomPurpose: "v1921.die.onr_v1_339_schlaghund.tag_damage",
      randomCounterAfter: randomBefore + 1,
      runnerTags: 6,
      tagThresholdMet: true,
      damageResolved: true,
      damageType: "meat",
      damageAmount: 10,
      selfTrashed: true,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(state.corp.archives).toContain(assetId);
    expect(
      state.corp.servers.some((server) => server.root.includes(assetId)),
    ).toBe(false);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    expect(getPlayerView(state, "runner").opponent.handCount).toBe(
      state.corp.hq.length,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it.each([
    { seed: "rio-visible-5", expectedRoll: 1, expectedRunEnded: true },
    { seed: "rio-visible-0", expectedRoll: 4, expectedRunEnded: false },
  ])(
    "rolls Rio de Janeiro City Grid visibly after passed ICE on roll $expectedRoll",
    ({ seed, expectedRoll, expectedRunEnded }) => {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: "onr_v1_corp_v1921_rio_after_pass",
            name: "O:NR V1.9.21 Rio After Pass Corp",
            cards: [
              { id: "onr_v1_367_rio-de-janeiro-city-grid", quantity: 1 },
              { id: "simple_barrier_ice", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.runner.clicks = 4;
      state.corp.credits = 20;
      state.corp.clicks = 3;

      const upgradeId = putCorpRootInRemote(
        state,
        "onr_v1_367_rio-de-janeiro-city-grid",
      );
      const iceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        faceup: true,
        rezzed: true,
      };

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      expect(state.run?.encounteredIceId).toBe(iceId);
      state.run = {
        ...state.run!,
        brokenSubroutineIndexes: [0],
      };
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const randomBefore = state.randomDrawRecords.length;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
      const rioPurpose = String(state.randomDrawRecords.at(-1)?.purpose ?? "");
      expect(rioPurpose).toContain(
        "v1921.die.onr_v1_367_rio-de-janeiro-city-grid.passed_ice.",
      );
      expect(rioPurpose).toContain(`.${iceId}.${upgradeId}`);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
        sourceDefinitionId: "onr_v1_367_rio-de-janeiro-city-grid",
        passedIceDefinitionId: "simple_barrier_ice",
        serverLabel: "Remote 1",
        randomCounterAfter: randomBefore + 1,
        v1921DieRoll: expectedRoll,
        rioRunEnded: expectedRunEnded,
      });
      expect(Boolean(state.run)).toBe(!expectedRunEnded);
      for (const side of ["runner", "corp"] as const) {
        expect(
          getPlayerView(state, side).publicEvents.at(-1)?.publicPayload,
        ).toMatchObject({
          v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
          sourceDefinitionId: "onr_v1_367_rio-de-janeiro-city-grid",
          passedIceDefinitionId: "simple_barrier_ice",
          serverLabel: "Remote 1",
          v1921DieRoll: expectedRoll,
          rioRunEnded: expectedRunEnded,
        });
      }
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(state));
      expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
    },
  );

  it("records V1.9.21 Boardwalk die probes through installed program actions", () => {
    for (const definitionId of ["onr_v1_008_boardwalk"]) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1921-${definitionId}-program-die-probe`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `onr_v1_runner_v1921_${definitionId}_random_probe`,
            name: "O:NR V1.9.21 Program Random Probe Runner",
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.runner.clicks = 3;
      state.runner.memoryLimit = 20;

      const programId = installRunnerProgramForTest(state, definitionId);
      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1921RunnerProgramAbility ===
            "deterministic_die_probe" &&
          String(action.payload?.cardId) === programId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1921-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const randomBefore = state.randomDrawRecords.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === legal.actionId,
      );

      const randomPurpose = `v1921.die.${definitionId}.program_probe`;
      expect(state.randomDrawRecords, definitionId).toHaveLength(
        randomBefore + 1,
      );
      expect(state.randomDrawRecords.at(-1)?.purpose, definitionId).toBe(
        randomPurpose,
      );
      expect(state.eventLog.at(-1)?.publicPayload, definitionId).toMatchObject({
        actionType: "gain_credit",
        v1921RunnerProgramAbility: "deterministic_die_probe",
        randomPurpose,
        randomCounterAfter: randomBefore + 1,
      });
      const publicRoll = Number(
        state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
      );
      expect(Number.isInteger(publicRoll), definitionId).toBe(true);
      expect(publicRoll, definitionId).toBeGreaterThanOrEqual(1);
      expect(publicRoll, definitionId).toBeLessThanOrEqual(6);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(replay.actualFinalStateHash, definitionId).toBe(hashState(state));
      expect(replay.state.randomDrawRecords, definitionId).toEqual(
        state.randomDrawRecords,
      );
    }
  });

  it("rolls AI Boon automatically at run start and clears the strength with the run", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1921-ai-boon-run-start-strength",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1921_ai_boon_run_start",
          name: "O:NR V1.9.21 AI Boon Run Start Runner",
          cards: [
            { id: "onr_v1_002_ai-boon", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;
    state.runner.memoryLimit = 20;
    installRunnerProgramForTest(state, "onr_v1_002_ai-boon");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.v1921RunnerProgramAbility ===
          "deterministic_die_probe",
      ),
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_002_ai-boon.run_start_strength",
    );
    expect(state.run?.runStartRandomStrengthBonus).toBe(
      Number(state.eventLog.at(-1)?.publicPayload.runStartRandomStrengthBonus),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      v1921RunnerProgramAbility: "run_start_random_strength_bonus",
      sourceDefinitionId: "onr_v1_002_ai-boon",
      randomPurpose: "v1921.die.onr_v1_002_ai-boon.run_start_strength",
      randomCounterAfter: randomBefore + 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run).toBeUndefined();
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);

    let withoutAiBoon = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1921-ai-boon-run-start-no-source",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    withoutAiBoon.runner.clicks = 3;
    putCorpCardOnTopOfRd(withoutAiBoon, "simple_economy_operation");
    const noSourceRandomBefore = withoutAiBoon.randomDrawRecords.length;
    withoutAiBoon = apply(
      withoutAiBoon,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(withoutAiBoon.randomDrawRecords).toHaveLength(noSourceRandomBefore);
    expect(withoutAiBoon.run?.runStartRandomStrengthBonus).toBeUndefined();
  });

  it("ends Playful AI without a choice or credits on a high roll", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "playful-ai-probe-0",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1921_playful_ai_high_roll",
          name: "O:NR V1.9.21 Playful AI High Roll Runner",
          cards: [
            { id: "onr_v1_104_playful-ai", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;

    const eventId = moveRunnerCardToGrip(state, "onr_v1_104_playful-ai");
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-playful-ai-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const creditsBeforePlay = state.runner.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.runner.heap).toContain(eventId);
    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_104_playful-ai.dice_loop.initial",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      v1921RunnerEventAbility: "random_dice_loop",
      v1921DieRoll: 4,
      playfulAiChoiceOpened: false,
      playfulAiComplete: true,
      playfulAiRemainingDice: 0,
      randomCounterAfter: randomBefore + 1,
    });
    expect(state.runner.credits).toBe(creditsBeforePlay - 1);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "resolve_choice",
      ),
    ).toBe(false);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it("resolves Playful AI split choices and queued dice through replay", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "playful-ai-probe-3",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1921_playful_ai_split_loop",
          name: "O:NR V1.9.21 Playful AI Split Loop Runner",
          cards: [
            { id: "onr_v1_104_playful-ai", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;

    const optionGain = (option: { id: string; value?: unknown }) =>
      typeof option.value === "number"
        ? option.value
        : Number(/^gain_(\d+)_set_aside_\d+$/.exec(option.id)?.[1] ?? 0);
    const eventId = moveRunnerCardToGrip(state, "onr_v1_104_playful-ai");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      v1921RunnerEventAbility: "random_dice_loop",
      v1921DieRoll: 3,
      playfulAiChoiceOpened: true,
      playfulAiComplete: false,
      playfulAiRemainingDice: 0,
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "gain_0_set_aside_3",
      "gain_1_set_aside_2",
      "gain_2_set_aside_1",
      "gain_3_set_aside_0",
    ]);

    const creditsBeforeChoice = state.runner.credits;
    state = applyChoice(state, "runner", "gain_1_set_aside_2");
    const firstResolvePayload = state.eventLog.at(-1)?.publicPayload;
    const firstFollowupRolls = String(
      firstResolvePayload?.playfulAiDieRolls ?? "",
    )
      .split(",")
      .filter(Boolean)
      .map((value) => Number(value));
    expect(state.runner.credits).toBe(creditsBeforeChoice + 1);
    expect(firstResolvePayload).toMatchObject({
      actionType: "resolve_choice",
      v1921RunnerEventAbility: "random_dice_loop",
      playfulAiGainedCredits: 1,
      playfulAiSetAsideDice: 2,
      playfulAiDiceQueuedBeforeRolls: 2,
    });
    expect(firstFollowupRolls.length).toBeGreaterThan(0);
    expect(firstFollowupRolls.length).toBeLessThanOrEqual(2);
    expect(firstFollowupRolls.every((roll) => roll >= 1 && roll <= 6)).toBe(
      true,
    );
    if (firstResolvePayload?.playfulAiChoiceOpened === true) {
      expect(firstResolvePayload.playfulAiRemainingDice).toBe(
        2 - firstFollowupRolls.length,
      );
      expect(state.pendingChoice?.source).toContain("v1921.playful_ai");
    } else {
      expect(firstResolvePayload?.playfulAiRemainingDice).toBe(0);
    }

    let guard = 0;
    while (state.pendingChoice) {
      guard += 1;
      expect(guard).toBeLessThanOrEqual(10);
      const selected = state.pendingChoice.options
        .slice()
        .sort(
          (left, right) =>
            optionGain(right) - optionGain(left) ||
            left.id.localeCompare(right.id),
        )[0];
      expect(selected).toBeDefined();
      state = applyChoice(state, "runner", selected!.id);
    }

    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore + 1);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      state.eventLog
        .slice(replayStart)
        .map((event) => JSON.stringify(event.publicPayload))
        .join("\n"),
    ).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });

  it("records Quest for Cattekin resource die probes through installed resource actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1921-quest-for-cattekin-resource-die-probe",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1921_quest_random_probe",
          name: "O:NR V1.9.21 Quest Random Probe Runner",
          cards: [
            { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 3;

    const resourceId = installRunnerResourceForTest(
      state,
      "onr_v1_172_quest-for-cattekin",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1921RunnerResourceAbility ===
          "deterministic_die_probe" &&
        String(action.payload?.cardId) === resourceId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1921-quest-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toBe(
      "v1921.die.onr_v1_172_quest-for-cattekin.resource_probe",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1921RunnerResourceAbility: "deterministic_die_probe",
      randomPurpose: "v1921.die.onr_v1_172_quest-for-cattekin.resource_probe",
      randomCounterAfter: randomBefore + 1,
    });
    const publicRoll = Number(
      state.eventLog.at(-1)?.publicPayload.v1921DieRoll ?? 0,
    );
    expect(Number.isInteger(publicRoll)).toBe(true);
    expect(publicRoll).toBeGreaterThanOrEqual(1);
    expect(publicRoll).toBeLessThanOrEqual(6);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"Simple Agenda"|"Simple Economy Operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
  });
});
