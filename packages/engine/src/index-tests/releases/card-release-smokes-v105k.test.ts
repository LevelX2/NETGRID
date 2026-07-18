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

describe("V1.0.5K Card Release", () => {
  it("keeps the final V1.0.5K card list small and backed by concrete definitions", () => {
    expect(ONR_V1_0_5K_FINAL_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_5K_FINAL_CARD_IDS.length).toBeLessThanOrEqual(20);
    for (const definitionId of ONR_V1_0_5K_FINAL_CARD_IDS) {
      expect(
        CARD_DEFINITIONS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(CARD_DEFINITIONS_BY_ID["onr_v1_237_data-wall"]).toMatchObject({
      rezCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_238_data-wall-2-0"]).toMatchObject({
      rezCost: 2,
      strength: 1,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_239_endless-corridor"]).toMatchObject(
      {
        rezCost: 4,
        strength: 2,
      },
    );
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_144_tycho-mem-chip"]).toMatchObject({
      installCost: 5,
      memoryLimitBonus: 3,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_146_zetatech-mem-chip"],
    ).toMatchObject({
      installCost: 3,
      memoryLimitBonus: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_203_hostile-takeover"]).toMatchObject(
      {
        advancementRequirement: 3,
        agendaPoints: 1,
      },
    );
  });

  it("validates the V1.0.5K smoke decks and starts on the current rules baseline", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_5K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_0_5K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v105kCardReleaseGame("v105k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(state.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.94",
    );
  });

  it("installs V1.0.5K memory chips with their printed MU bonuses and gates program installs by memory", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-memory-chips"));
    state.runner.credits = 40;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_144_tycho-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_146_zetatech-mem-chip");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_144_tycho-mem-chip",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_146_zetatech-mem-chip",
    );

    const runnerView = getPlayerView(state, "runner");
    expect(state.runner.memoryLimit).toBe(4);
    expect(runnerView.own.memoryLimit).toBe(9);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_144_tycho-mem-chip",
      )?.memoryLimitBonus,
    ).toBe(3);
    expect(
      runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_146_zetatech-mem-chip",
      )?.memoryLimitBonus,
    ).toBe(2);

    let gatedState = toRunnerTurn(v105kCardReleaseGame("v105k-memory-gate"));
    gatedState.runner.credits = 40;
    gatedState.runner.clicks = 10;
    installRunnerProgramForTest(gatedState, "onr_v1_015_codeslinger");
    installRunnerProgramForTest(gatedState, "onr_v1_052_raffles");
    installRunnerProgramForTest(gatedState, "onr_v1_054_raptor");
    installRunnerProgramForTest(gatedState, "onr_v1_070_tinweasel");
    moveRunnerCardCopyToGrip(gatedState, "onr_v1_015_codeslinger");

    expect(gatedState.runner.memoryUsed).toBe(4);
    expect(
      getLegalActions(gatedState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger",
      ),
    ).toBe(true);

    moveRunnerCardToGrip(gatedState, "onr_v1_144_tycho-mem-chip");
    gatedState = apply(
      gatedState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(gatedState, action) === "onr_v1_144_tycho-mem-chip",
    );
    expect(getPlayerView(gatedState, "runner").own.memoryLimit).toBe(7);
    expect(
      getLegalActions(gatedState, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(gatedState, action) === "onr_v1_015_codeslinger",
      ),
    ).toBe(true);
  });

  it("lets Runner trash installed programs before normal grip program installs", () => {
    let state = toRunnerTurn(
      v105kCardReleaseGame("runner-program-trash-install"),
    );
    state.runner.credits = 40;
    state.runner.clicks = 10;
    installRunnerProgramForTest(state, "onr_v1_015_codeslinger");
    const rafflesId = installRunnerProgramForTest(state, "onr_v1_052_raffles");
    installRunnerProgramForTest(state, "onr_v1_054_raptor");
    installRunnerProgramForTest(state, "onr_v1_070_tinweasel");
    installRunnerHardwareForTest(state, "onr_v1_144_tycho-mem-chip");
    const sourceId = moveRunnerCardCopyToGrip(state, "onr_v1_015_codeslinger");
    const initial = structuredClone(state);

    expect(state.runner.memoryUsed).toBe(4);
    const installAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_015_codeslinger" &&
        action.payload?.runnerProgramTrashBeforeInstall === true,
    );

    state = apply(
      state,
      "runner",
      (action) => action.actionId === installAction.actionId,
    );
    expect(state.runner.clicks).toBe(10);
    expect(state.runner.credits).toBe(40);
    expect(state.runner.grip).toContain(sourceId);
    expect(state.pendingChoice?.source).toContain(
      "runner_program_trash_before_install",
    );
    expect(state.pendingChoice?.options).toHaveLength(4);
    expect(
      state.pendingChoice?.options.every(
        (option) =>
          typeof option.value === "string" &&
          state.runner.rig.programs.includes(option.value),
      ),
    ).toBe(true);

    const trashOptionId = state.pendingChoice?.options.find(
      (option) => option.value === rafflesId,
    )?.id;
    if (!trashOptionId) throw new Error("Missing Raffles trash option");
    state = applyChoice(state, "runner", trashOptionId);

    expect(state.runner.heap).toContain(rafflesId);
    expect(state.runner.rig.programs).toContain(sourceId);
    expect(state.runner.memoryUsed).toBe(4);
    expect(state.runner.clicks).toBe(9);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("cancels or rejects invalid program-trash install choices without changing install costs", () => {
    let state = toRunnerTurn(
      v105kCardReleaseGame("runner-program-trash-cancel"),
    );
    state.runner.credits = 40;
    state.runner.clicks = 10;
    installRunnerProgramForTest(state, "onr_v1_015_codeslinger");
    const rafflesId = installRunnerProgramForTest(state, "onr_v1_052_raffles");
    installRunnerProgramForTest(state, "onr_v1_054_raptor");
    installRunnerProgramForTest(state, "onr_v1_070_tinweasel");
    const sourceId = moveRunnerCardCopyToGrip(state, "onr_v1_015_codeslinger");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_015_codeslinger" &&
        action.payload?.runnerProgramTrashBeforeInstall === true,
    );

    const clicksBeforeChoice = state.runner.clicks;
    const creditsBeforeChoice = state.runner.credits;
    const cancelled = applyChoices(state, "runner", []);
    expect(cancelled.pendingChoice).toBeUndefined();
    expect(cancelled.runner.grip).toContain(sourceId);
    expect(cancelled.runner.rig.programs).not.toContain(sourceId);
    expect(cancelled.runner.clicks).toBe(clicksBeforeChoice);
    expect(cancelled.runner.credits).toBe(creditsBeforeChoice);
    expect(cancelled.runner.memoryUsed).toBe(4);

    const choiceState = structuredClone(state);
    const resolveAction = mustAction(
      choiceState,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const trashOptionId = choiceState.pendingChoice?.options.find(
      (option) => option.value === rafflesId,
    )?.id;
    if (!trashOptionId) throw new Error("Missing Raffles trash option");

    const wrongSide = applyAction(choiceState, {
      matchId: choiceState.matchId,
      side: "corp",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: choiceState.stateVersion,
      selectedChoices: {
        choiceId: choiceState.pendingChoice?.choiceId,
        selectedOptionIds: [trashOptionId],
      },
      idempotencyKey: "corp-wrong-side-program-trash",
    });
    expect(wrongSide.ok).toBe(false);

    const stale = applyAction(choiceState, {
      matchId: choiceState.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: choiceState.stateVersion - 1,
      selectedChoices: {
        choiceId: choiceState.pendingChoice?.choiceId,
        selectedOptionIds: [trashOptionId],
      },
      idempotencyKey: "runner-stale-program-trash",
    });
    expect(stale.ok).toBe(false);

    const fakeTarget = applyAction(choiceState, {
      matchId: choiceState.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: choiceState.stateVersion,
      selectedChoices: {
        choiceId: choiceState.pendingChoice?.choiceId,
        selectedOptionIds: ["card_not_installed"],
      },
      idempotencyKey: "runner-fake-program-trash",
    });
    expect(fakeTarget.ok).toBe(false);

    const removedSource = structuredClone(choiceState);
    removeEverywhere(removedSource, sourceId);
    const missingSource = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      selectedChoices: {
        choiceId: removedSource.pendingChoice?.choiceId,
        selectedOptionIds: [trashOptionId],
      },
      idempotencyKey: "runner-missing-source-program-trash",
    });
    expect(missingSource.ok).toBe(false);
  });

  it("breaks matching V1.0.5K ICE subroutines and rejects mismatched breaker targets", () => {
    let state = toRunnerTurn(v105kCardReleaseGame("v105k-raffles-endless"));
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_052_raffles");
    putCorpIceOnServer(state, "rd", "onr_v1_239_endless-corridor");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
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
        sourceDefinition(state, action) === "onr_v1_239_endless-corridor",
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_052_raffles" &&
        action.payload?.subroutineIndex === 0,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_052_raffles" &&
        action.payload?.subroutineIndex === 1,
    );
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });

    for (const [breakerId, iceId] of [
      ["onr_v1_015_codeslinger", "onr_v1_237_data-wall"],
      ["onr_v1_070_tinweasel", "onr_v1_232_crystal-wall"],
    ] as const) {
      let mismatch = toRunnerTurn(
        v105kCardReleaseGame(`v105k-mismatch-${breakerId}`),
      );
      mismatch.runner.credits = 20;
      installRunnerProgramForTest(mismatch, breakerId);
      putCorpIceOnServer(mismatch, "rd", iceId);
      mismatch.corp.credits = 20;

      mismatch = apply(
        mismatch,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      mismatch = apply(
        mismatch,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(mismatch, action) === iceId,
      );
      mismatch = enterEncounterFromMovementWindow(mismatch);

      expect(
        getLegalActions(mismatch, "runner").some(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(mismatch, action) === breakerId,
        ),
      ).toBe(false);
    }
  });

  it("scores Hostile Takeover with its narrow on-score credit resolver and deterministic replay", () => {
    let state = createGameAfterSetup({
      seed: "v105k-hostile-takeover",
      runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
      corpDeck: ONR_V1_0_5K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    const initial = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );
    const beforeScoreCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
    );

    expect(state.corp.credits).toBe(beforeScoreCredits + 5);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      onScoreGainCredits: 5,
      corpCreditsAfter: state.corp.credits,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "corp_",
    );

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not offer a second agenda or asset into an occupied remote root", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_0_5K_CORP_DECK,
      id: "v105k_remote_root_limit_corp",
      cards: [
        ...ONR_V1_0_5K_CORP_DECK.cards,
        { id: "simple_economy_asset", quantity: 1 },
        { id: "simple_upgrade", quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "v105k-remote-root-limit",
      runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToHq(state, "simple_economy_asset");
    moveCorpCardToHq(state, "simple_upgrade");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover" &&
        action.payload?.serverId === "new_remote",
    );
    const actions = getLegalActions(state, "corp");

    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_agenda" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_economy_asset" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_upgrade" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(true);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_agenda" &&
          action.payload?.serverId === "new_remote",
      ),
    ).toBe(true);
  });

  it("lets the Corp install an agenda over an installed asset in a remote root", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_0_5K_CORP_DECK,
      id: "v105k_agenda_over_node_corp",
      cards: [
        ...ONR_V1_0_5K_CORP_DECK.cards,
        { id: "simple_economy_asset", quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "v105k-agenda-over-node",
      runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    const agendaId = moveCorpCardToHq(state, "simple_agenda");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === assetId &&
        action.payload?.serverId === "new_remote",
    );
    state.cardInstances[assetId] = {
      ...state.cardInstances[assetId]!,
      advancementCounters: 2,
      counters: { power: 1 },
    };
    const installAgenda = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === agendaId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.rootReplacement === "asset_to_agenda",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_economy_asset" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === installAgenda.actionId,
    );
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(remote?.root).toContain(agendaId);
    expect(remote?.root).not.toContain(assetId);
    expect(state.corp.archives).toContain(assetId);
    expect(state.cardInstances[assetId]?.zone).toEqual({
      side: "corp",
      zone: "archives",
    });
    expect(state.cardInstances[assetId]?.advancementCounters).toBe(0);
    expect(state.cardInstances[assetId]?.counters).toBeUndefined();
    expect(state.cardInstances[agendaId]?.zone).toEqual({
      side: "corp",
      zone: "serverRoot",
      serverId: "remote_1",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      rootReplacement: "asset_to_agenda",
      replacedRootCardType: "asset",
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      agendaId,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps V1.0.5K ICE hidden in Runner views until rez", () => {
    let state = toRunnerTurn(
      v105kCardReleaseGame("v105k-visibility-data-wall-2"),
    );
    putCorpIceOnServer(state, "rd", "onr_v1_238_data-wall-2-0");
    state.corp.credits = 20;

    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Data Wall 2.0",
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
        sourceDefinition(state, action) === "onr_v1_238_data-wall-2-0",
    );

    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Data Wall 2.0",
    );
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      cardDefinitionId: "onr_v1_238_data-wall-2-0",
      title: "Data Wall 2.0",
    });
  });
});
