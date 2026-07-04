import { describe, expect, it } from "vitest";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import {
  createGameAfterSetup,
  getLegalActions,
  validateGameState,
} from "../../index";
import { runnerMemoryLimit } from "../../ability-engine/effective-values";
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { addCorpCardToHqForTest } from "../../test-fixtures/index-test-helpers";
import {
  agendaPoints,
  apply,
  applyChoices,
  emptyRunnerGripForTest,
  installRunnerHardwareForTest,
  installRunnerResourceForTest,
  moveRunnerCardCopyToGrip,
  putRunnerCardOnTopOfStack,
  scoreRunnerAgendaForTest,
  setCardCounterForTest,
  sourceDefinition,
  toRunnerTurnFromCorpMain,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const BADTIMES = "onr_classic_016_badtimes";
const BOOSTERGANG_CONNECTIONS = "onr_classic_034_boostergang-connections";
const CORRUPTION = "onr_classic_035_corruption";
const DO_THE_DRINE = "onr_classic_036_do-the-drine";
const GYPSYTM_SCHEDULE_ANALYZER = "onr_classic_038_gypsytm-schedule-analyzer";
const LIBRARY_SEARCH = "onr_classic_039_library-search";
const RUNNING_INTERFERENCE = "onr_classic_043_running-interference";
const CRASH_SPACE = "onr_classic_044_crash-space";
const ELENA_LASKOVA = "onr_classic_045_elena-laskova";
const EXECUTIVE_FILE_CLERK = "onr_classic_046_executive-file-clerk";
const LITTLE_BLACK_BOX = "onr_classic_047_little-black-box";
const OMNITECH_SPINAL_TAP_CYBERMODEM =
  "onr_classic_048_omnitech-spinal-tap-cybermodem";
const OMNITECH_WET_DRIVE = "onr_classic_049_omnitech-wet-drive";
const SANDBOX_DIG = "onr_classic_050_sandbox-dig";
const VINTAGE_CAMARO = "onr_classic_051_vintage-camaro";
const ZETATECH_PORTASTATION = "onr_classic_052_zetatech-portastation";

const CLASSIC_09_IDS = [
  BADTIMES,
  BOOSTERGANG_CONNECTIONS,
  CORRUPTION,
  DO_THE_DRINE,
  GYPSYTM_SCHEDULE_ANALYZER,
  LIBRARY_SEARCH,
  RUNNING_INTERFERENCE,
  CRASH_SPACE,
  ELENA_LASKOVA,
  EXECUTIVE_FILE_CLERK,
  LITTLE_BLACK_BOX,
  OMNITECH_SPINAL_TAP_CYBERMODEM,
  OMNITECH_WET_DRIVE,
  SANDBOX_DIG,
  VINTAGE_CAMARO,
  ZETATECH_PORTASTATION,
] as const;

const CLASSIC_09_CORP_DECK: DeckDefinition = {
  id: "classic_09_runner_rest_smoke_corp",
  name: "Classic 09 Runner Rest Smoke Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: BADTIMES, quantity: 1 },
    { id: "simple_agenda", quantity: 8 },
    { id: "simple_barrier_ice", quantity: 3 },
    { id: "simple_economy_operation", quantity: 8 },
  ],
};

const CLASSIC_09_RUNNER_DECK: DeckDefinition = {
  id: "classic_09_runner_rest_smoke_runner",
  name: "Classic 09 Runner Rest Smoke Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: BOOSTERGANG_CONNECTIONS, quantity: 1 },
    { id: CORRUPTION, quantity: 1 },
    { id: DO_THE_DRINE, quantity: 1 },
    { id: GYPSYTM_SCHEDULE_ANALYZER, quantity: 1 },
    { id: LIBRARY_SEARCH, quantity: 1 },
    { id: RUNNING_INTERFERENCE, quantity: 1 },
    { id: CRASH_SPACE, quantity: 1 },
    { id: ELENA_LASKOVA, quantity: 1 },
    { id: EXECUTIVE_FILE_CLERK, quantity: 1 },
    { id: LITTLE_BLACK_BOX, quantity: 1 },
    { id: OMNITECH_SPINAL_TAP_CYBERMODEM, quantity: 1 },
    { id: OMNITECH_WET_DRIVE, quantity: 1 },
    { id: SANDBOX_DIG, quantity: 1 },
    { id: VINTAGE_CAMARO, quantity: 1 },
    { id: ZETATECH_PORTASTATION, quantity: 1 },
    { id: "simple_setup_hardware", quantity: 2 },
    { id: "simple_fracter", quantity: 1 },
    { id: "simple_economy_event", quantity: 12 },
    { id: "simple_run_event", quantity: 1 },
  ],
};

function classic09Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    corpDeck: CLASSIC_09_CORP_DECK,
    runnerDeck: CLASSIC_09_RUNNER_DECK,
    agendaPointsToWin: 99,
  });
}

function corpMainClassic09Game(seed: string): GameState {
  const state = apply(
    classic09Game(seed),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.corp.credits = 80;
  state.corp.clicks = 30;
  state.corp.maxHandSize = 100;
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 4;
  return state;
}

function toRunnerClassic09Game(seed: string): GameState {
  const state = toRunnerTurnFromCorpMain(corpMainClassic09Game(seed));
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 4;
  return state;
}

function expectValid(state: GameState): void {
  expect(validateGameState(state).ok).toBe(true);
}

describe("Classic Runner Rest Card Implementation Smokes", () => {
  it("registers CLASSIC-09 cards with declarative implementations", () => {
    for (const definitionId of CLASSIC_09_IDS) {
      expect(
        cardImplementationForDefinitionId(definitionId),
        definitionId,
      ).toBeDefined();
      expect(
        cardImplementationCoverageForDefinitionId(definitionId),
      ).toMatchObject({
        cardDefinitionId: definitionId,
        status: "implemented",
      });
    }

    expect(
      cardImplementationForDefinitionId(BADTIMES)?.corpUtility,
    ).toMatchObject({
      kind: "runner_memory_limit_modifier_until_end_of_turn",
      amount: 2,
    });
    expect(
      cardImplementationForDefinitionId(LIBRARY_SEARCH)?.runnerEventLongtail,
    ).toMatchObject({
      kind: "library_search_run",
      accessBonus: 2,
    });
    expect(
      cardImplementationForDefinitionId(ZETATECH_PORTASTATION)
        ?.restrictedHostedCreditSource,
    ).toMatchObject({
      usableFor: ["play_events"],
    });
  });

  it("opens a private stack choice for Boostergang Connections instead of taking the top stack cards", () => {
    let state = toRunnerClassic09Game("classic-09-boostergang-choice");
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardCopyToGrip(state, BOOSTERGANG_CONNECTIONS);
    moveRunnerCardCopyToGrip(state, "simple_economy_event");
    moveRunnerCardCopyToGrip(state, "simple_run_event");
    const selectedThird = putRunnerCardOnTopOfStack(state, CRASH_SPACE);
    const selectedSecond = putRunnerCardOnTopOfStack(
      state,
      GYPSYTM_SCHEDULE_ANALYZER,
    );
    const unchosenTop = putRunnerCardOnTopOfStack(state, LIBRARY_SEARCH);
    state.runner.credits = 40;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === eventId,
    );

    expect(state.runner.grip).toHaveLength(0);
    expect(
      state.runner.heap.map(
        (cardId) => state.cardInstances[cardId]?.definitionId,
      ),
    ).toEqual(
      expect.arrayContaining([
        BOOSTERGANG_CONNECTIONS,
        "simple_economy_event",
        "simple_run_event",
      ]),
    );
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("p3_37.search_stack_to_grip"),
      minSelections: 2,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "any_card",
        destination: "grip",
        reveal: "hidden",
        shuffleAfter: true,
      },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: BOOSTERGANG_CONNECTIONS,
      runnerEventAbility: "trash_grip_search_stack_to_grip_equal_count",
      trashedCount: 2,
      searchedCount: 2,
      movedToGripCount: 0,
      stackShuffled: false,
      choiceVisibility: "runner_private",
    });

    state = applyChoices(state, "runner", [
      `card_${selectedSecond}`,
      `card_${selectedThird}`,
    ]);

    expect(state.runner.grip).toEqual(
      expect.arrayContaining([selectedSecond, selectedThird]),
    );
    expect(state.runner.stack).toContain(unchosenTop);
    expect(state.runner.stack).not.toContain(selectedSecond);
    expect(state.runner.stack).not.toContain(selectedThird);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      sourceDefinitionId: BOOSTERGANG_CONNECTIONS,
      searchedZone: "runner_stack",
      selectedCount: 2,
      movedCardCount: 2,
      searchDestination: "runner_grip",
      shufflePerformed: true,
      shuffled: true,
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "publicRevealDefinitionId",
    );
    expectValid(state);
  });

  it("reduces Runner MU with Badtimes only until the Corp turn ends", () => {
    let state = corpMainClassic09Game("classic-09-badtimes");
    state.runner.tags = 1;
    const badtimesId = addCorpCardToHqForTest(state, BADTIMES, "badtimes");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.source === badtimesId &&
        sourceDefinition(state, action) === BADTIMES,
    );

    expect(runnerMemoryLimit(state)).toBe(2);
    expect(state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: badtimesId,
        sourceDefinitionId: BADTIMES,
        amount: 2,
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: BADTIMES,
      classicCorpUtilityAbility:
        "runner_memory_limit_modifier_until_end_of_turn",
      temporaryRunnerMemoryLimitReduction: 2,
    });

    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(runnerMemoryLimit(state)).toBe(4);
    expect(
      state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn ?? [],
    ).toHaveLength(0);
    expectValid(state);
  });

  it("transfers this-turn stolen agenda points through Corruption", () => {
    let state = toRunnerClassic09Game("classic-09-corruption");
    emptyRunnerGripForTest(state);
    const agendaId = scoreRunnerAgendaForTest(state, "simple_agenda");
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags!,
      stolenAgendaIdsThisTurn: [agendaId],
    };
    const runnerPointsBefore = agendaPoints(state, "runner");
    const corruptionId = moveRunnerCardCopyToGrip(state, CORRUPTION);
    state.runner.credits = 0;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" && action.payload?.cardId === corruptionId,
    );

    expect(state.runner.scoreArea).not.toContain(agendaId);
    expect(state.specialZones?.removedFromGame).toContain(agendaId);
    expect(state.corpBonusAgendaPoints).toBe(runnerPointsBefore);
    expect(state.runner.credits).toBe(runnerPointsBefore * 10);
    expect(state.runner.tags).toBe(1);
    expect(state.runnerTurnFlags?.stolenAgendaIdsThisTurn ?? []).not.toContain(
      agendaId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: CORRUPTION,
      runnerEventAbility: "runner_corruption_agenda_point_transfer",
      corruptedAgendaCount: 1,
      agendaPointsLost: runnerPointsBefore,
      gainedCredits: runnerPointsBefore * 10,
      tagsAdded: 1,
    });
    expectValid(state);
  });

  it("offers Do the Drine choices that cannot flatline the Runner", () => {
    let state = toRunnerClassic09Game("classic-09-do-the-drine");
    emptyRunnerGripForTest(state);
    const eventId = moveRunnerCardCopyToGrip(state, DO_THE_DRINE);
    moveRunnerCardCopyToGrip(state, "simple_economy_event");
    moveRunnerCardCopyToGrip(state, "simple_run_event");
    moveRunnerCardCopyToGrip(state, "simple_setup_hardware");
    state.runner.credits = 0;

    const drineActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "play_event" && action.payload?.cardId === eventId,
    );
    expect(drineActions.map((action) => action.payload?.xValue)).toEqual([
      1, 2, 3,
    ]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === eventId &&
        action.payload?.xValue === 3,
    );

    expect(state.runner.credits).toBe(12);
    expect(state.runner.coreDamage).toBe(3);
    expect(state.runner.grip).toHaveLength(0);
    expect(state.phase).not.toBe("game_over");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: DO_THE_DRINE,
      runnerEventAbility: "do_the_drine_unpreventable_core_damage_for_credits",
      xValue: 3,
      damageCannotBePrevented: true,
      gainedCredits: 12,
      flatline: false,
    });
    expectValid(state);
  });

  it("lets Sandbox Dig finish its private R&D look after trashing itself as a cost", () => {
    let state = toRunnerClassic09Game("classic-09-sandbox-dig");
    const sandboxId = installRunnerResourceForTest(state, SANDBOX_DIG);
    state.runner.credits = 40;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === sandboxId &&
        sourceDefinition(state, action) === SANDBOX_DIG,
    );

    expect(state.runner.rig.resources).not.toContain(sandboxId);
    expect(state.runner.heap).toContain(sandboxId);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining(
        `p3_33.private_look:ability:${sandboxId}:rd`,
      ),
      prompt: "R&D ansehen (3)",
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(
      state.pendingChoice?.options.filter((option) =>
        option.id.startsWith("card_"),
      ),
    ).toHaveLength(3);
    expect(state.pendingChoice?.options.at(-1)).toMatchObject({
      id: "done",
      label: "Fertig",
      value: "done",
    });

    state = applyChoices(state, "runner", ["done"]);

    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      sourceDefinitionId: SANDBOX_DIG,
      privateLookZone: "rd",
      privateLookCount: 3,
    });
    expectValid(state);
  });

  it("spends Zetatech Portastation bits before normal credits when playing events", () => {
    let state = toRunnerClassic09Game("classic-09-zetatech-library-search");
    emptyRunnerGripForTest(state);
    const zetatechId = installRunnerHardwareForTest(
      state,
      ZETATECH_PORTASTATION,
    );
    setCardCounterForTest(state, zetatechId, "bit", 1);
    const librarySearchId = moveRunnerCardCopyToGrip(state, LIBRARY_SEARCH);
    state.runner.credits = 1;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === librarySearchId &&
        action.payload?.serverId === "rd",
    );

    expect(state.cardInstances[zetatechId]?.counters?.bit ?? 0).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.conditionalAccessBonus).toMatchObject({
      kind: "no_noisy_icebreaker_or_trace",
      amount: 2,
      sourceDefinitionId: LIBRARY_SEARCH,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: LIBRARY_SEARCH,
      hostedCreditsSpent: 1,
      hostedCreditSourceDefinitionIds: ZETATECH_PORTASTATION,
      normalCreditsSpent: 1,
      runnerCreditsAfter: 0,
    });
    expectValid(state);
  });
});
