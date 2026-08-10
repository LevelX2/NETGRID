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

describe("V1.9.13 Damage/Prevention/Replacement Longtail", () => {
  it("adds scoped V1.9.13 runtime definitions without pulling in V1.9.15 cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.damagePrevention).toHaveLength(17);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.damagePrevention) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      if (definitionId === "onr_v1_139_r-and-d-interface") {
        expect(definition?.mechanics).toEqual(
          expect.arrayContaining(["access_count", "modifiers"]),
        );
        expect(definition?.mechanics).not.toContain("damage_prevention");
      } else if (definitionId === "onr_v1_155_code-viral-cache") {
        expect(definition?.mechanics).toEqual(
          expect.arrayContaining([
            "runner_made_successful_run_on_server_this_turn",
            "purge_replacement_with_runner_virus_counter_cleanup",
            "corp_trash_installed_runner_resource",
          ]),
        );
        expect(definition?.mechanics).not.toContain("damage_prevention");
      }
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_276_viral-15"]?.implementationStatus,
    ).toBe("playable_mvp");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_234_data-darts"]).toMatchObject({
      rezCost: 5,
      strength: 3,
    });
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
            !id.startsWith("onr_v1_2") && id !== "onr_v1_155_code-viral-cache",
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
        state.cardInstances[id]?.definitionId === "onr_v1_155_code-viral-cache",
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
    const preserveOptions =
      state.pendingChoice?.options
        .map((option) => option.id)
        .filter((id) => id.startsWith(`card:${cacheId}:`))
        .slice(0, 2) ?? [];
    state = applyChoices(state, "runner", preserveOptions);
    expect(cardCounterAmount(state, cacheId, "virus")).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_155_code-viral-cache",
      preservedCounterAmount: 2,
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
        action.payload?.corpAbility ===
          "trash_installed_runner_resource_source",
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
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("v1913-armored-fridge"),
    );
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
      String(
        state.pendingChoice?.options.find((option) => option.id !== "pass")?.id,
      ),
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
      String(
        state.pendingChoice?.options.find((option) => option.id !== "pass")?.id,
      ),
    );
    expect(state.runner.rig.hardware).not.toContain(armoredFridgeId);
    expect(state.runner.heap).toContain(armoredFridgeId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      remainingCounters: 0,
      sourceTrashed: true,
    });
  });

  it("opens side-safe prevention choices for Corp ICE net damage and replays the resolved StateHash", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("v1913-ice-prevention"),
    );
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
