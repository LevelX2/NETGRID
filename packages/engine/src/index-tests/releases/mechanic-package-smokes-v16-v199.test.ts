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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.6.1 Mechanikpaket A", () => {
  it("adds a controlled V1.6.1 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_1_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_6_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|worm|search|arrange|shuffle|unique|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_023_evil-twin"]).toMatchObject({
      installCost: 6,
      memoryCost: 1,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_028_force-shield"]).toMatchObject({
      installCost: 2,
      memoryCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_125_dermatech-bodyplating"]).toMatchObject({
      installCost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_229_code-corpse"]).toMatchObject({
      rezCost: 10,
      strength: 5,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_231_cortical-scrub"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_254_liche"]).toMatchObject({
      rezCost: 14,
      strength: 6,
    });
  });

  it("validates V1.6.1 smoke decks and keeps prior ONR runtime cards legal", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v161CardReleaseGame("v161-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]).toBeDefined();
    expect(DEMO_CARDS_BY_ID["onr_v1_297_overtime-incentives"]).toBeDefined();
  });

  it("uses runtime prevention windows from Force Shield and Dermatech Bodyplating", () => {
    let coreState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v161-force-shield",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: V111_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    coreState.runner.credits = 20;
    moveRunnerCardToGrip(coreState, "onr_v1_028_force-shield");
    coreState = apply(
      coreState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(coreState, action) === "onr_v1_028_force-shield",
    );
    coreState = apply(
      coreState,
      "runner",
      (action) => action.type === "end_turn",
    );
    coreState = apply(
      coreState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    moveCorpCardToHq(coreState, "v111_core_damage_operation");
    const coreGripBefore = coreState.runner.grip.length;
    coreState = apply(
      coreState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(coreState, action) === "v111_core_damage_operation",
    );
    expect(coreState.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    const preventionOption = coreState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    coreState = applyChoice(coreState, "runner", preventionOption ?? "pass");
    expect(coreState.runner.coreDamage).toBe(0);
    expect(coreState.runner.grip.length).toBe(coreGripBefore);
    expect(coreState.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      finalAmount: 0,
      damageAmount: 0,
    });

    let meatState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v161-dermatech",
        runnerDeck: ONR_V1_6_1_RUNNER_DECK,
        corpDeck: ONR_V1_6_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    meatState.runner.credits = 20;
    moveRunnerCardToGrip(meatState, "onr_v1_125_dermatech-bodyplating");
    meatState = apply(
      meatState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(meatState, action) ===
          "onr_v1_125_dermatech-bodyplating",
    );
    meatState = apply(
      meatState,
      "runner",
      (action) => action.type === "end_turn",
    );
    meatState = apply(
      meatState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    meatState.runner.tags = 1;
    moveCorpCardToHq(meatState, "onr_v1_302_scorched-earth");
    const meatGripBefore = meatState.runner.grip.length;
    meatState = apply(
      meatState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(meatState, action) === "onr_v1_302_scorched-earth",
    );
    const meatPreventionOption = meatState.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    meatState = applyChoice(
      meatState,
      "runner",
      meatPreventionOption ?? "pass",
    );
    expect(meatState.runner.grip.length).toBe(meatGripBefore - 3);
    expect(meatState.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 3,
    });
  });

  it("resolves new core-damage ICE through replayable, side-safe run paths", () => {
    const cases = [
      { ice: "onr_v1_229_code-corpse", expectedCoreDamage: 2 },
      { ice: "onr_v1_231_cortical-scrub", expectedCoreDamage: 1 },
      { ice: "onr_v1_254_liche", expectedCoreDamage: 3 },
    ] as const;

    for (const testCase of cases) {
      let state = toRunnerTurn(v161CardReleaseGame(`v161-${testCase.ice}`));
      putCorpIceOnServer(state, "rd", testCase.ice);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
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
          sourceDefinition(state, action) === testCase.ice,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      expect(state.run).toBeUndefined();
      expect(state.runner.coreDamage).toBe(testCase.expectedCoreDamage);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        result: "ended",
      });
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("V1.6.2 Mechanikpaket B", () => {
  it("adds a controlled V1.6.2 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|uninstall_runner_program|subtype_noisy/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_212_priority-requisition"]).toMatchObject({
      advancementRequirement: 5,
      agendaPoints: 3,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_215_security-net-optimization"],
    ).toMatchObject({ advancementRequirement: 5, agendaPoints: 3 });
    expect(DEMO_CARDS_BY_ID["onr_v1_317_data-masons"]).toMatchObject({
      rezCost: 1,
      trashCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_320_encoder-inc"]).toMatchObject({
      rezCost: 0,
      trashCost: 1,
      rulesText: expect.stringContaining("cost 1 less to rez"),
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_320_encoder-inc"]?.rulesText).toContain(
      "additional",
    );
    expect(
      DEMO_CARDS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
    ).toMatchObject({ rezCost: 0, trashCost: 2 });
  });

  it("validates V1.6.2 smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v162CardReleaseGame("v162-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_254_liche"]).toBeDefined();
  });

  it("projects Department of Truth Enhancement hosted credits as visible stored credits", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("department-stored-credit-display"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
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
    const hiddenRunnerView = getPlayerView(
      {
        ...state,
        cardInstances: {
          ...state.cardInstances,
          [departmentId]: {
            ...state.cardInstances[departmentId]!,
            faceup: false,
            rezzed: false,
            counters: { bit: 3 },
          },
        },
      },
      "runner",
    );
    expect(
      hiddenRunnerView.servers
        .find((server) => server.id === "remote_1")
        ?.root.find((card) => card.instanceId === departmentId)
        ?.counterDisplays,
    ).toBeUndefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_318_department-of-truth-enhancement" &&
        action.label.includes("3 Credits"),
    );

    const loadedCard = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "remote_1")
      ?.root.find((card) => card.instanceId === departmentId);
    expect(loadedCard?.counterDisplays).toEqual([
      expect.objectContaining({
        id: "stored_credits",
        amount: 3,
        displayKind: "stored_credits",
        counterType: "bit",
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      hostedCreditsAdded: 3,
      hostedCreditsAfter: 3,
    });

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_318_department-of-truth-enhancement" &&
        action.label.includes("Credits von der Karte"),
    );
    const emptiedCard = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "remote_1")
      ?.root.find((card) => card.instanceId === departmentId);
    expect(emptiedCard?.counterDisplays ?? []).toEqual([]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      hostedCreditsTaken: 3,
      hostedCreditsAfter: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("executes typed gain_credits card effects", () => {
    const state = createGameAfterSetup({ seed: "card-effect-gain-credits" });
    state.runner.credits = 5;
    state.corp.credits = 5;

    executeCardImplementationEffects(
      state,
      { sourceCardId: state.runner.identity, controller: "runner" },
      [
        {
          kind: "gain_credits",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    );
    expect(state.runner.credits).toBe(7);

    executeCardImplementationEffects(
      state,
      { sourceCardId: state.corp.identity, controller: "corp" },
      [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 3,
          visibility: "public",
        },
      ],
    );
    expect(state.corp.credits).toBe(8);

    const result = executeCardImplementationEffects(
      state,
      { sourceCardId: state.runner.identity, controller: "runner" },
      [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 4,
          visibility: "public",
        },
      ],
    );
    expect(state.runner.credits).toBe(11);
    expect(result.publicPayload).toMatchObject({
      gainedCredits: 4,
      runnerCreditsAfter: 11,
    });
    expect(result.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "gain_credits",
        visibility: "public",
        side: "runner",
        amount: 4,
        reason: "card_resolver",
      }),
    ]);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.runner.identity, controller: "runner" },
        [
          {
            kind: "gain_credits",
            recipient: "runner",
            amount: 0,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.runner.identity, controller: "runner" },
        [{ kind: "unknown_effect", visibility: "public" } as never],
      ),
    ).toThrow(/Unsupported card implementation effect/);
  });

  it("executes typed add_bad_publicity card effects with redacted source projection", () => {
    const state = createGameAfterSetup({ seed: "card-effect-add-bad-publicity" });
    state.corp.badPublicity = 4;

    const result = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "synthetic_hidden_source" as CardDefinitionId,
        sourceTitle: "Synthetic Hidden Source",
        controller: "corp",
      },
      [
        {
          kind: "add_bad_publicity",
          amount: 2,
          visibility: "public",
          sourceVisibility: "redacted",
        },
      ],
    );

    expect(state.corp.badPublicity).toBe(6);
    expect(result.publicPayload).toMatchObject({
      badPublicityAdded: 2,
      corpBadPublicityBefore: 4,
      corpBadPublicityAfter: 6,
      sourceVisibility: "redacted",
      redactedKind: "hidden_resource_source",
    });
    expect(result.publicPayload).not.toHaveProperty("sourceDefinitionId");
    expect(result.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "add_bad_publicity",
        visibility: "public",
        side: "corp",
        amount: 2,
        reason: "card_resolver",
        redactedKind: "hidden_resource_source",
      }),
    ]);
    expect(result.resolvedEffects[0]).not.toHaveProperty("sourceDefinitionId");
    expect(result.resolvedEffects[0]).not.toHaveProperty("sourceTitle");

    const publicContext = publicContextForAction(
      state,
      {
        actionId: "test_add_bad_publicity_redaction",
        type: "play_operation",
        side: "corp",
        label: "Synthetic source",
        source: state.corp.identity,
        timingPoint: state.timingPoint,
        costs: [],
        targetRequirements: [],
        visibility: "public",
        expiresAtStateVersion: state.stateVersion,
        payload: {
          sourceDefinitionId: "synthetic_hidden_source",
          ...result.publicPayload,
        },
        resolvedEffects: result.resolvedEffects,
      } as LegalAction,
      {
        agendaPointsForScoredCard: () => 0,
        cardCounter: () => 0,
        cardStrengthModifier: () => 0,
        creditCostForAction: () => 0,
        definitionFor: () =>
          DEMO_CARDS_BY_ID.simple_agenda ?? Object.values(DEMO_CARDS_BY_ID)[0]!,
        pumpAmountForLegalAction: () => 0,
        runnerHqAccessBonus: () => 0,
        v1915InstalledAccessBonus: () => 0,
      },
    );
    expect(publicContext).toMatchObject({
      badPublicityAdded: 2,
      corpBadPublicityBefore: 4,
      corpBadPublicityAfter: 6,
      sourceVisibility: "redacted",
      redactedKind: "hidden_resource_source",
    });
    expect(publicContext).not.toHaveProperty("sourceDefinitionId");

    const terminal = createGameAfterSetup({
      seed: "card-effect-add-bad-publicity-terminal",
    });
    terminal.corp.badPublicity = 6;
    executeCardImplementationEffects(
      terminal,
      { sourceCardId: terminal.corp.identity, controller: "corp" },
      [
        {
          kind: "add_bad_publicity",
          amount: 1,
          visibility: "public",
        },
      ],
    );
    checkWinConditions(terminal);
    expect(terminal.winner).toBe("runner");
    expect(terminal.gameEndReason).toBe("bad_publicity_7");
    expect(hashState(terminal)).toMatch(/^fnv1a:/);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "add_bad_publicity",
            amount: 0,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
  });

  it("executes typed lose_credits card effects", () => {
    const state = createGameAfterSetup({ seed: "card-effect-lose-credits" });
    state.runner.credits = 7;
    state.corp.credits = 5;

    const runnerResult = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "onr_v1_285_closed-accounts",
        sourceTitle: "Closed Accounts",
        controller: "corp",
      },
      [
        {
          kind: "lose_credits",
          recipient: "runner",
          mode: "all",
          visibility: "public",
        },
      ],
    );

    expect(state.runner.credits).toBe(0);
    expect(runnerResult.publicPayload).toMatchObject({
      creditsLost: 7,
      runnerCreditsAfter: 0,
    });
    expect(runnerResult.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "lose_credits",
        visibility: "public",
        side: "runner",
        amount: 7,
        reason: "card_resolver",
        sourceDefinitionId: "onr_v1_285_closed-accounts",
        sourceTitle: "Closed Accounts",
      }),
    ]);

    const corpResult = executeCardImplementationEffects(
      state,
      { sourceCardId: state.corp.identity, controller: "corp" },
      [
        {
          kind: "lose_credits",
          recipient: "controller",
          mode: "amount",
          amount: 9,
          visibility: "public",
        },
      ],
    );

    expect(state.corp.credits).toBe(0);
    expect(corpResult.publicPayload).toMatchObject({
      creditsLost: 5,
      corpCreditsAfter: 0,
    });

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "lose_credits",
            recipient: "runner",
            mode: "amount",
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/requires an amount/);
    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "lose_credits",
            recipient: "runner",
            mode: "all",
            visibility: "private_to_side",
          },
        ],
      ),
    ).toThrow(/visibility must be public/);
  });

  it("executes typed add_tags card effects", () => {
    const state = createGameAfterSetup({ seed: "card-effect-add-tags" });
    state.runner.tags = 1;

    const result = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "onr_v1_287_datapool-by-zetatech",
        sourceTitle: "Datapool® by Zetatech",
        controller: "corp",
      },
      [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    );

    expect(state.runner.tags).toBe(3);
    expect(result.publicPayload).toMatchObject({
      tagsAdded: 2,
      runnerTagsAfter: 3,
    });
    expect(result.resolvedEffects).toEqual([
      expect.objectContaining({
        effectId: "onr_v1_287_datapool-by-zetatech.effect.0.add_tags",
        kind: "add_tags",
        visibility: "public",
        side: "runner",
        amount: 2,
        reason: "card_resolver",
        runnerTagsAfter: 3,
        sourceDefinitionId: "onr_v1_287_datapool-by-zetatech",
        sourceTitle: "Datapool® by Zetatech",
      }),
    ]);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "add_tags",
            recipient: "runner",
            amount: 0,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
  });

  it("executes typed hosted-credit card effects through host primitives", () => {
    const state = createGameAfterSetup({ seed: "card-effect-hosted-credits" });
    const calls: string[] = [];

    const loadResult = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        sourceTitle: "BBS Whispering Campaign",
        controller: "corp",
        addHostedCredits: (sourceCardId, amount) => {
          calls.push(`add:${sourceCardId}:${amount}`);
          return {
            amount,
            hostedCreditsAfter: 16,
            publicPayload: {
              hostedCreditsAdded: amount,
              hostedCreditsAfter: 16,
            },
          };
        },
      },
      [
        {
          kind: "add_hosted_credits",
          target: "source",
          amount: 16,
          visibility: "public",
        },
      ],
    );

    expect(loadResult.publicPayload).toMatchObject({
      hostedCreditsAdded: 16,
      hostedCreditsAfter: 16,
    });
    expect(loadResult.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "add_hosted_credits",
        visibility: "public",
        amount: 16,
        reason: "card_resolver",
        sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        sourceTitle: "BBS Whispering Campaign",
      }),
    ]);

    const takeResult = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
        sourceTitle: "BBS Whispering Campaign",
        controller: "corp",
        takeHostedCredits: (sourceCardId, recipient, amount) => {
          calls.push(`take:${sourceCardId}:${recipient}:${amount}`);
          return {
            amount: 2,
            hostedCreditsAfter: 14,
            publicPayload: {
              hostedCreditsTaken: 2,
              hostedCreditsAfter: 14,
              gainedCredits: 2,
              corpCreditsAfter: 7,
            },
          };
        },
        trashSourceWhenEmpty: (sourceCardId) => {
          calls.push(`trash:${sourceCardId}`);
          return { sourceTrashed: false };
        },
      },
      [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 2,
          mode: "up_to_amount_if_available",
          visibility: "public",
        },
        {
          kind: "trash_source_when_empty",
          source: "source",
          visibility: "public",
        },
      ],
    );

    expect(takeResult.publicPayload).toMatchObject({
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 14,
      gainedCredits: 2,
      corpCreditsAfter: 7,
    });
    expect(takeResult.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "take_hosted_credits",
        visibility: "public",
        amount: 2,
        remainingCounters: 14,
        reason: "card_resolver",
        sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      }),
    ]);
    expect(calls).toEqual([
      `add:${state.corp.identity}:16`,
      `take:${state.corp.identity}:corp:2`,
      `trash:${state.corp.identity}`,
    ]);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "add_hosted_credits",
            target: "source",
            amount: 0,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/takeHostedCredits execution context/);
  });

  it("executes typed damage card effects through the host damage primitive", () => {
    const state = createGameAfterSetup({ seed: "card-effect-damage" });
    const calls: Array<{ damageType: string; amount: number }> = [];

    const result = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        sourceDefinitionId: "onr_v1_301_punitive-counterstrike",
        sourceTitle: "Punitive Counterstrike",
        controller: "corp",
        damageRunner: (damageType, amount) => {
          calls.push({ damageType, amount });
          return {
            resolved: true,
            damageType,
            amount,
            cardsTrashed: amount,
            flatline: false,
            publicPayload: {
              damageResolved: true,
              damageType,
              damageAmount: amount,
              cardsTrashed: amount,
              flatline: false,
            },
          };
        },
      },
      [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "meat",
          amount: 2,
          preventable: true,
          visibility: "public",
        },
      ],
    );

    expect(calls).toEqual([{ damageType: "meat", amount: 2 }]);
    expect(result.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "meat",
      damageAmount: 2,
      cardsTrashed: 2,
      flatline: false,
    });
    expect(result.resolvedEffects).toEqual([
      expect.objectContaining({
        effectId: "onr_v1_301_punitive-counterstrike.effect.0.damage",
        kind: "damage",
        visibility: "public",
        side: "runner",
        amount: 2,
        damageType: "meat",
        cardsTrashed: 2,
        reason: "card_resolver",
        sourceDefinitionId: "onr_v1_301_punitive-counterstrike",
        sourceTitle: "Punitive Counterstrike",
      }),
    ]);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.corp.identity, controller: "corp" },
        [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "meat",
            amount: 2,
            preventable: true,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/requires a damageRunner/);
    expect(() =>
      executeCardImplementationEffects(
        state,
        {
          sourceCardId: state.corp.identity,
          controller: "corp",
          damageRunner: (damageType, amount) => ({
            resolved: true,
            damageType,
            amount,
            cardsTrashed: 0,
            flatline: false,
          }),
        },
        [
          {
            kind: "damage",
            recipient: "runner",
            damageType: "meat",
            amount: 0,
            preventable: true,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
  });

  it("executes typed draw_cards card effects in declared order", () => {
    const state = createGameAfterSetup({ seed: "card-effect-draw-cards" });
    state.runner.credits = 5;
    state.corp.credits = 5;

    const drawCards = (
      side: "runner" | "corp",
      amount: number,
    ): { drawnCount: number; publicPayload: Record<string, number> } => {
      const source = side === "runner" ? state.runner.stack : state.corp.rd;
      const target = side === "runner" ? state.runner.grip : state.corp.hq;
      let drawnCount = 0;
      for (let index = 0; index < amount; index += 1) {
        const cardId = source.shift();
        if (!cardId) break;
        target.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: side === "runner"
            ? { side: "runner", zone: "grip" }
            : { side: "corp", zone: "hq" },
        };
        drawnCount += 1;
      }
      return {
        drawnCount,
        publicPayload:
          side === "runner" ? { drawnCount } : { drawnCards: drawnCount },
      };
    };

    const runnerGripBefore = state.runner.grip.length;
    const runnerResult = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.runner.identity,
        controller: "runner",
        drawCards,
      },
      [
        {
          kind: "draw_cards",
          recipient: "runner",
          amount: 2,
          visibility: "public",
        },
      ],
    );
    expect(state.runner.grip.length).toBe(runnerGripBefore + 2);
    expect(runnerResult.publicPayload).toMatchObject({ drawnCount: 2 });
    expect(runnerResult.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "draw_cards",
        visibility: "public",
        side: "runner",
        amount: 2,
        reason: "card_resolver",
      }),
    ]);

    const corpHqBefore = state.corp.hq.length;
    const corpResult = executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        controller: "corp",
        drawCards,
      },
      [
        {
          kind: "draw_cards",
          recipient: "corp",
          amount: 3,
          visibility: "public",
        },
      ],
    );
    expect(state.corp.hq.length).toBe(corpHqBefore + 3);
    expect(corpResult.publicPayload).toMatchObject({ drawnCards: 3 });

    const order: string[] = [];
    executeCardImplementationEffects(
      state,
      {
        sourceCardId: state.corp.identity,
        controller: "corp",
        drawCards: (side, amount) => {
          order.push(`${side}-draw-after-${state.corp.credits}`);
          return drawCards(side, amount);
        },
      },
      [
        {
          kind: "gain_credits",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
        {
          kind: "draw_cards",
          recipient: "controller",
          amount: 1,
          visibility: "public",
        },
      ],
    );
    expect(order).toEqual(["corp-draw-after-7"]);

    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.runner.identity, controller: "runner", drawCards },
        [
          {
            kind: "draw_cards",
            recipient: "runner",
            amount: 0,
            visibility: "public",
          },
        ],
      ),
    ).toThrow(/positive integer/);
    expect(() =>
      executeCardImplementationEffects(
        state,
        { sourceCardId: state.runner.identity, controller: "runner", drawCards },
        [
          {
            kind: "draw_cards",
            recipient: "runner",
            amount: 1,
            visibility: "private_to_side",
          },
        ],
      ),
    ).toThrow(/visibility must be public/);
  });

  it("applies Data Masons rez/strength modifiers and score-based Security Net strength", () => {
    let dataMasons = v162CardReleaseGame("v162-data-masons");
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    dataMasons.corp.credits = 30;
    dataMasons.corp.maxHandSize = 100;
    const dataMasonsId = putCorpRootInRemote(
      dataMasons,
      "onr_v1_317_data-masons",
    );
    const dataMasonsWallId = putCorpIceOnServer(
      dataMasons,
      "rd",
      "onr_v1_232_crystal-wall",
    );
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_317_data-masons",
    );
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) => action.type === "end_turn",
    );
    dataMasons = apply(
      dataMasons,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const wallRez = mustAction(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_232_crystal-wall",
    );
    expect(wallRez.costs[0]?.credits).toBe(2);
    const dataMasonsQuoteState = structuredClone(dataMasons);
    const dataMasonsQuoteHash = hashState(dataMasons);
    const dataMasonsQuote = quoteCorpRezCost(dataMasons, dataMasonsWallId);
    expect(dataMasons).toEqual(dataMasonsQuoteState);
    expect(hashState(dataMasons)).toBe(dataMasonsQuoteHash);
    expect(dataMasonsQuote.finalCredits).toBe(2);
    expect(dataMasonsQuote.modifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: dataMasonsId,
        sourceDefinitionId: "onr_v1_317_data-masons",
        amount: 2,
        kind: "reduction",
      }),
    ]);
    dataMasons = apply(
      dataMasons,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(dataMasons, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(dataMasons, "runner").run?.encounteredIce?.strength,
    ).toBe(4);

    let securityNet = v162CardReleaseGame("v162-security-net");
    securityNet = apply(
      securityNet,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    securityNet.corp.credits = 30;
    securityNet.corp.clicks = 10;
    securityNet.corp.maxHandSize = 100;
    moveCorpCardToHq(securityNet, "onr_v1_215_security-net-optimization");
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(securityNet, action) ===
          "onr_v1_215_security-net-optimization",
    );
    putCorpIceOnServer(securityNet, "rd", "onr_v1_232_crystal-wall");
    for (let index = 0; index < 5; index += 1) {
      securityNet = apply(
        securityNet,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(securityNet, action) ===
            "onr_v1_215_security-net-optimization",
      );
    }
    const securityNetAgendaId = Object.entries(securityNet.cardInstances).find(
      ([, instance]) =>
        instance.definitionId === "onr_v1_215_security-net-optimization" &&
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverRoot",
    )?.[0] as CardInstanceId | undefined;
    expect(securityNetAgendaId).toBeDefined();
    const securityNetAgendaZone =
      securityNet.cardInstances[securityNetAgendaId!]?.zone;
    expect(securityNetAgendaZone).toMatchObject({ zone: "serverRoot" });
    const securityNetAgendaServerId =
      securityNetAgendaZone?.zone === "serverRoot"
        ? securityNetAgendaZone.serverId
        : undefined;
    expect(securityNetAgendaServerId).not.toBe("rd");
    const securityNetScoreActions = getLegalActions(securityNet, "corp").filter(
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(securityNet, action) ===
          "onr_v1_215_security-net-optimization",
    );
    expect(securityNetScoreActions).toHaveLength(
      securityNet.corp.servers.length,
    );
    expect(
      securityNetScoreActions.map((action) => action.payload?.selectedServerId),
    ).toEqual(expect.arrayContaining(["rd", securityNetAgendaServerId]));
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(securityNet, action) ===
          "onr_v1_215_security-net-optimization" &&
        action.payload?.selectedServerId === "rd",
    );
    expect(
      securityNet.cardInstances[securityNetAgendaId!]?.selectedServerId,
    ).toBe("rd");
    expect(
      getPlayerView(securityNet, "corp").own.scoreArea.find(
        (card) => card.instanceId === securityNetAgendaId,
      ),
    ).toMatchObject({ selectedServerId: "rd", selectedServerLabel: "R&D" });
    expect(securityNet.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    securityNet = apply(
      securityNet,
      "corp",
      (action) => action.type === "end_turn",
    );
    securityNet = apply(
      securityNet,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    securityNet = apply(
      securityNet,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(securityNet, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(securityNet, "runner").run?.encounteredIce?.strength,
    ).toBe(4);
  });

  it("applies Data Masons ICE-strength modifiers only to rezzed walls", () => {
    const approachIce = (
      seed: string,
      serverId: "hq" | "rd",
      iceDefinitionId: string,
      rezzedDataMasons: boolean,
    ): GameState => {
      let state = v162CardReleaseGame(seed);
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state.corp.credits = 30;
      const dataMasonsId = putCorpRootInRemote(
        state,
        "onr_v1_317_data-masons",
      );
      state.cardInstances[dataMasonsId] = {
        ...state.cardInstances[dataMasonsId]!,
        faceup: rezzedDataMasons,
        rezzed: rezzedDataMasons,
      };
      putCorpIceOnServer(state, serverId, iceDefinitionId);
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === serverId,
      );
      return enterEncounterFromMovementWindow(
        passCorpApproachRezWindowIfOpen(
          apply(state, "corp", (action) => action.type === "rez_ice"),
        ),
      );
    };

    expect(
      getPlayerView(
        approachIce(
          "v162-data-masons-rd-wall-strength",
          "rd",
          "onr_v1_232_crystal-wall",
          true,
        ),
        "runner",
      ).run?.encounteredIce?.strength,
    ).toBe((DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength ?? 0) + 1);
    expect(
      getPlayerView(
        approachIce(
          "v162-data-masons-hq-wall-strength",
          "hq",
          "onr_v1_232_crystal-wall",
          true,
        ),
        "runner",
      ).run?.encounteredIce?.strength,
    ).toBe((DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength ?? 0) + 1);
    expect(
      getPlayerView(
        approachIce(
          "v162-data-masons-non-wall-strength",
          "rd",
          "onr_v1_230_cortical-scanner",
          true,
        ),
        "runner",
      ).run?.encounteredIce?.strength,
    ).toBe(DEMO_CARDS_BY_ID["onr_v1_230_cortical-scanner"]?.strength);
    expect(
      getPlayerView(
        approachIce(
          "v162-data-masons-unrezzed-strength",
          "rd",
          "onr_v1_232_crystal-wall",
          false,
        ),
        "runner",
      ).run?.encounteredIce?.strength,
    ).toBe(DEMO_CARDS_BY_ID["onr_v1_232_crystal-wall"]?.strength);
    expect(
      cardImplementationCoverageForDefinitionId("onr_v1_317_data-masons")
        ?.status,
    ).toBe("implemented");
  });

  it("reduces code-gate and black-ice rez costs and resolves Priority Requisition free rez deterministically", () => {
    let encoder = v162CardReleaseGame("v162-encoder");
    encoder = apply(
      encoder,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    encoder.corp.credits = 30;
    encoder.corp.maxHandSize = 100;
    const encoderId = putCorpRootInRemote(encoder, "onr_v1_320_encoder-inc");
    const codeGateId = putCorpIceOnServer(
      encoder,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    encoder = apply(
      encoder,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(encoder, action) === "onr_v1_320_encoder-inc",
    );
    encoder = apply(encoder, "corp", (action) => action.type === "end_turn");
    encoder = apply(
      encoder,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const codeGateRez = mustAction(
      encoder,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(encoder, action) === "onr_v1_230_cortical-scanner",
    );
    expect(codeGateRez.costs[0]?.credits).toBe(6);
    expect(quoteCorpRezCost(encoder, codeGateId).modifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: encoderId,
        sourceDefinitionId: "onr_v1_320_encoder-inc",
        amount: 1,
        kind: "reduction",
      }),
    ]);

    let skalderviken = v162CardReleaseGame("v162-skalderviken");
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    skalderviken.corp.credits = 30;
    skalderviken.corp.maxHandSize = 100;
    const skaldervikenId = putCorpRootInRemote(
      skalderviken,
      "onr_v1_341_skalderviken-sa-beta-test-site",
    );
    const blackIceId = putCorpIceOnServer(
      skalderviken,
      "hq",
      "onr_v1_231_cortical-scrub",
    );
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(skalderviken, action) ===
          "onr_v1_341_skalderviken-sa-beta-test-site",
    );
    skalderviken = apply(
      skalderviken,
      "corp",
      (action) => action.type === "end_turn",
    );
    skalderviken = apply(
      skalderviken,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const blackIceRez = mustAction(
      skalderviken,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(skalderviken, action) === "onr_v1_231_cortical-scrub",
    );
    expect(blackIceRez.costs[0]?.credits).toBe(5);
    expect(quoteCorpRezCost(skalderviken, blackIceId).modifiers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: skaldervikenId,
        sourceDefinitionId: "onr_v1_341_skalderviken-sa-beta-test-site",
        amount: 2,
        kind: "reduction",
      }),
    ]);

    let priority = v162CardReleaseGame("v162-priority-requisition");
    priority = apply(
      priority,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    priority.corp.credits = 30;
    priority.corp.clicks = 10;
    priority.corp.maxHandSize = 100;
    moveCorpCardToHq(priority, "onr_v1_212_priority-requisition");
    const highCostIceId = putCorpIceOnServer(
      priority,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    const lowerCostIceId = putCorpIceOnServer(
      priority,
      "hq",
      "onr_v1_232_crystal-wall",
    );
    priority = apply(
      priority,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(priority, action) ===
          "onr_v1_212_priority-requisition",
    );
    for (let index = 0; index < 5; index += 1) {
      priority = apply(
        priority,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(priority, action) ===
            "onr_v1_212_priority-requisition",
      );
    }
    priority = apply(
      priority,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(priority, action) ===
          "onr_v1_212_priority-requisition",
    );
    expect(priority.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(getPlayerView(priority, "runner").pendingChoice).toBeUndefined();
    priority = applyChoices(priority, "corp", [`card_${highCostIceId}`]);
    expect(priority.cardInstances[highCostIceId]?.rezzed).toBe(true);
    expect(priority.cardInstances[lowerCostIceId]?.rezzed).toBe(false);
    expect(priority.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v162_priority_requisition_free_rez",
      priorityRequisitionFreeRez: true,
      priorityRequisitionTargetDefinitionId: "onr_v1_230_cortical-scanner",
      rezCostPaid: 0,
    });
  });

  it("adds Encoder, Inc. end-the-run subroutines to rezzed code gates", () => {
    const approachIce = (
      seed: string,
      iceDefinitionId: string,
      rezzedEncoder: boolean,
    ): GameState => {
      let state = createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          cards: [
            ...ONR_V1_6_2_RUNNER_DECK.cards,
            { id: "simple_decoder", quantity: 1 },
          ],
        },
        corpDeck: ONR_V1_6_2_CORP_DECK,
        agendaPointsToWin: 7,
      });
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state.corp.credits = 30;
      state.runner.credits = 20;
      const encoderId = putCorpRootInRemote(state, "onr_v1_320_encoder-inc");
      state.cardInstances[encoderId] = {
        ...state.cardInstances[encoderId]!,
        faceup: rezzedEncoder,
        rezzed: rezzedEncoder,
      };
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          action.source === decoderId,
      );
      state.runner.credits = 20;
      state.runner.clicks = 4;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      return apply(state, "corp", (action) => action.type === "rez_ice");
    };
    const decoderBreakIndexes = (state: GameState): number[] =>
      getLegalActions(state, "runner")
        .filter(
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(state, action) === "simple_decoder",
        )
        .map((action) => Number(action.payload?.subroutineIndex))
        .sort((a, b) => a - b);
    const encoderInstanceId = (state: GameState): CardInstanceId => {
      const match = Object.entries(state.cardInstances).find(
        ([, instance]) => instance.definitionId === "onr_v1_320_encoder-inc",
      );
      if (!match) throw new Error("Missing Encoder, Inc. instance.");
      return match[0] as CardInstanceId;
    };

    const withEncoder = approachIce(
      "v162-encoder-additional-subroutine",
      "onr_v1_230_cortical-scanner",
      true,
    );
    const pumpedWithEncoder = apply(
      withEncoder,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(withEncoder, action) === "simple_decoder",
    );
    expect(decoderBreakIndexes(pumpedWithEncoder)).toEqual([0, 1, 2, 3]);
    const breakActions = getLegalActions(pumpedWithEncoder, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(pumpedWithEncoder, action) === "simple_decoder",
    );
    expect(breakActions.map((action) => action.payload?.subroutineId)).toEqual([
      "card_implementation.onr_v1_230_cortical-scanner.printed_subroutine.1.end_the_run",
      "card_implementation.onr_v1_230_cortical-scanner.printed_subroutine.2.end_the_run",
      "card_implementation.onr_v1_230_cortical-scanner.printed_subroutine.3.end_the_run",
      "card_implementation.onr_v1_320_encoder-inc.additional_subroutine.1.end_the_run",
    ]);
    expect(breakActions[3]?.payload).toMatchObject({
      dynamicSourceDefinitionId: "onr_v1_320_encoder-inc",
      dynamicSourceTitle: "Encoder, Inc.",
      dynamicSourceKind: "additional_subroutine",
      dynamicSubroutineKind: "end_the_run",
    });
    expect(JSON.stringify(breakActions[3]?.payload)).not.toContain(
      encoderInstanceId(pumpedWithEncoder),
    );
    expect(
      mustAction(
        pumpedWithEncoder,
        "runner",
        (action) => action.type === "continue_run",
      ).payload,
    ).toMatchObject({
      unbrokenSubroutineCount: 4,
      encounterWillEndRun: true,
    });

    const printedBreakState = apply(
      pumpedWithEncoder,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(printedBreakState.run?.brokenSubroutineIndexes).toContain(0);
    expect(printedBreakState.run?.brokenSubroutineIndexes).not.toContain(3);

    const dynamicBreakOnlyState = apply(
      pumpedWithEncoder,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.subroutineIndex === 3,
    );
    expect(dynamicBreakOnlyState.run?.brokenSubroutineIndexes).toContain(3);
    expect(dynamicBreakOnlyState.run?.brokenSubroutineIndexes).not.toContain(0);

    let staleBreakState = approachIce(
      "v162-encoder-additional-subroutine-stale-break",
      "onr_v1_230_cortical-scanner",
      true,
    );
    staleBreakState = apply(
      staleBreakState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(staleBreakState, action) === "simple_decoder",
    );
    const staleBreakAction = mustAction(
      staleBreakState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.subroutineIndex === 3,
    );
    const staleEncoderId = encoderInstanceId(staleBreakState);
    staleBreakState.cardInstances[staleEncoderId] = {
      ...staleBreakState.cardInstances[staleEncoderId]!,
      faceup: false,
      rezzed: false,
    };
    const staleCreditsBefore = staleBreakState.runner.credits;
    expect(() =>
      apply(
        staleBreakState,
        "runner",
        (action) => action.actionId === staleBreakAction.actionId,
      ),
    ).toThrow();
    expect(staleBreakState.runner.credits).toBe(staleCreditsBefore);

    let addedSubroutineUnbroken = pumpedWithEncoder;
    for (const subroutineIndex of [0, 1, 2]) {
      addedSubroutineUnbroken = apply(
        addedSubroutineUnbroken,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    addedSubroutineUnbroken = continueRunThroughMovementWindow(
      addedSubroutineUnbroken,
    );
    expect(addedSubroutineUnbroken.run).toBeUndefined();
    expect(
      addedSubroutineUnbroken.eventLog.at(-1)?.publicPayload.resolvedEffects,
    ).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "onr_v1_230_cortical-scanner",
        subroutineIndex: 3,
        subroutineType: "end_the_run",
        cardDefinitionId: "onr_v1_320_encoder-inc",
        cardTitle: "Encoder, Inc.",
        endedRun: true,
      }),
    ]);
    expect(
      JSON.stringify(addedSubroutineUnbroken.eventLog.at(-1)?.publicPayload),
    ).not.toContain(encoderInstanceId(addedSubroutineUnbroken));

    let addedSubroutineBroken = approachIce(
      "v162-encoder-additional-subroutine-broken",
      "onr_v1_230_cortical-scanner",
      true,
    );
    addedSubroutineBroken = apply(
      addedSubroutineBroken,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(addedSubroutineBroken, action) === "simple_decoder",
    );
    for (const subroutineIndex of [0, 1, 2, 3]) {
      addedSubroutineBroken = apply(
        addedSubroutineBroken,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    addedSubroutineBroken = continueRunThroughMovement(addedSubroutineBroken);
    expect(addedSubroutineBroken.run?.phase).toBe("access");

    const unrezzedEncoder = approachIce(
      "v162-encoder-unrezzed-no-additional-subroutine",
      "onr_v1_230_cortical-scanner",
      false,
    );
    const pumpedUnrezzedEncoder = apply(
      unrezzedEncoder,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(unrezzedEncoder, action) === "simple_decoder",
    );
    expect(decoderBreakIndexes(pumpedUnrezzedEncoder)).toEqual([0, 1, 2]);
    expect(
      mustAction(
        pumpedUnrezzedEncoder,
        "runner",
        (action) => action.type === "continue_run",
      ).payload?.unbrokenSubroutineCount,
    ).toBe(3);

    const nonCodeGate = approachIce(
      "v162-encoder-non-code-gate-no-additional-subroutine",
      "onr_v1_231_cortical-scrub",
      true,
    );
    expect(decoderBreakIndexes(nonCodeGate)).toEqual([]);
    expect(
      mustAction(nonCodeGate, "runner", (action) => action.type === "continue_run")
        .payload?.unbrokenSubroutineCount,
    ).toBe(2);
  });

  it("adds Tesseract pay-or-end-the-run subroutines only to ICE on its fort", () => {
    const approachIce = (
      seed: string,
      targetServerId: "remote_1" | "rd",
      rezzedTesseract: boolean,
    ): GameState => {
      let state = createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          cards: [
            ...ONR_V1_6_2_RUNNER_DECK.cards,
            { id: "simple_decoder", quantity: 1 },
          ],
        },
        corpDeck: {
          ...ONR_V1_6_2_CORP_DECK,
          cards: [
            ...ONR_V1_6_2_CORP_DECK.cards,
            {
              id: "onr_v1_370_tesseract-fort-construction",
              quantity: 1,
            },
          ],
        },
        agendaPointsToWin: 7,
      });
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state.corp.credits = 30;
      state.runner.credits = 20;
      const tesseractId = putCorpRootInRemote(
        state,
        "onr_v1_370_tesseract-fort-construction",
      );
      state.cardInstances[tesseractId] = {
        ...state.cardInstances[tesseractId]!,
        faceup: rezzedTesseract,
        rezzed: rezzedTesseract,
      };
      putCorpIceOnServer(state, targetServerId, "onr_v1_230_cortical-scanner");
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          action.source === decoderId,
      );
      state.runner.credits = 20;
      state.runner.clicks = 4;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === targetServerId,
      );
      return enterEncounterFromMovementWindow(
        passCorpApproachRezWindowIfOpen(
          apply(state, "corp", (action) => action.type === "rez_ice"),
        ),
      );
    };
    const pumpAndBreakPrinted = (state: GameState): GameState => {
      let next = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) === "simple_decoder",
      );
      for (const subroutineIndex of [0, 1, 2]) {
        next = apply(
          next,
          "runner",
          (action) =>
            action.type === "break_subroutine" &&
            sourceDefinition(next, action) === "simple_decoder" &&
            action.payload?.subroutineIndex === subroutineIndex,
        );
      }
      return next;
    };

    const withTesseract = pumpAndBreakPrinted(
      approachIce("p310-tesseract-pay", "remote_1", true),
    );
    const breakActions = getLegalActions(withTesseract, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(withTesseract, action) === "simple_decoder",
    );
    expect(breakActions.map((action) => action.payload?.subroutineIndex)).toEqual([
      3,
    ]);
    expect(breakActions[0]?.payload).toMatchObject({
      subroutineId:
        "card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
      dynamicSourceDefinitionId: "onr_v1_370_tesseract-fort-construction",
      dynamicSourceTitle: "Tesseract Fort Construction",
      dynamicSourceKind: "additional_subroutine",
      dynamicSubroutineKind: "end_the_run_unless_runner_pays",
    });
    const payContinue = mustAction(
      withTesseract,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.costs[0]?.credits === 1 &&
        action.payload?.encounterWillEndRun === false,
    );
    expect(payContinue.payload).toMatchObject({
      payOrEndRunSubroutineIndexes: "3",
      payOrEndRunSubroutinePayment: 1,
    });
    const publicTesseractId = Object.entries(withTesseract.cardInstances).find(
      ([, instance]) =>
        instance.definitionId === "onr_v1_370_tesseract-fort-construction",
    )?.[0];
    expect(publicTesseractId).toBeDefined();
    expect(JSON.stringify(payContinue.payload)).not.toContain(
      publicTesseractId!,
    );
    let paid = apply(
      withTesseract,
      "runner",
      (action) => action.actionId === payContinue.actionId,
    );
    const paidPayload = paid.eventLog.at(-1)?.publicPayload;
    paid = enterEncounterFromMovementWindow(paid);
    expect(paid.run?.phase).toBe("access");
    expect(paid.runner.credits).toBe(withTesseract.runner.credits - 1);
    expect(paidPayload?.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "onr_v1_230_cortical-scanner",
        subroutineIndex: 3,
        subroutineType: "end_the_run_unless_runner_pays",
        cardDefinitionId: "onr_v1_370_tesseract-fort-construction",
        cardTitle: "Tesseract Fort Construction",
        paidCredits: 1,
      }),
    ]);

    const refusing = pumpAndBreakPrinted(
      approachIce("p310-tesseract-refuse", "remote_1", true),
    );
    const refuseContinue = mustAction(
      refusing,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.costs.length === 0 &&
        action.payload?.encounterWillEndRun === true,
    );
    expect(refuseContinue.payload).toMatchObject({
      unbrokenSubroutineCount: 1,
      encounterSubroutineIds:
        "card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
    });
    const refused = apply(
      refusing,
      "runner",
      (action) => action.actionId === refuseContinue.actionId,
    );
    expect(refused.run).toBeUndefined();
    expect(refused.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        subroutineIndex: 3,
        subroutineType: "end_the_run_unless_runner_pays",
        paidCredits: 0,
        endedRun: true,
      }),
    ]);

    const otherFort = pumpAndBreakPrinted(
      approachIce("p310-tesseract-other-fort", "rd", true),
    );
    expect(
      mustAction(otherFort, "runner", (action) => action.type === "continue_run")
        .payload?.unbrokenSubroutineCount,
    ).toBe(0);

    const unrezzed = pumpAndBreakPrinted(
      approachIce("p310-tesseract-unrezzed", "remote_1", false),
    );
    expect(
      mustAction(unrezzed, "runner", (action) => action.type === "continue_run")
        .payload?.unbrokenSubroutineCount,
    ).toBe(0);

    const stale = structuredClone(withTesseract);
    const tesseractId = Object.entries(stale.cardInstances).find(
      ([, instance]) =>
        instance.definitionId === "onr_v1_370_tesseract-fort-construction",
    )?.[0] as CardInstanceId | undefined;
    expect(tesseractId).toBeDefined();
    stale.cardInstances[tesseractId!] = {
      ...stale.cardInstances[tesseractId!]!,
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "runner",
        actionId: payContinue.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "p310-tesseract-stale",
      }).ok,
    ).toBe(false);
  });

  it("does not resolve Tesseract after Crystal Wall has already ended the run", () => {
    let state = createGameAfterSetup({
      seed: "p310-tesseract-crystal-wall-single-etr-log",
      runnerDeck: ONR_V1_6_2_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_6_2_CORP_DECK,
        cards: [
          { id: "onr_v1_232_crystal-wall", quantity: 1 },
          { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
          { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
          ...ONR_V1_6_2_CORP_DECK.cards.filter(
            (card) =>
              card.id !== "onr_v1_232_crystal-wall" &&
              card.id !== "onr_v1_355_crystal-palace-station-grid" &&
              card.id !== "onr_v1_370_tesseract-fort-construction",
          ),
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 30;
    state.runner.credits = 10;
    for (const upgradeId of [
      putCorpRootInRemote(state, "onr_v1_355_crystal-palace-station-grid"),
      putCorpRootInRemote(state, "onr_v1_370_tesseract-fort-construction"),
    ]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    const crystalWallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_232_crystal-wall",
    );
    state.cardInstances[crystalWallId] = {
      ...state.cardInstances[crystalWallId]!,
      faceup: true,
      rezzed: true,
    };
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(state.timingPoint).toBe("run.encounter_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    const resolvedEffects = state.eventLog.at(-1)?.publicPayload
      .resolvedEffects;
    expect(resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "onr_v1_232_crystal-wall",
        sourceTitle: "Crystal Wall",
        subroutineIndex: 0,
        subroutineType: "end_the_run",
        endedRun: true,
      }),
    ]);
    expect(JSON.stringify(resolvedEffects)).not.toContain(
      "Tesseract Fort Construction",
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });
});

describe("V1.6.3 Mechanikpaket C", () => {
  it("adds a controlled V1.6.3 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_3_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|recurring_credit/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_233_d-arc-knight"]).toMatchObject({
      rezCost: 6,
      strength: 2,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_267_sentinels-prime"]).toMatchObject({
      rezCost: 8,
      strength: 4,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_273_triggerman"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_350_antiquated-interface-routines"],
    ).toMatchObject({ rezCost: 2, trashCost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_371_tokyo-chiba-infighting"]).toMatchObject(
      { rezCost: 0, trashCost: 6 },
    );
  });

  it("validates V1.6.3 smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v163CardReleaseGame("v163-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      DEMO_CARDS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
    ).toBeDefined();
  });

  it("resolves trash-program ICE subroutines deterministically and replay-safe", () => {
    const cases = [
      "onr_v1_233_d-arc-knight",
      "onr_v1_267_sentinels-prime",
      "onr_v1_273_triggerman",
    ] as const;

    for (const iceDefinitionId of cases) {
      let state = toRunnerTurn(
        v163CardReleaseGame(`v163-trash-${iceDefinitionId}`),
      );
      installRunnerProgramForTest(state, "onr_v1_014_codecracker");
      const installedProgramId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
      );
      expect(installedProgramId).toBeDefined();
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.run).toBeUndefined();
      if (installedProgramId) {
        expect(state.runner.rig.programs).not.toContain(installedProgramId);
        expect(state.runner.heap).toContain(installedProgramId);
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("offers HQ and R&D root install targets for Antiquated Interface Routines", () => {
    const centralRootCorpDeck: DeckDefinition = {
      ...ONR_V1_6_3_CORP_DECK,
      id: "onr_v1_corp_v163_central_root_install",
      cards: [
        ...ONR_V1_6_3_CORP_DECK.cards,
        { id: "simple_agenda", quantity: 1 },
        { id: "simple_economy_asset", quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "v163-antiquated-central-root-install",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: ONR_V1_6_3_RUNNER_DECK,
      corpDeck: centralRootCorpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    const upgradeId = moveCorpCardToHq(
      state,
      "onr_v1_350_antiquated-interface-routines",
    );
    const agendaId = moveCorpCardToHq(state, "simple_agenda");
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    const upgradeTargets = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === upgradeId &&
          action.payload?.placement === "root",
      )
      .map((action) => action.payload?.serverId)
      .sort();
    const agendaTargets = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === agendaId &&
        (action.payload?.serverId === "hq" || action.payload?.serverId === "rd"),
    );
    const assetTargets = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === assetId &&
        (action.payload?.serverId === "hq" || action.payload?.serverId === "rd"),
    );

    expect(upgradeTargets).toEqual(
      expect.arrayContaining(["new_remote", "hq", "rd"]),
    );
    expect(upgradeTargets).not.toContain("archives");
    expect(agendaTargets).toEqual([]);
    expect(assetTargets).toEqual([]);

    const hqInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.serverId === "hq" &&
        action.payload?.placement === "root",
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: hqInstall.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "v163-antiquated-central-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: hqInstall.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: "v163-antiquated-central-stale",
      }).ok,
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === hqInstall.actionId,
    );
    expect(
      state.corp.servers.find((server) => server.id === "hq")?.root,
    ).toContain(upgradeId);
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "hq")
        ?.root[0]?.definitionId,
    ).toBe("onr_v1_350_antiquated-interface-routines");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Antiquated Interface Routines",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.rootRez === true,
    );
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Antiquated Interface Routines",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let rdState = v163CardReleaseGame("v163-antiquated-rd-root-install");
    rdState = apply(
      rdState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rdState.corp.credits = 40;
    rdState.corp.clicks = 3;
    const rdUpgradeId = moveCorpCardToHq(
      rdState,
      "onr_v1_350_antiquated-interface-routines",
    );
    rdState = apply(
      rdState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === rdUpgradeId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "root",
    );
    expect(
      rdState.corp.servers.find((server) => server.id === "rd")?.root,
    ).toContain(rdUpgradeId);
  });

  it("applies Antiquated Interface strength and Tokyo-Chiba unsuccessful-run credit on its fort", () => {
    let strengthState = v163CardReleaseGame("v163-antiquated-strength");
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    strengthState.corp.credits = 40;
    strengthState.corp.maxHandSize = 100;
    putCorpRootInRemote(
      strengthState,
      "onr_v1_350_antiquated-interface-routines",
    );
    putCorpIceOnServer(strengthState, "remote_1", "onr_v1_232_crystal-wall");
    putCorpIceOnServer(strengthState, "rd", "onr_v1_233_d-arc-knight");
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) ===
          "onr_v1_350_antiquated-interface-routines",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "end_turn",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(4);
    strengthState = apply(
      strengthState,
      "runner",
      (action) => action.type === "continue_run",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_233_d-arc-knight",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(2);

    let tokyoState = v163CardReleaseGame("v163-tokyo-bonus");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    tokyoState.corp.credits = 40;
    tokyoState.corp.maxHandSize = 100;
    tokyoState.corp.clicks = 10;
    moveCorpCardToHq(tokyoState, "onr_v1_371_tokyo-chiba-infighting");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting",
    );
    const firstRegionId = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.find(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      );
    expect(firstRegionId).toBeDefined();
    if (firstRegionId) {
      expect(tokyoState.cardInstances[firstRegionId]?.rezzed).toBe(true);
      expect(tokyoState.cardInstances[firstRegionId]?.faceup).toBe(true);
    }
    const secondRegionId =
      Object.entries(tokyoState.cardInstances).find(
        ([id, card]) =>
          card.definitionId === "onr_v1_371_tokyo-chiba-infighting" &&
          id !== firstRegionId,
      )?.[0] ?? "";
    expect(secondRegionId).not.toBe("");
    if (secondRegionId) {
      removeEverywhere(tokyoState, secondRegionId);
      tokyoState.corp.hq.unshift(secondRegionId);
      tokyoState.cardInstances[secondRegionId] = {
        ...tokyoState.cardInstances[secondRegionId]!,
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      };
    }
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting" &&
        action.payload?.serverId === "remote_1",
    );
    if (firstRegionId) {
      expect(tokyoState.corp.archives).toContain(firstRegionId);
    }
    const regionCountInRemote = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.filter(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      ).length;
    expect(regionCountInRemote).toBe(1);
    putCorpIceOnServer(tokyoState, "remote_1", "onr_v1_233_d-arc-knight");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "end_turn",
    );
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tokyoState, action) === "onr_v1_233_d-arc-knight",
    );
    const creditsBeforeContinue = tokyoState.corp.credits;
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tokyoState.run).toBeUndefined();
    expect(tokyoState.corp.credits).toBe(creditsBeforeContinue + 2);
    expect(tokyoState.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 2,
          reason: "unsuccessful_run",
          sourceDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
          sourceTitle: "Tokyo-Chiba Infighting",
          serverId: "remote_1",
          serverLabel: "Remote 1",
        }),
      ]),
    );
  });
});

describe("V1.7.0 Mechanikpaket D", () => {
  it("adds a controlled V1.7.0 core card set with subtype, hosting, recurring and unique gates", () => {
    expect(ONR_V1_7_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /search|arrange|shuffle|trace_windowing|run_lock|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_011_cloak"]).toMatchObject({
      installCost: 7,
      memoryCost: 1,
      recurringCredits: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_036_jackhammer"]).toMatchObject({
      installCost: 1,
      memoryCost: 1,
      strength: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_069_succubus"]).toMatchObject({
      installCost: 3,
      memoryCost: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_163_floating-runner-bbs"]).toMatchObject({
      installCost: 6,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_180_smiths-pawnshop"]?.subtypes).toContain(
      "unique",
    );
    expect(DEMO_CARDS_BY_ID["onr_v1_021_dwarf"]?.subtypes).toContain("worm");
    expect(DEMO_CARDS_BY_ID["onr_v1_074_worm"]?.subtypes).toContain("worm");
  });

  it("validates V1.7.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v170CardReleaseGame("v170-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_371_tokyo-chiba-infighting"]).toBeDefined();
  });

  it("hosts programs on Succubus without MU cost and trashes hosted programs when the daemon is trashed", () => {
    let state = toRunnerTurn(v170CardReleaseGame("v170-succubus-hosting"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_069_succubus");
    moveRunnerCardToGrip(state, "onr_v1_036_jackhammer");
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
    if (!succubusId) throw new Error("Missing installed Succubus");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_036_jackhammer" &&
        action.payload?.hostOnCardId === succubusId,
    );
    const hostedJackhammerId = String(hostedInstall.payload?.cardId ?? "");
    expect(hostedJackhammerId).not.toBe("");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    expect(state.cardInstances[hostedJackhammerId]?.hostedOn).toBe(succubusId);
    expect(state.runner.memoryUsed).toBe(1);

    putCorpIceOnServer(state, "rd", "onr_v1_233_d-arc-knight");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 40;
    state.runner.credits = 20;
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
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    if (succubusId) {
      expect(state.runner.rig.programs).not.toContain(succubusId);
      expect(state.runner.heap).toContain(succubusId);
    }
    if (hostedJackhammerId) {
      expect(state.runner.rig.programs).not.toContain(hostedJackhammerId);
      expect(state.runner.heap).toContain(hostedJackhammerId);
    }
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses stealth recurring credits for non-noisy breakers and blocks them for noisy breakers", () => {
    let noisyState = toRunnerTurn(
      v170CardReleaseGame("v170-noisy-stealth-block"),
    );
    noisyState.runner.credits = 30;
    moveRunnerCardToGrip(noisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(noisyState, "onr_v1_036_jackhammer");
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_011_cloak",
    );
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_036_jackhammer",
    );
    const jackhammerId = noisyState.runner.rig.programs.find(
      (id) =>
        noisyState.cardInstances[id]?.definitionId === "onr_v1_036_jackhammer",
    );
    noisyState.runner.credits = 0;
    putCorpIceOnServer(noisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(noisyState, "simple_economy_operation");
    noisyState.corp.credits = 40;
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noisyState = apply(
      noisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(noisyState, action) === "onr_v1_232_crystal-wall",
    );
    const noisyPump = getLegalActions(noisyState, "runner").find(
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === jackhammerId,
    );
    expect(noisyPump).toBeUndefined();

    let nonNoisyState = toRunnerTurn(
      v170CardReleaseGame("v170-nonnoisy-stealth-allowed"),
    );
    nonNoisyState.runner.credits = 30;
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_021_dwarf");
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_011_cloak",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_021_dwarf",
    );
    const cloakId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const dwarfId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    nonNoisyState.runner.credits = 0;
    putCorpIceOnServer(nonNoisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(nonNoisyState, "simple_economy_operation");
    nonNoisyState.corp.credits = 40;
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_232_crystal-wall",
    );
    const nonNoisyPump = mustAction(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "pump_breaker" && action.payload?.breakerId === dwarfId,
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) => action.actionId === nonNoisyPump.actionId,
    );
    if (cloakId) {
      expect(
        nonNoisyState.cardInstances[cloakId]?.counters?.bit,
      ).toBe(2);
      expect(
        getPlayerView(nonNoisyState, "runner").own.rig?.find(
          (card) => card.instanceId === cloakId,
        )?.counters?.bit,
      ).toBe(2);
    }
  });

  it("enforces unique deck/install rules and resolves Smith's Pawnshop start-of-turn choice with Floating Runner BBS income", () => {
    const invalidUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_invalid",
      name: "O:NR V1.7.0 Unique Invalid",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 5 },
      ],
    };
    const invalidValidation = validateDeckDefinition(invalidUniqueDeck, {
      expectedSide: "runner",
    });
    expect(invalidValidation.ok).toBe(false);
    expect(invalidValidation.errors.join(" ")).toMatch(/unique card/i);

    const runtimeUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_runtime",
      name: "O:NR V1.7.0 Unique Runtime",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 6 },
      ],
    };
    let uniqueState = createGameAfterSetup({
      seed: "v170-unique-runtime",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: runtimeUniqueDeck,
      corpDeck: ONR_V1_7_0_CORP_DECK,
      agendaPointsToWin: 7,
    });
    uniqueState = toRunnerTurn(uniqueState);
    uniqueState.runner.credits = 10;
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    uniqueState = apply(
      uniqueState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    const duplicateInstall = getLegalActions(uniqueState, "runner").find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    expect(duplicateInstall).toBeUndefined();

    let smithState = toRunnerTurn(v170CardReleaseGame("v170-smith-floating"));
    smithState.runner.credits = 20;
    moveRunnerCardToGrip(smithState, "onr_v1_163_floating-runner-bbs");
    moveRunnerCardToGrip(smithState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(smithState, "onr_v1_028_force-shield");
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) ===
          "onr_v1_163_floating-runner-bbs",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_180_smiths-pawnshop",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_028_force-shield",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) => action.type === "end_turn",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "end_turn",
    );
    if (
      smithState.pendingChoice?.source === "discard_phase" &&
      smithState.pendingChoice.side === "corp"
    ) {
      smithState = applyChoice(
        smithState,
        "corp",
        String(smithState.pendingChoice.options[0]?.id),
      );
    }
    expect(
      smithState.pendingChoice?.source.startsWith("v170.smiths_pawnshop"),
    ).toBe(true);
    expect(smithState.pendingChoice?.prompt).toContain("2 Credits");
    const forceShieldOption =
      smithState.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" &&
          smithState.cardInstances[option.value]?.definitionId ===
            "onr_v1_028_force-shield",
      )?.id ?? "pass";
    smithState = applyChoice(smithState, "runner", forceShieldOption);
    expect(
      smithState.runner.heap.some(
        (id) =>
          smithState.cardInstances[id]?.definitionId ===
          "onr_v1_028_force-shield",
      ),
    ).toBe(true);
    expect(smithState.runner.credits).toBe(15);
    expect(smithState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_180_smiths-pawnshop",
      smithsPawnshopTriggered: true,
      trashedCardDefinitionId: "onr_v1_028_force-shield",
      trashedCardTitle: "Force Shield",
      creditsGained: 2,
      gainedCredits: 2,
    });
  });
});

describe("V1.7.1 Mechanikpaket E", () => {
  it("adds a controlled V1.7.1 core card set for search, access replacement and HQ multiaccess", () => {
    expect(ONR_V1_7_1_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_114_temple-microcode-outlet"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_106_private-ldl-access"]).toMatchObject({
      cost: 0,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_118_weather-to-finance-pipe"],
    ).toMatchObject({ cost: 0 });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_084_edited-shipping-manifests"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_129_hq-interface"]).toMatchObject({
      installCost: 4,
    });
  });

  it("validates V1.7.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v171CardReleaseGame("v171-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_180_smiths-pawnshop"]).toBeDefined();
  });

  it("resolves Temple Microcode Outlet as hidden-zone stack search and deterministic shuffle", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-temple-search"));
    state.runner.credits = 20;
    const templeId = moveRunnerCardToGrip(
      state,
      "onr_v1_114_temple-microcode-outlet",
    );
    const selectedProgram = putRunnerCardOnTopOfStack(
      state,
      "onr_v1_036_jackhammer",
    );
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === templeId &&
        sourceDefinition(state, action) ===
          "onr_v1_114_temple-microcode-outlet",
    );
    expect(state.pendingChoice?.source.startsWith("p3_37.search_stack_to_grip")).toBe(
      true,
    );

    const selectedOption =
      state.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" && option.value === selectedProgram,
      )?.id ?? "";
    expect(selectedOption).not.toBe("");
    state = applyChoice(state, "runner", selectedOption);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      publicRevealDefinitionId: "onr_v1_036_jackhammer",
    });
  });

  it("runs Private LDL Access on HQ and accesses R&D instead", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-private-ldl-access"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_106_private-ldl-access");
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    const hqOperationId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqOperationId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_106_private-ldl-access" &&
        action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      title: "Hostile Takeover",
      serverLabel: "R&D",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.run).toBeUndefined();
    expect(state.corp.hq).toContain(hqOperationId);
  });

  it("runs P3.32 CardImplementation multiaccess events on their printed central servers", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("p3-32-custodial"));
    rdState.runner.credits = 20;
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_297_overtime-incentives");
    putCorpCardOnTopOfRd(rdState, "onr_v1_306_trojan-horse");

    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rdState, action) ===
          "onr_v1_081_custodial-position" &&
        action.payload?.serverId === "rd",
    );

    expect(rdState.run?.breach?.serverId).toBe("rd");
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      baseAccessCount: 3,
      effectiveAccessCount: 3,
    });

    let hqState = toRunnerTurn(v123CardReleaseGame("p3-32-wiretaps"));
    hqState.runner.credits = 20;
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const hqIds = [
      moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover"),
      moveCorpCardToHq(hqState, "onr_v1_297_overtime-incentives"),
      moveCorpCardToHq(hqState, "onr_v1_306_trojan-horse"),
    ];
    keepOnlyCorpHqCards(hqState, hqIds);

    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" &&
        action.payload?.serverId === "hq",
    );

    expect(hqState.run?.breach?.serverId).toBe("hq");
    expect(hqState.run?.breach?.queue.filter((entry) => entry.zone === "hq")).toHaveLength(3);
    expect(hqState.eventLog.at(-1)?.publicPayload).toMatchObject({
      baseAccessCount: 3,
      effectiveAccessCount: 3,
    });
  });

  it("applies successful-run replacement effects for Weather-to-Finance Pipe and Edited Shipping Manifests", () => {
    let weatherState = toRunnerTurn(v171CardReleaseGame("v171-weather-pipe"));
    weatherState.runner.credits = 20;
    weatherState.corp.credits = 10;
    moveRunnerCardToGrip(weatherState, "onr_v1_118_weather-to-finance-pipe");
    weatherState = apply(
      weatherState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(weatherState, action) ===
          "onr_v1_118_weather-to-finance-pipe" &&
        action.payload?.serverId === "hq",
    );
    expect(weatherState.run).toBeUndefined();
    expect(weatherState.corp.credits).toBe(6);
    expect(weatherState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
    });

    let manifestsState = toRunnerTurn(
      v171CardReleaseGame("v171-edited-shipping"),
    );
    manifestsState.runner.credits = 20;
    manifestsState.corp.credits = 8;
    moveRunnerCardToGrip(
      manifestsState,
      "onr_v1_084_edited-shipping-manifests",
    );
    const runnerCreditsBefore = manifestsState.runner.credits;
    const corpHqBefore = manifestsState.corp.hq.length;
    const corpRdBefore = manifestsState.corp.rd.length;
    manifestsState = apply(
      manifestsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(manifestsState, action) ===
          "onr_v1_084_edited-shipping-manifests" &&
        action.payload?.serverId === "hq",
    );
    expect(manifestsState.run).toBeUndefined();
    expect(manifestsState.corp.credits).toBe(7);
    expect(manifestsState.runner.tags).toBe(1);
    expect(manifestsState.runner.credits).toBe(runnerCreditsBefore - 1 + 10);
    expect(manifestsState.corp.hq.length).toBe(corpHqBefore);
    expect(manifestsState.corp.rd.length).toBe(corpRdBefore);
    expect(manifestsState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      creditLoss: 1,
      tagsAdded: 1,
      gainedCredits: 10,
    });

    let noCreditsState = toRunnerTurn(
      v171CardReleaseGame("v171-edited-shipping-no-corp-credits"),
    );
    noCreditsState.runner.credits = 20;
    noCreditsState.corp.credits = 0;
    moveRunnerCardToGrip(
      noCreditsState,
      "onr_v1_084_edited-shipping-manifests",
    );
    const hqCardId = moveCorpCardToHq(noCreditsState, "simple_economy_operation");
    keepOnlyCorpHqCard(noCreditsState, hqCardId);
    noCreditsState = apply(
      noCreditsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(noCreditsState, action) ===
          "onr_v1_084_edited-shipping-manifests" &&
        action.payload?.serverId === "hq",
    );
    expect(noCreditsState.run?.breach?.serverId).toBe("hq");
    expect(noCreditsState.runner.tags).toBe(0);
    expect(noCreditsState.runner.credits).toBe(19);
    expect(noCreditsState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "accessReplacement",
    );
  });

  it("uses P3.32 free-trash run events only for accessed cards from the printed central", () => {
    let kilroyState = toRunnerTurn(v192CardReleaseGame("p3-32-kilroy"));
    kilroyState.runner.credits = 20;
    moveRunnerCardToGrip(kilroyState, "onr_v1_096_kilroy-was-here");
    putCorpCardOnTopOfRd(kilroyState, "simple_economy_operation");
    kilroyState = apply(
      kilroyState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(kilroyState, action) ===
          "onr_v1_096_kilroy-was-here" &&
        action.payload?.serverId === "rd",
    );
    kilroyState = apply(
      kilroyState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      getLegalActions(kilroyState, "runner").find(
        (action) => action.type === "trash_accessed_card",
      )?.payload,
    ).toMatchObject({
      freeAccessTrash: true,
      accessTrashCostOverride: 0,
    });

    let rompState = toRunnerTurn(v192CardReleaseGame("p3-32-romp"));
    rompState.runner.credits = 20;
    moveRunnerCardToGrip(rompState, "onr_v1_107_romp-through-hq");
    const hqCardId = moveCorpCardToHq(rompState, "simple_economy_operation");
    keepOnlyCorpHqCard(rompState, hqCardId);
    rompState = apply(
      rompState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rompState, action) === "onr_v1_107_romp-through-hq" &&
        action.payload?.serverId === "hq",
    );
    rompState = apply(
      rompState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      getLegalActions(rompState, "runner").find(
        (action) => action.type === "trash_accessed_card",
      )?.payload,
    ).toMatchObject({
      freeAccessTrash: true,
      accessTrashCostOverride: 0,
    });
  });

  it("grants one additional HQ access per installed HQ Interface", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-hq-interface"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_129_hq-interface");
    const firstHqCard = moveCorpCardToHq(state, "simple_economy_operation");
    const secondHqCard = moveCorpCardToHq(state, "onr_v1_295_night-shift");
    keepOnlyCorpHqCards(state, [firstHqCard, secondHqCard]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_129_hq-interface",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );

    expect(state.run?.breach?.serverId).toBe("hq");
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(state.run?.accessCount).toBe(1);
  });
});

describe("V1.7.2 Mechanikpaket F", () => {
  it("adds a controlled V1.7.2 core card set for trace, tag-resource interaction and runner resource actions", () => {
    expect(ONR_V1_7_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_283_audit-of-call-records"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_284_chance-observation"]).toMatchObject({
      cost: 2,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_286_corporate-detective-agency"],
    ).toMatchObject({ cost: 1 });
    expect(DEMO_CARDS_BY_ID["onr_v1_158_danshis-second-id"]).toMatchObject({
      installCost: 0,
    });
    expect(
      DEMO_CARDS_BY_ID["onr_v1_179_silicon-saloon-franchise"],
    ).toMatchObject({ installCost: 8 });
  });

  it("validates V1.7.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v172CardReleaseGame("v172-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_129_hq-interface"]).toBeDefined();
  });

  it("gates Chance Observation and Audit of Call Records by runner run attempts of the previous turn", () => {
    let oneAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-one-attempt-gate"),
    );
    oneAttemptState.runner.credits = 30;
    oneAttemptState.corp.credits = 30;
    moveCorpCardToHq(oneAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(oneAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(oneAttemptState, "rd", "onr_v1_232_crystal-wall");

    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(oneAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const oneAttemptOps = getLegalActions(oneAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(oneAttemptState, action));
    expect(oneAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(oneAttemptOps).not.toContain("onr_v1_283_audit-of-call-records");

    let twoAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-two-attempt-gate"),
    );
    twoAttemptState.runner.credits = 30;
    twoAttemptState.corp.credits = 30;
    moveCorpCardToHq(twoAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(twoAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(twoAttemptState, "rd", "onr_v1_232_crystal-wall");

    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(twoAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const twoAttemptOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(twoAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(twoAttemptOps).toContain("onr_v1_283_audit-of-call-records");

    twoAttemptState.corp.maxHandSize = 100;
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const resetOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(resetOps).not.toContain("onr_v1_284_chance-observation");
    expect(resetOps).not.toContain("onr_v1_283_audit-of-call-records");
  });

  it("resolves operation traces outside runs and returns deterministically to corp action context", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-operation-trace"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveCorpCardToHq(state, "onr_v1_283_audit-of-call-records");
    putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

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
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");

    const beforeTags = state.runner.tags;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_283_audit-of-call-records",
    );

    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.source.startsWith("trace:op_trace")).toBe(true);
    expect(state.trace?.returnPhase).toBe("corp_action_phase");
    expect(state.trace?.returnTimingPoint).toBe("corp_action.main");
    expect(state.trace?.returnActiveSide).toBe("corp");
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(beforeTags + 1);
    expect(state.phase).toBe("corp_action_phase");
    expect(state.timingPoint).toBe("corp_action.main");
    expect(state.activeSide).toBe("corp");
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("trashes up to two runner resources with Corporate Detective Agency when the runner is tagged", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-detective-agency"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_158_danshis-second-id");
    moveRunnerCardToGrip(state, "onr_v1_179_silicon-saloon-franchise");
    moveRunnerCardToGrip(state, "onr_v1_163_floating-runner-bbs");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_158_danshis-second-id",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_163_floating-runner-bbs",
    );
    state.runner.tags = 1;
    const resourcesBefore = state.runner.rig.resources.slice();

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "onr_v1_286_corporate-detective-agency");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_286_corporate-detective-agency",
    );

    expect(state.runner.rig.resources).toHaveLength(1);
    expect(
      state.runner.heap.filter((cardId) => resourcesBefore.includes(cardId)),
    ).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_286_corporate-detective-agency",
    });
  });

  it("executes Danshi's Second ID and Silicon Saloon Franchise as runner resource actions", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-resource-actions"));
    state.runner.credits = 30;
    state.runner.tags = 5;
    state.runner.clicks = 10;
    const danshiId = moveRunnerCardToGrip(
      state,
      "onr_v1_158_danshis-second-id",
    );
    const siliconId = moveRunnerCardToGrip(
      state,
      "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === danshiId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === siliconId,
    );

    const tagsBefore = state.runner.tags;
    const creditsBeforeDanshi = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === danshiId &&
        sourceDefinition(state, action) === "onr_v1_158_danshis-second-id",
    );
    expect(state.runner.tags).toBe(tagsBefore - 3);
    expect(state.runner.credits).toBe(creditsBeforeDanshi);
    expect(state.runner.heap).toContain(danshiId);

    const creditsBeforeSilicon = state.runner.credits;
    const gripBeforeSilicon = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === siliconId,
    );
    expect(state.runner.credits).toBe(creditsBeforeSilicon + 1);
    expect(state.runner.grip.length).toBe(gripBeforeSilicon + 1);
  });
});

describe("V1.8.0 Mechanikpaket G", () => {
  it("adds a controlled V1.8.0 core card set for agenda difficulty, scored statics and overadvance points", () => {
    expect(ONR_V1_8_0_FINAL_CARD_IDS).toHaveLength(6);
    for (const definitionId of ONR_V1_8_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /counter_system|virus|purge|deterministischer_wuerfel/,
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_083_desperate-competitor"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_090_hot-tip-for-wns"]).toMatchObject({
      cost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_156_corporate-ally"]).toMatchObject({
      installCost: 3,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_159_databroker"]).toMatchObject({
      installCost: 0,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_201_executive-extraction"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
    expect(DEMO_CARDS_BY_ID["onr_v1_214_project-babylon"]).toMatchObject({
      advancementRequirement: 3,
      agendaPoints: 1,
    });
  });

  it("validates V1.8.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v180CardReleaseGame("v180-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      DEMO_CARDS_BY_ID["onr_v1_286_corporate-detective-agency"],
    ).toBeDefined();
  });

  it("gates Desperate Competitor and Hot Tip for WNS by same-turn agenda subtype theft", () => {
    let grayState = toRunnerTurn(v180CardReleaseGame("v180-gray-ops-gate"));
    grayState.runner.credits = 30;
    const desperateCardId = moveRunnerCardToGrip(
      grayState,
      "onr_v1_083_desperate-competitor",
    );
    const hotTipCardId = moveRunnerCardToGrip(
      grayState,
      "onr_v1_090_hot-tip-for-wns",
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(true);
    const hotTipNoBlackOps = apply(
      structuredClone(grayState),
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === hotTipCardId,
    );
    expect(hotTipNoBlackOps.runner.scoreArea).not.toContain(hotTipCardId);
    expect(hotTipNoBlackOps.runner.heap).toContain(hotTipCardId);
    putCorpCardOnTopOfRd(grayState, "onr_v1_203_hostile-takeover");
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "access_card",
    );
    grayState = apply(
      grayState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === desperateCardId,
      ),
    ).toBe(true);
    expect(
      getLegalActions(grayState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipCardId,
      ),
    ).toBe(true);
    grayState = apply(
      grayState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === desperateCardId,
    );
    expect(grayState.runner.scoreArea).toContain(desperateCardId);
    expect(grayState.cardInstances[desperateCardId]?.counters?.agenda).toBe(1);

    let blackState = toRunnerTurn(v180CardReleaseGame("v180-black-ops-gate"));
    blackState.runner.credits = 30;
    const hotTipBlackCardId = moveRunnerCardToGrip(
      blackState,
      "onr_v1_090_hot-tip-for-wns",
    );
    putCorpCardOnTopOfRd(blackState, "onr_v1_214_project-babylon");
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "access_card",
    );
    blackState = apply(
      blackState,
      "runner",
      (action) => action.type === "steal_agenda",
    );
    expect(
      getLegalActions(blackState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          String(action.payload?.cardId) === hotTipBlackCardId,
      ),
    ).toBe(true);
    blackState = apply(
      blackState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === hotTipBlackCardId,
    );
    expect(blackState.runner.scoreArea).toContain(hotTipBlackCardId);
    expect(blackState.cardInstances[hotTipBlackCardId]?.counters?.agenda).toBe(
      1,
    );
  });

  it("enforces Corporate Ally install agenda-point forfeit and Databroker agenda-point-to-credit action", () => {
    let state = toRunnerTurn(
      v180CardReleaseGame("v180-corporate-ally-databroker"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      "onr_v1_156_corporate-ally",
    );
    const databrokerId = moveRunnerCardToGrip(state, "onr_v1_159_databroker");
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const stolenAgendaId = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_203_hostile-takeover",
    );
    expect(stolenAgendaId).toBeDefined();

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    expect(state.runner.rig.resources).toContain(corporateAllyId);
    if (stolenAgendaId) {
      expect(state.runner.scoreArea).not.toContain(stolenAgendaId);
      expect(state.specialZones?.removedFromGame).toContain(stolenAgendaId);
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === databrokerId,
    );
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    const databrokerForfeitTarget = state.runner.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_203_hostile-takeover",
    );
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.resourceAbility === "databroker" &&
        String(action.payload?.cardId) === databrokerId,
    );
    expect(state.runner.credits).toBe(creditsBefore + 10);
    expect(state.runner.heap).toContain(databrokerId);
    if (databrokerForfeitTarget) {
      expect(state.runner.scoreArea).not.toContain(databrokerForfeitTarget);
      expect(state.specialZones?.removedFromGame).toContain(
        databrokerForfeitTarget,
      );
    }
  });

  it("applies Executive Extraction difficulty reduction for gray_ops only and keeps Corporate Ally difficulty increase active", () => {
    let state = toRunnerTurn(v180CardReleaseGame("v180-difficulty-statics"));
    state.runner.credits = 30;
    const corporateAllyId = moveRunnerCardToGrip(
      state,
      "onr_v1_156_corporate-ally",
    );
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === corporateAllyId,
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "simple_agenda");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_agenda" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "simple_agenda",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "simple_agenda",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "advance_card" &&
        sourceDefinition(state, action) === "simple_agenda",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "simple_agenda",
      ),
    ).toBe(true);

    moveCorpCardToHq(state, "onr_v1_201_executive-extraction");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_201_executive-extraction" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_201_executive-extraction",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_201_executive-extraction",
    );

    moveCorpCardToHq(state, "onr_v1_203_hostile-takeover");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_203_hostile-takeover" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === "onr_v1_203_hostile-takeover",
      ),
    ).toBe(true);
  });

  it("awards deterministic Project Babylon bonus points on score with replay-safe statehash", () => {
    let state = v180CardReleaseGame("v180-project-babylon");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 50;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_214_project-babylon");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_214_project-babylon" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 7; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_214_project-babylon",
      );
    }

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_214_project-babylon",
    );

    const projectBabylonId = state.corp.scoreArea.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_214_project-babylon",
    );
    expect(projectBabylonId).toBeDefined();
    if (projectBabylonId) {
      expect(state.cardInstances[projectBabylonId]?.counters?.agenda).toBe(2);
    }
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      agendaPoints: 1,
      agendaPointBonus: 2,
      totalAgendaPoints: 3,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.8.1 Mechanikpaket H", () => {
  it("adds a controlled V1.8.1 core card set for counter, purge and run-follow-up mechanics", () => {
    expect(ONR_V1_8_1_FINAL_CARD_IDS).toHaveLength(12);
    for (const definitionId of ONR_V1_8_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /deterministischer_wuerfel|ambush|v2/,
      );
    }
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_013_cockroach");
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_034_incubator");
    expect(ONR_V1_8_1_FINAL_CARD_IDS).not.toContain("onr_v1_030_grubb");
  });

  it("validates V1.8.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_8_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_8_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v181CardReleaseGame("v181-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_214_project-babylon"]).toBeDefined();
  });

  it("applies Clown encounter strength reduction to encountered ice strength", () => {
    let withoutClown = toRunnerTurn(v181CardReleaseGame("v181-clown-off"));
    withoutClown.runner.credits = 30;
    moveRunnerCardToGrip(withoutClown, "onr_v1_021_dwarf");
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withoutClown, action) === "onr_v1_021_dwarf",
    );
    putCorpIceOnServer(withoutClown, "rd", "simple_barrier_ice");
    withoutClown = apply(
      withoutClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withoutClown = apply(
      withoutClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withoutClown, action) === "simple_barrier_ice",
    );
    expect(
      getPlayerView(withoutClown, "runner").run?.encounteredIce?.strength,
    ).toBe(3);

    let withClown = toRunnerTurn(v181CardReleaseGame("v181-clown-on"));
    withClown.runner.credits = 30;
    moveRunnerCardToGrip(withClown, "onr_v1_012_clown");
    moveRunnerCardToGrip(withClown, "onr_v1_021_dwarf");
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === "onr_v1_012_clown",
    );
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(withClown, action) === "onr_v1_021_dwarf",
    );
    putCorpIceOnServer(withClown, "rd", "simple_barrier_ice");
    withClown = apply(
      withClown,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    withClown = apply(
      withClown,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(withClown, action) === "simple_barrier_ice",
    );
    expect(
      getPlayerView(withClown, "runner").run?.encounteredIce?.strength,
    ).toBe(2);
  });

  it("stacks Clown with CardImplementation ICE-strength increases for break revalidation", () => {
    let state = toRunnerTurn(v181CardReleaseGame("p362-clown-stack"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_012_clown");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_012_clown",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dataMasonsId = addCorpCardToHqForTest(
      state,
      "onr_v1_317_data-masons",
      "clown_stack_data_masons",
    );
    let remote = state.corp.servers.find((server) => server.id === "remote_1");
    if (!remote) {
      remote = {
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      };
      state.corp.servers.push(remote);
    }
    removeEverywhere(state, dataMasonsId);
    remote.root.push(dataMasonsId);
    state.cardInstances[dataMasonsId] = {
      ...state.cardInstances[dataMasonsId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      rezzed: true,
    };
    const wallId = addCorpCardToHqForTest(
      state,
      "onr_v1_232_crystal-wall",
      "clown_stack_wall",
    );
    removeEverywhere(state, wallId);
    const rd = state.corp.servers.find((server) => server.id === "rd");
    if (!rd) throw new Error("Missing R&D");
    rd.ice.push(wallId);
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    };
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
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    expect(getPlayerView(state, "runner").run?.encounteredIce?.strength).toBe(3);
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const removedClown = structuredClone(state);
    const clownId = removedClown.runner.rig.programs.find(
      (cardId) => removedClown.cardInstances[cardId]?.definitionId === "onr_v1_012_clown",
    );
    if (!clownId) throw new Error("Missing Clown");
    removeEverywhere(removedClown, clownId);
    const stale = applyAction(removedClown, {
      matchId: removedClown.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: removedClown.stateVersion,
      idempotencyKey: "p362-clown-break-stale",
    });
    expect(stale.ok).toBe(false);
  });

  it("creates Pattel/Pox run-success counters and clears card/server virus counters with purge", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-pattel-pox-purge"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_046_pattels-virus");
    moveRunnerCardToGrip(state, "onr_v1_049_pox");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_046_pattels-virus",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_049_pox",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
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
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    expect(dwarfId).toBeDefined();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = continueRunThroughMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[iceId]?.counters?.virus).toBe(1);
    expect(state.poxCountersByServer?.rd).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );
    expect(state.cardInstances[iceId]?.counters?.virus ?? 0).toBe(0);
    expect(state.poxCountersByServer?.rd ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "virus",
    });
  });

  it("lets Pattel's Virus choose which fully broken ICE receives its counter", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-pattel-choice"));
    state.runner.credits = 40;
    moveRunnerCardToGrip(state, "onr_v1_046_pattels-virus");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_046_pattels-virus",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const wallIds = Object.entries(state.cardInstances)
      .filter(([, card]) => card.definitionId === "onr_v1_279_wall-of-static")
      .map(([id]) => id as CardInstanceId);
    expect(wallIds.length).toBeGreaterThanOrEqual(2);
    const innerIceId = wallIds[0]!;
    const outerIceId = wallIds[1]!;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    for (const iceId of [innerIceId, outerIceId]) {
      removeEverywhere(state, iceId);
      rdServer.ice.push(iceId);
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      };
    }
    for (const iceId of [innerIceId, outerIceId]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        rezzed: true,
        faceup: true,
      };
    }
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    expect(dwarfId).toBeDefined();
    const runnerHasDwarfBreak = (): boolean =>
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === dwarfId,
      );
    const runnerHasAccess = (): boolean =>
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      );
    const continueUntilBreakOrAccess = (): void => {
      for (let index = 0; index < 8; index += 1) {
        if (runnerHasDwarfBreak() || runnerHasAccess()) return;
        state = apply(state, "runner", (action) => action.type === "continue_run");
      }
    };
    const pumpUntilDwarfCanBreak = (): void => {
      for (let index = 0; index < 8; index += 1) {
        if (runnerHasDwarfBreak()) return;
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === dwarfId,
        );
      }
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    continueUntilBreakOrAccess();
    pumpUntilDwarfCanBreak();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    continueUntilBreakOrAccess();
    pumpUntilDwarfCanBreak();
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === dwarfId,
    );
    continueUntilBreakOrAccess();
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.pendingChoice?.source).toContain("v181.pattels_virus");
    expect(state.pendingChoice?.options).toHaveLength(2);
    state = applyChoice(state, "runner", `card_${innerIceId}`);

    expect(state.cardInstances[innerIceId]?.counters?.virus).toBe(1);
    expect(state.cardInstances[outerIceId]?.counters?.virus ?? 0).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      v181RunnerProgramAbility: "pattels_virus_counter",
      pattelsVirusCounterAdded: 1,
      targetCardDefinitionId: "onr_v1_279_wall-of-static",
    });
  });

  it("runs Inside Job as deterministic first-ice bypass", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-inside-job"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_094_inside-job");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_094_inside-job" &&
        action.payload?.serverId === "rd",
    );
    expect(state.run?.attackedServerId).toBe("rd");
    expect(state.run?.bypassFirstIceRemaining).toBe(false);
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
  });

  it("keeps Restrictive action IDs server-distinct and applies Restrictive plus Pox install tax deterministically", () => {
    let state = toRunnerTurn(v181CardReleaseGame("v181-restrictive-pox-tax"));
    state.runner.credits = 40;
    if (!state.corp.servers.some((server) => server.id === "remote_1")) {
      state.corp.servers.push({
        id: "remote_1",
        kind: "remote",
        label: "Remote 1",
        ice: [],
        root: [],
      });
    }
    const restrictiveCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_173_restrictive-net-zoning",
    );
    const restrictiveInstallActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === restrictiveCardId,
    );
    expect(restrictiveInstallActions.length).toBeGreaterThan(1);
    expect(
      new Set(restrictiveInstallActions.map((action) => action.actionId)).size,
    ).toBe(restrictiveInstallActions.length);
    expect(
      restrictiveInstallActions.map((action) => [
        action.payload?.selectedServerId,
        action.label,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ["hq", "Restrictive Net Zoning auf HQ ausrichten"],
        ["rd", "Restrictive Net Zoning auf R&D ausrichten"],
        ["archives", "Restrictive Net Zoning auf Archives ausrichten"],
        ["remote_1", "Restrictive Net Zoning auf Remote 1 ausrichten"],
      ]),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_173_restrictive-net-zoning" &&
        action.payload?.selectedServerId === "rd",
    );
    expect(state.cardInstances[restrictiveCardId]?.selectedServerId).toBe("rd");
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === restrictiveCardId,
      ),
    ).toMatchObject({ selectedServerId: "rd", selectedServerLabel: "R&D" });
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.instanceId === restrictiveCardId,
      ),
    ).toMatchObject({ selectedServerId: "rd", selectedServerLabel: "R&D" });
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "rd",
      )?.counterDisplays,
    ).toEqual([
      expect.objectContaining({
        id: "restrictive_net_zoning_install_cost_rd",
        amount: 2,
        label: "Install +",
        ariaLabel:
          "R&D: ICE-Installationskosten +2 durch Restrictive Net Zoning.",
        counterType: "install_cost_modifier",
      }),
    ]);
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "rd")
        ?.counterDisplays,
    ).toEqual([
      expect.objectContaining({
        id: "restrictive_net_zoning_install_cost_rd",
        amount: 2,
        label: "Install +",
        ariaLabel:
          "R&D: ICE-Installationskosten +2 durch Restrictive Net Zoning.",
        counterType: "install_cost_modifier",
      }),
    ]);
    expect(
      getPlayerView(state, "runner").servers.find(
        (server) => server.id === "hq",
      )?.counterDisplays,
    ).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      selectedServerId: "rd",
      selectedServerLabel: "R&D",
    });
    installRunnerProgramForTest(state, "onr_v1_049_pox");

    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.poxCountersByServer?.rd).toBe(2);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "simple_barrier_ice");
    const rdInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_barrier_ice" &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(rdInstall.costs[0]?.credits).toBe(3);
    expect(rdInstall.payload?.iceInstallAdditionalCost).toBe(3);
  });

  it("applies Restrictive Net Zoning as a +2 ICE install tax only on the chosen fort", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v181-restrictive-tax",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_8_1_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_8_1_CORP_DECK,
          id: "v181_restrictive_tax_corp",
          name: "V1.8.1 Restrictive Tax Corp",
          cards: [
            ...ONR_V1_8_1_CORP_DECK.cards,
            { id: "simple_upgrade", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 40;
    const restrictiveCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_173_restrictive-net-zoning",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === restrictiveCardId &&
        action.payload?.selectedServerId === "rd",
    );
    expect(state.cardInstances[restrictiveCardId]?.selectedServerId).toBe("rd");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 3;

    const sameFortIceId = moveCorpCardToHq(state, "simple_barrier_ice");
    const sameFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === sameFortIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(sameFortInstall.costs[0]).toMatchObject({ clicks: 1, credits: 2 });
    expect(sameFortInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 2,
      iceInstallTotalCost: 2,
    });

    const stale = structuredClone(state);
    stale.runner.rig.resources = stale.runner.rig.resources.filter(
      (cardId) => cardId !== restrictiveCardId,
    );
    stale.cardInstances[restrictiveCardId] = {
      ...stale.cardInstances[restrictiveCardId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const staleCredits = stale.corp.credits;
    const staleResult = applyAction(stale, {
      matchId: stale.matchId,
      side: "corp",
      actionId: sameFortInstall.actionId,
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "v181-restrictive-tax-stale",
    });
    expect(staleResult.ok).toBe(false);
    expect(stale.corp.credits).toBe(staleCredits);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === sameFortInstall.actionId,
    );
    expect(state.corp.credits).toBe(18);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      iceInstallAdditionalCost: 2,
      iceInstallTotalCost: 2,
    });

    const otherFortIceId = moveCorpCardToHq(state, "simple_code_gate_ice");
    const otherFortInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === otherFortIceId &&
        action.payload?.serverId === "hq" &&
        action.payload?.placement === "ice",
    );
    expect(otherFortInstall.payload).toMatchObject({
      iceInstallAdditionalCost: 0,
      iceInstallTotalCost: 0,
    });
    expect(otherFortInstall.costs[0]).toEqual({ clicks: 1 });

    const upgradeId = moveCorpCardToHq(state, "simple_upgrade");
    const nonIceInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === upgradeId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "root",
    );
    expect(nonIceInstall.payload?.iceInstallAdditionalCost).toBeUndefined();
    expect(nonIceInstall.costs[0]).toEqual({ clicks: 1 });
  });

  it("scores Coup agendas with deterministic start counters and spends them via legal click actions", () => {
    let state = v181CardReleaseGame("v181-coup-actions");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;

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
    const corporateCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_193_corporate-coup",
    );
    expect(corporateCoupId).toBeDefined();
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.bit).toBe(15);

    moveCorpCardToHq(state, "onr_v1_209_political-coup");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_209_political-coup" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_209_political-coup",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_209_political-coup",
    );
    const politicalCoupId = state.corp.scoreArea.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_209_political-coup",
    );
    expect(politicalCoupId).toBeDefined();
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.bit).toBe(12);

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_193_corporate-coup",
    );
    expect(state.corp.credits).toBe(creditsBefore + 3);
    if (corporateCoupId)
      expect(state.cardInstances[corporateCoupId]?.counters?.bit).toBe(12);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_209_political-coup",
    );
    expect(state.corp.credits).toBe(creditsBefore + 6);
    if (politicalCoupId)
      expect(state.cardInstances[politicalCoupId]?.counters?.bit).toBe(9);
  });

  it("resolves Ball/Canis run flags and enforces Fatal/Shock next-encounter penalties deterministically", () => {
    let ballTaxState = toRunnerTurn(v181CardReleaseGame("v181-ball-tax"));
    ballTaxState.runner.credits = 20;
    putCorpIceOnServer(ballTaxState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(ballTaxState, "rd", "onr_v1_222_ball-and-chain");
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === "onr_v1_222_ball-and-chain",
    );
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(ballTaxState.run?.encounterTaxForFutureIce).toBe(2);
    ballTaxState = apply(
      ballTaxState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeBallTax = ballTaxState.runner.credits;
    ballTaxState = apply(
      ballTaxState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(ballTaxState, action) === "simple_barrier_ice",
    );
    expect(ballTaxState.runner.credits).toBe(creditsBeforeBallTax - 2);

    let canisState = toRunnerTurn(v181CardReleaseGame("v181-canis-strength"));
    canisState.runner.credits = 20;
    moveRunnerCardToGrip(canisState, "onr_v1_014_codecracker");
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(canisState, action) === "onr_v1_014_codecracker",
    );
    putCorpIceOnServer(canisState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(canisState, "rd", "onr_v1_226_canis-minor");
    putCorpIceOnServer(canisState, "rd", "onr_v1_225_canis-major");
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "onr_v1_225_canis-major",
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(2);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "onr_v1_226_canis-minor",
    );
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(3);
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "continue_run",
    );
    const creditsBeforeCanisThirdEncounter = canisState.runner.credits;
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "simple_code_gate_ice",
    );
    expect(canisState.runner.credits).toBe(creditsBeforeCanisThirdEncounter);
    const codecrackerId = canisState.runner.rig.programs.find(
      (id) =>
        canisState.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
    );
    expect(
      getLegalActions(canisState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === codecrackerId,
      ),
    ).toBe(false);

    let fatalState = toRunnerTurn(v181CardReleaseGame("v181-fatal-shock"));
    fatalState.runner.credits = 20;
    putCorpIceOnServer(fatalState, "rd", "simple_barrier_ice");
    putCorpIceOnServer(fatalState, "rd", "onr_v1_242_fatal-attractor");
    fatalState = apply(
      fatalState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === "onr_v1_242_fatal-attractor",
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    fatalState = apply(
      fatalState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(fatalState, action) === "simple_barrier_ice",
    );
    const gripBeforeFatal = fatalState.runner.grip.length;
    fatalState = apply(
      fatalState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(fatalState.runner.grip.length).toBe(gripBeforeFatal - 3);
    expect(fatalState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 3,
    });

    let shockState = toRunnerTurn(v181CardReleaseGame("v181-shock-lock"));
    shockState.runner.credits = 20;
    moveRunnerCardToGrip(shockState, "onr_v1_014_codecracker");
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(shockState, action) === "onr_v1_014_codecracker",
    );
    putCorpIceOnServer(shockState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(shockState, "rd", "onr_v1_268_shock-r");
    shockState = apply(
      shockState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === "onr_v1_268_shock-r",
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "runner",
      (action) => action.type === "continue_run",
    );
    shockState = apply(
      shockState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(shockState, action) === "simple_code_gate_ice",
    );
    const shockCodecrackerId = shockState.runner.rig.programs.find(
      (id) =>
        shockState.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
    );
    const shockRunnerActions = getLegalActions(shockState, "runner");
    expect(shockState.run?.noBreakSubroutinesActive).toBe(true);
    expect(shockState.run?.jackOutLockedUntilEncounterEnds).toBe(true);
    expect(
      shockRunnerActions.some((action) => action.type === "jack_out"),
    ).toBe(false);
    expect(
      shockRunnerActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === shockCodecrackerId,
      ),
    ).toBe(false);
  });
});

describe("V1.9.0 Mechanikpaket I", () => {
  it("adds a controlled V1.9.0 core card set for deterministic die, concrete resolver and ambush foundation scope", () => {
    expect(ONR_V1_9_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_9_0_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).toMatch(
        /deterministic_die_roll|deterministic_random|concrete_special_resolver|ambush/,
      );
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
    expect(DEMO_CARDS_BY_ID["onr_v1_268_shock-r"]).toBeDefined();
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
        record.purpose.startsWith("v190.die.onr_v1_007_blink.break."),
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
        record.purpose.startsWith("v190.die.onr_v1_007_blink.break."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      const publicPayload = state.eventLog.at(-1)?.publicPayload;
      expect(publicPayload).toMatchObject({
        actionType: "break_subroutine",
        targetIceDefinitionId: "onr_v1_279_wall-of-static",
        targetIceTitle: "Wall of Static",
        subroutineIndex: 0,
        blinkDieRoll: die,
        blinkBreakSuccess: die >= 4,
        blinkDamageAmount: die >= 4 ? 0 : die,
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
        "v190.random.onr_v1_115_terrorist-reprisal.hq_discard",
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
        "card_implementation.onr_v1_223_banpei.printed_subroutine.1.trash_program,card_implementation.onr_v1_223_banpei.printed_subroutine.2.end_the_run",
      encounterWillEndRun: true,
    });
    unbroken = apply(
      unbroken,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(unbroken.runner.heap).toContain(killerId);
    expect(unbroken.run).toBeUndefined();
    expect(unbroken.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      sourceDefinitionId: "onr_v1_223_banpei",
      trashedCardDefinitionId: "simple_killer",
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(unbroken.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
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
    const dataNagaKillerId = installRunnerProgramForTest(dataNaga, "simple_killer");
    dataNaga = apply(dataNaga, "runner", (action) => action.type === "continue_run");
    expect(dataNaga.runner.heap).toContain(dataNagaKillerId);
    expect(dataNaga.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_235_data-naga",
      trashedCardDefinitionId: "simple_killer",
      trashedCardType: "program",
      trashedCount: 1,
    });

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
    expect(crystalBreaks.map((action) => action.payload?.subroutineIndex)).toEqual([
      0,
      1,
    ]);
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
      unbrokenSubroutineCount: 3,
      encounterSubroutineIds:
        "card_implementation.onr_v1_223_banpei.printed_subroutine.1.trash_program,card_implementation.onr_v1_223_banpei.printed_subroutine.2.end_the_run,card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
    });
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
        record.purpose.startsWith("v190.die.onr_v1_275_vacuum-link.rewind."),
      );
      expect(dieRecord).toBeDefined();
      const die = dieRecord ? Math.floor(dieRecord.value * 6) + 1 : 0;
      if (die < 2 || die > 3) continue;
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
    const expectedMechanics: Record<string, RegExp> = {
      onr_v1_013_cockroach: /hq_discard_randomization/,
      onr_v1_034_incubator: /counter_transform_choice/,
      onr_v1_030_grubb: /run_remainder_strength_bonus/,
    };
    for (const definitionId of ONR_V1_9_1_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      const expectedPattern = expectedMechanics[definitionId];
      expect(expectedPattern, definitionId).toBeDefined();
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedPattern!,
      );
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
    expect(DEMO_CARDS_BY_ID["onr_v1_275_vacuum-link"]).toBeDefined();
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
              effect.reason === "cockroach_successful_hq_run",
            )
          );
        });
      expect(lastCockroachCounterEvent?.publicPayload.resolvedEffects).toContainEqual(
        expect.objectContaining({
          kind: "counter_change",
          side: "corp",
          counterType: "cockroach",
          addedCounterAmount: 1,
          remainingCounters: 2,
          reason: "cockroach_successful_hq_run",
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
          id: "cockroach",
          amount: 2,
          label: "Cockroach-Counter",
          ariaLabel: "2 Cockroach-Counter auf der Korp",
          counterType: "cockroach",
        }),
      );
      expect(corpView.own.identity.counterDisplays).toContainEqual(
        expect.objectContaining({
          id: "cockroach",
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
        record.purpose.startsWith(
          "v191.random.onr_v1_013_cockroach.hq_discard_phase",
        ),
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
        "v191.die.onr_v1_034_incubator.start_of_turn.roll.",
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
    expect(
      cardCounterAmount(state, cockroachId, "virus"),
    ).toBeGreaterThanOrEqual(2);
    expect(
      cardCounterAmount(state, incubatorId, "virus"),
    ).toBeGreaterThanOrEqual(2);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "purge_virus_counters",
      ),
    ).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_virus_counters",
    );

    expect(cardCounterAmount(state, cockroachId, "virus")).toBe(0);
    expect(cardCounterAmount(state, incubatorId, "virus")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      purgedCounterType: "virus",
    });
  });
});

describe("V1.9.2 Mechanikpaket K", () => {
  it("adds the V1.9.2 core card set with hidden-zone/access/run/recurring coverage", () => {
    expect(ONR_V1_9_2_FINAL_CARD_IDS).toHaveLength(7);
    const expectedMechanics: Record<string, RegExp> = {
      "onr_v1_076_all-nighter": /run_flow/,
      "onr_v1_096_kilroy-was-here": /access_trash_free/,
      "onr_v1_107_romp-through-hq": /access_trash_free/,
      "onr_v1_184_top-runners-conference": /start_of_turn_credit_gain/,
      "onr_v1_188_ai-chief-financial-officer": /hidden_zone_shuffle/,
      "onr_v1_211_polymer-breakthrough": /start_of_turn_credit_gain/,
      "onr_v1_235_data-naga": /trash_installed_program/,
    };
    for (const definitionId of ONR_V1_9_2_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedMechanics[definitionId]!,
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /trace|tag|damage_prevention|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v192CardReleaseGame("v192-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_013_cockroach"]).toBeDefined();
  });

  it("grants an All-Nighter bonus run via LegalActions without spending a click on the bonus run", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-all-nighter"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_076_all-nighter");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_076_all-nighter" &&
        action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const bonusActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(bonusActions.length).toBeGreaterThan(0);
    state.runner.clicks = 0;
    const clicksBefore = state.runner.clicks;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(state.runner.clicks).toBe(clicksBefore);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.bonusRunNoClick === true,
      ),
    ).toBe(false);

    let hqState = toRunnerTurn(v192CardReleaseGame("v192-all-nighter-hq"));
    hqState.runner.credits = 30;
    moveRunnerCardToGrip(hqState, "onr_v1_076_all-nighter");
    const hqCard = moveCorpCardToHq(hqState, "simple_economy_operation");
    keepOnlyCorpHqCard(hqState, hqCard);
    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_076_all-nighter" &&
        action.payload?.serverId === "hq",
    );
    hqState = apply(hqState, "runner", (action) => action.type === "access_card");

    const hqBonusActions = getLegalActions(hqState, "runner").filter(
      (action) =>
        action.type === "start_run" && action.payload?.bonusRunNoClick === true,
    );
    expect(hqBonusActions.length).toBeGreaterThan(0);
  });

  it("allows Kilroy and Romp to trash accessed HQ/R&D cards at no cost", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-kilroy-romp"));
    state.runner.credits = 20;

    moveRunnerCardToGrip(state, "onr_v1_096_kilroy-was-here");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const creditsBeforeKilroy = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_096_kilroy-was-here",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(state.runner.credits).toBe(creditsBeforeKilroy);

    moveRunnerCardToGrip(state, "onr_v1_107_romp-through-hq");
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_107_romp-through-hq",
    );
    const creditsBeforeRompTrash = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "access_card");
    const freeTrashAction = mustAction(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(freeTrashAction.costs).toEqual([]);
    state = apply(
      state,
      "runner",
      (action) => action.actionId === freeTrashAction.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeRompTrash);
  });

  it("applies Top Runners' Conference credits at start of turn and trashes it when a run starts", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-top-runners"));
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "onr_v1_184_top-runners-conference");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_184_top-runners-conference",
    );
    const creditsAfterInstall = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 2,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_184_top-runners-conference",
          sourceTitle: "Top Runners' Conference",
          visibility: "public",
        }),
      ]),
    );
    expect(state.runner.credits).toBe(creditsAfterInstall + 2);
    const conferenceId = state.runner.rig.resources.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_184_top-runners-conference",
    );
    expect(conferenceId).toBeDefined();
    if (!conferenceId) return;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(state.runner.rig.resources.includes(conferenceId)).toBe(false);
    expect(state.runner.heap).toContain(conferenceId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "trash_source",
        reason: "run_start",
        sourceDefinitionId: "onr_v1_184_top-runners-conference",
      }),
    );
  });

  it("handles Polymer start-of-turn credits, AI CFO hidden-zone shuffle action and Data Naga program trash", () => {
    let state = toRunnerTurn(v192CardReleaseGame("v192-polymer-cfo-data-naga"));
    state.runner.credits = 20;
    state.corp.credits = 5;

    const polymerAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_211_polymer-breakthrough",
    );
    const cfoAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_188_ai-chief-financial-officer",
    );
    removeEverywhere(state, polymerAgendaId);
    removeEverywhere(state, cfoAgendaId);
    state.corp.scoreArea.push(polymerAgendaId, cfoAgendaId);
    state.cardInstances[polymerAgendaId] = {
      ...state.cardInstances[polymerAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[cfoAgendaId] = {
      ...state.cardInstances[cfoAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    const corpCreditsBeforeRunnerEndTurn = state.corp.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(corpCreditsBeforeRunnerEndTurn + 1);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_211_polymer-breakthrough",
          sourceTitle: "Polymer Breakthrough",
          visibility: "public",
        }),
      ]),
    );
    const corpCreditsBeforeMandatory = state.corp.credits;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corp.credits).toBe(corpCreditsBeforeMandatory);

    moveCorpCardToHq(state, "simple_economy_operation");
    moveCorpCardToArchives(state, "onr_v1_279_wall-of-static", false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "ai_chief_financial_officer",
    );
    expect(state.corp.archives).toHaveLength(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd",
    });

    state = toRunnerTurnFromCorpMain(state);
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    const dwarfId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    expect(dwarfId).toBeDefined();
    if (!dwarfId) return;
    putCorpIceOnServer(state, "rd", "onr_v1_235_data-naga");
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
        sourceDefinition(state, action) === "onr_v1_235_data-naga",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.rig.programs.includes(dwarfId)).toBe(false);
    expect(state.runner.heap).toContain(dwarfId);
  });
});

describe("V1.9.3 Mechanikpaket L", () => {
  it("adds the V1.9.3 core card set with trace/tag and jack-out-lock coverage", () => {
    expect(ONR_V1_9_3_FINAL_CARD_IDS).toHaveLength(4);
    const expectedMechanics: Record<string, RegExp> = {
      "onr_v1_207_netwatch-operations-office": /trace/,
      "onr_v1_213_private-cybernet-police": /trace/,
      "onr_v1_251_jack-attack": /jack_out_lock/,
      "onr_v1_271_tko-2-0": /action_economy/,
    };
    for (const definitionId of ONR_V1_9_3_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        expectedMechanics[definitionId]!,
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /damage_prevention|replacement|v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.3 smoke decks and keeps V1.9.2 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v193CardReleaseGame("v193-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_235_data-naga"]).toBeDefined();
  });

  it("starts V1.9.3 agenda trace actions and keeps Jack Attack jack-out lock active for the run", () => {
    let state = toRunnerTurn(v193CardReleaseGame("v193-trace-jack-lock"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const netwatchAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_207_netwatch-operations-office",
    );
    const privatePoliceAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_213_private-cybernet-police",
    );
    removeEverywhere(state, netwatchAgendaId);
    removeEverywhere(state, privatePoliceAgendaId);
    state.corp.scoreArea.push(netwatchAgendaId, privatePoliceAgendaId);
    state.cardInstances[netwatchAgendaId] = {
      ...state.cardInstances[netwatchAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[privatePoliceAgendaId] = {
      ...state.cardInstances[privatePoliceAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;

    const netwatchAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_207_netwatch-operations-office",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: netwatchAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v193-netwatch-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: netwatchAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v193-netwatch-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    state = apply(state, "corp", (action) => action.actionId === netwatchAction.actionId);
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 2,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_207_netwatch-operations-office",
      traceStarted: true,
      baseTraceStrength: 2,
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty("amount");
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(1);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_213_private-cybernet-police",
    );
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 5,
    });
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(2);

    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpIceOnServer(state, "rd", "onr_v1_251_jack-attack");
    state = toRunnerTurnFromCorpMain(state);
    state.runner.clicks = 3;
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
        sourceDefinition(state, action) === "onr_v1_251_jack-attack",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.jackOutLockedForRun).toBe(true);
    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).not.toContain("jack_out");

    let tkoState = toRunnerTurn(v193CardReleaseGame("v193-tko-next-action"));
    tkoState.runner.credits = 20;
    tkoState.corp.credits = 20;
    putCorpIceOnServer(tkoState, "rd", "onr_v1_271_tko-2-0");
    tkoState = apply(
      tkoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    tkoState = apply(
      tkoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tkoState, action) === "onr_v1_271_tko-2-0",
    );
    const clicksBeforeTkoSubroutine = tkoState.runner.clicks;
    tkoState = apply(
      tkoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tkoState.run).toBeUndefined();
    expect(tkoState.runner.clicks).toBe(
      Math.max(0, clicksBeforeTkoSubroutine - 1),
    );
  });
});

describe("V1.9.4 Mechanikpaket M", () => {
  it("adds the V1.9.4 core card set with tagged meat-damage agenda actions", () => {
    expect(ONR_V1_9_4_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_4_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /runner_is_tagged/,
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/damage/);
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
  });

  it("validates V1.9.4 smoke decks and keeps V1.9.3 cards available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_4_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_4_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v194CardReleaseGame("v194-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(DEMO_CARDS_BY_ID["onr_v1_251_jack-attack"]).toBeDefined();
  });

  it("resolves On-Call Solo Team and Strike Force Kali damage actions only while Runner is tagged", () => {
    let state = toRunnerTurn(v194CardReleaseGame("v194-tagged-damage"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const onCallAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_208_on-call-solo-team",
    );
    const kaliAgendaId = moveCorpCardToHq(
      state,
      "onr_v1_217_strike-force-kali",
    );
    removeEverywhere(state, onCallAgendaId);
    removeEverywhere(state, kaliAgendaId);
    state.corp.scoreArea.push(onCallAgendaId, kaliAgendaId);
    state.cardInstances[onCallAgendaId] = {
      ...state.cardInstances[onCallAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[kaliAgendaId] = {
      ...state.cardInstances[kaliAgendaId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.runner.tags = 1;

    const gripBeforeOnCall = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_208_on-call-solo-team" &&
        action.payload?.cardId === onCallAgendaId,
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeOnCall);

    const gripBeforeKali = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_217_strike-force-kali" &&
        action.payload?.cardId === kaliAgendaId,
    );
    expect(state.runner.grip.length).toBeLessThan(gripBeforeKali);

    state.runner.tags = 0;
    const actionTypes = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "activated_card_ability" &&
          (action.payload?.cardId === onCallAgendaId ||
            action.payload?.cardId === kaliAgendaId),
      )
      .map((action) => action.type);
    expect(actionTypes).toEqual([]);
  });
});

describe("V1.9.5 Mechanikpaket N", () => {
  it("adds the V1.9.5 core card set with agenda strength and asset credit mechanics", () => {
    expect(ONR_V1_9_5_FINAL_CARD_IDS).toHaveLength(2);
    for (const definitionId of ONR_V1_9_5_FINAL_CARD_IDS) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_219_superior-net-barriers"]?.mechanics.join(" "),
    ).toMatch(/ice_strength|strength_modifier/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_219_superior-net-barriers"]?.mechanics.join(" "),
    ).toMatch(/strength/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_308_acme-savings-and-loan"]?.mechanics.join(" "),
    ).toMatch(/credit/);
  });

  it("validates V1.9.5 smoke decks", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_9_5_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_9_5_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v195CardReleaseGame("v195-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
  });

  it("applies Superior Net Barriers wall strength and ACME credits deterministically", () => {
    let state = toRunnerTurn(v195CardReleaseGame("v195-static-and-asset"));
    state.runner.credits = 20;
    state.corp.credits = 20;

    const superiorId = moveCorpCardToHq(
      state,
      "onr_v1_219_superior-net-barriers",
    );
    removeEverywhere(state, superiorId);
    state.corp.scoreArea.push(superiorId);
    state.cardInstances[superiorId] = {
      ...state.cardInstances[superiorId]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const rdWall = getPlayerView(state, "corp")
      .servers.find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === wallId);
    expect(rdWall?.strength).toBe(
      (DEMO_CARDS_BY_ID["onr_v1_279_wall-of-static"]?.strength ?? 0) + 1,
    );

    const scoredAgendaId = scoreCorpAgendaForTest(
      state,
      "onr_v1_203_hostile-takeover",
    );
    const acmeId = moveCorpCardToHq(
      state,
      "onr_v1_308_acme-savings-and-loan",
    );
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    state.corp.credits = 10;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    expect(state.corp.credits).toBe(22);
    expect(state.corp.scoreArea).not.toContain(scoredAgendaId);
    expect(state.corp.archives).toContain(acmeId);
    expect(state.activeObligationDebtCount).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      cardDefinitionId: "onr_v1_308_acme-savings-and-loan",
      agendaPointCost: 1,
      gainedCredits: 12,
      selfTrashed: true,
      obligationDebtCountAfter: 1,
    });

    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(21);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      obligationDebtAbility: "end_of_turn_payment",
      obligationDebtPaymentPaid: 1,
      corpCreditsAfter: 21,
    });
  });

  it("lets Superior Net Barriers reveal any number of walls and count rezzed walls", () => {
    let state = createGameAfterSetup({
      seed: "v195-superior-net-barriers-reveal-choice",
      runnerDeck: ONR_V1_9_5_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_9_5_CORP_DECK,
        cards: [
          ...ONR_V1_9_5_CORP_DECK.cards,
          { id: "onr_v1_232_crystal-wall", quantity: 1 },
          { id: "onr_v1_237_data-wall", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_219_superior-net-barriers");
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    const firstHiddenWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const secondHiddenWallId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_232_crystal-wall",
    );
    const rezzedWallId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_237_data-wall",
    );
    const codeGateId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_code_gate_ice",
    );
    state.cardInstances[rezzedWallId] = {
      ...state.cardInstances[rezzedWallId]!,
      faceup: true,
      rezzed: true,
    };

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_219_superior-net-barriers",
    );
    for (let index = 0; index < 6; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_219_superior-net-barriers",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) ===
          "onr_v1_219_superior-net-barriers",
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 2,
    });
    const corpChoice = getPlayerView(state, "corp").pendingChoice;
    expect(corpChoice?.options.map((option) => option.label)).toEqual([
      "Crystal Wall",
      "Wall of Static",
    ]);
    expect(corpChoice?.options.map((option) => option.publicLabel)).toEqual([
      "Installierte Wall",
      "Installierte Wall",
    ]);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    const rezzedWallView = getPlayerView(state, "runner")
      .servers.find((server) => server.id === "remote_1")
      ?.ice.find((ice) => ice.instanceId === rezzedWallId);
    expect(rezzedWallView?.strength).toBe(
      (DEMO_CARDS_BY_ID["onr_v1_237_data-wall"]?.strength ?? 0) + 1,
    );

    const beforeChoiceCredits = state.corp.credits;
    const skipped = applyChoices(structuredClone(state), "corp", []);
    expect(skipped.corp.credits).toBe(beforeChoiceCredits + 1);
    expect(skipped.cardInstances[firstHiddenWallId]?.faceup).toBe(false);
    expect(skipped.cardInstances[secondHiddenWallId]?.faceup).toBe(false);
    expect(skipped.cardInstances[codeGateId]?.faceup).toBe(false);
    expect(skipped.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "superior_net_barriers_reveal_walls",
      revealedCount: 0,
      rezzedMatchingIceCount: 1,
      countedMatchingIceCount: 1,
      gainedCredits: 1,
    });

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoices(state, "corp", [
      `card_${firstHiddenWallId}`,
      `card_${secondHiddenWallId}`,
    ]);

    expect(state.cardInstances[firstHiddenWallId]?.faceup).toBe(true);
    expect(state.cardInstances[firstHiddenWallId]?.rezzed).toBe(false);
    expect(state.cardInstances[secondHiddenWallId]?.faceup).toBe(true);
    expect(state.cardInstances[secondHiddenWallId]?.rezzed).toBe(false);
    expect(state.cardInstances[codeGateId]?.faceup).toBe(false);
    expect(state.corp.credits).toBe(beforeChoiceCredits + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "superior_net_barriers_reveal_walls",
      agendaAbility: "superior_net_barriers",
      revealedCount: 2,
      rezzedMatchingIceCount: 1,
      countedMatchingIceCount: 3,
      gainedCredits: 3,
    });
    expect(
      String(state.eventLog.at(-1)?.publicPayload.publicRevealDefinitionIds),
    ).toContain("onr_v1_279_wall-of-static");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_code_gate_ice",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("requires 1 agenda point to rez ACME Savings and Loan", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-rez-cost-no-agenda"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) ===
            "onr_v1_308_acme-savings-and-loan",
      ),
    ).toBe(false);
  });

  it("makes the Corp lose at end of turn when an ACME obligation cannot be paid", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-unpaid-loss"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );

    state.corp.credits = 0;
    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("obligation_debt_unpaid");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "end_turn",
      obligationDebtAbility: "end_of_turn_payment",
      obligationDebtPaymentFailed: true,
      gameEndReason: "obligation_debt_unpaid",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
  });

  it("lets the Corp pay 12 credits to remove an ACME obligation and score 1 agenda point", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-remove-obligation"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.obligationDebtAbility === "remove_obligation",
    );

    expect(state.corp.credits).toBe(creditsBefore - 12);
    expect(state.activeObligationDebtCount).toBe(0);
    expect(state.corpBonusAgendaPoints).toBe(1);
    expect(agendaPoints(state, "corp")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      obligationDebtAbility: "remove_obligation",
      obligationDebtPaymentPaid: 12,
      gainedAgendaPoints: 1,
      obligationDebtCountAfter: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("revalidates ACME removal actions for side, stale state and active obligation", () => {
    let state = apply(
      v195CardReleaseGame("v195-acme-removal-revalidation"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, "onr_v1_203_hostile-takeover");
    moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_308_acme-savings-and-loan",
    );
    const removeAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.obligationDebtAbility === "remove_obligation",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: removeAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v195-acme-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: removeAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v195-acme-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const noObligation = structuredClone(state);
    noObligation.activeObligationDebtCount = 0;
    const missingObligation = applyAction(noObligation, {
      matchId: noObligation.matchId,
      side: "corp",
      actionId: removeAction.actionId,
      clientKnownStateVersion: noObligation.stateVersion,
      idempotencyKey: "v195-acme-no-obligation",
    });
    expect(missingObligation.ok).toBe(false);
    if (!missingObligation.ok)
      expect(missingObligation.error.code).toBe("ERR_UNKNOWN_ACTION");
  });
});

describe("V1.9.6 Mechanikpaket O", () => {
  it("adds the V1.9.6 Data Raven core card and validates smoke decks", () => {
    expect(ONR_V1_9_6_FINAL_CARD_IDS).toHaveLength(1);
    const definition = DEMO_CARDS_BY_ID["onr_v1_236_data-raven"];
    expect(definition?.implementationStatus).toBe("playable_mvp");
    expect(definition?.mechanics.join(" ")).toMatch(/trace/);
    expect(definition?.mechanics.join(" ")).toMatch(/counter/);
    expect(definition?.mechanics.join(" ")).not.toMatch(
      /v2|matchmaking|ranking/,
    );
    expect(
      validateDeckDefinition(ONR_V1_9_6_RUNNER_DECK, { expectedSide: "runner" })
        .ok,
    ).toBe(true);
    expect(
      validateDeckDefinition(ONR_V1_9_6_CORP_DECK, {
        expectedSide: "corp",
        minimumAgendaPoints: 7,
      }).ok,
    ).toBe(true);
  });

  it("adds a Data Raven counter after a successful trace and applies the next Runner-start tag", () => {
    let state = toRunnerTurn(v196CardReleaseGame("v196-data-raven"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_236_data-raven");

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
        sourceDefinition(state, action) === "onr_v1_236_data-raven",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    const corpBid =
      state.pendingChoice?.options.find((option) => option.id === "bid_0") ??
      state.pendingChoice?.options[0];
    expect(corpBid).toBeDefined();
    state = applyChoice(state, "corp", String(corpBid?.id));
    const runnerBid =
      state.pendingChoice?.options.find((option) => option.id === "bid_0") ??
      state.pendingChoice?.options[0];
    expect(runnerBid).toBeDefined();
    state = applyChoice(state, "runner", String(runnerBid?.id));

    expect(cardCounterAmount(state, state.runner.identity, "data_raven")).toBe(1);
    expect(state.runner.tags).toBe(1);

    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 1;
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runner.tags).toBe(2);
    expect(cardCounterAmount(state, state.runner.identity, "data_raven")).toBe(1);
  });
});

describe("V1.9.7 Mechanikpaket P", () => {
  it("adds Afreet as a playable daemon host and validates smoke decks", () => {
    expect(ONR_V1_9_7_FINAL_CARD_IDS).toHaveLength(1);
    const definition = DEMO_CARDS_BY_ID["onr_v1_001_afreet"];
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
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/break/);
      expect(definition?.mechanics.join(" "), definitionId).toMatch(/pump/);
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
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.type, definitionId).toBe("upgrade");
      expect(definition?.mechanics.join(" "), definitionId).not.toMatch(
        /v2|matchmaking|ranking/,
      );
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_349_aardvark"]?.mechanics.join(" "),
    ).toMatch(/worm/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_351_bizarre-encryption-scheme"]?.mechanics.join(
        " ",
      ),
    ).toMatch(/delayed_agenda_score/);
    expect(
      DEMO_CARDS_BY_ID["onr_v1_352_chester-mix"]?.mechanics.join(" "),
    ).toMatch(/ice_install_cost_mod_server/);
    expect(DEMO_CARDS_BY_ID["onr_v1_352_chester-mix"]?.rulesText).toContain(
      "reduced by 2",
    );
    expect(DEMO_CARDS_BY_ID["onr_v1_353_chimera"]?.mechanics.join(" ")).toMatch(
      /daemon_trash_choice/,
    );
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
    addInstalledRunnerProgramForTest(state, "onr_v1_073_wizards-book", "wizard");
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
    addRezzedCorpRootForTest(state, "onr_v1_359_jenny-jett", "remote_1", "jenny");
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
    expect(state.corp.credits).toBe(20);
    expect(state.corp.hq).not.toContain(hqIceId);
    expect(state.corp.servers.find((server) => server.id === "remote_1")?.ice[0]).toBe(
      hqIceId,
    );

    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.run?.successful).toBe(false);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toMatchObject({ phase: "access", successful: true });
    expect(state.corp.archives).not.toContain(hqIceId);
    expect(state.corp.servers.find((server) => server.id === "remote_1")?.ice).toContain(
      hqIceId,
    );
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
    const fortressId = putCorpRootInRemote(state, "onr_v1_324_fortress-architects");
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
      String(sameFortInstall.payload?.iceInstallReductionSourceDefinitionIds).split(
        ",",
      ),
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
    putCorpRootInRemote(state, "onr_v1_353_chimera");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
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
