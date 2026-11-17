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
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

const BROKER_DEFINITION_ID = 366;

function isBrokerCapabilityAction(
  action: LegalAction,
  brokerId: string,
  capabilityKey: "store_credits" | "withdraw_credits",
): boolean {
  return (
    action.type === "activated_card_ability" &&
    action.payload?.cardId === brokerId &&
    action.payload?.cardImplementationCapabilityBindingKind ===
      "card_spec_capability_key" &&
    action.payload?.cardImplementationAbilityKey === capabilityKey &&
    action.payload?.cardImplementationAbilityId ===
      `${BROKER_DEFINITION_ID}:${capabilityKey}` &&
    action.payload?.cardImplementationAbilityIndex === undefined &&
    action.payload?.cardImplementationLifecycleIndex === undefined
  );
}

function expectCanonicalBrokerCapability(
  action: LegalAction,
  brokerId: string,
  capabilityKey: "store_credits" | "withdraw_credits",
): void {
  expect(action.payload).toMatchObject({
    cardId: brokerId,
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: capabilityKey,
    cardImplementationAbilityId: `${BROKER_DEFINITION_ID}:${capabilityKey}`,
  });
  expect(action.payload).not.toHaveProperty("cardImplementationAbilityIndex");
  expect(action.payload).not.toHaveProperty("cardImplementationLifecycleIndex");
}

describe("Originalset Spotcheck 2026-05-16 Runner Event/Hardware Prevention hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps runner events source-bound, hidden-zone safe and replayable", () => {
    let mit = toRunnerTurn(v123CardReleaseGame("spotcheck-mit-west-tier"));
    mit.runner.credits = 20;
    emptyRunnerGripForTest(mit);
    const mitId = moveRunnerCardToGrip(mit, 313);
    const mitAction = mustAction(
      mit,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === mitId,
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
    mit = apply(
      mit,
      "runner",
      (action) => action.actionId === mitAction.actionId,
    );
    expect(mit.specialZones?.removedFromGame).toContain(mitId);
    expect(mit.runner.grip).toHaveLength(5);
    expect(mit.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 313,
      hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
      drawnCount: 5,
    });
    expect(JSON.stringify(mit.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const mitReplay = replayEvents(
      mitInitial,
      mit.eventLog.slice(mitReplayStart),
    );
    expect(mitReplay.ok).toBe(true);
    expect(hashState(mitReplay.state)).toBe(hashState(mit));

    let score = toRunnerTurn(onrV1Game("spotcheck-score-event"));
    score.runner.credits = 20;
    const scoreId = moveRunnerCardToGrip(score, 320);
    const scoreLegal = mustAction(
      score,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === scoreId,
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
    score = apply(
      score,
      "runner",
      (action) => action.actionId === scoreLegal.actionId,
    );
    expect(score.runner.credits).toBe(scoreCreditsBefore + 4);
    expect(score.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 320,
      gainedCredits: 9,
      runnerCreditsAfter: score.runner.credits,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 9,
          reason: "card_resolver",
          sourceDefinitionId: 320,
        }),
      ],
    });
    expect(
      replayEvents(scoreInitial, score.eventLog.slice(scoreReplayStart)).ok,
    ).toBe(true);

    let total = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-total-genetic-retrofit"),
    );
    total.runner.credits = 20;
    total.runner.tags = 3;
    moveRunnerCardToGrip(total, 328);
    const totalInitial = structuredClone(total);
    const totalReplayStart = total.eventLog.length;
    total = apply(
      total,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(total, action) === 328,
    );
    expect(total.runner.tags).toBe(0);
    expect(total.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 328,
      removedTags: 3,
      runnerTagsAfter: 0,
    });
    expect(JSON.stringify(total.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      replayEvents(totalInitial, total.eventLog.slice(totalReplayStart)).ok,
    ).toBe(true);

    let untaggedTotal = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-total-genetic-retrofit-untagged",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.traceTags.runner,
          id: "spotcheck_total_genetic_retrofit_untagged_runner",
          cards: MECHANIC_SMOKE_DECKS.traceTags.runner.cards.map((entry) =>
            entry.id === 328
              ? { ...entry, quantity: 2 }
              : entry,
          ),
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    untaggedTotal.runner.credits = 20;
    untaggedTotal.runner.tags = 0;
    const firstRetrofitId = moveRunnerCardToGrip(
      untaggedTotal,
      328,
    );
    const secondRetrofitId = Object.entries(untaggedTotal.cardInstances).find(
      ([cardId, card]) =>
        cardId !== firstRetrofitId &&
        card.definitionId === 328,
    )?.[0];
    if (!secondRetrofitId)
      throw new Error("Missing second Total Genetic Retrofit copy.");
    removeEverywhere(untaggedTotal, secondRetrofitId);
    untaggedTotal.runner.grip.push(secondRetrofitId);
    untaggedTotal.cardInstances[secondRetrofitId] = {
      ...untaggedTotal.cardInstances[secondRetrofitId]!,
      zone: { side: "runner", zone: "grip" },
      faceup: true,
    };
    untaggedTotal = apply(
      untaggedTotal,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(untaggedTotal, action) ===
          328,
    );
    expect(untaggedTotal.runner.tags).toBe(0);
    expect(untaggedTotal.runnerTagAvoidanceCredits).toBe(1);
    untaggedTotal = apply(
      untaggedTotal,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(untaggedTotal, action) ===
          328,
    );
    expect(untaggedTotal.runner.tags).toBe(0);
    expect(untaggedTotal.runnerTagAvoidanceCredits).toBe(2);
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
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
              (card) => card.id !== 589,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    social.runner.credits = 20;
    moveRunnerCardToGrip(social, 323);
    const socialIceId = putCorpIceOnServer(social, "hq", 589);
    const socialAction = mustAction(
      social,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(social, action) === 323,
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
    social = apply(
      social,
      "runner",
      (action) => action.actionId === socialAction.actionId,
    );
    expect(social.pendingChoice?.source).toContain(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide",
    );
    social = applyChoice(social, "runner", "hide_3");
    social = applyChoice(social, "corp", "guess_2");
    social = applyChoice(social, "runner", `ice_${socialIceId}`);
    expect(social.run?.attackedServerId).toBe("hq");
    expect(social.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 323,
      secretSpendGuessRun: true,
      hiddenZoneBarrier: true,
      targets: expect.objectContaining({
        secretSpendGuessRunGuessCorrect: false,
        autoPassChosenIce: true,
      }),
    });
    expect(
      replayEvents(socialInitial, social.eventLog.slice(socialReplayStart)).ok,
    ).toBe(true);

    let temple = toRunnerTurn(v171CardReleaseGame("spotcheck-temple-search"));
    temple.runner.credits = 20;
    const templeId = moveRunnerCardToGrip(
      temple,
      326,
    );
    const selectedProgram = putRunnerCardOnTopOfStack(
      temple,
      248,
    );
    const templeLegal = mustAction(
      temple,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === templeId,
    );
    const templeInitial = structuredClone(temple);
    const templeReplayStart = temple.eventLog.length;
    temple = apply(
      temple,
      "runner",
      (action) => action.actionId === templeLegal.actionId,
    );
    const selectedOption =
      temple.pendingChoice?.options.find(
        (option) => option.value === selectedProgram,
      )?.id ?? "";
    expect(selectedOption).not.toBe("");
    temple = applyChoice(temple, "runner", selectedOption);
    expect(temple.runner.grip).toContain(selectedProgram);
    expect(temple.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      publicRevealDefinitionId: 248,
    });
    expect(JSON.stringify(temple.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      replayEvents(templeInitial, temple.eventLog.slice(templeReplayStart)).ok,
    ).toBe(true);

    let reprisal = toRunnerTurn(
      v190CardReleaseGame("spotcheck-terrorist-reprisal"),
    );
    reprisal.runner.maxHandSize = 100;
    reprisal.runner.credits = 30;
    reprisal.corp.maxHandSize = 100;
    const reprisalId = moveRunnerCardToGrip(
      reprisal,
      327,
    );
    expect(
      getLegalActions(reprisal, "runner").some(
        (action) =>
          action.type === "play_event" && action.payload?.cardId === reprisalId,
      ),
    ).toBe(false);
    reprisal = apply(
      reprisal,
      "runner",
      (action) => action.type === "end_turn",
    );
    reprisal = apply(
      reprisal,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    reprisal.corp.credits = 60;
    reprisal.corp.clicks = 20;
    moveCorpCardToHq(reprisal, 405);
    reprisal = apply(
      reprisal,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(reprisal, action) === 405,
    );
    for (let index = 0; index < 5; index += 1) {
      reprisal = apply(
        reprisal,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(reprisal, action) === 405,
      );
    }
    reprisal = apply(
      reprisal,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(reprisal, action) === 405,
    );
    reprisal = apply(reprisal, "corp", (action) => action.type === "end_turn");
    const hqIds = [
      moveCorpCardToHq(reprisal, 596),
      moveCorpCardToHq(reprisal, 589),
      moveCorpCardToHq(reprisal, 487),
      moveCorpCardToHq(reprisal, 435),
      moveCorpCardToHq(reprisal, 491),
    ];
    keepOnlyCorpHqCards(reprisal, hqIds);
    const reprisalInitial = structuredClone(reprisal);
    const reprisalReplayStart = reprisal.eventLog.length;
    reprisal = apply(
      reprisal,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === reprisalId,
    );
    expect(reprisal.corp.hq).toHaveLength(0);
    expect(reprisal.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 327,
      hiddenZoneAction: "hq_random_discard",
      discardedCardsCount: 5,
    });
    expect(JSON.stringify(reprisal.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      replayEvents(
        reprisalInitial,
        reprisal.eventLog.slice(reprisalReplayStart),
      ).ok,
    ).toBe(true);
  });

  it("keeps hardware installs and Dermatech prevention public-safe", () => {
    let hardware = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-hardware-installs"),
    );
    hardware.runner.credits = 30;
    hardware.runner.clicks = 10;
    for (const definitionId of [
      332,
      338,
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
      expect(
        JSON.stringify(hardware.eventLog.at(-1)?.publicPayload),
      ).not.toMatch(privatePayloadMarkers);
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
    moveRunnerCardToGrip(dermatech, 337);
    dermatech = apply(
      dermatech,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(dermatech, action) ===
          337,
    );
    dermatech = apply(
      dermatech,
      "runner",
      (action) => action.type === "end_turn",
    );
    dermatech = apply(
      dermatech,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    dermatech.runner.tags = 1;
    moveCorpCardToHq(dermatech, 513);
    const initial = structuredClone(dermatech);
    const replayStart = dermatech.eventLog.length;
    dermatech = apply(
      dermatech,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(dermatech, action) ===
          513,
    );
    const optionId = dermatech.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(optionId).toBeDefined();
    if (!optionId) throw new Error("Missing Dermatech prevention option");
    dermatech = applyChoice(dermatech, "runner", optionId);
    expect(dermatech.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      sourceDefinitionId: 337,
      preventedAmount: 1,
    });
    expect(
      JSON.stringify(dermatech.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(privatePayloadMarkers);
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
            { id: 314, quantity: 1 },
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
      314,
    );
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === eventId &&
        action.payload?.onPlaySourceDisposition ===
          "return_to_grip_instead_of_trash",
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(eventId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      normalCreditsSpent: 1,
      removedTags: 1,
      runnerTagsAfter: 0,
    });
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(
      true,
    );
  });
});

describe("Originalset Spotcheck 2026-05-16 Runner Event/Run Access hardening", () => {
  const privatePayloadMarkers =
    /"(?:cardInstances|privatePayload|grip|stack|hq|rd)"\s*:/;

  it("keeps run-start events source-bound, side-safe and replayable", () => {
    for (const [definitionId, game, serverId, expectedPayload] of [
      [
        288,
        v192CardReleaseGame("spotcheck-all-nighter"),
        "rd",
        { bonusRunOnFinish: true },
      ],
      [
        293,
        v123CardReleaseGame("spotcheck-custodial-position"),
        "rd",
        { baseAccessCount: 3, effectiveAccessCount: 3 },
      ],
      [
        297,
        v123CardReleaseGame("spotcheck-executive-wiretaps"),
        "hq",
        { baseAccessCount: 3, effectiveAccessCount: 3 },
      ],
      [
        306,
        v181CardReleaseGame("spotcheck-inside-job"),
        "rd",
        { bypassFirstIce: true },
      ],
      [
        310,
        MECHANIC_SMOKE_GAMES.runAccess("spotcheck-lucidrine"),
        "archives",
        {},
      ],
    ] as const) {
      let state = toRunnerTurn(game);
      state.runner.credits = 30;
      const eventId = moveRunnerCardToGrip(state, definitionId);
      if (serverId === "rd" || serverId === "archives")
        putCorpCardOnTopOfRd(state, 596);
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
      state = apply(
        state,
        "runner",
        (action) => action.actionId === legal.actionId,
      );
      if (definitionId === 310)
        expect(state.run, definitionId).toBeUndefined();
      else expect(state.run?.attackedServerId, definitionId).toBe(serverId);
      if (state.run) {
        expect(
          state.eventLog.at(-1)?.publicPayload.resolvedEffects,
        ).toContainEqual(
          expect.objectContaining({
            kind: "start_run",
            serverId,
            accessServerId: serverId,
          }),
        );
      }
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
      [295, 415],
      [302, 426],
    ] as const) {
      let state = toRunnerTurn(
        v180CardReleaseGame(`spotcheck-${definitionId}`),
      );
      state.runner.credits = 30;
      const eventId = moveRunnerCardToGrip(state, definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) =>
            action.type === "play_event" && action.payload?.cardId === eventId,
        ),
      ).toBe(definitionId === 302);
      putCorpCardOnTopOfRd(state, stolenAgendaId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");
      state = apply(
        state,
        "runner",
        (action) => action.type === "steal_agenda",
      );
      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "play_event" && action.payload?.cardId === eventId,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === legal.actionId,
      );
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
    const gideonId = moveRunnerCardToGrip(
      gideon,
      301,
    );
    const programId = moveRunnerCardToGrip(gideon, 591);
    removeEverywhere(gideon, programId);
    gideon.runner.heap.push(programId);
    gideon.cardInstances[programId] = {
      ...gideon.cardInstances[programId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const gideonInitial = structuredClone(gideon);
    const gideonReplayStart = gideon.eventLog.length;
    expect(
      getLegalActions(gideon, "runner").find(
        (action) =>
          action.type === "play_event" && action.payload?.cardId === gideonId,
      )?.payload,
    ).toMatchObject({
      cardImplementationEffectKind: "search_trash_to_grip",
      cardImplementationSearchFilter: "any_card",
    });
    gideon = apply(
      gideon,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === gideonId,
    );
    const gideonSearchStartedPayload = gideon.eventLog.at(-1)?.publicPayload;
    expect(gideonSearchStartedPayload).toMatchObject({
      actionType: "play_event",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      sourceDefinitionId: 301,
    });
    expect(JSON.stringify(gideonSearchStartedPayload)).not.toContain(programId);
    expect(JSON.stringify(gideonSearchStartedPayload)).not.toContain(
      591,
    );
    const optionId =
      gideon.pendingChoice?.options.find((option) => option.value === programId)
        ?.id ?? "";
    expect(optionId).not.toBe("");
    gideon = applyChoice(gideon, "runner", optionId);
    expect(gideon.runner.grip).toContain(programId);
    const gideonPublicPayload = gideon.eventLog.at(-1)?.publicPayload;
    expect(gideonPublicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      sourceDefinitionId: 301,
      cardDefinitionId: 591,
      publicRevealKind: "reveal",
      publicRevealDefinitionId: 591,
      searchedZone: "runner_heap",
      selectedCount: 1,
      movedCardCount: 1,
      searchDestination: "runner_grip",
      shufflePerformed: false,
    });
    expect(JSON.stringify(gideonPublicPayload)).not.toContain(programId);
    expect(JSON.stringify(gideonPublicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    expect(
      replayEvents(gideonInitial, gideon.eventLog.slice(gideonReplayStart)).ok,
    ).toBe(true);

    let jack = toRunnerTurn(onrV1Game("spotcheck-jack-n-joe"));
    jack.runner.credits = 20;
    const jackId = moveRunnerCardToGrip(jack, 307);
    const jackInitial = structuredClone(jack);
    const jackReplayStart = jack.eventLog.length;
    const gripBefore = jack.runner.grip.length;
    jack = apply(
      jack,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === jackId,
    );
    expect(jack.runner.grip.length).toBe(gripBefore + 2);
    expect(jack.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 307,
      drawnCount: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "runner",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 307,
        }),
      ],
    });
    expect(
      replayEvents(jackInitial, jack.eventLog.slice(jackReplayStart)).ok,
    ).toBe(true);

    let kilroy = toRunnerTurn(v192CardReleaseGame("spotcheck-kilroy"));
    kilroy.runner.credits = 20;
    moveRunnerCardToGrip(kilroy, 308);
    putCorpCardOnTopOfRd(kilroy, 596);
    const kilroyInitial = structuredClone(kilroy);
    const kilroyReplayStart = kilroy.eventLog.length;
    kilroy = apply(
      kilroy,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(kilroy, action) === 308,
    );
    kilroy = apply(kilroy, "runner", (action) => action.type === "access_card");
    const creditsBeforeTrash = kilroy.runner.credits;
    kilroy = apply(
      kilroy,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(kilroy.runner.credits).toBe(creditsBeforeTrash);
    expect(kilroy.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 596,
    });
    expect(
      replayEvents(kilroyInitial, kilroy.eventLog.slice(kilroyReplayStart)).ok,
    ).toBe(true);
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
      identity: 587,
      cards: [
        { id: 340, quantity: 1 },
        { id: 345, quantity: 1 },
        { id: 353, quantity: 1 },
        { id: 355, quantity: 1 },
        { id: 356, quantity: 1 },
        { id: 357, quantity: 1 },
        { id: 358, quantity: 1 },
        { id: 364, quantity: 1 },
        { id: 365, quantity: 1 },
        { id: 366, quantity: 1 },
        { id: 591, quantity: 2 },
        { id: 595, quantity: 8 },
      ],
    };
    const corpDeck: DeckDefinition = {
      id: "spotcheck_runner_hardware_link_resources_corp",
      name: "Spotcheck Runner Hardware Link Resources Corp",
      side: "corp",
      identity: 3,
      cards: [
        { id: 588, quantity: 6 },
        { id: 589, quantity: 2 },
        { id: 596, quantity: 8 },
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
      [340, "net"],
      [355, "meat"],
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
        moveCorpCardToHq(state, 513);
      } else {
        putCorpIceOnServer(state, "rd", 470);
      }
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      if (damageSetup === "meat") {
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = apply(
          state,
          "corp",
          (action) => action.type === "mandatory_draw",
        );
        state = apply(
          state,
          "corp",
          (action) =>
            action.type === "play_operation" &&
            sourceDefinition(state, action) ===
              513,
        );
      } else {
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
            sourceDefinition(state, action) === 470,
        );
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      const optionId = state.pendingChoice?.options.find(
        (option) => option.id !== "pass",
      )?.id;
      expect(optionId, definitionId).toBeDefined();
      if (!optionId)
        throw new Error(`Missing prevention option for ${definitionId}`);
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
    moveRunnerCardToGrip(state, 366);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 366,
    );
    const brokerId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === 366,
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Missing Broker");
    const load = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "store_credits"),
    );
    expectCanonicalBrokerCapability(load, brokerId, "store_credits");
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === load.actionId,
    );
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "sourceCardInstanceId",
    );
    expect(
      getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({ sourceCardInstanceId: brokerId });
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).not.toHaveProperty("sourceCardInstanceId");
    expect(
      getLegalActions(state, "runner").some((action) =>
        isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    const creditsBefore = state.runner.credits;
    const take = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
    );
    expectCanonicalBrokerCapability(take, brokerId, "withdraw_credits");
    expect(take.payload).toMatchObject({
      cardImplementationTakesHostedCredits: true,
      gainCreditsAmount: 3,
      hostedCreditTakeAmount: 3,
      hostedCreditTakeMode: "all",
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === take.actionId,
    );
    expect(state.runner.credits).toBe(creditsBefore + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 366,
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
    213,
    215,
    216,
    218,
    222,
    224,
    227,
    228,
    230,
    231,
  ] as const;

  const runnerProgramDeck: DeckDefinition = {
    id: "spotcheck_runner_program_core",
    name: "Spotcheck Runner Program Core",
    side: "runner",
    identity: 587,
    cards: [
      ...programDefinitions.map((id) => ({ id, quantity: 1 })),
      { id: 595, quantity: 12 },
    ],
  };

  const corpProgramDeck: DeckDefinition = {
    id: "spotcheck_runner_program_core_corp",
    name: "Spotcheck Runner Program Core Corp",
    side: "corp",
    identity: 3,
    cards: [
      { id: 588, quantity: 6 },
      { id: 589, quantity: 2 },
      { id: 590, quantity: 2 },
      { id: 601, quantity: 2 },
      { id: 455, quantity: 1 },
      { id: 451, quantity: 1 },
      { id: 567, quantity: 1 },
      { id: 596, quantity: 8 },
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
            { id: 276, quantity: 1 },
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
      276,
      228,
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
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
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
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === 222) {
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
    moveRunnerCardToGrip(state, 213);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 213,
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 213,
    );
    expect(afreetId).toBeDefined();
    if (!afreetId) throw new Error("Missing Afreet");

    const bakdoorId = moveRunnerCardToGrip(state, 216);
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    expect(state.cardInstances[bakdoorId]?.hostedOn).toBe(afreetId);
    expect(state.runner.memoryUsed).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 216,
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

    moveRunnerCardToGrip(state, 224);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 224,
    );
    putCorpIceOnServer(state, "rd", 589);
    const runInitial = structuredClone(state);
    const runReplayStart = state.eventLog.length;
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
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(
      2,
    );
    const runReplay = replayEvents(
      runInitial,
      state.eventLog.slice(runReplayStart),
    );
    expect(runReplay.ok).toBe(true);
    expect(hashState(runReplay.state)).toBe(hashState(state));
  });

  it("keeps core runner breakers installed-source-bound in run windows", () => {
    const specs = [
      [218, 601],
      [227, 601],
      [228, 590],
      [230, 455],
      [231, 590],
    ] as const;

    for (const [breakerDefinitionId, iceDefinitionId] of specs) {
      let state = programCoreGame(
        `spotcheck-runner-program-core-${breakerDefinitionId}`,
      );
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
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
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
            (breakerDefinitionId === 231
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
        state = apply(
          state,
          "runner",
          (action) => action.actionId === pumpAction.actionId,
        );
      }
      expect(breakAction, breakerDefinitionId).toBeDefined();
      if (!breakAction)
        throw new Error(`Missing break action for ${breakerDefinitionId}`);
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

      state = apply(
        state,
        "runner",
        (action) => action.actionId === breakAction.actionId,
      );
      if (breakerDefinitionId === 231) {
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
      expect(hashState(replay.state), breakerDefinitionId).toBe(
        hashState(state),
      );
    }
  });

  it("applies Dropp errata as break-all then unsuccessful run end", () => {
    let state = programCoreGame("spotcheck-runner-program-core-dropp-errata");
    state.runner.credits = 20;
    state.corp.credits = 20;
    const droppId = installRunnerProgramForTest(state, 231);
    const crystalId = putCorpRootInRemote(
      state,
      567,
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      451,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === pumpAction.actionId,
    );
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
      targetIceDefinitionId: 451,
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

    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 231,
      targetIceDefinitionId: 451,
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
    233,
    236,
    240,
    245,
    248,
    250,
    251,
    252,
    254,
    262,
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
          identity: 587,
          cards: [
            ...programDefinitions.map((id) => ({ id, quantity: 1 })),
            { id: 595, quantity: 12 },
          ],
        },
        corpDeck: {
          id: `spotcheck_runner_prevention_tools_corp_${seed}`,
          name: "Spotcheck Runner Prevention Tools Corp",
          side: "corp",
          identity: 3,
          cards: [
            { id: 588, quantity: 6 },
            { id: 589, quantity: 2 },
            { id: 590, quantity: 2 },
            { id: 601, quantity: 2 },
            { id: 444, quantity: 2 },
            { id: 606, quantity: 2 },
            { id: 594, quantity: 2 },
            { id: 596, quantity: 8 },
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
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
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
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === 262) {
        const protocolId = state.runner.rig.programs.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(protocolId).toBeDefined();
        if (!protocolId) throw new Error("Missing R&D-Protocol Files");
        expect(cardCounterAmount(state, protocolId, "recurring_credit")).toBe(
          0,
        );
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Imp hosting source-safe", () => {
    let hostState = preventionToolState("imp-hosting");
    moveRunnerCardToGrip(hostState, 245);
    hostState = apply(
      hostState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hostState, action) === 245,
    );
    const impId = hostState.runner.rig.programs.find(
      (id) => hostState.cardInstances[id]?.definitionId === 245,
    );
    expect(impId).toBeDefined();
    if (!impId) throw new Error("Missing Imp");
    const jackhammerId = moveRunnerCardToGrip(
      hostState,
      248,
    );
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
  });

  it("keeps prevention-tool breakers and Mouse/Expert tools revalidated", () => {
    const specs = [
      [233, 444],
      [248, 444],
      [251, 590],
      [252, 601],
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
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
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
        state = apply(
          state,
          "runner",
          (action) => action.actionId === pumpAction.actionId,
        );
      }
      expect(breakAction, breakerDefinitionId).toBeDefined();
      if (!breakAction)
        throw new Error(`Missing break action for ${breakerDefinitionId}`);
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
      state = apply(
        state,
        "runner",
        (action) => action.actionId === breakAction.actionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, breakerDefinitionId).toBe(true);
      expect(hashState(replay.state), breakerDefinitionId).toBe(
        hashState(state),
      );
    }

    let toolState = preventionToolState("mouse-expert");
    for (const definitionId of [
      236,
      254,
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
    const mouseTargetId = putCorpRootInRemote(toolState, 606);
    const expose = mustAction(
      toolState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(toolState, action) === 254,
    );
    expect(expose.label).toBe("Mouse: installierte Korp-Karte exposen");
    expect(expose.payload).not.toHaveProperty("targetDefinitionId");
    expect(expose.payload).not.toHaveProperty(
      "cardImplementationExposeTargetId",
    );
    expect(JSON.stringify(expose.payload)).not.toMatch(/simple_upgrade/);
    const removedMouse = structuredClone(toolState);
    const mouseId = toolState.runner.rig.programs.find(
      (id) => toolState.cardInstances[id]?.definitionId === 254,
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
    toolState = apply(
      toolState,
      "runner",
      (action) => action.actionId === expose.actionId,
    );
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
    expect(
      JSON.stringify(getPlayerView(toolState, "runner").pendingChoice),
    ).not.toMatch(/"value"|simple_upgrade|Simple Upgrade/);
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_choice",
      sourceDefinitionId: 254,
    });
    expect(
      JSON.stringify(toolState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /"targetDefinitionId"|"cardImplementationExposeTargetId"|simple_upgrade/,
    );
    toolState = applyChoice(toolState, "runner", mouseTargetOptionId ?? "");
    expect(toolState.pendingChoice?.source).toContain(
      "p3_36.expose_installed_card_review:",
    );
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "expose_installed_card_review",
      sourceDefinitionId: 254,
      cardDefinitionId: 606,
    });
    expect(
      JSON.stringify(toolState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(privatePayloadMarkers);
    expect(
      getPlayerView(toolState, "runner")
        .servers.flatMap((server) => server.root)
        .some((card) => card.known && card.definitionId === 606),
    ).toBe(true);
    toolState = applyChoice(toolState, "runner", "done");
    expect(toolState.pendingChoice).toBeUndefined();
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "expose_installed_card_finish",
      sourceDefinitionId: 254,
    });
    const exposeReplay = replayEvents(
      exposeInitial,
      toolState.eventLog.slice(exposeReplayStart),
    );
    expect(exposeReplay.ok).toBe(true);
    expect(hashState(exposeReplay.state)).toBe(hashState(toolState));

    putCorpCardOnTopOfRd(toolState, 588);
    putCorpCardOnTopOfRd(toolState, 596);
    putCorpCardOnTopOfRd(toolState, 594);
    const accessInitial = structuredClone(toolState);
    const accessReplayStart = toolState.eventLog.length;
    toolState = apply(
      toolState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    toolState = passRootRezWindowBeforeAccessIfOpen(toolState);
    toolState = apply(
      toolState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(toolState.eventLog.at(-1)?.publicPayload).toMatchObject({
      visibility: { class: "hidden_info_barrier" },
    });
    expect(
      JSON.stringify(toolState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"/);
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
    369,
    370,
    371,
    374,
    375,
    377,
    378,
    379,
    380,
    388,
  ] as const;

  function resourceContactState(
    seed: string,
    options?: {
      shellTraderQuantity?: number;
      includeCloak?: boolean;
      includeAfreet?: boolean;
    },
  ): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: `spotcheck_runner_resource_contacts_${seed}`,
          name: "Spotcheck Runner Resource Contacts",
          side: "runner",
          identity: 587,
          cards: [
            ...resourceDefinitions.map((id) => ({
              id,
              quantity:
                id === 388
                  ? (options?.shellTraderQuantity ?? 1)
                  : 1,
            })),
            ...(options?.includeCloak
              ? [{ id: 223, quantity: 1 }]
              : []),
            ...(options?.includeAfreet
              ? [
                  { id: 213, quantity: 1 },
                  { id: 235, quantity: 1 },
                ]
              : []),
            { id: 35, quantity: 1 },
            { id: 597, quantity: 2 },
            { id: 602, quantity: 1 },
            { id: 588, quantity: 2 },
            { id: 595, quantity: 12 },
          ],
        },
        corpDeck: {
          id: `spotcheck_runner_resource_contacts_corp_${seed}`,
          name: "Spotcheck Runner Resource Contacts Corp",
          side: "corp",
          identity: 3,
          cards: [
            { id: 588, quantity: 6 },
            { id: 589, quantity: 2 },
            { id: 596, quantity: 8 },
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
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");
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
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      if (definitionId === 380) {
        const resourceId = state.runner.rig.resources.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(resourceId).toBeDefined();
        if (!resourceId) throw new Error(`Missing ${definitionId}`);
        expect(cardCounterAmount(state, resourceId, "recurring_credit")).toBe(
          0,
        );
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
      if (definitionId === 388) {
        const resourceId = state.runner.rig.resources.find(
          (id) => state.cardInstances[id]?.definitionId === definitionId,
        );
        expect(resourceId).toBeDefined();
        if (!resourceId) throw new Error(`Missing ${definitionId}`);
        expect(cardCounterAmount(state, resourceId, "recurring_credit")).toBe(
          0,
        );
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Danshi and Databroker active resource actions source-bound", () => {
    let danshi = resourceContactState("danshi");
    danshi.runner.tags = 3;
    moveRunnerCardToGrip(danshi, 370);
    danshi = apply(
      danshi,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(danshi, action) === 370,
    );
    const danshiId = danshi.runner.rig.resources.find(
      (id) =>
        danshi.cardInstances[id]?.definitionId ===
        370,
    );
    expect(danshiId).toBeDefined();
    if (!danshiId) throw new Error("Missing Danshi's Second ID");
    const removeTags = mustAction(
      danshi,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === danshiId &&
        sourceDefinition(danshi, action) === 370,
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
    danshi = apply(
      danshi,
      "runner",
      (action) => action.actionId === removeTags.actionId,
    );
    expect(danshi.runner.tags).toBe(0);
    expect(danshi.runner.heap).toContain(danshiId);
    expect(danshi.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 370,
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
    moveRunnerCardToGrip(databroker, 371);
    databroker = apply(
      databroker,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(databroker, action) === 371,
    );
    const brokerId = databroker.runner.rig.resources.find(
      (id) =>
        databroker.cardInstances[id]?.definitionId === 371,
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Missing Databroker");
    const agendaId = scoreRunnerAgendaForTest(databroker, 588);
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
    expect(databroker.specialZones?.removedFromGame ?? []).not.toContain(
      agendaId,
    );
    expect(databroker.cardInstances[agendaId]?.agendaPointsSpent).toBe(1);
    expect(databroker.runner.heap).toContain(brokerId);
    expect(databroker.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 371,
      abilityId: "databroker",
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
    moveRunnerCardToGrip(state, 377);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 377,
    );
    const junkyardId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 377,
    );
    expect(junkyardId).toBeDefined();
    if (!junkyardId) throw new Error("Missing Junkyard BBS");

    const bottomHeapId = findCard(state, 595);
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
      369,
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
        sourceDefinition(state, action) === 377 &&
        action.payload?.cardId === junkyardId &&
        action.payload?.cardImplementationTopTrashTargetId === topHeapId,
    );
    expect(junkyardAction.costs).toEqual([{ clicks: 1, credits: 1 }]);
    expect(junkyardAction.payload).toMatchObject({
      cardImplementationEffectKind: "move_top_trash_to_grip",
      cardImplementationTopTrashTargetId: topHeapId,
      targetCardId: topHeapId,
    });

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
      sourceDefinitionId: 377,
      cardDefinitionId: 377,
      returnedCardDefinitionId: 369,
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
    moveRunnerCardToGrip(state, 375);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 375,
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
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    emptyRunnerGripForTest(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.delayedInstallAbility === "set_aside_from_grip",
      ),
    ).toBe(false);

    const programId = moveRunnerCardToGrip(state, 597);
    const hardwareId = moveRunnerCardToGrip(state, 602);
    const prepareActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip",
    );
    expect(
      prepareActions.map((action) => action.payload?.targetCardId).sort(),
    ).toEqual([hardwareId, programId].sort());
    for (const action of prepareActions)
      expect(action.costs).toEqual([{ clicks: 1 }]);
  });

  it("offers The Shell Traders prepare actions for programs while current MU is full", () => {
    let state = resourceContactState("shell-prepare-under-memory-pressure");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    installRunnerProgramForTest(state, 597);
    state.runner.memoryLimit = state.runner.memoryUsed;
    const targetProgramId = moveRunnerCardToGrip(
      state,
      35,
    );

    const prepareActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === targetProgramId,
    );

    expect(state.runner.memoryUsed).toBe(state.runner.memoryLimit);
    expect(prepareActions).toHaveLength(1);
  });

  it.each([
    ["paid", true, "host"],
    ["paid", false, "host"],
    ["start_turn", true, "host"],
    ["start_turn", false, "host"],
    ["paid", true, "rig"],
    ["paid", false, "rig"],
  ] as const)(
    "installs Shell Traders programs via %s with full memory %s on %s",
    (reason, fullMemory, destination) => {
      let state = resourceContactState(
        `shell-afreet-${reason}-${fullMemory}-${destination}`,
        { includeAfreet: true },
      );
      moveRunnerCardToGrip(state, 388);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === 388,
      );
      const hostId = installRunnerProgramForTest(state, 213);
      const installedId = installRunnerProgramForTest(state, 597);
      const targetId = moveRunnerCardToGrip(state, 235);
      state = apply(
        state,
        "runner",
        (action) =>
          action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
          action.payload?.targetCardId === targetId,
      );
      state.runner.memoryLimit = state.runner.memoryUsed + (fullMemory ? 0 : 1);
      setCardCounterForTest(state, targetId, "shell", 1);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const memoryBefore = state.runner.memoryUsed;
      const heapBefore = [...state.runner.heap];
      const creditsBefore = state.runner.credits;
      if (reason === "paid") {
        state = apply(
          state,
          "runner",
          (action) =>
            action.payload?.delayedInstallAbility === "remove_shell_counter" &&
            action.payload?.targetCardId === targetId,
        );
      } else {
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = apply(
          state,
          "corp",
          (action) => action.type === "mandatory_draw",
        );
        state = apply(state, "corp", (action) => action.type === "end_turn");
      }
      expect(state.pendingChoice).toMatchObject({
        kind: "select_option",
        presentationKey: "delayed_install_destination",
      });
      expect(
        state.pendingChoice?.options.map((option) => option.value),
      ).toEqual(["rig", hostId]);
      expect(
        getPlayerView(state, "runner").pendingChoice?.options.find(
          (option) => option.value === hostId,
        )?.metadata?.cardTitle,
      ).toBe("Afreet");
      expect(
        getPlayerView(state, "runner").pendingChoice?.options.map(
          (option) => option.metadata?.delayedInstallRequiresProgramTrash,
        ),
      ).toEqual([fullMemory, false]);
      expect(cardCounterAmount(state, targetId, "shell")).toBe(1);
      const choice = mustAction(
        state,
        "runner",
        (action) => action.type === "resolve_choice",
      );
      const filledHostState = structuredClone(state);
      const fillerId = installRunnerProgramForTest(
        filledHostState,
        35,
      );
      filledHostState.cardInstances[fillerId]!.hostedOn = hostId;
      filledHostState.cardInstances[installedId]!.hostedOn = hostId;
      filledHostState.runner.memoryUsed -= 3;
      const filledHostHash = hashState(filledHostState);
      const filledHostResult = applyAction(filledHostState, {
        matchId: filledHostState.matchId,
        side: "runner",
        actionId: choice.actionId,
        clientKnownStateVersion: filledHostState.stateVersion,
        idempotencyKey: "shell-afreet-capacity-changed",
        selectedChoices: {
          choiceId: filledHostState.pendingChoice?.choiceId,
          selectedOptionIds: [`host_${hostId}`],
        },
      });
      expect(filledHostResult.ok).toBe(true);
      if (!filledHostResult.ok) throw new Error("Host-Speicherwahl fehlt.");
      expect(filledHostResult.state.pendingChoice?.kind).toBe("select_cards");
      expect(filledHostResult.state.runner.rig.programs).not.toContain(
        targetId,
      );
      expect(cardCounterAmount(filledHostResult.state, targetId, "shell")).toBe(
        1,
      );
      expect(hashState(filledHostState)).toBe(filledHostHash);
      expect(cardCounterAmount(filledHostState, targetId, "shell")).toBe(1);
      for (const [optionId, version] of [
        [`host_${installedId}`, state.stateVersion],
        [`host_${hostId}`, state.stateVersion - 1],
      ] as const) {
        const rejected = applyAction(state, {
          matchId: state.matchId,
          side: "runner",
          actionId: choice.actionId,
          clientKnownStateVersion: version,
          idempotencyKey: `shell-afreet-invalid-${optionId}-${version}`,
          selectedChoices: {
            choiceId: state.pendingChoice?.choiceId,
            selectedOptionIds: [optionId],
          },
        });
        expect(rejected.ok).toBe(false);
      }
      state = applyChoice(
        state,
        "runner",
        destination === "host" ? `host_${hostId}` : "rig",
      );
      if (destination === "rig" && fullMemory) {
        expect(state.pendingChoice?.source).toMatch(
          /^v1912\.delayed_install_memory:/,
        );
        state = applyChoice(state, "runner", `card_${installedId}`);
      }
      expect(state.pendingChoice).toBeUndefined();
      expect(state.phase).toBe("runner_action_phase");
      expect(state.runner.rig.programs).toContain(targetId);
      expect(state.cardInstances[targetId]?.hostedOn).toBe(
        destination === "host" ? hostId : undefined,
      );
      expect(state.runner.memoryUsed).toBe(
        memoryBefore + (destination === "rig" && !fullMemory ? 1 : 0),
      );
      expect(state.runner.heap).toEqual(
        destination === "rig" && fullMemory
          ? [...heapBefore, installedId]
          : heapBefore,
      );
      expect(state.runner.credits).toBe(
        creditsBefore - (reason === "paid" ? 1 : 0),
      );
      expect(cardCounterAmount(state, targetId, "shell")).toBe(0);
      expect(state.specialZones?.setAside).not.toContain(targetId);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it.each([
    ["paid", 235, true],
    ["start_turn", 235, false],
    ["paid", 223, false],
    ["start_turn", 223, true],
  ] as const)(
    "replaces a program in full Afreet through Shell Traders via %s with %s and full rig %s",
    (reason, targetDefinitionId, fullRig) => {
      let state = resourceContactState(`shell-full-host-${reason}`, {
        includeAfreet: true,
        includeCloak: true,
      });
      installRunnerResourceForTest(state, 388);
      const hostId = installRunnerProgramForTest(state, 213);
      const hostedId = installRunnerProgramForTest(state, 597);
      const otherHostedId = installRunnerProgramForTest(
        state,
        35,
      );
      for (const id of [hostedId, otherHostedId]) {
        state.cardInstances[id]!.hostedOn = hostId;
        state.runner.memoryUsed -=
          CARD_DEFINITIONS_BY_ID[
            state.cardInstances[id]!.definitionId
          ]!.memoryCost!;
      }
      state.runner.memoryLimit = state.runner.memoryUsed + (fullRig ? 0 : 4);
      const targetId = moveRunnerCardToGrip(state, targetDefinitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
          action.payload?.targetCardId === targetId,
      );
      setCardCounterForTest(state, targetId, "shell", 1);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const memoryBefore = state.runner.memoryUsed;
      const creditsBefore = state.runner.credits;
      if (reason === "paid") {
        state = apply(
          state,
          "runner",
          (action) =>
            action.payload?.delayedInstallAbility === "remove_shell_counter" &&
            action.payload?.targetCardId === targetId,
        );
      } else {
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = apply(
          state,
          "corp",
          (action) => action.type === "mandatory_draw",
        );
        state = apply(state, "corp", (action) => action.type === "end_turn");
      }
      expect(state.pendingChoice?.presentationKey).toBe(
        "delayed_install_destination",
      );
      expect(
        state.pendingChoice?.options.map((option) => option.value),
      ).toContain(hostId);
      state = applyChoice(state, "runner", `host_${hostId}`);
      expect(state.pendingChoice?.kind).toBe("select_cards");
      expect(
        state.pendingChoice?.options.map((option) => option.value).sort(),
      ).toEqual([hostedId, otherHostedId].sort());
      expect(cardCounterAmount(state, targetId, "shell")).toBe(1);
      expect(cardCounterAmount(state, targetId, "bit")).toBe(0);
      state = applyChoice(state, "runner", `card_${hostedId}`);
      expect(state.pendingChoice).toBeUndefined();
      expect(state.phase).toBe("runner_action_phase");
      expect(state.runner.heap).toContain(hostedId);
      expect(state.cardInstances[otherHostedId]?.hostedOn).toBe(hostId);
      expect(state.cardInstances[targetId]?.hostedOn).toBe(hostId);
      expect(state.runner.memoryUsed).toBe(memoryBefore);
      expect(state.runner.credits).toBe(
        creditsBefore - (reason === "paid" ? 1 : 0),
      );
      expect(cardCounterAmount(state, targetId, "shell")).toBe(0);
      if (targetDefinitionId === 223)
        expect(cardCounterAmount(state, targetId, "bit")).toBe(3);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("revalidates Shell Traders host replacement sets and requires enough host memory", () => {
    let state = resourceContactState("shell-host-replacement-revalidation", {
      includeAfreet: true,
      includeCloak: true,
    });
    installRunnerResourceForTest(state, 388);
    const hostId = installRunnerProgramForTest(state, 213);
    const outsideId = installRunnerProgramForTest(
      state,
      235,
    );
    const hostedIds = [
      installRunnerProgramForTest(state, 597),
      installRunnerProgramCopyForTest(state, 597),
      installRunnerProgramForTest(state, 223),
    ];
    for (const id of hostedIds) {
      state.cardInstances[id]!.hostedOn = hostId;
      state.runner.memoryUsed -= 1;
    }
    const targetId = moveRunnerCardToGrip(state, 35);
    state = apply(
      state,
      "runner",
      (action) =>
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === targetId,
    );
    setCardCounterForTest(state, targetId, "shell", 1);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const memoryBefore = state.runner.memoryUsed;
    state = apply(
      state,
      "runner",
      (action) =>
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        action.payload?.targetCardId === targetId,
    );
    state = applyChoice(state, "runner", `host_${hostId}`);
    const action = mustAction(
      state,
      "runner",
      (candidate) => candidate.type === "resolve_choice",
    );
    const select = (
      target: GameState,
      ids: string[],
      version = target.stateVersion,
      side: "runner" | "corp" = "runner",
    ) =>
      applyAction(target, {
        matchId: target.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: version,
        idempotencyKey: `replacement-${ids.join("-")}-${version}-${side}`,
        selectedChoices: {
          choiceId: target.pendingChoice?.choiceId,
          selectedOptionIds: ids,
        },
      });
    const before = hashState(state);
    for (const ids of [
      [],
      [`card_${hostedIds[0]}`],
      [`card_${outsideId}`],
      [`card_${hostId}`],
      [`card_${hostedIds[0]}`, `card_${hostedIds[0]}`],
    ]) {
      expect(select(state, ids).ok).toBe(false);
      expect(hashState(state)).toBe(before);
    }
    const validIds = hostedIds.slice(0, 2).map((id) => `card_${id}`);
    expect(select(state, validIds, state.stateVersion - 1).ok).toBe(false);
    expect(select(state, validIds, state.stateVersion, "corp").ok).toBe(false);
    const moved = structuredClone(state);
    delete moved.cardInstances[hostedIds[0]!]!.hostedOn;
    moved.runner.memoryUsed += 1;
    const movedHash = hashState(moved);
    expect(select(moved, validIds).ok).toBe(false);
    expect(hashState(moved)).toBe(movedHash);
    const missingHost = structuredClone(state);
    missingHost.runner.rig.programs = missingHost.runner.rig.programs.filter(
      (id) => id !== hostId,
    );
    const missingHash = hashState(missingHost);
    expect(select(missingHost, validIds).ok).toBe(false);
    expect(hashState(missingHost)).toBe(missingHash);
    const result = select(state, validIds);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.memoryUsed).toBe(memoryBefore);
    expect(state.cardInstances[targetId]?.hostedOn).toBe(hostId);
    expect(state.cardInstances[hostedIds[2]!]!.hostedOn).toBe(hostId);
    expect(state.runner.heap).toEqual(
      expect.arrayContaining(hostedIds.slice(0, 2)),
    );
    expect(cardCounterAmount(state, targetId, "shell")).toBe(0);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("requires program trash before the last Shell counter installs under MU pressure", () => {
    let state = resourceContactState("shell-final-counter-memory-choice");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const installedProgramId = installRunnerProgramForTest(
      state,
      597,
    );
    state.runner.memoryLimit = state.runner.memoryUsed + 1;
    const targetProgramId = moveRunnerCardCopyToGrip(state, 597);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === targetProgramId,
    );
    state.runner.memoryLimit = state.runner.memoryUsed;
    setCardCounterForTest(state, targetProgramId, "shell", 1);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.runner.credits;

    const removeCounter = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        action.payload?.targetCardId === targetProgramId,
    );
    state = apply(
      state,
      "runner",
      (action) => action.actionId === removeCounter.actionId,
    );

    expect(state.runner.credits).toBe(creditsBefore - 1);
    expect(cardCounterAmount(state, targetProgramId, "shell")).toBe(1);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      kind: "select_cards",
      minSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(state.pendingChoice?.source).toMatch(
      /^v1912\.delayed_install_memory:/,
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const trashOption = state.pendingChoice?.options.find(
      (option) => option.value === installedProgramId,
    );
    if (!trashOption) throw new Error("Shell-Traders-MU-Trashoption fehlt.");
    const resolveChoice = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const invalidChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveChoice.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["card_not_installed"],
      },
      idempotencyKey: "shell-memory-choice-invalid",
    });
    expect(invalidChoice.ok).toBe(false);
    const staleChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveChoice.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [trashOption.id],
      },
      idempotencyKey: "shell-memory-choice-stale",
    });
    expect(staleChoice.ok).toBe(false);

    state = applyChoice(state, "runner", trashOption.id);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.rig.programs).toContain(targetProgramId);
    expect(state.runner.rig.programs).not.toContain(installedProgramId);
    expect(state.runner.heap).toContain(installedProgramId);
    expect(state.specialZones?.setAside).not.toContain(targetProgramId);
    expect(cardCounterAmount(state, targetProgramId, "shell")).toBe(0);
    expect(state.runner.memoryUsed).toBe(state.runner.memoryLimit);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      abilityFamily: "hosting-counters",
      abilityId: "resolve_delayed_install_memory",
      sourceDefinitionId: 388,
      targets: expect.objectContaining({
        targetCardDefinitionId: 597,
      }),
      amounts: expect.objectContaining({
        removedCounterAmount: 1,
        remainingCounters: 0,
        trashedCount: 1,
      }),
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resumes the Runner start-of-turn flow after Shell Traders frees MU", () => {
    let state = resourceContactState("shell-start-turn-memory-choice");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const installedProgramId = installRunnerProgramForTest(
      state,
      597,
    );
    state.runner.memoryLimit = state.runner.memoryUsed + 1;
    const targetProgramId = moveRunnerCardCopyToGrip(state, 597);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === targetProgramId,
    );
    state.runner.memoryLimit = state.runner.memoryUsed;
    setCardCounterForTest(state, targetProgramId, "shell", 1);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(state.pendingChoice?.source).toMatch(
      /^v1912\.delayed_install_memory:.*:start_turn:/,
    );
    expect(cardCounterAmount(state, targetProgramId, "shell")).toBe(1);
    const trashOption = state.pendingChoice?.options.find(
      (option) => option.value === installedProgramId,
    );
    if (!trashOption)
      throw new Error("Shell-Traders-Startzug-MU-Option fehlt.");

    state = applyChoice(state, "runner", trashOption.id);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.phase).toBe("runner_action_phase");
    expect(state.runner.rig.programs).toContain(targetProgramId);
    expect(state.runner.rig.programs).not.toContain(installedProgramId);
    expect(state.runner.heap).toContain(installedProgramId);
    expect(cardCounterAmount(state, targetProgramId, "shell")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_change",
          side: "runner",
          counterType: "shell",
          removedCounterAmount: 1,
          remainingCounters: 0,
          sourceDefinitionId: 388,
          cardDefinitionId: 597,
          reason: "start_of_turn",
        }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("sets aside Shell Traders targets public, revalidates drift, and keeps hidden grip data out of public payloads", () => {
    let state = resourceContactState("shell-set-aside");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const shellId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        388,
    );
    expect(shellId).toBeDefined();
    if (!shellId) throw new Error("Missing The Shell Traders");
    const programId = moveRunnerCardToGrip(state, 597);
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === prepare.actionId,
    );
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
      sourceDefinitionId: 388,
      amounts: expect.objectContaining({
        addedCounterAmount: 2,
        remainingCounters: 2,
      }),
      targets: expect.objectContaining({
        targetCardDefinitionId: 597,
      }),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("runs Cloak install lifecycle when two Shell Traders remove the last counters at start of turn", () => {
    let state = resourceContactState("shell-cloak-start-turn-lifecycle", {
      shellTraderQuantity: 2,
      includeCloak: true,
    });
    for (let index = 0; index < 2; index += 1) {
      const shellId = moveRunnerCardCopyToGrip(
        state,
        388,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" && action.payload?.cardId === shellId,
      );
    }
    const cloakId = moveRunnerCardToGrip(state, 223);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === cloakId,
    );
    setCardCounterForTest(state, cloakId, "shell", 2);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(0);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.pendingChoice?.source).toMatch(/^runner_start\.order:/);
    state = applyChoice(
      state,
      "runner",
      String(state.pendingChoice?.options[0]?.id),
    );

    expect(state.specialZones?.setAside).not.toContain(cloakId);
    expect(state.runner.rig.programs).toContain(cloakId);
    expect(cardCounterAmount(state, cloakId, "shell")).toBe(0);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "add_hosted_credits",
          side: "runner",
          counterType: "bit",
          addedCounterAmount: 3,
          remainingCounters: 3,
          sourceDefinitionId: 223,
        }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("runs Cloak install lifecycle when the paid Shell Traders ability removes the last counter", () => {
    let state = resourceContactState("shell-cloak-paid-lifecycle", {
      includeCloak: true,
    });
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const cloakId = moveRunnerCardToGrip(state, 223);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === cloakId,
    );
    setCardCounterForTest(state, cloakId, "shell", 1);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        action.payload?.targetCardId === cloakId,
    );

    expect(state.runner.rig.programs).toContain(cloakId);
    expect(cardCounterAmount(state, cloakId, "shell")).toBe(0);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);
  });

  it("offers paid Shell removal during a run encounter without replacing encounter actions", () => {
    let state = resourceContactState("shell-paid-during-run", {
      includeCloak: true,
    });
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const cloakId = moveRunnerCardToGrip(state, 223);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === cloakId,
    );
    setCardCounterForTest(state, cloakId, "shell", 2);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state.timingPoint = "run.jack_out_window";
    state.activeSide = "runner";
    if (state.run) state.run.phase = "movement";

    const actions = getLegalActions(state, "runner");
    expect(
      actions.some(
        (action) =>
          action.type === "continue_run" ||
          action.type === "break_subroutine" ||
          action.type === "pump_breaker" ||
          action.type === "jack_out",
      ),
    ).toBe(true);
    expect(
      actions.some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.delayedInstallAbility === "remove_shell_counter" &&
          action.payload?.targetCardId === cloakId,
      ),
    ).toBe(true);
  });

  it("defers Cloak install lifecycle until the Shell Traders MU choice resolves", () => {
    let state = resourceContactState("shell-cloak-memory-lifecycle", {
      includeCloak: true,
    });
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const installedProgramId = installRunnerProgramForTest(
      state,
      597,
    );
    state.runner.memoryLimit = state.runner.memoryUsed;
    const cloakId = moveRunnerCardToGrip(state, 223);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === cloakId,
    );
    setCardCounterForTest(state, cloakId, "shell", 1);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter" &&
        action.payload?.targetCardId === cloakId,
    );

    expect(state.pendingChoice?.source).toMatch(
      /^v1912\.delayed_install_memory:/,
    );
    expect(state.specialZones?.setAside).toContain(cloakId);
    expect(cardCounterAmount(state, cloakId, "shell")).toBe(1);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(0);
    const trashOption = state.pendingChoice?.options.find(
      (option) => option.value === installedProgramId,
    );
    if (!trashOption) throw new Error("Shell-Traders-Cloak-MU-Option fehlt.");

    state = applyChoice(state, "runner", trashOption.id);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.rig.programs).toContain(cloakId);
    expect(state.runner.rig.programs).not.toContain(installedProgramId);
    expect(cardCounterAmount(state, cloakId, "shell")).toBe(0);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);
  });

  it("removes Shell counters through paid and start-of-turn paths and installs the prepared card", () => {
    let state = resourceContactState("shell-counter-removal");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const programId = moveRunnerCardToGrip(state, 597);
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === paidRemove.actionId,
    );
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
          sourceDefinitionId: 388,
          cardDefinitionId: 597,
          reason: "start_of_turn",
        }),
      ]),
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("requires a Runner choice before removing a start-of-turn Shell counter from multiple prepared cards", () => {
    let state = resourceContactState("shell-counter-start-turn-choice");
    moveRunnerCardToGrip(state, 388);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 388,
    );
    const programId = moveRunnerCardToGrip(state, 597);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === programId,
    );
    const hardwareId = moveRunnerCardToGrip(state, 602);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === hardwareId,
    );
    expect(cardCounterAmount(state, programId, "shell")).toBe(2);
    expect(cardCounterAmount(state, hardwareId, "shell")).toBe(2);
    setCardCounterForTest(state, state.runner.identity, "trace_tag_counter", 1);
    const tagsBeforeStart = state.runner.tags;

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const choice = state.pendingChoice;
    expect(choice).toMatchObject({
      side: "runner",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "public",
    });
    expect(choice?.source).toMatch(/^runner_start\.delayed_install:/);
    expect(cardCounterAmount(state, programId, "shell")).toBe(2);
    expect(cardCounterAmount(state, hardwareId, "shell")).toBe(2);
    expect(state.runner.tags).toBe(tagsBeforeStart + 1);
    const hardwareOption = choice?.options.find(
      (option) => option.value === hardwareId,
    );
    expect(hardwareOption).toMatchObject({
      label: "Simple Setup Hardware (2)",
      metadata: { delayedInstallRemainingCounters: 2 },
    });
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.find(
        (option) => option.id === hardwareOption?.id,
      )?.metadata,
    ).toMatchObject({ delayedInstallRemainingCounters: 2 });
    if (!hardwareOption) throw new Error("Shell-Traders-Hardwareoption fehlt.");

    state = applyChoice(state, "runner", hardwareOption.id);

    expect(state.pendingChoice).toBeUndefined();
    expect(cardCounterAmount(state, programId, "shell")).toBe(2);
    expect(cardCounterAmount(state, hardwareId, "shell")).toBe(1);
    expect(state.runner.tags).toBe(tagsBeforeStart + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      abilityFamily: "hosting-counters",
      abilityId: "start_turn_remove_shell_counter",
      effectKind: "counter_change",
      targets: expect.objectContaining({
        targetCardDefinitionId: 602,
      }),
      amounts: expect.objectContaining({
        removedCounterAmount: 1,
        remainingCounters: 1,
      }),
      resolvedEffects: [
        expect.objectContaining({
          kind: "counter_change",
          reason: "start_of_turn",
          cardDefinitionId: 602,
          removedCounterAmount: 1,
          remainingCounters: 1,
        }),
      ],
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies P3.9 agenda_difficulty modifiers from scored Corp agendas to score actions and revalidation", () => {
    const p39CardIds = new Set([
      401,
      403,
      413,
      414,
      415,
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
              { id: 401, quantity: 2 },
              { id: 403, quantity: 2 },
              { id: 413, quantity: 2 },
              { id: 414, quantity: 2 },
              { id: 415, quantity: 1 },
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
        401,
        413,
      ],
      [413, 415],
      [
        414,
        403,
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
      401,
    );
    const secondSource = scoreCorpAgendaForTest(
      stackingState,
      401,
    );
    const blackOpsTarget = putCorpRootInRemote(
      stackingState,
      413,
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
          sourceDefinitionId: 401,
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
