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

describe("V1.2.2 Special Zones, Ownership and Control", () => {
  it("supports test-only return from Set Aside without enabling Removed from Game return", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "v122-return-terminal" }),
    );
    const setAsideId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: setAsideId,
      setAside: {
        visibility: "public",
        reason: "v122_public_set_aside",
        allowReturn: true,
        returnZone: { side: "runner", zone: "grip" },
      },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "return_from_set_aside",
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) => action.type === "return_from_set_aside",
    );
    expect(state.runner.grip).toContain(setAsideId);
    expect(state.specialZones?.setAside).toEqual([]);

    const removedId = moveRunnerCardToGrip(state, "simple_run_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: removedId,
      removedFromGame: {
        visibility: "hidden",
        reason: "v122_terminal_removed",
      },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_removed_from_game",
    );
    expect(state.specialZones?.removedFromGame).toEqual([removedId]);
    expect(state.cardInstances[removedId]?.zone).toMatchObject({
      side: "special",
      zone: "removed_from_game",
      visibility: "hidden",
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "return_from_set_aside",
      ),
    ).toBe(false);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Run Event",
    );
  });

  it("changes controller deterministically without changing owner and rejects wrong-side or stale actions", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-control" }));
    const cardId = installRunnerProgramForTest(state, "simple_fracter");
    const beforeHash = hashState(state);
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: {
        newController: "corp",
        visibility: "public",
        reason: "v122_limited_control_change",
      },
    };
    const action = mustAction(
      state,
      "runner",
      (candidate) => candidate.type === "change_card_control",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(wrongSide.ok).toBe(false);
    expect(stale.ok).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (candidate) => candidate.actionId === action.actionId,
    );

    expect(state.cardInstances[cardId]?.owner).toBe("runner");
    expect(state.cardInstances[cardId]?.controller).toBe("corp");
    expect(hashState(state)).not.toBe(beforeHash);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "change_card_control",
      oldController: "runner",
      newController: "corp",
      ownershipChanged: false,
    });
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === cardId,
      )?.controller,
    ).toBe("corp");
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps hosted card invariants when a controlled host is trashed", () => {
    let state = installedResourceCorpTurn("v122-host-control-trash");
    const resourceId = state.runner.rig.resources[0]!;
    const hostedId = installRunnerProgramForTest(state, "simple_decoder");
    state.cardInstances[hostedId] = {
      ...state.cardInstances[hostedId]!,
      hostedOn: resourceId,
    };
    state.specialZoneHarness = {
      actor: "corp",
      cardInstanceId: resourceId,
      controlChange: {
        newController: "corp",
        visibility: "public",
        reason: "v122_controlled_host",
      },
    };
    state = apply(
      state,
      "corp",
      (action) => action.type === "change_card_control",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === resourceId,
    );

    expect(validateGameState(state).ok).toBe(true);
    expect(state.runner.heap).toContain(resourceId);
    expect(state.runner.heap).toContain(hostedId);
    expect(state.cardInstances[resourceId]?.owner).toBe("runner");
    expect(state.cardInstances[resourceId]?.controller).toBe("corp");
    expect(state.cardInstances[hostedId]?.owner).toBe("runner");
    expect(state.cardInstances[hostedId]?.controller).toBe("runner");
    expect(state.cardInstances[hostedId]?.hostedOn).toBeUndefined();
  });
});
