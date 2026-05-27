import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import aiDeckPoolData from "../../../data/ai/ai-deck-pool-1.0.1.json";
import selfplayExploitLeagueData from "../../../data/ai/ai-selfplay-exploit-league-2026-05-17.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import {
  createRuntimeCardsById,
  activeAiApprovedCardIds,
  ACTIVE_CARD_SUPPORT_AI_GROUPS,
  type CatalogCard,
} from "@netgrid/catalog";
import {
  applyAction,
  applyEffectCommands,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { MECHANIC_SMOKE_DECKS } from "../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  AI_DECISION_INPUT_TOP_LEVEL_FIELDS,
  assertAiInputIsSideSafe,
  analyzeDoctrineQualityCases,
  beliefStateInvariantSignature,
  buildAiDecisionInputDto,
  buildDeckDoctrineProfile,
  buildObservedFacts,
  buildAiDecisionInput,
  assessCorpFutureRunIcePlacement,
  chooseAiAction,
  chooseCorpBaselineAction,
  chooseCorpAction,
  chooseCorpPlanDecision,
  classifyTagPunishLegalActionFromOntology,
  classifyScoredAgendaActionFromOntology,
  estimateBreakerCostProfileFromOntology,
  estimateStructuredBreakerCostForIce,
  getStructuredRemoteRoleForCard,
  structuredRemoteRoleSafetyAssessmentForCard,
  chooseRunnerBaselineAction,
  corpPlanUsesOnlyAiSupportedCards,
  chooseRunnerPlanDecision,
  estimateRunCost,
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
  evaluateCorpPlan,
  evaluateRunnerEarlyTurnDoctrine,
  evaluateRunnerPlan,
  evaluateAgendaRisk,
  evaluateCorpScoringProgress,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateRemoteRezReserve,
  evaluateRemoteScoreHorizon,
  evaluateRunnerContestCapacity,
  evaluateScoringWindow,
  evaluateServerThreat,
  evaluateCorpScoringThreat,
  evaluateDoctrineQualityGate,
  evaluateRemoteThreat,
  evaluateRunnerRig,
  evaluateServerAccessValue,
  evaluateV143TuningGate,
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
  benchmarkDeckFromLocalEditableDeck,
  formatMatchProgressionBenchmarkSuiteReport,
  listMatchProgressionBenchmarkDeckSlots,
  listV143BenchmarkProfiles,
  listV143ExploitFixtures,
  createBeliefSimulationWorld,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  formatDoctrineQualityBenchmarkReport,
  formatDoctrineQualityCaseAnalysisReport,
  formatMatchProgressionBenchmarkReport,
  generateCorpPlanCandidates,
  generateRunnerPlanCandidates,
  runnerPlanUsesOnlyAiSupportedCards,
  reconstructBeliefState,
  chooseRunnerAction,
  selectAiDecisionSideForState,
  simulateAiGame,
  simulateAiSoak,
  summarizeDoctrineQualityMetrics,
  summarizeMatchProgressionMetrics,
  type AiSimulationSummary,
} from "./index";
import {
  assessKnownRezzedIcePath,
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  endTheRunSubroutineCount,
  minimumCreditsToBreakEndTheRunSubroutines,
} from "./visible-run-analysis";
import type {
  AiDeckDoctrineProfile,
  AiDecisionDebug,
  AiDecisionInput,
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  CreateGameConfig,
  DeckDefinition,
  GameState,
  LegalAction,
  PublicGameEvent,
  Side,
  VisibleCard,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  DEMO_CARDS_BY_ID,
  sanitizeAiDecisionDebug,
} from "@netgrid/shared";

describe("MVP 0.3 AI controller contract", () => {
  afterEach(() => {
    delete DEMO_CARDS_BY_ID.test_hidden_runner_resource_harness;
    delete DEMO_CARDS_BY_ID.test_planless_corp_operation;
    delete DEMO_CARDS_BY_ID.test_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_alpha_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_zeta_planless_runner_resource;
    delete DEMO_CARDS_BY_ID.test_zeta_planless_corp_operation;
  });

  it("builds side-neutral AI inputs without FullState or forbidden transport fields", () => {
    const state = createGameAfterSetup({ seed: "ai-contract" });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });

    expect(corpInput.side).toBe("corp");
    expect(runnerInput.side).toBe("runner");
    expect(Object.keys(corpInput).sort()).toEqual(
      AI_DECISION_INPUT_TOP_LEVEL_FIELDS.filter(
        (field) => field !== "ownDeckDoctrine",
      ).sort(),
    );
    expect(Object.keys(runnerInput).sort()).toEqual(
      AI_DECISION_INPUT_TOP_LEVEL_FIELDS.filter(
        (field) => field !== "ownDeckDoctrine",
      ).sort(),
    );
    expect(corpInput.legalActions).toEqual(getLegalActions(state, "corp"));
    expect(runnerInput.playerView).toEqual(getPlayerView(state, "runner"));
    expect(JSON.stringify(corpInput)).not.toContain("cardInstances");
    expect(JSON.stringify(corpInput)).not.toContain("sessionToken");
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("keeps release-default profile policy stable", () => {
    const state = createGameAfterSetup({ seed: "ai-release-default-policy" });
    const corpInput = buildAiDecisionInput(state, "corp");
    const runnerInput = buildAiDecisionInput(state, "runner");
    const benchmarkProfiles = listV143BenchmarkProfiles().map(
      (profile) => profile.benchmarkProfileId,
    );
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      maxActions: 1,
      comparisonProfiles: ["belief_ai_v1_4_2", "current_candidate"],
    });

    expect(corpInput.profileId).toBe("corp-ai-v0.9-normal");
    expect(runnerInput.profileId).toBe("runner-ai-v0.9-normal");
    expect(benchmarkProfiles).toContain("belief_ai_v1_4_2");
    expect(benchmarkProfiles).toContain("current_candidate");
    expect(benchmark.baselineProfile).toBe("belief_ai_v1_4_2");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.profileComparisons.map((entry) => entry.profile)).toEqual([
      "belief_ai_v1_4_2",
      "current_candidate",
    ]);
  });

  it("redacts hidden Runner Resources in Corp AIInput before reveal", () => {
    const hiddenResourceDefinitionId = "test_hidden_runner_resource_harness";
    const hiddenResourceTitle = "Hidden Resource Harness";
    DEMO_CARDS_BY_ID[hiddenResourceDefinitionId] ??= {
      id: hiddenResourceDefinitionId,
      title: hiddenResourceTitle,
      side: "runner",
      type: "resource",
      subtypes: ["hidden"],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText:
        "Harness-only hidden Runner resource for side-safe install and trash tests.",
      mechanics: [
        "install_resource",
        "resource",
        "hidden_runner_resource_foundation",
        "test_fixture",
      ],
    } satisfies CardDefinition;
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-hidden-runner-resource" }),
    );
    state.runner.credits = 6;
    const hiddenResourceId = "runner_test_hidden_resource_harness_0";
    state.cardInstances[hiddenResourceId] = {
      instanceId: hiddenResourceId,
      definitionId: hiddenResourceDefinitionId,
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.runner.grip.unshift(hiddenResourceId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === hiddenResourceId,
    );
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const hiddenSlot = corpInput.playerView.opponent.rig?.find(
      (card) => card.known === false,
    );
    const inputJson = JSON.stringify(corpInput);

    expect(hiddenSlot).toMatchObject({
      known: false,
      type: "resource",
      subtypes: ["hidden_runner_resource"],
      owner: "runner",
      controller: "runner",
    });
    expect(hiddenSlot?.instanceId).toMatch(/^hidden_runner_resource_/);
    expect(hiddenSlot?.instanceId).not.toBe(hiddenResourceId);
    expect(corpInput.legalActions).toContainEqual(
      expect.objectContaining({
        type: "trash_resource",
        label: "Verdeckte Runner-Resource trashen",
        payload: expect.objectContaining({
          hiddenResourceSlotId: hiddenSlot?.instanceId,
          redactedKind: "hidden_runner_resource",
        }),
      }),
    );
    expect(inputJson).toContain("hidden_runner_resource");
    expect(inputJson).not.toContain(hiddenResourceDefinitionId);
    expect(inputJson).not.toContain(hiddenResourceTitle);
    expect(inputJson).not.toContain(hiddenResourceId);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
  });

  it("constructs AI inputs from positive DTO fields for both perspectives", () => {
    const state = createGameAfterSetup({ seed: "ai-positive-dto" });
    const runnerPlayerView = structuredClone(
      getPlayerView(state, "runner"),
    ) as ReturnType<typeof getPlayerView> & { secretRunnerHandIds?: string[] };
    runnerPlayerView.secretRunnerHandIds = ["hidden-runner-card-id"];
    (
      runnerPlayerView.own as typeof runnerPlayerView.own & {
        secretGripIds?: string[];
      }
    ).secretGripIds = ["hidden-grip-id"];
    (
      runnerPlayerView.own.identity as VisibleCard & {
        secretIdentityToken?: string;
      }
    ).secretIdentityToken = "hidden-identity-token";
    const runnerEvents = runnerPlayerView.publicEvents.map((event) => ({
      ...event,
      secretEventIds: ["hidden-event-id"],
      privatePayload: {
        runner: { secretRunnerHandIds: ["hidden-event-card-id"] },
      },
    }));
    const runnerLegalActions = getLegalActions(state, "runner").map(
      (action) => ({
        ...action,
        secretPaymentToken: "hidden-action-token",
      }),
    );

    const runnerInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: runnerPlayerView,
      eventTail: runnerEvents,
      legalActions: runnerLegalActions,
      difficulty: "normal",
      seed: state.seed,
      decisionId: "ai-positive-dto:runner",
      actionNumber: state.stateVersion,
      profileId: "runner-ai-v0.9-normal",
    });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedRunner = JSON.stringify(runnerInput);

    expect(serializedRunner).not.toContain("secretRunnerHandIds");
    expect(serializedRunner).not.toContain("hidden-grip-id");
    expect(serializedRunner).not.toContain("hidden-identity-token");
    expect(serializedRunner).not.toContain("hidden-event-id");
    expect(serializedRunner).not.toContain("hidden-action-token");
    expect(
      runnerInput.eventTail.some((event) => "privatePayload" in event),
    ).toBe(false);
    expect(
      runnerInput.legalActions.some((action) => "secretPaymentToken" in action),
    ).toBe(false);
    expect(Object.keys(corpInput).sort()).toEqual(
      AI_DECISION_INPUT_TOP_LEVEL_FIELDS.filter(
        (field) => field !== "ownDeckDoctrine",
      ).sort(),
    );
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
  });

  it("redacts nested forbidden DTO payload fields through allowlisted shapes for both perspectives", () => {
    for (const side of ["runner", "corp"] as const) {
      const state =
        side === "runner"
          ? toRunnerTurn(
              createGameAfterSetup({ seed: `ai-nested-dto-${side}` }),
            )
          : createGameAfterSetup({ seed: `ai-nested-dto-${side}` });
      const playerView = structuredClone(getPlayerView(state, side));
      const baseAction = getLegalActions(state, side)[0];
      if (!baseAction) throw new Error(`Missing ${side} LegalAction`);
      playerView.pendingChoice = {
        choiceId: `ai_nested_choice_${side}`,
        side,
        source: "ai_nested_payload_allowlist",
        prompt: "Side-safe test choice",
        kind: "select_option",
        options: [
          {
            id: "safe_option",
            label: "Safe option",
            publicLabel: "Safe option",
            value: {
              privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            } as unknown as string,
            selectable: true,
            card: {
              instanceId: "visible-test-card",
              known: true,
              title: "Visible Test Card",
              definitionId: "simple_run_event",
              type: "event",
              privateTitle: "Hidden Priority Agenda",
            } as VisibleCard & { privateTitle: string },
            privatePayload: { sessionToken: "hidden-session-token" },
          } as NonNullable<
            typeof playerView.pendingChoice
          >["options"][number] & {
            privatePayload: Record<string, unknown>;
          },
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: playerView.stateVersion,
        visibility: "private_to_side",
        stackSearchResolution: {
          reveal: "public",
          destination: "grip",
          shuffleAfter: true,
          publicRevealKind: "safe_reveal",
          privatePayload: { decklist: ["hidden-deck-card"] },
        } as NonNullable<
          typeof playerView.pendingChoice
        >["stackSearchResolution"] & {
          privatePayload: Record<string, unknown>;
        },
      };
      const eventTail: PublicGameEvent[] = [
        {
          eventId: `ai-nested-event-${side}`,
          type: "start_run",
          stateVersionBefore: state.stateVersion,
          stateVersionAfter: state.stateVersion + 1,
          stateHashAfter: "fnv1a:aiNestedDto",
          visibilityClass: "public",
          publicPayload: {
            actor: side,
            actionType: "start_run",
            serverId: "rd",
            abilityFamily: "run-access",
            abilityId: "ai_nested_safe_run",
            effectKind: "run",
            amounts: {
              randomRoll: 4,
              privatePayload: "hidden-roll-source",
            },
            targets: {
              serverLabel: "R&D",
              decklist: ["hidden-deck-card"],
            },
            visibility: {
              class: "public",
              hiddenZoneBarrier: true,
              privatePayload: "hidden-visibility",
            },
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
            decisionDebug: { hidden: "debug-hidden-card" },
            sessionToken: "hidden-session-token",
          },
        },
      ];
      const legalActions = [
        {
          ...baseAction,
          payload: {
            ...(baseAction.payload ?? {}),
            serverId: "rd",
            placement: "ice",
            encounterContinue: true,
            shellTradersAbility: "set_aside_from_grip",
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
            reconnectToken: "hidden-reconnect-token",
          },
        } as unknown as LegalAction,
      ];

      const input = buildAiDecisionInputDto({
        side,
        playerView,
        eventTail,
        legalActions,
        difficulty: "normal",
        seed: state.seed,
        decisionId: `ai-nested-dto:${side}`,
        actionNumber: state.stateVersion,
        profileId: `${side}-ai-v1.4.2-normal`,
      });
      const serialized = JSON.stringify(input);

      expect(input.legalActions[0]?.payload).toMatchObject({
        serverId: "rd",
        placement: "ice",
        encounterContinue: true,
        shellTradersAbility: "set_aside_from_grip",
      });
      expect(input.eventTail[0]?.publicPayload).toMatchObject({
        actor: side,
        actionType: "start_run",
        serverId: "rd",
        abilityFamily: "run-access",
        abilityId: "ai_nested_safe_run",
        effectKind: "run",
        amounts: { randomRoll: 4 },
        targets: { serverLabel: "R&D" },
        visibility: { class: "public", hiddenZoneBarrier: true },
      });
      expect(input.playerView.pendingChoice?.options[0]).toMatchObject({
        id: "safe_option",
        publicLabel: "Safe option",
        selectable: true,
        card: {
          instanceId: "visible-test-card",
          definitionId: "simple_run_event",
        },
      });
      expect(input.playerView.pendingChoice?.options[0]).not.toHaveProperty(
        "value",
      );
      expect(input.playerView.pendingChoice?.stackSearchResolution).toEqual({
        reveal: "public",
        destination: "grip",
        shuffleAfter: true,
        publicRevealKind: "safe_reveal",
      });
      expect(serialized).not.toMatch(
        /privatePayload|cardInstances|fullGameState|decisionDebug|decklist|sessionToken|reconnectToken|Hidden Priority Agenda|hidden-card|hidden-deck-card/i,
      );
      expect(assertAiInputIsSideSafe(input)).toBe(true);
    }
  });

  it("keeps AI choices stable when nested forbidden payload fields are injected", () => {
    for (const side of ["runner", "corp"] as const) {
      const state =
        side === "runner"
          ? toRunnerTurn(
              createGameAfterSetup({ seed: `ai-nested-choice-${side}` }),
            )
          : createGameAfterSetup({ seed: `ai-nested-choice-${side}` });
      const cleanInput = buildAiDecisionInput(state, side, {
        difficulty: "normal",
        profileId: `${side}-ai-v1.4.2-normal`,
      });
      const taintedPlayerView = {
        ...cleanInput.playerView,
        publicEvents: cleanInput.playerView.publicEvents.map((event) => ({
          ...event,
          publicPayload: {
            ...event.publicPayload,
            privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
            cardInstances: { hidden: { definitionId: "simple_agenda" } },
            fullGameState: { stateVersion: 999 },
          },
        })),
      };
      const taintedLegalActions = cleanInput.legalActions.map(
        (action) =>
          ({
            ...action,
            payload: {
              ...(action.payload ?? {}),
              privatePayload: { [side]: { gripOrHq: ["hidden-card"] } },
              cardInstances: { hidden: { definitionId: "simple_agenda" } },
              fullGameState: { stateVersion: 999 },
            },
          }) as unknown as LegalAction,
      );
      const taintedInput = buildAiDecisionInputDto({
        side,
        playerView: taintedPlayerView,
        eventTail: taintedPlayerView.publicEvents,
        legalActions: taintedLegalActions,
        difficulty: cleanInput.difficulty,
        seed: cleanInput.seed,
        decisionId: `${cleanInput.decisionId}:tainted`,
        actionNumber: cleanInput.actionNumber,
        profileId: cleanInput.profileId,
      });
      const cleanDecision = chooseAiAction(cleanInput);
      const taintedDecision = chooseAiAction(taintedInput);

      expect(taintedDecision.actionId).toBe(cleanDecision.actionId);
      expect(taintedDecision.reasonCode).toBe(cleanDecision.reasonCode);
      expect(JSON.stringify(taintedInput)).not.toMatch(
        /privatePayload|cardInstances|fullGameState|hidden-card/i,
      );
      expect(assertAiInputIsSideSafe(taintedInput)).toBe(true);
    }
  });

  it("marks longtail completion cards AI-supported after every promotion gate", () => {
    const cardsById = createRuntimeCardsById();
    const longtailCardIds = [
      "onr_v1_026_false-echo",
      "onr_v1_075_zetatech-software-installer",
      "onr_v1_298_planning-consultants",
    ];

    expect(activeAiApprovedCardIds).toEqual(
      expect.arrayContaining(longtailCardIds),
    );
    for (const cardId of longtailCardIds) {
      const runtimeCard = cardsById[cardId];
      expect(runtimeCard?.statuses.ai_supported ?? false, cardId).toBe(true);
      expect(runtimeCard?.statuses.human_playable ?? false, cardId).toBe(true);
      expect(runtimeCard?.statuses.deck_legal ?? false, cardId).toBe(true);
    }
  });

  it("resolves active AI-supported visible ICE and breakers for run analysis", () => {
    const cardsById = createRuntimeCardsById();
    const activeVisibleRunCards = Object.values(cardsById).filter(
      (card) =>
        card.statuses.ai_supported &&
        (card.type === "ice" || isRuntimeBreakerCard(card)),
    );
    const coverageRows = activeVisibleRunCards
      .map((card) => ({
        cardId: card.catalogCardId,
        engineCardId: card.engineCardId ?? card.catalogCardId,
        role: card.type === "ice" ? "ice" : "breaker",
        resolved: Boolean(
          DEMO_CARDS_BY_ID[card.engineCardId ?? card.catalogCardId],
        ),
        etrSubroutines:
          card.type === "ice"
            ? endTheRunSubroutineCount(card.catalogCardId)
            : 0,
        strength: cardDefinitionStrength(card.catalogCardId),
      }))
      .sort(
        (left, right) =>
          left.role.localeCompare(right.role) ||
          left.cardId.localeCompare(right.cardId),
      );
    const iceRows = coverageRows.filter((row) => row.role === "ice");
    const breakerRows = coverageRows.filter((row) => row.role === "breaker");

    expect(iceRows.length).toBeGreaterThan(0);
    expect(breakerRows.length).toBeGreaterThan(0);
    expect(iceRows.some((row) => row.etrSubroutines > 0)).toBe(true);
    expect(coverageRows.filter((row) => !row.resolved)).toEqual([]);
    expect(
      representativeVisibleRunPairs.map((pair) => ({
        role: pair.role,
        breakerId: pair.breakerId,
        iceId: pair.iceId,
        canBreak: canBreakerDefinitionBreakIce(pair.breakerId, pair.iceId),
      })),
    ).toEqual([
      {
        role: "barrier-wall with fracter",
        breakerId: "onr_v1_021_dwarf",
        iceId: "onr_v1_279_wall-of-static",
        canBreak: true,
      },
      {
        role: "code gate with decoder",
        breakerId: "onr_v1_014_codecracker",
        iceId: "onr_v1_261_quandary",
        canBreak: true,
      },
      {
        role: "sentry with killer",
        breakerId: "onr_v1_023_evil-twin",
        iceId: "onr_v1_259_in-the-face",
        canBreak: true,
      },
    ]);
  });

  it("assesses representative O:NR visible ICE and breakers from runtime card shapes", () => {
    const cardsById = createRuntimeCardsById();

    for (const pair of representativeVisibleRunPairs) {
      const ice = runtimeVisibleIce(cardsById[pair.iceId]);
      const breaker = runtimeVisibleBreaker(cardsById[pair.breakerId]);
      const endTheRunCount = endTheRunSubroutineCount(pair.iceId);
      const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
        ice,
        [breaker],
        endTheRunCount,
        new Map(),
      );
      const affordable = assessKnownRezzedIcePath(
        [ice],
        [breaker],
        pair.expectedCost,
      );
      const unaffordable = assessKnownRezzedIcePath(
        [ice],
        [breaker],
        pair.expectedCost - 1,
      );

      expect(endTheRunCount, pair.role).toBeGreaterThan(0);
      expect(breakAssessment, pair.role).toMatchObject({
        cost: pair.expectedCost,
        breakerInstanceId: breaker.instanceId,
        endingStrength: pair.expectedEndingStrength,
      });
      expect(affordable, pair.role).toMatchObject({
        blocked: false,
        visibleBreakCost: pair.expectedCost,
      });
      expect(unaffordable.blocked, pair.role).toBe(true);
      expect(unaffordable.visibleBreakCost, pair.role).toBe(pair.expectedCost);
    }
  });

  it("counts effective break and pay-or-end costs from an engine run quote", () => {
    const cardsById = createRuntimeCardsById();
    const effectiveRunQuote = {
      iceInstanceId: "ai_visible_crystal_wall",
      iceDefinitionId: "onr_v1_232_crystal-wall",
      effectiveStrength: 3,
      subroutines: [
        { id: "onr_v1_232_crystal_wall_etr", type: "end_the_run" },
        {
          id: "card_implementation.onr_v1_370_tesseract-fort-construction.additional_subroutine.1.end_the_run_unless_runner_pays",
          type: "end_the_run_unless_runner_pays",
          amount: 1,
          sourceDefinitionId: "onr_v1_370_tesseract-fort-construction",
          sourceTitle: "Tesseract Fort Construction",
          dynamicSourceKind: "additional_subroutine",
        },
      ],
      breakSubroutineAdditionalCostPerSubroutine: 1,
      breakSubroutineCostSourceDefinitionIds: [
        "onr_v1_355_crystal-palace-station-grid",
      ],
      breakSubroutineCostSourceTitles: ["Crystal Palace Station Grid"],
    } satisfies VisibleEffectiveIceRunQuote;
    const ice = {
      ...runtimeVisibleIce(cardsById["onr_v1_232_crystal-wall"]),
      effectiveRunQuote,
    };
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_021_dwarf"]);

    expect(assessKnownRezzedIcePath([ice], [breaker], 2)).toMatchObject({
      blocked: true,
      visibleBreakCost: 3,
    });
    expect(assessKnownRezzedIcePath([ice], [breaker], 3)).toMatchObject({
      blocked: false,
      visibleBreakCost: 3,
    });
  });

  it("projects known rezzed ICE paths sequentially through later ICE", () => {
    const cardsById = createRuntimeCardsById();
    const outerSentry = runtimeVisibleIce(cardsById["onr_v1_259_in-the-face"]);
    const innerCodeGate = runtimeVisibleIce(cardsById["onr_v1_261_quandary"]);
    const killer = runtimeVisibleBreaker(cardsById["onr_v1_023_evil-twin"]);
    const decoder = runtimeVisibleBreaker(cardsById["onr_v1_014_codecracker"]);

    expect(assessKnownRezzedIcePath([outerSentry], [killer], 4)).toEqual({
      blocked: false,
      visibleBreakCost: 3,
      canReachAccess: true,
      creditsAfterPath: 1,
      canBreakNextIceButNotFullPath: false,
      creditsSpentBeforeUnpayableIce: 0,
      assessedKnownIceCount: 1,
    });
    expect(assessKnownRezzedIcePath([innerCodeGate], [decoder], 4)).toEqual({
      blocked: false,
      visibleBreakCost: 2,
      canReachAccess: true,
      creditsAfterPath: 2,
      canBreakNextIceButNotFullPath: false,
      creditsSpentBeforeUnpayableIce: 0,
      assessedKnownIceCount: 1,
    });
    expect(
      assessKnownRezzedIcePath(
        [innerCodeGate, outerSentry],
        [killer, decoder],
        4,
      ),
    ).toEqual({
      blocked: true,
      visibleBreakCost: 5,
      canReachAccess: false,
      creditsAfterPath: -1,
      canBreakNextIceButNotFullPath: true,
      unpayableIceIndex: 0,
      creditsSpentBeforeUnpayableIce: 3,
      assessedKnownIceCount: 2,
      unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
    });
  });

  it("ignores visible root identities unless the engine exposes an effective quote", () => {
    const cardsById = createRuntimeCardsById();
    const ice = runtimeVisibleIce(cardsById["onr_v1_232_crystal-wall"]);
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_021_dwarf"]);
    const root = [
      {
        instanceId: "ai_unrezzed_tesseract",
        known: false,
        type: "upgrade",
        rezzed: false,
      },
    ] satisfies VisibleCard[];

    expect(assessKnownRezzedIcePath([ice], [breaker], 1, root)).toMatchObject({
      blocked: false,
      visibleBreakCost: 1,
    });
  });

  it("passes generic effective ICE quotes through AI input without hidden root leaks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-effective-run-quote-encoder",
        runnerDeck: batchARunnerDeck(),
        corpDeck: {
          id: "ai_effective_run_quote_encoder_corp",
          name: "AI Effective Run Quote Encoder Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_261_quandary", quantity: 1 },
            { id: "onr_v1_320_encoder-inc", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
      }),
    );
    ensureRemoteServer(state, "remote_1");
    const quandaryId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_261_quandary",
    );
    const encoderId = putCorpRootInRemote(state, "onr_v1_320_encoder-inc", 0);
    state.cardInstances[quandaryId] = {
      ...state.cardInstances[quandaryId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[encoderId] = {
      ...state.cardInstances[encoderId]!,
      faceup: true,
      rezzed: true,
    };

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const quote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )?.ice[0]?.effectiveRunQuote;
    expect(quote?.subroutines.map((subroutine) => subroutine.type)).toEqual([
      "end_the_run",
      "end_the_run",
    ]);
    expect(quote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_320_encoder-inc",
      sourceTitle: "Encoder, Inc.",
      dynamicSourceKind: "additional_subroutine",
    });

    state = structuredClone(state);
    state.cardInstances[encoderId] = {
      ...state.cardInstances[encoderId]!,
      faceup: false,
      rezzed: false,
    };
    const hiddenInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const hiddenQuote = hiddenInput.playerView.servers.find(
      (server) => server.id === "remote_1",
    )?.ice[0]?.effectiveRunQuote;
    const hiddenJson = JSON.stringify(hiddenInput);
    expect(
      hiddenQuote?.subroutines.some(
        (subroutine) =>
          subroutine.sourceDefinitionId === "onr_v1_320_encoder-inc",
      ),
    ).toBe(false);
    expect(hiddenJson).not.toContain("Encoder, Inc.");
    expect(hiddenJson).not.toContain("onr_v1_320_encoder-inc");
    expect(assertAiInputIsSideSafe(hiddenInput)).toBe(true);
  });

  it("counts Tutor's active run-duration subroutine in runner visible path costs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-visible-run-quote-tutor",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "ai_visible_run_quote_tutor_runner",
          name: "AI Visible Run Quote Tutor Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "ai_visible_run_quote_tutor_corp",
          name: "AI Visible Run Quote Tutor Corp",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    moveRunnerProgramToRig(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    for (const id of [innerWallId, tutorId]) {
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        faceup: true,
        rezzed: true,
      };
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const rdServer = input.playerView.servers.find(
      (server) => server.id === "rd",
    );
    const innerWallQuote = rdServer?.ice.find(
      (ice) => ice.instanceId === innerWallId,
    )?.effectiveRunQuote;

    expect(
      innerWallQuote?.subroutines.map((subroutine) => subroutine.type),
    ).toEqual(["end_the_run", "end_the_run"]);
    expect(innerWallQuote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_274_tutor",
      sourceTitle: "Tutor",
      dynamicSourceKind: "run_duration_additional_subroutine",
    });
    expect(
      assessKnownRezzedIcePath(
        rdServer?.ice ?? [],
        input.playerView.own.rig ?? [],
        1,
        rdServer?.root ?? [],
      ),
    ).toMatchObject({ blocked: true, visibleBreakCost: 2 });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("counts Virizz's active run-duration break tax in runner visible path costs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-visible-run-quote-virizz",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "ai_visible_run_quote_virizz_runner",
          name: "AI Visible Run Quote Virizz Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "ai_visible_run_quote_virizz_corp",
          name: "AI Visible Run Quote Virizz Corp",
          cards: [
            { id: "onr_v1_277_virizz", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    moveRunnerProgramToRig(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    for (const id of [innerWallId, virizzId]) {
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        faceup: true,
        rezzed: true,
      };
    }

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const rdServer = input.playerView.servers.find(
      (server) => server.id === "rd",
    );
    const innerWallQuote = rdServer?.ice.find(
      (ice) => ice.instanceId === innerWallId,
    )?.effectiveRunQuote;

    expect(innerWallQuote).toMatchObject({
      breakSubroutineAdditionalCostPerSubroutine: 1,
    });
    expect(
      assessKnownRezzedIcePath(
        rdServer?.ice ?? [],
        input.playerView.own.rig ?? [],
        1,
        rdServer?.root ?? [],
      ),
    ).toMatchObject({ blocked: true, visibleBreakCost: 2 });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("keeps active Tutor run-duration effects in later effective ICE quotes", () => {
    let state = runDurationIceEncounterState(
      "ai-effective-quote-active-tutor",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    state.runner.credits = 8;
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");

    state = startAndRezOuterIce(state, "rd", tutorId);
    state = continueRunAction(state);
    expect(state.run?.futureEncounterEndTheRunSourceIceId).toBe(tutorId);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const quote = input.playerView.servers
      .find((server) => server.id === "rd")
      ?.ice.find((ice) => ice.instanceId === wallId)?.effectiveRunQuote;

    expect(quote?.subroutines.map((subroutine) => subroutine.type)).toEqual([
      "end_the_run",
      "end_the_run",
    ]);
    expect(quote?.subroutines[1]).toMatchObject({
      sourceDefinitionId: "onr_v1_274_tutor",
      dynamicSourceKind: "run_duration_additional_subroutine",
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("breaks a visible Tutor run-duration subroutine when it would add an unaffordable future ETR", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-run-duration-must-break",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    state.runner.credits = 1;
    const rafflesId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_052_raffles",
    );
    if (!rafflesId) throw new Error("Missing Raffles");
    state.cardInstances[rafflesId] = {
      ...state.cardInstances[rafflesId]!,
      strengthModifier: 1,
    };

    state = startAndRezOuterIce(state, "rd", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("break_subroutine");
    expect(decision.reasonCode).toBe(
      "runner.encounter.break_run_remainder_effect",
    );
    expect(decision.evidence).toContain(
      "adds_future_end_the_run_subroutines:true",
    );
    expect(decision.evidence).toContain("run_remainder_effect_must_break:true");
  });

  it("lets a Tutor future-effect subroutine fire when Tutor is the last ICE", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-last-ice-no-future-effect",
      ["onr_v1_039_krash"],
      ["onr_v1_274_tutor", "simple_upgrade"],
    );
    moveRunnerCardToGrip(state, "onr_v1_039_krash");
    state = installRunnerCard(state, "onr_v1_039_krash");
    ensureRemoteServer(state, "remote_1");
    const tutorId = putCorpIceOnServer(state, "remote_1", "onr_v1_274_tutor");
    state.runner.credits = 12;

    state = startAndRezOuterIce(state, "remote_1", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    expect(selected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(decision.reasonCode);
    if (!pump || !continueRun)
      throw new Error("Missing Tutor last-ICE fixture actions");
    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    expect(baselineDecision.actionId).toBe(continueRun.actionId);
    expect(baselineDecision.evidence).toContain(
      "unbroken_run_effect_ignored_because_no_remaining_ice:true",
    );
    expect(baselineDecision.evidence).toContain(
      "future_effect_remaining_ice:0",
    );
    expect(baselineDecision.evidence).not.toContain(
      "run_remainder_effect_must_break:true",
    );
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("does not partially pump for a Tutor future-effect break that cannot be completed", () => {
    let state = runDurationIceEncounterState(
      "ai-tutor-future-effect-no-partial-pump",
      ["onr_v1_052_raffles", "onr_v1_031_hammer"],
      ["onr_v1_274_tutor", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_052_raffles");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_052_raffles");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    state.runner.credits = 2;

    state = startAndRezOuterIce(state, "rd", tutorId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_052_raffles",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(pump).toBeDefined();
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Tutor partial-pump fixture actions");

    const decision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("continue_run");
    expect(decision.reasonCode).toMatch(/^runner\.encounter\.continue/);
  });

  it("breaks a visible Virizz run-duration subroutine when future break taxes block the path", () => {
    let state = runDurationIceEncounterState(
      "ai-virizz-run-duration-must-break",
      ["onr_v1_015_codeslinger", "onr_v1_031_hammer"],
      ["onr_v1_277_virizz", "onr_v1_278_wall-of-ice"],
    );
    moveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_015_codeslinger");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_278_wall-of-ice");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    state.runner.credits = 3;
    for (const breakerId of state.runner.rig.programs) {
      const definitionId = state.cardInstances[breakerId]?.definitionId;
      if (definitionId === "onr_v1_015_codeslinger")
        state.cardInstances[breakerId] = {
          ...state.cardInstances[breakerId]!,
          strengthModifier: 1,
        };
      if (definitionId === "onr_v1_031_hammer")
        state.cardInstances[breakerId] = {
          ...state.cardInstances[breakerId]!,
          strengthModifier: 4,
        };
    }

    state = startAndRezOuterIce(state, "rd", virizzId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).toBe("break_subroutine");
    expect(decision.reasonCode).toBe(
      "runner.encounter.break_run_remainder_effect",
    );
    expect(decision.evidence).toContain("increases_future_break_cost:true");
    expect(decision.evidence).toContain("run_remainder_effect_must_break:true");
  });

  it("may continue through a visible run-duration subroutine when the future path stays affordable", () => {
    let state = runDurationIceEncounterState(
      "ai-run-duration-affordable-probe",
      ["onr_v1_031_hammer"],
      ["onr_v1_277_virizz", "onr_v1_279_wall-of-static"],
    );
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    state = installRunnerCard(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    state.cardInstances[wallId] = {
      ...state.cardInstances[wallId]!,
      faceup: true,
      rezzed: true,
    };
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    state.runner.credits = 8;

    state = startAndRezOuterIce(state, "rd", virizzId);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const continueRun = input.legalActions.find(
      (action) => action.type === "continue_run",
    );
    expect(continueRun).toBeDefined();
    if (!continueRun) throw new Error("Missing continue action");
    const decision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [continueRun],
    });

    expect(decision.actionId).toBe(continueRun.actionId);
    expect(decision.evidence).toContain("run_remainder_subroutine_effect:true");
    expect(decision.evidence).toContain(
      "future_path_blocked_if_unbroken:false",
    );
    expect(decision.evidence).not.toContain(
      "run_remainder_effect_must_break:true",
    );
  });

  it("keeps visible run analysis invariant across hidden-info variants", () => {
    const cardsById = createRuntimeCardsById();
    const ice = runtimeVisibleIce(cardsById["onr_v1_261_quandary"]);
    const breaker = runtimeVisibleBreaker(cardsById["onr_v1_014_codecracker"]);
    const hiddenIceVariant = {
      ...ice,
      hiddenDefinitionId: "simple_agenda",
      privatePayload: { corp: ["hidden-hq-card"] },
    } as typeof ice;
    const hiddenBreakerVariant = {
      ...breaker,
      privatePayload: { runner: ["hidden-stack-card"] },
    } as VisibleCard;

    expect(
      assessKnownRezzedIcePath([hiddenIceVariant], [hiddenBreakerVariant], 2),
    ).toEqual(assessKnownRezzedIcePath([ice], [breaker], 2));
  });

  it("keeps decisions deterministic and always chooses legal action ids", () => {
    const state = createGameAfterSetup({ seed: "ai-deterministic" });
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });

    const first = chooseAiAction(input);
    const second = chooseAiAction(input);

    expect(first).toEqual(second);
    expect(
      input.legalActions.some((action) => action.actionId === first.actionId),
    ).toBe(true);
    expect(first.reasonCode).toBe("corp.mandatory_draw");
    expect(first.explanation).not.toContain("Simple Fracter");
  });

  it("uses deterministic fallback when no heuristic matches", () => {
    const state = createGameAfterSetup({ seed: "ai-fallback" });
    const input = buildAiDecisionInput(state, "corp");
    const fallbackOnly = {
      ...input,
      legalActions: [
        {
          ...input.legalActions[0]!,
          type: "play_event" as const,
          actionId: "z.event",
        },
      ],
    };

    const decision = chooseCorpAction(fallbackOnly);

    expect(decision.actionId).toBe("z.event");
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
  });

  it("keeps V0.93 pending choices inside the side-safe LegalActions contract", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v093-choice" }),
    );
    state.pendingChoice = choiceRequest(state, "runner");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(input.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(decision.actionId).toBe(input.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: "choice_v093_runner",
      selectedOptionIds: ["keep"],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("cardInstances");
  });

  it("chooses search-card programs by visible value and ignores display-only options", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-search-choice-program-selection" }),
    );
    state.pendingChoice = {
      choiceId: "choice_search_program",
      side: "runner",
      source: "v1911.self_modifying_code_install_program:smc",
      prompt: "Programm aus dem Stack installieren",
      kind: "select_cards",
      options: [
        {
          id: "display_event",
          label: "Simple Economy Event",
          value: "event_1",
          selectable: false,
        },
        {
          id: "expensive_program",
          label: "Expensive Program",
          value: "expensive_1",
        },
        { id: "simple_decoder", label: "Simple Decoder", value: "decoder_1" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "private_to_side",
      stackSearchResolution: {
        reveal: "public",
        destination: "install_program",
        shuffleAfter: true,
      },
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const searchInput = {
      ...input,
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          credits: 3,
          memoryUsed: 0,
          memoryLimit: 4,
        },
        pendingChoice: {
          ...input.playerView.pendingChoice!,
          options: [
            {
              id: "display_event",
              label: "Simple Economy Event",
              value: "event_1",
              selectable: false,
              card: {
                instanceId: "event_1",
                known: true,
                title: "Simple Economy Event",
                definitionId: "simple_economy_event",
                type: "event" as const,
                cost: 0,
              },
            },
            {
              id: "expensive_program",
              label: "Expensive Program",
              value: "expensive_1",
              card: {
                instanceId: "expensive_1",
                known: true,
                title: "Expensive Program",
                definitionId: "expensive_program",
                type: "program" as const,
                installCost: 8,
                memoryCost: 6,
              },
            },
            {
              id: "simple_decoder",
              label: "Simple Decoder",
              value: "decoder_1",
              card: {
                instanceId: "decoder_1",
                known: true,
                title: "Simple Decoder",
                definitionId: "simple_decoder",
                type: "program" as const,
                subtypes: ["Icebreaker", "Decoder"],
                installCost: 2,
                memoryCost: 1,
              },
            },
          ],
        },
      },
    };

    const decision = chooseRunnerAction(searchInput);

    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: "choice_search_program",
      selectedOptionIds: ["simple_decoder"],
    });
    expect(JSON.stringify(decision)).not.toContain("display_event");
  });

  it("chooses a redundant low-value program for runner program install MU trash", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-redundant",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter", "v099_virus_program"],
        memoryUsed: 2,
        memoryLimit: 2,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [fixture.optionIdsByDefinition.v099_virus_program!],
    });
    expect(decision.evidence).toContain(
      "choice_source:runner_program_trash_before_install",
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload/,
    );
  });

  it("protects the only visible installed breaker during runner program install MU trash", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-protect-breaker",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter"],
        memoryUsed: 1,
        memoryLimit: 1,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("protected_icebreakers:1");
  });

  it("does not voluntarily trash installed programs when runner program install has enough MU", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-enough-mu",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["v099_virus_program"],
        memoryUsed: 1,
        memoryLimit: 4,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("memory_required:0");
  });

  it("avoids insufficient runner program install trash selections", () => {
    const fixture = runnerProgramTrashChoiceInput(
      "ai-program-install-trash-insufficient",
      {
        sourceDefinitionId: "simple_decoder",
        installedDefinitionIds: ["simple_fracter", "v099_virus_program"],
        memoryUsed: 2,
        memoryLimit: 1,
      },
    );

    const decision = chooseRunnerAction(fixture.input);

    expect(decision.selectedChoices).toEqual({
      choiceId: fixture.input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: [],
    });
    expect(decision.evidence).toContain("memory_required:2");
    expect(decision.evidence).toContain("protected_icebreakers:1");
  });

  it("uses The Shell Traders LegalActions and mandatory Shell-counter choices", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-shell-traders" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const prepare: LegalAction = {
      actionId: "runner.trigger_ability.shell_traders.prepare.simple_fracter",
      side: "runner",
      type: "trigger_ability",
      label: "The Shell Traders: Simple Fracter vorbereiten",
      source: "shell_traders_1",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: state.stateVersion,
      payload: {
        cardId: "shell_traders_1",
        shellTradersAbility: "set_aside_from_grip",
        targetCardId: "simple_fracter_1",
        shellCounterAmount: 2,
      },
    };
    const gain: LegalAction = {
      actionId: "runner.gain_credit.basic",
      side: "runner",
      type: "gain_credit",
      label: "1 Credit nehmen",
      source: "basic_action",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: state.stateVersion,
    };

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gain, prepare],
    });

    expect(decision.actionId).toBe(prepare.actionId);
    expect(decision.reasonCode).toBe("runner.shell_traders.prepare_install");

    state.pendingChoice = {
      choiceId: "choice_shell_traders",
      side: "runner",
      source: "v1912.shell_traders_start_turn:shell_traders_1:1",
      prompt: "The Shell Traders: 1 Shell-Counter entfernen",
      kind: "select_cards",
      options: [
        { id: "card_decoder", label: "Simple Decoder (3)", value: "decoder_1" },
        { id: "card_fracter", label: "Simple Fracter (1)", value: "fracter_1" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const choiceDecision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", { difficulty: "normal" }),
    );
    expect(choiceDecision.selectedChoices).toEqual({
      choiceId: "choice_shell_traders",
      selectedOptionIds: ["card_fracter"],
    });
  });

  it("plans installed The Shell Traders as build-rig progress before basic economy", () => {
    const input = runnerShellTradersInput(
      "ai-shell-traders-build-rig",
      (state) => {
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 1);
        moveRunnerCardToGrip(state, "simple_fracter");
        moveRunnerCardToGrip(state, "simple_setup_hardware");
        state.runner.credits = 0;
        state.runner.clicks = 3;
      },
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(prepare).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!prepare || !gainCredit)
      throw new Error("Missing Shell Traders fixture actions");

    const buildCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "build_rig",
    );
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gainCredit, prepare],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(buildCandidate?.legalActionIds).toContain(prepare.actionId);
    expect(decision.actionId).toBe(prepare.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders:true");
    expect(debugText).toContain("shell_traders_kind:prepare");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("uses The Shell Traders remove-counter actions to finish delayed installs", () => {
    let state = runnerShellTradersState("ai-shell-traders-finish-install");
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
    const fracterId = moveRunnerCardToGrip(state, "simple_fracter");
    state.runner.credits = 2;
    state.runner.clicks = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === fracterId,
    );
    setShellCountersForTest(state, fracterId, 1);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remove = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "remove_shell_counter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remove).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!remove || !gainCredit)
      throw new Error("Missing Shell-counter removal actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [gainCredit, remove],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(remove.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_kind:remove_counter");
    expect(debugText).toContain("shell_traders_immediate_install:true");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("finishes Shell Traders backlog before preparing more cards", () => {
    let state = runnerShellTradersState("ai-shell-traders-backlog-limit");
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
    moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 1);
    const firstTargetId = moveRunnerCardToGrip(state, "simple_fracter");
    const secondTargetId = moveRunnerCardCopyToGrip(state, "simple_fracter", [
      firstTargetId,
    ]);
    state.runner.credits = 4;
    state.runner.clicks = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === firstTargetId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip" &&
        action.payload?.targetCardId === secondTargetId,
    );
    setShellCountersForTest(state, firstTargetId, 1);
    setShellCountersForTest(state, secondTargetId, 2);
    moveRunnerCardToGrip(state, "simple_setup_hardware");
    state.runner.credits = 1;
    state.runner.clicks = 3;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remove = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "remove_shell_counter",
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remove).toBeDefined();
    expect(prepare).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!remove || !prepare || !gainCredit)
      throw new Error("Missing Shell Traders backlog fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [prepare, remove, gainCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(remove.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_kind:remove_counter");
    expect(debugText).toContain("shell_traders_backlog:2");
    expect(debugText).toContain("shell_traders_prepare_backlog_penalty:");
    expect(debugText).toContain("shell_traders_immediate_install:true");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("installs urgent Shell Traders targets directly when affordable", () => {
    const input = runnerShellTradersInput(
      "ai-shell-traders-direct-urgent",
      (state) => {
        moveRunnerResourceCopyToRig(state, "onr_v1_176_the-shell-traders", 0);
        moveRunnerCardToGrip(state, "simple_fracter");
        state.runner.credits = 5;
        state.runner.clicks = 3;
      },
    );
    const prepare = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.shellTradersAbility === "set_aside_from_grip" &&
        action.payload?.targetCardDefinitionId === "simple_fracter",
    );
    const directInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(prepare).toBeDefined();
    expect(directInstall).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!prepare || !directInstall || !gainCredit)
      throw new Error("Missing Shell Traders direct-install fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [prepare, directInstall, gainCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(directInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(debugText).toContain("shell_traders_direct_install_available:true");
    expect(debugText).toContain("shell_traders_direct_install_urgency:");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("resolves V1.9.9 Aardvark and Chimera choices through side-safe LegalActions", () => {
    const corpState = createGameAfterSetup({ seed: "ai-v199-aardvark-choice" });
    corpState.pendingChoice = {
      choiceId: `v199_aardvark_${corpState.stateVersion}`,
      side: "corp",
      source: "v199.aardvark:aardvark:worm:ice:pump_breaker:none:3",
      prompt: "Aardvark rezzen und Worm trashen?",
      kind: "select_option",
      options: [
        {
          id: "rez_trash_worm",
          label: "Aardvark rezzen",
          publicLabel: "Aardvark wird gerezzt",
          value: "rez_trash_worm",
        },
        {
          id: "decline",
          label: "Nicht rezzen",
          publicLabel: "Aardvark wird nicht gerezzt",
          value: "decline",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: corpState.stateVersion,
      visibility: "private_to_side",
    };
    const corpInput = buildAiDecisionInput(corpState, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);
    expect(corpDecision.reasonCode).toBe("corp.choice.resolve");
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: corpState.pendingChoice?.choiceId,
      selectedOptionIds: ["rez_trash_worm"],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);

    const runnerState = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v199-chimera-choice" }),
    );
    runnerState.pendingChoice = {
      choiceId: `v199_chimera_${runnerState.stateVersion}`,
      side: "runner",
      source: "v199.chimera_daemon_trash:chimera:1",
      prompt: "Daemon für Chimera trashen",
      kind: "select_cards",
      options: [
        {
          id: "card_afreet",
          label: "Afreet",
          publicLabel: "Daemon",
          value: "afreet_id",
        },
        {
          id: "card_succubus",
          label: "Succubus",
          publicLabel: "Daemon",
          value: "succubus_id",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: runnerState.stateVersion,
      visibility: "public",
    };
    const runnerInput = buildAiDecisionInput(runnerState, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: runnerState.pendingChoice?.choiceId,
      selectedOptionIds: ["card_afreet"],
    });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("chooses the conservative gain-all Playful AI split through LegalActions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v1921-playful-ai-choice" }),
    );
    state.pendingChoice = {
      choiceId: `v1921_playful_ai_${state.stateVersion}`,
      side: "runner",
      source: `v1921.playful_ai:playful:3:0:1:${state.stateVersion}`,
      prompt: "Playful AI: 3 Credits nehmen und/oder 3 Würfel beiseitelegen.",
      kind: "select_option",
      options: [
        {
          id: "gain_0_set_aside_3",
          label: "0 Credits nehmen, 3 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 0,
        },
        {
          id: "gain_1_set_aside_2",
          label: "1 Credit nehmen, 2 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 1,
        },
        {
          id: "gain_2_set_aside_1",
          label: "2 Credits nehmen, 1 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 2,
        },
        {
          id: "gain_3_set_aside_0",
          label: "3 Credits nehmen, 0 Würfel beiseitelegen",
          publicLabel: "Playful-AI-Aufteilung",
          value: 3,
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);
    expect(decision.reasonCode).toBe("runner.choice.resolve");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice.choiceId,
      selectedOptionIds: ["gain_3_set_aside_0"],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("keeps V0.94 Damage board states side-safe for AI input", () => {
    const state = applyEffectCommands(v094DamageGame("ai-v094-damage"), [
      {
        type: "do_damage",
        damageType: "meat",
        amount: 2,
        source: "ai_v094_smoke",
      },
    ]);
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const serialized = JSON.stringify(input);

    expect(input.playerView.opponent.discardCount).toBe(2);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("resolves V1.1.1 Discard choices deterministically from PlayerView and LegalActions", () => {
    let state = createGameAfterSetup({ seed: "ai-v111-discard" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const selectableOptionIds =
      input.playerView.pendingChoice?.options.map((option) => option.id) ?? [];
    const serializedRunner = JSON.stringify(
      buildAiDecisionInput(state, "runner", { difficulty: "normal" }),
    );

    expect(input.playerView.pendingChoice?.source).toBe("discard_phase");
    expect(input.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: [expect.any(String)],
    });
    const selectedDiscardChoices = decision.selectedChoices as
      | { selectedOptionIds: string[] }
      | undefined;
    const selectedDiscardOptionId =
      selectedDiscardChoices?.selectedOptionIds[0];
    expect(typeof selectedDiscardOptionId).toBe("string");
    expect(selectableOptionIds).toContain(selectedDiscardOptionId);
    expect(decision.evidence).toContain("discard_selection:keep_value");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serializedRunner).not.toContain(
      input.playerView.pendingChoice?.options[0]?.label ?? "not-present",
    );
    expect(serializedRunner).not.toContain("cardInstances");
  });

  it("uses discard keep values for Runner breaker and economy preservation", () => {
    const breakerInput = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event", "simple_run_event"],
    });
    const breakerDecision = chooseRunnerAction(breakerInput);
    const breakerSelectedChoices = breakerDecision.selectedChoices as
      | { selectedOptionIds: string[] }
      | undefined;

    expect(breakerSelectedChoices?.selectedOptionIds).toHaveLength(1);
    expect(breakerSelectedChoices?.selectedOptionIds[0]).not.toBe(
      "card_discard_simple_fracter_0",
    );
    expect(breakerDecision.evidence).toContain("discard_selection:keep_value");

    const lowCreditInput = discardDecisionInputForTest("runner", {
      credits: 1,
      cards: ["simple_economy_event", "simple_run_event"],
    });
    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expect(lowCreditDecision.selectedChoices).toEqual({
      choiceId: lowCreditInput.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("uses discard keep values for Corp agenda, ICE and economy preservation", () => {
    DEMO_CARDS_BY_ID.test_planless_corp_operation = {
      id: "test_planless_corp_operation",
      title: "Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard baseline fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("corp", {
      credits: 2,
      cards: [
        "simple_agenda",
        "simple_barrier_ice",
        "simple_economy_operation",
        "test_planless_corp_operation",
      ],
    });
    const decision = chooseCorpAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_planless_corp_operation_3"],
    });
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
    delete DEMO_CARDS_BY_ID.test_planless_corp_operation;
  });

  it("falls back to stable discard order when choice options do not map to own hand", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_economy_event"],
    });
    const choice = input.playerView.pendingChoice;
    if (!choice) throw new Error("Missing discard choice fixture");
    const fallbackInput = {
      ...input,
      playerView: {
        ...input.playerView,
        pendingChoice: {
          ...choice,
          options: [
            { id: "z_option", label: "Zeta", value: "missing_z" },
            { id: "a_option", label: "Alpha", value: "missing_a" },
          ],
        },
      },
    };

    expect(chooseRunnerAction(fallbackInput).selectedChoices).toEqual({
      choiceId: choice.choiceId,
      selectedOptionIds: ["a_option"],
    });
  });

  it("adds Runner rig-builder doctrine and planfit to discard keep values", () => {
    const doctrine = runnerDoctrineForTest(
      "discard-rig-builder",
      ["rig_builder"],
      { build_rig: 24, pressure_hq: -4 },
    );
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
      ownDeckDoctrine: doctrine,
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:doctrinefit",
        "discard_keep:build_rig",
        "discard_keep:doctrine_rig_builder",
      ]),
    );
  });

  it("keeps Runner central-pressure cards above off-plan economy when doctrine supports pressure", () => {
    const doctrine = runnerDoctrineForTest(
      "discard-hq-pressure",
      ["hq_pressure"],
      { pressure_hq: 24, build_rig: 2 },
    );
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_run_event", "simple_economy_event"],
      rig: ["simple_fracter"],
      ownDeckDoctrine: doctrine,
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_economy_event_1"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_keep:pressure_hq",
        "discard_keep:doctrine_hq_pressure",
      ]),
    );
  });

  it("keeps discard safety above doctrine pressure bias under Runner credit stress", () => {
    const doctrine = runnerDoctrineForTest(
      "discard-pressure-safety",
      ["hq_pressure"],
      { pressure_hq: 24 },
    );
    const input = discardDecisionInputForTest("runner", {
      credits: 1,
      cards: ["simple_economy_event", "simple_run_event"],
      rig: ["simple_fracter"],
      ownDeckDoctrine: doctrine,
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("adds Corp glacier doctrine and score-next-turn planfit to discard keep values", () => {
    DEMO_CARDS_BY_ID.test_planless_corp_operation = {
      id: "test_planless_corp_operation",
      title: "Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard doctrine fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const doctrine = corpDoctrineForTest("discard-glacier", ["glacier"], {
      score_next_turn: 18,
      build_scoring_remote: 24,
    });
    const input = discardDecisionInputForTest("corp", {
      credits: 4,
      cards: [
        "simple_agenda",
        "simple_barrier_ice",
        "simple_upgrade",
        "test_planless_corp_operation",
      ],
      ownDeckDoctrine: doctrine,
    });
    const decision = chooseCorpAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_planless_corp_operation_3"],
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:doctrinefit",
        "discard_keep:score_next_turn",
        "discard_keep:doctrine_glacier",
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("keeps discard choices deterministic for repeated Runner doctrine inputs", () => {
    const doctrine = runnerDoctrineForTest(
      "discard-determinism",
      ["rig_builder"],
      { build_rig: 24 },
    );
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
      ownDeckDoctrine: doctrine,
    });

    const first = chooseRunnerAction(input);
    const second = chooseRunnerAction(input);

    expect(second.selectedChoices).toEqual(first.selectedChoices);
    expect(second.evidence).toEqual(first.evidence);
  });

  it("keeps discard tie-break stable when mapped cards have equal keep values", () => {
    DEMO_CARDS_BY_ID.test_alpha_planless_runner_resource = {
      id: "test_alpha_planless_runner_resource",
      title: "Alpha Planless Runner Resource",
      side: "runner",
      type: "resource",
      subtypes: [],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText: "Discard tie fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    DEMO_CARDS_BY_ID.test_zeta_planless_runner_resource = {
      id: "test_zeta_planless_runner_resource",
      title: "Zeta Planless Runner Resource",
      side: "runner",
      type: "resource",
      subtypes: [],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText: "Discard tie fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: [
        "test_zeta_planless_runner_resource",
        "test_alpha_planless_runner_resource",
      ],
    });
    const decision = chooseRunnerAction(input);

    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_alpha_planless_runner_resource_1"],
    });
  });

  it("keeps discard evidence and debug output abstract and side-safe", () => {
    const doctrine = runnerDoctrineForTest(
      "discard-redaction",
      ["hq_pressure"],
      { pressure_hq: 24 },
    );
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_run_event", "simple_economy_event"],
      rig: ["simple_fracter"],
      ownDeckDoctrine: doctrine,
    });
    const decision = chooseRunnerAction(input);

    expect(JSON.stringify(decision.evidence)).not.toMatch(
      /simple_|cardInstances|privatePayload|fullGameState/i,
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "discard_score:base",
        "discard_score:planfit",
        "discard_score:doctrinefit",
      ]),
    );
  });

  it("shows Runner discard quality improves over stable first-option selection", () => {
    const input = discardDecisionInputForTest("runner", {
      credits: 5,
      cards: ["simple_fracter", "simple_run_event"],
    });
    const stableFirst = input.playerView.pendingChoice?.options
      .slice()
      .sort(
        (left, right) =>
          left.label.localeCompare(right.label, "de") ||
          left.id.localeCompare(right.id),
      )[0]?.id;
    const decision = chooseRunnerAction(input);

    expect(stableFirst).toBe("card_discard_simple_fracter_0");
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_simple_run_event_1"],
    });
  });

  it("shows Corp discard quality improves over stable first-option selection", () => {
    DEMO_CARDS_BY_ID.test_zeta_planless_corp_operation = {
      id: "test_zeta_planless_corp_operation",
      title: "Zeta Planless Corp Operation",
      side: "corp",
      type: "operation",
      subtypes: [],
      implementationStatus: "playable_mvp",
      cost: 1,
      rulesText: "Discard regression fixture with no AI roles.",
      mechanics: ["test_fixture"],
    } satisfies CardDefinition;
    const input = discardDecisionInputForTest("corp", {
      credits: 4,
      cards: ["simple_agenda", "test_zeta_planless_corp_operation"],
    });
    const stableFirst = input.playerView.pendingChoice?.options
      .slice()
      .sort(
        (left, right) =>
          left.label.localeCompare(right.label, "de") ||
          left.id.localeCompare(right.id),
      )[0]?.id;
    const decision = chooseCorpAction(input);

    expect(stableFirst).toBe("card_discard_simple_agenda_0");
    expect(decision.selectedChoices).toEqual({
      choiceId: input.playerView.pendingChoice?.choiceId,
      selectedOptionIds: ["card_discard_test_zeta_planless_corp_operation_1"],
    });
  });

  it("keeps V0.95 Resource trash decisions LegalActions-only and side-safe", () => {
    const state = installedResourceCorpTurn("ai-v095-resource");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const serialized = JSON.stringify(input);

    expect(
      input.legalActions.some((action) => action.type === "trash_resource"),
    ).toBe(true);
    expect(selected?.type).toBe("trash_resource");
    expect(decision.reasonCode).toBe("corp.tag.trash_visible_resource");
    expect(
      input.playerView.opponent.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
  });

  it("chooses V0.96 Trace bids from side-safe PlayerView choices", () => {
    let state = traceCorpBidState("ai-v096-trace");
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);

    expect(corpDecision.actionId).toBe(corpInput.legalActions[0]?.actionId);
    expect(corpDecision.reasonCode).toBe("corp.trace.bid_visible_amount");
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["bid_1"],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);

    const corpResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: corpDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(corpDecision.selectedChoices
        ? { selectedChoices: corpDecision.selectedChoices }
        : {}),
    });
    expect(corpResult.ok).toBe(true);
    if (!corpResult.ok) throw new Error(corpResult.error.message);
    state = corpResult.state;

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    expect(runnerDecision.reasonCode).toBe("runner.trace.bid_visible_amount");
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["bid_3"],
    });
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toContain("cardInstances");
    expect(JSON.stringify(runnerInput)).not.toContain("Simple Agenda");
  });

  it("chooses post-bid Trace Link sources after both bids are visible", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-post-bid-trace-link",
        runnerDeck: {
          id: "ai_post_bid_trace_runner",
          name: "AI Post-Bid Trace Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_063_signpost", quantity: 1 },
            { id: "onr_v1_181_the-springboard", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "ai_post_bid_trace_corp",
          name: "AI Post-Bid Trace Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_243_fetch-4-0-1", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.corp.credits = 5;
    const signpostId = moveRunnerProgramToRig(state, "onr_v1_063_signpost");
    const springboardId = moveRunnerResourceToRig(
      state,
      "onr_v1_181_the-springboard",
    );
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_243_fetch-4-0-1");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", ["bid_0"]);
    state = applyChoice(state, "runner", ["bid_0"]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
    });
    const decision = chooseRunnerAction(input);

    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining([
        "pass",
        `trace_link_${signpostId}`,
        `trace_link_${springboardId}`,
      ]),
    );
    expect(decision.reasonCode).toBe("runner.trace.post_bid_link");
    expect(decision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: [`trace_link_${signpostId}`],
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toContain("cardInstances");
  });

  it("keeps V0.97 breach queues hidden and chooses access from LegalActions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v097-breach",
        runnerDeckId: "demo_runner_097",
        corpDeckId: "demo_corp_097",
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    moveRunnerCardToGrip(state, "v097_deep_dive_event");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v097_deep_dive_event" &&
        action.payload?.serverId === "rd",
    );

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);
    const serialized = JSON.stringify(input);

    expect(input.playerView.run?.breach?.remainingCount).toBe(2);
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("access_card");
    expect(decision.reasonCode).toBe("runner.access.open_card");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("Simple Agenda");
    expect(serialized).not.toContain("Simple Economy Operation");
  });

  it("keeps V0.98 hidden-zone choices side-safe for AI inputs", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v098-hidden-zone",
        runnerDeckId: "demo_runner_098",
        corpDeckId: "demo_corp_098",
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    putRunnerCardOnTopOfStack(state, "simple_decoder");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_search_event",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpSerialized = JSON.stringify(corpInput);

    expect(
      runnerInput.playerView.pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(
      runnerInput.legalActions.find(
        (action) => action.actionId === runnerDecision.actionId,
      )?.type,
    ).toBe("resolve_choice");
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(corpSerialized).not.toContain("Simple Decoder");
    expect(corpSerialized).not.toContain("cardInstances");
  });

  it("answers Too Many Doors secret-spend choices side-safely", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v1911-too-many-doors",
        runnerDeck: V1911_RUNNER_DECK,
        corpDeck: V1911_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_272_too-many-doors");
    const secondCardId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    const firstCardId = putCorpCardOnTopOfRd(
      state,
      "onr_v1_203_hostile-takeover",
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
        sourceDefinition(state, action) === "onr_v1_272_too-many-doors",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const corpDecision = chooseCorpAction(corpInput);
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    void firstCardId;
    void secondCardId;
    const corpSpendOneOption = corpInput.playerView.pendingChoice?.options.find(
      (option) => option.value === 1,
    );

    expect(corpInput.playerView.pendingChoice?.source).toContain(
      "p3_56.too_many_doors_secret_spend",
    );
    expect(corpInput.playerView.pendingChoice?.kind).toBe("bid_amount");
    expect(corpInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(corpDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: corpSpendOneOption ? [corpSpendOneOption.id] : [],
    });
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(runnerInput.playerView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerInput)).not.toContain("Hostile Takeover");
    expect(JSON.stringify(runnerInput)).not.toContain(
      "Simple Economy Operation",
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: corpDecision.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(corpDecision.selectedChoices
        ? { selectedChoices: corpDecision.selectedChoices }
        : {}),
      idempotencyKey: `corp-${state.stateVersion}-${corpDecision.actionId}`,
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  });

  it("keeps V0.99 hosting choices side-safe and lets Corp AI choose legal Purge", () => {
    let hostingState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-hosting",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(hostingState, "v099_host_resource");
    moveRunnerCardToGrip(hostingState, "simple_decoder");
    hostingState = apply(
      hostingState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(hostingState, action) === "v099_host_resource",
    );

    const runnerInput = buildAiDecisionInput(hostingState, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(hostingState, "corp", {
      difficulty: "normal",
    });

    expect(
      runnerInput.playerView.pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(
      runnerInput.legalActions.find(
        (action) => action.actionId === runnerDecision.actionId,
      )?.type,
    ).toBe("resolve_choice");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(corpInput.legalActions).toEqual([]);
    expect(JSON.stringify(corpInput)).not.toContain("Simple Decoder");

    let purgeState = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v099-purge",
        runnerDeckId: "demo_runner_099",
        corpDeckId: "demo_corp_099",
        agendaPointsToWin: 7,
      }),
    );
    purgeState.runner.credits = 3;
    moveRunnerCardToGrip(purgeState, "v099_virus_program");
    purgeState = apply(
      purgeState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(purgeState, action) === "v099_virus_program",
    );
    purgeState.activeSide = "corp";
    purgeState.phase = "corp_action_phase";
    purgeState.timingPoint = "corp_action.main";
    purgeState.corp.clicks = 3;

    const purgeInput = buildAiDecisionInput(purgeState, "corp", {
      difficulty: "normal",
    });
    const purgeDecision = chooseCorpAction(purgeInput);
    expect(
      purgeInput.legalActions.find(
        (action) => action.actionId === purgeDecision.actionId,
      )?.type,
    ).toBe("purge_virus_counters");
    expect(purgeDecision.reasonCode).toBe("corp.purge.visible_virus_counters");
    expect(assertAiInputIsSideSafe(purgeInput)).toBe(true);
  });
});

describe("MVP 0.3 Runner AI", () => {
  it("prioritizes accessing and stealing a visible agenda", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-runner-steal" }));
    putCorpCardOnTopOfRd(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const decision = chooseRunnerAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("steal_agenda");
    expect(decision.explanation).not.toContain("corp_simple_agenda");
  });

  it("distinguishes easy and normal pressure choices", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-difficulty" }),
    );
    const input = buildAiDecisionInput(state, "runner", { difficulty: "easy" });
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const run = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gain).toBeDefined();
    expect(run).toBeDefined();
    if (!gain || !run) throw new Error("Missing fixture actions");

    const easy = chooseRunnerAction({
      ...input,
      difficulty: "easy",
      legalActions: [gain, run],
    });
    const normal = chooseRunnerAction({
      ...input,
      difficulty: "normal",
      legalActions: [gain, run],
    });

    expect(easy.actionId).toBe(gain.actionId);
    expect(normal.actionId).toBe(run.actionId);
  });

  it("uses public remote root and ICE counts before choosing run targets", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-empty-remote" }),
    );
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const emptyRemoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(emptyRemoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!emptyRemoteRun || !rdRun)
      throw new Error("Missing run fixture actions");

    const emptyOnly = chooseRunnerAction({
      ...input,
      legalActions: [emptyRemoteRun],
    });
    const betterTarget = chooseRunnerAction({
      ...input,
      legalActions: [emptyRemoteRun, rdRun],
    });

    expect(emptyOnly.reasonCode).toBe("runner.plan.safe_probe_run");
    expect(emptyOnly.evidence).toContain("ice_count:1");
    expect(emptyOnly.evidence).toContain("root_count:0");
    expect(betterTarget.actionId).toBe(rdRun.actionId);
  });

  it("treats multiple remote root cards as public pressure without learning identities", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-remote-counts" }),
    );
    putCorpRootInRemote(state, "simple_agenda", 0);
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(remoteRun).toBeDefined();
    if (!remoteRun) throw new Error("Missing remote run fixture action");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun],
    });
    const serializedDecision = JSON.stringify(decision);

    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
    expect(decision.decisionDebug).toMatchObject({
      aiLevel: 2,
      planKind: "contest_remote",
    });
    expect(decision.evidence).toContain("root_count:2");
    expect(serializedDecision).not.toContain("Simple Agenda");
    expect(serializedDecision).not.toContain("Simple Economy Asset");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("backs off from a visibly blocked rezzed ICE run when setup alternatives exist", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-rezzed-ice-loop" }),
    );
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    state.corp.credits = 5;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const blockedRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(blockedRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!blockedRun || !gain) throw new Error("Missing fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [blockedRun, gain],
    });
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rnd-runner",
      side: "runner",
      cards: [
        { cardId: "simple_run_event", quantity: 9 },
        { cardId: "simple_fracter", quantity: 3 },
        { cardId: "simple_economy_event", quantity: 3 },
      ],
    });
    const doctrineDecision = chooseRunnerAction({
      ...input,
      ownDeckDoctrine: doctrine,
      legalActions: [blockedRun, gain],
    });

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(doctrineDecision.actionId).toBe(gain.actionId);
    expect(doctrineDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(doctrineDecision.decisionDebug)).toContain(
      "ownDeckDoctrine",
    );
    expect(JSON.stringify(doctrineDecision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event/,
    );
  });

  it("backs off from HQ when the visible sentry breaker cannot pay the rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hq-pi-face-credit-block",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 0;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain) throw new Error("Missing HQ blocker fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:3");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("backs off when the visible multi-ICE path costs more than the Runner can pay", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hq-multi-ice-credit-block",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: [
            ...ONR_V1_1_2K_CORP_DECK.cards,
            { id: "simple_sentry_ice", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const innerIceId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_259_in-the-face",
    );
    const outerIceId = putCorpIceOnServer(state, "hq", "simple_sentry_ice");
    state.cardInstances[innerIceId] = {
      ...state.cardInstances[innerIceId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[outerIceId] = {
      ...state.cardInstances[outerIceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 3;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing multi-ICE HQ fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:6");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("backs off from a Crystal Wall remote when Tesseract and Crystal Palace make the visible path unaffordable", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-tesseract-crystal-palace-remote-cost",
        runnerDeck: batchARunnerDeck(),
        corpDeck: {
          id: "ai_tesseract_crystal_palace_corp",
          name: "AI Tesseract Crystal Palace Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_021_dwarf",
    );
    ensureRemoteServer(state, "remote_1");
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
    for (const rootId of [
      putCorpRootInRemote(state, "onr_v1_355_crystal-palace-station-grid", 0),
      putCorpRootInRemote(state, "onr_v1_370_tesseract-fort-construction", 0),
    ]) {
      state.cardInstances[rootId] = {
        ...state.cardInstances[rootId]!,
        faceup: true,
        rezzed: true,
      };
    }
    state.runner.credits = 2;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing Tesseract/Crystal Palace fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate) throw new Error("Missing contest_remote candidate");
    const scopedInput = {
      ...input,
      ownDeckDoctrine: runnerDoctrineForTest(
        "runner-effective-outcome",
        ["balanced"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-effective-jack-out",
          input.playerView.stateVersion + 1,
          "runner",
          "jack_out",
          "remote_1",
        ),
      ],
      legalActions: [remoteRun, gain],
    };
    const runCost = estimateRunCost(scopedInput, contestCandidate);
    const outcomeScore = evaluateRunnerPlan(scopedInput, contestCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:3");
    expect(outcomeScore.evidence).toContain(
      "runner_jack_out_repeated_same_server_without_new_info:true",
    );
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("counts normal Codecracker pump costs once per visible ICE", () => {
    const input = codecrackerDoubleEndlessCorridorInput(
      "ai-codecracker-double-endless-low-credits",
      3,
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing Codecracker/Endless fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    const runCost = estimateRunCost(input, pressureCandidate);
    const decision = chooseRunnerAction({
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      legalActions: [rdRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:4");
    expect(runCost.evidence).toContain("blocked:true");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not mark the double Endless Corridor path blocked once Codecracker can pay both pumps", () => {
    const input = codecrackerDoubleEndlessCorridorInput(
      "ai-codecracker-double-endless-affordable",
      4,
    );
    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");

    const runCost = estimateRunCost(input, pressureCandidate);

    expect(runCost.reasons).not.toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:4");
    expect(runCost.evidence).toContain("blocked:false");
  });

  it("uses a short Runner two-turn economy intent before an unprofitable visible HQ run", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-two-turn-hq-economy-setup",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 2;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing two-turn economy fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(debugText).toContain("two_turn_run_intent_target:hq");
    expect(debugText).toContain("two_turn_run_intent_ready:false");
    expect(debugText).toContain("two_turn_run_intent_credits_needed:1");
    expect(debugText).toContain(
      "two_turn_run_intent_invalidates_on:target_credits_visible_ice_breakers",
    );
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("switches from the Runner two-turn economy intent to the target run after the visible threshold is met", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-two-turn-hq-economy-ready",
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_259_in-the-face");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    state.runner.credits = 3;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqRun || !gain)
      throw new Error("Missing two-turn ready fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(hqRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_hq");
    expect(debugText).toContain("two_turn_run_intent_target:hq");
    expect(debugText).toContain("two_turn_run_intent_ready:true");
    expect(debugText).toContain("two_turn_run_intent_credits_needed:0");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("hard Runner backs off from visibly unreachable protected remote roots", () => {
    const requiredCorpCards = [
      "onr_v1_279_wall-of-static",
      "onr_v1_371_tokyo-chiba-infighting",
      "onr_v1_208_on-call-solo-team",
    ];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-hard-remote-visible-block",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: corpDeckCards,
        },
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "simple_killer");
    state.runner.credits = 3;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    ensureRemoteServer(state, "remote_1");
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
    const tokyoId = putCorpRootInRemote(
      state,
      "onr_v1_371_tokyo-chiba-infighting",
      0,
    );
    state.cardInstances[tokyoId] = {
      ...state.cardInstances[tokyoId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpRootInRemote(state, "onr_v1_208_on-call-solo-team", 0);
    state.runner.credits = 0;
    state.corp.credits = 12;

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing blocked remote fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const recoverCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(contestCandidate).toBeDefined();
    expect(recoverCandidate).toBeDefined();
    if (!contestCandidate || !recoverCandidate)
      throw new Error("Missing blocked remote fixture candidates");
    const runCost = estimateRunCost(input, contestCandidate);
    const access = evaluateServerAccessValue(input, contestCandidate);
    const remoteThreat = evaluateRemoteThreat(input, contestCandidate);
    const contestScore = evaluateRunnerPlan(input, contestCandidate);
    const recoverScore = evaluateRunnerPlan(input, recoverCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gain],
    });

    expect(runCost.reasons).toContain("visible_ice_unaffordable_to_break");
    expect(runCost.evidence).toContain("visible_etr_break_cost:unavailable");
    expect(access.reasons).toContain("visible_run_path_blocked");
    expect(remoteThreat.reasons).toContain(
      "remote_threat_unreachable_by_visible_ice",
    );
    expect(contestScore.score).toBeLessThan(recoverScore.score);
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not take a current-baseline Archives run when visible Archives cards are low value", () => {
    const requiredCorpCards = [
      "onr_v1_281_accounts-receivable",
      "onr_v1_282_annual-reviews",
    ];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-stale-legacy-archives",
        corpDeck: { ...ONR_V1_1_2K_CORP_DECK, cards: corpDeckCards },
        agendaPointsToWin: 7,
        baseline: CURRENT_RULES_BASELINE,
      }),
    );
    expect(state.baseline).toStrictEqual(CURRENT_RULES_BASELINE);
    expect(state.baseline.engineSchemaVersion).toBe(
      CURRENT_RULES_BASELINE.engineSchemaVersion,
    );
    const accountsId = moveCorpCardToArchives(
      state,
      "onr_v1_281_accounts-receivable",
      true,
    );
    const hiddenId = moveCorpCardToArchives(
      state,
      "onr_v1_282_annual-reviews",
      true,
    );
    keepOnlyCorpArchivesCards(state, [accountsId, hiddenId]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(archivesRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!archivesRun || !gain)
      throw new Error("Missing current Archives fixture actions");

    const safeProbeCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "safe_probe_run",
    );
    expect(safeProbeCandidate).toBeDefined();
    if (!safeProbeCandidate)
      throw new Error("Missing safe_probe_run candidate");
    const safeProbeScore = evaluateServerAccessValue(input, safeProbeCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, gain],
    });

    expect(safeProbeScore.reasons).toContain("known_archives_access_not_fresh");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not value an open Archives asset as trashable access value", () => {
    const requiredCorpCards = ["simple_economy_asset"];
    const corpDeckCards = [
      ...ONR_V1_1_2K_CORP_DECK.cards,
      ...requiredCorpCards
        .filter(
          (id) => !ONR_V1_1_2K_CORP_DECK.cards.some((card) => card.id === id),
        )
        .map((id) => ({ id, quantity: 1 })),
    ];
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-open-archives-asset-no-trash-value",
        corpDeck: { ...ONR_V1_1_2K_CORP_DECK, cards: corpDeckCards },
        agendaPointsToWin: 7,
        baseline: CURRENT_RULES_BASELINE,
      }),
    );
    state.runner.credits = 5;
    const assetId = moveCorpCardToArchives(state, "simple_economy_asset", true);
    keepOnlyCorpArchivesCards(state, [assetId]);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(archivesRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!archivesRun || !gain)
      throw new Error("Missing open Archives asset fixture actions");

    const safeProbeCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "safe_probe_run",
    );
    expect(safeProbeCandidate).toBeDefined();
    if (!safeProbeCandidate)
      throw new Error("Missing open Archives safe_probe_run candidate");
    const safeProbeScore = evaluateServerAccessValue(input, safeProbeCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [archivesRun, gain],
    });

    expect(safeProbeScore.reasons).toContain("known_archives_access_not_fresh");
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("does not pump or repeat a remote run when the visible breaker cannot break the rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-crystal-wall-loop",
        runnerDeckId: "demo_runner_004",
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          cards: [
            ...ONR_V1_1_2K_CORP_DECK.cards,
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 8;
    state.corp.credits = 8;
    moveRunnerCardToGrip(state, "efficient_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "efficient_fracter",
    );
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "onr_v1_232_crystal-wall");

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
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );

    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = encounterInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "efficient_fracter",
    );
    const breakAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "efficient_fracter",
    );
    const encounterDecision = chooseRunnerAction(encounterInput);
    const encounterSelected = encounterInput.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );

    expect(pump).toBeUndefined();
    expect(breakAction).toBeUndefined();
    expect(encounterSelected?.type).toBe("continue_run");
    expect(encounterDecision.reasonCode).toBe("runner.plan.safe_probe_run");

    state = apply(state, "runner", (action) => action.type === "continue_run");
    const afterRunInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const repeatRemoteRun = afterRunInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = afterRunInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(repeatRemoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!repeatRemoteRun || !gain)
      throw new Error("Missing post-run fixture actions");

    const afterRunDecision = chooseRunnerAction({
      ...afterRunInput,
      legalActions: [repeatRemoteRun, gain],
    });

    expect(afterRunDecision.actionId).toBe(gain.actionId);
    expect(afterRunDecision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("breaks Filter directly with Krash and does not pump after the only subroutine is broken", () => {
    let state = krashFilterEncounterState("ai-krash-filter-direct-break");
    const encounterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = encounterInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "onr_v1_039_krash",
    );
    const breakAction = encounterInput.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(encounterInput, action) ===
          "onr_v1_039_krash",
    );
    const encounterDecision = chooseRunnerAction(encounterInput);
    const encounterSelected = encounterInput.legalActions.find(
      (action) => action.actionId === encounterDecision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeDefined();
    expect(encounterSelected?.type).toBe("break_subroutine");
    expect(encounterDecision.reasonCode).toBe("runner.encounter.break_etr");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_039_krash",
    );
    expect(state.run?.brokenSubroutineIndexes).toEqual([0]);

    const afterBreakInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const afterBreakPump = afterBreakInput.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(afterBreakInput, action) ===
          "onr_v1_039_krash",
    );
    const afterBreakContinue = afterBreakInput.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const afterBreakDecision = chooseRunnerAction(afterBreakInput);
    const afterBreakSelected = afterBreakInput.legalActions.find(
      (action) => action.actionId === afterBreakDecision.actionId,
    );

    expect(afterBreakPump).toBeUndefined();
    expect(afterBreakContinue?.payload?.unbrokenSubroutineCount).toBe(0);
    expect(afterBreakSelected?.type).toBe("continue_run");
    expect([
      "runner.encounter.continue",
      "runner.plan.safe_probe_run",
    ]).toContain(afterBreakDecision.reasonCode);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === afterBreakContinue?.actionId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      encounterContinue: true,
      unbrokenSubroutineCount: 0,
      encounterWillEndRun: false,
    });
  });

  it("does not pump Krash when Keeper remains unbreakable afterward", () => {
    const state = krashKeeperHqEncounterState("ai-krash-keeper-useless-pump");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const breakAction = input.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_039_krash",
    );
    const continueRun = input.legalActions.find(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeUndefined();
    expect(selected?.type).not.toBe("pump_breaker");
    expect(continueRun).toBeDefined();
    if (!pump || !continueRun)
      throw new Error("Missing Krash/Keeper fixture actions");

    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [pump, continueRun],
    });
    const baselineSelected = input.legalActions.find(
      (action) => action.actionId === baselineDecision.actionId,
    );
    expect(baselineSelected?.type).toBe("continue_run");
    expect(baselineDecision.reasonCode).toBe("runner.encounter.continue");
  });

  it("continues into R&D access after passing the last ICE instead of jacking out", () => {
    let state = krashFilterEncounterState("ai-krash-filter-access-after-pass");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_039_krash",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run?.phase).toBe("movement");
    expect(state.run?.position.kind).toBe("server");

    const movementInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const jackOut = movementInput.legalActions.find(
      (action) => action.type === "jack_out",
    );
    const continueRun = movementInput.legalActions.find(
      (action) => action.type === "continue_run",
    );
    const movementDecision = chooseRunnerAction(movementInput);
    const movementSelected = movementInput.legalActions.find(
      (action) => action.actionId === movementDecision.actionId,
    );

    expect(jackOut).toBeDefined();
    expect(continueRun).toBeDefined();
    expect(movementSelected?.type).toBe("continue_run");
    expect(movementDecision.reasonCode).toBe("runner.plan.safe_probe_run");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueRun?.actionId,
    );
    expect(state.timingPoint).toBe("access.resolve_card");

    const accessInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const accessDecision = chooseRunnerAction(accessInput);
    const accessSelected = accessInput.legalActions.find(
      (action) => action.actionId === accessDecision.actionId,
    );

    expect(
      accessInput.legalActions.some((action) => action.type === "jack_out"),
    ).toBe(false);
    expect(accessSelected?.type).toBe("access_card");
    expect(accessDecision.reasonCode).toBe("runner.access.open_card");
  });

  it("runs the Krash/Filter R&D path through sequential Runner AI decisions without hidden access assumptions", () => {
    let state = krashFilterEncounterState(
      "ai-krash-filter-sequenced-rd-access",
    );
    const actionTypes: string[] = [];
    const reasonCodes: string[] = [];

    for (let step = 0; step < 4; step += 1) {
      const input = buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.1-normal",
        decisionId: `krash-filter-rd-access:${step}`,
        actionNumber: step,
      });
      const decision = chooseRunnerAction(input);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      );
      expect(selected, `Missing selected action at step ${step}`).toBeDefined();
      if (!selected) throw new Error(`Missing selected action at step ${step}`);

      const serializedDecision = JSON.stringify({
        evidence: decision.evidence,
        decisionDebug: decision.decisionDebug,
        explanation: decision.explanation,
        reasonCode: decision.reasonCode,
      });
      expect(selected.type).not.toBe("jack_out");
      expect(serializedDecision).not.toMatch(
        /ambush|simple_economy_operation/i,
      );

      actionTypes.push(selected.type);
      reasonCodes.push(decision.reasonCode);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === selected.actionId,
      );
      if (selected.type === "access_card") break;
    }

    expect(actionTypes).toEqual([
      "break_subroutine",
      "continue_run",
      "continue_run",
      "access_card",
    ]);
    expect(reasonCodes[0]).toBe("runner.encounter.break_etr");
    expect(reasonCodes).toContain("runner.plan.safe_probe_run");
    expect(reasonCodes.at(-1)).toBe("runner.access.open_card");
    expect(
      state.eventLog.map((event) => event.publicPayload.actionType),
    ).not.toContain("jack_out");
  });

  it("still pumps when strength is the missing requirement for a useful break", () => {
    const state = weakFracterBarrierEncounterState("ai-useful-pump");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const pump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinitionFromInput(input, action) === "efficient_fracter",
    );
    const breakAction = input.legalActions.find(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinitionFromInput(input, action) === "efficient_fracter",
    );
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(pump).toBeDefined();
    expect(breakAction).toBeUndefined();
    expect(selected?.type).toBe("pump_breaker");
    expect(decision.reasonCode).toBe("runner.encounter.pump_breaker");
  });

  it("prioritizes removing public tags when legal", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "ai-remove-tag" }));
    state.runner.tags = 1;
    state.runner.credits = 2;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });

    const decision = chooseRunnerAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("remove_tag");
    expect(decision.explanation).not.toContain(
      "Simple Tag Punishment Operation",
    );
  });
});

describe("MVP 0.3 Corp AI v2", () => {
  it("prioritizes scoring an advanced remote agenda", () => {
    let state = createGameAfterSetup({ seed: "ai-corp-score" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 3;
    putCorpRootInRemote(state, "simple_agenda", 3);

    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const decision = chooseCorpAction(input);

    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("score_agenda");
    expect(decision.reasonCode).toBe("corp.plan.score_now");
    expect(decision.decisionDebug).toMatchObject({
      aiLevel: 2,
      planKind: "score_now",
      fallbackUsed: false,
    });
  });
});

describe("V1.4.0 plan-based Corp AI", () => {
  it("generates only current LegalAction-backed Corp plans", () => {
    let state = createGameAfterSetup({ seed: "ai-v140-generator" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 8;
    state.corp.clicks = 3;
    ensureRemoteServer(state, "remote_1");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    putCorpRootInRemote(state, "simple_agenda", 1);
    moveCorpCardToHq(state, "simple_agenda");
    moveCorpCardToHq(state, "simple_barrier_ice");
    moveCorpCardToHq(state, "simple_economy_operation");
    moveCorpCardToHq(state, "simple_economy_asset");
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const candidates = generateCorpPlanCandidates(input);
    const legalIds = new Set(
      input.legalActions.map((action) => action.actionId),
    );

    expect(candidates.map((candidate) => candidate.kind)).toEqual(
      expect.arrayContaining([
        "build_scoring_remote",
        "protect_hq",
        "protect_rnd",
        "recover_economy",
        "bait_runner",
      ]),
    );
    for (const candidate of candidates) {
      expect(
        candidate.legalActionIds.every((actionId) => legalIds.has(actionId)),
      ).toBe(true);
      expect(corpPlanUsesOnlyAiSupportedCards(input, candidate)).toBe(true);
    }
  });

  it("scores plan evaluators from visible PlayerView and public event data", () => {
    let state = createGameAfterSetup({ seed: "ai-v140-evaluators" });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 2;
    state.corp.clicks = 3;
    moveCorpCardToHq(state, "simple_barrier_ice");
    moveCorpCardToHq(state, "simple_economy_operation");
    const input = withPublicServerEventTail(
      buildAiDecisionInput(state, "corp", { difficulty: "normal" }),
      ["hq", "rd", "remote_1"],
    );
    const candidates = generateCorpPlanCandidates(input);
    const economy = candidates.find(
      (candidate) => candidate.kind === "recover_economy",
    );
    const hq = candidates.find((candidate) => candidate.kind === "protect_hq");

    expect(economy).toBeDefined();
    expect(hq).toBeDefined();
    if (!economy || !hq) throw new Error("Missing V1.4.0 evaluator fixtures");
    expect(evaluateEconomyReserve(input, economy).score).toBeGreaterThan(150);
    expect(evaluateServerThreat(input, hq).evidence).toContain("hq_runs:1");
    expect(evaluateIceRez(input, hq).reasons).toContain("ice_roles_available");
    expect(evaluateRemoteIntentMemory(input).remoteInstallSignals).toBe(1);
    expect(JSON.stringify(evaluateAgendaRisk(input, economy))).not.toContain(
      "cardInstances",
    );
    expect(JSON.stringify(evaluateScoringWindow(input, economy))).not.toContain(
      "privatePayload",
    );
  });

  it("selects score-next-turn, remote-build and economy-recovery plans in focused Corp fixtures", () => {
    const scoreNextInput = corpActionPhaseInput(
      "ai-v140-score-next",
      (state) => {
        state.corp.credits = 6;
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const remoteBuildInput = corpActionPhaseInput(
      "ai-v140-remote-build",
      (state) => {
        state.corp.credits = 7;
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const economyInput = corpActionPhaseInput("ai-v140-economy", (state) => {
      state.corp.credits = 1;
      moveCorpCardToHq(state, "simple_economy_operation");
    });

    expect(chooseCorpPlanDecision(scoreNextInput).debug.planKind).toBe(
      "score_next_turn",
    );
    expect(
      generateCorpPlanCandidates(remoteBuildInput).some(
        (candidate) => candidate.kind === "build_scoring_remote",
      ),
    ).toBe(true);
    expect(chooseCorpPlanDecision(economyInput).debug.planKind).toBe(
      "recover_economy",
    );
  });

  it("uses installed Corp economy payouts before the basic credit action", () => {
    const input = installedCorpBbsEconomyInput("ai-corp-installed-bbs-economy");
    const bbsTake = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_309_bbs-whispering-campaign",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(bbsTake).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!bbsTake || !basicCredit)
      throw new Error("Missing installed BBS economy fixture actions");
    expect(bbsTake.label).toContain("2 Credits nehmen");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, bbsTake],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(bbsTake.actionId);
    expect(decision.reasonCode).toBe("corp.plan.recover_economy");
    expect(debugText).toContain("installed_corp_economy:true");
    expect(debugText).toContain("installed_corp_economy_kind:pool_payout");
    expect(debugText).toContain("installed_corp_economy_immediate_gain:2");
    expect(debugText).toContain("installed_corp_economy_stored_credits:16");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("does not install Ball and Chain first on an empty remote when direct ICE is also installable", () => {
    const input = corpFutureIceOrderingInput("ai-corp-ball-empty-remote", [
      "onr_v1_222_ball-and-chain",
      "simple_barrier_ice",
      "simple_code_gate_ice",
    ]);
    const remoteIceActions = input.legalActions.filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        [
          "onr_v1_222_ball-and-chain",
          "simple_barrier_ice",
          "simple_code_gate_ice",
        ].includes(sourceDefinitionFromInput(input, action) ?? ""),
    );

    expect(remoteIceActions.length).toBeGreaterThanOrEqual(2);
    const ballAction = remoteIceActions.find(
      (action) =>
        sourceDefinitionFromInput(input, action) ===
        "onr_v1_222_ball-and-chain",
    );
    expect(ballAction).toBeDefined();
    const ballPlacement = assessCorpFutureRunIcePlacement(input, ballAction!);
    expect(ballPlacement).toMatchObject({
      installedOnEmptyServer: true,
      deadEffect: true,
    });
    expect(ballPlacement?.directImpactAlternativeCount).toBeGreaterThanOrEqual(
      2,
    );

    const decision = chooseCorpAction({
      ...input,
      legalActions: remoteIceActions,
    });
    const selected = remoteIceActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(sourceDefinitionFromInput(input, selected!)).not.toBe(
      "onr_v1_222_ball-and-chain",
    );
    expect(decision.reasonCode).toBe("corp.plan.build_scoring_remote");
  });

  it("allows Ball and Chain as outer ICE on an already iced remote", () => {
    const input = corpFutureIceOrderingInput(
      "ai-corp-ball-outer-remote",
      ["onr_v1_222_ball-and-chain"],
      (state) => {
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
      },
    );
    const ballAction = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_222_ball-and-chain",
    );

    expect(ballAction).toBeDefined();
    expect(assessCorpFutureRunIcePlacement(input, ballAction!)).toMatchObject({
      existingIceCount: 1,
      hasLaterIceAfterInstall: true,
      liveEffect: true,
    });

    const decision = chooseCorpAction({
      ...input,
      legalActions: [ballAction!],
    });

    expect(decision.actionId).toBe(ballAction!.actionId);
    expect(decision.reasonCode).toBe("corp.plan.build_scoring_remote");
  });

  it("prefers direct/direct/future order for a three-ICE remote build", () => {
    const firstInput = corpFutureIceOrderingInput("ai-corp-three-ice-first", [
      "onr_v1_222_ball-and-chain",
      "simple_barrier_ice",
      "simple_code_gate_ice",
    ]);
    const firstActions = firstInput.legalActions.filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        [
          "onr_v1_222_ball-and-chain",
          "simple_barrier_ice",
          "simple_code_gate_ice",
        ].includes(sourceDefinitionFromInput(firstInput, action) ?? ""),
    );
    const firstDecision = chooseCorpAction({
      ...firstInput,
      legalActions: firstActions,
    });
    const firstSelected = firstActions.find(
      (action) => action.actionId === firstDecision.actionId,
    );

    expect(sourceDefinitionFromInput(firstInput, firstSelected!)).not.toBe(
      "onr_v1_222_ball-and-chain",
    );

    const secondInput = corpFutureIceOrderingInput(
      "ai-corp-three-ice-second",
      ["onr_v1_222_ball-and-chain", "simple_code_gate_ice"],
      (state) => {
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
      },
    );
    const secondActions = secondInput.legalActions.filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        ["onr_v1_222_ball-and-chain", "simple_code_gate_ice"].includes(
          sourceDefinitionFromInput(secondInput, action) ?? "",
        ),
    );
    const secondDecision = chooseCorpAction({
      ...secondInput,
      legalActions: secondActions,
    });
    const secondSelected = secondActions.find(
      (action) => action.actionId === secondDecision.actionId,
    );

    expect(sourceDefinitionFromInput(secondInput, secondSelected!)).toBe(
      "onr_v1_222_ball-and-chain",
    );
  });

  it.each([
    ["onr_v1_225_canis-major", "corpCanisInstalledWithoutLaterIce"],
    ["onr_v1_226_canis-minor", "corpCanisInstalledWithoutLaterIce"],
    [
      "onr_v1_224_bolter-cluster",
      "corpBolterOrDataDartsInstalledWithoutNextIce",
    ],
    ["onr_v1_234_data-darts", "corpBolterOrDataDartsInstalledWithoutNextIce"],
  ])("diagnoses %s as dead on an empty remote", (definitionId, metric) => {
    const input = corpFutureIceOrderingInput(
      `ai-corp-future-empty-${definitionId}`,
      [definitionId],
    );
    const action = input.legalActions.find(
      (candidate) =>
        candidate.type === "install_card" &&
        candidate.payload?.placement === "ice" &&
        candidate.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, candidate) === definitionId,
    );

    expect(action).toBeDefined();
    expect(assessCorpFutureRunIcePlacement(input, action!)).toMatchObject({
      installedOnEmptyServer: true,
      deadEffect: true,
    });

    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("corp", 1, "install_card", "remote_1", 1, {
          installPlacement: "ice",
          corpFutureRunIceInstalled: true,
          corpFutureRunIceInstalledAsDeadEffect: true,
          corpFutureRunIceInstalledWithoutLaterIce: true,
          corpIceOrderFutureEffectDead: true,
          [metric]: true,
        }),
      ]),
    ]);

    expect(metrics.corpFutureRunIceInstalledAsDeadEffect).toBe(1);
    expect(metrics[metric as keyof typeof metrics]).toBe(1);
  });

  it("continues to allow direct ETR ICE and emergency future ICE installs on empty remotes", () => {
    const directInput = corpFutureIceOrderingInput(
      "ai-corp-direct-empty-allowed",
      ["simple_barrier_ice"],
    );
    const directAction = directInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(directInput, action) === "simple_barrier_ice",
    );
    expect(directAction).toBeDefined();
    expect(
      chooseCorpAction({ ...directInput, legalActions: [directAction!] })
        .actionId,
    ).toBe(directAction!.actionId);

    const emergencyInput = corpFutureIceOrderingInput(
      "ai-corp-future-emergency-empty",
      ["onr_v1_222_ball-and-chain"],
    );
    const emergencyAction = emergencyInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(emergencyInput, action) ===
          "onr_v1_222_ball-and-chain",
    );
    expect(emergencyAction).toBeDefined();
    expect(
      chooseCorpAction({ ...emergencyInput, legalActions: [emergencyAction!] })
        .actionId,
    ).toBe(emergencyAction!.actionId);
  });

  it("keeps Future ICE ordering diagnostics invariant to hidden Runner zones and sanitized", () => {
    const first = corpFutureIceOrderingInput("ai-corp-future-hidden-a", [
      "onr_v1_222_ball-and-chain",
      "simple_barrier_ice",
    ]);
    const second = {
      ...first,
      seed: "ai-corp-future-hidden-b",
    };
    const narrow = (input: AiDecisionInput) => ({
      ...input,
      legalActions: input.legalActions.filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "remote_1",
      ),
    });

    const firstDecision = chooseCorpAction(narrow(first));
    const secondDecision = chooseCorpAction(narrow(second));

    expect(firstDecision.reasonCode).toBe(secondDecision.reasonCode);
    expect(
      sourceDefinitionFromInput(
        first,
        first.legalActions.find(
          (action) => action.actionId === firstDecision.actionId,
        )!,
      ),
    ).toBe(
      sourceDefinitionFromInput(
        second,
        second.legalActions.find(
          (action) => action.actionId === secondDecision.actionId,
        )!,
      ),
    );
    expect(JSON.stringify(firstDecision.decisionDebug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState/i,
    );
  });

  it("keeps multiple installed Corp BBS economy actions source-bound above basic credit", () => {
    const input = installedCorpBbsEconomyInput(
      "ai-corp-multiple-installed-bbs-economy",
      [16, 16],
    );
    const bbsActions = input.legalActions.filter(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_309_bbs-whispering-campaign",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(bbsActions).toHaveLength(2);
    expect(new Set(bbsActions.map((action) => action.actionId)).size).toBe(2);
    expect(
      new Set(bbsActions.map((action) => String(action.source))).size,
    ).toBe(2);
    expect(
      bbsActions.every((action) => action.label.includes("2 Credits nehmen")),
    ).toBe(true);
    expect(basicCredit).toBeDefined();

    const decision = chooseCorpAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(bbsActions.map((action) => action.actionId)).toContain(
      decision.actionId,
    );
    expect(decision.actionId).not.toBe(basicCredit?.actionId);
    expect(decision.reasonCode).toBe("corp.plan.recover_economy");
    expect(debugText).toContain("installed_corp_economy:true");
    expect(debugText).toContain("installed_corp_economy_kind:pool_payout");
    expect(debugText).toContain("installed_corp_economy_immediate_gain:2");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("sees Political Overthrow scored-agenda LegalAction side-safely in Corp AIInput", () => {
    const { input, agendaId } = corpScoredAgendaAbilityInput(
      "ai-political-overthrow-visible",
      "onr_v1_210_political-overthrow",
    );
    const overthrow = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.source === agendaId &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_210_political-overthrow",
    );

    expect(overthrow).toBeDefined();
    expect(input.playerView.own.scoreArea).toContainEqual(
      expect.objectContaining({
        instanceId: agendaId,
        definitionId: "onr_v1_210_political-overthrow",
        title: "Political Overthrow",
      }),
    );
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(JSON.stringify(input)).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("classifies scored-agenda activated effects from read-only ontology hints", () => {
    expect(
      classifyScoredAgendaActionFromOntology("onr_v1_210_political-overthrow"),
    ).toEqual(
      expect.objectContaining({
        kind: "scored_agenda_economy",
        immediateGain: 3,
      }),
    );
    expect(
      classifyScoredAgendaActionFromOntology("onr_v1_193_corporate-coup"),
    ).toEqual(
      expect.objectContaining({
        kind: "scored_agenda_counter_economy",
        immediateGain: 3,
      }),
    );
    expect(
      classifyScoredAgendaActionFromOntology("onr_v1_199_employee-empowerment"),
    ).toEqual(
      expect.objectContaining({
        kind: "scored_agenda_draw",
        drawAmount: 2,
      }),
    );
    expect(
      classifyScoredAgendaActionFromOntology("onr_v1_192_corporate-boon"),
    ).toEqual(
      expect.objectContaining({
        kind: "scored_agenda_extra_action",
        gainedActions: 1,
      }),
    );
    expect(
      classifyScoredAgendaActionFromOntology(
        "onr_v1_188_ai-chief-financial-officer",
      ),
    ).toEqual(
      expect.objectContaining({
        kind: "scored_agenda_shuffle_draw",
        drawAmount: 5,
      }),
    );
  });

  it("uses Political Overthrow scored-agenda economy before basic credit", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-political-overthrow-economy",
      "onr_v1_210_political-overthrow",
      { credits: 1 },
    );
    const overthrow = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_210_political-overthrow",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(overthrow).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!overthrow || !basicCredit)
      throw new Error("Missing Political Overthrow economy fixture actions");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, overthrow],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(overthrow.actionId);
    expect(debugText).toContain("scored_agenda_action_taken:true");
    expect(debugText).toContain("political_overthrow_taken:true");
    expect(debugText).toContain("scored_agenda_economy_taken:true");
    expect(debugText).toContain("scored_agenda_ontology_present:true");
    expect(debugText).toContain(
      "scored_agenda_ontology_kind:scored_agenda_economy",
    );
    expect(debugText).toContain("scored_agenda_ontology_used:true");
    expect(debugText).not.toMatch(/cardInstances|privatePayload/i);
  });

  it("uses Political Overthrow repeatedly while clicks remain and no better tactic exists", () => {
    let { state } = corpScoredAgendaAbilityInput(
      "ai-political-overthrow-repeat",
      "onr_v1_210_political-overthrow",
      { credits: 0, clicks: 3 },
    );
    for (let index = 0; index < 2; index += 1) {
      const input = buildAiDecisionInput(state, "corp", {
        difficulty: "normal",
        profileId: "corp-ai-v1.4.2-normal",
      });
      const decision = chooseCorpAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(action?.type).toBe("activated_card_ability");
      expect(sourceDefinitionFromInput(input, action!)).toBe(
        "onr_v1_210_political-overthrow",
      );
      state = apply(
        state,
        "corp",
        (candidate) => candidate.actionId === decision.actionId,
      );
    }
  });

  it("lets score-now tactically override Political Overthrow economy", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-political-overthrow-score-override",
      "onr_v1_210_political-overthrow",
      {
        credits: 4,
        mutate: (state) => {
          state.corp.credits = 8;
          putCorpRootInRemote(state, "simple_agenda", 3);
        },
      },
    );
    const score = input.legalActions.find(
      (action) => action.type === "score_agenda",
    );
    const overthrow = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_210_political-overthrow",
    );
    expect(score).toBeDefined();
    expect(overthrow).toBeDefined();
    if (!score || !overthrow) throw new Error("Missing score override actions");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [overthrow, score],
    });
    expect(decision.actionId).toBe(score.actionId);
  });

  it("uses counter-economy scored agenda actions before basic credit", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-corporate-coup-counter-economy",
      "onr_v1_193_corporate-coup",
      { credits: 1, counters: { bit: 15 } },
    );
    const coup = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_193_corporate-coup",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(coup).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!coup || !basicCredit)
      throw new Error("Missing Corporate Coup counter economy fixture");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, coup],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(coup.actionId);
    expect(debugText).toContain("scored_agenda_counter_economy_taken:true");
  });

  it("values Marine Arcology economy with its two-action cost accounted for", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-marine-arcology-economy",
      "onr_v1_206_marine-arcology",
      { credits: 1, clicks: 3 },
    );
    const marine = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_206_marine-arcology",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(marine).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!marine || !basicCredit) throw new Error("Missing Marine fixture");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, marine],
    });
    expect(decision.actionId).toBe(marine.actionId);
  });

  it("uses Employee Empowerment draw before basic draw when draw is useful", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-employee-empowerment-draw",
      "onr_v1_199_employee-empowerment",
      { credits: 6 },
    );
    const empowerment = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_199_employee-empowerment",
    );
    const basicDraw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(empowerment).toBeDefined();
    expect(basicDraw).toBeDefined();
    if (!empowerment || !basicDraw)
      throw new Error("Missing Employee Empowerment fixture");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicDraw, empowerment],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(empowerment.actionId);
    expect(debugText).toContain("scored_agenda_draw_taken:true");
  });

  it("uses Corporate Boon extra-action ability as scored-agenda tempo", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-corporate-boon-extra-action",
      "onr_v1_192_corporate-boon",
      { credits: 4, counters: { boon: 4 } },
    );
    const boon = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_192_corporate-boon",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(boon).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!boon || !basicCredit)
      throw new Error("Missing Corporate Boon fixture");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, boon],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(boon.actionId);
    expect(debugText).toContain("scored_agenda_extra_action_taken:true");
  });

  it("uses tagged-runner damage agendas without hidden Runner hand data", () => {
    const { input } = corpScoredAgendaAbilityInput(
      "ai-on-call-solo-tagged-damage",
      "onr_v1_208_on-call-solo-team",
      { credits: 5, runnerTagged: true },
    );
    const damage = input.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_208_on-call-solo-team",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(damage).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!damage || !basicCredit)
      throw new Error("Missing damage agenda fixture");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [basicCredit, damage],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(damage.actionId);
    expect(debugText).toContain("scored_agenda_damage_punish_taken:true");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("keeps scored-agenda economy hidden-state invariant", () => {
    const first = corpScoredAgendaAbilityInput(
      "ai-scored-agenda-hidden-a",
      "onr_v1_210_political-overthrow",
      { credits: 1 },
    ).input;
    const secondFixture = corpScoredAgendaAbilityInput(
      "ai-scored-agenda-hidden-b",
      "onr_v1_210_political-overthrow",
      {
        credits: 1,
        mutate: (state) => {
          state.runner.stack.reverse();
          state.runner.grip.reverse();
        },
      },
    );
    const second = {
      ...secondFixture.input,
      seed: first.seed,
      decisionId: first.decisionId,
      actionNumber: first.actionNumber,
      legalActions: first.legalActions,
      playerView: {
        ...first.playerView,
        opponent: secondFixture.input.playerView.opponent,
      },
    };

    expect(chooseCorpAction(first).actionId).toBe(
      chooseCorpAction(second).actionId,
    );
  });

  it("ignores installed Corp BBS sources with too few stored credits", () => {
    const input = installedCorpBbsEconomyInput(
      "ai-corp-low-counter-installed-bbs-economy",
      [1, 16],
    );
    const bbsActions = input.legalActions.filter(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_309_bbs-whispering-campaign",
    );
    const sourceCards = new Map(
      input.playerView.servers
        .flatMap((server) => server.root)
        .map((card) => [card.instanceId, card]),
    );
    const fullBbsActions = bbsActions.filter((action) => {
      const sourceCard = sourceCards.get(String(action.source));
      return (sourceCard?.counters?.bit ?? 0) >= 2;
    });

    expect(bbsActions).toHaveLength(2);
    expect(fullBbsActions).toHaveLength(1);
    expect(chooseCorpAction(input).actionId).toBe(fullBbsActions[0]?.actionId);
  });

  it("recovers economy before low-reserve central ICE protection without urgent pressure", () => {
    const input = corpActionPhaseInput(
      "ai-v140-low-reserve-central-protect",
      (state) => {
        state.corp.credits = 1;
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const rdIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(rdIce).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdIce || !gain)
      throw new Error("Missing low-reserve central-protect fixture actions");

    const protectCandidate = generateCorpPlanCandidates({
      ...input,
      legalActions: [rdIce, gain],
    }).find((candidate) => candidate.kind === "protect_rnd");
    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [rdIce, gain],
    });

    expect(protectCandidate).toBeDefined();
    if (!protectCandidate) throw new Error("Missing protect_rnd candidate");
    expect(evaluateEconomyReserve(input, protectCandidate).reasons).toContain(
      "central_protect_credit_reserve_low",
    );
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
  });

  it("recovers economy before adding redundant central ICE at low reserve", () => {
    const input = withPublicServerEventTail(
      corpActionPhaseInput(
        "ai-v140-low-reserve-redundant-central-protect",
        (state) => {
          state.corp.credits = 1;
          putCorpIceOnServer(state, "hq", "simple_barrier_ice");
          moveCorpCardToHq(state, "simple_code_gate_ice");
        },
      ),
      ["hq", "hq"],
    );
    const hqIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(hqIce).toBeDefined();
    expect(gain).toBeDefined();
    if (!hqIce || !gain)
      throw new Error(
        "Missing low-reserve redundant central-protect fixture actions",
      );

    const protectCandidate = generateCorpPlanCandidates({
      ...input,
      legalActions: [hqIce, gain],
    }).find((candidate) => candidate.kind === "protect_hq");
    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [hqIce, gain],
    });

    expect(protectCandidate).toBeDefined();
    if (!protectCandidate) throw new Error("Missing protect_hq candidate");
    expect(evaluateEconomyReserve(input, protectCandidate).reasons).toContain(
      "central_protect_credit_reserve_low",
    );
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
  });

  it("builds deterministic deck doctrine profiles without raw private card state", () => {
    const profile = buildDeckDoctrineProfile(
      snapshotById("demo_corp_008_snapshot_v0_8"),
    );
    const second = buildDeckDoctrineProfile(
      snapshotById("demo_corp_008_snapshot_v0_8"),
    );
    const tagProfile = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-tag-corp",
      side: "corp",
      cards: [
        { cardId: "simple_tag_ice", quantity: 3 },
        { cardId: "onr_v1_249_hunter", quantity: 3 },
        { cardId: "onr_v1_236_data-raven", quantity: 3 },
        { cardId: "onr_v1_203_hostile-takeover", quantity: 3 },
      ],
    });

    expect(profile).toEqual(second);
    expect(profile.side).toBe("corp");
    expect(profile.archetypeTags.length).toBeGreaterThan(0);
    expect(profile.planWeights).not.toEqual({});
    expect(tagProfile.archetypeTags).toContain("tag_pressure");
    expect(JSON.stringify(profile)).not.toMatch(
      /cardInstances|privatePayload|sessionToken/,
    );

    const runnerProfile = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rnd-runner",
      side: "runner",
      cards: [
        { cardId: "simple_run_event", quantity: 6 },
        { cardId: "simple_fracter", quantity: 3 },
        { cardId: "simple_economy_event", quantity: 3 },
      ],
    });

    expect(runnerProfile.side).toBe("runner");
    expect(runnerProfile.archetypeTags.length).toBeGreaterThan(0);
    expect(runnerProfile.planWeights.pressure_rnd).toBeGreaterThan(0);
    expect(JSON.stringify(runnerProfile)).not.toMatch(
      /cardInstances|privatePayload|sessionToken/,
    );
  });

  it("uses deck doctrine as a bounded Corp plan weight", () => {
    const input = corpActionPhaseInput("ai-doctrine-plan-weight", (state) => {
      state.corp.credits = 7;
      putCorpRootInRemote(state, "simple_agenda", 2);
    });
    const candidate = generateCorpPlanCandidates(input).find(
      (plan) => plan.kind === "score_next_turn",
    );
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rush-corp",
      side: "corp",
      cards: [
        { cardId: "simple_agenda", quantity: 9 },
        { cardId: "simple_barrier_ice", quantity: 9 },
        { cardId: "simple_economy_operation", quantity: 6 },
      ],
    });

    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("Missing score_next_turn candidate");
    const neutralScore = evaluateCorpPlan(input, candidate).score;
    const doctrineScore = evaluateCorpPlan(
      { ...input, ownDeckDoctrine: doctrine },
      candidate,
    ).score;

    expect(doctrine.archetypeTags).toContain("rush");
    expect(doctrineScore).toBeGreaterThan(neutralScore);
  });

  it("keeps naked-agenda protection stronger than rush doctrine", () => {
    const input = corpActionPhaseInput(
      "ai-doctrine-naked-agenda-guard",
      (state) => {
        state.corp.credits = 7;
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rush-corp",
      side: "corp",
      cards: [
        { cardId: "simple_agenda", quantity: 9 },
        { cardId: "simple_barrier_ice", quantity: 9 },
        { cardId: "simple_economy_operation", quantity: 6 },
      ],
    });
    const nakedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const rdIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(nakedAgendaInstall).toBeDefined();
    expect(rdIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!nakedAgendaInstall || !rdIceInstall || !gain)
      throw new Error("Missing doctrine guard fixture actions");
    const decision = chooseCorpAction({
      ...input,
      ownDeckDoctrine: doctrine,
      legalActions: [nakedAgendaInstall, rdIceInstall, gain],
    });

    expect(decision.actionId).toBe(rdIceInstall.actionId);
    expect(decision.reasonCode).toBe("corp.plan.protect_rnd");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda_1/,
    );
  });

  it("uses visible Runner credits and breakers for protected remote scoring windows", () => {
    const lockedRunnerInput = corpActionPhaseInput(
      "ai-corp-contest-low",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const contestingRunnerInput = corpActionPhaseInput(
      "ai-corp-contest-high",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const lockedCandidate = generateCorpPlanCandidates(lockedRunnerInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const contestingCandidate = generateCorpPlanCandidates(
      contestingRunnerInput,
    ).find((candidate) => candidate.kind === "build_scoring_remote");

    expect(lockedCandidate).toBeDefined();
    expect(contestingCandidate).toBeDefined();
    if (!lockedCandidate || !contestingCandidate)
      throw new Error("Missing Corp remote scoring candidates");

    const lockedCapacity = evaluateRunnerContestCapacity(
      lockedRunnerInput,
      "remote_1",
    );
    const contestingCapacity = evaluateRunnerContestCapacity(
      contestingRunnerInput,
      "remote_1",
    );
    const lockedScore = evaluateCorpPlan(lockedRunnerInput, lockedCandidate);
    const contestingScore = evaluateCorpPlan(
      contestingRunnerInput,
      contestingCandidate,
    );

    expect(lockedCapacity.capacity).toBe("low");
    expect(contestingCapacity.capacity).toBe("high");
    expect(lockedScore.score).toBeGreaterThan(contestingScore.score);
    expect(lockedScore.evidence).toContain("runner_contest_capacity:low");
    expect(contestingScore.evidence).toContain("runner_contest_capacity:high");
    expect(JSON.stringify(lockedScore.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda_1/,
    );
  });

  it("does not treat a one-ICE remote as safe when visible breaker coverage makes the path cheap", () => {
    const input = corpEffectiveRemoteSafetyInput("ai-corp-cheap-wall-contest", {
      runnerCredits: 5,
    });
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(agendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!agendaInstall || !gain)
      throw new Error("Missing cheap remote safety fixture actions");

    const scopedInput = { ...input, legalActions: [agendaInstall, gain] };
    const contest = evaluateRunnerContestCapacity(scopedInput, "remote_1");
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(contest.capacity).toBe("high");
    expect(contest.visibleBreakCost).toBe(0);
    expect(decision.selectedActionId).not.toBe(agendaInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_agenda_install_deferred_due_to_cheap_contest:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_remote_protection_overestimated_by_ice_presence:true",
    );
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /privatePayload|FullState|runner\.grip/,
    );
  });

  it("keeps the Data Wall versus Japanese Water Torture repro generic through visible break cost", () => {
    const input = corpEffectiveRemoteSafetyInput("ai-corp-jwt-data-wall", {
      runnerCredits: 8,
    });
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    expect(agendaInstall).toBeDefined();
    if (!agendaInstall) throw new Error("Missing agenda install action");

    const scopedInput = { ...input, legalActions: [agendaInstall] };
    const scoreNext = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const buildRemote = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const contest = evaluateRunnerContestCapacity(scopedInput, "remote_1");

    expect(contest.capacity).toBe("high");
    expect(contest.visibleBreakCost).toBe(0);
    expect(scoreNext?.legalActionIds ?? []).not.toContain(
      agendaInstall.actionId,
    );
    expect(buildRemote?.legalActionIds ?? []).not.toContain(
      agendaInstall.actionId,
    );
  });

  it("recognizes run-tax RemoteRole without treating it as agenda-steal protection", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-tax-protected-remote",
      { runnerCredits: 8, includeTaxUpgrade: true },
    );
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(agendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!agendaInstall || !gain)
      throw new Error("Missing tax-protected remote fixture actions");

    const scopedInput = { ...input, legalActions: [agendaInstall, gain] };
    const score = evaluateRemoteScoreHorizon(scopedInput, {
      planId: "remote-role-run-tax-fixture",
      kind: "build_scoring_remote",
      legalActionIds: [agendaInstall.actionId],
      steps: [],
      expectedBenefits: [],
      visibleRisks: [],
      requiredRoles: [],
    });
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.selectedActionId).not.toBe(agendaInstall.actionId);
    expect(score.evidence).toContain("corp_remote_role_kind:run_tax");
    expect(score.evidence).toContain("corp_remote_role_used_for_safety:true");
    expect(score.evidence).toContain(
      "corp_remote_role_did_not_raise_safety_because_cheap_contest:true",
    );
    expect(score.evidence).not.toContain("corp_remote_role_kind:asset_economy");
  });

  it("uses agenda-steal-tax RemoteRole to raise scoring remote safety when the Runner cannot pay", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-red-herrings-remote-role",
      { runnerCredits: 4, includeAgendaStealTaxUpgrade: true },
    );
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(agendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!agendaInstall || !gain)
      throw new Error("Missing agenda-steal-tax fixture actions");

    const scopedInput = { ...input, legalActions: [agendaInstall, gain] };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.selectedActionId).toBe(agendaInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_remote_role_kind:agenda_steal_tax",
    );
    expect(decision.score.evidence).toContain(
      "corp_remote_role_agenda_steal_tax_blocks_steal:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_remote_role_used_for_scoring_remote:true",
    );
  });

  it("classifies structured remote roles without treating capacity, asset or bait as scoring protection", () => {
    const redHerrings = getStructuredRemoteRoleForCard(
      "onr_v1_366_red-herrings",
    );
    const namatoki = getStructuredRemoteRoleForCard(
      "onr_v1_361_namatoki-plaza",
    );
    const assetEconomy = getStructuredRemoteRoleForCard(
      "onr_v1_309_bbs-whispering-campaign",
    );

    expect(redHerrings?.kind).toBe("agenda_steal_tax");
    expect(namatoki?.kind).toBe("remote_capacity");
    expect(assetEconomy?.kind).toBe("asset_economy");

    const activeRedHerrings = structuredRemoteRoleSafetyAssessmentForCard(
      {
        definitionId: "onr_v1_366_red-herrings",
        known: true,
        rezzed: true,
      },
      { agendaContext: true, runnerCreditsAfterKnownPath: 2 },
    );
    const activeCapacity = structuredRemoteRoleSafetyAssessmentForCard(
      {
        definitionId: "onr_v1_361_namatoki-plaza",
        known: true,
        rezzed: true,
      },
      { agendaContext: true, runnerCreditsAfterKnownPath: 2 },
    );
    const inactiveTax = structuredRemoteRoleSafetyAssessmentForCard(
      {
        definitionId: "onr_v1_355_crystal-palace-station-grid",
        known: true,
        rezzed: false,
      },
      { agendaContext: true, runnerCreditsAfterKnownPath: 2 },
    );

    expect(activeRedHerrings.raisesSafety).toBe(true);
    expect(activeRedHerrings.blocksAgendaSteal).toBe(true);
    expect(activeCapacity.raisesSafety).toBe(false);
    expect(activeCapacity.evidence).toContain(
      "corp_remote_role_kind:remote_capacity",
    );
    expect(inactiveTax.raisesSafety).toBe(false);
    expect(inactiveTax.evidence).toContain(
      "corp_remote_role_did_not_raise_safety_because_inactive:true",
    );
  });

  it("summarizes RemoteRole ontology evidence as first-class metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            evidence: [
              "corp_remote_role_profile_seen:true",
              "corp_remote_role_kind:agenda_steal_tax",
              "corp_remote_role_server_scope:fort",
              "corp_remote_role_used_for_safety:true",
              "corp_remote_role_used_for_scoring_remote:true",
              "corp_remote_role_raised_safety_score:true",
            ],
          }),
          progressionAction("corp", 2, "install_card", "remote_1", 1, {
            evidence: [
              "corp_remote_role_profile_seen:true",
              "corp_remote_role_kind:remote_capacity",
              "corp_remote_role_server_scope:remote",
              "corp_remote_role_conflict_with_legacy:true",
            ],
          }),
          progressionAction("runner", 3, "trash_accessed_card", "remote_1", 1, {
            evidence: [
              "runner_remote_role_profile_seen:true",
              "runner_remote_role_kind:run_tax",
              "runner_remote_role_server_scope:fort",
              "runner_remote_role_used_for_trash_value:true",
            ],
          }),
        ],
        "remote-role-metric-fixture",
      ),
    ]);

    expect(metrics.corpRemoteRoleProfilesSeen).toBe(2);
    expect(metrics.corpRemoteRoleUsedForSafety).toBe(1);
    expect(metrics.corpRemoteRoleUsedForScoringRemote).toBe(1);
    expect(metrics.corpRemoteRoleRaisedSafetyScore).toBe(1);
    expect(metrics.corpRemoteRoleConflictWithLegacy).toBe(1);
    expect(metrics.corpAgendaStealTaxRemoteRoleSeen).toBe(1);
    expect(metrics.corpRemoteCapacityRoleSeen).toBe(1);
    expect(metrics.runnerRemoteRoleProfilesSeen).toBe(1);
    expect(metrics.runnerRemoteRoleUsedForTrashValue).toBe(1);
    expect(metrics.runnerRunTaxRemoteRoleAccessed).toBe(1);
    expect(metrics.remoteRoleKindAgendaStealTax).toBe(1);
    expect(metrics.remoteRoleKindRemoteCapacity).toBe(1);
    expect(metrics.remoteRoleKindRunTax).toBe(1);
    expect(metrics.remoteRoleServerScopeFort).toBe(2);
    expect(metrics.remoteRoleServerScopeRemote).toBe(1);
  });

  it("allows same-turn score setup despite cheap contest when Runner has no response window", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-same-turn-score-cheap",
      { runnerCredits: 8, installedAgendaCounters: 2 },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing same-turn score fixture actions");

    const scopedInput = { ...input, legalActions: [advance, gain] };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(decision.score.evidence).toContain(
      "corp_same_turn_score_allowed_despite_cheap_contest:true",
    );
  });

  it("does not count bait remotes as safe agenda score protection", () => {
    const input = corpEffectiveRemoteSafetyInput("ai-corp-cheap-bait-remote", {
      runnerCredits: 8,
      agendaInHq: false,
      assetInHq: true,
    });
    const assetInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_asset",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(assetInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!assetInstall || !gain)
      throw new Error("Missing bait remote fixture actions");

    const scopedInput = { ...input, legalActions: [assetInstall, gain] };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.selectedActionId).toBe(assetInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_bait_remote_not_counted_as_scoring_protection:true",
    );
  });

  it("keeps effective remote safety invariant to hidden Runner hand differences", () => {
    const first = corpEffectiveRemoteSafetyInput(
      "ai-corp-remote-safety-hidden-a",
      { runnerCredits: 5, hiddenRunnerCard: "simple_economy_event" },
    );
    const second = corpEffectiveRemoteSafetyInput(
      "ai-corp-remote-safety-hidden-b",
      { runnerCredits: 5, hiddenRunnerCard: "simple_fracter" },
    );
    const narrow = (input: AiDecisionInput): AiDecisionInput => {
      const agendaInstall = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          action.payload?.serverId === "remote_1" &&
          sourceDefinitionFromInput(input, action) === "simple_agenda",
      );
      const gain = input.legalActions.find(
        (action) => action.type === "gain_credit",
      );
      expect(agendaInstall).toBeDefined();
      expect(gain).toBeDefined();
      if (!agendaInstall || !gain)
        throw new Error("Missing hidden-invariance fixture actions");
      return { ...input, legalActions: [agendaInstall, gain] };
    };

    const firstDecision = chooseCorpPlanDecision(narrow(first));
    const secondDecision = chooseCorpPlanDecision(narrow(second));

    expect(firstDecision.selectedActionType).toBe(
      secondDecision.selectedActionType,
    );
    expect(firstDecision.debug.planKind).toBe(secondDecision.debug.planKind);
  });

  it("selects the effectively safest remote for agenda install after a cheap-contest remote is detected", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-better-remote-after-unsafe",
      { runnerCredits: 8, safeSecondRemote: true },
    );
    const unsafeAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const saferAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_2" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(unsafeAgendaInstall).toBeDefined();
    expect(saferAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!unsafeAgendaInstall || !saferAgendaInstall || !gain)
      throw new Error("Missing better-remote fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [unsafeAgendaInstall, saferAgendaInstall, gain],
    });

    expect(decision.selectedActionId).toBe(saferAgendaInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_unsafe_remote_converted_to_better_remote:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_best_remote_selected_for_agenda:true",
    );
  });

  it("converts an unsafe scoring remote into protection before reinstalling the agenda line", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-protect-after-unsafe-remote",
      { runnerCredits: 8, protectionIceInHq: true },
    );
    const unsafeAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const protectionInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(unsafeAgendaInstall).toBeDefined();
    expect(protectionInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!unsafeAgendaInstall || !protectionInstall || !gain)
      throw new Error("Missing protect-to-score fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [unsafeAgendaInstall, protectionInstall, gain],
    });

    expect(decision.selectedActionId).toBe(protectionInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_unsafe_remote_converted_to_protection:true",
    );
  });

  it("does not loop protection when the remote is already effectively protected and advance is legal", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-no-protection-loop-after-safe",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        installedAgendaCounters: 1,
        protectionIceInHq: true,
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const protectionInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(protectionInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !protectionInstall || !gain)
      throw new Error("Missing no-protection-loop fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [advance, protectionInstall, gain],
    });

    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(decision.score.evidence).not.toContain(
      "corp_protection_repeated_without_score_conversion:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_score_window_compression_taken:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_agenda_advanced_in_protected_remote:true",
    );
  });

  it("compresses a protected agenda line instead of taking unnecessary economy", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-compress-before-economy",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        installedAgendaCounters: 1,
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing compression economy fixture actions");

    const scopedInput = { ...input, legalActions: [advance, gain] };
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.legalActionIds.includes(gain.actionId),
    );
    const decision = chooseCorpPlanDecision(scopedInput);
    expect(economyCandidate).toBeDefined();
    if (!economyCandidate)
      throw new Error("Missing economy candidate for compression fixture");

    const economyScore = evaluateCorpPlan(scopedInput, economyCandidate);

    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(decision.score.evidence).toContain(
      "corp_score_window_compression_taken:true",
    );
    expect(economyScore.evidence).toContain(
      "corp_economy_before_score_window:true",
    );
    expect(economyScore.evidence).toContain(
      "corp_non_essential_action_before_score_window:true",
    );
  });

  it("allows economy before score compression when rez reserve is still missing", () => {
    const input = corpActionPhaseInput(
      "ai-corp-compression-economy-needed",
      (state) => {
        state.corp.credits = 2;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing necessary economy compression fixture actions");

    const scopedInput = {
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      legalActions: [advance, gain],
    };
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.legalActionIds.includes(gain.actionId),
    );
    expect(economyCandidate).toBeDefined();
    if (!economyCandidate)
      throw new Error("Missing necessary economy candidate for compression");
    const economyScore = evaluateCorpPlan(scopedInput, economyCandidate);
    expect(economyScore.evidence).toContain(
      "corp_economy_before_score_window_necessary:true",
    );
    expect(economyScore.evidence).not.toContain(
      "corp_non_essential_action_before_score_window:true",
    );
  });

  it("penalizes central protection before a ready remote score window without acute central risk", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-compression-central-delay",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        installedAgendaCounters: 1,
        protectionIceInHq: true,
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const hqProtection = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    expect(advance).toBeDefined();
    expect(hqProtection).toBeDefined();
    if (!advance || !hqProtection)
      throw new Error("Missing compression central-protection fixture actions");

    const scopedInput = { ...input, legalActions: [advance, hqProtection] };
    const centralCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.legalActionIds.includes(hqProtection.actionId),
    );
    const decision = chooseCorpPlanDecision(scopedInput);
    expect(centralCandidate).toBeDefined();
    if (!centralCandidate)
      throw new Error("Missing central protection candidate for compression");

    const centralScore = evaluateCorpPlan(scopedInput, centralCandidate);

    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(centralScore.evidence).toContain(
      "corp_central_protection_before_score_window:true",
    );
    expect(centralScore.evidence).toContain(
      "corp_non_essential_action_before_score_window:true",
    );
  });

  it("converts a protected remote into agenda install instead of further protection", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-protected-remote-install-agenda",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        protectionIceInHq: true,
      },
    );
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const protectionInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(agendaInstall).toBeDefined();
    expect(protectionInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!agendaInstall || !protectionInstall || !gain)
      throw new Error("Missing protected-remote agenda install fixture");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [agendaInstall, protectionInstall, gain],
    });

    expect(decision.selectedActionId).toBe(agendaInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_score_path_chosen_after_protection:true",
    );
    expect(decision.score.evidence).toContain(
      "corp_protection_followed_by_agenda_install:true",
    );
  });

  it("penalizes protection without safety delta when a protected score path is ready", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-protection-no-safety-delta",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        installedAgendaCounters: 1,
        protectionIceInHq: true,
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const protectionInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    expect(advance).toBeDefined();
    expect(protectionInstall).toBeDefined();
    if (!advance || !protectionInstall)
      throw new Error("Missing no-safety-delta fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [advance, protectionInstall],
    };
    const protectCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const decision = chooseCorpPlanDecision(scopedInput);
    expect(protectCandidate).toBeDefined();
    if (!protectCandidate)
      throw new Error("Missing protection candidate for no-delta fixture");

    const protectScore = evaluateCorpPlan(scopedInput, protectCandidate);

    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(protectScore.evidence).toContain(
      "corp_protection_no_safety_delta:true",
    );
    expect(protectScore.evidence).toContain(
      "corp_protection_loop_after_remote_safe:true",
    );
  });

  it("does not let central protection displace a ready protected remote score path", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-central-protection-does-not-displace-score",
      {
        runnerCredits: 0,
        includeTaxUpgrade: true,
        protectionIceInHq: true,
      },
    );
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const hqProtection = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    expect(agendaInstall).toBeDefined();
    expect(hqProtection).toBeDefined();
    if (!agendaInstall || !hqProtection)
      throw new Error("Missing central-protection fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [agendaInstall, hqProtection],
    });

    expect(decision.selectedActionId).toBe(agendaInstall.actionId);
    expect(decision.score.evidence).toContain(
      "corp_score_path_chosen_after_protection:true",
    );
  });

  it("recognizes a fast-advance counter operation as an alternative to an unsafe remote", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-fast-advance-after-unsafe-remote",
      { runnerCredits: 8, installedAgendaCounters: 1 },
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(gain).toBeDefined();
    if (!gain) throw new Error("Missing fast-advance fixture gain action");
    const operationCard = visibleCard(
      "onr_v1_304_systematic-layoffs",
      "unsafe_remote_systematic_layoffs_fixture",
    );
    const advancementOperation: LegalAction = {
      ...gain,
      actionId: "corp.fixture.unsafe_remote.play_systematic_layoffs",
      type: "play_operation",
      source: operationCard.instanceId,
      payload: {
        cost: 2,
        addedAdvancementCounters: 2,
      },
    };
    const scopedInput = {
      ...input,
      legalActions: [
        advancementOperation,
        ...input.legalActions.filter(
          (action) =>
            action.type === "advance_card" &&
            sourceDefinitionFromInput(input, action) === "simple_agenda",
        ),
        gain,
      ],
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          gripOrHq: [operationCard, ...input.playerView.own.gripOrHq],
        },
      },
    };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.selectedActionId).toBe(advancementOperation.actionId);
    expect(decision.score.evidence).toContain(
      "corp_unsafe_remote_converted_to_fast_advance:true",
    );
    expect(decision.score.evidence).toContain("corp_advance_burst_taken:true");
  });

  it("protects HQ instead of holding agendas indefinitely when the remote is unsafe and HQ pressure is visible", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-hq-risk-after-unsafe-remote",
      { runnerCredits: 8, protectionIceInHq: true },
    );
    const unsafeAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const hqProtection = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(unsafeAgendaInstall).toBeDefined();
    expect(hqProtection).toBeDefined();
    expect(gain).toBeDefined();
    if (!unsafeAgendaInstall || !hqProtection || !gain)
      throw new Error("Missing HQ-risk fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [unsafeAgendaInstall, hqProtection, gain],
    });

    expect(decision.selectedActionId).toBe(hqProtection.actionId);
    expect(decision.score.evidence).toContain(
      "corp_unsafe_remote_converted_to_hq_protection:true",
    );
  });

  it("marks no-score-path and builds resources when no safe remote, burst, or protection line is legal", () => {
    const input = corpEffectiveRemoteSafetyInput(
      "ai-corp-no-score-path-after-unsafe-remote",
      { runnerCredits: 8 },
    );
    const unsafeAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(unsafeAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!unsafeAgendaInstall || !gain)
      throw new Error("Missing no-score-path fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [unsafeAgendaInstall, gain],
    });

    expect(decision.selectedActionId).toBe(gain.actionId);
    expect(decision.score.evidence).toContain(
      "corp_unsafe_remote_converted_to_no_score_path:true",
    );
  });

  it("keeps unsafe-remote score conversion invariant to hidden Runner hand differences", () => {
    const first = corpEffectiveRemoteSafetyInput(
      "ai-corp-score-conversion-hidden-a",
      { runnerCredits: 8, hiddenRunnerCard: "simple_economy_event" },
    );
    const second = corpEffectiveRemoteSafetyInput(
      "ai-corp-score-conversion-hidden-b",
      { runnerCredits: 8, hiddenRunnerCard: "simple_fracter" },
    );
    const narrow = (input: AiDecisionInput): AiDecisionInput => {
      const agendaInstall = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement !== "ice" &&
          action.payload?.serverId === "remote_1" &&
          sourceDefinitionFromInput(input, action) === "simple_agenda",
      );
      const gain = input.legalActions.find(
        (action) => action.type === "gain_credit",
      );
      expect(agendaInstall).toBeDefined();
      expect(gain).toBeDefined();
      if (!agendaInstall || !gain)
        throw new Error("Missing hidden-invariance score-conversion fixture");
      return { ...input, legalActions: [agendaInstall, gain] };
    };

    const firstDecision = chooseCorpPlanDecision(narrow(first));
    const secondDecision = chooseCorpPlanDecision(narrow(second));

    expect(firstDecision.selectedActionType).toBe(
      secondDecision.selectedActionType,
    );
    expect(firstDecision.debug.planKind).toBe(secondDecision.debug.planKind);
    expect(JSON.stringify(firstDecision.score.evidence)).not.toMatch(
      /privatePayload|FullState|runner\.grip/,
    );
  });

  it("weights near-term remote score horizons before generic economy and further remote build", () => {
    const input = corpActionPhaseInput("ai-corp-score-horizon", (state) => {
      state.corp.credits = 7;
      state.runner.credits = 0;
      ensureRemoteServer(state, "remote_1");
      putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
      putCorpRootInRemote(state, "simple_agenda", 2);
      moveCorpCardToHq(state, "simple_code_gate_ice");
    });
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(advance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !remoteIceInstall || !gain)
      throw new Error("Missing Corp score-horizon fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [advance, remoteIceInstall, gain],
    };
    const candidate = generateCorpPlanCandidates(scopedInput).find(
      (plan) => plan.kind === "score_next_turn",
    );

    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("Missing score-horizon candidate");

    const horizon = evaluateRemoteScoreHorizon(scopedInput, candidate);
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(horizon.reasons).toContain("score_horizon_opens_score_window");
    expect(horizon.evidence).toContain(
      "score_horizon_advances_remaining_after_action:0",
    );
    expect(horizon.evidence).toContain("score_horizon_contest_capacity:low");
    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("treats legal Corp advancement-counter operations as score-horizon setup", () => {
    const input = corpActionPhaseInput(
      "ai-corp-advancement-operation-horizon",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
      },
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(gain).toBeDefined();
    if (!gain) throw new Error("Missing Corp gain fixture action");

    const operationCard = visibleCard(
      "onr_v1_304_systematic-layoffs",
      "systematic_layoffs_fixture",
    );
    const advancementOperation: LegalAction = {
      ...gain,
      actionId: "corp.fixture.play_systematic_layoffs",
      type: "play_operation",
      source: operationCard.instanceId,
      payload: {
        cost: 2,
        addedAdvancementCounters: 2,
      },
    };
    const scopedInput = {
      ...input,
      legalActions: [advancementOperation, gain],
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          gripOrHq: [operationCard, ...input.playerView.own.gripOrHq],
        },
      },
    };
    const candidate = generateCorpPlanCandidates(scopedInput).find(
      (plan) => plan.kind === "score_next_turn",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(candidate?.legalActionIds).toContain(advancementOperation.actionId);
    expect(
      evaluateRemoteScoreHorizon(scopedInput, candidate!).evidence,
    ).toEqual(
      expect.arrayContaining([
        "score_horizon_counters_added:2",
        "score_horizon_advances_remaining_after_action:0",
      ]),
    );
    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(advancementOperation.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("converts legal Corp score windows before economy, draw, remote build, or further advances", () => {
    const input = corpActionPhaseInput(
      "ai-corp-score-conversion-over-passive-actions",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        ensureRemoteServer(state, "remote_2");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 3);
        moveCorpCardToHq(state, "simple_code_gate_ice");
      },
    );
    const score = input.legalActions.find(
      (action) => action.type === "score_agenda",
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(score).toBeDefined();
    expect(advance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(draw).toBeDefined();
    expect(gain).toBeDefined();
    if (!score || !advance || !remoteIceInstall || !draw || !gain)
      throw new Error("Missing score-conversion fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [score, advance, remoteIceInstall, draw, gain],
    };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.debug.planKind).toBe("score_now");
    expect(decision.selectedActionId).toBe(score.actionId);
    expect(decision.selectedActionType).toBe("score_agenda");
  });

  it("chooses the best visible legal Corp score target when multiple agendas can score", () => {
    const baseInput = corpActionPhaseInput(
      "ai-corp-best-score-target",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
      },
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(gain).toBeDefined();
    if (!gain) throw new Error("Missing gain action for score target fixture");

    const hostile = {
      ...visibleCard("onr_v1_203_hostile-takeover", "score_hostile"),
      advancementCounters: 3,
      advancementRequirement: 3,
    };
    const tycho = {
      ...visibleCard("onr_v1_220_tycho-extension", "score_tycho"),
      advancementCounters: 4,
      advancementRequirement: 4,
    };
    const hostileScore: LegalAction = {
      ...gain,
      actionId: "corp.fixture.score_hostile",
      type: "score_agenda",
      source: hostile.instanceId,
      payload: { cardId: hostile.instanceId },
    };
    const tychoScore: LegalAction = {
      ...gain,
      actionId: "corp.fixture.score_tycho",
      type: "score_agenda",
      source: tycho.instanceId,
      payload: { cardId: tycho.instanceId },
    };
    const scopedInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        own: { ...baseInput.playerView.own, agendaPoints: 3 },
        servers: [
          ...baseInput.playerView.servers,
          {
            id: "remote_1" as const,
            label: "Remote 1",
            ice: [visibleCard("simple_barrier_ice", "score_remote_ice")],
            root: [hostile],
          },
          {
            id: "remote_2" as const,
            label: "Remote 2",
            ice: [visibleCard("simple_barrier_ice", "score_remote_ice_2")],
            root: [tycho],
          },
        ],
      },
      legalActions: [hostileScore, tychoScore, gain],
    };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.debug.planKind).toBe("score_now");
    expect(decision.selectedActionId).toBe(tychoScore.actionId);
  });

  it("keeps visible agenda advances ahead of weaker non-agenda advancement targets", () => {
    const baseInput = corpActionPhaseInput(
      "ai-corp-advance-agenda-over-asset",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
      },
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(gain).toBeDefined();
    if (!gain)
      throw new Error("Missing gain action for advance target fixture");

    const agenda = {
      ...visibleCard("simple_agenda", "advance_agenda_target"),
      advancementCounters: 2,
      advancementRequirement: 3,
    };
    const asset = {
      ...visibleCard(
        "onr_v1_328_information-laundering",
        "advance_asset_target",
      ),
      advancementCounters: 0,
      advancementRequirement: 0,
    };
    const advanceAgenda: LegalAction = {
      ...gain,
      actionId: "corp.fixture.advance_agenda",
      type: "advance_card",
      source: agenda.instanceId,
      payload: { cardId: agenda.instanceId },
    };
    const advanceAsset: LegalAction = {
      ...gain,
      actionId: "corp.fixture.advance_asset",
      type: "advance_card",
      source: asset.instanceId,
      payload: { cardId: asset.instanceId },
    };
    const scopedInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        servers: [
          ...baseInput.playerView.servers,
          {
            id: "remote_1" as const,
            label: "Remote 1",
            ice: [visibleCard("simple_barrier_ice", "advance_remote_ice")],
            root: [agenda, asset],
          },
        ],
      },
      legalActions: [advanceAsset, advanceAgenda, gain],
    };
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(advanceAgenda.actionId);
  });

  it("protects a leaky remote before a risky near-final agenda advance", () => {
    const input = corpActionPhaseInput(
      "ai-corp-protect-before-risky-final-advance",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const riskyAdvance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(riskyAdvance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!riskyAdvance || !remoteIceInstall || !gain)
      throw new Error("Missing protect-before-advance fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [riskyAdvance, remoteIceInstall, gain],
    };
    const advanceCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const protectCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(advanceCandidate).toBeDefined();
    expect(protectCandidate).toBeDefined();
    if (!advanceCandidate || !protectCandidate)
      throw new Error("Missing protect-before-advance plan candidates");
    expect(evaluateCorpPlan(scopedInput, advanceCandidate).evidence).toContain(
      "advance_protection_contains_risky_advance:true",
    );
    expect(evaluateCorpPlan(scopedInput, protectCandidate).reasons).toContain(
      "protect_before_advance",
    );
    expect(decision.debug.planKind).toBe("build_scoring_remote");
    expect(decision.selectedActionId).toBe(remoteIceInstall.actionId);
  });

  it("continues a protected near-final advance line when the remote is hard to contest", () => {
    const input = corpActionPhaseInput(
      "ai-corp-safe-near-final-advance",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveCorpCardToHq(state, "simple_code_gate_ice");
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_code_gate_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(advance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !remoteIceInstall || !gain)
      throw new Error("Missing safe advance fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [advance, remoteIceInstall, gain],
    });

    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(advance.actionId);
  });

  it("allows aggressive final advance when same-turn scoring is opened", () => {
    const input = corpActionPhaseInput(
      "ai-corp-final-advance-score-same-turn",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const finalAdvance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(finalAdvance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!finalAdvance || !remoteIceInstall || !gain)
      throw new Error("Missing same-turn final advance fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [finalAdvance, remoteIceInstall, gain],
    });

    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(finalAdvance.actionId);
  });

  it("does not treat last-click final advance as a safe same-turn score window", () => {
    const input = corpActionPhaseInput(
      "ai-corp-last-click-final-advance-risk",
      (state) => {
        state.corp.credits = 7;
        state.corp.clicks = 1;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const finalAdvance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1",
    );
    expect(finalAdvance).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    if (!finalAdvance || !remoteIceInstall)
      throw new Error("Missing last-click advance risk fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [finalAdvance, remoteIceInstall],
    };
    const advanceCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.legalActionIds.includes(finalAdvance.actionId),
    );
    const protectCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) =>
        candidate.legalActionIds.includes(remoteIceInstall.actionId),
    );
    expect(advanceCandidate).toBeDefined();
    expect(protectCandidate).toBeDefined();
    if (!advanceCandidate || !protectCandidate)
      throw new Error("Missing last-click advance risk candidates");

    const advanceScore = evaluateCorpPlan(scopedInput, advanceCandidate);
    const protectScore = evaluateCorpPlan(scopedInput, protectCandidate);

    expect(advanceScore.evidence).toContain(
      "advance_protection_contains_risky_advance:true",
    );
    expect(advanceScore.score).toBeLessThan(protectScore.score);
  });

  it("builds rez reserve before a near-final advance when protection would become unrezzable", () => {
    const input = corpActionPhaseInput(
      "ai-corp-rez-reserve-before-risky-advance",
      (state) => {
        state.corp.credits = 1;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const riskyAdvance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(riskyAdvance).toBeDefined();
    expect(gain).toBeDefined();
    if (!riskyAdvance || !gain)
      throw new Error("Missing rez-reserve before advance fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [riskyAdvance, gain],
    });

    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
  });

  it("selects visible remote agenda targets for Corp advancement-counter choices", () => {
    const input = corpActionPhaseInput(
      "ai-corp-advancement-choice-target",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        const agendaId = putCorpRootInRemote(state, "simple_agenda", 1);
        const assetId = putCorpRootInRemote(state, "simple_economy_asset", 0);
        state.pendingChoice = {
          choiceId: "corp_advancement_fixture",
          side: "corp",
          source: "p3_34.distribute_advancement.fixture",
          prompt: "Distribute advancement counters",
          kind: "select_option",
          options: [
            {
              id: "asset",
              label: "Asset",
              value: `${assetId}:2`,
            },
            {
              id: "agenda",
              label: "Agenda",
              value: `${agendaId}:2`,
            },
          ],
          minSelections: 1,
          maxSelections: 1,
          stateVersion: state.stateVersion,
          visibility: "private_to_side",
        };
      },
    );
    const resolveChoice = input.legalActions.find(
      (action) => action.type === "resolve_choice",
    );

    expect(resolveChoice).toBeDefined();
    if (!resolveChoice) throw new Error("Missing advancement choice action");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [resolveChoice],
    });

    expect(decision.selectedChoices).toMatchObject({
      choiceId: "corp_advancement_fixture",
      selectedOptionIds: ["agenda"],
    });
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("keeps Corp remote advance choices invariant to hidden Runner grip contents", () => {
    const buildInput = (seed: string, hiddenRunnerCard: string) =>
      corpActionPhaseInput(seed, (state) => {
        state.corp.credits = 7;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 2);
        moveRunnerCardToGrip(state, hiddenRunnerCard);
      });
    const inputA = buildInput(
      "ai-corp-hidden-runner-invariance",
      "simple_fracter",
    );
    const inputB = buildInput(
      "ai-corp-hidden-runner-invariance",
      "simple_decoder",
    );
    const scoped = (input: typeof inputA) => {
      const advance = input.legalActions.find(
        (action) =>
          action.type === "advance_card" &&
          sourceDefinitionFromInput(input, action) === "simple_agenda",
      );
      const gain = input.legalActions.find(
        (action) => action.type === "gain_credit",
      );
      expect(advance).toBeDefined();
      expect(gain).toBeDefined();
      if (!advance || !gain)
        throw new Error("Missing hidden-invariance fixture actions");
      return { ...input, legalActions: [advance, gain] };
    };
    const decisionA = chooseCorpPlanDecision(scoped(inputA));
    const decisionB = chooseCorpPlanDecision(scoped(inputB));

    expect(decisionA.debug.planKind).toBe("score_next_turn");
    expect(decisionB.debug.planKind).toBe("score_next_turn");
    expect(decisionA.selectedActionType).toBe("advance_card");
    expect(decisionB.selectedActionType).toBe("advance_card");
    expect(decisionA.score.planId.split(":")[0]).toBe(
      decisionB.score.planId.split(":")[0],
    );
    expect(JSON.stringify([decisionA, decisionB])).not.toMatch(
      /cardInstances|privatePayload|simple_fracter|simple_decoder/,
    );
  });

  it("keeps Corp protect-before-advance decisions invariant to hidden Runner grip contents", () => {
    const buildInput = (seed: string, hiddenRunnerCard: string) =>
      corpActionPhaseInput(seed, (state) => {
        state.corp.credits = 7;
        state.runner.credits = 10;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveRunnerProgramToRig(state, "simple_fracter");
        moveRunnerCardToGrip(state, hiddenRunnerCard);
      });
    const inputA = buildInput(
      "ai-corp-hidden-protect-before-advance",
      "simple_decoder",
    );
    const inputB = buildInput(
      "ai-corp-hidden-protect-before-advance",
      "simple_run_event",
    );
    const scoped = (input: typeof inputA) => {
      const advance = input.legalActions.find(
        (action) =>
          action.type === "advance_card" &&
          sourceDefinitionFromInput(input, action) === "simple_agenda",
      );
      const remoteIceInstall = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "remote_1" &&
          sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
      );
      expect(advance).toBeDefined();
      expect(remoteIceInstall).toBeDefined();
      if (!advance || !remoteIceInstall)
        throw new Error("Missing hidden protect fixture actions");
      return { ...input, legalActions: [advance, remoteIceInstall] };
    };
    const decisionA = chooseCorpPlanDecision(scoped(inputA));
    const decisionB = chooseCorpPlanDecision(scoped(inputB));

    expect(decisionA.debug.planKind).toBe("build_scoring_remote");
    expect(decisionB.debug.planKind).toBe("build_scoring_remote");
    expect(decisionA.selectedActionType).toBe("install_card");
    expect(decisionB.selectedActionType).toBe("install_card");
    expect(decisionA.score.planId.split(":")[0]).toBe(
      decisionB.score.planId.split(":")[0],
    );
    expect(JSON.stringify([decisionA, decisionB])).not.toMatch(
      /cardInstances|privatePayload|simple_decoder|simple_run_event/,
    );
  });

  it("keeps Corp score decisions invariant to hidden Runner grip contents", () => {
    const buildInput = (seed: string, hiddenRunnerCard: string) =>
      corpActionPhaseInput(seed, (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 3);
        moveRunnerCardToGrip(state, hiddenRunnerCard);
      });
    const inputA = buildInput(
      "ai-corp-hidden-runner-score-invariance",
      "simple_fracter",
    );
    const inputB = buildInput(
      "ai-corp-hidden-runner-score-invariance",
      "simple_decoder",
    );
    const scoped = (input: typeof inputA) => {
      const score = input.legalActions.find(
        (action) => action.type === "score_agenda",
      );
      const gain = input.legalActions.find(
        (action) => action.type === "gain_credit",
      );
      expect(score).toBeDefined();
      expect(gain).toBeDefined();
      if (!score || !gain)
        throw new Error("Missing hidden score-invariance fixture actions");
      return { ...input, legalActions: [score, gain] };
    };
    const decisionA = chooseCorpPlanDecision(scoped(inputA));
    const decisionB = chooseCorpPlanDecision(scoped(inputB));

    expect(decisionA.debug.planKind).toBe("score_now");
    expect(decisionB.debug.planKind).toBe("score_now");
    expect(decisionA.selectedActionType).toBe("score_agenda");
    expect(decisionB.selectedActionType).toBe("score_agenda");
    expect(decisionA.score.planId.split(":")[0]).toBe(
      decisionB.score.planId.split(":")[0],
    );
    expect(JSON.stringify([decisionA, decisionB])).not.toMatch(
      /cardInstances|privatePayload|simple_fracter|simple_decoder/,
    );
  });

  it("installs affordable remote ICE before exposing a new naked agenda", () => {
    const input = corpActionPhaseInput(
      "ai-corp-remote-ice-before-naked-agenda",
      (state) => {
        state.corp.credits = 4;
        ensureRemoteServer(state, "remote_1");
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const remoteIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        ["remote_1", "new_remote"].includes(
          String(action.payload?.serverId ?? ""),
        ) &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const nakedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(remoteIceInstall).toBeDefined();
    expect(nakedAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteIceInstall || !nakedAgendaInstall || !gain)
      throw new Error("Missing remote ICE reserve fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [remoteIceInstall, nakedAgendaInstall, gain],
    };
    const remoteCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(remoteCandidate?.legalActionIds).toContain(
      remoteIceInstall.actionId,
    );
    expect(decision.debug.planKind).toBe("build_scoring_remote");
    expect(decision.selectedActionId).toBe(remoteIceInstall.actionId);
    expect(decision.score.reasons).toContain("remote_ice_rez_reserve_ready");
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("strengthens an existing scoring remote instead of opening a planless empty remote", () => {
    const input = corpActionPhaseInput(
      "ai-corp-portfolio-consolidate-existing-remote",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 8;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const existingRemoteIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const newRemoteIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    expect(existingRemoteIce).toBeDefined();
    expect(newRemoteIce).toBeDefined();
    if (!existingRemoteIce || !newRemoteIce)
      throw new Error("Missing remote portfolio fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [newRemoteIce, existingRemoteIce],
    });

    expect(decision.debug.planKind).toBe("build_scoring_remote");
    expect(decision.selectedActionId).toBe(existingRemoteIce.actionId);
    expect(decision.score.evidence).toContain(
      "corp_remote_ice_consolidation_taken:true",
    );
  });

  it("allows a new remote when a concrete asset payload plan is visible", () => {
    const input = corpActionPhaseInput(
      "ai-corp-portfolio-new-remote-with-asset-plan",
      (state) => {
        state.corp.credits = 7;
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_economy_asset");
      },
    );
    const newRemoteIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const assetInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_asset",
    );
    expect(newRemoteIce).toBeDefined();
    expect(gain).toBeDefined();
    expect(assetInstall).toBeDefined();
    if (!newRemoteIce || !gain || !assetInstall)
      throw new Error("Missing planned new remote fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [newRemoteIce, assetInstall, gain],
    });
    const breakdown = JSON.stringify(decision.score.scoreBreakdown);

    expect(decision.selectedActionId).toBe(newRemoteIce.actionId);
    expect(breakdown).toContain("new_remote_has_payload_plan");
    expect(JSON.stringify(decision.debug)).not.toMatch(
      /cardInstances|privatePayload/i,
    );
  });

  it("devalues an empty new one-ICE remote without payload plan when economy is needed", () => {
    const input = corpActionPhaseInput(
      "ai-corp-portfolio-empty-new-remote-no-plan",
      (state) => {
        state.corp.credits = 1;
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveCorpHqAgendasToRd(state);
      },
    );
    const newRemoteIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(newRemoteIce).toBeDefined();
    expect(gain).toBeDefined();
    if (!newRemoteIce || !gain)
      throw new Error("Missing unplanned new remote fixture actions");

    const remoteCandidate = generateCorpPlanCandidates({
      ...input,
      legalActions: [newRemoteIce, gain],
    }).find((candidate) => candidate.kind === "build_scoring_remote");
    expect(remoteCandidate).toBeDefined();
    if (!remoteCandidate) throw new Error("Missing remote portfolio candidate");

    const score = evaluateCorpPlan(
      { ...input, legalActions: [newRemoteIce, gain] },
      remoteCandidate,
    );
    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [newRemoteIce, gain],
    });

    expect(JSON.stringify(score.scoreBreakdown)).toContain(
      "new_remote_without_payload_plan",
    );
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
  });

  it("uses draw as HQ dilution only when HQ is agenda-heavy and no safe remote line exists", () => {
    const input = withSyntheticCorpAgendaPressure(
      withPublicServerEventTail(
        corpActionPhaseInput("ai-corp-hq-density-draw-dilution", (state) => {
          state.corp.credits = 6;
          state.runner.credits = 6;
          moveCorpCardToHq(state, "simple_agenda");
          moveCorpCardToHq(state, "simple_agenda");
          moveCorpHqAgendasToRd(state);
          moveCorpCardToHq(state, "simple_agenda");
          moveCorpCardToHq(state, "simple_agenda");
          moveCorpCardToHq(state, "simple_barrier_ice");
          moveCorpCardToHq(state, "simple_economy_operation");
          moveCorpCardToHq(state, "simple_economy_asset");
        }),
        ["hq"],
      ),
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(draw).toBeDefined();
    expect(gain).toBeDefined();
    if (!draw || !gain) throw new Error("Missing HQ dilution fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [draw, gain],
    });

    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(draw.actionId);
    expect(decision.score.evidence).toContain(
      "corp_draw_chosen_to_dilute_agenda_flood:true",
    );
  });

  it("prefers safe agenda exit over HQ dilution draw", () => {
    const input = corpActionPhaseInput(
      "ai-corp-hq-density-safe-remote-before-draw",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const agendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(agendaInstall).toBeDefined();
    expect(draw).toBeDefined();
    if (!agendaInstall || !draw)
      throw new Error("Missing safe remote HQ density fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [draw, agendaInstall],
    });
    expect(decision.selectedActionId).toBe(agendaInstall.actionId);
    expect(decision.score.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "agenda_removed_from_hq_candidate" }),
      ]),
    );
  });

  it("does not overvalue HQ dilution draw when HQ is not agenda-heavy", () => {
    const input = corpActionPhaseInput(
      "ai-corp-hq-density-not-heavy",
      (state) => {
        state.corp.credits = 6;
        state.runner.credits = 6;
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_economy_operation");
        moveCorpCardToHq(state, "simple_economy_asset");
      },
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(draw).toBeDefined();
    expect(gain).toBeDefined();
    if (!draw || !gain) throw new Error("Missing non-flood HQ fixture actions");

    const economyCandidate = generateCorpPlanCandidates({
      ...input,
      legalActions: [draw, gain],
    }).find((candidate) => candidate.kind === "recover_economy");
    expect(economyCandidate).toBeDefined();
    if (!economyCandidate) throw new Error("Missing non-flood economy plan");

    const score = evaluateCorpPlan(
      { ...input, legalActions: [draw, gain] },
      economyCandidate,
    );
    expect(score.evidence).toContain("corp_hq_agenda_flood_risk:false");
    expect(score.evidence).toContain(
      "corp_draw_chosen_to_dilute_agenda_flood:false",
    );
  });

  it("lets HQ protection override dilution when HQ agenda flood is under pressure", () => {
    const input = corpActionPhaseInput(
      "ai-corp-hq-density-protect-over-draw",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 7;
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const hqIce = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(hqIce).toBeDefined();
    expect(draw).toBeDefined();
    if (!hqIce || !draw)
      throw new Error("Missing HQ protection fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [draw, hqIce],
    });

    expect(decision.debug.planKind).toBe("protect_hq");
    expect(decision.selectedActionId).toBe(hqIce.actionId);
    expect(decision.score.evidence).toContain(
      "corp_hq_protection_chosen_over_dilution:true",
    );
  });

  it("keeps remote-portfolio and HQ-density decisions invariant to hidden Runner grip", () => {
    const buildInput = (seed: string, hiddenRunnerCard: string) =>
      corpActionPhaseInput(seed, (state) => {
        state.corp.credits = 7;
        state.runner.credits = 8;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 1);
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveRunnerCardToGrip(state, hiddenRunnerCard);
      });
    const scoped = (input: ReturnType<typeof buildInput>) => {
      const existingRemoteIce = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "remote_1",
      );
      const newRemoteIce = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          action.payload?.serverId === "new_remote",
      );
      expect(existingRemoteIce).toBeDefined();
      expect(newRemoteIce).toBeDefined();
      if (!existingRemoteIce || !newRemoteIce)
        throw new Error("Missing hidden-invariance remote portfolio actions");
      return { ...input, legalActions: [existingRemoteIce, newRemoteIce] };
    };
    const decisionA = chooseCorpPlanDecision(
      scoped(buildInput("ai-corp-portfolio-hidden-a", "simple_fracter")),
    );
    const decisionB = chooseCorpPlanDecision(
      scoped(buildInput("ai-corp-portfolio-hidden-a", "simple_decoder")),
    );

    expect(decisionA.selectedActionId).toBe(decisionB.selectedActionId);
    expect(decisionA.debug.planKind).toBe(decisionB.debug.planKind);
    expect(JSON.stringify([decisionA, decisionB])).not.toMatch(
      /cardInstances|privatePayload|simple_fracter|simple_decoder/,
    );
  });

  it("builds economy before agenda installation when remote ICE rez reserve is missing", () => {
    const input = corpActionPhaseInput(
      "ai-corp-remote-rez-reserve-economy",
      (state) => {
        state.corp.credits = 2;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const protectedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(protectedAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!protectedAgendaInstall || !gain)
      throw new Error("Missing remote rez reserve economy fixture actions");

    const scopedInput = {
      ...input,
      legalActions: [protectedAgendaInstall, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(economyCandidate).toBeDefined();
    if (!economyCandidate)
      throw new Error("Missing remote rez reserve candidates");
    expect(scoreCandidate).toBeUndefined();
    expect(evaluateAgendaRisk(scopedInput, economyCandidate).evidence).toEqual(
      expect.arrayContaining([
        "protectedRemoteAvailable:false",
        "rezReserveAvailable:false",
      ]),
    );
    expect(
      evaluateRemoteRezReserve(scopedInput, economyCandidate).reasons,
    ).toContain("remote_rez_reserve_building");
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("uses sufficient remote rez reserve for the score line instead of endless economy", () => {
    const input = corpActionPhaseInput(
      "ai-corp-remote-rez-reserve-score-line",
      (state) => {
        state.corp.credits = 5;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing remote rez reserve score-line fixture actions");

    const scopedInput = { ...input, legalActions: [advance, gain] };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(scoreCandidate).toBeDefined();
    expect(economyCandidate).toBeDefined();
    if (!scoreCandidate || !economyCandidate)
      throw new Error("Missing remote rez reserve score-line candidates");
    expect(
      evaluateRemoteRezReserve(scopedInput, scoreCandidate).reasons,
    ).toContain("remote_rez_reserve_ready_for_score_line");
    expect(
      evaluateRemoteRezReserve(scopedInput, economyCandidate).score,
    ).toBeLessThan(0);
    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(advance.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("continues Corp remote-build intent into advance or score instead of loose economy", () => {
    const input = corpActionPhaseInput(
      "ai-corp-plan-continuation-remote-build",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain) throw new Error("Missing corp continuation actions");
    const scopedInput = {
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      eventTail: [
        syntheticPlanActionEvent(
          "corp-prior-remote-build",
          1,
          "corp",
          "advance_card",
          "remote_1",
        ),
      ],
      legalActions: [advance, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(scoreCandidate).toBeDefined();
    expect(economyCandidate).toBeDefined();
    if (!scoreCandidate || !economyCandidate)
      throw new Error("Missing corp continuation candidates");
    const score = evaluateCorpPlan(scopedInput, scoreCandidate);
    const economy = evaluateCorpPlan(scopedInput, economyCandidate);
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(score.score).toBeGreaterThan(economy.score);
    expect(JSON.stringify(score.scoreBreakdown)).toContain(
      "continue_short_horizon_plan",
    );
    expect(decision.debug.planKind).toBe("score_next_turn");
  });

  it("protects or pivots after a Runner remote steal instead of repeating an unsafe line", () => {
    const input = corpActionPhaseInput(
      "ai-corp-outcome-remote-steal",
      (state) => {
        state.corp.credits = 6;
        ensureRemoteServer(state, "remote_1");
        moveCorpCardToHq(state, "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const protectHq = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq",
    );
    const remoteInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "root" &&
        action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(protectHq).toBeDefined();
    expect(gain).toBeDefined();
    if (!protectHq || !gain)
      throw new Error("Missing corp remote-steal follow-up actions");
    const scopedInput = {
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      ownDeckDoctrine: corpDoctrineForTest(
        "corp-outcome-remote-steal",
        ["glacier"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-stole-remote-agenda",
          input.playerView.stateVersion + 1,
          "runner",
          "steal_agenda",
          "remote_1",
        ),
      ],
      legalActions: remoteInstall
        ? [protectHq, remoteInstall, gain]
        : [protectHq, gain],
    };
    const protect = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "protect_hq",
    );
    const remote = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const economy = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(protect).toBeDefined();
    expect(economy).toBeDefined();
    if (!protect || !economy)
      throw new Error("Missing corp remote-steal candidates");

    expect(evaluateCorpPlan(scopedInput, protect).score).toBeGreaterThan(
      evaluateCorpPlan(scopedInput, economy).score - 250,
    );
    expect(evaluateCorpPlan(scopedInput, protect).evidence).toContain(
      "corp_remote_steal_followup_protect_or_pivot:true",
    );
    if (remote)
      expect(evaluateCorpPlan(scopedInput, remote).evidence).toContain(
        "corp_remote_steal_followup_repeated_unsafe_line:true",
      );
  });

  it("does not let Corp remote-steal follow-up displace a legal score window", () => {
    const input = corpActionPhaseInput(
      "ai-corp-outcome-score-window-protected",
      (state) => {
        state.corp.credits = 8;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 3);
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const score = input.legalActions.find(
      (action) => action.type === "score_agenda",
    );
    const protect = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1",
    );
    expect(score).toBeDefined();
    expect(protect).toBeDefined();
    if (!score || !protect)
      throw new Error("Missing score-protected follow-up actions");
    const scopedInput = {
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      ownDeckDoctrine: corpDoctrineForTest(
        "corp-outcome-score-window-protected",
        ["score_remote"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-stole-prior-remote-agenda",
          input.playerView.stateVersion + 1,
          "runner",
          "steal_agenda",
          "remote_1",
        ),
      ],
      legalActions: [score, protect],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_now",
    );
    const protectCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.legalActionIds.includes(protect.actionId),
    );
    expect(scoreCandidate).toBeDefined();
    expect(protectCandidate).toBeDefined();
    if (!scoreCandidate || !protectCandidate)
      throw new Error("Missing score-protected follow-up candidates");

    const scorePlan = evaluateCorpPlan(scopedInput, scoreCandidate);
    const protectPlan = evaluateCorpPlan(scopedInput, protectCandidate);
    const decision = chooseCorpAction(scopedInput);

    expect(decision.actionId).toBe(score.actionId);
    expect(scorePlan.evidence).toContain(
      "score_now_protected_from_followup:true",
    );
    expect(scorePlan.evidence).toContain(
      "outcome_followup_preserved_score_window:true",
    );
    expect(protectPlan.evidence).toContain(
      "outcome_followup_suppressed_by_better_immediate_value:true",
    );
  });

  it("converts a failed Runner remote run into Corp score-line progress", () => {
    const input = corpActionPhaseInput(
      "ai-corp-outcome-runner-failed-remote",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing failed-run follow-up actions");
    const scopedInput = {
      ...input,
      profileId: "corp-ai-v1.4.2-normal",
      ownDeckDoctrine: corpDoctrineForTest(
        "corp-outcome-failed-run",
        ["score_remote"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-jacked-out-remote",
          input.playerView.stateVersion + 1,
          "runner",
          "jack_out",
          "remote_1",
        ),
      ],
      legalActions: [advance, gain],
    };
    const scoreNext = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const economy = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(scoreNext).toBeDefined();
    expect(economy).toBeDefined();
    if (!scoreNext || !economy)
      throw new Error("Missing failed-run follow-up candidates");

    expect(evaluateCorpPlan(scopedInput, scoreNext).score).toBeGreaterThan(
      evaluateCorpPlan(scopedInput, economy).score,
    );
    expect(evaluateCorpPlan(scopedInput, scoreNext).evidence).toContain(
      "corp_runner_failed_run_followup_score_or_advance:true",
    );
  });

  it("evaluates Corp mulligan choices from opening hand and deck doctrine", () => {
    const baseInput = corpActionPhaseInput("ai-doctrine-mulligan", (state) => {
      state.corp.credits = 5;
    });
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-glacier-corp",
      side: "corp",
      cards: [
        { cardId: "simple_agenda", quantity: 6 },
        { cardId: "simple_barrier_ice", quantity: 12 },
        { cardId: "simple_economy_operation", quantity: 6 },
      ],
    });
    const choiceAction: LegalAction = {
      ...baseInput.legalActions[0]!,
      actionId: "corp.resolve_choice.setup_mulligan",
      type: "resolve_choice",
      source: "game_rule",
    };
    const choice = {
      choiceId: "setup_mulligan_corp",
      side: "corp" as const,
      source: "setup.mulligan",
      prompt: "Mulligan?",
      kind: "select_option" as const,
      options: [
        { id: "keep", label: "Behalten", value: "keep" },
        { id: "mulligan", label: "Mulligan", value: "mulligan" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: baseInput.actionNumber,
      visibility: "private_to_side" as const,
    };
    const floodInput = {
      ...baseInput,
      ownDeckDoctrine: doctrine,
      legalActions: [choiceAction],
      playerView: {
        ...baseInput.playerView,
        pendingChoice: choice,
        own: {
          ...baseInput.playerView.own,
          gripOrHq: [
            visibleCard("simple_agenda", "agenda_a"),
            visibleCard("simple_agenda", "agenda_b"),
            visibleCard("simple_agenda", "agenda_c"),
            visibleCard("simple_economy_operation", "economy_a"),
            visibleCard("simple_economy_asset", "asset_a"),
          ],
        },
      },
    };
    const keepInput = {
      ...floodInput,
      playerView: {
        ...floodInput.playerView,
        own: {
          ...floodInput.playerView.own,
          gripOrHq: [
            visibleCard("simple_barrier_ice", "ice_a"),
            visibleCard("simple_barrier_ice", "ice_b"),
            visibleCard("simple_economy_operation", "economy_b"),
            visibleCard("simple_agenda", "agenda_d"),
            visibleCard("simple_economy_asset", "asset_b"),
          ],
        },
      },
    };

    expect(evaluateCorpOpeningHand(floodInput).decision).toBe("mulligan");
    expect(chooseCorpAction(floodInput).selectedChoices).toEqual({
      choiceId: "setup_mulligan_corp",
      selectedOptionIds: ["mulligan"],
    });
    expect(evaluateCorpOpeningHand(keepInput).decision).toBe("keep");
    expect(chooseCorpAction(keepInput).selectedChoices).toEqual({
      choiceId: "setup_mulligan_corp",
      selectedOptionIds: ["keep"],
    });
  });

  it("evaluates Runner mulligan choices from opening hand and deck doctrine", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-runner-doctrine-mulligan",
      (state) => {
        state.runner.credits = 5;
      },
    );
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rig-runner",
      side: "runner",
      cards: [
        { cardId: "simple_fracter", quantity: 4 },
        { cardId: "simple_decoder", quantity: 4 },
        { cardId: "simple_economy_event", quantity: 6 },
        { cardId: "simple_run_event", quantity: 4 },
      ],
    });
    const choiceAction: LegalAction = {
      ...baseInput.legalActions[0]!,
      actionId: "runner.resolve_choice.setup_mulligan",
      type: "resolve_choice",
      source: "game_rule",
    };
    const choice: ChoiceRequest = {
      choiceId: "setup_mulligan_runner",
      side: "runner",
      source: "setup.mulligan",
      prompt: "Mulligan?",
      kind: "select_option",
      options: [
        { id: "keep", label: "Behalten", value: "keep" },
        { id: "mulligan", label: "Mulligan", value: "mulligan" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: baseInput.actionNumber,
      visibility: "private_to_side",
    };
    const pressureFloodInput = {
      ...baseInput,
      ownDeckDoctrine: doctrine,
      legalActions: [choiceAction],
      playerView: {
        ...baseInput.playerView,
        pendingChoice: choice,
        own: {
          ...baseInput.playerView.own,
          gripOrHq: [
            visibleCard("simple_run_event", "run_a"),
            visibleCard("simple_run_event", "run_b"),
            visibleCard("simple_run_event", "run_c"),
            visibleCard("simple_run_event", "run_d"),
            visibleCard("simple_run_event", "run_e"),
          ],
        },
      },
    };
    const keepInput = {
      ...pressureFloodInput,
      playerView: {
        ...pressureFloodInput.playerView,
        own: {
          ...pressureFloodInput.playerView.own,
          gripOrHq: [
            visibleCard("simple_fracter", "fracter_a"),
            visibleCard("simple_decoder", "decoder_a"),
            visibleCard("simple_economy_event", "economy_a"),
            visibleCard("simple_run_event", "run_f"),
            visibleCard("simple_economy_event", "economy_b"),
          ],
        },
      },
    };

    const pressureDecision = chooseRunnerAction(pressureFloodInput);
    const keepDecision = chooseRunnerAction(keepInput);

    expect(evaluateRunnerOpeningHand(pressureFloodInput).decision).toBe(
      "mulligan",
    );
    expect(pressureDecision.reasonCode).toBe("runner.setup.mulligan");
    expect(pressureDecision.selectedChoices).toEqual({
      choiceId: "setup_mulligan_runner",
      selectedOptionIds: ["mulligan"],
    });
    expect(evaluateRunnerOpeningHand(keepInput).decision).toBe("keep");
    expect(keepDecision.reasonCode).toBe("runner.setup.keep");
    expect(keepDecision.selectedChoices).toEqual({
      choiceId: "setup_mulligan_runner",
      selectedOptionIds: ["keep"],
    });
    expect(JSON.stringify(keepDecision.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_fracter|simple_economy_event/,
    );
  });

  it("selects Runner strategic lines deterministically for the same seed and state", () => {
    const input = strategicRunnerInput("ai-strategic-line-deterministic");
    const first = chooseRunnerPlanDecision(input);
    const second = chooseRunnerPlanDecision({ ...input });

    expect(strategicLineKindFromDebug(first.debug)).toBeDefined();
    expect(strategicLineKindFromDebug(first.debug)).toBe(
      strategicLineKindFromDebug(second.debug),
    );
    expect(first.selectedPlanId).toBe(second.selectedPlanId);
    expect(JSON.stringify(first.debug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState/i,
    );
  });

  it("allows seeded Runner line variance when HQ and R&D pressure are similarly plausible", () => {
    const lineKinds = new Set(
      ["line-a", "line-b", "line-c", "line-d", "line-e", "line-f"].map(
        (suffix) =>
          strategicLineKindFromDebug(
            chooseRunnerPlanDecision(strategicRunnerInput(suffix)).debug,
          ),
      ),
    );

    expect(lineKinds.size).toBeGreaterThan(1);
    expect([...lineKinds]).toEqual(
      expect.arrayContaining(["early_hq_pressure"]),
    );
    expect([...lineKinds].every(Boolean)).toBe(true);
  });

  it("keeps a dominant Runner closeout line stable across seeds", () => {
    const lineKinds = new Set(
      ["closeout-a", "closeout-b", "closeout-c", "closeout-d"].map((seed) =>
        strategicLineKindFromDebug(
          chooseRunnerPlanDecision(
            strategicRunnerInput(seed, {
              knownHqAgenda: true,
              runnerAgendaPoints: 5,
            }),
          ).debug,
        ),
      ),
    );

    expect([...lineKinds]).toEqual(["closeout_pressure"]);
  });

  it("selects and continues a Corp remote scoring strategic line", () => {
    const input = strategicCorpInput("ai-strategic-corp-remote", (state) => {
      state.corp.credits = 7;
      moveCorpCardToHq(state, "simple_agenda");
      moveCorpCardToHq(state, "simple_barrier_ice");
    });
    const decision = chooseCorpPlanDecision(input);

    expect(strategicLineKindFromDebug(decision.debug)).toBe(
      "remote_scoring_build",
    );
    expect(decision.debug.evidence).toContain(
      "strategic_line_continuation_taken:true",
    );
    expect(["build_scoring_remote", "score_next_turn"]).toContain(
      decision.debug.planKind,
    );
  });

  it("lets Corp score-now override strategic line variance", () => {
    const input = strategicCorpInput("ai-strategic-corp-score-now", (state) => {
      state.corp.credits = 7;
      putCorpRootInRemote(state, "simple_agenda", 3);
    });
    const decision = chooseCorpPlanDecision(input);

    expect(decision.debug.planKind).toBe("score_now");
    expect(strategicLineKindFromDebug(decision.debug)).toBe("score_closeout");
    expect(JSON.stringify(decision.debug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState/i,
    );
  });

  it("summarizes strategic-line metrics from side-safe evidence", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "install_card", undefined, 1, {
          evidence: [
            "strategic_line_selected:true",
            "strategic_line_side:runner",
            "strategic_line_kind:rig_first",
            "strategic_line_selected_by_seed:true",
            "strategic_line_commitment_ttl:3",
            "strategic_line_continuation_taken:true",
          ],
        }),
        progressionAction("runner", 2, "start_run", "rd", 1, {
          evidence: [
            "strategic_line_selected:true",
            "strategic_line_side:runner",
            "strategic_line_kind:early_rnd_pressure",
            "strategic_line_commitment_ttl:3",
          ],
        }),
        progressionAction("runner", 3, "steal_agenda", "rd", 1),
        progressionAction("corp", 4, "score_agenda", "remote_1", 2, {
          evidence: [
            "strategic_line_selected:true",
            "strategic_line_side:corp",
            "strategic_line_kind:score_closeout",
            "strategic_line_commitment_ttl:3",
            "strategic_line_continuation_taken:true",
          ],
        }),
      ]),
    ]);

    expect(metrics.strategicLineSelected).toBe(3);
    expect(metrics.strategicLineSelectedBySideRunner).toBe(2);
    expect(metrics.strategicLineSelectedBySideCorp).toBe(1);
    expect(metrics.strategicLineSelectedBySeed).toBe(1);
    expect(metrics.runnerStrategicLineRigFirst).toBe(1);
    expect(metrics.runnerStrategicLineEarlyRndPressure).toBe(1);
    expect(metrics.corpStrategicLineScoreCloseout).toBe(1);
    expect(metrics.strategicLineConvertedToProgress).toBeGreaterThan(0);
    expect(metrics.lineCommitmentLedToSteal).toBeGreaterThan(0);
    expect(metrics.lineCommitmentLedToScore).toBeGreaterThan(0);
    expect(metrics.strategicLineVarianceAcrossSeeds).toBeGreaterThan(0);
  });

  it("prefers ICE protection over installing a naked agenda in a new remote", () => {
    const input = corpActionPhaseInput(
      "ai-v140-naked-agenda-guard",
      (state) => {
        state.corp.credits = 7;
        moveCorpCardToHq(state, "simple_agenda");
        moveCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const nakedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const rdIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd" &&
        sourceDefinitionFromInput(input, action) === "simple_barrier_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(nakedAgendaInstall).toBeDefined();
    expect(rdIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!nakedAgendaInstall || !rdIceInstall || !gain)
      throw new Error("Missing naked-agenda guard fixture actions");
    const decision = chooseCorpAction({
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      legalActions: [nakedAgendaInstall, rdIceInstall, gain],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.actionId).toBe(rdIceInstall.actionId);
    expect(decision.reasonCode).toBe("corp.plan.protect_rnd");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Fracter/,
    );
  });

  it("does not treat a new naked agenda remote as a score-next-turn plan", () => {
    const input = corpActionPhaseInput(
      "ai-v140-naked-agenda-no-score-next",
      (state) => {
        state.corp.credits = 7;
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const nakedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "new_remote" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(nakedAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!nakedAgendaInstall || !gain)
      throw new Error("Missing naked-agenda no-score fixture actions");
    expect(
      generateCorpPlanCandidates({
        ...input,
        legalActions: [nakedAgendaInstall, gain],
      }).some((candidate) => candidate.kind === "score_next_turn"),
    ).toBe(false);
    expect(
      generateCorpPlanCandidates({
        ...input,
        legalActions: [nakedAgendaInstall, gain],
      }).some((candidate) => candidate.kind === "build_scoring_remote"),
    ).toBe(false);

    const decision = chooseCorpAction({
      ...input,
      legalActions: [nakedAgendaInstall, gain],
    });

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("corp.plan.recover_economy");
  });

  it("uses an existing protected remote before a new naked agenda remote", () => {
    const input = corpActionPhaseInput(
      "ai-v140-protected-remote-before-new",
      (state) => {
        state.corp.credits = 7;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        moveCorpCardToHq(state, "simple_agenda");
      },
    );
    const agendaInstalls = input.legalActions.filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        ["new_remote", "remote_1"].includes(
          String(action.payload?.serverId ?? ""),
        ) &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );

    expect(
      agendaInstalls.some(
        (action) => action.payload?.serverId === "new_remote",
      ),
    ).toBe(true);
    expect(
      agendaInstalls.some((action) => action.payload?.serverId === "remote_1"),
    ).toBe(true);
    const decision = chooseCorpAction({
      ...input,
      legalActions: agendaInstalls,
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.payload?.serverId).toBe("remote_1");
    expect(decision.reasonCode).toBe("corp.plan.score_next_turn");
  });

  it("uses own HQ agenda pressure to choose a protected remote score line", () => {
    const input = corpActionPhaseInput(
      "ai-corp-agenda-flood-protected-remote",
      (state) => {
        state.corp.credits = 7;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putAgendaFloodInCorpHq(state);
        moveUnusedCorpCardToHq(state, "simple_code_gate_ice");
      },
    );
    const floodInput = withSyntheticCorpAgendaPressure(input);
    const protectedAgendaInstall = floodInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(floodInput, action) === "simple_agenda",
    );
    const hqIceInstall = floodInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "hq",
    );
    const gain = floodInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(protectedAgendaInstall).toBeDefined();
    expect(hqIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!protectedAgendaInstall || !hqIceInstall || !gain)
      throw new Error("Missing protected agenda-flood fixture actions");

    const scopedInput = {
      ...floodInput,
      legalActions: [protectedAgendaInstall, hqIceInstall, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(scoreCandidate).toBeDefined();
    if (!scoreCandidate)
      throw new Error("Missing protected agenda-flood score candidate");
    expect(evaluateAgendaRisk(scopedInput, scoreCandidate).evidence).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^own_agenda_count:[3-9]\d*$/),
        "protectedRemoteAvailable:true",
        "rezReserveAvailable:true",
      ]),
    );
    expect(evaluateAgendaRisk(scopedInput, scoreCandidate).reasons).toContain(
      "own_agenda_pressure",
    );
    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(protectedAgendaInstall.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda|simple_priority_agenda/,
    );
  });

  it("prepares remote ICE instead of exposing flooded HQ agendas into an unprotected remote", () => {
    const input = corpActionPhaseInput(
      "ai-corp-agenda-flood-unprotected-remote",
      (state) => {
        state.corp.credits = 7;
        ensureRemoteServer(state, "remote_1");
        putAgendaFloodInCorpHq(state);
        moveUnusedCorpCardToHq(state, "simple_barrier_ice");
      },
    );
    const floodInput = withSyntheticCorpAgendaPressure(input);
    const unprotectedAgendaInstall = floodInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(floodInput, action) === "simple_agenda",
    );
    const remoteIceInstall = floodInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(floodInput, action) === "simple_barrier_ice",
    );
    const gain = floodInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(unprotectedAgendaInstall).toBeDefined();
    expect(remoteIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!unprotectedAgendaInstall || !remoteIceInstall || !gain)
      throw new Error("Missing unprotected agenda-flood fixture actions");

    const scopedInput = {
      ...floodInput,
      legalActions: [unprotectedAgendaInstall, remoteIceInstall, gain],
    };
    const candidates = generateCorpPlanCandidates(scopedInput);
    const remoteCandidate = candidates.find(
      (candidate) => candidate.kind === "build_scoring_remote",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(
      candidates
        .filter((candidate) => candidate.kind === "score_next_turn")
        .flatMap((candidate) => candidate.legalActionIds),
    ).not.toContain(unprotectedAgendaInstall.actionId);
    expect(remoteCandidate?.legalActionIds).toContain(
      remoteIceInstall.actionId,
    );
    expect(remoteCandidate).toBeDefined();
    if (!remoteCandidate)
      throw new Error("Missing unprotected agenda-flood remote candidate");
    expect(evaluateAgendaRisk(scopedInput, remoteCandidate).evidence).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^own_agenda_count:[3-9]\d*$/),
        "protectedRemoteAvailable:false",
      ]),
    );
    expect(evaluateAgendaRisk(scopedInput, remoteCandidate).reasons).toContain(
      "prepare_protected_remote",
    );
    expect(decision.debug.planKind).toBe("build_scoring_remote");
    expect(decision.selectedActionId).toBe(remoteIceInstall.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda|simple_priority_agenda/,
    );
  });

  it("builds economy when agenda-flooded HQ lacks remote ICE rez reserve", () => {
    const input = corpActionPhaseInput(
      "ai-corp-agenda-flood-missing-rez-reserve",
      (state) => {
        state.corp.credits = 2;
        state.runner.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putAgendaFloodInCorpHq(state);
      },
    );
    const floodInput = withSyntheticCorpAgendaPressure(input);
    const protectedAgendaInstall = floodInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(floodInput, action) === "simple_agenda",
    );
    const gain = floodInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(protectedAgendaInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!protectedAgendaInstall || !gain)
      throw new Error("Missing missing-reserve agenda-flood fixture actions");

    const scopedInput = {
      ...floodInput,
      legalActions: [protectedAgendaInstall, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const economyCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(economyCandidate).toBeDefined();
    if (!economyCandidate)
      throw new Error("Missing missing-reserve agenda-flood candidates");
    expect(scoreCandidate).toBeUndefined();
    expect(evaluateAgendaRisk(scopedInput, economyCandidate).evidence).toEqual(
      expect.arrayContaining([
        "protectedRemoteAvailable:false",
        "rezReserveAvailable:false",
      ]),
    );
    expect(
      evaluateRemoteRezReserve(scopedInput, economyCandidate).reasons,
    ).toContain("remote_rez_reserve_building");
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda|simple_priority_agenda/,
    );
  });

  it("penalizes repeating an advanced remote agenda after a recent steal without rez reserve", () => {
    const input = corpActionPhaseInput(
      "ai-corp-recent-remote-agenda-loss",
      (state) => {
        state.corp.credits = 2;
        state.runner.credits = 5;
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
      },
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(advance).toBeDefined();
    expect(gain).toBeDefined();
    if (!advance || !gain)
      throw new Error("Missing recent remote agenda loss fixture actions");

    const eventTail: PublicGameEvent[] = [
      ...input.eventTail,
      {
        eventId: "test-recent-remote-agenda-steal",
        type: "steal_agenda",
        stateVersionBefore: input.actionNumber - 1,
        stateVersionAfter: input.actionNumber,
        stateHashAfter: "test-hash",
        publicPayload: {
          actionType: "steal_agenda",
          serverId: "remote_1",
        },
      },
    ];
    const scopedInput = {
      ...input,
      eventTail,
      legalActions: [advance, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(scoreCandidate).toBeDefined();
    if (!scoreCandidate)
      throw new Error("Missing recent-loss score-next-turn candidate");
    const score = evaluateCorpPlan(scopedInput, scoreCandidate);
    expect(score.reasons).toContain("recent_remote_agenda_loss_risky_repeat");
    expect(score.evidence).toEqual(
      expect.arrayContaining([
        "recent_remote_agenda_loss:remote_1",
        "recent_remote_agenda_repeat:risky",
        "remote_bluff_budget:blocked",
      ]),
    );
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gain.actionId);
    expect(JSON.stringify(score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("rezzes affordable remote ICE before an advanced root agenda access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-corp-rez-advanced-remote-root" }),
    );
    state.corp.credits = 3;
    state.runner.credits = 5;
    ensureRemoteServer(state, "remote_1");
    const iceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    putCorpRootInRemote(state, "simple_agenda", 1);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const rez = input.legalActions.find(
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    const decline = input.legalActions.find(
      (action) => action.type === "decline_rez",
    );

    expect(rez).toBeDefined();
    expect(decline).toBeDefined();
    if (!rez || !decline)
      throw new Error("Missing remote root rez fixture actions");

    const decision = chooseCorpAction({
      ...input,
      legalActions: [decline, rez],
    });

    expect(decision.actionId).toBe(rez.actionId);
    expect(decision.reasonCode).toBe("corp.rez.defensive_card");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["run_window", "runner_credits:5"]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("pushes protected Corp scoring progress before redundant central defense", () => {
    const input = corpActionPhaseInput("ai-v140-scoring-progress", (state) => {
      state.stateVersion = 32;
      state.corp.credits = 8;
      state.corp.clicks = 3;
      ensureRemoteServer(state, "remote_1");
      putCorpIceOnServer(state, "hq", "simple_barrier_ice");
      putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
      putCorpIceOnServer(state, "remote_1", "simple_sentry_ice");
      moveCorpCardToHq(state, "simple_agenda");
      moveUnusedCorpCardToHq(state, "simple_barrier_ice");
    });
    const protectedAgendaInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement !== "ice" &&
        action.payload?.serverId === "remote_1" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const centralIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(protectedAgendaInstall).toBeDefined();
    expect(centralIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!protectedAgendaInstall || !centralIceInstall || !gain)
      throw new Error("Missing Corp scoring-progress fixture actions");

    const scopedInput = {
      ...input,
      actionNumber: 32,
      legalActions: [protectedAgendaInstall, centralIceInstall, gain],
    };
    const scoreCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "score_next_turn",
    );
    const protectCandidate = generateCorpPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "protect_rnd",
    );
    const decision = chooseCorpPlanDecision(scopedInput);

    expect(scoreCandidate).toBeDefined();
    expect(protectCandidate).toBeDefined();
    if (!scoreCandidate || !protectCandidate)
      throw new Error("Missing Corp scoring-progress candidates");
    expect(
      evaluateCorpScoringProgress(scopedInput, scoreCandidate).reasons,
    ).toContain("protected_agenda_scoring_progress");
    expect(
      evaluateCorpScoringProgress(scopedInput, protectCandidate).reasons,
    ).toContain("central_defense_saturated_before_scoring");
    expect(decision.debug.planKind).toBe("score_next_turn");
    expect(decision.selectedActionId).toBe(protectedAgendaInstall.actionId);
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda/,
    );
  });

  it("draws for scoring when Corp has stable credits and protected centrals but no agenda", () => {
    const input = corpActionPhaseInput("ai-v140-draw-for-scoring", (state) => {
      state.corp.credits = 5;
      state.corp.clicks = 3;
      putCorpIceOnServer(state, "hq", "simple_barrier_ice");
      putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
      moveCorpHqAgendasToRd(state);
    });
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(draw).toBeDefined();
    expect(gain).toBeDefined();
    if (!draw || !gain)
      throw new Error("Missing Corp draw-for-scoring fixture actions");

    const decision = chooseCorpPlanDecision({
      ...input,
      legalActions: [gain, draw],
    });

    expect(
      input.playerView.own.gripOrHq.some(
        (card) => card.definitionId === "simple_agenda",
      ),
    ).toBe(false);
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(draw.actionId);
  });

  it("loads post-V1.9.9 AI hints into Corp plan roles", () => {
    let state = createGameAfterSetup({
      seed: "ai-v1922-hints-in-plan",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: V1911_RUNNER_DECK,
      corpDeck: {
        id: "ai_v1922_hint_corp",
        name: "AI V1.9.22 Hint Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_247_haunting-inquisition", quantity: 1 },
          { id: "onr_v1_203_hostile-takeover", quantity: 3 },
          { id: "onr_v1_220_tycho-extension", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 12;
    moveCorpCardToHq(state, "onr_v1_247_haunting-inquisition");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const protectRnd = generateCorpPlanCandidates(input).find(
      (candidate) => candidate.kind === "protect_rnd",
    );

    expect(protectRnd?.requiredRoles).toEqual(
      expect.arrayContaining([
        "corp_install_ice",
        "corp_rez_ice",
        "per_card_longtail",
      ]),
    );
  });

  it("keeps DecisionDebug side-safe and falls back legally under zero budget", () => {
    const input = corpActionPhaseInput("ai-v140-debug", (state) => {
      state.corp.credits = 8;
      putCorpRootInRemote(state, "simple_agenda", 3);
    });
    const decision = chooseCorpAction(input);
    const fallback = chooseCorpPlanDecision(input, { timeBudgetMs: 0 });
    const serializedDebug = JSON.stringify(decision.decisionDebug);

    expect(decision.reasonCode).toBe("corp.plan.score_now");
    expect(decision.decisionDebug).toMatchObject({
      aiLevel: 2,
      planKind: "score_now",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(serializedDebug).not.toContain("cardInstances");
    expect(serializedDebug).not.toContain("privatePayload");
    expect(serializedDebug).not.toContain("Simple Fracter");
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.debug.timeoutUsed).toBe(true);
    expect(
      input.legalActions.some(
        (action) => action.actionId === fallback.selectedActionId,
      ),
    ).toBe(true);
  });

  it("kept Runner AI on the pre-V1.4.1 heuristic path before the Runner gate", () => {
    const input = buildAiDecisionInput(
      toRunnerTurn(createGameAfterSetup({ seed: "ai-v140-runner-regression" })),
      "runner",
      { difficulty: "normal" },
    );
    const decision = chooseRunnerAction(input);

    expect(decision.reasonCode.startsWith("runner.")).toBe(true);
    expect(decision.decisionDebug).toMatchObject({ aiLevel: 2 });
  });

  it("allows newly approved legacy cards in Corp strategic plan roles via legal actions", () => {
    let state = createGameAfterSetup({
      seed: "ai-v140-unsupported-card",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: ONR_V1_2_3_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const unsupportedId = moveCorpCardToHq(
      state,
      "onr_v1_297_overtime-incentives",
    );
    const input = buildAiDecisionInput(state, "corp", { difficulty: "normal" });
    const unsupportedAction = input.legalActions.find(
      (action) => action.source === unsupportedId,
    );

    expect(unsupportedAction).toBeDefined();
    expect(
      generateCorpPlanCandidates(input).some((candidate) =>
        candidate.legalActionIds.includes(unsupportedAction?.actionId ?? ""),
      ),
    ).toBe(true);
  });

  it("does not play Overtime Incentives when extra actions only recover basic credits at a net loss", () => {
    let state = createGameAfterSetup({
      seed: "ai-corp-overtime-basic-credit-loss",
      baseline: CURRENT_RULES_BASELINE,
      corpDeck: {
        id: "ai_overtime_loss_corp",
        name: "AI Overtime Loss Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_297_overtime-incentives", quantity: 1 },
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_barrier_ice", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 4;
    state.corp.clicks = 1;
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const overtime = input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_297_overtime-incentives",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(overtime).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!overtime || !basicCredit)
      throw new Error("Missing Overtime loss fixture actions");
    const decision = chooseCorpAction({
      ...input,
      legalActions: [overtime, basicCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(basicCredit.actionId);
    expect(decision.reasonCode).toBe("corp.plan.recover_economy");
    expect(debugText).toContain("basic_credit_followup_only:true");
    expect(debugText).toContain("overtime_net_value:-2");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("can play Overtime Incentives when the extra actions open an immediate score window", () => {
    let state = createGameAfterSetup({
      seed: "ai-corp-overtime-score-window",
      baseline: CURRENT_RULES_BASELINE,
      corpDeck: {
        id: "ai_overtime_score_corp",
        name: "AI Overtime Score Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_297_overtime-incentives", quantity: 1 },
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_barrier_ice", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 6;
    state.corp.clicks = 1;
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");
    putCorpRootInRemote(state, "simple_agenda", 2);
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const overtime = input.legalActions.find(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_297_overtime-incentives",
    );
    const advance = input.legalActions.find(
      (action) =>
        action.type === "advance_card" &&
        sourceDefinitionFromInput(input, action) === "simple_agenda",
    );
    const basicCredit = input.legalActions.find(
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(overtime).toBeDefined();
    expect(advance).toBeDefined();
    expect(basicCredit).toBeDefined();
    if (!overtime || !advance || !basicCredit)
      throw new Error("Missing Overtime score-window fixture actions");
    const decision = chooseCorpAction({
      ...input,
      legalActions: [overtime, advance, basicCredit],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(overtime.actionId);
    expect(decision.reasonCode).toBe("corp.plan.score_next_turn");
    expect(debugText).toContain("score_window_after_extra_actions:true");
    expect(debugText).toContain("basic_credit_followup_only:false");
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("uses tag-enabling ICE pressure without hidden-info leakage", () => {
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-slice-ice-pressure",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: CORP_TAG_SLICE_RUNNER_DECK,
      corpDeck: CORP_TAG_SLICE_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 8;
    moveCorpCardToHq(state, "simple_tag_ice");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const rdTagIceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd" &&
        sourceDefinitionFromInput(input, action) === "simple_tag_ice",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(rdTagIceInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdTagIceInstall || !gain)
      throw new Error("Missing tag-enabling ICE fixture actions");
    const decision = chooseCorpAction({
      ...input,
      legalActions: [rdTagIceInstall, gain],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected?.type).toBe("install_card");
    expect(decision.reasonCode).toBe("corp.plan.protect_rnd");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event|Simple Run Event/,
    );
  });

  it("uses trace/tag ICE pressure without hidden-info leakage", () => {
    if (!createRuntimeCardsById()["onr_v1_243_fetch-4-0-1"]) return;
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-slice-unreleased-ice-pressure",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: CORP_TAG_SLICE_RUNNER_DECK,
      corpDeck: CORP_TAG_SLICE_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 8;
    moveCorpCardToHq(state, "onr_v1_243_fetch-4-0-1");
    moveCorpCardToHq(state, "onr_v1_249_hunter");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const rdTraceTagIceInstalls = input.legalActions.filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.placement === "ice" &&
        action.payload?.serverId === "rd" &&
        ["onr_v1_243_fetch-4-0-1", "onr_v1_249_hunter"].includes(
          sourceDefinitionFromInput(input, action) ?? "",
        ),
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(rdTraceTagIceInstalls.length).toBeGreaterThan(0);
    expect(gain).toBeDefined();
    if (!gain)
      throw new Error("Missing trace/tag ICE gain-credit fallback action");
    const decision = chooseCorpAction({
      ...input,
      legalActions: [...rdTraceTagIceInstalls, gain],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const selectedDefinition = selected
      ? sourceDefinitionFromInput(input, selected)
      : undefined;
    expect(selected?.type).toBe("install_card");
    expect(["onr_v1_243_fetch-4-0-1", "onr_v1_249_hunter"]).toContain(
      selectedDefinition,
    );
    expect(decision.reasonCode).toBe("corp.plan.protect_rnd");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event|Simple Run Event/,
    );
  });

  it("classifies tag source and payoff LegalActions from structured ontology only when legal and visible", () => {
    const operation = (source: string): LegalAction =>
      ({
        actionId: `test.${source}`,
        type: "play_operation",
        side: "corp",
        source: "corp_hq_card",
        label: source,
        timingPoint: "corp_action",
        costs: [],
      }) as unknown as LegalAction;

    const audit = classifyTagPunishLegalActionFromOntology(
      operation("Audit of Call Records"),
      "onr_v1_283_audit-of-call-records",
      { runnerTagged: false, legacyRoles: ["trace_operation"] },
    );
    expect(audit?.isTagSource).toBe(true);
    expect(audit?.isTraceTagSource).toBe(true);
    expect(audit?.isPunishPayoff).toBe(false);
    expect(audit?.evidence).toEqual(
      expect.arrayContaining([
        "corp_tag_source_legal_action_classified_by_ontology:true",
        "corp_tag_punish_ontology_kind:tag_source",
        "corp_tag_punish_condition:requires_trace_success",
      ]),
    );

    const taggedDatapool = classifyTagPunishLegalActionFromOntology(
      operation("Datapool by Zetatech"),
      "onr_v1_287_datapool-by-zetatech",
      { runnerTagged: true, legacyRoles: ["operation"] },
    );
    expect(taggedDatapool?.isPunishPayoff).toBe(true);
    expect(taggedDatapool?.blockedByMissingTag).toBe(false);
    expect(taggedDatapool?.evidence).toEqual(
      expect.arrayContaining([
        "corp_punish_legal_action_classified_by_ontology:true",
        "corp_punish_opportunity_confirmed_by_ontology:true",
        "corp_tag_punish_condition:requires_runner_tagged",
      ]),
    );

    const untaggedDatapool = classifyTagPunishLegalActionFromOntology(
      operation("Datapool by Zetatech"),
      "onr_v1_287_datapool-by-zetatech",
      { runnerTagged: false, legacyRoles: ["operation"] },
    );
    expect(untaggedDatapool?.isPunishPayoff).toBe(false);
    expect(untaggedDatapool?.blockedByMissingTag).toBe(true);
    expect(untaggedDatapool?.evidence).toContain(
      "corp_tag_punish_payoff_blocked_by_missing_visible_tag:true",
    );
    const noLegalCarrier = classifyTagPunishLegalActionFromOntology(
      {
        ...operation("Datapool by Zetatech"),
        type: "end_turn",
        source: "game_rule",
      } as LegalAction,
      "onr_v1_287_datapool-by-zetatech",
      { runnerTagged: true, legacyRoles: [] },
    );
    expect(noLegalCarrier).toBeUndefined();
  });

  it("uses tag punishment operations when the Runner is visibly tagged", () => {
    if (!createRuntimeCardsById()["onr_v1_287_datapool-by-zetatech"]) return;
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-slice-positive",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: CORP_TAG_SLICE_RUNNER_DECK,
      corpDeck: CORP_TAG_SLICE_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    state.corp.credits = 10;
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");
    moveCorpCardToHq(state, "onr_v1_293_netwatch-credit-voucher");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const tagOperations = input.legalActions.filter(
      (action) =>
        action.type === "play_operation" &&
        [
          "onr_v1_287_datapool-by-zetatech",
          "onr_v1_293_netwatch-credit-voucher",
        ].includes(sourceDefinitionFromInput(input, action) ?? ""),
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(activeAiApprovedCardIds).toEqual(
      expect.arrayContaining([
        "simple_tag_ice",
        "onr_v1_287_datapool-by-zetatech",
        "onr_v1_293_netwatch-credit-voucher",
        "onr_v1_243_fetch-4-0-1",
        "onr_v1_249_hunter",
        "onr_v1_306_trojan-horse",
      ]),
    );
    expect(tagOperations.length).toBeGreaterThan(0);
    expect(gain).toBeDefined();
    if (!gain)
      throw new Error("Missing tag-punishment gain-credit fallback action");
    const decision = chooseCorpAction({
      ...input,
      legalActions: [...tagOperations, gain],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const selectedDefinition = selected
      ? sourceDefinitionFromInput(input, selected)
      : undefined;
    expect(selected?.type).toBe("play_operation");
    expect([
      "onr_v1_287_datapool-by-zetatech",
      "onr_v1_293_netwatch-credit-voucher",
    ]).toContain(selectedDefinition);
    expect(["corp.tag.punish_visible_tag"]).toContain(decision.reasonCode);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_tag_punish_payoff_ontology_used:true",
        "corp_punish_opportunity_confirmed_by_ontology:true",
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event|Simple Run Event/,
    );
  });

  it("skips tag punishment operations when the Runner is not tagged", () => {
    if (!createRuntimeCardsById()["onr_v1_287_datapool-by-zetatech"]) return;
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-slice-negative",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: CORP_TAG_SLICE_RUNNER_DECK,
      corpDeck: CORP_TAG_SLICE_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 0;
    moveCorpCardToHq(state, "onr_v1_287_datapool-by-zetatech");
    moveCorpCardToHq(state, "onr_v1_293_netwatch-credit-voucher");
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const tagOperations = input.legalActions.filter(
      (action) =>
        action.type === "play_operation" &&
        [
          "onr_v1_287_datapool-by-zetatech",
          "onr_v1_293_netwatch-credit-voucher",
        ].includes(sourceDefinitionFromInput(input, action) ?? ""),
    );

    expect(tagOperations).toHaveLength(0);
  });

  it("uses agenda-theft tag enablers after visible agenda theft", () => {
    if (!createRuntimeCardsById()["onr_v1_306_trojan-horse"]) return;
    let state = createGameAfterSetup({
      seed: "ai-corp-tag-slice-trojan-positive",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: CORP_TAG_SLICE_RUNNER_DECK,
      corpDeck: CORP_TAG_SLICE_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    putCorpRootInRemote(state, "simple_agenda", 0);
    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const trojanAfterTheft = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanAfterTheft);

    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const trojanActions = input.legalActions.filter(
      (action) =>
        action.type === "play_operation" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_306_trojan-horse",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(trojanActions.length).toBeGreaterThan(0);
    expect(gain).toBeDefined();
    if (!gain)
      throw new Error(
        "Missing agenda-theft tag-enabler gain-credit fallback action",
      );
    const decision = chooseCorpAction({
      ...input,
      legalActions: [...trojanActions, gain],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const selectedDefinition = selected
      ? sourceDefinitionFromInput(input, selected)
      : undefined;
    expect(selected?.type).toBe("play_operation");
    expect(selectedDefinition).toBe("onr_v1_306_trojan-horse");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|simple_run_event|Simple Run Event/,
    );
  });

  it("keeps plan-based Corp AI playable in Human-vs-Corp-KI and KI-vs-KI smokes", () => {
    const hvAi = runCorpAiOnlySmoke("ai-v140-human-corp-smoke", 24);
    const aiVsAi = simulateAiGame({
      seed: "ai-v140-ai-vs-ai-smoke",
      maxActions: 40,
      corpProfileId: "corp-ai-v1.4.0-normal",
    });

    expect(hvAi.errors).toEqual([]);
    expect(hvAi.actions).toBeGreaterThan(8);
    expect(aiVsAi.errors).toEqual([]);
    expect(aiVsAi.replayOk).toBe(true);
    expect(JSON.stringify(aiVsAi)).not.toContain("cardInstances");
    expect(
      aiVsAi.actionSequence.some((entry) =>
        entry.reasonCode.startsWith("corp.plan."),
      ),
    ).toBe(true);
  });

  it("benchmarks plan decisions against the old Corp heuristic baseline", () => {
    const scoreInput = corpActionPhaseInput(
      "ai-v140-benchmark-score",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInRemote(state, "simple_agenda", 3);
      },
    );
    const economyInput = corpActionPhaseInput(
      "ai-v140-benchmark-economy",
      (state) => {
        state.corp.credits = 1;
        moveCorpCardToHq(state, "simple_economy_operation");
      },
    );
    const planScore = chooseCorpAction(scoreInput);
    const baselineScore = chooseCorpBaselineAction(scoreInput);
    const planEconomy = chooseCorpAction(economyInput);
    const baselineEconomy = chooseCorpBaselineAction(economyInput);

    expect(planScore.actionId).toBe(baselineScore.actionId);
    expect(planScore.reasonCode).toBe("corp.plan.score_now");
    expect(baselineScore.reasonCode).toBe("corp.score_available_agenda");
    expect(planEconomy.reasonCode).toBe("corp.plan.recover_economy");
    expect(baselineEconomy.reasonCode.startsWith("corp.plan.")).toBe(false);
    expect(
      economyInput.legalActions.some(
        (action) => action.actionId === baselineEconomy.actionId,
      ),
    ).toBe(true);
  });
});

describe("V1.4.1 plan-based Runner AI", () => {
  it("generates only current LegalAction-backed Runner plans", () => {
    const input = runnerActionPhaseInput("ai-v141-generator", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 1);
      moveRunnerCardToGrip(state, "simple_fracter");
      moveRunnerCardToGrip(state, "simple_economy_event");
    });
    const candidates = generateRunnerPlanCandidates(input);
    const legalIds = new Set(
      input.legalActions.map((action) => action.actionId),
    );

    expect(candidates.map((candidate) => candidate.kind)).toEqual(
      expect.arrayContaining([
        "pressure_rnd",
        "pressure_hq",
        "contest_remote",
        "build_rig",
        "recover_economy",
        "draw_for_answers",
        "safe_probe_run",
      ]),
    );
    for (const candidate of candidates) {
      expect(
        candidate.legalActionIds.every((actionId) => legalIds.has(actionId)),
      ).toBe(true);
      expect(runnerPlanUsesOnlyAiSupportedCards(input, candidate)).toBe(true);
    }
  });

  it("scores Runner evaluators from visible board, public events and uncertainty", () => {
    const input = runnerActionPhaseInput("ai-v141-evaluators", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 2);
      moveRunnerCardToGrip(state, "simple_fracter");
    });
    const remoteInput = withPublicServerEventTail(input, [
      "rd",
      "hq",
      "remote_1",
    ]);
    const candidates = generateRunnerPlanCandidates(remoteInput);
    const remote = candidates.find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const build = candidates.find(
      (candidate) => candidate.kind === "build_rig",
    );

    expect(remote).toBeDefined();
    expect(build).toBeDefined();
    if (!remote || !build) throw new Error("Missing V1.4.1 evaluator fixtures");
    expect(evaluateRunnerRig(remoteInput, build).score).toBeGreaterThan(150);
    expect(estimateRunCost(remoteInput, remote).evidence).toContain(
      "target:remote_1",
    );
    expect(evaluateServerAccessValue(remoteInput, remote).evidence).toContain(
      "root_count:1",
    );
    expect(evaluateRemoteThreat(remoteInput, remote).score).toBeGreaterThan(
      100,
    );
    expect(evaluateCorpScoringThreat(remoteInput, remote).evidence).toContain(
      "corp_agenda:0",
    );
  });

  it("selects pressure, remote contest, rig, economy and safe probe plans in focused fixtures", () => {
    const pressureInput = runnerActionPhaseInput(
      "ai-v141-pressure",
      () => undefined,
    );
    const remoteInput = runnerActionPhaseInput("ai-v141-contest", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 2);
    });
    const buildInput = runnerActionPhaseInput("ai-v141-build", (state) => {
      moveRunnerCardToGrip(state, "simple_fracter");
    });
    const economyInput = runnerActionPhaseInput("ai-v141-economy", (state) => {
      state.runner.credits = 1;
      moveRunnerCardToGrip(state, "simple_economy_event");
    });
    const safeProbeInput = runnerActionPhaseInput(
      "ai-v141-safe-probe",
      (state) => {
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
      },
    );
    const pressureRun = pressureInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const pressureGain = pressureInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const remoteRun = remoteInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const economyAction =
      economyInput.legalActions.find(
        (action) =>
          action.type === "play_event" &&
          sourceDefinitionFromInput(economyInput, action) ===
            "simple_economy_event",
      ) ??
      economyInput.legalActions.find((action) => action.type === "gain_credit");
    const safeProbeRun = safeProbeInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(pressureRun).toBeDefined();
    expect(pressureGain).toBeDefined();
    expect(remoteRun).toBeDefined();
    expect(economyAction).toBeDefined();
    if (!pressureRun || !pressureGain || !remoteRun || !economyAction)
      throw new Error("Missing V1.4.1 focused fixture actions");
    expect(
      chooseRunnerPlanDecision({
        ...pressureInput,
        legalActions: [pressureRun, pressureGain],
      }).debug.planKind,
    ).toBe("pressure_rnd");
    expect(
      chooseRunnerPlanDecision({ ...remoteInput, legalActions: [remoteRun] })
        .debug.planKind,
    ).toBe("contest_remote");
    expect(chooseRunnerPlanDecision(buildInput).debug.planKind).toBe(
      "build_rig",
    );
    expect(
      chooseRunnerPlanDecision({
        ...economyInput,
        legalActions: [economyAction],
      }).debug.planKind,
    ).toBe("recover_economy");
    expect(safeProbeRun).toBeDefined();
    if (!safeProbeRun) throw new Error("Missing safe probe run");
    expect(
      chooseRunnerPlanDecision({
        ...safeProbeInput,
        legalActions: [safeProbeRun],
      }).debug.planKind,
    ).toBe("safe_probe_run");
  });

  it("recovers economy instead of making underprepared central pressure runs", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-underprepared-central",
      (state) => {
        state.runner.credits = 1;
      },
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(rdRun).toBeDefined();
    expect(hqRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!rdRun || !hqRun || !gainCredit)
      throw new Error("Missing underprepared central-pressure fixture actions");

    const decision = chooseRunnerPlanDecision({
      ...input,
      legalActions: [rdRun, hqRun, gainCredit],
    });
    const pressureCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [rdRun, hqRun, gainCredit],
    }).find((candidate) => candidate.kind === "pressure_hq");

    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gainCredit.actionId);
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate)
      throw new Error("Missing underprepared pressure_hq candidate");
    expect(evaluateRunnerRig(input, pressureCandidate).reasons).toContain(
      "central_pressure_underprepared",
    );
  });

  it("recovers economy before low-reserve central pressure through visible ICE", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-low-reserve-rd-ice",
      (state) => {
        state.runner.credits = 1;
        moveRunnerProgramToRig(state, "simple_fracter");
        putCorpIceOnServer(state, "rd", "simple_barrier_ice");
      },
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!rdRun || !gainCredit)
      throw new Error("Missing low-reserve R&D pressure fixture actions");

    const pressureCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [rdRun, gainCredit],
    }).find((candidate) => candidate.kind === "pressure_rnd");
    const decision = chooseRunnerPlanDecision({
      ...input,
      legalActions: [rdRun, gainCredit],
    });

    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    expect(evaluateRunnerRig(input, pressureCandidate).reasons).toContain(
      "central_pressure_underprepared",
    );
    expect(decision.debug.planKind).toBe("recover_economy");
    expect(decision.selectedActionId).toBe(gainCredit.actionId);
  });

  it("penalizes immediate repeated central pressure", () => {
    const input = withPublicServerEventTail(
      runnerActionPhaseInput("ai-v141-repeated-central", () => undefined),
      ["hq"],
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqRun).toBeDefined();
    if (!hqRun)
      throw new Error("Missing repeated central-pressure fixture action");

    const candidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [hqRun],
    }).find((plan) => plan.kind === "pressure_hq");

    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("Missing pressure_hq candidate");
    expect(evaluateServerAccessValue(input, candidate).reasons).toContain(
      "recent_central_pressure_repeated",
    );
  });

  it("paces low-reserve remote contest unless the visible threat is urgent", () => {
    const lowThreatInput = runnerActionPhaseInput(
      "ai-v141-low-reserve-remote",
      (state) => {
        state.runner.credits = 1;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 0);
      },
    );
    const urgentInput = runnerActionPhaseInput(
      "ai-v141-urgent-remote",
      (state) => {
        state.runner.credits = 1;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const lowRemoteRun = lowThreatInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const lowGain = lowThreatInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const urgentRemoteRun = urgentInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const urgentGain = urgentInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(lowRemoteRun).toBeDefined();
    expect(lowGain).toBeDefined();
    expect(urgentRemoteRun).toBeDefined();
    expect(urgentGain).toBeDefined();
    if (!lowRemoteRun || !lowGain || !urgentRemoteRun || !urgentGain)
      throw new Error("Missing remote pacing fixture actions");

    const lowCandidate = generateRunnerPlanCandidates({
      ...lowThreatInput,
      legalActions: [lowRemoteRun, lowGain],
    }).find((candidate) => candidate.kind === "contest_remote");
    const lowDecision = chooseRunnerPlanDecision({
      ...lowThreatInput,
      legalActions: [lowRemoteRun, lowGain],
    });
    const urgentDecision = chooseRunnerPlanDecision({
      ...urgentInput,
      legalActions: [urgentRemoteRun, urgentGain],
    });

    expect(lowCandidate).toBeDefined();
    if (!lowCandidate)
      throw new Error("Missing low-reserve contest_remote candidate");
    expect(
      evaluateRemoteThreat(lowThreatInput, lowCandidate).reasons,
    ).toContain("remote_contest_credit_reserve_low");
    expect(lowDecision.debug.planKind).toBe("recover_economy");
    expect(urgentDecision.debug.planKind).toBe("contest_remote");
  });

  it("recovers economy when Krash can pass Data Wall but cannot afford a known BBS trash afterward", () => {
    const input = krashDataWallBbsRemoteInput(
      "ai-v141-krash-bbs-trash-unaffordable",
      4,
      true,
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing Krash/BBS remote fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const recoverCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(contestCandidate).toBeDefined();
    expect(recoverCandidate).toBeDefined();
    if (!contestCandidate || !recoverCandidate)
      throw new Error("Missing Krash/BBS fixture candidates");

    const runCost = estimateRunCost(input, contestCandidate);
    const access = evaluateServerAccessValue(input, contestCandidate);
    const contestScore = evaluateRunnerPlan(input, contestCandidate);
    const recoverScore = evaluateRunnerPlan(input, recoverCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gain],
    });
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(runCost.evidence).toContain("visible_etr_break_cost:2");
    expect(access.reasons).toContain(
      "known_remote_root_trash_unaffordable_after_ice",
    );
    expect(access.evidence).toContain("known_remote_root_trash_cost:4");
    expect(access.evidence).toContain("known_remote_root_visible_break_cost:2");
    expect(access.evidence).toContain("known_remote_root_credits_after_ice:2");
    expect(contestScore.score).toBeLessThan(recoverScore.score);
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    expect(debugText).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("pivots Runner economy intent into a reachable contest instead of repeating economy", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-plan-continuation-economy",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        moveRunnerProgramToRig(state, "simple_fracter");
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing economy-continuation actions");
    const scopedInput = {
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      eventTail: [
        syntheticPlanActionEvent(
          "runner-prior-economy",
          1,
          "runner",
          "gain_credit",
        ),
      ],
      legalActions: [remoteRun, gain],
    };
    const contestCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const economyCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(contestCandidate).toBeDefined();
    expect(economyCandidate).toBeDefined();
    if (!contestCandidate || !economyCandidate)
      throw new Error("Missing economy-continuation candidates");
    const contestScore = evaluateRunnerPlan(scopedInput, contestCandidate);
    const economyScore = evaluateRunnerPlan(scopedInput, economyCandidate);
    const decision = chooseRunnerPlanDecision(scopedInput);

    expect(contestScore.score).toBeGreaterThan(economyScore.score);
    expect(contestScore.evidence).toContain(
      "plan_abort_reason:reserve_reached",
    );
    expect(contestScore.evidence).toContain("plan_abort_taken:true");
    expect(decision.debug.planKind).toBe("contest_remote");
  });

  it("pivots Runner after a no-value central access instead of repeating the same server", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-outcome-central-no-value",
      (state) => {
        state.runner.credits = 1;
      },
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain) throw new Error("Missing central outcome actions");
    const scopedInput = {
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      ownDeckDoctrine: runnerDoctrineForTest(
        "runner-outcome-central",
        ["balanced"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-outcome-rd-run",
          input.playerView.stateVersion + 1,
          "runner",
          "start_run",
          "rd",
        ),
        syntheticPlanActionEvent(
          "runner-outcome-rd-access",
          input.playerView.stateVersion + 2,
          "runner",
          "access_card",
          "rd",
        ),
      ],
      legalActions: [rdRun, gain],
    };
    const pressure = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    const economy = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(pressure).toBeDefined();
    expect(economy).toBeDefined();
    if (!pressure || !economy)
      throw new Error("Missing central outcome candidates");

    expect(evaluateRunnerPlan(scopedInput, economy).score).toBeGreaterThan(
      evaluateRunnerPlan(scopedInput, pressure).score,
    );
    expect(evaluateRunnerPlan(scopedInput, pressure).evidence).toContain(
      "runner_central_success_followed_by_repeat_no_value:true",
    );
    expect(evaluateRunnerPlan(scopedInput, economy).evidence).toContain(
      "runner_central_no_value_pivoted:true",
    );
  });

  it("suppresses Runner no-value central pivots that do not create progression", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-outcome-central-no-value-no-progress",
      (state) => {
        state.runner.credits = 8;
      },
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing no-progress central outcome actions");
    const scopedInput = {
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      ownDeckDoctrine: runnerDoctrineForTest(
        "runner-outcome-central-no-progress",
        ["balanced"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-outcome-no-progress-rd-run",
          input.playerView.stateVersion + 1,
          "runner",
          "start_run",
          "rd",
        ),
        syntheticPlanActionEvent(
          "runner-outcome-no-progress-rd-access",
          input.playerView.stateVersion + 2,
          "runner",
          "access_card",
          "rd",
        ),
      ],
      legalActions: [rdRun, gain],
    };
    const economy = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(economy).toBeDefined();
    if (!economy) throw new Error("Missing no-progress economy candidate");

    const score = evaluateRunnerPlan(scopedInput, economy);
    expect(score.evidence).toContain(
      "outcome_followup_suppressed_by_progression_cost:true",
    );
    expect(score.evidence).not.toContain(
      "runner_central_no_value_pivoted:true",
    );
    expect(score.evidence).not.toContain("outcome_followup_applied:true");
  });

  it("allows Runner central follow-up after visible interface value", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-outcome-central-fresh",
      (state) => {
        state.runner.credits = 5;
      },
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain) throw new Error("Missing central fresh actions");
    const scopedInput = {
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      ownDeckDoctrine: runnerDoctrineForTest(
        "runner-outcome-central-fresh",
        ["central_pressure"],
        { pressure_rnd: 12 },
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-outcome-fresh-rd-run",
          input.playerView.stateVersion + 1,
          "runner",
          "start_run",
          "rd",
        ),
        syntheticPlanActionEvent(
          "runner-outcome-fresh-rd-access",
          input.playerView.stateVersion + 2,
          "runner",
          "access_card",
          "rd",
          { interfaceValue: true },
        ),
      ],
      legalActions: [rdRun, gain],
    };
    const pressure = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressure).toBeDefined();
    if (!pressure) throw new Error("Missing central fresh candidate");

    const score = evaluateRunnerPlan(scopedInput, pressure);
    expect(score.evidence).toContain(
      "runner_central_success_followed_by_value:true",
    );
    expect(score.reasons).toContain("continue_central_after_fresh_value");
  });

  it("pivots Runner after an empty remote access instead of repeating it", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-outcome-empty-remote",
      (state) => {
        state.runner.credits = 1;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_economy_asset", 0);
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain) throw new Error("Missing remote outcome actions");
    const scopedInput = {
      ...input,
      profileId: "runner-ai-v1.4.2-normal",
      ownDeckDoctrine: runnerDoctrineForTest(
        "runner-outcome-empty-remote",
        ["balanced"],
        {},
      ),
      eventTail: [
        syntheticPlanActionEvent(
          "runner-outcome-remote-run",
          input.playerView.stateVersion + 1,
          "runner",
          "start_run",
          "remote_1",
        ),
        syntheticPlanActionEvent(
          "runner-outcome-remote-access",
          input.playerView.stateVersion + 2,
          "runner",
          "access_card",
          "remote_1",
        ),
      ],
      legalActions: [remoteRun, gain],
    };
    const remote = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    const economy = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(remote).toBeDefined();
    expect(economy).toBeDefined();
    if (!remote || !economy)
      throw new Error("Missing remote outcome candidates");

    expect(evaluateRunnerPlan(scopedInput, economy).score).toBeGreaterThan(
      evaluateRunnerPlan(scopedInput, remote).score,
    );
    expect(evaluateRunnerPlan(scopedInput, economy).evidence).toContain(
      "runner_remote_empty_or_low_value_pivoted:true",
    );
  });

  it("keeps known remote contest viable when Krash can still afford BBS trash after Data Wall", () => {
    const input = krashDataWallBbsRemoteInput(
      "ai-v141-krash-bbs-trash-affordable",
      6,
      true,
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing affordable Krash/BBS fixture actions");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate)
      throw new Error("Missing affordable Krash/BBS contest candidate");

    const access = evaluateServerAccessValue(input, contestCandidate);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gain],
    });

    expect(access.reasons).toContain(
      "known_remote_root_trash_affordable_after_ice",
    );
    expect(access.evidence).toContain("known_remote_root_credits_after_ice:4");
    expect(decision.actionId).toBe(remoteRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
  });

  it("does not apply the post-ICE trash guard to an unknown remote root before access", () => {
    const input = krashDataWallBbsRemoteInput(
      "ai-v141-krash-hidden-bbs-no-pretrash-guard",
      4,
      false,
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(remoteRun).toBeDefined();
    if (!remoteRun) throw new Error("Missing hidden BBS remote fixture action");

    const contestCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate)
      throw new Error("Missing hidden BBS contest candidate");

    const access = evaluateServerAccessValue(input, contestCandidate);
    const selectedRunOnly = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun],
    });

    expect(access.reasons).toContain(
      "known_remote_root_affordability_deferred_for_unknown_root",
    );
    expect(access.reasons).not.toContain(
      "known_remote_root_trash_unaffordable_after_ice",
    );
    expect(access.evidence).toContain("known_remote_root_unknown_count:1");
    expect(selectedRunOnly.reasonCode).toBe("runner.plan.contest_remote");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("runs the Bartmoss remote path after a declined rez and suppresses same-turn no-access repeats", () => {
    const runnerDeck: DeckDefinition = {
      id: "ai_bartmoss_remote_runner",
      name: "AI Bartmoss Remote Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_005_bartmoss-memorial-icebreaker", quantity: 1 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    };
    const corpDeck: DeckDefinition = {
      id: "ai_bartmoss_remote_corp",
      name: "AI Bartmoss Remote Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_279_wall-of-static", quantity: 2 },
        { id: "simple_agenda", quantity: 3 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-bartmoss-remote-declined-rez",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerProgramToRig(state, "onr_v1_005_bartmoss-memorial-icebreaker");
    ensureRemoteServer(state, "remote_1");
    const innerWall = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
    );
    const outerWall = putUnusedCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_279_wall-of-static",
      new Set([innerWall]),
    );
    state.cardInstances[innerWall] = {
      ...state.cardInstances[innerWall]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[outerWall] = {
      ...state.cardInstances[outerWall]!,
      faceup: false,
      rezzed: false,
    };
    putCorpRootInRemote(state, "simple_agenda", 0);
    state.runner.credits = 3;
    state.corp.credits = 3;

    const startInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v0.9-normal",
    });
    const startDecision = chooseRunnerAction(startInput);
    const startSelected = startInput.legalActions.find(
      (action) => action.actionId === startDecision.actionId,
    );

    expect(startSelected?.type).toBe("start_run");
    expect(startSelected?.payload?.serverId).toBe("remote_1");
    expect(startDecision.reasonCode).toBe("runner.plan.contest_remote");
    expect(assertAiInputIsSideSafe(startInput)).toBe(true);
    expect(JSON.stringify(startInput)).not.toMatch(/simple_agenda/);
    expect(JSON.stringify(startDecision.decisionDebug)).not.toMatch(
      /simple_agenda|cardInstances|privatePayload/,
    );

    state = apply(
      state,
      "runner",
      (action) => action.actionId === startSelected?.actionId,
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");

    const selectedTypes: LegalAction["type"][] = [];
    for (let step = 0; step < 8; step += 1) {
      const input = buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v0.9-normal",
        decisionId: `ai-bartmoss-remote-declined-rez:${step}`,
        actionNumber: step,
      });
      const decision = chooseRunnerAction(input);
      const selected = input.legalActions.find(
        (action) => action.actionId === decision.actionId,
      );
      expect(assertAiInputIsSideSafe(input)).toBe(true);
      expect(JSON.stringify(input)).not.toMatch(/simple_agenda/);
      expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
        /simple_agenda|cardInstances|privatePayload/,
      );
      expect(selected?.type).not.toBe("jack_out");
      expect(selected).toBeDefined();
      if (!selected) throw new Error("Missing Bartmoss run sequence action");
      selectedTypes.push(selected.type);
      if (selected.type === "access_card") break;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === selected.actionId,
      );
    }

    expect(selectedTypes).toEqual([
      "continue_run",
      "pump_breaker",
      "pump_breaker",
      "break_subroutine",
      "continue_run",
      "continue_run",
      "access_card",
    ]);

    const repeatRemoteRun = startInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gainCredit = startInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(repeatRemoteRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!repeatRemoteRun || !gainCredit)
      throw new Error("Missing Bartmoss repeat fixture actions");

    const repeatedInput = {
      ...startInput,
      playerView: {
        ...startInput.playerView,
        stateVersion: startInput.playerView.stateVersion + 2,
      },
      eventTail: [
        ...startInput.eventTail,
        {
          eventId: "ai-bartmoss-remote-run-started",
          type: "run_started",
          stateVersionBefore: startInput.playerView.stateVersion,
          stateVersionAfter: startInput.playerView.stateVersion + 1,
          stateHashAfter: "fnv1a:bartmossrun",
          visibilityClass: "public",
          publicPayload: {
            actionType: "start_run",
            serverId: "remote_1",
          },
        } satisfies PublicGameEvent,
        {
          eventId: "ai-bartmoss-remote-jack-out",
          type: "jack_out",
          stateVersionBefore: startInput.playerView.stateVersion + 1,
          stateVersionAfter: startInput.playerView.stateVersion + 2,
          stateHashAfter: "fnv1a:bartmossjack",
          visibilityClass: "public",
          publicPayload: {
            actionType: "jack_out",
            serverId: "remote_1",
          },
        } satisfies PublicGameEvent,
      ],
      legalActions: [repeatRemoteRun, gainCredit],
    };
    const repeatedPlanDecision = chooseRunnerAction(repeatedInput);
    const repeatedPlanSelected = repeatedInput.legalActions.find(
      (action) => action.actionId === repeatedPlanDecision.actionId,
    );
    const repeatedBaselineDecision = chooseRunnerBaselineAction(repeatedInput);
    const repeatedBaselineSelected = repeatedInput.legalActions.find(
      (action) => action.actionId === repeatedBaselineDecision.actionId,
    );
    const repeatedContestCandidate = generateRunnerPlanCandidates(
      repeatedInput,
    ).find((candidate) => candidate.kind === "contest_remote");

    expect(repeatedPlanSelected?.type).toBe("gain_credit");
    expect(repeatedPlanDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(repeatedContestCandidate).toBeDefined();
    if (!repeatedContestCandidate)
      throw new Error("Missing repeated Bartmoss contest candidate");
    expect(
      evaluateRemoteThreat(repeatedInput, repeatedContestCandidate).reasons,
    ).toContain("recent_remote_contest_repeated");
    expect(repeatedBaselineSelected?.type).toBe("gain_credit");
    expect(repeatedBaselineDecision.reasonCode).toBe(
      "runner.economy.basic_credit",
    );
  });

  it("penalizes immediate repeated remote contest", () => {
    const input = runnerActionPhaseInput("ai-v141-repeated-remote", (state) => {
      ensureRemoteServer(state, "remote_1");
      putCorpRootInRemote(state, "simple_agenda", 0);
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(remoteRun).toBeDefined();
    if (!remoteRun)
      throw new Error("Missing repeated remote contest fixture action");

    const repeatedInput = {
      ...input,
      eventTail: [
        {
          eventId: "ai-v141-repeated-remote-event",
          type: "run_started",
          stateVersionBefore: input.playerView.stateVersion - 1,
          stateVersionAfter: input.playerView.stateVersion,
          stateHashAfter: "fnv1a:remote001",
          visibilityClass: "public",
          publicPayload: { actionType: "start_run", serverId: "remote_1" },
        } satisfies PublicGameEvent,
      ],
    };
    const candidate = generateRunnerPlanCandidates({
      ...repeatedInput,
      legalActions: [remoteRun],
    }).find((plan) => plan.kind === "contest_remote");

    expect(candidate).toBeDefined();
    if (!candidate)
      throw new Error("Missing repeated contest_remote candidate");
    expect(evaluateRemoteThreat(repeatedInput, candidate).reasons).toContain(
      "recent_remote_contest_repeated",
    );
  });

  it("uses deck doctrine as a bounded Runner plan weight", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-doctrine-plan-weight",
      () => undefined,
    );
    const pressureRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const pressureGain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(pressureRun).toBeDefined();
    expect(pressureGain).toBeDefined();
    if (!pressureRun || !pressureGain)
      throw new Error("Missing Runner doctrine fixture actions");

    const pressureInput = {
      ...input,
      legalActions: [pressureRun, pressureGain],
    };
    const candidate = generateRunnerPlanCandidates(pressureInput).find(
      (plan) => plan.kind === "pressure_rnd",
    );
    const doctrine = buildDeckDoctrineProfile({
      deckSnapshotId: "synthetic-rnd-runner",
      side: "runner",
      cards: [
        { cardId: "simple_run_event", quantity: 9 },
        { cardId: "simple_fracter", quantity: 3 },
        { cardId: "simple_economy_event", quantity: 3 },
      ],
    });

    expect(candidate).toBeDefined();
    if (!candidate) throw new Error("Missing pressure_rnd candidate");
    const neutralScore = evaluateRunnerPlan(pressureInput, candidate).score;
    const doctrineScore = evaluateRunnerPlan(
      { ...pressureInput, ownDeckDoctrine: doctrine },
      candidate,
    ).score;
    const decision = chooseRunnerPlanDecision({
      ...pressureInput,
      ownDeckDoctrine: doctrine,
    });

    expect(doctrine.planWeights.pressure_rnd).toBeGreaterThan(0);
    expect(doctrineScore).toBeGreaterThan(neutralScore);
    expect(decision.debug.planKind).toBe("pressure_rnd");
    expect(decision.debug.doctrinePlanWeight).toBeGreaterThan(0);
    expect(decision.debug.ownDeckDoctrine?.side).toBe("runner");
    expect(JSON.stringify(decision.debug)).not.toMatch(
      /cardInstances|privatePayload/,
    );
    expect(JSON.stringify(decision.debug.ownDeckDoctrine)).not.toMatch(
      /simple_run_event|simple_fracter|simple_economy_event/,
    );
  });

  it("uses Runner deck doctrine for early-turn setup priorities", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-doctrine-early-turn",
      (state) => {
        state.runner.credits = 4;
        putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        moveRunnerCardToGrip(state, "simple_fracter");
      },
    );
    const installBreaker = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const doctrine = runnerDoctrineForTest(
      "synthetic-early-rig-runner",
      ["rig_builder"],
      { build_rig: 24, recover_economy: 10, pressure_rnd: -4 },
    );

    expect(installBreaker).toBeDefined();
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!installBreaker || !rdRun || !gainCredit)
      throw new Error("Missing early-turn Runner doctrine fixture actions");

    const doctrineInput = {
      ...input,
      ownDeckDoctrine: doctrine,
      legalActions: [rdRun, installBreaker, gainCredit],
    };
    const buildCandidate = generateRunnerPlanCandidates(doctrineInput).find(
      (candidate) => candidate.kind === "build_rig",
    );
    const pressureCandidate = generateRunnerPlanCandidates(doctrineInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    const decision = chooseRunnerPlanDecision(doctrineInput);

    expect(buildCandidate).toBeDefined();
    expect(pressureCandidate).toBeDefined();
    if (!buildCandidate || !pressureCandidate)
      throw new Error("Missing early-turn Runner doctrine candidates");
    expect(
      evaluateRunnerEarlyTurnDoctrine(doctrineInput, buildCandidate).reasons,
    ).toContain("early_rig_builder_setup");
    expect(
      evaluateRunnerEarlyTurnDoctrine(doctrineInput, pressureCandidate).reasons,
    ).toContain("early_rig_builder_pressure_not_ready");
    expect(
      evaluateRunnerPlan(doctrineInput, buildCandidate).score,
    ).toBeGreaterThan(
      evaluateRunnerPlan(doctrineInput, pressureCandidate).score,
    );
    expect(decision.debug.planKind).toBe("build_rig");
    expect(JSON.stringify(decision.score.evidence)).not.toMatch(
      /cardInstances|privatePayload|simple_fracter/,
    );
  });

  it("installs a visible matching breaker before repeating low-value Archives or blocked remote runs", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-visible-breaker-plan",
      (state) => {
        state.runner.credits = 5;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_fracter");
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const archivesRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    const installFracter = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(remoteRun).toBeDefined();
    expect(archivesRun).toBeDefined();
    expect(installFracter).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!remoteRun || !archivesRun || !installFracter || !gainCredit)
      throw new Error("Missing visible breaker planning fixture actions");
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, archivesRun, installFracter, gainCredit],
    });

    expect(decision.actionId).toBe(installFracter.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|simple_agenda/,
    );
  });

  it("builds credits or draws when a visible blocker lacks an installable breaker answer", () => {
    const creditInput = runnerActionPhaseInput(
      "ai-runner-breaker-needs-credits",
      (state) => {
        state.runner.credits = 1;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_fracter");
      },
    );
    const creditRun = creditInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gainCredit = creditInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(creditRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!creditRun || !gainCredit)
      throw new Error("Missing breaker-credit fixture actions");
    const creditDecision = chooseRunnerAction({
      ...creditInput,
      legalActions: [creditRun, gainCredit],
    });

    const drawInput = runnerActionPhaseInput(
      "ai-runner-breaker-needs-draw",
      (state) => {
        state.runner.credits = 5;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 2);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
    );
    const drawRun = drawInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const drawCard = drawInput.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(drawRun).toBeDefined();
    expect(drawCard).toBeDefined();
    if (!drawRun || !drawCard)
      throw new Error("Missing breaker-draw fixture actions");
    const drawDecision = chooseRunnerAction({
      ...drawInput,
      legalActions: [drawRun, drawCard],
    });

    expect(creditDecision.actionId).toBe(gainCredit.actionId);
    expect(creditDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(drawDecision.actionId).toBe(drawCard.actionId);
    expect(drawDecision.reasonCode).toBe("runner.plan.draw_for_answers");
  });

  it("avoids City Surveillance draw tags when economy is available", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-city-surveillance-draw-tax",
      (state) => {
        state.runner.credits = 0;
        state.runner.tags = 16;
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "onr_v1_313_city-surveillance", 0);
        const cityId = state.corp.servers
          .find((server) => server.id === "remote_1")
          ?.root.find(
            (cardId) =>
              state.cardInstances[cardId]?.definitionId ===
              "onr_v1_313_city-surveillance",
          );
        expect(cityId).toBeDefined();
        if (!cityId) throw new Error("Missing City Surveillance");
        state.cardInstances[cityId] = {
          ...state.cardInstances[cityId]!,
          faceup: true,
          rezzed: true,
        };
      },
      {
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      },
    );
    const drawCard = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(drawCard?.payload).toMatchObject({
      citySurveillanceDrawDecision: "tag",
      citySurveillanceProjectedTagsAdded: 1,
    });
    expect(gainCredit).toBeDefined();
    if (!drawCard || !gainCredit)
      throw new Error("Missing City Surveillance draw-tax fixture actions");

    const filteredInput = {
      ...input,
      legalActions: [drawCard, gainCredit],
    };
    const drawCandidate = generateRunnerPlanCandidates(filteredInput).find(
      (candidate) => candidate.kind === "draw_for_answers",
    );
    expect(drawCandidate).toBeDefined();
    if (!drawCandidate) throw new Error("Missing draw-for-answers candidate");
    const drawScore = evaluateRunnerPlan(filteredInput, drawCandidate);
    const decision = chooseRunnerAction(filteredInput);

    expect(decision.actionId).toBe(gainCredit.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(drawScore.evidence).toContain("city_surveillance_draw_tax:true");
    expect(drawScore.evidence).toContain("city_surveillance_projected_tags:1");
  });

  it("handles access trash, jack-out and legal fallback without hidden-info claims", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v141-trash-jackout" }),
    );
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, assetId);
    state.runner.credits = 6;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const trashInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const trashDecision = chooseRunnerAction(trashInput);
    const fallback = chooseRunnerPlanDecision(trashInput, { timeBudgetMs: 0 });
    const serializedDebug = JSON.stringify(trashDecision.decisionDebug);

    expect(
      trashInput.legalActions.find(
        (action) => action.actionId === trashDecision.actionId,
      )?.type,
    ).toBe("trash_accessed_card");
    expect(trashDecision.reasonCode).toBe("runner.plan.trash_asset");
    expect(serializedDebug).toContain("hidden_corp_information_not_used");
    expect(serializedDebug).not.toContain("cardInstances");
    expect(serializedDebug).not.toContain("corp_simple_agenda");
    expect(fallback.fallbackUsed).toBe(true);
    expect(fallback.debug.timeoutUsed).toBe(true);
    expect(
      trashInput.legalActions.some(
        (action) => action.actionId === fallback.selectedActionId,
      ),
    ).toBe(true);

    const jackInput = runnerJackOutInput("ai-v141-jackout");
    const jack =
      jackInput.legalActions.find((action) => action.type === "jack_out") ??
      ({
        ...jackInput.legalActions[0]!,
        actionId: "runner.jack_out.synthetic_v141",
        type: "jack_out" as const,
        source: "game_rule" as const,
        label: "Jack out",
        timingPoint: "run.jack_out_window" as const,
        costs: [],
        payload: {},
      } satisfies LegalAction);
    expect(jack).toBeDefined();
    expect(
      chooseRunnerPlanDecision({ ...jackInput, legalActions: [jack] }).debug
        .planKind,
    ).toBe("safe_probe_run");
  });

  it("treats declining an accessed trash as an explicit Runner access decision", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-runner-decline-trash" }),
    );
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    keepOnlyCorpHqCard(state, assetId);
    state.runner.credits = 0;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(
      input.legalActions.some((action) => action.type === "decline_trash"),
    ).toBe(true);
    expect(decision.reasonCode).toBe("runner.access.decline_trash");
    expect(decision.fallbackUsed).toBe(false);
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|Simple Economy Asset/,
    );
  });

  it("keeps hidden-state invariance for equal Runner-visible projections", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v141-invariance" }),
    );
    const stateB = structuredClone(stateA);
    const hiddenId = stateA.corp.rd[0];
    expect(hiddenId).toBeDefined();
    if (!hiddenId) throw new Error("Missing hidden R&D card");
    stateA.cardInstances[hiddenId] = {
      ...stateA.cardInstances[hiddenId]!,
      definitionId: "simple_agenda",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenId] = {
      ...stateB.cardInstances[hiddenId]!,
      definitionId: "simple_economy_asset",
      faceup: false,
      rezzed: false,
    };
    const inputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decisionA = chooseRunnerAction(inputA);
    const decisionB = chooseRunnerAction(inputB);

    expect(JSON.stringify(inputA.playerView)).toBe(
      JSON.stringify(inputB.playerView),
    );
    expect(inputA.legalActions.map((action) => action.type)).toEqual(
      inputB.legalActions.map((action) => action.type),
    );
    expect(decisionA.reasonCode).toBe(decisionB.reasonCode);
    expect(decisionA.decisionDebug?.planKind).toBe(
      decisionB.decisionDebug?.planKind,
    );
    expect(
      inputA.legalActions.find(
        (action) => action.actionId === decisionA.actionId,
      )?.type,
    ).toBe(
      inputB.legalActions.find(
        (action) => action.actionId === decisionB.actionId,
      )?.type,
    );
  });

  it("approves King of the Road Runner AI rig setup and support hints", () => {
    const state = kingOfTheRoadRunnerTurn("ai-kotr-build-rig");
    moveRunnerCardToGrip(state, "onr_v1_006_black-dahlia");
    moveRunnerCardToGrip(state, "onr_v1_145_wutech-mem-chip");
    state.runner.credits = 8;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rigInput = {
      ...input,
      legalActions: input.legalActions.filter(
        (action) => action.type === "install_card",
      ),
    };
    const candidates = generateRunnerPlanCandidates(rigInput);
    const decision = chooseRunnerPlanDecision(rigInput);

    expect(candidates.some((candidate) => candidate.kind === "build_rig")).toBe(
      true,
    );
    expect(
      candidates.every((candidate) =>
        runnerPlanUsesOnlyAiSupportedCards(rigInput, candidate),
      ),
    ).toBe(true);
    expect(decision.debug.planKind).toBe("build_rig");
    expect(
      rigInput.legalActions.find(
        (action) => action.actionId === decision.selectedActionId,
      )?.type,
    ).toBe("install_card");
    expect(JSON.stringify(decision.debug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|v08_project_agenda/,
    );
  });

  it("uses King of the Road economy and draw plans before low-value runs", () => {
    const economyState = kingOfTheRoadRunnerTurn("ai-kotr-economy");
    moveRunnerCardToGrip(economyState, "onr_v1_097_livewires-contacts");
    economyState.runner.credits = 2;
    const economyInput = buildAiDecisionInput(economyState, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const economyEvent = economyInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(economyInput, action) ===
          "onr_v1_097_livewires-contacts",
    );

    const drawState = kingOfTheRoadRunnerTurn("ai-kotr-draw");
    moveRunnerCardToGrip(drawState, "onr_v1_095_jack-n-joe");
    const drawInput = buildAiDecisionInput(drawState, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const drawEvent = drawInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(drawInput, action) ===
          "onr_v1_095_jack-n-joe",
    );

    expect(economyEvent).toBeDefined();
    expect(drawEvent).toBeDefined();
    if (!economyEvent || !drawEvent)
      throw new Error("Missing King of the Road event LegalActions");
    expect(
      chooseRunnerPlanDecision({
        ...economyInput,
        legalActions: [economyEvent],
      }).debug.planKind,
    ).toBe("recover_economy");
    expect(
      chooseRunnerPlanDecision({ ...drawInput, legalActions: [drawEvent] })
        .debug.planKind,
    ).toBe("draw_for_answers");
  });

  it("uses installed Runner economy payouts before the basic credit action", () => {
    const shortTermInput = installedRunnerEconomyInput(
      "ai-v141-installed-short-term",
      { shortTermCounters: 10, credits: 1 },
    );
    const shortTermTake = shortTermInput.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(shortTermInput, action) ===
          "onr_v1_178_short-term-contract",
    );
    const shortTermBasicCredit = shortTermInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(shortTermTake).toBeDefined();
    expect(shortTermBasicCredit).toBeDefined();
    expect(shortTermTake?.label).toContain("2 Credits nehmen");
    if (!shortTermTake || !shortTermBasicCredit)
      throw new Error("Missing Short-Term Contract economy fixture actions");

    const shortTermDecision = chooseRunnerAction({
      ...shortTermInput,
      legalActions: [shortTermTake, shortTermBasicCredit],
    });

    expect(shortTermDecision.actionId).toBe(shortTermTake.actionId);
    expect(shortTermDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(shortTermDecision.evidence).toContain(
      "installed_economy_kind:direct_payout",
    );
    expect(JSON.stringify(shortTermDecision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
    expect(assertAiInputIsSideSafe(shortTermInput)).toBe(true);
  });

  it("separates Broker pool loading from visible pool payout", () => {
    const payoutInput = installedRunnerEconomyInput(
      "ai-v141-installed-broker-take",
      { brokerCounters: 3, credits: 1 },
    );
    const brokerTake = payoutInput.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(payoutInput, action) ===
          "onr_v1_154_broker" &&
        action.label.includes("Credits von Broker nehmen"),
    );
    const payoutBasicCredit = payoutInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(brokerTake).toBeDefined();
    expect(payoutBasicCredit).toBeDefined();
    expect(brokerTake?.label).toContain("Credits von Broker nehmen");
    if (!brokerTake || !payoutBasicCredit)
      throw new Error("Missing Broker payout fixture actions");

    const payoutDecision = chooseRunnerAction({
      ...payoutInput,
      legalActions: [brokerTake, payoutBasicCredit],
    });

    expect(payoutDecision.actionId).toBe(brokerTake.actionId);
    expect(payoutDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(payoutDecision.evidence).toContain(
      "installed_economy_kind:pool_payout",
    );
    expect(payoutDecision.evidence).toContain(
      "installed_economy_stored_credits:3",
    );

    const lowCreditLoadInput = installedRunnerEconomyInput(
      "ai-v141-installed-broker-load-low",
      { brokerCounters: 0, credits: 1 },
    );
    const lowCreditBrokerLoad = lowCreditLoadInput.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(lowCreditLoadInput, action) ===
          "onr_v1_154_broker" &&
        action.label.includes("Credits auf Broker legen"),
    );
    const lowCreditBasicCredit = lowCreditLoadInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(lowCreditBrokerLoad).toBeDefined();
    expect(lowCreditBasicCredit).toBeDefined();
    if (!lowCreditBrokerLoad || !lowCreditBasicCredit)
      throw new Error("Missing Broker low-credit fixture actions");

    const lowCreditDecision = chooseRunnerAction({
      ...lowCreditLoadInput,
      legalActions: [lowCreditBrokerLoad, lowCreditBasicCredit],
    });

    expect(lowCreditDecision.actionId).toBe(lowCreditBasicCredit.actionId);
    expect(lowCreditDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(lowCreditDecision.evidence).toContain(
      "installed_economy_kind:pool_build",
    );
    expect(lowCreditDecision.evidence).toContain("economy_need:acute");
    expect(lowCreditDecision.evidence).toContain(
      "broker_horizon:installed_economy_pool_build_deferred_for_credit_need",
    );
    expect(lowCreditDecision.evidence).toContain(
      "broker_horizon_immediate_credit_need:true",
    );
    expect(lowCreditDecision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: lowCreditBasicCredit.actionId,
        actionType: "gain_credit",
        selected: true,
        economy: expect.objectContaining({
          economyKind: "basic_credit",
          immediateGain: 1,
          netCredits: 1,
          economyNeed: "acute",
        }),
      }),
    );
    expect(lowCreditDecision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: lowCreditBrokerLoad.actionId,
        actionType: "activated_card_ability",
        selected: false,
        sourceTitle: "Broker",
        whyNot: ["pool_build_deferred_for_credit_need"],
        economy: expect.objectContaining({
          economyKind: "pool_build",
          ability: "broker_load_credits",
          immediateGain: 0,
          netCredits: 0,
          storedCredits: 0,
          futurePoolAfter: 3,
          economyNeed: "acute",
        }),
      }),
    );

    const stableLoadInput = installedRunnerEconomyInput(
      "ai-v141-installed-broker-load-stable",
      { brokerCounters: 0, credits: 6 },
    );
    const stableBrokerLoad = stableLoadInput.legalActions.find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionFromInput(stableLoadInput, action) ===
          "onr_v1_154_broker" &&
        action.label.includes("Credits auf Broker legen"),
    );
    const stableBasicCredit = stableLoadInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(stableBrokerLoad).toBeDefined();
    expect(stableBasicCredit).toBeDefined();
    if (!stableBrokerLoad || !stableBasicCredit)
      throw new Error("Missing Broker stable-credit fixture actions");

    const stableDecision = chooseRunnerAction({
      ...stableLoadInput,
      legalActions: [stableBrokerLoad, stableBasicCredit],
    });

    expect(stableDecision.actionId).toBe(stableBrokerLoad.actionId);
    expect(stableDecision.reasonCode).toBe("runner.plan.recover_economy");
    expect(stableDecision.evidence).toContain("economy_need:stable");
    expect(stableDecision.evidence).toContain(
      "broker_horizon:installed_economy_pool_build_horizon_value",
    );
    expect(stableDecision.evidence).toContain("broker_horizon_clicks:3");
    expect(stableDecision.evidence).toContain(
      "broker_horizon_visible_threshold:false",
    );
    expect(stableDecision.decisionDebug?.actionAlternatives?.[0]).toMatchObject(
      {
        actionId: stableBrokerLoad.actionId,
        selected: true,
        sourceTitle: "Broker",
        economy: {
          economyKind: "pool_build",
          ability: "broker_load_credits",
          immediateGain: 0,
          netCredits: 0,
          storedCredits: 0,
          futurePoolAfter: 3,
          economyNeed: "stable",
        },
      },
    );
    expect(JSON.stringify(stableDecision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("avoids bad King of the Road runs into visible stoppers", () => {
    const state = kingOfTheRoadRunnerTurn("ai-kotr-negative-run");
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    moveRunnerCardToGrip(state, "onr_v1_095_jack-n-joe");
    state.runner.credits = 2;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const drawEvent = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_095_jack-n-joe",
    );

    expect(rdRun).toBeDefined();
    expect(drawEvent).toBeDefined();
    if (!rdRun || !drawEvent)
      throw new Error("Missing King of the Road negative-run fixture actions");
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [rdRun, drawEvent],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected?.type).not.toBe("start_run");
    expect(decision.reasonCode).toBe("runner.plan.draw_for_answers");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "hidden_corp_information_not_used",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|v08_project_agenda/,
    );
  });

  it("penalizes remote runs that can break the next ICE but not the known full path", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-known-full-path-no-access",
        runnerDeck: {
          id: "ai_known_full_path_runner",
          name: "AI Known Full Path Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_023_evil-twin", quantity: 2 },
            { id: "onr_v1_014_codecracker", quantity: 2 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "ai_known_full_path_corp",
          name: "AI Known Full Path Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_259_in-the-face", quantity: 1 },
            { id: "onr_v1_261_quandary", quantity: 1 },
            { id: "simple_agenda", quantity: 4 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    moveRunnerProgramToRig(state, "onr_v1_023_evil-twin");
    moveRunnerProgramToRig(state, "onr_v1_014_codecracker");
    ensureRemoteServer(state, "remote_1");
    putCorpRootInRemote(state, "simple_agenda", 0);
    const innerCodeGate = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_261_quandary",
    );
    const outerSentry = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_259_in-the-face",
    );
    for (const iceId of [innerCodeGate, outerSentry]) {
      state.cardInstances[iceId] = {
        ...state.cardInstances[iceId]!,
        faceup: true,
        rezzed: true,
      };
    }
    state.runner.credits = 4;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const economy = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(remoteRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!remoteRun || !economy)
      throw new Error("Missing known-full-path run fixture actions");

    const scopedInput = { ...input, legalActions: [remoteRun, economy] };
    const runCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(runCandidate).toBeDefined();
    if (!runCandidate) throw new Error("Missing contest remote candidate");
    const runCost = estimateRunCost(scopedInput, runCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(runCost.reasons).toContain("known_full_path_no_access");
    expect(runCost.reasons).toContain("can_break_next_ice_but_not_full_path");
    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("uses playable Runner economy before generic draw", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-economy-before-draw",
      (state) => {
        state.runner.credits = 2;
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(economy).toBeDefined();
    expect(draw).toBeDefined();
    if (!economy || !draw) throw new Error("Missing economy/draw actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [economy, draw],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(decision.evidence).toContain("hand_use_playable_economy:1");
  });

  it("installs a relevant missing breaker before generic draw", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-breaker-before-draw",
      (state) => {
        moveRunnerCardToGrip(state, "simple_fracter");
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
    );
    const breakerInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(breakerInstall).toBeDefined();
    expect(draw).toBeDefined();
    if (!breakerInstall || !draw)
      throw new Error("Missing breaker/draw actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [breakerInstall, draw],
    });

    expect(decision.actionId).toBe(breakerInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(decision.evidence).toContain("hand_use_installable_breaker:1");
  });

  it("uses a search card when visible ICE blocks a path and no matching breaker is in hand", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-coverage-search-before-credit",
      (state) => {
        state.runner.credits = 5;
        moveRunnerCardToGrip(state, "v098_stack_search_event");
        putRunnerCardOnTopOfStack(state, "simple_fracter");
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
      runnerCoverageSearchDeckConfig("search-before-credit"),
    );
    const search = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "v098_stack_search_event",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(search).toBeDefined();
    expect(gain).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!search || !gain || !rdRun)
      throw new Error("Missing coverage-search actions");

    const scopedInput = {
      ...input,
      legalActions: [search, gain, rdRun],
    };
    const buildCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_rig",
    );
    expect(buildCandidate).toBeDefined();
    if (!buildCandidate) throw new Error("Missing coverage-search candidate");
    const buildScore = evaluateRunnerPlan(scopedInput, buildCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(search.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(buildScore.reasons).toContain(
      "visible_missing_breaker_search_available",
    );
  });

  it("uses structured breaker ontology to recognize installable wall coverage", () => {
    const costProfile = estimateBreakerCostProfileFromOntology(
      "onr_v1_037_japanese-water-torture",
    );
    const wallCost = estimateStructuredBreakerCostForIce(
      "onr_v1_037_japanese-water-torture",
      { definitionId: "onr_v1_237_data-wall", strength: 0 },
    );
    expect(costProfile).toEqual(
      expect.objectContaining({
        installCredits: 7,
        memory: 1,
      }),
    );
    expect(costProfile?.sideEffectPenalty).toBeGreaterThan(0);
    expect(wallCost).toEqual(
      expect.objectContaining({
        coverage: "wall",
        cost: 0,
      }),
    );

    const input = runnerActionPhaseInput(
      "ai-runner-structured-breaker-coverage",
      (state) => {
        state.runner.credits = 8;
        moveRunnerCardToGrip(state, "onr_v1_037_japanese-water-torture");
        const iceId = putCorpIceOnServer(state, "rd", "onr_v1_237_data-wall");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
      {
        runnerDeck: {
          id: "ai_structured_breaker_runner",
          name: "AI Structured Breaker Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_037_japanese-water-torture", quantity: 2 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "ai_structured_breaker_corp",
          name: "AI Structured Breaker Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 4 },
            { id: "onr_v1_237_data-wall", quantity: 2 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const install = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_037_japanese-water-torture",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(install).toBeDefined();
    expect(gain).toBeDefined();
    if (!install || !gain)
      throw new Error("Missing structured breaker coverage actions");

    const scopedInput = { ...input, legalActions: [install, gain] };
    const buildCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "build_rig",
    );
    expect(buildCandidate).toBeDefined();
    if (!buildCandidate)
      throw new Error("Missing structured breaker coverage candidate");
    const buildScore = evaluateRunnerPlan(scopedInput, buildCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(buildCandidate.legalActionIds).toContain(install.actionId);
    expect(decision.actionId).toBe(install.actionId);
    expect(buildScore.score).toBeGreaterThan(0);
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /privatePayload|FullState|runnerHiddenStackOrder/i,
    );
  });

  it("takes economy before search when coverage line would leave no useful run budget", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-coverage-economy-before-search",
      (state) => {
        state.runner.credits = 0;
        moveRunnerCardToGrip(state, "v098_stack_search_event");
        putRunnerCardOnTopOfStack(state, "simple_fracter");
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
      runnerCoverageSearchDeckConfig("economy-before-search"),
    );
    const originalSearch = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "v098_stack_search_event",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(originalSearch).toBeDefined();
    expect(gain).toBeDefined();
    if (!originalSearch || !gain)
      throw new Error("Missing economy-before-search actions");
    const costlySearch: LegalAction = {
      ...originalSearch,
      costs: [{ credits: 3 }],
    };

    const scopedInput = {
      ...input,
      legalActions: [costlySearch, gain],
    };
    const economyCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(economyCandidate).toBeDefined();
    if (!economyCandidate)
      throw new Error("Missing economy-before-search candidate");
    const economyScore = evaluateRunnerPlan(scopedInput, economyCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(economyScore.score).toBeGreaterThan(0);
  });

  it("does not prefer further search when coverage and credits already enable pressure", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-coverage-ready-run-before-search",
      (state) => {
        state.runner.credits = 5;
        moveRunnerCardToGrip(state, "v098_stack_search_event");
        moveRunnerProgramToRig(state, "simple_fracter");
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
      runnerCoverageSearchDeckConfig("ready-run-before-search"),
    );
    const search = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "v098_stack_search_event",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(search).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!search || !rdRun) throw new Error("Missing ready-coverage actions");

    const scopedInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticPlanActionEvent(
          "runner-ready-coverage-install",
          input.playerView.stateVersion + 1,
          "runner",
          "install_card",
          undefined,
          { cardDefinitionId: "simple_fracter" },
        ),
      ],
      legalActions: [search, rdRun],
    };
    const pressureCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate)
      throw new Error("Missing ready-coverage phase-exit candidate");
    const pressureScore = evaluateRunnerPlan(scopedInput, pressureCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_rnd");
    expect(pressureScore.evidence).toContain(
      "runner_pressure_ready_false_positive:true",
    );
  });

  it("exits economy setup once reserve and a concrete R&D pressure line are ready", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-phase-exit-economy-to-rd",
      (state) => {
        state.runner.credits = 5;
      },
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gain).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!gain || !rdRun) throw new Error("Missing economy-to-pressure actions");

    const scopedInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticPlanActionEvent(
          "runner-reserve-reached",
          input.playerView.stateVersion + 1,
          "runner",
          "gain_credit",
        ),
      ],
      legalActions: [gain, rdRun],
    };
    const pressureCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    const economyCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "recover_economy",
    );
    expect(pressureCandidate).toBeDefined();
    expect(economyCandidate).toBeDefined();
    if (!pressureCandidate || !economyCandidate)
      throw new Error("Missing economy-to-pressure candidates");

    const pressureScore = evaluateRunnerPlan(scopedInput, pressureCandidate);
    const economyScore = evaluateRunnerPlan(scopedInput, economyCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(pressureScore.reasons).toContain("phase_exit_pressure_ready");
    expect(economyScore.reasons).toContain(
      "phase_exit_suppress_setup_after_pressure_ready",
    );
  });

  it("does not phase-exit into a run when the visible path remains unaffordable", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-phase-exit-false-positive-cost",
      (state) => {
        state.runner.credits = 0;
        moveRunnerProgramToRig(state, "simple_fracter");
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gain).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!gain || !rdRun) throw new Error("Missing blocked-run actions");

    const scopedInput = { ...input, legalActions: [gain, rdRun] };
    const pressureCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate)
      throw new Error("Missing blocked pressure candidate");
    const pressureScore = evaluateRunnerPlan(scopedInput, pressureCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(pressureScore.reasons).not.toContain("phase_exit_pressure_ready");
  });

  it("phase-exits to contest an advanced remote when coverage and reserve are ready", () => {
    const input = runnerActionPhaseInput(
      "ai-runner-phase-exit-advanced-remote",
      (state) => {
        state.runner.credits = 6;
        moveRunnerProgramToRig(state, "simple_fracter");
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 1);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(gain).toBeDefined();
    expect(remoteRun).toBeDefined();
    if (!gain || !remoteRun)
      throw new Error("Missing remote phase-exit actions");

    const scopedInput = { ...input, legalActions: [gain, remoteRun] };
    const remoteCandidate = generateRunnerPlanCandidates(scopedInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    expect(remoteCandidate).toBeDefined();
    if (!remoteCandidate) throw new Error("Missing remote contest candidate");
    const remoteScore = evaluateRunnerPlan(scopedInput, remoteCandidate);
    const decision = chooseRunnerAction(scopedInput);

    expect(decision.actionId).toBe(remoteRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
    expect(remoteScore.reasons).toContain("phase_exit_pressure_ready");
  });

  it("uses a visible pressure event before additional draw", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-pressure-before-draw",
      (state) => {
        state.runner.credits = 5;
        moveRunnerCardToGrip(state, "simple_run_event");
      },
    );
    const pressureEvent = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_run_event",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(pressureEvent).toBeDefined();
    expect(draw).toBeDefined();
    if (!pressureEvent || !draw)
      throw new Error("Missing pressure-event/draw actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [pressureEvent, draw],
    });

    expect(decision.actionId).toBe(pressureEvent.actionId);
    expect(decision.reasonCode).toBe("runner.plan.safe_probe_run");
    expect(decision.evidence).toContain("hand_use_pressure:1");
  });

  it("avoids draw into discard pressure when useful hand actions exist", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-avoid-discard-draw",
      (state) => {
        state.runner.maxHandSize = 5;
        state.runner.credits = 3;
        moveRunnerCardToGrip(state, "simple_economy_event");
        moveRunnerCardToGrip(state, "simple_run_event");
        moveRunnerCardToGrip(state, "simple_fracter");
        moveRunnerCardToGrip(state, "simple_decoder");
        moveRunnerCardToGrip(state, "simple_killer");
      },
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(input.playerView.own.gripOrHq.length).toBeGreaterThanOrEqual(
      input.playerView.own.maxHandSize,
    );
    expect(economy).toBeDefined();
    expect(draw).toBeDefined();
    if (!economy || !draw) throw new Error("Missing discard-pressure fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [economy, draw],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(decision.evidence).toContain("hand_use_draw_discard_pressure:true");
  });

  it("does not install a second Junkyard BBS over better visible actions", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-junkyard-duplicate",
      (state) => {
        state.runner.credits = 4;
        const installed = moveRunnerResourceToRig(
          state,
          "onr_v1_165_junkyard-bbs",
        );
        moveRunnerCardCopyToGrip(state, "onr_v1_165_junkyard-bbs", [installed]);
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      {
        runnerDeck: {
          id: "ai_junkyard_duplicate_runner",
          name: "AI Junkyard Duplicate Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_165_junkyard-bbs", quantity: 2 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
      },
    );
    const junkyardInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_165_junkyard-bbs",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );

    expect(junkyardInstall).toBeDefined();
    expect(economy).toBeDefined();
    if (!junkyardInstall || !economy)
      throw new Error("Missing Junkyard duplicate fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [junkyardInstall, economy],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("allows a stackable pressure duplicate when no better hand plan exists", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-hand-pressure-duplicate-ok",
      (state) => {
        state.runner.credits = 7;
        const installed = moveRunnerProgramToRig(
          state,
          "onr_v1_041_microtech-ai-interface",
        );
        moveRunnerCardCopyToGrip(state, "onr_v1_041_microtech-ai-interface", [
          installed,
        ]);
      },
      {
        runnerDeck: {
          id: "ai_pressure_duplicate_runner",
          name: "AI Pressure Duplicate Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_041_microtech-ai-interface", quantity: 2 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
      },
    );
    const interfaceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_041_microtech-ai-interface",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );

    expect(interfaceInstall).toBeDefined();
    expect(draw).toBeDefined();
    if (!interfaceInstall || !draw)
      throw new Error("Missing pressure duplicate fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [interfaceInstall, draw],
    });

    expect(decision.actionId).toBe(interfaceInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
  });

  it("keeps draw and duplicate discipline invariant to hidden Corp cards", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v141-hand-hidden-invariance",
        runnerDeck: {
          id: "ai_hidden_invariance_runner",
          name: "AI Hidden Invariance Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_economy_event", quantity: 8 },
            { id: "simple_draw_event", quantity: 4 },
          ],
        },
        corpDeck: {
          id: "ai_hidden_invariance_corp",
          name: "AI Hidden Invariance Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 4 },
            { id: "simple_barrier_ice", quantity: 2 },
          ],
        },
      }),
    );
    stateA.runner.credits = 2;
    moveRunnerCardToGrip(stateA, "simple_economy_event");
    const stateB = structuredClone(stateA);
    const hiddenCorpCard = stateB.corp.hq[0] ?? stateB.corp.rd[0];
    if (hiddenCorpCard) {
      stateB.cardInstances[hiddenCorpCard] = {
        ...stateB.cardInstances[hiddenCorpCard]!,
        definitionId: "simple_barrier_ice",
      };
    }
    const inputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });

    expect(chooseRunnerAction(inputA)).toEqual(chooseRunnerAction(inputB));
    expect(assertAiInputIsSideSafe(inputA)).toBe(true);
    expect(assertAiInputIsSideSafe(inputB)).toBe(true);
  });

  it("trashes a relevant affordable remote economy asset after access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v141-remote-trash-economy" }),
    );
    state.runner.credits = 6;
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "simple_economy_asset",
    );
    expect(
      input.legalActions.some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(true);
    expect(decision.reasonCode).toBe("runner.plan.trash_asset");
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("trash_accessed_card");
  });

  it("trashes an affordable scoring-protection upgrade after remote access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v141-remote-trash-red-herrings",
        corpDeck: {
          id: "ai_remote_trash_red_herrings_corp",
          name: "AI Remote Trash Red Herrings Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_366_red-herrings", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 5;
    putCorpRootInRemote(state, "onr_v1_366_red-herrings", 0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "onr_v1_366_red-herrings",
    );
    expect(decision.reasonCode).toBe("runner.plan.trash_asset");
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("trash_accessed_card");
  });

  it("defers an early expensive run-tax region trash when no acute remote threat exists", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-expensive-run-tax-trash-no-threat",
        corpDeck: {
          id: "ai_expensive_run_tax_no_threat_corp",
          name: "AI Expensive Run Tax No Threat Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "simple_economy_operation", quantity: 8 },
            { id: "simple_agenda", quantity: 3 },
          ],
        },
      }),
    );
    state.runner.credits = 5;
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
      0,
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "onr_v1_355_crystal-palace-station-grid",
    );
    expect(decision.reasonCode).toBe("runner.access.decline_trash");
    expect(decision.evidence).toContain("remote_trash_role:run_tax");
    expect(decision.evidence).toContain("remote_trash_deferred_by_budget:true");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("trashes an expensive run-tax region when it protects an acute advanced remote and reserve remains", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-expensive-run-tax-trash-threat",
        corpDeck: {
          id: "ai_expensive_run_tax_threat_corp",
          name: "AI Expensive Run Tax Threat Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 10;
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
      0,
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpRootInRemote(state, "simple_agenda", 2);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "onr_v1_355_crystal-palace-station-grid",
    );
    expect(
      input.legalActions.some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(true);
    expect(decision.reasonCode).toBe("runner.plan.trash_asset");
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("trash_accessed_card");
    expect(decision.evidence).toContain("remote_trash_role:run_tax");
    expect(decision.evidence).toContain("remote_trash_acute_threat:true");
  });

  it("uses dedicated upgrade trash credits for an expensive high-impact trash without treating all cost as general cash", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-runner-dedicated-trash-credits",
        runnerDeck: {
          id: "ai_dedicated_trash_runner",
          name: "AI Dedicated Trash Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_057_scatter-shot", quantity: 1 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
        corpDeck: {
          id: "ai_dedicated_trash_corp",
          name: "AI Dedicated Trash Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 3;
    moveRunnerCardToGrip(state, "onr_v1_057_scatter-shot");
    state = installRunnerCard(state, "onr_v1_057_scatter-shot");
    const scatterId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_057_scatter-shot",
    );
    expect(scatterId).toBeDefined();
    if (!scatterId) throw new Error("Missing Scatter Shot");
    state.cardInstances[scatterId] = {
      ...state.cardInstances[scatterId]!,
      counters: {
        ...(state.cardInstances[scatterId]?.counters ?? {}),
        bit: 2,
      },
    };
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
      0,
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "onr_v1_355_crystal-palace-station-grid",
    );
    expect(input.playerView.own.rig?.[0]?.counters).toMatchObject({
      bit: 2,
    });
    expect(decision.evidence).toContain("remote_trash_role:run_tax");
    expect(decision.evidence).toContain("remote_trash_dedicated_credits:2");
    expect(decision.reasonCode).toBe("runner.plan.trash_asset");
    expect(decision.evidence).toContain(
      "remote_trash_deferred_by_budget:false",
    );
  });

  it("declines a low-value remote trash when credits are better preserved", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v141-remote-low-value-trash",
        corpDeck: {
          id: "ai_remote_low_value_upgrade_corp",
          name: "AI Remote Low Value Upgrade Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      }),
    );
    state.runner.credits = 4;
    putCorpRootInRemote(state, "simple_upgrade", 0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decision = chooseRunnerAction(input);

    expect(input.playerView.run?.accessedCard?.definitionId).toBe(
      "simple_upgrade",
    );
    expect(
      input.legalActions.some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(true);
    expect(decision.reasonCode).toBe("runner.access.decline_trash");
  });

  it("prefers advanced remote contest over central pressure when contestable", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-remote-contest-before-central",
      (state) => {
        state.runner.credits = 5;
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(remoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!remoteRun || !rdRun)
      throw new Error("Missing remote/central contest fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, rdRun],
    });

    expect(decision.actionId).toBe(remoteRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
    expect(decision.evidence).toContain(
      "remote_contest_selected_advanced:true",
    );
    expect(decision.evidence).toContain(
      "remote_contest_selected_contestable:true",
    );
    expect(decision.evidence).toContain(
      "remote_contest_selected_post_run_reserve_sufficient:true",
    );
  });

  it("avoids a remote run when post-run steal or trash reserve is visibly missing", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-post-run-reserve-missing",
      (state) => {
        state.runner.credits = 4;
        putCorpRootInRemote(state, "simple_agenda", 2);
        const redHerrings = putCorpRootInRemote(
          state,
          "onr_v1_366_red-herrings",
          0,
        );
        state.cardInstances[redHerrings] = {
          ...state.cardInstances[redHerrings]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      {
        corpDeck: {
          id: "ai_post_run_reserve_red_herrings_corp",
          name: "AI Post-Run Reserve Red Herrings Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 3 },
            { id: "onr_v1_366_red-herrings", quantity: 1 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    expect(remoteRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!remoteRun || !economy)
      throw new Error("Missing post-run reserve fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, economy],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    const contestCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [remoteRun, economy],
    }).find((candidate) => candidate.kind === "contest_remote");
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate)
      throw new Error("Missing post-run reserve contest candidate");
    const contestScore = evaluateRunnerPlan(input, contestCandidate);
    expect(contestScore.reasons).toContain(
      "preserve_credits_for_steal_or_trash",
    );
    expect(contestScore.evidence).toContain(
      "remote_contest_selected_post_run_reserve_sufficient:false",
    );
  });

  it("brakes central pressure that would burn reserve for a contestable advanced remote", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-central-burns-remote-reserve",
      (state) => {
        state.runner.credits = 7;
        putCorpRootInRemote(state, "simple_agenda", 2);
        const redHerrings = putCorpRootInRemote(
          state,
          "onr_v1_366_red-herrings",
          0,
        );
        state.cardInstances[redHerrings] = {
          ...state.cardInstances[redHerrings]!,
          faceup: true,
          rezzed: true,
        };
        const rdIce = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[rdIce] = {
          ...state.cardInstances[rdIce]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerProgramToRig(state, "simple_fracter");
      },
      {
        corpDeck: {
          id: "ai_central_burns_remote_reserve_corp",
          name: "AI Central Burns Remote Reserve Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_agenda", quantity: 3 },
            { id: "onr_v1_366_red-herrings", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 4 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(remoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!remoteRun || !rdRun)
      throw new Error("Missing central burn fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, rdRun],
    });

    expect(decision.actionId).toBe(remoteRun.actionId);
    const centralCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [remoteRun, rdRun],
    }).find((candidate) => candidate.kind === "pressure_rnd");
    expect(centralCandidate).toBeDefined();
    if (!centralCandidate) throw new Error("Missing central burn candidate");
    const centralScore = evaluateRunnerPlan(input, centralCandidate);
    expect(centralScore.evidence).toContain(
      "central_run_burns_contest_reserve:true",
    );
  });

  it("keeps central pressure when remote contest is visibly bad", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-remote-contest-bad-central-ok",
      (state) => {
        state.runner.credits = 1;
        putCorpRootInRemote(state, "simple_upgrade", 0);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
      {
        corpDeck: {
          id: "ai_bad_remote_central_ok_corp",
          name: "AI Bad Remote Central OK Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 2 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(remoteRun).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!remoteRun || !rdRun)
      throw new Error("Missing bad-remote central fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, rdRun],
    });

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(decision.reasonCode).not.toBe("runner.plan.contest_remote");
  });

  it("keeps remote contest and trash decisions invariant to hidden Corp zones", () => {
    const gameA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v141-remote-contest-hidden-invariance",
      }),
    );
    gameA.runner.credits = 5;
    putCorpRootInRemote(gameA, "simple_agenda", 2);
    const gameB = structuredClone(gameA);
    const hiddenCard = gameB.corp.hq[0] ?? gameB.corp.rd[0];
    if (hiddenCard) {
      gameB.cardInstances[hiddenCard] = {
        ...gameB.cardInstances[hiddenCard]!,
        definitionId: "simple_economy_asset",
        faceup: false,
        rezzed: false,
      };
    }
    const inputA = buildAiDecisionInput(gameA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(gameB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remoteRunA = inputA.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRunA = inputA.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const remoteRunB = inputB.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const rdRunB = inputB.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(remoteRunA && rdRunA && remoteRunB && rdRunB).toBeTruthy();
    if (!remoteRunA || !rdRunA || !remoteRunB || !rdRunB)
      throw new Error("Missing hidden-invariance contest actions");

    const decisionA = chooseRunnerAction({
      ...inputA,
      legalActions: [remoteRunA, rdRunA],
    });
    const decisionB = chooseRunnerAction({
      ...inputB,
      legalActions: [remoteRunB, rdRunB],
    });

    expect(decisionA.reasonCode).toBe(decisionB.reasonCode);
    expect(
      inputA.legalActions.find(
        (action) => action.actionId === decisionA.actionId,
      )?.type,
    ).toBe(
      inputB.legalActions.find(
        (action) => action.actionId === decisionB.actionId,
      )?.type,
    );
    expect(assertAiInputIsSideSafe(inputA)).toBe(true);
    expect(assertAiInputIsSideSafe(inputB)).toBe(true);
  });

  it("prefers economy while below visible remote-contest reserve", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-reserve-economy-before-contest",
      (state) => {
        state.runner.credits = 1;
        moveRunnerProgramToRig(state, "simple_fracter");
        ensureRemoteServer(state, "remote_1");
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        const assetId = putCorpRootInRemote(state, "simple_economy_asset", 0);
        state.cardInstances[assetId] = {
          ...state.cardInstances[assetId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      {
        corpDeck: {
          id: "ai_reserve_remote_asset_corp",
          name: "AI Reserve Remote Asset Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 2 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(economy).toBeDefined();
    expect(remoteRun).toBeDefined();
    if (!economy || !remoteRun)
      throw new Error("Missing reserve economy fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [economy, remoteRun],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(decision.evidence).toContain("runner_below_reserve:true");
    expect(decision.evidence).toContain("affordable_remote_contest:false");
  });

  it("avoids low-value central pressure that would destroy remote-contest reserve", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-reserve-avoid-central",
      (state) => {
        state.runner.credits = 3;
        putCorpRootInRemote(state, "simple_agenda", 2);
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    expect(economy).toBeDefined();
    expect(rdRun).toBeDefined();
    if (!economy || !rdRun)
      throw new Error("Missing central reserve fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [economy, rdRun],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    const centralCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [economy, rdRun],
    }).find((candidate) => candidate.kind === "pressure_rnd");
    expect(centralCandidate).toBeDefined();
    if (!centralCandidate) throw new Error("Missing central reserve candidate");
    expect(evaluateRunnerPlan(input, centralCandidate).reasons).toContain(
      "delay_low_value_central_run",
    );
  });

  it("prefers R&D pressure when R&D Interface is installed and no stronger remote threat exists", () => {
    const input = runnerActionPhaseInput(
      "ai-v142-central-rd-interface-pressure",
      (state) => {
        state.runner.credits = 7;
        moveRunnerHardwareToRig(state, "onr_v1_139_r-and-d-interface");
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      runnerCentralPressureDeckConfig("rd-interface"),
    );
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    expect(rdRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!rdRun || !economy) throw new Error("Missing R&D interface fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [rdRun, economy],
    });

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_rnd");
    expect(decision.evidence).toContain(
      "central_pressure_matching_interface_installed:true",
    );
  });

  it("prefers HQ pressure when HQ Interface is installed and HQ pressure is plausible", () => {
    const input = runnerActionPhaseInput(
      "ai-v142-central-hq-interface-pressure",
      (state) => {
        state.runner.credits = 7;
        moveRunnerHardwareToRig(state, "onr_v1_129_hq-interface");
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      runnerCentralPressureDeckConfig("hq-interface"),
    );
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );
    expect(hqRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!hqRun || !economy) throw new Error("Missing HQ interface fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, economy],
    });

    expect(decision.actionId).toBe(hqRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_hq");
    expect(decision.evidence).toContain(
      "central_pressure_matching_interface_installed:true",
    );
  });

  it("installs a central interface when it creates a near-term pressure line", () => {
    const input = runnerActionPhaseInput(
      "ai-v142-central-install-interface-before-pressure",
      (state) => {
        state.runner.credits = 6;
        moveRunnerCardToGrip(state, "onr_v1_139_r-and-d-interface");
      },
      runnerCentralPressureDeckConfig("install-interface"),
    );
    const interfaceInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) ===
          "onr_v1_139_r-and-d-interface",
    );
    const draw = input.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(interfaceInstall).toBeDefined();
    expect(draw).toBeDefined();
    if (!interfaceInstall || !draw)
      throw new Error("Missing interface install fixture");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [interfaceInstall, draw],
    });

    expect(decision.actionId).toBe(interfaceInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    const buildCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [interfaceInstall, draw],
    }).find((candidate) => candidate.kind === "build_rig");
    expect(buildCandidate).toBeDefined();
    if (!buildCandidate) throw new Error("Missing interface build candidate");
    expect(evaluateRunnerPlan(input, buildCandidate).reasons).toContain(
      "install_interface_before_repeated_central",
    );
  });

  it("plays a central multiaccess event only when the target is useful", () => {
    const goodInput = runnerActionPhaseInput(
      "ai-v142-central-run-event-good",
      (state) => {
        state.runner.credits = 5;
        moveRunnerCardToGrip(state, "onr_v1_081_custodial-position");
      },
      runnerCentralPressureDeckConfig("run-event-good"),
    );
    const goodEvent = goodInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(goodInput, action) ===
          "onr_v1_081_custodial-position",
    );
    const goodDraw = goodInput.legalActions.find(
      (action) => action.type === "draw_card",
    );
    expect(goodEvent).toBeDefined();
    expect(goodDraw).toBeDefined();
    if (!goodEvent || !goodDraw)
      throw new Error("Missing good run-event fixture");

    const goodDecision = chooseRunnerAction({
      ...goodInput,
      legalActions: [goodEvent, goodDraw],
    });
    expect(goodDecision.actionId).toBe(goodEvent.actionId);
    expect(goodDecision.evidence).toContain(
      "central_pressure_run_event_good_target:true",
    );

    const badInput = runnerActionPhaseInput(
      "ai-v142-central-run-event-bad",
      (state) => {
        state.runner.credits = 2;
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "onr_v1_081_custodial-position");
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      runnerCentralPressureDeckConfig("run-event-bad"),
    );
    const badEvent = badInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(badInput, action) ===
          "onr_v1_081_custodial-position",
    );
    const economy = badInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(badInput, action) === "simple_economy_event",
    );
    expect(badEvent).toBeDefined();
    expect(economy).toBeDefined();
    if (!badEvent || !economy) throw new Error("Missing bad run-event fixture");

    const badDecision = chooseRunnerAction({
      ...badInput,
      legalActions: [badEvent, economy],
    });
    expect(badDecision.actionId).toBe(economy.actionId);
    expect(badDecision.reasonCode).toBe("runner.plan.recover_economy");
  });

  it("avoids repeated low-value central runs unless new pressure value appears", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v142-central-repeat-low-value",
      (state) => {
        state.runner.credits = 2;
        putCorpRootInRemote(state, "simple_agenda", 2);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const economy = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!rdRun || !economy) throw new Error("Missing central repeat fixture");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v142-central-repeat-run",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun, economy],
    };

    const decision = chooseRunnerAction(repeatedInput);
    const centralCandidate = generateRunnerPlanCandidates(repeatedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );

    expect(centralCandidate).toBeDefined();
    if (!centralCandidate)
      throw new Error("Missing repeated central candidate");
    expect(decision.actionId).toBe(economy.actionId);
    expect(
      evaluateRunnerPlan(repeatedInput, centralCandidate).reasons,
    ).toContain("avoid_repeated_low_value_central");
    expect(decision.evidence).toContain("no_fresh_central_window:true");
    expect(decision.evidence).toContain(
      "no_fresh_central_better_alternatives:economy",
    );
  });

  it("substitutes stale central pressure with a breaker install that unlocks a visible path", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v143-no-fresh-substitute-rig-unlock",
      (state) => {
        state.runner.credits = 6;
        putCorpRootInRemote(state, "simple_agenda", 2);
        const iceId = putCorpIceOnServer(
          state,
          "remote_1",
          "simple_barrier_ice",
        );
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_fracter");
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const breakerInstall = baseInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(baseInput, action) === "simple_fracter",
    );
    expect(rdRun).toBeDefined();
    expect(breakerInstall).toBeDefined();
    if (!rdRun || !breakerInstall)
      throw new Error("Missing no-fresh rig-unlock fixture actions");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v143-no-fresh-rig-repeat",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun, breakerInstall],
    };

    const decision = chooseRunnerAction(repeatedInput);

    expect(decision.actionId).toBe(breakerInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(decision.evidence).toContain(
      "no_fresh_central_better_alternatives:rig_unlock",
    );
  });

  it("substitutes stale central pressure with remote contest when an advanced remote is contestable", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v143-no-fresh-substitute-remote-contest",
      (state) => {
        state.runner.credits = 6;
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const remoteRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(rdRun).toBeDefined();
    expect(remoteRun).toBeDefined();
    if (!rdRun || !remoteRun)
      throw new Error("Missing no-fresh remote-contest fixture actions");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v143-no-fresh-remote-repeat",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun, remoteRun],
    };

    const decision = chooseRunnerAction(repeatedInput);

    expect(decision.actionId).toBe(remoteRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
    expect(decision.evidence).toContain(
      "no_fresh_central_better_alternatives:remote_contest",
    );
  });

  it("substitutes stale central pressure with an interface install that creates near-term pressure", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v143-no-fresh-substitute-pressure-install",
      (state) => {
        state.runner.credits = 6;
        moveRunnerCardToGrip(state, "onr_v1_139_r-and-d-interface");
      },
      runnerCentralPressureDeckConfig("no-fresh-pressure-install"),
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const interfaceInstall = baseInput.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(baseInput, action) ===
          "onr_v1_139_r-and-d-interface",
    );
    expect(rdRun).toBeDefined();
    expect(interfaceInstall).toBeDefined();
    if (!rdRun || !interfaceInstall)
      throw new Error("Missing no-fresh pressure-install fixture actions");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v143-no-fresh-pressure-repeat",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun, interfaceInstall],
    };

    const decision = chooseRunnerAction(repeatedInput);

    expect(decision.actionId).toBe(interfaceInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(decision.evidence).toContain(
      "no_fresh_central_better_alternatives:pressure_install",
    );
  });

  it("allows repeated central pressure when fresh interface value is present", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v142-central-repeat-fresh-interface",
      (state) => {
        state.runner.credits = 7;
        moveRunnerHardwareToRig(state, "onr_v1_139_r-and-d-interface");
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      runnerCentralPressureDeckConfig("repeat-fresh"),
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const economy = baseInput.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(baseInput, action) === "simple_economy_event",
    );
    expect(rdRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!rdRun || !economy) throw new Error("Missing fresh repeat fixture");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v142-central-repeat-fresh-run",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun, economy],
    };

    const decision = chooseRunnerAction(repeatedInput);
    const centralCandidate = generateRunnerPlanCandidates(repeatedInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );

    expect(centralCandidate).toBeDefined();
    if (!centralCandidate) throw new Error("Missing fresh central candidate");
    expect(decision.actionId).toBe(rdRun.actionId);
    expect(
      evaluateRunnerPlan(repeatedInput, centralCandidate).reasons,
    ).toContain("central_pressure_with_fresh_value");
  });

  it("keeps stale central pressure when no better active alternative is available", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-v143-no-fresh-allow-no-better-action",
      (state) => {
        state.runner.credits = 5;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(rdRun).toBeDefined();
    if (!rdRun) throw new Error("Missing no-fresh allow fixture action");
    const repeatedInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticRunStartedEvent(
          "ai-v143-no-fresh-allow-repeat",
          baseInput.playerView.stateVersion + 1,
          "rd",
        ),
      ],
      legalActions: [rdRun],
    };

    const decision = chooseRunnerAction(repeatedInput);

    expect(decision.actionId).toBe(rdRun.actionId);
    expect(decision.evidence).toContain("no_fresh_central_window:true");
    expect(decision.evidence).toContain(
      "stale_central_allowed_reasons:central_open|remote_uncontestable|no_better_action",
    );
  });

  it("does not treat generic central access as a true closeout opportunity", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v142-central-generic-not-closeout",
        ...runnerCentralPressureDeckConfig("generic-closeout"),
      }),
    );
    state.runner.credits = 5;
    scoreRunnerAgendaForTest(state, "simple_agenda", 0);
    scoreRunnerAgendaForTest(state, "simple_agenda", 1);
    scoreRunnerAgendaForTest(state, "simple_agenda", 2);
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain) throw new Error("Missing generic closeout fixture");
    const centralCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [rdRun, gain],
    }).find((candidate) => candidate.kind === "pressure_rnd");

    expect(centralCandidate).toBeDefined();
    if (!centralCandidate) throw new Error("Missing generic central candidate");
    expect(
      evaluateRunnerPlan(
        { ...input, legalActions: [rdRun, gain] },
        centralCandidate,
      ).evidence,
    ).toContain("central_closeout_opportunity:false");
  });

  it("uses a central closeout line near victory without reading hidden zones", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v142-central-closeout-hidden-a",
        ...runnerCentralPressureDeckConfig("closeout"),
      }),
    );
    stateA.runner.credits = 5;
    moveRunnerHardwareToRig(stateA, "onr_v1_139_r-and-d-interface");
    scoreRunnerAgendaForTest(stateA, "simple_agenda", 0);
    scoreRunnerAgendaForTest(stateA, "simple_agenda", 1);
    scoreRunnerAgendaForTest(stateA, "simple_agenda", 2);
    const stateB = structuredClone(stateA);
    const hiddenCorpCard = stateB.corp.hq[0] ?? stateB.corp.rd[0];
    if (hiddenCorpCard) {
      stateB.cardInstances[hiddenCorpCard] = {
        ...stateB.cardInstances[hiddenCorpCard]!,
        definitionId: "simple_economy_operation",
      };
    }
    const inputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rdRunA = inputA.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainA = inputA.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    const rdRunB = inputB.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainB = inputB.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRunA && gainA && rdRunB && gainB).toBeTruthy();
    if (!rdRunA || !gainA || !rdRunB || !gainB)
      throw new Error("Missing closeout hidden-invariance actions");

    const decisionA = chooseRunnerAction({
      ...inputA,
      legalActions: [rdRunA, gainA],
    });
    const decisionB = chooseRunnerAction({
      ...inputB,
      legalActions: [rdRunB, gainB],
    });

    expect(decisionA.reasonCode).toBe("runner.plan.pressure_rnd");
    expect(decisionB.reasonCode).toBe(decisionA.reasonCode);
    expect(decisionA.evidence).toContain("central_closeout_opportunity:true");
    expect(
      JSON.stringify({ inputA, inputB, decisionA, decisionB }),
    ).not.toMatch(/cardInstances|privatePayload|fullGameState/i);
  });

  it("still installs an important breaker when it unlocks visible run paths", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-reserve-breaker-unlocks-run",
      (state) => {
        state.runner.credits = 4;
        const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          faceup: true,
          rezzed: true,
        };
        moveRunnerCardToGrip(state, "simple_fracter");
      },
    );
    const breakerInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "simple_fracter",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(breakerInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!breakerInstall || !gain)
      throw new Error("Missing reserve breaker fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [breakerInstall, gain],
    });

    expect(decision.actionId).toBe(breakerInstall.actionId);
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    const buildCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [breakerInstall, gain],
    }).find((candidate) => candidate.kind === "build_rig");
    expect(buildCandidate).toBeDefined();
    if (!buildCandidate) throw new Error("Missing reserve breaker candidate");
    expect(evaluateRunnerPlan(input, buildCandidate).reasons).toContain(
      "install_breaker_if_it_unlocks_runs",
    );
  });

  it("delays redundant installs when they spend below contest reserve", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-reserve-delay-redundant-install",
      (state) => {
        state.runner.credits = 3;
        putCorpRootInRemote(state, "simple_agenda", 2);
        const installed = moveRunnerResourceToRig(
          state,
          "onr_v1_165_junkyard-bbs",
        );
        moveRunnerCardCopyToGrip(state, "onr_v1_165_junkyard-bbs", [installed]);
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      {
        runnerDeck: {
          id: "ai_reserve_duplicate_runner",
          name: "AI Reserve Duplicate Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_165_junkyard-bbs", quantity: 2 },
            { id: "simple_economy_event", quantity: 8 },
          ],
        },
      },
    );
    const duplicateInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_165_junkyard-bbs",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );

    expect(duplicateInstall).toBeDefined();
    expect(economy).toBeDefined();
    if (!duplicateInstall || !economy)
      throw new Error("Missing reserve duplicate fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [duplicateInstall, economy],
    });

    expect(decision.actionId).toBe(economy.actionId);
    const buildCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [duplicateInstall, economy],
    }).find((candidate) => candidate.kind === "build_rig");
    expect(buildCandidate).toBeDefined();
    if (!buildCandidate) throw new Error("Missing reserve duplicate candidate");
    expect(JSON.stringify(evaluateRunnerPlan(input, buildCandidate))).toContain(
      "delay_low_value_install",
    );
  });

  it("avoids starting a run against a known unaffordable rezzed ICE path", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-known-path-unaffordable",
      (state) => {
        state.runner.credits = 1;
        moveRunnerProgramToRig(state, "simple_fracter");
        putCorpRootInRemote(state, "simple_upgrade", 0);
        for (const _ of [0, 1]) {
          const iceId = putCorpIceOnServer(
            state,
            "remote_1",
            "simple_barrier_ice",
          );
          state.cardInstances[iceId] = {
            ...state.cardInstances[iceId]!,
            faceup: true,
            rezzed: true,
          };
        }
        moveRunnerCardToGrip(state, "simple_economy_event");
      },
      {
        corpDeck: {
          id: "ai_known_path_unaffordable_corp",
          name: "AI Known Path Unaffordable Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 4 },
            { id: "simple_agenda", quantity: 3 },
            { id: "simple_economy_operation", quantity: 8 },
          ],
        },
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const economy = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionFromInput(input, action) === "simple_economy_event",
    );

    expect(remoteRun).toBeDefined();
    expect(economy).toBeDefined();
    if (!remoteRun || !economy)
      throw new Error("Missing known-path affordability fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, economy],
    });

    expect(decision.actionId).toBe(economy.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    const contestCandidate = generateRunnerPlanCandidates({
      ...input,
      legalActions: [remoteRun, economy],
    }).find((candidate) => candidate.kind === "contest_remote");
    expect(contestCandidate).toBeDefined();
    if (!contestCandidate)
      throw new Error("Missing known-path contest candidate");
    const contestScore = evaluateRunnerPlan(input, contestCandidate);
    expect(contestScore.evidence).toContain("known_path_blocked:true");
    expect(contestScore.reasons).toContain("known_path_unaffordable");
  });

  it("contests an advanced remote immediately when reserve is sufficient", () => {
    const input = runnerActionPhaseInput(
      "ai-v141-reserve-contest-now",
      (state) => {
        state.runner.credits = 8;
        putCorpRootInRemote(state, "simple_agenda", 2);
      },
    );
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(remoteRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!remoteRun || !gain)
      throw new Error("Missing sufficient reserve contest fixture actions");

    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun, gain],
    });

    expect(decision.actionId).toBe(remoteRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.contest_remote");
  });

  it("keeps economy reserve decisions invariant to hidden Corp zones", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v141-reserve-hidden-invariance",
      }),
    );
    stateA.runner.credits = 2;
    putCorpRootInRemote(stateA, "simple_agenda", 2);
    moveRunnerCardToGrip(stateA, "simple_economy_event");
    const stateB = structuredClone(stateA);
    const hiddenCard = stateB.corp.hq[0] ?? stateB.corp.rd[0];
    if (hiddenCard) {
      stateB.cardInstances[hiddenCard] = {
        ...stateB.cardInstances[hiddenCard]!,
        definitionId: "simple_economy_asset",
        faceup: false,
        rezzed: false,
      };
    }
    const inputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });

    expect(JSON.stringify(inputA.playerView)).toBe(
      JSON.stringify(inputB.playerView),
    );
    expect(chooseRunnerAction(inputA)).toEqual(chooseRunnerAction(inputB));
    expect(assertAiInputIsSideSafe(inputA)).toBe(true);
    expect(assertAiInputIsSideSafe(inputB)).toBe(true);
  });

  it("runs King of the Road side-safe smokes with legal Runner plans", () => {
    const summary = simulateAiGame({
      seed: "ai-kotr-runner-smoke",
      runnerDeck: kingOfTheRoadRunnerDeck(),
      corpDeck: deckDefinitionFromSnapshot("demo_corp_008_snapshot_v0_8"),
      runnerDeckMetadata: kingOfTheRoadSnapshot().publicMetadata,
      corpDeckMetadata: snapshotById("demo_corp_008_snapshot_v0_8")
        .publicMetadata,
      agendaPointsToWin: 7,
      runnerProfileId: "runner-ai-v1.4.1-normal",
      corpProfileId: "corp-ai-v1.4.0-normal",
      maxActions: 70,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(
      summary.actionSequence.some(
        (entry) =>
          entry.side === "runner" &&
          entry.reasonCode.startsWith("runner.plan."),
      ),
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toMatch(
      /cardInstances|privatePayload|v08_project_agenda_1|Simple Priority Agenda/,
    );
  });

  it("keeps King of the Road hidden-state variants from changing visible Runner decisions", () => {
    const stateA = kingOfTheRoadRunnerTurn("ai-kotr-hidden-invariance");
    const stateB = structuredClone(stateA);
    const hiddenId = stateA.corp.rd[0];
    expect(hiddenId).toBeDefined();
    if (!hiddenId) throw new Error("Missing hidden KOTR R&D card");
    stateA.cardInstances[hiddenId] = {
      ...stateA.cardInstances[hiddenId]!,
      definitionId: "simple_agenda",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenId] = {
      ...stateB.cardInstances[hiddenId]!,
      definitionId: "simple_economy_asset",
      faceup: false,
      rezzed: false,
    };
    moveRunnerCardToGrip(stateA, "onr_v1_097_livewires-contacts");
    moveRunnerCardToGrip(stateB, "onr_v1_097_livewires-contacts");
    const inputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const inputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const decisionA = chooseRunnerAction(inputA);
    const decisionB = chooseRunnerAction(inputB);

    expect(JSON.stringify(inputA.playerView)).toBe(
      JSON.stringify(inputB.playerView),
    );
    expect(decisionA.reasonCode).toBe(decisionB.reasonCode);
    expect(
      inputA.legalActions.find(
        (action) => action.actionId === decisionA.actionId,
      )?.type,
    ).toBe(
      inputB.legalActions.find(
        (action) => action.actionId === decisionB.actionId,
      )?.type,
    );
    expect(assertAiInputIsSideSafe(inputA)).toBe(true);
    expect(JSON.stringify(decisionA.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|simple_agenda/,
    );
  });

  it("builds a Runner rig from additional breaker roles", () => {
    const state = batchARunnerTurn("ai-batch-a-build-rig");
    moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    moveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    moveRunnerCardToGrip(state, "onr_v1_039_krash");
    state.runner.credits = 10;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rigInput = {
      ...input,
      legalActions: input.legalActions.filter(
        (action) => action.type === "install_card",
      ),
    };
    const candidates = generateRunnerPlanCandidates(rigInput);
    const decision = chooseRunnerPlanDecision(rigInput);
    const selectedDefinition = sourceDefinitionFromInput(
      rigInput,
      rigInput.legalActions.find(
        (action) => action.actionId === decision.selectedActionId,
      )!,
    );

    expect(candidates.some((candidate) => candidate.kind === "build_rig")).toBe(
      true,
    );
    expect(
      candidates.every((candidate) =>
        runnerPlanUsesOnlyAiSupportedCards(rigInput, candidate),
      ),
    ).toBe(true);
    expect(decision.debug.planKind).toBe("build_rig");
    expect(activeAiApprovedCardIds).toContain(selectedDefinition);
    expect(JSON.stringify(decision.debug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|v08_project_agenda/,
    );
  });

  it("installs memory hardware under MU pressure", () => {
    let state = batchARunnerTurn("ai-batch-a-memory-pressure");
    state.runner.credits = 20;
    state.runner.memoryUsed = state.runner.memoryLimit;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    moveRunnerCardToGrip(state, "onr_v1_144_tycho-mem-chip");
    moveRunnerCardToGrip(state, "onr_v1_146_zetatech-mem-chip");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const installActions = input.legalActions.filter(
      (action) => action.type === "install_card",
    );
    const decision = chooseRunnerPlanDecision({
      ...input,
      legalActions: installActions,
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.selectedActionId,
    );
    const selectedDefinition = sourceDefinitionFromInput(input, selected!);

    expect(input.playerView.own.memoryUsed).toBe(
      input.playerView.own.memoryLimit,
    );
    expect(
      installActions.some(
        (action) =>
          sourceDefinitionFromInput(input, action) === "onr_v1_015_codeslinger",
      ),
    ).toBe(false);
    expect(selectedDefinition).toMatch(/mem-chip$/);
    expect(decision.debug.planKind).toBe("build_rig");
    expect(decision.debug.evidence).toContain("memory_remaining:0");
  });

  it("keeps breaker installation credit- and MU-safe", () => {
    const state = batchARunnerTurn("ai-batch-a-credit-safe");
    moveRunnerCardToGrip(state, "onr_v1_015_codeslinger");
    state.runner.credits = 7;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const expensiveInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_015_codeslinger",
    );
    const gain = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );

    expect(expensiveInstall).toBeDefined();
    expect(gain).toBeDefined();
    if (!expensiveInstall || !gain)
      throw new Error("Missing credit-safe breaker fixture actions");
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [expensiveInstall, gain],
    });
    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(JSON.stringify(decision.decisionDebug)).toContain("credit_reserve");
  });

  it("uses breaker roles for safe probe runs without hidden claims", () => {
    let state = batchARunnerTurn("ai-batch-a-safe-probe");
    state.runner.credits = 8;
    moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_014_codecracker",
    );
    ensureRemoteServer(state, "remote_1");
    const iceId = putCorpIceOnServer(state, "remote_1", "simple_code_gate_ice");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const remoteRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );

    expect(remoteRun).toBeDefined();
    if (!remoteRun) throw new Error("Missing breaker safe probe run");
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [remoteRun],
    });
    expect(decision.reasonCode).toBe("runner.plan.safe_probe_run");
    expect(decision.evidence).toContain("rig_breakers:1");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "unknown_corp_cards_remain_unknown",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|simple_agenda/,
    );
  });

  it("avoids pointless breaker runs into a visible stopper", () => {
    const state = batchARunnerTurn("ai-batch-a-negative-stopper");
    const iceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
    moveRunnerCardToGrip(state, "onr_v1_021_dwarf");
    state.runner.credits = 6;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.1-normal",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const dwarfInstall = input.legalActions.find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionFromInput(input, action) === "onr_v1_021_dwarf",
    );

    expect(rdRun).toBeDefined();
    expect(dwarfInstall).toBeDefined();
    if (!rdRun || !dwarfInstall)
      throw new Error("Missing breaker negative stopper fixture actions");
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [rdRun, dwarfInstall],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected?.type).toBe("install_card");
    expect(decision.reasonCode).toBe("runner.plan.build_rig");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|Simple Agenda|simple_agenda/,
    );
  });

  it("keeps V1.4.0 Corp plan regression green while Runner plans run against basic and planned Corp", () => {
    const scoreInput = corpActionPhaseInput(
      "ai-v141-corp-regression",
      (state) => {
        state.corp.credits = 8;
        putCorpRootInRemote(state, "simple_agenda", 3);
      },
    );
    const basicCorp = runRunnerAiSmoke(
      "ai-v141-basic-corp-smoke",
      34,
      "baseline",
    );
    const plannedCorp = simulateAiGame({
      seed: "ai-v141-planned-corp-smoke",
      maxActions: 50,
      runnerProfileId: "runner-ai-v1.4.1-normal",
      corpProfileId: "corp-ai-v1.4.0-normal",
    });

    expect(chooseCorpAction(scoreInput).reasonCode).toBe("corp.plan.score_now");
    expect(basicCorp.errors).toEqual([]);
    expect(basicCorp.runnerPlanDecisions).toBeGreaterThan(0);
    expect(plannedCorp.errors).toEqual([]);
    expect(plannedCorp.replayOk).toBe(true);
    expect(
      plannedCorp.actionSequence.some((entry) =>
        entry.reasonCode.startsWith("runner.plan."),
      ),
    ).toBe(true);
    expect(
      plannedCorp.actionSequence.some((entry) =>
        entry.reasonCode.startsWith("corp.plan."),
      ),
    ).toBe(true);
  });
});

describe("V1.4.2 belief state and opponent model", () => {
  it("reconstructs deterministic side-safe belief knowledge kinds with hypotheses", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "ai-v142-kinds" }));
    putCorpRootInRemote(state, "simple_agenda", 1);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(input);
    const kinds = new Set(belief.entries.map((entry) => entry.kind));

    expect(kinds.has("own_private_fact")).toBe(true);
    expect(kinds.has("public_fact")).toBe(true);
    expect(kinds.has("revealed_opponent_fact")).toBe(true);
    expect(kinds.has("hypothesis")).toBe(true);
    expect(kinds.has("unknown")).toBe(true);
    expect(belief.assumptions).toContain(
      "belief_state_reconstructed_from_side_safe_history",
    );
    expect(JSON.stringify(belief)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("keeps Runner and Corp reconnect belief signatures stable for equal side-safe projections", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-invariance" }),
    );
    const stateB = structuredClone(stateA);
    const hiddenCorpRdId = stateA.corp.rd[0];
    const hiddenRunnerStackId = stateA.runner.stack[0];
    expect(hiddenCorpRdId).toBeDefined();
    expect(hiddenRunnerStackId).toBeDefined();
    if (!hiddenCorpRdId) throw new Error("Missing hidden R&D card");
    if (!hiddenRunnerStackId) throw new Error("Missing hidden Stack card");
    stateA.cardInstances[hiddenCorpRdId] = {
      ...stateA.cardInstances[hiddenCorpRdId]!,
      definitionId: "simple_agenda",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenCorpRdId] = {
      ...stateB.cardInstances[hiddenCorpRdId]!,
      definitionId: "simple_economy_asset",
      faceup: false,
      rezzed: false,
    };
    stateA.cardInstances[hiddenRunnerStackId] = {
      ...stateA.cardInstances[hiddenRunnerStackId]!,
      definitionId: "simple_fracter",
      faceup: false,
      rezzed: false,
    };
    stateB.cardInstances[hiddenRunnerStackId] = {
      ...stateB.cardInstances[hiddenRunnerStackId]!,
      definitionId: "simple_decoder",
      faceup: false,
      rezzed: false,
    };

    const runnerInputA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const runnerInputB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpInputA = buildAiDecisionInput(stateA, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const corpInputB = buildAiDecisionInput(stateB, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const runnerBeliefA = reconstructBeliefState({
      ...runnerInputA,
      eventTail: runnerInputA.playerView.publicEvents,
    });
    const runnerBeliefB = reconstructBeliefState({
      ...runnerInputB,
      eventTail: runnerInputB.playerView.publicEvents,
    });
    const corpBeliefA = reconstructBeliefState({
      ...corpInputA,
      eventTail: corpInputA.playerView.publicEvents,
    });
    const corpBeliefB = reconstructBeliefState({
      ...corpInputB,
      eventTail: corpInputB.playerView.publicEvents,
    });

    expect(JSON.stringify(getPlayerView(stateA, "runner"))).toBe(
      JSON.stringify(getPlayerView(stateB, "runner")),
    );
    expect(JSON.stringify(getPlayerView(stateA, "corp"))).toBe(
      JSON.stringify(getPlayerView(stateB, "corp")),
    );
    expect(beliefStateInvariantSignature(runnerBeliefA)).toBe(
      beliefStateInvariantSignature(runnerBeliefB),
    );
    expect(beliefStateInvariantSignature(corpBeliefA)).toBe(
      beliefStateInvariantSignature(corpBeliefB),
    );
    expect(JSON.stringify(runnerBeliefA)).not.toMatch(
      /simple_agenda|simple_economy_asset|cardInstances|privatePayload/,
    );
    expect(JSON.stringify(corpBeliefA)).not.toMatch(
      /simple_fracter|simple_decoder|cardInstances|privatePayload/,
    );
  });

  it("preserves central access memory through reconnect history and removes rolled-back HQ facts", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-reconnect-central-memory" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const rdAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-rd-access",
      100,
      "rd",
      "simple_agenda",
    );
    const hqAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-hq-access",
      101,
      "hq",
      "simple_economy_operation",
    );
    const archivesAccess = syntheticCentralAccessEvent(
      "ai-v142-reconnect-archives-access",
      102,
      "archives",
      "simple_economy_asset",
    );
    const liveInput = {
      ...baseInput,
      eventTail: [...baseInput.eventTail, rdAccess, hqAccess, archivesAccess],
    };
    const reconnectInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        publicEvents: [
          ...baseInput.playerView.publicEvents,
          rdAccess,
          hqAccess,
          archivesAccess,
        ],
      },
      eventTail: [archivesAccess, hqAccess, rdAccess],
    };

    const liveBelief = reconstructBeliefState(liveInput);
    const reconnectBelief = reconstructBeliefState(reconnectInput);
    const memoryByZone = new Map(
      (reconnectBelief.knownPositionMemory ?? []).map((entry) => [
        entry.zone,
        entry,
      ]),
    );
    const rolledBackBelief = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        publicEvents: baseInput.playerView.publicEvents,
      },
      eventTail: baseInput.eventTail,
    });

    expect(beliefStateInvariantSignature(reconnectBelief)).toBe(
      beliefStateInvariantSignature(liveBelief),
    );
    expect(memoryByZone.get("rd")).toMatchObject({
      positionKey: "top",
      definitionId: "simple_agenda",
    });
    expect(memoryByZone.get("hq")).toMatchObject({
      positionKey: "accessed",
      definitionId: "simple_economy_operation",
    });
    expect(memoryByZone.get("archives")).toMatchObject({
      positionKey: "accessed",
      definitionId: "simple_economy_asset",
    });
    expect(
      reconnectBelief.runnerOpponentModel?.hqHandMemory.knownDefinitions,
    ).toContain("simple_economy_operation");
    expect(
      rolledBackBelief.runnerOpponentModel?.hqHandMemory.knownDefinitions ?? [],
    ).not.toContain("simple_economy_operation");
    expect(
      rolledBackBelief.knownPositionMemory?.some(
        (entry) =>
          entry.zone === "hq" &&
          entry.definitionId === "simple_economy_operation",
      ) ?? false,
    ).toBe(false);
    expect(JSON.stringify(rolledBackBelief)).not.toContain(
      "revealed_opponent_card:simple_economy_operation",
    );
  });

  it("ignores replay private payload decoys while reconstructing access belief", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-private-payload-decoy" }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const accessEvent = syntheticCentralAccessEvent(
      "ai-v142-private-payload-rd-access",
      100,
      "rd",
      "simple_agenda",
    );
    const taintedEvent = {
      ...accessEvent,
      privatePayload: {
        cardDefinitionId: "simple_priority_agenda",
        title: "Hidden Priority Agenda",
      },
      cardInstances: {
        hidden: { definitionId: "simple_priority_agenda" },
      },
    } as PublicGameEvent & {
      privatePayload: Record<string, unknown>;
      cardInstances: Record<string, unknown>;
    };
    const sanitizedInput = buildAiDecisionInputDto({
      side: "runner",
      playerView: {
        ...baseInput.playerView,
        publicEvents: [...baseInput.playerView.publicEvents, taintedEvent],
      },
      eventTail: [...baseInput.eventTail, taintedEvent],
      legalActions: baseInput.legalActions,
      difficulty: "normal",
      seed: baseInput.seed,
      decisionId: "ai-v142-private-payload-decoy:runner",
      actionNumber: baseInput.actionNumber,
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(sanitizedInput);
    const serializedInput = JSON.stringify(sanitizedInput);
    const serializedBelief = JSON.stringify(belief);

    expect(assertAiInputIsSideSafe(sanitizedInput)).toBe(true);
    expect(serializedInput).not.toMatch(
      /privatePayload|cardInstances|simple_priority_agenda/,
    );
    expect(serializedBelief).not.toMatch(
      /privatePayload|cardInstances|simple_priority_agenda/,
    );
    expect(belief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
    });
  });

  it("tracks R&D access freshness and invalidates after Corp draw, then reconstructs after undo-like rollback", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-freshness" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }
    const staleState = structuredClone(state);
    const staleBelief = reconstructBeliefState(
      buildAiDecisionInput(staleState, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(staleBelief.runnerOpponentModel?.rndTopFreshness.freshness).toBe(
      "stale_known_same_top",
    );

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const invalidatedBelief = reconstructBeliefState(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("invalidated");
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.invalidationReasons.join(
        "|",
      ),
    ).toContain("corp_draw_from_rd");

    const reconstructedAfterUndo = reconstructBeliefState(
      buildAiDecisionInput(staleState, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    expect(
      reconstructedAfterUndo.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("stale_known_same_top");
  });

  it("tracks side-safe known position memory and invalidates R&D top after Corp draw", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v198-known-position-memory" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const accessEvent: PublicGameEvent = {
      eventId: "v198-known-rd-top",
      type: "access_card",
      stateVersionBefore: input.playerView.stateVersion,
      stateVersionAfter: input.playerView.stateVersion + 1,
      stateHashAfter: "fnv1a:v198access",
      visibilityClass: "hidden_info_barrier",
      publicPayload: {
        actor: "runner",
        actionType: "access_card",
        serverId: "rd",
        cardDefinitionId: "simple_agenda",
        label: "Runner accesses R&D",
      },
    };
    const accessedBelief = reconstructBeliefState({
      ...input,
      eventTail: [...input.eventTail, accessEvent],
    });
    expect(accessedBelief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
      certainty: "observed",
    });
    expect(
      accessedBelief.runnerOpponentModel?.knownPositionMemory[0],
    ).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
    });

    const drawEvent: PublicGameEvent = {
      eventId: "v198-corp-draw-invalidates-rd-top",
      type: "mandatory_draw",
      stateVersionBefore: input.playerView.stateVersion + 1,
      stateVersionAfter: input.playerView.stateVersion + 2,
      stateHashAfter: "fnv1a:v198draw",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarte ziehen",
      },
    };
    const invalidatedBelief = reconstructBeliefState({
      ...input,
      eventTail: [...input.eventTail, accessEvent, drawEvent],
    });
    expect(invalidatedBelief.knownPositionMemory ?? []).toEqual([]);
    expect(
      invalidatedBelief.runnerOpponentModel?.knownPositionMemory ?? [],
    ).toEqual([]);
    expect(JSON.stringify(invalidatedBelief)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("transfers known R&D top agenda into HQ memory after Corp draw and boosts HQ pressure", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-rnd-top-agenda-to-hq",
        ...hqMemoryDeckConfig("rnd-top-agenda-to-hq"),
      }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const input = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-agenda",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-known-agenda-drawn",
          101,
          "corp",
          "mandatory_draw",
        ),
      ],
    };
    const belief = reconstructBeliefState(input);
    const candidate = generateRunnerPlanCandidates(input).find(
      (plan) => plan.kind === "pressure_hq",
    );
    if (!candidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(input, candidate, belief);

    expect(belief.runnerOpponentModel?.hqHandMemory.knownDefinitions).toContain(
      "simple_agenda",
    );
    expect(
      belief.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).toContain("known_rnd_top_moved_to_hq");
    expect(score.reasons).toContain("known_hq_agenda_pressure");
    expect(score.evidence).toContain(
      "hq_run_boosted_because_known_agenda:true",
    );
  });

  it("does not transfer R&D top knowledge through shuffle/reorder before draw and keeps multi-draw unknown remainder", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-rnd-top-shuffle-before-draw",
        ...hqMemoryDeckConfig("rnd-top-shuffle"),
      }),
    );
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const shuffled = reconstructBeliefState({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-before-shuffle",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-shuffle",
          101,
          "corp",
          "resolve_choice",
          undefined,
          {
            hiddenZoneAction: "corp_rd_shuffle",
          },
        ),
        syntheticPlanActionEvent(
          "ai-rnd-draw-after-shuffle",
          102,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    const multiDrawInput = {
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 4 },
      },
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-known-nonagenda",
          100,
          "rd",
          "simple_barrier_ice",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-multi-draw",
          101,
          "corp",
          "draw_card",
          undefined,
          {
            drawnCount: 3,
          },
        ),
      ],
    };
    const multiDraw = reconstructBeliefState(multiDrawInput);
    const candidate = generateRunnerPlanCandidates(multiDrawInput).find(
      (plan) => plan.kind === "pressure_hq",
    );
    if (!candidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(
      multiDrawInput,
      candidate,
      multiDraw,
    );

    expect(
      shuffled.runnerOpponentModel?.hqHandMemory.knownDefinitions ?? [],
    ).not.toContain("simple_agenda");
    expect(multiDraw.runnerOpponentModel?.hqHandMemory).toMatchObject({
      knownDefinitions: ["simple_barrier_ice"],
      knownCount: 1,
      handCount: 4,
      allCardsKnown: false,
    });
    expect(score.reasons).not.toContain("known_hq_agenda_pressure");
    expect(score.evidence).toContain(
      "hq_run_boosted_because_unknown_cards_remain:true",
    );
  });

  it("retains known remote access memory for agendas and trashable cards, then invalidates on new install", () => {
    const input = runnerActionPhaseInput(
      "ai-known-remote-memory",
      (state) => {
        ensureRemoteServer(state, "remote_1");
        putCorpRootInRemote(state, "simple_agenda", 0);
        state.runner.credits = 6;
      },
      hqMemoryDeckConfig("known-remote-memory"),
    );
    const agendaMemoryInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticRemoteAccessEvent(
          "ai-known-remote-agenda",
          100,
          "remote_1",
          "simple_agenda",
          "root:0",
        ),
      ],
    };
    const trashMemoryInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticRemoteAccessEvent(
          "ai-known-remote-upgrade",
          100,
          "remote_1",
          "simple_upgrade",
          "root:0",
        ),
      ],
    };
    const invalidated = reconstructBeliefState({
      ...agendaMemoryInput,
      eventTail: [
        ...agendaMemoryInput.eventTail,
        syntheticPlanActionEvent(
          "ai-known-remote-new-install",
          101,
          "corp",
          "install_card",
          "remote_1",
        ),
      ],
    });
    const agendaCandidate = generateRunnerPlanCandidates(
      agendaMemoryInput,
    ).find((candidate) => candidate.kind === "contest_remote");
    const trashCandidate = generateRunnerPlanCandidates(trashMemoryInput).find(
      (candidate) => candidate.kind === "contest_remote",
    );
    if (!agendaCandidate || !trashCandidate)
      throw new Error("Missing remote contest candidates");
    const agendaThreat = evaluateRemoteThreat(
      agendaMemoryInput,
      agendaCandidate,
      reconstructBeliefState(agendaMemoryInput),
    );
    const trashThreat = evaluateRemoteThreat(
      trashMemoryInput,
      trashCandidate,
      reconstructBeliefState(trashMemoryInput),
    );

    expect(
      reconstructBeliefState(agendaMemoryInput).knownPositionMemory?.[0],
    ).toMatchObject({
      zone: "remote_1",
      positionKey: "root:0",
      definitionId: "simple_agenda",
    });
    expect(agendaThreat.reasons).toContain("known_remote_agenda_pressure");
    expect(trashThreat.reasons).toContain("known_remote_trash_target");
    expect(invalidated.knownPositionMemory ?? []).toEqual([]);
  });

  it("uses exposed unrezzed ICE memory for later run-cost assessment and invalidates on conceal/reorder", () => {
    const input = runnerActionPhaseInput(
      "ai-known-unrezzed-ice-memory",
      (state) => {
        ensureRemoteServer(state, "remote_1");
        putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
        putCorpRootInRemote(state, "simple_agenda", 1);
        state.runner.credits = 0;
      },
      hqMemoryDeckConfig("known-unrezzed-ice"),
    );
    const exposedInput = {
      ...input,
      eventTail: [
        ...input.eventTail,
        syntheticExposeInstalledEvent(
          "ai-exposed-unrezzed-ice",
          100,
          "remote_1",
          "ice:0",
          "simple_barrier_ice",
        ),
      ],
    };
    const candidate = generateRunnerPlanCandidates(exposedInput).find(
      (plan) => plan.kind === "contest_remote",
    );
    if (!candidate) throw new Error("Missing exposed ICE run candidate");
    const cost = estimateRunCost(exposedInput, candidate);
    const invalidated = reconstructBeliefState({
      ...exposedInput,
      eventTail: [
        ...exposedInput.eventTail,
        syntheticPlanActionEvent(
          "ai-new-blood-reorder",
          101,
          "corp",
          "play_operation",
          undefined,
          {
            hiddenZoneAction: "new_blood_conceal_reorder_installed_ice",
          },
        ),
      ],
    });

    expect(
      reconstructBeliefState(exposedInput).knownPositionMemory?.[0],
    ).toMatchObject({
      zone: "remote_1",
      positionKey: "ice:0",
      definitionId: "simple_barrier_ice",
    });
    expect(cost.evidence).toContain("known_unrezzed_ice_from_expose:1");
    expect(cost.evidence).toContain("known_unrezzed_ice_blocks_path:true");
    expect(invalidated.knownPositionMemory ?? []).toEqual([]);
  });

  it("applies R&D repeat-access penalty only while top-card freshness is stale", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-penalty" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }

    const staleInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const staleBelief = reconstructBeliefState(staleInput);
    const pressureCandidate = generateRunnerPlanCandidates(staleInput).find(
      (candidate) => candidate.kind === "pressure_rnd",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_rnd candidate");
    const staleScore = evaluateServerAccessValue(
      staleInput,
      pressureCandidate,
      staleBelief,
    );

    const syntheticInvalidation: PublicGameEvent = {
      eventId: "v142-corp-draw-synthetic",
      type: "mandatory_draw",
      stateVersionBefore: staleInput.playerView.stateVersion,
      stateVersionAfter: staleInput.playerView.stateVersion + 1,
      stateHashAfter: "fnv1a:v142invalidated",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarte ziehen",
      },
    };
    const invalidatedInput = {
      ...staleInput,
      eventTail: [...staleInput.eventTail, syntheticInvalidation],
    };
    const invalidatedBelief = reconstructBeliefState(invalidatedInput);
    const invalidatedScore = evaluateServerAccessValue(
      invalidatedInput,
      pressureCandidate,
      invalidatedBelief,
    );

    expect(staleBelief.runnerOpponentModel?.rndTopFreshness.freshness).toBe(
      "stale_known_same_top",
    );
    expect(
      invalidatedBelief.runnerOpponentModel?.rndTopFreshness.freshness,
    ).toBe("invalidated");
    expect(staleScore.reasons).toContain("known_rnd_top_not_fresh");
    expect(invalidatedScore.score).toBeGreaterThan(staleScore.score);
  });

  it("prefers economy over immediate repeat R&D runs when top-card freshness is stale", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-rnd-repeat-choice" }),
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "decline_trash",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" || action.type === "jack_out",
      );
    }

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const rdRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!rdRun || !gainCredit)
      throw new Error("Missing stale R&D or gain_credit action");

    const staleDecisionInput = {
      ...input,
      legalActions: [rdRun, gainCredit],
    };
    const decision = chooseRunnerAction(staleDecisionInput);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const baselineDecision = chooseRunnerBaselineAction(staleDecisionInput);
    const baselineSelected = input.legalActions.find(
      (action) => action.actionId === baselineDecision.actionId,
    );
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(baselineSelected?.type).toBe("gain_credit");
    expect(baselineDecision.reasonCode).toBe("runner.economy.basic_credit");
  });

  it("prefers economy over repeat HQ runs when the full HQ hand is known low-value", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-low-value-repeat",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    const overtimeId = moveCorpCardToHq(
      state,
      "onr_v1_297_overtime-incentives",
    );
    keepOnlyCorpHqCard(state, overtimeId);
    state.runner.credits = 2;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const belief = reconstructBeliefState(input);
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!hqRun || !gainCredit)
      throw new Error("Missing known HQ or gain_credit action");

    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const score = evaluateServerAccessValue(input, pressureCandidate, belief);
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });
    const baselineDecision = chooseRunnerBaselineAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["onr_v1_297_overtime-incentives"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(score.reasons).toContain("known_hq_hand_low_value");
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).toBe("runner.plan.recover_economy");
    expect(baselineDecision.actionId).toBe(gainCredit.actionId);
    expect(baselineDecision.reasonCode).toBe("runner.economy.basic_credit");
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("tracks known HQ hand completeness conservatively across arrivals and known departures", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-hand-memory",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    const overtimeId = moveCorpCardToHq(
      state,
      "onr_v1_297_overtime-incentives",
    );
    const economyId = moveCorpCardToHq(state, "simple_economy_operation");
    for (const cardId of state.corp.hq.filter(
      (candidate) => candidate !== overtimeId && candidate !== economyId,
    )) {
      state.corp.rd.push(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
    }
    state.corp.hq = [overtimeId, economyId];
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });

    const fullyKnownInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-known-overtime",
          100,
          "runner",
          "access_card",
          "onr_v1_297_overtime-incentives",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-known-economy",
          101,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
      ],
    };
    const fullyKnownBelief = reconstructBeliefState(fullyKnownInput);
    expect(fullyKnownBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 2,
      knownDefinitions: [
        "simple_economy_operation",
        "onr_v1_297_overtime-incentives",
      ],
      knownCount: 2,
      allCardsKnown: true,
    });

    const afterDraw = structuredClone(state);
    moveCorpCardToHq(afterDraw, "onr_v1_237_data-wall");
    const afterDrawBaseInput = buildAiDecisionInput(afterDraw, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const afterDrawBelief = reconstructBeliefState({
      ...afterDrawBaseInput,
      eventTail: [
        ...fullyKnownInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-unknown-draw",
          102,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    expect(afterDrawBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 3,
      knownCount: 2,
      allCardsKnown: false,
    });

    const afterPlay = structuredClone(state);
    afterPlay.corp.hq = [economyId];
    afterPlay.cardInstances[overtimeId] = {
      ...afterPlay.cardInstances[overtimeId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: true,
    };
    afterPlay.corp.archives.push(overtimeId);
    const afterPlayBaseInput = buildAiDecisionInput(afterPlay, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const afterPlayBelief = reconstructBeliefState({
      ...afterPlayBaseInput,
      eventTail: [
        ...fullyKnownInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-overtime-played",
          102,
          "corp",
          "play_operation",
          "onr_v1_297_overtime-incentives",
        ),
      ],
    });
    expect(afterPlayBelief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_economy_operation"],
      knownCount: 1,
      allCardsKnown: true,
    });
  });

  it("uses full known HQ agenda memory to prefer a payable HQ run", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-known-agenda-run-value",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("known-agenda"),
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    setCorpHqCardsForTest(state, ["simple_agenda", "simple_economy_operation"]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const input = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqPrivateLookEvent("ai-hq-full-look-agenda", 100, [
          "simple_agenda",
          "simple_economy_operation",
        ]),
      ],
    };
    const hqRun = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    const gainCredit = input.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(hqRun).toBeDefined();
    expect(gainCredit).toBeDefined();
    if (!hqRun || !gainCredit)
      throw new Error("Missing HQ agenda fixture actions");

    const belief = reconstructBeliefState(input);
    const pressureCandidate = generateRunnerPlanCandidates(input).find(
      (candidate) => candidate.kind === "pressure_hq",
    );
    expect(pressureCandidate).toBeDefined();
    if (!pressureCandidate) throw new Error("Missing pressure_hq candidate");
    const accessValue = evaluateServerAccessValue(
      input,
      pressureCandidate,
      belief,
    );
    const decision = chooseRunnerAction({
      ...input,
      legalActions: [hqRun, gainCredit],
    });

    expect(belief.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 2,
      knownCount: 2,
      allCardsKnown: true,
      knownDefinitions: ["simple_agenda", "simple_economy_operation"],
    });
    expect(accessValue.reasons).toContain("known_hq_agenda_pressure");
    expect(accessValue.evidence).toContain(
      "hq_run_boosted_because_known_agenda:true",
    );
    expect(decision.actionId).toBe(hqRun.actionId);
    expect(decision.reasonCode).toBe("runner.plan.pressure_hq");
  });

  it("keeps partial known HQ without agenda positive but below known agenda pressure", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-partial-memory-run-value",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("partial-memory"),
        agendaPointsToWin: 7,
      }),
    );
    setCorpHqCardsForTest(state, [
      "simple_economy_operation",
      "simple_barrier_ice",
      "simple_code_gate_ice",
      "simple_agenda",
    ]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const partialNoAgendaInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-partial-economy",
          100,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-wall",
          101,
          "runner",
          "access_card",
          "simple_barrier_ice",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-code-gate",
          102,
          "runner",
          "access_card",
          "simple_code_gate_ice",
        ),
      ],
    };
    const partialAgendaInput = {
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda-economy",
          100,
          "runner",
          "access_card",
          "simple_economy_operation",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda-wall",
          101,
          "runner",
          "access_card",
          "simple_barrier_ice",
        ),
        syntheticHqMemoryEvent(
          "ai-hq-partial-agenda",
          102,
          "runner",
          "access_card",
          "simple_agenda",
        ),
      ],
    };
    const noAgendaCandidate = generateRunnerPlanCandidates(
      partialNoAgendaInput,
    ).find((candidate) => candidate.kind === "pressure_hq");
    const agendaCandidate = generateRunnerPlanCandidates(
      partialAgendaInput,
    ).find((candidate) => candidate.kind === "pressure_hq");
    if (!noAgendaCandidate || !agendaCandidate)
      throw new Error("Missing partial HQ candidates");

    const noAgendaValue = evaluateServerAccessValue(
      partialNoAgendaInput,
      noAgendaCandidate,
      reconstructBeliefState(partialNoAgendaInput),
    );
    const agendaValue = evaluateServerAccessValue(
      partialAgendaInput,
      agendaCandidate,
      reconstructBeliefState(partialAgendaInput),
    );

    expect(
      reconstructBeliefState(partialNoAgendaInput).runnerOpponentModel
        ?.hqHandMemory,
    ).toMatchObject({ handCount: 4, knownCount: 3, allCardsKnown: false });
    expect(noAgendaValue.reasons).toContain("unknown_hq_cards_remain");
    expect(noAgendaValue.evidence).toContain(
      "hq_run_boosted_because_unknown_cards_remain:true",
    );
    expect(agendaValue.reasons).toContain("known_hq_agenda_pressure");
    expect(agendaValue.score).toBeGreaterThan(noAgendaValue.score);
  });

  it("reopens HQ value after draw and removes known HQ cards after install/play/reorder", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-memory-invalidations",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("invalidations"),
        agendaPointsToWin: 7,
      }),
    );
    setCorpHqCardsForTest(state, [
      "simple_economy_operation",
      "simple_barrier_ice",
    ]);
    const baseInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const fullKnownEvents = [
      syntheticHqPrivateLookEvent("ai-hq-full-look-no-agenda", 100, [
        "simple_economy_operation",
        "simple_barrier_ice",
      ]),
    ];
    const afterDraw = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 3 },
      },
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticHqMemoryEvent(
          "ai-hq-draw-invalidates",
          101,
          "corp",
          "mandatory_draw",
        ),
      ],
    });
    const afterInstall = reconstructBeliefState({
      ...baseInput,
      playerView: {
        ...baseInput.playerView,
        opponent: { ...baseInput.playerView.opponent, handCount: 1 },
      },
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticHqMemoryEvent(
          "ai-hq-known-install",
          101,
          "corp",
          "install_card",
          "simple_economy_operation",
        ),
      ],
    });
    const afterReorder = reconstructBeliefState({
      ...baseInput,
      eventTail: [
        ...baseInput.eventTail,
        ...fullKnownEvents,
        syntheticPlanActionEvent(
          "ai-hq-reorder-invalidates",
          101,
          "corp",
          "resolve_choice",
          undefined,
          { hiddenZoneAction: "hq_shuffle" },
        ),
      ],
    });

    expect(afterDraw.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 3,
      knownCount: 2,
      allCardsKnown: false,
    });
    expect(
      afterDraw.runnerOpponentModel?.hqHandMemory.invalidationReasons.join("|"),
    ).toContain("corp_draw_added_unknown_hq_card");
    expect(afterInstall.runnerOpponentModel?.hqHandMemory).toMatchObject({
      handCount: 1,
      knownDefinitions: ["simple_barrier_ice"],
      knownCount: 1,
      allCardsKnown: true,
    });
    expect(afterReorder.runnerOpponentModel?.hqHandMemory).toMatchObject({
      knownCount: 0,
      allCardsKnown: false,
    });
  });

  it("projects Expert Schedule Analyzer HQ look only to Runner AIInput", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-expert-schedule-memory",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("expert-schedule", true),
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerProgramToRig(state, "onr_v1_024_expert-schedule-analyzer");
    setCorpHqCardsForTest(state, ["simple_agenda", "simple_economy_operation"]);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "steal_agenda",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "steal_agenda",
      );
    }
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "continue_run",
      )
    ) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }
    if (state.pendingChoice?.source.startsWith("p3_33.private_look")) {
      state = applyChoice(state, "runner", ["done"]);
    }
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpView = getPlayerView(state, "corp");
    const belief = reconstructBeliefState(runnerInput);

    expect(
      runnerInput.playerView.publicEvents.some((event) =>
        Array.isArray(event.publicPayload.knownHqDefinitionIds),
      ),
    ).toBe(true);
    expect(JSON.stringify(corpView.publicEvents)).not.toContain(
      "knownHqDefinitionIds",
    );
    expect(belief.runnerOpponentModel?.hqHandMemory.allCardsKnown).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(JSON.stringify(runnerInput)).not.toMatch(
      /privatePayload|cardInstances|fullGameState/i,
    );
  });

  it("keeps HQ-memory decisions invariant across different hidden HQ contents with equal revealed memory", () => {
    const stateA = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-hq-memory-hidden-invariance",
        baseline: CURRENT_RULES_BASELINE,
        ...hqMemoryDeckConfig("hidden-invariance"),
        agendaPointsToWin: 7,
      }),
    );
    const stateB = structuredClone(stateA);
    setCorpHqCardsForTest(stateA, [
      "simple_agenda",
      "simple_economy_operation",
    ]);
    setCorpHqCardsForTest(stateB, [
      "simple_barrier_ice",
      "simple_code_gate_ice",
    ]);
    const baseA = buildAiDecisionInput(stateA, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const baseB = buildAiDecisionInput(stateB, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const eventTail = [
      syntheticHqPrivateLookEvent("ai-hq-invariant-known-memory", 100, [
        "simple_agenda",
        "simple_economy_operation",
      ]),
    ];
    const inputA = { ...baseA, eventTail: [...baseA.eventTail, ...eventTail] };
    const inputB = { ...baseB, eventTail: [...baseB.eventTail, ...eventTail] };
    const selectedA = chooseRunnerAction(inputA);
    const selectedB = chooseRunnerAction(inputB);

    expect(JSON.stringify(inputA.playerView.opponent)).toBe(
      JSON.stringify(inputB.playerView.opponent),
    );
    expect(selectedA.reasonCode).toBe(selectedB.reasonCode);
    expect(
      inputA.legalActions.find(
        (action) => action.actionId === selectedA.actionId,
      )?.type,
    ).toBe(
      inputB.legalActions.find(
        (action) => action.actionId === selectedB.actionId,
      )?.type,
    );
  });

  it("summarizes HQ-memory benchmark metrics from side-safe action entries", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "start_run", "hq", 4, {
          hqKnownCards: 2,
          hqUnknownCards: 0,
          hqKnownFraction: 1,
          hqFullyKnown: true,
          hqKnownAgendaCount: 1,
          hqKnownNonAgendaCount: 1,
          hqKnownAgendaPoints: 2,
          hqRunValueFromKnownCards: 680,
          hqRunBoostedBecauseKnownAgenda: true,
        }),
        progressionAction("runner", 2, "start_run", "hq", 4, {
          hqKnownCards: 2,
          hqUnknownCards: 1,
          hqKnownFraction: 0.667,
          hqMemoryInvalidatedByDraw: true,
          hqRunValueFromUnknownCards: 55,
          hqRunBoostedBecauseUnknownCardsRemain: true,
        }),
      ]),
    ]);

    expect(metrics.hqKnownCards).toBe(2);
    expect(metrics.hqUnknownCards).toBe(1);
    expect(metrics.hqKnownAgendaCount).toBe(1);
    expect(metrics.hqKnownAgendaPoints).toBe(2);
    expect(metrics.hqMemoryInvalidatedByDraw).toBe(1);
    expect(metrics.hqRunBoostedBecauseKnownAgenda).toBe(1);
    expect(metrics.hqRunBoostedBecauseUnknownCardsRemain).toBe(1);
  });

  it("summarizes runner breaker-search coverage diagnostics from side-safe action entries", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "play_event", undefined, 5, {
          runnerMissingBreakerCoverageByType: 1,
          runnerVisibleIceBlockingByType: 1,
          runnerPathBlockedByMissingCoverage: true,
          runnerSearchCardAvailableForMissingBreaker: true,
          runnerSearchCardUsedForMissingBreaker: true,
          runnerProbeRevealedIceThenSearchedBreaker: true,
        }),
        progressionAction("runner", 2, "install_card", undefined, 5, {
          runnerInstallableBreakerForBlockedPath: true,
          runnerCoverageImproved: true,
          runnerTutorConvertedToBreakerInstall: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRnd: true,
          runnerSetupContinuedAfterPressureReady: true,
          runnerPressureSkippedAfterCoverageReady: true,
          runnerPressureSkippedReason: "better_immediate_action",
          runnerSetupLoopAfterPressureReady: true,
        }),
        progressionAction("runner", 3, "start_run", "rd", 5, {
          runnerPhaseExitToPressure: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRnd: true,
          runnerPressureTakenAfterCoverageReady: true,
        }),
        progressionAction("runner", 4, "gain_credit", undefined, 6, {
          runnerSearchCardAvailableForMissingBreaker: true,
          runnerSearchCardAvailableButUnused: true,
          runnerSetupEconomyStalled: true,
          runnerSetupBreakerSearchStalled: true,
          runnerPressureReadyWindow: true,
          runnerPressureReadyFalsePositive: true,
          runnerPhaseExitBlockedByTargetValue: true,
        }),
      ]),
    ]);

    expect(metrics.runnerMissingBreakerCoverageByType).toBe(1);
    expect(metrics.runnerVisibleIceBlockingByType).toBe(1);
    expect(metrics.runnerPathBlockedByMissingCoverage).toBe(1);
    expect(metrics.runnerSearchCardAvailableForMissingBreaker).toBe(2);
    expect(metrics.runnerSearchCardUsedForMissingBreaker).toBe(1);
    expect(metrics.runnerSearchCardAvailableButUnused).toBe(1);
    expect(metrics.runnerTutorConvertedToBreakerInstall).toBe(1);
    expect(metrics.runnerCoverageImproved).toBe(1);
    expect(metrics.runnerSetupEconomyStalled).toBe(1);
    expect(metrics.runnerSetupBreakerSearchStalled).toBe(1);
    expect(metrics.runnerPhaseExitToPressure).toBe(1);
    expect(metrics.runnerPressureReadyWindows).toBe(3);
    expect(metrics.runnerPressureReadyTrue).toBe(2);
    expect(metrics.runnerPressureReadyFalsePositive).toBe(1);
    expect(metrics.runnerPressureReadyByTargetRnd).toBe(2);
    expect(metrics.runnerSetupContinuedAfterPressureReady).toBe(1);
    expect(metrics.runnerPressureTakenAfterCoverageReady).toBe(1);
    expect(metrics.runnerPressureSkippedAfterCoverageReady).toBe(1);
    expect(metrics.runnerPressureSkippedBetterImmediateAction).toBe(1);
    expect(metrics.runnerCoverageImprovedThenPressureWithin3).toBe(1);
    expect(metrics.runnerSetupLoopAfterPressureReady).toBe(1);
    expect(metrics.runnerPhaseExitBlockedByTargetValue).toBe(1);
  });

  it("provides Corp and Runner opponent models and keeps DecisionDebug side-safe", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-opponent-models" }),
    );
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    });
    const runnerBelief = reconstructBeliefState(runnerInput);
    const corpBelief = reconstructBeliefState(corpInput);
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpDecision = chooseCorpAction(corpInput);
    const serializedDebug = JSON.stringify({
      runner: runnerDecision.decisionDebug,
      corp: corpDecision.decisionDebug,
    });

    expect(runnerBelief.runnerOpponentModel).toBeDefined();
    expect(corpBelief.corpOpponentModel).toBeDefined();
    expect(runnerBelief.runnerOpponentModel?.corpPlanEstimate).toBeDefined();
    expect(corpBelief.corpOpponentModel?.runnerThreatModel).toBeDefined();
    expect(serializedDebug).toContain("memoryVersion");
    expect(serializedDebug).toContain("facts");
    expect(serializedDebug).toContain("hypotheses");
    expect(serializedDebug).toContain("beliefUncertainty");
    expect(serializedDebug).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("snapshots the versioned DecisionDebug contract for Runner and Korp outputs", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-contract" }),
    );
    const runnerDecision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    const corpDecision = chooseCorpAction(
      buildAiDecisionInput(state, "corp", {
        difficulty: "normal",
        profileId: "corp-ai-v1.4.2-normal",
      }),
    );

    const snapshot = {
      runner: {
        schemaVersion: runnerDecision.decisionDebug?.schemaVersion,
        keys: Object.keys(runnerDecision.decisionDebug ?? {}).sort(),
      },
      corp: {
        schemaVersion: corpDecision.decisionDebug?.schemaVersion,
        keys: Object.keys(corpDecision.decisionDebug ?? {}).sort(),
      },
    };

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "corp": {
          "keys": [
            "aiLevel",
            "facts",
            "hypotheses",
            "invalidations",
            "memoryVersion",
            "opponentModel",
            "schemaVersion",
            "uncertainty",
          ],
          "schemaVersion": "ai-decision-debug-v1",
        },
        "runner": {
          "keys": [
            "actionAlternatives",
            "aiLevel",
            "beliefUncertainty",
            "confidence",
            "detailSections",
            "evidence",
            "facts",
            "fallbackUsed",
            "hypotheses",
            "invalidations",
            "longTermPlan",
            "memoryVersion",
            "opponentModel",
            "planId",
            "planKind",
            "profileId",
            "rankedAlternatives",
            "schemaVersion",
            "score",
            "scoreBreakdown",
            "seed",
            "selectedActionType",
            "summary",
            "timeBudgetMs",
            "timeoutUsed",
            "uncertainty",
            "visibleReasons",
            "warnings",
            "whyNot",
          ],
          "schemaVersion": "ai-decision-debug-v1",
        },
      }
    `);
    expect(snapshot.runner.schemaVersion).toBe(
      AI_DECISION_DEBUG_SCHEMA_VERSION,
    );
    expect(snapshot.corp.schemaVersion).toBe(AI_DECISION_DEBUG_SCHEMA_VERSION);
    expect(JSON.stringify(snapshot)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist/i,
    );
  });

  it("adds side-safe ranked alternatives and score components to Runner DecisionDebug", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-decision-debug-alternatives" }),
    );
    const decision = chooseRunnerAction(
      buildAiDecisionInput(state, "runner", {
        difficulty: "normal",
        profileId: "runner-ai-v1.4.2-normal",
      }),
    );
    const debug = decision.decisionDebug;

    expect(debug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      summary: expect.any(String),
      planKind: expect.any(String),
    });
    expect(debug?.rankedAlternatives?.[0]).toMatchObject({
      rank: 1,
      planKind: debug?.planKind,
      scoreBreakdown: expect.any(Array),
      whyNot: ["selected_plan"],
    });
    expect(debug?.rankedAlternatives?.length).toBeGreaterThan(1);
    expect(debug?.actionAlternatives?.[0]).toMatchObject({
      rank: 1,
      actionId: expect.any(String),
      actionType: expect.any(String),
      selected: true,
      priority: expect.any(Number),
    });
    expect(
      debug?.scoreBreakdown?.some((component) => component.key === "base"),
    ).toBe(true);
    expect(
      debug?.detailSections?.some(
        (section) => section.id === "visible_reasons",
      ),
    ).toBe(true);
    expect(JSON.stringify(debug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|sessionToken|reconnectToken|joinToken|decklist|Hidden Priority Agenda|hidden-card/i,
    );
  });

  it("redacts forbidden DecisionDebug key and value patterns deterministically", () => {
    const sanitized = sanitizeAiDecisionDebug({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planKind: "fallback",
      facts: ["public_fact:ok", "privatePayload runner-sessionToken"],
      rankedAlternatives: [
        {
          rank: 1,
          planKind: "fallback",
          summary: "privatePayload hidden-card",
          score: 10,
          confidence: 0.5,
          visibleReasons: ["safe_reason"],
          scoreBreakdown: [
            {
              key: "decklist",
              label: "Decklist",
              value: 12,
              reason: "hidden-card",
            },
          ],
          whyNot: ["privatePayload"],
        },
      ],
      actionAlternatives: [
        {
          rank: 1,
          actionId: "privatePayload-action",
          actionType: "activated_card_ability",
          label: "Broker hidden-card",
          source: "visible_card",
          sourceTitle: "privatePayload",
          selected: false,
          priority: 42,
          whyNot: ["decklist"],
          economy: {
            economyKind: "pool_build",
            ability: "broker_load_credits",
            immediateGain: 0,
            netCredits: -1,
            storedCredits: 0,
            futurePoolAfter: 3,
            economyNeed: "hidden-card",
          },
        },
      ],
      scoreBreakdown: [
        { key: "economy", label: "Economy", value: 4, reason: "public" },
      ],
      detailSections: [
        { id: "details", title: "Details", items: ["safe", "hidden-card"] },
      ],
      opponentHqContents: ["Hidden Priority Agenda"],
      privatePayload: { FullState: true },
      opponentModel: {
        visibleSignal: "safe",
        rdContents: ["hidden-deck-card"],
        sessionToken: "runner-session-secret",
      },
    });

    expect(sanitized).toMatchInlineSnapshot(`
      {
        "actionAlternatives": [
          {
            "actionId": "[redacted-debug-value]",
            "actionType": "activated_card_ability",
            "economy": {
              "ability": "broker_load_credits",
              "economyKind": "pool_build",
              "economyNeed": "[redacted-debug-value]",
              "futurePoolAfter": 3,
              "immediateGain": 0,
              "netCredits": -1,
              "storedCredits": 0,
            },
            "label": "[redacted-debug-value]",
            "priority": 42,
            "rank": 1,
            "selected": false,
            "source": "visible_card",
            "sourceTitle": "[redacted-debug-value]",
            "whyNot": [
              "[redacted-debug-value]",
            ],
          },
        ],
        "aiLevel": 2,
        "detailSections": [
          {
            "id": "details",
            "items": [
              "safe",
              "[redacted-debug-value]",
            ],
            "title": "Details",
          },
        ],
        "facts": [
          "public_fact:ok",
          "[redacted-debug-value]",
        ],
        "opponentModel": {
          "rdContents": "[redacted-debug-field]",
          "sessionToken": "[redacted-debug-field]",
          "visibleSignal": "safe",
        },
        "planKind": "fallback",
        "rankedAlternatives": [
          {
            "confidence": 0.5,
            "planKind": "fallback",
            "rank": 1,
            "score": 10,
            "scoreBreakdown": [
              {
                "key": "[redacted-debug-value]",
                "label": "[redacted-debug-value]",
                "reason": "[redacted-debug-value]",
                "value": 12,
              },
            ],
            "summary": "[redacted-debug-value]",
            "visibleReasons": [
              "safe_reason",
            ],
            "whyNot": [
              "[redacted-debug-value]",
            ],
          },
        ],
        "schemaVersion": "ai-decision-debug-v1",
        "scoreBreakdown": [
          {
            "key": "economy",
            "label": "Economy",
            "reason": "public",
            "value": 4,
          },
        ],
      }
    `);
    expect(JSON.stringify(sanitized)).not.toMatch(
      /runner-session-secret|privatePayload|FullState|hidden-deck-card|decklist/i,
    );
  });

  it("does not mutate real game state hash while building belief state and choosing actions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v142-statehash-isolation" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const beforeHash = hashState(state);

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const afterHash = hashState(state);

    expect(belief.version).toMatch(/^belief-v1\.4\.2:/);
    expect(
      input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    expect(beforeHash).toBe(afterHash);
  });
});

describe("V1.4.3 simulation, selfplay and exploit regression", () => {
  it("provides versioned benchmark profiles and exploit fixtures", () => {
    const profiles = listV143BenchmarkProfiles();
    const fixtures = listV143ExploitFixtures();

    expect(profiles.map((profile) => profile.benchmarkProfileId)).toEqual([
      "random_legal_bot",
      "basic_corp_ai",
      "basic_runner_ai",
      "plan_corp_v1_4_0",
      "plan_runner_v1_4_1",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]);
    expect(fixtures.map((fixture) => fixture.fixtureId)).toEqual([
      "v143-rnd-repeat-access-freshness",
      "v143-visible-etr-blocker-no-repeat-run",
    ]);
    expect(fixtures.every((fixture) => fixture.hiddenInfoSafe)).toBe(true);
  });

  it("defines a manual optional selfplay exploit league without widening AI inputs", () => {
    const config = selfplayExploitLeagueData as {
      schemaVersion: string;
      status: string;
      seedSets: {
        smoke: { seeds: string[]; holdoutIncluded: boolean };
        tuning: { seeds: string[]; holdoutIncluded: boolean };
        holdout: { seeds: string[]; holdoutIncluded: boolean };
      };
      deckProfiles: Array<{
        deckProfileId: string;
        executionSupport: string;
        runnerDeckId?: string;
        corpDeckId?: string;
        runnerSnapshotId?: string;
        corpSnapshotId?: string;
      }>;
      leagueProfiles: Array<{
        profileId: string;
        executionMode: string;
        automaticDefault: boolean;
        runtimeMeasurement?: {
          elapsedMs: number;
          games: number;
          illegalActions: number;
          replayFailures: number;
          timeouts: number;
        };
      }>;
      exploitClasses: Array<{
        classId: string;
        fixtureStatus: string;
        fixtureRefs?: string[];
        suggestedActivityId?: string;
      }>;
      reportSchema: {
        sections: Array<{ sectionId: string; regressionClass: string }>;
      };
      noCheatGate: {
        allowedDecisionInputs: string[];
        forbiddenDecisionInputs: string[];
        evidence: string[];
      };
      publicLeague: boolean;
      strategyFixesIncluded: boolean;
      standardTestGate: boolean;
    };

    expect(config.schemaVersion).toBe("ai-selfplay-exploit-league-v1");
    expect(config.status).toBe("manual_optional");
    expect(config.publicLeague).toBe(false);
    expect(config.strategyFixesIncluded).toBe(false);
    expect(config.standardTestGate).toBe(false);

    const tuningSeeds = new Set(config.seedSets.tuning.seeds);
    expect(config.seedSets.smoke.seeds.length).toBeGreaterThanOrEqual(3);
    expect(
      config.seedSets.holdout.seeds.every((seed) => !tuningSeeds.has(seed)),
    ).toBe(true);

    expect(config.deckProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          deckProfileId: "starter-v08",
          executionSupport: "runtime_deck_ids",
          runnerDeckId: "demo_runner_008",
          corpDeckId: "demo_corp_008",
        }),
        expect.objectContaining({
          executionSupport: "inventory_only",
          runnerSnapshotId: "onr_origin_runner_ai_snapshot_v1",
          corpSnapshotId: "onr_origin_corp_ai_snapshot_v1",
        }),
      ]),
    );

    const manualTuning = config.leagueProfiles.find(
      (profile) => profile.profileId === "starter-v08-tuning-manual",
    );
    expect(manualTuning).toMatchObject({
      executionMode: "manual_optional",
      automaticDefault: false,
    });
    expect(manualTuning?.runtimeMeasurement).toMatchObject({
      games: 42,
      illegalActions: 0,
      replayFailures: 0,
      timeouts: 0,
    });
    expect(manualTuning?.runtimeMeasurement?.elapsedMs).toBeGreaterThan(10000);

    expect(config.exploitClasses.map((entry) => entry.classId)).toEqual(
      expect.arrayContaining([
        "action_limit_stagnation",
        "stale_central_repeat_access",
        "unprofitable_visible_etr_run",
        "naked_agenda_install",
        "missing_breaker_preparation",
      ]),
    );
    expect(
      config.exploitClasses.filter((entry) =>
        [
          "implemented_fixture",
          "league_metric",
          "followup_activity_required",
        ].includes(entry.fixtureStatus),
      ).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      config.exploitClasses
        .filter((entry) => entry.fixtureStatus === "followup_activity_required")
        .every((entry) => entry.suggestedActivityId),
    ).toBe(true);

    expect(
      config.reportSchema.sections.map((section) => section.sectionId),
    ).toEqual(["safety", "progression", "exploit", "variance", "runtime"]);
    expect(
      config.reportSchema.sections.map((section) => section.regressionClass),
    ).toEqual(
      expect.arrayContaining([
        "safety_regression",
        "progression_regression",
        "decision_regression",
        "expected_variance",
        "runtime_flakiness",
      ]),
    );

    expect(config.noCheatGate.allowedDecisionInputs).toEqual([
      "PlayerView",
      "LegalActions",
      "side_safe_public_events",
      "explicit_public_deck_metadata",
    ]);
    expect(config.noCheatGate.forbiddenDecisionInputs).toEqual(
      expect.arrayContaining([
        "FullState",
        "opponent_hidden_zones",
        "cardInstances",
        "privatePayload",
        "decklists",
      ]),
    );
    expect(config.noCheatGate.evidence.join(" ")).toContain(
      "buildAiDecisionInput",
    );
  });

  it("builds a redaction-safe belief simulation world", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v143-belief-world" }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    });
    const world = createBeliefSimulationWorld(input, "v143-world-seed");

    expect(world.sourceBeliefVersion).toMatch(/^belief-v1\.4\.2:/);
    expect(world.worldId).toContain("simworld:runner");
    expect(world.seed).toBe("v143-world-seed");
    expect(world.redactionSafe).toBe(true);
    expect(JSON.stringify(world)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("keeps simulation deterministic by simulation RNG and isolated from real match state", () => {
    const state = createGameAfterSetup({ seed: "ai-v143-isolation-source" });
    const beforeHash = hashState(state);
    const beforeEvents = state.eventLog.length;

    const first = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-a",
    });
    const second = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-a",
    });
    const otherRng = simulateAiGame({
      seed: "ai-v143-rng-deterministic",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 70,
      runnerControllerMode: "random_legal_bot",
      corpControllerMode: "random_legal_bot",
      simulationRngSeed: "v143-rng-b",
    });

    expect(first.errors).toEqual([]);
    expect(first.replayOk).toBe(true);
    expect(first.actionSequence).toEqual(second.actionSequence);
    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(
      first.actionSequence.map((entry) => entry.stateHashAfter),
    ).not.toEqual(otherRng.actionSequence.map((entry) => entry.stateHashAfter));
    expect(hashState(state)).toBe(beforeHash);
    expect(state.eventLog.length).toBe(beforeEvents);
  });

  it("runs a local V1.4.3 league with holdout separation and metrics", () => {
    const league = runV143SimulationLeague({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 50,
    });

    expect(league.version).toBe("1.4.3");
    expect(league.tuningSeeds.length).toBeGreaterThan(0);
    expect(league.holdoutSeeds.length).toBeGreaterThan(0);
    expect(league.profiles.length).toBe(7);
    expect(
      league.profiles.every(
        (profile) => profile.games === league.tuningSeeds.length,
      ),
    ).toBe(true);
    expect(
      league.profiles.every((profile) => profile.illegalActions === 0),
    ).toBe(true);
    expect(
      league.profiles.every((profile) => profile.replayFailures === 0),
    ).toBe(true);
    expect(JSON.stringify(league)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("compares doctrine quality metrics between baseline and current candidate", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 30,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });

    expect(benchmark.version).toBe("ai-deck-doctrine-quality-v1");
    expect(benchmark.baselineProfile).toBe("belief_ai_v1_4_2");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.seeds.length).toBeGreaterThan(0);
    expect(benchmark.baselineRun.games).toBe(benchmark.seeds.length);
    expect(benchmark.candidateRun.games).toBe(benchmark.seeds.length);
    expect(benchmark.delta.nakedAgendaInstalls).toBe(
      benchmark.candidate.nakedAgendaInstalls -
        benchmark.baseline.nakedAgendaInstalls,
    );
    expect(benchmark.safety.illegalActionDelta).toBe(
      benchmark.candidateRun.illegalActions -
        benchmark.baselineRun.illegalActions,
    );
    expect(JSON.stringify(benchmark)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("formats doctrine quality benchmark reports with gate interpretation", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const gate = evaluateDoctrineQualityGate(benchmark);
    const report = formatDoctrineQualityBenchmarkReport(benchmark, gate);

    expect(report).toContain("# AI Deck Doctrine Quality Benchmark Report");
    expect(report).toContain("| nakedAgendaInstalls |");
    expect(report).toContain("## Safety Delta");
    expect(report).toContain(`Gate: ${gate.accepted ? "PASS" : "FAIL"}`);
    expect(gate.thresholds.maxCandidateIllegalActions).toBe(0);
    expect(JSON.stringify({ gate, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("reports match progression metrics alongside safety signals", () => {
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const report = formatMatchProgressionBenchmarkReport(benchmark);

    expect(benchmark.version).toBe("ai-match-progression-v1");
    expect(benchmark.diagnosticOnly).toBe(true);
    expect(benchmark.baselineProfile).toBe("belief_ai_v1_4_2");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.runnerDeckId).toBe("demo_runner_008");
    expect(benchmark.corpDeckId).toBe("demo_corp_008");
    expect(benchmark.maxActions).toBe(20);
    expect(benchmark.seeds.length).toBeGreaterThan(0);
    expect(benchmark.baseline.games).toBe(benchmark.seeds.length);
    expect(benchmark.candidate.games).toBe(benchmark.seeds.length);
    expect(benchmark.baseline.actionLimitRate).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.actionLimitRate).toBeLessThanOrEqual(1);
    expect(benchmark.delta.actionLimitRate).toBe(
      benchmark.candidate.actionLimitRate - benchmark.baseline.actionLimitRate,
    );
    expect(benchmark.candidate.averageTurns).toBeGreaterThanOrEqual(0);
    expect(
      benchmark.candidate.scoreOrStealActionsPerMatch,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.profileComparisons.map((entry) => entry.profile)).toEqual([
      "basic_corp_ai",
      "basic_runner_ai",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]);
    expect(
      benchmark.candidate.centralPressureRuns +
        benchmark.candidate.remotePressureRuns,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.illegalActions).toBe(0);
    expect(benchmark.candidate.replayFailures).toBe(0);
    expect(report).toContain("# AI Match Progression Benchmark Report");
    expect(report).toContain("## Progression Metrics");
    expect(report).toContain("successfulCentralRuns");
    expect(report).toContain("scoringRemoteDevelopmentActions");
    expect(report).toContain("## Profile Comparison");
    expect(report).toContain("## Safety Metrics");
    expect(report).toContain("Gate: diagnostic_only");
    expect(JSON.stringify({ benchmark, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("loads benchmark snapshot decks through the adapter without using demo deck ids", () => {
    const runner = benchmarkDeckFromSnapshot(
      "onr_origin_runner_ai_snapshot_v1",
    );
    const corp = benchmarkDeckFromSnapshot("onr_origin_corp_ai_snapshot_v1");

    expect(runner.deck.id).toBe("onr_origin_runner_ai_snapshot_v1");
    expect(runner.deck.side).toBe("runner");
    expect(runner.metadata.deckName).toBe("Runner Origins AI - Probe Pressure");
    expect(corp.deck.id).toBe("onr_origin_corp_ai_snapshot_v1");
    expect(corp.deck.side).toBe("corp");
    expect(corp.metadata.deckName).toBe("Corp Origins AI - Tax & Punish");
    expect(runner.deck.id).not.toBe("demo_runner_008");
    expect(corp.deck.id).not.toBe("demo_corp_008");
  });

  it("loads frozen local realistic holdout snapshots without reading Deck-Editor storage", () => {
    const runner = benchmarkDeckFromFrozenLocalSnapshot(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    const corp = benchmarkDeckFromFrozenLocalSnapshot(
      "local_realistic_corp_ivory_bastion_snapshot_v1",
    );

    expect(runner.deck.id).toBe(
      "local_realistic_runner_blink_pressure_rig_snapshot_v1",
    );
    expect(runner.sourceDeckId).toBe("local_runner_blink_pressure_rig");
    expect(runner.deck.name).toBe("Blink Pressure Rig");
    expect(runner.deck.side).toBe("runner");
    expect(runner.metadata.deckHash).toBe("fnv1a:39d02d0b");
    expect(corp.deck.id).toBe("local_realistic_corp_ivory_bastion_snapshot_v1");
    expect(corp.sourceDeckId).toBe("local_corp_ivory_bastion");
    expect(corp.deck.name).toBe("Ivory Bastion");
    expect(corp.deck.side).toBe("corp");
    expect(corp.metadata.deckHash).toBe("fnv1a:c5c32339");
    expect(runner.deck.id).not.toBe("demo_runner_008");
    expect(corp.deck.id).not.toBe("demo_corp_008");
    expect(runner.metadata).not.toHaveProperty("cards");
    expect(corp.metadata).not.toHaveProperty("cards");
  });

  it("loads local Deck-Editor decks through the benchmark adapter without demo fallback", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "netgrid-local-deck-"));
    try {
      writeFileSync(
        path.join(tempDir, "local_runner_adapter_fixture.json"),
        `${JSON.stringify(
          {
            schemaVersion: "netgrid-editable-deck-v1",
            deck: {
              deckId: "local_runner_adapter_fixture",
              deckVersion: "1.3.0-test",
              name: "Local Runner Adapter Fixture",
              side: "runner",
              identityCardId: "runner_identity_001",
              cardPoolSnapshotId: "card-snapshot-0.8",
              cardPoolVersion: "private-local-onr-v1",
              formatProfileId: "netgrid_private_local_v1",
              formatProfileVersion: "1.3.0",
              validationStatus: "valid",
              cards: [
                { cardId: "onr_v1_021_dwarf", quantity: 1 },
                { cardId: "onr_v1_039_krash", quantity: 1 },
                { cardId: "onr_v1_066_snowball", quantity: 1 },
                { cardId: "onr_v1_074_worm", quantity: 1 },
                { cardId: "onr_v1_081_custodial-position", quantity: 1 },
                { cardId: "onr_v1_085_executive-wiretaps", quantity: 1 },
                { cardId: "onr_v1_095_jack-n-joe", quantity: 1 },
                { cardId: "onr_v1_097_livewires-contacts", quantity: 1 },
                { cardId: "onr_v1_101_mit-west-tier", quantity: 1 },
                { cardId: "onr_v1_108_score", quantity: 1 },
                { cardId: "onr_v1_144_tycho-mem-chip", quantity: 1 },
                { cardId: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
              ],
              createdAt: "2026-05-23T12:00:00.000Z",
              updatedAt: "2026-05-23T12:00:00.000Z",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const loaded = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local_runner_adapter_fixture",
        expectedName: "Local Runner Adapter Fixture",
        fileName: "local_runner_adapter_fixture.json",
        baseDir: tempDir,
      });

      expect(loaded.ok).toBe(true);
      if (loaded.ok !== true) throw new Error(loaded.reason);
      expect(loaded.classification).toBe("runnable_ai_benchmark");
      expect(loaded.deck.id).toBe(
        "local_runner_adapter_fixture_local_benchmark_snapshot_v1",
      );
      expect(loaded.deck.id).not.toBe("demo_runner_008");
      expect(loaded.metadata.deckName).toBe("Local Runner Adapter Fixture");
      expect(loaded.metadata).not.toHaveProperty("cards");
      expect(loaded.missingCards).toEqual([]);
      expect(loaded.unsupportedCards).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("blocks local Deck-Editor benchmark decks with unsupported cards explicitly", () => {
    const tempDir = mkdtempSync(
      path.join(tmpdir(), "netgrid-local-deck-blocked-"),
    );
    try {
      writeFileSync(
        path.join(tempDir, "local_runner_blocked_fixture.json"),
        `${JSON.stringify(
          {
            schemaVersion: "netgrid-editable-deck-v1",
            deck: {
              deckId: "local_runner_blocked_fixture",
              deckVersion: "1.3.0-test",
              name: "Local Runner Blocked Fixture",
              side: "runner",
              identityCardId: "runner_identity_001",
              cardPoolSnapshotId: "card-snapshot-0.8",
              cardPoolVersion: "private-local-onr-v1",
              formatProfileId: "netgrid_private_local_v1",
              formatProfileVersion: "1.3.0",
              validationStatus: "invalid",
              cards: [{ cardId: "catalog_preview_resource_001", quantity: 1 }],
              createdAt: "2026-05-23T12:00:00.000Z",
              updatedAt: "2026-05-23T12:00:00.000Z",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const blocked = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local_runner_blocked_fixture",
        expectedName: "Local Runner Blocked Fixture",
        fileName: "local_runner_blocked_fixture.json",
        baseDir: tempDir,
      });

      expect(blocked.ok).toBe(false);
      if (blocked.ok !== false)
        throw new Error("blocked fixture unexpectedly loaded");
      expect(blocked.classification).toBe("blocked_by_unsupported_cards");
      expect(blocked.unsupportedCards).toContain(
        "catalog_preview_resource_001",
      );
      expect(blocked.reason).toContain("unsupported_cards");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs a snapshot match progression smoke without falling back to demo decks", () => {
    const runner = benchmarkDeckFromSnapshot(
      "onr_origin_runner_ai_snapshot_v1",
    );
    const corp = benchmarkDeckFromSnapshot("onr_origin_corp_ai_snapshot_v1");
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      runnerDeck: runner.deck,
      corpDeck: corp.deck,
      runnerDeckMetadata: runner.metadata,
      corpDeckMetadata: corp.metadata,
      maxActions: 12,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
      comparisonProfiles: ["belief_ai_v1_4_2", "current_candidate"],
    });

    expect(benchmark.runnerDeckId).toBe("onr_origin_runner_ai_snapshot_v1");
    expect(benchmark.corpDeckId).toBe("onr_origin_corp_ai_snapshot_v1");
    expect(benchmark.runnerDeckId).not.toBe("demo_runner_008");
    expect(benchmark.corpDeckId).not.toBe("demo_corp_008");
    expect(benchmark.candidate.games).toBeGreaterThan(0);
    expect(benchmark.candidate.illegalActions).toBe(0);
    expect(benchmark.candidate.replayFailures).toBe(0);
  }, 30_000);

  it("reports a deck-separated match progression suite with pending real-scene slots", () => {
    const suite = runMatchProgressionBenchmarkSuite({
      includeHoldout: false,
      maxActions: 10,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
      comparisonProfiles: [
        "basic_corp_ai",
        "belief_ai_v1_4_2",
        "current_candidate",
      ],
    });
    const report = formatMatchProgressionBenchmarkSuiteReport(suite);
    const slots = listMatchProgressionBenchmarkDeckSlots();
    const smoke = suite.slots.find(
      (slot) => slot.slotId === "safety_smoke_demo_008",
    );
    const snapshot = suite.slots.find(
      (slot) => slot.slotId === "progression_tuning_origin_rig_vs_tax",
    );
    const localRealisticSlots = suite.slots.filter(
      (slot) => slot.slotType === "local_realistic_holdout",
    );
    const realSceneSlots = suite.slots.filter(
      (slot) => slot.slotType === "real_scene_holdout",
    );

    expect(slots.some((slot) => slot.slotType === "smoke")).toBe(true);
    expect(
      slots.filter((slot) => slot.slotType === "snapshot_tuning"),
    ).toHaveLength(2);
    expect(
      slots.filter((slot) => slot.slotType === "local_realistic_holdout"),
    ).toHaveLength(2);
    expect(smoke?.status).toBe("runnable");
    expect(smoke?.runnerDeckRef).toBe("demo_runner_008");
    expect(snapshot?.status).toBe("runnable");
    expect(snapshot?.benchmark?.runnerDeckId).toBe(
      "onr_origin_runner_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.corpDeckId).toBe(
      "onr_origin_corp_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
    expect(snapshot?.benchmark?.candidate.illegalActions).toBe(0);
    expect(snapshot?.benchmark?.candidate.replayFailures).toBe(0);
    expect(localRealisticSlots).toHaveLength(2);
    expect(
      localRealisticSlots.every((slot) => slot.status === "runnable"),
    ).toBe(true);
    expect(
      localRealisticSlots.every(
        (slot) => !slot.runnerDeckRef.includes("demo_008"),
      ),
    ).toBe(true);
    for (const slot of localRealisticSlots) {
      expect(slot.runnerDeckRef).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.corpDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(realSceneSlots).toHaveLength(2);
    expect(realSceneSlots.every((slot) => slot.status === "runnable")).toBe(
      true,
    );
    expect(
      realSceneSlots.every((slot) => !slot.runnerDeckRef.includes("demo_008")),
    ).toBe(true);
    for (const slot of realSceneSlots) {
      expect(slot.benchmark?.runnerDeckId).toContain("real_scene_");
      expect(slot.benchmark?.corpDeckId).toContain("real_scene_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(report).toContain("## Demo Smoke");
    expect(report).toContain("## Snapshot Progression");
    expect(report).toContain("## Local Realistic Holdout");
    expect(report).toContain("## Real Scene Holdout");
    expect(report).toContain("remoteBuildActions");
    expect(JSON.stringify({ suite, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 45_000);

  it("summarizes expanded match progression metrics from redaction-safe action traces", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "progression-metric-fixture",
        winner: "corp",
        actions: 14,
        turns: 4,
        finalAgendaPoints: { runner: 2, corp: 3 },
        finalStateHash: "fnv1a:progression",
        eventLogLength: 11,
        replayOk: true,
        replayErrors: [],
        actionSequence: [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerRemoteRunOpportunityAgainstAdvancedRemote: true,
            runnerSkippedAdvancedRemoteContest: true,
            runnerCentralRunWhileRemoteScoreThreatVisible: true,
            runnerCreditsBefore: 3,
            runnerCreditsAfter: 3,
            runnerCreditDelta: 0,
            runnerReserveTarget: 5,
            runnerBelowReserveBefore: true,
            runnerRunStartedBelowReserve: true,
            runnerCentralRunStartedBelowReserve: true,
            runnerContestBlockedByCredits: true,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunBurnedRemoteContestReserve: true,
            runnerRemoteContestBlockedByCredits: true,
            runKnownPathCostAtStart: 4,
            runCreditsAfterKnownPathEstimate: -1,
            runCreditsMissingForKnownPath: 1,
            runStartedAgainstKnownUnaffordablePath: true,
            centralRunStartedAgainstKnownUnaffordablePath: true,
            runnerRunStartedAgainstKnownUnpayableFullPath: true,
            runnerRunStartedAgainstKnownUnpayableCentralPath: true,
            runnerKnownPathCanReachAccessFalse: true,
            runnerKnownPathCanBreakNextIceButNotFullPath: true,
            runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: true,
            runnerRunCostQuoteUnderestimatedFullPath: true,
            runnerRepeatRunOnKnownUnpayablePath: true,
            runnerRunPenalizedAsKnownNoAccess: true,
            lowValueUnaffordableRun: true,
          }),
          progressionAction("runner", 2, "draw_card", undefined, 1, {
            runnerDrawAction: true,
            runnerClickDrawAction: true,
            runnerDrawWhileHoldingPlayableEconomy: true,
            runnerHandUseOpportunity: true,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 3, "resolve_choice", undefined, 1, {
            runnerDiscardChoice: true,
            runnerDiscardedPlayableEconomy: true,
          }),
          progressionAction("runner", 4, "install_card", undefined, 1, {
            runnerInstallAction: true,
            runnerDuplicateInstallAction: true,
            runnerLowValueDuplicateInstallAction: true,
            runnerJunkyardBbsDuplicateInstall: true,
            runnerRigInstallAction: true,
            runnerHandUseOpportunity: true,
            runnerHandUseActionTaken: true,
            runnerCreditsBefore: 5,
            runnerCreditsAfter: 1,
            runnerCreditDelta: -4,
            runnerReserveTarget: 5,
            runnerBelowReserveAfter: true,
            runnerSpendBelowReserve: true,
            runnerLowValueSpendBelowReserve: true,
            runnerExpensiveInstallBelowReserve: true,
          }),
          progressionAction("runner", 5, "access_card", undefined, 1),
          progressionAction("corp", 3, "install_card", "remote_1", 2, {
            installPlacement: "root",
            targetCardType: "agenda",
          }),
          progressionAction("corp", 4, "install_card", "remote_1", 2, {
            installPlacement: "ice",
            protectBeforeAdvance: true,
          }),
          progressionAction("corp", 5, "advance_card", "remote_1", 2, {
            targetCardType: "agenda",
            advancementTargetTypes: ["agenda"],
            finalAdvance: true,
            unsafeFinalAdvance: true,
            remoteProtectionScore: 40,
            runnerContestRisk: "high",
            advancesRemainingAfterAction: 1,
          }),
          progressionAction("runner", 6, "start_run", "remote_1", 3, {
            runnerRemoteRunOpportunityAgainstAdvancedRemote: true,
            runnerRemoteRunAgainstAdvancedRemote: true,
            runnerRemoteContestCreditReserveAfterRun: 4,
            runnerAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
            runnerContestedAdvancedRemoteServerId: "remote_1",
            runnerRemoteRunStartedWithSufficientPostRunReserve: true,
          }),
          progressionAction("corp", 7, "rez_ice", "remote_1", 3, {
            timingPoint: "run.approach_ice",
          }),
          progressionAction("runner", 8, "trash_accessed_card", undefined, 3, {
            runnerRemoteTrashOpportunity: true,
            runnerRemoteTrashTaken: true,
            runnerRemoteAccessWithTrashableCard: true,
            runnerRemoteAccessWithRelevantTrashableCard: true,
            runnerAffordableRelevantRemoteTrashOpportunity: true,
            runnerRelevantRemoteTrashTaken: true,
            runnerRemoteTrashTargetType: "asset_node",
            runnerRemoteTrashRole: "economy",
            runnerRemoteTrashCost: 4,
            runnerExpensiveRemoteTrashOpportunity: true,
            runnerExpensiveRemoteTrashTaken: true,
            runnerHighImpactRemoteTrashTaken: true,
            runnerCreditsAfterRemoteTrash: 5,
            runnerRemoteTrashPreservedReserve: true,
            runnerRemoteTrashProtectedScoreThreat: true,
            runnerRemoteTrashCostBucket: "4_5",
            dedicatedTrashCreditsUsed: 1,
            generalCreditsSpentOnTrash: 3,
            runnerHandUseOpportunity: true,
            runnerHandUseActionTaken: true,
          }),
          progressionAction("runner", 9, "steal_agenda", undefined, 3, {
            advancedAgendaStolen: true,
            advancedAgendaStealSource: "remote",
          }),
          progressionAction("corp", 10, "resolve_choice", "remote_1", 4, {
            advancementCountersAdded: 2,
            advancementTargetTypes: ["agenda"],
            scoreActionsAvailable: 1,
          }),
          progressionAction("corp", 11, "score_agenda", "remote_1", 4, {
            scoreActionsAvailable: 1,
            targetCardType: "agenda",
          }),
        ],
        errors: [],
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: {
          illegalActions: 0,
          fallbackRate: 0,
          timeoutRate: 0,
          reasonCodeCoverage: [],
          actionTypeCoverage: [],
          roleCoverage: [],
          progressScore: 20,
          holdout: false,
          doctrine: {
            nakedAgendaInstalls: 0,
            agendaFloodExposure: 0,
            scoreWindowMissed: 0,
            remoteOverbuild: 0,
            economyStall: 0,
            repeatedLowValueCentralRun: 0,
            rigStall: 0,
            assetTrashNeglect: 0,
          },
        },
      },
    ]);

    expect(metrics).toMatchObject({
      games: 1,
      actionLimitRate: 0,
      averageActions: 14,
      averageTurns: 4,
      runnerSteals: 1,
      corpScores: 1,
      scoreActionsAvailable: 2,
      scoreActionsTaken: 1,
      missedScoreWindows: 1,
      scoreActionTakeRate: 0.5,
      scoreOrStealActions: 2,
      scoreOrStealActionsPerMatch: 2,
      advancedAgendaSteals: 1,
      advancedAgendaStealsFromRemote: 1,
      advancedAgendaStealsFromCentral: 0,
      finalAdvanceActions: 1,
      unsafeFinalAdvanceActions: 1,
      protectedFinalAdvanceActions: 0,
      protectBeforeAdvanceActions: 1,
      advanceThenScoreSameTurn: 0,
      advanceThenRunnerStealBeforeNextCorpScore: 1,
      remoteProtectionScoreAtFinalAdvance: 40,
      runnerContestRiskAtFinalAdvance: 1,
      centralPressureRuns: 1,
      remotePressureRuns: 1,
      successfulCentralRuns: 1,
      successfulRemoteRuns: 2,
      successfulRemoteAccesses: 2,
      remoteTrashActions: 1,
      remoteAccessesWithTrashableCards: 1,
      remoteAccessesWithRelevantTrashableCards: 1,
      affordableRelevantRemoteTrashOpportunities: 1,
      relevantRemoteTrashTaken: 1,
      relevantRemoteTrashTakeRate: 1,
      skippedAffordableRelevantRemoteTrash: 0,
      remoteTrashTargetsAssetNode: 1,
      remoteTrashTargetsUpgrade: 0,
      remoteTrashTargetsIce: 0,
      remoteTrashTargetsUnknown: 0,
      remoteTrashRoleEconomy: 1,
      remoteTrashRoleScoringProtection: 0,
      remoteTrashRoleRunTax: 0,
      remoteTrashRoleRemoteCapacity: 0,
      remoteTrashRoleTagPunish: 0,
      remoteTrashRoleAmbush: 0,
      remoteTrashRoleLowValue: 0,
      remoteTrashCostTotal: 4,
      expensiveRemoteTrashOpportunities: 1,
      expensiveRemoteTrashTaken: 1,
      highImpactRemoteTrashTaken: 1,
      runnerCreditsAfterRemoteTrash: 5,
      remoteTrashPreservedReserve: 1,
      remoteTrashProtectedScoreThreat: 1,
      remoteTrashCostBucket4To5: 1,
      dedicatedTrashCreditsUsed: 1,
      generalCreditsSpentOnTrash: 3,
      remoteRunOpportunitiesAgainstAdvancedRemote: 2,
      remoteRunsAgainstAdvancedRemote: 1,
      skippedAdvancedRemoteContest: 1,
      centralRunWhileRemoteScoreThreatVisible: 1,
      remoteContestCreditReserveAfterRun: 4,
      remoteContestActions: 2,
      remoteInstalls: 2,
      remoteRootInstalls: 1,
      remoteIceInstalls: 1,
      remoteAdvances: 2,
      advancedAgendaInstalledInRemote: 2,
      advancementActionsOnAgendas: 2,
      advancementActionsOnAssets: 0,
      advancementActionsOnUpgrades: 0,
      advancementActionsOnUnknown: 0,
      remoteBuildActions: 3,
      remoteAdvanceActions: 2,
      scoreWindowActions: 1,
      scoringRemoteDevelopmentActions: 5,
      rezIceDuringRun: 1,
      turnsToFirstCorpScore: 4,
      turnsToFirstAgendaSteal: 3,
      turnsFromFirstAdvanceToScore: 2,
      turnsFromFinalAdvanceToScoreOrSteal: 1,
      runnerDrawActions: 1,
      runnerDrawActionShare: 0.125,
      clickDrawActions: 1,
      cardEffectDrawActions: 0,
      drawWhileHoldingPlayableEconomy: 1,
      drawWhileHoldingInstallableBreaker: 0,
      drawWhileHoldingRunnablePressureCard: 0,
      drawWhileRemoteTrashAvailable: 0,
      drawThenDiscardSameTurn: 1,
      discardedPlayableEconomy: 1,
      discardedInstallableBreaker: 0,
      discardedRunPressureCard: 0,
      runnerInstallActions: 1,
      runnerDuplicateInstallActions: 1,
      runnerLowValueDuplicateInstallActions: 1,
      runnerJunkyardBbsDuplicateInstalls: 1,
      runnerEconomyActionsTaken: 0,
      runnerRigInstallActions: 1,
      runnerRemoteTrashOpportunities: 1,
      runnerRemoteTrashTaken: 1,
      handUseRate: 0.667,
      runnerAverageCredits: 4,
      runnerMedianCredits: 4,
      runnerEndTurnAverageCredits: 0,
      runnerEndTurnCreditsBelowReserve: 0,
      runnerCreditReserveTargetAverage: 5,
      runnerTurnsBelowContestReserve: 1,
      runnerEconomyCreditsGained: 0,
      runnerEconomyCreditsSpent: 0,
      runnerNetCreditDeltaPerTurn: -1,
      runnerRunsStartedBelowReserve: 1,
      runnerRemoteRunsStartedBelowReserve: 0,
      runnerCentralRunsStartedBelowReserve: 1,
      runnerContestBlockedByCredits: 1,
      runnerTrashBlockedByCredits: 0,
      runnerStealBlockedByCredits: 0,
      runnerSpendBelowReserveActions: 1,
      runnerLowValueSpendBelowReserve: 1,
      runnerExpensiveInstallBelowReserve: 1,
      runnerReservePreservingEconomyActions: 0,
      runsStartedAgainstKnownUnaffordablePath: 1,
      remoteRunsStartedAgainstKnownUnaffordablePath: 0,
      centralRunsStartedAgainstKnownUnaffordablePath: 1,
      runnerRunStartedAgainstKnownUnpayableFullPath: 1,
      runnerRunStartedAgainstKnownUnpayableRemotePath: 0,
      runnerRunStartedAgainstKnownUnpayableCentralPath: 1,
      runnerKnownPathCanReachAccessFalse: 1,
      runnerKnownPathCanBreakNextIceButNotFullPath: 1,
      runnerRunSpentCreditsBeforeKnownUnbreakableLaterIce: 1,
      runnerRunCostQuoteUnderestimatedFullPath: 1,
      runnerRepeatRunOnKnownUnpayablePath: 1,
      runnerRunPenalizedAsKnownNoAccess: 1,
      runsEndedAfterFirstIceDueToCredits: 0,
      creditsMissingForKnownPath: 1,
      knownPathCostAtRunStart: 4,
      creditsAfterKnownPathEstimate: -1,
      runStartedWithInsufficientStealOrTrashReserve: 0,
      probeRunsWithPositiveInfoValue: 0,
      lowValueUnaffordableRuns: 1,
      uniqueAdvancedRemoteThreats: 2,
      contestableAdvancedRemoteThreats: 2,
      advancedRemoteThreatsContested: 1,
      advancedRemoteThreatContestRate: 0.5,
      skippedContestableAdvancedRemoteThreats: 1,
      centralRunInsteadOfContestableAdvancedRemote: 1,
      centralRunInsteadWasJustified: 0,
      centralRunBurnedRemoteContestReserve: 1,
      remoteContestBlockedByCredits: 1,
      remoteContestBlockedByPostRunReserve: 0,
      remoteContestBlockedByBreakerCoverage: 0,
      remoteContestBlockedByKnownIceCost: 0,
      remoteContestDeclinedAsBaitOrLowValue: 0,
      repeatedCentralRunsWhileSameRemoteThreat: 0,
      remoteRunStartedWithInsufficientPostRunReserve: 0,
      remoteRunStartedWithSufficientPostRunReserve: 1,
      turnsFromRemoteThreatCreatedToContest: 2,
      turnsFromRemoteThreatCreatedToScoreOrSteal: 2.5,
    });
  });

  it("summarizes Runner economy decision windows, skips, and fix gates", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "play_event", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalBurstEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerEconomyActionTaken: true,
            runnerLowCreditDecisionWindow: true,
            runnerCreditStarvedWithLegalEconomy: true,
            runnerCreditStarvedEconomyTaken: true,
            runnerEconomyTakenToReachRunReserve: true,
            runnerEconomyChosenAsReserveSetup: true,
            runnerEconomyChoicePlausible: true,
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerEconomySkipped: true,
            runnerEconomySkippedWhileLowCredits: true,
            runnerEconomySkippedWhileKnownUnaffordablePath: true,
            runnerEconomySkippedForRun: true,
            runnerLowCreditDecisionWindow: true,
            runnerCreditStarvedWithLegalEconomy: true,
            runnerCreditStarvedEconomySkipped: true,
            runnerKnownUnaffordablePathWithLegalEconomy: true,
            runnerEconomySkippedThenUnaffordableRun: true,
            runnerRunStartedBelowKnownPathCost: true,
            runnerRunStartedAfterSkippingEconomy: true,
            runnerEconomyFixGateEligibleStarvedSkip: true,
          }),
          progressionAction("runner", 3, "gain_credit", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalActionEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerEconomyActionTaken: true,
            runnerEconomyChosenWhileRich: true,
            runnerEconomyChosenOverFreshCentralPressure: true,
            runnerEconomyChosenWhilePressureReady: true,
            runnerEconomyChoiceSuspicious: true,
            runnerEconomyFixGateSuspiciousRichEconomy: true,
            runnerEconomyFixGateSuspiciousEconomyOverPressure: true,
          }),
        ],
        "runner-economy-window-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerEconomyDecisionWindows: 3,
      runnerLegalEconomyActions: 3,
      runnerLegalBurstEconomyActions: 1,
      runnerLegalActionEconomyActions: 1,
      runnerEconomyTaken: 2,
      runnerEconomySkipped: 1,
      runnerEconomySkippedWhileLowCredits: 1,
      runnerEconomySkippedWhileKnownUnaffordablePath: 1,
      runnerCreditStarvedWithLegalEconomy: 2,
      runnerCreditStarvedEconomyTaken: 1,
      runnerCreditStarvedEconomySkipped: 1,
      runnerKnownUnaffordablePathWithLegalEconomy: 1,
      runnerEconomyTakenToReachRunReserve: 1,
      runnerEconomySkippedThenUnaffordableRun: 1,
      runnerRunStartedBelowKnownPathCost: 1,
      runnerRunStartedAfterSkippingEconomy: 1,
      runnerEconomyChosenOverFreshCentralPressure: 1,
      runnerEconomyChosenWhileRich: 1,
      runnerEconomyChoicePlausible: 1,
      runnerEconomyChoiceSuspicious: 1,
      runnerEconomyFixGateEligibleStarvedSkip: 1,
      runnerEconomyFixGateSuspiciousRichEconomy: 1,
      runnerEconomyFixGateSuspiciousEconomyOverPressure: 1,
    });
  });

  it("keeps finite, debt, hand-size, memory, and search recovery diagnostics separated", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction(
            "runner",
            1,
            "activated_card_ability",
            undefined,
            1,
            {
              runnerEconomyDecisionWindow: true,
              runnerLegalEconomyActions: 1,
              runnerLegalFinitePoolEconomyActions: 1,
              runnerEconomyTaken: true,
              runnerFinitePoolEconomySeen: true,
              runnerFinitePoolEconomyTaken: true,
            },
          ),
          progressionAction("runner", 2, "install_card", undefined, 1, {
            runnerEconomyDecisionWindow: true,
            runnerLegalEconomyActions: 1,
            runnerLegalLoanDebtEconomyActions: 1,
            runnerLegalResourceEconomyActions: 1,
            runnerEconomyTaken: true,
            runnerDebtEconomySeen: true,
            runnerDebtEconomyTaken: true,
            runnerDebtEconomyTakenWithoutNeed: true,
            runnerEconomyWithDownsideSeen: true,
            runnerEconomyWithDownsideTaken: true,
            runnerDelayedPenaltyEconomyTaken: true,
            runnerEconomyFixGateSuspiciousDebtEconomyWithoutNeed: true,
          }),
          progressionAction("runner", 3, "install_card", undefined, 1, {
            runnerHandSizeBottleneckDecisionWindow: true,
            runnerLegalHandSizeActions: 1,
            runnerHandSizeSupportTaken: true,
            runnerHandSizeFactUsedForDiagnosis: true,
            runnerEconomySetupEvidence: [
              "mram_militech_classified_as_hand_size:true",
            ],
          }),
          progressionAction("runner", 4, "end_turn", undefined, 1, {
            runnerMemoryBottleneckDecisionWindow: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerMemorySupportSkippedWhileGripHasPrograms: true,
            runnerSetupFixGateEligibleMemorySkip: true,
          }),
          progressionAction("runner", 5, "play_event", undefined, 2, {
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
          }),
          progressionAction("runner", 6, "play_event", undefined, 2, {
            runnerLegalRecoveryActions: 1,
            runnerRecoveryTaken: true,
            runnerRecoveryTakenForBreakerCoverage: true,
          }),
          progressionAction("runner", 7, "draw_card", undefined, 2),
          progressionAction("runner", 8, "end_turn", undefined, 2),
        ],
        "runner-setup-classification-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerLegalFinitePoolEconomyActions: 1,
      runnerFinitePoolEconomySeen: 1,
      runnerFinitePoolEconomyTaken: 1,
      runnerFinitePoolEconomyTakenWhilePoolLikelyDepleted: 0,
      runnerLegalLoanDebtEconomyActions: 1,
      runnerDebtEconomySeen: 1,
      runnerDebtEconomyTaken: 1,
      runnerDebtEconomyTakenWithoutNeed: 1,
      runnerEconomyWithDownsideSeen: 1,
      runnerDelayedPenaltyEconomyTaken: 1,
      runnerMemoryBottleneckDecisionWindows: 1,
      runnerHandSizeBottleneckDecisionWindows: 1,
      runnerLegalMemoryHardwareActions: 1,
      runnerLegalHandSizeActions: 1,
      runnerMemoryHardwareTaken: 0,
      runnerHandSizeSupportTaken: 1,
      runnerHandSizeFactUsedForDiagnosis: 1,
      runnerMemorySupportSkippedWhileGripHasPrograms: 1,
      runnerLegalSearchActions: 1,
      runnerLegalRecoveryActions: 1,
      runnerSearchSkippedWhileMissingBreakerCoverage: 1,
      runnerRecoveryTaken: 1,
      runnerRecoveryTakenForBreakerCoverage: 1,
      runnerSearchOrRecoveryWindowWithNoInstallFollowup: 1,
      runnerSetupFixGateEligibleMemorySkip: 1,
      runnerSetupFixGateEligibleSearchRecoverySkip: 1,
    });
  });

  it("keeps Runner economy setup diagnostic evidence side-safe and hidden-state invariant", () => {
    const visibleActions = [
      progressionAction("runner", 1, "play_event", undefined, 1, {
        runnerEconomyDecisionWindow: true,
        runnerLegalEconomyActions: 1,
        runnerEconomyTaken: true,
        runnerEconomySetupClassifications: ["runner_economy_taken"],
        runnerEconomySetupEvidence: [
          "runner_credits:2",
          "runner_reserve_target:5",
          "legal_economy_actions:1",
          "known_unaffordable_path:false",
        ],
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "runner-economy-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "runner-economy-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect(first.runnerEconomyDecisionWindows).toBe(
      second.runnerEconomyDecisionWindows,
    );
    expect(first.runnerEconomyTaken).toBe(second.runnerEconomyTaken);
    expect(JSON.stringify({ visibleActions })).not.toMatch(
      /cardInstances|privatePayload|fullGameState|corp_hq|corp_rd|runner_stack|runner_grip/i,
    );
  });

  it("attributes Runner setup fix gates across starved economy, search recovery, and memory", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForRun: true,
            runStartedAgainstKnownUnaffordablePath: true,
            lowValueUnaffordableRun: true,
          }),
          progressionAction("runner", 2, "draw_card", undefined, 1, {
            runnerDrawAction: true,
          }),
          progressionAction("runner", 3, "start_run", "remote_1", 2, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForRemoteContest: true,
            runnerRemoteRunAgainstAdvancedRemote: true,
          }),
          progressionAction("runner", 4, "draw_card", undefined, 2, {
            runnerEconomyFixGateEligibleStarvedSkip: true,
            runnerEconomySkippedForDraw: true,
            runnerDrawAction: true,
          }),
          progressionAction("runner", 5, "gain_credit", undefined, 2, {
            runnerEconomyTaken: true,
            runnerCreditsAfter: 5,
            runnerReserveTarget: 5,
          }),
          progressionAction("runner", 6, "draw_card", undefined, 3, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalSearchActions: 1,
            runnerSearchSkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["wall"],
            runnerDrawAction: true,
          }),
          progressionAction("runner", 7, "end_turn", undefined, 3),
          progressionAction("runner", 8, "install_card", undefined, 4, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
            runnerLegalRecoveryActions: 1,
            runnerRecoverySkippedWhileMissingBreakerCoverage: true,
            runnerSetupMissingCoverageTypes: ["code_gate", "sentry"],
            runnerRigInstallAction: true,
            runnerCoverageImproved: true,
          }),
          progressionAction("runner", 9, "install_card", undefined, 4, {
            runnerSetupFixGateEligibleMemorySkip: true,
            runnerLegalMemoryHardwareActions: 1,
            runnerMemorySupportSkippedWhileGripHasPrograms: true,
            runnerRigInstallAction: true,
          }),
          progressionAction("runner", 10, "start_run", "hq", 5, {
            runnerSetupFixGateEligibleSearchRecoverySkip: true,
          }),
          progressionAction("runner", 11, "draw_card", undefined, 5, {
            runnerHandSizeSupportSkippedWhileDamageRiskVisible: true,
            runnerDiscardChoice: true,
          }),
        ],
        "runner-setup-attribution-fixture",
      ),
    ]);

    expect(metrics).toMatchObject({
      runnerStarvedEconomySkipWindows: 3,
      runnerStarvedEconomySkipChosenRun: 2,
      runnerStarvedEconomySkipChosenDraw: 1,
      runnerStarvedEconomySkipThenUnaffordableRun: 1,
      runnerStarvedEconomySkipThenFailedRun: 1,
      runnerStarvedEconomySkipThenEconomyNextDecision: 1,
      runnerStarvedEconomySkipThenReserveRecovered: 3,
      runnerStarvedEconomySkipPlausibleRemoteContest: 1,
      runnerStarvedEconomySkipSuspiciousLowValueRun: 1,
      runnerStarvedEconomySkipSuspiciousDraw: 0,
      runnerEconomyFixGateAttributionEligible: 3,
      runnerEconomyFixGateAttributionBlocked: 1,
      runnerEconomyFixGateAttributionSuspicious: 1,
      runnerSearchRecoveryFixGateWindows: 3,
      runnerSearchRecoveryFixGateLegalSearch: 1,
      runnerSearchRecoveryFixGateLegalRecovery: 1,
      runnerSearchRecoveryFixGateMissingWall: 1,
      runnerSearchRecoveryFixGateMissingCodeGate: 1,
      runnerSearchRecoveryFixGateMissingSentry: 1,
      runnerSearchRecoverySkipChosenDraw: 1,
      runnerSearchRecoverySkipChosenInstall: 1,
      runnerSearchRecoverySkipChosenRun: 1,
      runnerSearchRecoverySkipThenCoverageResolved: 1,
      runnerSearchRecoverySkipThenCoverageStillMissing: 2,
      runnerSearchRecoverySkipSuspiciousCoverageStillMissing: 1,
      runnerSearchRecoveryFixGateAttributionEligible: 3,
      runnerSearchRecoveryFixGateAttributionSuspicious: 1,
      runnerMemoryFixGateWindows: 1,
      runnerMemoryFixGateLegalSupport: 1,
      runnerMemoryFixGateSkipped: 1,
      runnerMemorySkipChosenInstallNonMemory: 1,
      runnerMemorySkipThenProgramInstallBlocked: 1,
      runnerMemorySkipSuspiciousRigBlocked: 1,
      runnerMemoryFixGateAttributionEligible: 1,
      runnerMemoryFixGateAttributionSuspicious: 1,
      runnerHandSizeFixGateWindows: 1,
      runnerHandSizeFixGateLegalSupport: 1,
      runnerHandSizeFixGateSkipped: 1,
      runnerHandSizeSkipThenDamageRiskWindow: 1,
      runnerSetupAttributionByKindStarvedEconomy: 3,
      runnerSetupAttributionByKindSearchRecovery: 3,
      runnerSetupAttributionByKindMemory: 1,
      runnerSetupAttributionByKindHandSize: 1,
      runnerSetupAttributionSuspicious: 3,
      runnerSetupRecommendedFixKindMixedNeedsMoreDiagnosis: 1,
    });
  });

  it("keeps Runner setup attribution diagnostics hidden-state invariant and redaction-safe", () => {
    const visibleActions = [
      progressionAction("runner", 1, "draw_card", undefined, 1, {
        runnerSetupFixGateEligibleSearchRecoverySkip: true,
        runnerLegalSearchActions: 1,
        runnerSearchSkippedWhileMissingBreakerCoverage: true,
        runnerSetupMissingCoverageTypes: ["universal", "special"],
        runnerSetupAttributionEvidence: [
          "chosen_action_type:draw_card",
          "chosen_reason_family:draw",
          "missing_coverage_types:universal,special",
        ],
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "runner-setup-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "runner-setup-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect(first.runnerSearchRecoveryFixGateMissingUniversal).toBe(
      second.runnerSearchRecoveryFixGateMissingUniversal,
    );
    expect(first.runnerSearchRecoveryFixGateMissingSpecial).toBe(
      second.runnerSearchRecoveryFixGateMissingSpecial,
    );
    expect(JSON.stringify({ visibleActions })).not.toMatch(
      /cardInstances|privatePayload|fullGameState|corp_hq|corp_rd|runner_stack|runner_grip/i,
    );
  });

  it("summarizes first-class breaker ontology metrics from action evidence", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "install_card", undefined, 1, {
          runnerPathBlockedByMissingCoverage: true,
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:0",
            "structured_matching_grip_breakers:1",
            "structured_heap_matching_breakers:0",
            "coverage_search_actions:0",
            "structured_breaker_cost_profile:true",
            "structured_breaker_install_credits:2",
            "structured_breaker_memory:1",
            "structured_breaker_coverage:wall",
            "structured_breaker_coverage:wall",
            "structured_breaker_side_effect_penalty:12",
            "runner_missing_coverage_resolved_by_ontology:true",
          ],
        }),
        progressionAction("runner", 2, "play_event", undefined, 1, {
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:0",
            "structured_matching_grip_breakers:0",
            "structured_heap_matching_breakers:1",
            "coverage_search_actions:1",
            "runner_search_target_ranked_by_ontology:true",
          ],
        }),
        progressionAction("runner", 3, "draw_card", undefined, 1, {
          evidence: [
            "runner_breaker_ontology_profile_seen:true",
            "runner_breaker_ontology_conflict:true",
            "runner_breaker_ontology_setup_suppressed_pressure_ready:true",
          ],
        }),
        progressionAction("corp", 4, "install_card", "remote_1", 2, {
          evidence: [
            "runner_contest_capacity:high",
            "visible_runner_breaker_ontology_profiles:1",
            "structured_breaker_visible_coverage:wall",
            "structured_breaker_profile_contest_fallback:true",
            "structured_breaker_coverage:wall",
            "structured_breaker_cost:0",
            "structured_breaker_effective_quote_override:true",
            "corp_agenda_install_blocked_by_ontology_cheap_contest:true",
          ],
        }),
        progressionAction("corp", 5, "advance_card", "remote_1", 2, {
          evidence: [
            "runner_contest_capacity:medium",
            "visible_runner_breaker_ontology_profiles:1",
            "structured_breaker_profile_contest_fallback:true",
            "structured_breaker_coverage:sentry",
            "structured_breaker_side_effect_penalty:5",
            "corp_remote_safety_ontology_conflict_with_effective_quote:true",
            "corp_advance_blocked_by_ontology_cheap_contest:true",
          ],
        }),
      ]),
    ]);

    expect(metrics).toMatchObject({
      runnerBreakerOntologyProfilesSeen: 3,
      runnerBreakerOntologyCoverageUsed: 2,
      runnerBreakerOntologyFallbackUsed: 1,
      runnerBreakerOntologyConflict: 1,
      runnerInstallableBreakerRankedByOntology: 1,
      runnerSearchTargetRankedByOntology: 1,
      runnerMissingCoverageResolvedByOntology: 1,
      runnerBreakerOntologySetupSuppressedBecausePressureReady: 1,
      corpVisibleRunnerBreakerOntologyProfilesSeen: 2,
      corpRemoteSafetyUsedRunnerBreakerOntology: 2,
      corpCheapContestDetectedByBreakerOntology: 1,
      corpRemoteSafetyOntologyConflictWithEffectiveQuote: 2,
      corpAgendaInstallBlockedByOntologyCheapContest: 1,
      corpAdvanceBlockedByOntologyCheapContest: 1,
      breakerOntologyCoverageByType: 3,
      breakerOntologyCoverageWall: 2,
      breakerOntologyCoverageSentry: 1,
      breakerOntologySideEffectsSeen: 2,
      breakerOntologyCostProfileSeen: 2,
      breakerOntologyFallbackEvidenceCount: 2,
      breakerOntologyEffectiveQuoteOverrideCount: 1,
    });
  });

  it("does not report breaker ontology metrics for legacy-only evidence", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "install_card", undefined, 1, {
          evidence: [
            "visible_breaker_pressure:true",
            "matching_grip_breakers:1",
            "structured_matching_grip_breakers:0",
          ],
        }),
        progressionAction("corp", 2, "install_card", "remote_1", 1, {
          evidence: [
            "runner_contest_capacity:medium",
            "visible_runner_breaker_ontology_profiles:0",
            "structured_breaker_profile_contest_fallback:false",
          ],
        }),
      ]),
    ]);

    expect(metrics.runnerBreakerOntologyProfilesSeen).toBe(0);
    expect(metrics.runnerBreakerOntologyCoverageUsed).toBe(0);
    expect(metrics.corpVisibleRunnerBreakerOntologyProfilesSeen).toBe(0);
    expect(metrics.corpRemoteSafetyUsedRunnerBreakerOntology).toBe(0);
    expect(metrics.breakerOntologyFallbackEvidenceCount).toBe(0);
  });

  it("keeps breaker ontology metric aggregation hidden-state invariant", () => {
    const visibleActions = [
      progressionAction("corp", 1, "advance_card", "remote_1", 1, {
        evidence: [
          "runner_contest_capacity:high",
          "visible_runner_breaker_ontology_profiles:1",
          "structured_breaker_profile_contest_fallback:true",
          "structured_breaker_coverage:wall",
        ],
      }),
    ];

    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "breaker-visible-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(visibleActions, "breaker-visible-b"),
        finalStateHash: "fnv1a:different-hidden-state",
      },
    ]);

    expect({
      corpVisibleRunnerBreakerOntologyProfilesSeen:
        first.corpVisibleRunnerBreakerOntologyProfilesSeen,
      corpRemoteSafetyUsedRunnerBreakerOntology:
        first.corpRemoteSafetyUsedRunnerBreakerOntology,
      corpCheapContestDetectedByBreakerOntology:
        first.corpCheapContestDetectedByBreakerOntology,
      breakerOntologyCoverageWall: first.breakerOntologyCoverageWall,
    }).toEqual({
      corpVisibleRunnerBreakerOntologyProfilesSeen:
        second.corpVisibleRunnerBreakerOntologyProfilesSeen,
      corpRemoteSafetyUsedRunnerBreakerOntology:
        second.corpRemoteSafetyUsedRunnerBreakerOntology,
      corpCheapContestDetectedByBreakerOntology:
        second.corpCheapContestDetectedByBreakerOntology,
      breakerOntologyCoverageWall: second.breakerOntologyCoverageWall,
    });
  });

  it("summarizes short-horizon plan conversion metrics from action traces", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary([
        progressionAction("runner", 1, "draw_card", undefined, 1, {
          runnerDrawAction: true,
          reasonCode: "runner.plan.setup_for_run",
        }),
        progressionAction("runner", 2, "start_run", "rd", 1),
        progressionAction("runner", 3, "access_card", undefined, 1),
        progressionAction("runner", 4, "play_event", undefined, 2, {
          runnerEconomyActionTaken: true,
          runnerCreditsBefore: 2,
          runnerCreditsAfter: 5,
          runnerReserveTarget: 4,
          runnerCreditDelta: 3,
          reasonCode: "runner.plan.economy_reserve",
        }),
        progressionAction("runner", 5, "start_run", "remote_1", 2, {
          runnerRemoteRunAgainstAdvancedRemote: true,
        }),
        progressionAction("runner", 6, "trash_accessed_card", undefined, 2, {
          runnerRelevantRemoteTrashTaken: true,
        }),
        progressionAction("runner", 7, "install_card", undefined, 3, {
          runnerRigInstallAction: true,
          runnerInstallAction: true,
          reasonCode: "runner.plan.rig_unlock",
        }),
        progressionAction("runner", 8, "start_run", "hq", 3, {
          runnerCentralRunWithInterfaceInstalled: true,
        }),
        progressionAction("runner", 9, "steal_agenda", undefined, 3),
        progressionAction("corp", 10, "install_card", "remote_2", 4, {
          installPlacement: "root",
          targetCardType: "agenda",
          reasonCode: "corp.plan.remote_build",
        }),
        progressionAction("corp", 11, "advance_card", "remote_2", 4, {
          targetCardType: "agenda",
          advancementTargetTypes: ["agenda"],
          reasonCode: "corp.plan.advance",
        }),
        progressionAction("corp", 12, "score_agenda", "remote_2", 4, {
          targetCardType: "agenda",
        }),
      ]),
    ]);

    expect(metrics.setupActionConvertedToRun).toBe(1);
    expect(metrics.economyActionConvertedToRun).toBe(1);
    expect(metrics.rigActionConvertedToRun).toBe(1);
    expect(metrics.remoteBuildConvertedToAdvanceOrScore).toBe(1);
    expect(metrics.advanceConvertedToScore).toBe(1);
    expect(metrics.remoteContestConvertedToStealOrTrash).toBe(1);
    expect(metrics.centralPressureConvertedToSteal).toBe(1);
    expect(metrics.planIntentConverted).toBeGreaterThanOrEqual(5);
    expect(metrics.actionLedToProgressWithin3).toBeGreaterThan(
      metrics.actionLedToProgressWithin1,
    );
  });

  it("does not convert economy spam or value-free central runs into progress", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "play_event", undefined, 1, {
            runnerEconomyActionTaken: true,
            runnerCreditsBefore: 1,
            runnerCreditsAfter: 2,
            runnerReserveTarget: 5,
            runnerCreditDelta: 1,
            reasonCode: "runner.plan.economy_reserve",
          }),
          progressionAction("runner", 2, "play_event", undefined, 1, {
            runnerEconomyActionTaken: true,
            runnerCreditsBefore: 2,
            runnerCreditsAfter: 3,
            runnerReserveTarget: 5,
            runnerCreditDelta: 1,
            reasonCode: "runner.plan.economy_reserve",
          }),
          progressionAction("runner", 3, "start_run", "rd", 2, {
            reasonCode: "runner.plan.central_pressure",
          }),
          progressionAction("runner", 4, "end_turn", undefined, 2),
        ],
        "plan-conversion-stall-fixture",
      ),
    ]);

    expect(metrics.economyActionConvertedToRun).toBe(0);
    expect(metrics.centralPressureConvertedToSteal).toBe(0);
    expect(metrics.actionLedToProgressWithin3).toBe(0);
    expect(metrics.planIntentAbandoned).toBeGreaterThanOrEqual(2);
    expect(metrics.samePlanRepeatedWithoutProgress).toBeGreaterThanOrEqual(1);
    expect(metrics.longestNoProgressChain).toBe(4);
    expect(metrics.turnsWithNoProgress).toBe(2);
  });

  it("keeps run and forced micro-actions out of strategic no-progress chains", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            reasonCode: "runner.plan.pressure_rnd",
          }),
          progressionAction("runner", 2, "continue_run", undefined, 1),
          progressionAction("runner", 3, "access_card", undefined, 1),
          progressionAction("corp", 4, "mandatory_draw", undefined, 2),
          progressionAction("runner", 5, "end_turn", undefined, 2),
        ],
        "strategic-micro-chain-fixture",
      ),
    ]);

    expect(metrics.longestNoProgressChain).toBe(5);
    expect(metrics.strategicLongestNoProgressChain).toBe(2);
    expect(metrics.microActionNoProgressContribution).toBe(3);
    expect(metrics.planIntentAbandonedWithoutReason).toBeGreaterThan(0);
  });

  it("classifies action-limit endgames from the final strategic window without micro-action inflation", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "continue_run", undefined, 7),
            progressionAction("runner", 2, "access_card", undefined, 7),
            progressionAction("corp", 3, "mandatory_draw", undefined, 8),
            progressionAction("runner", 4, "draw_card", undefined, 8, {
              runnerDrawAction: true,
              reasonCode: "runner.plan.setup_without_conversion",
              hqKnownAgendaCount: 1,
            }),
            progressionAction("runner", 5, "gain_credit", undefined, 8, {
              runnerEconomyActionTaken: true,
              runnerCreditsBefore: 7,
              runnerCreditsAfter: 8,
              runnerCreditDelta: 1,
              runnerReserveTarget: 5,
              hqKnownAgendaCount: 1,
              runnerSkippedAdvancedRemoteContest: true,
              reasonCode: "runner.plan.recover_economy",
            }),
            progressionAction("runner", 6, "install_card", undefined, 9, {
              runnerInstallAction: true,
              runnerRigInstallAction: true,
              runnerLowValueDuplicateInstallAction: true,
              hqKnownAgendaCount: 1,
              reasonCode: "runner.plan.build_rig",
            }),
            progressionAction("corp", 7, "install_card", "remote_1", 9, {
              installPlacement: "ice",
              reasonCode: "corp.plan.protect_remote",
            }),
            progressionAction("runner", 8, "end_turn", undefined, 9),
            progressionAction("corp", 9, "end_turn", undefined, 10),
          ],
          "action-limit-endgame-runner-stall",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.actionLimitRootCauseByMatch).toBe(1);
    expect(metrics.actionLimitDominantSideRunner).toBe(1);
    expect(metrics.finalStrategicWindowNoProgressActions).toBe(5);
    expect(metrics.finalStrategicWindowRunnerNoProgressActions).toBe(4);
    expect(metrics.finalWindowKnownInfoExploitationOpportunities).toBe(3);
    expect(metrics.finalWindowKnownInfoExploitationTaken).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(3);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesRunner).toBe(1);
    expect(metrics.runnerCloseoutByKnownHqAgenda).toBe(1);
    expect(metrics.runnerCloseoutByPointsToWin).toBe(1);
    expect(metrics.endgameCloseoutAttemptsRunner).toBe(0);
    expect(metrics.endgameSetupOrEconomyActions).toBe(2);
    expect(metrics.endgameProtectionActions).toBe(1);
    expect(metrics.actionLimitLikelyStrategyIssue).toBe(1);
    expect(metrics.microActionNoProgressContribution).toBe(3);
  });

  it("classifies corp score-path endgame stalls separately from runner stalls", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("corp", 1, "install_card", "remote_1", 8, {
              installPlacement: "root",
              targetCardType: "agenda",
              reasonCode: "corp.plan.remote_build",
            }),
            progressionAction("corp", 2, "install_card", "remote_1", 8, {
              installPlacement: "ice",
              protectBeforeAdvance: true,
              reasonCode: "corp.plan.protect_remote",
            }),
            progressionAction("corp", 3, "gain_credit", undefined, 9, {
              reasonCode: "corp.plan.recover_economy",
            }),
            progressionAction("corp", 4, "end_turn", undefined, 9, {
              scoreActionsAvailable: 1,
            }),
            progressionAction("runner", 5, "end_turn", undefined, 9),
          ],
          "action-limit-endgame-corp-score-stall",
        ),
        finalAgendaPoints: { runner: 3, corp: 5 },
      },
    ]);

    expect(metrics.actionLimitRootCauseByMatch).toBe(1);
    expect(metrics.actionLimitDominantSideCorp).toBe(1);
    expect(metrics.finalWindowCorpScorePathOpportunities).toBe(3);
    expect(metrics.finalWindowCorpScorePathTaken).toBe(1);
    expect(metrics.endgameCloseoutOpportunitiesCorp).toBe(3);
    expect(metrics.endgameCloseoutAttemptsCorp).toBe(1);
    expect(metrics.endgameProtectionActions).toBe(1);
    expect(metrics.endgameSetupOrEconomyActions).toBe(1);
  });

  it("dedupes protection-to-score metrics around actual prior protection", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            installPlacement: "ice",
            evidence: [
              "corp_unsafe_remote_converted_to_protection:true",
              "corp_protection_chosen_before_unsafe_agenda_install:true",
            ],
          }),
          progressionAction("corp", 2, "install_card", "remote_1", 1, {
            installPlacement: "root",
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
          progressionAction("corp", 3, "advance_card", "remote_1", 1, {
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
        ],
        "protection-to-score-metric-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_2", 1, {
            installPlacement: "root",
            targetCardType: "agenda",
            evidence: [
              "corp_protection_opened_score_path:true",
              "corp_score_path_chosen_after_protection:true",
            ],
          }),
        ],
        "protection-to-score-no-prior-protection-fixture",
      ),
    ]);

    expect(metrics.corpProtectionConvertedToScoreWithin3).toBe(1);
    expect(metrics.corpProtectionRepeatedWithoutScoreConversion).toBe(0);
    expect(metrics.corpProtectionOpenedScorePath).toBe(2);
    expect(metrics.corpScorePathChosenAfterProtection).toBe(2);
  });

  it("summarizes corp score-window compression and delayed steal metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "advance_card", "remote_1", 1, {
            targetCardType: "agenda",
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_score_window_compression_taken:true",
              "corp_agenda_advanced_in_protected_remote:true",
              "corp_agenda_near_score_window:true",
            ],
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_score_window_compression_skipped:true",
              "corp_economy_before_score_window:true",
              "corp_non_essential_action_before_score_window:true",
            ],
          }),
          progressionAction("runner", 3, "steal_agenda", "remote_1", 2),
        ],
        "score-window-compression-metric-fixture",
      ),
      progressionSummary(
        [
          progressionAction("corp", 1, "gain_credit", undefined, 1, {
            evidence: [
              "corp_score_window_compression_opportunity:true",
              "corp_economy_before_score_window:true",
              "corp_economy_before_score_window_necessary:true",
            ],
          }),
        ],
        "score-window-compression-necessary-economy-fixture",
      ),
    ]);

    expect(metrics.corpScoreWindowCompressionOpportunity).toBe(3);
    expect(metrics.corpScoreWindowCompressionTaken).toBe(1);
    expect(metrics.corpScoreWindowCompressionRate).toBeCloseTo(1 / 3, 3);
    expect(metrics.corpScoreWindowCompressionSkipped).toBe(1);
    expect(metrics.corpNonEssentialActionBeforeScoreWindow).toBe(1);
    expect(metrics.corpEconomyBeforeScoreWindow).toBe(2);
    expect(metrics.corpEconomyBeforeScoreWindowNecessary).toBe(1);
    expect(metrics.corpRunnerStealAfterDelayedScoreWindow).toBe(1);
    expect(metrics.corpAdvanceToScoreLineCompressedWithin2).toBe(1);
    expect(metrics.corpAdvanceToScoreLineCompressedWithin3).toBe(1);
  });

  it("summarizes scored-agenda action metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "activated_card_ability", undefined, 1, {
            evidence: [
              "scored_agenda_action_opportunity:true",
              "scored_agenda_action_taken:true",
              "scored_agenda_economy_opportunity:true",
              "scored_agenda_economy_taken:true",
              "political_overthrow_opportunity:true",
              "political_overthrow_taken:true",
              "scored_agenda_action_value_over_basic:2",
            ],
          }),
          progressionAction("corp", 2, "gain_credit", undefined, 1, {
            evidence: [
              "basic_credit_taken_while_better_agenda_economy_available:true",
              "scored_agenda_economy_skipped_for_basic_credit:true",
              "political_overthrow_skipped_for_basic_credit:true",
            ],
          }),
          progressionAction("corp", 3, "activated_card_ability", undefined, 1, {
            evidence: [
              "scored_agenda_action_opportunity:true",
              "scored_agenda_action_taken:true",
              "scored_agenda_draw_opportunity:true",
              "scored_agenda_draw_taken:true",
              "scored_agenda_extra_action_opportunity:true",
              "scored_agenda_extra_action_taken:true",
              "scored_agenda_trace_tag_opportunity:true",
              "scored_agenda_trace_tag_taken:true",
              "scored_agenda_damage_punish_opportunity:true",
              "scored_agenda_damage_punish_taken:true",
              "scored_agenda_counter_economy_opportunity:true",
              "scored_agenda_counter_economy_taken:true",
            ],
          }),
          progressionAction("corp", 4, "draw_card", undefined, 1, {
            evidence: [
              "basic_draw_taken_while_better_agenda_draw_available:true",
            ],
          }),
        ],
        "scored-agenda-action-metric-fixture",
      ),
    ]);

    expect(metrics.scoredAgendaActionOpportunities).toBe(2);
    expect(metrics.scoredAgendaActionTaken).toBe(2);
    expect(metrics.scoredAgendaActionTakeRate).toBe(1);
    expect(metrics.scoredAgendaEconomyOpportunities).toBe(1);
    expect(metrics.scoredAgendaEconomyTaken).toBe(1);
    expect(metrics.scoredAgendaEconomySkippedForBasicCredit).toBe(1);
    expect(metrics.politicalOverthrowOpportunities).toBe(1);
    expect(metrics.politicalOverthrowTaken).toBe(1);
    expect(metrics.politicalOverthrowSkippedForBasicCredit).toBe(1);
    expect(metrics.scoredAgendaCounterEconomyTaken).toBe(1);
    expect(metrics.scoredAgendaDrawTaken).toBe(1);
    expect(metrics.scoredAgendaExtraActionTaken).toBe(1);
    expect(metrics.scoredAgendaTraceTagTaken).toBe(1);
    expect(metrics.scoredAgendaDamagePunishTaken).toBe(1);
    expect(metrics.scoredAgendaActionValueOverBasic).toBe(2);
    expect(metrics.basicCreditTakenWhileBetterAgendaEconomyAvailable).toBe(1);
    expect(metrics.basicDrawTakenWhileBetterAgendaDrawAvailable).toBe(1);
  });

  it("summarizes tag/punish terminal-window diagnostics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "play_operation", undefined, 1, {
            corpTagSourceOpportunity: true,
            corpTagSourceTaken: true,
            corpTraceTagOpportunity: true,
            corpTraceTagTaken: true,
            corpTraceTagExpectedSuccess: 1,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagSourceOntologyProfilesSeen: true,
            corpTagSourceOntologyUsed: true,
            corpTagSourceLegalActionClassifiedByOntology: true,
            corpTagSourceTakenWithOntologyPayoffAvailable: true,
            corpTagCreatedByOperation: true,
            corpFunnelSourcePayoffPairSeenInDeck: true,
            corpFunnelSourceActionTakenWithPayoffInDeck: true,
            corpFunnelSourceActionTakenWithVisiblePayoff: true,
            runnerTraceDefenseVisibleAtTagSource: true,
            runnerLinkDefenseVisibleAtTrace: true,
            corpTagPunishOntologyKinds: ["tag_source", "trace"],
            corpTagPunishConditionKinds: ["requires_trace_success"],
          }),
          progressionAction("runner", 2, "resolve_choice", undefined, 1, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 1,
            runnerTagAddedByAction: true,
            runnerTaggedAfterTraceDuringRun: true,
            corpTagCreatedDuringRunnerTurn: true,
            corpTagCreatedDuringEncounter: true,
            corpTagCreatedByTraceSuccess: true,
          }),
          progressionAction("runner", 3, "end_turn", undefined, 1, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 1,
            runnerTaggedAtEndOfRunnerTurn: true,
          }),
          progressionAction("corp", 4, "mandatory_draw", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            runnerTaggedAtStartOfCorpTurn: true,
            corpPunishOpportunity: true,
            corpPunishTaken: true,
            corpPunishKind: "scorched_earth_like",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishTaken: true,
            runnerDamagePreventionVisibleAtPayoffWindow: true,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyUsed: true,
            corpPunishLegalActionClassifiedByOntology: true,
            corpPunishOpportunityConfirmedByOntology: true,
            corpOntologyPunishOpportunityConverted: true,
            corpTagPunishOntologyKinds: ["tag_punish_payoff", "damage"],
            corpTagPunishConditionKinds: ["requires_runner_tagged"],
          }),
          progressionAction("runner", 5, "resolve_choice", undefined, 2, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 1,
            runnerTagAddedByAction: true,
            runnerTaggedAfterTraceDuringRun: true,
            corpTagCreatedDuringRunnerTurn: true,
            corpTagCreatedByAccessOrSteal: true,
          }),
          progressionAction("runner", 6, "remove_tag", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTagsAfterAction: 0,
            runnerTagClearedByAction: true,
          }),
          progressionAction("corp", 7, "mandatory_draw", undefined, 3, {
            runnerTagsBeforeAction: 0,
            runnerTagsAfterAction: 0,
          }),
          progressionAction("corp", 8, "gain_credit", undefined, 4, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "urban_renewal_like",
            corpPunishSkippedReason: "economy",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_307_urban-renewal"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "economy",
            corpPunishOpportunityConfirmedByOntology: true,
            corpPunishSkippedDespiteOntologyOpportunity: true,
            corpTagPunishOntologyProfilesSeen: true,
            corpTagPunishPayoffOntologyProfilesSeen: true,
            corpTagPunishOntologyKinds: ["tag_punish_payoff"],
          }),
          progressionAction("corp", 9, "install_card", "hq", 4, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "punitive_counterstrike_like",
            corpPunishSkippedReason: "protection",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_301_punitive-counterstrike",
            ],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "remote_protection",
            corpTraceTagOpportunity: true,
            corpTraceTagSkippedReason: "protection",
          }),
          progressionAction(
            "corp",
            10,
            "activated_card_ability",
            undefined,
            4,
            {
              runnerTagsBeforeAction: 1,
              runnerTaggedAtCorpDecision: true,
              runnerTaggedAtCorpDecisionWithoutPayoffKnown: true,
              corpPunishOpportunity: true,
              corpPunishTaken: true,
              corpPunishKind: "scored_agenda_damage_like",
              corpVisibleTagPunishTaken: true,
            },
          ),
        ],
        "tag-punish-window-metric-fixture",
      ),
    ]);

    expect(metrics.runnerTaggedAtCorpDecision).toBe(4);
    expect(metrics.runnerTaggedAtCorpDecisionTurns).toBe(2);
    expect(metrics.runnerTaggedAtCorpDecisionActions).toBe(4);
    expect(metrics.runnerTaggedAtStartOfCorpTurn).toBe(1);
    expect(metrics.runnerTaggedAtEndOfRunnerTurn).toBe(1);
    expect(metrics.runnerTaggedAfterTraceDuringRun).toBe(2);
    expect(metrics.corpTagCreatedDuringRunnerTurn).toBe(2);
    expect(metrics.corpTagCreatedDuringEncounter).toBe(1);
    expect(metrics.corpTagCreatedByTraceSuccess).toBe(1);
    expect(metrics.corpTagCreatedByAccessOrSteal).toBe(1);
    expect(metrics.corpTagCreatedByOperation).toBe(1);
    expect(metrics.runnerTaggedAtCorpDecisionWithFunnelPayoffKnown).toBe(3);
    expect(metrics.runnerTaggedAtCorpDecisionWithoutPayoffKnown).toBe(1);
    expect(
      metrics.runnerTagFromPreviousRunnerTurnStillVisibleAtCorpDecision,
    ).toBe(4);
    expect(metrics.runnerTagFromEncounterStillVisibleAtCorpDecision).toBe(4);
    expect(metrics.runnerTagClearedSameRunnerTurn).toBe(1);
    expect(metrics.runnerTagClearedBeforeCorpDecision).toBe(1);
    expect(metrics.runnerTagClearedBeforeCorpDecisionAfterFunnelSource).toBe(1);
    expect(metrics.runnerTagClearedSameRunnerTurnAfterSource).toBe(1);
    expect(metrics.runnerTagWindowExpiredBeforeCorpDecision).toBe(1);
    expect(metrics.runnerTagWindowExpiredBeforeCorpTurn).toBe(1);
    expect(metrics.corpVisibleTagPunishLegalActions).toBe(3);
    expect(metrics.corpVisibleTagDamagePunishLegalActions).toBe(3);
    expect(metrics.corpVisibleTagPayoffLegalActionsByKind).toBe(3);
    expect(metrics.corpVisibleTagPayoffLegalActionsByCard).toBe(3);
    expect(metrics.corpVisibleTagPunishTaken).toBe(2);
    expect(metrics.corpVisibleTagPunishSkipped).toBe(2);
    expect(metrics.corpVisibleTagPunishSkippedForEconomy).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForRemoteProtection).toBe(1);
    expect(metrics.corpFunnelSourcePayoffPairSeenInDeck).toBe(1);
    expect(metrics.corpFunnelSourceActionTakenWithPayoffInDeck).toBe(1);
    expect(metrics.corpFunnelSourceActionTakenWithVisiblePayoff).toBe(1);
    expect(metrics.corpFunnelPairConvertedToTaggedDecisionWindow).toBe(1);
    expect(metrics.corpFunnelPairConvertedToLegalPayoffWindow).toBe(1);
    expect(metrics.corpFunnelPairConvertedToPayoffTaken).toBe(1);
    expect(metrics.corpFunnelPairExpiredBeforePayoffWindow).toBe(1);
    expect(metrics.runnerTraceDefenseVisibleAtTagSource).toBe(1);
    expect(metrics.runnerDamagePreventionVisibleAtPayoffWindow).toBe(1);
    expect(metrics.runnerLinkDefenseVisibleAtTrace).toBe(1);
    expect(metrics.corpPunishOpportunities).toBe(4);
    expect(metrics.corpPunishTaken).toBe(2);
    expect(metrics.corpPunishSkipped).toBe(2);
    expect(metrics.corpPunishTakeRate).toBe(0.5);
    expect(metrics.corpPunishOpportunityScorchedEarthLike).toBe(1);
    expect(metrics.corpPunishOpportunityUrbanRenewalLike).toBe(1);
    expect(metrics.corpPunishOpportunityPunitiveCounterstrikeLike).toBe(1);
    expect(metrics.corpPunishOpportunityScoredAgendaDamageLike).toBe(1);
    expect(metrics.corpPunishSkippedForEconomy).toBe(1);
    expect(metrics.corpPunishSkippedForProtection).toBe(1);
    expect(metrics.corpPunishWindowExpiredBeforeCorpTurn).toBe(1);
    expect(metrics.corpTagSourceOpportunities).toBe(1);
    expect(metrics.corpTagSourceTaken).toBe(1);
    expect(metrics.corpTraceTagOpportunities).toBe(2);
    expect(metrics.corpTraceTagTaken).toBe(1);
    expect(metrics.corpTraceTagSkipped).toBe(1);
    expect(metrics.corpTraceTagExpectedSuccess).toBe(1);
    expect(metrics.corpTraceTagSkippedForProtection).toBe(1);
    expect(metrics.corpTagSourceConvertedToRunnerTagged).toBe(1);
    expect(metrics.corpTagSourceConvertedToPunishOpportunity).toBe(1);
    expect(metrics.corpTagSourceConvertedToPunishTaken).toBe(1);
    expect(metrics.corpTagPunishFunnelTagSourceOpportunity).toBe(1);
    expect(metrics.corpTagPunishFunnelTagSourceTaken).toBe(1);
    expect(metrics.corpTagPunishFunnelRunnerTagged).toBe(1);
    expect(metrics.corpTagPunishFunnelRunnerTaggedAtCorpDecision).toBe(4);
    expect(metrics.corpTagPunishFunnelPunishOpportunity).toBe(4);
    expect(metrics.corpTagPunishFunnelPunishTaken).toBe(2);
    expect(metrics.corpTagPunishFunnelTerminalDamageOrEconomicHit).toBe(2);
    expect(metrics.corpTagPunishOntologyProfilesSeen).toBe(3);
    expect(metrics.corpTagSourceOntologyUsed).toBe(1);
    expect(metrics.corpTagPunishPayoffOntologyUsed).toBe(1);
    expect(metrics.corpPunishOpportunityConfirmedByOntology).toBe(2);
    expect(metrics.corpPunishSkippedDespiteOntologyOpportunity).toBe(1);
    expect(metrics.corpTagSourceTakenWithOntologyPayoffAvailable).toBe(1);
    expect(metrics.corpTagSourceConvertedToOntologyPunishOpportunity).toBe(1);
    expect(metrics.corpOntologyPunishOpportunityConverted).toBe(1);
    expect(metrics.corpTagPunishOntologyKindTagSource).toBe(1);
    expect(metrics.corpTagPunishOntologyKindTagPunishPayoff).toBe(2);
    expect(metrics.corpTagPunishOntologyKindTrace).toBe(1);
    expect(metrics.corpTagPunishConditionRequiresRunnerTagged).toBe(1);
    expect(metrics.corpTagPunishConditionRequiresTraceSuccess).toBe(1);
  });

  it("keeps tag/punish diagnostics invariant to hidden runner zones", () => {
    const visibleActions = [
      progressionAction("corp", 1, "gain_credit", undefined, 1, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        corpPunishOpportunity: true,
        corpPunishKind: "closed_accounts_like",
        corpPunishSkippedReason: "economy",
      }),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "tag-punish-hidden-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        visibleActions.map((entry) => ({
          ...entry,
          evidence: ["hidden_runner_hand_variant_not_used"],
        })),
        "tag-punish-hidden-b",
      ),
    ]);

    expect(second.corpPunishOpportunities).toBe(first.corpPunishOpportunities);
    expect(second.corpPunishSkippedForEconomy).toBe(
      first.corpPunishSkippedForEconomy,
    );
    expect(second.runnerTaggedAtCorpDecision).toBe(
      first.runnerTaggedAtCorpDecision,
    );
  });

  it("separates visible-tag payoff windows from strategy-neutral skip reasons", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "trigger_ability", undefined, 1, {
            corpTagSourceOpportunity: true,
            corpTagSourceTaken: true,
            corpTagCreatedByPersistentEffect: true,
            corpFunnelSourcePayoffPairSeenInDeck: true,
            corpFunnelSourceActionTakenWithPayoffInDeck: true,
          }),
          progressionAction("corp", 2, "score_agenda", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "scorched_earth_like",
            corpPunishSkippedReason: "score",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["damage"],
            corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
            corpVisibleTagDamagePunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "score",
          }),
          progressionAction("corp", 3, "advance_card", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "closed_accounts_like",
            corpPunishSkippedReason: "advance",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["economic"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_285_closed-accounts",
            ],
            corpVisibleTagEconomicPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "advance",
            runnerSurvivalCounterContextAvailable: true,
            runnerFlatlinePreventionVisibleAtPayoffWindow: true,
            runnerSurvivalCounterContextSuppressedPunishValue: true,
          }),
          progressionAction("corp", 4, "install_card", "hq", 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "power_grid_overload_like",
            corpPunishSkippedReason: "install",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["trash"],
            corpVisibleTagPayoffLegalActionCards: [
              "onr_v1_299_power-grid-overload",
            ],
            corpVisibleTagTrashPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "install",
          }),
          progressionAction("corp", 5, "gain_credit", undefined, 2, {
            runnerTagsBeforeAction: 1,
            runnerTaggedAtCorpDecision: true,
            runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
            corpPunishOpportunity: true,
            corpPunishKind: "unknown",
            corpPunishSkippedReason: "unknown_higher_priority",
            corpVisibleTagPunishLegalActions: 1,
            corpVisibleTagPayoffLegalActionKinds: ["run_lock", "ambush"],
            corpVisibleTagRunLockPunishLegalActions: true,
            corpVisibleTagAmbushPunishLegalActions: true,
            corpVisibleTagPunishSkipped: true,
            corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
          }),
        ],
        "tag-punish-terminal-skip-reason-fixture",
      ),
    ]);

    expect(metrics.corpTagCreatedByPersistentEffect).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForScore).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForAdvance).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForInstall).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(1);
    expect(metrics.corpVisibleTagEconomicPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagTrashPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagRunLockPunishLegalActions).toBe(1);
    expect(metrics.corpVisibleTagAmbushPunishLegalActions).toBe(1);
    expect(metrics.runnerSurvivalCounterContextAvailable).toBe(1);
    expect(metrics.runnerFlatlinePreventionVisibleAtPayoffWindow).toBe(1);
    expect(metrics.runnerSurvivalCounterContextSuppressedPunishValue).toBe(1);
  });

  it("summarizes tag/punish unknown-skip attribution and fix-gate buckets", () => {
    const unknownSkip = (
      actionType: LegalAction["type"],
      attribution: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipAttribution"]
      >,
      plausibility: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipPlausibility"]
      >,
      family: NonNullable<
        AiSimulationSummary["actionSequence"][number]["corpVisibleTagPunishUnknownSkipChosenFamily"]
      >,
      extra: Partial<AiSimulationSummary["actionSequence"][number]> = {},
    ) =>
      progressionAction("corp", 10, actionType, undefined, 3, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        runnerTaggedAtCorpDecisionWithFunnelPayoffKnown: true,
        corpPunishOpportunity: true,
        corpPunishKind: "scorched_earth_like",
        corpPunishSkippedReason: "unknown_higher_priority",
        corpVisibleTagPunishLegalActions: 1,
        corpVisibleTagPayoffLegalActionKinds: ["damage"],
        corpVisibleTagPayoffLegalActionCards: ["onr_v1_302_scorched-earth"],
        corpVisibleTagDamagePunishLegalActions: true,
        corpVisibleTagPunishSkipped: true,
        corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
        corpVisibleTagPunishUnknownSkipAttribution: attribution,
        corpVisibleTagPunishUnknownSkipPlausibility: plausibility,
        corpVisibleTagPunishUnknownSkipChosenFamily: family,
        corpVisibleTagPunishUnknownSkipChosenActionType: actionType,
        ...extra,
      });

    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          unknownSkip(
            "gain_credit",
            "unknown_skip_suspicious_basic_credit",
            "suspicious",
            "basic_credit",
            {
              corpVisibleTagPunishUnknownSkipFixGateEligible: true,
              corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal: true,
            },
          ),
          unknownSkip(
            "end_turn",
            "unknown_skip_suspicious_end_turn",
            "suspicious",
            "end_turn",
            { corpVisibleTagPunishUnknownSkipFixGateEligible: true },
          ),
          unknownSkip(
            "score_agenda",
            "unknown_skip_plausible_score_window",
            "plausible",
            "score",
            { corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "score" },
          ),
          unknownSkip(
            "advance_card",
            "unknown_skip_plausible_advance_to_score",
            "plausible",
            "advance",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "advance_score",
            },
          ),
          unknownSkip(
            "rez_ice",
            "unknown_skip_plausible_hq_or_rnd_safety",
            "plausible",
            "rez",
            { corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "safety" },
          ),
          unknownSkip(
            "play_operation",
            "unknown_skip_plausible_payoff_unaffordable",
            "plausible",
            "operation",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "affordability",
            },
          ),
          unknownSkip(
            "activated_card_ability",
            "unknown_skip_plausible_payoff_low_impact",
            "plausible",
            "ability",
            {
              corpVisibleTagPayoffLegalActionKinds: ["run_lock"],
              corpVisibleTagRunLockPunishLegalActions: true,
              corpVisibleTagDamagePunishLegalActions: false,
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "low_impact",
            },
          ),
          unknownSkip(
            "install_card",
            "unknown_skip_suspicious_low_value_install",
            "suspicious",
            "install_asset_or_upgrade",
            { corpVisibleTagPunishUnknownSkipFixGateEligible: true },
          ),
          unknownSkip(
            "draw_card",
            "unknown_skip_plausible_survival_countercontext",
            "plausible",
            "draw",
            {
              corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "safety",
              runnerDamagePreventionVisibleAtPayoffWindow: true,
            },
          ),
          unknownSkip(
            "trigger_ability",
            "unknown_skip_unclassified_missing_evidence",
            "unclassified",
            "unknown",
          ),
        ],
        "tag-punish-unknown-skip-attribution-fixture",
      ),
    ]);

    expect(metrics.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(
      10,
    );
    expect(metrics.corpVisibleTagPunishUnknownSkipPlausible).toBe(6);
    expect(metrics.corpVisibleTagPunishUnknownSkipSuspicious).toBe(3);
    expect(metrics.corpVisibleTagPunishUnknownSkipUnclassified).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenBasicCredit).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenEndTurn).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenScore).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenAdvance).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenRez).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenOperation).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenAbility).toBe(1);
    expect(
      metrics.corpVisibleTagPunishSkippedUnknownChosenInstallAssetOrUpgrade,
    ).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenDraw).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownChosenUnknown).toBe(1);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByReasonCode).toBe(10);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByChosenActionType).toBe(
      10,
    );
    expect(metrics.corpVisibleTagPunishSkippedUnknownByPayoffCard).toBe(10);
    expect(metrics.corpVisibleTagPunishSkippedUnknownByPayoffKind).toBe(10);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffDamage).toBe(9);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffRunLock).toBe(1);
    expect(
      metrics.corpVisibleTagPunishUnknownSkipPayoffLethalOrNearLethal,
    ).toBe(1);
    expect(metrics.corpVisibleTagPunishUnknownSkipPayoffNonLethal).toBe(9);
    expect(metrics.corpVisibleTagPunishFixGateEligibleWindow).toBe(3);
    expect(metrics.corpVisibleTagPunishFixGateSuspiciousSkip).toBe(3);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByScore).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByAdvanceScore).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedBySafety).toBe(2);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByAffordability).toBe(1);
    expect(metrics.corpVisibleTagPunishFixGateBlockedByLowImpact).toBe(1);
  });

  it("normalizes visible tag/punish payoff windows by corp decision", () => {
    const payoffWindow = (
      actionType: LegalAction["type"],
      extra: Partial<AiSimulationSummary["actionSequence"][number]>,
    ) =>
      progressionAction("corp", 20, actionType, undefined, 5, {
        runnerTagsBeforeAction: 1,
        runnerTaggedAtCorpDecision: true,
        corpVisibleTagPunishLegalActions: 2,
        corpVisibleTagPayoffLegalActionKinds: ["damage", "economic"],
        corpVisibleTagPayoffLegalActionCards: [
          "onr_v1_285_closed-accounts",
          "onr_v1_302_scorched-earth",
        ],
        corpVisibleTagDamagePunishLegalActions: true,
        corpVisibleTagEconomicPunishLegalActions: true,
        corpVisibleTagPunishDecisionWindow: true,
        corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: true,
        ...extra,
      });

    const visibleTaken = payoffWindow("play_operation", {
      corpVisibleTagPunishTaken: true,
      corpVisibleTagPunishDecisionWindowTaken: true,
      corpVisibleTagPunishAlternativePayoffsNotChosen: 1,
      corpVisibleTagPunishChosenPayoffAmongAlternatives: true,
      corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff: true,
      corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken: true,
      corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization: true,
      corpVisibleTagPunishOperationChoiceAmongPayoffs: true,
      corpVisibleTagPunishChosenDamageOverEconomic: true,
    });
    const lethalMissed = payoffWindow("play_operation", {
      corpVisibleTagPunishTaken: true,
      corpVisibleTagPunishDecisionWindowTaken: true,
      corpVisibleTagPunishAlternativePayoffsNotChosen: 1,
      corpVisibleTagPunishChosenPayoffAmongAlternatives: true,
      corpVisibleTagPunishOperationChoiceAmongPayoffs: true,
      corpVisibleTagPunishChosenEconomicOverDamage: true,
      corpVisibleTagPunishChosenNonLethalOverLethal: true,
      corpVisibleTagPunishChosenLowerImpactOverHigherImpact: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssue: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed: true,
      corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage: true,
    });
    const basicCreditSkip = payoffWindow("gain_credit", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_suspicious_basic_credit",
      corpVisibleTagPunishUnknownSkipPlausibility: "suspicious",
      corpVisibleTagPunishUnknownSkipChosenFamily: "basic_credit",
      corpVisibleTagPunishUnknownSkipFixGateEligible: true,
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
      corpVisibleTagPunishFixGateEligibleWindowNormalized: true,
      corpVisibleTagPunishFixGateSuspiciousSkipNormalized: true,
    });
    const endTurnSkip = payoffWindow("end_turn", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_suspicious_end_turn",
      corpVisibleTagPunishUnknownSkipPlausibility: "suspicious",
      corpVisibleTagPunishUnknownSkipChosenFamily: "end_turn",
      corpVisibleTagPunishUnknownSkipFixGateEligible: true,
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
      corpVisibleTagPunishFixGateEligibleWindowNormalized: true,
      corpVisibleTagPunishFixGateSuspiciousSkipNormalized: true,
    });
    const scoreSkip = payoffWindow("score_agenda", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_plausible_score_window",
      corpVisibleTagPunishUnknownSkipPlausibility: "plausible",
      corpVisibleTagPunishUnknownSkipChosenFamily: "score",
      corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "score",
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
    });
    const unaffordableSkip = payoffWindow("play_operation", {
      corpVisibleTagPunishLegalActions: 1,
      corpVisibleTagPayoffLegalActionKinds: ["damage"],
      corpVisibleTagPunishDecisionWindowWithMultiplePayoffs: false,
      corpVisibleTagPunishSkipped: true,
      corpVisibleTagPunishSkippedReason: "unknown_higher_priority",
      corpVisibleTagPunishDecisionWindowSkipped: true,
      corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen: true,
      corpVisibleTagPunishUnknownSkipAttribution:
        "unknown_skip_plausible_payoff_unaffordable",
      corpVisibleTagPunishUnknownSkipPlausibility: "plausible",
      corpVisibleTagPunishUnknownSkipChosenFamily: "operation",
      corpVisibleTagPunishUnknownSkipFixGateBlockedBy: "affordability",
      corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization: true,
    });

    const first = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          visibleTaken,
          lethalMissed,
          basicCreditSkip,
          endTurnSkip,
          scoreSkip,
          unaffordableSkip,
        ],
        "tag-punish-window-normalization-a",
      ),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        [visibleTaken, lethalMissed].map((entry) => ({
          ...entry,
          evidence: ["hidden_runner_zone_variant_not_used"],
        })),
        "tag-punish-window-normalization-b",
      ),
    ]);

    expect(first.corpVisibleTagPunishDecisionWindows).toBe(6);
    expect(first.corpVisibleTagPunishDecisionWindowsTaken).toBe(2);
    expect(first.corpVisibleTagPunishDecisionWindowsSkipped).toBe(4);
    expect(first.corpVisibleTagPunishDecisionWindowsWithMultiplePayoffs).toBe(
      2,
    );
    expect(first.corpVisibleTagPunishAlternativePayoffsNotChosen).toBe(2);
    expect(first.corpVisibleTagPunishChosenPayoffAmongAlternatives).toBe(2);
    expect(first.corpVisibleTagPunishSkippedForUnknownHigherPriority).toBe(4);
    expect(
      first.corpVisibleTagPunishUnknownSkipResolvedAsAlternativePayoff,
    ).toBe(1);
    expect(
      first.corpVisibleTagPunishUnknownSkipRemainingAfterWindowNormalization,
    ).toBe(4);
    expect(first.corpVisibleTagPunishSkippedOnlyWhenNoPayoffChosen).toBe(4);
    expect(
      first.corpVisibleTagPunishWindowHadTakenAndSkippedBeforeNormalization,
    ).toBe(1);
    expect(first.corpVisibleTagPunishOperationChoiceAmongPayoffs).toBe(2);
    expect(first.corpVisibleTagPunishChosenDamageOverEconomic).toBe(1);
    expect(first.corpVisibleTagPunishChosenEconomicOverDamage).toBe(1);
    expect(first.corpVisibleTagPunishChosenNonLethalOverLethal).toBe(1);
    expect(first.corpVisibleTagPunishChosenLowerImpactOverHigherImpact).toBe(1);
    expect(first.corpVisibleTagPunishFixGateEligibleWindowNormalized).toBe(2);
    expect(first.corpVisibleTagPunishFixGateSuspiciousSkipNormalized).toBe(2);
    expect(
      first.corpVisibleTagPunishFixGateResolvedByAlternativePayoffTaken,
    ).toBe(1);
    expect(first.corpVisibleTagPunishPotentialPayoffOrderingIssue).toBe(1);
    expect(
      first.corpVisibleTagPunishPotentialPayoffOrderingIssueLethalMissed,
    ).toBe(1);
    expect(
      first.corpVisibleTagPunishPotentialPayoffOrderingIssueEconomicVsDamage,
    ).toBe(1);
    expect(second.corpVisibleTagPunishDecisionWindows).toBe(2);
    expect(second.corpVisibleTagPunishDecisionWindowsTaken).toBe(2);
    expect(JSON.stringify(visibleTaken)).not.toMatch(
      /runnerHand|runnerStack|hidden|grip|heap/i,
    );
  });

  it("does not count generic central endgame runs as true runner closeout", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "start_run", "hq", 8, {
              reasonCode: "runner.plan.safe_probe_run",
            }),
            progressionAction("runner", 2, "start_run", "rd", 8, {
              reasonCode: "runner.plan.pressure_rnd",
            }),
            progressionAction("runner", 3, "gain_credit", undefined, 8, {
              runnerEconomyActionTaken: true,
              reasonCode: "runner.plan.recover_economy",
            }),
          ],
          "action-limit-endgame-generic-central-closeout-fixture",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunner).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerFalsePositive).toBe(0);
  });

  it("marks blocked known-agenda closeout windows as false positives", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        ...progressionSummary(
          [
            progressionAction("runner", 1, "draw_card", undefined, 8, {
              hqKnownAgendaCount: 1,
              runnerContestBlockedByCredits: true,
              runCreditsMissingForKnownPath: 3,
              reasonCode: "runner.plan.setup_without_conversion",
            }),
            progressionAction("runner", 2, "start_run", "remote_1", 8, {
              knownRemoteAgendas: 1,
              remoteRunBoostedByKnownRemoteAgenda: true,
              runnerRemoteContestBlockedByPostRunReserve: true,
              reasonCode: "runner.plan.contest_remote",
            }),
          ],
          "action-limit-endgame-blocked-closeout-fixture",
        ),
        finalAgendaPoints: { runner: 5, corp: 4 },
      },
    ]);

    expect(metrics.endgameCloseoutOpportunitiesRunnerRaw).toBe(2);
    expect(metrics.endgameCloseoutOpportunitiesRunnerDeduped).toBe(2);
    expect(metrics.endgameCloseoutOpportunitiesRunnerTrue).toBe(0);
    expect(metrics.endgameCloseoutOpportunitiesRunnerFalsePositive).toBe(2);
    expect(metrics.runnerCloseoutBlockedByCredits).toBe(1);
    expect(metrics.runnerCloseoutBlockedByPostRunReserve).toBe(1);
    expect(metrics.runnerCloseoutSkippedWithReason).toBe(2);
    expect(metrics.runnerCloseoutAttempted).toBe(0);
  });

  it("summarizes outcome follow-up opportunities and conversions", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "gain_credit", undefined, 1, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "good_outcome_converted:true",
              "runner_economy_converted_after_outcome:true",
            ],
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            evidence: [
              "outcome_followup_opportunity:true",
              "bad_outcome_repeated_without_new_info:true",
              "runner_access_no_value_repeated:true",
              "runner_central_success_followed_by_repeat_no_value:true",
              "outcome_followup_suppressed_by_progression_cost:true",
              "outcome_ignored:true",
            ],
          }),
          progressionAction("runner", 3, "gain_credit", undefined, 2, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "outcome_pivot_with_reason:true",
              "runner_access_no_value_pivoted:true",
            ],
          }),
          progressionAction("corp", 4, "advance_card", "remote_1", 2, {
            evidence: [
              "outcome_followup_opportunity:true",
              "outcome_followup_taken:true",
              "outcome_followup_applied:true",
              "good_outcome_converted:true",
              "outcome_followup_preserved_score_window:true",
              "score_now_protected_from_followup:true",
              "corp_remote_build_followup_advance_protect_score:true",
            ],
          }),
        ],
        "outcome-followup-metric-fixture",
      ),
    ]);

    expect(metrics.outcomeFollowupOpportunities).toBe(4);
    expect(metrics.outcomeFollowupTaken).toBe(3);
    expect(metrics.outcomeFollowupRate).toBe(0.75);
    expect(metrics.outcomeFollowupApplied).toBe(3);
    expect(metrics.outcomeFollowupSuppressedByProgressionCost).toBe(1);
    expect(metrics.outcomeFollowupLedToProgressWithin3).toBe(3);
    expect(metrics.outcomeFollowupLedToNoProgressChain).toBe(0);
    expect(metrics.outcomeFollowupPreservedScoreWindow).toBe(1);
    expect(metrics.scoreNowProtectedFromFollowup).toBe(1);
    expect(metrics.badOutcomeRepeatedWithoutNewInfo).toBe(1);
    expect(metrics.goodOutcomeConverted).toBe(2);
    expect(metrics.runnerAccessNoValuePivoted).toBe(1);
    expect(metrics.runnerAccessNoValueRepeated).toBe(1);
    expect(metrics.corpRemoteBuildFollowupAdvanceProtectScore).toBe(1);
  });

  it("summarizes future-effect encounter and pump viability metrics", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("runner", 1, "continue_run", "remote_1", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "unbroken_run_effect_ignored_because_no_remaining_ice:true",
            ],
          }),
          progressionAction("runner", 2, "break_subroutine", "rd", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "unbroken_run_effect_applied_to_remaining_path:true",
            ],
          }),
          progressionAction("runner", 3, "pump_breaker", "rd", 1, {
            evidence: [
              "run_remainder_subroutine_effect:true",
              "pump_cannot_lead_to_useful_break:true",
              "pump_would_destroy_access_reserve:true",
            ],
          }),
        ],
        "future-effect-encounter-metric-fixture",
      ),
    ]);

    expect(metrics.futureEffectSubroutinesEncountered).toBe(3);
    expect(metrics.futureEffectSubroutinesWithRemainingIce).toBe(1);
    expect(metrics.futureEffectSubroutinesWithoutRemainingIce).toBe(1);
    expect(metrics.futureEffectBreaksTaken).toBe(1);
    expect(metrics.futureEffectBreaksSkippedNoRemainingIce).toBe(1);
    expect(metrics.pumpActionsBeforeFutureEffectBreak).toBe(1);
    expect(metrics.pumpActionsThatCouldNotLeadToBreak).toBe(1);
    expect(metrics.pumpActionsThatDestroyedAccessReserve).toBe(1);
    expect(metrics.unbrokenRunEffectIgnoredBecauseNoRemainingIce).toBe(1);
    expect(metrics.unbrokenRunEffectAppliedToRemainingPath).toBe(1);
  });

  it("keeps remote builds unconverted without advance score or protection progress", () => {
    const metrics = summarizeMatchProgressionMetrics([
      progressionSummary(
        [
          progressionAction("corp", 1, "install_card", "remote_1", 1, {
            installPlacement: "root",
            reasonCode: "corp.plan.remote_build",
          }),
          progressionAction("corp", 2, "play_event", undefined, 1, {
            reasonCode: "corp.plan.economy",
          }),
          progressionAction("corp", 3, "end_turn", undefined, 1),
        ],
        "plan-conversion-remote-stall-fixture",
      ),
    ]);

    expect(metrics.remoteBuildConvertedToAdvanceOrScore).toBe(0);
    expect(metrics.planIntentConverted).toBe(0);
    expect(metrics.planIntentAbandoned).toBeGreaterThanOrEqual(1);
    expect(metrics.longestNoProgressChain).toBe(3);
  });

  it("keeps plan-conversion metrics invariant to hidden-state-like trace noise", () => {
    const visibleActions = [
      progressionAction("runner", 1, "draw_card", undefined, 1, {
        runnerDrawAction: true,
        reasonCode: "runner.plan.setup_for_run",
        evidence: ["public:draw"],
      }),
      progressionAction("runner", 2, "start_run", "remote_1", 1),
      progressionAction("runner", 3, "steal_agenda", undefined, 1),
    ];
    const first = summarizeMatchProgressionMetrics([
      progressionSummary(visibleActions, "hidden-invariance-a"),
    ]);
    const second = summarizeMatchProgressionMetrics([
      progressionSummary(
        visibleActions.map((entry) => ({
          ...entry,
          evidence: ["hidden:hq_has_agenda", "hidden:rd_top_card"],
          stateHashAfter: `${entry.stateHashAfter}-other-hidden-state`,
        })),
        "hidden-invariance-b",
      ),
    ]);

    expect(second).toMatchObject({
      actionLedToProgressWithin1: first.actionLedToProgressWithin1,
      actionLedToProgressWithin2: first.actionLedToProgressWithin2,
      actionLedToProgressWithin3: first.actionLedToProgressWithin3,
      planIntentConverted: first.planIntentConverted,
      planIntentAbandoned: first.planIntentAbandoned,
      setupActionConvertedToRun: first.setupActionConvertedToRun,
      remoteContestConvertedToStealOrTrash:
        first.remoteContestConvertedToStealOrTrash,
      actionsUntilNextScoreOrSteal: first.actionsUntilNextScoreOrSteal,
      actionsUntilNextMeaningfulBoardProgress:
        first.actionsUntilNextMeaningfulBoardProgress,
      actionLimitRootCauseByMatch: first.actionLimitRootCauseByMatch,
      actionLimitDominantSide: first.actionLimitDominantSide,
      finalStrategicWindowNoProgressActions:
        first.finalStrategicWindowNoProgressActions,
      finalWindowKnownInfoExploitationOpportunities:
        first.finalWindowKnownInfoExploitationOpportunities,
      endgameCloseoutOpportunitiesRunner:
        first.endgameCloseoutOpportunitiesRunner,
    });
  });

  it("deduplicates true closeout and repeated-central windows", () => {
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "ai-central-dedupe-fixture",
        winner: "action_limit_reached",
        actions: 8,
        turns: 2,
        finalAgendaPoints: { runner: 4, corp: 0 },
        finalStateHash: "fnv1a:central-dedupe",
        eventLogLength: 8,
        replayOk: true,
        replayErrors: [],
        actionSequence: [
          progressionAction("runner", 1, "start_run", "rd", 1, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerTrueCentralCloseoutOpportunity: true,
            runnerCentralCloseoutOpportunity: true,
            runnerCentralCloseoutRunTaken: true,
            runnerCentralCloseoutReason: "interface",
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithFreshValue: true,
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunInsteadWasJustified: true,
            runnerCentralRunJustificationReason: "interface",
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 2, "start_run", "rd", 1, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerTrueCentralCloseoutOpportunity: true,
            runnerCentralCloseoutOpportunity: true,
            runnerCentralCloseoutRunTaken: true,
            runnerCentralCloseoutReason: "interface",
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithFreshValue: true,
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerCentralRunInsteadWasJustified: true,
            runnerCentralRunJustificationReason: "interface",
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_1"],
          }),
          progressionAction("runner", 3, "start_run", "hq", 2, {
            runnerCentralCloseoutOpportunityRaw: true,
            runnerCentralCloseoutSkippedWithGoodReason: true,
            runnerCentralRunRepeatWindow: true,
            runnerRepeatedCentralRunWithoutFreshValue: true,
            runnerRepeatedLowValueCentralRun: true,
            runnerCentralRunStalePenaltyApplied: true,
            runnerNoFreshCentralServerIds: ["hq"],
            runnerNoFreshCentralRunTaken: true,
            runnerNoFreshCentralBetterAlternativeTypes: [
              "economy",
              "remote_contest",
            ],
            runnerStaleCentralAllowedReason: "central_open",
            runnerCentralRunInsteadOfContestableAdvancedRemote: true,
            runnerContestableAdvancedRemoteThreatServerIds: ["remote_2"],
          }),
          progressionAction("runner", 4, "play_event", undefined, 3, {
            runnerNoFreshCentralServerIds: ["rd"],
            runnerNoFreshCentralBetterAlternativeTypes: ["economy"],
            runnerNoFreshCentralSubstitutionType: "economy",
          }),
        ],
        errors: [],
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: {
          illegalActions: 0,
          fallbackRate: 0,
          timeoutRate: 0,
          reasonCodeCoverage: [],
          actionTypeCoverage: [],
          roleCoverage: [],
          progressScore: 0,
          holdout: false,
          doctrine: {
            nakedAgendaInstalls: 0,
            agendaFloodExposure: 0,
            scoreWindowMissed: 0,
            remoteOverbuild: 0,
            economyStall: 0,
            repeatedLowValueCentralRun: 0,
            rigStall: 0,
            assetTrashNeglect: 0,
          },
        },
      },
    ]);

    expect(metrics.centralCloseoutOpportunitiesRaw).toBe(2);
    expect(metrics.trueCentralCloseoutOpportunities).toBe(1);
    expect(metrics.centralCloseoutOpportunitiesDeduped).toBe(1);
    expect(metrics.centralCloseoutRunsTaken).toBe(1);
    expect(metrics.centralCloseoutFalsePositiveRate).toBe(0.5);
    expect(metrics.centralRunRepeatWindowsRaw).toBe(3);
    expect(metrics.centralRunRepeatWindowsDeduped).toBe(2);
    expect(metrics.repeatedCentralRunsWithFreshValue).toBe(1);
    expect(metrics.repeatedCentralRunsWithoutFreshValue).toBe(1);
    expect(metrics.centralRunInsteadUnjustified).toBe(1);
    expect(metrics.centralRunJustifiedByInterface).toBe(1);
    expect(metrics.centralRunStalePenaltyApplied).toBe(1);
    expect(metrics.noFreshCentralWindows).toBe(2);
    expect(metrics.noFreshCentralRunsTaken).toBe(1);
    expect(metrics.noFreshCentralSubstitutions).toBe(1);
    expect(metrics.noFreshCentralSubstitutionRate).toBe(0.5);
    expect(metrics.noFreshCentralSubstitutionEconomy).toBe(1);
    expect(metrics.noFreshCentralWithBetterAlternative).toBe(2);
    expect(metrics.staleCentralChosenDespiteEconomy).toBe(1);
    expect(metrics.staleCentralChosenDespiteRemoteContest).toBe(1);
    expect(metrics.staleCentralAllowedWithReason).toBe(1);
    expect(metrics.staleCentralAllowedCentralOpen).toBe(1);
    expect(metrics.alternativeChosenAfterStaleCentralPenalty).toBe(1);
  });

  it("analyzes doctrine quality case examples without private state", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: true,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 24,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const analysis = analyzeDoctrineQualityCases(
      benchmark.candidateRun.summaries,
      { maxExamplesPerMetric: 2 },
    );
    const report = formatDoctrineQualityCaseAnalysisReport(analysis);

    expect(analysis.version).toBe("ai-deck-doctrine-case-analysis-v1");
    expect(analysis.maxExamplesPerMetric).toBe(2);
    expect(analysis.redactionSafe).toBe(true);
    expect(analysis.totals).toEqual(benchmark.candidate);
    expect(analysis.examples.economyStall.length).toBeLessThanOrEqual(2);
    expect(
      analysis.examples.economyStall.every(
        (example) => example.actionType !== "decline_rez",
      ),
    ).toBe(true);
    expect(
      analysis.examples.economyStall.every(
        (example) =>
          example.reasonCode !== "corp.plan.recover_economy" &&
          example.reasonCode !== "runner.plan.recover_economy",
      ),
    ).toBe(true);
    expect(
      analysis.examples.economyStall.every(
        (example) =>
          ![
            "access_card",
            "break_subroutine",
            "continue_run",
            "pump_breaker",
            "steal_agenda",
          ].includes(example.actionType),
      ),
    ).toBe(true);
    expect(
      analysis.examples.agendaFloodExposure.every(
        (example) =>
          ![
            "decline_rez",
            "end_turn",
            "mandatory_draw",
            "resolve_choice",
            "rez_ice",
          ].includes(example.actionType),
      ),
    ).toBe(true);
    expect(
      analysis.examples.agendaFloodExposure.every(
        (example) =>
          example.reasonCode !== "corp.plan.protect_hq" &&
          example.reasonCode !== "corp.plan.protect_rnd",
      ),
    ).toBe(true);
    expect(
      analysis.examples.rigStall.every(
        (example) => !(example.targetServerId ?? "").startsWith("remote_"),
      ),
    ).toBe(true);
    expect(report).toContain("## Examples");
    expect(report).toContain("### economyStall");
    expect(JSON.stringify({ analysis, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("evaluates holdout tuning gate for regression and improvement", () => {
    const baseline: Parameters<typeof evaluateV143TuningGate>[0] = {
      simulationId: "baseline",
      benchmarkProfile: "current_candidate",
      games: 20,
      illegalActions: 0,
      timeouts: 0,
      fallbackRate: 0.2,
      winRates: {
        runner: 0.45,
        corp: 0.45,
        draw: 0.1,
        action_limit_reached: 0,
      },
      agendaPoints: { runner: 35, corp: 38 },
      averageActions: 55,
      replayFailures: 0,
      notableExploitRefs: [],
      summaries: [],
    };
    const regressed = {
      ...baseline,
      simulationId: "regressed",
      illegalActions: 1,
    };
    const improved = {
      ...baseline,
      simulationId: "improved",
      fallbackRate: 0.15,
      winRates: { ...baseline.winRates, runner: 0.5 },
    };

    const gateRegression = evaluateV143TuningGate(regressed, baseline);
    const gateImproved = evaluateV143TuningGate(improved, baseline);

    expect(gateRegression.accepted).toBe(false);
    expect(gateRegression.reason).toBe(
      "holdout_regression_on_safety_or_replay",
    );
    expect(gateImproved.accepted).toBe(true);
    expect(gateImproved.reason).toBe("holdout_improved_or_stable");
  });

  it("runs persistent exploit fixtures as deterministic regression checks", () => {
    const fixtures = listV143ExploitFixtures();
    const results = runV143ExploitRegressionFixtures({
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 80,
    });

    expect(results.map((result) => result.fixtureId).sort()).toEqual(
      fixtures.map((fixture) => fixture.fixtureId).sort(),
    );
    expect(results.every((result) => result.passed)).toBe(true);
    expect(
      results.find(
        (result) => result.fixtureId === "v143-rnd-repeat-access-freshness",
      )?.message,
    ).toBe("ok:selected_gain_credit_on_stale_rnd_top");
    expect(JSON.stringify(results)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  });

  it("boosts a repeat R&D run after the top card was stolen and therefore freshened", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-fresh-after-agenda-steal",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D fresh repeat fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-fresh-steal-access",
          100,
          "rd",
          "simple_agenda",
        ),
        syntheticPlanActionEvent(
          "ai-rnd-fresh-steal",
          101,
          "runner",
          "steal_agenda",
          "rd",
          { cardDefinitionId: "simple_agenda" },
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness?.freshness).toBe(
      "fresh_after_top_removed",
    );
    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.freshenedByRunnerAccess,
    ).toBe(true);
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|FullState/,
    );
  });

  it("suppresses an immediate normal R&D repeat when a known non-agenda top card stayed in place", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-stale-known-nonagenda",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D stale repeat fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-stale-operation-access",
          100,
          "rd",
          "simple_economy_operation",
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_economy_operation",
      knownTopIsAgenda: false,
    });
    expect(selected?.type).toBe("gain_credit");
    expect(decision.reasonCode).not.toBe("runner.plan.pressure_rnd");
  });

  it("keeps R&D pressure high when a known top agenda remains accessible", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-stale-known-agenda",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D agenda top fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticCentralAccessEvent(
          "ai-rnd-agenda-top-access",
          100,
          "rd",
          "simple_agenda",
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "stale_known_same_top",
      knownTopDefinitionId: "simple_agenda",
      knownTopIsAgenda: true,
    });
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
  });

  it("advances a legally known R&D top sequence after the first card is removed", () => {
    const baseInput = runnerActionPhaseInput(
      "ai-rnd-known-sequence-advances",
      (state) => {
        state.runner.credits = 8;
        state.corp.credits = 0;
      },
    );
    const rdRun = baseInput.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const gain = baseInput.legalActions.find(
      (action) => action.type === "gain_credit",
    );
    expect(rdRun).toBeDefined();
    expect(gain).toBeDefined();
    if (!rdRun || !gain)
      throw new Error("Missing R&D sequence fixture actions");

    const input = {
      ...baseInput,
      profileId: "current_candidate",
      eventTail: [
        ...baseInput.eventTail,
        syntheticRndPrivateLookEvent("ai-rnd-sequence-look", 100, [
          "simple_economy_operation",
          "simple_agenda",
        ]),
        syntheticPlanActionEvent(
          "ai-rnd-sequence-trash-top",
          101,
          "runner",
          "trash_accessed_card",
          "rd",
          { cardDefinitionId: "simple_economy_operation" },
        ),
      ],
      legalActions: [rdRun, gain],
    } satisfies AiDecisionInput;

    const belief = reconstructBeliefState(input);
    const decision = chooseRunnerAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    const rdTop = belief.knownPositionMemory?.find(
      (entry) => entry.zone === "rd" && entry.positionKey === "top",
    );

    expect(belief.runnerOpponentModel?.rndTopFreshness).toMatchObject({
      freshness: "fresh_after_top_removed",
      knownTopDefinitionId: "simple_agenda",
      knownTopIsAgenda: true,
    });
    expect(
      belief.runnerOpponentModel?.rndTopFreshness?.knownSequenceDefinitionIds,
    ).toEqual(["simple_agenda"]);
    expect(rdTop).toMatchObject({
      definitionId: "simple_agenda",
      positionKey: "top",
    });
    expect(selected?.type).toBe("start_run");
    expect(selected?.payload?.serverId).toBe("rd");
  });

  it("summarizes R&D freshness and repeat-pressure metrics", () => {
    const actionSequence = [
      {
        side: "runner",
        actionType: "access_card",
        targetServerId: "rd",
        evidence: [],
        rndAccesses: true,
        rndAccessLeftTopCardUnchanged: true,
        rndAccessNoValueRepeatStale: true,
      },
      {
        side: "runner",
        actionType: "steal_agenda",
        targetServerId: "rd",
        evidence: [],
        rndAccessRemovedTopCard: true,
        rndAccessStoleAgenda: true,
        rndTopFreshenedByRunnerAccess: true,
        rndKnownTopAdvancedAfterAccess: true,
        rndKnownTopSequenceAdvanced: true,
      },
      {
        side: "runner",
        actionType: "start_run",
        targetServerId: "rd",
        evidence: [],
        rndRepeatRunAfterTopRemoved: true,
        rndRepeatRunBoostedByFreshTop: true,
        rndFreshTopPressureOpportunity: true,
        rndFreshTopPressureTaken: true,
        rndCloseoutOpportunityAfterTopRemoved: true,
      },
      {
        side: "runner",
        actionType: "start_run",
        targetServerId: "rd",
        evidence: [],
        rndRepeatRunAfterTopUnchanged: true,
        rndRepeatRunSuppressedBecauseKnownStaleTop: true,
        rndRepeatRunSuppressedBecauseKnownNonAgendaTop: true,
        rndStaleTopRepeatMistake: true,
      },
    ] as unknown as AiSimulationSummary["actionSequence"];
    const metrics = summarizeMatchProgressionMetrics([
      {
        seed: "ai-rnd-freshness-metrics",
        winner: undefined,
        actions: actionSequence.length,
        turns: 1,
        finalAgendaPoints: { runner: 0, corp: 0 },
        replayOk: true,
        metrics: { illegalActions: 0 },
        actionSequence,
      } as unknown as AiSimulationSummary,
    ]);

    expect(metrics.rndAccesses).toBe(1);
    expect(metrics.rndAccessRemovedTopCard).toBe(1);
    expect(metrics.rndAccessLeftTopCardUnchanged).toBe(1);
    expect(metrics.rndTopFreshenedByRunnerAccess).toBe(1);
    expect(metrics.rndKnownTopSequenceAdvanced).toBe(1);
    expect(metrics.rndRepeatRunAfterTopRemoved).toBe(1);
    expect(metrics.rndRepeatRunAfterTopUnchanged).toBe(1);
    expect(metrics.rndRepeatRunBoostedByFreshTop).toBe(1);
    expect(metrics.rndRepeatRunSuppressedBecauseKnownStaleTop).toBe(1);
    expect(metrics.rndFreshTopPressureTaken).toBe(1);
    expect(metrics.rndStaleTopRepeatMistake).toBe(1);
  });
});

describe("MVP 0.3 AI simulation harness", () => {
  it("runs deterministic AI-vs-AI simulations and replays the event log", () => {
    const first = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });
    const second = simulateAiGame({ seed: "ai-sim-golden", maxActions: 80 });

    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);
    expect(first.errors).toEqual([]);
    expect(first.replayOk).toBe(true);
    expect(first.finalStateHash).toMatch(/^fnv1a:/);
    expect(
      first.actionSequence.every((entry) => Array.isArray(entry.qualityTags)),
    ).toBe(true);
    expect(first.metrics.doctrine).toEqual(
      summarizeDoctrineQualityMetrics(first.actionSequence),
    );
    expect(JSON.stringify(first)).not.toContain("cardInstances");
    expect(JSON.stringify(first)).not.toContain("sessionToken");
  });

  it("selects Corp LegalActions in a root-rez window even when activeSide is runner", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-sim-root-rez-active-runner" }),
    );
    state.corp.credits = 5;
    putCorpRootInRemote(state, "simple_economy_asset", 0);
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
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

    expect(state.activeSide).toBe("runner");
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(getLegalActions(state, "runner")).toEqual([]);
    expect(
      getLegalActions(state, "corp")
        .map((action) => action.type)
        .sort(),
    ).toEqual(["decline_rez", "rez_ice"]);

    const selection = selectAiDecisionSideForState(state);
    expect(selection.side).toBe("corp");
    expect(selection.legalActions.map((action) => action.type).sort()).toEqual([
      "decline_rez",
      "rez_ice",
    ]);
    const input = buildAiDecisionInput(state, selection.side!, {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.0-normal",
    });
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(selected).toBeDefined();
    if (!selected) throw new Error("Missing selected root-rez legal action");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: selection.side!,
      actionId: selected.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: "ai-sim-root-rez-active-runner",
    });
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  });

  it("summarizes doctrine quality error classes from redaction-safe action tags", () => {
    const metrics = summarizeDoctrineQualityMetrics([
      {
        side: "corp",
        stateVersionBefore: 1,
        actionType: "install_card",
        reasonCode: "corp.plan.build_scoring_remote",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "new_remote",
        qualityTags: ["agenda_flood_exposure", "naked_agenda_install"],
        stateHashAfter: "fnv1a:metric001",
      },
      {
        side: "runner",
        stateVersionBefore: 2,
        actionType: "start_run",
        reasonCode: "runner.plan.pressure_rnd",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "rd",
        qualityTags: ["rig_stall"],
        stateHashAfter: "fnv1a:metric002",
      },
      {
        side: "runner",
        stateVersionBefore: 3,
        actionType: "start_run",
        reasonCode: "runner.plan.pressure_rnd",
        explanation: "metric fixture",
        confidence: 0.7,
        evidence: [],
        fallbackUsed: false,
        timeoutUsed: false,
        targetServerId: "rd",
        qualityTags: ["asset_trash_neglect"],
        stateHashAfter: "fnv1a:metric003",
      },
    ]);

    expect(metrics).toMatchObject({
      nakedAgendaInstalls: 1,
      agendaFloodExposure: 1,
      repeatedLowValueCentralRun: 1,
      rigStall: 1,
      assetTrashNeglect: 1,
    });
    expect(JSON.stringify(metrics)).not.toMatch(
      /cardInstances|privatePayload|simple_agenda|simple_run_event/,
    );
  });

  it("keeps a replayable long smoke run through public AI actions", () => {
    let state = createGameAfterSetup({ seed: "ai-long-smoke" });
    const initial = structuredClone(state);
    for (let step = 0; step < 60 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
        idempotencyKey: `ai-smoke-${step}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }
    expect(replayEvents(initial, state.eventLog).ok).toBe(true);
  });

  it("keeps V1.1.2K local O:NR release cards inside side-safe AI LegalAction smokes", () => {
    let state = createGameAfterSetup({
      seed: "ai-v112k-card-release",
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: ONR_V1_1_2K_CORP_DECK,
      agendaPointsToWin: 7,
    });
    const initial = structuredClone(state);

    for (let step = 0; step < 50 && !state.winner; step += 1) {
      const side = state.activeSide;
      const input = buildAiDecisionInput(state, side, { actionNumber: step });
      expect(assertAiInputIsSideSafe(input)).toBe(true);
      expect(JSON.stringify(input)).not.toContain("cardInstances");
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(decision.selectedChoices
          ? { selectedChoices: decision.selectedChoices }
          : {}),
        idempotencyKey: `ai-v112k-${step}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }

    expect(replayEvents(initial, state.eventLog).ok).toBe(true);
  });

  it("passes V1.2.0 Event Modification windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v120-event-modification",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Prevention");
    expect(JSON.stringify(corpInput)).not.toContain("v120_damage_prevent");
  });

  it("passes V1.2.1 Replacement windows through side-safe LegalActions fallback", () => {
    let state = createGameAfterSetup({
      seed: "ai-v121-replacement",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const runnerDecision = chooseRunnerAction(runnerInput);
    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const serializedDecision = JSON.stringify(runnerDecision);

    expect(runnerInput.playerView.pendingChoice?.source).toBe(
      "v121.replacement.damage",
    );
    expect(runnerInput.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(runnerDecision.selectedChoices).toEqual({
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds: ["pass"],
    });
    expect(runnerDecision.reasonCode).toBe("runner.choice.resolve");
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
    expect(corpInput.playerView.pendingChoice).toBeUndefined();
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(serializedDecision).not.toContain("Test-only Damage Replacement");
    expect(JSON.stringify(corpInput)).not.toContain("v121_damage_replace");
  });

  it("keeps V1.2.2 hidden Special Zones out of AI input", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v122-special-zone" }),
    );
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      setAside: { visibility: "hidden", reason: "ai_v122_hidden_set_aside" },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );

    const corpInput = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
    });
    const runnerInput = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const corpSerialized = JSON.stringify(corpInput);

    expect(corpInput.playerView.specialZones?.setAside[0]).toMatchObject({
      known: false,
    });
    expect(corpSerialized).not.toContain("Simple Economy Event");
    expect(corpSerialized).not.toContain("simple_economy_event");
    expect(corpSerialized).not.toContain(cardId);
    expect(assertAiInputIsSideSafe(corpInput)).toBe(true);
    expect(assertAiInputIsSideSafe(runnerInput)).toBe(true);
  });

  it("uses LegalActions-only fallback for V1.2.2 control-change windows", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "ai-v122-control-fallback" }),
    );
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      controlChange: {
        newController: "corp",
        visibility: "private_to_side",
        reason: "ai_v122_control_change",
      },
    };
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const specialOnly = {
      ...input,
      legalActions: input.legalActions.filter(
        (action) => action.type === "change_card_control",
      ),
    };
    const decision = chooseRunnerAction(specialOnly);

    expect(specialOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(specialOnly.legalActions[0]?.actionId);
    expect(decision.fallbackUsed).toBe(true);
    expect(decision.reasonCode).toBe("fallback.first_legal_action");
    expect(JSON.stringify(decision)).not.toContain("Simple Economy Event");
    expect(assertAiInputIsSideSafe(specialOnly)).toBe(true);
  });

  it("keeps V1.2.3 cards out of the seeded AI deck pool while allowing AI approval for custom deckbuilding", () => {
    const serializedPool = JSON.stringify(aiDeckPoolData);
    const snapshots = snapshotsData08.snapshots as Array<{
      deckSnapshotId: string;
      cards: Array<{ cardId: string }>;
    }>;
    const runtimeCardsById = createRuntimeCardsById();

    expect(serializedPool).not.toContain("demo_runner_123_snapshot_v1_2_3");
    expect(serializedPool).not.toContain("demo_corp_123_snapshot_v1_2_3");
    for (const cardId of ONR_V1_2_3_CARD_IDS) {
      expect(serializedPool).not.toContain(cardId);
      expect(runtimeCardsById[cardId]?.statuses.ai_supported).toBe(true);
    }
    for (const entry of aiDeckPoolData.entries) {
      const snapshot = snapshots.find(
        (candidate) => candidate.deckSnapshotId === entry.snapshotId,
      );
      expect(snapshot, entry.snapshotId).toBeDefined();
      for (const card of snapshot?.cards ?? []) {
        expect(
          runtimeCardsById[card.cardId]?.statuses.ai_supported,
          card.cardId,
        ).toBe(true);
      }
    }
  });

  it("marks every active support AI group as AI-supported for custom AI deckbuilding", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const groupCardIds = ACTIVE_CARD_SUPPORT_AI_GROUPS.flatMap(
      (group) => group.cardIds,
    );

    expect([...new Set(groupCardIds)].sort()).toEqual(
      [...activeAiApprovedCardIds].sort(),
    );
    for (const group of ACTIVE_CARD_SUPPORT_AI_GROUPS) {
      expect(group.cardIds.length, group.approvalId).toBeGreaterThan(0);
      for (const cardId of group.cardIds) {
        const card = runtimeCardsById[cardId];
        expect(card, cardId).toBeDefined();
        expect(card?.statuses.human_playable, cardId).toBe(true);
        expect(card?.statuses.deck_legal, cardId).toBe(true);
        expect(card?.statuses.format_legal, cardId).toBe(true);
        expect(card?.statuses.ai_supported, cardId).toBe(true);
      }
    }
  });

  it("keeps V1.2.3 card actions legal and side-safe after AI approval", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v123-human-only-mit",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_2_3_RUNNER_DECK,
        corpDeck: ONR_V1_2_3_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    moveRunnerCardToGrip(state, "onr_v1_101_mit-west-tier");
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
    });
    const mitOnly = {
      ...input,
      legalActions: input.legalActions
        .filter(
          (action) =>
            action.type === "play_event" &&
            sourceDefinition(state, action) === "onr_v1_101_mit-west-tier",
        )
        .slice(0, 1),
    };
    const decision = chooseRunnerAction(mitOnly);

    expect(mitOnly.legalActions).toHaveLength(1);
    expect(decision.actionId).toBe(mitOnly.legalActions[0]?.actionId);
    expect(decision.reasonCode.length).toBeGreaterThan(0);
    expect(assertAiInputIsSideSafe(mitOnly)).toBe(true);
    expect(JSON.stringify(decision)).not.toContain("Dwarf");
    expect(JSON.stringify(decision)).not.toContain("MIT West Tier");
    expect(JSON.stringify(mitOnly)).not.toContain("cardInstances");
  });

  it("runs V0.4 expanded decks through the simulation harness", () => {
    const summary = simulateAiGame({
      seed: "ai-v04-expanded",
      runnerDeckId: "demo_runner_004",
      corpDeckId: "demo_corp_004",
      agendaPointsToWin: 7,
      maxActions: 140,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("runs V0.8 starter decks through side-safe AI smokes", () => {
    const summaries = [
      "ai-v08-starter-a",
      "ai-v08-starter-b",
      "ai-v08-starter-c",
    ].map((seed) =>
      simulateAiGame({
        seed,
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
        agendaPointsToWin: 7,
        maxActions: 180,
      }),
    );

    for (const summary of summaries) {
      expect(summary.cardPoolVersion).toBe("0.99.0");
      expect(summary.errors).toEqual([]);
      expect(summary.replayOk).toBe(true);
      expect(summary.finalStateHash).toMatch(/^fnv1a:/);
      expect(
        summary.actionSequence.every((entry) => entry.reasonCode.length > 0),
      ).toBe(true);
      expect(JSON.stringify(summary)).not.toContain("cardInstances");
      expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
    }
  }, 10_000);

  it("runs V0.97 Run/Breach decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v097-run-breach",
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
      agendaPointsToWin: 7,
      maxActions: 180,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
  });

  it("runs V0.98 Identity decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v098-identity",
      runnerDeckId: "demo_runner_098",
      corpDeckId: "demo_corp_098",
      agendaPointsToWin: 7,
      maxActions: 180,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
  });

  it("runs V0.99 Counter/Hosting decks through side-safe AI smokes", () => {
    const summary = simulateAiGame({
      seed: "ai-v099-counter-hosting",
      runnerDeckId: "demo_runner_099",
      corpDeckId: "demo_corp_099",
      agendaPointsToWin: 7,
      maxActions: 200,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.finalStateHash).toMatch(/^fnv1a:/);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
  });
});

describe("MVP 0.9 stronger AI", () => {
  it("adds side-safe evidence and quality metrics to V0.8 simulations", () => {
    const summary = simulateAiGame({
      seed: "ai-v09-metrics",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
      runnerDifficulty: "hard",
      corpDifficulty: "hard",
      maxActions: 160,
    });

    expect(summary.cardPoolVersion).toBe("0.99.0");
    expect(summary.errors).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.metrics.illegalActions).toBe(0);
    expect(summary.metrics.timeoutRate).toBe(0);
    expect(summary.metrics.reasonCodeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(summary.metrics.actionTypeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(
      summary.actionSequence.every(
        (entry) => entry.confidence >= 0 && entry.evidence.length > 0,
      ),
    ).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("cardInstances");
    expect(JSON.stringify(summary)).not.toContain("v08_project_agenda_1");
  });

  it("keeps hidden-state variants from changing visible decisions", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({
        seed: "ai-v09-hidden",
        runnerDeckId: "demo_runner_008",
        corpDeckId: "demo_corp_008",
        agendaPointsToWin: 7,
      }),
    );
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "runner-ai-v0.9-hard",
    });
    const variant = {
      ...input,
      eventTail: input.eventTail.map((event) => ({
        ...event,
        stateHashAfter: "fnv1a:hiddenvariant",
      })),
    };

    expect(chooseRunnerAction(variant)).toEqual(chooseRunnerAction(input));
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("reconstructs observed facts without private decklists", () => {
    const state = createGameAfterSetup({
      seed: "ai-v09-observed",
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
    });
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v0.9-normal",
    });
    const facts = buildObservedFacts(input);

    expect(facts.publicServers).toContain("rd");
    expect(facts.agendaPoints.own).toBe(0);
    expect(JSON.stringify(facts)).not.toContain("cardInstances");
    expect(JSON.stringify(facts)).not.toContain("v08_burst_credit_event");
  });

  it("runs the V0.9 soak matrix with holdout accounting", () => {
    const soak = simulateAiSoak({ maxActions: 60 });

    expect(soak.aggregate.seeds).toBe(27);
    expect(soak.aggregate.illegalActions).toBe(0);
    expect(soak.aggregate.replayFailures).toBe(0);
    expect(soak.aggregate.timeoutRate).toBe(0);
    expect(soak.aggregate.reasonCodeCoverage.length).toBeGreaterThanOrEqual(4);
    expect(soak.aggregate.holdoutSeeds).toEqual([
      "ai-v09-holdout-001",
      "ai-v09-holdout-002",
      "ai-v09-holdout-003",
    ]);
    expect(JSON.stringify(soak)).not.toContain("cardInstances");
  }, 60_000);
});

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - AI Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - AI Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - AI Core Damage Harness",
  cards: [
    ...V094_CORP_DECK.cards,
    { id: "v111_core_damage_operation", quantity: 2 },
  ],
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - AI Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 },
  ],
};

const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - AI Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

const CORP_TAG_SLICE_RUNNER_DECK: DeckDefinition = {
  id: "ai_corp_tag_slice_runner",
  name: "AI Corp Tag Slice Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

const CORP_TAG_SLICE_CORP_DECK: DeckDefinition = {
  id: "ai_corp_tag_slice_corp",
  name: "AI Corp Tag Slice Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 2 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 2 },
    { id: "onr_v1_243_fetch-4-0-1", quantity: 2 },
    { id: "onr_v1_249_hunter", quantity: 2 },
    { id: "onr_v1_306_trojan-horse", quantity: 1 },
  ],
};

const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v112k_runner",
  name: "AI O:NR V1.1.2K Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v112k_corp",
  name: "AI O:NR V1.1.2K Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

const ONR_V1_2_3_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_297_overtime-incentives",
] as const;

const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v123_runner",
  name: "AI O:NR V1.2.3 Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_039_krash", quantity: 2 },
    { id: "onr_v1_066_snowball", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "onr_v1_081_custodial-position", quantity: 1 },
    { id: "onr_v1_085_executive-wiretaps", quantity: 1 },
    { id: "onr_v1_101_mit-west-tier", quantity: 2 },
  ],
};

const ONR_V1_2_3_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v123_corp",
  name: "AI O:NR V1.2.3 Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_297_overtime-incentives", quantity: 3 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_261_quandary", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_259_in-the-face", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 1 },
  ],
};

const V1911_RUNNER_DECK: DeckDefinition = {
  id: "ai_onr_v1911_runner",
  name: "AI O:NR V1.9.11 Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

const V1911_CORP_DECK: DeckDefinition = {
  id: "ai_onr_v1911_corp",
  name: "AI O:NR V1.9.11 Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_272_too-many-doors", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_barrier_ice", quantity: 2 },
  ],
};

function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function v095ResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

function installedResourceCorpTurn(seed: string): GameState {
  let state = toRunnerTurn(v095ResourceGame(seed));
  state.runner.credits = 6;
  moveRunnerCardToGrip(state, "v095_safehouse_resource");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "v095_safehouse_resource",
  );
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.runner.tags = 1;
  return state;
}

function traceCorpBidState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7,
    }),
  );
  putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
  state.corp.credits = 8;
  state.runner.credits = 5;
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
      sourceDefinition(state, action) === "v096_trace_probe_ice",
  );
  return apply(state, "runner", (action) => action.type === "continue_run");
}

function corpActionPhaseInput(
  seed: string,
  mutate: (state: GameState) => void,
) {
  let state = createGameAfterSetup({ seed });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function corpFutureIceOrderingInput(
  seed: string,
  hqDefinitionIds: string[],
  mutate?: (state: GameState) => void,
): AiDecisionInput {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: `ai_corp_future_ice_runner_${seed}`,
      name: "AI Corp Future ICE Ordering Runner Fixture",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_corp_future_ice_corp_${seed}`,
      name: "AI Corp Future ICE Ordering Corp Fixture",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_economy_operation", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_code_gate_ice", quantity: 4 },
        { id: "onr_v1_222_ball-and-chain", quantity: 2 },
        { id: "onr_v1_224_bolter-cluster", quantity: 1 },
        { id: "onr_v1_225_canis-major", quantity: 1 },
        { id: "onr_v1_226_canis-minor", quantity: 1 },
        { id: "onr_v1_234_data-darts", quantity: 1 },
        { id: "onr_v1_242_fatal-attractor", quantity: 1 },
        { id: "onr_v1_274_tutor", quantity: 1 },
        { id: "onr_v1_276_viral-15", quantity: 1 },
        { id: "onr_v1_277_virizz", quantity: 1 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  ensureRemoteServer(state, "remote_1");
  state.corp.credits = 12;
  state.corp.clicks = 3;
  for (const definitionId of hqDefinitionIds) {
    moveCorpCardToHq(state, definitionId);
  }
  mutate?.(state);
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function corpScoredAgendaAbilityInput(
  seed: string,
  definitionId: string,
  options: {
    credits?: number;
    clicks?: number;
    runnerTagged?: boolean;
    counters?: Partial<
      NonNullable<GameState["cardInstances"][string]["counters"]>
    >;
    mutate?: (state: GameState) => void;
  } = {},
) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
    corpDeck: {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: `ai_scored_agenda_corp_${seed}`,
      name: "AI Scored Agenda Corp Fixture",
      cards: [
        { id: definitionId, quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
          (entry) => entry.id !== definitionId,
        ),
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  const agendaId = putCorpCardInScoreArea(state, definitionId);
  state.cardInstances[agendaId] = {
    ...state.cardInstances[agendaId]!,
    counters: {
      ...(state.cardInstances[agendaId]?.counters ?? {}),
      ...(options.counters ?? {}),
    },
  };
  state.corp.credits = options.credits ?? 2;
  state.corp.clicks = options.clicks ?? 3;
  state.runner.tags = options.runnerTagged ? 1 : 0;
  options.mutate?.(state);
  return {
    state,
    agendaId,
    input: buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      profileId: "corp-ai-v1.4.2-normal",
    }),
  };
}

function installedCorpBbsEconomyInput(seed: string, bbsBits: number[] = [16]) {
  let state = createGameAfterSetup({
    seed,
    baseline: CURRENT_RULES_BASELINE,
    runnerDeck: {
      id: `installed_corp_bbs_runner_${seed}`,
      name: "Installed Corp BBS Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `installed_corp_bbs_corp_${seed}`,
      name: "Installed Corp BBS Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        {
          id: "onr_v1_309_bbs-whispering-campaign",
          quantity: bbsBits.length,
        },
        { id: "simple_agenda", quantity: 4 },
        { id: "simple_economy_operation", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 2 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  bbsBits.forEach((bitCount, index) => {
    putInstalledCorpBbsInRemote(state, `remote_${index + 1}`, bitCount);
  });
  state.corp.credits = 2;
  state.corp.clicks = 3;
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.0-normal",
  });
}

function putInstalledCorpBbsInRemote(
  state: GameState,
  serverId: `remote_${number}`,
  bitCount: number,
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error(`Missing ${serverId}`);
  const bbsEntry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === "onr_v1_309_bbs-whispering-campaign" &&
      !state.corp.servers.some((candidate) =>
        candidate.root.includes(id as CardInstanceId),
      ),
  );
  if (!bbsEntry) throw new Error("Missing BBS Whispering Campaign copy");
  const bbsId = bbsEntry[0] as CardInstanceId;
  removeEverywhere(state, bbsId);
  server.root.push(bbsId);
  state.cardInstances[bbsId] = {
    ...state.cardInstances[bbsId]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: true,
    rezzed: true,
    counters: { bit: bitCount },
    advancementCounters: 0,
  };
  return bbsId;
}

function runnerActionPhaseInput(
  seed: string,
  mutate: (state: GameState) => void,
  config: CreateGameConfig = {},
) {
  const state = toRunnerTurn(createGameAfterSetup({ seed, ...config }));
  mutate(state);
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function runnerCentralPressureDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_central_pressure_runner_${idSuffix}`,
      name: "AI Central Pressure Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_139_r-and-d-interface", quantity: 3 },
        { id: "onr_v1_129_hq-interface", quantity: 3 },
        { id: "onr_v1_081_custodial-position", quantity: 3 },
        { id: "onr_v1_085_executive-wiretaps", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_central_pressure_corp_${idSuffix}`,
      name: "AI Central Pressure Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function runnerCoverageSearchDeckConfig(idSuffix: string): CreateGameConfig {
  return {
    runnerDeck: {
      id: `ai_coverage_search_runner_${idSuffix}`,
      name: "AI Coverage Search Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "v098_stack_search_event", quantity: 3 },
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: `ai_coverage_search_corp_${idSuffix}`,
      name: "AI Coverage Search Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function hqMemoryDeckConfig(
  idSuffix: string,
  includeExpertScheduleAnalyzer = false,
): CreateGameConfig {
  const runnerCards = [
    ...(includeExpertScheduleAnalyzer
      ? [{ id: "onr_v1_024_expert-schedule-analyzer", quantity: 1 }]
      : []),
    { id: "onr_v1_139_r-and-d-interface", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "simple_fracter", quantity: 3 },
    { id: "simple_decoder", quantity: 3 },
    { id: "simple_economy_event", quantity: 8 },
  ];
  return {
    runnerDeck: {
      id: `ai_hq_memory_runner_${idSuffix}`,
      name: "AI HQ Memory Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: runnerCards,
    },
    corpDeck: {
      id: `ai_hq_memory_corp_${idSuffix}`,
      name: "AI HQ Memory Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 6 },
        { id: "simple_barrier_ice", quantity: 4 },
        { id: "simple_code_gate_ice", quantity: 4 },
        { id: "simple_economy_operation", quantity: 8 },
      ],
    },
  };
}

function runnerProgramTrashChoiceInput(
  seed: string,
  options: {
    sourceDefinitionId: string;
    installedDefinitionIds: string[];
    memoryUsed: number;
    memoryLimit: number;
  },
): {
  input: AiDecisionInput;
  optionIdsByDefinition: Record<string, string>;
} {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `runner_program_trash_choice_${seed}`,
        name: "Runner Program Trash Choice Fixture",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "simple_decoder", quantity: 3 },
          { id: "simple_fracter", quantity: 3 },
          { id: "simple_killer", quantity: 2 },
          { id: "v099_virus_program", quantity: 3 },
          { id: "simple_economy_event", quantity: 4 },
        ],
      },
      corpDeck: {
        id: `runner_program_trash_choice_corp_${seed}`,
        name: "Runner Program Trash Choice Corp Fixture",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_barrier_ice", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  const sourceCardId = moveRunnerCardToGrip(state, options.sourceDefinitionId);
  const installedCardIds = options.installedDefinitionIds.map((definitionId) =>
    moveRunnerProgramToRig(state, definitionId),
  );
  state.runner.memoryUsed = options.memoryUsed;
  state.runner.memoryLimit = options.memoryLimit;
  state.pendingChoice = {
    choiceId: `runner_program_trash_before_install_${state.stateVersion}`,
    side: "runner",
    source: `runner_program_trash_before_install:${sourceCardId}:${state.stateVersion}`,
    prompt: "Programme vor Installation trashen",
    kind: "select_cards",
    options: installedCardIds.map((cardId) => {
      const definition =
        DEMO_CARDS_BY_ID[state.cardInstances[cardId]!.definitionId]!;
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
      };
    }),
    minSelections: 0,
    maxSelections: installedCardIds.length,
    stateVersion: state.stateVersion,
    visibility: "hidden_info_barrier",
  };
  return {
    input: buildAiDecisionInput(state, "runner", {
      difficulty: "normal",
      profileId: "runner-ai-v1.4.2-normal",
    }),
    optionIdsByDefinition: Object.fromEntries(
      installedCardIds.map((cardId) => [
        state.cardInstances[cardId]!.definitionId,
        `card_${cardId}`,
      ]),
    ),
  };
}

function runnerShellTradersState(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: {
        id: `ai_shell_traders_runner_${seed}`,
        name: "AI Shell Traders Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_176_the-shell-traders", quantity: 2 },
          { id: "simple_fracter", quantity: 2 },
          { id: "simple_setup_hardware", quantity: 1 },
          { id: "simple_economy_event", quantity: 8 },
        ],
      },
      corpDeck: {
        id: `ai_shell_traders_corp_${seed}`,
        name: "AI Shell Traders Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 4 },
          { id: "simple_economy_operation", quantity: 6 },
          { id: "simple_barrier_ice", quantity: 2 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
}

function runnerShellTradersInput(
  seed: string,
  mutate: (state: GameState) => void,
) {
  const state = runnerShellTradersState(seed);
  mutate(state);
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function installedRunnerEconomyInput(
  seed: string,
  options: {
    brokerCounters?: number;
    shortTermCounters?: number;
    credits: number;
  },
) {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `installed_runner_economy_${seed}`,
        name: "Installed Runner Economy Fixture",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "onr_v1_154_broker", quantity: 1 },
          { id: "onr_v1_178_short-term-contract", quantity: 1 },
          { id: "simple_economy_event", quantity: 6 },
          { id: "simple_fracter", quantity: 2 },
        ],
      },
      corpDeck: {
        id: `installed_runner_economy_corp_${seed}`,
        name: "Installed Runner Economy Corp Fixture",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_agenda", quantity: 3 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_barrier_ice", quantity: 2 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  if (options.brokerCounters !== undefined) {
    const brokerId = moveRunnerResourceToRig(state, "onr_v1_154_broker");
    setHostedBitsForTest(state, brokerId, options.brokerCounters);
  }
  if (options.shortTermCounters !== undefined) {
    const shortTermId = moveRunnerResourceToRig(
      state,
      "onr_v1_178_short-term-contract",
    );
    setHostedBitsForTest(state, shortTermId, options.shortTermCounters);
  }
  state.runner.credits = options.credits;
  state.runner.clicks = 3;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function runnerJackOutInput(seed: string) {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7,
    }),
  );
  putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
  state.corp.credits = 8;
  state.runner.credits = 5;
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
      sourceDefinition(state, action) === "v096_trace_probe_ice",
  );
  state = apply(state, "runner", (action) => action.type === "continue_run");
  state = applyChoice(state, "corp", ["bid_0"]);
  state = applyChoice(state, "runner", ["bid_2"]);
  state = apply(state, "runner", (action) => action.type === "continue_run");
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function withPublicServerEventTail(
  input: ReturnType<typeof buildAiDecisionInput>,
  servers: string[],
) {
  const eventTail: PublicGameEvent[] = servers.map((serverId, index) => ({
    eventId: `v140-visible-event-${index}`,
    type: serverId.startsWith("remote_")
      ? "install_remote_card"
      : "run_started",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `fnv1a:v140${index}`,
    visibilityClass: "public",
    publicPayload: { serverId },
  }));
  return { ...input, eventTail };
}

function progressionAction(
  side: Side,
  stateVersionBefore: number,
  actionType: LegalAction["type"],
  targetServerId: string | undefined,
  turnNumber: number,
  extra: Partial<AiSimulationSummary["actionSequence"][number]> = {},
): AiSimulationSummary["actionSequence"][number] {
  return {
    side,
    stateVersionBefore,
    actionType,
    eventType: actionType,
    timingPoint: "main",
    turnNumber,
    reasonCode: `${side}.fixture.${actionType}`,
    explanation: "progression metric fixture",
    confidence: 0.8,
    evidence: [],
    fallbackUsed: false,
    timeoutUsed: false,
    ...(targetServerId ? { targetServerId } : {}),
    qualityTags: [],
    stateHashAfter: `fnv1a:progression${stateVersionBefore}`,
    ...extra,
  };
}

function progressionSummary(
  actionSequence: AiSimulationSummary["actionSequence"],
  seed = "plan-conversion-fixture",
): AiSimulationSummary {
  return {
    seed,
    winner: "action_limit_reached",
    actions: actionSequence.length,
    turns: Math.max(1, ...actionSequence.map((entry) => entry.turnNumber ?? 1)),
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: `fnv1a:${seed}`,
    eventLogLength: actionSequence.length,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
    metrics: {
      illegalActions: 0,
      fallbackRate: 0,
      timeoutRate: 0,
      reasonCodeCoverage: [],
      actionTypeCoverage: [],
      roleCoverage: [],
      progressScore: 0,
      holdout: false,
      doctrine: {
        nakedAgendaInstalls: 0,
        agendaFloodExposure: 0,
        scoreWindowMissed: 0,
        remoteOverbuild: 0,
        economyStall: 0,
        repeatedLowValueCentralRun: 0,
        rigStall: 0,
        assetTrashNeglect: 0,
      },
    },
  };
}

function syntheticCentralAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: "rd" | "hq" | "archives",
  cardDefinitionId: string,
): PublicGameEvent {
  const serverLabel =
    serverId === "rd" ? "R&D" : serverId === "hq" ? "HQ" : "Archives";
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId,
      serverLabel,
      cardDefinitionId,
    },
  };
}

function syntheticRemoteAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: `remote_${number}`,
  cardDefinitionId: string,
  positionKey = "root:0",
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId,
      serverLabel: serverId,
      cardDefinitionId,
      accessedCardPositionKey: positionKey,
    },
  };
}

function syntheticExposeInstalledEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: `remote_${number}` | "hq" | "rd",
  positionKey: string,
  cardDefinitionId: string,
): PublicGameEvent {
  const [area, index] = positionKey.split(":");
  return {
    eventId,
    type: "trigger_ability",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "trigger_ability",
      hiddenZoneAction: "approach_ice_expose",
      publicRevealKind: "expose",
      revealKind: "expose",
      exposedServerId: serverId,
      exposedPositionKey: positionKey,
      ...(area ? { exposedArea: area } : {}),
      ...(index !== undefined ? { exposedIndex: Number(index) } : {}),
      exposedCardDefinitionId: cardDefinitionId,
      cardDefinitionId,
    },
  };
}

function syntheticRunStartedEvent(
  eventId: string,
  stateVersionBefore: number,
  serverId: "rd" | "hq" | "archives" | "remote_1",
): PublicGameEvent {
  return {
    eventId,
    type: "run_started",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      serverId,
    },
  };
}

function syntheticPlanActionEvent(
  eventId: string,
  stateVersionBefore: number,
  side: Side,
  actionType: LegalAction["type"],
  serverId?: string,
  extra: Record<string, unknown> = {},
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: side,
      actionType,
      ...(serverId ? { serverId } : {}),
      ...extra,
    },
  };
}

function syntheticHqMemoryEvent(
  eventId: string,
  stateVersionBefore: number,
  actor: Side,
  actionType: string,
  cardDefinitionId?: string,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor,
      actionType,
      serverId: "hq",
      serverLabel: "HQ",
      ...(cardDefinitionId ? { cardDefinitionId } : {}),
    },
  };
}

function syntheticHqPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownHqDefinitionIds: string[],
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "hq",
      privateLookCount: knownHqDefinitionIds.length,
      knownHqDefinitionIds,
    },
  };
}

function syntheticRndPrivateLookEvent(
  eventId: string,
  stateVersionBefore: number,
  knownRndDefinitionIds: string[],
): PublicGameEvent {
  return {
    eventId,
    type: "resolve_choice",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: "rd",
      privateLookCount: knownRndDefinitionIds.length,
      knownRndDefinitionIds,
      knownRndTopDefinitionId: knownRndDefinitionIds[0],
      knownRndCardCount: knownRndDefinitionIds.length,
    },
  };
}

function strategicLineKindFromDebug(
  debug: AiDecisionDebug | undefined,
): string | undefined {
  return debug?.evidence
    ?.find((entry) => entry.startsWith("strategic_line_kind:"))
    ?.slice("strategic_line_kind:".length);
}

function strategicRunnerInput(
  seed: string,
  options: { knownHqAgenda?: boolean; runnerAgendaPoints?: number } = {},
): AiDecisionInput {
  const state = toRunnerTurn(createGameAfterSetup({ seed }));
  state.runner.credits = 5;
  const doctrine = buildDeckDoctrineProfile({
    deckSnapshotId: `strategic-runner-${seed}`,
    side: "runner",
    cards: [
      { cardId: "simple_run_event", quantity: 4 },
      { cardId: "simple_economy_event", quantity: 4 },
      { cardId: "simple_fracter", quantity: 3 },
      { cardId: "simple_decoder", quantity: 3 },
    ],
  });
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.2-normal",
    decisionId: `${seed}:strategic-runner:0`,
    actionNumber: 4,
    ownDeckDoctrine: doctrine,
  });
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        agendaPoints:
          options.runnerAgendaPoints ?? input.playerView.own.agendaPoints,
      },
    },
    eventTail: options.knownHqAgenda
      ? [
          ...input.eventTail,
          syntheticHqPrivateLookEvent(`${seed}:known-hq-agenda`, 100, [
            "simple_agenda",
          ]),
        ]
      : input.eventTail,
  };
}

function strategicCorpInput(
  seed: string,
  mutate: (state: GameState) => void,
): AiDecisionInput {
  let state = createGameAfterSetup({ seed });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  mutate(state);
  const doctrine = buildDeckDoctrineProfile({
    deckSnapshotId: `strategic-corp-${seed}`,
    side: "corp",
    cards: [
      { cardId: "simple_agenda", quantity: 6 },
      { cardId: "simple_barrier_ice", quantity: 8 },
      { cardId: "simple_economy_operation", quantity: 6 },
      { cardId: "simple_economy_asset", quantity: 4 },
    ],
  });
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.2-normal",
    decisionId: `${seed}:strategic-corp:0`,
    actionNumber: 4,
    ownDeckDoctrine: doctrine,
  });
}

function corpEffectiveRemoteSafetyInput(
  seed: string,
  options: {
    runnerCredits: number;
    includeTaxUpgrade?: boolean;
    includeAgendaStealTaxUpgrade?: boolean;
    installedAgendaCounters?: number;
    agendaInHq?: boolean;
    assetInHq?: boolean;
    hiddenRunnerCard?: string;
    safeSecondRemote?: boolean;
    protectionIceInHq?: boolean;
  },
): AiDecisionInput {
  let state = createGameAfterSetup({
    seed,
    runnerDeck: {
      id: `corp_effective_remote_safety_runner_${seed}`,
      name: "Corp Effective Remote Safety Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_037_japanese-water-torture", quantity: 1 },
        { id: "simple_fracter", quantity: 2 },
        { id: "simple_economy_event", quantity: 6 },
      ],
    },
    corpDeck: {
      id: `corp_effective_remote_safety_corp_${seed}`,
      name: "Corp Effective Remote Safety Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 4 },
        { id: "simple_economy_asset", quantity: 2 },
        { id: "simple_economy_operation", quantity: 4 },
        { id: "onr_v1_237_data-wall", quantity: 2 },
        { id: "simple_code_gate_ice", quantity: 2 },
        { id: "simple_barrier_ice", quantity: 2 },
        { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
        { id: "onr_v1_366_red-herrings", quantity: 1 },
      ],
    },
    agendaPointsToWin: 7,
  });
  state = apply(state, "corp", (action) => action.type === "mandatory_draw");
  ensureRemoteServer(state, "remote_1");
  const dataWallId = putCorpIceOnServer(
    state,
    "remote_1",
    "onr_v1_237_data-wall",
  );
  state.cardInstances[dataWallId] = {
    ...state.cardInstances[dataWallId]!,
    faceup: true,
    rezzed: true,
  };
  if (options.includeTaxUpgrade) {
    const taxId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
      0,
    );
    state.cardInstances[taxId] = {
      ...state.cardInstances[taxId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.includeAgendaStealTaxUpgrade) {
    const taxId = putCorpRootInRemote(state, "onr_v1_366_red-herrings", 0);
    state.cardInstances[taxId] = {
      ...state.cardInstances[taxId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.safeSecondRemote) {
    ensureRemoteServer(state, "remote_2");
    const secondRemoteIceId = putCorpIceOnServer(
      state,
      "remote_2",
      "simple_code_gate_ice",
    );
    state.cardInstances[secondRemoteIceId] = {
      ...state.cardInstances[secondRemoteIceId]!,
      faceup: true,
      rezzed: true,
    };
  }
  if (options.installedAgendaCounters !== undefined) {
    const agendaId = putCorpRootInRemote(
      state,
      "simple_agenda",
      options.installedAgendaCounters,
    );
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      faceup: false,
      rezzed: false,
    };
  } else if (options.agendaInHq !== false) {
    moveCorpCardToHq(state, "simple_agenda");
  }
  if (options.assetInHq) moveCorpCardToHq(state, "simple_economy_asset");
  if (options.protectionIceInHq)
    moveCorpCardToHq(state, "simple_code_gate_ice");
  moveRunnerProgramToRig(state, "onr_v1_037_japanese-water-torture");
  if (options.hiddenRunnerCard) {
    moveRunnerCardToGrip(state, options.hiddenRunnerCard);
  }
  state.runner.credits = options.runnerCredits;
  state.corp.credits = 10;
  state.corp.clicks = 3;
  const doctrine = buildDeckDoctrineProfile({
    deckSnapshotId: `corp-effective-remote-safety-${seed}`,
    side: "corp",
    cards: [
      { cardId: "simple_agenda", quantity: 4 },
      { cardId: "onr_v1_237_data-wall", quantity: 2 },
      { cardId: "simple_code_gate_ice", quantity: 2 },
      { cardId: "simple_barrier_ice", quantity: 2 },
      { cardId: "simple_economy_operation", quantity: 4 },
      { cardId: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
      { cardId: "onr_v1_366_red-herrings", quantity: 1 },
    ],
  });
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    profileId: "corp-ai-v1.4.2-normal",
    decisionId: `${seed}:corp-effective-remote-safety`,
    actionNumber: 6,
    ownDeckDoctrine: doctrine,
  });
}

function runCorpAiOnlySmoke(
  seed: string,
  maxActions: number,
): { actions: number; errors: string[] } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId:
        side === "corp" ? "corp-ai-v1.4.0-normal" : "runner-ai-v0.9-normal",
    });
    const decision =
      side === "corp" ? chooseCorpAction(input) : chooseRunnerAction(input);
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`,
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors };
}

function runRunnerAiSmoke(
  seed: string,
  maxActions: number,
  corpMode: "baseline" | "planned",
): { actions: number; errors: string[]; runnerPlanDecisions: number } {
  let state = createGameAfterSetup({ seed });
  const errors: string[] = [];
  let runnerPlanDecisions = 0;
  for (let step = 0; step < maxActions && !state.winner; step += 1) {
    const side = state.activeSide;
    const input = buildAiDecisionInput(state, side, {
      difficulty: "normal",
      actionNumber: step,
      decisionId: `${seed}:${step}:${side}`,
      profileId:
        side === "runner" ? "runner-ai-v1.4.1-normal" : "corp-ai-v1.4.0-normal",
    });
    const decision =
      side === "runner"
        ? chooseRunnerAction(input)
        : corpMode === "baseline"
          ? chooseCorpBaselineAction(input)
          : chooseCorpAction(input);
    if (decision.reasonCode.startsWith("runner.plan."))
      runnerPlanDecisions += 1;
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) {
      errors.push(`missing legal action ${side} ${step}`);
      break;
    }
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
      idempotencyKey: `${seed}-${step}-${action.actionId}`,
    });
    if (!result.ok) {
      errors.push(`${result.error.code}:${result.error.message}`);
      break;
    }
    state = result.state;
  }
  return { actions: state.stateVersion, errors, runnerPlanDecisions };
}

function krashFilterEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: {
        id: "ai_krash_filter_corp",
        name: "AI Krash Filter Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_244_filter", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 5;
  state.corp.credits = 5;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  putCorpIceOnServer(state, "rd", "onr_v1_244_filter");
  putCorpCardOnTopOfRd(state, "simple_economy_operation");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "onr_v1_244_filter",
  );
}

function krashKeeperHqEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: {
        id: "ai_krash_keeper_corp",
        name: "AI Krash Keeper Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_252_keeper", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 2;
  state.corp.credits = 5;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  putCorpIceOnServer(state, "hq", "onr_v1_252_keeper");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "hq",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "onr_v1_252_keeper",
  );
}

function codecrackerDoubleEndlessCorridorInput(
  seed: string,
  runnerCredits: number,
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
      corpDeck: {
        id: "ai_codecracker_double_endless_corp",
        name: "AI Codecracker Double Endless Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "onr_v1_239_endless-corridor", quantity: 2 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "onr_v1_014_codecracker");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_014_codecracker",
  );
  const innerIceId = putCorpIceOnServer(
    state,
    "rd",
    "onr_v1_239_endless-corridor",
  );
  const outerIceId = putUnusedCorpIceOnServer(
    state,
    "rd",
    "onr_v1_239_endless-corridor",
    new Set([innerIceId]),
  );
  for (const iceId of [innerIceId, outerIceId]) {
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      faceup: true,
      rezzed: true,
    };
  }
  state.runner.credits = runnerCredits;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function krashDataWallBbsRemoteInput(
  seed: string,
  runnerCredits: number,
  bbsKnown: boolean,
): ReturnType<typeof buildAiDecisionInput> {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: ONR_V1_2_3_RUNNER_DECK,
      corpDeck: {
        ...ONR_V1_2_3_CORP_DECK,
        cards: [
          ...ONR_V1_2_3_CORP_DECK.cards,
          { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "onr_v1_039_krash");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "onr_v1_039_krash",
  );
  ensureRemoteServer(state, "remote_1");
  const dataWallId = putCorpIceOnServer(
    state,
    "remote_1",
    "onr_v1_237_data-wall",
  );
  state.cardInstances[dataWallId] = {
    ...state.cardInstances[dataWallId]!,
    faceup: true,
    rezzed: true,
  };
  const bbsId = putCorpRootInRemote(
    state,
    "onr_v1_309_bbs-whispering-campaign",
    0,
  );
  state.cardInstances[bbsId] = {
    ...state.cardInstances[bbsId]!,
    faceup: bbsKnown,
    rezzed: bbsKnown,
  };
  state.runner.credits = runnerCredits;
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    profileId: "runner-ai-v1.4.1-normal",
  });
}

function weakFracterBarrierEncounterState(seed: string): GameState {
  let state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        id: "ai_weak_fracter_runner",
        name: "AI Weak Fracter Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "efficient_fracter", quantity: 1 },
          { id: "simple_economy_event", quantity: 8 },
        ],
      },
      corpDeck: {
        id: "ai_taxing_barrier_corp",
        name: "AI Taxing Barrier Corp",
        side: "corp",
        identity: "corp_identity_001",
        cards: [
          { id: "simple_taxing_barrier_ice", quantity: 1 },
          { id: "simple_economy_operation", quantity: 4 },
          { id: "simple_agenda", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 10;
  state.corp.credits = 10;
  moveRunnerCardToGrip(state, "efficient_fracter");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "efficient_fracter",
  );
  putCorpIceOnServer(state, "rd", "simple_taxing_barrier_ice");
  putCorpCardOnTopOfRd(state, "simple_economy_operation");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  return apply(
    state,
    "corp",
    (action) =>
      action.type === "rez_ice" &&
      sourceDefinition(state, action) === "simple_taxing_barrier_ice",
  );
}

function kingOfTheRoadRunnerTurn(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: kingOfTheRoadRunnerDeck(),
      corpDeck: deckDefinitionFromSnapshot("demo_corp_008_snapshot_v0_8"),
      agendaPointsToWin: 7,
    }),
  );
}

function kingOfTheRoadRunnerDeck(): DeckDefinition {
  return deckDefinitionFromSnapshot("king_of_the_road_runner_ai_snapshot_v1");
}

function batchARunnerTurn(seed: string): GameState {
  return toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: batchARunnerDeck(),
      corpDeck: deckDefinitionFromSnapshot("demo_corp_008_snapshot_v0_8"),
      agendaPointsToWin: 7,
    }),
  );
}

function batchARunnerDeck(): DeckDefinition {
  return {
    id: "ai_batch_a_runner_rig_low_risk",
    name: "AI Batch A Runner Rig Low Risk",
    side: "runner",
    identity: "runner_identity_001",
    cards: [
      { id: "onr_v1_014_codecracker", quantity: 2 },
      { id: "onr_v1_015_codeslinger", quantity: 2 },
      { id: "onr_v1_021_dwarf", quantity: 2 },
      { id: "onr_v1_039_krash", quantity: 2 },
      { id: "onr_v1_066_snowball", quantity: 2 },
      { id: "onr_v1_074_worm", quantity: 2 },
      { id: "onr_v1_144_tycho-mem-chip", quantity: 1 },
      { id: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
      { id: "simple_economy_event", quantity: 4 },
    ],
  };
}

function deckDefinitionFromSnapshot(snapshotId: string): DeckDefinition {
  const snapshot = snapshotById(snapshotId);
  return {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((entry) => ({
      id: entry.cardId,
      quantity: entry.quantity,
    })),
  };
}

function kingOfTheRoadSnapshot() {
  return snapshotById("king_of_the_road_runner_ai_snapshot_v1");
}

function snapshotById(snapshotId: string) {
  const snapshots = snapshotsData08.snapshots as Array<{
    deckSnapshotId: string;
    name: string;
    side: Side;
    identityCardId: string;
    cards: Array<{ cardId: string; quantity: number }>;
    publicMetadata: {
      side: Side;
      identityCardId: string;
      deckName: string;
      cardPoolSnapshotId: string;
      formatProfileId: string;
      deckHash: string;
    };
  }>;
  const snapshot = snapshots.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  expect(snapshot, snapshotId).toBeDefined();
  if (!snapshot) throw new Error(`Missing snapshot ${snapshotId}`);
  return snapshot;
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function continueRunAction(state: GameState): GameState {
  return apply(state, "runner", (action) => action.type === "continue_run");
}

function enterEncounterFromMovementWindow(state: GameState): GameState {
  return continueRunAction(state);
}

function installRunnerCard(state: GameState, definitionId: string): GameState {
  return apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === definitionId,
  );
}

function startAndRezOuterIce(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  iceId: CardInstanceId,
): GameState {
  let next = apply(
    state,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === serverId,
  );
  next = apply(
    next,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  return next.run?.phase === "encounter_ice"
    ? next
    : enterEncounterFromMovementWindow(next);
}

function rezIceAndEnterIfNeeded(
  state: GameState,
  iceId: CardInstanceId,
): GameState {
  const next = apply(
    state,
    "corp",
    (action) => action.type === "rez_ice" && action.source === iceId,
  );
  return next.run?.phase === "encounter_ice"
    ? next
    : enterEncounterFromMovementWindow(next);
}

function runDurationIceEncounterState(
  seed: string,
  runnerCards: string[],
  corpCards: string[],
): GameState {
  const extraRunnerCards = runnerCards.map((id) => ({ id, quantity: 1 }));
  const extraCorpCards = corpCards.map((id) => ({ id, quantity: 1 }));
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: `${seed}_runner`,
        name: `${seed} Runner`,
        cards: [
          ...extraRunnerCards,
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: `${seed}_corp`,
        name: `${seed} Corp`,
        cards: [
          ...extraCorpCards,
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    }),
  );
  state.runner.credits = 20;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 6;
  state.corp.credits = 20;
  return state;
}

function mustAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  expect(
    selected,
    `Legal: ${legalActions.map((action) => `${action.type}:${action.label}`).join(", ")}`,
  ).toBeDefined();
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", [
      String(next.pendingChoice.options[0]?.id),
    ]);
  }
  return next;
}

function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = mustAction(
    state,
    side,
    (action) => action.type === "resolve_choice",
  );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function ensureRemoteServer(
  state: GameState,
  serverId: `remote_${number}`,
): void {
  if (state.corp.servers.some((server) => server.id === serverId)) return;
  const number = serverId.replace("remote_", "");
  state.corp.servers.push({
    id: serverId,
    kind: "remote",
    label: `Remote ${number}`,
    ice: [],
    root: [],
  });
}

function putCorpCardOnTopOfRd(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putUnusedCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
  excludedIds: Set<CardInstanceId> = new Set(),
): CardInstanceId {
  const usedServerCards = new Set(
    state.corp.servers.flatMap((server) => [...server.ice, ...server.root]),
  );
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !usedServerCards.has(id) &&
      !excludedIds.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing unused ${definitionId}`);
  const id = entry[0];
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveRunnerCardToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerCardCopyToGrip(
  state: GameState,
  definitionId: string,
  excludeIds: CardInstanceId[],
): CardInstanceId {
  const excluded = new Set(excludeIds);
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) => card.definitionId === definitionId && !excluded.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId} copy`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerProgramToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerHardwareToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.hardware.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerResourceToRig(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.resources.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function scoreRunnerAgendaForTest(
  state: GameState,
  definitionId: string,
  copyIndex: number,
): CardInstanceId {
  const ids = Object.entries(state.cardInstances)
    .filter(([, card]) => card.definitionId === definitionId)
    .map(([id]) => id as CardInstanceId)
    .filter((id) => !state.runner.scoreArea.includes(id))
    .sort();
  const id = ids[copyIndex] ?? ids[0];
  expect(id).toBeDefined();
  if (!id) throw new Error(`Missing agenda ${definitionId}`);
  removeEverywhere(state, id);
  state.runner.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function moveRunnerResourceCopyToRig(
  state: GameState,
  definitionId: string,
  copyIndex: number,
): CardInstanceId {
  const ids = Object.entries(state.cardInstances)
    .filter(([, card]) => card.definitionId === definitionId)
    .map(([id]) => id)
    .filter((id) => !state.runner.rig.resources.includes(id))
    .sort();
  const id = ids[copyIndex] ?? ids[0];
  expect(id).toBeDefined();
  if (!id) throw new Error(`Missing ${definitionId} copy ${copyIndex}`);
  removeEverywhere(state, id);
  state.runner.rig.resources.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function setHostedBitsForTest(
  state: GameState,
  id: CardInstanceId,
  amount: number,
): void {
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    counters: {
      ...(state.cardInstances[id]?.counters ?? {}),
      bit: amount,
    },
  };
}

function setShellCountersForTest(
  state: GameState,
  id: CardInstanceId,
  amount: number,
): void {
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    counters: {
      ...(state.cardInstances[id]?.counters ?? {}),
      shell: amount,
    },
  };
}

function moveCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveUnusedCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const serverCardIds = new Set(
    state.corp.servers.flatMap((server) => [...server.ice, ...server.root]),
  );
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId && !serverCardIds.has(id),
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing unused ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpCardInScoreArea(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function putAgendaFloodInCorpHq(state: GameState): void {
  moveCorpCardToHq(state, "simple_agenda");
}

function withSyntheticCorpAgendaPressure(
  input: ReturnType<typeof buildAiDecisionInput>,
): ReturnType<typeof buildAiDecisionInput> {
  const existingSynthetic = input.playerView.own.gripOrHq.some(
    (card) => card.instanceId === "synthetic_corp_agenda_pressure_a",
  );
  if (existingSynthetic) return input;
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        gripOrHq: [
          ...input.playerView.own.gripOrHq,
          visibleCard("simple_agenda", "synthetic_corp_agenda_pressure_a"),
          visibleCard("simple_agenda", "synthetic_corp_agenda_pressure_b"),
        ],
      },
    },
  };
}

function moveCorpHqAgendasToRd(state: GameState): void {
  const cardsById = createRuntimeCardsById();
  for (const id of state.corp.hq.slice()) {
    const card = state.cardInstances[id];
    if (!card || cardsById[card.definitionId]?.type !== "agenda") continue;
    state.corp.hq = state.corp.hq.filter((candidate) => candidate !== id);
    state.corp.rd.push(id);
    state.cardInstances[id] = {
      ...card,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

const representativeVisibleRunPairs = [
  {
    role: "barrier-wall with fracter",
    breakerId: "onr_v1_021_dwarf",
    iceId: "onr_v1_279_wall-of-static",
    expectedCost: 1,
    expectedEndingStrength: 3,
  },
  {
    role: "code gate with decoder",
    breakerId: "onr_v1_014_codecracker",
    iceId: "onr_v1_261_quandary",
    expectedCost: 2,
    expectedEndingStrength: 2,
  },
  {
    role: "sentry with killer",
    breakerId: "onr_v1_023_evil-twin",
    iceId: "onr_v1_259_in-the-face",
    expectedCost: 3,
    expectedEndingStrength: 3,
  },
] as const;

function isRuntimeBreakerCard(card: CatalogCard): boolean {
  return (
    card.side === "runner" &&
    card.type === "program" &&
    card.subtypes.some((subtype) => subtypeKeyForTest(subtype) === "icebreaker")
  );
}

function runtimeVisibleIce(card: CatalogCard | undefined): {
  definitionId: string;
  known: true;
  rezzed: true;
  subtypes: string[];
  strength?: number;
} {
  expect(card).toBeDefined();
  if (!card) throw new Error("Missing runtime ICE card");
  return {
    definitionId: card.catalogCardId,
    known: true,
    rezzed: true,
    subtypes: card.subtypes,
    ...(card.numeric.strength !== null
      ? { strength: card.numeric.strength }
      : {}),
  };
}

function runtimeVisibleBreaker(card: CatalogCard | undefined): VisibleCard {
  expect(card).toBeDefined();
  if (!card) throw new Error("Missing runtime breaker card");
  return {
    instanceId: `${card.catalogCardId}:visible`,
    definitionId: card.catalogCardId,
    known: true,
    type: "program",
    subtypes: card.subtypes,
    strength:
      card.numeric.strength ?? cardDefinitionStrength(card.catalogCardId),
  };
}

function subtypeKeyForTest(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function visibleCard(definitionId: string, instanceId: string): VisibleCard {
  return { instanceId, definitionId, known: true, title: definitionId };
}

function discardDecisionInputForTest(
  side: Side,
  config: {
    credits: number;
    cards: string[];
    discardCount?: number;
    ownDeckDoctrine?: AiDeckDoctrineProfile;
    rig?: string[];
  },
): AiDecisionInput {
  const state =
    side === "runner"
      ? toRunnerTurn(createGameAfterSetup({ seed: `ai-discard-${side}` }))
      : createGameAfterSetup({ seed: `ai-discard-${side}` });
  const base = buildAiDecisionInput(state, side, {
    difficulty: "normal",
    profileId: `${side}-ai-v1.4.2-normal`,
  });
  const hand = config.cards.map((definitionId, index) =>
    discardVisibleCardForTest(definitionId, `discard_${definitionId}_${index}`),
  );
  const rig = config.rig?.map((definitionId, index) =>
    discardVisibleCardForTest(definitionId, `rig_${definitionId}_${index}`),
  );
  const discardCount = config.discardCount ?? 1;
  const choice: ChoiceRequest = {
    choiceId: `discard_${side}_test`,
    side,
    source: "discard_phase",
    prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
    kind: "select_cards",
    options: hand.map((card) => ({
      id: `card_${card.instanceId}`,
      label: card.title ?? card.definitionId ?? card.instanceId,
      publicLabel: "Handkarte",
      value: card.instanceId,
    })),
    minSelections: discardCount,
    maxSelections: discardCount,
    stateVersion: base.playerView.stateVersion,
    visibility: "hidden_info_barrier",
  };
  const resolveChoice: LegalAction = {
    actionId: `${side}.resolve_choice.discard_test`,
    side,
    type: "resolve_choice",
    label: "Discard wählen",
    source: "game_rule",
    timingPoint: base.playerView.timingPoint,
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: base.playerView.stateVersion + 1,
  };
  return {
    ...base,
    playerView: {
      ...base.playerView,
      phase: side === "corp" ? "corp_discard_phase" : "runner_discard_phase",
      own: {
        ...base.playerView.own,
        credits: config.credits,
        gripOrHq: hand,
        ...(rig ? { rig } : {}),
      },
      pendingChoice: choice,
    },
    legalActions: [resolveChoice],
    ...(config.ownDeckDoctrine
      ? { ownDeckDoctrine: config.ownDeckDoctrine }
      : {}),
  };
}

function discardVisibleCardForTest(
  definitionId: string,
  instanceId: string,
): VisibleCard {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  expect(definition, definitionId).toBeDefined();
  if (!definition) throw new Error(`Missing ${definitionId}`);
  return {
    instanceId,
    definitionId,
    known: true,
    title: definition.title,
    type: definition.type,
    subtypes: definition.subtypes,
    ...(definition.cost !== undefined ? { cost: definition.cost } : {}),
    ...(definition.installCost !== undefined
      ? { installCost: definition.installCost }
      : {}),
    ...(definition.rezCost !== undefined
      ? { rezCost: definition.rezCost }
      : {}),
    ...(definition.memoryCost !== undefined
      ? { memoryCost: definition.memoryCost }
      : {}),
  };
}

function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  for (const cardId of state.corp.hq.filter((candidate) => candidate !== id)) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.hq = [id];
}

function setCorpHqCardsForTest(
  state: GameState,
  definitionIds: string[],
): CardInstanceId[] {
  const ids = definitionIds.map((definitionId) =>
    moveCorpCardToHq(state, definitionId),
  );
  for (const cardId of state.corp.hq.filter(
    (candidate) => !ids.includes(candidate),
  )) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.hq = ids;
  return ids;
}

function putRunnerCardOnTopOfStack(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function sourceDefinition(
  state: GameState,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

function sourceDefinitionFromInput(
  input: ReturnType<typeof buildAiDecisionInput>,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  const visible = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ]
    .flat()
    .find((card) => card.instanceId === action.source && card.known);
  return visible?.definitionId;
}

function runnerDoctrineForTest(
  deckSnapshotId: string,
  archetypeTags: string[],
  planWeights: Record<string, number>,
): AiDeckDoctrineProfile {
  return {
    schemaVersion: "ai-deck-doctrine-v1",
    deckSnapshotId,
    deckHash: `test:${deckSnapshotId}`,
    side: "runner",
    confidence: 0.95,
    archetypeTags,
    roleCounts: {},
    roleDensity: {},
    planWeights,
    mulliganWeights: {},
    riskFlags: [],
    evidence: [],
  };
}

function corpDoctrineForTest(
  deckSnapshotId: string,
  archetypeTags: string[],
  planWeights: Record<string, number>,
): AiDeckDoctrineProfile {
  return {
    schemaVersion: "ai-deck-doctrine-v1",
    deckSnapshotId,
    deckHash: `test:${deckSnapshotId}`,
    side: "corp",
    confidence: 0.95,
    archetypeTags,
    roleCounts: {},
    roleDensity: {},
    planWeights,
    mulliganWeights: {},
    riskFlags: [],
    evidence: [],
  };
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "ai_v093_choice",
    prompt: "AI private choice",
    kind: "select_option",
    options: [{ id: "keep", label: "Keep option" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side",
  };
}

function putCorpRootInRemote(
  state: GameState,
  definitionId: string,
  advancementCounters: number,
): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
    advancementCounters,
  };
  return id;
}

function putCorpRootInServer(
  state: GameState,
  serverId: `remote_${number}`,
  definitionId: string,
  advancementCounters: number,
  options: { faceup?: boolean; rezzed?: boolean } = {},
): CardInstanceId {
  ensureRemoteServer(state, serverId);
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  expect(server).toBeDefined();
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters,
  };
  return id;
}

function moveCorpCardToArchives(
  state: GameState,
  definitionId: string,
  faceup: boolean,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

function keepOnlyCorpArchivesCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  expect(entry).toBeDefined();
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (cardId) => cardId !== id,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
