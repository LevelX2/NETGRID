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
import { visibleRunnerTraceSupportQuote } from "../../game/view/visible-runner-trace-support-quote";
import { trodeSetIgnoresSubroutine } from "../../game/run/trode-set";
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
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("Originalset Spotcheck 2026-05-15 Ambush/Hidden/Trace Nachtest", () => {
  it("keeps unrezzed Virus Test Site at one damage, scales when rezzed, reveals R&D and skips Archives", () => {
    let remoteState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-virus-test-site-remote"),
    );
    remoteState.runner.credits = 10;
    drawRunnerCardsForTest(remoteState, 4);
    const advancementNetDamageAssetId = putCorpRootInRemote(
      remoteState,
      560,
    );
    remoteState.cardInstances[advancementNetDamageAssetId] = {
      ...remoteState.cardInstances[advancementNetDamageAssetId]!,
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

    expect(remoteState.runner.grip.length).toBe(gripBefore - 1);
    expect(remoteState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: 560,
      damageAmount: 1,
    });
    const replay = replayEvents(
      initial,
      remoteState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(remoteState));

    let rezzedRemoteState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring(
        "spotcheck-virus-test-site-rezzed-remote",
      ),
    );
    rezzedRemoteState.runner.credits = 10;
    drawRunnerCardsForTest(rezzedRemoteState, 4);
    const rezzedVirusTestSiteId = putCorpRootInRemote(
      rezzedRemoteState,
      560,
    );
    rezzedRemoteState.cardInstances[rezzedVirusTestSiteId] = {
      ...rezzedRemoteState.cardInstances[rezzedVirusTestSiteId]!,
      advancementCounters: 3,
    };
    const rezzedGripBefore = rezzedRemoteState.runner.grip.length;
    rezzedRemoteState = apply(
      rezzedRemoteState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    rezzedRemoteState = apply(
      rezzedRemoteState,
      "runner",
      (action) => action.type === "continue_run",
    );
    rezzedRemoteState = apply(
      rezzedRemoteState,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(rezzedRemoteState, action) ===
          560,
    );
    rezzedRemoteState = passRootRezWindowBeforeAccessIfOpen(rezzedRemoteState);
    rezzedRemoteState = apply(
      rezzedRemoteState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(rezzedRemoteState.runner.grip.length).toBe(rezzedGripBefore - 6);
    expect(rezzedRemoteState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: 560,
      advancementCounterCount: 3,
      damageAmount: 6,
    });

    let rdState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-virus-test-site-rd"),
    );
    rdState.runner.credits = 10;
    const rdVirusTestSiteId = putCorpCardOnTopOfRd(
      rdState,
      560,
    );
    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rdState = apply(
      rdState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(rdState.run?.accessedCardId).toBe(rdVirusTestSiteId);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 560,
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
      560,
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
    archivesState = passRootRezWindowBeforeAccessIfOpen(archivesState);
    expect(archivesState.runner.grip.length).toBe(archivesGripBefore);
    expect(archivesState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: 560,
      archivesAutoAccessedCount: 1,
    });
  });

  it("keeps Setup! at two net damage and skips its Archives access", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-setup-archives"),
    );
    state.runner.credits = 10;
    const setupId = moveCorpCardToArchives(state, 552, false);
    keepOnlyCorpArchivesCards(state, [setupId]);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);

    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: 552,
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
    const rdTrapId = putCorpCardOnTopOfRd(rdState, 557);
    const rdGripBefore = rdState.runner.grip.length;
    const rdTagsBefore = rdState.runner.tags;
    const initial = structuredClone(rdState);
    const replayStart = rdState.eventLog.length;

    expect(JSON.stringify(getPlayerView(rdState, "runner"))).not.toContain(
      557,
    );
    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rdState = apply(
      rdState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(rdState.pendingChoice?.source).toContain("p3_35.access_payment");
    rdState = applyChoice(rdState, "corp", "pay");

    expect(rdState.run?.accessedCardId).toBe(rdTrapId);
    expect(rdState.runner.tags).toBe(rdTagsBefore + 1);
    expect(rdState.runner.grip.length).toBe(rdGripBefore - 3);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: 557,
      cardDefinitionId: 557,
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
      557,
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
    archivesState = passRootRezWindowBeforeAccessIfOpen(archivesState);

    expect(archivesState.runner.grip.length).toBe(archivesGripBefore);
    expect(archivesState.runner.tags).toBe(archivesTagsBefore);
    expect(archivesState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: 557,
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
        540,
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
        sourceDefinitionId: 540,
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
      296,
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
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
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
    moveRunnerCardToGrip(state, 259);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 259,
    );
    const pileDriverId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 259,
    );
    putCorpIceOnServer(state, "rd", 458);
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
        sourceDefinition(state, action) === 458,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");
    state = applyChoice(state, "corp", `card_${pileDriverId}`);

    expect(pileDriverId && state.runner.heap.includes(pileDriverId)).toBe(true);
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCardDefinitionId: 259,
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
      553,
    );
    state.cardInstances[skaldervikenId] = {
      ...state.cardInstances[skaldervikenId]!,
      faceup: true,
      rezzed: true,
    };
    const blackIceId = putCorpIceOnServer(
      state,
      "remote_1",
      443,
    );
    const nonBlackIceId = putCorpIceOnServer(
      state,
      "hq",
      442,
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
        553,
      rezCostReductionAmount: 2,
      rezCostPaid: 5,
    });
    let nonBlackRunState = toRunnerTurnFromCorpMain(state);
    nonBlackRunState.runner.credits = 10;
    nonBlackRunState = apply(
      nonBlackRunState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
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
    let exposeState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-fortress"),
    );
    exposeState.runner.credits = 20;
    moveRunnerCardToGrip(exposeState, 300);
    putCorpRootInRemote(exposeState, 606);
    const firstIceId = putCorpIceOnServer(
      exposeState,
      "remote_1",
      589,
    );
    const secondIceId = putCorpIceOnServer(
      exposeState,
      "remote_1",
      590,
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
          300,
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
      "hidden_zone.successful_run_fort_ice_reorder",
    );
    exposeState = applyChoices(exposeState, "runner", [
      `card_${secondIceId}`,
      `card_${firstIceId}`,
    ]);
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_run_fort_ice_reorder",
      amounts: expect.objectContaining({ reorderedIceCount: 2 }),
      targets: expect.objectContaining({ hiddenOrderChoice: true }),
    });
    expect(
      JSON.stringify(exposeState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /simple_barrier_ice|simple_code_gate_ice|Simple Barrier ICE|Simple Code Gate ICE|cardInstances/,
    );
    const exposeReplay = replayEvents(
      exposeInitial,
      exposeState.eventLog.slice(exposeReplayStart),
    );
    expect(exposeReplay.ok).toBe(true);
    expect(hashState(exposeReplay.state)).toBe(hashState(exposeState));

    let revealState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ice-data"),
    );
    revealState.runner.credits = 20;
    moveRunnerCardToGrip(
      revealState,
      304,
    );
    putCorpIceOnServer(revealState, "hq", 589);
    putCorpRootInRemote(revealState, 606);
    putCorpIceOnServer(revealState, "remote_1", 590);
    putCorpIceOnServer(revealState, "remote_1", 601);
    const revealAction = mustAction(
      revealState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(revealState, action) ===
          304,
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
      exposedPositionKeys: "ice:0,ice:1",
    });
    expect(
      JSON.stringify(revealState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /simple_code_gate_ice|Simple Code Gate ICE|"stack"|"rd"|"cardInstances"/,
    );
    expect(JSON.stringify(getPlayerView(revealState, "runner"))).not.toContain(
      590,
    );
    const revealReplay = replayEvents(
      revealInitial,
      revealState.eventLog.slice(revealReplayStart),
    );
    expect(revealReplay.ok).toBe(true);
    expect(hashState(revealReplay.state)).toBe(hashState(revealState));

    let noIceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ice-data-no-ice"),
    );
    noIceState.runner.credits = 20;
    moveRunnerCardToGrip(
      noIceState,
      304,
    );
    expect(
      getLegalActions(noIceState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(noIceState, action) ===
            304,
      ),
    ).toBe(false);
  });

  it("keeps Private LDL Access and HQ Interface source-bound and hidden-info safe", () => {
    let ldlState = toRunnerTurn(v171CardReleaseGame("spotcheck-private-ldl"));
    ldlState.runner.credits = 20;
    moveRunnerCardToGrip(ldlState, 318);
    putCorpCardOnTopOfRd(ldlState, 415);
    const hqHiddenCard = moveCorpCardToHq(ldlState, 596);
    keepOnlyCorpHqCard(ldlState, hqHiddenCard);
    const ldlAction = mustAction(
      ldlState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(ldlState, action) ===
          318 &&
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
    ldlState = apply(
      ldlState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(ldlState.corp.hq).toContain(hqHiddenCard);
    expect(ldlState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      cardDefinitionId: 415,
    });
    expect(
      JSON.stringify(ldlState.eventLog.map((event) => event.publicPayload)),
    ).not.toMatch(/simple_economy_operation|Simple Economy Operation/);
    const ldlReplay = replayEvents(
      ldlInitial,
      ldlState.eventLog.slice(ldlReplayStart),
    );
    expect(ldlReplay.ok).toBe(true);
    expect(hashState(ldlReplay.state)).toBe(hashState(ldlState));

    let hqState = toRunnerTurn(v171CardReleaseGame("spotcheck-hq-interface"));
    hqState.runner.credits = 20;
    moveRunnerCardToGrip(hqState, 341);
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hqState, action) === 341,
    );
    moveRunnerCardCopyToGrip(hqState, 341);
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hqState, action) === 341,
    );
    const hqCards = [
      moveCorpCardToHq(hqState, 596),
      moveCorpCardToHq(hqState, 507),
      moveCorpCardToHq(hqState, 415),
    ];
    keepOnlyCorpHqCards(hqState, hqCards);
    const hqInitial = structuredClone(hqState);
    const hqReplayStart = hqState.eventLog.length;
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(hqState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      serverLabel: "HQ",
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
    });
    expect(JSON.stringify(hqState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_economy_operation|onr_v1_295_night-shift|Hostile Takeover/,
    );
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
    moveRunnerCardToGrip(zoningState, 385);
    zoningState = apply(
      zoningState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) ===
          385 &&
        action.payload?.selectedServerId === "rd",
    );
    moveRunnerCardCopyToGrip(zoningState, 385);
    zoningState = apply(
      zoningState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) ===
          385 &&
        action.payload?.selectedServerId === "rd",
    );
    zoningState = apply(
      zoningState,
      "runner",
      (action) => action.type === "end_turn",
    );
    zoningState = apply(
      zoningState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    zoningState.corp.credits = 20;
    zoningState.corp.clicks = 3;
    moveCorpCardToHq(zoningState, 589);
    const taxedInstall = mustAction(
      zoningState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(zoningState, action) === 589 &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(taxedInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 4,
      iceInstallTotalCost: 4,
    });
    expect(
      getPlayerView(zoningState, "runner").servers.find(
        (server) => server.id === "rd",
      )?.statuses,
    ).toEqual([
      expect.objectContaining({
        kind: "cost_modifier",
        costKind: "corp_ice_install",
        operation: "increase",
        amount: 2,
        targetServerId: "rd",
        sourceTitle: "Restrictive Net Zoning",
        sourceSide: "runner",
      }),
      expect.objectContaining({
        kind: "cost_modifier",
        costKind: "corp_ice_install",
        operation: "increase",
        amount: 2,
        targetServerId: "rd",
        sourceTitle: "Restrictive Net Zoning",
        sourceSide: "runner",
      }),
    ]);

    let polymerState = toRunnerTurn(v192CardReleaseGame("spotcheck-polymer"));
    polymerState.corp.credits = 5;
    scoreCorpAgendaForTest(polymerState, 423);
    scoreCorpAgendaForTest(polymerState, 423);
    const polymerInitial = structuredClone(polymerState);
    const polymerReplayStart = polymerState.eventLog.length;
    polymerState = apply(
      polymerState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(polymerState.pendingChoice?.source).toContain("corp_start.order:");
    polymerState = applyChoice(
      polymerState,
      "corp",
      String(polymerState.pendingChoice?.options[0]?.id),
    );
    expect(polymerState.corp.credits).toBe(7);
    expect(
      polymerState.eventLog
        .slice(polymerReplayStart)
        .some((event) => event.publicPayload.actionType === "end_turn"),
    ).toBe(true);
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
    scoreCorpAgendaForTest(policeState, 425);
    const policeAction = mustAction(
      policeState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(policeState, action) ===
          425,
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
    expect(policeState.trace).toMatchObject({ traceLimit: 5 });
    policeState = applyChoice(policeState, "corp", "bid_1");
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
            { id: 226, quantity: 1 },
          ],
        },
        corpDeck: ONR_V1_9_2_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    nagaState.runner.credits = 20;
    nagaState.corp.credits = 20;
    const dwarfId = installRunnerProgramForTest(nagaState, 233);
    const codecrackerId = installRunnerProgramForTest(
      nagaState,
      226,
    );
    putCorpIceOnServer(nagaState, "rd", 447);
    nagaState = apply(
      nagaState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    nagaState = apply(
      nagaState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nagaState, action) === 447,
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
    nagaState = applyChoice(nagaState, "corp", `card_${dwarfId}`);
    const nagaTrashEvent = nagaState.eventLog.at(-1);
    nagaState = apply(
      nagaState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(nagaState.runner.heap).toContain(dwarfId);
    expect(nagaState.runner.heap).not.toContain(codecrackerId);
    expect(nagaState.run).toBeUndefined();
    expect(nagaTrashEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCardDefinitionId: 233,
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(
      JSON.stringify(nagaState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(hiddenLeakPattern);
    const nagaReplay = replayEvents(
      nagaInitial,
      nagaState.eventLog.slice(nagaReplayStart),
    );
    expect(nagaReplay.ok).toBe(true);
    expect(hashState(nagaReplay.state)).toBe(hashState(nagaState));
  });

  it("keeps Vacuum Link and Pacifica Regional AI deterministic and revalidated", () => {
    for (const scenario of [
      { seed: "spotcheck-vacuum-0", die: 1, rewind: true },
      { seed: "spotcheck-vacuum-2", die: 4, rewind: false },
    ] as const) {
      let state = toRunnerTurn(v190CardReleaseGame(scenario.seed));
      state.runner.credits = 40;
      state.corp.credits = 20;
      moveRunnerCardToGrip(state, 217);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            217,
      );
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          217,
      );
      expect(bartmossId).toBeDefined();
      putCorpIceOnServer(state, "rd", 487);
      putCorpIceOnServer(state, "rd", 589);
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
          sourceDefinition(state, action) === 589,
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
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === 487,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      for (
        let step = 0;
        step < 5 &&
        typeof state.eventLog.at(-1)?.publicPayload?.rezzedIceRewindDieRoll !==
          "number" &&
        getLegalActions(state, "runner").some(
          (action) => action.type === "continue_run",
        );
        step += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        rezzedIceRewindDieRoll: scenario.die,
      });
      if (scenario.rewind) {
        expect(state.pendingChoice).toMatchObject({
          side: "runner",
          source: "card_implementation.vacuum_link_rewind",
          kind: "select_option",
        });
        state = applyChoice(state, "runner", "resume_from_rezzed_ice_back");
      }
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        rezzedIceRewindApplied: scenario.rewind,
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
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
      546,
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
    expect(pacificaState.cardInstances[pacificaId]?.advancementCounters).toBe(
      0,
    );
    expect(pacificaState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: 546,
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
  it("keeps Cockroach random HQ discard bound to the shared Corp pool across multiple sources and state drift", () => {
    let state = toRunnerTurn(v191CardReleaseGame("spotcheck-cockroach-multi"));
    state.runner.credits = 20;
    const first = installRunnerProgramForTest(state, 225);
    const second = moveRunnerCardCopyToGrip(state, 225);
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
    for (const id of installed)
      expect(cardCounterAmount(state, id, "virus")).toBe(0);
    state.purgeableRunnerVirusCounters = { corp: { cockroach: 2 } };

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const keepA = moveCorpCardToHq(state, 596);
    const keepB = moveCorpCardToHq(state, 491);
    keepOnlyCorpHqCards(state, [keepA, keepB]);
    state.corp.maxHandSize = 1;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const resolve = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-cockroach-wrong-side",
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [state.pendingChoice?.options[0]?.id ?? ""],
      },
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-cockroach-stale",
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [state.pendingChoice?.options[0]?.id ?? ""],
      },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = applyChoice(
      state,
      "corp",
      state.pendingChoice?.options[0]?.id ?? "",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      randomizedByCockroach: true,
      cockroachCounterTotal: 2,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "discard_phase",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_economy|wall-of-static|privatePayload|cardInstances/,
    );
  });

  it("uses Access through Alpha as the single base-link source for trace bidding", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("spotcheck-access-alpha-link"),
    );
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, 215);
    moveRunnerCardToGrip(state, 360);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 215,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 360,
    );
    putCorpIceOnServer(state, "rd", 458);
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
        sourceDefinition(state, action) === 458,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_1");

    expect(state.trace).toMatchObject({
      status: "base_link",
      traceValue: 5,
      runnerLink: 0,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerLink: 0,
      traceValue: 5,
    });
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(
        state,
        360,
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
      [215, 1, 0, 1],
      [216, 3, 0, 2],
      [360, 9, 1, undefined],
      [361, 4, 2, 2],
      [362, 1, 1, 1],
      [364, 2, 0, 3],
      [365, 2, 1, 2],
    ] as const;

    expect(
      CARD_DEFINITIONS_BY_ID[360],
    ).toMatchObject({
      installCost: 9,
    });
    for (const definitionId of [
      360,
      361,
      362,
      364,
      365,
    ]) {
      expect(CARD_DEFINITIONS_BY_ID[definitionId]?.baseLink).toBeUndefined();
    }

    for (const [definitionId, baseLink, baseCost, pumpCost] of specs) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p331-trace-link-${definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            id: `p331_trace_link_runner_${definitionId}`,
            name: `P3.31 Trace Link Runner ${definitionId}`,
            side: "runner",
            identity: 587,
            cards: [
              { id: definitionId, quantity: 1 },
              { id: 595, quantity: 10 },
            ],
          },
          corpDeck: {
            id: `p331_trace_link_corp_${definitionId}`,
            name: `P3.31 Trace Link Corp ${definitionId}`,
            side: "corp",
            identity: 3,
            cards: [
              { id: 455, quantity: 1 },
              { id: 588, quantity: 6 },
              { id: 596, quantity: 6 },
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
      if (definitionId === 216) {
        const bakdoorView = getPlayerView(state, "runner").own.rig?.find(
          (card) => card.definitionId === definitionId,
        );
        expect(bakdoorView?.baseLink).toBeUndefined();
      }
      putCorpIceOnServer(state, "rd", 455);
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
          sourceDefinition(state, action) === 455,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = applyChoice(state, "corp", "bid_0");
      expect(state.trace).toMatchObject({ status: "base_link", runnerLink: 0 });
      const beforeBase = state.runner.credits;
      state = applyChoice(
        state,
        "runner",
        traceChoiceOptionIdForDefinition(
          state,
          definitionId,
          "trace_base_link_",
        ),
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
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("p331-one-base-link-stale"),
    );
    state.runner.credits = 20;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, 215);
    moveRunnerCardToGrip(state, 360);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 215,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 360,
    );
    putCorpIceOnServer(state, "rd", 458);
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
        sourceDefinition(state, action) === 458,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    const baseChoiceAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const baseChoiceId = state.pendingChoice?.choiceId;
    const baedekerOption = traceChoiceOptionIdForDefinition(
      state,
      215,
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
        360,
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
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-replicator-trace-break"),
    );
    state.runner.credits = 10;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, 268);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 268,
    );
    putCorpIceOnServer(state, "rd", 433);
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
        sourceDefinition(state, action) === 433,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 268,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 268,
    );

    const breakTrace = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 268,
    );
    expect(breakTrace.payload).toMatchObject({
      targetIceDefinitionId: 433,
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakTrace.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);

    let wallState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-replicator-wall-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.traceTags.runner,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    wallState.runner.credits = 10;
    moveRunnerCardToGrip(wallState, 268);
    wallState = apply(
      wallState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(wallState, action) === 268,
    );
    putCorpIceOnServer(wallState, "rd", 457);
    wallState = apply(
      wallState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    wallState = apply(
      wallState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(wallState, action) === 457,
    );
    expect(
      getLegalActions(wallState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(wallState, action) === 268,
      ),
    ).toBe(false);
  });

  it("spends Scatter Shot recurring credits only for accessed upgrade trash costs", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      id: "spotcheck_scatter_runner",
      name: "Spotcheck Scatter Runner",
      cards: [
        { id: 269, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-scatter-shot",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.corp.credits = 10;
    moveRunnerCardToGrip(state, 269);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 269,
    );
    const scatterId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 269,
    );
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(2);
    const redHerringsId = putCorpRootInRemote(state, 578);
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
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
    const trash = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(trash.payload).toMatchObject({
      v1922RunnerProgramAbility: "upgrade_trash_recurring_credit",
      upgradeTrashRecurringCreditsAvailable: 2,
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === trash.actionId,
    );
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(1);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      upgradeTrashRecurringCreditsSpent: 1,
      runnerCreditsSpent: 0,
    });
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(
      true,
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(scatterId && state.cardInstances[scatterId]?.counters?.bit).toBe(2);

    let assetState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-scatter-asset-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        agendaPointsToWin: 7,
      }),
    );
    assetState.runner.credits = 0;
    assetState.corp.credits = 10;
    moveRunnerCardToGrip(assetState, 269);
    assetState = apply(
      assetState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(assetState, action) === 269,
    );
    const assetId = putCorpRootInRemote(
      assetState,
      556,
    );
    assetState.cardInstances[assetId] = {
      ...assetState.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    assetState = apply(
      assetState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    assetState = apply(
      assetState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      getLegalActions(assetState, "runner").some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(false);
  });

  it("spends Poltergeist recurring credits only for accessed node trash costs", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      id: "spotcheck_poltergeist_runner",
      name: "Spotcheck Poltergeist Runner",
      cards: [
        { id: 260, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-poltergeist-node-trash",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          cards: [
            { id: 594, quantity: 1 },
            { id: 606, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                ![594, 606].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 1;
    moveRunnerCardToGrip(state, 260);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 260,
    );
    const poltergeistId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 260,
    );
    expect(
      poltergeistId && cardCounterAmount(state, poltergeistId, "bit"),
    ).toBe(2);
    putCorpRootInRemote(state, 594);

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
    const trash = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(trash.payload).toMatchObject({
      v1922RunnerProgramAbility: "poltergeist_node_trash_recurring_credit",
      poltergeistRecurringCreditsAvailable: 2,
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === trash.actionId,
    );
    expect(
      poltergeistId && cardCounterAmount(state, poltergeistId, "bit"),
    ).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      poltergeistRecurringCreditsSpent: 2,
      runnerCreditsSpent: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let upgradeState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-poltergeist-upgrade-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          cards: [
            { id: 594, quantity: 1 },
            { id: 606, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                ![594, 606].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    upgradeState.runner.credits = 0;
    moveRunnerCardToGrip(upgradeState, 260);
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(upgradeState, action) === 260,
    );
    putCorpRootInRemote(upgradeState, 606);
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    upgradeState = passRootRezWindowBeforeAccessIfOpen(upgradeState);
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) => action.type === "access_card",
    );
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
        { id: 350, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
          (card) => card.id !== 350,
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-pk-trace-link",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.traceTags.corp,
          cards: [
            { id: 458, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
              (card) => card.id !== 458,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 350);
    const memoryBefore = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 350,
    );
    const pkId = state.runner.rig.hardware.find(
      (id) => state.cardInstances[id]?.definitionId === 350,
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 1,
    );
    expect(pkId && cardCounterAmount(state, pkId, "bit")).toBe(3);
    state.runner.credits = 0;
    putCorpIceOnServer(state, "rd", 458);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", 458);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    expect(
      state.pendingChoice?.options.some((option) => option.id === "bid_3"),
    ).toBe(true);
    expect(state.pendingChoice?.prompt).toContain(
      "0 Credits + 3 Link-Bits verfügbar",
    );
    expect(
      state.pendingChoice?.options.find((option) => option.id === "bid_3")
        ?.label,
    ).toBe("3 Gesamtbid");
    state = applyChoice(state, "runner", "bid_3");
    expect(pkId && cardCounterAmount(state, pkId, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceLinkCreditsSpent: 3,
      runnerCreditsSpent: 0,
      traceLinkCreditSourceDefinitionIds: 350,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let refreshState = structuredClone(initial);
    if (pkId) setCardCounterForTest(refreshState, pkId, "bit", 0);
    refreshState = apply(
      refreshState,
      "runner",
      (action) => action.type === "end_turn",
    );
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "end_turn",
    );
    expect(pkId && cardCounterAmount(refreshState, pkId, "bit")).toBe(3);
  });

  it("loads Holovid Campaign with 12 public bits and self-trashes on the last Corp turn drain", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-holovid-bits");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const holovidId = moveCorpCardToHq(state, 538);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 538,
    );
    expect(cardCounterAmount(state, holovidId, "bit")).toBe(12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 12,
      remainingCounters: 12,
      sourceDefinitionId: 538,
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

  it("rezzes Holovid in the Corp start window and resolves its newly due source", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "spotcheck-holovid-start-rez",
    );
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const holovidId = putCorpRootInRemote(state, 538);
    const creditsBefore = state.corp.credits;

    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.pendingChoice?.source).toContain("corp_start.rez:");
    expect(state.pendingChoice?.options.map((option) => option.id)).toContain(
      `rez_${holovidId}`,
    );
    const corpRezOption = getPlayerView(
      state,
      "corp",
    ).pendingChoice?.options.find((option) => option.id === `rez_${holovidId}`);
    expect(corpRezOption).toMatchObject({
      value: holovidId,
      metadata: { creditCost: 4 },
      card: {
        instanceId: holovidId,
        definitionId: 538,
        title: "Holovid Campaign",
        rezzed: false,
      },
    });
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    state = applyChoice(state, "corp", `rez_${holovidId}`);

    expect(state.cardInstances[holovidId]?.rezzed).toBe(true);
    expect(cardCounterAmount(state, holovidId, "bit")).toBe(11);
    expect(state.corp.credits).toBe(creditsBefore - 3);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("loads Braindance Campaign with 12 public bits and drains 2 at Corp turn start", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "spotcheck-braindance-bits",
    );
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const braindanceId = moveCorpCardToHq(
      state,
      523,
    );
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 523,
    );

    expect(state.corp.credits).toBe(creditsBeforeRez - 6);
    expect(cardCounterAmount(state, braindanceId, "bit")).toBe(12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      addedCounterAmount: 12,
      remainingCounters: 12,
      sourceDefinitionId: 523,
    });
    expect(
      getPlayerView(state, "runner").servers.some((server) =>
        server.root.some(
          (card) =>
            card.definitionId === 523 &&
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
      223,
      220,
      376,
      333,
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
    const recurringId = installRunnerProgramForTest(state, 223);
    const restrictedId = installRunnerResourceForTest(
      state,
      376,
    );
    const virusId = installRunnerProgramForTest(state, 220);
    const fridgeId = installRunnerHardwareForTest(
      state,
      333,
    );
    setCardCounterForTest(state, recurringId, "recurring_credit", 2);
    setCardCounterForTest(state, restrictedId, "bit", 1);
    setCardCounterForTest(state, state.runner.identity, "trauma", 2);
    setCardCounterForTest(state, virusId, "virus", 3);
    state.purgeableRunnerVirusCounters = { corp: { boardwalk: 3 } };
    setCardCounterForTest(state, fridgeId, "ablative", 2);
    setCardCounterForTest(state, state.runner.identity, "trace_tag_counter", 1);
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
    const projectedCards = [
      recurringCard,
      restrictedCard,
      virusCard,
      fridgeCard,
      runnerView.own.identity,
    ];
    for (const card of projectedCards) {
      const ids = card?.counterDisplays?.map((display) => display.id) ?? [];
      expect(new Set(ids).size).toBe(ids.length);
    }

    expect(
      recurringCard?.counterDisplays?.map((display) => display.id),
    ).toEqual(["restricted_pool", "recurring_credit"]);
    // Cloak's actual bit pool is empty here; its public capacity and refresh
    // contract must remain visible without changing spendable funds or state.
    expect(recurringCard?.counterDisplays).toContainEqual(
      expect.objectContaining({
        id: "restricted_pool",
        amount: 0,
        creditPool: expect.objectContaining({
          capacity: 3,
          uses: ["using_icebreaker_during_run_non_noisy"],
        }),
      }),
    );
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
    expect(
      restrictedCard?.counterDisplays?.map((display) => display.id),
    ).toEqual(["restricted_pool"]);
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
    expect(virusCard?.counterDisplays).toBeUndefined();
    expect(runnerView.opponent.identity.counterDisplays).toContainEqual(
      expect.objectContaining({
        id: "runner_virus_corp_boardwalk",
        amount: 3,
        displayKind: "virus",
        counterType: "boardwalk",
      }),
    );
    expect(corpView.own.identity.counterDisplays).toContainEqual(
      expect.objectContaining({
        id: "runner_virus_corp_boardwalk",
        amount: 3,
        displayKind: "virus",
        counterType: "boardwalk",
      }),
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
    expect(
      runnerView.own.identity.counterDisplays?.map((display) => display.id),
    ).toEqual(["trauma", "trace_tag_counter", "cerberus", "mastiff", "crying"]);
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
          id: "trace_tag_counter",
          amount: 1,
          displayKind: "trace",
          counterType: "trace_tag_counter",
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
    expect(
      getLegalActions(state, "runner").map((action) => action.actionId),
    ).toEqual(legalActionIdsBeforeView);
  });

  it.each([0, 3])(
    "grants Remote Facility's action immediately when rezzed with %i clicks",
    (clicks) => {
      let state = apply(
        createGameAfterSetup({
          seed: "remote-facility-immediate-rez-action",
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 5;
      const remoteId = putCorpRootInRemote(state, 547);
      state.corp.clicks = clicks;
      state.corp.credits = 4;
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "rez_card" && action.payload?.cardId === remoteId,
        ),
      ).toBe(false);
      state.corp.credits = 5;
      const clicksBeforeRez = state.corp.clicks;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_card" && action.payload?.cardId === remoteId,
      );

      expect(state.cardInstances[remoteId]?.rezzed).toBe(true);
      expect(state.corp.credits).toBe(0);
      expect(state.corp.clicks).toBe(clicksBeforeRez + 1);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "rez_card",
        gainedActions: 1,
      });
      expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "gain_actions",
            amount: 1,
            reason: "card_resolver",
            sourceDefinitionId: 547,
            sourceTitle: "Remote Facility",
          }),
        ]),
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("applies P3.7 turn-start economy CardImplementations once from valid sources", () => {
    let corpState = apply(
      createGameAfterSetup({
        seed: "p37-corp-turn-start-economy",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: 547, quantity: 1 },
            { id: 430, quantity: 1 },
            { id: 423, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  547,
                  430,
                  423,
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
      547,
    );
    corpState.cardInstances[remoteId] = {
      ...corpState.cardInstances[remoteId]!,
      faceup: true,
      rezzed: true,
    };
    const subsidiaryId = scoreCorpAgendaForTest(
      corpState,
      430,
    );
    const polymerId = scoreCorpAgendaForTest(
      corpState,
      423,
    );
    const initial = structuredClone(corpState);
    const replayStart = corpState.eventLog.length;

    corpState = toRunnerTurnFromCorpMain(corpState);
    corpState = apply(
      corpState,
      "runner",
      (action) => action.type === "end_turn",
    );
    while (corpState.pendingChoice?.source.startsWith("corp_start.order:")) {
      corpState = applyChoice(
        corpState,
        "corp",
        String(corpState.pendingChoice.options[0]?.id),
      );
    }

    expect(corpState.corp.credits).toBe(6);
    expect(corpState.corp.clicks).toBe(5);
    const resolvedEffects = corpState.eventLog
      .slice(replayStart)
      .flatMap((event) => {
        const effects = event.publicPayload.resolvedEffects;
        return Array.isArray(effects) ? effects : [];
      });
    expect(resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_actions",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: 547,
          sourceTitle: "Remote Facility",
        }),
        expect.objectContaining({
          kind: "gain_actions",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: 430,
          sourceTitle: "Subsidiary Branch",
        }),
        expect.objectContaining({
          kind: "gain_credits",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: 423,
          sourceTitle: "Polymer Breakthrough",
        }),
      ]),
    );
    expect(
      resolvedEffects.filter(
        (effect) =>
          effect.sourceDefinitionId === 547 ||
          effect.sourceDefinitionId === 430 ||
          effect.sourceDefinitionId === 423,
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
            { id: 547, quantity: 1 },
            { id: 430, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  547,
                  430,
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
    putCorpRootInRemote(invalidSourceState, 547);
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
            { id: 375, quantity: 1 },
            { id: 386, quantity: 1 },
            { id: 396, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) =>
                ![
                  375,
                  386,
                  396,
                ].includes(card.id),
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 375);
    moveRunnerCardToGrip(state, 386);
    moveRunnerCardToGrip(state, 396);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 375,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 386,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 396,
    );
    const riggedId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        386,
    );
    const topRunnersId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        396,
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

    const orderedStartDefinitionIds = [
      375,
      386,
    ];
    for (const definitionId of orderedStartDefinitionIds) {
      expect(state.pendingChoice?.source).toMatch(/^runner_start\.order:/);
      const optionId = state.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" &&
          state.cardInstances[option.value]?.definitionId === definitionId,
      )?.id;
      if (!optionId) throw new Error(`Startzugoption fehlt: ${definitionId}`);
      state = applyChoice(state, "runner", optionId);
    }

    expect(state.runner.credits).toBe(creditsBeforeTurn + 4);
    expect(cardCounterAmount(state, riggedId, "bit")).toBe(11);
    const startTurnEffects = state.eventLog
      .slice(replayStart)
      .flatMap((event) =>
        Array.isArray(event.publicPayload.resolvedEffects)
          ? event.publicPayload.resolvedEffects
          : [],
      );
    expect(startTurnEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          amount: 1,
          sourceDefinitionId: 375,
          reason: "start_of_turn",
        }),
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 1,
          sourceDefinitionId: 386,
          reason: "start_of_turn",
        }),
        expect.objectContaining({
          kind: "gain_credits",
          amount: 2,
          sourceDefinitionId: 396,
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
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.runner.rig.resources).not.toContain(topRunnersId);
    expect(state.runner.heap).toContain(topRunnersId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "trash_source",
        reason: "run_start",
        sourceDefinitionId: 396,
      }),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Data Darts damage and next-ICE no-break only to the next encounter", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-data-darts-next-ice",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          cards: [
            { id: 284, quantity: 1 },
            { id: 591, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) =>
                ![284, 591].includes(card.id),
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: 446, quantity: 1 },
            { id: 590, quantity: 1 },
            { id: 596, quantity: 3 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  446,
                  590,
                  596,
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerProgramForTest(state, 284);
    installRunnerProgramForTest(state, 591);
    const codeGateId = putCorpIceOnServer(state, "rd", 590);
    state.cardInstances[codeGateId] = {
      ...state.cardInstances[codeGateId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "rd", 446);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", 446);
    const gripBefore = state.runner.grip.length;
    const dataDartsContinue = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(dataDartsContinue.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "printed_subroutines_damage_net,printed_subroutines_prohibit_break_next_ice",
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
          sourceDefinitionId: 446,
          subroutineIndex: 0,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 3,
        }),
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: 446,
          subroutineIndex: 1,
          subroutineType: "set_next_encounter_no_break_subroutines",
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
    let detroit = apply(
      MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-detroit-negative"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    detroit.corp.credits = 5;
    const detroitId = scoreCorpAgendaForTest(
      detroit,
      410,
    );
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
      cards: [
        { id: 508, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let offsite = apply(
      createGameAfterSetup({
        seed: "spotcheck-offsite-empty",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: offsiteCorpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    offsite.corp.credits = 5;
    moveCorpCardToHq(offsite, 508);
    expect(
      getLegalActions(offsite, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(offsite, action) === 508,
      ),
    ).toBe(false);

    let urban = apply(
      v106kCardReleaseGame("spotcheck-urban-tag-drift"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    urban.corp.credits = 10;
    urban.runner.tags = 1;
    moveCorpCardToHq(urban, 519);
    const urbanAction = mustAction(
      urban,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(urban, action) === 519,
    );
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
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-red-herrings-trash-run"),
    );
    state.runner.credits = 6;
    const redHerringsId = putCorpRootInRemote(state, 578);
    const agendaId = putCorpRootInRemote(state, 588);
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
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
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.runner.heap).not.toContain(redHerringsId);
    expect(state.corp.archives).toContain(redHerringsId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      stealCostPersistedForCurrentAccess: true,
      stealCostSourceDefinitionIds: 578,
      stealCostSourceTitles: "Red Herrings",
    });
    state = apply(state, "runner", (action) => action.type === "access_card");
    const steal = mustAction(
      state,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(steal.costs).toEqual([{ credits: 5 }]);
    expect(steal.payload).toMatchObject({
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostPersistedForCurrentAccess: true,
      stealCostSourceDefinitionIds: 578,
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === steal.actionId,
    );
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.runner.credits).toBe(0);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state.runner.credits = 10;
    const laterAgendaId = putCorpRootInRemote(state, 588);
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
    moveRunnerCardToGrip(state, 283);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 283,
    );
    const vewyId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 283,
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
      [436, 4],
      [470, 1],
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
              { id: 590, quantity: 1 },
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
      installRunnerProgramForTest(state, 591);
      putCorpIceOnServer(state, "rd", 590);
      putCorpIceOnServer(state, "rd", definitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = encounterIce(state, "rd", definitionId);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        damageResolved: true,
        damageType: "net",
        damageAmount: expectedDamage,
      });
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === 590,
      );
      const runnerActions = getLegalActions(state, "runner");
      expect(state.run?.noBreakSubroutinesActive).toBe(true);
      expect(state.run?.jackOutLockedUntilEncounterEnds ?? false).toBe(false);
      expect(
        runnerActions.some((action) => action.type === "break_subroutine"),
      ).toBe(false);
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
            { id: 284, quantity: 1 },
            ...ONR_V1_RUNNER_DECK.cards.filter(
              (card) => card.id !== 284,
            ),
          ],
        },
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: 436, quantity: 1 },
            { id: 567, quantity: 1 },
            { id: 582, quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) =>
                card.id !== 436 &&
                card.id !== 567 &&
                card.id !== 582,
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
      284,
    );
    state.cardInstances[wildCardId] = {
      ...state.cardInstances[wildCardId]!,
      strengthModifier: 10,
    };
    for (const upgradeId of [
      putCorpRootInRemote(state, 567),
      putCorpRootInRemote(state, 582),
    ]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    putCorpIceOnServer(state, "remote_1", 436);
    state = encounterIce(state, "remote_1", 436);

    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "printed_subroutines_damage_net,printed_subroutines_prohibit_break_next_ice",
    });
    expect(continueAction.payload).not.toHaveProperty(
      "payOrEndRunSubroutineIndexes",
    );
    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 284,
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0, 1, 2]);
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
            { id: 591, quantity: 1 },
            ...ONR_V1_RUNNER_DECK.cards.filter(
              (card) => card.id !== 591,
            ),
          ],
        },
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: 590, quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) => card.id !== 590,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    installRunnerProgramForTest(state, 591);
    putCorpIceOnServer(state, "rd", 590);
    state = encounterIce(state, "rd", 590);

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
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-fang-run-lock"),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", 452);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", 452);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace).toMatchObject({
      traceLimit: 4,
      sourceDefinitionId: 452,
    });
    state = applyChoice(state, "corp", "bid_4");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.run).toBeUndefined();
    expect(state.runner.tags).toBe(0);
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerRunLockCreditCost === 2,
    );
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(true);
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
      const vacantId = putCorpRootInRemote(
        state,
        558,
      );
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
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_card" &&
          sourceDefinition(state, action) === 558,
      );
      state = passRootRezWindowBeforeAccessIfOpen(state);
      state = apply(state, "runner", (action) => action.type === "access_card");
      expect(state.runner.coreDamage).toBe(advancementCounters);
      const expectedPayload: Record<string, unknown> = {
        hiddenZoneAction: "v1919_access_ambush_damage",
        ambushDefinitionId: 558,
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

  it("clears Vacant Soulkiller advancement counters after prevented access damage and trash", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-vacant-soulkiller-prevent-trash-cleanup",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.damagePrevention.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    installRunnerHardwareForTest(state, 342);
    const vacantId = putCorpRootInRemote(state, 558);
    state.cardInstances[vacantId] = {
      ...state.cardInstances[vacantId]!,
      advancementCounters: 2,
      counters: { power: 1 },
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 558,
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    const preventionOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventionOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventionOptionId));
    expect(state.runner.coreDamage).toBe(1);
    expect(state.cardInstances[vacantId]?.advancementCounters).toBe(2);

    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.corp.archives).toContain(vacantId);
    expect(state.cardInstances[vacantId]).toMatchObject({
      zone: { side: "corp", zone: "archives" },
      advancementCounters: 0,
    });
    expect(state.cardInstances[vacantId]?.counters).toBeUndefined();
    const runnerView = getPlayerView(state, "runner");
    const archivedVacant = runnerView.servers
      .find((server) => server.id === "archives")
      ?.root.find((card) => card.instanceId === vacantId);
    expect(archivedVacant?.advancementCounters).toBe(0);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps unrezzed Vacant Soulkiller inactive on access", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring(
        "spotcheck-vacant-soulkiller-unrezzed",
      ),
    );
    const vacantId = putCorpRootInRemote(state, 558);
    state.cardInstances[vacantId] = {
      ...state.cardInstances[vacantId]!,
      advancementCounters: 3,
    };
    const coreDamageBefore = state.runner.coreDamage;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.coreDamage).toBe(coreDamageBefore);
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "ambushDefinitionId",
    );
  });

  it("charges Microtech Trode Set for breaks and reduces unbroken AP net damage to one", () => {
    const microtechRunnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "spotcheck_microtech_break_runner",
      name: "Spotcheck Microtech Break Runner",
      cards: [
        { id: 344, quantity: 1 },
        { id: 598, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
          (card) =>
            card.id !== 344 &&
            card.id !== 598,
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
    const baseLinkBefore =
      visibleRunnerTraceSupportQuote(state).baseLinkOptions[0]?.baseLink;
    installRunnerHardwareForTest(state, 344);
    expect(
      visibleRunnerTraceSupportQuote(state).baseLinkOptions[0]?.baseLink,
    ).toBe(baseLinkBefore);
    const killerId = installRunnerProgramForTest(state, 598);
    state.cardInstances[killerId] = {
      ...state.cardInstances[killerId]!,
      strengthModifier: 10,
    };
    putCorpIceOnServer(state, "rd", 436);
    state = encounterIce(state, "rd", 436);
    const breakAction = mustAction(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    expect(breakAction.costs).toEqual([{ credits: 2 }]);
    expect(breakAction.payload).toMatchObject({
      breakSubroutineAdditionalCost: 1,
      runnerHardwareAbility: "runner_hardware_break_cost_modifier",
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
    installRunnerHardwareForTest(damageState, 344);
    putCorpIceOnServer(damageState, "rd", 436);
    damageState = encounterIce(damageState, "rd", 436);
    damageState = apply(
      damageState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerHardwareAbility: "runner_hardware_ap_net_damage_reduction",
      printedDamageAmount: 4,
      damageAmount: 1,
    });

    const trodeState = state;
    const shock = CARD_DEFINITIONS_BY_ID[480]!;
    const jackAttack = CARD_DEFINITIONS_BY_ID[463]!;
    const bolter = CARD_DEFINITIONS_BY_ID[436]!;
    expect(
      trodeSetIgnoresSubroutine(trodeState, shock, shock.subroutines![0]!),
    ).toBe(true);
    expect(
      trodeSetIgnoresSubroutine(
        trodeState,
        jackAttack,
        jackAttack.subroutines![0]!,
      ),
    ).toBe(true);
    expect(
      trodeSetIgnoresSubroutine(
        trodeState,
        jackAttack,
        jackAttack.subroutines![1]!,
      ),
    ).toBe(false);
    expect(
      trodeSetIgnoresSubroutine(trodeState, bolter, bolter.subroutines![0]!),
    ).toBe(false);
  });

  it("ignores a normal AP subroutine before resolution and never offers it as a break target", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-microtech-trode-ignore-normal-ap",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_microtech_trode_ignore_runner",
          name: "Spotcheck Microtech Trode Ignore Runner",
          cards: [
            { id: 344, quantity: 1 },
            { id: 598, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) =>
                card.id !== 344 &&
                card.id !== 598,
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_microtech_trode_ignore_corp",
          name: "Spotcheck Microtech Trode Ignore Corp",
          cards: [
            { id: 480, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 480,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerHardwareForTest(state, 344);
    const killerId = installRunnerProgramForTest(state, 598);
    state.cardInstances[killerId] = {
      ...state.cardInstances[killerId]!,
      strengthModifier: 10,
    };
    putCorpIceOnServer(state, "rd", 480);
    state = encounterIce(state, "rd", 480);

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "break_subroutine",
      ),
    ).toBe(false);
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.label).toBe("ICE passieren");
    expect(continueAction.payload?.unbrokenSubroutineCount).toBe(0);
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run?.ignoredSubroutineIndexes).toEqual([0]);
  });

  it("hardens Corporate Ally for deterministic multi-agenda spend and payload redaction", () => {
    let state = toRunnerTurn(
      v180CardReleaseGame("spotcheck-corporate-ally-hardening"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    const firstAgendaId = scoreRunnerAgendaForTest(
      state,
      415,
    );
    const secondAgendaId = scoreRunnerAgendaForTest(
      state,
      415,
    );
    state.runner.scoreArea = [secondAgendaId, firstAgendaId];
    const expectedSpendId = [firstAgendaId, secondAgendaId].sort()[0];
    if (!expectedSpendId)
      throw new Error("Missing deterministic agenda spend target");
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      368,
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
      spentAgendaCardId: expectedSpendId,
      installCostReason: "card_implementation_agenda_point_cost",
    });
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === install.actionId,
    );
    expect(state.runner.scoreArea).toContain(firstAgendaId);
    expect(state.runner.scoreArea).toContain(secondAgendaId);
    expect(state.specialZones?.removedFromGame ?? []).not.toContain(
      expectedSpendId,
    );
    expect(state.cardInstances[expectedSpendId]?.agendaPointsSpent).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: 368,
      agendaPointCostPaid: 1,
      spentAgendaCardId: expectedSpendId,
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
    moveRunnerCardToGrip(noAgendaState, 368);
    expect(
      getLegalActions(noAgendaState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(noAgendaState, action) ===
            368,
      ),
    ).toBe(false);
  });

  it("hardens Smith's Pawnshop pass, stale/wrong-side and removed-target choices", () => {
    let state = toRunnerTurn(v170CardReleaseGame("spotcheck-smiths-hardening"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 392);
    moveRunnerCardToGrip(state, 240);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 392,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 240,
    );
    const shieldId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 240,
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
    expect(
      state.pendingChoice?.source.startsWith(
        "runner.installed_resource_trash_for_credits",
      ),
    ).toBe(true);
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
    let state = toRunnerTurn(
      v193CardReleaseGame("spotcheck-jack-attack-hardening"),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpCardOnTopOfRd(state, 596);
    putCorpIceOnServer(state, "rd", 463);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", 463);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.jackOutLockedForRun).toBe(true);
    expect(state.trace).toMatchObject({
      traceLimit: 5,
      sourceDefinitionId: 463,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: 463,
    });
    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceSuccessful: true,
      tagsAdded: 1,
      traceLimit: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "jack_out",
      ),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run).toBeUndefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves HQ Ice Swap as a hidden-info-safe once-per-run HQ ICE swap", () => {
    const singaporeCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
      id: "spotcheck_singapore_city_grid_corp",
      name: "Spotcheck HQ Ice Swap Corp",
      cards: [
        { id: 581, quantity: 1 },
        { id: 589, quantity: 1 },
        { id: 590, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
          (card) =>
            card.id !== 581 &&
            card.id !== 589 &&
            card.id !== 590,
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
      581,
    );
    state.cardInstances[singaporeId] = {
      ...state.cardInstances[singaporeId]!,
      faceup: true,
      rezzed: true,
    };
    const installedIceId = putCorpIceOnServer(
      state,
      "remote_1",
      589,
    );
    const hqIceId = moveCorpCardToHq(state, 590);
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
        action.payload?.v1918UpgradeAbility === "hq_ice_swap",
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
      590,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "hq_ice_swap_choice",
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
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
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
    expect(JSON.stringify(runnerServer)).not.toContain(590);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_ice_swap_swap",
      sourceDefinitionId: 581,
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
        (action) => action.payload?.v1918UpgradeAbility === "hq_ice_swap",
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
        { id: 576, quantity: 1 },
        { id: 589, quantity: 1 },
        { id: 590, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
          (card) =>
            card.id !== 576 &&
            card.id !== 589 &&
            card.id !== 590,
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
    const omniId = putCorpRootInRemote(state, 576);
    state.cardInstances[omniId] = {
      ...state.cardInstances[omniId]!,
      faceup: true,
      rezzed: true,
    };
    const installedIceId = putCorpIceOnServer(
      state,
      "remote_1",
      589,
    );
    const hqIceId = moveCorpCardToHq(state, 590);
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
        (action) =>
          action.payload?.v1918UpgradeAbility === "tag_condition_credit",
      ),
    ).toBe(false);
    const swapAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1918UpgradeAbility === "hq_ice_swap" &&
        action.payload?.cardId === omniId,
    );
    state = apply(
      state,
      "corp",
      (action) => action.actionId === swapAction.actionId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      590,
    );

    state = applyChoice(state, "corp", `card_${hqIceId}`);
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(remote?.ice[0]).toBe(hqIceId);
    expect(state.corp.hq).toContain(installedIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_ice_swap_swap",
      sourceDefinitionId: 576,
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
  it("keeps Secret Spend Compare private, rejects invalid choices and no-ops short R&D", () => {
    let state = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-too-many-doors"),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    installRunnerProgramForTest(state, 235);
    putCorpIceOnServer(state, "rd", 484);

    state = encounterIce(state, "rd", 484);
    const opened = apply(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(opened.pendingChoice?.source).toContain(
      "card_implementation.secret_spend_compare",
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
      actionId: mustAction(
        opened,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
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
    installRunnerProgramForTest(brokenState, 235);
    putCorpIceOnServer(brokenState, "rd", 484);
    const rdBeforeBroken = brokenState.corp.rd.slice();
    brokenState = encounterIce(brokenState, "rd", 484);
    brokenState = breakCurrentSubroutine(
      brokenState,
      235,
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
      originalsetReorderCounterRunlockGame(
        "spotcheck-too-many-doors-losing-bid",
      ),
    );
    losingBidState.runner.credits = 30;
    losingBidState.corp.credits = 30;
    installRunnerProgramForTest(losingBidState, 235);
    putCorpIceOnServer(losingBidState, "rd", 484);
    losingBidState = encounterIce(
      losingBidState,
      "rd",
      484,
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
      corpCreditsAfter: losingCorpCreditsBeforeReveal,
      runnerCreditsAfter: losingRunnerCreditsBeforeReveal - 1,
    });
  });

  it("does not invent I Spy's removed stack-reveal action", () => {
    let state = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-i-spy"),
    );
    state.runner.credits = 20;
    const iSpyId = moveRunnerCardToGrip(state, 244);
    putRunnerCardOnTopOfStack(state, 597);
    putRunnerCardOnTopOfStack(state, 591);

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.v1912CounterAbility === "reveal_stack_top",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === iSpyId,
    );

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
    installRunnerProgramForTest(fatalState, 235);
    putCorpIceOnServer(fatalState, "rd", 589);
    putCorpIceOnServer(fatalState, "rd", 454);
    fatalState = encounterIce(fatalState, "rd", 454);
    fatalState = breakCurrentSubroutine(fatalState, 235, 0);
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(fatalState.run?.nextEncounterFatalDamage ?? 0).toBe(0);

    let clearedState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-fatal-run-end"),
    );
    clearedState.runner.credits = 30;
    clearedState.corp.credits = 30;
    putCorpIceOnServer(clearedState, "rd", 589);
    putCorpIceOnServer(clearedState, "rd", 454);
    clearedState = encounterIce(
      clearedState,
      "rd",
      454,
    );
    clearedState = apply(
      clearedState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(clearedState.run?.nextEncounterFatalDamage).toBe(3);
    clearedState = apply(
      clearedState,
      "runner",
      (action) => action.type === "jack_out",
    );
    expect(clearedState.run).toBeUndefined();

    let shockState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-shock-r"),
    );
    shockState.runner.credits = 30;
    shockState.corp.credits = 30;
    installRunnerProgramForTest(shockState, 226);
    putCorpIceOnServer(shockState, "rd", 590);
    putCorpIceOnServer(shockState, "rd", 480);
    shockState = encounterIce(shockState, "rd", 480);
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(shockState.run?.nextEncounterJackOutLock).toBe(true);
    expect(
      getLegalActions(shockState, "runner").some(
        (action) => action.type === "jack_out",
      ),
    ).toBe(false);
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
    expect(shockState.run?.noBreakSubroutinesActive).toBe(true);
    expect(
      getLegalActions(shockState, "runner").some(
        (action) => action.type === "break_subroutine",
      ),
    ).toBe(false);
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(shockState.run?.noBreakSubroutinesActive ?? false).toBe(false);
    expect(shockState.run?.jackOutLockedUntilEncounterEnds ?? false).toBe(
      false,
    );
  });

  it("keeps D'Arc Knight, Razor Wire and Liche subroutines independently breakable and redacted", () => {
    let dArcState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-darc-knight"),
    );
    dArcState.runner.credits = 50;
    dArcState.corp.credits = 50;
    const dArcTargetId = installRunnerProgramForTest(
      dArcState,
      591,
    );
    installRunnerProgramForTest(dArcState, 235);
    putCorpIceOnServer(dArcState, "rd", 445);
    dArcState = encounterIce(dArcState, "rd", 445);
    dArcState = breakCurrentSubroutine(dArcState, 235, 0);
    dArcState = apply(
      dArcState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(dArcState.runner.heap).not.toContain(dArcTargetId);
    expect(dArcState.run).toBeUndefined();

    let razorState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-razor-wire"),
    );
    razorState.runner.credits = 50;
    razorState.corp.credits = 50;
    installRunnerProgramForTest(razorState, 233);
    putCorpIceOnServer(razorState, "rd", 474);
    razorState = encounterIce(razorState, "rd", 474);
    const gripBeforeRazor = razorState.runner.grip.length;
    razorState = breakCurrentSubroutine(razorState, 233, 1);
    const initial = structuredClone(razorState);
    const replayStart = razorState.eventLog.length;
    razorState = apply(
      razorState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(razorState.runner.grip.length).toBe(gripBeforeRazor - 2);
    expect(razorState.run).toBeDefined();
    expect(razorState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
    });
    expect(
      JSON.stringify(razorState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"grip"|"privatePayload"|"cardInstances"/);
    const replay = replayEvents(
      initial,
      razorState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(razorState));

    let licheState = toRunnerTurn(
      originalsetReorderCounterRunlockGame("spotcheck-liche"),
    );
    licheState.runner.credits = 50;
    licheState.corp.credits = 50;
    installRunnerProgramForTest(licheState, 218);
    putCorpIceOnServer(licheState, "rd", 466);
    licheState = encounterIce(licheState, "rd", 466);
    licheState = breakCurrentSubroutine(
      licheState,
      218,
      1,
    );
    licheState = breakCurrentSubroutine(
      licheState,
      218,
      3,
    );
    const coreBefore = licheState.runner.coreDamage;
    licheState = apply(
      licheState,
      "runner",
      (action) => action.type === "continue_run",
    );
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
    putCorpIceOnServer(state, "rd", 439);
    putCorpIceOnServer(state, "rd", 467);
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
        sourceDefinition(state, action) === 467,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.grip.length).toBe(gripBefore - 2);
    expect(state.run?.futureEncounterIceStrengthBonus).toBe(1);
    expect(state.trace).toMatchObject({
      sourceDefinitionId: 467,
      traceLimit: 5,
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
            { id: 465, quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) => card.id !== 465,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 30;
    putCorpIceOnServer(state, "rd", 465);
    state = encounterIce(state, "rd", 465);
    const gripBefore = state.runner.grip.length;
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "printed_subroutines_damage_net,printed_subroutines_end_the_run",
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
      sourceDefinitionId: 465,
      damageResolved: true,
      damageType: "net",
      damageAmount: 1,
      resolvedEffects: [
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: 465,
          sourceTitle: "Laser Wire",
          subroutineIndex: 0,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 1,
          cardsTrashed: 1,
        },
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: 465,
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

  it("does not offer Chicago Branch activation without an installed advanceable target", () => {
    let state = apply(
      originalsetReorderCounterRunlockGame("chicago-branch-no-target"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const chicagoId = putCorpRootInRemote(state, 524);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        String(action.payload?.cardId) === chicagoId,
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === chicagoId,
      ),
    ).toBe(false);

    putCorpRootInRemote(state, 588);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === chicagoId,
      ),
    ).toBe(true);
  });

  it("keeps Chicago Branch, Vapor Ops and Corporate Retreat source-bound", () => {
    let state = apply(
      originalsetReorderCounterRunlockGame("spotcheck-assets-agenda"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const chicagoId = putCorpRootInRemote(state, 524);
    const vaporId = putCorpRootInRemote(state, 559);
    const agendaId = putCorpRootInRemote(state, 588);
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
        action.type === "rez_card" &&
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
    const chicagoPayload = state.eventLog.at(-1)?.publicPayload;
    expect(chicagoPayload).toMatchObject({
      sourceDefinitionId: 524,
      addedAdvancementCounters: 2,
      publicTargetCount: 0,
      hiddenTargetCount: 1,
      targetVisibility: "hidden_installed_card",
    });
    expect(chicagoPayload).not.toHaveProperty("targetCardDefinitionId");

    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 1,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        String(action.payload?.cardId) === vaporId,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === vaporId &&
        action.payload?.cardImplementationAbilityLabel ===
          "Vapor Ops: Advancement-Counter für 1 Credit ausgeben",
    );
    expect(state.cardInstances[vaporId]?.advancementCounters).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 559,
      gainedCredits: 1,
    });

    const retreatId = scoreCorpAgendaForTest(
      state,
      407,
    );
    setCardCounterForTest(state, retreatId, "mark", 1);
    const retreatAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility ===
          "scored_agenda_credit_until_install_or_rez",
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

  it("offers Vapor Ops in the Corp rez window during a run", () => {
    let state = apply(
      originalsetReorderCounterRunlockGame("vapor-ops-run-rez-window"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    const vaporId = putCorpRootInRemote(state, 559);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === vaporId,
    );
    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 1,
    };
    state = toRunnerTurnFromCorpMain(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    const vaporAction = getLegalActions(state, "corp").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === vaporId &&
        action.payload?.cardImplementationAbilityLabel ===
          "Vapor Ops: Advancement-Counter für 1 Credit ausgeben",
    );
    expect(vaporAction).toBeDefined();

    state = apply(
      state,
      "corp",
      (action) => action.actionId === vaporAction!.actionId,
    );
    expect(state.cardInstances[vaporId]?.advancementCounters).toBe(0);
  });

  it("keeps both player views usable after paying Misleading Access Menus with rezzed Vapor Ops", () => {
    let state = apply(
      originalsetReorderCounterRunlockGame("vapor-ops-after-pay-or-end-run"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    const vaporId = putCorpRootInRemote(state, 559);
    state.cardInstances[vaporId]!.advancementCounters = 1;
    const iceId = putCorpIceOnServer(state, "remote_1", 590);
    state.cardInstances[iceId]!.definitionId =
      90;
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 1;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === vaporId,
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.timingPoint).toBe("run.encounter_ice");
    const beforePayment = structuredClone(state);
    state = apply(
      state,
      "runner",
      (action) => action.payload?.payOrEndRunSubroutinePayment === 1,
    );

    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      runDestination: "root",
    });
    expect(
      hashState(
        apply(
          beforePayment,
          "runner",
          (action) => action.payload?.payOrEndRunSubroutinePayment === 1,
        ),
      ),
    ).toBe(hashState(state));
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceDefinitionId: 90,
          paidCredits: 1,
        }),
      ]),
    );
    expect(state.run?.phase).toBe("movement");
    expect(() => getPlayerView(state, "runner")).not.toThrow();
    expect(() => getPlayerView(state, "corp")).not.toThrow();
    const vaporActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" && action.source === vaporId,
    );
    expect(vaporActions).toHaveLength(1);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === vaporActions[0]!.actionId,
    );
    expect(state.cardInstances[vaporId]!.advancementCounters).toBe(0);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("labels Vapor Ops advancement move choices with counter amount and target", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-vapor-ops-move-labels"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const vaporId = putCorpRootInRemote(state, 559);
    const simpleAgendaId = putCorpRootInRemote(state, 588);
    const geneticsVisionaryId = putCorpRootInRemote(
      state,
      414,
    );
    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 3,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        String(action.payload?.cardId) === vaporId,
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
    expect(corpChoice?.prompt).toBe("Vapor Ops: Advancement-Counter bewegen");
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
    expect(state.cardInstances[geneticsVisionaryId]?.advancementCounters).toBe(
      3,
    );
    const vaporMovePayload = state.eventLog.at(-1)?.publicPayload;
    expect(vaporMovePayload).toMatchObject({
      sourceDefinitionId: 559,
      advancementCounterSourceDefinitionId: 559,
      advancementCounterSourceVisibility: "public",
      advancementCounterTargetVisibility: "hidden_installed_card",
    });
    expect(vaporMovePayload).not.toHaveProperty(
      "advancementCounterTargetDefinitionId",
    );
    expect(JSON.stringify(vaporMovePayload)).not.toMatch(
      /Simple Agenda|Genetics-Visionary Acquisition|privatePayload|cardInstances/,
    );
    expect(JSON.stringify(vaporMovePayload)).not.toContain(geneticsVisionaryId);
  });

  it("does not offer Vapor Ops advancement movement without a distinct legal target", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-vapor-ops-no-move-target"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 50;
    state.corp.clicks = 50;

    const vaporId = putCorpRootInRemote(state, 559);
    state.cardInstances[vaporId] = {
      ...state.cardInstances[vaporId]!,
      advancementCounters: 3,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        String(action.payload?.cardId) === vaporId,
    );

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === vaporId &&
          action.payload?.cardImplementationAbilityLabel ===
            "Vapor Ops: Advancement-Counter bewegen",
      ),
    ).toBe(false);
  });
});
