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
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

function testCreditGain(state: GameState) {
  return (side: Side, amount: number) => {
    if (side === "corp") state.corp.credits += amount;
    else state.runner.credits += amount;
    return {
      creditedAmount: amount,
      creditsAfter: side === "corp" ? state.corp.credits : state.runner.credits,
      publicPayload: {
        gainedCredits: amount,
        [side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"]:
          side === "corp" ? state.corp.credits : state.runner.credits,
      },
    };
  };
}

describe("V1.6.2 Mechanikpaket B", () => {
  it("adds a controlled V1.6.2 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_2_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|uninstall_runner_program|subtype_noisy/,
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_212_priority-requisition"],
    ).toMatchObject({
      advancementRequirement: 5,
      agendaPoints: 3,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_215_security-net-optimization"],
    ).toMatchObject({ advancementRequirement: 5, agendaPoints: 3 });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_317_data-masons"]).toMatchObject({
      rezCost: 1,
      trashCost: 1,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_320_encoder-inc"]).toMatchObject({
      rezCost: 0,
      trashCost: 1,
      rulesText: expect.stringContaining("cost 1 less to rez"),
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_320_encoder-inc"]?.rulesText,
    ).toContain("additional");
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
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
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_254_liche"]).toBeDefined();
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
      {
        sourceCardId: state.runner.identity,
        controller: "runner",
        gainCredits: testCreditGain(state),
      },
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
      {
        sourceCardId: state.corp.identity,
        controller: "corp",
        gainCredits: testCreditGain(state),
      },
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
      {
        sourceCardId: state.runner.identity,
        controller: "runner",
        gainCredits: testCreditGain(state),
      },
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
    const state = createGameAfterSetup({
      seed: "card-effect-add-bad-publicity",
    });
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
          CARD_DEFINITIONS_BY_ID.simple_agenda ??
          Object.values(CARD_DEFINITIONS_BY_ID)[0]!,
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
        addRunnerTagsWithPrevention: (amount) => {
          state.runner.tags += amount;
          return false;
        },
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
          zone:
            side === "runner"
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
        gainCredits: testCreditGain(state),
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
        {
          sourceCardId: state.runner.identity,
          controller: "runner",
          drawCards,
        },
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
        {
          sourceCardId: state.runner.identity,
          controller: "runner",
          drawCards,
        },
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
        action.type === "rez_card" &&
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
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 30;
      const dataMasonsId = putCorpRootInRemote(state, "onr_v1_317_data-masons");
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
    ).toBe(
      (CARD_DEFINITIONS_BY_ID["onr_v1_232_crystal-wall"]?.strength ?? 0) + 1,
    );
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
    ).toBe(
      (CARD_DEFINITIONS_BY_ID["onr_v1_232_crystal-wall"]?.strength ?? 0) + 1,
    );
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
    ).toBe(CARD_DEFINITIONS_BY_ID["onr_v1_230_cortical-scanner"]?.strength);
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
    ).toBe(CARD_DEFINITIONS_BY_ID["onr_v1_232_crystal-wall"]?.strength);
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
        action.type === "rez_card" &&
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
        action.type === "rez_card" &&
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
      hiddenZoneAction: "scored_agenda_free_rez",
      scoredAgendaFreeRezFreeRez: true,
      scoredAgendaFreeRezTargetDefinitionId: "onr_v1_230_cortical-scanner",
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
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
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
          action.type === "install_card" && action.source === decoderId,
      );
      state.runner.credits = 20;
      state.runner.clicks = 4;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      return passCorpApproachRezWindowIfOpen(
        apply(state, "corp", (action) => action.type === "rez_ice"),
      );
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
      mustAction(
        nonCodeGate,
        "runner",
        (action) => action.type === "continue_run",
      ).payload?.unbrokenSubroutineCount,
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
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
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
          action.type === "install_card" && action.source === decoderId,
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
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([3]);
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
      mustAction(
        otherFort,
        "runner",
        (action) => action.type === "continue_run",
      ).payload?.unbrokenSubroutineCount,
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
    const resolvedEffects =
      state.eventLog.at(-1)?.publicPayload.resolvedEffects;
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
