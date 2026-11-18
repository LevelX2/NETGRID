import { serializedDefinitionReferences } from "../../test-fixtures/serialized-definition-references";
import { describe, expect, it } from "vitest";
import { cardSpecRuntimeDefinitionIds } from "@netgrid/cards/engine";
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
import { trashRunnerInstalledCardToHeap as trashRunnerInstalledCardToHeapForTest } from "../../game/engine-runtime-internal/runtime-port-bindings";
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
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

const CARD_SPEC_RUNTIME_DEFINITION_IDS = new Set(
  cardSpecRuntimeDefinitionIds(),
);

describe("V1.9.22 Per-card Longtail WIP", () => {
  it("adds the first V1.9.22 runner hardware runtime definitions without catalog release promotion", () => {
    const runnerHardwareIds = [
      331,
      334,
      335,
      336,
      343,
      348,
      349,
      350,
      359,
    ] as const;
    expect(MECHANIC_SMOKE_CARD_IDS.longtailEffects).toHaveLength(47);
    for (const definitionId of runnerHardwareIds) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.side, String(definitionId)).toBe("runner");
      expect(definition?.type, String(definitionId)).toBe("hardware");
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
      expect(
        cardImplementationForDefinitionId(definitionId),
        String(definitionId),
      ).toBeDefined();
    }
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.implementationStatus,
    ).toBe("playable_mvp");
    expect(
      CARD_DEFINITIONS_BY_ID[335],
    ).toMatchObject({
      installCost: 3,
    });
    expect(
      CARD_DEFINITIONS_BY_ID[336],
    ).toMatchObject({
      installCost: 1,
    });
  });

  it("installs all V1.9.22 runner hardware through LegalActions with replay, visibility and revalidation", () => {
    const runnerHardwareIds = [
      331,
      334,
      335,
      336,
      343,
      348,
      349,
      350,
      359,
    ] as const;

    for (const definitionId of runnerHardwareIds) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-hardware-install`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `onr_v1_runner_v1922_${definitionId}_hardware_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
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
      moveRunnerCardToGrip(state, definitionId);
      if (definitionId === 331)
        scoreRunnerAgendaForTest(state, 588);

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, String(definitionId)).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, String(definitionId)).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, String(definitionId)).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, String(definitionId)).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(
        state.runner.rig.hardware.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        String(definitionId),
      ).toContain(definitionId);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        String(definitionId),
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        String(definitionId),
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        String(definitionId),
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, String(definitionId)).toEqual([]);
      expect(hashState(replay.state), String(definitionId)).toBe(hashState(state));
    }
  });

  it("uses ZZ22 Speed Chip recurring credits only for Killer use during runs", () => {
    let killerState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zz22-killer-recurring",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zz22_killer",
          name: "O:NR V1.9.22 ZZ22 Killer Runner",
          cards: [
            { id: 359, quantity: 1 },
            { id: 598, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zz22_killer",
          name: "O:NR V1.9.22 ZZ22 Killer Corp",
          cards: [
            { id: 601, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    killerState.runner.credits = 6;
    killerState.runner.clicks = 4;
    killerState.runner.memoryLimit = 4;
    killerState.corp.credits = 10;
    const zz22Id = moveRunnerCardToGrip(
      killerState,
      359,
    );
    moveRunnerCardToGrip(killerState, 598);
    const sentryId = putCorpIceOnServer(killerState, "rd", 601);

    const installZz22 = mustAction(
      killerState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(killerState, action) === 359,
    );
    expect(installZz22.costs[0]?.credits).toBe(5);
    killerState = apply(
      killerState,
      "runner",
      (action) => action.actionId === installZz22.actionId,
    );
    expect(killerState.cardInstances[zz22Id]?.counters?.bit).toBe(2);
    installRunnerProgramForTest(killerState, 598);
    killerState.runner.credits = 1;

    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    killerState = apply(
      killerState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === sentryId,
    );
    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(killerState, action) === 598,
    );
    expect(killerState.runner.credits).toBe(1);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit).toBe(1);
    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(killerState, action) === 598,
    );
    expect(killerState.runner.credits).toBe(1);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit ?? 0).toBe(0);
    const killerBreak = mustAction(
      killerState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(killerState, action) === 598,
    );
    killerState = apply(
      killerState,
      "runner",
      (action) => action.actionId === killerBreak.actionId,
    );
    expect(killerState.runner.credits).toBe(0);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit ?? 0).toBe(0);

    let decoderState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zz22-non-killer-recurring",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zz22_decoder",
          name: "O:NR V1.9.22 ZZ22 Decoder Runner",
          cards: [
            { id: 359, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zz22_decoder",
          name: "O:NR V1.9.22 ZZ22 Decoder Corp",
          cards: [
            { id: 590, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    decoderState.runner.credits = 6;
    decoderState.runner.clicks = 4;
    decoderState.runner.memoryLimit = 4;
    decoderState.corp.credits = 10;
    moveRunnerCardToGrip(decoderState, 359);
    moveRunnerCardToGrip(decoderState, 591);
    const codeGateId = putCorpIceOnServer(
      decoderState,
      "rd",
      590,
    );
    decoderState = apply(
      decoderState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(decoderState, action) === 359,
    );
    installRunnerProgramForTest(decoderState, 591);
    decoderState.runner.credits = 0;
    decoderState = apply(
      decoderState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    decoderState = apply(
      decoderState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === codeGateId,
    );
    expect(
      getLegalActions(decoderState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(decoderState, action) === 591,
      ),
    ).toBe(false);
  });

  it("adds V1.9.22 runner event runtime definitions without broad play_event support", () => {
    const runnerEventIds = [
      289,
      292,
      298,
      305,
      312,
      314,
      315,
      321,
      325,
      329,
    ] as const;
    for (const definitionId of runnerEventIds) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.side, String(definitionId)).toBe("runner");
      expect(definition?.type, String(definitionId)).toBe("event");
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
      expect(
        cardImplementationForDefinitionId(definitionId),
        String(definitionId),
      ).toBeDefined();
    }
  });

  it("plays If You Want It Done Right as a private stack top-five choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-if-you-want-it-done-right",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_if_you_want_it_done_right",
          name: "O:NR V1.9.22 If You Want It Done Right",
          cards: [
            { id: 305, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, 305);
    const topFive = state.runner.stack.slice(0, 5);
    expect(topFive).toHaveLength(5);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          305,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-if-you-want-it-done-right-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-if-you-want-it-done-right-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          305,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.runner_stack_top5_choose_one_arrange_rest",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 305,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const runnerChoiceView = getPlayerView(state, "runner");
    const corpChoiceView = getPlayerView(state, "corp");
    const runnerChoiceCards =
      runnerChoiceView.pendingChoice?.options.map((option) => option.card) ??
      [];
    expect(runnerChoiceView.pendingChoice?.choiceId).toBe(
      state.pendingChoice!.choiceId,
    );
    expect(runnerChoiceCards).toHaveLength(5);
    expect(
      runnerChoiceCards.every(
        (card) => card?.known === true && Boolean(card.rulesText),
      ),
    ).toBe(true);
    expect(corpChoiceView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpChoiceView)).not.toContain(topFive[0]);

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing If You Want It Done Right choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const chosenCardId = String(
      pendingChoice.options.find((option) => option.id === selectedOptionIds[0])
        ?.value,
    );
    const expectedStackTop = selectedOptionIds
      .slice(1)
      .map((optionId) =>
        String(
          pendingChoice.options.find((option) => option.id === optionId)?.value,
        ),
      );
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(chosenCardId);
    expect(state.runner.stack.slice(0, expectedStackTop.length)).toEqual(
      expectedStackTop,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
      selectedCount: 1,
      arrangedCount: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Organ Donor as a private grip-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-organ-donor",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_organ_donor",
          name: "O:NR V1.9.22 Organ Donor",
          cards: [
            { id: 315, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, 315);
    const trashCandidates = state.runner.stack.slice(0, 2);
    expect(trashCandidates).toHaveLength(2);
    for (const cardId of trashCandidates) {
      removeEverywhere(state, cardId);
      state.runner.grip.unshift(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "runner", zone: "grip" },
        faceup: true,
        rezzed: true,
      };
    }

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 315,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-organ-donor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-organ-donor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 315,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_47.runner_grip_trash_for_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 315,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
      sourceDefinitionId: 315,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Organ Donor choice");
    const selectedOptionIds = trashCandidates.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of trashCandidates) {
      expect(state.runner.heap).toContain(cardId);
      expect(state.runner.grip).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + trashCandidates.length * 2,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
      trashedCount: 2,
      gainedCredits: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays misc.for-sale as a private installed-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-misc-for-sale",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_misc_for_sale",
          name: "O:NR V1.9.22 misc.for-sale",
          cards: [
            { id: 312, quantity: 1 },
            { id: 602, quantity: 1 },
            { id: 334, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, 602);
    moveRunnerCardToGrip(state, 334);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 602,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 334,
    );
    const installedTargets = state.runner.rig.hardware.slice(0, 2);
    expect(installedTargets).toHaveLength(2);
    moveRunnerCardToGrip(state, 312);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 312,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-misc-for-sale-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-misc-for-sale-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 312,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_47.runner_installed_trash_for_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 312,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
      sourceDefinitionId: 312,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing misc.for-sale choice");
    const selectedOptionIds = installedTargets.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of installedTargets) {
      expect(state.runner.heap).toContain(cardId);
      expect([
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ]).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + installedTargets.length * 3,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
      trashedCount: 2,
      gainedCredits: 6,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Open-Ended Mileage Program as tag removal with optional return", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-open-ended-mileage-program",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_card_implementation_paid_source_return_to_grip_program",
          name: "O:NR V1.9.22 Open-Ended Mileage Program",
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
    state.runner.clicks = 4;
    state.runner.tags = 1;
    const eventCardId = moveRunnerCardToGrip(
      state,
      314,
    );

    const mileageActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          314,
    );
    expect(mileageActions).toHaveLength(2);
    expect(
      mileageActions.map((action) => action.costs[0]?.credits).sort(),
    ).toEqual([0, 1]);
    const legal = mileageActions.find(
      (action) =>
        action.payload?.onPlaySourceDisposition ===
        "return_to_grip_instead_of_trash",
    );
    if (!legal) throw new Error("Open-Ended return action missing.");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-open-ended-mileage-program-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-open-ended-mileage-program-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(eventCardId);
    expect(state.runner.heap).not.toContain(eventCardId);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 314,
      removedTags: 1,
      runnerTagsAfter: 0,
      normalCreditsSpent: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Anonymous Tip as a public black-ice derez choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-anonymous-tip",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip",
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.runner.clicks = 4;
    const blackIceId =
      "card_implementation_derez_rezzed_black_ice_black_ice" as CardInstanceId;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice.push(blackIceId);
    state.cardInstances[blackIceId] = {
      instanceId: blackIceId,
      definitionId: 443,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const anonymousTipId = "v1922_anonymous_tip" as CardInstanceId;
    state.runner.grip.unshift(anonymousTipId);
    state.cardInstances[anonymousTipId] = {
      instanceId: anonymousTipId,
      definitionId: 289,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 289,
    );
    expect(legal.costs[0]?.credits).toBe(3);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-anonymous-tip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-anonymous-tip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 289,
    );
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.derez_rezzed_black_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.runner.credits).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 289,
      abilityId: "derez_black_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Anonymous Tip choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === blackIceId,
    );
    expect(selectedOption).toBeDefined();
    state = applyChoice(state, "runner", selectedOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[blackIceId]?.rezzed).toBe(false);
    expect(state.cardInstances[blackIceId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      abilityId: "derez_black_ice",
      derezzedCount: 1,
      targetCardDefinitionId: 443,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Forged Activation Orders as a public ICE target and Corp rez-or-trash choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders",
          cards: [
            { id: 298, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders Corp",
          cards: [
            { id: 589, quantity: 1 },
            { id: 475, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.corp.credits = 5;
    const targetIceId = putCorpIceOnServer(state, "rd", 589);
    const rezzedReinforcedWallId = putCorpIceOnServer(
      state,
      "hq",
      475,
    );
    state.cardInstances[rezzedReinforcedWallId] = {
      ...state.cardInstances[rezzedReinforcedWallId]!,
      rezzed: true,
      faceup: true,
    };
    moveRunnerCardToGrip(state, 298);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          298,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-forged-activation-orders-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-forged-activation-orders-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          298,
    );
    expect(state.runner.credits).toBe(1);
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.corp_choice_rez_or_trash_ice_target",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(serializedDefinitionReferences(JSON.stringify(runnerChoice))).not.toContain(589);
    expect(runnerChoice?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata: {
            targetServerId: "rd",
            targetIcePosition: expect.any(Number),
          },
        }),
      ]),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 298,
      abilityId: "force_rez_or_trash_ice",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"|"simple_barrier_ice"/,
    );

    const targetChoice = state.pendingChoice;
    expect(targetChoice).toBeDefined();
    if (!targetChoice)
      throw new Error("Missing Forged Activation Orders target choice");
    expect(targetChoice.options.map((option) => option.value)).toContain(
      rezzedReinforcedWallId,
    );
    const targetOption = targetChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.corp_choice_rez_or_trash_ice_decision",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.pendingChoice?.prompt).toBe(
      "Rez-oder-Trash-Entscheidung für ICE 1 in R&D",
    );
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "Simple Barrier ICE rezzen",
      "ICE 1 in R&D trashen",
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      abilityId: "force_rez_or_trash_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
      targetIcePositionLabel: "ICE 1 in R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"simple_barrier_ice"/,
    );

    const corpCreditsBefore = state.corp.credits;
    state = applyChoice(state, "corp", "rez_ice");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[targetIceId]?.rezzed).toBe(true);
    expect(state.cardInstances[targetIceId]?.faceup).toBe(true);
    expect(state.corp.credits).toBeLessThan(corpCreditsBefore);
    expect(state.runnerTurnFlags?.corpRezzedIceThisTurn).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      abilityId: "force_rez_or_trash_ice",
      corpDecision: "rez_ice",
      targetCardDefinitionId: 589,
      targetServerLabel: "R&D",
      targetIcePositionLabel: "ICE 1 in R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noUnrezzedTargetState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders-no-unrezzed-target",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders_no_unrezzed",
          name: "O:NR V1.9.22 Forged Activation Orders No Unrezzed",
          cards: [
            { id: 298, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders_no_unrezzed",
          name: "O:NR V1.9.22 Forged Activation Orders No Unrezzed Corp",
          cards: [
            { id: 475, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    noUnrezzedTargetState.runner.credits = 2;
    const onlyRezzedTargetId = putCorpIceOnServer(
      noUnrezzedTargetState,
      "hq",
      475,
    );
    noUnrezzedTargetState.cardInstances[onlyRezzedTargetId] = {
      ...noUnrezzedTargetState.cardInstances[onlyRezzedTargetId]!,
      rezzed: true,
      faceup: true,
    };
    moveRunnerCardToGrip(
      noUnrezzedTargetState,
      298,
    );
    noUnrezzedTargetState = apply(
      noUnrezzedTargetState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(noUnrezzedTargetState, action) ===
          298,
    );
    const onlyRezzedTargetOption =
      noUnrezzedTargetState.pendingChoice?.options.find(
        (option) => option.value === onlyRezzedTargetId,
      );
    noUnrezzedTargetState = applyChoice(
      noUnrezzedTargetState,
      "runner",
      onlyRezzedTargetOption?.id ?? "",
    );
    expect(
      noUnrezzedTargetState.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["trash_ice"]);

    let trashState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders-trash",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash",
          cards: [
            { id: 298, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash Corp",
          cards: [
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    trashState.runner.credits = 2;
    trashState.corp.credits = 0;
    const trashTargetId = putCorpIceOnServer(
      trashState,
      "hq",
      589,
    );
    moveRunnerCardToGrip(trashState, 298);
    trashState = apply(
      trashState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(trashState, action) ===
          298,
    );
    const trashTargetChoice = trashState.pendingChoice;
    if (!trashTargetChoice)
      throw new Error("Missing Forged Activation Orders trash target choice");
    const trashTargetOption = trashTargetChoice.options.find(
      (option) => option.value === trashTargetId,
    );
    trashState = applyChoice(trashState, "runner", trashTargetOption?.id ?? "");
    expect(trashState.pendingChoice?.prompt).toBe(
      "Rez-oder-Trash-Entscheidung für ICE 1 in HQ",
    );
    expect(
      trashState.pendingChoice?.options.map((option) => option.label),
    ).toEqual(["ICE 1 in HQ trashen"]);
    expect(
      trashState.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["trash_ice"]);
    trashState = applyChoice(trashState, "corp", "trash_ice");
    expect(trashState.corp.archives).toContain(trashTargetId);
    expect(trashState.cardInstances[trashTargetId]?.faceup).toBe(false);
    expect(trashState.cardInstances[trashTargetId]?.rezzed).toBe(false);
    expect(trashState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      abilityId: "force_rez_or_trash_ice",
      corpDecision: "trash_ice",
      trashedCount: 1,
      targetIcePositionLabel: "ICE 1 in HQ",
      targetVisibility: "hidden_installed_ice_position",
    });
    expect(trashState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "targetCardDefinitionId",
    );
    expect(
      JSON.stringify(trashState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/simple_barrier_ice/);
    expect(JSON.stringify(getPlayerView(trashState, "runner"))).not.toMatch(
      /simple_barrier_ice|Simple Barrier ICE/,
    );
  });

  it("plays Core Command Jettison Ice after a successful HQ run to pay rez cost and trash rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-core-command-jettison-ice",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_card_implementation_pay_rez_cost_trash_rezzed_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice",
          cards: [
            { id: 292, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_card_implementation_pay_rez_cost_trash_rezzed_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice Corp",
          cards: [
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, 596);
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", 589);
    state.cardInstances[targetIceId] = {
      ...state.cardInstances[targetIceId]!,
      faceup: true,
      rezzed: true,
    };
    const eventCardId = moveRunnerCardToGrip(
      state,
      292,
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            292,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(state.run?.phase).toBe("access");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          292,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-core-command-jettison-ice-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-core-command-jettison-ice-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          292,
    );
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.pay_rez_cost_trash_rezzed_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Core Command choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.runner.credits).toBeLessThan(creditsBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      abilityId: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      trashedCount: 1,
      targetCardDefinitionId: 589,
      targetServerLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Security Code WORM Chip after a successful HQ run to trash unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-security-code-worm-chip",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_card_implementation_trash_unrezzed_ice",
          name: "O:NR V1.9.22 Security Code WORM Chip",
          cards: [
            { id: 321, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_card_implementation_trash_unrezzed_ice",
          name: "O:NR V1.9.22 Security Code WORM Chip Corp",
          cards: [
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, 596);
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", 589);
    const eventCardId = moveRunnerCardToGrip(
      state,
      321,
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            321,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          321,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-security-code-worm-chip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-security-code-worm-chip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          321,
    );
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.trash_unrezzed_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(
      serializedDefinitionReferences(JSON.stringify(getPlayerView(state, "runner").pendingChoice)),
    ).not.toContain(589);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 321,
      abilityId: "successful_hq_run_trash_unrezzed_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Security Code WORM Chip choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      abilityId: "successful_hq_run_trash_unrezzed_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
      trashedCount: 1,
      targetCardDefinitionId: 589,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not offer Security Code WORM Chip after a successful HQ run without unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-security-code-worm-chip-no-target",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_card_implementation_trash_unrezzed_ice_no_target",
          name: "O:NR V1.9.22 Security Code WORM Chip No Target",
          cards: [
            { id: 321, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(
      state,
      505,
    );
    keepOnlyCorpHqCard(state, hqCard);
    moveRunnerCardToGrip(state, 321);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            321,
      ),
    ).toBe(false);
  });

  it("plays Synchronized Attack on HQ after a successful HQ run as a private Corp retain choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-synchronized-attack-on-hq",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_runner_successful_hq_run_corp_pay_to_retain_hq",
          name: "O:NR V1.9.22 Synchronized Attack on HQ",
          cards: [
            { id: 325, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    state.runner.clicks = 4;
    state.corp.credits = 4;
    keepOnlyCorpHqCards(state, []);
    const hqCards = [
      moveCorpCardCopyToHq(state, 596),
      moveCorpCardCopyToHq(state, 596),
      moveCorpCardCopyToHq(state, 596),
    ];
    keepOnlyCorpHqCards(state, hqCards);
    const eventCardId = moveRunnerCardToGrip(
      state,
      325,
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            325,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          325,
    );
    expect(legal.costs[0]?.credits).toBe(4);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-synchronized-attack-on-hq-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-synchronized-attack-on-hq-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          325,
    );
    expect(state.pendingChoice?.source).toContain(
      "runner.successful_hq_run_corp_pay_to_retain_hq",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 325,
      abilityId: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Synchronized Attack on HQ choice");
    const retainedIds = hqCards.slice(0, 2);
    const selectedOptionIds = retainedIds.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of retainedIds) expect(state.corp.hq).toContain(cardId);
    expect(state.corp.archives).toContain(hqCards[2]);
    expect(state.corp.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      abilityId: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
      retainedCount: 2,
      discardedCount: 1,
      paidCredits: 4,
      corpCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Valu-Pak Software Bundle as a consecutive program-install action bundle", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-valu-pak-software-bundle",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_valu_pak_software_bundle",
          name: "O:NR V1.9.22 Valu-Pak Software Bundle",
          cards: [
            { id: 329, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, 329);
    const programId = moveRunnerCardToGrip(state, 591);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          329,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-valu-pak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-valu-pak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          329,
    );
    expect(state.runner.clicks).toBe(8);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      5,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      1,
    );
    expect(
      state.runnerTurnFlags?.restrictedActionGrants?.valu_pak_program_install,
    ).toMatchObject({
      side: "runner",
      sourceDefinitionId: 329,
      actionType: "install_card",
      remainingActions: 5,
      costProfile: "temporary_credit_bundle",
      temporaryCredits: {
        amount: 1,
        usableFor: "runner_program_install",
      },
      cleanupTiming: "side_turn_end",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 329,
      abilityId: "program_install_action_bundle",
      gainedActions: 5,
      temporaryProgramInstallCredits: 1,
      valuPakProgramInstallActionsRemaining: 5,
      runnerClicksAfter: 8,
    });

    const bundleActions = getLegalActions(state, "runner");
    expect(
      bundleActions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === 591,
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "start_run" ||
          action.type === "play_event",
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 591,
    );
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.runner.credits).toBe(0);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      4,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      0,
    );
    expect(
      state.runnerTurnFlags?.restrictedActionGrants?.valu_pak_program_install,
    ).toMatchObject({
      remainingActions: 4,
      temporaryCredits: { amount: 0 },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: 591,
      abilityId: "program_install_action_bundle",
      valuPakInstallActionSpent: true,
      valuPakProgramInstallActionsRemaining: 4,
      valuPakTemporaryProgramInstallCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "stop_restricted_action_sequence" &&
          action.payload?.v1922ValuPakSequenceStop === true,
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "stop_restricted_action_sequence" &&
        action.payload?.v1922ValuPakSequenceStop === true,
    );
    expect(state.activeSide).toBe("runner");
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      0,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      0,
    );
    expect(
      state.runnerTurnFlags?.restrictedActionGrants?.valu_pak_program_install,
    ).toBe(undefined);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "stop_restricted_action_sequence",
      abilityId: "program_install_action_bundle",
      valuPakSequenceStopped: true,
      valuPakRestrictedActionsForgone: 4,
      valuPakTemporaryCreditsReturned: 0,
      runnerClicksAfter: 3,
    });
    const resumedActions = getLegalActions(state, "runner");
    expect(resumedActions.some((action) => action.type === "gain_credit")).toBe(
      true,
    );
    expect(resumedActions.some((action) => action.type === "draw_card")).toBe(
      true,
    );
    expect(
      resumedActions.some(
        (action) => action.type === "stop_restricted_action_sequence",
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps a Valu-Pak bundle install available at full MU and uses the normal replacement flow", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-valu-pak-full-mu",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_valu_pak_full_mu",
          cards: [
            { id: 329, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    moveRunnerCardToGrip(state, 329);
    const targetId = moveRunnerCardToGrip(
      state,
      234,
    );
    const fillerIds = Object.values(state.cardInstances)
      .filter(
        (instance) =>
          instance.definitionId === 591 ||
          instance.definitionId === 597,
      )
      .slice(0, 4)
      .map((instance) => instance.instanceId);
    expect(fillerIds).toHaveLength(4);
    for (const fillerId of fillerIds) {
      removeEverywhere(state, fillerId);
      state.runner.rig.programs.push(fillerId);
      state.runner.memoryUsed += 1;
      state.cardInstances[fillerId] = {
        ...state.cardInstances[fillerId]!,
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: true,
      };
    }
    const trashId = fillerIds[0]!;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          329,
    );
    const installAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === targetId &&
        action.payload?.runnerProgramTrashBeforeInstall === true,
    );
    expect(installAction).toBeDefined();
    state = apply(
      state,
      "runner",
      (action) => action.actionId === installAction?.actionId,
    );
    expect(state.pendingChoice?.source).toContain(
      "runner_program_trash_before_install",
    );
    const trashOption = state.pendingChoice?.options.find(
      (option) => option.value === trashId,
    );
    state = applyChoice(state, "runner", String(trashOption?.id));

    expect(state.runner.heap).toContain(trashId);
    expect(state.runner.rig.programs).toContain(targetId);
    expect(state.runner.memoryUsed).toBe(4);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      4,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "runner_program_trash_before_install",
      valuPakInstallActionSpent: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Japanese Water Torture, breaks Wall subroutines and carries future action debt without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-japanese-water-torture-wall-debt",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_japanese_water_torture",
          name: "O:NR V1.9.22 Japanese Water Torture",
          cards: [
            { id: 249, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_japanese_water_torture_wall",
          name: "O:NR V1.9.22 Japanese Water Torture Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    state.corp.maxHandSize = 99;
    moveRunnerCardToGrip(state, 249);
    const iceId = putCorpIceOnServer(
      state,
      "archives",
      444,
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 249,
    );
    expect(state.runner.credits).toBe(13);
    expect(state.runner.memoryUsed).toBe(1);
    const tortureId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        249,
    );
    expect(tortureId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) ===
            249,
      ),
    ).toBe(false);

    for (let pump = 0; pump < 3; pump += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) ===
            249,
      );
    }
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
      cardDefinitionId: 249,
      abilityId: "variable_pump_future_action_debt",
      futureActionDebtAdded: 1,
      futureActionDebtPending: 3,
      breakerStrengthAfter: 5,
    });

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) ===
          249 &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-japanese-water-torture-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-japanese-water-torture-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 249,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    for (let step = 0; step < 4 && state.run; step += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" ||
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
    }
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(0);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(0);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not offer Japanese Water Torture pump actions against non-Wall ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-japanese-water-torture-quandary-no-pump",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_japanese_water_torture_quandary",
          name: "O:NR V1.9.22 Japanese Water Torture Quandary",
          cards: [
            { id: 249, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_japanese_water_torture_quandary",
          name: "O:NR V1.9.22 Japanese Water Torture Quandary Corp",
          cards: [
            { id: 473, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 249);
    const iceId = putCorpIceOnServer(state, "hq", 473);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 249,
    );
    const tortureId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        249,
    );
    expect(tortureId).toBeDefined();

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const runnerActions = getLegalActions(state, "runner");
    expect(
      runnerActions.some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) ===
            249,
      ),
    ).toBe(false);
    expect(
      runnerActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) ===
            249,
      ),
    ).toBe(false);
  });

  it("installs Hammer and applies ordered Stealth loss after breaking Wall subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-hammer-wall-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_hammer",
          name: "O:NR V1.9.22 Hammer",
          cards: [
            { id: 223, quantity: 1 },
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_hammer_wall",
          name: "O:NR V1.9.22 Hammer Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 223);
    moveRunnerCardToGrip(state, 243);
    const iceId = putCorpIceOnServer(state, "rd", 444);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 223,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 243,
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 223,
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 243,
    );
    expect(cloakId).toBeDefined();
    expect(hammerId).toBeDefined();
    if (!cloakId || !hammerId)
      throw new Error("Missing installed Hammer or Cloak");
    expect(state.runner.memoryUsed).toBe(2);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);

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
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 243,
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 243 &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-hammer-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-hammer-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 243,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("opens a private Hammer Stealth-loss distribution choice for multiple sources", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-hammer-stealth-choice",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_hammer_choice",
          name: "O:NR V1.9.22 Hammer Choice",
          cards: [
            { id: 223, quantity: 1 },
            { id: 243, quantity: 1 },
            { id: 247, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_hammer_choice",
          name: "O:NR V1.9.22 Hammer Choice Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 5;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 223);
    moveRunnerCardToGrip(state, 243);
    moveRunnerCardToGrip(state, 247);
    const iceId = putCorpIceOnServer(state, "rd", 444);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 223,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 247,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 243,
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 223,
    );
    const invisibilityId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 247,
    );
    expect(cloakId).toBeDefined();
    expect(invisibilityId).toBeDefined();
    if (!cloakId || !invisibilityId)
      throw new Error("Missing installed Stealth sources");

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
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 243,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 243 &&
        action.payload?.subroutineIndex === 0,
    );

    expect(state.pendingChoice?.source).toContain(
      "v1922.post_break_stealth_loss:any_stealth_cards:2:",
    );
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.minSelections).toBe(2);
    expect(state.pendingChoice?.maxSelections).toBe(2);
    expect(state.pendingChoice?.continuation).toMatchObject({
      family: "runner_post_break_stealth_loss",
      originActionId: expect.stringContaining("r3"),
      requiredLoss: 2,
      sourceMode: "any_stealth_cards",
      createdAtStateVersion: state.stateVersion,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 243,
      postBreakStealthLossPending: 2,
    });

    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    const cloakOption = runnerChoice?.options.find(
      (option) => option.value === cloakId,
    );
    const invisibilityOption = runnerChoice?.options.find(
      (option) => option.value === invisibilityId,
    );
    expect(cloakOption).toBeDefined();
    expect(invisibilityOption).toBeDefined();
    if (!cloakOption || !invisibilityOption)
      throw new Error("Missing Hammer Stealth options");

    state = applyChoices(state, "runner", [
      cloakOption.id,
      invisibilityOption.id,
    ]);
    expect(state.pendingChoice).toBeUndefined();
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(2);
    expect(cardCounterAmount(state, invisibilityId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1922_post_break_stealth_loss_distribution",
      selectedCount: 2,
      postBreakStealthLoss: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Flak and breaks AP ICE subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-flak-ap-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_flak",
          name: "O:NR V1.9.22 Flak",
          cards: [
            { id: 239, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_flak_ap",
          name: "O:NR V1.9.22 Flak AP ICE Corp",
          cards: [
            { id: 436, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 239);
    const iceId = putCorpIceOnServer(state, "rd", 436);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 239,
    );
    expect(state.runner.credits).toBe(16);
    expect(state.runner.memoryUsed).toBe(1);
    const flakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 239,
    );
    expect(flakId).toBeDefined();

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
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === 239,
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 239,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 239,
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 239 &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-flak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-flak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 239,
      title: "Flak",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBeDefined();
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Reflector and only breaks tagged stun or knockout subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-reflector-tagged-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_reflector",
          name: "O:NR V1.9.22 Reflector",
          cards: [
            { id: 267, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_reflector",
          name: "O:NR V1.9.22 Reflector Tagged ICE Corp",
          cards: [
            { id: 483, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 267);
    const iceId = putCorpIceOnServer(state, "rd", 483);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 267,
    );
    expect(state.runner.credits).toBe(8);
    expect(state.runner.memoryUsed).toBe(1);

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
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 267,
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0]);
    expect(breakActions[0]?.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-reflector-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-reflector-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakActions[0]?.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === 267,
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 267,
      title: "Reflector",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs V1.9.22 install-only runner programs while keeping their abilities gated", () => {
    const installOnlyPrograms = [
      {
        definitionId: 238,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 256,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 260,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 263,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 269,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 279,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 280,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: 287,
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
    ] as const;

    for (const {
      definitionId,
      expectedCreditsAfter,
      expectedMemoryUsed,
    } of installOnlyPrograms) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-install-only`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `onr_v1_runner_v1922_${definitionId}_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 10;
      state.runner.memoryLimit = 4;
      moveRunnerCardToGrip(state, definitionId);

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, String(definitionId)).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, String(definitionId)).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, String(definitionId)).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, String(definitionId)).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(state.runner.credits, String(definitionId)).toBe(expectedCreditsAfter);
      expect(state.runner.memoryUsed, String(definitionId)).toBe(expectedMemoryUsed);
      expect(
        state.runner.rig.programs.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        String(definitionId),
      ).toContain(definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) => sourceDefinition(state, action) === definitionId,
        ),
        String(definitionId),
      ).toBe(false);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        String(definitionId),
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        String(definitionId),
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        String(definitionId),
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, String(definitionId)).toEqual([]);
      expect(hashState(replay.state), String(definitionId)).toBe(hashState(state));
    }
  });

  it("uses Zetatech Software Installer recurring credits for program installs and refreshes", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-software-installer-recurring-program-install",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_software_installer_recurring",
          name: "O:NR V1.9.22 Zetatech Software Installer Recurring",
          cards: [
            { id: 287, quantity: 1 },
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 4;
    const installerId = moveRunnerCardToGrip(
      state,
      287,
    );
    const hammerId = moveRunnerCardToGrip(state, 243);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          287,
    );

    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        sourceDefinition(state, action) === 243,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zetatech-installs-hammer-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zetatech-installs-hammer-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 243,
    );

    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(0);
    expect(state.runner.rig.programs).toContain(hammerId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: 243,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );

    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("lets Runner choose how many Zetatech bits pay for a program install", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-program-install-payment-choice",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_payment_choice",
          name: "O:NR V1.9.22 Zetatech Payment Choice",
          cards: [
            { id: 287, quantity: 1 },
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 4;
    const installerId = moveRunnerCardToGrip(
      state,
      287,
    );
    const hammerId = moveRunnerCardToGrip(state, 243);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          287,
    );
    state.runner.credits = 2;

    const installActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        action.payload?.hostOnCardId === undefined &&
        action.payload?.runnerProgramTrashBeforeInstall !== true,
    );
    const byAmount = new Map(
      installActions.map((action) => [
        String(action.payload?.runnerInstallPaymentSourceAmounts),
        action,
      ]),
    );
    expect([...byAmount.keys()].sort()).toEqual(["0", "1", "2"]);
    expect(
      installActions.map((action) => action.payload?.runnerInstallPaymentLabel),
    ).toEqual([
      "Ohne Kartencredits",
      "Mit Zetatech Software Installer: 1 Bit",
      "Mit Zetatech Software Installer: 2 Bits",
    ]);

    const zeroBitState = apply(
      structuredClone(state),
      "runner",
      (action) => action.actionId === byAmount.get("0")?.actionId,
    );
    expect(zeroBitState.runner.credits).toBe(0);
    expect(cardCounterAmount(zeroBitState, installerId, "bit")).toBe(2);

    const oneBitState = apply(
      structuredClone(state),
      "runner",
      (action) => action.actionId === byAmount.get("1")?.actionId,
    );
    expect(oneBitState.runner.credits).toBe(1);
    expect(cardCounterAmount(oneBitState, installerId, "bit")).toBe(1);
    expect(oneBitState.eventLog.at(-1)?.publicPayload).toMatchObject({
      installCostPaid: 2,
      runnerInstallNormalCreditsPaid: 1,
      runnerInstallHostedCreditsPaid: 1,
      runnerInstallPaymentSourceDefinitionIds:
        "287",
    });
    expect(
      JSON.stringify(oneBitState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/);

    const twoBitState = apply(
      structuredClone(state),
      "runner",
      (action) => action.actionId === byAmount.get("2")?.actionId,
    );
    expect(twoBitState.runner.credits).toBe(2);
    expect(cardCounterAmount(twoBitState, installerId, "bit")).toBe(0);
    const replay = replayEvents(
      state,
      twoBitState.eventLog.slice(state.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(twoBitState));
  });

  it("keeps multiple Zetatech payment sources distinct for program installs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-program-install-multiple-payment-sources",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_multiple_sources",
          name: "O:NR V1.9.22 Zetatech Multiple Sources",
          cards: [
            { id: 287, quantity: 2 },
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 6;
    const firstInstallerId = moveRunnerCardToGrip(
      state,
      287,
    );
    const secondInstallerId = Object.entries(state.cardInstances).find(
      ([cardId, instance]) =>
        cardId !== firstInstallerId &&
        instance.definitionId === 287,
    )?.[0] as CardInstanceId | undefined;
    if (!secondInstallerId) throw new Error("Missing second Zetatech instance");
    state.runner.stack = state.runner.stack.filter(
      (cardId) => cardId !== secondInstallerId,
    );
    state.runner.grip.unshift(secondInstallerId);
    state.cardInstances[secondInstallerId] = {
      ...state.cardInstances[secondInstallerId]!,
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
    };
    const hammerId = moveRunnerCardToGrip(state, 243);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          287,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          287,
    );
    state.runner.credits = 1;

    const installerIds = state.runner.rig.programs
      .filter(
        (cardId) =>
          state.cardInstances[cardId]?.definitionId ===
          287,
      )
      .sort();
    expect(installerIds).toHaveLength(2);

    const installActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        action.payload?.hostOnCardId === undefined &&
        action.payload?.runnerProgramTrashBeforeInstall !== true,
    );
    const byAmounts = new Map(
      installActions.map((action) => [
        String(action.payload?.runnerInstallPaymentSourceAmounts),
        action,
      ]),
    );
    expect(byAmounts.has("1,0")).toBe(true);
    expect(byAmounts.has("0,1")).toBe(true);
    expect(byAmounts.has("0,0")).toBe(false);
    expect(new Set(installActions.map((action) => action.actionId)).size).toBe(
      installActions.length,
    );
    expect(
      installActions.map((action) => action.payload?.runnerInstallPaymentLabel),
    ).toContain("Mit Zetatech Software Installer #1: 1 Bit");
    expect(
      installActions.map((action) => action.payload?.runnerInstallPaymentLabel),
    ).toContain("Mit Zetatech Software Installer #2: 1 Bit");

    const firstSourceState = apply(
      state,
      "runner",
      (action) => action.actionId === byAmounts.get("1,0")?.actionId,
    );
    expect(firstSourceState.runner.credits).toBe(0);
    expect(cardCounterAmount(firstSourceState, installerIds[0]!, "bit")).toBe(
      1,
    );
    expect(cardCounterAmount(firstSourceState, installerIds[1]!, "bit")).toBe(
      2,
    );
    expect(firstSourceState.runner.rig.programs).toContain(hammerId);
  });

  it("installs a program by overwriting Zetatech Software Installer", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-overwrite-install",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_overwrite",
          name: "O:NR V1.9.22 Zetatech Overwrite",
          cards: [
            { id: 287, quantity: 1 },
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 1;
    const installerId = moveRunnerCardToGrip(
      state,
      287,
    );
    const hammerId = moveRunnerCardToGrip(state, 243);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          287,
    );
    expect(state.runner.memoryUsed).toBe(1);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          action.source === hammerId &&
          action.payload?.hostOnCardId === installerId,
      ),
    ).toBe(false);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        action.payload?.runnerProgramTrashBeforeInstall === true,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zetatech-overwrite-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zetatech-overwrite-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.pendingChoice?.source).toContain(
      "runner_program_trash_before_install",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const installerOption = state.pendingChoice?.options.find(
      (option) => option.value === installerId,
    );
    expect(installerOption).toBeDefined();

    state = applyChoice(state, "runner", installerOption?.id ?? "");

    expect(state.runner.rig.programs).toContain(hammerId);
    expect(state.runner.rig.programs).not.toContain(installerId);
    expect(state.runner.heap).toContain(installerId);
    expect(state.cardInstances[hammerId]?.hostedOn).toBeUndefined();
    expect(state.runner.memoryUsed).toBe(1);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCount: 1,
      trashedCardDefinitionIds: "287",
      installed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /hostOnCardId|hostDefinitionId|hostedRecurringCreditsSpent/,
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves False Echo and Netspace Inverter after a successful run without hidden payload leaks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-false-echo-netspace-inverter",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_false_echo_netspace_runner",
          name: "Spotcheck False Echo Netspace Runner",
          cards: [
            { id: 238, quantity: 1 },
            { id: 256, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_false_echo_netspace_corp",
          name: "Spotcheck False Echo Netspace Corp",
          cards: [
            { id: 594, quantity: 1 },
            { id: 589, quantity: 1 },
            { id: 590, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, 238);
    installRunnerProgramForTest(state, 256);
    putCorpRootInRemote(state, 594);
    const innerIce = putCorpIceOnServer(
      state,
      "r1",
      589,
    );
    const outerIce = putCorpIceOnServer(
      state,
      "r1",
      590,
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );

    expect(state.run?.successful).toBe(true);
    state.run!.runnerCreditGainOnCorpRez = 1;
    const accessState = structuredClone(state);
    const falseEcho = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1922RunnerProgramAbility ===
          "successful_run_force_rez",
    );
    expect(falseEcho.costs[0]?.credits).toBe(2);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: falseEcho.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-false-echo-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === falseEcho.actionId,
    );
    expect(state.runner.credits).toBe(10);
    expect(state.cardInstances[innerIce]?.rezzed).toBe(true);
    expect(state.cardInstances[outerIce]?.rezzed).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "successful_run_force_rez",
      checkedIceCount: 2,
      rezzedIceCount: 2,
      rezCostPaid: 5,
      successfulRunForceRezCreditCost: 2,
      runnerCreditsAfter: 10,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(accessState, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let reverseState = structuredClone(accessState);
    const reverse = mustAction(
      reverseState,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1922RunnerProgramAbility ===
          "successful_run_reverse_ice",
    );
    reverseState = apply(
      reverseState,
      "runner",
      (action) => action.actionId === reverse.actionId,
    );
    expect(
      reverseState.corp.servers.find((server) => server.id === "r1")?.ice,
    ).toEqual([outerIce, innerIce]);
    expect(reverseState.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "successful_run_reverse_ice",
      iceCount: 2,
      serverIceOrderReversed: true,
    });
    expect(
      JSON.stringify(reverseState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/);
  });

  it("enforces generic hardware deck replacement and Arasaka agenda-point install cost", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-arasaka-pandora-deck-unique",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_arasaka_pandora_runner",
          name: "Spotcheck Arasaka Pandora Runner",
          cards: [
            { id: 331, quantity: 1 },
            { id: 348, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    state.runner.credits = 20;
    const pandoraId = moveRunnerCardToGrip(state, 348);
    const arasakaId = moveRunnerCardToGrip(
      state,
      331,
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            331,
      ),
    ).toBe(false);
    const spentAgendaId = scoreRunnerAgendaForTest(state, 588);

    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === 348,
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(6);
    expect(cardCounterAmount(state, pandoraId, "bit")).toBe(3);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) ===
        331,
    );
    expect(state.runner.heap).toContain(pandoraId);
    expect(state.runner.rig.hardware).toContain(arasakaId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(7);
    expect(cardCounterAmount(state, arasakaId, "bit")).toBe(3);
    expect(state.runner.scoreArea).toContain(spentAgendaId);
    expect(state.specialZones?.removedFromGame ?? []).not.toContain(
      spentAgendaId,
    );
    expect(state.cardInstances[spentAgendaId]?.agendaPointsSpent).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 331,
      deckUniqueReplacement: true,
      agendaPointCostPaid: 1,
      spentAgendaCardId: spentAgendaId,
      hostedCreditsAdded: 3,
      counterType: "bit",
    });

    let followUpState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-eagle-techtronica-deck-unique",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_eagle_techtronica_runner",
          name: "Spotcheck Eagle Techtronica Runner",
          cards: [
            { id: 352, quantity: 1 },
            { id: 355, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    followUpState.runner.credits = 30;
    const eagleId = moveRunnerCardToGrip(
      followUpState,
      352,
    );
    const techtronicaId = moveRunnerCardToGrip(
      followUpState,
      355,
    );
    followUpState = apply(
      followUpState,
      "runner",
      (action) =>
        sourceDefinition(followUpState, action) ===
        352,
    );
    expect(followUpState.runner.rig.hardware).toContain(eagleId);
    followUpState = apply(
      followUpState,
      "runner",
      (action) =>
        sourceDefinition(followUpState, action) ===
        355,
    );
    expect(followUpState.runner.heap).toContain(eagleId);
    expect(followUpState.runner.rig.hardware).not.toContain(eagleId);
    expect(followUpState.runner.rig.hardware).toContain(techtronicaId);
    expect(followUpState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 355,
      deckUniqueReplacement: true,
    });
  });

  it("loads P3.40/P3.41 hardware decks through CardImplementation bits and memory modifiers", () => {
    for (const [definitionId, expectedMu, expectedBits] of [
      [331, 3, 3],
      [334, 2, 2],
      [348, 2, 3],
      [349, 1, 1],
      [350, 1, 3],
      [352, 1, 1],
      [353, 1, 3],
      [355, 1, 5],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-deck-ci`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `p340_${definitionId}_runner`,
            name: `P3.40 ${definitionId} Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      const cardId = moveRunnerCardToGrip(state, definitionId);
      if (definitionId === 331)
        scoreRunnerAgendaForTest(state, 588);
      const memoryBefore = getPlayerView(state, "runner").own.memoryLimit ?? 0;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
        memoryBefore + expectedMu,
      );
      if (
        [
          352,
          353,
          355,
        ].includes(definitionId)
      ) {
        expect(CARD_DEFINITIONS_BY_ID[definitionId]?.memoryLimitBonus).toBe(1);
        expect(
          getPlayerView(state, "corp").opponent.rig?.find(
            (card) => card.definitionId === definitionId,
          )?.memoryLimitBonus,
        ).toBe(1);
      }
      if (definitionId === 355)
        expect(CARD_DEFINITIONS_BY_ID[definitionId]?.recurringCredits).toBe(5);
      expect(cardCounterAmount(state, cardId, "bit")).toBe(expectedBits);
      expect(cardCounterAmount(state, cardId, "recurring_credit")).toBe(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
        hostedCreditsAdded: expectedBits,
        counterType: "bit",
      });
      if (definitionId === 331)
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          agendaPointCostPaid: 1,
        });
    }
  });

  it("uses P3.40 deck bits for allowed icebreaker and link-payment contexts only", () => {
    for (const [definitionId, expectedAfterPump] of [
      [331, 2],
      [334, 1],
      [349, 0],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-icebreaker-pay`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `p340_${definitionId}_icebreaker_runner`,
            name: `P3.40 ${definitionId} Icebreaker Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              { id: 591, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                (card) => card.id !== 591,
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `p340_${definitionId}_icebreaker_corp`,
            name: `P3.40 ${definitionId} Icebreaker Corp`,
            cards: [
              { id: 590, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      state.runner.memoryLimit = 4;
      const deckId = moveRunnerCardToGrip(state, definitionId);
      moveRunnerCardToGrip(state, 591);
      if (definitionId === 331)
        scoreRunnerAgendaForTest(state, 588);
      const iceId = putCorpIceOnServer(state, "rd", 590);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      installRunnerProgramForTest(state, 591);
      state.runner.credits = 0;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(
        state,
        "corp",
        (action) => action.type === "rez_ice" && action.source === iceId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) === 591,
      );
      expect(state.runner.credits).toBe(0);
      expect(cardCounterAmount(state, deckId, "bit")).toBe(expectedAfterPump);
    }

    for (const definitionId of [
      348,
      350,
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-link-pay`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.runner,
            id: `p340_${definitionId}_link_runner`,
            name: `P3.40 ${definitionId} Link Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
                (card) => card.id !== definitionId,
              ),
            ],
          },
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
      state.runner.credits = 20;
      state.corp.credits = 20;
      const deckId = moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      state.runner.credits = 0;
      putCorpIceOnServer(state, "rd", 458);
      state = encounterIce(state, "rd", 458);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = applyChoice(state, "corp", "bid_0");
      state = applyChoice(state, "runner", "bid_3");
      expect(cardCounterAmount(state, deckId, "bit")).toBe(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceLinkCreditsSpent: 3,
        runnerCreditsSpent: 0,
      });
    }

    let owlState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p340-owl-noisy-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p340_owl_noisy_runner",
          name: "P3.40 Owl Noisy Runner",
          cards: [
            { id: 353, quantity: 1 },
            { id: 248, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p340_owl_noisy_corp",
          name: "P3.40 Owl Noisy Corp",
          cards: [
            { id: 444, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 444,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    owlState.runner.credits = 30;
    owlState.runner.memoryLimit = 4;
    moveRunnerCardToGrip(owlState, 353);
    moveRunnerCardToGrip(owlState, 248);
    const wallId = putCorpIceOnServer(
      owlState,
      "rd",
      444,
    );
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(owlState, action) === 353,
    );
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(owlState, action) === 248,
    );
    owlState.runner.credits = 0;
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    owlState = apply(
      owlState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    expect(
      getLegalActions(owlState, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(owlState, action) === 248,
      ),
    ).toBe(false);
  });

  it("gates Roving Submarine runs by previous Corp activity and keeps region install public", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-roving-submarine-run-gate",
        baseline: CURRENT_RULES_BASELINE,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_roving_submarine_corp",
          name: "Spotcheck Roving Submarine Corp",
          cards: [
            { id: 594, quantity: 1 },
            { id: 580, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    moveCorpCardToHq(state, 580);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 580 &&
        action.payload?.serverId === "new_remote",
    );
    const rovingId = state.corp.servers
      .flatMap((server) => server.root)
      .find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          580,
      );
    expect(rovingId).toBeDefined();
    if (!rovingId) throw new Error("Missing Roving Submarine");
    const rovingServerId = state.corp.servers.find((server) =>
      server.root.includes(rovingId),
    )?.id;
    expect(rovingServerId).toBeDefined();
    expect(state.cardInstances[rovingId]?.rezzed).toBe(true);
    expect(
      state.corpTurnFlags?.fortActivityServerIdsSinceCorpTurnStart,
    ).toContain(rovingServerId);
    const lucidrineId = "spotcheck_roving_lucidrine";
    state.runner.maxHandSize = 100;
    state.runner.grip.unshift(lucidrineId);
    state.cardInstances[lucidrineId] = {
      id: lucidrineId,
      instanceId: lucidrineId,
      definitionId: 310,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    } as never;

    state = toRunnerTurnFromCorpMain(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            310 &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      state.corpTurnFlags?.fortActivityServerIdsSinceCorpTurnStart,
    ).toEqual([]);
    state = toRunnerTurnFromCorpMain(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            310 &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(false);
  });

  it("resolves Speed Trap as a root-rez interrupt and can end the run successful without access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-speed-trap-rez-interrupt",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_speed_trap_runner",
          name: "Spotcheck Speed Trap Runner",
          cards: [
            { id: 279, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_speed_trap_corp",
          name: "Spotcheck Speed Trap Corp",
          cards: [
            { id: 606, quantity: 1 },
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, 279);
    const upgradeId = putCorpRootInRemote(state, 606);
    putCorpIceOnServer(state, "r1", 589);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("run.movement_rez_window");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        action.payload?.rootRez === true &&
        action.payload?.cardId === upgradeId,
    );
    expect(state.pendingChoice?.source).toContain("rez_interrupt.jack_out");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_card",
      abilityId: "rez_interrupt_jack_out_choice",
      rezInterruptChoiceOpened: true,
      rezzedCardDefinitionId: 606,
    });

    state = applyChoice(state, "runner", "jack_out");
    expect(state.run).toBeUndefined();
    expect(state.phase).toBe("runner_action_phase");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      abilityId: "rez_interrupt_jack_out",
      rezInterruptUsed: true,
      successfulRunWithoutAccess: true,
      rezzedCardDefinitionId: 606,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("lets Speed Trap pass a root rez and then continue to normal access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-speed-trap-pass",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_speed_trap_pass_runner",
          name: "Spotcheck Speed Trap Pass Runner",
          cards: [
            { id: 279, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_speed_trap_pass_corp",
          name: "Spotcheck Speed Trap Pass Corp",
          cards: [
            { id: 606, quantity: 1 },
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, 279);
    const upgradeId = putCorpRootInRemote(state, 606);
    putCorpIceOnServer(state, "r1", 589);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        action.payload?.rootRez === true &&
        action.payload?.cardId === upgradeId,
    );
    state = applyChoice(state, "runner", "pass");
    expect(state.run).toBeDefined();
    expect(state.timingPoint).toBe("run.movement_rez_window");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "jack_out",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
    expect(state.eventLog.at(-2)?.publicPayload).toMatchObject({
      rezInterruptUsed: false,
      successfulRunWithoutAccess: false,
    });
  });

  it("charges printed ICE rez cost for Startup Immolator despite Skälderviken's Corp discount", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-startup-immolator-trash-ice",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_startup_immolator_runner",
          name: "Spotcheck Startup Immolator Runner",
          cards: [
            { id: 280, quantity: 1 },
            { id: 251, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_startup_immolator_corp",
          name: "Spotcheck Startup Immolator Corp",
          cards: [
            { id: 553, quantity: 1 },
            { id: 492, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 23;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, 251);
    const startupImmolatorId = installRunnerProgramForTest(
      state,
      280,
    );
    const nodeId = putCorpRootInRemote(
      state,
      553,
    );
    state.cardInstances[nodeId]!.rezzed = true;
    state.cardInstances[nodeId]!.faceup = true;
    const iceId = putCorpIceOnServer(state, "rd", 492);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    const isRunOnRd = (action: LegalAction) =>
      action.type === "start_run" && action.payload?.serverId === "rd";
    expect(mustAction(state, "runner", isRunOnRd).payload).not.toHaveProperty(
      "runnerPostBreakTrashQuoteJson",
    );
    state = apply(state, "runner", isRunOnRd);
    const rez = mustAction(state, "corp", (action) => action.type === "rez_ice");
    expect(rez.costs[0]?.credits).toBe(7);
    state = apply(state, "corp", (action) => action.actionId === rez.actionId);
    expect(state.corp.credits).toBe(3);
    const preRunWithRezzedIce = structuredClone(initial);
    preRunWithRezzedIce.cardInstances[iceId] = structuredClone(
      state.cardInstances[iceId]!,
    );
    const run = mustAction(preRunWithRezzedIce, "runner", isRunOnRd);
    expect(
      JSON.parse(String(run.payload?.runnerPostBreakTrashQuoteJson)),
    ).toMatchObject({
      targets: [{ targetIceInstanceId: iceId, trashCredits: 9 }],
    });
    state = passCorpApproachRezWindowIfOpen(state);
    for (const index of [0, 1, 2]) {
      state = breakCurrentSubroutine(state, 251, index);
    }
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.credits).toBe(9);
    const isStartupAction = (action: LegalAction) =>
      action.type === "trigger_ability" &&
      action.payload?.runnerUtilityAbility === "trash_fully_broken_passed_ice";
    const insufficientCredits = structuredClone(state);
    insufficientCredits.runner.credits = 8;
    expect(
      getLegalActions(insufficientCredits, "runner").some(isStartupAction),
    ).toBe(false);
    const startupAction = mustAction(state, "runner", isStartupAction);
    expect(startupAction.payload?.targetIceId).toBe(iceId);
    expect(startupAction.costs[0]?.credits).toBe(9);
    expect(startupAction.payload).toMatchObject({
      cardImplementationTrashSourceCost: true,
      targetRezCost: true,
    });

    state = apply(
      state,
      "runner",
      (action) => action.actionId === startupAction.actionId,
    );
    expect(state.corp.archives).toContain(iceId);
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).not.toContain(iceId);
    expect(state.runner.heap).toContain(startupImmolatorId);
    expect(state.runner.rig.programs).not.toContain(startupImmolatorId);
    expect(state.runner.credits).toBe(0);
    expect(getLegalActions(state, "runner").some(isStartupAction)).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      runnerUtilityAbility: "trash_fully_broken_passed_ice",
      abilityKind: "trash_fully_broken_passed_ice",
      rezCostPaid: 9,
      serverId: "rd",
      trashedCardDefinitionId: 492,
      trashedCount: 1,
      sourceTrashed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"(?:privatePayload|cardInstances|grip|hq|rd)":/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("lets the runner order any subset of simultaneously trashed programs on Microtech Backup Drive", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-microtech-backup-drive",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_microtech_backup_runner",
          name: "Spotcheck Microtech Backup Runner",
          cards: [
            { id: 281, quantity: 1 },
            { id: 248, quantity: 1 },
            { id: 343, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_microtech_backup_corp",
          name: "Spotcheck Microtech Backup Corp",
          cards: [
            { id: 445, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 343);
    moveRunnerCardToGrip(state, 281);
    moveRunnerCardToGrip(state, 248);
    moveRunnerCardToGrip(state, 597);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 343,
    );
    const microtechId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        343,
    );
    expect(microtechId).toBeDefined();
    if (!microtechId) throw new Error("Missing Microtech Backup Drive");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 281,
    );
    const succubusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 281,
    );
    expect(succubusId).toBeDefined();
    if (!succubusId) throw new Error("Missing Succubus");
    const hostedIds: CardInstanceId[] = [];
    for (const definitionId of [248, 597]) {
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId &&
          action.payload?.hostOnCardId === succubusId,
      );
      hostedIds.push(String(install.payload?.cardId ?? "") as CardInstanceId);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
    }
    expect(hostedIds).toHaveLength(2);
    const memoryBeforeTrash = state.runner.memoryUsed;
    putCorpIceOnServer(state, "rd", 445);
    putCorpCardOnTopOfRd(state, 596);
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
        sourceDefinition(state, action) === 445,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", `card_${succubusId}`);
    const backupReplacementId = state.pendingChoice?.options.find((option) =>
      option.id.startsWith("microtech_backup_drive_"),
    )?.id;
    expect(backupReplacementId).toBeDefined();
    state = applyChoice(state, "runner", backupReplacementId ?? "");
    expect(state.pendingChoice?.minSelections).toBe(0);
    expect(state.pendingChoice?.maxSelections).toBe(3);
    const backedUpIds = [hostedIds[0]!, succubusId];
    state = applyChoices(state, "runner", backedUpIds);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.heap).toContain(hostedIds[1]);
    for (const backedUpId of backedUpIds) {
      expect(state.runner.rig.programs).not.toContain(backedUpId);
      expect(state.specialZones?.setAside).toContain(backedUpId);
      expect(state.cardInstances[backedUpId]?.hostedOn).toBe(microtechId);
      expect(state.cardInstances[backedUpId]?.zone).toMatchObject({
        side: "special",
        zone: "set_aside",
        visibility: "public",
      });
    }
    expect(state.runner.memoryUsed).toBeLessThan(memoryBeforeTrash);

    const returnAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          343 &&
        action.payload?.cardImplementationAbilityKey ===
          "abilities_activated_runner_main_move_top_hosted_program_to_grip",
    );
    expect(returnAction.label).toBe(
      "Microtech Backup Drive: oberstes gesichertes Programm auf die Hand nehmen",
    );
    const returnedId = succubusId;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === returnAction.actionId,
    );
    expect(state.runner.grip).toContain(returnedId);
    expect(state.cardInstances[returnedId]?.hostedOn).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(returnedId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: 343,
      returnedToGrip: true,
      returnedCardDefinitionId: 281,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const remainingBackedUpId = hostedIds[0]!;
    trashRunnerInstalledCardToHeapForTest(state, microtechId);
    expect(state.runner.heap).toContain(microtechId);
    expect(state.runner.heap).toContain(remainingBackedUpId);
    expect(state.specialZones?.setAside).not.toContain(remainingBackedUpId);
    expect(state.cardInstances[remainingBackedUpId]?.hostedOn).toBeUndefined();
  });

  it("installs Newsgroup Filter and uses its side-safe credit action", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-newsgroup-filter-credit-action",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_newsgroup_filter",
          name: "O:NR V1.9.22 Newsgroup Filter",
          cards: [
            { id: 257, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    moveRunnerCardToGrip(state, 257);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 257,
    );
    expect(state.runner.credits).toBe(5);
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.memoryUsed).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === 257,
      ),
    ).toBe(true);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === action.source,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.cardImplementationAbility === "activated",
      ),
    ).toBe(false);
    expect(legal.payload).toMatchObject({
      cardId: legal.source,
      cardImplementationAbility: "activated",
      cardImplementationAbilityKey:
        "abilities_activated_runner_main_gain_credits",
      cardImplementationAbilityTiming: "runner_main",
    });
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-newsgroup-filter-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-newsgroup-filter-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === legal.source,
    );

    expect(state.runner.credits).toBe(7);
    expect(state.runner.clicks).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      amount: 2,
      cardDefinitionId: 257,
      cardImplementationAbility: "activated",
      sourceDefinitionId: 257,
      gainedCredits: 2,
      runnerCreditsAfter: 7,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 2,
          sourceDefinitionId: 257,
          sourceTitle: "Newsgroup Filter",
          reason: "card_resolver",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Shield and uses side-safe per-turn net damage prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-shield-prevention",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.runner,
          id: "onr_v1_runner_v1922_shield_prevention",
          name: "O:NR V1.9.22 Shield Prevention",
          cards: [
            { id: 273, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.damagePrevention.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.damagePrevention.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 273);

    const installLegal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 273,
    );
    const wrongSideInstall = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: installLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-shield-install-wrong-side",
    });
    expect(wrongSideInstall.ok).toBe(false);
    if (!wrongSideInstall.ok)
      expect(wrongSideInstall.error.code).toBe("ERR_WRONG_SIDE");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 273,
    );
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain(273);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === 273,
      ),
    ).toBe(true);

    putCorpIceOnServer(state, "rd", 470);
    putCorpCardOnTopOfRd(state, 588);
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
        sourceDefinition(state, action) === 470,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventionOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventionOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventionOptionId));
    expect(state.runner.heap.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Corporate Retreat until Corp installs or rezzes another card", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_scored_agenda_credit_until_install_or_rez",
      name: "O:NR V1.9.22 Corporate Retreat",
      cards: [
        { id: 407, quantity: 1 },
        { id: 589, quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-retreat",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 407);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 407 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 407,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 407,
    );
    const retreatView = getPlayerView(state, "corp").own.scoreArea.find(
      (visibleCard) =>
        visibleCard.definitionId === 407,
    );
    expect(retreatView?.counterDisplays).toContainEqual({
      id: "mark",
      amount: 1,
      displayKind: "generic_counter",
      label: "Mark-Counter",
      ariaLabel: "1 Mark-Counter",
      counterType: "mark",
      usageHint: "status_marker",
    });

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility ===
          "scored_agenda_credit_until_install_or_rez",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-retreat-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-retreat-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility ===
          "scored_agenda_credit_until_install_or_rez",
    );
    expect(state.corp.credits).toBe(creditsBeforeAbility + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: 407,
      abilityId: "scored_agenda_credit_until_install_or_rez",
      gainedCredits: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    moveCorpCardToHq(state, 589);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 589,
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.agendaAbility ===
          "scored_agenda_credit_until_install_or_rez",
      ),
    ).toBe(false);

    let rezState = createGameAfterSetup({
      seed: "v1922-corporate-retreat-rez-lock",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    rezState = apply(
      rezState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rezState.corp.credits = 40;
    rezState.corp.clicks = 40;
    rezState.corp.maxHandSize = 100;
    moveCorpCardToHq(rezState, 407);
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(rezState, action) === 407 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      rezState = apply(
        rezState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(rezState, action) === 407,
      );
    }
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(rezState, action) === 407,
    );
    const rezRetreatId = rezState.corp.scoreArea.find(
      (cardId) =>
        rezState.cardInstances[cardId]?.definitionId ===
        407,
    );
    expect(rezRetreatId).toBeDefined();
    putCorpIceOnServer(rezState, "rd", 589);
    rezState = apply(rezState, "corp", (action) => action.type === "end_turn");
    rezState = apply(
      rezState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(rezState, action) === 589,
    );
    if (rezRetreatId)
      expect(
        rezState.cardInstances[rezRetreatId]?.counters?.mark,
      ).toBeUndefined();
  });

  it("scores Data Fort Reclamation as a private ordered HQ install and rez sequence", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_hq_to_new_remote_install_rez",
      name: "O:NR V1.9.22 Data Fort Reclamation",
      cards: [
        { id: 409, quantity: 1 },
        { id: 589, quantity: 1 },
        { id: 520, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-data-fort-reclamation",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 409);
    const iceId = moveCorpCardToHq(state, 589);
    const assetId = moveCorpCardToHq(state, 520);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          409 &&
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
            409,
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 409,
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 4,
    });
    const legal = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-choice-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-choice-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoices(state, "corp", [`card_${iceId}`, `card_${assetId}`]);

    const remote = state.corp.servers.find(
      (server) => server.kind === "remote" && server.ice.includes(iceId),
    );
    expect(remote).toBeDefined();
    expect(state.cardInstances[iceId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverIce",
      serverId: remote?.id,
    });
    expect(state.cardInstances[assetId]?.zone).toMatchObject({
      side: "corp",
      zone: "hq",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_to_new_remote_install_sequence",
      selectedCount: 2,
      installedCount: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 0,
      temporaryCreditsRemaining: 10,
      hqToNewRemoteInstallRezRezChoiceOpened: true,
      hqToNewRemoteInstallRezRezCandidateCount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"|ACME/,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 1,
    });
    const corpRezChoice = getPlayerView(state, "corp").pendingChoice;
    const runnerRezView = getPlayerView(state, "runner");
    const rezOption = corpRezChoice?.options[0];
    expect(rezOption?.card).toMatchObject({
      instanceId: iceId,
      definitionId: 589,
      known: true,
    });
    expect(rezOption?.hqInstallRezOptionQuote).toMatchObject({
      schemaVersion: "corp-optional-rez-choice-quote-v2",
      kind: "optional_rez_installed_corp_card_with_temporary_credits",
      context: "hq_to_new_remote_optional_rez",
      choiceId: corpRezChoice?.choiceId,
      optionId: `card_${iceId}`,
      sourceAgendaId: expect.any(String),
      cardId: iceId,
      cardDefinitionId: 589,
      targetServerId: remote?.id,
      installedZone: "serverIce",
      sequencePosition: 1,
      stateVersion: state.stateVersion,
      complete: true,
      cardType: "ice",
      baseCredits: 3,
      finalCredits: 3,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      temporaryCreditsAvailable: 10,
      temporaryCreditsApplied: 3,
      regularCreditsAvailable: state.corp.credits,
      regularCreditsRequired: 0,
      creditPayable: true,
      additionalCostsPayable: true,
      affordable: true,
      mandatoryContinuationComplete: true,
      rezAndMandatoryContinuationExecutable: true,
    });
    expect(runnerRezView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerRezView)).not.toContain(
      "corp-optional-rez-choice-quote-v2",
    );
    expect(JSON.stringify(state.pendingChoice)).not.toContain(
      "hqInstallRezOptionQuote",
    );
    const rezChoice = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongRezSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezChoice.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-rez-choice-wrong-side",
    });
    expect(wrongRezSide.ok).toBe(false);
    if (!wrongRezSide.ok)
      expect(wrongRezSide.error.code).toBe("ERR_WRONG_SIDE");

    state = applyChoices(state, "corp", [`card_${iceId}`]);
    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.cardInstances[assetId]?.rezzed).toBe(false);
    expect(state.cardInstances[assetId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverRoot",
      serverId: remote?.id,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_to_new_remote_rez_sequence",
      selectedCount: 2,
      rezzedCount: 1,
      rezzedIceCount: 1,
      rezzedRootCount: 0,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 3,
      temporaryCreditsRemaining: 7,
      corpCreditsSpent: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"|ACME/,
    );
    const assetRezOption = getPlayerView(state, "corp").pendingChoice
      ?.options[0];
    expect(assetRezOption?.card).toMatchObject({
      instanceId: assetId,
      definitionId: 520,
      known: true,
    });
    expect(assetRezOption?.hqInstallRezOptionQuote).toMatchObject({
      sourceAgendaId: "c2j1",
      cardId: assetId,
      cardDefinitionId: 520,
      targetServerId: remote?.id,
      installedZone: "serverRoot",
      sequencePosition: 2,
      stateVersion: state.stateVersion,
      complete: true,
      cardType: "asset",
      baseCredits: 0,
      finalCredits: 0,
      mandatoryAdditionalCosts: { agendaPoints: 1 },
      temporaryCreditsAvailable: 7,
      temporaryCreditsApplied: 0,
      regularCreditsAvailable: state.corp.credits,
      regularCreditsRequired: 0,
      creditPayable: true,
      additionalCostsPayable: true,
      affordable: true,
    });
    const creditsBeforeAcmeRez = state.corp.credits;
    state = applyChoices(state, "corp", [`card_${assetId}`]);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.hqInstallRezSequence).toBeUndefined();
    expect(state.cardInstances[assetId]?.zone).toMatchObject({
      side: "corp",
      zone: "archives",
    });
    expect(state.corp.credits).toBe(creditsBeforeAcmeRez + 12);
    expect(state.activeObligationDebtCount).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "hq_to_new_remote_rez_sequence",
      selectedCount: 2,
      installedCount: 2,
      rezzedCount: 1,
      rezzedRootCount: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 3,
      temporaryCreditsRemaining: 7,
      temporaryCreditsReturned: 7,
      corpCreditsSpent: 0,
      agendaPointCost: 1,
      agendaPointCostPaid: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("scores Corporate War through a deterministic on-score credit threshold resolver", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_corporate_war",
      name: "O:NR V1.9.22 Corporate War",
      cards: [
        { id: 408, quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 408);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 408 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 408,
      );
    }

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 408,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-war-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-war-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeScore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 408,
    );
    expect(state.corp.credits).toBe(creditsBeforeScore + 12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: 408,
      scoreCreditSwingThresholdMet: true,
      onScoreGainCredits: 12,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 12,
          reason: "card_resolver",
          sourceDefinitionId: 408,
          sourceTitle: "Corporate War",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let missState = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold-miss",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    missState = apply(
      missState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    missState.corp.credits = 5;
    missState.corp.clicks = 20;
    moveCorpCardToHq(missState, 408);
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(missState, action) === 408,
    );
    for (let index = 0; index < 3; index += 1) {
      missState = apply(
        missState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(missState, action) === 408,
      );
    }
    expect(missState.corp.credits).toBeLessThan(12);
    for (const credits of [1, 3]) {
      const orderingStart = structuredClone(missState);
      orderingStart.corp.credits = credits;
      orderingStart.corp.clicks = 2;
      const eventOffset = orderingStart.eventLog.length;
      let creditFirst = apply(
        structuredClone(orderingStart),
        "corp",
        (a) => a.type === "gain_credit",
      );
      creditFirst = apply(
        creditFirst,
        "corp",
        (a) => a.type === "score_agenda",
      );
      creditFirst = apply(creditFirst, "corp", (a) => a.type === "gain_credit");
      let scoreFirst = apply(
        structuredClone(orderingStart),
        "corp",
        (a) => a.type === "score_agenda",
      );
      scoreFirst = apply(scoreFirst, "corp", (a) => a.type === "gain_credit");
      scoreFirst = apply(scoreFirst, "corp", (a) => a.type === "gain_credit");
      expect(creditFirst.corp.credits).toBe(1);
      expect(scoreFirst.corp.credits).toBe(2);
      expect(scoreFirst.corp.clicks).toBe(creditFirst.corp.clicks);
      expect(scoreFirst.corp.scoreArea).toEqual(creditFirst.corp.scoreArea);
      const reorderedReplay = replayEvents(
        orderingStart,
        scoreFirst.eventLog.slice(eventOffset),
      );
      expect(reorderedReplay.ok).toBe(true);
      expect(hashState(reorderedReplay.state)).toBe(hashState(scoreFirst));
    }
    const missCreditsBeforeScore = missState.corp.credits;
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(missState, action) === 408,
    );
    expect(missState.corp.credits).toBe(0);
    expect(missState.eventLog.at(-1)?.publicPayload).toMatchObject({
      scoreCreditSwingThresholdMet: false,
      onScoreLostAllCredits: true,
      resolvedEffects: [
        expect.objectContaining({
          kind: "lose_credits",
          side: "corp",
          amount: missCreditsBeforeScore,
          reason: "card_resolver",
          sourceDefinitionId: 408,
          sourceTitle: "Corporate War",
        }),
      ],
    });
  });

  it("scores Corporate Boon with Boon counters and spends one per turn for an action", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1922-corporate-boon-card-implementation",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "v1922_corporate_boon_corp",
          name: "O:NR V1.9.22 Corporate Boon",
        },
        agendaPointsToWin: 99,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    const agendaId = putCorpRootInRemote(state, 404);
    state.cardInstances[agendaId]!.advancementCounters = 6;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
    );

    expect(state.cardInstances[agendaId]?.counters?.boon).toBe(4);
    const clicksBefore = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === agendaId &&
        action.payload?.cardImplementationSourceCounterType === "boon",
    );
    expect(state.cardInstances[agendaId]?.counters?.boon).toBe(3);
    expect(state.corp.clicks).toBe(clicksBefore + 1);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === agendaId,
      ),
    ).toBe(false);
  });

  it("scores Security Purge as a side-safe R&D top-three install and trash resolver", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_agenda_purge",
      name: "O:NR V1.9.22 Security Purge",
      cards: [
        { id: 428, quantity: 1 },
        { id: 589, quantity: 1 },
        { id: 590, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-security-purge",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    state.poxCountersByServer = { rd: 2 };

    moveCorpCardToHq(state, 428);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 428 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 428,
      );
    }
    const trashedOperationId = putCorpCardOnTopOfRd(
      state,
      596,
    );
    const installedCodeGateId = putCorpCardOnTopOfRd(
      state,
      590,
    );
    const installedBarrierId = putCorpCardOnTopOfRd(
      state,
      589,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 428,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-security-purge-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-security-purge-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 428,
    );

    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "public",
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(
      runnerChoice?.options.filter((option) => option.selectable === false),
    ).toHaveLength(3);
    expect(
      runnerChoice?.options
        .filter((option) => option.selectable === false)
        .map((option) => option.card?.definitionId),
    ).toEqual([
      589,
      590,
      596,
    ]);
    expect(
      runnerChoice?.options.find((option) => option.id === "done"),
    ).toMatchObject({ label: "Ansehen beenden", value: "done" });
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedBarrierId),
      ),
    ).toBe(false);
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedCodeGateId),
      ),
    ).toBe(false);
    expect(state.corp.archives).not.toContain(trashedOperationId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: 428,
      abilityId: "agenda_purge",
      hiddenZoneAction: "agenda_purge_runner_review",
      revealedCount: 3,
      revealedIceCount: 2,
      pendingTrashCount: 1,
      installedIceCount: 0,
      trashedCount: 0,
      agendaPurgeInstallContract: "corp_server_choice_per_ice",
      agendaPurgeRunnerReviewOpened: true,
      agendaPurgeTargetChoiceOpened: false,
      publicRevealDefinitionIds:
        "589,590,596",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const reviewLegal = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const wrongSideReview = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: reviewLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-review-wrong-side",
    });
    expect(wrongSideReview.ok).toBe(false);
    if (!wrongSideReview.ok)
      expect(wrongSideReview.error.code).toBe("ERR_UNKNOWN_ACTION");

    const staleReview = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: reviewLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-review-stale",
    });
    expect(staleReview.ok).toBe(false);
    if (!staleReview.ok) expect(staleReview.error.code).toBe("ERR_STALE_STATE");

    state = applyChoices(state, "runner", ["done"]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      actor: "runner",
      abilityId: "agenda_purge",
      hiddenZoneAction: "agenda_purge_runner_review_completed",
      agendaPurgeRunnerReviewResolved: true,
      agendaPurgeTargetChoiceOpened: true,
      installedIceCount: 0,
      trashedCount: 0,
      publicRevealDefinitionIds:
        "589,590,596",
    });
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_option",
      minSelections: 2,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
    });
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    expect(
      corpChoice?.options.filter((option) => option.selectable === false),
    ).toHaveLength(3);
    expect(
      corpChoice?.options.filter((option) => option.selectable !== false)
        .length,
    ).toBe(8);
    expect(
      corpChoice?.options
        .filter((option) => option.selectable !== false)
        .every((option) => option.card?.type === "ice"),
    ).toBe(true);

    const resolveLegal = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongSideResolve = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-resolve-wrong-side",
    });
    expect(wrongSideResolve.ok).toBe(false);
    if (!wrongSideResolve.ok)
      expect(wrongSideResolve.error.code).toBe("ERR_WRONG_SIDE");

    const staleResolve = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolveLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-resolve-stale",
    });
    expect(staleResolve.ok).toBe(false);
    if (!staleResolve.ok)
      expect(staleResolve.error.code).toBe("ERR_STALE_STATE");

    const rdOption = state.pendingChoice?.options.find(
      (option) => option.value === `${installedBarrierId}|rd|fixed`,
    );
    const newRemoteOption = state.pendingChoice?.options.find(
      (option) => option.value === `${installedCodeGateId}|new_remote|fixed`,
    );
    expect(rdOption).toBeDefined();
    expect(newRemoteOption).toBeDefined();
    const creditsBeforePurgeResolution = state.corp.credits;
    state = applyChoices(state, "corp", [rdOption!.id, newRemoteOption!.id]);

    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedBarrierId),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedCodeGateId),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toContain(installedBarrierId);
    const createdRemote = state.corp.servers.find(
      (server) =>
        server.kind === "remote" && server.ice.includes(installedCodeGateId),
    );
    expect(createdRemote).toBeDefined();
    expect(state.cardInstances[installedBarrierId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    });
    expect(state.cardInstances[installedCodeGateId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: {
        side: "corp",
        zone: "serverIce",
        serverId: createdRemote?.id,
      },
    });
    expect(state.corp.credits).toBe(creditsBeforePurgeResolution - 1);
    expect(state.corp.archives).toContain(trashedOperationId);
    expect(state.cardInstances[trashedOperationId]).toMatchObject({
      faceup: true,
      zone: { side: "corp", zone: "archives" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      abilityId: "agenda_purge",
      hiddenZoneAction: "agenda_purge_install_targets",
      effectDrivenAdditionalInstallCreditsPaid: 1,
      effectDrivenAdditionalRezCreditsPaid: 0,
      revealedCount: 3,
      revealedIceCount: 2,
      installedIceCount: 2,
      trashedCount: 1,
      agendaPurgeInstallContract: "corp_server_choice_per_ice",
      agendaPurgeTargetChoiceResolved: true,
      publicRevealDefinitionIds:
        "589,590,596",
      installedIceDefinitionIds: "589,590",
      installedIceServerLabels: `R&D,${createdRemote?.label}`,
      trashedDefinitionIds: "596",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Political Overthrow as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_political_overthrow",
      name: "O:NR V1.9.22 Political Overthrow",
      cards: [
        { id: 422, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-political-overthrow",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 422);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 422 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 9; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 422,
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) === 422,
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 422,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 422,
    );
    expect(legal.costs).toEqual([{ clicks: 1 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-political-overthrow-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-political-overthrow-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 422,
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 422,
      cardImplementationAbility: "activated",
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 422,
          sourceTitle: "Political Overthrow",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Marine Arcology as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_marine_arcology",
      name: "O:NR V1.9.22 Marine Arcology",
      cards: [
        { id: 418, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-marine-arcology",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, 418);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 418 &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === 418,
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) === 418,
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === 418,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 418,
    );
    expect(legal.costs).toEqual([{ clicks: 2 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-marine-arcology-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-marine-arcology-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const lowClicks = structuredClone(state);
    lowClicks.corp.clicks = 1;
    const lowClickResult = applyAction(lowClicks, {
      matchId: lowClicks.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: lowClicks.stateVersion,
      idempotencyKey: "v1922-marine-arcology-low-clicks",
    });
    expect(lowClickResult.ok).toBe(false);
    expect(lowClicks.corp.credits).toBe(state.corp.credits);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 418,
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 418,
      cardImplementationAbility: "activated",
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 418,
          sourceTitle: "Marine Arcology",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Off-Site Backups as a private Archives-to-HQ choice", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_off_site_backups",
      name: "O:NR V1.9.22 Off-Site Backups",
      cards: [
        { id: 508, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-off-site-backups",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 508);
    const faceupArchiveId = moveCorpCardToArchives(
      state,
      596,
      true,
    );
    const facedownArchiveId = moveCorpCardToArchives(
      state,
      588,
      false,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 508,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-off-site-backups-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-off-site-backups-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 508,
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: 508,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Off-Site Backups choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === facedownArchiveId,
    );
    expect(selectedOption).toBeDefined();
    if (!selectedOption) throw new Error("Missing facedown archive option");
    state = applyChoices(state, "corp", [selectedOption.id]);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.hq[0]).toBe(facedownArchiveId);
    expect(state.corp.archives).toContain(faceupArchiveId);
    expect(state.corp.archives).not.toContain(facedownArchiveId);
    expect(state.corp.archives).toHaveLength(2);
    expect(state.cardInstances[facedownArchiveId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Planning Consultants as a private R&D top-five reorder choice", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_planning_consultants",
      name: "O:NR V1.9.22 Planning Consultants",
      cards: [
        { id: 510, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-planning-consultants",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 510);
    putCorpCardOnTopOfRd(state, 596);
    putCorpCardOnTopOfRd(state, 588);
    putCorpCardOnTopOfRd(state, 444);
    putCorpCardOnTopOfRd(state, 417);
    putCorpCardOnTopOfRd(state, 536);

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 510,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-planning-consultants-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-planning-consultants-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 510,
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: 510,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Planning Consultants choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const expectedTop = selectedOptionIds.map((optionId) =>
      String(
        pendingChoice.options.find((option) => option.id === optionId)?.value,
      ),
    );
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.rd.slice(0, expectedTop.length)).toEqual(expectedTop);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it.each([0, 1])(
    "keeps Planning Consultants legal with %i card in R&D",
    (rdCardCount) => {
      const corpDeck: DeckDefinition = {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: `onr_v1_corp_v1922_planning_consultants_${rdCardCount}`,
        name: `O:NR V1.9.22 Planning Consultants ${rdCardCount}`,
        cards: [
          { id: 510, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      };
      let state = createGameAfterSetup({
        seed: `v1922-planning-consultants-${rdCardCount}`,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      });
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      const operationId = moveCorpCardToHq(
        state,
        510,
      );
      const movedToArchives = state.corp.rd.slice(rdCardCount);
      state.corp.rd = state.corp.rd.slice(0, rdCardCount);
      state.corp.archives.push(...movedToArchives);
      for (const cardId of movedToArchives) {
        const instance = state.cardInstances[cardId];
        if (instance) instance.zone = { side: "corp", zone: "archives" };
      }

      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "play_operation" && action.source === operationId,
      );

      expect(state.pendingChoice).toBeUndefined();
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_corp_rd_reorder_top5",
        arrangedCount: rdCardCount,
        reorderNoOp: true,
      });
    },
  );

  it("allows Falsified-Transactions Expert to move zero counters", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_falsified_transactions_zero",
      name: "O:NR V1.9.22 Falsified Transactions Zero",
      cards: [
        { id: 503, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-falsified-transactions-zero",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const operationId = moveCorpCardToHq(
      state,
      503,
    );
    keepOnlyCorpHqCard(state, operationId);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" && action.source === operationId,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.options).toEqual([
      expect.objectContaining({
        id: "move_no_advancement_counters",
        value: "none|none|0",
      }),
    ]);
    state = applyChoice(state, "corp", "move_no_advancement_counters");

    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      advancementCountersMoved: 0,
      movedAdvancementCounters: 0,
    });
  });

  it("plays Edgerunner, Inc., Temps as a consecutive Corp install-only action bundle", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_edgerunner_temps",
      name: "O:NR V1.9.22 Edgerunner Temps",
      cards: [
        { id: 501, quantity: 1 },
        { id: 589, quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-edgerunner-temps",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, 501);
    const iceId = moveCorpCardToHq(state, 589);

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 501,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-edgerunner-temps-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-edgerunner-temps-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 501,
    );
    expect(state.corp.clicks).toBe(12);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(3);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toMatchObject({
      side: "corp",
      sourceDefinitionId: 501,
      actionType: "install_card",
      remainingActions: 3,
      costProfile: "extra_click",
      cleanupTiming: "side_turn_end",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: 501,
      abilityId: "install_action_bundle",
      gainedActions: 3,
      edgerunnerTempsInstallActionsRemaining: 3,
      corpClicksAfter: 12,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const bundleActions = getLegalActions(state, "corp");
    expect(
      bundleActions.some(
        (action) => action.type === "install_card" && action.source === iceId,
      ),
    ).toBe(true);
    expect(
      bundleActions.every(
        (action) =>
          action.type === "install_card" ||
          action.type === "end_turn" ||
          action.payload?.actionEconomyAbility ===
            "decline_edgerunner_temps_install_actions",
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "play_operation" ||
          action.type === "advance_card",
      ),
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.placement === "ice",
    );
    expect(
      state.corp.servers.some((server) => server.ice.includes(iceId)),
    ).toBe(true);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(2);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toMatchObject({ remainingActions: 2 });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      abilityId: "install_action_bundle",
      edgerunnerTempsInstallActionSpent: true,
      edgerunnerTempsInstallActionsRemaining: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.payload?.actionEconomyAbility ===
        "decline_edgerunner_temps_install_actions",
    );
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(0);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toBeUndefined();
    expect(state.corp.clicks).toBe(9);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "gain_credit",
      ),
    ).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("converts all three unused Edgerunner Temps actions into a virus purge", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_edgerunner_temps_purge",
      name: "O:NR V1.9.22 Edgerunner Temps Purge",
      cards: [
        { id: 501, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-edgerunner-temps-purge",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const operationId = moveCorpCardToHq(
      state,
      501,
    );
    keepOnlyCorpHqCard(state, operationId);
    const runnerCardId = Object.keys(state.cardInstances).find(
      (cardId) => state.cardInstances[cardId]?.owner === "runner",
    );
    if (!runnerCardId) throw new Error("Missing runner virus-counter target");
    setCardCounterForTest(state, runnerCardId, "virus", 2);
    state.corp.clicks = 1;

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "play_operation" && action.source === operationId,
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" && action.source === operationId,
    );
    const purge = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "purge_virus_counters" &&
        action.payload?.v1922EdgerunnerTempsPurgeAction === true,
    );
    expect(purge.payload).toMatchObject({
      actionCapacityRestriction: "forfeit_all_three_for_purge",
      actionCapacityAllowedActionType: "purge_virus_counters",
    });
    state = apply(
      state,
      "corp",
      (action) => action.actionId === purge.actionId,
    );

    expect(cardCounterAmount(state, runnerCardId, "virus")).toBe(0);
    expect(state.corp.clicks).toBe(0);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(0);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toBeUndefined();
    expect(validateGameState(state).ok).toBe(true);
  });

  it("rezzes Zombie as core-damage ICE with replay-stable public run resolution", () => {
    expect(CARD_DEFINITIONS_BY_ID[492]?.subtypes).toEqual([
      "black ice",
      "sentry",
    ]);
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zombie",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zombie",
          name: "O:NR V1.9.22 Zombie Corp",
          cards: [
            { id: 492, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 20;
    state.runner.credits = 5;
    const iceId = putCorpIceOnServer(state, "rd", 492);
    putCorpCardOnTopOfRd(state, 596);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezLegal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === 492,
    );
    expect(rezLegal.costs[0]?.credits).toBe(9);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zombie-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zombie-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Tutor and adds a breakable end-the-run subroutine to later ice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-tutor-future-etr",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_tutor_hammer",
          name: "O:NR V1.9.22 Tutor Hammer Runner",
          cards: [
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_tutor",
          name: "O:NR V1.9.22 Tutor Corp",
          cards: [
            { id: 486, quantity: 1 },
            { id: 491, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 243);
    const wallId = putCorpIceOnServer(state, "rd", 491);
    const tutorId = putCorpIceOnServer(state, "rd", 486);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 243,
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 243,
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

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
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.runDurationAdditionalSubroutineModifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: tutorId,
        sourceDefinitionId: 486,
        subroutineKind: "end_the_run",
        append: "after_existing",
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      abilityId: "tutor_future_end_the_run_subroutine",
      sourceDefinitionId: 486,
      resolvedEffects: [
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: 486,
          sourceTitle: "Tutor",
          subroutineIndex: 0,
          subroutineType: "set_run_future_end_the_run_subroutine",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunAction(state);

    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    state = enterEncounterFromMovementWindow(state);
    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 243,
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0, 1]);
    const tutorEtr = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 243 &&
        action.payload?.subroutineIndex === 1,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-tutor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-tutor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === tutorEtr.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 243,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Virizz and applies a rest-of-run break-cost modifier without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-virizz-break-cost-modifier",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_virizz_hammer",
          name: "O:NR V1.9.22 Virizz Hammer Runner",
          cards: [
            { id: 243, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_virizz",
          name: "O:NR V1.9.22 Virizz Corp",
          cards: [
            { id: 489, quantity: 1 },
            { id: 491, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 243);
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      491,
    );
    const virizzId = putCorpIceOnServer(state, "rd", 489);
    putCorpCardOnTopOfRd(state, 596);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 243,
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 243,
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

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
      (action) => action.type === "rez_ice" && action.source === virizzId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.breakSubroutineAdditionalCost).toBe(1);
    const virizzModifierState = structuredClone(state);
    const virizzModifierHash = hashState(state);
    const virizzModifiers = collectActiveModifiers(state);
    expect(state).toEqual(virizzModifierState);
    expect(hashState(state)).toBe(virizzModifierHash);
    expect(
      virizzModifiers.filter(
        (modifier) => modifier.kind === "break_subroutine_cost",
      ),
    ).toEqual([
      expect.objectContaining({
        sourceDefinitionId: 489,
        kind: "break_subroutine_cost",
        side: "runner",
        amount: 1,
        duration: "run",
        target: { kind: "run" },
        visibility: "public",
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      abilityId: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      sourceDefinitionId: 489,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunAction(state);

    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === innerWallId,
    );
    state = enterEncounterFromMovementWindow(state);
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 243 &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(2);
    expect(legal.payload).toMatchObject({
      breakSubroutineBaseCost: 1,
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
      v1922CorpIceAbility: "virizz_break_cost_modifier",
    });
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-virizz-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-virizz-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.runner.credits).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 243,
      abilityId: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      collectActiveModifiers(state).some(
        (modifier) => modifier.kind === "break_subroutine_cost",
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Haunting Inquisition and locks normal runs for the next six Runner actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-haunting-inquisition-run-lock",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_haunting",
          name: "O:NR V1.9.22 Haunting Runner",
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_haunting",
          name: "O:NR V1.9.22 Haunting Corp",
          cards: [
            { id: 459, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    keepOnlyCorpHqCards(state, []);
    const hauntingId = putCorpIceOnServer(
      state,
      "rd",
      459,
    );

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
      (action) => action.type === "rez_ice" && action.source === hauntingId,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-haunting-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-haunting-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      abilityId: "direct_run_lock",
      runLockActionsAdded: 6,
      runLockActionsPending: 6,
      sourceDefinitionId: 459,
    });
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: 459,
          subroutineIndex: 0,
          subroutineType: "set_runner_run_lock_actions",
          amount: 6,
        }),
      ]),
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);

    for (let index = 0; index < 3; index += 1) {
      state = apply(state, "runner", (action) => action.type === "gain_credit");
    }
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(3);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(3);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);

    for (let index = 0; index < 3; index += 1) {
      state = apply(state, "runner", (action) => action.type === "gain_credit");
    }
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(0);
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

  it("rezzes Active ICE Program Trash and gates pass-ice program trash behind a paid jack-out window", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-viral-15-program-trash",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_viral_15",
          name: "O:NR V1.9.22 Active ICE Program Trash Corp",
          cards: [
            { id: 488, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, 597);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 597,
    );
    const programId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 597,
    );
    expect(programId).toBeDefined();
    if (!programId) throw new Error("Missing installed program");
    const viralId = putCorpIceOnServer(state, "rd", 488);
    putCorpCardOnTopOfRd(state, 596);

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
      (action) => action.type === "rez_ice" && action.source === viralId,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-viral-15-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-viral-15-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run?.passRezzedIceProgramTrashModifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: viralId,
        sourceDefinitionId: 488,
      }),
    ]);
    expect(state.run?.passRezzedIceProgramTrashPending).toEqual({
      passedIceId: viralId,
      remainingModifierIds: [expect.any(String)],
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      jackOutAdditionalCost: 1,
      sourceDefinitionId: 488,
      passIceTrashProgramPrompt: true,
    });

    const jackOut = mustAction(
      state,
      "runner",
      (action) => action.type === "jack_out",
    );
    expect(jackOut.costs[0]?.credits).toBe(1);
    const jackOutBranch = apply(
      state,
      "runner",
      (action) => action.actionId === jackOut.actionId,
    );
    expect(jackOutBranch.run).toBeUndefined();
    expect(jackOutBranch.runner.rig.programs).toContain(programId);
    expect(jackOutBranch.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "jack_out",
      jackOutAdditionalCost: 1,
      runnerCreditsAfter: state.runner.credits - 1,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.pendingChoice?.source).toContain(
      "p3_56.pass_ice_program_trash",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").pendingChoice?.options).toHaveLength(
      1,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      hiddenZoneBarrier: true,
      passIceTrashProgramPrompt: true,
      passIceTrashProgramCandidateCount: 1,
    });

    state = applyChoice(state, "runner", `card_${programId}`);
    expect(state.runner.heap).toContain(programId);
    expect(state.runner.rig.programs).not.toContain(programId);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      passIceTrashProgramPrompt: false,
      programTrashCount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("preserves Krash and Cyfermaster when Runner pays Active ICE Program Trash jack-out on R&D after Tutor", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-viral-15-rd-tutor-jack-out",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_viral_15_krash_cyfermaster",
          name: "O:NR V1.9.22 Active ICE Program Trash Krash Cyfermaster Runner",
          cards: [
            { id: 251, quantity: 1 },
            { id: 228, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_viral_15_tutor_rd",
          name: "O:NR V1.9.22 Active ICE Program Trash Tutor R&D Corp",
          cards: [
            { id: 486, quantity: 1 },
            { id: 488, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 7;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    const krashId = installRunnerProgramForTest(state, 251);
    const cyfermasterId = installRunnerProgramForTest(
      state,
      228,
    );
    const viralId = putCorpIceOnServer(state, "rd", 488);
    const tutorId = putCorpIceOnServer(state, "rd", 486);
    putCorpCardOnTopOfRd(state, 596);

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
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 228,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = continueRunAction(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === viralId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const jackOut = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "jack_out" &&
        action.payload?.v1922CorpIceAbility ===
          "jack_out_tax_after_passed_rezzed_ice",
    );
    expect(jackOut.costs[0]?.credits).toBe(1);
    expect(state.runner.credits).toBe(5);
    expect(state.runner.rig.programs).toEqual(
      expect.arrayContaining([krashId, cyfermasterId]),
    );

    state = apply(
      state,
      "runner",
      (action) => action.actionId === jackOut.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runner.credits).toBe(4);
    expect(state.runner.rig.programs).toEqual(
      expect.arrayContaining([krashId, cyfermasterId]),
    );
    expect(state.runner.heap).not.toContain(krashId);
    expect(state.runner.heap).not.toContain(cyfermasterId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "jack_out",
      abilityId: "jack_out_tax_after_passed_rezzed_ice",
      jackOutAdditionalCost: 1,
      runnerCreditsAfter: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps V1.9.22 Corp longtail runtime WIPs out of release promotion until gates close", () => {
    const corpLongtailIds = [488] as const;

    for (const definitionId of corpLongtailIds) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.implementationStatus,
        String(definitionId),
      ).toBe("playable_mvp");
    }
    for (const definitionId of [
      407,
      408,
      409,
      418,
      422,
      428,
      459,
      492,
      486,
      489,
      501,
      508,
      510,
    ] as const) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.implementationStatus,
        String(definitionId),
      ).toBe("playable_mvp");
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.rulesText,
        String(definitionId),
      ).not.toContain("WIP");
      const mechanics = CARD_DEFINITIONS_BY_ID[definitionId]?.mechanics ?? [];
      if (CARD_SPEC_RUNTIME_DEFINITION_IDS.has(definitionId)) {
        expect(mechanics.length, String(definitionId)).toBeGreaterThan(0);
        expect(mechanics, String(definitionId)).not.toContain("per_card_longtail");
      } else expect(mechanics, String(definitionId)).toContain("per_card_longtail");
    }
  });
});
