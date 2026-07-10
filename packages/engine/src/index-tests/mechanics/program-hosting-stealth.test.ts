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
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.16 Program Subtype/Hosting/Stealth WIP", () => {
  it("adds all V1.9.16 WIP runtime definitions without release-promoting the next slice", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.programSubtypeHosting).toHaveLength(16);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.programSubtypeHosting) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /memory|base_link|trace|stealth|hosting|trash_installed_program/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("uses installed V1.9.16 link cards in side-safe trace windows", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.programSubtypeHosting("v1916-link-trace"));
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_003_baedekers-net-map");
    moveRunnerCardToGrip(state, "onr_v1_148_access-through-alpha");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_003_baedekers-net-map",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_148_access-through-alpha",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");

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
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.side).toBe("corp");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 4,
    });

    state = applyChoice(state, "corp", "bid_1");

    expect(state.trace).toMatchObject({
      status: "base_link",
      corpBid: 1,
      traceStrength: 5,
      runnerLink: 0,
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "pass",
        expect.stringMatching(/^trace_base_link_/),
      ]),
    );
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(
        state,
        "onr_v1_148_access-through-alpha",
        "trace_base_link_",
      ),
    );
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 5,
      runnerLink: 9,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").pendingChoice?.kind).toBe(
      "bid_amount",
    );
  });

  it("refreshes V1.9.16 stealth and recurring counters without accumulation", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("v1916-stealth-recurring"),
    );
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_035_invisibility");
    moveRunnerCardToGrip(state, "onr_v1_140_raven-microcyb-eagle");
    moveRunnerCardToGrip(state, "onr_v1_141_raven-microcyb-owl");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_035_invisibility",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_140_raven-microcyb-eagle",
    );
    const eagleId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_140_raven-microcyb-eagle",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_141_raven-microcyb-owl",
    );

    const invisibilityId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_035_invisibility",
    );
    const owlId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_141_raven-microcyb-owl",
    );
    expect(invisibilityId).toBeDefined();
    expect(eagleId).toBeDefined();
    expect(owlId).toBeDefined();
    if (!invisibilityId || !eagleId || !owlId)
      throw new Error("Missing installed V1.9.16 recurring cards");
    expect(
      state.cardInstances[invisibilityId]?.counters?.bit,
    ).toBe(1);
    expect(state.runner.heap).toContain(eagleId);
    expect(state.runner.rig.hardware).not.toContain(eagleId);
    expect(state.cardInstances[owlId]?.counters?.bit).toBe(3);

    state.cardInstances[invisibilityId] = {
      ...state.cardInstances[invisibilityId]!,
      counters: {
        ...state.cardInstances[invisibilityId]!.counters,
        bit: 0,
      },
    };
    state.cardInstances[owlId] = {
      ...state.cardInstances[owlId]!,
      counters: {
        ...state.cardInstances[owlId]!.counters,
        bit: 0,
      },
    };
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(
      state.cardInstances[invisibilityId]?.counters?.bit,
    ).toBe(1);
    expect(state.cardInstances[owlId]?.counters?.bit).toBe(3);
  });

  it("hosts V1.9.16 programs on Imp and keeps hosted-card trash deterministic", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("v1916-imp-hosting-lifecycle"),
    );
    state.runner.credits = 12;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_033_imp");
    moveRunnerCardToGrip(state, "onr_v1_004_bakdoor");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_033_imp",
    );
    const impId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_033_imp",
    );
    expect(impId).toBeDefined();
    if (!impId) throw new Error("Missing installed Imp host");

    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_004_bakdoor" &&
        action.payload?.hostOnCardId === impId,
    );
    const bakdoorId = String(hostedInstall.payload?.cardId ?? "");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );

    expect(state.cardInstances[bakdoorId]?.hostedOn).toBe(impId);
    expect(state.runner.memoryUsed).toBe(1);
    expect(
      getPlayerView(state, "runner").own.rig?.some(
        (card) => card.instanceId === bakdoorId && card.hostedOn === impId,
      ),
    ).toBe(true);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.instanceId === bakdoorId && card.hostedOn === impId,
      ),
    ).toBe(true);

    const dArcKnightId = "v1916_imp_host_trash_ice" as CardInstanceId;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice.push(dArcKnightId);
    state.cardInstances[dArcKnightId] = {
      instanceId: dArcKnightId,
      definitionId: "onr_v1_233_d-arc-knight",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const initial = structuredClone(state);

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
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.rig.programs).toContain(impId);
    expect(state.runner.rig.programs).not.toContain(bakdoorId);
    expect(state.runner.heap).toContain(bakdoorId);
    expect(state.cardInstances[bakdoorId]?.hostedOn).toBeUndefined();
    expect(state.runner.memoryUsed).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("gates Fragmentation Storm program trash and run lock on trace success", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("v1916-fragmentation-storm-success"),
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
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_047_pile-driver",
    );
    expect(pileDriverId).toBeDefined();
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    const initial = structuredClone(state);

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
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 0,
      runnerRunEnded: true,
      runnerRunLockCreditCost: 1,
      trashedCardDefinitionId: "onr_v1_047_pile-driver",
      trashedCardType: "program",
      trashedCount: 1,
    });

    expect(pileDriverId && state.runner.heap.includes(pileDriverId)).toBe(true);
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
    const successReplay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(successReplay.ok).toBe(true);
    expect(successReplay.actualFinalStateHash).toBe(hashState(state));

    let failed = initial;
    failed.runner.credits = 10;
    failed = apply(
      failed,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    failed = apply(
      failed,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(failed, action) === "onr_v1_246_fragmentation-storm",
    );
    failed = apply(
      failed,
      "runner",
      (action) => action.type === "continue_run",
    );
    failed = applyChoice(failed, "corp", "bid_0");
    failed = applyChoice(failed, "runner", "bid_4");
    failed = apply(
      failed,
      "runner",
      (action) => action.type === "continue_run",
    );

    expect(
      pileDriverId && failed.runner.rig.programs.includes(pileDriverId),
    ).toBe(true);
    expect(failed.run).toBeDefined();
    expect(validateGameState(failed).ok).toBe(true);
    const failedReplay = replayEvents(
      initial,
      failed.eventLog.slice(initial.eventLog.length),
    );
    expect(failedReplay.ok).toBe(true);
    expect(failedReplay.actualFinalStateHash).toBe(hashState(failed));
  });
});
