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
} from "./index";
import { collectActiveModifiers } from "./ability-engine/active-modifiers";
import { executeCardImplementationEffects } from "./ability-engine/effect-interpreter";
import {
  cardImplementationCoverageForDefinitionId,
} from "./card-implementations/coverage";
import {
  cardImplementationForDefinitionId,
} from "./card-implementations/registry";
import { buildPublicAbilitySchemaContext } from "./mechanics/public-payload-schema";
import { publicContextForAction } from "./public-context";
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
} from "./test-fixtures/mechanic-smoke-fixtures";
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
} from "./test-fixtures/index-test-helpers";

const PRO007_CORP_DECK: DeckDefinition = {
  ...ONR_V1_CORP_DECK,
  id: "proteus_pro007_corp_test_harness",
  cards: [
    ...ONR_V1_CORP_DECK.cards,
    { id: "onr_proteus_047_credit-consolidation", quantity: 1 },
    { id: "onr_proteus_048_data-sifters", quantity: 1 },
    { id: "onr_proteus_050_manhunt", quantity: 1 },
    { id: "onr_proteus_052_schlaghund-pointers", quantity: 1 },
    { id: "onr_proteus_053_underworld-mole", quantity: 1 },
  ],
};

const PRO007_RUNNER_DECK: DeckDefinition = {
  ...ONR_V1_RUNNER_DECK,
  id: "proteus_pro007_runner_test_harness",
  cards: [
    ...ONR_V1_RUNNER_DECK.cards,
    { id: "onr_proteus_128_airport-locker", quantity: 1 },
    { id: "onr_proteus_150_streetware-distributor", quantity: 1 },
  ],
};

function proteusPro007Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: PRO007_RUNNER_DECK,
    corpDeck: PRO007_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function corpActionStateForProteusPro007(seed: string): GameState {
  const state = proteusPro007Game(seed);
  return apply(state, "corp", (action) => action.type === "mandatory_draw");
}

function playCorpOperationByDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
): GameState {
  const cardId = addCorpCardToHqForTest(
    state,
    definitionId,
    definitionId.replace(/[^a-z0-9]/gi, "_"),
  );
  keepOnlyCorpHqCard(state, cardId);
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "play_operation" && action.payload?.cardId === cardId,
  );
}

function addRunnerCardToGripForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `pro008_${suffix}_${definitionId}` as CardInstanceId;
  state.runner.grip.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addRunnerResourceToRigForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `pro008_resource_${suffix}_${definitionId}` as CardInstanceId;
  state.runner.rig.resources.push(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function addCorpCardToRdForTest(
  state: GameState,
  definitionId: CardDefinitionId,
  suffix: string,
): CardInstanceId {
  const cardId = `pro008_rd_${suffix}_${definitionId}` as CardInstanceId;
  state.corp.rd.unshift(cardId);
  state.cardInstances[cardId] = {
    instanceId: cardId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  return cardId;
}

function playRunnerEventByDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
  serverId?: ServerId,
): GameState {
  addRunnerCardToGripForTest(
    state,
    definitionId,
    definitionId.replace(/[^a-z0-9]/gi, "_"),
  );
  return apply(
    state,
    "runner",
    (action) =>
      action.type === "play_event" &&
      sourceDefinition(state, action) === definitionId &&
      (serverId === undefined || action.payload?.serverId === serverId),
  );
}

function resolveTraceWithZeroBids(state: GameState): GameState {
  let resolved = applyChoice(state, "corp", "bid_0");
  if (resolved.pendingChoice?.source.startsWith("trace_base_link:"))
    resolved = applyChoice(resolved, "runner", "pass");
  resolved = applyChoice(resolved, "runner", "bid_0");
  if (resolved.pendingChoice?.source.startsWith("trace_post_bid_link:"))
    resolved = applyChoice(resolved, "runner", "pass");
  return resolved;
}

describe("Proteus PRO007 Corp Operation Economy/Trace/History", () => {
  it("plays Credit Consolidation and gates Data Sifters on Runner node trash last turn", () => {
    let state = corpActionStateForProteusPro007("proteus-pro007-economy");
    state.corp.credits = 20;

    const dataSiftersId = addCorpCardToHqForTest(
      state,
      "onr_proteus_048_data-sifters",
      "data_sifters",
    );
    keepOnlyCorpHqCard(state, dataSiftersId);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          action.payload?.cardId === dataSiftersId,
      ),
    ).toBe(false);

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      trashedNodeLastTurn: true,
    };
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === dataSiftersId,
    );
    expect(state.runner.tags).toBe(1);

    state = corpActionStateForProteusPro007("proteus-pro007-credit");
    state.corp.credits = 20;
    state = playCorpOperationByDefinition(
      state,
      "onr_proteus_047_credit-consolidation",
    );
    expect(state.corp.credits).toBe(25);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 15,
      corpCreditsAfter: 25,
    });
  });

  it("resolves Manhunt margin tags and Schlaghund Pointers trace surcharge", () => {
    let state = corpActionStateForProteusPro007("proteus-pro007-traces");
    state.corp.credits = 20;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsLastTurn: 1,
      runAttemptsThisGame: 1,
    };

    state = playCorpOperationByDefinition(state, "onr_proteus_050_manhunt");
    expect(state.trace).toMatchObject({
      baseTraceStrength: 6,
      successEffect: { type: "add_tags_by_trace_margin_over_runner_link" },
    });
    state = resolveTraceWithZeroBids(state);
    expect(state.runner.tags).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 6,
      runnerLink: 0,
    });

    state = corpActionStateForProteusPro007("proteus-pro007-schlaghund");
    state.corp.credits = 20;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsThisGame: 1,
    };
    const schlaghundId = addCorpCardToHqForTest(
      state,
      "onr_proteus_052_schlaghund-pointers",
      "schlaghund_pointers",
    );
    keepOnlyCorpHqCard(state, schlaghundId);
    const action = getLegalActions(state, "corp").find(
      (candidate) =>
        candidate.type === "play_operation" &&
        candidate.payload?.cardId === schlaghundId,
    );
    expect(action?.costs).toEqual([{ clicks: 1, credits: 9 }]);
    state = apply(state, "corp", (candidate) => candidate.actionId === action?.actionId);
    expect(state.corp.credits).toBe(11);
    state = resolveTraceWithZeroBids(state);
    expect(state.runner.tags).toBe(1);
  });

  it("targets only last-turn installed Runner resources for Underworld Mole", () => {
    let state = corpActionStateForProteusPro007("proteus-pro007-mole");
    state.corp.credits = 20;
    const resourceId = installRunnerResourceForTest(
      state,
      "onr_proteus_150_streetware-distributor",
    );
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      installedResourceIdsLastTurn: [resourceId],
    };
    const moleId = addCorpCardToHqForTest(
      state,
      "onr_proteus_053_underworld-mole",
      "underworld_mole",
    );
    keepOnlyCorpHqCard(state, moleId);
    const legal = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "play_operation" && action.payload?.cardId === moleId,
    );
    expect(legal).toHaveLength(1);
    expect(legal[0]?.payload).toMatchObject({
      traceSuccessTargetCardId: resourceId,
      traceSuccessTargetDefinitionId: "onr_proteus_150_streetware-distributor",
    });

    state = apply(state, "corp", (action) => action.actionId === legal[0]?.actionId);
    expect(state.trace).toMatchObject({
      baseTraceStrength: 4,
      successEffect: {
        type: "trash_runner_resource_and_add_tag",
        targetCardInstanceId: resourceId,
      },
    });
    state = resolveTraceWithZeroBids(state);
    expect(state.runner.tags).toBe(1);
    expect(state.runner.heap).toContain(resourceId);
    expect(state.runner.rig.resources).not.toContain(resourceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 1,
      trashedCardType: "resource",
      trashedCount: 1,
      trashedCardDefinitionId: "onr_proteus_150_streetware-distributor",
    });
  });

  it("keeps Underworld Mole targets redacted for hidden Runner resources until success", () => {
    let state = corpActionStateForProteusPro007("proteus-pro007-hidden-mole");
    state.corp.credits = 20;
    const hiddenResourceId = installRunnerResourceForTest(
      state,
      "onr_proteus_128_airport-locker",
    );
    state.cardInstances[hiddenResourceId] = {
      ...state.cardInstances[hiddenResourceId]!,
      faceup: false,
      rezzed: false,
    };
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      installedResourceIdsLastTurn: [hiddenResourceId],
    };
    const moleId = addCorpCardToHqForTest(
      state,
      "onr_proteus_053_underworld-mole",
      "underworld_hidden_mole",
    );
    keepOnlyCorpHqCard(state, moleId);

    const legal = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "play_operation" && action.payload?.cardId === moleId,
    );

    expect(legal).toHaveLength(1);
    const hiddenResourceSlotId = String(
      legal[0]?.payload?.hiddenResourceSlotId ?? "",
    );
    expect(hiddenResourceSlotId).toMatch(/^hidden_runner_resource_/);
    expect(legal[0]?.payload).toMatchObject({
      traceSuccessTargetCardId: hiddenResourceSlotId,
      traceSuccessTargetResourceSlotId: hiddenResourceSlotId,
      hiddenResourceSlotId,
      hiddenRunnerResource: true,
      redactedKind: "hidden_runner_resource",
    });
    expect(legal[0]?.payload).not.toHaveProperty(
      "traceSuccessTargetDefinitionId",
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "onr_proteus_128_airport-locker",
    );

    state = apply(state, "corp", (action) => action.actionId === legal[0]?.actionId);
    expect(state.trace).toMatchObject({
      baseTraceStrength: 4,
      successEffect: {
        type: "trash_runner_resource_and_add_tag",
        targetCardInstanceId: hiddenResourceId,
      },
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "onr_proteus_128_airport-locker",
    );

    state = resolveTraceWithZeroBids(state);
    expect(state.runner.tags).toBe(1);
    expect(state.runner.heap).toContain(hiddenResourceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 1,
      trashedCardType: "resource",
      trashedCount: 1,
      trashedCardDefinitionId: "onr_proteus_128_airport-locker",
      hiddenResourceSlotId,
      hiddenRunnerResourceRevealed: true,
    });
  });
});

describe("Proteus PRO008 Runner Event Run/Economy/Followup Suite", () => {
  function runnerMain(seed: string): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.runner.clicks = 4;
    state.corp.credits = 30;
    return state;
  }

  function playEventAction(
    state: GameState,
    definitionId: CardDefinitionId,
    serverId?: ServerId,
  ): { state: GameState; action: LegalAction; creditCost: number } {
    addRunnerCardToGripForTest(
      state,
      definitionId,
      definitionId.replace(/[^a-z0-9]/gi, "_"),
    );
    const action = mustAction(
      state,
      "runner",
      (candidate) =>
        candidate.type === "play_event" &&
        sourceDefinition(state, candidate) === definitionId &&
        (serverId === undefined || candidate.payload?.serverId === serverId),
    );
    const creditCost = action.costs.reduce(
      (sum, cost) => sum + ("credits" in cost ? cost.credits : 0),
      0,
    );
    return {
      state: apply(state, "runner", (candidate) => candidate.actionId === action.actionId),
      action,
      creditCost,
    };
  }

  it("covers Drone for a Day, On the Fast Track and Prearranged Drop economy", () => {
    let state = runnerMain("proteus-pro008-drone");
    const droneBefore = state.runner.credits;
    const drone = playEventAction(state, "onr_proteus_107_drone-for-a-day");
    state = drone.state;
    expect(state.runner.credits).toBe(droneBefore - drone.creditCost + 9);
    expect(state.runner.tags).toBe(1);

    state = runnerMain("proteus-pro008-fast-track");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      trashedAdvertisementThisTurn: true,
    };
    const fastBefore = state.runner.credits;
    const fast = playEventAction(state, "onr_proteus_114_on-the-fast-track");
    state = fast.state;
    expect(state.runner.credits).toBe(fastBefore - fast.creditCost + 8);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 8,
    });

    state = runnerMain("proteus-pro008-prearranged-drop");
    addCorpCardToRdForTest(state, "simple_agenda", "prearranged_agenda");
    const dropBefore = state.runner.credits;
    const drop = playEventAction(state, "onr_proteus_118_prearranged-drop");
    state = drop.state;
    expect(state.runnerTurnFlags?.prearrangedDropPending).toBe(true);
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    if (!getLegalActions(state, "runner").some((action) => action.type === "access_card"))
      state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runner.credits).toBe(dropBefore - drop.creditCost + 6);
    expect(state.runnerTurnFlags?.prearrangedDropPending).toBe(false);
  });

  it("starts All-Hands and Rush Hour central runs with +3 access and noisy breaker lock", () => {
    let state = runnerMain("proteus-pro008-all-hands");
    state = playEventAction(state, "onr_proteus_101_all-hands").state;
    expect(state.run).toMatchObject({
      attackedServerId: "hq",
      accessCount: 4,
      prohibitNoisyIcebreakers: true,
    });

    state = runnerMain("proteus-pro008-rush-hour");
    addInstalledRunnerProgramForTest(state, "onr_v1_036_jackhammer", "jackhammer");
    const iceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "rush_wall",
    );
    state = playEventAction(state, "onr_proteus_122_rush-hour").state;
    expect(state.run).toMatchObject({
      attackedServerId: "rd",
      accessCount: 4,
      prohibitNoisyIcebreakers: true,
    });
    state.run = {
      ...state.run!,
      phase: "encounter_ice",
      encounteredIceId: iceId,
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
    };
    expect(
      getLegalActions(state, "runner").some(
        (action) => sourceDefinition(state, action) === "onr_v1_036_jackhammer",
      ),
    ).toBe(false);
  });

  it("exposes Decoy Signal approach ICE before rez without hidden-info leakage", () => {
    let state = runnerMain("proteus-pro008-decoy");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Crystal Wall",
    );

    state = playEventAction(state, "onr_proteus_104_decoy-signal", "rd").state;
    const replayStart = state.eventLog.length;
    const replayInitial = structuredClone(state);
    const exposeAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.eventApproachIceExpose === true,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: exposeAction.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === exposeAction.actionId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      publicRevealDefinitionId: "onr_v1_232_crystal-wall",
    });
    expect(
      getLegalActions(state, "runner").some((action) => action.type === "jack_out"),
    ).toBe(true);
    const replay = replayEvents(replayInitial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("replaces Demolition Run access with rezzed ICE trash plus three tags", () => {
    let state = runnerMain("proteus-pro008-demolition");
    const iceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "demo_wall",
    );
    state = playEventAction(state, "onr_proteus_105_demolition-run", "rd").state;
    state.run = {
      ...state.run!,
      phase: "movement",
      position: { kind: "server", serverId: "rd" },
    };
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.tags).toBe(3);
    expect(state.corp.archives).toContain(iceId);
    expect(state.eventLog.some((event) => event.publicPayload?.tagsAdded === 3)).toBe(
      true,
    );
  });

  it("gates Remote Detonator on successful data-fort run and revalidates followup actions", () => {
    let state = runnerMain("proteus-pro008-remote-detonator");
    addRunnerCardToGripForTest(
      state,
      "onr_proteus_121_remote-detonator",
      "remote_detonator_gated",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => sourceDefinition(state, action) === "onr_proteus_121_remote-detonator",
      ),
    ).toBe(false);

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      successfulRunThisTurn: true,
      lastSuccessfulRunServerId: "rd",
    };
    const iceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "remote_detonator_wall",
    );
    const action = mustAction(
      state,
      "runner",
      (candidate) =>
        candidate.type === "play_event" &&
        sourceDefinition(state, candidate) === "onr_proteus_121_remote-detonator",
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    state = apply(state, "runner", (candidate) => candidate.actionId === action.actionId);
    expect(state.corp.archives).toContain(iceId);
    expect(state.runner.tags).toBe(3);
    const remoteDetonatorEffect =
      cardImplementationForDefinitionId("onr_proteus_121_remote-detonator")?.abilities
        ?.flatMap((ability) => ("effects" in ability ? ability.effects : []))
        .find(
          (effect) =>
            effect.kind ===
            "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
        );
    expect(remoteDetonatorEffect).toMatchObject({ tagAmount: 3 });
    expect(state.eventLog.some((event) => event.publicPayload?.tagsAdded === 3)).toBe(
      true,
    );
  });

  it("offers Disgruntled Ice Technician post-pass derez from the run event source", () => {
    let state = runnerMain("proteus-pro008-disgruntled");
    const iceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "disgruntled_wall",
    );
    state = playEventAction(
      state,
      "onr_proteus_106_disgruntled-ice-technician",
      "rd",
    ).state;
    const eventId = state.run?.successfulRunSourceCardId;
    expect(eventId).toBeDefined();
    state.run = {
      ...state.run!,
      phase: "movement",
      fullyBrokenIceIds: [iceId],
      fullyBrokenPassedIcePendingId: iceId,
    };
    state.timingPoint = "run.jack_out_window";
    state.activeSide = "runner";
    const derez = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "derez_fully_broken_passed_ice_and_end_run" &&
        action.payload?.cardId === eventId,
    );
    state = apply(state, "runner", (action) => action.actionId === derez.actionId);
    expect(state.cardInstances[iceId]?.rezzed).toBe(false);
    expect(state.run).toBeUndefined();
  });

  it("rewards Reconnaissance rezzes and tracks Weefle Initiation prevention pool", () => {
    let state = runnerMain("proteus-pro008-recon");
    putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");
    state = playEventAction(state, "onr_proteus_120_reconnaissance", "rd").state;
    const beforeRezRunnerCredits = state.runner.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    expect(state.runner.credits).toBe(beforeRezRunnerCredits + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 1,
    });

    state = runnerMain("proteus-pro008-weefle");
    state = playEventAction(state, "onr_proteus_127_weefle-initiation", "rd").state;
    expect(state.run?.damagePreventionPool).toMatchObject({
      sourceDefinitionId: "onr_proteus_127_weefle-initiation",
      remaining: 7,
    });
  });

  function traceRewardState(
    definitionId:
      | "onr_proteus_130_back-door-to-rivals"
      | "onr_proteus_148_runner-sensei",
    seed: string,
  ): GameState {
    let state = corpActionStateForProteusPro007(seed);
    state.corp.credits = 30;
    state.runner.credits = 30;
    addRunnerResourceToRigForTest(state, definitionId, definitionId);
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      runAttemptsThisGame: 1,
    };
    state = playCorpOperationByDefinition(
      state,
      "onr_proteus_052_schlaghund-pointers",
    );
    return applyChoice(state, "corp", "bid_0");
  }

  it("rewards exactly the chosen base-link ability when it avoids a trace", () => {
    for (const definitionId of [
      "onr_proteus_130_back-door-to-rivals",
      "onr_proteus_148_runner-sensei",
    ] as const) {
      let state = traceRewardState(
        definitionId,
        `proteus-pro008-base-reward-${definitionId}`,
      );
      const beforeBaseLinkCredits = state.runner.credits;
      state = applyChoice(
        state,
        "runner",
        traceChoiceOptionIdForDefinition(state, definitionId, "trace_base_link_"),
      );
      expect(state.trace?.baseLinkSourceId).toBeDefined();
      state = applyChoice(
        state,
        "runner",
        definitionId.endsWith("back-door-to-rivals") ? "bid_1" : "bid_0",
      );
      state = applyChoice(state, "runner", "pass");
      expect(state.runner.tags).toBe(0);
      const expectedCredits =
        beforeBaseLinkCredits -
        (definitionId.endsWith("runner-sensei") ? 2 : 0) -
        (definitionId.endsWith("back-door-to-rivals") ? 1 : 0) +
        1;
      expect(state.runner.credits).toBe(expectedCredits);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceSuccessful: false,
        gainedCredits: 1,
      });
    }
  });

  it("rewards exactly the chosen post-bid link ability when it avoids a trace", () => {
    for (const definitionId of [
      "onr_proteus_130_back-door-to-rivals",
      "onr_proteus_148_runner-sensei",
    ] as const) {
      let state = traceRewardState(
        definitionId,
        `proteus-pro008-post-reward-${definitionId}`,
      );
      state = applyChoice(state, "runner", "pass");
      const beforeRunnerBidCredits = state.runner.credits;
      state = applyChoice(state, "runner", "bid_2");
      state = applyChoice(
        state,
        "runner",
        traceChoiceOptionIdForDefinition(state, definitionId, "trace_link_"),
      );
      state = applyChoice(state, "runner", "pass");
      const postBidCost = definitionId.endsWith("back-door-to-rivals") ? 3 : 2;
      expect(state.runner.tags).toBe(0);
      expect(state.runner.credits).toBe(beforeRunnerBidCredits - 2 - postBidCost + 1);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceSuccessful: false,
        gainedCredits: 1,
      });
    }
  });
});

describe("Proteus PRO009 Runner Icebreaker Choice/Modifier Suite", () => {
  function runnerMain(seed: string): GameState {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.runner.clicks = 4;
    state.corp.credits = 30;
    return state;
  }

  function installFromGrip(
    state: GameState,
    definitionId: CardDefinitionId,
    predicate: (action: LegalAction) => boolean = () => true,
  ): { state: GameState; cardId: CardInstanceId; action: LegalAction } {
    const cardId = addRunnerCardToGripForTest(
      state,
      definitionId,
      definitionId.replace(/[^a-z0-9]/gi, "_"),
    );
    const action = mustAction(
      state,
      "runner",
      (candidate) =>
        candidate.type === "install_card" &&
        candidate.payload?.cardId === cardId &&
        predicate(candidate),
    );
    return {
      state: apply(state, "runner", (candidate) => candidate.actionId === action.actionId),
      cardId,
      action,
    };
  }

  function setEncounter(
    state: GameState,
    iceId: CardInstanceId,
    serverId: ServerId = "rd",
  ): GameState {
    state.run = {
      runId: `pro009_run_${state.stateVersion}`,
      attackedServerId: serverId as Exclude<ServerId, "new_remote">,
      phase: "encounter_ice",
      position: {
        kind: "ice",
        serverId: serverId as Exclude<ServerId, "new_remote">,
        iceIndex: 0,
      },
      encounteredIceId: iceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
    };
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    return state;
  }

  it("requires install choices for Black Widow and Morphing Tool, while Fubar chooses once after install", () => {
    let state = runnerMain("proteus-pro009-install-choices");
    const targetIceId = putCorpIceOnServer(state, "rd", "onr_v1_245_fire-wall");

    const blackWidow = installFromGrip(
      state,
      "onr_proteus_080_black-widow",
      (action) => action.payload?.selectedCardId === targetIceId,
    );
    state = blackWidow.state;
    expect(state.cardInstances[blackWidow.cardId]?.selectedCardId).toBe(targetIceId);
    const runnerBlackWidow = getPlayerView(state, "runner").own.rig?.find(
      (card) => card.instanceId === blackWidow.cardId,
    );
    const corpBlackWidow = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.instanceId === blackWidow.cardId,
    );
    expect(runnerBlackWidow?.selectedTargetLabel).toBe("ICE auf R&D Position 1");
    expect(corpBlackWidow?.selectedTargetLabel).toBe("Fire Wall");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain("Fire Wall");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(targetIceId);

    const fubar = installFromGrip(state, "onr_proteus_088_fubar");
    state = fubar.state;
    expect(state.cardInstances[fubar.cardId]?.selectedSubtype).toBeUndefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.cardId === fubar.cardId &&
          action.payload?.runnerAbility === "change_icebreaker_subtype",
      ),
    ).toBe(false);
    state = setEncounter(state, targetIceId);
    const fubarChoice = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.cardId === fubar.cardId &&
        action.payload?.runnerAbility === "change_icebreaker_subtype" &&
        action.payload?.selectedSubtype === "sentry",
    );
    expect(fubarChoice.costs).toEqual([]);
    state = apply(state, "runner", (action) => action.actionId === fubarChoice.actionId);
    expect(state.cardInstances[fubar.cardId]?.selectedSubtype).toBe("sentry");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === fubar.cardId,
      ),
    ).toMatchObject({
      selectedSubtype: "sentry",
      selectedSubtypeLabel: "Sentry",
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.cardId === fubar.cardId &&
          action.payload?.runnerAbility === "change_icebreaker_subtype",
      ),
    ).toBe(false);
    delete state.run;
    state.timingPoint = "runner_action.main";
    state.phase = "runner_action_phase";
    state.activeSide = "runner";

    const morphing = installFromGrip(
      state,
      "onr_proteus_092_morphing-tool",
      (action) => action.payload?.selectedSubtype === "code_gate",
    );
    state = morphing.state;
    expect(state.cardInstances[morphing.cardId]?.selectedSubtype).toBe("code_gate");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === morphing.cardId,
      ),
    ).toMatchObject({
      selectedSubtype: "code_gate",
      selectedSubtypeLabel: "Code Gate",
    });
    const change = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.cardId === morphing.cardId &&
        action.payload?.selectedSubtype === "wall",
    );
    state = apply(state, "runner", (action) => action.actionId === change.actionId);
    expect(state.cardInstances[morphing.cardId]?.selectedSubtype).toBe("wall");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === morphing.cardId,
      ),
    ).toMatchObject({
      selectedSubtype: "wall",
      selectedSubtypeLabel: "Wall",
    });
  });

  it("revalidates chosen breaker types and Black Widow selected ICE strength", () => {
    let state = runnerMain("proteus-pro009-type-break");
    const wallId = addRezzedCorpIceForTest(
      state,
      "onr_v1_245_fire-wall",
      "rd",
      "fire_wall",
    );
    const sentryId = addRezzedCorpIceForTest(
      state,
      "onr_v1_223_banpei",
      "rd",
      "banpei",
    );
    const fubar = installFromGrip(
      state,
      "onr_proteus_088_fubar",
    );
    state = fubar.state;
    state = setEncounter(state, sentryId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.cardId === fubar.cardId &&
        action.payload?.selectedSubtype === "sentry",
    );
    state.cardInstances[fubar.cardId]!.strengthModifier = 10;
    state = setEncounter(state, wallId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "break_subroutine" && action.payload?.breakerId === fubar.cardId,
      ),
    ).toBe(false);
    state = setEncounter(state, sentryId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "break_subroutine" && action.payload?.breakerId === fubar.cardId,
      ),
    ).toBe(true);

    state = runnerMain("proteus-pro009-black-widow");
    const chosenIceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_224_bolter-cluster",
      "rd",
      "chosen_bolter",
    );
    const otherIceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_224_bolter-cluster",
      "rd",
      "other_bolter",
    );
    const blackWidow = installFromGrip(
      state,
      "onr_proteus_080_black-widow",
      (action) => action.payload?.selectedCardId === chosenIceId,
    );
    state = blackWidow.state;
    state = setEncounter(state, chosenIceId);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === blackWidow.cardId,
      ),
    ).toBe(true);
    state = setEncounter(state, otherIceId);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === blackWidow.cardId,
      ),
    ).toBe(false);
  });

  it("sets and consumes Bulldozer's next-sentry free break once", () => {
    let state = runnerMain("proteus-pro009-bulldozer");
    const wallId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "wall",
    );
    const sentryId = addRezzedCorpIceForTest(
      state,
      "onr_v1_223_banpei",
      "rd",
      "sentry",
    );
    const bulldozerId = addInstalledRunnerProgramForTest(
      state,
      "onr_proteus_082_bulldozer",
      "bulldozer",
    );
    state.cardInstances[bulldozerId]!.strengthModifier = 10;
    const stealthId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_011_cloak",
      "cloak",
    );
    state.cardInstances[stealthId]!.counters = { recurring_credit: 2 };
    state = setEncounter(state, wallId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === bulldozerId,
    );
    expect(state.run?.nextSentryFreeBreakByBreaker?.[bulldozerId]).toBe(wallId);
    state = setEncounter(state, sentryId);
    state.run!.nextSentryFreeBreakByBreaker = { [bulldozerId]: wallId };
    state.run!.nextSentryFreeBreakTargetIceByBreaker = { [bulldozerId]: sentryId };
    const freeBreak = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === bulldozerId &&
        action.payload?.nextSentryFreeBreak === true,
    );
    state = apply(state, "runner", (action) => action.actionId === freeBreak.actionId);
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.run?.nextSentryFreeBreakByBreaker?.[bulldozerId]).toBeUndefined();
    expect(
      state.run?.nextSentryFreeBreakTargetIceByBreaker?.[bulldozerId],
    ).toBeUndefined();

  });

  it("applies Lockjaw and Personal Touch only to selected icebreakers", () => {
    let state = runnerMain("proteus-pro009-modifiers");
    const lockjawId = addInstalledRunnerProgramForTest(
      state,
      "onr_proteus_091_lockjaw",
      "lockjaw",
    );
    const targetId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_036_jackhammer",
      "jackhammer",
    );
    const otherId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_014_codecracker",
      "codecracker",
    );
    state = setEncounter(
      state,
      addRezzedCorpIceForTest(state, "onr_v1_245_fire-wall", "rd", "wall"),
    );
    const lockjaw = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.cardId === lockjawId &&
        action.payload?.targetCardId === targetId,
    );
    state = apply(state, "runner", (action) => action.actionId === lockjaw.actionId);
    expect(state.cardInstances[lockjawId]?.tapped).toBe(true);
    expect(state.run?.remainderStrengthBonusByBreaker?.[targetId]).toBe(2);
    expect(state.run?.remainderStrengthBonusByBreaker?.[otherId]).toBeUndefined();
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    state = setEncounter(
      state,
      addRezzedCorpIceForTest(state, "onr_v1_245_fire-wall", "rd", "second_wall"),
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.cardId === lockjawId,
      ),
    ).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.cardInstances[lockjawId]?.tapped).toBe(false);
    state = setEncounter(
      state,
      addRezzedCorpIceForTest(state, "onr_v1_245_fire-wall", "rd", "third_wall"),
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.cardId === lockjawId &&
          action.payload?.targetCardId === targetId,
      ),
    ).toBe(true);

    state = runnerMain("proteus-pro009-personal-touch");
    const breakerId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_036_jackhammer",
      "personal_jackhammer",
    );
    const untouchedId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_014_codecracker",
      "personal_codecracker",
    );
    addRunnerCardToGripForTest(
      state,
      "onr_proteus_115_personal-touch-the",
      "personal_touch",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.targetCardId === breakerId,
    );
    expect(cardCounterAmount(state, breakerId, "power")).toBe(1);
    expect(cardCounterAmount(state, untouchedId, "power")).toBe(0);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === breakerId,
      )?.counterDisplays,
    ).toContainEqual({
      id: "power",
      amount: 1,
      displayKind: "generic_counter",
      label: "Power-Counter",
      ariaLabel: "1 Power-Counter",
      counterType: "power",
      usageHint: "status_marker",
    });
  });

  it("restricts Eurocorpse bits to the hosted icebreaker and keeps replay stable", () => {
    let state = runnerMain("proteus-pro009-eurocorpse");
    const chipInstall = installFromGrip(
      state,
      "onr_proteus_139_eurocorpse-tm-spin-chip",
    );
    state = chipInstall.state;
    const chipId = chipInstall.cardId;
    state.cardInstances[chipId]!.counters = { bit: 2 };
    const hostedId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_036_jackhammer",
      "euro_jackhammer",
    );
    state.cardInstances[hostedId] = {
      ...state.cardInstances[hostedId]!,
      hostedOn: chipId,
    };
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === hostedId,
      ),
    ).toMatchObject({
      hostedOn: chipId,
      hostedOnLabel: "Eurocorpse (TM) Spin Chip",
    });
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.instanceId === hostedId,
      ),
    ).toMatchObject({
      hostedOn: chipId,
      hostedOnLabel: "Eurocorpse (TM) Spin Chip",
    });
    const hiddenHostId = "pro009_hidden_host" as CardInstanceId;
    state.runner.rig.resources.push(hiddenHostId);
    state.cardInstances[hiddenHostId] = {
      instanceId: hiddenHostId,
      definitionId: "onr_proteus_128_airport-locker",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const hiddenHostedId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_014_codecracker",
      "hidden_hosted_codecracker",
    );
    state.cardInstances[hiddenHostedId] = {
      ...state.cardInstances[hiddenHostedId]!,
      hostedOn: hiddenHostId,
    };
    const corpHiddenHostedView = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.instanceId === hiddenHostedId,
    );
    expect(corpHiddenHostedView?.hostedOnLabel).toBe("installierte Runner-Karte");
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain("Airport Locker");
    const otherId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_014_codecracker",
      "euro_codecracker",
    );
    state.runner.credits = 0;
    const wallId = addRezzedCorpIceForTest(
      state,
      "onr_v1_245_fire-wall",
      "rd",
      "euro_wall",
    );
    state.cardInstances[hostedId]!.strengthModifier = 10;
    state.cardInstances[otherId]!.strengthModifier = 10;
    state = setEncounter(state, wallId);
    const legal = getLegalActions(state, "runner");
    expect(
      legal.some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === hostedId,
      ),
    ).toBe(true);
    expect(
      legal.some(
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.breakerId === otherId,
      ),
    ).toBe(false);
    const replayStart = state.eventLog.length;
    const replayInitial = structuredClone(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === hostedId,
    );
    const replay = replayEvents(replayInitial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("MVP 0.1 engine foundation", () => {
  it("normalizes legacy ability payloads into side-safe public ability schema", () => {
    const context = buildPublicAbilitySchemaContext(
      "resolve_choice",
      {
        v1922RunnerEventAbility: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
        sourceDefinitionId: "onr_v1_080_core-command-jettison-ice",
        targetCardDefinitionId: "onr_v1_232_crystal-wall",
        cardId: "corp_hidden_card_instance_1",
        paidCredits: 3,
        v1921DieRoll: 4,
      },
      { redactedKind: "hidden_zone", hiddenZoneBarrier: true },
      "hidden_info_barrier",
    );

    expect(context).toMatchObject({
      abilityFamily: "hidden-zone",
      abilityId: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      effectKind: "hidden_zone",
      sourceDefinitionId: "onr_v1_080_core-command-jettison-ice",
      amounts: { paidCredits: 3, randomRoll: 4 },
      targets: {
        sourceDefinitionId: "onr_v1_080_core-command-jettison-ice",
        targetCardDefinitionId: "onr_v1_232_crystal-wall",
        redactedKind: "hidden_zone",
      },
      visibility: {
        class: "hidden_info_barrier",
        hiddenZoneBarrier: true,
        redactedKind: "hidden_zone",
      },
    });
    expect(context.targets).not.toHaveProperty("cardId");
  });

  it("creates deterministic games for the same seed", () => {
    const first = createGameAfterSetup({ seed: "deterministic" });
    const second = createGameAfterSetup({ seed: "deterministic" });

    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);
  });

  it("lets the Corp rez non-ICE root cards, but not score agendas, between Runner actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "runner-action-paid-window-rez",
        runnerDeck: ONR_V1_6_3_RUNNER_DECK,
        corpDeck: ONR_V1_6_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 10;
    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_350_antiquated-interface-routines",
    );
    const agendaId = putCorpRootInRemote(state, "onr_v1_203_hostile-takeover");
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      advancementCounters: 99,
    };

    const corpActions = getLegalActions(state, "corp");
    expect(corpActions.some((action) => action.type === "score_agenda")).toBe(
      false,
    );
    const rezAction = corpActions.find(
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.runnerActionPaidWindowRez === true,
    );
    expect(rezAction).toBeDefined();
    expect(getLegalActions(state, "runner").length).toBeGreaterThan(0);

    state = apply(state, "corp", (action) => action.actionId === rezAction?.actionId);
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.activeSide).toBe("runner");
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
  });

  it("shuffles sorted Corp agenda blocks without preserving the editor order bias", () => {
    const corpMasterDeck: DeckDefinition = {
      id: "local_corp_master_shuffle_regression",
      name: "The Korp Master Shuffle Regression",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_193_corporate-coup", quantity: 1 },
        { id: "onr_v1_201_executive-extraction", quantity: 1 },
        { id: "onr_v1_207_netwatch-operations-office", quantity: 1 },
        { id: "onr_v1_208_on-call-solo-team", quantity: 1 },
        { id: "onr_v1_209_political-coup", quantity: 1 },
        { id: "onr_v1_211_polymer-breakthrough", quantity: 1 },
        { id: "onr_v1_212_priority-requisition", quantity: 1 },
        { id: "onr_v1_213_private-cybernet-police", quantity: 1 },
        { id: "onr_v1_214_project-babylon", quantity: 1 },
        { id: "onr_v1_215_security-net-optimization", quantity: 1 },
        { id: "onr_v1_217_strike-force-kali", quantity: 1 },
        { id: "onr_v1_219_superior-net-barriers", quantity: 1 },
        { id: "onr_v1_245_fire-wall", quantity: 1 },
        { id: "onr_v1_259_in-the-face", quantity: 1 },
        { id: "onr_v1_263_reinforced-wall", quantity: 1 },
        { id: "onr_v1_265_rock-is-strong", quantity: 1 },
        { id: "onr_v1_268_shock-r", quantity: 2 },
        { id: "onr_v1_270_sleeper", quantity: 2 },
        { id: "onr_v1_273_triggerman", quantity: 1 },
        { id: "onr_v1_275_vacuum-link", quantity: 1 },
        { id: "onr_v1_278_wall-of-ice", quantity: 1 },
        { id: "onr_v1_279_wall-of-static", quantity: 2 },
        { id: "onr_v1_281_accounts-receivable", quantity: 2 },
        { id: "onr_v1_282_annual-reviews", quantity: 2 },
        { id: "onr_v1_288_day-shift", quantity: 1 },
        { id: "onr_v1_290_efficiency-experts", quantity: 3 },
        { id: "onr_v1_295_night-shift", quantity: 2 },
        { id: "onr_v1_297_overtime-incentives", quantity: 2 },
        { id: "onr_v1_308_acme-savings-and-loan", quantity: 1 },
        { id: "onr_v1_317_data-masons", quantity: 1 },
        { id: "onr_v1_320_encoder-inc", quantity: 1 },
        { id: "onr_v1_341_skalderviken-sa-beta-test-site", quantity: 1 },
        { id: "onr_v1_350_antiquated-interface-routines", quantity: 2 },
        { id: "onr_v1_371_tokyo-chiba-infighting", quantity: 2 },
      ],
    };
    const agendaCardsInDeck = corpMasterDeck.cards.reduce(
      (sum, entry) =>
        sum +
        (DEMO_CARDS_BY_ID[entry.id]?.type === "agenda" ? entry.quantity : 0),
      0,
    );
    expect(agendaCardsInDeck).toBe(12);

    let agendaCardsInOpeningHands = 0;
    let fourPlusAgendaHands = 0;
    for (let seedIndex = 0; seedIndex < 1000; seedIndex += 1) {
      const state = createGameAfterSetup({
        seed: `shuffle-corp-master-${seedIndex}`,
        corpDeck: corpMasterDeck,
        agendaPointsToWin: 7,
      });
      const agendasInHand = state.corp.hq.filter(
        (id) =>
          DEMO_CARDS_BY_ID[state.cardInstances[id]!.definitionId]?.type ===
          "agenda",
      ).length;
      agendaCardsInOpeningHands += agendasInHand;
      if (agendasInHand >= 4) fourPlusAgendaHands += 1;
    }

    expect(agendaCardsInOpeningHands / 1000).toBeGreaterThan(0.9);
    expect(agendaCardsInOpeningHands / 1000).toBeLessThan(1.55);
    expect(fourPlusAgendaHands).toBeLessThan(25);
  }, 15_000);

  it("starts in explicit setup with side-safe private mulligan choices", () => {
    const state = createGame({ seed: "v110-explicit-setup" });

    expect(state.phase).toBe("setup");
    expect(state.timingPoint).toBe("setup.mulligan.runner");
    expect(state.setup).toMatchObject({
      status: "mulligan_runner",
      initialHandSize: 5,
    });
    expect(state.agendaPointsToWin).toBe(7);
    expect(getLegalActions(state, "runner")).toHaveLength(1);
    expect(getLegalActions(state, "runner")[0]?.type).toBe("resolve_choice");
    expect(getLegalActions(state, "corp")).toHaveLength(0);
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(["keep", "mulligan"]);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").agendaPointsToWin).toBe(7);
    expect(getPlayerView(state, "runner").own.identity.known).toBe(true);
    expect(getPlayerView(state, "runner").opponent.identity.known).toBe(true);
  });

  it("resolves runner and corp keep decisions into the first mandatory draw", () => {
    let state = createGame({ seed: "v110-setup-keep" });
    state = applyChoice(state, "runner", "keep");

    expect(state.phase).toBe("setup");
    expect(state.timingPoint).toBe("setup.mulligan.corp");
    expect(state.setup?.resolved.runner).toBe("keep");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      setupStep: "mulligan",
      setupSide: "runner",
      setupDecision: "keep",
    });
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(["keep", "mulligan"]);

    state = applyChoice(state, "corp", "keep");
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.setup).toMatchObject({
      status: "complete",
      resolved: { runner: "keep", corp: "keep" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      setupStep: "mulligan",
      setupSide: "corp",
      setupDecision: "keep",
    });
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "mandatory_draw",
      ),
    ).toBe(true);
  });

  it("mulligans deterministically without public hidden-info leaks", () => {
    let state = createGame({ seed: "v110-runner-mulligan" });
    const initialGrip = state.runner.grip.slice();
    state = applyChoice(state, "runner", "mulligan");

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.grip).not.toEqual(initialGrip);
    expect(state.setup?.resolved.runner).toBe("mulligan");
    expect(state.setup?.mulligansTaken.runner).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      setupStep: "mulligan",
      setupSide: "runner",
      setupDecision: "mulligan",
    });
    expect(
      state.randomDrawRecords.some(
        (record) => record.purpose === "setup.shuffle.runner.mulligan",
      ),
    ).toBe(true);
    expect(
      state.randomDrawRecords.some(
        (record) => record.purpose === "setup.draw.runner.mulligan_hand",
      ),
    ).toBe(true);
    expect(
      JSON.stringify(state.eventLog.map((event) => event.publicPayload)),
    ).not.toContain("runner_simple_");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");

    const replay = replayEvents(
      createGame({ seed: "v110-runner-mulligan" }),
      state.eventLog,
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rejects stale and wrong-side player actions", () => {
    let state = createGameAfterSetup({ seed: "validation" });
    const mandatory = mustAction(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mandatory.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.timingPoint).toBe("corp_action.main");
  });
});

describe("MVP 0.1 turns and cards", () => {
  it("plays the Runner economy event and installs all MVP breakers", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "runner-cards" }));
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "simple_economy_event");
    moveRunnerCardToGrip(state, "simple_fracter");
    moveRunnerCardToGrip(state, "simple_decoder");
    moveRunnerCardToGrip(state, "simple_killer");

    const beforeCredits = state.runner.credits;
    const creditsBeforeClearingFangLock = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "simple_economy_event",
    );
    expect(state.runner.credits).toBe(beforeCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "simple_fracter",
      title: "Simple Fracter",
    });
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_decoder",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );

    expect(state.runner.memoryUsed).toBe(3);
    expect(
      state.runner.rig.programs
        .map((id) => state.cardInstances[id]?.definitionId)
        .sort(),
    ).toEqual(["simple_decoder", "simple_fracter", "simple_killer"]);
  });

  it("plays Corp economy operation", () => {
    let state = createGameAfterSetup({ seed: "corp-operation" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_economy_operation");
    const before = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "simple_economy_operation",
    );
    expect(state.corp.credits).toBe(before + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      actionCostClicks: 1,
      turnActionOrdinalStart: 1,
      turnActionOrdinalEnd: 1,
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
    });
    const archivedOperation = state.corp.archives.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "simple_economy_operation",
    );
    expect(archivedOperation).toBeDefined();
    expect(state.cardInstances[archivedOperation!]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
  });

  it("lets the Corp create a new remote by installing ICE", () => {
    let state = createGameAfterSetup({ seed: "corp-ice-new-remote" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");

    const install = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "ice",
    );
    expect(install.label).toBe("ICE vor neuem Remote installieren");

    state = apply(
      state,
      "corp",
      (action) => action.actionId === install.actionId,
    );
    const remote = state.corp.servers.find(
      (server) => server.kind === "remote" && server.ice.includes(iceId),
    );

    expect(remote).toBeDefined();
    expect(remote?.root).toEqual([]);
    expect(state.cardInstances[iceId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverIce",
      serverId: remote?.id,
    });
  });

  it("applies escalating base install costs for the 2nd and 3rd ICE on the same server", () => {
    let state = createGameAfterSetup({ seed: "corp-ice-scaling-cost" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;

    const firstIceId = moveCorpCardToHq(state, "simple_barrier_ice");
    const secondIceId = moveCorpCardToHq(state, "simple_sentry_ice");
    const thirdIceEntry = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        card.definitionId === "simple_barrier_ice" &&
        id !== firstIceId &&
        id !== secondIceId,
    );
    expect(thirdIceEntry).toBeDefined();
    if (!thirdIceEntry) throw new Error("Missing third ICE copy");
    const thirdIceId = thirdIceEntry[0] as CardInstanceId;
    removeEverywhere(state, thirdIceId);
    state.corp.hq.unshift(thirdIceId);
    state.cardInstances[thirdIceId] = {
      ...state.cardInstances[thirdIceId]!,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };

    const firstRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === firstIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(firstRdInstall.costs[0]?.credits).toBeUndefined();
    state = apply(
      state,
      "corp",
      (action) => action.actionId === firstRdInstall.actionId,
    );

    const secondRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === secondIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(secondRdInstall.costs[0]?.credits).toBe(1);
    expect(secondRdInstall.payload?.iceInstallBaseCost).toBe(1);
    expect(secondRdInstall.payload?.iceInstallAdditionalCost).toBe(0);
    expect(secondRdInstall.payload?.iceInstallTotalCost).toBe(1);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === secondRdInstall.actionId,
    );

    const thirdRdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === thirdIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(thirdRdInstall.costs[0]?.credits).toBe(2);
    expect(thirdRdInstall.payload?.iceInstallBaseCost).toBe(2);
    expect(thirdRdInstall.payload?.iceInstallAdditionalCost).toBe(0);
    expect(thirdRdInstall.payload?.iceInstallTotalCost).toBe(2);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === thirdRdInstall.actionId,
    );

    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer?.ice).toHaveLength(3);
    expect(rdServer?.ice).toEqual([firstIceId, secondIceId, thirdIceId]);
    expect(state.corp.credits).toBe(17);
  });
});

describe("MVP 0.1 runs, access and scoring", () => {
  it("lets the Runner steal the top R&D agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "steal-rd" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
      serverLabel: "R&D",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(
      JSON.stringify(
        getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
      ),
    ).toContain("Simple Agenda");
    expect(
      JSON.stringify(
        getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
      ),
    ).not.toContain("Simple Agenda");
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(agendaPoints(state, "runner")).toBe(2);
    expect(state.run).toBeUndefined();
    expect(
      getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload
      .actionType,
    ).toBe("steal_agenda");
  });

  it("redacts the private R&D trash choice from Corp view when Runner declines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "rd-upgrade-trash-redaction",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    const accessedId = putCorpCardOnTopOfRd(state, "simple_upgrade");
    for (const [cardId, card] of Object.entries(state.cardInstances)) {
      if (cardId !== accessedId && card.definitionId === "simple_upgrade") {
        removeEverywhere(state, cardId);
        state.corp.rd.push(cardId as CardInstanceId);
        state.cardInstances[cardId] = {
          ...card,
          zone: { side: "corp", zone: "rd" },
          faceup: false,
          rezzed: false,
        };
      }
    }
    const replayInitial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const runnerView = getPlayerView(state, "runner");
    expect(runnerView.run?.accessedCard).toMatchObject({
      known: true,
      definitionId: "simple_upgrade",
      title: "Simple Upgrade",
      type: "upgrade",
      trashCost: 4,
    });
    expect(getLegalActions(state, "runner").map((action) => action.type)).toEqual(
      expect.arrayContaining(["trash_accessed_card", "decline_trash"]),
    );

    const corpView = getPlayerView(state, "corp");
    expect(corpView.pendingChoice).toBeUndefined();
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(corpView.run?.accessedCard).toMatchObject({ known: false });
    expect(corpView.run?.accessedCard).not.toHaveProperty("definitionId");
    expect(corpView.run?.accessedCard).not.toHaveProperty("title");
    expect(corpView.run?.accessedCard).not.toHaveProperty("type");
    expect(corpView.run?.accessedCard).not.toHaveProperty("trashCost");
    expect(JSON.stringify(corpView)).not.toMatch(
      /Simple Upgrade|simple_upgrade|trash_accessed_card|decline_trash/i,
    );
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });

    state = apply(state, "runner", (action) => action.type === "decline_trash");
    const corpAfterDecline = getPlayerView(state, "corp");
    expect(corpAfterDecline.run?.accessedCard).toBeUndefined();
    expect(
      JSON.stringify(corpAfterDecline.publicEvents.at(-1)?.publicPayload),
    ).not.toMatch(/Simple Upgrade|simple_upgrade|upgrade|trashCost/i);

    const replay = replayEvents(replayInitial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("reveals the randomly accessed HQ card in the access event", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "access-hq" }));
    const accessedId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "HQ",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload,
    ).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "HQ",
    });
    expect(
      getPlayerView(state, "corp").publicEvents.at(-1)?.publicPayload
        .redactedKind,
    ).toBeUndefined();
  });

  it("randomizes single HQ access across all current HQ cards with replay-stable records", () => {
    const hqDefinitions = [
      "simple_economy_operation",
      "simple_economy_asset",
      "simple_barrier_ice",
      "simple_agenda",
      "simple_priority_agenda",
    ];
    const seenDefinitions = new Set<string>();

    for (let index = 0; index < 80; index += 1) {
      let state = toRunnerTurn(
        v099CounterHostingGame(`hq-random-audit-${index}`),
      );
      const hqIds = hqDefinitions.map((definitionId) =>
        moveCorpCardToHq(state, definitionId),
      );
      keepOnlyCorpHqCards(state, hqIds);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const randomBefore = state.randomDrawRecords.length;

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );

      const selectedId = state.run?.breach?.queue[0]?.cardInstanceId;
      expect(selectedId).toBeDefined();
      expect(hqIds).toContain(selectedId);
      expect(state.run?.breach?.queue).toHaveLength(1);
      expect(state.randomDrawRecords).toHaveLength(randomBefore + 1);
      expect(state.randomDrawRecords.at(-1)).toMatchObject({
        counter: randomBefore,
        purpose: `hq_multiaccess:${state.run?.runId}:selection:0`,
      });
      expect(state.randomCounter).toBe(randomBefore + 1);
      for (const definitionId of hqDefinitions) {
        expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
          DEMO_CARDS_BY_ID[definitionId]?.title ?? definitionId,
        );
      }

      state = apply(state, "runner", (action) => action.type === "access_card");
      const selectedDefinitionId =
        state.cardInstances[selectedId!]?.definitionId;
      expect(hqDefinitions).toContain(selectedDefinitionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "access_card",
        cardDefinitionId: selectedDefinitionId,
        serverLabel: "HQ",
      });
      seenDefinitions.add(String(selectedDefinitionId));

      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(replay.state.randomDrawRecords).toEqual(state.randomDrawRecords);
      expect(hashState(replay.state)).toBe(hashState(state));
    }

    expect(seenDefinitions).toEqual(new Set(hqDefinitions));
  }, 15_000);

  it("shows a card trashed from HQ in Runner-visible Archives", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "trash-hq-asset" }));
    state.runner.credits = 10;
    const accessedId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, accessedId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    const runnerView = getPlayerView(state, "runner");
    const archives = runnerView.servers.find(
      (server) => server.id === "archives",
    );
    expect(state.corp.archives).toContain(accessedId);
    expect(runnerView.opponent.discardCount).toBe(state.corp.archives.length);
    expect(archives?.root.map((card) => card.definitionId)).toContain(
      "simple_economy_asset",
    );
    expect(
      archives?.root.find(
        (card) => card.definitionId === "simple_economy_asset",
      )?.title,
    ).toBe("Simple Economy Asset");
  });

  it("does not offer a card access when a successful remote run finds an empty root", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "empty-remote-access" }),
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const randomDrawsBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");

    expect(state.timingPoint).toBe("run.jack_out_window");
    state = continueRunAction(state);
    expect(state.randomDrawRecords).toHaveLength(randomDrawsBefore);
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "cardDefinitionId",
    );
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("title");
  });

  it("still offers card access for a remote with a root card", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "non-empty-remote-access" }),
    );
    putCorpRootInRemote(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_agenda",
      title: "Simple Agenda",
      serverLabel: "Remote 1",
    });
  });

  it("lets the Runner break Barrier ICE and access R&D", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "break-barrier",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "efficient_fracter");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
      cardDefinitionId: "efficient_fracter",
      title: "Efficient Fracter",
    });
    state = apply(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "efficient_fracter",
      title: "Efficient Fracter",
    });
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation",
      serverLabel: "R&D",
    });
    expect(state.eventLog.at(-1)?.publicPayload.accessedCardId).toBeUndefined();
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
  });

  it("encounters multi-ICE servers from the outermost installed ICE inward before access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "multi-ice-outer-to-inner-run",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "efficient_fracter");
    const innerIceId = putCorpIceCopyOnServer(
      state,
      "rd",
      "simple_barrier_ice",
    );
    const outerIceId = putCorpIceCopyOnServer(
      state,
      "rd",
      "simple_barrier_ice",
    );
    for (const iceId of [innerIceId, outerIceId]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        faceup: true,
        rezzed: true,
      };
    }
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer?.ice).toEqual([innerIceId, outerIceId]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.run?.position).toEqual({
      kind: "ice",
      serverId: "rd",
      iceIndex: 1,
    });
    expect(state.run?.encounteredIceId).toBe(outerIceId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    state = apply(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    state = continueRunThroughMovement(state);
    expect(state.run?.phase).toBe("encounter_ice");
    expect(state.run?.position).toEqual({
      kind: "ice",
      serverId: "rd",
      iceIndex: 0,
    });
    expect(state.run?.encounteredIceId).toBe(innerIceId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "pump_breaker");
    state = apply(
      state,
      "runner",
      (action) => action.type === "break_subroutine",
    );
    state = continueRunThroughMovement(state);
    expect(state.run?.phase).toBe("access");
    expect(state.run?.position).toEqual({ kind: "server", serverId: "rd" });
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
  });

  it("ends the run on an unbroken End the Run subroutine", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "etr" }));
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    expect(agendaPoints(state, "runner")).toBe(0);
    expect(
      state.corp.rd.map((id) => state.cardInstances[id]?.definitionId),
    ).toContain("simple_agenda");
  });

  it("skips the Corp rez window when a later run approaches already rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "rezzed-ice-repeat-run" }),
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "corp").map((action) => action.type),
    ).not.toContain("decline_rez");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toContain("continue_run");
  });

  it("offers Corp root rez before encountering already rezzed ICE", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("root-rez-before-rezzed-ice"),
    );
    state.corp.credits = 10;
    state.runner.credits = 10;
    const drDreffId = putCorpRootInRemote(state, "onr_v1_358_dr-dreff");
    const banpeiId = addRezzedCorpIceForTest(
      state,
      "onr_v1_223_banpei",
      "remote_1",
      "banpei",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("corp");
    expect(state.run).toMatchObject({
      phase: "approach_ice",
      approachedIceId: banpeiId,
    });
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Dr. Dreff",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === drDreffId &&
          action.payload?.rootRez === true,
      ),
    ).toBe(true);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "decline_rez" &&
          action.payload?.runRootRezPass !== true,
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === drDreffId &&
        action.payload?.rootRez === true,
    );
    expect(state.cardInstances[drDreffId]?.rezzed).toBe(true);
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: banpeiId,
    });
    expect(validateGameState(state).ok).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps root rez options open after rezzing approached ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ice-rez-before-root-rez",
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_CORP_DECK,
          cards: [
            { id: "onr_v1_230_cortical-scanner", quantity: 1 },
            { id: "onr_v1_350_antiquated-interface-routines", quantity: 1 },
            ...ONR_V1_CORP_DECK.cards.filter(
              (card) =>
                card.id !== "onr_v1_230_cortical-scanner" &&
                card.id !== "onr_v1_350_antiquated-interface-routines",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 23;
    state.runner.credits = 10;
    const antiquatedId = putCorpRootInRemote(
      state,
      "onr_v1_350_antiquated-interface-routines",
    );
    const scannerId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_230_cortical-scanner",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("corp");
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === scannerId &&
          action.payload?.rootRez !== true,
      ),
    ).toBe(true);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === antiquatedId &&
          action.payload?.rootRez === true,
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === scannerId &&
        action.payload?.rootRez !== true,
    );

    expect(state.cardInstances[scannerId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(16);
    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("corp");
    expect(state.run).toMatchObject({
      phase: "approach_ice",
      approachedIceId: scannerId,
    });
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Antiquated Interface Routines",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === antiquatedId &&
          action.payload?.rootRez === true,
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === antiquatedId &&
        action.payload?.rootRez === true,
    );

    expect(state.cardInstances[antiquatedId]?.rezzed).toBe(true);
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: scannerId,
    });
    expect(validateGameState(state).ok).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("continues directly into a rezzed ICE encounter after the last run root rez", () => {
    let state = createGameAfterSetup({
      seed: "root-rez-tesseract-before-rezzed-crystal-wall",
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_CORP_DECK,
        cards: [
          { id: "onr_v1_232_crystal-wall", quantity: 1 },
          { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
          { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
          ...ONR_V1_CORP_DECK.cards.filter(
            (card) =>
              card.id !== "onr_v1_232_crystal-wall" &&
              card.id !== "onr_v1_355_crystal-palace-station-grid" &&
              card.id !== "onr_v1_370_tesseract-fort-construction",
          ),
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    const tesseractId = putCorpRootInRemote(
      state,
      "onr_v1_370_tesseract-fort-construction",
    );
    const crystalPalaceId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state.cardInstances[crystalPalaceId] = {
      ...state.cardInstances[crystalPalaceId]!,
      faceup: true,
      rezzed: true,
    };
    const crystalWallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );
    state.cardInstances[crystalWallId] = {
      ...state.cardInstances[crystalWallId]!,
      faceup: true,
      rezzed: true,
    };
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
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
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === tesseractId &&
        action.payload?.rootRez === true,
    );

    expect(state.cardInstances[tesseractId]?.rezzed).toBe(true);
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: crystalWallId,
    });
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "continue_run",
      ),
    ).toBe(true);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("lets the Corp score the third Simple Agenda and win at six agenda points", () => {
    let state = createGameAfterSetup({
      seed: "corp-score",
      agendaPointsToWin: 6,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 4;
    scoreTwoAgendasForTest(state);
    moveCorpCardToHq(state, "simple_agenda");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_agenda",
    );
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "advance_card");
    state = apply(state, "corp", (action) => action.type === "score_agenda");

    expect(state.winner).toBe("corp");
    expect(agendaPoints(state, "corp")).toBe(6);
  });
});

describe("MVP 0.1 visibility, replay and state hash", () => {
  it("replays actions and reproduces the final StateHash", () => {
    let state = createGameAfterSetup({ seed: "replay" });
    const initial = structuredClone(state);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "gain_credit");
    state = toRunnerTurnFromCorpMain(state);
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    state = apply(state, "runner", (action) => action.type === "gain_credit");

    const replay = replayEvents(initial, state.eventLog);
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("O:NR v1 Limited local private test access", () => {
  it("validates the secured O:NR harness decks against the current card registry and rules baseline", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = onrV1Game("onr-v1-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.94",
    );
  });

  it("plays O:NR runner draw and economy events, installs memory hardware and simple breakers", () => {
    let state = toRunnerTurn(onrV1Game("onr-v1-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 20;
    moveRunnerCardToGrip(state, "onr_v1_079_bodyweight-synthetic-blood");
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    moveRunnerCardToGrip(state, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(state, "onr_v1_108_score");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    moveRunnerCardToGrip(state, "onr_v1_040_loony-goon");
    moveRunnerCardToGrip(state, "onr_v1_073_wizards-book");

    const beforeBodyweightGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_079_bodyweight-synthetic-blood",
    );
    expect(state.runner.grip.length).toBe(beforeBodyweightGrip + 4);

    const beforeJackGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_095_jack-n-joe",
    );
    expect(state.runner.grip.length).toBe(beforeJackGrip + 2);

    const beforeContactsCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_097_livewires-contacts",
    );
    expect(state.runner.credits).toBe(beforeContactsCredits + 3);

    const beforeScoreCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_108_score",
    );
    expect(state.runner.credits).toBe(beforeScoreCredits + 4);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_145_wutech-mem-chip",
    );
    expect(state.runner.memoryLimit).toBe(4);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(5);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_014_codecracker",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_040_loony-goon",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_073_wizards-book",
    );

    expect(state.runner.memoryUsed).toBe(4);
    expect(
      state.runner.rig.programs
        .map((id) => state.cardInstances[id]?.definitionId)
        .sort(),
    ).toEqual([
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_040_loony-goon",
      "onr_v1_073_wizards-book",
    ]);
  });

  it("resolves O:NR code gates, sentries and multi-damage ICE through existing run rules", () => {
    let codeGateState = toRunnerTurn(onrV1Game("onr-v1-code-gate"));
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "onr_v1_220_tycho-extension");
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
      (action) => action.type === "break_subroutine",
    );
    expect(
      getLegalActions(codeGateState, "runner").find(
        (action) => action.type === "continue_run",
      )?.label,
    ).toBe("ICE passieren");
    codeGateState = continueRunThroughMovement(codeGateState);
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_220_tycho-extension",
    });

    let sentryState = toRunnerTurn(onrV1Game("onr-v1-sentry"));
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "onr_v1_220_tycho-extension");
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
      (action) => action.type === "break_subroutine",
    );
    sentryState = continueRunThroughMovement(sentryState);
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_220_tycho-extension",
    });

    let wallState = toRunnerTurn(onrV1Game("onr-v1-wall-of-ice"));
    putCorpIceOnServer(wallState, "rd", "onr_v1_278_wall-of-ice");
    wallState.corp.credits = 20;
    const beforeGrip = wallState.runner.grip.length;

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
        sourceDefinition(wallState, action) === "onr_v1_278_wall-of-ice",
    );
    const continueIntoWall = getLegalActions(wallState, "runner").find(
      (action) => action.type === "continue_run",
    );
    expect(continueIntoWall).toMatchObject({
      label: "Subroutinen auslösen (Run endet)",
      payload: {
        encounterContinue: true,
        unbrokenSubroutineCount: 4,
        encounterWillEndRun: true,
      },
    });
    wallState = apply(
      wallState,
      "runner",
      (action) => action.type === "continue_run",
    );

    expect(wallState.run).toBeUndefined();
    expect(wallState.runner.grip.length).toBe(beforeGrip - 4);
    expect(wallState.runner.heap.length).toBe(4);
    expect(wallState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageResolved: true,
      damageType: "net",
      damageAmount: 4,
      cardsTrashed: 4,
      flatline: false,
      resolvedEffects: [
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_278_wall-of-ice",
          sourceTitle: "Wall of Ice",
          subroutineIndex: 0,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 2,
          cardsTrashed: 2,
        },
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_278_wall-of-ice",
          sourceTitle: "Wall of Ice",
          subroutineIndex: 1,
          subroutineType: "do_damage",
          damageType: "net",
          amount: 2,
          cardsTrashed: 2,
        },
        {
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_278_wall-of-ice",
          sourceTitle: "Wall of Ice",
          subroutineIndex: 2,
          subroutineType: "end_the_run",
          endedRun: true,
        },
      ],
    });
    expect(JSON.stringify(wallState.eventLog.at(-1)?.publicPayload)).not.toContain(
      wallState.runner.heap[0],
    );
  });

  it("plays O:NR tagged operations, meat damage operations and Tycho Extension scoring", () => {
    let state = createGameAfterSetup({
      seed: "onr-v1-corp-operations",
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: ONR_V1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.runner.tags = 1;
    state.runner.credits = 9;
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");
    moveCorpCardToHq(state, "onr_v1_290_efficiency-experts");
    moveCorpCardToHq(state, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(state, "onr_v1_295_night-shift");
    moveCorpCardToHq(state, "onr_v1_285_closed-accounts");
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");

    const beforeAccounts = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_281_accounts-receivable",
    );
    expect(state.corp.credits).toBe(beforeAccounts + 4);

    const beforeDayShiftHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_290_efficiency-experts",
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

    const beforeVoucherTags = state.runner.tags;
    const beforeVoucherCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_293_netwatch-credit-voucher",
    );
    expect(state.runner.tags).toBe(beforeVoucherTags + 1);
    expect(state.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftHq = state.corp.hq.length;
    const beforeNightShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_295_night-shift",
    );
    expect(state.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(state.corp.hq.length).toBe(beforeNightShiftHq);

    const beforeDatapoolTags = state.runner.tags;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_287_datapool-by-zetatech",
    );
    expect(state.runner.tags).toBe(beforeDatapoolTags + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_285_closed-accounts",
    );
    expect(state.runner.credits).toBe(0);

    for (const [definitionId, amount] of [
      ["onr_v1_301_punitive-counterstrike", 2],
      ["onr_v1_302_scorched-earth", 4],
      ["onr_v1_307_urban-renewal", 5],
    ] as const) {
      let damageState = createGameAfterSetup({
        seed: `onr-v1-${definitionId}`,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      });
      damageState = apply(
        damageState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      damageState.corp.credits = 40;
      damageState.runner.tags = 1;
      moveCorpCardToHq(damageState, definitionId);
      damageState = apply(
        damageState,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(damageState, action) === definitionId,
      );
      expect(damageState.runner.heap.length).toBe(amount);
      expect(damageState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        damageResolved: true,
        damageType: "meat",
        damageAmount: amount,
        cardsTrashed: amount,
        flatline: false,
      });
      expect(
        JSON.stringify(damageState.eventLog.at(-1)?.publicPayload),
      ).not.toContain("runner_");
    }

    let scoringState = createGameAfterSetup({
      seed: "onr-v1-tycho-score",
      runnerDeck: ONR_V1_RUNNER_DECK,
      corpDeck: ONR_V1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    scoringState = apply(
      scoringState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    scoringState.corp.credits = 20;
    scoringState.corp.clicks = 10;
    moveCorpCardToHq(scoringState, "onr_v1_220_tycho-extension");

    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    scoringState = apply(
      scoringState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(scoringState, action) === "onr_v1_220_tycho-extension",
    );
    expect(agendaPoints(scoringState, "corp")).toBe(4);
  });

  it("keeps repaired O:NR simple wall mappings playable", () => {
    for (const definitionId of [
      "onr_v1_237_data-wall",
      "onr_v1_238_data-wall-2-0",
      "onr_v1_265_rock-is-strong",
    ] as const) {
      let state = toRunnerTurn(onrV1Game(`onr-v1-repaired-${definitionId}`));
      putCorpIceOnServer(state, "rd", definitionId);
      putCorpCardOnTopOfRd(state, "onr_v1_220_tycho-extension");
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.run).toBeUndefined();
      expect(agendaPoints(state, "runner")).toBe(0);
      expect(
        state.corp.rd.map((id) => state.cardInstances[id]?.definitionId),
      ).toContain("onr_v1_220_tycho-extension");
    }
  });
});

describe("MVP 0.93 M1 effect, ability and choice foundation", () => {
  it("keeps normal games free of generic V0.93 action types", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "v093-no-visible-new-actions" }),
    );
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
  });

  it("runs basic effect commands without mutating the original state", () => {
    const state = createGameAfterSetup({ seed: "v093-effects" });
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [
      { type: "gain_credits", side: "runner", amount: 3 },
      { type: "spend_credits", side: "runner", amount: 1 },
      { type: "add_tag", amount: 2 },
      { type: "remove_tag", amount: 1 },
    ]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.credits).toBe(state.runner.credits + 2);
    expect(next.runner.tags).toBe(1);
    expect(validateGameState(next).ok).toBe(true);
  });

  it("keeps breaker pump and break public action types while adding ability metadata", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v093-breaker-ability",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    state.corp.credits = 10;

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
        sourceDefinition(state, action) === "v08_wall_ice",
    );
    state = enterEncounterFromMovementWindow(state);
    const pump = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );

    expect(pump.abilityRef).toMatchObject({
      sourceCardInstanceId: pump.source,
    });
    expect(pump.effectRef).toMatch(/^effect\./);
    expect(
      pump.targetRequirements.some(
        (target) =>
          target.id === "encounteredIce" && target.visibility === "public",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === pump.actionId,
    );
    const breaker = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );

    expect(breaker.abilityRef).toMatchObject({
      sourceCardInstanceId: breaker.source,
    });
    expect(breaker.effectRef).toMatch(/^effect\./);
    expect(breaker.type).toBe("break_subroutine");
  });

});

describe("MVP 0.4 controlled card pool and tags", () => {
  it("creates V0.4 games with explicit expanded demo decks on the V1.1.0 agenda target", () => {
    const legacy = createGameAfterSetup({ seed: "legacy-default" });
    const expanded = createGameAfterSetup({
      seed: "v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
    });

    expect(legacy.agendaPointsToWin).toBe(7);
    expect(legacy.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(expanded.agendaPointsToWin).toBe(7);
    expect(expanded.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      Object.values(expanded.cardInstances).some(
        (card) => card.definitionId === "simple_setup_hardware",
      ),
    ).toBe(true);
    expect(
      Object.values(expanded.cardInstances).some(
        (card) => card.definitionId === "simple_tag_ice",
      ),
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_runner_004, {
        expectedSide: "runner",
        allowedDeckIds: ["demo_runner_004"],
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_004, {
        expectedSide: "corp",
        allowedDeckIds: ["demo_corp_004"],
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_004, {
        expectedSide: "runner",
      }).ok,
    ).toBe(false);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_001, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(false);
  });

  it("plays safe batch draw cards and installs hardware for memory", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-runner-safe",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "simple_draw_event");
    moveRunnerCardToGrip(state, "simple_setup_hardware");

    const beforeGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "simple_draw_event",
    );
    expect(state.runner.grip.length).toBe(beforeGrip + 1);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_setup_hardware",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
    expect(
      state.runner.rig.hardware.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("simple_setup_hardware");
  });

  it("rezzes and trashes a simple upgrade without leaking its title before access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-upgrade",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    state.runner.credits = 10;
    putCorpRootInRemote(state, "simple_upgrade");

    let runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).not.toContain("Simple Upgrade");

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_upgrade",
    );
    runnerView = getPlayerView(state, "runner");
    expect(JSON.stringify(runnerView)).toContain("Simple Upgrade");

    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
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
    expect(
      state.corp.archives.map((id) => state.cardInstances[id]?.definitionId),
    ).toContain("simple_upgrade");
  });

  it("applies tags from ICE and lets Runner remove one tag", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v04-tags",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    putCorpIceOnServer(state, "rd", "simple_tag_ice");
    state.corp.credits = 5;
    state.runner.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = continueRunThroughMovementWindow(state);
    expect(state.runner.tags).toBe(1);
    expect(getPlayerView(state, "corp").opponent.tags).toBe(1);

    state.runner.clicks = 1;
    state.runner.credits = 2;
    state = apply(state, "runner", (action) => action.type === "remove_tag");
    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(0);
  });

  it("gates tag punishment operation on runner tags", () => {
    let state = createGameAfterSetup({
      seed: "v04-punishment",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 5;
    moveCorpCardToHq(state, "simple_tag_punishment_operation");

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          sourceDefinition(state, action) === "simple_tag_punishment_operation",
      ),
    ).toBe(false);
    state.runner.tags = 1;
    state.runner.credits = 5;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "simple_tag_punishment_operation",
    );
    expect(state.runner.credits).toBe(3);
  });
});

describe("MVP 0.8 playable starter slice", () => {
  it("creates V0.8 starter decks with current rules baseline and legacy metadata", () => {
    const state = createGameAfterSetup({
      seed: "v08-starter",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
    });

    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(state.baseline.cardImplementationVersion).toBe("0.99.0");
    expect(state.agendaPointsToWin).toBe(7);
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.8",
    );
    expect(state.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.8");
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v08_burst_credit_event",
      ),
    ).toBe(true);
    expect(
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === "v08_watchdog_ice",
      ),
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_runner_008, {
        expectedSide: "runner",
        allowedDeckIds: ["demo_runner_008"],
      }).ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(DEMO_DECKS.demo_corp_008, {
        expectedSide: "corp",
        allowedDeckIds: ["demo_corp_008"],
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("resolves V0.8 runner event and install resolvers", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-runner-events",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_burst_credit_event");
    moveRunnerCardToGrip(state, "v08_deep_draw_event");
    moveRunnerCardToGrip(state, "v08_memory_chip");

    const beforeCredits = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_burst_credit_event",
    );
    expect(state.runner.credits).toBe(beforeCredits + 5);

    const beforeGrip = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_deep_draw_event",
    );
    expect(state.runner.grip.length).toBe(beforeGrip + 2);

    const beforeMemoryLimit = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_memory_chip",
    );
    expect(state.runner.memoryLimit).toBe(beforeMemoryLimit + 1);
  });

  it("uses V0.8 run events and breaker definitions through LegalActions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-run-pressure",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "v08_overclock_run_event");
    installRunnerProgramForTest(state, "v08_steady_fracter");
    putCorpIceOnServer(state, "rd", "v08_wall_ice");
    putCorpCardOnTopOfRd(state, "v08_credit_surge_operation");
    state.corp.credits = 10;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v08_overclock_run_event" &&
        action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "v08_wall_ice",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "v08_steady_fracter",
    );
    state = continueRunThroughMovement(state);
    const beforeAccessCredits = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.credits).toBe(beforeAccessCredits + 3);
    expect(state.run).toBeUndefined();
  });

  it("resolves V0.8 corp operations, asset rez and agenda scoring", () => {
    let state = createGameAfterSetup({
      seed: "v08-corp-economy",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 8;
    moveCorpCardToHq(state, "v08_credit_surge_operation");
    moveCorpCardToHq(state, "v08_archive_planning_operation");
    moveCorpCardToHq(state, "v08_cashout_asset");
    moveCorpCardToHq(state, "v08_project_agenda");

    const beforeCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v08_credit_surge_operation",
    );
    expect(state.corp.credits).toBe(beforeCredits + 6);

    const beforeHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v08_archive_planning_operation",
    );
    expect(state.corp.hq.length).toBe(beforeHq + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_cashout_asset",
    );
    const beforeRezCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "v08_cashout_asset",
    );
    expect(state.corp.credits).toBe(beforeRezCredits + 2);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "v08_project_agenda",
    );

    expect(agendaPoints(state, "corp")).toBe(2);
  });

  it("keeps V0.8 hidden ICE redacted until rez and applies tag subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v08-watchdog",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
      }),
    );
    putCorpIceOnServer(state, "rd", "v08_watchdog_ice");
    state.corp.credits = 10;
    state.runner.credits = 5;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Watchdog ICE",
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
        sourceDefinition(state, action) === "v08_watchdog_ice",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Watchdog ICE",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.tags).toBe(1);
    expect(getPlayerView(state, "corp").opponent.tags).toBe(1);
    expect(state.run).toBeUndefined();
  });
});
