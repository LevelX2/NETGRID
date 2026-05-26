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

describe("Originalset Spotcheck 2026-05-15 Trace/Prevention/Asset hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("aligns Parraline 5750 with its deck MU, recurring-credit and replacement contract", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-parraline-5750-contract",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_parraline_runner",
          name: "Spotcheck Parraline Runner",
          cards: [
            { id: "onr_v1_137_parraline-5750", quantity: 1 },
            { id: "onr_v1_136_pandoras-deck", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rd_interface_corp",
          name: "Spotcheck R&D Interface Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_agenda", quantity: 1 },
            { id: "simple_economy_operation", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "simple_economy_asset",
                  "simple_agenda",
                  "simple_economy_operation",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const parralineId = moveRunnerCardToGrip(
      state,
      "onr_v1_137_parraline-5750",
    );
    const pandoraId = moveRunnerCardToGrip(state, "onr_v1_136_pandoras-deck");
    const memoryBefore = state.runner.memoryLimit;
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_137_parraline-5750",
    );

    expect(legal.costs).toEqual([{ clicks: 1, credits: 5 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-parraline-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.actionId === legal.actionId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 1,
    );
    expect(cardCounterAmount(state, parralineId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "onr_v1_137_parraline-5750",
      hostedCreditsAdded: 1,
      counterType: "bit",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === pandoraId,
    );
    expect(state.runner.heap).toContain(parralineId);
    expect(state.runner.rig.hardware).toContain(pandoraId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 2,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      deckUniqueReplacement: true,
    });
  });

  it("keeps Evil Twin and Wilson prevention source-bound, typed and turn-limited", () => {
    let evilState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-evil-twin-prevention",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: ONR_V1_6_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    evilState.runner.credits = 30;
    evilState.corp.credits = 30;
    installRunnerProgramForTest(evilState, "onr_v1_023_evil-twin");
    putCorpIceOnServer(evilState, "rd", "onr_v1_254_liche");
    const evilInitial = structuredClone(evilState);
    const evilReplayStart = evilState.eventLog.length;
    evilState = encounterIce(evilState, "rd", "onr_v1_254_liche");
    evilState = apply(evilState, "runner", (action) => action.type === "continue_run");
    expect(evilState.pendingChoice?.source).toBe("v120.event_modification.prevent");
    const evilPrevent = getPlayerView(evilState, "runner").pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    evilState = applyChoice(evilState, "runner", String(evilPrevent));
    expect(evilState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_023_evil-twin",
      preventedAmount: 1,
      damageType: "core",
      damageAmount: 0,
    });
    expect(JSON.stringify(evilState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const evilReplay = replayEvents(
      evilInitial,
      evilState.eventLog.slice(evilReplayStart),
    );
    expect(evilReplay.ok).toBe(true);
    expect(hashState(evilReplay.state)).toBe(hashState(evilState));
    evilState = apply(evilState, "runner", (action) => action.type === "continue_run");
    evilState = applyChoice(
      evilState,
      "runner",
      String(evilState.pendingChoice?.options.find((option) => option.id !== "pass")?.id),
    );
    expect(evilState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_023_evil-twin",
      preventedAmount: 1,
      damageType: "core",
      damageAmount: 0,
    });
    evilState = apply(evilState, "runner", (action) => action.type === "continue_run");
    expect(evilState.pendingChoice).toBeUndefined();
    expect(evilState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "core",
      damageAmount: 1,
    });

    let wilsonState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("spotcheck-wilson-meat"),
    );
    wilsonState.runner.credits = 20;
    wilsonState.corp.credits = 20;
    wilsonState.runner.tags = 1;
    const wilsonId = moveRunnerCardToGrip(
      wilsonState,
      "onr_v1_187_wilson-weeflerunner-apprentice",
    );
    wilsonState = apply(
      wilsonState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === wilsonId,
    );
    wilsonState = apply(wilsonState, "runner", (action) => action.type === "end_turn");
    wilsonState = apply(wilsonState, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(wilsonState, "onr_v1_301_punitive-counterstrike");
    wilsonState = apply(
      wilsonState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(wilsonState, action) ===
          "onr_v1_301_punitive-counterstrike",
    );
    const resolve = mustAction(
      wilsonState,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const stale = applyAction(wilsonState, {
      matchId: wilsonState.matchId,
      side: "runner",
      actionId: resolve.actionId,
      clientKnownStateVersion: wilsonState.stateVersion - 1,
      idempotencyKey: "spotcheck-wilson-stale",
      selectedChoices: {
        choiceId: wilsonState.pendingChoice?.choiceId,
        selectedOptionIds: [
          wilsonState.pendingChoice?.options.find((option) => option.id !== "pass")
            ?.id ?? "",
        ],
      },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    wilsonState = applyChoice(
      wilsonState,
      "runner",
      String(wilsonState.pendingChoice?.options.find((option) => option.id !== "pass")?.id),
    );
    expect(wilsonState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_187_wilson-weeflerunner-apprentice",
      preventedAmount: 2,
      damageType: "meat",
      damageAmount: 0,
    });
    moveCorpCardToHq(wilsonState, "onr_v1_301_punitive-counterstrike");
    wilsonState = apply(
      wilsonState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(wilsonState, action) ===
          "onr_v1_301_punitive-counterstrike",
    );
    expect(wilsonState.pendingChoice).toBeUndefined();
    expect(wilsonState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "meat",
      damageAmount: 2,
    });
  });

  it("uses Access to Arasaka as one live base-link source for Fetch and Rex traces", () => {
    for (const [definitionId, rezCost] of [
      ["onr_v1_243_fetch-4-0-1", 0],
      ["onr_v1_264_rex", 4],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-trace-assets-${definitionId}`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.runner,
            id: `spotcheck_trace_assets_${definitionId}_runner`,
            name: `Spotcheck Trace Assets ${definitionId} Runner`,
            cards: [
              { id: "onr_v1_149_access-to-arasaka", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards,
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.corp,
            id: `spotcheck_trace_assets_${definitionId}_corp`,
            name: `Spotcheck Trace Assets ${definitionId} Corp`,
            cards:
              definitionId === "onr_v1_243_fetch-4-0-1"
                ? [
                    { id: definitionId, quantity: 1 },
                    ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards,
                  ]
                : MECHANIC_SMOKE_DECKS.traceTags.corp.cards,
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.corp.credits = 20;
      const accessId = moveRunnerCardToGrip(state, "onr_v1_149_access-to-arasaka");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === accessId,
      );
      putCorpIceOnServer(state, "rd", definitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rez = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(rez.costs[0]?.credits).toBe(rezCost);
      state = apply(state, "corp", (action) => action.actionId === rez.actionId);
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.trace).toMatchObject({
        status: "corp_bid",
        sourceDefinitionId: definitionId,
        baseTraceStrength: 3,
      });
      state = applyChoice(state, "corp", "bid_0");
      expect(state.trace).toMatchObject({
        status: "base_link",
        runnerLink: 0,
        traceStrength: 3,
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceStep: "corp_bid",
        runnerLink: 0,
        traceStrength: 3,
      });
      state = applyChoice(
        state,
        "runner",
        traceChoiceOptionIdForDefinition(
          state,
          "onr_v1_149_access-to-arasaka",
          "trace_base_link_",
        ),
      );
      expect(state.runner.credits).toBe(16);
      expect(state.trace).toMatchObject({
        status: "runner_bid",
        runnerLink: 4,
        baseLinkValue: 4,
        traceStrength: 3,
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceStep: "base_link",
        runnerLink: 4,
      });
      state = applyChoice(state, "runner", "bid_0");
      state = applyChoice(state, "runner", "pass");
      if (definitionId === "onr_v1_243_fetch-4-0-1") {
        expect(state.runner.tags, definitionId).toBe(0);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          traceStep: "post_bid_link",
          traceSuccessful: false,
          tagsAdded: 0,
        });
      } else {
        expect(state.runner.tags, definitionId).toBe(0);
        expect(state.run, definitionId).toBeDefined();
        expect(state.runnerTurnFlags?.fangRunLockCreditCost).not.toBe(2);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          traceStep: "post_bid_link",
          traceSuccessful: false,
        });
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));

      let trashed = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-trace-assets-${definitionId}-trashed`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.runner,
            id: `spotcheck_trace_assets_${definitionId}_trashed_runner`,
            name: `Spotcheck Trace Assets ${definitionId} Trashed Runner`,
            cards: [
              { id: "onr_v1_149_access-to-arasaka", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards,
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.corp,
            id: `spotcheck_trace_assets_${definitionId}_trashed_corp`,
            name: `Spotcheck Trace Assets ${definitionId} Trashed Corp`,
            cards:
              definitionId === "onr_v1_243_fetch-4-0-1"
                ? [
                    { id: definitionId, quantity: 1 },
                    ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards,
                  ]
                : MECHANIC_SMOKE_DECKS.traceTags.corp.cards,
          },
          agendaPointsToWin: 7,
        }),
      );
      trashed.runner.credits = 20;
      trashed.corp.credits = 20;
      const trashedAccessId = moveRunnerCardToGrip(
        trashed,
        "onr_v1_149_access-to-arasaka",
      );
      trashed = apply(
        trashed,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === trashedAccessId,
      );
      removeEverywhere(trashed, trashedAccessId);
      trashed.runner.heap.push(trashedAccessId);
      trashed.cardInstances[trashedAccessId] = {
        ...trashed.cardInstances[trashedAccessId]!,
        zone: { side: "runner", zone: "heap" },
        faceup: true,
      };
      putCorpIceOnServer(trashed, "rd", definitionId);
      trashed = apply(
        trashed,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      trashed = apply(
        trashed,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(trashed, action) === definitionId,
      );
      trashed = apply(trashed, "runner", (action) => action.type === "continue_run");
      trashed = applyChoice(trashed, "corp", "bid_0");
      expect(trashed.trace).toMatchObject({ runnerLink: 0 });
    }
  });

  it("keeps Forged Activation Orders choices redacted and rejects target drift", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-forged-activation-orders-multi-ice",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_forged_multi_runner",
          name: "Spotcheck Forged Multi Runner",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_forged_multi_corp",
          name: "Spotcheck Forged Multi Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_code_gate_ice", quantity: 2 },
            { id: "simple_sentry_ice", quantity: 1 },
            { id: "simple_tag_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.corp.credits = 5;
    const hqServer = state.corp.servers.find((server) => server.id === "hq");
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    if (!hqServer || !rdServer) throw new Error("central servers missing");
    hqServer.label = "Headquarter";
    rdServer.label = "Research and Development";
    const rdIce = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpIceOnServer(state, "hq", "simple_code_gate_ice");
    putCorpIceCopyOnServer(state, "hq", "simple_code_gate_ice");
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    putCorpIceOnServer(state, "remote_1", "simple_sentry_ice");
    putCorpIceOnServer(state, "remote_1", "simple_tag_ice");
    moveRunnerCardToGrip(state, "onr_v1_086_forged-activation-orders");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_086_forged-activation-orders",
    );
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "ICE 1 in Headquarter",
      "ICE 2 in Headquarter",
      "ICE 1 in Research and Development",
      "ICE 1 in Remote 1",
      "ICE 2 in Remote 1",
    ]);
    expect(state.pendingChoice?.options.map((option) => option.publicLabel)).toEqual([
      "ICE 1 in Headquarter",
      "ICE 2 in Headquarter",
      "ICE 1 in Research and Development",
      "ICE 1 in Remote 1",
      "ICE 2 in Remote 1",
    ]);
    expect(JSON.stringify(getPlayerView(state, "runner").pendingChoice)).not.toMatch(
      /simple_barrier_ice|cardInstances/,
    );
    const rdOption = state.pendingChoice?.options.find(
      (option) => option.value === rdIce,
    );
    state = applyChoice(state, "runner", rdOption?.id ?? "");
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "rez_ice",
      "trash_ice",
    ]);
    const drifted = structuredClone(state);
    removeEverywhere(drifted, rdIce);
    const driftResult = applyAction(drifted, {
      matchId: drifted.matchId,
      side: "corp",
      actionId: mustAction(drifted, "corp", (action) => action.type === "resolve_choice")
        .actionId,
      clientKnownStateVersion: drifted.stateVersion,
      idempotencyKey: "spotcheck-forged-drifted-target",
      selectedChoices: {
        choiceId: drifted.pendingChoice?.choiceId,
        selectedOptionIds: ["trash_ice"],
      },
    });
    expect(driftResult.ok).toBe(false);

    state = applyChoice(state, "corp", "trash_ice");
    expect(state.corp.archives).toContain(rdIce);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      corpDecision: "trash_ice",
      targetServerLabel: "Research and Development",
      targetIcePositionLabel: "ICE 1 in Research and Development",
      trashedCount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
  });

  it("keeps Black Ice Quality Assurance scored-only and BBS/Omniscience source-scoped", () => {
    let agendaState = createGameAfterSetup({
      seed: "spotcheck-black-ice-quality-assurance",
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: "spotcheck_prevention_sources_runner",
        name: "Spotcheck Prevention Sources Runner",
        cards: [
          { id: "onr_v1_135_nasuko-cycle", quantity: 1 },
          { id: "onr_v1_161_fall-guy", quantity: 1 },
          { id: "onr_v1_170_nomad-allies", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "spotcheck_black_ice_quality_corp",
        name: "Spotcheck Black Ice Quality Corp",
        cards: [
          { id: "onr_v1_228_cinderella", quantity: 1 },
          { id: "simple_barrier_ice", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    });
    agendaState = apply(agendaState, "corp", (action) => action.type === "mandatory_draw");
    agendaState.corp.credits = 20;
    const blackIceId = putCorpIceOnServer(
      agendaState,
      "rd",
      "onr_v1_228_cinderella",
    );
    const nonBlackIceId = putCorpIceOnServer(agendaState, "hq", "simple_barrier_ice");
    agendaState.cardInstances[blackIceId] = {
      ...agendaState.cardInstances[blackIceId]!,
      faceup: true,
      rezzed: true,
    };
    agendaState.cardInstances[nonBlackIceId] = {
      ...agendaState.cardInstances[nonBlackIceId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getPlayerView(agendaState, "corp")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((ice) => ice.instanceId === blackIceId)?.strength,
    ).toBe(6);
    const agendaId = scoreCorpAgendaForTest(
      agendaState,
      "onr_v1_191_black-ice-quality-assurance",
    );
    expect(
      getPlayerView(agendaState, "corp")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((ice) => ice.instanceId === blackIceId)?.strength,
    ).toBe(8);
    expect(
      getPlayerView(agendaState, "corp")
        .servers.find((server) => server.id === "hq")
        ?.ice.find((ice) => ice.instanceId === nonBlackIceId)?.strength,
    ).toBe(DEMO_CARDS_BY_ID.simple_barrier_ice?.strength);
    agendaState.corp.scoreArea = agendaState.corp.scoreArea.filter(
      (cardId) => cardId !== agendaId,
    );
    agendaState.runner.scoreArea.push(agendaId);
    agendaState.cardInstances[agendaId] = {
      ...agendaState.cardInstances[agendaId]!,
      zone: { side: "runner", zone: "scoreArea" },
    };
    expect(
      getPlayerView(agendaState, "corp")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((ice) => ice.instanceId === blackIceId)?.strength,
    ).toBe(6);

    let assetState = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "spotcheck-bbs-omniscience-source",
    );
    assetState.corp.credits = 10;
    assetState = apply(assetState, "corp", (action) => action.type === "mandatory_draw");
    const bbsId = putCorpRootInRemote(
      assetState,
      "onr_v1_309_bbs-whispering-campaign",
    );
    const omniId = putCorpRootInRemote(
      assetState,
      "onr_v1_333_omniscience-foundation",
    );
    expect(
      getLegalActions(assetState, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === bbsId,
      ),
    ).toBe(false);
    assetState = apply(
      assetState,
      "corp",
      (action) => action.type === "rez_ice" && String(action.payload?.cardId) === bbsId,
    );
    expect(assetState.cardInstances[bbsId]?.counters?.bit).toBe(16);
    const bbsAction = mustAction(
      assetState,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === bbsId,
    );
    const removedSource = structuredClone(assetState);
    removeEverywhere(removedSource, bbsId);
    removedSource.corp.archives.push(bbsId);
    removedSource.cardInstances[bbsId] = {
      ...removedSource.cardInstances[bbsId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: false,
    };
    const removedResult = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "corp",
      actionId: bbsAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-bbs-removed-source",
    });
    expect(removedResult.ok).toBe(false);
    const initial = structuredClone(assetState);
    const replayStart = assetState.eventLog.length;
    const creditsBefore = assetState.corp.credits;
    assetState = apply(assetState, "corp", (action) => action.actionId === bbsAction.actionId);
    expect(assetState.corp.credits).toBe(creditsBefore + 2);
    expect(assetState.cardInstances[bbsId]?.counters?.bit).toBe(14);
    expect(
      getPlayerView(assetState, "corp")
        .servers.flatMap((server) => server.root)
        .find((card) => card.instanceId === bbsId)?.counters?.bit,
    ).toBe(14);
    expect(
      getPlayerView(assetState, "corp")
        .servers.flatMap((server) => server.root)
        .find((card) => card.instanceId === bbsId)?.counterDisplays,
    ).toContainEqual({
      id: "stored_credits",
      amount: 14,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "14 gespeicherte Credits",
      counterType: "bit",
      usageHint: "spendable",
    });
    expect(assetState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      cardImplementationAbility: "activated",
      counterType: "bit",
      removedCounterAmount: 2,
      remainingCounters: 14,
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 14,
      gainedCredits: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 2,
          remainingCounters: 14,
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        }),
      ],
    });
    expect(JSON.stringify(assetState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, assetState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(assetState));
    assetState.cardInstances[bbsId] = {
      ...assetState.cardInstances[bbsId]!,
      counters: { bit: 2 },
    };
    assetState.corp.clicks = Math.max(assetState.corp.clicks, 1);
    assetState = apply(assetState, "corp", (action) => action.actionId === bbsAction.actionId);
    expect(assetState.corp.archives).toContain(bbsId);
    expect(assetState.cardInstances[bbsId]?.counters?.bit).toBeUndefined();
    expect(assetState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      remainingCounters: 0,
      sourceTrashed: true,
      resolvedEffects: expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_source_when_empty",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        }),
      ]),
    });
    assetState.cardInstances[omniId] = {
      ...assetState.cardInstances[omniId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(assetState, "corp").some(
        (action) => action.payload?.cardId === omniId,
      ),
    ).toBe(false);
  });

  it("executes P3.17 Department manual hosted-credit abilities", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "p317-department-manual-hosted-credits",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 5;
    const departmentId = putCorpRootInRemote(
      state,
      "onr_v1_318_department-of-truth-enhancement",
    );
    state.cardInstances[departmentId] = {
      ...state.cardInstances[departmentId]!,
      faceup: true,
      rezzed: true,
    };

    let departmentActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === departmentId,
    );
    expect(
      departmentActions.some(
        (action) => action.payload?.cardImplementationAbilityIndex === 0,
      ),
    ).toBe(true);
    expect(
      departmentActions.some(
        (action) => action.payload?.cardImplementationAbilityIndex === 1,
      ),
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === departmentId &&
        action.payload?.cardImplementationAbilityIndex === 0,
    );
    expect(cardCounterAmount(state, departmentId, "bit")).toBe(3);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === departmentId &&
        action.payload?.cardImplementationAbilityIndex === 0,
    );
    expect(cardCounterAmount(state, departmentId, "bit")).toBe(6);

    departmentActions = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === departmentId,
    );
    const takeAll = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === departmentId &&
        action.payload?.cardImplementationAbilityIndex === 1,
    );
    expect(departmentActions).toHaveLength(2);
    const stale = structuredClone(state);
    stale.cardInstances[departmentId] = {
      ...stale.cardInstances[departmentId]!,
      faceup: false,
      rezzed: false,
    };
    const staleCredits = stale.corp.credits;
    const staleResult = applyAction(stale, {
      matchId: stale.matchId,
      side: "corp",
      actionId: takeAll.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "p317-department-unrezzed-stale",
    });
    expect(staleResult.ok).toBe(false);
    expect(stale.corp.credits).toBe(staleCredits);
    expect(cardCounterAmount(stale, departmentId, "bit")).toBe(6);

    const creditsBeforeTake = state.corp.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "corp", (action) => action.actionId === takeAll.actionId);
    expect(state.corp.credits).toBe(creditsBeforeTake + 6);
    expect(cardCounterAmount(state, departmentId, "bit")).toBe(0);
    expect(state.corp.archives).not.toContain(departmentId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_318_department-of-truth-enhancement",
      hostedCreditsTaken: 6,
      hostedCreditsAfter: 0,
      gainedCredits: 6,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 6,
          remainingCounters: 0,
          sourceDefinitionId: "onr_v1_318_department-of-truth-enhancement",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("executes start-of-Corp-turn hosted-credit campaign effects", () => {
    for (const [definitionId, takeAmount] of [
      ["onr_v1_311_braindance-campaign", 2],
      ["onr_v1_326_holovid-campaign", 1],
    ] as const) {
      let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
        `p36-start-turn-${definitionId}`,
      );
      state.corp.credits = 30;
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      const campaignId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === campaignId &&
          action.payload?.serverId === "new_remote" &&
          action.payload?.placement === "root",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(cardCounterAmount(state, campaignId, "bit")).toBe(12);

      const creditsBeforeDrain = state.corp.credits;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = toRunnerTurnFromCorpMain(state);
      state = apply(state, "runner", (action) => action.type === "end_turn");
      expect(state.corp.credits).toBe(creditsBeforeDrain + takeAmount);
      expect(cardCounterAmount(state, campaignId, "bit")).toBe(12 - takeAmount);
      expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: takeAmount,
          remainingCounters: 12 - takeAmount,
          reason: "start_of_turn",
          sourceDefinitionId: definitionId,
        }),
      );
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));

      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      setCardCounterForTest(state, campaignId, "bit", 1);
      const finalCreditBefore = state.corp.credits;
      state = toRunnerTurnFromCorpMain(state);
      state = apply(state, "runner", (action) => action.type === "end_turn");
      expect(state.corp.credits).toBe(finalCreditBefore + 1);
      expect(state.corp.archives).toContain(campaignId);
      expect(state.cardInstances[campaignId]?.zone).toMatchObject({
        side: "corp",
        zone: "archives",
      });
      expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "take_hosted_credits",
            amount: 1,
            remainingCounters: 0,
            sourceDefinitionId: definitionId,
          }),
          expect.objectContaining({
            kind: "trash_source_when_empty",
            sourceDefinitionId: definitionId,
          }),
        ]),
      );
    }

    let unrezzed = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("p36-unrezzed-campaign"),
    );
    const unrezzedId = putCorpRootInRemote(
      unrezzed,
      "onr_v1_311_braindance-campaign",
    );
    setCardCounterForTest(unrezzed, unrezzedId, "bit", 1);
    const creditsBefore = unrezzed.corp.credits;
    unrezzed = apply(unrezzed, "runner", (action) => action.type === "end_turn");
    expect(unrezzed.corp.credits).toBe(creditsBefore);
    expect(cardCounterAmount(unrezzed, unrezzedId, "bit")).toBe(1);
  });

  it("executes Detroit Police Contract and Spinn Public Relations hosted-credit turn effects", () => {
    let detroit = apply(
      MECHANIC_SMOKE_GAMES.counterRecurring("p36-detroit-start-turn"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    detroit.corp.credits = 10;
    const detroitId = scoreCorpAgendaForTest(
      detroit,
      "onr_v1_198_detroit-police-contract",
    );
    setCardCounterForTest(detroit, detroitId, "bit", 1);
    const detroitCreditsBefore = detroit.corp.credits;
    detroit = toRunnerTurnFromCorpMain(detroit);
    detroit = apply(detroit, "runner", (action) => action.type === "end_turn");
    expect(detroit.corp.credits).toBe(detroitCreditsBefore + 1);
    expect(cardCounterAmount(detroit, detroitId, "bit")).toBe(0);
    expect(detroit.corp.scoreArea).toContain(detroitId);

    setCardCounterForTest(detroit, detroitId, "bit", 6);
    expect(
      getPlayerView(detroit, "corp").own.scoreArea.find(
        (card) => card.instanceId === detroitId,
      )?.counterDisplays,
    ).toContainEqual({
      id: "stored_credits",
      amount: 6,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "6 gespeicherte Credits",
      counterType: "bit",
      usageHint: "spendable",
    });

    let unscored = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.counterRecurring("p36-detroit-unscored"),
    );
    const unscoredDetroitId = putCorpRootInRemote(
      unscored,
      "onr_v1_198_detroit-police-contract",
    );
    unscored.cardInstances[unscoredDetroitId] = {
      ...unscored.cardInstances[unscoredDetroitId]!,
      faceup: true,
      rezzed: true,
    };
    setCardCounterForTest(unscored, unscoredDetroitId, "bit", 2);
    const unscoredCreditsBefore = unscored.corp.credits;
    unscored = apply(unscored, "runner", (action) => action.type === "end_turn");
    expect(unscored.corp.credits).toBe(unscoredCreditsBefore);
    expect(cardCounterAmount(unscored, unscoredDetroitId, "bit")).toBe(2);

    let spinn = MECHANIC_SMOKE_GAMES.assetNodeEffects("p36-spinn-start-turn");
    spinn.corp.credits = 10;
    spinn = apply(spinn, "corp", (action) => action.type === "mandatory_draw");
    const spinnId = moveCorpCardToHq(spinn, "onr_v1_344_spinn-public-relations");
    spinn = apply(
      spinn,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === spinnId &&
        action.payload?.serverId === "new_remote",
    );
    spinn = apply(
      spinn,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(spinn, action) === "onr_v1_344_spinn-public-relations",
    );
    const zeroCreditsBefore = spinn.corp.credits;
    spinn = toRunnerTurnFromCorpMain(spinn);
    spinn = apply(spinn, "runner", (action) => action.type === "end_turn");
    expect(spinn.corp.credits).toBe(zeroCreditsBefore);
    expect(cardCounterAmount(spinn, spinnId, "bit")).toBe(0);

    spinn = apply(spinn, "corp", (action) => action.type === "mandatory_draw");
    const loadAction = mustAction(
      spinn,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === spinnId,
    );
    const removedSpinn = structuredClone(spinn);
    removeEverywhere(removedSpinn, spinnId);
    removedSpinn.corp.archives.push(spinnId);
    removedSpinn.cardInstances[spinnId] = {
      ...removedSpinn.cardInstances[spinnId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: false,
    };
    const removedResult = applyAction(removedSpinn, {
      matchId: removedSpinn.matchId,
      side: "corp",
      actionId: loadAction.actionId,
      clientKnownStateVersion: removedSpinn.stateVersion,
      idempotencyKey: "p36-spinn-removed-source",
    });
    expect(removedResult.ok).toBe(false);
    const creditsBeforeLoad = spinn.corp.credits;
    spinn = apply(spinn, "corp", (action) => action.actionId === loadAction.actionId);
    expect(spinn.corp.credits).toBe(creditsBeforeLoad);
    expect(cardCounterAmount(spinn, spinnId, "bit")).toBe(3);
    expect(spinn.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      hostedCreditsAdded: 3,
      hostedCreditsAfter: 3,
    });

    const creditsBeforeTake = spinn.corp.credits;
    spinn = toRunnerTurnFromCorpMain(spinn);
    spinn = apply(spinn, "runner", (action) => action.type === "end_turn");
    expect(spinn.corp.credits).toBe(creditsBeforeTake + 1);
    expect(cardCounterAmount(spinn, spinnId, "bit")).toBe(2);
    expect(spinn.corp.archives).not.toContain(spinnId);
    expect(spinn.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "take_hosted_credits",
        amount: 1,
        remainingCounters: 2,
        reason: "start_of_turn",
        sourceDefinitionId: "onr_v1_344_spinn-public-relations",
      }),
    );
  });
});

describe("Originalset Spotcheck 2026-05-16 Asset/Upgrade/Trace Modifiers hardening", () => {
  it("opens Priority Requisition as a private free-rez choice and rejects target drift", () => {
    let state = v162CardReleaseGame("spotcheck-priority-requisition-private-choice");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_212_priority-requisition");
    const highCostIceId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    const lowerCostIceId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_232_crystal-wall",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_212_priority-requisition",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_212_priority-requisition",
      );
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_212_priority-requisition",
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 1,
      maxSelections: 1,
    });
    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    expect(corpChoice?.options.map((option) => option.card?.title)).toEqual([
      "Cortical Scanner",
      "Crystal Wall",
      undefined,
    ]);
    expect(corpChoice?.options.at(-1)?.label).toBe("Überspringen");
    expect(
      corpChoice?.options
        .filter((option) => option.id !== "skip")
        .every((option) => option.card?.known),
    ).toBe(true);
    expect(
      corpChoice?.options
        .filter((option) => option.id !== "skip")
        .every((option) => option.card?.type === "ice"),
    ).toBe(true);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Cortical Scanner",
    );
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
        selectedOptionIds: [`card_${highCostIceId}`],
      },
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
        selectedOptionIds: [`card_${highCostIceId}`],
      },
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    const drift = structuredClone(state);
    drift.cardInstances[highCostIceId] = {
      ...drift.cardInstances[highCostIceId]!,
      rezzed: true,
    };
    const driftResult = applyAction(drift, {
      matchId: drift.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: drift.stateVersion,
      selectedChoices: {
        choiceId: drift.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${highCostIceId}`],
      },
    });
    expect(driftResult.ok).toBe(false);

    const skipped = applyChoices(structuredClone(state), "corp", ["skip"]);
    expect(skipped.pendingChoice).toBeUndefined();
    expect(skipped.cardInstances[highCostIceId]?.rezzed).toBe(false);
    expect(skipped.cardInstances[lowerCostIceId]?.rezzed).toBe(false);
    expect(skipped.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    });
    expect(
      skipped.eventLog.at(-1)?.publicPayload.hiddenZoneAction,
    ).toBeUndefined();

    state = applyChoices(state, "corp", [`card_${highCostIceId}`]);
    expect(state.cardInstances[highCostIceId]?.rezzed).toBe(true);
    expect(state.cardInstances[lowerCostIceId]?.rezzed).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v162_priority_requisition_free_rez",
      priorityRequisitionFreeRez: true,
      priorityRequisitionTargetDefinitionId: "onr_v1_230_cortical-scanner",
      rezCostPaid: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noTarget = v162CardReleaseGame(
      "spotcheck-priority-requisition-no-target",
    );
    noTarget = apply(
      noTarget,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    noTarget.corp.credits = 30;
    noTarget.corp.clicks = 10;
    noTarget.corp.maxHandSize = 100;
    moveCorpCardToHq(noTarget, "onr_v1_212_priority-requisition");
    noTarget = apply(
      noTarget,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noTarget, action) ===
          "onr_v1_212_priority-requisition",
    );
    for (let index = 0; index < 5; index += 1) {
      noTarget = apply(
        noTarget,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(noTarget, action) ===
            "onr_v1_212_priority-requisition",
      );
    }
    noTarget = apply(
      noTarget,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(noTarget, action) ===
          "onr_v1_212_priority-requisition",
    );
    expect(noTarget.pendingChoice).toBeUndefined();
    expect(noTarget.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      priorityRequisitionChoiceOpened: false,
      priorityRequisitionCandidateCount: 0,
    });
  });

  it("revalidates migrated tag-condition suppression, Disinfectant targets and Access to Kiribati trace link", () => {
    let omni = MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-tag-condition-drift");
    omni.corp.credits = 10;
    omni.runner.tags = 1;
    omni = apply(omni, "corp", (action) => action.type === "mandatory_draw");
    const parisId = putCorpRootInRemote(omni, "onr_v1_365_paris-city-grid");
    omni.cardInstances[parisId] = {
      ...omni.cardInstances[parisId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(omni, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1918UpgradeAbility === "tag_condition_credit" &&
          String(action.payload?.cardId) === parisId,
      ),
    ).toBe(false);

    let disinfectant = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "spotcheck-disinfectant-target-drift",
    );
    disinfectant.corp.credits = 10;
    disinfectant = apply(disinfectant, "corp", (action) => action.type === "mandatory_draw");
    const virusTargetId = installRunnerProgramForTest(disinfectant, "simple_decoder");
    disinfectant.cardInstances[virusTargetId] = {
      ...disinfectant.cardInstances[virusTargetId]!,
      counters: { virus: 1 },
    };
    const disinfectantId = putCorpRootInRemote(
      disinfectant,
      "onr_v1_319_disinfectant-inc",
    );
    disinfectant.cardInstances[disinfectantId] = {
      ...disinfectant.cardInstances[disinfectantId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(disinfectant, "corp").some(
        (action) => action.payload?.v1917AssetAbility === "remove_virus_counter",
      ),
    ).toBe(false);
    expect(disinfectant.cardInstances[virusTargetId]?.counters?.virus).toBe(1);

    let trace = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting("spotcheck-kiribati-link"),
    );
    trace.runner.credits = 6;
    trace.corp.credits = 8;
    moveRunnerCardToGrip(trace, "onr_v1_150_access-to-kiribati");
    trace = apply(
      trace,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(trace, action) === "onr_v1_150_access-to-kiribati",
    );
    putCorpIceOnServer(trace, "rd", "onr_v1_246_fragmentation-storm");
    trace = apply(
      trace,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    trace = apply(
      trace,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(trace, action) === "onr_v1_246_fragmentation-storm",
    );
    trace = apply(trace, "runner", (action) => action.type === "continue_run");
    trace = applyChoice(trace, "corp", "bid_0");
    expect(trace.trace).toMatchObject({
      status: "base_link",
      runnerLink: 0,
    });
    trace = applyChoice(
      trace,
      "runner",
      traceChoiceOptionIdForDefinition(
        trace,
        "onr_v1_150_access-to-kiribati",
        "trace_base_link_",
      ),
    );
    expect(trace.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 1,
    });
  });
});

describe("Originalset Spotcheck 2026-05-16 Trace Link Post-Bid Resolvers", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("uses Signpost and The Springboard only after both trace bids are revealed", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-trace-post-bid-link",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_trace_post_bid_runner",
          name: "Spotcheck Trace Post-Bid Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_063_signpost", quantity: 1 },
            { id: "onr_v1_181_the-springboard", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_trace_post_bid_corp",
          name: "Spotcheck Trace Post-Bid Corp",
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
    state.runner.credits = 10;
    state.corp.credits = 10;
    const signpostId = installRunnerProgramForTest(state, "onr_v1_063_signpost");
    const springboardId = installRunnerResourceForTest(
      state,
      "onr_v1_181_the-springboard",
    );
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_243_fetch-4-0-1");
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
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace?.status).toBe("corp_bid");
    state = applyChoice(state, "corp", "bid_0");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      traceStrength: 3,
      runnerLink: 0,
    });
    state = applyChoice(state, "runner", "bid_0");
    expect(state.trace?.status).toBe("post_bid_link");
    expect(state.pendingChoice?.source).toContain("trace_post_bid_link:");
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "pass",
        `trace_link_${signpostId}`,
        `trace_link_${springboardId}`,
      ]),
    );

    const choiceAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`trace_link_${signpostId}`],
      },
      idempotencyKey: "spotcheck-trace-post-bid-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`trace_link_${signpostId}`],
      },
      idempotencyKey: "spotcheck-trace-post-bid-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const removedSpringboard = structuredClone(state);
    removeEverywhere(removedSpringboard, springboardId);
    const removedHash = hashState(removedSpringboard);
    const removedResult = applyAction(removedSpringboard, {
      matchId: removedSpringboard.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: removedSpringboard.stateVersion,
      selectedChoices: {
        choiceId: removedSpringboard.pendingChoice?.choiceId,
        selectedOptionIds: [`trace_link_${springboardId}`],
      },
      idempotencyKey: "spotcheck-trace-post-bid-removed-source",
    });
    expect(removedResult.ok).toBe(false);
    expect(hashState(removedSpringboard)).toBe(removedHash);

    state = applyChoice(state, "runner", `trace_link_${signpostId}`);
    expect(state.runner.credits).toBe(9);
    expect(state.trace).toMatchObject({
      status: "post_bid_link",
      runnerLink: 2,
      runnerStrength: 2,
      postBidLinkBonus: 2,
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(["pass", `trace_link_${springboardId}`]),
    );
    expect(
      state.pendingChoice?.options.some(
        (option) => option.id === `trace_link_${signpostId}`,
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "post_bid_link",
      sourceDefinitionId: "onr_v1_063_signpost",
      postBidTraceLinkCostPaid: 1,
      postBidTraceLinkDelta: 2,
      postBidTraceLinkBonus: 2,
      postBidTraceLinkChoiceOpened: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );

    state = applyChoice(state, "runner", `trace_link_${springboardId}`);
    expect(state.trace).toBeUndefined();
    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(8);
    const springboardTraceEvent = state.eventLog.at(-1)?.publicPayload;
    expect(springboardTraceEvent).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "post_bid_link",
      postBidTraceLinkDelta: 1,
      postBidTraceLinkBonus: 3,
      runnerLink: 3,
      runnerStrength: 3,
      traceSuccessful: false,
      tagsAdded: 0,
    });
    expect(JSON.stringify(springboardTraceEvent)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
