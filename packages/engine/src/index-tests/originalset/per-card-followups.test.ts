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
  createMechanicFixtureGameAfterSetup,
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

describe("Originalset Spotcheck 2026-05-15 Ramming/Galveston Nachtest", () => {
  it("projects the audited CardSpec text, characteristics, and shared counter scopes without phantom fields", () => {
    expect(CARD_DEFINITIONS_BY_ID[213]?.rulesText).toContain(
      "All icebreakers hosted on Afreet have their strength reduced by 1.",
    );
    expect(CARD_DEFINITIONS_BY_ID[213]?.rulesText).toContain(
      "If Afreet leaves play, trash all programs hosted on it.",
    );

    for (const definitionId of [
      214,
      220,
    ] as const) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.recurringCredits,
      ).toBeUndefined();
    }

    expect(
      CARD_DEFINITIONS_BY_ID[216]?.baseLink,
    ).toBeUndefined();
    expect(
      cardImplementationForDefinitionId(216)?.abilities,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          timing: "trace_base_link_window",
          effects: expect.arrayContaining([
            expect.objectContaining({ kind: "use_base_link", baseLink: 3 }),
          ]),
        }),
      ]),
    );

    for (const definitionId of [
      220,
      221,
      222,
      225,
      229,
      241,
      246,
      276,
    ] as const)
      expect(
        cardImplementationForDefinitionId(definitionId)?.virusCounter
          ?.addOnSuccessfulRun?.counterScope,
      ).toEqual({ kind: "shared_corp_pool" });
  });

  it("does not create or refresh recurring credits for AI Boon or Boardwalk", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "audit-no-phantom-recurring",
        runnerDeck: {
          id: "audit_no_phantom_recurring_runner",
          name: "Audit no phantom recurring Runner",
          side: "runner",
          identity: 587,
          cards: [
            { id: 214, quantity: 1 },
            { id: 220, quantity: 1 },
            { id: 595, quantity: 20 },
          ],
        },
        corpDeck: {
          id: "audit_no_phantom_recurring_corp",
          name: "Audit no phantom recurring Corp",
          side: "corp",
          identity: 3,
          cards: [
            { id: 588, quantity: 6 },
            { id: 596, quantity: 12 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    for (const definitionId of [
      214,
      220,
    ] as const) {
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const cardId = state.runner.rig.programs.find(
        (candidate) =>
          state.cardInstances[candidate]?.definitionId === definitionId,
      );
      expect(cardId).toBeDefined();
      if (!cardId) throw new Error(`Missing installed ${definitionId}`);
      expect(cardCounterAmount(state, cardId, "recurring_credit")).toBe(0);
      expect(
        getPlayerView(state, "runner").own.rig?.find(
          (card) => card.instanceId === cardId,
        )?.counterDisplays,
      ).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ counterType: "recurring_credit" }),
        ]),
      );
    }

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.maxHandSize = 100;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    for (const cardId of state.runner.rig.programs.filter((candidate) =>
      [214, 220].includes(
        state.cardInstances[candidate]?.definitionId ?? 0,
      ),
    ))
      expect(cardCounterAmount(state, cardId, "recurring_credit")).toBe(0);
  });

  it("uses Ramming Piston as a wall breaker with exact Stealth follow-up loss", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-ramming-piston",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_ramming_runner",
          name: "Spotcheck Ramming Runner",
          cards: [
            { id: 265, quantity: 1 },
            { id: 223, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 223);
    moveRunnerCardToGrip(state, 265);
    const iceId = putCorpIceOnServer(state, "rd", 444);
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === 223,
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 223,
    );
    expect(cloakId).toBeDefined();
    if (!cloakId) throw new Error("Missing Cloak");
    setCardCounterForTest(state, cloakId, "bit", 5);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === 265,
    );
    const rammingId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 265,
    );
    expect(rammingId).toBeDefined();
    if (!rammingId) throw new Error("Missing Ramming Piston");
    state.cardInstances[rammingId] = {
      ...state.cardInstances[rammingId]!,
      strengthModifier: 10,
    };
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
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 265,
    );
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 265,
      postBreakStealthLoss: 2,
    });
  });

  it("offers Ramming Piston wall break without installed Stealth cards because Noisy loss is a penalty", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-ramming-piston-no-stealth",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_ramming_no_stealth_runner",
          name: "Spotcheck Ramming No Stealth Runner",
          cards: [
            { id: 265, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: 449, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    moveRunnerCardToGrip(state, 265);
    const iceId = putCorpIceOnServer(state, "remote_1", 449);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === 265,
    );
    const rammingId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 265,
    );
    expect(rammingId).toBeDefined();
    if (!rammingId) throw new Error("Missing Ramming Piston");
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

    const rammingBreak = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 265,
    );
    expect(rammingBreak).toBeDefined();
    expect(rammingBreak?.costs).toEqual([{ credits: 2 }]);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === rammingBreak?.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toEqual([0]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: 265,
      targetIceDefinitionId: 449,
    });
    expect(
      state.eventLog.at(-1)?.publicPayload.postBreakStealthLoss,
    ).toBeUndefined();
  });

  it("adds Skivviss counters on successful R&D runs and converts them into Corp start-turn draws", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-skivviss-rd"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 276);
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === 276,
    );
    const skivvissId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 276,
    );
    expect(skivvissId).toBeDefined();
    if (!skivvissId) throw new Error("Missing Skivviss");
    expect(cardCounterAmount(state, skivvissId, "virus")).toBe(0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(cardCounterAmount(state, skivvissId, "virus")).toBe(0);
    expect(state.purgeableRunnerVirusCounters?.corp?.skivviss).toBe(1);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const visibleSkivviss = runnerView.own.rig?.find(
      (card) => card.instanceId === skivvissId,
    );
    const runnerCorpSkivvissDisplay =
      runnerView.opponent.identity.counterDisplays?.find(
        (display) => display.id === "runner_virus_corp_skivviss",
      );
    const corpSkivvissDisplay = corpView.own.identity.counterDisplays?.find(
      (display) => display.id === "runner_virus_corp_skivviss",
    );
    expect(visibleSkivviss?.counters?.virus).toBeUndefined();
    expect(
      visibleSkivviss?.counterDisplays?.some(
        (display) =>
          display.id === "virus" || display.id === "runner_virus_corp_skivviss",
      ),
    ).not.toBe(true);
    expect(runnerCorpSkivvissDisplay).toMatchObject({
      amount: 1,
      label: "Skivviss-Counter",
      ariaLabel: "1 Skivviss-Counter",
    });
    expect(corpSkivvissDisplay).toMatchObject({
      amount: 1,
      label: "Skivviss-Counter",
    });
    const hqBeforeCorpTurn = state.corp.hq.length;
    state.corp.maxHandSize = 100;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.hq.length).toBe(hqBeforeCorpTurn);
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.corp.clicks).toBe(3);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "draw_cards",
        side: "corp",
        amount: 1,
        sourceDefinitionId: 276,
        sourceTitle: "Skivviss",
      }),
    );
    expect(state.corp.hq.length).toBe(hqBeforeCorpTurn + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      corpMandatoryCardCount: 1,
      corpMandatorySkivvissCardCount: 1,
      corpMandatoryTotalBaseDrawCount: 2,
    });
    expect(state.phase).toBe("corp_action_phase");
    expect(state.timingPoint).toBe("corp_action.main");
    expect(state.corp.clicks).toBe(3);
  });

  it("adds Cascade counters to the Corp on successful R&D runs and hides them from the source program", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-cascade-rd"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 222);
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === 222,
    );
    const cascadeId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === 222,
    );
    expect(cascadeId).toBeDefined();
    if (!cascadeId) throw new Error("Missing Cascade");
    expect(cardCounterAmount(state, cascadeId, "virus")).toBe(0);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(cardCounterAmount(state, cascadeId, "virus")).toBe(0);
    expect(state.purgeableRunnerVirusCounters?.corp?.cascade).toBe(1);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const visibleCascade = runnerView.own.rig?.find(
      (card) => card.instanceId === cascadeId,
    );
    expect(visibleCascade?.counters?.virus).toBeUndefined();
    expect(
      visibleCascade?.counterDisplays?.some(
        (display) =>
          display.id === "virus" || display.id === "runner_virus_corp_cascade",
      ),
    ).not.toBe(true);
    expect(
      runnerView.opponent.identity.counterDisplays?.find(
        (display) => display.id === "runner_virus_corp_cascade",
      ),
    ).toMatchObject({
      amount: 1,
      label: "Cascade-Counter",
      ariaLabel: "1 Cascade-Counter",
      counterType: "cascade",
    });
    expect(
      corpView.own.identity.counterDisplays?.find(
        (display) => display.id === "runner_virus_corp_cascade",
      ),
    ).toMatchObject({
      amount: 1,
      label: "Cascade-Counter",
    });
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "counter_change",
        side: "corp",
        counterType: "cascade",
        addedCounterAmount: 1,
        sourceDefinitionId: 222,
      }),
    );
  });

  it("uses P3.49 virus CardImplementations for hidden looks, Cascade trash and Gremlins hand size", () => {
    const p349VirusCards = [
      220,
      221,
      225,
      222,
      229,
      237,
      241,
      246,
      258,
      261,
      276,
    ] as const;
    for (const definitionId of p349VirusCards) {
      expect(
        cardImplementationForDefinitionId(definitionId)?.virusCounter,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    const p349VirusGame = (
      seed: string,
      runnerCardIds: readonly number[],
    ): GameState =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          runnerDeck: {
            id: `${seed}_runner`,
            name: `${seed} Runner`,
            side: "runner",
            identity: 587,
            cards: [
              ...runnerCardIds.map((id) => ({ id, quantity: 1 })),
              { id: 595, quantity: 20 },
            ],
          },
          corpDeck: {
            id: `${seed}_corp`,
            name: `${seed} Corp`,
            side: "corp",
            identity: 3,
            cards: [
              { id: 588, quantity: 6 },
              { id: 596, quantity: 8 },
              { id: 491, quantity: 2 },
            ],
          },
          agendaPointsToWin: 7,
        }),
      );

    let boardwalk = p349VirusGame("p349-boardwalk-hidden-look", [
      220,
    ]);
    const boardwalkId = installRunnerProgramForTest(
      boardwalk,
      220,
    );
    expect(cardCounterAmount(boardwalk, boardwalkId, "virus")).toBe(0);
    boardwalk.purgeableRunnerVirusCounters = { corp: { boardwalk: 4 } };
    removeEverywhere(boardwalk, boardwalkId);
    boardwalk.runner.heap.push(boardwalkId);
    boardwalk.cardInstances[boardwalkId] = {
      ...boardwalk.cardInstances[boardwalkId]!,
      faceup: true,
      rezzed: false,
      zone: { side: "runner", zone: "heap" },
    };
    moveCorpCardToHq(boardwalk, 596);
    moveCorpCardToHq(boardwalk, 491);
    boardwalk.corp.maxHandSize = 100;
    boardwalk = apply(
      boardwalk,
      "runner",
      (action) => action.type === "end_turn",
    );
    boardwalk = apply(
      boardwalk,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    boardwalk = apply(
      boardwalk,
      "corp",
      (action) => action.type === "end_turn",
    );
    expect(boardwalk.pendingChoice?.source).toContain(
      "p3_33.private_look:ability:220:hq",
    );
    expect(
      boardwalk.pendingChoice?.options.filter((option) =>
        String(option.id).startsWith("card_"),
      ),
    ).toHaveLength(2);
    expect(getPlayerView(boardwalk, "corp").pendingChoice).toBeUndefined();

    let thought = p349VirusGame("p349-deep-thought-hidden-look", [
      229,
    ]);
    const thoughtId = installRunnerProgramForTest(
      thought,
      229,
    );
    expect(cardCounterAmount(thought, thoughtId, "virus")).toBe(0);
    thought.purgeableRunnerVirusCounters = { corp: { thought: 3 } };
    putCorpCardOnTopOfRd(thought, 596);
    thought.corp.maxHandSize = 100;
    thought = apply(thought, "runner", (action) => action.type === "end_turn");
    thought = apply(
      thought,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    thought = apply(thought, "corp", (action) => action.type === "end_turn");
    expect(thought.pendingChoice?.source).toContain(
      "p3_33.private_look:ability:229:rd",
    );
    expect(getPlayerView(thought, "corp").pendingChoice).toBeUndefined();

    let butcher = p349VirusGame("p349-butcher-shared-credit", [
      221,
    ]);
    const butcherId = installRunnerProgramForTest(
      butcher,
      221,
    );
    expect(cardCounterAmount(butcher, butcherId, "virus")).toBe(0);
    butcher.purgeableRunnerVirusCounters = {
      corp: { successful_hq_run_pair_credit: 4 },
    };
    expect(
      getPlayerView(butcher, "runner").opponent.identity.counterDisplays,
    ).toContainEqual(
      expect.objectContaining({
        id: "runner_virus_corp_successful_hq_run_pair_credit",
        amount: 4,
        label: "Butcher-Boy-Counter",
      }),
    );
    const butcherCreditsBefore = butcher.runner.credits;
    butcher.corp.maxHandSize = 100;
    butcher = apply(butcher, "runner", (action) => action.type === "end_turn");
    butcher = apply(
      butcher,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    butcher = apply(butcher, "corp", (action) => action.type === "end_turn");
    expect(butcher.runner.credits).toBe(butcherCreditsBefore + 2);
    expect(
      butcher.eventLog.at(-1)?.publicPayload.resolvedEffects,
    ).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits",
        side: "runner",
        amount: 2,
        sourceDefinitionId: 221,
      }),
    );

    let cascade = p349VirusGame("p349-cascade-start-trash", [
      222,
    ]);
    const cascadeId = installRunnerProgramForTest(
      cascade,
      222,
    );
    for (const cardId of cascade.corp.rd.slice()) {
      removeEverywhere(cascade, cardId);
      cascade.corp.archives.push(cardId);
      cascade.cardInstances[cardId] = {
        ...cascade.cardInstances[cardId]!,
        faceup: true,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
    }
    const rdFaceupId = putCorpCardOnTopOfRd(
      cascade,
      596,
    );
    cascade.cardInstances[rdFaceupId] = {
      ...cascade.cardInstances[rdFaceupId]!,
      faceup: false,
      rezzed: false,
    };
    expect(cardCounterAmount(cascade, cascadeId, "virus")).toBe(0);
    cascade.purgeableRunnerVirusCounters = { corp: { cascade: 4 } };
    const cascadeInitial = structuredClone(cascade);
    const cascadeReplayStart = cascade.eventLog.length;
    cascade = apply(cascade, "runner", (action) => action.type === "end_turn");
    expect(cascade.corp.archives).toContain(rdFaceupId);
    expect(cascade.corp.rd).toEqual([]);
    expect(cascade.cardInstances[rdFaceupId]).toMatchObject({
      faceup: true,
      rezzed: false,
      zone: { side: "corp", zone: "archives" },
    });
    expect(cascade.pendingChoice).toBeUndefined();
    expect(cascade.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "privatePayload",
    );
    const cascadeReplay = replayEvents(
      cascadeInitial,
      cascade.eventLog.slice(cascadeReplayStart),
    );
    expect(cascadeReplay.ok).toBe(true);
    expect(hashState(cascadeReplay.state)).toBe(hashState(cascade));

    let emptyCascade = p349VirusGame("p349-cascade-empty-rd", [
      222,
    ]);
    installRunnerProgramForTest(emptyCascade, 222);
    for (const cardId of emptyCascade.corp.rd.slice()) {
      removeEverywhere(emptyCascade, cardId);
      emptyCascade.corp.archives.push(cardId);
      emptyCascade.cardInstances[cardId] = {
        ...emptyCascade.cardInstances[cardId]!,
        faceup: true,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
    }
    emptyCascade.purgeableRunnerVirusCounters = { corp: { cascade: 2 } };
    emptyCascade = apply(
      emptyCascade,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(emptyCascade.corp.rd).toEqual([]);
    expect(emptyCascade.pendingChoice).toBeUndefined();
    expect(validateGameState(emptyCascade).ok).toBe(true);

    const gremlins = p349VirusGame("p349-gremlins-hand-size", [
      241,
    ]);
    const gremlinsId = installRunnerProgramForTest(
      gremlins,
      241,
    );
    gremlins.corp.maxHandSize = 6;
    expect(cardCounterAmount(gremlins, gremlinsId, "virus")).toBe(0);
    gremlins.purgeableRunnerVirusCounters = { corp: { gremlin: 4 } };
    expect(getPlayerView(gremlins, "corp").own.maxHandSize).toBe(4);
    expect(getPlayerView(gremlins, "runner").opponent.maxHandSize).toBe(4);
  });

  it("uses The Short Circuit as a repeatable paid private stack tutor", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-short-circuit"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 389);
    const targetProgramId = putRunnerCardOnTopOfStack(state, 591);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === 389,
    );
    const shortCircuitId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        389,
    );
    expect(shortCircuitId).toBeDefined();
    const creditsBeforeAbility = state.runner.credits;
    const shortCircuitAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.source === shortCircuitId,
    );
    expect(shortCircuitAction?.costs).toEqual([{ clicks: 1, credits: 1 }]);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        sourceDefinition(state, action) === 389,
    );
    expect(state.runner.credits).toBe(creditsBeforeAbility - 1);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetProgramId);
    if (shortCircuitId) {
      expect(state.runner.rig.resources).toContain(shortCircuitId);
      expect(state.runner.heap).not.toContain(shortCircuitId);
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId: 389,
      cardDefinitionId: 591,
      publicRevealDefinitionId: 591,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "trashOnUse",
    );
  });

  it("enforces the immediate Bodyweight Data Creche window and only uses it on bonus-run start", () => {
    let state = toRunnerTurn(
      createMechanicFixtureGameAfterSetup({
        seed: "spotcheck-bodyweight-creche",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_bodyweight_runner",
          name: "Spotcheck Bodyweight Runner",
          cards: [
            { id: 334, quantity: 1 },
            { id: 335, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 334);
    moveRunnerCardToGrip(state, 335);
    const baseMemory = getPlayerView(state, "runner").own.memoryLimit;
    expect(baseMemory).toBeDefined();
    if (baseMemory === undefined)
      throw new Error("Missing runner memory limit");
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === 334,
    );
    const oldDeckId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId === 334,
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(baseMemory + 2);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === 335,
    );
    const bodyweightId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        335,
    );
    expect(bodyweightId).toBeDefined();
    if (!bodyweightId) throw new Error("Missing Bodyweight Data Creche");
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(baseMemory + 1);
    expect(cardCounterAmount(state, bodyweightId, "recurring_credit")).toBe(0);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === bodyweightId,
      )?.counterDisplays,
    ).toBeUndefined();
    expect(
      CARD_DEFINITIONS_BY_ID[335],
    ).toMatchObject({
      installCost: 3,
      memoryLimitBonus: 1,
    });
    expect(
      CARD_DEFINITIONS_BY_ID[335]
        ?.recurringCredits,
    ).toBeUndefined();
    expect(
      CARD_DEFINITIONS_BY_ID[335]?.mechanics,
    ).not.toContain("link_recurring_credit");
    if (oldDeckId) expect(state.runner.heap).toContain(oldDeckId);
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags).toMatchObject({
      successfulRunExtraRunPending: true,
      successfulRunExtraRunUsedThisTurn: false,
    });
    const firstWindowActions = getLegalActions(state, "runner");
    expect(firstWindowActions.length).toBeGreaterThan(1);
    expect(
      firstWindowActions.every(
        (action) =>
          (action.type === "start_run" &&
            action.payload?.bonusRunSource ===
              335) ||
          (action.type === "trigger_ability" &&
            action.payload?.runnerAbility ===
              "decline_successful_run_extra_run"),
      ),
    ).toBe(true);
    expect(
      firstWindowActions.some((action) =>
        ["draw_card", "gain_credit", "end_turn"].includes(action.type),
      ),
    ).toBe(false);
    const decline = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerAbility === "decline_successful_run_extra_run",
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: decline.actionId,
        clientKnownStateVersion: state.stateVersion,
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: decline.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
      }).ok,
    ).toBe(false);
    const clicksBeforeDecline = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === decline.actionId,
    );
    expect(state.runner.clicks).toBe(clicksBeforeDecline);
    expect(state.runnerTurnFlags).toMatchObject({
      successfulRunExtraRunPending: false,
      successfulRunExtraRunUsedThisTurn: false,
      bonusRunPending: false,
    });

    state.runner.clicks = 3;
    state = apply(state, "runner", (action) => action.type === "draw_card");
    putCorpCardOnTopOfRd(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags).toMatchObject({
      successfulRunExtraRunPending: true,
      successfulRunExtraRunUsedThisTurn: false,
    });
    state.runner.clicks = 0;
    const bonusRun = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.bonusRunSource === 335,
    );
    const clicksBeforeBonus = state.runner.clicks;
    expect(bonusRun.costs).not.toContainEqual(
      expect.objectContaining({ clicks: expect.any(Number) }),
    );
    state = apply(
      state,
      "runner",
      (action) => action.actionId === bonusRun.actionId,
    );
    expect(state.runner.clicks).toBe(clicksBeforeBonus);
    expect(state.runnerTurnFlags).toMatchObject({
      successfulRunExtraRunPending: false,
      successfulRunExtraRunUsedThisTurn: true,
    });
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.bonusRunSource ===
            335,
      ),
    ).toBe(false);
  });

  it("lets the Runner remove Data Raven counters for an action and 1 credit", () => {
    let state = toRunnerTurn(
      v196CardReleaseGame("spotcheck-data-raven-remove"),
    );
    state.runner.credits = 5;
    putCorpIceOnServer(state, "rd", 448);
    setCardCounterForTest(state, state.runner.identity, "trace_tag_counter", 2);
    expect(
      getPlayerView(state, "runner").legalActions.some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerAbility === "remove_runner_trace_counter" &&
          action.payload?.counterType === "trace_tag_counter" &&
          action.payload?.cardId === state.runner.identity,
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerAbility === "remove_runner_trace_counter" &&
        action.payload?.counterType === "trace_tag_counter",
    );
    expect(
      cardCounterAmount(state, state.runner.identity, "trace_tag_counter"),
    ).toBe(1);
    expect(state.runner.credits).toBe(4);
    expect(state.runner.clicks).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "remove_runner_trace_counter",
      counterType: "trace_tag_counter",
      removedCounterAmount: 1,
      remainingCounters: 1,
    });
  });

  it("offers Experimental AI as a root rez before access and keeps it inactive when declined", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-experimental-ai-root-rez-window",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          id: "spotcheck_experimental_ai_blink_runner",
          name: "Spotcheck Experimental AI Blink Runner",
          cards: [
            { id: 219, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 4;
    const blinkId = installRunnerProgramForTest(state, 219);
    const programTrashByAdvancementAssetId = putCorpRootInRemote(
      state,
      535,
    );
    state.cardInstances[programTrashByAdvancementAssetId] = {
      ...state.cardInstances[programTrashByAdvancementAssetId]!,
      advancementCounters: 1,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.position).toEqual({
      kind: "server",
      serverId: "remote_1",
    });
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toEqual(["jack_out", "continue_run"]);
    expect(getLegalActions(state, "corp")).toEqual([]);

    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.timingPoint).toBe("run.movement_rez_window");
    expect(getLegalActions(state, "runner")).toEqual([]);
    const corpActions = getLegalActions(state, "corp");
    expect(corpActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "rez_card",
          costs: [{ credits: 2 }],
          payload: expect.objectContaining({
            cardId: programTrashByAdvancementAssetId,
            rootRez: true,
            serverId: "remote_1",
          }),
        }),
        expect.objectContaining({
          type: "decline_rez",
          payload: expect.objectContaining({ runRootRezPass: true }),
        }),
      ]),
    );

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    expect(state.cardInstances[programTrashByAdvancementAssetId]?.rezzed).toBe(
      false,
    );
    expect(state.timingPoint).toBe("access.resolve_card");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.heap).not.toContain(blinkId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "ambushDefinitionId",
    );
  });

  it("keeps Experimental AI ambush and later Runner trash separate after root rez", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-experimental-ai-root-rezzed-access",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          id: "spotcheck_experimental_ai_rez_blink_runner",
          name: "Spotcheck Experimental AI Rez Blink Runner",
          cards: [
            { id: 219, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 4;
    const blinkId = installRunnerProgramForTest(state, 219);
    const programTrashByAdvancementAssetId = putCorpRootInRemote(
      state,
      535,
    );
    state.cardInstances[programTrashByAdvancementAssetId] = {
      ...state.cardInstances[programTrashByAdvancementAssetId]!,
      advancementCounters: 1,
    };

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
        sourceDefinition(state, action) === 535,
    );
    expect(state.cardInstances[programTrashByAdvancementAssetId]?.rezzed).toBe(
      true,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_card",
      cardDefinitionId: 535,
    });
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runner.heap).toContain(blinkId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      ambushDefinitionId: 535,
      trashedCardDefinitionId: 219,
    });

    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    expect(state.corp.archives).toContain(programTrashByAdvancementAssetId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trash_accessed_card",
      cardDefinitionId: 535,
    });
  });

  it("uses Experimental AI advancement counters as the installed-program trash count", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-experimental-ai"),
    );
    installRunnerProgramForTest(state, 591);
    installRunnerProgramForTest(state, 597);
    const programTrashByAdvancementAssetId = putCorpRootInRemote(
      state,
      535,
    );
    state.cardInstances[programTrashByAdvancementAssetId] = {
      ...state.cardInstances[programTrashByAdvancementAssetId]!,
      advancementCounters: 2,
    };
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
        sourceDefinition(state, action) === 535,
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    const programOptions = state.pendingChoice?.options.map(
      (option) => option.id,
    );
    expect(programOptions).toHaveLength(2);
    state = applyChoices(state, "corp", programOptions ?? []);
    expect(
      state.runner.heap.map((id) => state.cardInstances[id]?.definitionId),
    ).toEqual(expect.arrayContaining([591, 597]));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushDefinitionId: 535,
      advancementCounterCount: 2,
      trashedCount: 2,
    });
  });

  it("applies New Galveston City Grid as a server-bound trash-cost modifier without R&D reveal", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-new-galveston",
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_new_galveston_corp",
          name: "Spotcheck New Galveston Corp",
          cards: [
            { id: 594, quantity: 1 },
            { id: 574, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    const assetId = putCorpRootInRemote(state, 594);
    const gridId = putCorpRootInRemote(
      state,
      574,
    );
    const server = state.corp.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    expect(server).toBeDefined();
    if (!server) throw new Error("Missing remote");
    server.root = [assetId, gridId];
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[gridId] = {
      ...state.cardInstances[gridId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const trashAction = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(trashAction.payload?.accessTrashCostModifier).toBe(2);
    expect(trashAction.payload?.accessTrashCostSourceDefinitionIds).toBe(
      String(574),
    );
    state = apply(
      state,
      "runner",
      (action) => action.actionId === trashAction.actionId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessTrashCostModifier: 2,
      accessTrashCostSourceDefinitionIds: String(574),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"rd"|R&D|cardInstances/,
    );
  });

  it("limits New Galveston trash_cost to same-fort assets and upgrades", () => {
    const p312Ids = new Set([
      574,
      588,
      606,
    ]);
    const newGalvestonGame = (seed: string) =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `${seed}_corp`,
            name: `${seed} Corp`,
            cards: [
              { id: 574, quantity: 1 },
              { id: 588, quantity: 1 },
              { id: 606, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
                (entry) => !p312Ids.has(entry.id),
              ),
            ],
          },
        }),
      );
    let upgradeState = newGalvestonGame("p312-new-galveston-upgrade");
    upgradeState.runner.credits = 20;
    const upgradeId = putCorpRootInRemote(upgradeState, 606);
    const gridId = putCorpRootInRemote(
      upgradeState,
      574,
    );
    const server = upgradeState.corp.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    if (!server) throw new Error("remote missing");
    server.root = [upgradeId, gridId];
    upgradeState.cardInstances[upgradeId] = {
      ...upgradeState.cardInstances[upgradeId]!,
      faceup: true,
      rezzed: true,
    };
    upgradeState.cardInstances[gridId] = {
      ...upgradeState.cardInstances[gridId]!,
      faceup: true,
      rezzed: true,
    };
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    upgradeState = apply(
      upgradeState,
      "runner",
      (action) => action.type === "access_card",
    );
    const trashUpgrade = mustAction(
      upgradeState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(trashUpgrade.costs).toEqual([{ credits: 6 }]);
    expect(trashUpgrade.payload).toMatchObject({
      accessTrashBaseCost: 4,
      accessTrashCostModifier: 2,
      accessTrashTotalCost: 6,
      accessTrashCostSourceDefinitionIds: String(574),
    });

    const stale = structuredClone(upgradeState);
    stale.cardInstances[gridId] = {
      ...stale.cardInstances[gridId]!,
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "runner",
        actionId: trashUpgrade.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "p312-new-galveston-stale",
      }).ok,
    ).toBe(false);

    let otherFort = newGalvestonGame("p312-new-galveston-other-fort");
    otherFort.runner.credits = 20;
    const otherGridId = putCorpRootInRemote(
      otherFort,
      574,
    );
    otherFort.cardInstances[otherGridId] = {
      ...otherFort.cardInstances[otherGridId]!,
      faceup: true,
      rezzed: true,
    };
    otherFort.corp.servers.push({
      id: "remote_2",
      kind: "remote",
      label: "Remote 2",
      ice: [],
      root: [],
    });
    const otherUpgradeId = findCard(otherFort, 606);
    removeEverywhere(otherFort, otherUpgradeId);
    otherFort.corp.servers
      .find((candidate) => candidate.id === "remote_2")
      ?.root.push(otherUpgradeId);
    otherFort.cardInstances[otherUpgradeId] = {
      ...otherFort.cardInstances[otherUpgradeId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_2" },
      faceup: true,
      rezzed: true,
    };
    otherFort = apply(
      otherFort,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_2",
    );
    otherFort = apply(
      otherFort,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      mustAction(
        otherFort,
        "runner",
        (action) => action.type === "trash_accessed_card",
      ).costs,
    ).toEqual([{ credits: 4 }]);

    let agendaAccess = newGalvestonGame("p312-new-galveston-agenda");
    agendaAccess.runner.credits = 20;
    const agendaGridId = putCorpRootInRemote(
      agendaAccess,
      574,
    );
    const agendaId = putCorpRootInRemote(agendaAccess, 588);
    const agendaServer = agendaAccess.corp.servers.find(
      (candidate) => candidate.id === "remote_1",
    );
    if (!agendaServer) throw new Error("agenda remote missing");
    agendaServer.root = [agendaId, agendaGridId];
    agendaAccess.cardInstances[agendaGridId] = {
      ...agendaAccess.cardInstances[agendaGridId]!,
      faceup: true,
      rezzed: true,
    };
    agendaAccess = apply(
      agendaAccess,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    agendaAccess = apply(
      agendaAccess,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      mustAction(
        agendaAccess,
        "runner",
        (action) => action.type === "steal_agenda",
      ).costs,
    ).toEqual([]);
  });
});

describe("Originalset spotcheck 2026-05-15 contacts/datapool follow-up", () => {
  it("publishes focused economy payloads for Livewire's Contacts and Efficiency Experts", () => {
    let runnerState = toRunnerTurn(v106kCardReleaseGame("spotcheck-livewire"));
    runnerState.runner.credits = 5;
    runnerState.runner.clicks = 4;
    const livewireId = moveRunnerCardToGrip(
      runnerState,
      309,
    );
    const livewire = mustAction(
      runnerState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(runnerState, action) ===
          309,
    );
    expect(livewire.costs[0]).toMatchObject({ clicks: 1, credits: 0 });
    expect(
      applyAction(runnerState, {
        matchId: runnerState.matchId,
        side: "corp",
        actionId: livewire.actionId,
        clientKnownStateVersion: runnerState.stateVersion,
        idempotencyKey: "spotcheck-livewire-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(runnerState, {
        matchId: runnerState.matchId,
        side: "runner",
        actionId: livewire.actionId,
        clientKnownStateVersion: runnerState.stateVersion - 1,
        idempotencyKey: "spotcheck-livewire-stale",
      }).ok,
    ).toBe(false);

    const livewireInitial = structuredClone(runnerState);
    const livewireReplayStart = runnerState.eventLog.length;
    const runnerCreditsBefore = runnerState.runner.credits;
    runnerState = apply(
      runnerState,
      "runner",
      (action) => action.actionId === livewire.actionId,
    );
    expect(runnerState.runner.credits).toBe(runnerCreditsBefore + 3);
    expect(runnerState.runner.heap).toContain(livewireId);
    expect(runnerState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: 309,
      gainedCredits: 3,
      runnerCreditsAfter: runnerState.runner.credits,
      resolvedEffects: [
        expect.objectContaining({
          effectId: "309.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "runner",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 309,
          sourceTitle: "Livewire’s Contacts",
        }),
      ],
    });
    expect(
      JSON.stringify(runnerState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/runner_|corp_|privatePayload|cardInstances/);
    const livewireReplay = replayEvents(
      livewireInitial,
      runnerState.eventLog.slice(livewireReplayStart),
    );
    expect(livewireReplay.ok).toBe(true);
    expect(hashState(livewireReplay.state)).toBe(hashState(runnerState));

    let corpState = createGameAfterSetup({
      seed: "spotcheck-efficiency",
      runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
      corpDeck: ONR_V1_0_6K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    corpState = apply(
      corpState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    corpState.corp.credits = 5;
    corpState.corp.clicks = 3;
    const efficiencyId = moveCorpCardToHq(
      corpState,
      502,
    );
    const efficiency = mustAction(
      corpState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(corpState, action) === 502,
    );
    expect(efficiency.costs[0]).toMatchObject({ clicks: 1, credits: 0 });
    expect(
      applyAction(corpState, {
        matchId: corpState.matchId,
        side: "runner",
        actionId: efficiency.actionId,
        clientKnownStateVersion: corpState.stateVersion,
        idempotencyKey: "spotcheck-efficiency-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(corpState, {
        matchId: corpState.matchId,
        side: "corp",
        actionId: efficiency.actionId,
        clientKnownStateVersion: corpState.stateVersion - 1,
        idempotencyKey: "spotcheck-efficiency-stale",
      }).ok,
    ).toBe(false);

    const efficiencyInitial = structuredClone(corpState);
    const efficiencyReplayStart = corpState.eventLog.length;
    const corpCreditsBefore = corpState.corp.credits;
    corpState = apply(
      corpState,
      "corp",
      (action) => action.actionId === efficiency.actionId,
    );
    expect(corpState.corp.credits).toBe(corpCreditsBefore + 3);
    expect(corpState.corp.archives).toContain(efficiencyId);
    expect(corpState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: 502,
      gainedCredits: 3,
      corpCreditsAfter: corpState.corp.credits,
      resolvedEffects: [
        expect.objectContaining({
          effectId: "502.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 502,
        }),
      ],
    });
    expect(
      JSON.stringify(corpState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/corp_hq|privatePayload|cardInstances/);
    const efficiencyReplay = replayEvents(
      efficiencyInitial,
      corpState.eventLog.slice(efficiencyReplayStart),
    );
    expect(efficiencyReplay.ok).toBe(true);
    expect(hashState(efficiencyReplay.state)).toBe(hashState(corpState));
  });

  it("draws Bodyweight Synthetic Blood without public draw-content leaks", () => {
    for (const [seed, stackDefinitions, expectedDrawn] of [
      [
        "spotcheck-bodyweight-five",
        [
          595,
          307,
          309,
          320,
          357,
        ],
        5,
      ],
      [
        "spotcheck-bodyweight-short",
        [595, 307],
        2,
      ],
    ] as const) {
      let state = toRunnerTurn(v106kCardReleaseGame(seed));
      state.runner.credits = 10;
      state.runner.clicks = 4;
      const eventId = moveRunnerCardToGrip(
        state,
        291,
      );
      for (const id of state.runner.stack.slice()) {
        removeEverywhere(state, id);
        state.runner.heap.push(id);
        state.cardInstances[id] = {
          ...state.cardInstances[id]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: true,
        };
      }
      for (const definitionId of stackDefinitions.slice().reverse()) {
        putRunnerCardOnTopOfStack(state, definitionId);
      }

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const gripBefore = state.runner.grip.length;
      const action = mustAction(
        state,
        "runner",
        (candidate) =>
          candidate.type === "play_event" &&
          sourceDefinition(state, candidate) ===
            291,
      );
      state = apply(
        state,
        "runner",
        (candidate) => candidate.actionId === action.actionId,
      );
      expect(state.runner.heap).toContain(eventId);
      expect(state.runner.grip.length).toBe(gripBefore - 1 + expectedDrawn);
      expect(state.runner.stack).toHaveLength(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_event",
        cardDefinitionId: 291,
        drawnCount: expectedDrawn,
        runnerGripAfter: state.runner.grip.length,
        resolvedEffects: [
          expect.objectContaining({
            effectId:
              "291.effect.0.draw_cards",
            kind: "draw_cards",
            visibility: "public",
            side: "runner",
            amount: expectedDrawn,
            reason: "card_resolver",
            sourceDefinitionId: 291,
          }),
        ],
      });
      const publicPayload = JSON.stringify(
        state.eventLog.at(-1)?.publicPayload,
      );
      expect(publicPayload).not.toMatch(
        /simple_economy_event|jack-n-joe|livewires|score|wutech|runner_/,
      );
      const corpOpponentView = JSON.stringify(
        getPlayerView(state, "corp").opponent,
      );
      expect(corpOpponentView).toContain('"handCount":');
      expect(corpOpponentView).not.toContain("gripOrHq");
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("revalidates tagged Corp operations and redacts Punitive Counterstrike damage", () => {
    for (const spec of [
      {
        definitionId: 497,
        cost: 1,
        assertAfter: (state: GameState) => {
          expect(state.runner.credits).toBe(0);
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            creditsLost: 7,
            runnerCreditsAfter: 0,
            resolvedEffects: [
              expect.objectContaining({
                effectId: "497.effect.0.lose_credits",
                kind: "lose_credits",
                visibility: "public",
                side: "runner",
                amount: 7,
                reason: "card_resolver",
                sourceDefinitionId: 497,
                sourceTitle: "Closed Accounts",
              }),
            ],
          });
        },
      },
      {
        definitionId: 499,
        cost: 1,
        assertAfter: (state: GameState) => {
          expect(state.runner.tags).toBe(3);
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            tagsAdded: 2,
            runnerTagsAfter: 3,
            resolvedEffects: [
              expect.objectContaining({
                effectId: "499.effect.0.add_tags",
                kind: "add_tags",
                visibility: "public",
                side: "runner",
                amount: 2,
                reason: "card_resolver",
                runnerTagsAfter: 3,
                sourceDefinitionId: 499,
                sourceTitle: "Datapool® by Zetatech",
              }),
            ],
          });
        },
      },
      {
        definitionId: 513,
        cost: 0,
        assertAfter: (state: GameState) => {
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            damageResolved: true,
            damageType: "meat",
            damageAmount: 2,
            cardsTrashed: 2,
          });
          expect(
            JSON.stringify(state.eventLog.at(-1)?.publicPayload),
          ).not.toMatch(/runner_|grip|stack|cardInstances|privatePayload/);
        },
      },
    ] as const) {
      let noTagState = createGameAfterSetup({
        seed: `spotcheck-no-tag-${spec.definitionId}`,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      });
      noTagState = apply(
        noTagState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      noTagState.corp.credits = 10;
      noTagState.corp.clicks = 3;
      moveCorpCardToHq(noTagState, spec.definitionId);
      expect(
        getLegalActions(noTagState, "corp").some(
          (action) =>
            action.type === "play_operation" &&
            sourceDefinition(noTagState, action) === spec.definitionId,
        ),
      ).toBe(false);

      let state = structuredClone(noTagState);
      state.runner.tags = 1;
      state.runner.credits = 7;
      const action = mustAction(
        state,
        "corp",
        (candidate) =>
          candidate.type === "play_operation" &&
          sourceDefinition(state, candidate) === spec.definitionId,
      );
      expect(action.costs[0]).toMatchObject({ clicks: 1, credits: spec.cost });
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "runner",
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
          idempotencyKey: `spotcheck-${spec.definitionId}-wrong-side`,
        }).ok,
      ).toBe(false);
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion - 1,
          idempotencyKey: `spotcheck-${spec.definitionId}-stale`,
        }).ok,
      ).toBe(false);
      const tagDrift = structuredClone(state);
      tagDrift.runner.tags = 0;
      const tagDriftCorpCredits = tagDrift.corp.credits;
      const tagDriftCorpClicks = tagDrift.corp.clicks;
      const tagDriftRunnerCredits = tagDrift.runner.credits;
      const tagDriftRunnerTags = tagDrift.runner.tags;
      expect(
        applyAction(tagDrift, {
          matchId: tagDrift.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: tagDrift.stateVersion,
          idempotencyKey: `spotcheck-${spec.definitionId}-tag-drift`,
        }).ok,
      ).toBe(false);
      expect(tagDrift.corp.credits).toBe(tagDriftCorpCredits);
      expect(tagDrift.corp.clicks).toBe(tagDriftCorpClicks);
      expect(tagDrift.runner.credits).toBe(tagDriftRunnerCredits);
      expect(tagDrift.runner.tags).toBe(tagDriftRunnerTags);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (candidate) => candidate.actionId === action.actionId,
      );
      expect(
        state.corp.archives.some(
          (id) => state.cardInstances[id]?.definitionId === spec.definitionId,
        ),
      ).toBe(true);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: spec.definitionId,
      });
      spec.assertAfter(state);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("migrates P3.2 tagged Corp Operations without legacy double effects", () => {
    for (const spec of [
      {
        definitionId: 505,
        cost: 0,
        assertAfter: (state: GameState, creditsBefore: number) => {
          expect(state.runner.tags).toBe(2);
          expect(state.corp.credits).toBe(creditsBefore + 1);
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            tagsAdded: 1,
            runnerTagsAfter: 2,
            gainedCredits: 1,
            corpCreditsAfter: creditsBefore + 1,
            resolvedEffects: [
              expect.objectContaining({
                effectId:
                  "505.effect.0.add_tags",
                kind: "add_tags",
                visibility: "public",
                side: "runner",
                amount: 1,
                runnerTagsAfter: 2,
                reason: "card_resolver",
                sourceDefinitionId: 505,
                sourceTitle: "Netwatch Credit Voucher",
              }),
              expect.objectContaining({
                effectId:
                  "505.effect.1.gain_credits",
                kind: "gain_credits",
                visibility: "public",
                side: "corp",
                amount: 1,
                reason: "card_resolver",
                sourceDefinitionId: 505,
                sourceTitle: "Netwatch Credit Voucher",
              }),
            ],
          });
        },
      },
      {
        definitionId: 513,
        cost: 0,
        damage: 2,
      },
      {
        definitionId: 514,
        cost: 3,
        damage: 4,
      },
      {
        definitionId: 519,
        cost: 6,
        damage: 5,
      },
    ] as const) {
      let noTagState = createGameAfterSetup({
        seed: `p32-no-tag-${spec.definitionId}`,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      });
      noTagState = apply(
        noTagState,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      noTagState.corp.credits = 20;
      noTagState.corp.clicks = 3;
      noTagState.runner.tags = 0;
      noTagState.runner.credits = 7;
      moveCorpCardToHq(noTagState, spec.definitionId);
      expect(
        getLegalActions(noTagState, "corp").some(
          (action) =>
            action.type === "play_operation" &&
            sourceDefinition(noTagState, action) === spec.definitionId,
        ),
      ).toBe(false);

      let state = structuredClone(noTagState);
      state.runner.tags = 1;
      const action = mustAction(
        state,
        "corp",
        (candidate) =>
          candidate.type === "play_operation" &&
          sourceDefinition(state, candidate) === spec.definitionId,
      );
      expect(action.costs[0]).toMatchObject({
        clicks: 1,
        credits: spec.cost,
      });

      const tagDrift = structuredClone(state);
      tagDrift.runner.tags = 0;
      const tagDriftCorpCredits = tagDrift.corp.credits;
      const tagDriftCorpClicks = tagDrift.corp.clicks;
      const tagDriftRunnerCredits = tagDrift.runner.credits;
      const tagDriftRunnerTags = tagDrift.runner.tags;
      const tagDriftRunnerGripLength = tagDrift.runner.grip.length;
      const tagDriftRunnerHeapLength = tagDrift.runner.heap.length;
      expect(
        applyAction(tagDrift, {
          matchId: tagDrift.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: tagDrift.stateVersion,
          idempotencyKey: `p32-${spec.definitionId}-tag-drift`,
        }).ok,
      ).toBe(false);
      expect(tagDrift.corp.credits).toBe(tagDriftCorpCredits);
      expect(tagDrift.corp.clicks).toBe(tagDriftCorpClicks);
      expect(tagDrift.runner.credits).toBe(tagDriftRunnerCredits);
      expect(tagDrift.runner.tags).toBe(tagDriftRunnerTags);
      expect(tagDrift.runner.grip).toHaveLength(tagDriftRunnerGripLength);
      expect(tagDrift.runner.heap).toHaveLength(tagDriftRunnerHeapLength);

      const creditsBefore = state.corp.credits;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (candidate) => candidate.actionId === action.actionId,
      );
      expect(
        state.corp.archives.some(
          (id) => state.cardInstances[id]?.definitionId === spec.definitionId,
        ),
      ).toBe(true);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: spec.definitionId,
      });

      if ("assertAfter" in spec) {
        spec.assertAfter(state, creditsBefore);
      } else {
        expect(state.corp.credits).toBe(creditsBefore - spec.cost);
        expect(state.runner.heap).toHaveLength(spec.damage);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          damageResolved: true,
          damageType: "meat",
          damageAmount: spec.damage,
          cardsTrashed: spec.damage,
          flatline: false,
          resolvedEffects: [
            expect.objectContaining({
              effectId: `${spec.definitionId}.effect.0.damage`,
              kind: "damage",
              visibility: "public",
              side: "runner",
              amount: spec.damage,
              damageType: "meat",
              cardsTrashed: spec.damage,
              reason: "card_resolver",
              sourceDefinitionId: spec.definitionId,
            }),
          ],
        });
        expect(
          JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        ).not.toMatch(/runner_|grip|stack|cardInstances|privatePayload/);
      }

      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("migrates P3.3 tagged activated meat-damage abilities", () => {
    const assertNoDamageOrCost = (
      state: GameState,
      before: { clicks: number; grip: number; heap: number },
    ): void => {
      expect(state.corp.clicks).toBe(before.clicks);
      expect(state.runner.grip).toHaveLength(before.grip);
      expect(state.runner.heap).toHaveLength(before.heap);
    };

    let solo = MECHANIC_SMOKE_GAMES.assetNodeEffects("p33-solo-squad");
    solo = apply(solo, "corp", (action) => action.type === "mandatory_draw");
    solo.corp.credits = 20;
    solo.corp.clicks = 5;
    solo.runner.tags = 1;
    const soloId = moveCorpCardToHq(solo, 554);
    solo = apply(
      solo,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === soloId &&
        action.payload?.serverId === "new_remote",
    );
    expect(
      getLegalActions(solo, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === soloId,
      ),
    ).toBe(false);
    solo = apply(
      solo,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(solo, action) === 554,
    );
    const soloAction = mustAction(
      solo,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === soloId,
    );
    expect(soloAction.costs[0]).toMatchObject({ clicks: 1 });
    const soloTagDrift = structuredClone(solo);
    soloTagDrift.runner.tags = 0;
    const soloTagBefore = {
      clicks: soloTagDrift.corp.clicks,
      grip: soloTagDrift.runner.grip.length,
      heap: soloTagDrift.runner.heap.length,
    };
    expect(
      applyAction(soloTagDrift, {
        matchId: soloTagDrift.matchId,
        side: "corp",
        actionId: soloAction.actionId,
        clientKnownStateVersion: soloTagDrift.stateVersion,
        idempotencyKey: "p33-solo-tag-drift",
      }).ok,
    ).toBe(false);
    assertNoDamageOrCost(soloTagDrift, soloTagBefore);

    const soloSourceDrift = structuredClone(solo);
    soloSourceDrift.cardInstances[soloId] = {
      ...soloSourceDrift.cardInstances[soloId]!,
      rezzed: false,
    };
    const soloSourceBefore = {
      clicks: soloSourceDrift.corp.clicks,
      grip: soloSourceDrift.runner.grip.length,
      heap: soloSourceDrift.runner.heap.length,
    };
    expect(
      applyAction(soloSourceDrift, {
        matchId: soloSourceDrift.matchId,
        side: "corp",
        actionId: soloAction.actionId,
        clientKnownStateVersion: soloSourceDrift.stateVersion,
        idempotencyKey: "p33-solo-unrezzed-source",
      }).ok,
    ).toBe(false);
    assertNoDamageOrCost(soloSourceDrift, soloSourceBefore);

    const soloRemoved = structuredClone(solo);
    removeEverywhere(soloRemoved, soloId);
    const soloRemovedBefore = {
      clicks: soloRemoved.corp.clicks,
      grip: soloRemoved.runner.grip.length,
      heap: soloRemoved.runner.heap.length,
    };
    expect(
      applyAction(soloRemoved, {
        matchId: soloRemoved.matchId,
        side: "corp",
        actionId: soloAction.actionId,
        clientKnownStateVersion: soloRemoved.stateVersion,
        idempotencyKey: "p33-solo-removed-source",
      }).ok,
    ).toBe(false);
    assertNoDamageOrCost(soloRemoved, soloRemovedBefore);

    const soloInitial = structuredClone(solo);
    const soloReplayStart = solo.eventLog.length;
    const soloClicksBefore = solo.corp.clicks;
    solo = apply(
      solo,
      "corp",
      (action) => action.actionId === soloAction.actionId,
    );
    expect(solo.corp.clicks).toBe(soloClicksBefore - 1);
    expect(solo.runner.heap).toHaveLength(1);
    expect(solo.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 554,
      cardImplementationAbility: "activated",
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
      cardsTrashed: 1,
      resolvedEffects: [
        expect.objectContaining({
          effectId: "554.effect.0.damage",
          kind: "damage",
          side: "runner",
          amount: 1,
          damageType: "meat",
          cardsTrashed: 1,
          reason: "card_resolver",
          sourceDefinitionId: 554,
          sourceTitle: "Solo Squad",
        }),
      ],
    });
    expect(JSON.stringify(solo.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /runner_|grip|stack|cardInstances|privatePayload/,
    );
    const soloReplay = replayEvents(
      soloInitial,
      solo.eventLog.slice(soloReplayStart),
    );
    expect(soloReplay.ok).toBe(true);
    expect(hashState(soloReplay.state)).toBe(hashState(solo));

    const corpDeckWith = (definitionId: number): DeckDefinition => ({
      ...ONR_V1_CORP_DECK,
      id: `p33_${definitionId}_corp`,
      name: `P3.3 ${definitionId} Corp`,
      cards: [{ id: definitionId, quantity: 1 }, ...ONR_V1_CORP_DECK.cards],
    });

    for (const [definitionId, expectedDamage] of [
      [420, 1],
      [429, 2],
    ] as const) {
      let state = createGameAfterSetup({
        seed: `p33-${definitionId}`,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: corpDeckWith(definitionId),
        agendaPointsToWin: 7,
      });
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      state.corp.clicks = 5;
      state.runner.tags = 1;
      const hqAgendaId = moveCorpCardToHq(state, definitionId);
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "activated_card_ability" &&
            action.payload?.cardId === hqAgendaId,
        ),
      ).toBe(false);
      const agendaId = scoreCorpAgendaForTest(state, definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) =>
            action.type === "activated_card_ability" &&
            action.payload?.cardId === agendaId,
        ),
      ).toBe(false);
      const runnerTurn = apply(
        structuredClone(state),
        "corp",
        (action) => action.type === "end_turn",
      );
      expect(
        getLegalActions(runnerTurn, "corp").some(
          (action) =>
            action.type === "activated_card_ability" &&
            action.payload?.cardId === agendaId,
        ),
      ).toBe(false);
      const action = mustAction(
        state,
        "corp",
        (candidate) =>
          candidate.type === "activated_card_ability" &&
          candidate.payload?.cardId === agendaId,
      );
      expect(action.costs[0]).toMatchObject({ clicks: 1 });
      const tagDrift = structuredClone(state);
      tagDrift.runner.tags = 0;
      const tagBefore = {
        clicks: tagDrift.corp.clicks,
        grip: tagDrift.runner.grip.length,
        heap: tagDrift.runner.heap.length,
      };
      expect(
        applyAction(tagDrift, {
          matchId: tagDrift.matchId,
          side: "corp",
          actionId: action.actionId,
          clientKnownStateVersion: tagDrift.stateVersion,
          idempotencyKey: `p33-${definitionId}-tag-drift`,
        }).ok,
      ).toBe(false);
      assertNoDamageOrCost(tagDrift, tagBefore);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const clicksBefore = state.corp.clicks;
      state = apply(
        state,
        "corp",
        (candidate) => candidate.actionId === action.actionId,
      );
      expect(state.corp.clicks).toBe(clicksBefore - 1);
      expect(state.runner.heap).toHaveLength(expectedDamage);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "activated_card_ability",
        cardDefinitionId: definitionId,
        cardImplementationAbility: "activated",
        damageResolved: true,
        damageType: "meat",
        damageAmount: expectedDamage,
        cardsTrashed: expectedDamage,
        resolvedEffects: [
          expect.objectContaining({
            effectId: `${definitionId}.effect.0.damage`,
            kind: "damage",
            side: "runner",
            amount: expectedDamage,
            damageType: "meat",
            cardsTrashed: expectedDamage,
            reason: "card_resolver",
            sourceDefinitionId: definitionId,
          }),
        ],
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /runner_|grip|stack|cardInstances|privatePayload/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("resolves Nerve Labyrinth net damage plus end-the-run without grip leaks", () => {
    let state = toRunnerTurn(v112kCardReleaseGame("spotcheck-nerve-labyrinth"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", 469);
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
        sourceDefinition(state, action) === 469,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      sourceDefinitionId: 469,
      encounterWillEndRun: true,
    });
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: continueAction.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "spotcheck-nerve-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: continueAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: "spotcheck-nerve-stale",
      }).ok,
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: 469,
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
      cardsTrashed: 2,
      result: "ended",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /runner_|grip|stack|cardInstances|privatePayload/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps π in the 'Face and Endless Corridor subroutine indices side-safe", () => {
    expect(CARD_DEFINITIONS_BY_ID[471]).toMatchObject({
      title: "π in the 'Face",
      subtypes: ["DecKrash", "sentry"],
    });
    let piState = toRunnerTurn(v112kCardReleaseGame("spotcheck-pi-face"));
    piState.runner.credits = 20;
    piState.corp.credits = 20;
    installRunnerProgramForTest(piState, 252);
    putCorpIceOnServer(piState, "rd", 471);
    expect(serializedDefinitionReferences(JSON.stringify(getPlayerView(piState, "runner")))).not.toContain(
      471,
    );
    const piInitial = structuredClone(piState);
    const piReplayStart = piState.eventLog.length;
    piState = apply(
      piState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    piState = apply(
      piState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(piState, action) === 471,
    );
    piState = enterEncounterFromMovementWindow(piState);
    expect(JSON.stringify(getPlayerView(piState, "runner"))).toContain(
      471,
    );
    for (let pump = 0; pump < 3; pump += 1) {
      piState = apply(
        piState,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(piState, action) === 252,
      );
    }
    const piBreak = mustAction(
      piState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(piState, action) === 252,
    );
    expect(piBreak.payload).toMatchObject({
      subroutineIndex: 0,
      targetIceDefinitionId: 471,
    });
    expect(
      applyAction(piState, {
        matchId: piState.matchId,
        side: "corp",
        actionId: piBreak.actionId,
        clientKnownStateVersion: piState.stateVersion,
        idempotencyKey: "spotcheck-pi-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(piState, {
        matchId: piState.matchId,
        side: "runner",
        actionId: piBreak.actionId,
        clientKnownStateVersion: piState.stateVersion - 1,
        idempotencyKey: "spotcheck-pi-stale",
      }).ok,
    ).toBe(false);
    piState = apply(
      piState,
      "runner",
      (action) => action.actionId === piBreak.actionId,
    );
    expect(piState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      subroutineIndex: 0,
      targetIceDefinitionId: 471,
    });
    piState = continueRunThroughMovementWindow(piState);
    const piReplay = replayEvents(
      piInitial,
      piState.eventLog.slice(piReplayStart),
    );
    expect(piReplay.ok).toBe(true);
    expect(hashState(piReplay.state)).toBe(hashState(piState));

    let piUnbroken = toRunnerTurn(
      v112kCardReleaseGame("spotcheck-pi-unbroken"),
    );
    piUnbroken.corp.credits = 20;
    putCorpIceOnServer(piUnbroken, "rd", 471);
    piUnbroken = apply(
      piUnbroken,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    piUnbroken = apply(
      piUnbroken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(piUnbroken, action) === 471,
    );
    piUnbroken = enterEncounterFromMovementWindow(piUnbroken);
    piUnbroken = apply(
      piUnbroken,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(piUnbroken.run).toBeUndefined();
    expect(piUnbroken.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 471,
      result: "ended",
    });

    let corridor = toRunnerTurn(
      v105kCardReleaseGame("spotcheck-endless-corridor"),
    );
    corridor.runner.credits = 20;
    corridor.corp.credits = 20;
    installRunnerProgramForTest(corridor, 264);
    putCorpIceOnServer(corridor, "rd", 451);
    const corridorInitial = structuredClone(corridor);
    const corridorReplayStart = corridor.eventLog.length;
    corridor = apply(
      corridor,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    corridor = apply(
      corridor,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(corridor, action) === 451,
    );
    corridor = enterEncounterFromMovementWindow(corridor);
    const corridorBreaks = getLegalActions(corridor, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(corridor, action) === 264,
    );
    expect(
      corridorBreaks.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0, 1]);
    const firstBreak = corridorBreaks[0];
    expect(firstBreak).toBeDefined();
    if (!firstBreak) throw new Error("Missing Endless Corridor break action");
    expect(
      applyAction(corridor, {
        matchId: corridor.matchId,
        side: "corp",
        actionId: firstBreak.actionId,
        clientKnownStateVersion: corridor.stateVersion,
        idempotencyKey: "spotcheck-corridor-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(corridor, {
        matchId: corridor.matchId,
        side: "runner",
        actionId: firstBreak.actionId,
        clientKnownStateVersion: corridor.stateVersion - 1,
        idempotencyKey: "spotcheck-corridor-stale",
      }).ok,
    ).toBe(false);
    corridor = apply(
      corridor,
      "runner",
      (action) => action.actionId === firstBreak.actionId,
    );
    corridor = apply(
      corridor,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(corridor, action) === 264 &&
        action.payload?.subroutineIndex === 1,
    );
    corridor = continueRunThroughMovement(corridor);
    expect(corridor.run?.phase).toBe("access");
    const corridorReplay = replayEvents(
      corridorInitial,
      corridor.eventLog.slice(corridorReplayStart),
    );
    expect(corridorReplay.ok).toBe(true);
    expect(hashState(corridorReplay.state)).toBe(hashState(corridor));

    let unbroken = toRunnerTurn(
      v105kCardReleaseGame("spotcheck-endless-unbroken"),
    );
    unbroken.corp.credits = 20;
    putCorpIceOnServer(unbroken, "rd", 451);
    unbroken = apply(
      unbroken,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    unbroken = apply(
      unbroken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(unbroken, action) === 451,
    );
    unbroken = enterEncounterFromMovementWindow(unbroken);
    unbroken = apply(
      unbroken,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(unbroken.run).toBeUndefined();
    expect(unbroken.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 451,
      result: "ended",
    });
  });

  it("attributes Antiquated Interface Routines strength only to its own fort", () => {
    let state = v163CardReleaseGame("spotcheck-antiquated-interface");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    putCorpRootInRemote(state, 562);
    putCorpIceOnServer(state, "remote_1", 444);
    putCorpIceOnServer(state, "rd", 445);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Antiquated Interface Routines",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const rezUpgrade = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(state, action) ===
          562,
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: rezUpgrade.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "spotcheck-antiquated-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: rezUpgrade.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: "spotcheck-antiquated-stale",
      }).ok,
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === rezUpgrade.actionId,
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Antiquated Interface Routines",
    );

    state = apply(state, "corp", (action) => action.type === "end_turn");
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
        sourceDefinition(state, action) === 444,
    );
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(
      4,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

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
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(
      2,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Endless Corridor rez affordable after rezzing Antiquated Interface Routines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-antiquated-endless-rez-affordability",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: {
          id: "spotcheck_antiquated_endless_rez_affordability_corp",
          name: "Spotcheck Antiquated Endless Rez Affordability Corp",
          side: "corp",
          identity: 3,
          cards: [
            { id: 449, quantity: 1 },
            { id: 451, quantity: 1 },
            { id: 562, quantity: 1 },
            { id: 588, quantity: 2 },
            { id: 596, quantity: 2 },
          ],
        },
      }),
    );
    state.corp.credits = 6;
    const upgradeId = putCorpRootInRemote(
      state,
      562,
    );
    const dataWallId = putCorpIceOnServer(
      state,
      "remote_1",
      449,
    );
    const endlessCorridorId = putCorpIceOnServer(
      state,
      "remote_1",
      451,
    );
    state.cardInstances[dataWallId] = {
      ...state.cardInstances[dataWallId]!,
      rezzed: true,
      faceup: true,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(
      mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === endlessCorridorId,
      ).costs,
    ).toEqual([{ credits: 4 }]);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === upgradeId,
    );
    expect(state.corp.credits).toBe(4);
    expect(
      mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          action.payload?.cardId === endlessCorridorId,
      ).costs,
    ).toEqual([{ credits: 4 }]);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === endlessCorridorId,
    );
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[endlessCorridorId]?.rezzed).toBe(true);
  });
});

describe("Originalset spotcheck 2026-05-15 immunity/cinderella follow-up", () => {
  it("routes Diplomatic Immunity through a Corp cancel window and replay-safe prevention", () => {
    let state = createGameAfterSetup({
      seed: "spotcheck-diplomatic-immunity-prevent",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          { id: 513, quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    state.runner.credits = 10;
    state.corp.credits = 10;
    state.corp.clicks = 3;
    installRunnerResourceForTest(state, 372);
    scoreCorpAgendaForTest(state, 588);
    moveCorpCardToHq(state, 513);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 513,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "v120.event_modification.prevent",
    });
    const preventOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(
        state,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [String(preventOption)],
      },
    });
    expect(wrongSide.ok).toBe(false);
    state = applyChoice(state, "corp", String(preventOption));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      sourceDefinitionId: 372,
      damageAmount: 0,
      preventedAmount: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /runner_|grip|stack|cardInstances|privatePayload/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let cancelState = createGameAfterSetup({
      seed: "spotcheck-diplomatic-immunity-cancel",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          { id: 513, quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    cancelState = apply(
      cancelState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    cancelState.runner.tags = 1;
    cancelState.corp.credits = 10;
    installRunnerResourceForTest(cancelState, 372);
    const agendaId = scoreCorpAgendaForTest(cancelState, 588);
    moveCorpCardToHq(cancelState, 513);
    cancelState = apply(
      cancelState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(cancelState, action) ===
          513,
    );
    cancelState = applyChoice(cancelState, "corp", "pass");
    expect(cancelState.corp.scoreArea).toContain(agendaId);
    expect(cancelState.specialZones?.removedFromGame ?? []).not.toContain(
      agendaId,
    );
    expect(cancelState.cardInstances[agendaId]?.agendaPointsSpent).toBe(1);
    const cancelPayload = cancelState.eventLog.at(-1)?.publicPayload;
    expect(cancelPayload).toMatchObject({
      eventModificationDecision: "cancel",
      agendaPointCost: 1,
      spentAgendaDefinitionIds: String(588),
      damageAmount: 2,
      cardsTrashed: 2,
    });
    expect(
      Number(cancelPayload?.agendaPointCostPaid ?? 0),
    ).toBeGreaterThanOrEqual(1);
  });

  it("hardens AI Chief Financial Officer source binding, short decks and payload redaction", () => {
    let state = createGameAfterSetup({
      seed: "spotcheck-ai-cfo",
      runnerDeck: ONR_V1_9_2_RUNNER_DECK,
      corpDeck: ONR_V1_9_2_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstCfo = scoreCorpAgendaForTest(
      state,
      400,
    );
    const secondCfo = scoreCorpAgendaForTest(
      state,
      400,
    );
    addRezzedCorpRootForTest(
      state,
      29,
      "remote_1",
      "ai_cfo_spg",
    );
    keepOnlyCorpHqCards(state, [
      moveCorpCardToHq(state, 588),
      moveCorpCardToHq(state, 415),
    ]);
    keepOnlyCorpArchivesCards(state, []);
    while (state.corp.rd.length > 4) {
      const id = state.corp.rd.pop();
      if (id) {
        removeEverywhere(state, id);
        delete state.cardInstances[id];
      }
    }
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "hq_archives_shuffle_draw" &&
        action.payload?.cardId === secondCfo,
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
      }).ok,
    ).toBe(false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.corp.hq).toHaveLength(0);
    expect(state.pendingCorpDraw).toMatchObject({
      baseDrawCount: 5,
      replacementDrawCount: 1,
    });
    expect(state.pendingChoice?.options).toHaveLength(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "hq_archives_shuffle_draw",
      cardDefinitionId: 400,
      sourceDefinitionId: 400,
      hiddenZoneAction: "hq_archives_shuffle_into_rd",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"archives"|"cardInstances"|"privatePayload"|simple_agenda/,
    );
    expect(state.corp.scoreArea).toEqual(
      expect.arrayContaining([firstCfo, secondCfo]),
    );
    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );
    expect(state.corp.hq).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      strategicPlanningGroupBaseDrawCount: 5,
      strategicPlanningGroupAdditionalDrawCount: 1,
      strategicPlanningGroupDrawnCardCount: 6,
      strategicPlanningGroupNetDrawCount: 5,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Corporate War and Political Coup source-bound and replay-stable", () => {
    let warState = createGameAfterSetup({
      seed: "spotcheck-corporate-war-exact-12",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          { id: 408, quantity: 2 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    });
    warState = apply(
      warState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    warState.corp.credits = 12;
    warState.corp.clicks = 10;
    const warId = putCorpRootInRemote(warState, 408);
    warState.cardInstances[warId] = {
      ...warState.cardInstances[warId]!,
      advancementCounters: 3,
    };
    // Pairing 422 D222: a free nonterminal score can retain the whole
    // current-turn reward by taking its one missing basic credit first.
    const unfunded = structuredClone(warState);
    unfunded.corp.credits = 11;
    unfunded.corp.clicks = 1;
    const scoreWar = (action: LegalAction) =>
      action.type === "score_agenda" &&
      sourceDefinition(unfunded, action) === 408;
    expect(getLegalActions(unfunded, "corp").find(scoreWar)?.costs).toEqual([]);
    let scoreFirst = apply(structuredClone(unfunded), "corp", scoreWar);
    expect(scoreFirst.corp.credits).toBe(0);
    scoreFirst = apply(
      scoreFirst,
      "corp",
      (action) => action.type === "gain_credit",
    );
    let fundFirst = apply(
      structuredClone(unfunded),
      "corp",
      (action) => action.type === "gain_credit",
    );
    expect(fundFirst.corp).toMatchObject({ credits: 12, clicks: 0 });
    fundFirst = apply(fundFirst, "corp", scoreWar);
    expect(getPlayerView(fundFirst, "corp").own).toMatchObject({
      credits: 24,
      clicks: 0,
      agendaPoints: 3,
    });
    expect(getPlayerView(scoreFirst, "corp").own).toMatchObject({
      credits: 1,
      clicks: 0,
      agendaPoints: 3,
    });
    expect(fundFirst.turnSerial).toBe(scoreFirst.turnSerial);
    expect(
      replayEvents(unfunded, fundFirst.eventLog.slice(unfunded.eventLog.length))
        .ok,
    ).toBe(true);
    // Pairing 422 D189: below an unreachable threshold, reverse the order.
    const belowThreshold = structuredClone(unfunded);
    belowThreshold.corp.credits = 6;
    const resetThenCredit = apply(
      apply(structuredClone(belowThreshold), "corp", scoreWar),
      "corp",
      (action) => action.type === "gain_credit",
    );
    const creditThenReset = apply(
      apply(
        structuredClone(belowThreshold),
        "corp",
        (action) => action.type === "gain_credit",
      ),
      "corp",
      scoreWar,
    );
    expect(getPlayerView(resetThenCredit, "corp").own).toMatchObject({
      credits: 1,
      clicks: 0,
      agendaPoints: 3,
    });
    expect(getPlayerView(creditThenReset, "corp").own).toMatchObject({
      credits: 0,
      clicks: 0,
      agendaPoints: 3,
    });
    expect(resetThenCredit.turnSerial).toBe(creditThenReset.turnSerial);
    const resetReplay = replayEvents(
      belowThreshold,
      resetThenCredit.eventLog.slice(belowThreshold.eventLog.length),
    );
    expect(resetReplay.ok).toBe(true);
    expect(hashState(resetReplay.state)).toBe(hashState(resetThenCredit));
    const warInitial = structuredClone(warState);
    const warReplayStart = warState.eventLog.length;
    warState = apply(
      warState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(warState, action) === 408,
    );
    expect(warState.corp.credits).toBe(24);
    expect(warState.eventLog.at(-1)?.publicPayload).toMatchObject({
      scoreCreditSwingThresholdMet: true,
      onScoreGainCredits: 12,
    });
    expect(
      replayEvents(warInitial, warState.eventLog.slice(warReplayStart)).ok,
    ).toBe(true);

    let coupState = createGameAfterSetup({
      seed: "spotcheck-political-coup",
      runnerDeck: ONR_V1_8_1_RUNNER_DECK,
      corpDeck: ONR_V1_8_1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    coupState = apply(
      coupState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const payoutSetup = structuredClone(coupState);
    payoutSetup.corp.credits = 3;
    payoutSetup.corp.clicks = 1;
    const scoreableCoup = putCorpRootInRemote(
      payoutSetup,
      421,
    );
    payoutSetup.cardInstances[scoreableCoup]!.advancementCounters = 4;
    const scoreCoup = (action: LegalAction) =>
      action.type === "score_agenda" && action.source === scoreableCoup;
    const scoreThenPayout = apply(
      apply(structuredClone(payoutSetup), "corp", scoreCoup),
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === scoreableCoup,
    );
    const creditThenScore = apply(
      apply(
        structuredClone(payoutSetup),
        "corp",
        (action) => action.type === "gain_credit",
      ),
      "corp",
      scoreCoup,
    );
    expect(getPlayerView(scoreThenPayout, "corp").own).toMatchObject({
      credits: 6,
      clicks: 0,
      agendaPoints: 2,
    });
    expect(getPlayerView(creditThenScore, "corp").own).toMatchObject({
      credits: 4,
      clicks: 0,
      agendaPoints: 2,
    });
    const payoutReplay = replayEvents(
      payoutSetup,
      scoreThenPayout.eventLog.slice(payoutSetup.eventLog.length),
    );
    expect(payoutReplay.ok).toBe(true);
    expect(hashState(payoutReplay.state)).toBe(hashState(scoreThenPayout));
    const firstCoup = scoreCorpAgendaForTest(
      coupState,
      421,
    );
    const secondCoup = scoreCorpAgendaForTest(
      coupState,
      421,
    );
    setCardCounterForTest(coupState, firstCoup, "bit", 12);
    setCardCounterForTest(coupState, secondCoup, "bit", 12);
    const coup = mustAction(
      coupState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === secondCoup,
    );
    const coupInitial = structuredClone(coupState);
    coupState = apply(
      coupState,
      "corp",
      (action) => action.actionId === coup.actionId,
    );
    expect(cardCounterAmount(coupState, firstCoup, "bit")).toBe(12);
    expect(cardCounterAmount(coupState, secondCoup, "bit")).toBe(9);
    expect(coupState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      hostedCreditsTaken: 3,
      hostedCreditsAfter: 9,
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 3,
          remainingCounters: 9,
          sourceDefinitionId: 421,
        }),
      ],
    });
    expect(
      replayEvents(
        coupInitial,
        coupState.eventLog.slice(coupInitial.eventLog.length),
      ).ok,
    ).toBe(true);
  });

  it("resolves Cinderella and Homewrecker as unpreventable hardware-trash trace ICE", () => {
    for (const [definitionId, traceValue] of [
      [440, 6],
      [460, 5],
    ] as const) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.traceTags(`spotcheck-${definitionId}`),
      );
      state.runner.credits = 20;
      state.corp.credits = 20;
      const armadilloId = installRunnerHardwareForTest(
        state,
        332,
      );
      const trodeSetId = installRunnerHardwareForTest(
        state,
        344,
      );
      installRunnerResourceForTest(
        state,
        379,
      );
      putCorpIceOnServer(state, "rd", definitionId);
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.trace).toMatchObject({ traceLimit: traceValue });
      state = applyChoice(state, "corp", `bid_${traceValue}`);
      state = applyChoice(state, "runner", "bid_0");
      expect(state.runner.tags).toBe(0);
      expect(state.pendingChoice).toMatchObject({
        side: "corp",
        source: expect.stringContaining("trace_success.hardware_wrecker"),
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceSuccessful: true,
        tagsAdded: 0,
        traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      });
      state = applyChoice(state, "corp", `hardware_${trodeSetId}`);
      expect(state.pendingChoice).toBeUndefined();
      expect(state.run).toBeUndefined();
      expect(state.activeSide).toBe("runner");
      expect(getLegalActions(state, "runner").length).toBeGreaterThan(0);
      expect(state.runner.rig.hardware).toContain(armadilloId);
      expect(state.runner.rig.hardware).not.toContain(trodeSetId);
      expect(state.runner.heap.length).toBeGreaterThan(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceSuccessEffect: "hardware_trash_meat_damage_end_run",
        trashedCount: 1,
        damageCannotBePrevented: true,
        damageAmount: 2,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /grip|stack|cardInstances|privatePayload/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));

      let miss = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.traceTags(`spotcheck-${definitionId}-miss`),
      );
      miss.runner.credits = 20;
      miss.corp.credits = 20;
      installRunnerHardwareForTest(miss, 344);
      putCorpIceOnServer(miss, "rd", definitionId);
      miss = apply(
        miss,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      miss = apply(
        miss,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(miss, action) === definitionId,
      );
      miss = apply(miss, "runner", (action) => action.type === "continue_run");
      miss = applyChoice(miss, "corp", "bid_0");
      miss = applyChoice(miss, "runner", "bid_20");
      expect(miss.run?.phase).toBe("encounter_ice");
      expect(
        miss.runner.heap.some(
          (id) =>
            miss.cardInstances[id]?.definitionId ===
            344,
        ),
      ).toBe(false);
    }
  });

  it("documents Cinderella failure without keeping stale break options or applying break costs", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags(
        "spotcheck-cinderella-failed-trace-break-cost",
      ),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const hardwareId = installRunnerHardwareForTest(
      state,
      332,
    );
    const replicatorId = installRunnerProgramForTest(
      state,
      268,
    );
    state.cardInstances[replicatorId] = {
      ...state.cardInstances[replicatorId]!,
      strengthModifier: 4,
    };
    putCorpIceOnServer(state, "rd", 440);
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
        sourceDefinition(state, action) === 440,
    );
    const visibleBreakBeforeTrace = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === 268,
    );
    expect(visibleBreakBeforeTrace.payload).toMatchObject({
      targetIceDefinitionId: 440,
      targetIceTitle: "Cinderella",
      subroutineIndex: 0,
      breakSubroutineBaseCost: 0,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    const creditsBeforeRunnerBid = state.runner.credits;
    const heapBeforeRunnerBid = state.runner.heap.length;
    state = applyChoice(state, "runner", "bid_6");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      sourceDefinitionId: 440,
      traceSuccessful: false,
      corpBid: 0,
      runnerBid: 6,
      traceValue: 6,
      runnerStrength: 6,
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toMatchObject({
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
    });
    expect(state.runner.credits).toBe(creditsBeforeRunnerBid - 6);
    expect(state.runner.heap).toHaveLength(heapBeforeRunnerBid);
    expect(state.runner.rig.hardware).toContain(hardwareId);
    expect(state.run?.phase).toBe("encounter_ice");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === 268,
      ),
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: visibleBreakBeforeTrace.actionId,
        clientKnownStateVersion: state.stateVersion,
      }).ok,
    ).toBe(false);

    let successful = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-cinderella-success-trace-cost"),
    );
    successful.runner.credits = 20;
    successful.corp.credits = 20;
    const successfulHardwareId = installRunnerHardwareForTest(
      successful,
      332,
    );
    putCorpIceOnServer(successful, "rd", 440);
    successful = apply(
      successful,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    successful = apply(
      successful,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(successful, action) === 440,
    );
    successful = apply(
      successful,
      "runner",
      (action) => action.type === "continue_run",
    );
    successful = applyChoice(successful, "corp", "bid_1");
    const runnerCreditsBeforeSuccessBid = successful.runner.credits;
    successful = applyChoice(successful, "runner", "bid_0");
    expect(successful.runner.credits).toBe(runnerCreditsBeforeSuccessBid);
    expect(successful.run).toBeUndefined();
    expect(successful.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
    });
    successful = applyChoice(
      successful,
      "corp",
      `hardware_${successfulHardwareId}`,
    );
    expect(successful.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      trashedCount: 1,
      damageAmount: 2,
    });
  });

  it("lets Umbrella Policy protect Cinderella hardware and still applies boosted unpreventable meat damage", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-cinderella-pipeline",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.runner,
          id: "spotcheck_cinderella_pipeline_runner",
          cards: [
            ...MECHANIC_SMOKE_DECKS.damagePrevention.runner.cards,
            { id: 332, quantity: 1 },
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.corp,
          id: "spotcheck_cinderella_pipeline_corp",
          cards: [
            ...MECHANIC_SMOKE_DECKS.damagePrevention.corp.cards,
            { id: 402, quantity: 1 },
            { id: 440, quantity: 1 },
          ],
        },
        agendaPointsToWin: 99,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    drawRunnerCardsForTest(state, 6);
    const hardwareId = installRunnerHardwareForTest(
      state,
      332,
    );
    const umbrellaId = installRunnerResourceForTest(
      state,
      398,
    );
    const bioweaponsId = moveCorpCardToHq(
      state,
      402,
    );
    state.corp.hq = state.corp.hq.filter((cardId) => cardId !== bioweaponsId);
    state.corp.scoreArea.push(bioweaponsId);
    state.cardInstances[bioweaponsId] = {
      ...state.cardInstances[bioweaponsId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "rd", 440);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_6");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.run).toBeUndefined();
    state = applyChoice(state, "corp", `hardware_${hardwareId}`);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    const umbrellaOption = state.pendingChoice?.options.find((option) =>
      option.label.includes("Umbrella"),
    );
    if (!umbrellaOption) throw new Error("Umbrella-Prevention fehlt.");
    const gripBeforeDamage = state.runner.grip.length;
    state = applyChoice(state, "runner", umbrellaOption.id);
    while (state.pendingChoice) {
      const next = state.pendingChoice.source.startsWith(
        "v120.event_modification.trash_targets:",
      )
        ? state.pendingChoice.options[0]
        : state.pendingChoice.options.find(
            (option) => option.id === "pass" || option.id.endsWith("_0"),
          );
      if (!next) throw new Error("Cinderella-Damage-Fortsetzung fehlt.");
      state = applyChoice(state, state.pendingChoice.side, next.id);
    }

    expect(state.runner.rig.hardware).toContain(hardwareId);
    expect(state.runner.rig.resources).not.toContain(umbrellaId);
    expect(state.runner.heap).toContain(umbrellaId);
    expect(state.runner.grip).toHaveLength(gripBeforeDamage - 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      trashedCount: 0,
      damageCannotBePrevented: true,
      printedDamageAmount: 2,
      damageAmount: 3,
      cardsTrashed: 3,
    });
  });

  it("routes Fatal Attractor post-encounter Net damage through normal prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-fatal-attractor-prevention",
        runnerDeck: MECHANIC_SMOKE_DECKS.damagePrevention.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.corp,
          id: "spotcheck_fatal_attractor_prevention_corp",
          cards: [
            ...MECHANIC_SMOKE_DECKS.damagePrevention.corp.cards,
            { id: 454, quantity: 1 },
            { id: 589, quantity: 1 },
          ],
        },
        agendaPointsToWin: 99,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    drawRunnerCardsForTest(state, 6);
    installRunnerHardwareForTest(
      state,
      340,
    );
    putCorpIceOnServer(state, "rd", 589);
    putCorpIceOnServer(state, "rd", 454);
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
        sourceDefinition(state, action) === 454,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === 589,
    );
    const gripBeforeDamage = state.runner.grip.length;
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    expect(state.run?.fatalDamageActiveForEncounter).toBe(false);
    const preventOne = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    );
    if (!preventOne) throw new Error("Fatal-Attractor-Prevention fehlt.");
    state = applyChoice(state, "runner", preventOne.id);

    expect(state.runner.grip).toHaveLength(gripBeforeDamage - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
    });
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("resolves every Cerberus counter as its own preventable run-start damage source", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-cerberus-preventable-sources",
        runnerDeck: MECHANIC_SMOKE_DECKS.damagePrevention.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.corp,
          id: "spotcheck_cerberus_preventable_sources_corp",
          cards: [
            ...MECHANIC_SMOKE_DECKS.damagePrevention.corp.cards,
            { id: 439, quantity: 1 },
          ],
        },
        agendaPointsToWin: 99,
      }),
    );
    drawRunnerCardsForTest(state, 6);
    installRunnerHardwareForTest(
      state,
      340,
    );
    setCardCounterForTest(state, state.runner.identity, "cerberus", 2);
    putCorpIceOnServer(state, "rd", 439);
    const initial = structuredClone(state);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.pendingRunStartDamageContinuation).toMatchObject({
      counterType: "cerberus",
      nextCounterOrdinal: 1,
      counterCount: 2,
      amountPerCounter: 2,
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    const preventOne = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    );
    if (!preventOne) throw new Error("Cerberus-Prevention fehlt.");
    state = applyChoice(state, "runner", preventOne.id);

    expect(state.pendingRunStartDamageContinuation).toBeUndefined();
    expect(state.runner.grip).toHaveLength(gripBefore - 3);
    expect(state.run?.phase).toBe("approach_ice");
    expect(state.run?.approachedIceId).toBeDefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      counterType: "cerberus",
      cerberusCounterCount: 2,
      damageAmount: 3,
      cardsTrashed: 3,
    });
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("resolves every Mastiff counter as its own preventable run-start damage source", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-mastiff-preventable-sources",
        runnerDeck: MECHANIC_SMOKE_DECKS.damagePrevention.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.corp,
          id: "spotcheck_mastiff_preventable_sources_corp",
          cards: [
            ...MECHANIC_SMOKE_DECKS.damagePrevention.corp.cards,
            { id: 467, quantity: 1 },
          ],
        },
        agendaPointsToWin: 99,
      }),
    );
    drawRunnerCardsForTest(state, 6);
    const lifesaverId = installRunnerHardwareForTest(
      state,
      342,
    );
    setCardCounterForTest(state, state.runner.identity, "mastiff", 2);
    putCorpIceOnServer(state, "rd", 467);
    const initial = structuredClone(state);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.pendingRunStartDamageContinuation).toMatchObject({
      counterType: "mastiff",
      damageType: "core",
      nextCounterOrdinal: 1,
      counterCount: 2,
      amountPerCounter: 1,
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    const preventOne = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    );
    if (!preventOne) throw new Error("Mastiff-Core-Damage-Prevention fehlt.");
    state = applyChoice(state, "runner", preventOne.id);

    expect(state.pendingRunStartDamageContinuation).toBeUndefined();
    expect(state.runner.grip).toHaveLength(gripBefore - 1);
    expect(state.runner.coreDamage).toBe(1);
    expect(state.runner.heap).toContain(lifesaverId);
    expect(state.run?.phase).toBe("approach_ice");
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("lets the Runner order multiple own start-of-run sources before Corp counter effects", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-run-start-controller-order",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.runner,
          id: "spotcheck_run_start_controller_order_runner",
          cards: [
            ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards,
            { id: 214, quantity: 1 },
            { id: 396, quantity: 1 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.runAccess.corp,
        agendaPointsToWin: 99,
      }),
    );
    const aiBoonId = installRunnerProgramForTest(state, 214);
    const conferenceId = installRunnerResourceForTest(
      state,
      396,
    );
    drawRunnerCardsForTest(state, 6);
    setCardCounterForTest(state, state.runner.identity, "cerberus", 1);
    putCorpIceOnServer(state, "rd", 439);
    const initial = structuredClone(state);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.pendingRunStartSourceOrder?.remaining).toHaveLength(2);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("runner_run_start.order"),
    });
    const conferenceOption = state.pendingChoice?.options.find(
      (option) => option.value === `card_implementation:${conferenceId}`,
    );
    if (!conferenceOption) throw new Error("Run-Start-Ordering fehlt.");
    state = applyChoice(state, "runner", conferenceOption.id);

    expect(state.pendingRunStartSourceOrder).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.rig.resources).not.toContain(conferenceId);
    expect(state.runner.heap).toContain(conferenceId);
    expect(
      state.run?.runStartRandomStrengthByBreaker?.[aiBoonId],
    ).toBeGreaterThanOrEqual(1);
    expect(state.runner.grip).toHaveLength(gripBefore - 2);
    expect(state.run?.phase).toBe("approach_ice");
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("places Management Shake-Up advancement counters and scales Shattered Remains hardware trash", () => {
    let state = MECHANIC_SMOKE_GAMES.agendaScoring(
      "spotcheck-management-shake-up",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 10;
    const agendaId = putCorpRootInRemote(
      state,
      414,
    );
    const virusId = putCorpRootInRemote(state, 560);
    state.cardInstances[virusId] = {
      ...state.cardInstances[virusId]!,
      faceup: true,
    };
    moveCorpCardToHq(state, 504);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 504,
    );
    const managementOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${agendaId}:2|${virusId}:1`,
    );
    expect(managementOption).toBeDefined();
    state = applyChoices(state, "corp", [managementOption?.id ?? ""]);
    expect(
      (state.cardInstances[agendaId]?.advancementCounters ?? 0) +
        (state.cardInstances[virusId]?.advancementCounters ?? 0),
    ).toBe(3);
    const advancementPayload = state.eventLog.at(-1)?.publicPayload;
    expect(advancementPayload).toMatchObject({
      abilityId: "add_advancement_counters",
      addedAdvancementCounters: 3,
      targetCount: 2,
      publicTargetCount: 1,
      hiddenTargetCount: 1,
      targetVisibility: "mixed_public_and_hidden_installed_cards",
      targetCardDefinitionIds: "560",
    });
    expect(advancementPayload).not.toHaveProperty("targetCardDefinitionId");
    expect(JSON.stringify(advancementPayload)).not.toMatch(
      /onr_v1_202_genetics-visionary-acquisition|cardInstances|privatePayload/,
    );
    expect(JSON.stringify(advancementPayload)).not.toContain(agendaId);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let access = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-shattered-remains",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          cards: [
            { id: 602, quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards.filter(
              (card) => card.id !== 602,
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
        agendaPointsToWin: 7,
      }),
    );
    access.runner.credits = 20;
    const firstHardware = installRunnerHardwareForTest(
      access,
      602,
    );
    const secondHardware = moveRunnerCardCopyToGrip(
      access,
      602,
    );
    removeEverywhere(access, secondHardware);
    access.runner.rig.hardware.push(secondHardware);
    access.cardInstances[secondHardware] = {
      ...access.cardInstances[secondHardware]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    const shatteredId = putCorpRootInRemote(
      access,
      527,
    );
    access.cardInstances[shatteredId] = {
      ...access.cardInstances[shatteredId]!,
      advancementCounters: 2,
    };
    const accessInitial = structuredClone(access);
    const accessReplayStart = access.eventLog.length;
    access = apply(
      access,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    access = apply(
      access,
      "runner",
      (action) => action.type === "continue_run",
    );
    access = apply(
      access,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(access, action) ===
          527,
    );
    access = passRootRezWindowBeforeAccessIfOpen(access);
    access = apply(access, "runner", (action) => action.type === "access_card");
    expect(access.pendingChoice).toMatchObject({
      side: "corp",
      source: "card_implementation.runner_installed_multi_trash",
      minSelections: 2,
      maxSelections: 2,
      selectionOrdering: "ordered",
    });
    const orderedHardwareOptions = [secondHardware, firstHardware].map(
      (hardwareId) =>
        access.pendingChoice?.options.find(
          (option) => option.value === hardwareId,
        )?.id ?? "",
    );
    access = applyChoices(access, "corp", orderedHardwareOptions);
    expect(access.runner.heap).toEqual(
      expect.arrayContaining([secondHardware, firstHardware]),
    );
    expect(access.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: 527,
      advancementCounterCount: 2,
      trashedCount: 2,
    });
    expect(
      replayEvents(accessInitial, access.eventLog.slice(accessReplayStart)).ok,
    ).toBe(true);
  });

  it("opens a minimal Runner MU checkpoint after Shattered Remains trashes WuTech", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "regression-shattered-remains-wutech-memory-checkpoint",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          cards: [
            { id: 357, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards.filter(
              (card) => card.id !== 602,
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const wuTechId = installRunnerHardwareForTest(
      state,
      357,
    );
    expect(
      CARD_DEFINITIONS_BY_ID[357]?.memoryLimitBonus,
    ).toBe(1);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.definitionId === 357,
      )?.memoryLimitBonus,
    ).toBe(1);
    const installedProgramIds = [
      installRunnerProgramForTest(state, 591),
      installRunnerProgramCopyForTest(state, 591),
      installRunnerProgramForTest(state, 597),
      installRunnerProgramCopyForTest(state, 597),
      installRunnerProgramForTest(state, 598),
    ];
    expect(state.runner.memoryUsed).toBe(5);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(5);

    const shatteredId = putCorpRootInRemote(
      state,
      527,
    );
    state.cardInstances[shatteredId] = {
      ...state.cardInstances[shatteredId]!,
      advancementCounters: 1,
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
        sourceDefinition(state, action) ===
          527,
    );
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "decline_rez",
      ),
    ).toBe(false);
    state = passRootRezWindowBeforeAccessIfOpen(state);

    const accessAction = mustAction(
      state,
      "runner",
      (action) => action.type === "access_card",
    );
    const accessResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: accessAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "shattered-remains-wutech-access",
    });
    expect(accessResult.ok).toBe(true);
    if (!accessResult.ok) throw new Error(accessResult.error.message);
    state = accessResult.state;
    expect(state.runner.heap).toContain(wuTechId);
    expect(state.runner.memoryUsed).toBe(5);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(4);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringMatching(/^runner\.checkpoint_memory_cleanup:/),
      prompt: "Programme für das MU-Limit trashen",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: installedProgramIds.length,
      visibility: "hidden_info_barrier",
    });
    expect(
      state.pendingChoice?.options.map((option) => option.value).sort(),
    ).toEqual(installedProgramIds.slice().sort());
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();

    const choiceAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const selectedOptionIds =
      state.pendingChoice?.options.map((option) => option.id) ?? [];
    const wrongSideResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "shattered-remains-wutech-wrong-side",
    });
    expect(wrongSideResult.ok).toBe(false);
    if (!wrongSideResult.ok)
      expect(wrongSideResult.error.code).toBe("ERR_WRONG_SIDE");

    const staleResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: selectedOptionIds.slice(0, 1),
      },
      idempotencyKey: "shattered-remains-wutech-stale",
    });
    expect(staleResult.ok).toBe(false);
    if (!staleResult.ok) expect(staleResult.error.code).toBe("ERR_STALE_STATE");

    const insufficientResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [],
      },
      idempotencyKey: "shattered-remains-wutech-insufficient",
    });
    expect(insufficientResult.ok).toBe(false);
    if (!insufficientResult.ok)
      expect(insufficientResult.error.code).toBe("ERR_INVALID_CHOICE");

    const nonMinimalResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: selectedOptionIds.slice(0, 2),
      },
      idempotencyKey: "shattered-remains-wutech-non-minimal",
    });
    expect(nonMinimalResult.ok).toBe(false);
    if (!nonMinimalResult.ok) {
      expect(nonMinimalResult.error.message).toContain("nicht minimal");
    }

    const selectedOption = state.pendingChoice?.options[0];
    expect(selectedOption).toBeDefined();
    const trashedProgramId = selectedOption?.value as CardInstanceId;
    const trashedProgramDefinitionId =
      state.cardInstances[trashedProgramId]?.definitionId;
    expect(trashedProgramDefinitionId).toBeDefined();
    state = applyChoice(state, "runner", selectedOption?.id ?? "");

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.memoryUsed).toBe(4);
    expect(state.runner.heap).toContain(trashedProgramId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerMemoryCheckpointResolved: true,
      runnerMemoryDeficit: 1,
      memoryFreed: 1,
      trashedProgramCount: 1,
      trashedCardDefinitionIds: String(trashedProgramDefinitionId),
      runnerMemoryUsedAfter: 4,
      runnerMemoryLimitAfter: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      trashedProgramId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trash_accessed_card" ||
          action.type === "decline_trash",
      ),
    ).toBe(true);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Ball and Chain tax and Tokyo-Chiba Infighting run bonus scoped to the current run/server", () => {
    let taxState = toRunnerTurn(
      v181CardReleaseGame("spotcheck-ball-chain-tax"),
    );
    taxState.runner.credits = 0;
    taxState.corp.credits = 20;
    putCorpIceOnServer(taxState, "rd", 589);
    putCorpIceOnServer(taxState, "rd", 434);
    taxState = apply(
      taxState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    taxState = apply(
      taxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(taxState, action) === 434,
    );
    taxState = apply(
      taxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const initial = structuredClone(taxState);
    const replayStart = taxState.eventLog.length;
    taxState = apply(
      taxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    taxState = apply(
      taxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(taxState, action) === 589,
    );
    expect(taxState.run).toBeUndefined();
    expect(taxState.eventLog.at(-1)?.publicPayload).toMatchObject({
      encounterTaxForFutureIce: 2,
      encounterTaxPaid: 0,
      encounterTaxSource: 434,
      result: "ended",
    });
    expect(replayEvents(initial, taxState.eventLog.slice(replayStart)).ok).toBe(
      true,
    );

    let tokyo = v163CardReleaseGame("spotcheck-tokyo-chiba-bonus");
    tokyo = apply(tokyo, "corp", (action) => action.type === "mandatory_draw");
    tokyo.corp.credits = 10;
    tokyo.corp.clicks = 3;
    const tokyoId = putCorpRootInRemote(
      tokyo,
      583,
    );
    putCorpIceOnServer(tokyo, "remote_1", 444);
    tokyo.cardInstances[tokyoId] = {
      ...tokyo.cardInstances[tokyoId]!,
      faceup: true,
      rezzed: true,
    };
    tokyo = toRunnerTurnFromCorpMain(tokyo);
    tokyo = apply(
      tokyo,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    tokyo = apply(
      tokyo,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tokyo, action) === 444,
    );
    const creditsBefore = tokyo.corp.credits;
    tokyo = apply(tokyo, "runner", (action) => action.type === "continue_run");
    expect(tokyo.corp.credits).toBe(creditsBefore + 2);
    expect(tokyo.eventLog.at(-1)?.publicPayload).toMatchObject({
      unsuccessfulRunCorpCreditBonus: true,
      corpCreditsGained: 2,
      corpCreditsAfter: creditsBefore + 2,
    });
  });
});
