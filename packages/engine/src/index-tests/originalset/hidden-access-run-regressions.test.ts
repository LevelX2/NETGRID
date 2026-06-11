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
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("Originalset Spotcheck 2026-05-15 Ambush/Hidden/Trace Nachtest", () => {
  it("scales Virus Test Site access damage, reveals R&D access and skips Archives", () => {
    let remoteState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-virus-test-site-remote"),
    );
    remoteState.runner.credits = 10;
    drawRunnerCardsForTest(remoteState, 4);
    const virusTestSiteId = putCorpRootInRemote(
      remoteState,
      "onr_v1_348_virus-test-site",
    );
    remoteState.cardInstances[virusTestSiteId] = {
      ...remoteState.cardInstances[virusTestSiteId]!,
      advancementCounters: 3,
    };
    const gripBefore = remoteState.runner.grip.length;
    const initial = structuredClone(remoteState);
    const replayStart = remoteState.eventLog.length;

    remoteState = apply(
      remoteState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    remoteState = passRootRezWindowBeforeAccessIfOpen(remoteState);
    remoteState = apply(
      remoteState,
      "runner",
      (action) => action.type === "access_card",
    );

    expect(remoteState.runner.grip.length).toBe(gripBefore - 6);
    expect(remoteState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: "onr_v1_348_virus-test-site",
      advancementCounterCount: 3,
      damageAmount: 6,
    });
    const replay = replayEvents(initial, remoteState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(remoteState));

    let rdState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-virus-test-site-rd"),
    );
    rdState.runner.credits = 10;
    const rdVirusTestSiteId = putCorpCardOnTopOfRd(
      rdState,
      "onr_v1_348_virus-test-site",
    );
    rdState = apply(
      rdState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rdState = apply(rdState, "runner", (action) => action.type === "access_card");
    expect(rdState.run?.accessedCardId).toBe(rdVirusTestSiteId);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_348_virus-test-site",
      revealKind: "reveal",
      advancementCounterCount: 0,
      damageAmount: 1,
    });
    expect(JSON.stringify(rdState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"(privatePayload|cardInstances|hq|rd)":/,
    );

    let archivesState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-virus-test-site-archives"),
    );
    archivesState.runner.credits = 10;
    const archivedVirusTestSiteId = moveCorpCardToArchives(
      archivesState,
      "onr_v1_348_virus-test-site",
      false,
    );
    keepOnlyCorpArchivesCards(archivesState, [archivedVirusTestSiteId]);
    const archivesGripBefore = archivesState.runner.grip.length;
    archivesState = apply(
      archivesState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    expect(archivesState.runner.grip.length).toBe(archivesGripBefore);
    expect(archivesState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: "onr_v1_348_virus-test-site",
      archivesAutoAccessedCount: 1,
    });
  });

  it("keeps Setup! at two net damage and skips its Archives access", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-setup-archives"));
    state.runner.credits = 10;
    const setupId = moveCorpCardToArchives(state, "onr_v1_340_setup", false);
    keepOnlyCorpArchivesCards(state, [setupId]);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: "onr_v1_340_setup",
      archivesAutoAccessedCount: 1,
    });
  });

  it("handles TRAP! R&D reveal and Archives skip without pre-access leaks", () => {
    let rdState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-trap-rd"),
    );
    rdState.corp.credits = 10;
    rdState.runner.credits = 10;
    drawRunnerCardsForTest(rdState, 4);
    const rdTrapId = putCorpCardOnTopOfRd(rdState, "onr_v1_345_trap");
    const rdGripBefore = rdState.runner.grip.length;
    const rdTagsBefore = rdState.runner.tags;
    const initial = structuredClone(rdState);
    const replayStart = rdState.eventLog.length;

    expect(JSON.stringify(getPlayerView(rdState, "runner"))).not.toContain(
      "onr_v1_345_trap",
    );
    rdState = apply(
      rdState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rdState = apply(rdState, "runner", (action) => action.type === "access_card");
    expect(rdState.pendingChoice?.source).toContain("p3_35.access_payment");
    rdState = applyChoice(rdState, "corp", "pay");

    expect(rdState.run?.accessedCardId).toBe(rdTrapId);
    expect(rdState.runner.tags).toBe(rdTagsBefore + 1);
    expect(rdState.runner.grip.length).toBe(rdGripBefore - 3);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: "onr_v1_345_trap",
      cardDefinitionId: "onr_v1_345_trap",
      revealKind: "reveal",
      accessedFromZone: "rd",
      damageAmount: 3,
      tagsAdded: 1,
    });
    expect(JSON.stringify(rdState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"(privatePayload|cardInstances|hq|rd)":/,
    );
    const replay = replayEvents(initial, rdState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(rdState));

    let archivesState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-trap-archives"),
    );
    archivesState.runner.credits = 10;
    const archivedTrapId = moveCorpCardToArchives(
      archivesState,
      "onr_v1_345_trap",
      false,
    );
    keepOnlyCorpArchivesCards(archivesState, [archivedTrapId]);
    const archivesGripBefore = archivesState.runner.grip.length;
    const archivesTagsBefore = archivesState.runner.tags;

    archivesState = apply(
      archivesState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(archivesState.runner.grip.length).toBe(archivesGripBefore);
    expect(archivesState.runner.tags).toBe(archivesTagsBefore);
    expect(archivesState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: "onr_v1_345_trap",
      archivesAutoAccessedCount: 1,
    });
  });

  it("uses Information Laundering advancement scaling and trashes the source", () => {
    for (const advancementCounters of [0, 4]) {
      let state = apply(
        MECHANIC_SMOKE_GAMES.agendaScoring(
          `spotcheck-information-laundering-${advancementCounters}`,
        ),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      state.corp.clicks = 5;
      const informationId = putCorpRootInRemote(
        state,
        "onr_v1_328_information-laundering",
      );
      state.cardInstances[informationId] = {
        ...state.cardInstances[informationId]!,
        faceup: true,
        rezzed: true,
        advancementCounters,
      };
      const creditsBefore = state.corp.credits;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbility === "activated" &&
          action.payload?.cardId === informationId,
      );

      expect(state.corp.credits).toBe(creditsBefore + advancementCounters * 4);
      expect(state.corp.archives).toContain(informationId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        sourceDefinitionId: "onr_v1_328_information-laundering",
        advancementCounterCount: advancementCounters,
        gainedCredits: advancementCounters * 4,
        sourceTrashed: true,
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("redacts Edited Shipping Manifests replacement draw and leaves no access queue", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-edited-shipping-manifests",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_7_1_RUNNER_DECK,
        corpDeck: ONR_V1_7_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    const manifestsId = moveRunnerCardToGrip(
      state,
      "onr_v1_084_edited-shipping-manifests",
    );
    const hqBefore = state.corp.hq.length;
    const rdBefore = state.corp.rd.length;
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.source === manifestsId &&
        action.payload?.serverId === "hq",
    );

    expect(state.run).toBeUndefined();
    expect(state.corp.hq.length).toBe(hqBefore);
    expect(state.corp.rd.length).toBe(rdBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "corp_lose_credits",
      creditLoss: 1,
      tagsAdded: 1,
      gainedCredits: 10,
      runnerCreditsAfter: 19,
      runnerTagsAfter: 1,
      hiddenZoneBarrier: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"corp_[a-z0-9_-]+_\d+"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(initial.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("publishes Fragmentation Storm program-trash summary after successful trace", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting(
        "spotcheck-fragmentation-storm-payload",
      ),
    );
    state.runner.credits = 10;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_047_pile-driver");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_047_pile-driver",
    );
    const pileDriverId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_047_pile-driver",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");

    expect(pileDriverId && state.runner.heap.includes(pileDriverId)).toBe(true);
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCardDefinitionId: "onr_v1_047_pile-driver",
      trashedCardType: "program",
      trashedCount: 1,
      runnerRunEnded: true,
      runnerRunLockCreditCost: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"stack"/,
    );
  });

  it("keeps Skälderviken SA Beta Test Site black-ICE-only rez-cost projection public after rez", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-skalderviken",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_6_2_RUNNER_DECK,
        corpDeck: ONR_V1_6_2_CORP_DECK,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 5;
    const skaldervikenId = putCorpRootInRemote(
      state,
      "onr_v1_341_skalderviken-sa-beta-test-site",
    );
    state.cardInstances[skaldervikenId] = {
      ...state.cardInstances[skaldervikenId]!,
      faceup: true,
      rezzed: true,
    };
    const blackIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_231_cortical-scrub",
    );
    const nonBlackIceId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_230_cortical-scanner",
    );

    let blackRunState = toRunnerTurnFromCorpMain(state);
    blackRunState.runner.credits = 10;
    blackRunState = apply(
      blackRunState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const blackRez = mustAction(
      blackRunState,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === blackIceId,
    );
    expect(blackRez.costs).toEqual([{ credits: 5 }]);
    expect(blackRez.payload).toMatchObject({
      rezCostReductionSourceDefinitionIds:
        "onr_v1_341_skalderviken-sa-beta-test-site",
      rezCostReductionAmount: 2,
      rezCostPaid: 5,
    });
    let nonBlackRunState = toRunnerTurnFromCorpMain(state);
    nonBlackRunState.runner.credits = 10;
    nonBlackRunState = apply(
      nonBlackRunState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const nonBlackRez = mustAction(
      nonBlackRunState,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === nonBlackIceId,
    );
    expect(
      nonBlackRez.payload?.rezCostReductionSourceDefinitionIds,
    ).toBeUndefined();
  });
});

describe("Originalset Spotcheck 2026-05-15 Hidden/Access/Trace Nachtest", () => {
  const hiddenLeakPattern =
    /"privatePayload"|"cardInstances"|"hq"|"rd"|"grip"|"stack"/;

  it("hardens Fortress Respecification and Ice and Data's Guide hidden-zone payloads", () => {
    let exposeState = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-fortress"));
    exposeState.runner.credits = 20;
    moveRunnerCardToGrip(exposeState, "onr_v1_088_fortress-respecification");
    putCorpRootInRemote(exposeState, "simple_upgrade");
    const firstIceId = putCorpIceOnServer(exposeState, "remote_1", "simple_barrier_ice");
    const secondIceId = putCorpIceOnServer(
      exposeState,
      "remote_1",
      "simple_code_gate_ice",
    );
    exposeState.cardInstances[firstIceId] = {
      ...exposeState.cardInstances[firstIceId]!,
      faceup: false,
      rezzed: false,
    };
    exposeState.cardInstances[secondIceId] = {
      ...exposeState.cardInstances[secondIceId]!,
      faceup: false,
      rezzed: false,
    };
    exposeState.runnerTurnFlags = {
      ...exposeState.runnerTurnFlags!,
      successfulRunThisTurn: true,
      lastSuccessfulRunServerId: "remote_1",
    };
    const exposeAction = mustAction(
      exposeState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(exposeState, action) ===
          "onr_v1_088_fortress-respecification",
    );
    const exposeInitial = structuredClone(exposeState);
    const exposeReplayStart = exposeState.eventLog.length;
    const wrongSide = applyAction(exposeState, {
      matchId: exposeState.matchId,
      side: "corp",
      actionId: exposeAction.actionId,
      clientKnownStateVersion: exposeState.stateVersion,
      idempotencyKey: "spotcheck-fortress-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(exposeState, {
      matchId: exposeState.matchId,
      side: "runner",
      actionId: exposeAction.actionId,
      clientKnownStateVersion: exposeState.stateVersion - 1,
      idempotencyKey: "spotcheck-fortress-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    exposeState = apply(
      exposeState,
      "runner",
      (action) => action.actionId === exposeAction.actionId,
    );
    expect(exposeState.pendingChoice?.source).toContain(
      "p3_58.fortress_respecification",
    );
    exposeState = applyChoices(exposeState, "runner", [
      `card_${secondIceId}`,
      `card_${firstIceId}`,
    ]);
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_58_fortress_respecification_reorder",
      amounts: expect.objectContaining({ reorderedIceCount: 2 }),
      targets: expect.objectContaining({ hiddenOrderChoice: true }),
    });
    expect(
      JSON.stringify(exposeState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/simple_barrier_ice|simple_code_gate_ice|Simple Barrier ICE|Simple Code Gate ICE|cardInstances/);
    const exposeReplay = replayEvents(
      exposeInitial,
      exposeState.eventLog.slice(exposeReplayStart),
    );
    expect(exposeReplay.ok).toBe(true);
    expect(hashState(exposeReplay.state)).toBe(hashState(exposeState));

    let revealState = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ice-data"));
    revealState.runner.credits = 20;
    moveRunnerCardToGrip(
      revealState,
      "onr_v1_092_ice-and-datas-guide-to-the-net",
    );
    putCorpIceOnServer(revealState, "hq", "simple_barrier_ice");
    putCorpRootInRemote(revealState, "simple_upgrade");
    putCorpIceOnServer(revealState, "remote_1", "simple_code_gate_ice");
    putCorpIceOnServer(revealState, "remote_1", "simple_sentry_ice");
    const revealAction = mustAction(
      revealState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(revealState, action) ===
          "onr_v1_092_ice-and-datas-guide-to-the-net",
    );
    const revealInitial = structuredClone(revealState);
    const revealReplayStart = revealState.eventLog.length;
    const revealWrongSide = applyAction(revealState, {
      matchId: revealState.matchId,
      side: "corp",
      actionId: revealAction.actionId,
      clientKnownStateVersion: revealState.stateVersion,
      idempotencyKey: "spotcheck-ice-data-wrong-side",
    });
    expect(revealWrongSide.ok).toBe(false);
    if (!revealWrongSide.ok)
      expect(revealWrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const revealStale = applyAction(revealState, {
      matchId: revealState.matchId,
      side: "runner",
      actionId: revealAction.actionId,
      clientKnownStateVersion: revealState.stateVersion - 1,
      idempotencyKey: "spotcheck-ice-data-stale",
    });
    expect(revealStale.ok).toBe(false);
    if (!revealStale.ok) expect(revealStale.error.code).toBe("ERR_STALE_STATE");
    revealState = apply(
      revealState,
      "runner",
      (action) => action.actionId === revealAction.actionId,
    );
    expect(revealState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_expose_outermost_ice_each_data_fort",
      publicRevealKind: "expose",
      revealedCount: 2,
      publicRevealDefinitionIds: "simple_barrier_ice,simple_sentry_ice",
      exposedServerIds: "hq,remote_1",
    });
    expect(
      JSON.stringify(revealState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /simple_code_gate_ice|Simple Code Gate ICE|"stack"|"rd"|"cardInstances"/,
    );
    expect(
      JSON.stringify(getPlayerView(revealState, "runner")),
    ).not.toContain("simple_code_gate_ice");
    const revealReplay = replayEvents(
      revealInitial,
      revealState.eventLog.slice(revealReplayStart),
    );
    expect(revealReplay.ok).toBe(true);
    expect(hashState(revealReplay.state)).toBe(hashState(revealState));

    let noIceState = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ice-data-no-ice"));
    noIceState.runner.credits = 20;
    moveRunnerCardToGrip(
      noIceState,
      "onr_v1_092_ice-and-datas-guide-to-the-net",
    );
    expect(
      getLegalActions(noIceState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(noIceState, action) ===
            "onr_v1_092_ice-and-datas-guide-to-the-net",
      ),
    ).toBe(false);
  });

  it("keeps Private LDL Access and HQ Interface source-bound and hidden-info safe", () => {
    let ldlState = toRunnerTurn(v171CardReleaseGame("spotcheck-private-ldl"));
    ldlState.runner.credits = 20;
    moveRunnerCardToGrip(ldlState, "onr_v1_106_private-ldl-access");
    putCorpCardOnTopOfRd(ldlState, "onr_v1_203_hostile-takeover");
    const hqHiddenCard = moveCorpCardToHq(ldlState, "simple_economy_operation");
    keepOnlyCorpHqCard(ldlState, hqHiddenCard);
    const ldlAction = mustAction(
      ldlState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(ldlState, action) ===
          "onr_v1_106_private-ldl-access" &&
        action.payload?.serverId === "hq",
    );
    const ldlInitial = structuredClone(ldlState);
    const ldlReplayStart = ldlState.eventLog.length;
    ldlState = apply(
      ldlState,
      "runner",
      (action) => action.actionId === ldlAction.actionId,
    );
    expect(ldlState.run).toMatchObject({
      attackedServerId: "hq",
      accessServerOverride: "rd",
    });
    ldlState = apply(ldlState, "runner", (action) => action.type === "access_card");
    expect(ldlState.corp.hq).toContain(hqHiddenCard);
    expect(ldlState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
    });
    expect(
      JSON.stringify(
        ldlState.eventLog.map((event) => event.publicPayload),
      ),
    ).not.toMatch(
      /simple_economy_operation|Simple Economy Operation/,
    );
    const ldlReplay = replayEvents(
      ldlInitial,
      ldlState.eventLog.slice(ldlReplayStart),
    );
    expect(ldlReplay.ok).toBe(true);
    expect(hashState(ldlReplay.state)).toBe(hashState(ldlState));

    let hqState = toRunnerTurn(v171CardReleaseGame("spotcheck-hq-interface"));
    hqState.runner.credits = 20;
    moveRunnerCardToGrip(hqState, "onr_v1_129_hq-interface");
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hqState, action) === "onr_v1_129_hq-interface",
    );
    moveRunnerCardCopyToGrip(hqState, "onr_v1_129_hq-interface");
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hqState, action) === "onr_v1_129_hq-interface",
    );
    const hqCards = [
      moveCorpCardToHq(hqState, "simple_economy_operation"),
      moveCorpCardToHq(hqState, "onr_v1_295_night-shift"),
      moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover"),
    ];
    keepOnlyCorpHqCards(hqState, hqCards);
    const hqInitial = structuredClone(hqState);
    const hqReplayStart = hqState.eventLog.length;
    hqState = apply(
      hqState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(hqState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      serverLabel: "HQ",
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
    });
    expect(
      JSON.stringify(hqState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/simple_economy_operation|onr_v1_295_night-shift|Hostile Takeover/);
    const hqReplay = replayEvents(
      hqInitial,
      hqState.eventLog.slice(hqReplayStart),
    );
    expect(hqReplay.ok).toBe(true);
    expect(hashState(hqReplay.state)).toBe(hashState(hqState));
  });

  it("keeps Restrictive Net Zoning and Polymer Breakthrough source-scoped", () => {
    let zoningState = toRunnerTurn(v181CardReleaseGame("spotcheck-zoning"));
    zoningState.runner.credits = 20;
    moveRunnerCardToGrip(zoningState, "onr_v1_173_restrictive-net-zoning");
    zoningState = apply(
      zoningState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) ===
          "onr_v1_173_restrictive-net-zoning" &&
        action.payload?.selectedServerId === "rd",
    );
    moveRunnerCardCopyToGrip(zoningState, "onr_v1_173_restrictive-net-zoning");
    zoningState = apply(
      zoningState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) ===
          "onr_v1_173_restrictive-net-zoning" &&
        action.payload?.selectedServerId === "rd",
    );
    zoningState = apply(zoningState, "runner", (action) => action.type === "end_turn");
    zoningState = apply(zoningState, "corp", (action) => action.type === "mandatory_draw");
    zoningState.corp.credits = 20;
    zoningState.corp.clicks = 3;
    moveCorpCardToHq(zoningState, "simple_barrier_ice");
    const taxedInstall = mustAction(
      zoningState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) === "simple_barrier_ice" &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(taxedInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 4,
      iceInstallTotalCost: 4,
    });

    let polymerState = toRunnerTurn(v192CardReleaseGame("spotcheck-polymer"));
    polymerState.corp.credits = 5;
    scoreCorpAgendaForTest(polymerState, "onr_v1_211_polymer-breakthrough");
    scoreCorpAgendaForTest(polymerState, "onr_v1_211_polymer-breakthrough");
    const polymerInitial = structuredClone(polymerState);
    const polymerReplayStart = polymerState.eventLog.length;
    polymerState = apply(
      polymerState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(polymerState.corp.credits).toBe(7);
    expect(polymerState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
    });
    const polymerReplay = replayEvents(
      polymerInitial,
      polymerState.eventLog.slice(polymerReplayStart),
    );
    expect(polymerReplay.ok).toBe(true);
    expect(hashState(polymerReplay.state)).toBe(hashState(polymerState));
  });

  it("revalidates Private Cybernet Police and Data Naga focused resolution paths", () => {
    let policeState = apply(
      v193CardReleaseGame("spotcheck-private-cybernet"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    policeState.corp.credits = 20;
    policeState.runner.credits = 0;
    policeState.corp.clicks = 3;
    scoreCorpAgendaForTest(policeState, "onr_v1_213_private-cybernet-police");
    const policeAction = mustAction(
      policeState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(policeState, action) ===
          "onr_v1_213_private-cybernet-police",
    );
    const policeWrongSide = applyAction(policeState, {
      matchId: policeState.matchId,
      side: "runner",
      actionId: policeAction.actionId,
      clientKnownStateVersion: policeState.stateVersion,
      idempotencyKey: "spotcheck-private-cybernet-wrong-side",
    });
    expect(policeWrongSide.ok).toBe(false);
    if (!policeWrongSide.ok)
      expect(policeWrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const policeInitial = structuredClone(policeState);
    const policeReplayStart = policeState.eventLog.length;
    policeState = apply(
      policeState,
      "corp",
      (action) => action.actionId === policeAction.actionId,
    );
    expect(policeState.trace).toMatchObject({ baseTraceStrength: 5 });
    policeState = applyChoice(policeState, "corp", "bid_0");
    policeState = applyChoice(policeState, "runner", "bid_0");
    expect(policeState.runner.tags).toBe(1);
    const policeReplay = replayEvents(
      policeInitial,
      policeState.eventLog.slice(policeReplayStart),
    );
    expect(policeReplay.ok).toBe(true);
    expect(hashState(policeReplay.state)).toBe(hashState(policeState));

    let nagaState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-data-naga",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...ONR_V1_9_2_RUNNER_DECK,
          id: "spotcheck_data_naga_runner",
          cards: [
            ...ONR_V1_9_2_RUNNER_DECK.cards,
            { id: "onr_v1_014_codecracker", quantity: 1 },
          ],
        },
        corpDeck: ONR_V1_9_2_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    nagaState.runner.credits = 20;
    nagaState.corp.credits = 20;
    const dwarfId = installRunnerProgramForTest(nagaState, "onr_v1_021_dwarf");
    const codecrackerId = installRunnerProgramForTest(
      nagaState,
      "onr_v1_014_codecracker",
    );
    putCorpIceOnServer(nagaState, "rd", "onr_v1_235_data-naga");
    nagaState = apply(
      nagaState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    nagaState = apply(
      nagaState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nagaState, action) === "onr_v1_235_data-naga",
    );
    const continueAction = mustAction(
      nagaState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const nagaInitial = structuredClone(nagaState);
    const nagaReplayStart = nagaState.eventLog.length;
    nagaState = apply(
      nagaState,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(nagaState.runner.heap).toContain(dwarfId);
    expect(nagaState.runner.heap).not.toContain(codecrackerId);
    expect(nagaState.run).toBeUndefined();
    expect(nagaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      trashedCardDefinitionId: "onr_v1_021_dwarf",
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(JSON.stringify(nagaState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenLeakPattern,
    );
    const nagaReplay = replayEvents(
      nagaInitial,
      nagaState.eventLog.slice(nagaReplayStart),
    );
    expect(nagaReplay.ok).toBe(true);
    expect(hashState(nagaReplay.state)).toBe(hashState(nagaState));
  });

  it("keeps Vacuum Link and Pacifica Regional AI deterministic and revalidated", () => {
    let rewound = false;
    let notRewound = false;
    for (let attempt = 0; attempt < 260 && (!rewound || !notRewound); attempt += 1) {
      let state = toRunnerTurn(v190CardReleaseGame(`spotcheck-vacuum-${attempt}`));
      state.runner.credits = 40;
      state.corp.credits = 20;
      moveRunnerCardToGrip(
        state,
        "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      expect(bartmossId).toBeDefined();
      putCorpIceOnServer(state, "rd", "onr_v1_275_vacuum-link");
      putCorpIceOnServer(state, "rd", "simple_barrier_ice");
      state = apply(
        state,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "simple_barrier_ice",
      );
      for (let pump = 0; pump < 3; pump += 1) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === bartmossId,
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(state, "runner", (action) => action.type === "continue_run");
      state = apply(state, "runner", (action) => action.type === "continue_run");
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "onr_v1_275_vacuum-link",
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.type === "continue_run");
      if (
        typeof state.eventLog.at(-1)?.publicPayload?.vacuumLinkDieRoll !==
          "number" &&
        getLegalActions(state, "runner").some(
          (action) => action.type === "continue_run",
        )
      ) {
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      const payload = state.eventLog.at(-1)?.publicPayload;
      expect(payload).toMatchObject({
        actionType: "continue_run",
        vacuumLinkDieRoll: expect.any(Number),
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
      if (payload?.vacuumLinkRewindApplied === true) rewound = true;
      if (payload?.vacuumLinkRewindApplied === false) notRewound = true;
    }
    expect(rewound).toBe(true);
    expect(notRewound).toBe(true);

    let pacificaState = apply(
      createGameAfterSetup({
        seed: "spotcheck-pacifica",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    pacificaState.corp.credits = 20;
    pacificaState.corp.clicks = 3;
    const pacificaId = putCorpRootInRemote(
      pacificaState,
      "onr_v1_334_pacifica-regional-ai",
    );
    pacificaState.cardInstances[pacificaId] = {
      ...pacificaState.cardInstances[pacificaId]!,
      faceup: true,
      rezzed: true,
      advancementCounters: 1,
    };
    const pacificaAction = mustAction(
      pacificaState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === pacificaId,
    );
    const zeroCounterState = structuredClone(pacificaState);
    zeroCounterState.cardInstances[pacificaId] = {
      ...zeroCounterState.cardInstances[pacificaId]!,
      advancementCounters: 0,
    };
    const zeroCounter = applyAction(zeroCounterState, {
      matchId: zeroCounterState.matchId,
      side: "corp",
      actionId: pacificaAction.actionId,
      clientKnownStateVersion: zeroCounterState.stateVersion,
      idempotencyKey: "spotcheck-pacifica-zero-counter",
    });
    expect(zeroCounter.ok).toBe(false);
    const pacificaInitial = structuredClone(pacificaState);
    const pacificaReplayStart = pacificaState.eventLog.length;
    const clicksBefore = pacificaState.corp.clicks;
    pacificaState = apply(
      pacificaState,
      "corp",
      (action) => action.actionId === pacificaAction.actionId,
    );
    expect(pacificaState.corp.clicks).toBe(clicksBefore + 1);
    expect(pacificaState.cardInstances[pacificaId]?.advancementCounters).toBe(0);
    expect(pacificaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: "onr_v1_334_pacifica-regional-ai",
      cardImplementationAdvancementCounterCost: 1,
      gainedActions: 1,
      corpClicksAfter: clicksBefore + 1,
    });
    const pacificaReplay = replayEvents(
      pacificaInitial,
      pacificaState.eventLog.slice(pacificaReplayStart),
    );
    expect(pacificaReplay.ok).toBe(true);
    expect(hashState(pacificaReplay.state)).toBe(hashState(pacificaState));
  });
});

describe("Originalset Spotcheck 2026-05-15 Virus/Link/Archives Nachtest", () => {
  it("keeps Cockroach random HQ discard source-bound across multi-copy counters and state drift", () => {
    let state = toRunnerTurn(v191CardReleaseGame("spotcheck-cockroach-multi"));
    state.runner.credits = 20;
    const first = installRunnerProgramForTest(state, "onr_v1_013_cockroach");
    const second = moveRunnerCardCopyToGrip(state, "onr_v1_013_cockroach");
    removeEverywhere(state, second);
    state.runner.rig.programs.push(second);
    state.runner.memoryUsed += 1;
    state.cardInstances[second] = {
      ...state.cardInstances[second]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    const installed = [first, second];
    expect(installed).toHaveLength(2);
    for (const id of installed) {
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        counters: { ...state.cardInstances[id]!.counters, virus: 1 },
      };
    }

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const keepA = moveCorpCardToHq(state, "simple_economy_operation");
    const keepB = moveCorpCardToHq(state, "onr_v1_279_wall-of-static");
    keepOnlyCorpHqCards(state, [keepA, keepB]);
    state.corp.maxHandSize = 1;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const resolve = mustAction(state, "corp", (action) => action.type === "resolve_choice");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-cockroach-wrong-side",
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: [state.pendingChoice?.options[0]?.id ?? ""] },
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-cockroach-stale",
      selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: [state.pendingChoice?.options[0]?.id ?? ""] },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = applyChoice(state, "corp", state.pendingChoice?.options[0]?.id ?? "");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      randomizedByCockroach: true,
      cockroachCounterTotal: 2,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "discard_phase",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(/simple_economy|wall-of-static|privatePayload|cardInstances/);
  });

  it("uses Access through Alpha as the single base-link source for trace bidding", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.programSubtypeHosting("spotcheck-access-alpha-link"));
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_003_baedekers-net-map");
    moveRunnerCardToGrip(state, "onr_v1_148_access-through-alpha");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_003_baedekers-net-map");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_148_access-through-alpha");
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_1");

    expect(state.trace).toMatchObject({ status: "base_link", traceStrength: 5, runnerLink: 0 });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerLink: 0,
      traceStrength: 5,
    });
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(
        state,
        "onr_v1_148_access-through-alpha",
        "trace_base_link_",
      ),
    );
    expect(state.trace).toMatchObject({ status: "runner_bid", runnerLink: 9 });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "base_link",
      runnerLink: 9,
    });
  });

  it("uses migrated base link and trace link values from CardImplementation definitions", () => {
    const specs = [
      ["onr_v1_003_baedekers-net-map", 1, 0, 1],
      ["onr_v1_004_bakdoor", 3, 0, 2],
      ["onr_v1_148_access-through-alpha", 9, 1, undefined],
      ["onr_v1_149_access-to-arasaka", 4, 2, 2],
      ["onr_v1_150_access-to-kiribati", 1, 1, 1],
      ["onr_v1_152_back-door-to-hilliard", 2, 0, 3],
      ["onr_v1_153_back-door-to-orbital-air", 2, 1, 2],
    ] as const;

    expect(DEMO_CARDS_BY_ID["onr_v1_148_access-through-alpha"]).toMatchObject({
      installCost: 9,
    });

    for (const [definitionId, baseLink, baseCost, pumpCost] of specs) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p331-trace-link-${definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            id: `p331_trace_link_runner_${definitionId}`,
            name: `P3.31 Trace Link Runner ${definitionId}`,
            side: "runner",
            identity: "runner_identity_001",
            cards: [
              { id: definitionId, quantity: 1 },
              { id: "simple_economy_event", quantity: 10 },
            ],
          },
          corpDeck: {
            id: `p331_trace_link_corp_${definitionId}`,
            name: `P3.31 Trace Link Corp ${definitionId}`,
            side: "corp",
            identity: "corp_identity_001",
            cards: [
              { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
              { id: "simple_agenda", quantity: 6 },
              { id: "simple_economy_operation", quantity: 6 },
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.corp.credits = 8;
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      putCorpIceOnServer(state, "rd", "onr_v1_243_fetch-4-0-1");
      state = apply(
        state,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "onr_v1_243_fetch-4-0-1",
      );
      state = apply(state, "runner", (action) => action.type === "continue_run");
      state = applyChoice(state, "corp", "bid_0");
      expect(state.trace).toMatchObject({ status: "base_link", runnerLink: 0 });
      const beforeBase = state.runner.credits;
      state = applyChoice(
        state,
        "runner",
        traceChoiceOptionIdForDefinition(state, definitionId, "trace_base_link_"),
      );
      expect(state.runner.credits).toBe(beforeBase - baseCost);
      expect(state.trace).toMatchObject({
        status: "runner_bid",
        runnerLink: baseLink,
        baseLinkValue: baseLink,
      });
      state = applyChoice(state, "runner", "bid_0");
      if (pumpCost !== undefined) {
        expect(state.trace).toMatchObject({ status: "post_bid_link" });
        const beforePump = state.runner.credits;
        state = applyChoice(
          state,
          "runner",
          traceChoiceOptionIdForDefinition(state, definitionId, "trace_link_"),
        );
        expect(state.runner.credits).toBe(beforePump - pumpCost);
        expect(state.trace).toMatchObject({
          status: "post_bid_link",
          runnerLink: baseLink + 1,
          postBidLinkBonus: 1,
        });
        state = applyChoice(state, "runner", "pass");
      }
      expect(state.trace).toBeUndefined();
      expect(validateGameState(state).ok).toBe(true);
    }
  });

  it("rejects a stale second base link card in the same trace attempt", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.programSubtypeHosting("p331-one-base-link-stale"));
    state.runner.credits = 20;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_003_baedekers-net-map");
    moveRunnerCardToGrip(state, "onr_v1_148_access-through-alpha");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_003_baedekers-net-map");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_148_access-through-alpha");
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    const baseChoiceAction = mustAction(state, "runner", (action) => action.type === "resolve_choice");
    const baseChoiceId = state.pendingChoice?.choiceId;
    const baedekerOption = traceChoiceOptionIdForDefinition(
      state,
      "onr_v1_003_baedekers-net-map",
      "trace_base_link_",
    );
    const baedekerSourceId = state.pendingChoice?.options.find(
      (option) => option.id === baedekerOption,
    )?.value;
    if (typeof baedekerSourceId !== "string")
      throw new Error("Missing Baedeker base-link source id");
    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, baedekerSourceId);
    const removedSourceHash = hashState(removedSource);
    const removedSourceResult = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: baseChoiceAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      selectedChoices: {
        choiceId: baseChoiceId,
        selectedOptionIds: [baedekerOption],
      },
      idempotencyKey: "p331-removed-base-link-source",
    });
    expect(removedSourceResult.ok).toBe(false);
    expect(hashState(removedSource)).toBe(removedSourceHash);
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(
        state,
        "onr_v1_148_access-through-alpha",
        "trace_base_link_",
      ),
    );
    const afterBaseHash = hashState(state);
    const afterBaseCredits = state.runner.credits;
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: baseChoiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: baseChoiceId,
        selectedOptionIds: [baedekerOption],
      },
      idempotencyKey: "p331-stale-second-base-link",
    });
    expect(stale.ok).toBe(false);
    expect(state.runner.credits).toBe(afterBaseCredits);
    expect(hashState(state)).toBe(afterBaseHash);
  });

  it("lets Replicator break only trace subroutines and revalidates the current encounter", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags("spotcheck-replicator-trace-break"));
    state.runner.credits = 10;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_056_replicator");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_056_replicator");
    putCorpIceOnServer(state, "rd", "onr_v1_221_asp");
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(state, "corp", (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_221_asp");
    state = apply(state, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(state, action) === "onr_v1_056_replicator");
    state = apply(state, "runner", (action) => action.type === "pump_breaker" && sourceDefinition(state, action) === "onr_v1_056_replicator");

    const breakTrace = mustAction(state, "runner", (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "onr_v1_056_replicator");
    expect(breakTrace.payload).toMatchObject({
      targetIceDefinitionId: "onr_v1_221_asp",
      subroutineIndex: 0,
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakTrace.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-replicator-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    state = apply(state, "runner", (action) => action.actionId === breakTrace.actionId);
    expect(state.run?.brokenSubroutineIndexes).toContain(0);

    let wallState = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-replicator-wall-negative",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: MECHANIC_SMOKE_DECKS.traceTags.runner,
      corpDeck: ONR_V1_0_6K_CORP_DECK,
      agendaPointsToWin: 7,
    }));
    wallState.runner.credits = 10;
    moveRunnerCardToGrip(wallState, "onr_v1_056_replicator");
    wallState = apply(wallState, "runner", (action) => action.type === "install_card" && sourceDefinition(wallState, action) === "onr_v1_056_replicator");
    putCorpIceOnServer(wallState, "rd", "onr_v1_245_fire-wall");
    wallState = apply(wallState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    wallState = apply(wallState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(wallState, action) === "onr_v1_245_fire-wall");
    expect(getLegalActions(wallState, "runner").some((action) => action.type === "break_subroutine" && sourceDefinition(wallState, action) === "onr_v1_056_replicator")).toBe(false);
  });

  it("spends Scatter Shot recurring credits only for accessed upgrade trash costs", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      id: "spotcheck_scatter_runner",
      name: "Spotcheck Scatter Runner",
      cards: [{ id: "onr_v1_057_scatter-shot", quantity: 1 }, ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards],
    };
    let state = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-scatter-shot",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck,
      corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
      agendaPointsToWin: 7,
    }));
    state.runner.credits = 0;
    state.corp.credits = 10;
    moveRunnerCardToGrip(state, "onr_v1_057_scatter-shot");
    state = apply(state, "runner", (action) => action.type === "install_card" && sourceDefinition(state, action) === "onr_v1_057_scatter-shot");
    const scatterId = state.runner.rig.programs.find((id) => state.cardInstances[id]?.definitionId === "onr_v1_057_scatter-shot");
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(2);
    const redHerringsId = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
    state.cardInstances[redHerringsId] = { ...state.cardInstances[redHerringsId]!, faceup: true, rezzed: true };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    state = apply(state, "runner", (action) => action.type === "access_card");
    const trash = mustAction(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(trash.payload).toMatchObject({
      v1922RunnerProgramAbility: "scatter_shot_upgrade_trash_recurring_credit",
      scatterShotRecurringCreditsAvailable: 2,
    });
    state = apply(state, "runner", (action) => action.actionId === trash.actionId);
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(1);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      scatterShotRecurringCreditsSpent: 1,
      runnerCreditsSpent: 0,
    });
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(true);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(2);

    let assetState = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-scatter-asset-negative",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck,
      corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
      agendaPointsToWin: 7,
    }));
    assetState.runner.credits = 0;
    assetState.corp.credits = 10;
    moveRunnerCardToGrip(assetState, "onr_v1_057_scatter-shot");
    assetState = apply(assetState, "runner", (action) => action.type === "install_card" && sourceDefinition(assetState, action) === "onr_v1_057_scatter-shot");
    const assetId = putCorpRootInRemote(assetState, "onr_v1_344_spinn-public-relations");
    assetState.cardInstances[assetId] = { ...assetState.cardInstances[assetId]!, faceup: true, rezzed: true };
    assetState = apply(assetState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    assetState = apply(assetState, "runner", (action) => action.type === "access_card");
    expect(getLegalActions(assetState, "runner").some((action) => action.type === "trash_accessed_card")).toBe(false);
  });

  it("spends Poltergeist recurring credits only for accessed node trash costs", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      id: "spotcheck_poltergeist_runner",
      name: "Spotcheck Poltergeist Runner",
      cards: [
        { id: "onr_v1_048_poltergeist", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
      ],
    };
    let state = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-poltergeist-node-trash",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        cards: [
          { id: "simple_economy_asset", quantity: 1 },
          { id: "simple_upgrade", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
            (card) =>
              !["simple_economy_asset", "simple_upgrade"].includes(card.id),
          ),
        ],
      },
      agendaPointsToWin: 7,
    }));
    state.runner.credits = 1;
    moveRunnerCardToGrip(state, "onr_v1_048_poltergeist");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_048_poltergeist",
    );
    const poltergeistId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_048_poltergeist",
    );
    expect(poltergeistId && cardCounterAmount(state, poltergeistId, "bit")).toBe(2);
    putCorpRootInRemote(state, "simple_economy_asset");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    const trash = mustAction(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(trash.payload).toMatchObject({
      v1922RunnerProgramAbility: "poltergeist_node_trash_recurring_credit",
      poltergeistRecurringCreditsAvailable: 2,
    });
    state = apply(state, "runner", (action) => action.actionId === trash.actionId);
    expect(poltergeistId && cardCounterAmount(state, poltergeistId, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      poltergeistRecurringCreditsSpent: 2,
      runnerCreditsSpent: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let upgradeState = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-poltergeist-upgrade-negative",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        cards: [
          { id: "simple_economy_asset", quantity: 1 },
          { id: "simple_upgrade", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
            (card) =>
              !["simple_economy_asset", "simple_upgrade"].includes(card.id),
          ),
        ],
      },
      agendaPointsToWin: 7,
    }));
    upgradeState.runner.credits = 0;
    moveRunnerCardToGrip(upgradeState, "onr_v1_048_poltergeist");
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(upgradeState, action) === "onr_v1_048_poltergeist",
    );
    putCorpRootInRemote(upgradeState, "simple_upgrade");
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    upgradeState = passRootRezWindowBeforeAccessIfOpen(upgradeState);
    upgradeState = apply(upgradeState, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(upgradeState, "runner").some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(false);
  });

  it("uses PK-6089a recurring credits only for trace link bids and refreshes them", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "spotcheck_pk_runner",
      name: "Spotcheck PK Runner",
      cards: [
        { id: "onr_v1_138_pk-6089a", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
          (card) => card.id !== "onr_v1_138_pk-6089a",
        ),
      ],
    };
    let state = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-pk-trace-link",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.traceTags.corp,
        cards: [
          { id: "onr_v1_246_fragmentation-storm", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
            (card) => card.id !== "onr_v1_246_fragmentation-storm",
          ),
        ],
      },
      agendaPointsToWin: 7,
    }));
    state.runner.credits = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_138_pk-6089a");
    const memoryBefore = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_138_pk-6089a",
    );
    const pkId = state.runner.rig.hardware.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_138_pk-6089a",
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 1,
    );
    expect(pkId && cardCounterAmount(state, pkId, "bit")).toBe(3);
    state.runner.credits = 0;
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", "onr_v1_246_fragmentation-storm");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    expect(state.pendingChoice?.options.some((option) => option.id === "bid_3")).toBe(true);
    state = applyChoice(state, "runner", "bid_3");
    expect(pkId && cardCounterAmount(state, pkId, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceLinkCreditsSpent: 3,
      runnerCreditsSpent: 0,
      traceLinkCreditSourceDefinitionIds: "onr_v1_138_pk-6089a",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let refreshState = structuredClone(initial);
    if (pkId) setCardCounterForTest(refreshState, pkId, "bit", 0);
    refreshState = apply(refreshState, "runner", (action) => action.type === "end_turn");
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(refreshState, "corp", (action) => action.type === "mandatory_draw");
    refreshState = apply(refreshState, "corp", (action) => action.type === "end_turn");
    expect(pkId && cardCounterAmount(refreshState, pkId, "bit")).toBe(3);
  });

  it("loads Holovid Campaign with 12 public bits and self-trashes on the last Corp turn drain", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-holovid-bits");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const holovidId = moveCorpCardToHq(state, "onr_v1_326_holovid-campaign");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === holovidId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_326_holovid-campaign",
    );
    expect(cardCounterAmount(state, holovidId, "bit")).toBe(12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 12,
      remainingCounters: 12,
      sourceDefinitionId: "onr_v1_326_holovid-campaign",
    });

    setCardCounterForTest(state, holovidId, "bit", 1);
    const creditsBeforeDrain = state.corp.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(creditsBeforeDrain + 1);
    expect(state.corp.archives).toContain(holovidId);
    expect(state.cardInstances[holovidId]?.zone).toMatchObject({
      side: "corp",
      zone: "archives",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("loads Braindance Campaign with 12 public bits and drains 2 at Corp turn start", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-braindance-bits");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const braindanceId = moveCorpCardToHq(state, "onr_v1_311_braindance-campaign");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === braindanceId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    const hiddenRunnerRoot = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    )?.root[0];
    expect(hiddenRunnerRoot?.known).toBe(false);
    expect(hiddenRunnerRoot?.counterDisplays).toBeUndefined();
    expect(JSON.stringify(hiddenRunnerRoot)).not.toContain("braindance");

    const creditsBeforeRez = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_311_braindance-campaign",
    );

    expect(state.corp.credits).toBe(creditsBeforeRez - 6);
    expect(cardCounterAmount(state, braindanceId, "bit")).toBe(12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 12,
      remainingCounters: 12,
      sourceDefinitionId: "onr_v1_311_braindance-campaign",
    });
    expect(
      getPlayerView(state, "runner").servers.some((server) =>
        server.root.some(
          (card) =>
            card.definitionId === "onr_v1_311_braindance-campaign" &&
            card.counters?.bit === 12 &&
            card.counterDisplays?.some(
              (counterDisplay) =>
                counterDisplay.id === "stored_credits" &&
                counterDisplay.amount === 12 &&
                counterDisplay.displayKind === "stored_credits",
            ),
        ),
      ),
    ).toBe(true);

    setCardCounterForTest(state, braindanceId, "bit", 2);
    const creditsBeforeDrain = state.corp.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.corp.credits).toBe(creditsBeforeDrain + 2);
    expect(state.corp.archives).toContain(braindanceId);
    expect(state.cardInstances[braindanceId]?.zone).toMatchObject({
      side: "corp",
      zone: "archives",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).toContain(
      '"removedCounterAmount":2',
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).toContain(
      '"amount":2',
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("projects special counter displays without changing legal actions or state hash", () => {
    const requiredRunnerCards = [
      "onr_v1_011_cloak",
      "onr_v1_008_boardwalk",
      "onr_v1_164_hells-run",
      "onr_v1_121_armored-fridge",
    ];
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-counter-display-specials",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.runner,
          cards: [
            ...requiredRunnerCards.map((id) => ({ id, quantity: 1 })),
            ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
              (card) => !requiredRunnerCards.includes(card.id),
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.runAccess.corp,
        agendaPointsToWin: 7,
      }),
    );
    const recurringId = installRunnerProgramForTest(state, "onr_v1_011_cloak");
    const restrictedId = installRunnerResourceForTest(
      state,
      "onr_v1_164_hells-run",
    );
    const virusId = installRunnerProgramForTest(state, "onr_v1_008_boardwalk");
    const fridgeId = installRunnerHardwareForTest(
      state,
      "onr_v1_121_armored-fridge",
    );
    setCardCounterForTest(state, recurringId, "recurring_credit", 2);
    setCardCounterForTest(state, restrictedId, "bit", 1);
    setCardCounterForTest(state, state.runner.identity, "trauma", 2);
    setCardCounterForTest(state, virusId, "virus", 3);
    setCardCounterForTest(state, fridgeId, "ablative", 2);
    setCardCounterForTest(state, state.runner.identity, "data_raven", 1);
    setCardCounterForTest(state, state.runner.identity, "cerberus", 2);
    setCardCounterForTest(state, state.runner.identity, "mastiff", 3);
    setCardCounterForTest(state, state.runner.identity, "crying", 1);
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      rd: 3,
    };
    const legalActionIdsBeforeView = getLegalActions(state, "runner").map(
      (action) => action.actionId,
    );
    const hashBeforeView = hashState(state);

    const runnerView = getPlayerView(state, "runner");
    const recurringCard = runnerView.own.rig?.find(
      (card) => card.instanceId === recurringId,
    );
    const restrictedCard = runnerView.own.rig?.find(
      (card) => card.instanceId === restrictedId,
    );
    const virusCard = runnerView.own.rig?.find(
      (card) => card.instanceId === virusId,
    );
    const fridgeCard = runnerView.own.rig?.find(
      (card) => card.instanceId === fridgeId,
    );
    const corpView = getPlayerView(state, "corp");
    const projectedDisplayIds = [
      recurringCard,
      restrictedCard,
      virusCard,
      fridgeCard,
      runnerView.own.identity,
    ].flatMap((card) => card?.counterDisplays?.map((display) => display.id) ?? []);
    expect(new Set(projectedDisplayIds).size).toBe(projectedDisplayIds.length);

    expect(recurringCard?.counterDisplays?.map((display) => display.id)).toEqual([
      "recurring_credit",
    ]);
    expect(recurringCard?.counterDisplays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "recurring_credit",
          amount: 2,
          displayKind: "recurring_credit",
          usageHint: "refreshing",
          creditPool: expect.objectContaining({
            kind: "recurring_credit",
            capacity: 3,
            refresh: {
              timing: "start_of_runner_turn",
              behavior: "refill_to_capacity_if_used",
            },
          }),
        }),
      ]),
    );
    expect(restrictedCard?.counterDisplays?.map((display) => display.id)).toEqual([
      "restricted_pool",
    ]);
    expect(restrictedCard?.counterDisplays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "restricted_pool",
          amount: 1,
          displayKind: "restricted_pool",
          counterType: "bit",
          label: "Link-Bits",
          creditPool: expect.objectContaining({
            kind: "restricted_credit",
            refresh: {
              timing: "start_of_runner_turn",
              behavior: "refill_to_capacity_if_used",
            },
          }),
        }),
      ]),
    );
    expect(virusCard?.counterDisplays?.map((display) => display.id)).toEqual([
      "virus",
    ]);
    expect(virusCard?.counterDisplays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "virus",
          amount: 3,
          displayKind: "virus",
          counterType: "virus",
        }),
      ]),
    );
    expect(fridgeCard?.counterDisplays?.map((display) => display.id)).toEqual([
      "ablative",
    ]);
    expect(fridgeCard?.counterDisplays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ablative",
          amount: 2,
          displayKind: "damage_prevention",
          counterType: "ablative",
        }),
      ]),
    );
    expect(runnerView.own.identity.counterDisplays?.map((display) => display.id)).toEqual([
      "trauma",
      "data_raven",
      "cerberus",
      "mastiff",
      "crying",
    ]);
    expect(runnerView.own.identity.counterDisplays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "trauma",
          amount: 2,
          displayKind: "damage_prevention",
          counterType: "trauma",
          label: "Trauma-Counter",
        }),
        expect.objectContaining({
          id: "data_raven",
          amount: 1,
          displayKind: "trace",
          counterType: "data_raven",
        }),
        expect.objectContaining({
          id: "cerberus",
          amount: 2,
          displayKind: "trace",
          counterType: "cerberus",
        }),
        expect.objectContaining({
          id: "mastiff",
          amount: 3,
          displayKind: "trace",
          counterType: "mastiff",
        }),
        expect.objectContaining({
          id: "crying",
          amount: 1,
          displayKind: "trace",
          counterType: "crying",
        }),
      ]),
    );
    expect(
      corpView.servers.find((server) => server.id === "rd")?.counterDisplays,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "pox",
          amount: 3,
          displayKind: "virus",
          label: "Pox-Counter",
        }),
      ]),
    );
    expect(hashState(state)).toBe(hashBeforeView);
    expect(getLegalActions(state, "runner").map((action) => action.actionId)).toEqual(
      legalActionIdsBeforeView,
    );
  });

  it("applies P3.7 turn-start economy CardImplementations once from valid sources", () => {
    let corpState = apply(
      createGameAfterSetup({
        seed: "p37-corp-turn-start-economy",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: "onr_v1_335_remote-facility", quantity: 1 },
            { id: "onr_v1_218_subsidiary-branch", quantity: 1 },
            { id: "onr_v1_211_polymer-breakthrough", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "onr_v1_335_remote-facility",
                  "onr_v1_218_subsidiary-branch",
                  "onr_v1_211_polymer-breakthrough",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    corpState.corp.credits = 5;
    const remoteId = putCorpRootInRemote(
      corpState,
      "onr_v1_335_remote-facility",
    );
    corpState.cardInstances[remoteId] = {
      ...corpState.cardInstances[remoteId]!,
      faceup: true,
      rezzed: true,
    };
    const subsidiaryId = scoreCorpAgendaForTest(
      corpState,
      "onr_v1_218_subsidiary-branch",
    );
    const polymerId = scoreCorpAgendaForTest(
      corpState,
      "onr_v1_211_polymer-breakthrough",
    );
    const initial = structuredClone(corpState);
    const replayStart = corpState.eventLog.length;

    corpState = toRunnerTurnFromCorpMain(corpState);
    corpState = apply(corpState, "runner", (action) => action.type === "end_turn");

    expect(corpState.corp.credits).toBe(6);
    expect(corpState.corp.clicks).toBe(5);
    const effects = corpState.eventLog.at(-1)?.publicPayload.resolvedEffects;
    expect(Array.isArray(effects)).toBe(true);
    const resolvedEffects = Array.isArray(effects) ? effects : [];
    expect(resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_actions",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_335_remote-facility",
          sourceTitle: "Remote Facility",
        }),
        expect.objectContaining({
          kind: "gain_actions",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_218_subsidiary-branch",
          sourceTitle: "Subsidiary Branch",
        }),
        expect.objectContaining({
          kind: "gain_credits",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_211_polymer-breakthrough",
          sourceTitle: "Polymer Breakthrough",
        }),
      ]),
    );
    expect(
      resolvedEffects.filter(
        (effect) =>
          effect.sourceDefinitionId === "onr_v1_335_remote-facility" ||
          effect.sourceDefinitionId === "onr_v1_218_subsidiary-branch" ||
          effect.sourceDefinitionId === "onr_v1_211_polymer-breakthrough",
      ),
    ).toHaveLength(3);
    expect(corpState.corp.scoreArea).toEqual(
      expect.arrayContaining([subsidiaryId, polymerId]),
    );
    const replay = replayEvents(initial, corpState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(corpState));

    let invalidSourceState = apply(
      createGameAfterSetup({
        seed: "p37-corp-turn-start-invalid",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: "onr_v1_335_remote-facility", quantity: 1 },
            { id: "onr_v1_218_subsidiary-branch", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "onr_v1_335_remote-facility",
                  "onr_v1_218_subsidiary-branch",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    invalidSourceState.corp.credits = 5;
    putCorpRootInRemote(invalidSourceState, "onr_v1_335_remote-facility");
    invalidSourceState = toRunnerTurnFromCorpMain(invalidSourceState);
    invalidSourceState = apply(
      invalidSourceState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(invalidSourceState.corp.credits).toBe(5);
    expect(invalidSourceState.corp.clicks).toBe(3);
    expect(
      JSON.stringify(invalidSourceState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/Remote Facility|Subsidiary Branch/);
  });

  it("applies P3.7 Runner turn-start and run-start CardImplementations", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p37-runner-turn-start",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          cards: [
            { id: "onr_v1_163_floating-runner-bbs", quantity: 1 },
            { id: "onr_v1_174_rigged-investments", quantity: 1 },
            { id: "onr_v1_184_top-runners-conference", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) =>
                ![
                  "onr_v1_163_floating-runner-bbs",
                  "onr_v1_174_rigged-investments",
                  "onr_v1_184_top-runners-conference",
                ].includes(card.id),
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_163_floating-runner-bbs");
    moveRunnerCardToGrip(state, "onr_v1_174_rigged-investments");
    moveRunnerCardToGrip(state, "onr_v1_184_top-runners-conference");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_163_floating-runner-bbs",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_174_rigged-investments",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_184_top-runners-conference",
    );
    const riggedId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_174_rigged-investments",
    );
    const topRunnersId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_184_top-runners-conference",
    );
    expect(riggedId && cardCounterAmount(state, riggedId, "bit")).toBe(12);
    expect(topRunnersId).toBeDefined();
    if (!riggedId || !topRunnersId) return;

    const creditsBeforeTurn = state.runner.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);

    expect(state.runner.credits).toBe(creditsBeforeTurn + 4);
    expect(cardCounterAmount(state, riggedId, "bit")).toBe(11);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          amount: 1,
          sourceDefinitionId: "onr_v1_163_floating-runner-bbs",
          reason: "start_of_turn",
        }),
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 1,
          sourceDefinitionId: "onr_v1_174_rigged-investments",
          reason: "start_of_turn",
        }),
        expect.objectContaining({
          kind: "gain_credits",
          amount: 2,
          sourceDefinitionId: "onr_v1_184_top-runners-conference",
          reason: "start_of_turn",
        }),
      ]),
    );

    const creditsBeforeNonRun = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "draw_card");
    expect(state.runner.rig.resources).toContain(topRunnersId);
    expect(state.runner.credits).toBe(creditsBeforeNonRun);

    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.runner.rig.resources).not.toContain(topRunnersId);
    expect(state.runner.heap).toContain(topRunnersId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "trash_source",
        reason: "run_start",
        sourceDefinitionId: "onr_v1_184_top-runners-conference",
      }),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Data Darts damage and next-ICE no-break only to the next encounter", () => {
    let state = toRunnerTurn(createGameAfterSetup({
      seed: "spotcheck-data-darts-next-ice",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        cards: [
          { id: "onr_v1_072_wild-card", quantity: 1 },
          { id: "simple_decoder", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
            (card) =>
              !["onr_v1_072_wild-card", "simple_decoder"].includes(card.id),
          ),
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          { id: "onr_v1_234_data-darts", quantity: 1 },
          { id: "simple_code_gate_ice", quantity: 1 },
          { id: "simple_economy_operation", quantity: 3 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (card) =>
              ![
                "onr_v1_234_data-darts",
                "simple_code_gate_ice",
                "simple_economy_operation",
              ].includes(card.id),
          ),
        ],
      },
      agendaPointsToWin: 7,
    }));
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerProgramForTest(state, "onr_v1_072_wild-card");
    installRunnerProgramForTest(state, "simple_decoder");
    const codeGateId = putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
    state.cardInstances[codeGateId] = {
      ...state.cardInstances[codeGateId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "rd", "onr_v1_234_data-darts");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", "onr_v1_234_data-darts");
    const gripBefore = state.runner.grip.length;
    const dataDartsContinue = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(dataDartsContinue.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "card_implementation.onr_v1_234_data-darts.printed_subroutine.1.net_damage,card_implementation.onr_v1_234_data-darts.printed_subroutine.2.prohibit_break_next_ice",
    });
    expect(dataDartsContinue.payload?.encounterWillEndRun).toBe(false);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === dataDartsContinue.actionId,
    );
    expect(state.runner.grip.length).toBe(gripBefore - 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_234_data-darts",
          subroutineIndex: 0,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 3,
        }),
      ],
    });
    expect(state.run?.nextEncounterNoBreakSubroutines).toBe(true);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.noBreakSubroutinesActive).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "break_subroutine",
      ),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("hardens Detroit Police Contract, Off-Site Backups and Urban Renewal revalidation", () => {
    let detroit = apply(MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-detroit-negative"), "corp", (action) => action.type === "mandatory_draw");
    detroit.corp.credits = 5;
    const detroitId = scoreCorpAgendaForTest(detroit, "onr_v1_198_detroit-police-contract");
    setCardCounterForTest(detroit, detroitId, "bit", 1);
    expect(
      getLegalActions(detroit, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.agendaAbility === "v1912_detroit_police_contract",
      ),
    ).toBe(false);
    const detroitCreditsBefore = detroit.corp.credits;
    detroit = toRunnerTurnFromCorpMain(detroit);
    detroit = apply(detroit, "runner", (action) => action.type === "end_turn");
    expect(detroit.corp.credits).toBe(detroitCreditsBefore + 1);
    expect(cardCounterAmount(detroit, detroitId, "bit")).toBe(0);
    expect(detroit.corp.scoreArea).toContain(detroitId);

    const offsiteCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "spotcheck_offsite_empty_corp",
      name: "Spotcheck Offsite Empty Corp",
      cards: [{ id: "onr_v1_296_off-site-backups", quantity: 1 }, ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards],
    };
    let offsite = apply(createGameAfterSetup({
      seed: "spotcheck-offsite-empty",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: offsiteCorpDeck,
      agendaPointsToWin: 7,
    }), "corp", (action) => action.type === "mandatory_draw");
    offsite.corp.credits = 5;
    moveCorpCardToHq(offsite, "onr_v1_296_off-site-backups");
    expect(getLegalActions(offsite, "corp").some((action) => action.type === "play_operation" && sourceDefinition(offsite, action) === "onr_v1_296_off-site-backups")).toBe(false);

    let urban = apply(v106kCardReleaseGame("spotcheck-urban-tag-drift"), "corp", (action) => action.type === "mandatory_draw");
    urban.corp.credits = 10;
    urban.runner.tags = 1;
    moveCorpCardToHq(urban, "onr_v1_307_urban-renewal");
    const urbanAction = mustAction(urban, "corp", (action) => action.type === "play_operation" && sourceDefinition(urban, action) === "onr_v1_307_urban-renewal");
    urban.runner.tags = 0;
    const tagDrift = applyAction(urban, {
      matchId: urban.matchId,
      side: "corp",
      actionId: urbanAction.actionId,
      clientKnownStateVersion: urban.stateVersion,
      idempotencyKey: "spotcheck-urban-tag-drift",
    });
    expect(tagDrift.ok).toBe(false);
    if (!tagDrift.ok) expect(tagDrift.error.code).toBe("ERR_UNKNOWN_ACTION");
  });

  it("keeps Red Herrings steal tax active after Runner trashes it during the same run", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-red-herrings-trash-run"));
    state.runner.credits = 6;
    const redHerringsId = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    state.cardInstances[redHerringsId] = { ...state.cardInstances[redHerringsId]!, faceup: true, rezzed: true };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(state.runner.heap).not.toContain(redHerringsId);
    expect(state.corp.archives).toContain(redHerringsId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      stealCostPersistedForCurrentAccess: true,
      stealCostSourceDefinitionIds: "onr_v1_366_red-herrings",
      stealCostSourceTitles: "Red Herrings",
    });
    state = apply(state, "runner", (action) => action.type === "access_card");
    const steal = mustAction(state, "runner", (action) => action.type === "steal_agenda");
    expect(steal.costs).toEqual([{ credits: 5 }]);
    expect(steal.payload).toMatchObject({
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostPersistedForCurrentAccess: true,
      stealCostSourceDefinitionIds: "onr_v1_366_red-herrings",
    });
    state = apply(state, "runner", (action) => action.actionId === steal.actionId);
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.runner.credits).toBe(0);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state.runner.credits = 10;
    const laterAgendaId = putCorpRootInRemote(state, "simple_agenda");
    expect(laterAgendaId).toBeDefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      mustAction(state, "runner", (action) => action.type === "steal_agenda")
        .costs,
    ).toEqual([]);
  });

  it("loads Vewy Vewy Quiet with two recurring run credits", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-vewy-vewy-quiet",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.programSubtypeHosting.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_071_vewy-vewy-quiet");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_071_vewy-vewy-quiet",
    );
    const vewyId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_071_vewy-vewy-quiet",
    );
    expect(vewyId).toBeDefined();
    if (!vewyId) throw new Error("Missing Vewy Vewy Quiet");
    expect(cardCounterAmount(state, vewyId, "bit")).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hostedCreditsAdded: 2,
      counterType: "bit",
    });
  });

  it("uses Bolter Cluster and Neural Blade next-ICE no-break modifiers without a jack-out lock", () => {
    for (const [definitionId, expectedDamage] of [
      ["onr_v1_224_bolter-cluster", 4],
      ["onr_v1_258_neural-blade", 1],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-${definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.damagePrevention.corp,
            id: `spotcheck_${definitionId}_corp`,
            name: `Spotcheck ${definitionId} Corp`,
            cards: [
              { id: definitionId, quantity: 1 },
              { id: "simple_code_gate_ice", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.damagePrevention.corp.cards.filter(
                (card) => card.id !== definitionId,
              ),
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      state.corp.credits = 30;
      installRunnerProgramForTest(state, "simple_decoder");
      putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
      putCorpIceOnServer(state, "rd", definitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = encounterIce(state, "rd", definitionId);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        damageResolved: true,
        damageType: "net",
        damageAmount: expectedDamage,
      });
      state = apply(state, "runner", (action) => action.type === "continue_run");
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "simple_code_gate_ice",
      );
      const runnerActions = getLegalActions(state, "runner");
      expect(state.run?.noBreakSubroutinesActive).toBe(true);
      expect(state.run?.jackOutLockedUntilEncounterEnds ?? false).toBe(false);
      expect(runnerActions.some((action) => action.type === "break_subroutine")).toBe(false);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("applies Crystal Palace costs and Tesseract appends to next-ICE restriction subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p327-bolter-crystal-tesseract",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...ONR_V1_RUNNER_DECK,
          cards: [
            { id: "onr_v1_072_wild-card", quantity: 1 },
            ...ONR_V1_RUNNER_DECK.cards.filter(
              (card) => card.id !== "onr_v1_072_wild-card",
            ),
          ],
        },
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: "onr_v1_224_bolter-cluster", quantity: 1 },
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) =>
                card.id !== "onr_v1_224_bolter-cluster" &&
                card.id !== "onr_v1_355_crystal-palace-station-grid" &&
                card.id !== "onr_v1_370_tesseract-fort-construction",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 50;
    state.corp.credits = 50;
    const wildCardId = installRunnerProgramForTest(
      state,
      "onr_v1_072_wild-card",
    );
    state.cardInstances[wildCardId] = {
      ...state.cardInstances[wildCardId]!,
      strengthModifier: 10,
    };
    for (const upgradeId of [
      putCorpRootInRemote(state, "onr_v1_355_crystal-palace-station-grid"),
      putCorpRootInRemote(state, "onr_v1_370_tesseract-fort-construction"),
    ]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    putCorpIceOnServer(state, "remote_1", "onr_v1_224_bolter-cluster");
    state = encounterIce(state, "remote_1", "onr_v1_224_bolter-cluster");

    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 3,
      encounterSubroutineIds:
        "card_implementation.onr_v1_224_bolter-cluster.printed_subroutine.1.net_damage,card_implementation.onr_v1_224_bolter-cluster.printed_subroutine.2.prohibit_break_next_ice,card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
    });
    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_072_wild-card",
    );
    expect(breakActions.map((action) => action.payload?.subroutineIndex)).toEqual([
      0,
      1,
      2,
    ]);
    expect(breakActions.map((action) => action.costs)).toEqual([
      [{ credits: 1 }],
      [{ credits: 1 }],
      [{ credits: 1 }],
    ]);
  });

  it("rejects stale break actions once next-ICE no-break becomes active", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p327-stale-no-break",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...ONR_V1_RUNNER_DECK,
          cards: [
            { id: "simple_decoder", quantity: 1 },
            ...ONR_V1_RUNNER_DECK.cards.filter(
              (card) => card.id !== "simple_decoder",
            ),
          ],
        },
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: "simple_code_gate_ice", quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) => card.id !== "simple_code_gate_ice",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    installRunnerProgramForTest(state, "simple_decoder");
    putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
    state = encounterIce(state, "rd", "simple_code_gate_ice");

    const breakAction = mustAction(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    state.run!.noBreakSubroutinesActive = true;
    const creditsBefore = state.runner.credits;
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "p327-stale-no-break",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ERR_UNKNOWN_ACTION");
    expect(state.runner.credits).toBe(creditsBefore);
  });

  it("applies Fang trace success as a pay-to-run lock instead of a tag", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags("spotcheck-fang-run-lock"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_240_fang");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", "onr_v1_240_fang");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace).toMatchObject({
      baseTraceStrength: 4,
      sourceDefinitionId: "onr_v1_240_fang",
    });
    state = applyChoice(state, "corp", "bid_5");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.run).toBeUndefined();
    expect(state.runner.tags).toBe(0);
    expect(state.runnerTurnFlags?.fangRunLockCreditCost).toBe(2);
    expect(getLegalActions(state, "runner").some((action) => action.type === "start_run")).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.fangRunLockCreditCost === 2,
    );
    expect(state.runnerTurnFlags?.fangRunLockCreditCost).toBe(0);
    expect(getLegalActions(state, "runner").some((action) => action.type === "start_run")).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("scales Vacant Soulkiller core damage from advancement counters including zero", () => {
    for (const advancementCounters of [0, 3]) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.agendaScoring(
          `spotcheck-vacant-soulkiller-${advancementCounters}`,
        ),
      );
      state.runner.credits = 20;
      const vacantId = putCorpRootInRemote(state, "onr_v1_346_vacant-soulkiller");
      state.cardInstances[vacantId] = {
        ...state.cardInstances[vacantId]!,
        advancementCounters,
      };
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "remote_1",
      );
      state = passRootRezWindowBeforeAccessIfOpen(state);
      state = apply(state, "runner", (action) => action.type === "access_card");
      expect(state.runner.coreDamage).toBe(advancementCounters);
      const expectedPayload: Record<string, unknown> = {
        hiddenZoneAction: "v1919_access_ambush_damage",
        ambushDefinitionId: "onr_v1_346_vacant-soulkiller",
        advancementCounterCount: advancementCounters,
      };
      if (advancementCounters > 0)
        expectedPayload.damageAmount = advancementCounters;
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject(
        expectedPayload,
      );
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"cardInstances"|"privatePayload"|"hq"|"rd"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("charges Microtech Trode Set for breaks and reduces unbroken AP net damage to one", () => {
    const microtechRunnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "spotcheck_microtech_break_runner",
      name: "Spotcheck Microtech Break Runner",
      cards: [
        { id: "onr_v1_132_microtech-trode-set", quantity: 1 },
        { id: "simple_killer", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
          (card) =>
            card.id !== "onr_v1_132_microtech-trode-set" &&
            card.id !== "simple_killer",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-microtech-trode-set",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: microtechRunnerDeck,
        corpDeck: MECHANIC_SMOKE_DECKS.damagePrevention.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerHardwareForTest(state, "onr_v1_132_microtech-trode-set");
    const killerId = installRunnerProgramForTest(state, "simple_killer");
    state.cardInstances[killerId] = {
      ...state.cardInstances[killerId]!,
      strengthModifier: 10,
    };
    putCorpIceOnServer(state, "rd", "onr_v1_224_bolter-cluster");
    state = encounterIce(state, "rd", "onr_v1_224_bolter-cluster");
    const breakAction = mustAction(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    expect(breakAction.costs).toEqual([{ credits: 2 }]);
    expect(breakAction.payload).toMatchObject({
      breakSubroutineAdditionalCost: 1,
      runnerHardwareAbility: "microtech_trode_set_break_cost_modifier",
    });

    let damageState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-microtech-ap-reduction",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.traceTags.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.damagePrevention.corp,
        agendaPointsToWin: 7,
      }),
    );
    damageState.runner.credits = 30;
    damageState.corp.credits = 30;
    installRunnerHardwareForTest(damageState, "onr_v1_132_microtech-trode-set");
    putCorpIceOnServer(damageState, "rd", "onr_v1_224_bolter-cluster");
    damageState = encounterIce(damageState, "rd", "onr_v1_224_bolter-cluster");
    damageState = apply(damageState, "runner", (action) => action.type === "continue_run");
    expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerHardwareAbility: "microtech_trode_set_ap_net_damage_reduction",
      printedDamageAmount: 4,
      damageAmount: 1,
    });
  });

  it("hardens Corporate Ally for deterministic multi-agenda forfeit and payload redaction", () => {
    let state = toRunnerTurn(v180CardReleaseGame("spotcheck-corporate-ally-hardening"));
    state.runner.credits = 30;
    state.runner.clicks = 10;
    const firstAgendaId = scoreRunnerAgendaForTest(
      state,
      "onr_v1_203_hostile-takeover",
    );
    const secondAgendaId = scoreRunnerAgendaForTest(
      state,
      "onr_v1_203_hostile-takeover",
    );
    state.runner.scoreArea = [secondAgendaId, firstAgendaId];
    const expectedForfeitId = [firstAgendaId, secondAgendaId].sort()[0];
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      "onr_v1_156_corporate-ally",
    );
    const install = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    expect(install.payload).toMatchObject({
      installAgendaPointCost: 1,
      forfeitAgendaCardId: expectedForfeitId,
      installCostReason: "card_implementation_agenda_point_cost",
    });
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === install.actionId);
    expect(state.runner.scoreArea).not.toContain(expectedForfeitId);
    expect(state.runner.scoreArea).toContain(
      expectedForfeitId === firstAgendaId ? secondAgendaId : firstAgendaId,
    );
    expect(state.specialZones?.removedFromGame).toContain(expectedForfeitId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "onr_v1_156_corporate-ally",
      agendaPointCostPaid: 1,
      forfeitedAgendaCardId: expectedForfeitId,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noAgendaState = toRunnerTurn(
      v180CardReleaseGame("spotcheck-corporate-ally-no-agenda"),
    );
    noAgendaState.runner.credits = 30;
    moveRunnerCardToGrip(noAgendaState, "onr_v1_156_corporate-ally");
    expect(
      getLegalActions(noAgendaState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(noAgendaState, action) === "onr_v1_156_corporate-ally",
      ),
    ).toBe(false);
  });

  it("hardens Smith's Pawnshop pass, stale/wrong-side and removed-target choices", () => {
    let state = toRunnerTurn(v170CardReleaseGame("spotcheck-smiths-hardening"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(state, "onr_v1_028_force-shield");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_180_smiths-pawnshop",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_028_force-shield",
    );
    const shieldId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_028_force-shield",
    );
    expect(shieldId).toBeDefined();
    if (!shieldId) throw new Error("Missing Force Shield");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    expect(state.pendingChoice?.source.startsWith("v170.smiths_pawnshop")).toBe(
      true,
    );
    const resolveAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["pass"],
      },
      idempotencyKey: "spotcheck-smiths-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["pass"],
      },
      idempotencyKey: "spotcheck-smiths-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const passInitial = structuredClone(state);
    const passReplayStart = state.eventLog.length;
    const passState = applyChoice(state, "runner", "pass");
    expect(passState.runner.heap).not.toContain(shieldId);
    expect(passState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
    });
    expect(passState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "trashedCardId",
    );
    const passReplay = replayEvents(
      passInitial,
      passState.eventLog.slice(passReplayStart),
    );
    expect(passReplay.ok).toBe(true);
    expect(hashState(passReplay.state)).toBe(hashState(passState));

    const removedTargetState = structuredClone(state);
    const shieldOptionId =
      removedTargetState.pendingChoice?.options.find(
        (option) => option.value === shieldId,
      )?.id ?? "";
    expect(shieldOptionId).not.toBe("");
    removeEverywhere(removedTargetState, shieldId);
    removedTargetState.runner.heap.push(shieldId);
    removedTargetState.cardInstances[shieldId] = {
      ...removedTargetState.cardInstances[shieldId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
    const removedTargetResult = applyAction(removedTargetState, {
      matchId: removedTargetState.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: removedTargetState.stateVersion,
      selectedChoices: {
        choiceId: removedTargetState.pendingChoice?.choiceId,
        selectedOptionIds: [shieldOptionId],
      },
      idempotencyKey: "spotcheck-smiths-removed-target",
    });
    expect(removedTargetResult.ok).toBe(false);
    if (!removedTargetResult.ok)
      expect(removedTargetResult.error.code).toBe("ERR_INVALID_TARGET");
  });

  it("hardens Jack Attack jack-out lock, trace payload and run-end cleanup", () => {
    let state = toRunnerTurn(v193CardReleaseGame("spotcheck-jack-attack-hardening"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "onr_v1_251_jack-attack");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", "onr_v1_251_jack-attack");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.jackOutLockedForRun).toBe(true);
    expect(state.trace).toMatchObject({
      baseTraceStrength: 5,
      sourceDefinitionId: "onr_v1_251_jack-attack",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: "onr_v1_251_jack-attack",
    });
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceSuccessful: true,
      tagsAdded: 1,
      baseTraceStrength: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "runner").some((action) => action.type === "jack_out"),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run).toBeUndefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves Singapore City Grid as a hidden-info-safe once-per-run HQ ICE swap", () => {
    const singaporeCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
      id: "spotcheck_singapore_city_grid_corp",
      name: "Spotcheck Singapore City Grid Corp",
      cards: [
        { id: "onr_v1_369_singapore-city-grid", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
          (card) =>
            card.id !== "onr_v1_369_singapore-city-grid" &&
            card.id !== "simple_barrier_ice" &&
            card.id !== "simple_code_gate_ice",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-singapore-city-grid",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: singaporeCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const singaporeId = putCorpRootInRemote(
      state,
      "onr_v1_369_singapore-city-grid",
    );
    state.cardInstances[singaporeId] = {
      ...state.cardInstances[singaporeId]!,
      faceup: true,
      rezzed: true,
    };
    const installedIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const hqIceId = moveCorpCardToHq(state, "simple_code_gate_ice");
    keepOnlyCorpHqCards(state, [hqIceId]);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const swapAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1918UpgradeAbility ===
          "singapore_city_grid_hq_ice_swap",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: swapAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-singapore-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    state = apply(
      state,
      "corp",
      (action) => action.actionId === swapAction.actionId,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 1,
      maxSelections: 1,
    });
    const runnerViewDuringChoice = getPlayerView(state, "runner");
    expect(runnerViewDuringChoice.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerViewDuringChoice)).not.toContain(
      "simple_code_gate_ice",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1918_singapore_city_grid_choice",
      choiceVisibility: "hidden_info_barrier",
      serverLabel: "Remote 1",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_code_gate_ice|"hq"|"cardInstances"|"privatePayload"/,
    );

    const resolveAction = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${hqIceId}`],
      },
      idempotencyKey: "spotcheck-singapore-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = applyChoice(state, "corp", `card_${hqIceId}`);
    const remote = state.corp.servers.find((server) => server.id === "remote_1");
    expect(remote?.ice[0]).toBe(hqIceId);
    expect(state.corp.hq).toContain(installedIceId);
    expect(state.corp.hq).not.toContain(hqIceId);
    expect(state.cardInstances[hqIceId]).toMatchObject({
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
    });
    expect(state.cardInstances[installedIceId]).toMatchObject({
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "hq" },
    });
    const runnerServer = getPlayerView(state, "runner").servers.find(
      (server) => server.id === "remote_1",
    );
    expect(runnerServer?.ice[0]?.known).toBe(false);
    expect(JSON.stringify(runnerServer)).not.toContain("simple_code_gate_ice");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1918_singapore_city_grid_swap",
      sourceDefinitionId: "onr_v1_369_singapore-city-grid",
      serverLabel: "Remote 1",
      iceIndex: 0,
      swappedIceCount: 1,
      oncePerRunConsumed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_code_gate_ice|simple_barrier_ice|"hq"|"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.v1918UpgradeAbility ===
          "singapore_city_grid_hq_ice_swap",
      ),
    ).toBe(false);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves Omni Kismet as a CardImplementation fort ICE swap without legacy tag-credit actions", () => {
    const omniCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
      id: "spotcheck_omni_kismet_swap_corp",
      name: "Spotcheck Omni Kismet Corp",
      cards: [
        { id: "onr_v1_364_omni-kismet-ph-d", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
          (card) =>
            card.id !== "onr_v1_364_omni-kismet-ph-d" &&
            card.id !== "simple_barrier_ice" &&
            card.id !== "simple_code_gate_ice",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-omni-kismet-swap",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: omniCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.tags = 1;
    state.corp.credits = 20;
    const omniId = putCorpRootInRemote(state, "onr_v1_364_omni-kismet-ph-d");
    state.cardInstances[omniId] = {
      ...state.cardInstances[omniId]!,
      faceup: true,
      rezzed: true,
    };
    const installedIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const hqIceId = moveCorpCardToHq(state, "simple_code_gate_ice");
    keepOnlyCorpHqCards(state, [hqIceId]);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.v1918UpgradeAbility === "tag_condition_credit",
      ),
    ).toBe(false);
    const swapAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1918UpgradeAbility ===
          "singapore_city_grid_hq_ice_swap" &&
        action.payload?.cardId === omniId,
    );
    state = apply(state, "corp", (action) => action.actionId === swapAction.actionId);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "simple_code_gate_ice",
    );

    state = applyChoice(state, "corp", `card_${hqIceId}`);
    const remote = state.corp.servers.find((server) => server.id === "remote_1");
    expect(remote?.ice[0]).toBe(hqIceId);
    expect(state.corp.hq).toContain(installedIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1918_singapore_city_grid_swap",
      sourceDefinitionId: "onr_v1_364_omni-kismet-ph-d",
      swappedIceCount: 1,
      oncePerRunConsumed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_code_gate_ice|simple_barrier_ice|"hq"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Originalset spotcheck: reorder, counters and run-lock hardening", () => {
  it("keeps Too Many Doors private, rejects invalid choices and no-ops short R&D", () => {
    let state = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-too-many-doors"),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerProgramForTest(state, "onr_v1_023_evil-twin");
    putCorpIceOnServer(state, "rd", "onr_v1_272_too-many-doors");

    state = encounterIce(state, "rd", "onr_v1_272_too-many-doors");
    const opened = apply(state, "runner", (action) => action.type === "continue_run");
    expect(opened.pendingChoice?.source).toContain(
      "p3_56.too_many_doors_secret_spend",
    );
    expect(getPlayerView(opened, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(opened, "runner"))).not.toContain(
      "secretSpendCorp",
    );
    expect(JSON.stringify(opened.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Hostile Takeover",
    );

    const runnerResolve = applyAction(opened, {
      matchId: opened.matchId,
      side: "runner",
      actionId: mustAction(opened, "corp", (action) => action.type === "resolve_choice")
        .actionId,
      clientKnownStateVersion: opened.stateVersion,
      selectedChoices: {
        choiceId: opened.pendingChoice?.choiceId,
        selectedOptionIds: ["bid_1"],
      },
    });
    expect(runnerResolve.ok).toBe(false);
    if (!runnerResolve.ok)
      expect(["ERR_UNKNOWN_ACTION", "ERR_WRONG_SIDE"]).toContain(
        runnerResolve.error.code,
      );

    const initial = structuredClone(opened);
    const replayStart = opened.eventLog.length;
    state = applyChoice(opened, "corp", "bid_2");
    expect(state.pendingChoice?.side).toBe("runner");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "secretSpendCorp",
    );
    const corpCreditsBeforeReveal = state.corp.credits;
    const runnerCreditsBeforeReveal = state.runner.credits;
    state = applyChoice(state, "runner", "bid_0");
    expect(state.corp.credits).toBe(corpCreditsBeforeReveal - 2);
    expect(state.runner.credits).toBe(runnerCreditsBeforeReveal);
    expect(state.run).toBeDefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      secretSpendRevealed: true,
      secretSpendCorp: 2,
      secretSpendRunner: 0,
      tooManyDoorsEndRun: false,
      corpCreditsAfter: corpCreditsBeforeReveal - 2,
      runnerCreditsAfter: runnerCreditsBeforeReveal,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let brokenState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-too-many-doors-broken"),
    );
    brokenState.runner.credits = 30;
    brokenState.corp.credits = 30;
    installRunnerProgramForTest(brokenState, "onr_v1_023_evil-twin");
    putCorpIceOnServer(brokenState, "rd", "onr_v1_272_too-many-doors");
    const rdBeforeBroken = brokenState.corp.rd.slice();
    brokenState = encounterIce(brokenState, "rd", "onr_v1_272_too-many-doors");
    brokenState = breakCurrentSubroutine(
      brokenState,
      "onr_v1_023_evil-twin",
      0,
    );
    brokenState = apply(
      brokenState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(brokenState.pendingChoice).toBeUndefined();
    expect(brokenState.corp.rd).toEqual(rdBeforeBroken);

    let losingBidState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-too-many-doors-losing-bid"),
    );
    losingBidState.runner.credits = 30;
    losingBidState.corp.credits = 30;
    installRunnerProgramForTest(losingBidState, "onr_v1_023_evil-twin");
    putCorpIceOnServer(losingBidState, "rd", "onr_v1_272_too-many-doors");
    losingBidState = encounterIce(
      losingBidState,
      "rd",
      "onr_v1_272_too-many-doors",
    );
    losingBidState = apply(
      losingBidState,
      "runner",
      (action) => action.type === "continue_run",
    );
    losingBidState = applyChoice(losingBidState, "corp", "bid_0");
    const losingCorpCreditsBeforeReveal = losingBidState.corp.credits;
    const losingRunnerCreditsBeforeReveal = losingBidState.runner.credits;
    losingBidState = applyChoice(losingBidState, "runner", "bid_1");
    expect(losingBidState.corp.credits).toBe(losingCorpCreditsBeforeReveal);
    expect(losingBidState.runner.credits).toBe(
      losingRunnerCreditsBeforeReveal - 1,
    );
    expect(losingBidState.run).toBeUndefined();
    expect(losingBidState.eventLog.at(-1)?.publicPayload).toMatchObject({
      secretSpendCorp: 0,
      secretSpendRunner: 1,
      tooManyDoorsEndRun: true,
      corpCreditsAfter: losingCorpCreditsBeforeReveal,
      runnerCreditsAfter: losingRunnerCreditsBeforeReveal - 1,
    });
  });

  it("reveals only I Spy's top stack card and keeps source and empty-stack gates closed", () => {
    let state = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-i-spy"),
    );
    state.runner.credits = 20;
    const iSpyId = moveRunnerCardToGrip(state, "onr_v1_032_i-spy");
    const hiddenBelowId = putRunnerCardOnTopOfStack(state, "simple_fracter");
    const topId = putRunnerCardOnTopOfStack(state, "simple_decoder");

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.v1912CounterAbility === "reveal_stack_top",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && String(action.payload?.cardId) === iSpyId,
    );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1912CounterAbility === "reveal_stack_top",
    );
    expect(state.runner.stack.slice(0, 2)).toEqual([topId, hiddenBelowId]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_decoder",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_fracter",
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(hiddenBelowId);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    for (const cardId of state.runner.stack.slice()) {
      removeEverywhere(state, cardId);
      state.runner.heap.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "runner", zone: "heap" },
        faceup: true,
      };
    }
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.v1912CounterAbility === "reveal_stack_top",
      ),
    ).toBe(false);
  });

  it("bounds Fatal Attractor and Shock.r next-encounter flags to one run", () => {
    let fatalState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-fatal-attractor"),
    );
    fatalState.runner.credits = 30;
    fatalState.corp.credits = 30;
    installRunnerProgramForTest(fatalState, "onr_v1_023_evil-twin");
    putCorpIceOnServer(fatalState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(fatalState, "rd", "onr_v1_242_fatal-attractor");
    fatalState = encounterIce(fatalState, "rd", "onr_v1_242_fatal-attractor");
    fatalState = breakCurrentSubroutine(fatalState, "onr_v1_023_evil-twin", 0);
    fatalState = apply(fatalState, "runner", (action) => action.type === "continue_run");
    expect(fatalState.run?.nextEncounterFatalDamage ?? 0).toBe(0);

    let clearedState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-fatal-run-end"),
    );
    clearedState.runner.credits = 30;
    clearedState.corp.credits = 30;
    putCorpIceOnServer(clearedState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(clearedState, "rd", "onr_v1_242_fatal-attractor");
    clearedState = encounterIce(clearedState, "rd", "onr_v1_242_fatal-attractor");
    clearedState = apply(clearedState, "runner", (action) => action.type === "continue_run");
    expect(clearedState.run?.nextEncounterFatalDamage).toBe(3);
    clearedState = apply(clearedState, "runner", (action) => action.type === "jack_out");
    expect(clearedState.run).toBeUndefined();

    let shockState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-shock-r"),
    );
    shockState.runner.credits = 30;
    shockState.corp.credits = 30;
    installRunnerProgramForTest(shockState, "onr_v1_014_codecracker");
    putCorpIceOnServer(shockState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(shockState, "rd", "onr_v1_268_shock-r");
    shockState = encounterIce(shockState, "rd", "onr_v1_268_shock-r");
    shockState = apply(shockState, "runner", (action) => action.type === "continue_run");
    expect(shockState.run?.nextEncounterJackOutLock).toBe(true);
    expect(
      getLegalActions(shockState, "runner").some(
        (action) => action.type === "jack_out",
      ),
    ).toBe(false);
    shockState = apply(shockState, "runner", (action) => action.type === "continue_run");
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === "simple_code_gate_ice",
    );
    expect(shockState.run?.noBreakSubroutinesActive).toBe(true);
    expect(
      getLegalActions(shockState, "runner").some(
        (action) => action.type === "break_subroutine",
      ),
    ).toBe(false);
    shockState = apply(shockState, "runner", (action) => action.type === "continue_run");
    expect(shockState.run?.noBreakSubroutinesActive ?? false).toBe(false);
    expect(shockState.run?.jackOutLockedUntilEncounterEnds ?? false).toBe(false);
  });

  it("keeps D'Arc Knight, Razor Wire and Liche subroutines independently breakable and redacted", () => {
    let dArcState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-darc-knight"),
    );
    dArcState.runner.credits = 50;
    dArcState.corp.credits = 50;
    const dArcTargetId = installRunnerProgramForTest(dArcState, "simple_decoder");
    installRunnerProgramForTest(dArcState, "onr_v1_023_evil-twin");
    putCorpIceOnServer(dArcState, "rd", "onr_v1_233_d-arc-knight");
    dArcState = encounterIce(dArcState, "rd", "onr_v1_233_d-arc-knight");
    dArcState = breakCurrentSubroutine(dArcState, "onr_v1_023_evil-twin", 0);
    dArcState = apply(dArcState, "runner", (action) => action.type === "continue_run");
    expect(dArcState.runner.heap).not.toContain(dArcTargetId);
    expect(dArcState.run).toBeUndefined();

    let razorState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-razor-wire"),
    );
    razorState.runner.credits = 50;
    razorState.corp.credits = 50;
    installRunnerProgramForTest(razorState, "onr_v1_021_dwarf");
    putCorpIceOnServer(razorState, "rd", "onr_v1_262_razor-wire");
    razorState = encounterIce(razorState, "rd", "onr_v1_262_razor-wire");
    const gripBeforeRazor = razorState.runner.grip.length;
    razorState = breakCurrentSubroutine(razorState, "onr_v1_021_dwarf", 1);
    const initial = structuredClone(razorState);
    const replayStart = razorState.eventLog.length;
    razorState = apply(razorState, "runner", (action) => action.type === "continue_run");
    expect(razorState.runner.grip.length).toBe(gripBeforeRazor - 2);
    expect(razorState.run).toBeDefined();
    expect(razorState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
    });
    expect(JSON.stringify(razorState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"privatePayload"|"cardInstances"/,
    );
    const replay = replayEvents(initial, razorState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(razorState));

    let licheState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-liche"),
    );
    licheState.runner.credits = 50;
    licheState.corp.credits = 50;
    installRunnerProgramForTest(licheState, "onr_v1_006_black-dahlia");
    putCorpIceOnServer(licheState, "rd", "onr_v1_254_liche");
    licheState = encounterIce(licheState, "rd", "onr_v1_254_liche");
    licheState = breakCurrentSubroutine(licheState, "onr_v1_006_black-dahlia", 1);
    licheState = breakCurrentSubroutine(licheState, "onr_v1_006_black-dahlia", 3);
    const coreBefore = licheState.runner.coreDamage;
    licheState = apply(licheState, "runner", (action) => action.type === "continue_run");
    expect(licheState.runner.coreDamage).toBe(coreBefore + 2);
    expect(licheState.run).toBeDefined();
    expect(licheState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "core",
      damageAmount: 2,
    });
  });

  it("applies Mastiff counters and run-duration ICE-strength from CardImplementation subroutines", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-mastiff-counter-strength"),
    );
    drawRunnerCardsForTest(state, 6);
    putCorpIceOnServer(state, "rd", "onr_v1_227_cerberus");
    putCorpIceOnServer(state, "rd", "onr_v1_255_mastiff");
    state.corp.credits = 20;
    state.runner.credits = 0;
    const gripBefore = state.runner.grip.length;

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
        sourceDefinition(state, action) === "onr_v1_255_mastiff",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.grip.length).toBe(gripBefore - 2);
    expect(state.run?.futureEncounterIceStrengthBonus).toBe(1);
    expect(state.trace).toMatchObject({
      sourceDefinitionId: "onr_v1_255_mastiff",
      baseTraceStrength: 5,
      successEffect: {
        type: "add_counter",
        counterType: "mastiff",
        amount: 1,
      },
    });

    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");
    expect(cardCounterAmount(state, state.runner.identity, "mastiff")).toBe(1);

    state.runner.clicks = 1;
    state.runner.credits = 4;
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.activeSide = "runner";
    state = apply(
      state,
      "runner",
      (action) =>
        action.payload?.runnerAbility === "remove_runner_trace_counter" &&
        action.payload?.counterType === "mastiff",
    );
    expect(cardCounterAmount(state, state.runner.identity, "mastiff")).toBe(0);
  });

  it("resolves CardImplementation printed Net-damage ICE subroutines without shared duplication", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p325-laser-wire-printed",
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: "onr_v1_253_laser-wire", quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) => card.id !== "onr_v1_253_laser-wire",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    putCorpIceOnServer(state, "rd", "onr_v1_253_laser-wire");
    state = encounterIce(state, "rd", "onr_v1_253_laser-wire");
    const gripBefore = state.runner.grip.length;
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "card_implementation.onr_v1_253_laser-wire.printed_subroutine.1.net_damage,card_implementation.onr_v1_253_laser-wire.printed_subroutine.2.end_the_run",
      encounterWillEndRun: true,
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runner.grip.length).toBe(gripBefore - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: "onr_v1_253_laser-wire",
      damageResolved: true,
      damageType: "net",
      damageAmount: 1,
      resolvedEffects: [
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_253_laser-wire",
          sourceTitle: "Laser Wire",
          subroutineIndex: 0,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 1,
          cardsTrashed: 1,
        },
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_253_laser-wire",
          sourceTitle: "Laser Wire",
          subroutineIndex: 1,
          subroutineType: "end_the_run",
          endedRun: true,
        },
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"privatePayload"|"cardInstances"/,
    );
  });

  it("keeps Chicago Branch, Vapor Ops and Corporate Retreat source-bound", () => {
    let state = apply(
      originalsetReorderCounterRunlockGame("spotcheck-assets-agenda"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const chicagoId = putCorpRootInRemote(state, "onr_v1_312_chicago-branch");
    const vaporId = putCorpRootInRemote(state, "onr_v1_347_vapor-ops");
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    expect(state.cardInstances[chicagoId]?.rezzed).toBe(false);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === chicagoId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        String(action.payload?.cardId) === chicagoId,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === chicagoId,
    );
    const chicagoOption = state.pendingChoice?.options.find(
      (option) => option.value === `${agendaId}:2`,
    );
    expect(chicagoOption).toBeDefined();
    state = applyChoices(state, "corp", [chicagoOption?.id ?? ""]);
    expect(state.cardInstances[agendaId]?.advancementCounters).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_312_chicago-branch",
      addedAdvancementCounters: 2,
      targetCardDefinitionId: "simple_agenda",
    });

    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 1,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && String(action.payload?.cardId) === vaporId,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === vaporId &&
        action.payload?.cardImplementationAbilityLabel ===
          "Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben",
    );
    expect(state.cardInstances[vaporId]?.advancementCounters).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_347_vapor-ops",
      gainedCredits: 1,
    });

    const retreatId = scoreCorpAgendaForTest(state, "onr_v1_195_corporate-retreat");
    setCardCounterForTest(state, retreatId, "mark", 1);
    const retreatAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "v1922_corporate_retreat",
    );
    const stolenState = structuredClone(state);
    stolenState.corp.scoreArea = stolenState.corp.scoreArea.filter(
      (cardId) => cardId !== retreatId,
    );
    stolenState.runner.scoreArea.push(retreatId);
    stolenState.cardInstances[retreatId] = {
      ...stolenState.cardInstances[retreatId]!,
      zone: { side: "runner", zone: "scoreArea" },
    };
    const stolenResult = applyAction(stolenState, {
      matchId: stolenState.matchId,
      side: "corp",
      actionId: retreatAction.actionId,
      clientKnownStateVersion: stolenState.stateVersion,
    });
    expect(stolenResult.ok).toBe(false);
  });

  it("labels Vapor Ops advancement move choices with counter amount and target", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-vapor-ops-move-labels"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const vaporId = putCorpRootInRemote(state, "onr_v1_347_vapor-ops");
    const simpleAgendaId = putCorpRootInRemote(state, "simple_agenda");
    const geneticsVisionaryId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 3,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && String(action.payload?.cardId) === vaporId,
    );

    const moveAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === vaporId &&
        action.payload?.cardImplementationAbilityLabel ===
          "Vapor Ops: Advancement-Counter bewegen",
    );
    expect(moveAction.label).toBe("Vapor Ops: Advancement-Counter bewegen");

    state = apply(
      state,
      "corp",
      (action) => action.actionId === moveAction.actionId,
    );

    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(corpChoice?.prompt).toBe(
      "Vapor Ops: Advancement-Counter bewegen",
    );
    expect(runnerChoice).toBeUndefined();
    const labels = corpChoice?.options.map((option) => option.label) ?? [];
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(
      expect.arrayContaining([
        "1 Advancement-Counter von Vapor Ops auf Simple Agenda bewegen",
        "3 Advancement-Counter von Vapor Ops auf Simple Agenda bewegen",
        "1 Advancement-Counter von Vapor Ops auf Genetics-Visionary Acquisition bewegen",
        "3 Advancement-Counter von Vapor Ops auf Genetics-Visionary Acquisition bewegen",
      ]),
    );
    expect(
      state.pendingChoice?.options.find(
        (option) => option.value === `${vaporId}|${geneticsVisionaryId}|3`,
      )?.label,
    ).toBe(
      "3 Advancement-Counter von Vapor Ops auf Genetics-Visionary Acquisition bewegen",
    );

    state = applyChoices(state, "corp", [
      state.pendingChoice?.options.find(
        (option) => option.value === `${vaporId}|${geneticsVisionaryId}|3`,
      )?.id ?? "",
    ]);
    expect(state.cardInstances[vaporId]?.advancementCounters).toBe(0);
    expect(state.cardInstances[simpleAgendaId]?.advancementCounters).toBe(0);
    expect(
      state.cardInstances[geneticsVisionaryId]?.advancementCounters,
    ).toBe(3);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /Simple Agenda|Genetics-Visionary Acquisition|privatePayload|cardInstances/,
    );
  });
});
