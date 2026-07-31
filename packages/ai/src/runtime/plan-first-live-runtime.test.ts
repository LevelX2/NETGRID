import { describe, expect, it, vi } from "vitest";
import {
  CARD_DEFINITIONS_BY_ID,
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
} from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildRunnerEconomyPosture } from "../runner-economy-posture";
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
import type { RunnerRestrictedProgramInstallSequenceCommitment } from "../plans/runner-tactical-plan-modules";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { runnerCentralPressureHasExecutableEventRun } from "./plan-first-live-runtime";
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

describe("authoritative plan-first live runtime", () => {
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
        visibleCard("hq-wall", "corp", "ice", {
          definitionId: "onr_v1_232_crystal-wall",
          title: "Crystal Wall",
          rezzed: true,
          subtypes: ["wall"],
          strength: 3,
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
      "plan_assessment_evidence:runner_engine_certified_basic_liquidity_development",
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
          { cardId: "onr_v1_047_pile-driver", quantity: 1 },
        ],
      },
    });
    const decision = liveContext({
      runnerStrategicIntentForInput: () => ({
        primaryWinIntent: "runner.access_agendas",
        setupEngine: ["runner.search_breaker_setup"],
      }),
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

  it("leaves a deferred Broker install exclusively with the credit-bank plan", () => {
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
    input.playerView.own.credits = 10;
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
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
  });

  it("keeps a deferred bank install variant with the credit-bank owner only", () => {
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

  it("binds an admitted Broker cashout to the exact same-turn development plan", () => {
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
      reasonCode: "plan_first.runner.develop_board_and_hand",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
        planId: expect.stringContaining(
          "runner.develop_board_and_hand:card%3Atarget-program",
        ),
        planFirstDecision: {
          schemaVersion: "ai-plan-first-decision-debug-v1",
          selectionAuthority: "turn_plan_commitment",
          rootPlanInstanceId: expect.stringContaining(
            "runner.develop_board_and_hand:card%3Atarget-program",
          ),
          leafExecutorInstanceId: expect.stringContaining(
            "runner.develop_board_and_hand:card%3Atarget-program",
          ),
          selectedPlan: {
            moduleId: "runner.develop_board_and_hand",
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
            items: expect.arrayContaining(["capability:fund_onr_v1_007_blink"]),
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

  it("does not rematerialize a rejected Broker cashout through incremental coverage funding", () => {
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
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
    });
    expect(decision.actionId).not.toBe(cash.actionId);
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

  it("extends Corp liquidity only through finite remaining normal actions", () => {
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
    ).toContain('"targetCredits":8');

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

  it("keeps agendas, ICE, score conversions and new remotes out of the HQ-overflow parent", () => {
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
    const state = overflow?.moduleState as
      | {
          signal?: {
            actionIds?: unknown;
          };
        }
      | undefined;
    expect(state?.signal?.actionIds).toEqual([installExisting.actionId]);
    expect(state?.signal?.actionIds).not.toContain(teamRestructuring.actionId);
    expect(state?.signal?.actionIds).not.toContain(installIceArchives.actionId);
    expect(state?.signal?.actionIds).not.toContain(installIceRemote.actionId);
    expect(decision).toMatchObject({
      actionId: installIceRemote.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
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

  it("develops a reviewed finite economy campaign from the visible card state", () => {
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

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "install-bbs",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
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

  it("keeps an advance with missing cost semantics unknown while another owner acts", () => {
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

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installEconomy.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      residentPlanPortfolioSnapshot(input)?.instances.find(
        (instance) => instance.moduleId === "corp.score_agenda",
      ),
    ).toMatchObject({
      viability: "blocked",
    });
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

  it("keeps a fully quoted current advance executable while later score protection remains open", () => {
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
      actionId: "advance-coup",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const scorePortfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));
    expect(scorePortfolio).toContain('"protectionNeed"');
    expect(scorePortfolio).toContain('"fundedProtection":false');
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
    const protectionDecision = liveContext().chooseSemanticRuntimeAction(
      input,
      {},
    );
    expect(protectionDecision).toMatchObject({
      actionId: "install-ice",
      reasonCode: "plan_first.corp.defend_servers",
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
      liveContext().chooseSemanticRuntimeAction(protectedInput, {}),
    ).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(protectedInput)),
    ).not.toContain("missing_action_semantics");
  });

  it("continues an unknown score-protection assessment with a near-term-fundable additional ICE layer", () => {
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
        "plan_assessment_evidence:score_protection_staging_install:agenda:agenda-staged:remote_1:remote_1:bounded_deterrence",
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

  it("varies one qualified opening rush by seed without rerolling the opportunity", () => {
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
    const accepted = openingInput("opening-seed-0");
    const acceptedDecision = liveContext().chooseSemanticRuntimeAction(
      accepted,
      {},
    );
    expect(acceptedDecision).toMatchObject({
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    expect(
      acceptedDecision.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      mode: "cutover",
      coverage: {
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      },
      agendaComparison: {
        opportunityKey: "opening-rush:2:agenda-1:remote_1",
        selectionReason: "best_expected_value",
        randomizationEligible: false,
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
        liveActionId: "install-agenda",
      },
    });
    const acceptedPortfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(accepted),
    );
    expect(acceptedPortfolio).toContain('"admission":"accepted"');
    expect(acceptedPortfolio).toContain(
      '"opportunityKey":"opening-rush:2:agenda-1:remote_1"',
    );

    resetResidentPlanPortfolioMemory();
    const declined = openingInput("opening-seed-1");
    const declinedDecision = liveContext().chooseSemanticRuntimeAction(
      declined,
      {},
    );
    expect(declinedDecision).toMatchObject({
      actionId: "accounts",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(
      declinedDecision.decisionDebug?.planFirstDecision?.turnPlanning,
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
    expect(JSON.stringify(residentPlanPortfolioSnapshot(declined))).toContain(
      '"admission":"declined"',
    );

    const revalidated = structuredClone(accepted);
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
      actionId: "install-agenda",
      reasonCode: "plan_first.corp.score_agenda",
    });
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(revalidated)),
    ).toContain('"hashBucket":21');
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
    const input = aiInput("corp", [
      installAgendaNew,
      installAgendaExisting,
      installIceNew,
      installIceExisting,
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
    const defenseDecision = liveContext().chooseSemanticRuntimeAction(
      input,
      {},
    );
    expect(defenseDecision).toMatchObject({
      actionId: "install-ice-existing",
      reasonCode: "plan_first.corp.defend_servers",
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
    const executableSiblingDecision = liveContext().chooseSemanticRuntimeAction(
      blockedPreparedInput,
      {},
    );
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
    const input = aiInput("corp", [installTerminal, installP4, credit]);
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
    expect(portfolio).toContain(
      '"evidenceCode":"corp_score_protection_funding_gap:remote_1:',
    );
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
      "plan_assessment_evidence:runner_loan_from_chiba_leave_unpayable_without_action_capacity",
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
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_loan_from_chiba_exact_funding_route_unavailable",
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
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_loan_from_chiba_leave_payment_quote_unknown",
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

  it("retains a payable Loan and rejects its lifecycle EndTurn while clicks remain", () => {
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
      "plan_portfolio_blocked_evidence:plan:runner.resource_lifecycle:onr_v1_168_loan-from-chiba%3Aloan-1:runner_loan_from_chiba_leave_deferred_until_capacity_spent",
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
    ).toThrowError("end_turn_with_usable_capacity");
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

  it("uses finite P6 reserve and current-turn liquidity plans without an unbounded cross-turn loop", () => {
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
    const continued = liveContext().chooseSemanticRuntimeAction(
      reserveSatisfied,
      {},
    );
    expect(continued).toMatchObject({
      actionId: credit.actionId,
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          priority: {
            effectiveClass: "P6",
            p6Contract: "temporary_bounded_liquidity_transition",
          },
          route: { actionId: credit.actionId },
        },
      },
    });
    expect(continued.evidence ?? []).toContain(
      "plan_assessment_evidence:runner_engine_certified_basic_liquidity_development",
    );
    expect(
      JSON.stringify(residentPlanPortfolioSnapshot(reserveSatisfied)),
    ).toContain('"kind":"develop_liquidity"');
  });

  it("does not end the turn with clicks remaining after install routes are rejected", () => {
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

    expect(() =>
      liveContext({
        evaluateRunnerHandDevelopment: () => [deferred],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("end_turn_with_usable_capacity");
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

  it("does not alias Basic Credit into a recurring-economy P4 hold step", () => {
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
      reasonCode: "plan_first.runner.economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.economy",
      },
    });
  });

  it("binds a recurring-economy hold only to the installed source's own economy action", () => {
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
      reasonCode: "plan_first.runner.recurring_economy",
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.recurring_economy",
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

  it("does not end the turn with clicks remaining when a run has no known payoff", () => {
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

    expect(() =>
      liveContext({
        evaluateRunnerRunTargets: () => [noPayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("end_turn_with_usable_capacity");
  });

  it("does not end the turn with clicks remaining when a run has negative payoff", () => {
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

    expect(() =>
      liveContext({
        evaluateRunnerRunTargets: () => [negativePayoff],
      }).chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("end_turn_with_usable_capacity");
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
          developmentRole: "tempo_or_disruption",
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
      "plan_assessment_evidence:runner_engine_certified_basic_liquidity_development",
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

  it("admits one 6/7 terminal central probe and reopens it only for a new turn or public knowledge refresh", () => {
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
      score: -40,
    };
    const context = liveContext({
      evaluateRunnerRunTargets: () => [terminalProbe],
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
        },
      },
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "jack-out",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
    });
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
    });
    accessInput.playerView.stateVersion = 2;
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

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "run-archives",
      reasonCode: "plan_first.runner.pressure_central",
      fallbackUsed: false,
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
          rigRoles: new Set(),
          rigDefinitionIds: new Set(),
        }),
        rolesForCardId: (definitionId) =>
          definitionId === "onr_v1_007_blink" ? ["breaker_universal"] : [],
      } as Parameters<typeof selectedChoicesForDecision>[2]),
    ).toEqual({
      choiceId: "temple-search-choice",
      selectedOptionIds: ["choose-blink"],
    });
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
        visibleCard("hq-code-gate", "corp", "ice", {
          rezzed: true,
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
        "plan_priority_class:P2",
        "plan_step_capability:search_answer_breaker_code_gate",
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
          rigRoles: new Set(),
          rigDefinitionIds: new Set(),
        }),
        rolesForCardId: () => ["breaker_universal"],
      } as Parameters<typeof selectedChoicesForDecision>[2]),
    ).toEqual({
      choiceId: "gideon-search-choice",
      selectedOptionIds: ["choose-bound-rent-i-con"],
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
      visibleCard("remote-wall", "corp", "ice", {
        rezzed: true,
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
    ).toThrowError("invalid_support_graph");
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
        visibleCard("ap-ice", "corp", "ice", {
          rezzed: true,
          title: "AP ICE",
          subtypes: ["ap"],
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

    expect(decision).toMatchObject({
      actionId: "search-ap-action",
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
          actionId: "search-ap-action",
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
      source: `p3_37.search_stack_to_grip:${searchToolInstanceId}:${searchToolDefinitionId}:program:private:shuffle:2`,
      prompt: "Choose a program",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: 2,
      visibility: "hidden_info_barrier",
      options: [
        {
          id: "choose-trace",
          label: "Trace Breaker",
          card: visibleCard("trace-option", "runner", "program", {
            definitionId: "trace-breaker-definition",
          }),
        },
        {
          id: "choose-ap",
          label: "AP Breaker",
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
        rigRoles: new Set(),
        rigDefinitionIds: new Set(),
      }),
      rolesForCardId: (definitionId) =>
        definitionId === "ap-breaker-definition"
          ? ["breaker_ap"]
          : definitionId === "trace-breaker-definition"
            ? ["breaker_trace"]
            : [],
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
      source: `p3_37.search_stack_to_grip:${alternateSearchToolInstanceId}:${alternateSearchToolDefinitionId}:program:private:shuffle:2`,
    };
    expect(() =>
      selectedChoicesForDecision(choiceInput, resolve, choiceDependencies),
    ).toThrowError("invalid_support_graph");
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
        visibleCard("ap-ice", "corp", "ice", {
          rezzed: true,
          title: "AP ICE",
          subtypes: ["ap"],
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
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
    ...overrides,
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  return createSemanticRuntimeDecisionContext(dependencies);
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
  currentNeed?: "acute" | "useful_now" | "setup" | "later" | "none";
  developmentRole?:
    | "economy_engine"
    | "breaker_or_rig_piece"
    | "draw_or_search_engine"
    | "run_event"
    | "tempo_or_disruption"
    | "survival_or_damage_prevention"
    | "access_payoff"
    | "unknown";
  strategicFit?: "strong" | "medium" | "weak" | "blocked";
}) {
  return {
    schemaVersion: "runner-hand-development-evaluation-v2",
    cardInstanceId: params.cardInstanceId,
    definitionId: params.definitionId,
    cardType: params.cardType,
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
            missingCredits: params.missingCredits,
            reason: "cannot_pay" as const,
          },
        }
      : {}),
    ...(params.duplicateRole
      ? {
          persistentInstallEvaluation: {
            schemaVersion: "runner-persistent-install-evaluation-v1",
            actionId: params.legalActionId,
            cardId: params.cardInstanceId,
            cardType: params.cardType ?? "program",
            installCost: params.installCost ?? 0,
            creditsAfterInstall: params.creditsAfterInstall ?? 0,
            handAfterInstall: 1,
            memoryCost: params.memoryCost ?? 0,
            installedSameDefinitionCount: 0,
            installedSameFunctionalGroupCount: 0,
            existingFunctionalCoverage: [],
            newFunctionalCoverage: [],
            capabilityDelta: "new_capability",
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

function runTargetEvaluation(params: {
  actionId: string;
  targetServerId: "hq" | "rd" | "archives";
  knownAccessState: "known_no_current_payoff" | "known_payoff";
  score: number;
}) {
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId: params.targetServerId,
    targetKind: "central",
    accessServerId: params.targetServerId,
    accessTargetKind: "central",
    actionId: params.actionId,
    accessPayoff: "agenda_access",
    knownAccessState: params.knownAccessState,
    multiaccessAvailable: true,
    pathPassability: "reachable",
    pathCost: 0,
    creditsAfterRun: 5,
    stealOrTrashAffordable: true,
    installedRunPayoff: "multiaccess",
    runActionPayoff: "access",
    runActionProjection: {
      actionId: params.actionId,
      sourceKind: "basic_action",
      targetServerId: params.targetServerId,
    },
    riskyUniversalCoverage: false,
    scoreThreat: false,
    recommendation: "run_now",
    score: params.score,
    evidence: ["test_run_target"],
  };
}
