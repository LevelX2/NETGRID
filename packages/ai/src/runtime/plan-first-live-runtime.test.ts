import { describe, expect, it, vi } from "vitest";
import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
  sanitizeAiDecisionDebug,
  type AiDecisionInput,
  type EngineRandomizedTurnPlanSelectionQuoteResult,
  type EngineRandomizedTurnPlanSelectionRequest,
  type VisibleCard,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildRunnerEconomyPosture } from "../runner-economy-posture";
import {
  evaluateRunnerHandDevelopment,
  type RunnerHandDevelopmentEvaluation,
  type RunnerHandDevelopmentRole,
} from "../runner-hand-development";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import {
  evaluateRunnerRunTargets,
  type RandomBreakOrDamageRiskAssessment,
  type RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import {
  buildDeckCapabilityProfileFromInput,
  type BreakerCapability,
  type DeckCapabilityProfile,
} from "../deck-capabilities";
import {
  attachOwnDeckSnapshot,
  aiInput,
  legalAction,
  safeRuntimeRunTarget,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { instantiatePlanProposal } from "../plans/plan-instance";
import type { PlanInstance } from "../plans/plan-kernel-types";
import { corpClassicDeflectorDefenseChoiceSignal } from "../plans/corp-core-plan-modules";
import type { RunnerRestrictedProgramInstallSequenceCommitment } from "../plans/runner-tactical-plan-modules";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  reconcileSelectedTurnPlannerActionDispositions,
  runnerActionDispositions,
  runnerCentralPressureHasExecutableEventRun,
} from "./plan-first-live-runtime";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";
import { selectedChoicesForDecision } from "./selected-choices-for-decision";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "../plans/turn-planning-contracts";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
import { allocateCorpCentralDefenseFromAiFacts } from "./corp-central-defense-facts-adapter";
import { visibleCorpIceDefenseProfile } from "./semantic-runtime-corp-effective-defense";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import {
  buildRandomBreakOrDamageRiskAssessment,
  randomBreakOrDamageRiskProfileForDefinitionId,
  randomBreakOrDamageRiskShouldAvoidRun,
} from "../actions/risk-action-projection";
import { createRunnerRandomBreakOrDamageEncounterContext } from "./runner-blink-encounter-break-context";
import { runnerRandomBreakOrDamageBreakExclusion } from "./runner-blink-break-exclusion";
import { sourceDefinitionIdForAction } from "./visible-card-lookup";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";
import { isImmediateSafetyThreatSubroutine } from "./encounter-subroutine";

function quotedFixtureIce(params: {
  instanceId: string;
  definitionId: string;
  title: string;
  strength: number;
  subtypes: string[];
  subroutineType?: "end_the_run" | "do_damage";
}): ReturnType<typeof visibleCard> {
  const ice = visibleCard(params.instanceId, "corp", "ice", {
    definitionId: params.definitionId,
    title: params.title,
    rezzed: true,
    strength: params.strength,
    subtypes: params.subtypes,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: params.strength,
    subroutines: [
      {
        id: `${params.instanceId}-fixture-subroutine`,
        type: params.subroutineType ?? "end_the_run",
        ...(params.subroutineType === "do_damage" ? { amount: 1 } : {}),
        sourceDefinitionId: params.definitionId,
        sourceTitle: params.title,
      },
    ],
  });
}

function costIneffectiveWallRunAction() {
  return legalAction(
    "run-costly-hq-wall",
    "runner",
    "start_run",
    "Run HQ",
    { credits: 0, clicks: 1 },
    { payload: { serverId: "hq" } },
  );
}

function costIneffectiveCoverageCreditAction() {
  return legalAction(
    "credit-for-costly-hq-wall",
    "runner",
    "gain_credit",
    "Gain 1 Credit",
    { credits: 0, clicks: 1 },
  );
}

function costEffectiveWallBreakerInHand() {
  return visibleCard("ramming-piston", "runner", "program", {
    definitionId: "onr_v1_053_ramming-piston",
    title: "Ramming Piston",
    installCost: 4,
    strength: 5,
    subtypes: ["icebreaker", "noisy"],
  });
}

function costIneffectiveWallInput(actions: ReturnType<typeof legalAction>[]) {
  const input = aiInput("runner", actions);
  input.playerView.own.credits = 4;
  input.playerView.own.clicks = 3;
  input.playerView.own.rig = [
    visibleCard("installed-krash", "runner", "program", {
      definitionId: "onr_v1_039_krash",
      title: "Krash",
      installCost: 0,
      strength: 0,
      subtypes: ["icebreaker"],
    }),
  ];
  input.playerView.servers = [
    server("hq", [
      quotedFixtureIce({
        instanceId: "costly-hq-wall",
        definitionId: "onr_v1_279_wall-of-static",
        title: "Wall of Static",
        strength: 4,
        subtypes: ["wall"],
      }),
    ]),
    server("rd"),
    server("archives"),
  ];
  return input;
}

function costIneffectiveWallTarget(actionId: string) {
  const target = safeRuntimeRunTarget(actionId, "hq");
  return {
    ...target,
    pathPassability: "blocked_unpayable" as const,
    pathCost: 10,
    routeQuote: {
      ...target.routeQuote,
      reachability: "no_access" as const,
      knownCost: 10,
      guaranteedKnownCost: 10,
      availableCredits: 4,
      fundingGap: 6,
      noAccessReason: "insufficient_credits",
      evidence: [
        "route_reachability:no_access",
        "route_funding_gap:6",
        "route_unknown_ice_count:0",
      ],
    },
    creditsAfterRun: -6,
    recommendation: "gain_credits_first" as const,
    score: 80,
    evidence: [
      "path_passability:blocked_unpayable",
      "path_cost:10",
      "visible_break_cost:10",
    ],
  };
}

function costIneffectiveCoverageCapabilities(
  alternative: "in_hand" | "in_deck" | "none",
): DeckCapabilityProfile {
  const krash: BreakerCapability = {
    cardId: "onr_v1_039_krash",
    title: "Krash",
    coverage: ["universal", "wall", "code_gate", "sentry"],
    installCost: 0,
    baseStrength: 0,
    breakCost: 2,
    pumpCost: 2,
    risks: [],
    restrictions: [],
    quantityKnownInDeck: 2,
    locations: ["installed", "in_deck"],
    confidence: "high",
    evidence: ["test_installed_expensive_coverage"],
  };
  const rammingPiston: BreakerCapability = {
    cardId: "onr_v1_053_ramming-piston",
    title: "Ramming Piston",
    coverage: ["wall"],
    installCost: 4,
    baseStrength: 5,
    breakCost: 2,
    pumpCost: 1,
    risks: [],
    restrictions: [],
    quantityKnownInDeck: 1,
    locations: alternative === "in_hand" ? ["in_hand", "in_deck"] : ["in_deck"],
    confidence: "high",
    evidence: ["test_known_efficient_wall_role"],
  };
  const breakerCoverageMatrix = Object.fromEntries(
    (
      [
        "wall",
        "code_gate",
        "sentry",
        "ap",
        "trace",
        "universal",
        "subtype_limited",
        "special",
      ] as const
    ).map((coverage) => [
      coverage,
      {
        coverage,
        inDeckKnown: true,
        inHand: alternative === "in_hand" && coverage === "wall",
        installed: ["wall", "code_gate", "sentry", "universal"].includes(
          coverage,
        ),
        searchableNow: false,
        drawOnly: alternative === "in_deck",
        missing: false,
        bestKnownCards: ["onr_v1_039_krash"],
        blockers: [],
      },
    ]),
  ) as unknown as NonNullable<
    DeckCapabilityProfile["runner"]
  >["breakerCoverageMatrix"];
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [
        krash,
        ...(alternative === "none" ? [] : [rammingPiston]),
      ],
      breakerCoverageMatrix,
      searchAccess: {
        tools: [],
        canSearchProgramsNow: false,
        canSearchBreakersNow: false,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 1,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 1,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test_side_safe_deck_snapshot"],
  };
}

function midgameUpgradeEconomyPosture() {
  return {
    minimumCreditFloor: 5,
    desiredCreditReserve: 10,
    creditReservePolicy: {
      phase: "midgame" as const,
      contestReserve: 0,
    },
    fundingNeed: false,
    evidence: ["test_midgame_upgrade_reserve"],
  };
}

function alternativeWallBreakerForUpgradeSelection(): BreakerCapability {
  return {
    cardId: "onr_v1_047_pile-driver",
    title: "Pile Driver",
    coverage: ["wall"],
    installCost: 7,
    baseStrength: 1,
    breakCost: 1,
    pumpCost: 1,
    risks: [],
    restrictions: [],
    quantityKnownInDeck: 1,
    locations: ["in_deck"],
    confidence: "high",
    evidence: ["test_alternative_wall_breaker"],
  };
}

describe("authoritative plan-first live runtime", () => {
  it("keeps an HQ setup run admissible when its direct access score is negative but it opens a targeted ICE-trash window", () => {
    resetResidentPlanPortfolioMemory();
    const hqRun = legalAction(
      "runner.start_run.hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [hqRun, credit, end]);
    input.playerView.own.credits = 25;
    input.playerView.own.clicks = 4;
    input.playerView.own.agendaPoints = 5;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("jettison", "runner", "event", {
        definitionId: "onr_v1_080_core-command-jettison-ice",
        title: "Core Command: Jettison Ice",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          withEffectiveRunQuote(
            visibleCard("terminal-ap-ice", "corp", "ice", {
              definitionId: "onr_v1_235_wall-of-static",
              title: "Wall of Static",
              rezzed: true,
              rezCost: 2,
              strength: 3,
              subtypes: ["AP"],
            }),
            {
              effectiveStrength: 3,
              subroutines: [
                {
                  id: "terminal-ap-ice-end-the-run",
                  type: "end_the_run",
                  sourceDefinitionId: "onr_v1_235_wall-of-static",
                  sourceTitle: "Wall of Static",
                },
              ],
            },
          ),
        ],
        [
          visibleCard("terminal-hidden-card", "corp", "agenda", {
            advancementCounters: 1,
          }),
        ],
      ),
    ];
    const target = {
      ...safeRuntimeRunTarget(hqRun.actionId, "hq"),
      score: -425,
      recommendation: "run_if_free" as const,
      knownAccessState: "unknown" as const,
      accessPayoff: "fresh" as const,
      accessTargetKind: "hq" as const,
      evidence: ["test_negative_direct_access_score"],
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: hqRun.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: {
            moduleId: "runner.pressure_central",
            target: { kind: "server", id: "hq" },
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("hq_success_window_setup"),
      ]),
    );
  });

  it("keeps a deferred HQ setup run owned by central pressure while economy builds its exact route", () => {
    resetResidentPlanPortfolioMemory();
    const hqRun = legalAction(
      "runner.start_run.hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [hqRun, credit, end]);
    input.playerView.own.credits = 12;
    input.playerView.own.clicks = 3;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("jettison", "runner", "event", {
        definitionId: "onr_v1_080_core-command-jettison-ice",
        title: "Core Command: Jettison Ice",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          withEffectiveRunQuote(
            visibleCard("trash-target", "corp", "ice", {
              definitionId: "onr_v1_235_wall-of-static",
              title: "Wall of Static",
              rezzed: true,
              rezCost: 2,
              strength: 3,
              subtypes: ["AP"],
            }),
            {
              effectiveStrength: 3,
              subroutines: [
                {
                  id: "trash-target-end-the-run",
                  type: "end_the_run",
                  sourceDefinitionId: "onr_v1_235_wall-of-static",
                  sourceTitle: "Wall of Static",
                },
              ],
            },
          ),
        ],
        [],
      ),
    ];
    const target = {
      ...safeRuntimeRunTarget(hqRun.actionId, "hq"),
      score: -888,
      recommendation: "gain_credits_first" as const,
      knownAccessState: "unknown" as const,
      accessPayoff: "unknown" as const,
      accessTargetKind: "hq" as const,
      evidence: ["test_deferred_hq_setup_route"],
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedPlan: { moduleId: "runner.economy" },
          turnPlanning: {
            coverage: {
              status: "pass",
              coveragePercent: 100,
              missingActionCount: 0,
            },
          },
        },
      },
    });
  });

  it("admits an owned event-run head only when its current pressure route is executable", () => {
    const signal = {
      pressureId: "central-pressure:rd",
      serverId: "rd",
      reachable: true,
      marginalValue: 5,
      runActionIds: ["inside-job"],
    } as unknown as Parameters<
      typeof runnerCentralPressureHasExecutableEventRun
    >[0];
    const candidates = [
      {
        actionId: "inside-job",
        semanticActionType: "play.runner_event",
        runProjectionSummary: { serverId: "rd" },
      },
    ] as unknown as Parameters<
      typeof runnerCentralPressureHasExecutableEventRun
    >[1];
    const runTargets = [
      {
        actionId: "inside-job",
        targetServerId: "rd",
        pathPassability: "reachable",
        recommendation: "run_now",
        score: 50,
        knownAccessState: "unknown",
      },
    ] as unknown as Parameters<
      typeof runnerCentralPressureHasExecutableEventRun
    >[2];

    expect(
      runnerCentralPressureHasExecutableEventRun(
        signal,
        candidates,
        runTargets,
      ),
    ).toBe(true);
    expect(
      runnerCentralPressureHasExecutableEventRun(
        { ...signal, reachable: false },
        candidates,
        runTargets,
      ),
    ).toBe(false);
    expect(
      runnerCentralPressureHasExecutableEventRun(
        { ...signal, marginalValue: 0 },
        candidates,
        runTargets,
      ),
    ).toBe(false);
    expect(
      runnerCentralPressureHasExecutableEventRun(
        {
          ...signal,
          runActionExclusions: { "inside-job": ["unpayable_current_route"] },
        },
        candidates,
        runTargets,
      ),
    ).toBe(false);
    expect(
      runnerCentralPressureHasExecutableEventRun(signal, candidates, [
        { ...runTargets[0]!, pathPassability: "blocked_missing_coverage" },
      ]),
    ).toBe(false);
  });

  it("routes a voluntary Runner action through a resident executor", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.credits = 0;
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "credit",
      fallbackUsed: false,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
        memoryVersion: "resident-plan-portfolio-v2",
        planFirstDecision: {
          selectionAuthority: "turn_plan_commitment",
          turnPlanning: {
            mode: "cutover",
            coverage: {
              status: "pass",
              coveragePercent: 100,
            },
          },
        },
      },
    });
    const planFirst = decision.decisionDebug?.planFirstDecision;
    expect(planFirst?.executionOrigin).toMatchObject({
      rootPlanInstanceId: planFirst?.rootPlanInstanceId,
      leafPlanInstanceId: planFirst?.leafExecutorInstanceId,
      side: "runner",
      windowKind: "main_action",
      windowId: `${input.playerView.timingPoint}:${input.playerView.stateVersion}`,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
    });
    expect(
      sanitizeAiDecisionDebug(decision.decisionDebug)?.planFirstDecision,
    ).toBeDefined();
    expect(decision.evidence).toContain("plan_first_lane:plan");
  });

  it("selects an exact terminal-win route even when an unrelated Basic Credit projection is malformed", () => {
    resetResidentPlanPortfolioMemory();
    const malformedCredit = legalAction(
      "malformed-credit",
      "runner",
      "gain_credit",
      "Malformed Basic Credit",
      { credits: 0, clicks: 0 },
    );
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [malformedCredit, end]);
    input.playerView.own.clicks = 1;

    const malformedDecision = liveContext().chooseSemanticRuntimeAction(
      input,
      {},
    );
    expect(malformedDecision).toMatchObject({
      actionId: "end",
      fallbackUsed: false,
      reasonCode: "plan_first.runner.secure_terminal_win",
      decisionDebug: {
        planKind: "runner.secure_terminal_win",
      },
    });
    expect(malformedDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P1",
        "plan_assessment_evidence:corp_visible_empty_rd_forced_mandatory_draw",
      ]),
    );
  });

  it("dispositions unbound Social Engineering instead of routing it through generic development", () => {
    resetResidentPlanPortfolioMemory();
    const social = legalAction(
      "play-social",
      "runner",
      "play_event",
      "Play Social Engineering",
      { credits: 1, clicks: 1 },
      {
        source: "social-card",
        payload: {
          cardId: "social-card",
          sourceDefinitionId: "onr_v1_111_social-engineering",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [social, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("social-card", "runner", "event", {
        definitionId: "onr_v1_111_social-engineering",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "social-card",
          definitionId: "onr_v1_111_social-engineering",
          legalActionId: "play-social",
          priority: 1_000,
          developmentRole: "run_event",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe("credit");
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          JSON.stringify(instance.moduleState).includes("social-card"),
      ),
    ).toBe(false);
  });

  it("preserves matchpoint liquidity instead of installing overlapping breaker coverage", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-ms-todon",
      "runner",
      "install_card",
      "Install MS-todon",
      { credits: 4, clicks: 1 },
      {
        source: "ms-todon-card",
        payload: {
          cardId: "ms-todon-card",
          sourceDefinitionId: "onr_classic_029_ms-todon",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [install, credit]);
    input.playerView.own.credits = 10;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.own.rig = [
      visibleCard("installed-matador", "runner", "program", {
        definitionId: "onr_classic_028_matador",
        title: "Matador",
        strength: 0,
        subtypes: ["icebreaker", "killer"],
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("ms-todon-card", "runner", "program", {
        definitionId: "onr_classic_029_ms-todon",
        title: "MS-todon",
        installCost: 4,
        strength: 2,
        subtypes: ["icebreaker", "killer", "noisy"],
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "ms-todon-card",
          definitionId: "onr_classic_029_ms-todon",
          legalActionId: install.actionId,
          priority: 1_000,
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "strong",
          currentNeed: "useful_now",
          cardType: "program",
          installCost: 4,
          creditsAfterInstall: 6,
          duplicateRole: "useful_backup",
          finalInstallFit: 500,
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 7,
        desiredCreditReserve: 12,
        fundingNeed: true,
        evidence: ["test_matchpoint_remote_reserve"],
      }),
    }).chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "runner_matchpoint_remote_reserve_blocks_overlapping_breaker_install",
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          JSON.stringify(instance.moduleState).includes("ms-todon-card"),
      ),
    ).toBe(false);
  });

  it("keeps Social Engineering exclusively targeted-bypass-owned even if future semantics resemble central payoff development", () => {
    resetResidentPlanPortfolioMemory();
    const social = legalAction(
      "play-social",
      "runner",
      "play_event",
      "Play Social Engineering",
      { credits: 1, clicks: 1 },
      {
        source: "social-card",
        payload: {
          cardId: "social-card",
          sourceDefinitionId: "onr_v1_111_social-engineering",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [social, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("social-card", "runner", "event", {
        definitionId: "onr_v1_111_social-engineering",
      }),
    ];

    const decision = liveContext({
      buildActionSemanticCandidates: (
        params: Parameters<typeof buildActionSemanticCandidates>[0],
      ) =>
        buildActionSemanticCandidates(params).map((candidate) =>
          candidate.actionId === "play-social"
            ? {
                ...candidate,
                effectTargets: ["rd"],
                actionTacticSignals: [
                  ...candidate.actionTacticSignals,
                  "access.rnd_multiaccess",
                ],
              }
            : candidate,
        ),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "social-card",
          definitionId: "onr_v1_111_social-engineering",
          legalActionId: "play-social",
          priority: 1_000,
          developmentRole: "access_payoff",
          strategicFit: "strong",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe("credit");
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.pressure_central" &&
          JSON.stringify(instance.moduleState).includes("develop_payoff") &&
          JSON.stringify(instance.moduleState).includes("social-card"),
      ),
    ).toBe(false);
  });

  it("defers every payment and program-trash variant of a central payoff install until a bound access route exists", () => {
    resetResidentPlanPortfolioMemory();
    const rdInterface = legalAction(
      "install-rd-interface",
      "runner",
      "install_card",
      "Install R&D Interface",
      { credits: 1, clicks: 1 },
      {
        source: "rd-interface-card",
        payload: {
          cardId: "rd-interface-card",
          sourceDefinitionId: "onr_v1_139_r-and-d-interface",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const installVariants = [
      legalAction(
        "install-rd-interface-with-one-hosted-credit",
        "runner",
        "install_card",
        "Install R&D Interface with one hosted credit",
        { credits: 1, clicks: 1 },
        {
          source: "rd-interface-card",
          payload: {
            cardId: "rd-interface-card",
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
            runnerInstallPaymentSourceIds: "software-installer",
            runnerInstallPaymentSourceAmounts: "1",
            runnerInstallPaymentHostedCredits: 1,
          },
        },
      ),
      legalAction(
        "install-rd-interface-with-two-hosted-credits",
        "runner",
        "install_card",
        "Install R&D Interface with two hosted credits",
        { credits: 1, clicks: 1 },
        {
          source: "rd-interface-card",
          payload: {
            cardId: "rd-interface-card",
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
            runnerInstallPaymentSourceIds: "software-installer",
            runnerInstallPaymentSourceAmounts: "2",
            runnerInstallPaymentHostedCredits: 2,
          },
        },
      ),
      legalAction(
        "install-rd-interface-with-program-trash-and-hosted-credit",
        "runner",
        "install_card",
        "Trash a program and install R&D Interface with a hosted credit",
        { credits: 1, clicks: 1 },
        {
          source: "rd-interface-card",
          payload: {
            cardId: "rd-interface-card",
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
            runnerProgramTrashBeforeInstall: true,
            runnerInstallPaymentSourceIds: "software-installer",
            runnerInstallPaymentSourceAmounts: "1",
            runnerInstallPaymentHostedCredits: 1,
          },
        },
      ),
    ];
    const input = aiInput("runner", [
      rdInterface,
      ...installVariants,
      credit,
      runRd,
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("rd-interface-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];
    const blockedRd = {
      ...safeRuntimeRunTarget("run-rd", "rd"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: 120,
    };

    const decision = liveContext({
      buildActionSemanticCandidates: (
        params: Parameters<typeof buildActionSemanticCandidates>[0],
      ) =>
        buildActionSemanticCandidates(params).map((candidate) =>
          [rdInterface, ...installVariants].some(
            (action) => action.actionId === candidate.actionId,
          )
            ? {
                ...candidate,
                effectTargets: ["rd"],
                actionTacticSignals: [
                  ...candidate.actionTacticSignals,
                  "access.rnd_multiaccess",
                ],
              }
            : candidate,
        ),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "rd-interface-card",
          definitionId: "onr_v1_139_r-and-d-interface",
          legalActionId: "install-rd-interface",
          priority: 900,
          cardType: "hardware",
          developmentRole: "access_payoff",
          strategicFit: "strong",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
      evaluateRunnerRunTargets: () => [blockedRd],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          JSON.stringify(instance.moduleState).includes("rd-interface-card"),
      ),
    ).toBe(false);
  });

  it("classifies a central-payoff install from definition hints when action semantics omit the server target", () => {
    resetResidentPlanPortfolioMemory();
    const installMole = legalAction(
      "install-rd-mole",
      "runner",
      "install_card",
      "Install R&D Mole",
      { credits: 0, clicks: 1 },
      {
        source: "rd-mole-card",
        payload: {
          cardId: "rd-mole-card",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [installMole, credit, runRd]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("rd-mole-card", "runner", "resource", {
        definitionId: "onr_proteus_147_r-and-d-mole",
      }),
    ];
    const blockedRd = {
      ...safeRuntimeRunTarget("run-rd", "rd"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: 120,
    };

    const decision = liveContext({
      buildActionSemanticCandidates: (
        params: Parameters<typeof buildActionSemanticCandidates>[0],
      ) =>
        buildActionSemanticCandidates(params).map((candidate) =>
          candidate.actionId === installMole.actionId
            ? {
                ...candidate,
                sourceDefinitionId: undefined,
                effectTargets: [],
                actionTacticSignals: candidate.actionTacticSignals.filter(
                  (signal) => signal !== "access.rnd_multiaccess",
                ),
              }
            : candidate,
        ),
      evaluateRunnerHandDevelopment: () => [],
      evaluateRunnerRunTargets: () => [blockedRd],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "runner_access_payoff_install_waits_for_bound_access_route:rd",
    );
  });

  it("binds a legal access-payoff install to a viable multi-turn central campaign before the run is funded", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-payoff",
      "runner",
      "install_card",
      "Install access payoff",
      { credits: 4, clicks: 1 },
      {
        source: "payoff-card",
        payload: {
          cardId: "payoff-card",
          sourceDefinitionId: "onr_v1_139_r-and-d-interface",
        },
      },
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [install, run, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("payoff-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      pathCost: 6,
      creditsAfterRun: -1,
      recommendation: "gain_credits_first" as const,
      score: 180,
    };

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "payoff-card",
          definitionId: "onr_v1_139_r-and-d-interface",
          legalActionId: install.actionId,
          priority: 900,
          cardType: "hardware",
          installCost: 4,
          developmentRole: "access_payoff",
          strategicFit: "strong",
        }),
      ],
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 8,
        creditReservePolicy: {
          phase: "opening",
          contestReserve: 0,
        },
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:runner.pressure_central:central%3Ard",
      ]),
    );
    const campaign = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) =>
        instance.instanceId === "plan:runner.pressure_central:central%3Ard",
    );
    expect(campaign).toMatchObject({
      moduleId: "runner.pressure_central",
      phase: "develop_payoff",
    });
    expect(JSON.stringify(campaign?.moduleState)).toContain(
      '"horizon":"same_turn"',
    );
    expect(JSON.stringify(campaign?.moduleState)).toContain(
      '"runFundingTargetCredits":9',
    );
  });

  it("selects exactly one of three equal access-payoff copies and records diminishing copy ownership", () => {
    resetResidentPlanPortfolioMemory();
    const installs = [1, 2, 3].map((index) =>
      legalAction(
        `install-payoff-${index}`,
        "runner",
        "install_card",
        `Install access payoff ${index}`,
        { credits: 4, clicks: 1 },
        {
          source: `payoff-card-${index}`,
          payload: {
            cardId: `payoff-card-${index}`,
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
          },
        },
      ),
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [...installs, run]);
    input.playerView.own.credits = 12;
    input.playerView.own.gripOrHq = installs.map((_, index) =>
      visibleCard(`payoff-card-${index + 1}`, "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    );
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      recommendation: "setup_first" as const,
      score: 180,
    };

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () =>
        installs.map((action, index) =>
          handEvaluation({
            cardInstanceId: `payoff-card-${index + 1}`,
            definitionId: "onr_v1_139_r-and-d-interface",
            legalActionId: action.actionId,
            priority: 900,
            cardType: "hardware",
            installCost: 4,
            developmentRole: "access_payoff",
            strategicFit: "strong",
          }),
        ),
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "install-payoff-1",
      reasonCode: "plan_first.runner.pressure_central",
    });
    const campaignState = JSON.stringify(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.pressure_central",
      )?.moduleState,
    );
    expect(campaignState).toContain('"desiredCopyCount":1');
    expect(campaignState).toContain(
      '"rejectedPreparationActionIds":["install-payoff-2","install-payoff-3"]',
    );
  });

  it("keeps multi-turn install funding bound to the central parent and economy leaf", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [credit, run]);
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("payoff-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      recommendation: "setup_first" as const,
      score: 180,
    };

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "payoff-card",
          definitionId: "onr_v1_139_r-and-d-interface",
          legalActionId: "install-payoff-not-yet-legal",
          priority: 900,
          availability: "missing_credits",
          deferReason: "missing_credits",
          missingCredits: 3,
          installCost: 4,
          cardType: "hardware",
          developmentRole: "access_payoff",
          strategicFit: "strong",
        }),
      ],
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.pressure_central:central%3Ard",
      executorInstanceId:
        "plan:runner.economy:access-payoff-support%3Acentral%3Ard%3Apayoff-card",
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_delegated_from:plan:runner.pressure_central:central%3Ard",
        "plan_priority_need:access-payoff-support:central:rd:payoff-card",
      ]),
    );
  });

  it("does not fund Blackmail while HQ still lacks exact breaker coverage", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction(
      "draw-for-wall-breaker",
      "runner",
      "draw_card",
      "Draw 1",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [credit, draw, run]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("blackmail-card", "runner", "event", {
        definitionId: "onr_proteus_102_blackmail",
      }),
      visibleCard("protected-buffer-1", "runner", "event", {
        definitionId: "onr_v1_029_special-order",
      }),
      visibleCard("protected-buffer-2", "runner", "event", {
        definitionId: "onr_v1_111_social-engineering",
      }),
      visibleCard("protected-buffer-3", "runner", "event", {
        definitionId: "onr_v1_095_jack-n-joe",
      }),
      visibleCard("protected-buffer-4", "runner", "event", {
        definitionId: "onr_v1_110_sneak-preview",
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-data-wall", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
          strength: 2,
          subtypes: ["wall"],
          effectiveRunQuote: {
            iceInstanceId: "hq-data-wall",
            iceDefinitionId: "onr_v1_237_data-wall",
            effectiveStrength: 2,
            subroutines: [{ id: "data-wall-etr", type: "end_the_run" }],
          },
        }),
      ]),
      server("rd"),
      server("archives"),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: 240,
      evidence: ["missing_coverage:breaker_wall"],
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [
            {
              cardId: "onr_v1_053_ramming-piston",
              title: "Ramming Piston",
              coverage: ["wall"],
              installCost: 4,
              baseStrength: 5,
              breakCost: 1,
              pumpCost: 0,
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 2,
              locations: ["in_deck"],
              confidence: "high",
              evidence: ["match_bae516_known_wall_answer"],
            },
          ],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "blackmail-card",
          definitionId: "onr_proteus_102_blackmail",
          legalActionId: "play-blackmail-not-yet-legal",
          priority: 1_000,
          availability: "missing_credits",
          deferReason: "missing_credits",
          missingCredits: 2,
          installCost: 12,
          targetCredits: 12,
          fundingReason: "cannot_pay",
          developmentRole: "access_payoff",
          strategicFit: "strong",
          currentNeed: "acute",
        }),
      ],
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          JSON.stringify(instance.moduleState).includes("blackmail-card"),
      ),
    ).toBe(false);
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          instance.dedupeKey === "generic:draw-options",
      ),
    ).toBe(false);
    expect(residentPlanPortfolioSnapshot(input)?.instances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.pressure_central:central%3Ahq",
          openNeedIds: ["coverage:breaker_wall:run:run-hq"],
        }),
        expect.objectContaining({
          moduleId: "runner.rig_and_coverage",
          parentInstanceId: "plan:runner.pressure_central:central%3Ahq",
          parentNeedId: "coverage:breaker_wall:run:run-hq",
          moduleState: expect.objectContaining({
            phase: "draw_for_answer",
            gap: expect.objectContaining({
              drawForAnswerActionIds: [draw.actionId],
            }),
          }),
        }),
      ]),
    );
  });

  it("abandons access-payoff setup when new visible path evidence makes the central permanently unreachable", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-payoff",
      "runner",
      "install_card",
      "Install access payoff",
      { credits: 4, clicks: 1 },
      {
        source: "payoff-card",
        payload: {
          cardId: "payoff-card",
          sourceDefinitionId: "onr_v1_139_r-and-d-interface",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [install, credit, run]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("payoff-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "payoff-card",
          definitionId: "onr_v1_139_r-and-d-interface",
          legalActionId: install.actionId,
          priority: 900,
          cardType: "hardware",
          installCost: 4,
          developmentRole: "access_payoff",
          strategicFit: "strong",
        }),
      ],
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "rd"),
          pathPassability: "blocked_unbreakable" as const,
          recommendation: "find_breaker_first" as const,
          score: 180,
        },
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.pressure_central" &&
          JSON.stringify(instance.moduleState).includes("payoff-card"),
      ),
    ).toBe(false);
  });

  it("runs the bound central normally after the access payoff is installed", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [run]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("installed-payoff", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [],
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "rd"),
          accessPayoff: "access_bonus" as const,
          knownAccessState: "fresh" as const,
          recommendation: "run_now" as const,
          score: 220,
        },
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 6,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:runner.pressure_central:central%3Ard",
      ]),
    );
  });

  it.each([
    {
      label: "missing credits",
      legalNow: false,
      evaluation: handEvaluation({
        cardInstanceId: "social-card",
        definitionId: "onr_v1_111_social-engineering",
        legalActionId: "play-social",
        priority: 1_000,
        availability: "missing_credits",
        deferReason: "missing_credits",
        missingCredits: 1,
        installCost: 1,
        developmentRole: "run_event",
      }),
    },
    {
      label: "protected reserve",
      legalNow: true,
      evaluation: handEvaluation({
        cardInstanceId: "social-card",
        definitionId: "onr_v1_111_social-engineering",
        legalActionId: "play-social",
        priority: 1_000,
        deferReason: "preserve_credit_floor",
        duplicateRole: "none",
        developmentRole: "run_event",
      }),
    },
  ])(
    "does not create generic Social Engineering funding for $label",
    ({ evaluation, legalNow }) => {
      resetResidentPlanPortfolioMemory();
      const credit = legalAction(
        "credit",
        "runner",
        "gain_credit",
        "Gain 1 Credit",
        { credits: 0, clicks: 1 },
      );
      const social = legalAction(
        "play-social",
        "runner",
        "play_event",
        "Play Social Engineering",
        { credits: 1, clicks: 1 },
        {
          source: "social-card",
          payload: {
            cardId: "social-card",
            sourceDefinitionId: "onr_v1_111_social-engineering",
          },
        },
      );
      const input = aiInput("runner", legalNow ? [credit, social] : [credit]);
      input.playerView.own.credits = legalNow ? 5 : 0;
      input.playerView.own.gripOrHq = [
        visibleCard("social-card", "runner", "event", {
          definitionId: "onr_v1_111_social-engineering",
        }),
      ];

      liveContext({
        evaluateRunnerHandDevelopment: () => [evaluation],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 6,
          fundingNeed: true,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {});

      const portfolio = residentPlanPortfolioSnapshot(input);
      expect(
        portfolio?.instances.some(
          (instance) =>
            instance.moduleId === "runner.develop_board_and_hand" &&
            JSON.stringify(instance.moduleState).includes("social-card"),
        ),
      ).toBe(false);
      expect(
        portfolio?.instances.some(
          (instance) =>
            instance.moduleId === "runner.economy" &&
            JSON.stringify(instance.moduleState).includes("social-card"),
        ),
      ).toBe(false);
    },
  );

  it("routes a non-forced Classic Deflector choice through corp.defend_servers", () => {
    resetResidentPlanPortfolioMemory();
    const choiceId = "classic_deflector_1";
    const sourceIceId = "deflector-ice";
    const sourceDefinitionId = "generic-deflector";
    const subroutineId = "generic-deflector.subroutine.1.deflect_run";
    const action = legalAction(
      "corp.resolve_choice",
      "corp",
      "resolve_choice",
      "Deflector-Ziel wählen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [action]);
    const options = [
      { id: "decline", label: "Nicht zahlen", value: "decline" },
      { id: "server_hq", label: "HQ", value: "hq" },
      { id: "server_rd", label: "R&D", value: "rd" },
      { id: "server_archives", label: "Archives", value: "archives" },
    ];
    action.timingPoint = "run.encounter_ice";
    action.choiceRequirements = [
      {
        choiceId,
        minSelections: 1,
        maxSelections: 1,
        optionIds: options.map((option) => option.id),
      },
    ];
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 15;
    input.playerView.phase = "run";
    input.playerView.own.credits = 3;
    input.playerView.pendingChoice = {
      choiceId,
      side: "corp",
      source: `card_implementation.classic_deflector:run_1:${sourceIceId}:0:${sourceDefinitionId}:${subroutineId}:any_data_fort:2:0`,
      prompt: "Deflector-Ziel wählen",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: input.playerView.stateVersion,
      visibility: "public",
    };
    const deflector = visibleCard(sourceIceId, "corp", "ice", {
      definitionId: sourceDefinitionId,
      rezzed: true,
      effectiveRunQuote: {
        iceInstanceId: sourceIceId,
        iceDefinitionId: sourceDefinitionId,
        effectiveStrength: 4,
        subroutines: [
          {
            id: subroutineId,
            type: "deflect_run",
            deflectorTarget: "any_data_fort",
            deflectorCost: 2,
          },
        ],
      },
    });
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: deflector,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [deflector]),
      server("archives"),
    ];
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    expect(
      corpClassicDeflectorDefenseChoiceSignal(
        input,
        buildActionSemanticCandidates(input),
        undefined,
        0,
      ),
    ).toBeDefined();

    const decision = liveContext({
      selectedChoicesForDecision,
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "corp.resolve_choice",
      selectedChoices: {
        choiceId,
        selectedOptionIds: ["server_archives"],
      },
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.defend_servers",
        planFirstDecision: {
          selectedPlan: {
            instanceId: "plan:corp.defend_servers:server-defense-portfolio",
            target: {
              id: "allocate_server_defense",
            },
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_lane:plan",
        "plan_module:corp.defend_servers",
      ]),
    );
  });

  it("binds Datacomb's exact post-pass pay action to corp.defend_servers", () => {
    resetResidentPlanPortfolioMemory();
    const pay = legalAction(
      "corp.datacomb.pay",
      "corp",
      "continue_run",
      "Datacomb behalten",
      { credits: 1, clicks: 0 },
      {
        source: "datacomb-ice",
        payload: {
          corpPostPassIceAbility: "return_passed_ice_to_hq",
          sourceDefinitionId: "onr_proteus_018_datacomb",
          decision: "pay",
          paymentAmount: 1,
          serverId: "hq",
        },
      },
    );
    const returnToHq = legalAction(
      "corp.datacomb.return_to_hq",
      "corp",
      "continue_run",
      "Datacomb auf die HQ zurücknehmen",
      { credits: 0, clicks: 0 },
      {
        source: "datacomb-ice",
        payload: {
          corpPostPassIceAbility: "return_passed_ice_to_hq",
          sourceDefinitionId: "onr_proteus_018_datacomb",
          decision: "return_to_hq",
          serverId: "hq",
        },
      },
    );
    const input = aiInput("corp", [returnToHq, pay]);
    pay.expiresAtStateVersion = input.playerView.stateVersion;
    returnToHq.expiresAtStateVersion = input.playerView.stateVersion;
    input.playerView.phase = "run";
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.own.credits = 5;
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "movement",
      position: { kind: "server", serverId: "hq" },
      successful: false,
    };
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });
    expect(
      buildActionSemanticCandidates(input).map((candidate) => ({
        actionId: candidate.actionId,
        actionType: candidate.actionType,
        semanticActionType: candidate.semanticActionType,
      })),
    ).toEqual([
      {
        actionId: returnToHq.actionId,
        actionType: "continue_run",
        semanticActionType: "run.continue",
      },
      {
        actionId: pay.actionId,
        actionType: "continue_run",
        semanticActionType: "run.continue",
      },
    ]);

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: pay.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.defend_servers",
        planFirstDecision: {
          selectedPlan: {
            instanceId: "plan:corp.defend_servers:server-defense-portfolio",
          },
          route: {
            actionId: pay.actionId,
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_lane:plan",
        "plan_module:corp.defend_servers",
      ]),
    );
  });

  it("binds Scaffolding's optional post-pass decline to corp.defend_servers", () => {
    resetResidentPlanPortfolioMemory();
    const decline = legalAction(
      "corp.scaffolding.decline",
      "corp",
      "continue_run",
      "Scaffolding liegen lassen",
      { credits: 0, clicks: 0 },
      {
        source: "scaffolding-ice",
        payload: {
          corpPostPassIceAbility: "return_passed_ice_to_hq",
          sourceDefinitionId: "onr_proteus_037_scaffolding",
          decision: "decline",
          serverId: "hq",
        },
      },
    );
    const returnToHq = legalAction(
      "corp.scaffolding.return_to_hq",
      "corp",
      "continue_run",
      "Scaffolding auf die HQ zurücknehmen",
      { credits: 0, clicks: 0 },
      {
        source: "scaffolding-ice",
        payload: {
          corpPostPassIceAbility: "return_passed_ice_to_hq",
          sourceDefinitionId: "onr_proteus_037_scaffolding",
          decision: "return_to_hq",
          gainCredits: 1,
          serverId: "hq",
        },
      },
    );
    const input = aiInput("corp", [returnToHq, decline]);
    decline.expiresAtStateVersion = input.playerView.stateVersion;
    returnToHq.expiresAtStateVersion = input.playerView.stateVersion;
    input.playerView.phase = "run";
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "movement",
      position: { kind: "server", serverId: "hq" },
      successful: false,
    };
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: decline.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.defend_servers",
        planFirstDecision: {
          selectedPlan: {
            instanceId: "plan:corp.defend_servers:server-defense-portfolio",
          },
          route: {
            actionId: decline.actionId,
          },
        },
      },
    });
  });

  it("classifies a duplicate optional program-trash install only through its exact variant owner", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-ms-todon.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Install MS-todon after trashing a program",
      { credits: 4, clicks: 1 },
      {
        source: "ms-todon-card",
        payload: {
          cardId: "ms-todon-card",
          sourceDefinitionId: "onr_classic_029_ms-todon",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [install, credit]);
    input.playerView.own.credits = 10;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.own.rig = [
      visibleCard("installed-ms-todon", "runner", "program", {
        definitionId: "onr_classic_029_ms-todon",
        title: "MS-todon",
        strength: 2,
        subtypes: ["icebreaker", "killer", "noisy"],
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("ms-todon-card", "runner", "program", {
        definitionId: "onr_classic_029_ms-todon",
        title: "MS-todon",
        installCost: 4,
        strength: 2,
        subtypes: ["icebreaker", "killer", "noisy"],
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "ms-todon-card",
          definitionId: "onr_classic_029_ms-todon",
          legalActionId: install.actionId,
          priority: 0,
          deferReason: "duplicate",
          duplicateRole: "redundant_duplicate",
          finalInstallFit: -100,
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 7,
        desiredCreditReserve: 12,
        fundingNeed: true,
        evidence: ["test_matchpoint_remote_reserve"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("routes every legal coverage answer through Rig when the first hand answer is unaffordable", () => {
    resetResidentPlanPortfolioMemory();
    const installKrash = legalAction(
      "install-krash-direct",
      "runner",
      "install_card",
      "Install Krash",
      { credits: 0, clicks: 1 },
      {
        source: "krash-card",
        payload: {
          cardId: "krash-card",
          sourceDefinitionId: "onr_v1_039_krash",
        },
      },
    );
    const trashThenInstallKrash = legalAction(
      "install-krash-with-trash.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Krash",
      { credits: 0, clicks: 1 },
      {
        source: "krash-card",
        payload: {
          cardId: "krash-card",
          sourceDefinitionId: "onr_v1_039_krash",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const run = legalAction(
      "run-rd-with-missing-wall-coverage",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [
      installKrash,
      trashThenInstallKrash,
      run,
      credit,
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("worm-card", "runner", "program", {
        definitionId: "onr_v1_074_worm",
        title: "Worm",
        rulesText: "[0]: Break wall subroutine.\n[3]: +1 strength.",
        installCost: 4,
        memoryCost: 1,
        strength: 2,
        subtypes: ["icebreaker", "worm"],
      }),
      visibleCard("krash-card", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        title: "Krash",
        rulesText: "2 credits: Break ice subroutine.\n2 credits: +1 strength.",
        installCost: 0,
        memoryCost: 1,
        strength: 0,
        subtypes: ["icebreaker"],
      }),
    ];
    input.playerView.own.rig = [
      visibleCard("installed-codecracker", "runner", "program", {
        definitionId: "onr_v1_014_codecracker",
        title: "Codecracker",
        installCost: 2,
        memoryCost: 1,
        strength: 0,
        subtypes: ["icebreaker"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        quotedFixtureIce({
          instanceId: "rd-data-wall",
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          strength: 0,
          subtypes: ["wall"],
        }),
      ]),
      server("archives"),
    ];
    const target = safeRuntimeRunTarget(run.actionId, "rd");

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "krash-card",
          definitionId: "onr_v1_039_krash",
          legalActionId: installKrash.actionId,
          priority: 1_000,
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "strong",
          currentNeed: "acute",
          cardType: "program",
          installCost: 0,
          creditsAfterInstall: 3,
          duplicateRole: "useful_backup",
          finalInstallFit: 1_170,
        }),
      ],
      evaluateRunnerRunTargets: () => [
        {
          ...target,
          pathPassability: "blocked_missing_coverage",
          recommendation: "find_breaker_first",
          score: 0,
          evidence: ["target:rd", "missing_coverage:breaker_wall"],
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installKrash.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.rig_and_coverage",
        planFirstDecision: {
          selectedPlan: { moduleId: "runner.rig_and_coverage" },
          route: { actionId: installKrash.actionId },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
  });

  it("classifies unbound ordinary installs under the development owner", () => {
    resetResidentPlanPortfolioMemory();
    const installBoringBit = legalAction(
      "runner.install_card.boring-bit",
      "runner",
      "install_card",
      "Install Boring Bit",
      { credits: 6, clicks: 1 },
      {
        source: "boring-bit",
        payload: {
          cardId: "boring-bit",
          sourceDefinitionId: "onr_proteus_081_boring-bit",
        },
      },
    );
    const installGarbageIn = legalAction(
      "runner.install_card.garbage-in",
      "runner",
      "install_card",
      "Install Garbage In",
      { credits: 3, clicks: 1 },
      {
        source: "garbage-in",
        payload: {
          cardId: "garbage-in",
          sourceDefinitionId: "onr_proteus_089_garbage-in",
        },
      },
    );
    const input = aiInput("runner", [installBoringBit, installGarbageIn]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("boring-bit", "runner", "program", {
        definitionId: "onr_proteus_081_boring-bit",
        title: "Boring Bit",
        installCost: 6,
        memoryCost: 1,
        subtypes: ["icebreaker", "worm"],
      }),
      visibleCard("garbage-in", "runner", "program", {
        definitionId: "onr_proteus_089_garbage-in",
        title: "Garbage In",
        installCost: 3,
        memoryCost: 1,
        subtypes: ["virus"],
      }),
    ];

    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        "boring-bit": "onr_proteus_081_boring-bit",
        "garbage-in": "onr_proteus_089_garbage-in",
      },
    });
    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [
          {
            gapId: "coverage:breaker_wall",
            requiredRole: "breaker_wall",
            answerInHand: true,
            preparationActionIds: ["runner.prepare.breaker-wall"],
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [],
          },
        ],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [],
      [],
      () => undefined,
    );

    for (const action of [installBoringBit, installGarbageIn]) {
      expect(dispositions).toContainEqual({
        actionId: action.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode:
          "runner_install_has_no_bound_development_or_specialized_plan",
      });
    }
  });

  it("does not carry stale central-preparation dispositions into a run window", () => {
    const jackOut = legalAction(
      "runner.jack_out",
      "runner",
      "jack_out",
      "Jack-out",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const continueRun = legalAction(
      "runner.continue_run",
      "runner",
      "continue_run",
      "Run fortsetzen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [jackOut, continueRun]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.phase = "run";
    input.playerView.run = {
      runId: "run_9",
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "server", serverId: "rd" },
      badPublicityCredits: 0,
      successful: false,
    };
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });
    const staleInstallActionId =
      "runner.install_card.rd-protocol-files.rd-protocol-files";

    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [],
        centralPressure: [
          {
            pressureId: "central:rd",
            serverId: "rd",
            priorityClass: "P4",
            reachable: true,
            marginalValue: 300,
            preparationActionIds: [],
            rejectedPreparationActionIds: [staleInstallActionId],
            runActionIds: [continueRun.actionId],
            evidenceCode: "test_stale_previous_window_preparation",
          },
        ],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [],
      [],
      () => undefined,
    );

    expect(dispositions.map((entry) => entry.actionId)).not.toContain(
      staleInstallActionId,
    );
  });

  it("keeps a terminal agenda transfer under the existing development owner", () => {
    resetResidentPlanPortfolioMemory();
    const corruption = legalAction(
      "runner.play_event.corruption",
      "runner",
      "play_event",
      "Corruption spielen",
      { credits: 0, clicks: 1 },
      {
        source: "corruption",
        payload: {
          cardId: "corruption",
          sourceDefinitionId: "onr_classic_035_corruption",
          runnerAgendaPointTransferQuoteSchemaVersion:
            "runner-agenda-point-transfer-quote-v1",
          runnerAgendaPointTransferQuoteComplete: true,
          runnerAgendaPointTransferQuoteStateVersion: 0,
          runnerAgendaPointsTransferredToCorp: 4,
          corpAgendaPointsAfterRunnerTransfer: 7,
        },
      },
    );
    const draw = legalAction(
      "runner.draw_card",
      "runner",
      "draw_card",
      "Karte ziehen",
      { credits: 0, clicks: 1 },
      { source: "basic_action" },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "Zug beenden",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [corruption, draw, end]);
    corruption.expiresAtStateVersion = input.playerView.stateVersion;
    corruption.payload!.runnerAgendaPointTransferQuoteStateVersion =
      input.playerView.stateVersion;
    input.playerView.own.agendaPoints = 6;
    input.playerView.opponent.agendaPoints = 3;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("corruption", "runner", "event", {
        definitionId: "onr_classic_035_corruption",
        title: "Corruption",
      }),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
      visibleSourceDefinitionsByInstanceId: {
        corruption: "onr_classic_035_corruption",
      },
    });

    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [],
      [],
      () => undefined,
    );

    expect(dispositions).toContainEqual({
      actionId: corruption.actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId: "runner.develop_board_and_hand",
      evidenceCode: "runner_strategic_exchange_opponent_terminal_score",
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.secure_terminal_win",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          route: { actionId: end.actionId },
        },
      },
    });
    expect(decision.decisionDebug?.whyNot).toContain(
      "alternative:play_event:explicitly_nonproductive:runner.develop_board_and_hand:runner_strategic_exchange_opponent_terminal_score",
    );
  });

  it("classifies an optional program-trash install exactly once when its direct sibling is unadmitted", () => {
    const direct = legalAction(
      "runner.install_card.bulldozer",
      "runner",
      "install_card",
      "Install Bulldozer",
      { credits: 7, clicks: 1 },
      {
        source: "bulldozer",
        payload: {
          cardId: "bulldozer",
          sourceDefinitionId: "onr_proteus_082_bulldozer",
        },
      },
    );
    const trashBeforeInstall = legalAction(
      "runner.install_card.bulldozer.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Bulldozer",
      { credits: 7, clicks: 1 },
      {
        source: "bulldozer",
        payload: {
          cardId: "bulldozer",
          sourceDefinitionId: "onr_proteus_082_bulldozer",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const input = aiInput("runner", [direct, trashBeforeInstall]);
    input.playerView.own.gripOrHq = [
      visibleCard("bulldozer", "runner", "program", {
        definitionId: "onr_proteus_082_bulldozer",
        title: "Bulldozer",
        installCost: 7,
        memoryCost: 1,
        subtypes: ["icebreaker", "noisy"],
      }),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        bulldozer: "onr_proteus_082_bulldozer",
      },
    });
    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [
          {
            developmentId: "runner.develop_board_and_hand:bulldozer",
            definitionId: "onr_proteus_082_bulldozer",
            phase: "execute",
            assignedDomainPlanIds: [],
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: true,
            semanticActionTypes: ["install.card"],
            actionIds: [direct.actionId, trashBeforeInstall.actionId],
            priorityClass: "P5",
            value: 0,
            evidenceCode: "test_unadmitted_bulldozer_development",
          },
        ],
        coverageGaps: [],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [],
      [],
      () => undefined,
    ).filter((entry) => entry.actionId === trashBeforeInstall.actionId);

    expect(dispositions).toEqual([
      {
        actionId: trashBeforeInstall.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.develop_board_and_hand",
        evidenceCode:
          "runner_program_trash_install_unneeded_direct_install_available",
      },
    ]);

    const coverageDispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [
          {
            gapId: "coverage:breaker_wall",
            requiredRole: "breaker_wall",
            priorityClass: "P4",
            evidenceCode: "test_wall_coverage",
            deckHasAnswer: true,
            answerInHand: true,
            answerInstallCost: 7,
            installActionIds: [direct.actionId, trashBeforeInstall.actionId],
            fundingGap: 1,
            sameTurnRunConversion: {
              targetRunActionId: "runner.start_run.rd",
              requiredCredits: 8,
              requiredClicksAfterFunding: 2,
              projectedKnownPathCost: 0,
              postRunCreditFloor: 1,
              installProjection: "current_legal_action",
            },
            fundingActionIds: ["runner.gain_credit"],
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [],
          },
        ],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [],
      [],
      () => undefined,
    ).filter((entry) => entry.actionId === trashBeforeInstall.actionId);

    expect(coverageDispositions).toEqual([
      {
        actionId: trashBeforeInstall.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.rig_and_coverage",
        evidenceCode:
          "runner_coverage_install_waits_for_bound_same_turn_funding",
      },
    ]);
  });

  it("does not terminally reject a hand-development action owned by the active defense hand-buffer plan", () => {
    const meatUpgrade = legalAction(
      "runner.play_event.meat-upgrade",
      "runner",
      "play_event",
      "Play Meat Upgrade",
      { credits: 2, clicks: 2 },
      {
        source: "meat-upgrade",
        payload: {
          cardId: "meat-upgrade",
          sourceDefinitionId: "onr_classic_040_meat-upgrade",
        },
      },
    );
    const input = aiInput("runner", [meatUpgrade]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("meat-upgrade", "runner", "event", {
        definitionId: "onr_classic_040_meat-upgrade",
        title: "Meat Upgrade",
      }),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        "meat-upgrade": "onr_classic_040_meat-upgrade",
      },
    });
    const evaluation = handEvaluation({
      cardInstanceId: "meat-upgrade",
      definitionId: "onr_classic_040_meat-upgrade",
      legalActionId: meatUpgrade.actionId,
      priority: 1_000,
      deferReason: "preserve_credit_floor",
      duplicateRole: "none",
      developmentRole: "defense_support",
    });

    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [meatUpgrade.actionId],
        },
      } as never,
      [evaluation],
      [],
      () => undefined,
    );

    expect(dispositions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actionId: meatUpgrade.actionId }),
      ]),
    );
  });

  it("does not let a grouped hand-development rejection duplicate a sibling's exact specialized owner", () => {
    const sourceCardId = "specialized-install-card";
    const ordinaryVariant = legalAction(
      "runner.install_card.specialized.ordinary",
      "runner",
      "install_card",
      "Ordinary variant",
      { credits: 0, clicks: 1 },
      {
        source: sourceCardId,
        payload: { cardId: sourceCardId, sourceDefinitionId: "test-program" },
      },
    );
    const selfDamageVariant = legalAction(
      "runner.install_card.specialized.alternative",
      "runner",
      "install_card",
      "Alternative variant",
      { credits: 0, clicks: 1 },
      {
        source: sourceCardId,
        payload: {
          cardId: sourceCardId,
          sourceDefinitionId: "test-program",
        },
      },
    );
    const input = aiInput("runner", [ordinaryVariant, selfDamageVariant]);
    input.playerView.own.gripOrHq = [
      visibleCard(sourceCardId, "runner", "program", {
        definitionId: "test-program",
      }),
    ];
    const built = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [sourceCardId]: "test-program",
      },
    });
    const candidates = built.map((candidate) =>
      candidate.actionId === selfDamageVariant.actionId
        ? {
            ...candidate,
            strategicExchangeKinds: ["self_damage" as const],
            costProfile: {
              ...candidate.costProfile,
              selfDamage: [{ type: "core" as const, amount: 1 }],
            },
          }
        : candidate,
    );
    const domain = {
      creditBanks: [],
      recurringEconomy: [],
      resourceLifecycle: [],
      shellTradersPipelines: [],
      runWindows: [],
      developments: [
        {
          developmentId: "runner.develop_board_and_hand:test-program",
          definitionId: "test-program",
          phase: "execute",
          purposeCode: "test_specialized_install",
          assignedDomainPlanIds: ["plan:runner.develop_board_and_hand:test"],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          semanticActionTypes: ["install.card"],
          actionIds: [ordinaryVariant.actionId, selfDamageVariant.actionId],
          priorityClass: "P5",
          value: 1,
          evidenceCode: "test_specialized_install",
        },
      ],
      coverageGaps: [],
      centralPressure: [],
      remoteContests: [],
      installedAgendaScores: [],
      installedCardLiquidationChoices: [],
      fundingNeeds: [],
      defense: {
        activeTags: 0,
        forgoUnsafeRunCapacity: false,
        handBufferActionIds: [],
      },
    } as never;
    const handDevelopment = [
      handEvaluation({
        cardInstanceId: sourceCardId,
        definitionId: "test-program",
        legalActionId: ordinaryVariant.actionId,
        priority: 0,
        deferReason: "stronger_override",
        finalInstallFit: -100,
      }),
    ];

    const dispositions = runnerActionDispositions(
      input,
      candidates,
      domain,
      handDevelopment,
      [],
      () => undefined,
    );

    expect(
      dispositions.filter(
        (entry) => entry.actionId === selfDamageVariant.actionId,
      ),
    ).toEqual([
      {
        actionId: selfDamageVariant.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.economy",
        evidenceCode:
          "runner_self_damage_economy_requires_bound_parent_funding",
      },
    ]);
  });

  it("keeps a rejected run event exclusively with its exact run owner", () => {
    resetResidentPlanPortfolioMemory();
    const playRunningInterference = legalAction(
      "runner.play_event.running-interference.hq",
      "runner",
      "play_event",
      "Play Running Interference on HQ",
      { credits: 1, clicks: 1 },
      {
        source: "running-interference",
        payload: {
          cardId: "running-interference",
          sourceDefinitionId: "onr_classic_043_running-interference",
          serverId: "hq",
        },
      },
    );
    const input = aiInput("runner", [playRunningInterference]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("running-interference", "runner", "event", {
        definitionId: "onr_classic_043_running-interference",
        title: "Running Interference",
      }),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        "running-interference": "onr_classic_043_running-interference",
      },
    });
    const dispositions = runnerActionDispositions(
      input,
      candidates,
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [],
        centralPressure: [
          {
            serverId: "hq",
            reachable: false,
            marginalValue: -10,
            runActionIds: [],
            runActionExclusions: {
              [playRunningInterference.actionId]: [
                "runner_central_pressure_below_material_value:hq",
              ],
            },
            evidenceCode: "runner_central_pressure_below_material_value:hq",
          },
        ],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [
        handEvaluation({
          cardInstanceId: "running-interference",
          definitionId: "onr_classic_043_running-interference",
          legalActionId: playRunningInterference.actionId,
          priority: 10,
          developmentRole: "run_event",
          deferReason: "preserve_credit_floor",
        }),
      ],
      [
        runTargetEvaluation({
          actionId: playRunningInterference.actionId,
          targetServerId: "hq",
          recommendation: "gain_credits_first",
          score: -10,
        }),
      ],
      () => undefined,
    ).filter((entry) => entry.actionId === playRunningInterference.actionId);

    expect(dispositions).toEqual([
      {
        actionId: playRunningInterference.actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "runner.pressure_central",
        evidenceCode: "runner_central_pressure_below_material_value:hq",
      },
    ]);
  });

  it("removes only the exact TurnPlanner-selected action from disposition evidence", () => {
    const dispositions = [
      {
        actionId: "runner.start_run.hq",
        disposition: "explicitly_nonproductive" as const,
        ownerModuleId: "runner.pressure_central" as const,
        evidenceCode: "stale_pre_cutover_disposition",
      },
      {
        actionId: "runner.start_run.rd",
        disposition: "explicitly_nonproductive" as const,
        ownerModuleId: "runner.pressure_central" as const,
        evidenceCode: "current_rd_disposition",
      },
    ];
    const lease = {
      stateIdentity: { stateVersion: 8 },
      currentBinding: {
        actionId: "runner.start_run.hq",
        stateVersion: 8,
      },
    } as never;

    expect(
      reconcileSelectedTurnPlannerActionDispositions({
        dispositions,
        selectedActionId: "runner.start_run.hq",
        stateVersion: 8,
        lease,
      }),
    ).toEqual([dispositions[1]]);
    expect(() =>
      reconcileSelectedTurnPlannerActionDispositions({
        dispositions,
        selectedActionId: "runner.start_run.hq",
        stateVersion: 9,
        lease,
      }),
    ).toThrowError(/turn_planner_selected_action_binding_mismatch/);
  });

  it("does not start a program-trash install when the development owner cannot name an acceptable sacrifice", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-krash.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Krash",
      { credits: 0, clicks: 1 },
      {
        source: "krash-card",
        payload: {
          cardId: "krash-card",
          sourceDefinitionId: "onr_v1_039_krash",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit.no-sacrifice",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const run = legalAction(
      "runner.start_run.hq.no-sacrifice",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const endTurn = legalAction(
      "runner.end_turn.no-sacrifice",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [install, credit, run, endTurn]);
    input.playerView.own.credits = 13;
    input.playerView.own.clicks = 4;
    input.playerView.own.memoryUsed = 4;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("krash-card", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        title: "Krash",
        installCost: 0,
        memoryCost: 1,
        subtypes: ["icebreaker"],
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "krash-card",
          definitionId: "onr_v1_039_krash",
          legalActionId: install.actionId,
          priority: 1_000,
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "strong",
          currentNeed: "acute",
          cardType: "program",
          installCost: 0,
          creditsAfterInstall: 13,
          duplicateRole: "useful_backup",
          finalInstallFit: 1_170,
        }),
      ],
      runnerProgramInstallTrashAssessmentForAction: (
        _decisionInput: unknown,
        action: { actionId: string },
      ) =>
        action.actionId === install.actionId
          ? {
              memoryRequired: true,
              requiredMemoryToFree: 1,
              candidates: [],
              selectedCandidates: [],
              memoryFreedBySelectedCandidates: 0,
              canFreeRequiredMemory: false,
              evidence: ["program_sacrifice_can_free_required:false"],
            }
          : undefined,
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "hq"),
          score: 400,
          recommendation: "run_now",
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === install.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner_program_trash_install_has_no_acceptable_sacrifice",
        ),
      ]),
    });
  });

  it("binds the exact acceptable sacrifice before a plan-owned program-trash install", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "runner.install_card.smc.smc.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Self-Modifying Code",
      { credits: 0, clicks: 1 },
      {
        source: "smc",
        payload: {
          cardId: "smc",
          sourceDefinitionId: "onr_v1_059_self-modifying-code",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit.program-trash-binding",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [install, credit]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.memoryUsed = 4;
    input.playerView.own.memoryLimit = 4;
    const sacrifice = visibleCard("redundant-program", "runner", "program", {
      definitionId: "onr_v1_039_krash",
      title: "Krash",
      memoryCost: 1,
      subtypes: ["icebreaker"],
    });
    input.playerView.own.rig = [sacrifice];
    input.playerView.own.gripOrHq = [
      visibleCard("smc", "runner", "program", {
        definitionId: "onr_v1_059_self-modifying-code",
        title: "Self-Modifying Code",
        installCost: 0,
        memoryCost: 1,
      }),
    ];

    const runtime = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "smc",
          definitionId: "onr_v1_059_self-modifying-code",
          legalActionId: install.actionId,
          priority: 1_000,
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "strong",
          currentNeed: "acute",
          cardType: "program",
          installCost: 0,
          creditsAfterInstall: 10,
          duplicateRole: "useful_backup",
          finalInstallFit: 1_170,
        }),
      ],
      runnerProgramInstallTrashAssessmentForAction: (
        _decisionInput: unknown,
        action: { actionId: string },
      ) =>
        action.actionId === install.actionId
          ? {
              memoryRequired: true,
              requiredMemoryToFree: 1,
              candidates: [
                {
                  card: sacrifice,
                  memoryCost: 1,
                  protectedRole: false,
                  sacrificePenalty: 0,
                  category: "low" as const,
                  acceptable: true,
                  score: 0,
                  reasonCategories: ["test_redundant_program"],
                },
              ],
              selectedCandidates: [
                {
                  card: sacrifice,
                  memoryCost: 1,
                  protectedRole: false,
                  sacrificePenalty: 0,
                  category: "low" as const,
                  acceptable: true,
                  score: 0,
                  reasonCategories: ["test_redundant_program"],
                },
              ],
              memoryFreedBySelectedCandidates: 1,
              canFreeRequiredMemory: true,
              evidence: ["test_exact_sacrifice"],
            }
          : undefined,
      selectedChoicesForDecision,
    });
    const decision = runtime.chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: install.actionId,
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      executorInstanceId: expect.any(String),
      selectedActionOrigin: {
        rootPlanInstanceId: expect.any(String),
        executorInstanceId: expect.any(String),
        selectedActionId: install.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
        immediateChoicePolicy: "resolve_runner_program_trash_before_install",
        sourceCardInstanceId: "smc",
        requiredMemoryToFree: 1,
        selectedCards: [{ cardInstanceId: "redundant-program", memoryCost: 1 }],
      },
      instances: expect.arrayContaining([
        expect.objectContaining({
          executionState: "executor",
        }),
      ]),
    });

    const resolveChoice = legalAction(
      "runner.resolve_choice",
      "runner",
      "resolve_choice",
      "Resolve program trash before install",
      { credits: 0 },
      {
        source: "game_rule",
        visibility: "private_to_actor",
        payload: {
          choiceId: "runner_program_trash_before_install_2",
          choiceVisibility: "hidden_info_barrier",
          choiceKind: "select_cards",
        },
      },
    );
    resolveChoice.choiceRequirements = [
      {
        choiceId: "runner_program_trash_before_install_2",
        minSelections: 0,
        maxSelections: 1,
        optionIds: ["card_redundant-program"],
      },
    ];
    resolveChoice.expiresAtStateVersion = 2;
    const continuationInput = structuredClone(input);
    continuationInput.decisionId = "semantic-runtime-cutover:runner:2";
    continuationInput.actionNumber = 2;
    continuationInput.legalActions = [resolveChoice];
    continuationInput.playerView.stateVersion = 2;
    continuationInput.playerView.legalActions = [resolveChoice];
    continuationInput.playerView.pendingChoice = {
      choiceId: "runner_program_trash_before_install_2",
      side: "runner",
      source:
        "runner_program_trash_before_install:smc:2:payment=ids=installer;amounts=0",
      sourceCardInstanceId: "smc",
      sourceCardDefinitionId: "onr_v1_059_self-modifying-code",
      continuation: {
        family: "runner_program_trash_before_install",
        originActionId: install.actionId,
        sourceCardInstanceId: "smc",
        sourceCardDefinitionId: "onr_v1_059_self-modifying-code",
        createdAtStateVersion: 2,
      },
      prompt: "Programme vor Installation trashen",
      kind: "select_cards",
      options: [
        {
          id: "card_redundant-program",
          label: "Krash",
          value: "redundant-program",
        },
      ],
      minSelections: 0,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
    };

    expect(
      runtime.chooseSemanticRuntimeAction(continuationInput, {}),
    ).toMatchObject({
      actionId: resolveChoice.actionId,
      selectedChoices: {
        choiceId: "runner_program_trash_before_install_2",
        selectedOptionIds: ["card_redundant-program"],
      },
      fallbackUsed: false,
    });
  });

  it("classifies a matchpoint-reserved optional Cyfermaster trash-install only through its variant owner", () => {
    resetResidentPlanPortfolioMemory();
    const direct = legalAction(
      "runner.install_card.runner_onr_v1_016_cyfermaster_2.runner_onr_v1_016_cyfermaster_2",
      "runner",
      "install_card",
      "Install Cyfermaster",
      { credits: 4, clicks: 1 },
      {
        source: "runner_onr_v1_016_cyfermaster_2",
        payload: { cardId: "runner_onr_v1_016_cyfermaster_2" },
      },
    );
    const withTrash = legalAction(
      "runner.install_card.runner_onr_v1_016_cyfermaster_2.runner_onr_v1_016_cyfermaster_2.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Cyfermaster",
      { credits: 4, clicks: 1 },
      {
        source: "runner_onr_v1_016_cyfermaster_2",
        payload: {
          cardId: "runner_onr_v1_016_cyfermaster_2",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [direct, withTrash, credit]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 2;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.own.rig = [
      visibleCard("runner_onr_v1_039_krash_1", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        title: "Krash",
        subtypes: ["icebreaker"],
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("runner_onr_v1_016_cyfermaster_2", "runner", "program", {
        definitionId: "onr_v1_016_cyfermaster",
        title: "Cyfermaster",
        installCost: 4,
        subtypes: ["icebreaker"],
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "runner_onr_v1_016_cyfermaster_2",
          definitionId: "onr_v1_016_cyfermaster",
          legalActionId: direct.actionId,
          priority: 0,
          deferReason: "preserve_credit_floor",
          finalInstallFit: -100,
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 7,
        desiredCreditReserve: 12,
        fundingNeed: true,
        evidence: ["test_matchpoint_remote_reserve"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.economy" },
    });
  });

  it("selects a blocked payoff Social Engineering route through central pressure and persists its exact continuation", () => {
    resetResidentPlanPortfolioMemory();
    const social = legalAction(
      "play-social",
      "runner",
      "play_event",
      "Play Social Engineering",
      { credits: 1, clicks: 1 },
      {
        source: "social-card",
        payload: {
          cardId: "social-card",
          sourceDefinitionId: "onr_v1_111_social-engineering",
        },
      },
    );
    const runHq = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [social, runHq]);
    input.playerView.own.credits = 5;
    input.playerView.own.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("social-card", "runner", "event", {
        definitionId: "onr_v1_111_social-engineering",
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        quotedFixtureIce({
          instanceId: "hq-wall",
          definitionId: "onr_v1_232_crystal-wall",
          title: "Crystal Wall",
          strength: 3,
          subtypes: ["wall"],
        }),
      ]),
      server("rd"),
      server("archives"),
    ];
    const blockedTarget = {
      ...safeRuntimeRunTarget("run-hq", "hq"),
      pathPassability: "blocked_unbreakable" as const,
      recommendation: "find_breaker_first" as const,
      score: 120,
      evidence: ["test_blocked_material_hq_payoff"],
    };

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "social-card",
          definitionId: "onr_v1_111_social-engineering",
          legalActionId: "play-social",
          priority: 1_000,
          developmentRole: "run_event",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
      evaluateRunnerRunTargets: () => [blockedTarget],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "play-social",
      reasonCode: "plan_first.runner.pressure_central",
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "runner.pressure_central",
      moduleState: {
        signal: {
          targetedBypassCommitment: {
            sourceActionId: "play-social",
            serverId: "hq",
            icePosition: 0,
            visibleIceInstanceId: "hq-wall",
          },
        },
        choiceContinuation: {
          family: "runner_targeted_bypass",
          selectedActionId: "play-social",
          serverId: "hq",
          icePosition: 0,
        },
      },
    });
  });

  it("continues the existing run when the engine certifies the selected bypass ICE", () => {
    resetResidentPlanPortfolioMemory();
    const continueRun = legalAction(
      "continue-rd-auto-pass",
      "runner",
      "continue_run",
      "Continue R&D run",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "rd" } },
    );
    const jackOut = legalAction(
      "jack-out-rd-auto-pass",
      "runner",
      "jack_out",
      "Jack out",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [continueRun, jackOut]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      runId: "social-engineering-rd",
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      pendingAutoPassIceId: "rd-keeper",
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("rd-keeper", "corp", "ice", {
          definitionId: "onr_v1_252_keeper",
          rezzed: true,
          subtypes: ["code_gate"],
          strength: 4,
          effectiveRunQuote: {
            iceInstanceId: "rd-keeper",
            iceDefinitionId: "onr_v1_252_keeper",
            effectiveStrength: 4,
            subroutines: [{ id: "keeper-etr", type: "end_the_run" }],
          },
        }),
      ]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "continue-rd-auto-pass",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(decision.evidence).not.toContain(
      "runner_current_run_remaining_path_unreachable:rd",
    );

    resetResidentPlanPortfolioMemory();
    const withoutBypass = structuredClone(input);
    if (withoutBypass.playerView.run) {
      delete withoutBypass.playerView.run.pendingAutoPassIceId;
    }
    const abortDecision = liveContext().chooseSemanticRuntimeAction(
      withoutBypass,
      {},
    );
    expect(abortDecision).toMatchObject({
      actionId: "jack-out-rd-auto-pass",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("continues a previously admitted probabilistic breaker route to the visible ICE", () => {
    resetResidentPlanPortfolioMemory();
    const continueRun = legalAction(
      "continue-rd-random-break",
      "runner",
      "continue_run",
      "Continue R&D run",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "rd" } },
    );
    const jackOut = legalAction(
      "jack-out-rd-random-break",
      "runner",
      "jack_out",
      "Jack out",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [continueRun, jackOut]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`random-break-buffer-${index}`, "runner", "event"),
    );
    input.playerView.run = {
      runId: "random-break-rd",
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        quotedFixtureIce({
          instanceId: "rd-visible-code-gate",
          definitionId: "onr_v1_239_datapike",
          title: "Datapike",
          strength: 4,
          subtypes: ["code_gate"],
        }),
      ]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: continueRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(decision.evidence).not.toContain(
      "runner_current_run_remaining_path_unreachable:rd",
    );
  });

  it("jacks out of a probabilistic breaker route when its damage buffer is no longer safe", () => {
    resetResidentPlanPortfolioMemory();
    const continueRun = legalAction(
      "continue-rd-unsafe-random-break",
      "runner",
      "continue_run",
      "Continue R&D run",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "rd" } },
    );
    const jackOut = legalAction(
      "jack-out-rd-unsafe-random-break",
      "runner",
      "jack_out",
      "Jack out",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [continueRun, jackOut]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("insufficient-random-break-buffer", "runner", "event"),
    ];
    input.playerView.run = {
      runId: "unsafe-random-break-rd",
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        quotedFixtureIce({
          instanceId: "rd-visible-code-gate",
          definitionId: "onr_v1_239_datapike",
          title: "Datapike",
          strength: 4,
          subtypes: ["code_gate"],
        }),
      ]),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: jackOut.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("uses the probabilistic breaker when its successful break preserves a conditional future path", () => {
    resetResidentPlanPortfolioMemory();
    const breakCurrentEtr = legalAction(
      "blink-break-current-etr",
      "runner",
      "break_subroutine",
      "Blink: break current end-the-run subroutine",
      { credits: 0, clicks: 0 },
      {
        source: "blink-installed",
        payload: {
          iceId: "outer-code-gate",
          subroutineIndex: 0,
        },
      },
    );
    const resolveCurrentIce = legalAction(
      "resolve-current-etr",
      "runner",
      "continue_run",
      "Resolve current ICE",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        },
      },
    );
    const input = aiInput("runner", [resolveCurrentIce, breakCurrentEtr]);
    breakCurrentEtr.timingPoint = "run.encounter_ice";
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`conditional-path-buffer-${index}`, "runner", "event"),
    );
    const innerIce = quotedFixtureIce({
      instanceId: "inner-code-gate",
      definitionId: "onr_v1_239_datapike",
      title: "Datapike",
      strength: 4,
      subtypes: ["code_gate"],
    });
    const outerIce = quotedFixtureIce({
      instanceId: "outer-code-gate",
      definitionId: "onr_v1_270_sleeper",
      title: "Sleeper",
      strength: 4,
      subtypes: ["code_gate"],
    });
    input.playerView.run = {
      runId: "conditional-random-break-rd",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 1 },
      encounteredIce: outerIce,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [innerIce, outerIce]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: breakCurrentEtr.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect((decision.evidence ?? []).join(" ")).not.toContain(
      "break_cannot_preserve_access_path",
    );
  });

  it("keeps runner.convert_run_window ownership while resolving visible ETR instead of taking lethal Blink risk", () => {
    resetResidentPlanPortfolioMemory();
    const blinkBreak = legalAction(
      "blink-break-advanced-remote-etr",
      "runner",
      "break_subroutine",
      "Blink: break end-the-run subroutine",
      { credits: 0, clicks: 0 },
      {
        source: "blink-installed",
        payload: {
          iceId: "advanced-remote-ice",
          subroutineIndex: 0,
        },
      },
    );
    blinkBreak.timingPoint = "run.encounter_ice";
    blinkBreak.abilityRef = {
      sourceCardInstanceId: "blink-installed",
      sourceAbilityId: "onr_v1_007_blink:icebreaker_abilities_break_subroutine",
    };
    blinkBreak.payload = {
      ...blinkBreak.payload,
      breakerId: "blink-installed",
      cardId: "blink-installed",
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityKey: "icebreaker_abilities_break_subroutine",
      cardImplementationAbilityId:
        "onr_v1_007_blink:icebreaker_abilities_break_subroutine",
    };
    const resolveIce = legalAction(
      "resolve-advanced-remote-etr",
      "runner",
      "continue_run",
      "Resolve current ICE",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
        },
      },
    );
    resolveIce.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [blinkBreak, resolveIce]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.gripOrHq = [];
    input.playerView.own.rig = [
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    const encounteredIce = quotedFixtureIce({
      instanceId: "advanced-remote-ice",
      definitionId: "onr_v1_270_sleeper",
      title: "Sleeper",
      strength: 4,
      subtypes: ["code_gate"],
    });
    input.playerView.run = {
      runId: "advanced-remote-random-break",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [encounteredIce],
        [
          {
            instanceId: "hidden-advanced-root",
            known: false,
            advancementCounters: 3,
          },
        ],
      ),
    ];

    const randomBreakRisk = createRunnerRandomBreakOrDamageEncounterContext({
      sourceDefinitionIdForAction,
      randomBreakOrDamageRiskProfileForDefinitionId,
      breakSubroutineIndexesForAction,
      encounteredSubroutines: () =>
        encounteredIce.effectiveRunQuote?.subroutines ?? [],
      buildRandomBreakOrDamageRiskAssessment,
      isImmediateSafetyThreatSubroutine,
      isRemoteServerTarget: (serverId) =>
        serverId?.startsWith("remote_") ?? false,
      visibleRootIsKnownAgenda: (card) => card.known && card.type === "agenda",
    }).randomBreakOrDamageRiskAssessmentForEncounterBreak;
    const decision = liveContext({
      runnerEncounterActionExclusion: (
        decisionInput: typeof input,
        action: typeof blinkBreak,
      ) =>
        action.type === "break_subroutine"
          ? runnerRandomBreakOrDamageBreakExclusion(decisionInput, action, {
              riskAssessment: randomBreakRisk,
              shouldAvoidRun: (assessment) =>
                randomBreakOrDamageRiskShouldAvoidRun(
                  assessment as RandomBreakOrDamageRiskAssessment | undefined,
                ),
            })
          : undefined,
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: resolveIce.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(decision.decisionDebug?.actionAlternatives ?? []),
    ).toContain("random_break_damage_self_damage_risk");
  });

  it("keeps Strategic Planning Group selection inside the exact Corp hand-plan route", () => {
    resetResidentPlanPortfolioMemory();
    const choiceId = "spg-draw-choice";
    const action = legalAction(
      "corp.resolve-spg-draw-choice",
      "corp",
      "resolve_choice",
      "Eine Karte unter R&D legen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [action]);
    const lowValueCard = visibleCard("drawn-operation", "corp", "operation", {
      definitionId: "onr_v1_284_chance-observation",
    });
    const retainedAgenda = visibleCard("drawn-agenda", "corp", "agenda", {
      definitionId: "simple_agenda",
    });
    const additionalCards = Array.from({ length: 4 }, (_, index) =>
      visibleCard(`drawn-additional-${index + 1}`, "corp", "asset", {
        definitionId: "simple_economy_asset",
      }),
    );
    const options = [
      {
        id: "bottom-operation",
        label: "Chance Observation",
        value: lowValueCard.instanceId,
        card: lowValueCard,
      },
      {
        id: "bottom-agenda",
        label: "Agenda",
        value: retainedAgenda.instanceId,
        card: retainedAgenda,
      },
      ...additionalCards.map((card, index) => ({
        id: `bottom-additional-${index + 1}`,
        label: `Additional ${index + 1}`,
        value: card.instanceId,
        card,
      })),
    ];
    action.choiceRequirements = [
      {
        choiceId,
        minSelections: 1,
        maxSelections: 1,
        optionIds: options.map((option) => option.id),
      },
    ];
    input.playerView.own.gripOrHq = [
      lowValueCard,
      retainedAgenda,
      ...additionalCards,
    ];
    input.playerView.pendingChoice = {
      choiceId,
      side: "corp",
      source: "card_implementation.strategic_planning_group_draw:spg-instance",
      prompt: "Eine Karte unter R&D legen",
      kind: "select_cards",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: input.playerView.stateVersion,
      visibility: "hidden_info_barrier",
    };
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    const discardKeepScore = (
      _decisionInput: unknown,
      card: { instanceId: string },
    ) => ({ total: card.instanceId === lowValueCard.instanceId ? 0 : 100 });
    const decision = liveContext({
      discardKeepScore,
      selectedChoicesForDecision: (
        decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
        selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
        portfolio: Parameters<typeof selectedChoicesForDecision>[3],
      ) =>
        selectedChoicesForDecision(
          decisionInput,
          selectedAction,
          {
            evaluateCorpOpeningHand: () => ({ decision: "keep" }),
            evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
            discardKeepScore,
            selectedRunnerProgramInstallTrashOptionIds: () => [],
            selectedRunnerForcedProgramTrashOptionIds: () => [],
            selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
            extractAiFeatures: () => ({
              credits: 0,
              memoryRemaining: 4,
              hasInstalledNonNoisyIcebreaker: false,
              rigRoles: new Set(),
              rigDefinitionIds: new Set(),
            }),
            rolesForCardId: () => [],
            effectsForCardId: () => [],
          } as Parameters<typeof selectedChoicesForDecision>[2],
          portfolio,
        ),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: action.actionId,
      selectedChoices: {
        choiceId,
        selectedOptionIds: ["bottom-operation"],
      },
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.hand_and_agenda_management",
        planFirstDecision: {
          selectedPlan: {
            target: { id: "corp" },
          },
        },
      },
    });
    expect(input.playerView.pendingChoice.options).toHaveLength(6);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_lane:plan",
        "plan_module:corp.hand_and_agenda_management",
        "plan_step_capability:draw_filter_window",
      ]),
    );
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "corp.hand_and_agenda_management",
      moduleState: {
        kind: "hand",
        signal: {
          phase: "draw_filter_window",
          actionIds: [action.actionId],
          drawFilterChoiceBinding: {
            actionId: action.actionId,
            choiceId,
            observedAtStateVersion: input.playerView.stateVersion,
            selectedOptionIds: ["bottom-operation"],
            bottomedCardInstanceIds: [lowValueCard.instanceId],
            retainedCardInstanceIds: [
              retainedAgenda.instanceId,
              ...additionalCards.map((card) => card.instanceId),
            ],
          },
        },
      },
    });
  });

  it("keeps exact Encounter ownership when a deflector can be broken or resolved", () => {
    resetResidentPlanPortfolioMemory();
    const pump = legalAction(
      "pump-cyfermaster",
      "runner",
      "pump_breaker",
      "Pump Cyfermaster",
      { credits: 1, clicks: 0 },
      {
        source: "cyfermaster",
        payload: {
          breakerId: "cyfermaster",
          iceId: "entrapment",
          pumpStrengthAmount: 1,
        },
      },
    );
    const breakDeflector = legalAction(
      "break-entrapment",
      "runner",
      "break_subroutine",
      "Break Entrapment",
      { credits: 2, clicks: 0 },
      {
        source: "cyfermaster",
        payload: {
          breakerId: "cyfermaster",
          iceId: "entrapment",
          subroutineIndex: 0,
          subroutineId: "paid-deflect",
        },
      },
    );
    const continueRun = legalAction(
      "resolve-entrapment",
      "runner",
      "continue_run",
      "Resolve Entrapment",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: false,
          unbrokenSubroutineCount: 1,
          encounterSubroutineIds: "paid-deflect",
        },
      },
    );
    const input = aiInput("runner", [pump, breakDeflector, continueRun]);
    for (const action of input.legalActions) {
      action.timingPoint = "run.encounter_ice";
    }
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 3;
    input.playerView.own.rig = [
      visibleCard("cyfermaster", "runner", "program", {
        definitionId: "onr_v1_016_cyfermaster",
        strength: 5,
        subtypes: ["icebreaker"],
      }),
    ];
    const entrapment = visibleCard("entrapment", "corp", "ice", {
      definitionId: "onr_classic_010_entrapment",
      rezzed: true,
      strength: 4,
      subtypes: ["code_gate", "deflector"],
      effectiveRunQuote: {
        iceInstanceId: "entrapment",
        iceDefinitionId: "onr_classic_010_entrapment",
        effectiveStrength: 4,
        subroutines: [
          {
            id: "paid-deflect",
            type: "deflect_run",
            deflectorTarget: "any_data_fort",
            deflectorCost: 2,
          },
        ],
      },
    });
    const entrapmentWithoutCurrentQuote = { ...entrapment };
    delete entrapmentWithoutCurrentQuote.effectiveRunQuote;
    input.playerView.run = {
      runId: "run-on-mature-remote",
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: entrapmentWithoutCurrentQuote,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [entrapment]),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: continueRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          route: { actionId: continueRun.actionId },
        },
      },
    });
  });

  it("keeps exact Encounter ownership while pumping to break projected random core damage", () => {
    resetResidentPlanPortfolioMemory();
    const pump = legalAction(
      "pump-rent-i-con",
      "runner",
      "pump_breaker",
      "Rent-I-Con: Stärke +1",
      { credits: 1, clicks: 0 },
      {
        source: "rent-i-con",
        payload: {
          breakerId: "rent-i-con",
          iceId: "brain-drain",
          pumpStrengthAmount: 1,
        },
      },
    );
    const continueRun = legalAction(
      "resolve-brain-drain",
      "runner",
      "continue_run",
      "Subroutinen auslösen",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: false,
          unbrokenSubroutineCount: 1,
          encounterSubroutineIds: "brain-drain-random-damage",
        },
      },
    );
    const input = aiInput("runner", [pump, continueRun]);
    for (const action of input.legalActions) {
      action.timingPoint = "run.encounter_ice";
    }
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
    ];
    input.playerView.own.rig = [
      visibleCard("rent-i-con", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        strength: 2,
        subtypes: ["icebreaker"],
        rulesText:
          "[1]: Break ice subroutine. At the end of this run, trash Rent-I-Con. [1]: +1 strength",
      }),
    ];
    const brainDrain = visibleCard("brain-drain", "corp", "ice", {
      definitionId: "onr_classic_007_brain-drain",
      title: "Brain Drain",
      rezzed: true,
      strength: 3,
      subtypes: ["sentry", "black_ice", "ap"],
      effectiveRunQuote: {
        iceInstanceId: "brain-drain",
        iceDefinitionId: "onr_classic_007_brain-drain",
        effectiveStrength: 3,
        subroutines: [
          {
            id: "brain-drain-random-damage",
            type: "random_damage",
            amount: 3,
            damageType: "core",
            sourceDefinitionId: "onr_classic_007_brain-drain",
          },
        ],
      },
    });
    const encounteredBrainDrain = { ...brainDrain };
    delete encounteredBrainDrain.effectiveRunQuote;
    input.playerView.run = {
      runId: "run-on-brain-drain",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: encounteredBrainDrain,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [brainDrain]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: pump.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          route: { actionId: pump.actionId },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:convert_active_run_window",
        "plan_scheduler:route:breaker.boost_strength:plan:runner.convert_run_window:run%3Arun-on-brain-drain",
      ]),
    );
  });

  it("preserves the exact run-window break origin through mandatory post-break Stealth loss", () => {
    resetResidentPlanPortfolioMemory();
    const breakWall = legalAction(
      "runner.break_subroutine.pile-driver.fire-wall",
      "runner",
      "break_subroutine",
      "Pile Driver: Subroutine brechen",
      { credits: 3, clicks: 0 },
      {
        source: "pile-driver",
        payload: {
          breakerId: "pile-driver",
          iceId: "fire-wall",
          subroutineIndex: 0,
          subroutineIndexes: "0",
          breakSubroutineCount: 1,
          multiBreakSubroutines: true,
          breakSubroutineBaseCost: 3,
          cardId: "pile-driver",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "icebreaker_abilities_break_subroutine",
          cardImplementationAbilityId:
            "onr_v1_047_pile-driver:icebreaker_abilities_break_subroutine",
        },
      },
    );
    const continueRun = legalAction(
      "runner.continue_run.fire-wall",
      "runner",
      "continue_run",
      "Subroutinen auslösen",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
          encounterSubroutineIds: "printed_subroutines_end_the_run",
        },
      },
    );
    const input = aiInput("runner", [breakWall, continueRun]);
    for (const action of input.legalActions) {
      action.timingPoint = "run.encounter_ice";
    }
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 4;
    const restrictedPool = (id: string) => ({
      id: `pool-${id}`,
      amount: 3,
      displayKind: "restricted_pool" as const,
      label: "Run-Bits",
      ariaLabel: "3 Run-Bits",
      counterType: "bit" as const,
      usageHint: "spendable" as const,
      creditPool: {
        kind: "restricted_credit" as const,
        capacity: 3,
        uses: ["using_icebreaker_during_run_non_noisy" as const],
        refresh: {
          timing: "start_of_runner_turn" as const,
          behavior: "refill_to_capacity_if_used" as const,
        },
      },
    });
    input.playerView.own.rig = [
      visibleCard("pile-driver", "runner", "program", {
        definitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
        strength: 7,
        subtypes: ["icebreaker", "noisy"],
      }),
      visibleCard("cloak", "runner", "program", {
        definitionId: "onr_v1_011_cloak",
        title: "Cloak",
        subtypes: ["stealth"],
        counterDisplays: [restrictedPool("cloak")],
      }),
      visibleCard("owl", "runner", "hardware", {
        definitionId: "onr_v1_141_raven-microcyb-owl",
        title: "Raven Microcyb Owl",
        subtypes: ["deck", "stealth"],
        counterDisplays: [restrictedPool("owl")],
      }),
    ];
    const fireWall = visibleCard("fire-wall", "corp", "ice", {
      definitionId: "onr_v1_245_fire-wall",
      title: "Fire Wall",
      rezzed: true,
      strength: 4,
      subtypes: ["wall"],
      effectiveRunQuote: {
        iceInstanceId: "fire-wall",
        iceDefinitionId: "onr_v1_245_fire-wall",
        effectiveStrength: 4,
        subroutines: [
          {
            id: "printed_subroutines_end_the_run",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_245_fire-wall",
          },
        ],
      },
    });
    input.playerView.run = {
      runId: "run-pile-driver",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: fireWall,
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [fireWall]),
      server("archives"),
    ];

    const runtime = liveContext({
      selectedChoicesForDecision: (
        decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
        selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
        portfolio: Parameters<typeof selectedChoicesForDecision>[3],
      ) =>
        selectedChoicesForDecision(
          decisionInput,
          selectedAction,
          {
            evaluateCorpOpeningHand: () => ({ decision: "keep" }),
            evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
            discardKeepScore: () => ({ total: 0 }),
            selectedRunnerProgramInstallTrashOptionIds: () => [],
            selectedRunnerForcedProgramTrashOptionIds: () => [],
            selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
            extractAiFeatures: () => ({
              credits: 0,
              memoryRemaining: 4,
              hasInstalledNonNoisyIcebreaker: false,
              rigRoles: new Set(),
              rigDefinitionIds: new Set(),
            }),
            rolesForCardId: () => [],
            effectsForCardId: () => [],
          } as Parameters<typeof selectedChoicesForDecision>[2],
          portfolio,
        ),
    });
    const breakDecision = runtime.chooseSemanticRuntimeAction(input, {});

    expect(breakDecision).toMatchObject({
      actionId: breakWall.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          route: { actionId: breakWall.actionId },
        },
      },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.selectedActionOrigin,
    ).toMatchObject({
      selectedActionId: breakWall.actionId,
      immediateChoicePolicy: "resolve_runner_post_break_stealth_loss",
      breakerInstanceId: "pile-driver",
      requiredLoss: 3,
      sourceMode: "any_stealth_cards",
    });

    const choiceId = `choice_v1922_post_break_stealth_loss_${input.playerView.stateVersion + 1}`;
    const optionIds = [
      "stealth_cloak_1",
      "stealth_cloak_2",
      "stealth_cloak_3",
      "stealth_owl_1",
      "stealth_owl_2",
      "stealth_owl_3",
    ];
    const resolveChoice = legalAction(
      "runner.resolve_choice",
      "runner",
      "resolve_choice",
      "Stealth-Verlust verteilen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    resolveChoice.timingPoint = "run.encounter_ice";
    resolveChoice.expiresAtStateVersion = input.playerView.stateVersion + 1;
    resolveChoice.choiceRequirements = [
      {
        choiceId,
        minSelections: 3,
        maxSelections: 3,
        optionIds,
      },
    ];
    const next = structuredClone(input);
    next.playerView.stateVersion += 1;
    next.legalActions = [resolveChoice];
    next.playerView.legalActions = next.legalActions;
    next.playerView.pendingChoice = {
      choiceId,
      side: "runner",
      source: `v1922.post_break_stealth_loss:any_stealth_cards:3:pile-driver:${next.playerView.stateVersion}`,
      prompt: "Stealth-Verlust verteilen.",
      kind: "select_cards",
      options: optionIds.map((id) => ({
        id,
        label: id,
        value: id.startsWith("stealth_cloak") ? "cloak" : "owl",
      })),
      minSelections: 3,
      maxSelections: 3,
      stateVersion: next.playerView.stateVersion,
      visibility: "hidden_info_barrier",
      continuation: {
        family: "runner_post_break_stealth_loss",
        originActionId: breakWall.actionId,
        breakerInstanceId: "pile-driver",
        requiredLoss: 3,
        sourceMode: "any_stealth_cards",
        createdAtStateVersion: next.playerView.stateVersion,
      },
    };

    const choiceDecision = runtime.chooseSemanticRuntimeAction(next, {});

    expect(choiceDecision).toMatchObject({
      actionId: resolveChoice.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      selectedChoices: {
        choiceId,
        selectedOptionIds: [
          "stealth_cloak_1",
          "stealth_cloak_2",
          "stealth_cloak_3",
        ],
      },
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
        },
      },
    });
  });

  it("keeps a coerced sole run continuation in the automatic Engine-window lane", () => {
    resetResidentPlanPortfolioMemory();
    const continueRun = legalAction(
      "continue",
      "runner",
      "continue_run",
      "Continue run",
      { credits: 0, clicks: 0 },
      {
        source: "game_rule",
        payload: {
          encounterContinue: true,
          encounterWillEndRun: false,
          unbrokenSubroutineCount: 0,
        },
      },
    );
    const input = aiInput("runner", [continueRun]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "movement",
      position: { kind: "server", serverId: "hq" },
      successful: false,
    };

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "continue",
      reasonCode: "plan_first.engine_window",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain("plan_first_lane:engine_window");
  });

  it("keeps Vacuum Link bound to the active run plan after a failed Blink break", () => {
    resetResidentPlanPortfolioMemory();
    const startRun = legalAction(
      "runner.start_run.rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const breakVacuumLink = legalAction(
      "runner.break_subroutine.blink.vacuum-link",
      "runner",
      "break_subroutine",
      "Blink: Subroutine brechen",
      { credits: 0, clicks: 0 },
      {
        source: "blink",
        payload: {
          breakerId: "blink",
          iceId: "vacuum-link",
          subroutineIndex: 0,
          subroutineIndexes: "0",
          breakSubroutineCount: 1,
          cardId: "blink",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "icebreaker_abilities_break_subroutine",
          cardImplementationAbilityId:
            "onr_v1_007_blink:icebreaker_abilities_break_subroutine",
        },
      },
    );
    const continueVacuumLink = legalAction(
      "runner.continue_run.vacuum-link",
      "runner",
      "continue_run",
      "Subroutinen auslösen",
      { credits: 0, clicks: 0 },
      {
        source: "game_rule",
        payload: {
          encounterContinue: true,
          encounterWillEndRun: false,
          sourceDefinitionId: "onr_v1_275_vacuum-link",
          unbrokenSubroutineCount: 1,
          encounterSubroutineIds:
            "printed_subroutines_random_resume_from_rezzed_ice_back_or_jack_out",
        },
      },
    );
    for (const action of [breakVacuumLink, continueVacuumLink]) {
      action.timingPoint = "run.encounter_ice";
    }
    const input = aiInput("runner", [breakVacuumLink, continueVacuumLink]);
    input.playerView.stateVersion = 2;
    for (const action of input.legalActions) action.expiresAtStateVersion = 2;
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 3;
    input.playerView.own.rig = [
      visibleCard("blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        title: "Blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    const vacuumLink = withEffectiveRunQuote(
      visibleCard("vacuum-link", "corp", "ice", {
        definitionId: "onr_v1_275_vacuum-link",
        title: "Vacuum Link",
        rezzed: true,
        strength: 5,
        subtypes: ["random", "sentry"],
      }),
      {
        effectiveStrength: 5,
        subroutines: [
          {
            id: "printed_subroutines_random_resume_from_rezzed_ice_back_or_jack_out",
            type: "rewind_run_to_rezzed_ice_by_die",
            sourceDefinitionId: "onr_v1_275_vacuum-link",
            sourceTitle: "Vacuum Link",
          },
        ],
      },
    );
    input.playerView.run = {
      runId: "run-vacuum",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 1 },
      encounteredIce: vacuumLink,
      successful: false,
    };
    const innerWall = withEffectiveRunQuote(
      visibleCard("inner-wall", "corp", "ice", {
        definitionId: "onr_v1_279_wall-of-static",
        title: "Wall of Static",
        rezzed: true,
        strength: 2,
        subtypes: ["wall"],
      }),
      {
        effectiveStrength: 2,
        subroutines: [
          {
            id: "printed_subroutines_end_the_run",
            type: "end_the_run",
            sourceDefinitionId: "onr_v1_279_wall-of-static",
            sourceTitle: "Wall of Static",
          },
        ],
      },
    );
    input.playerView.servers = [
      server("hq"),
      server("rd", [innerWall, vacuumLink]),
      server("archives"),
    ];
    input.eventTail = [
      {
        eventId: "evt-start-vacuum-run",
        type: "start_run",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:start-vacuum-run",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        },
      },
    ];
    const startInput = aiInput("runner", [startRun]);
    startInput.playerView.servers = structuredClone(input.playerView.servers);
    startInput.playerView.own.credits = input.playerView.own.credits;
    startInput.playerView.own.rig = structuredClone(input.playerView.own.rig);
    const runtime = liveContext({
      evaluateRunnerRunTargets: () => [
        safeRuntimeRunTarget(startRun.actionId, "rd"),
      ],
      selectedChoicesForDecision: (
        decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
        selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
        portfolio: Parameters<typeof selectedChoicesForDecision>[3],
      ) =>
        selectedChoicesForDecision(
          decisionInput,
          selectedAction,
          {
            evaluateCorpOpeningHand: () => ({ decision: "keep" }),
            evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
            discardKeepScore: () => ({ total: 0 }),
            selectedRunnerProgramInstallTrashOptionIds: () => [],
            selectedRunnerForcedProgramTrashOptionIds: () => [],
            selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
            extractAiFeatures: () => ({
              credits: 0,
              memoryRemaining: 4,
              hasInstalledNonNoisyIcebreaker: false,
              rigRoles: new Set(),
              rigDefinitionIds: new Set(),
            }),
            rolesForCardId: () => [],
            effectsForCardId: () => [],
          } as Parameters<typeof selectedChoicesForDecision>[2],
          portfolio,
        ),
    });

    const startDecision = runtime.chooseSemanticRuntimeAction(startInput, {});
    expect(startDecision).toMatchObject({
      actionId: startRun.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      decisionDebug: { planKind: "runner.pressure_central" },
    });
    const breakDecision = runtime.chooseSemanticRuntimeAction(input, {});
    expect(breakDecision).toMatchObject({
      actionId: breakVacuumLink.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: { planKind: "runner.convert_run_window" },
    });
    const runOwner = residentPlanPortfolioSnapshot(input);
    const rootPlanInstanceId = runOwner?.rootForegroundInstanceId;
    const executorInstanceId = runOwner?.executorInstanceId;

    const forcedContinueInput = structuredClone(input);
    forcedContinueInput.playerView.stateVersion = 3;
    forcedContinueInput.legalActions = [structuredClone(continueVacuumLink)];
    forcedContinueInput.legalActions[0]!.expiresAtStateVersion = 3;
    forcedContinueInput.playerView.legalActions =
      forcedContinueInput.legalActions;
    forcedContinueInput.eventTail.push({
      eventId: "evt-blink-break-attempt",
      type: "break_subroutine",
      stateVersionBefore: 2,
      stateVersionAfter: 3,
      stateHashAfter: "fnv1a:blink-break-attempt",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "runner",
        actionType: "break_subroutine",
      },
    });
    const forcedDecision = runtime.chooseSemanticRuntimeAction(
      forcedContinueInput,
      {},
    );
    const forcedPortfolio = residentPlanPortfolioSnapshot(forcedContinueInput);
    expect(forcedDecision).toMatchObject({
      actionId: continueVacuumLink.actionId,
      reasonCode: "plan_first.engine_window",
    });
    expect(forcedPortfolio).toMatchObject({
      rootForegroundInstanceId: rootPlanInstanceId,
      executorInstanceId,
      selectedActionOrigin: {
        rootPlanInstanceId,
        executorInstanceId,
        selectedActionId: continueVacuumLink.actionId,
        selectedAtStateVersion: 3,
        immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
        sourceActionType: "continue_run",
      },
    });

    const choiceId = "card_implementation.vacuum_link_rewind:run-vacuum:4";
    const resolveChoice = legalAction(
      "runner.resolve_choice",
      "runner",
      "resolve_choice",
      "Vacuum Link: Run fortsetzen oder ausstöpseln",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    resolveChoice.timingPoint = "run.encounter_ice";
    resolveChoice.expiresAtStateVersion = 4;
    resolveChoice.choiceRequirements = [
      {
        choiceId,
        minSelections: 1,
        maxSelections: 1,
        optionIds: ["resume_from_rezzed_ice_back", "jack_out"],
      },
    ];
    const choiceInput = structuredClone(forcedContinueInput);
    choiceInput.playerView.stateVersion = 4;
    choiceInput.legalActions = [resolveChoice];
    choiceInput.playerView.legalActions = choiceInput.legalActions;
    choiceInput.playerView.pendingChoice = {
      choiceId,
      side: "runner",
      source: "card_implementation.vacuum_link_rewind",
      sourceCardInstanceId: "vacuum-link",
      sourceCardDefinitionId: "onr_v1_275_vacuum-link",
      prompt: "Run fortsetzen oder ausstöpseln?",
      kind: "select_option",
      options: [
        {
          id: "resume_from_rezzed_ice_back",
          label: "Run beim zurückliegenden Ice fortsetzen",
          value: "resume_from_rezzed_ice_back",
        },
        { id: "jack_out", label: "Ausstöpseln", value: "jack_out" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 4,
      visibility: "public",
    };
    choiceInput.eventTail.push({
      eventId: "evt-vacuum-link-choice",
      type: "continue_run",
      stateVersionBefore: 3,
      stateVersionAfter: 4,
      stateHashAfter: "fnv1a:vacuum-link-choice",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "runner",
        actionType: "continue_run",
        resolvedEffects: [
          {
            effectId: "vacuum-link-rewind",
            kind: "resolve_subroutine",
            sourceDefinitionId: "onr_v1_275_vacuum-link",
            visibility: "public",
          },
        ],
      },
    });

    const choiceDecision = runtime.chooseSemanticRuntimeAction(choiceInput, {});
    expect(choiceDecision).toMatchObject({
      actionId: resolveChoice.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      selectedChoices: {
        choiceId,
        selectedOptionIds: ["resume_from_rezzed_ice_back"],
      },
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId,
          leafExecutorInstanceId: executorInstanceId,
        },
      },
    });
  });

  it("keeps an exact scored-card run-end ability inside corp.defend_servers", () => {
    resetResidentPlanPortfolioMemory();
    const endRun = legalAction(
      "corp-remap-end-run",
      "corp",
      "activated_card_ability",
      "End the current run",
      { credits: 0, clicks: 0 },
      {
        source: "scored-remap",
        payload: {
          cardId: "scored-remap",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "spend_remap_counter_end_run",
          cardImplementationAbilityId:
            "onr_classic_001_data-fort-remapping:spend_remap_counter_end_run",
          cardImplementationAbilityTiming: "corp_during_run",
          cardImplementationEffectKind: "end_run",
          cardImplementationSourceCounterType: "remap",
          cardImplementationSourceCounterCost: 1,
        },
      },
    );
    const decline = legalAction(
      "corp-decline-remap",
      "corp",
      "decline_rez",
      "Decline",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    endRun.timingPoint = "run.approach_ice";
    decline.timingPoint = "run.approach_ice";
    const input = aiInput("corp", [endRun, decline]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;
    input.playerView.timingPoint = "run.approach_ice";
    input.playerView.run = {
      runId: "remote-contest-run",
      attackedServerId: "remote_1",
      phase: "approach_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall", "corp", "ice", {
          definitionId: "onr_classic_011_glacier",
          rezzed: false,
        }),
      ]),
    ];
    input.playerView.own.scoreArea = [
      visibleCard("scored-remap", "corp", "agenda", {
        definitionId: "onr_classic_001_data-fort-remapping",
        counters: { remap: 1 },
      }),
    ];
    expect(
      buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "corp",
        stateVersion: input.playerView.stateVersion,
        visibleSourceDefinitionsByInstanceId: {
          "scored-remap": "onr_classic_001_data-fort-remapping",
        },
      }).find((candidate) => candidate.actionId === endRun.actionId),
    ).toMatchObject({
      semanticActionType: "run.end_by_corp",
      sourceCardInstanceId: "scored-remap",
      sourceDefinitionId: "onr_classic_001_data-fort-remapping",
      primaryProjectionStatus: "projected",
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: endRun.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.defend_servers",
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:corp.defend_servers:server-defense-portfolio",
          leafExecutorInstanceId:
            "plan:corp.defend_servers:server-defense-portfolio",
          route: { actionId: endRun.actionId },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
  });

  it("keeps an exact CardSpec successful-run followup inside the run-window plan", () => {
    resetResidentPlanPortfolioMemory();
    const creditSubversion = legalAction(
      "runner.trigger_ability.credit-subversion.hq",
      "runner",
      "trigger_ability",
      "Credit Subversion: Korp verliert Credits",
      { credits: 0, clicks: 0 },
      {
        source: "credit-subversion-installed",
        visibility: "private_to_actor",
        payload: {
          sourceCardId: "credit-subversion-installed",
          sourceDefinitionId: "onr_proteus_136_credit-subversion",
          cardId: "credit-subversion-installed",
          serverId: "hq",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_proteus_136_credit-subversion:hq_success_reveal_trash_source_corp_lose_three",
          cardImplementationAbilityKey:
            "hq_success_reveal_trash_source_corp_lose_three",
          cardImplementationPrimitiveKind:
            "successful_run_before_access_effect",
          cardImplementationEffectKind: "corp_lose_credits",
          creditLoss: 3,
        },
      },
    );
    const input = aiInput("runner", [creditSubversion]);
    input.playerView.timingPoint = "access.resolve_card";
    input.playerView.run = {
      runId: "credit-subversion-hq-run",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      successful: true,
    };
    input.playerView.opponent.credits = 3;

    const sanitized = buildAiDecisionInputDto({
      side: input.side,
      playerView: input.playerView,
      eventTail: input.eventTail,
      legalActions: input.legalActions,
      difficulty: input.difficulty,
      seed: input.seed,
      decisionId: input.decisionId,
      actionNumber: input.actionNumber,
      profileId: input.profileId,
    });
    expect(sanitized.legalActions[0]?.payload).toMatchObject({
      cardImplementationPrimitiveKind: "successful_run_before_access_effect",
      cardImplementationEffectKind: "corp_lose_credits",
      creditLoss: 3,
    });
    input.legalActions = sanitized.legalActions;
    input.playerView.legalActions = sanitized.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: creditSubversion.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          route: { actionId: creditSubversion.actionId },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
  });

  it("fails closed when a claimed CardSpec successful-run followup lacks AbilityRef", () => {
    resetResidentPlanPortfolioMemory();
    const malformed = legalAction(
      "runner.trigger_ability.credit-subversion.unbound",
      "runner",
      "trigger_ability",
      "Unbound successful-run followup",
      { credits: 0, clicks: 0 },
      {
        source: "credit-subversion-installed",
        payload: {
          sourceCardId: "credit-subversion-installed",
          sourceDefinitionId: "onr_proteus_136_credit-subversion",
          serverId: "hq",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_proteus_136_credit-subversion:hq_success_reveal_trash_source_corp_lose_three",
          cardImplementationAbilityKey:
            "hq_success_reveal_trash_source_corp_lose_three",
          cardImplementationPrimitiveKind:
            "successful_run_before_access_effect",
          cardImplementationEffectKind: "corp_lose_credits",
          creditLoss: 3,
        },
      },
    );
    delete malformed.abilityRef;
    const input = aiInput("runner", [malformed]);
    input.playerView.timingPoint = "access.resolve_card";
    input.playerView.run = {
      runId: "unbound-credit-subversion-hq-run",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      successful: true,
    };

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      "AI038 canonical capability binding is incomplete or conflicts with its source.",
    );
  });

  it.each([
    ["mandatory draw", "corp", "mandatory_draw"],
    ["choice resolution", "runner", "resolve_choice"],
    ["decline rez", "corp", "decline_rez"],
    ["restricted-capacity forgo", "runner", "forgo_action"],
  ] as const)(
    "keeps a coerced sole %s in the automatic Engine-window lane",
    (_label, side, actionType) => {
      resetResidentPlanPortfolioMemory();
      const action = legalAction(
        `forced-${actionType}`,
        side,
        actionType,
        actionType,
        { credits: 0, clicks: 0 },
        { source: "game_rule" },
      );
      const decision = liveContext().chooseSemanticRuntimeAction(
        aiInput(side, [action]),
        {},
      );

      expect(decision).toMatchObject({
        actionId: `forced-${actionType}`,
        reasonCode: "plan_first.engine_window",
        fallbackUsed: false,
      });
      expect(decision.evidence).toContain("plan_first_lane:engine_window");
    },
  );

  it.each([
    ["jack out", "jack_out", "jack-out", {}],
    ["steal an agenda", "steal_agenda", "steal", {}],
    [
      "boost a breaker",
      "pump_breaker",
      "pump",
      {
        source: "breaker",
        payload: {
          breakerId: "breaker",
          iceId: "ice",
          pumpStrengthAmount: 1,
        },
      },
    ],
    [
      "break a subroutine",
      "break_subroutine",
      "break",
      {
        source: "breaker",
        payload: {
          breakerId: "breaker",
          iceId: "ice",
          subroutineIndex: 0,
        },
      },
    ],
  ] as const)(
    "routes a sole voluntary %s action through the Run/Access plan",
    (_label, actionType, actionId, options) => {
      resetResidentPlanPortfolioMemory();
      const action = legalAction(
        actionId,
        "runner",
        actionType,
        actionType,
        { credits: 0, clicks: 0 },
        options,
      );
      const input = aiInput("runner", [action]);
      if (
        actionType === "jack_out" ||
        actionType === "pump_breaker" ||
        actionType === "break_subroutine"
      ) {
        input.playerView.timingPoint =
          actionType === "jack_out"
            ? "run.jack_out_window"
            : "run.encounter_ice";
        input.playerView.run = {
          attackedServerId: "hq",
          phase: actionType === "jack_out" ? "movement" : "encounter_ice",
          position: { kind: "ice", serverId: "hq", iceIndex: 0 },
          successful: false,
        };
      }

      const legacyChoices = vi.fn(() => {
        throw new Error("legacy_semantic_selection_invoked");
      });
      const decision = liveContext({
        semanticRuntimeChoices: legacyChoices,
      }).chooseSemanticRuntimeAction(input, {});

      expect(decision).toMatchObject({
        actionId,
        reasonCode: "plan_first.runner.convert_run_window",
        fallbackUsed: false,
      });
      expect(decision.evidence).toContain("plan_first_lane:plan");
      expect(
        decision.decisionDebug?.planFirstDecision?.turnPlanning,
      ).toMatchObject({
        mode: "cutover",
        coverage: {
          status: "pass",
          coveragePercent: 100,
        },
      });
      expect(legacyChoices).not.toHaveBeenCalled();
    },
  );

  it("rejects a one-shot search without a bound target plan instead of treating it as generic development", () => {
    resetResidentPlanPortfolioMemory();
    const search = legalAction(
      "play-mantis",
      "runner",
      "play_event",
      "Mantis, Fixer-at-Large spielen",
      { credits: 3, clicks: 1 },
      {
        source: "mantis-card",
        payload: { cardId: "mantis-card" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [search, credit]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("mantis-card", "runner", "event", {
        definitionId: "onr_v1_099_mantis-fixer-at-large",
        title: "Mantis, Fixer-at-Large",
        rulesText:
          "Search your stack for a card, and bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("rejects an installed program tutor only with proof that the known deck has no unrepresented program target", () => {
    resetResidentPlanPortfolioMemory();
    const search = legalAction(
      "short-circuit-search",
      "runner",
      "activated_card_ability",
      "Search stack for a program",
      { credits: 1, clicks: 1 },
      {
        source: "short-circuit",
        payload: {
          cardId: "short-circuit",
          sourceDefinitionId: "onr_v1_177_the-short-circuit",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [search, credit, end]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 4;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.rig = [
      visibleCard("short-circuit", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
      }),
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("newsgroup-in-grip", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "program-tutor-no-unrepresented-target",
        side: "runner",
        cards: [
          { cardId: "onr_v1_007_blink", quantity: 3 },
          { cardId: "onr_v1_045_newsgroup-filter", quantity: 1 },
        ],
      },
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("leaves an unowned program tutor unselected while an exact economy route acts", () => {
    resetResidentPlanPortfolioMemory();
    const search = legalAction(
      "short-circuit-search",
      "runner",
      "activated_card_ability",
      "Search stack for a program",
      { credits: 1, clicks: 1 },
      {
        source: "short-circuit",
        payload: {
          cardId: "short-circuit",
          sourceDefinitionId: "onr_v1_177_the-short-circuit",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [search, credit]);
    input.playerView.own.credits = 6;
    input.playerView.own.clicks = 4;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.rig = [
      visibleCard("short-circuit", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
      }),
      visibleCard("blink-installed", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "program-tutor-unrepresented-target",
        side: "runner",
        cards: [
          { cardId: "onr_v1_007_blink", quantity: 3 },
          { cardId: "onr_v1_047_pile-driver", quantity: 1 },
        ],
      },
    });

    const tutorDecision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(tutorDecision).toMatchObject({
      actionId: "credit",
      fallbackUsed: false,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
    expect(tutorDecision.evidence).toContain(
      "plan_assessment_evidence:runner_engine_certified_immediate_liquidity_development",
    );
  });

  it("groups every legal install variant of one program-search source into one stable plan", () => {
    resetResidentPlanPortfolioMemory();
    const direct = legalAction(
      "install-smc-direct",
      "runner",
      "install_card",
      "Install Self-Modifying Code",
      { credits: 0, clicks: 1 },
      {
        source: "smc",
        payload: { cardId: "smc" },
      },
    );
    const withTrash = legalAction(
      "install-smc-with-trash",
      "runner",
      "install_card",
      "Install Self-Modifying Code after trashing a program",
      { credits: 0, clicks: 1 },
      {
        source: "smc",
        payload: {
          cardId: "smc",
          trashBeforeInstall: "installed-program",
        },
      },
    );
    const input = aiInput("runner", [direct, withTrash]);
    input.playerView.own.credits = 5;
    input.playerView.own.memoryLimit = 5;
    input.playerView.own.memoryUsed = 3;
    input.playerView.own.rig = fullNonNoisyBreakerRig();
    input.playerView.own.gripOrHq = [
      visibleCard("smc", "runner", "program", {
        definitionId: "onr_v1_059_self-modifying-code",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "program-search-multi-install-route",
        side: "runner",
        cards: [
          {
            cardId: "onr_v1_059_self-modifying-code",
            quantity: 1,
          },
          { cardId: "onr_v1_071_vewy-vewy-quiet", quantity: 2 },
        ],
      },
    });
    const decision = liveContext({
      runnerStrategicIntentForInput: recurringProgramSearchIntent,
    }).chooseSemanticRuntimeAction(input, {});

    expect([direct.actionId, withTrash.actionId]).toContain(decision.actionId);
    expect(decision).toMatchObject({
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
  });

  it("dispositions a source-normalized optional program-trash install when its direct SMC sibling is legal", () => {
    resetResidentPlanPortfolioMemory();
    const direct = legalAction(
      "install-smc-direct",
      "runner",
      "install_card",
      "Install Self-Modifying Code",
      { credits: 0, clicks: 1 },
      { source: "smc", payload: { cardId: "smc" } },
    );
    const withTrash = legalAction(
      "install-smc-trash.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Install Self-Modifying Code after trashing a program",
      { credits: 0, clicks: 1 },
      {
        source: "smc",
        payload: {
          cardId: "smc",
        },
      },
    );
    const input = aiInput("runner", [direct, withTrash]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("smc", "runner", "program", {
        definitionId: "onr_v1_059_self-modifying-code",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "program-search-source-normalized-variant",
        side: "runner",
        cards: [
          { cardId: "onr_v1_059_self-modifying-code", quantity: 1 },
          { cardId: "onr_v1_047_pile-driver", quantity: 1 },
        ],
      },
    });

    const decision = liveContext({
      buildActionSemanticCandidates: (
        params: Parameters<typeof buildActionSemanticCandidates>[0],
      ) =>
        buildActionSemanticCandidates(params).map((candidate) => {
          if (candidate.actionId !== withTrash.actionId) return candidate;
          const {
            sourceCardInstanceId: _sourceCardInstanceId,
            ...withoutSource
          } = candidate;
          return withoutSource;
        }),
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas",
        setupEngine: ["runner.search_breaker_setup"],
      }),
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [
            {
              cardId: "onr_v1_047_pile-driver",
              title: "Pile Driver",
              coverage: ["wall"],
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 1,
              locations: ["in_deck"],
              confidence: "high",
              evidence: ["test_wall_breaker_in_deck"],
            },
          ],
          breakerCoverageMatrix: {
            wall: {
              coverage: "wall",
              inDeckKnown: true,
              inHand: false,
              installed: false,
              searchableNow: true,
              drawOnly: false,
              missing: false,
              bestKnownCards: ["onr_v1_047_pile-driver"],
              blockers: ["needs_search_action"],
            },
          },
          searchAccess: {
            tools: [
              {
                cardId: "onr_v1_059_self-modifying-code",
                title: "Self-Modifying Code",
                status: "in_hand",
                canSearchPrograms: true,
                canSearchBreakers: true,
                legalNow: true,
                confidence: "high",
                evidence: ["test_smc_legal"],
              },
            ],
            canSearchProgramsNow: true,
            canSearchBreakersNow: true,
            evidence: ["test_smc_legal"],
          },
          economyBankTools: [],
        },
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: direct.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
  });

  it("does not let deck-strategy program search reclaim a card rejected by hand development", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-smc",
      "runner",
      "install_card",
      "Install Self-Modifying Code",
      { credits: 0, clicks: 1 },
      {
        source: "smc",
        payload: { cardId: "smc" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [install, credit]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("smc", "runner", "program", {
        definitionId: "onr_v1_059_self-modifying-code",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "program-search-rejected-by-card-plan",
        side: "runner",
        cards: [
          {
            cardId: "onr_v1_059_self-modifying-code",
            quantity: 1,
          },
          { cardId: "onr_v1_047_pile-driver", quantity: 1 },
        ],
      },
    });

    expect(
      liveContext({
        runnerStrategicIntentForInput: () => ({
          primaryWinIntent: "runner.access_agendas",
          setupEngine: ["runner.search_breaker_setup"],
        }),
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "smc",
            definitionId: "onr_v1_059_self-modifying-code",
            legalActionId: install.actionId,
            priority: 500,
            deferReason: "preserve_credit_floor",
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("keeps an early Broker install exclusively with the credit-bank plan", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-broker",
      "runner",
      "install_card",
      "Install Broker",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: { cardId: "broker-card" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [install, credit, endTurn]);
    input.playerView.own.credits = 3;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("broker-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];

    expect(
      liveContext({
        deckCapabilitiesForInput: () => ({
          runner: {
            searchAccess: { tools: [] },
            economyBankTools: [
              {
                cardId: "onr_v1_154_broker",
                sourceCardInstanceId: "broker-card",
                title: "Broker",
                ownerSide: "runner",
                status: "in_hand",
                currentBankAmount: 0,
                buildActionLegal: false,
                cashOutActionLegal: false,
                buildActionIds: [],
                cashOutActionIds: [],
                confidence: "high",
                evidence: ["test_broker_in_hand"],
              },
            ],
          },
        }),
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 5,
          fundingNeed: false,
          evidence: ["test_reserve_satisfied"],
        }),
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "broker-card",
            definitionId: "onr_v1_154_broker",
            legalActionId: "install-broker",
            priority: 80,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planId: expect.stringContaining("broker-card"),
        planKind: "runner.credit_bank",
        planFirstDecision: {
          route: {
            actionId: install.actionId,
          },
        },
      },
    });
  });

  it("routes an in-hand Short-Term Contract lifecycle bank through the credit-bank plan", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-contract",
      "runner",
      "install_card",
      "Install Short-Term Contract",
      { credits: 1, clicks: 1 },
      {
        source: "contract-card",
        payload: { cardId: "contract-card" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [install, credit]);
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("contract-card", "runner", "resource", {
        definitionId: "onr_v1_178_short-term-contract",
        title: "Short-Term Contract",
      }),
    ];

    expect(
      liveContext({
        deckCapabilitiesForInput: () => ({
          runner: {
            searchAccess: { tools: [] },
            economyBankTools: [
              {
                cardId: "onr_v1_178_short-term-contract",
                sourceCardInstanceId: "contract-card",
                title: "Short-Term Contract",
                ownerSide: "runner",
                status: "in_hand",
                currentBankAmount: 0,
                estimatedPayout: 2,
                buildActionLegal: true,
                cashOutActionLegal: false,
                buildActionIds: [install.actionId],
                cashOutActionIds: [],
                confidence: "high",
                evidence: ["test_contract_in_hand"],
              },
            ],
          },
        }),
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 5,
          fundingNeed: true,
          evidence: ["test_funding_need"],
        }),
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "contract-card",
            definitionId: "onr_v1_178_short-term-contract",
            legalActionId: install.actionId,
            priority: 80,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.credit_bank",
      },
    });
  });

  it("defers a bank install variant while a productive credit route remains", () => {
    resetResidentPlanPortfolioMemory();
    const direct = legalAction(
      "install-bank",
      "runner",
      "install_card",
      "Install bank",
      { credits: 0, clicks: 1 },
      {
        source: "bank-card",
        payload: { cardId: "bank-card" },
      },
    );
    const trashBeforeInstall = legalAction(
      "install-bank.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install bank",
      { credits: 0, clicks: 1 },
      {
        source: "bank-card",
        payload: {
          cardId: "bank-card",
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [
      direct,
      trashBeforeInstall,
      credit,
      endTurn,
    ]);
    input.playerView.own.credits = 10;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("bank-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];

    expect(
      liveContext({
        deckCapabilitiesForInput: () => ({
          runner: {
            searchAccess: { tools: [] },
            economyBankTools: [
              {
                cardId: "onr_v1_154_broker",
                title: "Broker",
                ownerSide: "runner",
                status: "in_hand",
                currentBankAmount: 0,
                buildActionLegal: false,
                cashOutActionLegal: false,
                buildActionIds: [],
                cashOutActionIds: [],
                confidence: "high",
                evidence: ["test_bank_in_hand"],
              },
            ],
          },
        }),
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 5,
          fundingNeed: false,
          evidence: ["test_reserve_satisfied"],
        }),
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "bank-card",
            definitionId: "onr_v1_154_broker",
            legalActionId: direct.actionId,
            priority: 80,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("defines both Broker alternatives when cash-out is the active bank phase", () => {
    resetResidentPlanPortfolioMemory();
    const build = legalAction(
      "broker-build",
      "runner",
      "activated_card_ability",
      "Add hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "store_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:store_credits",
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: 3,
        },
      },
    );
    const cash = legalAction(
      "broker-cash",
      "runner",
      "activated_card_ability",
      "Take hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "withdraw_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:withdraw_credits",
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 3,
          gainCreditsAmount: 3,
        },
      },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [build, cash, run]);
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 4;
    input.playerView.own.rig = [
      visibleCard("broker-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      targetServerId: "remote_1",
      targetKind: "remote" as const,
      accessServerId: "remote_1",
      accessTargetKind: "remote" as const,
      knownAccessState: "unknown" as const,
      accessPayoff: "score_threat" as const,
      scoreThreat: true,
      recommendation: "gain_credits_first" as const,
      pathCost: 6,
      creditsAfterRun: 0,
      score: 500,
      routeQuote: { fundingGap: 3 },
    };
    const completeEconomy = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [],
    });

    expect(
      liveContext({
        deckCapabilitiesForInput: () => ({
          runner: {
            searchAccess: { tools: [] },
            economyBankTools: [
              {
                cardId: "onr_v1_154_broker",
                title: "Broker",
                ownerSide: "runner",
                status: "installed",
                currentBankAmount: 3,
                estimatedPayout: 3,
                buildActionLegal: true,
                cashOutActionLegal: true,
                buildActionIds: ["broker-build"],
                cashOutActionIds: ["broker-cash"],
                confidence: "high",
                evidence: ["test_broker_installed"],
              },
            ],
          },
        }),
        evaluateRunnerRunTargets: () => [target],
        buildRunnerEconomyPosture: () => completeEconomy,
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "broker-cash",
      fallbackUsed: false,
    });
  });

  it("uses a two-credit bank withdrawal instead of a one-credit basic action below reserve", () => {
    resetResidentPlanPortfolioMemory();
    const cash = legalAction(
      "short-term-contract-cash",
      "runner",
      "activated_card_ability",
      "Take 2 hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "short-term-contract",
        payload: {
          cardId: "short-term-contract",
          sourceDefinitionId: "onr_v1_178_short-term-contract",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "abilities_activated_runner_main_take_hosted_credits",
          cardImplementationAbilityId:
            "onr_v1_178_short-term-contract:abilities_activated_runner_main_take_hosted_credits",
          cardImplementationTakesHostedCredits: true,
          cardImplementationHostedCreditCashOutMaxUses: 6,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        },
      },
    );
    const credit = legalAction(
      "basic-credit",
      "runner",
      "gain_credit",
      "Gain 1 credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [cash, credit]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 3;
    input.playerView.own.rig = [
      visibleCard("short-term-contract", "runner", "resource", {
        definitionId: "onr_v1_178_short-term-contract",
        title: "Short-Term Contract",
        counters: { bit: 12 },
        counterDisplays: [
          {
            id: "stored_credits",
            amount: 12,
            displayKind: "stored_credits",
            label: "Credits",
            ariaLabel: "12 gespeicherte Credits",
            counterType: "bit",
            usageHint: "spendable",
            creditPool: { kind: "stored_credit" },
          },
        ],
      }),
    ];

    const capabilities = buildDeckCapabilityProfileFromInput(input);
    expect(capabilities.runner?.economyBankTools).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: "short-term-contract",
        currentBankAmount: 12,
        estimatedPayout: 2,
        buildActionLegal: false,
        cashOutActionLegal: true,
        cashOutActionIds: [cash.actionId],
      }),
    ]);

    const decision = liveContext({
      deckCapabilitiesForInput: () => capabilities,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 2,
        desiredCreditReserve: 5,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: cash.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.evidenceCodes,
    ).toEqual(
      expect.arrayContaining([
        "runner_credit_bank_cashout_for_click_efficient_liquidity",
      ]),
    );
  });

  it("keeps same-definition Broker cadence and plan identity per card instance", () => {
    resetResidentPlanPortfolioMemory();
    const secondBuild = legalAction(
      "broker-2-build",
      "runner",
      "activated_card_ability",
      "Add hosted credits to the second Broker",
      { credits: 0, clicks: 1 },
      {
        source: "broker-2",
        payload: {
          cardId: "broker-2",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "store_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:store_credits",
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: 3,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [secondBuild, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.rig = [
      visibleCard("broker-1", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
      visibleCard("broker-2", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];
    input.playerView.publicEvents = [
      {
        eventId: "broker-1-loaded",
        type: "activated_card_ability",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        turnSerial: 1,
        stateHashAfter: "fnv1a:broker-1-loaded",
        publicPayload: {
          actor: "runner",
          actionType: "activated_card_ability",
          sourceDefinitionId: "onr_v1_154_broker",
          resolvedEffects: [
            {
              effectId: "broker-1-load-effect",
              kind: "add_hosted_credits",
              visibility: "public",
              amount: 3,
            },
          ],
        },
      },
    ];
    input.eventTail = input.playerView.publicEvents;

    const decision = liveContext({
      deckCapabilitiesForInput: buildDeckCapabilityProfileFromInput,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 5,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: secondBuild.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planId: expect.stringContaining("broker-2"),
        planKind: "runner.credit_bank",
        planFirstDecision: {
          leafExecutorInstanceId: expect.stringContaining("broker-2"),
          route: {
            actionId: secondBuild.actionId,
          },
        },
      },
    });
  });

  it("keeps an admitted development-funded Broker cashout owned by the bank plan", () => {
    resetResidentPlanPortfolioMemory();
    const build = legalAction(
      "broker-build",
      "runner",
      "activated_card_ability",
      "Add hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "store_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:store_credits",
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: 3,
        },
      },
    );
    const cash = legalAction(
      "broker-cash",
      "runner",
      "activated_card_ability",
      "Take hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "withdraw_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:withdraw_credits",
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 3,
          gainCreditsAmount: 3,
        },
      },
    );
    const installTarget = legalAction(
      "install-target-program",
      "runner",
      "install_card",
      "Install target program",
      { credits: 5, clicks: 1 },
      {
        source: "target-program",
        payload: {
          cardId: "target-program",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const input = aiInput("runner", [build, cash, installTarget]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("target-program", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        title: "Blink",
      }),
      visibleCard("buffer-1", "runner", "event"),
      visibleCard("buffer-2", "runner", "event"),
      visibleCard("buffer-3", "runner", "event"),
      visibleCard("buffer-4", "runner", "event"),
    ];
    input.playerView.own.rig = [
      visibleCard("broker-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          searchAccess: { tools: [] },
          economyBankTools: [
            {
              cardId: "onr_v1_154_broker",
              title: "Broker",
              ownerSide: "runner",
              status: "installed",
              currentBankAmount: 3,
              estimatedPayout: 3,
              buildActionLegal: true,
              cashOutActionLegal: true,
              buildActionIds: ["broker-build"],
              cashOutActionIds: ["broker-cash"],
              confidence: "high",
              evidence: ["test_broker_installed"],
            },
          ],
        },
      }),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "target-program",
          definitionId: "onr_v1_007_blink",
          legalActionId: "install-target-program",
          priority: 800,
          deferReason: "missing_credits",
          availability: "missing_credits",
          missingCredits: 3,
          installCost: 5,
          currentNeed: "useful_now",
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "strong",
        }),
        handEvaluation({
          cardInstanceId: "target-program",
          definitionId: "onr_v1_007_blink",
          legalActionId: installTarget.actionId,
          priority: 0,
          deferReason: "stronger_override",
          currentNeed: "none",
          developmentRole: "unknown",
          strategicFit: "blocked",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "broker-cash",
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.credit_bank",
        planId: expect.stringContaining("runner.credit_bank"),
        planFirstDecision: {
          schemaVersion: "ai-plan-first-decision-debug-v1",
          selectionAuthority: "turn_plan_commitment",
          rootPlanInstanceId: expect.stringContaining("runner.credit_bank"),
          leafExecutorInstanceId: expect.stringContaining("runner.credit_bank"),
          selectedPlan: {
            moduleId: "runner.credit_bank",
            executionState: "executor",
          },
          route: {
            actionId: "broker-cash",
            stepId: expect.any(String),
          },
          strategicContext: {
            authority: "diagnostic_only",
          },
        },
        detailSections: expect.arrayContaining([
          expect.objectContaining({
            id: "plan_execution",
            items: expect.arrayContaining(["capability:credit_bank_cash_out"]),
          }),
        ]),
      },
    });
  });

  it("does not delegate Broker cashout to a development target without an exact materializable route", () => {
    resetResidentPlanPortfolioMemory();
    const cash = legalAction(
      "broker-cash",
      "runner",
      "activated_card_ability",
      "Take hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "withdraw_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:withdraw_credits",
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 3,
          hostedCreditTakeMode: "all",
          gainCreditsAmount: 3,
        },
      },
    );
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [cash, credit, endTurn]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 3;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("social-engineering", "runner", "event", {
        definitionId: "onr_v1_111_social-engineering",
        title: "Social Engineering",
      }),
      visibleCard("buffer-1", "runner", "event"),
      visibleCard("buffer-2", "runner", "event"),
      visibleCard("buffer-3", "runner", "event"),
      visibleCard("buffer-4", "runner", "event"),
    ];
    input.playerView.own.rig = [
      visibleCard("broker-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          searchAccess: { tools: [] },
          economyBankTools: [
            {
              cardId: "onr_v1_154_broker",
              title: "Broker",
              ownerSide: "runner",
              status: "installed",
              currentBankAmount: 3,
              estimatedPayout: 3,
              buildActionLegal: false,
              cashOutActionLegal: true,
              buildActionIds: [],
              cashOutActionIds: [cash.actionId],
              confidence: "high",
              evidence: ["test_broker_installed"],
            },
          ],
        },
      }),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "social-engineering",
          definitionId: "onr_v1_111_social-engineering",
          legalActionId: "play-social-engineering",
          priority: 800,
          deferReason: "missing_credits",
          availability: "missing_credits",
          missingCredits: 2,
          installCost: 2,
          currentNeed: "useful_now",
          developmentRole: "run_event",
          strategicFit: "strong",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "runner_credit_bank_cashout_delegation_missing_exact_route:social-engineering",
    );
  });

  it("uses a mature Broker cashout as click-efficient liquidity", () => {
    resetResidentPlanPortfolioMemory();
    const build = legalAction(
      "broker-build",
      "runner",
      "activated_card_ability",
      "Add hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "store_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:store_credits",
          cardImplementationAddsHostedCredits: true,
          hostedCreditAddAmount: 3,
        },
      },
    );
    const cash = legalAction(
      "broker-cash",
      "runner",
      "activated_card_ability",
      "Take hosted credits",
      { credits: 0, clicks: 1 },
      {
        source: "broker-card",
        payload: {
          cardId: "broker-card",
          sourceDefinitionId: "onr_v1_154_broker",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "withdraw_credits",
          cardImplementationAbilityId: "onr_v1_154_broker:withdraw_credits",
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 3,
          hostedCreditTakeMode: "all",
          gainCreditsAmount: 3,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [build, cash, credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("target-program", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        title: "Blink",
      }),
      visibleCard("buffer-1", "runner", "event"),
      visibleCard("buffer-2", "runner", "event"),
      visibleCard("buffer-3", "runner", "event"),
      visibleCard("buffer-4", "runner", "event"),
    ];
    input.playerView.own.rig = [
      visibleCard("broker-card", "runner", "resource", {
        definitionId: "onr_v1_154_broker",
        title: "Broker",
      }),
    ];

    const decision = liveContext({
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas",
        setupEngine: ["runner.rig_first"],
      }),
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          breakerCoverageMatrix: {
            wall: {
              coverage: "wall",
              inDeckKnown: true,
              inHand: true,
              installed: false,
              searchableNow: false,
              drawOnly: false,
              missing: false,
              bestKnownCards: ["onr_v1_007_blink"],
              blockers: ["needs_install"],
            },
          },
          searchAccess: { tools: [] },
          economyBankTools: [
            {
              cardId: "onr_v1_154_broker",
              title: "Broker",
              ownerSide: "runner",
              status: "installed",
              currentBankAmount: 3,
              estimatedPayout: 3,
              buildActionLegal: true,
              cashOutActionLegal: true,
              buildActionIds: [build.actionId],
              cashOutActionIds: [cash.actionId],
              confidence: "high",
              evidence: ["test_broker_installed"],
            },
          ],
        },
      }),
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "target-program",
          definitionId: "onr_v1_007_blink",
          legalActionId: "install-target-program",
          priority: 780,
          deferReason: "missing_credits",
          availability: "missing_credits",
          missingCredits: 5,
          installCost: 5,
          currentNeed: "acute",
          developmentRole: "breaker_or_rig_piece",
          strategicFit: "blocked",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 6,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: cash.actionId,
      reasonCode: "plan_first.runner.credit_bank",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:credit_bank_cash_out",
    );
  });

  it("does not admit a one-credit step as same-turn coverage funding when the install target remains unreachable", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [credit, run]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("snowball", "runner", "program", {
        definitionId: "onr_v1_066_snowball",
        title: "Snowball",
        subtypes: ["icebreaker", "killer"],
        installCost: 10,
      }),
    ];
    const blockedTarget = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: false,
      score: 200,
      evidence: ["missing_coverage:breaker_sentry"],
    };

    const decision = liveContext({
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas",
        setupEngine: ["runner.rig_first"],
      }),
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          breakerCoverageMatrix: {
            sentry: {
              coverage: "sentry",
              inDeckKnown: true,
              inHand: true,
              installed: false,
              searchableNow: false,
              drawOnly: false,
              missing: false,
              bestKnownCards: ["onr_v1_066_snowball"],
              blockers: ["needs_install"],
            },
          },
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [blockedTarget],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 6,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.reasonCode).not.toBe("plan_first.runner.rig_and_coverage");
  });

  it("rejects every install variant when hand development has a nonpositive stronger override", () => {
    resetResidentPlanPortfolioMemory();
    const blinkId = "blink-card";
    const direct = legalAction(
      "install-blink",
      "runner",
      "install_card",
      "Install Blink",
      { credits: 0, clicks: 1 },
      { source: blinkId, payload: { cardId: blinkId } },
    );
    const replace = legalAction(
      "install-blink.runner_program_trash_before_install",
      "runner",
      "install_card",
      "Trash a program and install Blink",
      { credits: 0, clicks: 1 },
      {
        source: blinkId,
        payload: {
          cardId: blinkId,
          runnerProgramTrashBeforeInstall: true,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [direct, replace, credit]);
    input.playerView.own.gripOrHq = [
      visibleCard(blinkId, "runner", "program", {
        definitionId: "onr_v1_007_blink",
        title: "Blink",
      }),
    ];

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: blinkId,
            definitionId: "onr_v1_007_blink",
            legalActionId: direct.actionId,
            priority: 0,
            deferReason: "stronger_override",
            duplicateRole: "useful_backup",
            finalInstallFit: -100,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("uses the exact finite Corp liquidity plan instead of EndTurn", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [credit, end]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 4;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      decisionDebug: { planKind: "corp.economy" },
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(input) ?? {}),
    ).toContain('"kind":"develop_liquidity"');
  });

  it("keeps an exact Corp start rez pass choice owned by corp.economy", () => {
    resetResidentPlanPortfolioMemory();
    const choiceId = "corp_start_rez_1";
    const holovid = visibleCard("holovid", "corp", "asset", {
      definitionId: "onr_v1_326_holovid-campaign",
      title: "Holovid Campaign",
      rezzed: false,
      rezCost: 4,
    });
    const action = legalAction(
      "corp.resolve_choice",
      "corp",
      "resolve_choice",
      "Asset rezzen?",
      { credits: 0, clicks: 0 },
      { source: "game_rule", visibility: "private_to_actor" },
    );
    const options = [
      {
        id: "rez_holovid",
        label: "Holovid Campaign für 4 Credits rezzen",
        value: holovid.instanceId,
        metadata: { creditCost: 4 },
        card: holovid,
      },
      { id: "pass", label: "Nicht rezzen", value: "pass" },
    ];
    const input = aiInput("corp", [action]);
    action.timingPoint = "corp_draw.mandatory_draw";
    action.choiceRequirements = [
      {
        choiceId,
        minSelections: 1,
        maxSelections: 1,
        optionIds: options.map((option) => option.id),
      },
    ];
    input.playerView.timingPoint = "corp_draw.mandatory_draw";
    input.playerView.own.credits = 19;
    input.playerView.servers = [server("remote_1", [], [holovid])];
    input.playerView.pendingChoice = {
      choiceId,
      side: "corp",
      source: "corp_start.rez:1",
      prompt: "Asset rezzen?",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: input.playerView.stateVersion,
      visibility: "private_to_side",
    };
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    const decision = liveContext({
      selectedChoicesForDecision: (
        decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
        selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
        portfolio: Parameters<typeof selectedChoicesForDecision>[3],
      ) =>
        selectedChoicesForDecision(
          decisionInput,
          selectedAction,
          {
            evaluateCorpOpeningHand: () => ({ decision: "keep" }),
            evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
            discardKeepScore: () => ({ total: 0 }),
            selectedRunnerProgramInstallTrashOptionIds: () => [],
            selectedRunnerForcedProgramTrashOptionIds: () => [],
            selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
            extractAiFeatures: () => ({
              credits: 0,
              memoryRemaining: 4,
              hasInstalledNonNoisyIcebreaker: false,
              rigRoles: new Set(),
              rigDefinitionIds: new Set(),
            }),
            rolesForCardId: () => [],
            effectsForCardId: () => [],
          },
          portfolio,
        ),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: action.actionId,
      selectedChoices: {
        choiceId,
        selectedOptionIds: ["pass"],
      },
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.economy",
        planFirstDecision: {
          selectedPlan: {
            target: { id: `start-rez-choice:${choiceId}` },
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_lane:plan",
        "plan_module:corp.economy",
      ]),
    );
  });

  it("keeps a malformed Corp Basic Credit unknown and does not select EndTurn", () => {
    resetResidentPlanPortfolioMemory();
    const malformedCredit = legalAction(
      "malformed-credit",
      "corp",
      "gain_credit",
      "Malformed Gain 1 Credit",
      { credits: 0, clicks: 2 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [malformedCredit, end]);
    input.playerView.own.clicks = 2;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      expect.objectContaining({
        code: "missing_plan_module_coverage",
        context: expect.objectContaining({
          unresolvedActionIds: [malformedCredit.actionId],
        }),
      }),
    );
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(input) ?? {}),
    ).not.toContain('"kind":"develop_liquidity"');
  });

  it("keeps nonstrategic residual liquidity finite without reopening its reached target", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      {
        source: "basic_action",
        payload: { gainCreditsAmount: 1 },
      },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [credit, end]);
    input.playerView.turnSerial = 3;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(input) ?? {}),
    ).toContain('"targetCredits":7');

    const afterExternalProgress = structuredClone(input);
    afterExternalProgress.playerView.stateVersion += 1;
    afterExternalProgress.playerView.own.clicks = 1;
    afterExternalProgress.playerView.own.credits = 7;
    for (const action of afterExternalProgress.legalActions) {
      action.expiresAtStateVersion =
        afterExternalProgress.playerView.stateVersion;
    }
    afterExternalProgress.playerView.legalActions =
      afterExternalProgress.legalActions;

    const context = liveContext();
    const extendedDecision = context.chooseSemanticRuntimeAction(
      afterExternalProgress,
      {},
    );
    expect(extendedDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
    });
    expect(
      JSON.stringify(
        residentPlanPortfolioSnapshot(afterExternalProgress) ?? {},
      ),
    ).toContain('"targetCredits":7');

    const exhausted = structuredClone(afterExternalProgress);
    exhausted.playerView.stateVersion += 1;
    exhausted.playerView.own.clicks = 0;
    exhausted.playerView.own.credits = 8;
    exhausted.legalActions = [structuredClone(end)];
    exhausted.legalActions[0]!.expiresAtStateVersion =
      exhausted.playerView.stateVersion;
    exhausted.playerView.legalActions = exhausted.legalActions;

    expect(context.chooseSemanticRuntimeAction(exhausted, {})).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.corp.complete_turn",
    });
  });

  it("resolves a two-card HQ overflow through two exact revalidated steps", () => {
    resetResidentPlanPortfolioMemory();
    const installA = pacificaOverflowInstall(
      "a-install-pacifica",
      "pacifica-a",
      "remote_1",
    );
    const installB = pacificaOverflowInstall(
      "b-install-pacifica",
      "pacifica-b",
      "remote_1",
    );
    const input = aiInput("corp", [installA, installB]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      pacificaCard("pacifica-a"),
      pacificaCard("pacifica-b"),
      ...corpOverflowFillers(5),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;
    const context = liveContext();

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installA.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installA.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    const selectedSnapshot = structuredClone(
      residentPlanPortfolioSnapshot(input),
    );
    const firstReceipt = hqOverflowReceipt(selectedSnapshot);
    expect(firstReceipt).toMatchObject({
      turnKey: "corp:0",
      initialOverflowCount: 2,
      maximumConversions: 2,
      remainingConversions: 1,
      selectedAtStateVersion: 1,
      expectedOverflowAfterSelectedConversion: 1,
    });

    const afterFirst = structuredClone(input);
    afterFirst.playerView.stateVersion = 2;
    afterFirst.playerView.own.clicks = 1;
    afterFirst.playerView.own.gripOrHq =
      afterFirst.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== "pacifica-a",
      );
    afterFirst.legalActions = [structuredClone(installB)];
    afterFirst.legalActions[0]!.expiresAtStateVersion = 2;
    afterFirst.playerView.legalActions = afterFirst.legalActions;

    expect(context.chooseSemanticRuntimeAction(afterFirst, {})).toMatchObject({
      actionId: installB.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      hqOverflowReceipt(residentPlanPortfolioSnapshot(afterFirst)),
    ).toMatchObject({
      turnKey: "corp:0",
      initialOverflowCount: 2,
      maximumConversions: 2,
      remainingConversions: 0,
      selectedAtStateVersion: 2,
      expectedOverflowAfterSelectedConversion: 0,
    });

    const malformedReceipts: Array<(receipt: Record<string, unknown>) => void> =
      [
        (receipt) => {
          receipt.initialOverflowCount = Number.NaN;
        },
        (receipt) => {
          receipt.maximumConversions = -1;
        },
        (receipt) => {
          receipt.remainingConversions = 3;
        },
        (receipt) => {
          delete receipt.selectedAtStateVersion;
        },
        (receipt) => {
          receipt.expectedOverflowAfterSelectedConversion = Number.NaN;
        },
      ];
    for (const mutate of malformedReceipts) {
      const malformed = structuredClone(selectedSnapshot)!;
      mutate(hqOverflowReceipt(malformed)!);
      resetResidentPlanPortfolioMemory();
      restoreResidentPlanPortfolioMemorySnapshot(afterFirst, malformed);
      expect(() =>
        context.chooseSemanticRuntimeAction(afterFirst, {}),
      ).toThrowError("invalid_plan_identity");
    }
  });

  it("limits HQ-overflow conversion to the exact current overflow", () => {
    resetResidentPlanPortfolioMemory();
    const install = pacificaOverflowInstall(
      "install-pacifica",
      "pacifica",
      "remote_1",
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      pacificaCard("pacifica"),
      ...corpOverflowFillers(5),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    install.expiresAtStateVersion = input.playerView.stateVersion;
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      hqOverflowReceipt(residentPlanPortfolioSnapshot(input)),
    ).toMatchObject({
      initialOverflowCount: 1,
      maximumConversions: 1,
      remainingConversions: 0,
      selectedAtStateVersion: 1,
      expectedOverflowAfterSelectedConversion: 0,
    });
  });

  it("keeps HQ-overflow installs out of a server reserved by an exact score parent", () => {
    resetResidentPlanPortfolioMemory();
    const installReserved = pacificaOverflowInstall(
      "a-install-pacifica-reserved",
      "pacifica",
      "remote_1",
    );
    const installAlternative = pacificaOverflowInstall(
      "b-install-pacifica-hq",
      "pacifica",
      "hq",
    );
    const installAgenda = legalAction(
      "install-tycho-remote-1",
      "corp",
      "install_card",
      "Install Tycho Extension in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "tycho",
        payload: {
          cardId: "tycho",
          sourceDefinitionId: "onr_v1_220_tycho-extension",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [
      installReserved,
      installAlternative,
      installAgenda,
    ]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 10;
    input.playerView.opponent.agendaPoints = 2;
    input.playerView.own.gripOrHq = [
      pacificaCard("pacifica"),
      visibleCard("tycho", "corp", "agenda", {
        definitionId: "onr_v1_220_tycho-extension",
        title: "Tycho Extension",
        advancementRequirement: 4,
        agendaPoints: 4,
      }),
      ...corpOverflowFillers(4),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-data-wall", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installAlternative.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:corp.hand_and_agenda_management:resolve-hq-overflow",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:corp.hand_and_agenda_management:resolve-hq-overflow",
          ),
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId: installReserved.actionId,
              disposition: "explicitly_nonproductive",
              ownerModuleId: "corp.hand_and_agenda_management",
              evidenceCode:
                "corp_hq_overflow_install_rejected_reserved_score_server:remote_1",
            }),
          ]),
        },
      },
    });
    const overflow = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) =>
        instance.moduleId === "corp.hand_and_agenda_management" &&
        instance.dedupeKey === "resolve-hq-overflow:corp:0",
    );
    expect(JSON.stringify(overflow)).toContain(installAlternative.actionId);
    expect(JSON.stringify(overflow)).not.toContain(installReserved.actionId);
  });

  it("reactivates overflow for a support draw but never for unbound action capacity", () => {
    resetResidentPlanPortfolioMemory();
    const installPacifica = pacificaOverflowInstall(
      "install-pacifica",
      "pacifica",
      "remote_1",
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const playOvertime = legalAction(
      "play-overtime",
      "corp",
      "play_operation",
      "Play Overtime Incentives",
      { credits: 4, clicks: 1 },
      {
        source: "overtime",
        visibility: "private_to_actor",
        payload: {
          cardId: "overtime",
          sourceDefinitionId: "onr_v1_297_overtime-incentives",
          gainActionsAmount: 2,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
          actionCapacityExpiresAt: "side_turn_end",
          scoreConversionCapability: "gain_action_capacity",
          scoreConversionTiming: "immediate",
        },
      },
    );
    const input = aiInput("corp", [installPacifica, draw, credit, end]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 10;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      pacificaCard("pacifica"),
      ...corpOverflowFillers(5),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;
    const context = liveContext();

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installPacifica.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      hqOverflowReceipt(residentPlanPortfolioSnapshot(input)),
    ).toMatchObject({
      initialOverflowCount: 1,
      maximumConversions: 1,
      remainingConversions: 0,
      selectedAtStateVersion: 1,
      expectedOverflowAfterSelectedConversion: 0,
    });

    const supportDraw = structuredClone(input);
    supportDraw.playerView.stateVersion = 2;
    supportDraw.playerView.own.clicks = 2;
    supportDraw.playerView.own.gripOrHq =
      supportDraw.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== "pacifica",
      );
    Object.assign(supportDraw, {
      ownDeckSnapshot: {
        deckSnapshotId: "hq-overflow-reactivation-deck",
        side: "corp",
        cards: [{ cardId: "onr_v1_220_tycho-extension", quantity: 3 }],
      },
    });
    supportDraw.legalActions = [
      structuredClone(draw),
      structuredClone(credit),
      structuredClone(end),
    ];
    for (const action of supportDraw.legalActions) {
      action.expiresAtStateVersion = supportDraw.playerView.stateVersion;
    }
    supportDraw.playerView.legalActions = supportDraw.legalActions;

    expect(context.chooseSemanticRuntimeAction(supportDraw, {})).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      hqOverflowReceipt(residentPlanPortfolioSnapshot(supportDraw)),
    ).toMatchObject({
      remainingConversions: 0,
      selectedAtStateVersion: 1,
      expectedOverflowAfterSelectedConversion: 0,
    });

    const afterSupportDraw = structuredClone(supportDraw);
    afterSupportDraw.playerView.stateVersion = 3;
    afterSupportDraw.playerView.own.clicks = 1;
    afterSupportDraw.playerView.own.gripOrHq.push(
      visibleCard("overtime", "corp", "operation", {
        definitionId: "onr_v1_297_overtime-incentives",
        title: "Overtime Incentives",
        cost: 4,
      }),
    );
    afterSupportDraw.legalActions = [
      structuredClone(playOvertime),
      structuredClone(credit),
      structuredClone(draw),
      structuredClone(end),
    ];
    for (const action of afterSupportDraw.legalActions) {
      action.expiresAtStateVersion = afterSupportDraw.playerView.stateVersion;
    }
    afterSupportDraw.playerView.legalActions = afterSupportDraw.legalActions;
    expect(
      buildActionSemanticCandidates(afterSupportDraw).find(
        (candidate) => candidate.actionId === playOvertime.actionId,
      ),
    ).toMatchObject({
      sourceCardInstanceId: "overtime",
      sourceDefinitionId: "onr_v1_297_overtime-incentives",
      economyProjection: {
        cardsConsumed: 1,
        netHandDelta: -1,
      },
    });

    expect(
      context.chooseSemanticRuntimeAction(afterSupportDraw, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      context.chooseSemanticRuntimeAction(afterSupportDraw, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      hqOverflowReceipt(residentPlanPortfolioSnapshot(afterSupportDraw)),
    ).toMatchObject({
      initialOverflowCount: 1,
      maximumConversions: 1,
      remainingConversions: 0,
      selectedAtStateVersion: 1,
      expectedOverflowAfterSelectedConversion: 0,
    });

    const noNewOverflow = structuredClone(afterSupportDraw);
    noNewOverflow.playerView.stateVersion = 4;
    noNewOverflow.playerView.own.gripOrHq =
      noNewOverflow.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== "overtime",
      );
    noNewOverflow.legalActions = [
      structuredClone(credit),
      structuredClone(draw),
      structuredClone(end),
    ];
    for (const action of noNewOverflow.legalActions) {
      action.expiresAtStateVersion = noNewOverflow.playerView.stateVersion;
    }
    noNewOverflow.playerView.legalActions = noNewOverflow.legalActions;
    expect(
      context.chooseSemanticRuntimeAction(noNewOverflow, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("keeps agendas, ICE, score conversions, new remotes and reserved score servers out of the HQ-overflow parent", () => {
    resetResidentPlanPortfolioMemory();
    const installExisting = pacificaOverflowInstall(
      "install-pacifica-existing",
      "pacifica",
      "remote_1",
    );
    const installNew = pacificaOverflowInstall(
      "install-pacifica-new",
      "pacifica",
      "new_remote",
    );
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install Executive Extraction",
      { credits: 0, clicks: 1 },
      {
        source: "agenda",
        payload: {
          cardId: "agenda",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const teamRestructuring = legalAction(
      "play-team-restructuring",
      "corp",
      "play_operation",
      "Play Team Restructuring",
      { credits: 2, clicks: 1 },
      {
        source: "team-restructuring",
        payload: {
          cardId: "team-restructuring",
          sourceDefinitionId: "onr_v1_305_team-restructuring",
          scoreConversionCapability: "place_advancement",
          scoreConversionTiming: "immediate",
          advancementCounterAmount: 1,
        },
      },
    );
    const installIceArchives = legalAction(
      "install-data-wall-archives",
      "corp",
      "install_card",
      "Install Data Wall in Archives",
      { credits: 1, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          serverId: "archives",
          placement: "ice",
        },
      },
    );
    const installIceRemote = legalAction(
      "install-data-wall-remote-1",
      "corp",
      "install_card",
      "Install Data Wall on Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 0,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 0,
          postInstallRezQuoteCardId: "data-wall",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [
      installExisting,
      installNew,
      installAgenda,
      teamRestructuring,
      installIceArchives,
      installIceRemote,
    ]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      pacificaCard("pacifica"),
      visibleCard("team-restructuring", "corp", "operation", {
        definitionId: "onr_v1_305_team-restructuring",
        title: "Team Restructuring",
      }),
      visibleCard("data-wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
      visibleCard("agenda", "corp", "agenda", {
        definitionId: "onr_v1_201_executive-extraction",
        title: "Executive Extraction",
      }),
      ...corpOverflowFillers(3),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    const overflow = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) =>
        instance.moduleId === "corp.hand_and_agenda_management" &&
        instance.dedupeKey === "resolve-hq-overflow:corp:0",
    );
    expect(overflow).toBeUndefined();
    expect(decision).toMatchObject({
      actionId: installIceRemote.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId: installExisting.actionId,
              disposition: "explicitly_nonproductive",
              ownerModuleId: "corp.hand_and_agenda_management",
              evidenceCode:
                "corp_hq_overflow_install_rejected_reserved_score_server:remote_1",
            }),
          ]),
        },
      },
    });
    const defense = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "corp.defend_servers",
    );
    expect(JSON.stringify(defense)).toContain(installIceRemote.actionId);
    expect(JSON.stringify(defense)).not.toContain(installIceArchives.actionId);
  });

  it("delegates an HQ-overflow ICE to global defense for server allocation", () => {
    resetResidentPlanPortfolioMemory();
    const installArchives = legalAction(
      "install-data-wall-archives",
      "corp",
      "install_card",
      "Install Data Wall in Archives",
      { credits: 0, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "archives",
          placement: "ice",
        },
      },
    );
    const installRemote = legalAction(
      "install-data-wall-remote-1",
      "corp",
      "install_card",
      "Install Data Wall on Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 0,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 0,
          postInstallRezQuoteCardId: "data-wall",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [installArchives, installRemote]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("data-wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
      ...corpOverflowFillers(5),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installRemote.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("converts a full agenda hand into meaningful central defense instead of drawing into discard", () => {
    resetResidentPlanPortfolioMemory();
    const stateVersion = 1;
    const installHqIce = legalAction(
      "install-data-wall-hq",
      "corp",
      "install_card",
      "Install Data Wall on HQ",
      { credits: 1, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "hq",
          placement: "ice",
          iceInstallBaseCost: 1,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 1,
          postInstallRezQuoteCardId: "data-wall",
          postInstallRezQuoteTargetServerId: "hq",
          postInstallRezQuoteProjectedServerId: "hq",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const draw = legalAction(
      "draw",
      "corp",
      "draw_card",
      "Draw a card",
      { credits: 0, clicks: 1 },
      { source: "basic_action" },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [draw, credit, installHqIce]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda", "corp", "agenda", {
        definitionId: "onr_v1_201_executive-extraction",
        title: "Executive Extraction",
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
      visibleCard("data-wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
      ...corpOverflowFillers(3),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-data-wall", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
      server("rd", [
        visibleCard("rd-data-wall", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
      server("archives"),
    ];
    input.playerView.opponent.rig = [];
    input.playerView.corpCentralAccessQuotes = ["hq", "rd"].map((serverId) => ({
      serverId: serverId as "hq" | "rd",
      stateVersion,
      complete: true as const,
      effectiveAccessCount: 1,
      isMultiaccess: false,
      sourceDefinitionIds: [],
      serverBoundEffects: [],
    }));
    input.playerView.specialZones = {
      setAside: [],
      removedFromGame: [],
      setAsideCount: 0,
      removedFromGameCount: 0,
    };
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "agenda-capacity-defense-conversion",
      side: "corp",
      cards: [
        { cardId: "onr_v1_201_executive-extraction", quantity: 1 },
        { cardId: "onr_v1_237_data-wall", quantity: 3 },
        { cardId: "onr_v1_284_chance-observation", quantity: 23 },
      ],
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installHqIce.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      `plan_assessment_evidence:corp_agenda_capacity_defense_conversion:hq:${installHqIce.actionId}`,
    );
  });

  it("does not claim a blocked Corp upgrade placement as an executable hand-plan route", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-rio-hq",
      "corp",
      "install_card",
      "Install Rio de Janeiro City Grid in HQ",
      { credits: 0, clicks: 1 },
      {
        source: "rio-card",
        payload: {
          cardId: "rio-card",
          serverId: "hq",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 10 } },
    );
    const input = aiInput("corp", [install, credit]);
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("rio-card", "corp", "upgrade", {
        definitionId: "onr_v1_367_rio-de-janeiro-city-grid",
        title: "Rio de Janeiro City Grid",
      }),
    ];
    input.playerView.servers = [server("hq")];

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("does not let a generic economy hint self-justify an unbound score-support rez", () => {
    resetResidentPlanPortfolioMemory();
    const rez = legalAction(
      "rez-vapor",
      "corp",
      "rez_card",
      "Rez Vapor Ops",
      { credits: 0, clicks: 0 },
      {
        source: "vapor-card",
        payload: { cardId: "vapor-card", serverId: "remote_1" },
      },
    );
    const input = aiInput("corp", [rez]);
    input.playerView.own.credits = 10;
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("vapor-card", "corp", "asset", {
            definitionId: "onr_v1_347_vapor-ops",
            title: "Vapor Ops",
            rezzed: false,
          }),
        ],
      ),
    ];

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("keeps a hint-only rez out of an open reserve funding route", () => {
    resetResidentPlanPortfolioMemory();
    const rez = legalAction(
      "rez-vapor",
      "corp",
      "rez_card",
      "Rez Vapor Ops",
      { credits: 0, clicks: 0 },
      {
        source: "vapor-card",
        payload: { cardId: "vapor-card", serverId: "remote_1" },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      {
        source: "basic_action",
        payload: { gainCreditsAmount: 1 },
      },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [rez, credit]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 4;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("vapor-card", "corp", "asset", {
            definitionId: "onr_v1_347_vapor-ops",
            title: "Vapor Ops",
            rezzed: false,
          }),
        ],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("fails closed for an unassessed finite economy campaign from visible card state", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-bbs",
      "corp",
      "install_card",
      "Install BBS Whispering Campaign in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "bbs-card",
        payload: {
          cardId: "bbs-card",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("bbs-card", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
        title: "BBS Whispering Campaign",
      }),
    ];
    input.playerView.servers = [server("remote_1")];
    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      "missing_plan_module_coverage",
    );
  });

  it("blocks a Vapor Ops install that has no admitted economy campaign", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-vapor",
      "corp",
      "install_card",
      "Install Vapor Ops in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "vapor-card",
        payload: {
          cardId: "vapor-card",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [install, credit]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 4;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.gripOrHq = [
      visibleCard("vapor-card", "corp", "asset", {
        definitionId: "onr_v1_347_vapor-ops",
        title: "Vapor Ops",
      }),
    ];
    input.playerView.servers = [server("remote_1")];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("installs a quoted Vapor Ops counter bank from HQ overflow into a secure existing remote through the score plan", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-vapor-secure-remote",
      "corp",
      "install_card",
      "Install Vapor Ops in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "vapor-card",
        payload: {
          cardId: "vapor-card",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const dataWall = CARD_DEFINITIONS_BY_ID["onr_v1_238_data-wall-2-0"];
    if (!dataWall || dataWall.type !== "ice") {
      throw new Error("Missing Data Wall test definition.");
    }
    const dataWallStrength = dataWall.strength ?? 0;
    const input = aiInput("corp", [install, credit]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 4;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.gripOrHq = [
      visibleCard("vapor-card", "corp", "asset", {
        definitionId: "onr_v1_347_vapor-ops",
        title: "Vapor Ops",
        counterBankPreparationQuote: {
          schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
          context: "corp_counter_bank_preparation",
          sourceCardId: "vapor-card",
          expiresAtStateVersion: input.playerView.stateVersion,
          location: { kind: "corp_hq" },
          advancementCounters: 0,
          advanceableBeforeRez: true,
          activatedAbilitiesRequireRez: true,
          cashout: {
            advancementCounterCost: 1,
            creditGain: 1,
            actionCost: 0,
          },
          transfer: {
            actionCost: 1,
            minimumSourceCounters: 1,
            source: "source_card",
            target: "chosen_installed_advanceable_card",
            maximum: "all",
          },
        },
      }),
      ...corpOverflowFillers(5),
    ];
    input.playerView.servers = [
      server("remote_1", [
        visibleCard("data-wall", "corp", "ice", {
          definitionId: dataWall.id,
          title: dataWall.title,
          subtypes: dataWall.subtypes,
          strength: dataWallStrength,
          rezzed: true,
          effectiveRunQuote: {
            iceInstanceId: "data-wall",
            iceDefinitionId: dataWall.id,
            effectiveStrength: dataWallStrength,
            subroutines: dataWall.subroutines ?? [],
          },
        }),
      ]),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "vapor-ops-score-bank-runtime-test",
      side: "corp",
      cards: [{ cardId: "simple_agenda", quantity: 3 }],
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
  });

  it("preserves a reserved counter bank by choosing the cross-remote same-turn conversion", () => {
    resetResidentPlanPortfolioMemory();
    const advance = legalAction(
      "advance-vapor",
      "corp",
      "advance_card",
      "Advance Vapor Ops",
      { credits: 1, clicks: 1 },
      {
        source: "vapor-card",
        payload: { cardId: "vapor-card" },
      },
    );
    const transfer = legalAction(
      "transfer-vapor",
      "corp",
      "activated_card_ability",
      "Move advancement counters from Vapor Ops",
      { credits: 0, clicks: 1 },
      {
        source: "vapor-card",
        payload: {
          cardId: "vapor-card",
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        },
      },
    );
    const installCrossRemote = legalAction(
      "install-zurich-new-remote",
      "corp",
      "install_card",
      "Install Project Zurich in a new remote",
      { credits: 0, clicks: 1 },
      {
        source: "zurich-card",
        payload: {
          cardId: "zurich-card",
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const installReplacingBank = legalAction(
      "replace-vapor-with-zurich",
      "corp",
      "install_card",
      "Install Project Zurich in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "zurich-card",
        payload: {
          cardId: "zurich-card",
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
          replacedRootCardType: "asset",
        },
      },
    );
    const dataWall = CARD_DEFINITIONS_BY_ID["onr_v1_238_data-wall-2-0"];
    if (!dataWall || dataWall.type !== "ice") {
      throw new Error("Missing Data Wall test definition.");
    }
    const dataWallStrength = dataWall.strength ?? 0;
    const input = aiInput("corp", [
      advance,
      transfer,
      installCrossRemote,
      installReplacingBank,
    ]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 9;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.gripOrHq = [
      visibleCard("zurich-card", "corp", "agenda", {
        definitionId: "onr_proteus_008_project-zurich",
        title: "Project Zurich",
        agendaPoints: 2,
        advancementRequirement: 3,
      }),
    ];
    input.playerView.servers = [
      server(
        "remote_1",
        [
          visibleCard("data-wall", "corp", "ice", {
            definitionId: dataWall.id,
            title: dataWall.title,
            subtypes: dataWall.subtypes,
            strength: dataWallStrength,
            rezzed: true,
            effectiveRunQuote: {
              iceInstanceId: "data-wall",
              iceDefinitionId: dataWall.id,
              effectiveStrength: dataWallStrength,
              subroutines: dataWall.subroutines ?? [],
            },
          }),
        ],
        [
          visibleCard("vapor-card", "corp", "asset", {
            definitionId: "onr_v1_347_vapor-ops",
            title: "Vapor Ops",
            rezzed: true,
            advancementCounters: 2,
            counterBankPreparationQuote: {
              schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
              context: "corp_counter_bank_preparation",
              sourceCardId: "vapor-card",
              expiresAtStateVersion: input.playerView.stateVersion,
              location: { kind: "installed_root", serverId: "remote_1" },
              advancementCounters: 2,
              advanceableBeforeRez: true,
              activatedAbilitiesRequireRez: true,
              cashout: {
                advancementCounterCost: 1,
                creditGain: 1,
                actionCost: 0,
              },
              transfer: {
                actionCost: 1,
                minimumSourceCounters: 1,
                source: "source_card",
                target: "chosen_installed_advanceable_card",
                maximum: "all",
              },
            },
          }),
        ],
      ),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "counter-bank-replacement-runtime-test",
      side: "corp",
      cards: [{ cardId: "onr_proteus_008_project-zurich", quantity: 2 }],
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installCrossRemote.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
  });

  it("routes an exact Night Shift conversion through Corp economy instead of generic development", () => {
    const nightShift = legalAction(
      "night-shift",
      "corp",
      "play_operation",
      "Play Night Shift",
      { credits: 0, clicks: 1 },
      {
        source: "night-shift-card",
        payload: {
          cardId: "night-shift-card",
          gainCreditsAmount: 2,
          drawCardsAmount: 1,
        },
      },
    );
    const bbsPayout = legalAction(
      "bbs-payout",
      "corp",
      "activated_card_ability",
      "Take 2 credits from BBS Whispering Campaign",
      { credits: 0, clicks: 1 },
      {
        source: "bbs-card",
        payload: {
          cardId: "bbs-card",
          gainCreditsAmount: 2,
        },
      },
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );

    resetResidentPlanPortfolioMemory();
    const fullHand = aiInput("corp", [nightShift, bbsPayout, draw]);
    fullHand.playerView.own.credits = 10;
    fullHand.playerView.own.stackOrRdCount = 12;
    fullHand.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(
        index === 0 ? "night-shift-card" : `full-hand-${index}`,
        "corp",
        "operation",
        {
          definitionId:
            index === 0
              ? "onr_v1_295_night-shift"
              : "onr_v1_284_chance-observation",
        },
      ),
    );
    fullHand.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("bbs-card", "corp", "asset", {
            definitionId: "onr_v1_309_bbs-whispering-campaign",
            title: "BBS Whispering Campaign",
            rezzed: true,
            counters: { bit: 14 },
          }),
        ],
      ),
    ];
    expect(
      buildActionSemanticCandidates(fullHand).find(
        (candidate) => candidate.actionId === "night-shift",
      ),
    ).toMatchObject({
      semanticActionType: "economy.gain_credit",
      economyProjection: {
        cardsDrawn: 1,
        cardsConsumed: 1,
        netHandDelta: 0,
        netLiquidCreditGain: 2,
      },
    });
    expect(
      liveContext().chooseSemanticRuntimeAction(fullHand, {}),
    ).toMatchObject({
      actionId: "night-shift",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    const overflow = aiInput("corp", [
      nightShift,
      bbsPayout,
      credit,
      draw,
      end,
    ]);
    overflow.playerView.own.clicks = 2;
    overflow.playerView.own.credits = 11;
    overflow.playerView.own.stackOrRdCount = 12;
    overflow.playerView.own.gripOrHq = Array.from({ length: 6 }, (_, index) =>
      visibleCard(
        index === 0 ? "night-shift-card" : `overflow-card-${index}`,
        "corp",
        "operation",
        {
          definitionId:
            index === 0
              ? "onr_v1_295_night-shift"
              : "onr_v1_284_chance-observation",
        },
      ),
    );
    overflow.playerView.servers = fullHand.playerView.servers;
    expect(
      liveContext().chooseSemanticRuntimeAction(overflow, {}),
    ).toMatchObject({
      actionId: "night-shift",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    const drawBound = aiInput("corp", [nightShift, draw]);
    drawBound.playerView.own.credits = 10;
    drawBound.playerView.own.stackOrRdCount = 12;
    drawBound.playerView.own.gripOrHq = [
      visibleCard("night-shift-card", "corp", "operation", {
        definitionId: "onr_v1_295_night-shift",
      }),
    ];
    expect(
      liveContext().chooseSemanticRuntimeAction(drawBound, {}),
    ).toMatchObject({
      actionId: "night-shift",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    const shortDeckHorizon = aiInput("corp", [nightShift, credit, draw, end]);
    shortDeckHorizon.playerView.own.clicks = 3;
    shortDeckHorizon.playerView.own.credits = 1;
    shortDeckHorizon.playerView.own.stackOrRdCount = 3;
    shortDeckHorizon.playerView.own.gripOrHq = [
      visibleCard("night-shift-card", "corp", "operation", {
        definitionId: "onr_v1_295_night-shift",
      }),
    ];
    expect(
      liveContext().chooseSemanticRuntimeAction(shortDeckHorizon, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId: "night-shift",
              disposition: "explicitly_nonproductive",
              ownerModuleId: "corp.economy",
              evidenceCode:
                "corp_voluntary_draw_blocked_deckout_horizon:remaining_after:2",
            }),
          ]),
        },
      },
    });
  });

  it("prepares the one-credit Accounts Receivable threshold and revalidates exact operations", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const accountsCard = visibleCard("accounts-card", "corp", "operation", {
      definitionId: "onr_v1_281_accounts-receivable",
    });

    resetResidentPlanPortfolioMemory();
    const threshold = aiInput("corp", [credit, draw]);
    threshold.playerView.own.clicks = 2;
    threshold.playerView.own.credits = 4;
    threshold.playerView.own.stackOrRdCount = 12;
    threshold.playerView.own.gripOrHq = [accountsCard];
    expect(
      liveContext().chooseSemanticRuntimeAction(threshold, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_assessment_evidence:corp_reviewed_operation_one_credit_threshold:onr_v1_281_accounts-receivable",
      ]),
    });

    const accounts = legalAction(
      "accounts",
      "corp",
      "play_operation",
      "Play Accounts Receivable",
      { credits: 5, clicks: 1 },
      {
        source: "accounts-card",
        payload: {
          cardId: "accounts-card",
          gainCreditsAmount: 9,
        },
      },
    );
    const efficiency = legalAction(
      "efficiency",
      "corp",
      "play_operation",
      "Play Efficiency Experts",
      { credits: 0, clicks: 1 },
      {
        source: "efficiency-card",
        payload: {
          cardId: "efficiency-card",
          gainCreditsAmount: 3,
        },
      },
    );
    resetResidentPlanPortfolioMemory();
    const ready = aiInput("corp", [accounts, efficiency, credit, draw]);
    ready.playerView.own.clicks = 1;
    ready.playerView.own.credits = 5;
    ready.playerView.own.stackOrRdCount = 12;
    ready.playerView.own.gripOrHq = [
      accountsCard,
      visibleCard("efficiency-card", "corp", "operation", {
        definitionId: "onr_v1_290_efficiency-experts",
      }),
    ];
    expect(liveContext().chooseSemanticRuntimeAction(ready, {})).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    const efficiencyOnly = aiInput("corp", [efficiency, credit, draw]);
    efficiencyOnly.playerView.own.clicks = 1;
    efficiencyOnly.playerView.own.credits = 0;
    efficiencyOnly.playerView.own.stackOrRdCount = 12;
    efficiencyOnly.playerView.own.gripOrHq = [
      visibleCard("efficiency-card", "corp", "operation", {
        definitionId: "onr_v1_290_efficiency-experts",
      }),
    ];
    expect(
      liveContext().chooseSemanticRuntimeAction(efficiencyOnly, {}),
    ).toMatchObject({
      actionId: "efficiency",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("limits score-material observation to one exact basic draw per Corp turn", () => {
    resetResidentPlanPortfolioMemory();
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [draw, credit, end]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`full-hand-${index}`, "corp", "operation", {
        definitionId: "onr_v1_284_chance-observation",
      }),
    );
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "score-material-observation-deck",
        side: "corp",
        cards: [{ cardId: "onr_v1_220_tycho-extension", quantity: 3 }],
      },
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = 1;
    }
    input.playerView.legalActions = input.legalActions;
    const context = liveContext();

    const firstDecision = context.chooseSemanticRuntimeAction(input, {});
    expect(firstDecision).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
    });
    expect(firstDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:corp.score_agenda:general",
        "plan_first_executor:plan:corp.hand_and_agenda_management:draw-for-score-material",
        "plan_priority_class:P4",
        "plan_priority_delegated_from:plan:corp.score_agenda:general",
        "plan_priority_need:score-material:general",
        "plan_assessment_evidence:corp_score_campaign_missing_agenda_material",
      ]),
    );
    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
    });
    const residentPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(input),
    );
    expect(residentPortfolio).toContain(
      '"drawAttemptState":{"turnKey":"corp:0","remainingAttempts":0,"selectedAtStateVersion":1}',
    );
    expect(residentPortfolio).toContain(
      '"rootForegroundInstanceId":"plan:corp.score_agenda:general"',
    );
    expect(residentPortfolio).toContain(
      '"executorInstanceId":"plan:corp.hand_and_agenda_management:draw-for-score-material"',
    );
    expect(residentPortfolio).toContain(
      '"parentInstanceId":"plan:corp.score_agenda:general"',
    );
    expect(residentPortfolio).toContain(
      '"parentNeedId":"score-material:general"',
    );
    expect(residentPortfolio).toContain(
      '"openNeedIds":["score-material:general"]',
    );
    expect(residentPortfolio).toContain('"phase":"select_agenda"');
    expect(residentPortfolio).toContain(
      '"persistencePolicy":"flexible_support"',
    );

    const afterDraw = structuredClone(input);
    afterDraw.playerView.stateVersion = 2;
    afterDraw.playerView.own.clicks = 1;
    afterDraw.playerView.own.gripOrHq.push(
      visibleCard("observed-non-agenda", "corp", "operation", {
        definitionId: "onr_v1_284_chance-observation",
      }),
    );
    for (const action of afterDraw.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    afterDraw.playerView.legalActions = afterDraw.legalActions;
    expect(context.chooseSemanticRuntimeAction(afterDraw, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const nextTurn = structuredClone(input);
    nextTurn.playerView.stateVersion = 3;
    nextTurn.playerView.turnSerial = 1;
    for (const action of nextTurn.legalActions) {
      action.expiresAtStateVersion = 3;
    }
    nextTurn.playerView.legalActions = nextTurn.legalActions;
    expect(context.chooseSemanticRuntimeAction(nextTurn, {})).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
    });
  });

  it("uses the finite transitional Corp liquidity plan only for exact Basic Credit", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );

    resetResidentPlanPortfolioMemory();
    const belowCap = aiInput("corp", [credit, end]);
    belowCap.playerView.own.clicks = 3;
    belowCap.playerView.own.credits = 5;
    for (const action of belowCap.legalActions) {
      action.expiresAtStateVersion = belowCap.playerView.stateVersion;
    }
    belowCap.playerView.legalActions = belowCap.legalActions;
    expect(
      liveContext().chooseSemanticRuntimeAction(belowCap, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(belowCap) ?? {}),
    ).toContain('"kind":"develop_liquidity"');

    const laterTurn = structuredClone(belowCap);
    laterTurn.playerView.stateVersion = 2;
    laterTurn.playerView.turnSerial = 1;
    laterTurn.playerView.own.credits = 8;
    for (const action of laterTurn.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    laterTurn.playerView.legalActions = laterTurn.legalActions;
    expect(
      liveContext().chooseSemanticRuntimeAction(laterTurn, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(laterTurn) ?? {}),
    ).toContain('"kind":"develop_liquidity"');
  });

  it("does not synthesize a defense-funding child for legacy central rez reserve", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [credit, end]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda", "corp", "agenda", {
        definitionId: "onr_v1_189_artificial-security-directors",
      }),
      ...Array.from({ length: 5 }, (_, index) =>
        visibleCard(`operation-${index}`, "corp", "operation", {
          definitionId: "onr_v1_284_chance-observation",
        }),
      ),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("cinderella", "corp", "ice", {
          definitionId: "onr_v1_228_cinderella",
          rezzed: false,
          rezCost: 8,
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "cinderella",
            targetServerId: "hq",
            projectedServerId: "hq",
            expiresAtStateVersion: 1,
            complete: true,
            costKind: "fixed",
            baseCredits: 8,
            finalCredits: 8,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
      server("rd"),
      server("archives"),
    ];

    resetResidentPlanPortfolioMemory();
    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(input) ?? {}),
    ).not.toContain("corp_defense_reserve_funding_required:hq");
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(input) ?? {}),
    ).not.toContain('"kind":"parent_funding"');

    resetResidentPlanPortfolioMemory();
    const reachableFunding = structuredClone(input);
    reachableFunding.playerView.own.credits = 7;
    expect(
      liveContext().chooseSemanticRuntimeAction(reachableFunding, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(reachableFunding) ?? {}),
    ).not.toContain("corp_defense_reserve_funding_required:hq");
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(reachableFunding) ?? {}),
    ).not.toContain('"kind":"parent_funding"');
  });

  it("reinforces an existing score remote with a different meaningful ICE instead of opening a sibling remote", () => {
    resetResidentPlanPortfolioMemory();
    const stateVersion = 23;
    const agenda = visibleCard("tycho", "corp", "agenda", {
      definitionId: "onr_v1_220_tycho-extension",
      title: "Tycho Extension",
      advancementRequirement: 4,
      agendaPoints: 4,
    });
    const cinderella = visibleCard("cinderella", "corp", "ice", {
      definitionId: "onr_v1_228_cinderella",
      title: "Cinderella",
      rezCost: 8,
      strength: 6,
      subtypes: ["ap", "black ice", "firestarter", "sentry"],
    });
    const agendaInstall = (serverId: "remote_1" | "new_remote") =>
      legalAction(
        `install-tycho-${serverId}`,
        "corp",
        "install_card",
        `Install Tycho Extension in ${serverId}`,
        { credits: 0, clicks: 1 },
        {
          source: agenda.instanceId,
          payload: {
            cardId: agenda.instanceId,
            sourceDefinitionId: "onr_v1_220_tycho-extension",
            placement: "root",
            serverId,
            agendaInstallScoreHorizonQuoteSchemaVersion:
              "corp-agenda-install-score-horizon-quote-v1",
            agendaInstallScoreHorizonQuoteCardId: agenda.instanceId,
            agendaInstallScoreHorizonQuoteTargetServerId: serverId,
            agendaInstallScoreHorizonQuoteExpiresAtStateVersion: stateVersion,
            agendaInstallScoreHorizonQuoteAdvancementRequirement: 4,
            agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: 1,
            agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: 3,
            agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: 3,
            agendaInstallScoreHorizonQuoteComplete: true,
          },
        },
      );
    const iceInstall = (serverId: "remote_1" | "new_remote") =>
      legalAction(
        `install-cinderella-${serverId}`,
        "corp",
        "install_card",
        `Install Cinderella on ${serverId}`,
        { credits: serverId === "remote_1" ? 1 : 0, clicks: 1 },
        {
          source: cinderella.instanceId,
          payload: {
            cardId: cinderella.instanceId,
            sourceDefinitionId: "onr_v1_228_cinderella",
            placement: "ice",
            serverId,
            iceInstallBaseCost: serverId === "remote_1" ? 1 : 0,
            iceInstallAdditionalCost: 0,
            iceInstallReduction: 0,
            iceInstallTotalCost: serverId === "remote_1" ? 1 : 0,
            postInstallRezQuoteCardId: cinderella.instanceId,
            postInstallRezQuoteTargetServerId: serverId,
            postInstallRezQuoteProjectedServerId:
              serverId === "new_remote" ? "remote_2" : serverId,
            postInstallRezQuoteExpiresAtStateVersion: stateVersion,
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteCostKind: "fixed",
            postInstallRezQuoteBaseCredits: 8,
            postInstallRezQuoteFinalCredits: 8,
            postInstallRezQuoteMandatoryAgendaPointCost: 0,
          },
        },
      );
    const installAgendaExisting = agendaInstall("remote_1");
    const installAgendaNew = agendaInstall("new_remote");
    const reinforceExisting = iceInstall("remote_1");
    const openSibling = iceInstall("new_remote");
    const gainCredit = legalAction(
      "gain-credit-score-remote-reinforcement",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const endTurn = legalAction(
      "end-turn-score-remote-reinforcement",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [
      installAgendaExisting,
      installAgendaNew,
      reinforceExisting,
      openSibling,
      gainCredit,
      endTurn,
    ]);
    input.decisionId = "score-remote-reinforcement:23";
    input.playerView.stateVersion = stateVersion;
    input.playerView.turnSerial = 11;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [agenda, cinderella];
    input.playerView.opponent.credits = 4;
    input.playerView.opponent.agendaPoints = 2;
    input.playerView.opponent.rig = [
      visibleCard("jackhammer", "runner", "program", {
        definitionId: "onr_v1_036_jackhammer",
        title: "Jackhammer",
        installCost: 1,
        memoryCost: 1,
        strength: 0,
        subtypes: ["icebreaker", "noisy"],
        rezzed: true,
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-ice", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
      server("rd", [
        visibleCard("rd-ice", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-wall", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          title: "Wall of Static",
          rezCost: 3,
          strength: 2,
          subtypes: ["wall"],
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: "remote-wall",
            iceDefinitionId: "onr_v1_279_wall-of-static",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: "remote-wall",
              iceDefinitionId: "onr_v1_279_wall-of-static",
              effectiveStrength: 2,
              subroutines: [
                {
                  id: "remote-wall-end-the-run",
                  type: "end_the_run",
                  sourceDefinitionId: "onr_v1_279_wall-of-static",
                  sourceTitle: "Wall of Static",
                },
              ],
            },
          },
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "remote-wall",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 3,
            finalCredits: 3,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: reinforceExisting.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining("%3Aremote_1"),
          leafExecutorInstanceId:
            "plan:corp.defend_servers:server-defense-portfolio",
          selectedStep: {
            parentInstanceId: expect.stringContaining("%3Aremote_1"),
          },
        },
      },
    });
    expect(decision.actionId).not.toBe(openSibling.actionId);

    const conditionalIceInput = structuredClone(input);
    conditionalIceInput.decisionId =
      "score-remote-engine-quoted-friction-reuse:23";
    conditionalIceInput.playerView.servers[3]!.ice = ["shock-a", "shock-b"].map(
      (instanceId) =>
        visibleCard(instanceId, "corp", "ice", {
          definitionId: "onr_v1_268_shock-r",
          title: "Shock.r",
          rezCost: 1,
          strength: 3,
          subtypes: ["ap", "sentry", "stun"],
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: instanceId,
            iceDefinitionId: "onr_v1_268_shock-r",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: instanceId,
              iceDefinitionId: "onr_v1_268_shock-r",
              effectiveStrength: 3,
              subroutines: [
                {
                  id: `${instanceId}-break-lock`,
                  type: "set_next_encounter_lock",
                  breakTags: ["stun"],
                },
              ],
            },
          },
          effectiveRezCostQuote: {
            context: "installed",
            cardId: instanceId,
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 1,
            finalCredits: 1,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
    );
    conditionalIceInput.playerView.legalActions =
      conditionalIceInput.legalActions;
    resetResidentPlanPortfolioMemory();

    const conditionalIceDecision = liveContext().chooseSemanticRuntimeAction(
      conditionalIceInput,
      {},
    );

    expect(conditionalIceDecision.actionId).not.toBe(openSibling.actionId);
    expect(residentPlanPortfolioSnapshot(conditionalIceInput)).not.toContain(
      "agenda%3Atycho%3Anew_remote",
    );
  });

  it("persists one effect-targeted score-protection draw attempt while keeping same-state retries deterministic", () => {
    resetResidentPlanPortfolioMemory();
    const draw = legalAction(
      "draw",
      "corp",
      "draw_card",
      "Draw a card",
      { credits: 0, clicks: 1 },
      { payload: { drawCardsAmount: 1 } },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const end = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const agendaInstall = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-card",
        payload: {
          cardId: "agenda-card",
          sourceDefinitionId: "onr_v1_220_tycho-extension",
          placement: "root",
          serverId: "remote_1",
        },
      },
    );
    const hunterInstall = legalAction(
      "install-hunter",
      "corp",
      "install_card",
      "Install Hunter in Remote 1",
      { credits: 1, clicks: 1 },
      {
        source: "hunter",
        payload: {
          cardId: "hunter",
          sourceDefinitionId: "onr_v1_249_hunter",
          placement: "ice",
          serverId: "remote_1",
          iceInstallBaseCost: 1,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 1,
          postInstallRezQuoteCardId: "hunter",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: 10,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 2,
          postInstallRezQuoteFinalCredits: 2,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [
      draw,
      credit,
      agendaInstall,
      hunterInstall,
      end,
    ]);
    input.decisionId = "resident-defense-draw:10:corp";
    input.playerView.stateVersion = 10;
    input.playerView.turnSerial = 4;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 13;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-card", "corp", "agenda", {
        definitionId: "onr_v1_220_tycho-extension",
        advancementRequirement: 4,
        agendaPoints: 4,
      }),
      visibleCard("hunter", "corp", "ice", {
        definitionId: "onr_v1_249_hunter",
        rezCost: 2,
        strength: 5,
        subtypes: ["sentry", "bloodhound"],
      }),
      ...Array.from({ length: 3 }, (_, index) =>
        visibleCard(`filler-${index}`, "corp", "operation", {
          definitionId: "onr_v1_284_chance-observation",
        }),
      ),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("existing-remote-ice", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        subtypes: ["icebreaker", "random"],
        rulesText:
          "0 credits: Roll a die. On a 4, 5, or 6, break ice subroutine; otherwise, suffer that much Net damage.\nUse this ability only once on each subroutine during each encounter with a piece of ice.",
        strength: 5,
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "resident-defense-draw-deck",
        side: "corp",
        cards: [
          { cardId: "onr_v1_237_data-wall", quantity: 2 },
          { cardId: "onr_v1_249_hunter", quantity: 1 },
        ],
      },
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = 10;
    }
    input.eventTail = [
      {
        eventId: "mandatory-draw",
        type: "mandatory_draw",
        stateVersionBefore: 8,
        stateVersionAfter: 9,
        stateHashAfter: "hash",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "corp",
          actionType: "mandatory_draw",
          label: "Mandatory draw",
        },
      },
    ];
    const context = liveContext();

    const firstDecision = context.chooseSemanticRuntimeAction(input, {});
    const firstPortfolio = residentPlanPortfolioSnapshot(input);
    expect(JSON.stringify(firstPortfolio)).toContain("draw_for_ice");
    expect(JSON.stringify(firstPortfolio)).toContain(
      '"runnerAccessSuccessProbability":{"numerator":1,"denominator":2}',
    );
    expect(JSON.stringify(firstPortfolio)).toContain(
      '"kind":"score_protection_draw"',
    );
    expect(JSON.stringify(firstPortfolio)).not.toContain("sourceDefinitionIds");
    expect(JSON.stringify(firstPortfolio)).not.toContain(
      '"kind":"score_protection_install"',
    );
    expect(firstDecision).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.defend_servers",
    });
    const selectedSnapshot = firstPortfolio;
    expect(JSON.stringify(selectedSnapshot)).toContain('"remainingAttempts":0');
    expect(JSON.stringify(selectedSnapshot)).toContain(
      '"selectedAtStateVersion":10',
    );

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.defend_servers",
    });

    const afterDraw = structuredClone(input);
    afterDraw.playerView.stateVersion = 11;
    afterDraw.playerView.own.clicks = 1;
    afterDraw.legalActions = [structuredClone(credit), structuredClone(end)];
    for (const action of afterDraw.legalActions) {
      action.expiresAtStateVersion = 11;
    }
    afterDraw.playerView.legalActions = afterDraw.legalActions;
    afterDraw.playerView.own.gripOrHq.push(
      visibleCard("drawn-filler", "corp", "operation", {
        definitionId: "onr_v1_284_chance-observation",
      }),
    );
    expect(context.chooseSemanticRuntimeAction(afterDraw, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(afterDraw, selectedSnapshot);
    expect(context.chooseSemanticRuntimeAction(afterDraw, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    restoreResidentPlanPortfolioMemorySnapshot(afterDraw, selectedSnapshot);
    const nextTurn = structuredClone(input);
    nextTurn.playerView.stateVersion = 12;
    nextTurn.playerView.turnSerial = 5;
    for (const action of nextTurn.legalActions) {
      action.expiresAtStateVersion = 12;
      if (action.actionId === hunterInstall.actionId && action.payload) {
        action.payload.postInstallRezQuoteExpiresAtStateVersion = 12;
      }
    }
    nextTurn.playerView.legalActions = nextTurn.legalActions;
    expect(context.chooseSemanticRuntimeAction(nextTurn, {})).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.defend_servers",
    });

    const malformedReceipts: Array<(signal: Record<string, unknown>) => void> =
      [
        (signal) => {
          (signal.drawAttemptState as Record<string, unknown>).turnKey = 7;
        },
        (signal) => {
          (signal.drawAttemptState as Record<string, unknown>).turnKey =
            "runner:4";
        },
        (signal) => {
          (signal.drawAttemptState as Record<string, unknown>).turnKey =
            "corp:NaN";
        },
        (signal) => {
          (signal.drawAttemptState as Record<string, unknown>).turnKey =
            "corp:1.5";
        },
        (signal) => {
          (signal.drawAttemptState as Record<string, unknown>).turnKey =
            "arbitrary";
        },
        (signal) => {
          (
            signal.drawAttemptState as Record<string, unknown>
          ).remainingAttempts = 2;
        },
        (signal) => {
          delete (signal.drawAttemptState as Record<string, unknown>)
            .selectedAtStateVersion;
        },
        (signal) => {
          (
            signal.drawAttemptState as Record<string, unknown>
          ).selectedAtStateVersion = Number.POSITIVE_INFINITY;
        },
        (signal) => {
          (
            signal.drawAttemptState as Record<string, unknown>
          ).selectedAtStateVersion = -1;
        },
        (signal) => {
          signal.phase = "install_ice";
        },
      ];
    for (const mutate of malformedReceipts) {
      const malformed = structuredClone(selectedSnapshot)!;
      const defense = malformed.instances.find(
        (instance) => instance.moduleId === "corp.defend_servers",
      );
      const state = defense?.moduleState as
        | { signals?: Array<Record<string, unknown>> }
        | undefined;
      const receiptSignal = state?.signals?.find(
        (signal) => signal.drawAttemptState !== undefined,
      );
      expect(receiptSignal).toBeDefined();
      mutate(receiptSignal!);
      resetResidentPlanPortfolioMemory();
      restoreResidentPlanPortfolioMemorySnapshot(afterDraw, malformed);
      expect(() =>
        context.chooseSemanticRuntimeAction(afterDraw, {}),
      ).toThrowError("invalid_plan_identity");
    }
  });

  it("does not create a central-defense funding child without an exact defense parent", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const installPocketVr = legalAction(
      "install-pocket-vr-hq",
      "corp",
      "install_card",
      "Install Pocket Virtual Reality on HQ",
      { credits: 2, clicks: 1 },
      {
        source: "pocket-vr",
        payload: {
          cardId: "pocket-vr",
          sourceDefinitionId: "onr_v1_260_pocket-virtual-reality",
          placement: "ice",
          serverId: "hq",
          postInstallRezQuoteCardId: "pocket-vr",
          postInstallRezQuoteTargetServerId: "hq",
          postInstallRezQuoteProjectedServerId: "hq",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 7,
          postInstallRezQuoteFinalCredits: 7,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const installOlivia = legalAction(
      "install-olivia-hq",
      "corp",
      "install_card",
      "Install Olivia Salazar in HQ",
      { credits: 0, clicks: 1 },
      {
        source: "olivia",
        payload: {
          cardId: "olivia",
          placement: "root",
          serverId: "hq",
        },
      },
    );
    const input = aiInput("corp", [credit, installPocketVr, installOlivia]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda", "corp", "agenda", {
        definitionId: "onr_v1_220_tycho-extension",
        agendaPoints: 4,
        advancementRequirement: 5,
      }),
      visibleCard("pocket-vr", "corp", "ice", {
        definitionId: "onr_v1_260_pocket-virtual-reality",
        rezCost: 7,
      }),
      visibleCard("olivia", "corp", "upgrade", {
        definitionId: "onr_v1_363_olivia-salazar",
        rezCost: 0,
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-ice-1", "corp", "ice", {
          definitionId: "onr_v1_261_quandary",
          rezCost: 0,
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "hq-ice-1",
            targetServerId: "hq",
            projectedServerId: "hq",
            expiresAtStateVersion: 1,
            complete: true,
            costKind: "fixed",
            baseCredits: 0,
            finalCredits: 0,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
        visibleCard("hq-ice-2", "corp", "ice", {
          definitionId: "onr_v1_242_fatal-attractor",
          rezCost: 2,
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "hq-ice-2",
            targetServerId: "hq",
            projectedServerId: "hq",
            expiresAtStateVersion: 1,
            complete: true,
            costKind: "fixed",
            baseCredits: 2,
            finalCredits: 2,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
      server("rd"),
      server("archives"),
    ];

    resetResidentPlanPortfolioMemory();
    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "install-olivia-hq",
      reasonCode: "plan_first.corp.defend_servers",
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "corp.economy" &&
          instance.dedupeKey.includes("defense-reserve"),
      ),
    ).toBe(false);

    resetResidentPlanPortfolioMemory();
    const blockedParent = structuredClone(input);
    blockedParent.legalActions = [credit, installPocketVr];
    blockedParent.playerView.legalActions = blockedParent.legalActions;
    expect(
      liveContext().chooseSemanticRuntimeAction(blockedParent, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(blockedParent)?.instances.some(
        (instance) =>
          instance.moduleId === "corp.economy" &&
          instance.dedupeKey.includes("defense-reserve:hq:pocket-vr"),
      ) ?? false,
    ).toBe(false);
  });

  it("binds a generic funding-only ICE route to the exact defense parent without targeted draw", () => {
    const installDataWall = legalAction(
      "install-data-wall-remote-1",
      "corp",
      "install_card",
      "Install Data Wall on Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "data-wall",
        payload: {
          cardId: "data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          placement: "ice",
          serverId: "remote_1",
          iceInstallBaseCost: 0,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 0,
          postInstallRezQuoteCardId: "data-wall",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 2,
          postInstallRezQuoteFinalCredits: 2,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const draw = legalAction(
      "draw",
      "corp",
      "draw_card",
      "Draw 1 card",
      { credits: 0, clicks: 1 },
      { payload: { drawCardsAmount: 1 } },
    );
    const input = aiInput("corp", [installDataWall, credit, draw]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("data-wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 2,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];

    resetResidentPlanPortfolioMemory();
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    const portfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));

    expect(portfolio).toContain('"disposition":"funding_only"');
    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:corp_defense_exact_route_funding_required:remote_1:install-data-wall-remote-1",
    );
    expect(portfolio).toContain(
      '"parentInstanceId":"plan:corp.defend_servers:server-defense-portfolio"',
    );
    expect(portfolio).toContain(
      '"parentNeedId":"install:remote_1:install-data-wall-remote-1"',
    );
    expect(portfolio).toContain('"parentPriorityClass":"P6"');
    expect(portfolio).not.toContain('"kind":"score_protection_draw"');
  });

  it("routes exact BBS hosted-credit withdrawals through economy and rejects unquoted payouts", () => {
    const nightShift = legalAction(
      "night-shift",
      "corp",
      "play_operation",
      "Play Night Shift",
      { credits: 0, clicks: 1 },
      {
        source: "night-shift-card",
        payload: {
          cardId: "night-shift-card",
          gainCreditsAmount: 2,
          drawCardsAmount: 1,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    resetResidentPlanPortfolioMemory();
    const reserve = aiInput("corp", [nightShift, credit]);
    reserve.playerView.own.credits = 3;
    reserve.playerView.own.stackOrRdCount = 12;
    reserve.playerView.own.gripOrHq = [
      visibleCard("night-shift-card", "corp", "operation", {
        definitionId: "onr_v1_295_night-shift",
      }),
    ];
    expect(
      liveContext().chooseSemanticRuntimeAction(reserve, {}),
    ).toMatchObject({
      actionId: "night-shift",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const bbsPayout = legalAction(
      "bbs-payout",
      "corp",
      "activated_card_ability",
      "Take 2 credits from BBS Whispering Campaign",
      { credits: 0, clicks: 1 },
      {
        source: "bbs-card",
        payload: {
          cardId: "bbs-card",
          gainCreditsAmount: 2,
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
          hostedCreditTakeMode: "up_to_amount_if_available",
        },
      },
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    resetResidentPlanPortfolioMemory();
    const afterReserve = aiInput("corp", [bbsPayout, draw]);
    afterReserve.playerView.own.credits = 5;
    afterReserve.playerView.own.stackOrRdCount = 12;
    afterReserve.playerView.own.gripOrHq = [
      visibleCard("hand-card", "corp", "operation", {
        definitionId: "onr_v1_284_chance-observation",
      }),
    ];
    afterReserve.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("bbs-card", "corp", "asset", {
            definitionId: "onr_v1_309_bbs-whispering-campaign",
            title: "BBS Whispering Campaign",
            rezzed: true,
            counters: { bit: 14 },
          }),
        ],
      ),
    ];
    expect(
      buildActionSemanticCandidates(afterReserve).find(
        (candidate) => candidate.actionId === "bbs-payout",
      ),
    ).toMatchObject({
      actionId: "bbs-payout",
      sourceKind: "card",
      sourceCardInstanceId: "bbs-card",
      semanticActionType: "economy.gain_credit",
    });
    expect(
      liveContext().chooseSemanticRuntimeAction(afterReserve, {}),
    ).toMatchObject({
      actionId: "bbs-payout",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const unquotedPayout = legalAction(
      "bbs-unquoted-payout",
      "corp",
      "activated_card_ability",
      "Take credits from BBS Whispering Campaign",
      { credits: 0, clicks: 1 },
      {
        source: "bbs-card",
        payload: {
          cardId: "bbs-card",
          gainCreditsAmount: 2,
        },
      },
    );
    resetResidentPlanPortfolioMemory();
    const unquoted = aiInput("corp", [unquotedPayout, draw]);
    unquoted.playerView.own.credits = afterReserve.playerView.own.credits;
    unquoted.playerView.own.stackOrRdCount =
      afterReserve.playerView.own.stackOrRdCount;
    unquoted.playerView.own.gripOrHq = afterReserve.playerView.own.gripOrHq;
    unquoted.playerView.servers = afterReserve.playerView.servers;
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(unquoted, {}),
    ).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });

  it("installs Red Herrings only into the exact visible scoring fort", () => {
    const install = legalAction(
      "install-red-herrings",
      "corp",
      "install_card",
      "Install Red Herrings in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "red-herrings",
        payload: {
          cardId: "red-herrings",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const scoringFort = aiInput("corp", [install, credit]);
    scoringFort.playerView.own.credits = 20;
    scoringFort.playerView.own.gripOrHq = [
      visibleCard("red-herrings", "corp", "upgrade", {
        definitionId: "onr_v1_366_red-herrings",
        title: "Red Herrings",
      }),
    ];
    scoringFort.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [],
        [
          visibleCard("agenda", "corp", "agenda", {
            definitionId: "onr_v1_195_corporate-retreat",
            title: "Corporate Retreat",
            advancementRequirement: 4,
          }),
        ],
      ),
    ];

    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(scoringFort, {}),
    ).toMatchObject({
      actionId: "install-red-herrings",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });

    const emptyFort = aiInput("corp", [install, credit]);
    emptyFort.playerView.own.credits = 20;
    emptyFort.playerView.own.gripOrHq = scoringFort.playerView.own.gripOrHq;
    emptyFort.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(emptyFort, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("rezzes Red Herrings only at the latest relevant scoring-fort window", () => {
    const rez = legalAction(
      "rez-red-herrings",
      "corp",
      "rez_card",
      "Rez Red Herrings",
      { credits: 1, clicks: 0 },
      {
        source: "red-herrings",
        payload: {
          cardId: "red-herrings",
          serverId: "remote_1",
        },
      },
    );
    const atWindow = (iceIndex: number) => {
      const input = aiInput("corp", [rez]);
      input.playerView.timingPoint = "run.approach_ice";
      input.playerView.own.credits = 20;
      input.playerView.run = {
        attackedServerId: "remote_1",
        phase: "approach_ice",
        position: {
          kind: "ice",
          serverId: "remote_1",
          iceIndex,
        },
        successful: false,
      };
      input.playerView.servers = [
        server("hq"),
        server("rd"),
        server("archives"),
        server(
          "remote_1",
          [
            visibleCard("inner-ice", "corp", "ice", {
              definitionId: "onr_v1_237_data-wall",
              title: "Data Wall",
              rezzed: true,
            }),
            visibleCard("outer-ice", "corp", "ice", {
              definitionId: "onr_v1_245_fire-wall",
              title: "Fire Wall",
              rezzed: true,
            }),
          ],
          [
            visibleCard("agenda", "corp", "agenda", {
              definitionId: "onr_v1_195_corporate-retreat",
              title: "Corporate Retreat",
              advancementRequirement: 4,
            }),
            visibleCard("red-herrings", "corp", "upgrade", {
              definitionId: "onr_v1_366_red-herrings",
              title: "Red Herrings",
              rezzed: false,
            }),
          ],
        ),
      ];
      return input;
    };

    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(atWindow(0), {}),
    ).toMatchObject({
      actionId: "rez-red-herrings",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });

    resetResidentPlanPortfolioMemory();
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(atWindow(1), {}),
    ).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });

  it("routes an explicit fortified-server defense upgrade through the global defense plan", () => {
    resetResidentPlanPortfolioMemory();
    const rez = legalAction(
      "rez-olivia",
      "corp",
      "rez_card",
      "Use Olivia Salazar",
      { credits: 1, clicks: 0 },
      {
        source: "olivia-card",
        payload: { cardId: "olivia-card", serverId: "hq" },
      },
    );
    const input = aiInput("corp", [rez]);
    input.playerView.own.credits = 10;
    input.playerView.servers = [
      server(
        "hq",
        [
          visibleCard("hq-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: false,
          }),
        ],
        [
          visibleCard("olivia-card", "corp", "upgrade", {
            definitionId: "onr_v1_363_olivia-salazar",
            title: "Olivia Salazar",
            rezzed: true,
          }),
        ],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "rez-olivia",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("allocates a defensive upgrade only to the server with usable unrezzed ICE", () => {
    resetResidentPlanPortfolioMemory();
    const oliviaId = "olivia-card";
    const installHq = legalAction(
      "install-olivia-hq",
      "corp",
      "install_card",
      "Install Olivia Salazar in HQ",
      { credits: 0, clicks: 1 },
      {
        source: oliviaId,
        payload: {
          cardId: oliviaId,
          serverId: "hq",
          placement: "root",
        },
      },
    );
    const installRd = legalAction(
      "install-olivia-rd",
      "corp",
      "install_card",
      "Install Olivia Salazar in R&D",
      { credits: 0, clicks: 1 },
      {
        source: oliviaId,
        payload: {
          cardId: oliviaId,
          serverId: "rd",
          placement: "root",
        },
      },
    );
    const installNewRemote = legalAction(
      "install-olivia-new-remote",
      "corp",
      "install_card",
      "Install Olivia Salazar in a new remote",
      { credits: 0, clicks: 1 },
      {
        source: oliviaId,
        payload: {
          cardId: oliviaId,
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const end = legalAction(
      "corp.end_turn",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [
      installHq,
      installRd,
      installNewRemote,
      end,
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.gripOrHq = [
      visibleCard(oliviaId, "corp", "upgrade", {
        definitionId: "onr_v1_363_olivia-salazar",
        title: "Olivia Salazar",
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-ice", "corp", "ice", {
          definitionId: "onr_v1_252_keeper",
          title: "Keeper",
          rezzed: false,
        }),
      ]),
      server("rd", [
        visibleCard("rd-ice", "corp", "ice", {
          definitionId: "onr_v1_245_fire-wall",
          title: "Fire Wall",
          rezzed: true,
        }),
      ]),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installHq.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("does not treat an arbitrary fortified-server upgrade as defense support", () => {
    resetResidentPlanPortfolioMemory();
    const rez = legalAction(
      "rez-hacker-tracker",
      "corp",
      "rez_card",
      "Rez Hacker Tracker Central",
      { credits: 2, clicks: 0 },
      {
        source: "hacker-tracker",
        payload: { cardId: "hacker-tracker", serverId: "hq" },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [rez, credit]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 10;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.servers = [
      server(
        "hq",
        [
          visibleCard("hq-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: false,
          }),
        ],
        [
          visibleCard("hacker-tracker", "corp", "asset", {
            definitionId: "onr_v1_325_hacker-tracker-central",
            title: "Hacker Tracker Central",
            rezzed: false,
          }),
        ],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("does not let the score plan claim advancement of a visible asset", () => {
    resetResidentPlanPortfolioMemory();
    const advanceAsset = legalAction(
      "advance-asset",
      "corp",
      "advance_card",
      "Advance asset",
      { credits: 1, clicks: 1 },
      { source: "asset-1", payload: { cardId: "asset-1" } },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const endTurn = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [advanceAsset, credit, endTurn]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 4;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("asset-1", "corp", "asset", {
            definitionId: "onr_v1_348_virus-test-site",
            title: "Virus Test Site",
          }),
        ],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("keeps advancement of a visible agenda inside the score plan", () => {
    resetResidentPlanPortfolioMemory();
    const advanceAgenda = legalAction(
      "advance-agenda",
      "corp",
      "advance_card",
      "Advance agenda",
      { credits: 1, clicks: 1 },
      { source: "agenda-1", payload: { cardId: "agenda-1" } },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw 1", {
      credits: 0,
      clicks: 1,
    });
    const input = aiInput("corp", [advanceAgenda, credit, draw]);
    input.playerView.own.credits = 4;
    input.playerView.servers = [
      server(
        "remote_1",
        [
          visibleCard("ice-1", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            rezzed: true,
          }),
        ],
        [
          visibleCard("agenda-1", "corp", "agenda", {
            definitionId: "onr_v1_189_artificial-security-directors",
            advancementCounters: 2,
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "advance-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:transient_plan_signal_plan:corp.score_agenda",
    );
  });

  it("keeps an Engine-quoted obligation removal and agenda gain inside the score plan", () => {
    resetResidentPlanPortfolioMemory();
    const removeObligation = legalAction(
      "remove-obligation",
      "corp",
      "trigger_ability",
      "Remove obligation and score 1 agenda point",
      { credits: 12, clicks: 1 },
      {
        source: "game_rule",
        payload: {
          abilityId: "remove_obligation",
          obligationDebtAbility: "remove_obligation",
          obligationDebtCreditCost: 12,
          obligationDebtScoreAgendaPoints: 1,
          obligationDebtCountBefore: 1,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [removeObligation, credit]);
    input.playerView.own.credits = 14;
    input.playerView.own.clicks = 2;
    input.playerView.own.agendaPoints = 3;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: removeObligation.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:convert_score_agenda",
    );
  });

  it("binds an exact scored-agenda continuation to the selected score parent", () => {
    resetResidentPlanPortfolioMemory();
    const scoreAgenda = legalAction(
      "score-downsizing",
      "corp",
      "score_agenda",
      "Score Corporate Downsizing",
      { credits: 0, clicks: 0 },
      {
        source: "downsizing-source",
        payload: { cardId: "downsizing-source" },
      },
    );
    const input = aiInput("corp", [scoreAgenda]);
    input.playerView.stateVersion = 11;
    scoreAgenda.expiresAtStateVersion = 11;
    input.decisionId = "score-downsizing:11";
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("downsizing-source", "corp", "agenda", {
            definitionId: "onr_v1_194_corporate-downsizing",
            advancementCounters: 4,
            advancementRequirement: 4,
          }),
        ],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "score-downsizing",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "corp.score_agenda",
      moduleState: {
        kind: "score",
        signal: { agendaInstanceId: "downsizing-source" },
        choiceContinuation: {
          family: "corp_scored_agenda_on_score",
          selectedActionId: "score-downsizing",
          selectedAtStateVersion: 11,
          targetCardId: "downsizing-source",
        },
      },
    });
  });

  it("prebinds the canonical high-rez-cost ICE target to a scored-agenda free-rez continuation", () => {
    const scoreAgenda = legalAction(
      "score-priority-requisition",
      "corp",
      "score_agenda",
      "Score Priority Requisition",
      { credits: 0, clicks: 0 },
      {
        source: "priority-requisition",
        payload: { cardId: "priority-requisition" },
      },
    );
    const input = aiInput("corp", [scoreAgenda]);
    input.playerView.stateVersion = 11;
    scoreAgenda.expiresAtStateVersion = 11;
    input.decisionId = "score-priority-requisition:11";
    input.playerView.servers = [
      server("hq", [
        visibleCard("expensive-ice", "corp", "ice", {
          definitionId: "onr_v1_273_triggerman",
          rezzed: false,
          rezCost: 7,
        }),
        visibleCard("cheaper-ice", "corp", "ice", {
          definitionId: "onr_v1_279_wall-of-static",
          rezzed: false,
          rezCost: 5,
        }),
      ]),
      server(
        "remote_1",
        [],
        [
          visibleCard("priority-requisition", "corp", "agenda", {
            definitionId: "onr_v1_212_priority-requisition",
            advancementCounters: 5,
            advancementRequirement: 5,
            agendaPoints: 3,
          }),
        ],
      ),
    ];

    resetResidentPlanPortfolioMemory();
    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: scoreAgenda.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "corp.score_agenda",
      moduleState: {
        kind: "score",
        choiceContinuation: {
          family: "corp_scored_agenda_on_score",
          selectedActionId: scoreAgenda.actionId,
          targetCardId: "priority-requisition",
          freeRezChoiceBinding: {
            targetPurpose: "rez_best_defensive_ice",
            targetCardId: "expensive-ice",
            targetDefinitionId: "onr_v1_273_triggerman",
          },
        },
      },
    });
  });

  it("keeps the score plan while prebinding its scored ICE-mark target through the Defense service", () => {
    const scoreAgenda = legalAction(
      "score-ice-transmutation",
      "corp",
      "score_agenda",
      "Score Ice Transmutation",
      { credits: 0, clicks: 0 },
      {
        source: "ice-transmutation",
        payload: { cardId: "ice-transmutation" },
      },
    );
    const input = aiInput("corp", [scoreAgenda]);
    input.playerView.stateVersion = 129;
    scoreAgenda.expiresAtStateVersion = 129;
    input.decisionId = "score-ice-transmutation:129";
    input.playerView.servers = [
      server("hq", [
        visibleCard("hq-data-wall", "corp", "ice", {
          definitionId: "onr_v1_238_data-wall-2-0",
          rezzed: true,
          strength: 1,
          effectiveRunQuote: {
            iceInstanceId: "hq-data-wall",
            iceDefinitionId: "onr_v1_238_data-wall-2-0",
            effectiveStrength: 1,
            subroutines: [
              {
                id: "etr",
                type: "end_the_run",
                sourceDefinitionId: "onr_v1_238_data-wall-2-0",
                sourceTitle: "Data Wall 2.0",
              },
            ],
          },
        }),
      ]),
      server(
        "remote_1",
        [
          visibleCard("empty-remote-wall", "corp", "ice", {
            definitionId: "onr_v1_279_wall-of-static",
            rezzed: true,
            strength: 2,
            effectiveRunQuote: {
              iceInstanceId: "empty-remote-wall",
              iceDefinitionId: "onr_v1_279_wall-of-static",
              effectiveStrength: 2,
              subroutines: [
                {
                  id: "etr",
                  type: "end_the_run",
                  sourceDefinitionId: "onr_v1_279_wall-of-static",
                  sourceTitle: "Wall of Static",
                },
              ],
            },
          }),
        ],
        [
          visibleCard("ice-transmutation", "corp", "agenda", {
            definitionId: "onr_v1_204_ice-transmutation",
            advancementCounters: 5,
            advancementRequirement: 5,
            agendaPoints: 3,
          }),
        ],
      ),
    ];

    resetResidentPlanPortfolioMemory();
    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: scoreAgenda.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor).toMatchObject({
      moduleId: "corp.score_agenda",
      moduleState: {
        kind: "score",
        choiceContinuation: {
          family: "corp_scored_agenda_on_score",
          selectedActionId: scoreAgenda.actionId,
          selectedAtStateVersion: 129,
          targetCardId: "ice-transmutation",
          iceMarkChoiceBinding: {
            targetPurpose: "strengthen_and_repeat_best_ice_subroutine",
            targetCardId: "hq-data-wall",
            targetDefinitionId: "onr_v1_238_data-wall-2-0",
          },
        },
      },
    });
  });

  it("scores an exact visible zero-requirement agenda instead of advancing it", () => {
    resetResidentPlanPortfolioMemory();
    const scoreAgenda = legalAction(
      "score-effective-zero",
      "corp",
      "score_agenda",
      "Score Corporate Downsizing",
      { credits: 0, clicks: 0 },
      {
        source: "effective-zero-agenda",
        payload: { cardId: "effective-zero-agenda" },
      },
    );
    const dominatedAdvance = legalAction(
      "advance-effective-zero",
      "corp",
      "advance_card",
      "Advance Corporate Downsizing",
      { credits: 1, clicks: 1 },
      {
        source: "effective-zero-agenda",
        payload: { cardId: "effective-zero-agenda" },
      },
    );
    const input = aiInput("corp", [dominatedAdvance, scoreAgenda]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 26;
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("effective-zero-agenda", "corp", "agenda", {
            definitionId: "onr_v1_194_corporate-downsizing",
            advancementCounters: 0,
            advancementRequirement: 0,
          }),
        ],
      ),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "score-effective-zero",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:corp_same_turn_score_conversion:score_ready",
    );
  });

  it("fails closed when an advance has missing cost semantics", () => {
    resetResidentPlanPortfolioMemory();
    const advanceAgenda = legalAction(
      "advance-agenda-without-cost",
      "corp",
      "advance_card",
      "Advance agenda without projected cost",
      { credits: 1, clicks: 1 },
      {
        source: "agenda-unknown-cost",
        payload: { cardId: "agenda-unknown-cost" },
      },
    );
    advanceAgenda.costs = [];
    const installEconomy = legalAction(
      "install-bbs",
      "corp",
      "install_card",
      "Install BBS Whispering Campaign",
      { credits: 0, clicks: 1 },
      {
        source: "bbs-card",
        payload: {
          cardId: "bbs-card",
          serverId: "remote_2",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [advanceAgenda, installEconomy]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("bbs-card", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
        title: "BBS Whispering Campaign",
      }),
    ];
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("agenda-unknown-cost", "corp", "agenda", {
            definitionId: "onr_v1_189_artificial-security-directors",
            advancementCounters: 1,
            advancementRequirement: 3,
          }),
        ],
      ),
      server("remote_2"),
    ];

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      "missing_plan_module_coverage",
    );
  });

  it("keeps an advance with unknown score facts unresolved instead of declaring it nonproductive", () => {
    resetResidentPlanPortfolioMemory();
    const advanceAgenda = legalAction(
      "advance-agenda-without-cost",
      "corp",
      "advance_card",
      "Advance agenda without projected cost",
      { credits: 1, clicks: 1 },
      {
        source: "agenda-unknown-cost",
        payload: { cardId: "agenda-unknown-cost" },
      },
    );
    advanceAgenda.costs = [];
    advanceAgenda.expiresAtStateVersion = 1;
    const input = aiInput("corp", [advanceAgenda]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 2;
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("agenda-unknown-cost", "corp", "agenda", {
            definitionId: "onr_v1_189_artificial-security-directors",
            advancementCounters: 1,
            advancementRequirement: 3,
          }),
        ],
      ),
    ];

    let failure: unknown;
    try {
      liveContext().chooseSemanticRuntimeAction(input, {});
    } catch (caught) {
      failure = caught;
    }

    expect(failure).toMatchObject({
      code: "missing_plan_module_coverage",
      context: {
        unresolvedActionIds: ["advance-agenda-without-cost"],
      },
    });
  });

  it("keeps an ICE install with an incomplete Engine rez quote unresolved", () => {
    resetResidentPlanPortfolioMemory();
    const installIce = legalAction(
      "install-ice-with-unknown-rez-cost",
      "corp",
      "install_card",
      "Install ICE with incomplete rez quote",
      { credits: 0, clicks: 1 },
      {
        source: "ice-unknown-rez-cost",
        payload: {
          cardId: "ice-unknown-rez-cost",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          postInstallRezQuoteCardId: "ice-unknown-rez-cost",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteComplete: false,
        },
      },
    );
    installIce.expiresAtStateVersion = 1;
    const input = aiInput("corp", [installIce]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("ice-unknown-rez-cost", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];

    let failure: unknown;
    try {
      liveContext().chooseSemanticRuntimeAction(input, {});
    } catch (caught) {
      failure = caught;
    }

    expect(failure).toMatchObject({
      code: "missing_plan_module_coverage",
      context: {
        unresolvedActionIds: ["install-ice-with-unknown-rez-cost"],
      },
    });
  });

  it("funds an exposed agenda's exact score protection reserve before advancing", () => {
    resetResidentPlanPortfolioMemory();
    const advance = legalAction(
      "advance-coup",
      "corp",
      "advance_card",
      "Advance Corporate Coup",
      { credits: 1, clicks: 1 },
      {
        source: "coup-card",
        payload: { cardId: "coup-card" },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [advance, credit]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 1;
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("coup-card", "corp", "agenda", {
            definitionId: "onr_v1_193_corporate-coup",
            title: "Corporate Coup",
            advancementCounters: 0,
            advancementRequirement: 5,
          }),
        ],
      ),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    const scorePortfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));
    expect(scorePortfolio).toContain('"protectionNeed"');
    expect(scorePortfolio).toContain('"fundedProtection":false');
    expect(scorePortfolio).toContain(
      '"evidenceCode":"corp_score_protection_required:remote_1"',
    );

    const conversionClockInput = structuredClone(input);
    conversionClockInput.decisionId = "exposed-agenda-conversion-clock:1:corp";
    conversionClockInput.playerView.own.clicks = 2;
    resetResidentPlanPortfolioMemory();
    const conversionClockDecision = liveContext().chooseSemanticRuntimeAction(
      conversionClockInput,
      {},
    );
    expect(conversionClockDecision).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.score_agenda",
        planFirstDecision: {
          route: { actionId: advance.actionId },
        },
      },
    });
    expect(conversionClockDecision.evidence).toContain(
      "plan_assessment_evidence:corp_exposed_agenda_progress_preserves_conversion_clock:remote_1",
    );
  });

  it("keeps score ownership when an Engine-certified damage layer is removed", () => {
    const stateVersion = 1;
    const advance = legalAction(
      "advance-protected-agenda",
      "corp",
      "advance_card",
      "Advance protected agenda",
      { credits: 1, clicks: 1 },
      {
        source: "agenda-protected",
        payload: { cardId: "agenda-protected" },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [advance, credit]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 3;
    input.playerView.opponent.handCount = 5;
    const damageLayer = (instanceId: string) =>
      visibleCard(instanceId, "corp", "ice", {
        definitionId: "onr_classic_007_brain-drain",
        strength: 3,
        subtypes: ["sentry", "black_ice", "ap"],
        rezzed: true,
        effectiveRunQuote: {
          iceInstanceId: instanceId,
          iceDefinitionId: "onr_classic_007_brain-drain",
          effectiveStrength: 3,
          subroutines: [
            {
              id: `${instanceId}-damage`,
              type: "random_damage",
              amount: 1,
              damageType: "core",
              unbrokenRunEffect: { causesDamageOrProgramTrash: true },
            },
          ],
        },
      });
    input.playerView.servers = [
      server(
        "remote_1",
        [damageLayer("damage-layer-1"), damageLayer("damage-layer-2")],
        [
          visibleCard("agenda-protected", "corp", "agenda", {
            definitionId: "onr_v1_211_polymer-breakthrough",
            advancementCounters: 0,
            advancementRequirement: 6,
            agendaPoints: 2,
          }),
        ],
      ),
    ];

    resetResidentPlanPortfolioMemory();
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.score_agenda",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          route: { actionId: advance.actionId },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_engine_certified_mature_remote_score_advance:remote_1",
      ]),
    );

    const oneLayer = structuredClone(input);
    oneLayer.decisionId = "protected-agenda-one-layer";
    oneLayer.playerView.servers[0]!.ice.pop();
    resetResidentPlanPortfolioMemory();
    const oneLayerDecision = liveContext().chooseSemanticRuntimeAction(
      oneLayer,
      {},
    );
    expect(oneLayerDecision).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.score_agenda",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          route: { actionId: advance.actionId },
        },
      },
    });
    expect(oneLayerDecision.evidence).toContain(
      "plan_assessment_evidence:corp_exposed_agenda_progress_preserves_conversion_clock:remote_1",
    );
  });

  it("does not treat generic access damage as a tag-punish conversion", () => {
    resetResidentPlanPortfolioMemory();
    const bloodCatAbility = legalAction(
      "blood-cat-trace",
      "corp",
      "activated_card_ability",
      "Use Blood Cat",
      { credits: 0, clicks: 1 },
      {
        source: "blood-cat-1",
        payload: {
          sourceDefinitionId: "onr_v1_310_blood-cat",
        },
      },
    );
    const installVirusTestSite = legalAction(
      "install-virus-test-site",
      "corp",
      "install_card",
      "Install Virus Test Site",
      { credits: 0, clicks: 1 },
      {
        source: "virus-test-site-1",
        payload: {
          sourceDefinitionId: "onr_v1_348_virus-test-site",
          serverId: "new_remote",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const endTurn = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("corp", [
      bloodCatAbility,
      installVirusTestSite,
      credit,
      endTurn,
    ]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 4;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.opponent.tags = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("virus-test-site-1", "corp", "asset", {
        definitionId: "onr_v1_348_virus-test-site",
      }),
    ];
    input.playerView.servers = [
      server(
        "remote_1",
        [],
        [
          visibleCard("blood-cat-1", "corp", "asset", {
            definitionId: "onr_v1_310_blood-cat",
            rezzed: true,
          }),
        ],
      ),
    ];
    (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent = {
      schemaVersion: "corp-strategic-intent-profile-v1",
      side: "corp",
      source: {
        deckStrategyProfile: "ai_internal_strategy_profile",
        deckCapabilities: "ai_internal",
        strategicIntentState: "strategic_intent_state_v1",
        plannerEffect: "runtime_projection",
      },
      primaryWinIntent: "corp.score_agendas",
      scorePlan: ["corp.remote_scoreline"],
      defensePlan: [],
      economyPlan: [],
      enginePlan: [],
      punishPlan: [],
      riskProfile: [],
      rejectedIntents: ["corp.ambush_bluff_blocked"],
      confidence: "high",
      evidence: ["test_ambush_plan_explicitly_rejected"],
    } satisfies CorpStrategicIntentProfile;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("routes a strict score plan through global defense when Data Wall makes exact 1/2 progress against Blink", () => {
    resetResidentPlanPortfolioMemory();
    const stateVersion = 1;
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const installIce = legalAction(
      "install-ice",
      "corp",
      "install_card",
      "Install ICE",
      { credits: 0, clicks: 1 },
      {
        source: "ice-1",
        payload: {
          cardId: "ice-1",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "new_remote",
          placement: "ice",
          postInstallRezQuoteCardId: "ice-1",
          postInstallRezQuoteTargetServerId: "new_remote",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [installAgenda, installIce, credit]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: "onr_v1_189_artificial-security-directors",
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("ice-1", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "install-ice",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:score_protection_progress:agenda:agenda-1:new_remote:new_remote",
    );
    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(JSON.stringify(portfolio)).toContain('"effect":"progress"');
    expect(JSON.stringify(portfolio)).toContain(
      '"runnerAccessSuccessProbability":{"numerator":1,"denominator":2}',
    );
  });

  it("binds a visible ETR layer to a blocked new-remote score project before deepening an already layered central", () => {
    resetResidentPlanPortfolioMemory();
    const stateVersion = 1;
    const installAgenda = legalAction(
      "install-agenda-new",
      "corp",
      "install_card",
      "Install agenda in a new remote",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_v1_194_corporate-downsizing",
          serverId: "new_remote",
          placement: "root",
          agendaInstallScoreHorizonQuoteSchemaVersion:
            "corp-agenda-install-score-horizon-quote-v1",
          agendaInstallScoreHorizonQuoteCardId: "agenda-1",
          agendaInstallScoreHorizonQuoteTargetServerId: "new_remote",
          agendaInstallScoreHorizonQuoteExpiresAtStateVersion: stateVersion,
          agendaInstallScoreHorizonQuoteAdvancementRequirement: 3,
          agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: 2,
          agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: 1,
          agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: 3,
          agendaInstallScoreHorizonQuoteComplete: true,
        },
      },
    );
    const installFilter = (serverId: "new_remote" | "hq", credits: number) =>
      legalAction(
        `install-filter-${serverId}`,
        "corp",
        "install_card",
        `Install Filter before ${serverId}`,
        { credits, clicks: 1 },
        {
          source: "filter-1",
          payload: {
            cardId: "filter-1",
            sourceDefinitionId: "onr_v1_244_filter",
            serverId,
            placement: "ice",
            ...(serverId === "hq"
              ? {
                  iceInstallBaseCost: credits,
                  iceInstallAdditionalCost: 0,
                  iceInstallReduction: 0,
                  iceInstallTotalCost: credits,
                }
              : {}),
            postInstallRezQuoteCardId: "filter-1",
            postInstallRezQuoteTargetServerId: serverId,
            postInstallRezQuoteProjectedServerId:
              serverId === "new_remote" ? "remote_1" : serverId,
            postInstallRezQuoteExpiresAtStateVersion: stateVersion,
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteCostKind: "fixed",
            postInstallRezQuoteBaseCredits: 0,
            postInstallRezQuoteFinalCredits: 0,
            postInstallRezQuoteMandatoryAgendaPointCost: 0,
          },
        },
      );
    const installFilterNew = installFilter("new_remote", 0);
    const installFilterHq = installFilter("hq", 4);
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [
      installAgenda,
      installFilterNew,
      installFilterHq,
      credit,
    ]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 64;
    input.playerView.own.clicks = 3;
    input.playerView.own.agendaPoints = 1;
    input.playerView.own.stackOrRdCount = 1;
    input.playerView.agendaPointsToWin = 7;
    input.playerView.opponent.credits = 19;
    input.playerView.opponent.agendaPoints = 4;
    input.playerView.opponent.memoryUsed = 3;
    input.playerView.opponent.memoryLimit = 6;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: "onr_v1_194_corporate-downsizing",
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
      visibleCard("agenda-2", "corp", "agenda", {
        definitionId: "onr_v1_214_project-babylon",
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("agenda-3", "corp", "agenda", {
        definitionId: "onr_v1_194_corporate-downsizing",
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
      visibleCard("filter-1", "corp", "ice", {
        definitionId: "onr_v1_244_filter",
        rezCost: 0,
        strength: 0,
        subtypes: ["code_gate"],
      }),
      visibleCard("operation-1", "corp", "operation", {
        definitionId: "onr_v1_305_team-restructuring",
      }),
      visibleCard("operation-2", "corp", "operation", {
        definitionId: "onr_v1_305_team-restructuring",
      }),
    ];
    const rezzedCentralIce = (id: string) =>
      visibleCard(id, "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
        rezzed: true,
      });
    input.playerView.servers = [
      server("hq", [
        rezzedCentralIce("hq-ice-1"),
        rezzedCentralIce("hq-ice-2"),
        rezzedCentralIce("hq-ice-3"),
        rezzedCentralIce("hq-ice-4"),
      ]),
      server("rd", [
        rezzedCentralIce("rd-ice-1"),
        rezzedCentralIce("rd-ice-2"),
        rezzedCentralIce("rd-ice-3"),
        rezzedCentralIce("rd-ice-4"),
        rezzedCentralIce("rd-ice-5"),
        rezzedCentralIce("rd-ice-6"),
      ]),
      server("archives"),
    ];
    input.playerView.corpCentralAccessQuotes = ["hq", "rd"].map((serverId) => ({
      serverId: serverId as "hq" | "rd",
      stateVersion,
      complete: true as const,
      effectiveAccessCount: 1,
      isMultiaccess: false,
      sourceDefinitionIds: [],
      serverBoundEffects: [],
    }));
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "new-remote-score-protection-vs-central-layer",
      side: "corp",
      cards: [
        { cardId: "onr_v1_194_corporate-downsizing", quantity: 2 },
        { cardId: "onr_v1_214_project-babylon", quantity: 1 },
        { cardId: "onr_v1_244_filter", quantity: 1 },
        { cardId: "onr_v1_305_team-restructuring", quantity: 2 },
        { cardId: "onr_v1_237_data-wall", quantity: 10 },
        { cardId: "onr_v1_288_day-shift", quantity: 1 },
      ],
    });
    input.playerView.opponent.rig = [
      visibleCard("runner-krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        strength: 0,
        subtypes: ["icebreaker"],
      }),
      visibleCard("runner-cloak", "runner", "program", {
        definitionId: "onr_v1_011_cloak",
        subtypes: ["stealth"],
        counters: { bit: 3 },
        counterDisplays: [
          {
            id: "restricted_pool",
            amount: 3,
            displayKind: "restricted_pool",
            label: "Run-Bits",
            ariaLabel: "3 Run-Bits",
            counterType: "bit",
            usageHint: "spendable",
            creditPool: {
              kind: "restricted_credit",
              capacity: 3,
              uses: ["using_icebreaker_during_run_non_noisy"],
            },
          },
        ],
      }),
      visibleCard("runner-quiet", "runner", "program", {
        definitionId: "onr_v1_071_vewy-vewy-quiet",
        subtypes: ["stealth"],
        counters: { bit: 2 },
        counterDisplays: [
          {
            id: "restricted_pool",
            amount: 2,
            displayKind: "restricted_pool",
            label: "Run-Bits",
            ariaLabel: "2 Run-Bits",
            counterType: "bit",
            usageHint: "spendable",
            creditPool: {
              kind: "restricted_credit",
              capacity: 2,
              uses: ["using_icebreaker_during_run_non_noisy"],
            },
          },
        ],
      }),
      visibleCard("runner-spin-chip", "runner", "hardware", {
        definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
        subtypes: ["chip"],
        counters: { bit: 2 },
        counterDisplays: [
          {
            id: "restricted_pool",
            amount: 2,
            displayKind: "restricted_pool",
            label: "Run-Bits",
            ariaLabel: "2 Run-Bits",
            counterType: "bit",
            usageHint: "spendable",
            creditPool: {
              kind: "restricted_credit",
              capacity: 2,
              uses: ["using_icebreaker_during_run"],
              requireHostedBreakerForIcebreakerUse: true,
            },
          },
        ],
      }),
      visibleCard("runner-mem-chip", "runner", "hardware", {
        definitionId: "onr_v1_146_zetatech-mem-chip",
        subtypes: ["chip"],
      }),
      visibleCard("runner-short-circuit", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        subtypes: ["bbs"],
      }),
    ];
    input.playerView.legalActions = input.legalActions;

    expect(allocateCorpCentralDefenseFromAiFacts({ input })).toMatchObject({
      status: "known",
      evidence: { hq: { threat: "material", installedIceCount: 4 } },
    });
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: installFilterNew.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          leafExecutorInstanceId:
            "plan:corp.defend_servers:server-defense-portfolio",
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("score_protection_staging_install:"),
      ]),
    );
  });

  it("hands a scoring remote from global defense to the score plan once a second independent ETR satisfies exact 1/4", () => {
    const stateVersion = 1;
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const installIce = legalAction(
      "install-ice",
      "corp",
      "install_card",
      "Install ICE",
      { credits: 1, clicks: 1 },
      {
        source: "ice-2",
        payload: {
          cardId: "ice-2",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 1,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 1,
          postInstallRezQuoteCardId: "ice-2",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [installAgenda, installIce]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: "onr_v1_189_artificial-security-directors",
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("ice-2", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("ice-1", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];

    resetResidentPlanPortfolioMemory();
    const protectionDecision = liveContextWithTurnPlanQuote(
      input,
    ).chooseSemanticRuntimeAction(input, {});
    expect(protectionDecision).toMatchObject({
      reasonCode: "plan_first.corp.defend_servers",
      selectionKind: "engine_randomized_turn_plan_selection",
      engineCommand: {
        kind: "engine_randomized_turn_plan_selection",
        quote: {
          candidates: expect.arrayContaining([
            expect.objectContaining({ actionId: "install-ice" }),
          ]),
        },
      },
    });
    expect(protectionDecision.evidence).toContain(
      "plan_assessment_evidence:score_protection_satisfied:agenda:agenda-1:remote_1:remote_1",
    );
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
      '"runnerAccessSuccessProbability":{"numerator":1,"denominator":4}',
    );

    resetResidentPlanPortfolioMemory();
    const protectedInput = structuredClone(input);
    protectedInput.playerView.stateVersion = 2;
    protectedInput.decisionId = "protected-score-remote:2:corp";
    protectedInput.playerView.own.credits = 3;
    protectedInput.playerView.own.clicks = 2;
    protectedInput.playerView.own.gripOrHq =
      protectedInput.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== "ice-2",
      );
    protectedInput.playerView.servers[3]!.ice.push(
      visibleCard("ice-existing-2", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
        rezzed: true,
      }),
    );
    const protectedAgendaAction = structuredClone(installAgenda);
    protectedAgendaAction.costs = [{ clicks: 1 }];
    protectedAgendaAction.expiresAtStateVersion = 2;
    protectedInput.legalActions = [protectedAgendaAction];
    protectedInput.playerView.legalActions = protectedInput.legalActions;
    expect(
      liveContextWithTurnPlanQuote(protectedInput).chooseSemanticRuntimeAction(
        protectedInput,
        {},
      ),
    ).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(protectedInput)),
    ).not.toContain("missing_action_semantics");
  });

  it("lets the score plan reuse a mature remote whose two Engine-certified layers tax or damage without changing exact access probability", () => {
    const stateVersion = 1;
    const installAgenda = legalAction(
      "install-agenda-in-mature-remote",
      "corp",
      "install_card",
      "Install agenda in mature remote",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_classic_002_superserum",
          serverId: "remote_1",
          placement: "root",
          agendaInstallScoreHorizonQuoteSchemaVersion:
            "corp-agenda-install-score-horizon-quote-v1",
          agendaInstallScoreHorizonQuoteCardId: "agenda-1",
          agendaInstallScoreHorizonQuoteTargetServerId: "remote_1",
          agendaInstallScoreHorizonQuoteExpiresAtStateVersion: stateVersion,
          agendaInstallScoreHorizonQuoteAdvancementRequirement: 3,
          agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances: 1,
          agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: 2,
          agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks: 3,
          agendaInstallScoreHorizonQuoteComplete: true,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const installRedundantFourthIce = legalAction(
      "install-redundant-fourth-ice",
      "corp",
      "install_card",
      "Install another ICE on the mature remote",
      { credits: 3, clicks: 1 },
      {
        source: "extra-data-wall",
        payload: {
          cardId: "extra-data-wall",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 3,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 3,
          postInstallRezQuoteCardId: "extra-data-wall",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 5,
          postInstallRezQuoteFinalCredits: 5,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [
      installAgenda,
      installRedundantFourthIce,
      credit,
    ]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 7;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: "onr_classic_002_superserum",
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
      visibleCard("extra-data-wall", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        rezCost: 5,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.opponent.agendaPoints = 5;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("glacier", "corp", "ice", {
          definitionId: "onr_classic_011_glacier",
          strength: 5,
          subtypes: ["code_gate", "ap"],
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: "glacier",
            iceDefinitionId: "onr_classic_011_glacier",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: "glacier",
              iceDefinitionId: "onr_classic_011_glacier",
              effectiveStrength: 5,
              subroutines: [
                { id: "glacier-etr-1", type: "end_the_run" },
                { id: "glacier-etr-2", type: "end_the_run" },
              ],
            },
          },
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "glacier",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 0,
            finalCredits: 0,
            mandatoryAdditionalCosts: { agendaPoints: 1 },
          },
        }),
        visibleCard("brain-drain", "corp", "ice", {
          definitionId: "onr_classic_007_brain-drain",
          strength: 3,
          subtypes: ["sentry", "black_ice", "ap"],
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: "brain-drain",
            iceDefinitionId: "onr_classic_007_brain-drain",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: "brain-drain",
              iceDefinitionId: "onr_classic_007_brain-drain",
              effectiveStrength: 3,
              subroutines: [
                {
                  id: "brain-drain-random-damage",
                  type: "random_damage",
                  amount: 3,
                  damageType: "core",
                },
              ],
            },
          },
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "brain-drain",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 3,
            finalCredits: 3,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
        visibleCard("entrapment", "corp", "ice", {
          definitionId: "onr_classic_010_entrapment",
          strength: 4,
          subtypes: ["code_gate", "deflector"],
          rezzed: false,
          effectivePostRezRunQuote: {
            context: "installed_post_rez",
            cardId: "entrapment",
            iceDefinitionId: "onr_classic_010_entrapment",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            effectiveRunQuote: {
              iceInstanceId: "entrapment",
              iceDefinitionId: "onr_classic_010_entrapment",
              effectiveStrength: 4,
              subroutines: [
                {
                  id: "paid-deflect",
                  type: "deflect_run",
                  deflectorTarget: "any_data_fort",
                  deflectorCost: 2,
                },
              ],
            },
          },
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "entrapment",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 2,
            finalCredits: 2,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
    ];
    input.playerView.opponent.rig = [];

    resetResidentPlanPortfolioMemory();
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: installAgenda.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.score_agenda",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:corp.score_agenda:",
          ),
          route: { actionId: installAgenda.actionId },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_engine_certified_mature_remote_score_install:remote_1",
      ]),
    );
    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(JSON.stringify(portfolio)).not.toContain(
      "corp_score_protection_funding_gap:remote_1",
    );
    expect(JSON.stringify(portfolio)).not.toContain(
      installRedundantFourthIce.actionId,
    );

    const underfunded = structuredClone(input);
    underfunded.decisionId = "mature-remote-underfunded";
    underfunded.playerView.own.credits = 6;
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(underfunded, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const cheaplyBreakable = structuredClone(input);
    cheaplyBreakable.decisionId = "mature-remote-cheaply-breakable";
    cheaplyBreakable.legalActions = [installAgenda, credit];
    cheaplyBreakable.playerView.legalActions = cheaplyBreakable.legalActions;
    cheaplyBreakable.playerView.opponent.credits = 17;
    cheaplyBreakable.playerView.opponent.rig = [
      visibleCard("runner-krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        strength: 0,
        subtypes: ["icebreaker"],
      }),
    ];
    cheaplyBreakable.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        ["cheap-wall-1", "cheap-wall-2"].map((instanceId) =>
          visibleCard(instanceId, "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezCost: 1,
            strength: 0,
            subtypes: ["wall"],
            rezzed: false,
            effectivePostRezRunQuote: {
              context: "installed_post_rez",
              cardId: instanceId,
              iceDefinitionId: "onr_v1_237_data-wall",
              targetServerId: "remote_1",
              projectedServerId: "remote_1",
              expiresAtStateVersion: stateVersion,
              complete: true,
              effectiveRunQuote: {
                iceInstanceId: instanceId,
                iceDefinitionId: "onr_v1_237_data-wall",
                effectiveStrength: 0,
                subroutines: [
                  {
                    id: `${instanceId}-etr`,
                    type: "end_the_run",
                  },
                ],
              },
            },
            effectiveRezCostQuote: {
              context: "installed",
              cardId: instanceId,
              targetServerId: "remote_1",
              projectedServerId: "remote_1",
              expiresAtStateVersion: stateVersion,
              complete: true,
              costKind: "fixed",
              baseCredits: 1,
              finalCredits: 1,
              mandatoryAdditionalCosts: { agendaPoints: 0 },
            },
          }),
        ),
      ),
    ];
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(cheaplyBreakable, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const liquidityBindingRemote = structuredClone(input);
    liquidityBindingRemote.decisionId = "mature-remote-liquidity-binding";
    liquidityBindingRemote.legalActions = [installAgenda, credit];
    liquidityBindingRemote.playerView.legalActions =
      liquidityBindingRemote.legalActions;
    liquidityBindingRemote.playerView.opponent.agendaPoints = 4;
    liquidityBindingRemote.playerView.opponent.credits = 10;
    liquidityBindingRemote.playerView.opponent.rig = [
      visibleCard("runner-krash", "runner", "program", {
        definitionId: "onr_v1_039_krash",
        strength: 0,
        subtypes: ["icebreaker"],
      }),
      visibleCard("runner-cloak", "runner", "program", {
        definitionId: "onr_v1_011_cloak",
        subtypes: ["stealth"],
        counters: { bit: 3 },
        counterDisplays: [
          {
            id: "restricted_pool",
            amount: 3,
            displayKind: "restricted_pool",
            label: "Run-Bits",
            ariaLabel: "3 Run-Bits",
            counterType: "bit",
            usageHint: "spendable",
            creditPool: {
              kind: "restricted_credit",
              capacity: 3,
              uses: ["using_icebreaker_during_run_non_noisy"],
            },
          },
        ],
      }),
    ];
    liquidityBindingRemote.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("data-wall-2", "corp", "ice", {
          definitionId: "onr_v1_238_data-wall-2-0",
          strength: 1,
          subtypes: ["wall"],
          rezzed: true,
          effectiveRunQuote: {
            iceInstanceId: "data-wall-2",
            iceDefinitionId: "onr_v1_238_data-wall-2-0",
            effectiveStrength: 1,
            subroutines: [{ id: "data-wall-2-etr", type: "end_the_run" }],
          },
        }),
        visibleCard("endless-corridor", "corp", "ice", {
          definitionId: "onr_v1_239_endless-corridor",
          strength: 2,
          subtypes: ["code_gate"],
          rezzed: true,
          effectiveRunQuote: {
            iceInstanceId: "endless-corridor",
            iceDefinitionId: "onr_v1_239_endless-corridor",
            effectiveStrength: 2,
            subroutines: [
              { id: "endless-corridor-etr-1", type: "end_the_run" },
              { id: "endless-corridor-etr-2", type: "end_the_run" },
            ],
          },
        }),
      ]),
    ];

    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(liquidityBindingRemote, {}),
    ).toMatchObject({
      actionId: installAgenda.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "corp.score_agenda",
        planFirstDecision: {
          route: { actionId: installAgenda.actionId },
        },
      },
    });

    const terminalLiquidityBindingRemote = structuredClone(
      liquidityBindingRemote,
    );
    terminalLiquidityBindingRemote.decisionId =
      "mature-remote-terminal-liquidity-binding";
    terminalLiquidityBindingRemote.playerView.opponent.agendaPoints = 5;
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(
        terminalLiquidityBindingRemote,
        {},
      ),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      JSON.stringify(
        residentPlanPortfolioSnapshot(terminalLiquidityBindingRemote),
      ),
    ).toContain("corp_score_protection_required:remote_1");
  });

  it("installs a matchpoint agenda in the last viable deckout window under an extra mandatory draw", () => {
    resetResidentPlanPortfolioMemory();
    const installAgenda = legalAction(
      "install-terminal-agenda",
      "corp",
      "install_card",
      "Install Black Ice Quality Assurance in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "terminal-agenda",
        payload: {
          cardId: "terminal-agenda",
          sourceDefinitionId: "onr_v1_191_black-ice-quality-assurance",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "terminal-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [credit, installAgenda]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 4;
    input.playerView.own.stackOrRdCount = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("terminal-agenda", "corp", "agenda", {
        definitionId: "onr_v1_191_black-ice-quality-assurance",
        title: "Black Ice Quality Assurance",
        advancementRequirement: 5,
        agendaPoints: 2,
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];
    input.playerView.publicEvents.push({
      eventId: "terminal-extra-mandatory-draw",
      type: "mandatory_draw",
      stateVersionBefore: 0,
      stateVersionAfter: 1,
      stateHashAfter: "fnv1a:terminal-extra-draw",
      publicPayload: {
        actor: "corp",
        actionType: "mandatory_draw",
        label: "Korp Pflichtkarten ziehen",
        corpMandatoryDraw: true,
        corpMandatoryCardCount: 1,
        corpMandatoryAdditionalCardCount: 1,
        corpMandatoryTotalBaseDrawCount: 2,
        corpMandatoryAgendaCardCount: 0,
        corpMandatoryOptionalAgendaCardCount: 0,
        corpMandatorySkivvissCardCount: 1,
        corpMandatoryAdditionalSourceCount: 1,
        corpMandatoryAdditionalSourceDefinitionIds: "onr_v1_064_skivviss",
      },
    });
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "terminal-extra-draw-scoreline",
      side: "corp",
      cards: [
        {
          cardId: "onr_v1_191_black-ice-quality-assurance",
          quantity: 4,
        },
      ],
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installAgenda.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:install_score_agenda",
        "plan_assessment_evidence:corp_last_viable_deckout_matchpoint_install:remote_1",
      ]),
    );
  });

  it("continues a certified score-protection assessment with a near-term-fundable additional ICE layer", () => {
    const stateVersion = 1;
    const installAgenda = legalAction(
      "install-agenda-staged",
      "corp",
      "install_card",
      "Install agenda in staged remote",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-staged",
        payload: {
          cardId: "agenda-staged",
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const installIce = legalAction(
      "install-additional-ice",
      "corp",
      "install_card",
      "Install another protective ICE",
      { credits: 1, clicks: 1 },
      {
        source: "additional-ice",
        payload: {
          cardId: "additional-ice",
          sourceDefinitionId: "onr_v1_237_data-wall",
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 1,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 1,
          postInstallRezQuoteCardId: "additional-ice",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [installAgenda, installIce, credit]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-staged", "corp", "agenda", {
        definitionId: "onr_v1_189_artificial-security-directors",
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("additional-ice", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("staged-ice", "corp", "ice", {
          definitionId: "onr_v1_223_banpei",
          rezzed: false,
          strength: 1,
          subtypes: ["sentry"],
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "staged-ice",
            targetServerId: "remote_1",
            projectedServerId: "remote_1",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 2,
            finalCredits: 2,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    input.playerView.specialZones = {
      setAside: [
        visibleCard("rent-i-con", "runner", "program", {
          definitionId: "onr_classic_031_rent-i-con",
          strength: 0,
          subtypes: ["icebreaker", "ai"],
        }),
      ],
      removedFromGame: [],
      setAsideCount: 1,
      removedFromGameCount: 0,
    };

    resetResidentPlanPortfolioMemory();
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "install-additional-ice",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        "plan_step_capability:develop_score_protection",
        "plan_assessment_evidence:score_protection_progress:agenda:agenda-staged:remote_1:remote_1",
      ]),
    );

    const overextended = structuredClone(input);
    overextended.decisionId = "score-protection-staging-overextended";
    const overextendedQuote =
      overextended.playerView.servers[3]!.ice[0]!.effectiveRezCostQuote;
    if (overextendedQuote?.complete !== true) {
      throw new Error("Expected complete staged ICE rez quote");
    }
    overextended.playerView.servers[3]!.ice[0]!.effectiveRezCostQuote = {
      ...overextendedQuote,
      baseCredits: 8,
      finalCredits: 8,
    };
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(overextended, {}),
    ).toMatchObject({
      actionId: "install-additional-ice",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });

    const unknownBaseline = structuredClone(input);
    unknownBaseline.decisionId = "score-protection-staging-unknown-baseline";
    unknownBaseline.playerView.servers[3]!.ice[0]!.rezzed = true;
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(unknownBaseline, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("chooses between equal-layer score remotes only from the exact parent protection baseline and fails closed when it becomes unknown", () => {
    const stateVersion = 1;
    const agendaDefinitionId = "onr_v1_189_artificial-security-directors";
    const installProtected = legalAction(
      "install-agenda-protected",
      "corp",
      "install_card",
      "Install agenda behind Data Wall",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-protected",
        payload: {
          cardId: "agenda-protected",
          sourceDefinitionId: agendaDefinitionId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const endTurn = legalAction(
      "end",
      "corp",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [installProtected, credit, endTurn]);
    for (const action of input.legalActions)
      action.expiresAtStateVersion = stateVersion;
    input.playerView.stateVersion = stateVersion;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-protected", "corp", "agenda", {
        definitionId: agendaDefinitionId,
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
    ];
    const dataWall = visibleCard("data-wall", "corp", "ice", {
      definitionId: "onr_v1_237_data-wall",
      rezzed: true,
      strength: 0,
      subtypes: ["wall"],
    });
    const secondDataWall = visibleCard("data-wall-2", "corp", "ice", {
      definitionId: "onr_v1_237_data-wall",
      rezzed: true,
      strength: 0,
      subtypes: ["wall"],
    });
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [dataWall, secondDataWall]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];

    resetResidentPlanPortfolioMemory();
    const protectedDecision = liveContext().chooseSemanticRuntimeAction(
      input,
      {},
    );
    const protectedPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(input),
    );
    expect(protectedDecision).toMatchObject({
      actionId: "install-agenda-protected",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(protectedPortfolio).toContain(
      '"instanceId":"plan:corp.score_agenda:agenda%3Aagenda-protected%3Aremote_1"',
    );
    expect(protectedPortfolio).toContain(
      '"runnerAccessSuccessProbability":{"numerator":1,"denominator":4}',
    );
    expect(protectedPortfolio).toContain('"fundedProtection":true');
    expect(protectedPortfolio).toContain('"protectsScore":true');
    const unprotectedInput = structuredClone(input);
    unprotectedInput.decisionId = "equal-layer-parent-baseline:2:corp";
    unprotectedInput.playerView.stateVersion = 2;
    unprotectedInput.playerView.own.clicks = 1;
    unprotectedInput.playerView.own.credits = 0;
    for (const action of unprotectedInput.legalActions)
      action.expiresAtStateVersion = 2;
    unprotectedInput.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    )!.ice = [
      visibleCard("hunter-1", "corp", "ice", {
        definitionId: "onr_v1_249_hunter",
        rezzed: true,
        strength: 5,
        subtypes: ["sentry", "bloodhound"],
      }),
      visibleCard("hunter-2", "corp", "ice", {
        definitionId: "onr_v1_249_hunter",
        rezzed: true,
        strength: 5,
        subtypes: ["sentry", "bloodhound"],
      }),
    ];

    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(unprotectedInput, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    const unknownInput = structuredClone(input);
    unknownInput.decisionId = "equal-layer-parent-baseline:3:corp";
    unknownInput.playerView.stateVersion = 3;
    unknownInput.playerView.own.clicks = 1;
    unknownInput.playerView.own.credits = 0;
    for (const action of unknownInput.legalActions)
      action.expiresAtStateVersion = 3;
    const unknownDataWall = unknownInput.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    )!.ice[1]!;
    unknownDataWall.rezzed = false;
    delete unknownDataWall.effectiveRezCostQuote;

    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(unknownInput, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("keeps one qualified opening rush stable until Engine RNG selects the posture", () => {
    const dataWall = CARD_DEFINITIONS_BY_ID["onr_v1_238_data-wall-2-0"]!;
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const accounts = legalAction(
      "accounts",
      "corp",
      "play_operation",
      "Play Accounts Receivable",
      { credits: 5, clicks: 1 },
      {
        source: "accounts-card",
        payload: {
          cardId: "accounts-card",
          gainCreditsAmount: 9,
        },
      },
    );
    const openingInput = (seed: string) => {
      const input = aiInput("corp", [installAgenda, accounts]);
      input.seed = seed;
      input.playerView.turnSerial = 2;
      input.playerView.own.credits = 5;
      input.playerView.own.clicks = 3;
      input.playerView.own.gripOrHq = [
        visibleCard("agenda-1", "corp", "agenda", {
          definitionId: "onr_v1_189_artificial-security-directors",
          advancementRequirement: 3,
          agendaPoints: 1,
        }),
        visibleCard("accounts-card", "corp", "operation", {
          definitionId: "onr_v1_281_accounts-receivable",
        }),
      ];
      input.playerView.opponent.rig = [
        visibleCard("blink", "runner", "program", {
          definitionId: "onr_v1_007_blink",
          strength: 5,
          subtypes: ["icebreaker", "random"],
        }),
      ];
      input.playerView.servers = [
        server("hq"),
        server("rd"),
        server("archives"),
        server("remote_1", [
          visibleCard("data-wall", "corp", "ice", {
            definitionId: dataWall.id,
            rezCost: dataWall.rezCost!,
            strength: dataWall.strength!,
            subtypes: dataWall.subtypes,
            rezzed: true,
          }),
        ]),
      ];
      for (const action of input.legalActions) {
        action.expiresAtStateVersion = input.playerView.stateVersion;
      }
      input.playerView.legalActions = input.legalActions;
      Object.assign(input, {
        planningRulesContext: buildPlanningRulesContext({
          rulesBaseline: CURRENT_RULES_BASELINE,
          formatProfileId: "opening-rush-shadow-test",
          cardPoolSnapshotId: "opening-rush-shadow-test",
        }),
        planningStateIdentity: buildPlanningStateIdentity(input),
      });
      return input;
    };

    resetResidentPlanPortfolioMemory();
    const first = openingInput("opening-seed-0");
    const firstDecision = liveContext().chooseSemanticRuntimeAction(first, {});
    expect(firstDecision).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      firstDecision.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      mode: "cutover",
      coverage: {
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      },
      campaigns: [
        expect.objectContaining({
          kind: "opening_rush",
          status: "continuable",
          openingRushOpportunityKey: "opening-rush:2:agenda-1:remote_1",
          requoteStatus: "current",
        }),
      ],
      shadowComparison: {
        liveActionId: "accounts",
      },
    });
    const firstPortfolio = JSON.stringify(residentPlanPortfolioSnapshot(first));
    expect(firstPortfolio).toContain('"admission":"engine_randomized"');
    expect(firstPortfolio).toContain(
      '"opportunityKey":"opening-rush:2:agenda-1:remote_1"',
    );
    expect(firstPortfolio).not.toContain("hashBucket");

    resetResidentPlanPortfolioMemory();
    const second = openingInput("opening-seed-1");
    const secondDecision = liveContext().chooseSemanticRuntimeAction(
      second,
      {},
    );
    expect(secondDecision).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      secondDecision.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      mode: "cutover",
      coverage: {
        status: "pass",
        coveragePercent: 100,
      },
      shadowComparison: {
        liveActionId: "accounts",
      },
    });
    expect(JSON.stringify(residentPlanPortfolioSnapshot(second))).toContain(
      '"admission":"engine_randomized"',
    );

    const revalidated = structuredClone(first);
    revalidated.playerView.stateVersion = 2;
    revalidated.playerView.own.credits = 6;
    revalidated.decisionId = "opening-rush-revalidated";
    for (const action of revalidated.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    revalidated.playerView.legalActions = revalidated.legalActions;
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(revalidated, {}),
    ).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
    });
    const revalidatedPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(revalidated),
    );
    expect(revalidatedPortfolio).toContain(
      '"opportunityKey":"opening-rush:2:agenda-1:remote_1"',
    );
    expect(revalidatedPortfolio).not.toContain("hashBucket");
  });

  it("keeps a public Shell-Traders breaker outside opening-rush admission", () => {
    const dataWall = CARD_DEFINITIONS_BY_ID["onr_v1_238_data-wall-2-0"]!;
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: "onr_v1_189_artificial-security-directors",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const accounts = legalAction(
      "accounts",
      "corp",
      "play_operation",
      "Play Accounts Receivable",
      { credits: 5, clicks: 1 },
      {
        source: "accounts-card",
        payload: {
          cardId: "accounts-card",
          gainCreditsAmount: 9,
        },
      },
    );
    const input = aiInput("corp", [installAgenda, accounts]);
    input.seed = "opening-seed-0";
    input.playerView.turnSerial = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: "onr_v1_189_artificial-security-directors",
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("accounts-card", "corp", "operation", {
        definitionId: "onr_v1_281_accounts-receivable",
      }),
    ];
    input.playerView.opponent.rig = [
      visibleCard("blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];
    input.playerView.specialZones = {
      setAside: [
        visibleCard("rent-i-con", "runner", "program", {
          definitionId: "onr_classic_031_rent-i-con",
          strength: 0,
          subtypes: ["icebreaker", "ai"],
        }),
      ],
      removedFromGame: [],
      setAsideCount: 1,
      removedFromGameCount: 0,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("data-wall", "corp", "ice", {
          definitionId: dataWall.id,
          rezCost: dataWall.rezCost!,
          strength: dataWall.strength!,
          subtypes: dataWall.subtypes,
          rezzed: true,
        }),
      ]),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    resetResidentPlanPortfolioMemory();
    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
      '"reason":"public_staged_breaker"',
    );
  });

  it("prefers the exact satisfying prepared-remote route over a merely progressing new-remote route", () => {
    const agendaDefinitionId = "onr_v1_189_artificial-security-directors";
    const iceDefinitionId = "onr_v1_237_data-wall";
    const stateVersion = 1;
    const installAgendaExisting = legalAction(
      "install-agenda-existing",
      "corp",
      "install_card",
      "Install agenda in prepared remote",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: agendaDefinitionId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const installAgendaNew = legalAction(
      "install-agenda-new",
      "corp",
      "install_card",
      "Install agenda in new remote",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-1",
        payload: {
          cardId: "agenda-1",
          sourceDefinitionId: agendaDefinitionId,
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const installIceExisting = legalAction(
      "install-ice-existing",
      "corp",
      "install_card",
      "Reinforce prepared remote",
      { credits: 1, clicks: 1 },
      {
        source: "ice-2",
        payload: {
          cardId: "ice-2",
          sourceDefinitionId: iceDefinitionId,
          serverId: "remote_1",
          placement: "ice",
          iceInstallBaseCost: 1,
          iceInstallAdditionalCost: 0,
          iceInstallReduction: 0,
          iceInstallTotalCost: 1,
          postInstallRezQuoteCardId: "ice-2",
          postInstallRezQuoteTargetServerId: "remote_1",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const installIceNew = legalAction(
      "install-ice-new",
      "corp",
      "install_card",
      "Open another remote",
      { credits: 0, clicks: 1 },
      {
        source: "ice-2",
        payload: {
          cardId: "ice-2",
          sourceDefinitionId: iceDefinitionId,
          serverId: "new_remote",
          placement: "ice",
          postInstallRezQuoteCardId: "ice-2",
          postInstallRezQuoteTargetServerId: "new_remote",
          postInstallRezQuoteProjectedServerId: "remote_2",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 1,
          postInstallRezQuoteFinalCredits: 1,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const fundPreparedCredit = legalAction(
      "fund-prepared-remote",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [
      installAgendaNew,
      installAgendaExisting,
      installIceNew,
      installIceExisting,
      fundPreparedCredit,
    ]);
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = stateVersion;
    }
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-1", "corp", "agenda", {
        definitionId: agendaDefinitionId,
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("ice-2", "corp", "ice", {
        definitionId: iceDefinitionId,
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("ice-1", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezCost: 1,
          strength: 0,
          subtypes: ["wall"],
          rezzed: true,
        }),
      ]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];

    resetResidentPlanPortfolioMemory();
    const defenseDecision = liveContextWithTurnPlanQuote(
      input,
    ).chooseSemanticRuntimeAction(input, {});
    expect(defenseDecision).toMatchObject({
      reasonCode: "plan_first.corp.defend_servers",
      selectionKind: "engine_randomized_turn_plan_selection",
      engineCommand: {
        kind: "engine_randomized_turn_plan_selection",
        quote: {
          candidates: expect.arrayContaining([
            expect.objectContaining({ actionId: "install-ice-existing" }),
          ]),
        },
      },
    });
    expect(defenseDecision.evidence).toContain(
      "plan_assessment_evidence:score_protection_satisfied:agenda:agenda-1:remote_1:remote_1",
    );
    const portfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));
    expect(portfolio).toContain('"effect":"satisfied"');
    expect(portfolio).not.toContain('"effect":"progress"');
    expect(portfolio).toContain(
      '"parentInstanceId":"plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1"',
    );
    expect((defenseDecision.evidence ?? []).join("\n")).not.toContain(
      "new_remote",
    );

    const blockedPreparedInput = structuredClone(input);
    blockedPreparedInput.decisionId = "blocked-prepared-score-remote:1:corp";
    blockedPreparedInput.legalActions =
      blockedPreparedInput.legalActions.filter(
        (action) => action.actionId !== "install-ice-existing",
      );
    blockedPreparedInput.playerView.legalActions =
      blockedPreparedInput.legalActions;
    resetResidentPlanPortfolioMemory();
    const executableSiblingDecision = liveContextWithTurnPlanQuote(
      blockedPreparedInput,
    ).chooseSemanticRuntimeAction(blockedPreparedInput, {});
    expect(executableSiblingDecision).toMatchObject({
      actionId: "install-ice-new",
      reasonCode: "plan_first.corp.defend_servers",
    });
    expect(executableSiblingDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        "plan_step_capability:develop_score_protection",
      ]),
    );
    const siblingPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(blockedPreparedInput),
    );
    expect(siblingPortfolio).toContain(
      '"parentInstanceId":"plan:corp.score_agenda:agenda%3Aagenda-1%3Anew_remote"',
    );
    expect(siblingPortfolio).not.toContain(
      '"parentInstanceId":"plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1","effect":"progress"',
    );

    const compromisedPreparedInput = structuredClone(input);
    compromisedPreparedInput.decisionId =
      "recently-compromised-prepared-score-remote:1:corp";
    compromisedPreparedInput.playerView.publicEvents = [
      {
        eventId: "runner-stole-from-prepared-remote",
        type: "steal_agenda",
        stateVersionBefore: 0,
        stateVersionAfter: 1,
        turnSerial: 1,
        stateHashAfter: "fnv1a:runner-stole-from-prepared-remote",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "steal_agenda",
          targetServerId: "remote_1",
        },
      },
    ];
    compromisedPreparedInput.eventTail =
      compromisedPreparedInput.playerView.publicEvents;
    resetResidentPlanPortfolioMemory();
    const beforeCompromiseInput = structuredClone(compromisedPreparedInput);
    beforeCompromiseInput.playerView.stateVersion = 0;
    beforeCompromiseInput.playerView.publicEvents = [];
    beforeCompromiseInput.eventTail = [];
    for (const action of beforeCompromiseInput.legalActions) {
      action.expiresAtStateVersion = 0;
    }
    beforeCompromiseInput.playerView.legalActions =
      beforeCompromiseInput.legalActions;
    rememberResidentPlanPortfolio(beforeCompromiseInput, {
      schemaVersion: "resident-plan-portfolio-v2",
      side: "corp",
      stateVersion: 0,
      instances: [],
      completionHistory: [],
      transitions: [],
    });
    const compromisedDecision = liveContext().chooseSemanticRuntimeAction(
      compromisedPreparedInput,
      {},
    );
    expect(compromisedDecision).toMatchObject({
      actionId: "install-ice-existing",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(compromisedDecision.actionId).not.toBe("install-agenda-existing");
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(compromisedPreparedInput)),
    ).toContain(
      "corp_recently_compromised_score_remote_requires_reprotection:remote_1",
    );

    const fundPreparedInput = structuredClone(input);
    fundPreparedInput.decisionId = "fund-prepared-score-remote:1:corp";
    fundPreparedInput.playerView.own.credits = 1;
    resetResidentPlanPortfolioMemory();
    const fundedPreparedDecision = liveContext().chooseSemanticRuntimeAction(
      fundPreparedInput,
      {},
    );
    expect(fundedPreparedDecision).toMatchObject({
      actionId: fundPreparedCredit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(fundedPreparedDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
        "plan_priority_delegated_from:plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
      ]),
    );
    const fundedPreparedPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(fundPreparedInput),
    );
    expect(fundedPreparedPortfolio).toContain(
      '"parentInstanceId":"plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1"',
    );
    expect(fundedPreparedPortfolio).not.toContain("new_remote");

    const protectedInput = structuredClone(input);
    protectedInput.playerView.stateVersion = 2;
    protectedInput.decisionId = "prepared-score-remote:2:corp";
    protectedInput.playerView.own.credits = 3;
    protectedInput.playerView.own.clicks = 2;
    protectedInput.playerView.own.gripOrHq =
      protectedInput.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== "ice-2",
      );
    protectedInput.playerView.servers[3]!.ice.push(
      visibleCard("ice-existing-2", "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezCost: 1,
        strength: 0,
        subtypes: ["wall"],
        rezzed: true,
      }),
    );
    const agendaExistingAtState2 = structuredClone(installAgendaExisting);
    agendaExistingAtState2.expiresAtStateVersion = 2;
    const agendaNewAtState2 = structuredClone(installAgendaNew);
    agendaNewAtState2.expiresAtStateVersion = 2;
    protectedInput.legalActions = [agendaNewAtState2, agendaExistingAtState2];
    protectedInput.playerView.legalActions = protectedInput.legalActions;
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(protectedInput, {}),
    ).toMatchObject({
      actionId: "install-agenda-existing",
      reasonCode: "plan_first.corp.score_agenda",
    });
  });

  it("funds an exact four-credit R&D rez reserve at runner matchpoint before remote development", () => {
    const stateVersion = 1;
    const credit = legalAction(
      "terminal-rd-reserve-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const installCanisNew = legalAction(
      "install-canis-new-remote",
      "corp",
      "install_card",
      "Install Canis Major in a new remote",
      { credits: 0, clicks: 1 },
      {
        source: "canis-major",
        payload: {
          cardId: "canis-major",
          sourceDefinitionId: "onr_v1_225_canis-major",
          serverId: "new_remote",
          placement: "ice",
          postInstallRezQuoteCardId: "canis-major",
          postInstallRezQuoteTargetServerId: "new_remote",
          postInstallRezQuoteProjectedServerId: "remote_1",
          postInstallRezQuoteExpiresAtStateVersion: stateVersion,
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCostKind: "fixed",
          postInstallRezQuoteBaseCredits: 4,
          postInstallRezQuoteFinalCredits: 4,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = aiInput("corp", [installCanisNew, credit]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 2;
    input.playerView.own.stackOrRdCount = 2;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.opponent.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("canis-major", "corp", "ice", {
        definitionId: "onr_v1_225_canis-major",
        title: "Canis Major",
        rezCost: 4,
        strength: 0,
        subtypes: ["sentry"],
      }),
      visibleCard("hq-chance", "corp", "operation", {
        definitionId: "onr_v1_284_chance-observation",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("rd-crystal-wall", "corp", "ice", {
          definitionId: "onr_v1_232_crystal-wall",
          title: "Crystal Wall",
          rezCost: 4,
          strength: 3,
          subtypes: ["wall"],
          rezzed: false,
          effectiveRezCostQuote: {
            context: "installed",
            cardId: "rd-crystal-wall",
            targetServerId: "rd",
            projectedServerId: "rd",
            expiresAtStateVersion: stateVersion,
            complete: true,
            costKind: "fixed",
            baseCredits: 4,
            finalCredits: 4,
            mandatoryAdditionalCosts: { agendaPoints: 0 },
          },
        }),
      ]),
      server("archives"),
    ];
    input.playerView.corpCentralAccessQuotes = ["hq", "rd"].map((serverId) => ({
      serverId: serverId as "hq" | "rd",
      stateVersion,
      complete: true as const,
      effectiveAccessCount: 1,
      isMultiaccess: false,
      sourceDefinitionIds: [],
      serverBoundEffects: [],
    }));
    input.playerView.specialZones = {
      setAside: [],
      removedFromGame: [],
      setAsideCount: 0,
      removedFromGameCount: 0,
    };
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "terminal-rd-rez-reserve",
      side: "corp",
      cards: [
        { cardId: "onr_v1_232_crystal-wall", quantity: 1 },
        { cardId: "onr_v1_225_canis-major", quantity: 1 },
        { cardId: "onr_v1_284_chance-observation", quantity: 2 },
        { cardId: "onr_v1_201_executive-extraction", quantity: 1 },
      ],
    });
    expect(allocateCorpCentralDefenseFromAiFacts({ input })).toMatchObject({
      status: "known",
      selectedServerId: "rd",
      evidence: { rd: { threat: "terminal" } },
    });
    expect(
      visibleCorpIceDefenseProfile(input.playerView.servers[1]!.ice[0]),
    ).toMatchObject({ isVisibleIce: true, hasImmediateStop: true });

    resetResidentPlanPortfolioMemory();
    const firstCredit = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(firstCredit).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(firstCredit.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:corp.defend_servers:server-defense-portfolio",
        "plan_priority_class:P2",
        "plan_assessment_evidence:corp_terminal_central_rez_reserve_required:rd:rd-crystal-wall:gap_2",
      ]),
    );
    expect((firstCredit.evidence ?? []).join("\n")).not.toContain(
      "install-canis-new-remote",
    );

    const oneCreditShort = structuredClone(input);
    oneCreditShort.decisionId = "terminal-rd-reserve:2:corp";
    oneCreditShort.playerView.stateVersion = 2;
    oneCreditShort.playerView.own.credits = 3;
    oneCreditShort.playerView.own.clicks = 1;
    oneCreditShort.playerView.corpCentralAccessQuotes?.forEach(
      (quote) => (quote.stateVersion = 2),
    );
    oneCreditShort.playerView.servers[1]!.ice[0]!.effectiveRezCostQuote = {
      ...oneCreditShort.playerView.servers[1]!.ice[0]!.effectiveRezCostQuote!,
      expiresAtStateVersion: 2,
    };
    for (const action of oneCreditShort.legalActions) {
      action.expiresAtStateVersion = 2;
    }
    Object.assign(oneCreditShort, {
      planningStateIdentity: buildPlanningStateIdentity(oneCreditShort),
    });
    resetResidentPlanPortfolioMemory();
    expect(
      liveContext().chooseSemanticRuntimeAction(oneCreditShort, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("keeps a multi-turn terminal P4 score-funding child bound to its exact parent beside another executable P4 score parent", () => {
    const stateVersion = 1;
    const agendaDefinitionId = "onr_v1_189_artificial-security-directors";
    const installTerminal = legalAction(
      "install-terminal",
      "corp",
      "install_card",
      "Install terminal agenda",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-terminal",
        payload: {
          cardId: "agenda-terminal",
          sourceDefinitionId: agendaDefinitionId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const installP4 = legalAction(
      "install-p4",
      "corp",
      "install_card",
      "Install nonterminal agenda",
      { credits: 0, clicks: 1 },
      {
        source: "agenda-p4",
        payload: {
          cardId: "agenda-p4",
          sourceDefinitionId: agendaDefinitionId,
          serverId: "remote_2",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 10 } },
    );
    const installCampaign = legalAction(
      "install-campaign",
      "corp",
      "install_card",
      "Install economy campaign",
      { credits: 1, clicks: 1 },
      {
        source: "economy-campaign",
        payload: {
          cardId: "economy-campaign",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [
      installTerminal,
      installP4,
      installCampaign,
      credit,
    ]);
    for (const action of input.legalActions)
      action.expiresAtStateVersion = stateVersion;
    input.playerView.own.credits = 3;
    input.playerView.own.agendaPoints = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-terminal", "corp", "agenda", {
        definitionId: agendaDefinitionId,
        advancementRequirement: 3,
        agendaPoints: 2,
      }),
      visibleCard("agenda-p4", "corp", "agenda", {
        definitionId: agendaDefinitionId,
        advancementRequirement: 3,
        agendaPoints: 1,
      }),
      visibleCard("economy-campaign", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
      }),
    ];
    const quotedUnrezzedIce = (instanceId: string) =>
      visibleCard(instanceId, "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezzed: false,
        strength: 0,
        subtypes: ["wall"],
        effectiveRezCostQuote: {
          context: "installed" as const,
          cardId: instanceId,
          targetServerId: "remote_1",
          projectedServerId: "remote_1",
          expiresAtStateVersion: stateVersion,
          complete: true as const,
          costKind: "fixed" as const,
          baseCredits: 4,
          finalCredits: 4,
          mandatoryAdditionalCosts: { agendaPoints: 0 },
        },
      });
    const rezzedIce = (instanceId: string) =>
      visibleCard(instanceId, "corp", "ice", {
        definitionId: "onr_v1_237_data-wall",
        rezzed: true,
        strength: 0,
        subtypes: ["wall"],
      });
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        quotedUnrezzedIce("terminal-ice-1"),
        quotedUnrezzedIce("terminal-ice-2"),
      ]),
      server("remote_2", [rezzedIce("p4-ice-1"), rezzedIce("p4-ice-2")]),
    ];
    input.playerView.opponent.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        strength: 5,
        subtypes: ["icebreaker", "random"],
      }),
    ];

    resetResidentPlanPortfolioMemory();
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    const portfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));
    const scoreParentInstanceId =
      "plan:corp.score_agenda:agenda%3Aagenda-terminal%3Aremote_1";
    const fundingNeedId = "score-support:agenda:agenda-terminal:remote_1";
    const economyChildInstanceId =
      "plan:corp.economy:score-support%3Aagenda%3Aagenda-terminal%3Aremote_1";

    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.corp.economy",
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${scoreParentInstanceId}`,
        `plan_first_executor:${economyChildInstanceId}`,
        "plan_priority_class:P4",
        `plan_priority_delegated_from:${scoreParentInstanceId}`,
        `plan_priority_need:${fundingNeedId}`,
      ]),
    );
    expect(portfolio).toContain(
      `"rootForegroundInstanceId":"${scoreParentInstanceId}"`,
    );
    expect(portfolio).toContain(
      `"executorInstanceId":"${economyChildInstanceId}"`,
    );
    expect(portfolio).toContain(
      `"parentInstanceId":"${scoreParentInstanceId}"`,
    );
    expect(portfolio).toContain(`"parentNeedId":"${fundingNeedId}"`);
    expect(portfolio).toContain(`"openNeedIds":["${fundingNeedId}"]`);
    expect(portfolio).toContain('"delegatedPriorityClass":"P4"');
    expect(portfolio).not.toContain("economy-campaign:economy-campaign");
    expect(portfolio).toContain(
      '"evidenceCode":"corp_score_protection_funding_gap:remote_1:',
    );
  });

  it("rejects an unprotected finite-pool economy install whose bounded payback is exhausted by action costs", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-finite-pool-unprotected",
      "corp",
      "install_card",
      "Install finite-pool economy asset",
      { credits: 0, clicks: 1 },
      {
        source: "finite-pool-card",
        payload: {
          cardId: "finite-pool-card",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "better-immediate-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [install, credit]);
    input.playerView.own.credits = 8;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("finite-pool-card", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).not.toContain(
      "economy-campaign:finite-pool-card",
    );
  });

  it("keeps a finite-pool economy install productive behind a known non-contestable path", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-finite-pool-protected",
      "corp",
      "install_card",
      "Install protected finite-pool economy asset",
      { credits: 0, clicks: 1 },
      {
        source: "protected-finite-pool-card",
        payload: {
          cardId: "protected-finite-pool-card",
          sourceDefinitionId: "onr_v1_309_bbs-whispering-campaign",
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const credit = legalAction(
      "protected-alternative-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [install, credit]);
    input.playerView.own.credits = 8;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("protected-finite-pool-card", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
      }),
    ];
    input.playerView.opponent.credits = 10;
    input.playerView.opponent.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        quotedFixtureIce({
          instanceId: "protected-economy-wall",
          definitionId: "onr_v1_237_data-wall",
          title: "Data Wall",
          strength: 2,
          subtypes: ["wall"],
        }),
      ]),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    const portfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));
    expect(portfolio).toContain(
      '"protectionState":"protected_not_contestable"',
    );
    expect(portfolio).toContain('"projectedCredits":8');
    expect(portfolio).toContain('"projectedOpportunityCostCredits":5');
    expect(portfolio).toContain('"projectedNetCredits":3');
  });

  it("draws for score material when the score campaign has no agenda", () => {
    resetResidentPlanPortfolioMemory();
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [draw, credit]);
    input.playerView.own.credits = 10;
    input.playerView.own.stackOrRdCount = 12;
    input.playerView.own.gripOrHq = [
      visibleCard("operation-1", "corp", "operation", {
        definitionId: "onr_v1_295_night-shift",
      }),
      visibleCard("operation-2", "corp", "operation", {
        definitionId: "onr_v1_304_systematic-layoffs",
      }),
      visibleCard("asset-1", "corp", "asset", {
        definitionId: "onr_v1_309_bbs-whispering-campaign",
      }),
      visibleCard("upgrade-1", "corp", "upgrade", {
        definitionId: "onr_v1_352_chester-mix",
      }),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "generic-score-material-parent-deck",
        side: "corp",
        cards: [{ cardId: "onr_v1_220_tycho-extension", quantity: 3 }],
      },
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "draw",
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_first_root:plan:corp.score_agenda:general",
        "plan_first_executor:plan:corp.hand_and_agenda_management:draw-for-score-material",
        "plan_priority_class:P4",
        "plan_priority_delegated_from:plan:corp.score_agenda:general",
        "plan_priority_need:score-material:general",
      ]),
    );
  });

  it("converts a same-class HQ operation before drawing, then revalidates the answer search", () => {
    resetResidentPlanPortfolioMemory();
    const accountsCard = visibleCard("accounts-card", "corp", "operation", {
      definitionId: "onr_v1_281_accounts-receivable",
    });
    const accounts = legalAction(
      "accounts",
      "corp",
      "play_operation",
      "Play Accounts Receivable",
      { credits: 5, clicks: 1 },
      {
        source: accountsCard.instanceId,
        payload: {
          cardId: accountsCard.instanceId,
          gainCreditsAmount: 9,
        },
      },
    );
    const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
      credits: 0,
      clicks: 1,
    });
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [accounts, draw, credit]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 5;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      accountsCard,
      ...Array.from({ length: 3 }, (_, index) =>
        visibleCard(`neutral-${index}`, "corp", "operation", {
          definitionId: "onr_v1_284_chance-observation",
        }),
      ),
    ];
    Object.assign(input, {
      ownDeckSnapshot: {
        deckSnapshotId: "convert-before-score-material-draw",
        side: "corp",
        cards: [{ cardId: "onr_v1_220_tycho-extension", quantity: 3 }],
      },
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;
    const context = liveContext();

    const conversion = context.chooseSemanticRuntimeAction(input, {});
    expect(conversion).toMatchObject({
      actionId: accounts.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      conversion.decisionDebug?.detailSections
        ?.find((section) => section.id === "corp_draw_arbitration")
        ?.items.join("|"),
    ).toContain(
      "action:draw|purpose:score_material_search|priority:P4|attempts:1|net_hand:1|projected_overflow:0|capacity_release:accounts|disposition:defer_for_capacity_release",
    );

    const afterConversion = structuredClone(input);
    afterConversion.playerView.stateVersion = 2;
    afterConversion.playerView.own.clicks = 1;
    afterConversion.playerView.own.credits = 9;
    afterConversion.playerView.own.gripOrHq =
      afterConversion.playerView.own.gripOrHq.filter(
        (card) => card.instanceId !== accountsCard.instanceId,
      );
    afterConversion.legalActions = [
      structuredClone(draw),
      structuredClone(credit),
    ];
    for (const action of afterConversion.legalActions) {
      action.expiresAtStateVersion = afterConversion.playerView.stateVersion;
    }
    afterConversion.playerView.legalActions = afterConversion.legalActions;

    const revalidatedDraw = context.chooseSemanticRuntimeAction(
      afterConversion,
      {},
    );
    expect(revalidatedDraw).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(
      revalidatedDraw.decisionDebug?.detailSections
        ?.find((section) => section.id === "corp_draw_arbitration")
        ?.items.join("|"),
    ).toContain(
      "action:draw|purpose:score_material_search|priority:P4|attempts:1|net_hand:1|projected_overflow:0|capacity_release:none|disposition:admitted",
    );
  });

  it("does not invent a generic card-development root without an exact parent need", () => {
    resetResidentPlanPortfolioMemory();
    const pacifica = visibleCard("pacifica", "corp", "asset", {
      definitionId: "onr_v1_334_pacifica-regional-ai",
      title: "Pacifica Regional AI",
    });
    const installNewRemote = legalAction(
      "install-pacifica-new-remote",
      "corp",
      "install_card",
      "Install Pacifica Regional AI in a new remote",
      { credits: 0, clicks: 1 },
      {
        source: pacifica.instanceId,
        payload: {
          cardId: pacifica.instanceId,
          serverId: "new_remote",
          placement: "root",
        },
      },
    );
    const installExistingRemote = legalAction(
      "install-pacifica-remote-1",
      "corp",
      "install_card",
      "Install Pacifica Regional AI in remote 1",
      { credits: 0, clicks: 1 },
      {
        source: pacifica.instanceId,
        payload: {
          cardId: pacifica.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [installNewRemote, installExistingRemote]);
    input.playerView.own.gripOrHq = [pacifica];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
    ];

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "corp.hand_and_agenda_management" &&
          instance.dedupeKey.startsWith("develop:"),
      ) ?? false,
    ).toBe(false);
  });

  it("binds score-acceleration setup to the exact blocked score parent and need", () => {
    resetResidentPlanPortfolioMemory();
    const agenda = visibleCard("agenda", "corp", "agenda", {
      definitionId: "onr_v1_201_executive-extraction",
      title: "Executive Extraction",
    });
    const chicago = visibleCard("chicago", "corp", "asset", {
      definitionId: "onr_v1_312_chicago-branch",
      title: "Chicago Branch",
    });
    const installAgenda = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install Executive Extraction in remote 1",
      { credits: 0, clicks: 1 },
      {
        source: agenda.instanceId,
        payload: {
          cardId: agenda.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const installChicago = legalAction(
      "install-chicago",
      "corp",
      "install_card",
      "Install Chicago Branch in remote 2",
      { credits: 3, clicks: 1 },
      {
        source: chicago.instanceId,
        payload: {
          cardId: chicago.instanceId,
          serverId: "remote_2",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [installAgenda, installChicago]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [agenda, chicago];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1"),
      server("remote_2"),
    ];
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }
    input.playerView.legalActions = input.legalActions;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    const parentInstanceId =
      "plan:corp.score_agenda:agenda%3Aagenda%3Aremote_1";
    const parentNeedId = "score-setup:agenda:agenda:remote_1:chicago";

    expect(decision).toMatchObject({
      actionId: installChicago.actionId,
      reasonCode: "plan_first.corp.hand_and_agenda_management",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        `plan_first_root:${parentInstanceId}`,
        "plan_first_executor:plan:corp.hand_and_agenda_management:score-setup%3Aagenda%3Aagenda%3Aremote_1%3Achicago",
        "plan_priority_class:P4",
        `plan_priority_delegated_from:${parentInstanceId}`,
        `plan_priority_need:${parentNeedId}`,
        "plan_assessment_evidence:corp_score_acceleration_campaign_setup:onr_v1_312_chicago-branch:agenda:agenda:remote_1",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.instanceId === parentInstanceId,
      ),
    ).toMatchObject({
      openNeedIds: [parentNeedId],
      viability: "ready",
    });
  });

  it.each([
    ["missing definition", "missing_card_definition", false],
    ["missing projected type", "invalid_player_view_card_projection", true],
  ] as const)(
    "fails closed for a known own card with %s",
    (_label, expectedCode, removeType) => {
      resetResidentPlanPortfolioMemory();
      const draw = legalAction("draw", "corp", "draw_card", "Draw a card", {
        credits: 0,
        clicks: 1,
      });
      const input = aiInput("corp", [draw]);
      const card = visibleCard("invalid-card", "corp", "operation", {
        definitionId: removeType
          ? "onr_v1_295_night-shift"
          : "missing-definition",
      });
      if (removeType) delete card.type;
      input.playerView.own.gripOrHq = [card];

      expect(() =>
        liveContext().chooseSemanticRuntimeAction(input, {}),
      ).toThrowError(expectedCode);
    },
  );

  it("fails closed when a projected agenda value is not finite", () => {
    resetResidentPlanPortfolioMemory();
    const agenda = visibleCard("agenda-with-wrong-points", "corp", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      agendaPoints: Number.NaN,
    });
    const install = legalAction(
      "install-agenda",
      "corp",
      "install_card",
      "Install agenda",
      { credits: 0, clicks: 1 },
      {
        source: agenda.instanceId,
        payload: { serverId: "new_remote", placement: "root" },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.gripOrHq = [agenda];

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("invalid_player_view_card_projection");
  });

  it("fails closed when a legal score action omits its agenda target", () => {
    resetResidentPlanPortfolioMemory();
    const input = aiInput("corp", [
      legalAction("score-without-target", "corp", "score_agenda", "Score", {
        credits: 0,
      }),
    ]);

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_action_semantics");
  });

  it("routes a sole zero-click EndTurn through the explicit completion plan", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      {
        credits: 0,
        clicks: 0,
      },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 1;
    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.runner.complete_turn",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain("plan_priority_reason:turn_completion");
    expect(decision.evidence).toContain("plan_within_class_value:-10000");
  });

  it("keeps a finite basic-credit economy action productive when no parent-bound development route exists", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [credit, end]);
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 4;
    input.playerView.opponent.deckCount = 10;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("retains Loan from Chiba instead of treating its card EndTurn as standard completion", () => {
    resetResidentPlanPortfolioMemory();
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "unpayable",
        },
      },
    );
    const input = aiInput("runner", [loanEnd, standardEnd]);
    input.playerView.own.clicks = 0;
    input.playerView.own.credits = 9;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: standardEnd.actionId,
      reasonCode: "plan_first.runner.complete_turn",
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:runner_resource_leave_unpayable_without_action_capacity",
    );
  });

  it("funds an exact unpayable Loan lifecycle parent through a guaranteed same-turn route", () => {
    resetResidentPlanPortfolioMemory();
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "unpayable",
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [loanEnd, credit, standardEnd]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 9;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
        planFirstDecision: {
          priority: {
            effectiveClass: "P5",
            reasonCode: "development_need",
            parentNeedId: "resource-lifecycle-support:loan-1",
          },
          selectedPlan: {
            parentInstanceId:
              "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1",
            parentNeedId: "resource-lifecycle-support:loan-1",
          },
          route: { actionId: credit.actionId },
        },
      },
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_first_executor:plan:runner.economy:resource-lifecycle-support%3Aloan-1",
    );
    expect(decision.evidence).toContain("plan_priority_class:P5");
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId:
        "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1",
      executorInstanceId:
        "plan:runner.economy:resource-lifecycle-support%3Aloan-1",
      instances: expect.arrayContaining([
        expect.objectContaining({
          instanceId:
            "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1",
          openNeedIds: ["resource-lifecycle-support:loan-1"],
        }),
        expect.objectContaining({
          instanceId: "plan:runner.economy:resource-lifecycle-support%3Aloan-1",
          parentInstanceId:
            "plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1",
          parentNeedId: "resource-lifecycle-support:loan-1",
        }),
      ]),
    });
  });

  it("requires a full exact Loan funding route instead of shortening the lifecycle gap", () => {
    resetResidentPlanPortfolioMemory();
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "unpayable",
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [loanEnd, credit, standardEnd]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 8;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe(credit.actionId);
    expect(decision.reasonCode).toBe("plan_first.runner.economy");
    expect((decision.evidence ?? []).join("\n")).not.toContain(
      "resource-lifecycle-support:loan-1",
    );
    expect(decision.evidence).toContain(
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_resource_exact_funding_route_unavailable",
    );
  });

  it("does not create lifecycle funding or leave play without an exact payment quote", () => {
    resetResidentPlanPortfolioMemory();
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          cardImplementationLifecycleAction: "end_of_runner_turn",
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [loanEnd, credit, standardEnd]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 9;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe(credit.actionId);
    expect(decision.reasonCode).toBe("plan_first.runner.economy");
    expect(decision.actionId).not.toBe(loanEnd.actionId);
    expect((decision.evidence ?? []).join("\n")).not.toContain(
      "resource-lifecycle-support:loan-1",
    );
    expect(decision.evidence).toContain(
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_resource_leave_payment_quote_unknown",
    );
  });

  it("uses Loan from Chiba's card EndTurn only as a profitable lifecycle step after clicks are spent", () => {
    resetResidentPlanPortfolioMemory();
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "payable",
        },
      },
    );
    const input = aiInput("runner", [loanEnd, standardEnd]);
    input.playerView.own.clicks = 0;
    input.playerView.own.credits = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: loanEnd.actionId,
      reasonCode: "plan_first.runner.resource_lifecycle",
      decisionDebug: { planKind: "runner.resource_lifecycle" },
    });
  });

  it("keeps an unquoted voluntary resource self-trash fail-closed inside resource lifecycle while another exact route acts", () => {
    resetResidentPlanPortfolioMemory();
    const selfTrash = legalAction(
      "runner.crash-space.self-trash",
      "runner",
      "activated_card_ability",
      "Trash installed resource",
      { credits: 0, clicks: 1 },
      {
        source: "resource-1",
        payload: {
          cardId: "resource-1",
          sourceDefinitionId: "runner_test_resource",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "trash_source_action",
          cardImplementationAbilityId:
            "runner_test_resource:trash_source_action",
          cardImplementationAbilityTiming: "runner_main",
          cardImplementationTrashesSource: true,
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [selfTrash, credit, standardEnd]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 3;
    input.playerView.opponent.deckCount = 23;
    input.playerView.own.rig = [
      visibleCard("resource-1", "runner", "resource", {
        definitionId: "runner_test_resource",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === selfTrash.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        "assessment_unknown:runner.resource_lifecycle:runner_resource_self_trash_assessment_unknown:trash_source_action",
      ]),
    });
  });

  it("retains a payable Loan while spending its remaining productive click", () => {
    resetResidentPlanPortfolioMemory();
    const loanEnd = legalAction(
      "runner.loan.end_turn",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "payable",
        },
      },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [loanEnd, credit, standardEnd]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe(credit.actionId);
    expect(decision.reasonCode).toBe("plan_first.runner.economy");
    expect(decision.actionId).not.toBe(loanEnd.actionId);
    expect(decision.evidence).toContain(
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_resource_leave_deferred_until_capacity_spent",
    );
  });

  it("keeps two profitable Loan from Chiba EndTurns covered by separate lifecycle plans", () => {
    resetResidentPlanPortfolioMemory();
    const standardEnd = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const firstLoanEnd = legalAction(
      "runner.loan-1.end_turn",
      "runner",
      "end_turn",
      "Trash first Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-1",
        payload: {
          cardId: "loan-1",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "payable",
        },
      },
    );
    const secondLoanEnd = legalAction(
      "runner.loan-2.end_turn",
      "runner",
      "end_turn",
      "Trash second Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      {
        source: "loan-2",
        payload: {
          cardId: "loan-2",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_168_loan-from-chiba:trash_at_end_of_turn",
          cardImplementationAbilityKey: "trash_at_end_of_turn",
          cardImplementationLifecycleAction: "end_of_runner_turn",
          cardImplementationLifecycleLeavePlayPaymentAmount: 10,
          cardImplementationLifecycleLeavePlayPaymentStatus: "payable",
        },
      },
    );
    const input = aiInput("runner", [firstLoanEnd, secondLoanEnd, standardEnd]);
    input.playerView.own.clicks = 0;
    input.playerView.own.credits = 20;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
      visibleCard("loan-2", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect([firstLoanEnd.actionId, secondLoanEnd.actionId]).toContain(
      decision.actionId,
    );
    expect(decision).toMatchObject({
      reasonCode: "plan_first.runner.resource_lifecycle",
      decisionDebug: { planKind: "runner.resource_lifecycle" },
    });
  });

  it("reconciles older resident memory before completing an exhausted turn", () => {
    resetResidentPlanPortfolioMemory();
    const context = liveContext();
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const first = aiInput("runner", [credit]);
    first.playerView.own.credits = 0;
    context.chooseSemanticRuntimeAction(first, {});

    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      {
        credits: 1,
        clicks: 0,
      },
      { source: "game_rule" },
    );
    const later = aiInput("runner", [end]);
    later.decisionId = first.decisionId;
    later.playerView.stateVersion = first.playerView.stateVersion + 10;
    later.playerView.own.clicks = 0;
    later.playerView.opponent.deckCount = 1;

    expect(
      context.chooseSemanticRuntimeAction(later, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.runner.complete_turn",
      fallbackUsed: false,
    });
  });

  it("fails closed when only EndTurn remains despite unused clicks", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      {
        credits: 0,
        clicks: 0,
      },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.clicks = 3;
    input.playerView.opponent.deckCount = 1;

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("selects the standard turn completion instead of an unsafe card-scoped EndTurn", () => {
    resetResidentPlanPortfolioMemory();
    const unsafeCardEndTurn = legalAction(
      "runner.end_turn.loan",
      "runner",
      "end_turn",
      "Trash Loan from Chiba and end turn",
      { credits: 0, clicks: 0 },
      { source: "loan-1", payload: { cardId: "loan-1" } },
    );
    const standardEndTurn = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [unsafeCardEndTurn, standardEndTurn]);
    input.playerView.own.clicks = 0;
    input.playerView.own.credits = 0;
    input.playerView.opponent.deckCount = 1;
    input.playerView.own.rig = [
      visibleCard("loan-1", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "runner.end_turn",
      reasonCode: "plan_first.runner.complete_turn",
      fallbackUsed: false,
    });
  });

  it("does not select EndTurn while a productive LegalAction remains", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [end, credit]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 0;
    input.playerView.opponent.deckCount = 10;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("uses finite P6 reserve and converts otherwise unused current-turn capacity into exact basic liquidity", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [end, credit]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 2;
    input.playerView.opponent.deckCount = 10;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
        planFirstDecision: {
          priority: {
            effectiveClass: "P6",
            p6Contract: "bounded_plan_contract",
          },
          route: { actionId: credit.actionId },
        },
      },
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:runner_finite_portfolio_credit_reserve",
    );
    expect(decision.evidence).toContain("plan_priority_class:P6");

    resetResidentPlanPortfolioMemory();
    const reserveSatisfied = aiInput("runner", [end, credit]);
    reserveSatisfied.playerView.own.clicks = 3;
    reserveSatisfied.playerView.own.credits = 20;
    reserveSatisfied.playerView.opponent.deckCount = 10;
    const remainingCapacity = liveContext().chooseSemanticRuntimeAction(
      reserveSatisfied,
      {},
    );
    expect(remainingCapacity).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          priority: {
            effectiveClass: "P6",
            p6Contract: "bounded_plan_contract",
          },
          route: { actionId: credit.actionId },
        },
      },
    });
    expect(remainingCapacity.evidence ?? []).toContain(
      "plan_assessment_evidence:runner_engine_certified_remaining_capacity_liquidity",
    );
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(reserveSatisfied)),
    ).toContain('"kind":"develop_liquidity"');
  });

  it("opens one bounded option-development draw after a saturated all-liquidity Runner turn", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end-liquidity-saturation",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit-liquidity-saturation",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction(
      "draw-liquidity-saturation",
      "runner",
      "draw_card",
      "Draw 1 card",
      { credits: 0, clicks: 1 },
      { source: "basic_action" },
    );
    const context = liveContext({
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 5,
        fundingNeed: false,
        evidence: ["test_reserve_satisfied"],
      }),
    });
    const input = aiInput("runner", [end, credit, draw]);
    input.playerView.turnSerial = 12;
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 20;
    input.playerView.own.stackOrRdCount = 30;
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`saturated-grip-${index}`, "runner", "event"),
    );
    input.playerView.opponent.deckCount = 20;
    input.eventTail = Array.from({ length: 4 }, (_, index) => ({
      eventId: `previous-liquidity-${index}`,
      type: "gain_credit",
      stateVersionBefore: index,
      stateVersionAfter: index + 1,
      turnSerial: 10,
      stateHashAfter: `fnv1a:previous-liquidity-${index}`,
      visibilityClass: "private_to_side" as const,
      publicPayload: { actor: "runner" as const, actionType: "gain_credit" },
    }));

    const developmentDecision = context.chooseSemanticRuntimeAction(input, {});
    expect(developmentDecision).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
        planFirstDecision: {
          priority: { effectiveClass: "P5" },
          route: { actionId: draw.actionId },
        },
      },
    });
    expect(developmentDecision.evidence).toContain("plan_priority_class:P5");
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
      "runner_repeated_liquidity_saturation_opens_option_development",
    );

    input.playerView.stateVersion += 1;
    input.playerView.own.clicks = 3;
    input.playerView.own.stackOrRdCount = 29;
    input.eventTail.push({
      eventId: "current-turn-option-draw",
      type: "draw_card",
      stateVersionBefore: input.playerView.stateVersion - 1,
      stateVersionAfter: input.playerView.stateVersion,
      turnSerial: 12,
      stateHashAfter: "fnv1a:current-turn-option-draw",
      visibilityClass: "private_to_side",
      publicPayload: { actor: "runner", actionType: "draw_card" },
    });
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.economy" },
    });

    for (let index = 0; index < 3; index += 1) {
      input.eventTail.push({
        eventId: `current-turn-liquidity-${index}`,
        type: "gain_credit",
        stateVersionBefore: input.playerView.stateVersion + index,
        stateVersionAfter: input.playerView.stateVersion + index + 1,
        turnSerial: 12,
        stateHashAfter: `fnv1a:current-turn-liquidity-${index}`,
        visibilityClass: "private_to_side",
        publicPayload: { actor: "runner", actionType: "gain_credit" },
      });
    }
    input.playerView.stateVersion += 3;
    input.playerView.turnSerial = 14;
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 23;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
        planFirstDecision: { route: { actionId: draw.actionId } },
      },
    });
  });

  it("does not call a mixed previous Runner turn liquidity saturation", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end-mixed-liquidity-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit-mixed-liquidity-turn",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction(
      "draw-mixed-liquidity-turn",
      "runner",
      "draw_card",
      "Draw 1 card",
      { credits: 0, clicks: 1 },
      { source: "basic_action" },
    );
    const input = aiInput("runner", [end, credit, draw]);
    input.playerView.turnSerial = 12;
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 20;
    input.playerView.own.stackOrRdCount = 30;
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`mixed-grip-${index}`, "runner", "event"),
    );
    input.playerView.opponent.deckCount = 20;
    input.eventTail = [
      ...Array.from({ length: 3 }, (_, index) => ({
        eventId: `mixed-liquidity-${index}`,
        type: "gain_credit",
        stateVersionBefore: index,
        stateVersionAfter: index + 1,
        turnSerial: 10,
        stateHashAfter: `fnv1a:mixed-liquidity-${index}`,
        visibilityClass: "private_to_side" as const,
        publicPayload: { actor: "runner" as const, actionType: "gain_credit" },
      })),
      {
        eventId: "mixed-liquidity-install",
        type: "install_card",
        stateVersionBefore: 3,
        stateVersionAfter: 4,
        turnSerial: 10,
        stateHashAfter: "fnv1a:mixed-liquidity-install",
        visibilityClass: "public" as const,
        publicPayload: {
          actor: "runner" as const,
          actionType: "install_card",
        },
      },
    ];

    expect(
      liveContext({
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 5,
          fundingNeed: false,
          evidence: ["test_reserve_satisfied"],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("keeps the finite turn-liquidity target stable through all remaining normal clicks", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const context = liveContext({
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 5,
        desiredCreditReserve: 12,
        creditReservePolicy: {
          phase: "midgame",
          contestReserve: 0,
        },
        fundingNeed: true,
        evidence: ["test_midgame_reserve"],
      }),
    });
    const input = aiInput("runner", [end, credit]);
    input.playerView.turnSerial = 12;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 14;
    input.playerView.opponent.deckCount = 10;

    for (const [offset, credits, clicks] of [
      [0, 14, 3],
      [1, 15, 2],
      [2, 16, 1],
    ] as const) {
      input.playerView.stateVersion += offset === 0 ? 0 : 1;
      input.playerView.own.credits = credits;
      input.playerView.own.clicks = clicks;
      for (const action of input.legalActions) {
        action.expiresAtStateVersion = input.playerView.stateVersion;
      }
      const decision = context.chooseSemanticRuntimeAction(input, {});
      expect(decision).toMatchObject({
        actionId: credit.actionId,
        reasonCode: "plan_first.runner.economy",
        fallbackUsed: false,
      });
      expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
        '"targetCredits":17',
      );
    }
  });

  it("rebases completed turn liquidity after external credits leave normal clicks", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end-external-liquidity",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit-external-liquidity",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const context = liveContext();
    const input = aiInput("runner", [end, credit]);
    input.playerView.turnSerial = 13;
    input.playerView.own.stackOrRdCount = 30;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 14;
    input.playerView.opponent.deckCount = 10;

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
      '"targetCredits":17',
    );

    input.playerView.stateVersion += 1;
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 20;
    for (const action of input.legalActions) {
      action.expiresAtStateVersion = input.playerView.stateVersion;
    }

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
    expect(JSON.stringify(residentPlanPortfolioSnapshot(input))).toContain(
      '"targetCredits":22',
    );
  });

  it("ends the turn when every remaining install route is explicitly rejected", () => {
    resetResidentPlanPortfolioMemory();
    const cardInstanceId = "deferred-program";
    const directInstall = legalAction(
      "install-direct",
      "runner",
      "install_card",
      "Install deferred program",
      { credits: 0, clicks: 1 },
      { source: cardInstanceId, payload: { cardId: cardInstanceId } },
    );
    const replacementInstall = legalAction(
      "install-with-replacement",
      "runner",
      "install_card",
      "Install deferred program after trashing a program",
      { credits: 0, clicks: 1 },
      {
        source: cardInstanceId,
        payload: {
          cardId: cardInstanceId,
          trashBeforeInstall: "installed-program",
        },
      },
    );
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [directInstall, replacementInstall, end]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 12;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard(cardInstanceId, "runner", "program", {
        definitionId: "deferred-program-definition",
      }),
    ];
    const deferred = handEvaluation({
      cardInstanceId,
      definitionId: "deferred-program-definition",
      legalActionId: directInstall.actionId,
      priority: 500,
      deferReason: "preserve_credit_floor",
      duplicateRole: "none",
      finalInstallFit: -500,
    });

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => [deferred],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
    });
  });

  it("uses its finite economy plan instead of generic option development when hand capacity is full", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
      clicks: 1,
    });
    const input = aiInput("runner", [end, credit, draw]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 4;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
      visibleCard("grip-4", "runner", "event"),
      visibleCard("grip-5", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;

    const context = liveContext();
    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("binds productive non-run development to an unrealized recurring-economy horizon", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
      clicks: 1,
    });
    const input = aiInput("runner", [end, credit, draw]);
    input.playerView.own.credits = 0;
    input.playerView.own.stackOrRdCount = 20;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = Array.from({ length: 6 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );
    input.playerView.own.rig = [
      visibleCard("conference", "runner", "resource", {
        definitionId: "onr_v1_184_top-runners-conference",
        title: "Top Runners' Conference",
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.recurring_economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.recurring_economy",
      },
    });
  });

  it("lets a valuable visible run preempt the resident investment after its first payout", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd-after-payout",
      "runner",
      "start_run",
      "Run R&D after payout",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit-after-payout",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    const conference = visibleCard("conference", "runner", "resource", {
      definitionId: "onr_v1_184_top-runners-conference",
      title: "Top Runners' Conference",
    });
    input.playerView.own.rig = [conference];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      {
        eventId: "conference-first-payout",
        type: "automatic_effects_resolved",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:conference-first-payout",
        visibilityClass: "public",
        publicPayload: {
          resolvedEffects: [
            {
              effectId: "conference-first-payout-effect",
              kind: "gain_credits",
              visibility: "public",
              amount: 2,
              reason: "start_of_turn",
              sourceDefinitionId: "onr_v1_184_top-runners-conference",
            },
          ],
        },
      },
    ];
    const valuableRun = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      recommendation: "run_now" as const,
      pathPassability: "reachable" as const,
      score: 450,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [valuableRun],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.pressure_central" },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.recurring_economy",
      ),
    ).toMatchObject({
      viability: "blocked",
      moduleState: {
        signal: {
          investmentHorizon: {
            realizedPayoutCount: 1,
            futureValueAtRisk: 2,
            bestVisibleRunPayoff: 450,
            decision: "allow_run",
          },
        },
      },
    });
  });

  it("returns execution to the existing run owner after the recurring investment horizon is recouped", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-hq-after-amortization",
      "runner",
      "start_run",
      "Run HQ after amortization",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit-after-amortization",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.rig = [
      visibleCard("conference", "runner", "resource", {
        definitionId: "onr_v1_184_top-runners-conference",
        title: "Top Runners' Conference",
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      {
        eventId: "conference-amortized",
        type: "automatic_effects_resolved",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:conference-amortized",
        visibilityClass: "public",
        publicPayload: {
          resolvedEffects: [1, 2].map((payout) => ({
            effectId: `conference-payout-${payout}`,
            kind: "gain_credits",
            visibility: "public" as const,
            amount: 2,
            reason: "start_of_turn",
            sourceDefinitionId: "onr_v1_184_top-runners-conference",
          })),
        },
      },
    ];
    const readyRun = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      recommendation: "run_now" as const,
      pathPassability: "reachable" as const,
      score: 180,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [readyRun],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.pressure_central" },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.recurring_economy",
      ),
    ).toMatchObject({
      viability: "blocked",
      moduleState: {
        signal: {
          investmentHorizon: {
            realizedValue: 4,
            decision: "allow_run",
          },
        },
      },
    });
  });

  it("does not invent recurring-economy ownership for a forged activated gain on an automatic turn-start source", () => {
    resetResidentPlanPortfolioMemory();
    const conference = visibleCard("conference", "runner", "resource", {
      definitionId: "onr_v1_184_top-runners-conference",
      title: "Top Runners' Conference",
    });
    const ownEconomyAction = legalAction(
      "conference-economy",
      "runner",
      "trigger_ability",
      "Use Conference economy",
      { credits: 0, clicks: 1 },
      {
        source: conference.instanceId,
        payload: {
          gainCreditsAmount: 2,
          cardImplementationAbilityLimit: "once_per_turn_per_source",
        },
      },
    );
    const basicCredit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [ownEconomyAction, basicCredit]);
    input.playerView.own.credits = 0;
    input.playerView.own.rig = [conference];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: ownEconomyAction.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
  });

  it("uses a P6 pressure plan when restricted action capacity permits only runs", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      {
        credits: 0,
        clicks: 1,
      },
      {
        payload: { serverId: "rd" },
      },
    );
    const input = aiInput("runner", [end, run]);
    input.playerView.own.clicks = 1;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [safeRuntimeRunTarget("run-rd", "rd")],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "run-rd",
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.pressure_central" },
    });
  });

  it("uses only the best admissible target for restricted run capacity", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const runRemote = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [end, runRemote, runRd]);
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;
    const rd = safeRuntimeRunTarget("run-rd", "rd");
    const blockedRemote = {
      ...safeRuntimeRunTarget("run-remote", "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
      score: -320,
      knownAccessState: "known_no_current_payoff",
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [blockedRemote, rd],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "run-rd",
      reasonCode: "plan_first.runner.pressure_central",
    });
  });

  it("does not materialize restricted Archives run capacity against rules-proven empty Archives", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const runArchives = legalAction(
      "run-archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "archives" } },
    );
    const input = aiInput("runner", [end, runArchives]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 10;
    input.playerView.opponent.discardCount = 0;
    const stalePositiveProjection = {
      ...safeRuntimeRunTarget(runArchives.actionId, "archives"),
      knownAccessState: "fresh" as const,
      recommendation: "run_now" as const,
      score: 120,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [stalePositiveProjection],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "runner.end_turn",
      reasonCode: "plan_first.runner.complete_turn",
      fallbackUsed: false,
    });
  });

  it("keeps an Engine-restricted multi-run sequence run-window-owned after ordinary central cadence was consumed", () => {
    resetResidentPlanPortfolioMemory();
    const runRd = legalAction(
      "runner.start_run.rd.bonus_run.multi-run-event",
      "runner",
      "start_run",
      "Continue sequence run on R&D",
      { credits: 0, clicks: 0 },
      {
        source: "game_rule",
        payload: {
          serverId: "rd",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const input = aiInput("runner", [runRd]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 10;
    input.playerView.opponent.discardCount = 0;
    input.playerView.turnSerial = 11;
    input.playerView.publicEvents = [
      {
        eventId: "ordinary-rd-run",
        type: "start_run",
        stateVersionBefore: 8,
        stateVersionAfter: 9,
        turnSerial: 11,
        stateHashAfter: "fnv1a:ordinary-rd-run",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        },
      },
      {
        eventId: "ordinary-rd-access",
        type: "access_card",
        stateVersionBefore: 9,
        stateVersionAfter: 10,
        turnSerial: 11,
        stateHashAfter: "fnv1a:ordinary-rd-access",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
          serverId: "rd",
        },
      },
    ];
    input.eventTail = input.playerView.publicEvents;
    const noStandalonePayoff = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: -420,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [noStandalonePayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: runRd.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
      },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.convert_run_window",
      ),
    ).toMatchObject({
      parentInstanceId: "rules.restricted_action_sequence",
      moduleState: {
        signal: {
          purposeCode: "continue_engine_restricted_run_sequence",
          evidenceCode: "runner_engine_restricted_run_sequence_continuation",
          actionAssessments: {
            [runRd.actionId]: {
              admissible: true,
            },
          },
        },
      },
    });
  });

  it("keeps an Engine-restricted run-window action exclusively owned when its remote is not independently productive", () => {
    resetResidentPlanPortfolioMemory();
    const runRemote = legalAction(
      "runner.start_run.remote_1.bonus_run.engine-grant",
      "runner",
      "start_run",
      "Continue the Engine-granted run on Remote 1",
      { credits: 0, clicks: 0 },
      {
        payload: {
          serverId: "remote_1",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const input = aiInput("runner", [runRemote]);
    input.playerView.own.clicks = 0;
    const noStandaloneRemotePayoff = {
      ...safeRuntimeRunTarget(runRemote.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "gain_credits_first" as const,
      score: -420,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [noStandaloneRemotePayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: runRemote.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
      },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.convert_run_window",
      ),
    ).toMatchObject({
      parentInstanceId: "rules.restricted_action_sequence",
      moduleState: {
        signal: {
          purposeCode: "continue_engine_restricted_run_sequence",
          actionAssessments: {
            [runRemote.actionId]: {
              admissible: true,
            },
          },
        },
      },
    });
  });

  it("keeps an optional restricted run with its run-window owner but rejects it when the exact route needs a damage buffer", () => {
    resetResidentPlanPortfolioMemory();
    const runRemote = legalAction(
      "runner.start_run.remote_3.wilson-grant",
      "runner",
      "start_run",
      "Wilson run on Remote 3",
      { credits: 0, clicks: 0 },
      {
        payload: {
          serverId: "remote_3",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const draw = legalAction(
      "runner.draw_card",
      "runner",
      "draw_card",
      "Draw card",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [runRemote, draw]);
    const unsafeRoute = {
      ...safeRuntimeRunTarget(runRemote.actionId, "remote_3"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      accessPayoff: "agenda" as const,
      accessPayoffContestable: false,
      knownAccessState: "known_payoff" as const,
      pathPassability: "blocked_unbreakable" as const,
      recommendation: "draw_for_damage_buffer" as const,
      score: -520,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [unsafeRoute],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: draw.actionId,
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.convert_run_window",
      ),
    ).toMatchObject({
      parentInstanceId: "rules.restricted_action_sequence",
      moduleState: {
        signal: {
          purposeCode: "continue_engine_restricted_run_sequence",
          actionAssessments: {
            [runRemote.actionId]: {
              admissible: false,
            },
          },
        },
      },
    });
  });

  it("declines a Bodyweight successful-run bonus through the existing run-window owner when every offered route is blocked", () => {
    resetResidentPlanPortfolioMemory();
    const bonusRuns = ["hq", "rd", "archives"].map((serverId) =>
      legalAction(
        `runner.start_run.${serverId}.bonus_run.onr_v1_123_bodyweight-data-creche`,
        "runner",
        "start_run",
        `Bodyweight run on ${serverId}`,
        { credits: 0, clicks: 0 },
        {
          payload: {
            serverId,
            bonusRunNoClick: true,
            bonusRunSource: "onr_v1_123_bodyweight-data-creche",
            restrictedActionGrantActionType: "start_run",
            restrictedActionGrantCostProfile: "no_click",
            restrictedActionGrantRemainingActions: 1,
          },
        },
      ),
    );
    const decline = legalAction(
      "runner.trigger_ability.bodyweight.decline_successful_run_extra_run",
      "runner",
      "trigger_ability",
      "Decline Bodyweight bonus run",
      { credits: 0, clicks: 0 },
      {
        source: "bodyweight",
        payload: {
          runnerAbility: "decline_successful_run_extra_run",
          successfulRunExtraRunDecision: "decline",
        },
      },
    );
    const input = aiInput("runner", [...bonusRuns, decline]);
    input.playerView.own.clicks = 0;
    const blockedTargets = bonusRuns.map((run) => ({
      ...safeRuntimeRunTarget(
        run.actionId,
        String(run.payload?.serverId ?? "archives"),
      ),
      pathPassability: "blocked_unpayable" as const,
      recommendation: "gain_credits_first" as const,
      score: -420,
    }));

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => blockedTargets,
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: decline.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
      },
    });
  });

  it("keeps an executable successful-run bonus inside the run-window owner", () => {
    resetResidentPlanPortfolioMemory();
    const bonusRunHq = legalAction(
      "bodyweight-bonus-hq",
      "runner",
      "start_run",
      "Bonus-Run auf HQ",
      { credits: 0, clicks: 0 },
      {
        source: "basic_action",
        payload: {
          serverId: "hq",
          bonusRunNoClick: true,
          bonusRunSource: "onr_v1_123_bodyweight-data-creche",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const bonusRunRd = legalAction(
      "bodyweight-bonus-rd",
      "runner",
      "start_run",
      "Bonus-Run auf R&D",
      { credits: 0, clicks: 0 },
      {
        source: "basic_action",
        payload: {
          serverId: "rd",
          bonusRunNoClick: true,
          bonusRunSource: "onr_v1_123_bodyweight-data-creche",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const bonusRunArchives = legalAction(
      "bodyweight-bonus-archives",
      "runner",
      "start_run",
      "Bonus-Run auf Archives",
      { credits: 0, clicks: 0 },
      {
        source: "basic_action",
        payload: {
          serverId: "archives",
          bonusRunNoClick: true,
          bonusRunSource: "onr_v1_123_bodyweight-data-creche",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      },
    );
    const decline = legalAction(
      "bodyweight-decline",
      "runner",
      "trigger_ability",
      "Keinen Bonus-Run starten",
      { credits: 0, clicks: 0 },
      {
        source: "bodyweight-data-creche",
        payload: {
          abilityId: "decline_successful_run_extra_run",
        },
      },
    );
    const input = aiInput("runner", [
      bonusRunHq,
      bonusRunRd,
      bonusRunArchives,
      decline,
    ]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 10;

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          safeRuntimeRunTarget(bonusRunHq.actionId, "hq"),
          safeRuntimeRunTarget(bonusRunRd.actionId, "rd"),
          safeRuntimeRunTarget(bonusRunArchives.actionId, "archives"),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: expect.stringMatching(/^bodyweight-bonus-/),
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("fails closed when a purported restricted run omits the Engine-certified remaining-action count", () => {
    resetResidentPlanPortfolioMemory();
    const incompleteRun = legalAction(
      "runner.start_run.rd.bonus_run.incomplete",
      "runner",
      "start_run",
      "Continue sequence run on R&D",
      { credits: 0, clicks: 0 },
      {
        source: "game_rule",
        payload: {
          serverId: "rd",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
        },
      },
    );
    const input = aiInput("runner", [incompleteRun]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 10;
    const noStandalonePayoff = {
      ...safeRuntimeRunTarget(incompleteRun.actionId, "rd"),
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: -420,
    };

    expect(() =>
      liveContext({
        evaluateRunnerRunTargets: () => [noStandalonePayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
    expect(residentPlanPortfolioSnapshot(input)).toBeUndefined();
  });

  it("lets the safety plan exclusively forgo unsafe run-only capacity", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const runRemoteOne = legalAction(
      "run-remote-1",
      "runner",
      "start_run",
      "Run remote 1",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "remote_1" } },
    );
    const runRemoteTwo = legalAction(
      "run-remote-2",
      "runner",
      "start_run",
      "Run remote 2",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "remote_2" } },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [runRd, runRemoteOne, runRemoteTwo, end]);
    input.playerView.own.clicks = 0;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
    ];
    const blockedRemoteOne = {
      ...safeRuntimeRunTarget(runRemoteOne.actionId, "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
      score: -320,
      knownAccessState: "known_no_current_payoff",
    };
    const blockedRemoteTwo = {
      ...safeRuntimeRunTarget(runRemoteTwo.actionId, "remote_2"),
      targetKind: "remote",
      accessTargetKind: "remote",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
      score: -420,
      knownAccessState: "known_no_current_payoff",
    };
    const unsafeInformationRun = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      unknownUnrezzedIceCount: 1,
      unavoidableVisibleIceHazardCount: 1,
      recommendation: "draw_for_damage_buffer",
      score: -200,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          unsafeInformationRun,
          blockedRemoteOne,
          blockedRemoteTwo,
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "runner.end_turn",
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
    });
  });

  it("does not create strategic run funding when an already funded target says run now", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("funded-run-hand-1", "runner", "event"),
      visibleCard("funded-run-hand-2", "runner", "event"),
      visibleCard("funded-run-hand-3", "runner", "event"),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      pathCost: 1,
      creditsAfterRun: 9,
      recommendation: "run_now" as const,
      score: 180,
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 12,
        fundingNeed: true,
        buildEconomyBeforePressure: true,
        evidence: ["test_strategic_reserve"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "run-rd",
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(decision.evidence).not.toContain(
      "plan_assessment_evidence:runner_run_support_build_strategic_reserve:rd",
    );
  });

  it("funds the structured post-run reserve before an ordinary paid matchpoint central run", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-paid-matchpoint-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit-paid-matchpoint-rd",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("paid-matchpoint-hand-1", "runner", "event"),
      visibleCard("paid-matchpoint-hand-2", "runner", "event"),
      visibleCard("paid-matchpoint-hand-3", "runner", "event"),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "rd"),
      pathCost: 1,
      creditsAfterRun: 9,
      recommendation: "run_now" as const,
      score: 180,
      fundingNeed: {
        reason: "post_run_floor_gap" as const,
        routeFundingGap: 0,
        postRunFloorGap: 3,
        protectedLiquidReserve: 12,
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 12,
        creditReservePolicy: {
          phase: "midgame",
          contestReserve: 0,
        },
        fundingNeed: true,
        evidence: ["test_structured_post_run_reserve"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:runner_run_support_fund_concrete_gap:rd:concrete_funding_gap_admitted",
    );
  });

  it("rejects debt financing as standalone board development without a bound parent", () => {
    resetResidentPlanPortfolioMemory();
    const loan = legalAction(
      "install-debt",
      "runner",
      "install_card",
      "Install credit exchange",
      { credits: 0, clicks: 1 },
      {
        source: "debt-card",
        payload: {
          cardId: "debt-card",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          gainCreditsAmount: 12,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [loan, credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("debt-card", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "debt-card",
          definitionId: "onr_v1_168_loan-from-chiba",
          legalActionId: loan.actionId,
          priority: 9_000,
          currentNeed: "acute",
          strategicFit: "strong",
        }),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "strategic_exchange_requires_bound_parent",
    );
  });

  it.each([
    {
      label: "low payoff",
      accessPayoff: "fresh" as const,
      scoreThreat: false,
      unknownIce: 0,
      riskyCoverage: false,
    },
    {
      label: "uncovered unknown ICE",
      accessPayoff: "score_threat" as const,
      scoreThreat: true,
      unknownIce: 1,
      riskyCoverage: false,
    },
  ])(
    "does not bind debt financing to a $label run",
    ({ accessPayoff, scoreThreat, unknownIce, riskyCoverage }) => {
      resetResidentPlanPortfolioMemory();
      const run = legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0, clicks: 1 },
        { payload: { serverId: "remote_1" } },
      );
      const loan = legalAction(
        "install-debt",
        "runner",
        "install_card",
        "Install credit exchange",
        { credits: 0, clicks: 1 },
        {
          source: "debt-card",
          payload: {
            cardId: "debt-card",
            sourceDefinitionId: "onr_v1_168_loan-from-chiba",
            gainCreditsAmount: 12,
          },
        },
      );
      const credit = legalAction(
        "credit",
        "runner",
        "gain_credit",
        "Gain 1 Credit",
        { credits: 0, clicks: 1 },
      );
      const input = aiInput("runner", [run, loan, credit]);
      input.playerView.own.credits = 0;
      input.playerView.own.clicks = 2;
      input.playerView.own.gripOrHq = [
        visibleCard("debt-card", "runner", "resource", {
          definitionId: "onr_v1_168_loan-from-chiba",
        }),
      ];
      const target = {
        ...safeRuntimeRunTarget(run.actionId, "remote_1"),
        targetKind: "remote" as const,
        accessTargetKind: "remote" as const,
        accessPayoff,
        knownAccessState: "unknown" as const,
        pathCost: 2,
        creditsAfterRun: -2,
        runCommitment: "probe_only" as const,
        unknownUnrezzedIceCount: unknownIce,
        riskyUniversalCoverage: riskyCoverage,
        scoreThreat,
        recommendation: "gain_credits_first" as const,
        score: 500,
      };
      const completeEconomy = buildRunnerEconomyPosture({
        input,
        handDevelopmentEvaluations: [],
      });

      const decision = liveContext({
        evaluateRunnerHandDevelopment: () => [],
        evaluateRunnerRunTargets: () => [target],
        buildRunnerEconomyPosture: () => ({
          ...completeEconomy,
          minimumCreditFloor: 0,
          desiredCreditReserve: 2,
          fundingNeed: true,
          buildEconomyBeforePressure: true,
          creditReservePolicy: {
            ...completeEconomy.creditReservePolicy,
            contestReserve: 2,
          },
          evidence: ["test_debt_parent_rejected"],
        }),
      }).chooseSemanticRuntimeAction(input, {});

      expect(decision.actionId).not.toBe(loan.actionId);
      expect(JSON.stringify(decision.decisionDebug)).toContain(
        "strategic_exchange_requires_bound_parent",
      );
    },
  );

  it("binds canonical debt financing to the exact profitable run parent and its safe exit reserve", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const loan = legalAction(
      "install-debt",
      "runner",
      "install_card",
      "Install credit exchange",
      { credits: 0, clicks: 1 },
      {
        source: "debt-card",
        payload: {
          cardId: "debt-card",
          sourceDefinitionId: "onr_v1_168_loan-from-chiba",
          gainCreditsAmount: 12,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, loan, credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("debt-card", "runner", "resource", {
        definitionId: "onr_v1_168_loan-from-chiba",
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      accessPayoff: "score_threat" as const,
      knownAccessState: "unknown" as const,
      pathCost: 2,
      creditsAfterRun: -2,
      runCommitment: "full_path" as const,
      unknownUnrezzedIceCount: 1,
      riskyUniversalCoverage: true,
      scoreThreat: true,
      recommendation: "gain_credits_first" as const,
      score: 500,
    };
    const completeEconomy = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [],
    });

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [],
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        ...completeEconomy,
        minimumCreditFloor: 0,
        desiredCreditReserve: 2,
        fundingNeed: true,
        buildEconomyBeforePressure: true,
        creditReservePolicy: {
          ...completeEconomy.creditReservePolicy,
          contestReserve: 2,
        },
        evidence: ["test_profitable_debt_parent"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: loan.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.economy:run-support%3Aremote%3Aremote_1",
      instances: expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          openNeedIds: ["run-support:remote:remote_1"],
        }),
        expect.objectContaining({
          instanceId: "plan:runner.economy:run-support%3Aremote%3Aremote_1",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          parentNeedId: "run-support:remote:remote_1",
        }),
      ]),
    });
  });

  it("rejects Do the 'Drine as standalone economy without a bound parent need", () => {
    resetResidentPlanPortfolioMemory();
    const drineOne = legalAction(
      "drine-1",
      "runner",
      "play_event",
      "Do the 'Drine: 1 Core Damage",
      { credits: 0, clicks: 1 },
      {
        source: "drine-card",
        payload: {
          cardId: "drine-card",
          sourceDefinitionId: "onr_classic_036_do-the-drine",
          xValue: 1,
          damageType: "core",
          damageAmount: 1,
          damageCannotBePrevented: true,
          gainCreditsAmount: 4,
        },
      },
    );
    const drineTwo = legalAction(
      "drine-2",
      "runner",
      "play_event",
      "Do the 'Drine: 2 Core Damage",
      { credits: 0, clicks: 1 },
      {
        source: "drine-card",
        payload: {
          cardId: "drine-card",
          sourceDefinitionId: "onr_classic_036_do-the-drine",
          xValue: 2,
          damageType: "core",
          damageAmount: 2,
          damageCannotBePrevented: true,
          gainCreditsAmount: 8,
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [drineOne, drineTwo, credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("drine-card", "runner", "event", {
        definitionId: "onr_classic_036_do-the-drine",
      }),
      visibleCard("buffer-1", "runner", "event"),
      visibleCard("buffer-2", "runner", "event"),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "drine-card",
          definitionId: "onr_classic_036_do-the-drine",
          legalActionId: drineOne.actionId,
          priority: 300,
          currentNeed: "acute",
          strategicFit: "strong",
        }),
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "runner_self_damage_economy_requires_bound_parent_funding",
    );
  });

  it("binds the smallest sufficient Do the 'Drine choice to an exact remote funding need", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const drine = (amount: 1 | 2) =>
      legalAction(
        `drine-${amount}`,
        "runner",
        "play_event",
        `Do the 'Drine: ${amount} Core Damage`,
        { credits: 0, clicks: 1 },
        {
          source: "drine-card",
          payload: {
            cardId: "drine-card",
            sourceDefinitionId: "onr_classic_036_do-the-drine",
            xValue: amount,
            damageType: "core",
            damageAmount: amount,
            damageCannotBePrevented: true,
            gainCreditsAmount: amount * 4,
          },
        },
      );
    const drineOne = drine(1);
    const drineTwo = drine(2);
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, drineOne, drineTwo, credit]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 3;
    input.playerView.opponent.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("drine-card", "runner", "event", {
        definitionId: "onr_classic_036_do-the-drine",
      }),
      visibleCard("buffer-1", "runner", "event"),
      visibleCard("buffer-2", "runner", "event"),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      accessPayoff: "score_threat" as const,
      knownAccessState: "unknown" as const,
      pathCost: 0,
      creditsAfterRun: 4,
      runCommitment: "probe_only" as const,
      unknownUnrezzedIceCount: 1,
      scoreThreat: true,
      recommendation: "gain_credits_first" as const,
      score: 500,
      fundingNeed: {
        reason: "post_run_floor_gap" as const,
        routeFundingGap: 0,
        postRunFloorGap: 4,
        protectedLiquidReserve: 8,
      },
    };
    const completeEconomy = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [],
    });

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [],
      evaluateRunnerRunTargets: () => [target],
      buildRunnerEconomyPosture: () => ({
        ...completeEconomy,
        minimumCreditFloor: 3,
        desiredCreditReserve: 8,
        fundingNeed: true,
        buildEconomyBeforePressure: true,
        creditReservePolicy: {
          ...completeEconomy.creditReservePolicy,
          contestReserve: 8,
        },
        evidence: ["test_remote_score_threat"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: drineOne.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.economy:run-support%3Aremote%3Aremote_1",
    });
  });

  it.each([
    ["central", "hq", "runner.pressure_central"],
    ["remote", "remote_1", "runner.contest_remote"],
  ] as const)(
    "does not launch a %s information probe when its known path exceeds the encounter budget",
    (_kind, serverId, owner) => {
      resetResidentPlanPortfolioMemory();
      const run = legalAction(
        `run-${serverId}`,
        "runner",
        "start_run",
        `Run ${serverId}`,
        { credits: 0, clicks: 1 },
        { payload: { serverId } },
      );
      const credit = legalAction(
        "credit",
        "runner",
        "gain_credit",
        "Gain 1 Credit",
        { credits: 0, clicks: 1 },
      );
      const input = aiInput("runner", [run, credit]);
      input.playerView.own.credits = 5;
      input.playerView.own.clicks = 3;
      input.playerView.opponent.deckCount = 10;
      const target = {
        ...safeRuntimeRunTarget(run.actionId, serverId),
        targetKind: serverId.startsWith("remote_")
          ? ("remote" as const)
          : ("hq" as const),
        accessTargetKind: serverId.startsWith("remote_")
          ? ("remote" as const)
          : ("hq" as const),
        knownAccessState: "unknown" as const,
        accessPayoff: "unknown" as const,
        recommendation: "run_if_free" as const,
        pathCost: 2,
        routeQuote: {
          ...safeRuntimeRunTarget(run.actionId, serverId).routeQuote,
          knownCost: 2,
          guaranteedKnownCost: 2,
          availableCredits: 5,
          fundingGap: 0,
        },
        score: 180,
      };

      const decision = liveContext({
        evaluateRunnerRunTargets: () => [target],
      }).chooseSemanticRuntimeAction(input, {});

      expect(decision).toMatchObject({
        actionId: credit.actionId,
        reasonCode: "plan_first.runner.economy",
        fallbackUsed: false,
      });
      expect(decision.reasonCode).not.toContain(owner);
    },
  );

  it.each([
    {
      label: "zero-cost score-threat probe",
      pathCost: 0,
      creditsAfterRun: 6,
      unknownIce: 1,
      expectedActionId: "credit",
      expectedPlanKind: "runner.economy",
      expectsFunding: true,
    },
    {
      label: "costly score-threat probe",
      pathCost: 6,
      creditsAfterRun: 3,
      unknownIce: 2,
      expectedActionId: "run-remote",
      expectedPlanKind: "runner.contest_remote",
      expectsFunding: false,
    },
  ])(
    "funds evaluator-deferred $label only when its explicit contest reserve is same-turn reachable",
    ({
      pathCost,
      creditsAfterRun,
      unknownIce,
      expectedActionId,
      expectedPlanKind,
      expectsFunding,
    }) => {
      resetResidentPlanPortfolioMemory();
      const run = legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0, clicks: 1 },
        { payload: { serverId: "remote_1" } },
      );
      const credit = legalAction(
        "credit",
        "runner",
        "gain_credit",
        "Gain 1 Credit",
        { credits: 0, clicks: 1 },
      );
      const input = aiInput("runner", [run, credit]);
      input.playerView.own.credits = pathCost === 0 ? 6 : 9;
      input.playerView.own.clicks = pathCost === 0 ? 3 : 4;
      input.playerView.opponent.credits = pathCost === 0 ? 5 : 0;
      const target = {
        ...safeRuntimeRunTarget(run.actionId, "rd"),
        targetServerId: "remote_1",
        targetKind: "remote" as const,
        accessServerId: "remote_1",
        accessTargetKind: "remote" as const,
        accessPayoff: "score_threat" as const,
        knownAccessState: "unknown" as const,
        pathCost,
        creditsAfterRun,
        runCommitment: "probe_only" as const,
        unknownUnrezzedIceCount: unknownIce,
        scoreThreat: true,
        recommendation: "gain_credits_first" as const,
        score: 500,
        ...(pathCost === 0
          ? {
              fundingNeed: {
                reason: "post_run_floor_gap" as const,
                routeFundingGap: 0,
                postRunFloorGap: 2,
                protectedLiquidReserve: 8,
              },
            }
          : {}),
      };
      const completeEconomy = buildRunnerEconomyPosture({
        input,
        handDevelopmentEvaluations: [],
      });

      const decision = liveContext({
        evaluateRunnerRunTargets: () => [target],
        buildRunnerEconomyPosture: () => ({
          ...completeEconomy,
          minimumCreditFloor: 3,
          desiredCreditReserve: pathCost === 0 ? 8 : 20,
          fundingNeed: true,
          buildEconomyBeforePressure: true,
          creditReservePolicy: {
            ...completeEconomy.creditReservePolicy,
            contestReserve: 8,
          },
          evidence: ["test_remote_score_threat"],
        }),
      }).chooseSemanticRuntimeAction(input, {});

      expect(decision).toMatchObject({
        actionId: expectedActionId,
        reasonCode: `plan_first.${expectedPlanKind}`,
        fallbackUsed: false,
      });
      const fundingEvidence =
        "plan_assessment_evidence:runner_run_support_fund_concrete_gap:remote_1:concrete_funding_gap_admitted";
      if (expectsFunding) {
        expect(decision.evidence).toContain(fundingEvidence);
        expect(decision.evidence).toContain("plan_priority_class:P2");
        expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
          rootForegroundInstanceId:
            "plan:runner.contest_remote:remote%3Aremote_1",
          executorInstanceId:
            "plan:runner.economy:run-support%3Aremote%3Aremote_1",
          instances: expect.arrayContaining([
            expect.objectContaining({
              instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
              openNeedIds: ["run-support:remote:remote_1"],
            }),
            expect.objectContaining({
              instanceId: "plan:runner.economy:run-support%3Aremote%3Aremote_1",
              parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
              parentNeedId: "run-support:remote:remote_1",
            }),
          ]),
        });
      } else {
        expect(decision.evidence).not.toContain(fundingEvidence);
      }
    },
  );

  it("ends the turn when the only remaining run has no known payoff", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run empty remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [end, run]);
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;
    const noPayoff = {
      ...safeRuntimeRunTarget("run-remote", "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
      score: -420,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [noPayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
    });
  });

  it("ends the turn when the only remaining run has negative payoff", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run expensive remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [end, run]);
    input.playerView.own.credits = 46;
    input.playerView.own.clicks = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;
    const negativePayoff = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      accessPayoff: "trash_affordable",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
      score: -1_000,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [negativePayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
    });
  });

  it("fails closed when a positive reachable Remote action has no plan route", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [end, run]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
      visibleCard("grip-3", "runner", "event"),
    ];
    input.playerView.opponent.deckCount = 10;
    const uncoveredPositiveRoute = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      accessPayoff: "fresh",
      knownAccessState: "fresh",
      recommendation: "setup_first",
      score: 120,
    };

    expect(() =>
      liveContext({
        evaluateRunnerRunTargets: () => [uncoveredPositiveRoute],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("keeps a nonurgent gain-credits-first Remote bound to its funding step", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [end, run, credit]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 1;
    input.playerView.opponent.deckCount = 10;
    const waitingRemote = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote",
      accessTargetKind: "remote",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "gain_credits_first",
      score: 120,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [waitingRemote],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 5,
          fundingNeed: true,
          evidence: ["runner_credit_reserve_below_target"],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("fails closed instead of ending a normal click while only an unsafe run is represented", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [end, run]);
    input.playerView.own.clicks = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
    ];
    input.playerView.own.stackOrRdCount = 10;
    input.playerView.opponent.deckCount = 10;

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("keeps nonempty-Stack normal capacity on the P6 liquidity owner", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const credit = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [end, credit]);
    input.playerView.own.clicks = 1;
    input.playerView.own.credits = 13;
    input.playerView.own.stackOrRdCount = 27;
    input.playerView.opponent.deckCount = 15;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
  });

  it("does not treat a composite draw action as hand-buffer progress when the Stack is empty", () => {
    resetResidentPlanPortfolioMemory();
    const saloon = legalAction(
      "runner.activated_card_ability.saloon.gain-and-draw",
      "runner",
      "activated_card_ability",
      "Silicon Saloon Franchise: 1 Credit nehmen und 1 Karte ziehen",
      { credits: 0, clicks: 1 },
      {
        source: "saloon",
        payload: {
          cardId: "saloon",
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
          gainCreditsAmount: 1,
          drawCardsAmount: 1,
          effectKind: "gain_credits",
        },
      },
    );
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [saloon, end]);
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 28;
    input.playerView.own.stackOrRdCount = 0;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = Array.from({ length: 2 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: end.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.defense_and_recovery" },
    });
  });

  it("does not admit the constrained-run mode while ordinary progress remains legal", () => {
    resetResidentPlanPortfolioMemory();
    const end = legalAction("end", "runner", "end_turn", "End turn", {
      credits: 0,
      clicks: 0,
    });
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      {
        credits: 0,
        clicks: 1,
      },
      {
        payload: { serverId: "rd" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [end, run, credit]);
    input.playerView.own.clicks = 2;
    input.playerView.own.credits = 0;
    input.playerView.opponent.deckCount = 10;

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          runTargetEvaluation({
            actionId: "run-rd",
            targetServerId: "rd",
            knownAccessState: "known_no_current_payoff",
            score: -100,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("does not open restricted install capacity without a productive follow-up", () => {
    resetResidentPlanPortfolioMemory();
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: {
          cardId: "valu-pak-card",
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          gainActionsAmount: 5,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "program_install_only",
          actionCapacityAllowedActionType: "install_card",
          actionCapacityReliability: "guaranteed",
        },
      },
    );
    const redundantProgram = legalAction(
      "install-redundant-program",
      "runner",
      "install_card",
      "Install redundant program",
      { credits: 0, clicks: 1 },
      {
        source: "program-card",
        payload: {
          cardId: "program-card",
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [valuPak, redundantProgram, credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
      visibleCard("program-card", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
    ];
    const handDevelopment = [
      handEvaluation({
        cardInstanceId: "valu-pak-card",
        definitionId: "onr_v1_117_valu-pak-software-bundle",
        legalActionId: "valu-pak",
        priority: 200,
      }),
      handEvaluation({
        cardInstanceId: "program-card",
        definitionId: "onr_v1_045_newsgroup-filter",
        legalActionId: "install-redundant-program",
        priority: 20,
        deferReason: "duplicate",
        duplicateRole: "redundant_duplicate",
        finalInstallFit: -2_000,
      }),
    ];

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => handDevelopment,
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
    });
  });

  it("keeps a liquid composite card in Development when Funding delegates another exact action", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "a-basic-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const composite = legalAction(
      "z-composite-card",
      "runner",
      "play_event",
      "Play liquid development card",
      { credits: 0, clicks: 1 },
      {
        source: "composite-card",
        payload: {
          cardId: "composite-card",
          sourceDefinitionId: "test_composite_liquid_development",
          gainCreditsAmount: 1,
          drawCardsAmount: 1,
        },
      },
    );
    const input = aiInput("runner", [credit, composite]);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("composite-card", "runner", "event", {
        definitionId: "test_composite_liquid_development",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "composite-card",
          definitionId: "test_composite_liquid_development",
          legalActionId: composite.actionId,
          priority: 200,
          developmentRole: "run_event",
          strategicFit: "strong",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 5,
        fundingNeed: true,
        evidence: ["test_exact_funding_delegation"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: composite.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
  });

  it("keeps protected engine funding resident until the exact install target is reached", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "engine-funding-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const install = legalAction(
      "install-saloon-engine",
      "runner",
      "install_card",
      "Install Silicon Saloon Franchise",
      { credits: 8, clicks: 1 },
      {
        source: "saloon-engine-card",
        payload: {
          cardId: "saloon-engine-card",
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
        },
      },
    );
    const planInstanceId =
      "plan:runner.develop_board_and_hand:card%3Asaloon-engine-card";
    const fundingLeafInstanceId =
      "plan:runner.economy:development-support%3Asaloon-engine-card";
    const expectedOwnedDecision = (
      actionId: string,
      phase: "fund" | "execute",
    ) => ({
      actionId,
      reasonCode:
        phase === "fund"
          ? "plan_first.runner.economy"
          : "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: {
        planKind:
          phase === "fund" ? "runner.economy" : "runner.develop_board_and_hand",
        planFirstDecision: {
          rootPlanInstanceId: planInstanceId,
          leafExecutorInstanceId:
            phase === "fund" ? fundingLeafInstanceId : planInstanceId,
          selectedPlan: {
            moduleId:
              phase === "fund"
                ? "runner.economy"
                : "runner.develop_board_and_hand",
            executionState: "executor",
          },
          route: {
            actionId,
            stepId:
              phase === "fund"
                ? `${fundingLeafInstanceId}:fund:development-support:saloon-engine-card`
                : `${planInstanceId}:execute`,
          },
        },
      },
    });
    let currentEvaluation = protectedEngineHandEvaluation(10, install.actionId);
    const context = liveContext({
      evaluateRunnerHandDevelopment: () => [currentEvaluation],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 2,
        desiredCreditReserve: 4,
        fundingNeed: false,
        evidence: [],
      }),
    });
    const input = aiInput("runner", [credit, install]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("saloon-engine-card", "runner", "resource", {
        definitionId: "onr_v1_179_silicon-saloon-franchise",
        installCost: 8,
      }),
    ];

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject(
      expectedOwnedDecision(credit.actionId, "fund"),
    );
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: planInstanceId,
      executorInstanceId: fundingLeafInstanceId,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          instance.dedupeKey === "card:saloon-engine-card",
      ),
    ).toMatchObject({
      phase: "fund",
      moduleState: {
        signal: {
          fundingGap: 2,
          supportNeedId: "development-support:saloon-engine-card",
          developmentFundingMilestone: {
            targetCredits: 12,
            observedCredits: 10,
            remainingGap: 2,
            priorityClass: "P4",
          },
        },
      },
    });

    const second = structuredClone(input);
    second.playerView.stateVersion = 2;
    second.decisionId = "protected-engine-funding:2:runner";
    second.playerView.own.credits = 11;
    second.playerView.own.clicks = 3;
    for (const action of second.legalActions) action.expiresAtStateVersion = 2;
    second.playerView.legalActions = second.legalActions;
    currentEvaluation = protectedEngineHandEvaluation(11, install.actionId);
    expect(context.chooseSemanticRuntimeAction(second, {})).toMatchObject(
      expectedOwnedDecision(credit.actionId, "fund"),
    );
    expect(residentPlanPortfolioSnapshot(second)).toMatchObject({
      rootForegroundInstanceId: planInstanceId,
      executorInstanceId: fundingLeafInstanceId,
    });
    expect(
      residentPlanPortfolioSnapshot(second)?.instances.find(
        (instance) => instance.dedupeKey === "card:saloon-engine-card",
      ),
    ).toMatchObject({ phase: "fund" });

    const ready = structuredClone(second);
    ready.playerView.stateVersion = 3;
    ready.decisionId = "protected-engine-funding:3:runner";
    ready.playerView.own.credits = 12;
    ready.playerView.own.clicks = 2;
    for (const action of ready.legalActions) action.expiresAtStateVersion = 3;
    ready.playerView.legalActions = ready.legalActions;
    currentEvaluation = protectedEngineHandEvaluation(12, install.actionId);
    expect(context.chooseSemanticRuntimeAction(ready, {})).toMatchObject(
      expectedOwnedDecision(install.actionId, "execute"),
    );
    expect(residentPlanPortfolioSnapshot(ready)).toMatchObject({
      rootForegroundInstanceId: planInstanceId,
      executorInstanceId: planInstanceId,
    });
  });

  it("lets a terminal remote contest preempt bounded development saving", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "development-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const run = legalAction(
      "run-terminal-remote",
      "runner",
      "start_run",
      "Run terminal remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const install = legalAction(
      "install-saloon-engine",
      "runner",
      "install_card",
      "Install Silicon Saloon Franchise",
      { credits: 8, clicks: 1 },
      {
        source: "saloon-engine-card",
        payload: {
          cardId: "saloon-engine-card",
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
        },
      },
    );
    const input = aiInput("runner", [credit, run, install]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 3;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.agendaPointsToWin = 7;
    input.playerView.own.gripOrHq = [
      visibleCard("saloon-engine-card", "runner", "resource", {
        definitionId: "onr_v1_179_silicon-saloon-franchise",
        installCost: 8,
      }),
    ];
    const terminalRemote = server("remote_1");
    terminalRemote.root = [
      {
        instanceId: "advanced-terminal-remote-card",
        known: false,
        advancementCounters: 2,
      },
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      terminalRemote,
    ];

    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        protectedEngineHandEvaluation(10, install.actionId),
      ],
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "remote_1"),
          targetKind: "remote" as const,
          accessTargetKind: "remote" as const,
          scoreThreat: true,
          recommendation: "run_now" as const,
          score: 500,
        },
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 2,
        desiredCreditReserve: 4,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain("plan_priority_class:P2");
  });

  it("keeps an exact executable run above the repeated matchpoint-remote focus placeholder", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-repeated-matchpoint-remote",
      "runner",
      "start_run",
      "Run repeated matchpoint remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit-repeated-matchpoint-remote",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 15;
    input.playerView.own.clicks = 4;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.agendaPointsToWin = 7;
    const repeatedRemote = server("remote_1");
    repeatedRemote.root = [
      {
        instanceId: "unknown-repeated-remote-root",
        known: false,
        advancementCounters: 0,
      },
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      repeatedRemote,
    ];
    input.playerView.publicEvents = [
      {
        eventId: "corp-score-repeated-remote",
        type: "score_agenda",
        stateVersionBefore: 8,
        stateVersionAfter: 9,
        turnSerial: 3,
        stateHashAfter: "fnv1a:corp-score-repeated-remote",
        publicPayload: {
          actor: "corp",
          actionType: "score_agenda",
          targets: { scoredFromServerId: "remote_1" },
        },
      },
    ];
    input.eventTail = input.playerView.publicEvents;

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "remote_1"),
          targetKind: "remote" as const,
          accessTargetKind: "remote" as const,
          knownAccessState: "unknown" as const,
          accessPayoff: "unknown" as const,
          scoreThreat: false,
          recommendation: "run_if_free" as const,
          score: 155,
        },
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 12,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        expect.stringContaining("runner_terminal_remote_contest_mandatory"),
      ]),
    );
  });

  it("keeps a probe-limited event run contest-owned when it has an exact affordable trash payoff", () => {
    resetResidentPlanPortfolioMemory();
    const eventRun = legalAction(
      "lucidrine-known-remote-payoff",
      "runner",
      "play_event",
      "Run the known-payoff remote with temporary credits",
      { credits: 0, clicks: 1 },
      {
        source: "lucidrine-card",
        payload: {
          cardId: "lucidrine-card",
          sourceDefinitionId: "onr_v1_098_lucidrine-booster-drug",
          serverId: "remote_1",
          runnerEventRun: true,
          runTemporaryCredits: 9,
          afterRunUnpreventableCoreDamage: 1,
        },
      },
    );
    const credit = legalAction(
      "credit-known-remote-payoff",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [eventRun, credit]);
    input.playerView.own.credits = 21;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("lucidrine-card", "runner", "event", {
        definitionId: "onr_v1_098_lucidrine-booster-drug",
      }),
    ];
    const knownPayoffRemote = server("remote_1");
    knownPayoffRemote.root = [
      visibleCard("known-payoff-asset", "corp", "asset", {
        definitionId: "test-known-trashable-asset",
        title: "Known trashable asset",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      knownPayoffRemote,
    ];
    const target = {
      ...safeRuntimeRunTarget(eventRun.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      accessPayoff: "trash_affordable" as const,
      knownAccessState: "known_payoff" as const,
      accessPayoffContestable: true,
      pathCost: 3,
      creditsAfterRun: 21,
      runCommitment: "probe_only" as const,
      recommendation: "run_now" as const,
      score: 300,
      runActionProjection: {
        actionId: eventRun.actionId,
        sourceKind: "event" as const,
        targetServerId: "remote_1",
        temporaryRunCredits: 9,
        postRunSelfDamage: 1,
      },
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [target],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 12,
          fundingNeed: false,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: eventRun.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
  });

  it("does not bind saving to an expensive weak development card", () => {
    resetResidentPlanPortfolioMemory();
    const credit = legalAction(
      "weak-card-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("runner", [credit]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("weak-expensive-card", "runner", "resource", {
        definitionId: "test_weak_expensive_resource",
        installCost: 10,
      }),
    ];

    liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "weak-expensive-card",
          definitionId: "test_weak_expensive_resource",
          legalActionId: "install-weak-expensive-card",
          priority: 1_000,
          availability: "missing_credits",
          deferReason: "missing_credits",
          missingCredits: 8,
          targetCredits: 10,
          installCost: 10,
          developmentRole: "economy_engine",
          strategicFit: "weak",
          currentNeed: "useful_now",
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 2,
        desiredCreditReserve: 4,
        fundingNeed: true,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) =>
          instance.moduleId === "runner.develop_board_and_hand" &&
          instance.dedupeKey === "card:weak-expensive-card",
      ),
    ).toBe(false);
  });

  it("binds a same-turn access event to a productive central pressure plan", () => {
    resetResidentPlanPortfolioMemory();
    const prepareAccess = legalAction(
      "prepare-access",
      "runner",
      "play_event",
      "Play access preparation",
      { credits: 2, clicks: 1 },
      {
        source: "access-event",
        payload: {
          cardId: "access-event",
          sourceDefinitionId: "onr_proteus_119_promises-promises",
        },
      },
    );
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [prepareAccess, run, credit]);
    input.playerView.own.credits = 6;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("access-event", "runner", "event", {
        definitionId: "onr_proteus_119_promises-promises",
      }),
    ];
    const development = {
      ...handEvaluation({
        cardInstanceId: "access-event",
        definitionId: "onr_proteus_119_promises-promises",
        legalActionId: "prepare-access",
        priority: 220,
      }),
      developmentRole: "run_event" as const,
      strategicFit: "strong" as const,
      currentNeed: "useful_now" as const,
      activationPrerequisites: [
        { kind: "same_turn_access" as const, satisfied: true },
      ],
    };
    expect(buildActionSemanticCandidates(input)).toContainEqual(
      expect.objectContaining({
        actionId: "prepare-access",
        sourceDefinitionId: "onr_proteus_119_promises-promises",
      }),
    );

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => [development],
        evaluateRunnerRunTargets: () => [
          runTargetEvaluation({
            actionId: "run-rd",
            targetServerId: "rd",
            knownAccessState: "known_payoff",
            score: 200,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "prepare-access",
      reasonCode: "plan_first.runner.pressure_central",
      decisionDebug: { planKind: "runner.pressure_central" },
    });
  });

  it("leaves an unowned same-turn access event unselected while an exact economy route acts", () => {
    resetResidentPlanPortfolioMemory();
    const prepareAccess = legalAction(
      "prepare-access",
      "runner",
      "play_event",
      "Play access preparation",
      { credits: 2, clicks: 1 },
      {
        source: "access-event",
        payload: {
          cardId: "access-event",
          sourceDefinitionId: "onr_proteus_119_promises-promises",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [prepareAccess, credit]);
    input.playerView.own.credits = 6;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      visibleCard("access-event", "runner", "event", {
        definitionId: "onr_proteus_119_promises-promises",
      }),
    ];
    const development = {
      ...handEvaluation({
        cardInstanceId: "access-event",
        definitionId: "onr_proteus_119_promises-promises",
        legalActionId: "prepare-access",
        priority: 220,
      }),
      developmentRole: "run_event" as const,
      strategicFit: "strong" as const,
      currentNeed: "useful_now" as const,
      activationPrerequisites: [
        { kind: "same_turn_access" as const, satisfied: true },
      ],
    };
    const accessDecision = liveContext({
      evaluateRunnerHandDevelopment: () => [development],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});
    expect(accessDecision).toMatchObject({
      actionId: "credit",
      fallbackUsed: false,
      reasonCode: "plan_first.runner.economy",
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
    expect(accessDecision.evidence).toContain(
      "plan_assessment_evidence:runner_engine_certified_immediate_liquidity_development",
    );
  });

  it("opens Valu-Pak only for a concrete multi-program commitment", () => {
    resetResidentPlanPortfolioMemory();
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: {
          cardId: "valu-pak-card",
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          gainActionsAmount: 5,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "program_install_only",
          actionCapacityAllowedActionType: "install_card",
          actionCapacityAllowedCardType: "program",
          actionCapacityTemporaryCredits: 1,
          actionCapacityReliability: "guaranteed",
        },
      },
    );
    const firstProgram = legalAction(
      "install-program-a",
      "runner",
      "install_card",
      "Install program A",
      { credits: 2, clicks: 1 },
      {
        source: "program-a",
        payload: {
          cardId: "program-a",
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
        },
      },
    );
    const secondProgram = legalAction(
      "install-program-b",
      "runner",
      "install_card",
      "Install program B",
      { credits: 3, clicks: 1 },
      {
        source: "program-b",
        payload: {
          cardId: "program-b",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const input = aiInput("runner", [valuPak, firstProgram, secondProgram]);
    input.playerView.own.credits = 6;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
      visibleCard("program-a", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
      visibleCard("program-b", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
      visibleCard("hand-buffer-card", "runner", "event", {
        definitionId: "onr_v1_029_special-order",
      }),
    ];
    const handDevelopment = [
      handEvaluation({
        cardInstanceId: "valu-pak-card",
        definitionId: "onr_v1_117_valu-pak-software-bundle",
        legalActionId: "valu-pak",
        priority: 200,
      }),
      handEvaluation({
        cardInstanceId: "program-a",
        definitionId: "onr_v1_045_newsgroup-filter",
        legalActionId: "install-program-a",
        priority: 80,
        duplicateRole: "none",
        finalInstallFit: 100,
        cardType: "program",
        installCost: 2,
        memoryCost: 1,
        creditsAfterInstall: 4,
      }),
      handEvaluation({
        cardInstanceId: "program-b",
        definitionId: "onr_v1_007_blink",
        legalActionId: "install-program-b",
        priority: 70,
        duplicateRole: "none",
        finalInstallFit: 90,
        cardType: "program",
        installCost: 3,
        memoryCost: 1,
        creditsAfterInstall: 3,
      }),
    ];

    const context = liveContext({
      evaluateRunnerHandDevelopment: () => handDevelopment,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    });
    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "valu-pak",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });

    const restrictedPayload = {
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityAllowedCardType: "program",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      restrictedActionGrantActionType: "install_card",
      restrictedActionGrantCostProfile: "temporary_credit_bundle",
      restrictedActionGrantRemainingActions: 5,
    };
    const restrictedProgramA = legalAction(
      "restricted-install-program-a",
      "runner",
      "install_card",
      "Install program A",
      { credits: 2, clicks: 1 },
      {
        source: "program-a",
        payload: {
          ...restrictedPayload,
          cardId: "program-a",
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
        },
      },
    );
    const restrictedProgramB = legalAction(
      "restricted-install-program-b",
      "runner",
      "install_card",
      "Install program B",
      { credits: 3, clicks: 1 },
      {
        source: "program-b",
        payload: {
          ...restrictedPayload,
          cardId: "program-b",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const stop = legalAction(
      "stop-valu-pak",
      "runner",
      "stop_restricted_action_sequence",
      "Stop Valu-Pak sequence",
      { credits: 0, clicks: 0 },
      { source: "game_rule", payload: restrictedPayload },
    );
    const afterOpen = aiInput("runner", [
      restrictedProgramA,
      restrictedProgramB,
      stop,
    ]);
    afterOpen.playerView.stateVersion = 2;
    afterOpen.playerView.own.clicks = 7;
    afterOpen.playerView.own.credits = 7;
    afterOpen.playerView.own.memoryLimit = 4;
    afterOpen.playerView.own.memoryUsed = 0;
    afterOpen.playerView.own.gripOrHq = [
      visibleCard("program-a", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
      visibleCard("program-b", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    expect(
      context.chooseSemanticRuntimeAction(afterOpen, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "restricted-install-program-a",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
      },
    });

    const afterFirstInstall = aiInput("runner", [restrictedProgramB, stop]);
    afterFirstInstall.playerView.stateVersion = 3;
    afterFirstInstall.playerView.own.clicks = 6;
    afterFirstInstall.playerView.own.credits = 5;
    afterFirstInstall.playerView.own.memoryLimit = 4;
    afterFirstInstall.playerView.own.memoryUsed = 1;
    afterFirstInstall.playerView.own.rig = [
      visibleCard("program-a", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
    ];
    afterFirstInstall.playerView.own.gripOrHq = [
      visibleCard("program-b", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    expect(
      context.chooseSemanticRuntimeAction(afterFirstInstall, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "restricted-install-program-b",
      fallbackUsed: false,
    });

    const afterSecondInstall = aiInput("runner", [stop]);
    afterSecondInstall.playerView.stateVersion = 4;
    afterSecondInstall.playerView.own.clicks = 5;
    afterSecondInstall.playerView.own.credits = 2;
    afterSecondInstall.playerView.own.memoryLimit = 4;
    afterSecondInstall.playerView.own.memoryUsed = 2;
    afterSecondInstall.playerView.own.rig = [
      visibleCard("program-a", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
      visibleCard("program-b", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    expect(
      context.chooseSemanticRuntimeAction(afterSecondInstall, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "stop-valu-pak",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
  });

  it("rejects Valu-Pak when only a resource and a deferred non-bridge program are available", () => {
    resetResidentPlanPortfolioMemory();
    const capacityPayload = {
      cardId: "valu-pak-card",
      sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
      gainActionsAmount: 5,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityAllowedCardType: "program",
      actionCapacityTemporaryCredits: 1,
      actionCapacityReliability: "guaranteed",
    };
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: capacityPayload,
      },
    );
    const wilson = legalAction(
      "install-wilson",
      "runner",
      "install_card",
      "Install Wilson",
      { credits: 4, clicks: 1 },
      {
        source: "wilson-card",
        payload: {
          cardId: "wilson-card",
          sourceDefinitionId: "onr_v1_038_wilson-weeflerunner",
        },
      },
    );
    const blink = legalAction(
      "install-blink",
      "runner",
      "install_card",
      "Install Blink",
      { credits: 5, clicks: 1 },
      {
        source: "blink-card",
        payload: {
          cardId: "blink-card",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const input = aiInput("runner", [valuPak, wilson, blink]);
    input.playerView.own.credits = 6;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
      visibleCard("wilson-card", "runner", "resource", {
        definitionId: "onr_v1_038_wilson-weeflerunner",
      }),
      visibleCard("blink-card", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "valu-pak-card",
          definitionId: "onr_v1_117_valu-pak-software-bundle",
          legalActionId: "valu-pak",
          priority: 970,
        }),
        handEvaluation({
          cardInstanceId: "wilson-card",
          definitionId: "onr_v1_038_wilson-weeflerunner",
          legalActionId: "install-wilson",
          priority: 1_000,
          duplicateRole: "none",
          finalInstallFit: 100,
          cardType: "resource",
          installCost: 4,
          creditsAfterInstall: 2,
        }),
        handEvaluation({
          cardInstanceId: "blink-card",
          definitionId: "onr_v1_007_blink",
          legalActionId: "install-blink",
          priority: 1_000,
          deferReason: "preserve_credit_floor",
          duplicateRole: "none",
          finalInstallFit: 350,
          cardType: "program",
          installCost: 5,
          memoryCost: 1,
          creditsAfterInstall: 1,
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 3,
        desiredCreditReserve: 5,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "install-wilson",
      fallbackUsed: false,
    });
    expect(decision.actionId).not.toBe("valu-pak");
  });

  it("does not open Valu-Pak speculatively for programs that exist only in the deck strategy", () => {
    resetResidentPlanPortfolioMemory();
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: {
          cardId: "valu-pak-card",
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          gainActionsAmount: 5,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "program_install_only",
          actionCapacityAllowedActionType: "install_card",
          actionCapacityAllowedCardType: "program",
          actionCapacityTemporaryCredits: 1,
          actionCapacityReliability: "guaranteed",
        },
      },
    );
    const credit = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1 credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action" },
    );
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [valuPak, credit, endTurn]);
    input.playerView.own.credits = 6;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
    ];

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "valu-pak-card",
            definitionId: "onr_v1_117_valu-pak-software-bundle",
            legalActionId: "valu-pak",
            priority: 970,
            strategicFit: "strong",
          }),
        ],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 0,
          fundingNeed: false,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("keeps Valu-Pak in preparation when visible programs have only later value", () => {
    resetResidentPlanPortfolioMemory();
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: {
          cardId: "valu-pak-card",
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          gainActionsAmount: 5,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "program_install_only",
          actionCapacityAllowedActionType: "install_card",
          actionCapacityAllowedCardType: "program",
          actionCapacityTemporaryCredits: 1,
          actionCapacityReliability: "guaranteed",
        },
      },
    );
    const firstProgram = legalAction(
      "install-program-a",
      "runner",
      "install_card",
      "Install program A",
      { credits: 1, clicks: 1 },
      {
        source: "program-a",
        payload: {
          cardId: "program-a",
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
        },
      },
    );
    const secondProgram = legalAction(
      "install-program-b",
      "runner",
      "install_card",
      "Install program B",
      { credits: 1, clicks: 1 },
      {
        source: "program-b",
        payload: {
          cardId: "program-b",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const input = aiInput("runner", [valuPak, firstProgram, secondProgram]);
    input.playerView.own.credits = 6;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
      visibleCard("program-a", "runner", "program", {
        definitionId: "onr_v1_045_newsgroup-filter",
      }),
      visibleCard("program-b", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];
    const decision = liveContext({
      evaluateRunnerHandDevelopment: () => [
        handEvaluation({
          cardInstanceId: "valu-pak-card",
          definitionId: "onr_v1_117_valu-pak-software-bundle",
          legalActionId: "valu-pak",
          priority: 970,
          strategicFit: "strong",
        }),
        handEvaluation({
          cardInstanceId: "program-a",
          definitionId: "onr_v1_045_newsgroup-filter",
          legalActionId: "install-program-a",
          priority: 20,
          currentNeed: "later",
          duplicateRole: "none",
          finalInstallFit: 80,
          cardType: "program",
          installCost: 1,
          memoryCost: 1,
        }),
        handEvaluation({
          cardInstanceId: "program-b",
          definitionId: "onr_v1_007_blink",
          legalActionId: "install-program-b",
          priority: 20,
          currentNeed: "later",
          duplicateRole: "none",
          finalInstallFit: 80,
          cardType: "program",
          installCost: 1,
          memoryCost: 1,
        }),
      ],
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).not.toBe("valu-pak");
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      instances: expect.arrayContaining([
        expect.objectContaining({
          instanceId: expect.stringContaining(
            "plan:runner.develop_board_and_hand:card%3Avalu-pak-card",
          ),
          viability: "blocked",
          phase: "prepare_restricted_sequence",
        }),
      ]),
    });
  });

  it("allows one Valu-Pak target only as an acute exact temporary-credit bridge", () => {
    resetResidentPlanPortfolioMemory();
    const valuPak = legalAction(
      "valu-pak",
      "runner",
      "play_event",
      "Play Valu-Pak",
      { credits: 0, clicks: 1 },
      {
        source: "valu-pak-card",
        payload: {
          cardId: "valu-pak-card",
          sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
          gainActionsAmount: 5,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "program_install_only",
          actionCapacityAllowedActionType: "install_card",
          actionCapacityAllowedCardType: "program",
          actionCapacityTemporaryCredits: 1,
          actionCapacityReliability: "guaranteed",
        },
      },
    );
    const input = aiInput("runner", [valuPak]);
    input.playerView.own.credits = 4;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("valu-pak-card", "runner", "event", {
        definitionId: "onr_v1_117_valu-pak-software-bundle",
      }),
      visibleCard("acute-program", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
      visibleCard("hand-buffer-card", "runner", "event", {
        definitionId: "onr_v1_029_special-order",
      }),
    ];

    expect(
      liveContext({
        evaluateRunnerHandDevelopment: () => [
          handEvaluation({
            cardInstanceId: "valu-pak-card",
            definitionId: "onr_v1_117_valu-pak-software-bundle",
            legalActionId: "valu-pak",
            priority: 970,
          }),
          handEvaluation({
            cardInstanceId: "acute-program",
            definitionId: "onr_v1_007_blink",
            legalActionId: "install-after-valu-pak",
            priority: 1_000,
            deferReason: "missing_credits",
            duplicateRole: "none",
            finalInstallFit: 400,
            cardType: "program",
            installCost: 5,
            memoryCost: 1,
            availability: "missing_credits",
            missingCredits: 1,
            currentNeed: "acute",
            strategicFit: "strong",
          }),
        ],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 0,
          fundingNeed: false,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "valu-pak",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
  });

  it.each([
    ["temporary credits", Number.NaN, 1, 1],
    ["program install cost", 1, Number.POSITIVE_INFINITY, 1],
    ["program MU", 1, 1, Number.NaN],
  ] as const)(
    "fails closed for non-finite Valu-Pak %s",
    (_label, temporaryCredits, installCost, memoryCost) => {
      resetResidentPlanPortfolioMemory();
      const fixture = valuPakNumericContractFixture({
        temporaryCredits,
        installCost,
        memoryCost,
      });

      expect(() =>
        liveContext({
          evaluateRunnerHandDevelopment: () => fixture.evaluations,
          buildRunnerEconomyPosture: () => ({
            minimumCreditFloor: 0,
            desiredCreditReserve: 0,
            fundingNeed: false,
            evidence: [],
          }),
        }).chooseSemanticRuntimeAction(fixture.input, {}),
      ).toThrowError("missing_card_definition");
    },
  );

  it("uses the active Valu-Pak sequence B instead of completed sequence A", () => {
    resetResidentPlanPortfolioMemory();
    const input = activeRestrictedValuPakInput();
    const completedA = restrictedSequencePlanInstance(
      restrictedSequenceCommitment("valu-pak-a", "program-a", 1),
      "complete_restricted_sequence",
      5,
      false,
    );
    const activeB = restrictedSequencePlanInstance(
      restrictedSequenceCommitment("valu-pak-b", "program-b", 4),
      "execute_restricted_sequence",
      5,
      true,
    );
    rememberResidentPlanPortfolio(input, {
      schemaVersion: "resident-plan-portfolio-v2",
      side: "runner",
      stateVersion: 5,
      rootForegroundInstanceId: activeB.instanceId,
      executorInstanceId: activeB.instanceId,
      instances: [completedA, activeB],
      completionHistory: [],
      transitions: [],
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "restricted-install-program-b",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
  });

  it.each(["temporaryInstallCredits", "installCost", "memoryCost"] as const)(
    "invalidates an active Valu-Pak commitment with non-finite %s",
    (field) => {
      resetResidentPlanPortfolioMemory();
      const input = activeRestrictedValuPakInput();
      const commitment = restrictedSequenceCommitment(
        "valu-pak-b",
        "program-b",
        4,
      );
      if (field === "temporaryInstallCredits") {
        commitment.temporaryInstallCredits = Number.NaN;
      } else {
        commitment.targetSteps[0]![field] = Number.POSITIVE_INFINITY;
      }
      const active = restrictedSequencePlanInstance(
        commitment,
        "execute_restricted_sequence",
        5,
        true,
      );
      rememberResidentPlanPortfolio(input, {
        schemaVersion: "resident-plan-portfolio-v2",
        side: "runner",
        stateVersion: 5,
        rootForegroundInstanceId: active.instanceId,
        executorInstanceId: active.instanceId,
        instances: [active],
        completionHistory: [],
        transitions: [],
      });

      expect(() =>
        liveContext().chooseSemanticRuntimeAction(input, {}),
      ).toThrowError("commitment_invalidated");
    },
  );

  it.each(["missing", "ambiguous"] as const)(
    "fails closed for a %s active Valu-Pak executor binding",
    (binding) => {
      resetResidentPlanPortfolioMemory();
      const input = activeRestrictedValuPakInput();
      const historicalA = restrictedSequencePlanInstance(
        restrictedSequenceCommitment("valu-pak-a", "program-a", 1),
        "complete_restricted_sequence",
        5,
        binding === "ambiguous",
      );
      const sequenceB = restrictedSequencePlanInstance(
        restrictedSequenceCommitment("valu-pak-b", "program-b", 4),
        "execute_restricted_sequence",
        5,
        binding === "ambiguous",
      );
      rememberResidentPlanPortfolio(input, {
        schemaVersion: "resident-plan-portfolio-v2",
        side: "runner",
        stateVersion: 5,
        ...(binding === "ambiguous"
          ? {
              rootForegroundInstanceId: sequenceB.instanceId,
              executorInstanceId: sequenceB.instanceId,
            }
          : {}),
        instances: [historicalA, sequenceB],
        completionHistory: [],
        transitions: [],
      });

      expect(() =>
        liveContext().chooseSemanticRuntimeAction(input, {}),
      ).toThrowError("commitment_invalidated");
    },
  );

  it("fails hard when an active Valu-Pak sequence has no preflight commitment", () => {
    resetResidentPlanPortfolioMemory();
    const restrictedPayload = {
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityAllowedCardType: "program",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      restrictedActionGrantActionType: "install_card",
      restrictedActionGrantCostProfile: "temporary_credit_bundle",
      restrictedActionGrantRemainingActions: 5,
    };
    const install = legalAction(
      "restricted-install-program",
      "runner",
      "install_card",
      "Install program",
      { credits: 1, clicks: 1 },
      {
        source: "program-card",
        payload: {
          ...restrictedPayload,
          cardId: "program-card",
          sourceDefinitionId: "onr_v1_007_blink",
        },
      },
    );
    const stop = legalAction(
      "stop-valu-pak",
      "runner",
      "stop_restricted_action_sequence",
      "Stop Valu-Pak sequence",
      { credits: 0, clicks: 0 },
      { source: "game_rule", payload: restrictedPayload },
    );
    const input = aiInput("runner", [install, stop]);
    input.playerView.stateVersion = 2;
    input.playerView.own.gripOrHq = [
      visibleCard("program-card", "runner", "program", {
        definitionId: "onr_v1_007_blink",
      }),
    ];

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("commitment_invalidated");
  });

  it("permits early EndTurn only through the rules-proven Corp deckout plan", () => {
    resetResidentPlanPortfolioMemory();
    const action = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [action]);
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    input.legalActions.push(credit);
    input.playerView.own.clicks = 3;
    input.playerView.opponent.deckCount = 0;

    const decision = liveContext().chooseSemanticRuntimeAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });
    expect(decision).toMatchObject({
      actionId: "end",
      reasonCode: "plan_first.runner.secure_terminal_win",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.secure_terminal_win" },
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:transient_plan_signal_guarantee:rules_proven",
    );
  });

  it.each([
    {
      label: "two unknown ICE",
      handSize: 3,
      unknownIce: 2,
      multiaccess: false,
      expectedActionId: "draw",
      expectedPlan: "runner.defense_and_recovery",
    },
    {
      label: "high-risk multiaccess",
      handSize: 4,
      unknownIce: 2,
      multiaccess: true,
      expectedActionId: "draw",
      expectedPlan: "runner.defense_and_recovery",
    },
    {
      label: "a completed four-card buffer",
      handSize: 4,
      unknownIce: 2,
      multiaccess: false,
      expectedActionId: "run-rd",
      expectedPlan: "runner.pressure_central",
    },
  ])(
    "builds the risk-adjusted hand buffer before $label",
    ({ handSize, unknownIce, multiaccess, expectedActionId, expectedPlan }) => {
      resetResidentPlanPortfolioMemory();
      const run = legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0, clicks: 1 },
        { payload: { serverId: "rd" } },
      );
      const draw = legalAction("draw", "runner", "draw_card", "Draw", {
        credits: 0,
        clicks: 1,
      });
      const input = aiInput("runner", [run, draw]);
      input.playerView.own.credits = 10;
      input.playerView.own.stackOrRdCount = 20;
      input.playerView.own.gripOrHq = Array.from(
        { length: handSize },
        (_, index) => visibleCard(`grip-${index}`, "runner", "event"),
      );
      const target = {
        ...safeRuntimeRunTarget("run-rd", "rd"),
        unknownUnrezzedIceCount: unknownIce,
        unrezzedIceRisk: 0.9,
        multiaccessAvailable: multiaccess,
        score: 400,
      };

      const decision = liveContext({
        evaluateRunnerRunTargets: () => [target],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 0,
          fundingNeed: false,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {});
      expect(decision).toMatchObject({
        actionId: expectedActionId,
        reasonCode: `plan_first.${expectedPlan}`,
        fallbackUsed: false,
      });
      if (expectedPlan === "runner.defense_and_recovery") {
        expect(decision.evidence).toContain(
          "plan_assessment_evidence:transient_plan_signal_plan:runner.defense_and_recovery",
        );
      }
    },
  );

  it("does not route a draw as hand-buffer progress above the effective maximum hand size", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
      clicks: 1,
    });
    const end = legalAction(
      "runner.end_turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [run, draw, end]);
    input.playerView.own.credits = 10;
    input.playerView.own.maxHandSize = 2;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = Array.from({ length: 3 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          {
            ...safeRuntimeRunTarget("run-rd", "rd"),
            unknownUnrezzedIceCount: 2,
            unrezzedIceRisk: 0.9,
            score: 400,
          },
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("dispositions top-heap recovery when the exact defense hand-buffer route is closed at maximum hand size", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const recovery = legalAction(
      "recover-top-heap-at-hand-maximum",
      "runner",
      "activated_card_ability",
      "Recover the top card of the heap",
      { credits: 1, clicks: 1 },
      {
        source: "recovery-resource",
        payload: {
          cardId: "recovery-resource",
          sourceDefinitionId: "onr_v1_165_junkyard-bbs",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationAbilityId:
            "onr_v1_165_junkyard-bbs:abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationEffectKind: "move_top_trash_to_grip",
          targetCardId: "top-heap-card",
          targetCardDefinitionId: "onr_v1_176_the-shell-traders",
          cardImplementationTopTrashTargetId: "top-heap-card",
        },
      },
    );
    const input = aiInput("runner", [run, recovery]);
    input.playerView.own.credits = 7;
    input.playerView.own.clicks = 2;
    input.playerView.own.maxHandSize = 4;
    input.playerView.own.gripOrHq = Array.from({ length: 4 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );
    input.playerView.own.heapOrArchives = [
      visibleCard("top-heap-card", "runner", "resource", {
        definitionId: "onr_v1_176_the-shell-traders",
        title: "The Shell Traders",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "rd"),
          unknownUnrezzedIceCount: 2,
          unrezzedIceRisk: 0.9,
          multiaccessAvailable: true,
          score: 400,
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === recovery.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner.defense_and_recovery:runner_top_heap_recovery_has_no_active_hand_or_coverage_need",
        ),
      ]),
    });
  });

  it("dispositions top-heap recovery above the required hand buffer even with spare hand capacity", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd-above-buffer",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const recovery = legalAction(
      "recover-top-heap-above-buffer",
      "runner",
      "activated_card_ability",
      "Recover the top card of the heap",
      { credits: 1, clicks: 1 },
      {
        source: "recovery-resource",
        payload: {
          cardId: "recovery-resource",
          sourceDefinitionId: "onr_v1_165_junkyard-bbs",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationAbilityId:
            "onr_v1_165_junkyard-bbs:abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationEffectKind: "move_top_trash_to_grip",
          targetCardId: "top-heap-event",
          targetDefinitionId: "onr_v1_105_priority-wreck",
          cardImplementationTopTrashTargetId: "top-heap-event",
        },
      },
    );
    const input = aiInput("runner", [run, recovery]);
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 1;
    input.playerView.own.maxHandSize = 5;
    input.playerView.own.gripOrHq = Array.from({ length: 4 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );
    input.playerView.own.heapOrArchives = [
      visibleCard("top-heap-event", "runner", "event", {
        definitionId: "onr_v1_105_priority-wreck",
        title: "Priority Wreck",
      }),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "rd"),
          score: 400,
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === recovery.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner.defense_and_recovery:runner_top_heap_recovery_has_no_active_hand_or_coverage_need",
        ),
      ]),
    });
  });

  it("does not let terminal central pressure overwrite a negative exact run quote", () => {
    resetResidentPlanPortfolioMemory();
    const runHq = legalAction(
      "run-hq-negative-terminal",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit-negative-terminal",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-negative-terminal",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runHq, credit, endTurn]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 5;
    input.playerView.opponent.deckCount = 10;

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          {
            ...safeRuntimeRunTarget(runHq.actionId, "hq"),
            recommendation: "run_if_free" as const,
            score: -195,
          },
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("uses existing central pressure for a last-chance access when the terminal remote is unreachable", () => {
    resetResidentPlanPortfolioMemory();
    const runHq = legalAction(
      "run-hq-terminal-alternative",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const runRd = legalAction(
      "run-rd-terminal-alternative",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const runRemote = legalAction(
      "run-remote-terminal-blocked",
      "runner",
      "start_run",
      "Run Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit-terminal-alternative",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [runHq, runRd, runRemote, credit]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.clicks = 4;
    input.playerView.own.credits = 18;
    input.playerView.own.stackOrRdCount = 10;
    input.playerView.opponent.agendaPoints = 5;
    input.playerView.opponent.credits = 1;
    input.playerView.opponent.deckCount = 14;
    const hiddenTerminalRemoteRoot: VisibleCard = {
      instanceId: "terminal-remote-root",
      definitionId: "terminal-remote-root",
      title: "terminal-remote-root",
      owner: "corp",
      controller: "corp",
      type: "agenda",
      known: false,
      advancementCounters: 2,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [hiddenTerminalRemoteRoot]),
    ];
    const hqTarget = {
      ...safeRuntimeRunTarget(runHq.actionId, "hq"),
      accessPayoff: "unknown" as const,
      knownAccessState: "unknown" as const,
      recommendation: "gain_credits_first" as const,
      score: -60,
    };
    const rdTarget = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      accessPayoff: "unknown" as const,
      knownAccessState: "unknown" as const,
      recommendation: "gain_credits_first" as const,
      score: -55,
    };
    const remoteTarget = {
      ...safeRuntimeRunTarget(runRemote.actionId, "hq"),
      targetServerId: "remote_1",
      targetKind: "remote" as const,
      accessServerId: "remote_1",
      accessTargetKind: "remote" as const,
      accessPayoff: "score_threat" as const,
      knownAccessState: "unknown" as const,
      runActionProjection: {
        ...safeRuntimeRunTarget(runRemote.actionId, "hq").runActionProjection,
        targetServerId: "remote_1",
        targetKind: "remote" as const,
        accessServerId: "remote_1",
        accessPayoffSignals: ["score_threat"],
      },
      pathPassability: "blocked_unpayable" as const,
      pathCost: 28,
      routeQuote: {
        ...safeRuntimeRunTarget(runRemote.actionId, "hq").routeQuote,
        reachability: "no_access" as const,
        knownCost: 28,
        guaranteedKnownCost: 28,
        availableCredits: 18,
        fundingGap: 10,
        noAccessReason: "insufficient_credits",
      },
      creditsAfterRun: -10,
      scoreThreat: true,
      recommendation: "gain_credits_first" as const,
      score: 300,
      evidence: [
        "path_passability:blocked_unpayable",
        "access_payoff:score_threat",
      ],
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [hqTarget, rdTarget, remoteTarget],
    }).chooseSemanticRuntimeAction(input, {});

    expect([runHq.actionId, runRd.actionId]).toContain(decision.actionId);
    expect(decision).toMatchObject({
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.pressure_central",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:runner.pressure_central:central%3A",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.pressure_central:central%3A",
          ),
          selectedStep: {
            stepId: expect.stringMatching(/:pressure:(hq|rd)$/),
          },
        },
        evidence: expect.arrayContaining([
          expect.stringContaining(
            "runner_terminal_remote_unreachable_central_last_chance",
          ),
        ]),
      },
    });
    const origin = decision.decisionDebug?.planFirstDecision?.executionOrigin;
    expect(origin).toMatchObject({
      rootPlanInstanceId:
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      leafPlanInstanceId:
        decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
      side: "runner",
      windowKind: "run",
    });
  });

  it("waits under exact match-point deck pressure when every current route is owner-rejected", () => {
    resetResidentPlanPortfolioMemory();
    const runRd = legalAction(
      "run-rd-deck-pressure-wait",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit-deck-pressure-wait",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-deck-pressure-wait",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runRd, credit, endTurn]);
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.stackOrRdCount = 13;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 13;
    input.playerView.opponent.deckCount = 13;
    const blockedRun = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: -320,
      routeQuote: {
        ...safeRuntimeRunTarget(runRd.actionId, "rd").routeQuote,
        reachability: "no_access" as const,
        noAccessReason: "missing_breaker_coverage",
        evidence: [
          "route_reachability:no_access",
          "route_funding_gap:0",
          "route_unknown_ice_count:0",
        ],
      },
      evidence: [
        "path_passability:blocked_missing_coverage",
        "missing_breaker_coverage:wall",
      ],
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [blockedRun],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 10,
          fundingNeed: false,
          evidence: ["test_visible_liquidity_demand_satisfied"],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: endTurn.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.defense_and_recovery",
        evidence: expect.arrayContaining([
          expect.stringContaining("forgo_terminal_deck_pressure"),
        ]),
      },
    });
  });

  it("does not wait on deck pressure below match point", () => {
    resetResidentPlanPortfolioMemory();
    const runRd = legalAction(
      "run-rd-no-deck-pressure-wait",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit-no-deck-pressure-wait",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-no-deck-pressure-wait",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runRd, credit, endTurn]);
    input.playerView.own.agendaPoints = 5;
    input.playerView.own.stackOrRdCount = 13;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 13;
    input.playerView.opponent.deckCount = 5;
    const blockedRun = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: -320,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [blockedRun],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 3,
          desiredCreditReserve: 10,
          fundingNeed: false,
          evidence: ["test_visible_liquidity_demand_satisfied"],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("lets a positive current route quote, not no-access action history, govern a 6/7 terminal central probe", () => {
    const runHq = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const endTurn = legalAction(
      "end-turn",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [runHq, credit, endTurn]);
    input.playerView.stateVersion = 20;
    input.playerView.turnSerial = 9;
    input.playerView.own.agendaPoints = 6;
    input.playerView.own.clicks = 3;
    input.playerView.own.credits = 5;
    input.playerView.opponent.deckCount = 10;
    const terminalProbe = {
      ...safeRuntimeRunTarget(runHq.actionId, "hq"),
      recommendation: "run_if_free" as const,
      score: 40,
    };
    let routeIsBlocked = false;
    const blockedTerminalProbe = {
      ...terminalProbe,
      pathPassability: "blocked_missing_coverage" as const,
      routeQuote: {
        ...terminalProbe.routeQuote,
        reachability: "no_access" as const,
        noAccessReason: "missing_breaker_coverage",
        evidence: [
          "route_reachability:no_access",
          "route_funding_gap:0",
          "route_unknown_ice_count:0",
        ],
      },
      recommendation: "find_breaker_first" as const,
      evidence: [
        "path_passability:blocked_missing_coverage",
        "missing_breaker_coverage:sentry",
      ],
    };
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        routeIsBlocked ? blockedTerminalProbe : terminalProbe,
      ],
    });

    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runHq.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const noAccess = structuredClone(input);
    noAccess.playerView.stateVersion = 22;
    noAccess.eventTail = [
      {
        eventId: "hq-run-start-no-access",
        type: "start_run",
        stateVersionBefore: 20,
        stateVersionAfter: 21,
        turnSerial: 9,
        stateHashAfter: "fnv1a:hq-run-start-no-access",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "hq",
        },
      },
      {
        eventId: "hq-run-jack-out",
        type: "jack_out",
        stateVersionBefore: 21,
        stateVersionAfter: 22,
        turnSerial: 9,
        stateHashAfter: "fnv1a:hq-run-jack-out",
        visibilityClass: "public",
        publicPayload: { actor: "runner", actionType: "jack_out" },
      },
    ];
    routeIsBlocked = true;
    resetResidentPlanPortfolioMemory();
    const noAccessDecision = context.chooseSemanticRuntimeAction(noAccess, {
      runnerTurnPlannerMode: "legacy_compare",
    });
    expect(noAccessDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(noAccessDecision.actionId).not.toBe(runHq.actionId);

    const developedAfterNoAccess = structuredClone(noAccess);
    developedAfterNoAccess.playerView.stateVersion = 23;
    developedAfterNoAccess.playerView.own.clicks = 2;
    developedAfterNoAccess.playerView.own.credits = 6;
    developedAfterNoAccess.eventTail.push({
      eventId: "hq-run-development-credit",
      type: "gain_credit",
      stateVersionBefore: 22,
      stateVersionAfter: 23,
      turnSerial: 9,
      stateHashAfter: "fnv1a:hq-run-development-credit",
      visibilityClass: "public",
      publicPayload: { actor: "runner", actionType: "gain_credit" },
    });
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(developedAfterNoAccess, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });

    routeIsBlocked = false;
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(developedAfterNoAccess, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runHq.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const accessed = structuredClone(input);
    accessed.playerView.stateVersion = 22;
    accessed.eventTail = [
      {
        eventId: "hq-run-start",
        type: "start_run",
        stateVersionBefore: 18,
        stateVersionAfter: 19,
        turnSerial: 9,
        stateHashAfter: "fnv1a:hq-run-start",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "hq",
        },
      },
      {
        eventId: "hq-access",
        type: "access_card",
        stateVersionBefore: 19,
        stateVersionAfter: 21,
        turnSerial: 9,
        stateHashAfter: "fnv1a:hq-access",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
    ];
    const dtoAccessed = buildAiDecisionInputDto({
      side: accessed.side,
      playerView: accessed.playerView,
      eventTail: accessed.eventTail,
      legalActions: accessed.legalActions,
      difficulty: accessed.difficulty,
      seed: accessed.seed,
      decisionId: accessed.decisionId,
      actionNumber: accessed.actionNumber,
      profileId: accessed.profileId,
    });
    expect(dtoAccessed.eventTail.map((event) => event.turnSerial)).toEqual([
      9, 9,
    ]);
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(dtoAccessed, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });

    const stateVersionOnly = structuredClone(dtoAccessed);
    stateVersionOnly.playerView.stateVersion = 40;
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(stateVersionOnly, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });

    const missingTurn = structuredClone(input);
    delete missingTurn.playerView.turnSerial;
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(missingTurn, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });

    const malformedEventTurns = [
      {
        label: "missing",
        mutate: (event: (typeof accessed.eventTail)[number]) => {
          delete event.turnSerial;
        },
      },
      {
        label: "invalid",
        mutate: (event: (typeof accessed.eventTail)[number]) => {
          event.turnSerial = Number.NaN;
        },
      },
    ];
    for (const malformed of malformedEventTurns) {
      const malformedHistory = structuredClone(dtoAccessed);
      malformed.mutate(malformedHistory.eventTail[0]!);
      resetResidentPlanPortfolioMemory();
      const decision = context.chooseSemanticRuntimeAction(malformedHistory, {
        runnerTurnPlannerMode: "legacy_compare",
      });
      expect(decision, malformed.label).toMatchObject({
        actionId: credit.actionId,
        reasonCode: "plan_first.runner.economy",
        fallbackUsed: false,
      });
      expect(decision.evidence, malformed.label).toContain(
        "plan_portfolio_blocked_evidence:plan:runner.pressure_central:central%3Ahq:runner_central_pressure_cadence_event_turn_invalid:hq:hq-run-start",
      );
    }

    const refreshed = structuredClone(dtoAccessed);
    refreshed.playerView.stateVersion = 24;
    refreshed.eventTail.push({
      eventId: "corp-draw",
      type: "draw_card",
      stateVersionBefore: 22,
      stateVersionAfter: 23,
      turnSerial: 9,
      stateHashAfter: "fnv1a:corp-draw",
      visibilityClass: "private_to_side",
      publicPayload: {
        actor: "corp",
        actionType: "draw_card",
      },
    });
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(refreshed, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runHq.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const nextTurn = structuredClone(dtoAccessed);
    nextTurn.playerView.turnSerial = 10;
    nextTurn.playerView.stateVersion = 30;
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(nextTurn, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runHq.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("consumes 5/7 matchpoint central pressure per server instead of reopening a repeat loop", () => {
    const runHq = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [runHq, runRd, credit]);
    input.playerView.stateVersion = 32;
    input.playerView.turnSerial = 12;
    input.playerView.own.agendaPoints = 5;
    input.playerView.own.clicks = 3;
    input.eventTail = [
      {
        eventId: "hq-run-start",
        type: "start_run",
        stateVersionBefore: 28,
        stateVersionAfter: 29,
        turnSerial: 12,
        stateHashAfter: "fnv1a:hq-run-start",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "hq",
        },
      },
      {
        eventId: "hq-access",
        type: "access_card",
        stateVersionBefore: 30,
        stateVersionAfter: 31,
        turnSerial: 12,
        stateHashAfter: "fnv1a:hq-access",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
    ];
    const hq = {
      ...safeRuntimeRunTarget(runHq.actionId, "hq"),
      recommendation: "run_if_free" as const,
      score: 1,
    };
    const rd = {
      ...safeRuntimeRunTarget(runRd.actionId, "rd"),
      recommendation: "run_if_free" as const,
      multiaccessAvailable: true,
      score: 1,
    };
    const context = liveContext({
      evaluateRunnerRunTargets: () => [hq, rd],
    });

    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runRd.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const bothConsumed = structuredClone(input);
    bothConsumed.playerView.stateVersion = 36;
    bothConsumed.eventTail.push(
      {
        eventId: "rd-run-start",
        type: "start_run",
        stateVersionBefore: 31,
        stateVersionAfter: 32,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-run-start",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        },
      },
      {
        eventId: "rd-access-1",
        type: "access_card",
        stateVersionBefore: 32,
        stateVersionAfter: 33,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-access-1",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
      {
        eventId: "rd-access-2",
        type: "access_card",
        stateVersionBefore: 33,
        stateVersionAfter: 34,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-access-2",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
      {
        eventId: "rd-decline-trash",
        type: "decline_trash",
        stateVersionBefore: 34,
        stateVersionAfter: 35,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-decline-trash",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "decline_trash",
        },
      },
    );
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(bothConsumed, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });

    const converted = structuredClone(bothConsumed);
    converted.playerView.stateVersion = 38;
    converted.eventTail.push({
      eventId: "rd-trash",
      type: "trash_accessed_card",
      stateVersionBefore: 36,
      stateVersionAfter: 37,
      turnSerial: 12,
      stateHashAfter: "fnv1a:rd-trash",
      visibilityClass: "hidden_info_barrier",
      publicPayload: {
        actor: "runner",
        actionType: "trash_accessed_card",
      },
    });
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(converted, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runRd.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const convertedDuringMultiaccess = structuredClone(input);
    convertedDuringMultiaccess.playerView.stateVersion = 36;
    convertedDuringMultiaccess.eventTail.push(
      {
        eventId: "rd-multiaccess-run-start",
        type: "start_run",
        stateVersionBefore: 31,
        stateVersionAfter: 32,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-multiaccess-run-start",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        },
      },
      {
        eventId: "rd-multiaccess-access-1",
        type: "access_card",
        stateVersionBefore: 32,
        stateVersionAfter: 33,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-multiaccess-access-1",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
      {
        eventId: "rd-multiaccess-steal",
        type: "steal_agenda",
        stateVersionBefore: 33,
        stateVersionAfter: 34,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-multiaccess-steal",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "steal_agenda",
        },
      },
      {
        eventId: "rd-multiaccess-access-2",
        type: "access_card",
        stateVersionBefore: 34,
        stateVersionAfter: 35,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-multiaccess-access-2",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
    );
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(convertedDuringMultiaccess, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: runRd.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });

    const laterUnconvertedRun = structuredClone(convertedDuringMultiaccess);
    laterUnconvertedRun.playerView.stateVersion = 39;
    laterUnconvertedRun.eventTail.push(
      {
        eventId: "rd-later-run-start",
        type: "start_run",
        stateVersionBefore: 36,
        stateVersionAfter: 37,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-later-run-start",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        },
      },
      {
        eventId: "rd-later-access",
        type: "access_card",
        stateVersionBefore: 37,
        stateVersionAfter: 38,
        turnSerial: 12,
        stateHashAfter: "fnv1a:rd-later-access",
        visibilityClass: "hidden_info_barrier",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
        },
      },
    );
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(laterUnconvertedRun, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("creates a run-window plan for legal access choices even without a stale run snapshot", () => {
    resetResidentPlanPortfolioMemory();
    const decline = legalAction(
      "decline",
      "runner",
      "decline_trash",
      "Decline trash",
      { credits: 0, clicks: 0 },
    );
    const steal = legalAction(
      "steal",
      "runner",
      "steal_agenda",
      "Steal agenda",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [decline, steal]);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      fallbackUsed: false,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: { planKind: "runner.convert_run_window" },
    });
  });

  it("owns the exact post-pass derez-and-end-run ability inside the active run plan", () => {
    resetResidentPlanPortfolioMemory();
    const derez = legalAction(
      "runner.trigger_ability.disgruntled-derez",
      "runner",
      "trigger_ability",
      "Disgruntled Ice Technician: ICE derezzen und Run beenden",
      { credits: 0, clicks: 0 },
      {
        source: "disgruntled-event",
        payload: {
          cardId: "disgruntled-event",
          sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "post_pass_derez_fully_broken_ice_end_run",
          cardImplementationAbilityId:
            "onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run",
          abilityId: "derez_fully_broken_passed_ice_and_end_run",
          targetIceId: "banpei",
          targetIceDefinitionId: "onr_v1_223_banpei",
          runnerUtilityAbility: "derez_fully_broken_passed_ice_and_end_run",
          paymentAmount: 0,
        },
      },
    );
    const input = aiInput("runner", [derez]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("banpei", "corp", "ice", {
          definitionId: "onr_v1_223_banpei",
          rezzed: true,
        }),
      ]),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: derez.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId: expect.any(String),
          leafExecutorInstanceId: expect.any(String),
          route: {
            actionId: derez.actionId,
            stepId: expect.any(String),
          },
          turnPlanning: {
            coverage: {
              status: "pass",
              coveragePercent: 100,
            },
          },
        },
      },
    });
  });

  it("fails closed when a post-pass trigger has no bound functional ability", () => {
    resetResidentPlanPortfolioMemory();
    const incompleteDerez = legalAction(
      "runner.trigger_ability.incomplete-post-pass-derez",
      "runner",
      "trigger_ability",
      "Post-pass derez without ability binding",
      { credits: 0, clicks: 0 },
      {
        source: "incomplete-event",
        payload: {
          cardId: "incomplete-event",
          sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
          targetIceId: "banpei",
          targetIceDefinitionId: "onr_v1_223_banpei",
          paymentAmount: 0,
        },
      },
    );
    const continueRun = legalAction(
      "runner.continue_run.incomplete-post-pass-control",
      "runner",
      "continue_run",
      "Continue",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [incompleteDerez, continueRun]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("banpei", "corp", "ice", {
          definitionId: "onr_v1_223_banpei",
          rezzed: true,
        }),
      ]),
      server("archives"),
    ];

    expect(() => liveContext().chooseSemanticRuntimeAction(input, {})).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });

  it("keeps the verified post-pass continuation as an exclusive run-plan route at the server", () => {
    resetResidentPlanPortfolioMemory();
    const derez = legalAction(
      "runner.trigger_ability.post-pass-at-server",
      "runner",
      "trigger_ability",
      "Derez the passed ICE and end the run",
      { credits: 0, clicks: 0 },
      {
        source: "disgruntled-event",
        payload: {
          cardId: "disgruntled-event",
          sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "post_pass_derez_fully_broken_ice_end_run",
          cardImplementationAbilityId:
            "onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run",
          abilityId: "derez_fully_broken_passed_ice_and_end_run",
          targetIceId: "data-wall",
          targetIceDefinitionId: "onr_v1_237_data-wall",
          paymentAmount: 0,
        },
      },
    );
    const continueRun = legalAction(
      "runner.continue_run.post-pass-at-server",
      "runner",
      "continue_run",
      "Continue to R&D access",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [derez, continueRun]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "server", serverId: "rd" },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("data-wall", "corp", "ice", {
          definitionId: "onr_v1_237_data-wall",
          rezzed: true,
        }),
      ]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: continueRun.actionId,
      fallbackUsed: false,
      reasonCode: "plan_first.runner.convert_run_window",
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          route: {
            actionId: continueRun.actionId,
            stepId: expect.any(String),
          },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual([]);
  });

  it("owns a generic run-remainder strength boost that does not claim a CardSpec source", () => {
    resetResidentPlanPortfolioMemory();
    const boost = legalAction(
      "runner.trigger_ability.generic-run-strength-boost",
      "runner",
      "trigger_ability",
      "Run support: breaker +2",
      { credits: 0, clicks: 0 },
      {
        source: "generic-run-support",
        payload: {
          cardId: "generic-run-support",
          targetCardId: "generic-breaker",
          runnerAbility: "boost_icebreaker_for_run",
        },
      },
    );
    const input = aiInput("runner", [boost]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.own.rig = [
      visibleCard("generic-run-support", "runner", "program", {
        definitionId: "test-generic-run-support",
      }),
      visibleCard("generic-breaker", "runner", "program", {
        definitionId: "test-generic-breaker",
        subtypes: ["icebreaker"],
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: boost.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          leafExecutorInstanceId: expect.any(String),
          route: {
            actionId: boost.actionId,
            stepId: expect.any(String),
          },
        },
      },
    });
  });

  it("keeps an exact encounter subtype change inside the active run-window owner", () => {
    resetResidentPlanPortfolioMemory();
    const chooseCodeGate = legalAction(
      "runner.trigger_ability.fubar.code_gate",
      "runner",
      "trigger_ability",
      "Fubar: Code Gate wählen",
      { credits: 0, clicks: 0 },
      {
        source: "fubar",
        payload: {
          cardId: "fubar",
          runnerAbility: "change_icebreaker_subtype",
          selectedSubtype: "code_gate",
          abilityId: "change_icebreaker_subtype",
        },
      },
    );
    const chooseSentry = legalAction(
      "runner.trigger_ability.fubar.sentry",
      "runner",
      "trigger_ability",
      "Fubar: Sentry wählen",
      { credits: 0, clicks: 0 },
      {
        source: "fubar",
        payload: {
          cardId: "fubar",
          runnerAbility: "change_icebreaker_subtype",
          selectedSubtype: "sentry",
          abilityId: "change_icebreaker_subtype",
        },
      },
    );
    const continueUnbroken = legalAction(
      "runner.continue_run.quandary",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0, clicks: 0 },
      {
        payload: {
          encounterContinue: true,
          encounterWillEndRun: true,
          unbrokenSubroutineCount: 1,
          sourceDefinitionId: "onr_v1_261_quandary",
        },
      },
    );
    const input = aiInput("runner", [
      chooseCodeGate,
      chooseSentry,
      continueUnbroken,
    ]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.run = {
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      encounteredIce: visibleCard("quandary", "corp", "ice", {
        definitionId: "onr_v1_261_quandary",
        rezzed: true,
        subtypes: ["code_gate"],
      }),
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("quandary", "corp", "ice", {
          definitionId: "onr_v1_261_quandary",
          rezzed: true,
          subtypes: ["code_gate"],
          effectiveRunQuote: {
            iceInstanceId: "quandary",
            iceDefinitionId: "onr_v1_261_quandary",
            effectiveStrength: 2,
            subroutines: [
              {
                id: "printed_subroutines_end_the_run",
                type: "end_the_run",
                sourceDefinitionId: "onr_v1_261_quandary",
              },
            ],
          },
        }),
      ]),
    ];
    input.playerView.own.rig = [
      visibleCard("fubar", "runner", "program", {
        definitionId: "onr_proteus_088_fubar",
        subtypes: ["icebreaker", "noisy"],
        strength: 3,
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: chooseCodeGate.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          route: {
            actionId: chooseCodeGate.actionId,
            stepId: expect.any(String),
          },
          turnPlanning: {
            coverage: { status: "pass", coveragePercent: 100 },
          },
        },
      },
    });
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: chooseSentry.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.convert_run_window",
        }),
      ]),
    );

    resetResidentPlanPortfolioMemory();
    const unfunded = structuredClone(input);
    unfunded.playerView.stateVersion += 1;
    unfunded.actionNumber += 1;
    unfunded.playerView.own.credits = 0;
    expect(() =>
      liveContext().chooseSemanticRuntimeAction(unfunded, {}),
    ).toThrow(
      expect.objectContaining({ code: "missing_plan_module_coverage" }),
    );
  });

  it("explicitly rejects post-pass derez when it would abandon a visible agenda", () => {
    resetResidentPlanPortfolioMemory();
    const derez = legalAction(
      "runner.trigger_ability.disgruntled-derez",
      "runner",
      "trigger_ability",
      "Disgruntled Ice Technician: ICE derezzen und Run beenden",
      { credits: 0, clicks: 0 },
      {
        source: "disgruntled-event",
        payload: {
          cardId: "disgruntled-event",
          sourceDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "post_pass_derez_fully_broken_ice_end_run",
          cardImplementationAbilityId:
            "onr_proteus_106_disgruntled-ice-technician:post_pass_derez_fully_broken_ice_end_run",
          abilityId: "derez_fully_broken_passed_ice_and_end_run",
          targetIceId: "banpei",
          targetIceDefinitionId: "onr_v1_223_banpei",
          runnerUtilityAbility: "derez_fully_broken_passed_ice_and_end_run",
          paymentAmount: 0,
        },
      },
    );
    const continueRun = legalAction(
      "runner.continue_run.remote",
      "runner",
      "continue_run",
      "Continue to remote",
      { credits: 0, clicks: 0 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [derez, continueRun]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.run = {
      attackedServerId: "remote_1",
      phase: "movement",
      position: { kind: "server", serverId: "remote_1" },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("banpei", "corp", "ice", {
            definitionId: "onr_v1_223_banpei",
            rezzed: true,
          }),
        ],
        [
          visibleCard("visible-agenda", "corp", "agenda", {
            definitionId: "onr_v1_203_hostile-takeover",
          }),
        ],
      ),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: continueRun.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          turnPlanning: {
            coverage: {
              status: "pass",
              coveragePercent: 100,
            },
          },
        },
      },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.convert_run_window",
      ),
    ).toMatchObject({
      moduleState: {
        signal: {
          actionAssessments: {
            [derez.actionId]: {
              admissible: false,
              evidenceCodes: [
                "runner_post_pass_derez_and_end_run_would_abandon_known_agenda",
                "runner_run_target:remote_1",
              ],
            },
          },
        },
      },
    });
  });

  it("revalidates a parent run and jacks out before witnessed future-encounter damage", () => {
    resetResidentPlanPortfolioMemory();
    const jackOut = legalAction("jack-out", "runner", "jack_out", "Jack out", {
      credits: 0,
      clicks: 0,
    });
    const continueRun = legalAction(
      "continue",
      "runner",
      "continue_run",
      "Continue",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [continueRun, jackOut]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.own.gripOrHq = Array.from({ length: 4 }, (_, index) =>
      visibleCard(`grip-${index}`, "runner", "event"),
    );
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "movement",
      position: { kind: "ice", serverId: "hq", iceIndex: 1 },
      successful: false,
    };
    input.eventTail = [
      {
        eventId: "run-start",
        type: "start_run",
        stateVersionBefore: 17,
        stateVersionAfter: 18,
        stateHashAfter: "fnv1a:run-start",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
        },
      },
      {
        eventId: "fatal-attractor-fired",
        type: "continue_run",
        stateVersionBefore: 18,
        stateVersionAfter: 19,
        stateHashAfter: "fnv1a:fatal-attractor-fired",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "continue_run",
          sourceDefinitionId: "onr_v1_242_fatal-attractor",
          unbrokenSubroutineCount: 1,
          resolvedEffects: [
            {
              effectId: "fatal-attractor-subroutine",
              kind: "resolve_subroutine",
              visibility: "public",
              side: "runner",
              reason: "ice_subroutine",
              sourceDefinitionId: "onr_v1_242_fatal-attractor",
              amount: 3,
            },
          ],
        },
      },
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "jack-out",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("keeps runner.convert_run_window ownership while jacking out before visible lethal ICE damage", () => {
    resetResidentPlanPortfolioMemory();
    const jackOut = legalAction("jack-out", "runner", "jack_out", "Jack out", {
      credits: 0,
      clicks: 0,
    });
    const continueRun = legalAction(
      "continue",
      "runner",
      "continue_run",
      "Continue",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [continueRun, jackOut]);
    input.playerView.timingPoint = "run.jack_out_window";
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "movement",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("brain-drain", "corp", "ice", {
          definitionId: "onr_classic_007_brain-drain",
          rezzed: true,
          strength: 3,
          subtypes: ["sentry", "black_ice", "ap"],
          effectiveRunQuote: {
            iceInstanceId: "brain-drain",
            iceDefinitionId: "onr_classic_007_brain-drain",
            effectiveStrength: 3,
            subroutines: [
              {
                id: "brain-drain-random-damage",
                type: "random_damage",
                amount: 3,
                damageType: "core",
                sourceDefinitionId: "onr_classic_007_brain-drain",
              },
            ],
          },
        }),
      ]),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: jackOut.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "plan:runner.convert_run_window:",
          ),
          route: {
            actionId: jackOut.actionId,
            stepId: expect.any(String),
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "runner_visible_lethal_ice_damage_requires_jack_out",
        ),
      ]),
    );
  });

  it("keeps visible lethal ICE damage inside run-target ownership instead of restarting the run", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const credit = legalAction(
      "runner.gain_credit.visible-lethal",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { payload: { gainCreditsAmount: 1 } },
    );
    const endTurn = legalAction(
      "runner.end_turn.visible-lethal",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [run, credit, endTurn]);
    input.playerView.own.credits = 0;
    input.playerView.opponent.deckCount = 20;
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1", "runner", "event"),
      visibleCard("grip-2", "runner", "event"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("brain-drain", "corp", "ice", {
          definitionId: "onr_classic_007_brain-drain",
          rezzed: true,
          strength: 3,
          subtypes: ["sentry", "black_ice", "ap"],
          effectiveRunQuote: {
            iceInstanceId: "brain-drain",
            iceDefinitionId: "onr_classic_007_brain-drain",
            effectiveStrength: 3,
            subroutines: [
              {
                id: "brain-drain-random-damage",
                type: "random_damage",
                amount: 3,
                damageType: "core",
                sourceDefinitionId: "onr_classic_007_brain-drain",
              },
            ],
          },
        }),
      ]),
      server("archives"),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets,
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.economy",
        planFirstDecision: {
          route: { actionId: credit.actionId },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "plan_portfolio_blocked:plan:runner.pressure_central:central%3Ard",
        ),
      ]),
    );
  });

  it("keeps a safety-aborted server plan blocked until the Runner develops its route", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.stateVersion = 21;
    input.playerView.own.credits = 0;
    input.eventTail = [
      {
        eventId: "corp-turn-ended",
        type: "end_turn",
        stateVersionBefore: 16,
        stateVersionAfter: 17,
        stateHashAfter: "fnv1a:corp-turn-ended",
        visibilityClass: "private_to_side",
        publicPayload: { actor: "corp", actionType: "end_turn" },
      },
      {
        eventId: "run-start",
        type: "start_run",
        stateVersionBefore: 17,
        stateVersionAfter: 18,
        stateHashAfter: "fnv1a:run-start",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        },
      },
      {
        eventId: "fatal-attractor-fired",
        type: "continue_run",
        stateVersionBefore: 18,
        stateVersionAfter: 19,
        stateHashAfter: "fnv1a:fatal-attractor-fired",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "continue_run",
          sourceDefinitionId: "onr_v1_242_fatal-attractor",
          unbrokenSubroutineCount: 1,
          resolvedEffects: [
            {
              effectId: "fatal-attractor-subroutine",
              kind: "resolve_subroutine",
              visibility: "public",
              side: "runner",
              reason: "ice_subroutine",
              sourceDefinitionId: "onr_v1_242_fatal-attractor",
              amount: 3,
            },
          ],
        },
      },
      {
        eventId: "safety-abort",
        type: "jack_out",
        stateVersionBefore: 19,
        stateVersionAfter: 20,
        stateHashAfter: "fnv1a:safety-abort",
        visibilityClass: "private_to_side",
        publicPayload: { actor: "runner", actionType: "jack_out" },
      },
    ];
    const target = {
      ...safeRuntimeRunTarget("run-remote", "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      score: 400,
    };

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [target],
      }).chooseSemanticRuntimeAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("uses the current Remote route quote instead of a hidden same-turn no-access cadence", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.stateVersion = 22;
    input.playerView.turnSerial = 9;
    run.expiresAtStateVersion = 22;
    credit.expiresAtStateVersion = 22;
    input.playerView.own.credits = 5;
    input.playerView.servers = [server("remote_1")];
    input.eventTail = [
      {
        eventId: "remote-run-start-no-access",
        type: "start_run",
        stateVersionBefore: 20,
        stateVersionAfter: 21,
        turnSerial: 9,
        stateHashAfter: "fnv1a:remote-run-start-no-access",
        visibilityClass: "public",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        },
      },
      {
        eventId: "remote-run-jack-out",
        type: "jack_out",
        stateVersionBefore: 21,
        stateVersionAfter: 22,
        turnSerial: 9,
        stateHashAfter: "fnv1a:remote-run-jack-out",
        visibilityClass: "public",
        publicPayload: { actor: "runner", actionType: "jack_out" },
      },
    ];
    const reachableTarget = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      scoreThreat: true,
      score: 400,
    };
    const blockedTarget = {
      ...reachableTarget,
      pathPassability: "blocked_missing_coverage" as const,
      routeQuote: {
        ...reachableTarget.routeQuote,
        reachability: "no_access" as const,
        noAccessReason: "missing_breaker_coverage",
        evidence: [
          "route_reachability:no_access",
          "route_funding_gap:0",
          "route_unknown_ice_count:0",
        ],
      },
      recommendation: "find_breaker_first" as const,
      evidence: [
        "path_passability:blocked_missing_coverage",
        "missing_breaker_coverage:sentry",
      ],
    };
    let routeIsBlocked = true;

    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        routeIsBlocked ? blockedTarget : reachableTarget,
      ],
    });
    const blockedDecision = context.chooseSemanticRuntimeAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });

    expect(blockedDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          turnPlanning: {
            coverage: {
              status: "pass",
              coveragePercent: 100,
            },
          },
        },
      },
    });

    routeIsBlocked = false;
    resetResidentPlanPortfolioMemory();
    expect(
      context.chooseSemanticRuntimeAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
  });

  it("does not let a safety-aborted run parent authorize higher-class funding", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.stateVersion = 21;
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 4;
    input.eventTail = [
      {
        eventId: "run-start",
        type: "start_run",
        stateVersionBefore: 17,
        stateVersionAfter: 18,
        stateHashAfter: "fnv1a:run-start",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        },
      },
      {
        eventId: "fatal-attractor-fired",
        type: "continue_run",
        stateVersionBefore: 18,
        stateVersionAfter: 19,
        stateHashAfter: "fnv1a:fatal-attractor-fired",
        visibilityClass: "private_to_side",
        publicPayload: {
          actor: "runner",
          actionType: "continue_run",
          sourceDefinitionId: "onr_v1_242_fatal-attractor",
        },
      },
      {
        eventId: "safety-abort",
        type: "jack_out",
        stateVersionBefore: 19,
        stateVersionAfter: 20,
        stateHashAfter: "fnv1a:safety-abort",
        visibilityClass: "private_to_side",
        publicPayload: { actor: "runner", actionType: "jack_out" },
      },
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_unpayable" as const,
      creditsAfterRun: -3,
      recommendation: "gain_credits_first" as const,
      score: 400,
      routeQuote: {
        reachability: "no_access" as const,
        knownCost: 3,
        guaranteedKnownCost: 3,
        availableCredits: 0,
        fundingGap: 3,
        unknownIceCount: 0,
        effects: [],
        conditionalReasons: [],
        evidence: ["test_safety_blocked_funding_gap"],
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {
      runnerTurnPlannerMode: "legacy_compare",
    });

    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain("plan_priority_class:P6");
    expect((decision.evidence ?? []).join("\n")).not.toContain(
      "run-support:remote",
    );
  });

  it("carries a known HQ trash commitment from the pressure plan into the access step", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      {
        credits: 0,
        clicks: 1,
      },
      {
        payload: { serverId: "hq" },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const runInput = aiInput("runner", [run, credit]);
    runInput.playerView.opponent.deckCount = 10;
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      accessPayoff: "trash_affordable" as const,
      knownAccessState: "known_payoff" as const,
      multiaccessAvailable: true,
      score: 300,
      evidence: [
        "central_memory_payoff:trash_affordable",
        "hq_known_trash_definition:onr_v1_330_krumz",
        "hq_known_trash_cost:2",
      ],
    };
    const context = liveContext({
      evaluateRunnerRunTargets: (params: {
        input: { legalActions: Array<{ type: string }> };
      }) =>
        params.input.legalActions.some((action) => action.type === "start_run")
          ? [target]
          : [],
    });

    expect(context.chooseSemanticRuntimeAction(runInput, {})).toMatchObject({
      actionId: "run-hq",
      reasonCode: "plan_first.runner.pressure_central",
    });

    const trash = legalAction(
      "trash-krumz",
      "runner",
      "trash_accessed_card",
      "Trash Krumz",
      { credits: 2, clicks: 0 },
      { source: "corp-krumz" },
    );
    const decline = legalAction(
      "decline",
      "runner",
      "decline_trash",
      "Decline trash",
      { credits: 0, clicks: 0 },
    );
    const accessInput = aiInput("runner", [decline, trash]);
    accessInput.playerView.stateVersion = 2;
    accessInput.playerView.timingPoint = "access.resolve_card";
    accessInput.playerView.run = {
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      successful: true,
    };
    accessInput.playerView.servers = [
      server(
        "hq",
        [],
        [
          visibleCard("corp-krumz", "corp", "asset", {
            definitionId: "onr_v1_330_krumz",
          }),
        ],
      ),
    ];

    expect(
      context.chooseSemanticRuntimeAction(accessInput, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "trash-krumz",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("creates a structured access-step trash commitment after an information run reveals a relevant card", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const runInput = aiInput("runner", [run]);
    runInput.playerView.opponent.deckCount = 10;
    const context = liveContext({
      evaluateRunnerRunTargets: (params: {
        input: { legalActions: Array<{ type: string }> };
      }) =>
        params.input.legalActions.some((action) => action.type === "start_run")
          ? [safeRuntimeRunTarget(run.actionId, "hq")]
          : [],
    });

    expect(context.chooseSemanticRuntimeAction(runInput, {})).toMatchObject({
      actionId: "run-hq",
      reasonCode: "plan_first.runner.pressure_central",
    });

    const trash = legalAction(
      "trash-krumz",
      "runner",
      "trash_accessed_card",
      "Trash Krumz",
      { credits: 2, clicks: 0 },
      { source: "corp-krumz" },
    );
    const decline = legalAction(
      "decline",
      "runner",
      "decline_trash",
      "Decline trash",
      { credits: 0, clicks: 0 },
    );
    const accessInput = aiInput("runner", [decline, trash]);
    const krumz = visibleCard("corp-krumz", "corp", "asset", {
      definitionId: "onr_v1_330_krumz",
      counters: { bit: 1 },
    });
    accessInput.playerView.stateVersion = 2;
    accessInput.playerView.own.credits = 10;
    accessInput.playerView.timingPoint = "access.resolve_card";
    accessInput.playerView.run = {
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      accessedCard: krumz,
      successful: true,
    };
    accessInput.playerView.servers = [server("hq", [], [krumz])];

    expect(
      context.chooseSemanticRuntimeAction(accessInput, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    ).toMatchObject({
      actionId: "trash-krumz",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
  });

  it("declines a high-impact stored-economy trash that would break the current reserve", () => {
    resetResidentPlanPortfolioMemory();
    const trash = legalAction(
      "trash-visible-campaign",
      "runner",
      "trash_accessed_card",
      "Trash visible campaign",
      { credits: 4, clicks: 0 },
      {
        source: "visible-campaign",
        payload: { accessTrashTotalCost: 4 },
      },
    );
    const decline = legalAction(
      "decline-visible-campaign",
      "runner",
      "decline_trash",
      "Decline trash",
      { credits: 0, clicks: 0 },
    );
    const input = aiInput("runner", [decline, trash]);
    const campaign = visibleCard("visible-campaign", "corp", "asset", {
      definitionId: "onr_v1_309_bbs-whispering-campaign",
      counters: { bit: 14 },
    });
    input.playerView.own.credits = 5;
    input.playerView.timingPoint = "access.resolve_card";
    input.playerView.run = {
      attackedServerId: "remote_1",
      phase: "access",
      position: { kind: "server", serverId: "remote_1" },
      accessedCard: campaign,
      successful: true,
    };
    input.playerView.servers = [server("remote_1", [], [campaign])];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: decline.actionId,
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          route: { actionId: decline.actionId },
          leafExecutorInstanceId: expect.stringContaining(
            "runner.convert_run_window",
          ),
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:convert_active_run_window",
      ]),
    );
  });

  it("admits a visibly known agenda remote directly as a witnessed contest plan", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const draw = legalAction("draw", "runner", "draw_card", "Draw", {
      credits: 0,
      clicks: 1,
    });
    const input = aiInput("runner", [run, draw]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("agenda", "corp", "agenda")]),
    ];

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          ...safeRuntimeRunTarget(run.actionId, "remote_1"),
          targetKind: "remote",
          accessTargetKind: "remote",
          runActionProjection: {
            ...safeRuntimeRunTarget(run.actionId, "remote_1")
              .runActionProjection,
            targetKind: "remote",
          },
          scoreThreat: true,
          accessPayoff: "agenda",
          knownAccessState: "known_payoff",
          score: 1_000,
        },
      ],
    }).chooseSemanticRuntimeAction(input, {});
    expect(decision).toMatchObject({
      actionId: "run-remote",
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.contest_remote" },
    });
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:transient_plan_signal_plan:runner.contest_remote",
    );
  });

  it("reads a known Archives agenda from the Archives server projection", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "archives" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.opponent.discardCount = 1;
    input.playerView.opponent.discardCards = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server(
        "archives",
        [],
        [visibleCard("discarded-agenda", "corp", "agenda")],
      ),
    ];

    const reachableArchives = {
      ...safeRuntimeRunTarget(run.actionId, "archives"),
      targetKind: "archives" as const,
      accessTargetKind: "archives" as const,
      accessPayoff: "agenda" as const,
      knownAccessState: "known_payoff" as const,
      score: 1_000,
      evidence: ["visible_known_agenda_in_archives"],
    };
    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [reachableArchives],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "run-archives",
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
  });

  it("does not invent Archives reachability for a visible agenda behind a blocked exact route", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-blocked-archives",
      "runner",
      "start_run",
      "Run blocked Archives",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "archives" } },
    );
    const credit = legalAction(
      "credit-after-blocked-archives",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 10;
    input.playerView.opponent.discardCount = 1;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server(
        "archives",
        [],
        [visibleCard("blocked-discarded-agenda", "corp", "agenda")],
      ),
    ];
    const blockedArchives = {
      ...safeRuntimeRunTarget(run.actionId, "archives"),
      targetKind: "archives" as const,
      accessTargetKind: "archives" as const,
      accessPayoff: "agenda" as const,
      knownAccessState: "known_payoff" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      score: -320,
      evidence: [
        "visible_known_agenda_in_archives",
        "missing_coverage:ap|sentry",
      ],
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [blockedArchives],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) =>
          instance.moduleId === "runner.pressure_central" &&
          instance.target?.id === "archives",
      ),
    ).toMatchObject({
      viability: "blocked",
      moduleState: {
        signal: {
          reachable: false,
          evidenceCode: "visible_known_agenda_in_archives",
        },
      },
    });
  });

  it("does not infer an Archives agenda from a non-authoritative discard mirror", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "archives" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 0;
    input.playerView.opponent.discardCount = 0;
    input.playerView.opponent.discardCards = [
      visibleCard("mirror-agenda", "corp", "agenda"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("rejects generic Archives pressure when the visible discard has no agenda", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "archives" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 0;
    input.playerView.opponent.discardCount = 1;
    input.playerView.opponent.discardCards = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server(
        "archives",
        [],
        [visibleCard("discarded-operation", "corp", "operation")],
      ),
    ];
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          actionId: "run-archives",
          targetKind: "archives",
          targetServerId: "archives",
          pathPassability: "reachable",
          recommendation: "run_if_free",
          score: 50,
          multiaccessAvailable: false,
          knownAccessState: "unknown",
          evidence: ["test_generic_archives_pressure"],
        },
      ],
    });

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("does not let a high action score invent Archives payoff without visible evidence", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-archives",
      "runner",
      "start_run",
      "Run Archives",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "archives" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const end = legalAction(
      "end",
      "runner",
      "end_turn",
      "End turn",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    const input = aiInput("runner", [run, credit, end]);
    input.playerView.own.credits = 9;
    input.playerView.own.agendaPoints = 6;
    input.playerView.opponent.deckCount = 30;
    input.playerView.opponent.discardCount = 0;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        {
          actionId: "run-archives",
          targetKind: "archives",
          accessTargetKind: "archives",
          targetServerId: "archives",
          pathPassability: "reachable",
          recommendation: "run_if_free",
          score: 160,
          multiaccessAvailable: false,
          knownAccessState: "unknown",
          accessPayoff: "unknown",
          evidence: ["test_high_score_without_archives_payoff"],
        },
      ],
    });

    expect(context.chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("rejects HQ pressure when the current hand is fully known without payoff", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);
    input.playerView.own.credits = 0;

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          runTargetEvaluation({
            actionId: "run-hq",
            targetServerId: "hq",
            knownAccessState: "known_no_current_payoff",
            score: 300,
          }),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
    });
  });

  it("keeps HQ pressure when current memory contains a payoff", () => {
    resetResidentPlanPortfolioMemory();
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [run, credit]);

    expect(
      liveContext({
        evaluateRunnerRunTargets: () => [
          runTargetEvaluation({
            actionId: "run-hq",
            targetServerId: "hq",
            knownAccessState: "known_payoff",
            score: 300,
          }),
        ],
        buildRunnerEconomyPosture: () => ({
          minimumCreditFloor: 0,
          desiredCreditReserve: 0,
          fundingNeed: false,
          evidence: [],
        }),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "run-hq",
      reasonCode: "plan_first.runner.pressure_central",
    });
  });

  it("does not invoke legacy semantic choice or tactical override selection", () => {
    resetResidentPlanPortfolioMemory();
    const legacyChoices = vi.fn(() => {
      throw new Error("legacy_semantic_selection_invoked");
    });
    const legacyOverride = vi.fn(() => {
      throw new Error("legacy_override_invoked");
    });
    const action = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [action]);
    input.playerView.own.credits = 0;
    const context = liveContext({
      semanticRuntimeChoices: legacyChoices,
      bestSemanticRuntimeChoiceForTacticalPlanOverride: legacyOverride,
    });

    expect(context.chooseSemanticRuntimeAction(input, {}).actionId).toBe(
      "credit",
    );
    expect(legacyChoices).not.toHaveBeenCalled();
    expect(legacyOverride).not.toHaveBeenCalled();
  });

  it("does not search another breaker definition after all breaker classes are already covered", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [temple, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 3;
    input.playerView.own.rig = fullNonNoisyBreakerRig();
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "redundant-breaker-program-search",
      side: "runner",
      cards: [
        { cardId: "onr_v1_114_temple-microcode-outlet", quantity: 1 },
        { cardId: "onr_v1_047_pile-driver", quantity: 1 },
      ],
    });

    const decision = liveContext({
      runnerStrategicIntentForInput: recurringProgramSearchIntent,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === "play-temple",
      )?.whyNot,
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "runner_program_search_has_no_bound_useful_target",
        ),
      ]),
    );
  });

  it("selects the Shell Traders source install through runner.develop_board_and_hand", () => {
    resetResidentPlanPortfolioMemory();
    const installShellTraders = legalAction(
      "install-shell-traders-source",
      "runner",
      "install_card",
      "The Shell Traders installieren",
      { credits: 0, clicks: 1 },
      {
        source: "shell-traders-hand",
        payload: {
          cardId: "shell-traders-hand",
          cardDefinitionId: "onr_v1_176_the-shell-traders",
        },
      },
    );
    const credit = legalAction(
      "credit-instead-of-shell-traders",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [installShellTraders, credit]);
    input.playerView.own.credits = 8;
    input.playerView.own.clicks = 4;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("shell-traders-hand", "runner", "resource", {
        definitionId: "onr_v1_176_the-shell-traders",
        title: "The Shell Traders",
        installCost: 0,
      }),
      visibleCard("rent-i-con-hand", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        installCost: 5,
        memoryCost: 2,
        subtypes: ["icebreaker"],
      }),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "shell-traders-source-install",
      side: "runner",
      cards: [
        { cardId: "onr_v1_176_the-shell-traders", quantity: 3 },
        { cardId: "onr_classic_031_rent-i-con", quantity: 3 },
      ],
    });

    const decision = liveContext({
      deckCapabilitiesForInput: buildDeckCapabilityProfileFromInput,
      runnerStrategicIntentForInput: shellTradersIntent,
      evaluateRunnerHandDevelopment,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        creditReservePolicy: { phase: "opening", contestReserve: 0 },
        fundingNeed: false,
        evidence: ["test_shell_traders_funded"],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installShellTraders.actionId,
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(
      portfolio?.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )?.moduleId,
    ).toBe("runner.develop_board_and_hand");
  });

  it("binds a useful recurring-breaker-economy program before playing the search", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [temple, credit]);
    input.decisionId = "recurring-program-search:1";
    input.playerView.stateVersion = 1;
    input.playerView.own.credits = 5;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.memoryUsed = 3;
    input.playerView.own.rig = fullNonNoisyBreakerRig();
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "recurring-program-search",
      side: "runner",
      cards: [
        { cardId: "onr_v1_114_temple-microcode-outlet", quantity: 1 },
        { cardId: "onr_v1_047_pile-driver", quantity: 1 },
        { cardId: "onr_v1_071_vewy-vewy-quiet", quantity: 2 },
      ],
    });

    const decision = liveContext({
      runnerStrategicIntentForInput: recurringProgramSearchIntent,
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "play-temple",
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor?.moduleId).toBe("runner.develop_board_and_hand");
    expect(
      (
        executor?.moduleState as
          | {
              signal?: {
                programSearchCommitment?: Record<string, unknown>;
              };
            }
          | undefined
      )?.signal?.programSearchCommitment,
    ).toMatchObject({
      sourceCardInstanceId: "temple-card",
      sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
      targetDefinitionId: "onr_v1_071_vewy-vewy-quiet",
      targetPurpose: "recurring_breaker_economy",
      plannedAtStateVersion: 1,
      selectedActionId: "play-temple",
      selectedAtStateVersion: 1,
    });

    const resolve = legalAction(
      "resolve-temple-search",
      "runner",
      "resolve_choice",
      "Choose a program",
      { credits: 0, clicks: 0 },
    );
    const choiceInput = aiInput("runner", [resolve]);
    resolve.expiresAtStateVersion = 2;
    choiceInput.decisionId = "recurring-program-search:2";
    choiceInput.playerView.stateVersion = 2;
    choiceInput.playerView.pendingChoice = {
      choiceId: "recurring-program-search-choice",
      side: "runner",
      kind: "select_cards",
      source:
        "p3_37.search_stack_to_grip:temple-card:onr_v1_114_temple-microcode-outlet:program:reveal:shuffle:2",
      sourceCardInstanceId: "temple-card",
      sourceCardDefinitionId: "onr_v1_114_temple-microcode-outlet",
      prompt: "Choose a program",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "choose-pile-driver",
          label: "Pile Driver",
          card: visibleCard("pile-driver-option", "runner", "program", {
            definitionId: "onr_v1_047_pile-driver",
            subtypes: ["icebreaker", "fracter"],
          }),
        },
        {
          id: "choose-vewy",
          label: "Vewy Vewy Quiet",
          card: visibleCard("vewy-option", "runner", "program", {
            definitionId: "onr_v1_071_vewy-vewy-quiet",
            installCost: 4,
            memoryCost: 1,
          }),
        },
      ],
      cardSearchPresentation: {
        sourceZone: "stack",
        destination: "grip",
        reveal: "hidden",
        shuffleAfter: true,
        selectableFilter: "program",
        showNonMatchingCards: false,
      },
    };
    expect(
      selectedChoicesForDecision(choiceInput, resolve, {
        evaluateCorpOpeningHand: () => ({ decision: "keep" }),
        evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
        discardKeepScore: () => ({ total: 0 }),
        selectedRunnerProgramInstallTrashOptionIds: () => [],
        selectedRunnerForcedProgramTrashOptionIds: () => [],
        selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
        extractAiFeatures: () => ({
          credits: 4,
          memoryRemaining: 1,
          hasInstalledNonNoisyIcebreaker: true,
          rigRoles: new Set([
            "breaker_fracter",
            "breaker_decoder",
            "breaker_killer",
          ]),
          rigDefinitionIds: new Set([
            "onr_proteus_083_corrosion",
            "onr_v1_014_codecracker",
            "onr_v1_040_loony-goon",
          ]),
        }),
        rolesForCardId: (definitionId) =>
          definitionId === "onr_v1_071_vewy-vewy-quiet"
            ? ["recurring_non_noisy_breaker_credits"]
            : ["breaker_fracter"],
        effectsForCardId: () => [],
      } as Parameters<typeof selectedChoicesForDecision>[2]),
    ).toEqual({
      choiceId: "recurring-program-search-choice",
      selectedOptionIds: ["choose-vewy"],
    });
  });

  it("routes a universal breaker tutor through an exact coverage-search continuation", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [temple, credit]);
    input.decisionId = "universal-coverage-search:1";
    input.playerView.stateVersion = 1;
    input.playerView.winner = null;
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];

    const decision = liveContext({
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas",
        setupEngine: ["runner.rig_first"],
      }),
      deckCapabilitiesForInput: () => universalCoverageSearchCapabilities(true),
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 0,
        fundingNeed: false,
        evidence: [],
      }),
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "play-temple",
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^plan_step_capability:search_answer_breaker_/),
      ]),
    );
    const portfolio = residentPlanPortfolioSnapshot(input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    const moduleState = executor?.moduleState as
      | {
          phase?: string;
          selectedSearchActionId?: string;
          gap?: {
            directSearchActionIds?: string[];
            rejectedSearchActionIds?: string[];
            drawForAnswerActionIds?: string[];
          };
        }
      | undefined;
    expect(moduleState).toMatchObject({
      phase: "search_answer",
      selectedSearchActionId: "play-temple",
      gap: {
        directSearchActionIds: ["play-temple"],
        rejectedSearchActionIds: [],
      },
    });
    expect(moduleState?.gap?.drawForAnswerActionIds).not.toContain(
      "play-temple",
    );

    const resolve = legalAction(
      "resolve-temple-search",
      "runner",
      "resolve_choice",
      "Choose a program",
      { credits: 0, clicks: 0 },
    );
    const choiceInput = aiInput("runner", [resolve]);
    choiceInput.decisionId = "universal-coverage-search:2";
    choiceInput.playerView.stateVersion = 2;
    choiceInput.playerView.winner = null;
    choiceInput.playerView.pendingChoice = {
      choiceId: "temple-search-choice",
      side: "runner",
      kind: "select_cards",
      source:
        "p3_37.search_stack_to_grip:temple-card:onr_v1_114_temple-microcode-outlet:program:reveal:shuffle:2",
      sourceCardInstanceId: "temple-card",
      sourceCardDefinitionId: "onr_v1_114_temple-microcode-outlet",
      prompt: "Choose a program",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "choose-blink",
          label: "Blink",
          card: visibleCard("blink-option", "runner", "program", {
            definitionId: "onr_v1_007_blink",
          }),
        },
        {
          id: "choose-economy",
          label: "Economy Program",
          card: visibleCard("economy-option", "runner", "program", {
            definitionId: "test-economy-program",
          }),
        },
      ],
    };
    expect(
      selectedChoicesForDecision(choiceInput, resolve, {
        evaluateCorpOpeningHand: () => ({ decision: "keep" }),
        evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
        discardKeepScore: () => ({ total: 0 }),
        selectedRunnerProgramInstallTrashOptionIds: () => [],
        selectedRunnerForcedProgramTrashOptionIds: () => [],
        selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
        extractAiFeatures: () => ({
          credits: 0,
          memoryRemaining: 4,
          hasInstalledNonNoisyIcebreaker: false,
          rigRoles: new Set(),
          rigDefinitionIds: new Set(),
        }),
        rolesForCardId: (definitionId) =>
          definitionId === "onr_v1_007_blink" ? ["breaker_universal"] : [],
        effectsForCardId: () => [],
      } as Parameters<typeof selectedChoicesForDecision>[2]),
    ).toEqual({
      choiceId: "temple-search-choice",
      selectedOptionIds: ["choose-blink"],
    });
  });

  it("binds Black Widow to the cheapest known HQ path even while the immediate run is unfunded", () => {
    resetResidentPlanPortfolioMemory();
    const coyoteInstall = legalAction(
      "install-black-widow-coyote",
      "runner",
      "install_card",
      "Black Widow: Coyote wählen",
      { credits: 3, clicks: 1 },
      {
        source: "black-widow",
        payload: {
          cardId: "black-widow",
          selectedCardId: "coyote",
        },
      },
    );
    const mastermindInstall = legalAction(
      "install-black-widow-mastermind",
      "runner",
      "install_card",
      "Black Widow: Mastermind wählen",
      { credits: 3, clicks: 1 },
      {
        source: "black-widow",
        payload: {
          cardId: "black-widow",
          selectedCardId: "mastermind",
        },
      },
    );
    for (const action of [coyoteInstall, mastermindInstall]) {
      action.targetRequirements = [
        {
          id: "targetIce",
          kind: "card",
          side: "corp",
          zoneScope: ["corp.servers.ice"],
          visibility: "public",
        },
      ];
    }
    const runHq = legalAction(
      "runner.start_run.hq",
      "runner",
      "start_run",
      "Run auf HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [coyoteInstall, mastermindInstall, runHq]);
    input.decisionId = "black-widow-mastermind-coverage:1";
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [
      visibleCard("black-widow", "runner", "program", {
        definitionId: "onr_proteus_080_black-widow",
        installCost: 3,
        subtypes: ["icebreaker", "killer"],
      }),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "black-widow-mastermind-coverage",
      side: "runner",
      cards: [{ cardId: "onr_proteus_080_black-widow", quantity: 1 }],
    });
    input.playerView.servers = [
      server("hq", [
        visibleCard("mastermind", "corp", "ice", {
          definitionId: "onr_proteus_030_mastermind",
          rezzed: true,
          strength: 2,
          subtypes: ["sentry"],
          effectiveRunQuote: {
            iceInstanceId: "mastermind",
            iceDefinitionId: "onr_proteus_030_mastermind",
            effectiveStrength: 2,
            subroutines: [
              {
                id: "mastermind:damage",
                type: "do_damage",
                amount: 2,
                unbrokenRunEffect: { causesDamageOrProgramTrash: true },
              },
              { id: "mastermind:etr", type: "end_the_run" },
            ],
          },
        }),
        visibleCard("coyote", "corp", "ice", {
          definitionId: "onr_proteus_016_coyote",
          rezzed: true,
          strength: 3,
          subtypes: ["sentry"],
          effectiveRunQuote: {
            iceInstanceId: "coyote",
            iceDefinitionId: "onr_proteus_016_coyote",
            effectiveStrength: 3,
            subroutines: [
              {
                id: "coyote:strength",
                type: "set_run_future_strength_bonus",
                amount: 1,
                unbrokenRunEffect: { increasesFutureIceStrength: 1 },
              },
            ],
          },
        }),
        visibleCard("coyote-2", "corp", "ice", {
          definitionId: "onr_proteus_016_coyote",
          rezzed: true,
          strength: 3,
          subtypes: ["sentry"],
          effectiveRunQuote: {
            iceInstanceId: "coyote-2",
            iceDefinitionId: "onr_proteus_016_coyote",
            effectiveStrength: 3,
            subroutines: [
              {
                id: "coyote-2:strength",
                type: "set_run_future_strength_bonus",
                amount: 1,
                unbrokenRunEffect: { increasesFutureIceStrength: 1 },
              },
            ],
          },
        }),
      ]),
    ];
    const target = {
      ...safeRuntimeRunTarget("runner.start_run.hq", "hq"),
      targetKind: "central" as const,
      accessTargetKind: "hq" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: false,
      score: 200,
      evidence: ["missing_coverage:breaker_sentry"],
    };
    const sanitized = buildAiDecisionInputDto({
      side: input.side,
      playerView: input.playerView,
      eventTail: input.eventTail,
      legalActions: input.legalActions,
      difficulty: input.difficulty,
      seed: input.seed,
      decisionId: input.decisionId,
      actionNumber: input.actionNumber,
      profileId: input.profileId,
    });
    input.legalActions = sanitized.legalActions;
    input.playerView.legalActions = sanitized.legalActions;

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "install-black-widow-mastermind",
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
  });

  // Follow-up regression for act-2026-05-17-runner-ai-breaker-acquisition-strategy.
  it("funds and installs a visible cheaper breaker for an exact known path", () => {
    resetResidentPlanPortfolioMemory();
    const install = legalAction(
      "install-ramming-piston",
      "runner",
      "install_card",
      "Install Ramming Piston",
      { credits: 4, clicks: 1 },
      { source: "ramming-piston" },
    );
    const run = costIneffectiveWallRunAction();
    const credit = costIneffectiveCoverageCreditAction();
    const input = costIneffectiveWallInput([run, credit]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [costEffectiveWallBreakerInHand()];
    const context = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_hand"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    });

    const fundingDecision = context.chooseSemanticRuntimeAction(input, {});

    expect(fundingDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(fundingDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:fund_install_breaker_wall",
        "plan_assessment_evidence:cost_ineffective_coverage:hq:10",
      ]),
    );
    const fundingCoverage = residentPlanPortfolioSnapshot(
      input,
    )?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(fundingCoverage?.moduleState).toMatchObject({
      phase: "fund_answer",
      gap: {
        needKind: "cost_ineffective_coverage",
        targetServerId: "hq",
        requesterModuleId: "runner.pressure_central",
        currentKnownPathCost: 10,
        currentPathFundingGap: 6,
        recoveryMode: "install_visible_answer",
        fundingGap: 1,
      },
    });

    const funded = structuredClone(input);
    funded.decisionId = "cost-effective-coverage-funded:2";
    funded.playerView.stateVersion = 2;
    funded.playerView.own.credits = 4;
    funded.playerView.own.clicks = 2;
    install.expiresAtStateVersion = 2;
    run.expiresAtStateVersion = 2;
    funded.legalActions = [install, run];
    funded.playerView.legalActions = funded.legalActions;

    const installDecision = context.chooseSemanticRuntimeAction(funded, {});

    expect(installDecision).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(installDecision.evidence).toContain(
      "plan_step_capability:install_breaker_wall",
    );
    const installCoverage = residentPlanPortfolioSnapshot(
      funded,
    )?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(installCoverage?.moduleState).toMatchObject({
      phase: "install_answer",
      gap: { installActionIds: [install.actionId] },
    });
  });

  it("binds burst economy, breaker install, and run as one urgent remote conversion", () => {
    resetResidentPlanPortfolioMemory();
    const livewire = legalAction(
      "play-livewire-urgent-remote",
      "runner",
      "play_event",
      "Play Livewire's Contacts",
      { credits: 0, clicks: 1 },
      {
        source: "livewire-card",
        payload: {
          cardId: "livewire-card",
          sourceDefinitionId: "onr_v1_097_livewires-contacts",
          gainCreditsAmount: 3,
        },
      },
    );
    const install = legalAction(
      "install-corrosion-urgent-remote",
      "runner",
      "install_card",
      "Install Corrosion",
      { credits: 3, clicks: 1 },
      {
        source: "corrosion-card",
        payload: {
          cardId: "corrosion-card",
          sourceDefinitionId: "onr_proteus_083_corrosion",
        },
      },
    );
    const run = legalAction(
      "run-urgent-remote",
      "runner",
      "start_run",
      "Run Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "credit-urgent-remote",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const corrosion = visibleCard("corrosion-card", "runner", "program", {
      definitionId: "onr_proteus_083_corrosion",
      title: "Corrosion",
      installCost: 3,
      strength: 0,
      subtypes: ["icebreaker", "worm"],
      rulesText: "[0]: Break wall subroutine. [1]: +1 strength",
    });
    const input = aiInput("runner", [livewire, install, run, credit]);
    input.decisionId = "urgent-coverage-conversion:1";
    input.playerView.turnSerial = 15;
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      corrosion,
      visibleCard("livewire-card", "runner", "event", {
        definitionId: "onr_v1_097_livewires-contacts",
        title: "Livewire's Contacts",
      }),
    ];
    input.playerView.servers = [
      server(
        "remote_1",
        [
          quotedFixtureIce({
            instanceId: "urgent-remote-wall",
            definitionId: "onr_v1_279_wall-of-static",
            title: "Wall of Static",
            strength: 2,
            subtypes: ["wall"],
          }),
        ],
        [
          {
            ...visibleCard("urgent-remote-root", "corp", "agenda", {
              advancementCounters: 2,
            }),
            known: false,
          },
        ],
      ),
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const blockedTarget = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      targetServerId: "remote_1",
      targetKind: "remote" as const,
      accessServerId: "remote_1",
      accessTargetKind: "remote" as const,
      accessPayoff: "score_threat" as const,
      knownAccessState: "unknown" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 500,
      runActionProjection: {
        ...safeRuntimeRunTarget(run.actionId, "hq").runActionProjection,
        targetServerId: "remote_1",
        targetKind: "remote" as const,
        accessServerId: "remote_1",
      },
      evidence: ["missing_coverage:breaker_wall"],
    };
    expect(
      buildActionSemanticCandidates(input).find(
        (candidate) => candidate.actionId === livewire.actionId,
      ),
    ).toMatchObject({
      semanticActionType: "economy.gain_credit",
      economyProjection: {
        kind: "immediate_liquid",
        timing: "immediate",
        creditRestriction: "general",
        netLiquidCreditGain: 3,
        reliability: "guaranteed",
      },
    });
    expect(
      assessKnownRezzedIcePath(
        input.playerView.servers[0]!.ice,
        [corrosion],
        Number.MAX_SAFE_INTEGER,
        input.playerView.servers[0]!.root,
        input.playerView.opponent.credits,
      ),
    ).toMatchObject({
      blocked: false,
      canReachAccess: true,
      visibleBreakCost: 2,
    });
    let coverageInstalled = false;
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        coverageInstalled
          ? {
              ...blockedTarget,
              pathPassability: "reachable" as const,
              pathCost: 2,
              creditsAfterRun: 1,
              recommendation: "run_now" as const,
              routeQuote: {
                ...blockedTarget.routeQuote,
                reachability: "guaranteed_access" as const,
                knownCost: 2,
                guaranteedKnownCost: 2,
                availableCredits: 3,
                fundingGap: 0,
              },
              evidence: ["test_urgent_remote_reachable"],
            }
          : blockedTarget,
      ],
    });

    const fundingDecision = context.chooseSemanticRuntimeAction(input, {});
    expect(fundingDecision).toMatchObject({
      actionId: livewire.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(fundingDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        "plan_priority_reason:survival_threat",
        "plan_step_capability:fund_install_breaker_wall",
        "plan_priority_delegated_from:plan:runner.contest_remote:remote%3Aremote_1",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "fund_answer",
      gap: {
        requesterModuleId: "runner.contest_remote",
        fundingGap: 3,
        sameTurnRunConversion: {
          targetRunActionId: run.actionId,
          requiredCredits: 6,
          requiredClicksAfterFunding: 2,
          projectedKnownPathCost: 2,
          postRunCreditFloor: 1,
        },
      },
    });

    const funded = structuredClone(input);
    funded.playerView.stateVersion = 2;
    funded.playerView.own.credits = 6;
    funded.playerView.own.clicks = 3;
    funded.playerView.own.gripOrHq = [corrosion];
    funded.legalActions = [install, run, credit];
    funded.playerView.legalActions = funded.legalActions;
    for (const action of funded.legalActions) action.expiresAtStateVersion = 2;
    expect(context.chooseSemanticRuntimeAction(funded, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });

    coverageInstalled = true;
    const installed = structuredClone(funded);
    installed.playerView.stateVersion = 3;
    installed.playerView.own.credits = 3;
    installed.playerView.own.clicks = 2;
    installed.playerView.own.rig = [corrosion];
    installed.playerView.own.gripOrHq = [];
    installed.legalActions = [run, credit];
    installed.playerView.legalActions = installed.legalActions;
    for (const action of installed.legalActions) {
      action.expiresAtStateVersion = 3;
    }
    expect(context.chooseSemanticRuntimeAction(installed, {})).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
  });

  it("keeps an urgent remote as root while funding a not-yet-legal breaker install", () => {
    resetResidentPlanPortfolioMemory();
    const runRemote = legalAction(
      "run-urgent-code-gate-remote",
      "runner",
      "start_run",
      "Run Remote 1",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const runHq = legalAction(
      "run-hq-instead-of-urgent-remote",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "credit-for-urgent-code-gate-remote",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const install = legalAction(
      "install-wizards-book-for-urgent-remote",
      "runner",
      "install_card",
      "Install Wizard's Book",
      { credits: 5, clicks: 1 },
      {
        source: "wizards-book-card",
        payload: {
          cardId: "wizards-book-card",
          sourceDefinitionId: "onr_v1_073_wizards-book",
        },
      },
    );
    const wizardsBook = visibleCard("wizards-book-card", "runner", "program", {
      definitionId: "onr_v1_073_wizards-book",
      title: "Wizard's Book",
      installCost: 5,
      memoryCost: 1,
      strength: 2,
      subtypes: ["icebreaker"],
      rulesText: "[0]: Break code gate subroutine. [2]: +1 strength.",
    });
    const input = aiInput("runner", [runRemote, runHq, credit]);
    input.decisionId = "urgent-credit-install-rerun:1";
    input.playerView.turnSerial = 9;
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 3;
    input.playerView.own.memoryUsed = 2;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.gripOrHq = [wizardsBook];
    input.playerView.servers = [
      server(
        "remote_1",
        [
          quotedFixtureIce({
            instanceId: "urgent-remote-code-gate",
            definitionId: "onr_v1_261_quandary",
            title: "Quandary",
            strength: 2,
            subtypes: ["code_gate"],
          }),
        ],
        [
          {
            ...visibleCard("urgent-hidden-remote-root", "corp", "agenda", {
              advancementCounters: 1,
            }),
            known: false,
          },
        ],
      ),
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const blockedRemote = {
      ...safeRuntimeRunTarget(runRemote.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      accessPayoff: "score_threat" as const,
      knownAccessState: "unknown" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 500,
      evidence: ["missing_coverage:breaker_code_gate"],
    };
    let coverageInstalled = false;
    const context = liveContext({
      evaluateRunnerRunTargets: () => [
        coverageInstalled
          ? {
              ...blockedRemote,
              pathPassability: "reachable" as const,
              pathCost: 0,
              creditsAfterRun: 0,
              recommendation: "gain_credits_first" as const,
              fundingNeed: {
                reason: "post_run_floor_gap" as const,
                routeFundingGap: 0,
                postRunFloorGap: 1,
                protectedLiquidReserve: 1,
              },
              routeQuote: {
                ...blockedRemote.routeQuote,
                reachability: "guaranteed_access" as const,
                knownCost: 0,
                guaranteedKnownCost: 0,
                availableCredits: 0,
                fundingGap: 0,
              },
              evidence: ["test_urgent_remote_reachable_after_install"],
            }
          : blockedRemote,
        safeRuntimeRunTarget(runHq.actionId, "hq"),
      ],
    });

    const fundingDecision = context.chooseSemanticRuntimeAction(input, {});

    expect(fundingDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(fundingDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        "plan_priority_reason:survival_threat",
        "plan_step_capability:fund_install_breaker_code_gate",
        "plan_priority_delegated_from:plan:runner.contest_remote:remote%3Aremote_1",
      ]),
    );
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: expect.stringContaining(
        "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate",
      ),
      instances: expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          openNeedIds: expect.arrayContaining([
            expect.stringContaining("coverage:breaker_code_gate"),
          ]),
        }),
        expect.objectContaining({
          moduleId: "runner.rig_and_coverage",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          moduleState: expect.objectContaining({
            phase: "fund_answer",
            gap: expect.objectContaining({
              fundingGap: 1,
              sameTurnRunConversion: expect.objectContaining({
                targetRunActionId: runRemote.actionId,
                requiredCredits: 5,
                requiredClicksAfterFunding: 2,
                projectedKnownPathCost: 0,
                postRunCreditFloor: 0,
                installProjection: "card_spec_requires_rematerialization",
              }),
            }),
          }),
        }),
      ]),
    });

    const funded = structuredClone(input);
    funded.decisionId = "urgent-credit-install-rerun:2";
    funded.playerView.stateVersion = 2;
    funded.playerView.own.credits = 5;
    funded.playerView.own.clicks = 2;
    funded.legalActions = [install, runRemote, runHq, credit];
    funded.playerView.legalActions = funded.legalActions;
    for (const action of funded.legalActions) action.expiresAtStateVersion = 2;

    expect(context.chooseSemanticRuntimeAction(funded, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(funded)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: expect.stringContaining(
        "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate",
      ),
    });

    coverageInstalled = true;
    const installed = structuredClone(funded);
    installed.decisionId = "urgent-credit-install-rerun:3";
    installed.playerView.stateVersion = 3;
    installed.playerView.own.credits = 0;
    installed.playerView.own.clicks = 1;
    installed.playerView.own.rig = [wizardsBook];
    installed.playerView.own.gripOrHq = [];
    installed.legalActions = [runRemote, runHq, credit];
    installed.playerView.legalActions = installed.legalActions;
    for (const action of installed.legalActions)
      action.expiresAtStateVersion = 3;

    expect(context.chooseSemanticRuntimeAction(installed, {})).toMatchObject({
      actionId: runRemote.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      fallbackUsed: false,
    });
    expect(residentPlanPortfolioSnapshot(installed)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    });
  });

  it("uses a legal tutor for a cheaper known deck-coverage role", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple-for-efficient-wall-breaker",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const run = costIneffectiveWallRunAction();
    const input = costIneffectiveWallInput([
      temple,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    const baseCapabilities = costIneffectiveCoverageCapabilities("in_deck");
    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        ...baseCapabilities,
        runner: {
          ...baseCapabilities.runner!,
          searchAccess: {
            tools: [
              {
                cardId: "onr_v1_114_temple-microcode-outlet",
                title: "Temple Microcode Outlet",
                status: "in_hand" as const,
                canSearchPrograms: true,
                canSearchBreakers: true,
                legalNow: true,
                confidence: "high" as const,
                evidence: ["test_tutor_visible"],
              },
            ],
            canSearchProgramsNow: true,
            canSearchBreakersNow: true,
            evidence: ["test_tutor_visible"],
          },
        },
      }),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: temple.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:search_answer_breaker_wall",
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "search_answer",
      gap: {
        recoveryMode: "search_known_alternative",
        directSearchActionIds: [temple.actionId],
      },
    });
  });

  it("rejects a legal tutor when the only deck answer duplicates installed coverage", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple-for-duplicate-wall-breaker",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const run = costIneffectiveWallRunAction();
    const credit = costIneffectiveCoverageCreditAction();
    const input = costIneffectiveWallInput([temple, run, credit]);
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    const capabilities = costIneffectiveCoverageCapabilities("none");
    capabilities.runner!.searchAccess = {
      tools: [
        {
          cardId: "onr_v1_114_temple-microcode-outlet",
          title: "Temple Microcode Outlet",
          status: "in_hand",
          canSearchPrograms: true,
          canSearchBreakers: true,
          legalNow: true,
          confidence: "high",
          evidence: ["test_tutor_visible"],
        },
      ],
      canSearchProgramsNow: true,
      canSearchBreakersNow: true,
      evidence: ["test_tutor_visible"],
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => capabilities,
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === temple.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner_program_search_has_no_bound_useful_target",
        ),
      ]),
    });
  });

  it("binds a strongly amortizing breaker upgrade to sustained Central pressure", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple-for-wall-upgrade",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const run = costIneffectiveWallRunAction();
    const credit = costIneffectiveCoverageCreditAction();
    const input = costIneffectiveWallInput([temple, run, credit]);
    input.playerView.stateVersion = 12;
    input.playerView.turnSerial = 3;
    input.playerView.own.credits = 20;
    input.playerView.own.clicks = 4;
    input.playerView.own.memoryUsed = 1;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    for (const action of input.legalActions) action.expiresAtStateVersion = 12;
    input.playerView.legalActions = input.legalActions;
    const capabilities = costIneffectiveCoverageCapabilities("in_deck");
    capabilities.runner!.breakerInventory.push(
      alternativeWallBreakerForUpgradeSelection(),
    );
    capabilities.runner!.searchAccess = {
      tools: [
        {
          cardId: "onr_v1_114_temple-microcode-outlet",
          title: "Temple Microcode Outlet",
          status: "in_hand",
          canSearchPrograms: true,
          canSearchBreakers: true,
          legalNow: true,
          confidence: "high",
          evidence: ["test_tutor_visible"],
        },
      ],
      canSearchProgramsNow: true,
      canSearchBreakersNow: true,
      evidence: ["test_tutor_visible"],
    };
    const blockedTarget = costIneffectiveWallTarget(run.actionId);
    const target = {
      ...blockedTarget,
      pathPassability: "reachable" as const,
      recommendation: "run_now" as const,
      creditsAfterRun: 10,
      score: 220,
      runActionProjection: {
        ...blockedTarget.runActionProjection,
        sourceKind: "basic_action" as const,
      },
      routeQuote: {
        ...blockedTarget.routeQuote,
        reachability: "guaranteed_access" as const,
        availableCredits: 20,
        fundingGap: 0,
      },
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => capabilities,
      buildRunnerEconomyPosture: midgameUpgradeEconomyPosture,
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: temple.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:search_answer_breaker_wall",
        "plan_priority_delegated_from:plan:runner.pressure_central:central%3Ahq",
        "plan_assessment_evidence:coverage_upgrade:hq:onr_v1_053_ramming-piston",
      ]),
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "search_answer",
      gap: {
        needKind: "coverage_upgrade",
        targetServerId: "hq",
        requesterModuleId: "runner.pressure_central",
        recoveryMode: "search_known_upgrade",
        directSearchActionIds: [temple.actionId],
        directSearchChoiceBindings: [
          {
            actionId: temple.actionId,
            targetDefinitionId: "onr_v1_053_ramming-piston",
          },
        ],
        upgradeQuote: {
          schemaVersion: "runner-breaker-upgrade-economic-quote-v1",
          targetDefinitionId: "onr_v1_053_ramming-piston",
          currentKnownPathCost: 10,
          savingsPerRun: expect.any(Number),
          plannedRunHorizon: 2,
          desiredCreditReserve: 10,
        },
      },
    });
  });

  it("does not let Central-plan priority rescue a non-amortizing upgrade", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple-for-marginal-wall-upgrade",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const run = costIneffectiveWallRunAction();
    const input = costIneffectiveWallInput([
      temple,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    input.playerView.stateVersion = 12;
    input.playerView.turnSerial = 3;
    input.playerView.own.credits = 20;
    input.playerView.own.clicks = 4;
    input.playerView.own.memoryUsed = 1;
    input.playerView.own.memoryLimit = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
      visibleCard("buffer-rdi-1", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
      visibleCard("buffer-rdi-2", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
      }),
    ];
    for (const action of input.legalActions) action.expiresAtStateVersion = 12;
    input.playerView.legalActions = input.legalActions;
    const capabilities = costIneffectiveCoverageCapabilities("in_deck");
    capabilities.runner!.searchAccess = {
      tools: [
        {
          cardId: "onr_v1_114_temple-microcode-outlet",
          title: "Temple Microcode Outlet",
          status: "in_hand",
          canSearchPrograms: true,
          canSearchBreakers: true,
          legalNow: true,
          confidence: "high",
          evidence: ["test_tutor_visible"],
        },
      ],
      canSearchProgramsNow: true,
      canSearchBreakersNow: true,
      evidence: ["test_tutor_visible"],
    };
    const blockedTarget = costIneffectiveWallTarget(run.actionId);
    const target = {
      ...blockedTarget,
      pathPassability: "reachable" as const,
      pathCost: 4,
      recommendation: "run_now" as const,
      creditsAfterRun: 16,
      score: 220,
      runActionProjection: {
        ...blockedTarget.runActionProjection,
        sourceKind: "basic_action" as const,
      },
      routeQuote: {
        ...blockedTarget.routeQuote,
        reachability: "guaranteed_access" as const,
        knownCost: 4,
        guaranteedKnownCost: 4,
        availableCredits: 20,
        fundingGap: 0,
      },
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => capabilities,
      buildRunnerEconomyPosture: midgameUpgradeEconomyPosture,
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: run.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (alternative) => alternative.actionId === temple.actionId,
      ),
    ).toMatchObject({
      excluded: true,
      whyNot: expect.arrayContaining([
        expect.stringContaining(
          "runner_program_search_has_no_bound_useful_target",
        ),
      ]),
    });
  });

  it("quotes a searched breaker across the complete known multi-ICE path", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple-for-rent-i-con",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const run = costIneffectiveWallRunAction();
    const input = costIneffectiveWallInput([
      temple,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];
    input.playerView.servers[0] = server("hq", [
      quotedFixtureIce({
        instanceId: "hq-keeper",
        definitionId: "onr_v1_252_keeper",
        title: "Keeper",
        strength: 4,
        subtypes: ["code gate"],
      }),
      quotedFixtureIce({
        instanceId: "hq-wall-of-static",
        definitionId: "onr_v1_279_wall-of-static",
        title: "Wall of Static",
        strength: 2,
        subtypes: ["wall"],
      }),
    ]);
    const target = costIneffectiveWallTarget(run.actionId);
    target.pathCost = 12;
    target.routeQuote = {
      ...target.routeQuote,
      knownCost: 12,
      guaranteedKnownCost: 12,
      fundingGap: 8,
    };
    target.evidence = [
      "path_passability:blocked_unpayable",
      "path_cost:12",
      "visible_break_cost:12",
    ];
    const capabilities = costIneffectiveCoverageCapabilities("in_deck");
    capabilities.runner!.breakerInventory = [
      capabilities.runner!.breakerInventory[0]!,
      {
        cardId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        coverage: ["universal"],
        installCost: 3,
        baseStrength: 2,
        breakCost: 1,
        pumpCost: 1,
        risks: ["temporary_resource"],
        restrictions: [],
        quantityKnownInDeck: 2,
        locations: ["in_deck"],
        confidence: "high",
        evidence: ["test_known_rent_i_con"],
      },
    ];
    capabilities.runner!.searchAccess = {
      tools: [
        {
          cardId: "onr_v1_114_temple-microcode-outlet",
          title: "Temple Microcode Outlet",
          status: "in_hand",
          canSearchPrograms: true,
          canSearchBreakers: true,
          legalNow: true,
          confidence: "high",
          evidence: ["test_tutor_visible"],
        },
      ],
      canSearchProgramsNow: true,
      canSearchBreakersNow: true,
      evidence: ["test_tutor_visible"],
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => capabilities,
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: temple.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    const coverage = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(coverage?.moduleState).toMatchObject({
      phase: "search_answer",
      gap: {
        recoveryEvidenceCodes: expect.arrayContaining([
          "coverage_efficiency_deck_alternative:onr_classic_031_rent-i-con",
          "coverage_efficiency_deck_alternative_operating_cost:4",
          "coverage_efficiency_deck_alternative_total_known_cost:7",
        ]),
        directSearchChoiceBindings: [
          {
            actionId: temple.actionId,
            targetDefinitionId: "onr_classic_031_rent-i-con",
          },
        ],
      },
    });
  });

  it("draws only from side-safe deck-role knowledge when no tutor is legal", () => {
    resetResidentPlanPortfolioMemory();
    const run = costIneffectiveWallRunAction();
    const draw = legalAction(
      "draw-for-efficient-wall-breaker",
      "runner",
      "draw_card",
      "Draw 1",
      { credits: 0, clicks: 1 },
    );
    const input = costIneffectiveWallInput([
      draw,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    const currentTurnSerial = input.playerView.turnSerial!;
    input.playerView.own.gripOrHq = [
      visibleCard("coverage-draw-buffer-1", "runner", "event"),
      visibleCard("coverage-draw-buffer-2", "runner", "event"),
      visibleCard("coverage-draw-buffer-3", "runner", "event"),
    ];
    const decision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:draw_for_answer_breaker_wall",
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "draw_for_answer",
      gap: {
        recoveryMode: "draw_for_known_role",
        deckHasAnswer: true,
        answerInHand: false,
      },
    });
    expect(residentPlanPortfolioSnapshot(input)?.instances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.pressure_central:central%3Ahq",
          openNeedIds: [
            "coverage:breaker_wall:efficiency:hq:run:run-costly-hq-wall",
          ],
        }),
        expect.objectContaining({
          instanceId:
            "plan:runner.rig_and_coverage:coverage%3Abreaker_wall%3Aefficiency%3Ahq%3Arun%3Arun-costly-hq-wall",
          parentInstanceId: "plan:runner.pressure_central:central%3Ahq",
          parentNeedId:
            "coverage:breaker_wall:efficiency:hq:run:run-costly-hq-wall",
        }),
      ]),
    );

    const afterDraw = structuredClone(input);
    afterDraw.playerView.publicEvents = [
      {
        eventId: "runner-concrete-coverage-draw-turn-7",
        type: "draw_card",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        turnSerial: currentTurnSerial,
        stateHashAfter: "fnv1a:runner-concrete-coverage-draw-turn-7",
        publicPayload: {
          actor: "runner",
          actionType: "draw_card",
        },
      },
    ];
    afterDraw.eventTail = afterDraw.playerView.publicEvents;
    resetResidentPlanPortfolioMemory();
    const decisionAfterDraw = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(afterDraw, {});

    expect(decisionAfterDraw).toMatchObject({
      actionId: "credit-for-costly-hq-wall",
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(afterDraw)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      gap: {
        drawForAnswerActionIds: [],
        recoveryEvidenceCodes: expect.arrayContaining([
          `runner_coverage_draw_cadence_consumed:${currentTurnSerial}`,
        ]),
      },
    });
  });

  it("binds Jack 'n' Joe to coverage only while a matching visible deck role remains", () => {
    resetResidentPlanPortfolioMemory();
    const run = costIneffectiveWallRunAction();
    const jack = legalAction(
      "jack-draw-for-wall-answer",
      "runner",
      "play_event",
      "Play Jack 'n' Joe",
      { credits: 0, clicks: 1 },
      {
        source: "jack-card",
        payload: {
          cardId: "jack-card",
          sourceDefinitionId: "onr_v1_095_jack-n-joe",
          drawCardsAmount: 3,
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_v1_095_jack-n-joe:abilities_on_play_draw_cards",
          cardImplementationAbilityKey: "abilities_on_play_draw_cards",
        },
      },
    );
    const input = costIneffectiveWallInput([
      jack,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("jack-card", "runner", "event", {
        definitionId: "onr_v1_095_jack-n-joe",
        title: "Jack 'n' Joe",
      }),
      visibleCard("coverage-draw-buffer-1", "runner", "event"),
      visibleCard("coverage-draw-buffer-2", "runner", "event"),
    ];

    const decision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: jack.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.rig_and_coverage" },
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:draw_for_answer_breaker_wall",
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "draw_for_answer",
      gap: {
        deckHasAnswer: true,
        drawForAnswerActionIds: [jack.actionId],
      },
    });
  });

  it("binds an independently useful multi-draw tag-removal event to the existing coverage plan when no tags exist", () => {
    resetResidentPlanPortfolioMemory();
    const run = costIneffectiveWallRunAction();
    const meatUpgrade = legalAction(
      "meat-upgrade-draw-for-wall-answer",
      "runner",
      "play_event",
      "Play Meat Upgrade",
      { credits: 2, clicks: 2 },
      {
        source: "meat-upgrade-card",
        payload: {
          cardId: "meat-upgrade-card",
          sourceDefinitionId: "onr_classic_040_meat-upgrade",
          drawCardsAmount: 3,
          cardImplementationEffectKind: "remove_tags",
          cardImplementationTagMode: "up_to_amount",
          cardImplementationTagAmount: 2,
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityId:
            "onr_classic_040_meat-upgrade:on_play_remove_tags_and_draw",
          cardImplementationAbilityKey: "on_play_remove_tags_and_draw",
        },
      },
    );
    const input = costIneffectiveWallInput([
      meatUpgrade,
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    input.playerView.own.tags = 0;
    input.playerView.own.gripOrHq = [
      visibleCard("meat-upgrade-card", "runner", "event", {
        definitionId: "onr_classic_040_meat-upgrade",
        title: "Meat Upgrade",
      }),
      visibleCard("coverage-draw-buffer-1", "runner", "event"),
      visibleCard("coverage-draw-buffer-2", "runner", "event"),
    ];

    const [candidate] = buildActionSemanticCandidates({
      legalActions: [meatUpgrade],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
      visibleSourceDefinitionsByInstanceId: {
        "meat-upgrade-card": "onr_classic_040_meat-upgrade",
      },
    });
    expect(candidate).toMatchObject({
      sourceKind: "card",
      semanticActionType: "tag.remove",
      tagEffectProfile: { acuteTagRemoval: true },
      economyProjection: { cardsDrawn: 3 },
    });
    const dispositions = runnerActionDispositions(
      input,
      [candidate!],
      {
        creditBanks: [],
        recurringEconomy: [],
        resourceLifecycle: [],
        shellTradersPipelines: [],
        runWindows: [],
        developments: [],
        coverageGaps: [
          {
            gapId: "coverage:breaker_code_gate",
            requiredRole: "breaker_code_gate",
            priorityClass: "P4",
            evidenceCode: "test_code_gate_coverage",
            deckHasAnswer: true,
            answerInHand: false,
            directSearchActionIds: [],
            searchEngineSetupActionIds: [],
            drawForAnswerActionIds: [meatUpgrade.actionId],
          },
        ],
        centralPressure: [],
        remoteContests: [],
        installedAgendaScores: [],
        installedCardLiquidationChoices: [],
        fundingNeeds: [],
        defense: {
          activeTags: 0,
          forgoUnsafeRunCapacity: false,
          handBufferActionIds: [],
        },
      } as never,
      [
        {
          legalActionId: meatUpgrade.actionId,
          cardInstanceId: "meat-upgrade-card",
          definitionId: "onr_classic_040_meat-upgrade",
          availability: "not_relevant_now",
          deferReason: "no_current_need",
        },
      ] as never,
      [],
      () => undefined,
    ).filter((entry) => entry.actionId === meatUpgrade.actionId);
    expect(dispositions).toEqual([]);

    const decision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: meatUpgrade.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.rig_and_coverage" },
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:draw_for_answer_breaker_wall",
    );
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )?.moduleState,
    ).toMatchObject({
      phase: "draw_for_answer",
      gap: {
        deckHasAnswer: true,
        drawForAnswerActionIds: [meatUpgrade.actionId],
      },
    });

    resetResidentPlanPortfolioMemory();
    const taggedInput = structuredClone(input);
    taggedInput.playerView.own.tags = 2;
    const taggedDecision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [costIneffectiveWallTarget(run.actionId)],
    }).chooseSemanticRuntimeAction(taggedInput, {});

    expect(taggedDecision).toMatchObject({
      actionId: meatUpgrade.actionId,
      reasonCode: "plan_first.runner.defense_and_recovery",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.defense_and_recovery" },
    });
  });

  it("retains quantified parent funding when no better breaker route is known", () => {
    resetResidentPlanPortfolioMemory();
    const run = costIneffectiveWallRunAction();
    const credit = costIneffectiveCoverageCreditAction();
    const input = costIneffectiveWallInput([run, credit]);
    input.playerView.own.credits = 9;
    const target = costIneffectiveWallTarget(run.actionId);
    target.creditsAfterRun = -1;
    target.routeQuote = {
      ...target.routeQuote,
      availableCredits: 9,
      fundingGap: 1,
      evidence: [
        "route_reachability:no_access",
        "route_funding_gap:1",
        "route_unknown_ice_count:0",
      ],
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("none"),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      ),
    ).toBe(false);
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.dedupeKey === "run-support:central:hq",
      )?.moduleState,
    ).toMatchObject({
      need: {
        targetCredits: 13,
        gap: 4,
        parentPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      },
    });
  });

  it("does not open efficiency recovery for a known payoffless server", () => {
    resetResidentPlanPortfolioMemory();
    const run = costIneffectiveWallRunAction();
    const input = costIneffectiveWallInput([
      run,
      costIneffectiveCoverageCreditAction(),
    ]);
    const target = {
      ...costIneffectiveWallTarget(run.actionId),
      accessPayoff: "known_low_value" as const,
      knownAccessState: "known_no_current_payoff" as const,
      recommendation: "do_not_run_now" as const,
      score: -100,
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () =>
        costIneffectiveCoverageCapabilities("in_deck"),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision.reasonCode).not.toBe("plan_first.runner.rig_and_coverage");
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.some(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      ),
    ).toBe(false);
  });

  it("binds a heap search to the concrete breaker gap, server, source and recovery target", () => {
    resetResidentPlanPortfolioMemory();
    const gideon = legalAction(
      "play-gideons-pawnshop",
      "runner",
      "play_event",
      "Gideon's Pawnshop spielen",
      { credits: 1, clicks: 1 },
      {
        source: "gideon-card",
        payload: {
          cardId: "gideon-card",
          sourceDefinitionId: "onr_v1_089_gideons-pawnshop",
          cardImplementationEffectKind: "search_trash_to_grip",
          cardImplementationSearchFilter: "any_card",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-hq",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const input = aiInput("runner", [run, gideon, credit]);
    input.decisionId = "heap-coverage-search:1";
    input.playerView.stateVersion = 1;
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("gideon-card", "runner", "event", {
        definitionId: "onr_v1_089_gideons-pawnshop",
      }),
    ];
    input.playerView.own.heapOrArchives = [
      visibleCard("rent-i-con-heap", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        subtypes: ["icebreaker", "ai"],
        rulesText: "1 credit: Break 1 ice subroutine.",
      }),
    ];
    input.playerView.servers = [
      server("hq", [
        quotedFixtureIce({
          instanceId: "hq-code-gate",
          definitionId: "test-hq-code-gate",
          title: "HQ Code Gate",
          strength: 3,
          subtypes: ["code gate"],
        }),
      ]),
      server("rd"),
      server("archives"),
    ];
    const target = {
      ...safeRuntimeRunTarget("run-hq", "hq"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 500,
      evidence: ["missing_coverage:breaker_code_gate"],
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [
            {
              cardId: "onr_classic_031_rent-i-con",
              title: "Rent-I-Con",
              coverage: ["universal"],
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 1,
              locations: ["discarded"],
              confidence: "high",
              evidence: ["test_visible_heap_breaker"],
            },
          ],
          searchAccess: {
            tools: [],
            canSearchProgramsNow: false,
            canSearchBreakersNow: false,
            evidence: [],
          },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: gideon.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:search_answer_breaker_code_gate",
        "plan_priority_class:P4",
        "plan_priority_delegated_from:plan:runner.pressure_central:central%3Ahq",
      ]),
    );
    const executor = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(executor?.moduleState).toMatchObject({
      phase: "search_answer",
      gap: {
        requiredRole: "breaker_code_gate",
        targetServerId: "hq",
        directSearchActionIds: [gideon.actionId],
        directSearchChoiceBindings: [
          {
            actionId: gideon.actionId,
            sourceCardInstanceId: "gideon-card",
            sourceDefinitionId: "onr_v1_089_gideons-pawnshop",
            targetCardInstanceId: "rent-i-con-heap",
            targetDefinitionId: "onr_classic_031_rent-i-con",
          },
        ],
      },
    });

    const resolve = legalAction(
      "resolve-gideon-search",
      "runner",
      "resolve_choice",
      "Choose a heap card",
      { credits: 0, clicks: 0 },
    );
    const choiceInput = aiInput("runner", [resolve]);
    choiceInput.decisionId = "heap-coverage-search:2";
    choiceInput.playerView.stateVersion = 2;
    choiceInput.playerView.pendingChoice = {
      choiceId: "gideon-search-choice",
      side: "runner",
      kind: "select_cards",
      source:
        "p3_37.search_trash_to_grip:gideon-card:onr_v1_089_gideons-pawnshop:any_card:private:2",
      sourceCardInstanceId: "gideon-card",
      sourceCardDefinitionId: "onr_v1_089_gideons-pawnshop",
      prompt: "Choose a heap card",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "choose-bound-rent-i-con",
          label: "Rent-I-Con",
          card: visibleCard("rent-i-con-heap", "runner", "program", {
            definitionId: "onr_classic_031_rent-i-con",
          }),
        },
        {
          id: "choose-other-breaker",
          label: "Other universal breaker",
          card: visibleCard("other-breaker", "runner", "program", {
            definitionId: "onr_v1_007_blink",
          }),
        },
      ],
    };
    expect(
      selectedChoicesForDecision(choiceInput, resolve, {
        evaluateCorpOpeningHand: () => ({ decision: "keep" }),
        evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
        discardKeepScore: () => ({ total: 0 }),
        selectedRunnerProgramInstallTrashOptionIds: () => [],
        selectedRunnerForcedProgramTrashOptionIds: () => [],
        selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
        extractAiFeatures: () => ({
          credits: 4,
          memoryRemaining: 4,
          hasInstalledNonNoisyIcebreaker: false,
          rigRoles: new Set(),
          rigDefinitionIds: new Set(),
        }),
        rolesForCardId: () => ["breaker_universal"],
        effectsForCardId: () => [],
      } as Parameters<typeof selectedChoicesForDecision>[2]),
    ).toEqual({
      choiceId: "gideon-search-choice",
      selectedOptionIds: ["choose-bound-rent-i-con"],
    });
  });

  it("binds a temporary program search to the visible coverage answer in the heap", () => {
    resetResidentPlanPortfolioMemory();
    const sneak = legalAction(
      "play-sneak-preview",
      "runner",
      "play_event",
      "Play Sneak Preview",
      { credits: 1, clicks: 1 },
      {
        source: "sneak-card",
        payload: {
          cardId: "sneak-card",
          sourceDefinitionId: "onr_v1_110_sneak-preview",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const runRd = legalAction(
      "run-rd",
      "runner",
      "start_run",
      "Run R&D",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "rd" } },
    );
    const input = aiInput("runner", [sneak, credit, runRd]);
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("sneak-card", "runner", "event", {
        definitionId: "onr_v1_110_sneak-preview",
      }),
    ];
    input.playerView.own.heapOrArchives = [
      visibleCard("rent-i-con-heap", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        subtypes: ["icebreaker", "ai"],
        rulesText: "1 credit: Break 1 ice subroutine.",
      }),
      visibleCard("invisibility-heap", "runner", "program", {
        definitionId: "onr_v1_035_invisibility",
        subtypes: ["stealth"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("rd-code-gate", "corp", "ice", {
          definitionId: "onr_v1_252_keeper",
          rezzed: true,
          subtypes: ["code gate"],
          strength: 4,
          effectiveRunQuote: {
            iceInstanceId: "rd-code-gate",
            iceDefinitionId: "onr_v1_252_keeper",
            effectiveStrength: 4,
            subroutines: [{ id: "rd-code-gate:etr", type: "end_the_run" }],
          },
        }),
      ]),
      server("archives"),
    ];
    const blockedRd = {
      ...safeRuntimeRunTarget("run-rd", "rd"),
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 180,
      evidence: ["missing_coverage:breaker_code_gate"],
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [
            {
              cardId: "onr_classic_031_rent-i-con",
              title: "Rent-I-Con",
              coverage: ["universal"],
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 1,
              locations: ["discarded"],
              confidence: "high",
              evidence: [],
            },
          ],
          searchAccess: { tools: [], evidence: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [blockedRd],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: sneak.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
    });
    const executor = residentPlanPortfolioSnapshot(input)?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(executor?.moduleState).toMatchObject({
      phase: "search_answer",
      gap: {
        requiredRole: "breaker_code_gate",
        directSearchChoiceBindings: [
          {
            actionId: sneak.actionId,
            targetCardInstanceId: "rent-i-con-heap",
            targetDefinitionId: "onr_classic_031_rent-i-con",
          },
        ],
      },
    });
  });

  it("binds exact top-heap recovery only when that target closes the current breaker gap", () => {
    resetResidentPlanPortfolioMemory();
    const junkyard = legalAction(
      "use-junkyard-bbs",
      "runner",
      "activated_card_ability",
      "Junkyard BBS nutzen",
      { credits: 1, clicks: 1 },
      {
        source: "junkyard-bbs",
        payload: {
          cardId: "junkyard-bbs",
          sourceDefinitionId: "onr_v1_165_junkyard-bbs",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationAbilityId:
            "onr_v1_165_junkyard-bbs:abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationEffectKind: "move_top_trash_to_grip",
          targetCardId: "rent-i-con-top",
          targetCardDefinitionId: "onr_classic_031_rent-i-con",
          cardImplementationTopTrashTargetId: "rent-i-con-top",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [run, junkyard, credit]);
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("junkyard-bbs", "runner", "resource", {
        definitionId: "onr_v1_165_junkyard-bbs",
      }),
    ];
    input.playerView.own.heapOrArchives = [
      visibleCard("rent-i-con-top", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        subtypes: ["icebreaker", "ai"],
        rulesText: "1 credit: Break 1 ice subroutine.",
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 500,
      evidence: ["missing_coverage:breaker_wall"],
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: junkyard.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:search_answer_breaker_wall",
    );

    resetResidentPlanPortfolioMemory();
    const wrongTop = structuredClone(input);
    wrongTop.playerView.own.heapOrArchives = [
      visibleCard("economy-top", "runner", "event", {
        definitionId: "onr_classic_037_finders-keepers",
      }),
    ];
    const rejected = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(wrongTop, {});
    expect(rejected.reasonCode).not.toBe("plan_first.runner.rig_and_coverage");
    expect(rejected.evidence).not.toContain(
      "plan_step_capability:search_answer_breaker_wall",
    );
  });

  it("prioritizes an exact recovery route for a publicly advanced matchpoint remote over generic economy", () => {
    resetResidentPlanPortfolioMemory();
    const junkyard = legalAction(
      "use-junkyard-bbs",
      "runner",
      "activated_card_ability",
      "Junkyard BBS nutzen",
      { credits: 1, clicks: 1 },
      {
        source: "junkyard-bbs",
        payload: {
          cardId: "junkyard-bbs",
          sourceDefinitionId: "onr_v1_165_junkyard-bbs",
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey:
            "abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationAbilityId:
            "onr_v1_165_junkyard-bbs:abilities_activated_runner_main_move_top_trash_to_grip",
          cardImplementationEffectKind: "move_top_trash_to_grip",
          targetCardId: "rent-i-con-top",
          targetCardDefinitionId: "onr_classic_031_rent-i-con",
          cardImplementationTopTrashTargetId: "rent-i-con-top",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [run, junkyard, credit]);
    input.playerView.own.credits = 11;
    input.playerView.own.clicks = 2;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.agendaPointsToWin = 7;
    input.playerView.own.rig = [
      visibleCard("junkyard-bbs", "runner", "resource", {
        definitionId: "onr_v1_165_junkyard-bbs",
      }),
    ];
    input.playerView.own.heapOrArchives = [
      visibleCard("rent-i-con-top", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        title: "Rent-I-Con",
        subtypes: ["icebreaker", "ai"],
        rulesText: "1 credit: Break 1 ice subroutine.",
      }),
    ];
    const remote = server("remote_1", [
      quotedFixtureIce({
        instanceId: "remote-wall",
        definitionId: "test-remote-wall",
        title: "Remote Wall",
        strength: 3,
        subtypes: ["wall"],
      }),
    ]);
    remote.root = [
      {
        instanceId: "advanced-remote-root",
        known: false,
        advancementCounters: 2,
      },
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      remote,
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: false,
      score: 150,
      evidence: ["missing_coverage:breaker_wall"],
    };

    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: junkyard.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        "plan_assessment_evidence:terminal_remote_coverage:remote_1",
        "plan_step_capability:search_answer_breaker_wall",
      ]),
    );

    resetResidentPlanPortfolioMemory();
    const unadvanced = structuredClone(input);
    unadvanced.playerView.servers.find(
      (candidate) => candidate.id === "remote_1",
    )!.root[0]!.advancementCounters = 0;
    liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(unadvanced, {});
    const unadvancedCoverage = residentPlanPortfolioSnapshot(
      unadvanced,
    )?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    )?.moduleState as
      | { gap?: { priorityClass?: string; evidenceCode?: string } }
      | undefined;
    expect(unadvancedCoverage?.gap).toMatchObject({
      priorityClass: "P5",
      evidenceCode: "missing_coverage:breaker_wall",
    });

    resetResidentPlanPortfolioMemory();
    const repeatedScoringRemote = structuredClone(unadvanced);
    repeatedScoringRemote.playerView.publicEvents = [
      {
        eventId: "corp-score-remote-1",
        type: "score_agenda",
        stateVersionBefore: 8,
        stateVersionAfter: 9,
        turnSerial: 3,
        stateHashAfter: "fnv1a:corp-score-remote-1",
        publicPayload: {
          actor: "corp",
          actionType: "score_agenda",
          targets: { scoredFromServerId: "remote_1" },
        },
      },
    ];
    repeatedScoringRemote.eventTail =
      repeatedScoringRemote.playerView.publicEvents;
    const unbreakableTarget = {
      ...target,
      pathPassability: "blocked_unbreakable" as const,
    };
    const focusedDecision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [unbreakableTarget],
    }).chooseSemanticRuntimeAction(repeatedScoringRemote, {});

    expect(focusedDecision).toMatchObject({
      actionId: junkyard.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(focusedDecision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P2",
        "plan_assessment_evidence:terminal_remote_coverage:remote_1",
        "plan_step_capability:search_answer_breaker_wall",
        "plan_priority_delegated_from:plan:runner.contest_remote:remote%3Aremote_1",
      ]),
    );
    expect(residentPlanPortfolioSnapshot(repeatedScoringRemote)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      executorInstanceId:
        "plan:runner.rig_and_coverage:coverage%3Abreaker_wall",
      instances: expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          openNeedIds: ["coverage:breaker_wall"],
        }),
        expect.objectContaining({
          instanceId: "plan:runner.rig_and_coverage:coverage%3Abreaker_wall",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          parentNeedId: "coverage:breaker_wall",
        }),
      ]),
    });
  });

  it("binds an exact pre-run breaker subtype change to rig and coverage", () => {
    resetResidentPlanPortfolioMemory();
    const change = legalAction(
      "morphing-tool-to-sentry",
      "runner",
      "trigger_ability",
      "Choose Sentry coverage",
      { credits: 1, clicks: 1 },
      {
        source: "morphing-tool",
        payload: {
          cardId: "morphing-tool",
          runnerAbility: "change_icebreaker_subtype",
          selectedSubtype: "sentry",
          abilityId: "change_icebreaker_subtype",
        },
      },
    );
    const redundantWallChange = legalAction(
      "morphing-tool-to-wall",
      "runner",
      "trigger_ability",
      "Choose Wall coverage",
      { credits: 1, clicks: 1 },
      {
        source: "morphing-tool",
        payload: {
          cardId: "morphing-tool",
          runnerAbility: "change_icebreaker_subtype",
          selectedSubtype: "wall",
          abilityId: "change_icebreaker_subtype",
        },
      },
    );
    const run = legalAction(
      "run-hq-after-subtype-change",
      "runner",
      "start_run",
      "Run HQ",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "hq" } },
    );
    const credit = legalAction(
      "gain-credit-instead-of-subtype-change",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [change, redundantWallChange, run, credit]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.own.rig = [
      visibleCard("morphing-tool", "runner", "program", {
        definitionId: "onr_proteus_092_morphing-tool",
        title: "Morphing Tool",
        selectedSubtype: "code_gate",
        subtypes: ["icebreaker"],
      }),
      visibleCard("boring-bit", "runner", "program", {
        definitionId: "onr_proteus_081_boring-bit",
        title: "Boring Bit",
        subtypes: ["icebreaker", "worm"],
      }),
    ];
    const target = {
      ...safeRuntimeRunTarget(run.actionId, "hq"),
      recommendation: "run_now" as const,
      score: 400,
      routeQuote: {
        ...safeRuntimeRunTarget(run.actionId, "hq").routeQuote!,
        preRunPreparation: {
          credits: 1,
          clicks: 1,
          subtypeChanges: [
            {
              sourceCardInstanceId: "morphing-tool",
              sourceDefinitionId: "onr_proteus_092_morphing-tool",
              selectedSubtype: "sentry",
            },
          ],
        },
      },
    };

    const decision = liveContext({
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: change.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
      decisionDebug: { planKind: "runner.rig_and_coverage" },
    });
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      rootForegroundInstanceId: "plan:runner.pressure_central:central%3Ahq",
      executorInstanceId: expect.stringContaining(
        "plan:runner.rig_and_coverage:coverage%3Abreaker_sentry%3Aprepare-run",
      ),
      instances: expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.rig_and_coverage",
          parentInstanceId: "plan:runner.pressure_central:central%3Ahq",
          moduleState: expect.objectContaining({
            phase: "prepare_coverage",
          }),
        }),
      ]),
    });
  });

  it("rejects breaker subtype changes without a bound run coverage need", () => {
    resetResidentPlanPortfolioMemory();
    const change = legalAction(
      "unbound-morphing-tool-to-sentry",
      "runner",
      "trigger_ability",
      "Choose Sentry coverage",
      { credits: 1, clicks: 1 },
      {
        source: "morphing-tool",
        payload: {
          cardId: "morphing-tool",
          runnerAbility: "change_icebreaker_subtype",
          selectedSubtype: "sentry",
          abilityId: "change_icebreaker_subtype",
        },
      },
    );
    const credit = legalAction(
      "gain-credit-without-subtype-need",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [change, credit]);
    input.playerView.own.credits = 2;
    input.playerView.own.rig = [
      visibleCard("morphing-tool", "runner", "program", {
        definitionId: "onr_proteus_092_morphing-tool",
        selectedSubtype: "code_gate",
        subtypes: ["icebreaker"],
      }),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "runner_breaker_subtype_change_requires_bound_run_coverage_need",
    );
  });

  it("allows only one strategic coverage draw per runner turn", () => {
    resetResidentPlanPortfolioMemory();
    const draw = legalAction(
      "draw-for-code-gate-coverage",
      "runner",
      "draw_card",
      "Draw 1",
      { credits: 0, clicks: 1 },
    );
    const credit = legalAction(
      "gain-credit-after-coverage-draw",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [draw, credit]);
    input.playerView.turnSerial = 7;
    input.playerView.publicEvents = [];
    input.eventTail = [];
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("coverage-buffer-1", "runner", "event"),
      visibleCard("coverage-buffer-2", "runner", "event"),
      visibleCard("coverage-buffer-3", "runner", "event"),
      visibleCard("coverage-buffer-4", "runner", "event"),
      visibleCard("coverage-buffer-5", "runner", "event"),
    ];
    const dependencies = {
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas" as const,
        setupEngine: ["runner.rig_first"],
      }),
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [
            {
              cardId: "test-code-gate-breaker",
              title: "Test Code Gate Breaker",
              coverage: ["code_gate" as const],
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 1,
              locations: ["in_deck" as const],
              confidence: "high" as const,
              evidence: ["test_code_gate_breaker_in_deck"],
            },
          ],
          breakerCoverageMatrix: {
            code_gate: {
              coverage: "code_gate" as const,
              inDeckKnown: true,
              inHand: false,
              installed: false,
              searchableNow: false,
              drawOnly: true,
              missing: false,
              bestKnownCards: ["test-code-gate-breaker"],
              blockers: ["needs_draw"],
            },
          },
          searchAccess: { tools: [] },
          economyBankTools: [],
        },
      }),
      buildRunnerEconomyPosture: () => ({
        minimumCreditFloor: 0,
        desiredCreditReserve: 1,
        fundingNeed: true,
        evidence: [],
      }),
    };

    const firstDecision = liveContext(dependencies).chooseSemanticRuntimeAction(
      input,
      {},
    );
    expect(firstDecision).toMatchObject({
      actionId: draw.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });

    const afterDraw = structuredClone(input);
    afterDraw.playerView.publicEvents = [
      {
        eventId: "runner-basic-draw-turn-7",
        type: "draw_card",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        turnSerial: 7,
        stateHashAfter: "fnv1a:runner-basic-draw-turn-7",
        publicPayload: {
          actor: "runner",
          actionType: "draw_card",
        },
      },
    ];
    afterDraw.eventTail = afterDraw.playerView.publicEvents;
    resetResidentPlanPortfolioMemory();

    const secondDecision = liveContext(
      dependencies,
    ).chooseSemanticRuntimeAction(afterDraw, {});
    expect(secondDecision).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    const coverage = residentPlanPortfolioSnapshot(afterDraw)?.instances.find(
      (instance) => instance.moduleId === "runner.rig_and_coverage",
    );
    expect(coverage?.moduleState).toMatchObject({
      gap: {
        drawForAnswerActionIds: [],
        recoveryEvidenceCodes: ["runner_coverage_draw_cadence_consumed:7"],
      },
    });
  });

  it("does not recycle a rejected coverage search as generic draw support", () => {
    resetResidentPlanPortfolioMemory();
    const temple = legalAction(
      "play-temple",
      "runner",
      "play_event",
      "Temple Microcode Outlet spielen",
      { credits: 1, clicks: 1 },
      {
        source: "temple-card",
        payload: {
          cardId: "temple-card",
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const credit = legalAction(
      "credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [temple, credit]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("temple-card", "runner", "event", {
        definitionId: "onr_v1_114_temple-microcode-outlet",
      }),
    ];

    expect(
      liveContext({
        runnerStrategicIntentForInput: () => ({
          primaryWinIntent: "runner.access_agendas",
          setupEngine: ["runner.rig_first"],
        }),
        deckCapabilitiesForInput: () =>
          universalCoverageSearchCapabilities(false),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: "credit",
      reasonCode: "plan_first.runner.economy",
    });
    const coverageStates = residentPlanPortfolioSnapshot(input)
      ?.instances.filter(
        (instance) => instance.moduleId === "runner.rig_and_coverage",
      )
      .map(
        (instance) =>
          instance.moduleState as {
            gap?: {
              rejectedSearchActionIds?: string[];
              drawForAnswerActionIds?: string[];
            };
          },
      );
    expect(coverageStates).not.toHaveLength(0);
    for (const state of coverageStates ?? []) {
      expect(state.gap?.rejectedSearchActionIds).toContain("play-temple");
      expect(state.gap?.drawForAnswerActionIds).not.toContain("play-temple");
    }
  });

  it("fails before returning a choice-opening coverage action without an exact continuation", () => {
    resetResidentPlanPortfolioMemory();
    const unboundSearch = legalAction(
      "unbound-search",
      "runner",
      "play_event",
      "Unbound program search",
      { credits: 1, clicks: 1 },
      {
        source: "",
        payload: {
          sourceDefinitionId: "onr_v1_114_temple-microcode-outlet",
          cardImplementationEffectKind: "search_stack_to_grip",
          cardImplementationSearchFilter: "program",
        },
      },
    );
    const input = aiInput("runner", [unboundSearch]);
    input.playerView.own.credits = 1;

    expect(() =>
      liveContext({
        runnerStrategicIntentForInput: () => ({
          primaryWinIntent: "runner.access_agendas",
          setupEngine: ["runner.rig_first"],
        }),
        deckCapabilitiesForInput: () =>
          universalCoverageSearchCapabilities(true),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("binds a real AP search action and its choice to the producing coverage plan", () => {
    resetResidentPlanPortfolioMemory();
    const searchToolInstanceId = "search-tool-instance";
    const searchToolDefinitionId = "test-runner-program-search";
    const alternateSearchToolInstanceId = "alternate-search-tool-instance";
    const alternateSearchToolDefinitionId =
      "test-runner-program-search-alternate";
    const search = legalAction(
      "search-ap-action",
      "runner",
      "activated_card_ability",
      "Search the stack for a program",
      { credits: 0, clicks: 1 },
      {
        source: searchToolInstanceId,
        payload: { sourceDefinitionId: searchToolDefinitionId },
      },
    );
    const credit = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const alternateSearch = legalAction(
      "search-ap-action-alternate",
      "runner",
      "activated_card_ability",
      "Search the stack for a program",
      { credits: 0, clicks: 1 },
      {
        source: alternateSearchToolInstanceId,
        payload: { sourceDefinitionId: alternateSearchToolDefinitionId },
      },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [run, search, alternateSearch, credit]);
    input.decisionId = "coverage-search-e2e:1";
    input.playerView.stateVersion = 1;
    input.playerView.winner = null;
    input.playerView.own.rig = [
      visibleCard(searchToolInstanceId, "runner", "program", {
        definitionId: searchToolDefinitionId,
        title: "Program Search",
      }),
      visibleCard(alternateSearchToolInstanceId, "runner", "program", {
        definitionId: alternateSearchToolDefinitionId,
        title: "Alternate Program Search",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        quotedFixtureIce({
          instanceId: "ap-ice",
          definitionId: "test-ap-ice",
          title: "AP ICE",
          strength: 3,
          subtypes: ["ap"],
          subroutineType: "do_damage",
        }),
      ]),
    ];
    const target = {
      ...safeRuntimeRunTarget("run-remote", "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 400,
      evidence: ["missing_coverage:breaker_ap"],
    };
    const deckCapabilities = {
      runner: {
        breakerInventory: [
          {
            cardId: "ap-breaker-definition",
            title: "AP Breaker",
            coverage: ["ap"],
            risks: [],
            restrictions: [],
            quantityKnownInDeck: 1,
            locations: ["in_deck"],
            confidence: "high",
            evidence: ["test_ap_breaker_in_deck"],
          },
        ],
        searchAccess: {
          tools: [
            {
              cardId: searchToolDefinitionId,
              title: "Program Search",
              status: "installed",
              canSearchPrograms: true,
              canSearchBreakers: true,
              legalNow: true,
              confidence: "high",
              evidence: ["test_search_tool_legal"],
            },
            {
              cardId: alternateSearchToolDefinitionId,
              title: "Alternate Program Search",
              status: "installed",
              canSearchPrograms: true,
              canSearchBreakers: true,
              legalNow: true,
              confidence: "high",
              evidence: ["test_alternate_search_tool_legal"],
            },
          ],
          canSearchProgramsNow: true,
          canSearchBreakersNow: true,
          evidence: ["test_search_tool_legal"],
        },
        economyBankTools: [],
      },
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () => deckCapabilities,
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});
    const selectedSearch =
      decision.actionId === search.actionId
        ? {
            actionId: search.actionId,
            instanceId: searchToolInstanceId,
            definitionId: searchToolDefinitionId,
          }
        : {
            actionId: alternateSearch.actionId,
            instanceId: alternateSearchToolInstanceId,
            definitionId: alternateSearchToolDefinitionId,
          };
    const otherSearch =
      selectedSearch.actionId === search.actionId
        ? {
            instanceId: alternateSearchToolInstanceId,
            definitionId: alternateSearchToolDefinitionId,
          }
        : {
            instanceId: searchToolInstanceId,
            definitionId: searchToolDefinitionId,
          };

    expect(decision).toMatchObject({
      actionId: selectedSearch.actionId,
      reasonCode: "plan_first.runner.rig_and_coverage",
      fallbackUsed: false,
    });
    expect(decision.evidence).toContain(
      "plan_step_capability:search_answer_breaker_ap",
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      mode: "cutover",
      coverage: {
        status: "pass",
        coveragePercent: 100,
      },
      commitment: {
        rematerialization: {
          status: "executable",
          actionId: selectedSearch.actionId,
        },
      },
    });

    const resolve = legalAction(
      "resolve-search-choice",
      "runner",
      "resolve_choice",
      "Choose a program",
      { credits: 0, clicks: 0 },
    );
    const choiceInput = aiInput("runner", [resolve]);
    choiceInput.decisionId = "coverage-search-e2e:2";
    choiceInput.playerView.stateVersion = 2;
    choiceInput.playerView.winner = null;
    choiceInput.playerView.pendingChoice = {
      choiceId: "search-choice",
      side: "runner",
      kind: "select_cards",
      source: `p3_37.search_stack_to_grip:${selectedSearch.instanceId}:${selectedSearch.definitionId}:program:private:shuffle:2`,
      sourceCardInstanceId: selectedSearch.instanceId,
      sourceCardDefinitionId: selectedSearch.definitionId,
      prompt: "Choose a program",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "choose-trace",
          label: "A Trace Breaker",
          card: visibleCard("trace-option", "runner", "program", {
            definitionId: "trace-breaker-definition",
          }),
        },
        {
          id: "choose-ap",
          label: "Z AP Breaker",
          card: visibleCard("ap-option", "runner", "program", {
            definitionId: "ap-breaker-definition",
          }),
        },
      ],
      cardSearchPresentation: {
        sourceZone: "stack",
        destination: "grip",
        reveal: "hidden",
        shuffleAfter: true,
        selectableFilter: "program",
        showNonMatchingCards: false,
      },
    };
    choiceInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_2", [
        visibleCard("trace-ice", "corp", "ice", {
          rezzed: true,
          title: "Trace ICE",
          subtypes: ["trace"],
        }),
      ]),
    ];
    const choiceDependencies = {
      evaluateCorpOpeningHand: () => ({ decision: "keep" }),
      evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
      discardKeepScore: () => ({ total: 0 }),
      selectedRunnerProgramInstallTrashOptionIds: () => [],
      selectedRunnerForcedProgramTrashOptionIds: () => [],
      selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
      extractAiFeatures: () => ({
        credits: 0,
        memoryRemaining: 4,
        hasInstalledNonNoisyIcebreaker: false,
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      }),
      rolesForCardId: (definitionId) =>
        definitionId === "ap-breaker-definition"
          ? ["breaker_ap"]
          : definitionId === "trace-breaker-definition"
            ? ["breaker_trace"]
            : [],
      effectsForCardId: () => [],
    } as Parameters<typeof selectedChoicesForDecision>[2];
    const selected = selectedChoicesForDecision(
      choiceInput,
      resolve,
      choiceDependencies,
    );

    expect(selected).toEqual({
      choiceId: "search-choice",
      selectedOptionIds: ["choose-ap"],
    });
    choiceInput.playerView.pendingChoice = {
      ...choiceInput.playerView.pendingChoice,
      source: `p3_37.search_stack_to_grip:${otherSearch.instanceId}:${otherSearch.definitionId}:program:private:shuffle:2`,
      sourceCardInstanceId: otherSearch.instanceId,
      sourceCardDefinitionId: otherSearch.definitionId,
    };
    expect(() =>
      selectedChoicesForDecision(choiceInput, resolve, choiceDependencies),
    ).toThrowError("invalid_support_graph");
  });

  it("deduplicates one terminal remote AP-coverage need across multiple run actions", () => {
    resetResidentPlanPortfolioMemory();
    const basicRun = legalAction(
      "run-remote-basic",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const eventRun = legalAction(
      "run-remote-event",
      "runner",
      "play_event",
      "Event run on remote",
      { credits: 1, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const credit = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("runner", [basicRun, eventRun, credit]);
    input.playerView.own.credits = 25;
    input.playerView.own.clicks = 4;
    input.playerView.own.agendaPoints = 6;
    input.playerView.opponent.agendaPoints = 6;
    input.playerView.agendaPointsToWin = 7;
    input.playerView.servers = [
      server(
        "remote_1",
        [
          quotedFixtureIce({
            instanceId: "ap-ice",
            definitionId: "test-ap-ice",
            title: "AP ICE",
            strength: 3,
            subtypes: ["ap"],
            subroutineType: "do_damage",
          }),
        ],
        [
          visibleCard("advanced-remote-card", "corp", "agenda", {
            advancementCounters: 1,
          }),
        ],
      ),
    ];
    const target = (actionId: string, score: number) => ({
      ...safeRuntimeRunTarget(actionId, "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score,
      evidence: ["missing_coverage:breaker_ap"],
    });

    expect(() =>
      liveContext({
        evaluateRunnerRunTargets: () => [
          target(eventRun.actionId, 380),
          target(basicRun.actionId, 400),
        ],
      }).chooseSemanticRuntimeAction(input, {}),
    ).not.toThrow();
    const coverage = residentPlanPortfolioSnapshot(input)?.instances.filter(
      (instance) =>
        instance.moduleId === "runner.rig_and_coverage" &&
        instance.dedupeKey === "coverage:breaker_ap",
    );
    expect(coverage).toHaveLength(1);
    expect(
      (
        coverage?.[0]?.moduleState as {
          gap?: { targetRunActionId?: string };
        }
      )?.gap?.targetRunActionId,
    ).toBe(basicRun.actionId);
  });

  it("does not authorize a special-coverage search without real deck-role evidence", () => {
    resetResidentPlanPortfolioMemory();
    const search = legalAction(
      "search-ap-action",
      "runner",
      "activated_card_ability",
      "Search the stack for a program",
      { credits: 0, clicks: 1 },
      {
        source: "search-tool-instance",
        payload: { sourceDefinitionId: "test-runner-program-search" },
      },
    );
    const credit = legalAction(
      "gain-credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const run = legalAction(
      "run-remote",
      "runner",
      "start_run",
      "Run remote",
      { credits: 0, clicks: 1 },
      { payload: { serverId: "remote_1" } },
    );
    const input = aiInput("runner", [run, search, credit]);
    input.playerView.own.rig = [
      visibleCard("search-tool-instance", "runner", "program", {
        definitionId: "test-runner-program-search",
      }),
    ];
    input.playerView.servers = [
      server("remote_1", [
        quotedFixtureIce({
          instanceId: "ap-ice",
          definitionId: "test-ap-ice",
          title: "AP ICE",
          strength: 3,
          subtypes: ["ap"],
          subroutineType: "do_damage",
        }),
      ]),
    ];
    const target = {
      ...safeRuntimeRunTarget("run-remote", "remote_1"),
      targetKind: "remote" as const,
      accessTargetKind: "remote" as const,
      pathPassability: "blocked_missing_coverage" as const,
      recommendation: "find_breaker_first" as const,
      scoreThreat: true,
      score: 400,
      evidence: ["missing_coverage:breaker_ap"],
    };
    const decision = liveContext({
      deckCapabilitiesForInput: () => ({
        runner: {
          breakerInventory: [],
          searchAccess: {
            tools: [
              {
                cardId: "test-runner-program-search",
                canSearchPrograms: true,
                canSearchBreakers: true,
                legalNow: true,
              },
            ],
          },
          economyBankTools: [],
        },
      }),
      evaluateRunnerRunTargets: () => [target],
    }).chooseSemanticRuntimeAction(input, {});

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toContain("plan_priority_class:P6");
    expect(decision.actionId).not.toBe("search-ap-action");
  });
  it("uses cutover by default and preserves legacy comparison only as an explicit rollback mode", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 1;

    resetResidentPlanPortfolioMemory();
    const cutover = liveContext().chooseSemanticRuntimeAction(input, {});
    const cutoverDebug = cutover.decisionDebug?.planFirstDecision?.turnPlanning;
    const stored = residentPlanPortfolioSnapshot(input);
    expect(cutover).toMatchObject({ actionId: credit.actionId });
    expect(cutover.decisionDebug?.planFirstDecision).toMatchObject({
      selectionAuthority: "turn_plan_commitment",
      turnPlanning: {
        mode: "cutover",
        commitment: {
          status: "active",
          rematerialization: {
            status: "executable",
            actionId: credit.actionId,
          },
        },
      },
    });
    expect(stored?.turnPlanCommitment?.status).toBe("active");
    expect(stored?.turnPlanExecutionLease).toMatchObject({
      commitmentId: stored?.turnPlanCommitment?.commitmentId,
      currentBinding: { actionId: credit.actionId },
    });

    const repeated = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(repeated.actionId).toBe(cutover.actionId);
    expect(
      repeated.decisionDebug?.planFirstDecision?.turnPlanning?.commitment,
    ).toEqual(cutoverDebug?.commitment);

    resetResidentPlanPortfolioMemory();
    const legacyComparison = liveContext().chooseSemanticRuntimeAction(input, {
      corpTurnPlannerMode: "legacy_compare",
    });
    expect(legacyComparison.decisionDebug?.planFirstDecision).toMatchObject({
      selectionAuthority: "resident_plan_instance",
      turnPlanning: {
        mode: "shadow",
        evidenceCodes: expect.arrayContaining([
          "corp_turn_planner_shadow_only",
          "shadow_result_never_controls_live_action",
        ]),
      },
    });
    expect(residentPlanPortfolioSnapshot(input)?.turnPlanCommitment).toBe(
      undefined,
    );
  });

  it("invalidates a persisted turn execution lease on restart and replans before acting", () => {
    const credit = legalAction(
      "credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
      { source: "basic_action", payload: { gainCreditsAmount: 1 } },
    );
    const input = aiInput("corp", [credit]);
    input.playerView.own.credits = 0;
    input.playerView.own.clicks = 1;
    const deckSnapshotId = "turn-planner-restart-test";

    resetResidentPlanPortfolioMemory();
    liveContext().chooseSemanticRuntimeAction(input, {});
    const checkpoint = exportAiRuntimeCheckpoint(input, deckSnapshotId);
    expect(
      checkpoint.residentPlanPortfolio?.turnPlanExecutionLease,
    ).toBeDefined();

    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, checkpoint);
    const restored = residentPlanPortfolioSnapshot(input);
    expect(restored?.turnPlanCommitment).toMatchObject({
      status: "replanned",
      replanReason: "runtime_restarted",
    });
    expect(restored?.turnPlanExecutionLease).toBeUndefined();

    const replanned = liveContext().chooseSemanticRuntimeAction(input, {});
    expect(replanned).toMatchObject({ actionId: credit.actionId });
    expect(
      replanned.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      mode: "cutover",
      commitment: {
        status: "active",
        replanReason: "runtime_restarted",
        rematerialization: {
          status: "executable",
          actionId: credit.actionId,
        },
      },
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.turnPlanExecutionLease,
    ).toBeDefined();
  });
});

function recurringProgramSearchIntent() {
  return {
    primaryWinIntent: "runner.access_agendas",
    setupEngine: ["runner.search_breaker_setup"],
    engineLineIds: ["runner.engine.compatible_recurring_economy"],
    engineProviders: [
      {
        providerId: "runner.provider:onr_v1_071_vewy-vewy-quiet",
        cardId: "onr_v1_071_vewy-vewy-quiet",
        copies: 2,
        capabilities: ["runner.economy.recurring_breaker"],
        supportCapabilities: [],
        persistence: "persistent",
        additivity: "additive_to_compatible_demand",
        compatibleDemandIds: ["runner.demand.breaker_credit"],
        evidence: ["test_recurring_breaker_economy_provider"],
      },
    ],
  };
}

function shellTradersIntent(): RunnerStrategicIntentProfile {
  return {
    schemaVersion: "runner-strategic-intent-profile-v1",
    side: "runner",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "runner.steal_agendas_default",
    executionStyle: "runner.setup_first",
    setupEngine: ["runner.rig_first"],
    engineLineIds: ["runner.engine.delayed_install"],
    engineProviders: [
      {
        providerId: "runner.provider:onr_v1_176_the-shell-traders",
        cardId: "onr_v1_176_the-shell-traders",
        copies: 3,
        capabilities: ["runner.staging.delayed_install"],
        supportCapabilities: [],
        persistence: "persistent",
        additivity: "additive_by_trigger_cadence",
        compatibleDemandIds: [],
        evidence: ["test_shell_traders_provider"],
      },
    ],
    pressureVectors: [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test_shell_traders_intent"],
  };
}

function fullNonNoisyBreakerRig() {
  return [
    visibleCard("corrosion-installed", "runner", "program", {
      definitionId: "onr_proteus_083_corrosion",
      subtypes: ["icebreaker", "fracter"],
    }),
    visibleCard("codecracker-installed", "runner", "program", {
      definitionId: "onr_v1_014_codecracker",
      subtypes: ["icebreaker", "decoder"],
    }),
    visibleCard("loony-goon-installed", "runner", "program", {
      definitionId: "onr_v1_040_loony-goon",
      subtypes: ["icebreaker", "killer"],
    }),
  ];
}

function universalCoverageSearchCapabilities(includeUniversalAnswer: boolean) {
  const coverageState = (
    coverage:
      | "wall"
      | "code_gate"
      | "sentry"
      | "ap"
      | "trace"
      | "universal"
      | "subtype_limited"
      | "special",
    inDeckKnown: boolean,
  ) => ({
    coverage,
    inDeckKnown,
    inHand: false,
    installed: false,
    searchableNow: inDeckKnown,
    drawOnly: false,
    missing: !inDeckKnown,
    bestKnownCards: inDeckKnown ? ["onr_v1_007_blink"] : [],
    blockers: [],
  });
  return {
    runner: {
      breakerInventory: includeUniversalAnswer
        ? [
            {
              cardId: "onr_v1_007_blink",
              title: "Blink",
              coverage: ["universal"],
              risks: [],
              restrictions: [],
              quantityKnownInDeck: 3,
              locations: ["in_deck"],
              confidence: "high",
              evidence: ["test_universal_breaker_in_deck"],
            },
          ]
        : [],
      breakerCoverageMatrix: {
        wall: coverageState("wall", true),
        code_gate: coverageState("code_gate", true),
        sentry: coverageState("sentry", true),
        ap: coverageState("ap", false),
        trace: coverageState("trace", false),
        universal: coverageState("universal", includeUniversalAnswer),
        subtype_limited: coverageState(
          "subtype_limited",
          includeUniversalAnswer,
        ),
        special: coverageState("special", false),
      },
      searchAccess: {
        tools: [
          {
            cardId: "onr_v1_114_temple-microcode-outlet",
            title: "Temple Microcode Outlet",
            status: "in_hand",
            canSearchPrograms: true,
            canSearchBreakers: true,
            legalNow: true,
            confidence: "high",
            evidence: ["test_temple_legal"],
          },
        ],
        canSearchProgramsNow: true,
        canSearchBreakersNow: true,
        evidence: ["test_temple_legal"],
      },
      economyBankTools: [],
    },
  };
}

describe("plan-bound Trace Base-Link continuation", () => {
  it("keeps the exact resolve-choice action inside the resident run executor", () => {
    resetResidentPlanPortfolioMemory();
    const resolveChoice = legalAction(
      "runner.resolve_choice",
      "runner",
      "resolve_choice",
      "Base-Link-Karte fuer Trace nutzen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    resolveChoice.choiceRequirements = [
      {
        choiceId: "trace_1.base_link.70",
        minSelections: 1,
        maxSelections: 1,
        optionIds: ["pass", "trace_base_link_baedeker"],
      },
    ];
    const input = aiInput("runner", [resolveChoice]);
    resolveChoice.expiresAtStateVersion = 70;
    resolveChoice.timingPoint = "run.encounter_ice";
    input.playerView.stateVersion = 70;
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.run = {
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
      successful: false,
    };
    input.playerView.trace = {
      traceId: "trace_1",
      sourceDefinitionId: "onr_v1_251_jack-attack",
      profile: "modern_open",
      phase: "base_link",
      printedTrace: 5,
      effectiveTraceLimit: 5,
      bidsRevealed: true,
      corpBidCommitted: true,
      runnerBidCommitted: false,
      visibleOpponentBidCapacity: 4,
      corpBid: 0,
      corpStrength: 5,
      runnerLink: 0,
    };
    input.playerView.own.credits = 3;
    input.playerView.own.rig = [
      visibleCard("baedeker", "runner", "program", {
        definitionId: "onr_v1_003_baedekers-net-map",
        title: "Baedeker's Net Map",
        baseLink: 1,
      }),
    ];
    input.playerView.own.runnerTraceSupportQuote = {
      traceCreditPool: 0,
      traceCreditSources: [],
      baseLinkOptions: [
        { baseLink: 0, activationCost: 0, safeForAccess: true },
        {
          baseLink: 1,
          activationCost: 0,
          safeForAccess: true,
          sourceDefinitionId: "onr_v1_003_baedekers-net-map",
          sourceTitle: "Baedeker's Net Map",
        },
      ],
      postBidLinkOptions: [],
      traceSuccessCancelOptions: [],
    };
    input.playerView.pendingChoice = {
      choiceId: "trace_1.base_link.70",
      side: "runner",
      source: "trace_base_link:trace_1",
      prompt: "Base-Link-Karte fuer Trace nutzen",
      kind: "select_option",
      options: [
        { id: "pass", label: "Keine Base-Link-Karte nutzen" },
        {
          id: "trace_base_link_baedeker",
          label: "Baedeker's Net Map: Base Link 1",
          value: "baedeker",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 70,
      visibility: "public",
    };
    const priorInput = structuredClone(input);
    priorInput.playerView.stateVersion = 69;
    delete priorInput.playerView.pendingChoice;
    priorInput.legalActions = [];
    priorInput.playerView.legalActions = [];
    const runPlanInstanceId = "plan:runner.contest_remote:remote_1";
    rememberResidentPlanPortfolio(priorInput, {
      schemaVersion: "resident-plan-portfolio-v2",
      side: "runner",
      stateVersion: 69,
      rootForegroundInstanceId: runPlanInstanceId,
      executorInstanceId: runPlanInstanceId,
      instances: [
        {
          instanceId: runPlanInstanceId,
          side: "runner",
          moduleId: "runner.contest_remote",
          executionState: "executor",
          target: { kind: "server", id: "remote_1" },
          moduleState: {
            kind: "remote_contest",
            signal: { serverId: "remote_1" },
          },
        },
      ],
      completionHistory: [],
      transitions: [],
    } as never);

    expect(
      liveContext({
        selectedChoicesForDecision: (
          decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
          selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
          portfolio: Parameters<typeof selectedChoicesForDecision>[3],
        ) =>
          selectedChoicesForDecision(
            decisionInput,
            selectedAction,
            {
              evaluateCorpOpeningHand: () => ({ decision: "keep" }),
              evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
              discardKeepScore: () => ({ total: 0 }),
              selectedRunnerProgramInstallTrashOptionIds: () => [],
              selectedRunnerForcedProgramTrashOptionIds: () => [],
              selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
              extractAiFeatures: () => ({
                credits: 0,
                memoryRemaining: 4,
                hasInstalledNonNoisyIcebreaker: false,
                rigRoles: new Set(),
                rigDefinitionIds: new Set(),
              }),
              rolesForCardId: () => [],
              effectsForCardId: () => [],
            },
            portfolio,
          ),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: resolveChoice.actionId,
      reasonCode: "plan_first.runner.contest_remote",
      selectedChoices: {
        choiceId: "trace_1.base_link.70",
        selectedOptionIds: ["trace_base_link_baedeker"],
      },
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          leafExecutorInstanceId: runPlanInstanceId,
          executionOrigin: {
            leafPlanInstanceId: runPlanInstanceId,
          },
        },
      },
    });
  });
});

describe("plan-bound Trace success-cancel continuation", () => {
  it("keeps the exact success-cancel choice inside the resident run executor", () => {
    resetResidentPlanPortfolioMemory();
    const resolveChoice = legalAction(
      "runner.resolve_choice",
      "runner",
      "resolve_choice",
      "Trace-Erfolgseffekt canceln",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    resolveChoice.choiceRequirements = [
      {
        choiceId: "trace_1.success_cancel.71",
        minSelections: 1,
        maxSelections: 1,
        optionIds: ["pass", "trace_success_cancel_back_door"],
      },
    ];
    const input = aiInput("runner", [resolveChoice]);
    resolveChoice.expiresAtStateVersion = 71;
    resolveChoice.timingPoint = "run.encounter_ice";
    input.playerView.stateVersion = 71;
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      successful: false,
    };
    input.playerView.trace = {
      traceId: "trace_1",
      sourceDefinitionId: "onr_v1_236_data-raven",
      profile: "modern_open",
      phase: "trace_success_cancel",
      printedTrace: 5,
      effectiveTraceLimit: 5,
      bidsRevealed: true,
      corpBidCommitted: true,
      runnerBidCommitted: true,
      visibleOpponentBidCapacity: 6,
      corpBid: 0,
      corpStrength: 5,
      runnerLink: 0,
      runnerBid: 0,
      runnerStrength: 0,
      postRevealLinkBonus: 0,
    };
    input.playerView.own.credits = 3;
    input.playerView.own.rig = [
      visibleCard("back-door", "runner", "resource", {
        definitionId: "onr_proteus_129_back-door-to-netwatch",
        title: "Back Door to Netwatch",
      }),
    ];
    input.playerView.own.runnerTraceSupportQuote = {
      traceCreditPool: 0,
      traceCreditSources: [],
      baseLinkOptions: [
        { baseLink: 0, activationCost: 0, safeForAccess: true },
      ],
      postBidLinkOptions: [],
      traceSuccessCancelOptions: [
        {
          sourceCardInstanceId: "back-door",
          sourceDefinitionId: "onr_proteus_129_back-door-to-netwatch",
          sourceTitle: "Back Door to Netwatch",
          activationCost: 3,
          tapSource: false,
          trashSource: true,
        },
      ],
    };
    input.playerView.pendingChoice = {
      choiceId: "trace_1.success_cancel.71",
      side: "runner",
      source: "trace_success_cancel:trace_1",
      prompt: "Trace-Erfolgseffekt canceln",
      kind: "select_option",
      options: [
        { id: "pass", label: "Trace-Effekt nicht canceln" },
        {
          id: "trace_success_cancel_back_door",
          label: "Back Door to Netwatch: Trace-Effekt canceln",
          value: "back-door",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 71,
      visibility: "hidden_info_barrier",
    };
    const priorInput = structuredClone(input);
    priorInput.playerView.stateVersion = 70;
    delete priorInput.playerView.pendingChoice;
    priorInput.legalActions = [];
    priorInput.playerView.legalActions = [];
    const runPlanInstanceId = "plan:runner.pressure_central:rd";
    rememberResidentPlanPortfolio(priorInput, {
      schemaVersion: "resident-plan-portfolio-v2",
      side: "runner",
      stateVersion: 70,
      rootForegroundInstanceId: runPlanInstanceId,
      executorInstanceId: runPlanInstanceId,
      instances: [
        {
          instanceId: runPlanInstanceId,
          side: "runner",
          moduleId: "runner.pressure_central",
          executionState: "executor",
          target: { kind: "server", id: "rd" },
          moduleState: {
            kind: "central_pressure",
            signal: { serverId: "rd" },
          },
        },
      ],
      completionHistory: [],
      transitions: [],
    } as never);

    expect(
      liveContext({
        selectedChoicesForDecision: (
          decisionInput: Parameters<typeof selectedChoicesForDecision>[0],
          selectedAction: Parameters<typeof selectedChoicesForDecision>[1],
          portfolio: Parameters<typeof selectedChoicesForDecision>[3],
        ) =>
          selectedChoicesForDecision(
            decisionInput,
            selectedAction,
            {
              evaluateCorpOpeningHand: () => ({ decision: "keep" }),
              evaluateRunnerOpeningHand: () => ({ decision: "keep" }),
              discardKeepScore: () => ({ total: 0 }),
              selectedRunnerProgramInstallTrashOptionIds: () => [],
              selectedRunnerForcedProgramTrashOptionIds: () => [],
              selectedRunnerMemoryCheckpointTrashOptionIds: () => [],
              extractAiFeatures: () => ({
                credits: 0,
                memoryRemaining: 4,
                hasInstalledNonNoisyIcebreaker: false,
                rigRoles: new Set(),
                rigDefinitionIds: new Set(),
              }),
              rolesForCardId: () => [],
              effectsForCardId: () => [],
            },
            portfolio,
          ),
      }).chooseSemanticRuntimeAction(input, {}),
    ).toMatchObject({
      actionId: resolveChoice.actionId,
      reasonCode: "plan_first.runner.pressure_central",
      selectedChoices: {
        choiceId: "trace_1.success_cancel.71",
        selectedOptionIds: ["trace_success_cancel_back_door"],
      },
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: runPlanInstanceId,
          leafExecutorInstanceId: runPlanInstanceId,
          executionOrigin: {
            rootPlanInstanceId: runPlanInstanceId,
            leafPlanInstanceId: runPlanInstanceId,
          },
        },
      },
    });
  });
});

function liveContext(overrides: Record<string, unknown> = {}) {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      creditReservePolicy: {
        phase: "opening",
        contestReserve: 0,
      },
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    runnerProgramInstallTrashAssessmentForAction: () => undefined,
    runnerProgramInstallTrashAssessmentForCard: () => ({
      memoryRequired: false,
      requiredMemoryToFree: 0,
      candidates: [],
      selectedCandidates: [],
      memoryFreedBySelectedCandidates: 0,
      canFreeRequiredMemory: true,
      evidence: [],
    }),
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
}

function liveContextWithTurnPlanQuote(input: AiDecisionInput) {
  input.matchId ??= "plan-first-live-runtime-test-match";
  const context = liveContext();
  const quoteRandomizedTurnPlanSelection = (
    request: EngineRandomizedTurnPlanSelectionRequest,
  ): EngineRandomizedTurnPlanSelectionQuoteResult => ({
    ok: true,
    quote: {
      schemaVersion: ENGINE_RANDOMIZED_TURN_PLAN_SELECTION_SCHEMA_VERSION,
      visibility: "private_to_actor",
      complete: true,
      matchId: request.matchId,
      side: request.side,
      stateVersion: request.stateVersion,
      timingPoint: request.timingPoint,
      opportunityKey: request.opportunityKey,
      candidates: structuredClone(request.candidates),
      candidateFingerprint: `test:${request.opportunityKey}`,
      legalActions: request.candidates.flatMap((candidate) => {
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return action ? [structuredClone(action)] : [];
      }),
    },
  });
  return {
    chooseSemanticRuntimeAction: (
      decisionInput: AiDecisionInput,
      options: Parameters<typeof context.chooseSemanticRuntimeAction>[1],
    ) =>
      context.chooseSemanticRuntimeAction(decisionInput, {
        ...options,
        quoteRandomizedTurnPlanSelection,
      }),
  };
}

function pacificaOverflowInstall(
  actionId: string,
  cardId: string,
  serverId: string,
) {
  return legalAction(
    actionId,
    "corp",
    "install_card",
    `Install Pacifica Regional AI in ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: cardId,
      payload: {
        cardId,
        serverId,
        placement: "root",
      },
    },
  );
}

function pacificaCard(instanceId: string) {
  return visibleCard(instanceId, "corp", "asset", {
    definitionId: "onr_v1_334_pacifica-regional-ai",
    title: "Pacifica Regional AI",
  });
}

function corpOverflowFillers(count: number) {
  return Array.from({ length: count }, (_, index) =>
    visibleCard(`overflow-filler-${index}`, "corp", "operation", {
      definitionId: "onr_v1_284_chance-observation",
    }),
  );
}

function hqOverflowReceipt(
  portfolio: ReturnType<typeof residentPlanPortfolioSnapshot>,
): Record<string, unknown> | undefined {
  const overflow = portfolio?.instances.find(
    (instance) =>
      instance.moduleId === "corp.hand_and_agenda_management" &&
      instance.dedupeKey === "resolve-hq-overflow:corp:0",
  );
  const state = overflow?.moduleState as
    | {
        signal?: {
          overflowResolutionState?: Record<string, unknown>;
        };
      }
    | undefined;
  return state?.signal?.overflowResolutionState;
}

function valuPakNumericContractFixture(params: {
  temporaryCredits: number;
  installCost: number;
  memoryCost: number;
}) {
  const valuPak = legalAction(
    "valu-pak",
    "runner",
    "play_event",
    "Play Valu-Pak",
    { credits: 0, clicks: 1 },
    {
      source: "valu-pak-card",
      payload: {
        cardId: "valu-pak-card",
        sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
        gainActionsAmount: 5,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "program_install_only",
        actionCapacityAllowedActionType: "install_card",
        actionCapacityAllowedCardType: "program",
        actionCapacityTemporaryCredits: params.temporaryCredits,
        actionCapacityReliability: "guaranteed",
      },
    },
  );
  const install = legalAction(
    "install-program",
    "runner",
    "install_card",
    "Install program",
    { credits: 1, clicks: 1 },
    {
      source: "program-card",
      payload: {
        cardId: "program-card",
        sourceDefinitionId: "onr_v1_007_blink",
      },
    },
  );
  const input = aiInput("runner", [valuPak, install]);
  input.playerView.own.credits = 4;
  input.playerView.own.memoryLimit = 4;
  input.playerView.own.memoryUsed = 0;
  input.playerView.own.gripOrHq = [
    visibleCard("valu-pak-card", "runner", "event", {
      definitionId: "onr_v1_117_valu-pak-software-bundle",
    }),
    visibleCard("program-card", "runner", "program", {
      definitionId: "onr_v1_007_blink",
    }),
  ];
  return {
    input,
    evaluations: [
      handEvaluation({
        cardInstanceId: "valu-pak-card",
        definitionId: "onr_v1_117_valu-pak-software-bundle",
        legalActionId: "valu-pak",
        priority: 970,
      }),
      handEvaluation({
        cardInstanceId: "program-card",
        definitionId: "onr_v1_007_blink",
        legalActionId: "install-program",
        priority: 1_000,
        duplicateRole: "none",
        finalInstallFit: 400,
        cardType: "program",
        installCost: params.installCost,
        memoryCost: params.memoryCost,
        currentNeed: "acute",
        strategicFit: "strong",
      }),
    ],
  };
}

function activeRestrictedValuPakInput() {
  const restrictedPayload = {
    actionCapacityRestriction: "program_install_only",
    actionCapacityAllowedActionType: "install_card",
    actionCapacityAllowedCardType: "program",
    actionCapacityReliability: "guaranteed",
    actionCapacityExpiresAt: "side_turn_end",
    restrictedActionGrantActionType: "install_card",
    restrictedActionGrantCostProfile: "temporary_credit_bundle",
    restrictedActionGrantRemainingActions: 5,
  };
  const install = legalAction(
    "restricted-install-program-b",
    "runner",
    "install_card",
    "Install program B",
    { credits: 1, clicks: 1 },
    {
      source: "program-b",
      payload: {
        ...restrictedPayload,
        cardId: "program-b",
        sourceDefinitionId: "onr_v1_007_blink",
      },
    },
  );
  const stop = legalAction(
    "stop-valu-pak-b",
    "runner",
    "stop_restricted_action_sequence",
    "Stop Valu-Pak sequence B",
    { credits: 0, clicks: 0 },
    { source: "game_rule", payload: restrictedPayload },
  );
  const input = aiInput("runner", [install, stop]);
  input.playerView.stateVersion = 5;
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 5;
  input.playerView.own.memoryLimit = 4;
  input.playerView.own.memoryUsed = 1;
  input.playerView.own.rig = [
    visibleCard("program-a", "runner", "program", {
      definitionId: "onr_v1_045_newsgroup-filter",
    }),
  ];
  input.playerView.own.gripOrHq = [
    visibleCard("program-b", "runner", "program", {
      definitionId: "onr_v1_007_blink",
    }),
  ];
  return input;
}

function restrictedSequenceCommitment(
  sourceCardInstanceId: string,
  targetCardInstanceId: string,
  plannedAtStateVersion: number,
): RunnerRestrictedProgramInstallSequenceCommitment {
  const targetDefinitionId =
    targetCardInstanceId === "program-a"
      ? "onr_v1_045_newsgroup-filter"
      : "onr_v1_007_blink";
  return {
    kind: "restricted_program_install_sequence",
    sourceActionId: `open-${sourceCardInstanceId}`,
    sourceCardInstanceId,
    sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
    plannedAtStateVersion,
    runnerCreditsBeforeOpening: 5,
    grantedActionCount: 5,
    temporaryInstallCredits: 1,
    minimumCreditFloor: 0,
    minimumHandBuffer: 0,
    ordinaryClicksAfterOpening: 4,
    targetSteps: [
      {
        order: 0,
        cardInstanceId: targetCardInstanceId,
        definitionId: targetDefinitionId,
        installCost: 1,
        memoryCost: 1,
        projectedRunnerCreditsAfter: 5,
        projectedMemoryAvailableAfter: 3,
        projectedGripCountAfter: 0,
        purposeCode: `install_committed_program:${targetDefinitionId}`,
        evidenceCode: `restricted_program_target:${targetCardInstanceId}`,
      },
    ],
    admissionReason: "acute_temporary_credit_bridge",
    evidenceCodes: [`restricted_program_source:${sourceCardInstanceId}`],
  };
}

function restrictedSequencePlanInstance(
  commitment: RunnerRestrictedProgramInstallSequenceCommitment,
  phase:
    | "open_restricted_sequence"
    | "execute_restricted_sequence"
    | "complete_restricted_sequence",
  stateVersion: number,
  active: boolean,
): PlanInstance {
  const developmentId = `card:${commitment.sourceCardInstanceId}`;
  const instance = instantiatePlanProposal(
    {
      moduleId: "runner.develop_board_and_hand",
      moduleVersion: "1",
      dedupeKey: developmentId,
      side: "runner",
      strategyLineIds: [],
      executionClass: "bounded_sequence",
      initialViability: active ? "ready" : "dormant",
      persistencePolicy: "locked_sequence",
      retentionPolicy: {
        blockedStateVersionTtl: 3,
        dormantStateVersionTtl: 4,
        completedHistoryStateVersionTtl: 4,
        abandonWhenTargetMissing: false,
        protectedWhileNeedOpen: true,
        protectedWhileCommitted: true,
      },
      target: {
        kind: "capability",
        id: "restricted_program_install_sequence",
      },
      phase,
      milestone: "admitted",
      moduleState: {
        kind: "development",
        signal: {
          developmentId,
          definitionId: commitment.sourceDefinitionId,
          targetKind: "capability",
          phase,
          purposeCode: "execute_committed_program_install_sequence",
          assignedDomainPlanIds: [],
          duplicateAlreadyInstalled: false,
          affordableOrSupportable: true,
          semanticActionTypes: ["install.card"],
          actionIds: [],
          priorityClass: "P3",
          value: 1_000,
          evidenceCode: "restricted_program_sequence",
          restrictedProgramInstallCommitment: commitment,
        },
      },
      blockers: [],
      resumeConditions: [{ code: "route_becomes_available" }],
      completionConditions: [{ code: "sequence_completed" }],
      abandonmentConditions: [{ code: "commitment_invalidated" }],
      evidenceRefs: [
        {
          code: "restricted_program_sequence",
          source: "visible_state",
        },
      ],
    },
    stateVersion,
  );
  if (active) {
    instance.executionState = "executor";
    instance.portfolioRole = "foreground";
  }
  return instance;
}

function handEvaluation(params: {
  cardInstanceId: string;
  definitionId: string;
  legalActionId: string;
  priority: number;
  deferReason?:
    | "none"
    | "duplicate"
    | "missing_credits"
    | "preserve_credit_floor"
    | "stronger_override";
  duplicateRole?: "none" | "useful_backup" | "redundant_duplicate";
  finalInstallFit?: number;
  cardType?: "program" | "resource" | "hardware";
  installCost?: number;
  memoryCost?: number;
  creditsAfterInstall?: number;
  availability?: "legal_now" | "missing_credits";
  missingCredits?: number;
  targetCredits?: number;
  fundingReason?:
    | "cannot_pay"
    | "would_break_floor"
    | "would_break_run_reserve";
  currentNeed?: "acute" | "useful_now" | "setup" | "later" | "none";
  developmentRole?: RunnerHandDevelopmentRole;
  strategicFit?: "strong" | "medium" | "weak" | "blocked";
}): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: "runner-hand-development-evaluation-v4" as const,
    cardInstanceId: params.cardInstanceId,
    definitionId: params.definitionId,
    ...(params.cardType !== undefined ? { cardType: params.cardType } : {}),
    availability: params.availability ?? "legal_now",
    developmentRole: params.developmentRole ?? "economy_engine",
    strategicFit: params.strategicFit ?? "weak",
    currentNeed: params.currentNeed ?? "useful_now",
    activationPrerequisites: [],
    priority: params.priority,
    deferReason: params.deferReason ?? "none",
    legalActionId: params.legalActionId,
    ...(params.missingCredits !== undefined
      ? {
          fundingNeed: {
            installOrPlayCost: params.installCost ?? 0,
            targetCredits: params.targetCredits ?? params.installCost ?? 0,
            missingCredits: params.missingCredits,
            reason: params.fundingReason ?? ("cannot_pay" as const),
          },
        }
      : {}),
    ...(params.duplicateRole
      ? {
          persistentInstallEvaluation: {
            schemaVersion: "runner-persistent-install-evaluation-v3" as const,
            actionId: params.legalActionId,
            cardId: params.cardInstanceId,
            cardType: params.cardType ?? "program",
            installCost: params.installCost ?? 0,
            creditsAfterInstall: params.creditsAfterInstall ?? 0,
            handAfterInstall: 1,
            memoryCost: params.memoryCost ?? 0,
            installedSameDefinitionCount: 0,
            installedSameFunctionalGroupCount: 0,
            engineAssessment: {
              kind: "none",
              readiness: "not_applicable",
              outputCapabilities: [],
              repeatable: false,
              consumptionBlockers: [],
              deckCompatible: false,
              alreadySatisfied: false,
              evidence: [],
            },
            replacementAssessment: {
              status: "not_applicable",
              admitted: true,
              conflictingDefinitionIds: [],
              unassessedDefinitionIds: [],
              gainedFunctionalCoverage: [],
              lostFunctionalCoverage: [],
              evidence: [],
            },
            existingFunctionalCoverage: [],
            newFunctionalCoverage: [],
            capabilityDelta: "new_coverage",
            stackabilityClass: "unknown",
            duplicateRole: params.duplicateRole,
            marginalUtilityScore: 0,
            opportunityPenalty: 0,
            reservePenalty: 0,
            handBufferPenalty: 0,
            muPressurePenalty: 0,
            displacementPenalty: 0,
            finalInstallFit: params.finalInstallFit ?? 0,
            evidence: [],
          },
        }
      : {}),
    evidence: [],
  };
}

function protectedEngineHandEvaluation(
  currentCredits: number,
  legalActionId: string,
) {
  const fundingGap = Math.max(0, 12 - currentCredits);
  return handEvaluation({
    cardInstanceId: "saloon-engine-card",
    definitionId: "onr_v1_179_silicon-saloon-franchise",
    legalActionId,
    priority: 900,
    developmentRole: "economy_engine",
    strategicFit: "strong",
    currentNeed: "useful_now",
    cardType: "resource",
    installCost: 8,
    creditsAfterInstall: currentCredits - 8,
    duplicateRole: "none",
    finalInstallFit: 530,
    availability: "legal_now",
    deferReason: fundingGap > 0 ? "preserve_credit_floor" : "none",
    ...(fundingGap > 0
      ? {
          missingCredits: fundingGap,
          targetCredits: 12,
          fundingReason: "would_break_floor" as const,
        }
      : {}),
  });
}

function runTargetEvaluation(params: {
  actionId: string;
  targetServerId: "hq" | "rd" | "archives";
  knownAccessState?: "known_no_current_payoff" | "known_payoff";
  recommendation?: "run_now" | "gain_credits_first";
  score: number;
}): RunnerRunTargetEvaluation {
  return {
    schemaVersion: "runner-run-target-evaluation-v1" as const,
    targetServerId: params.targetServerId,
    targetKind: params.targetServerId,
    accessServerId: params.targetServerId,
    accessTargetKind: params.targetServerId,
    actionId: params.actionId,
    accessPayoff: "agenda",
    knownAccessState: params.knownAccessState ?? "known_payoff",
    multiaccessAvailable: true,
    pathPassability: "reachable",
    pathCost: 0,
    creditsAfterRun: 5,
    runCommitment: "full_path",
    fundingNeed: {
      reason: "none",
      routeFundingGap: 0,
      postRunFloorGap: 0,
      protectedLiquidReserve: 0,
    },
    stealOrTrashAffordable: true,
    installedRunPayoff: {
      immediateAccessValue: 0,
      futureSetupValue: 0,
      purgeTaxValue: 0,
      economyValue: 0,
      riskPenalty: 0,
      scoreBonus: 0,
      multiaccessAvailable: true,
      evidence: [],
    },
    runActionPayoff: {
      immediateAccessValue: 0,
      futureSetupValue: 0,
      purgeTaxValue: 0,
      economyValue: 0,
      riskPenalty: 0,
      scoreBonus: 0,
      multiaccessAvailable: true,
      evidence: [],
    },
    runActionProjection: {
      actionId: params.actionId,
      actionType: "start_run",
      sourceKind: "basic_action",
      targetServerId: params.targetServerId,
      targetKind: params.targetServerId,
      accessServerId: params.targetServerId,
      structure: "direct_start_run",
      accessPayoffSignals: [],
      constraintSignals: [],
      riskSignals: [],
      noNoisyBreakers: false,
      bypassFirstIce: false,
      projectionStatus: "concrete_target",
      evidence: [],
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: params.recommendation ?? "run_now",
    score: params.score,
    evidence: ["test_run_target"],
  };
}
