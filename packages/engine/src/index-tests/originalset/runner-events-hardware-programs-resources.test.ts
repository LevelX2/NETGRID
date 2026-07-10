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

describe("Originalset Spotcheck 2026-05-16 Runner Event/Hardware Prevention hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps runner events source-bound, hidden-zone safe and replayable", () => {
    let mit = toRunnerTurn(v123CardReleaseGame("spotcheck-mit-west-tier"));
    mit.runner.credits = 20;
    emptyRunnerGripForTest(mit);
    const mitId = moveRunnerCardToGrip(mit, "onr_v1_101_mit-west-tier");
    const mitAction = mustAction(
      mit,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === mitId,
    );
    const mitRemoved = structuredClone(mit);
    removeEverywhere(mitRemoved, mitId);
    const mitDrift = applyAction(mitRemoved, {
      matchId: mitRemoved.matchId,
      side: "runner",
      actionId: mitAction.actionId,
      clientKnownStateVersion: mitRemoved.stateVersion,
      idempotencyKey: "spotcheck-mit-removed-source",
    });
    expect(mitDrift.ok).toBe(false);
    const mitInitial = structuredClone(mit);
    const mitReplayStart = mit.eventLog.length;
    mit = apply(mit, "runner", (action) => action.actionId === mitAction.actionId);
    expect(mit.specialZones?.removedFromGame).toContain(mitId);
    expect(mit.runner.grip).toHaveLength(5);
    expect(mit.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_101_mit-west-tier",
      hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
      drawnCount: 5,
    });
    expect(JSON.stringify(mit.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const mitReplay = replayEvents(mitInitial, mit.eventLog.slice(mitReplayStart));
    expect(mitReplay.ok).toBe(true);
    expect(hashState(mitReplay.state)).toBe(hashState(mit));

    let score = toRunnerTurn(onrV1Game("spotcheck-score-event"));
    score.runner.credits = 20;
    const scoreId = moveRunnerCardToGrip(score, "onr_v1_108_score");
    const scoreLegal = mustAction(
      score,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === scoreId,
    );
    const scoreStale = applyAction(score, {
      matchId: score.matchId,
      side: "runner",
      actionId: scoreLegal.actionId,
      clientKnownStateVersion: score.stateVersion - 1,
      idempotencyKey: "spotcheck-score-stale",
    });
    expect(scoreStale.ok).toBe(false);
    if (!scoreStale.ok) expect(scoreStale.error.code).toBe("ERR_STALE_STATE");
    const scoreInitial = structuredClone(score);
    const scoreReplayStart = score.eventLog.length;
    const scoreCreditsBefore = score.runner.credits;
    score = apply(score, "runner", (action) => action.actionId === scoreLegal.actionId);
    expect(score.runner.credits).toBe(scoreCreditsBefore + 4);
    expect(score.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_108_score",
      gainedCredits: 9,
      runnerCreditsAfter: score.runner.credits,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 9,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_108_score",
        }),
      ],
    });
    expect(replayEvents(scoreInitial, score.eventLog.slice(scoreReplayStart)).ok).toBe(true);

    let total = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-total-genetic-retrofit"),
    );
    total.runner.credits = 20;
    total.runner.tags = 3;
    moveRunnerCardToGrip(total, "onr_v1_116_total-genetic-retrofit");
    const totalInitial = structuredClone(total);
    const totalReplayStart = total.eventLog.length;
    total = apply(
      total,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(total, action) === "onr_v1_116_total-genetic-retrofit",
    );
    expect(total.runner.tags).toBe(0);
    expect(total.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_116_total-genetic-retrofit",
      removedTags: 3,
      runnerTagsAfter: 0,
    });
    expect(JSON.stringify(total.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(replayEvents(totalInitial, total.eventLog.slice(totalReplayStart)).ok).toBe(true);
  });

  it("keeps run, stack-search and reprisal events side-safe and replayable", () => {
    let social = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-social-engineering",
        runnerDeck: MECHANIC_SMOKE_DECKS.runAccess.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          id: "spotcheck_social_engineering_corp",
          name: "Spotcheck Social Engineering Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
              (card) => card.id !== "simple_barrier_ice",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    social.runner.credits = 20;
    moveRunnerCardToGrip(social, "onr_v1_111_social-engineering");
    const socialIceId = putCorpIceOnServer(social, "hq", "simple_barrier_ice");
    const socialAction = mustAction(
      social,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(social, action) === "onr_v1_111_social-engineering",
    );
    const socialWrongSide = applyAction(social, {
      matchId: social.matchId,
      side: "corp",
      actionId: socialAction.actionId,
      clientKnownStateVersion: social.stateVersion,
      idempotencyKey: "spotcheck-social-wrong-side",
    });
    expect(socialWrongSide.ok).toBe(false);
    const socialInitial = structuredClone(social);
    const socialReplayStart = social.eventLog.length;
    social = apply(social, "runner", (action) => action.actionId === socialAction.actionId);
    expect(social.pendingChoice?.source).toContain("hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide");
    social = applyChoice(social, "runner", "hide_3");
    social = applyChoice(social, "corp", "guess_2");
    social = applyChoice(social, "runner", `ice_${socialIceId}`);
    expect(social.run?.attackedServerId).toBe("hq");
    expect(social.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_111_social-engineering",
      secretSpendGuessRun: true,
      hiddenZoneBarrier: true,
      targets: expect.objectContaining({
        secretSpendGuessRunGuessCorrect: false,
        autoPassChosenIce: true,
      }),
    });
    expect(replayEvents(socialInitial, social.eventLog.slice(socialReplayStart)).ok).toBe(true);

    let temple = toRunnerTurn(v171CardReleaseGame("spotcheck-temple-search"));
    temple.runner.credits = 20;
    const templeId = moveRunnerCardToGrip(
      temple,
      "onr_v1_114_temple-microcode-outlet",
    );
    const selectedProgram = putRunnerCardOnTopOfStack(temple, "onr_v1_036_jackhammer");
    const templeLegal = mustAction(
      temple,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === templeId,
    );
    const templeInitial = structuredClone(temple);
    const templeReplayStart = temple.eventLog.length;
    temple = apply(temple, "runner", (action) => action.actionId === templeLegal.actionId);
    const selectedOption =
      temple.pendingChoice?.options.find((option) => option.value === selectedProgram)?.id ??
      "";
    expect(selectedOption).not.toBe("");
    temple = applyChoice(temple, "runner", selectedOption);
    expect(temple.runner.grip).toContain(selectedProgram);
    expect(temple.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      publicRevealDefinitionId: "onr_v1_036_jackhammer",
    });
    expect(JSON.stringify(temple.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(replayEvents(templeInitial, temple.eventLog.slice(templeReplayStart)).ok).toBe(true);

    let reprisal = toRunnerTurn(v190CardReleaseGame("spotcheck-terrorist-reprisal"));
    reprisal.runner.maxHandSize = 100;
    reprisal.runner.credits = 30;
    reprisal.corp.maxHandSize = 100;
    const reprisalId = moveRunnerCardToGrip(
      reprisal,
      "onr_v1_115_terrorist-reprisal",
    );
    expect(
      getLegalActions(reprisal, "runner").some(
        (action) => action.type === "play_event" && action.payload?.cardId === reprisalId,
      ),
    ).toBe(false);
    reprisal = apply(reprisal, "runner", (action) => action.type === "end_turn");
    reprisal = apply(reprisal, "corp", (action) => action.type === "mandatory_draw");
    reprisal.corp.credits = 60;
    reprisal.corp.clicks = 20;
    moveCorpCardToHq(reprisal, "onr_v1_193_corporate-coup");
    reprisal = apply(
      reprisal,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(reprisal, action) === "onr_v1_193_corporate-coup",
    );
    for (let index = 0; index < 5; index += 1) {
      reprisal = apply(
        reprisal,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(reprisal, action) === "onr_v1_193_corporate-coup",
      );
    }
    reprisal = apply(
      reprisal,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(reprisal, action) === "onr_v1_193_corporate-coup",
    );
    reprisal = apply(reprisal, "corp", (action) => action.type === "end_turn");
    const hqIds = [
      moveCorpCardToHq(reprisal, "simple_economy_operation"),
      moveCorpCardToHq(reprisal, "simple_barrier_ice"),
      moveCorpCardToHq(reprisal, "onr_v1_275_vacuum-link"),
      moveCorpCardToHq(reprisal, "onr_v1_223_banpei"),
      moveCorpCardToHq(reprisal, "onr_v1_279_wall-of-static"),
    ];
    keepOnlyCorpHqCards(reprisal, hqIds);
    const reprisalInitial = structuredClone(reprisal);
    const reprisalReplayStart = reprisal.eventLog.length;
    reprisal = apply(
      reprisal,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === reprisalId,
    );
    expect(reprisal.corp.hq).toHaveLength(0);
    expect(reprisal.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_115_terrorist-reprisal",
      hiddenZoneAction: "hq_random_discard",
      discardedCardsCount: 5,
    });
    expect(JSON.stringify(reprisal.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      replayEvents(reprisalInitial, reprisal.eventLog.slice(reprisalReplayStart)).ok,
    ).toBe(true);
  });

  it("keeps hardware installs and Dermatech prevention public-safe", () => {
    let hardware = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-hardware-installs"),
    );
    hardware.runner.credits = 30;
    hardware.runner.clicks = 10;
    for (const definitionId of [
      "onr_v1_120_armadillo-armored-road-home",
      "onr_v1_126_drifter-mobile-environment",
    ] as const) {
      moveRunnerCardToGrip(hardware, definitionId);
      hardware = apply(
        hardware,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(hardware, action) === definitionId,
      );
      expect(hardware.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(hardware.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
    }

    let dermatech = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-dermatech-prevention",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: ONR_V1_6_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    dermatech.runner.credits = 20;
    moveRunnerCardToGrip(dermatech, "onr_v1_125_dermatech-bodyplating");
    dermatech = apply(
      dermatech,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(dermatech, action) ===
          "onr_v1_125_dermatech-bodyplating",
    );
    dermatech = apply(dermatech, "runner", (action) => action.type === "end_turn");
    dermatech = apply(dermatech, "corp", (action) => action.type === "mandatory_draw");
    dermatech.runner.tags = 1;
    moveCorpCardToHq(dermatech, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(dermatech);
    const replayStart = dermatech.eventLog.length;
    dermatech = apply(
      dermatech,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(dermatech, action) === "onr_v1_301_punitive-counterstrike",
    );
    const optionId = dermatech.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(optionId).toBeDefined();
    if (!optionId) throw new Error("Missing Dermatech prevention option");
    dermatech = applyChoice(dermatech, "runner", optionId);
    expect(dermatech.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      sourceDefinitionId: "onr_v1_125_dermatech-bodyplating",
      preventedAmount: 1,
    });
    expect(JSON.stringify(dermatech.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, dermatech.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(dermatech));
  });

  it("keeps Open-Ended Mileage Program optional return source-safe", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-open-ended-mileage-program",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_open_ended_mileage_runner",
          name: "Spotcheck Open-Ended Mileage Runner",
          cards: [
            { id: "onr_v1_102_open-ended-mileage-program", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.tags = 1;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_102_open-ended-mileage-program",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === eventId,
    );
    const removed = structuredClone(state);
    removeEverywhere(removed, eventId);
    const drift = applyAction(removed, {
      matchId: removed.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: removed.stateVersion,
      idempotencyKey: "spotcheck-open-ended-removed-source",
    });
    expect(drift.ok).toBe(false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === legal.actionId);
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice?.source).toContain("card_implementation.paid_source_return_to_grip");
    state = applyChoice(state, "runner", "pay_1_return_to_grip");
    expect(state.runner.grip).toContain(eventId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      v1922RunnerEventAbility: "remove_tag_optional_return",
      returnedToGrip: true,
      paidCredits: 1,
    });
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(true);
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Event/Run Access hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps run-start events source-bound, side-safe and replayable", () => {
    for (const [definitionId, game, serverId, expectedPayload] of [
      [
        "onr_v1_076_all-nighter",
        v192CardReleaseGame("spotcheck-all-nighter"),
        "rd",
        { bonusRunOnFinish: true },
      ],
      [
        "onr_v1_081_custodial-position",
        v123CardReleaseGame("spotcheck-custodial-position"),
        "rd",
        { baseAccessCount: 3, effectiveAccessCount: 3 },
      ],
      [
        "onr_v1_085_executive-wiretaps",
        v123CardReleaseGame("spotcheck-executive-wiretaps"),
        "hq",
        { baseAccessCount: 3, effectiveAccessCount: 3 },
      ],
      [
        "onr_v1_094_inside-job",
        v181CardReleaseGame("spotcheck-inside-job"),
        "rd",
        { bypassFirstIce: true },
      ],
      [
        "onr_v1_098_lucidrine-booster-drug",
        MECHANIC_SMOKE_GAMES.runAccess("spotcheck-lucidrine"),
        "archives",
        {},
      ],
    ] as const) {
      let state = toRunnerTurn(game);
      state.runner.credits = 30;
      const eventId = moveRunnerCardToGrip(state, definitionId);
      if (serverId === "rd" || serverId === "archives")
        putCorpCardOnTopOfRd(state, "simple_economy_operation");
      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "play_event" &&
          action.payload?.cardId === eventId &&
          action.payload?.serverId === serverId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      const removed = structuredClone(state);
      removeEverywhere(removed, eventId);
      const drift = applyAction(removed, {
        matchId: removed.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: removed.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-removed-source`,
      });
      expect(drift.ok, definitionId).toBe(false);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === legal.actionId);
      if (definitionId === "onr_v1_098_lucidrine-booster-drug")
        expect(state.run, definitionId).toBeUndefined();
      else expect(state.run?.attackedServerId, definitionId).toBe(serverId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
        serverLabel:
          serverId === "rd" ? "R&D" : serverId === "hq" ? "HQ" : "Archives",
        ...expectedPayload,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps same-turn agenda-theft events gated and public-safe", () => {
    for (const [definitionId, stolenAgendaId] of [
      ["onr_v1_083_desperate-competitor", "onr_v1_203_hostile-takeover"],
      ["onr_v1_090_hot-tip-for-wns", "onr_v1_214_project-babylon"],
    ] as const) {
      let state = toRunnerTurn(v180CardReleaseGame(`spotcheck-${definitionId}`));
      state.runner.credits = 30;
      const eventId = moveRunnerCardToGrip(state, definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) => action.type === "play_event" && action.payload?.cardId === eventId,
        ),
      ).toBe(definitionId === "onr_v1_090_hot-tip-for-wns");
      putCorpCardOnTopOfRd(state, stolenAgendaId);
      state = apply(
        state,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");
      state = apply(state, "runner", (action) => action.type === "steal_agenda");
      const legal = mustAction(
        state,
        "runner",
        (action) => action.type === "play_event" && action.payload?.cardId === eventId,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === legal.actionId);
      expect(state.runner.scoreArea).toContain(eventId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
        scoredAsAgenda: true,
        gainedAgendaPoints: 1,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps draw, stack-search and free-trash events hidden-info safe", () => {
    let gideon = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-gideon-search"),
    );
    gideon.runner.credits = 20;
    const gideonId = moveRunnerCardToGrip(gideon, "onr_v1_089_gideons-pawnshop");
    const programId = moveRunnerCardToGrip(gideon, "simple_decoder");
    removeEverywhere(gideon, programId);
    gideon.runner.heap.push(programId);
    gideon.cardInstances[programId] = {
      ...gideon.cardInstances[programId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const gideonInitial = structuredClone(gideon);
    const gideonReplayStart = gideon.eventLog.length;
    gideon = apply(
      gideon,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === gideonId,
    );
    const optionId =
      gideon.pendingChoice?.options.find((option) => option.value === programId)?.id ?? "";
    expect(optionId).not.toBe("");
    gideon = applyChoice(gideon, "runner", optionId);
    expect(gideon.runner.grip).toContain(programId);
    expect(gideon.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_trash_to_grip",
    });
    expect(JSON.stringify(gideon.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(replayEvents(gideonInitial, gideon.eventLog.slice(gideonReplayStart)).ok).toBe(true);

    let jack = toRunnerTurn(onrV1Game("spotcheck-jack-n-joe"));
    jack.runner.credits = 20;
    const jackId = moveRunnerCardToGrip(jack, "onr_v1_095_jack-n-joe");
    const jackInitial = structuredClone(jack);
    const jackReplayStart = jack.eventLog.length;
    const gripBefore = jack.runner.grip.length;
    jack = apply(
      jack,
      "runner",
      (action) => action.type === "play_event" && action.payload?.cardId === jackId,
    );
    expect(jack.runner.grip.length).toBe(gripBefore + 2);
    expect(jack.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_095_jack-n-joe",
      drawnCount: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "runner",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_095_jack-n-joe",
        }),
      ],
    });
    expect(replayEvents(jackInitial, jack.eventLog.slice(jackReplayStart)).ok).toBe(true);

    let kilroy = toRunnerTurn(v192CardReleaseGame("spotcheck-kilroy"));
    kilroy.runner.credits = 20;
    moveRunnerCardToGrip(kilroy, "onr_v1_096_kilroy-was-here");
    putCorpCardOnTopOfRd(kilroy, "simple_economy_operation");
    const kilroyInitial = structuredClone(kilroy);
    const kilroyReplayStart = kilroy.eventLog.length;
    kilroy = apply(
      kilroy,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(kilroy, action) === "onr_v1_096_kilroy-was-here",
    );
    kilroy = apply(kilroy, "runner", (action) => action.type === "access_card");
    const creditsBeforeTrash = kilroy.runner.credits;
    kilroy = apply(kilroy, "runner", (action) => action.type === "trash_accessed_card");
    expect(kilroy.runner.credits).toBe(creditsBeforeTrash);
    expect(kilroy.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "simple_economy_operation",
    });
    expect(replayEvents(kilroyInitial, kilroy.eventLog.slice(kilroyReplayStart)).ok).toBe(true);
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Hardware/Link/Resources hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps hardware and link/resource installs public-safe and replayable", () => {
    const runnerDeck: DeckDefinition = {
      id: "spotcheck_runner_hardware_link_resources",
      name: "Spotcheck Runner Hardware Link Resources",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_128_green-knight-surge-buffers", quantity: 1 },
        { id: "onr_v1_133_militech-mram-chip", quantity: 1 },
        { id: "onr_v1_141_raven-microcyb-owl", quantity: 1 },
        { id: "onr_v1_143_techtronica-utility-suit", quantity: 1 },
        { id: "onr_v1_144_tycho-mem-chip", quantity: 1 },
        { id: "onr_v1_145_wutech-mem-chip", quantity: 1 },
        { id: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
        { id: "onr_v1_152_back-door-to-hilliard", quantity: 1 },
        { id: "onr_v1_153_back-door-to-orbital-air", quantity: 1 },
        { id: "onr_v1_154_broker", quantity: 1 },
        { id: "simple_decoder", quantity: 2 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    };
    const corpDeck: DeckDefinition = {
      id: "spotcheck_runner_hardware_link_resources_corp",
      name: "Spotcheck Runner Hardware Link Resources Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 2 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-runner-hardware-link-resources",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 80;
    state.runner.clicks = 30;
    const initialMemory = getPlayerView(state, "runner").own.memoryLimit ?? 0;
    for (const definitionId of runnerDeck.cards
      .map((card) => card.id)
      .filter((id) => id.startsWith("onr_v1_")) as string[]) {
      moveRunnerCardToGrip(state, definitionId);
      const installInitial = structuredClone(state);
      const installReplayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(
        installInitial,
        state.eventLog.slice(installReplayStart),
      );
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
    expect(getPlayerView(state, "runner").own.memoryLimit ?? 0).toBeGreaterThan(
      initialMemory,
    );
  });

  it("keeps Green Knight and Techtronica prevention source-safe", () => {
    for (const [definitionId, damageSetup] of [
      ["onr_v1_128_green-knight-surge-buffers", "net"],
      ["onr_v1_143_techtronica-utility-suit", "meat"],
    ] as const) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.damagePrevention(
          `spotcheck-prevention-${definitionId}`,
        ),
      );
      state.runner.credits = 30;
      state.corp.credits = 30;
      state.runner.maxHandSize = 100;
      state.corp.maxHandSize = 100;
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      if (damageSetup === "meat") {
        state.runner.tags = 1;
        moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
      } else {
        putCorpIceOnServer(state, "rd", "onr_v1_258_neural-blade");
      }
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      if (damageSetup === "meat") {
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = apply(state, "corp", (action) => action.type === "mandatory_draw");
        state = apply(
          state,
          "corp",
          (action) =>
            action.type === "play_operation" &&
            sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
        );
      } else {
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
            sourceDefinition(state, action) === "onr_v1_258_neural-blade",
        );
        state = apply(state, "runner", (action) => action.type === "continue_run");
      }
      const optionId = state.pendingChoice?.options.find(
        (option) => option.id !== "pass",
      )?.id;
      expect(optionId, definitionId).toBeDefined();
      if (!optionId) throw new Error(`Missing prevention option for ${definitionId}`);
      state = applyChoice(state, "runner", optionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        eventModificationDecision: "apply",
        sourceDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, definitionId).toEqual([]);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Broker load/take actions source-bound and one-use-per-turn", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-broker-resource-action"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    state.runner.maxHandSize = 100;
    state.corp.maxHandSize = 100;
    moveRunnerCardToGrip(state, "onr_v1_154_broker");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_154_broker",
    );
    const brokerId = state.runner.rig.resources.find(
      (cardId) => state.cardInstances[cardId]?.definitionId === "onr_v1_154_broker",
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Missing Broker");
    const load = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 0,
    );
    expect(load.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
    });
    const removed = structuredClone(state);
    removeEverywhere(removed, brokerId);
    const drift = applyAction(removed, {
      matchId: removed.matchId,
      side: "runner",
      actionId: load.actionId,
      clientKnownStateVersion: removed.stateVersion,
      idempotencyKey: "spotcheck-broker-removed-source",
    });
    expect(drift.ok).toBe(false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === load.actionId);
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(3);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbilityIndex === 1 &&
          action.payload?.cardId === brokerId,
      ),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    const creditsBefore = state.runner.credits;
    const take = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 1 &&
        action.payload?.cardId === brokerId,
    );
    expect(take.payload).toMatchObject({
      cardImplementationTakesHostedCredits: true,
      hostedCreditTakeMode: "all",
    });
    state = apply(state, "runner", (action) => action.actionId === take.actionId);
    expect(state.runner.credits).toBe(creditsBefore + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_154_broker",
      actionType: "activated_card_ability",
      gainedCredits: 3,
      remainingCounters: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Program Core hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  const programDefinitions = [
    "onr_v1_001_afreet",
    "onr_v1_003_baedekers-net-map",
    "onr_v1_004_bakdoor",
    "onr_v1_006_black-dahlia",
    "onr_v1_010_cascade",
    "onr_v1_012_clown",
    "onr_v1_015_codeslinger",
    "onr_v1_016_cyfermaster",
    "onr_v1_018_dogcatcher",
    "onr_v1_019_dropp",
  ] as const;

  const runnerProgramDeck: DeckDefinition = {
    id: "spotcheck_runner_program_core",
    name: "Spotcheck Runner Program Core",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      ...programDefinitions.map((id) => ({ id, quantity: 1 })),
      { id: "simple_economy_event", quantity: 12 },
    ],
  };

  const corpProgramDeck: DeckDefinition = {
    id: "spotcheck_runner_program_core_corp",
    name: "Spotcheck Runner Program Core Corp",
    side: "corp",
    identity: "corp_identity_001",
    cards: [
      { id: "simple_agenda", quantity: 6 },
      { id: "simple_barrier_ice", quantity: 2 },
      { id: "simple_code_gate_ice", quantity: 2 },
      { id: "simple_sentry_ice", quantity: 2 },
      { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
      { id: "onr_v1_239_endless-corridor", quantity: 1 },
      { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
      { id: "simple_economy_operation", quantity: 8 },
    ],
  };

  function programCoreGame(seed: string): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        runnerDeck: runnerProgramDeck,
        corpDeck: corpProgramDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 30;
    state.runner.memoryLimit = 30;
    state.corp.credits = 30;
    state.corp.maxHandSize = 100;
    return state;
  }

  it("emits a single plain hand-install action for Skivviss and Cyfermaster", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-runner-program-hand-install-dedupe",
        runnerDeck: {
          ...runnerProgramDeck,
          id: "spotcheck_runner_program_hand_install_dedupe",
          cards: [
            ...runnerProgramDeck.cards,
            { id: "onr_v1_064_skivviss", quantity: 1 },
          ],
        },
        corpDeck: corpProgramDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 30;
    state.runner.memoryLimit = 30;
    const definitions = [
      "onr_v1_064_skivviss",
      "onr_v1_016_cyfermaster",
    ] as const;

    for (const definitionId of definitions) {
      const cardId = moveRunnerCardToGrip(state, definitionId);
      const plainInstallActions = getLegalActions(state, "runner").filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === cardId &&
          action.payload?.runnerProgramTrashBeforeInstall !== true &&
          action.payload?.hostOnCardId === undefined,
      );

      expect(plainInstallActions, definitionId).toHaveLength(1);
    }
  });

  it("keeps all core runner program installs source-bound, public-safe and replayable", () => {
    let state = programCoreGame("spotcheck-runner-program-core-installs");

    for (const definitionId of programDefinitions) {
      const cardId = moveRunnerCardToGrip(state, definitionId);
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === cardId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: install.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-install-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: install.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-install-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
      const removed = structuredClone(state);
      removeEverywhere(removed, cardId);
      const removedSource = applyAction(removed, {
        matchId: removed.matchId,
        side: "runner",
        actionId: install.actionId,
        clientKnownStateVersion: removed.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-install-removed-source`,
      });
      expect(removedSource.ok, definitionId).toBe(false);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === install.actionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === "onr_v1_010_cascade") {
        const cascadeId = state.runner.rig.programs.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(cascadeId).toBeDefined();
        if (!cascadeId) throw new Error("Missing Cascade");
        expect(state.cardInstances[cascadeId]?.counters?.virus ?? 0).toBe(0);
        expect(
          state.cardInstances[cascadeId]?.counters?.recurring_credit,
        ).toBeUndefined();
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Afreet hosting and Clown encounter modification source-safe and replayable", () => {
    let state = programCoreGame("spotcheck-runner-program-core-hosting-clown");
    moveRunnerCardToGrip(state, "onr_v1_001_afreet");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_001_afreet",
    );
    expect(afreetId).toBeDefined();
    if (!afreetId) throw new Error("Missing Afreet");

    const bakdoorId = moveRunnerCardToGrip(state, "onr_v1_004_bakdoor");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === bakdoorId &&
        action.payload?.hostOnCardId === afreetId,
    );
    const removedHost = structuredClone(state);
    removeEverywhere(removedHost, afreetId);
    const hostDrift = applyAction(removedHost, {
      matchId: removedHost.matchId,
      side: "runner",
      actionId: hostedInstall.actionId,
      clientKnownStateVersion: removedHost.stateVersion,
      idempotencyKey: "spotcheck-afreet-host-removed",
    });
    expect(hostDrift.ok).toBe(false);
    const hostInitial = structuredClone(state);
    const hostReplayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === hostedInstall.actionId);
    expect(state.cardInstances[bakdoorId]?.hostedOn).toBe(afreetId);
    expect(state.runner.memoryUsed).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_004_bakdoor",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const hostReplay = replayEvents(
      hostInitial,
      state.eventLog.slice(hostReplayStart),
    );
    expect(hostReplay.ok).toBe(true);
    expect(hashState(hostReplay.state)).toBe(hashState(state));

    moveRunnerCardToGrip(state, "onr_v1_012_clown");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_012_clown",
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    const runInitial = structuredClone(state);
    const runReplayStart = state.eventLog.length;
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
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(2);
    const runReplay = replayEvents(runInitial, state.eventLog.slice(runReplayStart));
    expect(runReplay.ok).toBe(true);
    expect(hashState(runReplay.state)).toBe(hashState(state));
  });

  it("keeps core runner breakers installed-source-bound in run windows", () => {
    const specs = [
      ["onr_v1_006_black-dahlia", "simple_sentry_ice"],
      ["onr_v1_015_codeslinger", "simple_sentry_ice"],
      ["onr_v1_016_cyfermaster", "simple_code_gate_ice"],
      ["onr_v1_018_dogcatcher", "onr_v1_243_fetch-4-0-1"],
      ["onr_v1_019_dropp", "simple_code_gate_ice"],
    ] as const;

    for (const [breakerDefinitionId, iceDefinitionId] of specs) {
      let state = programCoreGame(`spotcheck-runner-program-core-${breakerDefinitionId}`);
      const gripId = moveRunnerCardToGrip(state, breakerDefinitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === gripId,
      );
      const breakerId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
      );
      expect(breakerId, breakerDefinitionId).toBeDefined();
      if (!breakerId) throw new Error(`Missing ${breakerDefinitionId}`);
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      let breakAction: LegalAction | undefined;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        breakAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "break_subroutine" &&
            String(action.payload?.breakerId) === breakerId &&
            (breakerDefinitionId === "onr_v1_019_dropp"
              ? action.payload?.breakAllMatchingSubroutines === true
              : action.payload?.subroutineIndex === 0),
        );
        if (breakAction) break;
        const pumpAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === breakerId,
        );
        expect(pumpAction, breakerDefinitionId).toBeDefined();
        if (!pumpAction) break;
        state = apply(state, "runner", (action) => action.actionId === pumpAction.actionId);
      }
      expect(breakAction, breakerDefinitionId).toBeDefined();
      if (!breakAction) throw new Error(`Missing break action for ${breakerDefinitionId}`);
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: breakAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `spotcheck-${breakerDefinitionId}-break-wrong-side`,
      });
      expect(wrongSide.ok, breakerDefinitionId).toBe(false);
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: breakAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${breakerDefinitionId}-break-stale`,
      });
      expect(stale.ok, breakerDefinitionId).toBe(false);
      const removed = structuredClone(state);
      removeEverywhere(removed, breakerId);
      const removedSource = applyAction(removed, {
        matchId: removed.matchId,
        side: "runner",
        actionId: breakAction.actionId,
        clientKnownStateVersion: removed.stateVersion,
        idempotencyKey: `spotcheck-${breakerDefinitionId}-break-removed-source`,
      });
      expect(removedSource.ok, breakerDefinitionId).toBe(false);

      state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
      if (breakerDefinitionId === "onr_v1_019_dropp") {
        expect(state.run).toBeUndefined();
        expect(state.timingPoint).toBe("runner_action.main");
      } else {
        expect(state.run?.brokenSubroutineIndexes).toContain(0);
      }
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, breakerDefinitionId).toBe(true);
      expect(hashState(replay.state), breakerDefinitionId).toBe(hashState(state));
    }
  });

  it("applies Dropp errata as break-all then unsuccessful run end", () => {
    let state = programCoreGame("spotcheck-runner-program-core-dropp-errata");
    state.runner.credits = 20;
    state.corp.credits = 20;
    const droppId = installRunnerProgramForTest(state, "onr_v1_019_dropp");
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_239_endless-corridor",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const cannotPayAll = structuredClone(state);
    cannotPayAll.runner.credits = 1;
    expect(
      getLegalActions(cannotPayAll, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === droppId,
      ),
    ).toBe(false);

    const pumpAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === droppId,
    );
    state = apply(state, "runner", (action) => action.actionId === pumpAction.actionId);
    expect(state.run?.phase).toBe("encounter_ice");
    expect(state.timingPoint).toBe("run.encounter_ice");

    const droppBreakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === droppId,
    );
    expect(droppBreakActions).toHaveLength(1);
    expect(droppBreakActions[0]?.payload).toMatchObject({
      subroutineIndexes: "0,1",
      breakSubroutineCount: 2,
      multiBreakSubroutines: true,
      breakAllMatchingSubroutines: true,
      breakerEndsRunAfterBreak: true,
      targetIceDefinitionId: "onr_v1_239_endless-corridor",
      targetIceTitle: "Endless Corridor",
      breakSubroutineBaseCost: 0,
      breakSubroutineAdditionalCost: 2,
      breakSubroutineTotalCost: 2,
    });
    expect(droppBreakActions[0]?.payload?.subroutineIndex).toBeUndefined();
    expect(droppBreakActions[0]?.costs).toEqual([{ credits: 2 }]);

    const breakAction = droppBreakActions[0]!;
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "dropp-errata-break-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "dropp-errata-break-stale",
    });
    expect(stale.ok).toBe(false);
    const removed = structuredClone(state);
    removeEverywhere(removed, droppId);
    const removedSource = applyAction(removed, {
      matchId: removed.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: removed.stateVersion,
      idempotencyKey: "dropp-errata-break-removed-source",
    });
    expect(removedSource.ok).toBe(false);

    state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_019_dropp",
      targetIceDefinitionId: "onr_v1_239_endless-corridor",
      subroutineIndexes: "0,1",
      breakSubroutineCount: 2,
      breakAllMatchingSubroutines: true,
      breakerEndsRunAfterBreak: true,
      breakSubroutineAdditionalCost: 2,
      breakSubroutineTotalCost: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const runActionTypes = state.eventLog
      .slice(replayStart)
      .map((event) => event.publicPayload?.actionType);
    expect(runActionTypes).not.toContain("continue_run");
    expect(runActionTypes).not.toContain("access_card");

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Program Prevention Tools hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;
  const programDefinitions = [
    "onr_v1_021_dwarf",
    "onr_v1_024_expert-schedule-analyzer",
    "onr_v1_028_force-shield",
    "onr_v1_033_imp",
    "onr_v1_036_jackhammer",
    "onr_v1_038_joan-of-arc",
    "onr_v1_039_krash",
    "onr_v1_040_loony-goon",
    "onr_v1_042_mouse",
    "onr_v1_050_r-and-d-protocol-files",
  ] as const;

  function preventionToolState(seed: string): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: `spotcheck_runner_prevention_tools_${seed}`,
          name: "Spotcheck Runner Prevention Tools",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            ...programDefinitions.map((id) => ({ id, quantity: 1 })),
            { id: "simple_economy_event", quantity: 12 },
          ],
        },
        corpDeck: {
          id: `spotcheck_runner_prevention_tools_corp_${seed}`,
          name: "Spotcheck Runner Prevention Tools Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_barrier_ice", quantity: 2 },
            { id: "simple_code_gate_ice", quantity: 2 },
            { id: "simple_sentry_ice", quantity: 2 },
            { id: "onr_v1_232_crystal-wall", quantity: 2 },
            { id: "simple_upgrade", quantity: 2 },
            { id: "simple_economy_asset", quantity: 2 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 30;
    state.runner.memoryLimit = 30;
    state.corp.credits = 30;
    state.corp.maxHandSize = 100;
    return state;
  }

  it("keeps prevention-tool program installs source-bound, public-safe and replayable", () => {
    let state = preventionToolState("installs");
    for (const definitionId of programDefinitions) {
      const cardId = moveRunnerCardToGrip(state, definitionId);
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === cardId,
      );
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "corp",
          actionId: install.actionId,
          clientKnownStateVersion: state.stateVersion,
          idempotencyKey: `spotcheck-${definitionId}-install-wrong-side`,
        }).ok,
        definitionId,
      ).toBe(false);
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: install.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-install-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
      const removed = structuredClone(state);
      removeEverywhere(removed, cardId);
      expect(
        applyAction(removed, {
          matchId: removed.matchId,
          side: "runner",
          actionId: install.actionId,
          clientKnownStateVersion: removed.stateVersion,
          idempotencyKey: `spotcheck-${definitionId}-install-removed-source`,
        }).ok,
        definitionId,
      ).toBe(false);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === install.actionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === "onr_v1_050_r-and-d-protocol-files") {
        const protocolId = state.runner.rig.programs.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(protocolId).toBeDefined();
        if (!protocolId) throw new Error("Missing R&D-Protocol Files");
        expect(cardCounterAmount(state, protocolId, "recurring_credit")).toBe(0);
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Imp hosting and Force Shield/Joan prevention source-safe", () => {
    let hostState = preventionToolState("imp-hosting");
    moveRunnerCardToGrip(hostState, "onr_v1_033_imp");
    hostState = apply(
      hostState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hostState, action) === "onr_v1_033_imp",
    );
    const impId = hostState.runner.rig.programs.find(
      (id) => hostState.cardInstances[id]?.definitionId === "onr_v1_033_imp",
    );
    expect(impId).toBeDefined();
    if (!impId) throw new Error("Missing Imp");
    const jackhammerId = moveRunnerCardToGrip(hostState, "onr_v1_036_jackhammer");
    const hostedInstall = mustAction(
      hostState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === jackhammerId &&
        action.payload?.hostOnCardId === impId,
    );
    const removedHost = structuredClone(hostState);
    removeEverywhere(removedHost, impId);
    expect(
      applyAction(removedHost, {
        matchId: removedHost.matchId,
        side: "runner",
        actionId: hostedInstall.actionId,
        clientKnownStateVersion: removedHost.stateVersion,
        idempotencyKey: "spotcheck-imp-host-removed",
      }).ok,
    ).toBe(false);
    const hostInitial = structuredClone(hostState);
    const hostReplayStart = hostState.eventLog.length;
    hostState = apply(
      hostState,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    expect(hostState.cardInstances[jackhammerId]?.hostedOn).toBe(impId);
    expect(hostState.runner.memoryUsed).toBe(1);
    const hostReplay = replayEvents(
      hostInitial,
      hostState.eventLog.slice(hostReplayStart),
    );
    expect(hostReplay.ok).toBe(true);
    expect(hashState(hostReplay.state)).toBe(hashState(hostState));

    for (const definitionId of [
      "onr_v1_028_force-shield",
      "onr_v1_038_joan-of-arc",
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-prevention-tools-${definitionId}`,
          runnerDeck: {
            id: `spotcheck_prevention_tools_${definitionId}`,
            name: "Spotcheck Prevention Tools",
            side: "runner",
            identity: "runner_identity_001",
            cards: [
              { id: definitionId, quantity: 1 },
              { id: "simple_economy_event", quantity: 12 },
            ],
          },
          corpDeck: V111_CORP_DECK,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.runner.maxHandSize = 100;
      state.corp.maxHandSize = 100;
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      moveCorpCardToHq(state, "v111_core_damage_operation");
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.type === "end_turn");
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(state, action) === "v111_core_damage_operation",
      );
      const optionId = state.pendingChoice?.options.find(
        (option) => option.id !== "pass",
      )?.id;
      expect(optionId, definitionId).toBeDefined();
      if (!optionId) throw new Error(`Missing prevention option for ${definitionId}`);
      state = applyChoice(state, "runner", optionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        eventModificationDecision: "apply",
        sourceDefinitionId: definitionId,
        damageAmount: 0,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps prevention-tool breakers and Mouse/Expert tools revalidated", () => {
    const specs = [
      ["onr_v1_021_dwarf", "onr_v1_232_crystal-wall"],
      ["onr_v1_036_jackhammer", "onr_v1_232_crystal-wall"],
      ["onr_v1_039_krash", "simple_code_gate_ice"],
      ["onr_v1_040_loony-goon", "simple_sentry_ice"],
    ] as const;
    for (const [breakerDefinitionId, iceDefinitionId] of specs) {
      let state = preventionToolState(breakerDefinitionId);
      const gripId = moveRunnerCardToGrip(state, breakerDefinitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === gripId,
      );
      const breakerId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
      );
      expect(breakerId, breakerDefinitionId).toBeDefined();
      if (!breakerId) throw new Error(`Missing ${breakerDefinitionId}`);
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      let breakAction: LegalAction | undefined;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        breakAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "break_subroutine" &&
            String(action.payload?.breakerId) === breakerId &&
            action.payload?.subroutineIndex === 0,
        );
        if (breakAction) break;
        const pumpAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === breakerId,
        );
        expect(pumpAction, breakerDefinitionId).toBeDefined();
        if (!pumpAction) break;
        state = apply(state, "runner", (action) => action.actionId === pumpAction.actionId);
      }
      expect(breakAction, breakerDefinitionId).toBeDefined();
      if (!breakAction) throw new Error(`Missing break action for ${breakerDefinitionId}`);
      const removed = structuredClone(state);
      removeEverywhere(removed, breakerId);
      expect(
        applyAction(removed, {
          matchId: removed.matchId,
          side: "runner",
          actionId: breakAction.actionId,
          clientKnownStateVersion: removed.stateVersion,
          idempotencyKey: `spotcheck-${breakerDefinitionId}-break-removed-source`,
        }).ok,
        breakerDefinitionId,
      ).toBe(false);
      state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, breakerDefinitionId).toBe(true);
      expect(hashState(replay.state), breakerDefinitionId).toBe(hashState(state));
    }

    let toolState = preventionToolState("mouse-expert");
    for (const definitionId of [
      "onr_v1_024_expert-schedule-analyzer",
      "onr_v1_042_mouse",
    ] as const) {
      moveRunnerCardToGrip(toolState, definitionId);
      toolState = apply(
        toolState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(toolState, action) === definitionId,
      );
    }
    const mouseTargetId = putCorpRootInRemote(toolState, "simple_upgrade");
    const expose = mustAction(
      toolState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(toolState, action) === "onr_v1_042_mouse",
    );
    expect(expose.label).toBe("Mouse: installierte Korp-Karte exposen");
    expect(expose.payload).not.toHaveProperty("targetDefinitionId");
    expect(expose.payload).not.toHaveProperty("cardImplementationExposeTargetId");
    expect(JSON.stringify(expose.payload)).not.toMatch(/simple_upgrade/);
    const removedMouse = structuredClone(toolState);
    const mouseId = toolState.runner.rig.programs.find(
      (id) => toolState.cardInstances[id]?.definitionId === "onr_v1_042_mouse",
    );
    expect(mouseId).toBeDefined();
    if (!mouseId) throw new Error("Missing Mouse");
    removeEverywhere(removedMouse, mouseId);
    expect(
      applyAction(removedMouse, {
        matchId: removedMouse.matchId,
        side: "runner",
        actionId: expose.actionId,
        clientKnownStateVersion: removedMouse.stateVersion,
        idempotencyKey: "spotcheck-mouse-removed-source",
      }).ok,
    ).toBe(false);
    const exposeInitial = structuredClone(toolState);
    const exposeReplayStart = toolState.eventLog.length;
    toolState = apply(toolState, "runner", (action) => action.actionId === expose.actionId);
    expect(toolState.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("p3_36.expose_installed_card:"),
      prompt: "Installierte Korp-Karte exposen",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(toolState.pendingChoice?.options).toContainEqual({
      id: expect.stringMatching(/^card_hidden_/),
      label: "Remote 1 Root 1",
      value: mouseTargetId,
    });
    const mouseTargetOptionId = toolState.pendingChoice?.options.find(
      (option) => option.value === mouseTargetId,
    )?.id;
    expect(mouseTargetOptionId).toMatch(/^card_hidden_/);
    expect(JSON.stringify(getPlayerView(toolState, "runner").pendingChoice)).not.toMatch(
      /"value"|simple_upgrade|Simple Upgrade/,
    );
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_choice",
      sourceDefinitionId: "onr_v1_042_mouse",
    });
    expect(JSON.stringify(toolState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"targetDefinitionId"|"cardImplementationExposeTargetId"|simple_upgrade/,
    );
    toolState = applyChoice(toolState, "runner", mouseTargetOptionId ?? "");
    expect(toolState.pendingChoice?.source).toContain(
      "p3_36.expose_installed_card_review:",
    );
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_review",
      sourceDefinitionId: "onr_v1_042_mouse",
      cardDefinitionId: "simple_upgrade",
    });
    expect(JSON.stringify(toolState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      getPlayerView(toolState, "runner")
        .servers.flatMap((server) => server.root)
        .some((card) => card.known && card.definitionId === "simple_upgrade"),
    ).toBe(true);
    toolState = applyChoice(toolState, "runner", "done");
    expect(toolState.pendingChoice).toBeUndefined();
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "expose_installed_card_finish",
      sourceDefinitionId: "onr_v1_042_mouse",
    });
    const exposeReplay = replayEvents(
      exposeInitial,
      toolState.eventLog.slice(exposeReplayStart),
    );
    expect(exposeReplay.ok).toBe(true);
    expect(hashState(exposeReplay.state)).toBe(hashState(toolState));

    putCorpCardOnTopOfRd(toolState, "simple_agenda");
    putCorpCardOnTopOfRd(toolState, "simple_economy_operation");
    putCorpCardOnTopOfRd(toolState, "simple_economy_asset");
    const accessInitial = structuredClone(toolState);
    const accessReplayStart = toolState.eventLog.length;
    toolState = apply(
      toolState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    toolState = apply(toolState, "runner", (action) => action.type === "access_card");
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      visibility: { class: "hidden_info_barrier" },
    });
    expect(JSON.stringify(toolState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"/,
    );
    const accessReplay = replayEvents(
      accessInitial,
      toolState.eventLog.slice(accessReplayStart),
    );
    expect(accessReplay.ok).toBe(true);
    expect(hashState(accessReplay.state)).toBe(hashState(toolState));
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Resource Contacts hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;
  const resourceDefinitions = [
    "onr_v1_157_crash-everett-inventive-fixer",
    "onr_v1_158_danshis-second-id",
    "onr_v1_159_databroker",
    "onr_v1_162_field-reporter-for-ice-and-data",
    "onr_v1_163_floating-runner-bbs",
    "onr_v1_165_junkyard-bbs",
    "onr_v1_166_karl-de-veres-corporate-stooge",
    "onr_v1_167_leland-corporate-bodyguard",
    "onr_v1_168_loan-from-chiba",
    "onr_v1_176_the-shell-traders",
  ] as const;

  function resourceContactState(seed: string): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: `spotcheck_runner_resource_contacts_${seed}`,
          name: "Spotcheck Runner Resource Contacts",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            ...resourceDefinitions.map((id) => ({ id, quantity: 1 })),
            { id: "simple_fracter", quantity: 2 },
            { id: "simple_setup_hardware", quantity: 1 },
            { id: "simple_agenda", quantity: 2 },
            { id: "simple_economy_event", quantity: 12 },
          ],
        },
        corpDeck: {
          id: `spotcheck_runner_resource_contacts_corp_${seed}`,
          name: "Spotcheck Runner Resource Contacts Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_barrier_ice", quantity: 2 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 30;
    state.runner.maxHandSize = 100;
    state.corp.credits = 30;
    state.corp.maxHandSize = 100;
    return state;
  }

  it("keeps runner resource contact installs source-bound, public-safe and replayable", () => {
    let state = resourceContactState("installs");
    for (const definitionId of resourceDefinitions) {
      const cardId = moveRunnerCardToGrip(state, definitionId);
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === cardId,
      );
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "corp",
          actionId: install.actionId,
          clientKnownStateVersion: state.stateVersion,
          idempotencyKey: `spotcheck-${definitionId}-install-wrong-side`,
        }).ok,
        definitionId,
      ).toBe(false);
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: install.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-install-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
      const removed = structuredClone(state);
      removeEverywhere(removed, cardId);
      expect(
        applyAction(removed, {
          matchId: removed.matchId,
          side: "runner",
          actionId: install.actionId,
          clientKnownStateVersion: removed.stateVersion,
          idempotencyKey: `spotcheck-${definitionId}-install-removed-source`,
        }).ok,
        definitionId,
      ).toBe(false);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === install.actionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === "onr_v1_168_loan-from-chiba") {
        const resourceId = state.runner.rig.resources.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(resourceId).toBeDefined();
        if (!resourceId) throw new Error(`Missing ${definitionId}`);
        expect(cardCounterAmount(state, resourceId, "recurring_credit")).toBe(0);
        expect(state.runner.credits).toBe(initial.runner.credits + 12);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          resolvedEffects: [
            expect.objectContaining({
              kind: "gain_credits",
              amount: 12,
              sourceDefinitionId: definitionId,
            }),
          ],
        });
      }
      if (definitionId === "onr_v1_176_the-shell-traders") {
        const resourceId = state.runner.rig.resources.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(resourceId).toBeDefined();
        if (!resourceId) throw new Error(`Missing ${definitionId}`);
        expect(cardCounterAmount(state, resourceId, "recurring_credit")).toBe(0);
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Danshi and Databroker active resource actions source-bound", () => {
    let danshi = resourceContactState("danshi");
    danshi.runner.tags = 3;
    moveRunnerCardToGrip(danshi, "onr_v1_158_danshis-second-id");
    danshi = apply(
      danshi,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(danshi, action) === "onr_v1_158_danshis-second-id",
    );
    const danshiId = danshi.runner.rig.resources.find(
      (id) => danshi.cardInstances[id]?.definitionId === "onr_v1_158_danshis-second-id",
    );
    expect(danshiId).toBeDefined();
    if (!danshiId) throw new Error("Missing Danshi's Second ID");
    const removeTags = mustAction(
      danshi,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === danshiId &&
        sourceDefinition(danshi, action) === "onr_v1_158_danshis-second-id",
    );
    const removedDanshi = structuredClone(danshi);
    removeEverywhere(removedDanshi, danshiId);
    expect(
      applyAction(removedDanshi, {
        matchId: removedDanshi.matchId,
        side: "runner",
        actionId: removeTags.actionId,
        clientKnownStateVersion: removedDanshi.stateVersion,
        idempotencyKey: "spotcheck-danshi-removed-source",
      }).ok,
    ).toBe(false);
    const danshiInitial = structuredClone(danshi);
    const danshiReplayStart = danshi.eventLog.length;
    danshi = apply(danshi, "runner", (action) => action.actionId === removeTags.actionId);
    expect(danshi.runner.tags).toBe(0);
    expect(danshi.runner.heap).toContain(danshiId);
    expect(danshi.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_158_danshis-second-id",
      removedTags: 3,
      runnerTagsAfter: 0,
    });
    const danshiReplay = replayEvents(
      danshiInitial,
      danshi.eventLog.slice(danshiReplayStart),
    );
    expect(danshiReplay.ok).toBe(true);
    expect(hashState(danshiReplay.state)).toBe(hashState(danshi));

    let databroker = resourceContactState("databroker");
    moveRunnerCardToGrip(databroker, "onr_v1_159_databroker");
    databroker = apply(
      databroker,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(databroker, action) === "onr_v1_159_databroker",
    );
    const brokerId = databroker.runner.rig.resources.find(
      (id) => databroker.cardInstances[id]?.definitionId === "onr_v1_159_databroker",
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Missing Databroker");
    const agendaId = scoreRunnerAgendaForTest(databroker, "simple_agenda");
    const databrokerAction = mustAction(
      databroker,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.resourceAbility === "databroker",
    );
    const stale = applyAction(databroker, {
      matchId: databroker.matchId,
      side: "runner",
      actionId: databrokerAction.actionId,
      clientKnownStateVersion: databroker.stateVersion - 1,
      idempotencyKey: "spotcheck-databroker-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    const removedBroker = structuredClone(databroker);
    removeEverywhere(removedBroker, brokerId);
    expect(
      applyAction(removedBroker, {
        matchId: removedBroker.matchId,
        side: "runner",
        actionId: databrokerAction.actionId,
        clientKnownStateVersion: removedBroker.stateVersion,
        idempotencyKey: "spotcheck-databroker-removed-source",
      }).ok,
    ).toBe(false);
    const creditsBefore = databroker.runner.credits;
    const dataInitial = structuredClone(databroker);
    const dataReplayStart = databroker.eventLog.length;
    databroker = apply(
      databroker,
      "runner",
      (action) => action.actionId === databrokerAction.actionId,
    );
    expect(databroker.runner.credits).toBe(creditsBefore + 10);
    expect(databroker.runner.scoreArea).toContain(agendaId);
    expect(databroker.specialZones?.removedFromGame ?? []).not.toContain(agendaId);
    expect(databroker.cardInstances[agendaId]?.agendaPointsSpent).toBe(1);
    expect(databroker.runner.heap).toContain(brokerId);
    expect(databroker.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_159_databroker",
      resourceAbility: "databroker",
      agendaPointCostPaid: 1,
      spentAgendaCardId: agendaId,
      gainedCredits: 10,
    });
    const dataReplay = replayEvents(
      dataInitial,
      databroker.eventLog.slice(dataReplayStart),
    );
    expect(dataReplay.ok).toBe(true);
    expect(hashState(dataReplay.state)).toBe(hashState(databroker));
  });

  it("offers Junkyard BBS for the top heap card and revalidates source, cost and target drift", () => {
    let state = resourceContactState("junkyard-bbs");
    moveRunnerCardToGrip(state, "onr_v1_165_junkyard-bbs");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_165_junkyard-bbs",
    );
    const junkyardId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_165_junkyard-bbs",
    );
    expect(junkyardId).toBeDefined();
    if (!junkyardId) throw new Error("Missing Junkyard BBS");

    const bottomHeapId = findCard(state, "simple_economy_event");
    removeEverywhere(state, bottomHeapId);
    state.runner.heap.push(bottomHeapId);
    state.cardInstances[bottomHeapId] = {
      ...state.cardInstances[bottomHeapId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
    const topHeapId = findCard(
      state,
      "onr_v1_157_crash-everett-inventive-fixer",
    );
    removeEverywhere(state, topHeapId);
    state.runner.heap.push(topHeapId);
    state.cardInstances[topHeapId] = {
      ...state.cardInstances[topHeapId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };

    const junkyardAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_165_junkyard-bbs" &&
        action.payload?.cardId === junkyardId &&
        action.payload?.cardImplementationTopTrashTargetId === topHeapId,
    );
    expect(junkyardAction.costs).toEqual([{ clicks: 1, credits: 1 }]);

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: junkyardAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "junkyard-wrong-side",
      }).ok,
    ).toBe(false);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: junkyardAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "junkyard-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, junkyardId);
    expect(
      applyAction(removedSource, {
        matchId: removedSource.matchId,
        side: "runner",
        actionId: junkyardAction.actionId,
        clientKnownStateVersion: removedSource.stateVersion,
        idempotencyKey: "junkyard-removed-source",
      }).ok,
    ).toBe(false);

    const targetDrift = structuredClone(state);
    targetDrift.runner.heap = targetDrift.runner.heap.filter(
      (id) => id !== topHeapId,
    );
    targetDrift.runner.heap.push(bottomHeapId);
    expect(
      applyAction(targetDrift, {
        matchId: targetDrift.matchId,
        side: "runner",
        actionId: junkyardAction.actionId,
        clientKnownStateVersion: targetDrift.stateVersion,
        idempotencyKey: "junkyard-target-drift",
      }).ok,
    ).toBe(false);

    const cannotPay = structuredClone(state);
    cannotPay.runner.credits = 0;
    expect(
      getLegalActions(cannotPay, "runner").some(
        (action) => action.actionId === junkyardAction.actionId,
      ),
    ).toBe(false);

    const creditsBefore = state.runner.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === junkyardAction.actionId,
    );
    expect(state.runner.credits).toBe(creditsBefore - 1);
    expect(state.runner.heap).toEqual([bottomHeapId]);
    expect(state.runner.grip[0]).toBe(topHeapId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: "onr_v1_165_junkyard-bbs",
      cardDefinitionId: "onr_v1_165_junkyard-bbs",
      returnedCardDefinitionId: "onr_v1_157_crash-everett-inventive-fixer",
      returnedCount: 1,
      sourceZone: "heap",
      destinationZone: "grip",
      returnedToGrip: true,
      runnerCreditsAfter: creditsBefore - 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"stack"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Floating Runner BBS recurring contact credits turn-safe", () => {
    let state = resourceContactState("turn-credits");
    moveRunnerCardToGrip(state, "onr_v1_163_floating-runner-bbs");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_163_floating-runner-bbs",
    );
    const initialCredits = state.runner.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(initialCredits + 1);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("offers The Shell Traders prepare action only for legal grip program and hardware targets", () => {
    let state = resourceContactState("shell-prepare-targets");
    moveRunnerCardToGrip(state, "onr_v1_176_the-shell-traders");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_176_the-shell-traders",
    );
    emptyRunnerGripForTest(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.delayedInstallAbility === "set_aside_from_grip",
      ),
    ).toBe(false);

    const programId = moveRunnerCardToGrip(state, "simple_fracter");
    const hardwareId = moveRunnerCardToGrip(state, "simple_setup_hardware");
    const prepareActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip",
    );
    expect(prepareActions.map((action) => action.payload?.targetCardId).sort()).toEqual([
      hardwareId,
      programId,
    ].sort());
    for (const action of prepareActions) expect(action.costs).toEqual([{ clicks: 1 }]);
  });

  it("sets aside Shell Traders targets public, revalidates drift, and keeps hidden grip data out of public payloads", () => {
    let state = resourceContactState("shell-set-aside");
    moveRunnerCardToGrip(state, "onr_v1_176_the-shell-traders");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_176_the-shell-traders",
    );
    const shellId = state.runner.rig.resources.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_176_the-shell-traders",
    );
    expect(shellId).toBeDefined();
    if (!shellId) throw new Error("Missing The Shell Traders");
    const programId = moveRunnerCardToGrip(state, "simple_fracter");
    const corpViewBefore = JSON.stringify(getPlayerView(state, "corp"));
    expect(corpViewBefore).not.toContain("Simple Fracter");
    expect(corpViewBefore).not.toContain(programId);
    const prepare = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.cardId === shellId &&
        action.payload?.targetCardId === programId,
    );

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: prepare.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "shell-prepare-wrong-side",
      }).ok,
    ).toBe(false);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: prepare.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "shell-prepare-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, shellId);
    expect(
      applyAction(removedSource, {
        matchId: removedSource.matchId,
        side: "runner",
        actionId: prepare.actionId,
        clientKnownStateVersion: removedSource.stateVersion,
        idempotencyKey: "shell-prepare-removed-source",
      }).ok,
    ).toBe(false);
    const targetDrift = structuredClone(state);
    removeEverywhere(targetDrift, programId);
    expect(
      applyAction(targetDrift, {
        matchId: targetDrift.matchId,
        side: "runner",
        actionId: prepare.actionId,
        clientKnownStateVersion: targetDrift.stateVersion,
        idempotencyKey: "shell-prepare-target-drift",
      }).ok,
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === prepare.actionId);
    expect(state.runner.grip).not.toContain(programId);
    expect(state.specialZones?.setAside).toContain(programId);
    expect(state.cardInstances[programId]?.zone).toMatchObject({
      side: "special",
      zone: "set_aside",
      visibility: "public",
    });
    expect(cardCounterAmount(state, programId, "shell")).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      abilityFamily: "hosting-counters",
      abilityId: "set_aside_from_grip",
      effectKind: "counter_change",
      sourceDefinitionId: "onr_v1_176_the-shell-traders",
      amounts: expect.objectContaining({
        addedCounterAmount: 2,
        remainingCounters: 2,
      }),
      targets: expect.objectContaining({
        targetCardDefinitionId: "simple_fracter",
      }),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("removes Shell counters through paid and start-of-turn paths and installs the prepared card", () => {
    let state = resourceContactState("shell-counter-removal");
    moveRunnerCardToGrip(state, "onr_v1_176_the-shell-traders");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_176_the-shell-traders",
    );
    const programId = moveRunnerCardToGrip(state, "simple_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === programId,
    );
    const paidRemove = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        action.payload?.targetCardId === programId,
    );
    expect(paidRemove.costs).toEqual([{ credits: 1 }]);
    const creditsBefore = state.runner.credits;
    state = apply(state, "runner", (action) => action.actionId === paidRemove.actionId);
    expect(state.runner.credits).toBe(creditsBefore - 1);
    expect(cardCounterAmount(state, programId, "shell")).toBe(1);
    expect(state.specialZones?.setAside).toContain(programId);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.specialZones?.setAside).not.toContain(programId);
    expect(state.runner.rig.programs).toContain(programId);
    expect(cardCounterAmount(state, programId, "shell")).toBe(0);
    expect(state.runner.memoryUsed).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_change",
          side: "runner",
          counterType: "shell",
          removedCounterAmount: 1,
          remainingCounters: 0,
          sourceDefinitionId: "onr_v1_176_the-shell-traders",
          cardDefinitionId: "simple_fracter",
          reason: "start_of_turn",
        }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies P3.9 agenda_difficulty modifiers from scored Corp agendas to score actions and revalidation", () => {
    const p39CardIds = new Set([
      "onr_v1_189_artificial-security-directors",
      "onr_v1_191_black-ice-quality-assurance",
      "onr_v1_201_executive-extraction",
      "onr_v1_202_genetics-visionary-acquisition",
      "onr_v1_203_hostile-takeover",
    ]);
    const makeState = (seed: string) => {
      const state = apply(
        createGameAfterSetup({
          seed,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `${seed}_corp`,
            name: `${seed} Corp`,
            cards: [
              { id: "onr_v1_189_artificial-security-directors", quantity: 2 },
              { id: "onr_v1_191_black-ice-quality-assurance", quantity: 2 },
              { id: "onr_v1_201_executive-extraction", quantity: 2 },
              { id: "onr_v1_202_genetics-visionary-acquisition", quantity: 2 },
              { id: "onr_v1_203_hostile-takeover", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
                (entry) => !p39CardIds.has(entry.id),
              ),
            ],
          },
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 80;
      state.corp.clicks = 30;
      state.corp.maxHandSize = 100;
      return state;
    };
    const scoreActionExists = (state: GameState, agendaId: CardInstanceId) =>
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          String(action.payload?.cardId) === agendaId,
      );
    const visibleAgendaDifficulty = (
      state: GameState,
      agendaId: CardInstanceId,
    ) =>
      getPlayerView(state, "corp")
        .servers.flatMap((server) => server.root)
        .find((card) => card.instanceId === agendaId)?.advancementRequirement;

    for (const [sourceDefinitionId, targetDefinitionId] of [
      [
        "onr_v1_189_artificial-security-directors",
        "onr_v1_201_executive-extraction",
      ],
      ["onr_v1_201_executive-extraction", "onr_v1_203_hostile-takeover"],
      [
        "onr_v1_202_genetics-visionary-acquisition",
        "onr_v1_191_black-ice-quality-assurance",
      ],
    ] as const) {
      const state = makeState(`p39-${sourceDefinitionId}`);
      const targetId = putCorpRootInRemote(state, targetDefinitionId);
      const printedDifficulty =
        CARD_DEFINITIONS_BY_ID[targetDefinitionId]?.advancementRequirement ?? 0;
      state.cardInstances[targetId] = {
        ...state.cardInstances[targetId]!,
        advancementCounters: printedDifficulty - 1,
      };
      expect(scoreActionExists(state, targetId)).toBe(false);

      const sourceId = scoreCorpAgendaForTest(state, sourceDefinitionId);
      expect(scoreActionExists(state, targetId)).toBe(true);
      expect(visibleAgendaDifficulty(state, targetId)).toBe(
        printedDifficulty - 1,
      );

      removeEverywhere(state, sourceId);
      expect(scoreActionExists(state, targetId)).toBe(false);
    }

    const stackingState = makeState("p39-stacking-and-stale");
    const firstSource = scoreCorpAgendaForTest(
      stackingState,
      "onr_v1_189_artificial-security-directors",
    );
    const secondSource = scoreCorpAgendaForTest(
      stackingState,
      "onr_v1_189_artificial-security-directors",
    );
    const blackOpsTarget = putCorpRootInRemote(
      stackingState,
      "onr_v1_201_executive-extraction",
    );
    stackingState.cardInstances[blackOpsTarget] = {
      ...stackingState.cardInstances[blackOpsTarget]!,
      advancementCounters: 1,
    };
    expect(scoreActionExists(stackingState, blackOpsTarget)).toBe(true);
    expect(visibleAgendaDifficulty(stackingState, blackOpsTarget)).toBe(1);
    expect(
      collectActiveModifiers(stackingState).filter(
        (modifier) => modifier.kind === "agenda_difficulty",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          kind: "agenda_difficulty",
          side: "corp",
          amount: -1,
          duration: "game",
          target: { kind: "subtype", subtype: "black_ops" },
          visibility: "public",
        }),
      ]),
    );

    const staleAction = mustAction(
      stackingState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        String(action.payload?.cardId) === blackOpsTarget,
    );
    const stale = structuredClone(stackingState);
    removeEverywhere(stale, firstSource);
    removeEverywhere(stale, secondSource);
    const staleResult = applyAction(stale, {
      matchId: stale.matchId,
      side: "corp",
      actionId: staleAction.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "p39-score-stale-agenda-difficulty",
    });
    expect(staleResult.ok).toBe(false);
    expect(stale.cardInstances[blackOpsTarget]?.zone).toMatchObject({
      side: "corp",
      zone: "serverRoot",
    });
  });
});
