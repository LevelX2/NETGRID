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
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("MVP 0.99 Hosting, Viren, Purge und Counter-Familien", () => {
  it("creates deterministic V0.99 games with additive counter and hosting contracts", () => {
    const first = v099CounterHostingGame("v099-baseline");
    const second = v099CounterHostingGame("v099-baseline");

    expect(first.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.99",
    );
    expect(first.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.99");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).toContain("hosting");
    expect(DEMO_CARDS_BY_ID.v099_virus_program?.mechanics).toContain("virus");
    expect(DEMO_CARDS_BY_ID.v099_recurring_chip?.recurringCredits).toBe(1);
    expect(hashState(first)).toBe(hashState(second));
    expect(validateGameState(first).ok).toBe(true);
  });

  it("installs a virus program and lets the Corp purge only virus counters", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-virus-purge"));
    state.runner.credits = 3;
    moveRunnerCardToGrip(state, "v099_virus_program");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v099_virus_program",
    );
    const virusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "v099_virus_program",
    );
    expect(virusId).toBeDefined();
    if (!virusId) throw new Error("Missing virus program");
    state.cardInstances[virusId] = {
      ...state.cardInstances[virusId]!,
      counters: { ...state.cardInstances[virusId]!.counters, power: 2 },
    };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 0;
    const initial = structuredClone(state);
    const oneClickTwoCreditsState = structuredClone(state);
    oneClickTwoCreditsState.corp.clicks = 1;
    oneClickTwoCreditsState.corp.credits = 2;

    expect(
      getLegalActions(oneClickTwoCreditsState, "corp").map((action) => action.type),
    ).not.toContain("purge_virus_counters");

    const purge = mustAction(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );

    expect(state.corp.clicks).toBe(0);
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[virusId]?.counters?.virus).toBeUndefined();
    expect(state.cardInstances[virusId]?.counters?.power).toBe(2);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionCostClicks: 3,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 3,
      purgedCounterType: "virus",
      purgedVirusCounters: 1,
    });
    expect(state.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
    expect(
      getLegalActions(state, "corp").map((action) => action.type),
    ).not.toContain("purge_virus_counters");
  });

  it("hosts a Runner program through a private choice and trashes hosted cards with the host", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-hosting"));
    state.runner.credits = 2;
    const hostCandidate = moveRunnerCardToGrip(state, "v099_host_resource");
    const hostedCandidate = moveRunnerCardToGrip(state, "simple_decoder");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && action.source === hostCandidate,
    );

    expect(state.pendingChoice?.source).toContain("v099.host_program");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Decoder",
    );

    state = applyChoice(state, "runner", `card_${hostedCandidate}`);

    expect(state.cardInstances[hostedCandidate]?.hostedOn).toBe(hostCandidate);
    expect(state.runner.rig.programs).toContain(hostedCandidate);
    expect(validateGameState(state).ok).toBe(true);
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === hostCandidate,
    );

    expect(state.runner.heap).toContain(hostCandidate);
    expect(state.runner.heap).toContain(hostedCandidate);
    expect(state.cardInstances[hostedCandidate]?.hostedOn).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(hostedCandidate);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("uses recurring credits for program installs and refreshes without accumulation", () => {
    let state = toRunnerTurn(v099CounterHostingGame("v099-recurring"));
    state.runner.credits = 0;
    const chip = moveRunnerCardToGrip(state, "v099_recurring_chip");
    const virus = moveRunnerCardToGrip(state, "v099_virus_program");

    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.source === chip,
    );
    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "install_card" && action.source === virus,
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.source === virus,
    );
    expect(state.runner.credits).toBe(0);
    expect(
      state.cardInstances[chip]?.counters?.recurring_credit,
    ).toBeUndefined();
    expect(state.cardInstances[virus]?.counters?.virus).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );

    expect(state.cardInstances[chip]?.counters?.recurring_credit).toBe(1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("creates and spends Bad Publicity credits during a run only", () => {
    let state = v099CounterHostingGame("v099-bad-publicity");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v099_bad_publicity_operation");
    keepOnlyCorpHqCards(state, state.corp.hq.slice(0, 1));
    state.corp.credits = 0;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v099_bad_publicity_operation",
    );
    expect(state.corp.badPublicity).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      badPublicityAfter: 1,
    });

    state = apply(state, "corp", (action) => action.type === "end_turn");
    installRunnerProgramForTest(state, "simple_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.runner.credits = 0;
    state.corp.credits = 10;
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.run?.badPublicityCredits).toBe(1);
    expect(getPlayerView(state, "runner").run?.badPublicityCredits).toBe(1);
    const laterBadPublicityChange = structuredClone(state);
    laterBadPublicityChange.corp.badPublicity = 2;
    expect(laterBadPublicityChange.run?.badPublicityCredits).toBe(1);
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "pump_breaker");

    expect(state.run?.badPublicityCredits).toBe(0);
    expect(state.runner.credits).toBe(0);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("does not expose M11+ mechanics while enabling V0.99 harness cards", () => {
    const state = toRunnerTurn(v099CounterHostingGame("v099-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain(
      "prevention",
    );
    expect(DEMO_CARDS_BY_ID.v099_host_resource?.mechanics).not.toContain(
      "replacement",
    );
    expect(DEMO_CARDS_BY_ID.v099_virus_program?.mechanics).not.toContain(
      "set_aside",
    );
    expect(
      DEMO_CARDS_BY_ID.v099_bad_publicity_operation?.mechanics,
    ).not.toContain("remove_from_game");
  });
});

describe("V1.9.12 Counter/Virus/Recurring", () => {
  it("adds scoped V1.9.12 definitions without pulling in later cursor cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.counterRecurring).toHaveLength(11);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.counterRecurring) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /counter|virus|recurring|hidden_zone/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("installs V1.9.12 virus cards and Rigged Investments bit depot, then purges only virus counters", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.counterRecurring("v1912-virus-recurring"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_009_butcher-boy");
    moveRunnerCardToGrip(state, "onr_v1_010_cascade");
    moveRunnerCardToGrip(state, "onr_v1_174_rigged-investments");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_009_butcher-boy",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_010_cascade",
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
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const butcherId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_009_butcher-boy",
    );
    const investmentsId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_174_rigged-investments",
    );
    const cascadeId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_010_cascade",
    );
    expect(butcherId).toBeDefined();
    expect(cascadeId).toBeDefined();
    expect(investmentsId).toBeDefined();
    if (butcherId) {
      expect(state.cardInstances[butcherId]?.counters?.virus ?? 0).toBe(0);
      expect(
        state.cardInstances[butcherId]?.counters?.recurring_credit ?? 0,
      ).toBe(0);
    }
    if (cascadeId) {
      expect(state.cardInstances[cascadeId]?.counters?.virus ?? 0).toBe(0);
      expect(
        state.cardInstances[cascadeId]?.counters?.recurring_credit,
      ).toBeUndefined();
    }
    if (investmentsId)
      expect(
        state.cardInstances[investmentsId]?.counters?.bit,
      ).toBe(12);
    if (cascadeId) setCardCounterForTest(state, cascadeId, "virus", 1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    if (butcherId) {
      expect(state.cardInstances[butcherId]?.counters?.virus ?? 0).toBe(0);
      expect(
        state.cardInstances[butcherId]?.counters?.recurring_credit ?? 0,
      ).toBe(0);
    }
    if (cascadeId) {
      expect(state.cardInstances[cascadeId]?.counters?.virus ?? 0).toBe(0);
      expect(
        state.cardInstances[cascadeId]?.counters?.recurring_credit,
      ).toBeUndefined();
    }
    if (investmentsId) {
      expect(state.cardInstances[investmentsId]?.counters?.bit).toBe(12);
      expect(
        state.cardInstances[investmentsId]?.counters?.recurring_credit,
      ).toBeUndefined();
      state.cardInstances[investmentsId] = {
        ...state.cardInstances[investmentsId]!,
        counters: {
          ...state.cardInstances[investmentsId]!.counters,
          bit: 1,
        },
      };
    }

    state.corp.maxHandSize = 100;
    const runnerCreditsBeforeStart = state.runner.credits;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (investmentsId) {
      expect(state.runner.credits).toBe(runnerCreditsBeforeStart + 1);
      expect(state.runner.rig.resources).not.toContain(investmentsId);
      expect(state.runner.heap).toContain(investmentsId);
    }
  });

  it("uses V1.9.12 Militech and Hunt Club BBS paths without exposing choices to the Corp", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.counterRecurring("v1912-hidden-zone"));
    state.runner.credits = 20;
    const dealId = moveRunnerCardToGrip(state, "onr_v1_082_deal-with-militech");
    const huntClubId = moveRunnerCardToGrip(state, "onr_v1_091_hunt-club-bbs");
    const breakerId = installRunnerProgramForTest(state, "simple_decoder");
    const exposedIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleResearchAgendaThisTurn: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === dealId,
    );
    expect(cardCounterAmount(state, breakerId, "militech")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      counterType: "militech",
      addedCounterAmount: 1,
      targetCount: 1,
    });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === huntClubId,
    );
    expect(state.pendingChoice?.source).toContain("p3_36.expose_installed_cards");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner").pendingChoice)).not.toContain(
      "Simple Upgrade",
    );
    expect(JSON.stringify(getPlayerView(state, "runner").pendingChoice)).not.toMatch(
      /"value"|simple_barrier_ice/,
    );
    const optionId = state.pendingChoice?.options.find(
      (option) => option.value === exposedIceId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "expose",
      revealedCount: 1,
      publicRevealDefinitionIds: "simple_barrier_ice",
    });
  });

  it("adds Butcher Boy counters from successful HQ runs and pays start-turn credits from pairs", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.counterRecurring("v1912-butcher-boy"));
    state.runner.credits = 20;
    const butcherId = installRunnerProgramForTest(
      state,
      "onr_v1_009_butcher-boy",
    );

    for (let index = 0; index < 2; index += 1) {
      for (const cardId of state.corp.hq.slice()) {
        removeEverywhere(state, cardId);
        state.corp.archives.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
        };
      }
      moveCorpCardToHq(state, "simple_economy_operation");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
    }

    expect(cardCounterAmount(state, butcherId, "virus")).toBe(2);
    const creditsBeforeTurn = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(creditsBeforeTurn + 1);
  });

  it("scores V1.9.12 Corp agendas with typed counter and start-of-turn economy paths", () => {
    expect(
      DEMO_CARDS_BY_ID["onr_v1_198_detroit-police-contract"]?.rulesText,
    ).toBe(
      "Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.",
    );
    expect(
      DEMO_CARDS_BY_ID["onr_v1_198_detroit-police-contract"]
        ?.advancementRequirement,
    ).toBe(4);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_198_detroit-police-contract"]?.agendaPoints,
    ).toBe(1);
    let state = apply(
      MECHANIC_SMOKE_GAMES.counterRecurring("v1912-corp-agendas"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_198_detroit-police-contract");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_198_detroit-police-contract" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1)
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_198_detroit-police-contract",
      );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) ===
          "onr_v1_198_detroit-police-contract",
    );
    const detroitId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_198_detroit-police-contract",
    );
    expect(detroitId).toBeDefined();
    if (detroitId) expect(cardCounterAmount(state, detroitId, "bit")).toBe(12);
    if (detroitId) {
      expect(
        getPlayerView(state, "corp").own.scoreArea.find(
          (card) => card.instanceId === detroitId,
        )?.counterDisplays,
      ).toContainEqual({
        id: "stored_credits",
        amount: 12,
        displayKind: "stored_credits",
        label: "Credits",
        ariaLabel: "12 gespeicherte Credits",
        counterType: "bit",
        usageHint: "spendable",
        creditPool: { kind: "stored_credit" },
      });
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_198_detroit-police-contract",
      hostedCreditsAdded: 12,
      hostedCreditsAfter: 12,
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.agendaAbility === "v1912_detroit_police_contract",
      ),
    ).toBe(false);
    if (detroitId) {
      const stolen = structuredClone(state);
      stolen.corp.scoreArea = stolen.corp.scoreArea.filter(
        (id) => id !== detroitId,
      );
      stolen.runner.scoreArea.push(detroitId);
      stolen.cardInstances[detroitId] = {
        ...stolen.cardInstances[detroitId]!,
        zone: { side: "runner", zone: "scoreArea" },
      };
      const creditsBeforeStolenTurn = stolen.corp.credits;
      const afterRunnerTurn = toRunnerTurnFromCorpMain(stolen);
      const afterStolenTurn = apply(
        afterRunnerTurn,
        "runner",
        (action) => action.type === "end_turn",
      );
      expect(afterStolenTurn.corp.credits).toBe(creditsBeforeStolenTurn);
      expect(cardCounterAmount(afterStolenTurn, detroitId, "bit")).toBe(12);
    }
    const beforeCredit = state.corp.credits;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(beforeCredit + 2);
    if (detroitId) expect(cardCounterAmount(state, detroitId, "bit")).toBe(10);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "take_hosted_credits",
        amount: 2,
        remainingCounters: 10,
        reason: "start_of_turn",
        sourceDefinitionId: "onr_v1_198_detroit-police-contract",
      }),
    );
  });
});
