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

describe("V1.9.0 Mechanikpaket I", () => {
  it("adds a controlled V1.9.0 core card set for deterministic die, concrete resolver and ambush foundation scope", () => {
    expect(ONR_V1_9_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_9_0_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(cardImplementationForDefinitionId(definitionId)).toBeDefined();
    }
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_013_cockroach");
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_034_incubator");
    expect(ONR_V1_9_0_FINAL_CARD_IDS).not.toContain("onr_v1_030_grubb");
  });

  it("validates V1.9.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v190CardReleaseGame("v190-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_268_shock-r"]).toBeDefined();
  });

  it("uses a deterministic shared die resolver namespace and replay-stable random records", () => {
    const playBlinkOnce = (seed: string) => {
      let state = toRunnerTurn(v190CardReleaseGame(seed));
      state.runner.credits = 30;
      moveRunnerCardToGrip(state, "onr_v1_007_blink");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_007_blink",
      );
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
      const blinkId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === "onr_v1_007_blink",
      );
      expect(blinkId).toBeDefined();
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId,
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith(
          "v190.die.icebreaker.random_break_or_damage.onr_v1_007_blink.",
        ),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
      return { state, die };
    };

    const first = playBlinkOnce("v190-die-shared");
    const second = playBlinkOnce("v190-die-shared");
    expect(first.die).toBe(second.die);
    expect(first.state.randomDrawRecords).toEqual(
      second.state.randomDrawRecords,
    );
    expect(hashState(first.state)).toBe(hashState(second.state));
  });

  it("rolls Bartmoss deterministically after encounter usage and trashes exactly on die=1", () => {
    let foundTrash = false;
    let foundSurvive = false;
    for (
      let attempt = 0;
      attempt < 180 && (!foundTrash || !foundSurvive);
      attempt += 1
    ) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-bartmoss-${attempt}`));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_005_bartmoss-memorial-icebreaker");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_005_bartmoss-memorial-icebreaker",
      );
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
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      expect(bartmossId).toBeDefined();
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith(
          "v190.die.onr_v1_005_bartmoss-memorial-icebreaker.post_encounter.",
        ),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      const stillInstalled = bartmossId
        ? state.runner.rig.programs.includes(bartmossId)
        : false;
      if (die === 1) {
        expect(stillInstalled).toBe(false);
        foundTrash = true;
      } else {
        expect(stillInstalled).toBe(true);
        foundSurvive = true;
      }
    }
    expect(foundTrash).toBe(true);
    expect(foundSurvive).toBe(true);
  });

  it("resolves Blink as deterministic break-or-net-damage and enforces once-per-subroutine-per-encounter", () => {
    let foundBreak = false;
    let foundDamage = false;
    for (
      let attempt = 0;
      attempt < 180 && (!foundBreak || !foundDamage);
      attempt += 1
    ) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-blink-${attempt}`));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_007_blink");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_007_blink",
      );
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
      const blinkId = state.runner.rig.programs.find(
        (id) => state.cardInstances[id]?.definitionId === "onr_v1_007_blink",
      );
      expect(blinkId).toBeDefined();
      const gripBefore = state.runner.grip.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId,
      );
      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith(
          "v190.die.icebreaker.random_break_or_damage.onr_v1_007_blink.",
        ),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      const publicPayload = state.eventLog.at(-1)?.publicPayload;
      expect(publicPayload).toMatchObject({
        actionType: "break_subroutine",
        targetIceDefinitionId: "onr_v1_279_wall-of-static",
        targetIceTitle: "Wall of Static",
        subroutineIndex: 0,
        randomBreakOutcomeKind: "random_break_or_damage",
        randomBreakOutcomeRoll: die,
        randomBreakOutcomeSuccess: die >= 4,
        randomBreakOutcomeDamageAmount: die >= 4 ? 0 : die,
      });
      expect(JSON.stringify(publicPayload)).not.toContain("privatePayload");
      expect(JSON.stringify(publicPayload)).not.toContain("cardInstances");
      const repeatBlinkBreakActions = getLegalActions(state, "runner").filter(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === blinkId &&
          Number(action.payload?.subroutineIndex) === 0,
      );
      expect(repeatBlinkBreakActions).toHaveLength(0);
      if (die >= 4) {
        expect(state.run?.brokenSubroutineIndexes).toContain(0);
        expect(state.runner.grip.length).toBe(gripBefore);
        foundBreak = true;
      } else {
        expect(state.run?.brokenSubroutineIndexes).not.toContain(0);
        expect(state.runner.grip.length).toBe(gripBefore - die);
        foundDamage = true;
      }
    }
    expect(foundBreak).toBe(true);
    expect(foundDamage).toBe(true);
  });

  it("gates Terrorist Reprisal by last-turn black_ops scoring and discards up to five HQ cards deterministically", () => {
    let state = toRunnerTurn(v190CardReleaseGame("v190-terrorist-reprisal"));
    state.runner.maxHandSize = 10;
    state.runner.credits = 30;
    state.corp.maxHandSize = 100;
    const reprisalId = moveRunnerCardToGrip(
      state,
      "onr_v1_115_terrorist-reprisal",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === reprisalId,
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 60;
    state.corp.clicks = 20;
    moveCorpCardToHq(state, "onr_v1_193_corporate-coup");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 5; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
    );
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const hqIds = [
      moveCorpCardToHq(state, "simple_economy_operation"),
      moveCorpCardToHq(state, "simple_barrier_ice"),
      moveCorpCardToHq(state, "onr_v1_275_vacuum-link"),
      moveCorpCardToHq(state, "onr_v1_223_banpei"),
      moveCorpCardToHq(state, "onr_v1_279_wall-of-static"),
      moveCorpCardToHq(state, "onr_v1_203_hostile-takeover"),
    ];
    keepOnlyCorpHqCards(state, hqIds);
    const archivesBefore = state.corp.archives.length;
    const hqBefore = state.corp.hq.length;
    const rdBefore = state.corp.rd.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === reprisalId,
    );
    expect(state.corp.hq.length).toBe(Math.max(0, hqBefore - 5));
    expect(state.corp.archives.length - archivesBefore).toBe(
      Math.min(5, hqBefore),
    );
    const discarded = state.corp.archives.slice(-Math.min(5, hqBefore));
    expect(new Set(discarded).size).toBe(discarded.length);
    const discardRecords = state.randomDrawRecords.filter((record) =>
      record.purpose.startsWith(
        "card_implementation.random.onr_v1_115_terrorist-reprisal.hq_discard",
      ),
    );
    expect(discardRecords).toHaveLength(Math.min(5, hqBefore));
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
  });

  it("applies Banpei trash-program subroutine deterministically and keeps end-the-run independent", () => {
    let withProgram = toRunnerTurn(
      v190CardReleaseGame("v190-banpei-with-program"),
    );
    withProgram.runner.credits = 20;
    moveRunnerCardToGrip(withProgram, "onr_v1_014_codecracker");
    withProgram = apply(
      withProgram,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withProgram, action) === "onr_v1_014_codecracker",
    );
    const codecrackerId = withProgram.runner.rig.programs.find(
      (id) =>
        withProgram.cardInstances[id]?.definitionId ===
        "onr_v1_014_codecracker",
    );
    expect(codecrackerId).toBeDefined();
    putCorpIceOnServer(withProgram, "rd", "onr_v1_223_banpei");
    withProgram = apply(
      withProgram,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withProgram = apply(
      withProgram,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withProgram, action) === "onr_v1_223_banpei",
    );
    withProgram = apply(
      withProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    withProgram = applyChoice(withProgram, "corp", `card_${codecrackerId}`);
    withProgram = apply(
      withProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(withProgram.runner.heap).toContain(codecrackerId);
    expect(withProgram.run).toBeUndefined();

    let withoutProgram = toRunnerTurn(
      v190CardReleaseGame("v190-banpei-without-program"),
    );
    withoutProgram.runner.credits = 20;
    putCorpIceOnServer(withoutProgram, "rd", "onr_v1_223_banpei");
    withoutProgram = apply(
      withoutProgram,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withoutProgram = apply(
      withoutProgram,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withoutProgram, action) === "onr_v1_223_banpei",
    );
    withoutProgram = apply(
      withoutProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(withoutProgram.run).toBeUndefined();
  });

  it("resolves CardImplementation printed program-trash ICE without shared duplication", () => {
    const setupTrashProgramIce = (
      seed: string,
      definitionId: "onr_v1_223_banpei" | "onr_v1_235_data-naga",
      options: {
        serverId?: "rd" | "remote_1";
        crystal?: boolean;
        tesseract?: boolean;
      } = {},
    ): GameState => {
      const serverId = options.serverId ?? "rd";
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed,
          runnerDeck: {
            ...ONR_V1_RUNNER_DECK,
            cards: [
              { id: "simple_killer", quantity: 2 },
              ...ONR_V1_RUNNER_DECK.cards.filter(
                (card) => card.id !== "simple_killer",
              ),
            ],
          },
          corpDeck: {
            ...ONR_V1_CORP_DECK,
            cards: [
              { id: definitionId, quantity: 1 },
              ...(options.crystal
                ? [
                    {
                      id: "onr_v1_355_crystal-palace-station-grid",
                      quantity: 1,
                    },
                  ]
                : []),
              ...(options.tesseract
                ? [
                    {
                      id: "onr_v1_370_tesseract-fort-construction",
                      quantity: 1,
                    },
                  ]
                : []),
              ...ONR_V1_CORP_DECK.cards.filter(
                (card) =>
                  card.id !== definitionId &&
                  card.id !== "onr_v1_355_crystal-palace-station-grid" &&
                  card.id !== "onr_v1_370_tesseract-fort-construction",
              ),
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 50;
      state.corp.credits = 50;
      if (options.crystal) {
        const crystalId = putCorpRootInRemote(
          state,
          "onr_v1_355_crystal-palace-station-grid",
        );
        state.cardInstances[crystalId] = {
          ...state.cardInstances[crystalId]!,
          faceup: true,
          rezzed: true,
        };
      }
      if (options.tesseract) {
        const tesseractId = putCorpRootInRemote(
          state,
          "onr_v1_370_tesseract-fort-construction",
        );
        state.cardInstances[tesseractId] = {
          ...state.cardInstances[tesseractId]!,
          faceup: true,
          rezzed: true,
        };
      }
      putCorpIceOnServer(state, serverId, definitionId);
      return encounterIce(state, serverId, definitionId);
    };

    let unbroken = setupTrashProgramIce(
      "p326-banpei-unbroken",
      "onr_v1_223_banpei",
    );
    const killerId = installRunnerProgramForTest(unbroken, "simple_killer");
    const continueAction = mustAction(
      unbroken,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(continueAction.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "printed_subroutines_trash_program,printed_subroutines_end_the_run",
      encounterWillEndRun: true,
    });
    unbroken = apply(
      unbroken,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    unbroken = applyChoice(unbroken, "corp", `card_${killerId}`);
    const trashEvent = unbroken.eventLog.at(-1);
    unbroken = apply(
      unbroken,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(unbroken.runner.heap).toContain(killerId);
    expect(unbroken.run).toBeUndefined();
    expect(trashEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCardDefinitionId: "simple_killer",
      trashedCardType: "program",
      trashedCount: 1,
    });
    const resolvedEffects = unbroken.eventLog.flatMap((event) =>
      Array.isArray(event.publicPayload.resolvedEffects)
        ? event.publicPayload.resolvedEffects
        : [],
    );
    expect(resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_223_banpei",
          sourceTitle: "Banpei",
          subroutineIndex: 0,
          subroutineType: "trash_installed_program",
          cardDefinitionId: "simple_killer",
          cardTitle: "Simple Killer",
          cardsTrashed: 1,
        }),
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_223_banpei",
          sourceTitle: "Banpei",
          subroutineIndex: 1,
          subroutineType: "end_the_run",
          endedRun: true,
        }),
      ]),
    );

    let brokenTrash = setupTrashProgramIce(
      "p326-banpei-break-trash",
      "onr_v1_223_banpei",
    );
    const protectedKillerId = installRunnerProgramForTest(
      brokenTrash,
      "simple_killer",
    );
    brokenTrash = breakCurrentSubroutine(brokenTrash, "simple_killer", 0);
    brokenTrash = apply(
      brokenTrash,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(brokenTrash.runner.heap).not.toContain(protectedKillerId);
    expect(brokenTrash.run).toBeUndefined();

    let bothBroken = setupTrashProgramIce(
      "p326-banpei-break-both",
      "onr_v1_223_banpei",
    );
    const survivingKillerId = installRunnerProgramForTest(
      bothBroken,
      "simple_killer",
    );
    bothBroken = breakCurrentSubroutine(bothBroken, "simple_killer", 0);
    bothBroken = breakCurrentSubroutine(bothBroken, "simple_killer", 1);
    bothBroken = continueRunThroughMovementWindow(bothBroken);
    expect(bothBroken.runner.heap).not.toContain(survivingKillerId);
    expect(bothBroken.run?.phase).toBe("access");

    let withoutProgram = setupTrashProgramIce(
      "p326-banpei-no-program",
      "onr_v1_223_banpei",
    );
    withoutProgram = apply(
      withoutProgram,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(withoutProgram.run).toBeUndefined();
    expect(withoutProgram.runner.heap).toHaveLength(0);

    let dataNaga = setupTrashProgramIce(
      "p326-data-naga-program-trash",
      "onr_v1_235_data-naga",
    );
    const dataNagaKillerId = installRunnerProgramForTest(
      dataNaga,
      "simple_killer",
    );
    dataNaga = apply(
      dataNaga,
      "runner",
      (action) => action.type === "continue_run",
    );
    dataNaga = applyChoice(dataNaga, "corp", `card_${dataNagaKillerId}`);
    expect(dataNaga.runner.heap).toContain(dataNagaKillerId);
    expect(dataNaga.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      trashedCardDefinitionId: "simple_killer",
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(
      dataNaga.eventLog.flatMap((event) =>
        Array.isArray(event.publicPayload.resolvedEffects)
          ? event.publicPayload.resolvedEffects
          : [],
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "resolve_subroutine",
          sourceDefinitionId: "onr_v1_235_data-naga",
          subroutineType: "trash_installed_program",
          cardDefinitionId: "simple_killer",
          cardsTrashed: 1,
        }),
      ]),
    );

    let crystal = setupTrashProgramIce(
      "p326-crystal-break-trash-program",
      "onr_v1_223_banpei",
      { serverId: "remote_1", crystal: true },
    );
    installRunnerProgramForTest(crystal, "simple_killer");
    const crystalBreaks = getLegalActions(crystal, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(crystal, action) === "simple_killer",
    );
    expect(
      crystalBreaks.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0, 1]);
    expect(crystalBreaks.map((action) => action.costs)).toEqual([
      [{ credits: 2 }],
      [{ credits: 2 }],
    ]);

    let tesseract = setupTrashProgramIce(
      "p326-tesseract-after-trash-program",
      "onr_v1_223_banpei",
      { serverId: "remote_1", tesseract: true },
    );
    installRunnerProgramForTest(tesseract, "simple_killer");
    const tesseractContinue = mustAction(
      tesseract,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tesseractContinue.payload).toMatchObject({
      unbrokenSubroutineCount: 2,
      encounterSubroutineIds:
        "printed_subroutines_trash_program,printed_subroutines_end_the_run",
    });
    expect(tesseractContinue.payload).not.toHaveProperty(
      "payOrEndRunSubroutineIndexes",
    );
  });

  it("rewinds runs with Vacuum Link on 1..3 and preserves legal jack-out window with first-ice edge handling", () => {
    let covered = false;
    for (let attempt = 0; attempt < 220 && !covered; attempt += 1) {
      let state = toRunnerTurn(v190CardReleaseGame(`v190-vacuum-${attempt}`));
      state.runner.credits = 40;
      state.corp.credits = 20;
      moveRunnerCardToGrip(state, "onr_v1_005_bartmoss-memorial-icebreaker");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      const bartmossId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_005_bartmoss-memorial-icebreaker",
      );
      expect(bartmossId).toBeDefined();
      putCorpIceOnServer(state, "rd", "onr_v1_275_vacuum-link");
      putCorpIceOnServer(state, "rd", "simple_barrier_ice");
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
          sourceDefinition(state, action) === "simple_barrier_ice",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === bartmossId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === "onr_v1_275_vacuum-link",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      const dieRecord = state.randomDrawRecords.find((record) =>
        record.purpose.startsWith("v190.die.rewind_run_to_rezzed_ice_by_die."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      if (die < 2 || die > 3) continue;
      expect(state.pendingChoice).toMatchObject({
        side: "runner",
        source: "card_implementation.vacuum_link_rewind",
        kind: "select_option",
      });
      state = applyChoice(state, "runner", "resume_from_rezzed_ice_back");
      const run = state.run;
      expect(run?.phase).toBe("movement");
      expect(run?.position.kind).toBe("ice");
      if (!run || run.position.kind !== "ice") {
        throw new Error(
          "expected run position to be ice after vacuum-link rewind",
        );
      }
      expect(run.position.iceIndex).toBe(1);
      const movementActions = getLegalActions(state, "runner")
        .map((action) => action.type)
        .sort();
      expect(movementActions).toEqual(["continue_run", "jack_out"]);
      covered = true;
    }
    expect(covered).toBe(true);
  });

  it("executes the ambush-on-access foundation hook deterministically via harness without scope expansion", () => {
    let state = toRunnerTurn(v190CardReleaseGame("v190-ambush-foundation"));
    state.runner.credits = 20;
    state.ambushHarness = {
      enabled: true,
      triggerDefinitionId: "onr_v1_223_banpei",
    };
    putCorpCardOnTopOfRd(state, "onr_v1_223_banpei");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "ambush_on_access_foundation",
    });
    const ambushPayload = (
      state.eventLog.at(-1)?.privatePayload as
        | { runner?: { legalAction?: { payload?: unknown } } }
        | undefined
    )?.runner?.legalAction?.payload;
    expect(ambushPayload).toMatchObject({
      ambushFoundationChecked: true,
      ambushFoundationTriggered: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("V1.9.1 Mechanikpaket J", () => {
  it("adds a controlled V1.9.1 core card set for cockroach random discard, incubator transform and grubb run-remainder strength", () => {
    expect(ONR_V1_9_1_FINAL_CARD_IDS).toHaveLength(3);
    for (const definitionId of ONR_V1_9_1_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(cardImplementationForDefinitionId(definitionId)).toBeDefined();
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking|deckbuilder/,
      );
    }
  });

  it("validates V1.9.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v191CardReleaseGame("v191-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_275_vacuum-link"]).toBeDefined();
  });

  it("randomizes Corp HQ discard deterministically with Cockroach threshold and keeps replay/statehash stable", () => {
    const runScenario = (seed: string): GameState => {
      let state = toRunnerTurn(v191CardReleaseGame(seed));
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_013_cockroach");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_013_cockroach",
      );

      const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
      keepOnlyCorpHqCard(state, keptHqId);
      for (let index = 0; index < 2; index += 1) {
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "start_run" && action.payload?.serverId === "hq",
        );
        state = apply(
          state,
          "runner",
          (action) => action.type === "access_card",
        );
      }

      const cockroachId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId === "onr_v1_013_cockroach",
      );
      expect(cockroachId).toBeDefined();
      expect(
        cockroachId ? cardCounterAmount(state, cockroachId, "virus") : 0,
      ).toBe(0);
      expect(
        state.purgeableRunnerVirusCounters?.corp?.cockroach,
      ).toBeGreaterThanOrEqual(2);
      const lastCockroachCounterEvent = [...state.eventLog]
        .reverse()
        .find((event) => {
          const effects = event.publicPayload.resolvedEffects;
          return (
            Array.isArray(effects) &&
            effects.some(
              (effect) =>
                effect.kind === "counter_change" &&
                effect.reason === "runner_virus_successful_run",
            )
          );
        });
      expect(
        lastCockroachCounterEvent?.publicPayload.resolvedEffects,
      ).toContainEqual(
        expect.objectContaining({
          kind: "counter_change",
          side: "corp",
          counterType: "cockroach",
          addedCounterAmount: 1,
          remainingCounters: 2,
          reason: "runner_virus_successful_run",
          sourceDefinitionId: "onr_v1_013_cockroach",
          sourceTitle: "Cockroach",
        }),
      );
      const runnerView = getPlayerView(state, "runner");
      const corpView = getPlayerView(state, "corp");
      const cockroachView = runnerView.own.rig?.find(
        (card) => card.definitionId === "onr_v1_013_cockroach",
      );
      expect(cockroachView?.counters?.virus).toBeUndefined();
      expect(
        cockroachView?.counterDisplays?.some(
          (display) => display.id === "virus" || display.id === "cockroach",
        ),
      ).not.toBe(true);
      expect(runnerView.opponent.identity.counterDisplays).toContainEqual(
        expect.objectContaining({
          id: "runner_virus_corp_cockroach",
          amount: 2,
          label: "Cockroach-Counter",
          ariaLabel: "2 Cockroach-Counter",
          counterType: "cockroach",
        }),
      );
      expect(corpView.own.identity.counterDisplays).toContainEqual(
        expect.objectContaining({
          id: "runner_virus_corp_cockroach",
          amount: 2,
          label: "Cockroach-Counter",
          counterType: "cockroach",
        }),
      );

      state = apply(state, "runner", (action) => action.type === "end_turn");
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      moveCorpCardToHq(state, "onr_v1_279_wall-of-static");
      moveCorpCardToHq(state, "onr_v1_238_data-wall-2-0");
      state.corp.maxHandSize = Math.max(0, state.corp.hq.length - 1);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "corp", (action) => action.type === "end_turn");
      expect(state.pendingChoice?.source).toBe("discard_phase");
      const selectedIds = (state.pendingChoice?.options ?? [])
        .slice(0, state.pendingChoice?.minSelections ?? 1)
        .map((option) => String(option.id));
      state = applyChoices(state, "corp", selectedIds);

      const randomRecords = state.randomDrawRecords.filter((record) =>
        record.purpose.startsWith("v191.random.runner_virus_hq_discard_phase"),
      );
      expect(randomRecords).toHaveLength(1);
      const discardEvent = [...state.eventLog]
        .reverse()
        .find(
          (event) => event.publicPayload.hiddenZoneAction === "discard_phase",
        );
      expect(discardEvent?.visibilityClass).toBe("hidden_info_barrier");
      expect(discardEvent?.publicPayload).toMatchObject({
        hiddenZoneAction: "discard_phase",
      });

      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(replay.actualFinalStateHash).toBe(hashState(state));
      return state;
    };

    const first = runScenario("v191-cockroach-random");
    const second = runScenario("v191-cockroach-random");
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(hashState(first)).toBe(hashState(second));
  });

  it("runs incubator start-of-turn die rolls deterministically and resolves hidden-info-safe counter transforms", () => {
    let foundState: GameState | undefined;
    for (let attempt = 0; attempt < 250; attempt += 1) {
      let state = toRunnerTurn(
        v191CardReleaseGame(`v191-incubator-${attempt}`),
      );
      state.runner.credits = 40;
      moveRunnerCardToGrip(state, "onr_v1_034_incubator");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "onr_v1_034_incubator",
      );
      const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
      keepOnlyCorpHqCard(state, keptHqId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
      state = apply(state, "runner", (action) => action.type === "end_turn");
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state = toRunnerTurnFromCorpMain(state);

      if (state.pendingChoice?.source.startsWith("v191.incubator_transform")) {
        foundState = state;
        break;
      }
    }

    expect(foundState).toBeDefined();
    if (!foundState) return;
    let state = foundState;
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const dieRecords = state.randomDrawRecords.filter((record) =>
      record.purpose.startsWith(
        "v190.die.virus_counter.onr_v1_034_incubator.start_of_turn.roll.",
      ),
    );
    expect(dieRecords.length).toBeGreaterThan(0);

    const selectedOption =
      state.pendingChoice?.options.find((option) =>
        option.id.startsWith("card_"),
      ) ?? state.pendingChoice?.options[0];
    expect(selectedOption).toBeDefined();
    if (!selectedOption) return;

    const selectedValue =
      typeof selectedOption.value === "string" ? selectedOption.value : "";
    let beforeCount = 0;
    if (selectedValue.startsWith("card:")) {
      const cardId = selectedValue.slice("card:".length) as CardInstanceId;
      beforeCount = cardCounterAmount(state, cardId, "virus");
    } else if (selectedValue.startsWith("pox:")) {
      const serverId = selectedValue.slice("pox:".length) as keyof NonNullable<
        GameState["poxCountersByServer"]
      >;
      beforeCount = state.poxCountersByServer?.[serverId] ?? 0;
    } else if (selectedValue.startsWith("corp_pool:")) {
      const counterType = selectedValue.slice("corp_pool:".length) as
        | "incubate"
        | "cockroach";
      beforeCount =
        state.purgeableRunnerVirusCounters?.corp?.[counterType] ?? 0;
    }

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoice(state, "runner", String(selectedOption.id));

    if (selectedValue.startsWith("card:")) {
      const cardId = selectedValue.slice("card:".length) as CardInstanceId;
      expect(cardCounterAmount(state, cardId, "virus")).toBe(beforeCount + 1);
    } else if (selectedValue.startsWith("pox:")) {
      const serverId = selectedValue.slice("pox:".length) as keyof NonNullable<
        GameState["poxCountersByServer"]
      >;
      expect(state.poxCountersByServer?.[serverId] ?? 0).toBe(beforeCount + 1);
    } else if (selectedValue.startsWith("corp_pool:")) {
      const counterType = selectedValue.slice("corp_pool:".length) as
        | "incubate"
        | "cockroach";
      expect(state.purgeableRunnerVirusCounters?.corp?.[counterType] ?? 0).toBe(
        beforeCount + 1,
      );
    }
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "incubator_transform",
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps Grubb strength bonus for the remainder of the run and resets it on the next run", () => {
    let state = toRunnerTurn(v191CardReleaseGame("v191-grubb-run-bonus"));
    state.runner.credits = 60;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_030_grubb");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_030_grubb",
    );
    const grubbId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_030_grubb",
    );
    expect(grubbId).toBeDefined();
    if (!grubbId) return;

    putCorpIceOnServer(state, "rd", "onr_v1_238_data-wall-2-0");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
        sourceDefinition(state, action) === "onr_v1_279_wall-of-static",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_238_data-wall-2-0",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(true);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === grubbId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.run).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === grubbId,
      ),
    ).toBe(false);
  });

  it("purges Cockroach and Incubator virus counters through the existing legal purge gate", () => {
    let state = toRunnerTurn(v191CardReleaseGame("v191-purge-virus"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_013_cockroach");
    moveRunnerCardToGrip(state, "onr_v1_034_incubator");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_013_cockroach",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_034_incubator",
    );
    const keptHqId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, keptHqId);

    for (let index = 0; index < 2; index += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "hq",
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
    }

    const cockroachId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_013_cockroach",
    );
    const incubatorId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_034_incubator",
    );
    expect(cockroachId).toBeDefined();
    expect(incubatorId).toBeDefined();
    if (!cockroachId || !incubatorId) return;
    expect(cardCounterAmount(state, cockroachId, "virus")).toBe(0);
    expect(cardCounterAmount(state, incubatorId, "virus")).toBe(0);
    expect(state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      cockroach: 2,
      incubate: 2,
    });

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.purgeableRunnerVirusCounters?.corp).toMatchObject({
      cockroach: 2,
      incubate: 2,
    });
    expect(state.phase).toBe("corp_action_phase");
    expect(state.corp.clicks).toBe(3);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_runner_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_runner_virus_counters",
    );

    expect(cardCounterAmount(state, cockroachId, "virus")).toBe(0);
    expect(cardCounterAmount(state, incubatorId, "virus")).toBe(0);
    expect(state.purgeableRunnerVirusCounters?.corp?.cockroach ?? 0).toBe(0);
    expect(state.purgeableRunnerVirusCounters?.corp?.incubate ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "runner_virus",
      purgeModel: "future_action_debt",
      actionDebtAdded: 3,
    });
  });
});
