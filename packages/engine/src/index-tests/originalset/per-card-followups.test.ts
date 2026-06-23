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

describe("Originalset Spotcheck 2026-05-15 Ramming/Galveston Nachtest", () => {
  it("uses Ramming Piston as a wall breaker with exact Stealth follow-up loss", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-ramming-piston",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_ramming_runner",
          name: "Spotcheck Ramming Runner",
          cards: [
            { id: "onr_v1_053_ramming-piston", quantity: 1 },
            { id: "onr_v1_011_cloak", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_011_cloak");
    moveRunnerCardToGrip(state, "onr_v1_053_ramming-piston");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === "onr_v1_011_cloak",
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    expect(cloakId).toBeDefined();
    if (!cloakId) throw new Error("Missing Cloak");
    setCardCounterForTest(state, cloakId, "bit", 5);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_053_ramming-piston",
    );
    const rammingId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_053_ramming-piston",
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
        sourceDefinition(state, action) === "onr_v1_053_ramming-piston",
    );
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_053_ramming-piston",
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
            { id: "onr_v1_053_ramming-piston", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: "onr_v1_237_data-wall", quantity: 1 },
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
    moveRunnerCardToGrip(state, "onr_v1_053_ramming-piston");
    const iceId = putCorpIceOnServer(state, "remote_1", "onr_v1_237_data-wall");
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_053_ramming-piston",
    );
    const rammingId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_053_ramming-piston",
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
        sourceDefinition(state, action) === "onr_v1_053_ramming-piston",
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
      cardDefinitionId: "onr_v1_053_ramming-piston",
      targetIceDefinitionId: "onr_v1_237_data-wall",
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
    moveRunnerCardToGrip(state, "onr_v1_064_skivviss");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_064_skivviss",
    );
    const skivvissId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_064_skivviss",
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
    expect(cardCounterAmount(state, skivvissId, "virus")).toBe(1);
    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const visibleSkivviss = runnerView.own.rig?.find(
      (card) => card.instanceId === skivvissId,
    );
    const runnerCorpSkivvissDisplay =
      runnerView.opponent.identity.counterDisplays?.find(
        (display) => display.id === "skivviss",
      );
    const corpSkivvissDisplay = corpView.own.identity.counterDisplays?.find(
      (display) => display.id === "skivviss",
    );
    expect(visibleSkivviss?.counters?.virus).toBeUndefined();
    expect(
      visibleSkivviss?.counterDisplays?.some(
        (display) => display.id === "virus" || display.id === "skivviss",
      ),
    ).not.toBe(true);
    expect(runnerCorpSkivvissDisplay).toMatchObject({
      amount: 1,
      label: "Skivviss-Counter",
      ariaLabel: "1 Skivviss-Counter auf der Korp",
    });
    expect(corpSkivvissDisplay).toMatchObject({
      amount: 1,
      label: "Skivviss-Counter",
    });
    const hqBeforeCorpTurn = state.corp.hq.length;
    state.corp.maxHandSize = 100;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.hq.length).toBe(hqBeforeCorpTurn + 1);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "draw_cards",
        side: "corp",
        amount: 1,
        sourceDefinitionId: "onr_v1_064_skivviss",
        sourceTitle: "Skivviss",
      }),
    );
  });

  it("adds Cascade counters to the Corp on successful R&D runs and hides them from the source program", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-cascade-rd"),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_010_cascade");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_010_cascade",
    );
    const cascadeId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_010_cascade",
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
        (display) => display.id === "virus" || display.id === "runner_virus_corp_cascade",
      ),
    ).not.toBe(true);
    expect(
      runnerView.opponent.identity.counterDisplays?.find(
        (display) => display.id === "runner_virus_corp_cascade",
      ),
    ).toMatchObject({
      amount: 1,
      label: "Cascade-Counter",
      ariaLabel: "1 Cascade-Counter auf der Korp",
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
        sourceDefinitionId: "onr_v1_010_cascade",
      }),
    );
  });

  it("uses P3.49 virus CardImplementations for hidden looks, Cascade trash and Gremlins hand size", () => {
    const p349VirusCards = [
      "onr_v1_008_boardwalk",
      "onr_v1_009_butcher-boy",
      "onr_v1_013_cockroach",
      "onr_v1_010_cascade",
      "onr_v1_017_deep-thought",
      "onr_v1_025_fait-accompli",
      "onr_v1_029_gremlins",
      "onr_v1_034_incubator",
      "onr_v1_046_pattels-virus",
      "onr_v1_049_pox",
      "onr_v1_064_skivviss",
    ] as const;
    for (const definitionId of p349VirusCards) {
      expect(cardImplementationForDefinitionId(definitionId)?.virusCounter).toBeDefined();
      expect(cardImplementationCoverageForDefinitionId(definitionId)).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }
    const p349VirusGame = (
      seed: string,
      runnerCardIds: readonly string[],
    ): GameState =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          runnerDeck: {
            id: `${seed}_runner`,
            name: `${seed} Runner`,
            side: "runner",
            identity: "runner_identity_001",
            cards: [
              ...runnerCardIds.map((id) => ({ id, quantity: 1 })),
              { id: "simple_economy_event", quantity: 20 },
            ],
          },
          corpDeck: {
            id: `${seed}_corp`,
            name: `${seed} Corp`,
            side: "corp",
            identity: "corp_identity_001",
            cards: [
              { id: "simple_agenda", quantity: 6 },
              { id: "simple_economy_operation", quantity: 8 },
              { id: "onr_v1_279_wall-of-static", quantity: 2 },
            ],
          },
          agendaPointsToWin: 7,
        }),
      );

    let boardwalk = p349VirusGame("p349-boardwalk-hidden-look", [
      "onr_v1_008_boardwalk",
    ]);
    const boardwalkId = installRunnerProgramForTest(
      boardwalk,
      "onr_v1_008_boardwalk",
    );
    setCardCounterForTest(boardwalk, boardwalkId, "virus", 4);
    moveCorpCardToHq(boardwalk, "simple_economy_operation");
    moveCorpCardToHq(boardwalk, "onr_v1_279_wall-of-static");
    boardwalk.corp.maxHandSize = 100;
    boardwalk = apply(boardwalk, "runner", (action) => action.type === "end_turn");
    boardwalk = apply(boardwalk, "corp", (action) => action.type === "mandatory_draw");
    boardwalk = apply(boardwalk, "corp", (action) => action.type === "end_turn");
    expect(boardwalk.pendingChoice?.source).toContain(
      "p3_33.private_look:ability:onr_v1_008_boardwalk:hq",
    );
    expect(
      boardwalk.pendingChoice?.options.filter((option) =>
        String(option.id).startsWith("card_"),
      ),
    ).toHaveLength(2);
    expect(getPlayerView(boardwalk, "corp").pendingChoice).toBeUndefined();

    let thought = p349VirusGame("p349-deep-thought-hidden-look", [
      "onr_v1_017_deep-thought",
    ]);
    const thoughtId = installRunnerProgramForTest(thought, "onr_v1_017_deep-thought");
    setCardCounterForTest(thought, thoughtId, "virus", 3);
    putCorpCardOnTopOfRd(thought, "simple_economy_operation");
    thought.corp.maxHandSize = 100;
    thought = apply(thought, "runner", (action) => action.type === "end_turn");
    thought = apply(thought, "corp", (action) => action.type === "mandatory_draw");
    thought = apply(thought, "corp", (action) => action.type === "end_turn");
    expect(thought.pendingChoice?.source).toContain(
      "p3_33.private_look:ability:runner_onr_v1_017_deep-thought",
    );
    expect(getPlayerView(thought, "corp").pendingChoice).toBeUndefined();

    let cascade = p349VirusGame("p349-cascade-start-trash", [
      "onr_v1_010_cascade",
    ]);
    const cascadeId = installRunnerProgramForTest(cascade, "onr_v1_010_cascade");
    const rdFaceupId = putCorpCardOnTopOfRd(cascade, "simple_economy_operation");
    cascade.cardInstances[rdFaceupId] = {
      ...cascade.cardInstances[rdFaceupId]!,
      faceup: true,
    };
    expect(cardCounterAmount(cascade, cascadeId, "virus")).toBe(0);
    cascade.purgeableRunnerVirusCounters = { corp: { cascade: 2 } };
    cascade = apply(cascade, "runner", (action) => action.type === "end_turn");
    expect(cascade.corp.archives).toContain(rdFaceupId);
    expect(cascade.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "privatePayload",
    );

    const gremlins = p349VirusGame("p349-gremlins-hand-size", [
      "onr_v1_029_gremlins",
    ]);
    const gremlinsId = installRunnerProgramForTest(gremlins, "onr_v1_029_gremlins");
    gremlins.corp.maxHandSize = 6;
    setCardCounterForTest(gremlins, gremlinsId, "virus", 4);
    expect(getPlayerView(gremlins, "corp").own.maxHandSize).toBe(4);
    expect(getPlayerView(gremlins, "runner").opponent.maxHandSize).toBe(4);
  });

  it("uses The Short Circuit as a repeatable paid private stack tutor", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-short-circuit"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_177_the-short-circuit");
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_177_the-short-circuit",
    );
    const shortCircuitId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_177_the-short-circuit",
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
        sourceDefinition(state, action) === "onr_v1_177_the-short-circuit",
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
      sourceDefinitionId: "onr_v1_177_the-short-circuit",
      cardDefinitionId: "simple_decoder",
      publicRevealDefinitionId: "simple_decoder",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "trashOnUse",
    );
  });

  it("enforces Bodyweight Data Creche install cost, MU, deck replacement and bonus run", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-bodyweight-creche",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_bodyweight_runner",
          name: "Spotcheck Bodyweight Runner",
          cards: [
            { id: "onr_v1_122_artemis-2020", quantity: 1 },
            { id: "onr_v1_123_bodyweight-data-creche", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_122_artemis-2020");
    moveRunnerCardToGrip(state, "onr_v1_123_bodyweight-data-creche");
    state = apply(
      state,
      "runner",
      (action) => sourceDefinition(state, action) === "onr_v1_122_artemis-2020",
    );
    const oldDeckId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_122_artemis-2020",
    );
    const memoryBefore = state.runner.memoryLimit;
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_123_bodyweight-data-creche",
    );
    expect(state.runner.memoryLimit).toBeGreaterThanOrEqual(
      memoryBefore - 1,
    );
    if (oldDeckId) expect(state.runner.heap).toContain(oldDeckId);
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const bonusRun = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.bonusRunSource === "onr_v1_123_bodyweight-data-creche",
    );
    const clicksBeforeBonus = state.runner.clicks;
    expect(bonusRun.costs).not.toContainEqual(
      expect.objectContaining({ clicks: expect.any(Number) }),
    );
    state = apply(state, "runner", (action) => action.actionId === bonusRun.actionId);
    expect(state.runner.clicks).toBeLessThanOrEqual(clicksBeforeBonus);
  });

  it("lets the Runner remove Data Raven counters for an action and 1 credit", () => {
    let state = toRunnerTurn(v196CardReleaseGame("spotcheck-data-raven-remove"));
    state.runner.credits = 5;
    putCorpIceOnServer(state, "rd", "onr_v1_236_data-raven");
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
    expect(cardCounterAmount(state, state.runner.identity, "trace_tag_counter")).toBe(1);
    expect(state.runner.credits).toBe(4);
    expect(state.runner.clicks).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerAbility: "remove_runner_trace_counter",
      counterType: "trace_tag_counter",
      removedCounterAmount: 1,
      remainingCounters: 1,
    });
  });

  it("offers Experimental AI as a root rez before access and still resolves the ambush when declined", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-experimental-ai-root-rez-window",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.agendaScoring.runner,
          id: "spotcheck_experimental_ai_blink_runner",
          name: "Spotcheck Experimental AI Blink Runner",
          cards: [
            { id: "onr_v1_007_blink", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 4;
    const blinkId = installRunnerProgramForTest(state, "onr_v1_007_blink");
    const experimentalAiId = putCorpRootInRemote(
      state,
      "onr_v1_323_experimental-ai",
    );
    state.cardInstances[experimentalAiId] = {
      ...state.cardInstances[experimentalAiId]!,
      advancementCounters: 1,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.position).toEqual({ kind: "server", serverId: "remote_1" });
    expect(getLegalActions(state, "runner")).toEqual([]);
    const corpActions = getLegalActions(state, "corp");
    expect(corpActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "rez_ice",
          costs: [{ credits: 2 }],
          payload: expect.objectContaining({
            cardId: experimentalAiId,
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
    expect(state.cardInstances[experimentalAiId]?.rezzed).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.heap).toContain(blinkId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      advancementCounterCount: 1,
      trashedCount: 1,
      trashedCardDefinitionId: "onr_v1_007_blink",
      trashedCardDefinitionIds: "onr_v1_007_blink",
    });
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
            { id: "onr_v1_007_blink", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 4;
    const blinkId = installRunnerProgramForTest(state, "onr_v1_007_blink");
    const experimentalAiId = putCorpRootInRemote(
      state,
      "onr_v1_323_experimental-ai",
    );
    state.cardInstances[experimentalAiId] = {
      ...state.cardInstances[experimentalAiId]!,
      advancementCounters: 1,
    };

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
        sourceDefinition(state, action) === "onr_v1_323_experimental-ai",
    );

    expect(state.cardInstances[experimentalAiId]?.rezzed).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      cardDefinitionId: "onr_v1_323_experimental-ai",
    });
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runner.heap).toContain(blinkId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      ambushDefinitionId: "onr_v1_323_experimental-ai",
      trashedCardDefinitionId: "onr_v1_007_blink",
    });

    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    expect(state.corp.archives).toContain(experimentalAiId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trash_accessed_card",
      cardDefinitionId: "onr_v1_323_experimental-ai",
    });
  });

  it("uses Experimental AI advancement counters as the installed-program trash count", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-experimental-ai"),
    );
    installRunnerProgramForTest(state, "simple_decoder");
    installRunnerProgramForTest(state, "simple_fracter");
    const experimentalAiId = putCorpRootInRemote(
      state,
      "onr_v1_323_experimental-ai",
    );
    state.cardInstances[experimentalAiId] = {
      ...state.cardInstances[experimentalAiId]!,
      advancementCounters: 2,
    };
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
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runner.heap.map((id) => state.cardInstances[id]?.definitionId)).toEqual(
      expect.arrayContaining(["simple_decoder", "simple_fracter"]),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushDefinitionId: "onr_v1_323_experimental-ai",
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
            { id: "simple_economy_asset", quantity: 1 },
            { id: "onr_v1_362_new-galveston-city-grid", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    const assetId = putCorpRootInRemote(state, "simple_economy_asset");
    const gridId = putCorpRootInRemote(
      state,
      "onr_v1_362_new-galveston-city-grid",
    );
    const server = state.corp.servers.find((candidate) => candidate.id === "remote_1");
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
      "onr_v1_362_new-galveston-city-grid",
    );
    state = apply(state, "runner", (action) => action.actionId === trashAction.actionId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessTrashCostModifier: 2,
      accessTrashCostSourceDefinitionIds:
        "onr_v1_362_new-galveston-city-grid",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"rd"|R&D|cardInstances/,
    );
  });

  it("limits New Galveston trash_cost to same-fort assets and upgrades", () => {
    const p312Ids = new Set([
      "onr_v1_362_new-galveston-city-grid",
      "simple_agenda",
      "simple_upgrade",
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
              { id: "onr_v1_362_new-galveston-city-grid", quantity: 1 },
              { id: "simple_agenda", quantity: 1 },
              { id: "simple_upgrade", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
                (entry) => !p312Ids.has(entry.id),
              ),
            ],
          },
        }),
      );
    let upgradeState = newGalvestonGame("p312-new-galveston-upgrade");
    upgradeState.runner.credits = 20;
    const upgradeId = putCorpRootInRemote(upgradeState, "simple_upgrade");
    const gridId = putCorpRootInRemote(
      upgradeState,
      "onr_v1_362_new-galveston-city-grid",
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
    upgradeState = apply(upgradeState, "runner", (action) => action.type === "access_card");
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
      accessTrashCostSourceDefinitionIds:
        "onr_v1_362_new-galveston-city-grid",
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
      "onr_v1_362_new-galveston-city-grid",
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
    const otherUpgradeId = findCard(otherFort, "simple_upgrade");
    removeEverywhere(otherFort, otherUpgradeId);
    otherFort.corp.servers.find((candidate) => candidate.id === "remote_2")?.root.push(otherUpgradeId);
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
    otherFort = apply(otherFort, "runner", (action) => action.type === "access_card");
    expect(
      mustAction(otherFort, "runner", (action) => action.type === "trash_accessed_card")
        .costs,
    ).toEqual([{ credits: 4 }]);

    let agendaAccess = newGalvestonGame("p312-new-galveston-agenda");
    agendaAccess.runner.credits = 20;
    const agendaGridId = putCorpRootInRemote(
      agendaAccess,
      "onr_v1_362_new-galveston-city-grid",
    );
    const agendaId = putCorpRootInRemote(agendaAccess, "simple_agenda");
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
    agendaAccess = apply(agendaAccess, "runner", (action) => action.type === "access_card");
    expect(
      mustAction(agendaAccess, "runner", (action) => action.type === "steal_agenda")
        .costs,
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
      "onr_v1_097_livewires-contacts",
    );
    const livewire = mustAction(
      runnerState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(runnerState, action) ===
          "onr_v1_097_livewires-contacts",
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
      cardDefinitionId: "onr_v1_097_livewires-contacts",
      gainedCredits: 3,
      runnerCreditsAfter: runnerState.runner.credits,
      resolvedEffects: [
        expect.objectContaining({
          effectId:
            "onr_v1_097_livewires-contacts.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "runner",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_097_livewires-contacts",
          sourceTitle: "Livewire's Contacts",
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
    corpState = apply(corpState, "corp", (action) => action.type === "mandatory_draw");
    corpState.corp.credits = 5;
    corpState.corp.clicks = 3;
    const efficiencyId = moveCorpCardToHq(
      corpState,
      "onr_v1_290_efficiency-experts",
    );
    const efficiency = mustAction(
      corpState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(corpState, action) ===
          "onr_v1_290_efficiency-experts",
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
      cardDefinitionId: "onr_v1_290_efficiency-experts",
      gainedCredits: 3,
      corpCreditsAfter: corpState.corp.credits,
      resolvedEffects: [
        expect.objectContaining({
          effectId:
            "onr_v1_290_efficiency-experts.effect.0.gain_credits",
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_290_efficiency-experts",
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
          "simple_economy_event",
          "onr_v1_095_jack-n-joe",
          "onr_v1_097_livewires-contacts",
          "onr_v1_108_score",
          "onr_v1_145_wutech-mem-chip",
        ],
        5,
      ],
      [
        "spotcheck-bodyweight-short",
        ["simple_economy_event", "onr_v1_095_jack-n-joe"],
        2,
      ],
    ] as const) {
      let state = toRunnerTurn(v106kCardReleaseGame(seed));
      state.runner.credits = 10;
      state.runner.clicks = 4;
      const eventId = moveRunnerCardToGrip(
        state,
        "onr_v1_079_bodyweight-synthetic-blood",
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
            "onr_v1_079_bodyweight-synthetic-blood",
      );
      state = apply(state, "runner", (candidate) => candidate.actionId === action.actionId);
      expect(state.runner.heap).toContain(eventId);
      expect(state.runner.grip.length).toBe(gripBefore - 1 + expectedDrawn);
      expect(state.runner.stack).toHaveLength(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_event",
        cardDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
        drawnCount: expectedDrawn,
        runnerGripAfter: state.runner.grip.length,
        resolvedEffects: [
          expect.objectContaining({
            effectId:
              "onr_v1_079_bodyweight-synthetic-blood.effect.0.draw_cards",
            kind: "draw_cards",
            visibility: "public",
            side: "runner",
            amount: expectedDrawn,
            reason: "card_resolver",
            sourceDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
          }),
        ],
      });
      const publicPayload = JSON.stringify(state.eventLog.at(-1)?.publicPayload);
      expect(publicPayload).not.toMatch(
        /simple_economy_event|jack-n-joe|livewires|score|wutech|runner_/,
      );
      const corpOpponentView = JSON.stringify(getPlayerView(state, "corp").opponent);
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
        definitionId: "onr_v1_285_closed-accounts",
        cost: 1,
        assertAfter: (state: GameState) => {
          expect(state.runner.credits).toBe(0);
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            creditsLost: 7,
            runnerCreditsAfter: 0,
            resolvedEffects: [
              expect.objectContaining({
                effectId: "onr_v1_285_closed-accounts.effect.0.lose_credits",
                kind: "lose_credits",
                visibility: "public",
                side: "runner",
                amount: 7,
                reason: "card_resolver",
                sourceDefinitionId: "onr_v1_285_closed-accounts",
                sourceTitle: "Closed Accounts",
              }),
            ],
          });
        },
      },
      {
        definitionId: "onr_v1_287_datapool-by-zetatech",
        cost: 1,
        assertAfter: (state: GameState) => {
          expect(state.runner.tags).toBe(3);
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            tagsAdded: 2,
            runnerTagsAfter: 3,
            resolvedEffects: [
              expect.objectContaining({
                effectId: "onr_v1_287_datapool-by-zetatech.effect.0.add_tags",
                kind: "add_tags",
                visibility: "public",
                side: "runner",
                amount: 2,
                reason: "card_resolver",
                runnerTagsAfter: 3,
                sourceDefinitionId: "onr_v1_287_datapool-by-zetatech",
                sourceTitle: "Datapool® by Zetatech",
              }),
            ],
          });
        },
      },
      {
        definitionId: "onr_v1_301_punitive-counterstrike",
        cost: 0,
        assertAfter: (state: GameState) => {
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            damageResolved: true,
            damageType: "meat",
            damageAmount: 2,
            cardsTrashed: 2,
          });
          expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
            /runner_|grip|stack|cardInstances|privatePayload/,
          );
        },
      },
    ] as const) {
      let noTagState = createGameAfterSetup({
        seed: `spotcheck-no-tag-${spec.definitionId}`,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      });
      noTagState = apply(noTagState, "corp", (action) => action.type === "mandatory_draw");
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
      state = apply(state, "corp", (candidate) => candidate.actionId === action.actionId);
      expect(state.corp.archives.some((id) => state.cardInstances[id]?.definitionId === spec.definitionId)).toBe(true);
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
        definitionId: "onr_v1_293_netwatch-credit-voucher",
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
                  "onr_v1_293_netwatch-credit-voucher.effect.0.add_tags",
                kind: "add_tags",
                visibility: "public",
                side: "runner",
                amount: 1,
                runnerTagsAfter: 2,
                reason: "card_resolver",
                sourceDefinitionId: "onr_v1_293_netwatch-credit-voucher",
                sourceTitle: "Netwatch Credit Voucher",
              }),
              expect.objectContaining({
                effectId:
                  "onr_v1_293_netwatch-credit-voucher.effect.1.gain_credits",
                kind: "gain_credits",
                visibility: "public",
                side: "corp",
                amount: 1,
                reason: "card_resolver",
                sourceDefinitionId: "onr_v1_293_netwatch-credit-voucher",
                sourceTitle: "Netwatch Credit Voucher",
              }),
            ],
          });
        },
      },
      {
        definitionId: "onr_v1_301_punitive-counterstrike",
        cost: 0,
        damage: 2,
      },
      {
        definitionId: "onr_v1_302_scorched-earth",
        cost: 3,
        damage: 4,
      },
      {
        definitionId: "onr_v1_307_urban-renewal",
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
        expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
          /runner_|grip|stack|cardInstances|privatePayload/,
        );
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
    const soloId = moveCorpCardToHq(solo, "onr_v1_342_solo-squad");
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
        action.type === "rez_ice" &&
        sourceDefinition(solo, action) === "onr_v1_342_solo-squad",
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
    solo = apply(solo, "corp", (action) => action.actionId === soloAction.actionId);
    expect(solo.corp.clicks).toBe(soloClicksBefore - 1);
    expect(solo.runner.heap).toHaveLength(1);
    expect(solo.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_342_solo-squad",
      cardImplementationAbility: "activated",
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
      cardsTrashed: 1,
      resolvedEffects: [
        expect.objectContaining({
          effectId: "onr_v1_342_solo-squad.effect.0.damage",
          kind: "damage",
          side: "runner",
          amount: 1,
          damageType: "meat",
          cardsTrashed: 1,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_342_solo-squad",
          sourceTitle: "Solo Squad",
        }),
      ],
    });
    expect(JSON.stringify(solo.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /runner_|grip|stack|cardInstances|privatePayload/,
    );
    const soloReplay = replayEvents(soloInitial, solo.eventLog.slice(soloReplayStart));
    expect(soloReplay.ok).toBe(true);
    expect(hashState(soloReplay.state)).toBe(hashState(solo));

    const corpDeckWith = (definitionId: string): DeckDefinition => ({
      ...ONR_V1_CORP_DECK,
      id: `p33_${definitionId}_corp`,
      name: `P3.3 ${definitionId} Corp`,
      cards: [{ id: definitionId, quantity: 1 }, ...ONR_V1_CORP_DECK.cards],
    });

    for (const [definitionId, expectedDamage] of [
      ["onr_v1_208_on-call-solo-team", 1],
      ["onr_v1_217_strike-force-kali", 2],
    ] as const) {
      let state = createGameAfterSetup({
        seed: `p33-${definitionId}`,
        runnerDeck: ONR_V1_RUNNER_DECK,
        corpDeck: corpDeckWith(definitionId),
        agendaPointsToWin: 7,
      });
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
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
      state = apply(state, "corp", (candidate) => candidate.actionId === action.actionId);
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
    putCorpIceOnServer(state, "rd", "onr_v1_257_nerve-labyrinth");
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
        sourceDefinition(state, action) === "onr_v1_257_nerve-labyrinth",
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      sourceDefinitionId: "onr_v1_257_nerve-labyrinth",
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
    state = apply(state, "runner", (action) => action.actionId === continueAction.actionId);
    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: "onr_v1_257_nerve-labyrinth",
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

  it("keeps Pi in the 'Face and Endless Corridor subroutine indices side-safe", () => {
    let piState = toRunnerTurn(v112kCardReleaseGame("spotcheck-pi-face"));
    piState.runner.credits = 20;
    piState.corp.credits = 20;
    installRunnerProgramForTest(piState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(piState, "rd", "onr_v1_259_in-the-face");
    expect(JSON.stringify(getPlayerView(piState, "runner"))).not.toContain(
      "onr_v1_259_in-the-face",
    );
    const piInitial = structuredClone(piState);
    const piReplayStart = piState.eventLog.length;
    piState = apply(
      piState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    piState = apply(
      piState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(piState, action) === "onr_v1_259_in-the-face",
    );
    piState = enterEncounterFromMovementWindow(piState);
    expect(JSON.stringify(getPlayerView(piState, "runner"))).toContain(
      "onr_v1_259_in-the-face",
    );
    for (let pump = 0; pump < 3; pump += 1) {
      piState = apply(
        piState,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(piState, action) === "onr_v1_040_loony-goon",
      );
    }
    const piBreak = mustAction(
      piState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(piState, action) === "onr_v1_040_loony-goon",
    );
    expect(piBreak.payload).toMatchObject({
      subroutineIndex: 0,
      targetIceDefinitionId: "onr_v1_259_in-the-face",
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
    piState = apply(piState, "runner", (action) => action.actionId === piBreak.actionId);
    expect(piState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      subroutineIndex: 0,
      targetIceDefinitionId: "onr_v1_259_in-the-face",
    });
    piState = continueRunThroughMovementWindow(piState);
    const piReplay = replayEvents(piInitial, piState.eventLog.slice(piReplayStart));
    expect(piReplay.ok).toBe(true);
    expect(hashState(piReplay.state)).toBe(hashState(piState));

    let piUnbroken = toRunnerTurn(v112kCardReleaseGame("spotcheck-pi-unbroken"));
    piUnbroken.corp.credits = 20;
    putCorpIceOnServer(piUnbroken, "rd", "onr_v1_259_in-the-face");
    piUnbroken = apply(
      piUnbroken,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    piUnbroken = apply(
      piUnbroken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(piUnbroken, action) === "onr_v1_259_in-the-face",
    );
    piUnbroken = enterEncounterFromMovementWindow(piUnbroken);
    piUnbroken = apply(
      piUnbroken,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(piUnbroken.run).toBeUndefined();
    expect(piUnbroken.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_259_in-the-face",
      result: "ended",
    });

    let corridor = toRunnerTurn(v105kCardReleaseGame("spotcheck-endless-corridor"));
    corridor.runner.credits = 20;
    corridor.corp.credits = 20;
    installRunnerProgramForTest(corridor, "onr_v1_052_raffles");
    putCorpIceOnServer(corridor, "rd", "onr_v1_239_endless-corridor");
    const corridorInitial = structuredClone(corridor);
    const corridorReplayStart = corridor.eventLog.length;
    corridor = apply(
      corridor,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    corridor = apply(
      corridor,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(corridor, action) === "onr_v1_239_endless-corridor",
    );
    corridor = enterEncounterFromMovementWindow(corridor);
    const corridorBreaks = getLegalActions(corridor, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(corridor, action) === "onr_v1_052_raffles",
    );
    expect(corridorBreaks.map((action) => action.payload?.subroutineIndex)).toEqual([
      0,
      1,
    ]);
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
    corridor = apply(corridor, "runner", (action) => action.actionId === firstBreak.actionId);
    corridor = apply(
      corridor,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(corridor, action) === "onr_v1_052_raffles" &&
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

    let unbroken = toRunnerTurn(v105kCardReleaseGame("spotcheck-endless-unbroken"));
    unbroken.corp.credits = 20;
    putCorpIceOnServer(unbroken, "rd", "onr_v1_239_endless-corridor");
    unbroken = apply(
      unbroken,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    unbroken = apply(
      unbroken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(unbroken, action) === "onr_v1_239_endless-corridor",
    );
    unbroken = enterEncounterFromMovementWindow(unbroken);
    unbroken = apply(unbroken, "runner", (action) => action.type === "continue_run");
    expect(unbroken.run).toBeUndefined();
    expect(unbroken.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_239_endless-corridor",
      result: "ended",
    });
  });

  it("attributes Antiquated Interface Routines strength only to its own fort", () => {
    let state = v163CardReleaseGame("spotcheck-antiquated-interface");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    putCorpRootInRemote(state, "onr_v1_350_antiquated-interface-routines");
    putCorpIceOnServer(state, "remote_1", "onr_v1_232_crystal-wall");
    putCorpIceOnServer(state, "rd", "onr_v1_233_d-arc-knight");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Antiquated Interface Routines",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const rezUpgrade = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) ===
          "onr_v1_350_antiquated-interface-routines",
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
    state = apply(state, "corp", (action) => action.actionId === rezUpgrade.actionId);
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
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(4);
    state = apply(state, "runner", (action) => action.type === "continue_run");

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
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(2);
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
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_237_data-wall", quantity: 1 },
            { id: "onr_v1_239_endless-corridor", quantity: 1 },
            { id: "onr_v1_350_antiquated-interface-routines", quantity: 1 },
            { id: "simple_agenda", quantity: 2 },
            { id: "simple_economy_operation", quantity: 2 },
          ],
        },
      }),
    );
    state.corp.credits = 6;
    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_350_antiquated-interface-routines",
    );
    const dataWallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_237_data-wall",
    );
    const endlessCorridorId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_239_endless-corridor",
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
        action.type === "rez_ice" && action.payload?.cardId === upgradeId,
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
        action.type === "rez_ice" && action.payload?.cardId === endlessCorridorId,
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
          { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    state.runner.credits = 10;
    state.corp.credits = 10;
    state.corp.clicks = 3;
    installRunnerResourceForTest(state, "onr_v1_160_diplomatic-immunity");
    scoreCorpAgendaForTest(state, "simple_agenda");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
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
      actionId: mustAction(state, "corp", (action) => action.type === "resolve_choice").actionId,
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
      sourceDefinitionId: "onr_v1_160_diplomatic-immunity",
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
          { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    cancelState = apply(cancelState, "corp", (action) => action.type === "mandatory_draw");
    cancelState.runner.tags = 1;
    cancelState.corp.credits = 10;
    installRunnerResourceForTest(cancelState, "onr_v1_160_diplomatic-immunity");
    const agendaId = scoreCorpAgendaForTest(cancelState, "simple_agenda");
    moveCorpCardToHq(cancelState, "onr_v1_301_punitive-counterstrike");
    cancelState = apply(
      cancelState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(cancelState, action) === "onr_v1_301_punitive-counterstrike",
    );
    cancelState = applyChoice(cancelState, "corp", "pass");
    expect(cancelState.specialZones?.removedFromGame).toContain(agendaId);
    const cancelPayload = cancelState.eventLog.at(-1)?.publicPayload;
    expect(cancelPayload).toMatchObject({
      eventModificationDecision: "cancel",
      agendaPointCost: 1,
      damageAmount: 2,
      cardsTrashed: 2,
    });
    expect(Number(cancelPayload?.agendaPointCostPaid ?? 0)).toBeGreaterThanOrEqual(
      1,
    );
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
      "onr_v1_188_ai-chief-financial-officer",
    );
    const secondCfo = scoreCorpAgendaForTest(
      state,
      "onr_v1_188_ai-chief-financial-officer",
    );
    keepOnlyCorpHqCards(state, [
      moveCorpCardToHq(state, "simple_agenda"),
      moveCorpCardToHq(state, "onr_v1_203_hostile-takeover"),
    ]);
    keepOnlyCorpArchivesCards(state, []);
    while (state.corp.rd.length > 3) {
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
        action.payload?.agendaAbility === "ai_chief_financial_officer" &&
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
    state = apply(state, "corp", (action) => action.actionId === legal.actionId);
    expect(state.corp.hq.length).toBeLessThanOrEqual(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      agendaAbility: "ai_chief_financial_officer",
      cardDefinitionId: "onr_v1_188_ai-chief-financial-officer",
      sourceDefinitionId: "onr_v1_188_ai-chief-financial-officer",
      hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"archives"|"cardInstances"|"privatePayload"|simple_agenda/,
    );
    expect(state.corp.scoreArea).toEqual(expect.arrayContaining([firstCfo, secondCfo]));
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
          { id: "onr_v1_196_corporate-war", quantity: 2 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    });
    warState = apply(warState, "corp", (action) => action.type === "mandatory_draw");
    warState.corp.credits = 12;
    warState.corp.clicks = 10;
    const warId = putCorpRootInRemote(warState, "onr_v1_196_corporate-war");
    warState.cardInstances[warId] = {
      ...warState.cardInstances[warId]!,
      advancementCounters: 3,
    };
    const warInitial = structuredClone(warState);
    const warReplayStart = warState.eventLog.length;
    warState = apply(
      warState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(warState, action) === "onr_v1_196_corporate-war",
    );
    expect(warState.corp.credits).toBe(24);
    expect(warState.eventLog.at(-1)?.publicPayload).toMatchObject({
      scoreCreditSwingThresholdMet: true,
      onScoreGainCredits: 12,
    });
    expect(replayEvents(warInitial, warState.eventLog.slice(warReplayStart)).ok).toBe(true);

    let coupState = createGameAfterSetup({
      seed: "spotcheck-political-coup",
      runnerDeck: ONR_V1_8_1_RUNNER_DECK,
      corpDeck: ONR_V1_8_1_CORP_DECK,
      agendaPointsToWin: 7,
    });
    coupState = apply(coupState, "corp", (action) => action.type === "mandatory_draw");
    const firstCoup = scoreCorpAgendaForTest(coupState, "onr_v1_209_political-coup");
    const secondCoup = scoreCorpAgendaForTest(coupState, "onr_v1_209_political-coup");
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
    coupState = apply(coupState, "corp", (action) => action.actionId === coup.actionId);
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
          sourceDefinitionId: "onr_v1_209_political-coup",
        }),
      ],
    });
    expect(replayEvents(coupInitial, coupState.eventLog.slice(coupInitial.eventLog.length)).ok).toBe(true);
  });

  it("resolves Cinderella and Homewrecker as unpreventable hardware-trash trace ICE", () => {
    for (const [definitionId, traceStrength] of [
      ["onr_v1_228_cinderella", 6],
      ["onr_v1_248_homewrecker", 5],
    ] as const) {
      let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags(`spotcheck-${definitionId}`));
      state.runner.credits = 20;
      state.corp.credits = 20;
      installRunnerHardwareForTest(state, "onr_v1_120_armadillo-armored-road-home");
      installRunnerHardwareForTest(
        state,
        "onr_v1_132_microtech-trode-set",
      );
      installRunnerResourceForTest(state, "onr_v1_167_leland-corporate-bodyguard");
      putCorpIceOnServer(state, "rd", definitionId);
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.trace).toMatchObject({ baseTraceStrength: traceStrength });
      state = applyChoice(state, "corp", "bid_10");
      state = applyChoice(state, "runner", "bid_0");
      expect(state.runner.tags).toBe(0);
      expect(state.pendingChoice).toBeUndefined();
      expect(state.run).toBeUndefined();
      expect(state.runner.heap.length).toBeGreaterThan(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceSuccessful: true,
        tagsAdded: 0,
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

      let miss = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags(`spotcheck-${definitionId}-miss`));
      miss.runner.credits = 20;
      miss.corp.credits = 20;
      installRunnerHardwareForTest(miss, "onr_v1_132_microtech-trode-set");
      putCorpIceOnServer(miss, "rd", definitionId);
      miss = apply(miss, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
      miss = apply(miss, "corp", (action) => action.type === "rez_ice" && sourceDefinition(miss, action) === definitionId);
      miss = apply(miss, "runner", (action) => action.type === "continue_run");
      miss = applyChoice(miss, "corp", "bid_0");
      miss = applyChoice(miss, "runner", "bid_20");
      expect(miss.run?.phase).toBe("encounter_ice");
      expect(miss.runner.heap.some((id) => miss.cardInstances[id]?.definitionId === "onr_v1_132_microtech-trode-set")).toBe(false);
    }
  });

  it("documents Cinderella failure without keeping stale break options or applying break costs", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags("spotcheck-cinderella-failed-trace-break-cost"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const hardwareId = installRunnerHardwareForTest(state, "onr_v1_120_armadillo-armored-road-home");
    const replicatorId = installRunnerProgramForTest(state, "onr_v1_056_replicator");
    state.cardInstances[replicatorId] = {
      ...state.cardInstances[replicatorId]!,
      strengthModifier: 4,
    };
    putCorpIceOnServer(state, "rd", "onr_v1_228_cinderella");
    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && sourceDefinition(state, action) === "onr_v1_228_cinderella",
    );
    const visibleBreakBeforeTrace = mustAction(
      state,
      "runner",
      (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "onr_v1_056_replicator",
    );
    expect(visibleBreakBeforeTrace.payload).toMatchObject({
      targetIceDefinitionId: "onr_v1_228_cinderella",
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
      sourceDefinitionId: "onr_v1_228_cinderella",
      traceSuccessful: false,
      corpBid: 0,
      runnerBid: 6,
      traceStrength: 6,
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
        (action) => action.type === "break_subroutine" && sourceDefinition(state, action) === "onr_v1_056_replicator",
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

    let successful = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags("spotcheck-cinderella-success-trace-cost"));
    successful.runner.credits = 20;
    successful.corp.credits = 20;
    installRunnerHardwareForTest(successful, "onr_v1_120_armadillo-armored-road-home");
    putCorpIceOnServer(successful, "rd", "onr_v1_228_cinderella");
    successful = apply(successful, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    successful = apply(
      successful,
      "corp",
      (action) => action.type === "rez_ice" && sourceDefinition(successful, action) === "onr_v1_228_cinderella",
    );
    successful = apply(successful, "runner", (action) => action.type === "continue_run");
    successful = applyChoice(successful, "corp", "bid_1");
    const runnerCreditsBeforeSuccessBid = successful.runner.credits;
    successful = applyChoice(successful, "runner", "bid_0");
    expect(successful.runner.credits).toBe(runnerCreditsBeforeSuccessBid);
    expect(successful.run).toBeUndefined();
    expect(successful.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      trashedCount: 1,
      damageAmount: 2,
    });
  });

  it("places Management Shake-Up advancement counters and scales Shattered Remains hardware trash", () => {
    let state = MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-management-shake-up");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 10;
    const agendaId = putCorpRootInRemote(state, "onr_v1_202_genetics-visionary-acquisition");
    const virusId = putCorpRootInRemote(state, "onr_v1_348_virus-test-site");
    moveCorpCardToHq(state, "onr_v1_292_management-shake-up");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_292_management-shake-up",
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
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      v1919OperationAbility: "add_advancement_counters",
      addedAdvancementCounters: 3,
      targetCount: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /cardInstances|privatePayload/,
    );
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
            { id: "simple_setup_hardware", quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.agendaScoring.runner.cards.filter(
              (card) => card.id !== "simple_setup_hardware",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.agendaScoring.corp,
        agendaPointsToWin: 7,
      }),
    );
    access.runner.credits = 20;
    const firstHardware = installRunnerHardwareForTest(access, "simple_setup_hardware");
    const secondHardware = moveRunnerCardCopyToGrip(access, "simple_setup_hardware");
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
      "onr_v1_315_corprunners-shattered-remains",
    );
    access.cardInstances[shatteredId] = {
      ...access.cardInstances[shatteredId]!,
      advancementCounters: 2,
    };
    const accessInitial = structuredClone(access);
    const accessReplayStart = access.eventLog.length;
    access = apply(access, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    access = passRootRezWindowBeforeAccessIfOpen(access);
    access = apply(access, "runner", (action) => action.type === "access_card");
    expect(access.runner.heap).toEqual(expect.arrayContaining([firstHardware, secondHardware]));
    expect(access.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1919_access_ambush_trash_installed",
      ambushDefinitionId: "onr_v1_315_corprunners-shattered-remains",
      advancementCounterCount: 2,
      trashedCount: 2,
    });
    expect(replayEvents(accessInitial, access.eventLog.slice(accessReplayStart)).ok).toBe(true);
  });

  it("keeps Ball and Chain tax and Tokyo-Chiba Infighting run bonus scoped to the current run/server", () => {
    let taxState = toRunnerTurn(v181CardReleaseGame("spotcheck-ball-chain-tax"));
    taxState.runner.credits = 0;
    taxState.corp.credits = 20;
    putCorpIceOnServer(taxState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(taxState, "rd", "onr_v1_222_ball-and-chain");
    taxState = apply(taxState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    taxState = apply(taxState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(taxState, action) === "onr_v1_222_ball-and-chain");
    taxState = apply(taxState, "runner", (action) => action.type === "continue_run");
    const initial = structuredClone(taxState);
    const replayStart = taxState.eventLog.length;
    taxState = apply(taxState, "runner", (action) => action.type === "continue_run");
    taxState = apply(taxState, "corp", (action) => action.type === "rez_ice" && sourceDefinition(taxState, action) === "simple_barrier_ice");
    expect(taxState.run).toBeUndefined();
    expect(taxState.eventLog.at(-1)?.publicPayload).toMatchObject({
      encounterTaxForFutureIce: 2,
      encounterTaxPaid: 0,
      encounterTaxSource: "onr_v1_222_ball-and-chain",
      result: "ended",
    });
    expect(replayEvents(initial, taxState.eventLog.slice(replayStart)).ok).toBe(true);

    let tokyo = v163CardReleaseGame("spotcheck-tokyo-chiba-bonus");
    tokyo = apply(tokyo, "corp", (action) => action.type === "mandatory_draw");
    tokyo.corp.credits = 10;
    tokyo.corp.clicks = 3;
    const tokyoId = putCorpRootInRemote(tokyo, "onr_v1_371_tokyo-chiba-infighting");
    putCorpIceOnServer(tokyo, "remote_1", "onr_v1_232_crystal-wall");
    tokyo.cardInstances[tokyoId] = {
      ...tokyo.cardInstances[tokyoId]!,
      faceup: true,
      rezzed: true,
    };
    tokyo = toRunnerTurnFromCorpMain(tokyo);
    tokyo = apply(tokyo, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "remote_1");
    tokyo = apply(tokyo, "corp", (action) => action.type === "rez_ice" && sourceDefinition(tokyo, action) === "onr_v1_232_crystal-wall");
    const creditsBefore = tokyo.corp.credits;
    tokyo = apply(tokyo, "runner", (action) => action.type === "continue_run");
    expect(tokyo.corp.credits).toBe(creditsBefore + 2);
    expect(tokyo.eventLog.at(-1)?.publicPayload).toMatchObject({
      tokyoChibaInfightingBonus: true,
      corpCreditsGained: 2,
      corpCreditsAfter: creditsBefore + 2,
    });
  });
});
