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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.7 Mechanikpaket P", () => {
  it("adds Afreet as a playable daemon host and validates smoke decks", () => {
    expect(ONR_V1_9_7_FINAL_CARD_IDS).toHaveLength(1);
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_001_afreet"];
    expect(definition?.implementationStatus).toBe("playable_mvp");
    expect(definition?.mechanics.join(" ")).toMatch(/host/);
    expect(definition?.mechanics.join(" ")).not.toMatch(
      /v2|matchmaking|ranking/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_7_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_7_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("installs Afreet through LegalActions and consumes runner memory", () => {
    let state = toRunnerTurn(v197CardReleaseGame("v197-afreet"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_001_afreet");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_001_afreet",
    );
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId === "onr_v1_001_afreet",
      ),
    ).toBe(true);
    expect(state.runner.memoryUsed).toBeGreaterThanOrEqual(1);
  });
});

describe("V1.9.8 Mechanikpaket Q", () => {
  it("adds Dogcatcher and Dropp as playable breaker longtail cards and validates smoke decks", () => {
    expect(ONR_V1_9_8_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_8_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/break/);
      expect(
        cardImplementationForDefinitionId(
          definitionId,
        )?.icebreakerAbilities?.some(
          (ability) => ability.kind === "increase_strength",
        ),
        definitionId,
      ).toBe(true);
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      validateDeckDefinition(ONR_V1_9_8_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_8_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("installs Dogcatcher and Dropp through LegalActions without leaking hidden Corp cards", () => {
    let state = toRunnerTurn(v198CardReleaseGame("v198-breakers"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_018_dogcatcher");
    moveRunnerCardToGrip(state, "onr_v1_019_dropp");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_018_dogcatcher",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_019_dropp",
    );
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId ===
          "onr_v1_018_dogcatcher",
      ),
    ).toBe(true);
    expect(
      state.runner.rig.programs.some(
        (programId) =>
          state.cardInstances[programId]?.definitionId === "onr_v1_019_dropp",
      ),
    ).toBe(true);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Hostile Takeover",
    );
  });
});

describe("V1.9.9 Mechanikpaket R", () => {
  it("adds the four V1.9.9 upgrade cards and validates smoke decks", () => {
    expect(ONR_V1_9_9_FINAL_CARD_IDS).toHaveLength(4);
    for (const definitionId of ONR_V1_9_9_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.type, definitionId).toBe("upgrade");
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_349_aardvark"]?.mechanics.join(" "),
    ).toMatch(/worm/);
    expect(
      cardImplementationForDefinitionId("onr_v1_351_bizarre-encryption-scheme")
        ?.hiddenReplacementLongtail?.kind,
    ).toBe("delayed_agenda_access_replacement");
    expect(
      cardImplementationForDefinitionId("onr_v1_352_chester-mix")?.modifiers,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "install_cost",
          operation: "reduce",
          amount: 2,
          appliesTo: expect.objectContaining({
            cardType: "ice",
            sameServerAsSource: true,
          }),
        }),
      ]),
    );
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_352_chester-mix"]?.rulesText,
    ).toContain("reduced by 2");
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_353_chimera"]?.mechanics.join(" "),
    ).toMatch(/trash_installed_runner_cards/);
    expect(
      validateDeckDefinition(ONR_V1_9_9_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_9_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("lets Aardvark intercept a Worm use through a Corp choice and blocks later Worm use on that fort", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-aardvark"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const wormId = installRunnerProgramForTest(state, "onr_v1_074_worm");
    const aardvarkId = putCorpRootInRemote(state, "onr_v1_349_aardvark");
    const wallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
    );
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const replayStart = structuredClone(state);
    const replayEventOffset = state.eventLog.length;

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
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" && action.payload?.breakerId === wormId,
    );
    expect(state.pendingChoice?.source).toContain("v199.aardvark");
    expect(state.runner.credits).toBe(17);

    state = applyChoice(state, "corp", "rez_trash_worm");
    expect(state.cardInstances[aardvarkId]?.rezzed).toBe(true);
    expect(state.runner.heap).toContain(wormId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.breakerId === wormId,
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_349_aardvark",
      title: "Aardvark",
    });

    const replay = replayEvents(
      replayStart,
      state.eventLog.slice(replayEventOffset),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("delays successful run finalization through Dr. Dreff temporary HQ ICE", () => {
    let state = toRunnerTurn(onrV1Game("p354-dr-dreff"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    addInstalledRunnerProgramForTest(
      state,
      "onr_v1_073_wizards-book",
      "wizard",
    );
    addRezzedCorpRootForTest(state, "onr_v1_358_dr-dreff", "remote_1", "dr");
    const hqIceId = addCorpCardToHqForTest(
      state,
      "onr_v1_261_quandary",
      "dr_quandary",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.pendingChoice?.source).toContain("p3_54.delayed_success");
    expect(state.run?.successful).toBe(false);

    state = applyChoice(
      state,
      "corp",
      traceChoiceOptionIdForDefinition(state, "onr_v1_261_quandary", "ice_"),
    );
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: hqIceId,
      successful: false,
    });
    expect(state.corp.credits).toBe(19);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.subroutineIndex === 0,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.corp.archives).toContain(hqIceId);
    expect(state.run?.successful).toBe(false);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toMatchObject({ phase: "access", successful: true });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("delays successful run finalization through Jenny Jett install-and-approach", () => {
    let state = toRunnerTurn(onrV1Game("p354-jenny-jett"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const jennyId = addRezzedCorpRootForTest(
      state,
      "onr_v1_359_jenny-jett",
      "remote_1",
      "jenny",
    );
    state.cardInstances[jennyId] = {
      ...state.cardInstances[jennyId]!,
      faceup: false,
      rezzed: false,
    };
    const hqIceId = addCorpCardToHqForTest(
      state,
      "onr_v1_261_quandary",
      "jenny_quandary",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const jennyRez = mustAction(
      state,
      "corp",
      (action) => action.type === "rez_card" && action.source === jennyId,
    );
    expect(jennyRez.payload).toMatchObject({
      cardImplementationFortRunRezSupportQuoteSchemaVersion:
        "corp-fort-run-rez-support-quote-v1",
      cardImplementationFortRunRezSupportQuoteKind:
        "install_hq_ice_innermost_after_successful_run",
      cardImplementationFortRunRezSupportQuoteComplete: true,
      cardImplementationFortRunRezSupportQuoteSourceCardInstanceId: jennyId,
      cardImplementationFortRunRezSupportQuoteTargetServerId: "remote_1",
      cardImplementationFortRunRezSupportQuoteStateVersion: state.stateVersion,
      cardImplementationFortRunRezSupportQuoteActionId: jennyRez.actionId,
      cardImplementationFortRunRezSupportQuoteRezCredits: 1,
      cardImplementationFortRunRezSupportQuoteInstallCredits: 0,
      cardImplementationFortRunRezSupportQuoteTotalCredits: 1,
      cardImplementationFortRunRezSupportQuoteTotalCreditsPayable: true,
      cardImplementationFortRunRezSupportQuoteHasOwnHqIce: true,
    });
    expect(
      getLegalActions(state, "runner").some((action) =>
        Object.keys(action.payload ?? {}).some((field) =>
          field.includes("FortRunRezSupportQuote"),
        ),
      ),
    ).toBe(false);
    const runnerView = JSON.stringify(getPlayerView(state, "runner"));
    expect(runnerView).not.toContain("corp-fort-run-rez-support-quote-v1");
    expect(runnerView).not.toContain(hqIceId);
    expect(runnerView).not.toContain("onr_v1_261_quandary");

    const changedState = structuredClone(state);
    changedState.stateVersion += 1;
    const staleApply = applyAction(changedState, {
      matchId: changedState.matchId,
      side: "corp",
      actionId: jennyRez.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "p354-jenny-stale-quote",
    });
    expect(staleApply.ok).toBe(false);
    if (!staleApply.ok) expect(staleApply.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.actionId === jennyRez.actionId,
    );
    expect(state.cardInstances[jennyId]?.rezzed).toBe(true);
    const runnerViewAfterRez = JSON.stringify(getPlayerView(state, "runner"));
    expect(runnerViewAfterRez).not.toContain(
      "corp-fort-run-rez-support-quote-v1",
    );
    expect(runnerViewAfterRez).not.toContain(hqIceId);
    expect(runnerViewAfterRez).not.toContain("onr_v1_261_quandary");
    state = applyChoice(
      state,
      "corp",
      traceChoiceOptionIdForDefinition(state, "onr_v1_261_quandary", "ice_"),
    );
    expect(state.run).toMatchObject({
      phase: "approach_ice",
      approachedIceId: hqIceId,
      successful: false,
    });
    expect(state.corp.credits).toBe(19);
    expect(state.corp.hq).not.toContain(hqIceId);
    expect(
      state.corp.servers.find((server) => server.id === "remote_1")?.ice[0],
    ).toBe(hqIceId);

    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.run?.successful).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toMatchObject({ phase: "access", successful: true });
    expect(state.corp.archives).not.toContain(hqIceId);
    expect(
      state.corp.servers.find((server) => server.id === "remote_1")?.ice,
    ).toContain(hqIceId);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("delays agenda scoring after Bizarre Encryption Scheme is accessed and resolves it at Runner turn start", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-bizarre-encryption"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpRootInRemote(state, "onr_v1_351_bizarre-encryption-scheme");
    const agendaId = putCorpRootInRemote(state, "onr_v1_203_hostile-takeover");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    expect(state.run?.runDurationEffects).toEqual([
      expect.objectContaining({
        kind: "delayed_agenda_access_replacement",
        sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
        serverId: "remote_1",
        replacementWindow: "agenda_access",
        delayUntil: "runner_next_turn_start",
      }),
    ]);
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.runner.scoreArea).not.toContain(agendaId);
    expect(state.delayedAccessEffects).toEqual([
      {
        kind: "delayed_agenda_access_replacement",
        agendaId,
        serverId: "remote_1",
        sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
        sourceCardInstanceId: expect.any(String),
        resolveAt: "runner_start_turn",
      },
    ]);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.delayedAccessEffects).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "steal_agenda",
          side: "runner",
          cardDefinitionId: "onr_v1_203_hostile-takeover",
          sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
          reason: "start_of_turn",
          visibility: "public",
        }),
      ]),
    );
  });

  it("delays an HQ-hand agenda after trashing an accessed Bizarre Encryption Scheme in the HQ root", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-bizarre-encryption-hq"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    const agendaId = moveCorpCardToHq(
      state,
      "onr_v1_203_hostile-takeover",
    );
    keepOnlyCorpHqCard(state, agendaId);
    const bizarreId = addRezzedCorpRootForTest(
      state,
      "onr_v1_351_bizarre-encryption-scheme",
      "hq",
      "bizarre_hq_root",
    );
    state.cardInstances[bizarreId] = {
      ...state.cardInstances[bizarreId]!,
      faceup: false,
      rezzed: false,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBe(bizarreId);
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.corp.archives).toContain(bizarreId);
    expect(state.run?.runDurationEffects).toEqual([
      expect.objectContaining({
        kind: "delayed_agenda_access_replacement",
        sourceCardInstanceId: bizarreId,
        sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
        serverId: "hq",
      }),
    ]);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBe(agendaId);
    const delayedSteal = mustAction(
      state,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: delayedSteal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v199-bizarre-hq-delayed-steal",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    state = result.state;
    expect(state.runner.scoreArea).not.toContain(agendaId);
    expect(state.delayedAccessEffects).toEqual([
      expect.objectContaining({
        kind: "delayed_agenda_access_replacement",
        agendaId,
        serverId: "hq",
        sourceCardInstanceId: bizarreId,
        sourceDefinitionId: "onr_v1_351_bizarre-encryption-scheme",
        resolveAt: "runner_start_turn",
      }),
    ]);
    expect(validateGameState(state).ok).toBe(true);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.corp.hq).not.toContain(agendaId);
    expect(state.delayedAccessEffects).toBeUndefined();
  });

  it("reduces ICE install costs on Chester Mix forts only", () => {
    let state = createGameAfterSetup({
      seed: "v199-chester",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: ONR_V1_9_9_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_9_CORP_DECK,
        cards: [
          ...ONR_V1_9_9_CORP_DECK.cards,
          { id: "onr_v1_324_fortress-architects", quantity: 1 },
          { id: "simple_barrier_ice", quantity: 1 },
          { id: "simple_sentry_ice", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    const chesterId = putCorpRootInRemote(state, "onr_v1_352_chester-mix");
    state.cardInstances[chesterId] = {
      ...state.cardInstances[chesterId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "remote_1", "onr_v1_279_wall-of-static");
    const iceId = moveCorpCardToHq(state, "simple_code_gate_ice");

    const install = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "ice",
    );
    expect(install.payload?.iceInstallBaseCost).toBe(1);
    expect(install.payload?.iceInstallReduction).toBe(2);
    expect(install.payload?.iceInstallTotalCost).toBe(0);
  });

  it("keeps Chester Mix install-cost quotes server-scoped and stale-safe", () => {
    let state = createGameAfterSetup({
      seed: "p310-chester-scope",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: ONR_V1_9_9_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_9_CORP_DECK,
        cards: [
          ...ONR_V1_9_9_CORP_DECK.cards,
          { id: "onr_v1_324_fortress-architects", quantity: 1 },
          { id: "simple_barrier_ice", quantity: 1 },
          { id: "simple_sentry_ice", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 3;
    const chesterId = putCorpRootInRemote(state, "onr_v1_352_chester-mix");
    state.cardInstances[chesterId] = {
      ...state.cardInstances[chesterId]!,
      faceup: true,
      rezzed: true,
    };
    const fortressId = putCorpRootInRemote(
      state,
      "onr_v1_324_fortress-architects",
    );
    state.cardInstances[fortressId] = {
      ...state.cardInstances[fortressId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "remote_1", "onr_v1_279_wall-of-static");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    putCorpIceOnServer(state, "rd", "simple_sentry_ice");
    const iceId = moveCorpCardToHq(state, "simple_code_gate_ice");

    const sameFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "ice",
    );
    expect(sameFortInstall.payload).toMatchObject({
      iceInstallBaseCost: 2,
      iceInstallReduction: 3,
      iceInstallTotalCost: 0,
    });
    expect(
      String(
        sameFortInstall.payload?.iceInstallReductionSourceDefinitionIds,
      ).split(","),
    ).toEqual(
      expect.arrayContaining([
        "onr_v1_352_chester-mix",
        "onr_v1_324_fortress-architects",
      ]),
    );

    const otherFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(otherFortInstall.payload).toMatchObject({
      iceInstallBaseCost: 1,
      iceInstallReduction: 1,
      iceInstallTotalCost: 0,
      iceInstallReductionSourceDefinitionIds: "onr_v1_324_fortress-architects",
    });
    expect(
      getPlayerView(state, "corp").servers.find(
        (server) => server.id === "remote_1",
      )?.statuses,
    ).toEqual([
      expect.objectContaining({
        kind: "cost_modifier",
        costKind: "corp_ice_install",
        operation: "reduce",
        amount: 2,
        targetServerId: "remote_1",
        sourceCardInstanceId: chesterId,
        sourceTitle: "Chester Mix",
        sourceSide: "corp",
      }),
    ]);
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "rd")
        ?.statuses,
    ).toBeUndefined();

    const stale = structuredClone(state);
    stale.cardInstances[chesterId] = {
      ...stale.cardInstances[chesterId]!,
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "corp",
        actionId: sameFortInstall.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "p310-chester-stale",
      }).ok,
    ).toBe(false);
    expect(stale.corp.credits).toBe(20);
  });

  it("trashes a Runner daemon when Chimera is accessed and keeps the access flow legal", () => {
    let state = toRunnerTurn(v199CardReleaseGame("v199-chimera"));
    state.runner.credits = 20;
    const afreetId = installRunnerProgramForTest(state, "onr_v1_001_afreet");
    const chimeraId = putCorpRootInRemote(state, "onr_v1_353_chimera");

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
      (action) => action.type === "rez_card" && action.source === chimeraId,
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toContain(afreetId);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "decline_trash",
      ),
    ).toBe(true);
  });
});
