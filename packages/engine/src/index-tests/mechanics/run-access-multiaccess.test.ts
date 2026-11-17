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

describe("V1.9.15 Run/Access/Multiaccess WIP", () => {
  it("adds all V1.9.15 WIP runtime definitions without pulling in V1.9.16 cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.runAccess).toHaveLength(14);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.runAccess) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(
        cardImplementationForDefinitionId(definitionId),
        String(definitionId),
      ).toBeDefined();
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
    }
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("routes V1.9.15 Runner events through LegalAction-only run and access paths", () => {
    const eventExpectations = [
      {
        definitionId: 310,
        serverId: "archives",
        accessCount: 1,
      },
      {
        definitionId: 317,
        serverId: "hq",
        accessCount: 1,
      },
      {
        definitionId: 324,
        serverId: "rd",
        accessCount: 1,
      },
    ] as const;

    for (const expectation of eventExpectations) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.runAccess(
          `v1915-event-${expectation.definitionId}`,
        ),
      );
      state.runner.credits = 8;
      moveRunnerCardToGrip(state, expectation.definitionId);

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) === expectation.definitionId &&
          action.payload?.serverId === expectation.serverId,
      );

      expect(state.run?.attackedServerId, String(expectation.definitionId)).toBe(
        expectation.serverId,
      );
      expect(state.run?.accessCount, String(expectation.definitionId)).toBe(
        expectation.accessCount,
      );
      expect(
        state.eventLog.at(-1)?.publicPayload,
        String(expectation.definitionId),
      ).toMatchObject({ actionType: "play_event" });
    }
  });

  it("uses Priority Wreck as successful HQ replacement without accessing HQ", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("v1915-priority-wreck-hq-replacement"),
    );
    state.runner.credits = 8;
    state.corp.credits = 1;
    moveRunnerCardToGrip(state, 317);
    const hqCardId = moveCorpCardToHq(state, 596);
    keepOnlyCorpHqCard(state, hqCardId);
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === 317 &&
        action.payload?.serverId === "hq",
    );

    expect(state.pendingChoice?.source).toContain(
      "successful_run.credit_loss_spend",
    );
    expect(state.run?.breach).toBeUndefined();
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Economy Operation",
    );

    state = applyChoice(state, "runner", "pay_2");
    expect(state.run).toBeUndefined();
    expect(state.runner.credits).toBe(6);
    expect(state.corp.credits).toBe(0);
    expect(state.corp.hq).toContain(hqCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "runner_spend_corp_lose_credits",
      runnerPaidAmount: 2,
      corpLostCredits: 1,
      sourceDefinitionId: 317,
    });

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("runs Lucidrine with temporary run credits and unpreventable core damage", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("p357-lucidrine-temporary-credits"),
    );
    state.runner.credits = 0;
    const lucidrineId = moveRunnerCardToGrip(
      state,
      310,
    );
    putCorpCardOnTopOfRd(state, 596);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === lucidrineId &&
        action.payload?.serverId === "rd",
    );
    expect(state.run?.runnerRunTemporaryCredits).toMatchObject({
      sourceDefinitionId: 310,
      remaining: 9,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      amounts: {
        temporaryRunCredits: 9,
        afterRunUnpreventableCoreDamage: 1,
      },
    });

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(1);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageType: "core",
      amounts: {
        temporaryRunCreditsReturned: 9,
        damageAmount: 1,
      },
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies installed V1.9.15 run and access helpers through existing breach paths", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("v1915-installed-access-helpers"),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 12;
    for (const definitionId of [
      232,
      255,
      274,
      277,
    ] as const) {
      moveRunnerCardToGrip(state, definitionId);
      state.runner.clicks = 10;
      state.runner.credits = 20;
      const title = CARD_DEFINITIONS_BY_ID[definitionId]?.title;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          (!title || action.label.includes(title)),
      );
    }
    putCorpCardOnTopOfRd(state, 588);
    putCorpCardOnTopOfRd(state, 596);
    putCorpCardOnTopOfRd(state, 594);

    const dupreId = state.runner.rig.programs.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === 232,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(
      dupreId ? (state.cardInstances[dupreId]?.counters?.power ?? 0) : 0,
    ).toBe(0);
    expect(state.run?.breach?.queue).toHaveLength(1);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1915_installed_access_reveal",
    });
  });

  it("uses Dupré as a code-gate breaker and resets strength counters when the fort changes", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1915-dupre-breaker",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.runAccess.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          cards: [
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards,
            { id: 590, quantity: 2 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    state.runner.memoryLimit = 8;
    const dupreId = installRunnerProgramForTest(state, 232);
    putCorpIceOnServer(state, "rd", 590);
    putCorpCardOnTopOfRd(state, 596);

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
        sourceDefinition(state, action) === 590,
    );
    for (let index = 0; index < 2; index += 1)
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === dupreId,
      );
    for (let index = 0; index < 2; index += 1)
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === dupreId,
      );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(cardCounterAmount(state, dupreId, "power")).toBe(1);
    expect(state.cardInstances[dupreId]?.selectedServerId).toBe("rd");

    setCardCounterForTest(state, dupreId, "power", 3);
    putCorpIceOnServer(state, "hq", 590);
    for (const cardId of state.corp.hq.slice()) {
      removeEverywhere(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }
    moveCorpCardToHq(state, 596);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === 590,
    );
    for (let index = 0; index < 2; index += 1)
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === dupreId,
      );
    expect(cardCounterAmount(state, dupreId, "power")).toBe(0);
    expect(state.cardInstances[dupreId]?.selectedServerId).toBe("hq");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dupreId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dupreId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(cardCounterAmount(state, dupreId, "power")).toBe(1);
    expect(state.cardInstances[dupreId]?.selectedServerId).toBe("hq");
  });

  it("opens Smarteye before the Corp can rez approached unrezzed ICE", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("v1915-smarteye-before-rez"),
    );
    state.runner.credits = 10;
    state.corp.credits = 100;
    installRunnerProgramForTest(state, 277);
    const iceId = putCorpIceOnServer(state, "rd", 439);
    const hiddenOtherIceId = putCorpIceOnServer(
      state,
      "hq",
      467,
    );
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("runner");
    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual(
      [],
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.approachIceExposeDecision === "expose",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.approachIceExposeDecision === "expose",
    );

    expect(state.activeSide).toBe("runner");
    expect(state.run?.approachIceExposeViewingIceId).toBe(iceId);
    expect(state.run?.approachIceExposeUsedSourceIdsThisRun).toHaveLength(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose",
      revealKind: "expose",
      cardDefinitionId: 439,
    });
    expect(state.cardInstances[iceId]?.rezzed).toBe(false);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toEqual(["trigger_ability", "jack_out"]);
    const runnerView = getPlayerView(state, "runner");
    const unchangedHash = hashState(state);
    expect(runnerView.run?.approachedIce).toMatchObject({
      instanceId: iceId,
      known: true,
      definitionId: 439,
      effectiveRezCostQuote: {
        context: "installed",
        cardId: iceId,
        targetServerId: "rd",
        projectedServerId: "rd",
        expiresAtStateVersion: state.stateVersion,
        complete: true,
      },
      effectivePostRezRunQuote: {
        context: "installed_post_rez",
        cardId: iceId,
        iceDefinitionId: 439,
        targetServerId: "rd",
        projectedServerId: "rd",
        expiresAtStateVersion: state.stateVersion,
        complete: true,
      },
    });
    expect(hashState(state)).toBe(unchangedHash);
    const conditionalRunQuote =
      runnerView.run!.approachedIce!.effectivePostRezRunQuote;
    for (const server of runnerView.servers) {
      for (const card of server.ice) {
        expect(card.effectivePostRezRunQuote).toBeUndefined();
        expect(card.effectiveRezCostQuote).toBeUndefined();
      }
    }
    const hiddenVariant = structuredClone(state);
    hiddenVariant.cardInstances[hiddenOtherIceId]!.definitionId =
      436;
    for (const id of [...hiddenVariant.corp.hq, ...hiddenVariant.corp.rd]) {
      hiddenVariant.cardInstances[id]!.definitionId = 473;
    }
    expect(getPlayerView(hiddenVariant, "runner").run?.approachedIce).toEqual(
      runnerView.run?.approachedIce,
    );
    expect(
      runnerView.servers
        .find((server) => server.id === "rd")
        ?.ice.find((card) => card.instanceId === iceId),
    ).toMatchObject({ known: true, definitionId: 439 });

    const jackOutState = apply(
      structuredClone(state),
      "runner",
      (action) => action.type === "jack_out",
    );
    expect(jackOutState.run).toBeUndefined();
    expect(jackOutState.timingPoint).toBe("runner_action.main");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.approachIceExposeViewDecision === "finish",
    );

    expect(state.activeSide).toBe("corp");
    expect(state.run?.approachIceExposeViewingIceId).toBeUndefined();
    expect(getPlayerView(state, "runner").run?.approachedIce).toBeUndefined();
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === 439,
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === 439,
    );
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
    expect(
      getPlayerView(state, "runner").run?.encounteredIce?.effectiveRunQuote,
    ).toEqual(
      conditionalRunQuote?.complete
        ? conditionalRunQuote.effectiveRunQuote
        : undefined,
    );

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not spend Smarteye when declined and does not reopen it for the same ICE", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("v1915-smarteye-decline"),
    );
    state.runner.credits = 10;
    state.corp.credits = 0;
    installRunnerProgramForTest(state, 277);
    putCorpIceCopyOnServer(state, "rd", 439);
    putCorpIceOnServer(state, "rd", 467);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.activeSide).toBe("runner");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.approachIceExposeDecision === "decline",
    );

    expect(state.activeSide).toBe("corp");
    expect(state.run?.approachIceExposeUsedSourceIdsThisRun ?? []).toEqual([]);
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(
      getLegalActions(state, "corp").map((action) => action.type),
    ).toContain("decline_rez");

    state = apply(state, "corp", (action) => action.type === "decline_rez");

    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("run.approach_ice");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.approachIceExposeDecision === "expose",
      ),
    ).toBe(true);
  });

  it("opens root rez only after Runner declines jack out and then blocks movement", () => {
    let state = toRunnerTurn(v199CardReleaseGame("root-rez-window"));
    state.corp.credits = 10;
    const aardvarkId = putCorpRootInRemote(state, 561);
    const bizarreEncryptionId = putCorpRootInRemote(
      state,
      563,
    );
    putCorpIceOnServer(state, "remote_1", 491);
    const initial = structuredClone(state);

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
        action.payload?.runRootRezPass !== true,
    );

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toEqual(["jack_out", "continue_run"]);
    expect(
      getLegalActions(state, "corp").filter(
        (action) => action.type === "rez_card",
      ),
    ).toEqual([]);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Aardvark",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Bizarre Encryption Scheme",
    );

    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.timingPoint).toBe("run.movement_rez_window");
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(getPlayerView(state, "runner").legalActions).toEqual([]);
    expect(
      getLegalActions(state, "corp").filter(
        (action) => action.type === "rez_card",
      ),
    ).toHaveLength(2);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "decline_rez" &&
          action.payload?.runRootRezPass === true &&
          action.payload?.serverLabel === "Remote 1",
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        action.payload?.cardId === aardvarkId &&
        action.payload?.rootRez === true,
    );

    expect(state.cardInstances[aardvarkId]?.rezzed).toBe(true);
    expect(state.timingPoint).toBe("run.movement_rez_window");
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_card" &&
          action.payload?.cardId === bizarreEncryptionId,
      ),
    ).toBe(true);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );

    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).not.toContain("jack_out");
    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual(
      [],
    );
    expect(state.eventLog.at(-1)).toMatchObject({
      type: "decline_rez",
      visibilityClass: "public",
      publicPayload: {
        actionType: "decline_rez",
        runRootRezPass: true,
        serverLabel: "Remote 1",
      },
    });

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("accesses unrezzed Setup! without firing its installed damage effect", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("post-jack-out-setup"),
    );
    state.corp.credits = 10;
    const setupId = putCorpRootInRemote(state, 552);
    const iceId = addRezzedCorpIceForTest(
      state,
      589,
      "remote_1",
      "post_jack_out_setup",
    );
    state.cardInstances[iceId]!.rezzed = false;
    state.cardInstances[iceId]!.faceup = false;
    const initial = structuredClone(state);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");

    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "rez_card",
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.timingPoint).toBe("run.movement_rez_window");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );

    expect(state.cardInstances[setupId]?.rezzed).toBe(false);
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).not.toContain("jack_out");
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "decline_rez" &&
          action.payload?.runRootRezPass === true,
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run?.accessedCardId).toBe(setupId);
    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "damageResolved",
    );
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps V1.9.15 ICE overlaps side-safe through trace and damage windows", () => {
    for (const [definitionId, traceLimit] of [
      [439, 5],
      [467, 5],
    ] as const) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.runAccess(`v1915-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 12;
      state.runner.credits = 5;

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

      expect(state.pendingChoice?.side, String(definitionId)).toBe("corp");
      expect(state.pendingChoice?.kind, String(definitionId)).toBe("bid_amount");
      expect(
        getPlayerView(state, "runner").pendingChoice,
        String(definitionId),
      ).toBeUndefined();
      expect(state.trace, String(definitionId)).toMatchObject({
        status: "corp_bid",
        traceLimit,
      });
    }
  });

  it("applies Cerberus 3 net damage and does not give a false tag on trace success", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-cerberus-damage"),
    );
    drawRunnerCardsForTest(state, 5);
    putCorpIceOnServer(state, "rd", 439);
    state.corp.credits = 12;
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
        sourceDefinition(state, action) === 439,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.runner.grip.length).toBe(gripBefore - 3);
    expect(state.trace).toMatchObject({
      sourceDefinitionId: 439,
      successEffect: {
        type: "add_counter",
        counterType: "cerberus",
        amount: 1,
      },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 3,
      traceStarted: true,
      sourceDefinitionId: 439,
    });

    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      tagsAdded: 0,
      counterType: "cerberus",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });
    expect(cardCounterAmount(state, state.runner.identity, "cerberus")).toBe(1);
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
        action.payload?.counterType === "cerberus",
    );
    expect(cardCounterAmount(state, state.runner.identity, "cerberus")).toBe(0);
  });

  it("applies Cerberus counter damage at run start and replays it deterministically", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-cerberus-counter-run-start"),
    );
    drawRunnerCardsForTest(state, 6);
    setCardCounterForTest(state, state.runner.identity, "cerberus", 2);
    const initial = structuredClone(state);
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(state.runner.grip.length).toBe(gripBefore - 4);
    expect(cardCounterAmount(state, state.runner.identity, "cerberus")).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 439,
      cerberusCounterCount: 2,
      damageResolved: true,
      damageType: "net",
      damageAmount: 4,
      cardsTrashed: 4,
    });
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("conceals revealed unrezzed ICE and reorders installed ICE with New Blood", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1915-new-blood-reorder",
        runnerDeck: MECHANIC_SMOKE_DECKS.hiddenZone.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.hiddenZone.corp,
          id: "v1915_new_blood_reorder_corp",
          name: "V1.9.15 New Blood Reorder Corp",
          cards: [
            { id: 506, quantity: 1 },
            { id: 589, quantity: 2 },
            { id: 590, quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.hiddenZone.corp.cards.filter(
              (card) =>
                ![
                  506,
                  589,
                  590,
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    const operationId = moveCorpCardToHq(state, 506);
    const firstIceId = putCorpIceOnServer(state, "rd", 589);
    const secondIceId = putCorpIceOnServer(state, "hq", 590);
    state.cardInstances[firstIceId] = {
      ...state.cardInstances[firstIceId]!,
      faceup: true,
      rezzed: false,
    };
    state.cardInstances[secondIceId] = {
      ...state.cardInstances[secondIceId]!,
      faceup: false,
      rezzed: false,
    };
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 6;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === operationId,
    );
    expect(state.cardInstances[firstIceId]?.faceup).toBe(false);
    expect(state.pendingChoice?.source).toContain(
      "hidden_zone.conceal_and_reorder_installed_ice",
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      amounts: expect.objectContaining({ concealedIceCount: 1 }),
      targets: expect.objectContaining({ hiddenOrderChoice: true }),
    });

    state = applyChoices(state, "corp", [
      `card_${firstIceId}`,
      `card_${secondIceId}`,
    ]);
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice[0],
    ).toBe(secondIceId);
    expect(
      state.corp.servers.find((server) => server.id === "hq")?.ice[0],
    ).toBe(firstIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      amounts: expect.objectContaining({ reorderedIceCount: 2 }),
      targets: expect.objectContaining({ hiddenOrderChoice: true }),
    });
    expect(serializedDefinitionReferences(JSON.stringify(state.eventLog.at(-1)?.publicPayload))).not.toContain(
      590,
    );
  });
});
