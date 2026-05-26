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

describe("MVP 0.94 Damage and Flatline", () => {
  it("resolves net damage from a local sentry as hidden-info barrier without public grip leaks", () => {
    let state = toRunnerTurn(v094DamageGame("v094-net-damage"));
    const beforeGripIds = state.runner.grip.slice();
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const event = state.eventLog.at(-1);
    expect(event?.visibilityClass).toBe("hidden_info_barrier");
    expect(event ? isHiddenInfoBarrierEvent(event) : false).toBe(true);
    expect(event?.publicPayload).toMatchObject({
      actionType: "continue_run",
      damageResolved: true,
      damageType: "net",
      damageAmount: 1,
      cardsTrashed: 1,
      flatline: false,
    });
    expect(JSON.stringify(event?.publicPayload)).not.toContain("runner_");
    expect(state.runner.grip.length).toBe(beforeGripIds.length - 1);
    expect(state.runner.heap.length).toBe(1);
    expect(state.randomDrawRecords.at(-1)?.purpose).toContain("damage:");
    expect(new Set([...state.runner.grip, ...state.runner.heap]).size).toBe(
      beforeGripIds.length,
    );

    const corpView = getPlayerView(state, "corp");
    const serializedCorpView = JSON.stringify(corpView);
    const publicHeapCardIds = new Set(state.runner.heap);
    for (const cardId of beforeGripIds.filter((id) => !publicHeapCardIds.has(id))) {
      const title =
        DEMO_CARDS_BY_ID[state.cardInstances[cardId]?.definitionId ?? ""]
          ?.title;
      if (title) expect(serializedCorpView).not.toContain(title);
    }
    expect(corpView.opponent.discardCount).toBe(1);
    expect(corpView.opponent.discardCards?.map((card) => card.instanceId)).toEqual(
      state.runner.heap,
    );
    expect(corpView.opponent.discardCards?.every((card) => card.known)).toBe(
      true,
    );
  });

  it("flatlines the Runner without randomly revealing grip cards when damage exceeds grip size", () => {
    let state = toRunnerTurn(v094DamageGame("v094-flatline"));
    emptyRunnerGripForTest(state);
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
    state.corp.credits = 10;
    const randomBefore = state.randomDrawRecords.length;

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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.run).toBeUndefined();
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      flatline: true,
      cardsTrashed: 0,
      gameEndReason: "flatline",
    });
    expect(getPlayerView(state, "runner").gameEndReason).toBe("flatline");
  });

  it("supports meat and core damage through the EffectCommand path", () => {
    const state = v094DamageGame("v094-meat-effect");
    const beforeHash = hashState(state);
    const next = applyEffectCommands(state, [
      {
        type: "do_damage",
        damageType: "meat",
        amount: 2,
        source: "v094_test_meat",
      },
    ]);

    expect(hashState(state)).toBe(beforeHash);
    expect(next.runner.heap.length).toBe(2);
    expect(next.runner.grip.length).toBe(state.runner.grip.length - 2);
    expect(
      next.randomDrawRecords
        .slice(-2)
        .every((record) => record.purpose.includes("damage:")),
    ).toBe(true);
    expect(new Set(next.runner.heap).size).toBe(2);

    const core = applyEffectCommands(state, [
      {
        type: "do_damage",
        damageType: "core",
        amount: 2,
        source: "v111_test_core",
      },
    ]);
    expect(core.runner.heap.length).toBe(2);
    expect(core.runner.coreDamage).toBe(2);
    expect(getPlayerView(core, "runner").own.maxHandSize).toBe(3);
    expect(getPlayerView(core, "corp").opponent.coreDamage).toBe(2);
    expect(
      core.randomDrawRecords
        .slice(-2)
        .every((record) => record.purpose.includes(":core:")),
    ).toBe(true);

    let operationState = createGameAfterSetup({
      seed: "v111-core-operation",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    moveCorpCardToHq(operationState, "v111_core_damage_operation");
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) ===
          "v111_core_damage_operation",
    );
    expect(operationState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "core",
      damageAmount: 1,
      cardsTrashed: 1,
      coreDamageAfter: 1,
      runnerMaxHandSizeAfter: 4,
    });
  });

  it("runs V1.1.1 Discard phases through private LegalActions", () => {
    let state = createGameAfterSetup({ seed: "v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.hq.length).toBe(6);

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.phase).toBe("corp_discard_phase");
    expect(state.timingPoint).toBe("corp_discard.select_cards");
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "discard_phase",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(6);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    const discarded = String(state.pendingChoice?.options[0]?.value);
    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );
    expect(state.phase).toBe("runner_action_phase");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.corp.hq).not.toContain(discarded);
    expect(state.corp.archives).toContain(discarded);
    expect(state.cardInstances[discarded]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      discardResolved: true,
      discardSide: "corp",
      discardCount: 1,
      discardZone: "archives",
    });
    expect(
      JSON.stringify(getPlayerView(state, "runner").publicEvents.at(-1)),
    ).not.toContain(String(state.cardInstances[discarded]?.definitionId));
  });

  it("revalidates Runner Discard choices and moves selected cards to the heap", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v111-runner-discard" }),
    );
    drawRunnerCardsForTest(state, 2);
    expect(state.runner.grip.length).toBe(7);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "discard_phase",
      minSelections: 2,
      maxSelections: 2,
    });

    const action = mustAction(
      state,
      "runner",
      (candidate) => candidate.type === "resolve_choice",
    );
    const oneOption = state.pendingChoice?.options[0]?.id;
    const wrongCount = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [oneOption],
      },
    });
    expect(wrongCount.ok).toBe(false);
    if (wrongCount.ok) throw new Error("Expected invalid choice");
    expect(wrongCount.error.code).toBe("ERR_INVALID_CHOICE");

    const selectedOptionIds =
      state.pendingChoice?.options.slice(0, 2).map((option) => option.id) ?? [];
    const selectedCardIds =
      state.pendingChoice?.options
        .slice(0, 2)
        .map((option) => String(option.value)) ?? [];
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.phase).toBe("corp_draw_phase");
    expect(state.runner.grip.length).toBe(5);
    expect(selectedCardIds.every((id) => state.runner.heap.includes(id))).toBe(
      true,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      discardResolved: true,
      discardSide: "runner",
      discardCount: 2,
      discardZone: "heap",
    });
  });

  it("flatlines at the start of the Runner discard step when core damage makes handlimit negative", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v111-negative-handlimit" }),
    );
    state.runner.coreDamage = 6;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.pendingChoice).toBeUndefined();
  });

  it("replays damage and reproduces the final StateHash", () => {
    let state = toRunnerTurn(v094DamageGame("v094-replay"));
    putCorpIceOnServer(state, "rd", "v094_neural_sentry_ice");
    state.corp.credits = 10;
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
        sourceDefinition(state, action) === "v094_neural_sentry_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not expose later mechanics while enabling Damage", () => {
    const state = toRunnerTurn(v094DamageGame("v094-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(actionTypes).not.toContain("remove_tag");
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "trace",
    );
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "resource",
    );
    expect(DEMO_CARDS_BY_ID.v094_neural_sentry_ice?.mechanics).not.toContain(
      "prevention",
    );
  });
});

describe("V1.9.13 Damage/Prevention/Replacement Longtail", () => {
  it("adds scoped V1.9.13 runtime definitions without pulling in V1.9.15 cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.damagePrevention).toHaveLength(17);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.damagePrevention) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      if (definitionId === "onr_v1_139_r-and-d-interface") {
        expect(definition?.mechanics).toEqual(
          expect.arrayContaining(["access", "breach", "multiaccess"]),
        );
        expect(definition?.mechanics).not.toContain("damage_prevention");
      } else if (definitionId === "onr_v1_155_code-viral-cache") {
        expect(definition?.mechanics).toEqual(
          expect.arrayContaining([
            "successful_hq_run_condition",
            "virus_counter_purge_replacement",
            "corp_trash_action",
          ]),
        );
        expect(definition?.mechanics).not.toContain("damage_prevention");
      } else {
        expect(definition?.mechanics.join(" "), definitionId).toMatch(
          /damage|prevention|event_modification|flatline|tag_avoid/,
        );
      }
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("installs V1.9.13 Runner prevention cards through legal install actions", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("v1913-install-prevention"),
    );
    state.runner.credits = 80;
    state.runner.clicks = 30;

    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.damagePrevention.filter(
      (id) =>
        ![
          "onr_v1_224_bolter-cluster",
          "onr_v1_234_data-darts",
          "onr_v1_258_neural-blade",
          "onr_v1_155_code-viral-cache",
        ].includes(id),
    )) {
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
    }

    const installedDefinitions = [
      ...state.runner.rig.programs,
      ...state.runner.rig.hardware,
      ...state.runner.rig.resources,
    ].map((id) => state.cardInstances[id]?.definitionId);
    expect(installedDefinitions).toEqual(
      expect.arrayContaining(
        MECHANIC_SMOKE_CARD_IDS.damagePrevention.filter(
          (id) =>
            !id.startsWith("onr_v1_2") &&
            id !== "onr_v1_155_code-viral-cache",
        ),
      ),
    );
  });

  it("gates Code Viral Cache on HQ success, preserves two purge counters and lets Corp trash it", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("v1913-code-viral-cache"),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    state.runner.clicks = 4;
    const cacheGripId = moveRunnerCardToGrip(
      state,
      "onr_v1_155_code-viral-cache",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === cacheGripId,
      ),
    ).toBe(false);

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      successfulHqRunThisTurn: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_155_code-viral-cache",
    );
    const cacheId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_155_code-viral-cache",
    );
    expect(cacheId).toBeDefined();
    if (!cacheId) throw new Error("Missing installed Code Viral Cache");
    setCardCounterForTest(state, cacheId, "virus", 3);
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;

    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.pendingChoice?.maxSelections).toBe(2);
    const preserveOptions = state.pendingChoice?.options
      .map((option) => option.id)
      .filter((id) => id.startsWith(`card:${cacheId}:`))
      .slice(0, 2) ?? [];
    state = applyChoices(state, "runner", preserveOptions);
    expect(cardCounterAmount(state, cacheId, "virus")).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_155_code-viral-cache",
      codeViralCachePreservedCounters: 2,
      remainingVirusCounters: 2,
    });

    state.corp.clicks = 1;
    state.corp.credits = 5;
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.corpAbility === "trash_code_viral_cache",
    );
    expect(
      state.runner.rig.resources.some(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_155_code-viral-cache",
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_155_code-viral-cache",
      amounts: {
        trashCostPaid: 5,
      },
      targets: {
        trashedCardDefinitionId: "onr_v1_155_code-viral-cache",
      },
    });
  });

  it("spends Armored Fridge counters for meat prevention and trashes the empty source", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.damagePrevention("v1913-armored-fridge"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_121_armored-fridge");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_121_armored-fridge",
    );
    const armoredFridgeId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_121_armored-fridge",
    );
    expect(armoredFridgeId).toBeDefined();
    if (!armoredFridgeId) throw new Error("Missing Armored Fridge install");
    expect(cardCounterAmount(state, armoredFridgeId, "ablative")).toBe(7);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      counterType: "ablative",
      addedCounterAmount: 7,
      remainingCounters: 7,
    });

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );
    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    state = applyChoice(
      state,
      "runner",
      String(state.pendingChoice?.options.find((option) => option.id !== "pass")?.id),
    );
    expect(cardCounterAmount(state, armoredFridgeId, "ablative")).toBe(6);
    expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 1,
      counterType: "ablative",
      removedCounterAmount: 1,
      remainingCounters: 6,
      sourceTrashed: false,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /Simple|Armored Fridge"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    setCardCounterForTest(state, armoredFridgeId, "ablative", 1);
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );
    state = applyChoice(
      state,
      "runner",
      String(state.pendingChoice?.options.find((option) => option.id !== "pass")?.id),
    );
    expect(state.runner.rig.hardware).not.toContain(armoredFridgeId);
    expect(state.runner.heap).toContain(armoredFridgeId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      remainingCounters: 0,
      sourceTrashed: true,
    });
  });

  it("opens side-safe prevention choices for Corp ICE net damage and replays the resolved StateHash", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.damagePrevention("v1913-ice-prevention"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_128_green-knight-surge-buffers");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_128_green-knight-surge-buffers",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_258_neural-blade");
    putCorpCardOnTopOfRd(state, "simple_agenda");

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
        sourceDefinition(state, action) === "onr_v1_258_neural-blade",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventOptionId));
    expect(state.runner.heap.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 0,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
