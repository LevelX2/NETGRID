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

describe("V1.0.5K Card Release", () => {
  it("keeps the final V1.0.5K card list small and backed by concrete definitions", () => {
    expect(ONR_V1_0_5K_FINAL_CARD_IDS).toHaveLength(12);
    expect(ONR_V1_0_5K_FINAL_CARD_IDS.length).toBeLessThanOrEqual(20);
    for (const definitionId of ONR_V1_0_5K_FINAL_CARD_IDS) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_237_data-wall"]).toMatchObject({
      rezCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_238_data-wall-2-0"]).toMatchObject({
      rezCost: 2,
      strength: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_239_endless-corridor"]).toMatchObject({
      rezCost: 5,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_144_tycho-mem-chip"]).toMatchObject({
      installCost: 5,
      memoryLimitBonus: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_146_zetatech-mem-chip"]).toMatchObject({
      installCost: 3,
      memoryLimitBonus: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_203_hostile-takeover"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
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
    let state = toRunnerTurn(v105kCardReleaseGame("runner-program-trash-install"));
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

    state = apply(state, "runner", (action) => action.actionId === installAction.actionId);
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
    let state = toRunnerTurn(v105kCardReleaseGame("runner-program-trash-cancel"));
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
    const remote = state.corp.servers.find((server) => server.id === "remote_1");
    expect(remote?.root).toContain(agendaId);
    expect(remote?.root).not.toContain(assetId);
    expect(state.corp.archives).toContain(assetId);
    expect(state.cardInstances[assetId]?.zone).toEqual({
      side: "corp",
      zone: "archives",
    });
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

describe("V1.0.6K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_0_6K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_0_6K_FINAL_CARD_IDS) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_072_wild-card"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_145_wutech-mem-chip"]).toMatchObject({
      installCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_220_tycho-extension"]).toMatchObject({
      advancementRequirement: 4,
      agendaPoints: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_244_filter"]).toMatchObject({
      rezCost: 0,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_245_fire-wall"]).toMatchObject({
      rezCost: 1,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_252_keeper"]).toMatchObject({
      rezCost: 4,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_256_mazer"]).toMatchObject({
      rezCost: 5,
      strength: 5,
    });
  });

  it("validates V1.0.6K smoke decks and keeps the previous V1.0.5K cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_0_6K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_0_6K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v106kCardReleaseGame("v106k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_203_hostile-takeover"]).toBeDefined();
  });

  it("plays V1.0.6K Runner economy/draw cards, installs WuTech and uses Wild Card", () => {
    let state = toRunnerTurn(v106kCardReleaseGame("v106k-runner-cards"));
    state.runner.credits = 40;
    state.runner.clicks = 12;
    moveRunnerCardToGrip(state, "onr_v1_079_bodyweight-synthetic-blood");
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    moveRunnerCardToGrip(state, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(state, "onr_v1_108_score");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_072_wild-card");

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
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_072_wild-card",
    );
    expect(state.runner.memoryLimit).toBe(4);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(5);
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("onr_v1_072_wild-card");

    let sentryRun = toRunnerTurn(
      v106kCardReleaseGame("v106k-wild-card-sentry"),
    );
    sentryRun.runner.credits = 20;
    installRunnerProgramForTest(sentryRun, "onr_v1_072_wild-card");
    putCorpIceOnServer(sentryRun, "rd", "simple_sentry_ice");
    putCorpCardOnTopOfRd(sentryRun, "simple_economy_operation");
    sentryRun.corp.credits = 20;

    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    sentryRun = apply(
      sentryRun,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(sentryRun, action) === "simple_sentry_ice",
    );
    sentryRun = enterEncounterFromMovementWindow(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryRun, action) === "onr_v1_072_wild-card",
    );
    sentryRun = continueRunThroughMovement(sentryRun);
    sentryRun = apply(
      sentryRun,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
  });

  it("plays V1.0.6K Corp economy, tagged and damage operations", () => {
    let state = createGameAfterSetup({
      seed: "v106k-corp-operations",
      runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
      corpDeck: ONR_V1_0_6K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.runner.tags = 1;
    state.runner.credits = 9;
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_282_annual-reviews");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");
    moveCorpCardToHq(state, "onr_v1_290_efficiency-experts");
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

    const beforeReviewsHq = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_282_annual-reviews",
    );
    expect(state.corp.hq.length).toBe(beforeReviewsHq + 2);

    const beforeDayShiftHq = state.corp.hq.length;
    const beforeDayShiftCredits = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(beforeDayShiftHq + 1);
    expect(state.corp.credits).toBe(beforeDayShiftCredits + 1);

    const beforeEfficiency = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_290_efficiency-experts",
    );
    expect(state.corp.credits).toBe(beforeEfficiency + 3);

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
        seed: `v106k-${definitionId}`,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
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
    }
  });

  it("rezzes V1.0.6K simple ICE and keeps unrezzed titles hidden", () => {
    for (const definitionId of [
      "onr_v1_244_filter",
      "onr_v1_245_fire-wall",
      "onr_v1_252_keeper",
      "onr_v1_256_mazer",
    ] as const) {
      let state = toRunnerTurn(
        v106kCardReleaseGame(`v106k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 20;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
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
          sourceDefinition(state, action) === definitionId,
      );

      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
    }
  });
});

describe("V1.1.2K Card Release", () => {
  it("adds exactly 20 further O:NR cards backed by existing engine definitions", () => {
    expect(ONR_V1_1_2K_FINAL_CARD_IDS).toHaveLength(20);
    for (const definitionId of ONR_V1_1_2K_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity/,
      );
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_006_black-dahlia"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_014_codecracker"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_016_cyfermaster"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_040_loony-goon"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_060_shaka"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_073_wizards-book"]).toMatchObject({
      installCost: 5,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_253_laser-wire"]).toMatchObject({
      rezCost: 4,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_257_nerve-labyrinth"]).toMatchObject({
      rezCost: 7,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_278_wall-of-ice"]).toMatchObject({
      rezCost: 13,
      strength: 6,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_293_netwatch-credit-voucher"],
    ).toMatchObject({ cost: 0 });
    expect(DEMO_CARDS_BY_ID["onr_v1_295_night-shift"]).toMatchObject({
      cost: 0,
    });
  });

  it("validates V1.1.2K smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_1_2K_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_1_2K_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v112kCardReleaseGame("v112k-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_015_codeslinger"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_220_tycho-extension"]).toBeDefined();
  });

  it("installs V1.1.2K breakers and uses the existing code-gate and sentry break rules", () => {
    let installState = toRunnerTurn(
      v112kCardReleaseGame("v112k-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_006_black-dahlia",
      "onr_v1_014_codecracker",
      "onr_v1_016_cyfermaster",
      "onr_v1_040_loony-goon",
      "onr_v1_060_shaka",
      "onr_v1_073_wizards-book",
    ] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(
        installState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(installState, action) === definitionId,
      );
    }
    expect(installState.runner.memoryUsed).toBe(6);

    let codeGateState = toRunnerTurn(
      v112kCardReleaseGame("v112k-codecracker-quandary"),
    );
    codeGateState.runner.credits = 20;
    installRunnerProgramForTest(codeGateState, "onr_v1_014_codecracker");
    putCorpIceOnServer(codeGateState, "rd", "onr_v1_261_quandary");
    putCorpCardOnTopOfRd(codeGateState, "simple_economy_operation");
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
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(codeGateState, action) === "onr_v1_014_codecracker",
    );
    codeGateState = continueRunThroughMovement(codeGateState);
    codeGateState = apply(
      codeGateState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(codeGateState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });

    let sentryState = toRunnerTurn(
      v112kCardReleaseGame("v112k-loony-goon-face"),
    );
    sentryState.runner.credits = 20;
    installRunnerProgramForTest(sentryState, "onr_v1_040_loony-goon");
    putCorpIceOnServer(sentryState, "rd", "onr_v1_259_in-the-face");
    putCorpCardOnTopOfRd(sentryState, "simple_economy_operation");
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
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sentryState, action) === "onr_v1_040_loony-goon",
    );
    sentryState = continueRunThroughMovement(sentryState);
    sentryState = apply(
      sentryState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(sentryState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
  });

  it("plays V1.1.2K Corp operations and resolves new ICE through visibility-safe replayable paths", () => {
    let operationState = createGameAfterSetup({
      seed: "v112k-corp-operations",
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    operationState = apply(
      operationState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    operationState.corp.credits = 20;
    operationState.corp.clicks = 8;
    operationState.runner.tags = 1;
    moveCorpCardToHq(operationState, "onr_v1_293_netwatch-credit-voucher");
    moveCorpCardToHq(operationState, "onr_v1_295_night-shift");

    const beforeVoucherTags = operationState.runner.tags;
    const beforeVoucherCredits = operationState.corp.credits;
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) ===
          "onr_v1_293_netwatch-credit-voucher",
    );
    expect(operationState.runner.tags).toBe(beforeVoucherTags + 1);
    expect(operationState.corp.credits).toBe(beforeVoucherCredits + 1);

    const beforeNightShiftCards = operationState.corp.hq.length;
    const beforeNightShiftCredits = operationState.corp.credits;
    operationState = apply(
      operationState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(operationState, action) === "onr_v1_295_night-shift",
    );
    expect(operationState.corp.credits).toBe(beforeNightShiftCredits + 2);
    expect(operationState.corp.hq.length).toBe(beforeNightShiftCards);

    for (const definitionId of [
      "onr_v1_253_laser-wire",
      "onr_v1_257_nerve-labyrinth",
      "onr_v1_262_razor-wire",
      "onr_v1_263_reinforced-wall",
      "onr_v1_265_rock-is-strong",
      "onr_v1_266_scramble",
      "onr_v1_269_shotgun-wire",
      "onr_v1_270_sleeper",
      "onr_v1_278_wall-of-ice",
      "onr_v1_279_wall-of-static",
    ] as const) {
      let state = toRunnerTurn(
        v112kCardReleaseGame(`v112k-ice-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 30;

      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
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
          sourceDefinition(state, action) === definitionId,
      );
      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

      const beforeContinue = structuredClone(state);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(
        replayEvents(
          beforeContinue,
          state.eventLog.slice(beforeContinue.eventLog.length),
        ).ok,
      ).toBe(true);
    }
  });
});

describe("V1.2.3 Mechanic Unlock Card Release 1", () => {
  it("adds exactly eleven human-playable O:NR cards without opening deferred mechanics", () => {
    expect(ONR_V1_2_3_FINAL_CARD_IDS).toHaveLength(11);
    for (const definitionId of ONR_V1_2_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /prevention|avoid|replacement|hosting|virus|recurring_credit|bad_publicity|format|deckbuilder|parser/,
      );
    }

    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_039_krash"]).toMatchObject({
      installCost: 0,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_066_snowball"]).toMatchObject({
      installCost: 10,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_074_worm"]).toMatchObject({
      installCost: 4,
      memoryCost: 1,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_081_custodial-position"]).toMatchObject({
      cost: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_085_executive-wiretaps"]).toMatchObject({
      cost: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_101_mit-west-tier"]).toMatchObject({
      cost: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_243_fetch-4-0-1"]).toMatchObject({
      rezCost: 0,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_249_hunter"]).toMatchObject({
      rezCost: 2,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_297_overtime-incentives"]).toMatchObject({
      cost: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_306_trojan-horse"]).toMatchObject({
      cost: 2,
    });
  });

  it("validates V1.2.3 smoke decks after the V1.2.2 gate", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_2_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_2_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v123CardReleaseGame("v123-validation");

    expect(runnerValidation.errors).toEqual([]);
    expect(runnerValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(state.specialZones).toEqual({ setAside: [], removedFromGame: [] });
  });

  it("installs the four unlocked breakers and resolves wall, sentry and universal break rules", () => {
    let installState = toRunnerTurn(
      v123CardReleaseGame("v123-runner-breakers"),
    );
    installState.runner.credits = 50;
    installState.runner.clicks = 12;
    installState.runner.memoryLimit = 10;
    for (const definitionId of [
      "onr_v1_021_dwarf",
      "onr_v1_039_krash",
      "onr_v1_066_snowball",
      "onr_v1_074_worm",
    ] as const) {
      moveRunnerCardToGrip(installState, definitionId);
      installState = apply(
        installState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(installState, action) === definitionId,
      );
    }
    expect(installState.runner.memoryUsed).toBe(4);

    const breakCases = [
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_237_data-wall",
        seed: "dwarf-wall",
      },
      {
        breaker: "onr_v1_021_dwarf",
        ice: "onr_v1_279_wall-of-static",
        seed: "dwarf-wall-of-static",
      },
      {
        breaker: "onr_v1_074_worm",
        ice: "onr_v1_237_data-wall",
        seed: "worm-wall",
      },
      {
        breaker: "onr_v1_066_snowball",
        ice: "onr_v1_259_in-the-face",
        seed: "snowball-sentry",
      },
      {
        breaker: "onr_v1_039_krash",
        ice: "onr_v1_261_quandary",
        seed: "krash-code-gate",
      },
    ] as const;

    for (const testCase of breakCases) {
      let state = toRunnerTurn(v123CardReleaseGame(`v123-${testCase.seed}`));
      state.runner.credits = 20;
      state.corp.credits = 20;
      installRunnerProgramForTest(state, testCase.breaker);
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");

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
          sourceDefinition(state, action) === testCase.ice,
      );
      for (
        let pumpCount = 0;
        pumpCount < 5 &&
        !getLegalActions(state, "runner").some(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
        pumpCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            sourceDefinition(state, action) === testCase.breaker,
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === testCase.breaker,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      for (
        let continueCount = 0;
        continueCount < 3 &&
        !getLegalActions(state, "runner").some(
          (action) => action.type === "access_card",
        );
        continueCount += 1
      ) {
        state = apply(
          state,
          "runner",
          (action) => action.type === "continue_run",
        );
      }
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "access_card",
        cardDefinitionId: "simple_economy_operation",
      });
    }
  });

  it("qualifies breaker encounter labels and keeps wall-breaker pump paths deterministic", () => {
    let state = toRunnerTurn(
      v123CardReleaseGame("v123-dwarf-krash-wall-of-static"),
    );
    state.runner.credits = 30;
    installRunnerProgramForTest(state, "onr_v1_021_dwarf");
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );

    const initialEncounterActions = getLegalActions(state, "runner");
    const initialPumpLabels = initialEncounterActions
      .filter((action) => action.type === "pump_breaker")
      .map((action) => action.label);
    expect(initialPumpLabels).toEqual(
      expect.arrayContaining(["Dwarf: Stärke +1", "Krash: Stärke +1"]),
    );
    expect(
      initialEncounterActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_021_dwarf",
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dwarfBreak = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    expect(dwarfBreak.label).toBe("Dwarf: Subroutine brechen");
  });

  it("keeps Krash strength pumps for the current run and clears them at run end", () => {
    const runnerDeck: DeckDefinition = {
      ...ONR_V1_RUNNER_DECK,
      id: "v123_krash_run_pump_runner",
      name: "V1.2.3 Krash Run Pump Runner",
      cards: [
        { id: "onr_v1_039_krash", quantity: 1 },
        ...ONR_V1_RUNNER_DECK.cards.filter(
          (card) => card.id !== "onr_v1_039_krash",
        ),
      ],
    };
    const corpDeck: DeckDefinition = {
      ...ONR_V1_CORP_DECK,
      id: "v123_krash_run_pump_corp",
      name: "V1.2.3 Krash Run Pump Corp",
      cards: [
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 2 },
        { id: "simple_economy_operation", quantity: 1 },
        ...ONR_V1_CORP_DECK.cards.filter(
          (card) =>
            card.id !== "simple_barrier_ice" &&
            card.id !== "simple_code_gate_ice" &&
            card.id !== "simple_economy_operation",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v123-krash-run-pump-duration",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_039_krash");
    const krashId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_039_krash",
    );
    expect(krashId).toBeDefined();
    if (!krashId) return;

    putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

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
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === krashId,
    );
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(3);
    const krashModifierState = structuredClone(state);
    const krashModifierHash = hashState(state);
    const krashModifiers = collectActiveModifiers(state);
    expect(state).toEqual(krashModifierState);
    expect(hashState(state)).toBe(krashModifierHash);
    expect(
      krashModifiers.filter(
        (modifier) =>
          modifier.kind === "breaker_strength" &&
          modifier.target?.id === krashId,
      ),
    ).toEqual([
      expect.objectContaining({
        sourceDefinitionId: "onr_v1_039_krash",
        side: "runner",
        amount: 3,
        duration: "run",
        target: { kind: "card", id: krashId },
        visibility: "public",
      }),
    ]);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 0,
    );
    state = continueRunThroughMovement(state);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_code_gate_ice",
    );
    state = enterEncounterFromMovementWindow(state);

    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(3);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === krashId,
      ),
    ).toBe(true);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 0,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === krashId &&
        action.payload?.subroutineIndex === 1,
    );
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === krashId,
      )?.strength,
    ).toBe(0);
    expect(
      collectActiveModifiers(state).some(
        (modifier) =>
          modifier.kind === "breaker_strength" &&
          modifier.target?.id === krashId,
      ),
    ).toBe(false);
  });

  function p344MoveRunnerCardToGrip(
    state: GameState,
    definitionId: CardDefinitionId,
  ): CardInstanceId {
    if (
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === definitionId,
      )
    )
      return moveRunnerCardToGrip(state, definitionId);
    const instanceId =
      `p344_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
    state.cardInstances[instanceId] = {
      instanceId,
      definitionId,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.runner.grip.unshift(instanceId);
    return instanceId;
  }

  function p344PutCorpIceOnServer(
    state: GameState,
    serverId: "hq" | "rd" | "archives" | `remote_${number}`,
    definitionId: CardDefinitionId,
  ): CardInstanceId {
    if (
      Object.values(state.cardInstances).some(
        (card) => card.definitionId === definitionId,
      )
    )
      return putCorpIceOnServer(state, serverId, definitionId);
    const server = state.corp.servers.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error("Missing server");
    const instanceId =
      `p344_${definitionId}_${Object.keys(state.cardInstances).length}` as CardInstanceId;
    server.ice.push(instanceId);
    state.cardInstances[instanceId] = {
      instanceId,
      definitionId,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    return instanceId;
  }

  function p344EncounterState(
    seed: string,
    breakerDefinitionId: CardDefinitionId,
    iceDefinitionId: CardDefinitionId,
  ): { state: GameState; breakerId: CardInstanceId } {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed,
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 80;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 20;
    state.corp.credits = 80;
    p344MoveRunnerCardToGrip(state, breakerDefinitionId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === breakerDefinitionId,
    );
    const breakerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
    );
    if (!breakerId) throw new Error(`Missing breaker ${breakerDefinitionId}`);
    p344PutCorpIceOnServer(state, "rd", iceDefinitionId);
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
        sourceDefinition(state, action) === iceDefinitionId,
    );
    return { state, breakerId };
  }

  function p344PumpUntilBreak(
    state: GameState,
    breakerId: CardInstanceId,
  ): GameState {
    let current = state;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const breakAction = getLegalActions(current, "runner").find(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === 0,
      );
      if (breakAction) return current;
      const pumpAction = getLegalActions(current, "runner").find(
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === breakerId,
      );
      if (!pumpAction) return current;
      current = apply(current, "runner", (action) => action.actionId === pumpAction.actionId);
    }
    return current;
  }

  it("runs P3.44 simple icebreaker break and pump matchers without duplicate actions", () => {
    const specs = [
      ["Krash", "onr_v1_039_krash", "simple_code_gate_ice", 2, true],
      ["Codecracker", "onr_v1_014_codecracker", "simple_code_gate_ice", 0, true],
      ["Cyfermaster", "onr_v1_016_cyfermaster", "simple_code_gate_ice", 2, true],
      ["Raffles", "onr_v1_052_raffles", "simple_code_gate_ice", 1, true],
      ["Tinweasel", "onr_v1_070_tinweasel", "simple_code_gate_ice", 0, false],
      ["Wizard's Book", "onr_v1_073_wizards-book", "simple_code_gate_ice", 0, true],
      ["Dwarf", "onr_v1_021_dwarf", "onr_v1_237_data-wall", 1, true],
      ["Worm", "onr_v1_074_worm", "onr_v1_237_data-wall", 0, true],
      ["Black Dahlia", "onr_v1_006_black-dahlia", "simple_sentry_ice", 2, true],
      ["Codeslinger", "onr_v1_015_codeslinger", "simple_sentry_ice", 1, false],
      ["Loony Goon", "onr_v1_040_loony-goon", "simple_sentry_ice", 1, true],
      ["Raptor", "onr_v1_054_raptor", "simple_sentry_ice", 2, true],
      ["Shaka", "onr_v1_060_shaka", "simple_sentry_ice", 1, true],
      ["Wild Card", "onr_v1_072_wild-card", "simple_sentry_ice", 0, true],
      ["Flak", "onr_v1_027_flak", "onr_v1_280_zombie", 1, true],
      ["Dogcatcher", "onr_v1_018_dogcatcher", "onr_v1_243_fetch-4-0-1", 1, true],
      ["Reflector", "onr_v1_055_reflector", "onr_v1_271_tko-2-0", 0, false],
      ["Replicator", "onr_v1_056_replicator", "onr_v1_221_asp", 0, true],
    ] as const;

    for (const [label, breakerDefinitionId, iceDefinitionId, expectedCost, hasPump] of specs) {
      const { state: initialEncounter, breakerId } = p344EncounterState(
        `p344-${label}`,
        breakerDefinitionId,
        iceDefinitionId,
      );
      let state = p344PumpUntilBreak(initialEncounter, breakerId);
      expect(
        getLegalActions(initialEncounter, "runner").some(
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === breakerId,
        ),
        label,
      ).toBe(hasPump);
      const breakActions = getLegalActions(state, "runner").filter(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === 0,
      );
      expect(breakActions, label).toHaveLength(1);
      expect(breakActions[0]?.costs[0]?.credits, label).toBe(expectedCost);
      const beforeBreak = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "runner", (action) => action.actionId === breakActions[0]?.actionId);
      expect(state.run?.brokenSubroutineIndexes, label).toContain(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload), label).not.toMatch(
        /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
      );
      const replay = replayEvents(beforeBreak, state.eventLog.slice(replayStart));
      expect(replay.ok, label).toBe(true);
      expect(hashState(replay.state), label).toBe(hashState(state));
    }
  });

  it("keeps P3.44 negative matchers and killer restricted credits scoped", () => {
    let dogcatcher = p344EncounterState(
      "p344-dogcatcher-negative",
      "onr_v1_018_dogcatcher",
      "simple_sentry_ice",
    ).state;
    dogcatcher = p344PumpUntilBreak(
      dogcatcher,
      dogcatcher.runner.rig.programs.find(
        (id) => dogcatcher.cardInstances[id]?.definitionId === "onr_v1_018_dogcatcher",
      )!,
    );
    expect(
      getLegalActions(dogcatcher, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(dogcatcher, action) === "onr_v1_018_dogcatcher",
      ),
    ).toBe(false);

    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p344-killer-restricted-credits",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    state.runner.clicks = 10;
    state.runner.memoryLimit = 10;
    state.corp.credits = 20;
    p344MoveRunnerCardToGrip(state, "onr_v1_147_zz22-speed-chip");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_147_zz22-speed-chip",
    );
    const zz22Id = state.runner.rig.hardware.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_147_zz22-speed-chip",
    );
    expect(zz22Id).toBeDefined();
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    state.runner.credits = 0;
    p344PutCorpIceOnServer(state, "rd", "simple_sentry_ice");
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
        sourceDefinition(state, action) === "simple_sentry_ice",
    );
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia",
    );
    expect(breakAction.costs[0]?.credits).toBe(2);
    state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
    expect(zz22Id && cardCounterAmount(state, zz22Id, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
  });

  it("runs P3.45 Dropp, Japanese Water Torture and Snowball specials from CardImplementation", () => {
    let droppPump = p344EncounterState(
      "p345-dropp-pump",
      "onr_v1_019_dropp",
      "simple_code_gate_ice",
    ).state;
    const droppPumpAction = mustAction(
      droppPump,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(droppPump, action) === "onr_v1_019_dropp",
    );
    droppPump = apply(droppPump, "runner", (action) => action.actionId === droppPumpAction.actionId);
    expect(droppPump.run).toBeUndefined();
    expect(droppPump.timingPoint).toBe("runner_action.main");

    let japanese = p344EncounterState(
      "p345-japanese-variable-pump",
      "onr_v1_037_japanese-water-torture",
      "onr_v1_237_data-wall",
    ).state;
    japanese.runner.credits = 3;
    const japanesePump = mustAction(
      japanese,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(japanese, action) ===
          "onr_v1_037_japanese-water-torture" &&
        action.costs[0]?.credits === 3,
    );
    const japaneseId = String(japanesePump.payload?.breakerId);
    japanese = apply(japanese, "runner", (action) => action.actionId === japanesePump.actionId);
    expect(japanese.cardInstances[japaneseId]?.strengthModifier).toBe(3);
    expect(japanese.runnerTurnFlags?.forgoNextActionsPending).toBe(3);

    let snowball = p344EncounterState(
      "p345-snowball-run-strength",
      "onr_v1_066_snowball",
      "simple_sentry_ice",
    ).state;
    const snowballId = snowball.runner.rig.programs.find(
      (id) => snowball.cardInstances[id]?.definitionId === "onr_v1_066_snowball",
    );
    expect(snowballId).toBeDefined();
    snowball = p344PumpUntilBreak(snowball, snowballId!);
    const snowballBreak = mustAction(
      snowball,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === snowballId,
    );
    snowball = apply(snowball, "runner", (action) => action.actionId === snowballBreak.actionId);
    expect(snowball.run?.remainderStrengthBonusByBreaker?.[snowballId!]).toBe(1);
  });

  it("applies Crash Everett draw replacement with private trash or stack-top choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-crash-draw",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_crash_runner",
          name: "P3.61 Crash Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_157_crash-everett-inventive-fixer", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    const crashId = moveRunnerCardToGrip(
      state,
      "onr_v1_157_crash-everett-inventive-fixer",
    );
    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.payload?.cardId === crashId,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "draw_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "draw_card",
      drawnCount: 2,
      crashEverettChoiceOpened: true,
      drawReplacementExtraDrawn: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"stack"|"cardInstances"|"privatePayload"|simple_/,
    );
    expect(state.pendingChoice?.side).toBe("runner");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.pendingChoice?.options).toHaveLength(4);

    const topOption = state.pendingChoice?.options.find((option) =>
      option.id.startsWith("top_"),
    );
    const topCardId = String(topOption?.value ?? "").split(":")[0];
    state = applyChoice(state, "runner", topOption?.id ?? "");
    expect(state.runner.stack[0]).toBe(topCardId);
    expect(state.runner.grip).not.toContain(topCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      crashEverettDisposition: "top",
      returnedToStackTop: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let trashState = structuredClone(initial);
    trashState = apply(trashState, "runner", (action) => action.type === "draw_card");
    const trashOption = trashState.pendingChoice?.options.find((option) =>
      option.id.startsWith("trash_"),
    );
    const trashCardId = String(trashOption?.value ?? "").split(":")[0];
    trashState = applyChoice(trashState, "runner", trashOption?.id ?? "");
    expect(trashState.runner.heap).toContain(trashCardId);
    expect(trashState.runner.grip).not.toContain(trashCardId);
  });

  it("grants Wilson's run-only action and marks the resulting run spending cap", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p361-wilson-run-action",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p361_wilson_runner",
          name: "P3.61 Wilson Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
            { id: "simple_agenda", quantity: 6 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 1;
    const wilsonId = moveRunnerCardToGrip(
      state,
      "onr_v1_187_wilson-weeflerunner-apprentice",
    );
    state = apply(
      state,
      "runner",
      (action) => action.type === "install_card" && action.payload?.cardId === wilsonId,
    );
    state.runner.clicks = 1;
    state = apply(
      state,
      "runner",
      (action) => action.payload?.runnerAbility === "wilson_gain_run_action",
    );
    expect(state.runner.clicks).toBe(2);
    expect(state.runnerTurnFlags?.wilsonRunOnlyActionsRemaining).toBe(1);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.wilsonRunOnlyAction === true,
      ),
    ).toBe(true);
    state.runner.clicks = 1;
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "gain_credit",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" &&
        action.payload?.wilsonRunOnlyAction === true &&
        action.payload?.serverId === "rd",
    );
    expect(state.run?.wilsonRunSpendingCap).toMatchObject({
      limit: 3,
      spent: 0,
    });
  });

  it("resolves P3.60 Karl de Veres successful-run credits and Nevinyrral start-turn actions from CardImplementation", () => {
    let karlState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p360-karl-run-credit",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p360_karl_runner",
          name: "P3.60 Karl Runner",
          cards: [
            { id: "onr_v1_166_karl-de-veres-corporate-stooge", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) =>
                card.id !== "onr_v1_166_karl-de-veres-corporate-stooge",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    karlState.runner.credits = 10;
    installRunnerResourceForTest(
      karlState,
      "onr_v1_166_karl-de-veres-corporate-stooge",
    );
    const creditsBeforeRun = karlState.runner.credits;
    karlState = apply(
      karlState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(karlState.runner.credits).toBe(creditsBeforeRun + 1);
    expect(karlState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerCreditsAfter: karlState.runner.credits,
    });

    let nevinyrralState = apply(
      createGameAfterSetup({
        seed: "p360-nevinyrral-start-action",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const nevinyrralId = putCorpRootInRemote(
      nevinyrralState,
      "onr_v1_331_nevinyrral",
    );
    nevinyrralState.cardInstances[nevinyrralId] = {
      ...nevinyrralState.cardInstances[nevinyrralId]!,
      faceup: true,
      rezzed: true,
    };
    nevinyrralState = toRunnerTurnFromCorpMain(nevinyrralState);
    nevinyrralState = apply(
      nevinyrralState,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(nevinyrralState.corp.clicks).toBeGreaterThanOrEqual(4);
  });

  it("resolves P3.59 Field Reporter and Preying Mantis runner-turn windows", () => {
    const p359FieldPreyingRunnerCards = MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
      (card) =>
        card.id !== "onr_v1_162_field-reporter-for-ice-and-data" &&
        card.id !== "onr_v1_171_preying-mantis",
    );
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-field-preying",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p359_field_preying_runner",
          name: "P3.59 Field/Preying Runner",
          cards: [
            { id: "onr_v1_162_field-reporter-for-ice-and-data", quantity: 1 },
            { id: "onr_v1_171_preying-mantis", quantity: 1 },
            ...p359FieldPreyingRunnerCards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          id: "p359_i_spy_corp",
          name: "P3.59 I Spy Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerResourceForTest(
      state,
      "onr_v1_162_field-reporter-for-ice-and-data",
    );
    const mantisId = installRunnerResourceForTest(
      state,
      "onr_v1_171_preying-mantis",
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    const clicksBefore = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility === "preying_mantis_gain_action" &&
        action.payload?.cardId === mantisId,
    );
    expect(state.runner.clicks).toBe(clicksBefore + 1);

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
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("runner_action.main");

    const creditsBeforeEnd = state.runner.credits;
    const coreBeforeEnd = state.runner.coreDamage;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.runner.credits).toBe(creditsBeforeEnd + 1);
    expect(state.runner.coreDamage).toBe(coreBeforeEnd + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 1,
      corpRezzedIceThisTurnCount: 1,
      damageType: "core",
      damageAmount: 1,
    });
  });

  it("resolves P3.59 I Spy fort counters and Corp removal", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-i-spy",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.runner,
          id: "p359_i_spy_runner",
          name: "P3.59 I Spy Runner",
          cards: [
            { id: "onr_v1_032_i-spy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
              (card) => card.id !== "onr_v1_032_i-spy",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.corp,
          id: "p359_i_spy_corp",
          name: "P3.59 I Spy Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
              (card) => card.id !== "simple_barrier_ice",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    const iSpyId = installRunnerProgramForTest(state, "onr_v1_032_i-spy");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    state.phase = "run";
    state.timingPoint = "access.resolve_card";
    state.activeSide = "runner";
    state.run = {
      runId: "p359_i_spy_run",
      attackedServerId: "rd",
      phase: "access",
      position: { kind: "server", serverId: "rd" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility === "i_spy_put_spy_counter" &&
        action.payload?.cardId === iSpyId,
    );
    expect(state.spyCountersByServer?.rd).toBe(1);
    expect(state.runner.heap).toContain(iSpyId);
    expect(getPlayerView(state, "runner").servers.find((server) => server.id === "rd")?.ice[0]?.known).toBe(true);

    delete state.run;
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.activeSide = "corp";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.corpAbility === "remove_spy_counter" &&
        action.payload?.serverId === "rd",
    );
    expect(state.spyCountersByServer?.rd).toBe(0);
  });

  it("rolls Quest for Cattekin at Runner start through replay-safe random", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p359-quest-start-turn",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p359_quest_runner",
          name: "P3.59 Quest Runner",
          cards: [
            { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "onr_v1_172_quest-for-cattekin",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    installRunnerResourceForTest(state, "onr_v1_172_quest-for-cattekin");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = toRunnerTurn(state);

    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(
      state.randomDrawRecords.some((record) =>
        record.purpose.includes("quest-for-cattekin.start_runner_turn"),
      ),
    ).toBe(true);
    expect(
      state.eventLog
        .slice(replayStart)
        .flatMap((event) => event.publicPayload.resolvedEffects ?? [])
        .some(
          (effect) =>
            (effect as { sourceDefinitionId?: string }).sourceDefinitionId ===
            "onr_v1_172_quest-for-cattekin",
        ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("records Quest for Cattekin start-turn outcomes for no-op, damage and permanent action rolls", () => {
    function resolveQuestStartForRoll(targetRoll: number | number[]): {
      state: GameState;
      effect: Record<string, unknown>;
      questId: CardInstanceId;
      randomBefore: number;
    } {
      const targetRolls = Array.isArray(targetRoll) ? targetRoll : [targetRoll];
      for (let seedIndex = 0; seedIndex < 120; seedIndex += 1) {
        let state = toRunnerTurn(
          createGameAfterSetup({
            seed: `p359-quest-outcome-${targetRoll}-${seedIndex}`,
            baseline: CURRENT_RULES_BASELINE,
            runnerDeck: {
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
              id: `p359_quest_runner_${targetRoll}_${seedIndex}`,
              name: "P3.59 Quest Runner",
              cards: [
                { id: "onr_v1_172_quest-for-cattekin", quantity: 1 },
                ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                  (card) => card.id !== "onr_v1_172_quest-for-cattekin",
                ),
              ],
            },
            corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            agendaPointsToWin: 7,
          }),
        );
        const questId = installRunnerResourceForTest(
          state,
          "onr_v1_172_quest-for-cattekin",
        );
        state.randomCounter = seedIndex;
        const randomBefore = state.randomDrawRecords.length;
        const replayStart = state.eventLog.length;
        state = apply(state, "runner", (action) => action.type === "end_turn");
        state = toRunnerTurn(state);
        const effect = state.eventLog
          .slice(replayStart)
          .flatMap((event) => event.publicPayload.resolvedEffects ?? [])
          .find(
            (candidate) =>
              (candidate as { effectId?: string }).effectId?.startsWith(
                "runner.start.quest_for_cattekin.",
              ) === true,
          ) as Record<string, unknown> | undefined;
        if (effect && targetRolls.includes(Number(effect.v1921DieRoll)))
          return { state, effect, questId, randomBefore };
      }
      throw new Error(`No Quest for Cattekin seed produced roll ${targetRolls.join(", ")}`);
    }

    const noOp = resolveQuestStartForRoll([3, 4, 5]);
    expect(noOp.state.randomDrawRecords.length).toBe(noOp.randomBefore + 1);
    expect(noOp.effect.questForCattekinOutcome).toBe("no_effect");
    expect(noOp.state.runner.rig.resources).toContain(noOp.questId);
    expect(noOp.state.runner.clicks).toBe(4);

    const coreDamage = resolveQuestStartForRoll(1);
    expect(coreDamage.effect.questForCattekinOutcome).toBe("core_damage");
    expect(coreDamage.effect.damageCannotBePrevented).toBe(true);
    expect(coreDamage.effect.damageType).toBe("core");
    expect(coreDamage.effect.coreDamageAfter).toBeGreaterThanOrEqual(1);

    const netDamage = resolveQuestStartForRoll(2);
    expect(netDamage.effect.questForCattekinOutcome).toBe("net_damage");
    expect(netDamage.effect.damageCannotBePrevented).toBe(true);
    expect(netDamage.effect.damageType).toBe("net");
    expect(netDamage.effect.cardsTrashed).toBeGreaterThanOrEqual(1);

    const permanentAction = resolveQuestStartForRoll(6);
    expect(permanentAction.effect.questForCattekinOutcome).toBe("permanent_action");
    expect(permanentAction.effect.sourceTrashed).toBe(true);
    expect(permanentAction.state.runner.rig.resources).not.toContain(
      permanentAction.questId,
    );
    expect(permanentAction.state.runner.heap).toContain(permanentAction.questId);
    expect(permanentAction.state.runner.clicks).toBe(5);
    expect(
      permanentAction.state.runnerTurnFlags?.questForCattekinPermanentActionGain,
    ).toBe(true);
    const randomAfterFirstQuest = permanentAction.state.randomDrawRecords.length;
    let nextTurn = apply(permanentAction.state, "runner", (action) => action.type === "end_turn");
    nextTurn = toRunnerTurn(nextTurn);
    expect(nextTurn.runner.clicks).toBe(5);
    expect(nextTurn.randomDrawRecords.length).toBe(randomAfterFirstQuest);
  });

  it("resolves Social Engineering secret guess and auto-passes the chosen ICE on a wrong guess", () => {
    const socialRunnerDeck = MECHANIC_SMOKE_DECKS.runAccess.runner;
    const socialCorpDeck = {
      ...MECHANIC_SMOKE_DECKS.runAccess.corp,
      id: "p358_social_engineering_corp",
      name: "P3.58 Social Engineering Corp",
      cards: [
        { id: "simple_barrier_ice", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards.filter(
          (card) => card.id !== "simple_barrier_ice",
        ),
      ],
    };
    let correct = toRunnerTurn(
      createGameAfterSetup({
        seed: "p358-social-correct",
        runnerDeck: socialRunnerDeck,
        corpDeck: socialCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    correct.runner.credits = 5;
    const correctEventId = moveRunnerCardToGrip(correct, "onr_v1_111_social-engineering");
    correct = apply(
      correct,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === correctEventId,
    );
    expect(correct.pendingChoice?.source).toContain("p3_58.social_engineering_hide");
    expect(getPlayerView(correct, "corp").pendingChoice).toBeUndefined();
    correct = applyChoice(correct, "runner", "hide_3");
    expect(correct.pendingChoice?.source).toContain("p3_58.social_engineering_guess");
    correct = applyChoice(correct, "corp", "guess_3");
    expect(correct.runner.credits).toBe(1);
    expect(correct.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      amounts: expect.objectContaining({
        secretHiddenAmountRevealed: 3,
        secretGuessAmount: 3,
      }),
      targets: expect.objectContaining({
        socialEngineeringGuessCorrect: true,
      }),
    });

    let wrong = toRunnerTurn(
      createGameAfterSetup({
        seed: "p358-social-wrong",
        runnerDeck: socialRunnerDeck,
        corpDeck: socialCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    wrong.runner.credits = 5;
    const wrongEventId = moveRunnerCardToGrip(wrong, "onr_v1_111_social-engineering");
    const iceId = putCorpIceOnServer(wrong, "rd", "simple_barrier_ice");
    wrong.cardInstances[iceId] = {
      ...wrong.cardInstances[iceId]!,
      faceup: false,
      rezzed: false,
    };
    wrong = apply(
      wrong,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === wrongEventId,
    );
    wrong = applyChoice(wrong, "runner", "hide_3");
    wrong = applyChoice(wrong, "corp", "guess_2");
    expect(wrong.pendingChoice?.source).toContain("p3_58.social_engineering_target");
    expect(getPlayerView(wrong, "corp").pendingChoice).toBeUndefined();
    wrong = applyChoice(wrong, "runner", `ice_${iceId}`);
    expect(wrong.run?.position).toMatchObject({ kind: "server", serverId: "rd" });
    expect(wrong.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      targets: expect.objectContaining({
        socialEngineeringGuessCorrect: false,
        autoPassChosenIce: true,
      }),
    });
    expect(JSON.stringify(wrong.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_barrier_ice",
    );
  });

  it("loads Pocket Virtual Reality temporary encounter trace credits for its printed traces", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("p356-pocket-vr-temp-credits"),
    );
    state.runner.credits = 0;
    state.corp.credits = 7;
    putCorpIceOnServer(state, "rd", "onr_v1_260_pocket-virtual-reality");

    state = encounterIce(state, "rd", "onr_v1_260_pocket-virtual-reality");
    state.corp.credits = 0;
    expect(state.run?.encounterTemporaryTraceCredits).toMatchObject({
      sourceDefinitionId: "onr_v1_260_pocket-virtual-reality",
      remaining: 4,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace?.corpBidMax).toBe(4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStarted: true,
      temporaryTraceCreditsAvailable: 4,
      temporaryTraceCreditsSourceDefinitionId:
        "onr_v1_260_pocket-virtual-reality",
    });

    state = applyChoice(state, "corp", "bid_4");
    expect(state.corp.credits).toBe(0);
    expect(state.run?.encounterTemporaryTraceCredits?.remaining).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      temporaryTraceCreditsSpent: 4,
      temporaryTraceCreditsRemaining: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.trace?.corpBidMax).toBe(0);
  });

  it("uses P3.51 Silver Lining advancement history and Omniscience/Disinfectant hooks", () => {
    let silver = apply(
      createGameAfterSetup({
        seed: "p351-silver-lining-formula",
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          id: "p351_silver_corp",
          name: "P3.51 Silver Corp",
          cards: [
            { id: "onr_v1_303_silver-lining-recovery-protocol", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                card.id !== "onr_v1_303_silver-lining-recovery-protocol",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    silver.corp.credits = 5;
    moveCorpCardToHq(silver, "onr_v1_303_silver-lining-recovery-protocol");
    silver.runnerTurnFlags = {
      ...(silver.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: true,
      stolenAgendaAdvancementCountersLastTurn: 4,
    };
    silver = apply(
      silver,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(silver, action) ===
          "onr_v1_303_silver-lining-recovery-protocol",
    );
    expect(silver.corp.credits).toBe(17);
    expect(silver.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 12,
    });

    let omni = apply(
      createGameAfterSetup({
        seed: "p351-omniscience-extra-tag",
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          id: "p351_omni_corp",
          name: "P3.51 Omni Corp",
          cards: [
            { id: "onr_v1_333_omniscience-foundation", quantity: 1 },
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.filter(
              (card) =>
                card.id !== "onr_v1_333_omniscience-foundation" &&
                card.id !== "onr_v1_306_trojan-horse",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    omni.corp.credits = 10;
    omni.runner.tags = 0;
    const omniId = moveCorpCardToHq(omni, "onr_v1_333_omniscience-foundation");
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === omniId &&
        action.payload?.serverId === "new_remote",
    );
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === omniId,
    );
    moveCorpCardToHq(omni, "onr_v1_306_trojan-horse");
    omni.runnerTurnFlags = {
      ...(omni.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: true,
    };
    omni = apply(
      omni,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(omni, action) === "onr_v1_306_trojan-horse",
    );
    expect(omni.runner.tags).toBe(1);
    omni = apply(omni, "corp", (action) => action.type === "end_turn");
    expect(omni.runner.tags).toBe(2);
    expect(omni.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerTagsAfter: 2,
    });

    let disinfectant = toRunnerTurn(
      createGameAfterSetup({
        seed: "p351-disinfectant-avoid-virus",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.counterRecurring.runner,
          id: "p351_disinfectant_runner",
          name: "P3.51 Disinfectant Runner",
          cards: [
            { id: "onr_v1_009_butcher-boy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.counterRecurring.runner.cards.filter(
              (card) => card.id !== "onr_v1_009_butcher-boy",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.counterRecurring.corp,
          id: "p351_disinfectant_corp",
          name: "P3.51 Disinfectant Corp",
          cards: [
            { id: "onr_v1_319_disinfectant-inc", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.counterRecurring.corp.cards.filter(
              (card) => card.id !== "onr_v1_319_disinfectant-inc",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    disinfectant.corp.credits = 3;
    const disinfectantId = moveCorpCardToHq(
      disinfectant,
      "onr_v1_319_disinfectant-inc",
    );
    removeEverywhere(disinfectant, disinfectantId);
    const disinfectantServer = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    } as (typeof disinfectant.corp.servers)[number];
    disinfectant.corp.servers.push(disinfectantServer);
    disinfectantServer.root.push(disinfectantId);
    disinfectant.cardInstances[disinfectantId] = {
      ...disinfectant.cardInstances[disinfectantId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      faceup: true,
      rezzed: true,
    };
    const butcherId = installRunnerProgramForTest(
      disinfectant,
      "onr_v1_009_butcher-boy",
    );
    for (const cardId of disinfectant.corp.hq.slice()) {
      removeEverywhere(disinfectant, cardId);
      disinfectant.corp.archives.push(cardId);
      disinfectant.cardInstances[cardId] = {
        ...disinfectant.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }
    moveCorpCardToHq(disinfectant, "simple_economy_operation");
    disinfectant = apply(
      disinfectant,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    disinfectant = apply(
      disinfectant,
      "runner",
      (action) =>
        action.type === "access_card" ||
        action.type === "steal_agenda" ||
        action.type === "decline_trash",
    );
    expect(cardCounterAmount(disinfectant, butcherId, "virus")).toBe(0);
    expect(disinfectant.corp.credits).toBe(2);
    expect(disinfectant.eventLog.at(-1)?.publicPayload).toMatchObject({
      amounts: {
        virusCounterAvoided: 1,
        disinfectantCreditsPaid: 1,
      },
    });
  });

  it("starts Stumble through Wilderspace runs with a temporary trace-link bonus from CardImplementation", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p348-stumble-run-trace-link-bonus",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p348_stumble_runner",
          name: "P3.48 Stumble Runner",
          cards: [
            { id: "onr_v1_112_stumble-through-wilderspace", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "onr_v1_112_stumble-through-wilderspace");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_112_stumble-through-wilderspace" &&
        action.payload?.serverId === "rd",
    );

    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.runTraceLinkBonus).toBe(9);
    expect(state.run?.runTraceLinkBonusSourceDefinitionId).toBe(
      "onr_v1_112_stumble-through-wilderspace",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_112_stumble-through-wilderspace",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
  });

  it("hosts P3.46 programs on Daemons, applies hosted strength penalties and revalidates host capacity", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p346-daemon-hosting",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 80;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 2;
    p344MoveRunnerCardToGrip(state, "onr_v1_001_afreet");
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    p344MoveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    p344MoveRunnerCardToGrip(state, "onr_v1_016_cyfermaster");
    p344MoveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    p344MoveRunnerCardToGrip(state, "onr_v1_069_succubus");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_001_afreet",
    );
    expect(afreetId).toBeDefined();
    if (!afreetId) throw new Error("Missing Afreet");
    expect(state.runner.memoryUsed).toBe(1);

    const staleHostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia" &&
        action.payload?.hostOnCardId === afreetId,
    );
    const staleHostState = structuredClone(state);
    removeEverywhere(staleHostState, afreetId);
    expect(
      applyAction(staleHostState, {
        matchId: staleHostState.matchId,
        side: "runner",
        actionId: staleHostedInstall.actionId,
        clientKnownStateVersion: staleHostState.stateVersion,
        idempotencyKey: "p346-stale-host-install",
      }).ok,
    ).toBe(false);

    const hostedDefinitionIds = [
      "onr_v1_006_black-dahlia",
      "onr_v1_015_codeslinger",
      "onr_v1_016_cyfermaster",
    ] as const;
    const hostedIds: CardInstanceId[] = [];
    for (const definitionId of hostedDefinitionIds) {
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId &&
          action.payload?.hostOnCardId === afreetId,
      );
      hostedIds.push(String(install.payload?.cardId ?? "") as CardInstanceId);
      state = apply(state, "runner", (action) => action.actionId === install.actionId);
    }
    expect(state.runner.memoryUsed).toBe(1);
    for (const hostedId of hostedIds)
      expect(state.cardInstances[hostedId]?.hostedOn).toBe(afreetId);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === hostedIds[0],
      )?.strength,
    ).toBe(4);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_014_codecracker" &&
          action.payload?.hostOnCardId === afreetId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_069_succubus",
    );
    const succubusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_069_succubus",
    );
    expect(succubusId).toBeDefined();
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_014_codecracker" &&
          action.payload?.hostOnCardId === succubusId,
      ),
    ).toBe(true);
  });

  it("resolves P3.46 Chimera through CardImplementation and trashes hosted Daemon programs", () => {
    let state = toRunnerTurn(v199CardReleaseGame("p346-chimera-card-implementation"));
    state.runner.credits = 60;
    state.runner.clicks = 20;
    state.runner.memoryLimit = 2;
    p344MoveRunnerCardToGrip(state, "onr_v1_001_afreet");
    p344MoveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    const afreetId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_001_afreet",
    );
    if (!afreetId) throw new Error("Missing Afreet");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_006_black-dahlia" &&
        action.payload?.hostOnCardId === afreetId,
    );
    const hostedId = String(hostedInstall.payload?.cardId ?? "") as CardInstanceId;
    state = apply(state, "runner", (action) => action.actionId === hostedInstall.actionId);
    const chimeraId = putCorpRootInRemote(state, "onr_v1_353_chimera");
    state.cardInstances[chimeraId] = {
      ...state.cardInstances[chimeraId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toContain(afreetId);
    expect(state.runner.heap).toContain(hostedId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      trashedCardDefinitionId: "onr_v1_001_afreet",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays the unlocked R&D and HQ multiaccess events with hidden queues", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("v123-custodial-position"));
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "simple_economy_operation");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_220_tycho-extension");

    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rdState, action) === "onr_v1_081_custodial-position" &&
        action.payload?.serverId === "rd",
    );

    expect(rdState.timingPoint).toBe("access.resolve_card");
    expect(rdState.run?.breach).toMatchObject({
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(
      JSON.stringify(rdState.eventLog.at(-1)?.publicPayload),
    ).not.toContain("Tycho Extension");

    let hqState = toRunnerTurn(v123CardReleaseGame("v123-executive-wiretaps"));
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const first = moveCorpCardToHq(hqState, "simple_economy_operation");
    const second = moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover");
    const third = moveCorpCardToHq(hqState, "onr_v1_220_tycho-extension");
    keepOnlyCorpHqCards(hqState, [first, second, third]);

    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" &&
        action.payload?.serverId === "hq",
    );

    expect(hqState.run?.breach).toMatchObject({
      serverId: "hq",
      accessMode: "multi",
      currentIndex: 0,
    });
    expect(hqState.run?.breach?.queue).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(hqState, "runner"))).not.toContain(
      "Tycho Extension",
    );
    expect(getPlayerView(hqState, "runner").run?.breach?.remainingCount).toBe(
      3,
    );
  });

  it("removes MIT West Tier from the game after a deterministic hidden shuffle and draw", () => {
    let state = toRunnerTurn(v123CardReleaseGame("v123-mit-west-tier"));
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_101_mit-west-tier",
    );

    expect(state.runner.grip).toHaveLength(5);
    expect(state.runner.heap).not.toContain(eventId);
    expect(state.specialZones?.removedFromGame).toEqual([eventId]);
    expect(state.cardInstances[eventId]?.zone).toMatchObject({
      side: "special",
      zone: "removed_from_game",
      visibility: "public",
    });
    expect(
      getPlayerView(state, "runner").specialZones?.removedFromGame[0],
    ).toMatchObject({
      definitionId: "onr_v1_101_mit-west-tier",
      owner: "runner",
      controller: "runner",
    });
    expect(
      getPlayerView(state, "corp").specialZones?.removedFromGame[0],
    ).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "runner_",
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("plays Overtime Incentives as a LegalAction-only Corp action gain", () => {
    let state = v123CardReleaseGame("v123-overtime");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 3;
    state.corp.credits = 5;
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");

    const before = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_297_overtime-incentives",
    );

    expect(state.corp.clicks).toBe(before + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_297_overtime-incentives",
      gainedActions: 2,
    });
    expect(
      JSON.stringify(
        getPlayerView(state, "runner").publicEvents.at(-1)?.publicPayload,
      ),
    ).not.toContain("corp_");
  });

  it("gates Trojan Horse on runner agenda theft in the last turn and gives 1 tag when legal", () => {
    let state = v123CardReleaseGame("v123-trojan-horse");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    state.corp.credits = 8;

    const beforeRunnerTurn = apply(
      state,
      "corp",
      (action) => action.type === "end_turn",
    );
    const beforeTheftInput = getLegalActions(beforeRunnerTurn, "corp").filter(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(beforeRunnerTurn, action) ===
          "onr_v1_306_trojan-horse",
    );
    expect(beforeTheftInput).toHaveLength(0);
    moveCorpCardToArchives(beforeRunnerTurn, "onr_v1_220_tycho-extension");

    let afterTheft = apply(
      beforeRunnerTurn,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "access_card",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    afterTheft = apply(
      afterTheft,
      "runner",
      (action) => action.type === "end_turn",
    );
    afterTheft = apply(
      afterTheft,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const trojanAfterTheft = moveCorpCardToHq(
      afterTheft,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(afterTheft, trojanAfterTheft);
    afterTheft.corp.credits = 8;
    const beforeTags = afterTheft.runner.tags;

    afterTheft = apply(
      afterTheft,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(afterTheft, action) === "onr_v1_306_trojan-horse",
    );

    expect(afterTheft.runner.tags).toBe(beforeTags + 1);
    expect(afterTheft.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_306_trojan-horse",
    });
  });

  it("uses CardImplementation tag avoidance for Fall Guy and Total Genetic Retrofit", () => {
    let fallGuyState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p342-fall-guy",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p342_fall_guy_runner",
          cards: [
            { id: "onr_v1_161_fall-guy", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p342_fall_guy_corp",
          cards: [
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    fallGuyState.runner.credits = 8;
    fallGuyState.runner.clicks = 4;
    const fallGuyId = moveRunnerCardToGrip(fallGuyState, "onr_v1_161_fall-guy");
    fallGuyState = apply(
      fallGuyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === fallGuyId,
    );
    fallGuyState.runnerTurnFlags = {
      ...(fallGuyState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: fallGuyState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    fallGuyState = apply(
      fallGuyState,
      "runner",
      (action) => action.type === "end_turn",
    );
    fallGuyState = apply(
      fallGuyState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    fallGuyState.runnerTurnFlags = {
      ...(fallGuyState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: fallGuyState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    const trojanId = moveCorpCardToHq(
      fallGuyState,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(fallGuyState, trojanId);
    fallGuyState.corp.credits = 8;
    fallGuyState = apply(
      fallGuyState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(fallGuyState, action) === "onr_v1_306_trojan-horse",
    );
    expect(fallGuyState.pendingChoice?.source).toContain(
      "event_modification",
    );
    expect(fallGuyState.runner.tags).toBe(0);
    const fallGuyOption = fallGuyState.pendingChoice?.options.find((option) =>
      option.id.includes("avoid_tag"),
    )?.id;
    expect(fallGuyOption).toBeDefined();
    if (!fallGuyOption) throw new Error("Missing Fall Guy tag-avoid option");
    fallGuyState = applyChoice(fallGuyState, "runner", fallGuyOption);
    expect(fallGuyState.runner.tags).toBe(0);
    expect(fallGuyState.runner.heap).toContain(fallGuyId);
    expect(fallGuyState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_161_fall-guy",
    });

    let retrofitState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p342-total-genetic-retrofit",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p342_total_genetic_retrofit_runner",
          cards: [
            { id: "onr_v1_116_total-genetic-retrofit", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p342_total_genetic_retrofit_corp",
          cards: [
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    retrofitState.runner.credits = 8;
    retrofitState.runner.clicks = 4;
    retrofitState.runner.tags = 2;
    const retrofitId = moveRunnerCardToGrip(
      retrofitState,
      "onr_v1_116_total-genetic-retrofit",
    );
    retrofitState = apply(
      retrofitState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === retrofitId,
    );
    expect(retrofitState.runner.tags).toBe(0);
    expect(retrofitState.runnerTagAvoidanceCredits).toBe(1);
    retrofitState.runnerTurnFlags = {
      ...(retrofitState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: retrofitState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    retrofitState = apply(
      retrofitState,
      "runner",
      (action) => action.type === "end_turn",
    );
    retrofitState = apply(
      retrofitState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    retrofitState.runnerTurnFlags = {
      ...(retrofitState.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: retrofitState.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    const retrofitTrojanId = moveCorpCardToHq(
      retrofitState,
      "onr_v1_306_trojan-horse",
    );
    keepOnlyCorpHqCard(retrofitState, retrofitTrojanId);
    retrofitState.corp.credits = 8;
    retrofitState = apply(
      retrofitState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(retrofitState, action) === "onr_v1_306_trojan-horse",
    );
    expect(retrofitState.runner.tags).toBe(0);
    expect(retrofitState.runnerTagAvoidanceCredits).toBe(0);
    expect(retrofitState.eventLog.at(-1)?.publicPayload).toMatchObject({
      tagsAdded: 0,
      runnerTagsAfter: 0,
    });
  });
});
